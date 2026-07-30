import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const SERIOUS_IMPACTS = new Set(['serious', 'critical']);
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const OFFLINE_EMAIL_PATH = '/system-design/offline-email-client';
const OFFLINE_EMAIL_H1 = 'Gmail-Style Offline Email Client Frontend System Design';

async function seedAuthenticatedSession(page: any) {
  const token = `e2e-a11y-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-a11y-dashboard-user',
    username: 'a11y_dashboard_user',
    email: 'a11y-dashboard@example.com',
  });

  await installAuthMock(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'secret123' },
  });

  await page.goto('/');
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: page.url(),
  }]);
  await page.evaluate(() => {
    localStorage.setItem('fa:auth:session', '1');
  });
}

function formatViolations(violations: any[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3)
        .map((node: any) => `    - ${node.target.join(', ')}`)
        .join('\n');
      return `${violation.id} (${violation.impact})\n${nodes}`;
    })
    .join('\n');
}

async function expectNoSeriousViolations(page: any, label: string, includeSelector?: string) {
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (includeSelector) builder.include(includeSelector);

  const results = await builder.analyze();
  const seriousViolations = results.violations.filter((violation) => SERIOUS_IMPACTS.has(String(violation.impact || '')));
  expect(seriousViolations, `${label} has serious accessibility violations:\n${formatViolations(seriousViolations)}`).toEqual([]);
}

test.describe('accessibility smoke', () => {
  test.use({
    consoleErrorAllowlist: ['\\/api\\/auth\\/me'],
  });

  test('showcase route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();
    await expectNoSeriousViolations(page, 'showcase route');
  });

  test('login route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'login route', '[data-testid="login-page"]');
  });

  test('pricing route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('.pricing-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'pricing route', '.pricing-page');
  });

  test('guide detail route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/guides/interview-blueprint/intro');
    await expect(page.getByRole('heading', { name: /frontend interview preparation guide/i })).toBeVisible();
    await expectNoSeriousViolations(page, 'guide detail route');
  });

  test('trivia detail route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/javascript/trivia/js-event-loop');
    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await expectNoSeriousViolations(page, 'trivia detail route', '[data-testid="trivia-detail-main"]');
  });

  test('coding detail route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/javascript/coding/js-number-clamp');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'coding detail route', '[data-testid="coding-detail-page"]');
  });

  test('offline email reader and open Overview dialog are accessible by keyboard', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(OFFLINE_EMAIL_PATH);

    await expect(page.getByRole('heading', { level: 1, name: OFFLINE_EMAIL_H1 })).toBeVisible();
    await expectNoSeriousViolations(page, 'offline email reader', '.sdl-root');

    const trigger = page.getByTestId('sd-mobile-overview-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Question overview' });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
    await expectNoSeriousViolations(page, 'offline email Overview dialog', '[role="dialog"]');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('dashboard route has no serious accessibility violations for authenticated users', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'dashboard route', '[data-testid="dashboard-page"]');
  });
});
