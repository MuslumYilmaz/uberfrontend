const BillingEvent = require('../models/BillingEvent');
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

module.exports = router;
