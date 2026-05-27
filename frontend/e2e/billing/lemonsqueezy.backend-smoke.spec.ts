import { test, expect, type Page } from '@playwright/test';

function resolveBaseUrl(baseURL: string | undefined): string {
  if (baseURL) return baseURL.replace(/\/+$/, '');
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

function assertNotProductionTarget(baseURL: string) {
  const host = new URL(baseURL).hostname.toLowerCase();
  if (host === 'frontendatlas.com' || host === 'www.frontendatlas.com') {
    throw new Error('Refusing to run billing backend smoke against production frontend.');
  }
}

async function signUp(page: Page, email: string, username: string, password: string) {
  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-page')).toBeVisible();
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-username').fill(username);
  await page.getByTestId('signup-password').fill(password);
  await page.getByTestId('signup-confirm').fill(password);
  await page.getByTestId('signup-submit').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
}

const runBackendSmoke = process.env.E2E_BILLING_BACKEND_SMOKE === '1';

test.describe('lemonsqueezy backend smoke', () => {
  test.skip(!runBackendSmoke, 'Billing backend smoke is disabled (set E2E_BILLING_BACKEND_SMOKE=1).');

  test('signup user can create a test-mode checkout attempt without opening hosted checkout', async ({ page, baseURL }) => {
    test.setTimeout(120_000);

    const resolvedBaseUrl = resolveBaseUrl(baseURL);
    assertNotProductionTarget(resolvedBaseUrl);

    const stamp = Date.now();
    const email = `e2e-billing-${stamp}@example.com`;
    const username = `billing_smoke_${stamp}`;
    await signUp(page, email, username, 'secret123');

    const configRes = await page.request.get('/api/billing/checkout/config');
    expect(configRes.status()).toBe(200);
    const config = await configRes.json();
    expect(config).toMatchObject({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
    });
    expect(config.plans.monthly).toBe(true);

    const startRes = await page.request.post('/api/billing/checkout/start', {
      data: { planId: 'monthly' },
    });
    expect(startRes.status()).toBe(200);
    const start = await startRes.json();

    expect(start.provider).toBe('lemonsqueezy');
    expect(start.planId).toBe('monthly');
    expect(start.mode).toBe('test');
    expect(start.attemptId).toMatch(/^chk_/);
    expect(start.reused).toBe(false);

    const checkoutUrl = new URL(start.checkoutUrl);
    expect(checkoutUrl.hostname).toBe('frontendatlas.lemonsqueezy.com');
    expect(checkoutUrl.pathname).toContain('/checkout/buy/test-monthly');
    expect(checkoutUrl.searchParams.get('checkout[email]')).toBe(email);
    expect(checkoutUrl.searchParams.get('checkout[custom][fa_checkout_attempt_id]')).toBe(start.attemptId);
    expect(checkoutUrl.searchParams.get('checkout[custom_data][fa_checkout_attempt_id]')).toBe(start.attemptId);

    const successUrl = new URL(start.successUrl);
    const cancelUrl = new URL(start.cancelUrl);
    expect(successUrl.origin).toBe(resolvedBaseUrl);
    expect(successUrl.pathname).toBe('/billing/success');
    expect(successUrl.searchParams.get('attempt')).toBe(start.attemptId);
    expect(cancelUrl.origin).toBe(resolvedBaseUrl);
    expect(cancelUrl.pathname).toBe('/billing/cancel');
    expect(cancelUrl.searchParams.get('attempt')).toBe(start.attemptId);

    const statusRes = await page.request.get(`/api/billing/checkout/attempts/${start.attemptId}/status`);
    expect(statusRes.status()).toBe(200);
    const status = await statusRes.json();
    expect(status).toMatchObject({
      attemptId: start.attemptId,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      state: 'awaiting_webhook',
      rawStatus: 'created',
      entitlementActive: false,
      accessTierEffective: 'free',
    });
    expect(status.billingEventId).toBeNull();
  });
});
