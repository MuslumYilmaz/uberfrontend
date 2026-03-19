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
});
