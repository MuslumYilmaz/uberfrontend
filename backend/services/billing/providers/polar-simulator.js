// Admin-only Polar event simulator: builds webhook-shaped payloads for the
// same scenarios the Lemon Squeezy simulator supports, so an operator can
// walk a test account through activate / renew / cancel / refund / lifetime /
// expire / revoke without a real checkout. Shapes follow the sandbox objects
// captured on 2026-11-23.
const crypto = require('crypto');

const SUPPORTED_SCENARIOS = new Set([
  'activate',
  'renew',
  'cancel',
  'refund',
  'lifetime',
  'expire',
  'revoke',
]);

function readTrimmed(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function readOptionalIsoDate(value, fieldName) {
  const raw = readTrimmed(value);
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`Invalid "${fieldName}" date`);
    error.statusCode = 400;
    throw error;
  }
  return parsed.toISOString();
}

function readBooleanFlag(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  const raw = readTrimmed(value).toLowerCase();
  if (!raw) return fallback;
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  return fallback;
}

function readScenario(input) {
  const scenario = readTrimmed(input).toLowerCase() || 'activate';
  if (!SUPPORTED_SCENARIOS.has(scenario)) {
    const error = new Error(`Unsupported scenario "${scenario}"`);
    error.statusCode = 400;
    throw error;
  }
  return scenario;
}

function readAmount(value, fallback) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : fallback;
}

function buildPolarSimulationPayload({ user, input = {} }) {
  const scenario = readScenario(input.scenario);
  const validUntil = readOptionalIsoDate(input.validUntil, 'validUntil');
  const startedAt = readOptionalIsoDate(input.startedAt, 'startedAt') || new Date().toISOString();
  const purchaseEmail = readTrimmed(input.purchaseEmail).toLowerCase() || user.email;
  const testMode = readBooleanFlag(input.testMode, true);
  const externalId = readTrimmed(input.externalId) || `sim_${crypto.randomUUID()}`;
  const attemptId = readTrimmed(input.attemptId);
  const customerId = readTrimmed(input.customerId) || `cus_sim_${String(user._id)}`;
  const subscriptionId = readTrimmed(input.subscriptionId) || `sub_sim_${String(user._id)}`;
  const orderId = readTrimmed(input.orderId) || externalId;
  const productId = readTrimmed(input.productId) || null;
  const planId = readTrimmed(input.planId).toLowerCase() || (scenario === 'lifetime' ? 'lifetime' : 'monthly');
  const amount = readAmount(input.amountCents, scenario === 'lifetime' ? 17900 : 2400);
  const tax = readAmount(input.taxCents, 0);
  const now = new Date().toISOString();

  if (['activate', 'renew', 'cancel'].includes(scenario) && !validUntil) {
    const error = new Error('"validUntil" is required for activate, renew and cancel scenarios');
    error.statusCode = 400;
    throw error;
  }
  const userId = readTrimmed(user?._id);
  if (!userId) {
    const error = new Error('Missing "user._id"');
    error.statusCode = 400;
    throw error;
  }

  const customer = { id: customerId, email: purchaseEmail, external_id: userId, name: user.username || null };
  const metadata = { fa_user_id: userId, ...(attemptId ? { fa_checkout_attempt_id: attemptId } : {}), fa_simulated: 'true' };
  const product = {
    id: productId,
    name: `FrontendAtlas Premium — ${planId}`,
    recurring_interval: planId === 'lifetime' ? null : planId === 'annual' ? 'year' : 'month',
    recurring_interval_count: planId === 'lifetime' ? null : planId === 'quarterly' ? 3 : 1,
    metadata: { fa_plan_id: planId },
  };
  const subscriptionBase = {
    id: subscriptionId,
    created_at: startedAt,
    modified_at: now,
    status: 'active',
    amount,
    currency: 'usd',
    recurring_interval: product.recurring_interval,
    recurring_interval_count: product.recurring_interval_count,
    current_period_start: startedAt,
    current_period_end: validUntil || null,
    cancel_at_period_end: false,
    canceled_at: null,
    started_at: startedAt,
    ends_at: null,
    ended_at: null,
    checkout_id: null,
    customer_id: customerId,
    customer,
    product_id: productId,
    product,
    metadata,
  };
  const orderBase = {
    id: orderId,
    created_at: startedAt,
    modified_at: now,
    status: 'paid',
    paid: true,
    billing_reason: scenario === 'lifetime' ? 'purchase' : 'subscription_create',
    checkout_id: null,
    subscription_id: scenario === 'lifetime' ? null : subscriptionId,
    customer_id: customerId,
    customer,
    product_id: productId,
    product,
    metadata,
    currency: 'usd',
    subtotal_amount: amount,
    discount_amount: 0,
    tax_amount: tax,
    total_amount: amount,
    net_amount: amount - tax,
  };

  let type;
  let data;
  switch (scenario) {
    case 'activate':
      type = 'subscription.updated';
      data = subscriptionBase;
      break;
    case 'renew':
      type = 'subscription.cycled';
      data = subscriptionBase;
      break;
    case 'cancel':
      type = 'subscription.updated';
      data = { ...subscriptionBase, cancel_at_period_end: true, canceled_at: now, ends_at: validUntil };
      break;
    case 'expire':
      type = 'subscription.updated';
      data = { ...subscriptionBase, status: 'canceled', canceled_at: now, ends_at: now, ended_at: now };
      break;
    case 'revoke':
      type = 'subscription.revoked';
      data = { ...subscriptionBase, status: 'canceled', canceled_at: now, ends_at: now, ended_at: now };
      break;
    case 'refund':
      type = 'order.refunded';
      data = { ...orderBase, status: 'refunded', refunded_amount: amount - tax, refunded_tax_amount: tax };
      break;
    case 'lifetime':
      type = 'order.paid';
      data = orderBase;
      break;
    default:
      type = 'subscription.updated';
      data = subscriptionBase;
  }

  return {
    scenario,
    mode: testMode ? 'test' : 'live',
    webhookId: `sim_${externalId}`,
    payload: { type, timestamp: now, data },
  };
}

module.exports = {
  SUPPORTED_SCENARIOS,
  buildPolarSimulationPayload,
};
