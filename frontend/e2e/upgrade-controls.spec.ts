import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

test.describe('PrimeNG upgrade interaction contracts', () => {
  test.use({ colorScheme: 'light', reducedMotion: 'reduce' });

  test('single and multiple selections preserve keyboard focus, filtering and selected values', async ({ page }) => {
    await page.goto('/system-design');
    const level = page.getByRole('combobox', { name: 'Level', exact: true });
    await level.press('Space');
    await page.getByRole('option', { name: 'Junior', exact: true }).click();
    await expect(level).toContainText('Junior');
    await level.press('Space');
    await expect(page.getByRole('option', { name: 'Junior', exact: true })).toHaveAttribute('aria-selected', 'true');
    await level.press('Escape');
    await expect(level).toBeFocused();
    await expect(level).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('listbox')).toHaveCount(0);

    const tags = page.getByRole('combobox', { name: 'Tags', exact: true });
    await tags.press('Space');
    await expect(level).toHaveAttribute('aria-expanded', 'false');
    const filter = page.getByLabel('Filter system design tags', { exact: true });
    await expect(filter).toBeFocused();
    await filter.fill('accessibility');
    const option = page.getByRole('option', { name: 'accessibility', exact: true });
    await option.click();
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await filter.fill('no-such-tag');
    await expect(page.getByText('No results found', { exact: true })).toBeVisible();
    await filter.press('Escape');
    await expect(tags).toBeFocused();
    await tags.press('Space');
    await filter.fill('accessibility');
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Close options', exact: true }).click();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(tags).toBeFocused();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toBeDisabled();
  });

  test('body-appended overlays keep the dark theme even with a light OS preference', async ({ page }) => {
    await page.goto('/system-design');
    await page.getByRole('combobox', { name: 'Level', exact: true }).click();
    const overlay = page.locator('.fa-select-panel');
    await expect(overlay).toBeVisible();
    const light = await overlay.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, border: style.borderColor };
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await overlay.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, border: style.borderColor };
    });
    expect(dark).toEqual(light);
    expect(dark.background).toBe('rgb(11, 13, 20)');
    await expect(page.locator('html')).toHaveClass(/fa-dark/);
  });

  test('password dialog traps focus, unlocks scrolling and restores its trigger on Escape', async ({ page }) => {
    const user = buildMockUser({ _id: 'upgrade-controls', email: 'upgrade-controls@example.com' });
    await installAuthMock(page, {
      token: 'upgrade-controls-token', user,
      validLogin: { emailOrUsername: user.email, password: 'test-password-123' },
    });
    await page.goto('/auth/login');
    await page.getByTestId('login-email').fill(user.email);
    await page.getByTestId('login-password').fill('test-password-123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/dashboard');
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Security', exact: true }).click();
    const trigger = page.getByTestId('profile-change-password-open');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Change password', exact: true });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('profile-change-password-current')).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/p-overflow-hidden/);
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/p-overflow-hidden/);
    await expect(trigger).toBeFocused();
  });
});
