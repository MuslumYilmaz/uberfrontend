'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let WeeklyGoalState;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_weekly_goal_route';
const RealDate = Date;

function authHeader(userId) {
  const token = jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
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
  WeeklyGoalState = require('../models/WeeklyGoalState');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await WeeklyGoalState.deleteMany({});
});

afterEach(() => {
  resetSystemTime();
});

describe('POST /api/weekly-goal', () => {
  test('current week keeps the old target while next week picks up the new preference', async () => {
    mockSystemTime('2026-02-11T12:00:00.000Z');

    const user = await User.create({
      email: 'weekly-route@example.com',
      username: 'weekly_route_user',
      passwordHash: 'hash',
      prefs: {
        gamification: {
          weeklyGoalEnabled: true,
          weeklyGoalTarget: 10,
          showStreakWidget: true,
          dailyChallengeTech: 'auto',
        },
      },
    });

    const updateRes = await request(app)
      .post('/api/weekly-goal')
      .set('Authorization', authHeader(user._id))
      .send({
        enabled: true,
        target: 3,
        showStreakWidget: true,
        dailyChallengeTech: 'vue',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.weeklyGoal?.target).toBe(10);
    expect(updateRes.body?.settings?.weeklyGoalTarget).toBe(3);
    expect(updateRes.body?.settings?.weeklyGoalEnabled).toBe(true);
    expect(updateRes.body?.settings?.dailyChallengeTech).toBe('vue');

    const currentWeekDashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(currentWeekDashboard.status).toBe(200);
    expect(currentWeekDashboard.body?.weeklyGoal?.target).toBe(10);
    expect(currentWeekDashboard.body?.settings?.weeklyGoalTarget).toBe(3);

    mockSystemTime('2026-02-18T12:00:00.000Z');

    const nextWeekDashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(user._id));

    expect(nextWeekDashboard.status).toBe(200);
    expect(nextWeekDashboard.body?.weeklyGoal?.target).toBe(3);
    expect(nextWeekDashboard.body?.settings?.weeklyGoalTarget).toBe(3);

    const snapshots = await WeeklyGoalState.find({ userId: user._id }).sort({ weekKey: 1 }).lean();
    expect(snapshots.map((row) => row.target)).toEqual([10, 3]);
  });
});
