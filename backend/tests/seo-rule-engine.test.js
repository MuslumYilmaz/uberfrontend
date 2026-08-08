'use strict';

const {
  RULE_VERSION,
  assessCannibalization,
  assessContentDecay,
  assessCtrBaselineQuality,
  assessCtrSnippet,
  assessIntentMismatch,
  assessTechnicalIndexing,
  detectContentDecay,
  evaluatePage,
  evaluatePageAssessment,
  weeklyPersistence,
  wilsonInterval,
} = require('../services/seo/rule-engine');
const { buildSemanticClusters } = require('../services/seo/semantic-clustering');
const { sanitizeDetectorAssessment } = require('../services/seo/analysis');
const { pageKeyForUrl, validateFrontendAtlasUrl } = require('../services/seo/keys');

const page = {
  pageKey: 'page-key',
  canonicalUrl: 'https://frontendatlas.com/javascript/interview-questions',
  indexable: true,
  intendedIntent: 'javascript interview questions and answers',
  targetKeyword: 'javascript interview questions',
  intentConfirmed: true,
};

function persistentCtrWeeks() {
  return {
    previous: Array.from({ length: 4 }, () => ({ clicks: 25, impressions: 250, position: 5 })),
    current: [12, 13, 11, 14].map((clicks) => ({ clicks, impressions: 250, position: 5 })),
  };
}

describe('balanced-v2 SEO rule engine', () => {
  test('uses balanced-v2 fingerprints and preserves strict canonical identity', () => {
    expect(RULE_VERSION).toBe('balanced-v2.1');
    expect(validateFrontendAtlasUrl('https://frontendatlas.com:8443/page')).toBeNull();
    expect(validateFrontendAtlasUrl('https://frontendatlas.com/page?query=secret')).toBeNull();
    expect(validateFrontendAtlasUrl('https://frontendatlas.com/page/')).toBe('https://frontendatlas.com/page');
    expect(pageKeyForUrl(validateFrontendAtlasUrl('https://frontendatlas.com/page/')))
      .toBe(pageKeyForUrl('https://frontendatlas.com/page'));
  });

  test('labels small or click-poor CTR peer cohorts as insufficient', () => {
    expect(assessCtrBaselineQuality({
      cohort: 'family+tech+position',
      peerPageCount: 9,
      peerClicks: 10,
      peerImpressions: 9393,
      zeroClickPeerShare: 0.5,
    })).toEqual(expect.objectContaining({
      quality: 'insufficient',
      peerPageCount: 9,
      peerClicks: 10,
      peerImpressions: 9393,
      reasonCodes: expect.arrayContaining(['baseline_too_few_peers', 'baseline_too_few_clicks']),
    }));

    expect(assessCtrBaselineQuality({
      peerPageCount: 50,
      peerClicks: 300,
      peerImpressions: 30000,
      zeroClickPeerShare: 0.85,
    }).quality).toBe('medium');
  });

  test('keeps technical detection active but withholds definitive clear before a post-deploy crawl', () => {
    const pending = evaluatePageAssessment({
      page,
      current: { clicks: 1, impressions: 100, position: 5 },
      technical: { pageAgeDays: 100 },
      cooldown: {
        technical_indexing: { state: 'awaiting_recrawl' },
        ctr_snippet: { state: 'eligible' },
        intent_mismatch: { state: 'eligible' },
        content_decay: { state: 'eligible' },
        cannibalization: { state: 'eligible' },
        internal_link: { state: 'eligible' },
      },
    });
    expect(pending.state).toBe('watch');
    expect(pending.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        detector: 'technical_indexing',
        reasonCodes: expect.arrayContaining(['technical_clear_awaiting_post_deploy_crawl']),
      }),
    ]));

    const anomaly = evaluatePageAssessment({
      page,
      current: { clicks: 0, impressions: 0, position: 0 },
      technical: { pageAgeDays: 100, manifestRobotsBlocked: true },
      cooldown: { technical_indexing: { state: 'awaiting_recrawl' } },
    });
    expect(anomaly.state).toBe('actionable');
    expect(anomaly.action.type).toBe('technical_indexing');
  });

  test('keeps an incomplete initial fingerprint not evaluable and preserves its safe reason', () => {
    const result = evaluatePageAssessment({
      page: {
        ...page,
        changeTracking: {
          fingerprintVersion: 'seo-page-fingerprints.v1',
          currentVersionKey: '',
          fingerprintEvidence: {
            source: 'manifest_only',
            statuses: {
              title: 'partial', description: 'partial', mainContent: 'unavailable',
              headingOutline: 'unavailable', intent: 'complete', internalLinks: 'unavailable',
              canonical: 'partial', robots: 'partial', indexability: 'complete', structuredData: 'unavailable',
            },
          },
        },
      },
      current: { clicks: 100, impressions: 10_000, position: 4 },
      technical: { pageAgeDays: 100 },
    });
    expect(result.state).toBe('not_evaluable');
    const ctr = result.findings.find((finding) => finding.detector === 'ctr_snippet');
    expect(ctr.reasonCodes).toContain('fingerprint_evidence_unavailable');
    expect(sanitizeDetectorAssessment('ctr_snippet', ctr)).toEqual(expect.objectContaining({
      reasonCodes: ['fingerprint_evidence_unavailable'],
      evidence: expect.objectContaining({ summary: expect.stringContaining('fingerprint evidence') }),
    }));
  });

  test('requires a medium/high baseline and separated Wilson intervals for a CTR action', () => {
    const supported = assessCtrSnippet({
      page,
      current: { clicks: 10, impressions: 2000, position: 5 },
      previous: { clicks: 12, impressions: 1900, position: 5.5 },
      ctrBaseline: {
        cohort: 'site+position',
        peerPageCount: 50,
        peerClicks: 600,
        peerImpressions: 30000,
        zeroClickPeerShare: 0.2,
      },
      windowDays: 28,
    });
    expect(supported).toEqual(expect.objectContaining({
      state: 'actionable',
      action: expect.objectContaining({ type: 'ctr_snippet', expectedAdditionalClicks: 30 }),
    }));
    expect(supported.evidence.currentWilson90.high).toBeLessThan(supported.evidence.baselineWilson90.low);

    const weak = assessCtrSnippet({
      page,
      current: { clicks: 1, impressions: 1000, position: 5 },
      previous: { clicks: 2, impressions: 1000, position: 5 },
      ctrBaseline: { peerPageCount: 9, peerClicks: 10, peerImpressions: 9393 },
    });
    expect(weak.state).toBe('watch');
    expect(weak.action).toBeNull();
    expect(weak.reasonCodes).toContain('baseline_quality_insufficient');
  });

  test('treats the target 6-to-3 click movement as low sample, not decay', () => {
    const result = assessContentDecay({
      page,
      previous: { clicks: 6, impressions: 3156, position: 6.68 },
      current: { clicks: 3, impressions: 2519, position: 6.65 },
      windowDays: 28,
      weekly: persistentCtrWeeks(),
    });
    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      reasonCodes: ['low_sample'],
      action: null,
    }));
    expect(detectContentDecay({
      page,
      previous: { clicks: 6, impressions: 3156, position: 6.68 },
      current: { clicks: 3, impressions: 2519, position: 6.65 },
      weekly: persistentCtrWeeks(),
    })).toBeNull();
  });

  test('opens decay only after complete windows, uncertainty, and persistence gates pass', () => {
    const result = assessContentDecay({
      page,
      previous: { clicks: 100, impressions: 1000, position: 5 },
      current: { clicks: 50, impressions: 1000, position: 5 },
      windowDays: 28,
      windowsComplete: { current: true, previous: true },
      weekly: persistentCtrWeeks(),
    });
    expect(result).toEqual(expect.objectContaining({
      state: 'actionable',
      reasonCodes: ['persistent_ctr_decay'],
      action: expect.objectContaining({
        type: 'content_decay',
        successCriteria: expect.objectContaining({ baselinePreviousClicks: 100, minimumClicks: 90 }),
      }),
    }));

    const noWeeks = assessContentDecay({
      page,
      previous: { clicks: 100, impressions: 1000, position: 5 },
      current: { clicks: 50, impressions: 1000, position: 5 },
      windowDays: 28,
    });
    expect(noWeeks.state).toBe('watch');
    expect(noWeeks.reasonCodes).toContain('persistence_unavailable');
  });

  test('exposes deterministic 90% Wilson and weekly persistence helpers', () => {
    const interval = wilsonInterval(10, 1000);
    expect(interval.low).toBeGreaterThan(0);
    expect(interval.high).toBeGreaterThan(interval.low);
    expect(weeklyPersistence(persistentCtrWeeks(), 'ctr')).toEqual({
      available: true,
      totalWeeks: 4,
      decliningWeeks: 4,
      requiredWeeks: 3,
      persistent: true,
    });
  });

  test('reports aligned official/reference demand as directional, not intent mismatch', () => {
    const semanticClusters = buildSemanticClusters({
      currentRows: [
        { query: 'angular httpclient unsubscribe docs', clicks: 0, impressions: 469, position: 6.7 },
        { query: 'does angular httpclient unsubscribe cancel request', clicks: 0, impressions: 262, position: 4.9 },
        { query: 'how to abort angular http request', clicks: 0, impressions: 18, position: 5 },
      ],
      pageIntent: 'Angular HttpClient cancellation unsubscribe requests',
      pageTech: 'angular',
      pageCurrentImpressions: 2519,
    });
    const result = assessIntentMismatch({
      page: { ...page, intendedIntent: 'Angular HttpClient cancellation unsubscribe requests' },
      semanticClusters,
    });
    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      action: null,
      reasonCodes: expect.arrayContaining([
        'source_preference', 'topic_aligned_visible_subset', 'query_coverage_below_threshold',
      ]),
    }));
    expect(result.evidence.queryCoverage).toBeCloseTo(749 / 2519);
  });

  test('keeps target semantic direction visible without auto-confirming page intent', () => {
    const semanticClusters = buildSemanticClusters({
      currentRows: [
        { query: 'angular httpclient unsubscribe docs', clicks: 0, impressions: 469, position: 6.7 },
        { query: 'does angular httpclient unsubscribe cancel request', clicks: 0, impressions: 262, position: 4.9 },
        { query: 'how to abort angular http request', clicks: 0, impressions: 18, position: 5 },
      ],
      pageIntent: 'Angular HttpClient cancellation unsubscribe requests',
      pageTech: 'angular',
      pageCurrentImpressions: 2519,
    });
    const result = assessIntentMismatch({
      page: {
        ...page,
        intendedIntent: 'Angular HttpClient cancellation unsubscribe requests',
        intentConfirmed: false,
      },
      semanticClusters,
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'not_evaluable',
      action: null,
      reasonCodes: expect.arrayContaining([
        'intent_not_confirmed',
        'source_preference',
        'topic_aligned_visible_subset',
        'query_coverage_below_threshold',
      ]),
    }));
    expect(result.evidence).toEqual(expect.objectContaining({
      directional: true,
      queryCoverage: expect.closeTo(749 / 2519),
    }));
  });

  test('requires confirmed intent plus strict query, semantic, and lower-bound gates', () => {
    const semanticClusters = buildSemanticClusters({
      currentRows: [{ query: 'css grid layout tutorial', clicks: 4, impressions: 400, position: 7 }],
      pageIntent: page.intendedIntent,
      pageTech: '',
      pageCurrentImpressions: 500,
    });
    expect(assessIntentMismatch({ page, semanticClusters })).toEqual(expect.objectContaining({
      state: 'actionable',
      action: expect.objectContaining({ type: 'intent_mismatch' }),
    }));
    expect(assessIntentMismatch({ page: { ...page, intentConfirmed: false }, semanticClusters }).state)
      .toBe('not_evaluable');
  });

  test('does not evaluate cannibalization when semantic evidence is incomplete', () => {
    const base = {
      page,
      queryCoverage: 0.7,
      semanticCoverage: 0.85,
      cannibalization: { secondUrlImpressionShare: 0.3, alternatingWeeks: 4, clusterImpressions: 500, clusterKey: 'x' },
    };
    expect(assessCannibalization(base)).toEqual(expect.objectContaining({
      state: 'not_evaluable', reasonCodes: ['semantic_coverage_below_threshold'], action: null,
    }));
    expect(assessCannibalization({ ...base, semanticCoverage: 0.95 }).state).toBe('actionable');
    expect(assessCannibalization({
      page,
      queryCoverage: 0.7,
      semanticCoverage: 0.95,
      cannibalization: null,
    })).toEqual(expect.objectContaining({
      state: 'clear', reasonCodes: ['no_persistent_url_competition'], action: null,
    }));
    expect(assessCannibalization({
      page,
      queryCoverage: 0.5,
      semanticCoverage: 0.95,
      cannibalization: null,
    })).toEqual(expect.objectContaining({
      state: 'not_evaluable', reasonCodes: ['query_coverage_below_threshold'], action: null,
    }));
    expect(assessCannibalization({
      page,
      queryCoverage: 1.01,
      semanticCoverage: 0.95,
      cannibalization: null,
    })).toEqual(expect.objectContaining({
      state: 'not_evaluable', reasonCodes: ['query_coverage_inconsistent'], action: null,
    }));
    expect(assessCannibalization({
      ...base,
      semanticCoverage: 0.95,
      cannibalization: { ...base.cannibalization, semantic: true, alternatingWeeks: 0 },
    })).toEqual(expect.objectContaining({
      state: 'not_evaluable', reasonCodes: ['cannibalization_persistence_unavailable'], action: null,
    }));
  });

  test('does not evaluate cannibalization when either competing page has unsafe coverage', () => {
    expect(assessCannibalization({
      page,
      queryCoverage: 0.7,
      semanticCoverage: 0.95,
      cannibalization: {
        clusterKey: 'unsafe-cluster',
        secondPageKey: 'page-two',
        secondUrlImpressionShare: 0.4,
        alternatingWeeks: 4,
        clusterImpressions: 500,
        semantic: true,
        coverageUnsafe: true,
      },
    })).toEqual(expect.objectContaining({
      state: 'not_evaluable',
      reasonCodes: ['cannibalization_data_unavailable'],
      action: null,
      evidence: expect.objectContaining({ coverageUnsafe: true }),
    }));
  });

  test('cooldown suppresses performance actions but not technical anomalies', () => {
    const decayContext = {
      page,
      previous: { clicks: 100, impressions: 1000, position: 5 },
      current: { clicks: 50, impressions: 1000, position: 5 },
      weekly: persistentCtrWeeks(),
      cooldown: { status: 'observing', cleanFinalizedDays: 0, requiredDays: 28 },
      technical: { pageAgeDays: 100 },
    };
    const observing = evaluatePageAssessment(decayContext);
    expect(observing).toEqual(expect.objectContaining({
      state: 'watch', verdict: 'observing_change', evidenceLevel: 'directional', action: null,
    }));
    expect(observing.findings.some((finding) => finding.reasonCodes.includes('performance_action_suppressed_by_cooldown'))).toBe(true);

    const technical = evaluatePageAssessment({
      ...decayContext,
      technical: { pageAgeDays: 100, inspectionIssue: true },
    });
    expect(technical.action).toEqual(expect.objectContaining({ type: 'technical_indexing' }));
    expect(evaluatePage({ ...decayContext, technical: { inspectionIssue: true } })).toHaveLength(1);
    expect(assessTechnicalIndexing({ page, technical: { inspectionIssue: true } }).state).toBe('actionable');
  });

  test('accepts the canonical cooldown state field from cooldownForPage', () => {
    const result = evaluatePageAssessment({
      page,
      previous: { clicks: 100, impressions: 1000, position: 5 },
      current: { clicks: 50, impressions: 1000, position: 5 },
      weekly: persistentCtrWeeks(),
      cooldown: { state: 'directional', cleanFinalizedDays: 14 },
      technical: { pageAgeDays: 100 },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      verdict: 'observing_change',
      evidenceLevel: 'directional',
      action: null,
    }));
    expect(result.findings.some((finding) => (
      finding.reasonCodes.includes('performance_action_suppressed_by_cooldown')
    ))).toBe(true);
  });
});
