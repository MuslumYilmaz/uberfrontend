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
    path: '/guides/system-design-blueprint/radio-framework',
    titleIncludes: 'radio framework: frontend system design interview template',
    h1: 'RADIO Framework: Frontend System Design Interview Template',
    detail: true,
    indexable: true,
    singleHydratedH1: true,
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
    includeText: ['paginated loading', 'virtualization'],
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

function normalizeText(value: string): string {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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

function extractRawMeta(html: string, name: string): string {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i'))?.[0] || '';
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
