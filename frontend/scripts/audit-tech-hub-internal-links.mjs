#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const CANONICAL_BASE = (process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com').replace(/\/+$/, '');

const TARGETS = [
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
  '/html-css/interview-questions',
];

const EDITORIAL_SOURCES = [
  '/interview-questions',
  '/guides/framework-prep',
  '/tracks',
  '/companies',
];

function routeToFile(route) {
  const clean = route === '/' ? '' : route.replace(/^\/+|\/+$/g, '');
  return path.join(BUILD_DIR, clean, 'index.html');
}

function routeFromFile(filePath) {
  const relDir = path.relative(BUILD_DIR, path.dirname(filePath)).replace(/\\/g, '/');
  if (!relDir || relDir === '.') return '/';
  return `/${relDir}`;
}

function collectHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function normalizeHref(raw) {
  let value = String(raw || '').replace(/&amp;/g, '&').trim();
  if (!value) return '';
  if (value.startsWith(CANONICAL_BASE)) value = value.slice(CANONICAL_BASE.length) || '/';
  if (!value.startsWith('/')) return '';
  const clean = value.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean || '/';
}

function extractHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => normalizeHref(match[1]))
    .filter(Boolean);
}

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`[seo:tech-hub-links] Build directory not found: ${BUILD_DIR}`);
  console.error('[seo:tech-hub-links] Run npm run build first.');
  process.exit(1);
}

const htmlFiles = collectHtmlFiles(BUILD_DIR);
const totals = new Map(TARGETS.map((target) => [target, { total: 0, sources: new Set() }]));

for (const file of htmlFiles) {
  const route = routeFromFile(file);
  const hrefs = extractHrefs(fs.readFileSync(file, 'utf8'));
  for (const href of hrefs) {
    const record = totals.get(href);
    if (!record) continue;
    record.total += 1;
    record.sources.add(route);
  }
}

const failures = [];

for (const source of EDITORIAL_SOURCES) {
  const file = routeToFile(source);
  if (!fs.existsSync(file)) {
    failures.push(`missing prerender source ${source}`);
    continue;
  }
  const hrefs = new Set(extractHrefs(fs.readFileSync(file, 'utf8')));
  for (const target of TARGETS) {
    if (!hrefs.has(target)) failures.push(`${source} does not link to ${target}`);
  }
}

console.log('[seo:tech-hub-links] target counts:');
for (const target of TARGETS) {
  const record = totals.get(target);
  console.log(`  ${String(record.total).padStart(4)} ${target} uniqueSources=${record.sources.size}`);
}

console.log('[seo:tech-hub-links] editorial sources checked:');
for (const source of EDITORIAL_SOURCES) {
  console.log(`  ${source}`);
}

if (failures.length) {
  console.error('[seo:tech-hub-links] failures:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('[seo:tech-hub-links] passed');
