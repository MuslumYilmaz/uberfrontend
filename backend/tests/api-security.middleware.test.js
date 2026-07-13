'use strict';

const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

function loadApp(overrides = {}) {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    NODE_ENV: 'test',
    JWT_SECRET: 'api_security_test_secret',
    MONGO_TARGET: 'test',
    MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/test',
    SERVER_BASE: 'http://127.0.0.1:3001',
    FRONTEND_BASE: 'http://127.0.0.1:4200',
    COOKIE_SAMESITE: 'lax',
    COOKIE_SECURE: 'false',
    SENTRY_ENABLED: 'false',
    BILLING_WEBHOOK_DEBUG: 'false',
    RATE_LIMIT_STORE: 'memory',
    API_RATE_LIMIT_WINDOW_MS: '60000',
    API_RATE_LIMIT_MAX: '2',
    WEBHOOK_RATE_LIMIT_WINDOW_MS: '60000',
    WEBHOOK_RATE_LIMIT_MAX: '2',
    ...overrides,
  };
  jest.doMock('../config/mongo', () => {
    const actual = jest.requireActual('../config/mongo');
    return {
      ...actual,
      connectToMongo: jest.fn().mockResolvedValue(undefined),
    };
  });
  return require('../index');
}

describe('global API security middleware', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../config/mongo');
    process.env = { ...ORIGINAL_ENV };
    global.fetch = ORIGINAL_FETCH;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
  });

  test('limits normal API traffic with standard headers and Retry-After', async () => {
    const app = loadApp();

    const first = await request(app).get('/api/auth/ping');
    const second = await request(app).get('/api/auth/ping');
    const limited = await request(app).get('/api/auth/ping');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.ratelimit).toBeTruthy();
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeTruthy();
    expect(limited.body).toEqual({
      code: 'API_RATE_LIMITED',
      error: 'Too many requests. Please try again shortly.',
    });
  });

  test('exempts health and OPTIONS requests from the general quota', async () => {
    const app = loadApp({ API_RATE_LIMIT_MAX: '1' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await request(app).get('/api/health')).status).toBe(200);
      expect((await request(app).options('/api/auth/ping')).status).not.toBe(429);
    }

    expect((await request(app).get('/api/auth/ping')).status).toBe(200);
    expect((await request(app).get('/api/auth/ping')).status).toBe(429);
  });

  test('uses the independent webhook quota without requiring auth cookies', async () => {
    const app = loadApp({ API_RATE_LIMIT_MAX: '1', WEBHOOK_RATE_LIMIT_MAX: '2' });

    const first = await request(app).post('/api/billing/webhooks/lemonsqueezy').send({});
    const second = await request(app).post('/api/billing/webhooks/lemonsqueezy').send({});
    const limited = await request(app).post('/api/billing/webhooks/lemonsqueezy').send({});

    expect(first.status).not.toBe(429);
    expect(second.status).not.toBe(429);
    expect(limited.status).toBe(429);
    expect(limited.body?.code).toBe('API_RATE_LIMITED');
  });

  test('falls back to process memory when Redis is unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('mock redis outage'));
    const app = loadApp({
      RATE_LIMIT_STORE: 'redis',
      RATE_LIMIT_REDIS_FAIL_CLOSED: 'false',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
      API_RATE_LIMIT_MAX: '1',
    });

    expect((await request(app).get('/api/auth/ping')).status).toBe(200);
    expect((await request(app).get('/api/auth/ping')).status).toBe(429);
  });

  test('fails closed when Redis is required and unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('mock redis outage'));
    const app = loadApp({
      RATE_LIMIT_STORE: 'redis',
      RATE_LIMIT_REDIS_FAIL_CLOSED: 'true',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    });

    const response = await request(app).get('/api/auth/ping');
    expect(response.status).toBe(503);
    expect(response.body?.error).toBe('Internal server error');
  });

  test('lets Express trust-proxy configuration, not raw X-Forwarded-For parsing, select the client IP', async () => {
    const untrusted = loadApp({ TRUST_PROXY: 'false', API_RATE_LIMIT_MAX: '1' });
    expect((await request(untrusted).get('/api/auth/ping').set('X-Forwarded-For', '198.51.100.10')).status).toBe(200);
    expect((await request(untrusted).get('/api/auth/ping').set('X-Forwarded-For', '198.51.100.11')).status).toBe(429);

    const trusted = loadApp({ TRUST_PROXY: 'true', API_RATE_LIMIT_MAX: '1' });
    expect((await request(trusted).get('/api/auth/ping').set('X-Forwarded-For', '198.51.100.10')).status).toBe(200);
    expect((await request(trusted).get('/api/auth/ping').set('X-Forwarded-For', '198.51.100.11')).status).toBe(200);
  });
});
