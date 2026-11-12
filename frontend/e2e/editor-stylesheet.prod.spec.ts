import { expect, test } from './fixtures';

// A free framework task, whose page opens the Monaco editor for every visitor.
const PAGE = '/react/coding/react-counter';
const EDITOR_STYLESHEET = '**/assets/monaco/min/vs/editor/editor.main.css';

// The browser logs each request these tests abort, and a guest's /api/auth/me answers 401.
test.use({
  consoleErrorAllowlist: ['Failed to load resource: net::ERR_(FAILED|BLOCKED_BY_CLIENT)', '\\/api\\/auth\\/me'],
});

test('one dropped request for the editor stylesheet is made again, and the editor still opens', async ({ page }) => {
  let requests = 0;
  await page.route(EDITOR_STYLESHEET, (route) => {
    requests += 1;
    return requests === 1 ? route.abort('failed') : route.fallback();
  });

  await page.goto(PAGE);

  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByLabel('Framework code editor fallback')).toHaveCount(0);
  expect(requests).toBe(2);
});

test('a browser that blocks stylesheets, fonts and images gets the plain text editor, not an unstyled one', async ({ page }) => {
  // Like the scraper whose editor failure reached Sentry: it never requested a stylesheet, font or image.
  await page.route('**/*', (route) => (
    ['stylesheet', 'font', 'image'].includes(route.request().resourceType())
      ? route.abort('blockedbyclient')
      : route.fallback()
  ));

  await page.goto(PAGE);

  await expect(page.getByLabel('Framework code editor fallback')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.monaco-editor')).toHaveCount(0);
});
