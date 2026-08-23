import { test, expect } from './fixtures';

const SMALL_MOBILE_VIEWPORT = { width: 360, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 834, height: 1112 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };
const LARGE_DESKTOP_VIEWPORT = { width: 1440, height: 900 };

async function installTurnstileLayoutStub(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    let sequence = 0;
    (window as any).turnstile = {
      render(container: string | HTMLElement, options: Record<string, unknown>) {
        const element = typeof container === 'string'
          ? document.querySelector<HTMLElement>(container)
          : container;
        const widgetId = `layout-turnstile-${++sequence}`;
        if (element) {
          element.dataset['turnstileStub'] = 'ready';
          element.dataset['turnstileSize'] = String(options['size'] || '');
          const frame = document.createElement('iframe');
          frame.title = 'Turnstile layout test';
          frame.style.display = 'block';
          frame.style.width = '100%';
          frame.style.minWidth = '300px';
          frame.style.maxWidth = '100%';
          frame.style.border = '0';
          element.append(frame);
        }
        window.setTimeout(() => (options['callback'] as ((token: string) => void) | undefined)?.(`layout-token-${sequence}`), 0);
        return widgetId;
      },
      reset() {},
      remove() {},
    };
  });
}

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

async function assertContactChallengeLayout(page: import('@playwright/test').Page, label: string) {
  const contact = page.locator('[data-load="contact"]');
  await contact.scrollIntoViewIfNeeded();
  const verification = page.getByTestId('showcase-contact-verification');
  await expect(verification).toBeVisible();
  await expect(verification.locator('[data-turnstile-stub="ready"]')).toHaveAttribute(
    'data-turnstile-size',
    'flexible',
  );
  await assertLocatorFitsWidth(
    verification.locator('app-turnstile-challenge, [data-turnstile-stub="ready"], iframe'),
    `${label} Turnstile challenge`,
  );
  await assertElementsStayInside(verification, '.contact-form', `${label} Turnstile challenge`);
}

async function assertBugReportChallengeLayout(page: import('@playwright/test').Page, label: string) {
  await page.evaluate(() => {
    const root = document.querySelector('app-root');
    const app = (window as any).ng?.getComponent?.(root) as {
      bugReport?: { open: (context: { source: string; url: string }) => void };
    } | undefined;
    if (!app?.bugReport) throw new Error('Angular bug-report service is unavailable in E2E.');
    app.bugReport.open({ source: 'turnstile-layout-e2e', url: window.location.href });
    (window as any).ng?.applyChanges?.(app);
  });

  const dialog = page.locator('.bug-dialog.p-dialog');
  await expect(dialog).toBeVisible();
  const challenge = dialog.locator('.bug-challenge');
  await expect(challenge.locator('[data-turnstile-stub="ready"]')).toHaveAttribute(
    'data-turnstile-size',
    'flexible',
  );
  await assertLocatorFitsWidth(
    challenge.locator('app-turnstile-challenge, [data-turnstile-stub="ready"], iframe'),
    `${label} bug-report Turnstile challenge`,
  );
  await assertElementsStayInside(challenge, '.bug-dialog__panel', `${label} bug-report challenge`);
}

async function assertMobileDemoControlsAreOmitted(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('.demo-picker')).toHaveCount(0);
  await expect(page.locator('.demo-choice-list')).toHaveCount(0);
  await expect(page.locator('[data-testid^="showcase-demo-tab-"]')).toHaveCount(0);
  await expect(page.locator('.demo-meta')).toHaveCount(0);
  await expect(page.locator('#demo-pane')).toHaveCount(0);
}

async function assertMobileConversionFitsViewport(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  await page.getByTestId('showcase-trust-section').scrollIntoViewIfNeeded();

  const sticky = page.getByTestId('conversion-mobile-sticky');
  await expect(sticky).toBeVisible();

  const metrics = await sticky.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: style.overflowY,
    };
  });

  expect(metrics.top, `${label} sticky top`).toBeGreaterThanOrEqual(-1);
  expect(metrics.bottom, `${label} sticky bottom`).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.height, `${label} sticky height`).toBeLessThanOrEqual(181);
  expect(metrics.clientHeight, `${label} sticky usable viewport height`).toBeLessThanOrEqual(
    metrics.viewportHeight - 48 + 1,
  );
  expect(metrics.overflowY, `${label} sticky overflow behavior`).toMatch(/auto|scroll/);

  const links = sticky.locator('.conversion-sticky__actions a');
  await expect(links).toHaveCount(2);
  await assertLocatorFitsWidth(links, `${label} sticky action`);
  await assertElementsStayInside(links, '.conversion-sticky__actions', `${label} sticky actions`);
}

test.describe('showcase mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrail is chromium-only.');

  for (const viewport of [SMALL_MOBILE_VIEWPORT, MOBILE_VIEWPORT]) {
    test(`mobile ${viewport.width}px: sections reflow without broken labels`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await installTurnstileLayoutStub(page);
      await page.goto('/');

      await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
      await page.getByTestId('showcase-demo-mobile-guard').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('showcase-demo-mobile-guard')).toBeVisible();
      await assertMobileDemoControlsAreOmitted(page);
      await expect(page.getByTestId('showcase-demo-mobile-guard-open')).toHaveAttribute(
        'href',
        '/coding',
      );
      await expect(page.getByTestId('showcase-demo-mobile-guard-browse')).toHaveAttribute(
        'href',
        '/interview-questions',
      );
      await expect(page.getByTestId('showcase-demo-open-live')).toHaveClass(/hidden/);

      await stabilize(page);
      await assertTrustAndCompanyLayout(page, 1, `showcase mobile ${viewport.width}px`);
      await assertMobileConversionFitsViewport(page, `showcase mobile ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase mobile ${viewport.width}px`);
      await assertLocatorFitsWidth(page.locator('.showcase-hero .shell'), 'hero shell');
      await assertLocatorFitsWidth(page.locator('.demo-mobile-guard-card'), 'mobile guard card');
      await assertLocatorFitsWidth(page.locator('.trivia-preview-card'), 'trivia preview card');
      await assertLocatorFitsWidth(page.locator('.system-preview-card'), 'system preview card');
      await assertContactChallengeLayout(page, `showcase mobile ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase mobile ${viewport.width}px contact`);
      await assertBugReportChallengeLayout(page, `showcase mobile ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase mobile ${viewport.width}px bug report`);
    });
  }

  test('tablet: coding workspace remains enabled', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await installTurnstileLayoutStub(page);
    await page.goto('/');

    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('#demo-pane')).toBeVisible();
    await expect(page.locator('.demo-picker')).toBeVisible();
    await expect(page.locator('.demo-picker__featured')).toBeVisible();
    await expect(page.locator('[data-testid^="showcase-demo-tab-"]')).toHaveCount(4);
    await expect(page.locator('.demo-meta')).toBeVisible();
    await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

    await stabilize(page);
    await assertTrustAndCompanyLayout(page, 2, 'showcase tablet');
    await assertNoHorizontalOverflow(page, 'showcase tablet');
    await assertLocatorFitsWidth(page.locator('.demo-frame'), 'demo frame');
    await assertContactChallengeLayout(page, 'showcase tablet');
    await assertNoHorizontalOverflow(page, 'showcase tablet contact');
  });

  for (const viewport of [DESKTOP_VIEWPORT, LARGE_DESKTOP_VIEWPORT]) {
    test(`desktop ${viewport.width}px: existing full demo frame stays available`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await installTurnstileLayoutStub(page);
      await page.goto('/');

      await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
      await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
      await expect(page.locator('#demo-pane')).toBeVisible();
      await expect(page.locator('.demo-picker')).toBeVisible();
      await expect(page.locator('.demo-meta')).toBeVisible();
      await expect(page.getByTestId('showcase-demo-open-live')).toBeVisible();

      await stabilize(page);
      await assertTrustAndCompanyLayout(page, 2, `showcase desktop ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase desktop ${viewport.width}px`);
      await assertContactChallengeLayout(page, `showcase desktop ${viewport.width}px`);
      await assertNoHorizontalOverflow(page, `showcase desktop ${viewport.width}px contact`);
    });
  }

  test('767/768px: the mobile demo DOM switches exactly at the supported boundary', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 900 });
    await page.goto('/');

    await page.getByTestId('showcase-demo-mobile-guard').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toBeVisible();
    await assertMobileDemoControlsAreOmitted(page);

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByTestId('showcase-demo-mobile-guard')).toHaveCount(0);
    await expect(page.locator('.demo-picker')).toBeVisible();
    await expect(page.locator('.demo-meta')).toBeVisible();
    await expect(page.locator('#demo-pane')).toBeVisible();
  });

  test('short mobile viewport: sticky shortcuts stay contained and become internally scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 120 });
    await page.goto('/');

    await assertMobileConversionFitsViewport(page, 'showcase short mobile');

    const metrics = await page.getByTestId('conversion-mobile-sticky').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(metrics.scrollHeight, 'short sticky content should scroll inside its viewport cap').toBeGreaterThan(
      metrics.clientHeight,
    );
  });
});
