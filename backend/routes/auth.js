const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const AuthSession = require('../models/AuthSession');
const AuthAttemptReceipt = require('../models/AuthAttemptReceipt');
const PendingEntitlement = require('../models/PendingEntitlement');
const { applyPendingEntitlementsForUser } = require('../services/billing/pending-entitlements');
const { AUTH_CODES, requireAuth } = require('../middleware/Auth.js');
const { getJwtVerifyOptions, isProd } = require('../config/jwt');
const { resolveAllowedFrontendOrigins, resolveFrontendBase, resolveServerBase } = require('../config/urls');
const { rateLimit, getClientIp } = require('../middleware/rateLimit');
const {
    createAuthSession,
    buildReplayableRefreshTokenForSession,
    findRefreshSession,
    getAccessTokenExpiresIn,
    getRefreshSessionTtlMs,
    parseDurationToMs,
    revokeAllSessionsForUser,
    revokeSessionById,
    rotateAuthSession,
    resolvePasswordVersion,
    signAccessToken,
    verifyAccessToken,
} = require('../services/auth-sessions');

const ACCESS_TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME || 'access_token';
const REFRESH_TOKEN_COOKIE = process.env.REFRESH_COOKIE_NAME || 'refresh_token';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const REFRESH_CODES = {
    missing: 'REFRESH_MISSING',
    invalid: 'REFRESH_INVALID',
};
const AUTH_RATE_LIMIT_CODE = 'AUTH_RATE_LIMITED';
const AUTH_DUPLICATE_CONFLICT_CODE = 'AUTH_DUPLICATE_CONFLICT';
const AUTH_DUPLICATE_PENDING_CODE = 'AUTH_DUPLICATE_PENDING';
const AUTH_CONTEXT_HEADER = 'x-auth-context-id';
const AUTH_REQUEST_HEADER = 'x-auth-request-id';
const AUTH_ATTEMPT_WAIT_RETRIES = 40;
const AUTH_ATTEMPT_WAIT_MS = 50;

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

function cookieBaseOptions() {
    const sameSite = getCookieSameSite();
    const secure = getCookieSecure();
    const domain = getCookieDomain();
    return {
        sameSite,
        secure,
        ...(domain ? { domain } : {}),
    };
}

function accessCookieOptions() {
    const base = cookieBaseOptions();
    const maxAge = parseDurationToMs(getAccessTokenExpiresIn(), 15 * 60 * 1000);
    return {
        ...base,
        path: '/',
        maxAge,
    };
}

function refreshCookieOptions() {
    const base = cookieBaseOptions();
    return {
        ...base,
        path: '/api/auth',
        maxAge: getRefreshSessionTtlMs(),
    };
}

function csrfCookieOptions() {
    const base = cookieBaseOptions();
    return {
        ...base,
        path: '/',
        maxAge: getRefreshSessionTtlMs(),
    };
}

function setAuthCookies(req, res, { accessToken, refreshToken }) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...accessCookieOptions(), httpOnly: true });
    if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...refreshCookieOptions(), httpOnly: true });
    }

    const sameSite = getCookieSameSite();
    if (sameSite === 'none') {
        const existingCsrf = String(req?.cookies?.[CSRF_COOKIE] || '').trim();
        const csrf = existingCsrf || crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE, csrf, { ...csrfCookieOptions(), httpOnly: false });
        return csrf;
    }
    return null;
}

function clearAuthCookies(res) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...accessCookieOptions(), httpOnly: true });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...refreshCookieOptions(), httpOnly: true });
    res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions(), httpOnly: false });
}

function getRefreshTokenFromRequest(req) {
    const raw = req?.cookies?.[REFRESH_TOKEN_COOKIE];
    return typeof raw === 'string' && raw ? raw : null;
}

function shouldEnforceCsrf() {
    return getCookieSameSite() === 'none';
}

function enforceCookieCsrf(req, res) {
    if (!shouldEnforceCsrf()) return true;
    const csrfCookie = req?.cookies?.[CSRF_COOKIE];
    const csrfHeader = req.headers['x-csrf-token'];
    const csrf = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
    if (!csrfCookie || !csrf || String(csrf) !== String(csrfCookie)) {
        res.status(403).json({ code: AUTH_CODES.csrf, error: 'CSRF token missing or invalid' });
        return false;
    }
    return true;
}

async function issueAuthSessionCookies(req, res, user, replayContext = null) {
    if (replayContext) {
        req.authReplayContext = replayContext;
    }
    const { session, refreshToken } = await createAuthSession(AuthSession, user, req);
    delete req.authReplayContext;
    const accessToken = signAccessToken(user, session);
    setAuthCookies(req, res, { accessToken, refreshToken });
    return { accessToken, refreshToken, session };
}

async function rotateAuthSessionCookies(req, res, user, session) {
    const rotated = await rotateAuthSession(AuthSession, session, user, req);
    const accessToken = signAccessToken(user, rotated.session);
    setAuthCookies(req, res, { accessToken, refreshToken: rotated.refreshToken });
    return { accessToken, refreshToken: rotated.refreshToken, session: rotated.session };
}

async function resolveLogoutUserIdFromRequest(req) {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
        const lookup = await findRefreshSession(AuthSession, refreshToken);
        if (lookup.status === 'active' && lookup.session?.userId) {
            return String(lookup.session.userId);
        }
    }

    const accessToken = req?.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!accessToken) return null;
    try {
        const payload = verifyAccessToken(accessToken, getJwtVerifyOptions());
        const userId = String(payload?.sub || '').trim();
        const sessionId = String(payload?.sid || '').trim();
        if (!userId) return null;
        if (sessionId) {
            const session = await AuthSession.findById(sessionId).select('revokedAt expiresAt userId').lean();
            if (!session || session.revokedAt || String(session.userId) !== userId) return null;
            if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) return null;
        }
        return userId;
    } catch {
        return null;
    }
}

function shouldReturnToken(req) {
    const q = req?.query?.returnToken;
    if (q === '1' || q === 'true') return true;
    const h = req?.headers?.['x-return-token'];
    if (h === '1' || h === 'true') return true;
    return false;
}

function normalizeReplayValue(raw, maxLength = 160) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value || value.length > maxLength) return '';
    return value;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAuthAttemptHash(parts) {
    return crypto.createHash('sha256').update(parts.join('\n')).digest('hex');
}

function getAuthAttemptContext(req, action, requestHash) {
    const contextId = normalizeReplayValue(req?.headers?.[AUTH_CONTEXT_HEADER]);
    const requestId = normalizeReplayValue(req?.headers?.[AUTH_REQUEST_HEADER]);
    if (!contextId || !requestId) return null;
    return { action, contextId, requestId, requestHash };
}

async function waitForCompletedAuthAttemptReceipt(action, contextId, requestId, requestHash) {
    for (let attempt = 0; attempt < AUTH_ATTEMPT_WAIT_RETRIES; attempt += 1) {
        const receipt = await AuthAttemptReceipt.findOne({ action, contextId, requestId });
        if (!receipt) return null;
        if (receipt.requestHash !== requestHash) {
            return { conflict: true };
        }
        if (receipt.status === 'completed') {
            return { receipt };
        }
        await sleep(AUTH_ATTEMPT_WAIT_MS);
    }
    return { pending: true };
}

async function reserveAuthAttemptReceipt(req, action, requestHash) {
    const context = getAuthAttemptContext(req, action, requestHash);
    if (!context) return { mode: 'disabled', context: null, receipt: null };

    const existing = await AuthAttemptReceipt.findOne({
        action,
        contextId: context.contextId,
        requestId: context.requestId,
    });
    if (existing) {
        if (existing.requestHash !== requestHash) {
            return { mode: 'conflict', context, receipt: existing };
        }
        if (existing.status === 'completed') {
            return { mode: 'replay', context, receipt: existing };
        }
        const waited = await waitForCompletedAuthAttemptReceipt(action, context.contextId, context.requestId, requestHash);
        if (waited?.conflict) return { mode: 'conflict', context, receipt: existing };
        if (waited?.receipt) return { mode: 'replay', context, receipt: waited.receipt };
        return { mode: 'pending', context, receipt: existing };
    }

    try {
        const receipt = await AuthAttemptReceipt.create({
            action,
            contextId: context.contextId,
            requestId: context.requestId,
            requestHash,
            status: 'pending',
        });
        return { mode: 'reserved', context, receipt };
    } catch (error) {
        if (error?.code !== 11000) throw error;
        const waited = await waitForCompletedAuthAttemptReceipt(action, context.contextId, context.requestId, requestHash);
        if (waited?.conflict) return { mode: 'conflict', context, receipt: null };
        if (waited?.receipt) return { mode: 'replay', context, receipt: waited.receipt };
        return { mode: 'pending', context, receipt: null };
    }
}

async function releaseAuthAttemptReceipt(receipt) {
    if (!receipt?._id) return;
    await AuthAttemptReceipt.deleteOne({ _id: receipt._id });
}

async function completeAuthAttemptReceipt(receipt, response) {
    if (!receipt?._id) return;
    await AuthAttemptReceipt.updateOne(
        { _id: receipt._id },
        {
            $set: {
                status: 'completed',
                statusCode: response.statusCode,
                userId: response.userId,
                sessionId: response.sessionId,
            },
        }
    );
}

function sendAuthSuccess(req, res, statusCode, user, accessToken) {
    return res.status(statusCode).json({
        ...(shouldReturnToken(req) ? { token: accessToken } : { token: accessToken }),
        user: pick(user),
    });
}

async function replayAuthAttemptReceipt(req, res, receipt) {
    if (!receipt?.userId || !receipt?.sessionId) return false;

    const [user, session] = await Promise.all([
        User.findById(receipt.userId),
        AuthSession.findById(receipt.sessionId),
    ]);
    if (!user || !session || session.revokedAt || (session.expiresAt && session.expiresAt.getTime() <= Date.now())) {
        await releaseAuthAttemptReceipt(receipt);
        return false;
    }

    const accessToken = signAccessToken(user, session);
    const refreshToken = buildReplayableRefreshTokenForSession(session, {
        action: receipt.action,
        contextId: receipt.contextId,
        requestId: receipt.requestId,
    });
    setAuthCookies(req, res, { accessToken, refreshToken });
    sendAuthSuccess(req, res, receipt.statusCode || (receipt.action === 'signup' ? 201 : 200), user, accessToken);
    return true;
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

function buildIdentifierKey(req, values) {
    const ip = String(getClientIp(req) || req.ip || 'unknown');
    const normalized = values
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .join('|');
    return normalized ? `${ip}:${normalized}` : ip;
}

const AUTH_LOGIN_WINDOW_MS = Number(process.env.AUTH_LOGIN_WINDOW_MS || 10 * 60 * 1000);
const AUTH_LOGIN_MAX = Number(process.env.AUTH_LOGIN_MAX || 10);
const AUTH_SIGNUP_WINDOW_MS = Number(process.env.AUTH_SIGNUP_WINDOW_MS || 30 * 60 * 1000);
const AUTH_SIGNUP_MAX = Number(process.env.AUTH_SIGNUP_MAX || 6);
const AUTH_REFRESH_WINDOW_MS = Number(process.env.AUTH_REFRESH_WINDOW_MS || 60 * 1000);
const AUTH_REFRESH_MAX = Number(process.env.AUTH_REFRESH_MAX || 30);
const AUTH_OAUTH_START_WINDOW_MS = Number(process.env.AUTH_OAUTH_START_WINDOW_MS || 10 * 60 * 1000);
const AUTH_OAUTH_START_MAX = Number(process.env.AUTH_OAUTH_START_MAX || 20);

const loginRateLimit = rateLimit({
    windowMs: AUTH_LOGIN_WINDOW_MS,
    max: AUTH_LOGIN_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many sign-in attempts. Please wait and try again.',
    keyGenerator: (req) => buildIdentifierKey(req, [normalizeLoginIdentifier(req.body?.emailOrUsername)]),
});

const signupRateLimit = rateLimit({
    windowMs: AUTH_SIGNUP_WINDOW_MS,
    max: AUTH_SIGNUP_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many sign-up attempts. Please wait and try again.',
    keyGenerator: (req) => buildIdentifierKey(req, [
        normalizeEmailInput(req.body?.email),
        normalizeUsernameInput(req.body?.username),
    ]),
});

const refreshRateLimit = rateLimit({
    windowMs: AUTH_REFRESH_WINDOW_MS,
    max: AUTH_REFRESH_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many session refresh attempts. Please sign in again.',
});

const oauthStartRateLimit = rateLimit({
    windowMs: AUTH_OAUTH_START_WINDOW_MS,
    max: AUTH_OAUTH_START_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many OAuth attempts. Please wait and try again.',
});

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

function hasLinkedProvider(user, provider, providerId) {
    return Array.isArray(user?.providers) && user.providers.some((entry) =>
        entry?.provider === provider && String(entry?.providerId || '') === String(providerId || '')
    );
}

async function findUserByProviderIdentity(provider, providerId) {
    const normalizedProviderId = String(providerId || '').trim();
    if (!provider || !normalizedProviderId) return null;
    return User.findOne({
        providers: {
            $elemMatch: {
                provider,
                providerId: normalizedProviderId,
            },
        },
    });
}

async function linkProviderToUser(user, provider, providerId) {
    const normalizedProviderId = String(providerId || '').trim();
    if (!user || !provider || !normalizedProviderId) return user;

    const existingOwner = await findUserByProviderIdentity(provider, normalizedProviderId);
    if (existingOwner && String(existingOwner._id) !== String(user._id)) {
        const error = new Error('This OAuth provider is already linked to another account.');
        error.code = 'OAUTH_PROVIDER_LINK_CONFLICT';
        throw error;
    }

    if (!hasLinkedProvider(user, provider, normalizedProviderId)) {
        user.providers = Array.isArray(user.providers) ? user.providers : [];
        user.providers.push({
            provider,
            providerId: normalizedProviderId,
            linkedAt: new Date(),
        });
    }

    return user;
}

async function maybeUpgradeOAuthEmail(user, trustedEmail) {
    const normalizedTrustedEmail = normalizeEmailInput(trustedEmail);
    if (!user || !normalizedTrustedEmail || isGithubNoreplyEmail(normalizedTrustedEmail)) return user;
    if (!isGithubNoreplyEmail(user.email)) return user;
    if (normalizeEmailInput(user.email) === normalizedTrustedEmail) return user;

    const existingOwner = await User.findOne({ email: normalizedTrustedEmail }).select('_id').lean();
    if (existingOwner && String(existingOwner._id) !== String(user._id)) return user;

    user.email = normalizedTrustedEmail;
    return user;
}

function touchOAuthProfile(user, avatarUrl) {
    if (!user) return user;
    user.avatarUrl = avatarUrl || user.avatarUrl;
    user.lastLoginAt = new Date();
    return user;
}

async function resolveCurrentAuthenticatedUser(req) {
    const accessToken = req?.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!accessToken) return null;

    try {
        const payload = verifyAccessToken(accessToken, getJwtVerifyOptions());
        const user = await User.findById(payload.sub);
        if (!user) return null;
        if ((payload?.pwdv ?? 0) !== resolvePasswordVersion(user)) return null;

        const sessionId = typeof payload?.sid === 'string' && payload.sid ? payload.sid : null;
        if (sessionId) {
            const session = await AuthSession.findById(sessionId).select('revokedAt expiresAt userId').lean();
            if (!session || session.revokedAt || String(session.userId) !== String(user._id)) return null;
            if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) return null;
        }

        return user;
    } catch {
        return null;
    }
}

async function resolveOAuthUser({
    req,
    provider,
    providerId,
    email,
    emailTrusted = false,
    usernameHint,
    avatarUrl,
    allowGithubNoreplyFallback = false,
}) {
    const normalizedProviderId = String(providerId || '').trim();
    const normalizedEmail = normalizeEmailInput(email);
    const currentUser = await resolveCurrentAuthenticatedUser(req);

    let user = await findUserByProviderIdentity(provider, normalizedProviderId);
    if (user) {
        touchOAuthProfile(user, avatarUrl);
        if (emailTrusted) {
            await maybeUpgradeOAuthEmail(user, normalizedEmail);
        }
        await user.save();
        return user;
    }

    if (currentUser) {
        await linkProviderToUser(currentUser, provider, normalizedProviderId);
        if (emailTrusted) {
            await maybeUpgradeOAuthEmail(currentUser, normalizedEmail);
        }
        touchOAuthProfile(currentUser, avatarUrl);
        await currentUser.save();
        return currentUser;
    }

    if (emailTrusted && normalizedEmail && !isGithubNoreplyEmail(normalizedEmail)) {
        user = await User.findOne({ email: normalizedEmail });
        if (user) {
            await linkProviderToUser(user, provider, normalizedProviderId);
            touchOAuthProfile(user, avatarUrl);
            await user.save();
            return user;
        }
    }

    if (allowGithubNoreplyFallback && normalizedEmail && isGithubNoreplyEmail(normalizedEmail)) {
        user = await User.findOne({ email: normalizedEmail });
        if (user) {
            await linkProviderToUser(user, provider, normalizedProviderId);
            touchOAuthProfile(user, avatarUrl);
            await user.save();
            return user;
        }
    }

    user = await createOAuthUserWithUniqueUsername({
        email: normalizedEmail,
        usernameHint,
        avatarUrl,
        provider,
        providerId: normalizedProviderId,
    });
    touchOAuthProfile(user, avatarUrl);
    await user.save();
    return user;
}

function redirectOAuthFailure(res, redirectUri, state, mode, message) {
    if (!redirectUri || !isAllowedRedirectUri(redirectUri)) {
        return res.status(400).send(message || 'OAuth error');
    }

    const dest = new URL(String(redirectUri));
    if (state) dest.searchParams.set('state', String(state));
    if (mode) dest.searchParams.set('mode', String(mode));
    dest.searchParams.set('error', String(message || 'OAuth error'));
    return res.redirect(dest.toString());
}

async function createOAuthUserWithUniqueUsername({ email, usernameHint, avatarUrl, provider, providerId }) {
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
                providers: provider && providerId
                    ? [{ provider, providerId: String(providerId), linkedAt: new Date() }]
                    : [],
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
            providers: provider && providerId
                ? [{ provider, providerId: String(providerId), linkedAt: new Date() }]
                : [],
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

// GET /api/auth/oauth/google/start
router.get('/oauth/google/start', oauthStartRateLimit, (req, res) => {
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
    let redirectUri = '';
    let clientState = '';
    let clientMode = '';
    try {
        const code = String(req.query.code || '');
        const rawState = String(req.query.state || '');
        if (!code || !rawState) return res.status(400).send('Missing code/state');

        const { r, n, s, m } = JSON.parse(fromB64(rawState));
        redirectUri = r;
        clientState = s;
        clientMode = m;
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
        const providerId = String(payload?.sub || '').trim();
        if (!providerId) return res.status(400).send('Missing provider identity');

        const user = await resolveOAuthUser({
            req,
            provider: 'google',
            providerId,
            email,
            emailTrusted: true,
            usernameHint: name,
            avatarUrl,
        });

        await issueAuthSessionCookies(req, res, user);

        const dest = new URL(r);
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('g_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('Google OAuth error:', e);
        return redirectOAuthFailure(res, redirectUri, clientState, clientMode, e?.message || 'OAuth error');
    }
});

// GET /api/auth/oauth/github/start
router.get('/oauth/github/start', oauthStartRateLimit, (req, res) => {
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
    let redirectUri = '';
    let clientState = '';
    let clientMode = '';
    try {
        const code = String(req.query.code || '');
        const rawState = String(req.query.state || '');
        if (!code || !rawState) return res.status(400).send('Missing code/state');

        const { r, n, s, m } = JSON.parse(fromB64(rawState));
        redirectUri = r;
        clientState = s;
        clientMode = m;
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
        const providerId = String(gh?.id || '').trim();
        if (!providerId) return res.status(400).send('Missing provider identity');

        const emailsRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders });
        const emailsPayload = await emailsRes.json();
        const emails = Array.isArray(emailsPayload) ? emailsPayload : [];

        const publicEmail = normalizeEmailInput(gh.email || '');
        const primaryVerified = normalizeEmailInput(emails.find((entry) => entry?.primary && entry?.verified)?.email || '');
        const anyVerified = normalizeEmailInput(emails.find((entry) => entry?.verified)?.email || '');
        const noreplyAlias = normalizeEmailInput(`${gh.id}+${gh.login}@users.noreply.github.com`);
        const trustedEmail = primaryVerified || anyVerified || '';
        const email = trustedEmail || noreplyAlias || publicEmail;
        const emailTrusted = Boolean(trustedEmail) && !isGithubNoreplyEmail(trustedEmail);

        const username = gh.name || gh.login;
        const avatarUrl = gh.avatar_url;
        const user = await resolveOAuthUser({
            req,
            provider: 'github',
            providerId,
            email,
            emailTrusted,
            usernameHint: username,
            avatarUrl,
            allowGithubNoreplyFallback: true,
        });

        await issueAuthSessionCookies(req, res, user);
        const dest = new URL(String(r));
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('gh_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('GitHub OAuth error:', e);
        return redirectOAuthFailure(res, redirectUri, clientState, clientMode, e?.message || 'OAuth error');
    }
});


// POST /api/auth/signup
router.post('/signup', signupRateLimit, async (req, res) => {
    let normalizedEmail = '';
    let normalizedUsername = '';
    let attemptReservation = null;
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

        const requestHash = buildAuthAttemptHash([
            'signup',
            normalizedEmail,
            normalizedUsername,
            String(password),
        ]);
        attemptReservation = await reserveAuthAttemptReceipt(req, 'signup', requestHash);
        if (attemptReservation.mode === 'conflict') {
            return res.status(409).json({
                code: AUTH_DUPLICATE_CONFLICT_CODE,
                error: 'This sign-up request conflicts with a pending authentication attempt.',
            });
        }
        if (attemptReservation.mode === 'pending') {
            return res.status(409).json({
                code: AUTH_DUPLICATE_PENDING_CODE,
                error: 'This sign-up request is already being processed.',
            });
        }
        if (attemptReservation.mode === 'replay') {
            const replayed = await replayAuthAttemptReceipt(req, res, attemptReservation.receipt);
            if (replayed) return;
        }

        const [emailExists, usernameExists] = await Promise.all([
            User.exists({ email: normalizedEmail }),
            User.exists({ username: normalizedUsername }),
        ]);
        if (emailExists || usernameExists) {
            await releaseAuthAttemptReceipt(attemptReservation?.receipt);
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

        const { accessToken, session } = await issueAuthSessionCookies(
            req,
            res,
            user,
            attemptReservation?.mode === 'reserved'
                ? {
                    action: 'signup',
                    contextId: attemptReservation.context.contextId,
                    requestId: attemptReservation.context.requestId,
                }
                : null
        );
        await completeAuthAttemptReceipt(attemptReservation?.receipt, {
            statusCode: 201,
            userId: user._id,
            sessionId: session._id,
        });
        return sendAuthSuccess(req, res, 201, user, accessToken);
    } catch (e) {
        await releaseAuthAttemptReceipt(attemptReservation?.receipt);
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
router.post('/login', loginRateLimit, async (req, res) => {
    let attemptReservation = null;
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

        const requestHash = buildAuthAttemptHash([
            'login',
            /@/.test(identifier) ? normalizeEmailInput(identifier) : normalizeUsernameInput(identifier),
            String(password),
        ]);
        attemptReservation = await reserveAuthAttemptReceipt(req, 'login', requestHash);
        if (attemptReservation.mode === 'conflict') {
            return res.status(409).json({
                code: AUTH_DUPLICATE_CONFLICT_CODE,
                error: 'This sign-in request conflicts with a pending authentication attempt.',
            });
        }
        if (attemptReservation.mode === 'pending') {
            return res.status(409).json({
                code: AUTH_DUPLICATE_PENDING_CODE,
                error: 'This sign-in request is already being processed.',
            });
        }
        if (attemptReservation.mode === 'replay') {
            const replayed = await replayAuthAttemptReceipt(req, res, attemptReservation.receipt);
            if (replayed) return;
        }

        user.lastLoginAt = new Date();
        await user.save();

        const { accessToken, session } = await issueAuthSessionCookies(
            req,
            res,
            user,
            attemptReservation?.mode === 'reserved'
                ? {
                    action: 'login',
                    contextId: attemptReservation.context.contextId,
                    requestId: attemptReservation.context.requestId,
                }
                : null
        );
        await completeAuthAttemptReceipt(attemptReservation?.receipt, {
            statusCode: 200,
            userId: user._id,
            sessionId: session._id,
        });
        return sendAuthSuccess(req, res, 200, user, accessToken);
    } catch (e) {
        await releaseAuthAttemptReceipt(attemptReservation?.receipt);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/refresh
router.post('/refresh', refreshRateLimit, async (req, res) => {
    try {
        if (!enforceCookieCsrf(req, res)) return;

        const refreshToken = getRefreshTokenFromRequest(req);
        if (!refreshToken) {
            clearAuthCookies(res);
            return res.status(401).json({ code: REFRESH_CODES.missing, error: 'Missing refresh token' });
        }

        const lookup = await findRefreshSession(AuthSession, refreshToken);
        if (lookup.status !== 'active' || !lookup.session) {
            clearAuthCookies(res);
            return res.status(401).json({ code: REFRESH_CODES.invalid, error: 'Invalid or expired refresh session' });
        }

        const user = await User.findById(lookup.session.userId);
        if (!user) {
            await revokeSessionById(AuthSession, lookup.session._id, 'missing_user');
            clearAuthCookies(res);
            return res.status(401).json({ code: REFRESH_CODES.invalid, error: 'Invalid or expired refresh session' });
        }

        if ((lookup.session.passwordVersion || 0) !== resolvePasswordVersion(user)) {
            await revokeSessionById(AuthSession, lookup.session._id, 'password_changed');
            clearAuthCookies(res);
            return res.status(401).json({ code: REFRESH_CODES.invalid, error: 'Invalid or expired refresh session' });
        }

        const { accessToken } = await rotateAuthSessionCookies(req, res, user, lookup.session);
        return res.json({ ok: true, token: accessToken });
    } catch (e) {
        clearAuthCookies(res);
        return res.status(500).json({ error: 'Failed to refresh session' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    if (!enforceCookieCsrf(req, res)) return;
    const userId = await resolveLogoutUserIdFromRequest(req);
    if (userId) {
        await revokeAllSessionsForUser(AuthSession, userId, 'logout');
    }
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
        await revokeAllSessionsForUser(AuthSession, user._id, 'password_changed');
        await issueAuthSessionCookies(req, res, user);

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
