import { defineConfig } from '@playwright/test';
import config from './playwright.config';

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const port = process.env.PLAYWRIGHT_PORT || '4256';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}`;

// Shared auth/interview mocks use these values when seeding browser cookies.
process.env.PLAYWRIGHT_PORT = port;
process.env.PLAYWRIGHT_BASE_URL = baseURL;

export default defineConfig({
  ...config,
  testMatch: ['ui-visual.spec.ts'],
  projects: config.projects?.filter(project => project.name === 'chromium'),
  retries: 0,
  workers: 3,
  // Reference images must be explicitly regenerated and reviewed. In
  // particular, a missing Linux image must never be accepted by a CI run.
  updateSnapshots: 'none',
  use: {
    ...config.use,
    baseURL,
    headless: true,
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  webServer: {
    command: `node scripts/start-e2e-server.mjs --host ${host} --port ${port}`,
    env: { PLAYWRIGHT_SSR: '1' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
