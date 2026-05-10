'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let DailyChallengeAssignment;
let PracticeProgress;
let WeeklyGoalBonusCredit;
let UserAchievement;
let loadQuestionCatalog;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_dashboard_route';

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  DailyChallengeAssignment = require('../models/DailyChallengeAssignment');
  PracticeProgress = require('../models/PracticeProgress');
  WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
  UserAchievement = require('../models/UserAchievement');
  ({ loadQuestionCatalog } = require('../services/gamification/question-catalog'));

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await DailyChallengeAssignment.deleteMany({});
  await PracticeProgress.deleteMany({});
  await WeeklyGoalBonusCredit.deleteMany({});
  await UserAchievement.deleteMany({});
});

describe('GET /api/dashboard', () => {
  test('returns gamification payload shape for authenticated user', async () => {
    const user = await User.create({
      email: 'dash@example.com',
      username: 'dash_user',
      passwordHash: 'hash',
      solvedQuestionIds: ['react-counter'],
      stats: { xpTotal: 240, completedTotal: 1 },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        nextBestAction: expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          route: expect.any(String),
        }),
        dailyChallenge: expect.objectContaining({
          dayKey: expect.any(String),
          questionId: expect.any(String),
          title: expect.any(String),
          route: expect.any(String),
          completed: expect.any(Boolean),
          streak: expect.objectContaining({
            current: expect.any(Number),
            longest: expect.any(Number),
          }),
        }),
        weeklyGoal: expect.objectContaining({
          enabled: expect.any(Boolean),
          target: expect.any(Number),
          completed: expect.any(Number),
          progress: expect.any(Number),
        }),
        xpLevel: expect.objectContaining({
          totalXp: expect.any(Number),
          level: expect.any(Number),
          nextLevelXp: expect.any(Number),
        }),
        progress: expect.objectContaining({
          questions: expect.objectContaining({
            solvedCount: expect.any(Number),
            totalCount: expect.any(Number),
            solvedPercent: expect.any(Number),
            topTopics: expect.any(Array),
          }),
          incidents: expect.objectContaining({
            passedCount: expect.any(Number),
            totalCount: expect.any(Number),
            passedPercent: expect.any(Number),
          }),
          practice: expect.objectContaining({
            completedCount: expect.any(Number),
            totalCount: expect.any(Number),
            completedPercent: expect.any(Number),
          }),
        }),
        achievements: expect.objectContaining({
          summary: expect.objectContaining({
            unlockedCount: expect.any(Number),
            totalCount: expect.any(Number),
          }),
          unlocked: expect.any(Array),
          next: expect.any(Array),
        }),
        settings: expect.objectContaining({
          showStreakWidget: expect.any(Boolean),
          dailyChallengeTech: expect.any(String),
        }),
      })
    );
  });

  test('includes unseen earned badges and marks them seen for the current user', async () => {
    const [user, otherUser] = await User.create([
      {
        email: 'dash-unseen@example.com',
        username: 'dash_unseen_user',
        passwordHash: 'hash',
      },
      {
        email: 'dash-unseen-other@example.com',
        username: 'dash_unseen_other_user',
        passwordHash: 'hash',
      },
    ]);
    await UserAchievement.create([
      {
        userId: user._id,
        achievementId: 'first-steps',
        earnedAt: new Date('2026-03-20T10:00:00.000Z'),
        seenAt: null,
      },
      {
        userId: otherUser._id,
        achievementId: 'first-steps',
        earnedAt: new Date('2026-03-20T10:00:00.000Z'),
        seenAt: null,
      },
    ]);

    const dashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(dashboard.status).toBe(200);
    expect(dashboard.body?.achievements?.unlocked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'first-steps',
          earnedAt: '2026-03-20T10:00:00.000Z',
          unlocked: true,
        }),
      ])
    );
    expect(dashboard.body?.achievements?.unseen).toEqual([
      expect.objectContaining({
        id: 'first-steps',
        earnedAt: '2026-03-20T10:00:00.000Z',
      }),
    ]);

    const seen = await request(app)
      .post('/api/achievements/seen')
      .set('Authorization', authHeader(user._id))
      .send({ ids: ['first-steps', 'not-a-real-badge'] });

    expect(seen.status).toBe(200);
    expect(seen.body).toEqual(expect.objectContaining({
      ok: true,
      ids: ['first-steps'],
      modifiedCount: 1,
    }));

    const [currentRecord, otherRecord] = await Promise.all([
      UserAchievement.findOne({ userId: user._id, achievementId: 'first-steps' }).lean(),
      UserAchievement.findOne({ userId: otherUser._id, achievementId: 'first-steps' }).lean(),
    ]);
    expect(currentRecord?.seenAt).toBeTruthy();
    expect(otherRecord?.seenAt).toBeNull();
  });

  test('keeps same challenge for the same user/day after assignment is created', async () => {
    const user = await User.create({
      email: 'stable@example.com',
      username: 'stable_user',
      passwordHash: 'hash',
      solvedQuestionIds: ['react-counter', 'vue-counter'],
      prefs: { gamification: { dailyChallengeTech: 'react' } },
    });

    const first = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));
    expect(first.status).toBe(200);
    const firstChallengeId = first.body?.dailyChallenge?.questionId;
    expect(firstChallengeId).toEqual(expect.any(String));

    await User.updateOne(
      { _id: user._id },
      { $set: { 'prefs.gamification.dailyChallengeTech': 'vue' } }
    );

    const second = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));
    expect(second.status).toBe(200);
    const secondChallengeId = second.body?.dailyChallenge?.questionId;

    expect(secondChallengeId).toBe(firstChallengeId);
    expect(second.body?.dailyChallenge?.dayKey).toBe(first.body?.dailyChallenge?.dayKey);
  });

  test('drops removed question ids from progress totals while preserving current catalog coverage', async () => {
    const user = await User.create({
      email: 'removed-progress@example.com',
      username: 'removed_progress_user',
      passwordHash: 'hash',
      solvedQuestionIds: ['react-counter', 'removed-question-id'],
      stats: { xpTotal: 120, completedTotal: 2 },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.progress?.questions?.solvedCount).toBe(1);
    expect(res.body?.progress?.questions?.totalCount).toBeGreaterThan(1);
    expect(res.body?.progress?.questions?.solvedPercent).toBe(
      Math.round((1 / Number(res.body?.progress?.questions?.totalCount || 1)) * 100)
    );
    expect(Array.isArray(res.body?.progress?.questions?.topTopics)).toBe(true);
    expect(res.body?.achievements?.next?.find((badge) => badge.id === 'question-builder')).toEqual(
      expect.objectContaining({
        current: 1,
        icon: 'code',
        target: 10,
        theme: 'cyan',
        unlocked: false,
      })
    );
  });

  test('includes incident pass counts separately from question coverage', async () => {
    const user = await User.create({
      email: 'incident-progress@example.com',
      username: 'incident_progress_user',
      passwordHash: 'hash',
      solvedQuestionIds: ['react-counter'],
      stats: { xpTotal: 120, completedTotal: 2 },
    });

    await PracticeProgress.create([
      {
        userId: user._id,
        family: 'incident',
        itemId: 'search-typing-lag',
        started: true,
        completed: true,
        passed: true,
        bestScore: 84,
        lastPlayedAt: new Date('2026-03-20T10:00:00.000Z'),
        extension: { reflectionNote: 'Throttle the expensive render path.' },
      },
      {
        userId: user._id,
        family: 'incident',
        itemId: 'stale-search-race',
        started: true,
        completed: true,
        passed: false,
        bestScore: 62,
        lastPlayedAt: new Date('2026-03-20T11:00:00.000Z'),
        extension: {},
      },
    ]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.progress?.questions?.solvedCount).toBe(1);
    expect(res.body?.progress?.incidents?.passedCount).toBe(1);
    expect(res.body?.progress?.incidents?.totalCount).toBeGreaterThanOrEqual(6);
    expect(res.body?.progress?.practice?.completedCount).toBe(2);
    expect(res.body?.progress?.practice?.totalCount).toBe(
      Number(res.body?.progress?.questions?.totalCount || 0)
      + Number(res.body?.progress?.incidents?.totalCount || 0)
      + Number(res.body?.progress?.tradeoffBattles?.totalCount || 0)
    );
  });

  test('counts completed tradeoff battles inside overall practice progress', async () => {
    const user = await User.create({
      email: 'tradeoff-progress@example.com',
      username: 'tradeoff_progress_user',
      passwordHash: 'hash',
      solvedQuestionIds: ['react-counter'],
      stats: { xpTotal: 120, completedTotal: 2 },
    });

    await PracticeProgress.create({
      userId: user._id,
      family: 'tradeoff-battle',
      itemId: 'context-vs-zustand-vs-redux',
      started: true,
      completed: true,
      passed: false,
      bestScore: 0,
      lastPlayedAt: new Date('2026-03-20T10:00:00.000Z'),
      extension: { selectedOptionId: 'zustand', revealed: true },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.progress?.tradeoffBattles?.completedCount).toBe(1);
    expect(res.body?.progress?.tradeoffBattles?.totalCount).toBeGreaterThanOrEqual(1);
    expect(res.body?.progress?.practice?.completedCount).toBe(2);
    expect(res.body?.progress?.practice?.totalCount).toBe(
      Number(res.body?.progress?.questions?.totalCount || 0)
      + Number(res.body?.progress?.incidents?.totalCount || 0)
      + Number(res.body?.progress?.tradeoffBattles?.totalCount || 0)
    );
  });

  test('returns locked achievement progress for old XP-only users without breaking XP payload', async () => {
    const user = await User.create({
      email: 'xp-only@example.com',
      username: 'xp_only_user',
      passwordHash: 'hash',
      stats: { xpTotal: 800, completedTotal: 0 },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.xpLevel?.totalXp).toBe(800);
    expect(res.body?.achievements?.summary).toEqual({
      unlockedCount: 0,
      totalCount: 7,
    });
    expect(res.body?.achievements?.unlocked).toEqual([]);
    expect(res.body?.achievements?.next?.[0]).toEqual(
      expect.objectContaining({
        id: 'first-steps',
        icon: 'flag',
        current: 0,
        target: 3,
        theme: 'gold',
      })
    );
  });

  test('unlocks all V1 achievements from existing progress signals', async () => {
    const catalog = loadQuestionCatalog();
    const solvedQuestionIds = catalog.all.slice(0, 25).map((question) => question.id);

    const user = await User.create({
      email: 'badges@example.com',
      username: 'badges_user',
      passwordHash: 'hash',
      solvedQuestionIds,
      stats: {
        xpTotal: 800,
        completedTotal: 25,
        streak: { current: 2, longest: 7, lastActiveUTCDate: '2026-03-20' },
      },
    });

    await PracticeProgress.create([
      {
        userId: user._id,
        family: 'incident',
        itemId: 'search-typing-lag',
        started: true,
        completed: true,
        passed: true,
        bestScore: 84,
        lastPlayedAt: new Date('2026-03-20T10:00:00.000Z'),
        extension: {},
      },
      {
        userId: user._id,
        family: 'tradeoff-battle',
        itemId: 'context-vs-zustand-vs-redux',
        started: true,
        completed: true,
        passed: false,
        bestScore: 0,
        lastPlayedAt: new Date('2026-03-20T11:00:00.000Z'),
        extension: {},
      },
    ]);
    await WeeklyGoalBonusCredit.create({
      userId: user._id,
      weekKey: '2026-03-16',
      xp: 50,
      grantedAt: new Date('2026-03-20T12:00:00.000Z'),
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.achievements?.summary).toEqual({
      unlockedCount: 7,
      totalCount: 7,
    });
    expect(res.body?.achievements?.next).toEqual([]);
    expect(res.body?.achievements?.unlocked?.map((badge) => badge.id)).toEqual([
      'first-steps',
      'question-builder',
      'coverage-builder',
      'debug-starter',
      'tradeoff-starter',
      'weekly-finisher',
      'consistency',
    ]);
    expect(res.body?.achievements?.unlocked?.find((badge) => badge.id === 'consistency')).toEqual(
      expect.objectContaining({
        icon: 'flame',
        theme: 'rose',
      })
    );
  });
});
