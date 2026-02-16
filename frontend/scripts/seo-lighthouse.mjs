#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const BASE_URL = (process.env.SEO_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const OUTPUT_DIR = path.resolve(process.env.SEO_LIGHTHOUSE_OUTPUT || 'test-results/lighthouse');
const ROUTES = (process.env.SEO_LIGHTHOUSE_ROUTES || '/')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

if (!ROUTES.length) {
  console.error('[seo:lighthouse] No routes configured.');
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function routeToName(route) {
  const cleaned = route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/[/?&#]+/g, '-');
  return cleaned || 'home';
}

let hasFailure = false;

for (const route of ROUTES) {
  const url = route.startsWith('http://') || route.startsWith('https://')
    ? route
    : `${BASE_URL}${route.startsWith('/') ? route : `/${route}`}`;
  const name = routeToName(route);
  const outputPath = path.join(OUTPUT_DIR, `${name}.json`);

  console.log(`[seo:lighthouse] ${url}`);

  const args = [
    '-y',
    'lighthouse',
    url,
    '--chrome-flags=--headless=new --no-sandbox',
    '--only-categories=performance,accessibility,seo',
    '--preset=desktop',
    '--output=json',
    `--output-path=${outputPath}`,
    '--quiet',
  ];

  const run = spawnSync('npx', args, { stdio: 'inherit' });
  if (run.status !== 0) {
    hasFailure = true;
    continue;
  }

  try {
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const perf = report.categories?.performance?.score;
    const a11y = report.categories?.accessibility?.score;
    const seo = report.categories?.seo?.score;
    const toPct = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}` : 'n/a');
    console.log(`[seo:lighthouse] score ${name}: perf=${toPct(perf)} a11y=${toPct(a11y)} seo=${toPct(seo)}`);
  } catch {
    hasFailure = true;
    console.error(`[seo:lighthouse] Failed to parse ${outputPath}`);
  }
}

if (hasFailure) process.exit(1);

