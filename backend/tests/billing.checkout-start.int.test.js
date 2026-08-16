const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let CheckoutAttempt;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_for_checkout_start';

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

async function seedUser(overrides = {}) {
  return User.create({
    email: 'checkout@example.com',
    username: 'checkout_user',
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
  process.env.LEMONSQUEEZY_MONTHLY_URL_TEST =
    'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly';
  process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST = '';
  process.env.LEMONSQUEEZY_ANNUAL_URL_TEST = '';
  process.env.LEMONSQUEEZY_LIFETIME_URL_TEST = '';
  process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE = '';
  process.env.LEMONSQUEEZY_QUARTERLY_URL_LIVE = '';
  process.env.LEMONSQUEEZY_ANNUAL_URL_LIVE = '';
  process.env.LEMONSQUEEZY_LIFETIME_URL_LIVE = '';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  CheckoutAttempt = require('../models/CheckoutAttempt');

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
  process.env.BILLING_PROVIDER = 'lemonsqueezy';
  process.env.PAYMENTS_MODE = 'test';
  process.env.LEMONSQUEEZY_MONTHLY_URL_TEST =
    'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly';
  process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST = '';
  process.env.LEMONSQUEEZY_ANNUAL_URL_TEST = '';
  process.env.LEMONSQUEEZY_LIFETIME_URL_TEST = '';
  process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE = '';
  process.env.LEMONSQUEEZY_QUARTERLY_URL_LIVE = '';
  process.env.LEMONSQUEEZY_ANNUAL_URL_LIVE = '';
  process.env.LEMONSQUEEZY_LIFETIME_URL_LIVE = '';
  process.env.LEMONSQUEEZY_MONTHLY_URL = '';
  process.env.LEMONSQUEEZY_QUARTERLY_URL = '';
  process.env.LEMONSQUEEZY_ANNUAL_URL = '';
  process.env.LEMONSQUEEZY_LIFETIME_URL = '';
  await User.deleteMany({});
  await CheckoutAttempt.deleteMany({});
});

describe('billing checkout start route', () => {
  test('returns backend-owned checkout configuration for public pricing surfaces', async () => {
    const res = await request(app).get('/api/billing/checkout/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: {
        monthly: true,
        quarterly: false,
        annual: false,
        lifetime: false,
      },
    });
  });

  test('returns a disabled runtime checkout config when the configured provider is reserved but not active', async () => {
    process.env.BILLING_PROVIDER = 'stripe';

    const res = await request(app).get('/api/billing/checkout/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      configuredProvider: 'stripe',
      provider: null,
      mode: 'test',
      enabled: false,
      plans: {
        monthly: false,
        quarterly: false,
        annual: false,
        lifetime: false,
      },
    });
  });

  test('uses live checkout urls in live mode and keeps misconfigured annual disabled', async () => {
    process.env.PAYMENTS_MODE = 'live';
    process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-monthly';
    process.env.LEMONSQUEEZY_QUARTERLY_URL_LIVE =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-quarterly';
    process.env.LEMONSQUEEZY_ANNUAL_URL_LIVE =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-quarterly';

    const configRes = await request(app).get('/api/billing/checkout/config');

    expect(configRes.status).toBe(200);
    expect(configRes.body).toEqual({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'live',
      enabled: true,
      plans: {
        monthly: true,
        quarterly: true,
        annual: false,
        lifetime: false,
      },
    });

    const user = await seedUser({ email: 'live-checkout@example.com', username: 'live_checkout_user' });
    const startRes = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(startRes.status).toBe(200);
    expect(startRes.body.mode).toBe('live');
    expect(startRes.body.checkoutUrl).toContain('/checkout/buy/live-monthly');
  });

  test('does not fall back to an unscoped LemonSqueezy URL in live mode', async () => {
    process.env.PAYMENTS_MODE = 'live';
    process.env.LEMONSQUEEZY_MONTHLY_URL =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/legacy-test-monthly';
    process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE = '';

    const configRes = await request(app).get('/api/billing/checkout/config');

    expect(configRes.status).toBe(200);
    expect(configRes.body.plans.monthly).toBe(false);
    const user = await seedUser({ email: 'no-live-fallback@example.com', username: 'no_live_fallback' });
    const startRes = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });
    expect(startRes.status).toBe(409);
    expect(startRes.body.code).toBe('CHECKOUT_UNAVAILABLE');
  });

  test('disables a lifetime checkout URL copied from a recurring plan', async () => {
    process.env.PAYMENTS_MODE = 'live';
    process.env.LEMONSQUEEZY_ANNUAL_URL_LIVE =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-annual';
    process.env.LEMONSQUEEZY_LIFETIME_URL_LIVE =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/live-annual';

    const configRes = await request(app).get('/api/billing/checkout/config');

    expect(configRes.status).toBe(200);
    expect(configRes.body.plans.annual).toBe(true);
    expect(configRes.body.plans.lifetime).toBe(false);
    const user = await seedUser({ email: 'lifetime-copy@example.com', username: 'lifetime_copy' });
    const startRes = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'lifetime' });
    expect(startRes.status).toBe(409);
    expect(startRes.body.code).toBe('CHECKOUT_UNAVAILABLE');
  });

  test('disables a plan when its test and live URLs are identical', async () => {
    const shared = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/shared-mode-url';
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST = shared;
    process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE = shared;

    const configRes = await request(app).get('/api/billing/checkout/config');

    expect(configRes.status).toBe(200);
    expect(configRes.body.plans.monthly).toBe(false);
  });

  test('disables checkout URLs copied across different plans and modes', async () => {
    const shared = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/shared-cross-plan-mode-url';
    process.env.PAYMENTS_MODE = 'live';
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST = shared;
    process.env.LEMONSQUEEZY_LIFETIME_URL_LIVE = shared;

    const liveConfig = await request(app).get('/api/billing/checkout/config');
    expect(liveConfig.status).toBe(200);
    expect(liveConfig.body.plans.lifetime).toBe(false);

    process.env.PAYMENTS_MODE = 'test';
    const testConfig = await request(app).get('/api/billing/checkout/config');
    expect(testConfig.status).toBe(200);
    expect(testConfig.body.plans.monthly).toBe(false);
  });

  test('rejects a checkout URL hosted outside the configured provider', async () => {
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST = 'https://payments.example.test/checkout/buy/not-lemonsqueezy';

    const configRes = await request(app).get('/api/billing/checkout/config');

    expect(configRes.status).toBe(200);
    expect(configRes.body.plans.monthly).toBe(false);
    expect(configRes.body.enabled).toBe(false);
  });

  test('creates a checkout attempt and returns a final hosted checkout url', async () => {
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('lemonsqueezy');
    expect(res.body.planId).toBe('monthly');
    expect(res.body.mode).toBe('test');
    expect(res.body.attemptId).toMatch(/^chk_/);
    expect(res.body.reused).toBe(false);

    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.pathname).toContain('/checkout/buy/');
    expect(checkoutUrl.searchParams.get('checkout[custom][fa_user_id]')).toBe(String(user._id));
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_checkout_attempt_id]')).toBe(res.body.attemptId);

    const successUrl = new URL(res.body.successUrl);
    expect(successUrl.pathname).toBe('/billing/success');
    expect(successUrl.searchParams.get('attempt')).toBe(res.body.attemptId);

    const cancelUrl = new URL(res.body.cancelUrl);
    expect(cancelUrl.pathname).toBe('/billing/cancel');
    expect(cancelUrl.searchParams.get('attempt')).toBe(res.body.attemptId);

    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toBeTruthy();
    expect(String(attempt.userId)).toBe(String(user._id));
    expect(attempt.status).toBe('created');
    expect(attempt.provider).toBe('lemonsqueezy');
    expect(attempt.planId).toBe('monthly');
  });

  test('ignores any frontend-supplied provider and uses backend billing configuration', async () => {
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ provider: 'stripe', planId: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('lemonsqueezy');
    expect(res.body.planId).toBe('monthly');
  });

  test('stores normalized analytics source and surface as independent attribution dimensions', async () => {
    const user = await seedUser();

    const safe = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        analyticsSurface: 'Hero_Pricing',
        analyticsSource: 'Pricing_Page',
      });

    expect(safe.status).toBe(200);
    const safeAttempt = await CheckoutAttempt.findOne({ attemptId: safe.body.attemptId }).lean();
    expect(safe.body.analyticsSurface).toBe('hero_pricing');
    expect(safe.body.analyticsSource).toBe('pricing_page');
    expect(safeAttempt.analyticsSurface).toBe('hero_pricing');
    expect(safeAttempt.analyticsSource).toBe('pricing_page');

    const invalid = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly', analyticsSource: 'pricing page?<script>' });

    expect(invalid.status).toBe(200);
    const invalidAttempt = await CheckoutAttempt.findOne({ attemptId: invalid.body.attemptId }).lean();
    expect(invalid.body.analyticsSurface).toBe('pricing');
    expect(invalid.body.analyticsSource).toBe('pricing');
    expect(invalidAttempt.analyticsSurface).toBe('pricing');
    expect(invalidAttempt.analyticsSource).toBe('pricing');
  });

  test('does not reuse a checkout attempt across different analytics sources', async () => {
    const user = await seedUser();

    const first = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly', analyticsSource: 'campaign_a', analyticsSurface: 'pricing_page' });
    const second = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly', analyticsSource: 'campaign_b', analyticsSurface: 'pricing_page' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.attemptId).not.toBe(first.body.attemptId);
    expect(second.body.reused).toBe(false);
    const attempts = await CheckoutAttempt.find({ userId: user._id }).sort({ createdAt: 1 }).lean();
    expect(attempts.map((attempt) => attempt.analyticsSource)).toEqual(['campaign_a', 'campaign_b']);
    expect(attempts.every((attempt) => attempt.analyticsSurface === 'pricing_page')).toBe(true);
  });

  test('reuses a recent active checkout attempt for the same user and plan', async () => {
    const user = await seedUser();

    const first = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    const second = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.attemptId).toBe(second.body.attemptId);
    expect(first.body.checkoutUrl).toBe(second.body.checkoutUrl);
    expect(first.body.reused).toBe(false);
    expect(second.body.reused).toBe(true);

    const attempts = await CheckoutAttempt.find({ userId: user._id }).lean();
    expect(attempts).toHaveLength(1);
  });

  test('rejects invalid plans', async () => {
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'weekly' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PLAN');
  });

  test('returns 409 when checkout url is unavailable', async () => {
    const user = await seedUser();
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST = '';

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CHECKOUT_UNAVAILABLE');
  });

  test('rejects Gumroad checkout before creating an attempt when email is unverified', async () => {
    process.env.BILLING_PROVIDER = 'gumroad';
    process.env.GUMROAD_MONTHLY_URL = 'https://gumroad.example.test/buy/monthly';
    const user = await seedUser({ emailVerifiedAt: null });

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    expect(await CheckoutAttempt.countDocuments({ userId: user._id })).toBe(0);
  });
});
