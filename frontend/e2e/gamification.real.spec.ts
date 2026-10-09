import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// Real-backend contract for the progress loop: completing a question through the
// UI must be reflected by the activity summary, the dashboard payload and the
// practice-progress store that the frontend mocks elsewhere. No billing calls.

const runRealAuth = process.env.E2E_REAL_AUTH === '1';
const allowProdTarget = process.env.E2E_ALLOW_PROD_REAL_AUTH === '1';

const QUESTION = { tech: 'html', id: 'html-links-and-images' };
const INCIDENT_ID = 'search-typing-lag';

function resolveBaseUrl(baseURL: string | undefined): string {
  if (baseURL) return baseURL;
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

function isProtectedProductionTarget(baseURL: string): boolean {
  try {
    const host = new URL(baseURL).hostname.toLowerCase();
    return host === 'frontendatlas.com' || host === 'www.frontendatlas.com';
  } catch {
    return false;
  }
}

async function csrfHeaders(context: BrowserContext): Promise<Record<string, string>> {
  const token = (await context.cookies()).find((cookie) => cookie.name === 'csrf_token')?.value;
  return token ? { 'x-csrf-token': token } : {};
}

async function completeSignupNavigation(page: Page): Promise<void> {
  const dashboard = page.getByTestId('dashboard-page');
  const verificationFallback = page.getByTestId('signup-verification-continue');

  await expect(dashboard.or(verificationFallback).first()).toBeVisible({ timeout: 30_000 });
  if (await verificationFallback.isVisible()) {
    await verificationFallback.click();
  }

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(dashboard).toBeVisible();
}

test.describe('gamification real smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!runRealAuth, 'Real gamification smoke is disabled (set E2E_REAL_AUTH=1).');

  test('completion, summary, dashboard and practice progress agree with the real backend', async ({ browser, request, baseURL }) => {
    test.setTimeout(120_000);

    const resolvedBaseUrl = resolveBaseUrl(baseURL);
    if (isProtectedProductionTarget(resolvedBaseUrl) && !allowProdTarget) {
      test.skip(true, 'Refusing to create real users on production. Use staging/local or set E2E_ALLOW_PROD_REAL_AUTH=1.');
      return;
    }

    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();

    const context = await browser.newContext({
      baseURL: resolvedBaseUrl,
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();

    const stamp = Date.now();
    await page.goto('/auth/signup');
    await expect(page.getByTestId('signup-page')).toBeVisible();
    await page.getByTestId('signup-email').fill(`e2e-progress-${stamp}@example.com`);
    await page.getByTestId('signup-username').fill(`e2e_progress_${stamp}`);
    await page.getByTestId('signup-password').fill('secret123');
    await page.getByTestId('signup-confirm').fill('secret123');
    await page.getByTestId('signup-submit').click();
    await completeSignupNavigation(page);

    const before = await (await context.request.get('/api/activity/summary')).json();
    expect(before.totalXp).toBe(0);
    expect(before.weekly.completed).toBe(0);

    await page.goto(`/${QUESTION.tech}/coding/${QUESTION.id}`);
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    const completionResponse = page.waitForResponse((response) =>
      response.url().includes('/api/activity/complete') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Mark as complete' }).click();
    const completion = await completionResponse;
    expect(completion.status()).toBe(200);
    const completionBody = await completion.json();
    expect(Number(completionBody.xpAwarded || 0)).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Mark as incomplete' })).toBeVisible();

    const summary = await (await context.request.get('/api/activity/summary')).json();
    expect(summary.totalXp).toBeGreaterThan(0);
    expect(summary.weekly.completed).toBe(1);
    expect(summary.weekly.target).toBeGreaterThan(0);

    const dashboard = await (await context.request.get('/api/dashboard')).json();
    expect(dashboard.weeklyGoal.completed).toBe(1);
    expect(dashboard.xpLevel.totalXp).toBe(summary.totalXp);

    const headers = await csrfHeaders(context);
    const saved = await context.request.put(`/api/practice-progress/incident/${INCIDENT_ID}`, {
      headers,
      data: {
        started: true,
        completed: false,
        passed: false,
        bestScore: 40,
        lastPlayedAt: new Date().toISOString(),
        extension: { reflectionNote: 'real backend smoke' },
      },
    });
    expect(saved.status()).toBe(200);
    expect((await saved.json()).record).toEqual(expect.objectContaining({
      family: 'incident',
      itemId: INCIDENT_ID,
      bestScore: 40,
    }));

    const progress = await (await context.request.get('/api/practice-progress?family=incident')).json();
    expect(progress.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ family: 'incident', itemId: INCIDENT_ID, bestScore: 40 }),
    ]));

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await context.close();
  });
});
