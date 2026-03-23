import { test, expect } from './fixtures';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 834, height: 1112 };

const HIGH_RISK_ROUTES = [
  '/javascript/trivia/js-event-loop',
  '/angular/trivia/angular-lifecycle-constructor-oninit-afterviewinit-dom',
  '/html/trivia/html-dom',
  '/html/trivia/html-div-vs-span',
  '/react/trivia/react-conditional-rendering',
  '/react/trivia/react-state-vs-props',
  '/javascript/trivia/js-promises-basics',
  '/css/trivia/css-flexbox-basics',
];

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

async function assertDocumentNoOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth, 'document overflows horizontally').toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertMainStackNoOverflow(page: import('@playwright/test').Page) {
  const mainStack = page.locator('.main-stack');
  await expect(mainStack).toBeVisible();
  await assertElementFitsWidth(mainStack, '.main-stack');
}

async function assertBlocksNoOverflow(page: import('@playwright/test').Page) {
  const offenders = await page.evaluate(() => {
    const list: Array<{ target: string; scrollWidth: number; clientWidth: number }> = [];
    document.querySelectorAll('.blocks').forEach((blocks, idx) => {
      const target = `.blocks[${idx}]`;
      if (blocks.clientWidth > 0 && blocks.scrollWidth > blocks.clientWidth + 1) {
        list.push({ target, scrollWidth: blocks.scrollWidth, clientWidth: blocks.clientWidth });
      }
      blocks.querySelectorAll(':scope > *').forEach((child, childIdx) => {
        if (child.clientWidth > 0 && child.scrollWidth > child.clientWidth + 1) {
          list.push({
            target: `${target} > *[${childIdx}]`,
            scrollWidth: child.scrollWidth,
            clientWidth: child.clientWidth,
          });
        }
      });
    });
    return list;
  });
  expect(offenders, 'answer blocks overflow horizontally').toEqual([]);
}

async function assertContentNoOverflow(page: import('@playwright/test').Page) {
  const offenders = await page.evaluate(() => {
    const list: Array<{ target: string; scrollWidth: number; clientWidth: number }> = [];
    document.querySelectorAll('.card-body .content').forEach((content, idx) => {
      if (content.clientWidth > 0 && content.scrollWidth > content.clientWidth + 1) {
        list.push({
          target: `.card-body .content[${idx}]`,
          scrollWidth: content.scrollWidth,
          clientWidth: content.clientWidth,
        });
      }
    });
    return list;
  });
  expect(offenders, 'content blocks overflow horizontally').toEqual([]);
}

async function assertNoTriviaOverflow(page: import('@playwright/test').Page) {
  await assertDocumentNoOverflow(page);
  const mainCount = await page.locator('.main-stack').count();
  if (mainCount === 0) {
    const lockedCount = await page.locator('.locked-card').count();
    if (lockedCount > 0) {
      await assertElementFitsWidth(page.locator('.locked-card').first(), '.locked-card');
    }
    return;
  }
  await assertMainStackNoOverflow(page);
  await assertBlocksNoOverflow(page);
  await assertContentNoOverflow(page);
}

async function assertMobilePracticeFooterFits(page: import('@playwright/test').Page) {
  const footer = page.getByTestId('practice-footer');
  await expect(footer).toBeVisible();
  await expect(page.getByTestId('footer-left')).toBeVisible();
  await expect(page.getByTestId('footer-prev')).toBeVisible();
  await expect(page.getByTestId('footer-progress')).toBeVisible();
  await expect(page.getByTestId('footer-next')).toBeVisible();
  await expect(page.getByTestId('footer-submit')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="practice-footer"]') as HTMLElement | null;
    const progress = document.querySelector('[data-testid="footer-progress"]') as HTMLElement | null;
    const targets = [
      '[data-testid="footer-left"]',
      '[data-testid="footer-prev"]',
      '[data-testid="footer-progress"]',
      '[data-testid="footer-next"]',
      '[data-testid="footer-submit"]',
    ];

    if (!footer || !progress) return null;

    const footerRect = footer.getBoundingClientRect();
    const outside = targets.some((selector) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return true;
      const rect = el.getBoundingClientRect();
      return rect.left < footerRect.left - 1
        || rect.right > footerRect.right + 1
        || rect.top < footerRect.top - 1
        || rect.bottom > footerRect.bottom + 1;
    });

    return {
      footerHeight: Math.round(footerRect.height),
      footerScrollWidth: footer.scrollWidth,
      footerClientWidth: footer.clientWidth,
      progressHeight: Math.round(progress.getBoundingClientRect().height),
      progressScrollWidth: progress.scrollWidth,
      progressClientWidth: progress.clientWidth,
      outside,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics!.footerHeight, 'mobile practice footer should stay compact').toBeLessThanOrEqual(64);
  expect(metrics!.footerScrollWidth, 'mobile practice footer should not overflow horizontally').toBeLessThanOrEqual(metrics!.footerClientWidth + 1);
  expect(metrics!.progressHeight, 'footer progress should stay on a single compact row').toBeLessThanOrEqual(40);
  expect(metrics!.progressScrollWidth, 'footer progress should fit without clipping').toBeLessThanOrEqual(metrics!.progressClientWidth + 1);
  expect(metrics!.outside, 'mobile footer controls should stay inside the footer bounds').toBe(false);
}

test.describe('trivia mobile visual guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('trivia detail mobile - nav collapsed', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toHaveCount(0);

    await stabilize(page);
    await assertNoTriviaOverflow(page);
  });

  test('trivia detail mobile - nav expanded', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();
    await page.getByTestId('trivia-mobile-qnav-trigger').click();

    await expect(page.getByTestId('trivia-mobile-qnav-panel')).toBeVisible();
    await expect(page.getByTestId('trivia-mobile-qnav-close')).toBeVisible();

    await stabilize(page);
    await assertNoTriviaOverflow(page);
  });

  test('trivia detail tablet - nav behavior', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/react/trivia/react-conditional-rendering');

    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await expect(page.locator('.side')).toBeHidden();
    await expect(page.getByTestId('trivia-mobile-qnav-trigger')).toBeVisible();

    await stabilize(page);
    await assertNoTriviaOverflow(page);
  });

  test('trivia list mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/coding?kind=trivia');
    await expect(page.getByTestId('coding-list-page')).toBeVisible();
    await expect(page.locator('[data-testid^=\"question-card-\"]').first()).toBeVisible();

    await stabilize(page);
    await assertDocumentNoOverflow(page);
  });

  test('trivia detail mobile - table fit width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/javascript/trivia/js-event-loop');

    const table = page.locator('.table-scroll').first();
    await table.scrollIntoViewIfNeeded();
    await expect(table).toBeVisible();
    await assertElementFitsWidth(table, '.table-scroll (mobile)');

    await stabilize(page);
    await assertNoTriviaOverflow(page);
  });

  test('trivia detail tablet - table fit width', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/javascript/trivia/js-event-loop');

    const table = page.locator('.table-scroll').first();
    await table.scrollIntoViewIfNeeded();
    await expect(table).toBeVisible();
    await assertElementFitsWidth(table, '.table-scroll (tablet)');

    await stabilize(page);
    await assertNoTriviaOverflow(page);
  });

  test('trivia detail mobile - high risk route sweep has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    for (const route of HIGH_RISK_ROUTES) {
      await page.goto(route);
      await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
      await stabilize(page);
      await assertNoTriviaOverflow(page);
    }
  });

  test('trivia detail mobile - footer stays compact and readable', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/javascript/trivia/js-event-loop');

    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await stabilize(page);
    await assertMobilePracticeFooterFits(page);
  });

  test('trivia detail mobile - footer progress updates on next and prev', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/javascript/trivia/js-event-loop');

    const progress = page.getByTestId('footer-progress');
    const initialUrl = page.url();
    const initialText = (await progress.textContent())?.trim() ?? '';
    const initialMatch = initialText.match(/^(\d+)\s*\/\s*(\d+)$/);
    expect(initialMatch, `unexpected initial footer progress: ${initialText}`).not.toBeNull();

    const initialIndex = Number(initialMatch![1]);
    const total = Number(initialMatch![2]);

    await page.getByTestId('footer-next').click();
    await expect(page).not.toHaveURL(initialUrl);
    await expect(progress).toHaveText(`${initialIndex + 1} / ${total}`);

    await page.getByTestId('footer-prev').click();
    await expect(page).toHaveURL(initialUrl);
    await expect(progress).toHaveText(`${initialIndex} / ${total}`);
  });
});
