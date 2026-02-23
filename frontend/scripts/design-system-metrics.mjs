#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const appRoot = path.join(srcRoot, 'app');
const featuresRoot = path.join(appRoot, 'features');
const buildRoot = path.join(projectRoot, 'dist', 'frontendatlas', 'browser');
const outputPath = path.join(projectRoot, 'reports', 'design-system-baseline.json');

const PRIME_PATTERNS = [
  /\bpButton\b/g,
  /<\s*p-chip\b/gi,
  /<\s*p-dialog\b/gi,
];

const VISUAL_CLASS_PATTERN = /\bfa-(btn|chip|card)\b/g;
const NG_DEEP_PATTERN = /::ng-deep/g;
const INLINE_STYLES_PATTERN = /styles\s*:\s*\[/g;

async function walkFiles(dir, predicate, out = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkFiles(full, predicate, out);
        continue;
      }
      if (!entry.isFile()) continue;
      if (predicate(full)) out.push(full);
    }
  } catch {
    return out;
  }
  return out;
}

function normalizeRel(fullPath) {
  return path.relative(projectRoot, fullPath).replace(/\\/g, '/');
}

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

async function sumFileSizes(files) {
  let total = 0;
  for (const file of files) {
    const stat = await fs.stat(file);
    total += stat.size;
  }
  return total;
}

async function collectBundleMetrics() {
  const jsFiles = await walkFiles(buildRoot, (f) => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles = await walkFiles(buildRoot, (f) => f.endsWith('.css') && !f.endsWith('.map'));
  if (!jsFiles.length && !cssFiles.length) {
    return {
      bundleJsBytes: null,
      globalCssBytes: null,
      buildFound: false,
    };
  }

  return {
    bundleJsBytes: jsFiles.length ? await sumFileSizes(jsFiles) : 0,
    globalCssBytes: cssFiles.length ? await sumFileSizes(cssFiles) : 0,
    buildFound: true,
  };
}

async function main() {
  const featureTemplates = await walkFiles(featuresRoot, (f) => f.endsWith('.html'));
  const appSources = await walkFiles(appRoot, (f) => f.endsWith('.ts') || f.endsWith('.scss') || f.endsWith('.css'));

  let rawPrimeHits = 0;
  let rawPrimeFiles = 0;
  let rawVisualHits = 0;
  let rawVisualFiles = 0;

  for (const file of featureTemplates) {
    const text = await fs.readFile(file, 'utf8');

    let primeInFile = 0;
    for (const pattern of PRIME_PATTERNS) {
      primeInFile += countMatches(text, pattern);
    }
    if (primeInFile > 0) {
      rawPrimeFiles += 1;
      rawPrimeHits += primeInFile;
    }

    const visualInFile = countMatches(text, VISUAL_CLASS_PATTERN);
    if (visualInFile > 0) {
      rawVisualFiles += 1;
      rawVisualHits += visualInFile;
    }
  }

  let ngDeepHits = 0;
  let ngDeepFiles = 0;
  let inlineStyleHits = 0;
  let inlineStyleFiles = 0;

  for (const file of appSources) {
    const text = await fs.readFile(file, 'utf8');
    const deepCount = countMatches(text, NG_DEEP_PATTERN);
    if (deepCount > 0) {
      ngDeepHits += deepCount;
      ngDeepFiles += 1;
    }

    const inlineCount = countMatches(text, INLINE_STYLES_PATTERN);
    if (inlineCount > 0) {
      inlineStyleHits += inlineCount;
      inlineStyleFiles += 1;
    }
  }

  const bundle = await collectBundleMetrics();

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      src: normalizeRel(srcRoot),
      features: normalizeRel(featuresRoot),
      buildDir: normalizeRel(buildRoot),
    },
    metrics: {
      bundleJsBytes: bundle.bundleJsBytes,
      globalCssBytes: bundle.globalCssBytes,
      buildFound: bundle.buildFound,
      ngDeepHits,
      ngDeepFiles,
      rawPrimeHits,
      rawPrimeFiles,
      rawVisualPrimitiveClassHits: rawVisualHits,
      rawVisualPrimitiveClassFiles: rawVisualFiles,
      inlineComponentStylesHits: inlineStyleHits,
      inlineComponentStyleFiles: inlineStyleFiles,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`[design-system-metrics] wrote ${normalizeRel(outputPath)}`);
  console.log(`[design-system-metrics] ngDeep=${ngDeepHits} rawPrime=${rawPrimeHits} rawVisualClasses=${rawVisualHits}`);
  if (bundle.buildFound) {
    console.log(`[design-system-metrics] bundleJsBytes=${bundle.bundleJsBytes} globalCssBytes=${bundle.globalCssBytes}`);
  } else {
    console.log('[design-system-metrics] build metrics unavailable (dist/frontendatlas/browser not found)');
  }
}

main().catch((err) => {
  console.error('[design-system-metrics] fatal:', err);
  process.exit(1);
});
