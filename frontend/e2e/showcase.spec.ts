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

async function installTurnstileStub(page: any): Promise<void> {
  await page.addInitScript(() => {
    const widgets = new Map<string, any>();
    let widgetSequence = 0;

    (window as any).turnstile = {
      render(container: string | HTMLElement, options: any) {
        const element = typeof container === 'string'
          ? document.querySelector(container)
          : container;
        const widgetId = `e2e-turnstile-${++widgetSequence}`;
        widgets.set(widgetId, options);
        element?.setAttribute('data-turnstile-stub', 'ready');
        window.setTimeout(() => options.callback?.(`e2e-token-${widgetSequence}`), 0);
        return widgetId;
      },
      reset(widgetId: string) {
        const options = widgets.get(widgetId);
        window.setTimeout(() => options?.callback?.(`e2e-token-${++widgetSequence}`), 0);
      },
      remove(widgetId: string) {
        widgets.delete(widgetId);
      },
    };
  });
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

test('showcase: contact form requires verification and sends the anti-spam payload', async ({ page }) => {
  await installTurnstileStub(page);
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
  expect(postedBody).toEqual(expect.objectContaining({
    name: 'Alex Frontend',
    email: 'alex@example.com',
    message: 'Please add more debugging incidents.',
    website: '',
  }));
  expect(String(postedBody?.['verificationToken'] || '')).toMatch(/^e2e-token-/);
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
