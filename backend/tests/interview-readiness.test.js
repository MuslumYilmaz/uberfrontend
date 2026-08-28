'use strict';

const {
  interviewReadinessSnapshot,
  interviewReleaseReadiness,
  probeRedisRateLimit,
  resetInterviewReadinessCache,
} = require('../services/interview/readiness');

const rolloutConfig = {
  cohortBasisPoints: 100,
  cohortSaltConfigured: true,
};
const operatorGates = {
  monitoringStatus: { configured: true, ready: true },
  nativeSafariStatus: { configured: true, ready: true },
};

describe('Interview artifact readiness', () => {
  test('reports a blocked artifact without failing instance health while the feature is off', () => {
    const snapshot = interviewReadinessSnapshot({
      accessMode: 'off',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: () => { throw new Error('candidate'); },
      now: new Date('2026-08-24T00:00:00.000Z'),
    });

    expect(snapshot).toEqual(expect.objectContaining({
      ok: true,
      code: 'INTERVIEW_RELEASE_DISABLED',
      launchReady: false,
      releaseRequired: false,
      systemDesignRequired: false,
    }));
    expect(snapshot.artifacts.coding).toEqual({ ready: false, status: 'blocked' });
  });

  test.each(['cohort', 'public'])(
    'fails readiness when coding artifacts are blocked in %s normal mode',
    (accessMode) => {
      const snapshot = interviewReadinessSnapshot({
        accessMode,
        systemDesignAccessMode: 'off',
        operationalState: 'normal',
        loadCoding: () => { throw new Error('not gold'); },
        config: rolloutConfig,
        redisReady: true,
        ...operatorGates,
      });

      expect(snapshot.ok).toBe(false);
      expect(snapshot.releaseRequired).toBe(true);
      expect(snapshot.systemDesignRequired).toBe(false);
    },
  );

  test('keeps System Design independent until its own release access is enabled', () => {
    const coding = () => ({ status: 'editorial-gold' });
    const blockedDesign = () => { throw new Error('design candidate'); };

    expect(interviewReadinessSnapshot({
      accessMode: 'public',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: coding,
      loadSystemDesign: blockedDesign,
      config: rolloutConfig,
      redisReady: true,
      ...operatorGates,
    }).ok).toBe(true);
    expect(interviewReadinessSnapshot({
      accessMode: 'public',
      systemDesignAccessMode: 'public',
      operationalState: 'normal',
      loadCoding: coding,
      loadSystemDesign: blockedDesign,
      config: rolloutConfig,
      redisReady: true,
      ...operatorGates,
    }).ok).toBe(false);
  });

  test('blocks public readiness when the global create limiter has no Redis store', () => {
    const snapshot = interviewReadinessSnapshot({
      accessMode: 'public',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: () => ({ status: 'editorial-gold' }),
      config: rolloutConfig,
      redisReady: false,
      ...operatorGates,
    });

    expect(snapshot).toEqual(expect.objectContaining({
      ok: false,
      code: 'INTERVIEW_DEPENDENCIES_BLOCKED',
      dependencies: expect.objectContaining({
        redisRateLimit: expect.objectContaining({
          required: true,
          configured: false,
          ready: false,
          code: 'not_configured',
        }),
      }),
    }));
  });

  test('requires a non-zero salted cohort contract before cohort readiness passes', () => {
    const base = {
      accessMode: 'cohort',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: () => ({ status: 'editorial-gold' }),
      redisReady: true,
      ...operatorGates,
    };
    expect(interviewReadinessSnapshot({
      ...base,
      config: { cohortBasisPoints: 100, cohortSaltConfigured: false },
    }).ok).toBe(false);
    expect(interviewReadinessSnapshot({
      ...base,
      config: { cohortBasisPoints: 0, cohortSaltConfigured: true },
    }).ok).toBe(false);
    expect(interviewReadinessSnapshot({
      ...base,
      config: rolloutConfig,
    }).ok).toBe(true);
  });

  test.each([
    ['off', 'normal'],
    ['public', 'drain'],
    ['public', 'halt'],
  ])('keeps health live with launchReady=false in %s/%s', (accessMode, operationalState) => {
    const snapshot = interviewReadinessSnapshot({
      accessMode,
      systemDesignAccessMode: 'off',
      operationalState,
      loadCoding: () => { throw new Error('unavailable'); },
    });
    expect(snapshot.ok).toBe(true);
    expect(snapshot.launchReady).toBe(false);
    expect(snapshot.releaseRequired).toBe(false);
  });

  test('requires explicit monitoring and native Safari operator gates for cohort/public launch', () => {
    const base = {
      accessMode: 'public',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: () => ({ status: 'editorial-gold' }),
      config: rolloutConfig,
      redisReady: true,
    };

    const blocked = interviewReadinessSnapshot({ ...base, env: {} });
    expect(blocked.ok).toBe(false);
    expect(blocked.launchReady).toBe(false);
    expect(blocked.dependencies.monitoring).toEqual({
      required: true,
      configured: false,
      ready: false,
    });
    expect(blocked.dependencies.nativeSafari.ready).toBe(false);

    const ready = interviewReadinessSnapshot({ ...base, ...operatorGates });
    expect(ready.ok).toBe(true);
    expect(ready.launchReady).toBe(true);
    expect(ready.code).toBe('INTERVIEW_RELEASE_READY');
  });
});

describe('Interview Redis release probe', () => {
  const redisEnv = {
    RATE_LIMIT_STORE: 'redis',
    RATE_LIMIT_NAMESPACE: 'unit',
    UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    RATE_LIMIT_REDIS_TIMEOUT_MS: '500',
  };

  beforeEach(() => resetInterviewReadinessCache());

  test('uses one short-lived, PII-free EVAL probe and caches its result', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: [1, 30] }],
    });

    const first = await probeRedisRateLimit({ env: redisEnv, fetchImpl });
    const second = await probeRedisRateLimit({ env: redisEnv, fetchImpl });

    expect(first).toEqual(expect.objectContaining({
      configured: true,
      ready: true,
      code: 'ready',
      cached: false,
    }));
    expect(second).toEqual(expect.objectContaining({ ready: true, cached: true }));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const command = JSON.parse(fetchImpl.mock.calls[0][1].body)[0];
    expect(command[0]).toBe('EVAL');
    expect(command[2]).toBe(1);
    expect(command[3]).toBe('health:unit:interview-rate-limit');
    expect(command[4]).toBe(30);
  });

  test('coalesces simultaneous probe requests', async () => {
    let resolveFetch;
    const fetchImpl = jest.fn(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    const first = probeRedisRateLimit({ env: redisEnv, fetchImpl });
    const second = probeRedisRateLimit({ env: redisEnv, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    resolveFetch({ ok: true, json: async () => [{ result: [2, 30] }] });

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ ready: true }),
      expect.objectContaining({ ready: true }),
    ]);
  });

  test('surfaces HTTP 200 command errors without exposing provider text', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ error: 'ERR private provider diagnostic' }],
    });

    await expect(probeRedisRateLimit({ env: redisEnv, fetchImpl })).resolves.toEqual(
      expect.objectContaining({
        configured: true,
        ready: false,
        code: 'command_error',
      }),
    );
  });

  test('combines the live probe with operator gates in async release readiness', async () => {
    const snapshot = await interviewReleaseReadiness({
      env: {
        ...redisEnv,
        INTERVIEW_MONITORING_READY: 'true',
        INTERVIEW_NATIVE_SAFARI_READY: 'true',
      },
      accessMode: 'public',
      systemDesignAccessMode: 'off',
      operationalState: 'normal',
      loadCoding: () => ({ status: 'editorial-gold' }),
      config: rolloutConfig,
      fetchImpl: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ result: [1, 30] }],
      }),
    });

    expect(snapshot).toEqual(expect.objectContaining({
      ok: true,
      launchReady: true,
    }));
  });

  test.each([
    ['off', 'normal'],
    ['public', 'drain'],
    ['public', 'halt'],
  ])(
    'does not start or await Redis when launch is disabled in %s/%s',
    async (accessMode, operationalState) => {
      const fetchImpl = jest.fn(() => {
        throw new Error('Redis must not be probed');
      });
      const snapshot = await interviewReleaseReadiness({
        env: redisEnv,
        accessMode,
        systemDesignAccessMode: 'off',
        operationalState,
        loadCoding: () => ({ status: 'editorial-gold' }),
        config: rolloutConfig,
        fetchImpl,
      });

      expect(fetchImpl).not.toHaveBeenCalled();
      expect(snapshot).toEqual(expect.objectContaining({
        ok: true,
        launchReady: false,
        releaseRequired: false,
        code: 'INTERVIEW_RELEASE_DISABLED',
      }));
      expect(snapshot.dependencies.redisRateLimit).toEqual(expect.objectContaining({
        required: false,
        configured: true,
        ready: false,
        code: 'probe_not_run',
        latencyMs: 0,
      }));
    },
  );
});
