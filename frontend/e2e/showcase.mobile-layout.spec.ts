import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 834, height: 1112 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

async function stabilize(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} should not overflow horizontally`).toBeLessThanOrEqual(
    metrics.clientWidth + 1,
  );
}

async function assertLocatorFitsWidth(locator: import('@playwright/test').Locator, label: string) {
  const count = await locator.count();
  if (count === 0) return;
  const first = locator.first();
  const visible = await first.isVisible();
  if (!visible) return;
  const metrics = await first.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} should fit width`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe('showcase mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrail is chromium-only.');

  test('mobile: coding workspace is replaced with desktop/tablet guard', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await page.getByTestId('showcase-demo-mobile-guard').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toBeVisible();
    await expect(page.locator('#demo-pane')).toHaveCount(0);
    await expect(page.getByTestId('showcase-demo-mobile-guard-open')).toHaveAttribute(
      'href',
      '/react/coding/react-counter',
    );
    await expect(page.getByTestId('showcase-demo-open-live')).toHaveClass(/hidden/);

    await stabilize(page);
    await assertNoHorizontalOverflow(page, 'showcase mobile');
    await assertLocatorFitsWidth(page.locator('.showcase-hero .shell'), 'hero shell');
    await assertLocatorFitsWidth(page.locator('.demo-mobile-guard-card'), 'mobile guard card');
    await assertLocatorFitsWidth(page.locator('.trivia-preview-card'), 'trivia preview card');
    await assertLocatorFitsWidth(page.locator('.system-preview-card'), 'system preview card');
  });

  test('tablet: coding workspace remains enabled', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

    await stabilize(page);
    await assertNoHorizontalOverflow(page, 'showcase tablet');
    await assertLocatorFitsWidth(page.locator('.demo-frame'), 'demo frame');
    await assertLocatorFitsWidth(page.locator('.company-grid'), 'company grid');
  });

  test('desktop: existing full demo frame stays available', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

    await stabilize(page);
    await assertNoHorizontalOverflow(page, 'showcase desktop');
  });
});
