'use strict';

const net = require('net');
const { isProd } = require('./jwt');
const { resolveFrontendBase, resolveServerBase } = require('./urls');
const {
    getAccessTokenExpiresIn,
    getRefreshSessionTtlMs,
    parseDurationToMs,
} = require('../services/auth-sessions');

const ACCESS_TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME || 'access_token';
const REFRESH_TOKEN_COOKIE = process.env.REFRESH_COOKIE_NAME || 'refresh_token';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'csrf_token';

function getCookieSameSite() {
    const raw = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
    if (raw === 'lax' || raw === 'strict' || raw === 'none') return raw;
    return 'lax';
}

function getCookieSecure() {
    const raw = String(process.env.COOKIE_SECURE || '').toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return isProd();
}

function getCookieDomain() {
    const explicit = String(process.env.COOKIE_DOMAIN || '').trim();
    if (explicit) return explicit;

    try {
        const host = new URL(resolveFrontendBase() || resolveServerBase() || '').hostname || '';
        const normalizedHost = host.replace(/^\[|\]$/g, '').toLowerCase();
        if (
            !normalizedHost ||
            normalizedHost === 'localhost' ||
            normalizedHost.endsWith('.localhost') ||
            net.isIP(normalizedHost)
        ) {
            return undefined;
        }
        const parts = normalizedHost.replace(/^www\./, '').split('.');
        if (parts.length < 2) return undefined;
        return `.${parts.slice(-2).join('.')}`;
    } catch {
        return undefined;
    }
}

function cookieBaseOptions() {
    const domain = getCookieDomain();
    return {
        sameSite: getCookieSameSite(),
        secure: getCookieSecure(),
        ...(domain ? { domain } : {}),
    };
}

function accessCookieOptions() {
    return {
        ...cookieBaseOptions(),
        path: '/',
        maxAge: parseDurationToMs(getAccessTokenExpiresIn(), 15 * 60 * 1000),
    };
}

function refreshCookieOptions() {
    return {
        ...cookieBaseOptions(),
        path: '/api/auth',
        maxAge: getRefreshSessionTtlMs(),
    };
}

function csrfCookieOptions() {
    return {
        ...cookieBaseOptions(),
        path: '/',
        maxAge: getRefreshSessionTtlMs(),
        httpOnly: false,
    };
}

module.exports = {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    CSRF_COOKIE,
    accessCookieOptions,
    refreshCookieOptions,
    csrfCookieOptions,
    getCookieDomain,
    getCookieSameSite,
    getCookieSecure,
};
