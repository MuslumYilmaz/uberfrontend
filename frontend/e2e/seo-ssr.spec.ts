import { test, expect, Page } from '@playwright/test';

const WEB_HOST = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const WEB_PORT = process.env.PLAYWRIGHT_PORT || '4200';
const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || `http://${WEB_HOST}:${WEB_PORT}`).replace(/\/$/, '');
const CANONICAL_BASE = (process.env.PLAYWRIGHT_CANONICAL_BASE || 'https://frontendatlas.com').replace(/\/$/, '');
const SSR_ENABLED = (() => {
  if (process.env.PLAYWRIGHT_SSR === '1') return true;
  try {
    const { hostname } = new URL(BASE_URL);
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  } catch {
    return false;
  }
})();

const STALE_CLOSURES_PATH = '/react/trivia/react-stale-state-closures';
const STALE_CLOSURES_TITLE = 'React Stale Closures: Causes, Fixes, and Tests';
const STALE_CLOSURES_H1 = 'React Stale Closures: Why State Goes Stale and How to Fix It';
const STALE_CLOSURES_DESCRIPTION =
  'Learn why React closures read stale state and fix them with dependencies, functional updates, refs, and useEffectEvent, using real examples and tests.';

const ASYNC_RACE_PATH = '/javascript/trivia/js-async-race-conditions';
const ASYNC_RACE_TITLE = 'JavaScript Async Race Conditions: Fix Stale UI';
const ASYNC_RACE_H1 = 'Async Race Conditions and Stale UI Updates';
const ASYNC_RACE_DESCRIPTION =
  'Fix the stale UI bug where older async work overwrites newer results; compare AbortController, request-id guards, and takeLatest ownership.';

const CASES = [
  {
    path: '/coding',
    titleIncludes: 'frontend coding challenges',
    h1: 'Frontend Coding Challenges',
    detail: false,
    indexable: true,
    listTestIdPrefix: 'question-card-',
    bodyTextIncludes: [
      'JavaScript coding challenges',
      'React UI challenges',
      'Angular challenges',
      'Vue challenges',
      'HTML/CSS implementation exercises',
    ],
  },
  {
    path: '/angular/coding/angular-autocomplete-search-starter',
    titleIncludes: 'Angular Autocomplete Search',
    h1: 'Autocomplete Search Bar (Standalone Component)',
    detail: true,
    premiumPreviewText: 'autocomplete search bar',
  },
  {
    path: '/react/coding/react-autocomplete-search-starter',
    titleIncludes: 'React Autocomplete Interview Question: Debounce \\+ Tests',
    h1: 'Build a React Autocomplete Search Bar',
    detail: true,
    indexable: true,
    bodyTextIncludes: [
      'Frontend machine coding interview question',
      'Controlled query input',
      'Prevent stale slow responses',
      'React debounced search state practice',
    ],
  },
  {
    path: '/react/coding/react-counter',
    titleIncludes: 'Counter',
    h1: 'React Counter (Guarded Decrement)',
    detail: true,
  },
  {
    path: '/javascript/trivia/js-event-loop',
    titleIncludes: 'JavaScript Event Loop',
    h1: 'Explain the JavaScript Event Loop',
    detail: true,
    expectNoMonaco: true,
  },
  {
    path: '/react/trivia/react-render-nothing-return-value',
    titleIncludes: 'Can React Return undefined\\? React 18 vs null',
    h1: 'Can React Components Return undefined? React 18 vs null',
    detail: true,
    indexable: true,
    bodyTextIncludes: [
      'Quick answer',
      'React 18\\+ permits undefined component returns',
      'React 17 and earlier',
      'return null',
    ],
  },
  {
    path: STALE_CLOSURES_PATH,
    titleIncludes: STALE_CLOSURES_TITLE,
    h1: STALE_CLOSURES_H1,
    detail: true,
    indexable: true,
    singleHydratedH1: true,
    bodyTextIncludes: [
      'React stale closure: direct answer',
      'React stale closure fixes and examples',
      'Quick fix chooser',
      'How to test a stale closure bug',
      'Interview focus',
    ],
  },
  {
    path: '/guides/system-design-blueprint/radio-framework',
    titleIncludes: 'radio framework: frontend system design interview template',
    h1: 'RADIO Framework: Frontend System Design Interview Template',
    detail: true,
    indexable: true,
    singleHydratedH1: true,
  },
  {
    path: '/system-design/offline-email-client',
    titleIncludes: 'Gmail Frontend System Design: Offline Email Client',
    h1: 'Gmail-Style Offline Email Client Frontend System Design',
    detail: true,
    indexable: true,
    singleHydratedH1: true,
    bodyTextIncludes: [
      'incremental mailbox sync',
      'Worked example: the send succeeds and the response disappears',
      'Design review checkpoint',
    ],
  },
];

const RAW_HTML_CASES: Array<{
  path: string;
  access: 'free' | 'premium';
  titleText: string;
  includeText: string[];
  excludeText?: string[];
}> = [
  {
    path: '/angular/coding/angular-counter-starter',
    access: 'free',
    titleText: 'Counter (Standalone Component)',
    includeText: ['Implement a standalone counter', 'Guard the decrement at zero'],
  },
  {
    path: '/css/coding/css-selectors-text-basics',
    access: 'free',
    titleText: 'Selectors & Text',
    includeText: ['Style a small hero header', 'selector targeting'],
  },
  {
    path: '/angular/coding/angular-contact-form-starter',
    access: 'premium',
    titleText: 'Contact Form (Standalone Component + HTTP)',
    includeText: ['Premium', 'View pricing'],
    excludeText: ['This exercise combines a standalone component', 'reactive forms, and HttpClient'],
  },
  {
    path: '/angular/coding/angular-image-slider-starter',
    access: 'premium',
    titleText: 'Image Slider (Standalone Component)',
    includeText: ['Premium', 'View pricing'],
    excludeText: ['Model the slider as a small view model', 'readonly `slides`'],
  },
  {
    path: '/system-design/infinite-scroll-list',
    access: 'free',
    titleText: 'Infinite Scroll List System Design',
    includeText: ['cursor pagination', 'virtualization'],
  },
  {
    path: '/system-design/ai-agent-run-inspector',
    access: 'free',
    titleText: 'AI Agent Run Inspector Frontend System Design',
    includeText: ['nested agent turns', 'Worked example: follow one run through the reducer', 'Interview answer checkpoint'],
  },
  {
    path: '/system-design/offline-email-client',
    access: 'free',
    titleText: 'Gmail-Style Offline Email Client Frontend System Design',
    includeText: [
      'incremental mailbox sync',
      'Worked example: the send succeeds and the response disappears',
      'Design review checkpoint',
    ],
  },
  {
    path: '/system-design/endless-short-video-feed',
    access: 'premium',
    titleText: 'Endless Short-Video Feed',
    includeText: ['Premium', 'View pricing'],
    excludeText: ['Use RADIO', 'Time-to-first-frame <= 1.0s', 'Queue the next 1-3 videos'],
  },
  {
    path: '/incidents/search-typing-lag',
    access: 'free',
    titleText: 'Search box typing lag under product-card load',
    includeText: ['Begin simulator', 'Typing gets laggy'],
  },
  {
    path: '/incidents/websocket-memory-leak',
    access: 'premium',
    titleText: 'Realtime feed leaks sockets and listeners',
    includeText: ['Premium', 'View pricing'],
    excludeText: ['Effect excerpt', 'Correct. The main problem', 'useEffect(() =>'],
  },
  {
    path: '/tradeoffs/object-vs-map-keyed-collections',
    access: 'free',
    titleText: 'Object vs Map for keyed JavaScript collections',
    includeText: ['Reveal analysis', 'A dashboard keeps adding'],
  },
  {
    path: '/tradeoffs/localstorage-vs-sessionstorage-browser-persistence',
    access: 'premium',
    titleText: 'localStorage vs sessionStorage for browser persistence',
    includeText: ['Premium', 'View pricing'],
    excludeText: ['A strong answer here would separate durable preferences', 'Decision matrix', 'I would use localStorage because it persists more'],
  },
];

const HOME_TITLE = 'Frontend Interview Prep Platform';

const GOOGLE_PREVIEW_PATH = '/companies/google/preview';
const GOOGLE_PREVIEW_TITLE = 'Google Frontend Interview Questions: 7 Prompts + Prep Guide';
const GOOGLE_PREVIEW_DESCRIPTION =
  'Prepare for a Google frontend interview with 7 representative questions covering DSA, JavaScript, browser APIs, UI coding, accessibility, and system design.';
const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
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
] as const;
const GOOGLE_PREVIEW_RESOURCES = [
  '/javascript/coding/js-get-by-path-1',
  '/javascript/coding/js-debounce',
  '/react/coding/react-autocomplete-search-starter',
  '/javascript/coding/js-take-latest',
  '/javascript/trivia/js-event-delegation',
  '/javascript/trivia/web-performance-optimize-load-time',
  '/system-design/infinite-scroll-list',
  '/javascript/trivia/js-compare-two-objects',
] as const;
const GOOGLE_PREVIEW_INBOUND_PAGES = [
  { path: '/companies', anchor: 'Google frontend interview questions' },
  { path: '/interview-questions', anchor: 'Google company preparation guide' },
  { path: '/guides/framework-prep', anchor: 'framework-neutral Google frontend prep' },
  { path: '/tracks', anchor: 'Google-focused frontend practice' },
] as const;

const NETFLIX_PREVIEW_PATH = '/companies/netflix/preview';
const NETFLIX_PREVIEW_TITLE = 'Netflix Frontend Interview Questions: 6 Prompts + Prep Guide';
const NETFLIX_PREVIEW_DESCRIPTION =
  'Prepare for a Netflix frontend interview with 6 representative prompts on JavaScript, React, streaming UI, performance, accessibility, and system design.';
const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
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
] as const;
const NETFLIX_PREVIEW_RESOURCES = [
  '/javascript/coding/js-debounce',
  '/javascript/coding/js-take-latest',
  '/react/trivia/react-prevent-unnecessary-rerenders',
  '/javascript/trivia/content-delivery-caching-strategies-streaming',
  '/system-design/infinite-scroll-list',
  '/system-design/dashboard-widgets-draggable-resizable',
  '/guides/system-design-blueprint/performance',
  '/guides/behavioral/stories',
] as const;
const NETFLIX_OFFICIAL_SOURCES = [
  'https://jobs.netflix.com/careers/engineering',
  'https://jobs.netflix.com/culture',
  'https://jobs.netflix.com/careers/new-grads',
  'https://netflixtechblog.com/crafting-a-high-performance-tv-user-interface-using-react-3350e5a6ad3b',
  'https://netflixtechblog.com/lumen-custom-self-service-dashboarding-for-netflix-8c56b541548c',
] as const;
const NETFLIX_PREVIEW_INBOUND_PAGES = [
  { path: '/', anchor: 'View Netflix preview' },
  { path: '/companies', anchor: 'Netflix frontend interview questions' },
  { path: '/system-design', anchor: 'Netflix frontend interview questions' },
] as const;

const INFINITE_SCROLL_PATH = '/system-design/infinite-scroll-list';
const INFINITE_SCROLL_TITLE = 'Infinite Scroll List Frontend System Design';
const INFINITE_SCROLL_H1 = 'Infinite Scroll List System Design';
const INFINITE_SCROLL_SEO_DESCRIPTION =
  'Design infinite scrolling with cursor pagination, request recovery, virtualization, stable scroll anchors, and accessible navigation alternatives.';
const INFINITE_SCROLL_CATALOG_DESCRIPTION =
  'Design an infinite-scroll list with cursor pagination, request recovery, bounded DOM rendering, stable scroll anchors, and accessible alternatives.';
const INFINITE_SCROLL_SECTION_TITLES = [
  'Requirements and a 60-second answer',
  'Architecture and data flow',
  'Pagination, state, and data correctness',
  'Interface contracts for components and pagination',
  'Optimizations for virtualization, accessibility, recovery, and verification',
] as const;
const INFINITE_SCROLL_INTERNAL_RESOURCES = [
  '/javascript/coding/js-take-latest',
  '/javascript/coding/js-abortable-helpers',
  '/guides/system-design-blueprint/performance',
  '/guides/system-design-blueprint/evaluation',
] as const;
const INFINITE_SCROLL_OFFICIAL_SOURCES = [
  'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
  'https://www.w3.org/WAI/ARIA/apg/patterns/feed/',
  'https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading',
  'https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration',
  'https://web.dev/articles/virtualize-long-lists-react-window',
] as const;

const AI_AGENT_RUN_INSPECTOR_PATH = '/system-design/ai-agent-run-inspector';
const AI_AGENT_RUN_INSPECTOR_TITLE = 'AI Agent Run Inspector Frontend System Design';
const AI_AGENT_RUN_INSPECTOR_SEO_DESCRIPTION =
  'Design an AI agent trace viewer with nested spans, streamed tool calls, human approvals, reconnects, virtualization, redaction, and accessible navigation.';
const OFFLINE_EMAIL_CLIENT_PATH = '/system-design/offline-email-client';
const OFFLINE_EMAIL_CLIENT_H1 = 'Gmail-Style Offline Email Client Frontend System Design';
const OFFLINE_EMAIL_CLIENT_SEO_TITLE = 'Gmail Frontend System Design: Offline Email Client';
const OFFLINE_EMAIL_CLIENT_SEO_DESCRIPTION =
  'Design an offline email client with incremental mailbox sync, IndexedDB caching, durable drafts, idempotent sends, safe HTML, and accessible navigation.';
const OFFLINE_EMAIL_CLIENT_CATALOG_DESCRIPTION =
  'Design an offline-first web email client with normalized mailbox state, incremental sync, durable drafts, idempotent sending, safe message rendering, and accessible navigation.';
const PREMIUM_SYSTEM_DESIGN_SEO_CASES = [
  {
    path: '/system-design/netflix-scale-expansion',
    title: 'Netflix Continue Watching Frontend System Design',
    description: 'Design a Continue Watching frontend with progress reconciliation, optimistic removal, focus navigation, responsive media loading, and safe rollout.',
    paidText: 'Worked example: stale progress and optimistic removal',
  },
  {
    path: '/system-design/ui-component-state-from-mock',
    title: 'UI Component and State Design From a Mock',
    description: 'Turn a support-inbox mock into component boundaries, URL and server state, local drafts, optimistic updates, responsive behavior, and accessible focus.',
    paidText: 'Desktop mock',
  },
] as const;

function expectedCanonical(path: string): string {
  if (path === '/') return `${CANONICAL_BASE}/`;
  return `${CANONICAL_BASE}${path}`;
}

function fullUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path}`;
}

function isSkeletonH1(text: string): boolean {
  if (!text) return true;
  return /loading|skeleton|preparing|please wait/i.test(text);
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function normalizeText(value: string): string {
  return decodeBasicHtmlEntities(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isTagNameBoundary(value: string): boolean {
  return value === '' || value === '>' || value === '/' || value.trim() === '';
}

function findElementStart(lowerHtml: string, tagName: string, fromIndex: number): number {
  const needle = `<${tagName}`;
  let cursor = fromIndex;
  while (cursor < lowerHtml.length) {
    const start = lowerHtml.indexOf(needle, cursor);
    if (start === -1) return -1;
    const next = lowerHtml.charAt(start + needle.length);
    if (isTagNameBoundary(next)) return start;
    cursor = start + needle.length;
  }
  return -1;
}

function findElementEnd(html: string, lowerHtml: string, tagName: string, fromIndex: number): number {
  const needle = `</${tagName}`;
  let cursor = fromIndex;
  while (cursor < lowerHtml.length) {
    const start = lowerHtml.indexOf(needle, cursor);
    if (start === -1) return -1;
    const next = lowerHtml.charAt(start + needle.length);
    if (!isTagNameBoundary(next)) {
      cursor = start + needle.length;
      continue;
    }
    const close = html.indexOf('>', start);
    return close === -1 ? -1 : close + 1;
  }
  return -1;
}

function stripElementBlocks(html: string, tagName: 'script' | 'style'): string {
  const lowerHtml = html.toLowerCase();
  let cursor = 0;
  let stripped = '';

  while (cursor < html.length) {
    const start = findElementStart(lowerHtml, tagName, cursor);
    if (start === -1) {
      stripped += html.slice(cursor);
      break;
    }

    const openEnd = html.indexOf('>', start);
    if (openEnd === -1) {
      stripped += html.slice(cursor);
      break;
    }

    const end = findElementEnd(html, lowerHtml, tagName, openEnd + 1);
    if (end === -1) {
      stripped += html.slice(cursor);
      break;
    }

    stripped += `${html.slice(cursor, start)} `;
    cursor = end;
  }

  return stripped;
}

function stripScriptAndStyleBlocks(html: string): string {
  return stripElementBlocks(stripElementBlocks(html, 'script'), 'style');
}

function rawVisibleText(html: string): string {
  return normalizeText(
    stripScriptAndStyleBlocks(html).replace(/<[^>]+>/g, ' '),
  );
}

function rawVisibleTextPreserveCase(html: string): string {
  return decodeBasicHtmlEntities(
    stripScriptAndStyleBlocks(html).replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRawTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
}

function extractRawH1(html: string): string {
  const raw = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRawJsonLdTypes(html: string): string[] {
  const types: string[] = [];
  for (const node of extractRawJsonLdNodes(html)) {
    const type = node?.['@type'];
    if (Array.isArray(type)) types.push(...type.map((item) => String(item)));
    else if (type) types.push(String(type));
  }
  return types;
}

function extractRawJsonLdNodes(html: string): Array<Record<string, any>> {
  const nodes: Array<Record<string, any>> = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const payload = JSON.parse(match[1]);
      const roots = Array.isArray(payload) ? payload : [payload];
      for (const root of roots) {
        const graph = Array.isArray(root?.['@graph']) ? root['@graph'] : [root];
        for (const node of graph) {
          if (node && typeof node === 'object') nodes.push(node);
        }
      }
    } catch (error) {
      throw new Error(`Unable to parse raw JSON-LD: ${String(error)}`);
    }
  }
  return nodes;
}

function extractRawMeta(html: string, name: string): string {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i'))?.[0] || '';
  return tag.match(/\scontent=["']([^"']*)["']/i)?.[1] || '';
}

function extractRawPropertyMeta(html: string, property: string): string {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*>`, 'i'))?.[0] || '';
  return tag.match(/\scontent=["']([^"']*)["']/i)?.[1] || '';
}

function extractRawCanonical(html: string): string {
  const tag = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '';
  return tag.match(/\shref=["']([^"']*)["']/i)?.[1] || '';
}

function rawBodyMarkup(html: string): string {
  return stripScriptAndStyleBlocks(html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html);
}

function hasLockedShellMarkup(html: string): boolean {
  return /\bclass=(["'])[^"']*\blocked-shell\b[^"']*\1/i.test(rawBodyMarkup(html));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectCleanRawLink(html: string, target: string, source: string): void {
  const escapedTarget = escapeRegExp(target);
  expect(html, `${source} links directly to ${target}`).toMatch(
    new RegExp(`<a\\b[^>]*href=["']${escapedTarget}["'][^>]*>`, 'i'),
  );
  expect(html, `${source} does not append query parameters to ${target}`).not.toMatch(
    new RegExp(`href=["']${escapedTarget}\\?`, 'i'),
  );
}

function extractRawLinkText(html: string, target: string): string {
  const escapedTarget = escapeRegExp(target);
  const anchorHtml = html.match(
    new RegExp(`<a\\b[^>]*href=["']${escapedTarget}["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'),
  )?.[1] || '';
  return rawVisibleText(anchorHtml);
}

async function readRawHtml(request: any, path: string): Promise<string> {
  const response = await request.get(fullUrl(path));
  expect(response.status(), `status for ${path}`).toBe(200);
  return response.text();
}

function collectClientRuntimeIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      issues.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    issues.push(error.message);
  });
  return issues;
}

function expectNoHydrationOrChunkIssues(issues: string[], path: string): void {
  const relevant = issues.filter((message) =>
    /NG05|hydration|hydrate|chunkloaderror|dynamically imported module|loading chunk|module script failed/i.test(message),
  );
  expect(relevant, `hydration/chunk runtime issues on ${path}`).toEqual([]);
}

async function assertSsrBasics(
  page: Page,
  entry: {
    path: string;
    h1: string;
    detail?: boolean;
    expectNoMonaco?: boolean;
    premiumPreviewText?: string;
    listTestIdPrefix?: string;
    indexable?: boolean;
    singleHydratedH1?: boolean;
    bodyTextIncludes?: string[];
  },
) {
  const title = await page.title();
  expect(title).not.toBe(HOME_TITLE);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe(expectedCanonical(entry.path));

  if (entry.indexable) {
    const robots = ((await page.locator('meta[name="robots"]').getAttribute('content')) || '').toLowerCase();
    expect(robots).not.toContain('noindex');
  }

  const h1Locator = page.locator('h1');
  const h1Count = await h1Locator.count();
  if (h1Count > 0) {
    const h1 = (await h1Locator.first().textContent())?.trim() || '';
    if (entry.detail) {
      expect(isSkeletonH1(h1)).toBe(false);
    }
    expect(h1).toContain(entry.h1);
  }

  await expect(page.locator('[data-testid="offline-banner"]')).toHaveCount(0);
  await expect(page.getByText(/Question not found/i)).toHaveCount(0);

  if (entry.detail) {
    await expect(page.getByText(/Loading question/i)).toHaveCount(0);
  }

  if (entry.listTestIdPrefix) {
    await expect(page.getByText(/Loading questions/i)).toHaveCount(0);
    const count = await page.locator(`[data-testid^="${entry.listTestIdPrefix}"]`).count();
    expect(count).toBeGreaterThan(0);
  }

  if (entry.premiumPreviewText) {
    await expect(page.getByTestId('premium-preview')).toContainText(
      new RegExp(entry.premiumPreviewText, 'i'),
    );
  }

  if (entry.expectNoMonaco) {
    await expect(page.locator('script[src*="monaco"]')).toHaveCount(0);
    await expect(page.locator('script:has-text("monaco")')).toHaveCount(0);
  }

  for (const expectedText of entry.bodyTextIncludes || []) {
    await expect(page.getByText(new RegExp(expectedText, 'i')).first()).toHaveCount(1);
  }
}

async function assertHydratedBasics(
  page: Page,
  entry: {
    path: string;
    titleIncludes: string;
    h1: string;
    detail?: boolean;
    premiumPreviewText?: string;
    listTestIdPrefix?: string;
    indexable?: boolean;
    singleHydratedH1?: boolean;
    bodyTextIncludes?: string[];
  },
) {
  await expect(page).toHaveTitle(new RegExp(entry.titleIncludes, 'i'));

  await expect
    .poll(() => page.locator('link[rel="canonical"]').getAttribute('href'))
    .toBe(expectedCanonical(entry.path));

  if (entry.indexable) {
    await expect
      .poll(async () => ((await page.locator('meta[name="robots"]').getAttribute('content')) || '').toLowerCase())
      .not.toContain('noindex');
  }

  const h1 = (await page.locator('h1').first().textContent())?.trim() || '';
  expect(h1).toContain(entry.h1);

  if (entry.singleHydratedH1) {
    await expect
      .poll(() => page.locator('h1:visible').count())
      .toBe(1);
    await expect(page.locator('.guide-ssr-shell')).toHaveCount(0);
  }

  await expect(page.locator('[data-testid="offline-banner"]')).toHaveCount(0);
  await expect(page.getByText(/Question not found/i)).toHaveCount(0);
  if (entry.detail) {
    await expect(page.getByText(/Loading question/i)).toHaveCount(0);
  }

  if (entry.listTestIdPrefix) {
    await expect(page.getByText(/Loading questions/i)).toHaveCount(0);
    const count = await page.locator(`[data-testid^="${entry.listTestIdPrefix}"]`).count();
    expect(count).toBeGreaterThan(0);
  }

  if (entry.premiumPreviewText) {
    await expect(page.getByTestId('premium-preview')).toContainText(
      new RegExp(entry.premiumPreviewText, 'i'),
    );
  }

  for (const expectedText of entry.bodyTextIncludes || []) {
    await expect(page.getByText(new RegExp(expectedText, 'i')).first()).toHaveCount(1);
  }
}

test.describe('seo-ssr', () => {
  test.skip(
    !SSR_ENABLED,
    'SSR tests require prerender/SSR output (set PLAYWRIGHT_SSR=1 to force).',
  );

  test('SSR HTML renders correct shell + meta (JS disabled)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    for (const entry of CASES) {
      await page.goto(fullUrl(entry.path), { waitUntil: 'domcontentloaded' });
      await assertSsrBasics(page, entry);
    }

    await context.close();
  });

  test('raw prerendered HTML carries premium index intent without paid-content exposure', async ({ request }) => {
    for (const entry of RAW_HTML_CASES) {
      const html = await readRawHtml(request, entry.path);
      const text = rawVisibleText(html);
      const searchableHtml = normalizeText(html.replace(/<[^>]+>/g, ' '));
      const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');

      expect(extractRawCanonical(html), `canonical for ${entry.path}`).toBe(expectedCanonical(entry.path));
      expect(text, `title/H1 text for ${entry.path}`).toContain(normalizeText(entry.titleText));

      if (entry.access === 'premium') {
        expect(robots, `robots for ${entry.path}`).toBe('noindex,follow');
        expect(hasLockedShellMarkup(html), `locked shell for ${entry.path}`).toBe(true);
      } else {
        expect(robots, `robots for ${entry.path}`).not.toContain('noindex');
        expect(hasLockedShellMarkup(html), `no locked shell for ${entry.path}`).toBe(false);
      }

      for (const expectedText of entry.includeText || []) {
        expect(text, `raw HTML includes ${expectedText} on ${entry.path}`).toContain(normalizeText(expectedText));
      }

      for (const forbiddenText of entry.excludeText || []) {
        expect(searchableHtml, `raw HTML excludes paid text ${forbiddenText} on ${entry.path}`).not.toContain(
          normalizeText(forbiddenText),
        );
      }
    }
  });

  test('rewritten premium system designs expose exact SEO and schema without leaking the answer', async ({ request }) => {
    for (const entry of PREMIUM_SYSTEM_DESIGN_SEO_CASES) {
      const html = await readRawHtml(request, entry.path);
      const schemaNodes = extractRawJsonLdNodes(html);
      const schemaTypes = extractRawJsonLdTypes(html);
      const searchableHtml = normalizeText(html.replace(/<[^>]+>/g, ' '));

      expect(extractRawTitle(html)).toBe(entry.title);
      expect(extractRawH1(html)).toBe(entry.title);
      expect((rawBodyMarkup(html).match(/<h1\b/gi) || []).length).toBe(1);
      expect(extractRawMeta(html, 'description')).toBe(entry.description);
      expect(extractRawCanonical(html)).toBe(expectedCanonical(entry.path));
      expect(normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '')).toBe('noindex,follow');
      expect(hasLockedShellMarkup(html)).toBe(true);
      expect(searchableHtml).not.toContain(normalizeText(entry.paidText));
      expect(schemaTypes).toEqual(expect.arrayContaining(['BreadcrumbList', 'Article', 'LearningResource']));

      const article = schemaNodes.find((node) => node['@type'] === 'Article');
      expect(article).toMatchObject({
        '@id': expectedCanonical(entry.path),
        headline: entry.title,
        description: entry.description,
        url: expectedCanonical(entry.path),
        mainEntityOfPage: expectedCanonical(entry.path),
        isAccessibleForFree: false,
      });
      const learningResource = schemaNodes.find((node) => node['@type'] === 'LearningResource');
      expect(learningResource).toMatchObject({
        '@id': `${expectedCanonical(entry.path)}#learning-resource`,
        name: entry.title,
        url: expectedCanonical(entry.path),
        isAccessibleForFree: false,
      });
    }
  });

  test('raw premium progress-bar shell preserves literal threshold comparators without solution leakage', async ({ request }) => {
    const html = await readRawHtml(request, '/react/coding/react-progress-bar-thresholds');

    expect(html).toContain('&lt;34');
    expect(html).toContain('&gt;66');
    expect(html).toContain('orange 34–66');
    expect(html).not.toContain('Functional state updates to avoid stale reads.');
    expect(hasLockedShellMarkup(html)).toBe(true);
    expect(normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '')).toBe('noindex,follow');
  });

  test('raw JavaScript async race title experiment changes only the search title contract', async ({ request }) => {
    const html = await readRawHtml(request, ASYNC_RACE_PATH);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');

    expect(extractRawTitle(html)).toBe(ASYNC_RACE_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(ASYNC_RACE_DESCRIPTION);
    expect(extractRawH1(html)).toBe(ASYNC_RACE_H1);
    expect(rawBodyMarkup(html).match(/<h1\b/gi) || []).toHaveLength(1);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(ASYNC_RACE_PATH));
    expect(robots).toBe('index,follow');
  });

  test('raw React stale closures landing page preserves indexable developer-first SEO and schema', async ({ request }) => {
    const html = await readRawHtml(request, STALE_CLOSURES_PATH);
    const text = rawVisibleText(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(STALE_CLOSURES_TITLE);
    expect(extractRawH1(html)).toBe(STALE_CLOSURES_H1);
    expect(rawBodyMarkup(html).match(/<h1\b/gi) || []).toHaveLength(1);
    expect(extractRawMeta(html, 'description')).toBe(STALE_CLOSURES_DESCRIPTION);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(STALE_CLOSURES_PATH));
    expect(robots).toBe('index,follow');

    expect(extractRawPropertyMeta(html, 'og:title')).toBe(STALE_CLOSURES_TITLE);
    expect(extractRawPropertyMeta(html, 'og:description')).toBe(STALE_CLOSURES_DESCRIPTION);
    expect(extractRawMeta(html, 'twitter:title')).toBe(STALE_CLOSURES_TITLE);
    expect(extractRawMeta(html, 'twitter:description')).toBe(STALE_CLOSURES_DESCRIPTION);
    expect(text).toContain(normalizeText('Each React render creates a new set of state and prop bindings'));

    const orderedContent = [
      'React stale closure: direct answer',
      'Quick fix chooser',
      'Scenario 1: setInterval reads old state',
      'How to test a stale closure bug',
      'React stale closure FAQ',
      'Interview focus',
    ].map((label) => ({ label, index: text.indexOf(normalizeText(label)) }));

    orderedContent.forEach(({ label, index }) => {
      expect(index, `raw HTML includes ${label}`).toBeGreaterThanOrEqual(0);
    });
    for (let index = 1; index < orderedContent.length; index += 1) {
      expect(
        orderedContent[index].index,
        `${orderedContent[index].label} follows ${orderedContent[index - 1].label}`,
      ).toBeGreaterThan(orderedContent[index - 1].index);
    }

    expect(schemaTypes).toContain('BreadcrumbList');
    expect(schemaTypes).toContain('TechArticle');
    expect(schemaTypes).not.toContain('FAQPage');
    expect(schemaTypes).not.toContain('QAPage');
    expect(schemaTypes).not.toContain('Question');

    const article = schemaNodes.find((node) => node['@type'] === 'TechArticle');
    expect(article).toMatchObject({
      '@id': expectedCanonical(STALE_CLOSURES_PATH),
      headline: STALE_CLOSURES_H1,
      description: STALE_CLOSURES_DESCRIPTION,
      url: expectedCanonical(STALE_CLOSURES_PATH),
      mainEntityOfPage: expectedCanonical(STALE_CLOSURES_PATH),
      datePublished: '2026-01-25T00:00:00.000Z',
      dateModified: '2026-07-20T00:00:00.000Z',
      isAccessibleForFree: true,
    });
  });

  test('hydrated React stale closures landing page preserves developer-first content without runtime issues', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __FA_SEO_HOST__?: string }).__FA_SEO_HOST__ = 'frontendatlas.com';
    });
    const runtimeIssues = collectClientRuntimeIssues(page);

    const response = await page.goto(STALE_CLOSURES_PATH, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await assertHydratedBasics(page, {
      path: STALE_CLOSURES_PATH,
      titleIncludes: STALE_CLOSURES_TITLE,
      h1: STALE_CLOSURES_H1,
      detail: true,
      indexable: true,
      singleHydratedH1: true,
      bodyTextIncludes: [
        'React stale closure: direct answer',
        'Quick fix chooser',
        'How to test a stale closure bug',
        'Interview focus',
      ],
    });

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      STALE_CLOSURES_DESCRIPTION,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', STALE_CLOSURES_TITLE);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', STALE_CLOSURES_TITLE);
    await expect(page.locator('table.table--stacked-mobile')).toHaveCount(2);

    const bodyText = normalizeText(await page.locator('body').innerText());
    const orderedLabels = [
      'React stale closure: direct answer',
      'Quick fix chooser',
      'How to test a stale closure bug',
      'React stale closure FAQ',
      'Interview focus',
    ];
    const positions = orderedLabels.map((label) => bodyText.indexOf(normalizeText(label)));
    positions.forEach((position, index) => {
      expect(position, `hydrated page includes ${orderedLabels[index]}`).toBeGreaterThanOrEqual(0);
    });
    for (let index = 1; index < positions.length; index += 1) {
      expect(positions[index], `${orderedLabels[index]} follows ${orderedLabels[index - 1]}`).toBeGreaterThan(
        positions[index - 1],
      );
    }

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 834, height: 1112 },
      { width: 1366, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const layout = await page.evaluate(() => {
        const main = document.querySelector('[data-testid="trivia-detail-main"]');
        const stackedTables = Array.from(document.querySelectorAll('table.table--stacked-mobile'));
        const code = document.querySelector('pre.line-numbers');
        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          mainOverflow: main ? main.scrollWidth - main.clientWidth : 0,
          tableDisplays: stackedTables.map((table) => getComputedStyle(table).display),
          codeWhiteSpace: code ? getComputedStyle(code).whiteSpace : '',
          codeOverflowX: code ? getComputedStyle(code).overflowX : '',
        };
      });

      expect(layout.documentOverflow, `document overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(layout.mainOverflow, `main content overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      if (viewport.width <= 768) {
        expect(layout.tableDisplays).toEqual(['block', 'block']);
        expect(layout.codeWhiteSpace).toBe('pre-wrap');
        expect(layout.codeOverflowX).toBe('hidden');
      } else {
        expect(layout.tableDisplays).toEqual(['table', 'table']);
      }
    }

    await page.waitForTimeout(300);
    expectNoHydrationOrChunkIssues(runtimeIssues, STALE_CLOSURES_PATH);
  });

  test('raw infinite scroll guide preserves its proven snippet while exposing the complete public design answer', async ({ request }) => {
    const html = await readRawHtml(request, INFINITE_SCROLL_PATH);
    const bodyMarkup = rawBodyMarkup(html);
    const text = rawVisibleText(html);
    const caseText = rawVisibleTextPreserveCase(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(INFINITE_SCROLL_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(INFINITE_SCROLL_SEO_DESCRIPTION);
    expect(extractRawH1(html)).toBe(INFINITE_SCROLL_H1);
    expect(bodyMarkup.match(/<h1\b/gi) || []).toHaveLength(1);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(INFINITE_SCROLL_PATH));
    expect(robots).toBe('index,follow');

    for (const heading of INFINITE_SCROLL_SECTION_TITLES) {
      expect(text, `infinite scroll guide includes ${heading}`).toContain(normalizeText(heading));
      expect(bodyMarkup, `${heading} renders as a semantic H2`).toMatch(
        new RegExp(`<h2\\b[^>]*>\\s*${escapeRegExp(heading)}\\s*<\\/h2>`, 'i'),
      );
    }

    [
      'one-way, changing feed',
      'unknown total',
      'cursor pagination',
      'variable-height rows',
      'scroll restoration',
      'stable ordering',
      'ID deduplication',
      'duplicate sentinel',
      'AbortController',
      'request generation',
      'stale response',
      'anchor item and intra-item offset',
      'measurement cache',
      'overscan',
      'bounded data cache',
      'aria-busy',
      'status announcements',
      'visible Load More',
      'persistent page URLs',
      'sequential links',
      'DOM node count',
      'long tasks',
      'duplicates, gaps',
    ].forEach((expectedText) => {
      expect(text, `infinite scroll guide includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    for (const resourcePath of INFINITE_SCROLL_INTERNAL_RESOURCES) {
      expectCleanRawLink(html, resourcePath, INFINITE_SCROLL_PATH);
    }
    for (const sourceUrl of INFINITE_SCROLL_OFFICIAL_SOURCES) {
      expectCleanRawLink(html, sourceUrl, INFINITE_SCROLL_PATH);
    }

    expect(caseText).not.toContain('**');
    expect(hasLockedShellMarkup(html)).toBe(false);
    expect(bodyMarkup).not.toMatch(/<app-locked-preview\b/i);
    expect(caseText).not.toContain('View pricing');

    ['BreadcrumbList', 'Article', 'LearningResource'].forEach((type) => {
      expect(schemaTypes, `JSON-LD includes ${type}`).toContain(type);
    });
    expect(schemaTypes).not.toContain('FAQPage');

    const article = schemaNodes.find((node) => node['@type'] === 'Article');
    expect(article).toMatchObject({
      '@id': expectedCanonical(INFINITE_SCROLL_PATH),
      headline: INFINITE_SCROLL_H1,
      description: INFINITE_SCROLL_SEO_DESCRIPTION,
      url: expectedCanonical(INFINITE_SCROLL_PATH),
      mainEntityOfPage: expectedCanonical(INFINITE_SCROLL_PATH),
      datePublished: '2025-11-22T00:00:00.000Z',
      dateModified: '2026-07-28T00:00:00.000Z',
      isAccessibleForFree: true,
    });

    const learningResource = schemaNodes.find((node) => node['@type'] === 'LearningResource');
    expect(learningResource).toMatchObject({
      '@id': `${expectedCanonical(INFINITE_SCROLL_PATH)}#learning-resource`,
      name: INFINITE_SCROLL_H1,
      description: INFINITE_SCROLL_CATALOG_DESCRIPTION,
      url: expectedCanonical(INFINITE_SCROLL_PATH),
      isAccessibleForFree: true,
    });
  });

  test('raw AI agent run inspector is indexable and exposes the complete free design answer', async ({ request }) => {
    const html = await readRawHtml(request, AI_AGENT_RUN_INSPECTOR_PATH);
    const bodyMarkup = rawBodyMarkup(html);
    const text = rawVisibleText(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(AI_AGENT_RUN_INSPECTOR_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(AI_AGENT_RUN_INSPECTOR_SEO_DESCRIPTION);
    expect(extractRawH1(html)).toBe(AI_AGENT_RUN_INSPECTOR_TITLE);
    expect(bodyMarkup.match(/<h1\b/gi) || []).toHaveLength(1);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(AI_AGENT_RUN_INSPECTOR_PATH));
    expect(robots).toBe('index,follow');
    expect(hasLockedShellMarkup(html)).toBe(false);

    [
      'nested agent turns',
      'A compact mental model',
      'Six concepts to keep separate',
      'Worked example: follow one run through the reducer',
      'Event-by-event reconciliation',
      'denied v4 from another tab',
      'Idempotent merge algorithm',
      'approval.requested',
      'Human-in-the-loop approval UI races',
      'Accessible virtualized treegrid',
      'Mobile and overflow resilience',
      'Interview answer checkpoint',
    ].forEach((expectedText) => {
      expect(text, `agent run inspector includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    [
      'AI agent trace viewer',
      'AI agent observability UI',
      'agent execution trace',
      'tool call inspector',
      'human-in-the-loop approval UI',
      'real-time trace streaming',
      'OpenTelemetry GenAI spans',
      'virtualized treegrid',
    ].forEach((phrase) => {
      const normalizedPhrase = normalizeText(phrase);
      const occurrenceCount = text.split(normalizedPhrase).length - 1;
      expect(occurrenceCount, `${phrase} appears once without keyword stuffing`).toBe(1);
    });

    ['BreadcrumbList', 'Article', 'LearningResource'].forEach((type) => {
      expect(schemaTypes, `JSON-LD includes ${type}`).toContain(type);
    });
    const article = schemaNodes.find((node) => node['@type'] === 'Article');
    expect(article).toMatchObject({
      '@id': expectedCanonical(AI_AGENT_RUN_INSPECTOR_PATH),
      headline: AI_AGENT_RUN_INSPECTOR_TITLE,
      description: AI_AGENT_RUN_INSPECTOR_SEO_DESCRIPTION,
      url: expectedCanonical(AI_AGENT_RUN_INSPECTOR_PATH),
      mainEntityOfPage: expectedCanonical(AI_AGENT_RUN_INSPECTOR_PATH),
      datePublished: '2026-07-28T00:00:00.000Z',
      dateModified: '2026-07-28T00:00:00.000Z',
      isAccessibleForFree: true,
    });
  });

  test('raw offline email client exposes exact indexable SEO and the complete free answer', async ({ request }) => {
    const html = await readRawHtml(request, OFFLINE_EMAIL_CLIENT_PATH);
    const bodyMarkup = rawBodyMarkup(html);
    const text = rawVisibleText(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(OFFLINE_EMAIL_CLIENT_SEO_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(OFFLINE_EMAIL_CLIENT_SEO_DESCRIPTION);
    expect(extractRawH1(html)).toBe(OFFLINE_EMAIL_CLIENT_H1);
    expect(bodyMarkup.match(/<h1\b/gi) || []).toHaveLength(1);
    expect(bodyMarkup).toMatch(
      /<pre\b[^>]*class=["'][^"']*\bsd-code\b[^"']*["'][^>]*>\s*<code\b[^>]*>[\s\S]*?type MailboxSnapshot/i,
    );
    expect(bodyMarkup).not.toMatch(/<app-monaco-editor\b/i);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH));
    expect(robots).toBe('index,follow');
    expect(hasLockedShellMarkup(html)).toBe(false);
    expect(bodyMarkup).not.toMatch(/<app-locked-preview\b/i);

    [
      'Gmail frontend system design',
      'not a confirmed or leaked Google interview question',
      'Worked example: the send succeeds and the response disappears',
      'One reply across cache, outbox, and mailbox sync',
      'clientCommandId',
      'expired cursor',
      'remote image',
      'Design review checkpoint',
    ].forEach((expectedText) => {
      expect(text, `offline email client includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    ['BreadcrumbList', 'Article', 'LearningResource'].forEach((type) => {
      expect(schemaTypes, `JSON-LD includes ${type}`).toContain(type);
    });
    const article = schemaNodes.find((node) => node['@type'] === 'Article');
    expect(article).toMatchObject({
      '@id': expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH),
      headline: OFFLINE_EMAIL_CLIENT_H1,
      description: OFFLINE_EMAIL_CLIENT_SEO_DESCRIPTION,
      url: expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH),
      mainEntityOfPage: expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH),
      datePublished: '2026-07-29T00:00:00.000Z',
      dateModified: '2026-07-29T00:00:00.000Z',
      isAccessibleForFree: true,
    });
    const learningResource = schemaNodes.find((node) => node['@type'] === 'LearningResource');
    expect(learningResource).toMatchObject({
      '@id': `${expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH)}#learning-resource`,
      name: OFFLINE_EMAIL_CLIENT_H1,
      description: OFFLINE_EMAIL_CLIENT_CATALOG_DESCRIPTION,
      url: expectedCanonical(OFFLINE_EMAIL_CLIENT_PATH),
      isAccessibleForFree: true,
      educationalLevel: 'hard',
    });
  });

  test('hydrated AI agent run inspector keeps its indexable metadata and full free content', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __FA_SEO_HOST__?: string }).__FA_SEO_HOST__ = 'frontendatlas.com';
    });
    const runtimeIssues = collectClientRuntimeIssues(page);

    const response = await page.goto(AI_AGENT_RUN_INSPECTOR_PATH, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(AI_AGENT_RUN_INSPECTOR_TITLE);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      expectedCanonical(AI_AGENT_RUN_INSPECTOR_PATH),
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      AI_AGENT_RUN_INSPECTOR_SEO_DESCRIPTION,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
    await expect(page.locator('h1')).toHaveText(AI_AGENT_RUN_INSPECTOR_TITLE);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.locked-card')).toHaveCount(0);
    await expect(page.getByText('Idempotent merge algorithm', { exact: true })).toBeVisible();
    await expect(page.getByText('Worked example: follow one run through the reducer', { exact: true })).toBeVisible();
    await expect(page.getByText('Event-by-event reconciliation', { exact: true })).toBeVisible();
    await expect(page.getByText('Accessible virtualized treegrid', { exact: true })).toBeVisible();
    await expect(page.getByText('Interview answer checkpoint', { exact: true })).toBeVisible();

    await page.waitForTimeout(300);
    expectNoHydrationOrChunkIssues(runtimeIssues, AI_AGENT_RUN_INSPECTOR_PATH);
  });

  test('infinite scroll guide keeps decision tables usable without page overflow at target widths', async ({ page }) => {
    const runtimeIssues = collectClientRuntimeIssues(page);
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 834, height: 1112 },
      { width: 1366, height: 900 },
      { width: 1440, height: 900 },
    ];

    await page.setViewportSize(viewports[0]);
    const response = await page.goto(INFINITE_SCROLL_PATH, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(INFINITE_SCROLL_H1);
    const expectedTableCount = await page.locator('.sd-table-scroll').count();
    expect(expectedTableCount).toBeGreaterThanOrEqual(4);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const layout = await page.evaluate(() => {
        const main = document.querySelector<HTMLElement>('.sdl-center');
        const tableScrollers = Array.from(document.querySelectorAll<HTMLElement>('.sd-table-scroll'));
        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          mainOverflow: main ? main.scrollWidth - main.clientWidth : Number.POSITIVE_INFINITY,
          h1Count: document.querySelectorAll('h1').length,
          tables: tableScrollers.map((scroller) => ({
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
            overflowX: getComputedStyle(scroller).overflowX,
          })),
        };
      });

      expect(layout.documentOverflow, `document overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(layout.mainOverflow, `main content overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(layout.h1Count, `single H1 at ${viewport.width}px`).toBe(1);
      expect(layout.tables, `decision tables at ${viewport.width}px`).toHaveLength(expectedTableCount);
      layout.tables.forEach((table, index) => {
        expect(table.clientWidth, `table ${index + 1} has a usable viewport at ${viewport.width}px`).toBeGreaterThan(0);
        expect(table.scrollWidth, `table ${index + 1} contains its content at ${viewport.width}px`).toBeGreaterThanOrEqual(
          table.clientWidth,
        );
        expect(['auto', 'scroll'], `table ${index + 1} scroll behavior at ${viewport.width}px`).toContain(
          table.overflowX,
        );
      });

      if (viewport.width <= 390) {
        expect(
          layout.tables.some((table) => table.scrollWidth > table.clientWidth),
          `at least one decision table scrolls horizontally at ${viewport.width}px`,
        ).toBe(true);
      }
    }

    await page.waitForTimeout(300);
    expectNoHydrationOrChunkIssues(runtimeIssues, INFINITE_SCROLL_PATH);
  });

  test('raw OpenAI company preview is indexable, crawlable, and free of premium leakage', async ({ request }) => {
    const html = await readRawHtml(request, '/companies/openai/preview');
    const text = rawVisibleText(html);
    const caseText = rawVisibleTextPreserveCase(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe('OpenAI Frontend Interview: 5 Practice Questions + Prep Guide');
    expect(extractRawMeta(html, 'description')).toBe(
      'Practice for OpenAI frontend interviews with representative prompts on streaming chat UI, stale stream handling, optimistic React state, accessibility, and history design.',
    );
    expect(extractRawH1(html)).toBe('OpenAI Frontend Interview Questions');
    expect(extractRawCanonical(html)).toBe(expectedCanonical('/companies/openai/preview'));
    expect(robots).toBe('index,follow');
    expect(schemaTypes).toContain('CollectionPage');
    expect(schemaTypes).toContain('BreadcrumbList');

    [
      'streaming chat composer',
      'stop/regenerate and stale stream handling',
      'react state + optimistic messages',
      'accessibility/keyboard interaction',
      'frontend system design/conversation history',
      'strong answer should cover',
      'walk through stale stream handling before you code',
      'unlock the full openai practice set',
    ].forEach((expectedText) => {
      expect(text, `OpenAI preview includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    expect(caseText).toContain(
      'Bunlar leaked veya confirmed OpenAI questions değildir; role-relevant representative practice prompts’tur.',
    );
    expect(caseText).toContain('OpenAI');
    expect(caseText).not.toContain('Openai');
    expect(caseText).not.toContain('Chat UI with Streaming Response');
    expect(caseText).not.toContain('AI Chat Text Area (ChatGPT-Style)');
    expect(caseText).not.toContain('AI UX Resilience and Control Patterns');

    const companiesHtml = await readRawHtml(request, '/companies');
    expect(companiesHtml).toMatch(/<a\b[^>]*href=["']\/companies\/openai\/preview["'][^>]*>/i);
    expect(companiesHtml).not.toMatch(/href=["']\/companies\/openai\/preview\?/i);
  });

  test('raw Google company preview exposes the complete public guide, schema, and crawlable links', async ({ request }) => {
    test.setTimeout(120_000);

    const html = await readRawHtml(request, GOOGLE_PREVIEW_PATH);
    const text = rawVisibleText(html);
    const caseText = rawVisibleTextPreserveCase(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(GOOGLE_PREVIEW_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(GOOGLE_PREVIEW_DESCRIPTION);
    expect(extractRawPropertyMeta(html, 'og:title')).toBe(GOOGLE_PREVIEW_TITLE);
    expect(extractRawPropertyMeta(html, 'og:description')).toBe(GOOGLE_PREVIEW_DESCRIPTION);
    expect(extractRawMeta(html, 'twitter:title')).toBe(GOOGLE_PREVIEW_TITLE);
    expect(extractRawMeta(html, 'twitter:description')).toBe(GOOGLE_PREVIEW_DESCRIPTION);
    expect(extractRawH1(html)).toBe(GOOGLE_PREVIEW_H1);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(GOOGLE_PREVIEW_PATH));
    expect(robots).toBe('index,follow');

    [
      'Public Google prep guide',
      '7 representative prompts',
      'DSA, JavaScript, browser, UI, system design',
      'Full route stays premium',
      'What to study first for a Google frontend interview',
      'Current process note — reviewed July 2026',
      'Seven Google frontend interview practice questions',
      'Walk through autocomplete request ordering before you code',
      'A 7-day Google frontend interview preparation plan',
      'Common Google frontend interview preparation questions',
      'Free public practice',
    ].forEach((expectedText) => {
      expect(text, `Google preview includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    expect(caseText).toContain(
      'These are representative FrontendAtlas practice prompts, not leaked or confirmed Google interview questions. Interview formats vary by role, level, team, location, and time.',
    );
    expect(caseText).toContain('Google-tagged FrontendAtlas practice set');
    expect(caseText).not.toContain('47 known questions');
    expect(caseText).not.toContain('Curry Function');
    expect(caseText).not.toContain('Image Slider (Dots + Previous/Next)');

    for (const prompt of GOOGLE_PREVIEW_PROMPTS) {
      expect(text, `visible prompt ${prompt.title}`).toContain(normalizeText(prompt.title));
      expect(html, `visible prompt anchor ${prompt.id}`).toMatch(
        new RegExp(`\\bid=["']${escapeRegExp(prompt.id)}["']`, 'i'),
      );
    }

    for (const resourcePath of GOOGLE_PREVIEW_RESOURCES) {
      expectCleanRawLink(html, resourcePath, GOOGLE_PREVIEW_PATH);
    }
    expectCleanRawLink(
      html,
      'https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5',
      GOOGLE_PREVIEW_PATH,
    );
    expectCleanRawLink(
      html,
      'https://www.google.com/about/careers/applications/interview-tips/',
      GOOGLE_PREVIEW_PATH,
    );

    ['Organization', 'WebSite', 'CollectionPage', 'BreadcrumbList', 'ItemList'].forEach((type) => {
      expect(schemaTypes, `JSON-LD includes ${type}`).toContain(type);
    });

    const collectionPage = schemaNodes.find((node) => node['@type'] === 'CollectionPage');
    expect(collectionPage).toMatchObject({
      '@id': `${expectedCanonical(GOOGLE_PREVIEW_PATH)}#collection`,
      url: expectedCanonical(GOOGLE_PREVIEW_PATH),
      name: GOOGLE_PREVIEW_TITLE,
      headline: GOOGLE_PREVIEW_H1,
      description: GOOGLE_PREVIEW_DESCRIPTION,
      inLanguage: 'en',
      dateModified: '2026-07-13T00:00:00.000Z',
      isAccessibleForFree: true,
      mainEntity: { '@id': `${expectedCanonical(GOOGLE_PREVIEW_PATH)}#practice-prompts` },
    });

    const breadcrumb = schemaNodes.find((node) => node['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeTruthy();
    expect((breadcrumb?.['itemListElement'] || []).map((item: any) => item.name)).toEqual([
      'FrontendAtlas',
      'Company Frontend Interview Questions',
      GOOGLE_PREVIEW_H1,
    ]);

    const itemList = schemaNodes.find((node) => node['@type'] === 'ItemList');
    expect(itemList?.['@id']).toBe(`${expectedCanonical(GOOGLE_PREVIEW_PATH)}#practice-prompts`);
    const itemListElements = itemList?.['itemListElement'];
    expect(Array.isArray(itemListElements)).toBe(true);
    expect(itemListElements).toHaveLength(7);

    itemListElements.forEach((entry: any, index: number) => {
      const expectedPrompt = GOOGLE_PREVIEW_PROMPTS[index];
      const itemName = entry?.name ?? entry?.item?.name;
      const itemUrl = entry?.url ?? entry?.item?.url;
      expect(entry?.position).toBe(index + 1);
      expect(itemName).toBe(expectedPrompt.title);
      expect(itemUrl).toBe(`${expectedCanonical(GOOGLE_PREVIEW_PATH)}#${expectedPrompt.id}`);

      const fragment = new URL(String(itemUrl)).hash.slice(1);
      expect(fragment).toBe(expectedPrompt.id);
      expect(html, `ItemList fragment #${fragment} maps to visible markup`).toMatch(
        new RegExp(`\\bid=["']${escapeRegExp(fragment)}["']`, 'i'),
      );
    });

    for (const resourcePath of GOOGLE_PREVIEW_RESOURCES) {
      const resourceHtml = await readRawHtml(request, resourcePath);
      const resourceRobots = normalizeText(extractRawMeta(resourceHtml, 'robots')).replace(/\s+/g, '');
      expect(extractRawCanonical(resourceHtml), `self-canonical for ${resourcePath}`).toBe(
        expectedCanonical(resourcePath),
      );
      expect(resourceRobots, `indexable robots for ${resourcePath}`).not.toContain('noindex');
      expect(hasLockedShellMarkup(resourceHtml), `unlocked raw page for ${resourcePath}`).toBe(false);
    }

    for (const inbound of GOOGLE_PREVIEW_INBOUND_PAGES) {
      const sourceHtml = await readRawHtml(request, inbound.path);
      expectCleanRawLink(sourceHtml, GOOGLE_PREVIEW_PATH, inbound.path);
      expect(extractRawLinkText(sourceHtml, GOOGLE_PREVIEW_PATH), `anchor text on ${inbound.path}`).toContain(
        normalizeText(inbound.anchor),
      );
    }
  });

  test('raw Netflix company preview exposes the complete public guide, schema, and crawlable links', async ({ request }) => {
    test.setTimeout(120_000);

    const html = await readRawHtml(request, NETFLIX_PREVIEW_PATH);
    const text = rawVisibleText(html);
    const caseText = rawVisibleTextPreserveCase(html);
    const robots = normalizeText(extractRawMeta(html, 'robots')).replace(/\s+/g, '');
    const schemaNodes = extractRawJsonLdNodes(html);
    const schemaTypes = extractRawJsonLdTypes(html);

    expect(extractRawTitle(html)).toBe(NETFLIX_PREVIEW_TITLE);
    expect(extractRawMeta(html, 'description')).toBe(NETFLIX_PREVIEW_DESCRIPTION);
    expect(extractRawPropertyMeta(html, 'og:title')).toBe(NETFLIX_PREVIEW_TITLE);
    expect(extractRawPropertyMeta(html, 'og:description')).toBe(NETFLIX_PREVIEW_DESCRIPTION);
    expect(extractRawMeta(html, 'twitter:title')).toBe(NETFLIX_PREVIEW_TITLE);
    expect(extractRawMeta(html, 'twitter:description')).toBe(NETFLIX_PREVIEW_DESCRIPTION);
    expect(extractRawH1(html)).toBe(NETFLIX_PREVIEW_H1);
    expect(extractRawCanonical(html)).toBe(expectedCanonical(NETFLIX_PREVIEW_PATH));
    expect(robots).toBe('index,follow');

    [
      'Public Netflix prep guide',
      'Prepare for product judgment, not Netflix trivia',
      'What Netflix publishes—and what you still need to confirm',
      'Three product contexts for practicing transferable frontend judgment',
      'Six Netflix frontend interview practice questions',
      'Scope Continue Watching before drawing architecture boxes',
      'A 7-day Netflix frontend interview preparation plan',
      'Common Netflix frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ].forEach((expectedText) => {
      expect(text, `Netflix preview includes ${expectedText}`).toContain(normalizeText(expectedText));
    });

    expect(caseText).toContain(
      'These are representative FrontendAtlas practice prompts, not leaked or confirmed Netflix interview questions. Interview formats vary by role and team, so use recruiter-provided material as the source of truth.',
    );
    expect(caseText).toContain('An older engineering case study');
    expect(caseText).not.toContain('47 known questions');
    expect(caseText).not.toContain('Curry Function');
    expect(caseText).not.toContain('Toast Notification System');
    expect(caseText).not.toContain('Try free challenge');

    for (const prompt of NETFLIX_PREVIEW_PROMPTS) {
      expect(text, `visible prompt ${prompt.title}`).toContain(normalizeText(prompt.title));
      expect(html, `visible prompt anchor ${prompt.id}`).toMatch(
        new RegExp(`\\bid=["']${escapeRegExp(prompt.id)}["']`, 'i'),
      );
    }

    for (const resourcePath of NETFLIX_PREVIEW_RESOURCES) {
      expectCleanRawLink(html, resourcePath, NETFLIX_PREVIEW_PATH);
    }
    for (const sourceUrl of NETFLIX_OFFICIAL_SOURCES) {
      expectCleanRawLink(html, sourceUrl, NETFLIX_PREVIEW_PATH);
    }

    ['Organization', 'WebSite', 'CollectionPage', 'BreadcrumbList', 'ItemList'].forEach((type) => {
      expect(schemaTypes, `JSON-LD includes ${type}`).toContain(type);
    });
    ['FAQPage', 'QAPage', 'JobPosting', 'PracticeProblem'].forEach((type) => {
      expect(schemaTypes, `JSON-LD excludes unsupported ${type}`).not.toContain(type);
    });

    const collectionPage = schemaNodes.find((node) => node['@type'] === 'CollectionPage');
    expect(collectionPage).toMatchObject({
      '@id': `${expectedCanonical(NETFLIX_PREVIEW_PATH)}#collection`,
      url: expectedCanonical(NETFLIX_PREVIEW_PATH),
      name: NETFLIX_PREVIEW_TITLE,
      headline: NETFLIX_PREVIEW_H1,
      description: NETFLIX_PREVIEW_DESCRIPTION,
      inLanguage: 'en',
      dateModified: '2026-07-27T00:00:00.000Z',
      isAccessibleForFree: true,
      mainEntity: { '@id': `${expectedCanonical(NETFLIX_PREVIEW_PATH)}#practice-prompts` },
    });
    expect(collectionPage?.mentions).toHaveLength(8);

    const breadcrumb = schemaNodes.find((node) => node['@type'] === 'BreadcrumbList');
    expect((breadcrumb?.['itemListElement'] || []).map((item: any) => item.name)).toEqual([
      'FrontendAtlas',
      'Company Frontend Interview Questions',
      NETFLIX_PREVIEW_H1,
    ]);

    const itemList = schemaNodes.find((node) => node['@type'] === 'ItemList');
    expect(itemList?.['@id']).toBe(`${expectedCanonical(NETFLIX_PREVIEW_PATH)}#practice-prompts`);
    const itemListElements = itemList?.['itemListElement'];
    expect(Array.isArray(itemListElements)).toBe(true);
    expect(itemListElements).toHaveLength(6);

    itemListElements.forEach((entry: any, index: number) => {
      const expectedPrompt = NETFLIX_PREVIEW_PROMPTS[index];
      const itemName = entry?.name ?? entry?.item?.name;
      const itemUrl = entry?.url ?? entry?.item?.url;
      expect(entry?.position).toBe(index + 1);
      expect(itemName).toBe(expectedPrompt.title);
      expect(itemUrl).toBe(`${expectedCanonical(NETFLIX_PREVIEW_PATH)}#${expectedPrompt.id}`);

      const fragment = new URL(String(itemUrl)).hash.slice(1);
      expect(fragment).toBe(expectedPrompt.id);
      expect(html, `ItemList fragment #${fragment} maps to visible markup`).toMatch(
        new RegExp(`\\bid=["']${escapeRegExp(fragment)}["']`, 'i'),
      );
    });

    for (const resourcePath of NETFLIX_PREVIEW_RESOURCES) {
      const resourceHtml = await readRawHtml(request, resourcePath);
      const resourceRobots = normalizeText(extractRawMeta(resourceHtml, 'robots')).replace(/\s+/g, '');
      expect(extractRawCanonical(resourceHtml), `self-canonical for ${resourcePath}`).toBe(
        expectedCanonical(resourcePath),
      );
      expect(resourceRobots, `indexable robots for ${resourcePath}`).not.toContain('noindex');
      expect(hasLockedShellMarkup(resourceHtml), `unlocked raw page for ${resourcePath}`).toBe(false);
    }

    for (const inbound of NETFLIX_PREVIEW_INBOUND_PAGES) {
      const sourceHtml = await readRawHtml(request, inbound.path);
      expectCleanRawLink(sourceHtml, NETFLIX_PREVIEW_PATH, inbound.path);
      expect(
        extractRawLinkText(sourceHtml, NETFLIX_PREVIEW_PATH),
        `anchor text on ${inbound.path}`,
      ).toContain(normalizeText(inbound.anchor));
    }
  });

  test('Netflix company preview reflows without horizontal overflow at target widths', async ({ page }) => {
    const runtimeIssues = collectClientRuntimeIssues(page);
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 834, height: 1112 },
      { width: 1366, height: 900 },
      { width: 1440, height: 900 },
    ];

    await page.setViewportSize(viewports[0]);
    await page.goto(NETFLIX_PREVIEW_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText(NETFLIX_PREVIEW_H1);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const layout = await page.evaluate(() => {
        const preview = document.querySelector<HTMLElement>('[data-testid="company-preview-page"]');
        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          previewOverflow: preview ? preview.scrollWidth - preview.clientWidth : Number.POSITIVE_INFINITY,
          h1Count: document.querySelectorAll('h1').length,
        };
      });

      expect(layout.documentOverflow, `document overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(layout.previewOverflow, `Netflix preview overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(layout.h1Count, `single H1 at ${viewport.width}px`).toBe(1);
    }

    await page.waitForTimeout(300);
    expectNoHydrationOrChunkIssues(runtimeIssues, NETFLIX_PREVIEW_PATH);
  });

  test('Hydrated HTML renders correct shell + meta (JS enabled)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __FA_SEO_HOST__?: string }).__FA_SEO_HOST__ = 'frontendatlas.com';
    });

    for (const entry of CASES) {
      await page.goto(entry.path, { waitUntil: 'domcontentloaded' });
      await expect
        .poll(async () => (await page.locator('h1').first().textContent())?.trim() || '', {
          timeout: 15000,
        })
        .toContain(entry.h1);
      await assertHydratedBasics(page, entry);
    }
  });

  test('dashboard shell does not prerender the prep switcher and hydration is clean', async ({ browser, page }) => {
    const ssrContext = await browser.newContext({ javaScriptEnabled: false });
    const ssrPage = await ssrContext.newPage();

    await ssrPage.goto(fullUrl('/dashboard'), { waitUntil: 'domcontentloaded' });
    await expect(ssrPage.getByTestId('prep-roadmap-switcher')).toHaveCount(0);
    await ssrContext.close();

    const runtimeIssues = collectClientRuntimeIssues(page);
    for (const path of ['/dashboard', '/coding']) {
      runtimeIssues.length = 0;
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('app-root')).toBeVisible();
      await page.waitForTimeout(300);
      expectNoHydrationOrChunkIssues(runtimeIssues, path);
    }
  });

  test('home intent stays stable between SSR and hydration, and differs from blueprint index intent', async ({ browser, page }) => {
    const ssrContext = await browser.newContext({ javaScriptEnabled: false });
    const ssrPage = await ssrContext.newPage();

    await ssrPage.goto(fullUrl('/'), { waitUntil: 'domcontentloaded' });
    const ssrHomeTitle = await ssrPage.title();
    const ssrHomeH1 = (await ssrPage.locator('h1').first().textContent())?.trim() || '';

    expect(normalizeText(ssrHomeTitle)).toContain('frontend interview prep platform');
    expect(normalizeText(ssrHomeH1)).toContain('practice frontend interviews');

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hydratedHomeTitle = await page.title();
    const hydratedHomeH1 = (await page.locator('h1').first().textContent())?.trim() || '';

    expect(normalizeText(hydratedHomeTitle)).toContain('frontend interview prep platform');
    expect(normalizeText(hydratedHomeH1)).toContain('practice frontend interviews');
    expect(normalizeText(hydratedHomeH1)).toBe(normalizeText(ssrHomeH1));

    await page.goto('/guides/interview-blueprint', { waitUntil: 'domcontentloaded' });
    const guidesTitle = await page.title();
    const guidesH1 = (await page.locator('h1').first().textContent())?.trim() || '';

    expect(normalizeText(guidesTitle)).not.toContain('frontend interview prep platform');
    expect(normalizeText(guidesTitle)).not.toBe(normalizeText(hydratedHomeTitle));
    expect(normalizeText(guidesH1)).not.toBe(normalizeText(hydratedHomeH1));

    await ssrContext.close();
  });

  test('SSR sitemap sampling does not collapse to home meta', async ({ browser, request }) => {
    let response = await request.get(`${BASE_URL}/sitemap-1.xml`);
    if (!response.ok()) {
      response = await request.get(`${BASE_URL}/sitemap.xml`);
    }
    expect(response.ok()).toBeTruthy();

    const xml = await response.text();
    const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((m) => m[1])
      .filter((url) => {
        if (!url) return false;
        try {
          const parsed = new URL(url);
          return parsed.pathname !== '/';
        } catch {
          return url !== '/' && url !== `${BASE_URL}/` && url !== BASE_URL;
        }
      })
      .slice(0, 5);

    expect(urls.length).toBeGreaterThan(0);

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    for (const url of urls) {
      let path = url;
      try {
        const parsed = new URL(url);
        path = `${parsed.pathname}${parsed.search}`;
      } catch {
        path = url;
      }
      await page.goto(fullUrl(path), { waitUntil: 'domcontentloaded' });
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).not.toBe(`${BASE_URL}/`);
      const title = await page.title();
      expect(title).not.toBe(HOME_TITLE);
    }

    await context.close();
  });
});
