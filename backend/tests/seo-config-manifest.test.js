'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SeoPageDailyMetric = require('../models/SeoPageDailyMetric');
const SeoPageDeviceDailyMetric = require('../models/SeoPageDeviceDailyMetric');
const SeoPage = require('../models/SeoPage');
const SeoPageAssessment = require('../models/SeoPageAssessment');
const SeoPageVersion = require('../models/SeoPageVersion');
const SeoSyncRun = require('../models/SeoSyncRun');
const SeoQueryPageDailyMetric = require('../models/SeoQueryPageDailyMetric');
const { getSeoRuntimeConfig } = require('../services/seo/config');
const { dateKeyInTimezone, finalizedDateKey } = require('../services/seo/dates');
const {
  buildInternalLinkMetadata,
  componentHashesForManifestPage,
  derivePageLineage,
  deriveChangeTracking,
  fetchProductionBuildMarker,
  internalLinkGraphDependencies,
  materialHashForPage,
  normalizeManifest,
  normalizeProductionMarker,
} = require('../services/seo/manifest');
const { SEO_STORAGE_COLLECTIONS, normalizeSliceRows } = require('../services/seo/metrics-store');
const { pageKeyForUrl } = require('../services/seo/keys');
const { cooldownForDetector } = require('../services/seo/assessment');

describe('SEO runtime and retention configuration', () => {
  test('requires an explicit storage budget before declaring GSC configured', () => {
    const base = {
      SEO_DASHBOARD_ENABLED: 'true',
      GSC_SITE_URL: 'sc-domain:frontendatlas.com',
      GSC_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'gsc@example.test', private_key: 'key' }),
    };
    expect(getSeoRuntimeConfig(base)).toEqual(expect.objectContaining({ configured: false, storageBudgetBytes: null }));
    expect(getSeoRuntimeConfig({ ...base, SEO_STORAGE_BUDGET_BYTES: String(128 * 1024 * 1024) }))
      .toEqual(expect.objectContaining({ configured: true, cronSecretPresent: false, datesPerRun: 30 }));
    expect(getSeoRuntimeConfig({
      ...base,
      SEO_STORAGE_BUDGET_BYTES: String(128 * 1024 * 1024),
      GSC_INITIAL_BACKFILL_DAYS: '180',
      GSC_MAX_BACKFILL_DAYS: '90',
    })).toEqual(expect.objectContaining({ initialBackfillDays: 90, maximumBackfillDays: 90 }));
  });

  test('uses the Search Console Pacific date boundary', () => {
    const instant = new Date('2026-08-07T01:00:00.000Z');
    expect(dateKeyInTimezone(instant, 'America/Los_Angeles')).toBe('2026-08-06');
    expect(finalizedDateKey(instant, 3)).toBe('2026-08-03');
  });

  test('does not persist CTR and applies TTL only to detailed facts', () => {
    expect(SeoPageDailyMetric.schema.path('ctr')).toBeUndefined();
    expect(SeoQueryPageDailyMetric.schema.path('ctr')).toBeUndefined();
    expect(SeoPageDeviceDailyMetric.schema.path('ctr')).toBeUndefined();
    expect(SeoPageDailyMetric.schema.indexes().some(([, options]) => options.expireAfterSeconds === 0)).toBe(false);
    expect(SeoQueryPageDailyMetric.schema.indexes().some(([, options]) => options.expireAfterSeconds === 0)).toBe(true);
    expect(SeoPageDeviceDailyMetric.schema.indexes().some(([, options]) => options.expireAfterSeconds === 0)).toBe(true);
    expect(SEO_STORAGE_COLLECTIONS).toContain('seo_page_assessments');
    expect(SEO_STORAGE_COLLECTIONS).toContain('seo_page_versions');
    expect(SEO_STORAGE_COLLECTIONS).toContain('seo_opportunity_reviews');
  });

  test('uses one manifest-aligned identity for FrontendAtlas trailing-slash metric rows', () => {
    const canonical = 'https://frontendatlas.com/guides/example';
    const withSlash = `${canonical}/`;
    expect(pageKeyForUrl(withSlash)).toBe(pageKeyForUrl(canonical));
    expect(pageKeyForUrl(`${canonical}?source=gsc`)).not.toBe(pageKeyForUrl(canonical));
    expect(pageKeyForUrl('https://example.com/page/')).not.toBe(pageKeyForUrl('https://example.com/page'));

    const [row] = normalizeSliceRows({
      slice: 'page', siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', generation: 'test-generation',
      rows: [{ keys: [withSlash], clicks: 1, impressions: 10, position: 3 }],
    });
    expect(row).toEqual(expect.objectContaining({ canonicalUrl: canonical, pageKey: pageKeyForUrl(canonical) }));
  });

  test('packages the manifest, allows a 300s function, and schedules UTC cron jobs', () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8'));
    expect(config.functions['api/**/*.js']).toEqual(expect.objectContaining({ includeFiles: 'content/**', maxDuration: 300 }));
    expect(config.crons).toEqual(expect.arrayContaining([
      { path: '/api/internal/seo/daily-sync', schedule: '15 4 * * *' },
      { path: '/api/internal/seo/weekly-digest', schedule: '0 6 * * 1' },
    ]));
  });
});

describe('SEO manifest normalization', () => {
  const page = (pathname, overrides = {}) => ({
    pageKey: require('../services/seo/keys').pageKeyForUrl(`https://frontendatlas.com${pathname}`),
    canonicalUrl: `https://frontendatlas.com${pathname}`,
    path: pathname,
    family: 'guide',
    tech: 'javascript',
    indexable: true,
    outboundLinks: [],
    ...overrides,
  });

  test('validates property/key identity and excludes self/existing links from donor candidates', () => {
    const normalized = normalizeManifest({
      version: 'seo-page-manifest.v1',
      property: 'sc-domain:frontendatlas.com',
      pages: [
        page('/a', { outboundLinks: ['/a', '/b'] }),
        page('/b'),
        page('/c'),
      ],
    }, 'sc-domain:frontendatlas.com');
    const links = buildInternalLinkMetadata(normalized.pages);
    expect(links.get(page('/b').pageKey).inboundCount).toBe(1);
    expect(links.get(page('/b').pageKey).donorPageKeys).not.toContain(page('/a').pageKey);
    expect(links.get(page('/b').pageKey).donorPageKeys).toContain(page('/c').pageKey);
    expect(() => normalizeManifest({ version: 'seo-page-manifest.v1', property: 'other', pages: [] }, 'sc-domain:frontendatlas.com'))
      .toThrow('property does not match');
  });

  test('rejects a tampered generated manifest when its retained source hash no longer matches', () => {
    const unsigned = {
      version: 'seo-page-manifest.v1',
      property: 'sc-domain:frontendatlas.com',
      fingerprintVersion: 'seo-page-fingerprints.v2',
      provenanceVersion: 'seo-build-provenance.v1',
      pages: [page('/source-hash', { title: 'Original title' })],
    };
    const sourceHash = normalizeManifest(unsigned, unsigned.property).sourceHash;
    const generated = { ...unsigned, sourceHash };

    expect(normalizeManifest(generated, unsigned.property).sourceHash).toBe(sourceHash);
    expect(() => normalizeManifest({
      ...generated,
      pages: [{ ...generated.pages[0], title: 'Tampered title' }],
    }, unsigned.property)).toThrow('source hash does not match its content');
  });

  test('attributes internal-link graph changes to target-specific edge evidence', () => {
    const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
    const source = page('/source', {
      outboundLinks: ['/target-b', '/target-c'],
      componentHashes: { internalLinks: hash('source-fallback') },
      internalLinkEdges: [
        { route: '/target-b', hash: hash('edge-b') },
        { route: '/target-c', hash: hash('edge-c') },
      ],
    });
    const targetB = page('/target-b');
    const targetC = page('/target-c');
    const first = buildInternalLinkMetadata([source, targetB, targetC]);
    const unrelatedAnchorEdit = buildInternalLinkMetadata([{
      ...source,
      internalLinkEdges: [
        { route: '/target-b', hash: hash('edge-b') },
        { route: '/target-c', hash: hash('edge-c-changed') },
      ],
    }, targetB, targetC]);
    expect(unrelatedAnchorEdit.get(targetB.pageKey).graphHash).toBe(first.get(targetB.pageKey).graphHash);
    expect(unrelatedAnchorEdit.get(targetC.pageKey).graphHash).not.toBe(first.get(targetC.pageKey).graphHash);
    expect(first.get(targetB.pageKey).sourceEvidence).toEqual([
      expect.objectContaining({ pageKey: source.pageKey, linkHash: hash('edge-b'), precision: 'target_edge' }),
    ]);
  });

  test('classifies added, changed, removed, and removed-source link dependencies for recrawl', () => {
    const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
    const active = new Set(['source-added', 'source-changed', 'source-removed']);
    const inspectable = new Set(active);
    const result = internalLinkGraphDependencies([
      { pageKey: 'source-changed', linkHash: hash('old') },
      { pageKey: 'source-removed', linkHash: hash('removed') },
      { pageKey: 'source-deleted', linkHash: hash('deleted') },
    ], [
      { pageKey: 'source-added', linkHash: hash('added') },
      { pageKey: 'source-changed', linkHash: hash('new') },
    ], { activePageKeys: active, inspectableSourcePageKeys: inspectable });

    expect(result.inspectableDependencyPageKeys).toEqual([
      'source-added', 'source-changed', 'source-removed',
    ]);
    expect(result.unverifiableDependencyPageKeys).toEqual(['source-deleted']);
  });

  test('seeds material tracking idempotently without making old content look newly changed', () => {
    const now = new Date('2026-08-07T12:00:00.000Z');
    const oldPage = page('/old', {
      title: 'Old page', description: 'Stable', h1: 'Old page', updatedAt: undefined,
      contentUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const baseline = deriveChangeTracking(null, oldPage, now);
    expect(baseline).toEqual(expect.objectContaining({
      materialHash: materialHashForPage(oldPage),
      baselineSeededAt: now,
      materialChangedAt: null,
      materialChangeKind: 'baseline',
      changedFields: [],
      crawlConfirmationRequired: false,
    }));

    const repeated = deriveChangeTracking({ ...oldPage, changeTracking: baseline }, oldPage, new Date('2026-08-08T12:00:00.000Z'));
    expect(repeated.baselineSeededAt).toEqual(now);
    expect(repeated.materialChangedAt).toBeNull();
    expect(repeated.crawlConfirmationRequired).toBe(false);
  });

  test('uses a recent declared content date for cooldown and does not reset a detected metadata change', () => {
    const now = new Date('2026-08-07T12:00:00.000Z');
    const recentPage = page('/recent', {
      title: 'Original', description: 'Description', h1: 'Heading',
      contentUpdatedAt: new Date('2026-08-03T00:00:00.000Z'),
    });
    const recent = deriveChangeTracking(null, recentPage, now);
    expect(recent).toEqual(expect.objectContaining({
      materialChangedAt: new Date('2026-08-03T00:00:00.000Z'),
      materialChangeKind: 'content',
      changedFields: ['contentUpdatedAt'],
      crawlConfirmationRequired: true,
    }));

    const changedPage = { ...recentPage, title: 'Changed title' };
    const changed = deriveChangeTracking({ ...recentPage, changeTracking: recent }, changedPage, now);
    expect(changed).toEqual(expect.objectContaining({
      materialChangedAt: now,
      materialChangeKind: 'metadata',
      changedFields: ['title'],
      crawlConfirmationRequired: true,
    }));
    const repeated = deriveChangeTracking(
      { ...changedPage, changeTracking: changed },
      changedPage,
      new Date('2026-08-10T12:00:00.000Z')
    );
    expect(repeated.materialChangedAt).toEqual(now);

    const staleDeclaredAdvance = {
      ...changedPage,
      contentUpdatedAt: new Date('2026-08-04T00:00:00.000Z'),
    };
    const preservedMetadataChange = deriveChangeTracking(
      { ...changedPage, changeTracking: changed },
      staleDeclaredAdvance,
      new Date('2026-08-10T12:00:00.000Z')
    );
    expect(preservedMetadataChange).toEqual(expect.objectContaining({
      materialHash: materialHashForPage(staleDeclaredAdvance),
      materialChangedAt: now,
      materialChangeKind: 'metadata',
      changedFields: ['title'],
      crawlConfirmationRequired: true,
    }));
  });

  test('resets cooldown only when the declared content date advances', () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    const originalPage = page('/content-date', {
      title: 'Stable title', description: 'Stable description', h1: 'Stable heading',
      contentUpdatedAt: new Date('2026-08-03T00:00:00.000Z'),
    });
    const originalTracking = {
      materialHash: materialHashForPage(originalPage),
      baselineSeededAt: new Date('2026-07-01T00:00:00.000Z'),
      materialChangedAt: new Date('2026-08-03T00:00:00.000Z'),
      materialChangeKind: 'content',
      changedFields: ['contentUpdatedAt'],
      lastInspectionAt: new Date('2026-08-04T02:00:00.000Z'),
      lastGoogleCrawlAt: new Date('2026-08-04T01:00:00.000Z'),
      crawlConfirmationRequired: false,
    };

    const advancedPage = {
      ...originalPage,
      contentUpdatedAt: new Date('2026-08-10T00:00:00.000Z'),
    };
    const advanced = deriveChangeTracking(
      { ...originalPage, changeTracking: originalTracking }, advancedPage, now
    );
    expect(advanced).toEqual(expect.objectContaining({
      materialHash: materialHashForPage(advancedPage),
      materialChangedAt: new Date('2026-08-10T00:00:00.000Z'),
      materialChangeKind: 'content',
      changedFields: ['contentUpdatedAt'],
      crawlConfirmationRequired: true,
    }));

    const repeated = deriveChangeTracking(
      { ...advancedPage, changeTracking: advanced }, advancedPage, new Date('2026-08-13T12:00:00.000Z')
    );
    expect(repeated).toEqual(advanced);

    const regressedPage = {
      ...originalPage,
      contentUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const regressed = deriveChangeTracking(
      { ...originalPage, changeTracking: originalTracking }, regressedPage, now
    );
    expect(regressed).toEqual(expect.objectContaining({
      materialHash: materialHashForPage(regressedPage),
      materialChangedAt: originalTracking.materialChangedAt,
      materialChangeKind: originalTracking.materialChangeKind,
      changedFields: originalTracking.changedFields,
      lastInspectionAt: originalTracking.lastInspectionAt,
      lastGoogleCrawlAt: originalTracking.lastGoogleCrawlAt,
      crawlConfirmationRequired: originalTracking.crawlConfirmationRequired,
    }));

    const removedPage = { ...originalPage, contentUpdatedAt: null };
    const removed = deriveChangeTracking(
      { ...originalPage, changeTracking: originalTracking }, removedPage, now
    );
    expect(removed).toEqual(expect.objectContaining({
      materialHash: materialHashForPage(removedPage),
      materialChangedAt: originalTracking.materialChangedAt,
      materialChangeKind: originalTracking.materialChangeKind,
      changedFields: originalTracking.changedFields,
      lastInspectionAt: originalTracking.lastInspectionAt,
      lastGoogleCrawlAt: originalTracking.lastGoogleCrawlAt,
      crawlConfirmationRequired: originalTracking.crawlConfirmationRequired,
    }));
  });

  test('resets analysis invalidation on a material hash change and preserves it on identical repeats', () => {
    const seededAt = new Date('2026-08-07T12:00:00.000Z');
    const firstChangeAt = new Date('2026-08-08T12:00:00.000Z');
    const repeatedAt = new Date('2026-08-09T12:00:00.000Z');
    const secondChangeAt = new Date('2026-08-10T12:00:00.000Z');
    const originalPage = page('/analysis-invalidation', {
      title: 'Original title', description: 'Original description', h1: 'Original heading',
      contentUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const baseline = deriveChangeTracking(null, originalPage, seededAt);
    expect(baseline.analysisInvalidatedAt).toBeNull();

    const titleChangedPage = { ...originalPage, title: 'Changed title' };
    const titleChanged = deriveChangeTracking(
      { ...originalPage, changeTracking: baseline }, titleChangedPage, firstChangeAt
    );
    expect(titleChanged.analysisInvalidatedAt).toEqual(firstChangeAt);

    const repeated = deriveChangeTracking(
      { ...titleChangedPage, changeTracking: titleChanged }, titleChangedPage, repeatedAt
    );
    expect(repeated.analysisInvalidatedAt).toEqual(firstChangeAt);

    const descriptionChangedPage = { ...titleChangedPage, description: 'Changed description' };
    const descriptionChanged = deriveChangeTracking(
      { ...titleChangedPage, changeTracking: repeated }, descriptionChangedPage, secondChangeAt
    );
    expect(descriptionChanged.analysisInvalidatedAt).toEqual(secondChangeAt);
  });

  describe('detector-scoped fingerprint lineage', () => {
    const digest = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
    const componentNames = [
      'title', 'description', 'h1', 'mainContent', 'headingOutline', 'intent',
      'internalLinks', 'canonical', 'robots', 'indexability', 'structuredData',
    ];
    const lineagePage = (label = 'a', overrides = {}) => ({
      ...page('/lineage', {
        title: 'Lineage', description: 'Description', h1: 'Heading',
        targetKeyword: 'lineage', intendedIntent: 'Understand lineage', readerPromise: 'Understand lineage',
        intentSource: 'explicit', intentConfirmed: true,
      }),
      fingerprintVersion: 'seo-page-fingerprints.v1',
      fingerprintAggregate: digest(`aggregate:${label}`),
      componentHashes: Object.fromEntries(componentNames.map((name) => [name, digest(`${name}:${label}`)])),
      fingerprintEvidence: {
        source: 'prerendered_production_html', prerenderedAvailable: true, limitations: [],
        statuses: {
          title: 'complete', description: 'complete', h1: 'complete', mainContent: 'complete',
          headingOutline: 'complete', intent: 'complete', internalLinks: 'complete',
          canonical: 'complete', robots: 'complete', indexability: 'complete', structuredData: 'complete',
        },
      },
      ...overrides,
    });
    const provenance = (readyAt, deploymentId) => ({ provenance: {
      marker: {
        ready: true,
        deployment: {
          readyAt: new Date(readyAt), deploymentId, precision: 'exact', source: 'manifest_ready_at', gitSha: '',
        },
        git: {},
      },
      deployment: {},
      git: {},
    } });

    const causalLineagePage = ({
      fingerprintVersion = 'seo-page-fingerprints.v1',
      title = 'Title A',
      mainContent = 'content:stable',
      mainContentCompatibility = null,
      intentFull = 'intent-full-a',
      intentCausal = 'intent-taxonomy-a',
      structuredFull = 'structured-full-a',
      structuredCausal = 'structured-causal-a',
      structuredSchema = 'structured-schema-a',
    } = {}) => {
      const input = page('/causal-lineage', {
        title,
        description: 'Stable description',
        h1: 'Stable heading',
        targetKeyword: title.toLowerCase(),
        intendedIntent: `${title} — Stable description`,
        readerPromise: 'Stable description',
        intentSource: 'derived',
        intentConfirmed: false,
        fingerprints: {
          version: fingerprintVersion,
          aggregate: digest(`aggregate:${title}:${intentFull}:${structuredFull}`),
          seoMetadata: {
            status: 'complete',
            fields: {
              title: { hash: digest(`title:${title}`), status: 'complete' },
              description: { hash: digest('description:stable'), status: 'complete' },
              canonical: { hash: digest('canonical:stable'), status: 'complete' },
              robots: { hash: digest('robots:stable'), status: 'complete' },
              indexability: { hash: digest('indexability:stable'), status: 'complete' },
            },
          },
          mainContent: {
            hash: digest(mainContent),
            status: 'complete',
            ...(mainContentCompatibility ? { compatibility: mainContentCompatibility } : {}),
          },
          headingOutline: { hash: digest('headings:stable'), status: 'complete' },
          internalLinks: { hash: digest('links:stable'), status: 'complete' },
          intent: {
            hash: digest(intentFull),
            causalHash: digest(intentCausal),
            dependency: 'derived_from_page_metadata',
            status: 'complete',
          },
          structuredData: {
            hash: digest(structuredFull),
            causalHash: digest(structuredCausal),
            schemaHash: digest(structuredSchema),
            status: 'complete',
          },
          availability: { source: 'prerendered_production_html', prerendered: true },
        },
      });
      return {
        ...input,
        ...componentHashesForManifestPage(input, {
          fingerprintSchemaVersion: fingerprintVersion,
        }),
      };
    };

    function changedLineage(component) {
      const at = new Date('2026-08-01T00:00:00.000Z');
      const base = lineagePage('a');
      const seeded = derivePageLineage(null, base, provenance(at, 'deploy-a'), at);
      const next = {
        ...base,
        fingerprintAggregate: digest(`aggregate:${component}`),
        componentHashes: { ...base.componentHashes, [component]: digest(`${component}:b`) },
      };
      return derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        next,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-b'),
        new Date('2026-08-02T01:00:00.000Z')
      );
    }

    test('scopes main-content, title, and canonical changes without cooling a link source as its own target', () => {
      expect(changedLineage('mainContent')).toEqual(expect.objectContaining({
        changedComponents: ['mainContent'],
        affectedDetectors: ['intent_mismatch', 'content_decay', 'cannibalization'],
      }));
      expect(changedLineage('title')).toEqual(expect.objectContaining({
        changedComponents: ['title'], affectedDetectors: ['ctr_snippet'],
      }));
      expect(changedLineage('internalLinks')).toEqual(expect.objectContaining({
        changedComponents: ['internalLinks'], affectedDetectors: [],
      }));
      expect(changedLineage('canonical')).toEqual(expect.objectContaining({
        changedComponents: ['canonical'], affectedDetectors: ['technical_indexing'],
      }));
    });

    test('uses causal intent and structured-data hashes instead of metadata echoes', () => {
      const input = {
        ...page('/causal', {
          title: 'New title', description: 'New description', h1: 'Stable heading',
          targetKeyword: 'derived title', intendedIntent: 'New title — New description',
          readerPromise: 'New description', intentSource: 'derived',
        }),
        fingerprints: {
          version: 'seo-page-fingerprints.v1', aggregate: digest('aggregate-new'),
          seoMetadata: {
            status: 'complete', fields: {
              title: { hash: digest('title-new'), status: 'complete' },
              description: { hash: digest('description-new'), status: 'complete' },
              canonical: { hash: digest('canonical-stable'), status: 'complete' },
              robots: { hash: digest('robots-stable'), status: 'complete' },
              indexability: { hash: digest('indexability-stable'), status: 'complete' },
            },
          },
          mainContent: { hash: digest('content-stable'), status: 'complete' },
          headingOutline: { hash: digest('headings-stable'), status: 'complete' },
          internalLinks: { hash: digest('links-stable'), status: 'complete' },
          intent: {
            hash: digest('derived-intent-full-new'), causalHash: digest('taxonomy-stable'),
            dependency: 'derived_from_page_metadata', status: 'complete',
          },
          structuredData: {
            hash: digest('jsonld-full-new'), causalHash: digest('jsonld-causal-stable'),
            schemaHash: digest('jsonld-schema-stable'), status: 'complete',
          },
          availability: { source: 'prerendered_production_html', prerendered: true },
        },
      };
      const hashes = componentHashesForManifestPage(input, { fingerprintSchemaVersion: 'seo-page-fingerprints.v1' });
      expect(hashes.componentHashes.intent).toBe(digest('taxonomy-stable'));
      expect(hashes.componentHashes.structuredData).toBe(digest('jsonld-causal-stable'));
      expect(hashes.componentHashes.title).toBe(digest('title-new'));
    });

    test('keeps current causal changes independent while metadata-only mirrors remain title-only', () => {
      const observedAt = new Date('2026-08-01T00:00:00.000Z');
      const base = causalLineagePage();
      const seeded = derivePageLineage(
        null,
        base,
        provenance('2026-08-01T00:00:00.000Z', 'deploy-causal-a'),
        observedAt
      );
      expect(base.fingerprintHashProvenance).toEqual({
        intent: 'causal_hash',
        structuredData: 'causal_hash',
      });

      const pureMetadataMirror = causalLineagePage({
        title: 'Title B',
        intentFull: 'intent-full-b',
        structuredFull: 'structured-full-b',
      });
      const mirrored = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        pureMetadataMirror,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-mirror'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(mirrored.changedComponents).toEqual(['title']);
      expect(mirrored.affectedDetectors).toEqual(['ctr_snippet']);

      const substantiveStructuredData = causalLineagePage({
        title: 'Title B',
        intentFull: 'intent-full-b',
        structuredFull: 'structured-substantive-b',
        structuredCausal: 'structured-causal-b',
        structuredSchema: 'structured-schema-b',
      });
      const structuredChanged = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        substantiveStructuredData,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-structured'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(structuredChanged.changedComponents).toEqual(['title', 'structuredData']);
      expect(structuredChanged.affectedDetectors).toEqual(['ctr_snippet', 'technical_indexing']);

      const derivedTaxonomyChanged = causalLineagePage({
        title: 'Title B',
        intentFull: 'intent-full-b',
        intentCausal: 'intent-taxonomy-b',
        structuredFull: 'structured-full-b',
      });
      const intentChanged = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        derivedTaxonomyChanged,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-intent'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(intentChanged.changedComponents).toEqual(['title', 'intent']);
      expect(intentChanged.affectedDetectors).toEqual([
        'ctr_snippet', 'intent_mismatch', 'content_decay', 'cannibalization',
      ]);
    });

    test('retains metadata-echo suppression for legacy full-payload hashes', () => {
      const base = lineagePage('legacy-echo-a', { intentSource: 'derived' });
      const seeded = derivePageLineage(
        null,
        base,
        provenance('2026-08-01T00:00:00.000Z', 'deploy-legacy-echo-a'),
        new Date('2026-08-01T01:00:00.000Z')
      );
      const mirrored = {
        ...base,
        fingerprintAggregate: digest('legacy-echo-b'),
        componentHashes: {
          ...base.componentHashes,
          title: digest('legacy-title-b'),
          intent: digest('legacy-derived-intent-b'),
          structuredData: digest('legacy-full-jsonld-b'),
        },
      };
      const changed = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        mirrored,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-legacy-echo-b'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(changed.changedComponents).toEqual(['title']);
      expect(changed.affectedDetectors).toEqual(['ctr_snippet']);
    });

    test('uses an exact v1 compatibility hash to migrate main content to v2 without a false cooldown', () => {
      const base = causalLineagePage();
      const seeded = derivePageLineage(
        null,
        base,
        provenance('2026-08-01T00:00:00.000Z', 'deploy-v1'),
        new Date('2026-08-01T01:00:00.000Z')
      );
      const compatibility = {
        fingerprintVersion: 'seo-page-fingerprints.v1',
        normalizationProfile: 'normalized_text_semantic_markup.v1',
        hash: base.componentHashes.mainContent,
      };
      const v2 = causalLineagePage({
        fingerprintVersion: 'seo-page-fingerprints.v2',
        mainContent: 'content:v2-anchor-transparent',
        mainContentCompatibility: compatibility,
      });
      expect(v2.fingerprintCompatibility).toEqual({ mainContent: compatibility });

      const migrated = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        v2,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-v2'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(migrated.versionKey).not.toBe(seeded.versionKey);
      expect(migrated.changedComponents).toEqual([]);
      expect(migrated.affectedDetectors).toEqual([]);
      expect(migrated.tracking.trustedComponentHashes.mainContent)
        .toBe(v2.componentHashes.mainContent);

      const actualContentChange = causalLineagePage({
        fingerprintVersion: 'seo-page-fingerprints.v2',
        mainContent: 'content:v2-actually-changed',
        mainContentCompatibility: {
          ...compatibility,
          hash: digest('content:v1-actually-changed'),
        },
      });
      const changed = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        actualContentChange,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-v2-changed'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(changed.changedComponents).toEqual(['mainContent']);
      expect(changed.affectedDetectors).toEqual([
        'intent_mismatch', 'content_decay', 'cannibalization',
      ]);

      const malformedCompatibility = causalLineagePage({
        fingerprintVersion: 'seo-page-fingerprints.v2',
        mainContent: 'content:v2-anchor-transparent',
        mainContentCompatibility: { ...compatibility, untrusted: true },
      });
      expect(malformedCompatibility.fingerprintCompatibility).toEqual({});
      const malformed = derivePageLineage(
        { ...base, changeTracking: seeded.tracking },
        malformedCompatibility,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-v2-malformed'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(malformed.changedComponents).toEqual(['mainContent']);
    });

    test('does not reset on a same-content deployment and gives A→B→A a fresh occurrence identity', () => {
      const a = lineagePage('a');
      const first = derivePageLineage(
        null, a, provenance('2026-08-01T00:00:00.000Z', 'deploy-a'), new Date('2026-08-01T01:00:00.000Z')
      );
      const same = derivePageLineage(
        { ...a, changeTracking: first.tracking }, a,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-same'), new Date('2026-08-02T01:00:00.000Z')
      );
      expect(same.shouldPersistVersion).toBe(false);
      expect(same.occurrenceKey).toBe(first.occurrenceKey);
      expect(same.production.deploymentId).toBe('deploy-a');

      const b = lineagePage('b');
      const second = derivePageLineage(
        { ...a, changeTracking: first.tracking }, b,
        provenance('2026-08-03T00:00:00.000Z', 'deploy-b'), new Date('2026-08-03T01:00:00.000Z')
      );
      const reverted = derivePageLineage(
        { ...b, changeTracking: second.tracking }, a,
        provenance('2026-08-04T00:00:00.000Z', 'deploy-c'), new Date('2026-08-04T01:00:00.000Z')
      );
      expect(first.versionKey).not.toBe(a.fingerprintAggregate);
      expect(reverted.versionKey).toBe(first.versionKey);
      expect(reverted.occurrenceKey).not.toBe(first.occurrenceKey);
      expect(reverted.shouldPersistVersion).toBe(true);
    });

    test('baselines legacy migration and transient unavailable evidence without a fake material version', () => {
      const next = lineagePage('next');
      const legacy = {
        ...next,
        changeTracking: {
          fingerprintVersion: 'legacy-derived.v1',
          currentVersionKey: digest('legacy-version'),
          currentOccurrenceKey: digest('legacy-occurrence'),
          componentHashes: Object.fromEntries(componentNames.map((name) => [name, digest(`legacy:${name}`)])),
          production: { effectiveAt: new Date('2026-01-01T00:00:00.000Z'), precision: 'legacy_baseline', source: 'legacy_baseline' },
          detectors: {},
        },
      };
      const migrated = derivePageLineage(legacy, next, {}, new Date('2026-08-01T00:00:00.000Z'));
      expect(migrated.changedComponents).toEqual([]);
      expect(migrated.affectedDetectors).toEqual([]);

      const unavailable = {
        ...next,
        fingerprintAggregate: digest('transient-missing'),
        fingerprintEvidence: {
          ...next.fingerprintEvidence,
          prerenderedAvailable: false,
          statuses: { ...next.fingerprintEvidence.statuses, mainContent: 'unavailable' },
        },
        componentHashes: { ...next.componentHashes, mainContent: digest('unavailable-placeholder') },
      };
      const missing = derivePageLineage(
        { ...next, changeTracking: migrated.tracking }, unavailable, {}, new Date('2026-08-02T00:00:00.000Z')
      );
      expect(missing.versionKey).toBe(migrated.versionKey);
      expect(missing.occurrenceKey).toBe(migrated.occurrenceKey);
      expect(missing.changedComponents).toEqual([]);
      expect(missing.shouldPersistVersion).toBe(false);
      expect(missing.tracking.analysisInputHash).not.toBe(migrated.tracking.analysisInputHash);

      const availableTitleChange = derivePageLineage(
        { ...next, changeTracking: migrated.tracking },
        {
          ...unavailable,
          componentHashes: {
            ...unavailable.componentHashes,
            title: digest('proven-title-change'),
          },
        },
        provenance('2026-08-02T00:00:00.000Z', 'deploy-partial'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(availableTitleChange.versionKey).not.toBe(migrated.versionKey);
      expect(availableTitleChange.changedComponents).toEqual(['title']);
      expect(availableTitleChange.affectedDetectors).toEqual(['ctr_snippet']);

      const recovered = derivePageLineage(
        { ...unavailable, changeTracking: missing.tracking },
        next,
        provenance('2026-08-03T00:00:00.000Z', 'deploy-recovered'),
        new Date('2026-08-03T01:00:00.000Z')
      );
      expect(recovered.changedComponents).toEqual([]);
      expect(recovered.shouldPersistVersion).toBe(true);
      expect(recovered.production).toEqual(expect.objectContaining({
        effectiveAt: new Date('2026-08-03T00:00:00.000Z'),
        source: 'manifest_ready_at',
      }));

      const recoveredWithChangedBody = derivePageLineage(
        { ...unavailable, changeTracking: missing.tracking },
        {
          ...next,
          fingerprintAggregate: digest('recovered-body-b'),
          componentHashes: { ...next.componentHashes, mainContent: digest('recovered-body-b') },
        },
        provenance('2026-08-03T00:00:00.000Z', 'deploy-recovered-b'),
        new Date('2026-08-03T01:00:00.000Z')
      );
      // The unavailable pass retained the last trusted body hash. Recovery
      // can therefore compare B with trusted A and use the recovery deploy as
      // a conservative production upper-bound.
      expect(recoveredWithChangedBody.changedComponents).toEqual(['mainContent']);
      expect(recoveredWithChangedBody.affectedDetectors).toEqual([
        'intent_mismatch', 'content_decay', 'cannibalization',
      ]);
    });

    test('persists an incomplete first fingerprint and upgrades missing components without a fake cooldown', () => {
      const complete = lineagePage('complete');
      const unavailable = {
        ...complete,
        fingerprintAggregate: digest('unavailable-aggregate'),
        fingerprintEvidence: {
          ...complete.fingerprintEvidence,
          prerenderedAvailable: false,
          statuses: { ...complete.fingerprintEvidence.statuses, mainContent: 'unavailable' },
        },
        componentHashes: { ...complete.componentHashes, mainContent: digest('missing-content') },
      };
      const provisional = derivePageLineage(null, unavailable, {}, new Date('2026-08-01T00:00:00.000Z'));
      expect(provisional.versionKey).toHaveLength(64);
      expect(provisional.occurrenceKey).toHaveLength(64);
      expect(provisional.changedComponents).toEqual([]);
      expect(provisional.shouldPersistVersion).toBe(true);

      const established = derivePageLineage(
        { ...unavailable, changeTracking: provisional.tracking },
        complete,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-complete'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(established.versionKey).toHaveLength(64);
      expect(established.versionKey).not.toBe(provisional.versionKey);
      expect(established.changedComponents).toEqual([]);
      expect(established.shouldPersistVersion).toBe(true);
    });

    test('keeps partial evidence detector-scoped so a later complete title change still resets CTR', () => {
      const partialHeading = lineagePage('partial-heading', {
        fingerprintEvidence: {
          ...lineagePage('partial-heading').fingerprintEvidence,
          statuses: {
            ...lineagePage('partial-heading').fingerprintEvidence.statuses,
            headingOutline: 'partial',
          },
        },
      });
      const baseline = derivePageLineage(
        null,
        partialHeading,
        provenance('2026-08-01T00:00:00.000Z', 'deploy-partial-a'),
        new Date('2026-08-01T01:00:00.000Z')
      );
      expect(baseline.versionKey).toHaveLength(64);
      expect(baseline.changedComponents).toEqual([]);

      const titleChanged = {
        ...partialHeading,
        fingerprintAggregate: digest('partial-heading-title-b'),
        componentHashes: {
          ...partialHeading.componentHashes,
          title: digest('title:b'),
        },
      };
      const changed = derivePageLineage(
        { ...partialHeading, changeTracking: baseline.tracking },
        titleChanged,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-partial-b'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(changed.changedComponents).toEqual(['title']);
      expect(changed.affectedDetectors).toEqual(['ctr_snippet']);
      expect(changed.tracking.detectors.ctr_snippet).toEqual(expect.objectContaining({
        changedComponents: ['title'],
        productionEffectiveAt: new Date('2026-08-02T00:00:00.000Z'),
      }));
      expect(changed.tracking.detectors.content_decay).toBeUndefined();

      const headingAdded = {
        ...titleChanged,
        fingerprintEvidence: {
          ...titleChanged.fingerprintEvidence,
          statuses: {
            ...titleChanged.fingerprintEvidence.statuses,
            headingOutline: 'complete',
          },
        },
        componentHashes: {
          ...titleChanged.componentHashes,
          headingOutline: digest('heading-outline:added'),
        },
      };
      const headingChange = derivePageLineage(
        { ...titleChanged, changeTracking: changed.tracking },
        headingAdded,
        provenance('2026-08-03T00:00:00.000Z', 'deploy-heading-added'),
        new Date('2026-08-03T01:00:00.000Z')
      );
      expect(headingChange.changedComponents).toEqual(['headingOutline']);
      expect(headingChange.affectedDetectors).toEqual([
        'intent_mismatch', 'content_decay', 'cannibalization',
      ]);
    });

    test('holds a metadata fallback against the last trusted hash and anchors a different recovery', () => {
      const complete = lineagePage('metadata-a');
      const baseline = derivePageLineage(
        null, complete, provenance('2026-08-01T00:00:00.000Z', 'deploy-metadata-a'),
        new Date('2026-08-01T01:00:00.000Z')
      );
      const fallback = {
        ...complete,
        fingerprintEvidence: {
          ...complete.fingerprintEvidence,
          statuses: { ...complete.fingerprintEvidence.statuses, title: 'partial' },
        },
        componentHashes: { ...complete.componentHashes, title: digest('fallback-title-b') },
      };
      const fallbackPass = derivePageLineage(
        { ...complete, changeTracking: baseline.tracking }, fallback,
        provenance('2026-08-02T00:00:00.000Z', 'deploy-metadata-fallback'),
        new Date('2026-08-02T01:00:00.000Z')
      );
      expect(fallbackPass.changedComponents).toEqual([]);
      expect(fallbackPass.tracking.componentHashes.title).toBe(complete.componentHashes.title);

      const recovered = {
        ...complete,
        fingerprintAggregate: digest('metadata-b'),
        componentHashes: { ...complete.componentHashes, title: digest('fallback-title-b') },
      };
      const recoveredPass = derivePageLineage(
        { ...fallback, changeTracking: fallbackPass.tracking }, recovered,
        provenance('2026-08-03T00:00:00.000Z', 'deploy-metadata-b'),
        new Date('2026-08-03T01:00:00.000Z')
      );
      expect(recoveredPass.changedComponents).toEqual(['title']);
      expect(recoveredPass.affectedDetectors).toEqual(['ctr_snippet']);
    });

    test('carries a real legacy cooldown into the first versioned baseline without cooling untouched pages', () => {
      const next = lineagePage('migration');
      const changedAt = new Date('2026-08-03T00:00:00.000Z');
      const crawledAt = new Date('2026-08-04T12:09:35.000Z');
      const legacyRecent = {
        ...next,
        changeTracking: {
          materialHash: materialHashForPage(next),
          materialChangedAt: changedAt,
          materialChangeKind: 'content',
          changedFields: ['contentUpdatedAt'],
          lastGoogleCrawlAt: crawledAt,
          crawlConfirmationRequired: false,
          detectors: {},
        },
      };
      const migrated = derivePageLineage(
        legacyRecent,
        next,
        provenance('2026-08-07T00:00:00.000Z', 'deploy-migration'),
        new Date('2026-08-07T01:00:00.000Z')
      );
      expect(migrated.changedComponents).toEqual([]);
      expect(migrated.tracking.detectors.ctr_snippet).toEqual(expect.objectContaining({
        legacyCooldownCarryover: true,
        productionEffectiveAt: changedAt,
        confirmedCrawlAt: crawledAt,
        crawlConfirmationRequired: false,
      }));
      expect(cooldownForDetector({
        page: { ...next, changeTracking: migrated.tracking },
        detector: 'ctr_snippet',
        endDate: '2026-08-18',
        finalizedLagDays: 3,
      })).toEqual(expect.objectContaining({
        state: 'directional',
        cleanFinalizedDays: 14,
        nextReviewDate: '2026-09-04',
      }));

      const untouched = derivePageLineage(
        { ...next, changeTracking: { materialHash: materialHashForPage(next), detectors: {} } },
        next,
        provenance('2026-08-07T00:00:00.000Z', 'deploy-untouched'),
        new Date('2026-08-07T01:00:00.000Z')
      );
      expect(Object.values(untouched.tracking.detectors).filter(Boolean)).toEqual([]);
    });

    test('keeps local changes unverified, promotes the same version with a live marker, and preserves verified redeploys', () => {
      const base = lineagePage('production-a');
      const deployedBase = derivePageLineage(
        null, base, provenance('2026-08-01T00:00:00.000Z', 'deploy-a'),
        new Date('2026-08-01T01:00:00.000Z')
      );
      const oldCrawl = new Date('2026-08-02T12:00:00.000Z');
      const titleChanged = {
        ...base,
        fingerprintAggregate: digest('production-title-b'),
        componentHashes: { ...base.componentHashes, title: digest('production-title-b') },
      };
      const localObservation = derivePageLineage(
        {
          ...base,
          changeTracking: { ...deployedBase.tracking, lastGoogleCrawlAt: oldCrawl },
        },
        titleChanged,
        {},
        new Date('2026-08-03T12:00:00.000Z')
      );
      expect(localObservation.changedComponents).toEqual(['title']);
      expect(localObservation.production).toEqual(expect.objectContaining({
        effectiveAt: null, precision: 'unknown', source: 'unknown',
      }));
      expect(localObservation.tracking.detectors.ctr_snippet).toEqual(expect.objectContaining({
        awaitingProductionEvidence: true,
        productionEffectiveAt: null,
        crawlConfirmationRequired: false,
        confirmedCrawlAt: null,
      }));

      const deployed = derivePageLineage(
        { ...titleChanged, changeTracking: localObservation.tracking },
        titleChanged,
        provenance('2026-08-04T00:00:00.000Z', 'deploy-b'),
        new Date('2026-08-04T01:00:00.000Z')
      );
      expect(deployed.changedComponents).toEqual([]);
      expect(deployed.occurrenceKey).not.toBe(localObservation.occurrenceKey);
      expect(deployed.shouldPersistVersion).toBe(true);
      expect(deployed.tracking.detectors.ctr_snippet).toEqual(expect.objectContaining({
        awaitingProductionEvidence: false,
        productionEffectiveAt: new Date('2026-08-04T00:00:00.000Z'),
        crawlConfirmationRequired: true,
        confirmedCrawlAt: null,
      }));

      const sameContentRedeploy = derivePageLineage(
        { ...titleChanged, changeTracking: deployed.tracking },
        titleChanged,
        provenance('2026-08-05T00:00:00.000Z', 'deploy-c'),
        new Date('2026-08-05T01:00:00.000Z')
      );
      expect(sameContentRedeploy.occurrenceKey).toBe(deployed.occurrenceKey);
      expect(sameContentRedeploy.production).toEqual(deployed.production);
      expect(sameContentRedeploy.shouldPersistVersion).toBe(false);
    });
  });

  test('validates production markers and bounds streamed bodies without trusting content-length', async () => {
    const sourceHash = crypto.createHash('sha256').update('source').digest('hex');
    const marker = {
      version: 'seo-build-marker.v1', sourceHash,
      fingerprintVersion: 'seo-page-fingerprints.v1', manifestVersion: 'seo-page-manifest.v1',
      deployment: {
        environment: 'production', id: 'frontend-deploy', gitSha: 'abcdef1234567',
        readyAt: null, readyAtPrecision: 'unknown',
      },
    };
    expect(normalizeProductionMarker(marker, {
      sourceHash,
      fingerprintVersion: 'seo-page-fingerprints.v1',
      manifestVersion: 'seo-page-manifest.v1',
      observedAt: new Date('2026-08-07T12:00:00.000Z'),
    })).toEqual(expect.objectContaining({
      ready: true,
      deployment: expect.objectContaining({
        deploymentId: 'frontend-deploy', precision: 'upper_bound', source: 'runtime_marker_observed',
      }),
    }));
    expect(normalizeProductionMarker({
      ...marker,
      sourceHash: crypto.createHash('sha256').update('other').digest('hex'),
    }, {
      sourceHash,
      fingerprintVersion: 'seo-page-fingerprints.v1', manifestVersion: 'seo-page-manifest.v1',
    }).reason).toBe('production_marker_source_mismatch');
    expect(normalizeProductionMarker({
      ...marker,
      deployment: { ...marker.deployment, environment: undefined },
    }, {
      sourceHash,
      fingerprintVersion: 'seo-page-fingerprints.v1', manifestVersion: 'seo-page-manifest.v1',
    }).reason).toBe('production_marker_not_production');

    const oversized = new Uint8Array(33 * 1024);
    let read = false;
    await expect(fetchProductionBuildMarker({
      fetchImpl: async () => ({
        ok: true,
        headers: { get: () => null },
        body: { getReader: () => ({
          read: async () => read ? { done: true } : (read = true, { done: false, value: oversized }),
          cancel: async () => {},
        }) },
      }),
    })).rejects.toThrow('too large');
  });

  test('declares compact latest-only assessment and persisted analysis contracts', () => {
    expect(SeoPage.schema.path('changeTracking.materialHash')).toBeDefined();
    expect(SeoPage.schema.path('changeTracking.analysisInvalidatedAt')).toBeDefined();
    expect(SeoPage.schema.path('changeTracking.lastGoogleCrawlAt')).toBeDefined();
    expect(SeoPage.schema.path('changeTracking.currentOccurrenceKey')).toBeDefined();
    expect(SeoPageVersion.schema.indexes()).toEqual(expect.arrayContaining([
      [{ siteUrl: 1, pageKey: 1, occurrenceKey: 1 }, expect.objectContaining({ unique: true })],
    ]));
    expect(SeoSyncRun.schema.path('analysis.status').enumValues).toEqual([
      'running', 'not_ready', 'partial', 'complete', 'failed',
    ]);
    expect(SeoPageAssessment.schema.path('primaryState').enumValues).toEqual([
      'not_evaluable', 'clear', 'watch', 'actionable',
    ]);
    expect(SeoPageAssessment.schema.indexes()).toEqual(expect.arrayContaining([
      [{ siteUrl: 1, pageKey: 1 }, expect.objectContaining({ unique: true })],
    ]));
  });
});
