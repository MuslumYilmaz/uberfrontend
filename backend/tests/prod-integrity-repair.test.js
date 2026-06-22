'use strict';

const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  buildRepairPlan,
  applyRepairPlan,
} = require('../scripts/prod-integrity-repair');

jest.setTimeout(120000);

let mongoServer;
let client;
let db;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  client = new MongoClient(mongoServer.getUri());
  await client.connect();
  db = client.db('prod_integrity_repair_test');
});

afterAll(async () => {
  if (client) await client.close();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    db.collection('users').deleteMany({}),
    db.collection('firstcompletioncredits').deleteMany({}),
    db.collection('activityevents').deleteMany({}),
    db.collection('activitycompletions').deleteMany({}),
    db.collection('weeklygoalbonuscredits').deleteMany({}),
    db.collection('pendingentitlements').deleteMany({}),
  ]);
});

function baseUser(overrides = {}) {
  return {
    _id: new ObjectId(),
    email: 'repair@example.com',
    username: 'repair_user',
    accessTier: 'free',
    stats: {
      xpTotal: 0,
      completedTotal: 0,
      perTech: {},
    },
    solvedQuestionIds: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

test('dry-run plans legacy completion backfills without mutating data', async () => {
  const user = baseUser({
    stats: {
      xpTotal: 25,
      completedTotal: 3,
      perTech: {
        css: { completed: 1, xp: 10 },
        react: { completed: 1, xp: 5 },
        javascript: { completed: 1, xp: 10 },
      },
    },
    solvedQuestionIds: ['css-selectors-text-basics', 'js-update-at-index'],
  });
  await db.collection('users').insertOne(user);
  await db.collection('firstcompletioncredits').insertMany([
    {
      userId: user._id,
      kind: 'coding',
      itemId: 'css-selectors-text-basics',
      firstCompletedAt: new Date('2026-03-03T08:18:57.642Z'),
      createdAt: new Date('2026-03-03T08:18:57.658Z'),
    },
    {
      userId: user._id,
      kind: 'trivia',
      itemId: 'react-usestate-purpose',
      firstCompletedAt: new Date('2026-03-11T15:51:31.278Z'),
      createdAt: new Date('2026-03-11T15:51:31.304Z'),
    },
    {
      userId: user._id,
      kind: 'coding',
      itemId: 'js-update-at-index',
      firstCompletedAt: new Date('2026-03-15T15:44:56.642Z'),
      createdAt: new Date('2026-03-15T15:44:56.660Z'),
    },
  ]);
  await db.collection('activityevents').insertMany([
    {
      userId: user._id,
      kind: 'coding',
      tech: 'css',
      itemId: 'css-selectors-text-basics',
      source: 'tech',
      xp: 10,
      completedAt: new Date('2026-03-03T08:18:57.642Z'),
      dayUTC: '2026-03-03',
      createdAt: new Date('2026-03-03T08:18:57.670Z'),
    },
    {
      userId: user._id,
      kind: 'trivia',
      tech: 'react',
      itemId: 'react-usestate-purpose',
      source: 'tech',
      xp: 5,
      completedAt: new Date('2026-03-11T15:51:31.278Z'),
      dayUTC: '2026-03-11',
      createdAt: new Date('2026-03-11T15:51:31.321Z'),
    },
    {
      userId: user._id,
      kind: 'trivia',
      tech: 'react',
      itemId: 'react-usestate-purpose',
      source: 'tech',
      xp: 5,
      completedAt: new Date('2026-03-11T15:52:31.278Z'),
      dayUTC: '2026-03-11',
      createdAt: new Date('2026-03-11T15:52:31.321Z'),
    },
  ]);
  await db.collection('activitycompletions').insertOne({
    userId: user._id,
    kind: 'coding',
    tech: 'javascript',
    itemId: 'js-update-at-index',
    source: 'tech',
    xpAwarded: 10,
    active: true,
    completedAt: new Date('2026-03-15T15:45:58.761Z'),
    dayUTC: '2026-03-15',
    createdAt: new Date('2026-03-15T15:45:58.772Z'),
    updatedAt: new Date('2026-03-15T15:45:58.772Z'),
  });

  const plan = await buildRepairPlan(db, {
    now: new Date('2026-06-22T00:00:00.000Z'),
  });

  expect(plan.legacy.plannedCompletions).toHaveLength(2);
  expect(plan.legacy.plannedCompletions.find((entry) => entry.doc.itemId === 'react-usestate-purpose').duplicateEventCount).toBe(1);
  expect(plan.legacy.userAggregateUpdates).toHaveLength(1);
  expect(plan.legacy.userAggregateUpdates[0].expected).toEqual({
    xpTotal: 25,
    completedTotal: 3,
    perTech: {
      css: { completed: 1, xp: 10 },
      react: { completed: 1, xp: 5 },
      javascript: { completed: 1, xp: 10 },
    },
    solvedQuestionIds: [
      'css-selectors-text-basics',
      'react-usestate-purpose',
      'js-update-at-index',
    ],
  });

  expect(await db.collection('activitycompletions').countDocuments({ userId: user._id })).toBe(1);
});

test('apply backfills missing legacy completions and repairs user aggregates', async () => {
  const user = baseUser({
    stats: {
      xpTotal: 25,
      completedTotal: 3,
      perTech: {
        css: { completed: 1, xp: 10 },
        react: { completed: 1, xp: 5 },
        javascript: { completed: 1, xp: 10 },
      },
    },
    solvedQuestionIds: ['css-selectors-text-basics', 'js-update-at-index'],
  });
  await db.collection('users').insertOne(user);
  await db.collection('firstcompletioncredits').insertMany([
    {
      userId: user._id,
      kind: 'coding',
      itemId: 'css-selectors-text-basics',
      firstCompletedAt: new Date('2026-03-03T08:18:57.642Z'),
      createdAt: new Date('2026-03-03T08:18:57.658Z'),
    },
    {
      userId: user._id,
      kind: 'trivia',
      itemId: 'react-usestate-purpose',
      firstCompletedAt: new Date('2026-03-11T15:51:31.278Z'),
      createdAt: new Date('2026-03-11T15:51:31.304Z'),
    },
  ]);
  await db.collection('activityevents').insertMany([
    {
      userId: user._id,
      kind: 'coding',
      tech: 'css',
      itemId: 'css-selectors-text-basics',
      source: 'tech',
      xp: 10,
      completedAt: new Date('2026-03-03T08:18:57.642Z'),
      dayUTC: '2026-03-03',
      createdAt: new Date('2026-03-03T08:18:57.670Z'),
    },
    {
      userId: user._id,
      kind: 'trivia',
      tech: 'react',
      itemId: 'react-usestate-purpose',
      source: 'tech',
      xp: 5,
      completedAt: new Date('2026-03-11T15:51:31.278Z'),
      dayUTC: '2026-03-11',
      createdAt: new Date('2026-03-11T15:51:31.321Z'),
    },
  ]);
  await db.collection('activitycompletions').insertOne({
    userId: user._id,
    kind: 'coding',
    tech: 'javascript',
    itemId: 'js-update-at-index',
    source: 'tech',
    xpAwarded: 10,
    active: true,
    completedAt: new Date('2026-03-15T15:45:58.761Z'),
    dayUTC: '2026-03-15',
    createdAt: new Date('2026-03-15T15:45:58.772Z'),
    updatedAt: new Date('2026-03-15T15:45:58.772Z'),
  });

  const plan = await buildRepairPlan(db, {
    now: new Date('2026-06-22T00:00:00.000Z'),
  });
  const result = await applyRepairPlan(db, plan, {
    now: new Date('2026-06-22T00:01:00.000Z'),
  });

  expect(result.completions.filter((entry) => entry.inserted)).toHaveLength(2);
  const completions = await db.collection('activitycompletions')
    .find({ userId: user._id, active: true })
    .sort({ completedAt: 1 })
    .toArray();
  expect(completions.map((entry) => entry.itemId)).toEqual([
    'css-selectors-text-basics',
    'react-usestate-purpose',
    'js-update-at-index',
  ]);
  expect(completions.find((entry) => entry.itemId === 'css-selectors-text-basics').createdFromLegacyCredit).toBe(true);

  const updated = await db.collection('users').findOne({ _id: user._id });
  expect(updated.stats.xpTotal).toBe(25);
  expect(updated.stats.completedTotal).toBe(3);
  expect(updated.stats.perTech).toEqual({
    css: { completed: 1, xp: 10 },
    react: { completed: 1, xp: 5 },
    javascript: { completed: 1, xp: 10 },
  });
  expect(updated.solvedQuestionIds).toEqual([
    'css-selectors-text-basics',
    'react-usestate-purpose',
    'js-update-at-index',
  ]);
});

test('reports legacy first completion credits without matching activity events for manual review', async () => {
  const user = baseUser();
  await db.collection('users').insertOne(user);
  await db.collection('firstcompletioncredits').insertOne({
    userId: user._id,
    kind: 'coding',
    itemId: 'missing-event-question',
    firstCompletedAt: new Date('2026-03-01T00:00:00.000Z'),
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
  });

  const plan = await buildRepairPlan(db, {
    now: new Date('2026-06-22T00:00:00.000Z'),
  });

  expect(plan.legacy.plannedCompletions).toHaveLength(0);
  expect(plan.legacy.manualReview).toEqual([
    expect.objectContaining({
      reason: 'missing_matching_activity_event',
      itemId: 'missing-event-question',
    }),
  ]);
});

test('apply marks stale invalid lemonsqueezy pending entitlements ignored without granting access', async () => {
  const user = baseUser({
    email: 'buyer@example.com',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
  });
  await db.collection('users').insertOne(user);
  await db.collection('pendingentitlements').insertOne({
    provider: 'lemonsqueezy',
    scope: 'pro',
    eventId: 'evt_bad_binding',
    eventType: 'subscription_created',
    email: 'buyer@example.com',
    userId: 'test-user-id',
    entitlement: { status: 'active', validUntil: new Date('2099-01-01T00:00:00.000Z') },
    appliedAt: null,
    receivedAt: new Date('2026-03-01T00:00:00.000Z'),
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  });

  const plan = await buildRepairPlan(db, {
    now: new Date('2026-06-22T00:00:00.000Z'),
    pendingMinAgeHours: 24,
  });

  expect(plan.pending.ignored).toEqual([
    expect.objectContaining({
      eventId: 'evt_bad_binding',
      reason: 'lemonsqueezy_user_binding_missing_user',
    }),
  ]);

  await applyRepairPlan(db, plan, {
    now: new Date('2026-06-22T00:01:00.000Z'),
  });

  const pending = await db.collection('pendingentitlements').findOne({ eventId: 'evt_bad_binding' });
  expect(pending.appliedAt).toBeNull();
  expect(pending.ignoredAt).toEqual(new Date('2026-06-22T00:01:00.000Z'));
  expect(pending.ignoredReason).toBe('lemonsqueezy_user_binding_missing_user');

  const updatedUser = await db.collection('users').findOne({ _id: user._id });
  expect(updatedUser.accessTier).toBe('free');
  expect(updatedUser.entitlements.pro.status).toBe('none');
});
