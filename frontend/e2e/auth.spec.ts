import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getApiRoot, getFrontendBase } from '../src/app/core/utils/api-base';

async function cookieValue(page: any, name: string): Promise<string | null> {
  const cookies = await page.context().cookies();
  const hit = cookies.find((c: any) => c.name === name);
  return hit ? hit.value : null;
}

async function expectAccessTokenCookie(page: any, token: string | null) {
  await expect
    .poll(() => cookieValue(page, 'access_token'))
    .toBe(token ? encodeURIComponent(token) : null);
}

async function expectLoggedIn(page: any) {
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await page.getByTestId('header-profile-button').click();
  await expect(page.getByTestId('header-profile-menu')).toBeVisible();
  await expect(page.getByTestId('header-menu-logout')).toBeVisible();
  // Close menu to avoid overlay interference.
  await page.getByTestId('header-profile-button').click();
  await expect(page.getByTestId('header-profile-menu')).toBeHidden();
}

async function logout(page: any) {
  await page.getByTestId('header-profile-button').click();
  await expect(page.getByTestId('header-profile-menu')).toBeVisible();
  await page.getByTestId('header-menu-logout').click();
  await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
  await expectAccessTokenCookie(page, null);
}

test('auth: signup (email/password) logs in', async ({ page }) => {
  const token = `e2e-token-signup-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-signup', username: 'signup_user', email: 'signup@example.com' });
  await installAuthMock(page, {
    token,
    user,
    validSignup: { email: user.email, username: user.username, password: 'secret123' },
  });

  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();

  await page.getByTestId('signup-email').fill(user.email);
  await page.getByTestId('signup-username').fill(user.username);
  await page.getByTestId('signup-password').fill('secret123');
  await page.getByTestId('signup-confirm').fill('secret123');
  await page.getByTestId('signup-submit').click();

  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await expectAccessTokenCookie(page, token);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);
});

test('auth edge: signup trims email/username and still succeeds', async ({ page }) => {
  const token = `e2e-token-signup-trim-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-signup-trim', username: 'trim_user', email: 'trim@example.com' });
  await installAuthMock(page, {
    token,
    user,
    validSignup: { email: user.email, username: user.username, password: 'secret123' },
  });

  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();

  await page.getByTestId('signup-email').fill(`  ${user.email} `);
  await page.getByTestId('signup-username').fill(` ${user.username}  `);
  await page.getByTestId('signup-password').fill('secret123');
  await page.getByTestId('signup-confirm').fill('secret123');
  await page.getByTestId('signup-submit').click();

  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await expectAccessTokenCookie(page, token);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);
});

test('auth: login (email/password) logs in and survives reload', async ({ page }) => {
  const token = `e2e-token-login-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-login', username: 'login_user', email: 'login@example.com' });
  await installAuthMock(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'secret123' },
  });

  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();

  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill('secret123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await expectAccessTokenCookie(page, token);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);

  await page.reload();
  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await expectAccessTokenCookie(page, token);
});

test('auth: OAuth login works (Google + GitHub)', async ({ page }) => {
  const token = `e2e-token-oauth-login-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-oauth-login', username: 'oauth_login', email: 'oauth-login@example.com' });
  await installAuthMock(page, { token, user });

  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await page.getByTestId('login-google').click();
  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await logout(page);

  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await page.getByTestId('login-github').click();
  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
});

test('auth: OAuth start uses API base URL (not frontend /api)', async ({ page }) => {
  const token = `e2e-token-oauth-start-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-oauth-start', username: 'oauth_start', email: 'oauth-start@example.com' });
  await installAuthMock(page, { token, user });

  const apiRoot = getApiRoot();
  let oauthUrl: string | null = null;

  page.on('request', (req) => {
    if (req.url().includes('/api/auth/oauth/google/start')) {
      oauthUrl = req.url();
    }
  });

  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  const frontendBase = getFrontendBase() || new URL(page.url()).origin;
  await page.getByTestId('login-google').click();

  await expect.poll(() => oauthUrl).not.toBeNull();
  expect(oauthUrl!.startsWith(`${apiRoot}/auth/oauth/google/start`)).toBeTruthy();
  expect(oauthUrl!.startsWith(`${frontendBase}/api/`)).toBeFalsy();
});

test('auth: OAuth signup works (Google + GitHub)', async ({ page }) => {
  const token = `e2e-token-oauth-signup-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-oauth-signup', username: 'oauth_signup', email: 'oauth-signup@example.com' });
  await installAuthMock(page, { token, user });

  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();
  await page.getByTestId('signup-google').click();
  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
  await logout(page);

  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();
  await page.getByTestId('signup-github').click();
  await expect(page).toHaveURL('/dashboard');
  await expectLoggedIn(page);
});

test.describe('auth edge: invalid login', () => {
  test.use({
    // Chromium logs 401s as console.error ("Failed to load resource") — allowlist only for this scenario.
    consoleErrorAllowlist: ['\\/api\\/auth\\/login'],
  });

  test('invalid credentials shows friendly message', async ({ page }) => {
    await installAuthMock(page, {
      token: 'e2e-unused',
      user: buildMockUser({ _id: 'e2e-user-unused' }),
      forceLoginError: { status: 401, error: 'Invalid credentials' },
    });

    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    await page.getByTestId('login-email').fill('wrong@example.com');
    await page.getByTestId('login-password').fill('wrong');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByTestId('login-error')).toContainText('Invalid credentials');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);
    await expectAccessTokenCookie(page, null);
  });
});

test.describe('auth edge: retry flows', () => {
  test.describe('login can recover after a 401', () => {
    test.use({
      // Chromium logs 401s as console.error ("Failed to load resource") — allowlist only for this scenario.
      consoleErrorAllowlist: ['\\/api\\/auth\\/login'],
    });

    test('second attempt succeeds after first failure', async ({ page }) => {
      const token = `e2e-token-login-retry-${Date.now()}`;
      const user = buildMockUser({ _id: 'e2e-user-login-retry', username: 'retry_user', email: 'retry@example.com' });
      await installAuthMock(page, {
        token,
        user,
        validLogin: { emailOrUsername: user.email, password: 'secret123' },
        loginSequence: [
          { status: 401, error: 'Invalid credentials' },
          { status: 200 },
        ],
      });

      await page.goto('/auth/login');
      await expect(page.getByTestId('login-page')).toBeVisible();

      await page.getByTestId('login-email').fill(user.email);
      await page.getByTestId('login-password').fill('secret123');
      await page.getByTestId('login-submit').click();

      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(page.getByTestId('login-error')).toContainText('Invalid credentials');
      await expect(page.getByTestId('login-submit')).toBeEnabled();

      await page.getByTestId('login-submit').click();
      await expect(page).toHaveURL('/dashboard');
      await expectLoggedIn(page);
    });
  });

  test.describe('signup can recover after a 409', () => {
    test.use({
      // Chromium logs 409s as console.error ("Failed to load resource") — allowlist only for this scenario.
      consoleErrorAllowlist: ['\\/api\\/auth\\/signup'],
    });

    test('second attempt succeeds after conflict error', async ({ page }) => {
      const token = `e2e-token-signup-retry-${Date.now()}`;
      const user = buildMockUser({ _id: 'e2e-user-signup-retry', username: 'retry_signup', email: 'retry-signup@example.com' });
      await installAuthMock(page, {
        token,
        user,
        validSignup: { email: user.email, username: user.username, password: 'secret123' },
        signupSequence: [
          { status: 409, error: 'Account already exists' },
          { status: 201 },
        ],
      });

      await page.goto('/auth/signup');
      await expect(page.getByTestId('signup-page')).toBeVisible();

      await page.getByTestId('signup-email').fill(user.email);
      await page.getByTestId('signup-username').fill(user.username);
      await page.getByTestId('signup-password').fill('secret123');
      await page.getByTestId('signup-confirm').fill('secret123');
      await page.getByTestId('signup-submit').click();

      await expect(page).toHaveURL(/\/auth\/signup$/);
      await expect(page.getByTestId('signup-error')).toContainText('Account already exists');
      await expect(page.getByTestId('signup-submit')).toBeEnabled();

      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL('/dashboard');
      await expectLoggedIn(page);
    });
  });
});

test('auth edge: signup blocks mismatched passwords (no token set)', async ({ page }) => {
  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();

  await page.getByTestId('signup-email').fill('mismatch@example.com');
  await page.getByTestId('signup-username').fill('mismatch_user');
  await page.getByTestId('signup-password').fill('secret123');
  await page.getByTestId('signup-confirm').fill('secret124');

  // Trigger "touched" so the mismatch warning is visible.
  await page.getByTestId('signup-confirm').blur();
  await expect(page.getByTestId('signup-mismatch')).toBeVisible();

  await page.getByTestId('signup-submit').click();
  await expect(page).toHaveURL(/\/auth\/signup$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);
  await expectAccessTokenCookie(page, null);
});

test('auth edge: OAuth callback rejects state mismatch', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('oauth:state', 'expected-state');
  });

  await page.goto('/auth/callback?state=wrong-state#token=e2e-token');
  await expect(page.getByTestId('oauth-callback-page')).toBeVisible();
  await expect(page.getByTestId('oauth-callback-error')).toContainText('Invalid OAuth state');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe(null);
  await expectAccessTokenCookie(page, null);
});
