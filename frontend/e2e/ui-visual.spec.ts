import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import type { Locator, Page } from '@playwright/test';
import path from 'node:path';
import { InterviewApiMock, seedAuthenticatedInterview, selectSetupChoice } from './interview-mocks';

const widths = [360, 390, 768, 834, 1366, 1440];
const routes = [
  ['home', '/', '[data-testid="showcase-hero-title"]'],
  ['login', '/auth/login', '[data-testid="login-page"]'],
  ['signup', '/auth/signup', 'form'],
  ['pricing', '/pricing', '.pricing-page'],
  ['coding-list', '/coding', '[data-testid="coding-list-page"]'],
  ['coding', '/javascript/coding/js-number-clamp', '[data-testid="coding-detail-page"]'],
  ['trivia-list', '/coding?kind=trivia', '[data-testid="coding-list-page"]'],
  ['trivia', '/javascript/trivia/js-event-loop', '[data-testid="trivia-detail-main"]'],
  ['system-design', '/system-design', '.sd-filter-bar'],
  ['guide', '/guides/interview-blueprint/intro', 'h1'],
  ['dashboard', '/dashboard', '[data-testid="dashboard-page"]'],
  ['profile', '/profile', '.profile-layout'],
] as const;

async function prepare(page: Page, authenticated: boolean) {
  await page.clock.setFixedTime(new Date('2026-10-01T10:00:00Z'));
  await page.addInitScript((signedIn) => {
    try {
      localStorage.setItem('fa:exp:assignment:hero_headline_cta_v1', 'control');
      localStorage.setItem('fa:exp:assignment:pricing_risk_reversal_placement_v1', 'top');
      if (signedIn) localStorage.setItem('fa:auth:session', '1');
    } catch { /* sandboxed preview */ }
  }, authenticated);
  const token = 'e2e-ui-visual';
  await installAuthMock(page, {
    token,
    user: buildMockUser({
      _id: 'e2e-ui-visual', username: 'visual_user', email: 'visual@example.com',
      createdAt: '2026-01-01T10:00:00Z',
    }),
  });
  if (authenticated) {
    await page.context().addCookies([{
      name: 'access_token', value: token,
      url: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || '4200'}`,
    }]);
  }
}

async function capture(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // A refreshed baseline must not bless a stale prerendered marketing shell
  // alongside the hydrated application header on a private route.
  await expect(page.locator('app-header, app-marketing-header'))
    .toHaveCount(/^(login|signup)-/.test(name) ? 0 : 1);
  await expect(page.locator('[data-testid="header-auth-pending"], [data-testid="marketing-header-auth-pending"]'))
    .toHaveCount(0);
  if (/^(coding-list|trivia-list)-/.test(name)) {
    await expect(page.getByTestId('coding-list-loading')).toHaveCount(0);
    await expect(page.locator('fa-question-row').first()).toBeVisible();
  }
  if (name.startsWith('system-design-')) {
    await expect(page.getByTestId('system-design-list-loading')).toHaveCount(0);
    await expect(page.locator('.sd-prompt-card').first()).toBeVisible();
  }
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}' });
  if (name.startsWith('interview-') || name.startsWith('system-design-')) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (process.env.UI_VISUAL_MEASUREMENTS === '1') {
    await page.screenshot({ animations: 'disabled' });
    const measurements = await page.locator('.p-dialog,.p-dialog-header,.p-dialog-footer,.p-multiselect-panel,.p-multiselect-overlay,.p-multiselect-header,.p-multiselect-filter-container,.p-multiselect-filter,.p-multiselect-item,.p-multiselect-option,.p-multiselect-header .p-checkbox').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { className: element.className, rect: rect.toJSON(), padding: style.padding, margin: style.margin, gap: style.gap, border: style.borderWidth, font: style.font, fontFamily: style.fontFamily, lineHeight: style.lineHeight };
    }));
    await test.info().attach(`${name}-geometry`, { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
    console.log(name, JSON.stringify(measurements));
  }
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled', maxDiffPixelRatio: 0.001, timeout: 30_000,
    mask: [
      page.locator('.monaco-editor .cursors-layer'), page.locator('[role="timer"]'),
      page.locator('.results-hero > div > p:not(.eyebrow)'),
    ],
  });
  if (process.env.UI_VISUAL_GALLERY_DIR) {
    await page.screenshot({ path: path.join(process.env.UI_VISUAL_GALLERY_DIR, `${name}.png`), animations: 'disabled', caret: 'hide' });
  }
}

async function positionOverlayControl(control: Locator) {
  // Auto-scrolling a long page can place the trigger near either viewport
  // edge, changing the overlay's direction without any UI change.
  await control.evaluate(element => {
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 120, behavior: 'instant' });
  });
  await expect.poll(async () => Math.round((await control.boundingBox())?.y ?? -1)).toBe(120);
}

test.describe('UI visual regression', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Reference images use Chromium.');
  test.use({ reducedMotion: 'reduce', colorScheme: 'dark' });

  test.beforeEach(async ({ page }) => {
    // Production bundles normally target the public API. Keep every request on
    // the local origin so the same mocked contracts and cookies apply in CI.
    await page.addInitScript(() => {
      (window as Window & { __FA_API_BASE__?: string }).__FA_API_BASE__ = window.location.origin;
    });
  });

  for (const width of widths) {
    for (const [name, route, ready] of routes) {
      test(`${name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await prepare(page, name === 'dashboard' || name === 'profile');
        await page.goto(route);
        await expect(page.locator(ready).first()).toBeVisible();
        if (name === 'coding' && width < 768) {
          await expect(page.getByTestId('coding-mobile-notice')).toBeVisible();
          await expect(page.getByTestId('coding-description-panel')).toBeVisible();
          await expect(page.getByRole('heading', { name: 'Clamp', exact: true })).toBeVisible();
          await expect(page.getByTestId('coding-workspace-panel')).toHaveCount(0);
          await expect(page.locator('app-monaco-editor')).toHaveCount(0);
        } else if (name === 'coding') {
          // SSR makes the page shell visible before deferred Monaco editors
          // replace their syntax-preview placeholders. Capture the usable UI.
          await expect(page.getByTestId('coding-workspace-panel').locator('.monaco-editor .view-lines:visible').first())
            .toContainText('export default function clamp', { timeout: 30_000 });
          await expect(page.getByTestId('coding-description-panel').locator('.monaco-editor .view-lines:visible').first())
            .toContainText('clamp(3', { timeout: 30_000 });
        }
        await capture(page, `${name}-${width}`);
      });
    }
    test(`select overlays at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, false);
      await page.goto('/system-design');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByTestId('system-design-list-loading')).toHaveCount(0);
      await expect(page.locator('.sd-prompt-card').first()).toBeVisible();
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}' });
      const level = page.getByRole('combobox', { name: 'Level', exact: true });
      await positionOverlayControl(level);
      await level.click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await capture(page, `select-open-${width}`);
      await level.press('Escape');
      await expect(level).toBeFocused();
      const tags = page.getByRole('combobox', { name: 'Tags', exact: true });
      await positionOverlayControl(tags);
      await tags.press('Space');
      const filter = page.getByLabel('Filter system design tags', { exact: true });
      await expect(filter).toBeVisible();
      await capture(page, `multiselect-open-${width}`);
      await filter.fill('no-such-tag-for-upgrade');
      await expect(page.getByText('No results found', { exact: true })).toBeVisible();
      await capture(page, `multiselect-empty-${width}`);
      await filter.press('Escape');
      await expect(page.getByRole('combobox', { name: 'Tags', exact: true })).toBeFocused();
    });
    test(`dialogs at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, true);
      await page.goto('/profile');
      await page.getByRole('button', { name: 'Security', exact: true }).click();
      await page.getByTestId('profile-change-password-open').click();
      await expect(page.getByTestId('profile-change-password-form')).toBeVisible();
      await capture(page, `profile-dialog-${width}`);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('profile-change-password-form')).toBeHidden();
      const reportBug = page.getByRole('button', { name: 'Report a bug', exact: true });
      if (!await reportBug.isVisible()) await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
      await reportBug.click();
      await expect(page.getByRole('heading', { name: 'Report a bug', exact: true })).toBeVisible();
      await capture(page, `bug-dialog-${width}`);
      await page.getByRole('textbox', { name: 'What went wrong?', exact: true }).fill('A synthetic UI verification note.');
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Report a bug', exact: true })).toBeHidden();
    });
    test(`interview lifecycle at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      // Freezing only the browser clock is insufficient: serverNow also moves
      // after each answer. Keep both aligned so 10:00 -> 9:59 cannot resize the timer.
      await page.clock.setFixedTime(new Date('2026-10-01T10:00:00Z'));
      const api = new InterviewApiMock({ freezeTimers: true });
      await seedAuthenticatedInterview(page, api);
      await page.goto('/interview');
      await expect(page.getByTestId('interview-setup')).toBeVisible();
      await capture(page, `interview-setup-${width}`);
      // New coding sessions require a desktop/tablet viewport; an existing
      // session can still be recovered and reviewed on a narrow screen.
      if (width < 768) {
        await expect(page.getByTestId('interview-start')).toBeDisabled();
        await page.setViewportSize({ width: 1366, height: 900 });
      }
      await selectSetupChoice(page, 'Level', 'Junior');
      await page.getByTestId('interview-start').click();
      await expect(page.locator('fieldset')).toBeVisible();
      await page.setViewportSize({ width, height: 900 });
      await capture(page, `interview-question-${width}`);
      for (let index = 0; index < 5; index++) {
        await page.locator('fieldset input[type="radio"]').first().check();
        await expect.poll(() => api.answerRequests.length).toBe(index + 1);
        await page.getByRole('button', { name: index < 4 ? 'Next' : 'Review answers', exact: true }).last().click();
      }
      await expect(page.getByTestId('submit-mcq')).toBeVisible();
      await capture(page, `interview-review-${width}`);
      await page.getByTestId('submit-mcq').click();
      await expect(page.getByTestId('start-coding')).toBeVisible();
      await capture(page, `interview-ready-${width}`);
      await page.getByTestId('start-coding').click();
      await expect(page.locator('.monaco-editor')).toBeVisible();
      await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
      await capture(page, `interview-coding-${width}`);
      await page.getByRole('button', { name: 'Run checks', exact: true }).click();
      await expect(page.getByText('1/1 checks passed')).toBeVisible();
      await page.getByTestId('submit-coding').click();
      await expect(page.getByTestId('interview-results')).toBeVisible();
      await capture(page, `interview-results-${width}`);
    });
  }
});
