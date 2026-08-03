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
const NETFLIX_PREVIEW_ROUTE = '/companies/netflix/preview';
const NETFLIX_PREVIEW_CANONICAL = `https://frontendatlas.com${NETFLIX_PREVIEW_ROUTE}`;
const NETFLIX_PREVIEW_TITLE = 'Netflix Frontend Interview Questions: 6 Prompts + Prep Guide';
const NETFLIX_PREVIEW_DESCRIPTION =
  'Prepare for a Netflix frontend interview with 6 representative prompts on JavaScript, React, streaming UI, performance, accessibility, and system design.';
const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
const NETFLIX_PREVIEW_HEADINGS = [
  'Prepare for product judgment, not Netflix trivia',
  'What Netflix publishes—and what you still need to confirm',
  'Three product contexts for practicing transferable frontend judgment',
  'Six Netflix frontend interview practice questions',
  'Scope Continue Watching before drawing architecture boxes',
  'A 7-day Netflix frontend interview preparation plan',
  'Common Netflix frontend interview preparation questions',
  'Build the underlying skills with free practice',
  'Sources and evidence limits',
];
const NETFLIX_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Netflix interview questions. Interview formats vary by role and team, so use recruiter-provided material as the source of truth.';
const NETFLIX_PREVIEW_PROMPTS = [
  { id: 'resilient-title-search', title: 'Implement resilient title search' },
  { id: 'accessible-continue-watching-row', title: 'Build an accessible Continue Watching row' },
  {
    id: 'personalized-row-rendering',
    title: 'Stop personalized rows from re-rendering unnecessarily',
  },
  {
    id: 'streaming-caching-failure-states',
    title: 'Reason about streaming delivery, caching, and failure states',
  },
  {
    id: 'continue-watching-system-design',
    title: 'Design Continue Watching for regional and device scale',
  },
  {
    id: 'consequential-frontend-decision',
    title: 'Defend a consequential frontend decision',
  },
];
const NETFLIX_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-debounce',
  '/javascript/coding/js-take-latest',
  '/react/trivia/react-prevent-unnecessary-rerenders',
  '/javascript/trivia/content-delivery-caching-strategies-streaming',
  '/system-design/infinite-scroll-list',
  '/system-design/dashboard-widgets-draggable-resizable',
  '/guides/system-design-blueprint/performance',
  '/guides/behavioral/stories',
];
const ANGULAR_HTTP_CANCELLATION_LAB_ROUTE =
  '/angular/trivia/angular-http-what-actually-cancels-request';
const ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL =
  `https://frontendatlas.com${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`;
const ANGULAR_HTTP_CANCELLATION_LAB_TITLE =
  'Angular HttpClient Unsubscribe: 6 Tests & DevTools';
const ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION =
  'Run six tests for unsubscribe, switchMap, AsyncPipe, mergeMap, and shareReplay. Prove RxJS teardown, browser abort, and stale-UI protection.';
const ANGULAR_HTTP_CANCELLATION_LAB_H1 =
  'Angular HttpClient Cancellation: Debug, Test, and Prevent Stale UI';
const ANGULAR_HTTP_CANCELLATION_LAB_CONTENT = [
  '15-second answer',
  'Cancellation behavior model',
  'RxJS subscription',
  'Browser transport',
  'UI commit',
  'Server work',
  'Manual unsubscribe',
  'switchMap',
  'mergeMap',
  'takeUntilDestroyed',
  'AsyncPipe',
  'shareReplay',
  'Browser DevTools',
  'HttpTestingController',
  'TestRequest.cancelled',
  'http-cancellation.spec.ts',
  'Source check',
  'Interview focus',
];
const ANGULAR_HTTP_CANCELLATION_LAB_RESOURCE_ROUTES = [
  '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
  '/angular/trivia/angular-prevent-memory-leaks-unsubscribe-patterns',
  '/angular/trivia/rxjs-sharereplay-angular-how-it-breaks-your-app',
  '/javascript/coding/js-take-latest',
];
const ANGULAR_HTTP_CANCELLATION_LAB_OFFICIAL_SOURCES = [
  'https://angular.dev/guide/http/making-requests',
  'https://angular.dev/guide/http/testing',
  'https://angular.dev/api/common/http/testing/TestRequest',
  'https://angular.dev/api/common/http/HttpRequest',
];
const REACT_STALE_CLOSURES_ROUTE = '/react/trivia/react-stale-state-closures';
const REACT_STALE_CLOSURES_CANONICAL =
  `https://frontendatlas.com${REACT_STALE_CLOSURES_ROUTE}`;
const REACT_STALE_CLOSURES_TITLE = 'React Stale Closures: 6 PRs, Which Fix Is Right?';
const REACT_STALE_CLOSURES_DESCRIPTION =
  'Review six React pull requests: four stale closures, one intentional snapshot, and one async race. Predict the failure and reveal the minimal safe diff.';
const REACT_STALE_CLOSURES_H1 =
  'React Stale Closure Case Files: Diagnose Six Pull Requests';
const REACT_STALE_CLOSURES_TRUST_NOTE =
  'These are representative FrontendAtlas code-review scenarios, not real pull requests or leaked interview material.';
const REACT_STALE_CLOSURE_CASE_FILES = [
  { id: 'pr-interval-counter', title: 'Interval counter: update from previous state' },
  { id: 'pr-chat-theme', title: 'Chat connection: read the latest theme without reconnecting' },
  { id: 'pr-escape-listener', title: 'Escape listener: re-synchronize with isDirty' },
  { id: 'pr-debounced-autosave', title: 'Debounced autosave: pass the invocation snapshot' },
  { id: 'pr-export-snapshot', title: 'Export audit: preserve the initiating snapshot' },
  { id: 'pr-search-ordering', title: 'Async search: diagnose a race, not a closure' },
];
const REACT_STALE_CLOSURES_SECTION_HEADINGS = [
  'Callback contract',
  'React stale closure case files',
  'Diagnosis table',
  'Production code-review checklist',
  'Source check',
  '30-second interview answer',
];
const REACT_STALE_CLOSURES_OFFICIAL_SOURCES = [
  'https://react.dev/learn/state-as-a-snapshot',
  'https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps',
  'https://react.dev/reference/react/useEffectEvent',
  'https://react.dev/reference/react/useRef',
];
const ASYNC_RACE_ROUTE = '/javascript/trivia/js-async-race-conditions';
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
      .replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style\b[^>]*>/gi, ' ')
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

function extractLinkHrefs(html) {
  const hrefs = new Set();
  for (const match of String(html || '').matchAll(/<a\b[^>]*>/gi)) {
    const href = extractAttribute(match[0], 'href');
    if (href) hrefs.add(href);
  }
  return hrefs;
}

function extractSeoJsonLd(html) {
  const scripts = Array.from(String(html || '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi));
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

  const angularCancellationUrl = `${base}${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`;
  const angularCancellationStatus = await curlStatus(angularCancellationUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const angularCancellationBody = await curlBody(angularCancellationUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const angularCancellationVisibleText = extractVisibleText(angularCancellationBody);
  const angularCancellationLinks = extractLinkHrefs(angularCancellationBody);
  const angularCancellationJsonLd = extractSeoJsonLd(angularCancellationBody);
  const angularCancellationArticle = angularCancellationJsonLd.graph.find((node) =>
    hasSchemaType(node, 'TechArticle'),
  );
  const angularCancellationSchemaTypes = angularCancellationJsonLd.graph.flatMap((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type : type ? [type] : [];
  });

  checks.push({
    name: 'Googlebot receives the Angular HttpClient cancellation lab as 200',
    ok: angularCancellationStatus === 200,
    detail: `${angularCancellationStatus} ${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab has exact search metadata',
    ok:
      extractTitle(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_TITLE &&
      extractMetaContent(angularCancellationBody, 'name', 'description') ===
        ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION &&
      extractMetaContent(angularCancellationBody, 'property', 'og:title') ===
        ANGULAR_HTTP_CANCELLATION_LAB_TITLE &&
      extractMetaContent(angularCancellationBody, 'name', 'twitter:title') ===
        ANGULAR_HTTP_CANCELLATION_LAB_TITLE,
    detail: `title=${extractTitle(angularCancellationBody) || '(missing)'}`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab is self-canonical and indexable',
    ok:
      extractCanonical(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL &&
      extractRobots(angularCancellationBody).replace(/\s+/g, '') === 'index,follow',
    detail: `canonical=${extractCanonical(angularCancellationBody) || '(missing)'} robots=${
      extractRobots(angularCancellationBody) || '(missing)'
    }`,
  });
  const angularCancellationH1Count =
    (String(angularCancellationBody).match(/<h1\b/gi) || []).length;
  checks.push({
    name: 'Angular HttpClient cancellation lab has one exact H1',
    ok:
      extractH1(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_H1 &&
      angularCancellationH1Count === 1,
    detail: `h1=${extractH1(angularCancellationBody) || '(missing)'} count=${angularCancellationH1Count}`,
  });

  const missingAngularCancellationContent = ANGULAR_HTTP_CANCELLATION_LAB_CONTENT.filter(
    (expected) => !angularCancellationVisibleText.includes(normalizeText(expected)),
  );
  checks.push({
    name: 'Angular HttpClient cancellation lab exposes the complete debugging model in raw HTML',
    ok: missingAngularCancellationContent.length === 0,
    detail: missingAngularCancellationContent.length
      ? `missing=${missingAngularCancellationContent.join(' | ')}`
      : 'all present',
  });

  const missingAngularCancellationResources =
    ANGULAR_HTTP_CANCELLATION_LAB_RESOURCE_ROUTES.filter(
      (route) => !angularCancellationLinks.has(route),
    );
  checks.push({
    name: 'Angular HttpClient cancellation lab has four clean public practice links',
    ok: missingAngularCancellationResources.length === 0,
    detail: missingAngularCancellationResources.length
      ? `missing=${missingAngularCancellationResources.join(', ')}`
      : 'all present',
  });
  const hasAngularCancellationAsyncRaceLink = Array.from(angularCancellationLinks).some((href) => {
    try {
      const url = new URL(href, 'https://frontendatlas.com');
      return url.pathname === '/javascript/trivia/js-async-race-conditions';
    } catch {
      return false;
    }
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab does not confound the active async-race title experiment',
    ok: !hasAngularCancellationAsyncRaceLink,
    detail: hasAngularCancellationAsyncRaceLink ? 'unexpected async-race link present' : 'none present',
  });
  const missingAngularCancellationSources = ANGULAR_HTTP_CANCELLATION_LAB_OFFICIAL_SOURCES.filter(
    (url) => !angularCancellationLinks.has(url),
  );
  checks.push({
    name: 'Angular HttpClient cancellation lab cites all official Angular sources',
    ok: missingAngularCancellationSources.length === 0,
    detail: missingAngularCancellationSources.length
      ? `missing=${missingAngularCancellationSources.join(', ')}`
      : 'all present',
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab JSON-LD parses',
    ok: !angularCancellationJsonLd.error && angularCancellationJsonLd.graph.length > 0,
    detail:
      angularCancellationJsonLd.error || `graph_nodes=${angularCancellationJsonLd.graph.length}`,
  });
  const requiredAngularCancellationSchemaTypes = ['BreadcrumbList', 'TechArticle'];
  const missingAngularCancellationSchemaTypes = requiredAngularCancellationSchemaTypes.filter(
    (type) => !angularCancellationSchemaTypes.includes(type),
  );
  const forbiddenAngularCancellationSchemaTypes = ['FAQPage', 'QAPage', 'Question'];
  const presentForbiddenAngularCancellationSchemaTypes = forbiddenAngularCancellationSchemaTypes.filter(
    (type) => angularCancellationSchemaTypes.includes(type),
  );
  checks.push({
    name: 'Angular HttpClient cancellation lab uses only supported detail schema',
    ok:
      missingAngularCancellationSchemaTypes.length === 0 &&
      presentForbiddenAngularCancellationSchemaTypes.length === 0,
    detail: `missing=${missingAngularCancellationSchemaTypes.join(', ') || 'none'} forbidden=${
      presentForbiddenAngularCancellationSchemaTypes.join(', ') || 'none'
    }`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation TechArticle declares the public lab contract',
    ok:
      angularCancellationArticle?.['@id'] === ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL &&
      angularCancellationArticle?.headline === ANGULAR_HTTP_CANCELLATION_LAB_H1 &&
      angularCancellationArticle?.description === ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION &&
      angularCancellationArticle?.datePublished === '2026-01-25T00:00:00.000Z' &&
      angularCancellationArticle?.dateModified === '2026-08-03T00:00:00.000Z' &&
      angularCancellationArticle?.isAccessibleForFree === true &&
      angularCancellationArticle?.learningResourceType === 'Interactive debugging lab' &&
      Array.isArray(angularCancellationArticle?.hasPart) &&
      angularCancellationArticle.hasPart.length >= 6 &&
      Array.isArray(angularCancellationArticle?.citation) &&
      angularCancellationArticle.citation.length >= 4,
    detail: `dateModified=${angularCancellationArticle?.dateModified || '(missing)'}`,
  });

  const reactStaleClosuresUrl = `${base}${REACT_STALE_CLOSURES_ROUTE}`;
  const reactStaleClosuresStatus = await curlStatus(reactStaleClosuresUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const reactStaleClosuresBody = await curlBody(reactStaleClosuresUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const reactStaleClosuresVisibleText = extractVisibleText(reactStaleClosuresBody);
  const reactStaleClosuresLinks = extractLinkHrefs(reactStaleClosuresBody);
  const reactStaleClosuresAllHrefs = Array.from(
    String(reactStaleClosuresBody).matchAll(/<a\b[^>]*>/gi),
    (match) => extractAttribute(match[0], 'href'),
  ).filter(Boolean);
  const reactStaleClosuresJsonLd = extractSeoJsonLd(reactStaleClosuresBody);
  const reactStaleClosuresArticle = reactStaleClosuresJsonLd.graph.find((node) =>
    hasSchemaType(node, 'TechArticle'),
  );
  const reactStaleClosuresSchemaTypes = reactStaleClosuresJsonLd.graph.flatMap((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type : type ? [type] : [];
  });

  checks.push({
    name: 'Googlebot receives the React stale closure case files as 200',
    ok: reactStaleClosuresStatus === 200,
    detail: `${reactStaleClosuresStatus} ${REACT_STALE_CLOSURES_ROUTE}`,
  });
  checks.push({
    name: 'React stale closure case files have exact search metadata',
    ok:
      extractTitle(reactStaleClosuresBody) === REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'description') ===
        REACT_STALE_CLOSURES_DESCRIPTION &&
      extractMetaContent(reactStaleClosuresBody, 'property', 'og:title') ===
        REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'property', 'og:description') ===
        REACT_STALE_CLOSURES_DESCRIPTION &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'twitter:title') ===
        REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'twitter:description') ===
        REACT_STALE_CLOSURES_DESCRIPTION,
    detail: `title=${extractTitle(reactStaleClosuresBody) || '(missing)'}`,
  });
  checks.push({
    name: 'React stale closure case files are self-canonical and indexable',
    ok:
      extractCanonical(reactStaleClosuresBody) === REACT_STALE_CLOSURES_CANONICAL &&
      extractRobots(reactStaleClosuresBody).replace(/\s+/g, '') === 'index,follow',
    detail: `canonical=${extractCanonical(reactStaleClosuresBody) || '(missing)'} robots=${
      extractRobots(reactStaleClosuresBody) || '(missing)'
    }`,
  });
  const reactStaleClosuresH1Count =
    (String(reactStaleClosuresBody).match(/<h1\b/gi) || []).length;
  checks.push({
    name: 'React stale closure case files have one exact H1',
    ok:
      extractH1(reactStaleClosuresBody) === REACT_STALE_CLOSURES_H1 &&
      reactStaleClosuresH1Count === 1,
    detail: `h1=${extractH1(reactStaleClosuresBody) || '(missing)'} count=${reactStaleClosuresH1Count}`,
  });
  checks.push({
    name: 'React stale closure case files expose the visible trust note',
    ok: reactStaleClosuresVisibleText.includes(normalizeText(REACT_STALE_CLOSURES_TRUST_NOTE)),
    detail: reactStaleClosuresVisibleText.includes(normalizeText(REACT_STALE_CLOSURES_TRUST_NOTE))
      ? 'present'
      : 'missing',
  });

  const reactStaleClosuresHeadings = Array.from(
    String(reactStaleClosuresBody).matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi),
    (match) => normalizeText(decodeHtml(match[2].replace(/<[^>]+>/g, ' '))),
  );
  const missingReactStaleClosuresHeadings = REACT_STALE_CLOSURES_SECTION_HEADINGS.filter(
    (heading) => !reactStaleClosuresHeadings.includes(normalizeText(heading)),
  );
  const reactStaleClosuresMilestones = [
    'React stale closures: direct answer',
    ...REACT_STALE_CLOSURES_SECTION_HEADINGS,
  ];
  const reactStaleClosuresMilestonePositions = reactStaleClosuresMilestones.map((label) =>
    reactStaleClosuresVisibleText.indexOf(normalizeText(label)),
  );
  const reactStaleClosuresOrderIsStable = reactStaleClosuresMilestonePositions.every(
    (position, index) =>
      position >= 0 &&
      (index === 0 || position > reactStaleClosuresMilestonePositions[index - 1]),
  );
  checks.push({
    name: 'React stale closure review sections are semantic and preserve content order',
    ok: missingReactStaleClosuresHeadings.length === 0 && reactStaleClosuresOrderIsStable,
    detail: missingReactStaleClosuresHeadings.length
      ? `missing=${missingReactStaleClosuresHeadings.join(' | ')}`
      : `positions=${reactStaleClosuresMilestonePositions.join(',')}`,
  });

  const missingReactStaleClosureCases = REACT_STALE_CLOSURE_CASE_FILES.filter((caseFile) => {
    const hasTitle = reactStaleClosuresVisibleText.includes(normalizeText(caseFile.title));
    const hasFragment = new RegExp(`\\bid=["']${caseFile.id}["']`, 'i').test(
      reactStaleClosuresBody,
    );
    return !hasTitle || !hasFragment;
  });
  const reactReviewContractCount =
    reactStaleClosuresVisibleText.split('Choose the value-ownership contract').length - 1;
  const reactMinimalDiffCount =
    (String(reactStaleClosuresBody).match(/aria-label=["']minimal code change["']/gi) || []).length;
  const reactProofTestCount =
    reactStaleClosuresVisibleText.split('Proof assertion').length - 1;
  const reactReviewContractsComplete =
    reactReviewContractCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
    reactMinimalDiffCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
    reactProofTestCount === REACT_STALE_CLOSURE_CASE_FILES.length;
  checks.push({
    name: 'React stale closure raw HTML contains six complete PR case files',
    ok: missingReactStaleClosureCases.length === 0 && reactReviewContractsComplete,
    detail:
      missingReactStaleClosureCases.length || !reactReviewContractsComplete
        ? `cases=${missingReactStaleClosureCases.map((item) => item.id).join(',') || 'none'} contracts=${reactReviewContractCount} diffs=${reactMinimalDiffCount} proofs=${reactProofTestCount}`
        : 'all six present',
  });

  const reactCommonMisdiagnosisCount =
    reactStaleClosuresVisibleText.split('Common misdiagnosis').length - 1;
  const reactCaseStarts = REACT_STALE_CLOSURE_CASE_FILES.map((caseFile) => ({
    caseFile,
    index: String(reactStaleClosuresBody).search(
      new RegExp(`\\bid=["']${caseFile.id}["']`, 'i'),
    ),
  }));
  const reactCaseSegments = reactCaseStarts.map(({ caseFile, index }, caseIndex) => {
    const nextIndex = reactCaseStarts[caseIndex + 1]?.index ?? reactStaleClosuresBody.length;
    const markup = index >= 0 && nextIndex > index
      ? reactStaleClosuresBody.slice(index, nextIndex)
      : '';
    return {
      id: caseFile.id,
      markup,
      commonMisdiagnosisCount: extractVisibleText(markup).split('Common misdiagnosis').length - 1,
    };
  });
  const reactCasesWithInvalidMisdiagnosis = reactCaseSegments.filter(
    ({ commonMisdiagnosisCount }) => commonMisdiagnosisCount !== 1,
  );
  checks.push({
    name: 'React stale closure raw HTML exposes one visible Common misdiagnosis per case',
    ok:
      reactCommonMisdiagnosisCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
      reactCasesWithInvalidMisdiagnosis.length === 0,
    detail: reactCasesWithInvalidMisdiagnosis.length
      ? `total=${reactCommonMisdiagnosisCount} invalid=${reactCasesWithInvalidMisdiagnosis
          .map(({ id, commonMisdiagnosisCount }) => `${id}:${commonMisdiagnosisCount}`)
          .join(',')}`
      : `count=${reactCommonMisdiagnosisCount}`,
  });

  const reactAutosaveMarkup =
    reactCaseSegments.find(({ id }) => id === 'pr-debounced-autosave')?.markup || '';
  const compactReactAutosaveText = extractVisibleText(reactAutosaveMarkup).replace(/\s+/g, '');
  const reactAutosaveProofSteps = [
    'unmount();',
    'advanceTimersByTime(300);',
    "expect(onSave).not.toHaveBeenCalledWith('draftC');",
  ];
  let reactAutosaveProofCursor = -1;
  const reactAutosaveProofPositions = reactAutosaveProofSteps.map((step) => {
    const position = compactReactAutosaveText.indexOf(step, reactAutosaveProofCursor + 1);
    reactAutosaveProofCursor = position;
    return position;
  });
  const reactAutosaveProofIsOrdered = reactAutosaveProofPositions.every(
    (position, index) =>
      position >= 0 && (index === 0 || position > reactAutosaveProofPositions[index - 1]),
  );
  checks.push({
    name: 'React debounced autosave raw patch cancels on unmount and proves pending work cannot save',
    ok:
      compactReactAutosaveText.includes('saveLater.cancel()') && reactAutosaveProofIsOrdered,
    detail: `cancel=${compactReactAutosaveText.includes('saveLater.cancel()')} proof_positions=${reactAutosaveProofPositions.join(',')}`,
  });

  const reactAsyncRaceLinks = reactStaleClosuresAllHrefs.filter((href) => {
    try {
      return new URL(href, 'https://frontendatlas.com').pathname === ASYNC_RACE_ROUTE;
    } catch {
      return false;
    }
  });
  checks.push({
    name: 'React stale closure case files preserve exactly one clean async-race bridge',
    ok: reactAsyncRaceLinks.length === 1 && reactAsyncRaceLinks[0] === ASYNC_RACE_ROUTE,
    detail: reactAsyncRaceLinks.length ? reactAsyncRaceLinks.join(',') : 'missing',
  });
  const missingReactStaleClosureSources = REACT_STALE_CLOSURES_OFFICIAL_SOURCES.filter(
    (url) => !reactStaleClosuresLinks.has(url),
  );
  checks.push({
    name: 'React stale closure case files cite all four official React sources',
    ok: missingReactStaleClosureSources.length === 0,
    detail: missingReactStaleClosureSources.length
      ? `missing=${missingReactStaleClosureSources.join(', ')}`
      : 'all present',
  });

  const requiredReactStaleClosureSchemaTypes = ['BreadcrumbList', 'TechArticle'];
  const missingReactStaleClosureSchemaTypes = requiredReactStaleClosureSchemaTypes.filter(
    (type) => !reactStaleClosuresSchemaTypes.includes(type),
  );
  const forbiddenReactStaleClosureSchemaTypes = ['FAQPage', 'QAPage', 'Question', 'Quiz'];
  const presentForbiddenReactStaleClosureSchemaTypes = forbiddenReactStaleClosureSchemaTypes.filter(
    (type) => reactStaleClosuresSchemaTypes.includes(type),
  );
  checks.push({
    name: 'React stale closure case files use only supported detail schema',
    ok:
      !reactStaleClosuresJsonLd.error &&
      missingReactStaleClosureSchemaTypes.length === 0 &&
      presentForbiddenReactStaleClosureSchemaTypes.length === 0,
    detail:
      reactStaleClosuresJsonLd.error ||
      `missing=${missingReactStaleClosureSchemaTypes.join(',') || 'none'} forbidden=${
        presentForbiddenReactStaleClosureSchemaTypes.join(',') || 'none'
      }`,
  });

  const reactStaleClosuresAboutNames = (reactStaleClosuresArticle?.about || [])
    .map((item) => item?.name)
    .join(' ');
  const reactStaleClosuresMentionNames = (reactStaleClosuresArticle?.mentions || [])
    .map((item) => item?.name)
    .join(' ');
  const reactStaleClosuresHasPartUrls = (reactStaleClosuresArticle?.hasPart || []).map((item) =>
    String(item?.url || item?.['@id'] || ''),
  );
  const reactStaleClosuresCitations = (reactStaleClosuresArticle?.citation || []).map(
    (item) => item?.url,
  );
  const reactStaleClosuresHasAllCaseFragments = REACT_STALE_CLOSURE_CASE_FILES.every(
    (caseFile) =>
      reactStaleClosuresHasPartUrls.includes(`${REACT_STALE_CLOSURES_CANONICAL}#${caseFile.id}`),
  );
  const reactStaleClosuresHasAllCitations = REACT_STALE_CLOSURES_OFFICIAL_SOURCES.every(
    (url) => reactStaleClosuresCitations.includes(url),
  );
  checks.push({
    name: 'React stale closure TechArticle declares the complete code-review contract',
    ok:
      reactStaleClosuresArticle?.['@id'] === REACT_STALE_CLOSURES_CANONICAL &&
      reactStaleClosuresArticle?.headline === REACT_STALE_CLOSURES_H1 &&
      reactStaleClosuresArticle?.description === REACT_STALE_CLOSURES_DESCRIPTION &&
      reactStaleClosuresArticle?.datePublished === '2026-01-25T00:00:00.000Z' &&
      reactStaleClosuresArticle?.dateModified === '2026-08-03T00:00:00.000Z' &&
      reactStaleClosuresArticle?.isAccessibleForFree === true &&
      reactStaleClosuresArticle?.learningResourceType === 'Code review exercise' &&
      /react/i.test(reactStaleClosuresAboutNames) &&
      /stale closure|code review/i.test(reactStaleClosuresAboutNames) &&
      /dependenc|exhaustive-deps/i.test(reactStaleClosuresMentionNames) &&
      /ref|useeffectevent/i.test(reactStaleClosuresMentionNames) &&
      reactStaleClosuresHasAllCaseFragments &&
      reactStaleClosuresHasAllCitations,
    detail: `dateModified=${reactStaleClosuresArticle?.dateModified || '(missing)'}`,
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

  const netflixUrl = `${base}${NETFLIX_PREVIEW_ROUTE}`;
  const netflixCurlOptions = { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT };
  const netflixStatus = await curlStatus(netflixUrl, netflixCurlOptions);
  const netflixBody = await curlBody(netflixUrl, netflixCurlOptions);
  const netflixTitle = extractTitle(netflixBody);
  const netflixDescription = extractMetaContent(netflixBody, 'name', 'description');
  const netflixCanonical = extractCanonical(netflixBody);
  const netflixRobots = extractRobots(netflixBody);
  const netflixH1 = extractH1(netflixBody);
  const netflixVisibleText = extractVisibleText(netflixBody);
  const netflixInternalLinks = extractInternalLinkPaths(netflixBody);
  const netflixJsonLd = extractSeoJsonLd(netflixBody);
  const netflixCollectionPage = netflixJsonLd.graph.find((node) =>
    hasSchemaType(node, 'CollectionPage'));
  const netflixBreadcrumbs = netflixJsonLd.graph.find((node) =>
    hasSchemaType(node, 'BreadcrumbList'));
  const netflixItemList = netflixJsonLd.graph.find((node) => hasSchemaType(node, 'ItemList'));
  const netflixListItems = Array.isArray(netflixItemList?.itemListElement)
    ? netflixItemList.itemListElement
    : [];

  checks.push({
    name: 'Googlebot receives Netflix company preview as 200',
    ok: netflixStatus === 200,
    detail: `${netflixStatus} ${NETFLIX_PREVIEW_ROUTE}`,
  });
  checks.push({
    name: 'Netflix company preview has exact title',
    ok: netflixTitle === NETFLIX_PREVIEW_TITLE,
    detail: `title=${netflixTitle || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview has exact description',
    ok: netflixDescription === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `description=${netflixDescription || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview mirrors exact Open Graph metadata',
    ok:
      extractMetaContent(netflixBody, 'property', 'og:title') === NETFLIX_PREVIEW_TITLE &&
      extractMetaContent(netflixBody, 'property', 'og:description') === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `og:title=${extractMetaContent(netflixBody, 'property', 'og:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview mirrors exact Twitter metadata',
    ok:
      extractMetaContent(netflixBody, 'name', 'twitter:title') === NETFLIX_PREVIEW_TITLE &&
      extractMetaContent(netflixBody, 'name', 'twitter:description') === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `twitter:title=${extractMetaContent(netflixBody, 'name', 'twitter:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview canonical is self-referential',
    ok: netflixCanonical === NETFLIX_PREVIEW_CANONICAL,
    detail: `canonical=${netflixCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview robots is index,follow',
    ok: netflixRobots.replace(/\s+/g, '') === 'index,follow',
    detail: `robots=${netflixRobots || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview has exact h1',
    ok: netflixH1 === NETFLIX_PREVIEW_H1,
    detail: `h1=${netflixH1 || '(missing)'}`,
  });

  const missingNetflixHeadings = NETFLIX_PREVIEW_HEADINGS.filter(
    (heading) => !netflixVisibleText.includes(normalizeText(heading)),
  );
  checks.push({
    name: 'Netflix company preview core guide sections are present in raw HTML',
    ok: missingNetflixHeadings.length === 0,
    detail: missingNetflixHeadings.length
      ? `missing=${missingNetflixHeadings.join(' | ')}`
      : 'all present',
  });
  checks.push({
    name: 'Netflix company preview trust note is present in raw HTML',
    ok: netflixVisibleText.includes(normalizeText(NETFLIX_PREVIEW_TRUST_NOTE)),
    detail: netflixVisibleText.includes(normalizeText(NETFLIX_PREVIEW_TRUST_NOTE))
      ? 'present'
      : 'missing',
  });

  const missingNetflixPrompts = NETFLIX_PREVIEW_PROMPTS.filter(
    (prompt) => !netflixVisibleText.includes(normalizeText(prompt.title)),
  );
  checks.push({
    name: 'Netflix company preview prompt titles are visible in raw HTML',
    ok: missingNetflixPrompts.length === 0,
    detail: missingNetflixPrompts.length
      ? `missing=${missingNetflixPrompts.map((prompt) => prompt.title).join(' | ')}`
      : 'all six present',
  });

  const missingNetflixResourceLinks = NETFLIX_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !netflixInternalLinks.has(route),
  );
  checks.push({
    name: 'Netflix company preview has all contextual public resource links in raw HTML',
    ok: missingNetflixResourceLinks.length === 0,
    detail: missingNetflixResourceLinks.length
      ? `missing=${missingNetflixResourceLinks.join(', ')}`
      : 'all eight present',
  });

  checks.push({
    name: 'Netflix company preview JSON-LD parses',
    ok: !netflixJsonLd.error && netflixJsonLd.graph.length > 0,
    detail: netflixJsonLd.error || `graph_nodes=${netflixJsonLd.graph.length}`,
  });
  const requiredNetflixSchemaTypes = [
    'Organization',
    'WebSite',
    'CollectionPage',
    'BreadcrumbList',
    'ItemList',
  ];
  const missingNetflixSchemaTypes = requiredNetflixSchemaTypes.filter(
    (type) => !netflixJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Netflix company preview has the required top-level schema graph',
    ok: missingNetflixSchemaTypes.length === 0,
    detail: missingNetflixSchemaTypes.length
      ? `missing=${missingNetflixSchemaTypes.join(', ')}`
      : 'all present',
  });
  const forbiddenNetflixSchemaTypes = ['FAQPage', 'QAPage', 'JobPosting', 'PracticeProblem'];
  const presentForbiddenNetflixSchemaTypes = forbiddenNetflixSchemaTypes.filter(
    (type) => netflixJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Netflix company preview avoids unsupported rich-result schema',
    ok: presentForbiddenNetflixSchemaTypes.length === 0,
    detail: presentForbiddenNetflixSchemaTypes.length
      ? `present=${presentForbiddenNetflixSchemaTypes.join(', ')}`
      : 'none present',
  });

  const netflixListMatchesVisiblePrompts = NETFLIX_PREVIEW_PROMPTS.every((prompt, index) => {
    const item = netflixListItems[index];
    return (
      item?.position === index + 1 &&
      item?.name === prompt.title &&
      item?.url === `${NETFLIX_PREVIEW_CANONICAL}#${prompt.id}`
    );
  });
  checks.push({
    name: 'Netflix company preview ItemList matches all six visible prompts',
    ok: netflixListItems.length === 6 && netflixListMatchesVisiblePrompts,
    detail: `item_count=${netflixListItems.length}`,
  });
  checks.push({
    name: 'Netflix company preview CollectionPage references the top-level ItemList',
    ok:
      Boolean(netflixCollectionPage?.mainEntity?.['@id']) &&
      netflixCollectionPage?.mainEntity?.['@id'] === netflixItemList?.['@id'],
    detail: `mainEntity=${netflixCollectionPage?.mainEntity?.['@id'] || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview CollectionPage declares free access and current modification date',
    ok:
      netflixCollectionPage?.isAccessibleForFree === true &&
      netflixCollectionPage?.dateModified === '2026-07-27T00:00:00.000Z',
    detail: `dateModified=${netflixCollectionPage?.dateModified || '(missing)'}`,
  });
  const netflixBreadcrumbItems = Array.isArray(netflixBreadcrumbs?.itemListElement)
    ? netflixBreadcrumbs.itemListElement
    : [];
  checks.push({
    name: 'Netflix company preview BreadcrumbList ends at the canonical page',
    ok:
      netflixBreadcrumbItems.length === 3 &&
      netflixBreadcrumbItems[2]?.name === NETFLIX_PREVIEW_H1 &&
      netflixBreadcrumbItems[2]?.item === NETFLIX_PREVIEW_CANONICAL,
    detail: `item_count=${netflixBreadcrumbItems.length}`,
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
