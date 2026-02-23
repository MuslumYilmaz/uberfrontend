import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { JS_QUESTION, WEB_QUESTION } from './helpers';

type DifficultyFilter = 'easy' | 'intermediate' | 'hard';
type ImportanceTier = 'low' | 'medium' | 'high';
type CodingQuestionPayload = {
  id?: string;
  difficulty?: string;
  importance?: number;
};

function normalizeDifficulty(raw?: string): DifficultyFilter {
  const v = (raw || '').toLowerCase();
  if (v === 'easy') return 'easy';
  if (v === 'hard') return 'hard';
  return 'intermediate';
}

function tierFromImportance(raw?: number): ImportanceTier {
  const v = Number.isFinite(raw) ? (raw as number) : 0;
  if (v >= 4) return 'high';
  if (v >= 2) return 'medium';
  return 'low';
}

async function resolveQuestionFilters(
  page: Page,
  tech: string,
  id: string,
): Promise<{ difficulty: DifficultyFilter; importance: ImportanceTier }> {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
  const response = await page.request.get(`${baseUrl}/assets/questions/${tech}/coding.json`);
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error(`Expected question bank array for tech "${tech}".`);
  }

  const question = (payload as CodingQuestionPayload[]).find((entry) => entry?.id === id);
  if (!question) {
    throw new Error(`Question "${id}" not found in ${tech} coding bank.`);
  }

  return {
    difficulty: normalizeDifficulty(question.difficulty),
    importance: tierFromImportance(question.importance),
  };
}

async function seedPremiumSession(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
  const token = `e2e-token-premium-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-user-premium',
    username: 'premium_user',
    email: 'premium@example.com',
    accessTier: 'premium',
  });

  await installAuthMock(page, { token, user });

  await page.goto(baseUrl);
  const parsedBase = new URL(baseUrl);
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    domain: parsedBase.hostname,
    path: '/',
  }]);
  await page.evaluate(() => {
    localStorage.setItem('fa:auth:session', '1');
  });
}

test('coding list filters sync to URL and persist on reload + back', async ({ page }) => {
  const jsFilters = await resolveQuestionFilters(page, JS_QUESTION.tech, JS_QUESTION.id);

  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.getByTestId('filter-tech-javascript').click();
  await page.getByTestId(`filter-difficulty-${jsFilters.difficulty}`).click();
  await page.getByTestId(`filter-importance-${jsFilters.importance}`).click();
  await page.getByTestId('coding-list-search').fill(JS_QUESTION.title);

  await expect(page).toHaveURL(/\/coding/);
  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(new RegExp(`diff=${jsFilters.difficulty}`));
  await expect(page).toHaveURL(new RegExp(`imp=${jsFilters.importance}`));
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId(`filter-difficulty-${jsFilters.difficulty}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`filter-importance-${jsFilters.importance}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  await page.getByTestId(`question-card-${JS_QUESTION.id}`).click();
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();

  await page.goBack();
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(new RegExp(`diff=${jsFilters.difficulty}`));
  await expect(page).toHaveURL(new RegExp(`imp=${jsFilters.importance}`));
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId(`filter-difficulty-${jsFilters.difficulty}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`filter-importance-${jsFilters.importance}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();
});

test('track filters sync to URL and persist on reload + back', async ({ page }) => {
  const webFilters = await resolveQuestionFilters(page, WEB_QUESTION.tech, WEB_QUESTION.id);

  await seedPremiumSession(page);
  await page.goto('/tracks/foundations-30d');
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await page.getByTestId('track-filter-kind-coding').click();
  await page.getByTestId('track-filter-tech-html').click();
  await page.getByTestId(`track-filter-diff-${webFilters.difficulty}`).click();
  await page.getByTestId(`track-filter-imp-${webFilters.importance}`).click();
  await page.getByTestId('track-filter-search').fill('Basic Structure');

  await expect(page).toHaveURL(/\/tracks\/foundations-30d/);
  await expect(page).toHaveURL(/kind=coding/);
  await expect(page).toHaveURL(/tech=html/);
  await expect(page).toHaveURL(new RegExp(`diff=${webFilters.difficulty}`));
  await expect(page).toHaveURL(new RegExp(`imp=${webFilters.importance}`));
  await expect(page).toHaveURL(/q=Basic(?:\+|%20)Structure/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await expect(page.getByTestId('track-filter-search')).toHaveValue('Basic Structure');
  await expect(page.getByTestId('track-filter-kind-coding')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-html')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-filter-diff-${webFilters.difficulty}`)).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-filter-imp-${webFilters.importance}`)).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();

  await page.getByTestId(`track-question-card-${WEB_QUESTION.id}`).click();
  await page.waitForURL(new RegExp(`/${WEB_QUESTION.tech}/coding/${WEB_QUESTION.id}$`));

  const codingDetailPage = page.getByTestId('coding-detail-page');
  const codingMobileGuard = page.getByTestId('coding-mobile-guard');
  await expect(codingDetailPage.or(codingMobileGuard)).toBeVisible();

  if (await codingDetailPage.count()) {
    await expect(page.getByTestId('question-title')).toHaveText(WEB_QUESTION.title);
  }

  await page.goBack();
  await expect(page.getByTestId('track-detail-page')).toBeVisible();
  await expect(page.getByTestId('track-filter-kind-all')).toBeVisible();

  await expect(page).toHaveURL(/kind=coding/);
  await expect(page).toHaveURL(/tech=html/);
  await expect(page).toHaveURL(new RegExp(`diff=${webFilters.difficulty}`));
  await expect(page).toHaveURL(new RegExp(`imp=${webFilters.importance}`));
  await expect(page).toHaveURL(/q=Basic(?:\+|%20)Structure/);
  await expect(page.getByTestId('track-filter-search')).toHaveValue('Basic Structure');
  await expect(page.getByTestId('track-filter-kind-coding')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId('track-filter-tech-html')).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-filter-diff-${webFilters.difficulty}`)).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-filter-imp-${webFilters.importance}`)).toHaveClass(/fa-chip--selected/);
  await expect(page.getByTestId(`track-question-card-${WEB_QUESTION.id}`)).toBeVisible();
});

test('coding list keeps last filters after reloading another route', async ({ page }) => {
  const jsFilters = await resolveQuestionFilters(page, JS_QUESTION.tech, JS_QUESTION.id);
  const initialParams = new URLSearchParams({
    tech: JS_QUESTION.tech,
    kind: 'coding',
    diff: jsFilters.difficulty,
    imp: jsFilters.importance,
    q: JS_QUESTION.title,
  });

  await page.goto(`/coding?${initialParams.toString()}`);
  await expect(page.getByTestId('coding-list-page')).toBeVisible();
  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId(`filter-difficulty-${jsFilters.difficulty}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`filter-importance-${jsFilters.importance}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  // Simulate leaving the list, reloading the app elsewhere, then returning to /coding without params.
  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('dashboard-page')).toBeVisible();

  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await expect(page).toHaveURL(/tech=javascript/);
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page).toHaveURL(new RegExp(`diff=${jsFilters.difficulty}`));
  await expect(page).toHaveURL(new RegExp(`imp=${jsFilters.importance}`));

  await expect(page.getByTestId('coding-list-search')).toHaveValue(JS_QUESTION.title);
  await expect(page.getByTestId('filter-tech-javascript')).toHaveClass(/is-active/);
  await expect(page.getByTestId(`filter-difficulty-${jsFilters.difficulty}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`filter-importance-${jsFilters.importance}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();
});

test('track keeps last filters after reloading another route', async ({ page }) => {
  await seedPremiumSession(page);
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
