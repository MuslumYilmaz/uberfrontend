'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
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

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
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
          solvedCount: expect.any(Number),
          totalCount: expect.any(Number),
          solvedPercent: expect.any(Number),
        }),
        settings: expect.objectContaining({
          showStreakWidget: expect.any(Boolean),
          dailyChallengeTech: expect.any(String),
        }),
      })
    );
  });
});
