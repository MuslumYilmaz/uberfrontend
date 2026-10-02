import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  metadata: { primeSsrComparison: true },
  testMatch: ['prime-ssr-styles.prod.spec.ts', 'upgrade-controls.spec.ts'],
  use: { ...config.use, baseURL: 'http://127.0.0.1:4256', headless: true },
  webServer: {
    command: 'node scripts/serve-prime-ssr-comparison.mjs',
    url: 'http://127.0.0.1:4256',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
