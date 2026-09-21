'use strict';

const {
  assertInterviewPreflightRuntime,
  assertInterviewProductionPublicRuntime,
  assertInterviewRuntimeSafety,
} = require('../services/interview/runtime-safety');

function localEnv(overrides = {}) {
  return {
    NODE_ENV: 'development',
    INTERVIEW_MODE_ACCESS: 'preflight',
    INTERVIEW_SYSTEM_DESIGN_ACCESS: 'off',
    MONGO_TARGET: 'test',
    MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/fa_interview_local',
    EXPECTED_MONGO_DB_NAME_TEST: 'fa_interview_local',
    RATE_LIMIT_STORE: 'memory',
    ...overrides,
  };
}

function previewEnv(overrides = {}) {
  return {
    NODE_ENV: 'production',
    VERCEL: '1',
    VERCEL_ENV: 'preview',
    INTERVIEW_MODE_ACCESS: 'preflight',
    INTERVIEW_SYSTEM_DESIGN_ACCESS: 'off',
    MONGO_TARGET: 'test',
    MONGO_URL_TEST: 'mongodb+srv://preview.invalid/fa_interview_preview',
    EXPECTED_MONGO_DB_NAME_TEST: 'fa_interview_preview',
    RATE_LIMIT_STORE: 'redis',
    RATE_LIMIT_NAMESPACE: 'frontendatlas:preview:interview:v1',
    ...overrides,
  };
}

describe('Interview preflight runtime safety', () => {
  test('does not inspect MongoDB configuration outside preflight mode', () => {
    expect(assertInterviewPreflightRuntime({
      NODE_ENV: 'production',
      INTERVIEW_MODE_ACCESS: 'public',
    })).toEqual({
      required: false,
      environment: 'disabled',
      database: null,
    });
  });

  test('allows an isolated Vercel Preview test database', () => {
    expect(assertInterviewPreflightRuntime(previewEnv())).toEqual({
      required: true,
      environment: 'preview',
      database: 'fa_interview_preview',
    });
  });

  test('rejects Vercel Preview when a production Mongo variable leaks into scope', () => {
    expect(() => assertInterviewPreflightRuntime(previewEnv({
      MONGO_URL: 'mongodb+srv://production.invalid/frontendatlas',
    }))).toThrow('MONGO_URL must not exist');
  });

  test('rejects Preview preflight unless the shared limiter uses the exact Preview scope', () => {
    expect(() => assertInterviewPreflightRuntime(previewEnv({
      RATE_LIMIT_STORE: 'memory',
    }))).toThrow('RATE_LIMIT_STORE must exactly equal redis');
    expect(() => assertInterviewPreflightRuntime(previewEnv({
      RATE_LIMIT_NAMESPACE: 'frontendatlas:production:interview:v1',
    }))).toThrow('RATE_LIMIT_NAMESPACE must exactly equal frontendatlas:preview:interview:v1');
  });

  test('rejects preflight in Production outside Vercel Preview', () => {
    expect(() => assertInterviewPreflightRuntime(localEnv({
      NODE_ENV: 'production',
    }))).toThrow('preflight is forbidden in a Production runtime');
  });

  test('allows only an exact loopback test database for local preflight', () => {
    expect(assertInterviewPreflightRuntime(localEnv())).toEqual({
      required: true,
      environment: 'local',
      database: 'fa_interview_local',
    });

    expect(() => assertInterviewPreflightRuntime(localEnv({
      MONGO_URL_TEST: 'mongodb+srv://remote.invalid/fa_interview_local',
    }))).toThrow('must use mongodb:// for a loopback database');
    expect(() => assertInterviewPreflightRuntime(localEnv({
      RATE_LIMIT_STORE: 'redis',
    }))).toThrow('RATE_LIMIT_STORE must exactly equal memory');
  });

  test('rejects mismatched, production-named and non-preview Vercel databases', () => {
    expect(() => assertInterviewPreflightRuntime(localEnv({
      EXPECTED_MONGO_DB_NAME_TEST: 'different_database',
    }))).toThrow('Refusing database mismatch');

    expect(() => assertInterviewPreflightRuntime(localEnv({
      MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/frontendatlas',
      EXPECTED_MONGO_DB_NAME_TEST: 'frontendatlas',
    }))).toThrow('Refusing unsafe Interview tooling database');

    expect(() => assertInterviewPreflightRuntime(previewEnv({
      VERCEL_ENV: 'production',
    }))).toThrow('Vercel preflight requires exact VERCEL_ENV=preview');
  });
});

describe('Interview Production public runtime safety', () => {
  function productionEnv(overrides = {}) {
    return {
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'production',
      INTERVIEW_MODE_ACCESS: 'public',
      INTERVIEW_SYSTEM_DESIGN_ACCESS: 'off',
      INTERVIEW_ROLLOUT_BPS: '0',
      INTERVIEW_ROLLOUT_SALT: '',
      MONGO_TARGET: 'production',
      MONGO_URL: 'mongodb+srv://production.invalid/frontendatlas',
      EXPECTED_MONGO_DB_NAME: 'frontendatlas',
      MONGO_URL_TEST: '',
      RATE_LIMIT_STORE: 'redis',
      RATE_LIMIT_NAMESPACE: 'frontendatlas:production:interview:v1',
      ...overrides,
    };
  }

  test('allows only the exact Production DB and Redis scope for direct public access', () => {
    expect(assertInterviewProductionPublicRuntime(productionEnv())).toEqual({
      required: true,
      environment: 'production-public',
      database: 'frontendatlas',
    });
    expect(assertInterviewRuntimeSafety(productionEnv())).toEqual({
      required: true,
      environment: 'production-public',
      database: 'frontendatlas',
    });
  });

  test('rejects a test target, Preview secret, wrong namespace, System Design, or cohort config', () => {
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      MONGO_TARGET: 'test',
      MONGO_URL_TEST: 'mongodb+srv://preview.invalid/fa_interview_preview',
      EXPECTED_MONGO_DB_NAME_TEST: 'fa_interview_preview',
    }))).toThrow('MONGO_TARGET must exactly equal production');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      MONGO_URL_TEST: 'mongodb+srv://preview.invalid/fa_interview_preview',
    }))).toThrow('MONGO_URL_TEST must not exist');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      RATE_LIMIT_NAMESPACE: 'frontendatlas:preview:interview:v1',
    }))).toThrow('RATE_LIMIT_NAMESPACE must exactly equal frontendatlas:production:interview:v1');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_SYSTEM_DESIGN_ACCESS: 'public',
    }))).toThrow('INTERVIEW_SYSTEM_DESIGN_ACCESS must exactly equal off');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_ROLLOUT_BPS: '100',
    }))).toThrow('INTERVIEW_ROLLOUT_BPS must equal 0');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_ROLLOUT_SALT: 'legacy-salt',
    }))).toThrow('INTERVIEW_ROLLOUT_SALT must be empty');
  });

  test('pins the effective free quota and session retention contract', () => {
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_FREE_MONTHLY_LIMIT: '2',
    }))).toThrow('INTERVIEW_FREE_MONTHLY_LIMIT must effectively equal 1');
    expect(() => assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_RETENTION_DAYS: '91',
    }))).toThrow('INTERVIEW_RETENTION_DAYS must effectively equal 90');

    expect(assertInterviewRuntimeSafety(productionEnv({
      INTERVIEW_FREE_MONTHLY_LIMIT: '1.9',
      INTERVIEW_RETENTION_DAYS: '90.9',
    }))).toEqual({
      required: true,
      environment: 'production-public',
      database: 'frontendatlas',
    });
  });
});
