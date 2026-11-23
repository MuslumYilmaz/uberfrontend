const { PLAN_CATALOG, resolvePlanCatalog } = require('./checkout-start');
const { resolvePolarApiBase, resolvePolarProductId } = require('./providers/polar-config');

const PLAN_IDS = Object.keys(PLAN_CATALOG);

function resolveVariantId(planId, mode, env = process.env) {
  const suffix = String(planId || '').trim().toUpperCase();
  if (!suffix || !['test', 'live'].includes(mode)) return '';
  if (mode === 'live') {
    return String(env[`LEMONSQUEEZY_${suffix}_VARIANT_ID_LIVE`] || '').trim();
  }
  return String(
    env[`LEMONSQUEEZY_${suffix}_VARIANT_ID_TEST`] ||
    env[`LEMONSQUEEZY_${suffix}_VARIANT_ID`] ||
    ''
  ).trim();
}

function normalizeProviderInterval(attributes = {}) {
  // A single-payment variant can still report an interval: the live lifetime
  // variant answers `interval: month, interval_count: 1` with
  // `is_subscription: false`. The subscription flag decides when present.
  if (attributes.is_subscription === false) return { interval: 'one_time', intervalCount: null };
  const interval = String(attributes.interval || '').trim().toLowerCase();
  if (!interval) return { interval: 'one_time', intervalCount: null };
  const intervalCount = Number(attributes.interval_count);
  return {
    interval,
    intervalCount: Number.isInteger(intervalCount) && intervalCount > 0 ? intervalCount : 1,
  };
}

function compareVariant(planId, variantId, payload, mode = null, env = process.env) {
  const expected = resolvePlanCatalog(env)[planId];
  const attributes = payload?.data?.attributes || {};
  const actualPrice = Number(attributes.price);
  const actualInterval = normalizeProviderInterval(attributes);
  const mismatches = [];

  if (!Number.isInteger(actualPrice) || actualPrice < 0) {
    mismatches.push('invalid_provider_price');
  } else if (actualPrice !== expected.amountCents) {
    mismatches.push('amount_mismatch');
  }
  if (actualInterval.interval !== expected.interval) {
    mismatches.push('interval_mismatch');
  }
  if (actualInterval.intervalCount !== expected.intervalCount) {
    mismatches.push('interval_count_mismatch');
  }
  if (
    ['test', 'live'].includes(mode)
    && typeof attributes.test_mode === 'boolean'
    && attributes.test_mode !== (mode === 'test')
  ) {
    mismatches.push('mode_mismatch');
  }

  return {
    planId,
    variantId,
    ok: mismatches.length === 0,
    mismatches,
    expected: {
      amountCents: expected.amountCents,
      interval: expected.interval,
      intervalCount: expected.intervalCount,
    },
    actual: {
      amountCents: Number.isInteger(actualPrice) ? actualPrice : null,
      interval: actualInterval.interval,
      intervalCount: actualInterval.intervalCount,
      status: String(attributes.status || '').trim() || null,
    },
  };
}

async function fetchVariant({ apiKey, variantId, fetchImpl = global.fetch }) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Global fetch is unavailable');
  }
  const response = await fetchImpl(
    `https://api.lemonsqueezy.com/v1/variants/${encodeURIComponent(variantId)}`,
    {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`LemonSqueezy variant request failed (${response.status})`);
  }
  return response.json();
}

async function checkLemonSqueezyPriceParity({
  apiKey,
  mode,
  enabledPlans,
  env = process.env,
  fetchImpl = global.fetch,
}) {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  if (!['test', 'live'].includes(normalizedMode)) {
    throw new Error('Price parity mode must be "test" or "live"');
  }
  const normalizedApiKey = String(apiKey || '').trim();
  if (!normalizedApiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is required for the read-only price parity check');
  }

  const selectedPlans = PLAN_IDS.filter((planId) => enabledPlans?.[planId] === true);
  const results = [];
  for (const planId of selectedPlans) {
    const variantId = resolveVariantId(planId, normalizedMode, env);
    if (!variantId) {
      results.push({
        planId,
        variantId: null,
        ok: false,
        mismatches: ['variant_id_missing'],
        expected: { ...resolvePlanCatalog(env)[planId] },
        actual: null,
      });
      continue;
    }
    const payload = await fetchVariant({ apiKey: normalizedApiKey, variantId, fetchImpl });
    results.push(compareVariant(planId, variantId, payload, normalizedMode, env));
  }

  return {
    provider: 'lemonsqueezy',
    mode: normalizedMode,
    checkedPlans: results.length,
    ok: results.every((result) => result.ok),
    results,
  };
}

// Polar: one product per billing cycle; the fixed price is the product's
// first fixed-amount price in the catalogue currency.
function normalizePolarInterval(product = {}) {
  const interval = String(product.recurring_interval || '').trim().toLowerCase();
  if (!interval) return { interval: 'one_time', intervalCount: null };
  const intervalCount = Number(product.recurring_interval_count);
  return {
    interval,
    intervalCount: Number.isInteger(intervalCount) && intervalCount > 0 ? intervalCount : 1,
  };
}

function comparePolarProduct(planId, productId, product, env = process.env) {
  const expected = resolvePlanCatalog(env)[planId];
  const prices = Array.isArray(product?.prices) ? product.prices : [];
  const fixed = prices.find((price) => String(price?.amount_type || '').toLowerCase() === 'fixed') || null;
  const actualPrice = fixed ? Number(fixed.price_amount) : NaN;
  const actualCurrency = String(fixed?.price_currency || '').trim().toUpperCase();
  const actualInterval = normalizePolarInterval(product);
  const mismatches = [];

  if (!fixed) {
    mismatches.push('fixed_price_missing');
  } else if (!Number.isInteger(actualPrice) || actualPrice < 0) {
    mismatches.push('invalid_provider_price');
  } else if (actualPrice !== expected.amountCents) {
    mismatches.push('amount_mismatch');
  }
  if (fixed && actualCurrency !== String(expected.currency || 'USD').toUpperCase()) {
    mismatches.push('currency_mismatch');
  }
  if (actualInterval.interval !== expected.interval) mismatches.push('interval_mismatch');
  if (actualInterval.intervalCount !== expected.intervalCount) mismatches.push('interval_count_mismatch');
  if (product?.is_archived === true) mismatches.push('product_archived');

  return {
    planId,
    productId,
    ok: mismatches.length === 0,
    mismatches,
    expected: {
      amountCents: expected.amountCents,
      currency: expected.currency,
      interval: expected.interval,
      intervalCount: expected.intervalCount,
    },
    actual: {
      amountCents: Number.isInteger(actualPrice) ? actualPrice : null,
      currency: actualCurrency || null,
      interval: actualInterval.interval,
      intervalCount: actualInterval.intervalCount,
      archived: product?.is_archived === true,
      name: String(product?.name || '').trim() || null,
    },
  };
}

async function fetchPolarProduct({ accessToken, mode, productId, fetchImpl = global.fetch }) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Global fetch is unavailable');
  }
  const response = await fetchImpl(
    `${resolvePolarApiBase(mode)}/v1/products/${encodeURIComponent(productId)}`,
    { headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    throw new Error(`Polar product request failed (${response.status})`);
  }
  return response.json();
}

async function checkPolarPriceParity({
  accessToken,
  mode,
  enabledPlans,
  env = process.env,
  fetchImpl = global.fetch,
}) {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  if (!['test', 'live'].includes(normalizedMode)) {
    throw new Error('Price parity mode must be "test" or "live"');
  }
  const normalizedToken = String(accessToken || '').trim();
  if (!normalizedToken) {
    throw new Error('POLAR_ACCESS_TOKEN is required for the read-only price parity check');
  }

  const selectedPlans = PLAN_IDS.filter((planId) => enabledPlans?.[planId] === true);
  const results = [];
  for (const planId of selectedPlans) {
    const productId = resolvePolarProductId(planId, normalizedMode, env);
    if (!productId) {
      results.push({
        planId,
        productId: null,
        ok: false,
        mismatches: ['product_id_missing'],
        expected: { ...resolvePlanCatalog(env)[planId] },
        actual: null,
      });
      continue;
    }
    const product = await fetchPolarProduct({ accessToken: normalizedToken, mode: normalizedMode, productId, fetchImpl });
    results.push(comparePolarProduct(planId, productId, product, env));
  }

  return {
    provider: 'polar',
    mode: normalizedMode,
    checkedPlans: results.length,
    ok: results.every((result) => result.ok),
    results,
  };
}

module.exports = {
  checkLemonSqueezyPriceParity,
  checkPolarPriceParity,
  comparePolarProduct,
  compareVariant,
  normalizePolarInterval,
  normalizeProviderInterval,
  resolveVariantId,
};
