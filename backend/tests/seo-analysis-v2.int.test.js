'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

const SITE_URL = 'sc-domain:frontendatlas.com';
const TARGET_URL = 'https://frontendatlas.com/angular/trivia/angular-http-what-actually-cancels-request';
const END_DATE = '2026-08-03';

let mongoServer;
let SeoAction;
let SeoMetricPartition;
let SeoPage;
let SeoPageAssessment;
let SeoPageDailyMetric;
let SeoQueryPageDailyMetric;
let runBalancedAnalysis;

function shift(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function metricRow({ pageKey, canonicalUrl, date, clicks, impressions, position }) {
  return {
    siteUrl: SITE_URL,
    date,
    pageKey,
    canonicalUrl,
    generation: `page-${date}`,
    clicks,
    impressions,
    position,
    positionNumerator: impressions * position,
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(`${mongoServer.getUri()}balanced_v2_analysis`);
  SeoAction = require('../models/SeoAction');
  SeoMetricPartition = require('../models/SeoMetricPartition');
  SeoPage = require('../models/SeoPage');
  SeoPageAssessment = require('../models/SeoPageAssessment');
  SeoPageDailyMetric = require('../models/SeoPageDailyMetric');
  SeoQueryPageDailyMetric = require('../models/SeoQueryPageDailyMetric');
  ({ runBalancedAnalysis } = require('../services/seo/analysis'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

beforeEach(async () => {
  await Promise.all([
    SeoAction.deleteMany({}),
    SeoMetricPartition.deleteMany({}),
    SeoPage.deleteMany({}),
    SeoPageAssessment.deleteMany({}),
    SeoPageDailyMetric.deleteMany({}),
    SeoQueryPageDailyMetric.deleteMany({}),
  ]);
});

test('persists the target page as observing/low-sample/directional without an action', async () => {
  const { pageKeyForUrl, queryKeyForText } = require('../services/seo/keys');
  const targetKey = pageKeyForUrl(TARGET_URL);
  const previousEnd = shift(END_DATE, -28);
  const previousStart = shift(previousEnd, -27);
  const dates = Array.from({ length: 56 }, (_, index) => shift(previousStart, index));
  const completedAt = new Date('2026-08-07T12:00:00.000Z');
  await SeoMetricPartition.insertMany(dates.flatMap((date) => [
    {
      siteUrl: SITE_URL, date, slice: 'page', activeGeneration: `page-${date}`,
      status: 'complete', rowCount: 10, impressions: 1000, completedAt,
    },
    {
      siteUrl: SITE_URL, date, slice: 'queryPage', activeGeneration: `query-${date}`,
      status: 'complete', rowCount: 3, impressions: 100, completedAt,
    },
  ]));

  const peers = Array.from({ length: 9 }, (_, index) => ({
    pageKey: `peer-${index + 1}`,
    canonicalUrl: `https://frontendatlas.com/angular/trivia/peer-${index + 1}`,
    family: 'trivia',
    tech: 'angular',
    indexable: true,
    firstSeenAt: new Date('2025-01-01T00:00:00.000Z'),
    manifest: { present: true },
    intent: { confirmed: false, source: 'derived' },
  }));
  await SeoPage.insertMany([
    {
      pageKey: targetKey,
      canonicalUrl: TARGET_URL,
      family: 'trivia',
      tech: 'angular',
      indexable: true,
      title: 'What Actually Cancels an Angular HttpClient Request?',
      h1: 'What Actually Cancels an Angular HttpClient Request?',
      firstSeenAt: new Date('2025-01-01T00:00:00.000Z'),
      manifest: { present: true },
      intent: {
        confirmed: false,
        source: 'derived',
        targetKeyword: 'angular httpclient cancel request',
        intendedIntent: 'Explain what cancels an Angular HttpClient request',
        readerPromise: 'Distinguish unsubscribe, abort, and teardown behavior',
      },
      changeTracking: {
        materialHash: 'target-hash',
        materialChangedAt: new Date('2026-08-03T00:00:00.000Z'),
        materialChangeKind: 'content',
        changedFields: ['contentUpdatedAt'],
        lastInspectionAt: new Date('2026-08-07T00:00:00.000Z'),
        lastGoogleCrawlAt: new Date('2026-08-04T08:09:35.000Z'),
        crawlConfirmationRequired: false,
      },
    },
    ...peers,
  ]);

  await SeoPageDailyMetric.insertMany([
    metricRow({ pageKey: targetKey, canonicalUrl: TARGET_URL, date: previousEnd, clicks: 6, impressions: 3156, position: 6.68 }),
    metricRow({ pageKey: targetKey, canonicalUrl: TARGET_URL, date: END_DATE, clicks: 3, impressions: 2519, position: 6.65 }),
    ...peers.map((peer, index) => metricRow({
      pageKey: peer.pageKey,
      canonicalUrl: peer.canonicalUrl,
      date: END_DATE,
      clicks: index === 0 ? 2 : 1,
      impressions: index === 0 ? 1041 : 1044,
      position: 7,
    })),
  ]);

  const queryRows = [
    { query: 'angular httpclient unsubscribe docs', clicks: 0, impressions: 469, position: 6.7 },
    { query: 'does angular httpclient unsubscribe cancel request', clicks: 3, impressions: 262, position: 4.9 },
    { query: 'how to abort angular http request', clicks: 0, impressions: 18, position: 5 },
  ];
  await SeoQueryPageDailyMetric.insertMany(queryRows.map((row) => ({
    siteUrl: SITE_URL,
    date: END_DATE,
    pageKey: targetKey,
    queryKey: queryKeyForText(row.query),
    query: row.query,
    segment: 'nonbrand',
    generation: `query-${END_DATE}`,
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
    positionNumerator: row.position * row.impressions,
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
  })));
  await SeoQueryPageDailyMetric.insertMany([
    {
      siteUrl: SITE_URL,
      date: previousEnd,
      pageKey: targetKey,
      queryKey: queryKeyForText('angular http request cancellation official documentation'),
      query: 'angular http request cancellation official documentation',
      segment: 'nonbrand',
      generation: `query-${previousEnd}`,
      clicks: 6,
      impressions: 800,
      position: 6.68,
      positionNumerator: 800 * 6.68,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    },
  ]);

  const result = await runBalancedAnalysis({
    siteUrl: SITE_URL,
    endDate: END_DATE,
    now: new Date('2026-08-07T12:00:00.000Z'),
  });

  expect(result).toEqual(expect.objectContaining({
    status: 'complete',
    ruleVersion: 'balanced-v2.1',
    evaluatedPages: 10,
    totalPages: 10,
    eligiblePages: 9,
    proposedActions: 0,
    cooldown: expect.objectContaining({ observing: 1, eligible: 9 }),
  }));
  const assessment = await SeoPageAssessment.findOne({ siteUrl: SITE_URL, pageKey: targetKey }).lean();
  expect(assessment).toEqual(expect.objectContaining({
    primaryState: 'watch',
    evidenceLevel: 'directional',
    nextReviewDate: new Date('2026-09-04T00:00:00.000Z'),
  }));
  expect(assessment.cooldown).toEqual(expect.objectContaining({ state: 'observing', cleanFinalizedDays: 0 }));
  expect(assessment.coverage.query).toBeCloseTo(749 / 2519);
  expect(assessment.detectorAssessments.content_decay.reasonCodes).toContain('low_sample');
  expect(assessment.detectorAssessments.content_decay.evidence).toEqual(expect.objectContaining({
    current: expect.objectContaining({ clicks: 3, impressions: 2519 }),
    previous: expect.objectContaining({ clicks: 6, impressions: 3156 }),
    lostClicks: 3,
    currentWilson90: expect.objectContaining({ low: expect.any(Number), high: expect.any(Number) }),
    previousWilson90: expect.objectContaining({ low: expect.any(Number), high: expect.any(Number) }),
  }));
  expect(assessment.detectorAssessments.intent_mismatch.reasonCodes).toEqual(expect.arrayContaining([
    'intent_not_confirmed', 'source_preference', 'topic_aligned_visible_subset', 'query_coverage_below_threshold',
  ]));
  expect(assessment.detectorAssessments.intent_mismatch.evidence).toEqual(expect.objectContaining({
    queryCoverage: expect.closeTo(749 / 2519),
    semanticCoverage: expect.any(Number),
    dominantCluster: expect.objectContaining({
      dominantFacet: 'official_reference',
      visibleShare: expect.any(Number),
      fullPageLowerBoundShare: expect.any(Number),
      topicAlignment: expect.any(Number),
      sourcePreferenceShare: expect.closeTo(469 / 749),
    }),
  }));
  expect(assessment.detectorAssessments.intent_mismatch.evidence.dominantCluster).not.toHaveProperty('label');
  expect(assessment.detectorAssessments.ctr_snippet.evidence.baseline).toEqual(expect.objectContaining({
    quality: 'insufficient', peerPageCount: 9, peerClicks: 10, peerImpressions: 9393,
  }));
  expect(assessment.ctrBaseline).toEqual(expect.objectContaining({
    quality: 'insufficient', peerPageCount: 9, peerClicks: 10, peerImpressions: 9393,
  }));
  expect(assessment.semanticClusters[0].sourcePreferenceShare).toBeCloseTo(469 / 749);
  expect(await SeoAction.countDocuments({ pageKey: targetKey })).toBe(0);
  expect(JSON.stringify(assessment)).not.toContain('does angular httpclient unsubscribe cancel request');
});
