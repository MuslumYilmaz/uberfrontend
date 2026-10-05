import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const MOBILE_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
] as const;
const DESKTOP_VIEWPORTS = [
  { width: 1366, height: 900 },
  { width: 1440, height: 900 },
] as const;

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

async function assertHeaderLinksFit(page: import('@playwright/test').Page, selector: string) {
  const bounds = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, scrollWidth: element.scrollWidth };
  }));
  for (let index = 0; index < bounds.length; index += 1) {
    expect(bounds[index].scrollWidth).toBeLessThanOrEqual(bounds[index].width + 1);
    if (index > 0) expect(bounds[index - 1].right).toBeLessThanOrEqual(bounds[index].left + 1);
  }
}

async function mockHeaderAuth(
  page: import('@playwright/test').Page,
  baseURL: string | undefined,
  state: 'guest' | 'free' | 'premium',
) {
  const token = 'header-navigation-session';
  await installAuthMock(page, {
    token,
    user: buildMockUser({ accessTier: state === 'premium' ? 'premium' : 'free' }),
  });
  if (state !== 'guest') {
    await page.context().addCookies([{ name: 'access_token', value: token, url: baseURL! }]);
  }
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

  test('mobile menu works across route variants without overflow', async ({ page, baseURL }) => {
    await mockHeaderAuth(page, baseURL, 'guest');
    for (const viewport of MOBILE_VIEWPORTS) {
      await page.setViewportSize(viewport);

      for (const route of MARKETING_ROUTES) {
        await page.goto(route);
        await expect(page.getByTestId('marketing-header-brand')).toBeVisible();
        await expect(page.getByTestId('marketing-header-mobile-menu-button')).toBeVisible();
        await closeMarketingMobileMenuIfOpen(page);

        await openMarketingMobileMenuStable(page);
        await expect(page.getByTestId('marketing-header-mobile-menu').getByRole('link', { name: 'Interview Questions', exact: true }))
          .toHaveAttribute('href', '/interview-questions');
        await closeMarketingMobileMenuIfOpen(page);

        await assertNoHorizontalOverflow(page, `${viewport.width}px marketing route ${route}`);
      }

      for (const route of APP_ROUTES) {
        await page.goto(route);
        await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
        await expect(page.getByTestId('header-mobile-menu-button')).toBeVisible();
        await closeMobileMenuIfOpen(page);

        await openMobileMenuStable(page);
        await closeMobileMenuIfOpen(page);

        await page.getByTestId('header-mobile-study-button').click();
        await expect(page.getByRole('dialog', { name: 'Interview prep', exact: true })).toBeVisible();
        await expect(page.getByTestId('header-study-interview_questions')).toHaveAttribute('href', '/interview-questions');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Interview prep', exact: true })).toHaveCount(0);

        await assertNoHorizontalOverflow(page, `${viewport.width}px app route ${route}`);
      }
    }
  });

  test('desktop keeps desktop actions and hides compact menu button', async ({ page, baseURL }) => {
    await mockHeaderAuth(page, baseURL, 'free');
    for (const viewport of DESKTOP_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/pricing');

      await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Interview Prep/i })).toBeVisible();
      await expect(page.getByTestId('header-profile-button')).toBeVisible();
      await expect(page.getByTestId('header-mobile-menu-button')).toBeHidden();
      await expect(page.getByTestId('header-interview-hub')).toBeVisible();
      await expect(page.getByTestId('header-interview-hub')).toHaveAttribute('href', '/interview-questions');
      await assertHeaderLinksFit(page, '.fah-center .fah-navlink');
      await assertNoHorizontalOverflow(page, `${viewport.width}px desktop`);
    }
  });

  for (const state of ['guest', 'free', 'premium'] as const) {
    test(`marketing header fits at the 1180px breakpoint and desktop for ${state}`, async ({ page, baseURL }) => {
      await mockHeaderAuth(page, baseURL, state);
      await page.goto('/');

      for (const width of [1180, 1181, 1366, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const toggle = page.getByTestId('marketing-header-mobile-menu-button');
        const desktopLink = page.locator('.famh-nav').getByRole('link', { name: 'Interview Questions', exact: true });
        if (width <= 1180) {
          await expect(toggle).toBeVisible();
          await expect(desktopLink).toBeHidden();
          await openMarketingMobileMenuStable(page);
          await expect(page.getByTestId('marketing-header-mobile-menu').getByRole('link', { name: 'Interview Questions', exact: true })).toBeVisible();
          await closeMarketingMobileMenuIfOpen(page);
        } else {
          await expect(toggle).toBeHidden();
          await expect(desktopLink).toBeVisible();
          await expect(page.getByTestId('marketing-header-cta')).toBeVisible();
          await assertHeaderLinksFit(page, '.famh-brand, .famh-nav a, .famh-actions');
        }
        await assertNoHorizontalOverflow(page, `${width}px marketing ${state}`);
      }
    });

    test(`question hub navigation and browser back work on mobile and desktop for ${state}`, async ({ page, baseURL }) => {
      await mockHeaderAuth(page, baseURL, state);
      for (const viewport of [MOBILE_VIEWPORTS[0], MOBILE_VIEWPORTS[1], MOBILE_VIEWPORTS[2], ...DESKTOP_VIEWPORTS]) {
        await page.setViewportSize(viewport);
        await page.goto('/pricing');
        const mobile = viewport.width <= 980;
        if (mobile) {
          await expect(page.getByTestId('header-interview-hub')).toBeHidden();
          await page.getByTestId('header-mobile-study-button').click();
          await page.getByTestId('header-study-interview_questions').click();
          await expect(page.getByRole('dialog', { name: 'Interview prep', exact: true })).toHaveCount(0);
        } else {
          await page.getByTestId('header-interview-hub').click();
        }
        await expect(page).toHaveURL(/\/interview-questions$/);
        await expect(page.getByTestId('header-interview-hub')).toHaveAttribute('aria-current', 'page');
        await assertNoHorizontalOverflow(page, `${viewport.width}px hub ${state}`);
        await page.goBack();
        await expect(page).toHaveURL(/\/pricing$/);
        await expect(page.getByTestId('header-interview-hub')).not.toHaveAttribute('aria-current', 'page');
      }
    });
  }
});
