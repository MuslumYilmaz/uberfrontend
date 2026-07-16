import { test, expect } from './fixtures';

const SMALL_MOBILE_VIEWPORT = { width: 360, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 834, height: 1112 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

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
  expect(metrics.scrollWidth, `${label} should not overflow horizontally`).toBeLessThanOrEqual(
    metrics.clientWidth + 1,
  );
}

async function assertLocatorFitsWidth(locator: import('@playwright/test').Locator, label: string) {
  const metrics = await locator.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element, index) => ({
        index,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      })),
  );

  for (const metric of metrics) {
    expect(
      metric.scrollWidth,
      `${label} ${metric.index + 1} should fit width`,
    ).toBeLessThanOrEqual(metric.clientWidth + 1);
  }
}

async function assertElementsStayInside(
  locator: import('@playwright/test').Locator,
  containerSelector: string,
  label: string,
) {
  const violations = await locator.evaluateAll((elements, selector) => {
    return elements.flatMap((element, index) => {
      const target = element as HTMLElement;
      const container = target.closest(selector) as HTMLElement | null;
      if (!container) return [`${index + 1}: missing container ${selector}`];

      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const outside =
        targetRect.left < containerRect.left - 1 ||
        targetRect.right > containerRect.right + 1 ||
        targetRect.top < containerRect.top - 1 ||
        targetRect.bottom > containerRect.bottom + 1;

      return outside
        ? [`${index + 1}: ${targetRect.left},${targetRect.top},${targetRect.right},${targetRect.bottom}`]
        : [];
    });
  }, containerSelector);

  expect(violations, `${label} should stay inside ${containerSelector}`).toEqual([]);
}

async function assertWholeLabelWrapping(locator: import('@playwright/test').Locator, label: string) {
  const styles = await locator.evaluateAll((elements) =>
    elements.map((element, index) => {
      const style = window.getComputedStyle(element);
      return {
        index,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
      };
    }),
  );

  for (const style of styles) {
    expect(style.whiteSpace, `${label} ${style.index + 1} should wrap as a whole item`).toBe('nowrap');
    expect(style.wordBreak, `${label} ${style.index + 1} should not split words`).not.toBe('break-all');
    expect(style.overflowWrap, `${label} ${style.index + 1} should not split words`).not.toBe('anywhere');
  }
}

async function gridColumnCount(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((element) =>
    window.getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
  );
}

async function assertTrustAndCompanyLayout(
  page: import('@playwright/test').Page,
  expectedCompanyColumns: number,
  label: string,
) {
  const trust = page.getByTestId('showcase-trust-section');
  await trust.scrollIntoViewIfNeeded();
  await expect(trust).toBeVisible();
  await assertLocatorFitsWidth(
    trust.locator('.trust-shell, .trust-copy, .trust-milestone, .trust-proof-strip, .trust-proof-item'),
    `${label} trust content`,
  );
  await assertElementsStayInside(
    trust.locator('.trust-copy, .trust-milestone, .trust-proof-strip, .trust-proof-item'),
    '.trust-shell',
    `${label} trust content`,
  );

  const company = page.getByTestId('showcase-company-section');
  await company.scrollIntoViewIfNeeded();
  await expect(company).toBeVisible();
  await expect(page.getByTestId('showcase-company-card')).toHaveCount(4);

  const companyGrid = page.getByTestId('showcase-company-grid');
  expect(await gridColumnCount(companyGrid), `${label} company grid columns`).toBe(expectedCompanyColumns);
  await assertLocatorFitsWidth(
    company.locator(
      '.company-grid, .company-card, .company-card__top, .company-meta, .company-card__footer, .company-count, .company-link',
    ),
    `${label} company content`,
  );
  await assertElementsStayInside(
    company.locator('.company-card__top, .company-meta, .company-card__footer, .company-count, .company-link'),
    '.company-card',
    `${label} company card content`,
  );
  await assertWholeLabelWrapping(
    company.locator('.company-browse-link, .company-count, .company-link'),
    `${label} company labels`,
  );
}

test.describe('showcase mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrail is chromium-only.');

  for (const viewport of [SMALL_MOBILE_VIEWPORT, MOBILE_VIEWPORT]) {
    test(`mobile ${viewport.width}px: sections reflow without broken labels`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
      await page.getByTestId('showcase-demo-mobile-guard').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('showcase-demo-mobile-guard')).toBeVisible();
      await expect(page.locator('#demo-pane')).toHaveCount(0);
      await expect(page.getByTestId('showcase-demo-mobile-guard-open')).toHaveAttribute(
        'href',
        '/react/coding/react-counter',
      );
      await expect(page.getByTestId('showcase-demo-open-live')).toHaveClass(/hidden/);

      await stabilize(page);
      await assertTrustAndCompanyLayout(page, 1, `showcase mobile ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase mobile ${viewport.width}px`);
      await assertLocatorFitsWidth(page.locator('.showcase-hero .shell'), 'hero shell');
      await assertLocatorFitsWidth(page.locator('.demo-mobile-guard-card'), 'mobile guard card');
      await assertLocatorFitsWidth(page.locator('.trivia-preview-card'), 'trivia preview card');
      await assertLocatorFitsWidth(page.locator('.system-preview-card'), 'system preview card');
    });
  }

  test('tablet: coding workspace remains enabled', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

    await stabilize(page);
    await assertTrustAndCompanyLayout(page, 2, 'showcase tablet');
    await assertNoHorizontalOverflow(page, 'showcase tablet');
    await assertLocatorFitsWidth(page.locator('.demo-frame'), 'demo frame');
  });

  test('desktop: existing full demo frame stays available', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

    await stabilize(page);
    await assertTrustAndCompanyLayout(page, 2, 'showcase desktop');
    await assertNoHorizontalOverflow(page, 'showcase desktop');
  });
});
