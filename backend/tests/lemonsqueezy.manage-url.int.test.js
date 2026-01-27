/**
 * Run: npm test
 * Requires mongodb-memory-server; no local Mongo needed.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.BILLING_PROVIDER = 'lemonsqueezy';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');

  await connectToMongo(process.env.MONGO_URL);
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
});

describe('LemonSqueezy manage-url route', () => {
  test('returns stored manage URL', async () => {
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/manage');
  });

  test('returns stored manage URL even if BILLING_PROVIDER is not set', async () => {
    const prevProvider = process.env.BILLING_PROVIDER;
    process.env.BILLING_PROVIDER = '';
    const user = await seedUser({
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_123',
            subscriptionId: 'sub_123',
            manageUrl: 'https://example.com/manage',
          },
        },
      },
    });

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/manage');

    process.env.BILLING_PROVIDER = prevProvider;
  });

  test('returns 409 when manage URL missing and no API key', async () => {
    const user = await seedUser();
    delete process.env.LEMONSQUEEZY_API_KEY;

    const res = await request(app)
      .get('/api/billing/manage-url')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(409);
  });
});
