'use strict';

const {
  captureLiveMetadataSnapshot,
  compareMetadataSnapshots,
  inspectUrlCandidates,
  metadataHash,
  parseLiveMetadata,
  persistInspectionPageState,
  resolveInternalLinkSourceRecrawls,
  sanitizeInspectionResult,
} = require('../services/seo/diagnostics');
const { orderInspectionCandidates } = require('../services/seo/sync');

function headers(values = {}) {
  const normalized = Object.fromEntries(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (name) => normalized[String(name).toLowerCase()] ?? null };
}

function htmlResponse(html, { status = 200, extraHeaders = {} } = {}) {
  const bytes = Buffer.from(html);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headers({ 'content-type': 'text/html; charset=utf-8', ...extraHeaders }),
    arrayBuffer: async () => bytes,
  };
}

function redirectResponse(location) {
  return {
    ok: false,
    status: 302,
    headers: headers({ location }),
  };
}

describe('SEO live metadata diagnostics', () => {
  test('parses only bounded metadata fields and ignores executable/template content', () => {
    const fields = parseLiveMetadata(`
      <html><head>
        <script><title>Leaked script title</title><h1>Leaked script H1</h1></script>
        <title> Safe &amp; useful </title>
        <meta content="A focused &quot;description&quot;" name="description">
        <meta name="robots" content="index, follow">
        <link href="https://frontendatlas.com/guides/test" rel="alternate canonical">
      </head><body><h1>Real <span>heading</span></h1></body></html>
    `);

    expect(fields).toEqual({
      title: 'Safe & useful',
      description: 'A focused "description"',
      h1: 'Real heading',
      canonical: 'https://frontendatlas.com/guides/test',
      robots: 'index, follow',
    });
    expect(JSON.stringify(fields)).not.toContain('Leaked');
  });

  test('captures a deterministic snapshot after same-origin redirects', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(redirectResponse('/final'))
      .mockResolvedValueOnce(htmlResponse('<title>Final</title><h1>Page</h1>'));
    const observedAt = new Date('2026-08-07T10:00:00.000Z');

    const snapshot = await captureLiveMetadataSnapshot('https://frontendatlas.com/start#fragment', {
      fetchImpl,
      now: () => observedAt,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(1, 'https://frontendatlas.com/start', expect.objectContaining({ redirect: 'manual' }));
    expect(fetchImpl).toHaveBeenNthCalledWith(2, 'https://frontendatlas.com/final', expect.objectContaining({ redirect: 'manual' }));
    expect(snapshot).toEqual(expect.objectContaining({
      url: 'https://frontendatlas.com/start',
      finalUrl: 'https://frontendatlas.com/final',
      observedAt,
      fields: expect.objectContaining({ title: 'Final', h1: 'Page' }),
    }));
    expect(snapshot.hash).toBe(metadataHash(snapshot.fields));
    expect(snapshot.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('rejects initial and redirect URLs that leave the production origin', async () => {
    const unusedFetch = jest.fn();
    await expect(captureLiveMetadataSnapshot('https://example.com/secret', { fetchImpl: unusedFetch }))
      .rejects.toMatchObject({ code: 'INVALID_URL', message: 'The live metadata URL is not allowed.' });
    expect(unusedFetch).not.toHaveBeenCalled();

    const redirectFetch = jest.fn().mockResolvedValue(redirectResponse('https://attacker.example/collect'));
    await expect(captureLiveMetadataSnapshot('https://frontendatlas.com/start', { fetchImpl: redirectFetch }))
      .rejects.toMatchObject({ code: 'REDIRECT_NOT_ALLOWED' });
    expect(redirectFetch).toHaveBeenCalledTimes(1);
  });

  test('stops before consuming a response declared above the byte limit', async () => {
    const body = jest.fn(async () => Buffer.from('not read'));
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: headers({ 'content-type': 'text/html', 'content-length': '4096' }),
      arrayBuffer: body,
    });

    await expect(captureLiveMetadataSnapshot('https://frontendatlas.com/', { fetchImpl, maxBytes: 1024 }))
      .rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    expect(body).not.toHaveBeenCalled();
  });

  test('bounds a streamed body even without content-length', async () => {
    async function* body() {
      yield Buffer.alloc(800, 65);
      yield Buffer.alloc(800, 66);
    }
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: headers({ 'content-type': 'text/html' }),
      body: body(),
    });

    await expect(captureLiveMetadataSnapshot('https://frontendatlas.com/', { fetchImpl, maxBytes: 1024 }))
      .rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
  });

  test('aborts on timeout and never exposes the underlying failure text', async () => {
    const fetchImpl = jest.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('private credential and upstream URL');
        error.name = 'AbortError';
        reject(error);
      });
    }));

    let thrown;
    try {
      await captureLiveMetadataSnapshot('https://frontendatlas.com/slow', { fetchImpl, timeoutMs: 5 });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 'REQUEST_TIMEOUT', message: 'The live metadata request timed out.' });
    expect(String(thrown)).not.toContain('credential');
    expect(String(thrown)).not.toContain('upstream');
  });

  test('redacts arbitrary network failures', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('secret-token=do-not-return'));
    await expect(captureLiveMetadataSnapshot('https://frontendatlas.com/', { fetchImpl }))
      .rejects.toMatchObject({ code: 'REQUEST_FAILED', message: 'The live metadata request failed.' });
  });
});

describe('candidate-only URL Inspection diagnostics', () => {
  function candidate(number, overrides = {}) {
    return {
      pageKey: `page-${number}`,
      canonicalUrl: `https://frontendatlas.com/page-${number}`,
      indexable: true,
      manifest: { present: true },
      impressions: 0,
      ...overrides,
    };
  }

  function snapshotModel(freshRows = []) {
    const query = {
      select: jest.fn(function select() { return this; }),
      lean: jest.fn(async () => freshRows),
    };
    return {
      find: jest.fn(() => query),
      create: jest.fn(async (documents) => documents),
      query,
    };
  }

  test('sanitizes GSC inspection output to an allowlisted shape', () => {
    const sanitized = sanitizeInspectionResult({
      inspectionResultLink: 'https://console.example/private',
      indexStatusResult: {
        verdict: 'PASS',
        coverageState: 'Submitted and indexed\n',
        robotsTxtState: 'ALLOWED',
        googleCanonical: 'https://frontendatlas.com/page-1',
        userCanonical: 'https://frontendatlas.com/page-1',
        lastCrawlTime: '2026-08-01T00:00:00Z',
        secretFutureField: 'must not persist',
      },
    }, 'https://frontendatlas.com/page-1');

    expect(sanitized).toEqual({
      indexStatus: 'PASS',
      coverageState: 'Submitted and indexed',
      robots: 'ALLOWED',
      canonicalVerdict: 'match',
      lastCrawlTime: '2026-08-01T00:00:00.000Z',
    });
    expect(JSON.stringify(sanitized)).not.toContain('console.example');
    expect(JSON.stringify(sanitized)).not.toContain('secretFutureField');
  });

  test('drops malformed crawl timestamps instead of persisting raw inspection values', () => {
    const sanitized = sanitizeInspectionResult({
      indexStatusResult: { verdict: 'PASS', lastCrawlTime: 'not-a-date\nprivate payload' },
    }, 'https://frontendatlas.com/page-1');
    expect(sanitized.lastCrawlTime).toBeUndefined();
    expect(JSON.stringify(sanitized)).not.toContain('private payload');
  });

  test('treats a trailing-slash inspection canonical as the manifest canonical', () => {
    const sanitized = sanitizeInspectionResult({
      indexStatusResult: {
        verdict: 'PASS',
        googleCanonical: 'https://frontendatlas.com/page-1/',
      },
    }, 'https://frontendatlas.com/page-1');

    expect(sanitized.canonicalVerdict).toBe('match');
  });

  test('filters to current candidates, skips fresh snapshots, and persists a 90-day sanitized snapshot', async () => {
    const model = snapshotModel([{ pageKey: 'page-1' }]);
    const client = {
      inspectUrl: jest.fn(async () => ({
        inspectionResultLink: 'https://private.example/result',
        indexStatusResult: {
          verdict: 'FAIL',
          coverageState: 'Crawled - currently not indexed',
          robotsTxtState: 'DISALLOWED',
          googleCanonical: 'https://frontendatlas.com/other',
          userCanonical: 'https://frontendatlas.com/page-2',
          privatePayload: 'credential',
        },
      })),
    };
    const now = new Date('2026-08-07T12:00:00.000Z');
    const result = await inspectUrlCandidates({
      candidates: [
        candidate(1),
        candidate(2),
        candidate(3, { impressions: 10 }),
        candidate(4, { impressions: 10, canonicalAnomaly: true }),
        candidate(5, { indexable: false }),
        candidate(6, { manifest: { present: false } }),
        candidate(7, { canonicalUrl: 'https://example.com/page-7' }),
      ],
      client,
      siteUrl: 'sc-domain:frontendatlas.com',
      snapshotModel: model,
      now: () => now,
      limit: 5,
    });

    expect(client.inspectUrl).toHaveBeenCalledTimes(2);
    expect(client.inspectUrl).toHaveBeenNthCalledWith(1, {
      siteUrl: 'sc-domain:frontendatlas.com',
      inspectionUrl: 'https://frontendatlas.com/page-2',
    });
    expect(result).toEqual(expect.objectContaining({ eligible: 3, inspected: 2, persisted: 2, skippedFresh: 1 }));
    expect(model.create).toHaveBeenCalledTimes(1);
    const persisted = model.create.mock.calls[0][0];
    expect(persisted[0]).toEqual(expect.objectContaining({
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: 'page-2',
      kind: 'urlInspection',
      observedAt: now,
      expiresAt: new Date('2026-11-05T12:00:00.000Z'),
      data: {
        indexStatus: 'FAIL',
        coverageState: 'Crawled - currently not indexed',
        robots: 'BLOCKED',
        canonicalVerdict: 'mismatch',
      },
    }));
    expect(JSON.stringify(persisted)).not.toContain('credential');
    expect(JSON.stringify(persisted)).not.toContain('private.example');
  });

  test('clamps each invocation to ten inspections and reports failures without raw errors', async () => {
    const model = snapshotModel();
    const client = {
      inspectUrl: jest.fn(async ({ inspectionUrl }) => {
        if (inspectionUrl.endsWith('/page-3')) throw new Error('secret GSC response');
        return { indexStatusResult: { verdict: 'PASS', robotsTxtState: 'ALLOWED' } };
      }),
    };

    const result = await inspectUrlCandidates({
      candidates: Array.from({ length: 15 }, (_, index) => candidate(index + 1)),
      client,
      siteUrl: 'sc-domain:frontendatlas.com',
      snapshotModel: model,
      now: () => new Date('2026-08-07T00:00:00.000Z'),
      limit: 999,
    });

    expect(client.inspectUrl).toHaveBeenCalledTimes(10);
    expect(result).toEqual(expect.objectContaining({ inspected: 10, persisted: 9 }));
    expect(result.failures).toEqual([{ pageKey: 'page-3', code: 'URL_INSPECTION_FAILED' }]);
    expect(JSON.stringify(result)).not.toContain('secret GSC response');
  });

  test('lets positive-impression technical and inspection-anomaly pages bypass the zero-visibility gate', async () => {
    const model = snapshotModel([{ pageKey: 'page-1' }]);
    const client = { inspectUrl: jest.fn(async () => ({ indexStatusResult: { verdict: 'PASS' } })) };
    const result = await inspectUrlCandidates({
      candidates: [
        candidate(1, { impressions: 25, forceInspection: true }),
        candidate(2, { impressions: 40, inspectionAnomaly: true }),
      ],
      client,
      siteUrl: 'sc-domain:frontendatlas.com',
      snapshotModel: model,
      now: () => new Date('2026-08-07T00:00:00.000Z'),
      limit: 2,
    });
    expect(result).toEqual(expect.objectContaining({ eligible: 2, inspected: 2, persisted: 2, skippedFresh: 0 }));
    expect(client.inspectUrl).toHaveBeenCalledTimes(2);
  });

  test('rotates through every never-inspected candidate before reinspecting old pages', () => {
    const candidates = Array.from({ length: 100 }, (_, index) => ({
      pageKey: `page-${String(index).padStart(3, '0')}`,
      canonicalAnomaly: false,
      latestInspection: null,
    }));
    const seen = new Set();
    const start = new Date('2026-08-01T00:00:00.000Z');
    for (let day = 0; day < 20; day += 1) {
      const now = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
      const selected = orderInspectionCandidates(candidates, { now, limit: 5 });
      expect(selected).toHaveLength(5);
      for (const candidate of selected) {
        seen.add(candidate.pageKey);
        candidate.latestInspection = { observedAt: now };
      }
    }
    expect(seen.size).toBe(100);
  });

  test('prioritizes post-change crawl confirmations ahead of the regular rotation', () => {
    const now = new Date('2026-08-07T00:00:00.000Z');
    const selected = orderInspectionCandidates([
      candidate(1, { impressions: 10, latestInspection: null }),
      candidate(2, {
        impressions: 10,
        changePending: true,
        changeTracking: { materialChangedAt: new Date('2026-08-03T00:00:00.000Z') },
        latestInspection: { observedAt: now },
      }),
      candidate(3, { impressions: 10, technicalPending: true, latestInspection: { observedAt: now } }),
      candidate(4, {
        impressions: 10, sourceDependencyPending: true, forceInspection: true,
        latestInspection: { observedAt: now },
      }),
    ], { now, limit: 3 });
    expect(selected.map((item) => item.pageKey)).toEqual(['page-2', 'page-3', 'page-4']);
  });

  test('retains sanitized crawl time and clears recrawl only after the material change', async () => {
    const query = {
      select: jest.fn(function select() { return this; }),
      lean: jest.fn(async () => [{
        pageKey: 'page-1',
        changeTracking: {
          materialChangedAt: new Date('2026-08-03T00:00:00.000Z'),
          lastInspectionAt: null,
          lastGoogleCrawlAt: new Date('2026-08-02T00:00:00.000Z'),
          crawlConfirmationRequired: true,
        },
      }]),
    };
    const pageModel = {
      find: jest.fn(() => query),
      bulkWrite: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    const observedAt = new Date('2026-08-07T12:00:00.000Z');
    await expect(persistInspectionPageState({
      snapshots: [{
        pageKey: 'page-1',
        observedAt,
        data: { lastCrawlTime: '2026-08-04T01:09:35.000Z' },
      }],
      pageModel,
    })).resolves.toBe(1);
    expect(pageModel.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { pageKey: 'page-1' },
          update: { $set: expect.objectContaining({
            'changeTracking.lastInspectionAt': observedAt,
            'changeTracking.lastGoogleCrawlAt': new Date('2026-08-04T01:09:35.000Z'),
            'changeTracking.crawlConfirmationRequired': false,
          }) },
        }),
      }),
    ], { ordered: false });
  });

  test('resolves internal-link lineage only after every changed source has a strictly later crawl', async () => {
    const effectiveAt = new Date('2026-08-04T00:00:00.000Z');
    const target = {
      pageKey: 'target',
      intent: {},
      internalLinks: { graphHash: 'a'.repeat(64) },
      changeTracking: {
        currentVersionKey: 'version', currentOccurrenceKey: 'occurrence', componentHashes: {},
        detectors: {
          internal_link: {
            versionKey: 'graph-version', productionEffectiveAt: effectiveAt,
            dependencyPageKeys: ['source-a', 'source-b'], awaitingSourceRecrawl: true,
          },
        },
      },
    };
    const queries = [
      [target],
      [
        { pageKey: 'source-a', changeTracking: { lastGoogleCrawlAt: new Date('2026-08-04T00:00:00.000Z') } },
        { pageKey: 'source-b', changeTracking: { lastGoogleCrawlAt: new Date('2026-08-05T00:00:00.000Z') } },
      ],
      [target],
      [
        { pageKey: 'source-a', changeTracking: { lastGoogleCrawlAt: new Date('2026-08-04T00:00:00.001Z') } },
        { pageKey: 'source-b', changeTracking: { lastGoogleCrawlAt: new Date('2026-08-05T00:00:00.000Z') } },
      ],
    ];
    const pageModel = {
      find: jest.fn(() => {
        const query = {
          select: jest.fn(function select() { return this; }),
          lean: jest.fn(async () => queries.shift()),
        };
        return query;
      }),
      bulkWrite: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    await expect(resolveInternalLinkSourceRecrawls({ pageModel })).resolves.toBe(0);
    expect(pageModel.bulkWrite).not.toHaveBeenCalled();
    await expect(resolveInternalLinkSourceRecrawls({
      pageModel, now: new Date('2026-08-07T00:00:00.000Z'),
    })).resolves.toBe(1);
    expect(pageModel.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: { $set: expect.objectContaining({
            'changeTracking.detectors.internal_link': expect.objectContaining({
              awaitingSourceRecrawl: false,
              confirmedCrawlAt: new Date('2026-08-05T00:00:00.000Z'),
            }),
          }) },
        }),
      }),
    ], { ordered: false });
  });
});

describe('metadata implementation snapshot comparison', () => {
  const baseFields = {
    title: 'Original title',
    description: 'Original description',
    h1: 'Original H1',
    canonical: 'https://frontendatlas.com/page',
    robots: 'index,follow',
  };

  test('returns unchanged for identical snapshots', () => {
    expect(compareMetadataSnapshots(
      { data: { hash: metadataHash(baseFields), fields: baseFields } },
      { hash: metadataHash(baseFields), fields: { ...baseFields } }
    )).toEqual({ status: 'unchanged', changedFields: [] });
  });

  test('returns the exact changed metadata fields', () => {
    expect(compareMetadataSnapshots(
      { fields: baseFields },
      { fields: { ...baseFields, title: 'Changed title', robots: 'noindex' } }
    )).toEqual({ status: 'changed', changedFields: ['title', 'robots'] });
  });

  test('returns unknown when either snapshot is incomplete or failed', () => {
    expect(compareMetadataSnapshots({ fields: baseFields }, null))
      .toEqual({ status: 'unknown', changedFields: [] });
    expect(compareMetadataSnapshots({ fields: baseFields }, { data: { status: 'failed' } }))
      .toEqual({ status: 'unknown', changedFields: [] });
  });
});
