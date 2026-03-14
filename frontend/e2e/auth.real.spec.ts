import { test, expect, type BrowserContext } from '@playwright/test';

function resolveBaseUrl(baseURL: string | undefined): string {
  if (baseURL) return baseURL;
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

function isProtectedProductionTarget(baseURL: string): boolean {
  try {
    const host = new URL(baseURL).hostname.toLowerCase();
    return host === 'frontendatlas.com' || host === 'www.frontendatlas.com';
  } catch {
    return false;
  }
}

async function authCookieValue(context: BrowserContext): Promise<string | null> {
  const cookies = await context.cookies();
  const authCookie = cookies.find((cookie) => cookie.name === 'access_token');
  return authCookie ? authCookie.value : null;
}

const runRealAuth = process.env.E2E_REAL_AUTH === '1';
const allowProdTarget = process.env.E2E_ALLOW_PROD_REAL_AUTH === '1';

test.describe('auth real smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!runRealAuth, 'Real auth smoke is disabled (set E2E_REAL_AUTH=1).');

  test('signup -> reload -> /me -> logout works against a real backend', async ({ browser, request, baseURL }, testInfo) => {
    test.setTimeout(120_000);

    const resolvedBaseUrl = resolveBaseUrl(baseURL);
    if (isProtectedProductionTarget(resolvedBaseUrl) && !allowProdTarget) {
      test.skip(true, 'Refusing to create real auth users on production. Use staging/local or set E2E_ALLOW_PROD_REAL_AUTH=1.');
      return;
    }

    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();

    const context = await browser.newContext({
      baseURL: resolvedBaseUrl,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    const stamp = Date.now();
    const email = `e2e-auth-${stamp}@example.com`;
    const username = `e2e_auth_${stamp}`;
    const password = 'secret123';

    await page.goto('/auth/signup');
    await expect(page.getByTestId('signup-page')).toBeVisible();
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-username').fill(username);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm').fill(password);
    await page.getByTestId('signup-submit').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    expect(await authCookieValue(context)).toBeTruthy();

    const meAfterReload = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/me') &&
        response.request().method() === 'GET' &&
        response.status() === 200,
      { timeout: 30_000 }
    );
    await page.reload();
    await meAfterReload;
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath('auth-real-after-reload.png'), fullPage: true });

    await page.getByTestId('header-profile-button').click();
    await expect(page.getByTestId('header-profile-menu')).toBeVisible();
    await page.getByTestId('header-menu-logout').click();

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible({ timeout: 30_000 });
    expect(await authCookieValue(context)).toBeNull();

    const meAfterLogout = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/me') &&
        response.request().method() === 'GET' &&
        response.status() === 401,
      { timeout: 30_000 }
    );
    await page.goto('/profile');
    await meAfterLogout;
    await expect(page).toHaveURL(/\/auth\/login\?redirectTo=%2Fprofile/, { timeout: 30_000 });

    await page.screenshot({ path: testInfo.outputPath('auth-real-after-logout.png'), fullPage: true });
    await context.close();
  });
});
