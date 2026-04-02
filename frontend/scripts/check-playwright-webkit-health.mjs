import { webkit } from '@playwright/test';

let browser;

try {
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('data:text/html,<title>webkit-ok</title>');
  await context.close();

  console.log('[playwright-webkit-health] OK: Local Playwright WebKit launched successfully.');
} catch (error) {
  console.error('[playwright-webkit-health] ERROR: Local Playwright WebKit could not launch.');
  console.error('[playwright-webkit-health] This machine cannot verify the same browser matrix that GitHub runs for Playwright Critical.');
  console.error('[playwright-webkit-health] Fix the local browser runtime or set PRE_PUSH_ALLOW_MISSING_WEBKIT=1 if you intentionally want to rely on GitHub for WebKit coverage.');
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }
}
