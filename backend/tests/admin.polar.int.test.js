'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { buildOrder } = require('./helpers/polar-fixtures');

jest.setTimeout(120000);

const JWT_SECRET = 'test_jwt_secret_admin_polar';
const ORIGINAL_FETCH = global.fetch;

let app;
let User;
let BillingEvent;
let CheckoutAttempt;
let connectToMongo;
let disconnectMongo;
let mongoServer;

function authHeader(userId, role = 'admin') {
  return `Bearer ${jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' })}`;
}

function daysFromNowIso(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCMilliseconds(0);
  return date.toISOString();
}

async function seedAdmin() {
  return User.create({ email: 'polar-admin@example.com', username: 'polar_admin', passwordHash: 'hash', role: 'admin' });
}

async function seedSubscriber() {
  return User.create({
    email: 'polar-subscriber@example.com',
    username: 'polar_subscriber',
    passwordHash: 'hash',
    role: 'user',
    accessTier: 'free',
    entitlements: { pro: { status: 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = `${mongoServer.getUri()}admin_polar_test`;
  process.env.EXPECTED_MONGO_DB_NAME_TEST = 'admin_polar_test';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.PAYMENTS_MODE = 'test';
  process.env.POLAR_ACCESS_TOKEN_TEST = 'polar_oat_sandbox';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  BillingEvent = require('../models/BillingEvent');
  CheckoutAttempt = require('../models/CheckoutAttempt');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await BillingEvent.init();
  await CheckoutAttempt.init();
});

afterAll(async () => {
  delete process.env.EXPECTED_MONGO_DB_NAME_TEST;
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
  global.fetch = ORIGINAL_FETCH;
});

beforeEach(async () => {
  process.env.PAYMENTS_MODE = 'test';
  process.env.POLAR_ACCESS_TOKEN_TEST = 'polar_oat_sandbox';
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await CheckoutAttempt.deleteMany({});
});

describe('Admin Polar simulator', () => {
  test('walks an account through activate, cancel, refund and lifetime with the webhook lease path', async () => {
    const admin = await seedAdmin();
    const user = await seedSubscriber();
    await CheckoutAttempt.create({
      attemptId: 'chk_polar_sim',
      userId: user._id,
      provider: 'polar',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
    });
    const validUntil = daysFromNowIso(30);

    const activate = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'activate', validUntil, attemptId: 'chk_polar_sim', externalId: 'sim_polar_1' });
    expect(activate.status).toBe(200);
    expect(activate.body).toEqual(expect.objectContaining({ ok: true, scenario: 'activate', eventId: 'simulate:test:sim_sim_polar_1' }));
    expect(activate.body.normalized.entitlement).toEqual({ status: 'active', validUntil });
    expect(activate.body.user.entitlements.pro.status).toBe('active');
    expect(activate.body.user.accessTier).toBe('premium');
    expect(activate.body.user.billing.providers.polar.subscriptionId).toBe(`sub_sim_${String(user._id)}`);
    const attempt = await CheckoutAttempt.findOne({ attemptId: 'chk_polar_sim' }).lean();
    expect(attempt.status).toBe('applied');
    expect(attempt.billingEventId).toBe('simulate:test:sim_sim_polar_1');
    const event = await BillingEvent.findOne({ provider: 'polar', eventId: 'simulate:test:sim_sim_polar_1' }).lean();
    expect(event.processingStatus).toBe('processed_simulated');

    const cancel = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'cancel', validUntil, externalId: 'sim_polar_2' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.user.entitlements.pro.status).toBe('cancelled');
    expect(cancel.body.user.accessTier).toBe('premium');

    const refund = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'refund', externalId: 'sim_polar_3' });
    expect(refund.status).toBe(200);
    expect(refund.body.user.entitlements.pro.status).toBe('none');
    expect(refund.body.user.accessTier).toBe('free');

    const lifetime = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'lifetime', externalId: 'sim_polar_4' });
    expect(lifetime.status).toBe(200);
    expect(lifetime.body.user.entitlements.pro).toEqual(expect.objectContaining({ status: 'lifetime', validUntil: null }));

    const duplicate = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'lifetime', externalId: 'sim_polar_4' });
    expect(duplicate.status).toBe(200);
    expect(duplicate.body).toEqual(expect.objectContaining({ ok: true, duplicate: true }));
  });

  test('rejects bad input, unknown users and non-admin callers', async () => {
    const admin = await seedAdmin();
    const user = await seedSubscriber();
    const invalid = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'teleport' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.supportedScenarios).toEqual(['activate', 'renew', 'cancel', 'refund', 'lifetime', 'expire', 'revoke']);

    const missingDate = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: String(user._id), scenario: 'activate' });
    expect(missingDate.status).toBe(400);

    const unknownUser = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(admin._id))
      .send({ userId: '507f1f77bcf86cd799439099', scenario: 'expire' });
    expect(unknownUser.status).toBe(404);

    const forbidden = await request(app)
      .post('/api/admin/billing/simulate/polar')
      .set('Authorization', authHeader(user._id, 'user'))
      .send({ userId: String(user._id), scenario: 'expire' });
    expect([401, 403]).toContain(forbidden.status);
  });
});

describe('Admin Polar order reconciliation', () => {
  test('reads sandbox orders for the Polar provider and reports the ones without a backend purchase', async () => {
    const admin = await seedAdmin();
    const user = await seedSubscriber();
    await User.updateOne({ _id: user._id }, { $set: { accessTier: 'premium', 'entitlements.pro': { status: 'active', validUntil: null } } });
    await CheckoutAttempt.create({
      attemptId: 'chk_polar_verified',
      userId: user._id,
      provider: 'polar',
      planId: 'monthly',
      mode: 'test',
      status: 'applied',
      providerOrderId: 'ord-verified',
      paymentEventId: 'test:msg_verified',
      paymentVerifiedAt: new Date(Date.now() - 60 * 60 * 1000),
      paymentCurrency: 'USD',
      paymentSubtotalCents: 1000,
      paymentDiscountCents: 0,
      paymentTaxCents: 200,
      paymentTotalCents: 1200,
    });
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          buildOrder({ id: 'ord-verified', createdAt: recent, amounts: { subtotal: 1200, discount: 0, tax: 200 } }),
          buildOrder({ id: 'ord-orphan', createdAt: recent, amounts: { subtotal: 2400, discount: 0, tax: 400 } }),
        ],
        pagination: { total_count: 2, max_page: 1 },
      }),
    }));

    const res = await request(app)
      .get('/api/admin/billing/reconciliation?mode=test&includeProviderOrders=true&provider=polar')
      .set('Authorization', authHeader(admin._id));
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('https://sandbox-api.polar.sh/v1/orders/');
    expect(res.body.verifiedPurchases.providerOrders).toEqual(expect.objectContaining({
      status: 'checked',
      provider: 'polar',
      summary: { orders: 2, matched: 1, mismatches: 1 },
    }));
    expect(res.body.verifiedPurchases.providerOrders.mismatches[0]).toEqual(expect.objectContaining({ orderId: 'ord-orphan', reasons: ['checkout_attempt_missing'] }));
    expect(res.body.summary).toEqual(expect.objectContaining({ providerOrders: 2, providerOrderMismatches: 1 }));

    process.env.POLAR_ACCESS_TOKEN_TEST = '';
    const unconfigured = await request(app)
      .get('/api/admin/billing/reconciliation?mode=test&includeProviderOrders=true&provider=polar')
      .set('Authorization', authHeader(admin._id));
    expect(unconfigured.status).toBe(409);
    expect(unconfigured.body.code).toBe('POLAR_RECONCILIATION_NOT_CONFIGURED');
  });
});
