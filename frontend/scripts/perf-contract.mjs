#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(projectRoot, 'dist', 'frontendatlas', 'browser');
const outputPath = path.join(projectRoot, 'reports', 'perf-contract.json');
const strictMode = process.argv.includes('--strict');

const THRESHOLDS = {
  initialBytes: 1_150_000,
  modulePreloadBytes: 600_000,
  codingHtmlBytes: 450_000,
  totalHtmlBytes: 70_000_000,
};

function normalizeRel(fullPath) {
  return path.relative(projectRoot, fullPath).replace(/\\/g, '/');
}

function cleanAssetHref(href) {
  if (!href) return null;
  if (/^(https?:)?\/\//i.test(href)) return null;
  if (/^(data:|mailto:|tel:)/i.test(href)) return null;
  const [withoutHash] = href.split('#');
  const [withoutQuery] = withoutHash.split('?');
  const normalized = withoutQuery.replace(/^\/+/, '');
  return normalized || null;
}

function extractTagAttr(tag, attr) {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  const match = tag.match(re);
  return match?.[1] || null;
}

function extractLinkAssets(html, relValue) {
  const out = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    if (!new RegExp(`\\brel\\s*=\\s*["']${relValue}["']`, 'i').test(tag)) continue;
    const href = extractTagAttr(tag, 'href');
    if (href) out.push(href);
  }
  return out;
}

function extractModuleScripts(html) {
  const out = [];
  const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
  for (const tag of scriptTags) {
    if (!/\bsrc\s*=/.test(tag)) continue;
    if (!/\btype\s*=\s*["']module["']/i.test(tag)) continue;
    const src = extractTagAttr(tag, 'src');
    if (src) out.push(src);
  }
  return out;
}

async function fileSizeOrZero(file) {
  try {
    const stat = await fs.stat(file);
    return stat.size;
  } catch {
    return 0;
  }
}

async function sumAssets(root, hrefs) {
  let total = 0;
  const resolved = [];
  for (const href of hrefs) {
    const normalized = cleanAssetHref(href);
    if (!normalized) continue;
    const fullPath = path.join(root, normalized);
    const bytes = await fileSizeOrZero(fullPath);
    if (!bytes) continue;
    total += bytes;
    resolved.push({ href, bytes });
  }
  return { total, resolved };
}

async function walkFiles(dir, out = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkFiles(full, out);
        continue;
      }
      if (entry.isFile()) out.push(full);
    }
  } catch {
    return out;
  }
  return out;
}

function htmlRouteFromFile(root, fullPath) {
  const rel = path.relative(root, fullPath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    const route = rel.slice(0, -('/index.html'.length));
    return `/${route}`;
  }
  if (rel.endsWith('.html')) {
    return `/${rel.slice(0, -'.html'.length)}`;
  }
  return `/${rel}`;
}

async function collectHtmlMetrics(root) {
  const files = await walkFiles(root);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const routes = [];
  let totalHtmlBytes = 0;

  for (const file of htmlFiles) {
    const stat = await fs.stat(file);
    const bytes = stat.size;
    totalHtmlBytes += bytes;
    routes.push({
      route: htmlRouteFromFile(root, file),
      file: normalizeRel(file),
      bytes,
    });
  }

  routes.sort((a, b) => b.bytes - a.bytes || a.route.localeCompare(b.route));
  return {
    totalHtmlBytes,
    htmlFileCount: routes.length,
    largestRoutes: routes.slice(0, 20),
    codingRouteBytes: routes.find((r) => r.route === '/coding')?.bytes ?? 0,
  };
}

async function main() {
  const indexPath = path.join(buildRoot, 'index.html');
  const indexExists = await fileSizeOrZero(indexPath);
  if (!indexExists) {
    console.error('[perf-contract] missing build artifact:', normalizeRel(indexPath));
    process.exit(1);
  }

  const indexHtml = await fs.readFile(indexPath, 'utf8');
  const modulePreloads = extractLinkAssets(indexHtml, 'modulepreload');
  const stylesheets = extractLinkAssets(indexHtml, 'stylesheet');
  const moduleScripts = extractModuleScripts(indexHtml);

  const preloadMetrics = await sumAssets(buildRoot, modulePreloads);
  const stylesheetMetrics = await sumAssets(buildRoot, stylesheets);
  const scriptMetrics = await sumAssets(buildRoot, moduleScripts);
  const htmlMetrics = await collectHtmlMetrics(buildRoot);

  const initialBytes =
    preloadMetrics.total + stylesheetMetrics.total + scriptMetrics.total;

  const warnings = [];
  if (initialBytes > THRESHOLDS.initialBytes) {
    warnings.push(
      `Initial critical bytes ${initialBytes} exceed ${THRESHOLDS.initialBytes}`,
    );
  }
  if (preloadMetrics.total > THRESHOLDS.modulePreloadBytes) {
    warnings.push(
      `Modulepreload bytes ${preloadMetrics.total} exceed ${THRESHOLDS.modulePreloadBytes}`,
    );
  }
  if (htmlMetrics.codingRouteBytes > THRESHOLDS.codingHtmlBytes) {
    warnings.push(
      `/coding HTML bytes ${htmlMetrics.codingRouteBytes} exceed ${THRESHOLDS.codingHtmlBytes}`,
    );
  }
  if (htmlMetrics.totalHtmlBytes > THRESHOLDS.totalHtmlBytes) {
    warnings.push(
      `Total prerender HTML bytes ${htmlMetrics.totalHtmlBytes} exceed ${THRESHOLDS.totalHtmlBytes}`,
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    strictMode,
    buildDir: normalizeRel(buildRoot),
    thresholds: THRESHOLDS,
    metrics: {
      initialBytes,
      modulePreloadBytes: preloadMetrics.total,
      modulePreloadCount: preloadMetrics.resolved.length,
      entryScriptBytes: scriptMetrics.total,
      entryScriptCount: scriptMetrics.resolved.length,
      stylesheetBytes: stylesheetMetrics.total,
      stylesheetCount: stylesheetMetrics.resolved.length,
      totalHtmlBytes: htmlMetrics.totalHtmlBytes,
      htmlFileCount: htmlMetrics.htmlFileCount,
      codingHtmlBytes: htmlMetrics.codingRouteBytes,
    },
    largestHtmlRoutes: htmlMetrics.largestRoutes,
    warnings,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`[perf-contract] wrote ${normalizeRel(outputPath)}`);
  console.log(`[perf-contract] initialBytes=${initialBytes} modulePreloadBytes=${preloadMetrics.total} modulePreloadCount=${preloadMetrics.resolved.length}`);
  console.log(`[perf-contract] codingHtmlBytes=${htmlMetrics.codingRouteBytes} totalHtmlBytes=${htmlMetrics.totalHtmlBytes}`);
  if (warnings.length) {
    for (const warning of warnings) {
      console.warn(`[perf-contract] warning: ${warning}`);
    }
  } else {
    console.log('[perf-contract] all thresholds satisfied');
  }

  if (strictMode && warnings.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[perf-contract] fatal:', err);
  process.exit(1);
});
