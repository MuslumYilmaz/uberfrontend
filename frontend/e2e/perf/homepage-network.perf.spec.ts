import { test, expect } from '../fixtures';

function matchesAny(url: string, needles: string[]): boolean {
  return needles.some((needle) => url.includes(needle));
}

test.describe('homepage network guardrails', () => {
  test('marketing route avoids app-ui CSS, eager telemetry, and inactive framework assets before interaction', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only network smoke');

    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await page.waitForTimeout(1500);

    const blockedOnLanding = [
      'googletagmanager.com/gtag/js',
      '@sentry/browser',
      '/api/billing/checkout/config',
      '/assets/monaco/min/vs/loader.js',
      '/assets/vendor/primeng/resources/themes/lara-dark-amber/theme.css',
      '/assets/vendor/primeng/resources/primeng.min.css',
      '/assets/vendor/primeicons/primeicons.css',
      '/assets/vendor/fontawesome/css/all.min.css',
      '/assets/questions/react/coding.json',
      '/assets/questions/angular/coding.json',
      '/assets/questions/vue/coding.json',
    ];

    expect(requests.some((url) => matchesAny(url, blockedOnLanding))).toBeFalsy();

    await page.getByTestId('showcase-demo-open-live').scrollIntoViewIfNeeded();
    await expect
      .poll(() => requests.some((url) => url.includes('/assets/questions/react/coding.json')))
      .toBeTruthy();
    expect(requests.some((url) => url.includes('/assets/questions/angular/coding.json'))).toBeFalsy();
    expect(requests.some((url) => url.includes('/assets/questions/vue/coding.json'))).toBeFalsy();
    expect(requests.some((url) => url.includes('/assets/monaco/min/vs/loader.js'))).toBeFalsy();

    await page.getByTestId('showcase-demo-tab-angular').click();
    await expect
      .poll(() => requests.some((url) => url.includes('/assets/questions/angular/coding.json')))
      .toBeTruthy();

    await page.getByTestId('showcase-landmark-pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(requests.some((url) => url.includes('/api/billing/checkout/config'))).toBeFalsy();
  });

  test('mobile defers the coding demo payload until the revealed section grows past 767px', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only network smoke');

    await page.setViewportSize({ width: 390, height: 844 });
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('showcase-demo-mobile-guard').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toBeVisible();
    await expect(page.locator('.demo-picker, .demo-meta, #demo-pane')).toHaveCount(0);

    await page.waitForTimeout(500);
    const reactCodingRequests = () => requests.filter((url) =>
      url.includes('/assets/questions/react/coding.json'),
    );
    expect(reactCodingRequests()).toEqual([]);

    await page.setViewportSize({ width: 834, height: 1112 });
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect.poll(() => reactCodingRequests().length).toBe(1);

    // Later supported-width resizes must reuse the one activated demo instance.
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.setViewportSize({ width: 834, height: 1112 });
    await page.waitForTimeout(300);
    expect(reactCodingRequests()).toHaveLength(1);
  });

  test('app routes still load deferred vendor UI styles', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only network smoke');

    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    expect(requests.some((url) => url.includes('/assets/vendor/primeng/resources/themes/lara-dark-amber/theme.css'))).toBeTruthy();
    expect(requests.some((url) => url.includes('/assets/vendor/primeicons/primeicons.css'))).toBeTruthy();
  });

  test('trivia detail initial hydration avoids eager FontAwesome and prerendered full-bank fetches', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only network smoke');

    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/javascript/trivia/js-escape-vs-sanitize', { waitUntil: 'domcontentloaded' });
    const initialRequests = [...requests];

    await expect(page.locator('h1.title')).toContainText(/Escaping vs Sanitizing/i);

    expect(initialRequests.some((url) => url.includes('/assets/vendor/fontawesome/css/all.min.css'))).toBeFalsy();
    expect(initialRequests.some((url) => url.includes('/assets/vendor/fontawesome/webfonts/fa-solid-900.woff2'))).toBeFalsy();

    const hasPrerenderState = await page.locator('script#ng-state').count();
    if (hasPrerenderState) {
      expect(initialRequests.some((url) => url.includes('/assets/questions/javascript/trivia.json'))).toBeFalsy();
    }
  });
});
