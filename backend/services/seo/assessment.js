'use strict';

const { dateKeyInTimezone, inclusiveDateCount, shiftDateKey } = require('./dates');

const PERFORMANCE_ACTION_TYPES = Object.freeze([
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
]);
const STRUCTURAL_DETECTOR_TYPES = Object.freeze(['internal_link']);
const COOLDOWN_DETECTOR_TYPES = Object.freeze([
  ...PERFORMANCE_ACTION_TYPES,
  ...STRUCTURAL_DETECTOR_TYPES,
]);
const ALL_DETECTOR_TYPES = Object.freeze([
  ...COOLDOWN_DETECTOR_TYPES,
  'technical_indexing',
  'visibility_interruption',
]);

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
  const values = COOLDOWN_DETECTOR_TYPES
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
  const action = assessment.action || null;
  if (!action) return null;
  if (action.type === 'technical_indexing' || action.queueKind === 'technical') return action;
  const point = Number(action.expectedImpact?.point);
  const modeled = action.expectedImpact?.quality === 'modeled'
    && Number.isFinite(point)
    && point > 0;
  return modeled ? action : null;
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
    patternConfidence: Number(assessment?.patternConfidence ?? assessment?.confidence ?? 0),
    causeConfidence: Number(assessment?.causeConfidence || 0),
    disposition: String(assessment?.disposition || 'insufficient_evidence'),
    decisionGates: Array.isArray(assessment?.decisionGates)
      ? assessment.decisionGates.map(String).slice(0, 20)
      : [],
    nextReview: assessment?.nextReview || null,
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
  deviceCoverage = null,
  semanticClusters = [],
  queryOpportunities = [],
  visibility = null,
  ctrBaseline = null,
  windowDays = 28,
  ruleVersion = 'balanced-v2.2',
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

  const primaryFinding = (
    findings.find((finding) => finding.detector === technicalAction?.type && finding.state === 'actionable')
    || findings.find((finding) => finding.detector === selectedAction?.type && finding.state === 'actionable')
    || findings.find((finding) => (
      finding.detector === 'visibility_interruption'
      && finding.state === 'watch'
      && finding.disposition === 'investigate'
    ))
    || findings.find((finding) => finding.disposition === 'structural_review')
    || findings.find((finding) => finding.state === 'watch')
    || findings.find((finding) => finding.state === 'not_evaluable')
    || findings[0]
    || null
  );
  const disposition = primaryState === 'actionable'
    ? 'change_ready'
    : primaryFinding?.disposition || (primaryState === 'clear' ? 'no_change' : 'insufficient_evidence');
  const patternConfidence = Number(primaryFinding?.patternConfidence || 0);
  const causeConfidence = Number(primaryFinding?.causeConfidence || 0);
  const decisionGates = Array.from(new Set(findings.flatMap((finding) => finding.decisionGates || []))).slice(0, 30);
  const nextReview = primaryFinding?.nextReview || (summaryCooldown?.nextReviewDate ? {
    mode: 'date',
    at: summaryCooldown.nextReviewDate,
    rationale: 'post_change_cooldown',
  } : (primaryState === 'watch' || primaryState === 'not_evaluable' ? {
    mode: 'event',
    event: 'next_finalized_sync',
    rationale: primaryFinding?.code || 'refresh_evidence',
  } : null));

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
    disposition,
    patternConfidence: Math.max(0, Math.min(1, patternConfidence)),
    causeConfidence: Math.max(0, Math.min(1, causeConfidence)),
    primaryFinding,
    evidenceLevel,
    selectedActionType: technicalAction?.type || (performanceEligible ? selectedAction?.type : null) || null,
    metrics: { current, previous },
    coverage: {
      query: Number.isFinite(Number(queryCoverage)) ? Number(queryCoverage) : null,
      semantic: Number.isFinite(Number(semanticCoverage)) ? Number(semanticCoverage) : null,
      device: deviceCoverage === null || deviceCoverage === undefined
        ? null
        : (Number.isFinite(Number(deviceCoverage)) ? Number(deviceCoverage) : null),
    },
    cooldown: summaryCooldown || { state: 'eligible' },
    detectorCooldowns: scopedCooldowns,
    ctrBaseline: ctrBaseline || null,
    visibility: visibility || {},
    queryOpportunities: Array.isArray(queryOpportunities) ? queryOpportunities.slice(0, 10) : [],
    decisionGates,
    nextReview,
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
  if (cooldown?.state === 'eligible') return new Set([
    ...COOLDOWN_DETECTOR_TYPES,
    'technical_indexing',
  ]);
  return new Set();
}

module.exports = {
  PERFORMANCE_ACTION_TYPES,
  STRUCTURAL_DETECTOR_TYPES,
  aggregateCooldown,
  cooldownForDetector,
  cooldownForPage,
  cooldownsForPage,
  eligibleTypesForCooldown,
  primaryAction,
  synthesizePageAssessment,
};
