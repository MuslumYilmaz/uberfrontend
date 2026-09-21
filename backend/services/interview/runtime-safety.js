'use strict';

const { normalizeAccessMode } = require('./access');
const {
  resolveExactInterviewMongoConfig,
  resolveSafeInterviewTestMongoConfig,
} = require('./mongo-tool-safety');

const PREVIEW_RATE_LIMIT_NAMESPACE = 'frontendatlas:preview:interview:v1';
const PRODUCTION_RATE_LIMIT_NAMESPACE = 'frontendatlas:production:interview:v1';
const PRODUCTION_FREE_MONTHLY_LIMIT = 1;
const PRODUCTION_RETENTION_DAYS = 90;

class InterviewRuntimeSafetyError extends Error {
  constructor(message) {
    super(`Interview runtime is unsafe: ${message}`);
    this.name = 'InterviewRuntimeSafetyError';
    this.code = 'INTERVIEW_RUNTIME_UNSAFE';
  }
}

class InterviewPreflightRuntimeError extends InterviewRuntimeSafetyError {
  constructor(message) {
    super(message);
    this.name = 'InterviewPreflightRuntimeError';
    this.code = 'INTERVIEW_PREFLIGHT_RUNTIME_UNSAFE';
  }
}

function valueOf(env, name) {
  return String(env?.[name] || '').trim();
}

function fail(message, ErrorType = InterviewRuntimeSafetyError) {
  throw new ErrorType(message);
}

function assertExactSetting(env, name, expected, ErrorType) {
  const actual = valueOf(env, name).toLowerCase();
  if (actual !== expected.toLowerCase()) {
    fail(`${name} must exactly equal ${expected}`, ErrorType);
  }
}

function assertRedisScope(env, namespace, ErrorType) {
  assertExactSetting(env, 'RATE_LIMIT_STORE', 'redis', ErrorType);
  if (valueOf(env, 'RATE_LIMIT_NAMESPACE') !== namespace) {
    fail(`RATE_LIMIT_NAMESPACE must exactly equal ${namespace}`, ErrorType);
  }
}

function assertSystemDesignOff(env, ErrorType) {
  assertExactSetting(env, 'INTERVIEW_SYSTEM_DESIGN_ACCESS', 'off', ErrorType);
}

function effectivePositiveInt(env, name, fallback, {
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
} = {}) {
  const parsed = Number(env?.[name]);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function assertEffectivePositiveInt(env, name, expected, options) {
  const actual = effectivePositiveInt(env, name, expected, options);
  if (actual !== expected) {
    fail(`${name} must effectively equal ${expected}`);
  }
}

function safeTestMongoConfig(env, options) {
  try {
    return resolveSafeInterviewTestMongoConfig(env, options);
  } catch (error) {
    fail(
      error instanceof Error ? error.message : 'the test MongoDB contract is invalid',
      InterviewPreflightRuntimeError
    );
  }
}

function assertInterviewPreflightRuntime(env = process.env) {
  if (normalizeAccessMode(env?.INTERVIEW_MODE_ACCESS) !== 'preflight') {
    return {
      required: false,
      environment: 'disabled',
      database: null,
    };
  }

  const nodeEnv = valueOf(env, 'NODE_ENV').toLowerCase();
  const vercelEnv = valueOf(env, 'VERCEL_ENV').toLowerCase();
  const isVercelRuntime = Boolean(valueOf(env, 'VERCEL')) || Boolean(vercelEnv);

  if (vercelEnv === 'preview') {
    if (valueOf(env, 'MONGO_URL')) {
      fail(
        'MONGO_URL must not exist in the Vercel Preview environment scope',
        InterviewPreflightRuntimeError
      );
    }
    const config = safeTestMongoConfig(env, { requireLoopback: false });
    assertSystemDesignOff(env, InterviewPreflightRuntimeError);
    assertRedisScope(env, PREVIEW_RATE_LIMIT_NAMESPACE, InterviewPreflightRuntimeError);
    return {
      required: true,
      environment: 'preview',
      database: config.database,
    };
  }

  if (isVercelRuntime) {
    fail('Vercel preflight requires exact VERCEL_ENV=preview', InterviewPreflightRuntimeError);
  }
  if (nodeEnv === 'production') {
    fail('preflight is forbidden in a Production runtime', InterviewPreflightRuntimeError);
  }

  const config = safeTestMongoConfig(env, { requireLoopback: true });
  assertSystemDesignOff(env, InterviewPreflightRuntimeError);
  assertExactSetting(env, 'RATE_LIMIT_STORE', 'memory', InterviewPreflightRuntimeError);
  return {
    required: true,
    environment: 'local',
    database: config.database,
  };
}

function assertInterviewProductionPublicRuntime(env = process.env) {
  const accessMode = normalizeAccessMode(env?.INTERVIEW_MODE_ACCESS);
  const vercelEnv = valueOf(env, 'VERCEL_ENV').toLowerCase();
  if (accessMode !== 'public' || vercelEnv !== 'production') {
    return {
      required: false,
      environment: 'disabled',
      database: null,
    };
  }

  assertExactSetting(env, 'MONGO_TARGET', 'production');
  if (valueOf(env, 'MONGO_URL_TEST')) {
    fail('MONGO_URL_TEST must not exist in the Vercel Production environment scope');
  }
  const expectedDatabase = valueOf(env, 'EXPECTED_MONGO_DB_NAME');
  const config = safeExactMongoConfig(env, {
    database: expectedDatabase,
    requireLoopback: false,
  });
  if (config.target !== 'production') {
    fail('Vercel Production public access requires exact MONGO_TARGET=production');
  }
  assertSystemDesignOff(env);
  assertEffectivePositiveInt(
    env,
    'INTERVIEW_FREE_MONTHLY_LIMIT',
    PRODUCTION_FREE_MONTHLY_LIMIT,
    { max: 20 }
  );
  assertEffectivePositiveInt(
    env,
    'INTERVIEW_RETENTION_DAYS',
    PRODUCTION_RETENTION_DAYS,
    { min: 1, max: 365 }
  );
  assertRedisScope(env, PRODUCTION_RATE_LIMIT_NAMESPACE);
  if (Number(valueOf(env, 'INTERVIEW_ROLLOUT_BPS') || 0) !== 0) {
    fail('INTERVIEW_ROLLOUT_BPS must equal 0 for direct public release');
  }
  if (valueOf(env, 'INTERVIEW_ROLLOUT_SALT')) {
    fail('INTERVIEW_ROLLOUT_SALT must be empty for direct public release');
  }

  return {
    required: true,
    environment: 'production-public',
    database: config.database,
  };
}

function safeExactMongoConfig(env, options) {
  try {
    return resolveExactInterviewMongoConfig(env, options);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'the Production MongoDB contract is invalid');
  }
}

function assertInterviewRuntimeSafety(env = process.env) {
  if (normalizeAccessMode(env?.INTERVIEW_MODE_ACCESS) === 'preflight') {
    return assertInterviewPreflightRuntime(env);
  }
  return assertInterviewProductionPublicRuntime(env);
}

module.exports = {
  PREVIEW_RATE_LIMIT_NAMESPACE,
  PRODUCTION_RATE_LIMIT_NAMESPACE,
  InterviewPreflightRuntimeError,
  InterviewRuntimeSafetyError,
  assertInterviewPreflightRuntime,
  assertInterviewProductionPublicRuntime,
  assertInterviewRuntimeSafety,
};
