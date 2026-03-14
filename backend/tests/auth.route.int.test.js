'use strict';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let AuthSession;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_auth_route';

function getSetCookies(res) {
  return Array.isArray(res.headers?.['set-cookie']) ? res.headers['set-cookie'] : [];
}

function cookieLineFromResponse(res, name) {
  return getSetCookies(res).find((cookie) => cookie.startsWith(`${name}=`)) || null;
}

function cookieValueFromResponse(res, name) {
  const cookie = cookieLineFromResponse(res, name);
  if (!cookie) return null;
  return cookie.split(';')[0].slice(name.length + 1);
}

function authCookieValueFromResponse(res) {
  return cookieValueFromResponse(res, 'access_token');
}

function refreshCookieValueFromResponse(res) {
  return cookieValueFromResponse(res, 'refresh_token');
}

function expectAuthCookieSet(res) {
  expect(getSetCookies(res).some((cookie) => cookie.startsWith('access_token='))).toBe(true);
}

function expectRefreshCookieSet(res) {
  expect(getSetCookies(res).some((cookie) => cookie.startsWith('refresh_token='))).toBe(true);
}

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
  AuthSession = require('../models/AuthSession');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    AuthSession.deleteMany({}),
  ]);
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

  test('signup establishes cookie session and /me resolves the signed-in user', async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .send({
        email: 'session@example.com',
        username: 'session_user',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);
    expectAuthCookieSet(signup);
    expectRefreshCookieSet(signup);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body?.email).toBe('session@example.com');
    expect(me.body?.username).toBe('session_user');
  });

  test('refresh issues a fresh access session from a valid refresh cookie', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'refresh@example.com',
        username: 'refresh_user',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);
    const refreshCookie = refreshCookieValueFromResponse(signup);
    expect(refreshCookie).toBeTruthy();

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshCookie}`]);

    expect(refresh.status).toBe(200);
    expect(refresh.body?.ok).toBe(true);
    expectAuthCookieSet(refresh);
    expectRefreshCookieSet(refresh);

    const accessCookie = authCookieValueFromResponse(refresh);
    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`access_token=${accessCookie}`]);

    expect(me.status).toBe(200);
    expect(me.body?.email).toBe('refresh@example.com');
  });

  test('logout clears cookie session and /me returns 401 afterwards', async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .send({
        email: 'logout@example.com',
        username: 'logout_user',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);
    const oldAccessToken = signup.body?.token;
    expect(typeof oldAccessToken).toBe('string');

    const logout = await agent.post('/api/auth/logout').send({});
    expect(logout.status).toBe(200);
    expect(authCookieValueFromResponse(logout)).toBe('');
    expect(refreshCookieValueFromResponse(logout)).toBe('');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
    expect(me.body?.error).toBe('Missing token');

    const staleBearer = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldAccessToken}`);
    expect(staleBearer.status).toBe(401);
    expect(staleBearer.body?.error).toBe('Invalid or expired token');
  });

  test('change-password rejects invalid current password and keeps the existing session usable', async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .send({
        email: 'password-invalid@example.com',
        username: 'password_invalid_user',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);

    const change = await agent
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'wrongpass123',
        currentPasswordConfirm: 'wrongpass123',
        newPassword: 'newpass456',
      });

    expect(change.status).toBe(401);
    expect(change.body?.error).toBe('Invalid current password');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body?.email).toBe('password-invalid@example.com');
  });

  test('change-password rotates the current session, invalidates the old token, and requires the new password afterwards', async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .send({
        email: 'password-rotate@example.com',
        username: 'password_rotate_user',
        password: 'secret123',
      });

    expect(signup.status).toBe(201);
    expect(typeof signup.body?.token).toBe('string');
    const oldToken = signup.body.token;
    const oldRefreshCookie = refreshCookieValueFromResponse(signup);
    expect(oldRefreshCookie).toBeTruthy();

    const change = await agent
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'secret123',
        currentPasswordConfirm: 'secret123',
        newPassword: 'newpass456',
      });

    expect(change.status).toBe(200);
    expect(change.body).toEqual({ ok: true });
    expectAuthCookieSet(change);
    expect(authCookieValueFromResponse(change)).not.toBe(encodeURIComponent(oldToken));

    const meWithRotatedSession = await agent.get('/api/auth/me');
    expect(meWithRotatedSession.status).toBe(200);
    expect(meWithRotatedSession.body?.email).toBe('password-rotate@example.com');

    const staleTokenMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(staleTokenMe.status).toBe(401);
    expect(staleTokenMe.body?.error).toBe('Invalid or expired token');

    const staleRefresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${oldRefreshCookie}`]);
    expect(staleRefresh.status).toBe(401);
    expect(staleRefresh.body?.error).toBe('Invalid or expired refresh session');

    const oldPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: 'password-rotate@example.com',
        password: 'secret123',
      });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: 'password-rotate@example.com',
        password: 'newpass456',
      });
    expect(newPasswordLogin.status).toBe(200);
    expectAuthCookieSet(newPasswordLogin);
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
