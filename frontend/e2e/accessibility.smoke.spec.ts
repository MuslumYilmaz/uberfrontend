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
    const similarToggle = page.getByRole('button', { name: 'Similar questions' });
    await expect(similarToggle).toHaveAttribute('aria-expanded', 'true');
    await similarToggle.focus();
    await page.keyboard.press('Space');
    await expect(similarToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#similar-questions-panel')).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(similarToggle).toHaveAttribute('aria-expanded', 'true');
    await expectNoSeriousViolations(page, 'trivia detail route', '[data-testid="trivia-detail-main"]');
  });

  test('coding detail route has no serious accessibility violations', async ({ page }) => {
    await page.goto('/javascript/coding/js-number-clamp');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible();
    await expectNoSeriousViolations(page, 'coding detail route', '[data-testid="coding-detail-page"]');
  });

  test('modal incident supports a named radio workflow and announced feedback', async ({ page }) => {
    await page.goto('/incidents/modal-screen-reader-failure');
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'Modal opens visually but fails screen-reader users',
    })).toBeVisible();

    await page.getByRole('button', { name: 'Begin simulator' }).click();

    const group = page.getByRole('radiogroup', { name: 'What is actually broken here?' });
    const radios = group.getByRole('radio');
    await expect(radios).toHaveCount(4);
    await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(radios.nth(2)).toHaveAttribute('tabindex', '-1');
    await expect(radios.nth(3)).toHaveAttribute('tabindex', '-1');

    await radios.first().focus();
    await page.keyboard.press('End');
    const correctOption = radios.last();
    await expect(correctOption).toBeFocused();
    await expect(correctOption).toHaveAttribute('aria-checked', 'true');
    await expect(correctOption).toHaveAttribute('tabindex', '0');

    await page.getByRole('button', { name: 'Submit response' }).click();
    await expect(page.getByRole('status')).toContainText(
      'Stage 1: likely root cause. Strong call. Score 25 out of 25.',
    );
    await expect(page.getByRole('button', { name: 'Next stage' })).toBeFocused();
    await expect(page.locator('.incident-step-nav__item[aria-current="step"]')).toHaveCount(1);
    await expectNoSeriousViolations(page, 'modal accessibility incident', '.incident-detail-shell');
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
