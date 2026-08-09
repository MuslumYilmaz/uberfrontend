'use strict';

const SeoAction = require('../../models/SeoAction');
const SeoDiagnosticSnapshot = require('../../models/SeoDiagnosticSnapshot');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoPage = require('../../models/SeoPage');
const SeoPageAssessment = require('../../models/SeoPageAssessment');
const SeoPageDailyMetric = require('../../models/SeoPageDailyMetric');
const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
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
const { buildSemanticClusters, SEMANTIC_CLUSTER_VERSION } = require('./semantic-clustering');

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
          currentWeek0Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[0].start] }, { $lte: ['$date', weekRanges[0].end] }] }, '$impressions', 0] } },
          currentWeek1Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[1].start] }, { $lte: ['$date', weekRanges[1].end] }] }, '$impressions', 0] } },
          currentWeek2Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[2].start] }, { $lte: ['$date', weekRanges[2].end] }] }, '$impressions', 0] } },
          currentWeek3Impressions: { $sum: { $cond: [{ $and: [{ $gte: ['$date', weekRanges[3].start] }, { $lte: ['$date', weekRanges[3].end] }] }, '$impressions', 0] } },
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
  });
  const found = new Set(dates);
  let completedDays = 0;
  for (let date = endDate; completedDays < maximumDays; date = shiftDateKey(date, -1)) {
    if (!found.has(date)) break;
    completedDays += 1;
  }
  return completedDays;
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
]);
const SAFE_DETECTOR_STATES = new Set(['not_evaluable', 'clear', 'watch', 'actionable']);
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
    return {
      ...result,
      ...finiteEvidenceFields(source, [
        'position',
        'impressions',
        'inboundCount',
        'familyP25',
        'donorPageCount',
      ]),
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
    lower90: Number.isFinite(Number(baseline.lower90)) ? Number(baseline.lower90) : null,
    upper90: Number.isFinite(Number(baseline.upper90)) ? Number(baseline.upper90) : null,
    reasonCodes: Array.isArray(baseline.reasonCodes) ? baseline.reasonCodes.map(String).slice(0, 10) : [],
  };
}

function safeAssessmentForPersistence(packet, detectors) {
  const safeDetectors = safeDetectorMap(detectors);
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
    evidenceLevel: packet.evidenceLevel,
    metrics: packet.metrics,
    coverage: packet.coverage,
    cooldown: packet.cooldown,
    detectorCooldowns: packet.detectorCooldowns,
    ctrBaseline: safeCtrBaseline(packet.ctrBaseline),
    semanticClusters: (packet.semanticClusters || []).map(safeSemanticCluster).slice(0, 10),
    detectorAssessments: safeDetectors,
    findings: Object.values(safeDetectors).filter((finding) => finding.state !== 'clear').map((finding) => ({
      code: finding.reasonCodes[0] || `${finding.detector}_${finding.state}`,
      detector: finding.detector,
      state: finding.state,
      confidence: finding.confidence,
      summary: finding.evidence.summary,
      counterEvidence: finding.state === 'watch' || finding.state === 'clear'
        ? finding.reasonCodes.slice(0, 5)
        : [],
    })),
    counterEvidence: Object.values(safeDetectors)
      .filter((finding) => finding.state === 'watch' || finding.state === 'clear')
      .map((finding) => ({ detector: finding.detector, reasonCodes: finding.reasonCodes.slice(0, 5) })),
    nextReviewDate: packet.nextReviewDate ? new Date(`${packet.nextReviewDate}T00:00:00.000Z`) : null,
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

function migrationClearTypes(detectors = [], cooldown, querySafe = false) {
  const cooldownEligible = eligibleTypesForCooldown(cooldown);
  const clearTypes = new Set();
  for (const detector of detectors || []) {
    const type = detector?.type || detector?.detector;
    if (!type || detector?.state !== 'clear' || !cooldownEligible.has(type)) continue;
    if (['intent_mismatch', 'cannibalization'].includes(type) && !querySafe) continue;
    clearTypes.add(type);
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

async function runBalancedAnalysis({
  siteUrl,
  endDate,
  windowDays = BALANCED_ANALYSIS_WINDOW_DAYS,
  now = new Date(),
  deadlineMs = Infinity,
  clock = Date.now,
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
    semanticByPage.set(page.pageKey, buildSemanticClusters({
      currentRows: queryRows.currentRows,
      previousRows: queryRows.previousRows,
      pageIntent: [intent.targetKeyword, intent.intendedIntent, intent.readerPromise, page.title, page.h1]
        .filter(Boolean).join(' '),
      pageTech: page.tech || '',
      pageCurrentImpressions: windows.current.impressions,
      pagePreviousImpressions: windows.previous.impressions,
      maxQueries: 250,
    }));
  }
  const familyP25 = familyInboundP25(pages);
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
  const inspectionRows = await SeoDiagnosticSnapshot.find({
    kind: 'urlInspection',
    pageKey: { $in: pages.map((page) => page.pageKey) },
    observedAt: { $gte: new Date(now.getTime() - 30 * DAY_MS) },
  }).sort({ observedAt: -1 }).select('pageKey data').lean();
  const latestInspection = new Map();
  for (const row of inspectionRows) {
    if (!latestInspection.has(row.pageKey)) latestInspection.set(row.pageKey, row.data || {});
  }
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
    const inspection = latestInspection.get(page.pageKey) || {};
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
      weekly: weeklyByPage.get(page.pageKey) || {
        current: Array.from({ length: 4 }, () => metricFromRow()),
        previous: Array.from({ length: 4 }, () => metricFromRow()),
      },
      ctrBaseline,
      queryCoverage: queryPartitionsComplete ? queryCoverage : 0,
      semanticCoverage: queryPartitionsComplete ? semanticCoverage : 0,
      semantic,
      semanticClusters: semantic,
      dominantQueryCluster,
      cannibalization: cannibalizationByPage.get(page.pageKey) || null,
      internalLinks: {
        inboundCount: page.internalLinks?.inboundCount || 0,
        donorPageKeys: page.internalLinks?.donorPageKeys || [],
        familyP25: familyP25.get(page.family || 'unknown') || 0,
      },
      technical: {
        pageAgeDays: page.firstSeenAt ? Math.floor((now - new Date(page.firstSeenAt)) / DAY_MS) : 0,
        inspectionIssue: inspection.indexStatus === 'FAIL' || inspection.robots === 'BLOCKED',
        canonicalChanged: inspection.canonicalVerdict === 'mismatch'
          || Boolean(page.renderedCanonicalUrl && page.renderedCanonicalUrl !== page.canonicalUrl),
        canonicalMissing: Boolean(
          page.changeTracking?.fingerprintVersion
          && !String(page.changeTracking.fingerprintVersion).startsWith('legacy-derived')
          && page.changeTracking?.fingerprintEvidence?.statuses?.canonical
          && page.renderedCanonicalUrl === ''
        ),
        manifestRobotsBlocked: page.indexable === true
          && /(?:^|[,\s])(noindex|nofollow|none)(?:$|[,\s])/i.test(String(page.robots || '')),
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
      queryCoverage: queryPartitionsComplete ? queryCoverage : 0,
      semanticCoverage: queryPartitionsComplete ? semanticCoverage : 0,
      semanticClusters: semantic.clusters || [],
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
      .filter((detector) => detector.state === 'actionable' && detector.action)
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
  const actionUpsertProgress = {};
  const actions = await upsertRecommendations(recommendations, now, {
    deadlineMs,
    clock,
    progress: actionUpsertProgress,
  });
  let cleared = 0;
  let reconciliationComplete = false;
  let assessmentWriteComplete = false;
  if (
    evaluatedPages === pages.length
    && actionUpsertProgress.complete === true
    && deadlineHasHeadroom(deadlineMs, clock, 2_000)
  ) {
    const reconciliationProgress = {};
    cleared = await reconcileDetectorRecommendations({
      evaluatedPageKeys,
      recommendations,
      querySafePageKeys,
      eligibleTypesByPage,
      migrationEligibleTypesByPage,
      now,
      deadlineMs,
      clock,
      progress: reconciliationProgress,
    });
    if (reconciliationProgress.complete === true && deadlineHasHeadroom(deadlineMs, clock, 1_000)) {
      await SeoPageAssessment.deleteMany({
        siteUrl,
        pageKey: { $nin: pages.map((page) => page.pageKey) },
      });
      reconciliationComplete = true;
    }
  }
  if (reconciliationComplete && deadlineHasHeadroom(deadlineMs, clock)) {
    if (assessmentWrites.length) {
      await SeoPageAssessment.bulkWrite(assessmentWrites, { ordered: false });
    }
    assessmentWriteComplete = true;
  }
  const completion = analysisCompletionState({
    evaluatedPages,
    totalPages: pages.length,
    actionUpsertComplete: actionUpsertProgress.complete,
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
  analysisCompletionState,
  buildCtrBaselines,
  ctrBaselineForPage,
  dominantQueriesByPage,
  evaluateDueActions,
  metricFromRow,
  migrationClearTypes,
  pageWindowMetrics,
  positionBucket,
  sanitizeDetectorAssessment,
  sanitizeDetectorEvidence,
  semanticCannibalizationByPage,
  hasContiguousPartitions,
  runBalancedAnalysis,
};
