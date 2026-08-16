require('dotenv').config();

const { initSentry, setupSentryErrorHandler } = require('./config/sentry');

initSentry();

const express = require('express');
const { rateLimit: expressRateLimit } = require('express-rate-limit');
const cors = require('cors');
const mongoose = require('mongoose');
const { requireAuth } = require('./middleware/Auth');
const { getJwtSecret } = require('./config/jwt');
const cookieParser = require('cookie-parser');
const { requireAdmin } = require('./middleware/RequireAdmin');
const { createExpressRateLimitStore } = require('./middleware/rateLimit');
const { cookieCsrfProtection } = require('./middleware/Csrf');
const { createRequestMetricsMiddleware } = require('./middleware/observability');
const { createSecurityHeadersMiddleware } = require('./middleware/securityHeaders');
const { connectToMongo, resolveMongoConnectionConfig } = require('./config/mongo');
const { normalizeOrigin, resolveAllowedFrontendOrigins, resolveServerBase } = require('./config/urls');
const { validateAuthRuntimeConfig } = require('./config/auth-runtime');

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 3001;
const { uri: MONGO_URL } = resolveMongoConnectionConfig();
const SERVER_BASE = resolveServerBase();
const ALLOWED_FRONTEND_ORIGINS = resolveAllowedFrontendOrigins();
const API_RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 60_000);
const API_RATE_LIMIT_MAX = Math.max(1, Number(process.env.API_RATE_LIMIT_MAX) || 300);
const WEBHOOK_RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS) || 60_000);
const WEBHOOK_RATE_LIMIT_MAX = Math.max(1, Number(process.env.WEBHOOK_RATE_LIMIT_MAX) || 1200);

// Validate critical secrets early (fail-fast in production)
getJwtSecret();

const authRuntimeValidation = validateAuthRuntimeConfig({
    serverBase: SERVER_BASE,
    frontendOrigins: ALLOWED_FRONTEND_ORIGINS,
    cookieSameSite: process.env.COOKIE_SAMESITE,
    cookieSecure: process.env.COOKIE_SECURE,
    cookieDomain: process.env.COOKIE_DOMAIN,
    isProdRuntime: process.env.NODE_ENV === 'production',
});

if (authRuntimeValidation.errors.length) {
    throw new Error(`Auth runtime config invalid: ${authRuntimeValidation.errors.join(' ')}`);
}
for (const warning of authRuntimeValidation.warnings) {
    console.warn(`⚠️ Auth config: ${warning}`);
}

const seenRejectedCorsOrigins = new Set();

function warnRejectedCorsOrigin(origin, normalizedOrigin) {
    const key = String(normalizedOrigin || origin || '').trim() || '(unknown)';
    if (seenRejectedCorsOrigins.has(key)) return;
    seenRejectedCorsOrigins.add(key);

    const allowedOrigins = ALLOWED_FRONTEND_ORIGINS.join(', ') || '(none)';
    console.warn(
        `⚠️ CORS blocked origin: ${origin || '(missing)'}${normalizedOrigin ? ` -> ${normalizedOrigin}` : ''}. Allowed frontend origins: ${allowedOrigins}`
    );
}

// ---- Middleware ----
// Behind proxies (Vercel/Render/etc), set TRUST_PROXY=true so req.ip is accurate and secure cookies work.
if (String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
    app.set('trust proxy', 1);
}

console.log(`🔧 SERVER_BASE: ${SERVER_BASE}`);
console.log(`🔧 Allowed frontend origins: ${ALLOWED_FRONTEND_ORIGINS.join(', ') || '(none)'}`);

app.use(createSecurityHeadersMiddleware());
app.use(createRequestMetricsMiddleware());
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            const normalized = normalizeOrigin(origin);
            if (ALLOWED_FRONTEND_ORIGINS.includes(normalized)) return cb(null, true);
            warnRejectedCorsOrigin(origin, normalized);
            return cb(null, false);
        },
        credentials: true,
        exposedHeaders: ['Retry-After'],
    })
);
const captureRawBody = (req, _res, buf) => {
    if (!req.rawBody && buf?.length) req.rawBody = buf;
};
const defaultJsonParser = express.json({
    verify: captureRawBody,
});
const defaultUrlencodedParser = express.urlencoded({
    extended: false,
    verify: captureRawBody,
});
const isInterviewApiRequest = (req) => (
    req.path === '/api/interviews' || req.path.startsWith('/api/interviews/')
);

// Interview drafts have a separately bounded, authenticated JSON parser in
// their router. Skipping the default 100 KiB parsers here keeps the advertised
// draft limit usable without widening the request limit for every endpoint.
app.use((req, res, next) => {
    if (isInterviewApiRequest(req)) return next();
    return defaultJsonParser(req, res, next);
});
app.use((req, res, next) => {
    if (isInterviewApiRequest(req)) return next();
    return defaultUrlencodedParser(req, res, next);
});
app.use(cookieParser());

const apiRateLimitHandler = (_req, res) => res.status(429).json({
    code: 'API_RATE_LIMITED',
    error: 'Too many requests. Please try again shortly.',
});

const webhookRateLimiter = expressRateLimit({
    windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
    limit: WEBHOOK_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: apiRateLimitHandler,
    store: createExpressRateLimitStore({
        name: 'billing-webhooks-global',
        windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
    }),
});

const apiRateLimiter = expressRateLimit({
    windowMs: API_RATE_LIMIT_WINDOW_MS,
    limit: API_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => {
        if (req.method === 'OPTIONS') return true;
        const path = String(req.originalUrl || req.url || '').split('?')[0];
        return path === '/api/hello' ||
            path === '/api/health' ||
            path === '/api/contact' ||
            path === '/api/bug-report' ||
            path === '/api/billing/webhooks' ||
            path.startsWith('/api/billing/webhooks/');
    },
    handler: apiRateLimitHandler,
    store: createExpressRateLimitStore({
        name: 'api-global',
        windowMs: API_RATE_LIMIT_WINDOW_MS,
    }),
});

app.use('/api/billing/webhooks', webhookRateLimiter);
app.use('/api', apiRateLimiter);
app.use('/api', cookieCsrfProtection);

// ---- DB (lazy for serverless, fail-fast for local server) ----
const SKIP_DB_PATHS = new Set(['/', '/api/hello', '/api/contact', '/api/bug-report', '/api/health']);
app.use(async (req, res, next) => {
    try {
        const isPublicCheckoutConfig =
            (req.method === 'GET' || req.method === 'HEAD') &&
            req.path === '/api/billing/checkout/config';
        if (
            SKIP_DB_PATHS.has(req.path) ||
            isPublicCheckoutConfig ||
            req.path.startsWith('/api/tools/') ||
            req.path.startsWith('/api/trivia/')
        ) return next();
        await connectToMongo(MONGO_URL);
        return next();
    } catch (err) {
        console.error('❌ MongoDB connect failed:', err);
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// ---- Models ----
const User = require('./models/User');
const ActivityEvent = require('./models/ActivityEvent'); // need the model for the heatmap route

function safeUserResponse(user) {
    const value = typeof user?.toObject === 'function' ? user.toObject() : { ...(user || {}) };
    const linkedProviders = Array.from(new Set(
        (Array.isArray(value.providers) ? value.providers : [])
            .map((entry) => entry?.provider)
            .filter((provider) => provider === 'google' || provider === 'github')
    ));
    const emailVerified = Boolean(value.emailVerifiedAt);
    delete value.passwordHash;
    delete value.providers;
    delete value.emailVerifiedAt;
    delete value.authInvalidatedAt;
    return {
        ...value,
        emailVerified,
        pendingEmail: value.pendingEmail || null,
        linkedProviders,
    };
}

// ---- Routes (basic) ----
app.get('/', (_, res) => res.send('Backend is working 🚀'));
app.get('/api/hello', (_, res) => res.json({ message: 'Hello from backend 👋' }));
app.get('/api/health', async (_req, res) => {
    try {
        await connectToMongo(MONGO_URL);
        return res.json({ ok: true });
    } catch {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Public contact and bug-report forms share fail-closed Turnstile, quota, and
// duplicate protections without widening failure scope to other API routes.
app.use('/api', require('./routes/public-forms'));

// ---- Auth routes ----
app.use('/api/auth', require('./routes/auth'));
// ---- Billing routes ----
app.use('/api/billing', require('./routes/billing'));
// ---- Tools routes ----
app.use('/api/tools', require('./routes/tools'));
// ---- Dashboard / Gamification routes ----
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/weekly-goal', require('./routes/weekly-goal'));
// ---- Editor assist sync routes ----
app.use('/api/editor-assist', require('./routes/editor-assist'));
// ---- Trivia incident routes ----
app.use('/api/trivia', require('./routes/trivia-incident'));

// ---- Activity routes ----
app.use('/api/activity', require('./routes/activity'));
app.use('/api/practice-progress', require('./routes/practice-progress'));
// ---- Interview Mode (availability stays readable while mutations remain feature-gated) ----
app.use('/api/interviews', require('./routes/interviews'));
// ---- Admin routes (protected) ----
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

// ---- Progress routes ----
// Authenticated-only manual solved sync. Guest solve attempts are intentionally not persisted.
app.post('/api/users/me/solved', requireAuth, async (req, res) => {
    try {
        const { questionId, solved } = req.body || {};
        if (!questionId || typeof questionId !== 'string') {
            return res.status(400).json({ error: 'questionId is required' });
        }

        const user = await User.findById(req.auth.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (solved === false) {
            user.solvedQuestionIds = (user.solvedQuestionIds || []).filter((id) => id !== questionId);
        } else {
            if (!user.solvedQuestionIds) user.solvedQuestionIds = [];
            if (!user.solvedQuestionIds.includes(questionId)) user.solvedQuestionIds.push(questionId);
        }

        await user.save();
        return res.json({ solvedQuestionIds: user.solvedQuestionIds });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- Profile routes (protected + whitelist) ----
app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
        // Allow user to read self or admin
        if (req.auth.userId !== req.params.id && req.auth.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(safeUserResponse(user));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
        if (req.auth.userId !== req.params.id && req.auth.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Never allow passwordHash via this route
        if ('passwordHash' in req.body) delete req.body.passwordHash;
        const requestedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (requestedEmail && requestedEmail !== String((await User.findById(req.params.id).select('email').lean())?.email || '').toLowerCase()) {
            return res.status(409).json({
                code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION',
                error: 'Request an email verification link to change your email address.',
            });
        }

        // Whitelist updatable fields. Email changes use the verification flow.
        const allowed = ['username', 'bio', 'avatarUrl', 'prefs'];
        const update = {};
        for (const k of allowed) {
            if (k in req.body) update[k] = req.body[k];
        }

        // Allow admins to set accessTier manually
        if (req.auth.role === 'admin' && typeof req.body.accessTier === 'string') {
            const tier = req.body.accessTier;
            if (['free', 'premium'].includes(tier)) {
                update.accessTier = tier;
            }
        }

        const user = await User.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
            context: 'query',
        }).select('-passwordHash');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(safeUserResponse(user));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- /api/stats/heatmap (alias used by the frontend) ----
function utcDayStr(d = new Date()) {
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

const statsRouter = express.Router();

statsRouter.get('/heatmap', requireAuth, async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days || '180', 10), 1), 366);
        const end = new Date();
        const start = new Date(end.getTime() - (days - 1) * 86400000);
        const startStr = utcDayStr(start);
        const endStr = utcDayStr(end);

        const rows = await ActivityEvent.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.auth.userId),
                    dayUTC: { $gte: startStr, $lte: endStr },
                },
            },
            {
                $group: {
                    _id: '$dayUTC',
                    completed: { $sum: 1 },
                    xp: { $sum: '$xp' },
                },
            },
        ]);

        const map = Object.fromEntries(rows.map((r) => [r._id, { completed: r.completed, xp: r.xp }]));
        const data = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(end.getTime() - i * 86400000);
            const key = utcDayStr(d);
            const v = map[key] || { completed: 0, xp: 0 };
            data.push({ dayUTC: key, ...v });
        }
        data.reverse();

        res.json({ days, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use('/api/stats', statsRouter);

// ---- Stats convenience (optional) ----
app.get('/api/stats/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId).select('stats');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.stats || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

setupSentryErrorHandler(app);

app.use((err, _req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('Unhandled request error:', err);
    return res.status(err.status || err.statusCode || 500).json({ error: 'Internal server error' });
});

// ---- Start (only when run directly, not when imported as a serverless handler) ----
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    // Best-effort: connect in the background; request middleware will return 503 if DB is unavailable.
    connectToMongo(MONGO_URL).catch((err) => console.error('❌ MongoDB connect failed:', err));
}

module.exports = app;
