import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

async function loginAndOpenChangePassword(page: any, opts: Parameters<typeof installAuthMock>[1]) {
  const user = opts.user;
  const password = opts.validLogin?.password || 'secret123';

  await installAuthMock(page, opts);

  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/dashboard');

  await page.goto('/profile');
  const securityTab = page.getByRole('button', { name: 'Security' });
  await expect(securityTab).toBeVisible();
  await securityTab.click();
  await page.getByTestId('profile-change-password-open').click();
  await expect(page.getByTestId('profile-change-password-form')).toBeVisible();
}

test('profile security: change password succeeds', async ({ page }) => {
  const token = `e2e-token-change-password-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-password', email: 'password@example.com' });

  await loginAndOpenChangePassword(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'oldpass123' },
    changePassword: {
      currentPassword: 'oldpass123',
      currentPasswordConfirm: 'oldpass123',
      newPassword: 'newpass456',
    },
  });

  await page.getByTestId('profile-change-password-current').fill('oldpass123');
  await page.getByTestId('profile-change-password-current-confirm').fill('oldpass123');
  await page.getByTestId('profile-change-password-new').fill('newpass456');
  await page.getByTestId('profile-change-password-save').click();

  await expect(page.getByTestId('profile-change-password-success')).toBeVisible();
  await expect(page.getByTestId('profile-change-password-current')).toHaveValue('');
  await expect(page.getByTestId('profile-change-password-current-confirm')).toHaveValue('');
  await expect(page.getByTestId('profile-change-password-new')).toHaveValue('');
});

test('profile security: mismatched current password blocks request', async ({ page }) => {
  const token = `e2e-token-change-password-mismatch-${Date.now()}`;
  const user = buildMockUser({ _id: 'e2e-user-password-mismatch', email: 'mismatch@example.com' });
  let changeRequests = 0;

  page.on('request', (req: any) => {
    if (req.url().includes('/api/auth/change-password')) {
      changeRequests += 1;
    }
  });

  await loginAndOpenChangePassword(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'oldpass123' },
  });

  await page.getByTestId('profile-change-password-current').fill('oldpass123');
  await page.getByTestId('profile-change-password-current-confirm').fill('different');
  await page.getByTestId('profile-change-password-new').fill('newpass456');
  await page.getByTestId('profile-change-password-save').click();

  await expect(page.getByTestId('profile-change-password-error')).toContainText('Current passwords do not match.');
  await expect.poll(() => changeRequests).toBe(0);
});

test.describe('profile security: change password server error', () => {
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/change-password'],
  });

  test('shows backend error when current password is invalid', async ({ page }) => {
    const token = `e2e-token-change-password-invalid-${Date.now()}`;
    const user = buildMockUser({ _id: 'e2e-user-password-invalid', email: 'invalid@example.com' });

    await loginAndOpenChangePassword(page, {
      token,
      user,
      validLogin: { emailOrUsername: user.email, password: 'oldpass123' },
      forceChangePasswordError: { status: 401, error: 'Invalid current password' },
    });

    await page.getByTestId('profile-change-password-current').fill('oldpass123');
    await page.getByTestId('profile-change-password-current-confirm').fill('oldpass123');
    await page.getByTestId('profile-change-password-new').fill('newpass456');
    await page.getByTestId('profile-change-password-save').click();

    await expect(page.getByTestId('profile-change-password-error')).toContainText('Invalid current password');
  });
});
