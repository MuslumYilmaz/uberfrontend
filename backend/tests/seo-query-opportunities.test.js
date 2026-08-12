'use strict';

const {
  buildQueryOpportunities,
} = require('../services/seo/query-opportunities');

const CLUSTER_A = 'a'.repeat(64);
const CLUSTER_B = 'b'.repeat(64);

function stableWeeks(position, impressions = 250) {
  return Array.from({ length: 4 }, () => ({ clicks: 0, impressions, position }));
}

function cluster(overrides = {}) {
  return {
    clusterKey: CLUSTER_A,
    tech: 'react',
    dominantFacet: 'direct_answer',
    sourcePreferenceShare: 0,
    topicAlignment: 0.8,
    current: { clicks: 0, impressions: 1000, position: 5 },
    previous: { clicks: 3, impressions: 900, position: 5 },
    weekly: stableWeeks(5),
    ...overrides,
  };
}

const baseline = {
  quality: 'medium',
  ctr: 0.02,
  lower90: 0.015,
  upper90: 0.025,
};

describe('query opportunity classifier', () => {
  test('makes a strong zero-click cluster SERP-review-ready without creating an action', () => {
    const [opportunity] = buildQueryOpportunities({
      semanticClusters: { dominantClusterKey: CLUSTER_A, clusters: [cluster()] },
      queryCoverage: 0.9,
      semanticCoverage: 0.95,
      deviceCoverage: 0.8,
      ctrBaseline: baseline,
      temporalGate: { eligible: true },
    });

    expect(opportunity).toEqual(expect.objectContaining({
      classification: 'snippet_gap',
      state: 'watch',
      disposition: 'investigate',
      reviewReady: true,
      recommendedSurface: 'title_description',
      blockers: ['serp_review_required'],
      expectedImpact: expect.objectContaining({ quality: 'modeled', point: 20 }),
      nextReview: expect.objectContaining({ mode: 'event', event: 'serp_review' }),
    }));
    expect(opportunity.persistence).toEqual(expect.objectContaining({
      stableWeeks: 4,
      requiredWeeks: 3,
      totalWeeks: 4,
      stable: true,
    }));
  });

  test('keeps the low-coverage React example non-evaluable', () => {
    const [opportunity] = buildQueryOpportunities({
      semanticClusters: {
        dominantClusterKey: CLUSTER_A,
        clusters: [cluster({
          current: { clicks: 0, impressions: 335, position: 9.5 },
          weekly: stableWeeks(9.5, 84),
        })],
      },
      queryCoverage: 0.086,
      semanticCoverage: 0.95,
      deviceCoverage: 0.086,
      ctrBaseline: baseline,
      temporalGate: { eligible: true },
    });

    expect(opportunity).toEqual(expect.objectContaining({
      classification: 'not_evaluable',
      state: 'not_evaluable',
      disposition: 'insufficient_evidence',
      reviewReady: false,
      expectedImpact: expect.objectContaining({ quality: 'not_estimated', point: null }),
      blockers: expect.arrayContaining([
        'query_coverage_below_threshold',
        'device_coverage_below_threshold',
      ]),
    }));
  });

  test('routes stable dominant and secondary ranking gaps to different content surfaces', () => {
    const opportunities = buildQueryOpportunities({
      semanticClusters: {
        dominantClusterKey: CLUSTER_A,
        clusters: [
          cluster({ current: { clicks: 2, impressions: 500, position: 10 }, weekly: stableWeeks(10, 125) }),
          cluster({
            clusterKey: CLUSTER_B,
            current: { clicks: 1, impressions: 400, position: 12 },
            weekly: stableWeeks(12, 100),
          }),
        ],
      },
      queryCoverage: 0.9,
      semanticCoverage: 0.95,
      deviceCoverage: 0.8,
      ctrBaseline: baseline,
      temporalGate: { eligible: true },
    });

    expect(opportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        clusterKey: CLUSTER_A,
        classification: 'ranking_gap',
        recommendedSurface: 'h1_body',
        reviewReady: true,
      }),
      expect.objectContaining({
        clusterKey: CLUSTER_B,
        classification: 'ranking_gap',
        recommendedSurface: 'h2_body',
        reviewReady: true,
      }),
    ]));
  });

  test('a temporal gate removes causal readiness but preserves the observed pattern', () => {
    const [opportunity] = buildQueryOpportunities({
      semanticClusters: { dominantClusterKey: CLUSTER_A, clusters: [cluster()] },
      queryCoverage: 0.9,
      semanticCoverage: 0.95,
      deviceCoverage: 0.8,
      ctrBaseline: baseline,
      temporalGate: {
        eligible: false,
        reason: 'post_deploy_crawl_required',
        nextReview: {
          mode: 'event',
          event: 'post_deploy_crawl',
          rationale: 'post_deploy_crawl_required',
        },
      },
    });

    expect(opportunity).toEqual(expect.objectContaining({
      classification: 'snippet_gap',
      patternConfidence: 0.82,
      causeConfidence: 0,
      reviewReady: false,
      blockers: expect.arrayContaining(['post_deploy_crawl_required', 'serp_review_required']),
      nextReview: {
        mode: 'event',
        event: 'post_deploy_crawl',
        rationale: 'post_deploy_crawl_required',
      },
    }));
  });

  test('never returns raw query strings or member query keys', () => {
    const result = buildQueryOpportunities({
      semanticClusters: {
        dominantClusterKey: CLUSTER_A,
        clusters: [cluster({
          rawQuery: 'private raw search',
          memberQueryKeys: ['private-member'],
        })],
      },
      queryCoverage: 0.9,
      semanticCoverage: 0.95,
      deviceCoverage: 0.8,
      ctrBaseline: baseline,
      temporalGate: { eligible: true },
    });

    expect(JSON.stringify(result)).not.toContain('private raw search');
    expect(JSON.stringify(result)).not.toContain('private-member');
    expect(result).toHaveLength(1);
  });

  test('replaces the inspection blocker with the typed post-crawl gate after a PASS', () => {
    const [opportunity] = buildQueryOpportunities({
      semanticClusters: [],
      queryCoverage: 0.8,
      semanticCoverage: 0.95,
      deviceCoverage: 0.8,
      temporalGate: { eligible: true },
      visibility: {
        interrupted: true,
        requiresInspection: false,
        disposition: 'monitor',
        patternConfidence: 0.9,
        causeConfidence: 0.1,
        decisionGate: 'post_inspection_14_finalized_days',
        current: { impressions: 179 },
        previous: { impressions: 417 },
        zeroImpressionStreak: 17,
        nextReview: {
          mode: 'event',
          event: '14_finalized_days',
          rationale: 'observe_initial_post_inspection_recovery_window',
        },
      },
    });

    expect(opportunity).toEqual(expect.objectContaining({
      classification: 'visibility_interruption',
      state: 'watch',
      disposition: 'monitor',
      recommendedSurface: 'none',
      blockers: ['post_inspection_14_finalized_days'],
      nextReview: expect.objectContaining({ event: '14_finalized_days' }),
    }));
    expect(opportunity.blockers).not.toContain('url_inspection_required');
  });

  test('keeps a confirmed inspection anomaly on the technical investigation path', () => {
    const [opportunity] = buildQueryOpportunities({
      semanticClusters: [],
      visibility: {
        interrupted: true,
        requiresInspection: false,
        disposition: 'investigate',
        patternConfidence: 0.9,
        causeConfidence: 0.75,
        decisionGate: 'technical_indexing_anomaly',
        current: { impressions: 179 },
        previous: { impressions: 417 },
        nextReview: {
          mode: 'event',
          event: 'post_deploy_crawl',
          rationale: 'resolve_inspection_anomaly_then_confirm_crawl',
        },
      },
    });

    expect(opportunity).toEqual(expect.objectContaining({
      disposition: 'investigate',
      recommendedSurface: 'none',
      blockers: ['technical_indexing_anomaly'],
      nextReview: expect.objectContaining({ event: 'post_deploy_crawl' }),
    }));
    expect(opportunity.blockers).not.toContain('url_inspection_required');
  });
});
