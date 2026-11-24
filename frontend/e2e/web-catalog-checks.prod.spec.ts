import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue } from './helpers';

type WebTask = {
  tech: 'html' | 'css';
  id: string;
  checks: number;
  starter: { html: string; css: string };
  solution: { html: string; css: string };
};

// The catalog keeps some markup with escaped newlines; the editors hold it unescaped.
const unescape = (value: unknown) => String(value ?? '').replace(/\\n/g, '\n');

function readWebTasks(): WebTask[] {
  return (['html', 'css'] as const).flatMap((tech) => {
    const catalogPath = join(process.cwd(), `../cdn/questions/${tech}/coding.json`);
    return (JSON.parse(readFileSync(catalogPath, 'utf8')) as any[]).map((question) => ({
      tech,
      id: question.id,
      checks: (question.frameworkTests ?? []).length,
      starter: { html: unescape(question.web?.starterHtml), css: unescape(question.web?.starterCss) },
      solution: { html: unescape(question.webSolutionHtml), css: unescape(question.webSolutionCss) },
    }));
  });
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-web-catalog-premium-${Date.now()}-${Math.random()}`;
  const user = buildMockUser({
    _id: 'e2e-web-catalog-premium-user',
    username: 'web_catalog_premium_user',
    email: 'web-catalog-premium@example.com',
    accessTier: 'premium',
  });
  await installAuthMock(page, { token, user });
  await page.context().addCookies([{ name: 'access_token', value: encodeURIComponent(token), url: baseURL }]);
  const status = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'web_catalog_premium_user', password: 'e2e-password' }),
    });
    return response.status;
  });
  if (status !== 200) throw new Error(`Premium auth mock login failed with ${status}`);
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

/** Puts the code in both editors, as typing would, and waits until the panel holds it. */
async function writeCode(page: Page, id: string, code: { html: string; css: string }): Promise<void> {
  await setMonacoModelValue(page, `q-${id}-html`, code.html);
  await setMonacoModelValue(page, `q-${id}-css`, code.css);
  await expect.poll(() => getMonacoModelValue(page, `q-${id}-html`)).toBe(code.html);
  await expect.poll(() => getMonacoModelValue(page, `q-${id}-css`)).toBe(code.css);
}

async function runChecks(page: Page, count: number): Promise<Locator> {
  const frames = await page.locator('iframe').count();
  const run = page.getByTestId('web-run-checks');
  await run.click();
  await expect(page.getByTestId('web-check-result')).toHaveCount(count, { timeout: 90_000 });
  await expect(run).toBeEnabled();
  // Each check runs in a frame of its own, and none is left behind.
  await expect(page.locator('iframe')).toHaveCount(frames);
  return page.getByTestId('web-results-panel');
}

const tasks = readWebTasks();

test.describe('Every HTML/CSS task checks its preview: the official solution passes, the starter does not', () => {
  test.describe.configure({ mode: 'parallel', timeout: 120_000 });

  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the web catalog regression');
    // A static same-origin document, so the premium session below is seeded on the app origin.
    await page.goto('/robots.txt');
    await seedPremiumSession(page, baseURL);
  });

  for (const task of tasks) {
    test(`${task.tech}/${task.id} passes all ${task.checks} checks with its solution and fails its starter`, async ({ page }) => {
      expect(task.checks).toBeGreaterThanOrEqual(2);
      await page.goto(`/${task.tech}/coding/${task.id}`);
      await expect(page.getByTestId('web-panel')).toBeVisible({ timeout: 30_000 });
      await page.waitForFunction(() => ((window as any).monaco?.editor?.getModels?.() || []).length >= 2, undefined, { timeout: 30_000 });

      await writeCode(page, task.id, task.starter);
      const starter = await runChecks(page, task.checks);
      await expect(starter.locator('.web-check-results__summary')).not.toHaveText(`${task.checks}/${task.checks} passed`);

      await writeCode(page, task.id, task.solution);
      const solution = await runChecks(page, task.checks);
      const summary = (await solution.locator('.web-check-results__summary').innerText()).trim();
      const failures = await solution.locator('.web-check-result__error').allInnerTexts();
      expect({ summary, failures }).toEqual({ summary: `${task.checks}/${task.checks} passed`, failures: [] });
    });
  }
});
