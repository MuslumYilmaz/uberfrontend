'use strict';

const crypto = require('crypto');
const {
  loadInterviewArtifacts,
  loadSystemDesignArtifacts,
} = require('./artifacts');
const {
  interviewConfig,
  interviewModeAccessMode,
  interviewOperationalState,
  interviewSystemDesignAccessMode,
} = require('./config');
const {
  runUpstashPipeline,
  upstashConfigured,
} = require('../upstash-pipeline');
const { captureMetric } = require('../../config/sentry');
const { emitInterviewEvent } = require('./telemetry');

const RELEASE_ACCESS_MODES = new Set(['cohort', 'public']);
const REDIS_PROBE_CACHE_MS = 10_000;
const REDIS_PROBE_TTL_SECONDS = 30;
const REDIS_STATUS_CODES = new Set([
  'not_configured',
  'timeout',
  'network_error',
  'http_error',
  'invalid_response',
  'command_error',
]);

const REDIS_READINESS_SCRIPT = [
  "local count = redis.call('INCR', KEYS[1])",
  "redis.call('EXPIRE', KEYS[1], ARGV[1])",
  "local ttl = redis.call('TTL', KEYS[1])",
  'return {count, ttl}',
].join('\n');

let redisProbeCache = null;
let redisProbeInFlight = null;

function redisRateLimitConfigured(env = process.env) {
  const store = String(env.RATE_LIMIT_STORE || 'auto').trim().toLowerCase();
  if (['memory', 'local', 'in-memory'].includes(store)) return false;
  return upstashConfigured(env);
}

function operatorGateStatus(env, name) {
  const raw = env[name];
  return {
    configured: raw !== undefined && String(raw).trim() !== '',
    ready: String(raw || '').trim().toLowerCase() === 'true',
  };
}

function artifactProbe(loader) {
  try {
    const artifact = loader();
    return {
      ready: true,
      status: String(artifact?.status || artifact?.bank?.status || 'ready'),
    };
  } catch {
    return { ready: false, status: 'blocked' };
  }
}

function redisProbeFingerprint(env) {
  return crypto
    .createHash('sha256')
    .update([
      String(env.RATE_LIMIT_STORE || 'auto').trim().toLowerCase(),
      String(env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim(),
      String(env.UPSTASH_REDIS_REST_URL || '').trim(),
      String(env.UPSTASH_REDIS_REST_TOKEN || '').trim(),
      String(env.RATE_LIMIT_REDIS_TIMEOUT_MS || ''),
    ].join('\n'))
    .digest('hex');
}

function normalizedRedisFailureCode(error) {
  return REDIS_STATUS_CODES.has(error?.code) ? error.code : 'invalid_response';
}

function validateRedisProbeResult(payload) {
  const result = payload?.[0]?.result;
  if (!Array.isArray(result) || result.length !== 2) return false;
  const [count, ttl] = result;
  return Number.isSafeInteger(count)
    && count >= 1
    && Number.isSafeInteger(ttl)
    && ttl >= 1
    && ttl <= REDIS_PROBE_TTL_SECONDS;
}

async function probeRedisRateLimit({
  env = process.env,
  fetchImpl,
  force = false,
  now = Date.now(),
} = {}) {
  const configured = redisRateLimitConfigured(env);
  if (!configured) {
    return {
      configured: false,
      ready: false,
      code: 'not_configured',
      latencyMs: 0,
      cached: false,
    };
  }

  const fingerprint = redisProbeFingerprint(env);
  if (
    !force
    && redisProbeCache?.fingerprint === fingerprint
    && now < redisProbeCache.expiresAt
  ) {
    return { ...redisProbeCache.value, cached: true };
  }
  if (!force && redisProbeInFlight?.fingerprint === fingerprint) {
    return redisProbeInFlight.promise;
  }

  const namespace = String(env.RATE_LIMIT_NAMESPACE || 'frontendatlas').trim() || 'frontendatlas';
  const probeKey = `health:${namespace}:interview-rate-limit`;
  const startedAt = Date.now();
  const promise = (async () => {
    let value;
    try {
      const payload = await runUpstashPipeline([
        [
          'EVAL',
          REDIS_READINESS_SCRIPT,
          1,
          probeKey,
          REDIS_PROBE_TTL_SECONDS,
        ],
      ], { env, fetchImpl });
      if (!validateRedisProbeResult(payload)) {
        const invalid = new Error('Invalid Redis readiness response');
        invalid.code = 'invalid_response';
        throw invalid;
      }
      value = {
        configured: true,
        ready: true,
        code: 'ready',
        latencyMs: Math.max(0, Date.now() - startedAt),
        cached: false,
      };
    } catch (error) {
      value = {
        configured: true,
        ready: false,
        code: normalizedRedisFailureCode(error),
        latencyMs: Math.max(0, Date.now() - startedAt),
        cached: false,
      };
    }
    redisProbeCache = {
      fingerprint,
      expiresAt: Date.now() + REDIS_PROBE_CACHE_MS,
      value,
    };
    return value;
  })();

  redisProbeInFlight = { fingerprint, promise };
  try {
    return await promise;
  } finally {
    if (redisProbeInFlight?.promise === promise) redisProbeInFlight = null;
  }
}

function normalizeRedisStatus({ redisStatus, redisReady, env }) {
  if (redisStatus && typeof redisStatus === 'object') {
    const ready = Boolean(redisStatus.ready);
    const rawCode = String(redisStatus.code || '');
    return {
      configured: Boolean(redisStatus.configured),
      ready,
      code: ready
        ? 'ready'
        : (REDIS_STATUS_CODES.has(rawCode) ? rawCode : 'invalid_response'),
      latencyMs: Math.max(0, Number(redisStatus.latencyMs) || 0),
      cached: Boolean(redisStatus.cached),
    };
  }
  if (typeof redisReady === 'boolean') {
    return {
      configured: redisReady || redisRateLimitConfigured(env),
      ready: redisReady,
      code: redisReady ? 'ready' : 'not_configured',
      latencyMs: 0,
      cached: false,
    };
  }
  const configured = redisRateLimitConfigured(env);
  return {
    configured,
    ready: false,
    code: configured ? 'probe_not_run' : 'not_configured',
    latencyMs: 0,
    cached: false,
  };
}

function interviewReadinessSnapshot({
  accessMode = interviewModeAccessMode(),
  systemDesignAccessMode = interviewSystemDesignAccessMode(),
  operationalState = interviewOperationalState(),
  loadCoding = () => loadInterviewArtifacts({ allowInternalCandidate: false }),
  loadSystemDesign = () => loadSystemDesignArtifacts({ allowInternalCandidate: false }),
  config = interviewConfig(),
  redisStatus,
  redisReady,
  monitoringStatus,
  nativeSafariStatus,
  env = process.env,
  now = new Date(),
} = {}) {
  const startedAt = Date.now();
  const releaseRequired = RELEASE_ACCESS_MODES.has(accessMode)
    && operationalState === 'normal';
  const systemDesignRequired = releaseRequired
    && RELEASE_ACCESS_MODES.has(systemDesignAccessMode);
  const coding = artifactProbe(loadCoding);
  const systemDesign = systemDesignRequired
    ? artifactProbe(loadSystemDesign)
    : { ready: null, status: 'not-required' };
  const artifactsReady = coding.ready && (!systemDesignRequired || systemDesign.ready === true);
  const cohortRequired = releaseRequired && accessMode === 'cohort';
  const cohortReady = !cohortRequired || Boolean(
    config.cohortSaltConfigured
    && Number(config.cohortBasisPoints) > 0
  );
  const redis = normalizeRedisStatus({ redisStatus, redisReady, env });
  const monitoring = monitoringStatus || operatorGateStatus(env, 'INTERVIEW_MONITORING_READY');
  const nativeSafari = nativeSafariStatus || operatorGateStatus(env, 'INTERVIEW_NATIVE_SAFARI_READY');
  const dependenciesReady = (
    (!releaseRequired || redis.ready)
    && cohortReady
    && (!releaseRequired || monitoring.ready)
    && (!releaseRequired || nativeSafari.ready)
  );
  const releaseChecksReady = artifactsReady && dependenciesReady;
  const launchReady = releaseRequired && releaseChecksReady;
  return {
    ok: !releaseRequired || launchReady,
    launchReady,
    code: !releaseRequired
      ? 'INTERVIEW_RELEASE_DISABLED'
      : (releaseChecksReady
        ? 'INTERVIEW_RELEASE_READY'
        : (artifactsReady ? 'INTERVIEW_DEPENDENCIES_BLOCKED' : 'INTERVIEW_ARTIFACTS_BLOCKED')),
    checkedAt: new Date(now).toISOString(),
    durationMs: Math.max(0, Date.now() - startedAt),
    accessMode,
    operationalState,
    releaseRequired,
    systemDesignRequired,
    artifacts: { coding, systemDesign },
    dependencies: {
      redisRateLimit: {
        required: releaseRequired,
        configured: redis.configured,
        ready: redis.ready,
        code: redis.code,
        latencyMs: redis.latencyMs,
        cached: redis.cached,
      },
      cohort: {
        required: cohortRequired,
        ready: cohortReady,
      },
      monitoring: {
        required: releaseRequired,
        configured: Boolean(monitoring.configured),
        ready: Boolean(monitoring.ready),
      },
      nativeSafari: {
        required: releaseRequired,
        configured: Boolean(nativeSafari.configured),
        ready: Boolean(nativeSafari.ready),
      },
    },
  };
}

async function interviewReleaseReadiness(options = {}) {
  const startedAt = Date.now();
  const env = options.env || process.env;
  const accessMode = options.accessMode === undefined
    ? interviewModeAccessMode()
    : options.accessMode;
  const operationalState = options.operationalState === undefined
    ? interviewOperationalState()
    : options.operationalState;
  const releaseRequired = RELEASE_ACCESS_MODES.has(accessMode)
    && operationalState === 'normal';
  const redisStatus = options.redisStatus || (releaseRequired
    ? await probeRedisRateLimit({
      env,
      fetchImpl: options.fetchImpl,
      force: options.forceRedisProbe,
    })
    : undefined);
  const snapshot = interviewReadinessSnapshot({
    ...options,
    env,
    accessMode,
    operationalState,
    redisStatus,
  });
  const result = {
    ...snapshot,
    durationMs: Math.max(0, Date.now() - startedAt),
  };
  const redis = result.dependencies.redisRateLimit;
  const attributes = {
    access_mode: result.accessMode,
    operational_state: result.operationalState,
    readiness_code: result.code,
    redis_code: redis.code,
  };
  emitInterviewEvent('readiness_checked', {
    accessMode: result.accessMode,
    operationalState: result.operationalState,
    operation: 'release-gate',
    outcome: result.launchReady ? 'ready' : 'blocked',
    readinessCode: result.code,
    redisCode: redis.code,
  }, { env });
  captureMetric('gauge', 'interview.readiness.ready', result.launchReady ? 1 : 0, {
    attributes,
  });
  if (redis.required) {
    captureMetric('distribution', 'interview.readiness.redis_latency_ms', redis.latencyMs, {
      attributes,
      unit: 'millisecond',
    });
  }
  return result;
}

function resetInterviewReadinessCache() {
  redisProbeCache = null;
  redisProbeInFlight = null;
}

module.exports = {
  REDIS_PROBE_CACHE_MS,
  REDIS_PROBE_TTL_SECONDS,
  RELEASE_ACCESS_MODES,
  interviewReadinessSnapshot,
  interviewReleaseReadiness,
  probeRedisRateLimit,
  redisRateLimitConfigured,
  resetInterviewReadinessCache,
};
