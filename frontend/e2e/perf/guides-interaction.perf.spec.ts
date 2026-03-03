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
    __perfWindowStart?: number;
  }
}

const CPU_THROTTLE_RATE = 4;

const HOVER_MAX_LONG_TASK_MS = 180;
const HOVER_MAX_LONG_TASK_JITTER_MS = 10;
const HOVER_TOTAL_LONG_TASK_MS = 900;
const HOVER_TOTAL_BLOCKING_TIME_MS = 500;
const HOVER_WINDOW_MS = 6_000;

const ROUTING_WARMUP_RUNS = 2;
const ROUTING_MEASURE_RUNS = 7;
const ROUTING_P75_TARGET_MS = 350;

function percentile75(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
  return sorted[index];
}

test.describe.configure({ mode: 'serial' });

test.describe('guides interaction perf smoke', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('hover interaction stays within long-task budget', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only perf smoke');
    test.setTimeout(120_000);

    const perfDir = path.resolve('test-results', 'perf');
    fs.mkdirSync(perfDir, { recursive: true });

    const tracePath = path.join(perfDir, 'guides-hover-trace.zip');
    const reportPath = path.join(perfDir, 'guides-hover.longtasks.json');
    const screenshotPath = path.join(perfDir, 'guides-hover.png');
    const failShotPath = path.join(perfDir, 'guides-hover-fail.png');

    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

    await page.addInitScript(() => {
      window.__perfLongTasks = [];
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

    try {
      await page.goto('/guides/interview-blueprint', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await expect(page.getByRole('heading', { name: 'Frontend Interview Preparation Guides' })).toBeVisible({ timeout: 60_000 });

      const cards = page.locator('.section .card');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(4);

      await page.evaluate(() => {
        window.__perfWindowStart = performance.now();
      });

      const loops = 4;
      const sampleCount = Math.min(cardCount, 10);
      for (let loop = 0; loop < loops; loop += 1) {
        for (let i = 0; i < sampleCount; i += 1) {
          const card = cards.nth(i);
          await card.scrollIntoViewIfNeeded();
          await card.hover();
          await page.waitForTimeout(20);
        }
        await page.mouse.move(2, 2);
      }

      await page.waitForTimeout(200);

      const rawTasks = await page.evaluate(() => window.__perfLongTasks || []);
      const start = await page.evaluate(() => window.__perfWindowStart || 0);
      const tasks = rawTasks.filter((task) =>
        task.startTime >= start && task.startTime - start <= HOVER_WINDOW_MS
      );

      const maxLongTask = tasks.reduce((max, task) => Math.max(max, task.duration), 0);
      const totalLongTaskTime = tasks.reduce((sum, task) => sum + task.duration, 0);
      const totalBlockingTime = tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);

      const report = {
        url: page.url(),
        throttlingRate: CPU_THROTTLE_RATE,
        timestamp: new Date().toISOString(),
        budgets: {
          HOVER_MAX_LONG_TASK_MS,
          HOVER_MAX_LONG_TASK_JITTER_MS,
          HOVER_TOTAL_LONG_TASK_MS,
          HOVER_TOTAL_BLOCKING_TIME_MS,
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
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(
        `[perf] guides hover longtasks: max=${maxLongTask.toFixed(1)}ms ` +
        `total=${totalLongTaskTime.toFixed(1)}ms tbt=${totalBlockingTime.toFixed(1)}ms`
      );

      expect(maxLongTask).toBeLessThanOrEqual(HOVER_MAX_LONG_TASK_MS + HOVER_MAX_LONG_TASK_JITTER_MS);
      expect(totalLongTaskTime).toBeLessThanOrEqual(HOVER_TOTAL_LONG_TASK_MS);
      expect(totalBlockingTime).toBeLessThanOrEqual(HOVER_TOTAL_BLOCKING_TIME_MS);
    } catch (error) {
      await page.screenshot({ path: failShotPath, fullPage: true });
      throw error;
    } finally {
      await context.tracing.stop({ path: tracePath });
    }
  });

  test('showcase to guides route latency meets warm-cache budget', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only perf smoke');
    test.setTimeout(120_000);

    const perfDir = path.resolve('test-results', 'perf');
    fs.mkdirSync(perfDir, { recursive: true });

    const reportPath = path.join(perfDir, 'routing-showcase-to-guides.json');
    const screenshotPath = path.join(perfDir, 'routing-showcase-to-guides.png');
    const failShotPath = path.join(perfDir, 'routing-showcase-to-guides-fail.png');

    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: false });
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    const durations: number[] = [];

    try {
      for (let run = 0; run < ROUTING_WARMUP_RUNS + ROUTING_MEASURE_RUNS; run += 1) {
        await page.goto('/showcase', { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await expect(page.getByTestId('showcase-hero-title')).toBeVisible({ timeout: 60_000 });

        const target = page.getByRole('link', { name: 'View interview blueprint' }).first();
        await target.scrollIntoViewIfNeeded();

        const startedAt = await page.evaluate(() => performance.now());
        await Promise.all([
          page.waitForURL(/\/guides\/interview-blueprint\/?$/, { timeout: 60_000 }),
          target.click(),
        ]);
        await expect(page.getByRole('heading', { name: 'Frontend Interview Preparation Guides' })).toBeVisible({
          timeout: 60_000,
        });
        const endedAt = await page.evaluate(() => performance.now());

        durations.push(endedAt - startedAt);
      }

      const warmSamples = durations.slice(ROUTING_WARMUP_RUNS);
      const p75 = percentile75(warmSamples);

      const report = {
        timestamp: new Date().toISOString(),
        throttlingRate: CPU_THROTTLE_RATE,
        warmupRuns: ROUTING_WARMUP_RUNS,
        measuredRuns: ROUTING_MEASURE_RUNS,
        targetP75Ms: ROUTING_P75_TARGET_MS,
        rawDurationsMs: durations,
        warmDurationsMs: warmSamples,
        p75Ms: p75,
      };

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(`[perf] routing showcase->guides warm p75=${p75.toFixed(1)}ms`);
      expect(p75).toBeLessThan(ROUTING_P75_TARGET_MS);
    } catch (error) {
      await page.screenshot({ path: failShotPath, fullPage: true });
      throw error;
    }
  });
});
