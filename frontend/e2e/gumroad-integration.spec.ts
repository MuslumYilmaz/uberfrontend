import { test, expect } from './fixtures';
import { buildMockUser } from './auth-mocks';

declare global {
  interface Window {
    __lastAssignedUrl?: string;
    __faCheckoutRedirect?: (url: string) => void;
    __lastOpenedUrl?: string;
    __billingPollConfig?: { maxAttempts: number; intervalMs: number };
  }
}

const PLANS = ['monthly', 'quarterly', 'annual'] as const;

test.describe('gumroad integration (local)', () => {
  test('pricing CTA triggers gumroad redirect intent without navigation', async ({ page }) => {
    let gumroadRequests = 0;
    await page.route(/gumroad\.com/, (route) => {
      gumroadRequests += 1;
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

    await page.addInitScript(() => {
      localStorage.setItem('fa:auth:session', '1');
      window.__lastAssignedUrl = '';
      window.__faCheckoutRedirect = (url: string) => {
        window.__lastAssignedUrl = String(url);
      };
    });

    await page.goto('/pricing');
    await expect(page.getByTestId('pricing-cta-monthly')).toBeVisible();

    for (const plan of PLANS) {
      await page.evaluate(() => {
        window.__lastAssignedUrl = '';
      });

      await page.getByTestId(`pricing-cta-${plan}`).click();

      await expect
        .poll(() => page.evaluate(() => window.__lastAssignedUrl || ''))
        .toContain('gumroad.com');
    }

    expect(gumroadRequests).toBe(0);
    await expect(page).toHaveURL(/\/pricing/);
  });

  test.describe('logged-out checkout', () => {
    test.use({
      consoleErrorAllowlist: ['Failed to load resource: .*api/auth/me'],
    });

    test('pricing CTA redirects to login when logged out', async ({ page }) => {
      await page.route(/gumroad\.com/, (route) => route.abort());
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid or expired token' }),
        });
      });

      await page.addInitScript(() => {
        localStorage.removeItem('fa:auth:session');
        window.__faCheckoutRedirect = () => void 0;
      });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-monthly').click();
      await expect(page.getByTestId('login-required-title')).toBeVisible();
      await expect(page).toHaveURL(/\/pricing/);
    });
  });

  test.describe('overlay blocked', () => {
    test.use({
      consoleErrorAllowlist: ['Failed to load resource: .*gumroad.com/js/gumroad.js'],
    });

    test('pricing CTA shows fallback notice when overlay is blocked', async ({ page }) => {
      await page.route(/gumroad\.com/, (route) => route.abort());

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

      await page.addInitScript(() => {
        localStorage.setItem('fa:auth:session', '1');
        window.__lastOpenedUrl = '';
        window.open = (url?: string | URL, target?: string, features?: string) => {
          window.__lastOpenedUrl = String(url || '');
          return null;
        };
      });

      await page.goto('/pricing');
      await page.getByTestId('pricing-cta-monthly').click();

      await expect(page.getByTestId('checkout-notice')).toContainText(/new tab|popups/i);
      await expect
        .poll(() => page.evaluate(() => window.__lastOpenedUrl || ''))
        .toContain('gumroad.com');
    });
  });

  test('billing success polls /api/auth/me and redirects to profile', async ({ page }) => {
    let gumroadRequests = 0;
    await page.route(/gumroad\.com/, (route) => {
      gumroadRequests += 1;
      return route.abort();
    });

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
    expect(gumroadRequests).toBe(0);
  });

  test('billing success timeout shows email mismatch hint', async ({ page }) => {
    await page.route(/gumroad\.com/, (route) => route.abort());
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
    let gumroadRequests = 0;
    await page.route(/gumroad\.com/, (route) => {
      gumroadRequests += 1;
      return route.abort();
    });

    await page.addInitScript(() => {
      window.__faCheckoutRedirect = () => void 0;
    });

    await page.goto('/billing/cancel');
    await expect(page.getByTestId('billing-cancel-title')).toBeVisible();
    await page.getByRole('link', { name: /back to pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing/);
    expect(gumroadRequests).toBe(0);
  });
});
