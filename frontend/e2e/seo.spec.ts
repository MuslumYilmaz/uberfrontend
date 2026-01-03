import { test, expect } from './fixtures';

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

  await expect(page).toHaveTitle(/FrontendAtlas/i);
  await expect.poll(() => getMeta(page, 'description')).not.toBeNull();
  await expect.poll(() => getCanonical(page)).toBe(`${base}/`);
  await expect.poll(async () => (await getMeta(page, 'robots')) || '').not.toContain('noindex');
});

test('seo: question detail has canonical + json-ld', async ({ page }) => {
  await setSeoHost(page, 'frontendatlas.com');
  await page.goto('/javascript/coding/js-number-clamp');
  const base = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/Clamp \| FrontendAtlas/);
  await expect.poll(() => getMeta(page, 'description')).not.toBeNull();
  await expect.poll(() => getCanonical(page)).toBe(`${base}/javascript/coding/js-number-clamp`);

  await expect.poll(async () => (await page.locator('script#seo-jsonld').textContent()) || '')
    .toContain('BreadcrumbList');
  await expect.poll(async () => (await page.locator('script#seo-jsonld').textContent()) || '')
    .toContain('TechArticle');
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
  expect(robotsText).toContain('Sitemap: https://frontendatlas.com/sitemap-index.xml');

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
