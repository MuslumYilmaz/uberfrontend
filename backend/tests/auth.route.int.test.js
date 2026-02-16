'use strict';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_auth_route';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.GITHUB_CLIENT_ID = 'test_gh_client_id';
  process.env.GITHUB_CLIENT_SECRET = 'test_gh_client_secret';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/signup and /api/auth/login', () => {
  test('signup normalizes email/username and login accepts trimmed case-insensitive email', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        email: '  USER@Example.COM  ',
        username: '  test_user  ',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);
    expect(signup.body?.user?.email).toBe('user@example.com');
    expect(signup.body?.user?.username).toBe('test_user');

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: '  USER@EXAMPLE.COM  ',
        password: 'secret123',
      });

    expect(login.status).toBe(200);
    expect(login.body?.user?.email).toBe('user@example.com');
  });

  test('login accepts trimmed username', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'trim-user@example.com',
        username: 'trim_user',
        password: 'secret123',
      });
    expect(signup.status).toBe(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: '   trim_user   ',
        password: 'secret123',
      });

    expect(login.status).toBe(200);
    expect(login.body?.user?.username).toBe('trim_user');
  });

  test('concurrent signup race returns conflict instead of 500', async () => {
    const payload = {
      email: 'race@example.com',
      username: 'race_user',
      password: 'secret123',
    };

    const [first, second] = await Promise.all([
      request(app).post('/api/auth/signup').send(payload),
      request(app).post('/api/auth/signup').send(payload),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const conflict = first.status === 409 ? first : second;
    expect(conflict.body?.error).toBe('Email or username already in use');
    const duplicateFields = conflict.body?.fields || {};
    expect(Boolean(duplicateFields.email || duplicateFields.username)).toBe(true);

    const totalUsers = await User.countDocuments({});
    expect(totalUsers).toBe(1);
  });

  test('duplicate signup by normalized email returns 409 with email field', async () => {
    const first = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'duplicate@example.com',
        username: 'dup_user_1',
        password: 'secret123',
      });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/auth/signup')
      .send({
        email: '  DUPLICATE@EXAMPLE.COM ',
        username: 'dup_user_2',
        password: 'secret123',
      });

    expect(second.status).toBe(409);
    expect(second.body?.fields?.email).toBe(true);
  });
});

describe('OAuth callbacks', () => {
  test('github oauth resolves username collisions instead of failing with server error', async () => {
    await User.create({
      email: 'existing@example.com',
      username: 'taken_name',
      passwordHash: 'hash',
    });

    const agent = request.agent(app);
    const start = await agent
      .get('/api/auth/oauth/github/start')
      .query({ redirect_uri: 'http://localhost:4200/auth/callback' });

    expect(start.status).toBe(302);
    const startLocation = start.headers?.location;
    expect(typeof startLocation).toBe('string');
    const state = new URL(startLocation).searchParams.get('state');
    expect(state).toBeTruthy();

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (url) => {
      const target = String(url || '');
      if (target.includes('github.com/login/oauth/access_token')) {
        return { json: async () => ({ access_token: 'test-gh-token' }) };
      }
      if (target.includes('api.github.com/user')) {
        return {
          json: async () => ({
            id: 123456,
            login: 'taken_name',
            name: 'taken_name',
            email: 'new-oauth-user@example.com',
            avatar_url: 'https://avatars.test/user.png',
          }),
        };
      }
      throw new Error(`Unexpected fetch url: ${target}`);
    });

    try {
      const callback = await agent
        .get('/api/auth/oauth/github/callback')
        .query({ code: 'oauth-code', state });

      expect(callback.status).toBe(302);
      expect(String(callback.headers?.location || '')).toContain('/auth/callback');

      const oauthUser = await User.findOne({ email: 'new-oauth-user@example.com' }).lean();
      expect(oauthUser).toBeTruthy();
      expect(oauthUser?.username).not.toBe('taken_name');
      expect(String(oauthUser?.username || '')).toMatch(/^taken_name_/);
      expect(await User.countDocuments({})).toBe(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
