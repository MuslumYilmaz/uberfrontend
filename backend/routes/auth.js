const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const pick = (u) => ({
    _id: u._id,
    username: u.username,
    email: u.email,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt,
});

const sign = (u) =>
    jwt.sign({ sub: u._id.toString(), role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

function getBearerToken(req) {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : null;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, username, password } = req.body || {};
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(409).json({ error: 'Email or username already in use' });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, username, passwordHash });

        res.status(201).json({ token: sign(user), user: pick(user) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body || {};
        if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing fields' });

        const query = /@/.test(emailOrUsername)
            ? { email: emailOrUsername }
            : { username: emailOrUsername };

        const user = await User.findOne(query);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ token: sign(user), user: pick(user) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/me  (expects Authorization: Bearer <token>)
router.get('/me', async (req, res) => {
    try {
        const token = getBearerToken(req);
        if (!token) return res.status(401).json({ error: 'Missing token' });

        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.sub).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(pick(user));
    } catch (e) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;
