'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let DailyChallengeAssignment;
let PracticeProgress;
let ActivityCompletion;
let ActivityEvent;
let EditorAssistAttempt;
let WeeklyGoalBonusCredit;
let UserAchievement;
let loadQuestionCatalog;
let loadPracticeCatalog;
let getQuestionReadinessBucket;
let loadEssentialPriority;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_dashboard_route';

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function questionsFor(catalog, { tech = 'javascript', kind = 'coding', difficulty = null } = {}) {
  const difficulties = Array.isArray(difficulty)
    ? new Set(difficulty)
    : (difficulty ? new Set([difficulty]) : null);
  return catalog.all.filter((question) => {
    if (question.tech !== tech || question.kind !== kind) return false;
    if (difficulties && !difficulties.has(question.difficulty)) return false;
    return true;
  });
}

function selectConcentratedQuestionIds(catalog, { tech = 'javascript', kind = 'coding', bucketLabel = 'Async & Runtime' } = {}) {
  return questionsFor(catalog, { tech, kind })
    .filter((question) => getQuestionReadinessBucket(question, tech).label === bucketLabel)
    .map((question) => question.id);
}

function selectDiverseQuestionIds(
  catalog,
  {
    tech = 'javascript',
    kind = 'coding',
    target,
    perBucketCap,
    difficulty = null,
  } = {},
) {
  const byBucket = new Map();
  for (const question of questionsFor(catalog, { tech, kind, difficulty })) {
    const bucket = getQuestionReadinessBucket(question, tech);
    if (bucket.countsForBreadth === false) continue;
    if (!byBucket.has(bucket.id)) byBucket.set(bucket.id, []);
    byBucket.get(bucket.id).push(question);
  }

  const buckets = [...byBucket.values()]
    .filter((items) => items.length > 0)
    .sort((a, b) => b.length - a.length || a[0].id.localeCompare(b[0].id));
  const selected = [];
  for (let round = 0; round < perBucketCap && selected.length < target; round += 1) {
    for (const bucketItems of buckets) {
      const question = bucketItems[round];
      if (question) selected.push(question.id);
      if (selected.length >= target) break;
    }
  }
  return selected;
}

async function seedPracticeProgress(
  userId,
  {
    incidents = 0,
    tradeoffs = 0,
    lastPlayedAt = new Date(),
    completedAt = lastPlayedAt,
    passedAt = completedAt,
  } = {},
) {
  const rows = [];
  const practiceCatalog = loadPracticeCatalog();
  const jsIncidentIds = (practiceCatalog.byFamily.get('incident') || [])
    .filter((entry) => entry.tech === 'javascript')
    .map((entry) => entry.id);
  const jsTradeoffIds = (practiceCatalog.byFamily.get('tradeoff-battle') || [])
    .filter((entry) => entry.tech === 'javascript')
    .map((entry) => entry.id);
  const playedAt = new Date(lastPlayedAt);
  const completionDate = completedAt ? new Date(completedAt) : null;
  const passDate = passedAt ? new Date(passedAt) : null;
  for (let index = 0; index < incidents; index += 1) {
    rows.push({
      userId,
      family: 'incident',
      itemId: jsIncidentIds[index] || `incident-${index}`,
      started: true,
      completed: true,
      passed: true,
      bestScore: 80,
      lastPlayedAt: playedAt,
      completedAt: completionDate,
      passedAt: passDate,
    });
  }
  for (let index = 0; index < tradeoffs; index += 1) {
    rows.push({
      userId,
      family: 'tradeoff-battle',
      itemId: jsTradeoffIds[index] || `tradeoff-${index}`,
      started: true,
      completed: true,
      passed: true,
      bestScore: 100,
      lastPlayedAt: playedAt,
      completedAt: completionDate,
      passedAt: passDate,
    });
  }
  if (rows.length) await PracticeProgress.create(rows);
}

function jsPracticeId(family, index = 0) {
  const practiceCatalog = loadPracticeCatalog();
  const entry = (practiceCatalog.byFamily.get(family) || [])
    .filter((item) => item.tech === 'javascript')[index];
  return entry?.id || `${family}-${index}`;
}

async function seedQuestionCompletions(
  userId,
  catalog,
  {
    ids,
    tech = 'javascript',
    kind = 'coding',
    completedAt = new Date(),
    lastAttemptAt = completedAt,
  } = {},
) {
  const byId = new Map(catalog.all.map((question) => [question.id, question]));
  const rows = (ids || []).map((id) => {
    const question = byId.get(id);
    const completedDate = new Date(completedAt);
    const attemptDate = lastAttemptAt ? new Date(lastAttemptAt) : completedDate;
    return {
      userId,
      kind: question?.kind || kind,
      itemId: id,
      tech: question?.tech || tech,
      source: 'tech',
      durationMin: 5,
      difficultySnapshot: question?.difficulty || 'intermediate',
      xpAwarded: 10,
      completedAt: completedDate,
      lastAttemptAt: attemptDate,
      dayUTC: completedDate.toISOString().slice(0, 10),
      active: true,
    };
  });
  if (rows.length) await ActivityCompletion.create(rows);
}

async function seedWeeklyCompletions(userId, { count = 10, tech = 'javascript' } = {}) {
  const today = new Date();
  await ActivityCompletion.create(
    Array.from({ length: count }, (_, index) => ({
      userId,
      kind: 'coding',
      itemId: `weekly-${tech}-${index}`,
      tech,
      source: 'tech',
      durationMin: 5,
      xpAwarded: 10,
      completedAt: today,
      dayUTC: today.toISOString().slice(0, 10),
      active: true,
    })),
  );
}

async function seedEditorAssistAttempts(
  userId,
  {
    questionId = 'js-debounce',
    lang = 'js',
    category = 'async-promise-mismatch',
    runs = [],
  } = {},
) {
  const baseTs = Date.now() - 60_000;
  const rows = runs.map((run, index) => {
    const ts = Number(run.ts || (baseTs + index * 1_000));
    return {
      userId,
      questionId,
      lang: run.lang || lang,
      ts,
      passCount: Number(run.passCount ?? 0),
      totalCount: Number(run.totalCount ?? 3),
      firstFailName: run.firstFailName || 'fails async behavior',
      errorLine: run.errorLine || 'Expected resolved value to match',
      signature: run.signature || `${questionId}|${category}|${index}`,
      codeHash: run.codeHash || `hash-${index}`,
      codeChanged: run.codeChanged !== false,
      interviewMode: Boolean(run.interviewMode),
      errorCategory: run.errorCategory || category,
      tags: run.tags || ['async', 'promise'],
      minuteBucket: Math.floor(ts / 60_000),
      recordKey: `${questionId}|${run.signature || `${category}-${index}`}|${Math.floor(ts / 60_000)}`,
    };
  });
  if (rows.length) await EditorAssistAttempt.create(rows);
}

async function seedFullJavascriptReadiness(user, catalog) {
  const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
    tech: 'javascript',
    kind: 'coding',
    target: 12,
    perBucketCap: 3,
    difficulty: ['intermediate', 'hard'],
  });
  const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
    tech: 'javascript',
    kind: 'trivia',
    target: 20,
    perBucketCap: 5,
    difficulty: ['intermediate', 'hard'],
  });
  user.solvedQuestionIds = [...javascriptCodingIds, ...javascriptTriviaIds];
  await user.save();
  await seedQuestionCompletions(user._id, catalog, {
    ids: [...javascriptCodingIds, ...javascriptTriviaIds],
    tech: 'javascript',
  });
  await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
  await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });
}

async function seedFullFrameworkReadiness(user, catalog, { tech = 'react' } = {}) {
  const codingIds = selectDiverseQuestionIds(catalog, {
    tech,
    kind: 'coding',
    target: 7,
    perBucketCap: 3,
  });
  const triviaIds = selectDiverseQuestionIds(catalog, {
    tech,
    kind: 'trivia',
    target: 12,
    perBucketCap: 5,
  });
  user.solvedQuestionIds = [...codingIds, ...triviaIds];
  await user.save();
  await seedQuestionCompletions(user._id, catalog, {
    ids: [...codingIds, ...triviaIds],
    tech,
  });
  await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
  await seedWeeklyCompletions(user._id, { count: 10, tech });
}

async function seedFullConceptOnlyReadiness(user, catalog, { tech = 'html' } = {}) {
  const conceptIds = selectDiverseQuestionIds(catalog, {
    tech,
    kind: 'trivia',
    target: 12,
    perBucketCap: 5,
  });
  user.solvedQuestionIds = conceptIds;
  await user.save();
  await seedQuestionCompletions(user._id, catalog, {
    ids: conceptIds,
    tech,
    kind: 'trivia',
  });
  await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
  await seedWeeklyCompletions(user._id, { count: 10, tech });
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
  ActivityCompletion = require('../models/ActivityCompletion');
  ActivityEvent = require('../models/ActivityEvent');
  EditorAssistAttempt = require('../models/EditorAssistAttempt');
  WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
  UserAchievement = require('../models/UserAchievement');
  ({ loadQuestionCatalog } = require('../services/gamification/question-catalog'));
  ({ loadPracticeCatalog } = require('../services/gamification/practice-catalog'));
  ({ getQuestionReadinessBucket } = require('../services/gamification/readiness-buckets'));
  ({ loadEssentialPriority } = require('../services/gamification/essential-priority'));

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
  await ActivityCompletion.deleteMany({});
  await ActivityEvent.deleteMany({});
  await EditorAssistAttempt.deleteMany({});
  await WeeklyGoalBonusCredit.deleteMany({});
  await UserAchievement.deleteMany({});
});

describe('GET /api/dashboard', () => {
  test('question catalog has no duplicate completion ids per kind', () => {
    const catalog = loadQuestionCatalog();
    const seen = new Map();
    const duplicates = [];
    for (const question of catalog.all) {
      const key = `${question.kind}:${question.id}`;
      if (seen.has(key)) {
        duplicates.push(`${key} (${seen.get(key)} / ${question.tech})`);
      } else {
        seen.set(key, question.tech);
      }
    }

    expect(duplicates).toEqual([]);
  });

  test('prep readiness read path has dashboard-specific indexes', () => {
    const activityIndexNames = ActivityCompletion.schema.indexes().map(([, options]) => options?.name);
    const progressIndexNames = PracticeProgress.schema.indexes().map(([, options]) => options?.name);
    const assistIndexNames = EditorAssistAttempt.schema.indexes().map(([, options]) => options?.name);

    expect(activityIndexNames).toContain('idx_activity_completion_dashboard_prep');
    expect(progressIndexNames).toContain('idx_practice_progress_user_family_last_played');
    expect(assistIndexNames).toContain('idx_editor_assist_user_question_ts');
  });

  test('essential priority loader falls back when the collection is unavailable', () => {
    const priority = loadEssentialPriority({
      collectionPath: '/not-a-real/frontend-essential-60.json',
      force: true,
    });

    expect(priority.byQuestionKey.size).toBe(0);
    expect(priority.byBucketKey.size).toBe(0);
  });

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
    expect(res.body?.prepLoop?.goal?.label).toBe('JavaScript intermediate prep');
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
        prepLoop: expect.objectContaining({
          goal: expect.objectContaining({
            tech: expect.any(String),
            level: expect.any(String),
            label: expect.any(String),
          }),
          targetProfile: expect.objectContaining({
            label: 'Intermediate',
            summary: 'Intermediate JavaScript target: 12 coding, 20 concepts, 1 currently available JS debug scenario, 3 JS tradeoffs, 6 intermediate/hard drills.',
            targets: expect.objectContaining({
              coding: 12,
              concepts: 20,
              debug: 1,
              tradeoffs: 3,
            }),
            breadth: expect.objectContaining({
              coding: 4,
              concepts: 5,
            }),
            difficulty: expect.objectContaining({
              advanced: 6,
            }),
            conceptOnly: false,
          }),
          readiness: expect.objectContaining({
            score: expect.any(Number),
            band: expect.any(String),
            components: expect.any(Array),
          }),
          weaknesses: expect.any(Array),
          nextDrill: expect.objectContaining({
            title: expect.any(String),
            route: expect.any(String),
            family: expect.any(String),
            reason: expect.any(String),
            cta: expect.any(String),
          }),
        }),
        settings: expect.objectContaining({
          showStreakWidget: expect.any(Boolean),
          dailyChallengeTech: expect.any(String),
        }),
      })
    );
  });

  test('returns default prep loop with low readiness and a coding/concept next drill for a no-progress user', async () => {
    const user = await User.create({
      email: 'prep-loop-empty@example.com',
      username: 'prep_loop_empty_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'react', level: 'intermediate' } },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.prepLoop?.goal).toEqual({
      tech: 'javascript',
      level: 'intermediate',
      label: 'JavaScript intermediate prep',
    });
    expect(res.body?.prepLoop?.readiness).toEqual(expect.objectContaining({
      score: expect.any(Number),
      band: 'Starting',
    }));
    expect(res.body?.prepLoop?.readiness?.score).toBeLessThan(40);
    expect(['coding', 'concepts']).toContain(res.body?.prepLoop?.weaknesses?.[0]?.id);
    expect(res.body?.prepLoop?.nextDrill).toEqual(expect.objectContaining({
      family: 'question',
      route: expect.stringMatching(/^\/javascript\/(coding|trivia)\//),
    }));
  });

  test('calibrates the same prep evidence against the saved target level', async () => {
    const catalog = loadQuestionCatalog();
    const codingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 8,
      perBucketCap: 3,
    });
    const triviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 12,
      perBucketCap: 5,
    });

    async function buildUserForLevel(level) {
      const user = await User.create({
        email: `prep-loop-level-${level}@example.com`,
        username: `prep_loop_level_${level}_user`,
        passwordHash: 'hash',
        accessTier: 'premium',
        prefs: {
          prepGoal: { tech: 'javascript', level },
          gamification: { weeklyGoalTarget: 10 },
        },
        solvedQuestionIds: [...codingIds, ...triviaIds],
      });
      await seedQuestionCompletions(user._id, catalog, {
        ids: [...codingIds, ...triviaIds],
        tech: 'javascript',
      });
      await seedPracticeProgress(user._id, { incidents: 1, tradeoffs: 1 });
      await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });
      return request(app)
        .get('/api/dashboard')
        .set('Authorization', authHeader(user._id));
    }

    const foundation = await buildUserForLevel('foundation');
    const intermediate = await buildUserForLevel('intermediate');
    const senior = await buildUserForLevel('senior');

    expect(foundation.status).toBe(200);
    expect(intermediate.status).toBe(200);
    expect(senior.status).toBe(200);

    const foundationComponents = Object.fromEntries(
      foundation.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    const intermediateComponents = Object.fromEntries(
      intermediate.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    const seniorComponents = Object.fromEntries(
      senior.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );

    expect(foundation.body.prepLoop.targetProfile.targets).toEqual(expect.objectContaining({
      coding: 8,
      concepts: 12,
      debug: 1,
      tradeoffs: 1,
    }));
    expect(intermediate.body.prepLoop.targetProfile.targets).toEqual(expect.objectContaining({
      coding: 12,
      concepts: 20,
      debug: 1,
      tradeoffs: 3,
    }));
    expect(senior.body.prepLoop.targetProfile.targets).toEqual(expect.objectContaining({
      coding: 18,
      concepts: 28,
      debug: 1,
      tradeoffs: 4,
    }));
    expect(foundationComponents.coding.target).toBe(8);
    expect(intermediateComponents.coding.target).toBe(12);
    expect(seniorComponents.coding.target).toBe(18);
    expect(foundation.body.prepLoop.readiness.cap).toBeUndefined();
    expect(foundation.body.prepLoop.readiness.score).toBeGreaterThan(intermediate.body.prepLoop.readiness.score);
    expect(intermediate.body.prepLoop.readiness.score).toBeGreaterThan(senior.body.prepLoop.readiness.score);
  });

  test('uses senior profile difficulty gates for hard drill expectations', async () => {
    const catalog = loadQuestionCatalog();
    const intermediateCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 15,
      perBucketCap: 3,
      difficulty: 'intermediate',
    });
    const coveredCodingBuckets = new Set(
      intermediateCodingIds.map((id) => getQuestionReadinessBucket(catalog.byId.get(id), 'javascript').id)
    );
    const hardCoverageQuestion = questionsFor(catalog, {
      tech: 'javascript',
      kind: 'coding',
      difficulty: 'hard',
    }).find((question) => !coveredCodingBuckets.has(getQuestionReadinessBucket(question, 'javascript').id))
      || questionsFor(catalog, { tech: 'javascript', kind: 'coding', difficulty: 'hard' })[0];
    const codingIds = [...intermediateCodingIds, hardCoverageQuestion.id];
    const triviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 28,
      perBucketCap: 5,
      difficulty: 'intermediate',
    });
    const user = await User.create({
      email: 'prep-loop-senior-hard-gate@example.com',
      username: 'prep_loop_senior_hard_gate_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'senior' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...codingIds, ...triviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...codingIds, ...triviaIds],
      tech: 'javascript',
    });
    await seedPracticeProgress(user._id, { incidents: 4, tradeoffs: 4 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.targetProfile.difficulty).toEqual({
      advanced: 12,
      hard: 4,
    });
    expect(res.body.prepLoop.readiness.score).toBe(69);
    expect(res.body.prepLoop.readiness.band).toBe('Developing');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 69,
      reason: 'Solve 3 more hard JavaScript drills.',
    }));
  });

  test('returns essential-aware mixed coverage gaps for a no-progress JavaScript user', async () => {
    const user = await User.create({
      email: 'prep-loop-essential-gaps@example.com',
      username: 'prep_loop_essential_gaps_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const gaps = res.body.prepLoop.coverageGaps;
    expect(gaps.length).toBeGreaterThan(3);
    expect(gaps[0]).toEqual(expect.objectContaining({
      source: 'essential-60',
      priorityScore: expect.any(Number),
      solved: 0,
      target: expect.any(Number),
      available: expect.any(Number),
      questions: expect.any(Array),
    }));
    const firstThreeKinds = gaps.slice(0, 3).map((gap) => gap.kind);
    const firstThreeLabels = gaps.slice(0, 3).map((gap) => gap.label);
    expect(firstThreeKinds.filter((kind) => kind === 'coding').length).toBeLessThanOrEqual(2);
    expect(firstThreeKinds.filter((kind) => kind === 'concepts').length).toBeLessThanOrEqual(2);
    expect(firstThreeKinds).toContain('coding');
    expect(firstThreeKinds).toContain('concepts');
    expect(firstThreeLabels).toEqual(expect.arrayContaining([
      'Async & Runtime coding',
      'Async & Runtime concepts',
    ]));

    const asyncCoding = gaps.find((gap) => gap.label === 'Async & Runtime coding');
    expect(asyncCoding).toEqual(expect.objectContaining({
      priorityScore: 93,
      target: 3,
    }));
    expect(asyncCoding.questions[0]).toEqual(expect.objectContaining({
      id: 'js-debounce',
      title: 'Debounce Function',
      access: 'free',
      importanceScore: 93,
      essentialRank: 1,
    }));
    expect(asyncCoding.questions.some((question) => question.access === 'premium')).toBe(true);
  });

  test('returns recent coding feedback and routes the next drill toward unresolved repeated failures', async () => {
    const user = await User.create({
      email: 'prep-loop-feedback@example.com',
      username: 'prep_loop_feedback_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 1, totalCount: 3 },
        { passCount: 1, totalCount: 3 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.feedback).toEqual(expect.objectContaining({
      windowDays: 45,
      summary: expect.stringContaining('issue to review'),
      weakSignals: expect.any(Array),
    }));
    expect(res.body.prepLoop.feedback.weakSignals[0]).toEqual(expect.objectContaining({
      kind: 'coding',
      bucketLabel: 'Async & Runtime',
      category: 'async-promise-mismatch',
      lang: 'js',
      questionId: 'js-debounce',
      route: '/javascript/coding/js-debounce',
      reason: expect.stringContaining('Async Promise Mismatch'),
    }));
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.feedback).toEqual(expect.objectContaining({
      attempts: 2,
      failRuns: 2,
      passRate: 0,
      repeatedFailures: 1,
    }));
    expect(res.body.prepLoop.nextDrill).toEqual(expect.objectContaining({
      title: 'Debounce Function',
      route: '/javascript/coding/js-debounce',
      cta: 'Review coding drill',
      reason: expect.stringContaining('Async Promise Mismatch'),
    }));
    const asyncCoding = res.body.prepLoop.coverageGaps.find((gap) => gap.label === 'Async & Runtime coding');
    const debounce = asyncCoding.questions.find((question) => question.id === 'js-debounce');
    expect(debounce.feedback).toEqual(expect.objectContaining({
      status: 'needs-review',
      attempts: 2,
      passRate: 0,
      category: 'async-promise-mismatch',
      lang: 'js',
    }));
  });

  test('ignores non-JS runner attempts even when they use a JavaScript question id', async () => {
    const user = await User.create({
      email: 'prep-loop-js-question-web-lang@example.com',
      username: 'prep_loop_js_question_web_lang_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      lang: 'web',
      category: 'dom-assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 2 },
        { passCount: 0, totalCount: 2 },
      ],
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      lang: 'react',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 2 },
        { passCount: 0, totalCount: 2 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.feedback).toBeUndefined();
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.feedback).toBeUndefined();
    expect(res.body.prepLoop.readiness.cap?.reason || '').not.toContain('coding failures');
  });

  test('omits direct feedback routes for inaccessible premium JavaScript drills', async () => {
    const catalog = loadQuestionCatalog();
    const premiumQuestion = catalog.all.find((question) => (
      question.id === 'js-promise-all'
      && question.tech === 'javascript'
      && question.kind === 'coding'
    ));
    expect(premiumQuestion).toEqual(expect.objectContaining({
      access: 'premium',
    }));
    const user = await User.create({
      email: 'prep-loop-premium-feedback-link@example.com',
      username: 'prep_loop_premium_feedback_link_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-promise-all',
      lang: 'js',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 0, totalCount: 3 },
        { passCount: 0, totalCount: 3 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const signal = res.body.prepLoop.feedback.weakSignals[0];
    expect(signal).toEqual(expect.objectContaining({
      questionId: 'js-promise-all',
      accessible: false,
      access: 'premium',
    }));
    expect(signal.route).toBeUndefined();
    expect(res.body.prepLoop.nextDrill.route).not.toBe('/javascript/coding/js-promise-all');
    expect(res.body.prepLoop.nextDrill.route).toMatch(/^\/javascript\/coding\//);
  });

  test('ignores React framework check feedback for JavaScript-only readiness', async () => {
    const user = await User.create({
      email: 'prep-loop-react-feedback@example.com',
      username: 'prep_loop_react_feedback_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'react', level: 'foundation' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'react-counter',
      lang: 'react',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 1, errorLine: '.value expected text "1" but found "0"' },
        { passCount: 0, totalCount: 1, errorLine: '.value expected text "1" but found "0"' },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.goal).toEqual(expect.objectContaining({
      tech: 'javascript',
      label: 'JavaScript foundation prep',
    }));
    expect(res.body.prepLoop.feedback).toBeUndefined();
    expect(res.body.prepLoop.nextDrill).toEqual(expect.objectContaining({
      family: 'question',
      route: expect.stringMatching(/^\/javascript\/(coding|trivia)\//),
    }));
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.feedback).toBeUndefined();
  });

  test('ignores resolved Vue framework feedback for JavaScript-only readiness', async () => {
    const user = await User.create({
      email: 'prep-loop-vue-feedback-cleared@example.com',
      username: 'prep_loop_vue_feedback_cleared_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'vue', level: 'foundation' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'vue-counter',
      lang: 'vue',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 1 },
        { passCount: 0, totalCount: 1 },
        { passCount: 1, totalCount: 1, errorCategory: 'unknown' },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.feedback).toBeUndefined();
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.feedback).toBeUndefined();
  });

  test('does not apply readiness caps for severe framework coding failures', async () => {
    const catalog = loadQuestionCatalog();
    const user = await User.create({
      email: 'prep-loop-react-feedback-cap@example.com',
      username: 'prep_loop_react_feedback_cap_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'react', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
    });
    await seedFullJavascriptReadiness(user, catalog);
    const before = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));
    expect(before.status).toBe(200);
    expect(before.body.prepLoop.readiness.score).toBeGreaterThan(69);

    await seedEditorAssistAttempts(user._id, {
      questionId: 'react-counter',
      lang: 'react',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 1 },
        { passCount: 0, totalCount: 1 },
        { passCount: 0, totalCount: 1 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    const beforeComponents = Object.fromEntries(
      before.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.score).toBe(beforeComponents.coding.score);
    expect(components.concepts.score).toBe(beforeComponents.concepts.score);
    expect(res.body.prepLoop.feedback).toBeUndefined();
    expect(res.body.prepLoop.readiness.score).toBe(before.body.prepLoop.readiness.score);
    expect(res.body.prepLoop.readiness.cap).toBe(before.body.prepLoop.readiness.cap);
  });

  test('ignores HTML/CSS web coding feedback for JavaScript-only readiness', async () => {
    const catalog = loadQuestionCatalog();
    const htmlQuestion = questionsFor(catalog, { tech: 'html', kind: 'coding' })
      .find((question) => question.id === 'html-contact-form-labeled');
    expect(htmlQuestion).toBeTruthy();
    const user = await User.create({
      email: 'prep-loop-web-feedback-ignored@example.com',
      username: 'prep_loop_web_feedback_ignored_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'html', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
    });
    await seedFullJavascriptReadiness(user, catalog);
    await seedEditorAssistAttempts(user._id, {
      questionId: htmlQuestion.id,
      lang: 'web',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 2 },
        { passCount: 0, totalCount: 2 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.goal).toEqual(expect.objectContaining({
      tech: 'javascript',
      label: 'JavaScript intermediate prep',
    }));
    expect(res.body.prepLoop.feedback).toBeUndefined();
    expect(res.body.prepLoop.readiness.score).toBe(100);
    expect(res.body.prepLoop.readiness.band).toBe('Strong');
    expect(res.body.prepLoop.readiness.cap).toBeUndefined();
    expect(res.body.prepLoop.readiness.components.some((component) => component.id === 'coding')).toBe(true);
    expect(res.body.prepLoop.coverageGaps.some((gap) =>
      (gap.questions || []).some((question) => question.id === htmlQuestion.id)
    )).toBe(false);
  });

  test('keeps CSS web attempts out of JavaScript-only coverage question feedback', async () => {
    const catalog = loadQuestionCatalog();
    const cssQuestion = questionsFor(catalog, { tech: 'css', kind: 'coding' })
      .find((question) => question.id === 'css-box-model-margin-padding-border');
    expect(cssQuestion).toBeTruthy();
    const user = await User.create({
      email: 'prep-loop-web-feedback-cleared@example.com',
      username: 'prep_loop_web_feedback_cleared_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'css', level: 'foundation' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: cssQuestion.id,
      lang: 'web',
      category: 'assertion-mismatch',
      runs: [
        { passCount: 0, totalCount: 2 },
        { passCount: 0, totalCount: 2 },
        { passCount: 2, totalCount: 2, errorCategory: 'unknown' },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.feedback).toBeUndefined();
    expect(res.body.prepLoop.readiness.components.some((component) => component.id === 'coding')).toBe(true);
    expect(res.body.prepLoop.coverageGaps.every((gap) =>
      (gap.questions || []).every((question) => question.route.startsWith('/javascript/'))
    )).toBe(true);
    expect(res.body.prepLoop.coverageGaps.some((gap) =>
      (gap.questions || []).some((question) => question.id === cssQuestion.id)
    )).toBe(false);
  });

  test('normalizes an old HTML prep target to JavaScript readiness', async () => {
    const user = await User.create({
      email: 'prep-loop-html-concepts-only@example.com',
      username: 'prep_loop_html_concepts_only_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'html', level: 'foundation' } },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(res.body.prepLoop.goal).toEqual({
      tech: 'javascript',
      level: 'foundation',
      label: 'JavaScript foundation prep',
    });
    expect(components.coding).toEqual(expect.objectContaining({
      label: 'JavaScript coding',
      target: 8,
    }));
    expect(components.concepts).toEqual(expect.objectContaining({
      label: 'JavaScript concepts',
      max: 25,
      target: 12,
    }));
    expect(res.body.prepLoop.targetProfile).toEqual(expect.objectContaining({
      label: 'Foundation',
      summary: 'Foundation JavaScript target: 8 coding, 12 concepts, 1 JS debug scenario, 1 JS tradeoff.',
      targets: expect.objectContaining({
        coding: 8,
        concepts: 12,
        debug: 1,
        tradeoffs: 1,
      }),
      breadth: expect.objectContaining({
        coding: 3,
        concepts: 3,
      }),
      difficulty: {},
      conceptOnly: false,
    }));
    expect(res.body.prepLoop.coverageGaps.length).toBeGreaterThan(0);
    expect(res.body.prepLoop.nextDrill).toEqual(expect.objectContaining({
      family: 'question',
      route: expect.stringMatching(/^\/javascript\/(coding|trivia)\//),
    }));
  });

  test('does not count CSS concept completions toward JavaScript readiness', async () => {
    const catalog = loadQuestionCatalog();
    const user = await User.create({
      email: 'prep-loop-css-concepts-complete@example.com',
      username: 'prep_loop_css_concepts_complete_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'css', level: 'foundation' },
        gamification: { weeklyGoalTarget: 10 },
      },
    });
    await seedFullConceptOnlyReadiness(user, catalog, { tech: 'css' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(res.body.prepLoop.goal.tech).toBe('javascript');
    expect(components.coding.current).toBe(0);
    expect(components.concepts.current).toBe(0);
    expect(components.concepts.max).toBe(25);
    expect(components.concepts.target).toBe(12);
    expect(res.body.prepLoop.readiness.score).toBeLessThan(70);
    expect(res.body.prepLoop.readiness.band).not.toBe('Strong');
  });

  test('clears unresolved feedback when a newer passing attempt exists', async () => {
    const user = await User.create({
      email: 'prep-loop-feedback-cleared@example.com',
      username: 'prep_loop_feedback_cleared_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 0, totalCount: 3 },
        { passCount: 1, totalCount: 3 },
        { passCount: 3, totalCount: 3, errorCategory: 'unknown' },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.feedback.weakSignals).toEqual([]);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.feedback).toEqual(expect.objectContaining({
      attempts: 3,
      failRuns: 2,
      repeatedFailures: 0,
    }));
    expect(components.coding.feedback.passRate).toBeCloseTo(0.33);
    const asyncCoding = res.body.prepLoop.coverageGaps.find((gap) => gap.label === 'Async & Runtime coding');
    const debounce = asyncCoding.questions.find((question) => question.id === 'js-debounce');
    expect(debounce.feedback).toEqual(expect.objectContaining({
      status: 'passed-recently',
      attempts: 3,
    }));
  });

  test('recent coding feedback does not change the V1 readiness score', async () => {
    const user = await User.create({
      email: 'prep-loop-feedback-score@example.com',
      username: 'prep_loop_feedback_score_user',
      passwordHash: 'hash',
      prefs: { prepGoal: { tech: 'javascript', level: 'intermediate' } },
    });

    const before = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 0, totalCount: 3 },
        { passCount: 0, totalCount: 3 },
        { passCount: 0, totalCount: 3 },
      ],
    });
    const after = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(before.status).toBe(200);
    expect(after.status).toBe(200);
    expect(after.body.prepLoop.feedback.weakSignals.length).toBeGreaterThan(0);
    expect(after.body.prepLoop.readiness.score).toBe(before.body.prepLoop.readiness.score);
    expect(after.body.prepLoop.readiness.band).toBe(before.body.prepLoop.readiness.band);
  });

  test('caps Strong readiness at 84 for a single unresolved repeated coding failure without changing component scores', async () => {
    const catalog = loadQuestionCatalog();
    const user = await User.create({
      email: 'prep-loop-feedback-strong-cap@example.com',
      username: 'prep_loop_feedback_strong_cap_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
    });
    await seedFullJavascriptReadiness(user, catalog);
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 1, totalCount: 3 },
        { passCount: 1, totalCount: 3 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.score).toBe(30);
    expect(components.concepts.score).toBe(25);
    expect(res.body.prepLoop.readiness.score).toBe(84);
    expect(res.body.prepLoop.readiness.band).toBe('Interview-ready');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 84,
      reason: 'Resolve recent coding failures before this can be Strong.',
    }));
  });

  test('caps Interview-ready readiness at 69 for severe unresolved coding feedback', async () => {
    const catalog = loadQuestionCatalog();
    const user = await User.create({
      email: 'prep-loop-feedback-interview-cap@example.com',
      username: 'prep_loop_feedback_interview_cap_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
    });
    await seedFullJavascriptReadiness(user, catalog);
    await seedEditorAssistAttempts(user._id, {
      questionId: 'js-debounce',
      category: 'async-promise-mismatch',
      runs: [
        { passCount: 0, totalCount: 3 },
        { passCount: 0, totalCount: 3 },
        { passCount: 0, totalCount: 3 },
      ],
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.score).toBe(30);
    expect(res.body.prepLoop.readiness.score).toBe(69);
    expect(res.body.prepLoop.readiness.band).toBe('Developing');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 69,
      reason: 'Clear repeated coding failures before this can be Interview-ready.',
    }));
  });

  test('prioritizes concept coverage gaps when concepts are the weakest prep component', async () => {
    const catalog = loadQuestionCatalog();
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 3,
      perBucketCap: 3,
    });
    const user = await User.create({
      email: 'prep-loop-concepts-gap@example.com',
      username: 'prep_loop_concepts_gap_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: { prepGoal: { tech: 'javascript', level: 'foundation' } },
      solvedQuestionIds: javascriptCodingIds,
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: javascriptCodingIds,
      tech: 'javascript',
      kind: 'coding',
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.goal.label).toBe('JavaScript foundation prep');
    expect(res.body.prepLoop.readiness.components[0].label).toBe('JavaScript coding');
    expect(res.body.prepLoop.weaknesses[0].id).toBe('concepts');
    expect(res.body.prepLoop.coverageGaps[0]).toEqual(expect.objectContaining({
      kind: 'concepts',
    }));
  });

  test('uses diverse solved ids, practice progress, and weekly progress in prep readiness', async () => {
    const catalog = loadQuestionCatalog();
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-progress@example.com',
      username: 'prep_loop_progress_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });

    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      tech: 'javascript',
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body?.prepLoop?.goal).toEqual(expect.objectContaining({
      tech: 'javascript',
      level: 'intermediate',
    }));

    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.score).toBe(30);
    expect(components.coding.effectiveCurrent).toBe(12);
    expect(components.coding.breadth.solved).toBeGreaterThanOrEqual(4);
    expect(components.concepts.score).toBe(25);
    expect(components.concepts.effectiveCurrent).toBe(20);
    expect(components.concepts.breadth.solved).toBeGreaterThanOrEqual(5);
    expect(components.debug.score).toBe(15);
    expect(components.tradeoffs.score).toBe(15);
    expect(components.consistency.score).toBe(15);
    expect(res.body.prepLoop.readiness.score).toBe(100);
    expect(res.body.prepLoop.readiness.band).toBe('Strong');
  });

  test('essential 60 JavaScript completions contribute normally but do not certify Strong readiness alone', async () => {
    const catalog = loadQuestionCatalog();
    const essentialPriority = loadEssentialPriority({ force: true });
    const javascriptEssentialIds = [...new Set(
      [...essentialPriority.byQuestionKey.keys()]
        .filter((key) => key.startsWith('javascript:'))
        .map((key) => key.split(':')[2]),
    )];

    const user = await User.create({
      email: 'prep-loop-essential-complete@example.com',
      username: 'prep_loop_essential_complete_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: javascriptEssentialIds,
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: javascriptEssentialIds,
      tech: 'javascript',
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.effectiveCurrent).toBeGreaterThan(0);
    expect(components.concepts.effectiveCurrent).toBeGreaterThan(0);
    expect(res.body.prepLoop.readiness.score).toBeLessThan(100);
    expect(res.body.prepLoop.readiness.band).not.toBe('Strong');
  });

  test('caps prep readiness when solved questions are concentrated in one topic bucket', async () => {
    const catalog = loadQuestionCatalog();
    const concentratedCodingIds = selectConcentratedQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      bucketLabel: 'Async & Runtime',
    });
    const concentratedConceptIds = selectConcentratedQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      bucketLabel: 'Async & Runtime',
    });

    const user = await User.create({
      email: 'prep-loop-concentrated@example.com',
      username: 'prep_loop_concentrated_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...concentratedCodingIds, ...concentratedConceptIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...concentratedCodingIds, ...concentratedConceptIds],
      tech: 'javascript',
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.readiness.band).not.toBe('Interview-ready');
    expect(res.body.prepLoop.readiness.score).toBeLessThanOrEqual(69);
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 69,
      reason: expect.stringContaining('Broaden'),
    }));
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.current).toBeGreaterThan(components.coding.effectiveCurrent);
    expect(components.concepts.current).toBeGreaterThan(components.concepts.effectiveCurrent);
    expect(res.body.prepLoop.coverageGaps.length).toBeGreaterThan(0);
    expect(res.body.prepLoop.coverageGaps.map((gap) => gap.label).join(' ')).not.toContain('Async & Runtime');
  });

  test('caps intermediate prep readiness until intermediate or hard drills are solved', async () => {
    const catalog = loadQuestionCatalog();
    const easyCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: 'easy',
    });
    const easyTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: 'easy',
    });

    const user = await User.create({
      email: 'prep-loop-easy-only@example.com',
      username: 'prep_loop_easy_only_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...easyCodingIds, ...easyTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...easyCodingIds, ...easyTriviaIds],
      tech: 'javascript',
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.readiness.score).toBeLessThanOrEqual(69);
    expect(res.body.prepLoop.readiness.band).toBe('Developing');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 69,
      reason: expect.stringContaining('intermediate or hard'),
    }));
  });

  test('does not award Strong prep readiness without debug signal', async () => {
    const catalog = loadQuestionCatalog();
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-no-debug@example.com',
      username: 'prep_loop_no_debug_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      tech: 'javascript',
    });
    await seedPracticeProgress(user._id, { incidents: 0, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.readiness.score).toBe(84);
    expect(res.body.prepLoop.readiness.band).toBe('Interview-ready');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 84,
      reason: expect.stringContaining('debug practice'),
    }));
  });

  test('gives aging prep evidence 75 percent credit but keeps readiness capped without fresh core proof', async () => {
    const catalog = loadQuestionCatalog();
    const agingDate = daysAgo(250);
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-aging@example.com',
      username: 'prep_loop_aging_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      completedAt: agingDate,
      lastAttemptAt: agingDate,
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3, lastPlayedAt: agingDate });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.effectiveCurrent).toBeCloseTo(9);
    expect(components.concepts.effectiveCurrent).toBeCloseTo(15);
    expect(components.coding.freshness).toEqual(expect.objectContaining({
      fresh: 0,
      aging: 12,
      stale: 0,
    }));
    expect(res.body.prepLoop.readiness.score).toBe(69);
    expect(res.body.prepLoop.readiness.band).toBe('Developing');
    expect(res.body.prepLoop.readiness.cap).toEqual(expect.objectContaining({
      maxScore: 69,
      reason: expect.stringContaining('Refresh recent coding and concepts'),
    }));
  });

  test('gives old prep evidence partial credit without keeping interview-ready', async () => {
    const catalog = loadQuestionCatalog();
    const oldDate = daysAgo(400);
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-stale@example.com',
      username: 'prep_loop_stale_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      completedAt: oldDate,
      lastAttemptAt: oldDate,
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3, lastPlayedAt: oldDate });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.prepLoop.readiness.band).toBe('Developing');
    expect(res.body.prepLoop.readiness.score).toBeLessThan(70);
    expect(res.body.prepLoop.readiness.score).toBeGreaterThan(40);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.current).toBe(12);
    expect(components.coding.effectiveCurrent).toBeCloseTo(4.8);
    expect(components.coding.freshness).toEqual(expect.objectContaining({
      fresh: 0,
      aging: 0,
      stale: 12,
    }));
    expect(res.body.prepLoop.nextDrill.reason).toContain('Refresh');
  });

  test('drops two-year-old prep evidence to zero counted credit', async () => {
    const catalog = loadQuestionCatalog();
    const oldDate = daysAgo(800);
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-two-year-stale@example.com',
      username: 'prep_loop_two_year_stale_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      completedAt: oldDate,
      lastAttemptAt: oldDate,
    });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.current).toBe(12);
    expect(components.coding.effectiveCurrent).toBe(0);
    expect(components.concepts.current).toBe(20);
    expect(components.concepts.effectiveCurrent).toBe(0);
    expect(res.body.prepLoop.readiness.score).toBeLessThan(70);
    expect(res.body.prepLoop.readiness.band).not.toBe('Interview-ready');
  });

  test('does not refresh debug or tradeoff readiness when only lastPlayedAt changes', async () => {
    const staleDate = daysAgo(800);
    const freshDate = new Date();
    const incidentId = jsPracticeId('incident');
    const tradeoffId = jsPracticeId('tradeoff-battle');
    const user = await User.create({
      email: 'prep-loop-practice-replay@example.com',
      username: 'prep_loop_practice_replay_user',
      passwordHash: 'hash',
      accessTier: 'premium',
    });
    await PracticeProgress.create([
      {
        userId: user._id,
        family: 'incident',
        itemId: incidentId,
        started: true,
        completed: true,
        passed: true,
        bestScore: 80,
        lastPlayedAt: staleDate,
        completedAt: staleDate,
        passedAt: staleDate,
      },
      {
        userId: user._id,
        family: 'tradeoff-battle',
        itemId: tradeoffId,
        started: true,
        completed: true,
        passed: false,
        bestScore: 0,
        lastPlayedAt: staleDate,
        completedAt: staleDate,
      },
    ]);

    const incidentReplay = await request(app)
      .put(`/api/practice-progress/incident/${incidentId}`)
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: true,
        passed: true,
        bestScore: 80,
        lastPlayedAt: freshDate.toISOString(),
      });
    const tradeoffReplay = await request(app)
      .put(`/api/practice-progress/tradeoff-battle/${tradeoffId}`)
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: true,
        passed: false,
        bestScore: 0,
        lastPlayedAt: freshDate.toISOString(),
      });

    expect(incidentReplay.status).toBe(200);
    expect(tradeoffReplay.status).toBe(200);
    const [incident, tradeoff] = await Promise.all([
      PracticeProgress.findOne({ userId: user._id, family: 'incident', itemId: incidentId }).lean(),
      PracticeProgress.findOne({ userId: user._id, family: 'tradeoff-battle', itemId: tradeoffId }).lean(),
    ]);
    expect(new Date(incident.lastPlayedAt).toISOString()).toBe(freshDate.toISOString());
    expect(new Date(incident.passedAt).toISOString()).toBe(staleDate.toISOString());
    expect(new Date(tradeoff.lastPlayedAt).toISOString()).toBe(freshDate.toISOString());
    expect(new Date(tradeoff.completedAt).toISOString()).toBe(staleDate.toISOString());

    const dashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    const components = Object.fromEntries(
      dashboard.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.debug.current).toBe(1);
    expect(components.debug.effectiveCurrent).toBe(0);
    expect(components.tradeoffs.current).toBe(1);
    expect(components.tradeoffs.effectiveCurrent).toBe(0);
  });

  test('refreshes debug and tradeoff readiness on new pass or completion evidence', async () => {
    const staleDate = daysAgo(800);
    const freshDate = new Date();
    const incidentId = jsPracticeId('incident');
    const tradeoffId = jsPracticeId('tradeoff-battle');
    const user = await User.create({
      email: 'prep-loop-practice-refresh@example.com',
      username: 'prep_loop_practice_refresh_user',
      passwordHash: 'hash',
      accessTier: 'premium',
    });
    await PracticeProgress.create([
      {
        userId: user._id,
        family: 'incident',
        itemId: incidentId,
        started: true,
        completed: false,
        passed: false,
        bestScore: 40,
        lastPlayedAt: staleDate,
      },
      {
        userId: user._id,
        family: 'tradeoff-battle',
        itemId: tradeoffId,
        started: true,
        completed: false,
        passed: false,
        bestScore: 0,
        lastPlayedAt: staleDate,
      },
    ]);

    const incidentRefresh = await request(app)
      .put(`/api/practice-progress/incident/${incidentId}`)
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: true,
        passed: true,
        bestScore: 85,
        lastPlayedAt: freshDate.toISOString(),
      });
    const tradeoffRefresh = await request(app)
      .put(`/api/practice-progress/tradeoff-battle/${tradeoffId}`)
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: true,
        passed: false,
        bestScore: 0,
        lastPlayedAt: freshDate.toISOString(),
      });

    expect(incidentRefresh.status).toBe(200);
    expect(tradeoffRefresh.status).toBe(200);
    const [incident, tradeoff] = await Promise.all([
      PracticeProgress.findOne({ userId: user._id, family: 'incident', itemId: incidentId }).lean(),
      PracticeProgress.findOne({ userId: user._id, family: 'tradeoff-battle', itemId: tradeoffId }).lean(),
    ]);
    expect(new Date(incident.passedAt).toISOString()).toBe(freshDate.toISOString());
    expect(new Date(incident.completedAt).toISOString()).toBe(freshDate.toISOString());
    expect(new Date(tradeoff.completedAt).toISOString()).toBe(freshDate.toISOString());

    const dashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    const components = Object.fromEntries(
      dashboard.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.debug.current).toBe(1);
    expect(components.debug.effectiveCurrent).toBe(1);
    expect(components.tradeoffs.current).toBe(1);
    expect(components.tradeoffs.effectiveCurrent).toBe(1);
  });

  test('uses lastAttemptAt to refresh old question completions for prep readiness', async () => {
    const catalog = loadQuestionCatalog();
    const oldDate = daysAgo(400);
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-refreshed@example.com',
      username: 'prep_loop_refreshed_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedQuestionCompletions(user._id, catalog, {
      ids: [...javascriptCodingIds, ...javascriptTriviaIds],
      completedAt: oldDate,
      lastAttemptAt: new Date(),
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.effectiveCurrent).toBe(12);
    expect(components.concepts.effectiveCurrent).toBe(20);
    expect(components.coding.freshness.fresh).toBe(12);
    expect(res.body.prepLoop.readiness.score).toBe(100);
    expect(res.body.prepLoop.readiness.band).toBe('Strong');
  });

  test('legacy solved ids without completion dates do not create fake full readiness', async () => {
    const catalog = loadQuestionCatalog();
    const javascriptCodingIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'coding',
      target: 12,
      perBucketCap: 3,
      difficulty: ['intermediate', 'hard'],
    });
    const javascriptTriviaIds = selectDiverseQuestionIds(catalog, {
      tech: 'javascript',
      kind: 'trivia',
      target: 20,
      perBucketCap: 5,
      difficulty: ['intermediate', 'hard'],
    });

    const user = await User.create({
      email: 'prep-loop-legacy-only@example.com',
      username: 'prep_loop_legacy_only_user',
      passwordHash: 'hash',
      accessTier: 'premium',
      prefs: {
        prepGoal: { tech: 'javascript', level: 'intermediate' },
        gamification: { weeklyGoalTarget: 10 },
      },
      solvedQuestionIds: [...javascriptCodingIds, ...javascriptTriviaIds],
    });
    await seedPracticeProgress(user._id, { incidents: 3, tradeoffs: 3 });
    await seedWeeklyCompletions(user._id, { count: 10, tech: 'javascript' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(res.status).toBe(200);
    const components = Object.fromEntries(
      res.body.prepLoop.readiness.components.map((component) => [component.id, component])
    );
    expect(components.coding.current).toBe(12);
    expect(components.coding.effectiveCurrent).toBe(0);
    expect(components.concepts.current).toBe(20);
    expect(components.concepts.effectiveCurrent).toBe(0);
    expect(res.body.prepLoop.readiness.score).toBeLessThan(70);
    expect(res.body.prepLoop.readiness.band).not.toBe('Interview-ready');
  });

  test('dashboard prep loop read is not creating progress or activity rows', async () => {
    const user = await User.create({
      email: 'prep-loop-readonly@example.com',
      username: 'prep_loop_readonly_user',
      passwordHash: 'hash',
    });

    const before = {
      progress: await PracticeProgress.countDocuments({ userId: user._id }),
      completions: await ActivityCompletion.countDocuments({ userId: user._id }),
      events: await ActivityEvent.countDocuments({ userId: user._id }),
      attempts: await EditorAssistAttempt.countDocuments({ userId: user._id }),
    };

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    const after = {
      progress: await PracticeProgress.countDocuments({ userId: user._id }),
      completions: await ActivityCompletion.countDocuments({ userId: user._id }),
      events: await ActivityEvent.countDocuments({ userId: user._id }),
      attempts: await EditorAssistAttempt.countDocuments({ userId: user._id }),
    };

    expect(res.status).toBe(200);
    expect(after).toEqual(before);
  });

  test('saves prep goal and returns it on the next dashboard payload', async () => {
    const user = await User.create({
      email: 'prep-goal-save@example.com',
      username: 'prep_goal_save_user',
      passwordHash: 'hash',
    });

    const saved = await request(app)
      .post('/api/dashboard/prep-goal')
      .set('Authorization', authHeader(user._id))
      .send({ tech: 'vue', level: 'foundation' });

    expect(saved.status).toBe(200);
    expect(saved.body?.goal).toEqual({
      tech: 'javascript',
      level: 'foundation',
      label: 'JavaScript foundation prep',
    });

    const dashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(dashboard.status).toBe(200);
    expect(dashboard.body?.prepLoop?.goal).toEqual(saved.body.goal);
    expect(dashboard.body?.prepLoop?.targetProfile).toEqual(expect.objectContaining({
      label: 'Foundation',
      summary: 'Foundation JavaScript target: 8 coding, 12 concepts, 1 JS debug scenario, 1 JS tradeoff.',
      targets: expect.objectContaining({
        coding: 8,
        concepts: 12,
        debug: 1,
        tradeoffs: 1,
      }),
    }));
  });

  test('rejects invalid prep goal inputs', async () => {
    const user = await User.create({
      email: 'prep-goal-invalid@example.com',
      username: 'prep_goal_invalid_user',
      passwordHash: 'hash',
    });

    const badTech = await request(app)
      .post('/api/dashboard/prep-goal')
      .set('Authorization', authHeader(user._id))
      .send({ tech: 'svelte', level: 'intermediate' });
    expect(badTech.status).toBe(400);
    expect(badTech.body?.error).toBe('Invalid prep goal tech');

    const badLevel = await request(app)
      .post('/api/dashboard/prep-goal')
      .set('Authorization', authHeader(user._id))
      .send({ tech: 'react', level: 'principal' });
    expect(badLevel.status).toBe(400);
    expect(badLevel.body?.error).toBe('Invalid prep goal level');
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
