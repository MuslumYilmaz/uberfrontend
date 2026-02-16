#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  isInternalHttpLink,
  isNonNavigationalLink,
  resolveStaticFileForPath,
  shouldRewriteToIndex,
} from './seo-static-server.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const OUTPUT_PATH = path.resolve(process.env.SEO_LINKS_OUTPUT || 'test-results/linkinator.json');
const CANONICAL_BASE = (process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com').replace(/\/+$/, '');
const INTERNAL_BASES = [
  CANONICAL_BASE,
  process.env.SEO_BASE_URL ? String(process.env.SEO_BASE_URL).replace(/\/+$/, '') : '',
].filter(Boolean);

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

function toRoute(filePath) {
  const relDir = path.relative(BUILD_DIR, path.dirname(filePath)).replace(/\\/g, '/');
  if (!relDir || relDir === '.') return '/';
  return `/${relDir}`;
}

function extractAnchorHrefs(html) {
  const out = [];
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const value = String(match[1] || '').trim();
    if (!value) continue;
    out.push(value);
  }
  return out;
}

function normalizePath(rawPath) {
  const raw = String(rawPath || '').trim();
  if (!raw) return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const stripped = withSlash.split('?')[0].split('#')[0];
  const clean = stripped.replace(/\/+$/, '');
  return clean || '/';
}

function resolveRelativeUrl(rawUrl, baseHref = '/') {
  try {
    const normalizedBaseHref = normalizePath(baseHref || '/');
    const base = new URL(`${CANONICAL_BASE}${normalizedBaseHref === '/' ? '/' : `${normalizedBaseHref}/`}`);
    const resolved = new URL(rawUrl, base);
    return resolved.toString();
  } catch {
    return rawUrl;
  }
}

function isInternalHttpAny(rawUrl) {
  return INTERNAL_BASES.some((base) => isInternalHttpLink(rawUrl, base));
}

function resolveInternalStatus(pathname) {
  const clean = normalizePath(pathname);
  if (resolveStaticFileForPath(BUILD_DIR, clean)) return 200;
  if (shouldRewriteToIndex(clean)) return 200;
  return 404;
}

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`[seo:links] Build directory not found: ${BUILD_DIR}`);
  process.exit(1);
}

const htmlFiles = collectHtmlFiles(BUILD_DIR);
if (!htmlFiles.length) {
  console.error(`[seo:links] No prerendered HTML files found under ${BUILD_DIR}`);
  process.exit(1);
}

const links = [];
const hard404 = [];
let internalHttpCount = 0;
let nonNavigationalCount = 0;
let externalHttpCount = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const parentRoute = toRoute(file);
  const rawUrls = extractAnchorHrefs(html);

  for (const raw of rawUrls) {
    if (isNonNavigationalLink(raw)) {
      nonNavigationalCount += 1;
      links.push({ url: raw, parent: parentRoute, status: 0, state: 'SKIPPED', reason: 'non-navigational' });
      continue;
    }

    if (raw.startsWith('data:')) {
      links.push({ url: raw, parent: parentRoute, status: 0, state: 'SKIPPED', reason: 'data-url' });
      continue;
    }

    if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
      links.push({ url: raw, parent: parentRoute, status: 0, state: 'SKIPPED', reason: 'relative-example' });
      continue;
    }

    const absolute = /^https?:\/\//i.test(raw) ? raw : resolveRelativeUrl(raw, '/');

    if (!isInternalHttpAny(absolute)) {
      externalHttpCount += 1;
      links.push({ url: absolute, parent: parentRoute, status: 0, state: 'SKIPPED', reason: 'external-http' });
      continue;
    }

    internalHttpCount += 1;
    const pathname = (() => {
      try {
        return new URL(absolute).pathname;
      } catch {
        return '/';
      }
    })();
    const status = resolveInternalStatus(pathname);
    const state = status >= 400 ? 'BROKEN' : 'OK';

    const record = { url: absolute, parent: parentRoute, status, state };
    links.push(record);
    if (status >= 400) hard404.push(record);
  }
}

const summary = {
  scanned: links.length,
  broken: hard404.length,
  broken_internal_http: hard404.length,
  broken_non_navigational: nonNavigationalCount,
  broken_external_or_other: externalHttpCount,
  hard_404_internal_http: hard404.length,
  checked_internal_http: internalHttpCount,
};

const payload = {
  links,
  summary,
  hard404,
  passed: hard404.length === 0,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');

console.log(
  `[seo:links] scanned=${summary.scanned} checked-internal=${summary.checked_internal_http} non-links=${summary.broken_non_navigational} external=${summary.broken_external_or_other} hard-404=${summary.hard_404_internal_http}`,
);
console.log(`[seo:links] report: ${OUTPUT_PATH}`);

if (hard404.length > 0) {
  console.log('[seo:links] hard 404 list (internal HTTP links):');
  hard404
    .slice(0, 30)
    .forEach((item) => console.log(`  ${item.status} ${item.url} (from ${item.parent || 'unknown'})`));
  process.exit(1);
}
