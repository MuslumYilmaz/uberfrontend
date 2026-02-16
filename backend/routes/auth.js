const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const PendingEntitlement = require('../models/PendingEntitlement');
const { applyPendingEntitlementsForUser } = require('../services/billing/pending-entitlements');
const { requireAuth } = require('../middleware/Auth.js');
const { getJwtSecret, getJwtVerifyOptions, isProd } = require('../config/jwt');
const { resolveAllowedFrontendOrigins, resolveFrontendBase, resolveServerBase } = require('../config/urls');


function normalizeJwtExpiresIn(raw) {
    if (raw == null) return '7d';
    const v = String(raw).trim();
    if (!v) return null;
    const lowered = v.toLowerCase();
    if (['none', '0', 'false', 'off', 'no-expiry', 'noexpiry'].includes(lowered)) {
        return null;
    }
    return v;
}

const JWT_EXPIRES_IN = normalizeJwtExpiresIn(process.env.JWT_EXPIRES_IN);

const ACCESS_TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME || 'access_token';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'csrf_token';

function getCookieSameSite() {
    const raw = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
    if (raw === 'lax' || raw === 'strict' || raw === 'none') return raw;
    return 'lax';
}

function getCookieSecure() {
    const v = String(process.env.COOKIE_SECURE || '').toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
    return isProd();
}

function getCookieDomain() {
    const explicit = String(process.env.COOKIE_DOMAIN || '').trim();
    if (explicit) return explicit;
    try {
        const host = new URL(FRONTEND_BASE || SERVER_BASE || '').hostname || '';
        if (!host || host === 'localhost' || host.endsWith('.localhost')) return undefined;
        const parts = host.replace(/^www\./, '').split('.');
        if (parts.length < 2) return undefined;
        return `.${parts.slice(-2).join('.')}`;
    } catch {
        return undefined;
    }
}

function parseExpiresInToMs(expiresIn) {
    const raw = String(expiresIn || '').trim();
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return Number(raw) * 1000; // seconds

    const m = raw.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
    if (!m) return null;
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    if (!Number.isFinite(n) || n <= 0) return null;

    const mult =
        unit === 'ms' ? 1 :
            unit === 's' ? 1000 :
                unit === 'm' ? 60 * 1000 :
                    unit === 'h' ? 60 * 60 * 1000 :
                        unit === 'd' ? 24 * 60 * 60 * 1000 :
                            0;
    return mult ? n * mult : null;
}

function parseCookieMaxAgeDays(raw) {
    if (raw == null) return null;
    const v = String(raw).trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 24 * 60 * 60 * 1000);
}

function authCookieOptions() {
    const sameSite = getCookieSameSite();
    const secure = getCookieSecure();
    const domain = getCookieDomain();
    const maxAge =
        parseCookieMaxAgeDays(process.env.AUTH_COOKIE_MAX_AGE_DAYS) ??
        parseExpiresInToMs(JWT_EXPIRES_IN);

    return {
        sameSite,
        secure,
        path: '/',
        ...(domain ? { domain } : {}),
        ...(maxAge ? { maxAge } : {}),
    };
}

function setAuthCookies(res, token) {
    const base = authCookieOptions();
    res.cookie(ACCESS_TOKEN_COOKIE, token, { ...base, httpOnly: true });

    // Only needed when SameSite=None (cross-site cookies).
    if (base.sameSite === 'none') {
        const csrf = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE, csrf, { ...base, httpOnly: false });
        return csrf;
    }
    return null;
}

function clearAuthCookies(res) {
    const base = authCookieOptions();
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...base, httpOnly: true });
    res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false });
}

function shouldReturnToken(req) {
    const q = req?.query?.returnToken;
    if (q === '1' || q === 'true') return true;
    const h = req?.headers?.['x-return-token'];
    if (h === '1' || h === 'true') return true;
    return false;
}

const ENTITLEMENT_STATUSES = new Set([
    'none',
    'active',
    'lifetime',
    'cancelled',
    'expired',
    'refunded',
    'chargeback',
]);

function normalizeValidUntil(raw) {
    if (!raw) return null;
    const asDate = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
}

function normalizeEntitlement(raw) {
    if (!raw || typeof raw !== 'object') {
        return { status: 'none', validUntil: null };
    }
    const status = ENTITLEMENT_STATUSES.has(raw.status) ? raw.status : 'none';
    const validUntil = normalizeValidUntil(raw.validUntil);
    return { status, validUntil };
}

function isLegacyProActive(status) {
    if (!status) return false;
    return status === 'active' || status === 'lifetime' || status === 'canceled';
}

function deriveLegacyProEntitlement(user) {
    const accessTier = user?.accessTier ?? 'free';
    const billingStatus = user?.billing?.pro?.status;
    const isActive = accessTier === 'premium' || isLegacyProActive(billingStatus);
    const validUntil = normalizeValidUntil(user?.billing?.pro?.renewsAt);
    return { status: isActive ? 'active' : 'none', validUntil };
}

function resolveEntitlements(user) {
    const entitlements = user?.entitlements || {};
    const normalizedPro = normalizeEntitlement(entitlements?.pro);
    const hasLegacyActive =
        (user?.accessTier ?? 'free') === 'premium' ||
        isLegacyProActive(user?.billing?.pro?.status);
    const shouldDerivePro =
        !entitlements?.pro ||
        !entitlements.pro.status ||
        (normalizedPro.status === 'none' && !normalizedPro.validUntil && hasLegacyActive);
    const pro = shouldDerivePro ? deriveLegacyProEntitlement(user) : normalizedPro;
    const projects = normalizeEntitlement(entitlements?.projects);
    const now = Date.now();
    const effectiveProActive =
        ['active', 'lifetime', 'cancelled'].includes(pro.status) &&
        (!pro.validUntil || pro.validUntil.getTime() > now);
    return { entitlements: { pro, projects }, effectiveProActive };
}

// --- Google OAuth config ---
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

const SERVER_BASE = resolveServerBase();
const FRONTEND_BASE = resolveFrontendBase();
const FRONTEND_ORIGINS = resolveAllowedFrontendOrigins();

const GOOGLE_REDIRECT = `${SERVER_BASE}/api/auth/oauth/google/callback`;
const GITHUB_REDIRECT = `${SERVER_BASE}/api/auth/oauth/github/callback`;

const oauth = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT);

const b64 = s => Buffer.from(s, 'utf8').toString('base64url');
const fromB64 = s => Buffer.from(s, 'base64url').toString('utf8');

function isAllowedRedirectUri(uri) {
    try {
        const u = new URL(String(uri));
        return FRONTEND_ORIGINS.includes(u.origin);
    } catch {
        return false;
    }
}

function getClientState(req) {
    const s = req?.query?.state;
    return typeof s === 'string' ? s.slice(0, 256) : '';
}

function getClientMode(req) {
    const m = req?.query?.mode;
    return typeof m === 'string' ? m.slice(0, 64) : '';
}

function normalizeEmailInput(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeUsernameInput(value) {
    return String(value || '').trim();
}

function normalizeLoginIdentifier(value) {
    return String(value || '').trim();
}

function buildDefaultPrefs() {
    return {
        tz: 'Europe/Istanbul',
        theme: 'dark',
        defaultTech: 'javascript',
        keyboard: 'default',
    };
}

const OAUTH_USERNAME_MAX_BASE_LENGTH = 32;
const OAUTH_USERNAME_RETRY_LIMIT = 20;

function normalizeOAuthUsernameBase(value, email) {
    const normalizedValue = normalizeUsernameInput(value);
    const emailLocalPart = normalizeEmailInput(email).split('@')[0] || '';
    const seed = normalizedValue || emailLocalPart || 'user';
    const cleaned = seed
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[._-]+|[._-]+$/g, '');
    const safe = cleaned || 'user';
    return safe.slice(0, OAUTH_USERNAME_MAX_BASE_LENGTH);
}

function buildOAuthUsernameCandidate(base, attempt) {
    if (attempt <= 0) return base;
    const suffix = String(attempt);
    const maxBaseLength = Math.max(1, OAUTH_USERNAME_MAX_BASE_LENGTH - suffix.length - 1);
    return `${base.slice(0, maxBaseLength)}_${suffix}`;
}

function isGithubNoreplyEmail(value) {
    return normalizeEmailInput(value).endsWith('@users.noreply.github.com');
}

async function createOAuthUserWithUniqueUsername({ email, usernameHint, avatarUrl }) {
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail) throw new Error('Missing email for OAuth user');

    const randomPwd = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPwd, 10);
    const usernameBase = normalizeOAuthUsernameBase(usernameHint, normalizedEmail);

    for (let attempt = 0; attempt < OAUTH_USERNAME_RETRY_LIMIT; attempt += 1) {
        const candidate = buildOAuthUsernameCandidate(usernameBase, attempt);
        try {
            return await User.create({
                email: normalizedEmail,
                username: candidate,
                avatarUrl: avatarUrl || undefined,
                passwordHash,
                lastLoginAt: new Date(),
                prefs: buildDefaultPrefs(),
            });
        } catch (e) {
            if (!isDuplicateKeyError(e)) throw e;
            const fields = parseDuplicateFieldsFromError(e);

            if (fields.email) {
                const existingByEmail = await User.findOne({ email: normalizedEmail });
                if (existingByEmail) return existingByEmail;
                continue;
            }
            if (fields.username || !hasDuplicateField(fields)) continue;
        }
    }

    const fallbackUsername = `${usernameBase.slice(0, Math.max(1, OAUTH_USERNAME_MAX_BASE_LENGTH - 7))}_${crypto.randomBytes(3).toString('hex')}`;
    try {
        return await User.create({
            email: normalizedEmail,
            username: fallbackUsername,
            avatarUrl: avatarUrl || undefined,
            passwordHash,
            lastLoginAt: new Date(),
            prefs: buildDefaultPrefs(),
        });
    } catch (e) {
        if (!isDuplicateKeyError(e)) throw e;
        const existingByEmail = await User.findOne({ email: normalizedEmail });
        if (existingByEmail) return existingByEmail;
        throw e;
    }
}

function isDuplicateKeyError(error) {
    return Boolean(error && error.code === 11000);
}

function parseDuplicateFieldsFromError(error) {
    const fields = { email: false, username: false };

    const markField = (name) => {
        if (name === 'email' || name === 'username') fields[name] = true;
    };

    if (error?.keyPattern && typeof error.keyPattern === 'object') {
        for (const key of Object.keys(error.keyPattern)) markField(key);
    }
    if (error?.keyValue && typeof error.keyValue === 'object') {
        for (const key of Object.keys(error.keyValue)) markField(key);
    }

    const msg = String(error?.message || '');
    if (/email/i.test(msg)) fields.email = true;
    if (/username/i.test(msg)) fields.username = true;

    return fields;
}

function hasDuplicateField(fields) {
    return Boolean(fields?.email || fields?.username);
}

async function resolveDuplicateSignupFields({ email, username, initialFields }) {
    if (hasDuplicateField(initialFields)) return initialFields;
    try {
        const [emailExists, usernameExists] = await Promise.all([
            User.exists({ email }),
            User.exists({ username }),
        ]);
        return {
            email: Boolean(emailExists),
            username: Boolean(usernameExists),
        };
    } catch {
        return initialFields;
    }
}

const pick = (u) => {
    const { entitlements, effectiveProActive } = resolveEntitlements(u);
    return {
        _id: u._id,
        username: u.username,
        email: u.email,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        role: u.role,
        accessTier: u.accessTier || 'free',
        accessTierEffective: effectiveProActive ? 'premium' : 'free',
        createdAt: u.createdAt,
        prefs: u.prefs,
        stats: u.stats,
        billing: u.billing,
        entitlements,
        effectiveProActive,
        coupons: u.coupons,
        lastLoginAt: u.lastLoginAt,
        solvedQuestionIds: u.solvedQuestionIds || [],
    };
};

// GET /api/auth/ping
router.get('/ping', (_req, res) => res.json({ ok: true }));

const sign = (u) => {
    const payload = { sub: u._id.toString(), role: u.role };
    const options = JWT_EXPIRES_IN
        ? { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
        : { algorithm: 'HS256' };
    return jwt.sign(payload, getJwtSecret(), options);
};

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
    if (!isAllowedRedirectUri(redirectParam)) {
        return res.status(400).send('redirect_uri not allowed');
    }

    const clientState = getClientState(req);
    const mode = getClientMode(req);

    const nonce = crypto.randomUUID();
    // store CSRF nonce in cookie for the short hop
    res.cookie('g_csrf', nonce, { httpOnly: true, sameSite: 'lax', secure: isProd(), maxAge: 10 * 60 * 1000 });

    const state = b64(JSON.stringify({ r: redirectParam, n: nonce, s: clientState, m: mode }));

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

        const { r, n, s, m } = JSON.parse(fromB64(rawState));
        if (!r || !n || n !== req.cookies?.g_csrf) return res.status(400).send('Bad state');
        if (!isAllowedRedirectUri(r)) return res.status(400).send('redirect_uri not allowed');

        // Exchange code → tokens
        const { tokens } = await oauth.getToken({ code, redirect_uri: GOOGLE_REDIRECT });
        const idToken = tokens.id_token;
        if (!idToken) return res.status(400).send('No id_token');

        // Verify ID token
        const ticket = await oauth.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload(); // { email, name, picture, sub, ... }
        const email = normalizeEmailInput(payload?.email);
        if (!email) return res.status(400).send('No email');
        const name = payload.name || (email ? email.split('@')[0] : `user_${String(payload?.sub || '').slice(-6)}`);
        const avatarUrl = payload?.picture || undefined;

        // Find or create local user
        let user = await User.findOne({ email });
        const isExistingUser = Boolean(user);
        if (!user) {
            user = await createOAuthUserWithUniqueUsername({
                email,
                usernameHint: name,
                avatarUrl,
            });
        }

        if (isExistingUser) {
            user.avatarUrl = avatarUrl || user.avatarUrl;
            user.lastLoginAt = new Date();
            await user.save();
        }

        const token = sign(user);

        // Cookie-based auth: set httpOnly cookie and redirect back to the app.
        setAuthCookies(res, token);

        const dest = new URL(r);
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('g_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('Google OAuth error:', e);
        return res.status(500).send('OAuth error');
    }
});

// GET /api/auth/oauth/github/start
router.get('/oauth/github/start', (req, res) => {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).send('GitHub OAuth not configured');
    }

    const redirectParam = typeof req.query.redirect_uri === 'string'
        ? req.query.redirect_uri
        : `${FRONTEND_BASE}/auth/callback`;

    if (!isAllowedRedirectUri(redirectParam)) {
        return res.status(400).send('redirect_uri not allowed');
    }

    const clientState = getClientState(req);
    const mode = getClientMode(req);

    const nonce = crypto.randomUUID();
    res.cookie('gh_csrf', nonce, { httpOnly: true, sameSite: 'lax', secure: isProd(), maxAge: 10 * 60 * 1000 });
    const state = b64(JSON.stringify({ r: redirectParam, n: nonce, s: clientState, m: mode }));

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_uri', GITHUB_REDIRECT);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);

    res.redirect(url.toString());
});


// GET /api/auth/oauth/github/callback
router.get('/oauth/github/callback', async (req, res) => {
    try {
        const code = String(req.query.code || '');
        const rawState = String(req.query.state || '');
        if (!code || !rawState) return res.status(400).send('Missing code/state');

        const { r, n, s, m } = JSON.parse(fromB64(rawState));
        if (!r || !n || n !== req.cookies?.gh_csrf) return res.status(400).send('Bad state');
        if (!isAllowedRedirectUri(r)) return res.status(400).send('redirect_uri not allowed');

        // code -> access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT,
            })
        });
        const tokenJson = await tokenRes.json();
        const accessToken = tokenJson.access_token;
        if (!accessToken) return res.status(400).send('No access_token');

        const ghHeaders = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'frontendatlas-local',
        };

        const meRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
        const gh = await meRes.json(); // { id, login, name, email, avatar_url, ... }

        let email = normalizeEmailInput(gh.email || '');
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders });
            const emails = await emailsRes.json(); // [{email, primary, verified, visibility}, ...]
            const primary = normalizeEmailInput(emails.find(e => e.primary && e.verified)?.email || '');
            const verified = normalizeEmailInput(emails.find(e => e.verified)?.email || '');
            email = primary || verified || normalizeEmailInput(`${gh.id}+${gh.login}@users.noreply.github.com`);
        }

        const username = gh.name || gh.login;
        const avatarUrl = gh.avatar_url;

        let user = await User.findOne({ email });
        const noreplyAlias = normalizeEmailInput(`${gh.id}+${gh.login}@users.noreply.github.com`);
        if (!user) {
            user = await User.findOne({ email: noreplyAlias });
        }

        if (!user) {
            user = await createOAuthUserWithUniqueUsername({
                email,
                usernameHint: username,
                avatarUrl,
            });
        } else {
            if (isGithubNoreplyEmail(user.email) &&
                email && !isGithubNoreplyEmail(email)) {
                user.email = email;
            }
            user.avatarUrl = avatarUrl || user.avatarUrl;
            user.lastLoginAt = new Date();
            await user.save();
        }

        const token = sign(user);
        setAuthCookies(res, token);
        const dest = new URL(String(r));
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('gh_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('GitHub OAuth error:', e);
        return res.status(500).send('OAuth error');
    }
});


// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    let normalizedEmail = '';
    let normalizedUsername = '';
    try {
        const { email, username, password } = req.body || {};
        normalizedEmail = normalizeEmailInput(email);
        normalizedUsername = normalizeUsernameInput(username);
        if (!normalizedEmail || !normalizedUsername || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include a letter and a number.' });
        }

        const [emailExists, usernameExists] = await Promise.all([
            User.exists({ email: normalizedEmail }),
            User.exists({ username: normalizedUsername }),
        ]);
        if (emailExists || usernameExists) {
            return res.status(409).json({
                error: 'Email or username already in use',
                fields: {
                    email: Boolean(emailExists),
                    username: Boolean(usernameExists),
                },
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            email: normalizedEmail,
            username: normalizedUsername,
            passwordHash,
            lastLoginAt: new Date(),
            prefs: buildDefaultPrefs(),
        });

        const token = sign(user);
        setAuthCookies(res, token);
        return res.status(201).json({ token, user: pick(user) });
    } catch (e) {
        if (isDuplicateKeyError(e)) {
            const initialFields = parseDuplicateFieldsFromError(e);
            const fields = await resolveDuplicateSignupFields({
                email: normalizedEmail,
                username: normalizedUsername,
                initialFields,
            });
            return res.status(409).json({
                error: 'Email or username already in use',
                fields,
            });
        }
        return res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body || {};
        const identifier = normalizeLoginIdentifier(emailOrUsername);
        if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' });

        const query = /@/.test(identifier)
            ? { email: normalizeEmailInput(identifier) }
            : { username: normalizeUsernameInput(identifier) };

        const user = await User.findOne(query);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        user.lastLoginAt = new Date();
        await user.save();

        const token = sign(user);
        setAuthCookies(res, token);
        res.json({ token, user: pick(user) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    clearAuthCookies(res);
    return res.status(200).json({ ok: true });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, currentPasswordConfirm, newPassword } = req.body || {};
        if (!currentPassword || !currentPasswordConfirm || !newPassword) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        if (currentPassword !== currentPasswordConfirm) {
            return res.status(400).json({ error: 'Current passwords do not match' });
        }
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include a letter and a number.' });
        }

        const user = await User.findById(req.auth.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid current password' });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordUpdatedAt = new Date();
        await user.save();

        return res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

function isStrongPassword(value = '') {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(value));
}

// GET /api/auth/me  (cookie auth primary; Authorization header fallback)
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });

        try {
            await applyPendingEntitlementsForUser(PendingEntitlement, user);
        } catch (err) {
            console.error('Failed to apply pending entitlements:', err);
        }
        res.json(pick(user));
    } catch (e) {
        res.status(500).json({ error: 'Failed to load user' });
    }
});

module.exports = router;
