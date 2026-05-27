import { test, expect, type Page } from '@playwright/test';
import { environment } from '../../src/environments/environment';
import {
  resolveCheckoutPaymentsProvider,
  resolvePaymentsMode,
  resolvePaymentsProvider,
} from '../../src/app/core/utils/payments-provider.util';
import {
  detectTestModeIndicator,
  fillLemonSqueezyCheckout,
} from '../helpers/lemonsqueezy-checkout';

const configuredProvider = resolvePaymentsProvider(environment);
const provider = resolveCheckoutPaymentsProvider(environment);
const paymentsMode = resolvePaymentsMode(environment);
const allowTestCard = process.env.E2E_LS_TEST_CARD_ALLOWED === '1';
const expectedBuyIdFromEnv = String(process.env.E2E_LS_EXPECTED_TEST_BUY_ID || '').trim();
const runRealCheckout =
  process.env.E2E_REAL_LS === '1' &&
  provider === 'lemonsqueezy' &&
  paymentsMode === 'test';

const expectedBuyId = expectedBuyIdFromEnv;

function resolveBaseUrl(baseURL: string | undefined): string {
  if (baseURL) return baseURL.replace(/\/+$/, '');
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

async function expectBackendTestCheckoutConfig(page: Page) {
  const res = await page.request.get('/api/billing/checkout/config');
  expect(res.status()).toBe(200);
  const config = await res.json();
  expect(config).toMatchObject({
    provider: 'lemonsqueezy',
    mode: 'test',
    enabled: true,
  });
  expect(config.plans?.monthly).toBe(true);
  return config;
}

test.describe('lemonsqueezy real checkout (test mode)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(
    !runRealCheckout,
    `Real LemonSqueezy checkout is disabled (set E2E_REAL_LS=1, use PAYMENTS_MODE=test, and keep a checkout-capable provider configured; current=${configuredProvider}).`
  );

  test('hosted checkout completes and premium unlocks', async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(180_000);

    const resolvedBaseUrl = resolveBaseUrl(baseURL);
    if (isProtectedProductionTarget(resolvedBaseUrl)) {
      test.skip(true, 'Refusing to run hosted LemonSqueezy checkout against production.');
      return;
    }

    if (!expectedBuyId) {
      throw new Error('E2E_LS_EXPECTED_TEST_BUY_ID is required for hosted LemonSqueezy checkout.');
    }

    if (!allowTestCard) {
      throw new Error('Refusing to enter test card unless E2E_LS_TEST_CARD_ALLOWED=1 is set.');
    }

    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    const email = `e2e-ls-${Date.now()}@example.com`;
    const username = `ls_user_${Date.now()}`;
    const password = 'secret123';

    await page.goto('/auth/signup');
    await expect(page.getByTestId('signup-page')).toBeVisible();
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-username').fill(username);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm').fill(password);
    await page.getByTestId('signup-submit').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expectBackendTestCheckoutConfig(page);

    await page.goto('/pricing');
    await expect(page.getByTestId('pricing-cta-monthly')).toBeVisible();

    let lsPage;
    try {
      lsPage = await Promise.race([
        context.waitForEvent('page', { timeout: 15_000 }),
        page.getByTestId('pricing-cta-monthly').click().then(() => undefined),
      ]);
    } catch {
      lsPage = undefined;
    }

    if (!lsPage) {
      const fallbackUrl = await page.evaluate(() => (window as any).__faCheckoutLastUrl || '');
      if (!fallbackUrl) {
        throw new Error('Checkout did not open a new tab and no __faCheckoutLastUrl was captured.');
      }
      lsPage = await context.newPage();
      await lsPage.goto(fallbackUrl);
    }

    await lsPage.waitForLoadState('domcontentloaded');
    await lsPage.waitForURL(/lemonsqueezy\.com\/checkout/i, { timeout: 60_000 });
    const checkoutUrl = lsPage.url();
    await testInfo.attach('ls-checkout-url', {
      body: checkoutUrl,
      contentType: 'text/plain',
    });

    if (!checkoutUrl.includes('/checkout/buy/')) {
      throw new Error(`Checkout URL missing /checkout/buy/: ${checkoutUrl}`);
    }

    if (!expectedBuyId || !checkoutUrl.includes(expectedBuyId)) {
      throw new Error(`Unexpected buy link (expected test buy id ${expectedBuyId}): ${checkoutUrl}`);
    }

    const hasTestIndicator = await detectTestModeIndicator(lsPage);
    if (!hasTestIndicator) {
      throw new Error('Unable to confirm LemonSqueezy test mode. Aborting before entering card details.');
    }

    await lsPage.screenshot({ path: testInfo.outputPath('ls-before-pay.png'), fullPage: true });

    await fillLemonSqueezyCheckout(lsPage, {
      email,
      name: 'Test User',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/34',
      cvc: '123',
      postal: '12345',
    });

    const payButton = lsPage.getByRole('button', { name: /pay|subscribe|complete/i }).first();
    await expect(payButton).toBeEnabled({ timeout: 20_000 });

    await Promise.all([
      lsPage.waitForURL(/\/billing\/success/, { timeout: 120_000 }),
      payButton.click(),
    ]);

    await lsPage.screenshot({ path: testInfo.outputPath('ls-after-pay.png'), fullPage: true });

    await expect(lsPage.getByTestId('billing-success-title')).toBeVisible({ timeout: 30_000 });
    await lsPage.waitForURL(/\/profile/, { timeout: 120_000 });

    await lsPage.goto('/tracks');
    await expect(lsPage.getByText('Premium tracks')).toHaveCount(0);

    await lsPage.screenshot({ path: testInfo.outputPath('ls-after-redirect.png'), fullPage: true });
    await context.close();
  });
});
