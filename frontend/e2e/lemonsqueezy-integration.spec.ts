import { test, expect } from './fixtures';
import { buildMockUser } from './auth-mocks';
import { environment } from '../src/environments/environment';
import {
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
const paymentsMode = resolvePaymentsMode(environment);
const allowLive = process.env.E2E_ALLOW_LIVE_PAYMENTS === 'true';

if (paymentsMode === 'live' && !allowLive) {
  throw new Error('Refusing to run E2E with PAYMENTS_MODE=live. Set E2E_ALLOW_LIVE_PAYMENTS=true to override.');
}

const provider = resolvePaymentsProvider(environment);
const expectedUrlFor = (plan: typeof PLAN_IDS[number]) =>
  resolveCheckoutUrl(provider, plan, environment) || '';
const liveUrls = new Set(
  [
    environment.LEMONSQUEEZY_MONTHLY_URL_LIVE || environment.LEMONSQUEEZY_MONTHLY_URL,
    environment.LEMONSQUEEZY_QUARTERLY_URL_LIVE || environment.LEMONSQUEEZY_QUARTERLY_URL,
    environment.LEMONSQUEEZY_ANNUAL_URL_LIVE || environment.LEMONSQUEEZY_ANNUAL_URL,
  ].filter(Boolean)
);

test.describe('lemonsqueezy integration (local)', () => {
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

  test('billing success polls /api/auth/me and redirects to profile (premium unlock)', async ({ page }) => {
    let meCalls = 0;
    await page.route('**/api/auth/me', async (route) => {
      meCalls += 1;
      const isActive = meCalls >= 3;
      const user = buildMockUser({
        _id: 'e2e-pro-user',
        username: 'pro_user',
        email: 'pro@example.com',
        accessTier: isActive ? 'premium' : 'free',
      });

      const body = {
        ...user,
        entitlements: {
          pro: { status: isActive ? 'active' : 'none', validUntil: null },
          projects: { status: 'none', validUntil: null },
        },
        effectiveProActive: isActive,
        accessTierEffective: isActive ? 'premium' : 'free',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/billing/success');
    await expect(page.getByTestId('billing-success-title')).toBeVisible();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    await page.goto('/tracks');
    await expect(page.getByText('Premium tracks')).toHaveCount(0);
  });

  test('billing success timeout shows email mismatch hint', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      const user = buildMockUser({
        _id: 'e2e-free-user',
        username: 'free_user',
        email: 'free@example.com',
        accessTier: 'free',
      });
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

    await page.addInitScript(() => {
      window.__billingPollConfig = { maxAttempts: 2, intervalMs: 50 };
    });

    await page.goto('/billing/success');
    await expect(page.getByTestId('billing-success-title')).toBeVisible();
    await expect(page.getByTestId('billing-timeout-hint')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('billing-timeout-hint')).toContainText(/different email|support/i);
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

    await page.goto('/tracks');
    await expect(page.getByText('Premium tracks')).toBeVisible();
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
    await page.route('**/api/billing/manage-url', async (route) => {
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

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));

  const subscriptionCases = [
    { label: 'monthly', start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' },
    { label: 'quarterly', start: '2026-01-01T00:00:00Z', end: '2026-04-01T00:00:00Z' },
    { label: 'annual', start: '2026-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
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
});
