import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../fixtures';

type LongTaskEntry = {
  name: string;
  startTime: number;
  duration: number;
};

declare global {
  interface Window {
    __perfLongTasks?: LongTaskEntry[];
    __perfStart?: number;
  }
}

const MAX_LONG_TASK_MS = 250;
const MAX_LONG_TASK_JITTER_MS = 10;
const TOTAL_LONG_TASK_MS = 1500;
const TOTAL_BLOCKING_TIME_MS = 800;
const CPU_THROTTLE_RATE = 4;
const OBSERVATION_WINDOW_MS = 10_000;

test.describe.configure({ mode: 'serial' });

test.describe('showcase perf smoke', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('long tasks stay within budget under CPU throttling', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only perf smoke');
    test.setTimeout(120_000);

    const perfDir = path.resolve('test-results', 'perf');
    fs.mkdirSync(perfDir, { recursive: true });

    const tracePath = path.join(perfDir, 'showcase-trace.zip');
    const reportPath = path.join(perfDir, 'showcase.longtasks.json');
    const screenshotPath = path.join(perfDir, 'showcase.png');
    const failShotPath = path.join(perfDir, 'showcase-fail.png');

    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

    await page.addInitScript(() => {
      window.__perfLongTasks = [];
      window.__perfStart = performance.now();
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__perfLongTasks?.push({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    });

    let report: Record<string, unknown> | null = null;
    let reportWritten = false;

    try {
      await page.goto('/showcase', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await expect(page.getByTestId('showcase-hero-title')).toBeVisible({ timeout: 60_000 });

      await page.waitForFunction(
        () => typeof window.__perfStart === 'number' && performance.now() - window.__perfStart >= 10_000,
        null,
        { timeout: 20_000 }
      );

      const rawTasks = await page.evaluate(() => window.__perfLongTasks || []);
      const start = await page.evaluate(() => window.__perfStart || 0);
      const tasks = rawTasks.filter((task) => task.startTime - start <= OBSERVATION_WINDOW_MS);

      const maxLongTask = tasks.reduce((max, task) => Math.max(max, task.duration), 0);
      const totalLongTaskTime = tasks.reduce((sum, task) => sum + task.duration, 0);
      const totalBlockingTime = tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);

      report = {
        url: page.url(),
        throttlingRate: CPU_THROTTLE_RATE,
        timestamp: new Date().toISOString(),
        budgets: {
          MAX_LONG_TASK_MS,
          MAX_LONG_TASK_JITTER_MS,
          TOTAL_LONG_TASK_MS,
          TOTAL_BLOCKING_TIME_MS,
        },
        metrics: {
          maxLongTask,
          totalLongTaskTime,
          totalBlockingTime,
          taskCount: tasks.length,
        },
        tasks,
      };

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      reportWritten = true;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(
        `[perf] showcase longtasks: max=${maxLongTask.toFixed(1)}ms ` +
          `total=${totalLongTaskTime.toFixed(1)}ms tbt=${totalBlockingTime.toFixed(1)}ms`
      );

      expect(maxLongTask).toBeLessThanOrEqual(MAX_LONG_TASK_MS + MAX_LONG_TASK_JITTER_MS);
      expect(totalLongTaskTime).toBeLessThanOrEqual(TOTAL_LONG_TASK_MS);
      expect(totalBlockingTime).toBeLessThanOrEqual(TOTAL_BLOCKING_TIME_MS);
    } catch (error) {
      if (!reportWritten) {
        report = {
          url: page.url(),
          throttlingRate: CPU_THROTTLE_RATE,
          timestamp: new Date().toISOString(),
          budgets: {
            MAX_LONG_TASK_MS,
            MAX_LONG_TASK_JITTER_MS,
            TOTAL_LONG_TASK_MS,
            TOTAL_BLOCKING_TIME_MS,
          },
          metrics: null,
          tasks: [],
          error: String(error),
        };
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      }
      await page.screenshot({ path: failShotPath, fullPage: true });
      throw error;
    } finally {
      await context.tracing.stop({ path: tracePath });
    }
  });
});
