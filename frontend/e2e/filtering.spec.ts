import { test, expect } from './fixtures';
import { JS_QUESTION, WEB_QUESTION } from './helpers';

test('coding list filters sync to URL and persist on reload + back', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.getByTestId('filter-tech-javascript').click();
  await page.getByTestId('filter-difficulty-easy').click();
  await page.getByTestId('filter-importance-low').click();
  await page.getByTestId('coding-list-search').fill(JS_QUESTION.title);

  await expect(page).toHaveURL(/\/coding/);
  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/imp=low/);
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId('filter-difficulty-easy').locator('input')).toBeChecked();
  await expect(page.getByTestId('filter-importance-low').locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  await page.getByTestId(`question-card-${JS_QUESTION.id}`).click();
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();

  await page.goBack();
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/imp=low/);
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId('filter-difficulty-easy').locator('input')).toBeChecked();
  await expect(page.getByTestId('filter-importance-low').locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();
});

test('track filters sync to URL and persist on reload + back', async ({ page }) => {
  await page.goto('/tracks/foundations-30d');
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await page.getByTestId('track-filter-kind-coding').click();
  await page.getByTestId('track-filter-tech-html').click();
  await page.getByTestId('track-filter-diff-easy').click();
  await page.getByTestId('track-filter-imp-low').click();
  await page.getByTestId('track-filter-search').fill('Basic Structure');

  await expect(page).toHaveURL(/\/tracks\/foundations-30d/);
  await expect(page).toHaveURL(/kind=coding/);
  await expect(page).toHaveURL(/tech=html/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/imp=low/);
  await expect(page).toHaveURL(/q=Basic(?:\+|%20)Structure/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await expect(page.getByTestId('track-filter-search')).toHaveValue('Basic Structure');
  await expect(page.getByTestId('track-filter-kind-coding')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-html')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-diff-easy')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-imp-low')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();

  await page.getByTestId(`track-question-card-${WEB_QUESTION.id}`).click();
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await expect(page.getByTestId('question-title')).toHaveText(WEB_QUESTION.title);

  await page.goBack();
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await expect(page).toHaveURL(/kind=coding/);
  await expect(page).toHaveURL(/tech=html/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/imp=low/);
  await expect(page).toHaveURL(/q=Basic(?:\+|%20)Structure/);
  await expect(page.getByTestId('track-filter-search')).toHaveValue('Basic Structure');
  await expect(page.getByTestId('track-filter-kind-coding')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-html')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-diff-easy')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-imp-low')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();
});

test('coding list keeps last filters after reloading another route', async ({ page }) => {
  await page.goto('/coding?tech=javascript&kind=coding&diff=easy&imp=low&q=Clamp');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();
  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId('filter-difficulty-easy').locator('input')).toBeChecked();
  await expect(page.getByTestId('filter-importance-low').locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  // Simulate leaving the list, reloading the app elsewhere, then returning to /coding without params.
  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('dashboard-page')).toBeVisible();

  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(/kind=coding/);
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/imp=low/);

  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId('filter-difficulty-easy').locator('input')).toBeChecked();
  await expect(page.getByTestId('filter-importance-low').locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();
});

test('track keeps last filters after reloading another route', async ({ page }) => {
  const trackSlug = 'foundations-30d';
  const targetId = 'js-equality-vs-strict-equality';

  await page.goto(`/tracks/${trackSlug}?tech=javascript&kind=trivia&diff=easy&q=javascript`);
  await expect(page.getByTestId('track-detail-page')).toBeVisible();

  await expect(page.getByTestId('track-filter-search')).toHaveValue('javascript');
  await expect(page.getByTestId('track-filter-kind-trivia')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-javascript')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-diff-easy')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${targetId}`)).toBeVisible();

  // Leave the track, reload elsewhere, then come back without params.
  await page.getByTestId(`track-question-card-${targetId}`).click();
  await expect(page).toHaveURL(new RegExp(`/javascript/trivia/${targetId}$`));

  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('dashboard-page')).toBeVisible();

  await page.goto(`/tracks/${trackSlug}`);
  await expect(page.getByTestId('track-detail-page')).toBeVisible();

  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(/kind=trivia/);
  await expect(page).toHaveURL(/diff=easy/);
  await expect(page).toHaveURL(/q=javascript/i);

  await expect(page.getByTestId('track-filter-search')).toHaveValue('javascript');
  await expect(page.getByTestId('track-filter-kind-trivia')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-javascript')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-diff-easy')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${targetId}`)).toBeVisible();
});
