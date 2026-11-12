import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

// The client's count, from the catalog: the prerendered page says "159 matches" for every technology until the
// browser filters, so the badge alone cannot tell a hydrated list from a stale one.
const JAVASCRIPT_CODING_TASKS = (
  JSON.parse(readFileSync(join(process.cwd(), '../cdn/questions/javascript/coding.json'), 'utf8')) as Array<{ type?: string }>
).filter((question) => question.type === 'coding').length;

// A signed-in visitor's background progress sync can fail (a 429 from its limiter, a 5xx, a dropped connection). Its
// retry timer must wait outside the Angular zone: one pending inside it keeps the app from turning stable, and
// hydration then never removes the prerendered markup. A filtered /coding list kept every server-rendered row (159
// rows under "96 matches") and other rows' framework chips. See AttemptInsightsService.scheduleSync.
test.use({ consoleErrorAllowlist: ['editor-assist\\/sync'] });

async function signInAsFreeUser(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-coding-list-free-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-coding-list-free-user',
    username: 'coding_list_free_user',
    email: 'coding-list-free@example.com',
    accessTier: 'free',
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
