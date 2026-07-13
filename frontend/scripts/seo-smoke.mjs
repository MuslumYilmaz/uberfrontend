#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { cdnSystemDesignIndexPath } from './content-paths.mjs';
import { startSeoStaticServer } from './seo-static-server.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const HOST = process.env.SEO_SERVER_HOST || '127.0.0.1';
const PORT = Number(process.env.SEO_SERVER_PORT || 4173);
const SAMPLE_GUIDE_ROUTE = '/guides/interview-blueprint/intro';
const GOOGLE_PREVIEW_ROUTE = '/companies/google/preview';
const GOOGLE_PREVIEW_CANONICAL = `https://frontendatlas.com${GOOGLE_PREVIEW_ROUTE}`;
const GOOGLE_PREVIEW_TITLE = 'Google Frontend Interview Questions: 7 Prompts + Prep Guide';
const GOOGLE_PREVIEW_DESCRIPTION =
  'Prepare for a Google frontend interview with 7 representative questions covering DSA, JavaScript, browser APIs, UI coding, accessibility, and system design.';
const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
const GOOGLEBOT_USER_AGENT = 'Googlebot';
const GOOGLE_PREVIEW_HEADINGS = [
  'What to study first for a Google frontend interview',
  'Seven Google frontend interview practice questions',
  'Walk through autocomplete request ordering before you code',
  'A 7-day Google frontend interview preparation plan',
  'Common Google frontend interview preparation questions',
  'Free public practice',
];
const GOOGLE_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Google interview questions. Interview formats vary by role, level, team, location, and time.';
const GOOGLE_PREVIEW_PROMPTS = [
  { id: 'nested-navigation-tree', title: 'Traverse and transform a nested navigation tree' },
  { id: 'debounce-cancel-flush', title: 'Implement debounce with cancel and flush' },
  { id: 'accessible-autocomplete', title: 'Build an accessible autocomplete' },
  { id: 'take-latest-async-results', title: 'Keep only the latest async result' },
  { id: 'dom-event-delegation', title: 'Handle delegated events in a dynamic list' },
  {
    id: 'frontend-performance-network-security',
    title: 'Reason about frontend performance, networking, and security',
  },
  {
    id: 'search-suggestions-large-list-design',
    title: 'Design search suggestions for a large interactive list',
  },
];
const GOOGLE_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-get-by-path-1',
  '/javascript/coding/js-debounce',
  '/react/coding/react-autocomplete-search-starter',
  '/javascript/coding/js-take-latest',
  '/javascript/trivia/js-event-delegation',
  '/javascript/trivia/web-performance-optimize-load-time',
  '/system-design/infinite-scroll-list',
  '/javascript/trivia/js-compare-two-objects',
];
const execFileAsync = promisify(execFile);

function pickSystemDesignSampleId() {
  const filePath = cdnSystemDesignIndexPath;
  if (!fs.existsSync(filePath)) return '';
  try {
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) return '';
    const first = list.find((item) => typeof item?.id === 'string' && item.id.trim().length > 0);
    return first?.id || '';
  } catch {
    return '';
  }
}

function curlArgs(url, { followRedirects = false, userAgent = '' } = {}) {
  const args = ['-sS'];
  if (followRedirects) args.push('-L');
  if (userAgent) args.push('-A', userAgent);
  args.push(url);
  return args;
}

async function curlStatus(url, options = {}) {
  const args = curlArgs(url, options);
  args.splice(args.length - 1, 0, '-o', '/dev/null', '-w', '%{http_code}');
  const { stdout } = await execFileAsync('curl', args, {
    encoding: 'utf8',
  });
  return Number(String(stdout).trim());
}

async function curlBody(url, options = {}) {
  const { stdout } = await execFileAsync('curl', curlArgs(url, options), {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return stdout;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function extractAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tag || '').match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decodeHtml(match[2]).trim() : '';
}

function extractMetaContent(html, attributeName, attributeValue) {
  const expected = String(attributeValue || '').toLowerCase();
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(
    (candidate) => extractAttribute(candidate, attributeName).toLowerCase() === expected,
  );
  return tag ? extractAttribute(tag, 'content') : '';
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeHtml(m[1]).trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1].trim() : '';
}

function extractRobots(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  return m ? m[1].trim().toLowerCase() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return decodeHtml(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeText(value) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function extractVisibleText(html) {
  return normalizeText(
    String(html || '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function extractInternalLinkPaths(html) {
  const paths = new Set();
  for (const match of String(html || '').matchAll(/<a\b[^>]*>/gi)) {
    const href = extractAttribute(match[0], 'href');
    if (!href) continue;
    try {
      const url = new URL(href, 'https://frontendatlas.com');
      if (url.origin === 'https://frontendatlas.com' && !url.search && !url.hash) {
        paths.add(url.pathname.replace(/\/+$/, '') || '/');
      }
    } catch {
      // Ignore malformed links; the dedicated link checks report missing routes below.
    }
  }
  return paths;
}

function extractSeoJsonLd(html) {
  const scripts = Array.from(String(html || '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
  const match = scripts.find((entry) => extractAttribute(entry[1], 'id') === 'seo-jsonld');
  if (!match) return { graph: [], error: 'script#seo-jsonld is missing' };

  try {
    const parsed = JSON.parse(match[2]);
    return {
      graph: Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [],
      error: '',
    };
  } catch (error) {
    return { graph: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function hasSchemaType(node, expectedType) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.includes(expectedType);
}

const systemDesignId = pickSystemDesignSampleId();
if (!systemDesignId) {
  console.error('[seo:smoke] Could not find a system-design sample id.');
  process.exit(1);
}

let server = null;

try {
  server = await startSeoStaticServer({
    buildDir: BUILD_DIR,
    host: HOST,
    port: PORT,
    logPrefix: '[seo:smoke]',
  });

  const base = server.baseUrl.replace(/\/+$/, '');
  const checks = [];

  const unknownPath = '/non-existent-seo-check-abc123';
  const unknownUrl = `${base}${unknownPath}`;
  const unknownStatus = await curlStatus(unknownUrl);
  const unknownBody = await curlBody(unknownUrl);
  const unknownCanonical = extractCanonical(unknownBody);
  const unknownRobots = extractRobots(unknownBody);
  checks.push({
    name: 'unknown route returns 404',
    ok: unknownStatus === 404,
    detail: `${unknownStatus} ${unknownPath}`,
  });
  checks.push({
    name: 'unknown route canonical is /404',
    ok: /https:\/\/frontendatlas\.com\/404\/?$/.test(unknownCanonical),
    detail: `canonical=${unknownCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'unknown route robots is noindex',
    ok: unknownRobots.includes('noindex'),
    detail: `robots=${unknownRobots || '(missing)'}`,
  });

  const notFoundPath = '/404';
  const notFoundUrl = `${base}${notFoundPath}`;
  const notFoundStatus = await curlStatus(notFoundUrl);
  const notFoundBody = await curlBody(notFoundUrl);
  const notFoundCanonical = extractCanonical(notFoundBody);
  const notFoundRobots = extractRobots(notFoundBody);
  checks.push({
    name: '/404 returns 200 or 404',
    ok: notFoundStatus === 200 || notFoundStatus === 404,
    detail: `${notFoundStatus} ${notFoundPath}`,
  });
  checks.push({
    name: '/404 robots is noindex',
    ok: notFoundRobots.includes('noindex'),
    detail: `robots=${notFoundRobots || '(missing)'}`,
  });
  checks.push({
    name: '/404 canonical is /404',
    ok: /https:\/\/frontendatlas\.com\/404\/?$/.test(notFoundCanonical),
    detail: `canonical=${notFoundCanonical || '(missing)'}`,
  });

  const dashboardPath = '/dashboard';
  const dashboardUrl = `${base}${dashboardPath}`;
  const dashboardStatus = await curlStatus(dashboardUrl);
  const dashboardBody = await curlBody(dashboardUrl);
  const dashboardCanonical = extractCanonical(dashboardBody);
  const dashboardRobots = extractRobots(dashboardBody);
  checks.push({
    name: '/dashboard returns 200',
    ok: dashboardStatus === 200,
    detail: `${dashboardStatus} ${dashboardPath}`,
  });
  checks.push({
    name: '/dashboard robots is noindex',
    ok: dashboardRobots.includes('noindex'),
    detail: `robots=${dashboardRobots || '(missing)'}`,
  });
  checks.push({
    name: '/dashboard canonical is self (not homepage)',
    ok: /https:\/\/frontendatlas\.com\/dashboard\/?$/.test(dashboardCanonical),
    detail: `canonical=${dashboardCanonical || '(missing)'}`,
  });

  const systemPath = `/system-design/${systemDesignId}`;
  const systemUrl = `${base}${systemPath}`;
  const systemStatus = await curlStatus(systemUrl);
  const systemBody = await curlBody(systemUrl);
  const systemTitle = extractTitle(systemBody);
  const systemH1 = extractH1(systemBody);
  checks.push({
    name: 'system-design detail returns 200',
    ok: systemStatus === 200,
    detail: `${systemStatus} ${systemPath}`,
  });
  checks.push({
    name: 'system-design detail title is non-generic',
    ok: systemTitle.length > 0 && systemTitle.toLowerCase() !== 'system design scenario | frontendatlas',
    detail: `title=${systemTitle || '(missing)'}`,
  });
  checks.push({
    name: 'system-design detail has non-empty h1',
    ok: systemH1.length > 0,
    detail: `h1=${systemH1 || '(missing)'}`,
  });

  const guideUrl = `${base}${SAMPLE_GUIDE_ROUTE}`;
  const guideStatus = await curlStatus(guideUrl);
  const guideBody = await curlBody(guideUrl);
  const guideH1 = extractH1(guideBody);
  checks.push({
    name: 'guide detail returns 200',
    ok: guideStatus === 200,
    detail: `${guideStatus} ${SAMPLE_GUIDE_ROUTE}`,
  });
  checks.push({
    name: 'guide detail has non-empty h1',
    ok: guideH1.length > 0,
    detail: `h1=${guideH1 || '(missing)'}`,
  });

  const googleUrl = `${base}${GOOGLE_PREVIEW_ROUTE}`;
  const googleCurlOptions = { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT };
  const googleStatus = await curlStatus(googleUrl, googleCurlOptions);
  const googleBody = await curlBody(googleUrl, googleCurlOptions);
  const googleTitle = extractTitle(googleBody);
  const googleDescription = extractMetaContent(googleBody, 'name', 'description');
  const googleCanonical = extractCanonical(googleBody);
  const googleRobots = extractRobots(googleBody);
  const googleH1 = extractH1(googleBody);
  const googleVisibleText = extractVisibleText(googleBody);
  const googleInternalLinks = extractInternalLinkPaths(googleBody);
  const googleJsonLd = extractSeoJsonLd(googleBody);
  const googleCollectionPage = googleJsonLd.graph.find((node) => hasSchemaType(node, 'CollectionPage'));
  const googleBreadcrumbs = googleJsonLd.graph.find((node) => hasSchemaType(node, 'BreadcrumbList'));
  const googleItemList = googleJsonLd.graph.find((node) => hasSchemaType(node, 'ItemList'));
  const googleListItems = Array.isArray(googleItemList?.itemListElement)
    ? googleItemList.itemListElement
    : [];

  checks.push({
    name: 'Googlebot receives Google company preview as 200',
    ok: googleStatus === 200,
    detail: `${googleStatus} ${GOOGLE_PREVIEW_ROUTE}`,
  });
  checks.push({
    name: 'Google company preview has exact title',
    ok: googleTitle === GOOGLE_PREVIEW_TITLE,
    detail: `title=${googleTitle || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview has exact description',
    ok: googleDescription === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `description=${googleDescription || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview mirrors exact Open Graph metadata',
    ok:
      extractMetaContent(googleBody, 'property', 'og:title') === GOOGLE_PREVIEW_TITLE &&
      extractMetaContent(googleBody, 'property', 'og:description') === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `og:title=${extractMetaContent(googleBody, 'property', 'og:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview mirrors exact Twitter metadata',
    ok:
      extractMetaContent(googleBody, 'name', 'twitter:title') === GOOGLE_PREVIEW_TITLE &&
      extractMetaContent(googleBody, 'name', 'twitter:description') === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `twitter:title=${extractMetaContent(googleBody, 'name', 'twitter:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview canonical is self-referential',
    ok: googleCanonical === GOOGLE_PREVIEW_CANONICAL,
    detail: `canonical=${googleCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview robots is index,follow',
    ok: googleRobots.replace(/\s+/g, '') === 'index,follow',
    detail: `robots=${googleRobots || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview has exact h1',
    ok: googleH1 === GOOGLE_PREVIEW_H1,
    detail: `h1=${googleH1 || '(missing)'}`,
  });

  const missingGoogleHeadings = GOOGLE_PREVIEW_HEADINGS.filter(
    (heading) => !googleVisibleText.includes(normalizeText(heading)),
  );
  checks.push({
    name: 'Google company preview core guide sections are present in raw HTML',
    ok: missingGoogleHeadings.length === 0,
    detail: missingGoogleHeadings.length ? `missing=${missingGoogleHeadings.join(' | ')}` : 'all present',
  });
  checks.push({
    name: 'Google company preview trust note is present in raw HTML',
    ok: googleVisibleText.includes(normalizeText(GOOGLE_PREVIEW_TRUST_NOTE)),
    detail: googleVisibleText.includes(normalizeText(GOOGLE_PREVIEW_TRUST_NOTE)) ? 'present' : 'missing',
  });

  const missingGooglePrompts = GOOGLE_PREVIEW_PROMPTS.filter(
    (prompt) => !googleVisibleText.includes(normalizeText(prompt.title)),
  );
  checks.push({
    name: 'Google company preview prompt titles are visible in raw HTML',
    ok: missingGooglePrompts.length === 0,
    detail: missingGooglePrompts.length
      ? `missing=${missingGooglePrompts.map((prompt) => prompt.title).join(' | ')}`
      : 'all seven present',
  });

  const missingGoogleResourceLinks = GOOGLE_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !googleInternalLinks.has(route),
  );
  checks.push({
    name: 'Google company preview has all contextual public resource links in raw HTML',
    ok: missingGoogleResourceLinks.length === 0,
    detail: missingGoogleResourceLinks.length
      ? `missing=${missingGoogleResourceLinks.join(', ')}`
      : 'all eight present',
  });

  checks.push({
    name: 'Google company preview JSON-LD parses',
    ok: !googleJsonLd.error && googleJsonLd.graph.length > 0,
    detail: googleJsonLd.error || `graph_nodes=${googleJsonLd.graph.length}`,
  });
  const requiredGoogleSchemaTypes = [
    'Organization',
    'WebSite',
    'CollectionPage',
    'BreadcrumbList',
    'ItemList',
  ];
  const missingGoogleSchemaTypes = requiredGoogleSchemaTypes.filter(
    (type) => !googleJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Google company preview has the required top-level schema graph',
    ok: missingGoogleSchemaTypes.length === 0,
    detail: missingGoogleSchemaTypes.length ? `missing=${missingGoogleSchemaTypes.join(', ')}` : 'all present',
  });

  const googleListMatchesVisiblePrompts = GOOGLE_PREVIEW_PROMPTS.every((prompt, index) => {
    const item = googleListItems[index];
    return (
      item?.position === index + 1 &&
      item?.name === prompt.title &&
      item?.url === `${GOOGLE_PREVIEW_CANONICAL}#${prompt.id}`
    );
  });
  checks.push({
    name: 'Google company preview ItemList matches all seven visible prompts',
    ok: googleListItems.length === 7 && googleListMatchesVisiblePrompts,
    detail: `item_count=${googleListItems.length}`,
  });
  checks.push({
    name: 'Google company preview CollectionPage references the top-level ItemList',
    ok:
      Boolean(googleCollectionPage?.mainEntity?.['@id']) &&
      googleCollectionPage?.mainEntity?.['@id'] === googleItemList?.['@id'],
    detail: `mainEntity=${googleCollectionPage?.mainEntity?.['@id'] || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview CollectionPage declares free access and current modification date',
    ok:
      googleCollectionPage?.isAccessibleForFree === true &&
      googleCollectionPage?.dateModified === '2026-07-13T00:00:00.000Z',
    detail: `dateModified=${googleCollectionPage?.dateModified || '(missing)'}`,
  });
  const googleBreadcrumbItems = Array.isArray(googleBreadcrumbs?.itemListElement)
    ? googleBreadcrumbs.itemListElement
    : [];
  checks.push({
    name: 'Google company preview BreadcrumbList ends at the canonical page',
    ok:
      googleBreadcrumbItems.length === 3 &&
      googleBreadcrumbItems[2]?.name === GOOGLE_PREVIEW_H1 &&
      googleBreadcrumbItems[2]?.item === GOOGLE_PREVIEW_CANONICAL,
    detail: `item_count=${googleBreadcrumbItems.length}`,
  });

  let failed = 0;
  for (const check of checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    console.log(`[seo:smoke] ${status} ${check.name} (${check.detail})`);
    if (!check.ok) failed += 1;
  }

  if (failed > 0) process.exit(1);
} finally {
  if (server) {
    await server.close();
  }
}
