'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/Auth');
const { requireAdmin } = require('../middleware/RequireAdmin');
const { rateLimit } = require('../middleware/rateLimit');
const {
  interviewConfig,
  interviewModeAccess,
  interviewSystemDesignAccess,
} = require('../services/interview/config');
const { isPhoneUserAgent } = require('../services/interview/user-agent');
const {
  abandonSession,
  createSession,
  getActiveSession,
  getConfigForUser,
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

const createLimiter = rateLimit({
  name: 'interview-create',
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  code: 'INTERVIEW_CREATE_RATE_LIMITED',
  message: 'Too many interview creation attempts',
});

const mutationLimiter = rateLimit({
  name: 'interview-mutations',
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
  code: 'INTERVIEW_MUTATION_RATE_LIMITED',
  message: 'Too many interview updates',
});

router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

function asyncRoute(handler) {
  return function interviewAsyncRoute(req, res, next) {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

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
  return interviewJsonParser(req, res, next);
});

function disabledAvailability() {
  return {
    enabled: false,
    accessMode: 'off',
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
    activeSession: null,
    lastResults: [],
    minViewportWidth: 768,
    xpAwarded: 0,
  };
}

function accessForRequest(req) {
  return interviewModeAccess(req.auth?.role || 'user');
}

function systemDesignAccessForRequest(req) {
  return interviewSystemDesignAccess(req.auth?.role || 'user');
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

router.get(
  '/config',
  asyncRoute(async (req, res) => {
    const access = accessForRequest(req);
    if (!access.enabled) return res.json(disabledAvailability());
    const systemDesignAccess = systemDesignAccessForRequest(req);
    const config = await getConfigForUser(req.auth.userId, {
      allowCandidateArtifacts: access.internalPreview || systemDesignAccess.internalPreview,
      allowSystemDesign: systemDesignAccess.enabled,
    });
    return res.json({
      ...config,
      accessMode: access.mode,
    });
  })
);

router.get(
  '/availability',
  asyncRoute(async (req, res) => {
    const access = accessForRequest(req);
    if (!access.enabled) return res.json(disabledAvailability());
    const systemDesignAccess = systemDesignAccessForRequest(req);
    const config = await getConfigForUser(req.auth.userId, {
      allowCandidateArtifacts: access.internalPreview || systemDesignAccess.internalPreview,
      allowSystemDesign: systemDesignAccess.enabled,
    });
    return res.json({
      ...config,
      accessMode: access.mode,
    });
  })
);

router.post(
  '/:sessionId/technical-void',
  requireAdmin,
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const session = await voidSessionTechnicalByAdmin(req.params.sessionId, {
      verifiedBy: req.auth.userId,
      reasonCode: req.body?.reasonCode,
    });
    return res.json({ session: serializeSession(session) });
  })
);

router.use((req, res, next) => {
  if (accessForRequest(req).enabled) return next();
  return res.status(404).json({
    code: 'INTERVIEW_MODE_DISABLED',
    error: 'Interview Mode is not currently available',
  });
});

router.get(
  '/active',
  asyncRoute(async (req, res) => {
    const session = await getActiveSession(req.auth.userId);
    return res.json({
      session: session ? serializeSession(session) : null,
    });
  })
);

router.post(
  '/',
  createLimiter,
  asyncRoute(async (req, res) => {
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

router.put(
  '/:sessionId/mcq/:questionId',
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await saveMcqAnswer(
      req.auth.userId,
      req.params.sessionId,
      req.params.questionId,
      req.body || {}
    );
    return res.json({
      session: serializeSession(result.session),
      replayed: result.replayed,
    });
  })
);

router.put(
  '/:sessionId/system-design/draft',
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
  mutationLimiter,
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
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitSystemDesign(
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
  '/:sessionId/mcq/submit',
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitMcq(
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
  '/:sessionId/coding/start',
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
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await submitCoding(
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
  '/:sessionId/end',
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await abandonSession(
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
  '/:sessionId/abandon',
  mutationLimiter,
  asyncRoute(async (req, res) => {
    const result = await abandonSession(
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

router.get(
  '/:sessionId',
  asyncRoute(async (req, res) => {
    const session = await getSession(req.auth.userId, req.params.sessionId);
    return res.json({ session: serializeSession(session) });
  })
);

router.use((error, _req, res, _next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const safeStatus = statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
  const errorCode = error?.type === 'entity.too.large'
    ? 'INTERVIEW_REQUEST_TOO_LARGE'
    : String(error?.code || 'INTERVIEW_REQUEST_FAILED');
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
