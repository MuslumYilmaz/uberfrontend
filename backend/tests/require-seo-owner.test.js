'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const { requireSeoOwner } = require('../middleware/RequireSeoOwner');

const OWNER_ID = '507f1f77bcf86cd799439011';
const OTHER_ADMIN_ID = '507f1f77bcf86cd799439012';
const OWNER_EMAIL = 'mslmyilmaz34@gmail.com';

function mockReloadedUser(user) {
  const lean = jest.fn().mockResolvedValue(user);
  const select = jest.fn().mockReturnValue({ lean });
  User.findById.mockReturnValue({ select });
  return { select, lean };
}

function createApp(auth) {
  const app = express();
  app.get(
    '/seo',
    (req, _res, next) => {
      req.auth = auth;
      next();
    },
    requireSeoOwner,
    (req, res) => res.json({ ok: true, owner: req.seoOwner })
  );
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'Internal server error' }));
  return app;
}

function expectPrivateSeoHeaders(response) {
  expect(response.headers['cache-control']).toBe('private, no-store, max-age=0');
  expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
}

describe('requireSeoOwner', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SEO_DASHBOARD_ENABLED = 'true';
    process.env.SEO_OWNER_USER_ID = OWNER_ID;
    process.env.SEO_OWNER_EMAIL = `  ${OWNER_EMAIL.toUpperCase()}  `;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('allows only the exact freshly loaded verified admin owner', async () => {
    const query = mockReloadedUser({
      _id: OWNER_ID,
      email: OWNER_EMAIL,
      emailVerifiedAt: new Date(),
      role: 'admin',
    });

    const response = await request(createApp({ userId: OWNER_ID, role: 'user' })).get('/seo');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      owner: { userId: OWNER_ID, email: OWNER_EMAIL },
    });
    expectPrivateSeoHeaders(response);
    expect(User.findById).toHaveBeenCalledWith(OWNER_ID);
    expect(query.select).toHaveBeenCalledWith('_id email emailVerifiedAt role');
  });

  test('reloads and rejects a different authenticated admin', async () => {
    mockReloadedUser({
      _id: OTHER_ADMIN_ID,
      email: 'other-admin@example.com',
      emailVerifiedAt: new Date(),
      role: 'admin',
    });

    const response = await request(createApp({ userId: OTHER_ADMIN_ID, role: 'admin' })).get('/seo');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expectPrivateSeoHeaders(response);
    expect(User.findById).toHaveBeenCalledWith(OTHER_ADMIN_ID);
  });

  test('rejects a missing or malformed authenticated user id without querying Mongo', async () => {
    const response = await request(createApp({ userId: 'not-an-object-id', role: 'admin' })).get('/seo');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expectPrivateSeoHeaders(response);
    expect(User.findById).not.toHaveBeenCalled();
  });

  test.each([
    ['configured email does not match', { email: 'wrong@example.com', emailVerifiedAt: new Date(), role: 'admin' }],
    ['email is unverified', { email: OWNER_EMAIL, emailVerifiedAt: null, role: 'admin' }],
    ['freshly loaded role is not admin', { email: OWNER_EMAIL, emailVerifiedAt: new Date(), role: 'user' }],
  ])('rejects when %s', async (_label, overrides) => {
    mockReloadedUser({ _id: OWNER_ID, ...overrides });

    const response = await request(createApp({ userId: OWNER_ID, role: 'admin' })).get('/seo');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expectPrivateSeoHeaders(response);
  });

  test('keeps private SEO headers when the authorization lookup fails', async () => {
    User.findById.mockImplementation(() => {
      throw new Error('database unavailable');
    });

    const response = await request(createApp({ userId: OWNER_ID, role: 'admin' })).get('/seo');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
    expectPrivateSeoHeaders(response);
  });

  test('hides the feature and skips the database when it is disabled', async () => {
    process.env.SEO_DASHBOARD_ENABLED = 'false';

    const response = await request(createApp({ userId: OWNER_ID, role: 'admin' })).get('/seo');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
    expectPrivateSeoHeaders(response);
    expect(User.findById).not.toHaveBeenCalled();
  });

  test.each([
    ['SEO_OWNER_USER_ID', ''],
    ['SEO_OWNER_USER_ID', 'not-a-mongo-id'],
    ['SEO_OWNER_EMAIL', ''],
    ['SEO_OWNER_EMAIL', 'not-an-email'],
  ])('hides the feature when %s is misconfigured as %j', async (key, value) => {
    process.env[key] = value;

    const response = await request(createApp({ userId: OWNER_ID, role: 'admin' })).get('/seo');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
    expectPrivateSeoHeaders(response);
    expect(User.findById).not.toHaveBeenCalled();
  });
});
