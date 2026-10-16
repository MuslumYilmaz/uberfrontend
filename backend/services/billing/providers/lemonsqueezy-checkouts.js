// Lemon Squeezy Create checkout API (POST /v1/checkouts). Used only when a
// checkout needs a price that differs from the variant list price (regional or
// student pricing); the plain buy link stays the default path. The returned
// URL is a signed /checkout/custom/<id> link, so the price cannot be edited by
// the customer. Nothing here changes variants, products or discounts.

const { resolveLemonSqueezyApiKey } = require('./lemonsqueezy-orders');

const CHECKOUT_API_URL = 'https://api.lemonsqueezy.com/v1/checkouts';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_EXPIRES_MS = 24 * 60 * 60 * 1000;
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

function resolveLemonSqueezyStoreId(env = process.env) {
  const value = String(env.LEMONSQUEEZY_STORE_ID || '').trim();
  return /^[0-9]+$/.test(value) ? value : '';
}

function resolveLemonSqueezyVariantId(planId, mode, env = process.env) {
  const suffix = String(planId || '').trim().toUpperCase();
  if (!suffix || !['test', 'live'].includes(mode)) return '';
  if (mode === 'live') {
    // Live never falls back to an unscoped or test id.
    return String(env[`LEMONSQUEEZY_${suffix}_VARIANT_ID_LIVE`] || '').trim();
  }
  return String(
    env[`LEMONSQUEEZY_${suffix}_VARIANT_ID_TEST`]
    || env[`LEMONSQUEEZY_${suffix}_VARIANT_ID`]
    || ''
  ).trim();
}

function isLemonSqueezyCheckoutUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const providerHost = hostname === 'lemonsqueezy.com' || hostname.endsWith('.lemonsqueezy.com');
    return providerHost && /^\/checkout\/(?:buy|custom)\/[^/]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

// A custom checkout needs an API key for the mode, the store id and the
// variant id of the plan. Missing configuration means "list price only", never
// a broken checkout.
function canCreateCustomCheckout({ planId, mode, env = process.env } = {}) {
  return Boolean(
    resolveLemonSqueezyApiKey(mode, env)
    && resolveLemonSqueezyStoreId(env)
    && /^[0-9]+$/.test(resolveLemonSqueezyVariantId(planId, mode, env))
  );
}

function stringifyCustomData(customData) {
  const out = {};
  for (const [key, value] of Object.entries(customData || {})) {
    if (value === null || value === undefined || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

async function postCheckout({ apiKey, body, fetchImpl, timeoutMs }) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(CHECKOUT_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function createLemonSqueezyCustomCheckout({
  apiKey,
  storeId,
  variantId,
  mode,
  customPriceCents,
  email,
  name,
  customData,
  redirectUrl,
  embed = false,
  expiresAt,
  now = new Date(),
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const normalizedApiKey = String(apiKey || '').trim();
  const normalizedStoreId = String(storeId || '').trim();
  const normalizedVariantId = String(variantId || '').trim();
  if (!normalizedApiKey) return { ok: false, reason: 'missing_api_key' };
  if (!/^[0-9]+$/.test(normalizedStoreId)) return { ok: false, reason: 'invalid_store_id' };
  if (!/^[0-9]+$/.test(normalizedVariantId)) return { ok: false, reason: 'invalid_variant_id' };
  if (!Number.isSafeInteger(customPriceCents) || customPriceCents <= 0) return { ok: false, reason: 'invalid_price' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };

  const expires = expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime())
    ? expiresAt
    : new Date(now.getTime() + DEFAULT_EXPIRES_MS);
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        custom_price: customPriceCents,
        test_mode: mode === 'test',
        expires_at: expires.toISOString(),
        product_options: {
          enabled_variants: [Number(normalizedVariantId)],
          ...(redirectUrl ? { redirect_url: String(redirectUrl) } : {}),
        },
        checkout_options: {
          discount: false,
          embed: embed === true,
        },
        checkout_data: {
          ...(email ? { email: String(email).trim() } : {}),
          ...(name ? { name: String(name).trim() } : {}),
          custom: stringifyCustomData(customData),
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: normalizedStoreId } },
        variant: { data: { type: 'variants', id: normalizedVariantId } },
      },
    },
  };

  let lastReason = 'request_failed';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await postCheckout({ apiKey: normalizedApiKey, body, fetchImpl, timeoutMs });
    } catch (error) {
      lastReason = error?.name === 'AbortError' ? 'timeout' : 'network_error';
      continue;
    }
    if (!response.ok) {
      lastReason = `http_${response.status}`;
      if (RETRYABLE_STATUS.has(response.status)) continue;
      return { ok: false, reason: lastReason };
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, reason: 'invalid_response' };
    }
    const url = String(payload?.data?.attributes?.url || '').trim();
    const checkoutId = String(payload?.data?.id || '').trim();
    if (!isLemonSqueezyCheckoutUrl(url)) return { ok: false, reason: 'invalid_checkout_url' };
    const returnedPrice = payload?.data?.attributes?.custom_price;
    if (returnedPrice !== undefined && returnedPrice !== null && Number(returnedPrice) !== customPriceCents) {
      return { ok: false, reason: 'price_mismatch' };
    }
    return { ok: true, url, checkoutId, expiresAt: expires };
  }
  return { ok: false, reason: lastReason };
}

module.exports = {
  CHECKOUT_API_URL,
  canCreateCustomCheckout,
  createLemonSqueezyCustomCheckout,
  isLemonSqueezyCheckoutUrl,
  resolveLemonSqueezyStoreId,
  resolveLemonSqueezyVariantId,
};
