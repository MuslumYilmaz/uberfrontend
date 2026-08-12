'use strict';

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const HASH_C = 'c'.repeat(64);
const HASH_D = 'd'.repeat(64);
const SITE_URL = 'sc-domain:frontendatlas.com';

jest.setTimeout(120000);

let mongoServer;
let SeoAction;
let SeoMetricPartition;
let SeoOpportunityReview;
let SeoPage;
let SeoPageAssessment;
let SeoSyncRun;
let promoteOpportunity;
let upsertPromotedAction;

function promotionPayload() {
  const detectedAt = new Date('2026-08-10T12:00:00.000Z');
  return {
    pageKey: HASH_C,
    canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
    type: 'ctr_snippet',
    state: 'proposed',
    source: 'owner',
    ruleVersion: 'balanced-v2.2',
    queueKind: 'performance',
    summary: 'Reviewed snippet opportunity',
    detectorActive: false,
    lastDetectedAt: detectedAt,
    events: [{
      event: 'owner_promoted_serp_review',
      at: detectedAt,
      actorUserId: null,
      fromState: '',
      toState: 'proposed',
    }],
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri('seo_opportunity_promotion'));
  SeoAction = require('../models/SeoAction');
  SeoMetricPartition = require('../models/SeoMetricPartition');
  SeoOpportunityReview = require('../models/SeoOpportunityReview');
  SeoPage = require('../models/SeoPage');
  SeoPageAssessment = require('../models/SeoPageAssessment');
  SeoSyncRun = require('../models/SeoSyncRun');
  ({ promoteOpportunity, upsertPromotedAction } = require('../services/seo/opportunity-api'));
  await Promise.all([
    SeoAction.init(),
    SeoMetricPartition.init(),
    SeoOpportunityReview.init(),
    SeoPage.init(),
    SeoPageAssessment.init(),
    SeoSyncRun.init(),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

beforeEach(async () => {
  await Promise.all([
    SeoAction.deleteMany({}),
    SeoMetricPartition.deleteMany({}),
    SeoOpportunityReview.deleteMany({}),
    SeoPage.deleteMany({}),
    SeoPageAssessment.deleteMany({}),
    SeoSyncRun.deleteMany({}),
  ]);
});

async function seedPromotableScenario() {
  const evaluatedAt = new Date('2026-08-10T10:00:00.000Z');
  const now = new Date('2026-08-10T12:00:00.000Z');
  const opportunity = {
    key: HASH_A,
    clusterKey: HASH_C,
    safeLabel: 'React · direct answer',
    classification: 'snippet_gap',
    state: 'watch',
    disposition: 'investigate',
    patternConfidence: 0.93,
    causeConfidence: 0.81,
    current: { clicks: 0, impressions: 1000, ctr: 0, position: 5.5 },
    previous: { clicks: 2, impressions: 900, ctr: 2 / 900, position: 5.4 },
    coverage: { query: 0.8, semantic: 0.95, device: 0.75 },
    persistence: { stableWeeks: 3, requiredWeeks: 3, totalWeeks: 4 },
    recommendedSurface: 'serp_review',
    blockers: ['serp_review_required'],
    reviewReady: true,
    expectedImpact: {
      metric: 'clicks', low: 2, point: 4, high: 7, windowDays: 28, quality: 'modeled',
    },
    nextReview: { mode: 'event', event: 'serp_review', rationale: 'owner_review_required' },
  };
  await Promise.all([
    SeoMetricPartition.create({
      siteUrl: SITE_URL,
      date: '2026-08-06',
      slice: 'page',
      activeGeneration: 'generation-a',
      status: 'complete',
      rowCount: 1,
      impressions: 1000,
      truncated: false,
      completedAt: evaluatedAt,
    }),
    SeoPage.create({
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      manifest: { present: true },
      changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
    }),
    SeoPageAssessment.create({
      siteUrl: SITE_URL,
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      inputHash: HASH_B,
      pageVersionKey: HASH_A,
      primaryState: 'watch',
      disposition: 'investigate',
      evaluatedAt,
      decisionGates: ['serp_review_required'],
      ctrBaseline: { quality: 'medium', lower90: 0.02 },
      queryOpportunities: [opportunity],
    }),
    SeoSyncRun.create({
      runId: 'publication-current',
      siteUrl: SITE_URL,
      trigger: 'test',
      status: 'complete',
      startedAt: evaluatedAt,
      completedAt: evaluatedAt,
      expiresAt: new Date('2026-11-08T12:00:00.000Z'),
      analysis: {
        status: 'complete',
        reason: 'analysis_complete',
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-06',
        completedDays: 56,
        requiredDays: 56,
        totalPages: 1,
        evaluatedPages: 1,
        committedAssessmentPages: 1,
        completedAt: evaluatedAt,
      },
    }),
    SeoOpportunityReview.create({
      siteUrl: SITE_URL,
      pageKey: HASH_C,
      assessmentInputHash: HASH_B,
      opportunityKey: HASH_A,
      observedAt: new Date('2026-08-10T11:00:00.000Z'),
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      serpFeatures: ['none'],
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      reasonCode: 'snippet_not_specific',
      createdBy: new mongoose.Types.ObjectId(),
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    }),
  ]);
  return { evaluatedAt, now };
}

function startPausedPromotion(now) {
  let validatedResolve;
  let releaseResolve;
  let firstValidation = true;
  const validated = new Promise((resolve) => { validatedResolve = resolve; });
  const release = new Promise((resolve) => { releaseResolve = resolve; });
  const promotion = promoteOpportunity({
    config: { siteUrl: SITE_URL },
    pageKey: HASH_C,
    opportunityKey: HASH_A,
    assessmentInputHash: HASH_B,
    actorUserId: new mongoose.Types.ObjectId(),
    now,
    beforePromotionWrite: async () => {
      if (!firstValidation) return;
      firstValidation = false;
      validatedResolve();
      await release;
    },
  });
  return { promotion, validated, release: releaseResolve };
}

test('concurrent and repeated promotion requests create one immutable owner action', async () => {
  const promote = () => upsertPromotedAction({
    promotionKey: HASH_A,
    fingerprint: HASH_A,
    payload: promotionPayload(),
  });

  const concurrent = await Promise.all(Array.from({ length: 20 }, promote));
  const ids = new Set(concurrent.map((action) => String(action._id)));

  expect(ids.size).toBe(1);
  expect(await SeoAction.countDocuments({ ownerPromotionKey: HASH_A })).toBe(1);
  let stored = await SeoAction.findOne({ ownerPromotionKey: HASH_A }).lean();
  expect(stored.events).toHaveLength(1);
  expect(stored.state).toBe('proposed');

  await SeoAction.updateOne(
    { _id: stored._id },
    {
      $set: { state: 'dismissed', version: 4, dismissedReason: 'Owner decision' },
      $push: {
        events: {
          event: 'dismiss',
          at: new Date('2026-08-11T08:00:00.000Z'),
          actorUserId: null,
          fromState: 'proposed',
          toState: 'dismissed',
          note: 'Owner decision',
        },
      },
    }
  );

  const repeated = await promote();
  stored = await SeoAction.findById(repeated._id).lean();
  expect(await SeoAction.countDocuments({ ownerPromotionKey: HASH_A })).toBe(1);
  expect(stored).toEqual(expect.objectContaining({
    state: 'dismissed',
    version: 4,
    dismissedReason: 'Owner decision',
  }));
  expect(stored.events.map((event) => event.event)).toEqual([
    'owner_promoted_serp_review',
    'dismiss',
  ]);
});

test('claims current page and review inputs while preserving promotion idempotency', async () => {
  const { now } = await seedPromotableScenario();
  const request = () => promoteOpportunity({
    config: { siteUrl: SITE_URL },
    pageKey: HASH_C,
    opportunityKey: HASH_A,
    assessmentInputHash: HASH_B,
    actorUserId: new mongoose.Types.ObjectId(),
    now,
  });

  const first = await request();
  const repeated = await request();

  expect(first.action.id).toBe(repeated.action.id);
  expect(await SeoAction.countDocuments({})).toBe(1);
  const [page, review] = await Promise.all([
    SeoPage.findOne({ pageKey: HASH_C }).lean(),
    SeoOpportunityReview.findOne({ pageKey: HASH_C, opportunityKey: HASH_A }).lean(),
  ]);
  expect(page.changeTracking.promotionGuardRevision).toBe(2);
  expect(review.promotionGuardRevision).toBe(2);
});

test('rejects promotion when a newer complete publication wins after validation', async () => {
  const evaluatedAt = new Date('2026-08-10T10:00:00.000Z');
  const now = new Date('2026-08-10T12:00:00.000Z');
  const opportunity = {
    key: HASH_A,
    clusterKey: HASH_C,
    safeLabel: 'React · direct answer',
    classification: 'snippet_gap',
    state: 'watch',
    disposition: 'investigate',
    patternConfidence: 0.93,
    causeConfidence: 0.81,
    current: { clicks: 0, impressions: 1000, ctr: 0, position: 5.5 },
    previous: { clicks: 2, impressions: 900, ctr: 2 / 900, position: 5.4 },
    coverage: { query: 0.8, semantic: 0.95, device: 0.75 },
    persistence: { stableWeeks: 3, requiredWeeks: 3, totalWeeks: 4 },
    recommendedSurface: 'serp_review',
    blockers: ['serp_review_required'],
    reviewReady: true,
    expectedImpact: {
      metric: 'clicks', low: 2, point: 4, high: 7, windowDays: 28, quality: 'modeled',
    },
    nextReview: { mode: 'event', event: 'serp_review', rationale: 'owner_review_required' },
  };
  await Promise.all([
    SeoMetricPartition.create({
      siteUrl: SITE_URL,
      date: '2026-08-06',
      slice: 'page',
      activeGeneration: 'generation-a',
      status: 'complete',
      rowCount: 1,
      impressions: 1000,
      truncated: false,
      completedAt: evaluatedAt,
    }),
    SeoPage.create({
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      manifest: { present: true },
      changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
    }),
    SeoPageAssessment.create({
      siteUrl: SITE_URL,
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      inputHash: HASH_B,
      pageVersionKey: HASH_A,
      primaryState: 'watch',
      disposition: 'investigate',
      evaluatedAt,
      decisionGates: ['serp_review_required'],
      ctrBaseline: { quality: 'medium', lower90: 0.02 },
      queryOpportunities: [opportunity],
    }),
    SeoSyncRun.create({
      runId: 'publication-old',
      siteUrl: SITE_URL,
      trigger: 'test',
      status: 'complete',
      startedAt: evaluatedAt,
      completedAt: evaluatedAt,
      expiresAt: new Date('2026-11-08T12:00:00.000Z'),
      analysis: {
        status: 'complete',
        reason: 'analysis_complete',
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-06',
        completedDays: 56,
        requiredDays: 56,
        totalPages: 1,
        evaluatedPages: 1,
        committedAssessmentPages: 1,
        completedAt: evaluatedAt,
      },
    }),
    SeoOpportunityReview.create({
      siteUrl: SITE_URL,
      pageKey: HASH_C,
      assessmentInputHash: HASH_B,
      opportunityKey: HASH_A,
      observedAt: new Date('2026-08-10T11:00:00.000Z'),
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      serpFeatures: ['none'],
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      reasonCode: 'snippet_not_specific',
      createdBy: new mongoose.Types.ObjectId(),
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    }),
  ]);

  let validatedResolve;
  let releaseResolve;
  let firstValidation = true;
  const validated = new Promise((resolve) => { validatedResolve = resolve; });
  const release = new Promise((resolve) => { releaseResolve = resolve; });
  const promotion = promoteOpportunity({
    config: { siteUrl: SITE_URL },
    pageKey: HASH_C,
    opportunityKey: HASH_A,
    assessmentInputHash: HASH_B,
    actorUserId: new mongoose.Types.ObjectId(),
    now,
    beforePromotionWrite: async () => {
      if (!firstValidation) return;
      firstValidation = false;
      validatedResolve();
      await release;
    },
  });

  await validated;
  const publicationSession = await mongoose.connection.startSession();
  try {
    await publicationSession.withTransaction(async () => {
      await SeoPageAssessment.updateOne(
        { siteUrl: SITE_URL, pageKey: HASH_C },
        { $set: { inputHash: HASH_D, evaluatedAt: new Date('2026-08-10T11:30:00.000Z') } },
        { session: publicationSession }
      );
      await SeoPage.updateOne(
        { pageKey: HASH_C },
        { $set: { 'changeTracking.analysisInputHash': HASH_D } },
        { session: publicationSession }
      );
      await SeoSyncRun.create([{
        runId: 'publication-new',
        siteUrl: SITE_URL,
        trigger: 'test',
        status: 'complete',
        startedAt: new Date('2026-08-10T11:30:00.000Z'),
        completedAt: new Date('2026-08-10T11:30:00.000Z'),
        expiresAt: new Date('2026-11-08T12:00:00.000Z'),
        analysis: {
          status: 'complete',
          reason: 'analysis_complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          completedDays: 56,
          requiredDays: 56,
          totalPages: 1,
          evaluatedPages: 1,
          committedAssessmentPages: 1,
          completedAt: new Date('2026-08-10T11:30:00.000Z'),
        },
      }], { session: publicationSession });
    });
  } finally {
    await publicationSession.endSession();
  }
  releaseResolve();

  await expect(promotion).rejects.toEqual(expect.objectContaining({
    status: 409,
    code: 'SEO_OPPORTUNITY_STALE_ASSESSMENT',
  }));
  expect(await SeoAction.countDocuments({})).toBe(0);
});

test('rejects promotion when page-only invalidation wins after validation', async () => {
  const { evaluatedAt, now } = await seedPromotableScenario();
  const paused = startPausedPromotion(now);

  await paused.validated;
  await SeoPage.updateOne(
    { pageKey: HASH_C },
    {
      $set: {
        'changeTracking.analysisInvalidatedAt': new Date(evaluatedAt.getTime() + 60_000),
      },
    }
  );
  paused.release();

  await expect(paused.promotion).rejects.toEqual(expect.objectContaining({
    status: 409,
    code: 'SEO_OPPORTUNITY_STALE_ASSESSMENT',
  }));
  expect(await SeoAction.countDocuments({})).toBe(0);
});

test('rejects promotion when the owner review is revoked after validation', async () => {
  const { now } = await seedPromotableScenario();
  const paused = startPausedPromotion(now);

  await paused.validated;
  await SeoOpportunityReview.updateOne(
    {
      siteUrl: SITE_URL,
      pageKey: HASH_C,
      assessmentInputHash: HASH_B,
      opportunityKey: HASH_A,
    },
    {
      $set: {
        outcome: 'needs_more_evidence',
        observedAt: new Date('2026-08-10T11:30:00.000Z'),
      },
    }
  );
  paused.release();

  await expect(paused.promotion).rejects.toEqual(expect.objectContaining({
    status: 409,
    code: 'SEO_OPPORTUNITY_REVIEW_REQUIRED',
  }));
  expect(await SeoAction.countDocuments({})).toBe(0);
});
