import { expect as baseExpect, test as baseTest, type ConsoleMessage, type Page, type TestInfo } from '@playwright/test';
import { CONSOLE_ERROR_ALLOWLIST } from './console-allowlist';

type CollectedIssue = {
  type: 'console.error' | 'pageerror' | 'unhandledrejection';
  message: string;
};

function compileAllowlist(patterns: string[] | undefined): RegExp[] {
  const safe = Array.isArray(patterns) ? patterns : [];
  return safe.map((source) => new RegExp(source, 'i'));
}

function isAllowlisted(message: string, extraAllowlist: RegExp[]): boolean {
  return [...CONSOLE_ERROR_ALLOWLIST, ...extraAllowlist].some((re) => re.test(message));
}

function formatConsoleMessage(msg: ConsoleMessage): string {
  const loc = msg.location();
  const locStr = loc?.url ? ` (${loc.url}:${loc.lineNumber ?? 0}:${loc.columnNumber ?? 0})` : '';
  return `${msg.text()}${locStr}`;
}

async function installUnhandledRejectionHook(page: Page, issues: CollectedIssue[]) {
  await page.exposeFunction('__pwReportUnhandledRejection', (reason: unknown) => {
    const message = typeof reason === 'string' ? reason : (() => {
      try { return JSON.stringify(reason); } catch { return String(reason); }
    })();
    issues.push({ type: 'unhandledrejection', message });
  });

  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', (event) => {
      // @ts-expect-error - injected by Playwright
      window.__pwReportUnhandledRejection(event.reason);
    });
  });
}

async function attachAndFailIfNeeded(testInfo: TestInfo, issues: CollectedIssue[], extraAllowlist: RegExp[]) {
  const relevant = issues.filter((i) => !(i.type === 'console.error' && isAllowlisted(i.message, extraAllowlist)));
  if (!relevant.length) return;

  const body = relevant
    .map((i) => `[${i.type}] ${i.message}`)
    .join('\n');

  await testInfo.attach('browser-issues', {
    body,
    contentType: 'text/plain',
  });

  throw new Error(`Browser emitted ${relevant.length} error(s). See attachment: browser-issues`);
}

export const test = baseTest.extend<{
  consoleErrorAllowlist: string[];
}>({
  consoleErrorAllowlist: [[], { option: true }],
  page: async ({ page, consoleErrorAllowlist }, use, testInfo) => {
    const issues: CollectedIssue[] = [];
    const extraAllowlist = compileAllowlist(consoleErrorAllowlist);

    // Default to local assets in E2E for determinism (tests can opt-in per spec).
    await page.addInitScript(() => {
      try { localStorage.setItem('fa:cdn:enabled', '0'); } catch { /* ignore */ }
    });

    // Stub external fonts to avoid flaky network timeouts/console errors.
    await page.route('https://fonts.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/css; charset=utf-8',
        body: '/* e2e stub: fonts disabled */',
      });
    });

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      issues.push({ type: 'console.error', message: formatConsoleMessage(msg) });
    });

    page.on('pageerror', (err) => {
      issues.push({ type: 'pageerror', message: String(err?.stack || err) });
    });

    await installUnhandledRejectionHook(page, issues);

    await use(page);

    await attachAndFailIfNeeded(testInfo, issues, extraAllowlist);
  },
});

export const expect = baseExpect;
