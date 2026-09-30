import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const DASHBOARD = '/system-design/dashboard-widgets-draggable-resizable';
const DASHBOARD_TITLE = 'Drag-and-Drop Dashboard Frontend System Design';
const CANONICAL = 'https://frontendatlas.com';

test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __FA_SEO_HOST__?: string }).__FA_SEO_HOST__ = 'frontendatlas.com';
  });
});

async function article(page: Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts
    .flatMap((script) => {
      const value = JSON.parse(script.textContent || '{}');
      return value['@graph'] || [value];
    }).find((value) => value['@type'] === 'Article'));
}

test('dashboard short answer and public footer links are available without JavaScript', async ({ browser, baseURL }) => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires production prerender output');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto(DASHBOARD);
    const opening = page.getByTestId('dashboard-short-answer');
    await expect(opening).toBeVisible();
    await expect(opening).toHaveCount(1);
    await expect(opening.locator('p')).toContainText('logical grid');
    await expect(opening.locator('li')).toHaveCount(4);
    expect(await opening.evaluate((node) => !node.closest('details') && !!(
      node.compareDocumentPosition(document.querySelector('[data-testid="sd-try-first"]')!)
      & Node.DOCUMENT_POSITION_FOLLOWING
    ))).toBe(true);
    await expect(page.locator('.sd-callout').filter({ hasText: 'Interview opening' })).toHaveCount(0);
    await expect(page).toHaveTitle(DASHBOARD_TITLE);
    expect((await article(page)).url).toBe(CANONICAL + DASHBOARD);

    for (const path of ['/system-design/offline-email-client', '/javascript/trivia/js-event-loop',
      '/javascript/coding/js-array-foreach', '/javascript/debug/js-debug-async-race']) {
      await page.goto(path);
      const next = page.locator('a[data-testid="footer-next"]');
      await expect(next).toBeVisible();
      const href = await next.getAttribute('href');
      expect(href).toMatch(/^\/(system-design|javascript)\//);
      const response = await page.goto(href!);
      expect(response?.status()).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL + href);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
    }
  } finally {
    await context.close();
  }
});

test('dashboard metadata survives hydration and hash navigation, then clears on another question', async ({ page }) => {
  await page.goto(DASHBOARD);
  await expect(page).toHaveTitle(DASHBOARD_TITLE);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', DASHBOARD_TITLE);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description!);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL + DASHBOARD);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  expect((await article(page)).headline).toBe(DASHBOARD_TITLE);

  await page.getByRole('button', { name: 'Start reference answer', exact: true }).click();
  await expect(page).toHaveURL(/#answer$/);
  await expect(page.locator('#sec-R')).toHaveAttribute('open', '');
  await expect(page.getByTestId('dashboard-short-answer')).toHaveCount(1);
  await expect(page).toHaveTitle(DASHBOARD_TITLE);
  await page.locator('.sdl-right').getByRole('button', { name: 'Architecture', exact: true }).click();
  await expect(page).toHaveURL(/#sec-A$/);
  await expect(page.locator('#sec-A')).toHaveAttribute('open', '');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL + DASHBOARD);
  await page.locator('a[href="/system-design/infinite-scroll-list"]').first().click();
  await expect(page).toHaveURL(/\/system-design\/infinite-scroll-list$/);
  await expect(page.getByTestId('dashboard-short-answer')).toHaveCount(0);
  await expect(page).toHaveTitle('Infinite Scroll System Design: Frontend Interview Guide');
  expect((await article(page)).url).toBe(CANONICAL + '/system-design/infinite-scroll-list');
});

for (const path of ['/system-design/offline-email-client', '/javascript/trivia/js-event-loop',
  '/javascript/coding/js-array-foreach', '/javascript/debug/js-debug-async-race']) {
  test(`footer supports native new tabs and one keyboard navigation: ${path}`, async ({ page, context }) => {
    await page.goto(path);
    const next = page.locator('a[data-testid="footer-next"]');
    await expect(next).toBeVisible();
    const href = await next.getAttribute('href');
    const originUrl = page.url();

    for (const click of [{ modifiers: ['ControlOrMeta'] as ['ControlOrMeta'] }, { button: 'middle' as const }]) {
      const popupPromise = context.waitForEvent('page');
      await next.click(click);
      const popup = await popupPromise;
      await popup.waitForURL((url) => url.pathname === href);
      await popup.waitForLoadState('domcontentloaded');
      expect(page.url()).toBe(originUrl);
      expect(await popup.evaluate(() => history.state?.session)).toBeFalsy();
      await popup.close();
    }

    await page.evaluate(() => {
      const original = history.pushState.bind(history);
      (window as any).__practicePushes = 0;
      history.pushState = (...args) => {
        (window as any).__practicePushes++;
        original(...args);
      };
    });
    await next.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    expect(await next.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
    await next.press('Enter');
    await expect(page).toHaveURL((url) => url.pathname === href);
    expect(await page.evaluate(() => (window as any).__practicePushes)).toBe(1);
  });
}
