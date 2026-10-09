import { test, expect } from './fixtures';
import { assertNoHorizontalOverflow } from './layout-assertions';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MIN_TAP_TARGET_PX = 24;

test.describe('interview question hub mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');

  test('topic and inline links meet the 24px tap-target minimum', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/javascript/interview-questions');
    await expect(page.locator('a.iq-topic-card__link').first()).toBeVisible();

    const violations = await page.locator('a.iq-topic-card__link, a.iq-inline-link').evaluateAll(
      (links, minimum) => links.flatMap((link, index) => {
        const rect = link.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return [];
        if (rect.height >= minimum && rect.width >= minimum) return [];
        const text = (link.textContent || '').trim().slice(0, 40);
        return [`${index}: "${text}" ${Math.round(rect.width)}x${Math.round(rect.height)}`];
      }),
      MIN_TAP_TARGET_PX,
    );
    expect(violations, 'every hub link is at least 24px tall and wide').toEqual([]);

    await assertNoHorizontalOverflow(page, '/javascript/interview-questions at 390px');
  });
});
