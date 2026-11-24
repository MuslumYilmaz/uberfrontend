/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { PRODUCT_IDS } = require('./helpers/polar-fixtures');

jest.setTimeout(120000);

const JWT_SECRET = 'test_jwt_secret_for_polar_checkout_start';
const ORIGINAL_FETCH = global.fetch;
const CATALOG = { [PRODUCT_IDS.monthly]: 2400, [PRODUCT_IDS.quarterly]: 4900, [PRODUCT_IDS.annual]: 9900, [PRODUCT_IDS.lifetime]: 17900 };

let app;
let User;
let CheckoutAttempt;
let connectToMongo;
let disconnectMongo;
let mongoServer;
let sessionCounter = 0;

function authHeader(userId) {
  return `Bearer ${jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' })}`;
}

async function seedUser(overrides = {}) {
  return User.create({
    email: 'polar-buyer@example.com',
    username: 'polar_buyer',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: { pro: { status: 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
    ...overrides,
  });
}

// Answers like the sandbox: the session echoes the product price or the ad-hoc price.
function respondLikePolar(init) {
  const body = JSON.parse(init.body);
  const productId = body.products[0];
  const adHoc = body.prices?.[productId]?.[0]?.price_amount;
  const amount = adHoc ?? CATALOG[productId];
  sessionCounter += 1;
  return {
    ok: true,
    status: 201,
    json: async () => ({
      id: `c0ffee00-0000-4000-8000-${String(sessionCounter).padStart(12, '0')}`,
      url: `https://sandbox.polar.sh/checkout/polar_c_${sessionCounter}`,
      status: 'open',
      amount,
      total_amount: body.discount_id ? Math.round(amount * 0.6) : amount,
      expires_at: '2026-11-24T08:05:23.418661Z',
      client_secret: 'polar_c_secret',
    }),
  };
}

function setPolarEnv() {
  process.env.BILLING_PROVIDER = 'polar';
  process.env.PAYMENTS_MODE = 'test';
  process.env.POLAR_ACCESS_TOKEN_TEST = 'polar_oat_sandbox';
  process.env.POLAR_ACCESS_TOKEN_LIVE = '';
  process.env.POLAR_MONTHLY_PRODUCT_ID_TEST = PRODUCT_IDS.monthly;
  process.env.POLAR_QUARTERLY_PRODUCT_ID_TEST = PRODUCT_IDS.quarterly;
  process.env.POLAR_ANNUAL_PRODUCT_ID_TEST = PRODUCT_IDS.annual;
  process.env.POLAR_LIFETIME_PRODUCT_ID_TEST = PRODUCT_IDS.lifetime;
  process.env.BILLING_REGIONAL_PRICING_JSON = '{"TR":0.5}';
  process.env.BILLING_CHECKOUT_SURFACE = 'overlay';
  process.env.BILLING_OFFER_VERSION = 'pricing_baseline_v1';
  process.env.BILLING_TAX_INCLUSIVE = 'true';
  process.env.BILLING_PLAN_PRICES_JSON = '';
  process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON = JSON.stringify([{
    enabled: true,
    campaignId: 'partner_polar',
    provider: 'polar',
    providerDiscountId: '4232bc9e-61a2-43f9-bfe7-d5ca2bec623b',
    modes: ['test'],
    planIds: ['annual'],
    analyticsSources: ['partner_polar'],
    endsAt: '2099-01-01T00:00:00.000Z',
  }]);
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.FRONTEND_BASE = 'http://localhost:4200';
  setPolarEnv();

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  CheckoutAttempt = require('../models/CheckoutAttempt');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await CheckoutAttempt.init();
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
  global.fetch = ORIGINAL_FETCH;
});

beforeEach(async () => {
  setPolarEnv();
  sessionCounter = 0;
  global.fetch = jest.fn(async (_url, init) => respondLikePolar(init));
  await User.deleteMany({});
  await CheckoutAttempt.deleteMany({});
});

describe('Polar checkout config', () => {
  test('publishes every configured plan, the overlay surface and the regional block', async () => {
    const res = await request(app).get('/api/billing/checkout/config').set('x-vercel-ip-country', 'TR');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      configuredProvider: 'polar',
      provider: 'polar',
      mode: 'test',
      enabled: true,
      checkoutSurface: 'overlay',
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    }));
    expect(res.body.pricing.regional).toEqual(expect.objectContaining({
      countryCode: 'TR',
      multiplier: 0.5,
      prices: { monthly: 1200, quarterly: 2450, annual: 4950, lifetime: 8950 },
    }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a plan without a product id is unavailable and the regional block is withheld', async () => {
    process.env.POLAR_ANNUAL_PRODUCT_ID_TEST = '';
    const res = await request(app).get('/api/billing/checkout/config').set('x-vercel-ip-country', 'TR');
    expect(res.body.plans).toEqual({ monthly: true, quarterly: true, annual: false, lifetime: true });
    expect(res.body.enabled).toBe(true);
    expect(res.body.pricing.regional).toEqual(expect.objectContaining({ countryCode: 'TR' }));

    process.env.POLAR_ACCESS_TOKEN_TEST = '';
    const off = await request(app).get('/api/billing/checkout/config');
    expect(off.body.enabled).toBe(false);
    expect(off.body.plans).toEqual({ monthly: false, quarterly: false, annual: false, lifetime: false });
  });
});

describe('Polar checkout start', () => {
  test('creates a session per attempt with our user id, metadata, return urls and the embed origin', async () => {
    const user = await seedUser();
    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-forwarded-for', '203.0.113.9, 10.0.0.1')
      .send({ planId: 'monthly', analyticsSource: 'pricing', analyticsSessionId: 'sess_1', checkoutSurface: 'overlay' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      provider: 'polar',
      planId: 'monthly',
      mode: 'test',
      checkoutUrl: 'https://sandbox.polar.sh/checkout/polar_c_1',
      checkoutSurface: 'overlay',
      reused: false,
    }));
    expect(res.body.pricing).toEqual(expect.objectContaining({ reason: null, amountCents: 2400 }));
    expect(res.body.successUrl).toBe(`http://localhost:4200/billing/success?attempt=${res.body.attemptId}`);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [apiUrl, init] = global.fetch.mock.calls[0];
    expect(apiUrl).toBe('https://sandbox-api.polar.sh/v1/checkouts/');
    expect(init.headers.Authorization).toBe('Bearer polar_oat_sandbox');
    const body = JSON.parse(init.body);
    expect(body).toEqual(expect.objectContaining({
      products: [PRODUCT_IDS.monthly],
      external_customer_id: String(user._id),
      customer_email: user.email,
      customer_name: user.username,
      success_url: res.body.successUrl,
      return_url: res.body.cancelUrl,
      embed_origin: 'http://localhost:4200',
      allow_discount_codes: false,
      customer_ip_address: '203.0.113.9',
    }));
    expect(body.prices).toBeUndefined();
    expect(body.discount_id).toBeUndefined();
    expect(body.metadata).toEqual({
      fa_user_id: String(user._id),
      fa_checkout_attempt_id: res.body.attemptId,
      fa_analytics_session_id: 'sess_1',
      fa_offer_version: 'pricing_baseline_v1',
      fa_checkout_surface: 'overlay',
      fa_frontend_origin: 'http://localhost:4200',
    });

    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({
      provider: 'polar',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      providerCheckoutId: 'c0ffee00-0000-4000-8000-000000000001',
      checkoutUrl: 'https://sandbox.polar.sh/checkout/polar_c_1',
      priceReason: null,
      customerUserId: String(user._id),
    }));
  });

  test('charges the regional price through an ad-hoc fixed price and records it on the attempt', async () => {
    const user = await seedUser();
    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-vercel-ip-country', 'TR')
      .send({ planId: 'quarterly' });

    expect(res.status).toBe(200);
    expect(res.body.pricing).toEqual(expect.objectContaining({ reason: 'regional', multiplier: 0.5, listAmountCents: 4900, amountCents: 2450, countryCode: 'TR' }));
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.prices).toEqual({ [PRODUCT_IDS.quarterly]: [{ amount_type: 'fixed', price_amount: 2450, price_currency: 'usd' }] });
    expect(body.metadata.fa_price_reason).toBe('regional');
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({ priceReason: 'regional', priceMultiplier: 0.5, priceListCents: 4900, priceChargedCents: 2450, countryCode: 'TR' }));
  });

  test('an allowlisted campaign applies its discount id and wins over the regional price', async () => {
    const user = await seedUser();
    const res = await request(app)
      .post('/api/billing/checkout/start')
      .set('Authorization', authHeader(user._id))
      .set('x-vercel-ip-country', 'TR')
      .send({ planId: 'annual', campaignId: 'partner_polar', analyticsSource: 'partner_polar' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ campaignId: 'partner_polar', providerDiscountId: '4232bc9e-61a2-43f9-bfe7-d5ca2bec623b' }));
    expect(res.body.pricing.reason).toBeNull();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.discount_id).toBe('4232bc9e-61a2-43f9-bfe7-d5ca2bec623b');
    expect(body.prices).toBeUndefined();
    expect(body.metadata).toEqual(expect.objectContaining({ fa_campaign_id: 'partner_polar', fa_provider_discount_id: '4232bc9e-61a2-43f9-bfe7-d5ca2bec623b' }));
    const attempt = await CheckoutAttempt.findOne({ attemptId: res.body.attemptId }).lean();
    expect(attempt).toEqual(expect.objectContaining({ campaignId: 'partner_polar', priceReason: null, priceChargedCents: null }));
  });

  test('reuses a recent attempt instead of opening a second session', async () => {
    const user = await seedUser();
    const first = await request(app).post('/api/billing/checkout/start').set('Authorization', authHeader(user._id)).send({ planId: 'monthly' });
    const second = await request(app).post('/api/billing/checkout/start').set('Authorization', authHeader(user._id)).send({ planId: 'monthly' });
    expect(second.status).toBe(200);
    expect(second.body.reused).toBe(true);
    expect(second.body.attemptId).toBe(first.body.attemptId);
    expect(second.body.checkoutUrl).toBe(first.body.checkoutUrl);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('refuses a plan without a product id before calling Polar', async () => {
    process.env.POLAR_LIFETIME_PRODUCT_ID_TEST = '';
    const user = await seedUser();
    const res = await request(app).post('/api/billing/checkout/start').set('Authorization', authHeader(user._id)).send({ planId: 'lifetime' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CHECKOUT_UNAVAILABLE');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(await CheckoutAttempt.countDocuments({})).toBe(0);
  });

  test('fails closed when Polar cannot create the session, so no attempt and no foreign URL leak out', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const user = await seedUser();
    const res = await request(app).post('/api/billing/checkout/start').set('Authorization', authHeader(user._id)).send({ planId: 'monthly' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('CHECKOUT_CREATE_FAILED');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(await CheckoutAttempt.countDocuments({})).toBe(0);

    global.fetch = jest.fn(async () => ({ ok: true, status: 201, json: async () => ({ id: 'x', url: 'https://evil.example/checkout/abc', status: 'open', amount: 2400 }) }));
    const foreign = await request(app).post('/api/billing/checkout/start').set('Authorization', authHeader(user._id)).send({ planId: 'monthly' });
    expect(foreign.status).toBe(503);
    expect(await CheckoutAttempt.countDocuments({})).toBe(0);
  });
});
