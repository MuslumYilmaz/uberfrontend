import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

const MARKETING_ROUTES = [
  '/',
];

const APP_ROUTES = [
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

async function closeMobileMenuIfOpen(page: import('@playwright/test').Page) {
  const menu = page.locator('#app-sidebar-drawer.is-open');
  const toggle = page.getByTestId('header-mobile-menu-button');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await menu.count()) === 0) return;

    await page.keyboard.press('Escape');
    if ((await menu.count()) === 0) return;

    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click({ force: true });
      if ((await menu.count()) === 0) return;
    }

    const backdrop = page.locator('.fah-backdrop').first();
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click({ force: true });
    }
  }
  await expect(menu).toHaveCount(0);
}

async function openMobileMenuStable(page: import('@playwright/test').Page) {
  const menu = page.locator('#app-sidebar-drawer.is-open');
  const authLink = page.getByTestId('sidebar-mobile-login').or(page.getByTestId('sidebar-mobile-profile'));
  const toggle = page.getByTestId('header-mobile-menu-button');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await toggle.click();
    try {
      await expect(menu).toBeVisible({ timeout: 2500 });
      await expect(authLink.first()).toBeVisible({ timeout: 2500 });
      return;
    } catch {
      await closeMobileMenuIfOpen(page);
    }
  }

  throw new Error('Unable to open stable mobile header menu.');
}

async function closeMarketingMobileMenuIfOpen(page: import('@playwright/test').Page) {
  const menu = page.getByTestId('marketing-header-mobile-menu');
  if ((await menu.count()) === 0) return;
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
}

async function openMarketingMobileMenuStable(page: import('@playwright/test').Page) {
  const menu = page.getByTestId('marketing-header-mobile-menu');
  const toggle = page.getByTestId('marketing-header-mobile-menu-button');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await toggle.click();
    try {
      await expect(menu).toBeVisible({ timeout: 2500 });
      await expect(page.getByTestId('marketing-header-mobile-cta')).toBeVisible({ timeout: 2500 });
      return;
    } catch {
      await closeMarketingMobileMenuIfOpen(page);
    }
  }

  throw new Error('Unable to open stable marketing mobile header menu.');
}

test.describe('header mobile layout', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Mobile header guardrail is chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('mobile menu works across route variants without overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    for (const route of MARKETING_ROUTES) {
      await page.goto(route);
      await expect(page.getByTestId('marketing-header-brand')).toBeVisible();
      await expect(page.getByTestId('marketing-header-mobile-menu-button')).toBeVisible();
      await closeMarketingMobileMenuIfOpen(page);

      await openMarketingMobileMenuStable(page);
      await closeMarketingMobileMenuIfOpen(page);

      await assertNoHorizontalOverflow(page, `mobile route ${route}`);
    }

    for (const route of APP_ROUTES) {
      await page.goto(route);
      await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
      await expect(page.getByTestId('header-mobile-menu-button')).toBeVisible();
      await closeMobileMenuIfOpen(page);

      await openMobileMenuStable(page);
      await closeMobileMenuIfOpen(page);

      await assertNoHorizontalOverflow(page, `mobile route ${route}`);
    }
  });

  test('desktop keeps desktop actions and hides compact menu button', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/dashboard');

    await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Interview Prep/i })).toBeVisible();
    await expect(page.getByTestId('header-profile-button')).toBeVisible();
    await expect(page.getByTestId('header-mobile-menu-button')).toBeHidden();
    await assertNoHorizontalOverflow(page, 'desktop');
  });
});
