import { test, expect } from './fixtures';

const JS_QUESTION = {
  tech: 'javascript',
  id: 'js-number-clamp',
  title: 'Clamp',
};

const WEB_QUESTION = {
  tech: 'html',
  id: 'html-basic-structure',
  title: 'Warm-Up: Basic Structure',
};

async function waitForMonacoModel(page: any, modelKeyPart: string) {
  await page.waitForFunction((needle: string) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    return models.some((m: any) => (m?.uri?.toString?.() || '').includes(needle));
  }, modelKeyPart);
}

async function setMonacoModelValue(page: any, modelKeyPart: string, value: string) {
  await waitForMonacoModel(page, modelKeyPart);
  await page.evaluate(({ needle, value }: { needle: string; value: string }) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    const m = models.find((x: any) => (x?.uri?.toString?.() || '').includes(needle));
    if (!m?.setValue) throw new Error(`Monaco model not found: ${needle}`);
    m.setValue(value);
  }, { needle: modelKeyPart, value });
}

async function getMonacoModelValue(page: any, modelKeyPart: string): Promise<string> {
  await waitForMonacoModel(page, modelKeyPart);
  return page.evaluate((needle: string) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    const m = models.find((x: any) => (x?.uri?.toString?.() || '').includes(needle));
    return m?.getValue?.() || '';
  }, modelKeyPart);
}

async function waitForIndexedDbContains(page: any, opts: { dbName: string; storeName: string; key: string; substring: string }) {
  await page.waitForFunction(async ({ dbName, storeName, key, substring }) => {
    const openReq = indexedDB.open(dbName);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error);
    });
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);
      const raw = await new Promise<any>((resolve) => {
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => resolve(null);
      });
      return typeof raw === 'string' && raw.includes(substring);
    } finally {
      try { db.close(); } catch { /* ignore */ }
    }
  }, opts);
}

test('app loads (landing + showcase) without console errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();

  await page.goto('/showcase');
  await expect(page.locator('#showcase-hero-title')).toBeVisible();
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
  await page.waitForURL(/tech=javascript/);

  await page.getByTestId('filter-difficulty-easy').click();
  await page.waitForURL(/diff=easy/);

  await page.getByTestId('coding-list-sort-trigger').click();
  await page.getByTestId('coding-list-sort-title-asc').click();
  await expect(page.getByTestId('coding-list-sort-trigger')).toContainText('Title: A to Z');

  await page.getByTestId('coding-list-search').fill('Clamp');
  await page.waitForURL(/q=Clamp/);
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

test('HTML/CSS preview iframe loads -> web tests run -> results visible', async ({ page }) => {
  await page.goto(`/${WEB_QUESTION.tech}/coding/${WEB_QUESTION.id}`);

  await expect(page.getByTestId('web-panel')).toBeVisible();
  await expect(page.getByTestId('web-preview-placeholder')).toBeHidden();
  await expect(page.getByTestId('web-preview-iframe')).toHaveAttribute('src', /(unsafe:)?blob:/);

  await page.getByTestId('web-run-tests').click();

  const results = page.getByTestId('web-results-panel').getByTestId('test-result');
  await expect(results).not.toHaveCount(0);

  const statuses = await page.getByTestId('web-results-panel').locator('[data-testid="test-status"]').allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  expect(statuses.every((s: string) => s === 'PASS' || s === 'FAIL')).toBeTruthy();
});

test('persistence: edit code -> refresh -> code restored', async ({ page }) => {
  await page.goto(`/${JS_QUESTION.tech}/coding/${JS_QUESTION.id}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();
  await expect(page.getByTestId('js-run-tests')).toBeEnabled();

  const marker = `// e2e-persist-${Date.now()}`;
  const codeModelKey = `q-${JS_QUESTION.id}-code`;
  const nextCode = [
    marker,
    'export default function clamp(value, lower, upper) {',
    '  return Math.min(Math.max(value, lower), upper);',
    '}',
    '',
  ].join('\n');

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

  const restored = await getMonacoModelValue(page, codeModelKey);
  expect(restored).toContain(marker);
});

test('offline/slow static assets -> shows user-friendly state (no crash)', async ({ page }) => {
  // Simulate static asset failures for question data.
  await page.route('**/assets/questions/**/*.json', async (route: any) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.abort();
  });

  await page.goto('/coding');
  await expect(page.getByTestId('coding-list-page')).toBeVisible();

  // Flip app's offline banner on without breaking the already-loaded shell.
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByTestId('offline-banner')).toBeVisible();
  await expect(page.getByText('No questions match your filters.')).toBeVisible();
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
