import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const useWebServer = process.env.PLAYWRIGHT_WEB_SERVER === '1';
// Keep critical E2E deterministic across local and CI by defaulting to Chromium.
// WebKit remains opt-in via PLAYWRIGHT_ENABLE_WEBKIT=1 when explicitly requested.
const includeWebkit = process.env.PLAYWRIGHT_ENABLE_WEBKIT === '1';
const webHost = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const webPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '4200', 10);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${webHost}:${webPort}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === '1'
    ? true
    : process.env.PLAYWRIGHT_REUSE_SERVER === '0'
      ? false
      : !isCI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL,
    headless: isCI,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: useWebServer
    ? {
      command: `npm run start:e2e -- --host ${webHost} --port ${webPort}`,
      url: baseURL,
      reuseExistingServer,
      timeout: 180_000,
    }
    : undefined,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(includeWebkit
      ? [
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ]
      : []),
  ],
});
