#!/usr/bin/env node
// Measures the infinite-scroll page (page.html) in three modes at three list
// sizes: every row mounted, every row mounted with content-visibility: auto,
// and fixed-size windowing. Each run uses a fresh page in system Chrome with
// CPU throttling applied through the DevTools protocol.
//
// Usage: node scripts/infinite-scroll-benchmark/run.mjs [--runs 5] [--throttle 4] [--out file.json]
// Run it on AC power with Low Power Mode off; battery and power-saving modes
// change the absolute numbers.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const RUNS = Number(option('runs', 5));
const THROTTLE = Number(option('throttle', 4));
const OUT = option('out', null);
const MODES = ['plain', 'cv', 'window'];
const COUNTS = [500, 2000, 10000];
const CLICKS = 5;

const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

async function measure(browser, mode, count) {
  const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  const url = pathToFileURL(path.join(here, 'page.html'));
  url.search = new URLSearchParams({ mode, n: String(count) }).toString();
  await page.goto(url.href);
  await page.waitForFunction(() => window.__ready === true);

  const buildMs = await page.evaluate(() => window.__bench.build());
  const domNodes = await page.evaluate(() => window.__bench.domNodes());
  await cdp.send('HeapProfiler.collectGarbage');
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

  await page.evaluate(() => window.__bench.appendPage());
  const appendSamples = [];
  for (let index = 0; index < 3; index += 1) {
    appendSamples.push(await page.evaluate(() => window.__bench.appendPage()));
  }
  const scroll = await page.evaluate(() => window.__bench.scrollRun(3000));

  // Real input: move to the Like button in the middle of the viewport and click.
  await page.evaluate(() => scrollTo(0, Math.floor(document.documentElement.scrollHeight / 2)));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const clickOnce = async () => {
    const point = await page.evaluate(() => window.__bench.likeButtonCenter());
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(250);
  };
  await clickOnce();
  await page.waitForTimeout(300);
  const warmupEntries = (await page.evaluate(() => window.__bench.interactions())).length;
  for (let index = 0; index < CLICKS; index += 1) await clickOnce();
  await page.waitForTimeout(500);
  const clicks = (await page.evaluate(() => window.__bench.interactions())).slice(warmupEntries);
  // Event Timing reports only interactions of 16 ms or longer; count the rest as 16.
  const clickSamples = [...clicks, ...Array(Math.max(0, CLICKS - clicks.length)).fill(16)];
  await page.close();

  return {
    mode,
    count,
    buildMs,
    domNodes,
    jsHeapUsedMb: metrics.JSHeapUsedSize / (1024 * 1024),
    layoutObjects: metrics.LayoutObjects ?? null,
    appendPageMs: median(appendSamples),
    ...scroll,
    clicksOver16ms: clicks.length,
    clickDurationMs: median(clickSamples),
  };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const version = browser.version();
const results = [];
for (const count of COUNTS) {
  for (const mode of MODES) {
    for (let run = 0; run < RUNS; run += 1) {
      const result = await measure(browser, mode, count);
      results.push({ run, ...result });
      process.stdout.write('.');
    }
  }
}
await browser.close();
process.stdout.write('\n');

const summary = [];
for (const count of COUNTS) {
  for (const mode of MODES) {
    const rows = results.filter((result) => result.mode === mode && result.count === count);
    const pickMedian = (key) => median(rows.map((row) => row[key]));
    summary.push({
      count,
      mode,
      domNodes: pickMedian('domNodes'),
      layoutObjects: pickMedian('layoutObjects'),
      buildMs: Math.round(pickMedian('buildMs')),
      appendPageMs: Math.round(pickMedian('appendPageMs')),
      p95FrameMs: Number(pickMedian('p95FrameMs').toFixed(1)),
      slowFrameShare: Number(pickMedian('slowFrameShare').toFixed(3)),
      longAnimationFrameMs: Math.round(pickMedian('longAnimationFrameMs')),
      clicksOver16ms: pickMedian('clicksOver16ms'),
      clickDurationMs: pickMedian('clickDurationMs'),
    });
  }
}
console.table(summary);

const report = {
  measuredAt: new Date().toISOString(),
  environment: {
    browser: `Chrome ${version}`,
    playwright: JSON.parse(fs.readFileSync(path.join(here, '../../node_modules/playwright/package.json'), 'utf8')).version,
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cpuThrottlingRate: THROTTLE,
    viewport: '412x915 CSS px',
    runsPerConfiguration: RUNS,
  },
  summary,
  results,
};
if (OUT) {
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote ${OUT}`);
}
