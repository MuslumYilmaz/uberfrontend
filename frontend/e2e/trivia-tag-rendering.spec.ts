import { test, expect } from './fixtures';

test('html trivia keeps list tags visible in quick answer text', async ({ page }) => {
  await page.goto('/html/trivia/html-ol-ul-dl-difference');

  const quickAnswerCard = page
    .locator('section.card')
    .filter({ has: page.locator('.card-head', { hasText: 'Quick Answer' }) })
    .first();

  await expect(quickAnswerCard).toBeVisible();

  const quickAnswerText = await quickAnswerCard.locator('.content').innerText();
  expect(quickAnswerText).toContain('<ol>');
  expect(quickAnswerText).toContain('<ul>');
  expect(quickAnswerText).toContain('<dl>');
});
