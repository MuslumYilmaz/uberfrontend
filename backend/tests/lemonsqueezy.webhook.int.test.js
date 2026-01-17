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
  process.env.MONGO_URL = mongoServer.getUri();
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;

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
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await PendingEntitlement.deleteMany({});
  await seedUser();
});

describe('LemonSqueezy webhook integration', () => {
  test('JSON subscription created upgrades user', async () => {
    const payload = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_123',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
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

    const user = await User.findOne({ email: 'test@example.com' }).lean();
    expect(user.entitlements.pro.status).toBe('active');
    expect(user.accessTier).toBe('premium');

    const event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventId: 'sub_123' }).lean();
    expect(event.processingStatus).toBe('processed');
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
