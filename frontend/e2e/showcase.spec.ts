import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

