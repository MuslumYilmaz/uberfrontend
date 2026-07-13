/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const JWT_SECRET = 'test_jwt_secret';
const WEBHOOK_SECRET = 'test_pending_cas_webhook_secret';

let app;
let User;
let PendingEntitlement;
let BillingEvent;
let connectToMongo;
let disconnectMongo;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = WEBHOOK_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  PendingEntitlement = require('../models/PendingEntitlement');
  BillingEvent = require('../models/BillingEvent');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await PendingEntitlement.init();
  await BillingEvent.init();
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
  await PendingEntitlement.deleteMany({});
  await BillingEvent.deleteMany({});
});

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role || 'user' },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

test('applies pending entitlement on /auth/me', async () => {
  const user = await User.create({
    email: 'apply@example.com',
    emailVerifiedAt: new Date(),
    username: 'apply_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create({
    provider: 'gumroad',
    scope: 'pro',
    eventId: 'evt_apply',
    eventType: 'sale',
    email: 'apply@example.com',
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    saleId: 'sale_apply',
  });

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('active');
  expect(res.body.accessTierEffective).toBe('premium');

  const updated = await User.findById(user._id).lean();
  expect(updated.entitlements.pro.status).toBe('active');
  expect(updated.accessTier).toBe('premium');

  const pending = await PendingEntitlement.findOne({ eventId: 'evt_apply' }).lean();
  expect(pending.appliedAt).toBeTruthy();
  expect(String(pending.appliedUserId)).toBe(String(user._id));
});

test('does not let an unverified account claim a matching Gumroad grant', async () => {
  const user = await User.create({
    email: 'unverified@example.com',
    username: 'unverified_user',
    passwordHash: 'hash',
  });
  await PendingEntitlement.create({
    provider: 'gumroad',
    eventId: 'evt_unverified',
    eventType: 'sale',
    email: user.email,
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
  });

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${signToken(user)}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('none');
  const pending = await PendingEntitlement.findOne({ eventId: 'evt_unverified' }).lean();
  expect(pending.appliedAt).toBeFalsy();
});

test('finds a LemonSqueezy pending entitlement by immutable userId when purchase email differs', async () => {
  const user = await User.create({
    email: 'account@example.com',
    username: 'userid_bound_user',
    passwordHash: 'hash',
  });
  await PendingEntitlement.create({
    provider: 'lemonsqueezy',
    eventId: 'evt_userid_email_independent',
    eventType: 'subscription_created',
    email: 'purchase@example.com',
    userId: String(user._id),
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
  });

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${signToken(user)}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('active');
  const pending = await PendingEntitlement.findOne({ eventId: 'evt_userid_email_independent' }).lean();
  expect(String(pending.appliedUserId)).toBe(String(user._id));
});

test('applies reserved Stripe pending records through the same ordered CAS path', async () => {
  const user = await User.create({
    email: 'stripe-pending@example.com',
    username: 'stripe_pending_user',
    passwordHash: 'hash',
  });
  await PendingEntitlement.create({
    provider: 'stripe',
    eventId: 'evt_stripe_pending',
    eventType: 'subscription_created',
    email: user.email,
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    subscriptionId: 'sub_stripe_pending',
    eventOrderKey: '2026-01-01T00:00:00.000Z:000000000000000000000002',
  });

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${signToken(user)}`);

  expect(response.status).toBe(200);
  expect(response.body.entitlements.pro.status).toBe('active');
  const updated = await User.findById(user._id).lean();
  expect(updated.billing.providers.stripe.lastEventId).toBe('evt_stripe_pending');
  expect(updated.billing.providers.stripe.lastEventOrderKey)
    .toBe('2026-01-01T00:00:00.000Z:000000000000000000000002');
});

test('pending entitlement CAS cannot overwrite a concurrently newer direct refund', async () => {
  const user = await User.create({
    email: 'pending-cas@example.com',
    username: 'pending_cas_user',
    passwordHash: 'hash',
  });
  await PendingEntitlement.create({
    provider: 'lemonsqueezy',
    eventId: 'evt_pending_concurrent_activation',
    eventType: 'subscription_created',
    email: user.email,
    userId: String(user._id),
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    eventReceivedAt: new Date('2000-01-01T00:00:00Z'),
    eventOrderKey: '2000-01-01T00:00:00.000Z:000000000000000000000001',
  });
  const refundPayload = {
    meta: { event_name: 'order_refunded', test_mode: true },
    data: {
      id: 'order_pending_concurrent_refund',
      attributes: {
        user_email: user.email,
        custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
      },
    },
  };
  const rawBody = JSON.stringify(refundPayload);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  const originalUpdateOne = User.updateOne.bind(User);
  const queued = [];
  const updateGate = jest.spyOn(User, 'updateOne').mockImplementation((...args) => {
    const marker = String(args[1]?.$set?.['billing.providers.lemonsqueezy.lastEventId'] || '');
    if (!marker.includes('evt_pending_concurrent_activation') && !marker.includes('order_pending_concurrent_refund')) {
      return originalUpdateOne(...args);
    }
    return new Promise((resolve, reject) => {
      queued.push({ args, marker, resolve, reject });
      if (queued.length !== 2) return;
      queueMicrotask(async () => {
        const refundWrite = queued.find((entry) => entry.marker.includes('order_pending_concurrent_refund'));
        const pendingWrite = queued.find((entry) => entry.marker.includes('evt_pending_concurrent_activation'));
        try {
          refundWrite.resolve(await originalUpdateOne(...refundWrite.args));
          pendingWrite.resolve(await originalUpdateOne(...pendingWrite.args));
        } catch (error) {
          refundWrite.reject(error);
          pendingWrite.reject(error);
        }
      });
    });
  });

  let responses;
  try {
    responses = await Promise.all([
      request(app).get('/api/auth/me').set('Authorization', `Bearer ${signToken(user)}`),
      request(app)
        .post('/api/billing/webhooks/lemonsqueezy')
        .set('Content-Type', 'application/json')
        .set('x-signature', signature)
        .send(rawBody),
    ]);
  } finally {
    updateGate.mockRestore();
  }

  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  const updated = await User.findById(user._id).lean();
  expect(updated.entitlements.pro.status).toBe('none');
  expect(updated.accessTier).toBe('free');
  const pending = await PendingEntitlement.findOne({ eventId: 'evt_pending_concurrent_activation' }).lean();
  expect(pending.appliedAt).toBeTruthy();
  const refundEvent = await BillingEvent.findOne({ eventType: 'order_refunded' }).lean();
  expect(refundEvent.processingStatus).toBe('processed');
});

test('does not apply pending entitlement when email differs', async () => {
  const user = await User.create({
    email: 'apply@example.com',
    username: 'apply_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create({
    provider: 'gumroad',
    scope: 'pro',
    eventId: 'evt_other',
    eventType: 'sale',
    email: 'other@example.com',
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    saleId: 'sale_other',
  });

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('none');

  const pending = await PendingEntitlement.findOne({ eventId: 'evt_other' }).lean();
  expect(pending.appliedAt).toBeFalsy();
});

test('does not apply ignored pending entitlement for matching email', async () => {
  const user = await User.create({
    email: 'ignored@example.com',
    username: 'ignored_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create({
    provider: 'gumroad',
    scope: 'pro',
    eventId: 'evt_ignored',
    eventType: 'sale',
    email: 'ignored@example.com',
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    saleId: 'sale_ignored',
    ignoredAt: new Date('2026-01-01T00:00:00Z'),
    ignoredReason: 'manual_ignore',
    ignoredBy: 'test',
  });

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('none');
  expect(res.body.accessTierEffective).toBe('free');

  const pending = await PendingEntitlement.findOne({ eventId: 'evt_ignored' }).lean();
  expect(pending.appliedAt).toBeFalsy();
  expect(pending.ignoredAt).toBeTruthy();
});

test('lemonsqueezy pending entitlement requires matching userId', async () => {
  const user = await User.create({
    email: 'apply@example.com',
    username: 'apply_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create({
    provider: 'lemonsqueezy',
    scope: 'pro',
    eventId: 'evt_ls_mismatch',
    eventType: 'subscription_created',
    email: 'apply@example.com',
    userId: 'some-other-user-id',
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
  });

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('none');

  const pending = await PendingEntitlement.findOne({ eventId: 'evt_ls_mismatch' }).lean();
  expect(pending.appliedAt).toBeFalsy();
});

test('applies only matching lemonsqueezy pending entitlements and leaves mismatched ones unresolved', async () => {
  const user = await User.create({
    email: 'apply@example.com',
    username: 'apply_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create([
    {
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'evt_ls_match',
      eventType: 'subscription_created',
      email: 'apply@example.com',
      userId: String(user._id),
      entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00Z') },
    },
    {
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'evt_ls_other_user',
      eventType: 'subscription_created',
      email: 'apply@example.com',
      userId: 'some-other-user-id',
      entitlement: { status: 'active', validUntil: new Date('2099-02-01T00:00:00Z') },
    },
  ]);

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('active');
  expect(res.body.accessTierEffective).toBe('premium');

  const applied = await PendingEntitlement.findOne({ eventId: 'evt_ls_match' }).lean();
  const blocked = await PendingEntitlement.findOne({ eventId: 'evt_ls_other_user' }).lean();
  expect(applied.appliedAt).toBeTruthy();
  expect(String(applied.appliedUserId)).toBe(String(user._id));
  expect(blocked.appliedAt).toBeFalsy();
});

test('late stale lemonsqueezy cancel does not regress a later paid-through pending entitlement', async () => {
  const user = await User.create({
    email: 'apply@example.com',
    username: 'apply_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });

  await PendingEntitlement.create([
    {
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'evt_ls_renewed',
      eventType: 'subscription_payment_success',
      email: 'apply@example.com',
      userId: String(user._id),
      entitlement: { status: 'active', validUntil: new Date('2099-03-01T00:00:00Z') },
      receivedAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'evt_ls_stale_cancel',
      eventType: 'subscription_cancelled',
      email: 'apply@example.com',
      userId: String(user._id),
      entitlement: { status: 'cancelled', validUntil: new Date('2099-02-01T00:00:00Z') },
      receivedAt: new Date('2026-01-02T00:00:00Z'),
    },
  ]);

  const token = signToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.entitlements.pro.status).toBe('active');
  expect(new Date(res.body.entitlements.pro.validUntil).toISOString()).toBe('2099-03-01T00:00:00.000Z');
  expect(res.body.accessTierEffective).toBe('premium');

  const renewed = await PendingEntitlement.findOne({ eventId: 'evt_ls_renewed' }).lean();
  const staleCancel = await PendingEntitlement.findOne({ eventId: 'evt_ls_stale_cancel' }).lean();
  expect(renewed.appliedAt).toBeTruthy();
  expect(staleCancel.appliedAt).toBeTruthy();
});
