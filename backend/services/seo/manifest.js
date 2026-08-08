'use strict';

const crypto = require('crypto');
const path = require('path');
const SeoPage = require('../../models/SeoPage');
const SeoPageVersion = require('../../models/SeoPageVersion');
const { normalizeCanonicalUrl, pageKeyForUrl, validateFrontendAtlasUrl } = require('./keys');

const DEFAULT_MANIFEST_PATH = path.resolve(__dirname, '../../content/seo/page-manifest.json');
const DEFAULT_PRODUCTION_MARKER_URL = 'https://frontendatlas.com/seo-intelligence-build.json';
const MAX_PRODUCTION_MARKER_BYTES = 32 * 1024;
const RECENT_CONTENT_COOLDOWN_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;
const FINGERPRINT_VERSION_V1 = 'seo-page-fingerprints.v1';
const FINGERPRINT_VERSION_V2 = 'seo-page-fingerprints.v2';
const MAIN_CONTENT_V1_NORMALIZATION_PROFILE = 'normalized_text_semantic_markup.v1';
const MATERIAL_FIELDS = Object.freeze(['canonical', 'title', 'description', 'h1', 'contentUpdatedAt']);
const MAX_PAGE_VERSION_HISTORY = 12;
const FINGERPRINT_COMPONENTS = Object.freeze([
  'title',
  'description',
  'h1',
  'mainContent',
  'headingOutline',
  'intent',
  'internalLinks',
  'canonical',
  'robots',
  'indexability',
  'structuredData',
]);

// Structured data can change search appearance (CTR) and rich-result/markup
// eligibility (technical). Technical checks are still evaluated while their
// crawl lineage is pending; this map only scopes performance cooldowns and
// assessment invalidation.
const DETECTOR_COMPONENTS = Object.freeze({
  ctr_snippet: Object.freeze(['title', 'description', 'structuredData']),
  intent_mismatch: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  content_decay: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  cannibalization: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  // Internal-link opportunity evaluates inbound support on the target page.
  // A source page's outbound-link fingerprint must not cool that source's own
  // detector; buildInternalLinkMetadata creates a target-scoped graph event
  // and waits for the changed source pages to be recrawled instead.
  internal_link: Object.freeze([]),
  technical_indexing: Object.freeze(['canonical', 'robots', 'indexability', 'structuredData']),
});
const FALLBACK_METADATA_COMPONENTS = new Set([
  'title', 'description', 'canonical', 'robots', 'indexability',
]);

function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizedMaterialText(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function safeHash(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : '';
}

function safeMetadataToken(value, maximum = 200) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .trim()
    .slice(0, maximum);
}

function fingerprintNodeHash(value) {
  if (typeof value === 'string') return safeHash(value);
  return safeHash(value?.hash);
}

function validatedMainContentCompatibility(value, nextFingerprintVersion) {
  if (
    nextFingerprintVersion !== FINGERPRINT_VERSION_V2
    || !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) return null;
  const keys = Object.keys(value).sort();
  if (keys.length !== 3 || keys.join(',') !== 'fingerprintVersion,hash,normalizationProfile') return null;
  if (
    value.fingerprintVersion !== FINGERPRINT_VERSION_V1
    || value.normalizationProfile !== MAIN_CONTENT_V1_NORMALIZATION_PROFILE
  ) return null;
  const hash = safeHash(value.hash);
  return hash ? {
    fingerprintVersion: FINGERPRINT_VERSION_V1,
    normalizationProfile: MAIN_CONTENT_V1_NORMALIZATION_PROFILE,
    hash,
  } : null;
}

function normalizedFingerprintEvidence(input = {}, componentNodes = {}) {
  const explicitEvidence = input.fingerprintEvidence && typeof input.fingerprintEvidence === 'object'
    ? input.fingerprintEvidence
    : null;
  const availability = input.fingerprints?.availability && typeof input.fingerprints.availability === 'object'
    ? input.fingerprints.availability
    : {};
  const evidence = explicitEvidence || availability;
  const safeStatus = (value) => ['available', 'complete', 'partial', 'unavailable', 'legacy'].includes(String(value))
    ? (String(value) === 'available' ? 'complete' : String(value))
    : 'unavailable';
  const metadataFields = componentNodes.seoMetadata?.fields
    && typeof componentNodes.seoMetadata.fields === 'object'
    ? componentNodes.seoMetadata.fields
    : {};
  const statuses = Object.fromEntries(Object.entries(componentNodes).map(([key, value]) => [
    key,
    safeStatus(value?.status),
  ]));
  for (const name of ['title', 'description', 'canonical', 'robots', 'indexability']) {
    statuses[name] = safeStatus(metadataFields[name]?.status || componentNodes.seoMetadata?.status);
  }
  statuses.h1 = input.h1 ? 'complete' : 'partial';
  return {
    source: safeMetadataToken(evidence.source || 'manifest_only', 120) || 'manifest_only',
    prerenderedAvailable: evidence.prerenderedAvailable === true || evidence.prerendered === true,
    limitations: Array.from(new Set((Array.isArray(evidence.limitations) ? evidence.limitations : [])
      .map((value) => safeMetadataToken(value, 100))
      .filter((value) => /^[a-z0-9][a-z0-9_-]{0,99}$/i.test(value))))
      .slice(0, 20),
    statuses,
  };
}

function componentHashesForManifestPage(input = {}, { fingerprintSchemaVersion = '' } = {}) {
  const fingerprints = input.fingerprints && typeof input.fingerprints === 'object'
    ? input.fingerprints
    : {};
  const componentNodes = {
    seoMetadata: fingerprints.seoMetadata || {},
    mainContent: fingerprints.mainContent || {},
    headingOutline: fingerprints.headingOutline || {},
    structuredData: fingerprints.structuredData || {},
    internalLinks: fingerprints.internalLinks || {},
    intent: fingerprints.intent || {},
  };
  const metadataFields = componentNodes.seoMetadata?.fields && typeof componentNodes.seoMetadata.fields === 'object'
    ? componentNodes.seoMetadata.fields
    : {};
  const declaredFingerprintVersion = safeMetadataToken(
    fingerprints.schemaVersion || fingerprints.version || fingerprintSchemaVersion,
    80
  );
  const versioned = Boolean(
    declaredFingerprintVersion
    || safeHash(fingerprints.compositeHash || fingerprints.aggregate)
  );
  const normalizedFingerprintVersion = declaredFingerprintVersion
    || (versioned ? FINGERPRINT_VERSION_V1 : 'legacy-derived.v1');
  const contentUpdatedAt = validDate(input.updatedAt || input.contentUpdatedAt);
  const outboundLinks = Array.isArray(input.outboundLinks)
    ? input.outboundLinks.map(String).sort()
    : [];
  const normalizedIntent = {
    targetKeyword: normalizedMaterialText(input.targetKeyword),
    intendedIntent: normalizedMaterialText(input.intendedIntent),
    readerPromise: normalizedMaterialText(input.readerPromise),
    confirmed: input.intentConfirmed === true,
  };
  const unavailableFingerprint = (key, node) => hashValue({
    unavailable: key,
    status: safeMetadataToken(node?.status || 'unavailable', 40),
    source: safeMetadataToken(node?.source || '', 80),
  });
  const suppliedOrUnavailable = (key) => (
    fingerprintNodeHash(componentNodes[key])
    || unavailableFingerprint(key, componentNodes[key])
  );
  const mainContentHash = versioned
    ? suppliedOrUnavailable('mainContent')
    // updatedAt is only a legacy fallback. Once v2 fingerprints exist it is
    // provenance, not evidence of an actual rendered-content change.
    : hashValue({ legacyContentUpdatedAt: contentUpdatedAt?.toISOString() || '' });
  const mainContentCompatibility = validatedMainContentCompatibility(
    componentNodes.mainContent?.compatibility,
    normalizedFingerprintVersion
  );
  const headingOutlineHash = versioned
    ? suppliedOrUnavailable('headingOutline')
    : hashValue({ legacyH1: normalizedMaterialText(input.h1) });
  const structuredDataCausalHash = safeHash(componentNodes.structuredData?.causalHash);
  const structuredDataSchemaHash = safeHash(componentNodes.structuredData?.schemaHash);
  const structuredDataHash = versioned
    ? (
      structuredDataCausalHash
      || structuredDataSchemaHash
      || suppliedOrUnavailable('structuredData')
    )
    : hashValue({ legacyStructuredData: '' });
  const internalLinksHash = versioned
    ? (fingerprintNodeHash(componentNodes.internalLinks) || hashValue(outboundLinks))
    : hashValue(outboundLinks);
  const internalLinkEdges = (Array.isArray(componentNodes.internalLinks?.edges)
    ? componentNodes.internalLinks.edges
    : []).flatMap((edge) => {
    try {
      const url = new URL(String(edge?.route || ''), 'https://frontendatlas.com');
      const edgeHash = safeHash(edge?.hash);
      if (url.origin !== 'https://frontendatlas.com' || url.search || url.hash || !edgeHash) return [];
      return [{ route: url.pathname.replace(/\/+$/, '') || '/', hash: edgeHash }];
    } catch {
      return [];
    }
  }).sort((left, right) => left.route.localeCompare(right.route)).slice(0, 1_000);
  const intentCausalHash = safeHash(componentNodes.intent?.causalHash);
  const intentHash = versioned
    ? (intentCausalHash || fingerprintNodeHash(componentNodes.intent) || hashValue(normalizedIntent))
    : hashValue(normalizedIntent);
  const indexable = input.indexable !== false;
  const robots = normalizedMaterialText(input.robots || (indexable ? 'index,follow' : 'noindex,follow'));
  const canonicalUrl = normalizeCanonicalUrl(input.canonicalUrl);
  const hasRenderedCanonical = Object.prototype.hasOwnProperty.call(input, 'renderedCanonicalUrl');
  const renderedCanonicalUrl = hasRenderedCanonical
    ? normalizeCanonicalUrl(input.renderedCanonicalUrl)
    : canonicalUrl;
  const fieldHash = (name, fallback) => fingerprintNodeHash(metadataFields[name]) || hashValue(fallback);
  return {
    fingerprintVersion: normalizedFingerprintVersion,
    fingerprintAggregate: safeHash(fingerprints.aggregate || fingerprints.compositeHash),
    // This is transient ingestion provenance, computed from validated hashes
    // rather than trusted from a manifest flag. It lets compatibility logic
    // distinguish old full-payload fingerprints from the current causal
    // hashes that already remove metadata mirrors.
    fingerprintHashProvenance: {
      intent: intentCausalHash ? 'causal_hash' : 'legacy_full_hash',
      structuredData: structuredDataCausalHash
        ? 'causal_hash'
        : structuredDataSchemaHash
          ? 'schema_hash'
          : 'legacy_full_hash',
    },
    fingerprintCompatibility: mainContentCompatibility
      ? { mainContent: mainContentCompatibility }
      : {},
    internalLinkEdges,
    componentHashes: {
      title: fieldHash('title', normalizedMaterialText(input.title)),
      description: fieldHash('description', normalizedMaterialText(input.description)),
      h1: hashValue(normalizedMaterialText(input.h1)),
      mainContent: mainContentHash,
      headingOutline: headingOutlineHash,
      intent: intentHash,
      internalLinks: internalLinksHash,
      canonical: fieldHash('canonical', renderedCanonicalUrl),
      robots: fieldHash('robots', robots),
      indexability: fieldHash('indexability', indexable),
      structuredData: structuredDataHash,
    },
    fingerprintEvidence: normalizedFingerprintEvidence(input, componentNodes),
  };
}

function normalizeManifestProvenance(manifest = {}) {
  const provenance = manifest.provenance && typeof manifest.provenance === 'object'
    ? manifest.provenance
    : {};
  const deployment = provenance.deployment && typeof provenance.deployment === 'object'
    ? provenance.deployment
    : {};
  const git = provenance.git && typeof provenance.git === 'object' ? provenance.git : {};
  const diff = git.diff && typeof git.diff === 'object' ? git.diff : {};
  const safeTokenList = (values, maximum = 20) => Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => safeMetadataToken(value, 80))
      .filter((value) => /^[a-z0-9][a-z0-9_.-]{0,79}$/i.test(value))
  )).slice(0, maximum);
  const safeCountMap = (value, maximum = 20) => Object.fromEntries(
    Object.entries(value && typeof value === 'object' && !Array.isArray(value) ? value : {})
      .map(([key, count]) => [safeMetadataToken(key, 80), Math.max(0, Math.min(Number(count || 0), 100_000))])
      .filter(([key, count]) => /^[a-z0-9][a-z0-9_.-]{0,79}$/i.test(key) && Number.isFinite(count))
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, maximum)
  );
  const environment = safeMetadataToken(deployment.environment || 'unknown', 40) || 'unknown';
  const readyAt = validDate(deployment.readyAt || deployment.effectiveAt?.upperBound);
  const declaredExact = String(deployment.readyAtPrecision || deployment.effectiveAt?.precision) === 'exact';
  const productionEnvironment = !deployment.environment || ['production', 'unknown'].includes(environment);
  return {
    schemaVersion: safeMetadataToken(provenance.schemaVersion || provenance.version, 80),
    deployment: {
      environment,
      provider: safeMetadataToken(deployment.provider || 'unknown', 40),
      deploymentId: safeMetadataToken(deployment.id || deployment.deploymentId, 200),
      readyAt: readyAt && declaredExact && productionEnvironment ? readyAt : null,
      readyAtExact: Boolean(readyAt && declaredExact && productionEnvironment),
    },
    git: {
      // Git is corroboration only. Commit/build timestamps are deliberately
      // excluded because they cannot prove when a deployment became crawlable.
      commitSha: safeMetadataToken(deployment.gitSha || git.headSha, 128),
      diffBaseSha: safeMetadataToken(git.previousSha, 128),
      authority: 'corroborating_only',
      candidate: {
        authority: 'corroborating_only',
        status: safeMetadataToken(diff.status || 'unavailable', 40),
        diffBaseKind: safeMetadataToken(diff.scope || git.diffBaseKind || git.previousShaSource || 'unavailable', 80),
        diffBaseConfidence: safeMetadataToken(diff.confidence || git.diffBaseConfidence || 'unavailable', 40),
        changedFileCount: Math.max(0, Math.min(Number(diff.changedFileCount || 0), 100_000)),
        returnedEntryCount: Math.max(0, Math.min(Number(diff.returnedEntryCount || 0), 10_000)),
        entryLimit: Math.max(0, Math.min(Number(diff.entryLimit || 0), 10_000)),
        truncated: diff.truncated === true,
        changeTypes: safeCountMap(diff.changeTypes, 10),
        areas: safeCountMap(diff.areas, 20),
        candidateSignals: safeTokenList(diff.candidateSignals, 30),
      },
    },
  };
}

function normalizeProductionMarker(marker, {
  sourceHash,
  fingerprintVersion,
  manifestVersion,
  observedAt = new Date(),
} = {}) {
  if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
    return { ready: false, reason: 'production_marker_unavailable' };
  }
  if (marker.version !== 'seo-build-marker.v1' || Object.prototype.hasOwnProperty.call(marker, 'pages')) {
    return { ready: false, reason: 'production_marker_invalid' };
  }
  const markerSourceHash = safeHash(marker.sourceHash);
  if (!markerSourceHash || markerSourceHash !== safeHash(sourceHash)) {
    return { ready: false, reason: 'production_marker_source_mismatch' };
  }
  if (
    safeMetadataToken(marker.fingerprintVersion, 80) !== safeMetadataToken(fingerprintVersion, 80)
    || safeMetadataToken(marker.manifestVersion, 80) !== safeMetadataToken(manifestVersion, 80)
  ) return { ready: false, reason: 'production_marker_contract_mismatch' };
  const deployment = marker.deployment && typeof marker.deployment === 'object'
    ? marker.deployment
    : {};
  const environment = safeMetadataToken(deployment.environment || 'unknown', 40);
  if (environment !== 'production') return { ready: false, reason: 'production_marker_not_production' };
  const deploymentId = safeMetadataToken(deployment.id, 200);
  const gitSha = safeMetadataToken(deployment.gitSha, 128).toLowerCase();
  if (!deploymentId || !/^[a-f0-9]{7,64}$/.test(gitSha)) {
    return { ready: false, reason: 'production_marker_identity_missing' };
  }
  const explicitReadyAt = validDate(deployment.readyAt);
  const exactReady = explicitReadyAt && deployment.readyAtPrecision === 'exact';
  const observation = validDate(observedAt) || new Date();
  const markerGit = normalizeManifestProvenance({
    provenance: {
      deployment: { gitSha },
      git: marker.git && typeof marker.git === 'object' ? marker.git : {},
    },
  }).git;
  return {
    ready: true,
    reason: 'production_marker_verified',
    observedAt: observation,
    sourceHash: markerSourceHash,
    deployment: {
      environment,
      provider: safeMetadataToken(deployment.provider || 'unknown', 40),
      deploymentId,
      readyAt: exactReady ? explicitReadyAt : observation,
      precision: exactReady ? 'exact' : 'upper_bound',
      source: exactReady ? 'manifest_ready_at' : 'runtime_marker_observed',
      gitSha,
    },
    git: markerGit,
  };
}

async function fetchProductionBuildMarker({
  url = DEFAULT_PRODUCTION_MARKER_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = 3_000,
} = {}) {
  const parsed = new URL(String(url));
  if (
    parsed.protocol !== 'https:'
    || parsed.origin !== 'https://frontendatlas.com'
    || parsed.pathname !== '/seo-intelligence-build.json'
    || parsed.search
    || parsed.hash
  ) throw new Error('Invalid SEO production marker URL');
  if (typeof fetchImpl !== 'function') throw new Error('SEO production marker fetch is unavailable');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(250, Math.min(Number(timeoutMs) || 3_000, 10_000)));
  try {
    const response = await fetchImpl(parsed.toString(), {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response?.ok) throw new Error('SEO production marker request failed');
    const declaredSize = Number(response.headers?.get?.('content-length') || 0);
    if (declaredSize > MAX_PRODUCTION_MARKER_BYTES) throw new Error('SEO production marker is too large');
    let bytes;
    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
        total += chunk.byteLength;
        if (total > MAX_PRODUCTION_MARKER_BYTES) {
          await reader.cancel().catch(() => {});
          throw new Error('SEO production marker is too large');
        }
        chunks.push(chunk);
      }
      bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
    } else {
      bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_PRODUCTION_MARKER_BYTES) throw new Error('SEO production marker is too large');
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } finally {
    clearTimeout(timeout);
  }
}

function componentChanges(previousTrusted = {}, next = {}, nextPage = {}, {
  currentTrusted = {},
  previousFingerprintVersion = '',
} = {}) {
  const mainContentCompatibility = validatedMainContentCompatibility(
    nextPage.fingerprintCompatibility?.mainContent,
    nextPage.fingerprintVersion
  );
  const mainContentMatchesPreviousNormalization = Boolean(
    previousFingerprintVersion === FINGERPRINT_VERSION_V1
    && mainContentCompatibility
    && safeHash(previousTrusted?.mainContent) === mainContentCompatibility.hash
  );
  const changes = FINGERPRINT_COMPONENTS.filter((component) => {
    const priorHash = safeHash(previousTrusted?.[component]);
    const nextHash = safeHash(next?.[component]);
    return Boolean(
      currentTrusted?.[component]
      && priorHash
      && nextHash
      && priorHash !== nextHash
      && !(component === 'mainContent' && mainContentMatchesPreviousNormalization)
    );
  });
  // Older fingerprint manifests hashed derived intent contracts and full
  // JSON-LD values. Do not let metadata echoes broaden detector scope. The
  // current manifest supplies causal/schema hashes; if one of those changes,
  // it is independent evidence and must not be removed just because metadata
  // changed in the same deployment.
  const hashProvenance = nextPage.fingerprintHashProvenance || {};
  const intentUsesCausalHash = hashProvenance.intent === 'causal_hash';
  if (
    !intentUsesCausalHash
    && changes.includes('intent')
    && nextPage.intentSource === 'derived'
    && changes.some((component) => ['title', 'description'].includes(component))
    && !changes.some((component) => ['h1', 'mainContent', 'headingOutline'].includes(component))
  ) changes.splice(changes.indexOf('intent'), 1);
  const structuredDataUsesScopedHash = ['causal_hash', 'schema_hash']
    .includes(hashProvenance.structuredData);
  const nonStructured = changes.filter((component) => component !== 'structuredData');
  if (
    !structuredDataUsesScopedHash
    && changes.includes('structuredData')
    && nonStructured.length
    && nonStructured.every((component) => (
      ['title', 'description', 'canonical', 'robots', 'indexability'].includes(component)
    ))
  ) changes.splice(changes.indexOf('structuredData'), 1);
  return changes;
}

function componentObservationTrusted(component, status) {
  if (status === 'unavailable') return false;
  if (status === 'partial' && FALLBACK_METADATA_COMPONENTS.has(component)) return false;
  return ['complete', 'partial', 'legacy'].includes(String(status || ''));
}

function trustedComponentHashesFromTracking(tracking = {}) {
  const explicit = tracking.trustedComponentHashes || {};
  const statuses = tracking.fingerprintEvidence?.statuses || {};
  const hasStatuses = Object.keys(statuses).length > 0;
  const nonLegacyFingerprint = Boolean(
    tracking.fingerprintVersion
    && !String(tracking.fingerprintVersion).startsWith('legacy-derived')
  );
  return Object.fromEntries(FINGERPRINT_COMPONENTS.map((component) => {
    const explicitHash = safeHash(explicit?.[component]);
    if (explicitHash) return [component, explicitHash];
    const inferredTrusted = hasStatuses
      ? componentObservationTrusted(component, statuses[component])
      : nonLegacyFingerprint;
    return [component, inferredTrusted ? safeHash(tracking.componentHashes?.[component]) : ''];
  }));
}

function productionEvidenceForVersion({ previousTracking = {}, provenance = {}, versionKey, now = new Date() } = {}) {
  const previousProduction = previousTracking.production || {};
  const sameVersion = Boolean(versionKey && previousTracking.currentVersionKey === versionKey);
  const previousVerified = Boolean(
    sameVersion
    && validDate(previousProduction.effectiveAt)
    && ['manifest_ready_at', 'runtime_marker_observed'].includes(String(previousProduction.source || ''))
  );
  // Once a material version has a verified production occurrence, a same-
  // content redeploy must not restart its cooldown. Conversely, legacy
  // `runtime_observed` rows are deliberately not trusted here: a later live
  // marker must be able to promote them.
  if (previousVerified) {
    return {
      effectiveAt: validDate(previousProduction.effectiveAt),
      precision: String(previousProduction.precision || 'unknown'),
      source: String(previousProduction.source || 'unknown'),
      deploymentId: safeMetadataToken(previousProduction.deploymentId, 200),
      gitCommitSha: safeMetadataToken(previousProduction.gitCommitSha, 128),
      gitDiffBaseSha: safeMetadataToken(previousProduction.gitDiffBaseSha, 128),
      gitCandidate: previousProduction.gitCandidate || {},
    };
  }
  if (provenance.marker?.ready && validDate(provenance.marker.deployment?.readyAt)) {
    return {
      effectiveAt: validDate(provenance.marker.deployment.readyAt),
      precision: provenance.marker.deployment.precision,
      source: provenance.marker.deployment.source,
      deploymentId: safeMetadataToken(provenance.marker.deployment.deploymentId, 200),
      gitCommitSha: safeMetadataToken(provenance.marker.deployment.gitSha, 128),
      gitDiffBaseSha: safeMetadataToken(provenance.marker.git?.diffBaseSha, 128),
      gitCandidate: provenance.marker.git?.candidate || {},
    };
  }
  // A local manifest read proves only what exists in the working tree. It
  // cannot prove that this version is deployed or crawlable, regardless of a
  // build/commit timestamp embedded in the file.
  return {
    effectiveAt: null,
    precision: 'unknown',
    source: 'unknown',
    deploymentId: '',
    gitCommitSha: '',
    gitDiffBaseSha: '',
    gitCandidate: {},
  };
}

function detectorNamesForComponents(components = []) {
  return Object.entries(DETECTOR_COMPONENTS)
    .filter(([, mapped]) => mapped.some((component) => components.includes(component)))
    .map(([detector]) => detector);
}

function isoDate(value) {
  return validDate(value)?.toISOString() || null;
}

function analysisInputHashForPage(page = {}) {
  const tracking = page.changeTracking || {};
  const detectorInputs = Object.fromEntries(Object.keys(DETECTOR_COMPONENTS).map((detector) => {
    const value = tracking.detectors?.[detector] || null;
    return [detector, value ? {
      versionKey: String(value.versionKey || ''),
      productionEffectiveAt: isoDate(value.productionEffectiveAt),
      confirmedCrawlAt: isoDate(value.confirmedCrawlAt),
      crawlConfirmationRequired: value.crawlConfirmationRequired === true,
      implementationReportedAt: isoDate(value.implementationReportedAt),
      awaitingManifestChange: value.awaitingManifestChange === true,
      awaitingProductionEvidence: value.awaitingProductionEvidence === true,
      awaitingSourceRecrawl: value.awaitingSourceRecrawl === true,
      sourceRecrawlNotEvaluable: value.sourceRecrawlNotEvaluable === true,
      expectedChangedComponents: Array.from(new Set(
        (value.expectedChangedComponents || []).map(String)
      )).sort(),
      dependencyPageKeys: Array.from(new Set(
        (value.dependencyPageKeys || []).map(String)
      )).sort(),
      unverifiableDependencyPageKeys: Array.from(new Set(
        (value.unverifiableDependencyPageKeys || []).map(String)
      )).sort(),
      changedComponents: Array.from(new Set((value.changedComponents || []).map(String))).sort(),
      changedComponentHashes: Object.fromEntries(Object.entries(value.changedComponentHashes || {})
        .map(([component, hash]) => [String(component), safeHash(hash)])
        .filter(([, hash]) => hash)
        .sort(([left], [right]) => left.localeCompare(right))),
    } : null];
  }));
  return hashValue({
    schema: 'seo-analysis-input.v1',
    versionKey: String(tracking.currentVersionKey || ''),
    occurrenceKey: String(tracking.currentOccurrenceKey || ''),
    componentHashes: Object.fromEntries(FINGERPRINT_COMPONENTS.map((component) => [
      component,
      safeHash(tracking.componentHashes?.[component]),
    ])),
    trustedComponentHashes: Object.fromEntries(FINGERPRINT_COMPONENTS.map((component) => [
      component,
      safeHash(tracking.trustedComponentHashes?.[component]),
    ])),
    fingerprintEvidence: {
      source: String(tracking.fingerprintEvidence?.source || ''),
      prerenderedAvailable: tracking.fingerprintEvidence?.prerenderedAvailable === true,
      statuses: tracking.fingerprintEvidence?.statuses || {},
      limitations: Array.from(new Set((tracking.fingerprintEvidence?.limitations || []).map(String))).sort(),
    },
    internalLinkGraphHash: safeHash(page.internalLinks?.graphHash || page.internalLinkGraphHash),
    intent: {
      targetKeyword: normalizedMaterialText(page.intent?.targetKeyword),
      intendedIntent: normalizedMaterialText(page.intent?.intendedIntent),
      readerPromise: normalizedMaterialText(page.intent?.readerPromise),
      source: String(page.intent?.source || ''),
      confirmed: page.intent?.confirmed === true,
    },
    detectorInputs,
  });
}

function derivePageLineage(existingPage, nextPage, manifestMetadata = {}, now = new Date()) {
  const observedAt = validDate(now) || new Date();
  // Preserve the legacy material-change clock while establishing fingerprint
  // lineage. This matters during migration: seeding a v2 fingerprint must not
  // silently turn an active legacy 14/28-day observation window into eligible.
  const previousTracking = {
    ...(existingPage?.changeTracking || {}),
    ...deriveChangeTracking(existingPage, nextPage, observedAt),
  };
  const suppliedComponentHashes = nextPage.componentHashes || {};
  const statuses = nextPage.fingerprintEvidence?.statuses || {};
  const previousTrustedComponentHashes = trustedComponentHashesFromTracking(previousTracking);
  const componentStatusKey = (component) => ({
    mainContent: 'mainContent',
    headingOutline: 'headingOutline',
    structuredData: 'structuredData',
    internalLinks: 'internalLinks',
    intent: 'intent',
  }[component] || component);
  const currentTrusted = {};
  const trustedComponentHashes = { ...previousTrustedComponentHashes };
  const componentHashes = Object.fromEntries(FINGERPRINT_COMPONENTS.map((component) => {
    const supplied = safeHash(suppliedComponentHashes[component]);
    const previous = safeHash(previousTracking.componentHashes?.[component]);
    const previousTrusted = safeHash(previousTrustedComponentHashes[component]);
    const status = statuses[componentStatusKey(component)];
    // `unavailable` means the component was not observed at all. Metadata
    // `partial` means the generator used manifest fallback rather than live
    // rendered HTML. Keep the prior observed hash in those cases. Other
    // partial components (for example an observed empty heading outline) keep
    // their own stable hash and only gate the detectors that require them.
    const shouldPreservePrior = status === 'unavailable'
      || (status === 'partial' && FALLBACK_METADATA_COMPONENTS.has(component));
    const trusted = componentObservationTrusted(component, status) && Boolean(supplied);
    currentTrusted[component] = trusted;
    if (trusted) trustedComponentHashes[component] = supplied;
    return [component, shouldPreservePrior && (previousTrusted || previous)
      ? (previousTrusted || previous)
      : supplied];
  }));
  // Build material identity from the effective component hashes rather than
  // the manifest aggregate, whose status/fallback nodes can change without a
  // proven material change. Evidence status still participates in the
  // analysis input hash and therefore invalidates stale assessments.
  const versionKey = hashValue({
    schema: String(nextPage.fingerprintVersion || 'legacy-derived.v1'),
    componentHashes,
  });
  const migratedFromLegacy = Boolean(
    previousTracking.currentVersionKey
    && String(previousTracking.fingerprintVersion || '').startsWith('legacy-derived')
    && !String(nextPage.fingerprintVersion || '').startsWith('legacy-derived')
  );
  const provisionalBaseline = !previousTracking.currentVersionKey;
  const priorVersionedObservation = Boolean(
    provisionalBaseline
    && previousTracking.fingerprintVersion
    && !String(previousTracking.fingerprintVersion).startsWith('legacy-derived')
    && Object.keys(previousTracking.fingerprintEvidence?.statuses || {}).length
  );
  const changedComponents = migratedFromLegacy || (provisionalBaseline && !priorVersionedObservation)
    ? []
    : componentChanges(previousTrustedComponentHashes, componentHashes, nextPage, {
      currentTrusted,
      previousFingerprintVersion: String(previousTracking.fingerprintVersion || ''),
    });
  const affectedDetectors = detectorNamesForComponents(changedComponents);
  const production = productionEvidenceForVersion({
    previousTracking,
    provenance: manifestMetadata.provenance,
    versionKey,
    now: observedAt,
  });
  const detectorProduction = production;
  const sameContentVersion = previousTracking.currentVersionKey === versionKey;
  const priorProductionVerified = Boolean(
    validDate(previousTracking.production?.effectiveAt)
    && ['manifest_ready_at', 'runtime_marker_observed'].includes(
      String(previousTracking.production?.source || '')
    )
  );
  const productionPromoted = Boolean(
    sameContentVersion
    && !priorProductionVerified
    && validDate(production.effectiveAt)
    && ['manifest_ready_at', 'runtime_marker_observed'].includes(String(production.source || ''))
  );
  const occurrenceKey = sameContentVersion && previousTracking.currentOccurrenceKey && !productionPromoted
    ? String(previousTracking.currentOccurrenceKey)
    : hashValue({
      versionKey,
      deploymentId: production.deploymentId || '',
      productionEffectiveAt: isoDate(production.effectiveAt),
      productionPrecision: production.precision,
    });
  const lastGoogleCrawlAt = validDate(previousTracking.lastGoogleCrawlAt);
  const detectors = { ...(previousTracking.detectors || {}) };
  const establishingVersionedLineage = provisionalBaseline || migratedFromLegacy;
  const legacyMaterialChangedAt = validDate(previousTracking.materialChangedAt);
  if (establishingVersionedLineage && legacyMaterialChangedAt) {
    const legacyCrawlConfirmed = Boolean(lastGoogleCrawlAt && lastGoogleCrawlAt > legacyMaterialChangedAt);
    for (const detector of Object.keys(DETECTOR_COMPONENTS)) {
      if (detectors[detector]) continue;
      detectors[detector] = {
        versionKey,
        occurrenceKey,
        observedAt: legacyMaterialChangedAt,
        productionEffectiveAt: legacyMaterialChangedAt,
        productionPrecision: 'legacy_baseline',
        productionSource: 'legacy_baseline',
        changedComponents: Array.from(new Set((previousTracking.changedFields || []).map(String))),
        legacyCooldownCarryover: true,
        crawlConfirmationRequired: !legacyCrawlConfirmed,
        confirmedCrawlAt: legacyCrawlConfirmed ? lastGoogleCrawlAt : null,
      };
    }
  }
  for (const detector of affectedDetectors) {
    const detectorComponents = changedComponents.filter((component) => DETECTOR_COMPONENTS[detector].includes(component));
    const crawlConfirmed = Boolean(
      lastGoogleCrawlAt
      && detectorProduction.effectiveAt
      && lastGoogleCrawlAt > detectorProduction.effectiveAt
    );
    detectors[detector] = {
      versionKey,
      occurrenceKey,
      observedAt,
      productionEffectiveAt: detectorProduction.effectiveAt,
      productionPrecision: detectorProduction.precision,
      productionSource: detectorProduction.source,
      changedComponents: detectorComponents,
      changedComponentHashes: Object.fromEntries(detectorComponents.map((component) => [
        component,
        safeHash(componentHashes[component]),
      ])),
      awaitingProductionEvidence: !detectorProduction.effectiveAt,
      crawlConfirmationRequired: Boolean(detectorProduction.effectiveAt && !crawlConfirmed),
      confirmedCrawlAt: crawlConfirmed ? lastGoogleCrawlAt : null,
    };
  }
  if (productionPromoted) {
    for (const detector of Object.keys(DETECTOR_COMPONENTS)) {
      const prior = detectors[detector];
      if (!prior?.awaitingProductionEvidence) continue;
      const expectedHashes = Object.entries(prior.changedComponentHashes || {});
      const sameDetectorVersion = prior.versionKey === versionKey;
      const sameChangedComponents = expectedHashes.length > 0 && expectedHashes.every(([component, hash]) => (
        safeHash(componentHashes[component]) === safeHash(hash)
      ));
      if (!sameDetectorVersion && !sameChangedComponents) continue;
      const crawlConfirmed = Boolean(
        lastGoogleCrawlAt
        && production.effectiveAt
        && lastGoogleCrawlAt > production.effectiveAt
      );
      detectors[detector] = {
        ...prior,
        occurrenceKey,
        productionEffectiveAt: production.effectiveAt,
        productionPrecision: production.precision,
        productionSource: production.source,
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: !crawlConfirmed,
        confirmedCrawlAt: crawlConfirmed ? lastGoogleCrawlAt : null,
      };
    }
  }
  const anyDetectorPending = Object.values(detectors).some((value) => value?.crawlConfirmationRequired === true);
  const nextTracking = {
    ...previousTracking,
    fingerprintVersion: String(nextPage.fingerprintVersion || ''),
    currentVersionKey: versionKey,
    currentOccurrenceKey: occurrenceKey,
    componentHashes,
    trustedComponentHashes,
    fingerprintEvidence: nextPage.fingerprintEvidence || {},
    production,
    detectors,
    crawlConfirmationRequired: anyDetectorPending || (
      !previousTracking.currentVersionKey && previousTracking.crawlConfirmationRequired === true
    ),
  };
  if (changedComponents.length) {
    nextTracking.analysisInvalidatedAt = observedAt;
    nextTracking.materialChangedAt = detectorProduction.effectiveAt;
    nextTracking.materialChangeKind = 'component_fingerprint';
    nextTracking.changedFields = changedComponents;
  }
  const analysisPage = {
    ...nextPage,
    intent: existingPage?.intent?.source === 'owner' ? existingPage.intent : nextPage.intent,
    changeTracking: nextTracking,
  };
  nextTracking.analysisInputHash = analysisInputHashForPage(analysisPage);
  return {
    tracking: nextTracking,
    versionKey,
    occurrenceKey,
    changedComponents,
    affectedDetectors,
    production,
    shouldPersistVersion: !previousTracking.currentOccurrenceKey || !sameContentVersion || productionPromoted,
  };
}

function materialFieldsForPage(page = {}) {
  const contentUpdatedAt = validDate(page.contentUpdatedAt);
  return {
    canonical: normalizeCanonicalUrl(page.canonicalUrl),
    title: normalizedMaterialText(page.title),
    description: normalizedMaterialText(page.description),
    h1: normalizedMaterialText(page.h1),
    contentUpdatedAt: contentUpdatedAt ? contentUpdatedAt.toISOString() : '',
  };
}

function materialHashForPage(page) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(materialFieldsForPage(page)))
    .digest('hex');
}

function materialChangeKind(changedFields) {
  const contentChanged = changedFields.includes('contentUpdatedAt');
  const metadataChanged = changedFields.some((field) => field !== 'contentUpdatedAt');
  if (contentChanged && metadataChanged) return 'mixed';
  if (contentChanged) return 'content';
  if (metadataChanged) return 'metadata';
  return 'baseline';
}

function deriveChangeTracking(existingPage, nextPage, now = new Date()) {
  const observedAt = validDate(now) || new Date();
  const existingTracking = existingPage?.changeTracking || {};
  const previousHash = String(existingTracking.materialHash || '');
  const nextHash = materialHashForPage(nextPage);
  let analysisInvalidatedAt = validDate(existingTracking.analysisInvalidatedAt);
  const lastInspectionAt = validDate(existingTracking.lastInspectionAt);
  const lastGoogleCrawlAt = validDate(existingTracking.lastGoogleCrawlAt);
  let materialChangedAt = validDate(existingTracking.materialChangedAt);
  let changedFields = Array.isArray(existingTracking.changedFields)
    ? existingTracking.changedFields.filter((field) => MATERIAL_FIELDS.includes(field))
    : [];
  let kind = String(existingTracking.materialChangeKind || 'baseline');
  let preserveExistingCrawlState = false;

  if (!previousHash) {
    const declaredUpdate = validDate(nextPage?.contentUpdatedAt);
    const recentCutoff = new Date(observedAt.getTime() - RECENT_CONTENT_COOLDOWN_DAYS * DAY_MS);
    const recentlyUpdated = declaredUpdate && declaredUpdate >= recentCutoff && declaredUpdate <= observedAt;
    materialChangedAt = recentlyUpdated ? declaredUpdate : null;
    changedFields = recentlyUpdated ? ['contentUpdatedAt'] : [];
    kind = recentlyUpdated ? 'content' : 'baseline';
  } else if (previousHash !== nextHash) {
    analysisInvalidatedAt = observedAt;
    const before = materialFieldsForPage(existingPage);
    const after = materialFieldsForPage(nextPage);
    const detectedFields = MATERIAL_FIELDS.filter((field) => before[field] !== after[field]);
    if (detectedFields.length === 1 && detectedFields[0] === 'contentUpdatedAt') {
      // A declared content date is stronger evidence than the manifest import
      // time. Only a date that moves beyond the last known material event can
      // start a new cooldown. Regressed or removed dates still become the new
      // hash baseline, but they must not erase an already-observed change or
      // make an older crawl appear to confirm it.
      const previousDeclaredUpdate = validDate(existingPage?.contentUpdatedAt);
      const declaredUpdate = validDate(nextPage?.contentUpdatedAt);
      const comparisonDate = [previousDeclaredUpdate, materialChangedAt]
        .filter(Boolean)
        .reduce((latest, value) => (!latest || value > latest ? value : latest), null);
      const advancesContentDate = Boolean(
        declaredUpdate && (!comparisonDate || declaredUpdate > comparisonDate)
      );
      if (advancesContentDate) {
        changedFields = detectedFields;
        kind = materialChangeKind(changedFields);
        materialChangedAt = declaredUpdate <= observedAt ? declaredUpdate : observedAt;
      } else {
        preserveExistingCrawlState = true;
      }
    } else {
      changedFields = detectedFields;
      kind = materialChangeKind(changedFields);
      materialChangedAt = observedAt;
    }
  }

  const crawlConfirmationRequired = preserveExistingCrawlState
    ? Boolean(existingTracking.crawlConfirmationRequired)
    : Boolean(materialChangedAt && (!lastGoogleCrawlAt || lastGoogleCrawlAt < materialChangedAt));
  return {
    materialHash: nextHash,
    baselineSeededAt: validDate(existingTracking.baselineSeededAt) || observedAt,
    materialChangedAt,
    analysisInvalidatedAt,
    materialChangeKind: kind,
    changedFields,
    lastInspectionAt,
    lastGoogleCrawlAt,
    crawlConfirmationRequired,
  };
}

function loadSeoManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  // The generated manifest is deployed with the backend function. Requiring it
  // keeps startup deterministic and avoids runtime filesystem writes.
  delete require.cache[require.resolve(manifestPath)];
  return require(manifestPath);
}

function manifestSourceContract(manifest = {}) {
  // Keep this shape in lockstep with the frontend generator's `stable`
  // payload. generatedAt/provenance are deployment evidence and sourceHash is
  // the signature itself, so none of them participates in the content hash.
  return {
    version: manifest.version,
    property: manifest.property,
    fingerprintVersion: manifest.fingerprintVersion,
    provenanceVersion: manifest.provenanceVersion,
    pages: Array.isArray(manifest.pages) ? manifest.pages : [],
  };
}

function manifestSourceHash(manifest = {}) {
  return hashValue(manifestSourceContract(manifest));
}

function normalizeManifest(manifest, expectedSiteUrl = null) {
  if (manifest?.version !== 'seo-page-manifest.v1' || !Array.isArray(manifest.pages)) {
    throw new Error('Unsupported SEO page manifest');
  }
  if (expectedSiteUrl && manifest.property !== expectedSiteUrl) {
    throw new Error('SEO page manifest property does not match GSC_SITE_URL');
  }
  const computedSourceHash = manifestSourceHash(manifest);
  if (Object.prototype.hasOwnProperty.call(manifest, 'sourceHash')) {
    const declaredSourceHash = safeHash(manifest.sourceHash);
    if (!declaredSourceHash || declaredSourceHash !== computedSourceHash) {
      throw new Error('SEO page manifest source hash does not match its content');
    }
  }
  const fingerprintSchemaVersion = safeMetadataToken(
    manifest.fingerprintSchemaVersion || manifest.fingerprintVersion || manifest.fingerprints?.schemaVersion,
    80
  );
  const provenance = normalizeManifestProvenance(manifest);
  const pages = [];
  const seen = new Set();
  for (const input of manifest.pages) {
    const canonicalUrl = validateFrontendAtlasUrl(input?.canonicalUrl);
    if (!canonicalUrl) continue;
    const pageKey = pageKeyForUrl(canonicalUrl);
    if (input.pageKey && input.pageKey !== pageKey) throw new Error(`SEO page manifest key mismatch for ${canonicalUrl}`);
    if (seen.has(pageKey)) throw new Error(`Duplicate SEO page manifest URL: ${canonicalUrl}`);
    seen.add(pageKey);
    const outboundPaths = Array.from(new Set((input.outboundLinks || [])
      .map((value) => {
        try {
          const url = new URL(String(value || ''), 'https://frontendatlas.com');
          if (url.origin !== 'https://frontendatlas.com' || url.search || url.hash) return '';
          return url.pathname.replace(/\/+$/, '') || '/';
        } catch {
          return '';
        }
      })
      .filter(Boolean)));
    const fingerprint = componentHashesForManifestPage(input, { fingerprintSchemaVersion });
    const contentUpdatedAt = validDate(input.updatedAt || input.contentUpdatedAt);
    const intent = {
      targetKeyword: String(input.targetKeyword || ''),
      intendedIntent: String(input.intendedIntent || ''),
      readerPromise: String(input.readerPromise || ''),
      source: ['explicit', 'derived'].includes(input.intentSource) ? input.intentSource : 'manifest',
      confirmed: Boolean(input.intentConfirmed),
      confirmedAt: null,
    };
    pages.push({
      pageKey,
      canonicalUrl: normalizeCanonicalUrl(canonicalUrl),
      renderedCanonicalUrl: Object.prototype.hasOwnProperty.call(input, 'renderedCanonicalUrl')
        ? normalizeCanonicalUrl(input.renderedCanonicalUrl)
        : normalizeCanonicalUrl(canonicalUrl),
      path: String(input.path || new URL(canonicalUrl).pathname),
      family: String(input.family || 'unknown'),
      tech: String(input.tech || ''),
      indexable: input.indexable !== false,
      robots: String(input.robots || (input.indexable === false ? 'noindex,follow' : 'index,follow')),
      title: String(input.title || ''),
      description: String(input.description || ''),
      h1: String(input.h1 || ''),
      contentUpdatedAt,
      targetKeyword: String(input.targetKeyword || ''),
      intendedIntent: String(input.intendedIntent || ''),
      readerPromise: String(input.readerPromise || ''),
      intentSource: ['explicit', 'derived'].includes(input.intentSource) ? input.intentSource : 'manifest',
      intentConfirmed: Boolean(input.intentConfirmed),
      intent,
      outboundLinks: outboundPaths,
      ...fingerprint,
    });
  }
  return {
    version: manifest.version,
    property: manifest.property || null,
    sourceHash: computedSourceHash,
    generatedAt: manifest.generatedAt || null,
    fingerprintSchemaVersion,
    provenance,
    pages,
  };
}

function buildInternalLinkMetadata(pages) {
  const byPath = new Map(pages.map((page) => [page.path.replace(/\/+$/, '') || '/', page]));
  const byPageKey = new Map(pages.map((page) => [page.pageKey, page]));
  const inbound = new Map(pages.map((page) => [page.pageKey, new Set()]));
  const outgoingKeys = new Map();
  for (const source of pages) {
    const targets = new Set();
    for (const pathValue of source.outboundLinks) {
      const target = byPath.get(pathValue.replace(/\/+$/, '') || '/');
      if (!target || target.pageKey === source.pageKey) continue;
      targets.add(target.pageKey);
    }
    outgoingKeys.set(source.pageKey, targets);
    for (const targetKey of targets) inbound.get(targetKey)?.add(source.pageKey);
  }

  return new Map(pages.map((target) => {
    const existingSources = inbound.get(target.pageKey) || new Set();
    const sourceEvidence = Array.from(existingSources).sort().map((pageKey) => {
      const source = byPageKey.get(pageKey);
      const targetEdge = (source?.internalLinkEdges || [])
        .find((edge) => edge.route === (target.path.replace(/\/+$/, '') || '/'));
      return {
        pageKey,
        linkHash: safeHash(targetEdge?.hash || source?.componentHashes?.internalLinks),
        precision: targetEdge?.hash ? 'target_edge' : 'source_page_fallback',
      };
    });
    const candidates = pages
      .filter((source) => (
        source.indexable &&
        source.pageKey !== target.pageKey &&
        !existingSources.has(source.pageKey) &&
        !outgoingKeys.get(source.pageKey)?.has(target.pageKey) &&
        ((target.tech && source.tech === target.tech) || source.family === target.family)
      ))
      .sort((left, right) => {
        const leftScore = Number(left.family === target.family) + Number(Boolean(target.tech) && left.tech === target.tech);
        const rightScore = Number(right.family === target.family) + Number(Boolean(target.tech) && right.tech === target.tech);
        return rightScore - leftScore || left.path.localeCompare(right.path);
      })
      .slice(0, 10)
      .map((source) => source.pageKey);
    return [target.pageKey, {
      inboundCount: existingSources.size,
      sourcePageKeys: Array.from(existingSources).sort(),
      sourceEvidence,
      donorPageKeys: candidates,
      graphHash: hashValue({
        sourceEvidence,
      }),
    }];
  }));
}

function internalLinkGraphDependencies(previousEvidence = [], nextEvidence = [], {
  activePageKeys = new Set(),
  inspectableSourcePageKeys = new Set(),
} = {}) {
  const prior = new Map((previousEvidence || [])
    .map((item) => [String(item?.pageKey || ''), safeHash(item?.linkHash)]));
  const next = new Map((nextEvidence || [])
    .map((item) => [String(item?.pageKey || ''), safeHash(item?.linkHash)]));
  const dependencyPageKeys = Array.from(new Set([...prior.keys(), ...next.keys()]))
    .filter(Boolean)
    .filter((key) => prior.get(key) !== next.get(key))
    .sort();
  const unverifiableDependencyPageKeys = dependencyPageKeys
    .filter((key) => !activePageKeys.has(key) || !inspectableSourcePageKeys.has(key));
  const inspectableDependencyPageKeys = dependencyPageKeys
    .filter((key) => activePageKeys.has(key) && inspectableSourcePageKeys.has(key));
  return { dependencyPageKeys, inspectableDependencyPageKeys, unverifiableDependencyPageKeys };
}

async function syncSeoManifest({
  manifest = null,
  manifestPath = DEFAULT_MANIFEST_PATH,
  expectedSiteUrl = null,
  now = new Date(),
  productionMarker,
  loadProductionMarker = null,
  requireProductionMarker = String(process.env.VERCEL_ENV || '') === 'production',
} = {}) {
  const normalized = normalizeManifest(manifest || loadSeoManifest(manifestPath), expectedSiteUrl);
  let marker = productionMarker;
  if (marker === undefined && (loadProductionMarker || requireProductionMarker)) {
    try {
      marker = loadProductionMarker
        ? await loadProductionMarker()
        : await fetchProductionBuildMarker();
    } catch {
      marker = null;
    }
  }
  const markerState = marker === undefined
    ? { ready: false, reason: 'production_marker_not_requested' }
    : normalizeProductionMarker(marker, {
      sourceHash: normalized.sourceHash,
      fingerprintVersion: normalized.fingerprintSchemaVersion,
      manifestVersion: normalized.version,
      observedAt: now,
    });
  const productionMarkerState = {
    productionMarkerReady: markerState.ready === true,
    productionMarkerReason: markerState.reason,
  };
  if (requireProductionMarker && !markerState.ready) {
    return {
      version: normalized.version,
      pages: normalized.pages.length,
      changedPages: 0,
      pendingCrawlPages: 0,
      versionsRecorded: 0,
      ready: false,
      reason: markerState.reason,
      ...productionMarkerState,
    };
  }
  normalized.provenance.marker = markerState.ready ? markerState : null;
  if (!normalized.pages.length) {
    return {
      version: normalized.version,
      pages: 0,
      ready: true,
      reason: markerState.ready ? markerState.reason : 'local_manifest_observation',
      ...productionMarkerState,
    };
  }
  const pageKeys = normalized.pages.map((page) => page.pageKey);
  const activePageKeys = new Set(pageKeys);
  const inspectableSourcePageKeys = new Set(normalized.pages
    .filter((page) => page.indexable === true && validateFrontendAtlasUrl(page.canonicalUrl))
    .map((page) => page.pageKey));
  const existingPages = await SeoPage.find({ pageKey: { $in: pageKeys } })
    .select('pageKey canonicalUrl title description h1 contentUpdatedAt intent outboundLinks outboundLinkEdges internalLinks changeTracking')
    .lean();
  const existingByKey = new Map(existingPages.map((page) => [page.pageKey, page]));
  for (const page of normalized.pages) {
    if (
      page.fingerprintEvidence?.statuses?.internalLinks === 'unavailable'
      && existingByKey.has(page.pageKey)
    ) {
      page.outboundLinks = Array.from(new Set(existingByKey.get(page.pageKey)?.outboundLinks || []));
      page.internalLinkEdges = existingByKey.get(page.pageKey)?.outboundLinkEdges || [];
      const priorLinkHash = safeHash(
        existingByKey.get(page.pageKey)?.changeTracking?.componentHashes?.internalLinks
      );
      if (priorLinkHash) page.componentHashes.internalLinks = priorLinkHash;
    }
  }
  const links = buildInternalLinkMetadata(normalized.pages);
  await SeoPage.updateMany(
    { pageKey: { $nin: pageKeys }, 'manifest.present': true },
    { $set: { 'manifest.present': false } }
  );

  let changedPages = 0;
  const versionOperations = [];
  const versionPageKeys = [];
  let versionsDiscovered = 0;
  let pendingCrawlPages = 0;
  const operations = normalized.pages.flatMap((page) => {
    const existing = existingByKey.get(page.pageKey) || null;
    const linkMetadata = links.get(page.pageKey) || {};
    page.internalLinkGraphHash = linkMetadata.graphHash || '';
    const legacyTracking = deriveChangeTracking(existing, page, now);
    const lineage = derivePageLineage(existing, page, normalized, now);
    let observedDeployment = markerState.ready ? {
      deploymentId: markerState.deployment.deploymentId,
      observedAt: markerState.observedAt,
      effectiveAt: markerState.deployment.readyAt,
      precision: markerState.deployment.precision,
      source: markerState.deployment.source,
      gitCommitSha: markerState.deployment.gitSha,
    } : {
      deploymentId: normalized.provenance.deployment?.deploymentId || '',
      observedAt: now,
      effectiveAt: normalized.provenance.deployment?.readyAt || null,
      precision: normalized.provenance.deployment?.readyAtExact ? 'exact' : 'unknown',
      source: normalized.provenance.deployment?.readyAtExact ? 'manifest_ready_at' : 'unknown',
      gitCommitSha: normalized.provenance.git?.commitSha || '',
    };
    const priorObservedDeployment = existing?.changeTracking?.lastObservedDeployment;
    if (
      observedDeployment.deploymentId
      && priorObservedDeployment?.deploymentId === observedDeployment.deploymentId
    ) {
      observedDeployment = {
        ...observedDeployment,
        observedAt: validDate(priorObservedDeployment.observedAt) || observedDeployment.observedAt,
        effectiveAt: validDate(priorObservedDeployment.effectiveAt) || observedDeployment.effectiveAt,
        precision: priorObservedDeployment.precision || observedDeployment.precision,
        source: priorObservedDeployment.source || observedDeployment.source,
      };
    }
    lineage.tracking.lastObservedDeployment = observedDeployment;
    const previousGraphHash = safeHash(existing?.internalLinks?.graphHash);
    const nextGraphHash = safeHash(linkMetadata.graphHash);
    if (previousGraphHash && nextGraphHash && previousGraphHash !== nextGraphHash) {
      const { inspectableDependencyPageKeys, unverifiableDependencyPageKeys } = internalLinkGraphDependencies(
        existing?.internalLinks?.sourceEvidence,
        linkMetadata.sourceEvidence,
        { activePageKeys, inspectableSourcePageKeys }
      );
      const graphProduction = productionEvidenceForVersion({
        previousTracking: {},
        provenance: normalized.provenance,
        versionKey: `internal-link-graph:${nextGraphHash}`,
        now,
      });
      lineage.tracking.detectors.internal_link = {
        versionKey: `graph:${nextGraphHash}`,
        occurrenceKey: lineage.occurrenceKey,
        observedAt: now,
        productionEffectiveAt: graphProduction.effectiveAt,
        productionPrecision: graphProduction.precision,
        productionSource: graphProduction.source,
        changedComponents: ['internalLinks'],
        changedComponentHashes: { internalLinks: nextGraphHash },
        awaitingProductionEvidence: !graphProduction.effectiveAt,
        dependencyPageKeys: inspectableDependencyPageKeys,
        unverifiableDependencyPageKeys,
        sourceRecrawlNotEvaluable: unverifiableDependencyPageKeys.length > 0,
        awaitingSourceRecrawl: unverifiableDependencyPageKeys.length === 0
          && inspectableDependencyPageKeys.length > 0,
        crawlConfirmationRequired: false,
        confirmedCrawlAt: null,
      };
      lineage.tracking.analysisInvalidatedAt = now;
      lineage.tracking.analysisInputHash = analysisInputHashForPage({
        ...page,
        internalLinks: linkMetadata,
        intent: existing?.intent?.source === 'owner' ? existing.intent : page.intent,
        changeTracking: lineage.tracking,
      });
    }
    const pendingGraphDetector = lineage.tracking.detectors.internal_link;
    if (
      markerState.ready
      && pendingGraphDetector?.awaitingProductionEvidence === true
      && pendingGraphDetector.versionKey === `graph:${nextGraphHash}`
    ) {
      const graphProduction = productionEvidenceForVersion({
        previousTracking: {},
        provenance: normalized.provenance,
        versionKey: `internal-link-graph:${nextGraphHash}`,
        now,
      });
      lineage.tracking.detectors.internal_link = {
        ...pendingGraphDetector,
        productionEffectiveAt: graphProduction.effectiveAt,
        productionPrecision: graphProduction.precision,
        productionSource: graphProduction.source,
        awaitingProductionEvidence: false,
      };
      lineage.tracking.analysisInputHash = analysisInputHashForPage({
        ...page,
        internalLinks: linkMetadata,
        intent: existing?.intent?.source === 'owner' ? existing.intent : page.intent,
        changeTracking: lineage.tracking,
      });
    }
    const changeTracking = {
      ...legacyTracking,
      ...lineage.tracking,
      // Lineage derives these fields from the detector-scoped state. Keep
      // them after the legacy spread for old readers and inspection queues.
      crawlConfirmationRequired: lineage.tracking.crawlConfirmationRequired,
      analysisInputHash: lineage.tracking.analysisInputHash,
    };
    if (lineage.changedComponents.length) {
      changedPages += 1;
    }
    if (changeTracking.crawlConfirmationRequired) pendingCrawlPages += 1;
    if (lineage.versionKey && lineage.occurrenceKey) {
      const siteUrl = normalized.property || expectedSiteUrl;
      if (lineage.shouldPersistVersion) versionsDiscovered += 1;
      const retryingCurrentOccurrence = existing?.changeTracking?.currentOccurrenceKey === lineage.occurrenceKey;
      const historyChangedComponents = lineage.changedComponents.length
        ? lineage.changedComponents
        : retryingCurrentOccurrence
          ? (existing?.changeTracking?.changedFields || []).filter((component) => (
            FINGERPRINT_COMPONENTS.includes(component)
          ))
          : [];
      const historyAffectedDetectors = lineage.affectedDetectors.length
        ? lineage.affectedDetectors
        : detectorNamesForComponents(historyChangedComponents);
      const historyObservedAt = retryingCurrentOccurrence
        ? validDate(existing?.changeTracking?.analysisInvalidatedAt) || now
        : now;
      versionPageKeys.push(page.pageKey);
      versionOperations.push({
        updateOne: {
          filter: { siteUrl, pageKey: page.pageKey, occurrenceKey: lineage.occurrenceKey },
          update: {
            $setOnInsert: {
              siteUrl,
              pageKey: page.pageKey,
              versionKey: lineage.versionKey,
              occurrenceKey: lineage.occurrenceKey,
              inputHash: lineage.tracking.analysisInputHash,
              fingerprintVersion: page.fingerprintVersion,
              observedAt: historyObservedAt,
              changedComponents: historyChangedComponents,
              affectedDetectors: historyAffectedDetectors,
              componentHashes: lineage.tracking.componentHashes,
              trustedComponentHashes: lineage.tracking.trustedComponentHashes,
              fingerprintEvidence: page.fingerprintEvidence,
              manifest: {
                version: normalized.version,
                sourceHash: normalized.sourceHash,
                generatedAt: validDate(normalized.generatedAt),
              },
              production: lineage.production,
              crawl: {
                googleCrawlAt: null,
                confirmedAt: null,
                confirmedDetectors: [],
              },
            },
          },
          upsert: true,
        },
      });
    }
    const update = {
      canonicalUrl: page.canonicalUrl,
      renderedCanonicalUrl: page.renderedCanonicalUrl,
      path: page.path,
      family: page.family,
      tech: page.tech,
      indexable: page.indexable,
      robots: page.robots,
      title: page.title,
      description: page.description,
      h1: page.h1,
      contentUpdatedAt: Number.isNaN(page.contentUpdatedAt?.getTime()) ? null : page.contentUpdatedAt,
      manifestVersion: normalized.version,
      manifest: {
        present: true,
        sourceHash: normalized.sourceHash,
        generatedAt: normalized.generatedAt ? new Date(normalized.generatedAt) : null,
      },
      outboundLinks: page.outboundLinks,
      outboundLinkEdges: page.internalLinkEdges,
      internalLinks: linkMetadata,
      changeTracking,
      lastSeenAt: now,
    };
    return [{
      updateOne: {
        filter: { pageKey: page.pageKey },
        update: { $set: update, $setOnInsert: { firstSeenAt: now } },
        upsert: true,
      },
    }, {
      updateOne: {
        filter: { pageKey: page.pageKey, 'intent.source': { $ne: 'owner' } },
        update: {
          $set: {
            'intent.targetKeyword': page.targetKeyword,
            'intent.intendedIntent': page.intendedIntent,
            'intent.readerPromise': page.readerPromise,
            'intent.source': page.intentSource,
            'intent.confirmed': page.intentConfirmed,
            'intent.confirmedAt': page.intentConfirmed ? now : null,
          },
        },
      },
    }];
  });
  await SeoPage.bulkWrite(operations, { ordered: true });
  if (versionOperations.length) {
    await SeoPageVersion.bulkWrite(versionOperations, { ordered: false });
    const staleVersionGroups = await SeoPageVersion.aggregate([
      {
        $match: {
          siteUrl: normalized.property || expectedSiteUrl,
          pageKey: { $in: Array.from(new Set(versionPageKeys)) },
        },
      },
      { $sort: { pageKey: 1, observedAt: -1, _id: -1 } },
      { $group: { _id: '$pageKey', ids: { $push: '$_id' } } },
      {
        $project: {
          stale: {
            $slice: ['$ids', MAX_PAGE_VERSION_HISTORY, { $size: '$ids' }],
          },
        },
      },
    ]);
    const staleVersionIds = staleVersionGroups.flatMap((group) => group.stale || []);
    if (staleVersionIds.length) await SeoPageVersion.deleteMany({ _id: { $in: staleVersionIds } });
  }
  // Keep the previous compact packet as explicitly stale evidence. Current
  // reads and refresh scheduling compare inputHash/pageVersionKey, so a page
  // change cannot masquerade as current while unaffected detector evidence
  // remains inspectable until the next analysis overwrites the latest row.
  return {
    version: normalized.version,
    pages: normalized.pages.length,
    changedPages,
    pendingCrawlPages,
    versionsRecorded: versionsDiscovered,
    ready: true,
    reason: markerState.ready ? markerState.reason : 'local_manifest_observation',
    ...productionMarkerState,
  };
}

module.exports = {
  DEFAULT_MANIFEST_PATH,
  DEFAULT_PRODUCTION_MARKER_URL,
  DETECTOR_COMPONENTS,
  FINGERPRINT_COMPONENTS,
  MAX_PAGE_VERSION_HISTORY,
  MATERIAL_FIELDS,
  RECENT_CONTENT_COOLDOWN_DAYS,
  analysisInputHashForPage,
  buildInternalLinkMetadata,
  componentHashesForManifestPage,
  derivePageLineage,
  deriveChangeTracking,
  fetchProductionBuildMarker,
  internalLinkGraphDependencies,
  loadSeoManifest,
  materialFieldsForPage,
  materialHashForPage,
  normalizeManifest,
  normalizeProductionMarker,
  syncSeoManifest,
};
