import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const SERIOUS_IMPACTS = new Set(['serious', 'critical']);

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

  test('dashboard route has no serious accessibility violations for authenticated users', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'dashboard route', '[data-testid="dashboard-page"]');
  });
});
