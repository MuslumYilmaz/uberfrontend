/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const ORIGINAL_BILLING_PROVIDER = process.env.BILLING_PROVIDER;

let app;
let User;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_for_manage_url';

async function seedUser(overrides = {}) {
  return User.create({
    email: 'manage@example.com',
    username: 'manage_user',
    passwordHash: 'hash',
    accessTier: 'premium',
    entitlements: {
      pro: { status: 'active', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
    billing: {
      pro: { status: 'active' },
      projects: { status: 'none' },
      providers: {
        lemonsqueezy: {
          customerId: 'cust_123',
          subscriptionId: 'sub_123',
        },
      },
    },
    ...overrides,
  });
}

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function mockLemonSqueezyFetch(url) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      data: {
        attributes: {
          urls: {
            customer_portal: url,
          },
        },
      },
    }),
  }));
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.BILLING_PROVIDER = 'lemonsqueezy';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) {
    await disconnectMongo();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  global.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_API_KEY === undefined) {
    delete process.env.LEMONSQUEEZY_API_KEY;
  } else {
    process.env.LEMONSQUEEZY_API_KEY = ORIGINAL_API_KEY;
  }
  if (ORIGINAL_BILLING_PROVIDER === undefined) {
    delete process.env.BILLING_PROVIDER;
  } else {
    process.env.BILLING_PROVIDER = ORIGINAL_BILLING_PROVIDER;
  }
});

beforeEach(async () => {
  process.env.BILLING_PROVIDER = 'lemonsqueezy';
  process.env.LEMONSQUEEZY_API_KEY = 'ls_api_test';
  mockLemonSqueezyFetch('https://example.com/fresh-manage');
  await User.deleteMany({});
});

describe('LemonSqueezy manage-url route', () => {
  test('fetches a fresh manage URL instead of returning the stored URL', async () => {
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/fresh-manage');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.lemonsqueezy.com/v1/subscriptions/sub_123');
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer ls_api_test');

    const updated = await User.findById(user._id).lean();
    expect(updated.billing.providers.lemonsqueezy.manageUrl).toBe('https://example.com/fresh-manage');
  });

  test('fetches a fresh manage URL from stored LemonSqueezy metadata even if BILLING_PROVIDER is not set', async () => {
    process.env.BILLING_PROVIDER = '';
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/fresh-manage');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns 409 when API key is missing even if a stored manage URL exists', async () => {
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });
    delete process.env.LEMONSQUEEZY_API_KEY;

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('MANAGE_URL_UNAVAILABLE');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns 400 with a stable code when provider does not support self-serve manage URLs', async () => {
    const user = await seedUser({
      accessTier: 'free',
      entitlements: {
        pro: { status: 'none', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
      billing: {
        pro: { status: 'none' },
        projects: { status: 'none' },
        providers: {},
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url?provider=gumroad')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MANAGE_PROVIDER_UNSUPPORTED');
  });

  test('returns 409 with a stable code when the account has no billing portal metadata yet', async () => {
    const user = await seedUser({
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {},
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('MANAGE_URL_NOT_READY');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns 409 unavailable when only an old stored manage URL exists', async () => {
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('MANAGE_URL_UNAVAILABLE');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('falls back to customer API when subscription API does not return a manage URL', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            attributes: {
              urls: {},
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            attributes: {
              urls: {
                customer_portal: 'https://example.com/customer-fresh-manage',
              },
            },
          },
        }),
      });
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_missing_url',
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/customer-fresh-manage');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.lemonsqueezy.com/v1/subscriptions/sub_missing_url');
    expect(global.fetch.mock.calls[1][0]).toBe('https://api.lemonsqueezy.com/v1/customers/cust_123');
  });

  test('returns 409 when LemonSqueezy API cannot return a manage URL', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/stale-manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('MANAGE_URL_UNAVAILABLE');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
