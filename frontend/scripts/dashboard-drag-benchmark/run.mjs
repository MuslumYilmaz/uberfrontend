#!/usr/bin/env node
// Measures one widget drag on the dashboard page (page.html) with three
// handlers: re-render the whole board on every pointermove, write the grid
// cell on every pointermove, or move a transform preview in one rAF per frame
// and commit the grid cell on pointerup. Input is real mouse input from
// Playwright, paced at about one move per 16 ms, with CPU throttling applied
// through the DevTools protocol.
//
// Usage: node scripts/dashboard-drag-benchmark/run.mjs [--runs 5] [--throttle 4] [--out file.json]
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
const MODES = ['rerender', 'grid', 'transform'];
const COUNTS = [24, 96];
const STEPS = 60;

const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

async function measure(browser, mode, widgets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  const url = pathToFileURL(path.join(here, 'page.html'));
  url.search = new URLSearchParams({ mode, widgets: String(widgets) }).toString();
  await page.goto(url.href);
  await page.waitForFunction(() => window.__ready === true);
  await page.waitForTimeout(300);
  const domNodes = await page.evaluate(() => window.__bench.domNodes());

  const start = await page.evaluate(() => window.__bench.handleCenter(0));
  // Four columns right and two rows down on a 1280px board.
  const end = { x: start.x + 4 * 106, y: start.y + 2 * 128 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= STEPS; step += 1) {
    const ratio = step / STEPS;
    await page.mouse.move(start.x + (end.x - start.x) * ratio, start.y + (end.y - start.y) * ratio);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => window.__bench.result());
  await page.close();
  return { mode, widgets, domNodes, ...result };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const version = browser.version();
const results = [];
for (const widgets of COUNTS) {
  for (const mode of MODES) {
    for (let run = 0; run < RUNS; run += 1) {
      results.push({ run, ...(await measure(browser, mode, widgets)) });
      process.stdout.write('.');
    }
  }
}
await browser.close();
process.stdout.write('\n');

const summary = COUNTS.flatMap((widgets) => MODES.map((mode) => {
  const rows = results.filter((result) => result.mode === mode && result.widgets === widgets);
  const pickMedian = (key) => median(rows.map((row) => row[key]));
  return {
    widgets,
    mode,
    domNodes: pickMedian('domNodes'),
    moves: pickMedian('moves'),
    handlerMedianMs: Number(pickMedian('handlerMedianMs').toFixed(1)),
    handlerTotalMs: Math.round(pickMedian('handlerTotalMs')),
    p95FrameMs: Number(pickMedian('p95FrameMs').toFixed(1)),
    slowFrameShare: Number(pickMedian('slowFrameShare').toFixed(3)),
    longAnimationFrameMs: Math.round(pickMedian('longAnimationFrameMs')),
    commitMs: Number(pickMedian('commitMs').toFixed(1)),
  };
}));
console.table(summary);

const report = {
  measuredAt: new Date().toISOString(),
  environment: {
    browser: `Chrome ${version}`,
    playwright: JSON.parse(fs.readFileSync(path.join(here, '../../node_modules/playwright/package.json'), 'utf8')).version,
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cpuThrottlingRate: THROTTLE,
    viewport: '1280x800 CSS px',
    widgetCounts: COUNTS,
    pointerMoves: STEPS,
    runsPerConfiguration: RUNS,
  },
  summary,
  results,
};
if (OUT) {
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote ${OUT}`);
}
