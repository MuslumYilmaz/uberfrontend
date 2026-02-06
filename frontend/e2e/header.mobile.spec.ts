import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

const ROUTES = [
  '/',
  '/javascript/trivia/js-event-loop',
  '/system-design/infinite-scroll-list',
  '/pricing',
];

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe('header mobile layout', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Mobile header guardrail is chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('mobile menu works across route variants without overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
      await expect(page.getByTestId('header-mobile-menu-button')).toBeVisible();

      await page.getByTestId('header-mobile-menu-button').click();
      await expect(page.getByTestId('header-mobile-menu')).toBeVisible();
      await expect(page.getByTestId('header-mobile-dashboard')).toBeVisible();

      await page.getByTestId('header-mobile-menu-button').click();
      await expect(page.getByTestId('header-mobile-menu')).toHaveCount(0);

      await assertNoHorizontalOverflow(page, `mobile route ${route}`);
    }
  });

  test('desktop keeps desktop actions and hides compact menu button', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('header-profile-button')).toBeVisible();
    await expect(page.getByTestId('header-mobile-menu-button')).toBeHidden();
    await assertNoHorizontalOverflow(page, 'desktop');
  });
});
