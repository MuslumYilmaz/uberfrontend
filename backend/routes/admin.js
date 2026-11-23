const BillingEvent = require('../models/BillingEvent');
const CheckoutAttempt = require('../models/CheckoutAttempt');
const PendingEntitlement = require('../models/PendingEntitlement');
const { isUserBoundProvider } = require('../services/billing/pending-entitlements');
const router = require('express').Router();
const { getMongoDiagnostics } = require('../config/mongo');
const User = require('../models/User');
const { createBillingEventStore } = require('../services/billing/billing-events');
const { applyNormalizedProviderEventToUser } = require('../services/billing/user-billing-state');
const { normalizeLemonSqueezyEvent } = require('../services/billing/providers/lemonsqueezy');
const { normalizePolarEvent } = require('../services/billing/providers/polar');
const {
    resolvePolarAccessToken,
    resolvePolarLifetimeProductIds,
    resolvePolarPlanByProductId,
} = require('../services/billing/providers/polar-config');
const { fetchRecentPolarOrders } = require('../services/billing/providers/polar-orders');
const {
    SUPPORTED_SCENARIOS: POLAR_SUPPORTED_SCENARIOS,
    buildPolarSimulationPayload,
} = require('../services/billing/providers/polar-simulator');
const { applyOrderedProviderEvent } = require('../services/billing/ordered-user-event');
const {
    findVerifiedPurchaseEntitlementMismatches,
    findProviderOrderMismatches,
} = require('../services/billing/reconciliation');
const {
    fetchRecentLemonSqueezyOrders,
    resolveLemonSqueezyApiKey,
} = require('../services/billing/providers/lemonsqueezy-orders');
const {
    SUPPORTED_SCENARIOS,
    buildLemonSqueezySimulationPayload,
} = require('../services/billing/providers/lemonsqueezy-simulator');

const eventStore = createBillingEventStore(BillingEvent);

async function completeClaimedEvent(data) {
    const result = await eventStore.completeEvent(data);
    if (!result.completed) {
        const error = new Error('Billing event lease was lost before completion');
        error.code = 'BILLING_EVENT_LEASE_LOST';
        throw error;
    }
}

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
    if (item.provider === 'gumroad') {
        return 'verified_email_required';
    }
    if (!isUserBoundProvider(item.provider)) {
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
        analyticsSurface: attempt.analyticsSurface || attempt.analyticsSource || 'pricing',
        analyticsSource: attempt.analyticsSource || attempt.analyticsSurface || 'pricing',
        analyticsSessionId: attempt.analyticsSessionId || null,
        experimentId: attempt.experimentId || null,
        offerVersion: attempt.offerVersion || 'pricing_baseline_v1',
        campaignId: attempt.campaignId || null,
        providerDiscountId: attempt.providerDiscountId || null,
        checkoutSurface: attempt.checkoutSurface || 'hosted_new_tab',
        status: attempt.status,
        billingEventId: attempt.billingEventId || null,
        customerEmail: attempt.customerEmail || null,
        customerUserId: attempt.customerUserId || null,
        lastErrorCode: attempt.lastErrorCode || null,
        lastErrorMessage: attempt.lastErrorMessage || null,
        providerOpenedAt: attempt.providerOpenedAt || null,
        popupBlockedAt: attempt.popupBlockedAt || null,
        successRedirectedAt: attempt.successRedirectedAt || null,
        cancelRedirectedAt: attempt.cancelRedirectedAt || null,
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
        attemptCount: event.attemptCount || 0,
        lastAttemptAt: event.lastAttemptAt || null,
        leaseExpiresAt: event.leaseExpiresAt || null,
        lastErrorCode: event.lastErrorCode || null,
        lastErrorMessage: event.lastErrorMessage || null,
        lastErrorAt: event.lastErrorAt || null,
    };
}

async function updateCheckoutAttempt(attemptId, updates = {}) {
    const normalizedAttemptId = String(attemptId || '').trim();
    if (!normalizedAttemptId) return;
    const patch = Object.fromEntries(
        Object.entries({ ...updates }).filter(([, value]) => value !== undefined)
    );
    if (!patch.updatedAt) patch.updatedAt = new Date();
    await CheckoutAttempt.updateOne({ attemptId: normalizedAttemptId }, { $set: patch });
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
        const requestBody = req.body && typeof req.body === 'object' ? req.body : {};

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
            if (key in requestBody) update[key] = requestBody[key];
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

// Shared tail of the simulators: claim the simulated event, apply it through
// the same ordered CAS path as a webhook, and mark it processed_simulated.
async function applySimulatedProviderEvent({ provider, user, simulation, normalized, res }) {
    let acquisition = null;
    let acquiredEventId = '';
    try {
        const eventId = `simulate:${simulation.mode}:${normalized.eventId}`;
        acquiredEventId = eventId;
        acquisition = await eventStore.acquireEvent({
            provider,
            eventId,
            eventType: normalized.eventType,
            email: normalized.email || normalized.purchaseEmail || user.email,
            payload: simulation.payload,
        });

        if (!acquisition.acquired) {
            if (acquisition.busy) {
                res.set('Retry-After', String(acquisition.retryAfterSeconds || 5));
            }
            const status = acquisition.busy ? 503 : 200;
            return res.status(status).json({
                ok: !acquisition.busy,
                duplicate: true,
                retryable: !!acquisition.busy,
                eventId,
            });
        }

        const orderedUpdate = await applyOrderedProviderEvent({
            user,
            provider,
            eventId,
            eventOrderKey: acquisition.eventOrderKey,
            mutate: (currentUser) => {
                applyNormalizedProviderEventToUser(currentUser, normalized, {
                    provider,
                    eventId,
                    purchaseEmail: normalized.purchaseEmail,
                    eventReceivedAt: acquisition.event.receivedAt,
                    eventOrderKey: acquisition.eventOrderKey,
                });
            },
        });
        const updatedUser = orderedUpdate.user;
        await updateCheckoutAttempt(normalized.attemptId, {
            status: 'applied',
            billingEventId: eventId,
            providerOrderId: normalized.orderId || undefined,
            providerSubscriptionId: normalized.subscriptionId || undefined,
            completedAt: new Date(),
            customerEmail: updatedUser.email,
            customerUserId: String(updatedUser._id),
            lastErrorCode: null,
            lastErrorMessage: null,
        });
        await completeClaimedEvent({
            provider,
            eventId,
            leaseToken: acquisition.leaseToken,
            processingStatus: orderedUpdate.outcome === 'stale' ? 'processed_stale' : 'processed_simulated',
            userId: updatedUser._id,
        });

        const safeUser = await User.findById(updatedUser._id).select('-passwordHash').lean();
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
        console.error(`[admin] ${provider} simulation failed:`, err);
        if (acquisition?.acquired && acquiredEventId) {
            try {
                await eventStore.failEvent({
                    provider,
                    eventId: acquiredEventId,
                    leaseToken: acquisition.leaseToken,
                    error: err,
                });
            } catch (failErr) {
                console.error('[admin] failed to persist retryable simulation state:', failErr);
            }
        }
        return res.status(500).json({ error: err.message || 'Simulation failed' });
    }
}

async function loadSimulationUser(req, res) {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) {
        res.status(400).json({ error: 'Missing "userId"' });
        return null;
    }
    const user = await User.findById(userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return null;
    }
    return user;
}

// POST /api/admin/billing/simulate/lemonsqueezy
router.post('/billing/simulate/lemonsqueezy', async (req, res) => {
    try {
        const user = await loadSimulationUser(req, res);
        if (!user) return undefined;

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
        return await applySimulatedProviderEvent({ provider: 'lemonsqueezy', user, simulation, normalized, res });
    } catch (err) {
        console.error('[admin] lemonsqueezy simulation failed:', err);
        return res.status(500).json({ error: err.message || 'Simulation failed' });
    }
});

// POST /api/admin/billing/simulate/polar
router.post('/billing/simulate/polar', async (req, res) => {
    try {
        const user = await loadSimulationUser(req, res);
        if (!user) return undefined;

        let simulation;
        try {
            simulation = buildPolarSimulationPayload({ user, input: req.body || {} });
        } catch (err) {
            const statusCode = Number(err?.statusCode) || 400;
            return res.status(statusCode).json({
                error: err.message,
                supportedScenarios: Array.from(POLAR_SUPPORTED_SCENARIOS),
            });
        }

        const rawBody = JSON.stringify(simulation.payload);
        const normalized = normalizePolarEvent(simulation.payload, rawBody, {
            webhookId: simulation.webhookId,
            lifetimeProductIds: resolvePolarLifetimeProductIds(simulation.mode),
            planByProductId: resolvePolarPlanByProductId(simulation.mode),
        });
        return await applySimulatedProviderEvent({ provider: 'polar', user, simulation, normalized, res });
    } catch (err) {
        console.error('[admin] polar simulation failed:', err);
        return res.status(500).json({ error: err.message || 'Simulation failed' });
    }
});

// GET /api/admin/billing/reconciliation
router.get('/billing/reconciliation', async (req, res) => {
    try {
        const limit = clampLimit(req.query?.limit, 50, 200);
        const mode = req.query?.mode === 'test' ? 'test' : 'live';
        const includeProviderOrders = req.query?.includeProviderOrders === 'true';
        // The provider whose orders are reconciled: the one asked for, else the
        // configured checkout provider, else Lemon Squeezy.
        const requestedProvider = String(req.query?.provider || process.env.BILLING_PROVIDER || '').trim().toLowerCase();
        const orderProvider = requestedProvider === 'polar' ? 'polar' : 'lemonsqueezy';
        const providerApiKey = resolveLemonSqueezyApiKey(mode);
        const polarAccessToken = resolvePolarAccessToken(mode);
        const providerOrdersConfigured = orderProvider === 'polar'
            ? Boolean(polarAccessToken)
            : Boolean(providerApiKey && String(process.env.LEMONSQUEEZY_STORE_ID || '').trim());
        if (includeProviderOrders && !providerOrdersConfigured) {
            return res.status(409).json({
                error: `${orderProvider === 'polar' ? 'Polar' : 'LemonSqueezy'} order reconciliation is not configured`,
                code: `${orderProvider === 'polar' ? 'POLAR' : 'LEMONSQUEEZY'}_RECONCILIATION_NOT_CONFIGURED`,
            });
        }

        const [
            checkoutAttempts,
            pendingEntitlements,
            unresolvedEvents,
            totalPendingAttempts,
            totalPendingEntitlements,
            totalUnresolvedEvents,
            verifiedPurchaseReport,
        ] =
            await Promise.all([
                CheckoutAttempt.find({
                    status: {
                        $in: [
                            'created',
                            'webhook_received',
                            'pending_user_match',
                            'success_redirected',
                            'cancel_redirected',
                            'failed',
                            'expired',
                        ],
                    },
                })
                    .sort({ updatedAt: -1 })
                    .limit(limit)
                    .lean(),
                PendingEntitlement.find({ appliedAt: null, ignoredAt: null })
                    .sort({ receivedAt: -1 })
                    .limit(limit)
                    .lean(),
                BillingEvent.find({
                    processingStatus: {
                        $in: [
                            'processing',
                            'failed_retryable',
                            'received',
                            'received_unknown_type',
                            'received_simulated',
                            'pending_user',
                        ],
                    },
                })
                    .sort({ receivedAt: -1 })
                    .limit(limit)
                    .lean(),
                CheckoutAttempt.countDocuments({
                    status: {
                        $in: [
                            'created',
                            'webhook_received',
                            'pending_user_match',
                            'success_redirected',
                            'cancel_redirected',
                            'failed',
                            'expired',
                        ],
                    },
                }),
                PendingEntitlement.countDocuments({ appliedAt: null, ignoredAt: null }),
                BillingEvent.countDocuments({
                    processingStatus: {
                        $in: [
                            'processing',
                            'failed_retryable',
                            'received',
                            'received_unknown_type',
                            'received_simulated',
                            'pending_user',
                        ],
                    },
                }),
                findVerifiedPurchaseEntitlementMismatches({
                    CheckoutAttempt,
                    User,
                    BillingEvent,
                    mode,
                    lookbackDays: req.query?.lookbackDays,
                    graceMinutes: req.query?.graceMinutes,
                    limit,
                }),
            ]);

        let providerOrders = { status: 'not_requested' };
        if (includeProviderOrders) {
            const window = {
                createdAfter: verifiedPurchaseReport.window.verifiedAfter,
                createdBefore: verifiedPurchaseReport.window.verifiedBefore,
            };
            const fetched = orderProvider === 'polar'
                ? await fetchRecentPolarOrders({ accessToken: polarAccessToken, mode, ...window })
                : await fetchRecentLemonSqueezyOrders({
                    apiKey: providerApiKey,
                    storeId: process.env.LEMONSQUEEZY_STORE_ID,
                    mode,
                    ...window,
                });
            const reconciliation = await findProviderOrderMismatches({
                CheckoutAttempt,
                User,
                orders: fetched.orders,
                mode,
                provider: orderProvider,
            });
            providerOrders = {
                status: 'checked',
                pagesFetched: fetched.pagesFetched,
                truncated: fetched.truncated,
                ...reconciliation,
            };
        }

        return res.json({
            summary: {
                pendingAttempts: totalPendingAttempts,
                pendingEntitlements: totalPendingEntitlements,
                unresolvedEvents: totalUnresolvedEvents,
                verifiedPurchaseCandidates: verifiedPurchaseReport.summary.candidates,
                verifiedPurchaseMismatches: verifiedPurchaseReport.summary.mismatches,
                ...(providerOrders.status === 'checked' ? {
                    providerOrders: providerOrders.summary.orders,
                    providerOrderMismatches: providerOrders.summary.mismatches,
                } : {}),
            },
            checkoutAttempts: checkoutAttempts.map(serializeReconciliationAttempt),
            pendingEntitlements: pendingEntitlements.map(serializeReconciliationPendingEntitlement),
            billingEvents: unresolvedEvents.map(serializeReconciliationBillingEvent),
            verifiedPurchases: {
                ...verifiedPurchaseReport,
                providerOrders,
            },
        });
    } catch (err) {
        console.error('[admin] billing reconciliation failed:', err);
        return res.status(500).json({ error: err.message || 'Billing reconciliation failed' });
    }
});

module.exports = router;
