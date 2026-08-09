'use strict';

const SeoAction = require('../../models/SeoAction');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoPage = require('../../models/SeoPage');
const SeoPageAssessment = require('../../models/SeoPageAssessment');
const SeoPageVersion = require('../../models/SeoPageVersion');
const SeoPageDailyMetric = require('../../models/SeoPageDailyMetric');
const SeoPageDeviceDailyMetric = require('../../models/SeoPageDeviceDailyMetric');
const SeoPropertyDailyMetric = require('../../models/SeoPropertyDailyMetric');
const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
const SeoSyncRun = require('../../models/SeoSyncRun');
const SeoSyncState = require('../../models/SeoSyncState');
const { serializeAction } = require('./actions');
const { cooldownsForPage } = require('./assessment');
const {
  BALANCED_ANALYSIS_REQUIRED_DAYS,
  sanitizeDetectorAssessment,
} = require('./analysis');
const { finalizedDateKey, shiftDateKey } = require('./dates');
const { activeMetricPipeline } = require('./metrics-store');
const { analysisInputHashForPage } = require('./manifest');
const { MIN_QUERY_COVERAGE, isKnownReasonCode, reasonSummaryForCode } = require('./rule-engine');

const CURRENT_ANALYSIS_RULE_VERSION = 'balanced-v2.1';
const UNHEALTHY_SYNC_STATUSES = new Set(['failed', 'running', 'waiting', 'disabled']);
const SAFE_SEMANTIC_FACETS = new Set([
  'official_reference', 'direct_answer', 'implementation', 'debugging',
  'comparison', 'interview_prep', 'other',
]);
const SAFE_CLUSTER_TECH = new Set([
  'angular', 'react', 'vue', 'svelte', 'javascript', 'typescript', 'rxjs',
  'node', 'html', 'css',
]);
const SAFE_ASSESSMENT_STATES = new Set(['not_evaluable', 'clear', 'watch', 'actionable']);
const SAFE_EVIDENCE_LEVELS = new Set([
  'insufficient', 'directional', 'moderate', 'strong', 'decision_grade',
]);
const SAFE_COOLDOWN_STATES = new Set(['awaiting_recrawl', 'observing', 'directional', 'eligible']);
const SAFE_COOLDOWN_REASONS = new Set([
  'awaiting_deployment',
  'awaiting_manifest_change',
  'source_dependency_unavailable',
  'awaiting_source_recrawl',
]);
const SAFE_PRODUCTION_PRECISIONS = new Set(['exact', 'upper_bound', 'unknown', 'legacy_baseline']);
const SAFE_PRODUCTION_SOURCES = new Set([
  'manifest_ready_at',
  'runtime_marker_observed',
  'runtime_observed',
  'legacy_baseline',
  'unknown',
]);
const SAFE_CTR_BASELINE_QUALITIES = new Set(['insufficient', 'low', 'medium', 'high']);
const SAFE_CTR_BASELINE_COHORTS = new Set([
  'family+tech+position', 'family+position', 'site+position', 'unavailable',
]);
const SAFE_GIT_DIFF_STATUSES = new Set(['available', 'unavailable']);
const SAFE_GIT_DIFF_SCOPES = new Set([
  'previous_successful_deployment', 'explicit_previous_revision', 'first_parent', 'unavailable',
]);
const SAFE_GIT_DIFF_CONFIDENCES = new Set(['high', 'medium', 'low', 'unavailable']);
const SAFE_GIT_CHANGE_TYPES = new Set([
  'added', 'copied', 'deleted', 'modified', 'renamed', 'type_changed', 'unmerged', 'unknown',
]);
const SAFE_GIT_AREAS = new Set(['backend', 'cdn', 'docs', 'frontend', 'other']);
const SAFE_GIT_CANDIDATE_SIGNALS = new Set([
  'content_source_changed',
  'rendered_application_source_changed',
  'declared_page_date_changed',
  'fingerprint_pipeline_changed',
]);
const SAFE_FINGERPRINT_SOURCES = new Set([
  'prerendered_production_html', 'manifest_only', 'legacy_metadata_only',
]);
const SAFE_FINGERPRINT_LIMITATIONS = new Set([
  'client_only_runtime_content_not_observed',
  'prerendered_html_unavailable',
  'semantic_content_region_unavailable',
  'main_element_unavailable_body_fallback',
  'seo_metadata_fallback_used',
  'robots_http_header_not_observed',
  'main_content_empty',
  'heading_outline_empty',
  'structured_data_invalid',
  'intent_contract_empty',
]);
const SAFE_FINGERPRINT_STATUS_KEYS = new Set([
  'seoMetadata', 'mainContent', 'headingOutline', 'structuredData', 'internalLinks', 'intent',
  'title', 'description', 'canonical', 'robots', 'indexability', 'h1',
]);
const SAFE_FINGERPRINT_STATUSES = new Set(['complete', 'partial', 'unavailable', 'legacy']);
const SAFE_PAGE_FINGERPRINT_VERSIONS = new Set([
  'seo-page-fingerprints.v1', 'seo-page-fingerprints.v2', 'legacy-derived.v1',
]);
const SAFE_ANALYSIS_INPUT_VERSIONS = new Set(['seo-analysis-input.v1']);
const SAFE_SEMANTIC_VERSIONS = new Set(['semantic-v1']);

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function percentDelta(value, previousValue) {
  if (!Number.isFinite(previousValue) || previousValue === 0) return null;
  return round(((value - previousValue) / Math.abs(previousValue)) * 100, 1);
}

function metricValue(value, previousValue) {
  return {
    value: round(value, 4),
    previousValue: Number.isFinite(previousValue) ? round(previousValue, 4) : null,
    deltaPercent: percentDelta(value, previousValue),
  };
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeAnalysis(run, latestFinalizedDate, fallbackCompletedDays = 0) {
  const value = run?.analysis || {};
  const currentForLatestData = Boolean(value.endDate && value.endDate === latestFinalizedDate);
  const ruleVersion = value.ruleVersion || null;
  const persistedCompletedDays = Number.isFinite(Number(value.completedDays))
    ? Number(value.completedDays)
    : 0;
  const currentCompletedDays = Number.isFinite(Number(fallbackCompletedDays))
    ? Number(fallbackCompletedDays)
    : 0;
  const totalPages = Number(value.totalPages || 0);
  const evaluatedPages = Number(value.evaluatedPages || 0);
  let status = String(value.status || 'not_ready');
  let reason = String(value.reason || (run ? 'not_run' : 'not_run'));
  const terminalOrInFlightFailure = status === 'failed' || status === 'running';
  const productionMarkerFailure = status === 'not_ready'
    && /^production_marker_[a-z0-9_]+$/.test(reason);
  if (run && !currentForLatestData && !terminalOrInFlightFailure && !productionMarkerFailure) {
    status = 'not_ready';
    reason = 'latest_data_not_analyzed';
  } else if (run && !terminalOrInFlightFailure && ruleVersion !== CURRENT_ANALYSIS_RULE_VERSION) {
    status = 'not_ready';
    reason = 'analysis_rule_outdated';
  } else if (status === 'complete' && evaluatedPages < totalPages) {
    status = 'partial';
    reason = reason || 'page_evaluation_incomplete';
  }
  return {
    status,
    reason,
    ruleVersion,
    endDate: value.endDate || null,
    currentForLatestData,
    completedDays: Math.max(persistedCompletedDays, currentCompletedDays),
    requiredDays: Number(value.requiredDays || BALANCED_ANALYSIS_REQUIRED_DAYS),
    evaluatedPages,
    committedAssessmentPages: Number(value.committedAssessmentPages || 0),
    totalPages,
    eligiblePages: Number(value.eligiblePages || 0),
    proposedActions: Number(value.proposedActions || 0),
    clearedActions: Number(value.clearedActions || 0),
    cooldown: {
      awaitingRecrawl: Number(value.cooldown?.awaitingRecrawl || 0),
      observing: Number(value.cooldown?.observing || 0),
      directional: Number(value.cooldown?.directional || 0),
      eligible: Number(value.cooldown?.eligible || 0),
    },
    dataQualityBlockedPages: Number(value.dataQualityBlockedPages || 0),
    decisionBlockedPages: Number(value.decisionBlockedPages || 0),
    startedAt: isoOrNull(value.startedAt),
    completedAt: isoOrNull(value.completedAt),
  };
}

function enforceAnalysisReadiness(summary, {
  currentManifestPages,
  currentAssessmentPages,
  syncStatus,
  stale = false,
} = {}) {
  const value = { ...(summary || {}) };
  const assessmentPages = Number(currentAssessmentPages);
  if (Number.isInteger(assessmentPages) && assessmentPages >= 0) {
    // This is the committed Mongo row count, not the number merely evaluated
    // in memory. Partial/deadline runs can therefore report an honest X/Y.
    value.committedAssessmentPages = assessmentPages;
  }
  if (value.status !== 'complete') return value;

  const manifestPages = Number(currentManifestPages);
  const manifestCountKnown = Number.isInteger(manifestPages) && manifestPages >= 0;
  if (manifestCountKnown && (
    Number(value.totalPages) !== manifestPages
    || Number(value.evaluatedPages) !== manifestPages
  )) {
    return { ...value, status: 'not_ready', reason: 'manifest_changed_since_analysis' };
  }
  if (
    manifestCountKnown
    && Number.isInteger(assessmentPages)
    && assessmentPages >= 0
    && assessmentPages !== manifestPages
  ) {
    return { ...value, status: 'not_ready', reason: 'page_assessments_incomplete' };
  }
  if (stale) {
    return { ...value, status: 'not_ready', reason: 'finalized_data_stale' };
  }
  if (UNHEALTHY_SYNC_STATUSES.has(String(syncStatus || ''))) {
    return { ...value, status: 'not_ready', reason: 'sync_unhealthy' };
  }
  return value;
}

async function latestAnalysisSummary(siteUrl, latestFinalizedDate, fallbackCompletedDays) {
  if (!siteUrl) return serializeAnalysis(null, latestFinalizedDate, fallbackCompletedDays);
  const run = await SeoSyncRun.findOne({
    siteUrl,
    'analysis.status': { $exists: true },
  }).sort({ startedAt: -1, 'analysis.completedAt': -1 }).select('analysis').lean();
  return serializeAnalysis(run, latestFinalizedDate, fallbackCompletedDays);
}

async function currentPageAssessmentCount(siteUrl, endDate) {
  if (!siteUrl || !endDate) return 0;
  const rows = await SeoPageAssessment.aggregate([
    { $match: { siteUrl, endDate, ruleVersion: CURRENT_ANALYSIS_RULE_VERSION } },
    {
      $lookup: {
        from: 'seo_pages',
        localField: 'pageKey',
        foreignField: 'pageKey',
        as: 'page',
      },
    },
    { $unwind: '$page' },
    { $match: { 'page.manifest.present': true } },
    {
      $match: {
        $expr: {
          $and: [
            {
              $or: [
                { $eq: [{ $ifNull: ['$page.changeTracking.materialChangedAt', null] }, null] },
                { $gte: ['$evaluatedAt', '$page.changeTracking.materialChangedAt'] },
              ],
            },
            {
              $or: [
                { $eq: [{ $ifNull: ['$page.changeTracking.analysisInvalidatedAt', null] }, null] },
                { $gte: ['$evaluatedAt', '$page.changeTracking.analysisInvalidatedAt'] },
              ],
            },
            {
              $or: [
                { $eq: [{ $ifNull: ['$page.changeTracking.currentVersionKey', ''] }, ''] },
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$page.changeTracking.analysisInputHash', ''] }, ''] },
                    {
                      $eq: [
                        { $ifNull: ['$inputHash', ''] },
                        { $ifNull: ['$page.changeTracking.analysisInputHash', ''] },
                      ],
                    },
                    {
                      $eq: [
                        { $ifNull: ['$pageVersionKey', ''] },
                        { $ifNull: ['$page.changeTracking.currentVersionKey', ''] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    { $count: 'count' },
  ]);
  return Number(rows[0]?.count || 0);
}

async function currentAnalysisReadiness({ config, dataHealth }) {
  const [latestAnalysis, currentManifestPages, currentAssessmentPages] = await Promise.all([
    latestAnalysisSummary(
      config.siteUrl,
      dataHealth.latestFinalizedDate,
      dataHealth.recommendationReadiness?.completedDays
    ),
    SeoPage.countDocuments({ 'manifest.present': true }),
    currentPageAssessmentCount(config.siteUrl, dataHealth.latestFinalizedDate),
  ]);
  return enforceAnalysisReadiness(latestAnalysis, {
    currentManifestPages,
    currentAssessmentPages,
    syncStatus: dataHealth.syncStatus,
    stale: dataHealth.stale,
  });
}

function aggregateMetricRows(rows) {
  const clicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const positionNumerator = rows.reduce((sum, row) => sum + Number(row.positionNumerator || 0), 0);
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    averagePosition: impressions > 0 ? positionNumerator / impressions : 0,
  };
}

async function metricRowsForRange({ siteUrl, startDate, endDate, segment }) {
  const useQueryFacts = segment === 'brand' || segment === 'nonbrand';
  const Model = useQueryFacts ? SeoQueryPageDailyMetric : SeoPropertyDailyMetric;
  const slice = useQueryFacts ? 'queryPage' : 'property';
  const match = {
    siteUrl,
    date: { $gte: startDate, $lte: endDate },
    ...(useQueryFacts ? { segment } : {}),
  };
  return Model.aggregate(activeMetricPipeline({
    slice,
    match,
    afterLookup: [
      {
        $group: {
          _id: '$date',
          clicks: { $sum: '$clicks' },
          impressions: { $sum: '$impressions' },
          positionNumerator: { $sum: '$positionNumerator' },
        },
      },
      { $sort: { _id: 1 } },
    ],
  }));
}

function fillTrend(rows, startDate, endDate, availableDates = null) {
  const byDate = new Map(rows.map((row) => [row._id, row]));
  const trend = [];
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) {
    if (availableDates && !availableDates.has(date)) continue;
    const row = byDate.get(date) || { clicks: 0, impressions: 0, positionNumerator: 0 };
    const totals = aggregateMetricRows([row]);
    trend.push({ date, ...totals });
  }
  return trend;
}

function windowCompleteness(partitions, startDate, endDate) {
  const completeDates = new Set(
    (partitions || []).filter((partition) => partition.status === 'complete').map((partition) => partition.date)
  );
  let expectedDays = 0;
  let availableDays = 0;
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) {
    expectedDays += 1;
    if (completeDates.has(date)) availableDays += 1;
  }
  return { complete: availableDays === expectedDays, availableDays, expectedDays, completeDates };
}

function contiguousDateCount(dateSet, endDate, maximumDays) {
  if (!endDate || maximumDays <= 0) return 0;
  let completedDays = 0;
  for (let date = endDate; completedDays < maximumDays; date = shiftDateKey(date, -1)) {
    if (!dateSet.has(date)) break;
    completedDays += 1;
  }
  return completedDays;
}

function nextScheduledSyncAt(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(4, 15, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

function detailCoverageHealth({
  pagePartitions = [],
  detailPartitions = [],
  startDate,
  endDate,
  sufficientThreshold,
} = {}) {
  const expectedDates = startDate && endDate ? dateKeys(startDate, endDate) : [];
  const pageByDate = new Map(pagePartitions.map((partition) => [partition.date, partition]));
  const detailByDate = new Map(detailPartitions.map((partition) => [partition.date, partition]));
  let completedDays = 0;
  let truncatedDays = 0;
  let pageImpressions = 0;
  let detailImpressions = 0;
  let inconsistentDay = false;

  const complete = (partition) => partition?.status === 'complete' && !partition?.truncated;
  const truncated = (partition) => partition?.status === 'truncated' || partition?.truncated === true;
  for (const date of expectedDates) {
    const pagePartition = pageByDate.get(date);
    const detailPartition = detailByDate.get(date);
    if (complete(pagePartition) && complete(detailPartition)) {
      completedDays += 1;
      const pageDayImpressions = Number(pagePartition.impressions || 0);
      const detailDayImpressions = Number(detailPartition.impressions || 0);
      pageImpressions += pageDayImpressions;
      detailImpressions += detailDayImpressions;
      if (
        (pageDayImpressions <= 0 && detailDayImpressions > 0)
        || detailDayImpressions > pageDayImpressions * 1.000001
      ) inconsistentDay = true;
    } else if (truncated(pagePartition) || truncated(detailPartition)) {
      truncatedDays += 1;
    }
  }

  const requiredDays = expectedDates.length;
  const missingDays = Math.max(0, requiredDays - completedDays - truncatedDays);
  const coverage = pageImpressions > 0 ? detailImpressions / pageImpressions : null;
  const inconsistent = inconsistentDay
    || (pageImpressions <= 0 && detailImpressions > 0)
    || (Number.isFinite(coverage) && coverage > 1.000001);
  let status = 'sufficient';
  if (inconsistent) status = 'inconsistent';
  else if (completedDays === 0) status = 'unavailable';
  else if (completedDays !== requiredDays || truncatedDays > 0) status = 'partial';
  else if (!Number.isFinite(coverage) || coverage < sufficientThreshold) status = 'limited';

  return {
    coveragePercent: Number.isFinite(coverage) ? round(coverage * 100, 1) : null,
    status,
    sufficient: status === 'sufficient',
    window: {
      startDate: startDate || null,
      endDate: endDate || null,
      completedDays,
      requiredDays,
      truncatedDays,
      missingDays,
      complete: requiredDays > 0 && completedDays === requiredDays && truncatedDays === 0,
    },
  };
}

async function getDataHealth({ config, now = new Date() }) {
  const [state, latestPartition] = await Promise.all([
    config.siteUrl ? SeoSyncState.findOne({ stateKey: `gsc:${config.siteUrl}` }).lean() : null,
    config.siteUrl ? SeoMetricPartition.findOne({ siteUrl: config.siteUrl, slice: 'property' }).sort({ date: -1 }).lean() : null,
  ]);
  const expectedFinalized = finalizedDateKey(now, config.finalizedLagDays);
  const latestFinalizedDate = latestPartition?.date || null;
  const stale = !latestFinalizedDate || latestFinalizedDate < shiftDateKey(expectedFinalized, -2);
  const initialEnd = state?.recentBackfillEndDate || latestFinalizedDate;
  const initialStart = state?.recentBackfillStartDate || (initialEnd ? shiftDateKey(initialEnd, -(config.initialBackfillDays - 1)) : null);
  const analysisStart = initialEnd
    ? shiftDateKey(initialEnd, -(BALANCED_ANALYSIS_REQUIRED_DAYS - 1))
    : null;
  const coverageStart = initialStart && analysisStart
    ? (initialStart < analysisStart ? initialStart : analysisStart)
    : initialStart || analysisStart;
  const pagePartitionsForReadiness = coverageStart && initialEnd
    ? await SeoMetricPartition.find({
      siteUrl: config.siteUrl,
      slice: 'page',
      status: { $in: ['complete', 'truncated'] },
      date: { $gte: coverageStart, $lte: initialEnd },
    }).select('date status').lean()
    : [];
  const importedPageDateSet = new Set(pagePartitionsForReadiness.map((partition) => partition.date));
  const completePageDateSet = new Set(
    pagePartitionsForReadiness
      .filter((partition) => partition.status === 'complete')
      .map((partition) => partition.date)
  );
  const completedInitialDays = contiguousDateCount(
    importedPageDateSet,
    initialEnd,
    config.initialBackfillDays
  );
  const completedAnalysisDays = contiguousDateCount(
    completePageDateSet,
    initialEnd,
    BALANCED_ANALYSIS_REQUIRED_DAYS
  );
  const backfillPercent = config.initialBackfillDays > 0
    ? round((completedInitialDays / config.initialBackfillDays) * 100, 1)
    : 0;
  const backfillComplete = Boolean(state?.recentBackfillComplete)
    || completedInitialDays >= config.initialBackfillDays;
  const running = state?.leaseExpiresAt && new Date(state.leaseExpiresAt) > now;
  const syncStatus = !config.enabled
    ? 'disabled'
    : !config.configured ? 'waiting'
      : running ? 'running'
        : state?.lastError ? 'failed' : 'idle';
  const warning = !config.storageBudgetBytes
    ? 'SEO storage budget is not configured; detailed ingestion is paused.'
    : state?.storageLevel === 'unknown' ? 'Storage measurement is unavailable; detailed query and device ingestion is paused.'
    : stale ? `Finalized Search Console data is stale. Dates follow ${config.sourceTimezone}.`
      : state?.storageLevel === 'detail_paused' ? 'Detailed query and device ingestion is paused at the storage guardrail.'
        : state?.lastError || null;

  const healthStart = latestFinalizedDate ? shiftDateKey(latestFinalizedDate, -27) : null;
  const [queryPartitions, devicePartitions, pagePartitions] = healthStart ? await Promise.all([
    SeoMetricPartition.find({ siteUrl: config.siteUrl, slice: 'queryPage', date: { $gte: healthStart, $lte: latestFinalizedDate } }).lean(),
    SeoMetricPartition.find({ siteUrl: config.siteUrl, slice: 'devicePage', date: { $gte: healthStart, $lte: latestFinalizedDate } }).lean(),
    SeoMetricPartition.find({ siteUrl: config.siteUrl, slice: 'page', date: { $gte: healthStart, $lte: latestFinalizedDate } }).lean(),
  ]) : [[], [], []];
  const queryCoverage = detailCoverageHealth({
    pagePartitions,
    detailPartitions: queryPartitions,
    startDate: healthStart,
    endDate: latestFinalizedDate,
    sufficientThreshold: MIN_QUERY_COVERAGE,
  });
  const deviceCoverage = detailCoverageHealth({
    pagePartitions,
    detailPartitions: devicePartitions,
    startDate: healthStart,
    endDate: latestFinalizedDate,
    sufficientThreshold: 0.9,
  });

  return {
    siteUrl: config.siteUrl || '',
    latestFinalizedDate,
    lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ? new Date(state.lastSuccessfulSyncAt).toISOString() : null,
    nextScheduledSyncAt: nextScheduledSyncAt(now),
    backfillPercent,
    backfill: {
      completedDays: completedInitialDays,
      expectedDays: config.initialBackfillDays,
      percent: backfillPercent,
      nextDate: backfillComplete ? null : state?.recentCursorDate || initialEnd,
      complete: backfillComplete,
    },
    recommendationReadiness: {
      completedDays: completedAnalysisDays,
      requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS,
      ready: completedAnalysisDays >= BALANCED_ANALYSIS_REQUIRED_DAYS,
    },
    queryCoveragePercent: queryCoverage.coveragePercent,
    queryCoverageStatus: queryCoverage.status,
    queryCoverageSufficient: queryCoverage.sufficient,
    queryCoverageWindow: queryCoverage.window,
    deviceCoveragePercent: deviceCoverage.coveragePercent,
    deviceCoverageStatus: deviceCoverage.status,
    deviceCoverageSufficient: deviceCoverage.sufficient,
    deviceCoverageWindow: deviceCoverage.window,
    storageUsedBytes: Number.isFinite(state?.storageBytes) ? state.storageBytes : null,
    storageBudgetBytes: config.storageBudgetBytes || null,
    truncated: [...queryPartitions, ...devicePartitions, ...pagePartitions]
      .some((partition) => partition.status === 'truncated' || partition.truncated),
    stale,
    syncStatus,
    warning,
  };
}

async function getOverview({ config, windowDays = 28, segment = 'all', now = new Date() }) {
  const dataHealth = await getDataHealth({ config, now });
  const analysis = await currentAnalysisReadiness({ config, dataHealth });
  const endDate = dataHealth.latestFinalizedDate || finalizedDateKey(now, config.finalizedLagDays);
  const startDate = shiftDateKey(endDate, -(windowDays - 1));
  const previousEndDate = shiftDateKey(startDate, -1);
  const previousStartDate = shiftDateKey(previousEndDate, -(windowDays - 1));
  const slice = segment === 'brand' || segment === 'nonbrand' ? 'queryPage' : 'property';
  const [currentRows, previousRows, counts, partitions] = await Promise.all([
    config.siteUrl ? metricRowsForRange({ siteUrl: config.siteUrl, startDate, endDate, segment }) : [],
    config.siteUrl ? metricRowsForRange({ siteUrl: config.siteUrl, startDate: previousStartDate, endDate: previousEndDate, segment }) : [],
    SeoAction.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
    ]),
    config.siteUrl ? SeoMetricPartition.find({
      siteUrl: config.siteUrl,
      slice,
      date: { $gte: previousStartDate, $lte: endDate },
    }).select('date status').lean() : [],
  ]);
  const currentWindow = windowCompleteness(partitions, startDate, endDate);
  const previousWindow = windowCompleteness(partitions, previousStartDate, previousEndDate);
  dataHealth.windowCompleteness = {
    slice,
    current: {
      complete: currentWindow.complete,
      availableDays: currentWindow.availableDays,
      expectedDays: currentWindow.expectedDays,
    },
    previous: {
      complete: previousWindow.complete,
      availableDays: previousWindow.availableDays,
      expectedDays: previousWindow.expectedDays,
    },
  };
  if (!currentWindow.complete) {
    const partialWarning = `Current ${windowDays}-day ${segment} window is partial (${currentWindow.availableDays}/${currentWindow.expectedDays} finalized days).`;
    dataHealth.warning = dataHealth.warning ? `${dataHealth.warning} ${partialWarning}` : partialWarning;
  } else if (!previousWindow.complete) {
    const comparisonWarning = `Previous ${windowDays}-day comparison is incomplete; KPI deltas are withheld.`;
    dataHealth.warning = dataHealth.warning ? `${dataHealth.warning} ${comparisonWarning}` : comparisonWarning;
  }
  const usableCurrentRows = currentRows.filter((row) => currentWindow.completeDates.has(row._id));
  const usablePreviousRows = previousRows.filter((row) => previousWindow.completeDates.has(row._id));
  const current = aggregateMetricRows(usableCurrentRows);
  const previous = currentWindow.complete && previousWindow.complete
    ? aggregateMetricRows(usablePreviousRows)
    : null;
  const countMap = Object.fromEntries(counts.map((entry) => [entry._id, entry.count]));

  return {
    generatedAt: now.toISOString(),
    windowDays,
    segment,
    dataHealth,
    analysis,
    kpis: {
      clicks: metricValue(current.clicks, previous?.clicks),
      impressions: metricValue(current.impressions, previous?.impressions),
      ctr: metricValue(current.ctr, previous?.ctr),
      averagePosition: metricValue(current.averagePosition, previous?.averagePosition),
    },
    trend: fillTrend(usableCurrentRows, startDate, endDate, currentWindow.completeDates),
    actionSummary: {
      nowCount: (countMap.proposed || 0) + (countMap.approved || 0) + (countMap.implementation_pending || 0),
      backlogCount: Object.values(countMap).reduce((sum, count) => sum + count, 0),
      measuringCount: countMap.measuring || 0,
    },
  };
}

function encodeOffset(offset) {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

function decodeOffset(cursor) {
  if (!cursor) return 0;
  try {
    const value = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    return Number.isInteger(value.offset) && value.offset >= 0 ? value.offset : 0;
  } catch {
    return 0;
  }
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listActions({ queue = 'backlog', status, type, search, cursor, limit = 30 }) {
  const filter = {};
  if (status && status !== 'all') filter.state = status;
  if (type && type !== 'all') filter.type = type;
  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim().slice(0, 200)), 'i');
    filter.$or = [{ canonicalUrl: pattern }, { summary: pattern }, { hypothesis: pattern }];
  }
  const nowFilter = { state: { $in: ['proposed', 'approved', 'implementation_pending'] } };
  const topDocs = await SeoAction.find(nowFilter).sort({ priorityScore: -1, createdAt: -1 }).limit(10).select('_id').lean();
  const topIds = topDocs.map((doc) => doc._id);
  if (queue === 'now') {
    Object.assign(filter, nowFilter);
  } else if (topIds.length) {
    filter._id = { $nin: topIds };
  }
  const offset = decodeOffset(cursor);
  const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const [total, actions] = await Promise.all([
    SeoAction.countDocuments(filter),
    SeoAction.find(filter).sort({ priorityScore: -1, createdAt: -1, _id: -1 }).skip(offset).limit(boundedLimit).lean(),
  ]);
  const pages = await SeoPage.find({ pageKey: { $in: actions.map((action) => action.pageKey) } }).select('pageKey title').lean();
  const pageMap = new Map(pages.map((page) => [page.pageKey, page]));
  return {
    items: actions.map((action) => serializeAction(action, pageMap.get(action.pageKey))),
    total,
    nextCursor: offset + actions.length < total ? encodeOffset(offset + actions.length) : null,
  };
}

function serializePage(page, metrics = null) {
  const value = typeof page?.toObject === 'function' ? page.toObject() : { ...(page || {}) };
  const intent = value.intent || {};
  const summary = {
    pageKey: value.pageKey,
    canonicalUrl: value.canonicalUrl,
    path: value.path || '',
    family: value.family || null,
    tech: value.tech || null,
    title: value.title || null,
    h1: value.h1 || null,
    intendedIntent: intent.intendedIntent || null,
    intentSource: intent.source || null,
    intentConfirmed: Boolean(intent.confirmed),
  };
  if (metrics) Object.assign(summary, aggregateMetricRows(metrics));
  return summary;
}

async function metricsByPage({ siteUrl, pageKeys, startDate, endDate }) {
  if (!siteUrl || !pageKeys.length) return new Map();
  const rows = await SeoPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'page',
    match: { siteUrl, pageKey: { $in: pageKeys }, date: { $gte: startDate, $lte: endDate } },
    afterLookup: [{
      $group: {
        _id: '$pageKey',
        clicks: { $sum: '$clicks' },
        impressions: { $sum: '$impressions' },
        positionNumerator: { $sum: '$positionNumerator' },
      },
    }],
  }));
  return new Map(rows.map((row) => [row._id, [row]]));
}

async function latestCompleteDate(siteUrl, slice = 'page') {
  if (!siteUrl) return null;
  const partition = await SeoMetricPartition.findOne({ siteUrl, slice, status: 'complete' }).sort({ date: -1 }).select('date').lean();
  return partition?.date || null;
}

async function pageMetricWindow({ config, now = new Date(), windowDays = 28 }) {
  const latestPartition = config.siteUrl
    ? await SeoMetricPartition.findOne({ siteUrl: config.siteUrl, slice: 'page' })
      .sort({ date: -1 })
      .select('date')
      .lean()
    : null;
  const endDate = latestPartition?.date || finalizedDateKey(now, config.finalizedLagDays);
  const startDate = shiftDateKey(endDate, -(windowDays - 1));
  const partitions = config.siteUrl
    ? await SeoMetricPartition.find({
      siteUrl: config.siteUrl,
      slice: 'page',
      date: { $gte: startDate, $lte: endDate },
    }).select('date status').lean()
    : [];
  const completeness = windowCompleteness(partitions, startDate, endDate);
  return {
    startDate,
    endDate,
    complete: completeness.complete,
    availableDays: completeness.availableDays,
    expectedDays: completeness.expectedDays,
  };
}

async function listPages({ config, search, intentConfirmed, cursor, limit = 30, now = new Date() }) {
  const filter = { 'manifest.present': true };
  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim().slice(0, 200)), 'i');
    filter.$or = [{ canonicalUrl: pattern }, { title: pattern }, { 'intent.intendedIntent': pattern }];
  }
  if (typeof intentConfirmed === 'boolean') filter['intent.confirmed'] = intentConfirmed;
  const offset = decodeOffset(cursor);
  const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const [total, pages] = await Promise.all([
    SeoPage.countDocuments(filter),
    SeoPage.find(filter).sort({ canonicalUrl: 1, _id: 1 }).skip(offset).limit(boundedLimit).lean(),
  ]);
  const metricWindow = await pageMetricWindow({ config, now });
  const metricMap = metricWindow.complete
    ? await metricsByPage({
      siteUrl: config.siteUrl,
      pageKeys: pages.map((page) => page.pageKey),
      startDate: metricWindow.startDate,
      endDate: metricWindow.endDate,
    })
    : new Map();
  return {
    items: pages.map((page) => serializePage(
      page,
      metricWindow.complete ? (metricMap.get(page.pageKey) || []) : null
    )),
    total,
    nextCursor: offset + pages.length < total ? encodeOffset(offset + pages.length) : null,
    metricWindow,
  };
}

function dateKeys(startDate, endDate) {
  const dates = [];
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) dates.push(date);
  return dates;
}

async function pageSliceRowsForDates({ Model, slice, siteUrl, pageKey, dates }) {
  if (!siteUrl || !pageKey || !dates.length) return [];
  return Model.aggregate(activeMetricPipeline({
    slice,
    match: { siteUrl, pageKey, date: { $in: dates } },
    afterLookup: [
      {
        $group: {
          _id: '$date',
          clicks: { $sum: '$clicks' },
          impressions: { $sum: '$impressions' },
          positionNumerator: { $sum: '$positionNumerator' },
        },
      },
      { $sort: { _id: 1 } },
    ],
  }));
}

function metricPayload(rows) {
  const metric = aggregateMetricRows(rows || []);
  return {
    clicks: round(metric.clicks, 2),
    impressions: round(metric.impressions, 2),
    ctr: round(metric.ctr, 6),
    averagePosition: round(metric.averagePosition, 2),
  };
}

function partitionWindowPayload({ startDate, endDate, expectedDates, completeDates, truncatedDates }) {
  const completedDays = completeDates.length;
  const requiredDays = expectedDates.length;
  return {
    startDate,
    endDate,
    completedDays,
    requiredDays,
    truncatedDays: truncatedDates.length,
    missingDays: Math.max(0, requiredDays - completedDays - truncatedDates.length),
    complete: requiredDays > 0 && completedDays === requiredDays && truncatedDates.length === 0,
  };
}

function reconciliationSubset({
  detailRows,
  sameDayPageRows,
  fullPageRows,
  partitionWindow,
  sufficientThreshold,
}) {
  const metrics = metricPayload(detailRows);
  const sameDayPage = aggregateMetricRows(sameDayPageRows);
  const fullPage = aggregateMetricRows(fullPageRows);
  const hasUsableDates = partitionWindow.completedDays > 0;
  const coverage = sameDayPage.impressions > 0
    ? metrics.impressions / sameDayPage.impressions
    : null;
  const fullWindowLowerBound = fullPage.impressions > 0
    ? metrics.impressions / fullPage.impressions
    : null;
  const sameDayPageByDate = new Map();
  for (const row of sameDayPageRows || []) {
    const date = typeof row?._id === 'string' ? row._id : typeof row?.date === 'string' ? row.date : null;
    if (!date) continue;
    sameDayPageByDate.set(date, (sameDayPageByDate.get(date) || 0) + Number(row.impressions || 0));
  }
  const hasDatedDetailRows = (detailRows || []).some((row) => (
    typeof row?._id === 'string' || typeof row?.date === 'string'
  ));
  const inconsistentDate = hasDatedDetailRows && (detailRows || []).some((row) => {
    const date = typeof row?._id === 'string' ? row._id : typeof row?.date === 'string' ? row.date : null;
    if (!date) return false;
    const detailImpressions = Number(row.impressions || 0);
    const pageImpressions = Number(sameDayPageByDate.get(date) || 0);
    return (pageImpressions <= 0 && detailImpressions > 0)
      || detailImpressions > pageImpressions * 1.000001;
  });
  const impossibleZeroDenominator = sameDayPage.impressions <= 0 && metrics.impressions > 0;
  const inconsistent = inconsistentDate || impossibleZeroDenominator
    || (Number.isFinite(coverage) && coverage > 1.000001);
  let status = 'sufficient';
  if (!hasUsableDates) status = 'unavailable';
  else if (inconsistent) status = 'inconsistent';
  else if (!partitionWindow.complete) status = 'partial';
  else if (!Number.isFinite(coverage) || coverage < sufficientThreshold) status = 'limited';
  return {
    metrics: hasUsableDates ? metrics : null,
    coveragePercent: Number.isFinite(coverage) ? round(coverage * 100, 1) : null,
    fullWindowLowerBoundPercent: Number.isFinite(fullWindowLowerBound)
      ? round(fullWindowLowerBound * 100, 1)
      : null,
    coverageSufficient: status === 'sufficient',
    status,
    partitionWindow,
  };
}

async function pageReconciliation({ config, pageKey, metricWindow }) {
  const expectedDates = dateKeys(metricWindow.startDate, metricWindow.endDate);
  const partitions = await SeoMetricPartition.find({
    siteUrl: config.siteUrl,
    slice: { $in: ['page', 'queryPage', 'devicePage'] },
    date: { $gte: metricWindow.startDate, $lte: metricWindow.endDate },
  }).select('date slice status truncated').lean();
  const bySlice = new Map(['page', 'queryPage', 'devicePage'].map((slice) => [slice, []]));
  for (const partition of partitions) bySlice.get(partition.slice)?.push(partition);
  const pageCompleteDates = bySlice.get('page')
    .filter((partition) => partition.status === 'complete' && !partition.truncated)
    .map((partition) => partition.date);
  const pageDateSet = new Set(pageCompleteDates);
  const detailDates = (slice) => bySlice.get(slice)
    .filter((partition) => partition.status === 'complete' && !partition.truncated && pageDateSet.has(partition.date))
    .map((partition) => partition.date);
  const truncatedDates = (slice) => bySlice.get(slice)
    .filter((partition) => partition.status === 'truncated' || partition.truncated)
    .map((partition) => partition.date);
  const queryDates = detailDates('queryPage');
  const deviceDates = detailDates('devicePage');
  const [fullPageRows, queryPageRows, queryRows, devicePageRows, deviceRows] = await Promise.all([
    pageSliceRowsForDates({ Model: SeoPageDailyMetric, slice: 'page', siteUrl: config.siteUrl, pageKey, dates: pageCompleteDates }),
    pageSliceRowsForDates({ Model: SeoPageDailyMetric, slice: 'page', siteUrl: config.siteUrl, pageKey, dates: queryDates }),
    pageSliceRowsForDates({ Model: SeoQueryPageDailyMetric, slice: 'queryPage', siteUrl: config.siteUrl, pageKey, dates: queryDates }),
    pageSliceRowsForDates({ Model: SeoPageDailyMetric, slice: 'page', siteUrl: config.siteUrl, pageKey, dates: deviceDates }),
    pageSliceRowsForDates({ Model: SeoPageDeviceDailyMetric, slice: 'devicePage', siteUrl: config.siteUrl, pageKey, dates: deviceDates }),
  ]);
  const pagePartitionWindow = partitionWindowPayload({
    startDate: metricWindow.startDate,
    endDate: metricWindow.endDate,
    expectedDates,
    completeDates: pageCompleteDates,
    truncatedDates: truncatedDates('page'),
  });
  const queryPartitionWindow = partitionWindowPayload({
    startDate: metricWindow.startDate,
    endDate: metricWindow.endDate,
    expectedDates,
    completeDates: queryDates,
    truncatedDates: truncatedDates('queryPage'),
  });
  const devicePartitionWindow = partitionWindowPayload({
    startDate: metricWindow.startDate,
    endDate: metricWindow.endDate,
    expectedDates,
    completeDates: deviceDates,
    truncatedDates: truncatedDates('devicePage'),
  });
  return {
    window: { startDate: metricWindow.startDate, endDate: metricWindow.endDate, days: expectedDates.length },
    pageTotal: {
      metrics: pageCompleteDates.length ? metricPayload(fullPageRows) : null,
      status: pagePartitionWindow.complete ? 'complete' : pageCompleteDates.length ? 'partial' : 'unavailable',
      partitionWindow: pagePartitionWindow,
    },
    visibleQuerySubset: reconciliationSubset({
      detailRows: queryRows,
      sameDayPageRows: queryPageRows,
      fullPageRows,
      partitionWindow: queryPartitionWindow,
      sufficientThreshold: MIN_QUERY_COVERAGE,
    }),
    visibleDeviceSubset: reconciliationSubset({
      detailRows: deviceRows,
      sameDayPageRows: devicePageRows,
      fullPageRows,
      partitionWindow: devicePartitionWindow,
      sufficientThreshold: 0.9,
    }),
  };
}

function serializeSemanticCluster(cluster = {}) {
  const rawFacet = String(cluster.facet || cluster.dominantFacet || '').trim().toLowerCase();
  const facet = SAFE_SEMANTIC_FACETS.has(rawFacet) ? rawFacet : 'other';
  const rawTech = String(cluster.tech || '').trim().toLowerCase();
  const tech = SAFE_CLUSTER_TECH.has(rawTech) ? rawTech : '';
  const current = cluster.current && typeof cluster.current === 'object' ? cluster.current : cluster;
  return {
    key: /^[a-f0-9]{64}$/i.test(String(cluster.key || cluster.clusterKey || ''))
      ? String(cluster.key || cluster.clusterKey).toLowerCase()
      : null,
    label: [tech, facet.replaceAll('_', ' ')].filter(Boolean).join(' · '),
    facet,
    clicks: Number(current.clicks || 0),
    impressions: Number(current.impressions || 0),
    ctr: Number(current.ctr || 0),
    averagePosition: Number(current.averagePosition ?? current.position ?? 0),
    visibleShare: Number.isFinite(Number(current.visibleShare ?? current.impressionShare))
      ? Number(current.visibleShare ?? current.impressionShare)
      : null,
    fullPageLowerBoundShare: Number.isFinite(Number(current.fullPageLowerBoundShare))
      ? Number(current.fullPageLowerBoundShare)
      : null,
    topicAlignment: Number.isFinite(Number(cluster.topicAlignment)) ? Number(cluster.topicAlignment) : null,
    sourcePreferenceShare: Number.isFinite(Number(cluster.sourcePreferenceShare))
      ? Number(cluster.sourcePreferenceShare)
      : null,
  };
}

function serializeDetectorAssessments(assessments = {}) {
  return Object.fromEntries(Object.entries(assessments || {}).flatMap(([detector, assessment]) => {
    const safe = sanitizeDetectorAssessment(detector, assessment);
    return safe ? [[detector, safe]] : [];
  }));
}

function finiteNumberOrNull(value, { minimum = -Infinity, maximum = Infinity } = {}) {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
    ? value
    : null;
}

function safeDateKey(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function safeHashKey(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function safeDeploymentId(value) {
  const normalized = String(value || '').trim();
  // The dashboard currently runs on Vercel. Only expose Vercel's opaque ID
  // shape at the API boundary; custom/free-form deployment labels remain
  // persisted for correlation but cannot become a legacy-record text leak.
  return /^dpl_[A-Za-z0-9]{8,196}$/.test(normalized) ? normalized : null;
}

function safePageKeys(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map(safeHashKey)
    .filter(Boolean)))
    .slice(0, 20);
}

function safeAssessmentMetric(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clicks = finiteNumberOrNull(value.clicks, { minimum: 0 });
  const impressions = finiteNumberOrNull(value.impressions, { minimum: 0 });
  const position = finiteNumberOrNull(value.position, { minimum: 0 });
  if (clicks === null && impressions === null && position === null) return null;
  return { clicks, impressions, position };
}

function safeAssessmentMetrics(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    current: safeAssessmentMetric(value.current),
    previous: safeAssessmentMetric(value.previous),
  };
}

function safeAssessmentCoverage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    query: finiteNumberOrNull(value.query, { minimum: 0 }),
    semantic: finiteNumberOrNull(value.semantic, { minimum: 0 }),
  };
}

function safeCooldown(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawState = String(value.state || value.status || 'eligible');
  const state = SAFE_COOLDOWN_STATES.has(rawState) ? rawState : 'eligible';
  const detector = LINEAGE_DETECTORS.includes(String(value.detector || ''))
    ? String(value.detector)
    : null;
  const reason = SAFE_COOLDOWN_REASONS.has(String(value.reason || ''))
    ? String(value.reason)
    : null;
  const precision = String(value.productionPrecision || 'unknown');
  const source = String(value.productionSource || 'unknown');
  return {
    state,
    status: state,
    reason,
    detector,
    changedComponents: safeLineageComponents(value.changedComponents),
    changedAt: isoOrNull(value.changedAt),
    materialChangedAt: isoOrNull(value.materialChangedAt),
    productionEffectiveAt: isoOrNull(value.productionEffectiveAt),
    changeEffectiveAt: isoOrNull(value.changeEffectiveAt),
    productionPrecision: SAFE_PRODUCTION_PRECISIONS.has(precision) ? precision : 'unknown',
    productionSource: SAFE_PRODUCTION_SOURCES.has(source) ? source : 'unknown',
    lastGoogleCrawlAt: isoOrNull(value.lastGoogleCrawlAt),
    confirmedCrawlAt: isoOrNull(value.confirmedCrawlAt),
    cleanFinalizedDays: finiteNumberOrNull(value.cleanFinalizedDays, { minimum: 0 }),
    cleanWindowStartDate: safeDateKey(value.cleanWindowStartDate),
    decisionDataThrough: safeDateKey(value.decisionDataThrough),
    nextReviewDate: safeDateKey(value.nextReviewDate),
    dependencyPageKeys: safePageKeys(value.dependencyPageKeys),
    unverifiableDependencyPageKeys: safePageKeys(value.unverifiableDependencyPageKeys),
  };
}

function safeDetectorCooldowns(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(LINEAGE_DETECTORS.flatMap((detector) => {
    const cooldown = safeCooldown(value[detector]);
    return cooldown ? [[detector, cooldown]] : [];
  }));
}

function safeCtrBaseline(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawQuality = typeof value.quality === 'object' && value.quality
    ? value.quality.level
    : value.quality;
  const quality = SAFE_CTR_BASELINE_QUALITIES.has(String(rawQuality || value.level || ''))
    ? String(rawQuality || value.level)
    : 'insufficient';
  const rawCohort = String(value.cohort || 'unavailable');
  return {
    ctr: finiteNumberOrNull(value.ctr, { minimum: 0, maximum: 1 }),
    cohort: SAFE_CTR_BASELINE_COHORTS.has(rawCohort) ? rawCohort : 'unavailable',
    quality,
    eligible: value.eligible === true && ['medium', 'high'].includes(quality),
    peerPageCount: finiteNumberOrNull(value.peerPageCount, { minimum: 0 }),
    peerClicks: finiteNumberOrNull(value.peerClicks, { minimum: 0 }),
    peerImpressions: finiteNumberOrNull(value.peerImpressions, { minimum: 0 }),
    zeroClickPeerShare: finiteNumberOrNull(value.zeroClickPeerShare, { minimum: 0, maximum: 1 }),
    lower90: finiteNumberOrNull(value.lower90, { minimum: 0, maximum: 1 }),
    upper90: finiteNumberOrNull(value.upper90, { minimum: 0, maximum: 1 }),
    reasonCodes: Array.from(new Set((Array.isArray(value.reasonCodes) ? value.reasonCodes : [])
      .map(String)
      .filter(isKnownReasonCode)))
      .slice(0, 10),
  };
}

function serializeAssessment(assessment, latestFinalizedDate, {
  materialChangedAt = null,
  analysisInvalidatedAt = null,
  analysisInputHash = '',
  pageVersionKey = '',
  analysisReadiness = null,
} = {}) {
  if (!assessment) return null;
  const value = typeof assessment.toObject === 'function' ? assessment.toObject() : assessment;
  const clusters = Array.isArray(value.semanticClusters) ? value.semanticClusters : [];
  const findings = Array.isArray(value.findings) ? value.findings : [];
  const counterEvidence = Array.isArray(value.counterEvidence) ? value.counterEvidence : [];
  const cooldown = safeCooldown(value.cooldown);
  const detectorCooldowns = safeDetectorCooldowns(value.detectorCooldowns);
  const cooldownState = cooldown?.state || 'eligible';
  const findingCode = (finding) => {
    const code = String(finding?.code || finding?.reasonCodes?.[0] || '');
    return isKnownReasonCode(code) ? code : null;
  };
  const knownFindings = findings.filter((finding) => findingCode(finding));
  const primaryFinding = knownFindings.find((finding) => finding.state === 'actionable')
    || knownFindings.find((finding) => finding.state === 'watch')
    || knownFindings.find((finding) => finding.state === 'not_evaluable')
    || knownFindings[0]
    || null;
  const primaryFindingCode = findingCode(primaryFinding);
  const safePrimaryState = SAFE_ASSESSMENT_STATES.has(String(value.primaryState))
    ? String(value.primaryState)
    : 'not_evaluable';
  const verdict = cooldownState === 'awaiting_recrawl'
    ? 'awaiting_recrawl'
    : ['observing', 'directional'].includes(cooldownState) ? 'observing_change'
      : primaryFindingCode || safePrimaryState;
  const detectorAssessments = serializeDetectorAssessments(value.detectorAssessments);
  const evaluatedAt = value.evaluatedAt ? new Date(value.evaluatedAt) : null;
  const materialChangeDate = materialChangedAt ? new Date(materialChangedAt) : null;
  const invalidatedAt = analysisInvalidatedAt ? new Date(analysisInvalidatedAt) : null;
  const freshnessCutoff = [materialChangeDate, invalidatedAt]
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((left, right) => right - left)[0] || null;
  const assessmentAfterMaterialChange = !freshnessCutoff
    || Boolean(evaluatedAt && !Number.isNaN(evaluatedAt.getTime()) && evaluatedAt >= freshnessCutoff);
  const versionedInputCurrent = !pageVersionKey || Boolean(
    analysisInputHash
    && value.inputHash === analysisInputHash
    && value.pageVersionKey === pageVersionKey
  );
  const globallyCurrent = !analysisReadiness || Boolean(
    analysisReadiness.status === 'complete'
    && analysisReadiness.currentForLatestData === true
  );
  const currentForLatestData = Boolean(
    value.endDate
    && value.endDate === latestFinalizedDate
    && value.ruleVersion === CURRENT_ANALYSIS_RULE_VERSION
    && assessmentAfterMaterialChange
    && versionedInputCurrent
    && globallyCurrent
  );
  const reasonCodes = Array.from(new Set([
    ...findings.map((finding) => finding.code),
    ...Object.values(detectorAssessments).flatMap((detector) => detector.reasonCodes || []),
  ].filter((code) => isKnownReasonCode(code)))).slice(0, 20);
  const safeFindings = findings.flatMap((finding) => {
    const code = String(finding.code || finding.reasonCodes?.[0] || '');
    if (!isKnownReasonCode(code)) return [];
    const detector = LINEAGE_DETECTORS.includes(String(finding.detector || ''))
      ? String(finding.detector)
      : null;
    const state = SAFE_ASSESSMENT_STATES.has(String(finding.state))
      ? String(finding.state)
      : 'not_evaluable';
    const confidence = finiteNumberOrNull(finding.confidence, { minimum: 0, maximum: 1 });
    return [{
      code,
      detector,
      state,
      confidence: confidence ?? 0,
      summary: reasonSummaryForCode(code),
      counterEvidence: Array.isArray(finding.counterEvidence)
        ? finding.counterEvidence.map(String).filter(isKnownReasonCode).slice(0, 10)
        : [],
    }];
  });
  const safeCounterEvidence = counterEvidence.flatMap((finding) => {
    const code = String(finding.code || finding.reasonCodes?.[0] || '');
    if (!isKnownReasonCode(code)) return [];
    const detector = LINEAGE_DETECTORS.includes(String(finding.detector || ''))
      ? String(finding.detector)
      : null;
    return [{
      detector,
      state: 'clear',
      code,
      summary: reasonSummaryForCode(code),
      counterEvidence: Array.isArray(finding.reasonCodes)
        ? finding.reasonCodes.map(String).filter(isKnownReasonCode).slice(0, 10)
        : [],
    }];
  });
  return {
    primaryState: safePrimaryState,
    verdict,
    summary: reasonSummaryForCode(primaryFindingCode || ''),
    confidence: finiteNumberOrNull(primaryFinding?.confidence, { minimum: 0, maximum: 1 }) ?? 0,
    reasonCodes,
    evidenceLevel: SAFE_EVIDENCE_LEVELS.has(String(value.evidenceLevel))
      ? String(value.evidenceLevel)
      : 'insufficient',
    ruleVersion: value.ruleVersion === CURRENT_ANALYSIS_RULE_VERSION ? CURRENT_ANALYSIS_RULE_VERSION : null,
    semanticVersion: SAFE_SEMANTIC_VERSIONS.has(String(value.semanticVersion))
      ? String(value.semanticVersion)
      : null,
    endDate: safeDateKey(value.endDate),
    currentForLatestData,
    input: {
      version: SAFE_ANALYSIS_INPUT_VERSIONS.has(String(value.inputVersion))
        ? String(value.inputVersion)
        : null,
      hash: safeHashKey(value.inputHash),
      pageVersionKey: safeHashKey(value.pageVersionKey),
      valid: versionedInputCurrent,
    },
    metrics: safeAssessmentMetrics(value.metrics),
    coverage: safeAssessmentCoverage(value.coverage),
    findings: safeFindings,
    counterEvidence: safeCounterEvidence,
    detectorAssessments,
    cooldown,
    detectorCooldowns,
    ctrBaseline: safeCtrBaseline(value.ctrBaseline),
    semanticClusters: clusters.map(serializeSemanticCluster).slice(0, 10),
    nextReviewDate: isoOrNull(value.nextReviewDate),
    evaluatedAt: isoOrNull(value.evaluatedAt),
    updatedAt: isoOrNull(value.updatedAt),
  };
}

const LINEAGE_DETECTORS = Object.freeze([
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
  'internal_link',
  'technical_indexing',
]);

function safeGitSha(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{7,64}$/.test(normalized) ? normalized : null;
}

function safeLineageComponents(values = []) {
  const allowed = new Set([
    'title', 'description', 'h1', 'mainContent', 'headingOutline', 'intent',
    'internalLinks', 'canonical', 'robots', 'indexability', 'structuredData',
  ]);
  return Array.from(new Set((Array.isArray(values) ? values : []).map(String)))
    .filter((value) => allowed.has(value));
}

function safeGitCandidate(value = {}) {
  const safeMap = (input, allowedKeys) => Object.fromEntries(Object.entries(
    input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  ).flatMap(([key, count]) => (
    allowedKeys.has(key) && Number.isFinite(Number(count))
      ? [[key, Math.max(0, Math.min(Number(count), 100_000))]]
      : []
  )).slice(0, 20));
  const safeTokens = (input, maximum, allowedTokens) => Array.from(new Set((Array.isArray(input) ? input : [])
    .map((item) => String(item || '').trim())
    .filter((item) => allowedTokens.has(item))))
    .slice(0, maximum);
  const rawStatus = String(value.status || 'unavailable');
  const rawScope = String(value.scope || value.diffBaseKind || 'unavailable');
  const rawConfidence = String(value.confidence || value.diffBaseConfidence || 'unavailable');
  const status = SAFE_GIT_DIFF_STATUSES.has(rawStatus) ? rawStatus : 'unavailable';
  const scope = SAFE_GIT_DIFF_SCOPES.has(rawScope) ? rawScope : 'unavailable';
  const confidence = SAFE_GIT_DIFF_CONFIDENCES.has(rawConfidence) ? rawConfidence : 'unavailable';
  const candidateSignals = safeTokens(
    value.candidateSignals || value.signals,
    30,
    SAFE_GIT_CANDIDATE_SIGNALS
  );
  return {
    authority: 'corroborating_only',
    status,
    scope,
    confidence,
    diffBaseKind: scope,
    diffBaseConfidence: confidence,
    changedFileCount: Number(value.changedFileCount || 0),
    returnedEntryCount: Number(value.returnedEntryCount || 0),
    entryLimit: Number(value.entryLimit || 0),
    truncated: value.truncated === true,
    changeTypes: safeMap(value.changeTypes, SAFE_GIT_CHANGE_TYPES),
    areas: safeMap(value.areas, SAFE_GIT_AREAS),
    candidateSignals,
    signals: candidateSignals,
  };
}

function safeFingerprintEvidence(value = {}) {
  const statuses = value.statuses && typeof value.statuses === 'object' && !Array.isArray(value.statuses)
    ? value.statuses
    : {};
  const rawSource = String(value.source || 'manifest_only');
  return {
    source: SAFE_FINGERPRINT_SOURCES.has(rawSource) ? rawSource : 'manifest_only',
    prerenderedAvailable: value.prerenderedAvailable === true,
    limitations: Array.from(new Set((Array.isArray(value.limitations) ? value.limitations : []).map(String)))
      .filter((code) => SAFE_FINGERPRINT_LIMITATIONS.has(code))
      .slice(0, 20),
    statuses: Object.fromEntries(Object.entries(statuses).flatMap(([key, status]) => (
      SAFE_FINGERPRINT_STATUS_KEYS.has(key) && SAFE_FINGERPRINT_STATUSES.has(String(status))
        ? [[key, String(status)]]
        : []
    ))),
  };
}

function serializeProductionEvidence(value = {}) {
  const source = String(value.source || 'unknown');
  const precision = String(value.precision || 'unknown');
  return {
    effectiveAt: isoOrNull(value.effectiveAt),
    precision: SAFE_PRODUCTION_PRECISIONS.has(precision) ? precision : 'unknown',
    source: SAFE_PRODUCTION_SOURCES.has(source) ? source : 'unknown',
    deploymentId: safeDeploymentId(value.deploymentId),
    gitCommitSha: safeGitSha(value.gitCommitSha),
    gitDiffBaseSha: safeGitSha(value.gitDiffBaseSha),
  };
}

function serializeLineage({
  page,
  versions = [],
  assessment = null,
  endDate = null,
  analysisReadiness = null,
} = {}) {
  const tracking = page?.changeTracking || {};
  const detectorCooldowns = cooldownsForPage({ page, endDate });
  const currentVersion = (versions || []).find((version) => (
    version.occurrenceKey === tracking.currentOccurrenceKey
  )) || (versions || []).find((version) => version.versionKey === tracking.currentVersionKey) || null;
  const production = serializeProductionEvidence(tracking.production || currentVersion?.production || {});
  const lastGoogleCrawlAt = isoOrNull(tracking.lastGoogleCrawlAt);
  const effectiveAt = production.effectiveAt ? new Date(production.effectiveAt) : null;
  const crawlAt = lastGoogleCrawlAt ? new Date(lastGoogleCrawlAt) : null;
  const gitCandidate = safeGitCandidate(
    tracking.production?.gitCandidate || currentVersion?.production?.gitCandidate || {}
  );
  const lastObservedPrecision = String(tracking.lastObservedDeployment?.precision || 'unknown');
  const lastObservedSource = String(tracking.lastObservedDeployment?.source || 'unknown');
  const lastObservedDeployment = tracking.lastObservedDeployment ? {
    deploymentId: safeDeploymentId(tracking.lastObservedDeployment.deploymentId),
    observedAt: isoOrNull(tracking.lastObservedDeployment.observedAt),
    effectiveAt: isoOrNull(tracking.lastObservedDeployment.effectiveAt),
    precision: SAFE_PRODUCTION_PRECISIONS.has(lastObservedPrecision) ? lastObservedPrecision : 'unknown',
    source: SAFE_PRODUCTION_SOURCES.has(lastObservedSource) ? lastObservedSource : 'unknown',
    gitCommitSha: safeGitSha(tracking.lastObservedDeployment.gitCommitSha),
  } : null;
  const assessmentInputValid = !tracking.currentVersionKey || Boolean(
    tracking.analysisInputHash
    && assessment?.inputHash === tracking.analysisInputHash
    && assessment?.pageVersionKey === tracking.currentVersionKey
  );
  const assessmentCurrent = Boolean(
    assessment
    && assessmentInputValid
    && assessment.ruleVersion === CURRENT_ANALYSIS_RULE_VERSION
    && (!endDate || assessment.endDate === endDate)
    && (!analysisReadiness || (
      analysisReadiness.status === 'complete'
      && analysisReadiness.currentForLatestData === true
    ))
  );
  return {
    currentVersion: tracking.currentVersionKey ? {
      versionKey: safeHashKey(tracking.currentVersionKey),
      occurrenceKey: safeHashKey(tracking.currentOccurrenceKey),
      inputHash: safeHashKey(tracking.analysisInputHash),
      fingerprintVersion: SAFE_PAGE_FINGERPRINT_VERSIONS.has(String(tracking.fingerprintVersion))
        ? String(tracking.fingerprintVersion)
        : null,
      observedAt: isoOrNull(currentVersion?.observedAt || tracking.baselineSeededAt),
      changedComponents: safeLineageComponents(currentVersion?.changedComponents || tracking.changedFields),
      manifest: {
        version: (currentVersion?.manifest?.version || page.manifestVersion) === 'seo-page-manifest.v1'
          ? 'seo-page-manifest.v1'
          : null,
        sourceHash: safeHashKey(currentVersion?.manifest?.sourceHash || page.manifest?.sourceHash),
        generatedAt: isoOrNull(currentVersion?.manifest?.generatedAt || page.manifest?.generatedAt),
      },
      production,
      fingerprintEvidence: safeFingerprintEvidence(
        tracking.fingerprintEvidence || currentVersion?.fingerprintEvidence || {}
      ),
      gitCandidate,
      crawl: {
        lastGoogleCrawlAt,
        confirmedAfterProduction: Boolean(crawlAt && effectiveAt && crawlAt > effectiveAt),
        confirmedAt: isoOrNull(currentVersion?.crawl?.confirmedAt),
      },
    } : null,
    gitCandidate,
    lastObservedDeployment,
    timeline: (versions || []).slice(0, 12).map((version) => {
      const precision = String(version.production?.precision || 'unknown');
      const source = String(version.production?.source || 'unknown');
      return {
        versionKey: safeHashKey(version.versionKey),
        occurrenceKey: safeHashKey(version.occurrenceKey),
        inputHash: safeHashKey(version.inputHash),
        observedAt: isoOrNull(version.observedAt),
        effectiveAt: isoOrNull(version.production?.effectiveAt),
        precision: SAFE_PRODUCTION_PRECISIONS.has(precision) ? precision : 'unknown',
        source: SAFE_PRODUCTION_SOURCES.has(source) ? source : 'unknown',
        changedComponents: safeLineageComponents(version.changedComponents),
        affectedDetectors: (version.affectedDetectors || []).map(String)
          .filter((detector) => LINEAGE_DETECTORS.includes(detector)),
        deploymentId: safeDeploymentId(version.production?.deploymentId),
        gitCommitSha: safeGitSha(version.production?.gitCommitSha),
        gitCandidate: safeGitCandidate(version.production?.gitCandidate || {}),
        crawlConfirmedAt: isoOrNull(version.crawl?.confirmedAt),
        googleCrawlAt: isoOrNull(version.crawl?.googleCrawlAt),
        crawlConfirmedDetectors: (version.crawl?.confirmedDetectors || []).map(String)
          .filter((detector) => LINEAGE_DETECTORS.includes(detector)),
      };
    }),
    detectorStates: Object.fromEntries(LINEAGE_DETECTORS.map((detector) => {
      const change = tracking.detectors?.[detector] || null;
      const cooldown = detectorCooldowns[detector] || { state: 'eligible' };
      const precision = String(change?.productionPrecision || 'unknown');
      const source = String(change?.productionSource || 'unknown');
      return [detector, {
        affected: Boolean(change),
        versionKey: safeHashKey(change?.versionKey),
        occurrenceKey: safeHashKey(change?.occurrenceKey),
        changedComponents: safeLineageComponents(change?.changedComponents),
        changeEffectiveAt: isoOrNull(change?.productionEffectiveAt),
        productionPrecision: SAFE_PRODUCTION_PRECISIONS.has(precision) ? precision : 'unknown',
        productionSource: SAFE_PRODUCTION_SOURCES.has(source) ? source : 'unknown',
        implementationReportedAt: isoOrNull(change?.implementationReportedAt),
        awaitingManifestChange: change?.awaitingManifestChange === true,
        awaitingProductionEvidence: change?.awaitingProductionEvidence === true,
        awaitingSourceRecrawl: change?.awaitingSourceRecrawl === true,
        sourceRecrawlNotEvaluable: change?.sourceRecrawlNotEvaluable === true,
        expectedChangedComponents: safeLineageComponents(change?.expectedChangedComponents),
        dependencyPageKeys: safePageKeys(change?.dependencyPageKeys),
        unverifiableDependencyPageKeys: safePageKeys(change?.unverifiableDependencyPageKeys),
        crawlRequired: change?.crawlConfirmationRequired === true,
        crawlConfirmed: Boolean(change && change.crawlConfirmationRequired !== true && change.confirmedCrawlAt),
        lastGoogleCrawlAt,
        confirmedCrawlAt: isoOrNull(change?.confirmedCrawlAt),
        cooldown: safeCooldown(cooldown),
      }];
    })),
    assessmentInput: {
      version: SAFE_ANALYSIS_INPUT_VERSIONS.has(String(assessment?.inputVersion))
        ? String(assessment.inputVersion)
        : null,
      semanticVersion: SAFE_SEMANTIC_VERSIONS.has(String(assessment?.semanticVersion))
        ? String(assessment.semanticVersion)
        : null,
      ruleVersion: assessment?.ruleVersion === CURRENT_ANALYSIS_RULE_VERSION
        ? CURRENT_ANALYSIS_RULE_VERSION
        : null,
      hash: safeHashKey(assessment?.inputHash),
      pageVersionKey: safeHashKey(assessment?.pageVersionKey),
      currentHash: safeHashKey(tracking.analysisInputHash),
      currentPageVersionKey: safeHashKey(tracking.currentVersionKey),
      valid: assessmentInputValid,
      current: assessmentCurrent,
    },
  };
}

async function getPageDetail({ config, pageKey, now = new Date() }) {
  const page = await SeoPage.findOne({ pageKey }).lean();
  if (!page) return null;
  const [metricWindow, dataHealth] = await Promise.all([
    pageMetricWindow({ config, now }),
    getDataHealth({ config, now }),
  ]);
  const analysis = await currentAnalysisReadiness({ config, dataHealth });
  const [metricRows, actions, storedAssessment, reconciliation, versions] = await Promise.all([
    metricWindow.complete
      ? SeoPageDailyMetric.aggregate(activeMetricPipeline({
        slice: 'page',
        match: {
          siteUrl: config.siteUrl,
          pageKey,
          date: { $gte: metricWindow.startDate, $lte: metricWindow.endDate },
        },
        afterLookup: [{ $sort: { date: 1 } }],
      }))
      : Promise.resolve(null),
    SeoAction.find({ pageKey }).sort({ createdAt: -1 }).limit(20).lean(),
    SeoPageAssessment.findOne({ siteUrl: config.siteUrl, pageKey }).lean(),
    pageReconciliation({ config, pageKey, metricWindow }),
    SeoPageVersion.find({ siteUrl: config.siteUrl, pageKey })
      .sort({ observedAt: -1, _id: -1 })
      .limit(12)
      .lean(),
  ]);
  const detail = serializePage(page, metricRows);
  const assessment = serializeAssessment(storedAssessment, metricWindow.endDate, {
    materialChangedAt: page.changeTracking?.materialChangedAt || null,
    analysisInvalidatedAt: page.changeTracking?.analysisInvalidatedAt || null,
    analysisInputHash: page.changeTracking?.analysisInputHash || '',
    pageVersionKey: page.changeTracking?.currentVersionKey || '',
    analysisReadiness: analysis,
  });
  return {
    ...detail,
    description: page.description || null,
    readerPromise: page.intent?.readerPromise || null,
    targetKeyword: page.intent?.targetKeyword || null,
    intentSource: page.intent?.source || null,
    indexable: Boolean(page.indexable),
    outboundLinks: page.outboundLinks || [],
    recentActions: actions.map((action) => serializeAction(action, page)),
    analysis,
    assessment,
    lineage: serializeLineage({
      page,
      versions,
      assessment: storedAssessment,
      endDate: metricWindow.endDate,
      analysisReadiness: analysis,
    }),
    reconciliation,
    updatedAt: page.updatedAt ? new Date(page.updatedAt).toISOString() : null,
    metricWindow,
    ...(metricWindow.complete ? {
      trend: fillTrend(metricRows.map((row) => ({
        _id: row.date,
        clicks: row.clicks,
        impressions: row.impressions,
        positionNumerator: row.positionNumerator,
      })), metricWindow.startDate, metricWindow.endDate),
    } : {}),
  };
}

async function getActionById(actionId) {
  const action = await SeoAction.findById(actionId).lean();
  if (!action) return null;
  const page = await SeoPage.findOne({ pageKey: action.pageKey }).select('title').lean();
  return serializeAction(action, page);
}

async function updatePageIntent(pageKey, input, now = new Date()) {
  const intendedIntent = String(input?.intendedIntent || '').trim();
  if (!intendedIntent) {
    const error = new Error('intendedIntent is required');
    error.status = 400;
    error.code = 'SEO_INTENT_INVALID';
    throw error;
  }
  const page = await SeoPage.findOne({ pageKey }).lean();
  if (!page) return null;
  const nextIntent = {
    ...(page.intent || {}),
    intendedIntent,
    readerPromise: String(input?.readerPromise || '').trim(),
    targetKeyword: String(input?.targetKeyword || '').trim(),
    confirmed: Boolean(input?.intentConfirmed),
    source: 'owner',
    confirmedAt: input?.intentConfirmed ? now : null,
  };
  const intentUnchanged = page.intent?.source === 'owner'
    && page.intent?.intendedIntent === nextIntent.intendedIntent
    && String(page.intent?.readerPromise || '') === nextIntent.readerPromise
    && String(page.intent?.targetKeyword || '') === nextIntent.targetKeyword
    && Boolean(page.intent?.confirmed) === nextIntent.confirmed;
  if (intentUnchanged) return page;
  const analysisInputHash = analysisInputHashForPage({ ...page, intent: nextIntent });
  const filter = { pageKey };
  if (page.updatedAt) filter.updatedAt = page.updatedAt;
  const updated = await SeoPage.findOneAndUpdate(
    filter,
    {
      $set: {
        'intent.intendedIntent': intendedIntent,
        'intent.readerPromise': String(input?.readerPromise || '').trim(),
        'intent.targetKeyword': String(input?.targetKeyword || '').trim(),
        'intent.confirmed': Boolean(input?.intentConfirmed),
        'intent.source': 'owner',
        'intent.confirmedAt': input?.intentConfirmed ? now : null,
        // An intent edit changes an analysis input even when the page's
        // rendered metadata is unchanged. Keep a monotonic freshness marker
        // so an in-flight analysis cannot make the retained prior packet look
        // current after an owner intent edit.
        'changeTracking.analysisInvalidatedAt': now,
        'changeTracking.analysisInputHash': analysisInputHash,
      },
    },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) {
    const error = new Error('Page intent changed since it was loaded');
    error.status = 409;
    error.code = 'SEO_INTENT_CONFLICT';
    throw error;
  }
  return updated;
}

module.exports = {
  aggregateMetricRows,
  contiguousDateCount,
  currentPageAssessmentCount,
  decodeOffset,
  detailCoverageHealth,
  encodeOffset,
  enforceAnalysisReadiness,
  getActionById,
  getDataHealth,
  getOverview,
  getPageDetail,
  latestAnalysisSummary,
  listActions,
  listPages,
  latestCompleteDate,
  pageMetricWindow,
  metricRowsForRange,
  pageReconciliation,
  reconciliationSubset,
  serializeAnalysis,
  serializeAssessment,
  serializeLineage,
  serializePage,
  updatePageIntent,
};
