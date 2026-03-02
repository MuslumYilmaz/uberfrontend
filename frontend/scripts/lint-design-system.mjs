#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const featuresRoot = path.join(srcRoot, 'app', 'features');
const allowlistPath = path.join(projectRoot, 'scripts', 'design-system-allowlist.json');

const args = new Set(process.argv.slice(2));
const strictMode = args.has('--strict');
const updateAllowlist = args.has('--update-allowlist');

const PRIME_PATTERNS = [
  { key: 'pButton', regex: /\bpButton\b/g },
  { key: 'p-chip', regex: /<\s*p-chip\b/gi },
  { key: 'p-dialog', regex: /<\s*p-dialog\b/gi },
];

const VISUAL_CLASS_PATTERN = /\bfa-(btn|chip|card)\b/g;
const NG_DEEP_PATTERN = /::ng-deep/g;
const RAW_COLOR_LITERAL_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;

const RAW_COLOR_LITERAL_FILE_EXCLUDES = [
  'src/assets/monaco/',
];

const APPROVED_COLOR_LITERAL_FILES = new Set([
  'src/styles/tokens.scss',
]);

const APPROVED_NG_DEEP_FILES = new Set([
  'src/styles/prime-bridge.scss',
]);

async function walkFiles(dir, predicate, out = []) {
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
  return out;
}

function normalizeRel(fullPath) {
  return path.relative(projectRoot, fullPath).replace(/\\/g, '/');
}

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort();
}

async function readAllowlist() {
  try {
    const raw = await fs.readFile(allowlistPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      rawPrimeTemplates: new Set(parsed.rawPrimeTemplates || []),
      ngDeep: new Set(parsed.ngDeep || []),
      rawVisualClasses: new Set(parsed.rawVisualClasses || []),
      rawColorLiterals: new Set(parsed.rawColorLiterals || []),
    };
  } catch {
    return {
      rawPrimeTemplates: new Set(),
      ngDeep: new Set(),
      rawVisualClasses: new Set(),
      rawColorLiterals: new Set(),
    };
  }
}

function diffNew(current, allowed) {
  return Array.from(current).filter((item) => !allowed.has(item)).sort();
}

function printGroup(title, items) {
  if (!items.length) return;
  console.log(`\n${title}`);
  items.forEach((item) => console.log(`  - ${item}`));
}

async function main() {
  const featureHtmlFiles = await walkFiles(featuresRoot, (f) => f.endsWith('.html'));
  const appSourceFiles = await walkFiles(
    path.join(srcRoot, 'app'),
    (f) => f.endsWith('.ts') || f.endsWith('.scss') || f.endsWith('.css'),
  );
  const styleFiles = await walkFiles(
    srcRoot,
    (f) => f.endsWith('.scss') || f.endsWith('.css'),
  );

  const rawPrimeFiles = [];
  const visualClassFiles = [];
  const ngDeepFiles = [];
  const rawColorLiteralFiles = [];

  let rawPrimeCount = 0;
  let visualClassCount = 0;
  let ngDeepCount = 0;
  let rawColorLiteralCount = 0;

  for (const file of featureHtmlFiles) {
    const rel = normalizeRel(file);
    const text = await fs.readFile(file, 'utf8');

    let primeHits = 0;
    for (const { regex } of PRIME_PATTERNS) {
      primeHits += countMatches(text, regex);
    }
    if (primeHits > 0) {
      rawPrimeFiles.push(rel);
      rawPrimeCount += primeHits;
    }

    const visualHits = countMatches(text, VISUAL_CLASS_PATTERN);
    if (visualHits > 0) {
      visualClassFiles.push(rel);
      visualClassCount += visualHits;
    }
  }

  for (const file of appSourceFiles) {
    const rel = normalizeRel(file);
    if (APPROVED_NG_DEEP_FILES.has(rel)) {
      continue;
    }
    const text = await fs.readFile(file, 'utf8');
    const deepHits = countMatches(text, NG_DEEP_PATTERN);
    if (deepHits > 0) {
      ngDeepFiles.push(rel);
      ngDeepCount += deepHits;
    }
  }

  for (const file of styleFiles) {
    const rel = normalizeRel(file);
    if (RAW_COLOR_LITERAL_FILE_EXCLUDES.some((prefix) => rel.startsWith(prefix))) {
      continue;
    }
    if (APPROVED_COLOR_LITERAL_FILES.has(rel)) {
      continue;
    }

    const text = await fs.readFile(file, 'utf8');
    const colorHits = countMatches(text, RAW_COLOR_LITERAL_PATTERN);
    if (colorHits > 0) {
      rawColorLiteralFiles.push(rel);
      rawColorLiteralCount += colorHits;
    }
  }

  const current = {
    rawPrimeTemplates: uniqueSorted(rawPrimeFiles),
    ngDeep: uniqueSorted(ngDeepFiles),
    rawVisualClasses: uniqueSorted(visualClassFiles),
    rawColorLiterals: uniqueSorted(rawColorLiteralFiles),
  };

  if (updateAllowlist) {
    await fs.writeFile(allowlistPath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    console.log(`[lint:design-system] allowlist updated: ${normalizeRel(allowlistPath)}`);
    console.log(`[lint:design-system] raw prime files: ${current.rawPrimeTemplates.length}`);
    console.log(`[lint:design-system] ng-deep files: ${current.ngDeep.length}`);
    console.log(`[lint:design-system] raw visual class files: ${current.rawVisualClasses.length}`);
    console.log(`[lint:design-system] raw color literal files: ${current.rawColorLiterals.length}`);
    return;
  }

  const allowlist = await readAllowlist();
  const newPrime = diffNew(current.rawPrimeTemplates, allowlist.rawPrimeTemplates);
  const newNgDeep = diffNew(current.ngDeep, allowlist.ngDeep);
  const newVisual = diffNew(current.rawVisualClasses, allowlist.rawVisualClasses);
  const newRawColor = diffNew(current.rawColorLiterals, allowlist.rawColorLiterals);

  console.log('[lint:design-system] summary');
  console.log(`  raw prime usage hits: ${rawPrimeCount} across ${current.rawPrimeTemplates.length} files`);
  console.log(`  ::ng-deep hits: ${ngDeepCount} across ${current.ngDeep.length} files`);
  console.log(`  raw visual class hits: ${visualClassCount} across ${current.rawVisualClasses.length} files`);
  console.log(`  raw color literal hits: ${rawColorLiteralCount} across ${current.rawColorLiterals.length} files`);
  console.log(`  mode: ${strictMode ? 'strict' : 'warning'}`);

  printGroup('New raw Prime usage files (not allowlisted):', newPrime);
  printGroup('New ::ng-deep files (not allowlisted):', newNgDeep);
  printGroup('New raw visual class files (not allowlisted):', newVisual);
  printGroup('New raw color literal style files (not allowlisted):', newRawColor);

  const violationCount = newPrime.length + newNgDeep.length + newVisual.length + newRawColor.length;
  if (violationCount > 0 && strictMode) {
    console.error(`\n[lint:design-system] failed: ${violationCount} new design-system violations.`);
    process.exit(1);
  }

  if (violationCount > 0) {
    console.warn(`\n[lint:design-system] warning: ${violationCount} new design-system violations.`);
    return;
  }

  console.log('\n[lint:design-system] passed: no new design-system violations.');
}

main().catch((err) => {
  console.error('[lint:design-system] fatal:', err);
  process.exit(1);
});
