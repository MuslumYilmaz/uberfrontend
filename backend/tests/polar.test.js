const crypto = require('crypto');
const {
  extractOrderPayment,
  normalizePolarEvent,
  verifyPolarSignature,
} = require('../services/billing/providers/polar');
const {
  resolvePolarLifetimeProductIds,
  resolvePolarPlanByProductId,
  resolvePolarProductId,
} = require('../services/billing/providers/polar-config');
const { applyNormalizedPolarEventToUser } = require('../services/billing/user-billing-state');
const {
  PRODUCT_IDS,
  buildCustomer,
  buildEvent,
  buildOrder,
  buildProduct,
  buildSubscription,
  signStandardWebhook,
} = require('./helpers/polar-fixtures');

const SECRET = `whsec_${Buffer.from('polar-unit-secret').toString('base64')}`;
const NOW = new Date('2026-11-23T09:00:00Z');
const PLAN_BY_PRODUCT = Object.fromEntries(Object.entries(PRODUCT_IDS).map(([plan, id]) => [id, plan]));

function normalize(body, options = {}) {
  const raw = JSON.stringify(body);
  return normalizePolarEvent(body, raw, { now: NOW, planByProductId: PLAN_BY_PRODUCT, ...options });
}

describe('polar signature verification', () => {
  const rawBody = JSON.stringify({ type: 'order.paid', data: { id: 'o_1' } });

  test('accepts a Standard Webhooks signature signed with the decoded whsec key', () => {
    const headers = signStandardWebhook(rawBody, { secret: SECRET, timestamp: Math.floor(NOW.getTime() / 1000) });
    expect(verifyPolarSignature({
      rawBody,
      webhookId: headers['webhook-id'],
      webhookTimestamp: headers['webhook-timestamp'],
      webhookSignature: headers['webhook-signature'],
      secret: SECRET,
      now: NOW,
    })).toBe(true);
  });

  test('accepts a legacy signature keyed with the raw secret string', () => {
    const timestamp = Math.floor(NOW.getTime() / 1000);
    const signature = crypto.createHmac('sha256', Buffer.from(SECRET, 'utf8')).update(`msg_1.${timestamp}.${rawBody}`).digest('base64');
    expect(verifyPolarSignature({
      rawBody,
      webhookId: 'msg_1',
      webhookTimestamp: String(timestamp),
      webhookSignature: `v1,${signature}`,
      secret: SECRET,
      now: NOW,
    })).toBe(true);
  });

  test('accepts when one of several signatures matches', () => {
    const headers = signStandardWebhook(rawBody, { secret: SECRET, timestamp: Math.floor(NOW.getTime() / 1000) });
    expect(verifyPolarSignature({
      rawBody,
      webhookId: headers['webhook-id'],
      webhookTimestamp: headers['webhook-timestamp'],
      webhookSignature: `v1,AAAA ${headers['webhook-signature']}`,
      secret: SECRET,
      now: NOW,
    })).toBe(true);
  });

  test('rejects a wrong secret, a stale timestamp, a tampered body and missing headers', () => {
    const headers = signStandardWebhook(rawBody, { secret: SECRET, timestamp: Math.floor(NOW.getTime() / 1000) });
    const base = {
      rawBody,
      webhookId: headers['webhook-id'],
      webhookTimestamp: headers['webhook-timestamp'],
      webhookSignature: headers['webhook-signature'],
      secret: SECRET,
      now: NOW,
    };
    expect(verifyPolarSignature({ ...base, secret: 'whsec_other' })).toBe(false);
    expect(verifyPolarSignature({ ...base, now: new Date(NOW.getTime() + 10 * 60 * 1000) })).toBe(false);
    expect(verifyPolarSignature({ ...base, rawBody: `${rawBody} ` })).toBe(false);
    expect(verifyPolarSignature({ ...base, webhookId: '' })).toBe(false);
    expect(verifyPolarSignature({ ...base, webhookSignature: 'v2,abc' })).toBe(false);
    expect(verifyPolarSignature({ ...base, secret: '' })).toBe(false);
  });
});

describe('polar event normalization', () => {
  const userId = '507f1f77bcf86cd799439011';
  const customer = buildCustomer({ externalId: userId, email: 'Buyer@Example.com' });
  const metadata = { fa_user_id: userId, fa_checkout_attempt_id: 'chk_abc', fa_price_reason: 'regional' };

  test('order.paid for a subscription records the verified payment but grants nothing', () => {
    const order = buildOrder({ customer, metadata, checkoutId: 'chk-uuid', subscriptionId: 'sub-uuid' });
    const out = normalize(buildEvent('order.paid', order), { webhookId: 'msg_order_1' });
    expect(out.eventId).toBe('msg_order_1');
    expect(out.eventType).toBe('order.paid');
    expect(out.eventTypeKnown).toBe(true);
    expect(out.shouldApplyEntitlement).toBe(false);
    expect(out.email).toBe('buyer@example.com');
    expect(out.userId).toBe(userId);
    expect(out.attemptId).toBe('chk_abc');
    expect(out.checkoutId).toBe('chk-uuid');
    expect(out.subscriptionId).toBe('sub-uuid');
    expect(out.orderId).toBe(order.id);
    expect(out.customerId).toBe(customer.id);
    expect(out.planId).toBe('monthly');
    expect(out.lifetime).toBe(false);
    expect(out.billingReason).toBe('subscription_create');
    // tax inclusive: 1200 charged, 200 tax inside, so the tax-exclusive subtotal is 1000
    expect(out.orderPayment).toEqual(expect.objectContaining({
      verified: true,
      currency: 'USD',
      subtotalCents: 1000,
      discountCents: 0,
      taxCents: 200,
      totalCents: 1200,
      netCents: 1000,
    }));
  });

  test('a lifetime purchase grants lifetime by product id, by product metadata, or by plan map', () => {
    const byEnv = normalize(
      buildEvent('order.paid', buildOrder({ planId: 'lifetime', billingReason: 'purchase', customer, product: buildProduct('lifetime', { metadata: {} }) })),
      { planByProductId: {}, lifetimeProductIds: [PRODUCT_IDS.lifetime.toUpperCase()] }
    );
    expect(byEnv.entitlement).toEqual({ status: 'lifetime', validUntil: null });
    expect(byEnv.shouldApplyEntitlement).toBe(true);

    const byMetadata = normalize(
      buildEvent('order.paid', buildOrder({ planId: 'lifetime', billingReason: 'purchase', customer })),
      { planByProductId: {} }
    );
    expect(byMetadata.entitlement.status).toBe('lifetime');
    expect(byMetadata.planId).toBe('lifetime');

    const byMap = normalize(
      buildEvent('order.paid', buildOrder({ planId: 'lifetime', billingReason: 'purchase', customer, product: buildProduct('lifetime', { metadata: {} }) }))
    );
    expect(byMap.entitlement.status).toBe('lifetime');
  });

  test('order.created only grants lifetime once it is paid', () => {
    const unpaid = normalize(buildEvent('order.created', buildOrder({ planId: 'lifetime', billingReason: 'purchase', status: 'pending', paid: false, customer })));
    expect(unpaid.shouldApplyEntitlement).toBe(false);
    expect(unpaid.orderPayment.verified).toBe(false);
    const paid = normalize(buildEvent('order.created', buildOrder({ planId: 'lifetime', billingReason: 'purchase', customer })));
    expect(paid.entitlement.status).toBe('lifetime');
    expect(paid.orderPayment.verified).toBe(true);
  });

  test('a full refund revokes, a partial refund changes nothing', () => {
    const full = normalize(buildEvent('order.refunded', buildOrder({ customer, status: 'refunded' })));
    expect(full.entitlement).toEqual({ status: 'none', validUntil: null });
    expect(full.shouldApplyEntitlement).toBe(true);
    const partial = normalize(buildEvent('order.refunded', buildOrder({ customer, status: 'partially_refunded' })));
    expect(partial.shouldApplyEntitlement).toBe(false);
  });

  test('refund events carry the order and subscription ids and grant nothing', () => {
    const out = normalize(buildEvent('refund.created', {
      id: 'ref_1', status: 'succeeded', amount: 500, tax_amount: 100, order_id: 'ord_1', subscription_id: 'sub_1', customer_id: 'cus_1', metadata: {},
    }));
    expect(out.eventTypeKnown).toBe(true);
    expect(out.shouldApplyEntitlement).toBe(false);
    expect(out.orderId).toBe('ord_1');
    expect(out.subscriptionId).toBe('sub_1');
    expect(out.customerId).toBe('cus_1');
    expect(out.orderPayment).toBeNull();
  });

  test('subscription statuses map to the entitlement model', () => {
    const periodEnd = new Date('2026-12-23T08:07:07.262Z');
    const active = normalize(buildEvent('subscription.updated', buildSubscription({ customer, metadata })));
    expect(active.entitlement).toEqual({ status: 'active', validUntil: periodEnd });
    expect(active.shouldApplyEntitlement).toBe(true);
    expect(active.subscriptionId).toBeTruthy();
    expect(active.startedAt).toEqual(new Date('2026-11-23T08:07:07.262Z'));
    expect(active.userId).toBe(userId);
    expect(active.attemptId).toBe('chk_abc');
    expect(active.planId).toBe('monthly');

    const cancelAtEnd = normalize(buildEvent('subscription.updated', buildSubscription({
      customer, cancelAtPeriodEnd: true, canceledAt: '2026-11-23T08:08:27Z', endsAt: '2026-12-23T08:07:07.262829Z',
    })));
    expect(cancelAtEnd.entitlement).toEqual({ status: 'cancelled', validUntil: periodEnd });
    expect(cancelAtEnd.validUntilInferred).toBe(false);

    const pastDue = normalize(buildEvent('subscription.past_due', buildSubscription({ customer, status: 'past_due' })));
    expect(pastDue.entitlement).toEqual({ status: 'cancelled', validUntil: periodEnd });

    const canceledFuture = normalize(buildEvent('subscription.canceled', buildSubscription({
      customer, status: 'canceled', canceledAt: '2026-11-23T08:08:27Z', endsAt: '2026-12-23T08:07:07.262829Z', endedAt: null,
    })));
    expect(canceledFuture.entitlement).toEqual({ status: 'cancelled', validUntil: periodEnd });

    const revokedNow = normalize(buildEvent('subscription.updated', buildSubscription({
      customer, status: 'canceled', canceledAt: '2026-11-23T08:09:41Z', endsAt: '2026-11-23T08:09:41Z', endedAt: '2026-11-23T08:09:41Z',
    })));
    expect(revokedNow.entitlement).toEqual({ status: 'none', validUntil: null });

    const revoked = normalize(buildEvent('subscription.revoked', buildSubscription({ customer, status: 'canceled', endedAt: '2026-11-23T08:09:41Z' })));
    expect(revoked.entitlement).toEqual({ status: 'none', validUntil: null });

    const incomplete = normalize(buildEvent('subscription.created', buildSubscription({ customer, status: 'incomplete' })));
    expect(incomplete.shouldApplyEntitlement).toBe(false);

    const unpaid = normalize(buildEvent('subscription.updated', buildSubscription({ customer, status: 'unpaid' })));
    expect(unpaid.entitlement.status).toBe('none');
    expect(unpaid.shouldApplyEntitlement).toBe(true);

    const noDate = normalize(buildEvent('subscription.updated', buildSubscription({ customer, cancelAtPeriodEnd: true, currentPeriodEnd: null })));
    expect(noDate.entitlement.status).toBe('cancelled');
    expect(noDate.validUntilInferred).toBe(true);
  });

  test('falls back to metadata for the user id and hashes the body when no webhook id is given', () => {
    const anonymous = buildCustomer({ externalId: null });
    const body = buildEvent('subscription.updated', buildSubscription({ customer: anonymous, metadata: { fa_user_id: userId } }));
    const out = normalizePolarEvent(body, JSON.stringify(body), { now: NOW });
    expect(out.userId).toBe(userId);
    expect(out.eventId).toMatch(/^subscription\.updated:[0-9a-f-]+:[0-9a-f]{64}$/);
    const again = normalizePolarEvent(body, JSON.stringify(body), { now: NOW });
    expect(again.eventId).toBe(out.eventId);
  });

  test('unknown and non-billing events apply nothing', () => {
    const checkout = normalize(buildEvent('checkout.updated', { id: 'c_1', status: 'succeeded', metadata, customer_email: 'x@example.com' }));
    expect(checkout.eventTypeKnown).toBe(true);
    expect(checkout.shouldApplyEntitlement).toBe(false);
    expect(checkout.email).toBe('x@example.com');
    const unknown = normalize(buildEvent('something.new', { id: 'x' }));
    expect(unknown.eventTypeKnown).toBe(false);
    expect(unknown.shouldApplyEntitlement).toBe(false);
  });
});

describe('polar order payment verification', () => {
  test('accepts tax-inclusive and tax-exclusive identities and rejects inconsistent amounts', () => {
    const inclusive = buildOrder({ amounts: { subtotal: 9900, discount: 3960, tax: 990 } });
    expect(extractOrderPayment('order.paid', inclusive)).toEqual(expect.objectContaining({ verified: true, subtotalCents: 8910, totalCents: 5940, taxCents: 990, netCents: 4950 }));

    const exclusive = { ...buildOrder(), subtotal_amount: 2400, discount_amount: 0, tax_amount: 480, total_amount: 2880, net_amount: 2400 };
    expect(extractOrderPayment('order.paid', exclusive)).toEqual(expect.objectContaining({ verified: true, subtotalCents: 2400, totalCents: 2880 }));

    const broken = { ...buildOrder(), total_amount: 999 };
    expect(extractOrderPayment('order.paid', broken).verified).toBe(false);
    expect(extractOrderPayment('order.paid', { ...buildOrder(), status: 'pending', paid: false }).verified).toBe(false);
    expect(extractOrderPayment('order.updated', buildOrder()).verified).toBe(false);
  });
});

describe('polar product configuration', () => {
  const env = {
    POLAR_MONTHLY_PRODUCT_ID_TEST: PRODUCT_IDS.monthly,
    POLAR_LIFETIME_PRODUCT_ID_TEST: PRODUCT_IDS.lifetime.toUpperCase(),
    POLAR_ANNUAL_PRODUCT_ID_TEST: 'not-a-uuid',
    POLAR_MONTHLY_PRODUCT_ID_LIVE: PRODUCT_IDS.quarterly,
  };

  test('resolves mode-scoped product ids, rejects malformed ones and never falls back across modes', () => {
    expect(resolvePolarProductId('monthly', 'test', env)).toBe(PRODUCT_IDS.monthly);
    expect(resolvePolarProductId('lifetime', 'test', env)).toBe(PRODUCT_IDS.lifetime);
    expect(resolvePolarProductId('annual', 'test', env)).toBe('');
    expect(resolvePolarProductId('lifetime', 'live', env)).toBe('');
    expect(resolvePolarProductId('bogus', 'test', env)).toBe('');
    expect(resolvePolarPlanByProductId('test', env)).toEqual({ [PRODUCT_IDS.monthly]: 'monthly', [PRODUCT_IDS.lifetime]: 'lifetime' });
    expect(resolvePolarPlanByProductId('live', env)).toEqual({ [PRODUCT_IDS.quarterly]: 'monthly' });
    expect(resolvePolarLifetimeProductIds('test', env)).toEqual([PRODUCT_IDS.lifetime]);
    expect(resolvePolarLifetimeProductIds('live', env)).toEqual([]);
  });
});

describe('polar entitlement application', () => {
  test('writes the entitlement and the polar provider metadata', () => {
    const user = { entitlements: {}, billing: { providers: {} } };
    const normalized = normalizePolarEvent(
      buildEvent('subscription.updated', buildSubscription({ customer: buildCustomer({ externalId: '507f1f77bcf86cd799439011' }) })),
      '{}',
      { now: NOW }
    );
    applyNormalizedPolarEventToUser(user, normalized, { eventId: 'msg_1', purchaseEmail: 'buyer@example.com' });
    expect(user.entitlements.pro.status).toBe('active');
    expect(user.accessTier).toBe('premium');
    expect(user.billing.providers.polar).toEqual(expect.objectContaining({
      customerId: normalized.customerId,
      subscriptionId: normalized.subscriptionId,
      purchaserEmail: 'buyer@example.com',
      lastEventId: 'msg_1',
    }));
    expect(user.billing.providers.lemonsqueezy).toBeUndefined();
  });
});
