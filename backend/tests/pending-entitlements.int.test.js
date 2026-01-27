/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const JWT_SECRET = 'test_jwt_secret';

let app;
let User;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL);
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
  await PendingEntitlement.deleteMany({});
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
