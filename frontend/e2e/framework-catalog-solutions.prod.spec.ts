import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

type Framework = 'react' | 'angular' | 'vue';
type CatalogQuestion = {
  id: string;
  solutionAsset?: string;
  sdk?: { asset?: string };
  frameworkTests?: Array<{ id: string; name: string; steps: unknown[] }>;
};
type CatalogCase = {
  framework: Framework;
  id: string;
  checkCount: number;
  solutionFiles: Record<string, string>;
  needsSolutionMerge: boolean;
};
type CachedRuntimeResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

const FRAMEWORKS: Framework[] = ['react', 'angular', 'vue'];
const FRAMEWORK_RUNTIME_RESPONSES = new Map<string, Promise<CachedRuntimeResponse>>();
const FRAMEWORK_DIST_ASSET_ROOT = join(
  process.cwd(),
  'dist/frontendatlas/browser/assets/sb',
);

function readCatalogCases(): CatalogCase[] {
  return FRAMEWORKS.flatMap((framework) => {
    const catalogPath = join(process.cwd(), `../cdn/questions/${framework}/coding.json`);
    const questions = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogQuestion[];
    return questions.flatMap((question) => {
      const checks = Array.isArray(question.frameworkTests)
        ? question.frameworkTests.filter((check) => Array.isArray(check.steps) && check.steps.length > 0)
        : [];
      if (!checks.length) return [];
      if (!question.solutionAsset) {
        throw new Error(`${framework}/${question.id} has checks but no canonical solution asset`);
      }
      if (!question.sdk?.asset) {
        throw new Error(`${framework}/${question.id} has checks but no starter asset`);
      }
      const solutionPath = join(
        process.cwd(),
        '../cdn',
        question.solutionAsset.replace(/^assets\//, ''),
      );
      const asset = JSON.parse(readFileSync(solutionPath, 'utf8')) as {
        files?: Record<string, string | { code?: unknown }>;
      };
      const allSolutionFiles = Object.entries(asset.files || {}).reduce<Record<string, string>>(
        (files, [filePath, value]) => {
          const code = typeof value === 'string' ? value : value?.code;
          if (typeof code === 'string') files[filePath.replace(/^\/+/, '')] = code;
          return files;
        },
        {},
      );
      if (!Object.keys(allSolutionFiles).length) {
        throw new Error(`${framework}/${question.id} has an empty canonical solution asset`);
      }
      const starterPath = join(
        process.cwd(),
        '../cdn',
        question.sdk.asset.replace(/^assets\//, ''),
      );
      const starterAsset = JSON.parse(readFileSync(starterPath, 'utf8')) as {
        files?: Record<string, string | { code?: unknown }>;
      };
      const starterFiles = Object.entries(starterAsset.files || {}).reduce<Record<string, string>>(
        (files, [filePath, value]) => {
          const code = typeof value === 'string' ? value : value?.code;
          if (typeof code === 'string') files[filePath.replace(/^\/+/, '')] = code;
          return files;
        },
        {},
      );
      const solutionFiles = Object.fromEntries(
        Object.entries(allSolutionFiles).filter(([filePath, code]) => starterFiles[filePath] !== code),
      );
      const needsSolutionMerge = Object.keys(allSolutionFiles).some(
        (filePath) => !(filePath in starterFiles),
      );
      return [{
        framework,
        id: question.id,
        checkCount: checks.length,
        solutionFiles,
        needsSolutionMerge,
      }];
    });
  });
}

function checkRows(page: Page): Locator {
  return page.getByTestId('framework-check-result');
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

async function installFrameworkRuntimeResponseCache(page: Page): Promise<void> {
  await page.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\//, async (route) => {
    const url = route.request().url();
    let pending = FRAMEWORK_RUNTIME_RESPONSES.get(url);
    if (!pending) {
      pending = route.fetch().then(async (response) => ({
        status: response.status(),
        headers: Object.fromEntries(
          Object.entries(response.headers()).filter(([name]) =>
            !['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase()),
          ),
        ),
        body: await response.text(),
      }));
      FRAMEWORK_RUNTIME_RESPONSES.set(url, pending);
    }

    try {
      await route.fulfill(await pending);
    } catch {
      FRAMEWORK_RUNTIME_RESPONSES.delete(url);
      await route.continue();
    }
  });
}

async function pinFrameworkAssetsToSameOrigin(page: Page): Promise<void> {
  await page.goto('/robots.txt');
  await page.evaluate(() => localStorage.setItem('fa:cdn:enabled', '0'));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fa:cdn:enabled'))).toBe('0');
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-catalog-premium-${Date.now()}-${Math.random()}`;
  const user = buildMockUser({
    _id: 'e2e-catalog-premium-user',
    username: 'catalog_premium_user',
    email: 'catalog-premium@example.com',
    accessTier: 'premium',
  });

  await installAuthMock(page, { token, user });
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: baseURL,
  }]);
  const status = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'catalog_premium_user',
        password: 'e2e-password',
      }),
    });
    return response.status;
  });
  if (status !== 200) throw new Error(`Premium auth mock login failed with ${status}`);
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

async function openFrameworkFile(page: Page, filePath: string): Promise<void> {
  await page.getByTitle('File tree', { exact: true }).click();
  const file = page.locator(`.file-drawer .file-row[title="${filePath}"]`);
  await expect(file).toBeVisible();
  await file.click({ force: true });
}

async function hasMonacoModel(page: Page, filePath: string): Promise<boolean> {
  return page.evaluate((needle: string) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    return models.some((model: any) => (model?.uri?.toString?.() || '').includes(needle));
  }, filePath);
}

async function loadCanonicalSolution(
  page: Page,
  solutionFiles: Record<string, string>,
  _needsSolutionMerge: boolean,
): Promise<void> {
  // SSR can expose the tab before Angular has hydrated its click handler. Monaco
  // models are created only after the client workspace is ready.
  await page.waitForFunction(() => {
    const monaco = (window as any).monaco;
    return (monaco?.editor?.getModels?.() || []).length > 0;
  }, undefined, { timeout: 30_000 });
  await page.getByTestId('coding-solution-tab').click();
  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible().catch(() => false)) {
    await page.getByTestId('solution-warning-view').click();
    await expect(warning).toBeHidden();
  }
  const loadSolution = page.getByRole('button', { name: 'Load into editor', exact: true }).first();
  const solutionLoaderAttached = await loadSolution
    .waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true, () => false);
  if (solutionLoaderAttached) {
    await loadSolution.click();
    await expect(page.getByTestId('restore-banner')).toBeVisible();
    return;
  }

  const executableFiles = Object.entries(solutionFiles).filter(
    ([filePath]) => /^src\//.test(filePath) && !/\.(?:css|scss)$/.test(filePath),
  );
  for (const [filePath, code] of executableFiles) {
    if (!await hasMonacoModel(page, filePath)) {
      await openFrameworkFile(page, filePath);
    }
    await setMonacoModelValue(page, filePath, code);
    await expect.poll(() => getMonacoModelValue(page, filePath)).toBe(code);
    await page.waitForTimeout(300);
  }
  const fileDrawer = page.locator('.file-drawer');
  if (await fileDrawer.getAttribute('class').then((value) => value?.includes('open')).catch(() => false)) {
    await page.getByTitle('File tree', { exact: true }).click();
    await expect(fileDrawer).not.toHaveClass(/open/);
  }
  await expect(page.getByTestId('framework-run-checks')).toBeEnabled();
}

async function runChecks(page: Page, expectedCount: number): Promise<Locator> {
  const frameCountBefore = await page.locator('iframe').count();
  const runButton = page.getByTestId('framework-run-checks');
  await runButton.click();
  await expect(checkRows(page)).toHaveCount(expectedCount, { timeout: 90_000 });
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
  await expect(page.locator('iframe')).toHaveCount(frameCountBefore);
  return page.getByTestId('framework-results-panel');
}

const catalogCases = readCatalogCases();

test.describe('Every checked framework question passes its canonical solution', () => {
  test.describe.configure({ mode: 'parallel', timeout: 120_000 });

  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the framework catalog regression');
    await installLocalFrameworkAssetMirror(page);
    await installFrameworkRuntimeResponseCache(page);
    await pinFrameworkAssetsToSameOrigin(page);
    await seedPremiumSession(page, baseURL);
  });

  for (const catalogCase of catalogCases) {
    test(`${catalogCase.framework}/${catalogCase.id} passes all ${catalogCase.checkCount} canonical checks`, async ({ page }) => {
      await page.goto(`/${catalogCase.framework}/coding/${catalogCase.id}`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible();
      await loadCanonicalSolution(
        page,
        catalogCase.solutionFiles,
        catalogCase.needsSolutionMerge,
      );

      const results = await runChecks(page, catalogCase.checkCount);
      const summary = (await results.locator('.framework-check-results__summary').innerText()).trim();
      const failures = await results.locator('.framework-check-result__error').allInnerTexts();
      expect({ summary, failures }).toEqual({
        summary: `${catalogCase.checkCount}/${catalogCase.checkCount} passed`,
        failures: [],
      });
      await expect(results.locator('.framework-check-result__error')).toHaveCount(0);
      await expect(
        results.locator('[data-testid="framework-check-result"][data-failure-kind]'),
      ).toHaveCount(0);
    });
  }
});
