'use strict';

const { installHealthyRedisStub } = require('../scripts/audit-interview-fullstack-performance');

describe('Interview performance harness outbound request isolation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => installHealthyRedisStub());
  afterEach(() => { global.fetch = originalFetch; });

  test.each([
    ['string', (url) => url],
    ['URL', (url) => new URL(url)],
    ['Request', (url) => new Request(url)],
  ])('accepts only the expected Sentry and Redis origins for %s inputs', async (_label, input) => {
    const sentry = await fetch(input('https://sentry.interview.invalid/api/1/envelope/'));
    expect(sentry.status).toBe(200);
    expect(await sentry.text()).toBe('');

    const redis = await fetch(input('https://redis.interview.invalid/pipeline'), {
      body: JSON.stringify([['EVAL', 'rate-limit-script', '1', 'key', '60']]),
    });
    expect(redis.status).toBe(200);
    expect(await redis.json()).toEqual([{ result: [1, 60] }]);
  });

  test.each([
    'https://sentry.interview.invalid.attacker.example/api/1/envelope/',
    'https://sentry.interview.invalid@attacker.example/api/1/envelope/',
    'https://redis.interview.invalid.attacker.example/pipeline',
    'http://sentry.interview.invalid/api/1/envelope/',
    'https://sentry.interview.invalid:8443/api/1/envelope/',
    'https://api.frontendatlas.com/api/interviews',
  ])('rejects unexpected origins without contacting %s', async (url) => {
    await expect(fetch(url)).rejects.toThrow('Unexpected request origin');
  });

  test.each(['not-a-url', '/pipeline', undefined])('rejects malformed request input %s', async (url) => {
    await expect(fetch(url)).rejects.toThrow();
  });
});
