// Polar environment contract. Everything is mode-scoped: the sandbox and the
// production organization are separate Polar servers with their own tokens,
// webhook secrets and product ids, so a live value never falls back to a test
// value or to an unscoped name.

const PLAN_IDS = Object.freeze(['monthly', 'quarterly', 'annual', 'lifetime']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const API_BASE = Object.freeze({
  test: 'https://sandbox-api.polar.sh',
  live: 'https://api.polar.sh',
});
const CHECKOUT_HOSTS = Object.freeze({
  test: 'sandbox.polar.sh',
  live: 'polar.sh',
});

function normalizeMode(mode) {
  return mode === 'test' ? 'test' : 'live';
}

function modeSuffix(mode) {
  return normalizeMode(mode).toUpperCase();
}

function resolvePolarApiBase(mode) {
  return API_BASE[normalizeMode(mode)];
}

function resolvePolarCheckoutHost(mode) {
  return CHECKOUT_HOSTS[normalizeMode(mode)];
}

function resolvePolarAccessToken(mode, env = process.env) {
  return String(env[`POLAR_ACCESS_TOKEN_${modeSuffix(mode)}`] || '').trim();
}

function resolvePolarWebhookSecrets(env = process.env) {
  return {
    test: String(env.POLAR_WEBHOOK_SECRET_TEST || '').trim(),
    live: String(env.POLAR_WEBHOOK_SECRET_LIVE || '').trim(),
  };
}

function normalizeProductId(value) {
  const str = String(value || '').trim().toLowerCase();
  return UUID_PATTERN.test(str) ? str : '';
}

function resolvePolarProductId(planId, mode, env = process.env) {
  const plan = String(planId || '').trim().toLowerCase();
  if (!PLAN_IDS.includes(plan)) return '';
  return normalizeProductId(env[`POLAR_${plan.toUpperCase()}_PRODUCT_ID_${modeSuffix(mode)}`]);
}

// { productId: planId } for the plans configured in this mode.
function resolvePolarPlanByProductId(mode, env = process.env) {
  const map = {};
  for (const planId of PLAN_IDS) {
    const productId = resolvePolarProductId(planId, mode, env);
    if (productId) map[productId] = planId;
  }
  return map;
}

function resolvePolarLifetimeProductIds(mode, env = process.env) {
  const productId = resolvePolarProductId('lifetime', mode, env);
  return productId ? [productId] : [];
}

module.exports = {
  PLAN_IDS,
  normalizeMode,
  normalizeProductId,
  resolvePolarAccessToken,
  resolvePolarApiBase,
  resolvePolarCheckoutHost,
  resolvePolarLifetimeProductIds,
  resolvePolarPlanByProductId,
  resolvePolarProductId,
  resolvePolarWebhookSecrets,
};
