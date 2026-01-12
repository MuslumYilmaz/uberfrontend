import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const useWebServer = process.env.PLAYWRIGHT_WEB_SERVER === '1';
const includeWebkit = isCI || process.env.PLAYWRIGHT_ENABLE_WEBKIT === '1';

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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',
    headless: isCI,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: useWebServer
    ? {
      command: 'npm run start:e2e',
      url: 'http://localhost:4200',
      reuseExistingServer: !isCI,
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
