import { test, expect } from './fixtures';
import { BEHAVIORAL, PLAYBOOK, SYSTEM } from '../src/app/shared/guides/guide.registry';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 820, height: 1180 };
const DESKTOP_VIEWPORT = { width: 1600, height: 900 };

const prepPathSlugs = PLAYBOOK
  .map((entry) => entry.slug)
  .filter((slug) => slug.endsWith('-prep-path'));

const guideShellRoutes = [
  ...PLAYBOOK
    .filter((entry) => !entry.slug.endsWith('-prep-path'))
    .map((entry) => `/guides/interview-blueprint/${entry.slug}`),
  ...prepPathSlugs.map((slug) => `/guides/framework-prep/${slug}`),
  ...SYSTEM.map((entry) => `/guides/system-design-blueprint/${entry.slug}`),
  ...BEHAVIORAL.map((entry) => `/guides/behavioral/${entry.slug}`),
];

const indexRoutes = [
  '/guides/interview-blueprint',
  '/guides/framework-prep',
  '/guides/system-design-blueprint',
  '/guides/behavioral',
];

const masteryRoutes = prepPathSlugs.map((slug) => `/guides/framework-prep/${slug}/mastery`);

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

async function assertElementFitsWidth(locator: import('@playwright/test').Locator, label: string) {
  const metrics = await locator.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertDocumentNoOverflow(page: import('@playwright/test').Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, `${label} document overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertGuideShellMobileLayout(page: import('@playwright/test').Page, route: string) {
  await page.goto(route);

  const main = page.locator('.wrap > .main');
  await expect(main).toBeVisible();
  await expect(page.locator('.mobile-panels')).toBeVisible();
  await expect(page.locator('.left')).toBeHidden();
  await expect(page.locator('.toc')).toBeHidden();

  await stabilize(page);
  await assertElementFitsWidth(main, `${route} .main`);
  await assertDocumentNoOverflow(page, route);
}

async function measureMainGutters(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const main = document.querySelector('.wrap > .main') as HTMLElement | null;
    if (!main) return null;
    const rect = main.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      leftGap: Math.round(rect.left),
      rightGap: Math.round(window.innerWidth - rect.right),
    };
  });
}

async function measureWrapGutters(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const wrap = document.querySelector('.wrap') as HTMLElement | null;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    return {
      leftGap: Math.round(rect.left),
      rightGap: Math.round(window.innerWidth - rect.right),
      paddingLeft: Math.round(parseFloat(getComputedStyle(wrap).paddingLeft)),
      paddingRight: Math.round(parseFloat(getComputedStyle(wrap).paddingRight)),
    };
  });
}

test.describe('guide mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('guide detail routes stay mobile friendly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    for (const route of guideShellRoutes) {
      await assertGuideShellMobileLayout(page, route);
    }
  });

  test('guide detail tablet keeps comfortable width and gutters', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/guides/behavioral/fe-advanced');

    const main = page.locator('.wrap > .main');
    await expect(main).toBeVisible();
    await expect(page.locator('.mobile-panels')).toBeVisible();
    await expect(page.locator('.left')).toBeHidden();
    await expect(page.locator('.toc')).toBeHidden();

    await stabilize(page);
    await assertDocumentNoOverflow(page, 'tablet guide detail');

    const gutters = await measureMainGutters(page);
    expect(gutters).not.toBeNull();
    expect(gutters!.width, 'tablet guide main should not collapse to a narrow column').toBeGreaterThanOrEqual(680);
    expect(gutters!.leftGap, 'tablet guide main should keep left gutter').toBeGreaterThanOrEqual(18);
    expect(gutters!.rightGap, 'tablet guide main should keep right gutter').toBeGreaterThanOrEqual(18);
  });

  test('guide index and mastery routes stay mobile friendly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    for (const route of [...indexRoutes, ...masteryRoutes]) {
      await page.goto(route);
      await expect(page.locator('.wrap').first()).toBeVisible();
      await stabilize(page);
      await assertDocumentNoOverflow(page, route);
      await assertElementFitsWidth(page.locator('.wrap').first(), `${route} .wrap`);

      const gutters = await measureWrapGutters(page);
      expect(gutters).not.toBeNull();
      expect(gutters!.paddingLeft, `${route} should keep left padding`).toBeGreaterThanOrEqual(18);
      expect(gutters!.paddingRight, `${route} should keep right padding`).toBeGreaterThanOrEqual(18);
      expect(gutters!.leftGap, `${route} wrap should not hug the left viewport edge`).toBeGreaterThanOrEqual(0);
      expect(gutters!.rightGap, `${route} wrap should not hug the right viewport edge`).toBeGreaterThanOrEqual(0);
    }
  });

  test('desktop shared guide shell keeps rails visible', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/guides/system-design-blueprint/radio-framework');

    await expect(page.locator('.left')).toBeVisible();
    await expect(page.locator('.toc')).toBeVisible();
    await expect(page.locator('.mobile-panels')).toBeHidden();
  });
});
