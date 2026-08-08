'use strict';

const crypto = require('crypto');
const SeoSyncRun = require('../../models/SeoSyncRun');
const SeoSyncState = require('../../models/SeoSyncState');
const SeoAction = require('../../models/SeoAction');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoPage = require('../../models/SeoPage');
const SeoPageAssessment = require('../../models/SeoPageAssessment');
const SeoPageVersion = require('../../models/SeoPageVersion');
const SeoPageDailyMetric = require('../../models/SeoPageDailyMetric');
const SeoDiagnosticSnapshot = require('../../models/SeoDiagnosticSnapshot');
const { activatePendingMeasurements, activateTechnicalMeasurementsFromInspections } = require('./actions');
const {
  BALANCED_ANALYSIS_REQUIRED_DAYS,
  BALANCED_ANALYSIS_WINDOW_DAYS,
  evaluateDueActions,
  runBalancedAnalysis,
} = require('./analysis');
const { expiryFromNow, finalizedDateKey, shiftDateKey } = require('./dates');
const { createGscClient } = require('./gsc-client');
const {
  detectorEffectiveAt,
  hasPendingCrawl,
  inspectUrlCandidates,
  resolveInternalLinkSourceRecrawls,
} = require('./diagnostics');
const { pageKeyForUrl } = require('./keys');
const { fetchProductionBuildMarker, syncSeoManifest } = require('./manifest');
const {
  estimateSeoStorageBytes,
  activeMetricPipeline,
  invalidateDetailPartitions,
  pruneMetricHistoryBefore,
  storageLevel,
  updateDeviceCoverage,
  updateQueryCoverage,
  writeSliceGeneration,
} = require('./metrics-store');

class SeoSyncError extends Error {
  constructor(message, status = 500, code = 'SEO_SYNC_FAILED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const ANALYSIS_STATUSES = new Set(['running', 'not_ready', 'partial', 'complete', 'failed']);
const ANALYSIS_RULE_VERSION = 'balanced-v2.1';
const DEFAULT_ANALYSIS_DEADLINE_MS = 55_000;

function nonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

function safeAnalysisReason(value, fallback = '') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized.slice(0, 160) || fallback;
}

function emptyCooldownCounts(input = {}) {
  return {
    awaitingRecrawl: nonNegativeCount(input.awaitingRecrawl),
    observing: nonNegativeCount(input.observing),
    directional: nonNegativeCount(input.directional),
    eligible: nonNegativeCount(input.eligible),
  };
}

async function analysisReadiness({ siteUrl, endDate, requiredDays = BALANCED_ANALYSIS_REQUIRED_DAYS }) {
  if (!siteUrl || !endDate) return { completedDays: 0, requiredDays };
  const startDate = shiftDateKey(endDate, -(requiredDays - 1));
  const dates = await SeoMetricPartition.distinct('date', {
    siteUrl,
    slice: 'page',
    status: 'complete',
    date: { $gte: startDate, $lte: endDate },
  });
  const completeDates = new Set(dates);
  let completedDays = 0;
  for (let date = endDate; completedDays < requiredDays; date = shiftDateKey(date, -1)) {
    if (!completeDates.has(date)) break;
    completedDays += 1;
  }
  return { completedDays, requiredDays };
}

function analysisSummary({
  result = {},
  endDate,
  readiness = {},
  totalPages = 0,
  startedAt,
  completedAt = new Date(),
} = {}) {
  const evaluatedPages = nonNegativeCount(result.evaluatedPages);
  const resolvedTotalPages = nonNegativeCount(result.totalPages ?? totalPages);
  const reason = safeAnalysisReason(result.reason);
  let status = ANALYSIS_STATUSES.has(result.status) ? result.status : '';
  if (!status) {
    if (reason === 'insufficient_contiguous_page_data' || reason === 'analysis_deadline' || resolvedTotalPages === 0) {
      status = 'not_ready';
    } else if (evaluatedPages < resolvedTotalPages) {
      status = 'partial';
    } else {
      status = 'complete';
    }
  }
  if (status === 'complete' && evaluatedPages < resolvedTotalPages) status = 'partial';
  return {
    status,
    reason: reason || (status === 'complete' ? '' : 'analysis_incomplete'),
    ruleVersion: String(result.ruleVersion || ANALYSIS_RULE_VERSION).slice(0, 80),
    endDate,
    windowDays: nonNegativeCount(result.windowDays || BALANCED_ANALYSIS_WINDOW_DAYS) || 28,
    completedDays: nonNegativeCount(result.completedDays ?? readiness.completedDays),
    requiredDays: nonNegativeCount(result.requiredDays ?? readiness.requiredDays) || 56,
    evaluatedPages,
    committedAssessmentPages: nonNegativeCount(result.committedAssessmentPages),
    totalPages: resolvedTotalPages,
    eligiblePages: nonNegativeCount(result.eligiblePages),
    proposedActions: nonNegativeCount(result.proposedActions ?? result.proposed),
    clearedActions: nonNegativeCount(result.clearedActions ?? result.cleared),
    cooldown: emptyCooldownCounts(result.cooldown),
    dataQualityBlockedPages: nonNegativeCount(result.dataQualityBlockedPages),
    decisionBlockedPages: nonNegativeCount(result.decisionBlockedPages),
    startedAt,
    completedAt,
  };
}

function failedAnalysisSummary({ endDate, readiness = {}, totalPages = 0, startedAt, completedAt = new Date() } = {}) {
  return {
    status: 'failed',
    reason: 'analysis_failed',
    ruleVersion: ANALYSIS_RULE_VERSION,
    endDate,
    windowDays: BALANCED_ANALYSIS_WINDOW_DAYS || 28,
    completedDays: nonNegativeCount(readiness.completedDays),
    requiredDays: nonNegativeCount(readiness.requiredDays) || 56,
    evaluatedPages: 0,
    committedAssessmentPages: 0,
    totalPages: nonNegativeCount(totalPages),
    eligiblePages: 0,
    proposedActions: 0,
    clearedActions: 0,
    cooldown: emptyCooldownCounts(),
    dataQualityBlockedPages: 0,
    decisionBlockedPages: 0,
    startedAt,
    completedAt,
  };
}

function notReadyAnalysisSummary({ reason, endDate = null, totalPages = 0, completedAt = new Date() } = {}) {
  return {
    status: 'not_ready',
    reason: safeAnalysisReason(reason, 'not_run'),
    ruleVersion: ANALYSIS_RULE_VERSION,
    endDate,
    windowDays: BALANCED_ANALYSIS_WINDOW_DAYS || 28,
    completedDays: 0,
    requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS || 56,
    evaluatedPages: 0,
    committedAssessmentPages: 0,
    totalPages: nonNegativeCount(totalPages),
    eligiblePages: 0,
    proposedActions: 0,
    clearedActions: 0,
    cooldown: emptyCooldownCounts(),
    dataQualityBlockedPages: 0,
    decisionBlockedPages: 0,
    startedAt: null,
    completedAt,
  };
}

async function persistAnalysisLifecycle({
  run,
  siteUrl,
  endDate,
  deadlineMs,
  analyze = runBalancedAnalysis,
  loadReadiness = analysisReadiness,
  loadTotalPages = () => SeoPage.countDocuments({ 'manifest.present': true }),
  now = () => new Date(),
} = {}) {
  const analysisStartedAt = new Date(now());
  let readiness = { completedDays: 0, requiredDays: BALANCED_ANALYSIS_REQUIRED_DAYS || 56 };
  let totalPages = 0;
  try {
    [readiness, totalPages] = await Promise.all([
      loadReadiness({ siteUrl, endDate }),
      loadTotalPages(),
    ]);
    run.analysis = {
      ...notReadyAnalysisSummary({
        reason: 'analysis_running',
        endDate,
        totalPages,
        completedAt: null,
      }),
      status: 'running',
      completedDays: readiness.completedDays,
      requiredDays: readiness.requiredDays,
      startedAt: analysisStartedAt,
      completedAt: null,
    };
    await run.save();
    const result = await analyze({
      siteUrl,
      endDate,
      now: new Date(now()),
      deadlineMs,
    });
    run.analysis = analysisSummary({
      result,
      endDate,
      readiness,
      totalPages,
      startedAt: analysisStartedAt,
      completedAt: new Date(now()),
    });
  } catch {
    run.analysis = failedAnalysisSummary({
      endDate,
      readiness,
      totalPages,
      startedAt: analysisStartedAt,
      completedAt: new Date(now()),
    });
  }
  // Persist the terminal packet immediately. Sync can continue doing metric
  // maintenance afterwards, while overview readers still see the completed
  // analysis instead of an obsolete `running` lifecycle.
  await run.save();
  return run.analysis;
}

function syncStateKey(siteUrl) {
  return `gsc:${siteUrl}`;
}

async function ensureSyncState(siteUrl) {
  const stateKey = syncStateKey(siteUrl);
  try {
    await SeoSyncState.updateOne(
      { stateKey },
      { $setOnInsert: { stateKey, siteUrl } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return SeoSyncState.findOne({ stateKey });
}

async function acquireSyncLease({ siteUrl, now = new Date(), leaseMs = 300_000 }) {
  await ensureSyncState(siteUrl);
  const token = crypto.randomUUID();
  const leaseExpiresAt = new Date(now.getTime() + leaseMs);
  const state = await SeoSyncState.findOneAndUpdate(
    {
      stateKey: syncStateKey(siteUrl),
      $or: [
        { leaseExpiresAt: null },
        { leaseExpiresAt: { $exists: false } },
        { leaseExpiresAt: { $lte: now } },
      ],
    },
    { $set: { leaseToken: token, leaseExpiresAt } },
    { new: true }
  );
  return state ? { token, state } : null;
}

async function releaseSyncLease({ siteUrl, token, errorMessage = '', success = false, now = new Date() }) {
  const set = { leaseToken: null, leaseExpiresAt: null, lastError: String(errorMessage || '').slice(0, 1000) };
  if (success) set.lastSuccessfulSyncAt = now;
  await SeoSyncState.updateOne({ stateKey: syncStateKey(siteUrl), leaseToken: token }, { $set: set });
}

async function releaseAnalysisLease({ siteUrl, token }) {
  // Analysis shares the sync lease for mutual exclusion, but it is not a GSC
  // synchronization. Do not clear or overwrite sync health fields here.
  await SeoSyncState.updateOne(
    { stateKey: syncStateKey(siteUrl), leaseToken: token },
    { $set: { leaseToken: null, leaseExpiresAt: null } }
  );
}

const LEASE_COMMIT_FIELDS = Object.freeze([
  'leaseExpiresAt',
  'recentCursorDate',
  'recentBackfillStartDate',
  'recentBackfillEndDate',
  'recentBackfillComplete',
  'olderCursorDate',
  'refreshOffset',
  'lastFinalizedDate',
  'lastSuccessfulSyncAt',
  'lastError',
  'storageBytes',
  'storageLevel',
]);

async function persistSyncLeaseState({ siteUrl, token, state }) {
  const set = {};
  for (const field of LEASE_COMMIT_FIELDS) {
    const value = state?.[field];
    if (value !== undefined) set[field] = value;
  }
  const committed = await SeoSyncState.findOneAndUpdate(
    { stateKey: syncStateKey(siteUrl), leaseToken: token },
    { $set: set },
    { new: true }
  );
  if (!committed) {
    throw new SeoSyncError('The SEO sync lease was replaced before state could be committed', 409, 'SEO_SYNC_LEASE_LOST');
  }
  return committed;
}

function selectSyncDates(state, latestFinalizedDate, config) {
  const dates = [];
  const rolesByDate = {};
  const limit = config.datesPerRun;
  const initialEnd = state.recentBackfillEndDate || latestFinalizedDate;
  const initialStart = state.recentBackfillStartDate || shiftDateKey(initialEnd, -(config.initialBackfillDays - 1));
  const oldestAllowed = shiftDateKey(latestFinalizedDate, -(config.maximumBackfillDays - 1));

  if (!state.recentBackfillComplete) {
    let cursor = state.recentCursorDate || initialEnd;
    if (cursor > initialEnd) cursor = initialEnd;
    while (dates.length < limit && cursor >= initialStart) {
      dates.push(cursor);
      cursor = shiftDateKey(cursor, -1);
    }
    for (const date of dates) rolesByDate[date] = ['recent'];
    return { mode: 'recent', dates, rolesByDate, initialStart, initialEnd, nextCursor: cursor, oldestAllowed };
  }

  let catchupCount = 0;
  if (state.lastFinalizedDate && state.lastFinalizedDate < latestFinalizedDate) {
    let cursor = shiftDateKey(state.lastFinalizedDate, 1);
    while (dates.length < limit && cursor <= latestFinalizedDate) {
      dates.push(cursor);
      rolesByDate[cursor] = ['catchup'];
      catchupCount += 1;
      cursor = shiftDateKey(cursor, 1);
    }
    if (dates.length >= limit) {
      return { mode: 'catchup', dates, rolesByDate, initialStart, initialEnd, oldestAllowed };
    }
  }

  const refreshDate = shiftDateKey(latestFinalizedDate, -(state.refreshOffset || 0));
  if (dates.includes(refreshDate)) {
    rolesByDate[refreshDate].push('refresh');
  } else if (dates.length < limit) {
    dates.push(refreshDate);
    rolesByDate[refreshDate] = ['refresh'];
  }

  let olderCursor = state.olderCursorDate || shiftDateKey(initialStart, -1);
  while (dates.length < limit && olderCursor >= oldestAllowed) {
    if (!dates.includes(olderCursor)) {
      dates.push(olderCursor);
      rolesByDate[olderCursor] = ['older'];
    } else if (!rolesByDate[olderCursor].includes('older')) {
      rolesByDate[olderCursor].push('older');
    }
    olderCursor = shiftDateKey(olderCursor, -1);
  }
  return {
    mode: catchupCount ? 'mixed' : 'maintenance',
    dates,
    rolesByDate,
    initialStart,
    initialEnd,
    olderCursor,
    refreshDate,
    oldestAllowed,
  };
}

function applyCompletedDateToState({ state, selection, date }) {
  const roles = selection.rolesByDate?.[date] || [selection.mode];
  if (roles.includes('recent')) {
    state.recentCursorDate = shiftDateKey(date, -1);
    if (state.recentCursorDate < selection.initialStart) {
      state.recentBackfillComplete = true;
      state.olderCursorDate = shiftDateKey(selection.initialStart, -1);
      state.lastFinalizedDate = selection.initialEnd;
    }
  }
  if (roles.includes('catchup')) state.lastFinalizedDate = date;
  if (roles.includes('older')) state.olderCursorDate = shiftDateKey(date, -1);
  if (roles.includes('refresh')) state.refreshOffset = ((state.refreshOffset || 0) + 1) % 7;
  return state;
}

function analysisEndDateForState(state) {
  return state?.lastFinalizedDate || state?.recentBackfillEndDate || null;
}

async function syncOneDate({ client, config, date, includeDetails, now = new Date() }) {
  let rowsWritten = 0;
  let anyTruncated = false;
  const propertyResult = await client.querySearchAnalytics({
    siteUrl: config.siteUrl,
    date,
    dimensions: [],
  });
  const propertyWrite = await writeSliceGeneration({
    siteUrl: config.siteUrl,
    date,
    slice: 'property',
    rows: propertyResult.rows.length ? propertyResult.rows : [{}],
    truncated: false,
    now,
  });
  rowsWritten += propertyWrite.rowCount;

  const pageResult = await client.querySearchAnalytics({
    siteUrl: config.siteUrl,
    date,
    dimensions: ['page'],
  });
  const pageWrite = await writeSliceGeneration({
    siteUrl: config.siteUrl,
    date,
    slice: 'page',
    rows: pageResult.rows,
    truncated: pageResult.truncated,
    now,
  });
  rowsWritten += pageWrite.rowCount;
  anyTruncated ||= pageResult.truncated;
  const observedPageKeys = pageResult.rows
    .map((row) => Array.isArray(row.keys) && row.keys[0] ? pageKeyForUrl(row.keys[0]) : null)
    .filter(Boolean);
  await activatePendingMeasurements({ pageKeys: observedPageKeys, observedDate: date, now });

  let queryCoverage = null;
  let deviceCoverage = null;
  // Page facts have just advanced to a new generation. Invalidate the coupled
  // detail pointers before any detail fetch so a partial failure cannot expose
  // yesterday's query/device facts beside today's page facts.
  const detailPartitionsInvalidated = await invalidateDetailPartitions({ siteUrl: config.siteUrl, date });
  if (includeDetails) {
    const queryResult = await client.querySearchAnalytics({
      siteUrl: config.siteUrl,
      date,
      dimensions: ['page', 'query'],
    });
    const queryWrite = await writeSliceGeneration({
      siteUrl: config.siteUrl,
      date,
      slice: 'queryPage',
      rows: queryResult.rows,
      truncated: queryResult.truncated,
      now,
    });
    rowsWritten += queryWrite.rowCount;
    anyTruncated ||= queryResult.truncated;
    queryCoverage = await updateQueryCoverage({ siteUrl: config.siteUrl, date });

    const deviceResult = await client.querySearchAnalytics({
      siteUrl: config.siteUrl,
      date,
      dimensions: ['page', 'device'],
    });
    const deviceWrite = await writeSliceGeneration({
      siteUrl: config.siteUrl,
      date,
      slice: 'devicePage',
      rows: deviceResult.rows,
      truncated: deviceResult.truncated,
      now,
    });
    rowsWritten += deviceWrite.rowCount;
    anyTruncated ||= deviceResult.truncated;
    deviceCoverage = await updateDeviceCoverage({ siteUrl: config.siteUrl, date });
  }

  return {
    rowsWritten,
    truncated: anyTruncated,
    queryCoverage,
    deviceCoverage,
    observedPageKeys,
    detailPartitionsInvalidated,
  };
}

function orderInspectionCandidates(candidates, {
  now = new Date(),
  freshnessDays = 7,
  limit = 100,
  anomalyPrioritySlots = 2,
} = {}) {
  const cutoff = new Date(now.getTime() - freshnessDays * 24 * 60 * 60 * 1000);
  const eligible = (candidates || []).filter((candidate) => {
    const observedAt = candidate.latestInspection?.observedAt
      ? new Date(candidate.latestInspection.observedAt)
      : null;
    return candidate.changePending
      || candidate.technicalPending
      || candidate.sourceDependencyPending
      || candidate.forceInspection === true
      || !observedAt
      || Number.isNaN(observedAt.getTime())
      || observedAt < cutoff;
  });
  const fairSort = (left, right) => {
    const leftTime = left.latestInspection?.observedAt ? new Date(left.latestInspection.observedAt).getTime() : -Infinity;
    const rightTime = right.latestInspection?.observedAt ? new Date(right.latestInspection.observedAt).getTime() : -Infinity;
    return leftTime - rightTime || String(left.pageKey).localeCompare(String(right.pageKey));
  };
  const changed = eligible.filter((candidate) => candidate.changePending).sort((left, right) => {
    const leftEffectiveAt = detectorEffectiveAt(left.changeTracking) || left.changeTracking?.materialChangedAt;
    const rightEffectiveAt = detectorEffectiveAt(right.changeTracking) || right.changeTracking?.materialChangedAt;
    const leftTime = leftEffectiveAt
      ? new Date(leftEffectiveAt).getTime()
      : -Infinity;
    const rightTime = rightEffectiveAt
      ? new Date(rightEffectiveAt).getTime()
      : -Infinity;
    return leftTime - rightTime || fairSort(left, right);
  });
  const pending = eligible
    .filter((candidate) => !candidate.changePending && (
      candidate.technicalPending || candidate.sourceDependencyPending
    ))
    .sort(fairSort);
  const remaining = eligible.filter((candidate) => (
    !candidate.changePending && !candidate.technicalPending && !candidate.sourceDependencyPending
  ));
  const anomalies = remaining.filter((candidate) => candidate.canonicalAnomaly).sort(fairSort);
  const regular = remaining.filter((candidate) => !candidate.canonicalAnomaly).sort(fairSort);
  const priorityCount = Math.max(0, Math.min(Number(anomalyPrioritySlots) || 0, Number(limit) || 100));
  return [
    ...changed,
    ...pending,
    ...anomalies.slice(0, priorityCount),
    ...regular,
    ...anomalies.slice(priorityCount),
  ].slice(0, Math.max(1, Number(limit) || 100));
}

async function runUrlInspectionDiagnostics({ client, config, endDate, now = new Date() }) {
  if (!endDate || typeof client?.inspectUrl !== 'function') return { inspected: 0 };
  const internalLinkTargets = await SeoPage.find({
    indexable: true,
    'manifest.present': true,
    'changeTracking.detectors.internal_link.awaitingSourceRecrawl': true,
  }).select('changeTracking.detectors.internal_link.dependencyPageKeys').lean();
  const sourceDependencyKeys = new Set(internalLinkTargets.flatMap((page) => (
    page.changeTracking?.detectors?.internal_link?.dependencyPageKeys || []
  )).map(String));
  const pages = await SeoPage.find({
    indexable: true,
    'manifest.present': true,
    $or: [
      { firstSeenAt: { $lte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) } },
      { 'changeTracking.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.ctr_snippet.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.intent_mismatch.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.content_decay.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.cannibalization.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.internal_link.crawlConfirmationRequired': true },
      { 'changeTracking.detectors.technical_indexing.crawlConfirmationRequired': true },
      { pageKey: { $in: Array.from(sourceDependencyKeys) } },
    ],
  }).select('pageKey canonicalUrl indexable manifest firstSeenAt changeTracking').sort({ firstSeenAt: 1, pageKey: 1 }).lean();
  if (!pages.length) return { inspected: 0 };
  const startDate = shiftDateKey(endDate, -27);
  const metrics = await SeoPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'page',
    match: {
      siteUrl: config.siteUrl,
      pageKey: { $in: pages.map((page) => page.pageKey) },
      date: { $gte: startDate, $lte: endDate },
    },
    afterLookup: [{ $group: { _id: '$pageKey', impressions: { $sum: '$impressions' } } }],
  }));
  const impressions = new Map(metrics.map((row) => [row._id, Number(row.impressions || 0)]));
  const inspectionRows = await SeoDiagnosticSnapshot.find({
    kind: 'urlInspection',
    pageKey: { $in: pages.map((page) => page.pageKey) },
  }).sort({ observedAt: -1 }).select('pageKey observedAt data').lean();
  const latestInspection = new Map();
  for (const row of inspectionRows) {
    if (!latestInspection.has(row.pageKey)) latestInspection.set(row.pageKey, row);
  }
  await activateTechnicalMeasurementsFromInspections({
    snapshots: Array.from(latestInspection.values()),
    now,
  });
  const technicalInspectionActions = await SeoAction.find({
    type: 'technical_indexing',
    $or: [
      { state: 'implementation_pending' },
      {
        state: 'measuring',
        'successCriteria.metric': 'urlInspection',
        measuringUntil: { $lte: now },
      },
    ],
  }).select('pageKey state measuringUntil').lean();
  const pendingTechnicalKeys = new Set(technicalInspectionActions
    .filter((action) => {
      if (action.state === 'implementation_pending') return true;
      const latest = latestInspection.get(action.pageKey);
      return !latest || new Date(latest.observedAt) < new Date(action.measuringUntil);
    })
    .map((action) => action.pageKey));
  const candidates = orderInspectionCandidates(pages
    .map((page) => ({
      ...page,
      impressions: impressions.get(page.pageKey) || 0,
      latestInspection: latestInspection.get(page.pageKey) || null,
      canonicalAnomaly: latestInspection.get(page.pageKey)?.data?.canonicalVerdict === 'mismatch',
      inspectionAnomaly: latestInspection.get(page.pageKey)?.data?.indexStatus === 'FAIL'
        || latestInspection.get(page.pageKey)?.data?.robots === 'BLOCKED',
      changePending: hasPendingCrawl(page.changeTracking),
      sourceDependencyPending: sourceDependencyKeys.has(page.pageKey),
      technicalPending: pendingTechnicalKeys.has(page.pageKey),
      forceInspection: pendingTechnicalKeys.has(page.pageKey)
        || sourceDependencyKeys.has(page.pageKey)
        || hasPendingCrawl(page.changeTracking),
    }))
    .filter((page) => (
      page.impressions === 0
      || page.canonicalAnomaly
      || page.inspectionAnomaly
      || page.technicalPending
      || page.sourceDependencyPending
      || page.changePending
    )), { now, limit: 100 });
  const result = await inspectUrlCandidates({
    candidates,
    client,
    siteUrl: config.siteUrl,
    now: () => now,
    limit: 5,
    pageModel: SeoPage,
    versionModel: SeoPageVersion,
  });
  const freshCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const freshRows = Array.from(latestInspection.values())
    .filter((row) => new Date(row.observedAt) >= freshCutoff);
  const technicalMeasurementsActivated = await activateTechnicalMeasurementsFromInspections({
    snapshots: [...freshRows, ...(result.snapshots || [])],
    now,
  });
  const internalLinkSourceRecrawlsResolved = await resolveInternalLinkSourceRecrawls({
    pageModel: SeoPage,
    now,
  });
  return { ...result, technicalMeasurementsActivated, internalLinkSourceRecrawlsResolved };
}

function sanitizedSyncError(error) {
  if (!error) return { code: 'SEO_SYNC_FAILED', message: 'SEO sync failed.' };
  const code = String(error.code || 'SEO_SYNC_FAILED').slice(0, 100);
  const allowedMessage = code.startsWith('GSC_')
    ? String(error.message || 'GSC sync failed.')
    : 'SEO sync failed before the current cursor could be committed.';
  return { code, message: allowedMessage.slice(0, 500) };
}

async function discoverLatestFinalizedDate(client, config, now) {
  const candidate = finalizedDateKey(now, config.finalizedLagDays);
  if (typeof client.discoverLatestFinalizedDate !== 'function') return candidate;
  return client.discoverLatestFinalizedDate({
    siteUrl: config.siteUrl,
    startDate: shiftDateKey(candidate, -10),
    endDate: candidate,
  });
}

async function measureDetailStorageGuard({ storageBudgetBytes, estimateStorage = estimateSeoStorageBytes }) {
  const bytes = await estimateStorage();
  const level = storageLevel(bytes, storageBudgetBytes);
  return {
    bytes,
    level,
    includeDetails: level !== 'detail_paused' && level !== 'unknown',
  };
}

function shouldIncludeDetailsForDate({
  includeDetails,
  storageGuardLevel,
  date,
  latestFinalizedDate,
  roles = [],
}) {
  if (!includeDetails || date < shiftDateKey(latestFinalizedDate, -179)) return false;
  const priorityDetailDate = roles.some((role) => ['recent', 'catchup', 'refresh'].includes(role));
  return storageGuardLevel !== 'warning' || priorityDetailDate;
}

async function latestPersistedAnalysisEndDate(siteUrl) {
  if (!siteUrl) return null;
  const [propertyDates, pageDates] = await Promise.all([
    SeoMetricPartition.distinct('date', { siteUrl, slice: 'property', status: 'complete' }),
    SeoMetricPartition.distinct('date', { siteUrl, slice: 'page', status: 'complete' }),
  ]);
  const completePageDates = new Set(pageDates);
  return propertyDates
    .filter((date) => completePageDates.has(date))
    .sort()
    .at(-1) || null;
}

async function currentAssessmentCount({ siteUrl, endDate }) {
  if (!siteUrl || !endDate) return 0;
  const rows = await SeoPageAssessment.aggregate([
    { $match: { siteUrl, endDate, ruleVersion: ANALYSIS_RULE_VERSION } },
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
  return nonNegativeCount(rows[0]?.count);
}

async function latestAnalysisRun({ siteUrl, excludeRunId = null }) {
  if (!siteUrl) return null;
  const filter = {
    siteUrl,
    'analysis.status': { $exists: true },
  };
  if (excludeRunId) filter.runId = { $ne: excludeRunId };
  return SeoSyncRun.findOne(filter)
    .sort({ startedAt: -1, 'analysis.completedAt': -1 })
    .select('analysis')
    .lean();
}

async function analysisRefreshState({
  siteUrl,
  endDate,
  excludeRunId = null,
  loadReadiness = analysisReadiness,
  loadTotalPages = () => SeoPage.countDocuments({ 'manifest.present': true }),
  loadLatestRun = latestAnalysisRun,
  loadAssessmentCount = currentAssessmentCount,
} = {}) {
  const readiness = await loadReadiness({ siteUrl, endDate });
  if (readiness.completedDays < readiness.requiredDays) {
    return { prioritize: false, reason: 'analysis_window_not_ready', readiness, totalPages: 0 };
  }
  const totalPages = nonNegativeCount(await loadTotalPages());
  if (totalPages === 0) {
    return { prioritize: false, reason: 'no_manifest_pages', readiness, totalPages };
  }
  const latestRun = await loadLatestRun({ siteUrl, excludeRunId });
  const latest = latestRun?.analysis || {};
  const currentComplete = latest.status === 'complete'
    && latest.ruleVersion === ANALYSIS_RULE_VERSION
    && latest.endDate === endDate
    && nonNegativeCount(latest.evaluatedPages) === totalPages
    && nonNegativeCount(latest.totalPages) === totalPages;
  if (!currentComplete) {
    return { prioritize: true, reason: 'current_analysis_missing', readiness, totalPages };
  }
  const assessmentPages = nonNegativeCount(await loadAssessmentCount({ siteUrl, endDate }));
  return {
    prioritize: assessmentPages !== totalPages,
    reason: assessmentPages === totalPages ? 'current_analysis_complete' : 'current_assessments_stale',
    readiness,
    totalPages,
    assessmentPages,
  };
}

function serializeAnalysisLifecycle(value = {}) {
  const raw = typeof value?.toObject === 'function' ? value.toObject() : value || {};
  const status = ANALYSIS_STATUSES.has(raw.status) ? raw.status : 'not_ready';
  const isoOrNull = (input) => {
    if (!input) return null;
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };
  return {
    status,
    reason: safeAnalysisReason(raw.reason, status === 'complete' ? 'analysis_complete' : 'not_run'),
    ruleVersion: String(raw.ruleVersion || ANALYSIS_RULE_VERSION).slice(0, 80),
    endDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.endDate || '')) ? raw.endDate : null,
    windowDays: nonNegativeCount(raw.windowDays || BALANCED_ANALYSIS_WINDOW_DAYS) || 28,
    completedDays: nonNegativeCount(raw.completedDays),
    requiredDays: nonNegativeCount(raw.requiredDays || BALANCED_ANALYSIS_REQUIRED_DAYS) || 56,
    evaluatedPages: nonNegativeCount(raw.evaluatedPages),
    committedAssessmentPages: nonNegativeCount(raw.committedAssessmentPages),
    totalPages: nonNegativeCount(raw.totalPages),
    eligiblePages: nonNegativeCount(raw.eligiblePages),
    proposedActions: nonNegativeCount(raw.proposedActions),
    clearedActions: nonNegativeCount(raw.clearedActions),
    cooldown: emptyCooldownCounts(raw.cooldown),
    dataQualityBlockedPages: nonNegativeCount(raw.dataQualityBlockedPages),
    decisionBlockedPages: nonNegativeCount(raw.decisionBlockedPages),
    startedAt: isoOrNull(raw.startedAt),
    completedAt: isoOrNull(raw.completedAt),
  };
}

function syncRunStatusForAnalysis(status) {
  if (status === 'complete') return 'complete';
  if (status === 'partial') return 'partial';
  if (status === 'failed') return 'failed';
  return status === 'running' ? 'running' : 'skipped';
}

async function runSeoAnalysis({
  config,
  now = new Date(),
  deadlineBudgetMs = DEFAULT_ANALYSIS_DEADLINE_MS,
  acquireLease = acquireSyncLease,
  releaseLease = releaseAnalysisLease,
  createRun = (payload) => SeoSyncRun.create(payload),
  refreshManifest = syncSeoManifest,
  loadEndDate = latestPersistedAnalysisEndDate,
  loadTotalPages = () => SeoPage.countDocuments({ 'manifest.present': true }),
  analyzeLifecycle = persistAnalysisLifecycle,
} = {}) {
  if (!config?.enabled || !config?.configured || !config?.siteUrl || !config?.storageBudgetBytes) {
    throw new SeoSyncError('SEO analysis is disabled or incomplete', 503, 'SEO_ANALYSIS_DISABLED');
  }
  const boundedBudgetMs = Math.max(10_000, Math.min(280_000, Number(deadlineBudgetMs) || DEFAULT_ANALYSIS_DEADLINE_MS));
  const lease = await acquireLease({
    siteUrl: config.siteUrl,
    now,
    leaseMs: boundedBudgetMs + 60_000,
  });
  if (!lease) {
    throw new SeoSyncError('An SEO sync or analysis is already running', 409, 'SEO_ANALYSIS_BUSY');
  }

  const runId = crypto.randomUUID();
  let run;
  try {
    run = await createRun({
      runId,
      siteUrl: config.siteUrl,
      trigger: 'manual_analysis',
      status: 'running',
      startedAt: now,
      expiresAt: expiryFromNow(now, 90),
    });
  } catch (error) {
    await releaseLease({ siteUrl: config.siteUrl, token: lease.token });
    throw error;
  }

  const deadlineMs = Date.now() + boundedBudgetMs;
  let released = false;
  try {
    const manifestRefresh = await refreshManifest({
      expectedSiteUrl: config.siteUrl,
      now: new Date(now),
      requireProductionMarker: true,
    });
    if (manifestRefresh?.ready === false) {
      run.analysis = notReadyAnalysisSummary({
        reason: manifestRefresh.reason || 'production_marker_not_ready',
        totalPages: await loadTotalPages(),
        completedAt: new Date(),
      });
      run.status = 'skipped';
      run.completedAt = new Date();
      await run.save();
      await releaseLease({ siteUrl: config.siteUrl, token: lease.token });
      released = true;
      const serialized = serializeAnalysisLifecycle(run.analysis);
      return { runId, status: serialized.status, analysis: serialized };
    }
    const endDate = await loadEndDate(config.siteUrl);
    if (!endDate) {
      run.analysis = notReadyAnalysisSummary({
        reason: 'no_persisted_finalized_data',
        totalPages: await loadTotalPages(),
        completedAt: new Date(),
      });
      await run.save();
    } else {
      await analyzeLifecycle({
        run,
        siteUrl: config.siteUrl,
        endDate,
        deadlineMs,
      });
    }
    run.status = syncRunStatusForAnalysis(run.analysis?.status);
    run.completedAt = new Date();
    await run.save();
    await releaseLease({ siteUrl: config.siteUrl, token: lease.token });
    released = true;
    const serialized = serializeAnalysisLifecycle(run.analysis);
    return { runId, status: serialized.status, analysis: serialized };
  } catch (error) {
    run.status = 'failed';
    run.errorCode = 'SEO_ANALYSIS_FAILED';
    run.errorMessage = 'SEO analysis failed.';
    run.completedAt = new Date();
    if (!run.analysis || run.analysis.status === 'running') {
      run.analysis = failedAnalysisSummary({
        endDate: run.analysis?.endDate || null,
        startedAt: run.analysis?.startedAt || now,
        completedAt: run.completedAt,
      });
    }
    try {
      await run.save();
    } catch {
      // Preserve the original runner error; the lease release still runs.
    }
    await releaseLease({ siteUrl: config.siteUrl, token: lease.token });
    released = true;
    throw Object.assign(
      new SeoSyncError('SEO analysis failed.', Number(error?.status) || 500, 'SEO_ANALYSIS_FAILED'),
      { runId }
    );
  } finally {
    if (!released) {
      await releaseLease({ siteUrl: config.siteUrl, token: lease.token });
    }
  }
}

async function runSeoSync({
  config,
  client = null,
  trigger = 'cron',
  now = new Date(),
  refreshManifest = syncSeoManifest,
  loadProductionMarker = fetchProductionBuildMarker,
} = {}) {
  if (!config?.enabled || !config?.configured || !config?.siteUrl || !config?.storageBudgetBytes) {
    throw new SeoSyncError('SEO sync is disabled or incomplete', 503, 'SEO_SYNC_DISABLED');
  }
  const lease = await acquireSyncLease({
    siteUrl: config.siteUrl,
    now,
    leaseMs: config.syncBudgetMs + 60_000,
  });
  if (!lease) throw new SeoSyncError('An SEO sync is already running', 409, 'SEO_SYNC_BUSY');

  const runId = crypto.randomUUID();
  let run;
  try {
    run = await SeoSyncRun.create({
      runId,
      siteUrl: config.siteUrl,
      trigger,
      status: 'running',
      startedAt: now,
      expiresAt: expiryFromNow(now, 90),
    });
  } catch (error) {
    await releaseSyncLease({ siteUrl: config.siteUrl, token: lease.token, errorMessage: 'SEO sync run could not be created.', now: new Date() });
    throw error;
  }
  const startedAtMs = Date.now();
  const configuredHardBudgetMs = Number(config.hardDeadlineBudgetMs);
  const hardDeadlineBudgetMs = Number.isFinite(configuredHardBudgetMs)
    ? Math.max(10_000, Math.min(280_000, configuredHardBudgetMs))
    : Math.min(280_000, config.syncBudgetMs + 60_000);
  const hardDeadlineMs = startedAtMs + hardDeadlineBudgetMs;
  let completed = false;
  try {
    const gsc = client || createGscClient({
      credentials: config.credentials,
      deadlineMs: hardDeadlineMs,
      requestTimeoutMs: 15_000,
      maxAttempts: 2,
    });
    const manifestRefresh = await refreshManifest({
      expectedSiteUrl: config.siteUrl,
      now: new Date(now),
      // Raw GSC facts and the local inventory are safe to persist without a
      // production marker. The marker is still requested so every enrichment
      // decision below can remain fail-closed on verified production evidence.
      requireProductionMarker: false,
      loadProductionMarker,
    });
    if (manifestRefresh?.ready === false) {
      run.status = 'skipped';
      run.analysis = notReadyAnalysisSummary({ reason: manifestRefresh.reason || 'production_marker_not_ready' });
      run.completedAt = new Date();
      await run.save();
      await releaseSyncLease({ siteUrl: config.siteUrl, token: lease.token, success: false, now: new Date() });
      completed = true;
      return run.toObject();
    }
    const productionMarkerReady = manifestRefresh?.productionMarkerReady === true;
    const productionMarkerReason = manifestRefresh?.productionMarkerReason
      || 'production_marker_unavailable';
    const latestFinalizedDate = await discoverLatestFinalizedDate(gsc, config, now);
    if (!latestFinalizedDate) {
      run.status = 'skipped';
      run.analysis = notReadyAnalysisSummary({ reason: 'no_finalized_data' });
      run.completedAt = new Date();
      await run.save();
      await releaseSyncLease({ siteUrl: config.siteUrl, token: lease.token, success: false, now: new Date() });
      completed = true;
      return run.toObject();
    }

    // If the persisted window that powers overview is already ready but its
    // balanced-v2 decision packets are missing or stale, analyze before older
    // history backfill. This keeps maintenance work from consuming the entire
    // request deadline and starving recommendations indefinitely.
    if (productionMarkerReady && config.enrichmentEnabled !== false) {
      const persistedEndDate = await latestPersistedAnalysisEndDate(config.siteUrl);
      if (persistedEndDate) {
        const refresh = await analysisRefreshState({
          siteUrl: config.siteUrl,
          endDate: persistedEndDate,
          excludeRunId: runId,
        });
        if (refresh.prioritize && hardDeadlineMs - Date.now() >= 30_000) {
          await persistAnalysisLifecycle({
            run,
            siteUrl: config.siteUrl,
            endDate: persistedEndDate,
            deadlineMs: hardDeadlineMs - 5_000,
          });
          // Do not mutate a metric generation after producing decision packets
          // for it. This run intentionally spends its budget on analysis and a
          // later sync resumes metric maintenance from the unchanged cursor.
          run.status = syncRunStatusForAnalysis(run.analysis?.status);
          if (run.status === 'complete') run.status = 'skipped';
          run.completedAt = new Date();
          await run.save();
          await releaseAnalysisLease({ siteUrl: config.siteUrl, token: lease.token });
          completed = true;
          return { ...run.toObject(), analysisPrioritized: true };
        }
      }
    }

    await pruneMetricHistoryBefore({
      siteUrl: config.siteUrl,
      cutoffDate: shiftDateKey(latestFinalizedDate, -(config.maximumBackfillDays - 1)),
    });

    let storageGuard = await measureDetailStorageGuard({ storageBudgetBytes: config.storageBudgetBytes });
    lease.state.storageBytes = storageGuard.bytes;
    lease.state.storageLevel = storageGuard.level;
    let includeDetails = storageGuard.includeDetails;
    run.detailSlicesSkipped = !includeDetails;
    const selection = selectSyncDates(lease.state, latestFinalizedDate, config);
    lease.state.recentBackfillStartDate = selection.initialStart;
    lease.state.recentBackfillEndDate = selection.initialEnd;
    run.datesAttempted = selection.dates;

    for (const date of selection.dates) {
      if (Date.now() - startedAtMs >= config.syncBudgetMs) break;
      const roles = selection.rolesByDate?.[date] || [selection.mode];
      const dateIncludesDetails = shouldIncludeDetailsForDate({
        includeDetails,
        storageGuardLevel: storageGuard.level,
        date,
        latestFinalizedDate,
        roles,
      });
      if (!dateIncludesDetails) run.detailSlicesSkipped = true;
      const result = await syncOneDate({ client: gsc, config, date, includeDetails: dateIncludesDetails, now: new Date() });
      run.rowsWritten += result.rowsWritten;
      run.truncated ||= result.truncated;
      run.datesCompleted.push(date);
      // Roles are committed independently so a partial mixed batch never skips
      // either the catch-up high-water mark or the older-history cursor.
      applyCompletedDateToState({ state: lease.state, selection, date });
      if (dateIncludesDetails) {
        storageGuard = await measureDetailStorageGuard({ storageBudgetBytes: config.storageBudgetBytes });
        lease.state.storageBytes = storageGuard.bytes;
        lease.state.storageLevel = storageGuard.level;
        includeDetails = storageGuard.includeDetails;
      }
      lease.state.leaseExpiresAt = new Date(Date.now() + config.syncBudgetMs + 60_000);
      lease.state = await persistSyncLeaseState({
        siteUrl: config.siteUrl,
        token: lease.token,
        state: lease.state,
      });
    }

    const madeProgress = run.datesCompleted.length > 0;
    const noProgressMessage = !madeProgress && run.datesAttempted.length
      ? 'Sync reached its time budget before a finalized date could be committed.'
      : '';
    if (madeProgress) {
      lease.state.lastSuccessfulSyncAt = new Date();
      lease.state.lastError = '';
      lease.state = await persistSyncLeaseState({
        siteUrl: config.siteUrl,
        token: lease.token,
        state: lease.state,
      });
    }

    const analysisEndDate = analysisEndDateForState(lease.state);
    if (config.enrichmentEnabled === false) {
      run.analysis = notReadyAnalysisSummary({
        reason: 'enrichment_disabled',
        endDate: analysisEndDate,
        totalPages: manifestRefresh?.pages,
      });
    } else if (!productionMarkerReady) {
      // A split deployment or a missing production marker must never infer
      // recommendations from an unverified local page version. Metric backfill
      // remains independent and can safely advance its cursor.
      run.analysis = notReadyAnalysisSummary({
        reason: productionMarkerReason,
        endDate: analysisEndDate,
        totalPages: manifestRefresh?.pages,
      });
    } else if (madeProgress && analysisEndDate) {
      const enrichmentDeadlineMs = hardDeadlineMs - 10_000;
      // Changed pages receive the scarce URL Inspection quota before analysis,
      // so a confirmed post-change crawl can immediately inform cooldown.
      if (enrichmentDeadlineMs - Date.now() >= 60_000) {
        try {
          await runUrlInspectionDiagnostics({ client: gsc, config, endDate: analysisEndDate, now: new Date() });
        } catch {
          // URL Inspection is optional enrichment. Metric generations are
          // already committed and must remain valid if diagnostics fail.
        }
      }
      if (enrichmentDeadlineMs - Date.now() >= 30_000) {
        // Analysis is a derived view over safely committed generations. A
        // detector or assessment failure is persisted, but cannot downgrade
        // or roll back the metric sync itself.
        await persistAnalysisLifecycle({
          run,
          siteUrl: config.siteUrl,
          endDate: analysisEndDate,
          deadlineMs: enrichmentDeadlineMs,
        });
      } else {
        run.analysis = notReadyAnalysisSummary({ reason: 'analysis_deadline', endDate: analysisEndDate });
      }
      if (enrichmentDeadlineMs - Date.now() >= 20_000) {
        try {
          await evaluateDueActions({
            siteUrl: config.siteUrl,
            latestFinalizedDate: analysisEndDate,
            now: new Date(),
            deadlineMs: enrichmentDeadlineMs,
          });
        } catch {
          // Existing action evaluation is also optional enrichment and cannot
          // invalidate a committed metric generation.
        }
      }
    } else if (!madeProgress) {
      run.analysis = notReadyAnalysisSummary({ reason: 'no_metric_progress', endDate: analysisEndDate });
    } else {
      run.analysis = notReadyAnalysisSummary({ reason: 'no_analysis_end_date' });
    }
    run.status = run.datesCompleted.length === run.datesAttempted.length ? 'complete' : 'partial';
    if (noProgressMessage) {
      run.errorCode = 'SEO_SYNC_NO_PROGRESS';
      run.errorMessage = noProgressMessage;
    }
    run.completedAt = new Date();
    await run.save();
    await releaseSyncLease({
      siteUrl: config.siteUrl,
      token: lease.token,
      success: madeProgress,
      errorMessage: noProgressMessage,
      now: new Date(),
    });
    completed = true;
    return run.toObject();
  } catch (error) {
    const safe = sanitizedSyncError(error);
    run.status = run.datesCompleted.length ? 'partial' : 'failed';
    run.errorCode = safe.code;
    run.errorMessage = safe.message;
    run.completedAt = new Date();
    await run.save();
    await releaseSyncLease({ siteUrl: config.siteUrl, token: lease.token, errorMessage: safe.message, now: new Date() });
    completed = true;
    throw Object.assign(new SeoSyncError(safe.message, error.status || 500, safe.code), { runId });
  } finally {
    if (!completed) {
      await releaseSyncLease({ siteUrl: config.siteUrl, token: lease.token, errorMessage: 'SEO sync stopped unexpectedly.', now: new Date() });
    }
  }
}

module.exports = {
  SeoSyncError,
  acquireSyncLease,
  analysisEndDateForState,
  analysisRefreshState,
  analysisReadiness,
  analysisSummary,
  applyCompletedDateToState,
  discoverLatestFinalizedDate,
  ensureSyncState,
  latestPersistedAnalysisEndDate,
  measureDetailStorageGuard,
  orderInspectionCandidates,
  persistAnalysisLifecycle,
  persistSyncLeaseState,
  releaseAnalysisLease,
  releaseSyncLease,
  runSeoAnalysis,
  runSeoSync,
  runUrlInspectionDiagnostics,
  sanitizedSyncError,
  selectSyncDates,
  serializeAnalysisLifecycle,
  shouldIncludeDetailsForDate,
  syncOneDate,
  syncStateKey,
};
