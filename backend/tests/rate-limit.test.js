'use strict';

const express = require('express');
const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

function createLimitedApp(rateLimitMiddleware) {
  const app = express();
  app.use(rateLimitMiddleware);
  app.get('/limited', (_req, res) => res.json({
    ok: true,
    rateLimit: res.locals.rateLimit,
  }));
  return app;
}

describe('rateLimit middleware', () => {
  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    global.fetch = ORIGINAL_FETCH;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
  });

  test('blocks repeated requests with the in-memory limiter', async () => {
    process.env.RATE_LIMIT_STORE = 'memory';
    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-memory',
      windowMs: 60_000,
      max: 1,
      message: 'Too many unit requests',
      code: 'UNIT_RATE_LIMITED',
    }));

    const first = await request(app).get('/limited');
    const second = await request(app).get('/limited');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body).toEqual({
      code: 'UNIT_RATE_LIMITED',
      error: 'Too many unit requests',
    });
    expect(second.headers['retry-after']).toBeTruthy();
  });

  test('uses Upstash Redis when configured', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: [1, 60] }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: [2, 59] }],
      });

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-redis',
      windowMs: 60_000,
      max: 1,
      message: 'Redis limited',
    }));

    const first = await request(app).get('/limited');
    const second = await request(app).get('/limited');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe('https://redis.example.test/pipeline');
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)[0][0]).toBe('EVAL');
    expect(first.body.rateLimit).toEqual({
      limiter: 'unit-redis',
      outcome: 'allowed',
      code: 'RATE_LIMIT_ALLOWED',
      storeFallback: false,
    });
  });

  test('uses the same atomic EVAL contract for the global Express store', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: [1, 60] }],
    });

    jest.resetModules();
    const { createExpressRateLimitStore } = require('../middleware/rateLimit');
    const store = createExpressRateLimitStore({
      name: 'unit-express-store',
      windowMs: 60_000,
    });
    await expect(store.increment('client-key')).resolves.toEqual({
      totalHits: 1,
      resetTime: expect.any(Date),
    });
    const command = JSON.parse(global.fetch.mock.calls[0][1].body)[0];
    expect(command[0]).toBe('EVAL');
    expect(command[2]).toBe(1);
    expect(command[4]).toBe(60);
  });

  test('allows a sensitive limiter to fail closed independently of the global fallback', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.RATE_LIMIT_REDIS_FAIL_CLOSED = 'false';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockRejectedValue(new Error('redis unavailable'));

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-sensitive',
      windowMs: 60_000,
      max: 10,
      redisFailureMode: 'closed',
    }));

    const response = await request(app).get('/limited');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      code: 'RATE_LIMIT_UNAVAILABLE',
      error: 'Rate limiter unavailable',
    });
  });

  test('fails a Redis-required limiter closed when Redis is not configured', async () => {
    process.env.RATE_LIMIT_STORE = 'memory';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-redis-required',
      windowMs: 60_000,
      max: 10,
      redisFailureMode: 'closed',
    }));

    const response = await request(app).get('/limited');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      code: 'RATE_LIMIT_UNAVAILABLE',
      error: 'Rate limiter unavailable',
    });
  });

  test('allows active mutations to fall back locally during a Redis outage', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.RATE_LIMIT_REDIS_FAIL_CLOSED = 'true';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockRejectedValue(new Error('redis unavailable'));

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-active-mutation',
      windowMs: 60_000,
      max: 1,
      redisFailureMode: 'open',
    }));

    const allowed = await request(app).get('/limited');
    expect(allowed.status).toBe(200);
    expect(allowed.body.rateLimit).toEqual({
      limiter: 'unit-active-mutation',
      outcome: 'allowed',
      code: 'network_error',
      storeFallback: true,
    });
    expect((await request(app).get('/limited')).status).toBe(429);
  });

  test('treats an HTTP 200 Upstash command error as unavailable and fails closed', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ error: 'ERR synthetic provider detail' }],
    });

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-command-error',
      windowMs: 60_000,
      max: 10,
      redisFailureMode: 'closed',
    }));

    const response = await request(app).get('/limited');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      code: 'RATE_LIMIT_UNAVAILABLE',
      error: 'Rate limiter unavailable',
    });
  });

  test.each([
    [null],
    [[]],
    [[0, 60]],
    [[1.5, 60]],
    [[1, 0]],
    [['1', 60]],
    [[1, '60']],
    [['one', 60]],
  ])('rejects malformed atomic increment result %j', async (result) => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result }],
    });

    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const response = await request(createLimitedApp(rateLimit({
      name: 'unit-invalid-result',
      windowMs: 60_000,
      max: 10,
      redisFailureMode: 'closed',
    }))).get('/limited');
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('RATE_LIMIT_UNAVAILABLE');
  });

  test('composes independent account and IP limits for session creation', async () => {
    process.env.RATE_LIMIT_STORE = 'memory';
    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = express();
    app.get(
      '/create',
      rateLimit({
        name: 'unit-create-user',
        windowMs: 60_000,
        max: 1,
        keyGenerator: (req) => req.get('X-Test-User'),
        code: 'UNIT_CREATE_USER_RATE_LIMITED',
      }),
      rateLimit({
        name: 'unit-create-ip',
        windowMs: 60_000,
        max: 2,
        keyGenerator: (req) => req.ip,
        code: 'UNIT_CREATE_IP_RATE_LIMITED',
      }),
      (_req, res) => res.json({ ok: true })
    );

    expect((await request(app).get('/create').set('X-Test-User', 'a')).status)
      .toBe(200);
    const repeatedAccount = await request(app)
      .get('/create')
      .set('X-Test-User', 'a');
    expect(repeatedAccount.status).toBe(429);
    expect(repeatedAccount.body.code).toBe('UNIT_CREATE_USER_RATE_LIMITED');

    expect((await request(app).get('/create').set('X-Test-User', 'b')).status)
      .toBe(200);
    const exhaustedIp = await request(app)
      .get('/create')
      .set('X-Test-User', 'c');
    expect(exhaustedIp.status).toBe(429);
    expect(exhaustedIp.body.code).toBe('UNIT_CREATE_IP_RATE_LIMITED');
  });

  test('does not charge an idempotent retry twice in the local preview store', async () => {
    process.env.RATE_LIMIT_STORE = 'memory';
    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = express();
    app.get(
      '/create',
      rateLimit({
        name: 'unit-deduped-create',
        windowMs: 60_000,
        max: 2,
        keyGenerator: (req) => req.get('X-Test-User'),
        dedupeKeyGenerator: (req) => req.get('Idempotency-Key'),
        code: 'UNIT_CREATE_RATE_LIMITED',
      }),
      (_req, res) => res.json({ ok: true })
    );

    const send = (key) => request(app)
      .get('/create')
      .set('X-Test-User', 'same-user')
      .set('Idempotency-Key', key);
    expect((await send('request-one')).status).toBe(200);
    expect((await send('request-one')).status).toBe(200);
    expect((await send('request-two')).status).toBe(200);
    const denied = await send('request-three');
    expect(denied.status).toBe(429);
    expect(denied.body.code).toBe('UNIT_CREATE_RATE_LIMITED');
  });

  test('uses one atomic Redis EVAL for an idempotent increment', async () => {
    process.env.RATE_LIMIT_STORE = 'redis';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: [1, 60] }],
    });
    jest.resetModules();
    const { rateLimit } = require('../middleware/rateLimit');
    const app = createLimitedApp(rateLimit({
      name: 'unit-redis-deduped',
      windowMs: 60_000,
      max: 2,
      dedupeKeyGenerator: (req) => req.get('Idempotency-Key'),
      redisFailureMode: 'closed',
    }));

    expect((await request(app).get('/limited').set('Idempotency-Key', 'same')).status)
      .toBe(200);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body[0][0]).toBe('EVAL');
    expect(body[0][2]).toBe(2);
    expect(body[0][4]).toContain(':dedupe:');
  });
});
