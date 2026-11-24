/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

const ORIGINAL_FETCH = global.fetch;
const JWT_SECRET = 'test_jwt_secret_for_polar_manage_url';
const PORTAL_URL = 'https://sandbox.polar.sh/frontendatlas/portal?customer_session_token=polar_mst_x&email=manage%40example.com';

let app;
let User;
let connectToMongo;
let disconnectMongo;
let mongoServer;

function authHeader(userId) {
  return `Bearer ${jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' })}`;
}

async function seedUser(providers) {
  return User.create({
    email: 'manage@example.com',
    username: 'manage_user',
    passwordHash: 'hash',
    accessTier: 'premium',
    entitlements: { pro: { status: 'active', validUntil: null }, projects: { status: 'none', validUntil: null } },
    billing: { pro: { status: 'active' }, projects: { status: 'none' }, providers },
  });
}

function mockPolarSession() {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ customer_portal_url: PORTAL_URL, expires_at: '2026-11-23T09:07:41Z', customer_id: 'd63e5340-24d6-4619-881d-4b3e4575b5d5', token: 'polar_mst_x' }),
  }));
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.BILLING_PROVIDER = 'polar';
  process.env.PAYMENTS_MODE = 'test';
  process.env.POLAR_ACCESS_TOKEN_TEST = 'polar_oat_sandbox';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
  global.fetch = ORIGINAL_FETCH;
});

beforeEach(async () => {
  process.env.BILLING_PROVIDER = 'polar';
  process.env.PAYMENTS_MODE = 'test';
  process.env.POLAR_ACCESS_TOKEN_TEST = 'polar_oat_sandbox';
  process.env.LEMONSQUEEZY_API_KEY = 'ls_api_test';
  mockPolarSession();
  await User.deleteMany({});
});

describe('Polar manage-url route', () => {
  test('creates a fresh customer session for our user id and stores nothing', async () => {
    const user = await seedUser({ polar: { customerId: 'd63e5340-24d6-4619-881d-4b3e4575b5d5', subscriptionId: 'sub-1' } });
    const res = await request(app).get('/api/billing/manage-url').set('Authorization', authHeader(user._id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: PORTAL_URL });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://sandbox-api.polar.sh/v1/customer-sessions/');
    expect(init.headers.Authorization).toBe('Bearer polar_oat_sandbox');
    expect(JSON.parse(init.body)).toEqual({ external_customer_id: String(user._id) });
    const stored = await User.findById(user._id).lean();
    expect(stored.billing.providers.polar.manageUrl).toBeUndefined();
  });

  test('answers not-ready before the first confirmed purchase and unavailable without a token', async () => {
    const user = await seedUser({ polar: {} });
    global.fetch = jest.fn(async () => ({ ok: false, status: 422, json: async () => ({ detail: [{ msg: 'Customer does not exist.' }] }) }));
    const notReady = await request(app).get('/api/billing/manage-url').set('Authorization', authHeader(user._id));
    expect(notReady.status).toBe(409);
    expect(notReady.body.code).toBe('MANAGE_URL_NOT_READY');

    process.env.POLAR_ACCESS_TOKEN_TEST = '';
    const unavailable = await request(app).get('/api/billing/manage-url').set('Authorization', authHeader(user._id));
    expect(unavailable.status).toBe(409);
    expect(unavailable.body.code).toBe('MANAGE_URL_UNAVAILABLE');
  });

  test('an account with Lemon Squeezy and Polar metadata uses the provider of the latest event', async () => {
    const polarNewer = await seedUser({
      lemonsqueezy: { customerId: 'cust_ls', subscriptionId: 'sub_ls', lastEventAt: new Date('2026-07-27T00:00:00Z') },
      polar: { customerId: 'cust_polar', subscriptionId: 'sub_polar', lastEventAt: new Date('2026-12-01T00:00:00Z') },
    });
    const viaPolar = await request(app).get('/api/billing/manage-url').set('Authorization', authHeader(polarNewer._id));
    expect(viaPolar.status).toBe(200);
    expect(global.fetch.mock.calls[0][0]).toBe('https://sandbox-api.polar.sh/v1/customer-sessions/');

    await User.deleteMany({});
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: { attributes: { urls: { customer_portal: 'https://example.com/ls-portal' } } } }) }));
    const lsNewer = await seedUser({
      lemonsqueezy: { customerId: 'cust_ls', subscriptionId: 'sub_ls', lastEventAt: new Date('2026-12-01T00:00:00Z') },
      polar: { customerId: 'cust_polar', subscriptionId: 'sub_polar', lastEventAt: new Date('2026-07-27T00:00:00Z') },
    });
    const viaLs = await request(app).get('/api/billing/manage-url').set('Authorization', authHeader(lsNewer._id));
    expect(viaLs.status).toBe(200);
    expect(viaLs.body.url).toBe('https://example.com/ls-portal');
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.lemonsqueezy.com/v1/subscriptions/sub_ls');
  });
});
