import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function seedHeroVariant(page: any, variant: 'control' | 'outcome'): Promise<void> {
  await page.addInitScript((value: string) => {
    try {
      window.localStorage.setItem('fa:exp:assignment:hero_headline_cta_v1', value);
      window.localStorage.setItem('fa:exp:anon_id', 'e2e-seo-fixed-anon');
    } catch {
      // ignore storage failures in constrained browsers
    }
  }, variant);
}

test('showcase: demo CTA routes to the correct question pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('showcase-hero-title')).toBeVisible();

  const openLive = page.getByTestId('showcase-demo-open-live');

  // Default (React)
  await expect(openLive).toHaveAttribute('href', '/react/coding/react-counter');

  // UI → Angular
  await page.getByTestId('showcase-demo-tab-angular').click();
  await expect(openLive).toHaveAttribute('href', '/angular/coding/angular-counter-starter');

  // HTML
  await page.getByTestId('showcase-demo-tab-html').click();
  await expect(openLive).toHaveAttribute('href', '/html/coding/html-links-and-images');

  // JavaScript
  await page.getByTestId('showcase-demo-tab-js').click();
  await expect(openLive).toHaveAttribute('href', '/javascript/coding/js-is-object-empty');
});

test('showcase: baseline pricing loads public metadata, navigates to pricing, and never starts checkout', async ({ page }) => {
  const billingConfigRequests: string[] = [];
  const checkoutRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/api\/billing\/checkout\/config(?:\?|$)/.test(url)) billingConfigRequests.push(url);
    if (/\/api\/billing\/checkout\/start(?:\?|$)/.test(url)) checkoutRequests.push(url);
  });

  await page.goto('/');
  const pricing = page.getByTestId('showcase-landmark-pricing');
  await pricing.scrollIntoViewIfNeeded();
  const monthlyCta = page.getByTestId('pricing-cta-monthly');
  await expect(monthlyCta).toBeVisible();

  // Revealing compact pricing loads the public metadata needed to render
  // authoritative prices, but the baseline offer must not arm checkout.
  await page.waitForTimeout(300);
  expect(billingConfigRequests.length).toBe(1);
  expect(checkoutRequests).toEqual([]);

  await monthlyCta.click();
  await expect(page).toHaveURL(/\/pricing#pricing-plans$/);
  expect(checkoutRequests).toEqual([]);
});

test('showcase: trivia snapshot tabs resolve to real questions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('showcase-hero-title')).toBeVisible();

  await page.getByTestId('showcase-trivia-tab-angular-component').click();

  // Ensure the preview is not in the "Question not found." state.
  await expect(page.locator('#trivia-pane .empty-text')).toHaveCount(0);
  await expect(page.locator('#trivia-pane .title')).toContainText('@Component');

  await expect(page.getByTestId('showcase-trivia-open')).toHaveAttribute(
    'href',
    '/angular/trivia/angular-component-metadata',
  );
});

test('showcase: contact form posts the message to the contact API', async ({ page }) => {
  let postedBody: Record<string, unknown> | undefined;
  await page.route('**/api/contact', async (route) => {
    postedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 204 });
  });
  await page.goto('/');

  await page.locator('[data-load="contact"]').scrollIntoViewIfNeeded();
  const form = page.getByTestId('showcase-contact-form');
  await expect(form).toBeVisible();
  await form.locator('input[name="name"]').fill('Alex Frontend');
  await form.locator('input[name="email"]').fill('alex@example.com');
  await form.locator('textarea[name="message"]').fill('Please add more debugging incidents.');

  const submit = page.getByTestId('showcase-contact-submit');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByTestId('showcase-contact-status')).toContainText('Message sent');
  expect(postedBody).toEqual({
    name: 'Alex Frontend',
    email: 'alex@example.com',
    topic: 'general',
    message: 'Please add more debugging incidents.',
    url: expect.stringMatching(/^https?:\/\//),
  });
});

test.describe('showcase: contact rate limit', () => {
  // The browser logs the mocked 429 itself; every other browser error stays fatal.
  test.use({ consoleErrorAllowlist: ['\\/api\\/contact'] });

  test('showcase: a rate-limited contact submit keeps the draft and offers the email fallback', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '30' },
        body: JSON.stringify({ error: 'Please wait a moment before sending another message.' }),
      });
    });
    await page.goto('/');

    await page.locator('[data-load="contact"]').scrollIntoViewIfNeeded();
    const form = page.getByTestId('showcase-contact-form');
    await expect(form).toBeVisible();

    const message = form.locator('textarea[name="message"]');
    await form.locator('input[name="name"]').fill('Alex Frontend');
    await form.locator('input[name="email"]').fill('alex@example.com');
    await message.fill('Please preserve this draft while sending is rate limited.');

    const submit = page.getByTestId('showcase-contact-submit');
    await submit.click();

    const status = page.getByTestId('showcase-contact-status');
    await expect(status).toContainText('30s');
    await expect(status.getByRole('link', { name: 'Email support directly' })).toHaveAttribute(
      'href',
      'mailto:support@frontendatlas.com',
    );
    await expect(message).toHaveValue('Please preserve this draft while sending is rate limited.');
    await expect(submit).toBeEnabled();
  });
});

test('content: react-counter solution avoids React.useState', async () => {
  const p = join(process.cwd(), 'src/assets/sb/react/solution/react-counter-solution.v1.json');
  const raw = readFileSync(p, 'utf8');
  expect(raw).not.toContain('React.useState');
});

test('showcase: hero experiment keeps the guided plan as the primary CTA', async ({ browser }) => {
  const controlContext = await browser.newContext();
  const controlPage = await controlContext.newPage();
  await seedHeroVariant(controlPage, 'control');
  await controlPage.goto('/');

  const controlH1 = (await controlPage.getByTestId('showcase-hero-title').textContent())?.trim() || '';
  const controlLede = (await controlPage.locator('.showcase-hero .lede').first().textContent())?.trim() || '';
  const controlCta = controlPage.locator('.hero-actions .sk-btn-primary').first();
  const controlCtaLabel = (await controlCta.textContent())?.trim() || '';
  const controlCtaHref = await controlCta.getAttribute('href');

  const outcomeContext = await browser.newContext();
  const outcomePage = await outcomeContext.newPage();
  await seedHeroVariant(outcomePage, 'outcome');
  await outcomePage.goto('/');

  const outcomeH1 = (await outcomePage.getByTestId('showcase-hero-title').textContent())?.trim() || '';
  const outcomeLede = (await outcomePage.locator('.showcase-hero .lede').first().textContent())?.trim() || '';
  const outcomeCta = outcomePage.locator('.hero-actions .sk-btn-primary').first();
  const outcomeCtaLabel = (await outcomeCta.textContent())?.trim() || '';
  const outcomeCtaHref = await outcomeCta.getAttribute('href');

  expect(outcomeH1).toBe(controlH1);
  expect(outcomeLede).toBe(controlLede);
  expect(controlCtaLabel).toBe('Start 30-day plan');
  expect(outcomeCtaLabel).toBe('Start 30-day plan');
  expect(controlCtaHref).toBe('/tracks/foundations-30d/preview');
  expect(outcomeCtaHref).toBe('/tracks/foundations-30d/preview');

  await controlContext.close();
  await outcomeContext.close();
});
