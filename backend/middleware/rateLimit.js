const crypto = require('crypto');
const {
    runUpstashPipeline,
    upstashConfigured,
} = require('../services/upstash-pipeline');

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
    return upstashConfigured(process.env);
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

const INCREMENT_SCRIPT = [
    "local count = redis.call('INCR', KEYS[1])",
    "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('TTL', KEYS[1])",
    'if ttl < 1 then',
    "  redis.call('EXPIRE', KEYS[1], ARGV[1])",
    '  ttl = tonumber(ARGV[1])',
    'end',
    'return {count, ttl}',
].join('\n');

const DEDUPED_INCREMENT_SCRIPT = [
    "local first = redis.call('SET', KEYS[2], '1', 'NX', 'EX', ARGV[1])",
    "local count = tonumber(redis.call('GET', KEYS[1]) or '0')",
    'if first or count < 1 then',
    "  count = redis.call('INCR', KEYS[1])",
    "  if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    'end',
    "local ttl = redis.call('TTL', KEYS[1])",
    'if ttl < 1 then',
    "  redis.call('EXPIRE', KEYS[1], ARGV[1])",
    '  ttl = tonumber(ARGV[1])',
    'end',
    'return {count, ttl}',
].join('\n');

function parseIncrementResult(payload) {
    const result = payload?.[0]?.result;
    if (!Array.isArray(result) || result.length !== 2) {
        const error = new Error('Invalid Redis limiter response');
        error.code = 'invalid_response';
        throw error;
    }
    const [count, ttl] = result;
    if (
        !Number.isSafeInteger(count)
        || count < 1
        || !Number.isSafeInteger(ttl)
        || ttl < 1
    ) {
        const error = new Error('Invalid Redis limiter response');
        error.code = 'invalid_response';
        throw error;
    }
    return {
        count,
        resetAt: Date.now() + (ttl * 1000),
    };
}

async function runRedisCommand(command) {
    return runUpstashPipeline([command]);
}

async function incrementRedis(key, ttlSeconds) {
    const payload = await runRedisCommand([
        'EVAL',
        INCREMENT_SCRIPT,
        1,
        key,
        ttlSeconds,
    ]);
    return parseIncrementResult(payload);
}

async function incrementRedisDeduped(counterKey, dedupeKey, ttlSeconds) {
    const payload = await runRedisCommand([
        'EVAL',
        DEDUPED_INCREMENT_SCRIPT,
        2,
        counterKey,
        dedupeKey,
        ttlSeconds,
    ]);
    return parseIncrementResult(payload);
}

function boundMemoryEntries(entries, now) {
    if (entries.size <= 10_000) return;
    for (const [key, value] of entries) {
        if (now >= value.resetAt) entries.delete(key);
    }
    while (entries.size > 10_000) {
        entries.delete(entries.keys().next().value);
    }
}

function incrementMemory(hits, key, now, windowMsSafe) {
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
        const next = { count: 1, resetAt: now + windowMsSafe };
        hits.set(key, next);
        boundMemoryEntries(hits, now);
        return next;
    }

    entry.count += 1;

    boundMemoryEntries(hits, now);

    return entry;
}

function incrementMemoryDeduped(hits, dedupeHits, key, dedupeKey, now, windowMsSafe) {
    const existingDedupe = dedupeHits.get(dedupeKey);
    if (existingDedupe && now < existingDedupe.resetAt) {
        const current = hits.get(key);
        if (current && now < current.resetAt) return current;
    }
    dedupeHits.set(dedupeKey, { resetAt: now + windowMsSafe });
    boundMemoryEntries(dedupeHits, now);
    return incrementMemory(hits, key, now, windowMsSafe);
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
            const failureCode = redisFailureCode(error);
            warnRedisLimiterOnce(
                limitName,
                `${limitName} Redis limiter unavailable; ${failClosed() ? 'failing closed' : 'falling back to in-memory limits'} (${failureCode})`
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

function normalizeRedisFailureMode(value) {
    const raw = String(value || 'inherit').trim().toLowerCase();
    if (['closed', 'fail-closed', 'required'].includes(raw)) return 'closed';
    if (['open', 'fail-open', 'fallback'].includes(raw)) return 'open';
    return 'inherit';
}

const REDIS_FAILURE_CODES = new Set([
    'not_configured',
    'timeout',
    'network_error',
    'http_error',
    'invalid_response',
    'command_error',
]);

function redisFailureCode(error) {
    return REDIS_FAILURE_CODES.has(error?.code) ? error.code : 'invalid_response';
}

function setRateLimitMetadata(res, {
    limiter,
    outcome,
    code,
    storeFallback = false,
}) {
    if (!res.locals) res.locals = {};
    res.locals.rateLimit = {
        limiter,
        outcome,
        code,
        storeFallback: Boolean(storeFallback || res.locals.rateLimit?.storeFallback),
    };
}

function rateLimit({
    name,
    windowMs,
    max,
    keyGenerator,
    message,
    code,
    redisFailureMode = 'inherit',
    dedupeKeyGenerator,
    storeMode = 'auto',
}) {
    const hits = new Map(); // key -> { count, resetAt }
    const dedupeHits = new Map();
    const msg = message || 'Too many requests';
    const errorCode = String(code || '').trim();
    const windowMsSafe = Math.max(1000, Number(windowMs) || 60_000);
    const maxSafe = Math.max(1, Number(max) || 60);
    const keyFn = typeof keyGenerator === 'function' ? keyGenerator : (req) => getClientIp(req);
    const dedupeKeyFn = typeof dedupeKeyGenerator === 'function'
        ? dedupeKeyGenerator
        : null;
    const limitName = safeLimiterName({ name, code, message: msg, windowMs: windowMsSafe, max: maxSafe });
    const namespace = String(process.env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim() || 'frontendatlas';
    const ttlSeconds = Math.max(1, Math.ceil(windowMsSafe / 1000));
    const failureMode = normalizeRedisFailureMode(redisFailureMode);
    const normalizedStoreMode = String(storeMode || 'auto').trim().toLowerCase();

    function redisFailureIsClosed() {
        if (failureMode === 'closed') return true;
        if (failureMode === 'open') return false;
        return String(process.env.RATE_LIMIT_REDIS_FAIL_CLOSED || '').toLowerCase() === 'true';
    }

    return async function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const rawKey = String(keyFn(req) || 'unknown');
        const keyDigest = hashKey(rawKey);
        const storeKey = `rl:${namespace}:${limitName}:${keyDigest}`;
        const rawDedupeKey = dedupeKeyFn ? String(dedupeKeyFn(req) || '').trim() : '';
        const dedupeStoreKey = rawDedupeKey
            ? `${storeKey}:dedupe:${hashKey(rawDedupeKey)}`
            : '';
        let entry;
        let storeFallback = false;
        let fallbackCode = null;

        // A process-local pre-auth guard can deliberately avoid a remote
        // dependency while the authenticated route limiter enforces the
        // shared Redis policy later in the request lifecycle.
        const useRedis = normalizedStoreMode === 'memory' ? false : shouldUseRedis();
        if (!useRedis && redisFailureIsClosed()) {
            warnRedisLimiterOnce(
                limitName,
                `${limitName} requires Redis; failing closed because the store is not configured`
            );
            setRateLimitMetadata(res, {
                limiter: limitName,
                outcome: 'unavailable',
                code: 'not_configured',
            });
            return res.status(503).json({
                code: 'RATE_LIMIT_UNAVAILABLE',
                error: 'Rate limiter unavailable',
            });
        }

        if (useRedis) {
            try {
                entry = dedupeStoreKey
                    ? await incrementRedisDeduped(storeKey, dedupeStoreKey, ttlSeconds)
                    : await incrementRedis(storeKey, ttlSeconds);
            } catch (err) {
                const failClosed = redisFailureIsClosed();
                const failureCode = redisFailureCode(err);
                warnRedisLimiterOnce(
                    limitName,
                    `${limitName} Redis limiter unavailable; ${failClosed ? 'failing closed' : 'falling back to in-memory limits'} (${failureCode})`
                );
                if (failClosed) {
                    setRateLimitMetadata(res, {
                        limiter: limitName,
                        outcome: 'unavailable',
                        code: failureCode,
                    });
                    return res.status(503).json({
                        code: 'RATE_LIMIT_UNAVAILABLE',
                        error: 'Rate limiter unavailable',
                    });
                }
                storeFallback = true;
                fallbackCode = failureCode;
                entry = dedupeStoreKey
                    ? incrementMemoryDeduped(
                        hits,
                        dedupeHits,
                        storeKey,
                        dedupeStoreKey,
                        now,
                        windowMsSafe
                    )
                    : incrementMemory(hits, storeKey, now, windowMsSafe);
            }
        } else {
            entry = dedupeStoreKey
                ? incrementMemoryDeduped(
                    hits,
                    dedupeHits,
                    storeKey,
                    dedupeStoreKey,
                    now,
                    windowMsSafe
                )
                : incrementMemory(hits, storeKey, now, windowMsSafe);
        }

        if (entry.count > maxSafe) {
            const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSec));
            setRateLimitMetadata(res, {
                limiter: limitName,
                outcome: 'denied',
                code: errorCode || 'RATE_LIMITED',
                storeFallback,
            });
            return res.status(429).json(errorCode ? { code: errorCode, error: msg } : { error: msg });
        }

        setRateLimitMetadata(res, {
            limiter: limitName,
            outcome: 'allowed',
            code: fallbackCode || 'RATE_LIMIT_ALLOWED',
            storeFallback,
        });
        return next();
    };
}

module.exports = {
    createExpressRateLimitStore,
    getClientIp,
    incrementRedisCounter: incrementRedis,
    incrementRedisCounterDeduped: incrementRedisDeduped,
    normalizeRedisFailureMode,
    rateLimit,
};
