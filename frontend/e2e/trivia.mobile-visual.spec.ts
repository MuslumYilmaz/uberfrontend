import { test, expect } from './fixtures';

const STRICT_VISUAL = {
  maxDiffPixelRatio: 0.003,
};

async function stabilize(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe('trivia mobile visual guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are chromium-only.');

  test('trivia detail mobile - nav collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toHaveCount(0);

    await stabilize(page);
    await expect(page).toHaveScreenshot('trivia-detail-mobile-collapsed.png', STRICT_VISUAL);
  });

  test('trivia detail mobile - nav expanded', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();
    await page.getByTestId('trivia-mobile-qnav-trigger').click();

    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-close')).toBeVisible();

    await stabilize(page);
    await expect(page).toHaveScreenshot('trivia-detail-mobile-expanded.png', STRICT_VISUAL);
  });

  test('trivia detail tablet - nav behavior', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1112 });
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await expect(page.locator('.side')).toBeHidden();
    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();

    await stabilize(page);
    await expect(page).toHaveScreenshot('trivia-detail-tablet-collapsed.png', STRICT_VISUAL);
  });

  test('trivia detail mobile - question list panel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();
    await page.getByTestId('trivia-mobile-qnav-trigger').click();
    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toBeVisible();
    await expect(page.locator('#trivia-mobile-qnav-panel .side-item').first()).toBeVisible();

    await stabilize(page);
    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toHaveScreenshot('trivia-mobile-qnav-list-panel.png', STRICT_VISUAL);
  });
});
