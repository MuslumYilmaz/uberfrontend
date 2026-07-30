import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 834, height: 1112 };
const DESKTOP_VIEWPORT = { width: 1366, height: 900 };
const INFINITE_SCROLL_H1 = 'Infinite Scroll List System Design';
const OFFLINE_EMAIL_PATH = '/system-design/offline-email-client';
const OFFLINE_EMAIL_H1 = 'Gmail-Style Offline Email Client Frontend System Design';
const E2E_BASE_URL = (
  process.env.PLAYWRIGHT_BASE_URL
  || `http://${process.env.PLAYWRIGHT_HOST || '127.0.0.1'}:${process.env.PLAYWRIGHT_PORT || '4200'}`
).replace(/\/$/, '');

async function seedPremiumSession(page: import('@playwright/test').Page) {
  const token = `system-design-premium-${Date.now()}`;
  const user = buildMockUser({
    _id: 'system-design-premium-user',
    username: 'system_design_premium',
    email: 'system-design-premium@example.com',
    accessTier: 'premium',
  });
  await installAuthMock(page, { token, user });
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: E2E_BASE_URL,
  }]);
  await page.addInitScript(() => localStorage.setItem('fa:auth:session', '1'));
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

async function assertCenterLayoutNoOverflow(page: import('@playwright/test').Page) {
  await assertElementFitsWidth(page.locator('.sdl-center'), '.sdl-center');

  const offenders = await page.evaluate(() => {
    const selectors = ['.sd-section', '.sd-blocks', '.sd-columns', '.sd-column', '.sd-code', '.sd-table'];
    const list: Array<{ target: string; scrollWidth: number; clientWidth: number }> = [];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el, idx) => {
        const node = el as HTMLElement;
        if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) {
          list.push({
            target: `${selector}[${idx}]`,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
          });
        }
      });
    });
    return list;
  });

  expect(offenders, 'system design containers overflow horizontally').toEqual([]);
}

async function assertSystemDesignNoOverflow(page: import('@playwright/test').Page) {
  await assertDocumentNoOverflow(page);
  const lockedCount = await page.locator('.locked-card').count();
  if (lockedCount > 0) {
    await assertElementFitsWidth(page.locator('.locked-card').first(), '.locked-card');
    return;
  }
  await assertCenterLayoutNoOverflow(page);
}

async function assertSingleVisibleH1(
  page: import('@playwright/test').Page,
  expectedText: string,
  viewportWidth: number,
) {
  const headings = page.locator('h1');
  await expect(headings, `one H1 at ${viewportWidth}px`).toHaveCount(1);
  await expect(headings, `visible H1 at ${viewportWidth}px`).toBeVisible();
  await expect(headings).toHaveText(expectedText);
}

async function assertSemanticCodeIsSelectable(page: import('@playwright/test').Page) {
  const code = page.locator('pre.sd-code > code').filter({ hasText: 'type MailboxSnapshot' }).first();
  await expect(code).toBeVisible();
  await expect(page.locator('app-monaco-editor')).toHaveCount(0);

  const semantics = await code.evaluate((element) => ({
    tag: element.tagName,
    parentTag: element.parentElement?.tagName,
    userSelect: getComputedStyle(element).userSelect,
  }));
  expect(semantics).toEqual({
    tag: 'CODE',
    parentTag: 'PRE',
    userSelect: 'text',
  });

  const selectedText = await code.evaluate((element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
    const value = selection?.toString() || '';
    selection?.removeAllRanges();
    return value;
  });
  expect(selectedText).toContain('type MailboxSnapshot');
}

test.describe('system design mobile layout guardrail', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Layout guardrails are chromium-only.');
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('system design mobile - compact header and controls keep one visible H1', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await assertSingleVisibleH1(page, INFINITE_SCROLL_H1, MOBILE_VIEWPORT.width);
    await expect(page.getByTestId('sd-mobile-overview-trigger')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toBeVisible();
    await expect(page.locator('.sdl-left')).toBeVisible();
    await expect(page.getByTestId('system-design-report-issue-btn')).toBeVisible();
    await expect(page.locator('.sdl-left .title-meta')).toBeVisible();
    await expect(page.locator('.sdl-left .left-body .desc')).toBeVisible();
    await expect(page.locator('.sdl-right')).toBeHidden();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - fa-dialog closes with Escape and restores trigger focus', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    const trigger = page.getByTestId('sd-mobile-overview-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Question overview' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/fa-dialog/);
    await expect
      .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('sd-mobile-overview-panel')).toHaveCount(0);
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - toc panel navigates and closes', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await page.getByTestId('sd-mobile-toc-trigger').click();
    await expect(page.getByTestId('sd-mobile-toc-panel')).toBeVisible();

    const targets = page.locator('#sd-mobile-toc-panel .toc-item');
    const itemCount = await targets.count();
    expect(itemCount).toBeGreaterThan(1);
    await targets.nth(1).click();
    await expect(page.getByTestId('sd-mobile-toc-panel')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design tablet - compact header keeps one visible H1', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await assertSingleVisibleH1(page, INFINITE_SCROLL_H1, TABLET_VIEWPORT.width);
    await expect(page.getByTestId('sd-mobile-overview-trigger')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toBeVisible();
    await expect(page.locator('.sdl-left')).toBeVisible();
    await expect(page.getByTestId('system-design-report-issue-btn')).toBeVisible();
    await expect(page.locator('.sdl-left .title-meta')).toBeVisible();
    await expect(page.locator('.sdl-left .left-body .desc')).toBeVisible();
    await expect(page.locator('.sdl-right')).toBeHidden();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design desktop - rails preserved', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/system-design/infinite-scroll-list');

    await expect(page.locator('.sdl-left')).toBeVisible();
    await expect(page.locator('.sdl-right')).toBeVisible();
    await expect(page.getByTestId('sd-mobile-overview-trigger')).toBeHidden();
    await expect(page.getByTestId('sd-mobile-toc-trigger')).toBeHidden();

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('system design mobile - locked card fits width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/system-design/endless-short-video-feed');

    await expect(page.locator('.locked-card')).toBeVisible();
    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('AI agent run inspector - worked example table and trace code stay contained on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const response = await page.goto('/system-design/ai-agent-run-inspector');

    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('AI Agent Run Inspector Frontend System Design');
    await expect(page.locator('.locked-card')).toHaveCount(0);
    await expect(page.locator('.sd-table-scroll')).not.toHaveCount(0);
    await expect(page.locator('.sd-code')).not.toHaveCount(0);

    const workedExampleHeading = page.getByText('Worked example: follow one run through the reducer', { exact: true });
    await workedExampleHeading.scrollIntoViewIfNeeded();
    const workedExampleTable = page.locator('.sd-table').filter({ hasText: 'Event-by-event reconciliation' });
    const workedExampleCode = workedExampleHeading.locator(
      'xpath=following-sibling::pre[contains(@class, "sd-code")][1]',
    );

    await expect(workedExampleTable).toHaveCount(1);
    await expect(workedExampleCode).toHaveCount(1);
    const workedExampleTableMetrics = await workedExampleTable.locator('.sd-table-scroll').evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      overflowX: getComputedStyle(el).overflowX,
    }));
    expect(workedExampleTableMetrics.clientWidth, 'worked example table has a usable viewport').toBeGreaterThan(0);
    expect(workedExampleTableMetrics.scrollWidth, 'worked example table contains its wide columns').toBeGreaterThan(
      workedExampleTableMetrics.clientWidth,
    );
    expect(['auto', 'scroll'], 'worked example table scroll stays inside its container').toContain(
      workedExampleTableMetrics.overflowX,
    );
    await assertElementFitsWidth(workedExampleCode, 'worked example trace code');

    await stabilize(page);
    await assertSystemDesignNoOverflow(page);
  });

  test('offline email client - semantic code, table headers, and wide content stay contained at 320 and 390 pixels', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const response = await page.goto(OFFLINE_EMAIL_PATH);

      expect(response?.status()).toBe(200);
      await assertSingleVisibleH1(page, OFFLINE_EMAIL_H1, width);
      await expect(page.locator('.locked-card')).toHaveCount(0);

      const workedExampleHeading = page.getByText(
        'Worked example: the send succeeds and the response disappears',
        { exact: true },
      );
      const workedExampleTable = page.locator('.sd-table').filter({
        hasText: 'One reply across cache, outbox, and mailbox sync',
      });
      await expect(workedExampleHeading).toBeVisible();
      await expect(workedExampleTable).toHaveCount(1);
      await assertSemanticCodeIsSelectable(page);

      const semanticTable = workedExampleTable.locator('table');
      await expect(semanticTable.locator('caption')).toHaveText('One reply across cache, outbox, and mailbox sync');
      const headerScopes = await semanticTable.locator('thead th').evaluateAll(
        (headers) => headers.map((header) => header.getAttribute('scope')),
      );
      expect(headerScopes.length).toBeGreaterThan(0);
      expect(headerScopes.every((scope) => scope === 'col')).toBe(true);

      await workedExampleHeading.scrollIntoViewIfNeeded();
      const tableScroll = workedExampleTable.locator('.sd-table-scroll');
      const tableMetrics = await tableScroll.evaluate((el) => ({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        overflowX: getComputedStyle(el).overflowX,
      }));
      expect(tableMetrics.clientWidth, `worked example table has a viewport at ${width}px`).toBeGreaterThan(0);
      expect(tableMetrics.scrollWidth, `worked example table contains its columns at ${width}px`).toBeGreaterThan(
        tableMetrics.clientWidth,
      );
      expect(['auto', 'scroll']).toContain(tableMetrics.overflowX);

      await stabilize(page);
      await assertSystemDesignNoOverflow(page);
    }
  });

  test('premium Netflix and mock-design worked examples stay contained on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await seedPremiumSession(page);

    const cases = [
      {
        path: '/system-design/netflix-scale-expansion',
        title: 'Netflix Continue Watching Frontend System Design',
        workedExample: 'Worked example: stale progress and optimistic removal',
        table: 'One action through store and UI',
      },
      {
        path: '/system-design/ui-component-state-from-mock',
        title: 'UI Component and State Design From a Mock',
        workedExample: 'Worked example: background update during an unsent reply',
        table: 'One scenario through each state layer',
      },
    ];

    for (const entry of cases) {
      const response = await page.goto(entry.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(entry.title);
      await expect(page.locator('.locked-card')).toHaveCount(0);
      await expect(page.getByText(entry.workedExample, { exact: true })).toBeVisible();
      await expect(page.locator('.sd-table').filter({ hasText: entry.table })).toHaveCount(1);
      await expect(page.locator('.sd-code')).not.toHaveCount(0);

      await stabilize(page);
      await assertSystemDesignNoOverflow(page);
    }
  });
});
