/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  PRODUCT_IDS,
  buildCustomer,
  buildEvent,
  buildOrder,
  buildProduct,
  buildSubscription,
  signStandardWebhook,
  uuid,
} = require('./helpers/polar-fixtures');

const TEST_SECRET = `whsec_${Buffer.from('polar-sandbox-secret').toString('base64')}`;
const LIVE_SECRET = `whsec_${Buffer.from('polar-live-secret').toString('base64')}`;

jest.setTimeout(120000);

let app;
let User;
let BillingEvent;
let CheckoutAttempt;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;

async function seedUser(overrides = {}) {
  return User.create({
    email: 'test@example.com',
    username: 'test_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
    ...overrides,
  });
}

async function seedAttempt(user, overrides = {}) {
  return CheckoutAttempt.create({
    attemptId: `chk_${uuid().slice(0, 12)}`,
    userId: user._id,
    provider: 'polar',
    planId: 'monthly',
    mode: 'test',
    status: 'created',
    checkoutUrl: 'https://sandbox.polar.sh/checkout/polar_c_test',
    successUrl: 'http://localhost:4310/billing/success',
    cancelUrl: 'http://localhost:4310/billing/cancel',
    customerEmail: user.email,
    customerUserId: String(user._id),
    ...overrides,
  });
}

function post(body, { secret = TEST_SECRET, webhookId, timestamp, headers = {} } = {}) {
  const rawBody = JSON.stringify(body);
  const signed = signStandardWebhook(rawBody, { secret, webhookId, timestamp });
  return request(app)
    .post('/api/billing/webhooks/polar')
    .set('Content-Type', 'application/json')
    .set({ ...signed, ...headers })
    .send(rawBody);
}

function customerFor(user, extra = {}) {
  return buildCustomer({ externalId: String(user._id), email: user.email, ...extra });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.POLAR_WEBHOOK_SECRET_TEST = TEST_SECRET;
  process.env.POLAR_WEBHOOK_SECRET_LIVE = LIVE_SECRET;
  process.env.POLAR_MONTHLY_PRODUCT_ID_TEST = PRODUCT_IDS.monthly;
  process.env.POLAR_QUARTERLY_PRODUCT_ID_TEST = PRODUCT_IDS.quarterly;
  process.env.POLAR_ANNUAL_PRODUCT_ID_TEST = PRODUCT_IDS.annual;
  process.env.POLAR_LIFETIME_PRODUCT_ID_TEST = PRODUCT_IDS.lifetime;
  process.env.PAYMENTS_MODE = 'test';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  BillingEvent = require('../models/BillingEvent');
  CheckoutAttempt = require('../models/CheckoutAttempt');
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await BillingEvent.init();
  await CheckoutAttempt.init();
  await PendingEntitlement.init();
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  process.env.POLAR_WEBHOOK_SECRET_TEST = TEST_SECRET;
  process.env.POLAR_WEBHOOK_SECRET_LIVE = LIVE_SECRET;
  process.env.PAYMENTS_MODE = 'test';
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await CheckoutAttempt.deleteMany({});
  await PendingEntitlement.deleteMany({});
});

describe('Polar webhook integration', () => {
  test('returns 500 when no webhook secret is configured', async () => {
    process.env.POLAR_WEBHOOK_SECRET_TEST = '';
    process.env.POLAR_WEBHOOK_SECRET_LIVE = '';
    const user = await seedUser();
    const response = await post(buildEvent('subscription.updated', buildSubscription({ customer: customerFor(user) })));
    expect(response.status).toBe(500);
    expect(await BillingEvent.countDocuments({})).toBe(0);
  });

  test('rejects a bad signature and missing Standard Webhooks headers', async () => {
    const user = await seedUser();
    const body = buildEvent('subscription.updated', buildSubscription({ customer: customerFor(user) }));
    const wrongSecret = await post(body, { secret: 'whsec_wrong' });
    expect(wrongSecret.status).toBe(401);
    const noHeaders = await request(app)
      .post('/api/billing/webhooks/polar')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));
    expect(noHeaders.status).toBe(401);
    const stale = await post(body, { timestamp: Math.floor(Date.now() / 1000) - 3600 });
    expect(stale.status).toBe(401);
    expect(await BillingEvent.countDocuments({})).toBe(0);
    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');
  });

  test('an active subscription keyed by customer.external_id upgrades the user', async () => {
    const user = await seedUser();
    const subscription = buildSubscription({ customer: customerFor(user), metadata: { fa_user_id: String(user._id) } });
    const response = await post(buildEvent('subscription.updated', subscription), { webhookId: 'msg_active_1' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });

    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('active');
    expect(new Date(fresh.entitlements.pro.validUntil).toISOString()).toBe('2026-12-23T08:07:07.262Z');
    expect(fresh.accessTier).toBe('premium');
    expect(fresh.billing.providers.polar).toEqual(expect.objectContaining({
      customerId: subscription.customer.id,
      subscriptionId: subscription.id,
      purchaserEmail: user.email,
      lastEventId: 'test:msg_active_1',
    }));
    expect(new Date(fresh.billing.providers.polar.startedAt).toISOString()).toBe('2026-11-23T08:07:07.262Z');
    expect(fresh.billing.providers.lemonsqueezy?.subscriptionId).toBeUndefined();

    const event = await BillingEvent.findOne({ provider: 'polar', eventId: 'test:msg_active_1' }).lean();
    expect(event.processingStatus).toBe('processed');
    expect(String(event.userId)).toBe(String(user._id));
  });

  test('a redelivered webhook id is acknowledged once and never reapplied', async () => {
    const user = await seedUser();
    const body = buildEvent('subscription.updated', buildSubscription({ customer: customerFor(user) }));
    const first = await post(body, { webhookId: 'msg_dup' });
    expect(first.status).toBe(200);
    const second = await post(body, { webhookId: 'msg_dup' });
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ ok: true, duplicate: true });
    expect(await BillingEvent.countDocuments({ provider: 'polar' })).toBe(1);
  });

  test('order.paid records the verified payment on the attempt; the subscription event then applies it', async () => {
    const user = await seedUser();
    const attempt = await seedAttempt(user);
    const checkoutId = uuid();
    const metadata = { fa_user_id: String(user._id), fa_checkout_attempt_id: attempt.attemptId, fa_price_reason: 'regional' };
    const order = buildOrder({ customer: customerFor(user), metadata, checkoutId, amounts: { subtotal: 1200, discount: 0, tax: 200 } });

    const orderResponse = await post(buildEvent('order.paid', order), { webhookId: 'msg_order' });
    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body).toEqual({ ok: true, ignored: true });

    let stored = await CheckoutAttempt.findOne({ attemptId: attempt.attemptId }).lean();
    expect(stored.status).toBe('webhook_received');
    expect(stored.paymentEventId).toBe('test:msg_order');
    expect(stored.providerOrderId).toBe(order.id);
    expect(stored.providerSubscriptionId).toBe(order.subscription_id);
    expect(stored.paymentCurrency).toBe('USD');
    expect(stored.paymentSubtotalCents).toBe(1000);
    expect(stored.paymentDiscountCents).toBe(0);
    expect(stored.paymentTaxCents).toBe(200);
    expect(stored.paymentTotalCents).toBe(1200);
    expect(stored.paymentVerifiedAt).toBeTruthy();
    let fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');

    const subscription = buildSubscription({ id: order.subscription_id, customer: customerFor(user), metadata, checkoutId });
    const subResponse = await post(buildEvent('subscription.updated', subscription), { webhookId: 'msg_sub' });
    expect(subResponse.status).toBe(200);
    stored = await CheckoutAttempt.findOne({ attemptId: attempt.attemptId }).lean();
    expect(stored.status).toBe('applied');
    expect(stored.billingEventId).toBe('test:msg_sub');
    expect(stored.paymentEventId).toBe('test:msg_order');
    fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('active');
  });

  test('an event without our metadata still finds the attempt through the provider checkout id', async () => {
    const user = await seedUser();
    const checkoutId = uuid();
    const attempt = await seedAttempt(user, { providerCheckoutId: checkoutId });
    const subscription = buildSubscription({ customer: customerFor(user), checkoutId, metadata: {} });
    const response = await post(buildEvent('subscription.active', subscription), { webhookId: 'msg_by_checkout' });
    expect(response.status).toBe(200);
    const stored = await CheckoutAttempt.findOne({ attemptId: attempt.attemptId }).lean();
    expect(stored.status).toBe('applied');
    expect(stored.billingEventId).toBe('test:msg_by_checkout');
    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('active');
  });

  test('a live-signed event never mutates entitlements while the runtime is in test mode', async () => {
    const user = await seedUser();
    const attempt = await seedAttempt(user);
    const metadata = { fa_user_id: String(user._id), fa_checkout_attempt_id: attempt.attemptId };
    const response = await post(
      buildEvent('subscription.updated', buildSubscription({ customer: customerFor(user), metadata })),
      { secret: LIVE_SECRET, webhookId: 'msg_live' }
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ignored: true, code: 'BILLING_RUNTIME_MODE_MISMATCH' });
    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');
    const stored = await CheckoutAttempt.findOne({ attemptId: attempt.attemptId }).lean();
    expect(stored.status).toBe('failed');
    expect(stored.lastErrorCode).toBe('BILLING_RUNTIME_MODE_MISMATCH');
    const event = await BillingEvent.findOne({ provider: 'polar', eventId: 'live:msg_live' }).lean();
    expect(event.processingStatus).toBe('processed_checkout_mismatch');
  });

  test('a product that is not the plan the attempt sold is rejected as a plan mismatch', async () => {
    const user = await seedUser();
    const attempt = await seedAttempt(user, { planId: 'annual' });
    const metadata = { fa_user_id: String(user._id), fa_checkout_attempt_id: attempt.attemptId };
    const response = await post(
      buildEvent('subscription.updated', buildSubscription({ planId: 'monthly', customer: customerFor(user), metadata })),
      { webhookId: 'msg_plan_mismatch' }
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ignored: true, code: 'CHECKOUT_ATTEMPT_PLAN_MISMATCH' });
    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');
  });

  test('a lifetime order grants lifetime and a later subscription loss does not take it away', async () => {
    const user = await seedUser();
    const attempt = await seedAttempt(user, { planId: 'lifetime' });
    const metadata = { fa_user_id: String(user._id), fa_checkout_attempt_id: attempt.attemptId };
    const order = buildOrder({
      planId: 'lifetime',
      billingReason: 'purchase',
      customer: customerFor(user),
      metadata,
      product: buildProduct('lifetime', { metadata: {} }),
      amounts: { subtotal: 17900, discount: 0, tax: 2983 },
    });
    const response = await post(buildEvent('order.paid', order), { webhookId: 'msg_lifetime' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    let fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro).toEqual(expect.objectContaining({ status: 'lifetime', validUntil: null }));
    const stored = await CheckoutAttempt.findOne({ attemptId: attempt.attemptId }).lean();
    expect(stored.status).toBe('applied');
    expect(stored.paymentTotalCents).toBe(17900);
    expect(stored.paymentSubtotalCents).toBe(14917);

    const revoked = await post(
      buildEvent('subscription.revoked', buildSubscription({ customer: customerFor(user), status: 'canceled', endedAt: '2026-11-24T00:00:00Z' })),
      { webhookId: 'msg_revoked_other' }
    );
    expect(revoked.status).toBe(200);
    fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('lifetime');
  });

  test('a partial refund keeps access and a full refund revokes it', async () => {
    const user = await seedUser();
    const customer = customerFor(user);
    await post(buildEvent('subscription.updated', buildSubscription({ customer })), { webhookId: 'msg_sub_for_refund' });
    const partial = await post(buildEvent('order.refunded', buildOrder({ customer, status: 'partially_refunded' })), { webhookId: 'msg_partial' });
    expect(partial.status).toBe(200);
    expect(partial.body).toEqual({ ok: true, ignored: true });
    let fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('active');

    const full = await post(buildEvent('order.refunded', buildOrder({ customer, status: 'refunded' })), { webhookId: 'msg_full' });
    expect(full.status).toBe(200);
    fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');
    expect(fresh.accessTier).toBe('free');
  });

  test('cancel at period end keeps access until the paid-through date and an uncancel restores active', async () => {
    const user = await seedUser();
    const customer = customerFor(user);
    const id = uuid();
    await post(buildEvent('subscription.updated', buildSubscription({ id, customer })), { webhookId: 'msg_c1' });
    const cancelled = await post(
      buildEvent('subscription.canceled', buildSubscription({ id, customer, cancelAtPeriodEnd: true, canceledAt: '2026-11-23T08:08:27Z', endsAt: '2026-12-23T08:07:07.262829Z' })),
      { webhookId: 'msg_c2' }
    );
    expect(cancelled.status).toBe(200);
    let fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('cancelled');
    expect(new Date(fresh.entitlements.pro.validUntil).toISOString()).toBe('2026-12-23T08:07:07.262Z');
    expect(fresh.accessTier).toBe('premium');

    await post(buildEvent('subscription.uncanceled', buildSubscription({ id, customer })), { webhookId: 'msg_c3' });
    fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('active');
  });

  test('an unknown user id is kept as a user-bound pending entitlement and applied once the account appears', async () => {
    const futureUserId = new mongoose.Types.ObjectId();
    const customer = buildCustomer({ externalId: String(futureUserId), email: 'later@example.com' });
    const response = await post(buildEvent('subscription.updated', buildSubscription({ customer })), { webhookId: 'msg_pending' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, userFound: false });
    const pending = await PendingEntitlement.findOne({ provider: 'polar', eventId: 'test:msg_pending' }).lean();
    expect(pending).toEqual(expect.objectContaining({ userId: String(futureUserId), email: 'later@example.com' }));
    expect(pending.entitlement.status).toBe('active');

    const { applyPendingEntitlementsForUser } = require('../services/billing/pending-entitlements');
    const stranger = await seedUser({ email: 'later@example.com', username: 'stranger' });
    const strangerApply = await applyPendingEntitlementsForUser(PendingEntitlement, stranger);
    expect(strangerApply).toEqual(expect.objectContaining({ applied: false, reason: 'polar_user_mismatch' }));

    const owner = await User.create({
      _id: futureUserId,
      email: 'owner@example.com',
      username: 'owner',
      passwordHash: 'hash',
      accessTier: 'free',
      entitlements: { pro: { status: 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
    });
    const ownerApply = await applyPendingEntitlementsForUser(PendingEntitlement, owner);
    expect(ownerApply.applied).toBe(true);
    const fresh = await User.findById(futureUserId).lean();
    expect(fresh.entitlements.pro.status).toBe('active');
    expect(fresh.billing.providers.polar.subscriptionId).toBeTruthy();
  });

  test('a customer reference that is not one of our ids defers to a pending entitlement instead of crashing', async () => {
    const customer = buildCustomer({ externalId: 'fa_test_user_1', email: 'external@example.com' });
    const response = await post(buildEvent('subscription.updated', buildSubscription({ customer })), { webhookId: 'msg_foreign_id' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, userFound: false });
    const pending = await PendingEntitlement.findOne({ provider: 'polar', eventId: 'test:msg_foreign_id' }).lean();
    expect(pending.email).toBe('external@example.com');
    expect(pending.userId).toBeUndefined();
  });

  test('unknown event types are acknowledged and stored without touching the user', async () => {
    const user = await seedUser();
    const response = await post(buildEvent('benefit_grant.created', { id: uuid(), customer: customerFor(user), metadata: {} }), { webhookId: 'msg_benefit' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ignored: true });
    const event = await BillingEvent.findOne({ provider: 'polar', eventId: 'test:msg_benefit' }).lean();
    expect(event.processingStatus).toBe('processed_no_entitlement');
    const novel = await post(buildEvent('something.new', { id: uuid(), customer: customerFor(user) }), { webhookId: 'msg_novel' });
    expect(novel.status).toBe(200);
    const fresh = await User.findById(user._id).lean();
    expect(fresh.entitlements.pro.status).toBe('none');
  });
});
