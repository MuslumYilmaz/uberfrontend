const BillingEvent = require('../models/BillingEvent');
const CheckoutAttempt = require('../models/CheckoutAttempt');
const PendingEntitlement = require('../models/PendingEntitlement');
const router = require('express').Router();
const { getMongoDiagnostics } = require('../config/mongo');
const User = require('../models/User');
const { createBillingEventStore } = require('../services/billing/billing-events');
const { applyNormalizedLemonSqueezyEventToUser } = require('../services/billing/user-billing-state');
const { normalizeLemonSqueezyEvent } = require('../services/billing/providers/lemonsqueezy');
const {
    SUPPORTED_SCENARIOS,
    buildLemonSqueezySimulationPayload,
} = require('../services/billing/providers/lemonsqueezy-simulator');

const eventStore = createBillingEventStore(BillingEvent);

function clampLimit(rawValue, fallback = 50, max = 200) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.min(Math.floor(value), max);
}

function extractAttemptIdFromPayload(payload) {
    const custom =
        payload?.meta?.custom_data ||
        payload?.meta?.customData ||
        payload?.data?.attributes?.custom_data ||
        payload?.data?.attributes?.customData ||
        payload?.data?.attributes?.custom ||
        payload?.custom_data ||
        payload?.customData ||
        payload?.custom;
    if (!custom || typeof custom !== 'object') return '';
    const candidate =
        custom.fa_checkout_attempt_id ||
        custom.faCheckoutAttemptId ||
        custom.checkout_attempt_id ||
        custom.checkoutAttemptId ||
        custom.attempt_id ||
        custom.attemptId;
    return candidate ? String(candidate).trim() : '';
}

function extractPendingUserIdFromPayload(payload) {
    const custom =
        payload?.meta?.custom_data ||
        payload?.meta?.customData ||
        payload?.data?.attributes?.custom_data ||
        payload?.data?.attributes?.customData ||
        payload?.data?.attributes?.custom ||
        payload?.custom_data ||
        payload?.customData ||
        payload?.custom;
    if (!custom || typeof custom !== 'object') return '';
    const candidate =
        custom.fa_user_id ||
        custom.faUserId ||
        custom.user_id ||
        custom.userId;
    return candidate ? String(candidate).trim() : '';
}

function resolvePendingBindingStatus(item) {
    if (item.provider !== 'lemonsqueezy') {
        return 'email_claimable';
    }
    const bindingUserId = item.userId || extractPendingUserIdFromPayload(item.payload);
    return bindingUserId ? 'exact_user_required' : 'missing_user_binding';
}

function serializeReconciliationAttempt(attempt) {
    return {
        attemptId: attempt.attemptId,
        supportReference: attempt.attemptId,
        userId: attempt.userId ? String(attempt.userId) : null,
        provider: attempt.provider,
        planId: attempt.planId,
        mode: attempt.mode,
        status: attempt.status,
        billingEventId: attempt.billingEventId || null,
        customerEmail: attempt.customerEmail || null,
        customerUserId: attempt.customerUserId || null,
        lastErrorCode: attempt.lastErrorCode || null,
        lastErrorMessage: attempt.lastErrorMessage || null,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
    };
}

function serializeReconciliationPendingEntitlement(item) {
    const attemptId = extractAttemptIdFromPayload(item.payload);
    const bindingUserId = item.userId || extractPendingUserIdFromPayload(item.payload);
    return {
        provider: item.provider,
        eventId: item.eventId,
        supportReference: attemptId || item.eventId,
        attemptId: attemptId || null,
        email: item.email,
        userId: bindingUserId || null,
        bindingStatus: resolvePendingBindingStatus(item),
        scope: item.scope,
        eventType: item.eventType || null,
        entitlementStatus: item.entitlement?.status || 'none',
        orderId: item.orderId || null,
        subscriptionId: item.subscriptionId || null,
        customerId: item.customerId || null,
        receivedAt: item.receivedAt,
    };
}

function serializeReconciliationBillingEvent(event) {
    return {
        provider: event.provider,
        eventId: event.eventId,
        supportReference: event.eventId,
        eventType: event.eventType || null,
        processingStatus: event.processingStatus || null,
        email: event.email || null,
        userId: event.userId ? String(event.userId) : null,
        receivedAt: event.receivedAt,
        processedAt: event.processedAt || null,
    };
}

// GET /api/admin/diagnostics/db
router.get('/diagnostics/db', (_req, res) => {
    try {
        res.json(getMongoDiagnostics());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
    try {
        const users = await User.find().select('-passwordHash').lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
    try {
        const allowed = [
            'username',
            'email',
            'bio',
            'avatarUrl',
            'role',
            'accessTier',
            'prefs',
            'stats',
            'billing',
            'coupons',
            'solvedQuestionIds',
        ];

        const update = {};
        for (const key of allowed) {
            if (key in req.body) update[key] = req.body[key];
        }

        const user = await User.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
            context: 'query',
        }).select('-passwordHash');

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/billing/simulate/lemonsqueezy
router.post('/billing/simulate/lemonsqueezy', async (req, res) => {
    try {
        const userId = String(req.body?.userId || '').trim();
        if (!userId) {
            return res.status(400).json({ error: 'Missing "userId"' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let simulation;
        try {
            simulation = buildLemonSqueezySimulationPayload({ user, input: req.body || {} });
        } catch (err) {
            const statusCode = Number(err?.statusCode) || 400;
            return res.status(statusCode).json({
                error: err.message,
                supportedScenarios: Array.from(SUPPORTED_SCENARIOS),
            });
        }

        const rawBody = JSON.stringify(simulation.payload);
        const normalized = normalizeLemonSqueezyEvent(simulation.payload, rawBody);
        const eventId = `simulate:${simulation.mode}:${normalized.eventId}`;

        await eventStore.recordEvent({
            provider: 'lemonsqueezy',
            eventId,
            eventType: normalized.eventType,
            email: normalized.email || normalized.purchaseEmail || user.email,
            payload: simulation.payload,
            processingStatus: 'received_simulated',
        });

        applyNormalizedLemonSqueezyEventToUser(user, normalized, {
            eventId,
            purchaseEmail: normalized.purchaseEmail,
        });

        await user.save();
        await BillingEvent.updateOne(
            { provider: 'lemonsqueezy', eventId },
            { $set: { processingStatus: 'processed_simulated', processedAt: new Date(), userId: user._id } }
        );

        const safeUser = await User.findById(user._id).select('-passwordHash').lean();
        return res.json({
            ok: true,
            scenario: simulation.scenario,
            eventId,
            normalized: {
                eventType: normalized.eventType,
                entitlement: normalized.entitlement,
                customerId: normalized.customerId || null,
                subscriptionId: normalized.subscriptionId || null,
                manageUrl: normalized.manageUrl || null,
            },
            user: safeUser,
        });
    } catch (err) {
        console.error('[admin] lemonsqueezy simulation failed:', err);
        return res.status(500).json({ error: err.message || 'Simulation failed' });
    }
});

// GET /api/admin/billing/reconciliation
router.get('/billing/reconciliation', async (req, res) => {
    try {
        const limit = clampLimit(req.query?.limit, 50, 200);

        const [checkoutAttempts, pendingEntitlements, unresolvedEvents, totalPendingAttempts, totalPendingEntitlements, totalUnresolvedEvents] =
            await Promise.all([
                CheckoutAttempt.find({
                    status: { $in: ['created', 'webhook_received', 'pending_user_match', 'failed', 'expired'] },
                })
                    .sort({ updatedAt: -1 })
                    .limit(limit)
                    .lean(),
                PendingEntitlement.find({ appliedAt: null })
                    .sort({ receivedAt: -1 })
                    .limit(limit)
                    .lean(),
                BillingEvent.find({
                    processingStatus: { $in: ['received', 'received_unknown_type', 'pending_user'] },
                })
                    .sort({ receivedAt: -1 })
                    .limit(limit)
                    .lean(),
                CheckoutAttempt.countDocuments({
                    status: { $in: ['created', 'webhook_received', 'pending_user_match', 'failed', 'expired'] },
                }),
                PendingEntitlement.countDocuments({ appliedAt: null }),
                BillingEvent.countDocuments({
                    processingStatus: { $in: ['received', 'received_unknown_type', 'pending_user'] },
                }),
            ]);

        return res.json({
            summary: {
                pendingAttempts: totalPendingAttempts,
                pendingEntitlements: totalPendingEntitlements,
                unresolvedEvents: totalUnresolvedEvents,
            },
            checkoutAttempts: checkoutAttempts.map(serializeReconciliationAttempt),
            pendingEntitlements: pendingEntitlements.map(serializeReconciliationPendingEntitlement),
            billingEvents: unresolvedEvents.map(serializeReconciliationBillingEvent),
        });
    } catch (err) {
        console.error('[admin] billing reconciliation failed:', err);
        return res.status(500).json({ error: err.message || 'Billing reconciliation failed' });
    }
});

module.exports = router;
