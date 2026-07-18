import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIndexedDbKeyPrefixContains,
  waitForIndexedDbKeyPrefixNotContains,
} from './helpers';
import { buildMockUser, installAuthMock } from './auth-mocks';

type SolutionFile = string | { code?: unknown };

const RUNNER_FAILURE =
  /framework checks timed out waiting for preview render|framework assertion execution timed out|preview readiness timed out|infrastructure timeout/i;

const COUNTER_SOLUTION = readCanonicalFile(
  '../cdn/sb/react/solution/react-counter-solution.v1.json',
  'src/App.tsx',
);

const COUNTER_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-counter-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-counter-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-counter-pressure-solution.v1.json',
  ),
} as const;

const DEBOUNCE_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-debounced-search-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-debounced-search-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-debounced-search-pressure-solution.v1.json',
  ),
} as const;

const TODO_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-todo-list-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-todo-list-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-todo-list-pressure-solution.v1.json',
  ),
} as const;

type PressureFlowContract = {
  checkCounts: number[];
  roundIds: string[];
  debriefText: string;
};

const COUNTER_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'base-correctness',
    'configurable-step',
    'keyboard-accessibility',
    'auto-lifecycle',
  ],
  debriefText: 'You handled a changing interview contract',
};

const DEBOUNCE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'base-debounce',
    'state-recovery',
    'latest-query-wins',
    'accessible-lifecycle',
  ],
  debriefText: 'You kept async search correct under pressure',
};

const TODO_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-transitions',
    'derived-filters',
    'keyboard-editing',
    'undo-lifecycle',
  ],
  debriefText: 'You kept task state predictable under pressure',
};

const AUTOCOMPLETE_SOLUTION = readCanonicalFile(
  '../cdn/sb/react/solution/react-autocomplete-search-solution.v2.json',
  'src/App.tsx',
);

const VUE_TODO_STARTER = readCanonicalFile(
  '../cdn/sb/vue/question/vue-todo-list.v2.json',
  'src/App.vue',
);

const VUE_TODO_SOLUTION = readCanonicalFile(
  '../cdn/sb/vue/solution/vue-todo-list-solution.v1.json',
  'src/App.vue',
);

const VUE_TODO_DRAFT_KEY_PREFIX =
  'v2:code:fw2:vue:vue-todo-list@';

const FRAMEWORK_DIST_ASSET_ROOT = join(
  process.cwd(),
  'dist/frontendatlas/browser/assets/sb',
);

function readCanonicalFile(assetPath: string, requestedPath: string): string {
  const absolutePath = join(process.cwd(), assetPath);
  const asset = JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    files?: Record<string, SolutionFile>;
  };
  const normalizedRequestedPath = requestedPath.replace(/^\/+/, '');
  const match = Object.entries(asset.files || {}).find(
    ([path]) => path.replace(/^\/+/, '') === normalizedRequestedPath,
  );

  if (!match) {
    throw new Error(`Canonical file not found: ${assetPath}#${requestedPath}`);
  }

  const value = match[1];
  const code = typeof value === 'string' ? value : value?.code;
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error(`Canonical file is empty: ${assetPath}#${requestedPath}`);
  }
  return code;
}

function readCanonicalFiles(assetPath: string): Record<string, string> {
  const absolutePath = join(process.cwd(), assetPath);
  const asset = JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    files?: Record<string, SolutionFile>;
  };
  const files = Object.entries(asset.files || {}).reduce<Record<string, string>>(
    (acc, [path, value]) => {
      const normalizedPath = path.replace(/^\/+/, '');
      const code = typeof value === 'string' ? value : value?.code;
      if (typeof code === 'string' && code.trim()) {
        acc[normalizedPath] = code;
      }
      return acc;
    },
    {},
  );
  if (!Object.keys(files).length) {
    throw new Error(`Canonical bundle is empty: ${assetPath}`);
  }
  return files;
}

function livePreview(page: Page) {
  return page.frameLocator('iframe[title="Framework live preview"]');
}

function checkRows(page: Page): Locator {
  return page.getByTestId('framework-check-result');
}

function checkResults(page: Page): Locator {
  return checkRows(page).locator('.framework-check-result__name');
}

async function waitForFrameworkPreview(page: Page, selector: string): Promise<void> {
  await expect(page.locator('iframe[title="Framework live preview"]')).toBeVisible({ timeout: 30_000 });
  await expect(livePreview(page).locator(selector)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.preview-loading')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('framework-preview-error')).toHaveCount(0);
}

async function loadCanonicalFile(page: Page, path: string, code: string): Promise<void> {
  await setMonacoModelValue(page, path, code);
  await expect.poll(() => getMonacoModelValue(page, path)).toBe(code);
}

async function openFrameworkFile(page: Page, path: string): Promise<void> {
  await page.getByTitle('File tree', { exact: true }).click();
  const file = page.locator(`.file-drawer .file-row[title="${path}"]`);
  await expect(file).toBeVisible();
  await file.click();
  await expect(page.locator('.file-drawer')).not.toHaveClass(/open/);
}

async function loadCanonicalBundle(
  page: Page,
  files: Record<string, string>,
): Promise<void> {
  for (const [path, code] of Object.entries(files)) {
    await openFrameworkFile(page, path);
    await loadCanonicalFile(page, path, code);
    // Let the panel persist each file before the next model becomes active.
    await page.waitForTimeout(300);
  }
}

async function runChecks(page: Page, expectedCount: number): Promise<Locator> {
  const frameCountBefore = await page.locator('iframe').count();
  const runButton = page.getByTestId('framework-run-checks');

  await expect(runButton).toBeEnabled();
  await runButton.click();
  await expect(checkRows(page)).toHaveCount(expectedCount, { timeout: 60_000 });
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
  await expect(runButton).toHaveText('Run checks');

  // Every assertion uses an opaque scratch iframe. None may survive the run.
  await expect(page.locator('iframe')).toHaveCount(frameCountBefore);
  return page.getByTestId('framework-results-panel');
}

async function completePressureRounds(
  page: Page,
  contract: PressureFlowContract = COUNTER_PRESSURE_FLOW,
): Promise<void> {
  for (const [index, expectedCount] of contract.checkCounts.entries()) {
    await expect(page.getByTestId('pressure-active-round')).toHaveAttribute(
      'data-round-id',
      contract.roundIds[index],
    );
    const results = await runChecks(page, expectedCount);
    await expect(results.locator('.framework-check-results__summary')).toHaveText(
      `${expectedCount}/${expectedCount} passed`,
    );
    await expect(results.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(
      results.locator('[data-testid="framework-check-result"][data-failure-kind]'),
    ).toHaveCount(0);

    if (index < contract.checkCounts.length - 1) {
      const next = page.getByTestId('pressure-next-round');
      await expect(next).toBeVisible();
      await next.click();
    }
  }

  await dismissPostPassPrompt(page);
  await expect(page.getByTestId('pressure-debrief')).toBeVisible();
  await expect(page.getByTestId('pressure-debrief')).toContainText(
    contract.debriefText,
  );
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-pressure-premium-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-pressure-premium-user',
    username: 'pressure_premium_user',
    email: 'pressure-premium@example.com',
    accessTier: 'premium',
  });

  await installAuthMock(page, { token, user });
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: baseURL,
  }]);
  const loginStatus = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'pressure_premium_user',
        password: 'e2e-password',
      }),
    });
    return response.status;
  });
  if (loginStatus !== 200) {
    throw new Error(`Premium auth mock login failed with ${loginStatus}`);
  }
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))).toEqual(expect.objectContaining({
    viewport: expect.any(Number),
    documentWidth: expect.any(Number),
  }));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function rebuildPreview(page: Page, readySelector: string): Promise<void> {
  await page.getByTestId('framework-rebuild-preview').click();
  await waitForFrameworkPreview(page, readySelector);
}

async function expectAssertionLayer(resultsPanel: Locator): Promise<void> {
  const resultText = await resultsPanel.innerText();
  expect(resultText).not.toMatch(RUNNER_FAILURE);
  await expect(
    resultsPanel.locator('[data-testid="framework-check-result"][data-failure-kind]:not([data-failure-kind="assertion"])'),
  ).toHaveCount(0);
}

async function dismissPostPassPrompt(page: Page): Promise<void> {
  // Anonymous visitors receive the sign-in prompt; signed-in visitors can receive
  // the progress prompt. Both are deliberately dismissible before rebuilding.
  const cancel = page.getByRole('button', { name: 'Cancel', exact: true }).last();
  await cancel.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
    await expect(cancel).toBeHidden();
  }
}

async function pinFrameworkAssetsToSameOrigin(page: Page): Promise<void> {
  // Load a static same-origin document first so localStorage is set before
  // Angular evaluates the production CDN preference.
  await page.goto('/robots.txt');
  await page.evaluate(() => localStorage.setItem('fa:cdn:enabled', '0'));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fa:cdn:enabled'))).toBe('0');
}

async function installLocalFrameworkAssetMirror(page: Page): Promise<void> {
  await page.route(
    /^https:\/\/frontendatlas\.vercel\.app\/assets\/sb\/.+\.json(?:\?.*)?$/,
    async (route) => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const relativePath = pathname.replace(/^\/assets\/sb\//, '');
      if (!relativePath || relativePath.includes('..')) {
        throw new Error(`Unsafe framework asset path: ${pathname}`);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
        body: readFileSync(join(FRAMEWORK_DIST_ASSET_ROOT, relativePath)),
      });
    },
  );
}

test.describe('Framework checks against the production SSR build', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await installLocalFrameworkAssetMirror(page);
    await pinFrameworkAssetsToSameOrigin(page);
  });

  test('Counter reaches assertions, passes its canonical solution, rebuilds, and repeats cleanly', async ({ page }) => {
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.value');
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const starterResults = await runChecks(page, 1);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText('0/1 passed');
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expect(checkRows(page)).toHaveAttribute('data-failure-kind', 'assertion');
    await expect(checkRows(page).locator('.framework-check-result__error')).toBeVisible();
    await expectAssertionLayer(starterResults);

    await loadCanonicalFile(page, 'src/App.tsx', COUNTER_SOLUTION);
    await rebuildPreview(page, '.value');

    const counterButtons = livePreview(page).locator('.actions button');
    await counterButtons.nth(1).click();
    await expect(livePreview(page).locator('.value')).toHaveText('1');
    await counterButtons.nth(2).click();
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const firstPassingRun = await runChecks(page, 1);
    await expect(firstPassingRun.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(firstPassingRun.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(checkRows(page)).not.toHaveAttribute('data-failure-kind', /.+/);
    await dismissPostPassPrompt(page);

    await rebuildPreview(page, '.value');
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const repeatedPassingRun = await runChecks(page, 1);
    await expect(repeatedPassingRun.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(repeatedPassingRun.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(checkRows(page)).not.toHaveAttribute('data-failure-kind', /.+/);
  });

  test('React Counter keeps normal and pressure drafts isolated across all four rounds', async ({ page }) => {
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.value');
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('coding-solution-tab').first()).toBeEnabled();

    const normalMarker = `normal-counter-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-counter@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-counter$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await expect(page.getByTestId('coding-solution-tab').first()).toBeDisabled();
    await waitForFrameworkPreview(page, '.value');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await loadCanonicalBundle(page, COUNTER_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.value');
    await completePressureRounds(page);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
    await waitForFrameworkPreview(page, '.value');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('coding-solution-tab').first()).toBeEnabled();
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-counter-starter'
      : 'vue-counter';

    test(`${framework} Counter passes the shared pressure contract and lifecycle cleanup`, async ({ page }) => {
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.value');

      await loadCanonicalBundle(page, COUNTER_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.value');
      await completePressureRounds(page);
    });
  }

  test('React Debounced Search keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-debounced-search');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.input');

    const entry = page.getByTestId('pressure-mode-entry');
    await expect(entry).toBeVisible();
    await expect(entry).toContainText('Continue the same challenge through cumulative rounds');
    await expect(entry).not.toContainText('Counter');

    const normalMarker = `normal-debounce-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-debounced-search@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-debounced-search\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-debounced-search$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, DEBOUNCE_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.input');
    await completePressureRounds(page, DEBOUNCE_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await expect(page.getByTestId('pressure-mode-complete')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-complete')).not.toContainText('Counter');
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-debounced-search$/);
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Debounced Search passes async race, accessibility, and cleanup pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-debounced-search?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.input');

      await loadCanonicalBundle(page, DEBOUNCE_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.input');
      await completePressureRounds(page, DEBOUNCE_PRESSURE_FLOW);
    });
  }

  test('React Todo List keeps normal and pressure drafts isolated across all four rounds', async ({ page }) => {
    await page.goto('/react/coding/react-todo-list');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.input-row input');
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();

    const normalMarker = `normal-todo-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-todo-list@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-todo-list\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-todo-list$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.input-row input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, TODO_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '#new-task');
    await completePressureRounds(page, TODO_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-todo-list$/);
    await waitForFrameworkPreview(page, '.input-row input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-todo-list-starter'
      : 'vue-todo-list';

    test(`${framework} Todo List passes state, editing, undo, and cleanup pressure rounds`, async ({ page }) => {
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.input-row input');

      await loadCanonicalBundle(page, TODO_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '#new-task');
      await completePressureRounds(page, TODO_PRESSURE_FLOW);
    });
  }

  test('unsupported pressure URLs fall back to the normal canonical question flow', async ({ page }) => {
    await page.goto('/react/coding/react-autocomplete-search-starter?mode=pressure');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await expect(page).toHaveURL(/\/react\/coding\/react-autocomplete-search-starter$/);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toBeDisabled();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toHaveText('Coming soon');
    await expect(page.getByTestId('pressure-mode-start')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-autocomplete-search-starter$/,
    );
  });

  test('pressure routes keep the existing mobile workspace guard at 360 and 390px', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/react/coding/react-counter?mode=pressure');
      await expect(page.getByTestId('coding-mobile-guard')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test('Autocomplete reports six starter assertions and passes all six with its canonical solution', async ({ page }) => {
    await page.goto('/react/coding/react-autocomplete-search-starter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.input');

    const starterResults = await runChecks(page, 6);
    await expect(checkResults(page)).toHaveText([
      'Empty query closes popup',
      'Debounce waits for final query',
      'Stale response cannot overwrite newer results',
      'New query cannot select stale options while pending',
      'Loading opens and closes correctly',
      'Error and no-results states are distinct',
    ]);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText(/[0-5]\/6 passed/);
    await expect(starterResults.locator('[data-failure-kind="assertion"]')).not.toHaveCount(0);
    await expectAssertionLayer(starterResults);

    await loadCanonicalFile(page, 'src/App.tsx', AUTOCOMPLETE_SOLUTION);
    await rebuildPreview(page, '.input');

    const input = livePreview(page).locator('.input');
    await input.fill('par');
    await expect(livePreview(page).locator('.option')).toContainText('Paris', { timeout: 3_000 });

    const passingResults = await runChecks(page, 6);
    await expect(passingResults.locator('.framework-check-results__summary')).toHaveText('6/6 passed');
    await expect(passingResults.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(
      passingResults.locator('[data-testid="framework-check-result"][data-failure-kind]'),
    ).toHaveCount(0);
  });

  test('homepage defaults to the working React Counter demo and routes into the live practice page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();

    const openLive = page.getByTestId('showcase-demo-open-live');
    await openLive.scrollIntoViewIfNeeded();
    await expect(openLive).toHaveAttribute('href', '/react/coding/react-counter');
    await expect(page.locator('#demo-choice-active strong')).toHaveText('React');
    await waitForFrameworkPreview(page, '.value');

    const embeddedResults = await runChecks(page, 1);
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expectAssertionLayer(embeddedResults);

    await openLive.click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.value');
  });

  test('Vue Todo starts from boilerplate, keeps solution transient, and restores only user edits', async ({ page }) => {
    await page.goto('/vue/coding/vue-todo-list');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.empty');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_STARTER);
    expect(VUE_TODO_STARTER).toContain('TODO: Add a trimmed, non-empty task');
    expect(VUE_TODO_STARTER).not.toBe(VUE_TODO_SOLUTION);

    const starterResults = await runChecks(page, 1);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText('0/1 passed');
    await expect(checkResults(page)).toHaveText(['Todo add item']);
    await expect(checkRows(page)).toHaveAttribute('data-failure-kind', 'assertion');
    await expectAssertionLayer(starterResults);

    await page.getByTestId('coding-solution-tab').click();
    const warning = page.getByTestId('solution-warning');
    if (await warning.isVisible().catch(() => false)) {
      await page.getByTestId('solution-warning-view').click();
      await expect(warning).toBeHidden();
    }

    const loadSolution = page.getByRole('button', { name: 'Load into editor', exact: true });
    await expect(loadSolution).toHaveCount(1);
    await loadSolution.click();
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_SOLUTION);
    await expect(page.getByTestId('restore-banner')).toBeVisible();
    await waitForIndexedDbKeyPrefixNotContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: VUE_TODO_DRAFT_KEY_PREFIX,
      substring: 'if (!newTask.value.trim())',
    });

    const solutionResults = await runChecks(page, 1);
    await expect(solutionResults.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(solutionResults.locator('.framework-check-result__error')).toHaveCount(0);
    await dismissPostPassPrompt(page);

    await page.reload();
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForFrameworkPreview(page, '.empty');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_STARTER);

    const marker = `vue-todo-user-draft-${Date.now()}`;
    const stagedDraft = `<!-- preparing-${marker} -->\n${VUE_TODO_STARTER}`;
    const userDraft = `<!-- ${marker} -->\n${VUE_TODO_STARTER}`;
    await setMonacoModelValue(page, 'src/App.vue', stagedDraft);
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(stagedDraft);
    await setMonacoModelValue(page, 'src/App.vue', userDraft);
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(userDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: VUE_TODO_DRAFT_KEY_PREFIX,
      substring: marker,
    });
    await waitForFrameworkPreview(page, '.empty');

    await page.reload();
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toContain(marker);
  });

  test('Angular, Vue, and vanilla JavaScript control runners still reach assertions', async ({ page }) => {
    for (const path of [
      '/angular/coding/angular-counter-starter',
      '/vue/coding/vue-counter',
    ]) {
      await page.goto(path);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await waitForFrameworkPreview(page, '.value');

      const results = await runChecks(page, 1);
      await expect(checkResults(page)).toHaveText(['Counter flow']);
      await expectAssertionLayer(results);
      await dismissPostPassPrompt(page);
    }

    await page.goto('/javascript/coding/js-number-clamp');
    await expect(page.getByTestId('js-panel')).toBeVisible();
    await setMonacoModelValue(
      page,
      'q-js-number-clamp-code',
      [
        'export default function clamp(value, lower, upper) {',
        '  return lower;',
        '}',
        '',
      ].join('\n'),
    );
    const runButton = page.getByTestId('js-run-tests');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    const jsResults = page.getByTestId('js-results-panel');
    await expect(jsResults.getByTestId('test-result')).not.toHaveCount(0, { timeout: 30_000 });
    await expect(runButton).toBeEnabled({ timeout: 10_000 });
    const statuses = await jsResults.getByTestId('test-status').allTextContents();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((status) => /PASS|FAIL/.test(status))).toBe(true);
    expect(normalizeRunnerText(await jsResults.innerText())).not.toMatch(RUNNER_FAILURE);
  });
});

function normalizeRunnerText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
