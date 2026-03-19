import { test, expect } from './fixtures';
import { buildMockUser } from './auth-mocks';
import { environment } from '../src/environments/environment';
import {
  resolveCheckoutPaymentsProvider,
  resolveCheckoutUrl,
  resolvePaymentsMode,
  resolvePaymentsProvider,
} from '../src/app/core/utils/payments-provider.util';

declare global {
  interface Window {
    __lastOpenedUrl?: string;
    __billingPollConfig?: { maxAttempts: number; intervalMs: number };
    __faCheckoutRedirect?: (url?: string | URL) => void;
  }
}

const PLAN_IDS = ['monthly', 'quarterly', 'annual'] as const;
const ALL_PLAN_IDS = ['monthly', 'quarterly', 'annual', 'lifetime'] as const;
const paymentsMode = resolvePaymentsMode(environment);
const allowLive = process.env.E2E_ALLOW_LIVE_PAYMENTS === 'true';

if (paymentsMode === 'live' && !allowLive) {
  throw new Error('Refusing to run E2E with PAYMENTS_MODE=live. Set E2E_ALLOW_LIVE_PAYMENTS=true to override.');
}

const configuredProvider = resolvePaymentsProvider(environment);
const provider = resolveCheckoutPaymentsProvider(environment);
if (!provider) {
  throw new Error(`Local LemonSqueezy integration E2E requires a checkout-capable provider. Configured: ${configuredProvider}`);
}
const expectedUrlFor = (plan: typeof PLAN_IDS[number]) =>
  resolveCheckoutUrl(provider, plan, environment) || '';
const liveUrls = new Set(
  [
    environment.LEMONSQUEEZY_MONTHLY_URL_LIVE || environment.LEMONSQUEEZY_MONTHLY_URL,
    environment.LEMONSQUEEZY_QUARTERLY_URL_LIVE || environment.LEMONSQUEEZY_QUARTERLY_URL,
    environment.LEMONSQUEEZY_ANNUAL_URL_LIVE || environment.LEMONSQUEEZY_ANNUAL_URL,
  ].filter(Boolean)
);

function buildStartedCheckoutResponse(planId: typeof PLAN_IDS[number]) {
  const attemptId = `chk_e2e_${planId}`;
  const checkoutUrl = new URL(expectedUrlFor(planId));
  checkoutUrl.searchParams.set('checkout[custom_data][fa_checkout_attempt_id]', attemptId);
  checkoutUrl.searchParams.set('checkout[success_url]', `http://127.0.0.1:4200/billing/success?attempt=${attemptId}`);
  checkoutUrl.searchParams.set('checkout[cancel_url]', `http://127.0.0.1:4200/billing/cancel?attempt=${attemptId}`);
  return {
    attemptId,
    provider: 'lemonsqueezy',
    planId,
    mode: paymentsMode,
    checkoutUrl: checkoutUrl.toString(),
    successUrl: `http://127.0.0.1:4200/billing/success?attempt=${attemptId}`,
    cancelUrl: `http://127.0.0.1:4200/billing/cancel?attempt=${attemptId}`,
    reused: false,
  };
}

function buildCheckoutConfigResponse() {
  const plans = {
    monthly: !!resolveCheckoutUrl(provider, 'monthly', environment),
    quarterly: !!resolveCheckoutUrl(provider, 'quarterly', environment),
    annual: !!resolveCheckoutUrl(provider, 'annual', environment),
    lifetime: !!resolveCheckoutUrl(provider, 'lifetime', environment),
  };
  return {
    configuredProvider,
    provider,
    mode: paymentsMode,
    enabled: ALL_PLAN_IDS.some((planId) => plans[planId]),
    plans,
  };
}

test.describe('lemonsqueezy integration (local)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/dashboard(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      });
    });
    await page.route('**/api/billing/checkout/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildCheckoutConfigResponse()),
      });
    });
  });

  test('pricing CTA opens lemonsqueezy checkout in new tab without navigation', async ({ page }) => {
    let lsRequests = 0;
    await page.route(/lemonsqueezy\.com/, (route) => {
      lsRequests += 1;
      return route.abort();
    });

    const user = buildMockUser({
      _id: 'e2e-billing-user',
      username: 'billing_user',
      email: 'billing@example.com',
      accessTier: 'free',
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...user,
          entitlements: {
            pro: { status: 'none', validUntil: null },
            projects: { status: 'none', validUntil: null },
          },
          effectiveProActive: false,
          accessTierEffective: 'free',
        }),
      });
    });
    await page.route('**/api/billing/checkout/start', async (route) => {
      const payload = route.request().postDataJSON() as { planId?: typeof PLAN_IDS[number] };
      const planId = payload?.planId && PLAN_IDS.includes(payload.planId) ? payload.planId : 'monthly';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStartedCheckoutResponse(planId)),
      });
    });

    await page.addInitScript(({ shouldBlock, liveUrlList }) => {
      localStorage.setItem('fa:auth:session', '1');
      window.__lastOpenedUrl = '';
      window.__faCheckoutRedirect = (url?: string | URL) => {
        const next = String(url || '');
        window.__lastOpenedUrl = next;
        if (shouldBlock && liveUrlList.includes(next)) {
          throw new Error('Blocked live LemonSqueezy checkout URL during E2E.');
        }
      };
    }, { shouldBlock: paymentsMode !== 'test' && !allowLive, liveUrlList: Array.from(liveUrls) });

    await page.goto('/pricing');
    await expect(page.getByTestId('pricing-cta-monthly')).toBeVisible();

    for (const plan of PLAN_IDS) {
      await page.evaluate(() => {
        window.__lastOpenedUrl = '';
      });

      await page.getByTestId(`pricing-cta-${plan}`).click();

      const expected = expectedUrlFor(plan);
      await expect
        .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
        .toContain(expected);
      await expect
        .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
        .toContain('/checkout/buy/');
    }

    expect(lsRequests).toBe(0);
    await expect(page).toHaveURL(/\/pricing/);
  });

  test.describe('logged-out checkout', () => {
    test.use({
      consoleErrorAllowlist: ['Failed to load resource: .*api/auth/me'],
    });

    test('pricing CTA redirects to login when logged out', async ({ page }) => {
      await page.route(/lemonsqueezy\.com/, (route) => route.abort());
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid or expired token' }),
        });
      });

      await page.addInitScript(() => {
        localStorage.removeItem('fa:auth:session');
      });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-monthly').click();
      await expect(page.getByTestId('login-required-title')).toBeVisible();
      await expect(page).toHaveURL(/\/pricing/);
    });
  });

  test('pricing CTA shows new-tab notice for hosted checkout', async ({ page }) => {
    const user = buildMockUser({
      _id: 'e2e-billing-user-2',
      username: 'billing_user_2',
      email: 'billing2@example.com',
      accessTier: 'free',
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...user,
          entitlements: {
            pro: { status: 'none', validUntil: null },
            projects: { status: 'none', validUntil: null },
          },
          effectiveProActive: false,
          accessTierEffective: 'free',
        }),
      });
    });
    await page.route('**/api/billing/checkout/start', async (route) => {
      const payload = route.request().postDataJSON() as { planId?: typeof PLAN_IDS[number] };
      const planId = payload?.planId && PLAN_IDS.includes(payload.planId) ? payload.planId : 'monthly';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildStartedCheckoutResponse(planId)),
      });
    });

    await page.addInitScript(({ shouldBlock, liveUrlList }) => {
      localStorage.setItem('fa:auth:session', '1');
      window.__lastOpenedUrl = '';
      window.__faCheckoutRedirect = (url?: string | URL) => {
        const next = String(url || '');
        window.__lastOpenedUrl = next;
        if (shouldBlock && liveUrlList.includes(next)) {
          throw new Error('Blocked live LemonSqueezy checkout URL during E2E.');
        }
      };
    }, { shouldBlock: paymentsMode !== 'test' && !allowLive, liveUrlList: Array.from(liveUrls) });

    await page.goto('/pricing');
    await page.getByTestId('pricing-cta-monthly').click();

    await expect(page.getByTestId('checkout-notice')).toContainText(/new tab|popups/i);
    const expected = expectedUrlFor('monthly');
    await expect
      .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
      .toContain(expected);
    await expect
      .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
      .toContain('/checkout/buy/');
  });

  test('pricing CTA shows a reuse notice when backend reopens an active checkout attempt', async ({ page }) => {
    const user = buildMockUser({
      _id: 'e2e-billing-user-3',
      username: 'billing_user_3',
      email: 'billing3@example.com',
      accessTier: 'free',
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...user,
          entitlements: {
            pro: { status: 'none', validUntil: null },
            projects: { status: 'none', validUntil: null },
          },
          effectiveProActive: false,
          accessTierEffective: 'free',
        }),
      });
    });
    await page.route('**/api/billing/checkout/start', async (route) => {
      const payload = route.request().postDataJSON() as { planId?: typeof PLAN_IDS[number] };
      const planId = payload?.planId && PLAN_IDS.includes(payload.planId) ? payload.planId : 'monthly';
      const body = {
        ...buildStartedCheckoutResponse(planId),
        reused: true,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.addInitScript(({ shouldBlock, liveUrlList }) => {
      localStorage.setItem('fa:auth:session', '1');
      window.__lastOpenedUrl = '';
      window.__faCheckoutRedirect = (url?: string | URL) => {
        const next = String(url || '');
        window.__lastOpenedUrl = next;
        if (shouldBlock && liveUrlList.includes(next)) {
          throw new Error('Blocked live LemonSqueezy checkout URL during E2E.');
        }
      };
    }, { shouldBlock: paymentsMode !== 'test' && !allowLive, liveUrlList: Array.from(liveUrls) });

    await page.goto('/pricing');
    await page.getByTestId('pricing-cta-monthly').click();

    await expect(page.getByTestId('checkout-notice')).toContainText(/already in progress|reopened/i);
    await expect
      .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
      .toContain('/checkout/buy/');
  });

  test.describe('signed-out success return', () => {
    test.use({
      consoleErrorAllowlist: ['\\/api\\/billing\\/checkout\\/attempts\\/chk_login_return\\/status'],
    });

    test('billing success preserves the attempt across sign-in and resumes activation', async ({ page }) => {
      let loggedIn = false;

      await page.route('**/api/auth/me', async (route) => {
        if (!loggedIn) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid or expired token', code: 'AUTH_INVALID' }),
          });
          return;
        }

        const user = buildMockUser({
          _id: 'e2e-return-user',
          username: 'return_user',
          email: 'return@example.com',
          accessTier: 'premium',
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...user,
            entitlements: {
              pro: { status: 'active', validUntil: null },
              projects: { status: 'none', validUntil: null },
            },
            effectiveProActive: true,
            accessTierEffective: 'premium',
          }),
        });
      });

      await page.route('**/api/auth/login', async (route) => {
        loggedIn = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      });

      await page.route('**/api/billing/checkout/attempts/chk_login_return/status', async (route) => {
        if (!loggedIn) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid or expired token', code: 'AUTH_INVALID' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attemptId: 'chk_login_return',
            provider: 'lemonsqueezy',
            planId: 'monthly',
            mode: 'test',
            state: 'applied',
            rawStatus: 'applied',
            entitlementActive: true,
            accessTierEffective: 'premium',
            billingEventId: 'test:event_login_return',
            lastErrorCode: null,
            lastErrorMessage: null,
            supportReference: 'chk_login_return',
          }),
        });
      });

      await page.goto('/billing/success?attempt=chk_login_return');
      await expect(page.getByTestId('billing-success-title')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/auth\/login\?redirectTo=%2Fbilling%2Fsuccess%3Fattempt%3Dchk_login_return/);

      await page.getByTestId('login-email').fill('return@example.com');
      await page.getByTestId('login-password').fill('secret123');
      await page.getByTestId('login-submit').click();

      await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
    });
  });

  test('billing success polls checkout attempt status and redirects to profile (premium unlock)', async ({ page }) => {
    let attemptCalls = 0;
    await page.route('**/api/auth/me', async (route) => {
      const user = buildMockUser({
        _id: 'e2e-pro-user',
        username: 'pro_user',
        email: 'pro@example.com',
        accessTier: 'premium',
      });

      const body = {
        ...user,
        entitlements: {
          pro: { status: 'active', validUntil: null },
          projects: { status: 'none', validUntil: null },
        },
        effectiveProActive: true,
        accessTierEffective: 'premium',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
    await page.route('**/api/billing/checkout/attempts/chk_sync_success/status', async (route) => {
      attemptCalls += 1;
      const applied = attemptCalls >= 3;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attemptId: 'chk_sync_success',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: applied ? 'applied' : 'awaiting_webhook',
          rawStatus: applied ? 'applied' : 'webhook_received',
          entitlementActive: applied,
          accessTierEffective: applied ? 'premium' : 'free',
          billingEventId: applied ? 'test:event_sync_success' : null,
          lastErrorCode: null,
          lastErrorMessage: null,
        }),
      });
    });

    await page.goto('/billing/success?attempt=chk_sync_success');
    await expect(page.getByTestId('billing-success-title')).toBeVisible();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    await page.goto('/tracks');
    await expect(page.getByText('Premium tracks')).toHaveCount(0);
  });

  test('billing success timeout shows email mismatch hint', async ({ page }) => {
    await page.route('**/api/billing/checkout/attempts/chk_timeout/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attemptId: 'chk_timeout',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'awaiting_webhook',
          rawStatus: 'webhook_received',
          entitlementActive: false,
          accessTierEffective: 'free',
          billingEventId: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        }),
      });
    });

    await page.addInitScript(() => {
      window.__billingPollConfig = { maxAttempts: 2, intervalMs: 50 };
    });

    await page.goto('/billing/success?attempt=chk_timeout');
    await expect(page.getByTestId('billing-success-title')).toBeVisible();
    await expect(page.getByTestId('billing-timeout-hint')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('billing-timeout-hint')).toContainText(/different email|support/i);
  });

  test('billing success shows a pending-user-match state when the payment cannot be linked safely', async ({ page }) => {
    await page.route('**/api/billing/checkout/attempts/chk_pending_match/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attemptId: 'chk_pending_match',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'pending_user_match',
          rawStatus: 'pending_user_match',
          entitlementActive: false,
          accessTierEffective: 'free',
          billingEventId: 'test:event_pending_match',
          lastErrorCode: null,
          lastErrorMessage: null,
        }),
      });
    });

    await page.goto('/billing/success?attempt=chk_pending_match');
    await expect(page.getByTestId('billing-pending-user-match')).toBeVisible();
    await expect(page.getByTestId('billing-attempt-id')).toContainText('chk_pending_match');
  });

  test('cancelled entitlement blocks premium tracks access', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      const user = buildMockUser({
        _id: 'e2e-cancelled-user',
        username: 'cancelled_user',
        email: 'cancelled@example.com',
        accessTier: 'free',
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...user,
          entitlements: {
            pro: { status: 'cancelled', validUntil: '2000-01-01T00:00:00Z' },
            projects: { status: 'none', validUntil: null },
          },
          effectiveProActive: false,
          accessTierEffective: 'free',
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('fa:auth:session', '1');
    });

    await page.goto('/tracks/foundations-30d');
    await expect(page).toHaveURL(/\/tracks\/foundations-30d\/preview/);
    await expect(page.getByTestId('track-preview-page')).toBeVisible();
    await expect(page.getByTestId('track-detail-page')).toHaveCount(0);
  });

  test('billing cancel shows message and returns to pricing', async ({ page }) => {
    await page.goto('/billing/cancel');
    await expect(page.getByTestId('billing-cancel-title')).toBeVisible();
    await page.getByRole('link', { name: /back to pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('profile manage subscription opens per-user LemonSqueezy portal URL', async ({ page }) => {
    const manageUrl = 'https://example.com/ls/manage';
    const user = buildMockUser({
      _id: 'e2e-ls-manage-user',
      username: 'ls_manage_user',
      email: 'ls-manage@example.com',
      accessTier: 'premium',
      billing: {
        pro: { status: 'active' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_99',
            subscriptionId: 'sub_99',
            manageUrl,
          },
        },
      },
      entitlements: {
        pro: { status: 'active', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
      effectiveProActive: true,
      accessTierEffective: 'premium',
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });
    await page.route(/\/api\/billing\/manage-url(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: manageUrl }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('fa:auth:session', '1');
      window.__lastOpenedUrl = '';
      window.__faCheckoutRedirect = (url?: string | URL) => {
        window.__lastOpenedUrl = String(url || '');
      };
    });

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Billing' }).click();
    await expect(page.getByTestId('profile-manage-subscription')).toBeVisible();
    await page.getByTestId('profile-manage-subscription').click();

    await expect
      .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
      .toBe(manageUrl);
  });

  test.describe('manage portal fallback', () => {
    test.use({
      consoleErrorAllowlist: ['Failed to load resource: .*api/billing/manage-url'],
    });

    test('profile manage subscription shows a clear fallback when the billing portal is unavailable', async ({ page }) => {
      const user = buildMockUser({
        _id: 'e2e-ls-manage-unavailable',
        username: 'ls_manage_unavailable',
        email: 'ls-manage-unavailable@example.com',
        accessTier: 'premium',
        billing: {
          pro: { status: 'active' },
          projects: { status: 'none' },
          providers: {
            lemonsqueezy: {
              customerId: 'cust_missing_manage',
              subscriptionId: 'sub_missing_manage',
            },
          },
        },
        entitlements: {
          pro: { status: 'active', validUntil: null },
          projects: { status: 'none', validUntil: null },
        },
        effectiveProActive: true,
        accessTierEffective: 'premium',
      });

      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(user),
        });
      });
      await page.route(/\/api\/billing\/manage-url(\?|$)/, async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Manage URL unavailable',
            code: 'MANAGE_URL_UNAVAILABLE',
          }),
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('fa:auth:session', '1');
      });

      await page.goto('/profile');
      await page.getByRole('button', { name: 'Billing' }).click();
      await page.getByTestId('profile-manage-subscription').click();

      await expect(page.getByText(/billing portal automatically right now/i)).toBeVisible();
    });
  });

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));

  const DAY = 24 * 60 * 60 * 1000;
  const baseStart = new Date(Date.now() - 7 * DAY).toISOString();
  const subscriptionCases = [
    { label: 'monthly', start: baseStart, end: new Date(Date.now() + 30 * DAY).toISOString() },
    { label: 'quarterly', start: baseStart, end: new Date(Date.now() + 90 * DAY).toISOString() },
    { label: 'annual', start: baseStart, end: new Date(Date.now() + 365 * DAY).toISOString() },
  ] as const;

  for (const plan of subscriptionCases) {
    test(`profile billing shows subscription dates for ${plan.label}`, async ({ page }) => {
      const user = buildMockUser({
        _id: `e2e-ls-${plan.label}`,
        username: `ls_${plan.label}`,
        email: `ls-${plan.label}@example.com`,
        accessTier: 'premium',
        billing: {
          pro: { status: 'active' },
          projects: { status: 'none' },
          providers: {
            lemonsqueezy: {
              customerId: `cust_${plan.label}`,
              subscriptionId: `sub_${plan.label}`,
              startedAt: plan.start,
            },
          },
        },
        entitlements: {
          pro: { status: 'active', validUntil: plan.end },
          projects: { status: 'none', validUntil: null },
        },
        effectiveProActive: true,
        accessTierEffective: 'premium',
      });

      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(user),
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('fa:auth:session', '1');
      });

      await page.goto('/profile');
      await page.getByRole('button', { name: 'Billing' }).click();

      await expect(page.getByTestId('pro-start-date')).toContainText(formatDate(plan.start));
      await expect(page.getByTestId('pro-end-date')).toContainText(formatDate(plan.end));
    });
  }

  test('profile billing shows lifetime status without end date', async ({ page }) => {
    const user = buildMockUser({
      _id: 'e2e-ls-lifetime',
      username: 'ls_lifetime',
      email: 'ls-lifetime@example.com',
      accessTier: 'premium',
      billing: {
        pro: { status: 'lifetime' },
        projects: { status: 'none' },
        providers: {
          lemonsqueezy: {
            customerId: 'cust_lifetime',
            subscriptionId: 'sub_lifetime',
            startedAt: '2026-01-01T00:00:00Z',
          },
        },
      },
      entitlements: {
        pro: { status: 'lifetime', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
      effectiveProActive: true,
      accessTierEffective: 'premium',
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('fa:auth:session', '1');
    });

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Billing' }).click();

    await expect(page.getByText('Lifetime', { exact: true })).toBeVisible();
    await expect(page.getByTestId('pro-start-date')).toBeVisible();
    await expect(page.getByTestId('pro-end-date')).toHaveCount(0);
  });
});
