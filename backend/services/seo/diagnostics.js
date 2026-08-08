'use strict';

const crypto = require('crypto');
const SeoDiagnosticSnapshot = require('../../models/SeoDiagnosticSnapshot');
const SeoPage = require('../../models/SeoPage');
const { analysisInputHashForPage } = require('./manifest');
const { normalizePageIdentityUrl, validateFrontendAtlasUrl } = require('./keys');

const FRONTENDATLAS_ORIGIN = 'https://frontendatlas.com';
const METADATA_FIELDS = Object.freeze(['title', 'description', 'h1', 'canonical', 'robots']);
const DEFAULT_METADATA_TIMEOUT_MS = 8_000;
const DEFAULT_METADATA_MAX_BYTES = 512 * 1024;
const DEFAULT_MAX_REDIRECTS = 4;
const DEFAULT_INSPECTION_LIMIT = 5;
const MAX_INSPECTION_LIMIT = 10;
const MAX_INSPECTION_CANDIDATES = 100;
const DEFAULT_INSPECTION_FRESHNESS_DAYS = 7;
const SNAPSHOT_TTL_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const DETECTOR_TYPES = Object.freeze([
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
  'internal_link',
  'technical_indexing',
]);

class SeoDiagnosticError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SeoDiagnosticError';
    this.code = code;
  }
}

function diagnosticError(code) {
  const messages = {
    INVALID_URL: 'The live metadata URL is not allowed.',
    REDIRECT_NOT_ALLOWED: 'The live metadata redirect was not allowed.',
    TOO_MANY_REDIRECTS: 'The live metadata request exceeded its redirect limit.',
    RESPONSE_TOO_LARGE: 'The live metadata response exceeded its size limit.',
    UNSUPPORTED_CONTENT: 'The live metadata response was not HTML.',
    REQUEST_TIMEOUT: 'The live metadata request timed out.',
    REQUEST_FAILED: 'The live metadata request failed.',
  };
  return new SeoDiagnosticError(code, messages[code] || messages.REQUEST_FAILED);
}

function safeFrontendAtlasUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || ''));
  } catch {
    return null;
  }
  if (
    parsed.origin !== FRONTENDATLAS_ORIGIN ||
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password
  ) return null;
  parsed.hash = '';
  return parsed;
}

function cleanText(value, maxLength) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hexadecimal = entity[1]?.toLowerCase() === 'x';
      const number = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(number) && number >= 0 && number <= 0x10ffff
        ? String.fromCodePoint(number)
        : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function parseAttributes(tag) {
  const attributes = Object.create(null);
  const body = String(tag || '').replace(/^<\/?[a-z0-9:-]+\s*/i, '').replace(/\/?\s*>$/, '');
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(body))) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function firstElementText(html, tagName, maxLength) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'i').exec(html);
  return cleanText(match?.[1] || '', maxLength);
}

function parseLiveMetadata(html) {
  const safeHtml = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  let description = '';
  let robots = '';
  for (const tag of safeHtml.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = parseAttributes(tag);
    const name = String(attributes.name || attributes.property || '').trim().toLowerCase();
    if (name === 'description' && !description) description = cleanText(attributes.content, 2_000);
    if ((name === 'robots' || name === 'googlebot') && !robots) robots = cleanText(attributes.content, 500);
  }
  let canonical = '';
  for (const tag of safeHtml.match(/<link\b[^>]*>/gi) || []) {
    const attributes = parseAttributes(tag);
    const rels = String(attributes.rel || '').toLowerCase().split(/\s+/);
    if (rels.includes('canonical')) {
      canonical = cleanText(attributes.href, 2_048);
      break;
    }
  }
  return {
    title: firstElementText(safeHtml, 'title', 1_000),
    description,
    h1: firstElementText(safeHtml, 'h1', 1_000),
    canonical,
    robots,
  };
}

async function responseBytes(response, maxBytes) {
  const declaredLength = Number(response?.headers?.get?.('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw diagnosticError('RESPONSE_TOO_LARGE');

  const chunks = [];
  let total = 0;
  const addChunk = (input) => {
    const chunk = Buffer.isBuffer(input) ? input : Buffer.from(input);
    total += chunk.length;
    if (total > maxBytes) throw diagnosticError('RESPONSE_TOO_LARGE');
    chunks.push(chunk);
  };

  if (response?.body?.getReader) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        addChunk(value);
      }
    } catch (error) {
      if (error instanceof SeoDiagnosticError) await reader.cancel().catch(() => {});
      throw error;
    } finally {
      reader.releaseLock?.();
    }
  } else if (response?.body?.[Symbol.asyncIterator]) {
    for await (const chunk of response.body) addChunk(chunk);
  } else if (typeof response?.arrayBuffer === 'function') {
    addChunk(await response.arrayBuffer());
  } else if (typeof response?.text === 'function') {
    addChunk(Buffer.from(await response.text(), 'utf8'));
  } else {
    throw diagnosticError('REQUEST_FAILED');
  }
  return Buffer.concat(chunks, total);
}

function metadataHash(fields) {
  const stable = Object.fromEntries(METADATA_FIELDS.map((field) => [field, String(fields?.[field] || '')]));
  return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

async function captureLiveMetadataSnapshot(url, {
  fetchImpl = global.fetch,
  now = () => new Date(),
  timeoutMs = DEFAULT_METADATA_TIMEOUT_MS,
  maxBytes = DEFAULT_METADATA_MAX_BYTES,
  maxRedirects = DEFAULT_MAX_REDIRECTS,
  AbortControllerImpl = global.AbortController,
} = {}) {
  let currentUrl = safeFrontendAtlasUrl(url);
  if (!currentUrl) throw diagnosticError('INVALID_URL');
  if (typeof fetchImpl !== 'function') throw diagnosticError('REQUEST_FAILED');
  const boundedTimeout = Math.max(1, Math.min(Number(timeoutMs) || DEFAULT_METADATA_TIMEOUT_MS, 30_000));
  const boundedBytes = Math.max(1_024, Math.min(Number(maxBytes) || DEFAULT_METADATA_MAX_BYTES, 2 * 1024 * 1024));
  const boundedRedirects = Math.max(0, Math.min(Number(maxRedirects) || 0, 8));
  const controller = AbortControllerImpl ? new AbortControllerImpl() : null;
  let timedOut = false;
  const timeout = controller ? setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, boundedTimeout) : null;

  try {
    for (let redirectCount = 0; redirectCount <= boundedRedirects; redirectCount += 1) {
      let response;
      try {
        response = await fetchImpl(currentUrl.toString(), {
          method: 'GET',
          redirect: 'manual',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'FrontendAtlasSeoDiagnostics/1.0',
          },
          ...(controller ? { signal: controller.signal } : {}),
        });
      } catch (error) {
        if (timedOut || error?.name === 'AbortError') throw diagnosticError('REQUEST_TIMEOUT');
        throw diagnosticError('REQUEST_FAILED');
      }

      if (response.status >= 300 && response.status < 400) {
        if (redirectCount >= boundedRedirects) throw diagnosticError('TOO_MANY_REDIRECTS');
        const location = response.headers?.get?.('location');
        let redirected;
        try {
          redirected = safeFrontendAtlasUrl(new URL(String(location || ''), currentUrl).toString());
        } catch {
          redirected = null;
        }
        if (!redirected) throw diagnosticError('REDIRECT_NOT_ALLOWED');
        currentUrl = redirected;
        continue;
      }
      if (!response.ok) throw diagnosticError('REQUEST_FAILED');
      const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw diagnosticError('UNSUPPORTED_CONTENT');
      }
      const html = (await responseBytes(response, boundedBytes)).toString('utf8');
      const fields = parseLiveMetadata(html);
      const observedAt = new Date(typeof now === 'function' ? now() : now);
      return {
        url: safeFrontendAtlasUrl(url).toString(),
        finalUrl: currentUrl.toString(),
        observedAt,
        hash: metadataHash(fields),
        fields,
      };
    }
    throw diagnosticError('TOO_MANY_REDIRECTS');
  } catch (error) {
    if (error instanceof SeoDiagnosticError) throw error;
    throw diagnosticError(timedOut ? 'REQUEST_TIMEOUT' : 'REQUEST_FAILED');
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function safeString(value, maxLength = 300) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function safeVerdict(value) {
  const verdict = safeString(value, 40).toUpperCase();
  return ['PASS', 'PARTIAL', 'FAIL', 'NEUTRAL'].includes(verdict) ? verdict : 'UNKNOWN';
}

function safeRobots(value) {
  const robots = safeString(value, 40).toUpperCase();
  if (robots === 'ALLOWED') return 'ALLOWED';
  if (['BLOCKED', 'DISALLOWED'].includes(robots)) return 'BLOCKED';
  return 'UNKNOWN';
}

function safeCrawlTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function comparableUrl(value) {
  try {
    return normalizePageIdentityUrl(String(value || ''));
  } catch {
    return '';
  }
}

function canonicalInspectionVerdict(status, expectedUrl) {
  const expected = comparableUrl(expectedUrl);
  const googleCanonical = comparableUrl(status?.googleCanonical);
  const userCanonical = comparableUrl(status?.userCanonical);
  if (!expected || (!googleCanonical && !userCanonical)) return 'unknown';
  if (googleCanonical) return googleCanonical === expected ? 'match' : 'mismatch';
  return userCanonical && userCanonical !== expected ? 'mismatch' : 'unknown';
}

function sanitizeInspectionResult(result, expectedUrl) {
  const status = result?.indexStatusResult && typeof result.indexStatusResult === 'object'
    ? result.indexStatusResult
    : {};
  const lastCrawlTime = safeCrawlTime(status.lastCrawlTime);
  return {
    indexStatus: safeVerdict(status.verdict),
    coverageState: safeString(status.coverageState, 300),
    robots: safeRobots(status.robotsTxtState),
    canonicalVerdict: canonicalInspectionVerdict(status, expectedUrl),
    ...(lastCrawlTime ? { lastCrawlTime } : {}),
  };
}

function candidateImpressions(candidate) {
  const possible = [
    candidate?.impressions,
    candidate?.currentImpressions,
    candidate?.visibility?.impressions,
    candidate?.metrics?.impressions,
    candidate?.current?.impressions,
  ];
  const found = possible.find((value) => Number.isFinite(Number(value)));
  return found === undefined ? null : Number(found);
}

function pendingDetectorChanges(changeTracking = {}) {
  return DETECTOR_TYPES.filter((detector) => (
    changeTracking.detectors?.[detector]?.crawlConfirmationRequired === true
  ));
}

function hasPendingCrawl(changeTracking = {}) {
  return pendingDetectorChanges(changeTracking).length > 0
    || changeTracking.crawlConfirmationRequired === true;
}

function detectorEffectiveAt(changeTracking = {}) {
  return pendingDetectorChanges(changeTracking).reduce((latest, detector) => {
    const raw = changeTracking.detectors?.[detector]?.productionEffectiveAt;
    if (!raw) return latest;
    const value = new Date(raw);
    return !Number.isNaN(value.getTime()) && (!latest || value > latest) ? value : latest;
  }, null);
}

function isInspectionCandidate(candidate) {
  if (!candidate || candidate.indexable !== true || candidate.manifest?.present !== true) return false;
  if (!candidate.pageKey || !validateFrontendAtlasUrl(candidate.canonicalUrl)) return false;
  const impressions = candidateImpressions(candidate);
  const zeroVisibility = impressions === 0;
  const canonicalAnomaly = candidate.canonicalAnomaly === true || candidate.diagnostics?.canonicalAnomaly === true;
  const inspectionAnomaly = candidate.inspectionAnomaly === true || candidate.diagnostics?.inspectionAnomaly === true;
  const changePending = candidate.changePending === true
    || hasPendingCrawl(candidate.changeTracking);
  const forcedInspection = candidate.forceInspection === true;
  return zeroVisibility || canonicalAnomaly || inspectionAnomaly || changePending || forcedInspection;
}

async function leanResult(query) {
  if (query && typeof query.select === 'function') query = query.select({ pageKey: 1, _id: 0 });
  if (query && typeof query.lean === 'function') query = query.lean();
  return query;
}

async function persistInspectionPageState({ snapshots, pageModel, versionModel = null } = {}) {
  if (!pageModel || typeof pageModel.find !== 'function' || typeof pageModel.bulkWrite !== 'function') return 0;
  const sanitizedSnapshots = (Array.isArray(snapshots) ? snapshots : [])
    .filter((snapshot) => snapshot?.pageKey && snapshot?.observedAt);
  if (!sanitizedSnapshots.length) return 0;
  let query = pageModel.find({ pageKey: { $in: sanitizedSnapshots.map((snapshot) => snapshot.pageKey) } });
  if (typeof query.select === 'function') {
    query = query.select('pageKey intent changeTracking');
  }
  if (typeof query.lean === 'function') query = query.lean();
  const pages = await query;
  const byPageKey = new Map((Array.isArray(pages) ? pages : []).map((page) => [String(page.pageKey), page]));
  const operations = [];
  const versionOperations = [];
  for (const snapshot of sanitizedSnapshots) {
    const page = byPageKey.get(String(snapshot.pageKey));
    if (!page) continue;
    const observedAt = new Date(snapshot.observedAt);
    if (Number.isNaN(observedAt.getTime())) continue;
    const priorInspectionAt = page.changeTracking?.lastInspectionAt
      ? new Date(page.changeTracking.lastInspectionAt)
      : null;
    const crawlIso = safeCrawlTime(snapshot.data?.lastCrawlTime);
    const reportedCrawlAt = crawlIso ? new Date(crawlIso) : null;
    const priorCrawlAt = page.changeTracking?.lastGoogleCrawlAt
      ? new Date(page.changeTracking.lastGoogleCrawlAt)
      : null;
    const effectiveCrawlAt = reportedCrawlAt && (!priorCrawlAt || reportedCrawlAt > priorCrawlAt)
      ? reportedCrawlAt
      : priorCrawlAt;
    const tracking = page.changeTracking || {};
    const materialChangedAt = tracking.materialChangedAt
      ? new Date(page.changeTracking.materialChangedAt)
      : null;
    const set = {
      'changeTracking.lastInspectionAt': priorInspectionAt && priorInspectionAt > observedAt
        ? priorInspectionAt
        : observedAt,
    };
    if (effectiveCrawlAt && !Number.isNaN(effectiveCrawlAt.getTime())) {
      set['changeTracking.lastGoogleCrawlAt'] = effectiveCrawlAt;
    }
    const nextDetectors = { ...(tracking.detectors || {}) };
    const confirmedDetectors = [];
    for (const detector of DETECTOR_TYPES) {
      const prior = tracking.detectors?.[detector];
      if (!prior) continue;
      const productionEffectiveAt = new Date(prior.productionEffectiveAt || 0);
      const canConfirm = effectiveCrawlAt
        && !Number.isNaN(productionEffectiveAt.getTime())
        && effectiveCrawlAt > productionEffectiveAt;
      if (prior.crawlConfirmationRequired === true && canConfirm) {
        nextDetectors[detector] = {
          ...prior,
          crawlConfirmationRequired: false,
          confirmedCrawlAt: effectiveCrawlAt,
        };
        confirmedDetectors.push(detector);
        set[`changeTracking.detectors.${detector}`] = nextDetectors[detector];
      }
    }
    const lineageAvailable = Boolean(tracking.currentVersionKey);
    if (lineageAvailable) {
      const stillPending = DETECTOR_TYPES.some((detector) => (
        nextDetectors[detector]?.crawlConfirmationRequired === true
      ));
      set['changeTracking.crawlConfirmationRequired'] = stillPending;
    } else if (materialChangedAt && !Number.isNaN(materialChangedAt.getTime())) {
      set['changeTracking.crawlConfirmationRequired'] = !effectiveCrawlAt || effectiveCrawlAt <= materialChangedAt;
    }
    if (confirmedDetectors.length) {
      set['changeTracking.analysisInvalidatedAt'] = observedAt;
      const nextPage = {
        ...page,
        changeTracking: {
          ...tracking,
          detectors: nextDetectors,
          lastInspectionAt: set['changeTracking.lastInspectionAt'],
          lastGoogleCrawlAt: effectiveCrawlAt,
          crawlConfirmationRequired: set['changeTracking.crawlConfirmationRequired'],
          analysisInvalidatedAt: observedAt,
        },
      };
      set['changeTracking.analysisInputHash'] = analysisInputHashForPage(nextPage);
      if (versionModel && tracking.currentOccurrenceKey) {
        versionOperations.push({
          updateOne: {
            filter: { pageKey: String(snapshot.pageKey), occurrenceKey: tracking.currentOccurrenceKey },
            update: {
              $set: {
                'crawl.googleCrawlAt': effectiveCrawlAt,
                'crawl.confirmedAt': observedAt,
              },
              $addToSet: { 'crawl.confirmedDetectors': { $each: confirmedDetectors } },
            },
          },
        });
      }
    }
    operations.push({ updateOne: { filter: { pageKey: String(snapshot.pageKey) }, update: { $set: set } } });
  }
  if (!operations.length) return 0;
  const result = await pageModel.bulkWrite(operations, { ordered: false });
  if (versionOperations.length) await versionModel.bulkWrite(versionOperations, { ordered: false });
  return Number(result?.modifiedCount || result?.matchedCount || 0);
}

async function resolveInternalLinkSourceRecrawls({ pageModel = SeoPage, now = new Date() } = {}) {
  let targetQuery = pageModel.find({
    'changeTracking.detectors.internal_link.awaitingSourceRecrawl': true,
  });
  if (typeof targetQuery.select === 'function') {
    targetQuery = targetQuery.select('pageKey intent internalLinks changeTracking');
  }
  if (typeof targetQuery.lean === 'function') targetQuery = targetQuery.lean();
  const targets = await targetQuery;
  if (!Array.isArray(targets) || !targets.length) return 0;
  const dependencyKeys = Array.from(new Set(targets.flatMap((target) => (
    target.changeTracking?.detectors?.internal_link?.dependencyPageKeys || []
  )).map(String)));
  if (!dependencyKeys.length) return 0;
  let sourceQuery = pageModel.find({ pageKey: { $in: dependencyKeys } });
  if (typeof sourceQuery.select === 'function') sourceQuery = sourceQuery.select('pageKey changeTracking.lastGoogleCrawlAt');
  if (typeof sourceQuery.lean === 'function') sourceQuery = sourceQuery.lean();
  const sources = await sourceQuery;
  const sourceByKey = new Map((Array.isArray(sources) ? sources : []).map((page) => [String(page.pageKey), page]));
  const operations = [];
  for (const target of targets) {
    const tracking = target.changeTracking || {};
    const detector = tracking.detectors?.internal_link;
    const effectiveAt = detector?.productionEffectiveAt ? new Date(detector.productionEffectiveAt) : null;
    const keys = Array.from(new Set((detector?.dependencyPageKeys || []).map(String)));
    if (!effectiveAt || Number.isNaN(effectiveAt.getTime()) || !keys.length) continue;
    const crawls = keys.map((key) => {
      const raw = sourceByKey.get(key)?.changeTracking?.lastGoogleCrawlAt;
      return raw ? new Date(raw) : null;
    });
    if (crawls.some((crawl) => !crawl || Number.isNaN(crawl.getTime()) || crawl <= effectiveAt)) continue;
    const confirmedCrawlAt = crawls.reduce((latest, crawl) => (crawl > latest ? crawl : latest), crawls[0]);
    const nextDetector = {
      ...detector,
      awaitingSourceRecrawl: false,
      crawlConfirmationRequired: false,
      confirmedCrawlAt,
    };
    const nextTracking = {
      ...tracking,
      detectors: { ...(tracking.detectors || {}), internal_link: nextDetector },
      analysisInvalidatedAt: new Date(now),
    };
    nextTracking.analysisInputHash = analysisInputHashForPage({
      ...target,
      changeTracking: nextTracking,
    });
    operations.push({
      updateOne: {
        filter: {
          pageKey: target.pageKey,
          'changeTracking.detectors.internal_link.versionKey': detector.versionKey,
          'changeTracking.detectors.internal_link.awaitingSourceRecrawl': true,
        },
        update: { $set: {
          'changeTracking.detectors.internal_link': nextDetector,
          'changeTracking.analysisInvalidatedAt': nextTracking.analysisInvalidatedAt,
          'changeTracking.analysisInputHash': nextTracking.analysisInputHash,
        } },
      },
    });
  }
  if (!operations.length) return 0;
  const result = await pageModel.bulkWrite(operations, { ordered: false });
  return Number(result?.modifiedCount || result?.matchedCount || 0);
}

async function inspectUrlCandidates({
  candidates,
  client,
  siteUrl,
  snapshotModel = SeoDiagnosticSnapshot,
  pageModel = null,
  versionModel = null,
  now = () => new Date(),
  limit = DEFAULT_INSPECTION_LIMIT,
  freshnessDays = DEFAULT_INSPECTION_FRESHNESS_DAYS,
} = {}) {
  if (!client || typeof client.inspectUrl !== 'function') throw new TypeError('A GSC inspection client is required');
  if (!siteUrl) throw new TypeError('A GSC siteUrl is required');
  if (!snapshotModel || typeof snapshotModel.find !== 'function' || typeof snapshotModel.create !== 'function') {
    throw new TypeError('A diagnostic snapshot model is required');
  }
  const observedAt = new Date(typeof now === 'function' ? now() : now);
  if (Number.isNaN(observedAt.getTime())) throw new TypeError('A valid current time is required');
  const boundedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_INSPECTION_LIMIT, MAX_INSPECTION_LIMIT));
  const boundedFreshnessDays = Math.max(1, Math.min(Number(freshnessDays) || DEFAULT_INSPECTION_FRESHNESS_DAYS, 90));
  const unique = new Map();
  for (const candidate of (Array.isArray(candidates) ? candidates : []).slice(0, MAX_INSPECTION_CANDIDATES)) {
    if (isInspectionCandidate(candidate) && !unique.has(String(candidate.pageKey))) {
      unique.set(String(candidate.pageKey), candidate);
    }
  }
  const eligible = Array.from(unique.values());
  const freshCutoff = new Date(observedAt.getTime() - boundedFreshnessDays * DAY_MS);
  const freshRows = eligible.length
    ? await leanResult(snapshotModel.find({
      kind: 'urlInspection',
      pageKey: { $in: eligible.map((candidate) => String(candidate.pageKey)) },
      observedAt: { $gte: freshCutoff },
    }))
    : [];
  const freshKeys = new Set((Array.isArray(freshRows) ? freshRows : []).map((row) => String(row.pageKey)));
  const skippedFreshCandidates = eligible.filter((candidate) => (
    freshKeys.has(String(candidate.pageKey)) && candidate.forceInspection !== true
  ));
  const selected = eligible.filter((candidate) => (
    candidate.forceInspection === true || !freshKeys.has(String(candidate.pageKey))
  )).slice(0, boundedLimit);
  const snapshots = [];
  const failures = [];
  for (const candidate of selected) {
    try {
      const raw = await client.inspectUrl({ siteUrl, inspectionUrl: candidate.canonicalUrl });
      snapshots.push({
        siteUrl,
        pageKey: String(candidate.pageKey),
        kind: 'urlInspection',
        observedAt,
        data: sanitizeInspectionResult(raw, candidate.canonicalUrl),
        expiresAt: new Date(observedAt.getTime() + SNAPSHOT_TTL_DAYS * DAY_MS),
      });
    } catch {
      failures.push({ pageKey: String(candidate.pageKey), code: 'URL_INSPECTION_FAILED' });
    }
  }
  if (snapshots.length) await snapshotModel.create(snapshots);
  const pagesUpdated = await persistInspectionPageState({ snapshots, pageModel, versionModel });
  return {
    considered: Math.min(Array.isArray(candidates) ? candidates.length : 0, MAX_INSPECTION_CANDIDATES),
    eligible: eligible.length,
    inspected: selected.length,
    persisted: snapshots.length,
    skippedFresh: skippedFreshCandidates.length,
    pagesUpdated,
    failures,
    snapshots: snapshots.map((snapshot) => ({
      pageKey: snapshot.pageKey,
      observedAt: snapshot.observedAt,
      data: snapshot.data,
    })),
  };
}

function snapshotFields(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const fields = snapshot.fields || snapshot.data?.fields || snapshot.data;
  if (!fields || typeof fields !== 'object') return null;
  if (!METADATA_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(fields, field))) return null;
  return Object.fromEntries(METADATA_FIELDS.map((field) => [field, String(fields[field] || '')]));
}

function snapshotHash(snapshot) {
  return safeString(snapshot?.hash || snapshot?.data?.hash, 128);
}

function compareMetadataSnapshots(implementationSnapshot, currentSnapshot) {
  const implementationFields = snapshotFields(implementationSnapshot);
  const currentFields = snapshotFields(currentSnapshot);
  if (!implementationFields || !currentFields) return { status: 'unknown', changedFields: [] };
  const implementationHash = snapshotHash(implementationSnapshot) || metadataHash(implementationFields);
  const currentHash = snapshotHash(currentSnapshot) || metadataHash(currentFields);
  if (implementationHash === currentHash) return { status: 'unchanged', changedFields: [] };
  const changedFields = METADATA_FIELDS.filter((field) => implementationFields[field] !== currentFields[field]);
  return changedFields.length
    ? { status: 'changed', changedFields }
    : { status: 'unchanged', changedFields: [] };
}

module.exports = {
  DEFAULT_INSPECTION_LIMIT,
  FRONTENDATLAS_ORIGIN,
  MAX_INSPECTION_CANDIDATES,
  MAX_INSPECTION_LIMIT,
  METADATA_FIELDS,
  SeoDiagnosticError,
  captureLiveMetadataSnapshot,
  compareMetadataSnapshots,
  inspectUrlCandidates,
  detectorEffectiveAt,
  hasPendingCrawl,
  metadataHash,
  parseLiveMetadata,
  persistInspectionPageState,
  resolveInternalLinkSourceRecrawls,
  safeCrawlTime,
  sanitizeInspectionResult,
};
