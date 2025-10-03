require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { requireAuth } = require('./middleware/Auth');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer'); // <-- NEW

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/myapp';

// ---- DB ----
mongoose.connect(MONGO_URL);
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err));

// ---- Middleware ----
app.use(
    cors({
        origin: 'http://localhost:4200', // your Angular dev URL
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// ---- Models ----
const User = require('./models/User');
const ActivityEvent = require('./models/ActivityEvent'); // need the model for the heatmap route

// ---- Routes (basic) ----
app.get('/', (_, res) => res.send('Backend is working 🚀'));
app.get('/api/hello', (_, res) => res.json({ message: 'Hello from backend 👋' }));

// ======================
//  Bug Report -> Email
// ======================
/**
 * POST /api/bug-report
 * body: { note: string, url?: string }
 * Sends an email to mslmyilmaz34@gmail.com
 */
app.post('/api/bug-report', async (req, res) => {
    try {
        const { note, url } = req.body || {};
        if (!note || typeof note !== 'string' || !note.trim()) {
            return res.status(400).json({ error: 'Missing "note"' });
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
            subject: 'Bug report from UberFrontend',
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

// ---- Activity routes ----
app.use('/api/activity', require('./routes/activity'));

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

// ---- Start ----
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
