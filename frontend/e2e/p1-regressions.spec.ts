import { test, expect } from './fixtures';
import {
  JS_QUESTION,
  WEB_QUESTION,
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIframeReady,
  waitForIndexedDbContains,
} from './helpers';

test('storage migration: v2 localStorage bundle restores and mirrors to IndexedDB', async ({ page }) => {
  const marker = `// e2e-migrate-${Date.now()}`;
  const code = [
    marker,
    'export default function clamp(value, lower, upper) {',
    '  return Math.min(Math.max(value, lower), upper);',
    '}',
    '',
  ].join('\n');

  const key = `v2:code:js2:${JS_QUESTION.id}`;
  const now = new Date().toISOString();
  const bundle = {
    version: 'v2',
    updatedAt: now,
    lastLang: 'js',
    js: { code, baseline: '', updatedAt: now },
    ts: { code: '', baseline: '', updatedAt: now },
  };

  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
    localStorage.removeItem('fa:js:idb:migrated:v1');
  }, { key, value: JSON.stringify(bundle) });

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);

  await waitForIndexedDbContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    key,
    substring: marker,
  });
});

test('invalid question id deep link renders a safe 404 (no crash)', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/definitely-not-a-real-question-id`);
  await expect(page).toHaveURL(/\/404$/);
  await expect(page.getByTestId('not-found-page')).toBeVisible();
});

test('filter empty state shows reset option and recovers', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.getByTestId('filter-tech-javascript').click();
  await expect(page).toHaveURL(/tech=javascript/);

  await page.getByTestId('filter-difficulty-hard').click();
  await expect(page).toHaveURL(/diff=hard/);

  await page.getByTestId('coding-list-search').fill('__no_such_question__');
  await expect(page).toHaveURL(/q=__no_such_question__/);

  await expect(page.getByTestId('coding-empty-state')).toBeVisible();
  await expect(page.getByTestId('coding-empty-reset')).toBeVisible();

  await page.getByTestId('coding-empty-reset').click();
  await expect(page.getByTestId('coding-list-search')).toHaveValue('');
  await expect(page.getByTestId('coding-empty-state')).toBeHidden();
  await expect(page.locator('[data-testid^="question-card-"]')).not.toHaveCount(0);
});

test('web preview does not execute injected <script> tags from content', async ({ page }) => {
  await page.goto(`/${WEB_QUESTION.tech}/coding/${WEB_QUESTION.id}`);
  await expect(page.getByTestId('web-panel')).toBeVisible();

  await expect(page.getByTestId('web-preview-placeholder')).toBeHidden();
  await waitForIframeReady(page, 'web-preview-iframe');

  const probeText = `e2e-probe-${Date.now()}`;
  const htmlModelKey = `q-${WEB_QUESTION.id}-html`;
  const html = [
    `<div id="probe">${probeText}</div>`,
    `<script>document.body.setAttribute('data-e2e-script-ran','1');</script>`,
  ].join('\n');

  await setMonacoModelValue(page, htmlModelKey, html);

  const frame = page.frameLocator('[data-testid="web-preview-iframe"]');
  await expect(frame.locator('#probe')).toHaveText(probeText);
  await expect(frame.locator('body')).not.toHaveAttribute('data-e2e-script-ran', '1');
});

test('web preview live updates do not pollute browser history (Back leaves the page)', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  await page.goto(`/${WEB_QUESTION.tech}/coding/${WEB_QUESTION.id}`);
  await expect(page.getByTestId('web-panel')).toBeVisible();
  await expect(page.getByTestId('web-preview-placeholder')).toBeHidden();

  const frame = page.frameLocator('[data-testid="web-preview-iframe"]');
  const htmlModelKey = `q-${WEB_QUESTION.id}-html`;
  const runId = Date.now();

  // Force multiple preview rebuilds (previously this would add multiple history entries).
  for (let i = 0; i < 3; i++) {
    const marker = `e2e-history-${runId}-${i}`;
    await setMonacoModelValue(page, htmlModelKey, `<div id="probe">${marker}</div>`);
    await expect(frame.locator('#probe')).toHaveText(marker);
  }

  await page.goBack();
  await expect(page).toHaveURL('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();
});

test('js runner console output resets on re-run (no stale logs)', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  const jsPanel = page.getByTestId('js-panel');
  await expect(jsPanel).toBeVisible();
  await expect(jsPanel.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const marker1 = `e2e-console-${Date.now()}-a`;
  const marker2 = `e2e-console-${Date.now()}-b`;

  const codeWithLog = (marker: string) => [
    `console.log("${marker}")`,
    'export default function clamp(value, lower, upper) {',
    '  return Math.min(Math.max(value, lower), upper);',
    '}',
    '',
  ].join('\n');

  await setMonacoModelValue(page, codeModelKey, codeWithLog(marker1));
  await jsPanel.getByTestId('js-run-tests').click();
  await expect(jsPanel.locator('[data-testid="test-result"]')).not.toHaveCount(0);

  await jsPanel.getByRole('button', { name: 'Console' }).click();
  await expect(jsPanel.locator('app-console-logger')).toContainText(marker1);

  await setMonacoModelValue(page, codeModelKey, codeWithLog(marker2));
  await jsPanel.getByTestId('js-run-tests').click();
  await expect(jsPanel.locator('[data-testid="test-result"]')).not.toHaveCount(0);

  await jsPanel.getByRole('button', { name: 'Console' }).click();
  const consoleOut = jsPanel.locator('app-console-logger');
  await expect(consoleOut).toContainText(marker2);
  await expect(consoleOut).not.toContainText(marker1);
});

test('js console logger prints Promise objects (not {})', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);

  const jsPanel = page.getByTestId('js-panel');
  await expect(jsPanel).toBeVisible();
  await expect(jsPanel.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  await setMonacoModelValue(page, codeModelKey, [
    'const p = new Promise(() => {});',
    'console.log(p);',
    '',
    'export default function clamp(value, lower, upper) {',
    '  return Math.min(Math.max(value, lower), upper);',
    '}',
    '',
  ].join('\n'));

  await jsPanel.getByTestId('js-run-tests').click();
  await expect(jsPanel.locator('[data-testid="test-result"]')).not.toHaveCount(0);

  await jsPanel.getByRole('button', { name: 'Console' }).click();
  await expect(jsPanel.locator('app-console-logger')).toContainText('Promise {<pending>}');
  await expect(jsPanel.locator('app-console-logger')).not.toContainText('LOG: {}');
});
