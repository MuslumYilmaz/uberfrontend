import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import {
  JS_QUESTION,
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIndexedDbKeyPrefixContains,
  waitForIndexedDbKeyPrefixNotContains,
} from './helpers';

type RequestFailure = {
  url: string;
  method: string;
  resourceType: string;
  errorText: string;
};

function trackRequestFailures(page: Page, opts?: { allowlist?: RegExp[] }) {
  const failures: RequestFailure[] = [];
  const allowlist = opts?.allowlist ?? [];

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const errorText = failure?.errorText ?? '';

    // Navigations can legitimately abort in SPAs; don't make tests flaky on that.
    if (/net::ERR_ABORTED/i.test(errorText)) return;

    const url = req.url();
    if (allowlist.some((re) => re.test(url) || re.test(errorText))) return;

    // Keep this guard high-signal: focus on document/scripts and app fetches.
    const resourceType = req.resourceType();
    if (!['document', 'script', 'xhr', 'fetch'].includes(resourceType)) return;

    failures.push({
      url,
      method: req.method(),
      resourceType,
      errorText,
    });
  });

  return failures;
}

function assertNoRequestFailures(failures: RequestFailure[]) {
  const msg = failures
    .map((f) => `${f.method} ${f.resourceType} ${f.url} (${f.errorText})`)
    .join('\n');
  expect(failures, msg).toEqual([]);
}

async function waitForTwoAnimationFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test.describe('offline-first usability', () => {
  test.use({
    // Allow expected offline network errors for question JSON only.
    consoleErrorAllowlist: [
      'Failed to load resource:.*\\/assets\\/questions\\/.*\\.json',
      'GET .*\\/assets\\/questions\\/.*\\.json.*net::ERR_',
    ],
  });

  test('second load with questions offline still renders shell (no crash)', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('coding-list-page')).toBeVisible();
    await expect(page.locator('[data-testid^="question-card-"]')).not.toHaveCount(0);

    // Hard reload scenario: unload the app, then come back with question assets failing.
    await page.goto('about:blank');
    await page.route('**/assets/questions/**/*.json', async (route: any) => {
      await route.abort('internetdisconnected');
    });

    await page.goto('/coding');
    await expect(page.getByRole('link', { name: 'FrontendAtlas' })).toBeVisible();
    await expect(page.getByTestId('coding-list-page')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    const emptyStateVisible = async () => {
      const loc = page.getByTestId('coding-empty-state');
      return await loc.isVisible().catch(() => false);
    };
    await expect.poll(async () => {
      const cards = await page.locator('[data-testid^="question-card-"]').count();
      if (cards > 0) return 'cards';
      if (await emptyStateVisible()) return 'empty';
      return 'none';
    }).not.toBe('none');
  });
});

test('editor reset clears persisted override and survives refresh', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const starter = await getMonacoModelValue(page, codeModelKey);
  const marker = `e2e-reset-${Date.now()}`;

  await setMonacoModelValue(page, codeModelKey, `${starter}\n\n// ${marker}\n`);

  await waitForIndexedDbKeyPrefixContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    keyPrefix: `v2:code:js2:${JS_QUESTION.id}@`,
    substring: marker,
  });

  await page.reload();
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('restore-banner')).toBeVisible();

  await page.getByTestId('restore-banner-reset').click();

  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toBe(starter);
  await waitForIndexedDbKeyPrefixNotContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    keyPrefix: `v2:code:js2:${JS_QUESTION.id}@`,
    substring: marker,
  });

  await page.reload();
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toBe(starter);
  await expect(page.getByTestId('restore-banner')).toBeHidden();

  assertNoRequestFailures(requestFailures);
});

test('solution view is non-destructive; loading approach overwrites editor', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-code-editor')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const marker = `e2e-solution-${Date.now()}`;
  const codeWithMarker = [
    `// ${marker}`,
    'export default function clamp(value, lower, upper) {',
    '  return lower;',
    '}',
    '',
  ].join('\n');
  await setMonacoModelValue(page, codeModelKey, codeWithMarker);
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);

  await page.getByTestId('coding-solution-tab').click();

  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible().catch(() => false)) {
    await page.getByTestId('solution-warning-view').click();
    await expect(warning).toBeHidden();
  }

  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);

  await page.getByTestId('solution-load-approach-0').click();

  await expect(page.getByTestId('restore-banner')).toBeVisible();
  await expect(page.getByTestId('restore-banner-message')).toContainText('solution code');

  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).not.toContain(marker);
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain('if (value < lower)');

  assertNoRequestFailures(requestFailures);
});

test('split-pane drag resizes editor/results reliably', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();

  const editor = page.getByTestId('js-code-editor');
  const results = page.getByTestId('js-results-panel');
  const splitter = page.getByTestId('js-editor-splitter');

  await expect(editor).toBeVisible();
  await expect(results).toBeVisible();

  const editorH0 = (await editor.boundingBox())?.height ?? 0;
  const resultsH0 = (await results.boundingBox())?.height ?? 0;
  expect(editorH0).toBeGreaterThan(50);
  expect(resultsH0).toBeGreaterThan(50);

  const splitBox = await splitter.boundingBox();
  expect(splitBox).not.toBeNull();
  if (!splitBox) return;

  const x = splitBox.x + splitBox.width / 2;
  const y = splitBox.y + splitBox.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160);
  await page.mouse.up();

  await expect.poll(async () => (await editor.boundingBox())?.height ?? 0).toBeGreaterThan(editorH0 + 20);
  await expect.poll(async () => (await results.boundingBox())?.height ?? 0).toBeLessThan(resultsH0 - 20);

  // If/when persistence is added later, we can expand this test; for now ensure it doesn't break.
  await page.reload();
  await expect(page.getByTestId('js-panel')).toBeVisible();

  assertNoRequestFailures(requestFailures);
});

test('runner robustness: back-to-back runs replace output (no duplication)', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

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

  const statuses1 = await page.getByTestId('js-results-panel').locator('[data-testid="test-status"]').allTextContents();
  const count1 = statuses1.length;
  const fail1 = statuses1.filter((s) => s.includes('FAIL')).length;
  expect(count1).toBeGreaterThan(0);
  expect(fail1).toBeGreaterThan(0);

  await setMonacoModelValue(
    page,
    codeModelKey,
    [
      'export default function clamp(value, lower, upper) {',
      '  return Math.min(Math.max(value, lower), upper);',
      '}',
      '',
    ].join('\n'),
  );

  await page.getByTestId('js-run-tests').click();
  await expect(results).not.toHaveCount(0);

  const statuses2 = await page.getByTestId('js-results-panel').locator('[data-testid="test-status"]').allTextContents();
  const count2 = statuses2.length;
  const fail2 = statuses2.filter((s) => s.includes('FAIL')).length;

  expect(count2).toBe(count1);
  expect(fail2).toBeLessThan(fail1);

  assertNoRequestFailures(requestFailures);
});

test('JS/TS buffer isolation: edits stay in their tab and persist after refresh', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-code-editor')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const markerJs = `e2e-js-${Date.now()}`;
  const markerTs = `e2e-ts-${Date.now()}`;

  await setMonacoModelValue(page, codeModelKey, `// ${markerJs}\nexport default function clamp(v,l,u){return v}\n`);
  await waitForIndexedDbKeyPrefixContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    keyPrefix: `v2:code:js2:${JS_QUESTION.id}@`,
    substring: markerJs,
  });

  await page.getByTestId('js-language-select').selectOption('ts');
  await expect(page.getByTestId('js-language-select')).toHaveValue('ts');
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).not.toContain(markerJs);
  await waitForTwoAnimationFrames(page);

  await setMonacoModelValue(page, codeModelKey, `// ${markerTs}\nexport default function clamp(v:number,l:number,u:number){return v}\n`);
  await waitForIndexedDbKeyPrefixContains(page, {
    dbName: 'frontendatlas',
    storeName: 'fa_js',
    keyPrefix: `v2:code:js2:${JS_QUESTION.id}@`,
    substring: markerTs,
  });

  await page.getByTestId('js-language-select').selectOption('js');
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(markerJs);
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).not.toContain(markerTs);
  await waitForTwoAnimationFrames(page);

  await page.getByTestId('js-language-select').selectOption('ts');
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(markerTs);
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).not.toContain(markerJs);

  await page.reload();
  await expect(page.getByTestId('js-panel')).toBeVisible();

  // TS should be preferred on hydrate because we made it "dirty".
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(markerTs);

  await page.getByTestId('js-language-select').selectOption('js');
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(markerJs);

  assertNoRequestFailures(requestFailures);
});

test('content edge-case: missing tests/solution fields render safely (no crash)', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);

  const id = 'e2e-missing-fields';
  const fixtureQuestion = {
    id,
    title: 'E2E: Missing fields should not crash',
    type: 'coding',
    technology: 'javascript',
    access: 'free',
    difficulty: 'easy',
    tags: [],
    importance: 1,
    description: 'This fixture intentionally omits tests + solution fields.',
    starterCode: 'export default function noop() { return 1; }',
  };

  await page.route('**/questions/javascript/coding.json*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([fixtureQuestion]),
    });
  });

  await page.goto(`/javascript/coding/${id}`);
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await expect(page.getByTestId('question-title')).toHaveText(fixtureQuestion.title);
  await expect(page.getByTestId('js-panel')).toBeVisible();

  await expect(page.getByTestId('js-run-tests')).toBeDisabled();

  await page.getByTestId('coding-solution-tab').click();
  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible().catch(() => false)) {
    await page.getByTestId('solution-warning-view').click();
    await expect(warning).toBeHidden();
  }

  await expect(page.getByRole('heading', { name: 'Solution' })).toBeVisible();
  await expect(page.locator('[data-testid^="solution-load-approach-"]')).toHaveCount(0);

  assertNoRequestFailures(requestFailures);
});
