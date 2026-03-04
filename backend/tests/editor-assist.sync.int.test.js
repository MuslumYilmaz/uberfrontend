'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let EditorAssistAttempt;
let connectToMongo;
let disconnectMongo;
let mongoServer;

const JWT_SECRET = 'test_jwt_secret_editor_assist_sync';

function authHeader(userId, role = 'user') {
  const token = jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function run(input = {}) {
  return {
    questionId: 'q-1',
    lang: 'js',
    ts: 60_000,
    passCount: 0,
    totalCount: 3,
    firstFailName: 'first fail',
    errorLine: 'Expected undefined to be 1',
    signature: 'first fail|Expected undefined to be 1|3',
    codeHash: 'abc123',
    codeChanged: true,
    interviewMode: false,
    errorCategory: 'missing-return',
    tags: ['arrays'],
    ...input,
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  EditorAssistAttempt = require('../models/EditorAssistAttempt');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await EditorAssistAttempt.deleteMany({});
});

describe('POST /api/editor-assist/sync', () => {
  test('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/editor-assist/sync')
      .send({ runs: [] });

    expect(res.status).toBe(401);
  });

  test('validates request payload shape and malformed runs', async () => {
    const user = await User.create({
      email: 'assist-validate@example.com',
      username: 'assist_validate_user',
      passwordHash: 'hash',
    });

    const tooManyRuns = Array.from({ length: 201 }, (_, i) => run({ questionId: `q-${i}` }));
    const tooManyRes = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: tooManyRuns });
    expect(tooManyRes.status).toBe(400);

    const malformedRes = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({
        runs: [{ questionId: 'q-missing-required', lang: 'js', ts: 123 }],
      });
    expect(malformedRes.status).toBe(400);
  });

  test('rejects oversized key fields to avoid record-key collisions', async () => {
    const user = await User.create({
      email: 'assist-oversize@example.com',
      username: 'assist_oversize_user',
      passwordHash: 'hash',
    });

    const longQuestionId = `q-${'a'.repeat(400)}`;
    const tooLongQuestion = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ questionId: longQuestionId })] });
    expect(tooLongQuestion.status).toBe(400);

    const longSignature = `sig-${'s'.repeat(2000)}`;
    const tooLongSignature = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ signature: longSignature })] });
    expect(tooLongSignature.status).toBe(400);
  });

  test('requires non-negative passCount/totalCount and sane pass ratio', async () => {
    const user = await User.create({
      email: 'assist-counts@example.com',
      username: 'assist_counts_user',
      passwordHash: 'hash',
    });

    const missingPassCount = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [{ ...run(), passCount: undefined }] });
    expect(missingPassCount.status).toBe(400);

    const missingTotalCount = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [{ ...run(), totalCount: undefined }] });
    expect(missingTotalCount.status).toBe(400);

    const passOverTotal = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ passCount: 4, totalCount: 3 })] });
    expect(passOverTotal.status).toBe(400);
  });

  test('dedupes by record key and keeps newer ts / higher passCount tie-breaker', async () => {
    const user = await User.create({
      email: 'assist-merge@example.com',
      username: 'assist_merge_user',
      passwordHash: 'hash',
    });

    const first = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ ts: 60_100, passCount: 0 })] });
    expect(first.status).toBe(200);
    expect(first.body?.stats?.upserted).toBe(1);

    const older = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ ts: 60_050, passCount: 2 })] });
    expect(older.status).toBe(200);
    expect(older.body?.stats?.deduped).toBe(1);

    const sameTsBetterPass = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ ts: 60_100, passCount: 1 })] });
    expect(sameTsBetterPass.status).toBe(200);
    expect(sameTsBetterPass.body?.stats?.upserted).toBe(1);

    const docs = await EditorAssistAttempt.find({ userId: user._id }).lean();
    expect(docs.length).toBe(1);
    expect(docs[0].ts).toBe(60_100);
    expect(docs[0].passCount).toBe(1);
  });

  test('cursor-based sync returns only records updated after cursor', async () => {
    const user = await User.create({
      email: 'assist-cursor@example.com',
      username: 'assist_cursor_user',
      passwordHash: 'hash',
    });

    const first = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ questionId: 'q-a', ts: 120_000 })] });
    expect(first.status).toBe(200);
    const cursorTs = Number(first.body?.cursorTs || 0);
    expect(cursorTs).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 15));

    const second = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [run({ questionId: 'q-b', ts: 180_000, signature: 'sig-b' })] });
    expect(second.status).toBe(200);

    const incremental = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({ runs: [], cursorTs, limit: 500 });
    expect(incremental.status).toBe(200);
    expect(Array.isArray(incremental.body?.runs)).toBe(true);
    expect(incremental.body.runs.length).toBe(1);
    expect(incremental.body.runs[0].questionId).toBe('q-b');
  });

  test('never stores unknown/raw code payload fields', async () => {
    const user = await User.create({
      email: 'assist-privacy@example.com',
      username: 'assist_privacy_user',
      passwordHash: 'hash',
    });

    const res = await request(app)
      .post('/api/editor-assist/sync')
      .set('Authorization', authHeader(user._id))
      .send({
        runs: [
          {
            ...run(),
            rawCode: 'const secret = 123;',
            sourceCode: 'function verySecret() {}',
          },
        ],
      });
    expect(res.status).toBe(200);

    const doc = await EditorAssistAttempt.findOne({ userId: user._id }).lean();
    expect(doc).toBeTruthy();
    expect(doc.rawCode).toBeUndefined();
    expect(doc.sourceCode).toBeUndefined();
  });
});
