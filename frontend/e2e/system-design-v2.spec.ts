import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

const TOAST_PATH = '/system-design/notification-toast-system';
const AI_CHAT_PATH = '/system-design/ai-chat-textarea-design';
const AI_UX_PATH = '/system-design/ai-ux-considerations';
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1366, height: 900 },
  { width: 1440, height: 900 },
] as const;
const SERIOUS_IMPACTS = new Set(['serious', 'critical']);
const E2E_BASE_URL = (
  process.env.PLAYWRIGHT_BASE_URL
  || `http://${process.env.PLAYWRIGHT_HOST || '127.0.0.1'}:${process.env.PLAYWRIGHT_PORT || '4200'}`
).replace(/\/$/, '');
const SSR_ENABLED = (() => {
  if (process.env.PLAYWRIGHT_SSR === '1') return true;
  try {
    const { hostname } = new URL(E2E_BASE_URL);
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  } catch {
    return false;
  }
})();

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
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

async function openAllRadioSections(page: Page): Promise<void> {
  const sections = page.locator('details.sd-section');
  await expect(sections).toHaveCount(5);

  for (let index = 0; index < await sections.count(); index += 1) {
    const section = sections.nth(index);
    if (!(await section.evaluate((element: HTMLDetailsElement) => element.open))) {
      await section.locator(':scope > summary').click();
    }
  }

  await expect(page.locator('details.sd-section[open]')).toHaveCount(5);
}

async function expectNoSeriousAxeViolations(page: Page, include: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(include)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter((violation) =>
    SERIOUS_IMPACTS.has(String(violation.impact || '')),
  );
  expect(
    serious.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.slice(0, 3).map((node) => node.target),
    })),
  ).toEqual([]);
}

async function seedAuthenticatedSession(
  page: Page,
  accessTier: 'free' | 'premium',
): Promise<void> {
  const token = `system-design-v2-${accessTier}-${Date.now()}`;
  const user = buildMockUser({
    _id: `system-design-v2-${accessTier}-user`,
    username: `system_design_v2_${accessTier}`,
    email: `system-design-v2-${accessTier}@example.com`,
    accessTier,
  });
  await installAuthMock(page, { token, user });
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: E2E_BASE_URL,
  }]);
  await page.addInitScript(() => localStorage.setItem('fa:auth:session', '1'));
}

async function seedAuthenticatedInterviewSetup(page: Page, createBodies: unknown[]): Promise<void> {
  await seedAuthenticatedSession(page, 'free');

  await page.route('**/api/interviews**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }

    if (request.method() === 'GET' && url.pathname.endsWith('/api/interviews/availability')) {
      const quota = {
        remaining: 1,
        limit: 1,
        resetAt: null,
        unlimited: false,
      };
      const levels = [
        { value: 'junior', label: 'Junior' },
        { value: 'mid', label: 'Mid-level' },
        { value: 'senior', label: 'Senior' },
      ];
      const tracks = [
        { value: 'core-web', label: 'Core Web' },
        { value: 'react', label: 'React' },
        { value: 'angular', label: 'Angular' },
        { value: 'vue', label: 'Vue' },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          availability: {
            enabled: true,
            accessMode: 'public',
            unavailableReason: null,
            quota,
            quotas: { coding: quota, systemDesign: quota },
            formats: [
              { id: 'coding', available: true },
              { id: 'system-design', available: true },
            ],
            activeSession: null,
            lastResults: [],
            availability: levels.flatMap((level) => tracks.map((track) => ({
              level: level.value,
              track: track.value,
              format: 'coding',
              available: true,
            }))),
            systemDesignAvailability: levels.flatMap((level) => tracks.map((track) => ({
              level: level.value,
              track: track.value,
              format: 'system-design',
              available: true,
            }))),
            levels,
            tracks,
            minViewportWidth: 768,
            timing: {
              mcqSeconds: 600,
              codingReadySeconds: 300,
              systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
            },
          },
        }),
      });
      return;
    }

    if (request.method() === 'POST' && url.pathname.endsWith('/api/interviews')) {
      createBodies.push(request.postDataJSON());
      await route.fulfill({
        status: 500,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ error: 'Unexpected automatic session start.' }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ error: 'Unexpected interview API request.' }),
    });
  });
}

function normalizedRawText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

test.describe('System Design V2 acceptance', () => {
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('all pilots keep prompt, expanded RADIO answer, and diagrams contained at target widths', async ({ page, browserName }) => {
    test.setTimeout(120_000);
    test.skip(browserName !== 'chromium', 'Layout guardrails are Chromium-only.');
    await seedAuthenticatedSession(page, 'premium');

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const pilot of [
        { path: TOAST_PATH, level: 'Junior', time: '10 min', label: 'toast' },
        { path: AI_CHAT_PATH, level: 'Mid-level', time: '15 min', label: 'chat' },
        { path: AI_UX_PATH, level: 'Mid-level', time: '15 min', label: 'proposal' },
      ]) {
        const response = await page.goto(pilot.path);

        expect(response?.status()).toBe(200);
        await expect(page.getByTestId('sd-try-first')).toBeVisible();
        await expect(page.getByTestId('sd-try-first')).toContainText(pilot.level);
        await expect(page.getByTestId('sd-try-first')).toContainText(pilot.time);
        await openAllRadioSections(page);
        await expect(page.locator('.sd-figure img')).toHaveCount(2);

        await expectNoHorizontalOverflow(page, `${viewport.width}px ${pilot.label} pilot`);
      }
    }
  });

  test('URL-restored filters use AND dimensions, OR tags, debounce, and replace history', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(
      '/system-design?q=toast&level=junior&access=free&format=component&tag=accessibility&tag=streams',
    );

    const bank = page.getByTestId('system-design-bank');
    const cards = bank.locator('[data-testid^="system-design-prompt-card-"]');
    const search = page.getByLabel('Search', { exact: true });
    await expect(search).toHaveValue('toast');
    await expect(page.getByRole('combobox', { name: 'Level' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Access' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Format' })).toBeVisible();
    const tagCombobox = page.getByRole('combobox', { name: 'Tags' });
    await expect(tagCombobox).toBeAttached();
    await expect(tagCombobox).toHaveAttribute('aria-labelledby', 'system-design-tags-label');
    await expect(page.locator('fa-select').filter({ has: tagCombobox })).toBeVisible();
    await expect(bank.getByText('1 prompt shown', { exact: true })).toBeVisible();
    await expect(cards).toHaveCount(1);
    await expect(page.getByTestId('system-design-prompt-card-notification-toast-system')).toBeVisible();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(new URL(canonical || '', page.url()).pathname).toBe('/system-design');
    expect(new URL(canonical || '', page.url()).search).toBe('');

    const historyLength = await page.evaluate(() => window.history.length);
    const clearFilters = page.getByRole('button', { name: 'Clear filters' }).first();
    await clearFilters.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => new URL(page.url()).search).toBe('');
    await expect(cards.first()).toHaveAttribute(
      'data-testid',
      'system-design-prompt-card-notification-toast-system',
    );

    await search.focus();
    await page.keyboard.type('chat');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('chat');
    await expect(page.getByTestId('system-design-prompt-card-ai-chat-textarea-design')).toBeVisible();
    await expect(cards).toHaveCount(1);
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength);

    await page.setViewportSize({ width: 834, height: 1112 });
    await expect.poll(() => page.locator('.sd-filter-bar').evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    ))).toBe(2);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator('.sd-filter-bar').evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    ))).toBe(1);
  });

  test('native RADIO disclosures support keyboard, #answer history, and mobile TOC focus', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(TOAST_PATH);

    const sections = page.locator('details.sd-section');
    await expect(sections).toHaveCount(5);
    await expect(page.locator('details.sd-section[open]')).toHaveCount(0);

    const firstSummary = sections.nth(0).locator(':scope > summary');
    const secondSummary = sections.nth(1).locator(':scope > summary');
    await firstSummary.focus();
    await page.keyboard.press('Space');
    await expect(sections.nth(0)).toHaveAttribute('open', '');
    await secondSummary.focus();
    await page.keyboard.press('Enter');
    await expect(sections.nth(0)).toHaveAttribute('open', '');
    await expect(sections.nth(1)).toHaveAttribute('open', '');

    await page.goto(TOAST_PATH);
    await page.getByRole('button', { name: 'Start reference answer' }).click();
    await expect(page).toHaveURL(new RegExp(`${TOAST_PATH}#answer$`));
    await expect(page.locator('details.sd-section[open]')).toHaveCount(1);
    await expect(page.locator('details.sd-section').first()).toHaveAttribute('open', '');

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${TOAST_PATH}$`));
    await expect(page.locator('details.sd-section[open]')).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const tocHistoryLength = await page.evaluate(() => window.history.length);
    await page.getByTestId('sd-mobile-toc-trigger').click();
    await page.getByTestId('sd-mobile-toc-panel').getByRole('button', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(new RegExp(`${TOAST_PATH}#sec-A$`));
    await expect(page.locator('#sec-A')).toHaveAttribute('open', '');
    await expect(page.locator('#sec-A > summary')).toBeFocused();
    expect(await page.evaluate(() => window.history.length)).toBe(tocHistoryLength);

    await page.goto('/system-design');
    await page.goto(`${TOAST_PATH}#not-a-section`);
    await expect(page.locator('details.sd-section[open]')).toHaveCount(0);
  });

  test('mobile diagrams scroll inside a focused viewport and expose their text alternative on demand', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(TOAST_PATH);
    await openAllRadioSections(page);

    const viewport = page.locator('.sd-figure__viewport').first();
    const diagram = viewport.locator('img');
    await expect(viewport).toHaveAttribute('tabindex', '0');
    expect(await diagram.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(700);
    expect(await viewport.evaluate((element) => element.scrollWidth)).toBeGreaterThanOrEqual(700);
    await viewport.focus();
    await expect(viewport).toBeFocused();

    const fallback = page.locator('.sd-figure__fallback').first();
    await expect(fallback).not.toHaveAttribute('open', '');
    await fallback.locator(':scope > summary').click();
    await expect(fallback).toHaveAttribute('open', '');
    await expect(fallback).toContainText('global command');
    await expectNoHorizontalOverflow(page, '390px diagram viewport');
  });

  test('premium fragment cannot put the answer, diagrams, or guided CTA in the guest DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`${AI_UX_PATH}#answer`);

    await expect(page.locator('.locked-card')).toBeVisible();
    await expect(page.getByTestId('sd-locked-prompt-preview')).toBeVisible();
    await expect(page.getByTestId('sd-locked-prompt-preview')).toContainText('Mid-level');
    await expect(page.getByTestId('sd-locked-prompt-preview')).toContainText('15 min first pass');
    await expect(page.getByTestId('sd-locked-prompt-preview')).toContainText('customer-operations specialist');
    await expect(page.getByTestId('sd-locked-prompt-preview')).toContainText('Cancel is not rollback');
    await expect(page.locator('.sdl-root')).toHaveCount(0);
    await expect(page.getByTestId('sd-try-first')).toHaveCount(0);
    await expect(page.locator('details.sd-section')).toHaveCount(0);
    await expect(page.locator('img[src*="proposal-execution-boundary.svg"]')).toHaveCount(0);
    await expect(page.locator('img[src*="cancel-late-result-rollback.svg"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Practice this exact case' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start reference answer' })).toHaveCount(0);
    await expect(page.getByText('Must cover', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Need a hint? Three decisions to make', { exact: true })).toHaveCount(0);
  });

  test('authenticated premium user receives the complete AI proposal case without a guided CTA', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await seedAuthenticatedSession(page, 'premium');
    await page.goto(AI_UX_PATH);

    await expect(page.getByRole('heading', {
      level: 1,
      name: 'Design an AI-Assisted Bulk Edit Review Flow',
    })).toBeVisible();
    await expect(page.getByTestId('sd-try-first')).toContainText('Mid-level');
    await expect(page.getByTestId('sd-try-first')).toContainText('15 min');
    await expect(page.locator('details.sd-section')).toHaveCount(5);
    await expect(page.locator('details.sd-section[open]')).toHaveCount(0);
    await openAllRadioSections(page);
    await expect(page.locator('.sd-figure img')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Practice this exact case' })).toHaveCount(0);
  });

  test('exact guided CTA reaches a pinned setup without starting a session', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    const createBodies: unknown[] = [];
    await seedAuthenticatedInterviewSetup(page, createBodies);
    await page.goto(TOAST_PATH);

    await page.getByRole('link', { name: 'Practice this exact case' }).click();
    await expect(page.getByTestId('interview-setup')).toBeVisible();
    await expect(page.getByTestId('interview-targeted-case')).toContainText('Design a Toast Notification System');
    await expect(page.locator('input[name="interview-format"][value="system-design"]')).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Interview level' })).toBeDisabled();
    await expect(page.getByText('10 minutes guided system design')).toBeVisible();

    const query = new URL(page.url()).searchParams;
    expect(query.get('format')).toBe('system-design');
    expect(query.get('level')).toBe('junior');
    expect(query.get('sourceQuestionId')).toBe('notification-toast-system');
    expect(query.get('src')).toBe('system_design_detail');
    expect(createBodies).toEqual([]);

    await page.getByRole('button', { name: 'Choose another case' }).click();
    await expect(page.getByTestId('interview-targeted-case')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Interview level' })).toBeEnabled();
    await expect.poll(() => new URL(page.url()).searchParams.has('sourceQuestionId')).toBe(false);
    expect(createBodies).toEqual([]);
  });

  test('list and all three pilots have no serious or critical axe violations', async ({ page }) => {
    test.setTimeout(90_000);
    await seedAuthenticatedSession(page, 'premium');

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/system-design');
    await expectNoSeriousAxeViolations(page, 'main');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(TOAST_PATH);
    await openAllRadioSections(page);
    await expectNoSeriousAxeViolations(page, '.sdl-root');

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(AI_CHAT_PATH);
    await openAllRadioSections(page);
    await expectNoSeriousAxeViolations(page, '.sdl-root');

    await page.goto(AI_UX_PATH);
    await openAllRadioSections(page);
    await expectNoSeriousAxeViolations(page, '.sdl-root');
  });

  test('raw prerender keeps the free answer and diagrams but excludes premium answer assets', async ({ request }) => {
    test.skip(!SSR_ENABLED, 'Raw HTML contract requires prerender/SSR output (set PLAYWRIGHT_SSR=1).');

    const freeResponse = await request.get(`${E2E_BASE_URL}${TOAST_PATH}`);
    const premiumResponse = await request.get(`${E2E_BASE_URL}${AI_UX_PATH}`);
    expect(freeResponse.status()).toBe(200);
    expect(premiumResponse.status()).toBe(200);

    const freeHtml = await freeResponse.text();
    const premiumHtml = await premiumResponse.text();
    const freeText = normalizedRawText(freeHtml);
    const premiumText = normalizedRawText(premiumHtml);

    expect(freeText).toContain(
      'manual dismiss and timeout both request remove',
    );
    expect(freeHtml).toContain('toast-command-lifecycle.svg');
    expect(freeHtml).toContain('toast-dismiss-timeout-race.svg');

    expect(premiumText).toContain('customer-operations specialist');
    expect(premiumText).toContain('cancel is not rollback');
    expect(premiumText).not.toContain('generatedproposalcontent');
    expect(premiumHtml).not.toContain('proposal-execution-boundary.svg');
    expect(premiumHtml).not.toContain('cancel-late-result-rollback.svg');
    expect(premiumHtml).not.toMatch(/<details\b[^>]*\bsd-section\b/i);
  });
});
