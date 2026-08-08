'use strict';

const { sha256 } = require('../services/seo/keys');
const {
  buildCannibalizationSignals,
  cannibalizationSignalsByPage,
} = require('../services/seo/cannibalization');

function queryKey(label) {
  return sha256(`test-query:${label}`);
}

function weeklyRows(cluster, pageA, pageB, pairs, rawQuery = undefined) {
  return pairs.flatMap(([first, second], index) => [
    { queryKey: cluster, pageKey: pageA, week: `2026-W${index + 1}`, impressions: first, query: rawQuery },
    { queryKey: cluster, pageKey: pageB, week: `2026-W${index + 1}`, impressions: second, query: rawQuery },
  ]);
}

describe('buildCannibalizationSignals', () => {
  test.each([
    ['one weekly leader', [[30, 10], [30, 10], [30, 10], [30, 10]]],
    ['fewer than three shared weeks', [[40, 20], [10, 40]]],
    ['fewer than 100 top-two impressions', [[20, 10], [10, 20], [15, 15]]],
    ['second URL below 20% share', [[50, 1], [50, 1], [1, 18]]],
  ])('rejects %s', (_case, pairs) => {
    const rows = weeklyRows(queryKey(_case), 'page-a', 'page-b', pairs);
    expect(buildCannibalizationSignals(rows)).toEqual(new Map());
  });

  test('emits a signal only when two URLs alternate leadership across three shared weeks', () => {
    const cluster = queryKey('valid');
    const rows = weeklyRows(cluster, 'page-a', 'page-b', [[40, 20], [10, 30], [40, 20]]);

    expect(buildCannibalizationSignals(rows)).toEqual(new Map([
      ['page-a', {
        clusterKey: cluster,
        secondPageKey: 'page-b',
        clusterImpressions: 160,
        secondUrlImpressionShare: 70 / 160,
        alternatingWeeks: 3,
      }],
    ]));
  });

  test('keeps the highest-impact cluster for each dominant page', () => {
    const lowerImpact = queryKey('lower-impact');
    const higherImpact = queryKey('higher-impact');
    const rows = [
      ...weeklyRows(lowerImpact, 'page-a', 'page-b', [[40, 20], [10, 30], [40, 20]]),
      ...weeklyRows(higherImpact, 'page-a', 'page-c', [[80, 30], [20, 60], [80, 30]]),
    ];

    const signal = buildCannibalizationSignals(rows).get('page-a');
    expect(signal).toEqual(expect.objectContaining({
      clusterKey: higherImpact,
      secondPageKey: 'page-c',
      clusterImpressions: 300,
      secondUrlImpressionShare: 0.4,
    }));
  });

  test('never carries raw query text into a signal', () => {
    const cluster = queryKey('private-query');
    const rawQuery = 'private user search text';
    const result = buildCannibalizationSignals(
      weeklyRows(cluster, 'page-a', 'page-b', [[40, 20], [10, 30], [40, 20]], rawQuery)
    );

    const serialized = JSON.stringify(Array.from(result.entries()));
    expect(serialized).not.toContain(rawQuery);
    expect(serialized).not.toContain('"query"');
    expect(result.get('page-a').clusterKey).toBe(cluster);
  });
});

describe('cannibalizationSignalsByPage', () => {
  test('queries active non-brand generations for the requested range with bounded disk-backed aggregation', async () => {
    const cluster = queryKey('pipeline');
    const aggregateResult = weeklyRows(cluster, 'page-a', 'page-b', [[40, 20], [10, 30], [40, 20]])
      .map(({ queryKey: key, pageKey, week, impressions }) => ({
        _id: { queryKey: key, pageKey, week },
        impressions,
      }));
    const aggregate = {
      allowDiskUse: jest.fn(function allowDiskUse() { return this; }),
      option: jest.fn(function option() { return this; }),
      exec: jest.fn(async () => aggregateResult),
    };
    const metricModel = { aggregate: jest.fn(() => aggregate) };

    const result = await cannibalizationSignalsByPage({
      siteUrl: 'sc-domain:frontendatlas.com',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      metricModel,
      maxRows: 500000,
      maxTimeMs: 999999,
    });

    expect(result.has('page-a')).toBe(true);
    expect(aggregate.allowDiskUse).toHaveBeenCalledWith(true);
    expect(aggregate.option).toHaveBeenCalledWith({ maxTimeMS: 60000 });

    const pipeline = metricModel.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({
      $match: {
        siteUrl: 'sc-domain:frontendatlas.com',
        segment: 'nonbrand',
        date: { $gte: '2026-07-01', $lte: '2026-07-31' },
      },
    });
    expect(pipeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        $lookup: expect.objectContaining({ from: 'seo_metric_partitions' }),
      }),
      { $match: { '_activePartition.0': { $exists: true } } },
      { $limit: 250000 },
    ]));
    const lookup = pipeline.find((stage) => stage.$lookup).$lookup;
    expect(JSON.stringify(lookup.pipeline)).toContain('activeGeneration');
    expect(JSON.stringify(lookup.pipeline)).toContain('metricGeneration');
    const projection = pipeline.find((stage) => stage.$project).$project;
    expect(projection).toEqual(expect.objectContaining({ queryKey: 1, pageKey: 1, impressions: 1 }));
    expect(projection).not.toHaveProperty('query');
    const group = pipeline.find((stage) => stage.$group).$group;
    expect(group._id).toEqual({ queryKey: '$queryKey', pageKey: '$pageKey', week: '$week' });
  });
});
