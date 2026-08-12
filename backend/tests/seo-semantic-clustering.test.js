'use strict';

const {
  DEFAULT_MAX_QUERIES,
  SEMANTIC_CLUSTER_VERSION,
  buildSemanticClusters,
  classifyFacet,
  dominantSemanticCluster,
  normalizeTokens,
  weightedSimilarity,
} = require('../services/seo/semantic-clustering');
const { SEMANTIC_QUERY_CAP, semanticCannibalizationByPage } = require('../services/seo/analysis');
const { EXAMPLE_CLUSTER_QUERY_CAP } = require('../services/seo/opportunity-api');

describe('deterministic semantic query clustering', () => {
  test('merges cancel/abort/unsubscribe variants and retains intent facets', () => {
    const result = buildSemanticClusters({
      currentRows: [
        { query: 'angular httpclient unsubscribe docs', clicks: 0, impressions: 469, position: 6.7 },
        { query: 'does angular httpclient unsubscribe cancel request', clicks: 0, impressions: 262, position: 4.9 },
        { query: 'how to abort angular http request', clicks: 0, impressions: 18, position: 5 },
      ],
      previousRows: [
        { query: 'angular http request cancellation official documentation', clicks: 0, impressions: 500, position: 7 },
        { query: 'does unsubscribe abort angular requests', clicks: 0, impressions: 300, position: 5 },
      ],
      pageIntent: 'Angular HttpClient cancellation unsubscribe requests',
      pageTech: 'angular',
      pageCurrentImpressions: 2519,
      pagePreviousImpressions: 3156,
    });
    expect(result.version).toBe(SEMANTIC_CLUSTER_VERSION);
    expect(result.clusters).toHaveLength(1);
    const cluster = dominantSemanticCluster(result);
    expect(cluster.current.impressions).toBe(749);
    expect(cluster.previous.impressions).toBe(800);
    expect(cluster.topicAlignment).toBeGreaterThanOrEqual(0.9);
    expect(cluster.sourcePreferenceShare).toBeCloseTo(469 / 749);
    expect(cluster.facets.map((row) => row.facet)).toEqual(expect.arrayContaining([
      'official_reference', 'direct_answer', 'implementation',
    ]));
    expect(result.pageQueryCoverage.current).toBeCloseTo(749 / 2519);
    expect(JSON.stringify(result)).not.toContain('does angular httpclient unsubscribe cancel request');
  });

  test('keeps incompatible technologies in separate clusters', () => {
    const result = buildSemanticClusters({
      currentRows: [
        { query: 'angular cancel http request', impressions: 100 },
        { query: 'react cancel http request', impressions: 100 },
      ],
      pageIntent: 'cancel an HTTP request',
      pageCurrentImpressions: 250,
    });
    expect(result.clusters).toHaveLength(2);
    expect(result.clusters.map((cluster) => cluster.tech).sort()).toEqual(['angular', 'react']);
  });

  test('uses one cluster key for current/prior metrics and reports truncated processing coverage', () => {
    const result = buildSemanticClusters({
      currentRows: [
        { query: 'angular cancel request', impressions: 90 },
        { query: 'unrelated alternate topic', impressions: 10 },
      ],
      previousRows: [{ query: 'angular abort request', impressions: 50 }],
      pageIntent: 'angular cancel request',
      pageTech: 'angular',
      pageCurrentImpressions: 80,
      pagePreviousImpressions: 100,
      maxQueries: 2,
    });
    expect(result.currentSemanticCoverage).toBe(0.9);
    expect(result.pageQueryCoverage).toEqual(expect.objectContaining({
      current: 1.25,
      currentStatus: 'inconsistent',
    }));
    expect(result.clusters[0]).toEqual(expect.objectContaining({
      current: expect.objectContaining({ impressions: 90 }),
      previous: expect.objectContaining({ impressions: 50 }),
    }));
  });

  test('uses the shared 500-query cap so evidence beyond the old 250-row boundary is reproducible', () => {
    const rows = Array.from({ length: 300 }, (_, index) => ({
      queryKey: `query-${index}`,
      query: `react isolated topic token${index}`,
      impressions: 1,
    }));
    const result = buildSemanticClusters({
      currentRows: rows,
      pageIntent: 'react topic',
      pageTech: 'react',
      pageCurrentImpressions: rows.length,
    });

    expect(SEMANTIC_QUERY_CAP).toBe(DEFAULT_MAX_QUERIES);
    expect(EXAMPLE_CLUSTER_QUERY_CAP).toBe(DEFAULT_MAX_QUERIES);
    expect(DEFAULT_MAX_QUERIES).toBe(500);
    expect(result.processedImpressions.current).toBe(300);
    expect(result.currentSemanticCoverage).toBe(1);
  });

  test('normalization and similarity are deterministic and facet-aware', () => {
    expect(normalizeTokens('HTTP Client unsubscribed')).toEqual(['http', 'cancel']);
    expect(classifyFacet('Angular official documentation')).toBe('official_reference');
    expect(classifyFacet('How to abort a request')).toBe('implementation');
    expect(weightedSimilarity(['angular', 'cancel'], ['angular', 'cancel', 'request']))
      .toEqual({ containment: 1, jaccard: 2 / 3, sharedTokenCount: 2 });
  });

  test('carries semantic membership into persistent cross-page competition without raw queries', () => {
    const clusterKey = 'a'.repeat(64);
    const semanticByPage = new Map([
      ['page-a', {
        pageQueryCoverage: { current: 0.9, currentStatus: 'consistent' },
        currentSemanticCoverage: 0.95,
        clusters: [{ clusterKey, current: { impressions: 200 }, memberQueryKeys: ['query-a'] }],
      }],
      ['page-b', {
        pageQueryCoverage: { current: 0.9, currentStatus: 'consistent' },
        currentSemanticCoverage: 0.95,
        clusters: [{ clusterKey, current: { impressions: 200 }, memberQueryKeys: ['query-b'] }],
      }],
    ]);
    const queryRowsByPage = new Map([
      ['page-a', { currentRows: [{ queryKey: 'query-a', weeklyImpressions: [60, 40, 60, 40] }] }],
      ['page-b', { currentRows: [{ queryKey: 'query-b', weeklyImpressions: [40, 60, 40, 60] }] }],
    ]);

    expect(semanticCannibalizationByPage(semanticByPage, queryRowsByPage).get('page-a'))
      .toEqual(expect.objectContaining({
        clusterKey,
        secondPageKey: 'page-b',
        alternatingWeeks: 4,
        semantic: true,
      }));
  });

  test('marks cross-page competition unsafe when the second top page lacks decision-grade coverage', () => {
    const clusterKey = 'b'.repeat(64);
    const semanticByPage = new Map([
      ['page-a', {
        pageQueryCoverage: { current: 0.9, currentStatus: 'consistent' },
        currentSemanticCoverage: 0.95,
        clusters: [{ clusterKey, current: { impressions: 240 }, memberQueryKeys: ['query-a'] }],
      }],
      ['page-b', {
        pageQueryCoverage: { current: 0.5, currentStatus: 'consistent' },
        currentSemanticCoverage: 0.95,
        clusters: [{ clusterKey, current: { impressions: 160 }, memberQueryKeys: ['query-b'] }],
      }],
    ]);
    const queryRowsByPage = new Map([
      ['page-a', { currentRows: [{ queryKey: 'query-a', weeklyImpressions: [60, 60, 60, 60] }] }],
      ['page-b', { currentRows: [{ queryKey: 'query-b', weeklyImpressions: [40, 40, 40, 40] }] }],
    ]);

    const signals = semanticCannibalizationByPage(semanticByPage, queryRowsByPage);
    expect(signals.get('page-a'))
      .toEqual(expect.objectContaining({
        clusterKey,
        secondPageKey: 'page-b',
        semantic: true,
        coverageUnsafe: true,
      }));
    expect(signals.get('page-b')).toEqual(expect.objectContaining({
      clusterKey,
      secondPageKey: 'page-a',
      semantic: true,
      coverageUnsafe: true,
    }));
  });
});
