import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

test.describe('PrimeNG upgrade interaction contracts', () => {
  test.use({ colorScheme: 'light', reducedMotion: 'reduce' });

  test.beforeEach(async ({ page }, info) => {
    if (info.config.metadata.primeSsrComparison) {
      // Keep the production build's synthetic API on the test origin, including
      // background assist requests. No cross-origin cookie/CORS assumptions.
      await page.addInitScript(() => {
        (window as Window & { __FA_API_BASE__?: string }).__FA_API_BASE__ = window.location.origin;
      });
    }
  });

  test('single and multiple selections preserve keyboard focus, filtering and selected values', async ({ page }) => {
    await page.goto('/system-design');
    await page.waitForLoadState('networkidle');
    const level = page.getByRole('combobox', { name: 'Level', exact: true });
    await level.press('Space');
    await page.getByRole('option', { name: 'Junior', exact: true }).click();
    await expect(level).toContainText('Junior');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await level.press('Space');
    await expect(page.getByRole('option', { name: 'Junior', exact: true })).toHaveAttribute('aria-selected', 'true');
    await level.press('Escape');
    await expect(level).toBeFocused();
    await expect(level).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();

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
    await expect(page.getByRole('listbox')).toHaveCount(0);
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
    await page.waitForLoadState('networkidle');
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

  test('question tooltips fit the viewport and dismiss with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 900 });
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    // Exercise the hydrated filter before hovering prerendered rows.
    await page.getByTestId('coding-list-search').fill('no-such-upgrade-question');
    await expect(page.getByTestId('coding-empty-state')).toBeVisible();
    await page.getByTestId('coding-list-search').fill('');
    const description = page.locator('.fa-question-row__description').first();
    await description.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toBeEmpty();
    const bounds = (await tooltip.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(834);
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
  });

  test('password dialog traps focus, unlocks scrolling and restores its trigger on Escape', async ({ page }) => {
    const user = buildMockUser({ _id: 'upgrade-controls', email: 'upgrade-controls@example.com' });
    await installAuthMock(page, {
      token: 'upgrade-controls-token', user,
      validLogin: { emailOrUsername: user.email, password: 'test-password-123' },
    });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(user.email);
    await page.getByTestId('login-password').fill('test-password-123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/dashboard');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
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
