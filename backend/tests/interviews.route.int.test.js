'use strict';

const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');

jest.setTimeout(120000);

const JWT_SECRET = 'test_jwt_secret_interview_routes_32_chars_minimum';

let app;
let mongoServer;
let connectToMongo;
let disconnectMongo;
let User;
let InterviewSession;
let InterviewMonthlyQuota;
let InterviewConsumedRunToken;
let ActivityCompletion;
let ActivityCompletionRequest;
let ActivityEvent;
let DailyChallengeAssignment;
let DailyChallengeCompletion;
let FirstCompletionCredit;
let XpCredit;
let PracticeProgress;
let UserAchievement;
let WeeklyGoalBonusCredit;
let WeeklyGoalState;
let voidSessionTechnical;

function authHeader(userId) {
  return `Bearer ${jwt.sign(
    { sub: String(userId), role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )}`;
}

async function createUser(suffix, {
  premium = false,
  cancelledValid = false,
  role = 'user',
} = {}) {
  const entitlementStatus = cancelledValid ? 'cancelled' : (premium ? 'active' : 'none');
  return User.create({
    email: `interview-${suffix}@example.com`,
    username: `interview_${suffix}`,
    passwordHash: 'hash',
    role,
    accessTier: 'free',
    entitlements: {
      pro: {
        status: entitlementStatus,
        validUntil: premium || cancelledValid
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
      },
    },
  });
}

async function createInterview(user, {
  requestId = 'create-request-0001',
  level = 'mid',
  track = 'react',
} = {}) {
  return request(app)
    .post('/api/interviews')
    .set('Authorization', authHeader(user._id))
    .set('Idempotency-Key', requestId)
    .send({
      level,
      track,
      timingMode: 'standard',
      viewportWidth: 1366,
    });
}

async function gamificationSnapshot(userId) {
  const user = await User.findById(userId)
    .select('stats solvedQuestionIds')
    .lean();
  const models = {
    activityCompletions: ActivityCompletion,
    activityCompletionRequests: ActivityCompletionRequest,
    activityEvents: ActivityEvent,
    dailyChallengeAssignments: DailyChallengeAssignment,
    dailyChallengeCompletions: DailyChallengeCompletion,
    firstCompletionCredits: FirstCompletionCredit,
    practiceProgress: PracticeProgress,
    userAchievements: UserAchievement,
    weeklyGoalBonusCredits: WeeklyGoalBonusCredit,
    weeklyGoalStates: WeeklyGoalState,
    xpCredits: XpCredit,
  };
  const counts = Object.fromEntries(await Promise.all(
    Object.entries(models).map(async ([key, model]) => [
      key,
      await model.countDocuments({ userId }),
    ])
  ));
  return {
    stats: JSON.parse(JSON.stringify(user.stats)),
    solvedQuestionIds: [...user.solvedQuestionIds],
    counts,
  };
}

function forbiddenPath(value, path = '$') {
  const forbidden = new Set([
    'answerKey',
    'correctOptionId',
    'codingPrivate',
    'explanation',
    'optionRationales',
    'provenance',
    'remediationTopics',
    'resultSnapshot',
    'rubric',
    'runnerConfig',
    'solution',
    'solutionAsset',
    'solutionBlock',
    'tests',
    'testsTs',
  ]);
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) return `${path}.${key}`;
    const nested = forbiddenPath(child, `${path}.${key}`);
    if (nested) return nested;
  }
  return null;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.SENTRY_ENABLED = 'false';
  process.env.INTERVIEW_MODE_ACCESS = 'public';
  process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
  process.env.INTERVIEW_FREE_MONTHLY_LIMIT = '1';
  process.env.API_RATE_LIMIT_MAX = '100000';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  InterviewSession = require('../models/InterviewSession');
  InterviewMonthlyQuota = require('../models/InterviewMonthlyQuota');
  InterviewConsumedRunToken = require('../models/InterviewConsumedRunToken');
  ActivityCompletion = require('../models/ActivityCompletion');
  ActivityCompletionRequest = require('../models/ActivityCompletionRequest');
  ActivityEvent = require('../models/ActivityEvent');
  DailyChallengeAssignment = require('../models/DailyChallengeAssignment');
  DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
  FirstCompletionCredit = require('../models/FirstCompletionCredit');
  XpCredit = require('../models/XpCredit');
  PracticeProgress = require('../models/PracticeProgress');
  UserAchievement = require('../models/UserAchievement');
  WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
  WeeklyGoalState = require('../models/WeeklyGoalState');
  ({ voidSessionTechnical } = require('../services/interview/session-service'));

  await connectToMongo(process.env.MONGO_URL_TEST);
  await Promise.all([
    InterviewSession.syncIndexes(),
    InterviewMonthlyQuota.syncIndexes(),
    InterviewConsumedRunToken.syncIndexes(),
  ]);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    InterviewSession.deleteMany({}),
    InterviewMonthlyQuota.deleteMany({}),
    InterviewConsumedRunToken.deleteMany({}),
    ActivityCompletion.deleteMany({}),
    ActivityCompletionRequest.deleteMany({}),
    ActivityEvent.deleteMany({}),
    DailyChallengeAssignment.deleteMany({}),
    DailyChallengeCompletion.deleteMany({}),
    FirstCompletionCredit.deleteMany({}),
    XpCredit.deleteMany({}),
    PracticeProgress.deleteMany({}),
    UserAchievement.deleteMany({}),
    WeeklyGoalBonusCredit.deleteMany({}),
    WeeklyGoalState.deleteMany({}),
  ]);
});

describe('Interview Mode API', () => {
  test('availability exposes safe setup state, Istanbul quota, and resumable session only', async () => {
    const user = await createUser('availability');

    const before = await request(app)
      .get('/api/interviews/availability')
      .set('Authorization', authHeader(user._id));

    expect(before.status).toBe(200);
    expect(before.headers['cache-control']).toContain('no-store');
    expect(before.headers.pragma).toBe('no-cache');
    expect(before.body).toEqual(expect.objectContaining({
      enabled: true,
      accessMode: 'public',
      levels: ['junior', 'mid', 'senior'],
      tracks: ['core-web', 'react', 'angular', 'vue'],
      timingModes: ['standard'],
      activeSession: null,
      lastResults: [],
      minViewportWidth: 768,
      xpAwarded: 0,
    }));
    expect(before.body.quota).toEqual(expect.objectContaining({
      unlimited: false,
      limit: 1,
      remaining: 1,
      timeZone: 'Europe/Istanbul',
    }));
    expect(before.body.availability).toHaveLength(12);
    expect(before.body.availability.every((item) => item.available)).toBe(true);

    const created = await createInterview(user);
    expect(created.status).toBe(201);

    const after = await request(app)
      .get('/api/interviews/availability')
      .set('Authorization', authHeader(user._id));
    expect(after.status).toBe(200);
    expect(after.body.activeSession.id).toBe(created.body.session.id);
    expect(forbiddenPath(after.body)).toBeNull();
  });

  test('internal mode exposes availability and session creation only to admins', async () => {
    const user = await createUser('internal_regular');
    const admin = await createUser('internal_admin', { role: 'admin' });
    const originalAccess = process.env.INTERVIEW_MODE_ACCESS;
    process.env.INTERVIEW_MODE_ACCESS = 'internal';

    try {
      const userAvailability = await request(app)
        .get('/api/interviews/availability')
        .set('Authorization', authHeader(user._id));
      expect(userAvailability.status).toBe(200);
      expect(userAvailability.body).toEqual(expect.objectContaining({
        enabled: false,
        accessMode: 'off',
        availability: [],
      }));

      const userCreate = await createInterview(user, {
        requestId: 'internal-user-create-0001',
      });
      expect(userCreate.status).toBe(404);
      expect(userCreate.body.code).toBe('INTERVIEW_MODE_DISABLED');
      expect(await InterviewSession.countDocuments({ userId: user._id })).toBe(0);
      expect(await InterviewMonthlyQuota.countDocuments({ userId: user._id })).toBe(0);

      const adminAvailability = await request(app)
        .get('/api/interviews/availability')
        .set('Authorization', authHeader(admin._id));
      expect(adminAvailability.status).toBe(200);
      expect(adminAvailability.body).toEqual(expect.objectContaining({
        enabled: true,
        accessMode: 'internal',
      }));
      expect(adminAvailability.body.availability.every((item) => item.available)).toBe(true);

      const adminCreate = await createInterview(admin, {
        requestId: 'internal-admin-create-0001',
      });
      expect(adminCreate.status).toBe(201);
      expect(adminCreate.body.session.status).toBe('mcq_active');
    } finally {
      process.env.INTERVIEW_MODE_ACCESS = originalAccess;
    }
  });

  test('creates one pinned five-question form, replays create, and never leaks answers', async () => {
    const user = await createUser('create');
    const created = await createInterview(user, {
      requestId: 'create-idempotent-0001',
      level: 'senior',
      track: 'angular',
    });

    expect(created.status).toBe(201);
    const session = created.body.session;
    expect(session).toEqual(expect.objectContaining({
      status: 'mcq_active',
      level: 'senior',
      track: 'angular',
      timingMode: 'standard',
      xpAwarded: 0,
    }));
    expect(session.questions).toHaveLength(5);
    expect(new Set(session.questions.map((question) => question.id)).size).toBe(5);
    expect(session.questions.flatMap((question) => question.options))
      .toHaveLength(15);
    expect(session.coding.variant).toBeNull();
    expect(forbiddenPath(created.body)).toBeNull();

    const bands = session.questions.reduce((counts, question) => {
      counts[question.difficultyBand] = (counts[question.difficultyBand] || 0) + 1;
      return counts;
    }, {});
    expect(bands).toEqual({ foundation: 1, core: 2, stretch: 2 });

    const replay = await createInterview(user, {
      requestId: 'create-idempotent-0001',
      level: 'senior',
      track: 'angular',
    });
    expect(replay.status).toBe(200);
    expect(replay.body.replayed).toBe(true);
    expect(replay.body.session.id).toBe(session.id);

    const conflictingReplay = await createInterview(user, {
      requestId: 'create-idempotent-0001',
      level: 'junior',
      track: 'vue',
    });
    expect(conflictingReplay.status).toBe(409);
    expect(conflictingReplay.body.code).toBe('INTERVIEW_IDEMPOTENCY_CONFLICT');

    const competing = await createInterview(user, {
      requestId: 'create-competing-0002',
      level: 'junior',
      track: 'vue',
    });
    expect(competing.status).toBe(409);
    expect(competing.body.code).toBe('INTERVIEW_ACTIVE_SESSION_EXISTS');

    const stored = await InterviewSession.findById(session.id).select('+answerKey');
    expect(stored.answerKey).toHaveLength(5);
    expect(await ActivityCompletion.countDocuments({ userId: user._id })).toBe(0);
    expect(await XpCredit.countDocuments({ userId: user._id })).toBe(0);
    expect(await PracticeProgress.countDocuments({ userId: user._id })).toBe(0);
  });

  test('rejects narrow viewports and landscape phone user agents before consuming quota', async () => {
    const user = await createUser('desktop_preflight');
    const narrow = await request(app)
      .post('/api/interviews')
      .set('Authorization', authHeader(user._id))
      .set('Idempotency-Key', 'desktop-preflight-0001')
      .send({ level: 'junior', track: 'core-web', viewportWidth: 390 });
    expect(narrow.status).toBe(400);
    expect(narrow.body.code).toBe('INTERVIEW_DESKTOP_REQUIRED');

    const landscapePhone = await request(app)
      .post('/api/interviews')
      .set('Authorization', authHeader(user._id))
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')
      .set('Idempotency-Key', 'desktop-preflight-0002')
      .send({ level: 'junior', track: 'core-web', viewportWidth: 932 });
    expect(landscapePhone.status).toBe(400);
    expect(landscapePhone.body.code).toBe('INTERVIEW_DESKTOP_REQUIRED');

    expect(await InterviewSession.countDocuments({ userId: user._id })).toBe(0);
    expect(await InterviewMonthlyQuota.countDocuments({ userId: user._id })).toBe(0);
  });

  test('accepts an authenticated draft-sized JSON envelope above the default parser limit', async () => {
    const user = await createUser('body_limit', { premium: true });
    const response = await request(app)
      .post('/api/interviews')
      .set('Authorization', authHeader(user._id))
      .set('Idempotency-Key', 'body-limit-create-0001')
      .send({
        level: 'junior',
        track: 'core-web',
        timingMode: 'standard',
        viewportWidth: 1366,
        transportPadding: 'x'.repeat(150 * 1024),
    });

    expect(response.status).toBe(201);
    expect(response.body.session.status).toBe('mcq_active');

    const { interviewConfig } = require('../services/interview/config');
    const tooLarge = await request(app)
      .post('/api/interviews')
      .set('Authorization', authHeader(user._id))
      .set('Idempotency-Key', 'body-limit-create-0002')
      .send({
        level: 'junior',
        track: 'core-web',
        timingMode: 'standard',
        viewportWidth: 1366,
        transportPadding: 'x'.repeat(interviewConfig().httpBodyLimitBytes),
      });
    expect(tooLarge.status).toBe(413);
    expect(tooLarge.body.code).toBe('INTERVIEW_REQUEST_TOO_LARGE');
  });

  test('snapshots timing policy so later environment changes cannot alter a session', async () => {
    const user = await createUser('timing_snapshot', { premium: true });
    const originalReadySeconds = process.env.INTERVIEW_CODING_READY_SECONDS;
    process.env.INTERVIEW_CODING_READY_SECONDS = '420';
    try {
      const created = await createInterview(user, {
        requestId: 'timing-snapshot-create-0001',
      });
      expect(created.status).toBe(201);
      const stored = await InterviewSession.findById(created.body.session.id).lean();
      expect(stored.timingPolicy).toEqual(expect.objectContaining({
        mcqSeconds: expect.any(Number),
        codingReadySeconds: 420,
        codingSeconds: stored.codingVariant.timeLimitSeconds,
      }));

      process.env.INTERVIEW_CODING_READY_SECONDS = '30';
      const submitted = await request(app)
        .post(`/api/interviews/${created.body.session.id}/mcq/submit`)
        .set('Authorization', authHeader(user._id))
        .send({ expectedVersion: created.body.session.version });
      expect(submitted.status).toBe(200);
      expect(
        new Date(submitted.body.session.deadlines.codingReady).getTime()
        - new Date((await InterviewSession.findById(created.body.session.id).lean())
          .codingReadyAt).getTime()
      ).toBe(420 * 1000);
    } finally {
      if (originalReadySeconds == null) delete process.env.INTERVIEW_CODING_READY_SECONDS;
      else process.env.INTERVIEW_CODING_READY_SECONDS = originalReadySeconds;
    }
  });

  test('rolls back the free quota reservation when session persistence fails', async () => {
    const user = await createUser('atomic_start_failure');
    const loggedError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const saveFailure = jest
      .spyOn(InterviewSession.prototype, 'save')
      .mockRejectedValueOnce(new Error('simulated session persistence failure'));

    const failed = await createInterview(user, {
      requestId: 'atomic-start-failure-0001',
    });
    saveFailure.mockRestore();
    expect(loggedError).toHaveBeenCalledWith('Interview route failed', {
      code: 'INTERVIEW_REQUEST_FAILED',
      name: 'Error',
      status: 500,
    });
    loggedError.mockRestore();

    expect(failed.status).toBe(500);
    expect(await InterviewSession.countDocuments({ userId: user._id })).toBe(0);
    expect(await InterviewMonthlyQuota.countDocuments({ userId: user._id })).toBe(0);
  });

  test('runs MCQ then coding with optimistic idempotency and self-reported checks', async () => {
    const user = await createUser('flow', { premium: true });
    const gamificationBefore = await gamificationSnapshot(user._id);
    const created = await createInterview(user, {
      requestId: 'create-flow-0001',
      level: 'mid',
      track: 'react',
    });
    expect(created.status).toBe(201);
    const sessionId = created.body.session.id;
    const question = created.body.session.questions[0];
    const stored = await InterviewSession.findById(sessionId).select('+answerKey');
    const answer = stored.answerKey.find((item) => item.id === question.id);
    let version = created.body.session.version;

    const saved = await request(app)
      .put(`/api/interviews/${sessionId}/mcq/${question.id}`)
      .set('Authorization', authHeader(user._id))
      .send({
        mutationId: 'flow-answer-mutation-0001',
        expectedVersion: version,
        optionId: answer.correctOptionId,
        responseDurationMs: 42_500,
      });
    expect(saved.status).toBe(200);
    version = saved.body.session.version;
    expect(saved.body.session.responses).toEqual([
      expect.objectContaining({
        questionId: question.id,
        selectedOptionId: answer.correctOptionId,
      }),
    ]);
    const storedResponse = await InterviewSession.findById(sessionId).lean();
    expect(storedResponse.mcqResponses[0].responseDurationMs).toBe(42_500);
    expect(forbiddenPath(saved.body)).toBeNull();

    const replay = await request(app)
      .put(`/api/interviews/${sessionId}/mcq/${question.id}`)
      .set('Authorization', authHeader(user._id))
      .send({
        mutationId: 'flow-answer-mutation-0001',
        expectedVersion: created.body.session.version,
        optionId: answer.correctOptionId,
        responseDurationMs: 42_500,
      });
    expect(replay.status).toBe(200);
    expect(replay.body.replayed).toBe(true);
    expect(replay.body.session.version).toBe(version);

    const conflictingMutation = await request(app)
      .put(`/api/interviews/${sessionId}/mcq/${question.id}`)
      .set('Authorization', authHeader(user._id))
      .send({
        mutationId: 'flow-answer-mutation-0001',
        expectedVersion: version,
        optionId: question.options.find((option) => option.id !== answer.correctOptionId).id,
        responseDurationMs: 42_500,
      });
    expect(conflictingMutation.status).toBe(409);
    expect(conflictingMutation.body.code).toBe('INTERVIEW_IDEMPOTENCY_CONFLICT');

    const stale = await request(app)
      .put(`/api/interviews/${sessionId}/mcq/${question.id}`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: created.body.session.version, optionId: question.options[1].id });
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('INTERVIEW_VERSION_CONFLICT');

    const submittedMcq = await request(app)
      .post(`/api/interviews/${sessionId}/mcq/submit`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: version });
    expect(submittedMcq.status).toBe(200);
    expect(submittedMcq.body.session.status).toBe('coding_ready');
    expect(submittedMcq.body.session.coding.variant).toBeNull();
    version = submittedMcq.body.session.version;

    const startedCoding = await request(app)
      .post(`/api/interviews/${sessionId}/coding/start`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: version });
    expect(startedCoding.status).toBe(200);
    expect(startedCoding.body.session.status).toBe('coding_active');
    expect(startedCoding.body.session.coding.variant).toEqual(expect.objectContaining({
      track: 'react',
      level: 'mid',
      title: expect.any(String),
      prompt: expect.any(String),
      publicRequirements: expect.any(Array),
    }));
    expect(forbiddenPath(startedCoding.body)).toBeNull();
    version = startedCoding.body.session.version;

    const draft = await request(app)
      .put(`/api/interviews/${sessionId}/coding/draft`)
      .set('Authorization', authHeader(user._id))
      .send({
        expectedVersion: version,
        language: 'typescript',
        files: [{ path: 'src/App.tsx', content: 'export default function App(){return null;}' }],
      });
    expect(draft.status).toBe(200);
    const draftHash = draft.body.session.coding.draft.hash;
    expect(draftHash).toMatch(/^[a-f0-9]{64}$/);
    version = draft.body.session.version;

    const prepared = await request(app)
      .post(`/api/interviews/${sessionId}/coding/check-runs`)
      .set('Authorization', authHeader(user._id))
      .send({ action: 'prepare', expectedVersion: version, draftHash });
    expect(prepared.status).toBe(200);
    expect(prepared.body.prepared).toEqual(expect.objectContaining({
      runToken: expect.any(String),
      draftHash,
      runnerConfig: expect.any(Object),
      expectedCheckIds: expect.any(Array),
      evidenceMode: 'client-self-report',
      authoritative: false,
      version,
    }));
    expect(prepared.body.prepared.runnerConfig.kind).toBe('framework-preview');
    expect(prepared.body.prepared).not.toEqual(expect.objectContaining({
      rubric: expect.anything(),
      remediationTopics: expect.anything(),
      sourceEvidence: expect.anything(),
    }));

    const privateSession = await InterviewSession.findById(sessionId).select('+codingPrivate');
    const expectedCheckIds = privateSession.codingPrivate.rubric.groups
      .flatMap((group) => group.checkIds)
      .sort();
    expect(prepared.body.prepared.expectedCheckIds).toEqual(expectedCheckIds);
    const checks = expectedCheckIds.map((id) => ({ id, passed: true }));
    const completedChecks = await request(app)
      .post(`/api/interviews/${sessionId}/coding/check-runs`)
      .set('Authorization', authHeader(user._id))
      .send({
        action: 'complete',
        expectedVersion: version,
        draftHash,
        runToken: prepared.body.prepared.runToken,
        checks,
      });
    expect(completedChecks.status).toBe(200);
    expect(completedChecks.body.session.coding.checkRuns[0]).toEqual(
      expect.objectContaining({
        draftHash,
        passedCount: checks.length,
        totalCount: checks.length,
      })
    );
    expect(forbiddenPath(completedChecks.body)).toBeNull();
    version = completedChecks.body.session.version;
    expect(await InterviewConsumedRunToken.countDocuments({
      sessionId,
    })).toBe(1);
    const consumedToken = await InterviewConsumedRunToken.findOne({ sessionId }).lean();
    expect(consumedToken.expiresAt.getTime()).toBeGreaterThan(consumedToken.consumedAt.getTime());
    expect(InterviewConsumedRunToken.schema.indexes()).toEqual(expect.arrayContaining([
      [
        { expiresAt: 1 },
        expect.objectContaining({
          expireAfterSeconds: 0,
          name: 'ttl_interview_consumed_run_token',
        }),
      ],
    ]));

    const persistedCheckRun = (
      await InterviewSession.findById(sessionId).select('codingCheckRuns').lean()
    ).codingCheckRuns[0];
    await InterviewSession.updateOne(
      { _id: sessionId },
      { $set: { codingCheckRuns: [] } }
    );

    const reusedRunToken = await request(app)
      .post(`/api/interviews/${sessionId}/coding/check-runs`)
      .set('Authorization', authHeader(user._id))
      .send({
        action: 'complete',
        expectedVersion: version,
        draftHash,
        runToken: prepared.body.prepared.runToken,
        checks,
        clientRetryMarker: 'different-mutation',
      });
    expect(reusedRunToken.status).toBe(409);
    expect(reusedRunToken.body.code).toBe('INTERVIEW_RUN_TOKEN_REUSED');
    await InterviewSession.updateOne(
      { _id: sessionId },
      { $set: { codingCheckRuns: [persistedCheckRun] } }
    );

    const submittedCoding = await request(app)
      .post(`/api/interviews/${sessionId}/coding/submit`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: version, draftHash });
    expect(submittedCoding.status).toBe(200);
    expect(submittedCoding.body.session.status).toBe('completed');
    expect(submittedCoding.body.session.resultAvailable).toBe(true);

    const results = await request(app)
      .get(`/api/interviews/${sessionId}/results`)
      .set('Authorization', authHeader(user._id));
    expect(results.status).toBe(200);
    expect(results.body.results).toEqual(expect.objectContaining({
      xpAwarded: 0,
      employmentPrediction: null,
      evidenceNotice: expect.any(String),
      mcq: expect.objectContaining({
        total: 5,
        correct: 1,
        unanswered: 4,
        breakdown: {
          core: expect.objectContaining({ total: 3 }),
          framework: expect.objectContaining({ total: 2 }),
        },
        timing: expect.objectContaining({
          usedSeconds: expect.any(Number),
          allowedSeconds: expect.any(Number),
        }),
      }),
      coding: expect.objectContaining({
        submitted: true,
        locallyVerified: true,
        authoritativeEvaluation: false,
        evidenceMode: 'client-self-report',
        timing: expect.objectContaining({
          usedSeconds: expect.any(Number),
          allowedSeconds: expect.any(Number),
        }),
      }),
    }));
    expect(results.body.results.reviewNext.length).toBeLessThanOrEqual(3);
    expect(results.body.results.coding.rubric.every(
      (group) => group.status === 'not_evaluated' && group.checkIds.length === 0
    ))
      .toBe(true);
    expect(results.body.results.mcq.questions[0].correctOptionId).toBeDefined();

    expect(await gamificationSnapshot(user._id)).toEqual(gamificationBefore);
  });

  test('free quota is consumed by an ended session while effective premium is unlimited', async () => {
    const freeUser = await createUser('quota_free');
    const first = await createInterview(freeUser, { requestId: 'free-quota-first-0001' });
    expect(first.status).toBe(201);
    const ended = await request(app)
      .post(`/api/interviews/${first.body.session.id}/end`)
      .set('Authorization', authHeader(freeUser._id))
      .send({ expectedVersion: first.body.session.version });
    expect(ended.status).toBe(200);
    expect(ended.body.session.status).toBe('abandoned');

    const endedResults = await request(app)
      .get(`/api/interviews/${first.body.session.id}/results`)
      .set('Authorization', authHeader(freeUser._id));
    expect(endedResults.status).toBe(200);
    expect(endedResults.body.results.xpAwarded).toBe(0);

    const exhausted = await createInterview(freeUser, {
      requestId: 'free-quota-second-0002',
    });
    expect(exhausted.status).toBe(403);
    expect(exhausted.body.code).toBe('INTERVIEW_MONTHLY_QUOTA_EXHAUSTED');

    const premiumUser = await createUser('quota_premium', { cancelledValid: true });
    const premiumFirst = await createInterview(premiumUser, {
      requestId: 'premium-first-0001',
    });
    expect(premiumFirst.status).toBe(201);
    expect(premiumFirst.body.session.entitlement.tier).toBe('premium');
    await request(app)
      .post(`/api/interviews/${premiumFirst.body.session.id}/end`)
      .set('Authorization', authHeader(premiumUser._id))
      .send({ expectedVersion: premiumFirst.body.session.version })
      .expect(200);
    const premiumSecond = await createInterview(premiumUser, {
      requestId: 'premium-second-0002',
    });
    expect(premiumSecond.status).toBe(201);
    expect(await InterviewMonthlyQuota.countDocuments({ userId: premiumUser._id })).toBe(0);
  });

  test('concurrent starts with one idempotency key replay one session and one quota slot', async () => {
    const user = await createUser('same_key_race');
    const requestId = 'same-key-race-0001';
    const [left, right] = await Promise.all([
      createInterview(user, { requestId }),
      createInterview(user, { requestId }),
    ]);

    expect([left.status, right.status].sort()).toEqual([200, 201]);
    expect(left.body.session.id).toBe(right.body.session.id);
    expect([left.body.replayed, right.body.replayed].sort()).toEqual([false, true]);
    expect(await InterviewSession.countDocuments({ userId: user._id })).toBe(1);
    const quota = await InterviewMonthlyQuota.findOne({ userId: user._id }).lean();
    expect(quota.requestIds).toEqual([requestId]);
  });

  test('concurrent distinct starts cannot overdraw the single free quota slot', async () => {
    const user = await createUser('distinct_key_race');
    const attempts = [
      { requestId: 'distinct-key-race-a-0001' },
      { requestId: 'distinct-key-race-b-0002' },
    ];
    const responses = await Promise.all(
      attempts.map(({ requestId }) => createInterview(user, { requestId }))
    );

    expect(responses.map((response) => response.status).sort()).toEqual([201, 403]);
    const winnerIndex = responses.findIndex((response) => response.status === 201);
    expect(responses[1 - winnerIndex].body.code).toBe('INTERVIEW_MONTHLY_QUOTA_EXHAUSTED');
    expect(await InterviewSession.countDocuments({ userId: user._id })).toBe(1);
    const quota = await InterviewMonthlyQuota.findOne({ userId: user._id }).lean();
    expect(quota.requestIds).toEqual([attempts[winnerIndex].requestId]);
  });

  test('pins entitlement per session and applies a later downgrade only to a new session', async () => {
    const user = await createUser('entitlement_snapshot', { premium: true });
    const premiumSession = await createInterview(user, {
      requestId: 'entitlement-premium-0001',
    });
    expect(premiumSession.status).toBe(201);
    expect(premiumSession.body.session.entitlement.tier).toBe('premium');

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          'entitlements.pro.status': 'none',
          'entitlements.pro.validUntil': null,
        },
      }
    );

    const resumed = await request(app)
      .get(`/api/interviews/${premiumSession.body.session.id}`)
      .set('Authorization', authHeader(user._id));
    expect(resumed.status).toBe(200);
    expect(resumed.body.session.entitlement.tier).toBe('premium');

    await request(app)
      .post(`/api/interviews/${premiumSession.body.session.id}/end`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: resumed.body.session.version })
      .expect(200);

    const freeSession = await createInterview(user, {
      requestId: 'entitlement-free-0002',
    });
    expect(freeSession.status).toBe(201);
    expect(freeSession.body.session.entitlement.tier).toBe('free');
    const quota = await InterviewMonthlyQuota.findOne({ userId: user._id }).lean();
    expect(quota.requestIds).toEqual(['entitlement-free-0002']);
  });

  test('technical void rejects results, refunds free quota, and allows a replacement session', async () => {
    const user = await createUser('technical_void');
    const created = await createInterview(user, {
      requestId: 'technical-void-0001',
    });
    expect(created.status).toBe(201);

    const reserved = await InterviewMonthlyQuota.findOne({ userId: user._id }).lean();
    expect(reserved.requestIds).toEqual(['technical-void-0001']);

    const releaseAttempt = jest
      .spyOn(InterviewMonthlyQuota, 'updateOne')
      .mockRejectedValueOnce(new Error('temporary quota write failure'));
    await expect(
      voidSessionTechnical(user._id, created.body.session.id)
    ).rejects.toThrow('temporary quota write failure');

    const savedVoid = await InterviewSession.findById(created.body.session.id)
      .select('+resultSnapshot')
      .lean();
    expect(savedVoid.status).toBe('voided_technical');
    expect(savedVoid.active).toBe(false);
    expect(savedVoid.resultSnapshot).toBeNull();
    expect(
      (await InterviewMonthlyQuota.findOne({ userId: user._id }).lean()).requestIds
    ).toEqual(['technical-void-0001']);

    const voided = await voidSessionTechnical(user._id, created.body.session.id);
    releaseAttempt.mockRestore();
    expect(voided.status).toBe('voided_technical');
    expect(voided.active).toBe(false);
    expect(voided.resultSnapshot).toBeNull();

    const refunded = await InterviewMonthlyQuota.findOne({ userId: user._id }).lean();
    expect(refunded.requestIds).toEqual([]);

    const results = await request(app)
      .get(`/api/interviews/${created.body.session.id}/results`)
      .set('Authorization', authHeader(user._id));
    expect(results.status).toBe(409);
    expect(results.body.code).toBe('INTERVIEW_SESSION_VOIDED');

    const replacement = await createInterview(user, {
      requestId: 'technical-void-0002',
    });
    expect(replacement.status).toBe(201);
  });

  test('allows only an admin-verified platform fault to trigger the technical refund route', async () => {
    const user = await createUser('admin_void_target');
    const admin = await createUser('admin_void_operator', { role: 'admin' });
    const created = await createInterview(user, {
      requestId: 'admin-void-target-0001',
    });
    expect(created.status).toBe(201);
    await InterviewSession.updateOne(
      { _id: created.body.session.id },
      {
        $set: {
          active: false,
          status: 'completed',
          codingOutcome: 'not_started_timeout',
          completedAt: new Date(),
          resultSnapshot: { shouldBeRemoved: true },
        },
      }
    );

    const denied = await request(app)
      .post(`/api/interviews/${created.body.session.id}/technical-void`)
      .set('Authorization', authHeader(user._id))
      .send({ reasonCode: 'platform_outage' });
    expect(denied.status).toBe(403);

    const originalAccess = process.env.INTERVIEW_MODE_ACCESS;
    process.env.INTERVIEW_MODE_ACCESS = 'off';
    let verified;
    try {
      verified = await request(app)
        .post(`/api/interviews/${created.body.session.id}/technical-void`)
        .set('Authorization', authHeader(admin._id))
        .send({ reasonCode: 'platform_outage' });
    } finally {
      process.env.INTERVIEW_MODE_ACCESS = originalAccess;
    }
    expect(verified.status).toBe(200);
    expect(verified.body.session.status).toBe('voided_technical');
    expect(
      (await InterviewMonthlyQuota.findOne({ userId: user._id }).lean()).requestIds
    ).toEqual([]);

    const stored = await InterviewSession.findById(created.body.session.id)
      .select('+resultSnapshot')
      .lean();
    expect(stored.resultSnapshot).toBeNull();
    expect(stored.technicalVoid).toEqual(expect.objectContaining({
      reasonCode: 'platform_outage',
      verifiedBy: admin._id,
      verifiedAt: expect.any(Date),
    }));
  });

  test('deadline reconciliation auto-locks MCQ and completes after five-minute coding-ready grace', async () => {
    const user = await createUser('timeout', { premium: true });
    const created = await createInterview(user, {
      requestId: 'timeout-create-0001',
      level: 'junior',
      track: 'core-web',
    });
    expect(created.status).toBe(201);
    const past = new Date(Date.now() - 10 * 60 * 1000);
    await InterviewSession.updateOne(
      { _id: created.body.session.id },
      { $set: { mcqDeadlineAt: past } }
    );

    const reconciled = await request(app)
      .get(`/api/interviews/${created.body.session.id}`)
      .set('Authorization', authHeader(user._id));
    expect(reconciled.status).toBe(200);
    expect(reconciled.body.session.status).toBe('completed');
    expect(reconciled.body.session.coding.outcome).toBe('not_started_timeout');
    expect(forbiddenPath(reconciled.body)).toBeNull();

    const results = await request(app)
      .get(`/api/interviews/${created.body.session.id}/results`)
      .set('Authorization', authHeader(user._id));
    expect(results.status).toBe(200);
    expect(results.body.results.mcq.unanswered).toBe(5);
    expect(results.body.results.coding.outcome).toBe('not_started_timeout');
  });

  test('deadline reconciliation finalizes an active coding stage as timed out', async () => {
    const user = await createUser('coding_timeout', { premium: true });
    const created = await createInterview(user, {
      requestId: 'coding-timeout-create-0001',
      level: 'mid',
      track: 'vue',
    });
    const submittedMcq = await request(app)
      .post(`/api/interviews/${created.body.session.id}/mcq/submit`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: created.body.session.version });
    expect(submittedMcq.status).toBe(200);

    const started = await request(app)
      .post(`/api/interviews/${created.body.session.id}/coding/start`)
      .set('Authorization', authHeader(user._id))
      .send({ expectedVersion: submittedMcq.body.session.version });
    expect(started.status).toBe(200);
    expect(started.body.session.status).toBe('coding_active');

    await InterviewSession.updateOne(
      { _id: created.body.session.id },
      { $set: { codingDeadlineAt: new Date(Date.now() - 1000) } }
    );
    const reconciled = await request(app)
      .get(`/api/interviews/${created.body.session.id}`)
      .set('Authorization', authHeader(user._id));
    expect(reconciled.status).toBe(200);
    expect(reconciled.body.session.status).toBe('completed');
    expect(reconciled.body.session.coding.outcome).toBe('timed_out');
    expect(forbiddenPath(reconciled.body)).toBeNull();

    const results = await request(app)
      .get(`/api/interviews/${created.body.session.id}/results`)
      .set('Authorization', authHeader(user._id));
    expect(results.status).toBe(200);
    expect(results.body.results.coding).toEqual(expect.objectContaining({
      submitted: false,
      outcome: 'timed_out',
      authoritativeEvaluation: false,
    }));
  });

  test('session ownership is enforced without revealing whether another user session exists', async () => {
    const owner = await createUser('owner', { premium: true });
    const stranger = await createUser('stranger', { premium: true });
    const created = await createInterview(owner, {
      requestId: 'ownership-create-0001',
    });
    expect(created.status).toBe(201);

    const response = await request(app)
      .get(`/api/interviews/${created.body.session.id}`)
      .set('Authorization', authHeader(stranger._id));
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('INTERVIEW_SESSION_NOT_FOUND');
  });

  test('cookie-auth interview mutations require a matching CSRF token', async () => {
    const user = await createUser('cookie_csrf');
    const accessToken = authHeader(user._id).slice('Bearer '.length);
    const csrfToken = 'interview-csrf-token';
    const cookies = [`access_token=${accessToken}`, `csrf_token=${csrfToken}`];
    const body = {
      level: 'mid',
      track: 'react',
      timingMode: 'standard',
      viewportWidth: 1366,
    };

    const missing = await request(app)
      .post('/api/interviews')
      .set('Cookie', cookies)
      .set('Idempotency-Key', 'cookie-csrf-missing-0001')
      .send(body);
    expect(missing.status).toBe(403);
    expect(missing.body.code).toBe('AUTH_CSRF_INVALID');

    const mismatched = await request(app)
      .post('/api/interviews')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', `${csrfToken}-wrong`)
      .set('Idempotency-Key', 'cookie-csrf-mismatch-0002')
      .send(body);
    expect(mismatched.status).toBe(403);
    expect(mismatched.body.code).toBe('AUTH_CSRF_INVALID');

    const matched = await request(app)
      .post('/api/interviews')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .set('Idempotency-Key', 'cookie-csrf-valid-0003')
      .send(body);
    expect(matched.status).toBe(201);
    expect(matched.body.session.status).toBe('mcq_active');
  });

  test('disabled feature flag returns a safe availability shell and rejects mutations', async () => {
    const user = await createUser('disabled_flag');
    const originalAccess = process.env.INTERVIEW_MODE_ACCESS;
    const originalBankPath = process.env.INTERVIEW_BANK_PUBLIC_PATH;
    process.env.INTERVIEW_MODE_ACCESS = 'off';
    process.env.INTERVIEW_BANK_PUBLIC_PATH = '/definitely/missing/interview-bank.json';
    try {
      const availability = await request(app)
        .get('/api/interviews/availability')
        .set('Authorization', authHeader(user._id));
      expect(availability.status).toBe(200);
      expect(availability.body).toEqual(expect.objectContaining({
        enabled: false,
        accessMode: 'off',
        availability: [],
        activeSession: null,
        lastResults: [],
      }));

      const create = await createInterview(user, {
        requestId: 'disabled-flag-create-0001',
      });
      expect(create.status).toBe(404);
      expect(create.body.code).toBe('INTERVIEW_MODE_DISABLED');
    } finally {
      process.env.INTERVIEW_MODE_ACCESS = originalAccess;
      if (originalBankPath === undefined) {
        delete process.env.INTERVIEW_BANK_PUBLIC_PATH;
      } else {
        process.env.INTERVIEW_BANK_PUBLIC_PATH = originalBankPath;
      }
    }
  });
});
