import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { seedIndexedDbRecord } from './helpers';

// The client's count, from the catalogs: the prerendered page counts every technology until the browser filters,
// so the badge alone cannot tell a hydrated list from a stale one. /coding lists the debugging tasks with the coding
// tasks.
const readJavascriptCatalog = (file: string) =>
  JSON.parse(readFileSync(join(process.cwd(), '../cdn/questions/javascript', file), 'utf8')) as Array<{ type?: string }>;
const JAVASCRIPT_CODING_TASKS = readJavascriptCatalog('coding.json').filter((question) => question.type === 'coding').length
  + readJavascriptCatalog('debug.json').length;

// A signed-in visitor's background progress sync can fail (a 429 from its limiter, a 5xx, a dropped connection). Its
// retry timer must wait outside the Angular zone: one pending inside it keeps the app from turning stable, and
// hydration then never removes the prerendered markup. A filtered /coding list kept every server-rendered row (159
// rows under "96 matches") and other rows' framework chips. See AttemptInsightsService.scheduleSync.
test.use({ consoleErrorAllowlist: ['editor-assist\\/sync'] });

async function signInAsFreeUser(page: Page, baseURL: string, solvedQuestionIds: string[] = []): Promise<void> {
  const token = `e2e-coding-list-free-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-coding-list-free-user',
    username: 'coding_list_free_user',
    email: 'coding-list-free@example.com',
    accessTier: 'free',
    solvedQuestionIds,
  });

  await installAuthMock(page, { token, user });
  await page.context().addCookies([{ name: 'access_token', value: encodeURIComponent(token), url: baseURL }]);
  const loginStatus = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'coding_list_free_user', password: 'e2e-password' }),
    });
    return response.status;
  });
  expect(loginStatus).toBe(200);
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

test('a filtered coding list shows only its rows for a signed-in visitor whose progress sync fails', async ({ page, baseURL }) => {
  await page.goto('/coding');
  await signInAsFreeUser(page, baseURL!);
  // Registered after the fixture's 200 stub, so it wins: the sync never reaches a server and retries later.
  await page.route(/\/api\/editor-assist\/sync(?:\?.*)?$/, (route) => route.abort('failed'));

  await page.goto('/coding?tech=javascript');

  const results = page.getByTestId('coding-list-results');
  const expected = JAVASCRIPT_CODING_TASKS;
  expect(expected).toBeGreaterThan(0);
  await expect(results.locator('.fa-count-badge')).toHaveText(new RegExp(`^\\s*${expected} matches\\s*$`));

  const rows = results.locator('fa-question-row');
  await expect(rows).toHaveCount(expected, { timeout: 15_000 });
  const ids = await rows.locator('[data-testid^="question-card-"]').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-testid')),
  );
  expect(new Set(ids).size).toBe(expected);
  // JavaScript tasks have no framework versions, so no row may carry a React, Angular or Vue chip.
  await expect(results.locator('a[href^="/javascript/"] .fa-question-row__variant')).toHaveCount(0);
});

// A draft lives in this browser's IndexedDB only. The list reads it after the first render, so the prerendered HTML
// hydrates unchanged (the fixture fails on a hydration error) and the Continue card and the In progress mark follow.
test('a signed-in visitor continues their newest draft and hides what they solved', async ({ page, baseURL }) => {
  const savedAt = new Date().toISOString();
  await page.goto('/robots.txt');
  await seedIndexedDbRecord(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    key: 'v2:code:js2:js-number-clamp@e2e',
    value: JSON.stringify({
      js: {
        code: 'export default function clamp(v, lo) { return lo; }',
        baseline: 'export default function clamp() {}',
        updatedAt: savedAt,
      },
      lastLang: 'js',
      version: 'v2',
      updatedAt: savedAt,
    }),
  });
  await page.goto('/coding');
  await signInAsFreeUser(page, baseURL!, ['js-debounce']);
  await page.goto('/coding');

  const card = page.getByTestId('coding-continue-card');
  await expect(card).toContainText('Clamp');
  await expect(card).toContainText('Not run yet');
  await expect(card.getByTestId('coding-continue-link')).toHaveAttribute('href', '/javascript/coding/js-number-clamp');
  await expect(page.locator('[data-testid="question-card-js-number-clamp"] .fa-question-row__status')).toHaveClass(/is-in-progress/);
  await expect(page.getByTestId('coding-progress-stats')).toHaveText('1 solved');

  await expect(page.locator('[data-testid="question-card-js-debounce"]')).toHaveCount(1);
  await page.getByTestId('coding-list-hide-solved').click();
  await expect(page.locator('[data-testid="question-card-js-debounce"]')).toHaveCount(0);
  await expect(page.getByTestId('coding-active-filter-progress')).toContainText('Not solved');
});
