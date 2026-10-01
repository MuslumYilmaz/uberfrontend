import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

test.use({ consoleErrorAllowlist: ['^Failed to load resource: the server responded with a status of 401.*\\/api\\/auth\\/me'] });

test.beforeEach(async ({ page }) => {
  await installAuthMock(page, { token: 'freshness-guest', user: buildMockUser() });
});

test('unpublished mastery routes and legacy aliases lead to useful framework guides', async ({ page }) => {
  for (const framework of ['react', 'angular', 'vue']) {
    const slug = `${framework}-prep-path`;
    const target = `/guides/framework-prep/${slug}`;
    for (const source of [`${target}/mastery`, `/track/${slug}/mastery`, `/tracks/${slug}/mastery`]) {
      await page.goto(source);
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${target}$`));
      await expect(page.locator('main')).not.toContainText('0/0 complete');
      await expect(page.locator('main')).not.toContainText('coming soon');
    }
  }
});

test('JavaScript mastery remains active and unknown mastery slugs still reach 404', async ({ page }) => {
  const target = '/guides/framework-prep/javascript-prep-path/mastery';
  await page.goto(target);
  await expect(page.getByRole('navigation', { name: 'Mastery modules' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${target}$`));
  await page.goto('/guides/framework-prep/not-a-framework/mastery');
  await expect(page).toHaveURL(/\/404$/);
});

test('preparation search has a useful empty state without an unavailable cheat-sheet result', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByRole('heading', { name: 'Frontend Coding Challenges', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Interview Prep', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search interview prep' }).fill('cheat');
  const dialog = page.getByRole('dialog', { name: 'Interview prep', exact: true });
  await expect(dialog).not.toContainText('Cheat sheets');
  await expect(dialog).not.toContainText('Soon');
  await expect(dialog).toContainText(/no matches/i);
});
