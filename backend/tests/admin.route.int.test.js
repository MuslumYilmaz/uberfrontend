'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
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

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  delete process.env.EXPECTED_MONGO_DB_NAME_TEST;
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
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
