'use strict';

const SeoAction = require('../../models/SeoAction');
const SeoDiagnosticSnapshot = require('../../models/SeoDiagnosticSnapshot');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoPage = require('../../models/SeoPage');
const SeoPageAssessment = require('../../models/SeoPageAssessment');
const SeoPageDailyMetric = require('../../models/SeoPageDailyMetric');
const SeoPageDeviceDailyMetric = require('../../models/SeoPageDeviceDailyMetric');
const SeoPropertyDailyMetric = require('../../models/SeoPropertyDailyMetric');
const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
const SeoSyncRun = require('../../models/SeoSyncRun');
const { resolveMongoTarget } = require('../../config/mongo');
const { DAY_MS, dateKeyInTimezone, shiftDateKey } = require('./dates');
const { activeMetricPipeline } = require('./metrics-store');

const BALANCED_ANALYSIS_WINDOW_DAYS = 28;
const BALANCED_ANALYSIS_REQUIRED_DAYS = BALANCED_ANALYSIS_WINDOW_DAYS * 2;
const {
  RULE_VERSION,
  MIN_QUERY_COVERAGE,
  MIN_SEMANTIC_COVERAGE,
  applyCooldown,
  assessCtrBaselineQuality,
  evaluatePageDetectors,
  isKnownReasonCode,
  reasonSummaryForCode,
  ratio,
  tokenOverlap,
} = require('./rule-engine');
const { reconcileDetectorRecommendations, upsertRecommendations } = require('./actions');
const {
  aggregateCooldown,
  cooldownsForPage,
  eligibleTypesForCooldown,
  primaryAction,
  synthesizePageAssessment,
} = require('./assessment');
const { analysisInputHashForPage } = require('./manifest');
const { captureLiveMetadataSnapshot, compareMetadataSnapshots } = require('./diagnostics');
const {
  buildSemanticClusters,
  DEFAULT_MAX_QUERIES,
  SEMANTIC_CLUSTER_VERSION,
} = require('./semantic-clustering');
const { buildQueryOpportunities } = require('./query-opportunities');
const {
  assessVisibilityInterruption,
  currentInspectionEvidence,
} = require('./visibility-interruption');
const SEMANTIC_QUERY_CAP = DEFAULT_MAX_QUERIES;

function positionBucket(position) {
  if (position <= 3) return '1-3';
  if (position <= 5) return '4-5';
  if (position <= 10) return '6-10';
  if (position <= 20) return '11-20';
  return '21+';
}

function metricFromRow(row = {}) {
  const impressions = Number(row.impressions || 0);
  return {
    clicks: Number(row.clicks || 0),
    impressions,
    position: impressions > 0 ? Number(row.positionNumerator || 0) / impressions : 0,
  };
}

async function pageWindowMetrics({ siteUrl, currentStart, currentEnd, previousStart, previousEnd }) {
  const rows = await SeoPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'page',
    match: { siteUrl, date: { $gte: previousStart, $lte: currentEnd } },
    afterLookup: [
      {
        $group: {
          _id: '$pageKey',
          currentClicks: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$clicks', 0] } },
          currentImpressions: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$impressions', 0] } },
          currentPositionNumerator: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$positionNumerator', 0] } },
          previousClicks: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$clicks', 0] } },
          previousImpressions: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$impressions', 0] } },
          previousPositionNumerator: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$positionNumerator', 0] } },
        },
      },
    ],
  }));
  return new Map(rows.map((row) => [row._id, {
    current: metricFromRow({
      clicks: row.currentClicks,
      impressions: row.currentImpressions,
      positionNumerator: row.currentPositionNumerator,
    }),
    previous: metricFromRow({
      clicks: row.previousClicks,
      impressions: row.previousImpressions,
      positionNumerator: row.previousPositionNumerator,
    }),
  }]));
}

function dateOrdinal(dateKey) {
  const value = Date.parse(`${dateKey}T00:00:00.000Z`);
  return Number.isFinite(value) ? Math.floor(value / DAY_MS) : 0;
}

function weeklyMetricRows(rows, startDate) {
  const start = dateOrdinal(startDate);
  const buckets = Array.from({ length: 4 }, () => ({ clicks: 0, impressions: 0, positionNumerator: 0 }));
  for (const row of rows || []) {
    const index = Math.floor((dateOrdinal(row.date) - start) / 7);
    if (index < 0 || index >= buckets.length) continue;
    buckets[index].clicks += Number(row.clicks || 0);
    buckets[index].impressions += Number(row.impressions || 0);
    buckets[index].positionNumerator += Number(row.positionNumerator || 0);
  }
  return buckets.map(metricFromRow);
}

async function pageDailyWindows({ siteUrl, currentStart, currentEnd, previousStart }) {
  const aggregate = SeoPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'page',
    match: { siteUrl, date: { $gte: previousStart, $lte: currentEnd } },
    afterLookup: [
      {
        $project: {
          _id: 0,
          pageKey: 1,
          date: 1,
          clicks: 1,
          impressions: 1,
          positionNumerator: 1,
        },
      },
      { $sort: { pageKey: 1, date: 1 } },
    ],
  }));
  if (typeof aggregate.option === 'function') aggregate.option({ maxTimeMS: 10_000 });
  const rows = typeof aggregate.exec === 'function' ? await aggregate.exec() : await aggregate;
  const byPage = new Map();
  for (const row of rows) {
    const pageRows = byPage.get(row.pageKey) || [];
    pageRows.push(row);
    byPage.set(row.pageKey, pageRows);
  }
  return new Map(Array.from(byPage, ([pageKey, pageRows]) => [pageKey, {
    current: weeklyMetricRows(pageRows, currentStart),
    previous: weeklyMetricRows(pageRows, previousStart),
  }]));
}

async function queryWindowRowsByPage({ siteUrl, currentStart, currentEnd, previousStart, previousEnd }) {
  const weekRanges = Array.from({ length: 4 }, (_, index) => ({
    start: shiftDateKey(currentStart, index * 7),
    end: shiftDateKey(currentStart, index * 7 + 6),
  }));
  const aggregate = SeoQueryPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'queryPage',
    match: { siteUrl, date: { $gte: previousStart, $lte: currentEnd } },
    afterLookup: [
      {
        $group: {
          _id: { pageKey: '$pageKey', queryKey: '$queryKey', query: '$query' },
          currentClicks: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$clicks', 0] } },
          currentImpressions: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$impressions', 0] } },
          currentPositionNumerator: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$positionNumerator', 0] } },
          currentWeek0Clicks: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[0].start] }, { $lte: ['$date', weekRanges[0].end] }] }, '$clicks', 0] } },
          currentWeek0Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[0].start] }, { $lte: ['$date', weekRanges[0].end] }] }, '$impressions', 0] } },
          currentWeek0PositionNumerator: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[0].start] }, { $lte: ['$date', weekRanges[0].end] }] }, '$positionNumerator', 0] } },
          currentWeek1Clicks: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[1].start] }, { $lte: ['$date', weekRanges[1].end] }] }, '$clicks', 0] } },
          currentWeek1Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[1].start] }, { $lte: ['$date', weekRanges[1].end] }] }, '$impressions', 0] } },
          currentWeek1PositionNumerator: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[1].start] }, { $lte: ['$date', weekRanges[1].end] }] }, '$positionNumerator', 0] } },
          currentWeek2Clicks: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[2].start] }, { $lte: ['$date', weekRanges[2].end] }] }, '$clicks', 0] } },
          currentWeek2Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[2].start] }, { $lte: ['$date', weekRanges[2].end] }] }, '$impressions', 0] } },
          currentWeek2PositionNumerator: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[2].start] }, { $lte: ['$date', weekRanges[2].end] }] }, '$positionNumerator', 0] } },
          currentWeek3Clicks: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[3].start] }, { $lte: ['$date', weekRanges[3].end] }] }, '$clicks', 0] } },
          currentWeek3Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[3].start] }, { $lte: ['$date', weekRanges[3].end] }] }, '$impressions', 0] } },
          currentWeek3PositionNumerator: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[3].start] }, { $lte: ['$date', weekRanges[3].end] }] }, '$positionNumerator', 0] } },
          previousClicks: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$clicks', 0] } },
          previousImpressions: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$impressions', 0] } },
          previousPositionNumerator: { $sum: { $cond: [{ $lte: ['$date', previousEnd] }, '$positionNumerator', 0] } },
        },
      },
      { $sort: { '_id.pageKey': 1, currentImpressions: -1, previousImpressions: -1 } },
    ],
  }));
  if (typeof aggregate.allowDiskUse === 'function') aggregate.allowDiskUse(true);
  if (typeof aggregate.option === 'function') aggregate.option({ maxTimeMS: 15_000 });
  const rows = typeof aggregate.exec === 'function' ? await aggregate.exec() : await aggregate;
  const byPage = new Map();
  for (const row of rows) {
    const value = byPage.get(row._id.pageKey) || { currentRows: [], previousRows: [] };
    if (Number(row.currentImpressions || 0) > 0) {
      value.currentRows.push({
        queryKey: row._id.queryKey,
        query: row._id.query,
        clicks: Number(row.currentClicks || 0),
        impressions: Number(row.currentImpressions || 0),
        positionNumerator: Number(row.currentPositionNumerator || 0),
        weeklyImpressions: [0, 1, 2, 3].map((index) => Number(row[`currentWeek${index}Impressions`] || 0)),
        weekly: [0, 1, 2, 3].map((index) => metricFromRow({
          clicks: row[`currentWeek${index}Clicks`],
          impressions: row[`currentWeek${index}Impressions`],
          positionNumerator: row[`currentWeek${index}PositionNumerator`],
        })),
      });
    }
    if (Number(row.previousImpressions || 0) > 0) {
      value.previousRows.push({
        queryKey: row._id.queryKey,
        query: row._id.query,
        clicks: Number(row.previousClicks || 0),
        impressions: Number(row.previousImpressions || 0),
        positionNumerator: Number(row.previousPositionNumerator || 0),
      });
    }
    byPage.set(row._id.pageKey, value);
  }
  return byPage;
}

function semanticClustersWithWeekly(semantic = {}, queryRows = {}) {
  const byQueryKey = new Map((queryRows.currentRows || []).map((row) => [row.queryKey, row]));
  return {
    ...semantic,
    clusters: (semantic.clusters || []).map((cluster) => {
      const weekly = Array.from({ length: 4 }, () => ({ clicks: 0, impressions: 0, positionNumerator: 0 }));
      for (const queryKey of cluster.memberQueryKeys || []) {
        const row = byQueryKey.get(queryKey);
        for (let index = 0; index < weekly.length; index += 1) {
          const metric = row?.weekly?.[index] || {};
          weekly[index].clicks += Number(metric.clicks || 0);
          weekly[index].impressions += Number(metric.impressions || 0);
          weekly[index].positionNumerator += Number(metric.position || 0) * Number(metric.impressions || 0);
        }
      }
      return { ...cluster, weekly: weekly.map(metricFromRow) };
    }),
  };
}

function buildCtrBaselines(metrics) {
  const buckets = new Map();
  for (const value of metrics.values()) {
    const current = value.current;
    if (current.impressions < 100 || current.position <= 0) continue;
    const key = positionBucket(current.position);
    const aggregate = buckets.get(key) || { clicks: 0, impressions: 0 };
    aggregate.clicks += current.clicks;
    aggregate.impressions += current.impressions;
    buckets.set(key, aggregate);
  }
  return new Map(Array.from(buckets, ([key, value]) => [key, ratio(value.clicks, value.impressions)]));
}

function ctrBaselineForPage(metrics, buckets, pageKey) {
  const own = metrics.get(pageKey)?.current;
  if (!own?.impressions) return 0;
  const aggregate = buckets.get(positionBucket(own.position));
  if (!aggregate) return 0;
  const impressions = aggregate.impressions - own.impressions;
  const clicks = aggregate.clicks - own.clicks;
  return impressions >= 300 ? ratio(clicks, impressions) : 0;
}

function baselineAggregate(peers) {
  const aggregate = (peers || []).reduce((value, peer) => {
    value.peerPageCount += 1;
    value.peerClicks += Number(peer.current?.clicks || 0);
    value.peerImpressions += Number(peer.current?.impressions || 0);
    if (Number(peer.current?.clicks || 0) === 0) value.zeroClickPeers += 1;
    return value;
  }, { peerPageCount: 0, peerClicks: 0, peerImpressions: 0, zeroClickPeers: 0 });
  return {
    ...aggregate,
    ctr: ratio(aggregate.peerClicks, aggregate.peerImpressions),
    zeroClickPeerShare: ratio(aggregate.zeroClickPeers, aggregate.peerPageCount),
  };
}

function baselineMeetsMinimum(value) {
  return value.peerPageCount >= 10 && value.peerClicks >= 25 && value.peerImpressions >= 3_000;
}

function ctrPeerBaselineForPage({ page, pages, metrics }) {
  const own = metrics.get(page.pageKey)?.current;
  if (!own || own.impressions <= 0 || own.position <= 0) {
    return assessCtrBaselineQuality({
      ctr: 0,
      cohort: 'unavailable',
      peerPageCount: 0,
      peerClicks: 0,
      peerImpressions: 0,
      zeroClickPeerShare: 0,
    });
  }
  const bucket = positionBucket(own.position);
  const candidates = (pages || []).filter((candidate) => {
    const current = metrics.get(candidate.pageKey)?.current;
    return candidate.pageKey !== page.pageKey
      && current?.impressions > 0
      && current.position > 0
      && positionBucket(current.position) === bucket;
  });
  const definitions = [
    {
      cohort: 'family+tech+position',
      peers: candidates.filter((candidate) => (candidate.family || 'unknown') === (page.family || 'unknown')
        && (candidate.tech || '') === (page.tech || '')),
    },
    {
      cohort: 'family+position',
      peers: candidates.filter((candidate) => (candidate.family || 'unknown') === (page.family || 'unknown')),
    },
    { cohort: 'site+position', peers: candidates },
  ];
  let selected = null;
  for (const definition of definitions) {
    const aggregate = {
      cohort: definition.cohort,
      ...baselineAggregate(definition.peers.map((candidate) => metrics.get(candidate.pageKey))),
    };
    selected = aggregate;
    if (baselineMeetsMinimum(aggregate)) break;
  }
  return assessCtrBaselineQuality(selected || {
    ctr: 0,
    cohort: 'site+position',
    peerPageCount: 0,
    peerClicks: 0,
    peerImpressions: 0,
    zeroClickPeerShare: 0,
  });
}

async function hasContiguousPartitions({ siteUrl, startDate, endDate, slice }) {
  const dates = await SeoMetricPartition.distinct('date', {
    siteUrl,
    slice,
    date: { $gte: startDate, $lte: endDate },
    status: 'complete',
    truncated: { $ne: true },
  });
  const expected = [];
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) expected.push(date);
  const found = new Set(dates);
  return expected.every((date) => found.has(date));
}

async function contiguousPartitionDays({ siteUrl, endDate, slice, maximumDays }) {
  const startDate = shiftDateKey(endDate, -(maximumDays - 1));
  const dates = await SeoMetricPartition.distinct('date', {
    siteUrl,
    slice,
    date: { $gte: startDate, $lte: endDate },
    status: 'complete',
    truncated: { $ne: true },
  });
  const found = new Set(dates);
  let completedDays = 0;
  for (let date = endDate; completedDays < maximumDays; date = shiftDateKey(date, -1)) {
    if (!found.has(date)) break;
    completedDays += 1;
  }
  return completedDays;
}

function dateKeys(startDate, endDate) {
  const dates = [];
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) dates.push(date);
  return dates;
}

async function completePartitionDates({ siteUrl, startDate, endDate, slices }) {
  const rows = await SeoMetricPartition.find({
    siteUrl,
    slice: { $in: slices },
    date: { $gte: startDate, $lte: endDate },
    status: 'complete',
    truncated: { $ne: true },
  }).select('date slice').lean();
  const bySlice = new Map((slices || []).map((slice) => [slice, new Set()]));
  for (const row of rows) bySlice.get(row.slice)?.add(row.date);
  return bySlice;
}

async function visibilityEvidenceByPage({
  siteUrl,
  pages,
  previousStart,
  currentStart,
  endDate,
  evaluatedAt,
  inspectionByPage = new Map(),
  priorVisibilityByPage = new Map(),
}) {
  const [partitions, pageRows, propertyRows] = await Promise.all([
    completePartitionDates({ siteUrl, startDate: previousStart, endDate, slices: ['page', 'property'] }),
    SeoPageDailyMetric.aggregate(activeMetricPipeline({
      slice: 'page',
      match: { siteUrl, date: { $gte: previousStart, $lte: endDate } },
      afterLookup: [{
        $project: { _id: 0, pageKey: 1, date: 1, impressions: 1 },
      }],
    })),
    SeoPropertyDailyMetric.aggregate(activeMetricPipeline({
      slice: 'property',
      match: { siteUrl, date: { $gte: previousStart, $lte: endDate } },
      afterLookup: [{
        $project: { _id: 0, date: 1, impressions: 1 },
      }],
    })),
  ]);
  const pagePartitions = partitions.get('page') || new Set();
  const propertyPartitions = partitions.get('property') || new Set();
  const pageByDate = new Map();
  for (const row of pageRows) {
    pageByDate.set(`${row.pageKey}|${row.date}`, Number(row.impressions || 0));
  }
  const propertyByDate = new Map(propertyRows.map((row) => [row.date, Number(row.impressions || 0)]));
  const dates = dateKeys(previousStart, endDate);
  return new Map((pages || []).map((page) => {
    const days = dates.map((date) => ({
      date,
      pageImpressions: pageByDate.get(`${page.pageKey}|${date}`) || 0,
      propertyImpressions: propertyByDate.get(date) || 0,
      pagePartitionComplete: pagePartitions.has(date),
      propertyPartitionComplete: propertyPartitions.has(date),
    }));
    const priorAssessment = priorVisibilityByPage.get(page.pageKey) || null;
    const assessment = assessVisibilityInterruption({
      days,
      previousStart,
      currentStart,
      endDate,
      requiredWindowDays: BALANCED_ANALYSIS_WINDOW_DAYS,
      inspection: inspectionByPage.get(page.pageKey) || null,
      currentVersionKey: page.changeTracking?.currentVersionKey || '',
      productionEffectiveAt: page.changeTracking?.production?.effectiveAt || null,
      previousInterruptionEvaluatedAt: priorAssessment?.evaluatedAt || null,
      previousVisibility: priorAssessment?.visibility || null,
      evaluatedAt,
    });
    const evidence = assessment.evidence || {};
    return [page.pageKey, {
      ...assessment,
      assessment,
      firstVisibleDate: evidence.firstVisibleDate || null,
      // Keep unavailable distinct from an observed immature page. A missing
      // property partition must withhold interruption analysis, but it must
      // not relabel an otherwise established page as newly launched.
      mature: typeof evidence.mature === 'boolean' ? evidence.mature : null,
      zeroImpressionStreak: Number(evidence.zeroImpressionStreak || 0),
      current: {
        clicks: 0,
        impressions: Number(evidence.current?.pageImpressions || 0),
        position: 0,
      },
      previous: {
        clicks: 0,
        impressions: Number(evidence.previous?.pageImpressions || 0),
        position: 0,
      },
    }];
  }));
}

async function deviceCoverageByPage({ siteUrl, pages, currentStart, endDate, metrics }) {
  const complete = await hasContiguousPartitions({
    siteUrl,
    startDate: currentStart,
    endDate,
    slice: 'devicePage',
  });
  if (!complete) return new Map((pages || []).map((page) => [page.pageKey, null]));
  const rows = await SeoPageDeviceDailyMetric.aggregate(activeMetricPipeline({
    slice: 'devicePage',
    match: { siteUrl, date: { $gte: currentStart, $lte: endDate } },
    afterLookup: [{ $group: { _id: '$pageKey', impressions: { $sum: '$impressions' } } }],
  }));
  const detailByPage = new Map(rows.map((row) => [row._id, Number(row.impressions || 0)]));
  return new Map((pages || []).map((page) => {
    const pageImpressions = Number(metrics.get(page.pageKey)?.current?.impressions || 0);
    const detailImpressions = Number(detailByPage.get(page.pageKey) || 0);
    return [page.pageKey, subsetCoverage(detailImpressions, pageImpressions)];
  }));
}

function subsetCoverage(subsetImpressions, authoritativeImpressions) {
  const denominator = Number(authoritativeImpressions);
  const numerator = Number(subsetImpressions);
  // A zero denominator is unavailable, not 100% coverage. Keeping those
  // states separate prevents an empty page window from becoming supporting
  // query or device evidence.
  if (!Number.isFinite(denominator) || denominator <= 0 || !Number.isFinite(numerator) || numerator < 0) {
    return null;
  }
  const coverage = numerator / denominator;
  return coverage > 1.000001 ? null : Math.max(0, coverage);
}

function temporalGateForPage(page, endDate, currentStart = shiftDateKey(endDate, -27)) {
  const tracking = page?.changeTracking || {};
  const eventReview = (event, rationale) => ({ mode: 'event', event, rationale });
  if (!tracking.currentVersionKey) {
    return {
      eligible: false,
      reason: 'production_timing_unverified',
      nextReview: eventReview('post_deploy_crawl', 'production_timing_unverified'),
    };
  }
  const production = tracking.production || {};
  const effectiveAt = production.effectiveAt ? new Date(production.effectiveAt) : null;
  const precision = String(production.precision || 'unknown');
  if (!effectiveAt || Number.isNaN(effectiveAt.getTime()) || precision === 'unknown') {
    return {
      eligible: false,
      reason: 'production_timing_unverified',
      nextReview: eventReview('post_deploy_crawl', 'production_timing_unverified'),
    };
  }
  const productionDate = dateKeyInTimezone(effectiveAt, 'America/Los_Angeles');
  const crawlAt = tracking.lastGoogleCrawlAt ? new Date(tracking.lastGoogleCrawlAt) : null;
  if (!crawlAt || Number.isNaN(crawlAt.getTime()) || crawlAt <= effectiveAt) {
    return {
      eligible: false,
      reason: 'post_deploy_crawl_required',
      productionDate,
      nextReview: eventReview('post_deploy_crawl', 'post_deploy_crawl_required'),
    };
  }
  const crawlDate = dateKeyInTimezone(crawlAt, 'America/Los_Angeles');
  // Every day in the decision window must follow the crawl that can first
  // prove Google saw this production version. A partial post-crawl window is
  // useful for monitoring, but not for causal performance changes.
  if (endDate < productionDate || !currentStart || currentStart <= crawlDate) {
    return {
      eligible: false,
      reason: 'performance_window_precedes_production',
      productionDate,
      crawlDate,
      nextReview: eventReview('28_finalized_days', 'await_full_post_crawl_window'),
    };
  }
  return { eligible: true, reason: null, productionDate, crawlDate, nextReview: null };
}

function pageSemanticText(page = {}) {
  return [
    page.intent?.targetKeyword,
    page.intent?.intendedIntent,
    page.intent?.readerPromise,
    page.title,
    page.h1,
  ].filter(Boolean).join(' ');
}

function internalLinkEvidenceForPage({ page, pages, metrics, visibilityByPage, endDate }) {
  const own = metrics.get(page.pageKey)?.current || metricFromRow();
  const peers = (pages || []).filter((candidate) => {
    const current = metrics.get(candidate.pageKey)?.current;
    const visibility = visibilityByPage.get(candidate.pageKey);
    return candidate.pageKey !== page.pageKey
      && candidate.indexable !== false
      && (candidate.family || 'unknown') === (page.family || 'unknown')
      && (candidate.tech || '') === (page.tech || '')
      && current?.impressions > 0
      && current.position > 0
      && positionBucket(current.position) === positionBucket(own.position)
      && visibility?.evidence?.mature === true
      && visibility?.interrupted !== true;
  });
  const inbound = peers
    .map((candidate) => Number(candidate.internalLinks?.inboundCount || 0))
    .sort((left, right) => left - right);
  const cohortP25 = inbound.length
    ? inbound[Math.floor(Math.max(0, inbound.length - 1) * 0.25)]
    : 0;
  const linked = new Set(page.internalLinks?.sourcePageKeys || []);
  const donorKeys = new Set(page.internalLinks?.donorPageKeys || []);
  const targetText = pageSemanticText(page);
  const qualifiedDonors = (pages || []).flatMap((candidate) => {
    if (!donorKeys.has(candidate.pageKey) || linked.has(candidate.pageKey)) return [];
    const current = metrics.get(candidate.pageKey)?.current;
    const visibility = visibilityByPage.get(candidate.pageKey);
    const candidateCooldown = cooldownsForPage({ page: candidate, endDate })?.internal_link;
    const candidateTemporalGate = temporalGateForPage(candidate, endDate);
    if (
      candidate.indexable === false
      || !current?.impressions
      || visibility?.interrupted === true
      || candidateCooldown?.state !== 'eligible'
      || candidateTemporalGate.eligible !== true
    ) return [];
    const overlap = tokenOverlap(targetText, pageSemanticText(candidate));
    if (overlap < 0.35) return [];
    const sameTech = Boolean(page.tech && candidate.tech === page.tech);
    const sameFamily = Boolean(page.family && candidate.family === page.family);
    const relevanceScore = Math.min(1, overlap * 0.65 + Number(sameTech) * 0.2 + Number(sameFamily) * 0.15);
    if (relevanceScore < 0.35) return [];
    const reasonCodes = [
      overlap >= 0.35 ? 'semantic_overlap' : null,
      sameTech ? 'same_technology' : null,
      sameFamily ? 'same_page_family' : null,
      'visible_donor',
      'not_currently_linked',
    ].filter(Boolean);
    return [{
      title: String(candidate.title || candidate.h1 || 'Relevant page').slice(0, 300),
      canonicalUrl: String(candidate.canonicalUrl || '').slice(0, 2048),
      relevanceScore,
      reasonCodes,
      anchorDirection: `Use a natural contextual anchor from this page toward “${String(page.title || page.h1 || 'the target page').slice(0, 160)}”.`,
    }];
  }).sort((left, right) => right.relevanceScore - left.relevanceScore).slice(0, 10);
  return {
    inboundCount: Number(page.internalLinks?.inboundCount || 0),
    cohortP25,
    peerCount: peers.length,
    qualifiedDonors,
  };
}

function safeSemanticCluster(cluster = {}) {
  const facet = String(cluster.dominantFacet || 'other');
  const tech = String(cluster.tech || '').slice(0, 80);
  return {
    clusterKey: cluster.clusterKey,
    safeLabel: [tech, facet.replace(/_/g, ' ')].filter(Boolean).join(' · '),
    tech,
    dominantFacet: facet,
    current: cluster.current || {},
    previous: cluster.previous || {},
    topicAlignment: Number(cluster.topicAlignment || 0),
    sourcePreferenceShare: Number(cluster.sourcePreferenceShare || 0),
    facets: Array.isArray(cluster.facets) ? cluster.facets.map((value) => ({
      facet: String(value.facet || 'other'),
      current: {
        clicks: Number(value.current?.clicks || 0),
        impressions: Number(value.current?.impressions || 0),
      },
      previous: {
        clicks: Number(value.previous?.clicks || 0),
        impressions: Number(value.previous?.impressions || 0),
      },
    })).slice(0, 7) : [],
  };
}

function semanticCannibalizationByPage(semanticByPage, queryRowsByPage = new Map()) {
  const byCluster = new Map();
  for (const [pageKey, semantic] of semanticByPage) {
    const queryCoverage = Number(semantic?.pageQueryCoverage?.current || 0);
    const semanticCoverage = Number(semantic?.currentSemanticCoverage || semantic?.semanticCoverage || 0);
    const coverageSafe = semantic?.pageQueryCoverage?.currentStatus === 'consistent'
      && queryCoverage >= MIN_QUERY_COVERAGE
      && semanticCoverage >= MIN_SEMANTIC_COVERAGE;
    const rowsByQueryKey = new Map((queryRowsByPage.get(pageKey)?.currentRows || [])
      .map((row) => [row.queryKey, row]));
    for (const cluster of semantic?.clusters || []) {
      const impressions = Number(cluster.current?.impressions || 0);
      if (!cluster.clusterKey || impressions <= 0) continue;
      const weeks = [0, 0, 0, 0];
      for (const queryKey of cluster.memberQueryKeys || []) {
        const row = rowsByQueryKey.get(queryKey);
        for (let index = 0; index < weeks.length; index += 1) {
          weeks[index] += Number(row?.weeklyImpressions?.[index] || 0);
        }
      }
      const rows = byCluster.get(cluster.clusterKey) || [];
      rows.push({ pageKey, impressions, weeks, coverageSafe });
      byCluster.set(cluster.clusterKey, rows);
    }
  }
  const signals = new Map();
  const setSignal = (pageKey, signal) => {
    const existing = signals.get(pageKey);
    const newIsSaferToSuppress = Boolean(signal.coverageUnsafe) && !existing?.coverageUnsafe;
    const sameSafetyWithMoreEvidence = Boolean(signal.coverageUnsafe) === Boolean(existing?.coverageUnsafe)
      && Number(signal.clusterImpressions || 0) > Number(existing?.clusterImpressions || 0);
    if (!existing || newIsSaferToSuppress || sameSafetyWithMoreEvidence) signals.set(pageKey, signal);
  };
  for (const [clusterKey, rows] of byCluster) {
    const ranked = rows.sort((left, right) => right.impressions - left.impressions || left.pageKey.localeCompare(right.pageKey));
    if (ranked.length < 2) continue;
    const clusterImpressions = ranked[0].impressions + ranked[1].impressions;
    const secondUrlImpressionShare = ratio(ranked[1].impressions, clusterImpressions);
    if (!ranked[0].coverageSafe || !ranked[1].coverageSafe) {
      const unsafeSignal = {
        clusterKey,
        secondPageKey: ranked[1].pageKey,
        clusterImpressions,
        secondUrlImpressionShare,
        alternatingWeeks: 0,
        semantic: true,
        coverageUnsafe: true,
      };
      setSignal(ranked[0].pageKey, unsafeSignal);
      // Preserve detector-owned actions on either side of a previously
      // observed competition. A decision-grade page cannot prove the absence
      // of cannibalization when its competing page has incomplete coverage.
      setSignal(ranked[1].pageKey, {
        ...unsafeSignal,
        secondPageKey: ranked[0].pageKey,
        secondUrlImpressionShare: ratio(ranked[0].impressions, clusterImpressions),
      });
      continue;
    }
    if (clusterImpressions < 100 || secondUrlImpressionShare < 0.2) continue;
    let sharedWeeks = 0;
    const weeklyLeaders = new Set();
    for (let index = 0; index < 4; index += 1) {
      const first = ranked[0].weeks[index] || 0;
      const second = ranked[1].weeks[index] || 0;
      if (first <= 0 || second <= 0) continue;
      sharedWeeks += 1;
      if (first > second) weeklyLeaders.add(ranked[0].pageKey);
      if (second > first) weeklyLeaders.add(ranked[1].pageKey);
    }
    const signal = {
      clusterKey,
      secondPageKey: ranked[1].pageKey,
      clusterImpressions,
      secondUrlImpressionShare,
      alternatingWeeks: weeklyLeaders.size >= 2 ? sharedWeeks : 0,
      semantic: true,
    };
    setSignal(ranked[0].pageKey, signal);
  }
  return signals;
}

const SAFE_DETECTOR_TYPES = new Set([
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
  'internal_link',
  'technical_indexing',
  'visibility_interruption',
]);
const SAFE_DETECTOR_STATES = new Set(['not_evaluable', 'clear', 'watch', 'actionable']);
const SAFE_DISPOSITIONS = new Set([
  'insufficient_evidence', 'monitor', 'investigate', 'structural_review', 'change_ready', 'no_change',
]);
const SAFE_NEXT_REVIEW_EVENTS = new Set([
  'url_inspection', 'post_deploy_crawl', '14_finalized_days', '28_finalized_days',
  'coverage_threshold', 'serp_review', 'next_finalized_sync', 'structural_review',
]);
const SAFE_OPPORTUNITY_CLASSIFICATIONS = new Set([
  'snippet_gap', 'ranking_gap', 'intent_gap', 'source_preference',
  'visibility_interruption', 'not_evaluable',
]);
const SAFE_OPPORTUNITY_SURFACES = new Set([
  'none', 'title_description', 'h1_body', 'h2_body', 'url_inspection', 'serp_review',
]);
const SAFE_BASELINE_QUALITIES = new Set(['insufficient', 'low', 'medium', 'high']);
const SAFE_BASELINE_COHORTS = new Set([
  'family+tech+position',
  'family+position',
  'site+position',
  'unavailable',
  'legacy_unknown',
  'unknown',
]);
const SAFE_CLUSTER_FACETS = new Set([
  'official_reference',
  'direct_answer',
  'implementation',
  'debugging',
  'comparison',
  'interview_prep',
  'other',
]);

function finiteEvidenceNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function finiteEvidenceFields(value, fields) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const field of fields) {
    const numeric = finiteEvidenceNumber(source[field]);
    if (numeric !== null) result[field] = numeric;
  }
  return result;
}

function booleanEvidenceFields(value, fields) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const field of fields) {
    if (typeof source[field] === 'boolean') result[field] = source[field];
  }
  return result;
}

function safeEvidenceSummary(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1_000);
}

function safeReasonCodes(value, maximum = 20) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((code) => String(code).trim().toLowerCase())
      .filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code)))).slice(0, maximum)
    : [];
}

function safeNextReview(value) {
  if (!value || typeof value !== 'object') return null;
  const rationale = safeEvidenceSummary(value.rationale).slice(0, 1_000);
  if (value.mode === 'date') {
    const at = value.at instanceof Date ? value.at : new Date(value.at);
    if (Number.isNaN(at.getTime())) return null;
    return { mode: 'date', at, rationale };
  }
  const event = String(value.event || '');
  if (value.mode !== 'event' || !SAFE_NEXT_REVIEW_EVENTS.has(event)) return null;
  return { mode: 'event', event, rationale };
}

function safeCoverageValue(value) {
  const numeric = finiteEvidenceNumber(value);
  return numeric !== null && numeric >= 0 && numeric <= 1 ? numeric : null;
}

function safeExpectedImpact(value) {
  const source = value && typeof value === 'object' ? value : {};
  const quality = ['not_estimated', 'directional', 'modeled'].includes(String(source.quality))
    ? String(source.quality)
    : 'not_estimated';
  const point = finiteEvidenceNumber(source.point);
  const low = finiteEvidenceNumber(source.low);
  const high = finiteEvidenceNumber(source.high);
  const modeled = quality === 'modeled';
  return {
    metric: 'clicks',
    low: modeled && low !== null && low >= 0 ? low : null,
    point: modeled && point !== null && point >= 0 ? point : null,
    high: modeled && high !== null && high >= 0 ? high : null,
    windowDays: Math.max(1, Math.min(365, finiteEvidenceNumber(source.windowDays) || 28)),
    quality,
  };
}

function safeOpportunity(value) {
  if (!value || typeof value !== 'object') return null;
  const classification = String(value.classification || '');
  const state = SAFE_DETECTOR_STATES.has(String(value.state))
    ? String(value.state)
    : 'not_evaluable';
  const disposition = SAFE_DISPOSITIONS.has(String(value.disposition))
    ? String(value.disposition)
    : 'insufficient_evidence';
  const key = String(value.key || '').trim().toLowerCase();
  if (!SAFE_OPPORTUNITY_CLASSIFICATIONS.has(classification) || !/^[a-f0-9]{64}$/.test(key)) return null;
  const clusterKey = safeHashKey(value.clusterKey);
  const persistence = value.persistence && typeof value.persistence === 'object'
    ? finiteEvidenceFields(value.persistence, [
      'stableWeeks', 'requiredWeeks', 'totalWeeks', 'zeroImpressionStreak',
    ])
    : {};
  return {
    key,
    classification,
    state,
    disposition,
    clusterKey,
    safeLabel: safeEvidenceSummary(value.safeLabel).slice(0, 160),
    patternConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(value.patternConfidence) || 0)),
    causeConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(value.causeConfidence) || 0)),
    current: safeMetricEvidence(value.current),
    previous: safeMetricEvidence(value.previous),
    coverage: {
      query: safeCoverageValue(value.coverage?.query),
      semantic: safeCoverageValue(value.coverage?.semantic),
      device: safeCoverageValue(value.coverage?.device),
    },
    persistence,
    recommendedSurface: SAFE_OPPORTUNITY_SURFACES.has(String(value.recommendedSurface))
      ? String(value.recommendedSurface)
      : 'none',
    blockers: safeReasonCodes(value.blockers, 12),
    reviewReady: value.reviewReady === true,
    expectedImpact: safeExpectedImpact(value.expectedImpact),
    nextReview: safeNextReview(value.nextReview),
  };
}

function safeVisibility(value) {
  if (!value || typeof value !== 'object') return {};
  const sanitized = sanitizeDetectorAssessment('visibility_interruption', value.assessment || value);
  const lifecycle = value.inspectionLifecycle && typeof value.inspectionLifecycle === 'object'
    ? value.inspectionLifecycle
    : {};
  const requestBoundaryAt = lifecycle.requestBoundaryAt instanceof Date
    ? lifecycle.requestBoundaryAt
    : new Date(lifecycle.requestBoundaryAt || '');
  const acceptedSource = lifecycle.accepted && typeof lifecycle.accepted === 'object'
    ? lifecycle.accepted
    : null;
  const acceptedObservedAt = acceptedSource?.observedAt instanceof Date
    ? acceptedSource.observedAt
    : new Date(acceptedSource?.observedAt || '');
  const acceptedCrawlAt = acceptedSource?.crawlAt instanceof Date
    ? acceptedSource.crawlAt
    : new Date(acceptedSource?.crawlAt || '');
  const acceptedKey = String(acceptedSource?.key || '').toLowerCase();
  const acceptedVerdict = ['pass', 'anomaly'].includes(String(acceptedSource?.verdict))
    ? String(acceptedSource.verdict)
    : null;
  const accepted = acceptedSource
    && /^[a-f0-9]{64}$/.test(acceptedKey)
    && !Number.isNaN(acceptedObservedAt.getTime())
    && acceptedVerdict
    ? {
      key: acceptedKey,
      observedAt: acceptedObservedAt,
      crawlAt: Number.isNaN(acceptedCrawlAt.getTime()) ? null : acceptedCrawlAt,
      pageVersionKey: safeEvidenceSummary(acceptedSource.pageVersionKey).slice(0, 128),
      indexStatus: ['PASS', 'FAIL'].includes(String(acceptedSource.indexStatus).toUpperCase())
        ? String(acceptedSource.indexStatus).toUpperCase()
        : '',
      robots: ['ALLOWED', 'BLOCKED'].includes(String(acceptedSource.robots).toUpperCase())
        ? String(acceptedSource.robots).toUpperCase()
        : '',
      canonicalVerdict: ['match', 'mismatch'].includes(String(acceptedSource.canonicalVerdict).toLowerCase())
        ? String(acceptedSource.canonicalVerdict).toLowerCase()
        : '',
      verdict: acceptedVerdict,
      exactVersionMatch: acceptedSource.exactVersionMatch === true,
    }
    : null;
  return {
    state: sanitized?.state || 'not_evaluable',
    disposition: sanitized?.disposition || 'insufficient_evidence',
    reasonCodes: sanitized?.reasonCodes || [],
    patternConfidence: sanitized?.patternConfidence || 0,
    causeConfidence: sanitized?.causeConfidence || 0,
    interrupted: value.interrupted === true,
    requiresInspection: value.requiresInspection === true,
    decisionGate: isKnownReasonCode(value.decisionGate) ? String(value.decisionGate) : null,
    evidence: sanitized?.evidence || {},
    inspectionLifecycle: {
      requestBoundaryAt: Number.isNaN(requestBoundaryAt.getTime()) ? null : requestBoundaryAt,
      accepted,
    },
    nextReview: sanitized?.nextReview || null,
  };
}

function safeWilsonEvidence(value) {
  return finiteEvidenceFields(value, ['low', 'high']);
}

function safeMetricEvidence(value) {
  return finiteEvidenceFields(value, ['clicks', 'impressions', 'ctr', 'position']);
}

function safeHashKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(key) ? key : null;
}

function safeBaselineEvidence(value) {
  if (!value || typeof value !== 'object') return null;
  const quality = SAFE_BASELINE_QUALITIES.has(String(value.quality))
    ? String(value.quality)
    : 'insufficient';
  const cohort = SAFE_BASELINE_COHORTS.has(String(value.cohort))
    ? String(value.cohort)
    : 'unknown';
  return {
    quality,
    cohort,
    eligible: value.eligible === true,
    ...finiteEvidenceFields(value, [
      'ctr',
      'peerPageCount',
      'peerClicks',
      'peerImpressions',
      'zeroClickPeerShare',
      'lower90',
      'upper90',
    ]),
  };
}

function safePersistenceEvidence(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    ...booleanEvidenceFields(value, ['available', 'persistent']),
    ...finiteEvidenceFields(value, ['totalWeeks', 'decliningWeeks', 'requiredWeeks']),
  };
}

function safeDecayBranches(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 2).flatMap((branch) => {
    const branchName = ['ctr', 'position'].includes(String(branch?.branch))
      ? String(branch.branch)
      : null;
    if (!branchName) return [];
    const persistence = safePersistenceEvidence(branch.persistence);
    return [{
      branch: branchName,
      ...(typeof branch.uncertain === 'boolean' ? { uncertain: branch.uncertain } : {}),
      ...(persistence ? { persistence } : {}),
    }];
  });
}

function safeDominantClusterEvidence(value) {
  if (!value || typeof value !== 'object') return null;
  const clusterKey = safeHashKey(value.clusterKey);
  const dominantFacet = SAFE_CLUSTER_FACETS.has(String(value.dominantFacet))
    ? String(value.dominantFacet)
    : 'other';
  return {
    ...(clusterKey ? { clusterKey } : {}),
    dominantFacet,
    ...finiteEvidenceFields(value, [
      'impressions',
      'visibleShare',
      'fullPageLowerBoundShare',
      'topicAlignment',
      'sourcePreferenceShare',
    ]),
  };
}

function sanitizeDetectorEvidence(detector, evidence = {}) {
  if (!SAFE_DETECTOR_TYPES.has(detector)) return null;
  const source = evidence && typeof evidence === 'object' ? evidence : {};
  const result = { summary: safeEvidenceSummary(source.summary) };
  const windowDays = finiteEvidenceNumber(source.windowDays);
  if (windowDays !== null) result.windowDays = windowDays;

  if (detector === 'ctr_snippet') {
    const baseline = safeBaselineEvidence(source.baseline);
    const currentWilson90 = safeWilsonEvidence(source.currentWilson90);
    const baselineWilson90 = safeWilsonEvidence(source.baselineWilson90);
    return {
      ...result,
      current: safeMetricEvidence(source.current),
      ...(baseline ? { baseline } : {}),
      ...finiteEvidenceFields(source, ['queryCoverage', 'deficit', 'expectedAdditionalClicks']),
      ...(Object.keys(currentWilson90).length ? { currentWilson90 } : {}),
      ...(Object.keys(baselineWilson90).length ? { baselineWilson90 } : {}),
    };
  }

  if (detector === 'intent_mismatch') {
    const queryCoverageStatus = ['consistent', 'inconsistent', 'unavailable']
      .includes(String(source.queryCoverageStatus))
      ? String(source.queryCoverageStatus)
      : 'unavailable';
    const dominantCluster = safeDominantClusterEvidence(source.dominantCluster);
    return {
      ...result,
      ...finiteEvidenceFields(source, ['queryCoverage', 'semanticCoverage']),
      queryCoverageStatus,
      ...(typeof source.directional === 'boolean' ? { directional: source.directional } : {}),
      ...(dominantCluster ? { dominantCluster } : {}),
    };
  }

  if (detector === 'content_decay') {
    const currentWilson90 = safeWilsonEvidence(source.currentWilson90);
    const previousWilson90 = safeWilsonEvidence(source.previousWilson90);
    const branches = safeDecayBranches(source.branches);
    return {
      ...result,
      current: safeMetricEvidence(source.current),
      previous: safeMetricEvidence(source.previous),
      ...finiteEvidenceFields(source, [
        'lostClicks',
        'clickDrop',
        'ctrDrop',
        'impressionDrop',
        'positionLoss',
      ]),
      ...(Object.keys(currentWilson90).length ? { currentWilson90 } : {}),
      ...(Object.keys(previousWilson90).length ? { previousWilson90 } : {}),
      ...(branches.length ? { branches } : {}),
    };
  }

  if (detector === 'cannibalization') {
    const clusterKey = safeHashKey(source.clusterKey);
    const secondPageKey = safeHashKey(source.secondPageKey);
    return {
      ...result,
      ...booleanEvidenceFields(source, ['coverageUnsafe']),
      ...finiteEvidenceFields(source, [
        'queryCoverage',
        'semanticCoverage',
        'secondUrlImpressionShare',
        'alternatingWeeks',
        'clusterImpressions',
      ]),
      ...(clusterKey ? { clusterKey } : {}),
      ...(secondPageKey ? { secondPageKey } : {}),
    };
  }

  if (detector === 'internal_link') {
    const qualifiedDonors = Array.isArray(source.qualifiedDonors)
      ? source.qualifiedDonors.slice(0, 10).flatMap((donor) => {
        const canonicalUrl = String(donor?.canonicalUrl || '').trim().slice(0, 2048);
        const relevanceScore = finiteEvidenceNumber(donor?.relevanceScore);
        if (!/^https:\/\//i.test(canonicalUrl) || relevanceScore === null || relevanceScore < 0.35) return [];
        return [{
          title: safeEvidenceSummary(donor.title).slice(0, 300),
          canonicalUrl,
          relevanceScore: Math.max(0, Math.min(1, relevanceScore)),
          reasonCodes: Array.isArray(donor.reasonCodes)
            ? donor.reasonCodes.map(String).filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code)).slice(0, 10)
            : [],
          anchorDirection: safeEvidenceSummary(donor.anchorDirection).slice(0, 300),
        }];
      })
      : [];
    return {
      ...result,
      ...finiteEvidenceFields(source, [
        'position',
        'impressions',
        'inboundCount',
        'cohortP25',
        'peerCount',
        'linkDeficit',
        'familyP25',
        'donorPageCount',
      ]),
      qualifiedDonors,
    };
  }

  if (detector === 'visibility_interruption') {
    return {
      ...result,
      ...finiteEvidenceFields(source, [
        'completePreviousDays', 'completeCurrentDays', 'previousShare', 'currentShare',
        'shareDrop', 'zeroImpressionStreak', 'trailingZeroImpressionStreak',
        'cleanFinalizedDays',
      ]),
      ...booleanEvidenceFields(source, ['mature', 'inspectionCurrent', 'inspectionPass']),
      firstVisibleDate: /^\d{4}-\d{2}-\d{2}$/.test(String(source.firstVisibleDate || ''))
        ? source.firstVisibleDate
        : null,
      cleanWindowStartDate: /^\d{4}-\d{2}-\d{2}$/.test(String(source.cleanWindowStartDate || ''))
        ? source.cleanWindowStartDate
        : null,
      previous: finiteEvidenceFields(source.previous, ['pageImpressions', 'propertyImpressions', 'visibleDays', 'siteActiveDays']),
      current: finiteEvidenceFields(source.current, ['pageImpressions', 'propertyImpressions', 'visibleDays', 'siteActiveDays']),
    };
  }

  return {
    ...result,
    ...finiteEvidenceFields(source, ['ageDays']),
    ...booleanEvidenceFields(source, [
      'noVisibility',
      'canonicalChanged',
      'inspectionIssue',
      'manifestRobotsBlocked',
      'canonicalMissing',
    ]),
  };
}

function sanitizeDetectorAssessment(detector, assessment = {}) {
  if (!SAFE_DETECTOR_TYPES.has(detector)) return null;
  const state = SAFE_DETECTOR_STATES.has(String(assessment.state))
    ? String(assessment.state)
    : 'not_evaluable';
  const reasonCodes = Array.isArray(assessment.reasonCodes)
    ? assessment.reasonCodes.map((code) => String(code).trim().toLowerCase())
      .filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code) && isKnownReasonCode(code))
      .slice(0, 20)
    : [];
  const confidence = finiteEvidenceNumber(assessment.confidence);
  const evidence = sanitizeDetectorEvidence(detector, assessment.evidence) || { summary: '' };
  // Rebuild public summaries from versioned reason codes rather than trusting
  // any free-form query-derived or persisted string.
  evidence.summary = safeEvidenceSummary(reasonSummaryForCode(reasonCodes[0]));
  return {
    state,
    reasonCodes,
    confidence: confidence === null ? 0 : Math.max(0, Math.min(1, confidence)),
    patternConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(assessment.patternConfidence) ?? confidence ?? 0)),
    causeConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(assessment.causeConfidence) ?? 0)),
    disposition: SAFE_DISPOSITIONS.has(String(assessment.disposition))
      ? String(assessment.disposition)
      : (state === 'clear' ? 'no_change' : state === 'actionable' ? 'change_ready' : 'insufficient_evidence'),
    decisionGates: Array.isArray(assessment.decisionGates)
      ? assessment.decisionGates.map(String).filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code)).slice(0, 20)
      : [],
    nextReview: safeNextReview(assessment.nextReview),
    evidence,
  };
}

function safeDetectorMap(detectors = []) {
  return Object.fromEntries((detectors || []).flatMap((assessment) => {
    const detector = String(assessment?.detector || assessment?.type || '');
    const safe = sanitizeDetectorAssessment(detector, assessment);
    return safe ? [[detector, { detector, type: detector, ...safe }]] : [];
  }));
}

function safeCtrBaseline(baseline = {}) {
  const quality = typeof baseline.quality === 'object' ? baseline.quality : {};
  const qualityLabel = String(
    baseline.qualityLevel
    || baseline.level
    || quality.level
    || (typeof baseline.quality === 'string' ? baseline.quality : '')
    || 'insufficient'
  );
  return {
    ctr: Number(baseline.ctr || 0),
    cohort: String(baseline.cohort || quality.cohort || ''),
    quality: qualityLabel,
    eligible: Boolean(baseline.eligible ?? ['medium', 'high'].includes(qualityLabel)),
    peerPageCount: Number(baseline.peerPageCount ?? baseline.peers ?? quality.peers ?? 0),
    peerClicks: Number(baseline.peerClicks ?? baseline.clicks ?? quality.clicks ?? 0),
    peerImpressions: Number(baseline.peerImpressions ?? baseline.impressions ?? quality.impressions ?? 0),
    zeroClickPeerShare: Number(baseline.zeroClickPeerShare ?? quality.zeroClickPeerRate ?? 0),
    lower90: finiteEvidenceNumber(baseline.lower90),
    upper90: finiteEvidenceNumber(baseline.upper90),
    reasonCodes: Array.isArray(baseline.reasonCodes) ? baseline.reasonCodes.map(String).slice(0, 10) : [],
  };
}

function safeAssessmentForPersistence(packet, detectors) {
  const safeDetectors = safeDetectorMap(detectors);
  const findings = Object.values(safeDetectors).filter((finding) => finding.state !== 'clear').map((finding) => ({
    code: finding.reasonCodes[0] || `${finding.detector}_${finding.state}`,
    detector: finding.detector,
    state: finding.state,
    confidence: finding.confidence,
    patternConfidence: finding.patternConfidence,
    causeConfidence: finding.causeConfidence,
    disposition: finding.disposition,
    decisionGates: finding.decisionGates,
    nextReview: finding.nextReview,
    summary: finding.evidence.summary,
    counterEvidence: finding.state === 'watch' || finding.state === 'clear'
      ? finding.reasonCodes.slice(0, 5)
      : [],
  }));
  const requestedPrimaryDetector = String(packet.primaryFinding?.detector || '');
  const requestedPrimaryCode = String(packet.primaryFinding?.code || '');
  const primaryFinding = findings.find((finding) => (
    finding.detector === requestedPrimaryDetector
    && (!requestedPrimaryCode || finding.code === requestedPrimaryCode)
  )) || findings[0] || null;
  const queryOpportunities = (Array.isArray(packet.queryOpportunities) ? packet.queryOpportunities : [])
    .flatMap((opportunity) => {
      const safe = safeOpportunity(opportunity);
      return safe ? [safe] : [];
    })
    .slice(0, 10);
  const nextReview = safeNextReview(packet.nextReview);
  const datedReview = nextReview?.mode === 'date' ? nextReview.at : null;
  return {
    siteUrl: packet.siteUrl,
    pageKey: packet.pageKey,
    canonicalUrl: packet.canonicalUrl,
    endDate: packet.endDate,
    ruleVersion: packet.ruleVersion,
    semanticVersion: packet.semanticVersion,
    inputVersion: packet.inputVersion,
    inputHash: packet.inputHash,
    pageVersionKey: packet.pageVersionKey,
    primaryState: packet.primaryState,
    disposition: SAFE_DISPOSITIONS.has(String(packet.disposition))
      ? String(packet.disposition)
      : (packet.primaryState === 'clear' ? 'no_change' : 'insufficient_evidence'),
    patternConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(packet.patternConfidence) || 0)),
    causeConfidence: Math.max(0, Math.min(1, finiteEvidenceNumber(packet.causeConfidence) || 0)),
    primaryFinding,
    evidenceLevel: packet.evidenceLevel,
    metrics: {
      current: safeMetricEvidence(packet.metrics?.current),
      previous: safeMetricEvidence(packet.metrics?.previous),
    },
    coverage: {
      query: safeCoverageValue(packet.coverage?.query),
      semantic: safeCoverageValue(packet.coverage?.semantic),
      device: safeCoverageValue(packet.coverage?.device),
    },
    cooldown: packet.cooldown,
    detectorCooldowns: packet.detectorCooldowns,
    ctrBaseline: safeCtrBaseline(packet.ctrBaseline),
    semanticClusters: (packet.semanticClusters || []).map(safeSemanticCluster).slice(0, 10),
    detectorAssessments: safeDetectors,
    visibility: safeVisibility(packet.visibility),
    queryOpportunities,
    decisionGates: safeReasonCodes(packet.decisionGates, 30),
    nextReview,
    findings,
    counterEvidence: Object.values(safeDetectors)
      .filter((finding) => finding.state === 'watch' || finding.state === 'clear')
      .map((finding) => ({ detector: finding.detector, reasonCodes: finding.reasonCodes.slice(0, 5) })),
    nextReviewDate: datedReview || (packet.nextReviewDate ? new Date(`${packet.nextReviewDate}T00:00:00.000Z`) : null),
    evaluatedAt: packet.updatedAt || new Date(),
  };
}

async function dominantQueriesByPage({ siteUrl, startDate, endDate }) {
  const rows = await SeoQueryPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'queryPage',
    match: { siteUrl, segment: 'nonbrand', date: { $gte: startDate, $lte: endDate } },
    afterLookup: [
      {
        $group: {
          _id: { pageKey: '$pageKey', queryKey: '$queryKey', query: '$query' },
          clicks: { $sum: '$clicks' },
          impressions: { $sum: '$impressions' },
          positionNumerator: { $sum: '$positionNumerator' },
        },
      },
      { $sort: { '_id.pageKey': 1, impressions: -1 } },
    ],
  }));
  const totals = new Map();
  for (const row of rows) totals.set(row._id.pageKey, (totals.get(row._id.pageKey) || 0) + row.impressions);
  const dominant = new Map();
  for (const row of rows) {
    if (dominant.has(row._id.pageKey)) continue;
    dominant.set(row._id.pageKey, {
      clusterKey: row._id.queryKey,
      label: row._id.query,
      intent: null,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.impressions > 0 ? row.positionNumerator / row.impressions : 0,
      impressionShare: ratio(row.impressions, totals.get(row._id.pageKey)),
    });
  }
  return { dominant, totals };
}

function familyInboundP25(pages) {
  const values = new Map();
  for (const page of pages) {
    const family = page.family || 'unknown';
    const list = values.get(family) || [];
    list.push(Number(page.internalLinks?.inboundCount || 0));
    values.set(family, list);
  }
  return new Map(Array.from(values, ([family, list]) => {
    list.sort((a, b) => a - b);
    return [family, list[Math.floor(Math.max(0, list.length - 1) * 0.25)] || 0];
  }));
}

function deadlineHasHeadroom(deadlineMs, clock, minimumMs = 0) {
  return !Number.isFinite(deadlineMs) || deadlineMs - clock() >= minimumMs;
}

function migrationClearTypes(detectors = [], cooldown, _querySafe = false) {
  const cooldownEligible = eligibleTypesForCooldown(cooldown);
  const clearTypes = new Set();
  for (const detector of detectors || []) {
    const type = detector?.type || detector?.detector;
    // This one-time v2.2 migration is intentionally narrower than normal
    // recommendation reconciliation. It may retire only the two historical
    // detector-owned proposed action classes called out by the rollout plan;
    // technical, intent, decay and owner-authored decisions are out of scope.
    if (!['internal_link', 'ctr_snippet'].includes(type) || !cooldownEligible.has(type)) continue;
    // balanced-v2.2 deliberately demotes the old detector-owned proposed
    // internal-link and CTR false positives. Owner-authored/approved actions
    // remain protected by reconciliation.
    if (
      type === 'internal_link'
      && (
        detector?.state === 'clear'
        || (detector?.state === 'watch' && detector?.disposition === 'structural_review')
      )
    ) clearTypes.add(type);
    if (type === 'ctr_snippet' && ['clear', 'watch'].includes(detector?.state)) clearTypes.add(type);
  }
  return clearTypes;
}

function analysisCompletionState({
  evaluatedPages = 0,
  totalPages = 0,
  actionUpsertComplete = false,
  reconciliationComplete = false,
  assessmentWriteComplete = false,
} = {}) {
  const complete = evaluatedPages === totalPages
    && actionUpsertComplete === true
    && reconciliationComplete === true
    && assessmentWriteComplete === true;
  return {
    status: complete ? 'complete' : 'partial',
    reason: complete ? 'analysis_complete' : 'analysis_deadline',
  };
}

class AnalysisPublicationError extends Error {
  constructor(message, code = 'SEO_ANALYSIS_PUBLICATION_FAILED') {
    super(message);
    this.name = 'AnalysisPublicationError';
    this.code = code;
  }
}

function requiresTransactionalAnalysisPublication(env = process.env) {
  const runtime = String(env.NODE_ENV || '').trim().toLowerCase();
  const vercelEnvironment = String(env.VERCEL_ENV || '').trim().toLowerCase();
  const mongoTarget = env === process.env
    ? resolveMongoTarget()
    : String(env.MONGO_TARGET || env.LOCAL_MONGO_TARGET || '').trim().toLowerCase();
  return runtime === 'production'
    || vercelEnvironment === 'production'
    || mongoTarget !== 'test';
}

function supportsAnalysisTransactions(connection = SeoAction.db) {
  const topologyType = String(connection?.client?.topology?.description?.type || '');
  if (topologyType === 'Single') return false;
  return ['ReplicaSetWithPrimary', 'Sharded', 'LoadBalanced'].includes(topologyType);
}

function assertPublicationDeadline(deadlineMs, clock, minimumMs = 0) {
  if (!deadlineHasHeadroom(deadlineMs, clock, minimumMs)) {
    throw new AnalysisPublicationError(
      'The analysis publication deadline elapsed before every write could commit.',
      'SEO_ANALYSIS_PUBLICATION_DEADLINE'
    );
  }
}

async function publishAnalysisWrites({
  siteUrl,
  pages,
  recommendations,
  evaluatedPageKeys,
  querySafePageKeys,
  eligibleTypesByPage,
  migrationEligibleTypesByPage,
  assessmentWrites,
  syncRunId = null,
  publicationAnalysis = null,
  now,
  deadlineMs = Infinity,
  clock = Date.now,
  connection = SeoAction.db,
} = {}) {
  const publish = async (session = null) => {
    const actionUpsertProgress = {};
    const actions = await upsertRecommendations(recommendations, now, {
      deadlineMs,
      clock,
      progress: actionUpsertProgress,
      session,
    });
    if (actionUpsertProgress.complete !== true) {
      throw new AnalysisPublicationError(
        'The action publication stopped before every recommendation was processed.',
        'SEO_ANALYSIS_ACTION_PUBLICATION_INCOMPLETE'
      );
    }
    assertPublicationDeadline(deadlineMs, clock, 1_000);

    const reconciliationProgress = {};
    const cleared = await reconcileDetectorRecommendations({
      evaluatedPageKeys,
      recommendations,
      querySafePageKeys,
      eligibleTypesByPage,
      migrationEligibleTypesByPage,
      now,
      deadlineMs,
      clock,
      progress: reconciliationProgress,
      session,
    });
    if (reconciliationProgress.complete !== true) {
      throw new AnalysisPublicationError(
        'The action reconciliation stopped before every candidate was processed.',
        'SEO_ANALYSIS_RECONCILIATION_INCOMPLETE'
      );
    }
    assertPublicationDeadline(deadlineMs, clock, 500);

    await SeoPageAssessment.deleteMany({
      siteUrl,
      pageKey: { $nin: pages.map((page) => page.pageKey) },
    }, session ? { session } : undefined);
    assertPublicationDeadline(deadlineMs, clock);

    if (assessmentWrites.length) {
      await SeoPageAssessment.bulkWrite(
        assessmentWrites,
        { ordered: false, ...(session ? { session } : {}) }
      );
    }
    assertPublicationDeadline(deadlineMs, clock);
    let committedAnalysis = null;
    if (syncRunId) {
      committedAnalysis = {
        ...(publicationAnalysis || {}),
        status: 'complete',
        reason: 'analysis_complete',
        proposedActions: recommendations.length,
        clearedActions: cleared,
        committedAssessmentPages: assessmentWrites.length,
      };
      const markerResult = await SeoSyncRun.updateOne(
        {
          _id: syncRunId,
          siteUrl,
          'analysis.status': 'running',
        },
        { $set: { analysis: committedAnalysis } },
        session ? { session, runValidators: true } : { runValidators: true }
      );
      if (markerResult.modifiedCount !== 1) {
        throw new AnalysisPublicationError(
          'The analysis run publication marker was no longer writable.',
          'SEO_ANALYSIS_PUBLICATION_MARKER_CONFLICT'
        );
      }
      assertPublicationDeadline(deadlineMs, clock);
    } else if (requiresTransactionalAnalysisPublication()) {
      throw new AnalysisPublicationError(
        'A production SEO analysis requires a sync run publication marker.',
        'SEO_ANALYSIS_PUBLICATION_MARKER_REQUIRED'
      );
    }
    return { actions, cleared, publicationAnalysis: committedAnalysis };
  };

  if (!supportsAnalysisTransactions(connection)) {
    if (requiresTransactionalAnalysisPublication()) {
      throw new AnalysisPublicationError(
        'MongoDB transactions are required to publish production SEO decisions.',
        'SEO_ANALYSIS_TRANSACTION_REQUIRED'
      );
    }
    // mongodb-memory-server and a developer's local standalone Mongo do not
    // expose transactions. Keep that explicitly non-production workflow
    // usable, while every production-like runtime remains fail-closed above.
    return publish(null);
  }

  const session = await connection.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      result = await publish(session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
    if (!result) {
      throw new AnalysisPublicationError(
        'The SEO analysis transaction completed without a published result.'
      );
    }
    return result;
  } finally {
    await session.endSession();
  }
}

async function runBalancedAnalysis({
  siteUrl,
  endDate,
  windowDays = BALANCED_ANALYSIS_WINDOW_DAYS,
  now = new Date(),
  deadlineMs = Infinity,
  clock = Date.now,
  syncRunId = null,
  analysisStartedAt = null,
}) {
  if (!siteUrl || !endDate) {
    return {
      status: 'not_ready', reason: 'missing_analysis_window', ruleVersion: RULE_VERSION,
      evaluatedPages: 0, totalPages: 0, proposedActions: 0,
    };
  }
  const totalPages = await SeoPage.countDocuments({ 'manifest.present': true });
  const completedDays = await contiguousPartitionDays({
    siteUrl,
    endDate,
    slice: 'page',
    maximumDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
  });
  if (!deadlineHasHeadroom(deadlineMs, clock, 5_000)) {
    return {
      status: 'not_ready', reason: 'analysis_deadline', ruleVersion: RULE_VERSION, endDate,
      completedDays, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS, evaluatedPages: 0, totalPages,
      proposedActions: 0,
    };
  }
  const currentStart = shiftDateKey(endDate, -(windowDays - 1));
  const previousEnd = shiftDateKey(currentStart, -1);
  const previousStart = shiftDateKey(previousEnd, -(windowDays - 1));
  const pagePartitionsComplete = await hasContiguousPartitions({
    siteUrl,
    startDate: previousStart,
    endDate,
    slice: 'page',
  });
  if (!pagePartitionsComplete) {
    return {
      status: 'not_ready', reason: 'insufficient_contiguous_page_data', ruleVersion: RULE_VERSION,
      endDate, windowDays, completedDays, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
      evaluatedPages: 0, totalPages, eligiblePages: 0, proposedActions: 0, clearedActions: 0,
      cooldown: { awaitingRecrawl: 0, observing: 0, directional: 0, eligible: 0 },
      dataQualityBlockedPages: 0,
      decisionBlockedPages: 0,
    };
  }
  if (!deadlineHasHeadroom(deadlineMs, clock, 5_000)) {
    return {
      status: 'not_ready', reason: 'analysis_deadline', ruleVersion: RULE_VERSION, endDate,
      completedDays, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS, evaluatedPages: 0, totalPages,
      proposedActions: 0,
    };
  }
  const [metrics, weeklyByPage, pages, queryPartitionsComplete] = await Promise.all([
    pageWindowMetrics({ siteUrl, currentStart, currentEnd: endDate, previousStart, previousEnd }),
    pageDailyWindows({ siteUrl, currentStart, currentEnd: endDate, previousStart }),
    SeoPage.find({ 'manifest.present': true }).sort({ pageKey: 1 }).lean(),
    hasContiguousPartitions({ siteUrl, startDate: previousStart, endDate, slice: 'queryPage' }),
  ]);
  if (!deadlineHasHeadroom(deadlineMs, clock, 5_000)) {
    return {
      status: 'not_ready', reason: 'analysis_deadline', ruleVersion: RULE_VERSION, endDate,
      completedDays, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS, evaluatedPages: 0,
      totalPages: pages.length, proposedActions: 0,
    };
  }
  const queryRowsByPage = queryPartitionsComplete
    ? await queryWindowRowsByPage({ siteUrl, currentStart, currentEnd: endDate, previousStart, previousEnd })
    : new Map();
  const semanticByPage = new Map();
  for (const page of pages) {
    const windows = metrics.get(page.pageKey) || { current: metricFromRow(), previous: metricFromRow() };
    const queryRows = queryRowsByPage.get(page.pageKey) || { currentRows: [], previousRows: [] };
    const intent = page.intent || {};
    const semantic = buildSemanticClusters({
      currentRows: queryRows.currentRows,
      previousRows: queryRows.previousRows,
      pageIntent: [intent.targetKeyword, intent.intendedIntent, intent.readerPromise, page.title, page.h1]
        .filter(Boolean).join(' '),
      pageTech: page.tech || '',
      pageCurrentImpressions: windows.current.impressions,
      pagePreviousImpressions: windows.previous.impressions,
      maxQueries: SEMANTIC_QUERY_CAP,
    });
    semanticByPage.set(page.pageKey, semanticClustersWithWeekly(semantic, queryRows));
  }
  if (!deadlineHasHeadroom(deadlineMs, clock, 5_000)) {
    return {
      status: 'not_ready', reason: 'analysis_deadline', ruleVersion: RULE_VERSION, endDate,
      completedDays, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS, evaluatedPages: 0,
      totalPages: pages.length, proposedActions: 0,
    };
  }
  const cannibalizationByPage = queryPartitionsComplete
    ? semanticCannibalizationByPage(semanticByPage, queryRowsByPage)
    : new Map();
  const [inspectionRows, priorVisibilityRows, deviceCoverageMap] = await Promise.all([
    SeoDiagnosticSnapshot.find({
      siteUrl,
      kind: 'urlInspection',
      pageKey: { $in: pages.map((page) => page.pageKey) },
      observedAt: { $gte: new Date(now.getTime() - 30 * DAY_MS) },
    }).sort({ observedAt: -1 }).select('pageKey data observedAt').lean(),
    SeoPageAssessment.find({
      siteUrl,
      ruleVersion: RULE_VERSION,
      pageKey: { $in: pages.map((page) => page.pageKey) },
      'visibility.interrupted': true,
    }).select('pageKey evaluatedAt visibility').lean(),
    deviceCoverageByPage({ siteUrl, pages, currentStart, endDate, metrics }),
  ]);
  const latestInspection = new Map();
  for (const row of inspectionRows) {
    if (!latestInspection.has(row.pageKey)) latestInspection.set(row.pageKey, row);
  }
  const priorVisibilityByPage = new Map((priorVisibilityRows || []).map((row) => [row.pageKey, row]));
  const visibilityByPage = await visibilityEvidenceByPage({
    siteUrl,
    pages,
    previousStart,
    currentStart,
    endDate,
    evaluatedAt: now,
    inspectionByPage: latestInspection,
    priorVisibilityByPage,
  });
  const recommendations = [];
  const querySafePageKeys = new Set();
  const evaluatedPageKeys = [];
  const eligibleTypesByPage = new Map();
  const migrationEligibleTypesByPage = new Map();
  const assessmentWrites = [];
  const cooldownCounts = { awaitingRecrawl: 0, observing: 0, directional: 0, eligible: 0 };
  let eligiblePages = 0;
  let dataQualityBlockedPages = 0;
  let decisionBlockedPages = 0;
  let evaluatedPages = 0;
  for (const page of pages) {
    if (!deadlineHasHeadroom(deadlineMs, clock)) break;
    const windows = metrics.get(page.pageKey) || { current: metricFromRow(), previous: metricFromRow() };
    const current = windows.current;
    const intended = page.intent || {};
    const inspectionEntry = latestInspection.get(page.pageKey) || null;
    const priorVisibility = priorVisibilityByPage.get(page.pageKey) || null;
    const validatedInspection = currentInspectionEvidence({
      inspection: inspectionEntry,
      currentVersionKey: page.changeTracking?.currentVersionKey || '',
      productionEffectiveAt: page.changeTracking?.production?.effectiveAt || null,
      previousInterruptionEvaluatedAt: priorVisibility?.evaluatedAt || null,
      inspectionRequestAt: priorVisibility?.visibility?.inspectionLifecycle?.requestBoundaryAt || null,
      acceptedInspection: priorVisibility?.visibility?.inspectionLifecycle?.accepted || null,
    });
    const semantic = semanticByPage.get(page.pageKey) || buildSemanticClusters();
    const dominantQueryCluster = semantic.clusters?.find((cluster) => cluster.clusterKey === semantic.dominantClusterKey) || null;
    const queryCoverage = Number(semantic.pageQueryCoverage?.current || 0);
    const semanticCoverage = Number(semantic.currentSemanticCoverage || semantic.semanticCoverage || 0);
    const queryCoverageConsistent = semantic.pageQueryCoverage?.currentStatus === 'consistent';
    const querySafe = queryPartitionsComplete
      && queryCoverageConsistent
      && queryCoverage >= MIN_QUERY_COVERAGE
      && semanticCoverage >= 0.9;
    if (querySafe) {
      querySafePageKeys.add(page.pageKey);
    }
    const ctrBaseline = ctrPeerBaselineForPage({ page, pages, metrics });
    const visibility = visibilityByPage.get(page.pageKey) || null;
    const deviceCoverage = deviceCoverageMap.get(page.pageKey) ?? null;
    const temporalGate = temporalGateForPage(page, endDate, currentStart);
    const internalLinks = internalLinkEvidenceForPage({
      page,
      pages,
      metrics,
      visibilityByPage,
      endDate,
    });
    const pageWeekly = weeklyByPage.get(page.pageKey) || {
      current: Array.from({ length: 4 }, () => metricFromRow()),
      previous: Array.from({ length: 4 }, () => metricFromRow()),
    };
    const queryOpportunities = buildQueryOpportunities({
      semanticClusters: semantic,
      queryCoverage: queryPartitionsComplete ? queryCoverage : null,
      semanticCoverage: queryPartitionsComplete ? semanticCoverage : null,
      deviceCoverage,
      ctrBaseline,
      pageWeekly,
      visibility,
      temporalGate,
      limit: 10,
    });
    const detectorCooldowns = cooldownsForPage({ page, endDate });
    const cooldown = aggregateCooldown(detectorCooldowns);
    if (cooldown.state === 'eligible') eligiblePages += 1;
    if (cooldown.state === 'awaiting_recrawl') cooldownCounts.awaitingRecrawl += 1;
    else if (cooldown.state === 'observing') cooldownCounts.observing += 1;
    else if (cooldown.state === 'directional') cooldownCounts.directional += 1;
    else cooldownCounts.eligible += 1;
    const detectors = applyCooldown(evaluatePageDetectors({
      page: {
        pageKey: page.pageKey,
        canonicalUrl: page.canonicalUrl,
        family: page.family,
        tech: page.tech,
        indexable: page.indexable,
        targetKeyword: intended.targetKeyword,
        intendedIntent: intended.intendedIntent,
        readerPromise: intended.readerPromise,
        intentConfirmed: intended.confirmed,
        changeTracking: page.changeTracking,
      },
      current,
      previous: windows.previous,
      weekly: pageWeekly,
      ctrBaseline,
      queryCoverage: queryPartitionsComplete ? queryCoverage : null,
      semanticCoverage: queryPartitionsComplete ? semanticCoverage : null,
      semantic,
      semanticClusters: semantic,
      dominantQueryCluster,
      cannibalization: cannibalizationByPage.get(page.pageKey) || null,
      internalLinks,
      visibility,
      temporalGate,
      technical: {
        pageAgeDays: page.firstSeenAt ? Math.floor((now - new Date(page.firstSeenAt)) / DAY_MS) : 0,
        inspectionIssue: validatedInspection?.anomaly === true,
        canonicalChanged: validatedInspection?.canonicalVerdict === 'mismatch'
          || Boolean(page.renderedCanonicalUrl && page.renderedCanonicalUrl !== page.canonicalUrl),
        canonicalMissing: Boolean(
          page.changeTracking?.fingerprintVersion
          && !String(page.changeTracking.fingerprintVersion).startsWith('legacy-derived')
          && page.changeTracking?.fingerprintEvidence?.statuses?.canonical
          && page.renderedCanonicalUrl === ''
        ),
        manifestRobotsBlocked: page.indexable === true
          && /(?:^|[,\s])(noindex|nofollow|none)(?:$|[,\s])/i.test(String(page.robots || '')),
        inspectionAvailable: Boolean(validatedInspection),
      },
      windowDays,
    }), detectorCooldowns);
    const detectorMap = Object.fromEntries(detectors.map((detector) => [detector.type || detector.detector, detector]));
    const packet = synthesizePageAssessment({
      page: { ...page, siteUrl },
      endDate,
      current,
      previous: windows.previous,
      detectorAssessments: detectorMap,
      cooldown,
      queryCoverage: queryPartitionsComplete ? queryCoverage : null,
      semanticCoverage: queryPartitionsComplete ? semanticCoverage : null,
      deviceCoverage,
      semanticClusters: semantic.clusters || [],
      queryOpportunities,
      visibility,
      ctrBaseline,
      windowDays,
      ruleVersion: RULE_VERSION,
      semanticVersion: SEMANTIC_CLUSTER_VERSION,
      detectorCooldowns,
      inputHash: page.changeTracking?.analysisInputHash || analysisInputHashForPage(page),
      inputVersion: 'seo-analysis-input.v1',
      pageVersionKey: page.changeTracking?.currentVersionKey || '',
    });
    const actionable = detectors
      .filter((detector) => {
        if (detector.state !== 'actionable' || !detector.action) return false;
        if (detector.action.type === 'technical_indexing' || detector.action.queueKind === 'technical') return true;
        const point = Number(detector.action.expectedImpact?.point);
        return detector.action.expectedImpact?.quality === 'modeled'
          && Number.isFinite(point)
          && point > 0;
      })
      .map((detector) => detector.action);
    const selected = primaryAction(actionable);
    if (selected && (
      selected.type === 'technical_indexing'
      || detectorCooldowns[selected.type]?.state === 'eligible'
    )) {
      recommendations.push(selected);
    }
    const migrationEligibleTypes = migrationClearTypes(detectors, detectorCooldowns, querySafe);
    migrationEligibleTypesByPage.set(page.pageKey, migrationEligibleTypes);
    const eligibleTypes = eligibleTypesForCooldown(detectorCooldowns);
    for (const detector of detectors) {
      const type = detector.type;
      if (!type || detector.state === 'not_evaluable' || detector.state === 'watch') eligibleTypes.delete(type);
    }
    if (!querySafe) {
      eligibleTypes.delete('intent_mismatch');
      eligibleTypes.delete('cannibalization');
    }
    eligibleTypesByPage.set(page.pageKey, eligibleTypes);
    const baselineQuality = String(
      ctrBaseline.qualityLevel
      || ctrBaseline.level
      || (typeof ctrBaseline.quality === 'string' ? ctrBaseline.quality : ctrBaseline.quality?.level)
      || 'insufficient'
    );
    if (!querySafe || baselineQuality === 'insufficient') dataQualityBlockedPages += 1;
    if (['watch', 'not_evaluable'].includes(packet.primaryState)) decisionBlockedPages += 1;
    const persisted = safeAssessmentForPersistence(packet, detectors);
    assessmentWrites.push({
      updateOne: {
        filter: { siteUrl, pageKey: page.pageKey },
        update: { $set: persisted },
        upsert: true,
      },
    });
    evaluatedPageKeys.push(page.pageKey);
    evaluatedPages += 1;
  }
  if (evaluatedPages !== pages.length || !deadlineHasHeadroom(deadlineMs, clock, 2_000)) {
    return {
      status: 'partial',
      reason: 'analysis_deadline',
      ruleVersion: RULE_VERSION,
      endDate,
      windowDays,
      completedDays,
      requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
      evaluatedPages,
      committedAssessmentPages: 0,
      totalPages: pages.length,
      eligiblePages,
      proposedActions: recommendations.length,
      proposed: 0,
      clearedActions: 0,
      cleared: 0,
      cooldown: cooldownCounts,
      dataQualityBlockedPages,
      decisionBlockedPages,
    };
  }
  const publicationCompletedAt = new Date();
  const publicationAnalysis = {
    status: 'complete',
    reason: 'analysis_complete',
    ruleVersion: RULE_VERSION,
    endDate,
    windowDays,
    completedDays,
    requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
    evaluatedPages,
    committedAssessmentPages: assessmentWrites.length,
    totalPages: pages.length,
    eligiblePages,
    proposedActions: recommendations.length,
    clearedActions: 0,
    cooldown: cooldownCounts,
    dataQualityBlockedPages,
    decisionBlockedPages,
    startedAt: analysisStartedAt || now,
    completedAt: publicationCompletedAt,
  };
  const publication = await publishAnalysisWrites({
    siteUrl,
    pages,
    recommendations,
    evaluatedPageKeys,
    querySafePageKeys,
    eligibleTypesByPage,
    migrationEligibleTypesByPage,
    assessmentWrites,
    syncRunId,
    publicationAnalysis,
    now,
    deadlineMs,
    clock,
  });
  const actions = publication.actions;
  const cleared = publication.cleared;
  const reconciliationComplete = true;
  const assessmentWriteComplete = true;
  const completion = analysisCompletionState({
    evaluatedPages,
    totalPages: pages.length,
    actionUpsertComplete: true,
    reconciliationComplete,
    assessmentWriteComplete,
  });
  return {
    ...completion,
    ruleVersion: RULE_VERSION,
    endDate,
    windowDays,
    completedDays,
    requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
    evaluatedPages,
    committedAssessmentPages: assessmentWriteComplete ? assessmentWrites.length : 0,
    totalPages: pages.length,
    eligiblePages,
    proposedActions: recommendations.length,
    proposed: actions.length,
    clearedActions: cleared,
    cleared,
    cooldown: cooldownCounts,
    dataQualityBlockedPages,
    decisionBlockedPages,
    publicationCommitted: Boolean(publication.publicationAnalysis),
    publicationAnalysis: publication.publicationAnalysis,
  };
}

async function pageMetricForDates({ siteUrl, pageKey, startDate, endDate }) {
  const rows = await SeoPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'page',
    match: { siteUrl, pageKey, date: { $gte: startDate, $lte: endDate } },
    afterLookup: [{
      $group: {
        _id: null,
        clicks: { $sum: '$clicks' },
        impressions: { $sum: '$impressions' },
        positionNumerator: { $sum: '$positionNumerator' },
      },
    }],
  }));
  return metricFromRow(rows[0]);
}

async function deferEvaluation(action, now) {
  await SeoAction.updateOne(
    { _id: action._id, state: 'measuring' },
    {
      $set: {
        lastEvaluationAttemptAt: now,
        nextEvaluationAttemptAt: new Date(now.getTime() + DAY_MS),
      },
    }
  );
}

function safeMeasurementDate(value) {
  const normalized = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

async function lineageAttributionForAction(action) {
  const verification = action.implementationSnapshot?.verification || {};
  const detectorVersionKey = String(verification.detectorVersionKey || '');
  if (!detectorVersionKey) return null;
  const page = await SeoPage.findOne({ pageKey: action.pageKey })
    .select('changeTracking')
    .lean();
  const detector = page?.changeTracking?.detectors?.[action.type];
  if (
    !detector
    || detector.awaitingManifestChange === true
    || detector.awaitingProductionEvidence === true
    || detector.awaitingSourceRecrawl === true
    || detector.sourceRecrawlNotEvaluable === true
    || String(detector.versionKey || '') !== detectorVersionKey
  ) return 'changed';
  const expectedOccurrence = String(verification.detectorOccurrenceKey || '');
  if (expectedOccurrence && String(detector.occurrenceKey || '') !== expectedOccurrence) return 'changed';
  const expectedHashes = Object.entries(verification.componentHashes || {});
  const hashesMatch = expectedHashes.every(([component, expected]) => {
    const current = String(
      detector.changedComponentHashes?.[component]
      || page.changeTracking?.trustedComponentHashes?.[component]
      || page.changeTracking?.componentHashes?.[component]
      || ''
    );
    return current.toLowerCase() === String(expected || '').toLowerCase();
  });
  return hashesMatch ? 'unchanged' : 'changed';
}

async function evaluateDueActions({
  siteUrl,
  latestFinalizedDate,
  now = new Date(),
  captureMetadata = captureLiveMetadataSnapshot,
  deadlineMs = Infinity,
  clock = Date.now,
}) {
  if (!siteUrl || !latestFinalizedDate) return 0;
  const due = await SeoAction.find({
    state: 'measuring',
    measuringUntil: { $lte: new Date(`${latestFinalizedDate}T23:59:59.999Z`) },
    $or: [
      { nextEvaluationAttemptAt: null },
      { nextEvaluationAttemptAt: { $exists: false } },
      { nextEvaluationAttemptAt: { $lte: now } },
    ],
  }).sort({ nextEvaluationAttemptAt: 1, measuringUntil: 1 }).limit(20);
  let evaluated = 0;
  for (const action of due) {
    if (evaluated >= 10) break;
    if (!deadlineHasHeadroom(deadlineMs, clock, 5_000)) break;
    const storedWindow = action.measurementWindow || {};
    const verification = action.implementationSnapshot?.verification || {};
    const afterEnd = safeMeasurementDate(storedWindow.afterEndDate)
      || dateKeyInTimezone(action.measuringUntil, 'America/Los_Angeles');
    const afterStart = safeMeasurementDate(storedWindow.afterStartDate)
      || shiftDateKey(afterEnd, -27);
    const productionAnchor = verification.productionEffectiveAt || action.implementedAt;
    const beforeEnd = safeMeasurementDate(storedWindow.beforeEndDate)
      || shiftDateKey(dateKeyInTimezone(productionAnchor, 'America/Los_Angeles'), -1);
    const beforeStart = safeMeasurementDate(storedWindow.beforeStartDate)
      || shiftDateKey(beforeEnd, -27);
    const technical = action.type === 'technical_indexing';
    let beforeComplete = true;
    let before = { clicks: 0, impressions: 0, position: 0 };
    let afterComplete;
    let after;
    if (technical) {
      [afterComplete, after] = await Promise.all([
        hasContiguousPartitions({ siteUrl, startDate: afterStart, endDate: afterEnd, slice: 'page' }),
        pageMetricForDates({ siteUrl, pageKey: action.pageKey, startDate: afterStart, endDate: afterEnd }),
      ]);
    } else {
      [beforeComplete, afterComplete, before, after] = await Promise.all([
        hasContiguousPartitions({ siteUrl, startDate: beforeStart, endDate: beforeEnd, slice: 'page' }),
        hasContiguousPartitions({ siteUrl, startDate: afterStart, endDate: afterEnd, slice: 'page' }),
        pageMetricForDates({ siteUrl, pageKey: action.pageKey, startDate: beforeStart, endDate: beforeEnd }),
        pageMetricForDates({ siteUrl, pageKey: action.pageKey, startDate: afterStart, endDate: afterEnd }),
      ]);
    }
    if (!deadlineHasHeadroom(deadlineMs, clock, technical ? 1_000 : 10_000)) break;
    const retryWindowExpired = now >= new Date(new Date(action.measuringUntil).getTime() + 14 * DAY_MS);
    let retryExhausted = false;
    if (!beforeComplete || !afterComplete) {
      // A due date is only an earliest evaluation point. Missing finalized
      // partitions are retryable, so keep the action measuring for a later run.
      if (!retryWindowExpired) {
        await deferEvaluation(action, now);
        continue;
      }
      retryExhausted = true;
    }
    const beforeCtr = ratio(before.clicks, before.impressions);
    const afterCtr = ratio(after.clicks, after.impressions);
    let verdict = 'inconclusive';
    let reason = 'The measurement window did not contain enough impressions for a reliable verdict.';
    let attributionStatus = 'unknown';
    const lineageAttribution = await lineageAttributionForAction(action);
    if (retryExhausted) {
      attributionStatus = 'unknown';
    } else if (technical) {
      const verifiedBy = action.implementationSnapshot?.verification?.verifiedBy;
      attributionStatus = lineageAttribution === 'unchanged'
        ? 'verified'
        : lineageAttribution === 'changed'
          ? 'changed'
          : (action.implementationSnapshot?.fields
            || ['gsc-url-inspection-after-deploy', 'manifest-fingerprint-and-gsc-crawl'].includes(verifiedBy))
            ? 'verified'
            : 'unknown';
    } else if (lineageAttribution) {
      attributionStatus = lineageAttribution;
      if (lineageAttribution === 'changed') {
        reason = 'The scoped production fingerprint changed during measurement, so attribution is inconclusive.';
      }
    } else {
      try {
        const currentSnapshot = await captureMetadata(action.canonicalUrl, { now: () => now });
        const comparison = compareMetadataSnapshots(action.implementationSnapshot, currentSnapshot);
        attributionStatus = comparison.status;
        await SeoDiagnosticSnapshot.create({
          siteUrl,
          pageKey: action.pageKey,
          kind: 'liveMetadata',
          observedAt: currentSnapshot.observedAt,
          data: { hash: currentSnapshot.hash, fields: currentSnapshot.fields },
          expiresAt: new Date(now.getTime() + 90 * DAY_MS),
        });
        if (comparison.status === 'changed') {
          reason = `Live metadata changed during measurement (${comparison.changedFields.join(', ')}), so attribution is inconclusive.`;
        }
      } catch {
        attributionStatus = 'unknown';
      }
    }
    if (retryExhausted) {
      reason = 'Required finalized data or verification remained unavailable after the retry window.';
    } else if (action.successCriteria?.ownerDefined) {
      reason = 'Owner-defined success criteria require an owner review.';
    } else if (technical && attributionStatus === 'verified' && action.successCriteria?.metric === 'impressions') {
      const minimum = Math.max(1, Number(action.successCriteria?.minimum || 1));
      verdict = after.impressions >= minimum ? 'success' : 'failed';
      reason = verdict === 'success'
        ? 'The finalized post-implementation window met the technical visibility threshold.'
        : 'The finalized post-implementation window did not reach the technical visibility threshold.';
    } else if (technical && attributionStatus === 'verified' && action.successCriteria?.metric === 'urlInspection') {
      const inspection = await SeoDiagnosticSnapshot.findOne({
        siteUrl,
        pageKey: action.pageKey,
        kind: 'urlInspection',
        observedAt: { $gte: action.measuringUntil || action.implementedAt },
      }).sort({ observedAt: -1 }).select('data observedAt').lean();
      if (!inspection) {
        if (!retryWindowExpired) {
          await deferEvaluation(action, now);
          continue;
        }
        reason = 'A post-implementation URL Inspection result remained unavailable after the retry window.';
      } else {
        const canonicalPass = !action.successCriteria.requireCanonicalMatch
          || inspection.data?.canonicalVerdict === 'match';
        const indexPass = !action.successCriteria.requireIndexPass
          || inspection.data?.indexStatus === 'PASS';
        const robotsPass = !action.successCriteria.requireRobotsAllowed
          || inspection.data?.robots === 'ALLOWED';
        verdict = canonicalPass && indexPass && robotsPass ? 'success' : 'failed';
        reason = verdict === 'success'
          ? 'A post-implementation URL Inspection result met the stored technical criteria.'
          : 'The latest post-implementation URL Inspection result still fails the stored technical criteria.';
      }
    } else if (technical && attributionStatus === 'changed') {
      reason = 'The scoped technical fingerprint changed during measurement, so attribution is inconclusive.';
    } else if (technical) {
      // Verification can arrive on a later page slice or inspection run.
      if (!retryWindowExpired) {
        await deferEvaluation(action, now);
        continue;
      }
      reason = 'Technical implementation verification remained unavailable after the retry window.';
    } else if (attributionStatus !== 'unchanged') {
      if (attributionStatus !== 'changed') {
        if (!retryWindowExpired) {
          await deferEvaluation(action, now);
          continue;
        }
        reason = 'Implementation attribution remained unavailable after the retry window.';
      }
    } else if (before.impressions >= 100 && after.impressions >= 100) {
      const positionGuardrail = after.position <= before.position
        + Number(action.successCriteria?.maximumPositionLoss ?? 1);
      const ctrLift = beforeCtr > 0 ? (afterCtr - beforeCtr) / beforeCtr : 0;
      const clickLift = before.clicks > 0 ? (after.clicks - before.clicks) / before.clicks : 0;
      let success = null;
      if (action.successCriteria?.ownerDefined) success = null;
      else if (action.type === 'ctr_snippet') success = ctrLift >= Number(action.successCriteria?.minimumRelativeLift || 0.15) && positionGuardrail;
      else if (action.type === 'content_decay' && action.successCriteria?.metric === 'clicks') {
        const minimumClicks = Number(action.successCriteria?.minimumClicks);
        success = Number.isFinite(minimumClicks) ? after.clicks >= minimumClicks : null;
      } else if (action.type === 'content_decay' && action.successCriteria?.metric === 'averagePosition') {
        success = after.position <= before.position - Number(action.successCriteria?.minimumImprovement || 1);
      } else if (action.type === 'internal_link') {
        success = after.position <= before.position - Number(action.successCriteria?.minimumImprovement || 1);
      }
      else if (['intent_mismatch', 'manual', 'cannibalization'].includes(action.type)) success = null;
      if (action.type === 'ctr_snippet' && beforeCtr === 0) success = null;
      if (success == null) {
        verdict = 'inconclusive';
        reason = 'This action type requires owner review because the available GSC metrics cannot isolate its success criteria.';
      } else {
        verdict = success ? 'success' : 'failed';
        reason = success
          ? 'The finalized comparison met the action’s primary metric and guardrail.'
          : 'The finalized comparison did not meet the action’s primary success threshold.';
      }
    }
    if (!deadlineHasHeadroom(deadlineMs, clock, 1_000)) break;
    let priorFailedCtrCount = 0;
    if (verdict === 'failed' && action.type === 'ctr_snippet') {
      const totals = await SeoAction.aggregate([
        { $match: { _id: { $ne: action._id }, pageKey: action.pageKey, type: 'ctr_snippet' } },
        { $group: { _id: null, attempts: { $sum: '$failureCount' } } },
      ]);
      priorFailedCtrCount = Number(totals[0]?.attempts || 0);
    }
    action.state = 'evaluated';
    action.experimentLockKey = undefined;
    action.lastEvaluationAttemptAt = now;
    action.nextEvaluationAttemptAt = null;
    action.evaluation = { verdict, evaluatedAt: now, reason, ownerOverride: false };
    action.version += 1;
    if (verdict === 'failed') action.failureCount += 1;
    if (action.type === 'ctr_snippet' && verdict === 'failed' && priorFailedCtrCount + Number(action.failureCount || 0) >= 2) {
      action.suppressedUntil = new Date(now.getTime() + 90 * DAY_MS);
    }
    action.events.push({
      event: 'evaluated',
      at: now,
      fromState: 'measuring',
      toState: 'evaluated',
      note: reason,
    });
    await action.save();
    evaluated += 1;
  }
  return evaluated;
}

module.exports = {
  BALANCED_ANALYSIS_REQUIRED_DAYS,
  BALANCED_ANALYSIS_WINDOW_DAYS,
  SEMANTIC_QUERY_CAP,
  analysisCompletionState,
  AnalysisPublicationError,
  baselineAggregate,
  buildCtrBaselines,
  ctrBaselineForPage,
  dominantQueriesByPage,
  evaluateDueActions,
  internalLinkEvidenceForPage,
  metricFromRow,
  migrationClearTypes,
  pageWindowMetrics,
  positionBucket,
  publishAnalysisWrites,
  requiresTransactionalAnalysisPublication,
  safeAssessmentForPersistence,
  sanitizeDetectorAssessment,
  sanitizeDetectorEvidence,
  semanticCannibalizationByPage,
  semanticClustersWithWeekly,
  subsetCoverage,
  supportsAnalysisTransactions,
  temporalGateForPage,
  hasContiguousPartitions,
  runBalancedAnalysis,
};
