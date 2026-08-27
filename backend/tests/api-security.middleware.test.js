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

  test('charges invalid cookie-CSRF traffic to the API quota before rejecting it', async () => {
    const app = loadApp({ API_RATE_LIMIT_MAX: '1' });
    const authCookie = ['access_token=invalid-but-cookie-auth-shaped'];

    const rejected = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);
    expect(rejected.status).toBe(403);
    expect(rejected.body?.code).toBe('AUTH_CSRF_INVALID');
    expect(rejected.headers.ratelimit).toBeTruthy();

    const limited = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);
    expect(limited.status).toBe(429);
    expect(limited.body?.code).toBe('API_RATE_LIMITED');
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

  test('keeps Interview health live but launch-disabled while the feature is off', async () => {
    const app = loadApp({
      INTERVIEW_MODE_ACCESS: 'off',
      INTERVIEW_OPERATIONAL_STATE: 'normal',
      RATE_LIMIT_STORE: 'memory',
      INTERVIEW_MONITORING_READY: 'false',
      INTERVIEW_NATIVE_SAFARI_READY: 'false',
    });

    const response = await request(app).get('/api/health/interview');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      ok: true,
      launchReady: false,
      releaseRequired: false,
      dependencies: expect.objectContaining({
        redisRateLimit: expect.objectContaining({
          required: false,
          configured: false,
          ready: false,
          code: 'not_configured',
        }),
        monitoring: expect.objectContaining({ required: false, ready: false }),
        nativeSafari: expect.objectContaining({ required: false, ready: false }),
      }),
    }));
  });

  test('exposes Retry-After to allowed browser origins without changing credentialed CORS', async () => {
    const app = loadApp();
    const response = await request(app)
      .options('/api/contact')
      .set('Origin', 'http://127.0.0.1:4200')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:4200');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-expose-headers']).toContain('Retry-After');
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

  test('serves public checkout config without touching Mongo while other billing routes keep the DB gate', async () => {
    const app = loadApp({
      BILLING_PROVIDER: 'lemonsqueezy',
      PAYMENTS_MODE: 'test',
      LEMONSQUEEZY_MONTHLY_URL_TEST: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
    });
    const { connectToMongo } = require('../config/mongo');
    connectToMongo.mockRejectedValue(new Error('synthetic database outage'));

    const config = await request(app).get('/api/billing/checkout/config');

    expect(config.status).toBe(200);
    expect(config.body).toEqual(expect.objectContaining({
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
    }));
    expect(connectToMongo).not.toHaveBeenCalled();

    const protectedBillingRoute = await request(app).get('/api/billing/manage-url');
    expect(protectedBillingRoute.status).toBe(503);
    expect(connectToMongo).toHaveBeenCalledTimes(1);
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

  test('keeps Interview resume paths on their bounded fail-open limiter during Redis outage', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('mock redis outage'));
    const app = loadApp({
      RATE_LIMIT_STORE: 'redis',
      RATE_LIMIT_REDIS_FAIL_CLOSED: 'true',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    });

    const lower = await request(app).get('/api/interviews/active');
    const upper = await request(app).get('/API/INTERVIEWS/active');

    expect(lower.status).toBe(401);
    expect(upper.status).toBe(401);
    expect(lower.status).not.toBe(503);
    expect(upper.status).not.toBe(503);
  });

  test('uses a process-local pre-auth guard without putting Interview writes through Redis', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('mock redis outage'));
    const app = loadApp({
      RATE_LIMIT_STORE: 'redis',
      RATE_LIMIT_REDIS_FAIL_CLOSED: 'true',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    });

    const response = await request(app)
      .put('/API/INTERVIEWS/session-id/mcq/question-id')
      .send({ selectedOptionId: 'option-a' });

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('bounds unauthenticated availability and unknown Interview writes before route auth', async () => {
    const availabilityApp = loadApp({ API_RATE_LIMIT_MAX: '1' });
    expect((await request(availabilityApp).get('/api/interviews/availability')).status).toBe(401);
    const availabilityLimited = await request(availabilityApp).get('/api/interviews/availability');
    expect(availabilityLimited.status).toBe(429);
    expect(availabilityLimited.headers['retry-after']).toBeTruthy();
    expect(availabilityLimited.body?.code).toBe('INTERVIEW_OUTER_RATE_LIMITED');

    const unknownWriteApp = loadApp({ API_RATE_LIMIT_MAX: '1' });
    expect((await request(unknownWriteApp).post('/api/interviews/not-a-route')).status).toBe(401);
    const unknownLimited = await request(unknownWriteApp).post('/api/interviews/not-a-route');
    expect(unknownLimited.status).toBe(429);
    expect(unknownLimited.headers['retry-after']).toBeTruthy();
    expect(unknownLimited.body?.code).toBe('INTERVIEW_OUTER_RATE_LIMITED');
  });

  test('does not exempt paths that merely contain the Interview prefix', async () => {
    const app = loadApp({ API_RATE_LIMIT_MAX: '1' });
    const nested = '/api/auth/foo/api/interviews/bar';

    expect((await request(app).get(nested)).status).toBe(404);
    const limited = await request(app).get(nested);
    expect(limited.status).toBe(429);
    expect(limited.body?.code).toBe('API_RATE_LIMITED');
  });

  test.each([
    '//api/interviews/active',
    '/api//interviews/active',
  ])('keeps non-mounted repeated-slash path %s on the global limiter', async (path) => {
    const app = loadApp({ API_RATE_LIMIT_MAX: '1' });

    expect((await request(app).get(path)).status).toBe(404);
    const limited = await request(app).get(path);
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeTruthy();
    expect(limited.body?.code).toBe('API_RATE_LIMITED');
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
