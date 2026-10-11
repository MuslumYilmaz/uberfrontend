#!/usr/bin/env node
// Keeps hashed build assets from recent deployments inside the published output.
//
// Googlebot fetches HTML and renders it days later. Every deploy renames the
// chunk files it changed, so a cached copy of a page keeps requesting
// chunk-XXXXXXXX.js files that the newest deployment no longer ships (Search
// Console crawl stats reported 163 such 404s in 90 days). This step copies the
// previous builds' hashed files forward from a build-cache store so those URLs
// keep resolving for a while after they stop being current.
//
// The store lives under node_modules/.cache, which Vercel restores between
// builds of the same project and branch. Everything here is best effort: a
// missing or corrupt store only means fewer files are carried, never a failed
// build, unless --strict is passed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MANIFEST_VERSION = 1;
export const MANIFEST_NAME = 'manifest.json';
export const DEFAULT_MAX_AGE_DAYS = 60;
export const DEFAULT_MAX_BYTES = 256 * 1024 * 1024;

const DAY_MS = 24 * 60 * 60 * 1000;
// Angular's production output hashes every bundle, style sheet and media file
// with eight upper-case base-36 characters. Source maps are never carried: the
// crawler does not request them and Sentry already received the current ones.
const HASHED_TOP_LEVEL = /^[\w.@-]+-[A-Z0-9]{8}\.(?:js|mjs|css)$/;
const HASHED_MEDIA = /^[\w.@-]+-[A-Z0-9]{8}\.[a-z0-9]{2,5}$/;

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function isIsoDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/** Hashed assets of a build output, as relative POSIX paths with byte sizes. */
export function listHashedAssets(outputDir) {
  const assets = new Map();
  const add = (relative, file) => {
    const stat = fs.statSync(file);
    if (stat.isFile()) assets.set(relative, stat.size);
  };
  for (const name of fs.readdirSync(outputDir)) {
    if (HASHED_TOP_LEVEL.test(name)) add(name, path.join(outputDir, name));
  }
  const mediaDir = path.join(outputDir, 'media');
  if (fs.existsSync(mediaDir) && fs.statSync(mediaDir).isDirectory()) {
    for (const name of fs.readdirSync(mediaDir)) {
      if (HASHED_MEDIA.test(name)) add(`media/${name}`, path.join(mediaDir, name));
    }
  }
  return assets;
}

function validEntries(manifest) {
  const files = manifest && manifest.version === MANIFEST_VERSION && manifest.files && typeof manifest.files === 'object'
    ? manifest.files : {};
  return Object.entries(files)
    .filter(([relative, entry]) => (HASHED_TOP_LEVEL.test(relative) || (relative.startsWith('media/') && HASHED_MEDIA.test(relative.slice(6))))
      && entry && isIsoDate(entry.firstSeen) && isIsoDate(entry.lastSeen) && Number.isSafeInteger(entry.size) && entry.size >= 0)
    .map(([relative, entry]) => [relative, { firstSeen: entry.firstSeen, lastSeen: entry.lastSeen, size: entry.size }]);
}

/**
 * Decide which previous assets to carry into this build. Pure, so it can be
 * tested without a file system.
 *
 * A file's `lastSeen` is the last build that shipped it as a current asset, so
 * it approximates the newest HTML that references it. Carried files are kept
 * for `maxAgeMs` after that, newest first, until `maxBytes` is spent.
 */
export function planAssetCarry({ current, manifest, now = Date.now(), maxAgeMs = DEFAULT_MAX_AGE_DAYS * DAY_MS, maxBytes = DEFAULT_MAX_BYTES }) {
  const nowIso = new Date(now).toISOString();
  const previous = new Map(validEntries(manifest));
  const files = {};
  for (const [relative, size] of [...current].sort(([a], [b]) => a.localeCompare(b))) {
    const known = previous.get(relative);
    files[relative] = {
      firstSeen: known && known.size === size ? known.firstSeen : nowIso,
      lastSeen: nowIso,
      size,
    };
  }
  const carry = [];
  const evict = [];
  const candidates = [...previous]
    .filter(([relative]) => !current.has(relative))
    .sort(([a, left], [b, right]) => right.lastSeen.localeCompare(left.lastSeen) || a.localeCompare(b));
  let budget = maxBytes;
  for (const [relative, entry] of candidates) {
    const age = now - Date.parse(entry.lastSeen);
    if (age < 0 || age > maxAgeMs || entry.size > budget) {
      evict.push(relative);
      continue;
    }
    budget -= entry.size;
    carry.push(relative);
    files[relative] = entry;
  }
  return { carry, evict, manifest: { version: MANIFEST_VERSION, files } };
}

export function readManifest(storeDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(storeDir, MANIFEST_NAME), 'utf8'));
  } catch {
    return null;
  }
}

function writeManifest(storeDir, manifest) {
  const file = path.join(storeDir, MANIFEST_NAME);
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temp, file);
}

function copyInto(sourceFile, targetFile) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);
}

/** Store this build's hashed assets and copy recent previous ones into the output. */
export function carryForwardAssets({
  outputDir, storeDir, now = Date.now(),
  maxAgeMs = DEFAULT_MAX_AGE_DAYS * DAY_MS, maxBytes = DEFAULT_MAX_BYTES, log = () => {},
}) {
  outputDir = path.resolve(outputDir);
  const manifest = readManifest(storeDir);
  const current = listHashedAssets(outputDir);
  // Files this step copied into the same output earlier are not part of the
  // build: a second run (no rebuild in between) must not re-date them.
  const lastRun = manifest?.lastRun;
  if (lastRun && lastRun.outputDir === outputDir && isIsoDate(lastRun.at) && Array.isArray(lastRun.carried)) {
    for (const relative of lastRun.carried) {
      if (!current.has(relative)) continue;
      // mtimes carry sub-millisecond precision; the marker only has milliseconds.
      if (Math.floor(fs.statSync(path.join(outputDir, relative)).mtimeMs) <= Date.parse(lastRun.at)) current.delete(relative);
    }
  }
  fs.mkdirSync(storeDir, { recursive: true });
  const plan = planAssetCarry({ current, manifest, now, maxAgeMs, maxBytes });

  for (const [relative, size] of current) {
    const stored = path.join(storeDir, relative);
    if (fs.existsSync(stored) && fs.statSync(stored).size === size) continue;
    copyInto(path.join(outputDir, relative), stored);
  }

  const carried = [];
  let carriedBytes = 0;
  for (const relative of plan.carry) {
    const stored = path.join(storeDir, relative);
    const target = path.join(outputDir, relative);
    if (!fs.existsSync(stored)) {
      log(`[asset-carry] store is missing ${relative}; dropping it`);
      delete plan.manifest.files[relative];
      continue;
    }
    if (!fs.existsSync(target)) copyInto(stored, target);
    carried.push(relative);
    carriedBytes += plan.manifest.files[relative].size;
  }

  // The manifest is the only source of truth for the store: evicted entries and
  // files from older manifest formats go away together.
  const keep = new Set(Object.keys(plan.manifest.files));
  const prune = (dir, prefix) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const relative = `${prefix}${name}`;
      const file = path.join(dir, name);
      if (fs.statSync(file).isDirectory()) {
        if (name === 'media' && !prefix) prune(file, 'media/');
        continue;
      }
      if (relative !== MANIFEST_NAME && !keep.has(relative)) fs.rmSync(file, { force: true });
    }
  };
  prune(storeDir, '');
  writeManifest(storeDir, { ...plan.manifest, lastRun: { outputDir, at: new Date().toISOString(), carried } });

  const summary = { current: current.size, carried: carried.length, carriedBytes, evicted: plan.evict.length, stored: keep.size };
  log(`[asset-carry] current=${summary.current} carried=${summary.carried} (${(carriedBytes / 1024 / 1024).toFixed(1)} MB) evicted=${summary.evicted} stored=${summary.stored}`);
  return summary;
}

function resolveOutputDir() {
  let base = 'dist/frontendatlas';
  let browser = 'browser';
  try {
    const angular = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'angular.json'), 'utf8'));
    const outputPath = angular.projects?.frontendatlas?.architect?.build?.options?.outputPath;
    if (typeof outputPath === 'string') base = outputPath;
    else if (outputPath && typeof outputPath === 'object') {
      base = outputPath.base || base;
      browser = outputPath.browser ?? browser;
    }
  } catch {
    // Fall back to the default Angular layout.
  }
  return path.resolve(frontendRoot, base, browser);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const strict = process.argv.includes('--strict');
  try {
    if (process.env.FA_ASSET_CARRY === '0') {
      console.log('[asset-carry] disabled by FA_ASSET_CARRY=0');
    } else {
      const outputDir = path.resolve(readArg('--output') || resolveOutputDir());
      const storeDir = path.resolve(readArg('--store') || process.env.FA_ASSET_CARRY_DIR
        || path.join(frontendRoot, 'node_modules', '.cache', 'frontendatlas-asset-carry'));
      const maxAgeDays = Number(readArg('--max-age-days') || process.env.FA_ASSET_CARRY_MAX_AGE_DAYS || DEFAULT_MAX_AGE_DAYS);
      if (!Number.isFinite(maxAgeDays) || maxAgeDays <= 0) throw new Error(`Invalid max age: ${maxAgeDays}`);
      if (!fs.existsSync(outputDir)) throw new Error(`Build output not found: ${outputDir}`);
      carryForwardAssets({ outputDir, storeDir, maxAgeMs: maxAgeDays * DAY_MS, log: (line) => console.log(line) });
    }
  } catch (error) {
    console.warn(`[asset-carry] skipped: ${error.message}`);
    if (strict) process.exitCode = 1;
  }
}
