import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

type MockUser = ReturnType<typeof buildMockUser>;

function resolveBaseUrl(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) return process.env.PLAYWRIGHT_BASE_URL;
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

async function login(page: any, user: MockUser, password = 'secret123', opts?: { navigate?: boolean }) {
  if (opts?.navigate !== false) {
    await page.goto('/auth/login');
  }
  await expect(page.getByTestId('login-page')).toBeVisible();

  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

async function seedPremiumSession(page: any) {
  const baseUrl = resolveBaseUrl();
  const token = `e2e-token-company-premium-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-company-premium-user',
    username: 'company_premium_user',
    email: 'company-premium@example.com',
    accessTier: 'premium',
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
    url: baseUrl,
  }]);
  await page.evaluate(() => {
    localStorage.setItem('fa:auth:session', '1');
  });
  await page.reload();
}

test.describe('routing and access critical paths', () => {
  test.use({
    // Guest checks intentionally trigger /api/auth/me 401 in guard flows.
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('onboarding quick-start submits and reveals personalized next actions', async ({ page }) => {
    await page.goto('/onboarding/quick-start');
    await expect(page.getByTestId('onboarding-quick-start-page')).toBeVisible();

    await page.getByRole('button', { name: 'Show my next actions' }).click();
    await expect(page.getByRole('heading', { name: 'Your personalized next action list' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to dashboard' })).toBeVisible();
  });

  test('auth guard redirects to login and returns to /profile after successful login', async ({ page }) => {
    const token = `e2e-token-profile-redirect-${Date.now()}`;
    const user = buildMockUser({
      _id: 'e2e-profile-redirect-user',
      username: 'profile_redirect_user',
      email: 'profile-redirect@example.com',
    });

    await installAuthMock(page, {
      token,
      user,
      validLogin: { emailOrUsername: user.email, password: 'secret123' },
    });

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/login\?redirectTo=%2Fprofile/);

    await login(page, user, 'secret123', { navigate: false });
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible();
  });

  test('dashboard daily complete updates status and focus-areas CTA navigates', async ({ page }) => {
    const token = `e2e-token-dashboard-${Date.now()}`;
    const user = buildMockUser({
      _id: 'e2e-dashboard-user',
      username: 'dashboard_user',
      email: 'dashboard@example.com',
    });

    await installAuthMock(page, {
      token,
      user,
      validLogin: { emailOrUsername: user.email, password: 'secret123' },
    });

    await login(page, user);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.getByTestId('dashboard-daily-complete').click();
    await expect(page.getByText(/Daily challenge completed\.|Already completed for today\./)).toBeVisible();

    await page.getByTestId('dashboard-focus-areas-link').click();
    await expect(page).toHaveURL('/focus-areas');
    await expect(page.getByRole('heading', { name: 'Frontend Interview Focus Areas' })).toBeVisible();
  });

  test('company preview route redirects premium users to full company detail', async ({ page }) => {
    await seedPremiumSession(page);

    await page.goto('/companies/google/preview');
    await expect(page).toHaveURL('/companies/google/all');
    await expect(page.getByRole('heading', { name: /google front end interview guide/i })).toBeVisible();
  });

  test('interview questions master hub loads and renders question entries', async ({ page }) => {
    await page.goto('/interview-questions');
    await expect(page.getByRole('heading', { name: 'Frontend Interview Questions Library' })).toBeVisible();
    await expect(page.locator('.iq-item')).not.toHaveCount(0);
  });
});
