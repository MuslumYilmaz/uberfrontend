'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let BillingEvent;
let CheckoutAttempt;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;
let expectedDbName;

const JWT_SECRET = 'test_jwt_secret_admin_route';

function authHeader(userId, role = 'admin') {
  const token = jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function withDbName(uri, dbName) {
  const base = String(uri || '');
  return base.endsWith('/') ? `${base}${dbName}` : `${base}/${dbName}`;
}

function parseDbName(uri) {
  const match = String(uri || '').match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : null;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = withDbName(mongoServer.getUri(), 'admin_route_test');
  expectedDbName = parseDbName(process.env.MONGO_URL_TEST);
  process.env.EXPECTED_MONGO_DB_NAME_TEST = expectedDbName;
  process.env.JWT_SECRET = JWT_SECRET;

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
});

afterAll(async () => {
  delete process.env.EXPECTED_MONGO_DB_NAME_TEST;
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await CheckoutAttempt.deleteMany({});
  await PendingEntitlement.deleteMany({});
});

describe('Admin DB diagnostics', () => {
  test('returns current db info and model-to-collection mapping for admin users', async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      username: 'admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const res = await request(app)
      .get('/api/admin/diagnostics/db')
      .set('Authorization', authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      readyState: 1,
      name: expectedDbName,
      expectedName: expectedDbName,
      matchesExpected: true,
      models: expect.arrayContaining([
        expect.objectContaining({
          model: 'User',
          collection: 'users',
        }),
      ]),
    }));
  });

  test('rejects non-admin users', async () => {
    const user = await User.create({
      email: 'user@example.com',
      username: 'plain_user',
      passwordHash: 'hash',
      role: 'user',
    });

    const res = await request(app)
      .get('/api/admin/diagnostics/db')
      .set('Authorization', authHeader(user._id, 'user'));

    expect(res.status).toBe(403);
    expect(res.body?.error).toBe('Admin only');
  });
});

describe('Admin billing simulator', () => {
  test('simulates activate, renew, cancel, and refund scenarios for LemonSqueezy', async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      username: 'admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'subscriber@example.com',
      username: 'subscriber_user',
      passwordHash: 'hash',
      role: 'user',
      accessTier: 'free',
      entitlements: {
        pro: { status: 'none', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });

    const activate = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'activate',
        validUntil: '2026-05-01T00:00:00.000Z',
        startedAt: '2026-04-01T00:00:00.000Z',
        customerId: 'cust_sim',
        subscriptionId: 'sub_sim',
        manageUrl: 'https://example.com/manage',
      });

    expect(activate.status).toBe(200);
    expect(activate.body.scenario).toBe('activate');
    expect(activate.body.user.accessTier).toBe('premium');
    expect(activate.body.user.entitlements.pro.status).toBe('active');
    expect(new Date(activate.body.user.entitlements.pro.validUntil).toISOString()).toBe('2026-05-01T00:00:00.000Z');
    expect(activate.body.user.billing.providers.lemonsqueezy.customerId).toBe('cust_sim');
    expect(activate.body.user.billing.providers.lemonsqueezy.subscriptionId).toBe('sub_sim');
    expect(activate.body.user.billing.providers.lemonsqueezy.manageUrl).toBe('https://example.com/manage');

    const renew = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'renew',
        validUntil: '2026-06-01T00:00:00.000Z',
      });

    expect(renew.status).toBe(200);
    expect(renew.body.user.entitlements.pro.status).toBe('active');
    expect(new Date(renew.body.user.entitlements.pro.validUntil).toISOString()).toBe('2026-06-01T00:00:00.000Z');

    const cancel = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'cancel',
      });

    expect(cancel.status).toBe(200);
    expect(cancel.body.user.entitlements.pro.status).toBe('cancelled');
    expect(new Date(cancel.body.user.entitlements.pro.validUntil).toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(cancel.body.user.accessTier).toBe('premium');

    const refund = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'refund',
      });

    expect(refund.status).toBe(200);
    expect(refund.body.user.entitlements.pro.status).toBe('none');
    expect(refund.body.user.entitlements.pro.validUntil).toBeNull();
    expect(refund.body.user.accessTier).toBe('free');

    const simulatedEvent = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventId: refund.body.eventId,
    }).lean();

    expect(simulatedEvent).toEqual(expect.objectContaining({
      provider: 'lemonsqueezy',
      processingStatus: 'processed_simulated',
    }));
    expect(String(simulatedEvent.userId)).toBe(String(user._id));
  });

  test('rejects invalid simulator input with supported scenarios', async () => {
    const admin = await User.create({
      email: 'admin2@example.com',
      username: 'admin_user_2',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'subscriber2@example.com',
      username: 'subscriber_user_2',
      passwordHash: 'hash',
      role: 'user',
    });

    const res = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'activate',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('validUntil');
    expect(res.body.supportedScenarios).toEqual(
      expect.arrayContaining(['activate', 'renew', 'cancel', 'refund', 'lifetime', 'expire'])
    );
  });
});

describe('Admin billing reconciliation', () => {
  test('returns unresolved checkout attempts, pending entitlements, and unresolved billing events', async () => {
    const admin = await User.create({
      email: 'billing-admin@example.com',
      username: 'billing_admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'billing-subscriber@example.com',
      username: 'billing_subscriber_user',
      passwordHash: 'hash',
      role: 'user',
    });

    await CheckoutAttempt.create({
      attemptId: 'chk_reconcile_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'pending_user_match',
      billingEventId: 'test:event_reconcile_123',
      customerEmail: user.email,
      lastErrorCode: 'PENDING_USER_MATCH',
      lastErrorMessage: 'Payment received, but we could not safely match it to this account yet.',
    });

    await PendingEntitlement.create({
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'test:event_reconcile_123',
      eventType: 'subscription_created',
      email: user.email,
      userId: String(user._id),
      entitlement: { status: 'active', validUntil: null },
      payload: {
        data: {
          attributes: {
            custom_data: {
              fa_checkout_attempt_id: 'chk_reconcile_123',
            },
          },
        },
      },
    });

    await BillingEvent.create({
      provider: 'lemonsqueezy',
      eventId: 'test:event_unresolved_456',
      eventType: 'subscription_created',
      email: 'unknown@example.com',
      processingStatus: 'pending_user',
      payload: {},
    });

    const res = await request(app)
      .get('/api/admin/billing/reconciliation')
      .set('Authorization', authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({
      pendingAttempts: 1,
      pendingEntitlements: 1,
      unresolvedEvents: 1,
    });
    expect(res.body.checkoutAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attemptId: 'chk_reconcile_123',
          supportReference: 'chk_reconcile_123',
          status: 'pending_user_match',
          billingEventId: 'test:event_reconcile_123',
          lastErrorCode: 'PENDING_USER_MATCH',
        }),
      ])
    );
    expect(res.body.pendingEntitlements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'test:event_reconcile_123',
          attemptId: 'chk_reconcile_123',
          supportReference: 'chk_reconcile_123',
          bindingStatus: 'exact_user_required',
        }),
      ])
    );
    expect(res.body.billingEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'test:event_unresolved_456',
          supportReference: 'test:event_unresolved_456',
          processingStatus: 'pending_user',
        }),
      ])
    );
  });
});
