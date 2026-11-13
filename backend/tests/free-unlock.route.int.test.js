'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_free_unlock_route';
const UNLOCK_URL = '/api/users/me/free-unlock';

// The rows come from the generated file, so the test follows the content instead of pinning it.
const LISTS = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../cdn/questions/company-question-lists.json'), 'utf8')).companies;
const rows = Object.entries(LISTS).flatMap(([company, list]) => list.questions.map((question) => ({ company, ...question })));
const [eligible, secondEligible] = rows.filter((row) => row.unlockable);
const ineligible = rows.find((row) => !row.unlockable && !row.open);

function tokenFor(userId) {
  return jwt.sign({ sub: userId.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

function authHeader(userId) {
  return `Bearer ${tokenFor(userId)}`;
}

async function createUser(overrides = {}) {
  return User.create({
    username: `user_${Math.random().toString(36).slice(2, 10)}`,
    email: `${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash: 'x',
    ...overrides,
  });
}

function unlock(userId, row) {
  return request(app).post(UNLOCK_URL).set('Authorization', authHeader(userId)).send({ company: row.company, questionId: row.id });
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

test('the generated lists hold two questions the unlock may open and one it may not', () => {
  expect(eligible && secondEligible && ineligible).toBeTruthy();
});

describe('access', () => {
  test('needs an account', async () => {
    expect((await request(app).post(UNLOCK_URL).send({ company: eligible.company, questionId: eligible.id })).status).toBe(401);
  });

  test('a cookie session needs the CSRF token', async () => {
    const user = await createUser();
    const cookie = `access_token=${tokenFor(user._id)}`;
    const body = { company: eligible.company, questionId: eligible.id };

    const rejected = await request(app).post(UNLOCK_URL).set('Cookie', [cookie]).send(body);
    expect(rejected.status).toBe(403);
    expect(rejected.body.code).toBe('AUTH_CSRF_INVALID');
    expect((await User.findById(user._id)).freeUnlock).toBeNull();

    const accepted = await request(app)
      .post(UNLOCK_URL)
      .set('Cookie', [cookie, 'csrf_token=matching'])
      .set('X-CSRF-Token', 'matching')
      .send(body);
    expect(accepted.status).toBe(200);
  });
});

describe('spending the unlock', () => {
  test('a free account opens one question, and /api/auth/me brings it back with its practice task', async () => {
    const user = await createUser();
    const opened = await unlock(user._id, eligible);
    expect(opened.status).toBe(200);
    const practiceId = eligible.practice ? eligible.practice.route.split('/').pop() : null;
    expect(opened.body.freeUnlock).toMatchObject({ company: eligible.company, questionId: eligible.id, practiceId });

    const me = await request(app).get('/api/auth/me').set('Authorization', authHeader(user._id));
    expect(me.body.freeUnlock).toMatchObject({ company: eligible.company, questionId: eligible.id, practiceId });
    expect(typeof me.body.freeUnlock.unlockedAt).toBe('string');
  });

  test('asking again for the same question answers with it; any other question is refused', async () => {
    const user = await createUser();
    await unlock(user._id, eligible);
    const again = await unlock(user._id, eligible);
    expect(again.status).toBe(200);
    expect(again.body.freeUnlock.questionId).toBe(eligible.id);

    const other = await unlock(user._id, secondEligible);
    expect(other.status).toBe(409);
    expect(other.body.code).toBe('FREE_UNLOCK_USED');
    expect(other.body.freeUnlock.questionId).toBe(eligible.id);
    expect((await User.findById(user._id)).freeUnlock.questionId).toBe(eligible.id);
  });

  test('two requests at once spend it once', async () => {
    const user = await createUser();
    const statuses = (await Promise.all([unlock(user._id, eligible), unlock(user._id, secondEligible)])).map((res) => res.status).sort();
    expect(statuses).toEqual([200, 409]);
  });

  test('refuses a question without a practice task or answer guide, an unknown one and a malformed request', async () => {
    const user = await createUser();
    const bare = await unlock(user._id, ineligible);
    expect(bare.status).toBe(400);
    expect(bare.body.code).toBe('FREE_UNLOCK_NOT_ELIGIBLE');
    expect((await unlock(user._id, { company: eligible.company, id: 'no-such-question' })).status).toBe(404);
    const malformed = await request(app).post(UNLOCK_URL).set('Authorization', authHeader(user._id)).send({ company: 'Eleven Labs' });
    expect(malformed.status).toBe(400);
    expect((await User.findById(user._id)).freeUnlock).toBeNull();
  });

  test('a user only ever spends their own unlock', async () => {
    const owner = await createUser();
    const other = await createUser();
    await unlock(owner._id, eligible);
    expect((await unlock(other._id, secondEligible)).status).toBe(200);
    expect((await User.findById(owner._id)).freeUnlock.questionId).toBe(eligible.id);
    expect((await User.findById(other._id)).freeUnlock.questionId).toBe(secondEligible.id);
  });
});

test('without the generated lists an unlock is refused, not guessed', () => {
  const { parseFreeUnlock } = require('../services/free-unlock');
  expect(parseFreeUnlock({ company: 'elevenlabs', questionId: 'any-question' }, null)).toMatchObject({ status: 503, code: 'FREE_UNLOCK_UNAVAILABLE' });
});
