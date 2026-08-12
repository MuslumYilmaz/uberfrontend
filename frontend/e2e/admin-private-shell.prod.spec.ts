import type { Page, Request, Route } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

const IS_PRODUCTION_SSR =
  process.env.PLAYWRIGHT_WEB_SERVER === '1' && process.env.PLAYWRIGHT_SSR === '1';

const ADMIN_ROUTE = '/admin/users';
const ADMIN_TOKEN = 'e2e-admin-users-token';
const ADMIN_USERS_API = '/api/admin/users';

type HeaderCardinality = {
  maxTotal: number;
  sawDuplicate: boolean;
};

function corsHeaders(request: Request): Record<string, string> {
  return {
    'access-control-allow-origin': request.headers()['origin'] || '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,content-type,x-csrf-token',
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

async function installAdminUsersMocks(page: Page, baseURL: string): Promise<Set<string>> {
  const admin = buildMockUser({
    _id: 'e2e-admin-user',
    username: 'admin_user',
    email: 'admin@example.com',
    role: 'admin',
    accessTier: 'premium',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await installAuthMock(page, { token: ADMIN_TOKEN, user: admin });
  await page.context().addCookies([
    {
      name: 'access_token',
      value: ADMIN_TOKEN,
      url: 'https://api.frontendatlas.com',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
    {
      name: 'access_token',
      value: ADMIN_TOKEN,
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
  await page.route('**/api/admin/users**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(request) });
      return;
    }

    const path = new URL(request.url()).pathname;
    requestedPaths.add(path);

    if (request.method() === 'GET' && path === ADMIN_USERS_API) {
      await fulfillJson(route, 200, [admin]);
      return;
    }

    await fulfillJson(route, 404, { error: `Not mocked: ${path}` });
  });

  return requestedPaths;
}

async function expectSettledAdminShell(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
  await expect(page.getByText('e2e-admin-user', { exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(ADMIN_ROUTE);
  await expect(page.locator('app-header')).toHaveCount(1);
  await expect(page.locator('app-marketing-header')).toHaveCount(0);
  await expect(page.locator('[role="banner"]')).toHaveCount(1);
  await expect(page.locator('app-admin-users')).toHaveCount(1);
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

  test('raw /admin/users serves a private-safe shell without user content', async ({ request }) => {
    const response = await request.get(ADMIN_ROUTE);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const robotsMeta = html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];

    expect(html).toMatch(/<app-root(?:\s|>)/);
    expect(robotsMeta).toBeTruthy();
    expect(robotsMeta).toMatch(/\bcontent=["']noindex,nofollow["']/i);
    expect(html).not.toMatch(/<app-marketing-header(?:\s|>)/);
    expect(html).not.toMatch(/<app-header(?:\s|>)/);
    expect(html).not.toMatch(/<app-admin-users(?:\s|>)/);
    expect(html).not.toContain('admin@example.com');
  });

  test('admin direct load and reload keep exactly one responsive header', async ({ page, baseURL }) => {
    const requestedPaths = await installAdminUsersMocks(page, baseURL!);
    const runtimeIssues: string[] = [];
    const issuePattern = /NG05|hydration|hydrate|chunkloaderror|dynamically imported module|loading chunk|module script failed/i;
    page.on('console', (message) => {
      if ((message.type() === 'warning' || message.type() === 'error') && issuePattern.test(message.text())) {
        runtimeIssues.push(`[console.${message.type()}] ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => runtimeIssues.push(`[pageerror] ${error.message}`));

    const response = await page.goto(ADMIN_ROUTE, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expectSettledAdminShell(page);

    await page.reload({ waitUntil: 'load' });
    await expectSettledAdminShell(page);

    for (const width of [390, 834, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await expectSettledAdminShell(page);
    }

    await expect.poll(() => requestedPaths.has(ADMIN_USERS_API)).toBe(true);
    expect(runtimeIssues).toEqual([]);
  });
});
