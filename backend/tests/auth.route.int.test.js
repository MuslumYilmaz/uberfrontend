'use strict';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let AuthSession;
let AuthAttemptReceipt;
let OAuth2Client;
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
  process.env.GOOGLE_CLIENT_ID = 'test_google_client_id';
  process.env.GOOGLE_CLIENT_SECRET = 'test_google_client_secret';
  process.env.GITHUB_CLIENT_ID = 'test_gh_client_id';
  process.env.GITHUB_CLIENT_SECRET = 'test_gh_client_secret';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  AuthSession = require('../models/AuthSession');
  AuthAttemptReceipt = require('../models/AuthAttemptReceipt');
  ({ OAuth2Client } = require('google-auth-library'));

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
    AuthAttemptReceipt.deleteMany({}),
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

  test('duplicate signup request with the same auth request id replays success without creating a second session', async () => {
    const headers = {
      'x-auth-context-id': 'ctx-signup-1',
      'x-auth-request-id': 'req-signup-1',
    };
    const payload = {
      email: 'dedupe-signup@example.com',
      username: 'dedupe_signup_user',
      password: 'secret123',
    };

    const [first, second] = await Promise.all([
      request(app).post('/api/auth/signup').set(headers).send(payload),
      request(app).post('/api/auth/signup').set(headers).send(payload),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body?.user?.email).toBe('dedupe-signup@example.com');
    expect(second.body?.user?.email).toBe('dedupe-signup@example.com');

    expect(await User.countDocuments({ email: 'dedupe-signup@example.com' })).toBe(1);
    expect(await AuthSession.countDocuments({})).toBe(1);
    expect(await AuthAttemptReceipt.countDocuments({ action: 'signup' })).toBe(1);
    expect(refreshCookieValueFromResponse(first)).toBe(refreshCookieValueFromResponse(second));
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

  test('duplicate login request with the same auth request id replays success without creating a second session', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'dedupe-login@example.com',
        username: 'dedupe_login_user',
        password: 'secret123',
      });
    expect(signup.status).toBe(201);
    await AuthSession.deleteMany({});
    await AuthAttemptReceipt.deleteMany({});

    const headers = {
      'x-auth-context-id': 'ctx-login-1',
      'x-auth-request-id': 'req-login-1',
    };
    const payload = {
      emailOrUsername: 'dedupe-login@example.com',
      password: 'secret123',
    };

    const [first, second] = await Promise.all([
      request(app).post('/api/auth/login').set(headers).send(payload),
      request(app).post('/api/auth/login').set(headers).send(payload),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body?.user?.email).toBe('dedupe-login@example.com');
    expect(second.body?.user?.email).toBe('dedupe-login@example.com');
    expect(await AuthSession.countDocuments({})).toBe(1);
    expect(await AuthAttemptReceipt.countDocuments({ action: 'login' })).toBe(1);
    expect(refreshCookieValueFromResponse(first)).toBe(refreshCookieValueFromResponse(second));
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
    expect(me.body?.code).toBe('AUTH_MISSING');

    const staleBearer = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldAccessToken}`);
    expect(staleBearer.status).toBe(401);
    expect(staleBearer.body?.error).toBe('Invalid or expired token');
    expect(staleBearer.body?.code).toBe('AUTH_INVALID');
  });

  test('logout revokes sessions on other devices for the same user', async () => {
    const primary = request.agent(app);
    const secondary = request.agent(app);

    const signup = await primary
      .post('/api/auth/signup')
      .send({
        email: 'logout-all@example.com',
        username: 'logout_all_user',
        password: 'secret123',
      });
    expect(signup.status).toBe(201);

    const secondLogin = await secondary
      .post('/api/auth/login')
      .send({
        emailOrUsername: 'logout-all@example.com',
        password: 'secret123',
      });
    expect(secondLogin.status).toBe(200);

    expect(await AuthSession.countDocuments({ revokedAt: null })).toBe(2);

    const logout = await primary.post('/api/auth/logout').send({});
    expect(logout.status).toBe(200);

    expect(await AuthSession.countDocuments({ revokedAt: null })).toBe(0);

    const meOnOtherDevice = await secondary.get('/api/auth/me');
    expect(meOnOtherDevice.status).toBe(401);
    expect(meOnOtherDevice.body?.code).toBe('AUTH_INVALID');

    const refreshCookie = refreshCookieValueFromResponse(secondLogin);
    expect(refreshCookie).toBeTruthy();
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshCookie}`]);
    expect(refresh.status).toBe(401);
    expect(refresh.body?.code).toBe('REFRESH_INVALID');
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
    expect(staleTokenMe.body?.code).toBe('AUTH_INVALID');

    const staleRefresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${oldRefreshCookie}`]);
    expect(staleRefresh.status).toBe(401);
    expect(staleRefresh.body?.error).toBe('Invalid or expired refresh session');
    expect(staleRefresh.body?.code).toBe('REFRESH_INVALID');

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

  test('refresh without a cookie returns a stable missing-refresh auth code', async () => {
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(refresh.status).toBe(401);
    expect(refresh.body?.error).toBe('Missing refresh token');
    expect(refresh.body?.code).toBe('REFRESH_MISSING');
  });

  test('login is rate-limited after too many repeated attempts for the same identifier', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'rate-limit-login@example.com',
        username: 'rate_limit_login',
        password: 'secret123',
      });

    let lastResponse;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      lastResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'rate-limit-login@example.com',
          password: 'wrong-password',
        });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body?.code).toBe('AUTH_RATE_LIMITED');
    expect(lastResponse.body?.error).toBe('Too many sign-in attempts. Please wait and try again.');
    expect(lastResponse.headers['retry-after']).toBeTruthy();
  });

});

describe('OAuth callbacks', () => {
  test('google oauth links to an existing verified-email account instead of creating a duplicate', async () => {
    const existing = await User.create({
      email: 'google-linked@example.com',
      username: 'google_linked_user',
      passwordHash: 'hash',
    });

    const agent = request.agent(app);
    const start = await agent
      .get('/api/auth/oauth/google/start')
      .query({ redirect_uri: 'http://localhost:4200/auth/callback' });

    expect(start.status).toBe(302);
    const startLocation = start.headers?.location;
    const state = new URL(startLocation).searchParams.get('state');
    expect(state).toBeTruthy();

    const getTokenSpy = jest
      .spyOn(OAuth2Client.prototype, 'getToken')
      .mockResolvedValue({ tokens: { id_token: 'google-id-token' } });
    const verifySpy = jest
      .spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockResolvedValue({
        getPayload: () => ({
          email: 'google-linked@example.com',
          name: 'Google Linked User',
          picture: 'https://avatars.test/google.png',
          sub: 'google-provider-123',
        }),
      });

    try {
      const callback = await agent
        .get('/api/auth/oauth/google/callback')
        .query({ code: 'oauth-code', state });

      expect(callback.status).toBe(302);
      expect(String(callback.headers?.location || '')).toContain('/auth/callback');

      const linked = await User.findById(existing._id).lean();
      expect(linked).toBeTruthy();
      expect(linked?.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'google', providerId: 'google-provider-123' }),
        ])
      );
      expect(await User.countDocuments({})).toBe(1);
    } finally {
      getTokenSpy.mockRestore();
      verifySpy.mockRestore();
    }
  });

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
      if (target.includes('api.github.com/user/emails')) {
        return {
          json: async () => ([
            { email: 'new-oauth-user@example.com', primary: true, verified: true, visibility: 'private' },
          ]),
        };
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

  test('github oauth does not auto-merge on an unverified public email match', async () => {
    await User.create({
      email: 'public-match@example.com',
      username: 'existing_public_match',
      passwordHash: 'hash',
    });

    const agent = request.agent(app);
    const start = await agent
      .get('/api/auth/oauth/github/start')
      .query({ redirect_uri: 'http://localhost:4200/auth/callback' });

    expect(start.status).toBe(302);
    const state = new URL(start.headers?.location).searchParams.get('state');
    expect(state).toBeTruthy();

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (url) => {
      const target = String(url || '');
      if (target.includes('github.com/login/oauth/access_token')) {
        return { json: async () => ({ access_token: 'test-gh-token' }) };
      }
      if (target.includes('api.github.com/user/emails')) {
        return { json: async () => [] };
      }
      if (target.includes('api.github.com/user')) {
        return {
          json: async () => ({
            id: 987654,
            login: 'public_match_user',
            name: 'Public Match User',
            email: 'public-match@example.com',
            avatar_url: 'https://avatars.test/public-match.png',
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
      const created = await User.findOne({ email: '987654+public_match_user@users.noreply.github.com' }).lean();
      expect(created).toBeTruthy();
      expect(created?.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'github', providerId: '987654' }),
        ])
      );
      expect(await User.countDocuments({})).toBe(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('github oauth links to the currently signed-in account instead of creating a duplicate account', async () => {
    const agent = request.agent(app);
    const signup = await agent
      .post('/api/auth/signup')
      .send({
        email: 'current-user@example.com',
        username: 'current_user',
        password: 'secret123',
      });
    expect(signup.status).toBe(201);

    const start = await agent
      .get('/api/auth/oauth/github/start')
      .query({ redirect_uri: 'http://localhost:4200/auth/callback' });
    expect(start.status).toBe(302);
    const state = new URL(start.headers?.location).searchParams.get('state');
    expect(state).toBeTruthy();

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (url) => {
      const target = String(url || '');
      if (target.includes('github.com/login/oauth/access_token')) {
        return { json: async () => ({ access_token: 'test-gh-token' }) };
      }
      if (target.includes('api.github.com/user/emails')) {
        return { json: async () => [] };
      }
      if (target.includes('api.github.com/user')) {
        return {
          json: async () => ({
            id: 24680,
            login: 'linked_current_user',
            name: 'Linked Current User',
            email: 'different-email@example.com',
            avatar_url: 'https://avatars.test/linked-current.png',
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
      const current = await User.findOne({ email: 'current-user@example.com' }).lean();
      expect(current).toBeTruthy();
      expect(current?.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'github', providerId: '24680' }),
        ])
      );
      expect(await User.countDocuments({})).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('oauth start is rate-limited after repeated attempts from the same client', async () => {
    let lastResponse;
    for (let attempt = 0; attempt < 21; attempt += 1) {
      lastResponse = await request(app)
        .get('/api/auth/oauth/google/start')
        .query({ redirect_uri: 'http://localhost:4200/auth/callback' });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body?.code).toBe('AUTH_RATE_LIMITED');
    expect(lastResponse.body?.error).toBe('Too many OAuth attempts. Please wait and try again.');
  });
});
