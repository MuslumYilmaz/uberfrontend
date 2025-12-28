function getClientIp(req) {
    const trustProxy = String(process.env.TRUST_PROXY || '').toLowerCase() === 'true';
    if (trustProxy) {
        const xf = req.headers['x-forwarded-for'];
        if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
    }
    return req.ip;
}

function rateLimit({ windowMs, max, keyGenerator, message }) {
    const hits = new Map(); // key -> { count, resetAt }
    const msg = message || 'Too many requests';
    const windowMsSafe = Math.max(1000, Number(windowMs) || 60_000);
    const maxSafe = Math.max(1, Number(max) || 60);
    const keyFn = typeof keyGenerator === 'function' ? keyGenerator : (req) => getClientIp(req);

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const key = String(keyFn(req) || '');
        const entry = hits.get(key);

        if (!entry || now >= entry.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMsSafe });
            return next();
        }

        entry.count += 1;

        if (entry.count > maxSafe) {
            const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSec));
            return res.status(429).json({ error: msg });
        }

        // Opportunistic cleanup to avoid unbounded growth
        if (hits.size > 10_000 && Math.random() < 0.01) {
            for (const [k, v] of hits) {
                if (now >= v.resetAt) hits.delete(k);
            }
        }

        return next();
    };
}

module.exports = { rateLimit, getClientIp };
