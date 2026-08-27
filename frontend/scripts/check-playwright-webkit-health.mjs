import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const WEBKIT_HEALTH_CODES = Object.freeze({
  NOT_INSTALLED: 'WEBKIT_NOT_INSTALLED',
  OS_INCOMPATIBLE: 'WEBKIT_OS_INCOMPATIBLE',
  LAUNCH_FAILED: 'WEBKIT_LAUNCH_FAILED',
});

export function compareVersions(left, right) {
  const leftParts = String(left || '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = String(right || '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

export function resolveWebKitInfoPlist(executablePath) {
  if (!executablePath) return null;
  return path.resolve(path.dirname(executablePath), 'Playwright.app', 'Contents', 'Info.plist');
}

export function classifyWebKitPreflight({
  platform,
  executablePath,
  executableExists,
  currentVersion = null,
  requiredVersion = null,
}) {
  if (!executablePath || !executableExists) {
    return { ok: false, code: WEBKIT_HEALTH_CODES.NOT_INSTALLED };
  }

  if (
    platform === 'darwin'
    && currentVersion
    && requiredVersion
    && compareVersions(currentVersion, requiredVersion) < 0
  ) {
    return {
      ok: false,
      code: WEBKIT_HEALTH_CODES.OS_INCOMPATIBLE,
      currentVersion,
      requiredVersion,
    };
  }

  return { ok: true, code: null };
}

export function readWebKitExecutablePath(webkit) {
  try {
    const executablePath = webkit?.executablePath?.();
    return {
      ok: true,
      code: null,
      executablePath: typeof executablePath === 'string' ? executablePath : '',
    };
  } catch {
    return { ok: false, code: WEBKIT_HEALTH_CODES.LAUNCH_FAILED };
  }
}

export async function probeWebKitLaunch(webkit) {
  let browser;
  try {
    browser = await webkit.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('data:text/html,<title>webkit-ok</title>');
    await context.close();
    return { ok: true, code: null };
  } catch {
    return { ok: false, code: WEBKIT_HEALTH_CODES.LAUNCH_FAILED };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

function readStdout(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function readMacOsVersions(executablePath) {
  if (process.platform !== 'darwin') return {};
  const infoPlistPath = resolveWebKitInfoPlist(executablePath);
  if (!infoPlistPath || !fs.existsSync(infoPlistPath)) return {};

  return {
    currentVersion: readStdout('sw_vers', ['-productVersion']) || null,
    requiredVersion: readStdout('plutil', [
      '-extract',
      'LSMinimumSystemVersion',
      'raw',
      '-o',
      '-',
      infoPlistPath,
    ]) || null,
  };
}

function printFailure(result) {
  if (result.code === WEBKIT_HEALTH_CODES.NOT_INSTALLED) {
    console.error(
      `[playwright-webkit-health] ${result.code}: Playwright WebKit is not installed.`,
    );
    console.error('[playwright-webkit-health] Run: npx playwright install webkit');
    return;
  }

  if (result.code === WEBKIT_HEALTH_CODES.OS_INCOMPATIBLE) {
    console.error(
      `[playwright-webkit-health] ${result.code}: macOS ${result.currentVersion} cannot run the installed Playwright WebKit bundle (minimum macOS ${result.requiredVersion}).`,
    );
    console.error('[playwright-webkit-health] Upgrade macOS or use Linux CI for the pinned WebKit evidence.');
    return;
  }

  console.error(
    `[playwright-webkit-health] ${WEBKIT_HEALTH_CODES.LAUNCH_FAILED}: Playwright WebKit is installed but could not launch.`,
  );
  console.error('[playwright-webkit-health] Repair the local Playwright browser runtime and retry.');
}

export async function runWebKitHealthCheck() {
  let webkit;
  try {
    ({ webkit } = await import('@playwright/test'));
  } catch {
    const result = { ok: false, code: WEBKIT_HEALTH_CODES.NOT_INSTALLED };
    printFailure(result);
    return result;
  }

  const executable = readWebKitExecutablePath(webkit);
  if (!executable.ok) {
    printFailure(executable);
    return executable;
  }
  const { executablePath } = executable;
  const preflight = classifyWebKitPreflight({
    platform: process.platform,
    executablePath,
    executableExists: Boolean(executablePath && fs.existsSync(executablePath)),
    ...readMacOsVersions(executablePath),
  });
  if (!preflight.ok) {
    printFailure(preflight);
    return preflight;
  }

  const launch = await probeWebKitLaunch(webkit);
  if (launch.ok) {
    console.log('[playwright-webkit-health] OK: Local Playwright WebKit launched successfully.');
    return launch;
  }
  printFailure(launch);
  return launch;
}

function isDirectExecution() {
  const entry = process.argv[1];
  return Boolean(entry && pathToFileURL(path.resolve(entry)).href === import.meta.url);
}

if (isDirectExecution()) {
  const result = await runWebKitHealthCheck();
  if (!result.ok) process.exitCode = 1;
}
