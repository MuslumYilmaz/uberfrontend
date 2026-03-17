const { getJwtVerifyOptions } = require('../config/jwt');
const AuthSession = require('../models/AuthSession');
const User = require('../models/User');
const { verifyAccessToken } = require('../services/auth-sessions');

const ACCESS_TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME || 'access_token';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const AUTH_CODES = {
    missing: 'AUTH_MISSING',
    invalid: 'AUTH_INVALID',
    csrf: 'AUTH_CSRF_INVALID',
};

function isStateChanging(method = '') {
    const m = String(method).toUpperCase();
    return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

function shouldEnforceCsrf() {
    return String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase() === 'none';
}

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
    const raw = user?.passwordUpdatedAt;
    if (!raw) return 0;
    const date = raw instanceof Date ? raw : new Date(raw);
    const ts = date.getTime();
    return Number.isFinite(ts) ? ts : 0;
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

        // Double-submit CSRF protection when SameSite=None and auth is cookie-based.
        if (via === 'cookie' && shouldEnforceCsrf() && isStateChanging(req.method)) {
            const csrfCookie = req?.cookies?.[CSRF_COOKIE];
            const csrfHeader = req.headers['x-csrf-token'];
            const csrf = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
            if (!csrfCookie || !csrf || String(csrf) !== String(csrfCookie)) {
                return sendAuthError(res, 403, AUTH_CODES.csrf, 'CSRF token missing or invalid');
            }
        }

        const payload = verifyAccessToken(token, getJwtVerifyOptions());
        const user = await User.findById(payload.sub).select('passwordUpdatedAt role').lean();
        if (!user) return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
        if (!isTokenFreshEnoughForPasswordVersion(payload, user)) {
            return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
        }

        const sessionId = typeof payload?.sid === 'string' && payload.sid ? payload.sid : null;
        if (sessionId) {
            const session = await AuthSession.findById(sessionId).select('revokedAt expiresAt userId').lean();
            if (!session || session.revokedAt || String(session.userId) !== String(payload.sub)) {
                return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
            }
            if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
                return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
            }
        }

        req.auth = { userId: payload.sub, role: user.role || 'user', via, sessionId };
        next();
    } catch (e) {
        return sendAuthError(res, 401, AUTH_CODES.invalid, 'Invalid or expired token');
    }
}

module.exports = { requireAuth, getBearerToken, getAuthToken, AUTH_CODES };
