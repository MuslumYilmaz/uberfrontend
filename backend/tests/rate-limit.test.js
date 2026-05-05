'use strict';

const express = require('express');
const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

function createLimitedApp(rateLimitMiddleware) {
  const app = express();
  app.use(rateLimitMiddleware);
  app.get('/limited', (_req, res) => res.json({ ok: true }));
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
        json: async () => [{ result: 1 }, { result: 1 }, { result: 60 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 2 }, { result: 1 }, { result: 59 }],
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
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)[0][0]).toBe('INCR');
  });
});
