// Polar webhook contract: Standard Webhooks signatures and the mapping from
// Polar's order / subscription / refund events to the provider-agnostic
// entitlement shape the billing route applies. Facts behind the mapping come
// from the sandbox probe of 2026-11-23 (reports/polar-entegrasyon-plani §12):
// order amounts are tax inclusive, subscriptions keep `status: active` with
// `ends_at` when cancelled at period end, revokes set `ended_at`, and refunds
// never touch the subscription.

const crypto = require('crypto');
const { normalizeProductId } = require('./polar-config');

const SIGNATURE_VERSION = 'v1';
const DEFAULT_TOLERANCE_SECONDS = 5 * 60;
const SECRET_PREFIX = 'whsec_';

const KNOWN_EVENT_TYPES = new Set([
  'checkout.created',
  'checkout.updated',
  'checkout.expired',
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.state_changed',
  'order.created',
  'order.updated',
  'order.paid',
  'order.refunded',
  'refund.created',
  'refund.updated',
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.canceled',
  'subscription.uncanceled',
  'subscription.revoked',
  'subscription.past_due',
  'subscription.cycled',
  'subscription.paused',
  'subscription.resumed',
  'subscription.migrated',
  'benefit_grant.created',
  'benefit_grant.updated',
  'benefit_grant.revoked',
]);

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

// Polar secrets generated since 2026-09-08 follow Standard Webhooks
// (`whsec_` + base64 key). Older secrets, and secrets typed by hand in the
// dashboard, are used as raw UTF-8 bytes. Both keys are tried so a rotation
// never locks the endpoint out.
function candidateKeys(secret) {
  const value = String(secret || '').trim();
  if (!value) return [];
  const keys = [Buffer.from(value, 'utf8')];
  if (value.startsWith(SECRET_PREFIX)) {
    const encoded = value.slice(SECRET_PREFIX.length);
    try {
      const decoded = Buffer.from(encoded, 'base64');
      if (decoded.length) keys.unshift(decoded);
    } catch {
      // not base64: the raw key above still applies
    }
  }
  return keys;
}

function parseSignatureHeader(header) {
  return String(header || '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf(',');
      if (separator === -1) return null;
      return { version: part.slice(0, separator), signature: part.slice(separator + 1) };
    })
    .filter((entry) => entry && entry.version === SIGNATURE_VERSION && entry.signature);
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyPolarSignature({
  rawBody,
  webhookId,
  webhookTimestamp,
  webhookSignature,
  secret,
  now = new Date(),
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
}) {
  const id = String(webhookId || '').trim();
  const timestamp = String(webhookTimestamp || '').trim();
  if (!id || !timestamp || !/^\d+$/.test(timestamp)) return false;
  const keys = candidateKeys(secret);
  const signatures = parseSignatureHeader(webhookSignature);
  if (!keys.length || !signatures.length) return false;

  const nowSeconds = Math.floor(new Date(now).getTime() / 1000);
  const sentSeconds = Number(timestamp);
  if (!Number.isFinite(nowSeconds) || Math.abs(nowSeconds - sentSeconds) > toleranceSeconds) return false;

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''));
  const signedContent = Buffer.concat([Buffer.from(`${id}.${timestamp}.`, 'utf8'), payload]);
  for (const key of keys) {
    const expected = crypto.createHmac('sha256', key).update(signedContent).digest('base64');
    if (signatures.some((entry) => timingSafeEqual(entry.signature, expected))) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(String(value).trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCentAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : null;
}

function trimmed(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function lower(value) {
  return trimmed(value).toLowerCase();
}

function payloadHash(rawBody, body) {
  const payload = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(String(rawBody || JSON.stringify(body || {})));
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function extractEventType(body) {
  return lower(body?.type);
}

function isEventTypeKnown(eventType) {
  return KNOWN_EVENT_TYPES.has(String(eventType || ''));
}

function eventFamily(eventType) {
  return String(eventType || '').split('.')[0];
}

// Checkout metadata is copied onto the order and the subscription, so every
// event we act on carries the attempt and the user that started it.
function extractMetadataValue(data, keys) {
  const metadata = data?.metadata;
  if (!metadata || typeof metadata !== 'object') return '';
  for (const key of keys) {
    const raw = metadata[key];
    if (raw !== undefined && raw !== null && trimmed(raw)) return trimmed(raw);
  }
  return '';
}

function extractCustomer(data) {
  const customer = data?.customer && typeof data.customer === 'object' ? data.customer : {};
  return {
    id: trimmed(customer.id || data?.customer_id),
    email: lower(customer.email || data?.customer_email),
    externalId: trimmed(customer.external_id ?? data?.external_customer_id ?? data?.customer_external_id),
  };
}

function extractProduct(data) {
  const product = data?.product && typeof data.product === 'object' ? data.product : {};
  const id = normalizeProductId(product.id || data?.product_id);
  const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
  return { id, planHint: lower(metadata.fa_plan_id) };
}

function resolvePlanId({ product, planByProductId }) {
  if (product.id && planByProductId && planByProductId[product.id]) return planByProductId[product.id];
  if (['monthly', 'quarterly', 'annual', 'lifetime'].includes(product.planHint)) return product.planHint;
  return '';
}

function isLifetimeProduct({ product, planId, lifetimeProductIds }) {
  if (planId === 'lifetime') return true;
  if (!product.id) return false;
  return (lifetimeProductIds || []).some((id) => normalizeProductId(id) === product.id);
}

function isPaidOrderEvent(eventType, data) {
  if (eventType === 'order.paid') return true;
  return eventType === 'order.created' && (data?.paid === true || lower(data?.status) === 'paid');
}

// Polar amounts are tax inclusive: total = subtotal - discount, net = total - tax.
// CheckoutAttempt stores a tax-exclusive subtotal so the shared identity
// subtotal - discount + tax = total holds for every provider.
function extractOrderPayment(eventType, data) {
  const status = lower(data?.status);
  const currency = trimmed(data?.currency).toUpperCase();
  const subtotalInclusiveCents = parseCentAmount(data?.subtotal_amount);
  const discountCents = parseCentAmount(data?.discount_amount) ?? (data?.discount_amount === undefined ? 0 : null);
  const taxCents = parseCentAmount(data?.tax_amount) ?? (data?.tax_amount === null ? 0 : null);
  const totalCents = parseCentAmount(data?.total_amount);
  const netCents = parseCentAmount(data?.net_amount);
  const amountsPresent = [subtotalInclusiveCents, discountCents, taxCents, totalCents, netCents]
    .every((amount) => amount !== null);
  const subtotalCents = amountsPresent ? netCents + discountCents : null;
  const inclusiveIdentity = amountsPresent
    && totalCents === subtotalInclusiveCents - discountCents
    && netCents === totalCents - taxCents;
  const exclusiveIdentity = amountsPresent
    && totalCents === subtotalInclusiveCents - discountCents + taxCents
    && netCents === subtotalInclusiveCents - discountCents;

  return {
    status,
    currency,
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    netCents,
    verified: isPaidOrderEvent(eventType, data)
      && status === 'paid'
      && /^[A-Z]{3}$/.test(currency)
      && amountsPresent
      && totalCents > 0
      && discountCents <= subtotalCents
      && totalCents >= taxCents
      && (inclusiveIdentity || exclusiveIdentity),
  };
}

// ---------------------------------------------------------------------------
// Entitlement mapping
// ---------------------------------------------------------------------------

function resolveSubscriptionEntitlement(eventType, data, now) {
  const status = lower(data?.status);
  const periodEnd = parseDateValue(data?.current_period_end);
  const endsAt = parseDateValue(data?.ends_at);
  const endedAt = parseDateValue(data?.ended_at);
  const cancelAtPeriodEnd = data?.cancel_at_period_end === true;
  const nowMs = new Date(now).getTime();

  if (eventType === 'subscription.revoked') {
    return { status: 'none', validUntil: null, apply: true, inferred: false };
  }
  if (status === 'active' || status === 'trialing') {
    if (cancelAtPeriodEnd) {
      const validUntil = endsAt || periodEnd;
      return { status: 'cancelled', validUntil, apply: true, inferred: !validUntil };
    }
    return { status: 'active', validUntil: periodEnd, apply: true, inferred: false };
  }
  if (status === 'past_due') {
    // Access continues to the paid-through date; a later `active` restores it.
    const validUntil = periodEnd || endsAt;
    return { status: 'cancelled', validUntil, apply: true, inferred: !validUntil };
  }
  if (status === 'canceled' || status === 'cancelled') {
    if (endedAt && endedAt.getTime() <= nowMs) {
      return { status: 'none', validUntil: null, apply: true, inferred: false };
    }
    const validUntil = endsAt || periodEnd;
    return { status: 'cancelled', validUntil, apply: true, inferred: !validUntil };
  }
  if (status === 'paused') {
    const validUntil = periodEnd || endsAt;
    return { status: 'cancelled', validUntil, apply: true, inferred: !validUntil };
  }
  if (status === 'unpaid' || status === 'incomplete_expired') {
    return { status: 'none', validUntil: null, apply: true, inferred: false };
  }
  // incomplete and unknown statuses: nothing to grant yet
  return { status: 'none', validUntil: null, apply: false, inferred: false };
}

function resolveOrderEntitlement(eventType, data, lifetime) {
  if (eventType === 'order.refunded') {
    const status = lower(data?.status);
    // A partial refund keeps the purchase; only a full refund revokes.
    if (status === 'partially_refunded') return { status: 'none', validUntil: null, apply: false, inferred: false };
    return { status: 'none', validUntil: null, apply: true, inferred: false };
  }
  if (lifetime && isPaidOrderEvent(eventType, data)) {
    return { status: 'lifetime', validUntil: null, apply: true, inferred: false };
  }
  // Subscription invoices grant nothing by themselves; the subscription event does.
  return { status: 'none', validUntil: null, apply: false, inferred: false };
}

function normalizePolarEvent(body, rawBody, options = {}) {
  const {
    webhookId = '',
    lifetimeProductIds = [],
    planByProductId = {},
    now = new Date(),
  } = options;
  const eventType = extractEventType(body);
  const family = eventFamily(eventType);
  const data = body?.data && typeof body.data === 'object' ? body.data : {};
  const customer = extractCustomer(data);
  const product = extractProduct(data);
  const planId = resolvePlanId({ product, planByProductId });
  const lifetime = isLifetimeProduct({ product, planId, lifetimeProductIds });

  let entitlement = { status: 'none', validUntil: null, apply: false, inferred: false };
  if (family === 'subscription') {
    entitlement = resolveSubscriptionEntitlement(eventType, data, now);
  } else if (family === 'order') {
    entitlement = resolveOrderEntitlement(eventType, data, lifetime);
  }

  const explicitId = trimmed(webhookId);
  const objectId = trimmed(data?.id);
  const eventId = explicitId
    || (objectId ? `${eventType || 'unknown'}:${objectId}:${payloadHash(rawBody, body)}` : `${eventType || 'unknown'}:${payloadHash(rawBody, body)}`);

  const subscriptionId = family === 'subscription'
    ? objectId
    : trimmed(data?.subscription_id);
  const orderId = family === 'order'
    ? objectId
    : trimmed(data?.order_id);
  const email = customer.email;
  const userId = customer.externalId || extractMetadataValue(data, ['fa_user_id', 'faUserId', 'user_id', 'userId']);

  return {
    eventId,
    eventType,
    email,
    purchaseEmail: email,
    customEmail: '',
    userId,
    attemptId: extractMetadataValue(data, ['fa_checkout_attempt_id', 'faCheckoutAttemptId', 'checkout_attempt_id', 'attempt_id']),
    checkoutId: trimmed(data?.checkout_id),
    startedAt: parseDateValue(data?.started_at) || parseDateValue(data?.created_at),
    customerId: customer.id,
    subscriptionId,
    manageUrl: '',
    orderId,
    productId: product.id,
    planId,
    lifetime,
    billingReason: lower(data?.billing_reason),
    orderPayment: family === 'order' ? extractOrderPayment(eventType, data) : null,
    entitlement: { status: entitlement.status, validUntil: entitlement.validUntil },
    shouldApplyEntitlement: entitlement.apply,
    eventTypeKnown: isEventTypeKnown(eventType),
    validUntilInferred: entitlement.inferred,
  };
}

module.exports = {
  KNOWN_EVENT_TYPES,
  extractOrderPayment,
  isEventTypeKnown,
  normalizePolarEvent,
  parseSignatureHeader,
  verifyPolarSignature,
};
