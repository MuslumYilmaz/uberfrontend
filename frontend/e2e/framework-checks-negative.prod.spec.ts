import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

// Fully checked framework tasks must not pass what does not meet their requirements: each starter, and the wrong
// solutions agents wrote in the 2026-11-10 persona round, which passed the old one-check tasks. Each case names the
// checks its bugs must fail.
type Framework = 'react' | 'angular' | 'vue';
type WrongCase = { framework: Framework; id: string; fixture?: string; fails: string[] };

const ENTRY_FILE: Record<Framework, string> = {
  react: 'src/App.tsx',
  angular: 'src/app/app.component.ts',
  vue: 'src/App.vue',
};
const FULLY_CHECKED: Array<[Framework, string]> = [
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

  for (const [framework, id] of FULLY_CHECKED) {
    test(`${framework}/${id}: the starter does not pass`, async ({ page }) => {
      const checks = checksOf(framework, id);
      await page.goto(`/${framework}/coding/${id}`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();

      const results = await runChecks(page, checks.length);
      expect(results.filter((result) => result.passed).length).toBeLessThan(checks.length);
    });
  }

  for (const wrong of WRONG_SOLUTIONS) {
    test(`${wrong.framework}/${wrong.id}: ${wrong.fixture} fails ${wrong.fails.join(', ')}`, async ({ page }) => {
      const checks = checksOf(wrong.framework, wrong.id);
      const code = readFileSync(join(process.cwd(), 'e2e/framework-wrong-solutions', wrong.fixture!), 'utf8');
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
