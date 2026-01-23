import { test, expect } from '@playwright/test';
import { environment } from '../../src/environments/environment';
import {
  resolveCheckoutUrl,
  resolvePaymentsMode,
  resolvePaymentsProvider,
} from '../../src/app/core/utils/payments-provider.util';
import {
  detectTestModeIndicator,
  fillLemonSqueezyCheckout,
} from '../helpers/lemonsqueezy-checkout';

const provider = resolvePaymentsProvider(environment);
const paymentsMode = resolvePaymentsMode(environment);
const runRealCheckout = process.env.E2E_REAL_LS === '1' && provider === 'lemonsqueezy' && paymentsMode === 'test';

const expectedMonthlyUrl = resolveCheckoutUrl('lemonsqueezy', 'monthly', environment) || '';
const expectedBuyId = (() => {
  try {
    const parsed = new URL(expectedMonthlyUrl);
    return parsed.pathname.split('/').pop() || '';
  } catch {
    return '';
  }
})();

test.describe('lemonsqueezy real checkout (test mode)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!runRealCheckout, 'Real LemonSqueezy checkout is disabled (set E2E_REAL_LS=1 and PAYMENTS_MODE=test).');

  test('hosted checkout completes and premium unlocks', async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(180_000);

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
      test.skip(true, `Unexpected buy link (expected test buy id ${expectedBuyId}).`);
      return;
    }

    const hasTestIndicator = await detectTestModeIndicator(lsPage);
    if (!hasTestIndicator && paymentsMode !== 'test') {
      test.skip(true, 'Unable to confirm LemonSqueezy test mode. Aborting to avoid real payment.');
      return;
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

    let saw401 = false;
    lsPage.on('response', (response) => {
      if (response.url().includes('/api/auth/me') && response.status() === 401) {
        saw401 = true;
      }
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

    if (saw401) {
      throw new Error('Detected /api/auth/me 401 after redirect. Check cookie SameSite/CORS or login state.');
    }

    await lsPage.goto('/tracks');
    await expect(lsPage.getByText('Premium tracks')).toHaveCount(0);

    await lsPage.screenshot({ path: testInfo.outputPath('ls-after-redirect.png'), fullPage: true });
    await context.close();
  });
});
