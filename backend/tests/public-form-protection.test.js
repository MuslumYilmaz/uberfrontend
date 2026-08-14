'use strict';

const {
  createPublicFormStore,
  createUpstashPublicFormStore,
  duplicateKey,
  fingerprint,
  quotaKey,
  verifyTurnstile,
} = require('../services/public-form-protection');

function successResponse(overrides = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      action: 'contact',
      hostname: 'frontendatlas.com',
      challenge_ts: new Date().toISOString(),
      'error-codes': [],
      ...overrides,
    }),
  };
}

function turnstileEnv(overrides = {}) {
  return {
    TURNSTILE_SECRET_KEY: 'unit-secret',
    TURNSTILE_ALLOWED_HOSTNAMES: 'frontendatlas.com,www.frontendatlas.com',
    TURNSTILE_VERIFY_TIMEOUT_MS: '3000',
    ...overrides,
  };
}

describe('public form Turnstile validation', () => {
  test('validates success, action, hostname, age, remote IP, and token length', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(successResponse());

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).resolves.toBe(true);

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(requestBody).toEqual(expect.objectContaining({
      secret: 'unit-secret',
      response: 'valid-turnstile-token-value',
      remoteip: '203.0.113.5',
      idempotency_key: expect.any(String),
    }));
  });

  test.each([
    ['wrong action', { action: 'bug_report' }],
    ['wrong hostname', { hostname: 'attacker.example' }],
    ['expired token', { challenge_ts: new Date(Date.now() - 301_000).toISOString() }],
  ])('rejects a successful provider response with %s', async (_label, responseOverrides) => {
    const fetchImpl = jest.fn().mockResolvedValue(successResponse(responseOverrides));

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 403,
      code: 'FORM_VERIFICATION_FAILED',
    }));
  });

  test('uses one transient retry with the same idempotency key', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce(successResponse());

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    const secondBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(secondBody.idempotency_key).toBe(firstBody.idempotency_key);
  });

  test('fails closed after two transient provider failures', async () => {
    const providerError = new TypeError('fetch failed');
    const fetchImpl = jest.fn().mockRejectedValue(providerError);

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('aborts timed-out provider requests, retries once, and returns 503', async () => {
    const fetchImpl = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      }, { once: true });
    }));

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv({ TURNSTILE_VERIFY_TIMEOUT_MS: '100' }),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('rejects missing and malformed tokens without calling Siteverify', async () => {
    const fetchImpl = jest.fn();

    await expect(verifyTurnstile({
      token: '',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 400,
      code: 'FORM_VERIFICATION_REQUIRED',
    }));
    await expect(verifyTurnstile({
      token: 'tiny',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 403,
      code: 'FORM_VERIFICATION_FAILED',
    }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('treats a rejected Turnstile secret as provider configuration unavailability', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(successResponse({
      success: false,
      'error-codes': ['invalid-input-secret'],
    }));

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
  });

  test('fails closed without a Turnstile secret or hostname allowlist', async () => {
    const fetchImpl = jest.fn();

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: {},
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('accepts Cloudflare fixed dummy metadata only behind the explicit non-production gate', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(successResponse({
      action: 'test',
      hostname: 'localhost',
      challenge_ts: '2022-02-28T15:14:30.096Z',
    }));
    const env = {
      NODE_ENV: 'test',
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      TURNSTILE_ALLOW_DUMMY_KEYS: 'true',
      TURNSTILE_ALLOWED_HOSTNAMES: 'localhost',
    };

    await expect(verifyTurnstile({
      token: 'XXXX.DUMMY.TOKEN.XXXX',
      expectedAction: 'contact',
      remoteIp: '127.0.0.1',
      env,
      fetchImpl,
    })).resolves.toBe(true);
  });

  test.each([
    ['production with the flag', {
      NODE_ENV: 'production',
      TURNSTILE_ALLOW_DUMMY_KEYS: 'true',
      TURNSTILE_SECRET_KEY: 'real-looking-production-secret',
    }],
    ['production with a known dummy secret', { NODE_ENV: 'production', TURNSTILE_ALLOW_DUMMY_KEYS: 'false' }],
    ['a staging runtime', { NODE_ENV: 'staging', TURNSTILE_ALLOW_DUMMY_KEYS: 'true' }],
    ['an unset runtime', { NODE_ENV: '', TURNSTILE_ALLOW_DUMMY_KEYS: 'true' }],
    ['test without the flag', { NODE_ENV: 'test', TURNSTILE_ALLOW_DUMMY_KEYS: 'false' }],
  ])('rejects dummy credentials in %s', async (_label, overrides) => {
    const fetchImpl = jest.fn();
    const env = {
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      TURNSTILE_ALLOWED_HOSTNAMES: 'localhost',
      ...overrides,
    };

    await expect(verifyTurnstile({
      token: 'XXXX.DUMMY.TOKEN.XXXX',
      expectedAction: 'contact',
      remoteIp: '127.0.0.1',
      env,
      fetchImpl,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('requires literal boolean success and maps Siteverify bad-request to 503', async () => {
    const malformedFetch = jest.fn().mockResolvedValue(successResponse({ success: 'true' }));
    const badRequestFetch = jest.fn().mockResolvedValue(successResponse({
      success: false,
      'error-codes': ['bad-request'],
    }));

    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl: malformedFetch,
    })).rejects.toEqual(expect.objectContaining({ status: 403 }));
    await expect(verifyTurnstile({
      token: 'valid-turnstile-token-value',
      expectedAction: 'contact',
      remoteIp: '203.0.113.5',
      env: turnstileEnv(),
      fetchImpl: badRequestFetch,
    })).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
  });
});

describe('public form Redis store', () => {
  test('frames exact fingerprint fields without case, whitespace, or delimiter collisions', () => {
    expect(fingerprint(['Sender@example.com', 'Message'])).not.toBe(
      fingerprint(['sender@example.com', 'Message'])
    );
    expect(fingerprint(['sender@example.com', 'two  spaces'])).not.toBe(
      fingerprint(['sender@example.com', 'two spaces'])
    );
    expect(fingerprint(['a|b', 'c'])).not.toBe(fingerprint(['a', 'b|c']));
  });

  test('hashes sensitive quota and duplicate key material', () => {
    const email = 'private.sender@example.com';
    const sourceIp = '203.0.113.88';

    expect(quotaKey('contact:email:hourly', email)).not.toContain(email);
    expect(duplicateKey('bug-report', sourceIp)).not.toContain(sourceIp);
  });

  test('fails only public-form store operations when production Redis is missing', async () => {
    const store = createPublicFormStore({ env: { NODE_ENV: 'production' } });

    await expect(store.increment('quota:test', 60)).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
  });

  test('uses hashed route keys and atomic Redis TTL/claim commands', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 1 }, { result: 1 }, { result: 60 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 'OK' }, { result: 600 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 1 }],
      });
    const store = createUpstashPublicFormStore({
      env: {
        UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
        UPSTASH_REDIS_REST_TOKEN: 'redis-token',
        RATE_LIMIT_NAMESPACE: 'test',
      },
      fetchImpl,
    });

    await expect(store.increment('quota:contact:email:abc123', 60)).resolves.toEqual({
      count: 1,
      ttlSeconds: 60,
    });
    const claim = await store.claim('duplicate:contact:def456', 600, 'claim-owner-id');
    expect(claim).toEqual({
      claimed: true,
      ttlSeconds: 600,
      owner: 'claim-owner-id',
    });
    await expect(store.release('duplicate:contact:def456', 'claim-owner-id')).resolves.toBe(true);

    const quotaCommands = JSON.parse(fetchImpl.mock.calls[0][1].body);
    const claimCommands = JSON.parse(fetchImpl.mock.calls[1][1].body);
    const releaseCommands = JSON.parse(fetchImpl.mock.calls[2][1].body);
    expect(quotaCommands).toEqual([
      ['INCR', 'public-form:test:quota:contact:email:abc123'],
      ['EXPIRE', 'public-form:test:quota:contact:email:abc123', 60, 'NX'],
      ['TTL', 'public-form:test:quota:contact:email:abc123'],
    ]);
    expect(claimCommands[0]).toEqual([
      'SET',
      'public-form:test:duplicate:contact:def456',
      'claim-owner-id',
      'EX',
      600,
      'NX',
    ]);
    expect(releaseCommands[0][0]).toBe('EVAL');
    expect(releaseCommands[0][2]).toBe(1);
    expect(releaseCommands[0][3]).toBe('public-form:test:duplicate:contact:def456');
    expect(releaseCommands[0][4]).toBe('claim-owner-id');
  });

  test('does not let an expired claim owner release a newer memory-store claim', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const store = createPublicFormStore({
        env: { NODE_ENV: 'test', PUBLIC_FORM_REDIS_REQUIRED: 'false' },
      });
      await expect(store.claim('duplicate:test', 1, 'old-owner')).resolves.toEqual(expect.objectContaining({
        claimed: true,
        owner: 'old-owner',
      }));

      jest.advanceTimersByTime(1001);
      await expect(store.claim('duplicate:test', 60, 'new-owner')).resolves.toEqual(expect.objectContaining({
        claimed: true,
        owner: 'new-owner',
      }));
      await expect(store.release('duplicate:test', 'old-owner')).resolves.toBe(false);
      await expect(store.claim('duplicate:test', 60, 'third-owner')).resolves.toEqual(expect.objectContaining({
        claimed: false,
      }));
    } finally {
      jest.useRealTimers();
    }
  });

  test('treats malformed and failed Redis responses as protection outages', async () => {
    const env = {
      UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
      UPSTASH_REDIS_REST_TOKEN: 'redis-token',
    };
    const malformedStore = createUpstashPublicFormStore({
      env,
      fetchImpl: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 1 }) }),
    });
    const offlineStore = createUpstashPublicFormStore({
      env,
      fetchImpl: jest.fn().mockRejectedValue(new TypeError('fetch failed')),
    });

    await expect(malformedStore.increment('quota:test', 60)).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    await expect(offlineStore.increment('quota:test', 60)).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
  });

  test('aborts a stalled Redis request and fails closed with 503', async () => {
    const fetchImpl = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      }, { once: true });
    }));
    const store = createUpstashPublicFormStore({
      env: {
        UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
        UPSTASH_REDIS_REST_TOKEN: 'redis-token',
        PUBLIC_FORM_REDIS_TIMEOUT_MS: '100',
      },
      fetchImpl,
    });

    await expect(store.increment('quota:test', 60)).rejects.toEqual(expect.objectContaining({
      status: 503,
      code: 'FORM_PROTECTION_UNAVAILABLE',
    }));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
