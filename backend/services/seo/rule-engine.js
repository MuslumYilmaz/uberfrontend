'use strict';

const { sha256 } = require('./keys');
const { dominantSemanticCluster, normalizeTokens } = require('./semantic-clustering');
const { assessVisibilityInterruption: assessVisibilityPattern } = require('./visibility-interruption');

const RULE_VERSION = 'balanced-v2.2';
const MIN_PAGE_IMPRESSIONS = 100;
const MIN_INTERNAL_LINK_IMPRESSIONS = 300;
const MIN_DECAY_IMPRESSIONS = 300;
const MIN_DECAY_PRIOR_CLICKS = 20;
const MIN_DECAY_LOST_CLICKS = 5;
const MIN_QUERY_IMPRESSIONS = 50;
const MIN_QUERY_COVERAGE = 0.6;
const MIN_SEMANTIC_COVERAGE = 0.9;
const MIN_DOMINANT_CLUSTER_SHARE = 0.35;
const MIN_FULL_PAGE_CLUSTER_SHARE = 0.25;
const MAX_ALIGNED_TOPIC_SCORE = 0.25;
const REQUIRED_PERSISTENT_WEEKS = 3;
const REQUIRED_WEEK_COUNT = 4;
const WILSON_90_Z = 1.6448536269514722;

const DETECTOR_STATES = Object.freeze(['not_evaluable', 'clear', 'watch', 'actionable']);
const DISPOSITIONS = Object.freeze([
  'insufficient_evidence', 'monitor', 'investigate', 'structural_review', 'change_ready', 'no_change',
]);
const BASELINE_QUALITY = Object.freeze(['insufficient', 'low', 'medium', 'high']);
const PERFORMANCE_DETECTORS = new Set([
  'ctr_snippet', 'intent_mismatch', 'content_decay', 'cannibalization',
]);

const REASON_SUMMARIES = Object.freeze({
  page_identity_missing: 'The page identity is incomplete, so this detector was not evaluated.',
  insufficient_impressions: 'The page does not yet have enough impressions for this detector.',
  outside_top_ten: 'The page is outside the ranking range used for snippet comparisons.',
  position_not_stable: 'Ranking movement could explain the CTR change, so no snippet action is proposed.',
  baseline_quality_insufficient: 'The peer cohort is too small or click-poor for a reliable CTR comparison.',
  baseline_quality_low: 'The peer cohort is directional, but not strong enough to open a CTR action.',
  baseline_counts_unavailable: 'The peer cohort counts are unavailable.',
  baseline_too_few_peers: 'The peer cohort has fewer than ten comparable pages.',
  baseline_too_few_clicks: 'The peer cohort has fewer than twenty-five clicks.',
  baseline_too_few_impressions: 'The peer cohort has fewer than three thousand impressions.',
  baseline_zero_click_heavy: 'Most peer pages have zero clicks, reducing baseline quality.',
  no_material_ctr_gap: 'CTR is not materially below the supported peer expectation.',
  statistically_uncertain: 'The observed difference remains inside the 90% uncertainty bounds.',
  supported_ctr_gap: 'CTR is materially below a supported peer baseline at a stable ranking.',
  intent_not_confirmed: 'The page promise must be owner-confirmed before intent mismatch can be evaluated.',
  semantic_clusters_unavailable: 'Semantic query evidence is unavailable for this page.',
  query_coverage_inconsistent: 'Visible query totals exceed the authoritative page total, so intent evidence is unsafe.',
  semantic_coverage_below_threshold: 'Less than 90% of visible query impressions were semantically classified.',
  source_preference: 'Visible queries align with the page topic, with a notable official/reference source preference.',
  topic_aligned_visible_subset: 'The visible query subset is strongly aligned with the page promise.',
  query_coverage_below_threshold: 'Visible queries cover too little of the page total for an intent decision.',
  no_dominant_alternate_intent: 'No alternate semantic intent clears the dominance and page-share gates.',
  topic_aligned: 'The dominant semantic cluster aligns with the confirmed page promise.',
  dominant_semantic_mismatch: 'A dominant, sufficiently covered semantic cluster conflicts with the confirmed page promise.',
  incomplete_equal_windows: 'Two complete equal 28-day windows are required for decay detection.',
  low_sample: 'The prior window has fewer than 20 clicks, so the movement is treated as low sample.',
  no_material_click_loss: 'The absolute click loss is below the five-click decay floor.',
  demand_shift_not_content_decay: 'Impressions fell while ranking and CTR stayed broadly stable, suggesting demand shift rather than content decay.',
  no_material_decay_signal: 'Neither CTR nor average-position loss clears the decay threshold.',
  persistence_unavailable: 'Four weekly comparisons are required before a decay action can open.',
  not_persistent: 'The decline did not persist in at least three of four weekly comparisons.',
  persistent_ctr_decay: 'CTR decay is statistically separated and persists across at least three of four weeks.',
  persistent_position_decay: 'Average-position decay persists across at least three of four weeks.',
  cannibalization_data_unavailable: 'Cross-page semantic competition was not evaluated for this page.',
  cannibalization_persistence_unavailable: 'Semantic overlap exists, but weekly URL alternation has not been established.',
  no_persistent_url_competition: 'No second URL clears the material and persistent competition gates.',
  persistent_url_competition: 'Two URLs materially compete for the same semantic cluster.',
  outside_internal_link_opportunity_range: 'The page is outside the position 8–20 internal-link opportunity range.',
  no_internal_link_gap: 'Internal-link support is not below the comparable-page threshold.',
  supported_internal_link_gap: 'A near-page-one URL has a supported internal-link gap.',
  internal_link_cohort_insufficient: 'Fewer than ten mature, comparable pages are available for an internal-link benchmark.',
  internal_link_gap_below_floor: 'The page is not at least two contextual links below its comparable-page lower quartile.',
  internal_link_donors_insufficient: 'Fewer than two safe, semantically relevant donor pages are available.',
  internal_link_structural_review: 'A measurable internal-link deficit has safe donor candidates, but its ranking effect is not yet proven.',
  ranking_effect_not_estimated: 'The structural gap is supported, but its ranking effect has not been estimated.',
  page_not_intended_for_indexing: 'The page is not intended for indexing.',
  no_technical_indexing_anomaly: 'No technical indexing or canonical anomaly is present.',
  technical_indexing_anomaly: 'A technical indexing or canonical signal requires review.',
  technical_state_unverified: 'Google indexing state is unverified because a current URL Inspection result is unavailable.',
  visibility_partitions_incomplete: 'Complete page and property partitions are required before zero-impression days can be interpreted.',
  visibility_prior_floor_unmet: 'The prior window lacks the impressions or visible days required for interruption detection.',
  new_or_ramping_page: 'The page is new or still ramping, so classic decay and interruption comparisons are withheld.',
  no_visibility_interruption: 'No sustained page-level visibility interruption is supported by complete partitions.',
  visibility_interruption: 'The page lost most of its property impression share during a sustained zero-impression run.',
  url_inspection_required: 'A current URL Inspection result is required before the interruption cause can be assessed.',
  visibility_inspection_passed: 'A current URL Inspection passed, so the interruption is being monitored through post-crawl finalized windows.',
  visibility_inspection_anomaly: 'A current URL Inspection confirms an indexing, robots, or canonical anomaly that requires technical diagnosis.',
  post_inspection_14_finalized_days: 'Fourteen clean finalized days after the inspected crawl are required for the first recovery review.',
  post_inspection_28_finalized_days: 'Twenty-eight clean finalized days after the inspected crawl are required for the full recovery review.',
  visibility_interruption_requires_diagnosis: 'A visibility interruption must be diagnosed before content or snippet actions can open.',
  performance_window_precedes_production: 'The finalized GSC window predates the current production version.',
  production_timing_unverified: 'Production timing is not verified, so the finalized GSC window cannot be attributed to this page version.',
  post_deploy_crawl_required: 'Google has not crawled the page after the current production version became available.',
  serp_review_required: 'A manual SERP review is required before a query-pattern hypothesis can become a change action.',
  device_evidence_unavailable: 'Device evidence is unavailable, so the query opportunity is directional only.',
  device_coverage_below_threshold: 'Visible device rows cover too little of the authoritative page total.',
  fingerprint_evidence_unavailable: 'Required rendered fingerprint evidence is unavailable, so this detector is not evaluable.',
  technical_clear_awaiting_post_deploy_crawl: 'Technical checks are clear in the manifest, but Google has not yet confirmed the deployed version.',
  observing_change: 'A recent material change is still inside its clean finalized-data observation window.',
  awaiting_recrawl: 'Google has not crawled the page since its latest material change.',
  awaiting_manifest_change: 'The implementation was recorded, but a matching production fingerprint has not been observed yet.',
  awaiting_deployment: 'The fingerprint changed locally, but a matching production deployment has not been verified yet.',
  awaiting_source_recrawl: 'Changed source pages must be crawled before the internal-link effect can be evaluated.',
  source_dependency_unavailable: 'A changed internal-link source is no longer in the manifest, so deployment attribution is not evaluable.',
  performance_action_suppressed_by_cooldown: 'Performance evidence is being observed until the change cooldown completes.',
});

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function fingerprint(type, pageKey, signalParts = []) {
  return sha256([RULE_VERSION, type, pageKey, ...signalParts].join('|'));
}

function baseAction(page, type, values) {
  const hasModeledClicks = values.expectedAdditionalClicks !== null
    && values.expectedAdditionalClicks !== undefined
    && Number.isFinite(Number(values.expectedAdditionalClicks));
  const modeledClicks = hasModeledClicks ? Math.max(0, Number(values.expectedAdditionalClicks)) : null;
  return {
    pageKey: page.pageKey,
    canonicalUrl: page.canonicalUrl,
    type,
    source: RULE_VERSION,
    ruleVersion: RULE_VERSION,
    confidence: clamp(values.confidence, 0, 1),
    patternConfidence: clamp(values.patternConfidence ?? values.confidence, 0, 1),
    causeConfidence: clamp(values.causeConfidence ?? values.confidence, 0, 1),
    queueKind: values.queueKind || (type === 'technical_indexing' ? 'technical' : 'performance'),
    expectedAdditionalClicks: modeledClicks,
    expectedImpact: values.expectedImpact || (modeledClicks === null ? null : {
      metric: 'clicks',
      low: null,
      point: modeledClicks,
      high: null,
      windowDays: 28,
      quality: 'directional',
    }),
    priorityScore: Math.max(0, finite(values.priorityScore)),
    summary: values.summary,
    hypothesis: values.hypothesis || '',
    evidence: values.evidence || {},
    recommendation: values.recommendation || {},
    successCriteria: values.successCriteria || {},
    fingerprint: fingerprint(type, page.pageKey, values.fingerprintParts),
  };
}

function detectorAssessment(detector, state, {
  reasonCodes = [],
  confidence = 0,
  patternConfidence = confidence,
  causeConfidence = state === 'actionable' ? confidence : 0,
  disposition = null,
  nextReview = null,
  decisionGates = [],
  evidence = {},
  action = null,
} = {}) {
  if (!DETECTOR_STATES.includes(state)) throw new Error(`Invalid detector state: ${state}`);
  const normalizedReasonCodes = unique(reasonCodes);
  const normalizedEvidence = {
    ...evidence,
    summary: String(evidence.summary || REASON_SUMMARIES[normalizedReasonCodes[0]] || ''),
  };
  const defaultDisposition = state === 'actionable'
    ? 'change_ready'
    : state === 'clear' ? 'no_change'
      : state === 'watch' ? 'monitor' : 'insufficient_evidence';
  const normalizedDisposition = DISPOSITIONS.includes(disposition) ? disposition : defaultDisposition;
  return {
    detector,
    type: detector,
    state,
    reasonCodes: normalizedReasonCodes,
    confidence: clamp(confidence),
    patternConfidence: clamp(patternConfidence),
    causeConfidence: clamp(causeConfidence),
    disposition: normalizedDisposition,
    decisionGates: unique(decisionGates).slice(0, 20),
    nextReview,
    evidence: normalizedEvidence,
    action: state === 'actionable' ? action : null,
  };
}

function reasonSummaryForCode(code) {
  return String(REASON_SUMMARIES[String(code || '')] || '');
}

function isKnownReasonCode(code) {
  return Object.prototype.hasOwnProperty.call(REASON_SUMMARIES, String(code || ''));
}

function wilsonInterval(clicks, impressions, z = WILSON_90_Z) {
  const n = Math.max(0, finite(impressions));
  if (n <= 0) return { low: 0, high: 1 };
  const successes = Math.max(0, Math.min(n, finite(clicks)));
  const p = successes / n;
  const zSquared = z * z;
  const denominator = 1 + zSquared / n;
  const center = (p + zSquared / (2 * n)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + zSquared / (4 * n)) / n) / denominator;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

function intervalsSeparate(lowerMetric, higherMetric) {
  return lowerMetric.high < higherMetric.low;
}

function downgradeQuality(quality) {
  const index = BASELINE_QUALITY.indexOf(quality);
  return BASELINE_QUALITY[Math.max(0, index - 1)];
}

function assessCtrBaselineQuality(input = {}) {
  const numericInput = typeof input === 'number';
  const peerPageCount = Math.max(0, finite(input.peerPageCount));
  const peerClicks = Math.max(0, finite(input.peerClicks));
  const peerImpressions = Math.max(0, finite(input.peerImpressions));
  const zeroClickPeerShare = clamp(input.zeroClickPeerShare);
  const ctr = numericInput ? Math.max(0, finite(input)) : Math.max(0, finite(input.ctr, ratio(peerClicks, peerImpressions)));
  let quality;
  if (peerPageCount < 10 || peerClicks < 25 || peerImpressions < 3000) quality = 'insufficient';
  else if (peerPageCount < 20 || peerClicks < 75 || peerImpressions < 10000) quality = 'low';
  else if (peerPageCount < 40 || peerClicks < 200 || peerImpressions < 25000) quality = 'medium';
  else quality = 'high';
  const reasonCodes = [];
  if (numericInput) reasonCodes.push('baseline_counts_unavailable');
  if (peerPageCount < 10) reasonCodes.push('baseline_too_few_peers');
  if (peerClicks < 25) reasonCodes.push('baseline_too_few_clicks');
  if (peerImpressions < 3000) reasonCodes.push('baseline_too_few_impressions');
  if (zeroClickPeerShare >= 0.8) {
    quality = downgradeQuality(quality);
    reasonCodes.push('baseline_zero_click_heavy');
  }
  return {
    quality,
    eligible: ['medium', 'high'].includes(quality),
    cohort: numericInput ? 'legacy_unknown' : String(input.cohort || 'unknown'),
    ctr,
    peerPageCount,
    peerClicks,
    peerImpressions,
    zeroClickPeerShare,
    lower90: wilsonInterval(peerClicks, peerImpressions).low,
    upper90: wilsonInterval(peerClicks, peerImpressions).high,
    reasonCodes: unique(reasonCodes),
  };
}

function assessCtrSnippet(context = {}) {
  const { page = {}, current = {}, previous = {} } = context;
  const impressions = Math.max(0, finite(current.impressions));
  const clicks = Math.max(0, finite(current.clicks));
  const position = finite(current.position);
  const priorPosition = finite(previous.position, NaN);
  const ctr = ratio(clicks, impressions);
  const baseline = assessCtrBaselineQuality(context.ctrBaseline || {});
  const evidence = {
    windowDays: finite(context.windowDays, 28),
    current: { clicks, impressions, ctr, position },
    baseline,
    queryCoverage: context.queryCoverage ?? null,
  };
  if (!page.pageKey || !page.canonicalUrl) {
    return detectorAssessment('ctr_snippet', 'not_evaluable', { reasonCodes: ['page_identity_missing'], evidence });
  }
  if (impressions < MIN_PAGE_IMPRESSIONS || position < 1 || position > 10) {
    return detectorAssessment('ctr_snippet', 'not_evaluable', {
      reasonCodes: [impressions < MIN_PAGE_IMPRESSIONS ? 'insufficient_impressions' : 'outside_top_ten'], evidence,
    });
  }
  const stablePosition = !Number.isFinite(priorPosition)
    || finite(previous.impressions) === 0
    || Math.abs(position - priorPosition) <= 1;
  if (!stablePosition) {
    return detectorAssessment('ctr_snippet', 'watch', { reasonCodes: ['position_not_stable'], confidence: 0.5, evidence });
  }
  if (!['medium', 'high'].includes(baseline.quality) || baseline.ctr <= 0) {
    return detectorAssessment('ctr_snippet', 'watch', {
      reasonCodes: [`baseline_quality_${baseline.quality}`, ...baseline.reasonCodes], confidence: 0.35, evidence,
    });
  }
  const deficit = (baseline.ctr - ctr) / baseline.ctr;
  const expectedAdditionalClicks = Math.max(0, impressions * baseline.ctr - clicks);
  evidence.deficit = deficit;
  evidence.expectedAdditionalClicks = expectedAdditionalClicks;
  evidence.currentWilson90 = wilsonInterval(clicks, impressions);
  evidence.baselineWilson90 = wilsonInterval(baseline.peerClicks, baseline.peerImpressions);
  if (deficit < 0.2 || expectedAdditionalClicks < 3) {
    return detectorAssessment('ctr_snippet', 'clear', {
      reasonCodes: ['no_material_ctr_gap'], confidence: 0.7, evidence,
    });
  }
  if (!intervalsSeparate(evidence.currentWilson90, evidence.baselineWilson90)) {
    return detectorAssessment('ctr_snippet', 'watch', {
      reasonCodes: ['statistically_uncertain'], confidence: 0.5, evidence,
    });
  }
  const confidence = Math.min(0.95, 0.62 + Math.min(0.18, impressions / 10000) + Math.min(0.15, deficit / 2));
  return detectorAssessment('ctr_snippet', 'watch', {
    reasonCodes: ['supported_ctr_gap', 'serp_review_required'],
    confidence,
    patternConfidence: confidence,
    causeConfidence: 0.45,
    disposition: 'investigate',
    decisionGates: ['serp_review_required'],
    nextReview: { mode: 'event', event: 'serp_review', rationale: 'validate_snippet_hypothesis' },
    evidence,
  });
}

function tokenize(value) {
  return new Set(normalizeTokens(value).filter((token) => token.length > 2));
}

function tokenOverlap(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const token of a) if (b.has(token)) common += 1;
  return common / Math.min(a.size, b.size);
}

function semanticIntentInputs(context) {
  const result = context.semanticClusters;
  const semanticCluster = dominantSemanticCluster(result);
  if (semanticCluster) {
    return {
      cluster: semanticCluster,
      publicLabel: semanticCluster.label || 'semantic topic',
      impressions: finite(semanticCluster.current?.impressions),
      visibleShare: finite(semanticCluster.current?.visibleShare),
      fullPageLowerBoundShare: finite(semanticCluster.current?.fullPageLowerBoundShare),
      topicAlignment: finite(semanticCluster.topicAlignment),
      sourcePreferenceShare: finite(semanticCluster.sourcePreferenceShare),
      semanticCoverage: finite(result.currentSemanticCoverage, result.semanticCoverage),
      queryCoverage: finite(result.pageQueryCoverage?.current, context.queryCoverage),
      queryCoverageStatus: result.pageQueryCoverage?.currentStatus || 'consistent',
    };
  }
  const legacy = context.dominantQueryCluster;
  if (!legacy) return null;
  return {
    cluster: legacy,
    publicLabel: 'legacy query cluster',
    impressions: finite(legacy.impressions),
    visibleShare: finite(legacy.impressionShare),
    fullPageLowerBoundShare: finite(legacy.fullPageLowerBoundShare),
    topicAlignment: tokenOverlap(
      context.page?.intendedIntent || context.page?.targetKeyword,
      legacy.intent || legacy.label
    ),
    sourcePreferenceShare: finite(legacy.sourcePreferenceShare),
    semanticCoverage: finite(context.semanticCoverage),
    queryCoverage: finite(context.queryCoverage),
    queryCoverageStatus: context.queryCoverage > 1 ? 'inconsistent' : 'consistent',
  };
}

function directionalIntentReasonCodes(inputs) {
  if (!inputs) return ['semantic_clusters_unavailable'];
  if (inputs.queryCoverageStatus === 'inconsistent') return ['query_coverage_inconsistent'];
  if (inputs.semanticCoverage < MIN_SEMANTIC_COVERAGE) return ['semantic_coverage_below_threshold'];
  const topicAligned = inputs.topicAlignment >= MAX_ALIGNED_TOPIC_SCORE;
  const sourcePreference = inputs.sourcePreferenceShare >= 0.35 && topicAligned;
  if (inputs.queryCoverage < MIN_QUERY_COVERAGE) {
    return unique([
      sourcePreference ? 'source_preference' : null,
      topicAligned ? 'topic_aligned_visible_subset' : null,
      'query_coverage_below_threshold',
    ]);
  }
  if (
    inputs.impressions < MIN_QUERY_IMPRESSIONS
    || inputs.visibleShare < MIN_DOMINANT_CLUSTER_SHARE
    || inputs.fullPageLowerBoundShare < MIN_FULL_PAGE_CLUSTER_SHARE
  ) return ['no_dominant_alternate_intent'];
  if (topicAligned) return [sourcePreference ? 'source_preference' : 'topic_aligned'];
  return ['dominant_semantic_mismatch'];
}

function assessIntentMismatch(context = {}) {
  const page = context.page || {};
  const inputs = semanticIntentInputs(context);
  const evidence = inputs ? {
    windowDays: finite(context.windowDays, 28),
    queryCoverage: inputs.queryCoverage,
    queryCoverageStatus: inputs.queryCoverageStatus,
    semanticCoverage: inputs.semanticCoverage,
    dominantCluster: {
      clusterKey: inputs.cluster.clusterKey || null,
      label: inputs.publicLabel,
      tech: inputs.cluster.tech || '',
      impressions: inputs.impressions,
      visibleShare: inputs.visibleShare,
      fullPageLowerBoundShare: inputs.fullPageLowerBoundShare,
      topicAlignment: inputs.topicAlignment,
      dominantFacet: inputs.cluster.dominantFacet || null,
      sourcePreferenceShare: inputs.sourcePreferenceShare,
    },
  } : {};
  if (!page.intentConfirmed) {
    return detectorAssessment('intent_mismatch', 'not_evaluable', {
      reasonCodes: ['intent_not_confirmed', ...directionalIntentReasonCodes(inputs)],
      confidence: inputs ? 0.35 : 0,
      evidence: { ...evidence, directional: Boolean(inputs) },
    });
  }
  if (!inputs) {
    return detectorAssessment('intent_mismatch', 'not_evaluable', { reasonCodes: ['semantic_clusters_unavailable'], evidence });
  }
  if (inputs.queryCoverageStatus === 'inconsistent') {
    return detectorAssessment('intent_mismatch', 'not_evaluable', { reasonCodes: ['query_coverage_inconsistent'], evidence });
  }
  if (inputs.semanticCoverage < MIN_SEMANTIC_COVERAGE) {
    return detectorAssessment('intent_mismatch', 'not_evaluable', {
      reasonCodes: ['semantic_coverage_below_threshold'], confidence: 0.2, evidence,
    });
  }
  const sourcePreference = inputs.sourcePreferenceShare >= 0.35 && inputs.topicAlignment >= MAX_ALIGNED_TOPIC_SCORE;
  if (inputs.queryCoverage < MIN_QUERY_COVERAGE) {
    return detectorAssessment('intent_mismatch', sourcePreference || inputs.topicAlignment >= MAX_ALIGNED_TOPIC_SCORE ? 'watch' : 'not_evaluable', {
      reasonCodes: [
        sourcePreference ? 'source_preference' : null,
        inputs.topicAlignment >= MAX_ALIGNED_TOPIC_SCORE ? 'topic_aligned_visible_subset' : null,
        'query_coverage_below_threshold',
      ],
      confidence: 0.45,
      evidence: { ...evidence, directional: true },
    });
  }
  if (
    inputs.impressions < MIN_QUERY_IMPRESSIONS
    || inputs.visibleShare < MIN_DOMINANT_CLUSTER_SHARE
    || inputs.fullPageLowerBoundShare < MIN_FULL_PAGE_CLUSTER_SHARE
  ) {
    return detectorAssessment('intent_mismatch', 'clear', {
      reasonCodes: ['no_dominant_alternate_intent'], confidence: 0.65, evidence,
    });
  }
  if (inputs.topicAlignment >= MAX_ALIGNED_TOPIC_SCORE) {
    return detectorAssessment('intent_mismatch', sourcePreference ? 'watch' : 'clear', {
      reasonCodes: [sourcePreference ? 'source_preference' : 'topic_aligned'], confidence: 0.75, evidence,
    });
  }
  const confidence = Math.min(0.9, 0.55 + inputs.visibleShare * 0.2 + inputs.queryCoverage * 0.1);
  return detectorAssessment('intent_mismatch', 'watch', {
    reasonCodes: ['dominant_semantic_mismatch', 'serp_review_required'],
    confidence,
    patternConfidence: confidence,
    causeConfidence: 0.35,
    disposition: 'investigate',
    decisionGates: ['serp_review_required'],
    nextReview: { mode: 'event', event: 'serp_review', rationale: 'confirm_search_intent' },
    evidence,
  });
}

function weeklyPairs(weekly) {
  if (Array.isArray(weekly)) return weekly.map((pair) => ({ current: pair?.current || {}, previous: pair?.previous || {} }));
  const current = Array.isArray(weekly?.current) ? weekly.current : [];
  const previous = Array.isArray(weekly?.previous) ? weekly.previous : [];
  return Array.from({ length: Math.min(current.length, previous.length) }, (_, index) => ({
    current: current[index] || {}, previous: previous[index] || {},
  }));
}

function weeklyPersistence(weekly, branch) {
  const pairs = weeklyPairs(weekly).slice(0, REQUIRED_WEEK_COUNT);
  let decliningWeeks = 0;
  for (const pair of pairs) {
    if (branch === 'ctr') {
      const currentCtr = ratio(finite(pair.current.clicks), finite(pair.current.impressions));
      const previousCtr = ratio(finite(pair.previous.clicks), finite(pair.previous.impressions));
      if (previousCtr > 0 && currentCtr < previousCtr) decliningWeeks += 1;
    } else if (finite(pair.current.position) - finite(pair.previous.position) >= 0.75) {
      decliningWeeks += 1;
    }
  }
  return {
    available: pairs.length >= REQUIRED_WEEK_COUNT,
    totalWeeks: pairs.length,
    decliningWeeks,
    requiredWeeks: REQUIRED_PERSISTENT_WEEKS,
    persistent: pairs.length >= REQUIRED_WEEK_COUNT && decliningWeeks >= REQUIRED_PERSISTENT_WEEKS,
  };
}

function completeDecayWindows(context) {
  if (finite(context.windowDays, 28) !== 28) return false;
  if (context.windowsComplete === false) return false;
  if (context.windowsComplete && typeof context.windowsComplete === 'object') {
    return context.windowsComplete.current !== false && context.windowsComplete.previous !== false;
  }
  return true;
}

function assessContentDecay(context = {}) {
  const { page = {}, current = {}, previous = {}, yearAgo = null } = context;
  const currentClicks = Math.max(0, finite(current.clicks));
  const previousClicks = Math.max(0, finite(previous.clicks));
  const currentImpressions = Math.max(0, finite(current.impressions));
  const previousImpressions = Math.max(0, finite(previous.impressions));
  const currentCtr = ratio(currentClicks, currentImpressions);
  const previousCtr = ratio(previousClicks, previousImpressions);
  const lostClicks = Math.max(0, previousClicks - currentClicks);
  const clickDrop = ratio(lostClicks, previousClicks);
  const ctrDrop = previousCtr > 0 ? (previousCtr - currentCtr) / previousCtr : 0;
  const impressionDrop = ratio(previousImpressions - currentImpressions, previousImpressions);
  const positionLoss = finite(current.position) - finite(previous.position);
  const currentWilson90 = wilsonInterval(currentClicks, currentImpressions);
  const previousWilson90 = wilsonInterval(previousClicks, previousImpressions);
  const evidence = {
    windowDays: finite(context.windowDays, 28),
    current: { clicks: currentClicks, impressions: currentImpressions, ctr: currentCtr, position: finite(current.position) },
    previous: { clicks: previousClicks, impressions: previousImpressions, ctr: previousCtr, position: finite(previous.position) },
    lostClicks,
    clickDrop,
    ctrDrop,
    impressionDrop,
    positionLoss,
    currentWilson90,
    previousWilson90,
  };
  if (!completeDecayWindows(context)) {
    return detectorAssessment('content_decay', 'not_evaluable', { reasonCodes: ['incomplete_equal_windows'], evidence });
  }
  if (context.visibility?.mature === false) {
    return detectorAssessment('content_decay', 'not_evaluable', {
      reasonCodes: ['new_or_ramping_page'],
      evidence: { ...evidence, firstVisibleDate: context.visibility.firstVisibleDate || null },
      nextReview: { mode: 'event', event: 'next_finalized_sync', rationale: 'await_mature_comparison_window' },
    });
  }
  if (currentImpressions < MIN_DECAY_IMPRESSIONS || previousImpressions < MIN_DECAY_IMPRESSIONS) {
    return detectorAssessment('content_decay', 'not_evaluable', { reasonCodes: ['insufficient_impressions'], evidence });
  }
  if (previousClicks < MIN_DECAY_PRIOR_CLICKS) {
    return detectorAssessment('content_decay', 'watch', { reasonCodes: ['low_sample'], confidence: 0.35, evidence });
  }
  if (lostClicks < MIN_DECAY_LOST_CLICKS) {
    return detectorAssessment('content_decay', 'clear', { reasonCodes: ['no_material_click_loss'], confidence: 0.7, evidence });
  }
  const ctrCandidate = ctrDrop >= 0.3;
  const rankingCandidate = positionLoss >= 1.5;
  if (!ctrCandidate && !rankingCandidate) {
    const demandShift = impressionDrop >= 0.2 && Math.abs(positionLoss) < 1 && Math.abs(ctrDrop) < 0.2;
    return detectorAssessment('content_decay', demandShift ? 'watch' : 'clear', {
      reasonCodes: [demandShift ? 'demand_shift_not_content_decay' : 'no_material_decay_signal'],
      confidence: demandShift ? 0.6 : 0.7,
      evidence,
    });
  }
  const branches = [];
  if (ctrCandidate) {
    const persistence = weeklyPersistence(context.weekly || context.weeklyComparisons, 'ctr');
    branches.push({ branch: 'ctr', persistence, uncertain: !intervalsSeparate(currentWilson90, previousWilson90) });
  }
  if (rankingCandidate) {
    branches.push({
      branch: 'position',
      persistence: weeklyPersistence(context.weekly || context.weeklyComparisons, 'position'),
      uncertain: false,
    });
  }
  evidence.branches = branches;
  const statisticallySupported = branches.filter((branch) => !branch.uncertain);
  if (!statisticallySupported.length) {
    return detectorAssessment('content_decay', 'watch', {
      reasonCodes: ['statistically_uncertain'], confidence: 0.45, evidence,
    });
  }
  if (statisticallySupported.every((branch) => !branch.persistence.available)) {
    return detectorAssessment('content_decay', 'watch', {
      reasonCodes: ['persistence_unavailable'], confidence: 0.45, evidence,
    });
  }
  const persistent = statisticallySupported.find((branch) => branch.persistence.persistent);
  if (!persistent) {
    return detectorAssessment('content_decay', 'watch', {
      reasonCodes: ['not_persistent'], confidence: 0.5, evidence,
    });
  }
  const confidence = Math.min(0.92, (yearAgo ? 0.8 : 0.72) + Math.min(0.1, lostClicks / 200));
  const action = baseAction(page, 'content_decay', {
    confidence,
    expectedAdditionalClicks: lostClicks,
    patternConfidence: confidence,
    causeConfidence: Math.max(0.55, confidence - 0.15),
    expectedImpact: {
      metric: 'clicks',
      low: Math.max(1, Math.floor(lostClicks * 0.35)),
      point: lostClicks,
      high: lostClicks,
      windowDays: 28,
      quality: 'modeled',
    },
    priorityScore: Math.max(1, lostClicks) * confidence,
    summary: 'Organic performance declined across two complete windows with persistent supporting evidence.',
    hypothesis: 'The page may have lost freshness, topical coverage, or ranking strength.',
    evidence: {
      summary: persistent.branch === 'ctr'
        ? `CTR fell ${Math.round(ctrDrop * 100)}% with non-overlapping 90% Wilson intervals.`
        : `Average position worsened by ${positionLoss.toFixed(1)}.`,
      ...evidence,
      signals: [
        persistent.branch === 'ctr' ? 'supported CTR decline' : 'position decline',
        `${persistent.persistence.decliningWeeks}/${persistent.persistence.totalWeeks} declining weeks`,
        yearAgo ? 'year-over-year comparison available' : 'seasonality not yet ruled out',
      ],
    },
    recommendation: {
      title: 'Audit freshness and lost topic coverage',
      rationale: 'Separate a demand change from content decay before rewriting.',
      checklist: ['Compare lost semantic clusters', 'Check stale examples and dates', 'Review competing result formats', 'Update only the sections supported by evidence'],
    },
    successCriteria: persistent.branch === 'ctr'
      ? { metric: 'clicks', recoverToPreviousWindowRatio: 0.9, baselinePreviousClicks: previousClicks, minimumClicks: Math.ceil(previousClicks * 0.9) }
      : { metric: 'averagePosition', minimumImprovement: 1 },
    fingerprintParts: [persistent.branch],
  });
  return detectorAssessment('content_decay', 'actionable', {
    reasonCodes: [`persistent_${persistent.branch}_decay`], confidence, evidence, action,
  });
}

function assessCannibalization(context = {}) {
  const { page = {}, cannibalization = null } = context;
  const coverage = finite(context.queryCoverage ?? context.semanticClusters?.pageQueryCoverage?.current);
  const semanticCoverage = finite(context.semanticCoverage ?? context.semanticClusters?.currentSemanticCoverage);
  const evidence = {
    queryCoverage: coverage,
    semanticCoverage,
    coverageUnsafe: Boolean(cannibalization?.coverageUnsafe),
    clusterKey: cannibalization?.clusterKey || null,
    secondPageKey: cannibalization?.secondPageKey || null,
    secondUrlImpressionShare: finite(cannibalization?.secondUrlImpressionShare),
    alternatingWeeks: finite(cannibalization?.alternatingWeeks),
    clusterImpressions: finite(cannibalization?.clusterImpressions),
  };
  if (coverage > 1) {
    return detectorAssessment('cannibalization', 'not_evaluable', { reasonCodes: ['query_coverage_inconsistent'], evidence });
  }
  if (coverage < MIN_QUERY_COVERAGE || semanticCoverage < MIN_SEMANTIC_COVERAGE) {
    return detectorAssessment('cannibalization', 'not_evaluable', {
      reasonCodes: [coverage < MIN_QUERY_COVERAGE ? 'query_coverage_below_threshold' : null, semanticCoverage < MIN_SEMANTIC_COVERAGE ? 'semantic_coverage_below_threshold' : null],
      evidence,
    });
  }
  if (cannibalization?.coverageUnsafe) {
    return detectorAssessment('cannibalization', 'not_evaluable', {
      reasonCodes: ['cannibalization_data_unavailable'], evidence,
    });
  }
  if (!cannibalization) {
    return detectorAssessment('cannibalization', 'clear', {
      reasonCodes: ['no_persistent_url_competition'], confidence: 0.7, evidence,
    });
  }
  if (cannibalization.semantic && finite(cannibalization.alternatingWeeks) < 3) {
    return detectorAssessment('cannibalization', 'not_evaluable', {
      reasonCodes: ['cannibalization_persistence_unavailable'], evidence,
    });
  }
  const secondShare = finite(cannibalization.secondUrlImpressionShare);
  const alternatingWeeks = finite(cannibalization.alternatingWeeks);
  const clusterImpressions = finite(cannibalization.clusterImpressions);
  if (secondShare < 0.2 || alternatingWeeks < 3 || clusterImpressions < MIN_PAGE_IMPRESSIONS) {
    return detectorAssessment('cannibalization', 'clear', { reasonCodes: ['no_persistent_url_competition'], confidence: 0.7, evidence });
  }
  const confidence = Math.min(0.9, 0.55 + secondShare * 0.25 + alternatingWeeks * 0.03);
  const action = baseAction(page, 'cannibalization', {
    confidence,
    priorityScore: clusterImpressions * confidence * 0.01,
    summary: 'Multiple URLs compete for the same non-brand semantic cluster.',
    hypothesis: 'Overlapping page promises may be splitting ranking signals or causing unstable URL selection.',
    evidence: {
      summary: `A second URL holds ${Math.round(secondShare * 100)}% of cluster impressions with ${alternatingWeeks} weeks of alternation.`,
      windowDays: context.windowDays || 28,
      queryCoverage: coverage,
      semanticCoverage,
      signals: ['multiple ranking URLs', 'material second-URL share', 'ranking alternation', 'sufficient semantic coverage'],
    },
    recommendation: {
      title: 'Choose differentiation or controlled consolidation',
      rationale: 'The correct response depends on whether the pages serve distinct reader jobs.',
      checklist: ['Compare confirmed intents', 'Differentiate headings and internal anchors if both pages are needed', 'Require owner approval for merge, redirect, or canonical'],
    },
    successCriteria: { metric: 'dominantUrlShare', minimum: 0.8 },
    fingerprintParts: [cannibalization.clusterKey || 'cluster', cannibalization.secondPageKey || 'second-page'],
  });
  return detectorAssessment('cannibalization', 'actionable', {
    reasonCodes: ['persistent_url_competition'], confidence, evidence, action,
  });
}

function assessInternalLinkGap(context = {}) {
  const { page = {}, current = {}, internalLinks = {} } = context;
  const position = finite(current.position);
  const donors = (Array.isArray(internalLinks.qualifiedDonors) ? internalLinks.qualifiedDonors : [])
    .filter((donor) => donor && typeof donor === 'object')
    .map((donor) => ({
      title: String(donor.title || '').slice(0, 300),
      canonicalUrl: String(donor.canonicalUrl || '').slice(0, 2048),
      relevanceScore: clamp(donor.relevanceScore),
      reasonCodes: unique(donor.reasonCodes).slice(0, 10),
      anchorDirection: String(donor.anchorDirection || '').slice(0, 300),
    }))
    .filter((donor) => donor.canonicalUrl && donor.relevanceScore >= 0.35);
  const inboundCount = finite(internalLinks.inboundCount);
  const cohortP25 = finite(internalLinks.cohortP25, finite(internalLinks.familyP25, 1));
  const peerCount = Math.max(0, finite(internalLinks.peerCount));
  const impressions = finite(current.impressions);
  const linkDeficit = Math.max(0, cohortP25 - inboundCount);
  const evidence = {
    position,
    impressions,
    inboundCount,
    cohortP25,
    peerCount,
    linkDeficit,
    donorPageCount: donors.length,
    qualifiedDonors: donors.slice(0, 10),
  };
  if (impressions < MIN_INTERNAL_LINK_IMPRESSIONS) {
    return detectorAssessment('internal_link', 'not_evaluable', {
      reasonCodes: ['insufficient_impressions'], evidence,
    });
  }
  if (position < 8 || position > 20) {
    return detectorAssessment('internal_link', 'clear', {
      reasonCodes: ['outside_internal_link_opportunity_range'], confidence: 0.75, evidence,
    });
  }
  if (peerCount < 10) {
    return detectorAssessment('internal_link', 'not_evaluable', {
      reasonCodes: ['internal_link_cohort_insufficient'], confidence: 0.2, evidence,
    });
  }
  if (linkDeficit < 2) {
    return detectorAssessment('internal_link', 'clear', {
      reasonCodes: ['internal_link_gap_below_floor', 'no_internal_link_gap'], confidence: 0.7, evidence,
    });
  }
  if (donors.length < 2) {
    return detectorAssessment('internal_link', 'not_evaluable', {
      reasonCodes: ['internal_link_donors_insufficient'], confidence: 0.25, evidence,
    });
  }
  const patternConfidence = clamp(
    0.55 + Math.min(0.15, peerCount / 100) + Math.min(0.12, linkDeficit * 0.03)
      + Math.min(0.08, donors.length * 0.02)
  );
  return detectorAssessment('internal_link', 'watch', {
    reasonCodes: ['internal_link_structural_review', 'supported_internal_link_gap'],
    confidence: patternConfidence,
    patternConfidence,
    causeConfidence: 0.3,
    disposition: 'structural_review',
    decisionGates: ['ranking_effect_not_estimated'],
    nextReview: { mode: 'event', event: 'structural_review', rationale: 'review_qualified_donors' },
    evidence,
  });
}

function assessTechnicalIndexing(context = {}) {
  const { page = {}, current = {}, technical = {} } = context;
  const ageDays = finite(technical.pageAgeDays);
  const noVisibility = finite(current.impressions) === 0 && ageDays >= 45;
  const canonicalChanged = Boolean(technical.canonicalChanged);
  const inspectionIssue = Boolean(technical.inspectionIssue);
  const manifestRobotsBlocked = Boolean(technical.manifestRobotsBlocked);
  const canonicalMissing = Boolean(technical.canonicalMissing);
  const evidence = {
    ageDays,
    noVisibility,
    canonicalChanged,
    inspectionIssue,
    manifestRobotsBlocked,
    canonicalMissing,
    inspectionAvailable: technical.inspectionAvailable === true,
  };
  if (!page.indexable) {
    return detectorAssessment('technical_indexing', 'clear', { reasonCodes: ['page_not_intended_for_indexing'], confidence: 0.8, evidence });
  }
  if (
    technical.inspectionAvailable === false
    && !canonicalChanged
    && !inspectionIssue
    && !manifestRobotsBlocked
    && !canonicalMissing
  ) {
    return detectorAssessment('technical_indexing', 'watch', {
      reasonCodes: ['technical_state_unverified'],
      confidence: 0.35,
      patternConfidence: 0.35,
      causeConfidence: 0,
      disposition: 'investigate',
      decisionGates: ['url_inspection_required'],
      nextReview: { mode: 'event', event: 'url_inspection', rationale: 'verify_google_index_state' },
      evidence,
    });
  }
  if (!noVisibility && !canonicalChanged && !inspectionIssue && !manifestRobotsBlocked && !canonicalMissing) {
    return detectorAssessment('technical_indexing', 'clear', { reasonCodes: ['no_technical_indexing_anomaly'], confidence: 0.8, evidence });
  }
  const confidence = inspectionIssue || manifestRobotsBlocked || canonicalMissing
    ? 0.9
    : canonicalChanged ? 0.78 : 0.6;
  const successCriteria = canonicalChanged || inspectionIssue || manifestRobotsBlocked || canonicalMissing
    ? {
      metric: 'urlInspection',
      requireCanonicalMatch: canonicalChanged || canonicalMissing,
      requireIndexPass: inspectionIssue,
      requireRobotsAllowed: inspectionIssue || manifestRobotsBlocked,
      observationWindowDays: 28,
    }
    : { metric: 'impressions', minimum: 1, observationWindowDays: 28 };
  const action = baseAction(page, 'technical_indexing', {
    confidence,
    priorityScore: confidence * (noVisibility ? 10 : 20),
    summary: 'An indexable URL shows a technical visibility or canonical anomaly.',
    hypothesis: 'Index selection, canonicalization, or crawl state may be blocking the page from earning impressions.',
    evidence: {
      summary: noVisibility ? `No impressions after ${Math.round(ageDays)} days.` : 'A canonical or inspection signal changed.',
      windowDays: context.windowDays || 28,
      signals: [
        noVisibility ? 'zero impressions after 45 days' : null,
        canonicalChanged ? 'canonical changed' : null,
        canonicalMissing ? 'rendered canonical missing' : null,
        manifestRobotsBlocked ? 'rendered robots directive conflicts with indexability' : null,
        inspectionIssue ? 'URL Inspection issue' : null,
      ].filter(Boolean),
    },
    recommendation: {
      title: 'Inspect index and canonical state',
      rationale: 'Resolve technical eligibility before making content changes.',
      checklist: ['Run URL Inspection for the Google-indexed version', 'Compare declared and selected canonical', 'Check robots and noindex', 'Do not change canonical or noindex automatically'],
    },
    successCriteria,
    fingerprintParts: [
      noVisibility ? 'no-visibility' : '',
      canonicalChanged ? 'canonical' : '',
      canonicalMissing ? 'canonical-missing' : '',
      manifestRobotsBlocked ? 'robots' : '',
      inspectionIssue ? 'inspection' : '',
    ],
  });
  return detectorAssessment('technical_indexing', 'actionable', {
    reasonCodes: ['technical_indexing_anomaly'], confidence, evidence, action,
  });
}

function assessVisibilityInterruption(context = {}) {
  const result = context.visibility?.assessment || assessVisibilityPattern(context.visibility || {});
  return detectorAssessment('visibility_interruption', result.state || 'not_evaluable', {
    reasonCodes: result.reasonCodes,
    confidence: result.patternConfidence,
    patternConfidence: result.patternConfidence,
    causeConfidence: result.causeConfidence,
    disposition: result.disposition,
    nextReview: result.nextReview,
    decisionGates: result.requiresInspection
      ? ['url_inspection_required']
      : result.decisionGate ? [result.decisionGate] : [],
    evidence: {
      ...(result.evidence || {}),
      requiresInspection: result.requiresInspection === true,
    },
  });
}

function applyCooldown(assessments, cooldown = {}) {
  return assessments.map((assessment) => {
    const detectorCooldown = cooldown?.[assessment.detector] || cooldown;
    const status = String(detectorCooldown?.state || detectorCooldown?.status || 'eligible');
    if (assessment.detector === 'technical_indexing' && assessment.state === 'clear' && status !== 'eligible') {
      return detectorAssessment(assessment.detector, 'watch', {
        reasonCodes: ['technical_clear_awaiting_post_deploy_crawl', ...assessment.reasonCodes],
        confidence: assessment.confidence,
        patternConfidence: assessment.patternConfidence,
        causeConfidence: assessment.causeConfidence,
        disposition: 'investigate',
        nextReview: detectorCooldown?.nextReviewDate
          ? { mode: 'date', at: detectorCooldown.nextReviewDate, rationale: 'post_change_cooldown' }
          : { mode: 'event', event: 'post_deploy_crawl', rationale: 'await_post_change_crawl' },
        evidence: { ...assessment.evidence, cooldown: detectorCooldown },
      });
    }
    const cooldownScoped = PERFORMANCE_DETECTORS.has(assessment.detector)
      || assessment.detector === 'internal_link';
    if (!cooldownScoped || !['watch', 'actionable'].includes(assessment.state)) return assessment;
    if (status === 'eligible') return assessment;
    const cooldownReason = String(detectorCooldown?.reason || (
      status === 'observing' || status === 'directional' ? 'observing_change' : status
    ));
    return detectorAssessment(assessment.detector, 'watch', {
      reasonCodes: [cooldownReason, 'performance_action_suppressed_by_cooldown', ...assessment.reasonCodes],
      confidence: assessment.confidence,
      patternConfidence: assessment.patternConfidence,
      causeConfidence: 0,
      disposition: status === 'awaiting_recrawl' ? 'investigate' : 'monitor',
      nextReview: detectorCooldown?.nextReviewDate
        ? { mode: 'date', at: detectorCooldown.nextReviewDate, rationale: 'post_change_cooldown' }
        : { mode: 'event', event: 'post_deploy_crawl', rationale: cooldownReason },
      decisionGates: [cooldownReason, ...(assessment.decisionGates || [])],
      evidence: {
        ...assessment.evidence,
        cooldown: detectorCooldown,
        suppressedActionType: assessment.action?.type || assessment.detector,
      },
    });
  });
}

function applyCrossDetectorVeto(assessments, context = {}) {
  const visibility = assessments.find((assessment) => (
    assessment.detector === 'visibility_interruption'
    && assessment.reasonCodes.includes('visibility_interruption')
  ));
  const temporalBlocked = context.temporalGate?.eligible === false;
  if (!visibility && !temporalBlocked) return assessments;
  return assessments.map((assessment) => {
    const scoped = PERFORMANCE_DETECTORS.has(assessment.detector)
      || assessment.detector === 'internal_link';
    if (!scoped || assessment.state === 'clear' || assessment.state === 'not_evaluable') return assessment;
    const reasonCode = visibility
      ? 'visibility_interruption_requires_diagnosis'
      : String(context.temporalGate?.reason || 'performance_window_precedes_production');
    const temporalStructural = temporalBlocked && !visibility && assessment.detector === 'internal_link';
    return detectorAssessment(assessment.detector, 'watch', {
      reasonCodes: [reasonCode, ...assessment.reasonCodes],
      confidence: assessment.patternConfidence,
      patternConfidence: assessment.patternConfidence,
      causeConfidence: 0,
      disposition: temporalStructural ? 'structural_review' : 'investigate',
      decisionGates: [reasonCode, ...(assessment.decisionGates || [])],
      nextReview: visibility
        ? visibility.nextReview
        : temporalStructural
          ? (assessment.nextReview || { mode: 'event', event: 'structural_review', rationale: 'review_qualified_donors' })
          : (context.temporalGate?.nextReview
            || { mode: 'event', event: 'post_deploy_crawl', rationale: reasonCode }),
      evidence: { ...assessment.evidence, vetoedBy: reasonCode },
    });
  });
}

function evaluatePageDetectors(context = {}) {
  if (!context?.page?.pageKey || !context?.page?.canonicalUrl) return [];
  const assessments = [
    assessCtrSnippet(context),
    assessIntentMismatch(context),
    assessContentDecay(context),
    assessCannibalization(context),
    assessInternalLinkGap(context),
    assessTechnicalIndexing(context),
    ...(context.visibility ? [assessVisibilityInterruption(context)] : []),
  ];
  const tracking = context.page.changeTracking || {};
  if (
    !tracking.fingerprintVersion
    || String(tracking.fingerprintVersion).startsWith('legacy-derived')
    || !tracking.fingerprintEvidence?.statuses
  ) {
    return applyCrossDetectorVeto(assessments, context);
  }
  const statuses = tracking.fingerprintEvidence?.statuses || {};
  const requirements = {
    ctr_snippet: ['title', 'description'],
    intent_mismatch: ['mainContent', 'headingOutline', 'intent'],
    content_decay: ['mainContent', 'headingOutline'],
    cannibalization: ['intent'],
    internal_link: ['internalLinks'],
    technical_indexing: ['canonical', 'robots', 'indexability', 'structuredData'],
    visibility_interruption: [],
  };
  const fingerprintChecked = assessments.map((assessment) => {
    const unavailable = (requirements[assessment.detector] || [])
      .filter((component) => ['partial', 'unavailable'].includes(statuses[component]));
    if (!unavailable.length) return assessment;
    if (assessment.detector === 'technical_indexing' && assessment.state === 'actionable') return assessment;
    return detectorAssessment(assessment.detector, 'not_evaluable', {
      reasonCodes: ['fingerprint_evidence_unavailable'],
      confidence: 0,
      evidence: {
        unavailableComponents: unavailable,
        fingerprintSource: tracking.fingerprintEvidence?.source || 'unknown',
      },
    });
  });
  return applyCrossDetectorVeto(fingerprintChecked, context);
}

function evidenceLevelFor(state, assessments, cooldown) {
  if (state === 'not_evaluable') return 'insufficient';
  const cooldownValues = cooldown && typeof cooldown === 'object' && !cooldown.state && !cooldown.status
    ? Object.values(cooldown)
    : [cooldown];
  if (cooldownValues.some((value) => {
    const status = value?.state || value?.status;
    return status && status !== 'eligible';
  })) return 'directional';
  const confidence = Math.max(0, ...assessments.map((assessment) => assessment.confidence));
  if (state === 'actionable' && confidence >= 0.8) return 'strong';
  if (state === 'actionable' || confidence >= 0.65) return 'moderate';
  return 'directional';
}

function primaryCooldownStatus(cooldown = {}, detector = null) {
  const direct = detector ? cooldown?.[detector] : null;
  if (direct) return String(direct.state || direct.status || 'eligible');
  if (cooldown?.state || cooldown?.status) return String(cooldown.state || cooldown.status);
  const priority = { eligible: 0, directional: 1, observing: 2, awaiting_recrawl: 3 };
  return Object.values(cooldown || {}).reduce((selected, value) => {
    const status = String(value?.state || value?.status || 'eligible');
    return Number(priority[status] || 0) > Number(priority[selected] || 0) ? status : selected;
  }, 'eligible');
}

function evaluatePageAssessment(context = {}) {
  const pageKey = context?.page?.pageKey || null;
  if (!pageKey || !context?.page?.canonicalUrl) {
    return {
      ruleVersion: RULE_VERSION,
      pageKey,
      state: 'not_evaluable',
      verdict: 'page_identity_missing',
      evidenceLevel: 'insufficient',
      reasonCodes: ['page_identity_missing'],
      confidence: 0,
      patternConfidence: 0,
      causeConfidence: 0,
      disposition: 'insufficient_evidence',
      decisionGates: ['page_identity_missing'],
      nextReview: null,
      findings: [],
      counterEvidence: [],
      action: null,
    };
  }
  const assessments = applyCooldown(evaluatePageDetectors(context), context.cooldown);
  const actionable = assessments
    .filter((assessment) => assessment.state === 'actionable' && assessment.action)
    .sort((left, right) => {
      const technicalDifference = Number(right.detector === 'technical_indexing') - Number(left.detector === 'technical_indexing');
      return technicalDifference || right.action.priorityScore - left.action.priorityScore;
    });
  const watch = assessments.filter((assessment) => assessment.state === 'watch');
  const notEvaluable = assessments.filter((assessment) => assessment.state === 'not_evaluable');
  const selected = actionable[0] || null;
  let state = 'clear';
  if (selected) state = 'actionable';
  else if (watch.length) state = 'watch';
  else if (notEvaluable.length) state = 'not_evaluable';
  const primary = selected || watch[0] || notEvaluable[0] || assessments[0];
  const cooldownStatus = primaryCooldownStatus(context.cooldown, selected?.detector || primary?.detector);
  const cooldownVerdict = cooldownStatus === 'observing' || cooldownStatus === 'directional'
    ? 'observing_change'
    : cooldownStatus;
  const verdict = cooldownStatus !== 'eligible'
    ? cooldownVerdict
    : selected?.action?.type || primary?.reasonCodes?.[0] || 'clear';
  const reasonCodes = unique([
    cooldownStatus !== 'eligible' ? cooldownVerdict : null,
    ...(primary?.reasonCodes || []),
  ]);
  return {
    ruleVersion: RULE_VERSION,
    pageKey,
    state,
    verdict,
    evidenceLevel: evidenceLevelFor(state, assessments, context.cooldown),
    reasonCodes,
    confidence: primary?.confidence || 0,
    patternConfidence: primary?.patternConfidence || 0,
    causeConfidence: primary?.causeConfidence || 0,
    disposition: primary?.disposition || (state === 'actionable' ? 'change_ready' : state === 'clear' ? 'no_change' : 'insufficient_evidence'),
    decisionGates: primary?.decisionGates || [],
    nextReview: primary?.nextReview || null,
    findings: assessments.filter((assessment) => assessment.state !== 'clear'),
    counterEvidence: assessments.filter((assessment) => assessment.state === 'clear'),
    action: selected?.action || null,
  };
}

function evaluatePageAssessments(context = {}) {
  return evaluatePageAssessment(context);
}

function detectCtrSnippet(context) {
  return assessCtrSnippet(context).action;
}

function detectIntentMismatch(context) {
  return assessIntentMismatch(context).action;
}

function detectContentDecay(context) {
  return assessContentDecay(context).action;
}

function detectCannibalization(context) {
  return assessCannibalization(context).action;
}

function detectInternalLinkGap(context) {
  return assessInternalLinkGap(context).action;
}

function detectTechnicalIndexing(context) {
  return assessTechnicalIndexing(context).action;
}

function evaluatePage(context) {
  const assessment = evaluatePageAssessment(context);
  return assessment.action ? [assessment.action] : [];
}

module.exports = {
  BASELINE_QUALITY,
  DETECTOR_STATES,
  DISPOSITIONS,
  MAX_ALIGNED_TOPIC_SCORE,
  MIN_DECAY_IMPRESSIONS,
  MIN_DECAY_LOST_CLICKS,
  MIN_DECAY_PRIOR_CLICKS,
  MIN_DOMINANT_CLUSTER_SHARE,
  MIN_FULL_PAGE_CLUSTER_SHARE,
  MIN_PAGE_IMPRESSIONS,
  MIN_INTERNAL_LINK_IMPRESSIONS,
  MIN_QUERY_COVERAGE,
  MIN_QUERY_IMPRESSIONS,
  MIN_SEMANTIC_COVERAGE,
  RULE_VERSION,
  applyCooldown,
  assessCannibalization,
  assessContentDecay,
  assessCtrBaselineQuality,
  assessCtrSnippet,
  assessIntentMismatch,
  assessInternalLinkGap,
  assessTechnicalIndexing,
  assessVisibilityInterruption,
  detectCannibalization,
  detectContentDecay,
  detectCtrSnippet,
  detectIntentMismatch,
  detectInternalLinkGap,
  detectTechnicalIndexing,
  evaluatePage,
  evaluatePageAssessment,
  evaluatePageAssessments,
  evaluatePageDetectors,
  isKnownReasonCode,
  ratio,
  reasonSummaryForCode,
  tokenOverlap,
  weeklyPersistence,
  wilsonInterval,
};
