'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let PracticeProgress;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_practice_progress_route';

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
  PracticeProgress = require('../models/PracticeProgress');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await PracticeProgress.deleteMany({});
});

describe('practice progress routes', () => {
  test('upserts and merges incident progress by family + item id', async () => {
    const user = await User.create({
      email: 'practice-progress@example.com',
      username: 'practice_progress_user',
      passwordHash: 'hash',
    });

    const first = await request(app)
      .put('/api/practice-progress/incident/search-typing-lag')
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: false,
        passed: false,
        bestScore: 62,
        lastPlayedAt: '2026-03-20T09:00:00.000Z',
        extension: { reflectionNote: 'Profile the search interaction first.' },
      });

    expect(first.status).toBe(200);
    expect(first.body?.record).toEqual(expect.objectContaining({
      family: 'incident',
      itemId: 'search-typing-lag',
      started: true,
      completed: false,
      passed: false,
      bestScore: 62,
      extension: { reflectionNote: 'Profile the search interaction first.' },
    }));

    const second = await request(app)
      .put('/api/practice-progress/incident/search-typing-lag')
      .set('Authorization', authHeader(user._id))
      .send({
        started: false,
        completed: true,
        passed: true,
        bestScore: 81,
        lastPlayedAt: '2026-03-20T10:00:00.000Z',
        extension: { reflectionNote: 'Split the expensive work away from typing.' },
      });

    expect(second.status).toBe(200);
    expect(second.body?.record).toEqual(expect.objectContaining({
      family: 'incident',
      itemId: 'search-typing-lag',
      started: true,
      completed: true,
      passed: true,
      bestScore: 81,
      extension: { reflectionNote: 'Split the expensive work away from typing.' },
    }));

    const list = await request(app)
      .get('/api/practice-progress?family=incident')
      .set('Authorization', authHeader(user._id));

    expect(list.status).toBe(200);
    expect(list.body?.records).toHaveLength(1);
    expect(list.body?.records?.[0]).toEqual(expect.objectContaining({
      family: 'incident',
      itemId: 'search-typing-lag',
      passed: true,
      bestScore: 81,
    }));
  });

  test('keeps the newer reflection note when an older payload arrives later', async () => {
    const user = await User.create({
      email: 'practice-progress-merge@example.com',
      username: 'practice_progress_merge_user',
      passwordHash: 'hash',
    });

    await PracticeProgress.create({
      userId: user._id,
      family: 'incident',
      itemId: 'websocket-memory-leak',
      started: true,
      completed: true,
      passed: true,
      bestScore: 79,
      lastPlayedAt: new Date('2026-03-20T12:00:00.000Z'),
      extension: { reflectionNote: 'Tear down listeners on every dependency change.' },
    });

    const res = await request(app)
      .put('/api/practice-progress/incident/websocket-memory-leak')
      .set('Authorization', authHeader(user._id))
      .send({
        started: true,
        completed: true,
        passed: false,
        bestScore: 60,
        lastPlayedAt: '2026-03-20T11:00:00.000Z',
        extension: { reflectionNote: 'Older note should not win.' },
      });

    expect(res.status).toBe(200);
    expect(res.body?.record).toEqual(expect.objectContaining({
      passed: true,
      bestScore: 79,
      extension: { reflectionNote: 'Tear down listeners on every dependency change.' },
    }));
  });
});
