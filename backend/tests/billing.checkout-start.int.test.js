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
  process.env.BILLING_TAX_INCLUSIVE = 'true';
  process.env.BILLING_OFFER_VERSION = 'pricing_baseline_v1';
  process.env.BILLING_CHECKOUT_SURFACE = 'hosted_new_tab';
  process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = '[]';
  process.env.BILLING_PLAN_PRICES_JSON = '';

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
  process.env.BILLING_TAX_INCLUSIVE = 'true';
  process.env.BILLING_OFFER_VERSION = 'pricing_baseline_v1';
  process.env.BILLING_CHECKOUT_SURFACE = 'hosted_new_tab';
  process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = '[]';
  process.env.BILLING_PLAN_PRICES_JSON = '';
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
      planDetails: {
        monthly: {
          amountCents: 2400,
          currency: 'USD',
          interval: 'month',
          intervalCount: 1,
          taxInclusive: true,
        },
        quarterly: {
          amountCents: 4900,
          currency: 'USD',
          interval: 'month',
          intervalCount: 3,
          taxInclusive: true,
        },
        annual: {
          amountCents: 9900,
          currency: 'USD',
          interval: 'year',
          intervalCount: 1,
          taxInclusive: true,
        },
        lifetime: {
          amountCents: 17900,
          currency: 'USD',
          interval: 'one_time',
          intervalCount: null,
          taxInclusive: true,
        },
      },
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
      pricing: { student: { multiplier: 0.6, planIds: ['annual'] }, regional: null },
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
      planDetails: expect.any(Object),
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
      pricing: { student: { multiplier: 0.6, planIds: ['annual'] }, regional: null },
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
      planDetails: expect.any(Object),
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
      pricing: { student: { multiplier: 0.6, planIds: ['annual'] }, regional: null },
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

  test('disables a plan when its test and live checkout identities match despite query differences', async () => {
    const shared = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/shared-mode-url';
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST = `${shared}?discount=0`;
    process.env.LEMONSQUEEZY_MONTHLY_URL_LIVE = `${shared}?discount=1`;

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
    expect(res.body.campaignId).toBeNull();
    expect(res.body.providerDiscountId).toBeNull();

    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.pathname).toContain('/checkout/buy/');
    expect(checkoutUrl.searchParams.get('discount')).toBe('0');
    expect(checkoutUrl.searchParams.has('checkout[discount_code]')).toBe(false);
    expect(checkoutUrl.searchParams.get('checkout[custom][fa_user_id]')).toBe(String(user._id));
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_checkout_attempt_id]')).toBe(res.body.attemptId);
    expect(checkoutUrl.searchParams.get('checkout[email]')).toBe(user.email);
    expect(checkoutUrl.searchParams.get('checkout[name]')).toBe(user.username);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_user_email]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_user_name]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_campaign_id]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_provider_discount_id]')).toBe(false);

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
    expect(attempt.campaignId).toBeNull();
    expect(attempt.providerDiscountId).toBeNull();
  });

  test('pre-applies only an active server-allowlisted campaign and persists safe attribution', async () => {
    process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = JSON.stringify([{
      enabled: true,
      campaignId: 'partner_august',
      provider: 'lemonsqueezy',
      providerDiscountId: 'discount_123',
      discountCode: 'PARTNER15',
      modes: ['test'],
      planIds: ['monthly'],
      analyticsSources: ['partner_august'],
      startsAt: '2020-01-01T00:00:00.000Z',
      endsAt: '2099-01-01T00:00:00.000Z',
    }]);
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?discount=1&checkout%5Bdiscount_code%5D=INHERITED&checkout%5Bcustom_data%5D%5Bfa_campaign_id%5D=forged';
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        analyticsSource: 'partner_august',
        campaignId: 'PARTNER_AUGUST',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      reused: false,
    }));
    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.searchParams.get('discount')).toBe('0');
    expect(checkoutUrl.searchParams.get('checkout[discount_code]')).toBe('PARTNER15');
    expect(checkoutUrl.searchParams.get('checkout[custom][fa_campaign_id]'))
      .toBe('partner_august');
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_provider_discount_id]'))
      .toBe('discount_123');

    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
    }));
  });

  test('scrubs inherited discounts and ignores raw client coupon or provider ids', async () => {
    process.env.LEMONSQUEEZY_MONTHLY_URL_TEST =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?discount=1&checkout%5Bdiscount_code%5D=ATLAS15&checkout%5Bcustom%5D%5Bfa_provider_discount_id%5D=forged';
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        campaignId: 'unknown_campaign',
        couponCode: 'ATLAS15',
        discountCode: 'ATLAS15',
        providerDiscountId: 'discount_forged',
      });

    expect(res.status).toBe(200);
    expect(res.body.campaignId).toBeNull();
    expect(res.body.providerDiscountId).toBeNull();
    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.searchParams.get('discount')).toBe('0');
    expect(checkoutUrl.searchParams.has('checkout[discount_code]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom][fa_campaign_id]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom][fa_provider_discount_id]')).toBe(false);
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt.campaignId).toBeNull();
    expect(attempt.providerDiscountId).toBeNull();
  });

  test('does not reuse undiscounted attempts across a campaign boundary', async () => {
    process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = JSON.stringify([{
      enabled: true,
      campaignId: 'partner_august',
      provider: 'lemonsqueezy',
      providerDiscountId: 'discount_123',
      discountCode: 'PARTNER15',
      modes: ['test'],
      planIds: ['monthly'],
      analyticsSources: ['partner_august'],
      endsAt: '2099-01-01T00:00:00.000Z',
    }]);
    const user = await seedUser();
    const send = (body) => request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send(body);

    const undiscounted = await send({ planId: 'monthly', analyticsSource: 'partner_august' });
    const discounted = await send({
      planId: 'monthly',
      analyticsSource: 'partner_august',
      campaignId: 'partner_august',
    });
    const repeated = await send({
      planId: 'monthly',
      analyticsSource: 'partner_august',
      campaignId: 'PARTNER_AUGUST',
    });

    expect(undiscounted.status).toBe(200);
    expect(discounted.status).toBe(200);
    expect(discounted.body.attemptId).not.toBe(undiscounted.body.attemptId);
    expect(discounted.body.reused).toBe(false);
    expect(repeated.body.attemptId).toBe(discounted.body.attemptId);
    expect(repeated.body.reused).toBe(true);
    expect(await CheckoutAttempt.countDocuments({ userId: user._id })).toBe(2);
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

  test('persists safe experiment attribution and forwards it as LemonSqueezy custom data', async () => {
    process.env.BILLING_OFFER_VERSION = 'interview_sprint_v2';
    process.env.BILLING_CHECKOUT_SURFACE = 'overlay';
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        analyticsSessionId: '1724400000.123456789',
        experimentId: 'pricing-proof:variant_a',
        offerVersion: 'INTERVIEW_SPRINT_V2',
        checkoutSurface: 'overlay',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      analyticsSessionId: '1724400000.123456789',
      experimentId: 'pricing-proof:variant_a',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    }));

    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_analytics_session_id]'))
      .toBe('1724400000.123456789');
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_experiment_id]'))
      .toBe('pricing-proof:variant_a');
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_offer_version]'))
      .toBe('interview_sprint_v2');
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_checkout_surface]'))
      .toBe('overlay');

    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      analyticsSessionId: '1724400000.123456789',
      experimentId: 'pricing-proof:variant_a',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    }));
  });

  test('falls back to configured attribution defaults when optional values are unsafe', async () => {
    process.env.BILLING_OFFER_VERSION = 'interview_sprint_v2';
    process.env.BILLING_CHECKOUT_SURFACE = 'overlay';
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        analyticsSessionId: 'person@example.com',
        experimentId: '<script>',
        offerVersion: 'invalid offer!',
        checkoutSurface: 'new_popup',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      analyticsSessionId: null,
      experimentId: null,
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    }));
    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_analytics_session_id]')).toBe(false);
    expect(checkoutUrl.searchParams.has('checkout[custom_data][fa_experiment_id]')).toBe(false);
  });

  test('does not let a crafted request override the server-owned offer rollout', async () => {
    const user = await seedUser();

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        offerVersion: 'interview_sprint_v2',
        checkoutSurface: 'overlay',
      });

    expect(res.status).toBe(200);
    expect(res.body.offerVersion).toBe('pricing_baseline_v1');
    expect(res.body.checkoutSurface).toBe('hosted_new_tab');
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt.offerVersion).toBe('pricing_baseline_v1');
    expect(attempt.checkoutSurface).toBe('hosted_new_tab');
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

  test('does not reuse an attempt across offer versions or checkout surfaces', async () => {
    const user = await seedUser();

    const baseline = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });
    process.env.BILLING_OFFER_VERSION = 'interview_sprint_v2';
    process.env.BILLING_CHECKOUT_SURFACE = 'overlay';
    const overlay = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({
        planId: 'monthly',
        offerVersion: 'interview_sprint_v2',
        checkoutSurface: 'overlay',
      });

    expect(baseline.status).toBe(200);
    expect(overlay.status).toBe(200);
    expect(overlay.body.attemptId).not.toBe(baseline.body.attemptId);
    expect(await CheckoutAttempt.countDocuments({ userId: user._id })).toBe(2);
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

describe('checkout start first-touch attribution', () => {
  test('stores the landing path, referrer host and edge country on the attempt only', async () => {
    const user = await seedUser({ email: 'attribution@example.com', username: 'attribution_user' });

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-vercel-ip-country', 'tr')
      .send({
        planId: 'monthly',
        landingPath: '/companies/waymo?utm_source=newsletter#prompts',
        referrerHost: 'https://www.Google.com/search?q=waymo',
      });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('landingPath');
    expect(res.body).not.toHaveProperty('countryCode');
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      landingPath: '/companies/waymo',
      referrerHost: 'www.google.com',
      countryCode: 'TR',
    }));
    expect(attempt.checkoutUrl).not.toContain('waymo');
    expect(attempt.checkoutUrl).not.toContain('google');
  });

  test('keeps checkout working and stores null when attribution values are malformed or oversized', async () => {
    const user = await seedUser({ email: 'malformed@example.com', username: 'malformed_user' });

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-vercel-ip-country', 'turkey')
      .send({
        planId: 'monthly',
        landingPath: 'javascript:alert(1)',
        referrerHost: 'x'.repeat(300),
      });

    expect(res.status).toBe(200);
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt.landingPath).toBeNull();
    expect(attempt.referrerHost).toBeNull();
    expect(attempt.countryCode).toBeNull();
  });

  test('leaves attribution empty when the client sends nothing and no edge header is present', async () => {
    const user = await seedUser({ email: 'direct@example.com', username: 'direct_user' });

    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly' });

    expect(res.status).toBe(200);
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt.landingPath).toBeNull();
    expect(attempt.referrerHost).toBeNull();
    expect(attempt.countryCode).toBeNull();
  });

  test('keeps the first attribution when an active attempt is reused', async () => {
    const user = await seedUser({ email: 'reuse@example.com', username: 'reuse_user' });

    const first = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-vercel-ip-country', 'de')
      .send({ planId: 'monthly', landingPath: '/pricing', referrerHost: 'news.ycombinator.com' });
    const second = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId: 'monthly', landingPath: '/other' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.attemptId).toBe(first.body.attemptId);
    expect(second.body.reused).toBe(true);
    const attempt = await CheckoutAttempt.findOne({ attemptId: first.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      landingPath: '/pricing',
      referrerHost: 'news.ycombinator.com',
      countryCode: 'DE',
    }));
  });
});

describe('checkout config plan prices', () => {
  test('serves overridden plan prices from BILLING_PLAN_PRICES_JSON without touching intervals', async () => {
    process.env.BILLING_PLAN_PRICES_JSON = '{"quarterly":5900,"annual":11900,"lifetime":19900}';

    const res = await request(app).get('/api/billing/checkout/config');

    expect(res.status).toBe(200);
    expect(res.body.planDetails).toEqual({
      monthly: { amountCents: 2400, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
      quarterly: { amountCents: 5900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
      annual: { amountCents: 11900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
      lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
    });
  });

  test('keeps the default prices when the override is malformed', async () => {
    process.env.BILLING_PLAN_PRICES_JSON = '{"quarterly":0}';

    const res = await request(app).get('/api/billing/checkout/config');

    expect(res.status).toBe(200);
    expect(res.body.planDetails.quarterly.amountCents).toBe(4900);
    expect(res.body.planDetails.monthly.amountCents).toBe(2400);
  });
});

describe('student pricing applied at checkout', () => {
  // Without a custom-checkout configuration the student price falls back to the
  // allowlisted student code; the plan rule (annual only) still applies.
  const studentEntry = {
    enabled: true,
    campaignId: 'student_2026_autumn',
    provider: 'lemonsqueezy',
    providerDiscountId: 'discount_456',
    discountCode: 'STUDENT40',
    modes: ['test'],
    planIds: ['quarterly', 'annual'],
    analyticsSources: ['pricing_page'],
    eligibility: 'student',
    startsAt: '2020-01-01T00:00:00.000Z',
    endsAt: '2099-01-01T00:00:00.000Z',
  };

  function arm(extraEntries = []) {
    process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = JSON.stringify([studentEntry, ...extraEntries]);
    process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-quarterly';
    process.env.LEMONSQUEEZY_ANNUAL_URL_TEST =
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-annual';
  }

  afterEach(() => {
    process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = '[]';
    process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST = '';
    process.env.LEMONSQUEEZY_ANNUAL_URL_TEST = '';
  });

  async function start(user, planId, body = {}) {
    return request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .send({ planId, ...body });
  }

  test('applies the student code to the annual plan for a verified school address on a first purchase', async () => {
    arm();
    const user = await seedUser({ email: 'ada@university.edu', username: 'ada_student', emailVerifiedAt: new Date() });

    const res = await start(user, 'annual');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      campaignId: 'student_2026_autumn',
      providerDiscountId: 'discount_456',
      campaignEligibility: 'student',
    }));
    expect(res.body.pricing).toEqual(expect.objectContaining({ reason: null, amountCents: 9900 }));
    const checkoutUrl = new URL(res.body.checkoutUrl);
    expect(checkoutUrl.searchParams.get('checkout[discount_code]')).toBe('STUDENT40');
    expect(checkoutUrl.searchParams.get('discount')).toBe('0');
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      campaignId: 'student_2026_autumn',
      campaignEligibility: 'student',
      priceReason: null,
    }));
  });

  test('is annual only: the quarterly plan gets no student price even when the code entry lists it', async () => {
    arm();
    const user = await seedUser({ email: 'quarterly@university.edu', username: 'quarterly_student', emailVerifiedAt: new Date() });
    const res = await start(user, 'quarterly');
    expect(res.status).toBe(200);
    expect(res.body.campaignId).toBeNull();
    expect(res.body.campaignEligibility).toBeNull();
    expect(new URL(res.body.checkoutUrl).searchParams.has('checkout[discount_code]')).toBe(false);
  });

  test('does not apply it to an unverified school address or a non-student address', async () => {
    arm();
    const unverified = await seedUser({ email: 'unverified@university.edu', username: 'unverified_student', emailVerifiedAt: null });
    const consumer = await seedUser({ email: 'ada@gmail.com', username: 'consumer_user', emailVerifiedAt: new Date() });

    for (const user of [unverified, consumer]) {
      const res = await start(user, 'annual');
      expect(res.status).toBe(200);
      expect(res.body.campaignId).toBeNull();
      expect(res.body.campaignEligibility).toBeNull();
      expect(new URL(res.body.checkoutUrl).searchParams.has('checkout[discount_code]')).toBe(false);
    }
  });

  test('is a first-purchase discount: a verified payment or an active entitlement switches it off', async () => {
    arm();
    const repeat = await seedUser({ email: 'repeat@university.edu', username: 'repeat_student', emailVerifiedAt: new Date() });
    await CheckoutAttempt.create({
      attemptId: 'chk_prior_student',
      userId: repeat._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'applied',
      paymentVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      paymentTotalCents: 1200,
    });
    const repeatRes = await start(repeat, 'annual');
    expect(repeatRes.status).toBe(200);
    expect(repeatRes.body.campaignId).toBeNull();

    const entitled = await seedUser({
      email: 'entitled@university.edu',
      username: 'entitled_student',
      emailVerifiedAt: new Date(),
      entitlements: {
        pro: { status: 'active', validUntil: new Date('2099-01-01T00:00:00.000Z') },
        projects: { status: 'none', validUntil: null },
      },
    });
    const entitledRes = await start(entitled, 'annual');
    expect(entitledRes.status).toBe(200);
    expect(entitledRes.body.campaignId).toBeNull();
  });

  test('honours a support approval and lets an explicit campaign win', async () => {
    arm([{
      enabled: true,
      campaignId: 'partner_autumn',
      provider: 'lemonsqueezy',
      providerDiscountId: 'discount_789',
      discountCode: 'PARTNER20',
      modes: ['test'],
      planIds: ['annual'],
      analyticsSources: ['partner_autumn'],
      startsAt: '2020-01-01T00:00:00.000Z',
      endsAt: '2099-01-01T00:00:00.000Z',
    }]);
    const approved = await seedUser({
      email: 'approved@gmail.com',
      username: 'approved_student',
      emailVerifiedAt: null,
      billing: { studentApprovedAt: new Date('2026-10-01T00:00:00.000Z') },
    });
    const approvedRes = await start(approved, 'annual');
    expect(approvedRes.status).toBe(200);
    expect(approvedRes.body).toEqual(expect.objectContaining({ campaignId: 'student_2026_autumn', campaignEligibility: 'student' }));

    const explicit = await seedUser({ email: 'explicit@university.edu', username: 'explicit_student', emailVerifiedAt: new Date() });
    const explicitRes = await start(explicit, 'annual', { analyticsSource: 'partner_autumn', campaignId: 'partner_autumn' });
    expect(explicitRes.status).toBe(200);
    expect(explicitRes.body).toEqual(expect.objectContaining({ campaignId: 'partner_autumn', campaignEligibility: null }));
    expect(new URL(explicitRes.body.checkoutUrl).searchParams.get('checkout[discount_code]')).toBe('PARTNER20');
  });
});

describe('regional and student prices through a custom checkout', () => {
  const CUSTOM_URL = 'https://frontendatlas.lemonsqueezy.com/checkout/custom/ac470bd4-7c41-474d-b6cd-0f296f5be02a?signature=sig';
  const originalFetch = global.fetch;
  // The local .env may carry an unscoped LEMONSQUEEZY_API_KEY; keep it out of the assertions.
  const savedKeys = {};
  let createdCheckouts;

  function respondWithCheckout(request) {
    const body = JSON.parse(request.body);
    createdCheckouts.push(body);
    return {
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          id: `ls_${createdCheckouts.length}`,
          attributes: { url: CUSTOM_URL, custom_price: body.data.attributes.custom_price },
        },
      }),
    };
  }

  beforeEach(() => {
    createdCheckouts = [];
    savedKeys.unscoped = process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMONSQUEEZY_API_KEY;
    process.env.LEMONSQUEEZY_API_KEY_TEST = 'key_test';
    process.env.LEMONSQUEEZY_STORE_ID = '12345';
    process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID_TEST = '111';
    process.env.LEMONSQUEEZY_QUARTERLY_VARIANT_ID_TEST = '222';
    process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID_TEST = '444';
    process.env.LEMONSQUEEZY_LIFETIME_VARIANT_ID_TEST = '333';
    process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-quarterly';
    process.env.LEMONSQUEEZY_ANNUAL_URL_TEST = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-annual';
    process.env.LEMONSQUEEZY_LIFETIME_URL_TEST = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-lifetime';
    process.env.BILLING_REGIONAL_PRICING_JSON = '{"TR":0.5}';
    global.fetch = jest.fn(async (_url, init) => respondWithCheckout(init));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.LEMONSQUEEZY_API_KEY_TEST;
    if (savedKeys.unscoped === undefined) delete process.env.LEMONSQUEEZY_API_KEY;
    else process.env.LEMONSQUEEZY_API_KEY = savedKeys.unscoped;
    delete process.env.LEMONSQUEEZY_STORE_ID;
    for (const plan of ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'LIFETIME']) delete process.env[`LEMONSQUEEZY_${plan}_VARIANT_ID_TEST`];
    process.env.LEMONSQUEEZY_QUARTERLY_URL_TEST = '';
    process.env.LEMONSQUEEZY_ANNUAL_URL_TEST = '';
    process.env.LEMONSQUEEZY_LIFETIME_URL_TEST = '';
    process.env.BILLING_REGIONAL_PRICING_JSON = '';
    process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = '[]';
  });

  async function start(user, planId, headers = {}) {
    let req = request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id));
    for (const [name, value] of Object.entries(headers)) req = req.set(name, value);
    return req.send({ planId });
  }

  test('publishes the regional block in the config only for a listed country and a configured custom checkout', async () => {
    const turkey = await request(app).get('/api/billing/checkout/config').set('x-vercel-ip-country', 'tr');
    expect(turkey.status).toBe(200);
    expect(turkey.headers.vary).toContain('x-vercel-ip-country');
    expect(turkey.body.pricing).toEqual({
      student: { multiplier: 0.6, planIds: ['annual'] },
      regional: expect.objectContaining({
        countryCode: 'TR',
        multiplier: 0.5,
        prices: { monthly: 1200, quarterly: 2450, annual: 4950, lifetime: 8950 },
      }),
    });
    expect(typeof turkey.body.pricing.regional.countryName).toBe('string');

    const elsewhere = await request(app).get('/api/billing/checkout/config').set('x-vercel-ip-country', 'DE');
    expect(elsewhere.body.pricing.regional).toBeNull();
    const noHeader = await request(app).get('/api/billing/checkout/config');
    expect(noHeader.body.pricing.regional).toBeNull();

    delete process.env.LEMONSQUEEZY_API_KEY_TEST;
    const unconfigured = await request(app).get('/api/billing/checkout/config').set('x-vercel-ip-country', 'TR');
    expect(unconfigured.body.pricing.regional).toBeNull();
    expect(unconfigured.body.pricing.student).toEqual({ multiplier: 0.6, planIds: ['annual'] });
  });

  test('creates a custom checkout at the regional price with the attempt in its custom data', async () => {
    const user = await seedUser({ email: 'regional@example.com', username: 'regional_user' });

    const res = await start(user, 'monthly', { 'x-vercel-ip-country': 'TR' });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBe(CUSTOM_URL);
    expect(res.body.pricing).toEqual({ reason: 'regional', multiplier: 0.5, listAmountCents: 2400, amountCents: 1200, countryCode: 'TR' });
    expect(res.body.campaignId).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [apiUrl, init] = global.fetch.mock.calls[0];
    expect(apiUrl).toBe('https://api.lemonsqueezy.com/v1/checkouts');
    expect(init.headers.Authorization).toBe('Bearer key_test');
    const body = createdCheckouts[0].data;
    expect(body.attributes.custom_price).toBe(1200);
    expect(body.attributes.test_mode).toBe(true);
    expect(body.attributes.checkout_options).toEqual({ discount: false, embed: false });
    expect(body.attributes.checkout_data.email).toBe(user.email);
    expect(body.attributes.checkout_data.custom).toEqual(expect.objectContaining({
      fa_user_id: String(user._id),
      fa_checkout_attempt_id: res.body.attemptId,
      fa_price_reason: 'regional',
      fa_frontend_origin: 'http://localhost:4200',
    }));
    expect(body.attributes.product_options).toEqual({
      enabled_variants: [111],
      redirect_url: res.body.successUrl,
    });
    expect(body.relationships).toEqual({
      store: { data: { type: 'stores', id: '12345' } },
      variant: { data: { type: 'variants', id: '111' } },
    });

    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      countryCode: 'TR',
      priceReason: 'regional',
      priceMultiplier: 0.5,
      priceListCents: 2400,
      priceChargedCents: 1200,
      providerCheckoutId: 'ls_1',
      checkoutUrl: CUSTOM_URL,
    }));
  });

  test('charges a verified student 40% off the annual plan, the better of the two prices, and nothing on other plans', async () => {
    const student = await seedUser({ email: 'ada@university.edu', username: 'custom_student', emailVerifiedAt: new Date() });

    const annual = await start(student, 'annual');
    expect(annual.status).toBe(200);
    expect(annual.body.pricing).toEqual({ reason: 'student', multiplier: 0.6, listAmountCents: 9900, amountCents: 5940, countryCode: null });
    expect(annual.body.campaignId).toBeNull();
    expect(createdCheckouts[0].data.attributes.custom_price).toBe(5940);
    expect(createdCheckouts[0].data.attributes.checkout_data.custom.fa_price_reason).toBe('student');

    const inTurkey = await seedUser({ email: 'tr@university.edu', username: 'turkish_student', emailVerifiedAt: new Date() });
    const regional = await start(inTurkey, 'annual', { 'x-vercel-ip-country': 'TR' });
    expect(regional.body.pricing).toEqual(expect.objectContaining({ reason: 'regional', amountCents: 4950 }));

    const quarterly = await start(student, 'quarterly');
    expect(quarterly.status).toBe(200);
    expect(quarterly.body.pricing).toEqual(expect.objectContaining({ reason: null, amountCents: 4900 }));
    expect(new URL(quarterly.body.checkoutUrl).pathname).toContain('/checkout/buy/');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('reuses a recent custom checkout for the same price instead of creating another', async () => {
    const user = await seedUser({ email: 'reuse-regional@example.com', username: 'reuse_regional' });
    const first = await start(user, 'annual', { 'x-vercel-ip-country': 'TR' });
    const second = await start(user, 'annual', { 'x-vercel-ip-country': 'TR' });
    expect(second.body.reused).toBe(true);
    expect(second.body.attemptId).toBe(first.body.attemptId);
    expect(second.body.pricing).toEqual(first.body.pricing);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('fails closed when the provider cannot create the checkout, so nobody is charged the list price by surprise', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const user = await seedUser({ email: 'outage@example.com', username: 'outage_user' });

    const res = await start(user, 'monthly', { 'x-vercel-ip-country': 'TR' });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('CUSTOM_CHECKOUT_UNAVAILABLE');
    expect(await CheckoutAttempt.countDocuments({ userId: user._id })).toBe(0);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('keeps the list price and the buy link for a country without a regional price', async () => {
    const user = await seedUser({ email: 'list@example.com', username: 'list_user' });
    const res = await start(user, 'monthly', { 'x-vercel-ip-country': 'US' });
    expect(res.status).toBe(200);
    expect(res.body.pricing).toEqual({ reason: null, multiplier: 1, listAmountCents: 2400, amountCents: 2400, countryCode: null });
    expect(new URL(res.body.checkoutUrl).pathname).toContain('/checkout/buy/');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
