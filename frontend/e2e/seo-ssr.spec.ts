import { test, expect, Page } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');
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
    titleIncludes: 'frontend interview questions bank',
    h1: 'Frontend Interview Questions Bank',
    detail: false,
    listTestIdPrefix: 'question-card-',
  },
  {
    path: '/angular/coding/angular-autocomplete-search-starter',
    titleIncludes: 'Angular Autocomplete Search',
    h1: 'Autocomplete Search Bar (Standalone Component)',
    detail: true,
    premiumPreviewText: 'autocomplete search bar',
  },
  {
    path: '/react/coding/react-counter',
    titleIncludes: 'Counter',
    h1: 'React Counter (Guarded Decrement)',
    detail: true,
  },
  {
    path: '/javascript/trivia/js-event-loop',
    titleIncludes: 'Explain the JavaScript Event Loop',
    h1: 'Explain the JavaScript Event Loop',
    detail: true,
    expectNoMonaco: true,
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

const HOME_TITLE = 'Frontend Interview Prep Platform | FrontendAtlas';

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
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
