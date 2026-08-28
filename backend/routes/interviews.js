'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/Auth');
const { requireAdmin } = require('../middleware/RequireAdmin');
const { rateLimit } = require('../middleware/rateLimit');
const {
  interviewConfig,
  interviewModeAccess,
  interviewOperationalPolicy,
  interviewSystemDesignAccess,
} = require('../services/interview/config');
const { isPhoneUserAgent } = require('../services/interview/user-agent');
const { interviewReleaseReadiness } = require('../services/interview/readiness');
const { emitInterviewEvent } = require('../services/interview/telemetry');
const { interviewOperation } = require('../services/interview/telemetry-path');
const {
  abandonSession,
  createSession,
  getActiveSession,
  getConfigForUser,
  getResumeSummaryForUser,
  getResults,
  getSession,
  prepareCodingCheckRun,
  recordCodingCheckRun,
  revealSystemDesignTwist,
  saveCodingDraft,
  saveMcqAnswer,
  saveSystemDesignDraft,
  serializeSession,
  startCoding,
  submitCoding,
  submitMcq,
  submitSystemDesign,
  voidSessionTechnicalByAdmin,
} = require('../services/interview/session-service');

function sessionTelemetryFields(session, extra = {}) {
  return {
    format: session?.format,
    level: session?.level,
    track: session?.track,
    statusTo: session?.status,
    ...extra,
  };
}

function emitTerminalTelemetry(session, { operation, replayed } = {}) {
  if (session?.status !== 'completed') return;
  const outcome = (session.format || 'coding') === 'system-design'
    ? session.systemDesignOutcome
    : session.codingOutcome;
  if (['timed_out', 'not_started_timeout'].includes(outcome)) {
    emitInterviewEvent('timed_out', sessionTelemetryFields(session, {
      operation,
      outcome,
      replayed: Boolean(replayed),
    }));
  }
  emitInterviewEvent('completed', sessionTelemetryFields(session, {
    operation,
    outcome,
    replayed: Boolean(replayed),
  }));
}

const limiterConfig = interviewConfig();
function createRequestDedupeKey(req, { includeUser = false } = {}) {
  const requestId = String(
    req.get('Idempotency-Key') || req.body?.requestId || ''
  ).trim();
  if (!requestId) return '';
  return includeUser
    ? `${req?.auth?.userId || 'anonymous'}:${requestId}`
    : requestId;
}

const publicCreateUserLimiter = rateLimit({
  name: 'interview-create-user',
  windowMs: limiterConfig.createRateLimitWindowMs,
  max: limiterConfig.createUserRateLimitMax,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  dedupeKeyGenerator: (req) => createRequestDedupeKey(req),
  code: 'INTERVIEW_CREATE_USER_RATE_LIMITED',
  message: 'Too many interview creation attempts for this account',
  redisFailureMode: 'closed',
});

const publicCreateIpLimiter = rateLimit({
  name: 'interview-create-ip',
  windowMs: limiterConfig.createRateLimitWindowMs,
  max: limiterConfig.createIpRateLimitMax,
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  dedupeKeyGenerator: (req) => createRequestDedupeKey(req, { includeUser: true }),
  code: 'INTERVIEW_CREATE_IP_RATE_LIMITED',
  message: 'Too many interview creation attempts from this network',
  redisFailureMode: 'closed',
});

const internalCreateUserLimiter = rateLimit({
  name: 'interview-create-user',
  windowMs: limiterConfig.createRateLimitWindowMs,
  max: limiterConfig.createUserRateLimitMax,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  dedupeKeyGenerator: (req) => createRequestDedupeKey(req),
  code: 'INTERVIEW_CREATE_USER_RATE_LIMITED',
  message: 'Too many interview creation attempts for this account',
  redisFailureMode: 'open',
});

const internalCreateIpLimiter = rateLimit({
  name: 'interview-create-ip',
  windowMs: limiterConfig.createRateLimitWindowMs,
  max: limiterConfig.createIpRateLimitMax,
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  dedupeKeyGenerator: (req) => createRequestDedupeKey(req, { includeUser: true }),
  code: 'INTERVIEW_CREATE_IP_RATE_LIMITED',
  message: 'Too many interview creation attempts from this network',
  redisFailureMode: 'open',
});

const mutationLimiter = rateLimit({
  name: 'interview-mutations',
  windowMs: limiterConfig.mutationRateLimitWindowMs,
  max: limiterConfig.mutationRateLimitMax,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  code: 'INTERVIEW_MUTATION_RATE_LIMITED',
  message: 'Too many interview updates',
  redisFailureMode: 'open',
});

const publicTwistRevealLimiter = rateLimit({
  name: 'interview-system-design-twist-reveal',
  windowMs: limiterConfig.mutationRateLimitWindowMs,
  max: limiterConfig.mutationRateLimitMax,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  code: 'INTERVIEW_TWIST_REVEAL_RATE_LIMITED',
  message: 'Too many System Design twist reveal attempts',
  redisFailureMode: 'closed',
});

const internalTwistRevealLimiter = rateLimit({
  name: 'interview-system-design-twist-reveal',
  windowMs: limiterConfig.mutationRateLimitWindowMs,
  max: limiterConfig.mutationRateLimitMax,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  code: 'INTERVIEW_TWIST_REVEAL_RATE_LIMITED',
  message: 'Too many System Design twist reveal attempts',
  redisFailureMode: 'open',
});

router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

router.use((req, res, next) => {
  req.interviewTelemetryOperation = interviewOperation(req.path, req.method);
  res.on('finish', () => {
    const rateLimit = res.locals?.rateLimit;
    if (rateLimit?.storeFallback === true) {
      emitInterviewEvent('rate_limit_fallback', {
        operation: req.interviewTelemetryOperation,
        httpStatus: res.statusCode,
        limiter: rateLimit.limiter,
        code: rateLimit.code,
        storeFallback: true,
      });
    }
    if (res.statusCode === 429 && rateLimit?.outcome === 'denied') {
      emitInterviewEvent('rate_denied', {
        operation: req.interviewTelemetryOperation,
        httpStatus: res.statusCode,
        limiter: rateLimit.limiter,
        code: rateLimit.code,
      });
    } else if (res.statusCode === 503 && rateLimit?.outcome === 'unavailable') {
      emitInterviewEvent('rate_limit_unavailable', {
        operation: req.interviewTelemetryOperation,
        httpStatus: res.statusCode,
        limiter: rateLimit.limiter,
        code: rateLimit.code,
      });
    } else if (res.statusCode === 503) {
      emitInterviewEvent('request_failed', {
        operation: req.interviewTelemetryOperation,
        httpStatus: res.statusCode,
      });
    }
  });
  next();
});

function asyncRoute(handler) {
  return function interviewAsyncRoute(req, res, next) {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

router.use((req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    && !req.interviewRequestReceivedAt
  ) {
    req.interviewRequestReceivedAt = new Date();
  }
  next();
});
router.use(requireAuth);
const interviewJsonParser = express.json({
  limit: interviewConfig().httpBodyLimitBytes,
});
router.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.is('application/json')) {
    return res.status(415).json({
      code: 'INTERVIEW_JSON_REQUIRED',
      error: 'Interview requests must use application/json',
    });
  }
  return interviewJsonParser(req, res, (error) => {
    req.interviewRequestCompletedAt = new Date();
    next(error);
  });
});

function activeSessionPolicyFor(policy) {
  return policy.activeSessionPolicy === 'halted' || policy.activeSessionPolicy === 'halt'
    ? 'halted'
    : 'continue';
}

function structuredShutdownNotice(policy) {
  if (!policy.shutdownNotice) return null;
  return {
    code: policy.state === 'halt' ? 'INTERVIEW_HALTED' : 'INTERVIEW_DRAINING',
    message: policy.shutdownNotice,
  };
}

function disabledAvailability({
  access,
  operationalPolicy,
  resumeSummary,
}) {
  const shutdownNotice = structuredShutdownNotice(operationalPolicy);
  return {
    enabled: false,
    protocolVersion: 2,
    accessMode: access.enabled ? access.mode : 'off',
    canCreate: false,
    operationalState: operationalPolicy.state,
    activeSessionPolicy: activeSessionPolicyFor(operationalPolicy),
    ...(shutdownNotice ? { shutdownNotice } : {}),
    unavailableReason: 'Interview Mode is not currently available',
    levels: ['junior', 'mid', 'senior'],
    tracks: ['core-web', 'react', 'angular', 'vue'],
    timingModes: ['standard'],
    timing: null,
    quota: null,
    quotas: {
      coding: null,
      systemDesign: null,
    },
    formats: [
      { id: 'coding', available: false },
      { id: 'system-design', available: false },
    ],
    availability: [],
    systemDesignAvailability: [],
    activeSession: resumeSummary.activeSession,
    lastResults: resumeSummary.lastResults,
    minViewportWidth: 768,
    xpAwarded: 0,
  };
}

function accessForRequest(req) {
  return interviewModeAccess(req.auth?.role || 'user', {
    userId: req.auth?.userId,
  });
}

function systemDesignAccessForRequest(req) {
  return interviewSystemDesignAccess(req.auth?.role || 'user', {
    userId: req.auth?.userId,
  });
}

function operationalPolicyForRequest() {
  return interviewOperationalPolicy();
}

function sendOperationalError(res, policy) {
  const halted = policy.state === 'halt';
  return res.status(503).json({
    code: halted ? 'INTERVIEW_HALTED' : 'INTERVIEW_DRAINING',
    error: policy.shutdownNotice,
  });
}

function requireCreateAllowed(req, res, next) {
  const policy = operationalPolicyForRequest();
  if (!policy.canStartNew) return sendOperationalError(res, policy);
  if (accessForRequest(req).enabled) return next();
  return res.status(404).json({
    code: 'INTERVIEW_MODE_DISABLED',
    error: 'Interview Mode is not currently available',
  });
}

function releaseGateApplies(access, policy) {
  return policy.state === 'normal'
    && access.enabled
    && ['cohort', 'public'].includes(access.mode);
}

function sendLaunchReadinessError(res, readiness = null) {
  const redis = readiness?.dependencies?.redisRateLimit;
  if (redis?.required === true && redis?.ready !== true) {
    if (!res.locals) res.locals = {};
    res.locals.rateLimit = {
      limiter: 'interview-launch-readiness',
      outcome: 'unavailable',
      code: String(redis.code || 'invalid_response').toLowerCase(),
      storeFallback: false,
    };
  }
  return res.status(503).json({
    code: 'INTERVIEW_RELEASE_NOT_READY',
    error: 'Interview Mode is temporarily unavailable',
  });
}

async function requireLaunchReady(req, res, next) {
  try {
    const access = accessForRequest(req);
    const policy = operationalPolicyForRequest();
    if (!releaseGateApplies(access, policy)) return next();
    const readiness = await interviewReleaseReadiness();
    if (readiness.launchReady) return next();
    return sendLaunchReadinessError(res, readiness);
  } catch (error) {
    return next(error);
  }
}

function requireActiveMutationAllowed(_req, res, next) {
  const policy = operationalPolicyForRequest();
  if (policy.routePolicy.activeSession) return next();
  return sendOperationalError(res, policy);
}

function limitSystemDesignTwistReveal(req, res, next) {
  const access = accessForRequest(req);
  const limiter = access.internalPreview
    ? internalTwistRevealLimiter
    : publicTwistRevealLimiter;
  return limiter(req, res, next);
}

function limitCreateUser(req, res, next) {
  const limiter = accessForRequest(req).internalPreview
    ? internalCreateUserLimiter
    : publicCreateUserLimiter;
  return limiter(req, res, next);
}

function limitCreateIp(req, res, next) {
  const limiter = accessForRequest(req).internalPreview
    ? internalCreateIpLimiter
    : publicCreateIpLimiter;
  return limiter(req, res, next);
}

function assertDesktopPreflight(req) {
  const viewportWidth = Number(req.body?.viewportWidth);
  const mobileHint = String(req.get('Sec-CH-UA-Mobile') || '').trim() === '?1';
  const userAgent = String(req.get('User-Agent') || '');
  const phoneUserAgent = isPhoneUserAgent(userAgent);
  if (
    !Number.isInteger(viewportWidth)
    || viewportWidth < 768
    || viewportWidth > 16_384
    || mobileHint
    || phoneUserAgent
  ) {
    const error = new Error('A tablet or desktop viewport is required to start an interview');
    error.statusCode = 400;
    error.code = 'INTERVIEW_DESKTOP_REQUIRED';
    throw error;
  }
}

async function availabilityForRequest(req, res) {
    const access = accessForRequest(req);
    const operationalPolicy = operationalPolicyForRequest();
    if (!access.enabled || operationalPolicy.state !== 'normal') {
      const resumeSummary = await getResumeSummaryForUser(req.auth.userId);
      emitInterviewEvent('availability_checked', {
        accessMode: access.enabled ? access.mode : 'off',
        operationalState: operationalPolicy.state,
        outcome: 'unavailable',
      });
      return res.json(disabledAvailability({
        access,
        operationalPolicy,
        resumeSummary,
      }));
    }
    if (releaseGateApplies(access, operationalPolicy)) {
      const readiness = await interviewReleaseReadiness();
      if (!readiness.launchReady) return sendLaunchReadinessError(res, readiness);
    }
    const systemDesignAccess = systemDesignAccessForRequest(req);
    const config = await getConfigForUser(req.auth.userId, {
      allowCandidateArtifacts: access.internalPreview || systemDesignAccess.internalPreview,
      allowSystemDesign: systemDesignAccess.enabled,
    });
    emitInterviewEvent('availability_checked', {
      accessMode: access.mode,
      operationalState: operationalPolicy.state,
      outcome: 'available',
    });
    return res.json({
      ...config,
      accessMode: access.mode,
      canCreate: true,
      operationalState: operationalPolicy.state,
      activeSessionPolicy: activeSessionPolicyFor(operationalPolicy),
    });
}

router.get('/config', asyncRoute(availabilityForRequest));
router.get('/availability', asyncRoute(availabilityForRequest));

router.post(
  '/:sessionId/technical-void',
  requireAdmin,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const session = await voidSessionTechnicalByAdmin(req.params.sessionId, {
      verifiedBy: req.auth.userId,
      reasonCode: req.body?.reasonCode,
    });
    emitInterviewEvent('technical_voided', sessionTelemetryFields(session, {
      operation: 'technical-void',
      reasonCode: session.technicalVoid?.reasonCode,
    }));
    return res.json({ session: serializeSession(session) });
  })
);

router.get(
  '/active',
  asyncRoute(async (req, res) => {
    const session = await getActiveSession(req.auth.userId);
    if (session) {
      emitInterviewEvent('resumed', sessionTelemetryFields(session, {
        operation: 'active-resume',
      }));
    }
    return res.json({
      session: session ? serializeSession(session) : null,
    });
  })
);

router.post(
  '/',
  requireCreateAllowed,
  requireLaunchReady,
  limitCreateUser,
  limitCreateIp,
  asyncRoute(async (req, res) => {
    emitInterviewEvent('create_started', {
      format: req.body?.format || 'coding',
      level: req.body?.level,
      track: req.body?.track,
      operation: 'create',
      accessMode: accessForRequest(req).mode,
      operationalState: operationalPolicyForRequest().state,
    });
    assertDesktopPreflight(req);
    const access = accessForRequest(req);
    const systemDesignAccess = systemDesignAccessForRequest(req);
    const result = await createSession(req.auth.userId, {
      ...(req.body || {}),
      requestId: req.get('Idempotency-Key') || req.body?.requestId,
    }, {
      allowCandidateArtifacts: access.internalPreview || systemDesignAccess.internalPreview,
      allowSystemDesign: systemDesignAccess.enabled,
    });
    emitInterviewEvent('create_succeeded', sessionTelemetryFields(result.session, {
      operation: 'create',
      accessMode: access.mode,
      operationalState: operationalPolicyForRequest().state,
      replayed: !result.created,
    }));
    if (result.created && result.selectionTelemetry) {
      emitInterviewEvent('selection_overlap', sessionTelemetryFields(result.session, {
        operation: 'create',
        ...result.selectionTelemetry,
      }));
    }
    return res.status(result.created ? 201 : 200).json({
      session: serializeSession(result.session),
      replayed: !result.created,
    });
  })
);

router.get(
  '/:sessionId/results',
  asyncRoute(async (req, res) => {
    const results = await getResults(req.auth.userId, req.params.sessionId);
    return res.json({ results });
  })
);

router.get(
  '/:sessionId/control',
  asyncRoute(async (req, res) => {
    const session = await getSession(req.auth.userId, req.params.sessionId);
    const operationalPolicy = operationalPolicyForRequest();
    return res.json({
      id: String(session._id),
      status: session.status,
      version: Number(session.__v || 0),
      active: Boolean(session.active),
      policy: activeSessionPolicyFor(operationalPolicy),
      notice: structuredShutdownNotice(operationalPolicy),
    });
  })
);

router.put(
  '/:sessionId/mcq/:questionId',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await saveMcqAnswer(
      req.auth.userId,
      req.params.sessionId,
      req.params.questionId,
      req.body || {},
      {
        requestReceivedAt: req.interviewRequestReceivedAt,
        requestCompletedAt: req.interviewRequestCompletedAt,
      }
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.put(
  '/:sessionId/system-design/draft',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await saveSystemDesignDraft(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/system-design/twist/reveal',
  requireActiveMutationAllowed,
  mutationLimiter,
  limitSystemDesignTwistReveal,
  asyncRoute(async (req, res) => {
    const result = await revealSystemDesignTwist(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/system-design/submit',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitSystemDesign(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    emitTerminalTelemetry(result.session, {
      operation: 'system-design-submit',
      replayed: result.replayed,
    });
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/mcq/submit',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitMcq(
      req.auth.userId,
      req.params.sessionId,
      req.body || {},
      {
        requestReceivedAt: req.interviewRequestReceivedAt,
        requestCompletedAt: req.interviewRequestCompletedAt,
      }
    );
    emitInterviewEvent('mcq_submitted', sessionTelemetryFields(result.session, {
      operation: 'mcq-submit',
      replayed: result.replayed,
    }));
    emitTerminalTelemetry(result.session, {
      operation: 'mcq-submit',
      replayed: result.replayed,
    });
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/coding/start',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await startCoding(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.put(
  '/:sessionId/coding/draft',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await saveCodingDraft(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/coding/check-runs',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const action = String(req.body?.action || '').trim().toLowerCase();
    if (action === 'prepare') {
      const prepared = await prepareCodingCheckRun(
        req.auth.userId,
        req.params.sessionId,
        req.body || {}
      );
      return res.json({ prepared });
    }
    if (action === 'complete') {
      const result = await recordCodingCheckRun(
        req.auth.userId,
        req.params.sessionId,
        req.body || {}
      );
      return res.json({
        session: serializeSession(result.session),
        replayed: result.replayed,
      });
    }
    return res.status(400).json({
      code: 'INTERVIEW_INVALID_CHECK_PHASE',
      error: 'Check run action must be prepare or complete',
    });
  })
);

router.post(
  '/:sessionId/coding/submit',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitCoding(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    emitTerminalTelemetry(result.session, {
      operation: 'coding-submit',
      replayed: result.replayed,
    });
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/end',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await abandonSession(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    emitInterviewEvent('abandoned', sessionTelemetryFields(result.session, {
      operation: 'abandon',
      replayed: result.replayed,
    }));
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.post(
  '/:sessionId/abandon',
  requireActiveMutationAllowed,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await abandonSession(
      req.auth.userId,
      req.params.sessionId,
      req.body || {}
    );
    emitInterviewEvent('abandoned', sessionTelemetryFields(result.session, {
      operation: 'abandon',
      replayed: result.replayed,
    }));
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.get(
  '/:sessionId',
  asyncRoute(async (req, res) => {
    const session = await getSession(req.auth.userId, req.params.sessionId);
    if (session.active) {
      emitInterviewEvent('resumed', sessionTelemetryFields(session, {
        operation: 'session-resume',
      }));
    }
    return res.json({ session: serializeSession(session) });
  })
);

router.use((error, req, res, _next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const safeStatus = statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
  const errorCode = error?.type === 'entity.too.large'
    ? 'INTERVIEW_REQUEST_TOO_LARGE'
    : String(error?.code || 'INTERVIEW_REQUEST_FAILED');
  const operation = req.interviewTelemetryOperation || interviewOperation(req.path, req.method);
  if (operation === 'create') {
    emitInterviewEvent('create_failed', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (
    safeStatus === 409
    && ['INTERVIEW_VERSION_CONFLICT', 'INTERVIEW_IDEMPOTENCY_CONFLICT'].includes(errorCode)
  ) {
    emitInterviewEvent('save_conflict', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (errorCode === 'INTERVIEW_MCQ_DEADLINE_PASSED') {
    emitInterviewEvent('deadline_rejected', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (errorCode === 'INTERVIEW_CONTENT_UNAVAILABLE') {
    emitInterviewEvent('artifact_unavailable', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (errorCode === 'INTERVIEW_SELECTION_UNAVAILABLE') {
    emitInterviewEvent('inventory_exhausted', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (errorCode === 'INTERVIEW_MONTHLY_QUOTA_EXHAUSTED') {
    emitInterviewEvent('quota_denied', {
      operation,
      code: errorCode,
      httpStatus: safeStatus,
    });
  }
  if (safeStatus >= 500 && error?.code !== 'INTERVIEW_CONTENT_UNAVAILABLE') {
    console.error('Interview route failed', {
      code: errorCode,
      name: String(error?.name || 'Error'),
      status: safeStatus,
    });
  }
  return res.status(safeStatus).json({
    code: errorCode,
    error: safeStatus >= 500
      ? (
        error?.code === 'INTERVIEW_CONTENT_UNAVAILABLE'
          ? 'Interview content is temporarily unavailable'
          : 'Interview request failed'
      )
      : String(error?.message || 'Interview request failed'),
    ...(error?.details ? { details: error.details } : {}),
  });
});

module.exports = router;
