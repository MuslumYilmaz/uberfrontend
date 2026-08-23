const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let CheckoutAttempt;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_for_checkout_status';

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

async function seedUser(overrides = {}) {
  return User.create({
    email: 'checkout-status@example.com',
    username: 'checkout_status_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
    ...overrides,
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.FRONTEND_BASE = 'http://localhost:4200';
  process.env.BILLING_PROVIDER = 'lemonsqueezy';
  process.env.PAYMENTS_MODE = 'test';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  CheckoutAttempt = require('../models/CheckoutAttempt');
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await CheckoutAttempt.init();
});

afterAll(async () => {
  if (disconnectMongo) {
    await disconnectMongo();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await CheckoutAttempt.deleteMany({});
  await PendingEntitlement.deleteMany({});
});

describe('billing checkout attempt status route', () => {
  test('returns awaiting_webhook while a checkout is still pending', async () => {
    const user = await seedUser();
    await CheckoutAttempt.create({
      attemptId: 'chk_pending_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_pending_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_pending_123',
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_pending_123/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.supportReference).toBe('chk_pending_123');
    expect(res.body.state).toBe('awaiting_webhook');
    expect(res.body.rawStatus).toBe('created');
    expect(res.body.entitlementActive).toBe(false);
  });

  test('returns applied once the entitlement is active for the same user', async () => {
    const user = await seedUser({
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_applied_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'annual',
      mode: 'test',
      status: 'applied',
      billingEventId: 'test:event_applied_123',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-annual',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_applied_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_applied_123',
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_applied_123/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('applied');
    expect(res.body.entitlementActive).toBe(true);
    expect(res.body.accessTierEffective).toBe('premium');
    expect(res.body.billingEventId).toBe('test:event_applied_123');
    expect(res.body.purchase).toBeNull();
  });

  test('returns a PII-free GA4 purchase only for a verified live order', async () => {
    const user = await seedUser({
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });
    const verifiedAt = new Date('2026-08-05T10:00:00.000Z');
    await CheckoutAttempt.create({
      attemptId: 'chk_live_purchase',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'annual',
      mode: 'live',
      analyticsSurface: 'annual_card',
      analyticsSource: 'pricing_page',
      analyticsSessionId: '1724400000.123456789',
      experimentId: 'pricing-proof:variant_a',
      offerVersion: 'interview_sprint_v2',
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      checkoutSurface: 'overlay',
      status: 'applied',
      billingEventId: 'live:subscription_created:sub_annual',
      paymentEventId: 'live:order_created:order_annual',
      providerOrderId: 'order_annual_123',
      paymentCurrency: 'USD',
      paymentSubtotalCents: 7900,
      paymentDiscountCents: 1000,
      paymentTaxCents: 1242,
      paymentTotalCents: 8142,
      paymentVerifiedAt: verifiedAt,
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-annual',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_live_purchase',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_live_purchase',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_live_purchase/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.analyticsSurface).toBe('annual_card');
    expect(res.body.analyticsSource).toBe('pricing_page');
    expect(res.body.analyticsSessionId).toBe('1724400000.123456789');
    expect(res.body.experimentId).toBe('pricing-proof:variant_a');
    expect(res.body.offerVersion).toBe('interview_sprint_v2');
    expect(res.body.campaignId).toBe('partner_august');
    expect(res.body.providerDiscountId).toBe('discount_123');
    expect(res.body.checkoutSurface).toBe('overlay');
    expect(res.body.purchase).toEqual({
      transactionId: 'order_annual_123',
      currency: 'USD',
      value: 69,
      discount: 10,
      tax: 12.42,
      total: 81.42,
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      items: [{
        item_id: 'frontendatlas_annual',
        item_name: 'Annual Premium',
        affiliation: 'FrontendAtlas',
        price: 69,
        quantity: 1,
      }],
      source: 'pricing_page',
      verifiedAt: verifiedAt.toISOString(),
    });
    expect(Object.keys(res.body.purchase).sort()).toEqual([
      'campaignId', 'currency', 'discount', 'items', 'providerDiscountId', 'source', 'tax',
      'total', 'transactionId', 'value', 'verifiedAt',
    ]);
    expect(JSON.stringify(res.body.purchase)).not.toContain(user.email);
    expect(JSON.stringify(res.body.purchase)).not.toContain(user.username);
  });

  test('does not expose purchase when stored amounts do not reconcile', async () => {
    const user = await seedUser({
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_bad_amounts',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'live',
      status: 'applied',
      paymentEventId: 'live:order_bad',
      providerOrderId: 'order_bad',
      paymentCurrency: 'USD',
      paymentSubtotalCents: 1200,
      paymentDiscountCents: 0,
      paymentTaxCents: 240,
      paymentTotalCents: 9999,
      paymentVerifiedAt: new Date(),
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_bad_amounts',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_bad_amounts',
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_bad_amounts/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.purchase).toBeNull();
  });

  test('returns pending_user_match when the webhook could not be safely linked to this account', async () => {
    const user = await seedUser();
    await CheckoutAttempt.create({
      attemptId: 'chk_match_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'pending_user_match',
      billingEventId: 'test:event_match_123',
      lastErrorCode: 'PENDING_USER_MATCH',
      lastErrorMessage: 'Payment received, but we could not safely match it to this account yet.',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_match_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_match_123',
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_match_123/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.supportReference).toBe('chk_match_123');
    expect(res.body.state).toBe('pending_user_match');
    expect(res.body.entitlementActive).toBe(false);
    expect(res.body.lastErrorCode).toBe('PENDING_USER_MATCH');
  });

  test('applies a matching pending entitlement when status is polled after webhook arrival', async () => {
    const user = await seedUser();
    await CheckoutAttempt.create({
      attemptId: 'chk_apply_pending',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'webhook_received',
      billingEventId: 'test:event_pending_apply',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_apply_pending',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_apply_pending',
    });
    await PendingEntitlement.create({
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'test:event_pending_apply',
      eventType: 'subscription_created',
      email: user.email.toLowerCase(),
      userId: String(user._id),
      entitlement: { status: 'active', validUntil: null },
      payload: {
        data: {
          attributes: {
            custom_data: {
              fa_user_id: String(user._id),
            },
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_apply_pending/status')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('applied');
    expect(res.body.entitlementActive).toBe(true);

    const updatedAttempt = await CheckoutAttempt.findOne({ attemptId: 'chk_apply_pending' }).lean();
    expect(updatedAttempt.status).toBe('applied');
    expect(updatedAttempt.customerUserId).toBe(String(user._id));

    const updatedUser = await User.findById(user._id).lean();
    expect(updatedUser.accessTier).toBe('premium');
    expect(updatedUser.entitlements.pro.status).toBe('active');
  });

  test('returns 404 when the attempt does not belong to the current user', async () => {
    const owner = await seedUser();
    const otherUser = await seedUser({
      email: 'other@example.com',
      username: 'other_user',
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_private_123',
      userId: owner._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_private_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_private_123',
    });

    const res = await request(app)
      .get('/api/billing/checkout/attempts/chk_private_123/status')
      .set('Authorization', authHeader(otherUser._id));

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CHECKOUT_ATTEMPT_NOT_FOUND');
  });

  test('records idempotent client observations without regressing an applied attempt', async () => {
    const user = await seedUser({
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_client_state_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      analyticsSurface: 'pricing_card',
      analyticsSource: 'campaign_status',
      status: 'created',
    });

    const firstOpened = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'provider_opened' });
    const repeatedOpened = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'provider_opened' });
    const cancelled = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'cancel_redirected' });
    const redirected = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'success_redirected' });
    const cancelAfterSuccess = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'cancel_redirected' });

    expect(firstOpened.status).toBe(200);
    expect(firstOpened.body.analyticsSurface).toBe('pricing_card');
    expect(firstOpened.body.analyticsSource).toBe('campaign_status');
    expect(firstOpened.body.providerOpenedAt).toBeTruthy();
    expect(repeatedOpened.body.providerOpenedAt).toBe(firstOpened.body.providerOpenedAt);
    expect(cancelled.body.rawStatus).toBe('cancel_redirected');
    expect(redirected.body.rawStatus).toBe('success_redirected');
    expect(redirected.body.state).toBe('awaiting_webhook');
    expect(redirected.body.successRedirectedAt).toBeTruthy();
    expect(cancelAfterSuccess.body.rawStatus).toBe('success_redirected');
    expect(cancelAfterSuccess.body.cancelRedirectedAt).toBe(cancelled.body.cancelRedirectedAt);

    await CheckoutAttempt.updateOne(
      { attemptId: 'chk_client_state_123' },
      { $set: { status: 'webhook_received' } }
    );
    const afterWebhook = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'cancel_redirected' });
    expect(afterWebhook.body.rawStatus).toBe('webhook_received');
    expect(afterWebhook.body.cancelRedirectedAt).toBeTruthy();

    await CheckoutAttempt.updateOne(
      { attemptId: 'chk_client_state_123' },
      { $set: { status: 'applied', completedAt: new Date() } }
    );
    const lateCancel = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_123/client-state')
      .set('Authorization', authHeader(user._id))
      .send({ state: 'cancel_redirected' });

    expect(lateCancel.status).toBe(200);
    expect(lateCancel.body.rawStatus).toBe('applied');
    expect(lateCancel.body.cancelRedirectedAt).toBeTruthy();
    const persisted = await CheckoutAttempt.findOne({ attemptId: 'chk_client_state_123' }).lean();
    expect(persisted.status).toBe('applied');
  });

  test('rejects invalid or cross-account checkout client state', async () => {
    const owner = await seedUser();
    const otherUser = await seedUser({ email: 'client-state-other@example.com', username: 'client_state_other' });
    await CheckoutAttempt.create({
      attemptId: 'chk_client_state_private',
      userId: owner._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
    });

    const invalid = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_private/client-state')
      .set('Authorization', authHeader(owner._id))
      .send({ state: 'payment_succeeded' });
    const crossAccount = await request(app)
      .post('/api/billing/checkout/attempts/chk_client_state_private/client-state')
      .set('Authorization', authHeader(otherUser._id))
      .send({ state: 'popup_blocked' });

    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('CHECKOUT_CLIENT_STATE_INVALID');
    expect(crossAccount.status).toBe(404);
    expect(crossAccount.body.code).toBe('CHECKOUT_ATTEMPT_NOT_FOUND');
  });
});
