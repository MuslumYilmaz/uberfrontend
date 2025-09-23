const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const { getBearerToken } = require('../middleware/Auth.js');


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// --- Google OAuth config ---
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const SERVER_BASE = (process.env.SERVER_BASE || 'http://localhost:3001').trim();
const FRONTEND_BASE = (process.env.FRONTEND_BASE || 'http://localhost:4200').trim();
const GOOGLE_REDIRECT = `${SERVER_BASE}/api/auth/oauth/google/callback`;

const oauth = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT);

const b64 = s => Buffer.from(s, 'utf8').toString('base64url');
const fromB64 = s => Buffer.from(s, 'base64url').toString('utf8');


const pick = (u) => ({
    _id: u._id,
    username: u.username,
    email: u.email,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt,
    prefs: u.prefs,
    stats: u.stats,
    billing: u.billing,
    coupons: u.coupons,
    lastLoginAt: u.lastLoginAt,
});

const sign = (u) =>
    jwt.sign({ sub: u._id.toString(), role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// GET /api/auth/oauth/google/start
router.get('/oauth/google/start', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(500).send('Google OAuth not configured');
    }

    // Where we’ll send the user on the frontend after we mint a JWT
    const redirectParam =
        typeof req.query.redirect_uri === 'string'
            ? req.query.redirect_uri
            : `${FRONTEND_BASE}/auth/callback`;

    // Prevent open-redirects
    if (!redirectParam.startsWith(FRONTEND_BASE)) {
        return res.status(400).send('redirect_uri not allowed');
    }

    const nonce = crypto.randomUUID();
    // store CSRF nonce in cookie for the short hop
    res.cookie('g_csrf', nonce, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 10 * 60 * 1000 });

    const state = b64(JSON.stringify({ r: redirectParam, n: nonce }));

    const url = oauth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['openid', 'email', 'profile'],
        state,
        redirect_uri: GOOGLE_REDIRECT,
    });

    return res.redirect(url);
});

// GET /api/auth/oauth/google/callback
router.get('/oauth/google/callback', async (req, res) => {
    try {
        const code = String(req.query.code || '');
        const rawState = String(req.query.state || '');
        if (!code || !rawState) return res.status(400).send('Missing code/state');

        const { r, n } = JSON.parse(fromB64(rawState));
        if (!r || !n || n !== req.cookies?.g_csrf) return res.status(400).send('Bad state');

        // Exchange code → tokens
        const { tokens } = await oauth.getToken({ code, redirect_uri: GOOGLE_REDIRECT });
        const idToken = tokens.id_token;
        if (!idToken) return res.status(400).send('No id_token');

        // Verify ID token
        const ticket = await oauth.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload(); // { email, name, picture, sub, ... }
        const email = payload.email;
        const name = payload.name || (email ? email.split('@')[0] : `user_${payload.sub.slice(-6)}`);

        // Find or create local user
        let user = await User.findOne({ email });
        if (!user) {
            const randomPwd = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomPwd, 10);
            user = await User.create({
                email,
                username: name,
                avatarUrl: payload.picture || undefined,
                passwordHash,  // stored to satisfy schema; not used by OAuth logins
                prefs: { tz: 'Europe/Istanbul', theme: 'dark', defaultTech: 'javascript', keyboard: 'default' },
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const token = sign(user);

        // Hand JWT back to the frontend callback
        const dest = new URL(r);
        dest.searchParams.set('token', token);
        res.clearCookie('g_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('Google OAuth error:', e);
        return res.status(500).send('OAuth error');
    }
});


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
        const user = await User.create({
            email,
            username,
            passwordHash,
            prefs: { tz: 'Europe/Istanbul', theme: 'dark', defaultTech: 'javascript', keyboard: 'default' },
        });

        user.lastLoginAt = new Date();
        await user.save();

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

        user.lastLoginAt = new Date();
        await user.save();

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