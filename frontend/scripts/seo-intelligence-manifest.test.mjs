#!/usr/bin/env node

import assert from 'assert/strict';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BUILD_MARKER_VERSION,
  FINGERPRINT_VERSION,
  PROVENANCE_VERSION,
  buildBuildMarker,
  buildPageFingerprints,
  buildProvenance,
} from './generate-seo-intelligence-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const manifestPath = path.join(repoRoot, 'backend', 'content', 'seo', 'page-manifest.json');
const buildMarkerPath = path.join(
  frontendRoot,
  'dist',
  'frontendatlas',
  'browser',
  'seo-intelligence-build.json',
);
const sitemapPath = path.join(frontendRoot, 'src', 'sitemap.xml');
const vercelConfigPath = path.join(frontendRoot, 'vercel.json');

execFileSync(process.execPath, [path.join(scriptDir, 'generate-seo-intelligence-manifest.mjs'), '--check'], {
  cwd: frontendRoot,
  stdio: 'pipe',
});

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const buildMarkerRaw = fs.readFileSync(buildMarkerPath, 'utf8');
const buildMarker = JSON.parse(buildMarkerRaw);
const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const manifestUrls = manifest.pages.map((page) => page.canonicalUrl);

assert.equal(manifest.version, 'seo-page-manifest.v1');
assert.equal(manifest.property, 'sc-domain:frontendatlas.com');
assert.equal(manifest.fingerprintVersion, FINGERPRINT_VERSION);
assert.equal(manifest.provenanceVersion, PROVENANCE_VERSION);
assert.equal(manifest.provenance.version, PROVENANCE_VERSION);
assert.equal(manifest.provenance.git.authority, 'corroborating_only');
assert.ok(manifest.provenance.build.observedAt);
assert.equal(manifest.pages.length, sitemapUrls.length, 'manifest must cover every sitemap URL exactly once');
assert.deepEqual(new Set(manifestUrls), new Set(sitemapUrls));
assert.equal(new Set(manifest.pages.map((page) => page.pageKey)).size, manifest.pages.length);
assert.equal(buildMarker.version, BUILD_MARKER_VERSION);
assert.equal(buildMarker.manifestVersion, manifest.version);
assert.equal(buildMarker.sourceHash, manifest.sourceHash);
assert.equal(buildMarker.fingerprintVersion, manifest.fingerprintVersion);
assert.equal(buildMarker.build.observedAt, manifest.provenance.build.observedAt);
assert.equal(buildMarker.git.authority, 'corroborating_only');
assert.ok(Buffer.byteLength(buildMarkerRaw, 'utf8') <= 12 * 1024, 'build marker must stay bounded');
assert.equal('pages' in buildMarker, false, 'build marker must not duplicate page data');
assert.equal('entries' in buildMarker.git.diff, false, 'build marker must not expose Git diff entries');
assert.ok(!buildMarkerRaw.includes('pathHash'), 'build marker must not expose hashed repository paths');
const markerKeys = new Set();
const collectKeys = (value) => {
  if (Array.isArray(value)) return value.forEach(collectKeys);
  if (!value || typeof value !== 'object') return undefined;
  for (const [key, child] of Object.entries(value)) {
    markerKeys.add(key);
    collectKeys(child);
  }
  return undefined;
};
collectKeys(buildMarker);
for (const forbiddenKey of ['body', 'entries', 'pages', 'pathHash', 'queries', 'query', 'rawDiff']) {
  assert.equal(markerKeys.has(forbiddenKey), false, `build marker must not expose ${forbiddenKey}`);
}
const markerHeaderRule = vercelConfig.headers.find(
  (rule) => rule.source === '/seo-intelligence-build.json',
);
assert.ok(markerHeaderRule, 'build marker must have an explicit Vercel header rule');
const markerHeaders = Object.fromEntries(
  markerHeaderRule.headers.map((header) => [header.key.toLowerCase(), header.value.toLowerCase()]),
);
assert.ok(markerHeaders['cache-control'].includes('no-store'));
assert.equal(markerHeaders['x-robots-tag'], 'noindex, nofollow');

const paths = new Set(manifest.pages.map((page) => page.path));
for (const page of manifest.pages) {
  assert.match(page.pageKey, /^[a-f0-9]{64}$/);
  assert.equal(page.indexable, true);
  assert.ok(page.title, `missing title for ${page.path}`);
  assert.equal(typeof page.robots, 'string');
  assert.equal(typeof page.renderedCanonicalUrl, 'string');
  assert.ok(!page.path.startsWith('/admin'), `private route leaked into manifest: ${page.path}`);
  assert.ok(page.outboundLinks.every((target) => paths.has(target)), `unknown outbound target for ${page.path}`);
  assert.equal(page.fingerprints.version, FINGERPRINT_VERSION);
  assert.match(page.fingerprints.aggregate, /^[a-f0-9]{64}$/);
  assert.match(page.fingerprints.seoMetadata.hash, /^[a-f0-9]{64}$/);
  for (const field of ['title', 'description', 'canonical', 'robots', 'indexability']) {
    assert.match(page.fingerprints.seoMetadata.fields[field].hash, /^[a-f0-9]{64}$/);
    assert.ok(
      ['complete', 'partial', 'unavailable'].includes(page.fingerprints.seoMetadata.fields[field].status),
      `unexpected ${field} fingerprint status for ${page.path}`,
    );
  }
  assert.match(page.fingerprints.intent.hash, /^[a-f0-9]{64}$/);
  assert.match(page.fingerprints.intent.causalHash, /^[a-f0-9]{64}$/);
  assert.equal(page.fingerprints.availability.prerendered, page.prerendered);
  if (page.prerendered) {
    assert.match(page.fingerprints.mainContent.hash, /^[a-f0-9]{64}$/);
    assert.deepEqual(
      Object.keys(page.fingerprints.mainContent.compatibility).sort(),
      ['fingerprintVersion', 'hash', 'normalizationProfile'],
    );
    assert.equal(
      page.fingerprints.mainContent.compatibility.fingerprintVersion,
      'seo-page-fingerprints.v1',
    );
    assert.equal(
      page.fingerprints.mainContent.compatibility.normalizationProfile,
      'normalized_text_semantic_markup.v1',
    );
    assert.match(page.fingerprints.mainContent.compatibility.hash, /^[a-f0-9]{64}$/);
    assert.match(page.fingerprints.headingOutline.hash, /^[a-f0-9]{64}$/);
    assert.match(page.fingerprints.structuredData.hash, /^[a-f0-9]{64}$/);
    assert.match(page.fingerprints.structuredData.causalHash, /^[a-f0-9]{64}$/);
    assert.match(page.fingerprints.structuredData.schemaHash, /^[a-f0-9]{64}$/);
    assert.match(page.fingerprints.internalLinks.hash, /^[a-f0-9]{64}$/);
    assert.ok(page.fingerprints.internalLinks.edges.length <= paths.size);
    for (const edge of page.fingerprints.internalLinks.edges) {
      assert.ok(paths.has(edge.route), `unknown internal-link edge target for ${page.path}`);
      assert.match(edge.hash, /^[a-f0-9]{64}$/);
      assert.deepEqual(Object.keys(edge).sort(), ['hash', 'route']);
    }
  } else {
    assert.equal(page.fingerprints.mainContent.status, 'unavailable');
    assert.equal(page.fingerprints.mainContent.compatibility, null);
    assert.equal(page.fingerprints.availability.source, 'manifest_only');
  }
}

const explicitGuide = manifest.pages.find((page) => page.path === '/guides/interview-blueprint/intro');
assert.ok(explicitGuide, 'expected canonical guide entry');
assert.equal(explicitGuide.intentSource, 'explicit');
assert.equal(explicitGuide.intentConfirmed, true);
assert.ok(explicitGuide.targetKeyword);

const fixturePage = {
  canonicalUrl: 'https://frontendatlas.com/angular/trivia/example',
  family: 'question',
  tech: 'angular',
  indexable: true,
  title: 'Manifest title fallback',
  description: 'Manifest description fallback',
  targetKeyword: 'angular example',
  intendedIntent: 'Explain an Angular example',
  readerPromise: 'Give a direct Angular explanation',
  intentSource: 'explicit',
  intentConfirmed: true,
  tags: ['angular', 'example'],
};
const fixtureRoutes = new Set([
  '/angular/trivia/example',
  '/angular/trivia/next',
  '/angular/trivia/reference',
]);
const realJsonLd = ({
  title = 'Rendered Angular example',
  description = 'Rendered description',
  canonical = 'https://frontendatlas.com/angular/trivia/example',
  articleType = 'TechArticle',
  authorName = 'FrontendAtlas editorial team',
} = {}) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://frontendatlas.com/#organization',
      name: 'FrontendAtlas',
      url: 'https://frontendatlas.com',
    },
    {
      '@type': articleType,
      '@id': canonical,
      url: canonical,
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      headline: title,
      name: title,
      description,
      author: { '@type': 'Person', name: authorName },
      datePublished: '2026-08-03',
    },
  ],
});
const fixtureHtml = (
  bodyText,
  jsonLd = null,
  {
    outerText = 'Shared shell text that must not win.',
    link = '/angular/trivia/next',
    linkAnchor = 'Read next',
    secondaryLink = '/angular/trivia/reference',
    secondaryAnchor = 'Read reference',
    title = 'Rendered Angular example',
    description = 'Rendered description',
    canonical = 'https://frontendatlas.com/angular/trivia/example',
  } = {},
) => {
  const resolvedJsonLd = jsonLd || realJsonLd({ title, description, canonical });
  return `
<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index,follow">
    <link rel="canonical" href="${canonical}">
    <script type="application/ld+json">${resolvedJsonLd}</script>
  </head>
  <body>
    <main class="shell-main">
      <p>${outerText}</p>
      <main data-testid="page-main">
        <h1>Rendered question</h1>
        <h2>Evidence</h2>
        <p>${bodyText}</p>
        <a href="${link}">${linkAnchor}</a>
        <a href="${secondaryLink}">${secondaryAnchor}</a>
      </main>
    </main>
  </body>
</html>`;
};

const firstFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
const repeatedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
const bodyChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('Second body answer.'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});

assert.deepEqual(firstFingerprint, repeatedFingerprint, 'fingerprints must be deterministic');
assert.equal(firstFingerprint.availability.mainContentRegion, 'main');
assert.equal(firstFingerprint.mainContent.status, 'complete');
assert.equal(firstFingerprint.seoMetadata.status, 'complete');
assert.equal(firstFingerprint.structuredData.status, 'complete');
assert.notEqual(firstFingerprint.mainContent.hash, bodyChangedFingerprint.mainContent.hash);
assert.notEqual(firstFingerprint.aggregate, bodyChangedFingerprint.aggregate);
assert.equal(firstFingerprint.seoMetadata.hash, bodyChangedFingerprint.seoMetadata.hash);
assert.equal(firstFingerprint.headingOutline.hash, bodyChangedFingerprint.headingOutline.hash);
assert.equal(firstFingerprint.structuredData.hash, bodyChangedFingerprint.structuredData.hash);
assert.equal(firstFingerprint.internalLinks.hash, bodyChangedFingerprint.internalLinks.hash);
assert.equal(firstFingerprint.intent.hash, bodyChangedFingerprint.intent.hash);

const outerShellChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', undefined, { outerText: 'A completely different shell.' }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.deepEqual(
  firstFingerprint,
  outerShellChangedFingerprint,
  'balanced nested-main extraction must ignore text outside the selected inner main',
);

const internalTargetChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', undefined, { link: '/angular/trivia/example' }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.equal(
  firstFingerprint.mainContent.hash,
  internalTargetChangedFingerprint.mainContent.hash,
  'href-only changes must not affect visible main-content semantics',
);
assert.equal(
  firstFingerprint.mainContent.compatibility.hash,
  internalTargetChangedFingerprint.mainContent.compatibility.hash,
  'href-only changes must not affect the v1 compatibility hash',
);
assert.notEqual(
  firstFingerprint.internalLinks.hash,
  internalTargetChangedFingerprint.internalLinks.hash,
  'href-only changes must remain observable as internal-link evidence',
);

const anchorWrapperRemovedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.').replace(
    '<a href="/angular/trivia/next">Read next</a>',
    'Read next',
  ),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.equal(
  firstFingerprint.mainContent.hash,
  anchorWrapperRemovedFingerprint.mainContent.hash,
  'adding or removing an anchor wrapper must not affect visible main-content semantics',
);
assert.notEqual(
  firstFingerprint.internalLinks.hash,
  anchorWrapperRemovedFingerprint.internalLinks.hash,
  'removing an anchor wrapper must remain observable as internal-link evidence',
);
assert.notEqual(
  firstFingerprint.mainContent.compatibility.hash,
  anchorWrapperRemovedFingerprint.mainContent.compatibility.hash,
  'the v1 compatibility hash must preserve the old anchor-wrapper behavior',
);

const anchorTextChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', undefined, { linkAnchor: 'Read the next question' }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(
  firstFingerprint.mainContent.hash,
  anchorTextChangedFingerprint.mainContent.hash,
  'anchor text changes must affect visible main-content semantics',
);
assert.notEqual(
  firstFingerprint.mainContent.compatibility.hash,
  anchorTextChangedFingerprint.mainContent.compatibility.hash,
  'anchor text changes must affect the v1 compatibility hash',
);
assert.notEqual(
  firstFingerprint.internalLinks.hash,
  anchorTextChangedFingerprint.internalLinks.hash,
  'anchor text changes must remain observable as internal-link evidence',
);

const targetBAnchor = 'A private-looking anchor that must remain hashed';
const targetBAnchorChanged = 'A changed private-looking anchor that must remain hashed';
const targetCAnchor = 'Independent reference anchor';
const privateQuery = 'private_query_must_not_leave_generator';
const edgeFixture = buildPageFingerprints({
  html: fixtureHtml('First body answer.', null, {
    link: `/angular/trivia/next?debug=${privateQuery}`,
    linkAnchor: targetBAnchor,
    secondaryAnchor: targetCAnchor,
  }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
const edgeBChangedFixture = buildPageFingerprints({
  html: fixtureHtml('First body answer.', null, {
    link: `/angular/trivia/next?debug=${privateQuery}`,
    linkAnchor: targetBAnchorChanged,
    secondaryAnchor: targetCAnchor,
  }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
const edgeFor = (fingerprint, route) => fingerprint.internalLinks.edges
  .find((edge) => edge.route === route);
assert.equal(edgeFixture.internalLinks.edgeCount, 2);
assert.notEqual(
  edgeFor(edgeFixture, '/angular/trivia/next').hash,
  edgeFor(edgeBChangedFixture, '/angular/trivia/next').hash,
  'target B anchor changes must change only target B edge evidence',
);
assert.equal(
  edgeFor(edgeFixture, '/angular/trivia/reference').hash,
  edgeFor(edgeBChangedFixture, '/angular/trivia/reference').hash,
  'target B anchor changes must not fan out to target C edge evidence',
);
const serializedEdgeEvidence = JSON.stringify(edgeBChangedFixture.internalLinks);
for (const rawAnchor of [targetBAnchor, targetBAnchorChanged, targetCAnchor]) {
  assert.ok(!serializedEdgeEvidence.includes(rawAnchor), 'raw anchors must never leave the generator');
}
assert.ok(!serializedEdgeEvidence.includes(privateQuery), 'raw link queries must never leave the generator');

const semanticMarkupChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.').replace(
    '<p>First body answer.</p>',
    '<blockquote>First body answer.</blockquote>',
  ),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(
  firstFingerprint.mainContent.hash,
  semanticMarkupChangedFingerprint.mainContent.hash,
  'semantic markup-only changes must affect the main-content fingerprint',
);

const titleChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', null, { title: 'Changed rendered title' }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(
  firstFingerprint.seoMetadata.fields.title.hash,
  titleChangedFingerprint.seoMetadata.fields.title.hash,
);
for (const field of ['description', 'canonical', 'robots', 'indexability']) {
  assert.equal(
    firstFingerprint.seoMetadata.fields[field].hash,
    titleChangedFingerprint.seoMetadata.fields[field].hash,
  );
}
assert.notEqual(firstFingerprint.structuredData.hash, titleChangedFingerprint.structuredData.hash);
assert.equal(
  firstFingerprint.structuredData.causalHash,
  titleChangedFingerprint.structuredData.causalHash,
  'title mirrors in JSON-LD must not widen the causal structured-data change set',
);
assert.equal(firstFingerprint.structuredData.schemaHash, titleChangedFingerprint.structuredData.schemaHash);

const descriptionChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', null, { description: 'Changed rendered description' }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(
  firstFingerprint.seoMetadata.fields.description.hash,
  descriptionChangedFingerprint.seoMetadata.fields.description.hash,
);
assert.notEqual(firstFingerprint.structuredData.hash, descriptionChangedFingerprint.structuredData.hash);
assert.equal(firstFingerprint.structuredData.causalHash, descriptionChangedFingerprint.structuredData.causalHash);
assert.equal(firstFingerprint.structuredData.schemaHash, descriptionChangedFingerprint.structuredData.schemaHash);

const changedCanonical = 'https://frontendatlas.com/angular/trivia/example-renamed';
const canonicalChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', null, { canonical: changedCanonical }),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(
  firstFingerprint.seoMetadata.fields.canonical.hash,
  canonicalChangedFingerprint.seoMetadata.fields.canonical.hash,
);
assert.notEqual(firstFingerprint.structuredData.hash, canonicalChangedFingerprint.structuredData.hash);
assert.equal(firstFingerprint.structuredData.causalHash, canonicalChangedFingerprint.structuredData.causalHash);
assert.equal(firstFingerprint.structuredData.schemaHash, canonicalChangedFingerprint.structuredData.schemaHash);
assert.ok(firstFingerprint.structuredData.mirroredLeafCount >= 6);
assert.deepEqual(firstFingerprint.structuredData.mirroredLeafFields, [
  'canonical',
  'description',
  'title',
]);

const authorChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', realJsonLd({ authorName: 'Another editor' })),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(firstFingerprint.structuredData.hash, authorChangedFingerprint.structuredData.hash);
assert.notEqual(firstFingerprint.structuredData.causalHash, authorChangedFingerprint.structuredData.causalHash);
assert.equal(firstFingerprint.structuredData.schemaHash, authorChangedFingerprint.structuredData.schemaHash);

const schemaChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', realJsonLd({ articleType: 'HowTo' })),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.notEqual(firstFingerprint.structuredData.hash, schemaChangedFingerprint.structuredData.hash);
assert.notEqual(firstFingerprint.structuredData.causalHash, schemaChangedFingerprint.structuredData.causalHash);
assert.notEqual(firstFingerprint.structuredData.schemaHash, schemaChangedFingerprint.structuredData.schemaHash);

const simpleJsonLdFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', '{"name":"Example","@type":"Article"}'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
const reorderedJsonLdFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', '{"@type":"Article","name":"Example"}'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.equal(
  simpleJsonLdFingerprint.structuredData.hash,
  reorderedJsonLdFingerprint.structuredData.hash,
  'JSON-LD object key order must not change its fingerprint',
);
assert.equal(
  simpleJsonLdFingerprint.structuredData.causalHash,
  reorderedJsonLdFingerprint.structuredData.causalHash,
);
assert.equal(
  simpleJsonLdFingerprint.structuredData.schemaHash,
  reorderedJsonLdFingerprint.structuredData.schemaHash,
);
const invalidJsonLdFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.', '{not valid json'),
  page: fixturePage,
  allowedRoutes: fixtureRoutes,
});
assert.equal(invalidJsonLdFingerprint.structuredData.status, 'partial');
assert.ok(
  !JSON.stringify(invalidJsonLdFingerprint).includes('{not valid json'),
  'raw JSON-LD must never be copied into the manifest fingerprint payload',
);

const explicitIntentChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.'),
  page: {
    ...fixturePage,
    intendedIntent: 'Teach a materially different explicit Angular intent',
  },
  allowedRoutes: fixtureRoutes,
});
assert.equal(firstFingerprint.intent.dependency, 'independent');
assert.equal(firstFingerprint.intent.causalStatus, 'complete');
assert.notEqual(firstFingerprint.intent.hash, explicitIntentChangedFingerprint.intent.hash);
assert.notEqual(firstFingerprint.intent.causalHash, explicitIntentChangedFingerprint.intent.causalHash);

const derivedIntentPage = {
  ...fixturePage,
  title: 'Derived title one',
  description: 'Derived description one',
  targetKeyword: 'derived title one',
  intendedIntent: 'Derived description one',
  readerPromise: 'Derived description one',
  intentSource: 'derived',
  intentConfirmed: false,
};
const derivedIntentFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.'),
  page: derivedIntentPage,
  allowedRoutes: fixtureRoutes,
});
const derivedMetadataChangedFingerprint = buildPageFingerprints({
  html: fixtureHtml('First body answer.'),
  page: {
    ...derivedIntentPage,
    title: 'Derived title two',
    description: 'Derived description two',
    targetKeyword: 'derived title two',
    intendedIntent: 'Derived description two',
    readerPromise: 'Derived description two',
  },
  allowedRoutes: fixtureRoutes,
});
assert.equal(derivedIntentFingerprint.intent.dependency, 'derived_from_page_metadata');
assert.equal(derivedIntentFingerprint.intent.causalStatus, 'partial');
assert.equal(derivedIntentFingerprint.intent.causalSource, 'derived_taxonomy_only');
assert.notEqual(derivedIntentFingerprint.intent.hash, derivedMetadataChangedFingerprint.intent.hash);
assert.equal(
  derivedIntentFingerprint.intent.causalHash,
  derivedMetadataChangedFingerprint.intent.causalHash,
  'title/description-derived intent echoes must not look like independent intent changes',
);

const manifestOnlyFingerprint = buildPageFingerprints({ page: fixturePage, allowedRoutes: fixtureRoutes });
assert.equal(manifestOnlyFingerprint.availability.source, 'manifest_only');
assert.equal(manifestOnlyFingerprint.mainContent.hash, null);
assert.equal(manifestOnlyFingerprint.mainContent.status, 'unavailable');
assert.match(manifestOnlyFingerprint.seoMetadata.hash, /^[a-f0-9]{64}$/);
assert.equal(manifestOnlyFingerprint.seoMetadata.fields.title.status, 'partial');

const headSha = 'a'.repeat(40);
const previousSha = 'b'.repeat(40);
const vercelGitReader = (args) => {
  if (args[0] === 'show') return '2026-08-07T08:00:00.000Z';
  if (args[0] === 'diff') {
    return [
      'M\tcdn/questions/angular/trivia.json',
      'A\tfrontend/src/app/features/example.ts',
    ].join('\n');
  }
  return '';
};
const vercelProvenance = buildProvenance({
  env: {
    VERCEL: '1',
    VERCEL_ENV: 'production',
    VERCEL_DEPLOYMENT_ID: 'dpl_test123',
    VERCEL_GIT_COMMIT_SHA: headSha,
    VERCEL_GIT_PREVIOUS_SHA: previousSha,
    SEO_DEPLOYMENT_READY_AT: '2026-08-07T09:30:00.000Z',
  },
  observedAt: new Date('2026-08-07T09:00:00.000Z'),
  gitReader: vercelGitReader,
});
assert.equal(vercelProvenance.deployment.id, 'dpl_test123');
assert.equal(vercelProvenance.schemaVersion, PROVENANCE_VERSION);
assert.equal(vercelProvenance.deployment.readyAtPrecision, 'exact');
assert.deepEqual(vercelProvenance.deployment.effectiveAt, {
  lowerBound: '2026-08-07T09:30:00.000Z',
  upperBound: '2026-08-07T09:30:00.000Z',
  precision: 'exact',
  source: 'explicit_ready_at',
});
assert.equal(vercelProvenance.git.diff.scope, 'previous_successful_deployment');
assert.equal(vercelProvenance.git.diff.confidence, 'high');
assert.equal(vercelProvenance.git.diff.explanationRole, 'candidate_corroboration_only');
assert.equal(vercelProvenance.git.diff.establishesCausality, false);
assert.equal(vercelProvenance.git.diff.changedFileCount, 2);
assert.deepEqual(vercelProvenance.git.diff.candidateSignals, [
  'content_source_changed',
  'rendered_application_source_changed',
]);
assert.ok(!JSON.stringify(vercelProvenance).includes('trivia.json'), 'Git paths must be hashed, not copied');
const productionMarker = buildBuildMarker({
  version: 'seo-page-manifest.v1',
  sourceHash: 'f'.repeat(64),
  fingerprintVersion: FINGERPRINT_VERSION,
  provenanceVersion: PROVENANCE_VERSION,
  provenance: vercelProvenance,
});
assert.equal(productionMarker.deployment.environment, 'production');
assert.equal(productionMarker.deployment.id, 'dpl_test123');
assert.equal(productionMarker.deployment.gitSha, headSha);
assert.equal(productionMarker.deployment.readyAt, '2026-08-07T09:30:00.000Z');
assert.equal(productionMarker.deployment.readyAtPrecision, 'exact');
assert.deepEqual(productionMarker.git.diff.candidateSignals, [
  'content_source_changed',
  'rendered_application_source_changed',
]);
assert.equal('entries' in productionMarker.git.diff, false);

const localHeadSha = 'c'.repeat(40);
const localParentSha = 'd'.repeat(40);
const localProvenance = buildProvenance({
  env: {},
  observedAt: new Date('2026-08-07T09:00:00.000Z'),
  gitReader: (args) => {
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return localHeadSha;
    if (args[0] === 'rev-parse' && args[1] === `${localHeadSha}^`) return localParentSha;
    if (args[0] === 'show') return '2026-08-07T08:00:00.000Z';
    if (args[0] === 'diff') return 'M\tfrontend/src/sitemap.xml';
    return '';
  },
});
assert.equal(localProvenance.deployment.readyAt, null);
assert.equal(localProvenance.deployment.readyAtPrecision, 'unknown');
assert.equal(localProvenance.deployment.effectiveAt.source, 'runtime_observation_required');
assert.equal(localProvenance.git.diff.scope, 'first_parent');
assert.equal(localProvenance.git.diff.confidence, 'low');
assert.equal(localProvenance.git.previousSha, localParentSha);
assert.equal(localProvenance.git.previousShaSource, 'git_first_parent');
assert.ok(localProvenance.limitations.includes('first_parent_is_not_previous_deployment'));

console.log(`[seo-manifest:test] passed pages=${manifest.pages.length} hash=${manifest.sourceHash.slice(0, 12)}`);
