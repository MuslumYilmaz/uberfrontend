'use strict';

const os = require('os');
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
let planService;

const JWT_SECRET = 'test_jwt_secret_company_plan_route';
const PLAN_URL = '/api/users/me/company-plan';

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

function savePlan(userId, body) {
  return request(app).put(PLAN_URL).set('Authorization', authHeader(userId)).send(body);
}

function mark(userId, body) {
  return request(app).patch(PLAN_URL).set('Authorization', authHeader(userId)).send(body);
}

const elevenLabsPlan = { companies: [{ slug: 'elevenlabs' }], level: 'senior', when: 'next-week' };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  planService = require('../services/company-plan');

  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('access', () => {
  test('needs an account', async () => {
    expect((await request(app).put(PLAN_URL).send(elevenLabsPlan)).status).toBe(401);
    expect((await request(app).patch(PLAN_URL).send({ kind: 'task', id: 'js-debounce', on: true })).status).toBe(401);
  });

  test('a cookie session needs the CSRF token', async () => {
    const user = await createUser();
    const cookie = `access_token=${tokenFor(user._id)}`;

    const rejected = await request(app).put(PLAN_URL).set('Cookie', [cookie]).send(elevenLabsPlan);
    expect(rejected.status).toBe(403);
    expect(rejected.body.code).toBe('AUTH_CSRF_INVALID');
    expect((await User.findById(user._id)).companyPlan).toBeNull();

    const accepted = await request(app)
      .put(PLAN_URL)
      .set('Cookie', [cookie, 'csrf_token=matching'])
      .set('X-CSRF-Token', 'matching')
      .send(elevenLabsPlan);
    expect(accepted.status).toBe(200);
  });

  test('a user only ever changes their own plan', async () => {
    const owner = await createUser();
    const other = await createUser();
    await savePlan(owner._id, elevenLabsPlan);
    await savePlan(other._id, { companies: [{ slug: 'agoda' }], level: 'mid', when: 'later' });
    expect((await User.findById(owner._id)).companyPlan.companies[0].slug).toBe('elevenlabs');
    expect((await User.findById(other._id)).companyPlan.companies[0].slug).toBe('agoda');
  });
});

describe('PUT saves the answers', () => {
  test('a free account can save before paying, and /api/auth/me brings the plan back the next day', async () => {
    const user = await createUser();
    const saved = await savePlan(user._id, {
      companies: [{ slug: 'agoda', list: 'gurgaon' }, { slug: 'elevenlabs' }],
      level: 'senior',
      when: 'next-week',
    });
    expect(saved.status).toBe(200);
    expect(saved.body.companyPlan.companies).toEqual([{ slug: 'agoda', list: 'gurgaon' }, { slug: 'elevenlabs' }]);

    const me = await request(app).get('/api/auth/me').set('Authorization', authHeader(user._id));
    expect(me.status).toBe(200);
    expect(me.body.accessTierEffective).toBe('free');
    expect(me.body.companyPlan).toMatchObject({
      companies: [{ slug: 'agoda', list: 'gurgaon' }, { slug: 'elevenlabs' }],
      level: 'senior',
      when: 'next-week',
      passedRounds: [],
      markedDone: [],
    });
    expect(new Date(me.body.companyPlan.createdAt).getTime()).toBeGreaterThan(0);
  });

  test('/api/auth/me says null for an account with no plan', async () => {
    const user = await createUser();
    const me = await request(app).get('/api/auth/me').set('Authorization', authHeader(user._id));
    expect(me.body.companyPlan).toBeNull();
  });

  test.each([
    ['an unknown company', { ...elevenLabsPlan, companies: [{ slug: 'vercel' }] }],
    ['a malformed company', { ...elevenLabsPlan, companies: [{ slug: 'Eleven Labs' }] }],
    ['a company that is not an object', { ...elevenLabsPlan, companies: ['elevenlabs'] }],
    ['an operator in place of a slug', { ...elevenLabsPlan, companies: [{ slug: { $ne: null } }] }],
    ['no company', { ...elevenLabsPlan, companies: [] }],
    ['more than three companies', { ...elevenLabsPlan, companies: [{ slug: 'agoda' }, { slug: 'amazon' }, { slug: 'meta' }, { slug: 'google' }] }],
    ['a repeated company', { ...elevenLabsPlan, companies: [{ slug: 'agoda' }, { slug: 'agoda' }] }],
    ['a list of another company', { ...elevenLabsPlan, companies: [{ slug: 'agoda', list: 'students' }] }],
    ['a list that is not a string', { ...elevenLabsPlan, companies: [{ slug: 'agoda', list: 7 }] }],
    ['an unknown level', { ...elevenLabsPlan, level: 'principal' }],
    ['an unknown date', { ...elevenLabsPlan, when: 'someday' }],
    ['a body with no answers', {}],
  ])('rejects %s and stores nothing', async (_name, body) => {
    const user = await createUser();
    const response = await savePlan(user._id, body);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('COMPANY_PLAN_INVALID');
    expect((await User.findById(user._id)).companyPlan).toBeNull();
  });

  test('stores only the known fields', async () => {
    const user = await createUser();
    const saved = await savePlan(user._id, {
      ...elevenLabsPlan,
      createdAt: '2001-01-01',
      markedDone: ['js-debounce'],
      accessTier: 'premium',
      companies: [{ slug: 'elevenlabs', extra: 'x' }],
    });
    expect(saved.status).toBe(200);
    expect(saved.body.companyPlan.passedRounds).toEqual([]);
    expect(saved.body.companyPlan.markedDone).toEqual([]);
    expect(saved.body.companyPlan.companies).toEqual([{ slug: 'elevenlabs' }]);
    expect(new Date(saved.body.companyPlan.createdAt).getFullYear()).toBeGreaterThan(2001);
    expect((await User.findById(user._id)).accessTier).toBe('free');
  });

  test('the rounds the form says are passed are stored, minus any of another company or unknown to the catalog', async () => {
    const user = await createUser();
    const saved = await savePlan(user._id, {
      ...elevenLabsPlan,
      passedRounds: [
        'elevenlabs/main/recruiter-call',
        'elevenlabs/main/coding-assessment',
        'elevenlabs/main/recruiter-call',
        'agoda/bangkok/recruiter-prep-call',
        'elevenlabs/main/no-such-round',
        'not a key',
      ],
    });
    expect(saved.status).toBe(200);
    expect(saved.body.companyPlan.passedRounds).toEqual(['elevenlabs/main/recruiter-call', 'elevenlabs/main/coding-assessment']);
  });

  test('a stated list of passed rounds replaces the marks; answers without one keep them', async () => {
    const user = await createUser();
    await savePlan(user._id, elevenLabsPlan);
    await mark(user._id, { kind: 'round', id: 'elevenlabs/main/recruiter-call', on: true });

    const kept = await savePlan(user._id, { ...elevenLabsPlan, level: 'mid' });
    expect(kept.body.companyPlan.passedRounds).toEqual(['elevenlabs/main/recruiter-call']);

    const restated = await savePlan(user._id, { ...elevenLabsPlan, passedRounds: ['elevenlabs/main/coding-assessment'] });
    expect(restated.body.companyPlan.passedRounds).toEqual(['elevenlabs/main/coding-assessment']);

    const cleared = await savePlan(user._id, { ...elevenLabsPlan, passedRounds: [] });
    expect(cleared.body.companyPlan.passedRounds).toEqual([]);
  });

  test('rejects passed rounds that are not a list of keys', async () => {
    const user = await createUser();
    for (const passedRounds of ['elevenlabs/main/recruiter-call', [7], { $ne: null }]) {
      const response = await savePlan(user._id, { ...elevenLabsPlan, passedRounds });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('COMPANY_PLAN_INVALID');
    }
    expect((await User.findById(user._id)).companyPlan).toBeNull();
  });

  test('a new plan replaces the old one, keeps manual marks and drops passed rounds of a dropped company', async () => {
    const user = await createUser();
    await savePlan(user._id, { companies: [{ slug: 'elevenlabs' }, { slug: 'agoda' }], level: 'senior', when: 'next-week' });
    await mark(user._id, { kind: 'round', id: 'elevenlabs/main/recruiter-call', on: true });
    await mark(user._id, { kind: 'round', id: 'agoda/bangkok/recruiter-prep-call', on: true });
    await mark(user._id, { kind: 'task', id: '/guides/behavioral', on: true });

    const replaced = await savePlan(user._id, { companies: [{ slug: 'agoda' }, { slug: 'meta' }], level: 'staff', when: 'later' });
    expect(replaced.status).toBe(200);
    expect(replaced.body.companyPlan.companies).toEqual([{ slug: 'agoda' }, { slug: 'meta' }]);
    expect(replaced.body.companyPlan.level).toBe('staff');
    expect(replaced.body.companyPlan.passedRounds).toEqual(['agoda/bangkok/recruiter-prep-call']);
    expect(replaced.body.companyPlan.markedDone).toEqual(['/guides/behavioral']);
  });

  test('the date clock restarts only when the date answer or the companies change', async () => {
    const user = await createUser();
    await savePlan(user._id, { companies: [{ slug: 'agoda' }], level: 'senior', when: 'next-week' });
    const old = new Date('2026-01-05T10:00:00Z');
    await User.updateOne({ _id: user._id }, { $set: { 'companyPlan.createdAt': old } });

    const switchedList = await savePlan(user._id, { companies: [{ slug: 'agoda', list: 'gurgaon' }], level: 'mid', when: 'next-week' });
    expect(new Date(switchedList.body.companyPlan.createdAt).toISOString()).toBe(old.toISOString());

    const newDate = await savePlan(user._id, { companies: [{ slug: 'agoda', list: 'gurgaon' }], level: 'mid', when: 'tomorrow' });
    expect(new Date(newDate.body.companyPlan.createdAt).getTime()).toBeGreaterThan(old.getTime());

    await User.updateOne({ _id: user._id }, { $set: { 'companyPlan.createdAt': old } });
    const newCompany = await savePlan(user._id, { companies: [{ slug: 'meta' }], level: 'mid', when: 'tomorrow' });
    expect(new Date(newCompany.body.companyPlan.createdAt).getTime()).toBeGreaterThan(old.getTime());
  });
});

describe('PATCH flips one mark', () => {
  test('needs a plan first', async () => {
    const user = await createUser();
    const response = await mark(user._id, { kind: 'task', id: 'js-debounce', on: true });
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('COMPANY_PLAN_MISSING');
  });

  test('marks and unmarks a passed round, and repeating a click changes nothing', async () => {
    const user = await createUser();
    await savePlan(user._id, elevenLabsPlan);
    const key = 'elevenlabs/main/coding-assessment';

    const on = await mark(user._id, { kind: 'round', id: key, on: true });
    expect(on.status).toBe(200);
    expect(on.body.companyPlan.passedRounds).toEqual([key]);
    expect((await mark(user._id, { kind: 'round', id: key, on: true })).body.companyPlan.passedRounds).toEqual([key]);

    const off = await mark(user._id, { kind: 'round', id: key, on: false });
    expect(off.body.companyPlan.passedRounds).toEqual([]);
    expect((await mark(user._id, { kind: 'round', id: key, on: false })).status).toBe(200);
  });

  test('two marks at the same moment both land', async () => {
    const user = await createUser();
    await savePlan(user._id, elevenLabsPlan);
    const keys = ['elevenlabs/main/recruiter-call', 'elevenlabs/main/coding-assessment', 'elevenlabs/main/live-technical-round'];
    const responses = await Promise.all(keys.map((id) => mark(user._id, { kind: 'round', id, on: true })));
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    const stored = (await User.findById(user._id)).companyPlan.passedRounds;
    expect([...stored].sort()).toEqual([...keys].sort());
  });

  test.each([
    ['a round of a company outside the plan', { kind: 'round', id: 'agoda/bangkok/coding-interview', on: true }],
    ['an unknown round', { kind: 'round', id: 'elevenlabs/main/gone', on: true }],
    ['an unknown list', { kind: 'round', id: 'elevenlabs/gone/recruiter-call', on: true }],
    ['a malformed round', { kind: 'round', id: '../../etc', on: true }],
    ['an unknown task', { kind: 'task', id: 'js-gone', on: true }],
    ['an operator in place of an id', { kind: 'task', id: { $gt: '' }, on: true }],
    ['an unknown kind', { kind: 'other', id: 'js-debounce', on: true }],
    ['a missing flag', { kind: 'task', id: 'js-poll-until' }],
  ])('rejects %s', async (_name, body) => {
    const user = await createUser();
    await savePlan(user._id, elevenLabsPlan);
    const response = await mark(user._id, body);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('COMPANY_PLAN_INVALID');
    const stored = (await User.findById(user._id)).companyPlan;
    expect(stored.passedRounds).toHaveLength(0);
    expect(stored.markedDone).toHaveLength(0);
  });

  test('a manual mark moves no XP, streak, solved list or dashboard field', async () => {
    const user = await createUser({ solvedQuestionIds: ['js-debounce'], stats: { xpTotal: 40, streak: { current: 3 } } });
    await savePlan(user._id, elevenLabsPlan);
    const before = (await User.findById(user._id)).toObject();

    const response = await mark(user._id, { kind: 'task', id: '/guides/behavioral', on: true });
    expect(response.body.companyPlan.markedDone).toEqual(['/guides/behavioral']);

    const after = (await User.findById(user._id)).toObject();
    expect(after.solvedQuestionIds).toEqual(before.solvedQuestionIds);
    expect(after.stats).toEqual(before.stats);
    expect(after.entitlements).toEqual(before.entitlements);
    expect(after.billing).toEqual(before.billing);
  });
});

describe('the plan and the rest of the account', () => {
  test('stays on the account when a subscription ends, and can still be read and changed', async () => {
    const user = await createUser({
      accessTier: 'premium',
      entitlements: { pro: { status: 'active', validUntil: new Date(Date.now() + 86400000) } },
    });
    await savePlan(user._id, elevenLabsPlan);
    await mark(user._id, { kind: 'task', id: 'js-poll-until', on: true });

    await User.updateOne(
      { _id: user._id },
      { $set: { accessTier: 'free', 'entitlements.pro.status': 'expired', 'entitlements.pro.validUntil': new Date(Date.now() - 86400000) } },
    );

    const me = await request(app).get('/api/auth/me').set('Authorization', authHeader(user._id));
    expect(me.body.accessTierEffective).toBe('free');
    expect(me.body.companyPlan.companies).toEqual([{ slug: 'elevenlabs' }]);
    expect(me.body.companyPlan.markedDone).toEqual(['js-poll-until']);
    expect((await mark(user._id, { kind: 'task', id: 'js-poll-until', on: false })).status).toBe(200);
  });

  test('the profile route cannot write it, and saving settings leaves it alone', async () => {
    const user = await createUser();
    await savePlan(user._id, elevenLabsPlan);

    const updated = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', authHeader(user._id))
      .send({ bio: 'hello', companyPlan: { companies: [{ slug: 'meta' }], level: 'staff', when: 'later' } });
    expect(updated.status).toBe(200);

    const stored = await User.findById(user._id);
    expect(stored.bio).toBe('hello');
    expect(stored.companyPlan.companies[0].slug).toBe('elevenlabs');
    expect(stored.companyPlan.level).toBe('senior');
  });
});

describe('when the data file cannot be read', () => {
  test('answers and marks are still checked by shape, so a buyer can save', () => {
    const missing = path.join(os.tmpdir(), 'company-plan-data-that-does-not-exist.json');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const catalog = planService.loadCompanyPlanCatalog(missing);
    warn.mockRestore();
    expect(catalog).toBeNull();

    expect(planService.parseCompanyPlanAnswers(elevenLabsPlan, catalog).value.companies).toEqual([{ slug: 'elevenlabs' }]);
    expect(planService.parseCompanyPlanAnswers({ ...elevenLabsPlan, companies: [{ slug: 'Not A Slug' }] }, catalog).error).toBeDefined();
    expect(planService.parseCompanyPlanAnswers({ ...elevenLabsPlan, level: 'principal' }, catalog).error).toBeDefined();

    const plan = { companies: [{ slug: 'elevenlabs' }], passedRounds: [], markedDone: [] };
    expect(planService.parseCompanyPlanMark({ kind: 'task', id: 'js-debounce', on: true }, plan, catalog).value.id).toBe('js-debounce');
    expect(planService.parseCompanyPlanMark({ kind: 'round', id: 'elevenlabs/main/x', on: true }, plan, catalog).value.id).toBe('elevenlabs/main/x');
    expect(planService.parseCompanyPlanMark({ kind: 'round', id: 'agoda/main/x', on: true }, plan, catalog).error).toBeDefined();
  });

  test('the lists cannot grow without limit', () => {
    const full = {
      companies: [{ slug: 'elevenlabs' }],
      passedRounds: Array.from({ length: 60 }, (_, index) => `elevenlabs/main/r${index}`),
      markedDone: Array.from({ length: 200 }, (_, index) => `js-${index}`),
    };
    expect(planService.parseCompanyPlanMark({ kind: 'round', id: 'elevenlabs/main/new', on: true }, full, null).error).toMatch(/Too many/);
    expect(planService.parseCompanyPlanMark({ kind: 'task', id: 'js-new', on: true }, full, null).error).toMatch(/Too many/);
    expect(planService.parseCompanyPlanMark({ kind: 'task', id: 'js-new', on: false }, full, null).value.on).toBe(false);
    expect(planService.parseCompanyPlanMark({ kind: 'task', id: 'js-1', on: true }, full, null).value.id).toBe('js-1');
  });
});
