import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };

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
}

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} should not overflow horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertFitsViewport(page: import('@playwright/test').Page, selector: string, label: string) {
  const locator = page.locator(selector).first();
  await expect(locator, `${label} should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should have a bounding box`).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0), `${label} should fit viewport`).toBeLessThanOrEqual(
    MOBILE_VIEWPORT.width + 1,
  );
}

async function assertRoadmapSwitcherAlignment(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => {
    const list = document.querySelector('.prep-switcher__list') as HTMLElement | null;
    const trigger = document.querySelector('.prep-switcher__trigger') as HTMLElement | null;
    const chevron = document.querySelector('.prep-switcher__chevron') as HTMLElement | null;

    if (!list || !trigger || !chevron) return null;

    const listRect = list.getBoundingClientRect();
    const lineStyles = window.getComputedStyle(list, '::before');
    const lineCenterX = listRect.left + Number.parseFloat(lineStyles.left || '0');
    const stepCenters = Array.from(list.querySelectorAll('.prep-switcher__step')).map((step) => {
      const rect = step.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });

    const triggerRect = trigger.getBoundingClientRect();
    const chevronRect = chevron.getBoundingClientRect();
    const chevronOffset = Math.abs(
      chevronRect.top + chevronRect.height / 2 - (triggerRect.top + triggerRect.height / 2),
    );

    const arrowOffsets = Array.from(list.querySelectorAll('.prep-switcher__link'))
      .map((link) => {
        const arrow = link.querySelector('.prep-switcher__arrow');
        if (!arrow) return null;
        const linkRect = link.getBoundingClientRect();
        const arrowRect = arrow.getBoundingClientRect();
        return Math.abs(arrowRect.top + arrowRect.height / 2 - (linkRect.top + linkRect.height / 2));
      })
      .filter((offset): offset is number => offset !== null);

    return {
      chevronOffset,
      lineCenterX,
      stepOffsets: stepCenters.map((center) => Math.abs(center - lineCenterX)),
      arrowOffsets,
    };
  });

  expect(metrics, 'roadmap switcher alignment metrics should exist').not.toBeNull();
  expect(metrics?.chevronOffset ?? 999, 'dropdown chevron should be vertically centered').toBeLessThanOrEqual(1);
  for (const offset of metrics?.stepOffsets ?? []) {
    expect(offset, 'timeline line should align with every step center').toBeLessThanOrEqual(0.75);
  }
  for (const offset of metrics?.arrowOffsets ?? []) {
    expect(offset, 'row arrow should be vertically centered').toBeLessThanOrEqual(1);
  }
}

test.describe('Essential 60 mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrail is chromium-only.');

  test('cards and roadmap switcher fit mobile width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/interview-questions/essential');
    await stabilize(page);

    await expect(page.getByRole('heading', { name: 'FrontendAtlas Essential 60' })).toBeVisible();
    await expect(page.getByTestId('prep-roadmap-switcher')).toBeVisible();

    await assertNoHorizontalOverflow(page, 'Essential 60 page');
    await assertFitsViewport(page, '.essential-card', 'first Essential 60 card');
    await assertFitsViewport(page, '.essential-card__chips', 'card badges');

    await page.getByTestId('prep-roadmap-switcher-trigger').click();
    await expect(page.getByTestId('prep-roadmap-switcher-panel')).toBeVisible();
    await assertFitsViewport(page, '[data-testid="prep-roadmap-switcher-panel"]', 'roadmap switcher panel');
    await assertRoadmapSwitcherAlignment(page);
    await assertNoHorizontalOverflow(page, 'Essential 60 page with roadmap panel open');
  });
});
