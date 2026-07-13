'use strict';

const crypto = require('crypto');
const {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    CSRF_COOKIE,
    csrfCookieOptions,
} = require('../config/auth-cookies');

const AUTH_CSRF_CODE = 'AUTH_CSRF_INVALID';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isStateChanging(method = '') {
    return UNSAFE_METHODS.has(String(method).toUpperCase());
}

function getCsrfHeader(req) {
    const raw = req?.headers?.['x-csrf-token'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' ? value.trim() : '';
}

function getCsrfCookie(req) {
    // Keep the conventional property explicit so CodeQL can model this custom
    // double-submit middleware even when CSRF_COOKIE_NAME is configurable.
    const conventional = req?.cookies?.csrf_token;
    const configured = req?.cookies?.[CSRF_COOKIE];
    const value = configured || conventional;
    return typeof value === 'string' ? value.trim() : '';
}

function csrfTokensEqual(cookieToken, headerToken) {
    if (!cookieToken || !headerToken) return false;
    const left = Buffer.from(String(cookieToken));
    const right = Buffer.from(String(headerToken));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function hasCookieAuth(req) {
    return Boolean(
        req?.cookies?.[ACCESS_TOKEN_COOKIE] ||
        req?.cookies?.[REFRESH_TOKEN_COOKIE]
    );
}

function ensureCsrfCookie(req, res) {
    const existing = getCsrfCookie(req);
    if (existing) return existing;

    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
    if (req?.cookies) req.cookies[CSRF_COOKIE] = token;
    return token;
}

function rejectCsrf(res) {
    return res.status(403).json({
        code: AUTH_CSRF_CODE,
        error: 'CSRF token missing or invalid',
    });
}

function validateCookieCsrfValues(req, res, cookieToken, headerToken) {
    if (req.csrfValidated === true) return true;
    if (!hasCookieAuth(req)) return true;

    const cookieValue = Array.isArray(cookieToken) ? cookieToken[0] : cookieToken;
    const headerValue = Array.isArray(headerToken) ? headerToken[0] : headerToken;
    const csrfCookie = typeof cookieValue === 'string' ? cookieValue.trim() : '';
    const csrfHeader = typeof headerValue === 'string' ? headerValue.trim() : '';
    if (!csrfTokensEqual(csrfCookie, csrfHeader)) {
        rejectCsrf(res);
        return false;
    }

    req.csrfValidated = true;
    return true;
}

function validateCookieCsrf(req, res) {
    return validateCookieCsrfValues(req, res, getCsrfCookie(req), getCsrfHeader(req));
}

function cookieCsrfProtection(req, res, next) {
    if (!hasCookieAuth(req)) return next();

    if (!isStateChanging(req.method)) {
        ensureCsrfCookie(req, res);
        return next();
    }

    // Keep the CSRF-named cookie/header reads in the route middleware so static
    // analysis and human reviewers can follow the double-submit check directly.
    if (!validateCookieCsrfValues(
        req,
        res,
        req?.cookies?.csrf_token || req?.cookies?.[CSRF_COOKIE],
        req?.headers?.['x-csrf-token']
    )) return undefined;
    return next();
}

module.exports = {
    AUTH_CSRF_CODE,
    cookieCsrfProtection,
    csrfTokensEqual,
    ensureCsrfCookie,
    getCsrfCookie,
    getCsrfHeader,
    hasCookieAuth,
    isStateChanging,
    validateCookieCsrf,
    validateCookieCsrfValues,
};
