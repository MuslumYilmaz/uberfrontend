#!/usr/bin/env node

import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';
import {
  cdnPracticeRegistryPath,
  frontendRoot,
  guideRegistryPath,
  repoRoot,
  srcSitemapPath,
} from './content-paths.mjs';

const CHECK = process.argv.includes('--check');
const BUILD_DIR = path.resolve(
  process.env.SEO_BUILD_DIR || path.join(frontendRoot, 'dist', 'frontendatlas', 'browser'),
);
const OUTPUT_PATH = path.join(repoRoot, 'backend', 'content', 'seo', 'page-manifest.json');
const BASE_URL = (process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com').replace(/\/+$/, '');
const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];
const FINGERPRINT_VERSION = 'seo-page-fingerprints.v2';
const MAIN_CONTENT_NORMALIZATION_PROFILE = 'normalized_text_semantic_markup.v2';
const COMPATIBILITY_FINGERPRINT_VERSION = 'seo-page-fingerprints.v1';
const COMPATIBILITY_MAIN_CONTENT_NORMALIZATION_PROFILE = 'normalized_text_semantic_markup.v1';
const PROVENANCE_VERSION = 'seo-build-provenance.v1';
const BUILD_MARKER_VERSION = 'seo-build-marker.v1';
const GIT_DIFF_ENTRY_LIMIT = 24;
const GIT_SHA_PATTERN = /^[a-f0-9]{7,64}$/i;
const BUILD_MARKER_PATH = path.join(BUILD_DIR, 'seo-intelligence-build.json');
const JSON_LD_TITLE_KEYS = new Set(['headline', 'name', 'alternateName']);
const JSON_LD_DESCRIPTION_KEYS = new Set(['description', 'abstract']);
const JSON_LD_CANONICAL_KEYS = new Set([
  '@id', 'canonical', 'canonicalUrl', 'item', 'mainEntityOfPage', 'url',
]);
const JSON_LD_SCHEMA_VALUE_KEYS = new Set([
  '@context', '@type', 'availability', 'itemCondition', 'itemListOrder',
]);
const SEMANTIC_CONTENT_TAGS = new Set([
  // Anchors are intentionally transparent here: their visible children remain
  // text tokens, while href/wrapper evidence belongs exclusively to internalLinks.
  'article', 'aside', 'blockquote', 'br', 'code', 'dd', 'details', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'kbd',
  'li', 'main', 'mark', 'ol', 'p', 'pre', 'q', 's', 'section', 'small', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time',
  'tr', 'ul',
]);
const COMPATIBILITY_SEMANTIC_CONTENT_TAGS = new Set(['a', ...SEMANTIC_CONTENT_TAGS]);
const VOID_CONTENT_TAGS = new Set(['br', 'hr', 'img']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (`${parsed.protocol}//${parsed.host}` !== BASE_URL) return '';
      pathname = parsed.pathname || '/';
    } catch {
      return '';
    }
  }
  if (!pathname.startsWith('/')) return '';
  const stripped = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return stripped || '/';
}

function canonicalUrl(route) {
  return route === '/' ? `${BASE_URL}/` : `${BASE_URL}${route}`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, stableJsonValue(value[key])]),
  );
}

function stableJson(value) {
  return JSON.stringify(stableJsonValue(value));
}

function decodeEntities(value = '') {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function normalizedText(value = '') {
  return decodeEntities(value)
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value = '') {
  return normalizedText(String(value).replace(/<[^>]+>/g, ' '));
}

function readHtmlAttribute(attributes = '', name) {
  const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(attributes).match(new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`,
    'i',
  ));
  return normalizedText(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
}

function extractElementRegions(html, tagName) {
  const regions = [];
  const stack = [];
  const token = new RegExp(`<(/?)${tagName}\\b([^>]*)>`, 'gi');
  for (const match of String(html || '').matchAll(token)) {
    const closing = match[1] === '/';
    if (!closing) {
      stack.push({
        attributes: match[2] || '',
        contentStart: Number(match.index || 0) + match[0].length,
        depth: stack.length,
        start: Number(match.index || 0),
      });
      continue;
    }
    const opening = stack.pop();
    if (!opening) continue;
    regions.push({
      ...opening,
      contentEnd: Number(match.index || 0),
      html: String(html || '').slice(opening.contentStart, Number(match.index || 0)),
    });
  }
  return regions;
}

function stripNonContentMarkup(value, { bodyFallback = false } = {}) {
  let html = String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  if (bodyFallback) {
    html = html.replace(/<(nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  }
  return normalizedText(html.replace(/<[^>]+>/g, ' '));
}

function semanticContentTokens(value, {
  bodyFallback = false,
  semanticTags = SEMANTIC_CONTENT_TAGS,
} = {}) {
  let sanitized = String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  if (bodyFallback) {
    sanitized = sanitized.replace(/<(nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  }
  const tokens = [];
  for (const match of sanitized.matchAll(/<[^>]+>|[^<]+/g)) {
    const token = match[0];
    if (!token.startsWith('<')) {
      const text = normalizedText(token);
      if (text) tokens.push({ kind: 'text', value: text });
      continue;
    }
    const tag = token.match(/^<\s*(\/?)\s*([a-z0-9-]+)\b([^>]*)>/i);
    if (!tag) continue;
    const closing = tag[1] === '/';
    const name = tag[2].toLowerCase();
    if (!semanticTags.has(name)) continue;
    if (closing) {
      if (!VOID_CONTENT_TAGS.has(name)) tokens.push({ kind: 'end', name });
      continue;
    }
    const attributes = {};
    const attributeNames = name === 'img'
      ? ['alt', 'title']
      : name === 'time'
        ? ['datetime']
        : name === 'th'
          ? ['scope']
          : name === 'ol'
            ? ['start']
            : ['aria-label'];
    for (const attributeName of attributeNames) {
      const attributeValue = normalizedText(readHtmlAttribute(tag[3], attributeName));
      if (attributeValue) attributes[attributeName] = attributeValue;
    }
    tokens.push({ kind: 'start', name, attributes: stableJsonValue(attributes) });
  }
  return tokens;
}

function selectMainContentRegion(html) {
  const mainRegions = extractElementRegions(html, 'main');
  if (mainRegions.length) {
    const candidates = mainRegions.map((region) => {
      const semanticSpecificity = Number(Boolean(readHtmlAttribute(region.attributes, 'data-testid'))) * 3
        + Number(Boolean(readHtmlAttribute(region.attributes, 'id'))) * 2
        + Number(readHtmlAttribute(region.attributes, 'role').toLowerCase() === 'main');
      const textLength = stripNonContentMarkup(region.html).length;
      return { ...region, semanticSpecificity, textLength };
    });
    candidates.sort((left, right) => (
      right.semanticSpecificity - left.semanticSpecificity
      || right.depth - left.depth
      || right.textLength - left.textLength
      || left.start - right.start
    ));
    return { ...candidates[0], kind: 'main' };
  }
  const body = extractElementRegions(html, 'body')
    .sort((left, right) => right.depth - left.depth || left.start - right.start)[0];
  return body ? { ...body, kind: 'body' } : null;
}

function extractHeadingOutline(html) {
  const headings = [];
  for (const match of String(html || '').matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decodeHtml(match[2]);
    if (text) headings.push({ level: Number(match[1]), text });
  }
  return headings;
}

function jsonLdBlocks(html) {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (readHtmlAttribute(match[1], 'type').toLowerCase() !== 'application/ld+json') continue;
    blocks.push(String(match[2] || '').trim());
  }
  return blocks;
}

function collectJsonLdTypes(value, target = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectJsonLdTypes(entry, target));
    return target;
  }
  if (!value || typeof value !== 'object') return target;
  const type = value['@type'];
  for (const entry of Array.isArray(type) ? type : [type]) {
    const normalized = normalizedText(entry).slice(0, 120);
    if (normalized) target.add(normalized);
  }
  Object.values(value).forEach((entry) => collectJsonLdTypes(entry, target));
  return target;
}

function normalizedMirrorText(value) {
  return normalizedText(value).toLocaleLowerCase('en-US');
}

function canonicalMirrorValue(value) {
  const normalized = normalizeRenderedCanonical(value);
  if (!normalized) return '';
  try {
    const parsed = new URL(normalized);
    parsed.hash = '';
    parsed.search = '';
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    return normalized;
  }
}

function buildStructuredMirrorContext(values = {}) {
  const textSet = (entries) => new Set(entries.map(normalizedMirrorText).filter(Boolean));
  return {
    title: textSet(values.titles || []),
    description: textSet(values.descriptions || []),
    canonical: new Set((values.canonicals || []).map(canonicalMirrorValue).filter(Boolean)),
  };
}

function mirroredSeoField(key, value, context) {
  if (typeof value !== 'string') return null;
  if (JSON_LD_TITLE_KEYS.has(key) && context.title.has(normalizedMirrorText(value))) return 'title';
  if (JSON_LD_DESCRIPTION_KEYS.has(key)
    && context.description.has(normalizedMirrorText(value))) return 'description';
  if (JSON_LD_CANONICAL_KEYS.has(key)
    && context.canonical.has(canonicalMirrorValue(value))) return 'canonical';
  return null;
}

function neutralizeStructuredMirrors(value, context, metrics, key = '') {
  if (Array.isArray(value)) {
    return value.map((entry) => neutralizeStructuredMirrors(entry, context, metrics, key));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      neutralizeStructuredMirrors(childValue, context, metrics, childKey),
    ]));
  }
  const mirroredField = mirroredSeoField(key, value, context);
  if (!mirroredField) return value;
  metrics.count += 1;
  metrics.fields.add(mirroredField);
  return { $seoMirror: mirroredField };
}

function structuredSchemaShape(value, key = '') {
  if (Array.isArray(value)) return value.map((entry) => structuredSchemaShape(entry, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      structuredSchemaShape(childValue, childKey),
    ]));
  }
  if (JSON_LD_SCHEMA_VALUE_KEYS.has(key)) return value;
  if (value === null) return { $valueType: 'null' };
  return { $valueType: typeof value };
}

function structuredDataFingerprint(html, available, mirroredSeoValues = {}) {
  if (!available) {
    return {
      hash: null,
      causalHash: null,
      schemaHash: null,
      status: 'unavailable',
      source: 'unavailable',
      normalizationProfile: 'json_ld_full_causal_schema.v1',
      blockCount: 0,
      validBlockCount: 0,
      mirroredLeafCount: 0,
      mirroredLeafFields: [],
      types: [],
    };
  }
  const blocks = jsonLdBlocks(html);
  const normalizedBlocks = [];
  const causalBlocks = [];
  const schemaBlocks = [];
  const types = new Set();
  const mirrorContext = buildStructuredMirrorContext(mirroredSeoValues);
  const mirrorMetrics = { count: 0, fields: new Set() };
  let validBlockCount = 0;
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block);
      collectJsonLdTypes(parsed, types);
      normalizedBlocks.push({ kind: 'json', value: stableJsonValue(parsed) });
      causalBlocks.push({
        kind: 'json',
        value: stableJsonValue(neutralizeStructuredMirrors(parsed, mirrorContext, mirrorMetrics)),
      });
      schemaBlocks.push({ kind: 'json', value: stableJsonValue(structuredSchemaShape(parsed)) });
      validBlockCount += 1;
    } catch {
      // Invalid payloads still affect the fingerprint, but raw JSON-LD is never
      // copied into the manifest.
      const invalidHash = sha256(normalizedText(block));
      normalizedBlocks.push({ kind: 'invalid', hash: invalidHash });
      causalBlocks.push({ kind: 'invalid', hash: invalidHash });
      schemaBlocks.push({ kind: 'invalid' });
    }
  }
  normalizedBlocks.sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
  causalBlocks.sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
  schemaBlocks.sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
  return {
    hash: sha256(stableJson(normalizedBlocks)),
    causalHash: sha256(stableJson(causalBlocks)),
    schemaHash: sha256(stableJson(schemaBlocks)),
    status: validBlockCount === blocks.length ? 'complete' : 'partial',
    source: 'prerendered_production_html',
    normalizationProfile: 'json_ld_full_causal_schema.v1',
    blockCount: blocks.length,
    validBlockCount,
    mirroredLeafCount: mirrorMetrics.count,
    mirroredLeafFields: [...mirrorMetrics.fields].sort((left, right) => left.localeCompare(right)),
    types: [...types].sort((left, right) => left.localeCompare(right)).slice(0, 24),
  };
}

function extractTagText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return decodeHtml(match?.[1] || '');
}

function extractMeta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (readHtmlAttribute(tag, 'name').toLowerCase() !== name.toLowerCase()) continue;
    return normalizedText(readHtmlAttribute(tag, 'content'));
  }
  return '';
}

function extractCanonical(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const rel = readHtmlAttribute(tag, 'rel');
    if (!rel.split(/\s+/).some((entry) => entry.toLowerCase() === 'canonical')) continue;
    return readHtmlAttribute(tag, 'href');
  }
  return '';
}

function normalizeRenderedCanonical(value) {
  const raw = normalizedText(value);
  if (!raw) return '';
  try {
    const parsed = new URL(raw, `${BASE_URL}/`);
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    if ((parsed.protocol === 'https:' && parsed.port === '443')
      || (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    return parsed.toString();
  } catch {
    return raw.slice(0, 2048);
  }
}

function normalizeRobots(value) {
  return [...new Set(normalizedText(value)
    .toLowerCase()
    .split(',')
    .map((entry) => entry.trim().replace(/\s+/g, ' '))
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .join(',');
}

function metadataFieldFingerprint({ value, observed, source, fallbackAvailable = false }) {
  const hasValue = typeof value === 'boolean' || Boolean(value);
  return {
    hash: hasValue || fallbackAvailable
      ? sha256(stableJson({ observed: Boolean(observed), value }))
      : null,
    status: observed ? 'complete' : fallbackAvailable ? 'partial' : 'unavailable',
    source: observed || fallbackAvailable ? source : 'unavailable',
  };
}

function extractLinks(html, allowedRoutes) {
  const links = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const route = normalizePath(match[1].replace(/&amp;/g, '&'));
    if (route && allowedRoutes.has(route)) links.add(route);
  }
  return [...links].sort((a, b) => a.localeCompare(b));
}

function extractInternalLinkEvidence(html, allowedRoutes) {
  const links = new Map();
  for (const match of String(html || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const route = normalizePath(readHtmlAttribute(match[1], 'href').replace(/&amp;/g, '&'));
    if (!route || !allowedRoutes.has(route)) continue;
    const anchor = decodeHtml(match[2]);
    const key = `${route}\u0000${anchor}`;
    links.set(key, { route, anchor });
  }
  return [...links.values()].sort((left, right) => (
    left.route.localeCompare(right.route) || left.anchor.localeCompare(right.anchor)
  ));
}

function internalLinkTargetEdges(rows, maximumTargets) {
  const anchorsByRoute = new Map();
  for (const row of rows) {
    if (!anchorsByRoute.has(row.route)) anchorsByRoute.set(row.route, new Set());
    anchorsByRoute.get(row.route).add(row.anchor);
  }
  return [...anchorsByRoute.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, Math.max(0, Number(maximumTargets) || 0))
    .map(([route, anchors]) => ({
      route,
      hash: sha256(stableJson({
        profile: 'internal_link_target_edge.v1',
        route,
        anchors: [...anchors].sort((left, right) => left.localeCompare(right)),
      })),
    }));
}

function buildPageFingerprints({ html = '', page, allowedRoutes = new Set() } = {}) {
  const prerenderedAvailable = Boolean(String(html || '').trim());
  const region = prerenderedAvailable ? selectMainContentRegion(html) : null;
  const limitations = new Set(['client_only_runtime_content_not_observed']);
  if (!prerenderedAvailable) limitations.add('prerendered_html_unavailable');
  if (prerenderedAvailable && !region) limitations.add('semantic_content_region_unavailable');
  if (region?.kind === 'body') limitations.add('main_element_unavailable_body_fallback');

  const htmlTitle = prerenderedAvailable ? extractTagText(html, 'title') : '';
  const htmlDescription = prerenderedAvailable ? extractMeta(html, 'description') : '';
  const htmlCanonical = prerenderedAvailable
    ? normalizeRenderedCanonical(extractCanonical(html))
    : '';
  const htmlRobots = prerenderedAvailable ? normalizeRobots(extractMeta(html, 'robots')) : '';
  const fallbackRobots = page?.indexable === false ? 'noindex,follow' : 'index,follow';
  const metadataValue = {
    canonical: htmlCanonical || normalizeRenderedCanonical(page?.canonicalUrl || ''),
    title: normalizedText(htmlTitle || page?.title || ''),
    description: normalizedText(htmlDescription || page?.description || ''),
    robots: htmlRobots || fallbackRobots,
    indexable: page?.indexable !== false,
  };
  const metadataFields = {
    title: metadataFieldFingerprint({
      value: metadataValue.title,
      observed: Boolean(htmlTitle),
      source: htmlTitle ? 'prerendered_production_html' : 'manifest_fields',
      fallbackAvailable: Boolean(page?.title),
    }),
    description: metadataFieldFingerprint({
      value: metadataValue.description,
      observed: Boolean(htmlDescription),
      source: htmlDescription ? 'prerendered_production_html' : 'manifest_fields',
      fallbackAvailable: Boolean(page?.description),
    }),
    canonical: metadataFieldFingerprint({
      value: metadataValue.canonical,
      observed: Boolean(htmlCanonical),
      source: htmlCanonical ? 'prerendered_production_html' : 'manifest_fields',
      fallbackAvailable: Boolean(page?.canonicalUrl),
    }),
    robots: metadataFieldFingerprint({
      value: metadataValue.robots,
      observed: Boolean(htmlRobots),
      source: htmlRobots ? 'prerendered_production_html' : 'html_default_no_meta',
      fallbackAvailable: prerenderedAvailable || typeof page?.indexable === 'boolean',
    }),
    indexability: metadataFieldFingerprint({
      value: metadataValue.indexable,
      observed: typeof page?.indexable === 'boolean',
      source: 'manifest_indexability',
      fallbackAvailable: true,
    }),
  };
  const metadataUsesFallback = Object.values(metadataFields)
    .some((field) => field.status !== 'complete');
  if (metadataUsesFallback) limitations.add('seo_metadata_fallback_used');
  if (prerenderedAvailable && !htmlRobots) limitations.add('robots_http_header_not_observed');
  const seoMetadata = {
    hash: sha256(stableJson({ metadataValue, fields: metadataFields })),
    status: prerenderedAvailable && !metadataUsesFallback ? 'complete' : 'partial',
    source: prerenderedAvailable ? 'prerendered_production_html' : 'manifest_fields',
    fields: metadataFields,
  };

  const mainText = region
    ? stripNonContentMarkup(region.html, { bodyFallback: region.kind === 'body' })
    : '';
  const mainSemanticTokens = region
    ? semanticContentTokens(region.html, { bodyFallback: region.kind === 'body' })
    : [];
  const compatibilityMainSemanticTokens = region
    ? semanticContentTokens(region.html, {
      bodyFallback: region.kind === 'body',
      semanticTags: COMPATIBILITY_SEMANTIC_CONTENT_TAGS,
    })
    : [];
  if (region && !mainText) limitations.add('main_content_empty');
  const mainContent = {
    hash: region ? sha256(stableJson({ profile: MAIN_CONTENT_NORMALIZATION_PROFILE, tokens: mainSemanticTokens })) : null,
    status: !region ? 'unavailable' : mainText ? 'complete' : 'partial',
    source: region ? 'prerendered_production_html' : 'unavailable',
    region: region?.kind || null,
    normalizationProfile: MAIN_CONTENT_NORMALIZATION_PROFILE,
    normalizedCharCount: mainText.length,
    semanticTokenCount: mainSemanticTokens.length,
    compatibility: region
      ? {
        fingerprintVersion: COMPATIBILITY_FINGERPRINT_VERSION,
        normalizationProfile: COMPATIBILITY_MAIN_CONTENT_NORMALIZATION_PROFILE,
        hash: sha256(stableJson({
          profile: COMPATIBILITY_MAIN_CONTENT_NORMALIZATION_PROFILE,
          tokens: compatibilityMainSemanticTokens,
        })),
      }
      : null,
  };

  const headingRows = region ? extractHeadingOutline(region.html) : [];
  if (region && !headingRows.length) limitations.add('heading_outline_empty');
  const headingOutline = {
    hash: region ? sha256(stableJson(headingRows)) : null,
    status: !region ? 'unavailable' : headingRows.length ? 'complete' : 'partial',
    source: region ? 'prerendered_production_html' : 'unavailable',
    count: headingRows.length,
  };

  const structuredData = structuredDataFingerprint(html, prerenderedAvailable, {
    titles: [htmlTitle, page?.title, page?.h1],
    descriptions: [htmlDescription, page?.description],
    canonicals: [htmlCanonical, page?.canonicalUrl],
  });
  if (structuredData.status === 'partial') limitations.add('structured_data_invalid');

  const internalLinkRows = region ? extractInternalLinkEvidence(region.html, allowedRoutes) : [];
  const internalLinkEdges = region
    ? internalLinkTargetEdges(internalLinkRows, allowedRoutes.size)
    : [];
  const internalLinks = {
    hash: region ? sha256(stableJson(internalLinkRows)) : null,
    status: region ? 'complete' : 'unavailable',
    source: region ? 'prerendered_production_html' : 'unavailable',
    count: internalLinkRows.length,
    edgeCount: internalLinkEdges.length,
    edgeProfile: 'internal_link_target_edge.v1',
    edges: internalLinkEdges,
  };

  const intentValue = {
    family: normalizedText(page?.family || ''),
    tech: normalizedText(page?.tech || ''),
    targetKeyword: normalizedText(page?.targetKeyword || ''),
    intendedIntent: normalizedText(page?.intendedIntent || ''),
    readerPromise: normalizedText(page?.readerPromise || ''),
    intentSource: normalizedText(page?.intentSource || ''),
    intentConfirmed: page?.intentConfirmed === true,
    tags: [...new Set((page?.tags || []).map(normalizedText).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right)),
  };
  const hasIntent = Boolean(intentValue.targetKeyword || intentValue.intendedIntent || intentValue.readerPromise);
  const independentIntent = intentValue.intentSource === 'explicit' || intentValue.intentConfirmed;
  const intentCausalValue = independentIntent
    ? intentValue
    : {
      family: intentValue.family,
      tech: intentValue.tech,
      intentConfirmed: intentValue.intentConfirmed,
      tags: intentValue.tags,
    };
  if (!hasIntent) limitations.add('intent_contract_empty');
  const intent = {
    hash: sha256(stableJson(intentValue)),
    causalHash: sha256(stableJson(intentCausalValue)),
    status: hasIntent ? 'complete' : 'partial',
    source: 'manifest_intent_contract',
    causalStatus: independentIntent && hasIntent ? 'complete' : 'partial',
    causalSource: independentIntent
      ? intentValue.intentSource === 'explicit'
        ? 'explicit_intent_contract'
        : 'confirmed_intent_contract'
      : 'derived_taxonomy_only',
    dependency: independentIntent ? 'independent' : 'derived_from_page_metadata',
    normalizationProfile: 'intent_full_and_causal.v1',
  };

  const components = {
    seoMetadata: { hash: seoMetadata.hash, status: seoMetadata.status },
    mainContent: { hash: mainContent.hash, status: mainContent.status },
    headingOutline: { hash: headingOutline.hash, status: headingOutline.status },
    structuredData: { hash: structuredData.hash, status: structuredData.status },
    internalLinks: { hash: internalLinks.hash, status: internalLinks.status },
    intent: { hash: intent.hash, status: intent.status },
  };
  return {
    version: FINGERPRINT_VERSION,
    algorithm: 'sha256',
    aggregate: sha256(stableJson({ version: FINGERPRINT_VERSION, components })),
    seoMetadata,
    mainContent,
    headingOutline,
    structuredData,
    internalLinks,
    intent,
    availability: {
      source: prerenderedAvailable ? 'prerendered_production_html' : 'manifest_only',
      prerendered: prerenderedAvailable,
      mainContentRegion: region?.kind || null,
      fieldSources: {
        canonical: htmlCanonical ? 'prerendered_production_html' : 'manifest_fields',
        title: htmlTitle ? 'prerendered_production_html' : 'manifest_fields',
        description: htmlDescription ? 'prerendered_production_html' : 'manifest_fields',
        robots: htmlRobots
          ? 'prerendered_production_html'
          : prerenderedAvailable ? 'html_default_no_meta' : 'manifest_fields',
      },
      limitations: [...limitations].sort((left, right) => left.localeCompare(right)),
    },
  };
}

function readSitemapEntries() {
  if (!fs.existsSync(srcSitemapPath)) {
    throw new Error(`Sitemap not found: ${srcSitemapPath}`);
  }
  const xml = fs.readFileSync(srcSitemapPath, 'utf8');
  const entries = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const loc = decodeHtml(block[1].match(/<loc>([\s\S]*?)<\/loc>/i)?.[1] || '');
    const route = normalizePath(loc);
    if (!route) continue;
    const updatedAt = decodeHtml(block[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1] || '');
    entries.push({ route, updatedAt });
  }
  return entries.sort((a, b) => a.route.localeCompare(b.route));
}

function routeHtmlPath(route) {
  return route === '/'
    ? path.join(BUILD_DIR, 'index.html')
    : path.join(BUILD_DIR, route.slice(1), 'index.html');
}

function readStringProperty(objectLiteral, name) {
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) return '';
  const property = objectLiteral.properties.find((entry) => {
    if (!ts.isPropertyAssignment(entry)) return false;
    if (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) return entry.name.text === name;
    return false;
  });
  if (!property || !ts.isPropertyAssignment(property)) return '';
  const value = property.initializer;
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value) ? value.text.trim() : '';
}

function readObjectProperty(objectLiteral, name) {
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) return null;
  const property = objectLiteral.properties.find((entry) => {
    if (!ts.isPropertyAssignment(entry)) return false;
    if (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) return entry.name.text === name;
    return false;
  });
  return property && ts.isPropertyAssignment(property) && ts.isObjectLiteralExpression(property.initializer)
    ? property.initializer
    : null;
}

function guideRoute(collection, slug) {
  if (collection === 'SYSTEM') return `/guides/system-design-blueprint/${slug}`;
  if (collection === 'BEHAVIORAL') return `/guides/behavioral/${slug}`;
  return slug.endsWith('-prep-path')
    ? `/guides/framework-prep/${slug}`
    : `/guides/interview-blueprint/${slug}`;
}

function readGuideMetadata() {
  if (!fs.existsSync(guideRegistryPath)) return new Map();
  const source = fs.readFileSync(guideRegistryPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    guideRegistryPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const result = new Map();

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name)) return;
      const collection = declaration.name.text;
      if (!GUIDE_COLLECTIONS.includes(collection)) return;
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) return;
      declaration.initializer.elements.forEach((element) => {
        if (!ts.isObjectLiteralExpression(element)) return;
        const slug = readStringProperty(element, 'slug');
        if (!slug) return;
        const seo = readObjectProperty(element, 'seo');
        const primaryKeyword = readStringProperty(seo, 'primaryKeyword');
        const intendedIntent = readStringProperty(seo, 'searchIntent');
        const route = guideRoute(collection, slug);
        result.set(route, {
          family: 'guide',
          title: readStringProperty(seo, 'title') || readStringProperty(element, 'title'),
          description: readStringProperty(seo, 'description') || readStringProperty(element, 'summary'),
          targetKeyword: primaryKeyword,
          intendedIntent,
          readerPromise: readStringProperty(seo, 'readerPromise'),
          updatedAt: readStringProperty(seo, 'updatedAt'),
          intentSource: primaryKeyword || intendedIntent ? 'explicit' : 'derived',
          intentConfirmed: Boolean(primaryKeyword || intendedIntent),
        });
      });
    });
  });
  return result;
}

function readPracticeMetadata() {
  const result = new Map();
  if (!fs.existsSync(cdnPracticeRegistryPath)) return result;
  for (const item of readJson(cdnPracticeRegistryPath)) {
    const route = normalizePath(item?.route);
    if (!route) continue;
    result.set(route, {
      family: String(item.family || 'practice'),
      tech: String(item.tech || ''),
      title: String(item.title || ''),
      description: String(item.summary || ''),
      updatedAt: String(item.updatedAt || ''),
      tags: Array.isArray(item.tags) ? item.tags.map(String).sort() : [],
      targetKeyword: String(item.title || '').toLowerCase(),
      intendedIntent: String(item.summary || ''),
      readerPromise: String(item.summary || ''),
      intentSource: 'derived',
      intentConfirmed: false,
    });
  }
  return result;
}

function inferFamily(route) {
  if (route === '/') return 'home';
  if (route.startsWith('/guides/')) return 'guide';
  if (route.includes('/trivia/')) return 'trivia';
  if (route.includes('/coding/')) return 'coding';
  if (route.includes('/debug/')) return 'debug';
  if (route.startsWith('/system-design/')) return 'system-design';
  if (route.startsWith('/legal')) return 'legal';
  return 'hub';
}

function inferTech(route) {
  const candidate = route.split('/').filter(Boolean)[0] || '';
  return ['javascript', 'react', 'angular', 'vue', 'html', 'css', 'html-css'].includes(candidate)
    ? candidate
    : '';
}

function deriveIntent(title, description) {
  return [title, description].filter(Boolean).join(' — ').slice(0, 500);
}

function safeEnvIdentifier(value, maximumLength = 200) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > maximumLength || !/^[a-z0-9._:@/-]+$/i.test(normalized)) return null;
  return normalized;
}

function safeGitSha(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return GIT_SHA_PATTERN.test(normalized) ? normalized : null;
}

function safeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function defaultGitReader(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 8_000,
      maxBuffer: 4 * 1024 * 1024,
    }).trim();
  } catch {
    return '';
  }
}

function gitValue(gitReader, args) {
  try {
    return String(gitReader(args) || '').trim();
  } catch {
    return '';
  }
}

function firstGitSha(candidates) {
  for (const [value, source] of candidates) {
    const sha = safeGitSha(value);
    if (sha) return { sha, source };
  }
  return { sha: null, source: 'unavailable' };
}

function gitChangeType(status) {
  const code = String(status || '').slice(0, 1).toUpperCase();
  return ({
    A: 'added',
    C: 'copied',
    D: 'deleted',
    M: 'modified',
    R: 'renamed',
    T: 'type_changed',
    U: 'unmerged',
  })[code] || 'unknown';
}

function gitArea(filePath) {
  const first = String(filePath || '').split('/')[0];
  return ['backend', 'cdn', 'docs', 'frontend'].includes(first) ? first : 'other';
}

function gitCandidateSignals(filePath) {
  const value = String(filePath || '');
  return [
    value.startsWith('cdn/questions/') || value === 'cdn/practice/registry.json'
      ? 'content_source_changed' : null,
    value.startsWith('frontend/src/app/') ? 'rendered_application_source_changed' : null,
    value === 'frontend/src/sitemap.xml' || value === 'frontend/src/sitemap-1.xml'
      ? 'declared_page_date_changed' : null,
    value === 'frontend/scripts/generate-seo-intelligence-manifest.mjs'
      ? 'fingerprint_pipeline_changed' : null,
  ].filter(Boolean);
}

function parseGitDiff(raw = '') {
  const entries = [];
  const changeTypes = {};
  const areas = {};
  const signals = new Set();
  for (const line of String(raw || '').split(/\r?\n/).filter(Boolean)) {
    const columns = line.split('\t');
    const status = columns[0] || '';
    const filePath = String(columns[columns.length - 1] || '').replace(/\\/g, '/');
    if (!filePath || filePath.startsWith('/') || filePath.split('/').includes('..') || filePath.length > 500) continue;
    const changeType = gitChangeType(status);
    const area = gitArea(filePath);
    changeTypes[changeType] = Number(changeTypes[changeType] || 0) + 1;
    areas[area] = Number(areas[area] || 0) + 1;
    gitCandidateSignals(filePath).forEach((signal) => signals.add(signal));
    entries.push({ changeType, area, pathHash: sha256(filePath) });
  }
  entries.sort((left, right) => (
    left.pathHash.localeCompare(right.pathHash) || left.changeType.localeCompare(right.changeType)
  ));
  return {
    changedFileCount: entries.length,
    returnedEntryCount: Math.min(entries.length, GIT_DIFF_ENTRY_LIMIT),
    entryLimit: GIT_DIFF_ENTRY_LIMIT,
    truncated: entries.length > GIT_DIFF_ENTRY_LIMIT,
    changeTypes: stableJsonValue(changeTypes),
    areas: stableJsonValue(areas),
    candidateSignals: [...signals].sort((left, right) => left.localeCompare(right)),
    entries: entries.slice(0, GIT_DIFF_ENTRY_LIMIT),
  };
}

function buildProvenance({
  env = process.env,
  observedAt = new Date(),
  gitReader = defaultGitReader,
} = {}) {
  const explicitHead = firstGitSha([
    [env.SEO_GIT_SHA, 'seo_env'],
    [env.VERCEL_GIT_COMMIT_SHA, 'vercel_env'],
    [env.GITHUB_SHA, 'github_env'],
    [env.SOURCE_VERSION, 'source_version_env'],
    [env.GIT_COMMIT, 'git_commit_env'],
  ]);
  const cliHead = safeGitSha(gitValue(gitReader, ['rev-parse', 'HEAD']));
  const headSha = explicitHead.sha || cliHead;
  const headSource = explicitHead.sha ? explicitHead.source : cliHead ? 'git_cli' : 'unavailable';

  const explicitPrevious = firstGitSha([
    [env.SEO_PREVIOUS_GIT_SHA, 'seo_env'],
    [env.VERCEL_GIT_PREVIOUS_SHA, 'vercel_previous_successful_deployment'],
  ]);
  let baseSha = explicitPrevious.sha;
  let diffBaseKind = explicitPrevious.source === 'vercel_previous_successful_deployment'
    ? 'previous_successful_deployment'
    : baseSha ? 'explicit_previous_revision' : 'unavailable';
  let diffBaseConfidence = explicitPrevious.source === 'vercel_previous_successful_deployment'
    ? 'high'
    : baseSha ? 'medium' : 'unavailable';
  let baseShaSource = explicitPrevious.source;
  if (!baseSha && headSha) {
    baseSha = safeGitSha(gitValue(gitReader, ['rev-parse', `${headSha}^`]));
    if (baseSha) {
      diffBaseKind = 'first_parent';
      diffBaseConfidence = 'low';
      baseShaSource = 'git_first_parent';
    }
  }

  let diff = {
    status: 'unavailable',
    explanationRole: 'candidate_corroboration_only',
    establishesCausality: false,
    baseSha: baseSha || null,
    headSha: headSha || null,
    scope: diffBaseKind,
    confidence: diffBaseConfidence,
    changedFileCount: 0,
    returnedEntryCount: 0,
    entryLimit: GIT_DIFF_ENTRY_LIMIT,
    truncated: false,
    changeTypes: {},
    areas: {},
    candidateSignals: [],
    entries: [],
  };
  if (baseSha && headSha) {
    const rawDiff = gitValue(gitReader, ['diff', '--name-status', '--find-renames', baseSha, headSha, '--']);
    if (rawDiff || baseSha === headSha) {
      diff = {
        ...diff,
        status: 'available',
        ...parseGitDiff(rawDiff),
      };
    }
  }

  const deploymentId = safeEnvIdentifier(env.SEO_DEPLOYMENT_ID || env.VERCEL_DEPLOYMENT_ID);
  const readyAt = safeIso(env.SEO_DEPLOYMENT_READY_AT || env.VERCEL_DEPLOYMENT_READY_AT);
  const rawEnvironment = String(
    env.SEO_DEPLOYMENT_ENVIRONMENT || env.VERCEL_TARGET_ENV || env.VERCEL_ENV || '',
  ).trim().toLowerCase();
  const environment = ['production', 'preview', 'development'].includes(rawEnvironment)
    ? rawEnvironment
    : 'unknown';
  const provider = safeEnvIdentifier(env.SEO_DEPLOYMENT_PROVIDER, 40)
    || (deploymentId || env.VERCEL ? 'vercel' : 'unknown');
  const committedAt = headSha
    ? safeIso(gitValue(gitReader, ['show', '-s', '--format=%cI', headSha]))
    : null;
  const observedIso = safeIso(observedAt) || new Date().toISOString();
  const limitations = new Set(['git_is_corroborating_not_deployment_authority']);
  if (!readyAt) limitations.add('deployment_ready_time_requires_runtime_observation');
  if (diffBaseKind === 'first_parent') limitations.add('first_parent_is_not_previous_deployment');
  if (diff.status !== 'available') limitations.add('git_diff_unavailable');

  return {
    version: PROVENANCE_VERSION,
    schemaVersion: PROVENANCE_VERSION,
    build: {
      observedAt: observedIso,
      precision: 'exact',
      source: 'manifest_generation',
    },
    deployment: {
      provider,
      environment,
      id: deploymentId,
      gitSha: headSha || null,
      previousGitSha: explicitPrevious.sha || null,
      readyAt,
      readyAtSource: readyAt ? 'explicit_env' : 'unavailable',
      readyAtPrecision: readyAt ? 'exact' : 'unknown',
      effectiveAt: readyAt
        ? {
          lowerBound: readyAt,
          upperBound: readyAt,
          precision: 'exact',
          source: 'explicit_ready_at',
        }
        : {
          lowerBound: null,
          upperBound: null,
          precision: 'unknown',
          source: 'runtime_observation_required',
        },
    },
    git: {
      authority: 'corroborating_only',
      headSha: headSha || null,
      headSource,
      committedAt,
      previousSha: baseSha || null,
      previousShaSource: baseShaSource,
      diff,
    },
    limitations: [...limitations].sort((left, right) => left.localeCompare(right)),
  };
}

function buildBuildMarker(manifest = {}) {
  const provenance = manifest.provenance && typeof manifest.provenance === 'object'
    ? manifest.provenance
    : {};
  const deployment = provenance.deployment && typeof provenance.deployment === 'object'
    ? provenance.deployment
    : {};
  const git = provenance.git && typeof provenance.git === 'object' ? provenance.git : {};
  const diff = git.diff && typeof git.diff === 'object' ? git.diff : {};
  return {
    version: BUILD_MARKER_VERSION,
    manifestVersion: String(manifest.version || ''),
    sourceHash: safeGitSha(manifest.sourceHash),
    fingerprintVersion: String(manifest.fingerprintVersion || ''),
    provenanceVersion: String(manifest.provenanceVersion || provenance.version || ''),
    build: {
      observedAt: safeIso(provenance.build?.observedAt),
      source: 'frontend_build_marker',
    },
    deployment: {
      provider: safeEnvIdentifier(deployment.provider, 40) || 'unknown',
      environment: ['production', 'preview', 'development'].includes(deployment.environment)
        ? deployment.environment
        : 'unknown',
      id: safeEnvIdentifier(deployment.id),
      gitSha: safeGitSha(deployment.gitSha || git.headSha),
      readyAt: deployment.readyAtPrecision === 'exact' ? safeIso(deployment.readyAt) : null,
      readyAtPrecision: deployment.readyAtPrecision === 'exact' && safeIso(deployment.readyAt)
        ? 'exact'
        : 'unknown',
    },
    git: {
      authority: 'corroborating_only',
      headSha: safeGitSha(git.headSha),
      previousSha: safeGitSha(git.previousSha),
      diff: {
        status: ['available', 'unavailable'].includes(diff.status) ? diff.status : 'unavailable',
        scope: safeEnvIdentifier(diff.scope, 80) || 'unavailable',
        confidence: ['high', 'medium', 'low', 'unavailable'].includes(diff.confidence)
          ? diff.confidence
          : 'unavailable',
        changedFileCount: Math.max(0, Number(diff.changedFileCount) || 0),
        truncated: diff.truncated === true,
        candidateSignals: [...new Set((Array.isArray(diff.candidateSignals)
          ? diff.candidateSignals
          : [])
          .map((value) => safeEnvIdentifier(value, 100))
          .filter(Boolean))]
          .sort((left, right) => left.localeCompare(right))
          .slice(0, 12),
      },
    },
    limitations: [...new Set((Array.isArray(provenance.limitations)
      ? provenance.limitations
      : [])
      .map((value) => safeEnvIdentifier(value, 100))
      .filter(Boolean))]
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 20),
  };
}

function buildManifest({ env = process.env, now = new Date(), gitReader = defaultGitReader } = {}) {
  if (!fs.existsSync(BUILD_DIR)) {
    throw new Error(`Prerender build not found: ${BUILD_DIR}. Run npm run build first.`);
  }
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    throw new Error(`Prerender build is incomplete: ${BUILD_DIR}/index.html is missing. Run npm run build first.`);
  }
  const sitemapEntries = readSitemapEntries();
  const allowedRoutes = new Set(sitemapEntries.map((entry) => entry.route));
  const practice = readPracticeMetadata();
  const guides = readGuideMetadata();

  const pages = sitemapEntries.map(({ route, updatedAt: sitemapUpdatedAt }) => {
    const registry = guides.get(route) || practice.get(route) || {};
    const htmlPath = routeHtmlPath(route);
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
    const htmlTitle = extractTagText(html, 'title');
    const htmlDescription = extractMeta(html, 'description');
    const renderedCanonicalUrl = normalizeRenderedCanonical(extractCanonical(html));
    const robots = normalizedText(extractMeta(html, 'robots'));
    const title = registry.title || htmlTitle;
    const description = registry.description || htmlDescription;
    const targetKeyword = registry.targetKeyword || title.toLowerCase();
    const intendedIntent = registry.intendedIntent || deriveIntent(title, description);

    const page = {
      // Sitemap membership owns page identity. The rendered canonical remains
      // separate evidence so a broken/mismatched tag cannot rename the page.
      pageKey: sha256(canonicalUrl(route)),
      canonicalUrl: canonicalUrl(route),
      renderedCanonicalUrl,
      path: route,
      family: registry.family || inferFamily(route),
      tech: registry.tech || inferTech(route),
      indexable: true,
      robots,
      title,
      description,
      h1: extractTagText(html, 'h1'),
      updatedAt: registry.updatedAt || sitemapUpdatedAt || '',
      targetKeyword,
      intendedIntent,
      readerPromise: registry.readerPromise || description,
      intentSource: registry.intentSource || 'derived',
      intentConfirmed: registry.intentConfirmed === true,
      tags: registry.tags || [],
      outboundLinks: extractLinks(html, allowedRoutes),
      prerendered: Boolean(html),
    };
    return {
      ...page,
      fingerprints: buildPageFingerprints({ html, page, allowedRoutes }),
    };
  });

  const stable = {
    version: 'seo-page-manifest.v1',
    property: 'sc-domain:frontendatlas.com',
    fingerprintVersion: FINGERPRINT_VERSION,
    provenanceVersion: PROVENANCE_VERSION,
    pages,
  };
  const sourceHash = sha256(JSON.stringify(stable));
  const current = fs.existsSync(OUTPUT_PATH) ? readJson(OUTPUT_PATH) : null;
  const observedAt = safeIso(now) || new Date().toISOString();
  let generatedAt = observedAt;
  let provenance = null;
  if (fs.existsSync(OUTPUT_PATH)) {
    if (CHECK || current.sourceHash === sourceHash) {
      generatedAt = String(current.generatedAt || generatedAt);
    }
  }
  const hasDeploymentContext = Boolean(
    safeEnvIdentifier(env.SEO_DEPLOYMENT_ID || env.VERCEL_DEPLOYMENT_ID)
    || String(env.VERCEL || '').trim() === '1',
  );
  const mayReuseCurrentProvenance = Boolean(
    current?.provenance
    && current.provenanceVersion === PROVENANCE_VERSION
    && (CHECK || (!hasDeploymentContext && current.sourceHash === sourceHash)),
  );
  provenance = mayReuseCurrentProvenance
    ? current.provenance
    : buildProvenance({ env, observedAt, gitReader });
  return { ...stable, sourceHash, generatedAt, provenance };
}

function main() {
  const manifest = buildManifest();
  const output = `${JSON.stringify(manifest, null, 2)}\n`;
  const buildMarker = buildBuildMarker(manifest);
  const markerOutput = `${JSON.stringify(buildMarker, null, 2)}\n`;

  if (CHECK) {
    const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : '';
    const currentMarker = fs.existsSync(BUILD_MARKER_PATH)
      ? fs.readFileSync(BUILD_MARKER_PATH, 'utf8')
      : '';
    if (current !== output || currentMarker !== markerOutput) {
      console.error('[seo-manifest] ERROR: generated SEO page manifest is stale.');
      console.error('[seo-manifest] Run: npm run gen:seo-intelligence-manifest');
      process.exit(1);
    }
    console.log(`[seo-manifest] check passed: pages=${manifest.pages.length} hash=${manifest.sourceHash.slice(0, 12)}`);
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  fs.writeFileSync(BUILD_MARKER_PATH, markerOutput, 'utf8');
  console.log(`[seo-manifest] wrote ${path.relative(repoRoot, OUTPUT_PATH)} and ${path.relative(repoRoot, BUILD_MARKER_PATH)} pages=${manifest.pages.length} hash=${manifest.sourceHash.slice(0, 12)}`);
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(`[seo-manifest] fatal: ${error?.message || error}`);
    process.exit(1);
  }
}

export {
  BUILD_MARKER_VERSION,
  FINGERPRINT_VERSION,
  PROVENANCE_VERSION,
  buildBuildMarker,
  buildManifest,
  buildPageFingerprints,
  buildProvenance,
  extractElementRegions,
  parseGitDiff,
  selectMainContentRegion,
  stableJson,
};
