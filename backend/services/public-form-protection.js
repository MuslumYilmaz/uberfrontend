'use strict';

const crypto = require('crypto');

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_TURNSTILE_TIMEOUT_MS = 3000;
const DEFAULT_TURNSTILE_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;
const DEFAULT_TOKEN_MIN_CHARS = 10;
const MAX_TOKEN_CHARS = 2048;
const TURNSTILE_DUMMY_PASS_SECRET = '1x0000000000000000000000000000000AA';
const TURNSTILE_DUMMY_SECRETS = new Set([
  TURNSTILE_DUMMY_PASS_SECRET,
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

const FORM_ERROR_CODES = Object.freeze({
  verificationRequired: 'FORM_VERIFICATION_REQUIRED',
  verificationFailed: 'FORM_VERIFICATION_FAILED',
  rateLimited: 'FORM_RATE_LIMITED',
  protectionUnavailable: 'FORM_PROTECTION_UNAVAILABLE',
});

class PublicFormProtectionError extends Error {
  constructor({ status, code, message, retryAfter, reason }) {
    super(message);
    this.name = 'PublicFormProtectionError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.reason = reason;
  }
}

function verificationRequiredError() {
  return new PublicFormProtectionError({
    status: 400,
    code: FORM_ERROR_CODES.verificationRequired,
    message: 'Please complete the verification challenge.',
    reason: 'verification_required',
  });
}

function verificationFailedError(reason = 'verification_failed') {
  return new PublicFormProtectionError({
    status: 403,
    code: FORM_ERROR_CODES.verificationFailed,
    message: 'Verification failed. Please refresh the challenge and try again.',
    reason,
  });
}

function rateLimitedError(retryAfter, reason = 'rate_limited') {
  return new PublicFormProtectionError({
    status: 429,
    code: FORM_ERROR_CODES.rateLimited,
    message: 'Too many submissions. Please wait and try again.',
    retryAfter: Math.max(1, Math.ceil(Number(retryAfter) || 1)),
    reason,
  });
}

function protectionUnavailableError(reason = 'protection_unavailable') {
  return new PublicFormProtectionError({
    status: 503,
    code: FORM_ERROR_CODES.protectionUnavailable,
    message: 'Form protection is temporarily unavailable. Please try again later or email support@frontendatlas.com.',
    reason,
  });
}

function envFlag(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
}

function positiveInteger(value, fallback, minimum = 1) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.floor(parsed));
}

function hashSensitive(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function fingerprint(parts) {
  // Callers pass already validated/trimmed values. Preserve their exact field
  // boundaries so this remains exact dedupe rather than similarity matching.
  return hashSensitive(JSON.stringify(parts.map((value) => String(value || ''))));
}

function parseAllowedHostnames(value) {
  return Array.from(new Set(
    String(value || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase().replace(/\.$/, ''))
      .filter(Boolean)
  ));
}

function isTransientStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function fetchTurnstileAttempt({ fetchImpl, body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response?.ok) {
      const error = new Error(`Turnstile Siteverify returned HTTP ${response?.status || 0}`);
      error.transient = isTransientStatus(Number(response?.status || 0));
      throw error;
    }

    try {
      return await response.json();
    } catch (cause) {
      const error = new Error('Turnstile Siteverify returned invalid JSON');
      error.transient = true;
      error.cause = cause;
      throw error;
    }
  } catch (error) {
    // Native fetch reports DNS/socket/network failures as TypeError. Treat any
    // exception that was not deliberately classified above as transient so a
    // provider outage fails closed after the single idempotent retry.
    if (typeof error?.transient === 'boolean') throw error;
    const transientError = error instanceof Error ? error : new Error('Turnstile network request failed');
    transientError.transient = true;
    throw transientError;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTurnstile({ token, expectedAction, remoteIp, env = process.env, fetchImpl, now = Date.now() }) {
  const safeToken = typeof token === 'string' ? token.trim() : '';
  if (!safeToken) throw verificationRequiredError();

  if (safeToken.length < DEFAULT_TOKEN_MIN_CHARS || safeToken.length > MAX_TOKEN_CHARS) {
    throw verificationFailedError('verification_token_malformed');
  }

  const secret = String(env.TURNSTILE_SECRET_KEY || '').trim();
  const allowedHostnames = parseAllowedHostnames(env.TURNSTILE_ALLOWED_HOSTNAMES);
  const request = fetchImpl || global.fetch;
  if (!secret || !allowedHostnames.length || typeof request !== 'function') {
    throw protectionUnavailableError('turnstile_not_configured');
  }

  const runtime = String(env.NODE_ENV || '').trim().toLowerCase();
  const dummyRuntimeAllowed = runtime === 'test' || runtime === 'development';
  const dummySecret = TURNSTILE_DUMMY_SECRETS.has(secret);
  const allowDummyKeys = envFlag(env.TURNSTILE_ALLOW_DUMMY_KEYS, false);
  if ((!dummyRuntimeAllowed && (dummySecret || allowDummyKeys)) || (dummySecret && !allowDummyKeys)) {
    throw protectionUnavailableError('turnstile_dummy_key_not_allowed');
  }
  const dummySuccessMode = dummyRuntimeAllowed && allowDummyKeys && secret === TURNSTILE_DUMMY_PASS_SECRET;

  const timeoutMs = positiveInteger(env.TURNSTILE_VERIFY_TIMEOUT_MS, DEFAULT_TURNSTILE_TIMEOUT_MS, 100);
  const idempotencyKey = crypto.randomUUID();
  const body = {
    secret,
    response: safeToken,
    idempotency_key: idempotencyKey,
  };
  if (remoteIp && remoteIp !== 'unknown') body.remoteip = String(remoteIp);

  let result;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      result = await fetchTurnstileAttempt({ fetchImpl: request, body, timeoutMs });
      const errorCodes = Array.isArray(result?.['error-codes']) ? result['error-codes'] : [];
      if (result?.success !== true && errorCodes.includes('internal-error')) {
        if (attempt === 1) throw protectionUnavailableError('turnstile_unavailable');
        continue;
      }
      break;
    } catch (error) {
      if (error instanceof PublicFormProtectionError) throw error;
      if (!error?.transient) throw protectionUnavailableError('turnstile_request_rejected');
      if (attempt === 1) throw protectionUnavailableError('turnstile_unavailable');
    }
  }

  if (result?.success !== true) {
    const errorCodes = Array.isArray(result?.['error-codes']) ? result['error-codes'] : [];
    if (
      errorCodes.includes('missing-input-secret') ||
      errorCodes.includes('invalid-input-secret') ||
      errorCodes.includes('bad-request')
    ) {
      throw protectionUnavailableError('turnstile_secret_rejected');
    }
    throw verificationFailedError('turnstile_rejected');
  }
  const responseAction = String(result.action || '');
  if (responseAction !== String(expectedAction || '') && !(dummySuccessMode && responseAction === 'test')) {
    throw verificationFailedError('turnstile_action_mismatch');
  }

  const hostname = String(result.hostname || '').trim().toLowerCase().replace(/\.$/, '');
  if (!hostname || !allowedHostnames.includes(hostname)) {
    throw verificationFailedError('turnstile_hostname_mismatch');
  }

  const challengeAt = Date.parse(String(result.challenge_ts || ''));
  const maxAgeMs = positiveInteger(
    env.TURNSTILE_TOKEN_MAX_AGE_MS,
    DEFAULT_TURNSTILE_TOKEN_MAX_AGE_MS,
    1000
  );
  if (!dummySuccessMode && (!Number.isFinite(challengeAt) || challengeAt > now + 60_000 || now - challengeAt > maxAgeMs)) {
    throw verificationFailedError('turnstile_token_expired');
  }

  return true;
}

function createMemoryPublicFormStore() {
  const counters = new Map();
  const claims = new Map();

  function cleanExpired(map, now) {
    if (map.size <= 10_000 || Math.random() >= 0.02) return;
    for (const [key, value] of map) {
      if (now >= value.expiresAt) map.delete(key);
    }
  }

  return {
    async increment(key, ttlSeconds) {
      const now = Date.now();
      const ttlMs = Math.max(1, ttlSeconds) * 1000;
      const existing = counters.get(key);
      const entry = !existing || now >= existing.expiresAt
        ? { count: 1, expiresAt: now + ttlMs }
        : { count: existing.count + 1, expiresAt: existing.expiresAt };
      counters.set(key, entry);
      cleanExpired(counters, now);
      return { count: entry.count, ttlSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)) };
    },

    async claim(key, ttlSeconds, ownerId = crypto.randomUUID()) {
      const now = Date.now();
      const existing = claims.get(key);
      if (existing && now < existing.expiresAt) {
        return { claimed: false, ttlSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)) };
      }
      const owner = String(ownerId);
      claims.set(key, { expiresAt: now + Math.max(1, ttlSeconds) * 1000, owner });
      cleanExpired(claims, now);
      return { claimed: true, ttlSeconds: Math.max(1, ttlSeconds), owner };
    },

    async release(key, ownerId) {
      const existing = claims.get(key);
      if (!existing || existing.owner !== String(ownerId || '')) return false;
      claims.delete(key);
      return true;
    },
  };
}

function createUnavailableStore(reason) {
  const unavailable = async () => {
    throw protectionUnavailableError(reason);
  };
  return { increment: unavailable, claim: unavailable, release: unavailable };
}

function createUpstashPublicFormStore({ env = process.env, fetchImpl } = {}) {
  const baseUrl = String(env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
  const token = String(env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  const namespace = String(env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim() || 'frontendatlas';
  const timeoutMs = positiveInteger(env.PUBLIC_FORM_REDIS_TIMEOUT_MS, 3000, 100);

  async function pipeline(commands) {
    const request = fetchImpl || global.fetch;
    if (!baseUrl || !token || typeof request !== 'function') {
      throw protectionUnavailableError('redis_not_configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await request(`${baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });
      if (!response?.ok) throw protectionUnavailableError('redis_unavailable');
      const payload = await response.json();
      if (
        !Array.isArray(payload) ||
        payload.length !== commands.length ||
        payload.some((entry) => (
          !entry ||
          typeof entry !== 'object' ||
          Object.prototype.hasOwnProperty.call(entry, 'error') ||
          !Object.prototype.hasOwnProperty.call(entry, 'result')
        ))
      ) {
        throw protectionUnavailableError('redis_unavailable');
      }
      return payload;
    } catch (error) {
      if (error instanceof PublicFormProtectionError) throw error;
      throw protectionUnavailableError('redis_unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  function namespacedKey(key) {
    return `public-form:${namespace}:${key}`;
  }

  return {
    async increment(key, ttlSeconds) {
      const safeTtl = Math.max(1, Math.ceil(Number(ttlSeconds) || 1));
      const payload = await pipeline([
        ['INCR', namespacedKey(key)],
        ['EXPIRE', namespacedKey(key), safeTtl, 'NX'],
        ['TTL', namespacedKey(key)],
      ]);
      if (payload[0].result === null) throw protectionUnavailableError('redis_invalid_response');
      const count = Number(payload[0].result);
      const ttl = Number(payload[2]?.result);
      if (!Number.isFinite(count)) throw protectionUnavailableError('redis_invalid_response');
      return { count, ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : safeTtl };
    },

    async claim(key, ttlSeconds, ownerId = crypto.randomUUID()) {
      const safeTtl = Math.max(1, Math.ceil(Number(ttlSeconds) || 1));
      const owner = String(ownerId);
      const payload = await pipeline([
        ['SET', namespacedKey(key), owner, 'EX', safeTtl, 'NX'],
        ['TTL', namespacedKey(key)],
      ]);
      const claimResult = payload[0].result;
      if (claimResult !== null && String(claimResult).toUpperCase() !== 'OK') {
        throw protectionUnavailableError('redis_invalid_response');
      }
      const claimed = String(claimResult || '').toUpperCase() === 'OK';
      const ttl = Number(payload[1]?.result);
      return {
        claimed,
        ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : safeTtl,
        ...(claimed ? { owner } : {}),
      };
    },

    async release(key, ownerId) {
      const script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
      const payload = await pipeline([[
        'EVAL',
        script,
        1,
        namespacedKey(key),
        String(ownerId || ''),
      ]]);
      return Number(payload[0].result) === 1;
    },
  };
}

function createPublicFormStore({ env = process.env, fetchImpl } = {}) {
  const configured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  const production = String(env.NODE_ENV || '').trim().toLowerCase() === 'production';
  const required = envFlag(env.PUBLIC_FORM_REDIS_REQUIRED, production);
  if (configured) return createUpstashPublicFormStore({ env, fetchImpl });
  if (required || production) return createUnavailableStore('redis_not_configured');
  return createMemoryPublicFormStore();
}

function quotaKey(scope, value) {
  return `quota:${scope}:${hashSensitive(value)}`;
}

function duplicateKey(scope, value) {
  return `duplicate:${scope}:${hashSensitive(value)}`;
}

async function consumeQuota({ store, scope, value, max, windowMs, reason }) {
  const safeMax = positiveInteger(max, 1);
  const ttlSeconds = Math.max(1, Math.ceil(positiveInteger(windowMs, 60_000, 1000) / 1000));
  let entry;
  try {
    entry = await store.increment(quotaKey(scope, value), ttlSeconds);
  } catch (error) {
    if (error instanceof PublicFormProtectionError) throw error;
    throw protectionUnavailableError('redis_unavailable');
  }
  if (entry.count > safeMax) throw rateLimitedError(entry.ttlSeconds, reason);
  return entry;
}

async function claimDuplicate({ store, scope, value, windowMs }) {
  const ttlSeconds = Math.max(1, Math.ceil(positiveInteger(windowMs, 600_000, 1000) / 1000));
  const key = duplicateKey(scope, value);
  const ownerId = crypto.randomUUID();
  let result;
  try {
    result = await store.claim(key, ttlSeconds, ownerId);
  } catch (error) {
    if (error instanceof PublicFormProtectionError) throw error;
    throw protectionUnavailableError('redis_unavailable');
  }
  if (!result.claimed) throw rateLimitedError(result.ttlSeconds, 'duplicate_submission');
  return { key, ownerId };
}

async function releaseDuplicate(store, claim) {
  if (!claim?.key || !claim?.ownerId) throw protectionUnavailableError('redis_release_failed');
  try {
    await store.release(claim.key, claim.ownerId);
  } catch {
    throw protectionUnavailableError('redis_release_failed');
  }
}

module.exports = {
  FORM_ERROR_CODES,
  MAX_TOKEN_CHARS,
  PublicFormProtectionError,
  claimDuplicate,
  consumeQuota,
  createMemoryPublicFormStore,
  createPublicFormStore,
  createUpstashPublicFormStore,
  duplicateKey,
  fingerprint,
  hashSensitive,
  parseAllowedHostnames,
  protectionUnavailableError,
  quotaKey,
  rateLimitedError,
  releaseDuplicate,
  verificationFailedError,
  verificationRequiredError,
  verifyTurnstile,
};
