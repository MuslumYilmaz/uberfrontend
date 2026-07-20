import { test, expect } from './fixtures';
import { getMonacoModelValue } from './helpers';

async function setSeoHost(page: any, host: string): Promise<void> {
  await page.addInitScript((value: string) => {
    // @ts-expect-error - test-only override
    window.__FA_SEO_HOST__ = value;
  }, host);
}

async function getMeta(page: any, name: string): Promise<string | null> {
  const el = page.locator(`meta[name="${name}"]`);
  return el.getAttribute('content');
}

async function getCanonical(page: any): Promise<string | null> {
  return page.locator('link[rel="canonical"]').getAttribute('href');
}

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1]);
}

test('seo: home has title/description/canonical and is indexable', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/Frontend Interview Prep Platform/i);
  await expect.poll(() => getMeta(page, 'description')).not.toBeNull();
  await expect.poll(() => getCanonical(page)).toBe(`${base}/`);
  await expect.poll(async () => (await getMeta(page, 'robots')) || '').not.toContain('noindex');
  await expect(page.locator('h1').first()).toContainText(/frontend interview/i);
});

test('seo: question detail has canonical + json-ld', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/javascript/coding/js-number-clamp');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/clamp/i);
  await expect.poll(() => getMeta(page, 'description')).not.toBeNull();
  await expect.poll(() => getCanonical(page)).toBe(`${base}/javascript/coding/js-number-clamp`);

  await expect.poll(async () => (await page.locator('script#seo-jsonld').textContent()) || '')
    .toContain('BreadcrumbList');
  await expect.poll(async () => (await page.locator('script#seo-jsonld').textContent()) || '')
    .toContain('TechArticle');
});

test('seo: HTML form default method page preserves intent-specific metadata and answer', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/html/trivia/html-form-default-method');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle('HTML Form Default Method: GET or POST? (With Example)');
  expect(await page.title()).not.toMatch(/\band\s*$/i);
  await expect.poll(() => getMeta(page, 'description')).toBe(
    'An HTML form defaults to GET. If action is omitted, it submits to the current page URL. See an example, GET vs POST, and common HTML interview mistakes.'
  );
  await expect.poll(() => getCanonical(page)).toBe(`${base}/html/trivia/html-form-default-method`);
  await expect.poll(async () => ((await getMeta(page, 'robots')) || '').toLowerCase()).toBe('index,follow');
  await expect(page.locator('h1').first()).toHaveText('What is the default method for form submission in HTML?');

  const triviaMain = page.getByTestId('trivia-detail-main');
  await expect(triviaMain).toContainText(/defaults? to GET/i);
  await expect(triviaMain).toContainText(/current (?:document|page) URL/i);

  const jsonLd = page.locator('script#seo-jsonld');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('BreadcrumbList');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('TechArticle');
});

test('seo: coding query variants keep clean canonical, noindex, and filter state', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/coding?q=debounce');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/Frontend Coding Challenges/i);
  await expect(page.locator('h1').first()).toContainText('Frontend Coding Challenges');
  await expect.poll(() => getCanonical(page)).toBe(`${base}/coding`);
  await expect.poll(async () => ((await getMeta(page, 'robots')) || '').toLowerCase()).toContain('noindex,follow');
  await expect(page.getByTestId('coding-list-search')).toHaveValue('debounce');
  await expect(page.getByTestId('coding-discovery-sections')).toContainText('JavaScript coding challenges');

  const jsonLd = page.locator('script#seo-jsonld');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('CollectionPage');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('BreadcrumbList');

  await page.goto('/coding?tech=javascript');
  await expect(page).toHaveTitle(/Frontend Coding Challenges/i);
  await expect(page.locator('h1').first()).toContainText('Frontend Coding Challenges');
  await expect.poll(() => getCanonical(page)).toBe(`${base}/coding`);
  await expect.poll(async () => ((await getMeta(page, 'robots')) || '').toLowerCase()).toContain('noindex,follow');
  await expect(page.getByTestId('coding-list-results')).toContainText('JavaScript');
  await expect(page.getByTestId('coding-discovery-sections')).toContainText('Debugging challenges');
});

test('seo: css theme variables challenge is indexable with self canonical and crawlable content', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/css/coding/css-theme-variables-dark-mode');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle('CSS Variables Dark Mode Challenge | FrontendAtlas');
  await expect(page.locator('h1').first()).toContainText(/Theming with CSS Variables/i);
  await expect.poll(() => getMeta(page, 'description')).toBe(
    'Practice CSS custom properties with prefers-color-scheme and an equal-specificity :root:where(.theme-dark) override whose later source order wins.'
  );
  await expect.poll(() => getCanonical(page)).toBe(`${base}/css/coding/css-theme-variables-dark-mode`);
  await expect.poll(async () => ((await getMeta(page, 'robots')) || '').toLowerCase()).not.toContain('noindex');

  await expect(page.locator('[data-testid="coding-description-panel"]')).toContainText(/CSS custom properties/i);
  await expect(page.locator('[data-testid="coding-description-panel"]')).toContainText(/prefers-color-scheme/i);
  await expect(page.locator('[data-testid="coding-description-panel"]')).toContainText(/:root:where\(\.theme-dark\)/i);
  await expect(page.locator('[data-testid="coding-description-panel"]')).toContainText(/equal specificity/i);
  await expect(page.locator('[data-testid="coding-breadcrumb"] a[href="/css/interview-questions"]')).toHaveCount(1);
  const starterCss = await getMonacoModelValue(page, 'q-css-theme-variables-dark-mode-css');
  expect(starterCss).toMatch(/box-shadow:\s*var\(--panel-shadow\)/i);
  await page.getByRole('button', { name: 'Show preview' }).click();
  await expect(page.getByText('Showing solution preview')).toBeVisible();

  const jsonLd = page.locator('script#seo-jsonld');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('BreadcrumbList');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('TechArticle');
});

test('seo: css grid card gallery challenge is indexable with route-specific content', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  const response = await page.goto('/css/coding/css-grid-card-gallery');
  const base = new URL(page.url()).origin;

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('CSS Grid Card Gallery Challenge | Responsive minmax() Layout');
  await expect(page.locator('h1').first()).toContainText('Build a Responsive CSS Grid Card Gallery');
  await expect.poll(() => getMeta(page, 'description')).toBe(
    'Practice a responsive CSS Grid card gallery: use repeat(), minmax(), gap, breakpoints, and overflow checks to build a 2-to-4 column interview layout.'
  );
  await expect.poll(() => getCanonical(page)).toBe(`${base}/css/coding/css-grid-card-gallery`);
  await expect.poll(async () => ((await getMeta(page, 'robots')) || '').toLowerCase()).not.toContain('noindex');

  const descriptionPanel = page.locator('[data-testid="coding-description-panel"]');
  await expect(descriptionPanel).toContainText(/repeat\(\)/i);
  await expect(descriptionPanel).toContainText(/minmax\(\)/i);
  await expect(descriptionPanel).toContainText(/\bgap\b/i);
  await expect(descriptionPanel).toContainText(/Acceptance criteria/i);
  await expect(descriptionPanel).toContainText(/Common mistakes/i);
  await expect(descriptionPanel).toContainText(/auto-fit/i);
  await expect(descriptionPanel).toContainText(/Solution explains why Grid is better than Flexbox/i);

  const jsonLd = page.locator('script#seo-jsonld');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('BreadcrumbList');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('TechArticle');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('HowTo');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('FAQPage');
});

test('seo: css display flex page keeps route identity + structured data', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/css/trivia/css-display-flex');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/display:\s*flex/i);
  await expect(page.locator('h1').first()).toContainText(/what does display:\s*flex do\?/i);
  await expect.poll(() => getMeta(page, 'description')).not.toBeNull();
  await expect.poll(() => getCanonical(page)).toBe(`${base}/css/trivia/css-display-flex`);

  const jsonLd = page.locator('script#seo-jsonld');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('BreadcrumbList');
  await expect.poll(async () => (await jsonLd.textContent()) || '').toContain('TechArticle');
  await expect.poll(async () => (await jsonLd.textContent()) || '').not.toContain('FAQPage');

  const triviaMain = page.getByTestId('trivia-detail-main');
  await expect(triviaMain).toContainText(/inline-flex/i);
  await expect(triviaMain).toContainText(/flex:\s*auto/i);
});

test('seo: login page is noindex', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/auth/login');
  await expect.poll(async () => (await getMeta(page, 'robots')) || '').toContain('noindex');
});

test('seo: preview host forces noindex', async ({ page }) => {
  await setSeoHost(page, 'preview.frontendatlas.vercel.app');
  await page.goto('/');
  await expect.poll(async () => (await getMeta(page, 'robots')) || '').toContain('noindex');
});

test('seo: robots.txt and sitemaps are served', async ({ page }) => {
  const robotsRes = await page.request.get('/robots.txt');
  expect(robotsRes.status()).toBe(200);
  const robotsText = await robotsRes.text();
  expect(robotsText).toContain('Sitemap: https://frontendatlas.com/sitemap.xml');
  expect(robotsText).toContain('Sitemap: https://frontendatlas.com/sitemap-index.xml');
  expect(robotsText).not.toContain('Disallow: /coding?');
  expect(robotsText).not.toContain('Disallow: /css/coding');

  const indexRes = await page.request.get('/sitemap-index.xml');
  expect(indexRes.status()).toBe(200);
  const indexText = await indexRes.text();
  const match = indexText.match(/<loc>([^<]+)<\/loc>/);
  expect(match).not.toBeNull();

  const sitemapRes = await page.request.get('/sitemap.xml');
  expect(sitemapRes.status()).toBe(200);

  const firstLoc = match ? match[1] : '';
  const sitemapPath = firstLoc ? new URL(firstLoc).pathname : '/sitemap.xml';
  const chunkRes = await page.request.get(sitemapPath);
  expect(chunkRes.status()).toBe(200);
  const sitemap = await chunkRes.text();
  expect(sitemap).toContain('https://frontendatlas.com/');
  expect(sitemap).toContain('https://frontendatlas.com/javascript/coding/js-number-clamp');
  expect(sitemap).toContain('https://frontendatlas.com/css/coding/css-grid-card-gallery');
  const locs = extractLocs(sitemap);
  const disallowedPrefixes = ['/auth/', '/dashboard', '/profile', '/admin'];
  const disallowedExact = ['/auth/login', '/auth/register', '/dashboard', '/profile', '/admin'];

  locs.forEach((loc) => {
    const path = (() => {
      try {
        return new URL(loc).pathname;
      } catch {
        return loc;
      }
    })();

    disallowedExact.forEach((exact) => expect(path).not.toBe(exact));
    disallowedPrefixes.forEach((prefix) => {
      if (prefix.endsWith('/')) {
        expect(path.startsWith(prefix)).toBe(false);
      } else {
        expect(path === prefix || path.startsWith(`${prefix}/`)).toBe(false);
      }
    });
  });
});

test('seo: llms.txt is served with public discovery links only', async ({ page }) => {
  const res = await page.request.get('/llms.txt');
  expect(res.status()).toBe(200);

  const text = await res.text();
  expect(text).toContain('# FrontendAtlas');
  expect(text).toContain('https://frontendatlas.com/sitemap-index.xml');

  ['/dashboard', '/profile', '/admin', '/auth/', '/billing'].forEach((path) => {
    expect(text).not.toContain(path);
  });
});
