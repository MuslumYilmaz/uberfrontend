'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let ActivityEvent;
let FirstCompletionCredit;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_activity_complete';

function authHeader(userId, role = 'user') {
    const token = jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' });
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
    ActivityEvent = require('../models/ActivityEvent');
    FirstCompletionCredit = require('../models/FirstCompletionCredit');

    await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
    if (disconnectMongo) await disconnectMongo();
    if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await ActivityEvent.deleteMany({});
    await FirstCompletionCredit.deleteMany({});
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
        expect(reloaded?.stats?.completedTotal).toBe(2);

        const [eventCount, firstCompletionCount] = await Promise.all([
            ActivityEvent.countDocuments({ userId: user._id, kind: 'coding', itemId: 'same-item-id' }),
            FirstCompletionCredit.countDocuments({ userId: user._id, kind: 'coding', itemId: 'same-item-id' }),
        ]);
        expect(eventCount).toBe(2);
        expect(firstCompletionCount).toBe(1);
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
