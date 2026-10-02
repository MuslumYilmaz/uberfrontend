import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';

const widths = [360, 390, 768, 834, 1366, 1440];
const routes = ['/', '/auth/login', '/auth/signup', '/pricing', '/coding',
  '/javascript/coding/js-number-clamp', '/javascript/trivia/js-event-loop',
  '/system-design', '/guides/interview-blueprint/intro'];

test.beforeEach(({}, info) => {
  test.skip(info.config.metadata.primeSsrComparison !== true, 'Requires paired SSR build servers');
});

test.describe('PrimeNG prerender CSS before JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce', colorScheme: 'light' });
  for (const width of widths) {
    for (const route of routes) {
      test(`${route} at ${width}px matches untouched inline SSR`, async ({ page, context }, info) => {
        await context.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
        await page.setViewportSize({ width, height: 900 });
        const reference = await context.newPage();
        await reference.setViewportSize({ width, height: 900 });
        await reference.goto(`http://127.0.0.1:4257${route}`);
        await page.goto(route);
        const links = page.locator('link[data-fa-prime-ssr]');
        expect(await links.count()).toBeGreaterThan(0);
        const rules = (page: Page) => page.evaluate(() => Array.from(document.styleSheets)
          .flatMap(sheet => Array.from(sheet.cssRules).map(rule => rule.cssText)));
        // Proves exact cascade ordering as well as successful CSS loading, before
        // PrimeNG can refill the retained markers. No app DOM/transfer state edit.
        expect(await rules(page)).toEqual(await rules(reference));
        expect(await page.locator('app-root').evaluate(el => el.outerHTML))
          .toEqual(await reference.locator('app-root').evaluate(el => el.outerHTML));
        const before = await reference.screenshot({ animations: 'disabled' });
        const after = await page.screenshot({ animations: 'disabled' });
        await info.attach('inline-SSR', { body: before, contentType: 'image/png' });
        await info.attach('external-SSR', { body: after, contentType: 'image/png' });
        expect(after.equals(before), 'Cold SSR screenshot must be pixel-identical to untouched build').toBe(true);
        if (process.env.UPGRADE_SSR_GALLERY_DIR && info.project.name === 'chromium') {
          const name = `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${width}.png`;
          for (const [side, image] of [['before', before], ['after', after]] as const) {
            const directory = path.join(process.env.UPGRADE_SSR_GALLERY_DIR, side);
            await mkdir(directory, { recursive: true });
            await writeFile(path.join(directory, name), image);
          }
        }
        await reference.close();
      });
    }
  }
});

test('slow CSS remains render blocking under the deployment style CSP', async ({ page, browserName }) => {
  // Paint Timing is exposed in Chromium. Other engines verify the cold cascade
  // above and run the hydrated interaction suite with the same production build.
  test.skip(browserName !== 'chromium', 'Paint Timing assertion uses Chromium');
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  const csp = config.headers.flatMap((rule: { headers: { key: string; value: string }[] }) => rule.headers)
    .find((h: { key: string }) => h.key === 'Content-Security-Policy').value;
  const stylePolicy = csp.split(';').find((part: string) => part.trim().startsWith('style-src '));
  await page.route('**/system-design', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'Content-Security-Policy': stylePolicy } });
  });
  await page.route('**/*.js', route => route.abort());
  let release!: () => void;
  let cssRequested!: () => void;
  const requested = new Promise<void>(resolve => { cssRequested = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/prime-ssr/*.css', async route => {
    cssRequested();
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/system-design', { waitUntil: 'commit' });
    await requested;
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 250)));
    expect(await page.evaluate(() => performance.getEntriesByType('paint'))).toHaveLength(0);
  } finally {
    release();
  }
  await page.waitForLoadState('load');
  await expect.poll(() => page.evaluate(() => performance.getEntriesByName('first-contentful-paint').length)).toBe(1);
  const loadStatus = await page.locator('link[data-fa-prime-ssr]').evaluateAll(links => links.every(link =>
    (link as HTMLLinkElement).sheet?.cssRules.length));
  expect(loadStatus).toBe(true);
});
