#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(projectRoot, 'dist', 'frontendatlas', 'browser');
const statsCandidates = [
  path.join(projectRoot, 'dist', 'frontendatlas', 'stats.json'),
  path.join(buildRoot, 'stats.json'),
];
const outputPath = path.join(projectRoot, 'reports', 'perf-contract.json');
const strictMode = process.argv.includes('--strict');
const noWrite = process.argv.includes('--no-write');

// Thresholds sit a few percent above the measured production build (2026-10-10:
// eager JS 1,193,000; initial 1,327,000; /coding HTML 585,978; prerender total
// 99,949,880). They fail the Playwright Critical job in --strict mode, so a
// regression has to raise them deliberately in the same change.
//
// "Eager JS" is the static import closure of the module scripts in index.html,
// i.e. everything the browser must load before the app boots. The modulepreload
// hints are not used as a budget: Angular only emits hints for the first ten
// static imports of main, so the hinted set shifts with chunk order even when
// the eager graph is unchanged (2026-10-10: identical 51-file graph, hinted
// bytes moved from 37,580 to 74,155).
const THRESHOLDS = {
  initialBytes: 1_400_000,
  eagerJsBytes: 1_260_000,
  codingHtmlBytes: 620_000,
  totalHtmlBytes: 104_000_000,
  sentryLazyChunkBytes: 260_000,
  showcaseLazyHeavyBytes: 620_000,
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

// Static import closure of the entry module scripts. Minified output references
// chunks as `from"./chunk-X.js"` or `import"./chunk-X.js"`; dynamic imports use
// `import(` and are deliberately excluded.
async function collectEagerModuleGraph(root, entryHrefs) {
  const seen = new Map();
  const queue = entryHrefs.map(cleanAssetHref).filter(Boolean);
  const importRe = /\b(?:from|import)\s*["'](\.\.?\/[^"']+\.js)["']/g;
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    const fullPath = path.join(root, rel);
    let source;
    try {
      source = await fs.readFile(fullPath, 'utf8');
    } catch {
      continue;
    }
    seen.set(rel, await fileSizeOrZero(fullPath));
    const dir = path.posix.dirname(rel);
    for (const match of source.matchAll(importRe)) {
      const dep = path.posix.normalize(path.posix.join(dir, match[1]));
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  let total = 0;
  for (const bytes of seen.values()) total += bytes;
  return { total, files: [...seen.keys()] };
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

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectBundleStats(stats) {
  if (!stats || typeof stats !== 'object') return null;
  const outputs = stats.outputs;
  if (!outputs || typeof outputs !== 'object') return null;

  const chunks = Object.entries(outputs)
    .filter(([name, output]) => {
      if (!name.endsWith('.js') || name.endsWith('.js.map')) return false;
      return output && typeof output === 'object';
    })
    .map(([name, output]) => ({
      file: name,
      bytes: Number(output.bytes ?? 0) || 0,
      inputs: Object.keys(output.inputs || {}),
    }));

  const sentryChunks = chunks
    .filter((chunk) => chunk.inputs.some((input) => input.includes('/@sentry/')))
    .sort((a, b) => b.bytes - a.bytes);
  const sentryChunk = sentryChunks[0] ?? null;

  const showcasePatterns = [
    'showcase.page.ts',
    'coding-detail.component.ts',
    'trivia-detail.component.ts',
    'system-design-detail.component.ts',
  ];

  const showcaseChunksMap = new Map();
  for (const chunk of chunks) {
    if (!chunk.inputs.some((input) => showcasePatterns.some((pattern) => input.includes(pattern)))) {
      continue;
    }
    showcaseChunksMap.set(chunk.file, chunk);
  }

  const showcaseChunks = Array.from(showcaseChunksMap.values()).sort((a, b) => b.bytes - a.bytes);
  const showcaseLazyHeavyBytes = showcaseChunks.reduce((sum, chunk) => sum + chunk.bytes, 0);

  return {
    sentryLazyChunkBytes: sentryChunk?.bytes ?? 0,
    sentryLazyChunkFile: sentryChunk?.file ?? null,
    showcaseLazyHeavyBytes,
    showcaseLazyChunks: showcaseChunks.map((chunk) => ({
      file: chunk.file,
      bytes: chunk.bytes,
    })),
  };
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
  const eagerGraph = await collectEagerModuleGraph(buildRoot, moduleScripts);
  const htmlMetrics = await collectHtmlMetrics(buildRoot);
  let bundleStatsPath = null;
  let bundleStats = null;
  for (const candidate of statsCandidates) {
    const parsed = await readJson(candidate);
    if (!parsed) continue;
    bundleStatsPath = normalizeRel(candidate);
    bundleStats = collectBundleStats(parsed);
    if (bundleStats) break;
  }

  const initialBytes = eagerGraph.total + stylesheetMetrics.total;

  const warnings = [];
  if (initialBytes > THRESHOLDS.initialBytes) {
    warnings.push(
      `Initial critical bytes ${initialBytes} exceed ${THRESHOLDS.initialBytes}`,
    );
  }
  if (eagerGraph.total > THRESHOLDS.eagerJsBytes) {
    warnings.push(
      `Eager JS bytes ${eagerGraph.total} exceed ${THRESHOLDS.eagerJsBytes}`,
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
  if (bundleStats?.sentryLazyChunkBytes > THRESHOLDS.sentryLazyChunkBytes) {
    warnings.push(
      `Sentry lazy chunk bytes ${bundleStats.sentryLazyChunkBytes} exceed ${THRESHOLDS.sentryLazyChunkBytes}`,
    );
  }
  if (bundleStats?.showcaseLazyHeavyBytes > THRESHOLDS.showcaseLazyHeavyBytes) {
    warnings.push(
      `Showcase lazy-heavy bytes ${bundleStats.showcaseLazyHeavyBytes} exceed ${THRESHOLDS.showcaseLazyHeavyBytes}`,
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    strictMode,
    buildDir: normalizeRel(buildRoot),
    thresholds: THRESHOLDS,
    metrics: {
      initialBytes,
      eagerJsBytes: eagerGraph.total,
      eagerJsFileCount: eagerGraph.files.length,
      modulePreloadBytes: preloadMetrics.total,
      modulePreloadCount: preloadMetrics.resolved.length,
      entryScriptBytes: scriptMetrics.total,
      entryScriptCount: scriptMetrics.resolved.length,
      stylesheetBytes: stylesheetMetrics.total,
      stylesheetCount: stylesheetMetrics.resolved.length,
      totalHtmlBytes: htmlMetrics.totalHtmlBytes,
      htmlFileCount: htmlMetrics.htmlFileCount,
      codingHtmlBytes: htmlMetrics.codingRouteBytes,
      sentryLazyChunkBytes: bundleStats?.sentryLazyChunkBytes ?? 0,
      sentryLazyChunkFile: bundleStats?.sentryLazyChunkFile ?? null,
      showcaseLazyHeavyBytes: bundleStats?.showcaseLazyHeavyBytes ?? 0,
      showcaseLazyChunkCount: bundleStats?.showcaseLazyChunks?.length ?? 0,
    },
    largestHtmlRoutes: htmlMetrics.largestRoutes,
    bundleStatsSource: bundleStatsPath,
    showcaseLazyChunks: bundleStats?.showcaseLazyChunks ?? [],
    warnings,
  };

  if (noWrite) {
    console.log(`[perf-contract] report not written (--no-write): ${normalizeRel(outputPath)}`);
  } else {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`[perf-contract] wrote ${normalizeRel(outputPath)}`);
  }
  console.log(`[perf-contract] initialBytes=${initialBytes} eagerJsBytes=${eagerGraph.total} eagerJsFiles=${eagerGraph.files.length} modulePreloadBytes=${preloadMetrics.total} modulePreloadCount=${preloadMetrics.resolved.length}`);
  console.log(`[perf-contract] codingHtmlBytes=${htmlMetrics.codingRouteBytes} totalHtmlBytes=${htmlMetrics.totalHtmlBytes}`);
  if (bundleStats) {
    console.log(
      `[perf-contract] sentryLazyChunkBytes=${bundleStats.sentryLazyChunkBytes} ` +
      `showcaseLazyHeavyBytes=${bundleStats.showcaseLazyHeavyBytes}`,
    );
  } else {
    console.log('[perf-contract] bundle stats not found; skipping chunk-level checks');
  }
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
