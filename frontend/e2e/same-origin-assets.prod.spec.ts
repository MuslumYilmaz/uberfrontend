import { test, expect } from '@playwright/test';

// Deliberately not `./fixtures`: that fixture forces `fa:cdn:enabled=0` on
// every page, which would hide a misconfigured CDN base. This spec runs against
// the production build (PLAYWRIGHT_SSR=1) and proves that content assets are
// requested from the page origin only.

const ROUTES: Array<{ path: string; marker: RegExp }> = [
  { path: '/coding', marker: /\/assets\/practice\/registry\.json/ },
  { path: '/incidents', marker: /\/assets\/incidents\/index\.json/ },
];

for (const route of ROUTES) {
  test(`${route.path} loads every /assets/ resource from the page origin`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL || page.url()).origin;
    const seen: string[] = [];
    const crossOrigin: string[] = [];

    await page.route('**/*', (handler) => {
      const url = new URL(handler.request().url());
      if (url.pathname.startsWith('/assets/')) {
        seen.push(url.href);
        if (url.origin !== origin) {
          crossOrigin.push(url.href);
          // Never let a stray CDN request leave the machine.
          return handler.abort();
        }
      }
      return handler.continue();
    });

    await page.goto(route.path, { waitUntil: 'load' });
    // Wait for the content request this route depends on, from any origin, so
    // the assertion runs after the client decided where to load content from.
    await expect.poll(() => seen.some((href) => route.marker.test(href)), {
      message: `the client requests ${route.marker} after hydration`,
      timeout: 15_000,
    }).toBe(true);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    expect(crossOrigin, 'every /assets/ request must use the page origin').toEqual([]);
  });
}
