import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

test.describe('coding list mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');

  test('mobile filter drawer is explicit and keeps results reachable', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/coding');

    await expect(page.getByTestId('coding-list-page')).toBeVisible();
    await expect(page.getByTestId('coding-list-loading')).toBeHidden();

    const desktopFilters = page.getByTestId('coding-list-filters');
    const mobileFilterTrigger = page.getByTestId('coding-list-mobile-filter-trigger');
    const results = page.getByTestId('coding-list-results');

    await expect(desktopFilters).toBeHidden();
    await expect(mobileFilterTrigger).toBeVisible();
    await expect(mobileFilterTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(results).toBeVisible();
    await expect(results.locator('.list-row').first()).toBeVisible();

    await expect
      .poll(() => mobileFilterTrigger.evaluate((el) => getComputedStyle(el as HTMLElement).display))
      .toMatch(/^(inline-)?flex$/);

    await mobileFilterTrigger.click();
    await expect(mobileFilterTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('coding-list-mobile-filter-drawer')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Coding filters' })).toBeVisible();

    await page.getByTestId('coding-list-mobile-filter-close').click();
    await expect(page.getByTestId('coding-list-mobile-filter-drawer')).toBeHidden();
    await expect(mobileFilterTrigger).toHaveAttribute('aria-expanded', 'false');

    await results.locator('.list-row').first().scrollIntoViewIfNeeded();
    await expect(page.getByTestId('coding-list-mobile-filter-drawer')).toBeHidden();
    await expect(results.locator('.list-row').first()).toBeVisible();
  });

  test('desktop keeps the filter rail sticky', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/coding');

    await expect(page.getByTestId('coding-list-page')).toBeVisible();

    await expect
      .poll(() => page.getByTestId('coding-list-filters').evaluate((el) => getComputedStyle(el as HTMLElement).position))
      .toBe('sticky');
  });
});
