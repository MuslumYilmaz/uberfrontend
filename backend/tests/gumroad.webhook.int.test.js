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
  process.env.GUMROAD_WEBHOOK_SECRET = SECRET;

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

describe('Gumroad webhook integration', () => {
  test('routes /webhooks/:provider for gumroad', async () => {
    const payload = {
      resource_name: 'sale',
      email: 'test@example.com',
      sale_id: 'sale_route',
      next_billing_date: '2099-01-01T00:00:00Z',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const user = await User.findOne({ email: 'test@example.com' }).lean();
    expect(user.entitlements.pro.status).toBe('active');
  });

  test('JSON subscription active upgrades user', async () => {
    const payload = {
      resource_name: 'sale',
      email: 'test@example.com',
      sale_id: 'sale_123',
      next_billing_date: '2099-01-01T00:00:00Z',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const user = await User.findOne({ email: 'test@example.com' }).lean();
    expect(user.entitlements.pro.status).toBe('active');
    expect(user.accessTier).toBe('premium');

    const event = await BillingEvent.findOne({ provider: 'gumroad', eventId: 'sale_123' }).lean();
    expect(event.processingStatus).toBe('processed');
    expect(String(event.userId)).toBe(String(user._id));
  });

  test('Form-encoded subscription active upgrades user', async () => {
    const rawBody = 'resource_name=sale&email=test%40example.com&sale_id=sale_124&next_billing_date=2099-01-01T00:00:00Z';
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const user = await User.findOne({ email: 'test@example.com' }).lean();
    expect(user.entitlements.pro.status).toBe('active');
    expect(user.accessTier).toBe('premium');
  });

  test('Invalid signature returns 401', async () => {
    const payload = {
      resource_name: 'sale',
      email: 'test@example.com',
      sale_id: 'sale_bad_sig',
      next_billing_date: '2099-01-01T00:00:00Z',
    };
    const rawBody = JSON.stringify(payload);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', 'bad_signature')
      .send(rawBody);

    expect(res.status).toBe(401);
    expect(res.body?.error).toBe('Invalid signature');
  });

  test('User not found returns ok without crash', async () => {
    const payload = {
      resource_name: 'sale',
      email: 'nouser@example.com',
      sale_id: 'sale_nouser',
      next_billing_date: '2099-01-01T00:00:00Z',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, userFound: false });

    const pendingCount = await PendingEntitlement.countDocuments({ email: 'nouser@example.com' });
    expect(pendingCount).toBe(1);

    const event = await BillingEvent.findOne({ provider: 'gumroad', eventId: 'sale_nouser' }).lean();
    expect(event.processingStatus).toBe('pending_user');
  });

  test('Unknown event type is marked for monitoring', async () => {
    const payload = {
      resource_name: 'mystery_event',
      email: 'test@example.com',
      sale_id: 'sale_unknown',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const event = await BillingEvent.findOne({ provider: 'gumroad', eventId: 'sale_unknown' }).lean();
    expect(event.processingStatus).toBe('processed_unknown_type');
  });

  test('Cancelled without end date does not keep premium', async () => {
    const payload = {
      resource_name: 'subscription_cancelled',
      email: 'test@example.com',
      subscription_id: 'sub_no_end',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);

    const user = await User.findOne({ email: 'test@example.com' }).lean();
    expect(user.entitlements.pro.status).toBe('cancelled');
    expect(user.entitlements.pro.validUntil).toBeTruthy();
    expect(user.accessTier).toBe('free');
  });

  test('Duplicate event is idempotent', async () => {
    const payload = {
      resource_name: 'sale',
      email: 'test@example.com',
      sale_id: 'sale_dup',
      next_billing_date: '2099-01-01T00:00:00Z',
    };
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const first = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/billing/webhooks/gumroad')
      .set('Content-Type', 'application/json')
      .set('x-gumroad-signature', signature)
      .send(rawBody);

    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    const eventCount = await BillingEvent.countDocuments({ provider: 'gumroad', eventId: 'sale_dup' });
    expect(eventCount).toBe(1);
  });
});
