// Polar webhook payload builders. Shapes follow the sandbox objects captured on
// 2026-11-23 (reports/polar-entegrasyon-plani-2026-11-19.md §12): amounts are
// tax inclusive and checkout metadata is copied onto orders and subscriptions.
const crypto = require('crypto');

const PRODUCT_IDS = Object.freeze({
  monthly: '6fb90ee2-8b50-4764-9d4a-cd9a0d2a6fb8',
  quarterly: 'be567274-a3bd-4869-b414-0854810386fe',
  annual: '480a7e41-614c-42cf-ab41-6178a3910121',
  lifetime: '87975549-328f-4a1f-a9c4-09245282d2bd',
});

function uuid() {
  return crypto.randomUUID();
}

function buildCustomer({ id = uuid(), email = 'buyer@example.com', externalId = null } = {}) {
  return {
    id,
    email,
    name: 'Polar Test User',
    external_id: externalId,
    billing_address: { country: 'TR', line1: null, line2: null, postal_code: null, city: null, state: null },
  };
}

function buildProduct(planId = 'monthly', { metadata } = {}) {
  const intervals = {
    monthly: { recurring_interval: 'month', recurring_interval_count: 1 },
    quarterly: { recurring_interval: 'month', recurring_interval_count: 3 },
    annual: { recurring_interval: 'year', recurring_interval_count: 1 },
    lifetime: { recurring_interval: null, recurring_interval_count: null },
  };
  return {
    id: PRODUCT_IDS[planId],
    name: `FrontendAtlas Premium — ${planId}`,
    is_recurring: planId !== 'lifetime',
    is_archived: false,
    ...intervals[planId],
    metadata: metadata === undefined ? { fa_plan_id: planId } : metadata,
  };
}

// Tax-inclusive amounts: total = subtotal - discount, net = total - tax.
function buildAmounts({ subtotal = 1200, discount = 0, tax = 200 } = {}) {
  const total = subtotal - discount;
  return {
    currency: 'usd',
    subtotal_amount: subtotal,
    discount_amount: discount,
    tax_amount: tax,
    total_amount: total,
    net_amount: total - tax,
    amount: subtotal,
    refunded_amount: 0,
    refunded_tax_amount: 0,
  };
}

function buildOrder({
  id = uuid(),
  planId = 'monthly',
  billingReason = 'subscription_create',
  status = 'paid',
  paid = true,
  checkoutId = uuid(),
  subscriptionId = planId === 'lifetime' ? null : uuid(),
  customer = buildCustomer(),
  metadata = {},
  amounts = {},
  product,
  createdAt = '2026-11-23T08:07:08.018957Z',
} = {}) {
  return {
    id,
    created_at: createdAt,
    modified_at: createdAt,
    status,
    paid,
    billing_reason: billingReason,
    billing_name: customer.name,
    billing_address: customer.billing_address,
    checkout_id: checkoutId,
    subscription_id: subscriptionId,
    customer_id: customer.id,
    customer,
    product_id: (product || buildProduct(planId)).id,
    product: product || buildProduct(planId),
    metadata,
    ...buildAmounts(amounts),
  };
}

function buildSubscription({
  id = uuid(),
  planId = 'monthly',
  status = 'active',
  checkoutId = uuid(),
  customer = buildCustomer(),
  metadata = {},
  amount = 1200,
  currentPeriodStart = '2026-11-23T08:07:07.262829Z',
  currentPeriodEnd = '2026-12-23T08:07:07.262829Z',
  cancelAtPeriodEnd = false,
  canceledAt = null,
  endsAt = null,
  endedAt = null,
  startedAt = '2026-11-23T08:07:07.262829Z',
  product,
} = {}) {
  const resolvedProduct = product || buildProduct(planId);
  return {
    id,
    created_at: startedAt,
    modified_at: '2026-11-23T08:07:08.333777Z',
    status,
    amount,
    currency: 'usd',
    recurring_interval: resolvedProduct.recurring_interval,
    recurring_interval_count: resolvedProduct.recurring_interval_count,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    canceled_at: canceledAt,
    started_at: startedAt,
    ends_at: endsAt,
    ended_at: endedAt,
    trial_end: null,
    checkout_id: checkoutId,
    customer_id: customer.id,
    customer,
    product_id: resolvedProduct.id,
    product: resolvedProduct,
    discount_id: null,
    metadata,
  };
}

function buildEvent(type, data) {
  return { type, timestamp: '2026-11-23T08:07:08.500000Z', data };
}

// Standard Webhooks signature: base64 HMAC-SHA256 over `${id}.${timestamp}.${body}`
// with the key decoded from the `whsec_` secret.
function signStandardWebhook(rawBody, { secret, webhookId = `msg_${uuid()}`, timestamp = Math.floor(Date.now() / 1000) }) {
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice('whsec_'.length), 'base64') : Buffer.from(secret, 'utf8');
  const signature = crypto
    .createHmac('sha256', key)
    .update(`${webhookId}.${timestamp}.${rawBody}`)
    .digest('base64');
  return {
    'webhook-id': webhookId,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': `v1,${signature}`,
  };
}

module.exports = {
  PRODUCT_IDS,
  buildAmounts,
  buildCustomer,
  buildEvent,
  buildOrder,
  buildProduct,
  buildSubscription,
  signStandardWebhook,
  uuid,
};
