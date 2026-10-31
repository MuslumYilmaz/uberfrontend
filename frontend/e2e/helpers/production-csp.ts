import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

type VercelConfig = {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

function readProductionCsp(): string {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
  const globalHeaders = config.headers.find((entry) => entry.source === '/(.*)')?.headers || [];
  const policy = globalHeaders.find((header) => header.key === 'Content-Security-Policy')?.value;
  if (!policy) throw new Error('vercel.json has no global Content-Security-Policy header.');
  return policy;
}

/**
 * Serves app documents with the CSP from vercel.json. The dev server sends no
 * security headers, so without this a script or frame the policy blocks in
 * production still works in E2E.
 */
export async function enforceProductionCsp(page: Page): Promise<void> {
  // The dev server is plain http, which this directive would upgrade away from.
  const policy = readProductionCsp().replace(/\s*upgrade-insecure-requests\s*;?/, '');

  await page.route(
    (url) => !url.pathname.startsWith('/api/') && !/\.\w+$/.test(url.pathname),
    async (route) => {
      if (!route.request().isNavigationRequest()) {
        await route.fallback();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': policy },
      });
    },
  );
}
