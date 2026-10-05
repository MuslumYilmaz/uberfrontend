import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSitemapFiles } from './generate-sitemap.mjs';
import { contentDateFiles, strictSeoEnvironment, verifyOrWriteFiles } from './generate-seo-content-dates.mjs';

test('deterministic canonical XML includes only resolved dates and escapes markup', () => {
  const routes = { '/z': {}, '/a&b': { lastmod: '2026-01-02' } };
  const files = buildSitemapFiles(routes);
  assert.equal(files.get('sitemap.xml'), files.get('sitemap-1.xml'));
  assert.match(files.get('sitemap.xml'), /https:\/\/frontendatlas.com\/a&amp;b/);
  assert.equal((files.get('sitemap.xml').match(/<lastmod>/g) || []).length, 1);
  assert.deepEqual(files, buildSitemapFiles({ '/a&b': routes['/a&b'], '/z': routes['/z'] }));
});

test('public sitemap entrypoint covers every shard once splitting is necessary', () => {
  const files = buildSitemapFiles({ '/a': {}, '/b': {}, '/c': {} }, { maxUrls: 2 });
  assert.equal(files.get('sitemap.xml'), files.get('sitemap-index.xml'));
  assert.match(files.get('sitemap.xml'), /sitemap-2.xml/);
  assert.match(files.get('sitemap-2.xml'), /\/c<\/loc>/);
});

test('rejects empty inventories, URL variants, invalid dates and invalid host configuration', () => {
  assert.throws(() => buildSitemapFiles({}), /empty/);
  for (const route of ['/a/', '/a?q=1', '//host/a', '/a#fragment']) assert.throws(() => buildSitemapFiles({ [route]: {} }), /canonical/);
  for (const lastmod of ['2026-02-30', 'yesterday', '2026-13-01']) assert.throws(() => buildSitemapFiles({ '/a': { lastmod } }), /lastmod/);
  assert.throws(() => buildSitemapFiles({ '/a': {} }, { baseUrl: 'https://example.com/subdirectory' }), /origin/);
});

test('check mode detects stale or missing files without writing; generation is idempotent', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-output-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'generated.xml');
  const files = new Map([[file, 'expected']]);
  assert.throws(() => verifyOrWriteFiles(files, { check: true }), /missing/);
  assert.equal(fs.existsSync(file), false);
  verifyOrWriteFiles(files);
  const previousMtime = fs.statSync(file).mtimeMs;
  verifyOrWriteFiles(files);
  assert.equal(fs.statSync(file).mtimeMs, previousMtime);
  fs.writeFileSync(file, 'stale');
  assert.throws(() => verifyOrWriteFiles(files, { check: true }), /Stale/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'stale');
});

test('runtime date output contains no Git provenance or pending dates', () => {
  const report = { revision: 'abc123', routes: { '/known': { lastmod: '2026-01-02', sourceCommit: 'abc123' }, '/pending': { fingerprint: 'pendinghash' } } };
  const runtime = [...contentDateFiles(report)].find(([file]) => file.endsWith('.ts'))[1];
  assert.match(runtime, /2026-01-02/);
  assert.doesNotMatch(runtime, /abc123|sourceCommit|pending/);
});

test('CI and Vercel enforce strict dates; local previews remain possible', () => {
  assert.equal(strictSeoEnvironment({}), false);
  assert.equal(strictSeoEnvironment({ CI: 'false' }), false);
  for (const env of [{ CI: 'true' }, { VERCEL: '1' }, { VERCEL_ENV: 'production' }, { VERCEL_ENV: 'preview' }]) assert.equal(strictSeoEnvironment(env), true);
});
