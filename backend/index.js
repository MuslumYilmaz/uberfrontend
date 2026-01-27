require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { requireAuth } = require('./middleware/Auth');
const { getJwtSecret } = require('./config/jwt');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer'); // <-- NEW
const { requireAdmin } = require('./middleware/RequireAdmin');
const { rateLimit } = require('./middleware/rateLimit');
const { connectToMongo } = require('./config/mongo');
const { normalizeOrigin, resolveAllowedFrontendOrigins, resolveServerBase } = require('./config/urls');

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 3001;
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const MONGO_URL = isTest
    ? process.env.MONGO_URL_TEST
    : (process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/myapp');
if (isTest && !process.env.MONGO_URL_TEST) {
    throw new Error('MONGO_URL_TEST is required when running tests');
}
const SERVER_BASE = resolveServerBase();
const ALLOWED_FRONTEND_ORIGINS = resolveAllowedFrontendOrigins();
const BUG_REPORT_WINDOW_MS = Number(process.env.BUG_REPORT_WINDOW_MS || 60 * 60 * 1000); // 1h
const BUG_REPORT_MAX = Number(process.env.BUG_REPORT_MAX || 5);
const BUG_REPORT_MAX_NOTE_CHARS = Number(process.env.BUG_REPORT_MAX_NOTE_CHARS || 4000);
const BUG_REPORT_MAX_URL_CHARS = Number(process.env.BUG_REPORT_MAX_URL_CHARS || 2000);

// Validate critical secrets early (fail-fast in production)
getJwtSecret();

// ---- Middleware ----
// Behind proxies (Vercel/Render/etc), set TRUST_PROXY=true so req.ip is accurate and secure cookies work.
if (String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
    app.set('trust proxy', 1);
}

console.log(`🔧 SERVER_BASE: ${SERVER_BASE}`);
console.log(`🔧 Allowed frontend origins: ${ALLOWED_FRONTEND_ORIGINS.join(', ') || '(none)'}`);

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            const normalized = normalizeOrigin(origin);
            if (ALLOWED_FRONTEND_ORIGINS.includes(normalized)) return cb(null, true);
            return cb(new Error('CORS origin not allowed'));
        },
        credentials: true,
    })
);
app.use(express.json({
    verify: (req, _res, buf) => {
        if (!req.rawBody && buf?.length) req.rawBody = buf;
    },
}));
app.use(express.urlencoded({
    extended: false,
    verify: (req, _res, buf) => {
        if (!req.rawBody && buf?.length) req.rawBody = buf;
    },
}));
app.use(cookieParser());

// ---- DB (lazy for serverless, fail-fast for local server) ----
const SKIP_DB_PATHS = new Set(['/', '/api/hello', '/api/bug-report', '/api/health']);
app.use(async (req, res, next) => {
    try {
        if (SKIP_DB_PATHS.has(req.path)) return next();
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

// ======================
//  Bug Report -> Email
// ======================
/**
 * POST /api/bug-report
 * body: { note: string, url?: string }
 * Sends an email to mslmyilmaz34@gmail.com
 */
app.post(
    '/api/bug-report',
    rateLimit({
        windowMs: BUG_REPORT_WINDOW_MS,
        max: BUG_REPORT_MAX,
        message: 'Too many bug reports, please try again later.',
    }),
    async (req, res) => {
    try {
        const { note, url } = req.body || {};
        if (!note || typeof note !== 'string' || !note.trim()) {
            return res.status(400).json({ error: 'Missing "note"' });
        }
        if (note.length > BUG_REPORT_MAX_NOTE_CHARS) {
            return res.status(413).json({ error: 'Bug report note too long' });
        }
        if (url && typeof url === 'string' && url.length > BUG_REPORT_MAX_URL_CHARS) {
            return res.status(413).json({ error: 'Bug report url too long' });
        }

        // Create transporter (Gmail SMTP with App Password, or any SMTP creds)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 465),
            secure: String(process.env.SMTP_SECURE || 'true') === 'true', // true for 465
            auth: {
                user: process.env.SMTP_USER, // e.g. yourgmail@gmail.com
                pass: process.env.SMTP_PASS, // Gmail App Password
            },
        });

        const safeText = String(note);
        const safeUrl = url ? String(url) : '';

        const html = `
      <h2 style="margin:0 0 8px">New Bug Report</h2>
      <p style="white-space:pre-wrap;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto">
        ${escapeHtml(safeText)}
      </p>
      ${safeUrl ? `<p><strong>Page:</strong> <a href="${escapeAttr(safeUrl)}">${escapeHtml(safeUrl)}</a></p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="color:#64748b;font-size:12px;margin:0">Sent ${new Date().toISOString()}</p>
    `;

        await transporter.sendMail({
            from: `"Bug Reporter" <${process.env.SMTP_USER}>`,
            to: 'mslmyilmaz34@gmail.com',
            subject: 'Bug report from FrontendAtlas',
            text: `Bug report:\n\n${safeText}\n\nPage: ${safeUrl || '(none)'}\nSent ${new Date().toISOString()}`,
            html,
        });

        return res.status(204).end();
    } catch (err) {
        console.error('Email send failed:', err);
        return res.status(500).json({ error: 'Email send failed' });
    }
});

// small HTML-escape helpers
function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function escapeAttr(s = '') {
    return escapeHtml(s).replace(/`/g, '&#96;');
}

// ---- Auth routes ----
app.use('/api/auth', require('./routes/auth'));
// ---- Billing routes ----
app.use('/api/billing', require('./routes/billing'));

// ---- Activity routes ----
app.use('/api/activity', require('./routes/activity'));
// ---- Admin routes (protected) ----
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

// ---- Progress routes ----
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
        res.json(user);
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
        // Whitelist updatable fields
        const allowed = ['username', 'email', 'bio', 'avatarUrl', 'prefs'];
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
        }).select('-passwordHash');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
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

// ---- Start (only when run directly, not when imported as a serverless handler) ----
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    // Best-effort: connect in the background; request middleware will return 503 if DB is unavailable.
    connectToMongo(MONGO_URL).catch((err) => console.error('❌ MongoDB connect failed:', err));
}

module.exports = app;
