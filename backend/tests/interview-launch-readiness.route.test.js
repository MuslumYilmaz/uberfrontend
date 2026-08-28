'use strict';

const express = require('express');
const request = require('supertest');

const mockInterviewReleaseReadiness = jest.fn();
const mockSession = {
  _id: '507f1f77bcf86cd799439012',
  active: true,
  format: 'coding',
  level: 'mid',
  track: 'react',
  status: 'mcq_active',
  __v: 1,
};
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
    status: session.status,
  })),
  startCoding: jest.fn(),
  submitCoding: jest.fn(),
  submitMcq: jest.fn(),
  submitSystemDesign: jest.fn(),
  voidSessionTechnicalByAdmin: jest.fn(),
};

jest.mock('../services/interview/readiness', () => ({
  interviewReleaseReadiness: mockInterviewReleaseReadiness,
}));
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
  rateLimit: () => (_req, _res, next) => next(),
}));
jest.mock('../services/interview/user-agent', () => ({
  isPhoneUserAgent: () => false,
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

describe('Interview launch readiness route boundary', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterviewReleaseReadiness.mockResolvedValue({
      ok: false,
      launchReady: false,
      releaseRequired: true,
      code: 'INTERVIEW_DEPENDENCIES_BLOCKED',
    });
    mockSessionService.getActiveSession.mockResolvedValue(mockSession);
    mockSessionService.getResults.mockResolvedValue({ status: 'completed' });
    mockSessionService.saveMcqAnswer.mockResolvedValue({
      session: mockSession,
      replayed: false,
    });
    mockSessionService.submitCoding.mockResolvedValue({
      session: { ...mockSession, active: false, status: 'completed' },
      replayed: false,
    });
    app = express();
    app.use('/api/interviews', interviewRouter);
  });

  test.each(['/config', '/availability'])(
    'blocks public launch discovery on %s without loading user content',
    async (path) => {
      const response = await request(app).get(`/api/interviews${path}`);
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        code: 'INTERVIEW_RELEASE_NOT_READY',
        error: 'Interview Mode is temporarily unavailable',
      });
      expect(mockSessionService.getConfigForUser).not.toHaveBeenCalled();
    },
  );

  test('blocks public create before the limiter or session service is reached', async () => {
    const response = await request(app)
      .post('/api/interviews')
      .send({ viewportWidth: 1366, format: 'coding', level: 'mid', track: 'react' });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('INTERVIEW_RELEASE_NOT_READY');
    expect(mockSessionService.createSession).not.toHaveBeenCalled();
  });

  test('does not apply the launch gate to active resume, save, submit, or results', async () => {
    const active = await request(app).get('/api/interviews/active');
    const results = await request(app).get('/api/interviews/session-id/results');
    const saved = await request(app)
      .put('/api/interviews/session-id/mcq/question-id')
      .send({ mutationId: 'mutation-1', expectedVersion: 1, selectedOptionId: 'option-a' });
    const submitted = await request(app)
      .post('/api/interviews/session-id/coding/submit')
      .send({ mutationId: 'mutation-2', expectedVersion: 1 });

    expect(active.status).toBe(200);
    expect(results.status).toBe(200);
    expect(saved.status).toBe(200);
    expect(submitted.status).toBe(200);
    expect(mockInterviewReleaseReadiness).not.toHaveBeenCalled();
  });
});
