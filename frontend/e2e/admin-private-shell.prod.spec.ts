import type { Page, Request, Route } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

const IS_PRODUCTION_SSR =
  process.env.PLAYWRIGHT_WEB_SERVER === '1' && process.env.PLAYWRIGHT_SSR === '1';

const SEO_ROUTE = '/admin/seo';
const OWNER_TOKEN = 'e2e-admin-seo-owner-token';
const EXPECTED_SEO_REQUESTS = [
  '/api/admin/seo/access',
  '/api/admin/seo/actions',
  '/api/admin/seo/overview',
  '/api/admin/seo/pages',
  '/api/admin/seo/sync-runs',
] as const;

type HeaderCardinality = {
  maxTotal: number;
  sawDuplicate: boolean;
};

function corsHeaders(request: Request): Record<string, string> {
  return {
    'access-control-allow-origin': request.headers()['origin'] || '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type,x-csrf-token',
    'access-control-allow-methods': 'GET,OPTIONS',
    vary: 'Origin',
  };
}

async function fulfillJson(
  route: Route,
  status: number,
  body: unknown,
): Promise<void> {
  const request = route.request();
  await route.fulfill({
    status,
    headers: {
      ...corsHeaders(request),
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
}

async function installOwnerSeoMocks(page: Page, baseURL: string): Promise<Set<string>> {
  const owner = buildMockUser({
    _id: 'e2e-admin-seo-owner',
    username: 'seo_owner',
    email: 'seo-owner@example.com',
    role: 'admin',
    accessTier: 'premium',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await installAuthMock(page, { token: OWNER_TOKEN, user: owner });
  await page.context().addCookies([
    {
      name: 'access_token',
      value: OWNER_TOKEN,
      url: 'https://api.frontendatlas.com',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
    {
      name: 'access_token',
      value: OWNER_TOKEN,
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('fa:auth:session', '1');

    const cardinality: HeaderCardinality = { maxTotal: 0, sawDuplicate: false };
    Object.defineProperty(window, '__faHeaderCardinality', {
      configurable: true,
      value: cardinality,
    });
    const record = () => {
      const appHeaders = document.querySelectorAll('app-header').length;
      const marketingHeaders = document.querySelectorAll('app-marketing-header').length;
      cardinality.maxTotal = Math.max(cardinality.maxTotal, appHeaders + marketingHeaders);
      cardinality.sawDuplicate ||= appHeaders > 0 && marketingHeaders > 0;
    };
    new MutationObserver(record).observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', record, { once: true });
    record();
  });

  const requestedPaths = new Set<string>();
  await page.route('**/api/admin/seo/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(request) });
      return;
    }

    const path = new URL(request.url()).pathname;
    requestedPaths.add(path);
    if (request.method() !== 'GET') {
      await fulfillJson(route, 405, { error: 'Method not allowed' });
      return;
    }

    if (path === '/api/admin/seo/access') {
      await fulfillJson(route, 200, {
        allowed: true,
        enabled: true,
        automation: { configured: true, warning: null },
        capabilities: {
          contractVersion: 'seo-admin.v2',
          manualAnalysis: true,
        },
      });
      return;
    }

    if (path === '/api/admin/seo/overview') {
      await fulfillJson(route, 200, {
        generatedAt: '2026-08-10T00:00:00.000Z',
        windowDays: 28,
        segment: 'all',
        dataHealth: {
          siteUrl: 'sc-domain:frontendatlas.com',
          latestFinalizedDate: '2026-08-06',
          lastSuccessfulSyncAt: '2026-08-09T15:09:07.000Z',
          nextScheduledSyncAt: '2026-08-10T04:15:00.000Z',
          backfillPercent: 100,
          backfill: {
            completedDays: 90,
            expectedDays: 90,
            percent: 100,
            nextDate: null,
            complete: true,
          },
          recommendationReadiness: {
            completedDays: 56,
            requiredDays: 56,
            ready: true,
          },
          queryCoveragePercent: 100,
          queryCoverageStatus: 'sufficient',
          queryCoverageSufficient: true,
          deviceCoveragePercent: 100,
          deviceCoverageStatus: 'sufficient',
          deviceCoverageSufficient: true,
          storageUsedBytes: 0,
          storageBudgetBytes: 134_217_728,
          truncated: false,
          stale: false,
          syncStatus: 'idle',
          automationConfigured: true,
          windowCompleteness: {
            slice: 'queryPage',
            current: { complete: true, availableDays: 28, expectedDays: 28 },
            previous: { complete: true, availableDays: 28, expectedDays: 28 },
          },
        },
        analysis: {
          status: 'complete',
          reason: null,
          ruleVersion: 'balanced-v2.1',
          endDate: '2026-08-06',
          windowDays: 28,
          currentForLatestData: true,
          completedDays: 56,
          requiredDays: 56,
          evaluatedPages: 0,
          committedAssessmentPages: 0,
          totalPages: 0,
          eligiblePages: 0,
          proposedActions: 0,
          clearedActions: 0,
          dataQualityBlockedPages: 0,
          decisionBlockedPages: 0,
          startedAt: '2026-08-09T15:08:00.000Z',
          completedAt: '2026-08-09T15:09:07.000Z',
        },
        kpis: {
          clicks: { value: 0, previousValue: 0, deltaPercent: null },
          impressions: { value: 0, previousValue: 0, deltaPercent: null },
          ctr: { value: 0, previousValue: 0, deltaPercent: null },
          averagePosition: { value: 0, previousValue: 0, deltaPercent: null },
        },
        trend: [],
        actionSummary: { nowCount: 0, backlogCount: 0, measuringCount: 0 },
      });
      return;
    }

    if (path === '/api/admin/seo/pages') {
      await fulfillJson(route, 200, {
        items: [],
        total: 0,
        nextCursor: null,
        metricWindow: {
          startDate: '2026-07-10',
          endDate: '2026-08-06',
          complete: true,
          availableDays: 28,
          expectedDays: 28,
        },
      });
      return;
    }

    if (path === '/api/admin/seo/actions' || path === '/api/admin/seo/sync-runs') {
      await fulfillJson(route, 200, { items: [], total: 0, nextCursor: null });
      return;
    }

    await fulfillJson(route, 404, { error: `Not mocked: ${path}` });
  });

  return requestedPaths;
}

async function expectSettledOwnerShell(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'SEO Intelligence', exact: true })).toBeVisible();
  const currentUrl = new URL(page.url());
  expect(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`).toBe(SEO_ROUTE);
  await expect(page.locator('app-header')).toHaveCount(1);
  await expect(page.locator('app-marketing-header')).toHaveCount(0);
  await expect(page.locator('[role="banner"]')).toHaveCount(1);
  await expect(page.locator('app-seo-dashboard')).toHaveCount(1);
  await expect(page.locator('app-login')).toHaveCount(0);
  await expect(page.getByTestId('login-page')).toHaveCount(0);

  const cardinality = await page.evaluate(
    () => (window as typeof window & { __faHeaderCardinality: HeaderCardinality })
      .__faHeaderCardinality,
  );
  expect(cardinality.maxTotal).toBeLessThanOrEqual(1);
  expect(cardinality.sawDuplicate).toBe(false);
}

test.describe('production/SSR private admin shell', () => {
  test.skip(
    !IS_PRODUCTION_SSR,
    'Run against the built SSR/prerender output with PLAYWRIGHT_WEB_SERVER=1 PLAYWRIGHT_SSR=1.',
  );

  test('raw /admin/seo serves a private-safe shell without homepage or owner content', async ({ request }) => {
    const response = await request.get(SEO_ROUTE);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const robotsMeta = html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];

    expect(html).toMatch(/<app-root(?:\s|>)/);
    expect(robotsMeta).toBeTruthy();
    expect(robotsMeta).toMatch(/\bcontent=["']noindex,nofollow["']/i);
    expect(html).not.toMatch(/<app-marketing-header(?:\s|>)/);
    expect(html).not.toMatch(/<app-header(?:\s|>)/);
    expect(html).not.toMatch(/<app-seo-dashboard(?:\s|>)/);
    expect(html).not.toContain('SEO Intelligence');
  });

  test('owner direct load and reload keep exactly one responsive header', async ({ page, baseURL }) => {
    const requestedPaths = await installOwnerSeoMocks(page, baseURL!);
    const runtimeIssues: string[] = [];
    const issuePattern = /NG05|hydration|hydrate|chunkloaderror|dynamically imported module|loading chunk|module script failed/i;
    page.on('console', (message) => {
      if ((message.type() === 'warning' || message.type() === 'error') && issuePattern.test(message.text())) {
        runtimeIssues.push(`[console.${message.type()}] ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => runtimeIssues.push(`[pageerror] ${error.message}`));

    const response = await page.goto(SEO_ROUTE, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expectSettledOwnerShell(page);

    await page.reload({ waitUntil: 'load' });
    await expectSettledOwnerShell(page);

    for (const width of [390, 834, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await expectSettledOwnerShell(page);
    }

    await expect.poll(
      () => EXPECTED_SEO_REQUESTS.every((path) => requestedPaths.has(path)),
    ).toBe(true);
    expect(runtimeIssues).toEqual([]);
  });
});
