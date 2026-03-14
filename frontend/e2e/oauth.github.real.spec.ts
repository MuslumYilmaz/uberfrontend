import { test, expect } from '@playwright/test';
import { completeGitHubOAuthLogin } from './helpers/github-oauth-login';

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

const runRealOAuth = process.env.E2E_REAL_OAUTH === '1';
const allowProdTarget = process.env.E2E_ALLOW_PROD_REAL_OAUTH === '1';
const githubLogin = String(process.env.E2E_REAL_OAUTH_LOGIN || '').trim();
const githubPassword = String(process.env.E2E_REAL_OAUTH_PASSWORD || '').trim();
const expectedEmail = String(process.env.E2E_REAL_OAUTH_EXPECTED_EMAIL || '').trim();

test.describe('github oauth real smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!runRealOAuth, 'Real OAuth smoke is disabled (set E2E_REAL_OAUTH=1).');
  test.skip(!githubLogin || !githubPassword, 'Missing GitHub OAuth test credentials.');

  test('github login roundtrip succeeds on staging', async ({ browser, request, baseURL }, testInfo) => {
    test.setTimeout(180_000);

    const resolvedBaseUrl = resolveBaseUrl(baseURL);
    if (isProtectedProductionTarget(resolvedBaseUrl) && !allowProdTarget) {
      test.skip(true, 'Refusing to run real OAuth smoke on production. Use staging or set E2E_ALLOW_PROD_REAL_OAUTH=1.');
      return;
    }

    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();

    const context = await browser.newContext({
      baseURL: resolvedBaseUrl,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    let sawAuthMe401 = false;
    page.on('response', (response) => {
      if (response.url().includes('/api/auth/me') && response.status() === 401) {
        sawAuthMe401 = true;
      }
    });

    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await page.getByTestId('login-github').click();

    await completeGitHubOAuthLogin(page, {
      login: githubLogin,
      password: githubPassword,
    });

    await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 30_000 });

    if (sawAuthMe401) {
      throw new Error('Detected /api/auth/me 401 during OAuth return. Check cookie SameSite/CORS or callback auth state.');
    }

    await page.screenshot({ path: testInfo.outputPath('oauth-github-after-login.png'), fullPage: true });

    await page.goto('/profile');
    await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible({ timeout: 30_000 });
    if (expectedEmail) {
      await expect(page.getByText(expectedEmail, { exact: true })).toBeVisible({ timeout: 30_000 });
    }

    await page.getByTestId('header-profile-button').click();
    await expect(page.getByTestId('header-profile-menu')).toBeVisible();
    await page.getByTestId('header-menu-logout').click();
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible({ timeout: 30_000 });

    await page.screenshot({ path: testInfo.outputPath('oauth-github-after-logout.png'), fullPage: true });
    await context.close();
  });
});
