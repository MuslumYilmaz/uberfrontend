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
  const previewFrame = page.getByTestId('web-preview-iframe');
  await expect.poll(async () => {
    const srcdoc = await previewFrame.getAttribute('srcdoc');
    if (srcdoc && srcdoc.trim()) return true;
    const src = await previewFrame.getAttribute('src');
    return !!src && /(unsafe:)?blob:/.test(src);
  }).toBeTruthy();
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
