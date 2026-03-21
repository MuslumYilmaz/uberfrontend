'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let ActivityEvent;
let ActivityCompletion;
let ActivityCompletionRequest;
let FirstCompletionCredit;
let WeeklyGoalBonusCredit;
let WeeklyGoalState;
let XpCredit;
let DailyChallengeCompletion;
let getOrCreateDailyChallenge;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_activity_complete';
const RealDate = Date;

function authHeader(userId, role = 'user') {
    const token = jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' });
    return `Bearer ${token}`;
}

function mockSystemTime(isoString) {
    const fixed = new RealDate(isoString);
    global.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) return new RealDate(fixed);
            return new RealDate(...args);
        }
        static now() { return fixed.getTime(); }
        static parse(value) { return RealDate.parse(value); }
        static UTC(...args) { return RealDate.UTC(...args); }
    };
}

function resetSystemTime() {
    global.Date = RealDate;
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL_TEST = mongoServer.getUri();
    process.env.JWT_SECRET = JWT_SECRET;

    jest.resetModules();
    app = require('../index');
    ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
    User = require('../models/User');
    ActivityEvent = require('../models/ActivityEvent');
    ActivityCompletion = require('../models/ActivityCompletion');
    ActivityCompletionRequest = require('../models/ActivityCompletionRequest');
    FirstCompletionCredit = require('../models/FirstCompletionCredit');
    WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
    WeeklyGoalState = require('../models/WeeklyGoalState');
    XpCredit = require('../models/XpCredit');
    DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
    ({ getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge'));

    await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
    if (disconnectMongo) await disconnectMongo();
    if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await ActivityEvent.deleteMany({});
    await ActivityCompletion.deleteMany({});
    await ActivityCompletionRequest.deleteMany({});
    await FirstCompletionCredit.deleteMany({});
    await WeeklyGoalBonusCredit.deleteMany({});
    await WeeklyGoalState.deleteMany({});
    await XpCredit.deleteMany({});
    await DailyChallengeCompletion.deleteMany({});
});

afterEach(() => {
    resetSystemTime();
});

describe('POST /api/activity/complete', () => {
    test('awards XP only once for concurrent first completions of same item', async () => {
        const user = await User.create({
            email: 'activity@example.com',
            username: 'activity_user',
            passwordHash: 'hash',
        });

        const body = {
            kind: 'coding',
            tech: 'javascript',
            itemId: 'same-item-id',
            difficulty: 'intermediate',
        };

        const [first, second] = await Promise.all([
            request(app)
                .post('/api/activity/complete')
                .set('Authorization', authHeader(user._id))
                .send(body),
            request(app)
                .post('/api/activity/complete')
                .set('Authorization', authHeader(user._id))
                .send(body),
        ]);

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);

        const awards = [Number(first.body?.xpAwarded || 0), Number(second.body?.xpAwarded || 0)].sort((a, b) => a - b);
        expect(awards).toEqual([0, 20]);

        const reloaded = await User.findById(user._id).lean();
        expect(reloaded?.stats?.xpTotal).toBe(20);
        expect(reloaded?.stats?.completedTotal).toBe(1);
        expect(reloaded?.solvedQuestionIds || []).toContain('same-item-id');

        const [eventCount, logicalCompletionCount, firstCompletionCount] = await Promise.all([
            ActivityEvent.countDocuments({ userId: user._id, kind: 'coding', itemId: 'same-item-id' }),
            ActivityCompletion.countDocuments({ userId: user._id, kind: 'coding', itemId: 'same-item-id' }),
            FirstCompletionCredit.countDocuments({ userId: user._id, kind: 'coding', itemId: 'same-item-id' }),
        ]);
        expect(eventCount).toBe(1);
        expect(logicalCompletionCount).toBe(1);
        expect(firstCompletionCount).toBe(1);
    });

    test('replays a known requestId without re-counting the same logical completion', async () => {
        const user = await User.create({
            email: 'replay@example.com',
            username: 'replay_user',
            passwordHash: 'hash',
        });

        const requestId = 'req-activity-replay-1';
        const body = {
            kind: 'trivia',
            tech: 'javascript',
            itemId: 'closure-basics',
            difficulty: 'easy',
            requestId,
        };

        const first = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send(body);

        expect(first.status).toBe(200);
        expect(first.body?.xpAwarded).toBe(5);
        expect(first.body?.logicalCompletionCreated).toBe(true);

        const replay = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send(body);

        expect(replay.status).toBe(200);
        expect(replay.body).toEqual(first.body);

        const [reloaded, eventCount, logicalCompletionCount, receiptCount] = await Promise.all([
            User.findById(user._id).lean(),
            ActivityEvent.countDocuments({ userId: user._id, kind: 'trivia', itemId: 'closure-basics' }),
            ActivityCompletion.countDocuments({ userId: user._id, kind: 'trivia', itemId: 'closure-basics' }),
            ActivityCompletionRequest.countDocuments({ userId: user._id, requestId }),
        ]);

        expect(reloaded?.stats?.xpTotal).toBe(5);
        expect(reloaded?.stats?.completedTotal).toBe(1);
        expect(reloaded?.solvedQuestionIds || []).toContain('closure-basics');
        expect(eventCount).toBe(1);
        expect(logicalCompletionCount).toBe(1);
        expect(receiptCount).toBe(1);
    });

    test('persists per-tech aggregates for non-legacy tech keys', async () => {
        const user = await User.create({
            email: 'per-tech@example.com',
            username: 'per_tech_user',
            passwordHash: 'hash',
        });

        const res = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'react',
                itemId: 'react-item-1',
                difficulty: 'easy',
            });

        expect(res.status).toBe(200);
        expect(Number(res.body?.xpAwarded || 0)).toBe(10);

        const reloaded = await User.findById(user._id).lean();
        expect(reloaded?.stats?.perTech?.react).toEqual(
            expect.objectContaining({ xp: 10, completed: 1 })
        );
    });

    test('incident completion awards xp and weekly credit without mutating solvedQuestionIds', async () => {
        const user = await User.create({
            email: 'incident-complete@example.com',
            username: 'incident_complete_user',
            passwordHash: 'hash',
            solvedQuestionIds: ['react-counter'],
        });

        const res = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'incident',
                tech: 'react',
                itemId: 'search-typing-lag',
                difficulty: 'easy',
            });

        expect(res.status).toBe(200);
        expect(Number(res.body?.xpAwarded || 0)).toBe(10);
        expect(res.body?.logicalCompletionCreated).toBe(true);
        expect(res.body?.solvedQuestionIds).toEqual(['react-counter']);

        const [reloaded, dashboardRes, summaryRes] = await Promise.all([
            User.findById(user._id).lean(),
            request(app)
                .get('/api/dashboard')
                .set('Authorization', authHeader(user._id)),
            request(app)
                .get('/api/activity/summary')
                .set('Authorization', authHeader(user._id)),
        ]);

        expect(reloaded?.solvedQuestionIds).toEqual(['react-counter']);
        expect(reloaded?.stats?.xpTotal).toBe(10);
        expect(reloaded?.stats?.completedTotal).toBe(1);
        expect(dashboardRes.status).toBe(200);
        expect(dashboardRes.body?.weeklyGoal?.completed).toBe(1);
        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body?.today?.completed).toBe(1);
        expect(summaryRes.body?.today?.total).toBe(4);
    });

    test('completion level-up is reflected end-to-end in dashboard xp level', async () => {
        const user = await User.create({
            email: 'levelup@example.com',
            username: 'levelup_user',
            passwordHash: 'hash',
            stats: { xpTotal: 190, completedTotal: 0 },
        });

        const completeRes = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'level-up-item',
                difficulty: 'easy',
            });

        expect(completeRes.status).toBe(200);
        expect(Number(completeRes.body?.xpAwarded || 0)).toBe(10);
        expect(completeRes.body?.levelUp).toBe(true);
        expect(completeRes.body?.stats?.xpTotal).toBe(200);

        const dashboardRes = await request(app)
            .get('/api/dashboard')
            .set('Authorization', authHeader(user._id));

        expect(dashboardRes.status).toBe(200);
        expect(dashboardRes.body?.xpLevel).toEqual(
            expect.objectContaining({
                totalXp: 200,
                level: 2,
                nextLevelXp: 400,
                currentLevelXp: 0,
                levelStepXp: 200,
                progress: 0,
            })
        );
    });

    test('completion near app-local midnight credits today progress and streak using app timezone day key', async () => {
        mockSystemTime('2026-02-08T21:30:00.000Z'); // 2026-02-09 00:30 in Europe/Istanbul

        try {
            const user = await User.create({
                email: 'timezone-boundary@example.com',
                username: 'timezone_boundary_user',
                passwordHash: 'hash',
            });

            const completeRes = await request(app)
                .post('/api/activity/complete')
                .set('Authorization', authHeader(user._id))
                .send({
                    kind: 'coding',
                    tech: 'javascript',
                    itemId: 'timezone-boundary-item',
                    difficulty: 'easy',
                });

            expect(completeRes.status).toBe(200);

            const summaryRes = await request(app)
                .get('/api/activity/summary')
                .set('Authorization', authHeader(user._id));

            expect(summaryRes.status).toBe(200);
            expect(summaryRes.body?.today?.completed).toBe(1);
            expect(summaryRes.body?.streak?.current).toBe(1);

            const reloaded = await User.findById(user._id).lean();
            expect(reloaded?.stats?.streak?.lastActiveUTCDate).toBe('2026-02-09');
        } finally {
            resetSystemTime();
        }
    });

    test('reactivation preserves the original difficulty snapshot and xp award', async () => {
        const user = await User.create({
            email: 'difficulty-snapshot@example.com',
            username: 'difficulty_snapshot_user',
            passwordHash: 'hash',
        });

        const now = new Date();
        await ActivityCompletion.create({
            userId: user._id,
            kind: 'coding',
            tech: 'javascript',
            itemId: 'snapshot-item',
            source: 'tech',
            durationMin: 5,
            difficultySnapshot: 'easy',
            xpAwarded: 10,
            completedAt: now,
            dayUTC: now.toISOString().slice(0, 10),
            active: false,
            lastAttemptAt: now,
        });

        const res = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'snapshot-item',
                difficulty: 'hard',
            });

        expect(res.status).toBe(200);
        expect(res.body?.logicalCompletionCreated).toBe(true);
        expect(Number(res.body?.xpAwarded || 0)).toBe(10);

        const completion = await ActivityCompletion.findOne({
            userId: user._id,
            kind: 'coding',
            itemId: 'snapshot-item',
        }).lean();

        expect(completion?.active).toBe(true);
        expect(completion?.difficultySnapshot).toBe('easy');
        expect(Number(completion?.xpAwarded || 0)).toBe(10);
    });

    test('uncomplete rolls back xp, solved state, and allows a later re-completion', async () => {
        const user = await User.create({
            email: 'rollback@example.com',
            username: 'rollback_user',
            passwordHash: 'hash',
            stats: { xpTotal: 190, completedTotal: 0 },
        });

        const completeRes = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'rollback-item',
                difficulty: 'easy',
            });

        expect(completeRes.status).toBe(200);
        expect(completeRes.body?.levelUp).toBe(true);
        expect(completeRes.body?.stats?.xpTotal).toBe(200);

        const rollbackRes = await request(app)
            .post('/api/activity/uncomplete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'rollback-item',
            });

        expect(rollbackRes.status).toBe(200);
        expect(rollbackRes.body?.rollbackApplied).toBe(true);
        expect(rollbackRes.body?.xpRemoved).toBe(10);
        expect(rollbackRes.body?.levelDown).toBe(true);
        expect(rollbackRes.body?.stats?.xpTotal).toBe(190);
        expect(rollbackRes.body?.stats?.completedTotal).toBe(0);
        expect(rollbackRes.body?.solvedQuestionIds || []).not.toContain('rollback-item');

        const summaryAfterRollback = await request(app)
            .get('/api/activity/summary')
            .set('Authorization', authHeader(user._id));

        expect(summaryAfterRollback.status).toBe(200);
        expect(summaryAfterRollback.body?.today?.completed).toBe(0);

        const reCompleteRes = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'rollback-item',
                difficulty: 'easy',
            });

        expect(reCompleteRes.status).toBe(200);
        expect(reCompleteRes.body?.logicalCompletionCreated).toBe(true);
        expect(reCompleteRes.body?.xpAwarded).toBe(10);
        expect(reCompleteRes.body?.levelUp).toBe(true);

        const reloaded = await User.findById(user._id).lean();
        expect(reloaded?.stats?.xpTotal).toBe(200);
        expect(reloaded?.stats?.completedTotal).toBe(1);
        expect(reloaded?.solvedQuestionIds || []).toContain('rollback-item');

        const completion = await ActivityCompletion.findOne({ userId: user._id, kind: 'coding', itemId: 'rollback-item' }).lean();
        expect(completion?.active).toBe(true);
    });

    test('uncomplete revokes weekly goal bonus when rollback drops below target', async () => {
        const user = await User.create({
            email: 'weekly-revoke@example.com',
            username: 'weekly_revoke_user',
            passwordHash: 'hash',
            prefs: {
                gamification: {
                    weeklyGoalEnabled: true,
                    weeklyGoalTarget: 3,
                },
            },
        });

        const now = new Date();
        await ActivityCompletion.create([
            {
                userId: user._id,
                kind: 'coding',
                tech: 'javascript',
                itemId: 'weekly-seed-1',
                source: 'tech',
                durationMin: 3,
                difficultySnapshot: 'easy',
                xpAwarded: 10,
                completedAt: now,
                dayUTC: now.toISOString().slice(0, 10),
                active: true,
                lastAttemptAt: now,
            },
            {
                userId: user._id,
                kind: 'coding',
                tech: 'javascript',
                itemId: 'weekly-seed-2',
                source: 'tech',
                durationMin: 3,
                difficultySnapshot: 'easy',
                xpAwarded: 10,
                completedAt: now,
                dayUTC: now.toISOString().slice(0, 10),
                active: true,
                lastAttemptAt: now,
            },
        ]);

        const completeRes = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'weekly-bonus-item',
                difficulty: 'easy',
            });

        expect(completeRes.status).toBe(200);
        expect(completeRes.body?.weeklyGoal?.reached).toBe(true);
        expect(completeRes.body?.weeklyGoal?.bonusGranted).toBe(true);
        expect(Number(completeRes.body?.xpAwarded || 0)).toBeGreaterThan(10);

        const rollbackRes = await request(app)
            .post('/api/activity/uncomplete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: 'coding',
                tech: 'javascript',
                itemId: 'weekly-bonus-item',
            });

        expect(rollbackRes.status).toBe(200);
        expect(rollbackRes.body?.weeklyGoal?.completed).toBe(2);
        expect(rollbackRes.body?.weeklyGoal?.reached).toBe(false);
        expect(rollbackRes.body?.weeklyGoal?.bonusRevoked).toBe(true);
        expect(Number(rollbackRes.body?.xpRemoved || 0)).toBeGreaterThan(10);

        const [reloaded, bonusCount] = await Promise.all([
            User.findById(user._id).lean(),
            WeeklyGoalBonusCredit.countDocuments({ userId: user._id }),
        ]);
        expect(reloaded?.stats?.xpTotal).toBe(0);
        expect(bonusCount).toBe(0);
    });

    test('uncomplete revokes current daily challenge completion for the same question', async () => {
        const user = await User.create({
            email: 'daily-revoke@example.com',
            username: 'daily_revoke_user',
            passwordHash: 'hash',
        });

        const challenge = await getOrCreateDailyChallenge({ user });
        expect(challenge?.questionId).toBeTruthy();

        const completeRes = await request(app)
            .post('/api/activity/complete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: challenge.kind,
                tech: challenge.tech,
                itemId: challenge.questionId,
                difficulty: challenge.difficulty,
            });

        expect(completeRes.status).toBe(200);

        await DailyChallengeCompletion.create({
            userId: user._id,
            dayKey: challenge.dayKey,
            questionId: challenge.questionId,
        });

        const rollbackRes = await request(app)
            .post('/api/activity/uncomplete')
            .set('Authorization', authHeader(user._id))
            .send({
                kind: challenge.kind,
                tech: challenge.tech,
                itemId: challenge.questionId,
            });

        expect(rollbackRes.status).toBe(200);
        expect(rollbackRes.body?.dailyChallenge?.revoked).toBe(true);

        const completionCount = await DailyChallengeCompletion.countDocuments({
            userId: user._id,
            dayKey: challenge.dayKey,
        });
        expect(completionCount).toBe(0);
    });

    test('activity summary weekly metrics align with dashboard and user goal target', async () => {
        const user = await User.create({
            email: 'weekly-summary@example.com',
            username: 'weekly_summary_user',
            passwordHash: 'hash',
            stats: { xpTotal: 450 },
            prefs: {
                gamification: {
                    weeklyGoalEnabled: true,
                    weeklyGoalTarget: 7,
                },
            },
        });

        const now = new Date();
        await ActivityEvent.create([
            { userId: user._id, kind: 'coding', tech: 'javascript', itemId: 'weekly-1', completedAt: now },
            { userId: user._id, kind: 'coding', tech: 'javascript', itemId: 'weekly-1', completedAt: now },
            { userId: user._id, kind: 'debug', tech: 'react', itemId: 'weekly-2', completedAt: now },
        ]);

        const prevWeeklyEnv = process.env.WEEKLY_TARGET;
        process.env.WEEKLY_TARGET = '99';

        try {
            const [summary, dashboard] = await Promise.all([
                request(app)
                    .get('/api/activity/summary')
                    .set('Authorization', authHeader(user._id)),
                request(app)
                    .get('/api/dashboard')
                    .set('Authorization', authHeader(user._id)),
            ]);

            expect(summary.status).toBe(200);
            expect(dashboard.status).toBe(200);
            expect(summary.body?.weekly?.target).toBe(7);
            expect(summary.body?.weekly?.completed).toBe(dashboard.body?.weeklyGoal?.completed);
            expect(summary.body?.weekly?.progress).toBeCloseTo(
                Number(dashboard.body?.weeklyGoal?.progress || 0),
                6
            );
            expect(summary.body?.level).toBe(dashboard.body?.xpLevel?.level);
            expect(summary.body?.nextLevelXp).toBe(dashboard.body?.xpLevel?.nextLevelXp);
            expect(summary.body?.levelProgress?.current).toBe(dashboard.body?.xpLevel?.currentLevelXp);
            expect(summary.body?.levelProgress?.needed).toBe(dashboard.body?.xpLevel?.levelStepXp);
            expect(summary.body?.levelProgress?.pct).toBeCloseTo(
                Number(dashboard.body?.xpLevel?.progress || 0),
                6
            );
        } finally {
            if (prevWeeklyEnv === undefined) delete process.env.WEEKLY_TARGET;
            else process.env.WEEKLY_TARGET = prevWeeklyEnv;
        }
    });

    test('profile route enforces schema validators on update', async () => {
        const user = await User.create({
            email: 'profile-validator@example.com',
            username: 'profile_validator_user',
            passwordHash: 'hash',
        });

        const res = await request(app)
            .put(`/api/users/${user._id}`)
            .set('Authorization', authHeader(user._id))
            .send({ prefs: { defaultTech: 'react' } });

        expect(res.status).toBeGreaterThanOrEqual(400);

        const reloaded = await User.findById(user._id).lean();
        expect(reloaded?.prefs?.defaultTech).toBe('javascript');
    });

    test('admin route enforces schema validators on update', async () => {
        const user = await User.create({
            email: 'admin-validator@example.com',
            username: 'admin_validator_user',
            passwordHash: 'hash',
        });

        const res = await request(app)
            .put(`/api/admin/users/${user._id}`)
            .set('Authorization', authHeader(user._id, 'admin'))
            .send({ role: 'superadmin' });

        expect(res.status).toBeGreaterThanOrEqual(400);

        const reloaded = await User.findById(user._id).lean();
        expect(reloaded?.role).toBe('user');
    });

    test('recent endpoint caps all=1 and limit=0 requests to a bounded max', async () => {
        const user = await User.create({
            email: 'recent-cap@example.com',
            username: 'recent_cap_user',
            passwordHash: 'hash',
        });

        const now = Date.now();
        const docs = Array.from({ length: 260 }, (_, i) => {
            const completedAt = new Date(now - i * 60 * 1000);
            return {
                userId: user._id,
                kind: 'coding',
                tech: 'javascript',
                itemId: `recent-${i}`,
                source: 'tech',
                durationMin: 1,
                xp: 1,
                completedAt,
                dayUTC: completedAt.toISOString().slice(0, 10),
            };
        });
        await ActivityEvent.insertMany(docs);

        const [allRes, zeroLimitRes] = await Promise.all([
            request(app)
                .get('/api/activity/recent?all=1')
                .set('Authorization', authHeader(user._id)),
            request(app)
                .get('/api/activity/recent?limit=0')
                .set('Authorization', authHeader(user._id)),
        ]);

        expect(allRes.status).toBe(200);
        expect(zeroLimitRes.status).toBe(200);
        expect(allRes.body).toHaveLength(200);
        expect(zeroLimitRes.body).toHaveLength(200);
        expect(allRes.body[0]?.itemId).toBe('recent-0');
        expect(allRes.body[199]?.itemId).toBe('recent-199');
        expect(zeroLimitRes.body[0]?.itemId).toBe('recent-0');
        expect(zeroLimitRes.body[199]?.itemId).toBe('recent-199');
    });
});
