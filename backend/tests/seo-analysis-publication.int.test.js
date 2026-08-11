'use strict';

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.setTimeout(120000);

let replicaSet;
let SeoAction;
let SeoPageAssessment;
let SeoSyncRun;
let publishAnalysisWrites;
let requiresTransactionalAnalysisPublication;
let persistAnalysisLifecycle;

const siteUrl = 'sc-domain:frontendatlas.com';
const now = new Date('2026-08-10T12:00:00.000Z');

function assessment(pageKey, state = 'clear') {
  return {
    siteUrl,
    pageKey,
    canonicalUrl: `https://frontendatlas.com/${pageKey}`,
    endDate: '2026-08-06',
    ruleVersion: 'balanced-v2.2',
    primaryState: state,
    disposition: state === 'clear' ? 'no_change' : 'change_ready',
    evidenceLevel: 'complete',
    evaluatedAt: now,
  };
}

function recommendation(pageKey) {
  return {
    pageKey,
    canonicalUrl: `https://frontendatlas.com/${pageKey}`,
    type: 'technical_indexing',
    source: 'balanced-v2.2',
    ruleVersion: 'balanced-v2.2',
    queueKind: 'technical',
    fingerprint: `technical:${pageKey}`,
    summary: 'New detector summary',
    hypothesis: 'A verified technical issue is present.',
    recommendation: { title: 'Inspect indexing', rationale: '', checklist: [] },
    successCriteria: {},
    priorityScore: 10,
    confidence: 0.9,
    patternConfidence: 0.9,
    causeConfidence: 0.9,
    expectedImpact: { metric: 'clicks', quality: 'not_estimated', windowDays: 28 },
    nextReview: { mode: 'event', event: 'url_inspection', rationale: 'Reinspect the URL.' },
    evidence: {},
  };
}

function publicationAnalysis(overrides = {}) {
  return {
    status: 'complete',
    reason: 'analysis_complete',
    ruleVersion: 'balanced-v2.2',
    endDate: '2026-08-06',
    windowDays: 28,
    completedDays: 56,
    requiredDays: 56,
    evaluatedPages: 1,
    committedAssessmentPages: 1,
    totalPages: 1,
    eligiblePages: 1,
    proposedActions: 1,
    clearedActions: 0,
    cooldown: { awaitingRecrawl: 0, observing: 0, directional: 0, eligible: 1 },
    dataQualityBlockedPages: 0,
    decisionBlockedPages: 0,
    startedAt: now,
    completedAt: now,
    ...overrides,
  };
}

async function createAnalysisRun(status = 'running') {
  return SeoSyncRun.create({
    runId: `publication-${status}-${Math.random()}`,
    siteUrl,
    trigger: 'test',
    status: 'running',
    startedAt: now,
    expiresAt: new Date('2026-11-08T12:00:00.000Z'),
    analysis: {
      ...publicationAnalysis({
        status,
        reason: status === 'running' ? 'analysis_running' : 'analysis_failed',
        evaluatedPages: 0,
        committedAssessmentPages: 0,
        proposedActions: 0,
        completedAt: status === 'running' ? null : now,
      }),
    },
  });
}

function publicationPayload(run, overrides = {}) {
  return {
    siteUrl,
    pages: [{ pageKey: 'page-one' }],
    recommendations: [recommendation('page-one')],
    evaluatedPageKeys: ['page-one'],
    querySafePageKeys: new Set(),
    eligibleTypesByPage: new Map([['page-one', new Set(['technical_indexing'])]]),
    migrationEligibleTypesByPage: new Map(),
    assessmentWrites: [{
      updateOne: {
        filter: { siteUrl, pageKey: 'page-one' },
        update: { $set: assessment('page-one', 'actionable') },
        upsert: true,
      },
    }],
    syncRunId: run?._id || null,
    publicationAnalysis: publicationAnalysis(),
    now,
    ...overrides,
  };
}

beforeAll(async () => {
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replicaSet.getUri('seo_analysis_publication'));
  SeoAction = require('../models/SeoAction');
  SeoPageAssessment = require('../models/SeoPageAssessment');
  SeoSyncRun = require('../models/SeoSyncRun');
  ({
    publishAnalysisWrites,
    requiresTransactionalAnalysisPublication,
  } = require('../services/seo/analysis'));
  ({ persistAnalysisLifecycle } = require('../services/seo/sync'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await replicaSet?.stop();
});

beforeEach(async () => {
  await Promise.all([
    SeoAction.deleteMany({}),
    SeoPageAssessment.deleteMany({}),
    SeoSyncRun.deleteMany({}),
  ]);
});

test('atomically publishes actions, assessments, and the complete run marker', async () => {
  const run = await createAnalysisRun();
  await SeoAction.create({
    ...recommendation('page-one'),
    summary: 'Previously visible summary',
    state: 'proposed',
    version: 0,
    events: [{ event: 'detected', at: now, fromState: '', toState: 'proposed' }],
  });
  await SeoPageAssessment.create([
    assessment('page-one', 'clear'),
    assessment('stale-page', 'watch'),
  ]);

  const result = await publishAnalysisWrites(publicationPayload(run));

  expect(result.publicationAnalysis).toEqual(expect.objectContaining({
    status: 'complete',
    reason: 'analysis_complete',
    committedAssessmentPages: 1,
  }));
  expect(await SeoAction.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ summary: 'New detector summary', version: 1 }));
  expect(await SeoPageAssessment.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ primaryState: 'actionable', disposition: 'change_ready' }));
  expect(await SeoPageAssessment.countDocuments({ pageKey: 'stale-page' })).toBe(0);
  expect(await SeoSyncRun.findById(run._id).lean())
    .toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'complete' }) }));
});

test('rolls back action, stale-assessment, and assessment mutations when the final assessment write fails', async () => {
  const run = await createAnalysisRun();
  await SeoAction.create({
    ...recommendation('page-one'),
    summary: 'Previously visible summary',
    state: 'proposed',
    version: 0,
    events: [{ event: 'detected', at: now, fromState: '', toState: 'proposed' }],
  });
  await SeoPageAssessment.create([
    assessment('page-one', 'clear'),
    assessment('stale-page', 'watch'),
  ]);

  const bulkWrite = jest.spyOn(SeoPageAssessment, 'bulkWrite')
    .mockRejectedValueOnce(new Error('injected assessment write failure'));

  await expect(publishAnalysisWrites(publicationPayload(run)))
    .rejects.toThrow('injected assessment write failure');
  bulkWrite.mockRestore();

  const action = await SeoAction.findOne({ pageKey: 'page-one' }).lean();
  expect(action).toEqual(expect.objectContaining({
    summary: 'Previously visible summary',
    state: 'proposed',
    version: 0,
  }));
  expect(await SeoPageAssessment.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ primaryState: 'clear', disposition: 'no_change' }));
  expect(await SeoPageAssessment.countDocuments({ pageKey: 'stale-page' })).toBe(1);
  expect(await SeoSyncRun.findById(run._id).lean())
    .toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'running' }) }));
});

test('rolls back an earlier action mutation when the publication deadline stops a later action', async () => {
  const run = await createAnalysisRun();
  await SeoAction.create({
    ...recommendation('page-one'),
    summary: 'Previously visible summary',
    state: 'proposed',
    version: 0,
    events: [{ event: 'detected', at: now, fromState: '', toState: 'proposed' }],
  });
  const clock = jest.fn()
    .mockReturnValueOnce(0)
    .mockReturnValue(10);

  await expect(publishAnalysisWrites(publicationPayload(run, {
    recommendations: [recommendation('page-one'), recommendation('page-two')],
    deadlineMs: 10,
    clock,
  }))).rejects.toMatchObject({ code: 'SEO_ANALYSIS_ACTION_PUBLICATION_INCOMPLETE' });

  expect(await SeoAction.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ summary: 'Previously visible summary', version: 0 }));
  expect(await SeoAction.countDocuments({ pageKey: 'page-two' })).toBe(0);
  expect(await SeoSyncRun.findById(run._id).lean())
    .toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'running' }) }));
});

test('rolls back every domain write when the run marker compare-and-set loses the race', async () => {
  const run = await createAnalysisRun('failed');
  await SeoAction.create({
    ...recommendation('page-one'),
    summary: 'Previously visible summary',
    state: 'proposed',
    version: 0,
    events: [{ event: 'detected', at: now, fromState: '', toState: 'proposed' }],
  });
  await SeoPageAssessment.create(assessment('page-one', 'clear'));

  await expect(publishAnalysisWrites(publicationPayload(run)))
    .rejects.toMatchObject({ code: 'SEO_ANALYSIS_PUBLICATION_MARKER_CONFLICT' });

  expect(await SeoAction.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ summary: 'Previously visible summary', version: 0 }));
  expect(await SeoPageAssessment.findOne({ pageKey: 'page-one' }).lean())
    .toEqual(expect.objectContaining({ primaryState: 'clear', disposition: 'no_change' }));
  expect(await SeoSyncRun.findById(run._id).lean())
    .toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'failed' }) }));
});

test('reloads an already-published marker instead of downgrading it after a post-commit exception', async () => {
  const run = await createAnalysisRun();
  const completed = publicationAnalysis();

  const result = await persistAnalysisLifecycle({
    run,
    siteUrl,
    endDate: '2026-08-06',
    deadlineMs: now.getTime() + 30_000,
    loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
    loadTotalPages: async () => 1,
    now: () => now,
    analyze: async ({ syncRunId, analysisStartedAt }) => {
      expect(String(syncRunId)).toBe(String(run._id));
      expect(analysisStartedAt).toEqual(now);
      await SeoSyncRun.updateOne(
        { _id: run._id, 'analysis.status': 'running' },
        { $set: { analysis: completed } },
        { runValidators: true }
      );
      throw new Error('injected post-publication failure');
    },
  });

  expect(result).toEqual(expect.objectContaining({ status: 'complete' }));
  expect(run.analysis).toEqual(expect.objectContaining({ status: 'complete' }));
  // Simulate the outer runner's later status save. The reloaded packet must
  // remain complete rather than restoring the stale in-memory running state.
  run.status = 'failed';
  await run.save();
  expect(await SeoSyncRun.findById(run._id).lean())
    .toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'complete' }) }));
});

test('refuses a non-transactional production publication before any write is attempted', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await expect(publishAnalysisWrites({
      siteUrl,
      pages: [],
      recommendations: [],
      evaluatedPageKeys: [],
      querySafePageKeys: new Set(),
      eligibleTypesByPage: new Map(),
      migrationEligibleTypesByPage: new Map(),
      assessmentWrites: [],
      now,
      connection: { client: { topology: { description: { type: 'Single' } } } },
    })).rejects.toMatchObject({ code: 'SEO_ANALYSIS_TRANSACTION_REQUIRED' });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('allows standalone fallback only when the resolved Mongo target is explicitly test', () => {
  const names = [
    'NODE_ENV', 'VERCEL_ENV', 'MONGO_TARGET', 'LOCAL_MONGO_TARGET',
    'MONGO_URL_TEST', 'JEST_WORKER_ID',
  ];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  try {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    delete process.env.MONGO_TARGET;
    process.env.LOCAL_MONGO_TARGET = 'production';
    expect(requiresTransactionalAnalysisPublication()).toBe(true);

    delete process.env.LOCAL_MONGO_TARGET;
    delete process.env.MONGO_URL_TEST;
    delete process.env.JEST_WORKER_ID;
    expect(requiresTransactionalAnalysisPublication()).toBe(true);

    process.env.MONGO_TARGET = 'test';
    expect(requiresTransactionalAnalysisPublication()).toBe(false);
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
