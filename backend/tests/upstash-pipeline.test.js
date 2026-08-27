'use strict';

const {
  DEFAULT_TIMEOUT_MS,
  resolveUpstashTimeoutMs,
  runUpstashPipeline,
} = require('../services/upstash-pipeline');

const env = {
  UPSTASH_REDIS_REST_URL: 'https://redis.example.test/',
  UPSTASH_REDIS_REST_TOKEN: 'super-secret-token',
};

describe('Upstash pipeline transport', () => {
  test('posts the exact command list with an abort signal', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: [1, 30] }],
    });
    const commands = [['EVAL', 'return {1, 30}', 0]];

    await expect(runUpstashPipeline(commands, { env, fetchImpl })).resolves.toEqual([
      { result: [1, 30] },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://redis.example.test/pipeline',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(commands),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test.each([
    [[{ error: 'provider payload must stay private' }], 'command_error'],
    [[{}], 'invalid_response'],
    [[], 'invalid_response'],
  ])('rejects an invalid HTTP 200 payload %#', async (payload, code) => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    await expect(runUpstashPipeline([['PING']], { env, fetchImpl }))
      .rejects.toMatchObject({ code });
  });

  test('maps provider and transport failures to sanitized stable errors', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(
      new Error('super-secret-token https://provider.invalid/private'),
    );

    let failure;
    try {
      await runUpstashPipeline([['PING']], { env, fetchImpl });
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({ code: 'network_error' });
    expect(String(failure?.message)).not.toContain('super-secret-token');
    expect(String(failure?.message)).not.toContain('provider.invalid');
  });

  test('aborts a pipeline that exceeds the bounded timeout', async () => {
    const fetchImpl = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    }));

    await expect(runUpstashPipeline([['PING']], {
      env: { ...env, RATE_LIMIT_REDIS_TIMEOUT_MS: '100' },
      fetchImpl,
    })).rejects.toMatchObject({ code: 'timeout' });
  });

  test('uses 1500ms for timeout values outside the accepted range', () => {
    expect(resolveUpstashTimeoutMs({}, undefined)).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveUpstashTimeoutMs({ RATE_LIMIT_REDIS_TIMEOUT_MS: '99' })).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveUpstashTimeoutMs({ RATE_LIMIT_REDIS_TIMEOUT_MS: '10001' })).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveUpstashTimeoutMs({ RATE_LIMIT_REDIS_TIMEOUT_MS: '875' })).toBe(875);
  });
});
