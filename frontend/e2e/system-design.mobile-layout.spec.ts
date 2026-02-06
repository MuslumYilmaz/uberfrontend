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

async function assertElementFitsWidth(locator: import('@playwright/test').Locator, label: string) {
  const metrics = await locator.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertDocumentNoOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, 'document overflows horizontally').toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertCenterLayoutNoOverflow(page: import('@playwright/test').Page) {
  await assertElementFitsWidth(page.locator('.sdl-center'), '.sdl-center');

  const offenders = await page.evaluate(() => {
    const selectors = ['.sd-section', '.sd-blocks', '.sd-columns', '.sd-column', '.sd-code', '.sd-table'];
    const list: Array<{ target: string; scrollWidth: number; clientWidth: number }> = [];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el, idx) => {
        const node = el as HTMLElement;
        if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) {
          list.push({
            target: `${selector}[${idx}]`,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
          });
        }
      });
    });
    return list;
  });

  expect(offenders, 'system design containers overflow horizontally').toEqual([]);
}

async function assertSystemDesignNoOverflow(page: import('@playwright/test').Page) {
  await assertDocumentNoOverflow(page);
  const lockedCount = await page.locator('.locked-card').count();
  if (lockedCount > 0) {
    await assertElementFitsWidth(page.locator('.locked-card').first(), '.locked-card');
    return;
  }
  await assertCenterLayoutNoOverflow(page);
}

test.describe('system design mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('system design mobile - compact controls visible and rails hidden', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await expect(page.getByTestId('sd-mobile-overview-trigger')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toBeVisible();
    await expect(page.locator('.sdl-left')).toBeHidden();
    await expect(page.locator('.sdl-right')).toBeHidden();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - overview panel open and close', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await page.getByTestId('sd-mobile-overview-trigger').click();
    await expect(page.getByTestId('sd-mobile-overview-panel')).toBeVisible();
    await page.getByTestId('sd-mobile-overview-close').click();
    await expect(page.getByTestId('sd-mobile-overview-panel')).toHaveCount(0);

    await page.getByTestId('sd-mobile-overview-trigger').click();
    await expect(page.getByTestId('sd-mobile-overview-panel')).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(page.getByTestId('sd-mobile-overview-panel')).toHaveCount(0);
    await expect(page.getByTestId('sd-mobile-toc-panel')).toHaveCount(0);

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - toc panel navigates and closes', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await page.getByTestId('sd-mobile-toc-trigger').click();
    await expect(page.getByTestId('sd-mobile-toc-panel')).toBeVisible();

    const targets = page.locator('#sd-mobile-toc-panel .toc-item');
    const itemCount = await targets.count();
    expect(itemCount).toBeGreaterThan(1);
    await targets.nth(1).click();
    await expect(page.getByTestId('sd-mobile-toc-panel')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - compact behavior still active on tablet', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await expect(page.getByTestId('sd-mobile-overview-trigger')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toBeVisible();
    await expect(page.locator('.sdl-left')).toBeHidden();
    await expect(page.locator('.sdl-right')).toBeHidden();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design desktop - rails preserved', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await expect(page.locator('.sdl-left')).toBeVisible();
    await expect(page.locator('.sdl-right')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-overview-trigger')).toHaveCount(0);
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toHaveCount(0);

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - locked card fits width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/endless-short-video-feed');

    await expect(page.locator('.locked-card')).toBeVisible();
    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });
});
