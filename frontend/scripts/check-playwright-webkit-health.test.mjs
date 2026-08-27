import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WEBKIT_HEALTH_CODES,
  classifyWebKitPreflight,
  compareVersions,
  probeWebKitLaunch,
  readWebKitExecutablePath,
  resolveWebKitInfoPlist,
} from './check-playwright-webkit-health.mjs';

test('compares dotted platform versions numerically', () => {
  assert.equal(compareVersions('14.5', '14.5.0'), 0);
  assert.equal(compareVersions('14.10', '14.5'), 1);
  assert.equal(compareVersions('14.2.1', '14.5'), -1);
});

test('resolves the WebKit app plist next to the Playwright launcher', () => {
  const resolved = resolveWebKitInfoPlist('/cache/webkit-1234/pw_run.sh');
  assert.equal(resolved, '/cache/webkit-1234/Playwright.app/Contents/Info.plist');
});

test('classifies a missing browser without attempting launch', () => {
  assert.deepEqual(classifyWebKitPreflight({
    platform: 'linux',
    executablePath: '/cache/webkit/pw_run.sh',
    executableExists: false,
  }), {
    ok: false,
    code: WEBKIT_HEALTH_CODES.NOT_INSTALLED,
  });
});

test('classifies an incompatible macOS runtime with stable diagnostics', () => {
  assert.deepEqual(classifyWebKitPreflight({
    platform: 'darwin',
    executablePath: '/cache/webkit/pw_run.sh',
    executableExists: true,
    currentVersion: '14.2.1',
    requiredVersion: '14.5',
  }), {
    ok: false,
    code: WEBKIT_HEALTH_CODES.OS_INCOMPATIBLE,
    currentVersion: '14.2.1',
    requiredVersion: '14.5',
  });
});

test('allows compatible and non-macOS runtimes to proceed to launch', () => {
  assert.deepEqual(classifyWebKitPreflight({
    platform: 'darwin',
    executablePath: '/cache/webkit/pw_run.sh',
    executableExists: true,
    currentVersion: '14.5',
    requiredVersion: '14.5',
  }), { ok: true, code: null });

  assert.deepEqual(classifyWebKitPreflight({
    platform: 'linux',
    executablePath: '/cache/webkit/pw_run.sh',
    executableExists: true,
  }), { ok: true, code: null });
});

test('redacts executable-path inspection failures behind a stable code', () => {
  assert.deepEqual(readWebKitExecutablePath({
    executablePath() {
      throw new Error('provider path and stack must not escape');
    },
  }), {
    ok: false,
    code: WEBKIT_HEALTH_CODES.LAUNCH_FAILED,
  });
});

test('redacts WebKit launch failures behind a stable code', async () => {
  assert.deepEqual(await probeWebKitLaunch({
    async launch() {
      throw new Error('browser launch stack must not escape');
    },
  }), {
    ok: false,
    code: WEBKIT_HEALTH_CODES.LAUNCH_FAILED,
  });
});
