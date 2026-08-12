'use strict';

const {
  baselineAggregate,
  internalLinkEvidenceForPage,
  migrationClearTypes,
  safeAssessmentForPersistence,
  subsetCoverage,
  temporalGateForPage,
} = require('../services/seo/analysis');
const {
  evaluatePageDetectors,
} = require('../services/seo/rule-engine');

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

function trackedPage(overrides = {}) {
  return {
    changeTracking: {
      currentVersionKey: HASH_A,
      production: {
        effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
        precision: 'exact',
      },
      lastGoogleCrawlAt: new Date('2026-01-02T00:00:00.000Z'),
      ...overrides.changeTracking,
    },
    ...overrides,
  };
}

describe('balanced-v2.2 analysis safety contracts', () => {
  test('counts each CTR peer once and keeps the zero-click denominator honest', () => {
    expect(baselineAggregate([
      { current: { clicks: 0, impressions: 100 } },
      { current: { clicks: 10, impressions: 200 } },
    ])).toEqual(expect.objectContaining({
      peerPageCount: 2,
      peerClicks: 10,
      peerImpressions: 300,
      zeroClickPeers: 1,
      zeroClickPeerShare: 0.5,
    }));
  });

  test('limits migration cleanup to legacy proposed internal-link and CTR classes', () => {
    const cooldown = {
      internal_link: { state: 'eligible' },
      ctr_snippet: { state: 'eligible' },
      content_decay: { state: 'eligible' },
      intent_mismatch: { state: 'eligible' },
      technical_indexing: { state: 'eligible' },
    };
    const clearTypes = migrationClearTypes([
      { detector: 'internal_link', state: 'watch', disposition: 'structural_review' },
      { detector: 'ctr_snippet', state: 'watch', disposition: 'investigate' },
      { detector: 'content_decay', state: 'clear' },
      { detector: 'intent_mismatch', state: 'clear' },
      { detector: 'technical_indexing', state: 'clear' },
    ], cooldown, true);

    expect([...clearTypes].sort()).toEqual(['ctr_snippet', 'internal_link']);
  });

  test('keeps zero authoritative totals unavailable and rejects over-counted subsets', () => {
    expect(subsetCoverage(0, 0)).toBeNull();
    expect(subsetCoverage(1, 0)).toBeNull();
    expect(subsetCoverage(101, 100)).toBeNull();
    expect(subsetCoverage(25, 100)).toBe(0.25);
  });

  test('requires production timing, a post-production crawl, and a full post-crawl window', () => {
    expect(temporalGateForPage({}, '2026-03-01', '2026-02-02')).toEqual(expect.objectContaining({
      eligible: false,
      reason: 'production_timing_unverified',
      nextReview: expect.objectContaining({ mode: 'event', event: 'post_deploy_crawl' }),
    }));

    const noCrawl = trackedPage({
      changeTracking: {
        currentVersionKey: HASH_A,
        production: { effectiveAt: new Date('2026-01-01T00:00:00.000Z'), precision: 'upper_bound' },
        lastGoogleCrawlAt: null,
      },
    });
    expect(temporalGateForPage(noCrawl, '2026-03-01', '2026-02-02')).toEqual(expect.objectContaining({
      eligible: false,
      reason: 'post_deploy_crawl_required',
    }));

    const crawled = trackedPage();
    expect(temporalGateForPage(crawled, '2026-01-20', '2025-12-24')).toEqual(expect.objectContaining({
      eligible: false,
      reason: 'performance_window_precedes_production',
      nextReview: expect.objectContaining({ mode: 'event', event: '28_finalized_days' }),
    }));
    expect(temporalGateForPage(crawled, '2026-03-01', '2026-02-02')).toEqual(expect.objectContaining({
      eligible: true,
    }));
  });

  test('preserves a structural graph finding under a temporal veto without claiming causality', () => {
    const detectors = evaluatePageDetectors({
      page: {
        pageKey: HASH_A,
        canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
        indexable: true,
      },
      current: { clicks: 2, impressions: 1000, position: 10 },
      internalLinks: {
        inboundCount: 0,
        cohortP25: 3,
        peerCount: 12,
        qualifiedDonors: [
          { title: 'Donor one', canonicalUrl: 'https://frontendatlas.com/react/one', relevanceScore: 0.7 },
          { title: 'Donor two', canonicalUrl: 'https://frontendatlas.com/react/two', relevanceScore: 0.6 },
        ],
      },
      temporalGate: {
        eligible: false,
        reason: 'post_deploy_crawl_required',
        nextReview: { mode: 'event', event: 'post_deploy_crawl', rationale: 'post_deploy_crawl_required' },
      },
      technical: { inspectionAvailable: false },
    });
    const internal = detectors.find((detector) => detector.detector === 'internal_link');

    expect(internal).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'structural_review',
      causeConfidence: 0,
      action: null,
      reasonCodes: expect.arrayContaining(['post_deploy_crawl_required', 'internal_link_structural_review']),
      nextReview: expect.objectContaining({ mode: 'event', event: 'structural_review' }),
    }));
  });

  test('requires semantic overlap itself and excludes donor pages in cooldown or interruption', () => {
    const target = trackedPage({
      pageKey: HASH_A,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/react-hooks-rendering',
      title: 'React hooks rendering behavior',
      h1: 'React hooks rendering behavior',
      family: 'question',
      tech: 'react',
      indexable: true,
      internalLinks: {
        inboundCount: 0,
        sourcePageKeys: [],
        donorPageKeys: [HASH_B, 'c'.repeat(64), 'd'.repeat(64), 'e'.repeat(64)],
      },
    });
    const noOverlap = trackedPage({
      pageKey: HASH_B,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/state-machines',
      title: 'Finite state machine architecture',
      h1: 'Finite state machine architecture',
      family: 'question',
      tech: 'react',
      indexable: true,
      internalLinks: { inboundCount: 4 },
    });
    const qualified = trackedPage({
      pageKey: 'c'.repeat(64),
      canonicalUrl: 'https://frontendatlas.com/react/trivia/hooks-rendering-guide',
      title: 'React hooks rendering guide',
      h1: 'React hooks rendering guide',
      family: 'question',
      tech: 'react',
      indexable: true,
      internalLinks: { inboundCount: 4 },
    });
    const interrupted = trackedPage({
      pageKey: 'd'.repeat(64),
      canonicalUrl: 'https://frontendatlas.com/react/trivia/hooks-rendering-interrupted',
      title: 'React hooks rendering patterns',
      h1: 'React hooks rendering patterns',
      family: 'question',
      tech: 'react',
      indexable: true,
      internalLinks: { inboundCount: 4 },
    });
    const coolingDown = trackedPage({
      pageKey: 'e'.repeat(64),
      canonicalUrl: 'https://frontendatlas.com/react/trivia/hooks-rendering-recently-changed',
      title: 'React hooks rendering after a change',
      h1: 'React hooks rendering after a change',
      family: 'question',
      tech: 'react',
      indexable: true,
      internalLinks: { inboundCount: 4 },
      changeTracking: {
        currentVersionKey: HASH_A,
        production: {
          effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
          precision: 'exact',
        },
        lastGoogleCrawlAt: new Date('2026-01-02T00:00:00.000Z'),
        detectors: {
          internal_link: {
            awaitingProductionEvidence: true,
            observedAt: new Date('2026-02-28T00:00:00.000Z'),
          },
        },
      },
    });
    const pages = [target, noOverlap, qualified, interrupted, coolingDown];
    const metrics = new Map(pages.map((page) => [page.pageKey, {
      current: { clicks: 1, impressions: 500, position: 10 },
    }]));
    const visibilityByPage = new Map(pages.map((page) => [page.pageKey, {
      interrupted: page.pageKey === interrupted.pageKey,
      evidence: { mature: true },
    }]));

    const evidence = internalLinkEvidenceForPage({
      page: target,
      pages,
      metrics,
      visibilityByPage,
      endDate: '2026-03-01',
    });

    expect(evidence.qualifiedDonors).toHaveLength(1);
    expect(evidence.qualifiedDonors[0]).toEqual(expect.objectContaining({
      title: 'React hooks rendering guide',
      canonicalUrl: qualified.canonicalUrl,
      relevanceScore: expect.any(Number),
      reasonCodes: expect.arrayContaining(['semantic_overlap', 'visible_donor']),
    }));
    expect(JSON.stringify(evidence.qualifiedDonors)).not.toContain(HASH_B);
    expect(JSON.stringify(evidence.qualifiedDonors)).not.toContain(interrupted.canonicalUrl);
    expect(JSON.stringify(evidence.qualifiedDonors)).not.toContain(coolingDown.canonicalUrl);
  });

  test('persists only bounded safe v2.2 evidence and keeps unknown impact null', () => {
    const unsafeOpportunity = {
      key: HASH_A,
      classification: 'ranking_gap',
      state: 'watch',
      disposition: 'investigate',
      clusterKey: HASH_B,
      safeLabel: 'react · direct answer',
      patternConfidence: 0.8,
      causeConfidence: 0.3,
      current: { clicks: 0, impressions: 400, position: 10 },
      previous: { clicks: 0, impressions: 300, position: 10 },
      coverage: { query: 0.8, semantic: 0.95, device: null },
      persistence: { stableWeeks: 4, requiredWeeks: 3, totalWeeks: 4 },
      recommendedSurface: 'h1_body',
      blockers: ['serp_review_required'],
      reviewReady: true,
      expectedImpact: { metric: 'clicks', low: 0, point: 0, high: 0, windowDays: 28, quality: 'not_estimated' },
      nextReview: { mode: 'event', event: 'serp_review', rationale: 'validate_ranking' },
      rawQuery: 'private raw search',
      memberQueryKeys: ['private-member'],
    };
    const packet = {
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: HASH_A,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      semanticVersion: 'semantic-v1',
      inputVersion: 'seo-analysis-input.v1',
      inputHash: HASH_A,
      pageVersionKey: HASH_B,
      primaryState: 'watch',
      disposition: 'investigate',
      patternConfidence: 0.8,
      causeConfidence: 0.3,
      primaryFinding: { detector: 'visibility_interruption', code: 'visibility_interruption' },
      metrics: { current: { clicks: 0, impressions: 400, position: 10 }, previous: {} },
      coverage: { query: 0.8, semantic: 0.95, device: null },
      visibility: {
        state: 'watch',
        disposition: 'investigate',
        reasonCodes: ['visibility_interruption', 'url_inspection_required'],
        patternConfidence: 0.9,
        causeConfidence: 0.2,
        interrupted: true,
        requiresInspection: true,
        evidence: { zeroImpressionStreak: 17, rawQuery: 'private visibility query' },
        nextReview: { mode: 'event', event: 'url_inspection', rationale: 'confirm_index_state' },
      },
      queryOpportunities: Array.from({ length: 12 }, () => ({ ...unsafeOpportunity })),
      decisionGates: ['url_inspection_required'],
      nextReview: { mode: 'event', event: 'url_inspection', rationale: 'confirm_index_state' },
      updatedAt: new Date('2026-08-10T00:00:00.000Z'),
    };
    const detectors = [{
      detector: 'visibility_interruption',
      state: 'watch',
      disposition: 'investigate',
      reasonCodes: ['visibility_interruption', 'url_inspection_required'],
      patternConfidence: 0.9,
      causeConfidence: 0.2,
      decisionGates: ['url_inspection_required'],
      nextReview: { mode: 'event', event: 'url_inspection', rationale: 'confirm_index_state' },
      evidence: { zeroImpressionStreak: 17, rawQuery: 'private detector query' },
    }];

    const persisted = safeAssessmentForPersistence(packet, detectors);
    expect(persisted).toEqual(expect.objectContaining({
      disposition: 'investigate',
      patternConfidence: 0.8,
      causeConfidence: 0.3,
      primaryFinding: expect.objectContaining({
        detector: 'visibility_interruption',
        code: 'visibility_interruption',
        disposition: 'investigate',
      }),
      visibility: expect.objectContaining({ interrupted: true, requiresInspection: true }),
      decisionGates: ['url_inspection_required'],
      nextReview: expect.objectContaining({ mode: 'event', event: 'url_inspection' }),
    }));
    expect(persisted.queryOpportunities).toHaveLength(10);
    expect(persisted.queryOpportunities[0].expectedImpact).toEqual(expect.objectContaining({
      quality: 'not_estimated',
      low: null,
      point: null,
      high: null,
    }));
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain('private raw search');
    expect(serialized).not.toContain('private-member');
    expect(serialized).not.toContain('private visibility query');
    expect(serialized).not.toContain('private detector query');
  });

  test('persists the safe post-inspection visibility lifecycle fields', () => {
    const persisted = safeAssessmentForPersistence({
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: HASH_A,
      canonicalUrl: 'https://frontendatlas.com/angular/trivia/example',
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      semanticVersion: 'semantic-v1',
      inputVersion: 'seo-analysis-input.v1',
      inputHash: HASH_A,
      pageVersionKey: HASH_B,
      primaryState: 'watch',
      disposition: 'monitor',
      patternConfidence: 0.9,
      causeConfidence: 0.1,
      visibility: {
        state: 'watch',
        disposition: 'monitor',
        reasonCodes: [
          'visibility_interruption',
          'visibility_inspection_passed',
          'post_inspection_14_finalized_days',
        ],
        patternConfidence: 0.9,
        causeConfidence: 0.1,
        interrupted: true,
        requiresInspection: false,
        decisionGate: 'post_inspection_14_finalized_days',
        evidence: {
          inspectionCurrent: true,
          inspectionPass: true,
          cleanFinalizedDays: 5,
          cleanWindowStartDate: '2026-08-02',
          rawQuery: 'must not persist',
        },
        nextReview: {
          mode: 'event',
          event: '14_finalized_days',
          rationale: 'observe_initial_post_inspection_recovery_window',
        },
      },
      decisionGates: ['post_inspection_14_finalized_days'],
      nextReview: {
        mode: 'event',
        event: '14_finalized_days',
        rationale: 'observe_initial_post_inspection_recovery_window',
      },
      updatedAt: new Date('2026-08-10T00:00:00.000Z'),
    }, []);

    expect(persisted.visibility).toEqual(expect.objectContaining({
      disposition: 'monitor',
      requiresInspection: false,
      decisionGate: 'post_inspection_14_finalized_days',
      evidence: expect.objectContaining({
        inspectionCurrent: true,
        inspectionPass: true,
        cleanFinalizedDays: 5,
        cleanWindowStartDate: '2026-08-02',
      }),
      nextReview: expect.objectContaining({ event: '14_finalized_days' }),
    }));
    expect(JSON.stringify(persisted.visibility)).not.toContain('must not persist');
  });
});
