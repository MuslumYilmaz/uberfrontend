'use strict';

const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };

function loadVercelHandler(overrides = {}) {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    NODE_ENV: 'test',
    JWT_SECRET: 'vercel_adapter_security_test_secret',
    MONGO_TARGET: 'test',
    MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/test',
    SERVER_BASE: 'http://127.0.0.1:3001',
    FRONTEND_BASE: 'http://127.0.0.1:4200',
    COOKIE_SAMESITE: 'lax',
    COOKIE_SECURE: 'false',
    SENTRY_ENABLED: 'false',
    RATE_LIMIT_STORE: 'memory',
    API_RATE_LIMIT_WINDOW_MS: '60000',
    API_RATE_LIMIT_MAX: '10',
    WEBHOOK_RATE_LIMIT_WINDOW_MS: '60000',
    WEBHOOK_RATE_LIMIT_MAX: '10',
    ...overrides,
  };
  jest.doMock('../config/mongo', () => {
    const actual = jest.requireActual('../config/mongo');
    return {
      ...actual,
      connectToMongo: jest.fn().mockResolvedValue(undefined),
    };
  });
  return require('../api/index');
}

describe('Vercel serverless security adapter', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../config/mongo');
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('normalizes stripped paths and repairs a safe cookie-auth request', async () => {
    const handler = loadVercelHandler();

    const hello = await request(handler).get('/hello');
    expect(hello.status).toBe(200);
    expect(hello.body).toEqual({ message: 'Hello from backend 👋' });

    const ping = await request(handler)
      .get('/auth/ping')
      .set('Cookie', ['access_token=old-session']);
    expect(ping.status).toBe(200);
    expect(ping.headers.ratelimit).toBeTruthy();
    expect(ping.headers['set-cookie']?.some((cookie) => cookie.startsWith('csrf_token='))).toBe(true);
  });

  test('runs the API limiter before CSRF rejection in the serverless entry point', async () => {
    const handler = loadVercelHandler({ API_RATE_LIMIT_MAX: '1' });
    const authCookie = ['access_token=invalid-but-cookie-auth-shaped'];

    const rejected = await request(handler)
      .post('/auth/logout')
      .set('Cookie', authCookie);
    expect(rejected.status).toBe(403);
    expect(rejected.body?.code).toBe('AUTH_CSRF_INVALID');
    expect(rejected.headers.ratelimit).toBeTruthy();

    const limited = await request(handler)
      .post('/auth/logout')
      .set('Cookie', authCookie);
    expect(limited.status).toBe(429);
    expect(limited.body?.code).toBe('API_RATE_LIMITED');
  });
});
