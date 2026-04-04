import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const DESKTOP_VIEWPORT = { width: 1440, height: 1024 };

async function revealDeferredSections(page: import('@playwright/test').Page) {
  const viewportHeight = page.viewportSize()?.height ?? DESKTOP_VIEWPORT.height;
  const maxScroll = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
  const step = Math.max(480, Math.floor(viewportHeight * 0.85));

  for (let scrollY = 0; scrollY < maxScroll; scrollY += step) {
    await page.evaluate((value) => window.scrollTo(0, value), scrollY);
    await page.waitForTimeout(80);
  }

  await page.waitForTimeout(180);
}

async function stabilize(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await revealDeferredSections(page);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
    `,
  });
  await page.waitForTimeout(120);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function seedAuthenticatedSession(page: any) {
  const token = `e2e-visual-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-visual-dashboard-user',
    username: 'visual_dashboard_user',
    email: 'visual-dashboard@example.com',
  });

  await installAuthMock(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'secret123' },
  });

  await page.goto('/');
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: page.url(),
  }]);
  await page.evaluate(() => {
    localStorage.setItem('fa:auth:session', '1');
  });
}

test.describe('visual smoke baselines', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
    reducedMotion: 'reduce',
    viewport: DESKTOP_VIEWPORT,
  });

  test('showcase page baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('showcase-home.png', { fullPage: true });
  });

  test('dashboard page baseline', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('dashboard-authenticated.png', { fullPage: true });
  });

  test('login page baseline', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('auth-login.png', { fullPage: true });
  });

  test('pricing page baseline', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('.pricing-page')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('pricing-page.png', { fullPage: true });
  });

  test('guide detail baseline', async ({ page }) => {
    await page.goto('/guides/interview-blueprint/intro');
    await expect(page.getByRole('heading', { name: /frontend interview preparation guide/i })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('guide-intro.png', { fullPage: true });
  });

  test('trivia detail baseline', async ({ page }) => {
    await page.goto('/javascript/trivia/js-event-loop');
    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('trivia-detail.png', { fullPage: true });
  });

  test('coding detail baseline', async ({ page }) => {
    await page.goto('/javascript/coding/js-number-clamp');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot('coding-detail.png', { fullPage: true });
  });
});
