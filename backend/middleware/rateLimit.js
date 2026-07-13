const crypto = require('crypto');

const redisWarnings = new Set();

function getClientIp(req) {
    return req?.ip || req?.socket?.remoteAddress || 'unknown';
}

function normalizeStoreMode() {
    const raw = String(process.env.RATE_LIMIT_STORE || 'auto').trim().toLowerCase();
    if (['redis', 'upstash', 'remote'].includes(raw)) return 'redis';
    if (['memory', 'local', 'in-memory'].includes(raw)) return 'memory';
    return 'auto';
}

function hasRedisConfig() {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function shouldUseRedis() {
    const mode = normalizeStoreMode();
    if (mode === 'memory') return false;
    if (mode === 'redis') return true;
    return hasRedisConfig();
}

function warnRedisLimiterOnce(key, message) {
    if (redisWarnings.has(key)) return;
    redisWarnings.add(key);
    console.warn(`[rate-limit] ${message}`);
}

function hashKey(value) {
    return crypto
        .createHash('sha256')
        .update(String(value || 'unknown'))
        .digest('hex')
        .slice(0, 32);
}

function safeLimiterName({ name, code, message, windowMs, max }) {
    const raw = String(name || code || message || `limit-${windowMs}-${max}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9:_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return raw || `limit-${windowMs}-${max}`;
}

async function incrementRedis(key, ttlSeconds) {
    if (typeof fetch !== 'function') {
        throw new Error('global fetch is unavailable for Upstash Redis rate limiting');
    }

    const baseUrl = String(process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
    const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '');
    if (!baseUrl || !token) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for Redis rate limiting');
    }

    const response = await fetch(`${baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify([
            ['INCR', key],
            ['EXPIRE', key, ttlSeconds, 'NX'],
            ['TTL', key],
        ]),
    });

    if (!response.ok) {
        throw new Error(`Upstash Redis rate limit request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    const count = Number(payload?.[0]?.result || 0);
    const ttl = Number(payload?.[2]?.result || ttlSeconds);
    return {
        count,
        resetAt: Date.now() + Math.max(1, ttl) * 1000,
    };
}

async function runRedisCommand(command) {
    if (typeof fetch !== 'function') {
        throw new Error('global fetch is unavailable for Upstash Redis rate limiting');
    }

    const baseUrl = String(process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
    const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '');
    if (!baseUrl || !token) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for Redis rate limiting');
    }

    const response = await fetch(`${baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify([command]),
    });

    if (!response.ok) {
        throw new Error(`Upstash Redis rate limit request failed with HTTP ${response.status}`);
    }
    return response.json();
}

function incrementMemory(hits, key, now, windowMsSafe) {
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
        const next = { count: 1, resetAt: now + windowMsSafe };
        hits.set(key, next);
        return next;
    }

    entry.count += 1;

    // Opportunistic cleanup to avoid unbounded growth.
    if (hits.size > 10_000 && Math.random() < 0.01) {
        for (const [k, v] of hits) {
            if (now >= v.resetAt) hits.delete(k);
        }
    }

    return entry;
}

function rateLimitStoreError(error) {
    const wrapped = new Error('Rate limiter unavailable');
    wrapped.status = 503;
    wrapped.cause = error;
    return wrapped;
}

function createExpressRateLimitStore({ name, windowMs }) {
    const hits = new Map();
    const windowMsSafe = Math.max(1000, Number(windowMs) || 60_000);
    const ttlSeconds = Math.max(1, Math.ceil(windowMsSafe / 1000));
    const namespace = String(process.env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim() || 'frontendatlas';
    const limitName = safeLimiterName({ name, windowMs: windowMsSafe, max: 1 });

    function storeKey(key) {
        return `rl:${namespace}:${limitName}:${hashKey(key)}`;
    }

    function failClosed() {
        return String(process.env.RATE_LIMIT_REDIS_FAIL_CLOSED || '').toLowerCase() === 'true';
    }

    async function withRedisFallback(operation, fallback) {
        if (!shouldUseRedis()) return fallback();
        try {
            return await operation();
        } catch (error) {
            warnRedisLimiterOnce(
                limitName,
                `${limitName} Redis limiter unavailable; ${failClosed() ? 'failing closed' : 'falling back to in-memory limits'} (${error?.message || error})`
            );
            if (failClosed()) throw rateLimitStoreError(error);
            return fallback();
        }
    }

    return {
        async increment(key) {
            const now = Date.now();
            const keyForStore = storeKey(key);
            const entry = await withRedisFallback(
                () => incrementRedis(keyForStore, ttlSeconds),
                () => incrementMemory(hits, keyForStore, now, windowMsSafe)
            );
            return {
                totalHits: entry.count,
                resetTime: new Date(entry.resetAt),
            };
        },

        async decrement(key) {
            const keyForStore = storeKey(key);
            await withRedisFallback(
                () => runRedisCommand(['DECR', keyForStore]),
                () => {
                    const entry = hits.get(keyForStore);
                    if (entry) entry.count = Math.max(0, entry.count - 1);
                }
            );
        },

        async resetKey(key) {
            const keyForStore = storeKey(key);
            await withRedisFallback(
                () => runRedisCommand(['DEL', keyForStore]),
                () => hits.delete(keyForStore)
            );
        },
    };
}

function rateLimit({ name, windowMs, max, keyGenerator, message, code }) {
    const hits = new Map(); // key -> { count, resetAt }
    const msg = message || 'Too many requests';
    const errorCode = String(code || '').trim();
    const windowMsSafe = Math.max(1000, Number(windowMs) || 60_000);
    const maxSafe = Math.max(1, Number(max) || 60);
    const keyFn = typeof keyGenerator === 'function' ? keyGenerator : (req) => getClientIp(req);
    const limitName = safeLimiterName({ name, code, message: msg, windowMs: windowMsSafe, max: maxSafe });
    const namespace = String(process.env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim() || 'frontendatlas';
    const ttlSeconds = Math.max(1, Math.ceil(windowMsSafe / 1000));

    return async function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const rawKey = String(keyFn(req) || 'unknown');
        const keyDigest = hashKey(rawKey);
        const storeKey = `rl:${namespace}:${limitName}:${keyDigest}`;
        let entry;

        if (shouldUseRedis()) {
            try {
                entry = await incrementRedis(storeKey, ttlSeconds);
            } catch (err) {
                const failClosed = String(process.env.RATE_LIMIT_REDIS_FAIL_CLOSED || '').toLowerCase() === 'true';
                warnRedisLimiterOnce(
                    limitName,
                    `${limitName} Redis limiter unavailable; ${failClosed ? 'failing closed' : 'falling back to in-memory limits'} (${err?.message || err})`
                );
                if (failClosed) {
                    return res.status(503).json({ error: 'Rate limiter unavailable' });
                }
                entry = incrementMemory(hits, storeKey, now, windowMsSafe);
            }
        } else {
            entry = incrementMemory(hits, storeKey, now, windowMsSafe);
        }

        if (entry.count > maxSafe) {
            const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSec));
            return res.status(429).json(errorCode ? { code: errorCode, error: msg } : { error: msg });
        }

        return next();
    };
}

module.exports = { createExpressRateLimitStore, rateLimit, getClientIp };
