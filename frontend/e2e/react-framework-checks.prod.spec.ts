import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

type SolutionFile = string | { code?: unknown };

const RUNNER_FAILURE =
  /framework checks timed out waiting for preview render|framework assertion execution timed out|preview readiness timed out|infrastructure timeout/i;

const COUNTER_SOLUTION = readCanonicalSolution(
  '../cdn/sb/react/solution/react-counter-solution.v1.json',
  'src/App.tsx',
);

const AUTOCOMPLETE_SOLUTION = readCanonicalSolution(
  '../cdn/sb/react/solution/react-autocomplete-search-solution.v2.json',
  'src/App.tsx',
);

function readCanonicalSolution(assetPath: string, requestedPath: string): string {
  const absolutePath = join(process.cwd(), assetPath);
  const asset = JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    files?: Record<string, SolutionFile>;
  };
  const normalizedRequestedPath = requestedPath.replace(/^\/+/, '');
  const match = Object.entries(asset.files || {}).find(
    ([path]) => path.replace(/^\/+/, '') === normalizedRequestedPath,
  );

  if (!match) {
    throw new Error(`Canonical solution file not found: ${assetPath}#${requestedPath}`);
  }

  const value = match[1];
  const code = typeof value === 'string' ? value : value?.code;
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error(`Canonical solution file is empty: ${assetPath}#${requestedPath}`);
  }
  return code;
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

async function waitForReactPreview(page: Page, selector: string): Promise<void> {
  await expect(page.locator('iframe[title="Framework live preview"]')).toBeVisible({ timeout: 30_000 });
  await expect(livePreview(page).locator(selector)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.preview-loading')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('framework-preview-error')).toHaveCount(0);
}

async function loadCanonicalAppSolution(page: Page, code: string): Promise<void> {
  await setMonacoModelValue(page, 'src/App.tsx', code);
  await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toBe(code);
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

async function rebuildPreview(page: Page, readySelector: string): Promise<void> {
  await page.getByTestId('framework-rebuild-preview').click();
  await waitForReactPreview(page, readySelector);
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

test.describe('React framework checks against the production SSR build', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('Counter reaches assertions, passes its canonical solution, rebuilds, and repeats cleanly', async ({ page }) => {
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForReactPreview(page, '.value');
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const starterResults = await runChecks(page, 1);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText('0/1 passed');
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expect(checkRows(page)).toHaveAttribute('data-failure-kind', 'assertion');
    await expect(checkRows(page).locator('.framework-check-result__error')).toBeVisible();
    await expectAssertionLayer(starterResults);

    await loadCanonicalAppSolution(page, COUNTER_SOLUTION);
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

  test('Autocomplete reports six starter assertions and passes all six with its canonical solution', async ({ page }) => {
    await page.goto('/react/coding/react-autocomplete-search-starter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForReactPreview(page, '.input');

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

    await loadCanonicalAppSolution(page, AUTOCOMPLETE_SOLUTION);
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
    await waitForReactPreview(page, '.value');

    const embeddedResults = await runChecks(page, 1);
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expectAssertionLayer(embeddedResults);

    await openLive.click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await waitForReactPreview(page, '.value');
  });

  test('Angular, Vue, and vanilla JavaScript control runners still reach assertions', async ({ page }) => {
    for (const path of [
      '/angular/coding/angular-counter-starter',
      '/vue/coding/vue-counter',
    ]) {
      await page.goto(path);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await waitForReactPreview(page, '.value');

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
