import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { frontendRoot } from './content-paths.mjs';
import {
  MAX_URLS_PER_REQUEST,
  SITE_ORIGIN,
  buildIndexNowRequests,
  loadSitemapUrls,
  parseSitemap,
  readIndexNowKey,
  selectChangedUrls,
  sinceDate,
  submitToIndexNow,
} from './indexnow-submit.mjs';

const KEY = 'abcdef1234';
const urlset = (entries) => ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(([loc, lastmod]) => `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`),
  '</urlset>', ''].join('\n');
const sitemapIndex = (locs) => ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...locs.map((loc) => `  <sitemap>\n    <loc>${loc}</loc>\n  </sitemap>`), '</sitemapindex>', ''].join('\n');
const tempDir = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test('the committed key is served from the site root, where it covers every public URL', () => {
  const key = readIndexNowKey();
  const angular = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'angular.json'), 'utf8'));
  for (const target of ['build', 'prerender']) {
    const assets = angular.projects.frontendatlas.architect[target].options.assets;
    assert.ok(assets.some((asset) => asset.glob === '*.txt' && asset.input === 'src/indexnow' && asset.output === '/'),
      `the ${target} target must copy src/indexnow/*.txt to the site root`);
  }
  // Every ping names the file the engines fetch to verify ownership.
  const [request] = buildIndexNowRequests([`${SITE_ORIGIN}/`], { key });
  assert.equal(request.host, 'frontendatlas.com');
  assert.equal(request.keyLocation, `${SITE_ORIGIN}/${key}.txt`);
});

test('a key directory in the wrong shape is rejected before anything is submitted', (t) => {
  const dir = tempDir(t);
  assert.throws(() => readIndexNowKey(dir), /exactly one/);
  fs.writeFileSync(path.join(dir, `${KEY}.txt`), 'another-key');
  assert.throws(() => readIndexNowKey(dir), /contain only its own key/);
  fs.writeFileSync(path.join(dir, `${KEY}.txt`), `${KEY}\n`);
  assert.equal(readIndexNowKey(dir), KEY);
  fs.writeFileSync(path.join(dir, 'second-key.txt'), 'second-key');
  assert.throws(() => readIndexNowKey(dir), /exactly one/);
  const invalid = tempDir(t);
  fs.writeFileSync(path.join(invalid, 'bad_key.txt'), 'bad_key');
  assert.throws(() => readIndexNowKey(invalid), /8-128 characters/);
});

test('only URLs whose sitemap lastmod reached the cutoff are resubmitted', () => {
  const { urls } = parseSitemap(urlset([
    [`${SITE_ORIGIN}/`, '2026-10-15'],
    [`${SITE_ORIGIN}/react/trivia/react-keys`, '2026-10-13'],
    [`${SITE_ORIGIN}/css/coding/css-grid-card-gallery`, '2026-10-01'],
    [`${SITE_ORIGIN}/guides/framework-prep`],
  ]));
  assert.deepEqual(selectChangedUrls(urls, { since: '2026-10-13' }), [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/react/trivia/react-keys`]);
  assert.equal(selectChangedUrls(urls, { all: true }).length, 4);
  assert.throws(() => selectChangedUrls(urls, { since: 'yesterday' }), /YYYY-MM-DD/);
  assert.equal(sinceDate(2, new Date('2026-10-16T01:00:00Z')), '2026-10-14');
  assert.equal(sinceDate(0, new Date('2026-10-16T23:59:00Z')), '2026-10-16');
});

test('a sitemap index is followed to its shards, remotely and from a local build', async (t) => {
  const pages = new Map([
    [`${SITE_ORIGIN}/sitemap.xml`, sitemapIndex([`${SITE_ORIGIN}/sitemap-1.xml`, `${SITE_ORIGIN}/sitemap-2.xml`])],
    [`${SITE_ORIGIN}/sitemap-1.xml`, urlset([[`${SITE_ORIGIN}/a`, '2026-10-15']])],
    [`${SITE_ORIGIN}/sitemap-2.xml`, urlset([[`${SITE_ORIGIN}/b?x=1&amp;y=2`, '2026-10-15']])],
  ]);
  const fetchImpl = async (url) => ({ ok: pages.has(url), status: pages.has(url) ? 200 : 404, text: async () => pages.get(url) });
  const remote = await loadSitemapUrls(`${SITE_ORIGIN}/sitemap.xml`, { fetchImpl });
  assert.deepEqual(remote.map((entry) => entry.loc), [`${SITE_ORIGIN}/a`, `${SITE_ORIGIN}/b?x=1&y=2`]);

  const dir = tempDir(t);
  for (const [url, xml] of pages) fs.writeFileSync(path.join(dir, path.basename(new URL(url).pathname)), xml);
  const local = await loadSitemapUrls(path.join(dir, 'sitemap.xml'));
  assert.deepEqual(local.map((entry) => entry.lastmod), ['2026-10-15', '2026-10-15']);

  const failing = async () => ({ ok: false, status: 503, text: async () => '' });
  await assert.rejects(loadSitemapUrls(`${SITE_ORIGIN}/sitemap.xml`, { fetchImpl: failing, delayMs: 0 }), /Could not fetch .*HTTP 503/);
  assert.throws(() => parseSitemap('<html>challenge</html>'), /Not a sitemap/);
});

test('requests stay on the key host, drop duplicates and respect the 10,000 URL limit', () => {
  const many = Array.from({ length: MAX_URLS_PER_REQUEST + 1 }, (_, index) => `${SITE_ORIGIN}/q/${index}`);
  const requests = buildIndexNowRequests([...many, many[0]], { key: KEY });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].urlList.length, MAX_URLS_PER_REQUEST);
  assert.deepEqual(requests[1].urlList, [`${SITE_ORIGIN}/q/${MAX_URLS_PER_REQUEST}`]);
  assert.throws(() => buildIndexNowRequests(['https://frontendatlas.vercel.app/'], { key: KEY }), /not on https:\/\/frontendatlas\.com/);
  assert.throws(() => buildIndexNowRequests(['/relative'], { key: KEY }), /absolute URL/);
});

test('200 and 202 count as accepted, 403/422/429 fail loudly, dry runs send nothing', async () => {
  const calls = [];
  const fetchFor = (status, body = '') => async (url, init) => {
    calls.push({ url, init });
    return { status, text: async () => body };
  };
  const log = () => {};
  const urls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/pricing`];

  assert.deepEqual(await submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(200), log }), { submitted: 2, batches: 1 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.indexnow.org/indexnow');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(calls[0].init.body), { host: 'frontendatlas.com', key: KEY, keyLocation: `${SITE_ORIGIN}/${KEY}.txt`, urlList: urls });

  assert.equal((await submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(202), log })).submitted, 2);
  await assert.rejects(submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(403), log }), /HTTP 403 \(is the key file served at/);
  await assert.rejects(submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(422, 'host mismatch'), log }), /HTTP 422: host mismatch/);
  await assert.rejects(submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(429), log }), /HTTP 429/);

  calls.length = 0;
  await submitToIndexNow(urls, { key: KEY, fetchImpl: fetchFor(200), dryRun: true, log });
  assert.equal(calls.length, 0);
  assert.deepEqual(await submitToIndexNow([], { key: KEY, fetchImpl: fetchFor(200), log }), { submitted: 0, batches: 0 });
  assert.equal(calls.length, 0);
});
