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
const {
  captureInterviewIssueSignal,
  captureMetric,
  isSentryConfigured,
  isSentryInitialized,
} = require('../../config/sentry');
const { metricsEnabled } = require('../../middleware/observability');
const { emitInterviewEvent, telemetryEnabled } = require('./telemetry');
const {
  EXPOSURE_COLLECTION_NAME,
  verifyInterviewExposureIndexes,
} = require('./exposure-index-verifier');

const RELEASE_ACCESS_MODES = new Set(['cohort', 'public']);
const PREFLIGHT_ACCESS_MODE = 'preflight';
const REDIS_PROBE_CACHE_MS = 10_000;
const REDIS_PROBE_TTL_SECONDS = 30;
const EXPOSURE_PROBE_CACHE_MS = 10_000;
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
let exposureProbeCache = null;
let exposureProbeInFlight = null;

function readinessGateProfile(accessMode, operationalState) {
  if (operationalState !== 'normal') return 'disabled';
  if (accessMode === PREFLIGHT_ACCESS_MODE) return 'preflight';
  if (RELEASE_ACCESS_MODES.has(accessMode)) return 'release';
  return 'disabled';
}

function previewRedisRequired(env = process.env) {
  return String(env.VERCEL_ENV || '').trim().toLowerCase() === 'preview';
}

function redisRequiredForGate(gateProfile, env = process.env) {
  return gateProfile === 'release'
    || (gateProfile === 'preflight' && previewRedisRequired(env));
}

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

function monitoringReadinessStatus({
  env = process.env,
  operatorStatus,
  sentryInitialized = isSentryInitialized(),
} = {}) {
  const gate = operatorStatus || operatorGateStatus(env, 'INTERVIEW_MONITORING_READY');
  const attested = Boolean(gate.attested ?? gate.ready);
  const sentryReady = isSentryConfigured(env) && Boolean(sentryInitialized);
  const telemetryReady = telemetryEnabled(env) && metricsEnabled(env);
  const code = !attested
    ? 'not_attested'
    : (!sentryReady
      ? 'sentry_not_configured'
      : (telemetryReady ? 'ready' : 'telemetry_disabled'));
  return {
    configured: Boolean(gate.configured),
    attested,
    ready: code === 'ready',
    code,
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

function exposureProbeFingerprint(env = process.env) {
  return crypto
    .createHash('sha256')
    .update([
      String(env.MONGO_TARGET || '').trim().toLowerCase(),
      String(env.EXPECTED_MONGO_DB_NAME || '').trim(),
      String(env.EXPECTED_MONGO_DB_NAME_TEST || '').trim(),
      EXPOSURE_COLLECTION_NAME,
    ].join('\n'))
    .digest('hex');
}

function exposureReportCode(report) {
  if (report?.ok === true) return 'ready';
  if (report?.retention?.valid === false) return 'retention_mismatch';
  if (Number(report?.summary?.mismatchedCount) > 0) return 'indexes_mismatched';
  if (Number(report?.summary?.missingCount) > 0) return 'indexes_missing';
  return 'invalid_contract';
}

function exposureSummary(report) {
  return {
    requiredCount: Math.max(0, Number(report?.summary?.requiredCount) || 0),
    validCount: Math.max(0, Number(report?.summary?.validCount) || 0),
    missingCount: Math.max(0, Number(report?.summary?.missingCount) || 0),
    mismatchedCount: Math.max(0, Number(report?.summary?.mismatchedCount) || 0),
    unexpectedCount: Math.max(0, Number(report?.summary?.unexpectedCount) || 0),
  };
}

async function defaultExposureCollection() {
  const {
    connectToMongo,
    resolveMongoConnectionConfig,
  } = require('../../config/mongo');
  const { uri } = resolveMongoConnectionConfig();
  const connection = await connectToMongo(uri);
  return connection.collection(EXPOSURE_COLLECTION_NAME);
}

async function probeInterviewExposureStore({
  env = process.env,
  collection,
  getCollection = defaultExposureCollection,
  force = false,
  now = Date.now(),
} = {}) {
  const fingerprint = exposureProbeFingerprint(env);
  if (
    !force
    && exposureProbeCache?.fingerprint === fingerprint
    && now < exposureProbeCache.expiresAt
  ) {
    return { ...exposureProbeCache.value, cached: true };
  }
  if (!force && exposureProbeInFlight?.fingerprint === fingerprint) {
    return exposureProbeInFlight.promise;
  }

  const startedAt = Date.now();
  const promise = (async () => {
    let value;
    try {
      const targetCollection = collection || await getCollection();
      const report = await verifyInterviewExposureIndexes({ collection: targetCollection });
      const code = exposureReportCode(report);
      value = {
        configured: true,
        ready: code === 'ready',
        code,
        latencyMs: Math.max(0, Date.now() - startedAt),
        cached: false,
        summary: exposureSummary(report),
      };
    } catch (error) {
      value = {
        configured: false,
        ready: false,
        code: error?.code === 'INTERVIEW_EXPOSURE_INDEX_READ_FAILED'
          ? 'index_read_failed'
          : 'connection_error',
        latencyMs: Math.max(0, Date.now() - startedAt),
        cached: false,
        summary: exposureSummary(),
      };
    }
    exposureProbeCache = {
      fingerprint,
      expiresAt: Date.now() + EXPOSURE_PROBE_CACHE_MS,
      value,
    };
    return value;
  })();

  exposureProbeInFlight = { fingerprint, promise };
  try {
    return await promise;
  } finally {
    if (exposureProbeInFlight?.promise === promise) exposureProbeInFlight = null;
  }
}

function normalizeExposureStatus({ exposureStatus, exposureReady }) {
  if (exposureStatus && typeof exposureStatus === 'object') {
    const ready = Boolean(exposureStatus.ready);
    return {
      configured: Boolean(exposureStatus.configured ?? true),
      ready,
      code: ready ? 'ready' : String(exposureStatus.code || 'invalid_contract'),
      latencyMs: Math.max(0, Number(exposureStatus.latencyMs) || 0),
      cached: Boolean(exposureStatus.cached),
      summary: exposureSummary({ summary: exposureStatus.summary }),
    };
  }
  if (typeof exposureReady === 'boolean') {
    return {
      configured: exposureReady,
      ready: exposureReady,
      code: exposureReady ? 'ready' : 'indexes_missing',
      latencyMs: 0,
      cached: false,
      summary: exposureSummary(),
    };
  }
  return {
    configured: false,
    ready: false,
    code: 'probe_not_run',
    latencyMs: 0,
    cached: false,
    summary: exposureSummary(),
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
  exposureStatus,
  exposureReady,
  monitoringStatus,
  nativeSafariStatus,
  sentryInitialized = isSentryInitialized(),
  env = process.env,
  now = new Date(),
} = {}) {
  const startedAt = Date.now();
  const gateProfile = readinessGateProfile(accessMode, operationalState);
  const gateRequired = gateProfile !== 'disabled';
  const releaseRequired = gateProfile === 'release';
  const preflightRequired = gateProfile === 'preflight';
  const redisRequired = redisRequiredForGate(gateProfile, env);
  const exposureRequired = gateRequired;
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
  const exposureStore = normalizeExposureStatus({ exposureStatus, exposureReady });
  const monitoring = monitoringReadinessStatus({
    env,
    operatorStatus: monitoringStatus,
    sentryInitialized,
  });
  const nativeSafari = nativeSafariStatus || operatorGateStatus(env, 'INTERVIEW_NATIVE_SAFARI_READY');
  const dependenciesReady = (
    (!redisRequired || redis.ready)
    && (!exposureRequired || exposureStore.ready)
    && cohortReady
    && (!releaseRequired || monitoring.ready)
    && (!releaseRequired || nativeSafari.ready)
  );
  const gateChecksReady = artifactsReady && dependenciesReady;
  const gateReady = gateRequired && gateChecksReady;
  const launchReady = releaseRequired && gateReady;
  return {
    ok: !gateRequired || gateReady,
    gateProfile,
    gateRequired,
    gateReady,
    launchReady,
    code: !gateRequired
      ? 'INTERVIEW_RELEASE_DISABLED'
      : (gateChecksReady
        ? (preflightRequired ? 'INTERVIEW_PREFLIGHT_READY' : 'INTERVIEW_RELEASE_READY')
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
        required: redisRequired,
        configured: redis.configured,
        ready: redis.ready,
        code: redis.code,
        latencyMs: redis.latencyMs,
        cached: redis.cached,
      },
      exposureStore: {
        required: exposureRequired,
        configured: exposureStore.configured,
        ready: exposureStore.ready,
        code: exposureStore.code,
        latencyMs: exposureStore.latencyMs,
        cached: exposureStore.cached,
        summary: exposureStore.summary,
      },
      cohort: {
        required: cohortRequired,
        ready: cohortReady,
      },
      monitoring: {
        required: releaseRequired,
        configured: Boolean(monitoring.configured),
        ready: Boolean(monitoring.ready),
        attested: Boolean(monitoring.attested),
        code: monitoring.code,
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
  const gateProfile = readinessGateProfile(accessMode, operationalState);
  const redisRequired = redisRequiredForGate(gateProfile, env);
  const exposureRequired = gateProfile !== 'disabled';
  const redisStatus = options.redisStatus || (redisRequired
    ? await probeRedisRateLimit({
      env,
      fetchImpl: options.fetchImpl,
      force: options.forceRedisProbe,
    })
    : undefined);
  const exposureStatus = options.exposureStatus || (
    options.exposureReady === undefined && exposureRequired
      ? await probeInterviewExposureStore({
        env,
        collection: options.exposureCollection,
        getCollection: options.getExposureCollection,
        force: options.forceExposureProbe,
      })
      : undefined
  );
  const snapshot = interviewReadinessSnapshot({
    ...options,
    env,
    accessMode,
    operationalState,
    redisStatus,
    exposureStatus,
  });
  const result = {
    ...snapshot,
    durationMs: Math.max(0, Date.now() - startedAt),
  };
  const redis = result.dependencies.redisRateLimit;
  const exposureStore = result.dependencies.exposureStore;
  const monitoring = result.dependencies.monitoring;
  const attributes = {
    access_mode: result.accessMode,
    exposure_code: exposureStore.code,
    gate_profile: result.gateProfile,
    monitoring_code: monitoring.code,
    operational_state: result.operationalState,
    readiness_code: result.code,
    redis_code: redis.code,
  };
  emitInterviewEvent('readiness_checked', {
    accessMode: result.accessMode,
    exposureCode: exposureStore.code,
    gateProfile: result.gateProfile,
    operationalState: result.operationalState,
    operation: 'release-gate',
    outcome: result.gateReady ? 'ready' : 'blocked',
    readinessCode: result.code,
    monitoringCode: monitoring.code,
    redisCode: redis.code,
  }, { env });
  captureMetric('gauge', 'interview.readiness.ready', result.gateReady ? 1 : 0, {
    attributes,
  });
  if (result.gateRequired && !result.gateReady) {
    captureInterviewIssueSignal('readiness_blocked', {
      operation: 'release-gate',
      code: result.code,
      status: 503,
    });
  }
  if (redis.required && !redis.ready) {
    captureInterviewIssueSignal('redis_degraded', {
      operation: 'release-gate',
      code: redis.code,
      status: 503,
    });
  }
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
  exposureProbeCache = null;
  exposureProbeInFlight = null;
}

module.exports = {
  EXPOSURE_PROBE_CACHE_MS,
  PREFLIGHT_ACCESS_MODE,
  REDIS_PROBE_CACHE_MS,
  REDIS_PROBE_TTL_SECONDS,
  RELEASE_ACCESS_MODES,
  interviewReadinessSnapshot,
  interviewReleaseReadiness,
  monitoringReadinessStatus,
  probeInterviewExposureStore,
  probeRedisRateLimit,
  readinessGateProfile,
  redisRateLimitConfigured,
  resetInterviewReadinessCache,
};
