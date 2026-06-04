#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const CANONICAL_BASE = (process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com').replace(/\/+$/, '');
const TRIVIA_INBOUND_CAP = readNumberEnv('SEO_TRIVIA_INBOUND_CAP', 35);
const TOP_SAMPLE_SIZE = readNumberEnv('SEO_LINK_EQUITY_TOP_SAMPLE_SIZE', 20);
const TOP_TRIVIA_MAX = readNumberEnv('SEO_TOP_TRIVIA_MAX', 3);
const STRATEGIC_MIN_LINKS = readNumberEnv('SEO_STRATEGIC_MIN_LINKS', 120);
const TECH_HUB_MIN_LINKS = readNumberEnv('SEO_TECH_HUB_MIN_LINKS', 35);

const REQUIRED_TARGETS = new Map([
  ['/interview-questions', STRATEGIC_MIN_LINKS],
  ['/interview-questions/essential', STRATEGIC_MIN_LINKS],
  ['/machine-coding', STRATEGIC_MIN_LINKS],
  ['/coding', STRATEGIC_MIN_LINKS],
  ['/system-design', STRATEGIC_MIN_LINKS],
  ['/guides/system-design-blueprint', STRATEGIC_MIN_LINKS],
  ['/tracks', STRATEGIC_MIN_LINKS],
  ['/companies', STRATEGIC_MIN_LINKS],
  ['/guides/interview-blueprint/intro', STRATEGIC_MIN_LINKS],
  ['/guides/framework-prep', STRATEGIC_MIN_LINKS],
  ['/javascript/interview-questions', TECH_HUB_MIN_LINKS],
  ['/react/interview-questions', TECH_HUB_MIN_LINKS],
  ['/angular/interview-questions', TECH_HUB_MIN_LINKS],
  ['/vue/interview-questions', TECH_HUB_MIN_LINKS],
  ['/html/interview-questions', TECH_HUB_MIN_LINKS],
  ['/css/interview-questions', TECH_HUB_MIN_LINKS],
  ['/html-css/interview-questions', TECH_HUB_MIN_LINKS],
]);

function readNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function collectHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, out);
      continue;
    }
    if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function routeFromFile(filePath) {
  const relDir = path.relative(BUILD_DIR, path.dirname(filePath)).replace(/\\/g, '/');
  if (!relDir || relDir === '.') return '/';
  return `/${relDir}`;
}

function normalizeHref(rawHref) {
  let value = String(rawHref || '').replace(/&amp;/g, '&').trim();
  if (!value || value.startsWith('#')) return '';
  if (/^(mailto|tel|javascript|data):/i.test(value)) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (`${url.protocol}//${url.host}` !== CANONICAL_BASE) return '';
      value = `${url.pathname || '/'}${url.search || ''}${url.hash || ''}`;
    } catch {
      return '';
    }
  }

  if (!value.startsWith('/')) return '';
  const clean = value.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean || '/';
}

function extractHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => normalizeHref(match[1]))
    .filter(Boolean);
}

function isTriviaDetailPath(route) {
  return /^\/(javascript|react|angular|vue|html|css)\/trivia\/[^/]+$/.test(route);
}

function countInternalLinks(htmlFiles) {
  const targetCounts = new Map();
  const targetSources = new Map();

  for (const file of htmlFiles) {
    const sourceRoute = routeFromFile(file);
    const hrefs = extractHrefs(fs.readFileSync(file, 'utf8'));
    for (const href of hrefs) {
      targetCounts.set(href, (targetCounts.get(href) || 0) + 1);
      if (!targetSources.has(href)) targetSources.set(href, new Set());
      targetSources.get(href).add(sourceRoute);
    }
  }

  return { targetCounts, targetSources };
}

function sortedTargets(targetCounts) {
  return [...targetCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function run() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[seo:link-equity] Build directory not found: ${BUILD_DIR}`);
    console.error('[seo:link-equity] Run npm run build first.');
    process.exit(1);
  }

  const htmlFiles = collectHtmlFiles(BUILD_DIR);
  if (!htmlFiles.length) {
    console.error(`[seo:link-equity] No prerendered HTML files found under ${BUILD_DIR}`);
    process.exit(1);
  }

  const { targetCounts, targetSources } = countInternalLinks(htmlFiles);
  const targets = sortedTargets(targetCounts);
  const failures = [];

  const triviaOverCap = targets
    .filter(([target, count]) => isTriviaDetailPath(target) && count > TRIVIA_INBOUND_CAP)
    .slice(0, 30);
  for (const [target, count] of triviaOverCap) {
    failures.push(`${target} has ${count} inbound internal anchors; cap is ${TRIVIA_INBOUND_CAP}`);
  }

  for (const [target, minCount] of REQUIRED_TARGETS) {
    if (minCount <= 0) continue;
    const count = targetCounts.get(target) || 0;
    if (count < minCount) {
      failures.push(`${target} has ${count} inbound internal anchors; expected at least ${minCount}`);
    }
  }

  const topTargets = targets.slice(0, TOP_SAMPLE_SIZE);
  const topTriviaTargets = topTargets.filter(([target]) => isTriviaDetailPath(target));
  if (topTriviaTargets.length > TOP_TRIVIA_MAX) {
    failures.push(
      `${topTriviaTargets.length} trivia detail targets appear in the top ${TOP_SAMPLE_SIZE}; max allowed is ${TOP_TRIVIA_MAX}`,
    );
  }

  console.log(`[seo:link-equity] pages=${htmlFiles.length} targets=${targets.length}`);
  console.log(`[seo:link-equity] trivia-cap=${TRIVIA_INBOUND_CAP} strategic-min=${STRATEGIC_MIN_LINKS} tech-hub-min=${TECH_HUB_MIN_LINKS}`);

  console.log('[seo:link-equity] required targets:');
  for (const [target, minCount] of REQUIRED_TARGETS) {
    const count = targetCounts.get(target) || 0;
    const sources = targetSources.get(target)?.size || 0;
    console.log(`  ${String(count).padStart(4)} ${target} uniqueSources=${sources} min=${minCount}`);
  }

  console.log(`[seo:link-equity] top ${TOP_SAMPLE_SIZE} targets:`);
  topTargets.forEach(([target, count]) => {
    const sources = targetSources.get(target)?.size || 0;
    const marker = isTriviaDetailPath(target) ? ' trivia-detail' : '';
    console.log(`  ${String(count).padStart(4)} ${target} uniqueSources=${sources}${marker}`);
  });

  if (failures.length) {
    console.error('[seo:link-equity] failures:');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }

  console.log('[seo:link-equity] passed');
}

run();
