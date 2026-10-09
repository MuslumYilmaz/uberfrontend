import { test, expect } from './fixtures';
import { assertFitsViewport, assertNoHorizontalOverflow } from './layout-assertions';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
];

test.describe('tradeoff list mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');

  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}px: hero, search and tech chips stay inside the viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/tradeoffs');
      await expect(page.locator('.tradeoff-card').first()).toBeVisible();
      await expect(page.locator('.chip-row--primary fa-chip').first()).toBeVisible();

      // The grid column must not grow to the nowrap chip row; the chips scroll
      // inside their own container instead of pushing the hero past the edge.
      await assertFitsViewport(page, 'header.tradeoff-hero', 'tradeoff hero', viewport.width);
      await assertFitsViewport(page, 'section.tradeoff-search', 'tradeoff search', viewport.width);
      await assertFitsViewport(page, '.chip-row-scroll', 'tech chip scroller', viewport.width);
      await assertFitsViewport(page, '.tradeoff-card', 'first tradeoff card', viewport.width);

      const chipsScroll = await page.locator('.chip-row-scroll').first().evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      );
      expect(chipsScroll, 'tech chips scroll inside their container').toBe(true);

      await assertNoHorizontalOverflow(page, `/tradeoffs at ${viewport.width}px`);
    });
  }
});
