import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import {
  JS_QUESTION,
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIndexedDbKeyPrefixContains,
  waitForIndexedDbKeyPrefixNotContains,
  waitForMonacoModel,
} from './helpers';

type RequestFailure = {
  url: string;
  method: string;
  resourceType: string;
  errorText: string;
};

type RequestFailureAllowlistEntry = RegExp | ((failure: RequestFailure) => boolean);

function isAllowedRequestFailure(failure: RequestFailure, allowlist: RequestFailureAllowlistEntry[]) {
  return allowlist.some((entry) => {
    if (entry instanceof RegExp) {
      return entry.test(failure.url) || entry.test(failure.errorText);
    }

    return entry(failure);
  });
}

const blockedMonacoWorkerScript = (failure: RequestFailure) =>
  failure.resourceType === 'script'
  && /\/assets\/monaco\/min\/vs\/base\/worker\/workerMain\.js(?:\?.*)?$/i.test(failure.url)
  && /net::ERR_BLOCKED_BY_RESPONSE/i.test(failure.errorText);

function trackRequestFailures(page: Page, opts?: { allowlist?: RequestFailureAllowlistEntry[] }) {
  const failures: RequestFailure[] = [];
  const allowlist = opts?.allowlist ?? [];

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const errorText = failure?.errorText ?? '';

    // Navigations can legitimately abort in SPAs; don't make tests flaky on that.
    if (/net::ERR_ABORTED/i.test(errorText)) return;

    const url = req.url();

    // Keep this guard high-signal: focus on document/scripts and app fetches.
    const resourceType = req.resourceType();
    if (!['document', 'script', 'xhr', 'fetch'].includes(resourceType)) return;

    const requestFailure = {
      url,
      method: req.method(),
      resourceType,
      errorText,
    };

    if (isAllowedRequestFailure(requestFailure, allowlist)) return;

    failures.push(requestFailure);
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

test('CSS coding route completes a real Monaco language-worker round trip', async ({ page }) => {
  const requestFailures = trackRequestFailures(page);
  const pageErrors: string[] = [];
  const fallbackWarnings: string[] = [];
  const workerUrls: string[] = [];
  const workerMainPath = /\/assets\/monaco\/min\/vs\/base\/worker\/workerMain\.js(?:\?.*)?$/i;
  const cssWorkerPath = /\/assets\/monaco\/min\/vs\/language\/css\/cssWorker\.js(?:\?.*)?$/i;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('worker', (worker) => workerUrls.push(worker.url()));
  page.on('console', (message) => {
    if (
      message.type() === 'warning'
      && /Could not create web worker\(s\)|Falling back to loading web worker code in main thread/i.test(message.text())
    ) {
      fallbackWarnings.push(message.text());
    }
  });

  const workerMainResponsePromise = page.waitForResponse((response) => workerMainPath.test(response.url()));
  const cssWorkerResponsePromise = page.waitForResponse((response) => cssWorkerPath.test(response.url()));

  await page.goto('/css/coding/css-fluid-clamp');
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await waitForMonacoModel(page, 'q-css-fluid-clamp-html');
  await waitForMonacoModel(page, 'q-css-fluid-clamp-css');

  const models = await page.evaluate(() => {
    const monaco = (window as any).monaco;
    return (monaco?.editor?.getModels?.() || [])
      .filter((model: any) => model.uri.toString().includes('q-css-fluid-clamp-'))
      .map((model: any) => ({
        language: model.getLanguageId(),
        uri: model.uri.toString(),
      }));
  });

  expect(models).toHaveLength(2);
  expect(models).toEqual(expect.arrayContaining([
    expect.objectContaining({ language: 'html', uri: expect.stringContaining('q-css-fluid-clamp-html') }),
    expect.objectContaining({ language: 'css', uri: expect.stringContaining('q-css-fluid-clamp-css') }),
  ]));

  const cssRoundTrip = await page.evaluate(async (modelKey: string) => {
    const monaco = (window as any).monaco;
    const model = (monaco?.editor?.getModels?.() || [])
      .find((candidate: any) => candidate.uri.toString().includes(modelKey));
    if (!model) throw new Error(`Monaco CSS model not found: ${modelKey}`);

    const originalValue = model.getValue();
    try {
      model.setValue('.worker-round-trip { color: #12; }');
      const cssMode = await new Promise<any>((resolve, reject) => {
        (window as any).require(['vs/language/css/cssMode'], resolve, reject);
      });
      const manager = new cssMode.WorkerManager(monaco.languages.css.cssDefaults);
      try {
        const worker = await manager.getLanguageServiceWorker(model.uri);
        const diagnostics = await worker.doValidation(model.uri.toString());
        return {
          language: model.getLanguageId(),
          diagnostics: diagnostics.map((diagnostic: any) => String(diagnostic.message || '')),
        };
      } finally {
        manager.dispose();
      }
    } finally {
      model.setValue(originalValue);
    }
  }, 'q-css-fluid-clamp-css');

  expect(cssRoundTrip.language).toBe('css');
  expect(cssRoundTrip.diagnostics.length).toBeGreaterThan(0);

  const [workerMainResponse, cssWorkerResponse] = await Promise.all([
    workerMainResponsePromise,
    cssWorkerResponsePromise,
  ]);
  for (const response of [workerMainResponse, cssWorkerResponse]) {
    expect(response.status(), response.url()).toBe(200);
    expect(response.headers()['content-type'] ?? '', response.url()).toMatch(/^(?:application|text)\/javascript\b/i);
  }

  await waitForTwoAnimationFrames(page);
  expect(workerUrls.some((url) => workerMainPath.test(url)), workerUrls.join('\n')).toBe(true);
  expect(fallbackWarnings, fallbackWarnings.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  assertNoRequestFailures(requestFailures);
});

test('editor reset clears persisted override and survives refresh', async ({ page }) => {
  const requestFailures = trackRequestFailures(page, {
    allowlist: [blockedMonacoWorkerScript],
  });

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
  await expect.poll(() => getMonacoModelValue(page, codeModelKey), {
    message: 'saved draft marker should restore into the editor before the restore banner is asserted',
  }).toContain(marker);
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
  const requestFailures = trackRequestFailures(page, {
    allowlist: [blockedMonacoWorkerScript],
  });

  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await waitForMonacoModel(page, `q-${JS_QUESTION.id}-code`);

  const editor = page.getByTestId('js-code-editor');
  const results = page.getByTestId('js-results-panel');
  const splitter = page.getByTestId('js-editor-splitter');

  await expect(editor).toBeVisible();
  await expect(results).toBeVisible();

  const editorH0 = (await editor.boundingBox())?.height ?? 0;
  const resultsH0 = (await results.boundingBox())?.height ?? 0;
  expect(editorH0).toBeGreaterThan(50);
  expect(resultsH0).toBeGreaterThan(50);

  await splitter.hover();
  const splitBox = await splitter.boundingBox();
  expect(splitBox).not.toBeNull();
  if (!splitBox) return;

  const x = splitBox.x + splitBox.width / 2;
  const y = splitBox.y + splitBox.height / 2;

  await page.mouse.down();
  await expect(splitter).toHaveClass(/dragging/);
  await page.mouse.move(x, y + 160, { steps: 8 });
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
