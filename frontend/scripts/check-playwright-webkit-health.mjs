import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { webkit } from '@playwright/test';

function compareVersions(left, right) {
  const leftParts = left.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }
    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function readStdout(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function getMacOsVersionMismatch() {
  if (process.platform !== 'darwin') {
    return null;
  }

  const executablePath = webkit.executablePath();
  if (!executablePath) {
    return null;
  }

  const infoPlistPath = path.resolve(path.dirname(executablePath), 'Playwright.app', 'Contents', 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    return null;
  }

  const requiredVersion = readStdout('defaults', ['read', infoPlistPath.replace(/\.plist$/, ''), 'LSMinimumSystemVersion']);
  const currentVersion = readStdout('sw_vers', ['-productVersion']);

  if (!requiredVersion || !currentVersion) {
    return null;
  }

  if (compareVersions(currentVersion, requiredVersion) >= 0) {
    return null;
  }

  return { currentVersion, requiredVersion };
}

let browser;
const macOsVersionMismatch = getMacOsVersionMismatch();

try {
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('data:text/html,<title>webkit-ok</title>');
  await context.close();

  console.log('[playwright-webkit-health] OK: Local Playwright WebKit launched successfully.');
} catch (error) {
  console.error('[playwright-webkit-health] ERROR: Local Playwright WebKit could not launch.');
  console.error('[playwright-webkit-health] This machine cannot run the optional Safari/WebKit E2E coverage.');
  if (macOsVersionMismatch) {
    console.error(
      `[playwright-webkit-health] Detected macOS ${macOsVersionMismatch.currentVersion}, but the installed Playwright WebKit bundle requires macOS ${macOsVersionMismatch.requiredVersion} or newer.`,
    );
    console.error('[playwright-webkit-health] Upgrade macOS or use an older local Playwright/WebKit build. The repo is currently pinned to a browser build that targets a newer macOS runtime.');
  }
  console.error('[playwright-webkit-health] Fix the local browser runtime or set PRE_PUSH_ALLOW_MISSING_WEBKIT=1 to continue with Chromium-only critical E2E.');
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
