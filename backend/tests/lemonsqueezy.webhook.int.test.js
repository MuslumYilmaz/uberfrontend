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
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL);
  await BillingEvent.init();
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
  await PendingEntitlement.deleteMany({});
  await seedUser();
});

describe('LemonSqueezy webhook integration', () => {
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
    const event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventId: 'test:sub_test' }).lean();
    expect(event).toBeTruthy();
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
    const event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventId: 'live:sub_live' }).lean();
    expect(event).toBeTruthy();
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
    const event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventId: 'test:sub_legacy' }).lean();
    expect(event).toBeTruthy();
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

    const event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventId: 'test:sub_123' }).lean();
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
      meta: { event_name: 'order_created' },
      data: {
        id: 'order_1',
        attributes: {
          user_email: 'nouser@example.com',
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
});
