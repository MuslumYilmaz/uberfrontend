'use strict';

const path = require('path');
const {
  INTERVIEW_ACCESS_MODES,
  resolveInterviewAudience,
} = require('./access');
const {
  interviewOperationalPolicy,
  interviewOperationalState,
} = require('./operational');

const CONTENT_DIR = path.resolve(__dirname, '../../content/interview');
const DEFAULT_BANK_PREFIX = 'frontend-interview-bank-v1';
const DEFAULT_CODING_PREFIX = 'interview-coding-registry-v1';
const DEFAULT_SYSTEM_DESIGN_PREFIX = 'interview-system-design-registry-v1';
const CANDIDATE_ARTIFACT_ENVIRONMENTS = new Set(['development', 'test']);
const SYSTEM_DESIGN_SECONDS = Object.freeze({
  junior: 10 * 60,
  mid: 15 * 60,
  senior: 20 * 60,
});
const DEFAULT_MCQ_SECONDS_BY_LEVEL = Object.freeze({
  junior: 10 * 60,
  mid: 12 * 60,
  senior: 15 * 60,
});

function envPositiveInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function envBoundedInt(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (process.env[name] === undefined) return fallback;
  const parsed = Number(process.env[name]);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function interviewRolloutBasisPoints() {
  if (process.env.INTERVIEW_ROLLOUT_BPS !== undefined) {
    return envBoundedInt('INTERVIEW_ROLLOUT_BPS', 0, { min: 0, max: 10_000 });
  }
  return envBoundedInt('INTERVIEW_COHORT_BPS', 0, { min: 0, max: 10_000 });
}

function interviewCohortBasisPoints() {
  return interviewRolloutBasisPoints();
}

function interviewCohortSalt() {
  return String(
    process.env.INTERVIEW_ROLLOUT_SALT
    ?? process.env.INTERVIEW_COHORT_SALT
    ?? ''
  ).trim();
}

function interviewModeAccessMode() {
  const rawAccessMode = process.env.INTERVIEW_MODE_ACCESS;
  if (rawAccessMode !== undefined) {
    const configured = String(rawAccessMode).trim().toLowerCase();
    return INTERVIEW_ACCESS_MODES.includes(configured) ? configured : 'off';
  }

  // Conservative fallback for an existing deployment: legacy `true` enables
  // only the admin preview, never public access. INTERVIEW_MODE_ACCESS always
  // wins, including the fail-closed "off" state.
  return String(process.env.INTERVIEW_MODE_ENABLED || '').trim().toLowerCase() === 'true'
    ? 'internal'
    : 'off';
}

function interviewModeAudience(role, { userId } = {}) {
  const mode = interviewModeAccessMode();
  return resolveInterviewAudience({
    mode,
    role,
    userId,
    cohortBasisPoints: interviewCohortBasisPoints(),
    cohortSalt: interviewCohortSalt(),
  });
}

function interviewModeAccess(role, options) {
  const audience = interviewModeAudience(role, options);
  return {
    mode: audience.mode,
    enabled: audience.enabled,
    internalPreview: audience.internalPreview,
  };
}

function interviewModeEnabled() {
  return interviewModeAccessMode() !== 'off';
}

function interviewSystemDesignAccessMode() {
  const configured = String(process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS || 'off')
    .trim()
    .toLowerCase();
  return INTERVIEW_ACCESS_MODES.includes(configured) ? configured : 'off';
}

function interviewSystemDesignAccess(role, { userId } = {}) {
  const interviewAccess = interviewModeAudience(role, { userId });
  const mode = interviewSystemDesignAccessMode();
  const systemDesignAudience = resolveInterviewAudience({
    mode,
    role,
    userId,
    cohortBasisPoints: interviewCohortBasisPoints(),
    cohortSalt: interviewCohortSalt(),
  });
  const internalPreview = interviewAccess.enabled && systemDesignAudience.internalPreview;
  return {
    mode,
    enabled: interviewAccess.enabled && systemDesignAudience.enabled,
    internalPreview,
  };
}

function interviewConfig() {
  const accessMode = interviewModeAccessMode();
  const systemDesignAccessMode = interviewSystemDesignAccessMode();
  const operationalPolicy = interviewOperationalPolicy();
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const maxDraftTotalBytes = envPositiveInt(
    'INTERVIEW_MAX_DRAFT_TOTAL_BYTES',
    500 * 1024,
    // Keep the decoded draft within a request envelope that also fits the
    // hosting platform's request-size ceiling after worst-case JSON escaping.
    { min: 1024, max: 500 * 1024 }
  );
  const legacyMcqSeconds = process.env.INTERVIEW_MCQ_SECONDS === undefined
    ? null
    : envPositiveInt(
      'INTERVIEW_MCQ_SECONDS',
      DEFAULT_MCQ_SECONDS_BY_LEVEL.junior,
      { min: 60, max: 60 * 60 }
    );
  const mcqSecondsByLevel = Object.fromEntries(
    Object.entries(DEFAULT_MCQ_SECONDS_BY_LEVEL).map(([level, fallback]) => [
      level,
      envPositiveInt(
        `INTERVIEW_MCQ_${level.toUpperCase()}_SECONDS`,
        legacyMcqSeconds ?? fallback,
        { min: 60, max: 60 * 60 }
      ),
    ])
  );
  return {
    accessMode,
    enabled: accessMode !== 'off',
    cohortBasisPoints: interviewCohortBasisPoints(),
    rolloutBasisPoints: interviewCohortBasisPoints(),
    cohortSaltConfigured: Boolean(interviewCohortSalt()),
    rolloutSaltConfigured: Boolean(interviewCohortSalt()),
    operationalState: operationalPolicy.state,
    bankPaths: {
      public: path.resolve(
        process.env.INTERVIEW_BANK_PUBLIC_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_BANK_PREFIX}.public.json`)
      ),
      private: path.resolve(
        process.env.INTERVIEW_BANK_PRIVATE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_BANK_PREFIX}.private.json`)
      ),
      release: path.resolve(
        process.env.INTERVIEW_BANK_RELEASE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_BANK_PREFIX}.release.json`)
      ),
    },
    codingPaths: {
      public: path.resolve(
        process.env.INTERVIEW_CODING_PUBLIC_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_CODING_PREFIX}.public.json`)
      ),
      private: path.resolve(
        process.env.INTERVIEW_CODING_PRIVATE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_CODING_PREFIX}.private.json`)
      ),
      release: path.resolve(
        process.env.INTERVIEW_CODING_RELEASE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_CODING_PREFIX}.release.json`)
      ),
    },
    systemDesignAccessMode,
    systemDesignPaths: {
      public: path.resolve(
        process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_SYSTEM_DESIGN_PREFIX}.public.json`)
      ),
      private: path.resolve(
        process.env.INTERVIEW_SYSTEM_DESIGN_PRIVATE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_SYSTEM_DESIGN_PREFIX}.private.json`)
      ),
      release: path.resolve(
        process.env.INTERVIEW_SYSTEM_DESIGN_RELEASE_PATH
          || path.join(CONTENT_DIR, `${DEFAULT_SYSTEM_DESIGN_PREFIX}.release.json`)
      ),
    },
    allowCandidate: (
      CANDIDATE_ARTIFACT_ENVIRONMENTS.has(nodeEnv)
      && String(process.env.INTERVIEW_ALLOW_CANDIDATE_BANK || '').trim().toLowerCase() === 'true'
    ),
    freeMonthlyLimit: envPositiveInt('INTERVIEW_FREE_MONTHLY_LIMIT', 1, { max: 20 }),
    createRateLimitWindowMs: envPositiveInt(
      'INTERVIEW_CREATE_RATE_LIMIT_WINDOW_MS',
      24 * 60 * 60 * 1000,
      { min: 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }
    ),
    createUserRateLimitMax: envPositiveInt(
      'INTERVIEW_CREATE_USER_RATE_LIMIT_MAX',
      10,
      { max: 1000 }
    ),
    createIpRateLimitMax: envPositiveInt(
      'INTERVIEW_CREATE_IP_RATE_LIMIT_MAX',
      20,
      { max: 5000 }
    ),
    abandonRateLimitMax: envPositiveInt(
      'INTERVIEW_ABANDON_RATE_LIMIT_MAX',
      3,
      { max: 20 }
    ),
    mutationRateLimitWindowMs: envPositiveInt(
      'INTERVIEW_MUTATION_RATE_LIMIT_WINDOW_MS',
      60 * 1000,
      { min: 1000, max: 60 * 60 * 1000 }
    ),
    mutationRateLimitMax: envPositiveInt(
      'INTERVIEW_MUTATION_RATE_LIMIT_MAX',
      300,
      { max: 10_000 }
    ),
    systemDesignFreeMonthlyLimit: envPositiveInt(
      'INTERVIEW_SYSTEM_DESIGN_FREE_MONTHLY_LIMIT',
      1,
      { max: 20 }
    ),
    // `mcqSeconds` remains as a compatibility scalar for older clients and
    // legacy sessions. New sessions snapshot the selected level's value.
    mcqSeconds: mcqSecondsByLevel.junior,
    mcqSecondsByLevel,
    mcqMaxIngressSeconds: envPositiveInt(
      'INTERVIEW_MCQ_MAX_INGRESS_SECONDS',
      5,
      { min: 1, max: 30 }
    ),
    codingReadySeconds: envPositiveInt(
      'INTERVIEW_CODING_READY_SECONDS',
      5 * 60,
      { min: 30, max: 30 * 60 }
    ),
    retentionDays: envPositiveInt('INTERVIEW_RETENTION_DAYS', 90, { min: 1, max: 365 }),
    maxDraftFiles: envPositiveInt('INTERVIEW_MAX_DRAFT_FILES', 30, { max: 100 }),
    maxDraftFileBytes: envPositiveInt(
      'INTERVIEW_MAX_DRAFT_FILE_BYTES',
      100 * 1024,
      { min: 1024, max: 1024 * 1024 }
    ),
    maxDraftTotalBytes,
    // JSON may encode one decoded byte as a six-byte `\u00xx` escape. The
    // bounded envelope also leaves room for paths and request metadata.
    httpBodyLimitBytes: (maxDraftTotalBytes * 6) + (64 * 1024),
    maxCheckRuns: envPositiveInt('INTERVIEW_MAX_CHECK_RUNS', 50, { max: 200 }),
    systemDesignSeconds: { ...SYSTEM_DESIGN_SECONDS },
    maxSystemDesignScratchpadChars: 200,
    maxSystemDesignConnections: 40,
  };
}

module.exports = {
  INTERVIEW_ACCESS_MODES,
  interviewConfig,
  interviewCohortBasisPoints,
  interviewModeAudience,
  interviewModeAccess,
  interviewModeAccessMode,
  interviewModeEnabled,
  interviewRolloutBasisPoints,
  interviewSystemDesignAccess,
  interviewSystemDesignAccessMode,
  interviewOperationalPolicy,
  interviewOperationalState,
};
