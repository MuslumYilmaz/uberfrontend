import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

// The JavaScript coding tasks, all and free, from the catalog the list is built from. The prerendered list says
// "159 matches" for every technology, so the JavaScript count shows the browser has taken over the page.
const JAVASCRIPT_CODING = (
  JSON.parse(readFileSync(join(process.cwd(), '../cdn/questions/javascript/coding.json'), 'utf8')) as Array<{
    type?: string;
    access?: string;
  }>
).filter((question) => question.type === 'coding');
const FREE_JAVASCRIPT_CODING_TASKS = JAVASCRIPT_CODING.filter((question) => question.access === 'free').length;

// A guest's /api/auth/me answers 401, which the browser logs.
test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

test('a guest on a Premium task sees the price where they are, and the footer walks on to free work', async ({ page }) => {
  // Registered after the fixture's list-price config, so this one answers: a visitor in India.
  await page.route(/\/api\/billing\/checkout\/config(?:\?.*)?$/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify({
      configuredProvider: null,
      provider: null,
      mode: 'test',
      enabled: false,
      plans: { monthly: false, quarterly: false, annual: false, lifetime: false },
      planDetails: {
        monthly: { amountCents: 2400, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: false },
        annual: { amountCents: 9900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: false },
      },
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
      pricing: {
        student: null,
        regional: { countryCode: 'IN', countryName: 'India', multiplier: 0.4, prices: { monthly: 960, annual: 3960 } },
      },
    }),
  }));

  await page.goto('/javascript/coding/js-throttle');
  await expect(page.getByTestId('coding-locked-price'))
    .toHaveText('Premium is $9.60 a month or $39.60 a year (prices for India).');

  // The lock page keeps a footer, and its Next steps over Premium tasks to one this visitor can open.
  const next = page.getByTestId('coding-locked-footer').getByTestId('footer-next');
  await expect(next).toBeVisible();
  await expect(next).toContainText('Next free task');
  await next.click();
  await expect(page).not.toHaveURL(/js-throttle/);
  await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('coding-locked-footer')).toHaveCount(0);
});

test('past the last free React task, Next opens the next Premium task and its price instead of going dead', async ({ page }) => {
  // react-counter is the homepage demo and the last free React task in the practice order.
  await page.goto('/react/coding/react-counter');
  await expect(page.getByTestId('coding-workspace-panel')).toBeVisible({ timeout: 30_000 });
  const next = page.getByTestId('practice-footer').getByTestId('footer-next');
  await expect(next).toBeEnabled();
  await expect(next).toContainText('Next Premium task');

  await next.click();
  await expect(page).not.toHaveURL(/react-counter$/);
  await expect(page.getByTestId('coding-locked-price')).toContainText('Premium is $');
  // Back from that lock page, Prev steps over any other lock to free work.
  const prev = page.getByTestId('coding-locked-footer').getByTestId('footer-prev');
  await expect(prev).toBeEnabled();
  await prev.click();
  await expect(page.getByTestId('coding-locked-price')).toHaveCount(0);
});

test('Free only hides the tasks a guest would meet a lock on, and stays on for the next visit', async ({ page }) => {
  await page.goto('/coding?tech=javascript');
  const results = page.getByTestId('coding-list-results');
  // A click before hydration reaches no handler, so wait for the browser's own count first.
  await expect(results.locator('.fa-count-badge')).toHaveText(new RegExp(`^\\s*${JAVASCRIPT_CODING.length} matches\\s*$`));
  const lockedRows = results.locator('fa-question-row').filter({ has: page.locator('.fa-question-row__locked') });
  await expect(lockedRows.first()).toBeVisible({ timeout: 15_000 });

  const toggle = page.getByTestId('coding-list-free-only');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(lockedRows).toHaveCount(0);
  expect(FREE_JAVASCRIPT_CODING_TASKS).toBeGreaterThan(0);
  await expect(results.locator('.fa-count-badge')).toHaveText(new RegExp(`^\\s*${FREE_JAVASCRIPT_CODING_TASKS} matches\\s*$`));

  await page.reload();
  await expect(page.getByTestId('coding-list-free-only')).toHaveAttribute('aria-pressed', 'true');
  await expect(results.locator('.fa-count-badge')).toHaveText(new RegExp(`^\\s*${FREE_JAVASCRIPT_CODING_TASKS} matches\\s*$`));
  await expect(lockedRows).toHaveCount(0);
});

test('a task opened from a plan day counts through that day and leads back to the plan', async ({ page }) => {
  await page.goto('/tracks/foundations-30d/preview');
  await page.locator('.day-card a[href="/javascript/coding/js-count-vowels"]').click();
  await expect(page).toHaveURL(/\/javascript\/coding\/js-count-vowels$/);

  const footer = page.getByTestId('practice-footer');
  await expect(footer).toContainText('Day 1 · 3 / 4');
  await expect(footer.getByRole('link', { name: 'Back to plan' })).toHaveAttribute('href', '/tracks/foundations-30d/preview');
});
