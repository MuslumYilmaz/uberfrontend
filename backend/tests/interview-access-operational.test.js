'use strict';

const {
  resolveInterviewAudience,
  stableCohortBucket,
} = require('../services/interview/access');
const {
  interviewConfig,
  interviewModeAccess,
  interviewModeAudience,
  interviewOperationalPolicy,
  interviewOperationalState,
} = require('../services/interview/config');
const {
  interviewShutdownNotice,
} = require('../services/interview/operational');

const MANAGED_ENV_NAMES = [
  'INTERVIEW_MODE_ACCESS',
  'INTERVIEW_MODE_ENABLED',
  'INTERVIEW_ROLLOUT_BPS',
  'INTERVIEW_ROLLOUT_SALT',
  'INTERVIEW_COHORT_BPS',
  'INTERVIEW_COHORT_SALT',
  'INTERVIEW_OPERATIONAL_STATE',
  'INTERVIEW_SHUTDOWN_NOTICE',
  'INTERVIEW_CREATE_RATE_LIMIT_WINDOW_MS',
  'INTERVIEW_CREATE_USER_RATE_LIMIT_MAX',
  'INTERVIEW_CREATE_IP_RATE_LIMIT_MAX',
  'INTERVIEW_ABANDON_RATE_LIMIT_MAX',
  'INTERVIEW_MUTATION_RATE_LIMIT_WINDOW_MS',
  'INTERVIEW_MUTATION_RATE_LIMIT_MAX',
];

describe('interview cohort access and operational policy', () => {
  const originalEnv = Object.fromEntries(
    MANAGED_ENV_NAMES.map((name) => [name, process.env[name]])
  );

  beforeEach(() => {
    for (const name of MANAGED_ENV_NAMES) delete process.env[name];
  });

  afterAll(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  test('uses the full sha256(salt:userId) digest for a stable 0..9999 bucket', () => {
    expect(stableCohortBucket('release-salt', 'user-1')).toBe(5029);
    expect(stableCohortBucket('release-salt', 'user-1')).toBe(5029);
    expect(stableCohortBucket('release-salt', 'user-2')).toBe(8867);
    expect(stableCohortBucket('', 'user-1')).toBeNull();
    expect(stableCohortBucket('release-salt', '')).toBeNull();
  });

  test('applies cohort basis points deterministically and fails closed without identity or salt', () => {
    const common = {
      mode: 'cohort',
      role: 'user',
      cohortBasisPoints: 5030,
      cohortSalt: 'release-salt',
    };

    expect(resolveInterviewAudience({ ...common, userId: 'user-1' })).toEqual(
      expect.objectContaining({
        audience: 'cohort',
        enabled: true,
        cohortBucket: 5029,
        reason: 'cohort_included',
      })
    );
    expect(resolveInterviewAudience({ ...common, userId: 'user-2' })).toEqual(
      expect.objectContaining({
        audience: 'disabled',
        enabled: false,
        cohortBucket: 8867,
        reason: 'cohort_excluded',
      })
    );
    expect(resolveInterviewAudience({
      ...common,
      userId: 'user-1',
      cohortSalt: '',
      cohortBasisPoints: 10_000,
    })).toEqual(expect.objectContaining({
      enabled: false,
      cohortBucket: null,
      reason: 'cohort_identity_unavailable',
    }));
    expect(resolveInterviewAudience({
      ...common,
      userId: '',
      cohortBasisPoints: 10_000,
    }).enabled).toBe(false);
  });

  test('preserves admin preview while retaining the legacy access result shape', () => {
    process.env.INTERVIEW_MODE_ACCESS = 'cohort';
    process.env.INTERVIEW_ROLLOUT_BPS = '0';
    delete process.env.INTERVIEW_ROLLOUT_SALT;

    expect(interviewModeAccess('admin', { userId: 'admin-1' })).toEqual({
      mode: 'cohort',
      enabled: true,
      internalPreview: true,
    });
    expect(interviewModeAccess('user', { userId: 'user-1' })).toEqual({
      mode: 'cohort',
      enabled: false,
      internalPreview: false,
    });
    expect(interviewModeAudience('admin', { userId: 'admin-1' })).toEqual(
      expect.objectContaining({
        audience: 'internal-preview',
        reason: 'admin_preview',
      })
    );
  });

  test('integrates valid cohort configuration without exposing the salt', () => {
    process.env.INTERVIEW_MODE_ACCESS = 'cohort';
    process.env.INTERVIEW_ROLLOUT_BPS = '5030';
    process.env.INTERVIEW_ROLLOUT_SALT = 'release-salt';

    expect(interviewModeAccess('user', { userId: 'user-1' }).enabled).toBe(true);
    expect(interviewModeAccess('user', { userId: 'user-2' }).enabled).toBe(false);
    expect(interviewConfig()).toEqual(expect.objectContaining({
      accessMode: 'cohort',
      enabled: true,
      cohortBasisPoints: 5030,
      rolloutBasisPoints: 5030,
      cohortSaltConfigured: true,
      rolloutSaltConfigured: true,
    }));
    expect(interviewConfig()).not.toHaveProperty('cohortSalt');

    process.env.INTERVIEW_ROLLOUT_BPS = '10001';
    expect(interviewConfig().cohortBasisPoints).toBe(0);
    expect(interviewModeAccess('user', { userId: 'user-1' }).enabled).toBe(false);
  });

  test('defaults missing operational state to normal and fails closed for invalid input', () => {
    expect(interviewOperationalState()).toBe('normal');
    expect(interviewOperationalPolicy()).toEqual({
      state: 'normal',
      canStartNew: true,
      activeSessionPolicy: 'continue',
      shutdownNotice: null,
      routePolicy: {
        discovery: true,
        create: true,
        activeSession: true,
        adminRecovery: true,
      },
    });

    process.env.INTERVIEW_OPERATIONAL_STATE = 'unexpected';
    expect(interviewOperationalState()).toBe('halt');
    expect(interviewOperationalPolicy()).toEqual(expect.objectContaining({
      state: 'halt',
      canStartNew: false,
      activeSessionPolicy: 'halted',
      routePolicy: expect.objectContaining({
        discovery: false,
        create: false,
        activeSession: false,
        adminRecovery: true,
      }),
    }));
  });

  test('drain blocks starts, keeps active sessions available, and supplies a bounded notice', () => {
    process.env.INTERVIEW_OPERATIONAL_STATE = 'drain';
    process.env.INTERVIEW_SHUTDOWN_NOTICE = `  ${'m'.repeat(600)}  `;

    const policy = interviewOperationalPolicy();
    expect(policy).toEqual(expect.objectContaining({
      state: 'drain',
      canStartNew: false,
      activeSessionPolicy: 'continue',
      routePolicy: expect.objectContaining({
        discovery: false,
        create: false,
        activeSession: true,
      }),
    }));
    expect(policy.shutdownNotice).toHaveLength(500);
    expect(interviewShutdownNotice('drain')).toBe(policy.shutdownNotice);
  });

  test('uses production rate-limit defaults and bounded environment overrides', () => {
    expect(interviewConfig()).toEqual(expect.objectContaining({
      createRateLimitWindowMs: 24 * 60 * 60 * 1000,
      createUserRateLimitMax: 10,
      createIpRateLimitMax: 20,
      abandonRateLimitMax: 3,
      mutationRateLimitWindowMs: 60 * 1000,
      mutationRateLimitMax: 300,
    }));

    process.env.INTERVIEW_CREATE_RATE_LIMIT_WINDOW_MS = '120000';
    process.env.INTERVIEW_CREATE_USER_RATE_LIMIT_MAX = '12';
    process.env.INTERVIEW_CREATE_IP_RATE_LIMIT_MAX = '24';
    process.env.INTERVIEW_ABANDON_RATE_LIMIT_MAX = '4';
    process.env.INTERVIEW_MUTATION_RATE_LIMIT_WINDOW_MS = '15000';
    process.env.INTERVIEW_MUTATION_RATE_LIMIT_MAX = '125';
    expect(interviewConfig()).toEqual(expect.objectContaining({
      createRateLimitWindowMs: 120000,
      createUserRateLimitMax: 12,
      createIpRateLimitMax: 24,
      abandonRateLimitMax: 4,
      mutationRateLimitWindowMs: 15000,
      mutationRateLimitMax: 125,
    }));
  });
});
