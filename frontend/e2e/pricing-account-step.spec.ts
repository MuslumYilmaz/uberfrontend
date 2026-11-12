import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { environment } from '../src/environments/environment';
import { resolveCheckoutPaymentsProvider, resolveCheckoutUrl } from '../src/app/core/utils/payments-provider.util';

declare global {
  interface Window {
    __lastOpenedUrl?: string;
  }
}

// The account step promises "Checkout opens right after you sign in or create a free account." These tests hold
// that promise for every way in: a guest picks a plan, signs in, lands back on /pricing, and the saved plan opens in
// the Lemon.js overlay without another click.

const appOrigin = new URL(
  process.env.PLAYWRIGHT_BASE_URL
    || `http://${process.env.PLAYWRIGHT_HOST || '127.0.0.1'}:${process.env.PLAYWRIGHT_PORT || '4200'}`,
).origin;
const provider = resolveCheckoutPaymentsProvider(environment);
const quarterlyUrl = (provider && resolveCheckoutUrl(provider, 'quarterly', environment)) || '';

const SPRINT_OVERLAY_CONFIG = {
  configuredProvider: 'lemonsqueezy',
  provider: 'lemonsqueezy',
  mode: 'test',
  enabled: true,
  plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
  planDetails: {
    monthly: { amountCents: 1200, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
    quarterly: { amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
    annual: { amountCents: 7900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
    lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
  },
  offerVersion: 'interview_sprint_v3',
  checkoutSurface: 'overlay',
};

const WAYS_IN = [
  { name: 'Google', testId: 'login-required-google' },
  { name: 'GitHub', testId: 'login-required-github' },
  { name: 'email sign-up', testId: 'login-required-email-signup' },
  { name: 'email sign-in', testId: 'login-required-email-login' },
] as const;

test.describe('pricing account step', () => {
  test.skip(!quarterlyUrl, 'needs a configured Lemon Squeezy checkout URL for the quarterly plan');

  for (const way of WAYS_IN) {
    test(`a guest who picks Quarterly and continues with ${way.name} is back on pricing with that checkout open`, async ({ page }) => {
      const token = `e2e-account-step-${way.testId}`;
      const user = buildMockUser({ _id: token, username: 'account_step', email: 'account-step@example.com' });
      await installAuthMock(page, {
        token,
        user,
        validLogin: { emailOrUsername: user.email, password: 'secret123' },
      });
      // The real signup answers with verificationEmailRequired and the page asks for that email before it returns.
      let verificationRequested = false;
      await page.route('**/api/auth/signup', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        await page.context().addCookies([{ name: 'access_token', value: encodeURIComponent(token), url: appOrigin }]);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ token, user, accountCreated: true, verificationEmailRequired: true }),
        });
      });
      await page.route('**/api/auth/email-verification/request', async (route) => {
        verificationRequested = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, purpose: 'verify_email', expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
        });
      });
      await page.route(/\/api\/billing\/checkout\/config(?:\?.*)?$/, (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SPRINT_OVERLAY_CONFIG),
      }));
      let checkoutStart: Record<string, unknown> | null = null;
      await page.route('**/api/billing/checkout/start', async (route) => {
        checkoutStart = route.request().postDataJSON() as Record<string, unknown>;
        const attemptId = 'chk_e2e_account_step';
        const checkoutUrl = new URL(quarterlyUrl);
        checkoutUrl.searchParams.set('checkout[custom_data][fa_checkout_attempt_id]', attemptId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attemptId,
            provider: 'lemonsqueezy',
            planId: 'quarterly',
            mode: 'test',
            checkoutUrl: checkoutUrl.toString(),
            successUrl: `${appOrigin}/billing/success?attempt=${attemptId}`,
            cancelUrl: `${appOrigin}/billing/cancel?attempt=${attemptId}`,
            reused: false,
            offerVersion: 'interview_sprint_v3',
            checkoutSurface: 'overlay',
          }),
        });
      });
      await page.route(/\/api\/billing\/checkout\/attempts\/[^/?]+\/client-state(?:\?.*)?$/, (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ attemptId: 'chk_e2e_account_step', state: 'awaiting_webhook', entitlementActive: false }),
      }));
      await page.route(/lemonsqueezy\.com/, (route) => route.abort());
      // Lemon.js stand-in: the overlay records the URL it was asked to open, on every document of the flow.
      await page.addInitScript(() => {
        const win = window as any;
        win.__lastOpenedUrl = '';
        win.createLemonSqueezy = () => undefined;
        win.LemonSqueezy = {
          Setup: () => undefined,
          Url: {
            Open: (url: string) => { win.__lastOpenedUrl = url; },
            Close: () => undefined,
          },
        };
      });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-quarterly').click();
      await expect(page.getByTestId('login-required-kicker')).toHaveText('Step 1 of 2 · Quarterly · $29 USD today');
      await expect(page.getByTestId('login-required-title')).toHaveText('One step before checkout');
      await expect(page.getByTestId('login-required-body')).toHaveText('Checkout opens right after you sign in or create a free account.');
      await page.getByTestId(way.testId).click();

      if (way.testId === 'login-required-email-signup') {
        await expect(page.getByTestId('signup-page')).toBeVisible();
        await page.getByTestId('signup-email').fill(user.email);
        await page.getByTestId('signup-username').fill(user.username);
        await page.getByTestId('signup-password').fill('secret123');
        await page.getByTestId('signup-confirm').fill('secret123');
        await page.getByTestId('signup-submit').click();
      } else if (way.testId === 'login-required-email-login') {
        await expect(page.getByTestId('login-page')).toBeVisible();
        await page.getByTestId('login-email').fill(user.email);
        await page.getByTestId('login-password').fill('secret123');
        await page.getByTestId('login-submit').click();
      }
      // Google and GitHub go through the provider redirect and /auth/callback by themselves.

      await expect(page).toHaveURL(/\/pricing$/);
      await expect.poll(() => page.evaluate(() => window.__lastOpenedUrl || '')).toContain(quarterlyUrl);
      expect(checkoutStart).toMatchObject({ planId: 'quarterly', checkoutSurface: 'overlay' });
      expect(verificationRequested).toBe(way.testId === 'login-required-email-signup');
    });
  }
});
