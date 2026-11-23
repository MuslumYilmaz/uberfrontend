import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { buildMockUser } from './auth-mocks';
import { enforceProductionCsp } from './helpers/production-csp';
import { environment } from '../src/environments/environment';
import { resolvePaymentsMode } from '../src/app/core/utils/payments-provider.util';

declare global {
  interface Window {
    __lastOpenedUrl?: string;
    __faCheckoutRedirect?: (url?: string | URL) => void;
  }
}

// Frontend-only suite: the backend and every Polar request are mocked, so no
// payment form can load. The embed iframe is served a stub page on the real
// sandbox host so the production CSP (frame-src) and the embed's origin check
// are exercised for real; the stub speaks the embed's postMessage protocol.
const appOrigin = new URL(
  process.env.PLAYWRIGHT_BASE_URL
    || `http://${process.env.PLAYWRIGHT_HOST || '127.0.0.1'}:${process.env.PLAYWRIGHT_PORT || '4200'}`,
).origin;
const paymentsMode = resolvePaymentsMode(environment);
const POLAR_HOST_PATTERN = /^https:\/\/(sandbox\.)?polar\.sh\//;
const SESSION_URL = 'https://sandbox.polar.sh/checkout/polar_c_e2e_session';

function checkoutStubPage({ announceLoaded }: { announceLoaded: boolean }): string {
  return `<!doctype html><title>Polar checkout stub</title>
<h1 data-testid="polar-checkout-stub">No payment form</h1>
<script>
  window.__polarPost = (message) => window.parent.postMessage({ ...message, type: 'POLAR_CHECKOUT' }, '*');
  ${announceLoaded ? "window.__polarPost({ event: 'loaded' });" : ''}
</script>`;
}

function buildCheckoutConfigResponse(checkoutSurface: 'overlay' | 'hosted_new_tab') {
  return {
    configuredProvider: 'polar',
    provider: 'polar',
    mode: paymentsMode,
    enabled: true,
    plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    planDetails: {
      monthly: { amountCents: 2400, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
      quarterly: { amountCents: 4900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
      annual: { amountCents: 9900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
      lifetime: { amountCents: 17900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
    },
    offerVersion: 'pricing_baseline_v1',
    checkoutSurface,
  };
}

function buildStartedCheckoutResponse(attemptId: string, planId: string, checkoutSurface: 'overlay' | 'hosted_new_tab') {
  return {
    attemptId,
    provider: 'polar',
    planId,
    mode: paymentsMode,
    checkoutUrl: SESSION_URL,
    successUrl: `${appOrigin}/billing/success?attempt=${attemptId}`,
    cancelUrl: `${appOrigin}/billing/cancel?attempt=${attemptId}`,
    offerVersion: 'pricing_baseline_v1',
    checkoutSurface,
    reused: false,
  };
}

async function mockBackend(page: Page, { attemptId, checkoutSurface }: { attemptId: string; checkoutSurface: 'overlay' | 'hosted_new_tab' }) {
  const user = buildMockUser({ _id: 'e2e-polar-user', username: 'polar_user', email: 'polar@example.com', accessTier: 'free' });
  const startBodies: Array<Record<string, unknown>> = [];
  const clientStates: string[] = [];

  await page.route(/\/api\/dashboard(\?|$)/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await page.route('**/api/billing/checkout/config', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(buildCheckoutConfigResponse(checkoutSurface)),
  }));
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ...user,
      entitlements: { pro: { status: 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
      effectiveProActive: false,
      accessTierEffective: 'free',
    }),
  }));
  await page.route('**/api/billing/checkout/start', (route) => {
    const body = route.request().postDataJSON() as { planId?: string };
    startBodies.push(body as Record<string, unknown>);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildStartedCheckoutResponse(attemptId, body?.planId || 'monthly', checkoutSurface)),
    });
  });
  await page.route(/\/api\/billing\/checkout\/attempts\/[^/?]+\/client-state(?:\?.*)?$/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 });
    const payload = route.request().postDataJSON() as { state?: string };
    clientStates.push(String(payload?.state || ''));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ attemptId, state: 'awaiting_webhook' }) });
  });
  await page.route(`**/api/billing/checkout/attempts/${attemptId}/status`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      attemptId,
      provider: 'polar',
      planId: 'quarterly',
      mode: paymentsMode,
      state: 'awaiting_webhook',
      rawStatus: 'webhook_received',
      entitlementActive: false,
      accessTierEffective: 'free',
      billingEventId: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    }),
  }));
  await page.addInitScript(() => {
    localStorage.setItem('fa:auth:session', '1');
  });
  return { startBodies, clientStates };
}

test.describe('polar integration (local)', () => {
  test('the hosted surface opens the backend session in a new tab without leaving pricing', async ({ page }) => {
    let polarRequests = 0;
    await page.route(POLAR_HOST_PATTERN, (route) => {
      polarRequests += 1;
      return route.abort();
    });
    const { startBodies } = await mockBackend(page, { attemptId: 'chk_e2e_polar_tab', checkoutSurface: 'hosted_new_tab' });
    await page.addInitScript(() => {
      window.__lastOpenedUrl = '';
      window.__faCheckoutRedirect = (url?: string | URL) => {
        window.__lastOpenedUrl = String(url || '');
      };
    });

    await page.goto('/pricing');
    await page.getByTestId('pricing-cta-monthly').click();

    await expect.poll(() => page.evaluate(() => window.__lastOpenedUrl || '')).toBe(SESSION_URL);
    await expect(page).toHaveURL(/\/pricing/);
    expect(startBodies[0]).toMatchObject({ planId: 'monthly', checkoutSurface: 'hosted_new_tab' });
    expect(polarRequests).toBe(0);
  });

  test.describe('overlay under the production CSP', () => {
    const attemptId = 'chk_e2e_polar_overlay';

    test('the embed frames the session on the sandbox host and the success message returns to billing success', async ({ page }) => {
      await enforceProductionCsp(page);
      await page.route(POLAR_HOST_PATTERN, (route) => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: checkoutStubPage({ announceLoaded: true }),
      }));
      const { startBodies } = await mockBackend(page, { attemptId, checkoutSurface: 'overlay' });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-quarterly').click();

      const overlay = page.frameLocator('iframe[src^="https://sandbox.polar.sh/checkout/"]');
      await expect(overlay.getByTestId('polar-checkout-stub')).toBeVisible();
      await expect(page).toHaveURL(/\/pricing/);
      expect(startBodies[0]).toMatchObject({ planId: 'quarterly', checkoutSurface: 'overlay' });

      const frame = page.frames().find((candidate) => candidate.url().startsWith('https://sandbox.polar.sh/checkout/'));
      expect(frame?.url()).toContain('embed=true');
      expect(frame?.url()).toContain(`embed_origin=${encodeURIComponent(appOrigin)}`);

      // A success message naming a foreign URL must still land on the backend's own success URL.
      await frame?.evaluate(() => {
        (window as any).__polarPost({ event: 'success', successURL: 'https://attacker.example/billing/success?attempt=wrong', redirect: true });
      });
      await page.waitForURL(`**/billing/success?attempt=${attemptId}`);
      await expect(page.getByTestId('billing-success-title')).toBeVisible();
    });

    test('a frame that never loads falls back to the hosted session in this tab', async ({ page }) => {
      test.setTimeout(90_000);
      await enforceProductionCsp(page);
      await page.route(POLAR_HOST_PATTERN, (route) => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: checkoutStubPage({ announceLoaded: false }),
      }));
      const { clientStates } = await mockBackend(page, { attemptId: 'chk_e2e_polar_fallback', checkoutSurface: 'overlay' });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-quarterly').click();

      await page.waitForURL(/^https:\/\/sandbox\.polar\.sh\/checkout\//, { timeout: 30_000 });
      await expect(page.getByTestId('polar-checkout-stub')).toBeVisible();
      expect(clientStates).toContain('provider_opened');
    });
  });
});
