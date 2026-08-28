'use strict';

const express = require('express');
const request = require('supertest');
const mockInterviewReleaseReadiness = jest.fn();

const mockSession = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439012',
  active: true,
  format: 'coding',
  level: 'mid',
  track: 'react',
  status: 'mcq_active',
  codingOutcome: 'pending',
  __v: 2,
  ...overrides,
});

const mockSessionService = {
  abandonSession: jest.fn(),
  createSession: jest.fn(),
  getActiveSession: jest.fn(),
  getConfigForUser: jest.fn(),
  getResumeSummaryForUser: jest.fn(),
  getResults: jest.fn(),
  getSession: jest.fn(),
  prepareCodingCheckRun: jest.fn(),
  recordCodingCheckRun: jest.fn(),
  revealSystemDesignTwist: jest.fn(),
  saveCodingDraft: jest.fn(),
  saveMcqAnswer: jest.fn(),
  saveSystemDesignDraft: jest.fn(),
  serializeSession: jest.fn((session) => ({
    id: String(session._id),
    active: session.active,
    format: session.format,
    level: session.level,
    track: session.track,
    status: session.status,
  })),
  startCoding: jest.fn(),
  submitCoding: jest.fn(),
  submitMcq: jest.fn(),
  submitSystemDesign: jest.fn(),
  voidSessionTechnicalByAdmin: jest.fn(),
};

jest.mock('../services/interview/session-service', () => mockSessionService);
jest.mock('../middleware/Auth', () => ({
  requireAuth(req, _res, next) {
    req.auth = { userId: '507f1f77bcf86cd799439011', role: 'user' };
    next();
  },
}));
jest.mock('../middleware/RequireAdmin', () => ({
  requireAdmin(_req, _res, next) { next(); },
}));
jest.mock('../middleware/rateLimit', () => ({
  rateLimit: ({ name }) => (req, res, next) => {
    const outcome = req.get('x-test-rate-limit-outcome');
    if (!outcome) return next();
    res.locals.rateLimit = {
      limiter: name,
      outcome,
      code: outcome === 'unavailable' ? 'RATE_LIMIT_UNAVAILABLE' : 'TEST_RATE_LIMITED',
      storeFallback: outcome === 'fallback',
    };
    if (outcome === 'denied') {
      return res.status(429).json({ code: 'TEST_RATE_LIMITED', error: 'denied' });
    }
    if (outcome === 'unavailable') {
      return res.status(503).json({ code: 'RATE_LIMIT_UNAVAILABLE', error: 'unavailable' });
    }
    return next();
  },
}));
jest.mock('../services/interview/user-agent', () => ({
  isPhoneUserAgent: () => false,
}));
jest.mock('../services/interview/readiness', () => ({
  interviewReleaseReadiness: mockInterviewReleaseReadiness,
}));
jest.mock('../services/interview/config', () => ({
  interviewConfig: () => ({
    createRateLimitWindowMs: 86_400_000,
    createUserRateLimitMax: 10,
    createIpRateLimitMax: 20,
    mutationRateLimitWindowMs: 60_000,
    mutationRateLimitMax: 300,
    httpBodyLimitBytes: 1_000_000,
  }),
  interviewModeAccess: () => ({
    enabled: true,
    internalPreview: false,
    mode: 'public',
  }),
  interviewOperationalPolicy: () => ({
    state: 'normal',
    canStartNew: true,
    activeSessionPolicy: 'continue',
    shutdownNotice: null,
    routePolicy: { activeSession: true },
  }),
  interviewSystemDesignAccess: () => ({
    enabled: false,
    internalPreview: false,
    mode: 'off',
  }),
}));

const interviewRouter = require('../routes/interviews');

function telemetryEntries(logSpy) {
  return logSpy.mock.calls
    .map(([entry]) => {
      try {
        return JSON.parse(entry);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry?.type === 'interview_event');
}

describe('Interview route telemetry integration', () => {
  let app;
  let logSpy;
  let previousTelemetry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterviewReleaseReadiness.mockResolvedValue({
      ok: true,
      launchReady: true,
      releaseRequired: true,
    });
    previousTelemetry = process.env.INTERVIEW_TELEMETRY_ENABLED;
    process.env.INTERVIEW_TELEMETRY_ENABLED = 'true';
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    app = express();
    app.use('/api/interviews', (req, _res, next) => {
      const ingressAt = req.get('x-test-interview-ingress-at');
      if (ingressAt) req.interviewRequestReceivedAt = new Date(ingressAt);
      next();
    });
    app.use('/api/interviews', interviewRouter);
  });

  afterEach(() => {
    if (previousTelemetry === undefined) delete process.env.INTERVIEW_TELEMETRY_ENABLED;
    else process.env.INTERVIEW_TELEMETRY_ENABLED = previousTelemetry;
    logSpy.mockRestore();
  });

  test('emits create lifecycle fields without user, session, prompt, answer or draft data', async () => {
    const session = mockSession();
    mockSessionService.createSession.mockResolvedValue({
      session,
      created: true,
      selectionTelemetry: {
        count: 6,
        literalOverlap: 0,
        semanticOverlap: 0,
        selectionPolicyVersion: 2,
      },
    });

    const response = await request(app)
      .post('/api/interviews')
      .set('Idempotency-Key', 'private-request-id')
      .send({
        format: 'coding',
        level: 'mid',
        track: 'react',
        viewportWidth: 1366,
        prompt: 'must not be logged',
        answer: 'must not be logged',
        draft: 'const privateCode = true;',
      });

    expect(response.status).toBe(201);
    const entries = telemetryEntries(logSpy);
    expect(entries.map((entry) => entry.name)).toEqual([
      'create_started',
      'create_succeeded',
      'selection_overlap',
    ]);
    expect(entries[1]).toEqual(expect.objectContaining({
      accessMode: 'public',
      format: 'coding',
      level: 'mid',
      track: 'react',
      statusTo: 'mcq_active',
      replayed: false,
    }));
    expect(entries[2]).toEqual(expect.objectContaining({
      name: 'selection_overlap',
      count: 6,
      literalOverlap: 0,
      semanticOverlap: 0,
      selectionPolicyVersion: 2,
    }));
    const emittedText = JSON.stringify(entries);
    expect(emittedText).not.toContain('private-request-id');
    expect(emittedText).not.toContain('must not be logged');
    expect(emittedText).not.toContain('privateCode');
    expect(emittedText).not.toContain('507f1f77bcf86cd7994390');
  });

  test('maps optimistic and idempotency errors to save-conflict telemetry', async () => {
    const error = new Error('Session changed in another tab');
    error.statusCode = 409;
    error.code = 'INTERVIEW_VERSION_CONFLICT';
    mockSessionService.saveMcqAnswer.mockRejectedValue(error);

    const response = await request(app)
      .put('/api/interviews/session-secret/mcq/question-secret')
      .send({
        expectedVersion: 1,
        mutationId: 'mutation-secret',
        selectedOptionId: 'answer-secret',
      });

    expect(response.status).toBe(409);
    expect(telemetryEntries(logSpy)).toContainEqual(expect.objectContaining({
      name: 'save_conflict',
      operation: 'mcq-answer',
      code: 'interview_version_conflict',
      httpStatus: 409,
    }));
    expect(JSON.stringify(telemetryEntries(logSpy))).not.toContain('mutation-secret');
    expect(JSON.stringify(telemetryEntries(logSpy))).not.toContain('answer-secret');
  });

  test('preserves an ingress timestamp captured before route-level Redis work', async () => {
    const ingressAt = '2026-08-24T10:00:00.000Z';
    mockSessionService.saveMcqAnswer.mockResolvedValue({
      session: mockSession(),
      replayed: false,
    });

    const response = await request(app)
      .put('/api/interviews/session-secret/mcq/question-secret')
      .set('x-test-interview-ingress-at', ingressAt)
      .send({ expectedVersion: 2, mutationId: 'mutation-secret', selectedOptionId: 'option-a' });

    expect(response.status).toBe(200);
    expect(mockSessionService.saveMcqAnswer).toHaveBeenCalledWith(
      expect.any(String),
      'session-secret',
      'question-secret',
      expect.any(Object),
      expect.objectContaining({ requestReceivedAt: new Date(ingressAt) }),
    );
  });

  test('records timeout completion and resume as low-cardinality lifecycle events', async () => {
    const timedOut = mockSession({
      active: false,
      status: 'completed',
      codingOutcome: 'timed_out',
    });
    mockSessionService.submitCoding.mockResolvedValue({
      session: timedOut,
      replayed: false,
    });
    mockSessionService.getActiveSession.mockResolvedValue(mockSession());

    const completed = await request(app)
      .post('/api/interviews/session-secret/coding/submit')
      .send({ mutationId: 'mutation-secret', expectedVersion: 2 });
    const resumed = await request(app).get('/api/interviews/active');

    expect(completed.status).toBe(200);
    expect(resumed.status).toBe(200);
    expect(telemetryEntries(logSpy)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'timed_out',
        operation: 'coding-submit',
        outcome: 'timed_out',
      }),
      expect.objectContaining({
        name: 'completed',
        operation: 'coding-submit',
        outcome: 'timed_out',
      }),
      expect.objectContaining({
        name: 'resumed',
        operation: 'active-resume',
        statusTo: 'mcq_active',
      }),
    ]));
  });

  test('emits quota and create-failure without misclassifying quota as a limiter denial', async () => {
    const error = new Error('Monthly quota exhausted');
    error.statusCode = 429;
    error.code = 'INTERVIEW_MONTHLY_QUOTA_EXHAUSTED';
    mockSessionService.createSession.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/interviews')
      .send({ format: 'coding', level: 'junior', track: 'core-web', viewportWidth: 1366 });

    expect(response.status).toBe(429);
    const entries = telemetryEntries(logSpy);
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'create_started', operation: 'create' }),
      expect.objectContaining({
        name: 'create_failed',
        code: 'interview_monthly_quota_exhausted',
        httpStatus: 429,
      }),
      expect.objectContaining({
        name: 'quota_denied',
        code: 'interview_monthly_quota_exhausted',
      }),
    ]));
    expect(entries).not.toContainEqual(expect.objectContaining({ name: 'rate_denied' }));
  });

  test.each([
    ['denied', 429, 'rate_denied'],
    ['unavailable', 503, 'rate_limit_unavailable'],
  ])('classifies a limiter %s response independently', async (outcome, status, eventName) => {
    const response = await request(app)
      .post('/api/interviews')
      .set('x-test-rate-limit-outcome', outcome)
      .send({ format: 'coding', level: 'junior', track: 'core-web', viewportWidth: 1366 });

    expect(response.status).toBe(status);
    expect(telemetryEntries(logSpy)).toContainEqual(expect.objectContaining({
      name: eventName,
      operation: 'create',
      limiter: 'interview-create-user',
      httpStatus: status,
    }));
  });

  test('emits fallback metadata when a mutation continues on the bounded local store', async () => {
    mockSessionService.saveMcqAnswer.mockResolvedValue({
      session: mockSession(),
      replayed: false,
    });

    const response = await request(app)
      .put('/api/interviews/session-secret/mcq/question-secret')
      .set('x-test-rate-limit-outcome', 'fallback')
      .send({ expectedVersion: 2, mutationId: 'mutation-secret', selectedOptionId: 'option-a' });

    expect(response.status).toBe(200);
    expect(telemetryEntries(logSpy)).toContainEqual(expect.objectContaining({
      name: 'rate_limit_fallback',
      operation: 'mcq-answer',
      limiter: 'interview-mutations',
      storeFallback: true,
      httpStatus: 200,
    }));
  });

  test('classifies Redis-blocked launch readiness as rate-limit unavailability', async () => {
    mockInterviewReleaseReadiness.mockResolvedValueOnce({
      launchReady: false,
      dependencies: {
        redisRateLimit: { required: true, ready: false, code: 'timeout' },
      },
    });

    const response = await request(app)
      .post('/api/interviews')
      .send({ format: 'coding', level: 'junior', track: 'core-web', viewportWidth: 1366 });

    expect(response.status).toBe(503);
    expect(telemetryEntries(logSpy)).toContainEqual(expect.objectContaining({
      name: 'rate_limit_unavailable',
      operation: 'create',
      limiter: 'interview-launch-readiness',
      code: 'timeout',
    }));
    expect(telemetryEntries(logSpy)).not.toContainEqual(expect.objectContaining({
      name: 'request_failed',
    }));
  });
});
