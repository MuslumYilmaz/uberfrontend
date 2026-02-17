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

  // Default (UI → React)
  await expect(openLive).toHaveAttribute('href', '/react/coding/react-counter');

  // UI → Angular
  await page.getByTestId('showcase-demo-tab-ui').click();
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

test('content: react-counter solution avoids React.useState', async () => {
  const p = join(process.cwd(), 'src/assets/sb/react/solution/react-counter-solution.v1.json');
  const raw = readFileSync(p, 'utf8');
  expect(raw).not.toContain('React.useState');
});

test('showcase: hero experiment changes CTA copy only', async ({ browser }) => {
  const controlContext = await browser.newContext();
  const controlPage = await controlContext.newPage();
  await seedHeroVariant(controlPage, 'control');
  await controlPage.goto('/');

  const controlH1 = (await controlPage.getByTestId('showcase-hero-title').textContent())?.trim() || '';
  const controlLede = (await controlPage.locator('.showcase-hero .lede').first().textContent())?.trim() || '';
  const controlCta = (await controlPage.locator('.hero-actions .sk-btn-primary').first().textContent())?.trim() || '';

  const outcomeContext = await browser.newContext();
  const outcomePage = await outcomeContext.newPage();
  await seedHeroVariant(outcomePage, 'outcome');
  await outcomePage.goto('/');

  const outcomeH1 = (await outcomePage.getByTestId('showcase-hero-title').textContent())?.trim() || '';
  const outcomeLede = (await outcomePage.locator('.showcase-hero .lede').first().textContent())?.trim() || '';
  const outcomeCta = (await outcomePage.locator('.hero-actions .sk-btn-primary').first().textContent())?.trim() || '';

  expect(outcomeH1).toBe(controlH1);
  expect(outcomeLede).toBe(controlLede);
  expect(controlCta).toBe('Start free challenge');
  expect(outcomeCta).toBe('Try 2-minute challenge');

  await controlContext.close();
  await outcomeContext.close();
});
