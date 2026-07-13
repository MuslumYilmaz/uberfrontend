const { getJwtVerifyOptions } = require('../config/jwt');
const AuthSession = require('../models/AuthSession');
const User = require('../models/User');
const { resolvePasswordVersion, verifyAccessToken } = require('../services/auth-sessions');
const {
    getCachedAuthValidation,
    setCachedAuthValidation,
} = require('../services/auth-validation-cache');
const { ACCESS_TOKEN_COOKIE } = require('../config/auth-cookies');
const { isStateChanging, validateCookieCsrf } = require('./Csrf');

const AUTH_CODES = {
    missing: 'AUTH_MISSING',
    invalid: 'AUTH_INVALID',
    csrf: 'AUTH_CSRF_INVALID',
};

function getBearerToken(req) {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : null;
}

function getCookieToken(req) {
    const t = req?.cookies?.[ACCESS_TOKEN_COOKIE];
    return typeof t === 'string' && t ? t : null;
}

function getAuthToken(req) {
    const cookie = getCookieToken(req);
    if (cookie) return { token: cookie, via: 'cookie' };
    const bearer = getBearerToken(req);
    if (bearer) return { token: bearer, via: 'bearer' };
    return { token: null, via: null };
}

function getTokenPasswordVersion(payload) {
    const raw = payload?.pwdv;
    if (raw == null || raw === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
}

function getUserPasswordVersion(user) {
    return resolvePasswordVersion(user);
}

function isTokenFreshEnoughForPasswordVersion(payload, user) {
    const currentPasswordVersion = getUserPasswordVersion(user);
    if (!currentPasswordVersion) return true;

    const tokenPasswordVersion = getTokenPasswordVersion(payload);
    if (tokenPasswordVersion != null) {
        return tokenPasswordVersion === currentPasswordVersion;
    }

    // Legacy fallback for tokens minted before password-version claims existed.
    const tokenIssuedAtSec = Number(payload?.iat);
    if (!Number.isFinite(tokenIssuedAtSec)) return false;
    return tokenIssuedAtSec >= Math.floor(currentPasswordVersion / 1000);
}

function sendAuthError(res, status, code, error) {
    return res.status(status).json({ code, error });
}

async function requireAuth(req, res, next) {
    try {
        const { token, via } = getAuthToken(req);
        if (!token) return sendAuthError(res, 401, AUTH_CODES.missing, 'Missing token');

        // Keep defense in depth for routers that compose requireAuth directly.
        if (via === 'cookie' && isStateChanging(req.method) && !validateCookieCsrf(req, res)) {
            return undefined;
        }

        const payload = verifyAccessToken(token, getJwtVerifyOptions());
        const cached = getCachedAuthValidation(token);
        if (cached && cached.userId === payload.sub) {
            req.auth = {
                userId: cached.userId,
                role: cached.role || 'user',
                via,
                sessionId: cached.sessionId || null,
            };
            return next();
        }

        const user = await User.findById(payload.sub).select('passwordUpdatedAt authInvalidatedAt role').lean();
        if (!user) return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
        if (!isTokenFreshEnoughForPasswordVersion(payload, user)) {
            return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
        }

        const sessionId = typeof payload?.sid === 'string' && payload.sid ? payload.sid : null;
        if (sessionId) {
            const session = await AuthSession.findById(sessionId).select('revokedAt expiresAt userId passwordVersion').lean();
            if (!session || session.revokedAt || String(session.userId) !== String(payload.sub)) {
                return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
            }
            if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
                return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
            }
            if (Number(session.passwordVersion || 0) !== getUserPasswordVersion(user)) {
                return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
            }
        }

        req.auth = { userId: payload.sub, role: user.role || 'user', via, sessionId };
        setCachedAuthValidation(token, req.auth);
        next();
    } catch (e) {
        return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
    }
}

module.exports = { requireAuth, getBearerToken, getAuthToken, AUTH_CODES };
