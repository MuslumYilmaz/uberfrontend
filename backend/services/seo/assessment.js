'use strict';

const { dateKeyInTimezone, inclusiveDateCount, shiftDateKey } = require('./dates');

const PERFORMANCE_ACTION_TYPES = Object.freeze([
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
  'internal_link',
]);
const ALL_DETECTOR_TYPES = Object.freeze([...PERFORMANCE_ACTION_TYPES, 'technical_indexing']);

const PRIMARY_ACTION_ORDER = Object.freeze([
  'technical_indexing',
  'intent_mismatch',
  'cannibalization',
  'content_decay',
  'ctr_snippet',
  'internal_link',
]);

function safeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cooldownFromAnchor({
  detector = null,
  changedAt = null,
  productionEffectiveAt = null,
  productionPrecision = 'unknown',
  productionSource = 'unknown',
  changedComponents = [],
  lastGoogleCrawlAt = null,
  confirmedCrawlAt = null,
  crawlConfirmationRequired = false,
  endDate,
  finalizedLagDays = 3,
  sourceTimezone = 'America/Los_Angeles',
} = {}) {
  const effectiveChangeAt = safeDate(productionEffectiveAt || changedAt);
  if (!effectiveChangeAt) {
    return {
      state: 'eligible',
      cleanFinalizedDays: null,
      detector,
      changedComponents: [],
      materialChangedAt: null,
      changeEffectiveAt: null,
      productionPrecision,
      productionSource,
      lastGoogleCrawlAt: safeDate(lastGoogleCrawlAt)?.toISOString() || null,
      cleanWindowStartDate: null,
      decisionDataThrough: null,
      nextReviewDate: null,
    };
  }

  const crawlAt = safeDate(confirmedCrawlAt || lastGoogleCrawlAt);
  // Equality is not sufficient: a crawl timestamp equal to a deployment
  // bound cannot prove that Google fetched the new version.
  if (crawlConfirmationRequired || !crawlAt || crawlAt <= effectiveChangeAt) {
    return {
      state: 'awaiting_recrawl',
      cleanFinalizedDays: 0,
      detector,
      changedComponents: Array.from(new Set((changedComponents || []).map(String))),
      materialChangedAt: safeDate(changedAt)?.toISOString() || effectiveChangeAt.toISOString(),
      changeEffectiveAt: effectiveChangeAt.toISOString(),
      productionPrecision,
      productionSource,
      lastGoogleCrawlAt: crawlAt?.toISOString() || null,
      cleanWindowStartDate: null,
      decisionDataThrough: null,
      nextReviewDate: null,
    };
  }

  const crawlDate = dateKeyInTimezone(crawlAt, sourceTimezone);
  const cleanWindowStartDate = shiftDateKey(crawlDate, 1);
  const cleanFinalizedDays = endDate && endDate >= cleanWindowStartDate
    ? inclusiveDateCount(cleanWindowStartDate, endDate)
    : 0;
  const decisionDataThrough = shiftDateKey(cleanWindowStartDate, 27);
  const nextReviewDate = shiftDateKey(decisionDataThrough, Math.max(0, Number(finalizedLagDays) || 0));
  const state = cleanFinalizedDays >= 28
    ? 'eligible'
    : cleanFinalizedDays >= 14 ? 'directional' : 'observing';

  return {
    state,
    cleanFinalizedDays,
    detector,
    changedComponents: Array.from(new Set((changedComponents || []).map(String))),
    materialChangedAt: safeDate(changedAt)?.toISOString() || effectiveChangeAt.toISOString(),
    changeEffectiveAt: effectiveChangeAt.toISOString(),
    productionPrecision,
    productionSource,
    lastGoogleCrawlAt: crawlAt.toISOString(),
    cleanWindowStartDate,
    decisionDataThrough,
    nextReviewDate,
  };
}

function legacyCooldownForPage({
  page,
  endDate,
  finalizedLagDays = 3,
  sourceTimezone = 'America/Los_Angeles',
} = {}) {
  const tracking = page?.changeTracking || {};
  return cooldownFromAnchor({
    changedAt: tracking.materialChangedAt,
    productionEffectiveAt: tracking.materialChangedAt,
    productionPrecision: 'legacy_baseline',
    productionSource: 'legacy_baseline',
    changedComponents: tracking.changedFields,
    lastGoogleCrawlAt: tracking.lastGoogleCrawlAt,
    crawlConfirmationRequired: tracking.crawlConfirmationRequired,
    endDate,
    finalizedLagDays,
    sourceTimezone,
  });
}

function cooldownForDetector({
  page,
  detector,
  endDate,
  finalizedLagDays = 3,
  sourceTimezone = 'America/Los_Angeles',
} = {}) {
  const tracking = page?.changeTracking || {};
  const lineageAvailable = Boolean(
    tracking.currentVersionKey
    || Object.values(tracking.detectors || {}).some(Boolean)
  );
  const detectorChange = tracking.detectors?.[detector] || null;
  if (!lineageAvailable) {
    return { ...legacyCooldownForPage({ page, endDate, finalizedLagDays, sourceTimezone }), detector };
  }
  if (!detectorChange) {
    return cooldownFromAnchor({ detector, endDate, finalizedLagDays, sourceTimezone });
  }
  if (detectorChange.awaitingProductionEvidence === true) {
    return {
      detector,
      state: 'awaiting_recrawl',
      status: 'awaiting_recrawl',
      reason: 'awaiting_deployment',
      changedAt: detectorChange.observedAt || null,
      productionEffectiveAt: null,
      productionPrecision: 'unknown',
      productionSource: 'unknown',
      confirmedCrawlAt: null,
      cleanFinalizedDays: 0,
      nextReviewDate: null,
    };
  }
  if (detectorChange.awaitingManifestChange === true) {
    return {
      detector,
      state: 'awaiting_recrawl',
      status: 'awaiting_recrawl',
      reason: 'awaiting_manifest_change',
      changedAt: detectorChange.implementationReportedAt || null,
      productionEffectiveAt: null,
      productionPrecision: 'unknown',
      productionSource: 'unknown',
      confirmedCrawlAt: null,
      cleanFinalizedDays: 0,
      nextReviewDate: null,
    };
  }
  if (detectorChange.sourceRecrawlNotEvaluable === true) {
    return {
      detector,
      state: 'awaiting_recrawl',
      status: 'awaiting_recrawl',
      reason: 'source_dependency_unavailable',
      changedAt: detectorChange.observedAt || null,
      productionEffectiveAt: detectorChange.productionEffectiveAt || null,
      productionPrecision: detectorChange.productionPrecision || 'unknown',
      productionSource: detectorChange.productionSource || 'unknown',
      dependencyPageKeys: [],
      unverifiableDependencyPageKeys: Array.from(new Set(
        detectorChange.unverifiableDependencyPageKeys || []
      )).slice(0, 20),
      confirmedCrawlAt: null,
      cleanFinalizedDays: 0,
      nextReviewDate: null,
    };
  }
  if (detectorChange.awaitingSourceRecrawl === true) {
    return {
      detector,
      state: 'awaiting_recrawl',
      status: 'awaiting_recrawl',
      reason: 'awaiting_source_recrawl',
      changedAt: detectorChange.observedAt || null,
      productionEffectiveAt: detectorChange.productionEffectiveAt || null,
      productionPrecision: detectorChange.productionPrecision || 'unknown',
      productionSource: detectorChange.productionSource || 'unknown',
      dependencyPageKeys: Array.from(new Set(detectorChange.dependencyPageKeys || [])).slice(0, 20),
      confirmedCrawlAt: null,
      cleanFinalizedDays: 0,
      nextReviewDate: null,
    };
  }
  return cooldownFromAnchor({
    detector,
    changedAt: detectorChange.observedAt,
    productionEffectiveAt: detectorChange.productionEffectiveAt,
    productionPrecision: detectorChange.productionPrecision,
    productionSource: detectorChange.productionSource,
    changedComponents: detectorChange.changedComponents,
    lastGoogleCrawlAt: tracking.lastGoogleCrawlAt,
    confirmedCrawlAt: detectorChange.confirmedCrawlAt,
    crawlConfirmationRequired: detectorChange.crawlConfirmationRequired,
    endDate,
    finalizedLagDays,
    sourceTimezone,
  });
}

function cooldownsForPage(options = {}) {
  return Object.fromEntries(ALL_DETECTOR_TYPES.map((detector) => [
    detector,
    cooldownForDetector({ ...options, detector }),
  ]));
}

function aggregateCooldown(detectorCooldowns = {}) {
  const priority = { eligible: 0, directional: 1, observing: 2, awaiting_recrawl: 3 };
  const values = PERFORMANCE_ACTION_TYPES
    .map((detector) => detectorCooldowns?.[detector])
    .filter(Boolean);
  return [...values].sort((left, right) => (
    Number(priority[right.state] || 0) - Number(priority[left.state] || 0)
    || String(right.nextReviewDate || '').localeCompare(String(left.nextReviewDate || ''))
  ))[0] || { state: 'eligible' };
}

function cooldownForPage(options = {}) {
  const tracking = options.page?.changeTracking || {};
  if (!tracking.currentVersionKey) return legacyCooldownForPage(options);
  return aggregateCooldown(cooldownsForPage(options));
}

function assessmentAction(assessment) {
  if (assessment?.state !== 'actionable') return null;
  return assessment.action || null;
}

function primaryAction(actions = []) {
  return [...actions].sort((left, right) => {
    const leftOrder = PRIMARY_ACTION_ORDER.indexOf(left.type);
    const rightOrder = PRIMARY_ACTION_ORDER.indexOf(right.type);
    const safeLeftOrder = leftOrder === -1 ? PRIMARY_ACTION_ORDER.length : leftOrder;
    const safeRightOrder = rightOrder === -1 ? PRIMARY_ACTION_ORDER.length : rightOrder;
    return safeLeftOrder - safeRightOrder
      || Number(right.priorityScore || 0) - Number(left.priorityScore || 0);
  })[0] || null;
}

function findingFromAssessment(type, assessment) {
  const evidence = assessment?.evidence || {};
  return {
    code: String(assessment?.reasonCodes?.[0] || `${type}_${assessment?.state || 'unknown'}`),
    detector: type,
    state: assessment?.state || 'not_evaluable',
    confidence: Number(assessment?.confidence || 0),
    summary: String(evidence.summary || ''),
    evidence,
    counterEvidence: Array.isArray(assessment?.counterEvidence)
      ? assessment.counterEvidence.map(String).slice(0, 10)
      : [],
  };
}

function synthesizePageAssessment({
  page,
  endDate,
  current = {},
  previous = {},
  detectorAssessments = {},
  cooldown,
  queryCoverage = 0,
  semanticCoverage = 0,
  semanticClusters = [],
  ctrBaseline = null,
  windowDays = 28,
  ruleVersion = 'balanced-v2.1',
  semanticVersion = 'semantic-v1',
  detectorCooldowns = null,
  inputHash = '',
  inputVersion = 'seo-analysis-input.v1',
  pageVersionKey = '',
} = {}) {
  const entries = Object.entries(detectorAssessments || {});
  const findings = entries.map(([type, assessment]) => findingFromAssessment(type, assessment));
  const actions = entries.map(([, assessment]) => assessmentAction(assessment)).filter(Boolean);
  const selectedAction = primaryAction(actions);
  const technicalAction = actions.find((action) => action.type === 'technical_indexing') || null;
  const scopedCooldowns = detectorCooldowns || Object.fromEntries(
    ALL_DETECTOR_TYPES.map((detector) => [detector, cooldown || { state: 'eligible' }])
  );
  const selectedCooldown = selectedAction ? scopedCooldowns[selectedAction.type] : null;
  const performanceEligible = !selectedAction
    || selectedAction.type === 'technical_indexing'
    || selectedCooldown?.state === 'eligible';
  const summaryCooldown = cooldown || aggregateCooldown(scopedCooldowns);
  const allPerformanceEligible = PERFORMANCE_ACTION_TYPES.every((detector) => (
    scopedCooldowns[detector]?.state === 'eligible'
  ));

  let primaryState = 'clear';
  if (technicalAction || (selectedAction && performanceEligible)) primaryState = 'actionable';
  else if (Object.values(scopedCooldowns).some((value) => (
    ['awaiting_recrawl', 'observing', 'directional'].includes(value?.state)
  ))) primaryState = 'watch';
  else if (findings.some((finding) => finding.state === 'watch')) primaryState = 'watch';
  else if (!findings.length || findings.some((finding) => finding.state === 'not_evaluable')) primaryState = 'not_evaluable';

  const evidenceLevel = performanceEligible
    && allPerformanceEligible
    && Number(queryCoverage) >= 0.6
    && Number(semanticCoverage) >= 0.9
    && (!ctrBaseline || ctrBaseline.eligible !== false)
    ? 'decision_grade'
    : 'directional';

  return {
    siteUrl: page?.siteUrl || undefined,
    pageKey: page?.pageKey,
    canonicalUrl: page?.canonicalUrl,
    endDate,
    windowDays,
    ruleVersion,
    semanticVersion,
    inputHash,
    inputVersion,
    pageVersionKey,
    primaryState,
    evidenceLevel,
    selectedActionType: technicalAction?.type || (performanceEligible ? selectedAction?.type : null) || null,
    metrics: { current, previous },
    coverage: {
      query: Number.isFinite(Number(queryCoverage)) ? Number(queryCoverage) : null,
      semantic: Number.isFinite(Number(semanticCoverage)) ? Number(semanticCoverage) : null,
    },
    cooldown: summaryCooldown || { state: 'eligible' },
    detectorCooldowns: scopedCooldowns,
    ctrBaseline: ctrBaseline || null,
    semanticClusters: Array.isArray(semanticClusters) ? semanticClusters.slice(0, 10) : [],
    detectorAssessments,
    findings,
    nextReviewDate: summaryCooldown?.nextReviewDate || null,
    updatedAt: new Date(),
  };
}

function eligibleTypesForCooldown(cooldown) {
  if (cooldown && Object.keys(cooldown).some((key) => ALL_DETECTOR_TYPES.includes(key))) {
    return new Set(ALL_DETECTOR_TYPES.filter((type) => (
      cooldown[type]?.state === 'eligible'
    )));
  }
  if (cooldown?.state === 'eligible') return new Set([...PERFORMANCE_ACTION_TYPES, 'technical_indexing']);
  return new Set();
}

module.exports = {
  PERFORMANCE_ACTION_TYPES,
  aggregateCooldown,
  cooldownForDetector,
  cooldownForPage,
  cooldownsForPage,
  eligibleTypesForCooldown,
  primaryAction,
  synthesizePageAssessment,
};
