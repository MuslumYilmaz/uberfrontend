const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const AuthSession = require('../models/AuthSession');
const AuthAttemptReceipt = require('../models/AuthAttemptReceipt');
const EmailVerification = require('../models/EmailVerification');
const OAuthIdentity = require('../models/OAuthIdentity');
const PendingEntitlement = require('../models/PendingEntitlement');
const { applyPendingEntitlementsForUser } = require('../services/billing/pending-entitlements');
const { requireAuth } = require('../middleware/Auth.js');
const { getJwtSecret, getJwtVerifyOptions, isProd } = require('../config/jwt');
const { resolveAllowedFrontendOrigins, resolveFrontendBase, resolveServerBase } = require('../config/urls');
const { rateLimit, getClientIp } = require('../middleware/rateLimit');
const { validateCookieCsrf } = require('../middleware/Csrf');
const {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    CSRF_COOKIE,
    accessCookieOptions,
    refreshCookieOptions,
    csrfCookieOptions,
} = require('../config/auth-cookies');
const {
    createAndSendVerification,
    hashVerificationToken,
    isValidEmail,
    normalizeEmail,
} = require('../services/email-verification');
const {
    createAuthSession,
    buildReplayableRefreshTokenForSession,
    findRefreshSession,
    revokeAllSessionsForUser,
    revokeOtherSessionsForUser,
    revokeSessionById,
    rotateAuthSession,
    resolvePasswordVersion,
    signAccessToken,
    verifyAccessToken,
} = require('../services/auth-sessions');
const { clearAuthValidationCacheForUser } = require('../services/auth-validation-cache');
const { claimOAuthIdentity, findOAuthIdentityUser } = require('../services/oauth-identities');

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
const EMAIL_CHANGE_FINALIZATION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_CHANGE_FINALIZATION_LEASE_MS = 2 * 60 * 1000;

function setAuthCookies(req, res, { accessToken, refreshToken }) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...accessCookieOptions(), httpOnly: true });
    if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...refreshCookieOptions(), httpOnly: true });
    }

    const existingCsrf = String(req?.cookies?.[CSRF_COOKIE] || '').trim();
    const csrf = existingCsrf || crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, csrf, csrfCookieOptions());
    return csrf;
}

function clearAuthCookies(res) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...accessCookieOptions(), httpOnly: true });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...refreshCookieOptions(), httpOnly: true });
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
}

function getRefreshTokenFromRequest(req) {
    const raw = req?.cookies?.[REFRESH_TOKEN_COOKIE];
    return typeof raw === 'string' && raw ? raw : null;
}

function enforceCookieCsrf(req, res) {
    return validateCookieCsrf(req, res);
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

async function finalizeEmailChangeSession(req, res, user, verification) {
    const leaseToken = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const lease = await EmailVerification.findOneAndUpdate(
        {
            _id: verification._id,
            userId: user._id,
            consumedAt: verification.consumedAt,
            finalizedAt: null,
            supersededAt: null,
            $or: [
                { finalizationLeaseToken: null },
                { finalizationLeaseExpiresAt: { $lte: now } },
            ],
        },
        {
            $set: {
                finalizationLeaseToken: leaseToken,
                finalizationLeaseExpiresAt: new Date(now.getTime() + EMAIL_CHANGE_FINALIZATION_LEASE_MS),
            },
        },
        { new: true }
    );
    if (!lease) {
        const error = new Error('Email change session finalization is already in progress.');
        error.code = 'EMAIL_VERIFICATION_PENDING';
        error.status = 409;
        throw error;
    }

    try {
        const { session } = await issueAuthSessionCookies(req, res, user);
        await revokeOtherSessionsForUser(AuthSession, user._id, session._id, 'email_changed');
        const finalized = await EmailVerification.updateOne(
            {
                _id: verification._id,
                finalizationLeaseToken: leaseToken,
                finalizedAt: null,
                supersededAt: null,
            },
            {
                $set: { finalizedAt: new Date() },
                $unset: { finalizationLeaseToken: 1, finalizationLeaseExpiresAt: 1 },
            }
        );
        if (finalized.matchedCount !== 1) {
            throw new Error('Email change session finalization lost its lease.');
        }
    } catch (error) {
        try {
            await EmailVerification.updateOne(
                {
                    _id: verification._id,
                    finalizationLeaseToken: leaseToken,
                    finalizedAt: null,
                    supersededAt: null,
                },
                { $unset: { finalizationLeaseToken: 1, finalizationLeaseExpiresAt: 1 } }
            );
        } catch (releaseError) {
            console.error('Failed to release email change finalization lease:', releaseError);
        }
        throw error;
    }
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

const AUTH_ATTEMPT_HMAC_CONTEXT = 'frontendatlas:auth-attempt:v1';
const AUTH_ATTEMPT_HMAC_PREFIX = 'hmac-sha256-v1:';
const OAUTH_STATE_HMAC_CONTEXT = 'frontendatlas:oauth-state:v1';
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

function deriveContextKey(context) {
    return crypto.createHmac('sha256', getJwtSecret()).update(context).digest();
}

function buildAuthAttemptHashes(parts) {
    const canonical = JSON.stringify(parts.map((part) => String(part)));
    const digest = crypto
        .createHmac('sha256', deriveContextKey(AUTH_ATTEMPT_HMAC_CONTEXT))
        .update(canonical)
        .digest('hex');
    return {
        current: `${AUTH_ATTEMPT_HMAC_PREFIX}${digest}`,
        legacy: crypto.createHash('sha256').update(parts.join('\n')).digest('hex'),
    };
}

function timingSafeStringEqual(left, right) {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function authAttemptHashMatches(stored, hashes) {
    if (String(stored || '').startsWith(AUTH_ATTEMPT_HMAC_PREFIX)) {
        return timingSafeStringEqual(stored, hashes.current);
    }
    return /^[a-f0-9]{64}$/i.test(String(stored || '')) && timingSafeStringEqual(stored, hashes.legacy);
}

function getAuthAttemptContext(req, action, requestHash) {
    const contextId = normalizeReplayValue(req?.headers?.[AUTH_CONTEXT_HEADER]);
    const requestId = normalizeReplayValue(req?.headers?.[AUTH_REQUEST_HEADER]);
    if (!contextId || !requestId) return null;
    return { action, contextId, requestId, requestHash };
}

async function waitForCompletedAuthAttemptReceipt(action, contextId, requestId, requestHashes) {
    for (let attempt = 0; attempt < AUTH_ATTEMPT_WAIT_RETRIES; attempt += 1) {
        const receipt = await AuthAttemptReceipt.findOne({ action, contextId, requestId });
        if (!receipt) return null;
        if (!authAttemptHashMatches(receipt.requestHash, requestHashes)) {
            return { conflict: true };
        }
        if (receipt.status === 'completed') {
            return { receipt };
        }
        await sleep(AUTH_ATTEMPT_WAIT_MS);
    }
    return { pending: true };
}

async function reserveAuthAttemptReceipt(req, action, requestHashes) {
    const context = getAuthAttemptContext(req, action, requestHashes.current);
    if (!context) return { mode: 'disabled', context: null, receipt: null };

    const existing = await AuthAttemptReceipt.findOne({
        action,
        contextId: context.contextId,
        requestId: context.requestId,
    });
    if (existing) {
        if (!authAttemptHashMatches(existing.requestHash, requestHashes)) {
            return { mode: 'conflict', context, receipt: existing };
        }
        if (existing.status === 'completed') {
            return { mode: 'replay', context, receipt: existing };
        }
        const waited = await waitForCompletedAuthAttemptReceipt(action, context.contextId, context.requestId, requestHashes);
        if (waited?.conflict) return { mode: 'conflict', context, receipt: existing };
        if (waited?.receipt) return { mode: 'replay', context, receipt: waited.receipt };
        return { mode: 'pending', context, receipt: existing };
    }

    try {
        const receipt = await AuthAttemptReceipt.create({
            action,
            contextId: context.contextId,
            requestId: context.requestId,
            requestHash: requestHashes.current,
            status: 'pending',
        });
        return { mode: 'reserved', context, receipt };
    } catch (error) {
        if (error?.code !== 11000) throw error;
        const waited = await waitForCompletedAuthAttemptReceipt(action, context.contextId, context.requestId, requestHashes);
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
    if (Number(session.passwordVersion || 0) !== resolvePasswordVersion(user)) {
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

function signOAuthState(payload) {
    const encoded = b64(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', deriveContextKey(OAUTH_STATE_HMAC_CONTEXT))
        .update(encoded)
        .digest('base64url');
    return `${encoded}.${signature}`;
}

function readOAuthState(rawState) {
    const [encoded, signature, extra] = String(rawState || '').split('.');
    if (!encoded || !signature || extra) throw new Error('Bad state');
    const expected = crypto
        .createHmac('sha256', deriveContextKey(OAUTH_STATE_HMAC_CONTEXT))
        .update(encoded)
        .digest('base64url');
    if (!timingSafeStringEqual(signature, expected)) throw new Error('Bad state');
    const payload = JSON.parse(fromB64(encoded));
    const issuedAt = Number(payload?.iat || 0);
    if (!Number.isFinite(issuedAt) || issuedAt <= 0 || Date.now() - issuedAt > OAUTH_STATE_MAX_AGE_MS || issuedAt > Date.now() + 30_000) {
        throw new Error('Expired state');
    }
    return payload;
}

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
    return ['login', 'signup', 'link'].includes(String(m || '')) ? String(m) : 'login';
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
const EMAIL_VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

const loginRateLimit = rateLimit({
    name: 'auth-login',
    windowMs: AUTH_LOGIN_WINDOW_MS,
    max: AUTH_LOGIN_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many sign-in attempts. Please wait and try again.',
    keyGenerator: (req) => buildIdentifierKey(req, [normalizeLoginIdentifier(req.body?.emailOrUsername)]),
});

const signupRateLimit = rateLimit({
    name: 'auth-signup',
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
    name: 'auth-refresh',
    windowMs: AUTH_REFRESH_WINDOW_MS,
    max: AUTH_REFRESH_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many session refresh attempts. Please sign in again.',
});

const oauthStartRateLimit = rateLimit({
    name: 'auth-oauth-start',
    windowMs: AUTH_OAUTH_START_WINDOW_MS,
    max: AUTH_OAUTH_START_MAX,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many OAuth attempts. Please wait and try again.',
});

const emailVerificationRequestRateLimit = rateLimit({
    name: 'email-verification-request',
    windowMs: EMAIL_VERIFICATION_WINDOW_MS,
    max: 5,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many verification emails requested. Please wait and try again.',
    keyGenerator: (req) => buildIdentifierKey(req, [req.auth?.userId]),
});

const emailVerificationConfirmRateLimit = rateLimit({
    name: 'email-verification-confirm',
    windowMs: EMAIL_VERIFICATION_WINDOW_MS,
    max: 10,
    code: AUTH_RATE_LIMIT_CODE,
    message: 'Too many verification attempts. Please wait and try again.',
    keyGenerator: (req) => buildIdentifierKey(req, [req.auth?.userId]),
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
    return findOAuthIdentityUser(OAuthIdentity, User, provider, normalizedProviderId);
}

async function linkProviderToUser(user, provider, providerId) {
    const normalizedProviderId = String(providerId || '').trim();
    if (!user || !provider || !normalizedProviderId) return user;

    await claimOAuthIdentity(OAuthIdentity, User, provider, normalizedProviderId, user._id);

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
            const session = await AuthSession.findById(sessionId).select('revokedAt expiresAt userId passwordVersion').lean();
            if (!session || session.revokedAt || String(session.userId) !== String(user._id)) return null;
            if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) return null;
            if (Number(session.passwordVersion || 0) !== resolvePasswordVersion(user)) return null;
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
    mode = 'login',
    linkUserId = '',
}) {
    const normalizedProviderId = String(providerId || '').trim();
    const normalizedEmail = normalizeEmailInput(email);
    let user = await findUserByProviderIdentity(provider, normalizedProviderId);

    if (mode === 'link') {
        const currentUser = await resolveCurrentAuthenticatedUser(req);
        if (!currentUser || String(currentUser._id) !== String(linkUserId || '')) {
            const error = new Error('Your sign-in session changed. Start the account link again.');
            error.code = 'OAUTH_LINK_SESSION_MISMATCH';
            throw error;
        }
        if (user && String(user._id) !== String(currentUser._id)) {
            const error = new Error('This OAuth provider is already linked to another account.');
            error.code = 'OAUTH_PROVIDER_LINK_CONFLICT';
            throw error;
        }
        await linkProviderToUser(currentUser, provider, normalizedProviderId);
        if (emailTrusted && normalizedEmail === normalizeEmailInput(currentUser.email)) {
            currentUser.emailVerifiedAt = currentUser.emailVerifiedAt || new Date();
        }
        touchOAuthProfile(currentUser, avatarUrl);
        await currentUser.save();
        return currentUser;
    }

    if (user) {
        await linkProviderToUser(user, provider, normalizedProviderId);
        touchOAuthProfile(user, avatarUrl);
        if (emailTrusted && normalizedEmail === normalizeEmailInput(user.email)) {
            user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        }
        await user.save();
        return user;
    }

    if (normalizedEmail && await User.exists({ email: normalizedEmail })) {
        const error = new Error('An account already uses this email. Sign in with your password, then link the provider from Security.');
        error.code = 'OAUTH_EMAIL_CONFLICT';
        throw error;
    }

    user = await createOAuthUserWithUniqueUsername({
        email: normalizedEmail,
        usernameHint,
        avatarUrl,
        provider,
        providerId: normalizedProviderId,
        emailVerified: emailTrusted,
    });
    await linkProviderToUser(user, provider, normalizedProviderId);
    touchOAuthProfile(user, avatarUrl);
    await user.save();
    return user;
}

function redirectOAuthFailure(res, redirectUri, state, mode, error) {
    const message = error?.message || String(error || 'OAuth error');
    if (!redirectUri || !isAllowedRedirectUri(redirectUri)) {
        return res.status(400).send(message || 'OAuth error');
    }

    const dest = new URL(String(redirectUri));
    if (state) dest.searchParams.set('state', String(state));
    if (mode) dest.searchParams.set('mode', String(mode));
    dest.searchParams.set('error', String(message || 'OAuth error'));
    if (error?.code) dest.searchParams.set('code', String(error.code));
    return res.redirect(dest.toString());
}

async function createOAuthUserWithUniqueUsername({ email, usernameHint, avatarUrl, provider, providerId, emailVerified = false }) {
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
                emailVerifiedAt: emailVerified ? new Date() : null,
                username: candidate,
                avatarUrl: avatarUrl || undefined,
                passwordHash,
                lastLoginAt: new Date(),
                prefs: buildDefaultPrefs(),
                providers: [],
            });
        } catch (e) {
            if (!isDuplicateKeyError(e)) throw e;
            const fields = parseDuplicateFieldsFromError(e);

            if (fields.email) {
                const conflict = new Error('An account already uses this email. Sign in with your password, then link the provider from Security.');
                conflict.code = 'OAUTH_EMAIL_CONFLICT';
                throw conflict;
            }
            if (fields.username || !hasDuplicateField(fields)) continue;
        }
    }

    const fallbackUsername = `${usernameBase.slice(0, Math.max(1, OAUTH_USERNAME_MAX_BASE_LENGTH - 7))}_${crypto.randomBytes(3).toString('hex')}`;
    try {
        return await User.create({
            email: normalizedEmail,
            emailVerifiedAt: emailVerified ? new Date() : null,
            username: fallbackUsername,
            avatarUrl: avatarUrl || undefined,
            passwordHash,
            lastLoginAt: new Date(),
            prefs: buildDefaultPrefs(),
            providers: [],
        });
    } catch (e) {
        if (!isDuplicateKeyError(e)) throw e;
        const fields = parseDuplicateFieldsFromError(e);
        if (fields.email) {
            const conflict = new Error('An account already uses this email. Sign in with your password, then link the provider from Security.');
            conflict.code = 'OAUTH_EMAIL_CONFLICT';
            throw conflict;
        }
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
        emailVerified: Boolean(u.emailVerifiedAt),
        pendingEmail: u.pendingEmail || null,
        linkedProviders: Array.from(new Set(
            (Array.isArray(u.providers) ? u.providers : [])
                .map((entry) => entry?.provider)
                .filter((provider) => provider === 'google' || provider === 'github')
        )),
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

// POST /api/auth/email-verification/request
router.post(
    '/email-verification/request',
    requireAuth,
    emailVerificationRequestRateLimit,
    async (req, res) => {
        try {
            if (!enforceCookieCsrf(req, res)) return;
            const user = await User.findById(req.auth.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const targetEmail = normalizeEmail(req.body?.email || user.email);
            if (!isValidEmail(targetEmail)) {
                return res.status(400).json({ code: 'INVALID_EMAIL', error: 'Please provide a valid email address.' });
            }

            const changingEmail = targetEmail !== normalizeEmail(user.email);
            if (changingEmail) {
                const existing = await User.exists({ email: targetEmail, _id: { $ne: user._id } });
                if (existing) {
                    return res.status(409).json({ code: 'EMAIL_IN_USE', error: 'That email address is already in use.' });
                }
                user.pendingEmail = targetEmail;
                await user.save();
            }

            const result = await createAndSendVerification(EmailVerification, user, targetEmail);
            return res.json({ ok: true, purpose: result.purpose, expiresAt: result.expiresAt });
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return res.status(503).json({ code: 'EMAIL_DELIVERY_FAILED', error: 'Verification email could not be sent. Please try again.' });
        }
    }
);

// POST /api/auth/email-verification/confirm
router.post(
    '/email-verification/confirm',
    requireAuth,
    emailVerificationConfirmRateLimit,
    async (req, res) => {
        try {
            if (!enforceCookieCsrf(req, res)) return;
            const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
            if (!token || token.length > 256) {
                return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification link is invalid or expired.' });
            }

            const now = new Date();
            const verification = await EmailVerification.findOne({
                userId: req.auth.userId,
                tokenHash: hashVerificationToken(token),
                $or: [
                    {
                        consumedAt: null,
                        finalizedAt: null,
                        supersededAt: null,
                        expiresAt: { $gt: now },
                    },
                    {
                        purpose: 'change_email',
                        consumedAt: { $ne: null },
                        finalizedAt: null,
                        supersededAt: null,
                        expiresAt: { $gt: now },
                    },
                ],
            });
            if (!verification) {
                return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification link is invalid or expired.' });
            }

            const user = await User.findById(req.auth.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const targetEmail = normalizeEmail(verification.email);
            const finalizationRetry = Boolean(
                verification.purpose === 'change_email' && verification.consumedAt && !verification.finalizedAt
            );

            if (finalizationRetry) {
                if (
                    normalizeEmail(user.email) !== targetEmail ||
                    !user.emailVerifiedAt ||
                    !user.authInvalidatedAt
                ) {
                    return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification finalization state is invalid.' });
                }
                await finalizeEmailChangeSession(req, res, user, verification);
                try {
                    await applyPendingEntitlementsForUser(PendingEntitlement, user);
                } catch (error) {
                    console.error('Failed to apply pending entitlements after email verification:', error);
                }
                return res.json({ ok: true, user: pick(user) });
            }

            if (verification.purpose === 'change_email') {
                if (normalizeEmail(user.pendingEmail) !== targetEmail) {
                    return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification link is no longer active.' });
                }
                const existing = await User.exists({ email: targetEmail, _id: { $ne: user._id } });
                if (existing) {
                    return res.status(409).json({ code: 'EMAIL_IN_USE', error: 'That email address is already in use.' });
                }
            } else if (normalizeEmail(user.email) !== targetEmail) {
                return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification link is no longer active.' });
            }

            const claimAt = new Date();
            const originalExpiresAt = verification.expiresAt;
            const emailChanged = verification.purpose === 'change_email';
            const consumed = await EmailVerification.findOneAndUpdate(
                {
                    _id: verification._id,
                    userId: user._id,
                    consumedAt: null,
                    finalizedAt: null,
                    supersededAt: null,
                    expiresAt: { $gt: claimAt },
                },
                {
                    $set: {
                        consumedAt: claimAt,
                        ...(emailChanged
                            ? { expiresAt: new Date(claimAt.getTime() + EMAIL_CHANGE_FINALIZATION_TTL_MS) }
                            : {}),
                    },
                },
                { new: true }
            );
            if (!consumed) {
                return res.status(400).json({ code: 'EMAIL_VERIFICATION_INVALID', error: 'Verification link is invalid or expired.' });
            }

            if (emailChanged) user.email = targetEmail;
            user.emailVerifiedAt = now;
            user.pendingEmail = null;
            if (emailChanged) {
                // Put the version on the next whole second so even legacy access tokens
                // without a pwdv claim that were minted in this second fail closed.
                user.authInvalidatedAt = new Date((Math.floor(claimAt.getTime() / 1000) + 1) * 1000);
            }
            try {
                await user.save();
            } catch (error) {
                await EmailVerification.updateOne(
                    {
                        _id: verification._id,
                        consumedAt: claimAt,
                        finalizedAt: null,
                        supersededAt: null,
                    },
                    {
                        $set: { consumedAt: null, expiresAt: originalExpiresAt },
                        $unset: {
                            finalizationLeaseToken: 1,
                            finalizationLeaseExpiresAt: 1,
                        },
                    }
                );
                if (isDuplicateKeyError(error)) {
                    return res.status(409).json({ code: 'EMAIL_IN_USE', error: 'That email address is already in use.' });
                }
                throw error;
            }

            if (emailChanged) {
                clearAuthValidationCacheForUser(user._id);
                await finalizeEmailChangeSession(req, res, user, consumed);
            }

            try {
                await applyPendingEntitlementsForUser(PendingEntitlement, user);
            } catch (error) {
                console.error('Failed to apply pending entitlements after email verification:', error);
            }

            return res.json({ ok: true, user: pick(user) });
        } catch (error) {
            console.error('Failed to confirm verification email:', error);
            return res.status(error?.status || 500).json({
                ...(error?.code ? { code: error.code } : {}),
                error: error?.status === 409 ? error.message : 'Failed to verify email',
            });
        }
    }
);

// GET /api/auth/oauth/google/start
router.get('/oauth/google/start', oauthStartRateLimit, async (req, res) => {
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
    const linkUser = mode === 'link' ? await resolveCurrentAuthenticatedUser(req) : null;
    if (mode === 'link' && !linkUser) {
        return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Sign in before linking an account.' });
    }

    const nonce = crypto.randomUUID();
    // store CSRF nonce in cookie for the short hop
    res.cookie('g_csrf', nonce, { httpOnly: true, sameSite: 'lax', secure: isProd(), maxAge: 10 * 60 * 1000 });

    const state = signOAuthState({
        r: redirectParam,
        n: nonce,
        s: clientState,
        m: mode,
        u: linkUser ? String(linkUser._id) : '',
        iat: Date.now(),
    });

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

        const { r, n, s, m, u } = readOAuthState(rawState);
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
        if (payload?.email_verified !== true) {
            const error = new Error('Google email is not verified');
            error.code = 'OAUTH_EMAIL_UNVERIFIED';
            throw error;
        }
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
            mode: m,
            linkUserId: u,
        });

        if (m !== 'link') await issueAuthSessionCookies(req, res, user);

        const dest = new URL(r);
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('g_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('Google OAuth error:', e);
        return redirectOAuthFailure(res, redirectUri, clientState, clientMode, e);
    }
});

// GET /api/auth/oauth/github/start
router.get('/oauth/github/start', oauthStartRateLimit, async (req, res) => {
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
    const linkUser = mode === 'link' ? await resolveCurrentAuthenticatedUser(req) : null;
    if (mode === 'link' && !linkUser) {
        return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Sign in before linking an account.' });
    }

    const nonce = crypto.randomUUID();
    res.cookie('gh_csrf', nonce, { httpOnly: true, sameSite: 'lax', secure: isProd(), maxAge: 10 * 60 * 1000 });
    const state = signOAuthState({
        r: redirectParam,
        n: nonce,
        s: clientState,
        m: mode,
        u: linkUser ? String(linkUser._id) : '',
        iat: Date.now(),
    });

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

        const { r, n, s, m, u } = readOAuthState(rawState);
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

        const primaryVerified = normalizeEmailInput(emails.find((entry) => entry?.primary && entry?.verified)?.email || '');
        const anyVerified = normalizeEmailInput(emails.find((entry) => entry?.verified)?.email || '');
        const trustedEmail = primaryVerified || anyVerified || '';
        if (!trustedEmail || isGithubNoreplyEmail(trustedEmail)) {
            const error = new Error('GitHub account has no verified email');
            error.code = 'OAUTH_EMAIL_UNVERIFIED';
            throw error;
        }

        const username = gh.name || gh.login;
        const avatarUrl = gh.avatar_url;
        const user = await resolveOAuthUser({
            req,
            provider: 'github',
            providerId,
            email: trustedEmail,
            emailTrusted: true,
            usernameHint: username,
            avatarUrl,
            mode: m,
            linkUserId: u,
        });

        if (m !== 'link') await issueAuthSessionCookies(req, res, user);
        const dest = new URL(String(r));
        if (s) dest.searchParams.set('state', String(s));
        if (m) dest.searchParams.set('mode', String(m));
        res.clearCookie('gh_csrf');
        return res.redirect(dest.toString());
    } catch (e) {
        console.error('GitHub OAuth error:', e);
        return redirectOAuthFailure(res, redirectUri, clientState, clientMode, e);
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

        const requestHashes = buildAuthAttemptHashes([
            'signup',
            normalizedEmail,
            normalizedUsername,
            String(password),
        ]);
        attemptReservation = await reserveAuthAttemptReceipt(req, 'signup', requestHashes);
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
        if (process.env.NODE_ENV !== 'test' || process.env.EMAIL_VERIFICATION_AUTO_SEND === 'true') {
            try {
                await createAndSendVerification(EmailVerification, user, user.email);
            } catch (error) {
                // Account/session creation must not depend on SMTP availability.
                console.error('Failed to send signup verification email:', error);
            }
        }
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

        const requestHashes = buildAuthAttemptHashes([
            'login',
            /@/.test(identifier) ? normalizeEmailInput(identifier) : normalizeUsernameInput(identifier),
            String(password),
        ]);
        const existingAttemptContext = getAuthAttemptContext(req, 'login', requestHashes.current);
        if (existingAttemptContext) {
            const existingAttempt = await AuthAttemptReceipt.findOne({
                action: 'login',
                contextId: existingAttemptContext.contextId,
                requestId: existingAttemptContext.requestId,
            });
            if (existingAttempt && !authAttemptHashMatches(existingAttempt.requestHash, requestHashes)) {
                return res.status(409).json({
                    code: AUTH_DUPLICATE_CONFLICT_CODE,
                    error: 'This sign-in request conflicts with a pending authentication attempt.',
                });
            }
        }

        const query = /@/.test(identifier)
            ? { email: normalizeEmailInput(identifier) }
            : { username: normalizeUsernameInput(identifier) };

        const user = await User.findOne(query);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        attemptReservation = await reserveAuthAttemptReceipt(req, 'login', requestHashes);
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
