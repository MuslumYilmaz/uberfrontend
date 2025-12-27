import { test, expect } from './fixtures';
import {
  JS_QUESTION,
  WEB_QUESTION,
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIframeReady,
  waitForIndexedDbContains,
} from './helpers';

test('app loads (landing + showcase) without console errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();

  await page.goto('/showcase');
  await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
});

test('navigate list -> open question detail -> editor visible', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.getByTestId(`question-card-${JS_QUESTION.id}`).click();

  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await expect(page.getByTestId('question-title')).toHaveText(JS_QUESTION.title);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-code-editor')).toBeVisible();
});

test('change filter/sort -> list updates -> open result', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.getByTestId('filter-tech-javascript').click();
  await expect(page).toHaveURL(/tech=javascript/);

  await page.getByTestId('filter-difficulty-easy').click();
  await expect(page).toHaveURL(/diff=easy/);

  await page.getByTestId('coding-list-sort-trigger').click();
  await page.getByTestId('coding-list-sort-title-asc').click();
  await expect(page.getByTestId('coding-list-sort-trigger')).toContainText('Title: A to Z');

  await page.getByTestId('coding-list-search').fill('Clamp');
  await expect(page).toHaveURL(/q=Clamp/);
  await expect(page.getByTestId(`question-card-${JS_QUESTION.id}`)).toBeVisible();

  await page.getByTestId(`question-card-${JS_QUESTION.id}`).click();
  await expect(page.getByTestId('question-title')).toHaveText(JS_QUESTION.title);
});

test('run JS tests -> results appear with PASS/FAIL labels', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  await setMonacoModelValue(
    page,
    codeModelKey,
    [
      'export default function clamp(value, lower, upper) {',
      '  return lower;',
      '}',
      '',
    ].join('\n'),
  );

  await page.getByTestId('js-run-tests').click();

  const results = page.getByTestId('js-results-panel').getByTestId('test-result');
  await expect(results).not.toHaveCount(0);

  const statuses = await page.getByTestId('js-results-panel').locator('[data-testid="test-status"]').allTextContents();
  expect(statuses.some((s: string) => s.includes('PASS'))).toBeTruthy();
  expect(statuses.some((s: string) => s.includes('FAIL'))).toBeTruthy();
});

test('persistence: partial edit -> refresh -> code restored safely', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const original = await getMonacoModelValue(page, codeModelKey);
  const marker = `// e2e-partial-${Date.now()}`;
  const nextCode = `${original}\n${marker}\n`;

  await setMonacoModelValue(page, codeModelKey, nextCode);

  // Wait for persistence (IndexedDB primary in this app)
  await waitForIndexedDbContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    key: `v2:code:js2:${JS_QUESTION.id}`,
    substring: marker,
  });

  await page.reload();
  await expect(page.getByTestId('js-panel')).toBeVisible();

  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);
});

test.describe('offline/slow static assets', () => {
  test.use({
    // Scoped allowlist: expected offline network errors for question JSON only.
    consoleErrorAllowlist: [
      'Failed to load resource:.*\\/assets\\/questions\\/.*\\.json',
      'GET .*\\/assets\\/questions\\/.*\\.json.*net::ERR_',
    ],
  });

  test('offline/slow static assets -> shows user-friendly state (no crash)', async ({ page }) => {
    // Simulate static asset failures for question data.
    await page.route('**/assets/questions/**/*.json', async (route: any) => {
      await route.abort('internetdisconnected');
    });

    await page.goto('/coding');
    await expect(page.getByTestId('coding-list-page')).toBeVisible();

    // Flip app's offline banner on without breaking the already-loaded shell.
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByTestId('offline-banner')).toBeVisible();
    await expect(page.getByTestId('coding-empty-state')).toBeVisible();
  });
});

test('deep link to question detail works after hard refresh', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('question-title')).toHaveText(JS_QUESTION.title);
  await expect(page.getByTestId('js-panel')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('question-title')).toHaveText(JS_QUESTION.title);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-code-editor')).toBeVisible();
});
