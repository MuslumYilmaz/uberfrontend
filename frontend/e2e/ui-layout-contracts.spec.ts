import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const TRIVIA_EVENT_LOOP_PATH = '/javascript/trivia/js-event-loop';
const SYSTEM_DESIGN_PATH = '/system-design/dashboard-widgets-draggable-resizable';

const TRIVIA_VIEWPORTS = [
  ['mobile', { width: 390, height: 844 }],
  ['tablet', { width: 834, height: 1112 }],
] as const;

const SYSTEM_DESIGN_VIEWPORTS = [
  ['mobile', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 900 }],
] as const;

async function stabilizeLayout(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function expectNoDocumentHorizontalOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(
    metrics.documentScrollWidth,
    `${label}: document must not overflow horizontally`,
  ).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
  expect(
    metrics.bodyScrollWidth,
    `${label}: body must not overflow horizontally`,
  ).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
}

async function expectTriviaContentOwnsVerticalScroll(page: Page, label: string): Promise<void> {
  const experienceSlot = page.getByTestId('javascript-event-loop-experience-slot');
  await expect(experienceSlot).toBeVisible();
  // The lab is deferred on viewport. Scrolling its real scroll owner into view
  // also verifies the hydrated, production-SSR interaction rather than the
  // placeholder captured by the screenshot baseline.
  await experienceSlot.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('javascript-event-loop-experience')).toBeVisible({ timeout: 30_000 });

  const metrics = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>('[data-testid="trivia-detail-main"]');
    const scrollingElement = document.scrollingElement;
    if (!main || !scrollingElement) return null;

    return {
      documentClientHeight: document.documentElement.clientHeight,
      documentScrollHeight: scrollingElement.scrollHeight,
      mainClientHeight: main.clientHeight,
      mainScrollHeight: main.scrollHeight,
      mainClientWidth: main.clientWidth,
      mainScrollWidth: main.scrollWidth,
      mainOverflowY: getComputedStyle(main).overflowY,
    };
  });

  expect(metrics, `${label}: trivia scroll metrics should be available`).not.toBeNull();
  const layout = metrics!;
  expect(
    layout.mainScrollHeight,
    `${label}: trivia content panel should retain its own vertical scroll`,
  ).toBeGreaterThan(layout.mainClientHeight + 1);
  expect(
    layout.mainOverflowY,
    `${label}: trivia content panel should be the vertical scroll owner`,
  ).toMatch(/^(auto|scroll)$/);
  expect(
    layout.mainScrollWidth,
    `${label}: trivia content panel must not overflow horizontally`,
  ).toBeLessThanOrEqual(layout.mainClientWidth + 1);
  expect(
    layout.documentScrollHeight,
    `${label}: document must not expose a second vertical scroll range`,
  ).toBeLessThanOrEqual(layout.documentClientHeight + 1);

  await page.evaluate(() => window.scrollTo(0, Number.MAX_SAFE_INTEGER));
  await expect.poll(
    () => page.evaluate(() => window.scrollY),
    { message: `${label}: document should remain at its only scroll position` },
  ).toBeLessThanOrEqual(1);
}

async function expectSystemDesignContentFillsCenterColumn(page: Page, label: string): Promise<void> {
  const layout = await page.evaluate(() => {
    const center = document.querySelector<HTMLElement>('.sdl-center');
    const tryFirst = document.querySelector<HTMLElement>('[data-testid="sd-try-first"]');
    if (!center || !tryFirst) return null;

    const centerBounds = center.getBoundingClientRect();
    const tryFirstBounds = tryFirst.getBoundingClientRect();
    const sections = Array.from(document.querySelectorAll<HTMLElement>('details.sd-section')).map((section) => {
      const summary = section.querySelector<HTMLElement>(':scope > .sd-section__summary');
      const chevron = section.querySelector<HTMLElement>('.sd-section__chevron');
      if (!summary || !chevron) return null;

      const sectionBounds = section.getBoundingClientRect();
      const summaryBounds = summary.getBoundingClientRect();
      const chevronBounds = chevron.getBoundingClientRect();
      const styles = getComputedStyle(section);
      const contentLeft = sectionBounds.left
        + Number.parseFloat(styles.borderLeftWidth || '0')
        + Number.parseFloat(styles.paddingLeft || '0');
      const contentRight = sectionBounds.right
        - Number.parseFloat(styles.borderRightWidth || '0')
        - Number.parseFloat(styles.paddingRight || '0');

      return {
        sectionLeft: sectionBounds.left,
        sectionRight: sectionBounds.right,
        summaryLeft: summaryBounds.left,
        summaryRight: summaryBounds.right,
        chevronRight: chevronBounds.right,
        contentLeft,
        contentRight,
      };
    });

    return {
      centerLeft: centerBounds.left,
      centerRight: centerBounds.right,
      tryFirstLeft: tryFirstBounds.left,
      tryFirstRight: tryFirstBounds.right,
      sections,
    };
  });

  expect(layout, `${label}: system-design center content should be available`).not.toBeNull();
  const geometry = layout!;
  expect(
    Math.abs(geometry.tryFirstLeft - geometry.centerLeft),
    `${label}: Try first must align with the center column`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(geometry.tryFirstRight - geometry.centerRight),
    `${label}: Try first must fill the center column`,
  ).toBeLessThanOrEqual(1);
  expect(geometry.sections, `${label}: expected all five RADIO sections`).toHaveLength(5);

  for (const section of geometry.sections) {
    expect(section, `${label}: section summary must exist`).not.toBeNull();
    const item = section!;
    expect(
      Math.abs(item.sectionLeft - geometry.centerLeft),
      `${label}: section must start at the center column edge`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(item.sectionRight - geometry.centerRight),
      `${label}: section must end at the center column edge`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(item.summaryLeft - item.contentLeft),
      `${label}: summary must start at its section content edge`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(item.summaryRight - item.contentRight),
      `${label}: summary must fill its section content width`,
    ).toBeLessThanOrEqual(1);
    expect(
      item.chevronRight,
      `${label}: summary chevron must remain at the right edge`,
    ).toBeGreaterThanOrEqual(item.contentRight - 16);
    expect(
      item.chevronRight,
      `${label}: summary chevron must not extend past the right edge`,
    ).toBeLessThanOrEqual(item.contentRight + 1);
  }
}

test.describe('UI layout contracts', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'UI regression runs in Chromium.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });

  test.beforeEach(async ({ page }) => {
    // The production bundle normally targets the public API. Keeping requests
    // on the static test origin makes this suite use the same deterministic
    // mocked contracts as the screenshot job.
    await page.addInitScript(() => {
      (window as Window & { __FA_API_BASE__?: string }).__FA_API_BASE__ = window.location.origin;
    });
  });

  for (const [viewportName, viewport] of TRIVIA_VIEWPORTS) {
    test(`trivia content owns vertical scrolling at ${viewportName} width`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(TRIVIA_EVENT_LOOP_PATH);
      await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
      await stabilizeLayout(page);
      await expectNoDocumentHorizontalOverflow(page, `Trivia ${viewportName}`);
      await expectTriviaContentOwnsVerticalScroll(page, `Trivia ${viewportName}`);
    });
  }

  for (const [viewportName, viewport] of SYSTEM_DESIGN_VIEWPORTS) {
    test(`system design cards and accordions fill the center column at ${viewportName} width`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(SYSTEM_DESIGN_PATH);
      await expect(page.getByTestId('sd-try-first')).toBeVisible();
      await stabilizeLayout(page);
      await expectNoDocumentHorizontalOverflow(page, `System design ${viewportName}`);
      await expectSystemDesignContentFillsCenterColumn(page, `System design ${viewportName}`);
    });
  }
});
