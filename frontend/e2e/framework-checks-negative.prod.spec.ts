import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

// Fully checked framework tasks must not pass what does not meet their requirements: each starter, the wrong
// solutions agents wrote in the 2026-11-10 persona round, which passed the old one-check tasks, and official
// solutions the checks caught out before they were fixed. Each case names the checks its bugs must fail.
type Framework = 'react' | 'angular' | 'vue';
type WrongCase = { framework: Framework; id: string; premium?: boolean; fixture?: string; fails: string[] };

const ENTRY_FILE: Record<Framework, string> = {
  react: 'src/App.tsx',
  angular: 'src/app/app.component.ts',
  vue: 'src/App.vue',
};
const FULLY_CHECKED: Array<[Framework, string, 'premium'?]> = [
  ['react', 'react-counter'],
  ['react', 'react-todo-list'],
  ['react', 'react-autocomplete-search-starter'],
  ['react', 'react-snake-game'],
  ['react', 'react-fetch-list-states'],
  ['react', 'react-vanilla-dropdown-port'],
  ['angular', 'angular-counter-starter'],
  ['angular', 'angular-todo-list-starter'],
  ['angular', 'angular-autocomplete-search-starter'],
  ['angular', 'angular-snake-game'],
  ['vue', 'vue-counter'],
  ['vue', 'vue-todo-list'],
  ['vue', 'vue-autocomplete-search'],
  ['vue', 'vue-snake-game'],
  ['react', 'react-tabs-switcher', 'premium'],
  ['react', 'react-accordion-faq', 'premium'],
  ['react', 'react-contact-form-starter', 'premium'],
  ['react', 'react-debounced-search', 'premium'],
  ['angular', 'angular-tabs-switcher', 'premium'],
  ['angular', 'angular-faq-accordion', 'premium'],
  ['angular', 'angular-contact-form-starter', 'premium'],
  ['angular', 'angular-debounced-search', 'premium'],
  ['vue', 'vue-tabs-switcher', 'premium'],
  ['vue', 'vue-accordion-faq', 'premium'],
  ['vue', 'vue-contact-form-starter', 'premium'],
  ['vue', 'vue-debounced-search', 'premium'],
  ['react', 'react-progress-bar-thresholds', 'premium'],
  ['react', 'react-chips-input-autocomplete', 'premium'],
  ['react', 'react-nested-checkboxes', 'premium'],
  ['react', 'react-multi-step-signup', 'premium'],
  ['angular', 'angular-progress-bar-thresholds', 'premium'],
  ['angular', 'angular-chips-input-autocomplete', 'premium'],
  ['angular', 'angular-nested-checkboxes', 'premium'],
  ['angular', 'angular-multi-step-form-starter', 'premium'],
  ['vue', 'vue-progress-bar-thresholds', 'premium'],
  ['vue', 'vue-chips-input-autocomplete', 'premium'],
  ['vue', 'vue-nested-checkboxes', 'premium'],
  ['vue', 'vue-multi-step-form', 'premium'],
  ['react', 'react-pagination-table', 'premium'],
  ['react', 'react-nested-comments', 'premium'],
  ['react', 'react-filterable-user-list', 'premium'],
  ['react', 'react-theme-toggle', 'premium'],
  ['angular', 'angular-pagination-table', 'premium'],
  ['angular', 'angular-nested-comments', 'premium'],
  ['angular', 'angular-filterable-user-list', 'premium'],
  ['angular', 'angular-theme-toggle', 'premium'],
  ['vue', 'vue-pagination-table', 'premium'],
  ['vue', 'vue-nested-comments', 'premium'],
  ['vue', 'vue-filterable-user-list', 'premium'],
  ['vue', 'vue-theme-toggle', 'premium'],
  ['react', 'react-shopping-cart', 'premium'],
  ['react', 'react-transfer-list', 'premium'],
  ['angular', 'angular-shopping-cart-mini', 'premium'],
  ['angular', 'angular-transfer-list', 'premium'],
  ['vue', 'vue-shopping-cart', 'premium'],
  ['vue', 'vue-transfer-list', 'premium'],
  ['react', 'react-like-button', 'premium'],
  ['react', 'react-dynamic-counter-buttons', 'premium'],
  ['react', 'react-image-slider', 'premium'],
  ['react', 'react-dynamic-table', 'premium'],
  ['react', 'react-tictactoe', 'premium'],
  ['react', 'react-debug-double-render', 'premium'],
  ['react', 'react-chat-streaming-ui', 'premium'],
  ['angular', 'angular-like-button', 'premium'],
  ['angular', 'angular-dynamic-counter-buttons', 'premium'],
  ['angular', 'angular-image-slider-starter', 'premium'],
  ['angular', 'angular-dynamic-table-starter', 'premium'],
  ['angular', 'angular-tictactoe-starter', 'premium'],
  ['angular', 'angular-input-output-two-way', 'premium'],
  ['vue', 'vue-like-button', 'premium'],
  ['vue', 'vue-dynamic-counter-buttons', 'premium'],
  ['vue', 'vue-image-slider', 'premium'],
  ['vue', 'vue-dynamic-table', 'premium'],
  ['vue', 'vue-tictactoe', 'premium'],
];
const WRONG_SOLUTIONS: WrongCase[] = [
  { framework: 'react', id: 'react-todo-list', fixture: 'react-todo-wrong.tsx', fails: ['todo-toggle', 'todo-remove', 'todo-clear-completed'] },
  { framework: 'react', id: 'react-todo-list', fixture: 'react-todo-partial.tsx', fails: ['todo-toggle', 'todo-remove', 'todo-clear-completed'] },
  { framework: 'angular', id: 'angular-todo-list-starter', fixture: 'angular-todo-broken.ts', fails: ['todo-add', 'todo-toggle', 'todo-remove'] },
  { framework: 'angular', id: 'angular-todo-list-starter', fixture: 'angular-todo-buggy.ts', fails: ['todo-add', 'todo-ignore-empty', 'todo-ignore-whitespace', 'todo-remove'] },
  { framework: 'vue', id: 'vue-todo-list', fixture: 'vue-todo-first-pass.vue', fails: ['todo-add', 'todo-ignore-whitespace', 'todo-remove'] },
  { framework: 'vue', id: 'vue-todo-list', fixture: 'vue-todo-clear-bug.vue', fails: ['todo-clear-completed'] },
  { framework: 'react', id: 'react-autocomplete-search-starter', fixture: 'react-autocomplete-unguarded.tsx', fails: ['autocomplete-stale-response-ignored'] },
  { framework: 'react', id: 'react-autocomplete-search-starter', fixture: 'react-autocomplete-debounce-only.tsx', fails: ['autocomplete-stale-response-ignored'] },
  {
    framework: 'vue',
    id: 'vue-autocomplete-search',
    fixture: 'vue-autocomplete-first-pass.vue',
    fails: ['autocomplete-selects-option', 'autocomplete-arrows-wrap', 'autocomplete-enter-selects', 'autocomplete-stale-ignored'],
  },
  { framework: 'vue', id: 'vue-debounced-search', premium: true, fixture: 'vue-debounced-search-no-stale-guard.vue', fails: ['debounced-search-stale'] },
];

const catalogs = new Map<Framework, Array<{ id: string; frameworkTests?: Array<{ id: string; name: string }> }>>();
function checksOf(framework: Framework, id: string): Array<{ id: string; name: string }> {
  if (!catalogs.has(framework)) {
    catalogs.set(framework, JSON.parse(readFileSync(join(process.cwd(), `../cdn/questions/${framework}/coding.json`), 'utf8')));
  }
  const checks = catalogs.get(framework)!.find((question) => question.id === id)?.frameworkTests ?? [];
  if (!checks.length) throw new Error(`${framework}/${id} has no checks`);
  return checks;
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-negative-premium-${Date.now()}-${Math.random()}`;
  const user = buildMockUser({
    _id: 'e2e-negative-premium-user',
    username: 'negative_premium_user',
    email: 'negative-premium@example.com',
    accessTier: 'premium',
  });
  await installAuthMock(page, { token, user });
  await page.context().addCookies([{ name: 'access_token', value: encodeURIComponent(token), url: baseURL }]);
  await page.goto('/robots.txt');
  const status = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'negative_premium_user', password: 'e2e-password' }),
    });
    return response.status;
  });
  if (status !== 200) throw new Error(`Premium auth mock login failed with ${status}`);
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

async function loadEntryFile(page: Page, filePath: string, code: string): Promise<void> {
  await setMonacoModelValue(page, filePath, code);
  await expect.poll(() => getMonacoModelValue(page, filePath)).toBe(code);
  // Let the panel persist the draft before the run reads it.
  await page.waitForTimeout(300);
}

async function runChecks(page: Page, expectedCount: number): Promise<Array<{ name: string; passed: boolean }>> {
  // The prerendered button is visible before its client click handler is ready.
  await page.waitForFunction(() => ((window as any).monaco?.editor?.getModels?.() || []).length > 0, undefined, { timeout: 30_000 });
  const runButton = page.getByTestId('framework-run-checks');
  await runButton.click();
  const rows = page.getByTestId('framework-check-result');
  await expect(rows).toHaveCount(expectedCount, { timeout: 90_000 });
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
  return rows.evaluateAll((elements) => elements.map((element) => ({
    name: element.querySelector('.framework-check-result__name')?.textContent?.trim() ?? '',
    passed: element.classList.contains('is-pass'),
  })));
}

// angular-todo-broken.ts keeps its todos in a signal that the starter's template iterates as an array, so the preview
// logs Angular's error on every render.
test.use({ consoleErrorAllowlist: ['ERROR TypeError: newCollection\\[Symbol\\.iterator\\] is not a function'] });

test.describe('Fully checked framework tasks fail what misses their requirements', () => {
  test.describe.configure({ mode: 'parallel', timeout: 150_000 });

  for (const [framework, id, access] of FULLY_CHECKED) {
    test(`${framework}/${id}: the starter does not pass`, async ({ page, baseURL }) => {
      const checks = checksOf(framework, id);
      if (access === 'premium') await seedPremiumSession(page, baseURL!);
      await page.goto(`/${framework}/coding/${id}`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();

      const results = await runChecks(page, checks.length);
      expect(results.filter((result) => result.passed).length).toBeLessThan(checks.length);
    });
  }

  for (const wrong of WRONG_SOLUTIONS) {
    test(`${wrong.framework}/${wrong.id}: ${wrong.fixture} fails ${wrong.fails.join(', ')}`, async ({ page, baseURL }) => {
      const checks = checksOf(wrong.framework, wrong.id);
      const code = readFileSync(join(process.cwd(), 'e2e/framework-wrong-solutions', wrong.fixture!), 'utf8');
      if (wrong.premium) await seedPremiumSession(page, baseURL!);
      await page.goto(`/${wrong.framework}/coding/${wrong.id}`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await page.waitForFunction(() => ((window as any).monaco?.editor?.getModels?.() || []).length > 0, undefined, { timeout: 30_000 });
      await loadEntryFile(page, ENTRY_FILE[wrong.framework], code);

      const results = await runChecks(page, checks.length);
      const failed = results.filter((result) => !result.passed).map((result) => result.name);
      const expected = wrong.fails.map((checkId) => {
        const check = checks.find((entry) => entry.id === checkId);
        if (!check) throw new Error(`${wrong.id} has no check ${checkId}`);
        return check.name;
      });
      expect(failed).toEqual(expect.arrayContaining(expected));
    });
  }
});
