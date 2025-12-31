const jwt = require('jsonwebtoken');

const { getJwtSecret, getJwtVerifyOptions } = require('../config/jwt');

const ACCESS_TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME || 'access_token';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'csrf_token';

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

function requireAuth(req, res, next) {
    try {
        const { token, via } = getAuthToken(req);
        if (!token) return res.status(401).json({ error: 'Missing token' });

        // Double-submit CSRF protection when SameSite=None and auth is cookie-based.
        if (via === 'cookie' && shouldEnforceCsrf() && isStateChanging(req.method)) {
            const csrfCookie = req?.cookies?.[CSRF_COOKIE];
            const csrfHeader = req.headers['x-csrf-token'];
            const csrf = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
            if (!csrfCookie || !csrf || String(csrf) !== String(csrfCookie)) {
                return res.status(403).json({ error: 'CSRF token missing or invalid' });
            }
        }

        const payload = jwt.verify(token, getJwtSecret(), getJwtVerifyOptions());
        req.auth = { userId: payload.sub, role: payload.role || 'user', via };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth, getBearerToken, getAuthToken };
