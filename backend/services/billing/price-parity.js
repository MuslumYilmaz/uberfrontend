const { PLAN_CATALOG } = require('./checkout-start');

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
  const interval = String(attributes.interval || '').trim().toLowerCase();
  if (!interval) return { interval: 'one_time', intervalCount: null };
  const intervalCount = Number(attributes.interval_count);
  return {
    interval,
    intervalCount: Number.isInteger(intervalCount) && intervalCount > 0 ? intervalCount : 1,
  };
}

function compareVariant(planId, variantId, payload, mode = null) {
  const expected = PLAN_CATALOG[planId];
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
        expected: { ...PLAN_CATALOG[planId] },
        actual: null,
      });
      continue;
    }
    const payload = await fetchVariant({ apiKey: normalizedApiKey, variantId, fetchImpl });
    results.push(compareVariant(planId, variantId, payload, normalizedMode));
  }

  return {
    provider: 'lemonsqueezy',
    mode: normalizedMode,
    checkedPlans: results.length,
    ok: results.every((result) => result.ok),
    results,
  };
}

module.exports = {
  checkLemonSqueezyPriceParity,
  compareVariant,
  normalizeProviderInterval,
  resolveVariantId,
};
