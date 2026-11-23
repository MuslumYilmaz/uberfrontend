// Polar Create Checkout Session API (POST /v1/checkouts/). Every Polar checkout
// is created here: the session carries our user id (`external_customer_id`),
// the attempt and attribution as `metadata`, the return URLs and, for regional
// and student prices, an ad-hoc fixed price for the product. Nothing here
// changes products or discounts. Facts: sandbox probe of 2026-11-23
// (reports/polar-entegrasyon-plani-2026-11-19.md §12): ad-hoc prices work on
// recurring products, sessions expire after an hour, metadata values must be
// non-empty strings, discounts stack on ad-hoc prices (so the caller never
// sends both), and a product-restricted discount on another product is a 422.

const net = require('net');
const {
  normalizeMode,
  normalizeProductId,
  resolvePolarAccessToken,
  resolvePolarApiBase,
  resolvePolarCheckoutHost,
  resolvePolarProductId,
} = require('./polar-config');

const DEFAULT_TIMEOUT_MS = 8000;
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const METADATA_MAX_PAIRS = 50;
const METADATA_KEY_MAX_LENGTH = 40;
const METADATA_VALUE_MAX_LENGTH = 500;
const CHECKOUT_PATH_PATTERN = /^\/checkout\/[^/]+/;

function isPolarCheckoutUrl(value, mode = null) {
  try {
    const parsed = new URL(String(value || '').trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const allowedHosts = mode
      ? [resolvePolarCheckoutHost(mode)]
      : [resolvePolarCheckoutHost('test'), resolvePolarCheckoutHost('live')];
    return allowedHosts.includes(hostname) && CHECKOUT_PATH_PATTERN.test(parsed.pathname);
  } catch {
    return false;
  }
}

// A checkout needs the organization token for the mode and the plan's product
// id. Missing configuration means "plan unavailable", never a broken checkout.
function canCreatePolarCheckout({ planId, mode, env = process.env } = {}) {
  return Boolean(resolvePolarAccessToken(mode, env) && resolvePolarProductId(planId, mode, env));
}

// Polar rejects empty metadata values and caps keys, values and pair count.
function sanitizeMetadata(metadata) {
  const out = {};
  let pairs = 0;
  for (const [rawKey, rawValue] of Object.entries(metadata || {})) {
    if (rawValue === null || rawValue === undefined) continue;
    const key = String(rawKey).trim().slice(0, METADATA_KEY_MAX_LENGTH);
    const value = String(rawValue).trim();
    if (!key || !value) continue;
    if (pairs >= METADATA_MAX_PAIRS) break;
    out[key] = value.slice(0, METADATA_VALUE_MAX_LENGTH);
    pairs += 1;
  }
  return out;
}

// The first address of an X-Forwarded-For list, only when it is a real IP.
function normalizeClientIp(value) {
  const first = String(value || '').split(',')[0].trim();
  return first && net.isIP(first) ? first : '';
}

function normalizeHttpsOrigin(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

async function postJson({ url, accessToken, body, fetchImpl, timeoutMs }) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// One retry on a transient failure; every other outcome fails closed with a
// reason the caller can log.
async function requestWithRetry({ url, accessToken, body, fetchImpl, timeoutMs }) {
  let lastReason = 'request_failed';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await postJson({ url, accessToken, body, fetchImpl, timeoutMs });
    } catch (error) {
      lastReason = error?.name === 'AbortError' ? 'timeout' : 'network_error';
      continue;
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      lastReason = `http_${response.status}`;
      if (RETRYABLE_STATUS.has(response.status)) continue;
      return { ok: false, reason: lastReason, status: response.status, payload };
    }
    if (!payload || typeof payload !== 'object') return { ok: false, reason: 'invalid_response', status: response.status, payload: null };
    return { ok: true, status: response.status, payload };
  }
  return { ok: false, reason: lastReason, status: 0, payload: null };
}

async function createPolarCheckout({
  accessToken,
  mode,
  productId,
  customPriceCents = null,
  expectedAmountCents = null,
  currency = 'usd',
  email,
  name,
  externalCustomerId,
  metadata,
  successUrl,
  returnUrl,
  embedOrigin,
  discountId,
  customerIpAddress,
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const normalizedToken = String(accessToken || '').trim();
  const normalizedMode = normalizeMode(mode);
  const normalizedProductId = normalizeProductId(productId);
  if (!normalizedToken) return { ok: false, reason: 'missing_access_token' };
  if (!normalizedProductId) return { ok: false, reason: 'invalid_product_id' };
  if (customPriceCents !== null && (!Number.isSafeInteger(customPriceCents) || customPriceCents <= 0)) {
    return { ok: false, reason: 'invalid_price' };
  }
  if (customPriceCents !== null && discountId) return { ok: false, reason: 'discount_with_custom_price' };
  if (!normalizeHttpsOrigin(successUrl) && !String(successUrl || '').startsWith('http://localhost')) {
    // success_url must be an absolute URL; local http is allowed for development.
    if (!/^https?:\/\//.test(String(successUrl || ''))) return { ok: false, reason: 'invalid_success_url' };
  }
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };

  const normalizedCurrency = String(currency || 'usd').trim().toLowerCase();
  const body = {
    products: [normalizedProductId],
    ...(customPriceCents !== null
      ? {
        prices: {
          [normalizedProductId]: [
            { amount_type: 'fixed', price_amount: customPriceCents, price_currency: normalizedCurrency },
          ],
        },
      }
      : {}),
    ...(externalCustomerId ? { external_customer_id: String(externalCustomerId).trim() } : {}),
    ...(email ? { customer_email: String(email).trim() } : {}),
    ...(name ? { customer_name: String(name).trim().slice(0, 256) } : {}),
    metadata: sanitizeMetadata(metadata),
    success_url: String(successUrl),
    ...(returnUrl ? { return_url: String(returnUrl) } : {}),
    ...(normalizeHttpsOrigin(embedOrigin) ? { embed_origin: normalizeHttpsOrigin(embedOrigin) } : {}),
    allow_discount_codes: false,
    ...(discountId ? { discount_id: String(discountId).trim() } : {}),
    ...(normalizeClientIp(customerIpAddress) ? { customer_ip_address: normalizeClientIp(customerIpAddress) } : {}),
  };

  const result = await requestWithRetry({
    url: `${resolvePolarApiBase(normalizedMode)}/v1/checkouts/`,
    accessToken: normalizedToken,
    body,
    fetchImpl,
    timeoutMs,
  });
  if (!result.ok) return { ok: false, reason: result.reason, status: result.status };

  const payload = result.payload;
  const url = String(payload.url || '').trim();
  const checkoutId = String(payload.id || '').trim();
  if (!checkoutId || !isPolarCheckoutUrl(url, normalizedMode)) return { ok: false, reason: 'invalid_checkout_url' };
  if (payload.status && String(payload.status) !== 'open') return { ok: false, reason: `checkout_${payload.status}` };
  // `amount` is the price before any discount, so it must equal the price we asked for.
  const returnedAmount = payload.amount;
  const expected = customPriceCents !== null ? customPriceCents : expectedAmountCents;
  if (expected !== null && returnedAmount !== undefined && returnedAmount !== null && Number(returnedAmount) !== expected) {
    return { ok: false, reason: 'price_mismatch' };
  }
  const expiresAt = payload.expires_at ? new Date(payload.expires_at) : null;
  return {
    ok: true,
    url,
    checkoutId,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    amountCents: Number.isInteger(returnedAmount) ? returnedAmount : null,
    totalCents: Number.isInteger(payload.total_amount) ? payload.total_amount : null,
    clientSecret: String(payload.client_secret || '').trim() || null,
  };
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  canCreatePolarCheckout,
  createPolarCheckout,
  isPolarCheckoutUrl,
  normalizeClientIp,
  requestWithRetry,
  sanitizeMetadata,
};
