import { expect, type Page } from '@playwright/test';

// Shared mobile layout assertions. Document-level overflow checks miss content
// that an ancestor clips (`main { overflow-x: clip }`), so prefer the
// element-level check for layout guardrails.

export async function assertNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} should not overflow horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

export async function assertFitsViewport(
  page: Page,
  selector: string,
  label: string,
  viewportWidth: number,
): Promise<void> {
  const locator = page.locator(selector).first();
  await expect(locator, `${label} should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should have a bounding box`).not.toBeNull();
  expect(box?.x ?? 0, `${label} should start inside the viewport`).toBeGreaterThanOrEqual(-1);
  expect((box?.x ?? 0) + (box?.width ?? 0), `${label} should fit the ${viewportWidth}px viewport`).toBeLessThanOrEqual(
    viewportWidth + 1,
  );
}
