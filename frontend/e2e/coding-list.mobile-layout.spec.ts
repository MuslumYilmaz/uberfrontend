import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

test.describe('coding list mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');

  test('mobile filter panel stays in flow and does not cover results', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/coding');

    await expect(page.getByTestId('coding-list-page')).toBeVisible();
    await expect(page.getByTestId('coding-list-loading')).toBeHidden();

    const filters = page.getByTestId('coding-list-filters');
    const results = page.getByTestId('coding-list-results');

    await expect(filters).toBeVisible();
    await expect(results).toBeVisible();
    await expect(results.locator('.list-row').first()).toBeVisible();

    await expect
      .poll(() => filters.evaluate((el) => getComputedStyle(el as HTMLElement).position))
      .toBe('static');

    const initialLayout = await page.evaluate(() => {
      const filters = document.querySelector('[data-testid="coding-list-filters"]') as HTMLElement | null;
      const results = document.querySelector('[data-testid="coding-list-results"]') as HTMLElement | null;
      if (!filters || !results) {
        return null;
      }

      const filterRect = filters.getBoundingClientRect();
      const resultsRect = results.getBoundingClientRect();
      return {
        filterBottom: Math.round(filterRect.bottom),
        resultsTop: Math.round(resultsRect.top),
      };
    });

    expect(initialLayout).not.toBeNull();
    expect(initialLayout!.resultsTop, 'results should render below the filter panel on mobile')
      .toBeGreaterThanOrEqual(initialLayout!.filterBottom - 1);

    await page.evaluate(() => window.scrollTo(0, 700));

    await expect
      .poll(() => filters.evaluate((el) => Math.round((el as HTMLElement).getBoundingClientRect().top)))
      .toBeLessThan(0);
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
