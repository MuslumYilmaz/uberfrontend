'use strict';

const {
  detailCoverageHealth,
  enforceAnalysisReadiness,
  latestAnalysisSummary,
  reconciliationSubset,
  serializeAnalysis,
  serializeAssessment,
  serializeLineage,
  updatePageIntent,
} = require('../services/seo/dashboard');
const SeoPage = require('../models/SeoPage');
const SeoSyncRun = require('../models/SeoSyncRun');

function window(overrides = {}) {
  return {
    startDate: '2026-07-07',
    endDate: '2026-08-03',
    completedDays: 28,
    requiredDays: 28,
    truncatedDays: 0,
    missingDays: 0,
    complete: true,
    ...overrides,
  };
}

describe('balanced-v2 dashboard contracts', () => {
  afterEach(() => jest.restoreAllMocks());

  test('only treats an analysis for the latest finalized date as current', () => {
    const summary = serializeAnalysis({
      analysis: {
        status: 'complete',
        reason: 'complete',
        endDate: '2026-08-02',
        evaluatedPages: 435,
        totalPages: 435,
      },
    }, '2026-08-03', 56);

    expect(summary).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'latest_data_not_analyzed',
      currentForLatestData: false,
    }));
  });

  test('fails closed when a complete current analysis uses an outdated rule version', () => {
    const summary = serializeAnalysis({
      analysis: {
        status: 'complete',
        ruleVersion: 'balanced-v1',
        endDate: '2026-08-03',
        evaluatedPages: 435,
        totalPages: 435,
      },
    }, '2026-08-03', 56);

    expect(summary).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'analysis_rule_outdated',
      currentForLatestData: true,
      ruleVersion: 'balanced-v1',
    }));
  });

  test('preserves current contiguous readiness when a not-ready run persisted zero days', () => {
    const summary = serializeAnalysis({
      analysis: {
        status: 'not_ready',
        reason: 'insufficient_contiguous_page_data',
        ruleVersion: 'balanced-v2.1',
        endDate: '2026-08-03',
        completedDays: 0,
        requiredDays: 56,
      },
    }, '2026-08-03', 32);

    expect(summary).toEqual(expect.objectContaining({
      status: 'not_ready',
      completedDays: 32,
      requiredDays: 56,
      currentForLatestData: true,
    }));
  });

  test('lets the newest same-date not-ready run supersede an older complete run', async () => {
    const notReady = {
      analysis: {
        status: 'not_ready',
        reason: 'analysis_deadline',
        ruleVersion: 'balanced-v2.1',
        endDate: '2026-08-03',
        startedAt: null,
        completedAt: new Date('2026-08-07T12:00:00.000Z'),
      },
    };
    const query = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(notReady),
    };
    const findOne = jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue(query);

    await expect(latestAnalysisSummary(
      'sc-domain:frontendatlas.com',
      '2026-08-03',
      56
    )).resolves.toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'analysis_deadline',
      currentForLatestData: true,
    }));
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      siteUrl: 'sc-domain:frontendatlas.com',
      'analysis.status': { $exists: true },
    });
    expect(query.sort).toHaveBeenCalledWith({
      startedAt: -1,
      'analysis.completedAt': -1,
    });
    findOne.mockRestore();
  });

  test('lets a newer failed analysis without an end date supersede an older complete analysis', async () => {
    const failed = {
      analysis: {
        status: 'failed',
        reason: 'analysis_failed',
        ruleVersion: 'balanced-v2.1',
        endDate: null,
        completedAt: new Date('2026-08-07T12:00:00.000Z'),
      },
    };
    const query = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(failed),
    };
    const findOne = jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue(query);

    await expect(latestAnalysisSummary(
      'sc-domain:frontendatlas.com',
      '2026-08-03',
      56
    )).resolves.toEqual(expect.objectContaining({
      status: 'failed',
      reason: 'analysis_failed',
      endDate: null,
      currentForLatestData: false,
    }));
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      siteUrl: 'sc-domain:frontendatlas.com',
      'analysis.status': { $exists: true },
    });
    findOne.mockRestore();
  });

  test('preserves a production-marker failure when no analysis date can be trusted', () => {
    const summary = serializeAnalysis({
      analysis: {
        status: 'not_ready',
        reason: 'production_marker_source_mismatch',
        ruleVersion: 'balanced-v2.1',
        endDate: null,
      },
    }, '2026-08-03', 56);

    expect(summary).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'production_marker_source_mismatch',
      currentForLatestData: false,
    }));
  });

  test.each([
    [436, 435],
    [435, 434],
  ])('fails a complete analysis closed when the manifest count is %i and evaluated pages are %i', (
    currentManifestPages,
    evaluatedPages
  ) => {
    const result = enforceAnalysisReadiness({
      status: 'complete',
      reason: 'analysis_complete',
      totalPages: 435,
      evaluatedPages,
    }, { currentManifestPages, syncStatus: 'idle', stale: false });

    expect(result).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'manifest_changed_since_analysis',
    }));
  });

  test.each(['failed', 'running', 'waiting', 'disabled'])(
    'fails a would-be complete analysis closed when sync status is %s',
    (syncStatus) => {
      const result = enforceAnalysisReadiness({
        status: 'complete',
        reason: 'analysis_complete',
        totalPages: 435,
        evaluatedPages: 435,
      }, { currentManifestPages: 435, syncStatus, stale: false });

      expect(result).toEqual(expect.objectContaining({
        status: 'not_ready',
        reason: 'sync_unhealthy',
      }));
    }
  );

  test('fails a would-be complete analysis closed when finalized data is stale', () => {
    const result = enforceAnalysisReadiness({
      status: 'complete',
      reason: 'analysis_complete',
      totalPages: 435,
      evaluatedPages: 435,
    }, { currentManifestPages: 435, syncStatus: 'idle', stale: true });

    expect(result).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'finalized_data_stale',
    }));
  });

  test('keeps a complete current-manifest analysis complete when ingestion is healthy', () => {
    const summary = {
      status: 'complete',
      reason: 'analysis_complete',
      totalPages: 435,
      evaluatedPages: 435,
    };
    expect(enforceAnalysisReadiness(summary, {
      currentManifestPages: 435,
      syncStatus: 'idle',
      stale: false,
    })).toEqual(summary);
  });

  test('fails a complete analysis closed when current page assessments are incomplete', () => {
    const result = enforceAnalysisReadiness({
      status: 'complete',
      reason: 'analysis_complete',
      totalPages: 435,
      evaluatedPages: 435,
    }, {
      currentManifestPages: 435,
      currentAssessmentPages: 434,
      syncStatus: 'idle',
      stale: false,
    });

    expect(result).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'page_assessments_incomplete',
      committedAssessmentPages: 434,
    }));
  });

  test('reports committed assessment rows separately from in-memory evaluation progress', () => {
    const result = enforceAnalysisReadiness({
      status: 'partial',
      reason: 'analysis_deadline',
      totalPages: 435,
      evaluatedPages: 435,
    }, {
      currentManifestPages: 435,
      currentAssessmentPages: 0,
      syncStatus: 'idle',
      stale: false,
    });

    expect(result).toEqual(expect.objectContaining({
      status: 'partial',
      evaluatedPages: 435,
      committedAssessmentPages: 0,
      totalPages: 435,
    }));
  });

  test('uses only same-day complete page denominators for overview coverage', () => {
    const result = detailCoverageHealth({
      pagePartitions: [
        { date: '2026-08-02', status: 'complete', impressions: 100 },
        { date: '2026-08-03', status: 'complete', impressions: 900 },
      ],
      detailPartitions: [
        { date: '2026-08-02', status: 'complete', impressions: 70 },
        { date: '2026-08-03', status: 'truncated', impressions: 900 },
      ],
      startDate: '2026-08-02',
      endDate: '2026-08-03',
      sufficientThreshold: 0.6,
    });

    expect(result).toEqual(expect.objectContaining({
      coveragePercent: 70,
      status: 'partial',
      sufficient: false,
      window: expect.objectContaining({
        completedDays: 1,
        truncatedDays: 1,
        missingDays: 0,
        complete: false,
      }),
    }));
  });

  test('does not report an empty coverage window as complete', () => {
    const result = detailCoverageHealth({ sufficientThreshold: 0.6 });

    expect(result.status).toBe('unavailable');
    expect(result.window).toEqual(expect.objectContaining({
      completedDays: 0,
      requiredDays: 0,
      complete: false,
    }));
  });

  test('detects a per-day coverage over-count even when aggregate under-count masks it', () => {
    const result = detailCoverageHealth({
      pagePartitions: [
        { date: '2026-08-02', status: 'complete', impressions: 100 },
        { date: '2026-08-03', status: 'complete', impressions: 100 },
      ],
      detailPartitions: [
        { date: '2026-08-02', status: 'complete', impressions: 120 },
        { date: '2026-08-03', status: 'complete', impressions: 80 },
      ],
      startDate: '2026-08-02',
      endDate: '2026-08-03',
      sufficientThreshold: 0.6,
    });

    expect(result).toEqual(expect.objectContaining({
      coveragePercent: 100,
      status: 'inconsistent',
      sufficient: false,
      window: expect.objectContaining({ complete: true }),
    }));
  });

  test('preserves over-count instead of silently clipping coverage', () => {
    const result = reconciliationSubset({
      detailRows: [{ clicks: 2, impressions: 120, positionNumerator: 1_200 }],
      sameDayPageRows: [{ clicks: 2, impressions: 100, positionNumerator: 1_000 }],
      fullPageRows: [{ clicks: 2, impressions: 100, positionNumerator: 1_000 }],
      partitionWindow: window(),
      sufficientThreshold: 0.6,
    });

    expect(result.status).toBe('inconsistent');
    expect(result.coveragePercent).toBe(120);
    expect(result.fullWindowLowerBoundPercent).toBe(120);
    expect(result.coverageSufficient).toBe(false);
  });

  test('distinguishes an observed zero subset from unavailable data', () => {
    const observedZero = reconciliationSubset({
      detailRows: [],
      sameDayPageRows: [{ clicks: 0, impressions: 100, positionNumerator: 0 }],
      fullPageRows: [{ clicks: 0, impressions: 100, positionNumerator: 0 }],
      partitionWindow: window(),
      sufficientThreshold: 0.6,
    });
    const unavailable = reconciliationSubset({
      detailRows: [],
      sameDayPageRows: [],
      fullPageRows: [{ clicks: 0, impressions: 100, positionNumerator: 0 }],
      partitionWindow: window({ completedDays: 0, complete: false, missingDays: 28 }),
      sufficientThreshold: 0.6,
    });

    expect(observedZero.metrics).toEqual(expect.objectContaining({ clicks: 0, impressions: 0 }));
    expect(observedZero.status).toBe('limited');
    expect(unavailable.metrics).toBeNull();
    expect(unavailable.status).toBe('unavailable');
  });

  test('never treats a partial detail window as sufficient coverage', () => {
    const result = reconciliationSubset({
      detailRows: [{ clicks: 1, impressions: 95, positionNumerator: 950 }],
      sameDayPageRows: [{ clicks: 1, impressions: 100, positionNumerator: 1_000 }],
      fullPageRows: [{ clicks: 1, impressions: 200, positionNumerator: 2_000 }],
      partitionWindow: window({ completedDays: 14, missingDays: 14, complete: false }),
      sufficientThreshold: 0.9,
    });

    expect(result).toEqual(expect.objectContaining({
      status: 'partial',
      coveragePercent: 95,
      coverageSufficient: false,
    }));
  });

  test('marks a positive detail numerator over a zero page denominator inconsistent', () => {
    const result = reconciliationSubset({
      detailRows: [{ clicks: 1, impressions: 5, positionNumerator: 50 }],
      sameDayPageRows: [],
      fullPageRows: [],
      partitionWindow: window(),
      sufficientThreshold: 0.6,
    });

    expect(result).toEqual(expect.objectContaining({
      status: 'inconsistent',
      coveragePercent: null,
      coverageSufficient: false,
    }));
  });

  test('detects per-day page reconciliation over-count hidden by its aggregate', () => {
    const result = reconciliationSubset({
      detailRows: [
        { _id: '2026-08-02', clicks: 1, impressions: 120, positionNumerator: 1_200 },
        { _id: '2026-08-03', clicks: 1, impressions: 80, positionNumerator: 800 },
      ],
      sameDayPageRows: [
        { _id: '2026-08-02', clicks: 1, impressions: 100, positionNumerator: 1_000 },
        { _id: '2026-08-03', clicks: 1, impressions: 100, positionNumerator: 1_000 },
      ],
      fullPageRows: [
        { _id: '2026-08-02', clicks: 1, impressions: 100, positionNumerator: 1_000 },
        { _id: '2026-08-03', clicks: 1, impressions: 100, positionNumerator: 1_000 },
      ],
      partitionWindow: window(),
      sufficientThreshold: 0.6,
    });

    expect(result).toEqual(expect.objectContaining({
      coveragePercent: 100,
      status: 'inconsistent',
      coverageSufficient: false,
    }));
  });

  test('only marks latest balanced-v2 assessments evaluated after a material change as current', () => {
    const base = {
      primaryState: 'watch',
      endDate: '2026-08-03',
      ruleVersion: 'balanced-v2.1',
      evaluatedAt: new Date('2026-08-05T00:00:00.000Z'),
    };

    expect(serializeAssessment(base, '2026-08-03', {
      materialChangedAt: new Date('2026-08-04T00:00:00.000Z'),
    }).currentForLatestData).toBe(true);
    expect(serializeAssessment({ ...base, ruleVersion: 'balanced-v1' }, '2026-08-03', {
      materialChangedAt: new Date('2026-08-04T00:00:00.000Z'),
    }).currentForLatestData).toBe(false);
    expect(serializeAssessment(base, '2026-08-03', {
      materialChangedAt: new Date('2026-08-06T00:00:00.000Z'),
    }).currentForLatestData).toBe(false);
  });

  test('uses analysisInvalidatedAt as a monotonic assessment freshness cutoff', () => {
    const assessment = {
      primaryState: 'clear',
      endDate: '2026-08-03',
      ruleVersion: 'balanced-v2.1',
      evaluatedAt: new Date('2026-08-05T00:00:00.000Z'),
    };

    expect(serializeAssessment(assessment, '2026-08-03', {
      materialChangedAt: new Date('2026-08-04T00:00:00.000Z'),
      analysisInvalidatedAt: new Date('2026-08-06T00:00:00.000Z'),
    }).currentForLatestData).toBe(false);
    expect(serializeAssessment({
      ...assessment,
      evaluatedAt: new Date('2026-08-06T00:00:00.000Z'),
    }, '2026-08-03', {
      materialChangedAt: new Date('2026-08-04T00:00:00.000Z'),
      analysisInvalidatedAt: new Date('2026-08-06T00:00:00.000Z'),
    }).currentForLatestData).toBe(true);
  });

  test('retains the prior packet as stale when the owner changes confirmed intent', async () => {
    const updated = { pageKey: 'page-key', intent: { intendedIntent: 'new intent' } };
    const existing = {
      pageKey: 'page-key',
      updatedAt: new Date('2026-08-07T10:00:00.000Z'),
      intent: { intendedIntent: 'old intent', source: 'derived', confirmed: false },
      changeTracking: { currentVersionKey: 'version-one', analysisInputHash: 'old-input' },
    };
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(existing),
    });
    const lean = jest.fn().mockResolvedValue(updated);
    const update = jest.spyOn(SeoPage, 'findOneAndUpdate').mockReturnValue({ lean });

    await expect(updatePageIntent('page-key', {
      intendedIntent: 'new intent',
      intentConfirmed: true,
    }, new Date('2026-08-07T12:00:00.000Z'))).resolves.toBe(updated);

    expect(update).toHaveBeenCalledWith(
      { pageKey: 'page-key', updatedAt: existing.updatedAt },
      expect.objectContaining({
        $set: expect.objectContaining({
          'intent.intendedIntent': 'new intent',
          'intent.confirmed': true,
          'intent.source': 'owner',
          'changeTracking.analysisInvalidatedAt': new Date('2026-08-07T12:00:00.000Z'),
          'changeTracking.analysisInputHash': expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
      { new: true, runValidators: true }
    );
  });

  test('does not invalidate an unchanged owner intent contract', async () => {
    const existing = {
      pageKey: 'page-key',
      intent: {
        intendedIntent: 'same intent', readerPromise: 'same promise', targetKeyword: 'same keyword',
        confirmed: true, source: 'owner',
      },
      changeTracking: { analysisInputHash: 'stable-input' },
    };
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(existing) });
    const update = jest.spyOn(SeoPage, 'findOneAndUpdate');

    await expect(updatePageIntent('page-key', {
      intendedIntent: 'same intent', readerPromise: 'same promise', targetKeyword: 'same keyword',
      intentConfirmed: true,
    })).resolves.toBe(existing);
    expect(update).not.toHaveBeenCalled();
  });

  test('never exposes a raw query as a semantic cluster label', () => {
    const assessment = serializeAssessment({
      primaryState: 'watch',
      endDate: '2026-08-03',
      semanticClusters: [{
        label: 'angular httpclient unsubscribe abort exact raw query',
        safeLabel: 'another raw secret query alias',
        facet: 'official_reference<script>raw secret facet</script>',
        impressions: 100,
      }],
    }, '2026-08-03');

    expect(assessment.semanticClusters[0].label).toBe('other');
    expect(JSON.stringify(assessment)).not.toContain('exact raw query');
    expect(JSON.stringify(assessment)).not.toContain('raw secret');
  });

  test('keeps bounded detector proof while dropping raw and unknown evidence fields', () => {
    const secret = 'angular httpclient unsubscribe exact secret query';
    const secretCode = 'angular_httpclient_unsubscribe_exact_secret_query';
    const assessment = serializeAssessment({
      primaryState: 'watch',
      endDate: '2026-08-03',
      detectorAssessments: {
        content_decay: {
          state: 'watch',
          reasonCodes: ['low_sample', secretCode],
          confidence: 0.35,
          evidence: {
            summary: secret,
            current: { clicks: 3, impressions: 2519, ctr: 3 / 2519, position: 6.7 },
            previous: { clicks: 6, impressions: 3156, ctr: 6 / 3156, position: 6.68 },
            lostClicks: 3,
            currentWilson90: { low: 0.0004, high: 0.0035 },
            rawQuery: secret,
            label: secret,
            tokens: secret.split(' '),
            url: `https://frontendatlas.com/?q=${encodeURIComponent(secret)}`,
          },
        },
        ctr_snippet: {
          state: 'watch',
          reasonCodes: ['baseline_quality_insufficient'],
          confidence: 0.35,
          evidence: {
            summary: 'The peer baseline is insufficient.',
            baseline: {
              quality: 'insufficient',
              cohort: 'site+position',
              peerPageCount: 9,
              peerClicks: 10,
              peerImpressions: 9393,
              ctr: 10 / 9393,
            },
          },
        },
        intent_mismatch: {
          state: 'watch',
          reasonCodes: [
            'source_preference',
            'topic_aligned_visible_subset',
            'query_coverage_below_threshold',
          ],
          confidence: 0.45,
          evidence: {
            summary: 'The visible subset is topic aligned.',
            queryCoverage: 0.297,
            semanticCoverage: 0.95,
            queryCoverageStatus: 'consistent',
            dominantCluster: {
              clusterKey: 'a'.repeat(64),
              label: secret,
              dominantFacet: 'official_reference',
              visibleShare: 0.63,
              fullPageLowerBoundShare: 0.19,
              topicAlignment: 0.8,
              sourcePreferenceShare: 0.63,
            },
          },
        },
        malicious_detector: {
          state: 'actionable',
          evidence: { summary: secret },
        },
      },
    }, '2026-08-03');

    expect(assessment.detectorAssessments.content_decay.evidence).toEqual(expect.objectContaining({
      current: expect.objectContaining({ clicks: 3, impressions: 2519 }),
      previous: expect.objectContaining({ clicks: 6, impressions: 3156 }),
      lostClicks: 3,
      currentWilson90: { low: 0.0004, high: 0.0035 },
    }));
    expect(assessment.detectorAssessments.ctr_snippet.evidence.baseline).toEqual(expect.objectContaining({
      quality: 'insufficient', peerPageCount: 9, peerClicks: 10, peerImpressions: 9393,
    }));
    expect(assessment.detectorAssessments.intent_mismatch.evidence.dominantCluster)
      .toEqual(expect.objectContaining({
        dominantFacet: 'official_reference', visibleShare: 0.63,
        fullPageLowerBoundShare: 0.19, topicAlignment: 0.8, sourcePreferenceShare: 0.63,
      }));
    expect(assessment.detectorAssessments).not.toHaveProperty('malicious_detector');
    expect(JSON.stringify(assessment.detectorAssessments)).not.toContain(secret);
    expect(JSON.stringify(assessment.detectorAssessments)).not.toContain(secretCode);
    expect(assessment.detectorAssessments.content_decay.evidence).not.toHaveProperty('rawQuery');
    expect(assessment.detectorAssessments.intent_mismatch.evidence.dominantCluster).not.toHaveProperty('label');
    expect(assessment.reasonCodes).toEqual(expect.arrayContaining([
      'source_preference',
      'topic_aligned_visible_subset',
      'query_coverage_below_threshold',
    ]));
    expect(assessment.reasonCodes).not.toContain(secretCode);
  });

  test('rebuilds Mixed assessment fields from exact public allowlists', () => {
    const secret = 'raw-query-body-and-git-path-secret';
    const validDependency = 'a'.repeat(64);
    const assessment = serializeAssessment({
      primaryState: 'watch',
      evidenceLevel: 'directional',
      endDate: '2026-08-03',
      metrics: {
        current: { clicks: 3, impressions: 2519, position: 6.7, rawQuery: secret },
        previous: { clicks: 6, impressions: 3156, position: 6.68, rawBody: secret },
        gitPath: secret,
      },
      coverage: { query: 0.297, semantic: 0.95, rawQuery: secret },
      cooldown: {
        state: 'observing',
        detector: 'content_decay',
        changedComponents: ['title', secret],
        changedAt: '2026-08-03T00:00:00.000Z',
        cleanFinalizedDays: 3,
        cleanWindowStartDate: '2026-08-05',
        dependencyPageKeys: [validDependency, secret],
        rawBody: secret,
      },
      detectorCooldowns: {
        content_decay: {
          state: 'directional',
          detector: 'content_decay',
          cleanFinalizedDays: 14,
          decisionDataThrough: '2026-09-01',
          gitPath: secret,
        },
        [secret]: { state: 'eligible', rawQuery: secret },
      },
      ctrBaseline: {
        ctr: 10 / 9393,
        cohort: 'site+position',
        quality: 'insufficient',
        eligible: false,
        peerPageCount: 9,
        peerClicks: 10,
        peerImpressions: 9393,
        zeroClickPeerShare: 0.8,
        reasonCodes: ['baseline_quality_insufficient'],
        rawQuery: secret,
      },
      findings: [{
        code: 'low_sample', detector: secret, state: 'watch', confidence: 0.3, rawBody: secret,
      }, {
        code: secret, detector: 'content_decay', state: 'actionable', confidence: 1,
      }],
    }, '2026-08-03');

    expect(assessment.metrics).toEqual({
      current: { clicks: 3, impressions: 2519, position: 6.7 },
      previous: { clicks: 6, impressions: 3156, position: 6.68 },
    });
    expect(assessment.coverage).toEqual({ query: 0.297, semantic: 0.95 });
    expect(assessment.cooldown).toEqual(expect.objectContaining({
      state: 'observing',
      detector: 'content_decay',
      changedComponents: ['title'],
      dependencyPageKeys: [validDependency],
    }));
    expect(assessment.detectorCooldowns).toEqual({
      content_decay: expect.objectContaining({
        state: 'directional', detector: 'content_decay', cleanFinalizedDays: 14,
      }),
    });
    expect(assessment.ctrBaseline).toEqual(expect.objectContaining({
      cohort: 'site+position', quality: 'insufficient', peerPageCount: 9,
    }));
    expect(assessment.findings[0].detector).toBeNull();
    expect(assessment.verdict).toBe('observing_change');
    expect(JSON.stringify(assessment)).not.toContain(secret);
  });

  test('never promotes an unknown Mixed finding code into the public verdict', () => {
    const secret = 'frontend/src/private-page.ts raw exact query body';
    const assessment = serializeAssessment({
      primaryState: 'watch',
      evidenceLevel: 'directional',
      endDate: '2026-08-03',
      cooldown: { state: 'eligible' },
      findings: [{ code: secret, state: 'actionable', confidence: 1 }],
    }, '2026-08-03');

    expect(assessment.verdict).toBe('watch');
    expect(assessment.findings).toEqual([]);
    expect(JSON.stringify(assessment)).not.toContain(secret);
  });

  test('only exposes SHA-256 dependency identities from page lineage', () => {
    const validDependency = 'b'.repeat(64);
    const secret = 'raw-query-used-as-dependency-key';
    const lineage = serializeLineage({
      page: {
        changeTracking: {
          currentVersionKey: 'c'.repeat(64),
          currentOccurrenceKey: 'd'.repeat(64),
          analysisInputHash: 'e'.repeat(64),
          lastObservedDeployment: {
            deploymentId: secret,
            precision: secret,
            source: secret,
          },
          fingerprintEvidence: {
            source: secret,
            limitations: ['rawquery', 'client_only_runtime_content_not_observed'],
            statuses: { rawquery: 'complete', mainContent: secret, title: 'complete' },
          },
          production: {
            gitCandidate: {
              status: secret,
              scope: secret,
              confidence: secret,
              changeTypes: { rawquery: 1, modified: 2 },
              areas: { rawquery: 1, frontend: 2 },
              candidateSignals: ['rawquery', 'rendered_application_source_changed'],
            },
          },
          detectors: {
            internal_link: {
              versionKey: secret,
              occurrenceKey: secret,
              productionPrecision: secret,
              productionSource: secret,
              sourceRecrawlNotEvaluable: true,
              dependencyPageKeys: [validDependency, secret],
              unverifiableDependencyPageKeys: [validDependency, secret],
            },
          },
        },
      },
      versions: [{
        versionKey: secret,
        occurrenceKey: secret,
        inputHash: secret,
        production: {
          deploymentId: secret,
          precision: secret,
          source: secret,
        },
      }],
      endDate: '2026-08-03',
    });

    expect(lineage.lastObservedDeployment).toEqual(expect.objectContaining({
      deploymentId: null,
      precision: 'unknown',
      source: 'unknown',
    }));
    expect(lineage.timeline[0]).toEqual(expect.objectContaining({
      versionKey: null,
      occurrenceKey: null,
      inputHash: null,
      deploymentId: null,
      precision: 'unknown',
      source: 'unknown',
    }));
    expect(lineage.detectorStates.internal_link).toEqual(expect.objectContaining({
      versionKey: null,
      occurrenceKey: null,
      productionPrecision: 'unknown',
      productionSource: 'unknown',
    }));
    expect(lineage.currentVersion.fingerprintEvidence).toEqual({
      source: 'manifest_only',
      prerenderedAvailable: false,
      limitations: ['client_only_runtime_content_not_observed'],
      statuses: { title: 'complete' },
    });
    expect(lineage.currentVersion.gitCandidate).toEqual(expect.objectContaining({
      status: 'unavailable',
      scope: 'unavailable',
      confidence: 'unavailable',
      changeTypes: { modified: 2 },
      areas: { frontend: 2 },
      candidateSignals: ['rendered_application_source_changed'],
    }));
    expect(lineage.detectorStates.internal_link.dependencyPageKeys).toEqual([validDependency]);
    expect(lineage.detectorStates.internal_link.unverifiableDependencyPageKeys).toEqual([validDependency]);
    expect(lineage.detectorStates.internal_link.cooldown.unverifiableDependencyPageKeys)
      .toEqual([validDependency]);
    expect(JSON.stringify(lineage)).not.toContain(secret);
  });
});
