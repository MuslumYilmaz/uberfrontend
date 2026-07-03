const DEFAULT_API_CSP = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
const DEFAULT_HSTS = 'max-age=31536000; includeSubDomains; preload';

function shouldSetHsts(env = process.env) {
    if (String(env.SECURITY_HSTS_ENABLED || '').trim().toLowerCase() === 'true') return true;
    return env.NODE_ENV === 'production';
}

function createSecurityHeadersMiddleware(options = {}) {
    const env = options.env || process.env;
    const contentSecurityPolicy = options.contentSecurityPolicy || DEFAULT_API_CSP;
    const hsts = options.hsts || DEFAULT_HSTS;

    return function securityHeaders(_req, res, next) {
        if (shouldSetHsts(env)) {
            res.setHeader('Strict-Transport-Security', hsts);
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        res.setHeader('Content-Security-Policy', contentSecurityPolicy);
        next();
    };
}

module.exports = {
    DEFAULT_API_CSP,
    DEFAULT_HSTS,
    createSecurityHeadersMiddleware,
    shouldSetHsts,
};
