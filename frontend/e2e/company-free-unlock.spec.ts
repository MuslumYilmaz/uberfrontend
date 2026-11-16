import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

// A visitor on a company guide picks a locked question, chooses to open it free, signs up and lands back on the guide
// with that question open. The account and the unlock are answered from memory; nothing reaches a backend.

const LISTS = JSON.parse(readFileSync(resolve(__dirname, '../../cdn/questions/company-question-lists.json'), 'utf8')).companies;
const ROW = LISTS.elevenlabs.questions.find((question: { unlockable: boolean }) => question.unlockable);

test('a visitor opens one locked question free by signing up, and lands back on it', async ({ page }) => {
  const user = buildMockUser({ _id: 'e2e-unlock-user', username: 'unlock_user', email: 'unlock@example.com' });
  await installAuthMock(page, {
    token: `e2e-token-unlock-${Date.now()}`,
    user,
    validSignup: { email: user.email, username: user.username, password: 'secret123' },
  });
  await page.route('**/api/billing/checkout/config*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  const spends: unknown[] = [];
  await page.route('**/api/users/me/free-unlock', async (route) => {
    const body = route.request().postDataJSON();
    spends.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ freeUnlock: { ...body, practiceId: null, unlockedAt: new Date().toISOString() } }),
    });
  });

  await page.goto('/companies/elevenlabs/preview');
  const row = page.locator(`#elevenlabs-question-${ROW.id}`);
  await expect(row).toHaveClass(/cq-row--locked/);
  await row.locator('.cq-row__locked').click();
  await row.getByRole('link', { name: 'Open this one free with an account' }).click();

  await expect(page).toHaveURL(/\/auth\/signup\?redirectTo=%2Fcompanies%2Felevenlabs%2Fpreview/);
  await page.getByTestId('signup-email').fill(user.email);
  await page.getByTestId('signup-username').fill(user.username);
  await page.getByTestId('signup-password').fill('secret123');
  await page.getByTestId('signup-confirm').fill('secret123');
  await page.getByTestId('signup-submit').click();

  await expect(page).toHaveURL(/\/companies\/elevenlabs\/preview/);
  await expect(row.getByTestId('company-question-unlocked')).toBeVisible();
  await expect(row).not.toHaveClass(/cq-row--locked/);
  await expect(row.locator('.premium-locked')).toHaveCount(0);
  expect(spends).toEqual([{ company: 'elevenlabs', questionId: ROW.id }]);
  // The remembered choice is used once and then forgotten.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fa:free-unlock-intent'))).toBeNull();
});
