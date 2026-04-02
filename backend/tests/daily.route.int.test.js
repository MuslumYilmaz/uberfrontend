'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let DailyChallenge;
let DailyChallengeAssignment;
let DailyChallengeCompletion;
let connectToMongo;
let disconnectMongo;
let mongoServer;
let getOrCreateDailyChallenge;

const JWT_SECRET = 'test_jwt_secret_daily_route';
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
  DailyChallenge = require('../models/DailyChallenge');
  DailyChallengeAssignment = require('../models/DailyChallengeAssignment');
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
  await DailyChallenge.deleteMany({});
  await DailyChallengeAssignment.deleteMany({});
  await DailyChallengeCompletion.deleteMany({});
});

afterEach(() => {
  resetSystemTime();
});

describe('POST /api/daily/complete', () => {
  test('duplicate concurrent submissions are idempotent and never 500', async () => {
    const user = await User.create({
      email: 'daily-idempotent@example.com',
      username: 'daily_idempotent_user',
      passwordHash: 'hash',
    });

    const challenge = await getOrCreateDailyChallenge({ user });
    await User.updateOne(
      { _id: user._id },
      { $set: { solvedQuestionIds: [challenge.questionId] } }
    );

    const [first, second] = await Promise.all([
      request(app)
        .post('/api/daily/complete')
        .set('Authorization', authHeader(user._id))
        .send({ questionId: challenge.questionId }),
      request(app)
        .post('/api/daily/complete')
        .set('Authorization', authHeader(user._id))
        .send({ questionId: challenge.questionId }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect([first.body?.completed, first.body?.alreadyCompleted].some(Boolean)).toBe(true);
    expect([second.body?.completed, second.body?.alreadyCompleted].some(Boolean)).toBe(true);

    const completionCount = await DailyChallengeCompletion.countDocuments({
      userId: user._id,
      dayKey: challenge.dayKey,
    });
    expect(completionCount).toBe(1);
  });

  test('submit uses the challenge active at submit time and rejects yesterday’s question id', async () => {
    mockSystemTime('2026-02-11T12:00:00.000Z');

    const user = await User.create({
      _id: new mongoose.Types.ObjectId('000000000000000000000005'),
      email: 'daily-day-change@example.com',
      username: 'daily_day_change_user',
      passwordHash: 'hash',
    });

    const firstChallenge = await getOrCreateDailyChallenge({ user, now: new Date('2026-02-11T12:00:00.000Z') });
    const secondChallenge = await getOrCreateDailyChallenge({ user, now: new Date('2026-02-12T12:00:00.000Z') });
    expect(secondChallenge.questionId).not.toBe(firstChallenge.questionId);

    await User.updateOne(
      { _id: user._id },
      { $set: { solvedQuestionIds: [firstChallenge.questionId, secondChallenge.questionId] } }
    );

    mockSystemTime('2026-02-12T12:00:00.000Z');

    const res = await request(app)
      .post('/api/daily/complete')
      .set('Authorization', authHeader(user._id))
      .send({ questionId: firstChallenge.questionId });

    expect(res.status).toBe(400);
    expect(String(res.body?.error || '')).toContain('Question does not match today');
  });
});
