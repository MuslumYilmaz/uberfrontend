/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const crypto = require('crypto');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const SECRET = 'test_secret';

jest.setTimeout(120000);

let app;
let User;
let BillingEvent;
let CheckoutAttempt;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;

function signPayload(rawBody) {
  return crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
}

async function seedUser() {
  return User.create({
    email: 'test@example.com',
    username: 'test_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = SECRET;

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
  if (disconnectMongo) {
    await disconnectMongo();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = '';
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await CheckoutAttempt.deleteMany({});
  await PendingEntitlement.deleteMany({});
  await seedUser();
});

describe('LemonSqueezy webhook integration', () => {
  test('keeps a userId-bound pending entitlement when purchaser email is absent', async () => {
    const futureUserId = new (require('mongoose').Types.ObjectId)();
    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_user_id_only_pending',
        attributes: {
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: { fa_user_id: String(futureUserId) },
        },
      },
    };
    const rawBody = JSON.stringify(payload);

    const response = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signPayload(rawBody))
      .send(rawBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, userFound: false });
    const pending = await PendingEntitlement.findOne({
      provider: 'lemonsqueezy',
      userId: String(futureUserId),
    }).lean();
    expect(pending).toEqual(expect.objectContaining({
      email: '',
      userId: String(futureUserId),
    }));
  });

  test('returns 500 when webhook secret is missing', async () => {
    const payload = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_missing_secret',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const prevLegacy = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const prevTest = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST;
    const prevLive = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE;
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = '';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = '';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = '';

    try {
      const res = await request(app)
        .post('/api/billing/webhooks/lemonsqueezy')
        .set('Content-Type', 'application/json')
        .set('x-signature', signature)
        .send(rawBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Webhook secret missing');
    } finally {
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = prevLegacy;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = prevTest;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = prevLive;
    }
  });

  test('test-mode payload uses TEST secret', async () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = 'test_secret';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = 'live_secret';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = '';

    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_test',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
        relationships: {
          customer: { data: { id: 'cust_test' } },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', 'test_secret').update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    const event = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
      email: 'test@example.com',
    }).lean();
    expect(event).toBeTruthy();
    expect(event.eventId).toMatch(/^test:subscription_created:sub_test:[a-f0-9]{64}$/);
  });

  test('lifetime subscription maps to lifetime entitlement', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    const payload = {
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
        custom_data: { fa_user_id: user._id.toString() },
      },
      data: {
        id: 'sub_lifetime',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          product_name: 'FrontendAtlas Premium - Lifetime',
          variant_name: 'Lifetime',
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('lifetime');
    expect(updated.entitlements.pro.validUntil).toBeNull();
    expect(updated.accessTier).toBe('premium');
  });

  test('live-mode payload uses LIVE secret', async () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = 'test_secret';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = 'live_secret';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = '';

    const payload = {
      meta: { event_name: 'subscription_created', test_mode: false },
      data: {
        id: 'sub_live',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
        relationships: {
          customer: { data: { id: 'cust_live' } },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', 'live_secret').update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    const event = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
      email: 'test@example.com',
    }).lean();
    expect(event).toBeTruthy();
    expect(event.eventId).toMatch(/^live:subscription_created:sub_live:[a-f0-9]{64}$/);
  });

  test('legacy single secret still verifies', async () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'legacy_secret';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = '';
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = '';

    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_legacy',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', 'legacy_secret').update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    const event = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
      email: 'test@example.com',
    }).lean();
    expect(event).toBeTruthy();
    expect(event.eventId).toMatch(/^test:subscription_created:sub_legacy:[a-f0-9]{64}$/);
  });

  test('JSON subscription created upgrades user', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    const payload = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_123',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_user_email: 'test@example.com',
          },
        },
        relationships: {
          customer: { data: { id: 'cust_1' } },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const updated = await User.findOne({ email: 'test@example.com' }).lean();
    expect(updated.entitlements.pro.status).toBe('active');
    expect(updated.accessTier).toBe('premium');

    const event = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
      email: 'test@example.com',
    }).lean();
    expect(event.eventId).toMatch(/^test:subscription_created:sub_123:[a-f0-9]{64}$/);
    expect(event.processingStatus).toBe('processed');
  });

  test('custom user id links entitlement even when purchase email differs', async () => {
    const otherUser = await User.create({
      email: 'other@example.com',
      username: 'other_user',
      passwordHash: 'hash',
      accessTier: 'free',
      entitlements: {
        pro: { status: 'none', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });

    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_custom_user',
        attributes: {
          user_email: 'purchase@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(otherUser._id),
            fa_user_email: 'other@example.com',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const updated = await User.findById(otherUser._id).lean();
    expect(updated.entitlements.pro.status).toBe('active');
    expect(updated.accessTier).toBe('premium');
    expect(updated.billing.providers.lemonsqueezy.purchaserEmail).toBe('purchase@example.com');
  });

  test('cancelled without end date preserves previous validUntil', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    await User.updateOne(
      { email: 'test@example.com' },
      {
        $set: {
          entitlements: {
            pro: { status: 'active', validUntil: future },
            projects: { status: 'none', validUntil: null },
          },
          accessTier: 'premium',
        },
      }
    );

    const payload = {
      meta: { event_name: 'subscription_cancelled' },
      data: {
        id: 'sub_cancel_no_date',
        attributes: {
          user_email: 'test@example.com',
          status: 'cancelled',
          custom_data: {
            fa_user_id: String(user._id),
            fa_user_email: 'test@example.com',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const updated = await User.findOne({ email: 'test@example.com' }).lean();
    expect(updated.entitlements.pro.status).toBe('cancelled');
    expect(new Date(updated.entitlements.pro.validUntil).toISOString()).toBe(future.toISOString());
    expect(updated.accessTier).toBe('premium');
  });

  test('User not found returns ok without crash', async () => {
    const payload = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_missing_user',
        attributes: {
          user_email: 'nouser@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, userFound: false });

    const pendingCount = await PendingEntitlement.countDocuments({ email: 'nouser@example.com' });
    expect(pendingCount).toBe(1);
  });

  test('non-lifetime order created is recorded but does not grant access or create pending entitlement', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    const payload = {
      meta: { event_name: 'order_created', test_mode: true },
      data: {
        id: 'order_monthly_ignore',
        attributes: {
          user_email: 'test@example.com',
          status: 'paid',
          product_name: 'FrontendAtlas Premium',
          variant_name: 'Monthly',
          custom_data: {
            fa_user_id: String(user._id),
            fa_user_email: 'test@example.com',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, ignored: true });

    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('none');
    expect(updated.entitlements.pro.validUntil).toBeNull();
    expect(updated.accessTier).toBe('free');

    const pendingCount = await PendingEntitlement.countDocuments({ email: 'test@example.com' });
    expect(pendingCount).toBe(0);

    const event = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'order_created',
      email: 'test@example.com',
    }).lean();
    expect(event).toBeTruthy();
    expect(event.processingStatus).toBe('processed_no_entitlement');
  });

  test('non-lifetime order created does not change an existing premium entitlement', async () => {
    const validUntil = new Date('2099-02-01T00:00:00.000Z');
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          accessTier: 'premium',
          entitlements: {
            pro: { status: 'active', validUntil },
            projects: { status: 'none', validUntil: null },
          },
        },
      }
    );
    const payload = {
      meta: { event_name: 'order_created', test_mode: true },
      data: {
        id: 'order_existing_premium_ignore',
        attributes: {
          user_email: 'test@example.com',
          status: 'paid',
          product_name: 'FrontendAtlas Premium',
          variant_name: 'Annual',
          custom_data: {
            fa_user_id: String(user._id),
            fa_user_email: 'test@example.com',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, ignored: true });

    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('active');
    expect(new Date(updated.entitlements.pro.validUntil).toISOString()).toBe(validUntil.toISOString());
    expect(updated.accessTier).toBe('premium');
  });

  test('monthly checkout ignores order created and applies the later subscription created event', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    await CheckoutAttempt.create({
      attemptId: 'chk_order_then_sub',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_order_then_sub',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_order_then_sub',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });

    const orderPayload = {
      meta: { event_name: 'order_created', test_mode: true },
      data: {
        id: 'order_then_sub_monthly',
        attributes: {
          user_email: 'test@example.com',
          status: 'paid',
          order_id: 'order_then_sub_monthly',
          product_name: 'FrontendAtlas Premium',
          variant_name: 'Monthly',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_order_then_sub',
          },
        },
      },
    };
    const orderRawBody = JSON.stringify(orderPayload);
    const orderRes = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signPayload(orderRawBody))
      .send(orderRawBody);

    expect(orderRes.status).toBe(200);
    expect(orderRes.body).toEqual({ ok: true, ignored: true });

    const afterOrderAttempt = await CheckoutAttempt.findOne({ attemptId: 'chk_order_then_sub' }).lean();
    expect(afterOrderAttempt.status).toBe('webhook_received');
    expect(afterOrderAttempt.completedAt).toBeFalsy();
    expect(afterOrderAttempt.providerOrderId).toBe('order_then_sub_monthly');

    const afterOrderUser = await User.findById(user._id).lean();
    expect(afterOrderUser.entitlements.pro.status).toBe('none');
    expect(afterOrderUser.accessTier).toBe('free');

    const subscriptionPayload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_order_then_sub_monthly',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_order_then_sub',
          },
        },
        relationships: {
          subscription: { data: { id: 'sub_order_then_sub_monthly' } },
        },
      },
    };
    const subscriptionRawBody = JSON.stringify(subscriptionPayload);
    const subscriptionRes = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signPayload(subscriptionRawBody))
      .send(subscriptionRawBody);

    expect(subscriptionRes.status).toBe(200);

    const afterSubscriptionAttempt = await CheckoutAttempt.findOne({ attemptId: 'chk_order_then_sub' }).lean();
    expect(afterSubscriptionAttempt.status).toBe('applied');
    expect(afterSubscriptionAttempt.providerSubscriptionId).toBe('sub_order_then_sub_monthly');
    expect(afterSubscriptionAttempt.completedAt).toBeTruthy();

    const afterSubscriptionUser = await User.findById(user._id).lean();
    expect(afterSubscriptionUser.entitlements.pro.status).toBe('active');
    expect(new Date(afterSubscriptionUser.entitlements.pro.validUntil).toISOString())
      .toBe('2099-01-01T00:00:00.000Z');
    expect(afterSubscriptionUser.accessTier).toBe('premium');
  });

  test('lifetime order created grants lifetime premium', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    const payload = {
      meta: { event_name: 'order_created', test_mode: true },
      data: {
        id: 'order_lifetime_purchase',
        attributes: {
          user_email: 'test@example.com',
          status: 'paid',
          product_name: 'FrontendAtlas Premium - Lifetime',
          variant_name: 'Lifetime',
          custom_data: {
            fa_user_id: String(user._id),
            fa_user_email: 'test@example.com',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('lifetime');
    expect(updated.entitlements.pro.validUntil).toBeNull();
    expect(updated.accessTier).toBe('premium');
  });

  test('correlates webhook payloads to an existing checkout attempt', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).lean();
    await CheckoutAttempt.create({
      attemptId: 'chk_test_attempt',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_test_attempt',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_test_attempt',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });

    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_attempt_123',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_test_attempt',
          },
        },
        relationships: {
          subscription: { data: { id: 'sub_attempt_123' } },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const updatedAttempt = await CheckoutAttempt.findOne({ attemptId: 'chk_test_attempt' }).lean();
    expect(updatedAttempt).toBeTruthy();
    expect(updatedAttempt.status).toBe('applied');
    expect(updatedAttempt.billingEventId).toMatch(/^test:subscription_created:sub_attempt_123:[a-f0-9]{64}$/);
    expect(updatedAttempt.providerSubscriptionId).toBe('sub_attempt_123');
    expect(updatedAttempt.completedAt).toBeTruthy();
    expect(updatedAttempt.lastErrorCode).toBeFalsy();
  });

  test('retry completes checkout bookkeeping without reapplying after user save succeeded', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    await CheckoutAttempt.create({
      attemptId: 'chk_retry_after_save',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_retry_after_save',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_retry_after_save',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });
    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_retry_after_save',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_retry_after_save',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);
    const originalUpdateOne = CheckoutAttempt.updateOne.bind(CheckoutAttempt);
    let updateCalls = 0;
    const updateSpy = jest.spyOn(CheckoutAttempt, 'updateOne').mockImplementation((...args) => {
      updateCalls += 1;
      if (updateCalls === 2) {
        return Promise.reject(new Error('synthetic checkout update failure'));
      }
      return originalUpdateOne(...args);
    });

    const first = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);
    updateSpy.mockRestore();

    expect(first.status).toBe(500);
    const afterFirst = await User.findById(user._id).lean();
    expect(afterFirst.entitlements.pro.status).toBe('active');
    const firstEvent = await BillingEvent.findOne({ eventType: 'subscription_created' }).lean();
    expect(firstEvent.processingStatus).toBe('failed_retryable');

    const retry = await request(app)
      .post('/api/billing/webhooks/lemonsqueezy')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .send(rawBody);

    expect(retry.status).toBe(200);
    const attempt = await CheckoutAttempt.findOne({ attemptId: 'chk_retry_after_save' }).lean();
    expect(attempt.status).toBe('applied');
    const completedEvent = await BillingEvent.findById(firstEvent._id).lean();
    expect(completedEvent.processingStatus).toBe('processed');
    expect(completedEvent.attemptCount).toBe(2);
  });

  test('a worker that lost its lease cannot regress an already applied checkout attempt', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    await CheckoutAttempt.create({
      attemptId: 'chk_lost_lease',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_lost_lease',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_lost_lease',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });
    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_lost_lease',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_lost_lease',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);
    const originalUpdateOne = CheckoutAttempt.updateOne.bind(CheckoutAttempt);
    let calls = 0;
    const updateSpy = jest.spyOn(CheckoutAttempt, 'updateOne').mockImplementation(async (...args) => {
      calls += 1;
      if (calls !== 2) return originalUpdateOne(...args);

      const eventId = args[1]?.$set?.billingEventId;
      await BillingEvent.updateOne(
        { provider: 'lemonsqueezy', eventId },
        {
          $set: { processingStatus: 'processed', processedAt: new Date(), userId: user._id },
          $unset: { leaseToken: '', leaseExpiresAt: '' },
        }
      );
      await originalUpdateOne(
        { attemptId: 'chk_lost_lease' },
        {
          $set: {
            status: 'applied',
            billingEventId: eventId,
            completedAt: new Date(),
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        }
      );
      throw new Error('synthetic stale worker resumed after lease loss');
    });

    let response;
    try {
      response = await request(app)
        .post('/api/billing/webhooks/lemonsqueezy')
        .set('Content-Type', 'application/json')
        .set('x-signature', signature)
        .send(rawBody);
    } finally {
      updateSpy.mockRestore();
    }

    expect(response.status).toBe(500);
    const attempt = await CheckoutAttempt.findOne({ attemptId: 'chk_lost_lease' }).lean();
    expect(attempt.status).toBe('applied');
    expect(attempt.lastErrorCode).toBeFalsy();
    const event = await BillingEvent.findOne({ eventType: 'subscription_created' }).lean();
    expect(event.processingStatus).toBe('processed');
  });

  test('webhook_received and failure transitions cannot regress a terminal attempt', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    await CheckoutAttempt.create({
      attemptId: 'chk_terminal_guard',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'applied',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_terminal_guard',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_terminal_guard',
      customerEmail: user.email,
      customerUserId: String(user._id),
      billingEventId: 'newer-event-already-applied',
      completedAt: new Date(),
    });
    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_terminal_guard',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
          custom_data: {
            fa_user_id: String(user._id),
            fa_checkout_attempt_id: 'chk_terminal_guard',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const userWriteFailure = jest
      .spyOn(User, 'updateOne')
      .mockRejectedValueOnce(new Error('synthetic failure after attempted early transition'));

    let response;
    try {
      response = await request(app)
        .post('/api/billing/webhooks/lemonsqueezy')
        .set('Content-Type', 'application/json')
        .set('x-signature', signPayload(rawBody))
        .send(rawBody);
    } finally {
      userWriteFailure.mockRestore();
    }

    expect(response.status).toBe(500);
    const attempt = await CheckoutAttempt.findOne({ attemptId: 'chk_terminal_guard' }).lean();
    expect(attempt.status).toBe('applied');
    expect(attempt.billingEventId).toBe('newer-event-already-applied');
    expect(attempt.lastErrorCode).toBeFalsy();
  });
});
