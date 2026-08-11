'use strict';

const { sha256 } = require('./keys');

const QUERY_OPPORTUNITY_VERSION = 'query-opportunity-v1';
const MIN_OPPORTUNITY_IMPRESSIONS = 300;
const MIN_QUERY_COVERAGE = 0.6;
const MIN_SEMANTIC_COVERAGE = 0.9;
const MIN_DEVICE_COVERAGE = 0.6;
const MIN_MODELED_CLICKS = 3;
const REQUIRED_STABLE_WEEKS = 3;
const WILSON_90_Z = 1.6448536269514722;

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
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

function safeMetric(metric = {}) {
  const impressions = Math.max(0, finite(metric.impressions));
  const clicks = Math.max(0, finite(metric.clicks));
  return {
    clicks,
    impressions,
    ctr: ratio(clicks, impressions),
    position: Math.max(0, finite(metric.position)),
  };
}

function safeCoverage(value, fallback = null) {
  const numeric = nullableNumber(value);
  if (numeric === null) return fallback;
  return numeric < 0 || numeric > 1 ? null : numeric;
}

function stablePositionWeeks(cluster = {}) {
  const current = safeMetric(cluster.current);
  const rows = Array.isArray(cluster.weekly)
    ? cluster.weekly
    : Array.isArray(cluster.current?.weekly) ? cluster.current.weekly : [];
  const usable = (Array.isArray(rows) ? rows : []).slice(0, 4)
    .map(safeMetric)
    .filter((metric) => metric.impressions > 0 && metric.position > 0);
  const stableWeeks = usable.filter((metric) => Math.abs(metric.position - current.position) <= 1).length;
  return {
    stableWeeks,
    requiredWeeks: REQUIRED_STABLE_WEEKS,
    totalWeeks: usable.length,
    stable: usable.length >= 4 && stableWeeks >= REQUIRED_STABLE_WEEKS,
  };
}

function notEstimatedImpact() {
  return {
    metric: 'clicks',
    low: null,
    point: null,
    high: null,
    windowDays: 28,
    quality: 'not_estimated',
  };
}

function modeledImpact(metric, baseline = {}) {
  const currentWilson = wilsonInterval(metric.clicks, metric.impressions);
  const baselineWilson = {
    low: Math.max(0, finite(baseline.lower90)),
    high: Math.max(0, finite(baseline.upper90)),
  };
  const point = Math.max(0, metric.impressions * finite(baseline.ctr) - metric.clicks);
  return {
    metric: 'clicks',
    low: Math.max(0, metric.impressions * baselineWilson.low - metric.clicks),
    point,
    high: Math.max(point, metric.impressions * baselineWilson.high - metric.clicks),
    windowDays: 28,
    quality: 'modeled',
    currentWilson90: currentWilson,
    baselineWilson90: baselineWilson,
  };
}

function opportunityKey(clusterKey, classification) {
  return sha256([QUERY_OPPORTUNITY_VERSION, clusterKey || 'page', classification].join('|'));
}

function safeLabel(cluster = {}) {
  const tech = String(cluster.tech || '').slice(0, 80);
  const facet = String(cluster.dominantFacet || 'other').replace(/_/g, ' ').slice(0, 80);
  return [tech, facet].filter(Boolean).join(' · ') || 'semantic cluster';
}

function baseOpportunity({
  cluster = {},
  classification,
  state = 'watch',
  disposition = 'investigate',
  patternConfidence = 0,
  causeConfidence = 0,
  current,
  previous,
  coverage,
  persistence,
  recommendedSurface,
  blockers = [],
  reviewReady = false,
  expectedImpact = null,
  nextReview,
} = {}) {
  const clusterKey = String(cluster.clusterKey || '');
  return {
    key: opportunityKey(clusterKey, classification),
    classification,
    state,
    disposition,
    clusterKey: clusterKey || null,
    safeLabel: safeLabel(cluster),
    patternConfidence: clamp(patternConfidence),
    causeConfidence: clamp(causeConfidence),
    current: safeMetric(current),
    previous: safeMetric(previous),
    coverage,
    persistence,
    recommendedSurface,
    blockers: Array.from(new Set(blockers.filter(Boolean))).slice(0, 12),
    reviewReady: reviewReady === true,
    expectedImpact: expectedImpact || notEstimatedImpact(),
    nextReview: nextReview || {
      mode: 'event',
      event: 'next_finalized_sync',
      rationale: 'refresh_query_evidence',
    },
  };
}

function visibilityOpportunity(visibility, coverage) {
  if (!visibility || visibility.interrupted !== true) return null;
  const classification = 'visibility_interruption';
  const requiresInspection = visibility.requiresInspection === true;
  const disposition = ['monitor', 'investigate'].includes(String(visibility.disposition))
    ? String(visibility.disposition)
    : 'investigate';
  const decisionGate = String(visibility.decisionGate || '').trim();
  return {
    key: opportunityKey('page', classification),
    classification,
    state: 'watch',
    disposition,
    clusterKey: null,
    safeLabel: 'page visibility',
    patternConfidence: clamp(visibility.patternConfidence),
    causeConfidence: clamp(visibility.causeConfidence),
    current: safeMetric(visibility.current),
    previous: safeMetric(visibility.previous),
    coverage,
    persistence: {
      stableWeeks: 0,
      requiredWeeks: 0,
      zeroImpressionStreak: Math.max(0, finite(visibility.zeroImpressionStreak)),
    },
    recommendedSurface: requiresInspection ? 'url_inspection' : 'none',
    blockers: requiresInspection
      ? ['url_inspection_required']
      : decisionGate ? [decisionGate] : [],
    reviewReady: false,
    expectedImpact: notEstimatedImpact(),
    nextReview: visibility.nextReview || {
      mode: 'event',
      event: 'url_inspection',
      rationale: 'confirm_index_and_crawl_state',
    },
  };
}

/**
 * Produces response/persistence-safe cluster opportunities. It never includes
 * query text, member query keys, or competitor-derived content.
 */
function buildQueryOpportunities({
  semanticClusters = [],
  queryCoverage = null,
  semanticCoverage = null,
  deviceCoverage = null,
  ctrBaseline = null,
  pageWeekly = null,
  visibility = null,
  temporalGate = null,
  limit = 10,
} = {}) {
  const clusters = Array.isArray(semanticClusters?.clusters)
    ? semanticClusters.clusters
    : Array.isArray(semanticClusters) ? semanticClusters : [];
  const dominantClusterKey = String(semanticClusters?.dominantClusterKey || '');
  const coverage = {
    query: safeCoverage(queryCoverage),
    semantic: safeCoverage(semanticCoverage),
    device: safeCoverage(deviceCoverage),
  };
  const opportunities = [];
  const interruption = visibilityOpportunity(visibility, coverage);
  if (interruption) opportunities.push(interruption);

  for (const cluster of clusters) {
    const current = safeMetric(cluster.current);
    const previous = safeMetric(cluster.previous);
    if (current.impressions <= 0) continue;
    const persistence = stablePositionWeeks(cluster);
    const blockers = [];
    if (coverage.query === null || coverage.query < MIN_QUERY_COVERAGE) blockers.push('query_coverage_below_threshold');
    if (coverage.semantic === null || coverage.semantic < MIN_SEMANTIC_COVERAGE) blockers.push('semantic_coverage_below_threshold');
    if (coverage.device === null) blockers.push('device_evidence_unavailable');
    else if (coverage.device < MIN_DEVICE_COVERAGE) blockers.push('device_coverage_below_threshold');
    if (current.impressions < MIN_OPPORTUNITY_IMPRESSIONS) blockers.push('insufficient_impressions');

    const sourcePreference = cluster.dominantFacet === 'official_reference'
      || finite(cluster.sourcePreferenceShare) >= 0.35
      || (current.position > 0 && current.position <= 3);
    if (sourcePreference) {
      opportunities.push(baseOpportunity({
        cluster,
        classification: 'source_preference',
        state: 'watch',
        disposition: 'monitor',
        patternConfidence: Math.min(0.9, 0.55 + finite(cluster.sourcePreferenceShare) * 0.3),
        causeConfidence: 0.3,
        current,
        previous,
        coverage,
        persistence,
        recommendedSurface: 'serp_review',
        blockers: ['source_preference', ...blockers],
        reviewReady: false,
        expectedImpact: notEstimatedImpact(),
        nextReview: {
          mode: 'event',
          event: 'serp_review',
          rationale: 'verify_official_or_reference_preference',
        },
      }));
      continue;
    }

    const topicAlignment = finite(cluster.topicAlignment);
    if (topicAlignment < 0.25) {
      const intentBlockers = [...blockers];
      if (!persistence.stable) intentBlockers.push('position_not_stable');
      const ready = intentBlockers.length === 0;
      opportunities.push(baseOpportunity({
        cluster,
        classification: ready ? 'intent_gap' : 'not_evaluable',
        state: ready ? 'watch' : 'not_evaluable',
        disposition: ready ? 'investigate' : 'insufficient_evidence',
        patternConfidence: ready ? Math.min(0.9, 0.6 + (0.25 - topicAlignment)) : 0.25,
        causeConfidence: ready ? 0.35 : 0.1,
        current,
        previous,
        coverage,
        persistence,
        recommendedSurface: ready ? (cluster.clusterKey === dominantClusterKey ? 'h1_body' : 'h2_body') : 'none',
        blockers: ready ? ['serp_review_required'] : intentBlockers,
        reviewReady: ready,
        expectedImpact: notEstimatedImpact(),
        nextReview: ready
          ? { mode: 'event', event: 'serp_review', rationale: 'confirm_search_intent' }
          : { mode: 'event', event: 'next_finalized_sync', rationale: intentBlockers[0] || 'refresh_query_evidence' },
      }));
      continue;
    }

    if (current.position >= 4 && current.position <= 8) {
      const baselineQuality = String(ctrBaseline?.quality || 'insufficient');
      if (!['medium', 'high'].includes(baselineQuality)) blockers.push('baseline_quality_insufficient');
      if (!persistence.stable) blockers.push('position_not_stable');
      const impact = modeledImpact(current, ctrBaseline || {});
      const intervalsSeparate = impact.currentWilson90.high < impact.baselineWilson90.low;
      if (!intervalsSeparate) blockers.push('statistically_uncertain');
      if (finite(impact.point) < MIN_MODELED_CLICKS) blockers.push('no_material_ctr_gap');
      const reviewReady = blockers.length === 0;
      opportunities.push(baseOpportunity({
        cluster,
        classification: reviewReady ? 'snippet_gap' : 'not_evaluable',
        state: reviewReady ? 'watch' : 'not_evaluable',
        disposition: reviewReady ? 'investigate' : 'insufficient_evidence',
        patternConfidence: reviewReady ? 0.82 : 0.25,
        causeConfidence: reviewReady ? 0.45 : 0.1,
        current,
        previous,
        coverage,
        persistence,
        recommendedSurface: reviewReady ? 'title_description' : 'none',
        blockers: reviewReady ? ['serp_review_required'] : blockers,
        reviewReady,
        expectedImpact: reviewReady ? impact : notEstimatedImpact(),
        nextReview: reviewReady
          ? { mode: 'event', event: 'serp_review', rationale: 'validate_snippet_hypothesis' }
          : { mode: 'event', event: 'next_finalized_sync', rationale: blockers[0] || 'refresh_query_evidence' },
      }));
      continue;
    }

    if (current.position > 8 && current.position <= 20) {
      if (!persistence.stable) blockers.push('position_not_stable');
      const ready = blockers.length === 0;
      opportunities.push(baseOpportunity({
        cluster,
        classification: ready ? 'ranking_gap' : 'not_evaluable',
        state: ready ? 'watch' : 'not_evaluable',
        disposition: ready ? 'investigate' : 'insufficient_evidence',
        patternConfidence: ready ? 0.7 : 0.25,
        causeConfidence: ready ? 0.3 : 0.1,
        current,
        previous,
        coverage,
        persistence,
        recommendedSurface: ready
          ? (cluster.clusterKey === dominantClusterKey ? 'h1_body' : 'h2_body')
          : 'none',
        blockers: ready ? ['serp_review_required'] : blockers,
        reviewReady: ready,
        expectedImpact: notEstimatedImpact(),
        nextReview: ready
          ? { mode: 'event', event: 'serp_review', rationale: 'validate_ranking_or_content_hypothesis' }
          : { mode: 'event', event: 'next_finalized_sync', rationale: blockers[0] || 'refresh_query_evidence' },
      }));
    }
  }

  const temporallySafe = temporalGate?.eligible !== false;
  const temporalReason = String(temporalGate?.reason || 'performance_window_precedes_production');
  const gatedOpportunities = temporallySafe ? opportunities : opportunities.map((opportunity) => {
    if (opportunity.classification === 'visibility_interruption') return opportunity;
    return {
      ...opportunity,
      causeConfidence: 0,
      reviewReady: false,
      blockers: Array.from(new Set([temporalReason, ...(opportunity.blockers || [])])).slice(0, 12),
      nextReview: temporalGate?.nextReview || {
        mode: 'event',
        event: 'post_deploy_crawl',
        rationale: temporalReason,
      },
    };
  });

  return gatedOpportunities
    .sort((left, right) => {
      const visibilityDifference = Number(right.classification === 'visibility_interruption')
        - Number(left.classification === 'visibility_interruption');
      return visibilityDifference
        || Number(right.reviewReady) - Number(left.reviewReady)
        || right.current.impressions - left.current.impressions
        || String(left.key).localeCompare(String(right.key));
    })
    .slice(0, Math.max(1, Math.min(10, Math.floor(finite(limit, 10)))));
}

module.exports = {
  MIN_DEVICE_COVERAGE,
  MIN_MODELED_CLICKS,
  MIN_OPPORTUNITY_IMPRESSIONS,
  MIN_QUERY_COVERAGE,
  MIN_SEMANTIC_COVERAGE,
  QUERY_OPPORTUNITY_VERSION,
  REQUIRED_STABLE_WEEKS,
  buildQueryOpportunities,
};
