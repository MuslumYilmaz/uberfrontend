import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

// Runs candidate solutions of one framework or HTML/CSS task through the task page's own checks in the built app and
// writes what each check returned, one JSON file per candidate. Only `npm run review:coding-item` sets
// CODING_REVIEW_CANDIDATES (docs/ai-context/coding-item-checks.md); without it every test here is skipped. The starter
// runs as the page ships it; the official solution loads through the page's own solution loader when it has one.
type Candidate = {
  label: string;
  tech: string;
  kind: 'coding' | 'debug';
  id: string;
  surface: 'framework' | 'web';
  checkCount: number;
  source: 'starter' | 'solution' | 'files';
  files: Record<string, string> | null;
};
type CheckResult = { name: string; passed: boolean; error: string };

const candidatesFile = process.env['CODING_REVIEW_CANDIDATES'] ?? '';
const resultsDir = process.env['CODING_REVIEW_RESULTS'] ?? '';
const candidates: Candidate[] = candidatesFile ? JSON.parse(readFileSync(candidatesFile, 'utf8')) : [];
const DIST_SB_ROOT = join(process.cwd(), 'dist/frontendatlas/browser/assets/sb');

// Candidates are drafts under review: their console errors are part of the result, not a test failure.
test.use({ consoleErrorAllowlist: ['[\\s\\S]*'], pageErrorAllowlist: ['[\\s\\S]*'] });

async function installLocalFrameworkAssetMirror(page: Page): Promise<void> {
  await page.route(/^https:\/\/frontendatlas\.vercel\.app\/assets\/sb\/.+\.json(?:\?.*)?$/, async (route) => {
    const relativePath = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/assets\/sb\//, '');
    if (!relativePath || relativePath.includes('..')) throw new Error(`Unsafe framework asset path: ${relativePath}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
      body: readFileSync(join(DIST_SB_ROOT, relativePath)),
    });
  });
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-review-premium-${Date.now()}-${Math.random()}`;
  const user = buildMockUser({
    _id: 'e2e-review-premium-user',
    username: 'review_premium_user',
    email: 'review-premium@example.com',
    accessTier: 'premium',
  });
  await installAuthMock(page, { token, user });
  await page.context().addCookies([{ name: 'access_token', value: encodeURIComponent(token), url: baseURL }]);
  await page.goto('/robots.txt');
  const status = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'review_premium_user', password: 'e2e-password' }),
    });
    return response.status;
  });
  if (status !== 200) throw new Error(`Premium auth mock login failed with ${status}`);
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

async function hasMonacoModel(page: Page, filePath: string): Promise<boolean> {
  return page.evaluate((needle: string) => {
    const models = (window as any).monaco?.editor?.getModels?.() || [];
    return models.some((model: any) => (model?.uri?.toString?.() || '').includes(needle));
  }, filePath);
}

async function openFrameworkFile(page: Page, filePath: string): Promise<void> {
  // The files the task is solved in have a tab above the editor; the set-up files open from the file tree.
  const tab = page.locator(`[data-testid="framework-file-tabs"] [role="tab"][title="${filePath}"]`);
  if (await tab.count()) {
    await tab.click();
  } else {
    const drawer = page.locator('.file-drawer');
    if (!(await drawer.getAttribute('class').catch(() => ''))?.includes('open')) {
      await page.getByTitle('File tree', { exact: true }).click();
    }
    const file = page.locator(`.file-drawer .file-row[title="${filePath}"]`);
    await expect(file).toBeVisible();
    // A click at the row's box can miss while the drawer still slides in; a dispatched click always reaches it.
    await file.dispatchEvent('click');
  }
  // Bounded, so a file that does not open is reported as skipped instead of holding the test until it times out.
  await page.waitForFunction(
    (needle: string) => ((window as any).monaco?.editor?.getModels?.() || [])
      .some((model: any) => (model?.uri?.toString?.() || '').includes(needle)),
    filePath,
    { timeout: 15_000 },
  );
}

async function writeModel(page: Page, modelKey: string, code: string): Promise<void> {
  await setMonacoModelValue(page, modelKey, code);
  await expect.poll(() => getMonacoModelValue(page, modelKey)).toBe(code);
}

/** Loads the candidate's files into the editor; returns the files it could not place. */
async function loadFrameworkFiles(page: Page, files: Record<string, string>): Promise<string[]> {
  const skipped: string[] = [];
  for (const [filePath, code] of Object.entries(files)) {
    try {
      if (!(await hasMonacoModel(page, filePath))) await openFrameworkFile(page, filePath);
      await writeModel(page, filePath, code);
    } catch {
      skipped.push(filePath);
    }
  }
  const drawer = page.locator('.file-drawer');
  if ((await drawer.getAttribute('class').catch(() => ''))?.includes('open')) {
    await page.getByTitle('File tree', { exact: true }).click();
  }
  // Let the panel persist the draft before the run reads it.
  await page.waitForTimeout(300);
  return skipped;
}

/** True when the solution tab's "Load into editor" put the official solution in place. */
async function loadOfficialSolution(page: Page): Promise<boolean> {
  await page.getByTestId('coding-solution-tab').click();
  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible().catch(() => false)) {
    await page.getByTestId('solution-warning-view').click();
    await expect(warning).toBeHidden();
  }
  const loadSolution = page.getByRole('button', { name: 'Load into editor', exact: true }).first();
  const attached = await loadSolution.waitFor({ state: 'attached', timeout: 15_000 }).then(() => true, () => false);
  if (!attached) return false;
  await loadSolution.click();
  await expect(page.getByTestId('restore-banner')).toBeVisible();
  return true;
}

async function runChecks(page: Page, surface: Candidate['surface'], count: number): Promise<CheckResult[]> {
  const runButton = page.getByTestId(surface === 'web' ? 'web-run-checks' : 'framework-run-checks');
  const rowTestId = surface === 'web' ? 'web-check-result' : 'framework-check-result';
  await runButton.click();
  const rows = page.getByTestId(rowTestId);
  await expect(rows).toHaveCount(count, { timeout: 90_000 });
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
  return rows.evaluateAll((elements, prefix) => elements.map((element) => ({
    name: element.querySelector(`.${prefix}__name`)?.textContent?.trim() ?? '',
    passed: element.classList.contains('is-pass') || !!element.querySelector('.is-pass'),
    error: element.querySelector(`.${prefix}__error`)?.textContent?.trim() ?? '',
  })), surface === 'web' ? 'web-check-result' : 'framework-check-result');
}

test.describe('Coding review candidates run through their task checks', () => {
  test.describe.configure({ mode: 'parallel', timeout: 180_000 });
  test.skip(!candidates.length || !resultsDir, 'Set by npm run review:coding-item only');

  for (const candidate of candidates) {
    test(`${candidate.tech}/${candidate.id}: ${candidate.label}`, async ({ page, baseURL }) => {
      const output = join(resultsDir, `${candidate.label}.json`);
      mkdirSync(resultsDir, { recursive: true });
      try {
        await installLocalFrameworkAssetMirror(page);
        await seedPremiumSession(page, baseURL!);
        await page.goto(`/${candidate.tech}/${candidate.kind}/${candidate.id}`);
        await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
        const minModels = candidate.surface === 'web' ? 2 : 1;
        await page.waitForFunction(
          (min) => ((window as any).monaco?.editor?.getModels?.() || []).length >= min,
          minModels,
          { timeout: 30_000 },
        );

        let skippedFiles: string[] = [];
        if (candidate.files && candidate.surface === 'web') {
          await writeModel(page, `q-${candidate.id}-html`, candidate.files['index.html'] ?? '');
          await writeModel(page, `q-${candidate.id}-css`, candidate.files['styles.css'] ?? '');
        } else if (candidate.source === 'solution' && (await loadOfficialSolution(page))) {
          // Loaded by the page itself.
        } else if (candidate.files) {
          skippedFiles = await loadFrameworkFiles(page, candidate.files);
        }
        const checks = await runChecks(page, candidate.surface, candidate.checkCount);
        writeFileSync(output, JSON.stringify({ label: candidate.label, checks, skippedFiles }, null, 2));
      } catch (error) {
        writeFileSync(output, JSON.stringify({ label: candidate.label, runnerError: String((error as Error)?.message ?? error) }, null, 2));
        throw error;
      }
    });
  }
});
