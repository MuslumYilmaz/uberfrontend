import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MAX_BYTES, MANIFEST_NAME, MANIFEST_VERSION,
  carryForwardAssets, listHashedAssets, planAssetCarry, readManifest,
} from './carry-forward-assets.mjs';

const DAY = 24 * 60 * 60 * 1000;
const DAY0 = Date.UTC(2026, 9, 1);
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'carry-forward-assets.mjs');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'asset-carry-'));
}

function writeBuild(dir, files) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(dir, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return fs.statSync(file).isDirectory() ? listFiles(file, `${prefix}${name}/`) : [`${prefix}${name}`];
  }).sort();
}

test('listHashedAssets keeps hashed bundles, styles and media and ignores maps, HTML and plain assets', () => {
  const dir = tempDir();
  writeBuild(dir, {
    'chunk-AAAAAAAA.js': 'a', 'chunk-AAAAAAAA.js.map': '{}', 'main-BBBBBBBB.js': 'bb', 'styles-CCCCCCCC.css': 'ccc',
    'track-list.component-DDDDDDDD.css': 'd', 'index.html': '<html>', 'index.csr.html': '<html>', '3rdpartylicenses.txt': 'x',
    'media/logo-EEEEEEEE.svg': '<svg/>', 'media/readme.txt': 'no', 'assets/vendor/monaco-0.52.0/loader.js': 'v', 'chunk-lowercase.js': 'n',
  });
  assert.deepEqual([...listHashedAssets(dir)].sort(), [
    ['chunk-AAAAAAAA.js', 1], ['main-BBBBBBBB.js', 2], ['media/logo-EEEEEEEE.svg', 6],
    ['styles-CCCCCCCC.css', 3], ['track-list.component-DDDDDDDD.css', 1],
  ]);
});

test('planAssetCarry dates a first build and carries nothing', () => {
  const plan = planAssetCarry({ current: new Map([['main-AAAAAAAA.js', 10]]), manifest: null, now: DAY0 });
  assert.deepEqual(plan, {
    carry: [], evict: [],
    manifest: { version: MANIFEST_VERSION, files: { 'main-AAAAAAAA.js': { firstSeen: new Date(DAY0).toISOString(), lastSeen: new Date(DAY0).toISOString(), size: 10 } } },
  });
});

test('planAssetCarry carries recent previous files, keeps provenance of unchanged ones and re-dates changed ones', () => {
  const day0 = new Date(DAY0).toISOString();
  const day1 = new Date(DAY0 + DAY).toISOString();
  const manifest = { version: MANIFEST_VERSION, files: {
    'chunk-AAAAAAAA.js': { firstSeen: day0, lastSeen: day0, size: 5 },
    'styles-CCCCCCCC.css': { firstSeen: day0, lastSeen: day0, size: 3 },
    'main-BBBBBBBB.js': { firstSeen: day0, lastSeen: day0, size: 7 },
  } };
  const plan = planAssetCarry({ current: new Map([['main-BBBBBBBB.js', 7], ['styles-CCCCCCCC.css', 4], ['chunk-DDDDDDDD.js', 2]]), manifest, now: DAY0 + DAY });
  assert.deepEqual(plan.carry, ['chunk-AAAAAAAA.js']);
  assert.deepEqual(plan.evict, []);
  assert.deepEqual(plan.manifest.files, {
    'chunk-AAAAAAAA.js': { firstSeen: day0, lastSeen: day0, size: 5 },
    'chunk-DDDDDDDD.js': { firstSeen: day1, lastSeen: day1, size: 2 },
    'main-BBBBBBBB.js': { firstSeen: day0, lastSeen: day1, size: 7 },
    // Same name with a different size is a different file: it starts over.
    'styles-CCCCCCCC.css': { firstSeen: day1, lastSeen: day1, size: 4 },
  });
});

test('planAssetCarry evicts by the last build that shipped a file, not by its first appearance', () => {
  const old = new Date(DAY0 - 200 * DAY).toISOString();
  const recent = new Date(DAY0 - DAY).toISOString();
  const stale = new Date(DAY0 - 61 * DAY).toISOString();
  const manifest = { version: MANIFEST_VERSION, files: {
    'chunk-AAAAAAAA.js': { firstSeen: old, lastSeen: recent, size: 1 },
    'chunk-BBBBBBBB.js': { firstSeen: old, lastSeen: stale, size: 1 },
    'chunk-CCCCCCCC.js': { firstSeen: recent, lastSeen: new Date(DAY0 + DAY).toISOString(), size: 1 },
  } };
  const plan = planAssetCarry({ current: new Map(), manifest, now: DAY0 });
  assert.deepEqual(plan.carry, ['chunk-AAAAAAAA.js']);
  assert.deepEqual(plan.evict.sort(), ['chunk-BBBBBBBB.js', 'chunk-CCCCCCCC.js']);
});

test('planAssetCarry spends the byte budget on the newest files first', () => {
  const newer = new Date(DAY0 - DAY).toISOString();
  const older = new Date(DAY0 - 2 * DAY).toISOString();
  const manifest = { version: MANIFEST_VERSION, files: {
    'chunk-AAAAAAAA.js': { firstSeen: older, lastSeen: older, size: 60 },
    'chunk-BBBBBBBB.js': { firstSeen: newer, lastSeen: newer, size: 50 },
    'chunk-CCCCCCCC.js': { firstSeen: newer, lastSeen: newer, size: 40 },
  } };
  const plan = planAssetCarry({ current: new Map(), manifest, now: DAY0, maxBytes: 100 });
  assert.deepEqual(plan.carry, ['chunk-BBBBBBBB.js', 'chunk-CCCCCCCC.js']);
  assert.deepEqual(plan.evict, ['chunk-AAAAAAAA.js']);
});

test('planAssetCarry ignores manifests it cannot trust', () => {
  const day = new Date(DAY0).toISOString();
  const cases = [
    { version: 99, files: { 'chunk-AAAAAAAA.js': { firstSeen: day, lastSeen: day, size: 1 } } },
    { version: MANIFEST_VERSION, files: { 'chunk-AAAAAAAA.js': { firstSeen: 'yesterday', lastSeen: day, size: 1 } } },
    { version: MANIFEST_VERSION, files: { '../escape-AAAAAAAA.js': { firstSeen: day, lastSeen: day, size: 1 } } },
    { version: MANIFEST_VERSION, files: { 'chunk-AAAAAAAA.js.map': { firstSeen: day, lastSeen: day, size: 1 } } },
    { version: MANIFEST_VERSION, files: { 'chunk-AAAAAAAA.js': { firstSeen: day, lastSeen: day, size: -1 } } },
    'not an object',
  ];
  for (const manifest of cases) {
    const plan = planAssetCarry({ current: new Map(), manifest, now: DAY0 + DAY });
    assert.deepEqual(plan, { carry: [], evict: [], manifest: { version: MANIFEST_VERSION, files: {} } }, JSON.stringify(manifest));
  }
});

test('carryForwardAssets stores a build, carries it into the next build and evicts it when it ages out', () => {
  const output = tempDir();
  const store = path.join(tempDir(), 'store');
  const logs = [];
  const log = (line) => logs.push(line);

  writeBuild(output, {
    'chunk-AAAAAAAA.js': 'aaaa', 'chunk-AAAAAAAA.js.map': '{}', 'main-BBBBBBBB.js': 'bb', 'styles-CCCCCCCC.css': 'c',
    'index.html': '<html>', 'media/logo-DDDDDDDD.svg': '<svg/>',
  });
  let summary = carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0, log });
  assert.deepEqual(summary, { current: 4, carried: 0, carriedBytes: 0, evicted: 0, stored: 4 });
  assert.deepEqual(listFiles(store), ['chunk-AAAAAAAA.js', 'main-BBBBBBBB.js', MANIFEST_NAME, 'media/logo-DDDDDDDD.svg', 'styles-CCCCCCCC.css']);
  assert.deepEqual(listFiles(output), ['chunk-AAAAAAAA.js', 'chunk-AAAAAAAA.js.map', 'index.html', 'main-BBBBBBBB.js', 'media/logo-DDDDDDDD.svg', 'styles-CCCCCCCC.css']);

  // Next deploy renamed main and the chunk; styles stayed the same.
  writeBuild(output, { 'main-EEEEEEEE.js': 'ee', 'chunk-FFFFFFFF.js': 'ff', 'styles-CCCCCCCC.css': 'c', 'index.html': '<html>' });
  summary = carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0 + DAY, log });
  assert.deepEqual(summary, { current: 3, carried: 3, carriedBytes: 12, evicted: 0, stored: 6 });
  assert.deepEqual(listFiles(output), ['chunk-AAAAAAAA.js', 'chunk-FFFFFFFF.js', 'index.html', 'main-BBBBBBBB.js', 'main-EEEEEEEE.js', 'media/logo-DDDDDDDD.svg', 'styles-CCCCCCCC.css']);
  assert.equal(fs.readFileSync(path.join(output, 'chunk-AAAAAAAA.js'), 'utf8'), 'aaaa');
  assert.equal(readManifest(store).files['chunk-AAAAAAAA.js'].lastSeen, new Date(DAY0).toISOString());
  assert.equal(readManifest(store).files['styles-CCCCCCCC.css'].lastSeen, new Date(DAY0 + DAY).toISOString());

  // Running the step again on the same output neither re-dates nor re-stores the carried files.
  const again = carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0 + 2 * DAY, log });
  assert.deepEqual(again, summary);
  assert.equal(readManifest(store).files['chunk-AAAAAAAA.js'].lastSeen, new Date(DAY0).toISOString());

  // Seventy days later only the current bundle survives; the day-0 and day-1 files are gone.
  writeBuild(output, { 'main-EEEEEEEE.js': 'ee', 'index.html': '<html>' });
  summary = carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0 + 70 * DAY, log });
  assert.deepEqual(summary, { current: 1, carried: 0, carriedBytes: 0, evicted: 5, stored: 1 });
  assert.deepEqual(listFiles(store), ['main-EEEEEEEE.js', MANIFEST_NAME]);
  assert.deepEqual(listFiles(output), ['index.html', 'main-EEEEEEEE.js']);
  assert.ok(logs.every((line) => line.startsWith('[asset-carry]')));
});

test('carryForwardAssets drops manifest entries whose stored file disappeared', () => {
  const output = tempDir();
  const store = path.join(tempDir(), 'store');
  writeBuild(output, { 'chunk-AAAAAAAA.js': 'a', 'index.html': '' });
  carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0 });
  fs.rmSync(path.join(store, 'chunk-AAAAAAAA.js'));
  writeBuild(output, { 'chunk-BBBBBBBB.js': 'b', 'index.html': '' });
  const summary = carryForwardAssets({ outputDir: output, storeDir: store, now: DAY0 + DAY });
  assert.deepEqual(summary, { current: 1, carried: 0, carriedBytes: 0, evicted: 0, stored: 1 });
  assert.deepEqual(Object.keys(readManifest(store).files), ['chunk-BBBBBBBB.js']);
  assert.deepEqual(listFiles(output), ['chunk-BBBBBBBB.js', 'index.html']);
});

test('the CLI never fails a build unless --strict is passed', () => {
  const missing = path.join(tempDir(), 'does-not-exist');
  const run = (args) => {
    try {
      return { status: 0, output: execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
    } catch (error) {
      return { status: error.status, output: `${error.stdout}${error.stderr}` };
    }
  };
  const lenient = execFileSync(process.execPath, [script, '--output', missing, '--store', path.join(missing, 'store')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.equal(lenient, '');
  const strict = run(['--output', missing, '--store', path.join(missing, 'store'), '--strict']);
  assert.equal(strict.status, 1);
  assert.match(strict.output, /\[asset-carry\] skipped: Build output not found/);
  const disabled = run(['--output', missing]);
  assert.equal(disabled.status, 0);
  assert.equal(DEFAULT_MAX_BYTES, 256 * 1024 * 1024);
});
