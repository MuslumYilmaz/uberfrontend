#!/usr/bin/env node
// Tells IndexNow which public URLs changed so Bing, Yandex, Naver, Seznam and Yep
// recrawl them without waiting for the sitemap. One endpoint shares the ping with
// every participating engine. Google does not take part: its recrawl still goes
// through Search Console. The script has no npm dependencies on purpose, so the
// post-deploy workflow runs it from a bare checkout.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { srcDir } from './content-paths.mjs';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const SITE_ORIGIN = 'https://frontendatlas.com';
export const MAX_URLS_PER_REQUEST = 10000;
// angular.json copies this directory to the site root. The key must be served
// from the root: a key file below a path only covers URLs under that path.
export const indexNowKeyDir = path.join(srcDir, 'indexnow');
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const ACCEPTED_STATUSES = new Set([200, 202]);

export function readIndexNowKey(dir = indexNowKeyDir) {
  const names = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.txt')) : [];
  if (names.length !== 1) throw new Error(`Expected exactly one IndexNow key file in ${dir}, found ${names.length}.`);
  const key = names[0].slice(0, -'.txt'.length);
  if (!KEY_PATTERN.test(key)) throw new Error(`IndexNow key "${key}" must be 8-128 characters from a-z, A-Z, 0-9 and dashes.`);
  if (fs.readFileSync(path.join(dir, names[0]), 'utf8').trim() !== key) {
    throw new Error(`${names[0]} must contain only its own key; search engines read the file to verify ownership.`);
  }
  return key;
}

const unescapeXml = (value) => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// A sitemap index yields { sitemaps }, a urlset yields { urls: [{ loc, lastmod }] }.
export function parseSitemap(xml) {
  const read = (block, tag) => {
    const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? unescapeXml(match[1].trim()) : undefined;
  };
  if (/<sitemapindex[\s>]/.test(xml)) {
    return { sitemaps: [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)].map(([, block]) => read(block, 'loc')).filter(Boolean) };
  }
  if (!/<urlset[\s>]/.test(xml)) throw new Error('Not a sitemap: expected <urlset> or <sitemapindex>.');
  return {
    urls: [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
      .map(([, block]) => ({ loc: read(block, 'loc'), lastmod: read(block, 'lastmod') }))
      .filter((entry) => entry.loc),
  };
}

export function selectChangedUrls(urls, { since, all = false } = {}) {
  if (!all && !/^\d{4}-\d{2}-\d{2}$/.test(since || '')) throw new Error('since must be a YYYY-MM-DD date.');
  // lastmod is a calendar day (see generate-sitemap.mjs), so the strings compare as dates.
  return urls.filter((entry) => all || (entry.lastmod && entry.lastmod >= since)).map((entry) => entry.loc);
}

export function sinceDate(days, today = new Date()) {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - days)).toISOString().slice(0, 10);
}

export function buildIndexNowRequests(urls, { key, origin = SITE_ORIGIN }) {
  const base = new URL(origin);
  const unique = [...new Set(urls)];
  for (const url of unique) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error(`Not an absolute URL: ${url}`); }
    if (parsed.origin !== base.origin) throw new Error(`${url} is not on ${base.origin}; IndexNow rejects URLs outside the key's host.`);
  }
  const requests = [];
  for (let offset = 0; offset < unique.length; offset += MAX_URLS_PER_REQUEST) {
    requests.push({
      host: base.hostname,
      key,
      keyLocation: `${base.origin}/${key}.txt`,
      urlList: unique.slice(offset, offset + MAX_URLS_PER_REQUEST),
    });
  }
  return requests;
}

export async function submitToIndexNow(urls, {
  key, origin = SITE_ORIGIN, endpoint = INDEXNOW_ENDPOINT, fetchImpl = globalThis.fetch, dryRun = false, log = console.log,
} = {}) {
  const requests = buildIndexNowRequests(urls, { key, origin });
  if (!requests.length) log('[indexnow] nothing to submit');
  for (const body of requests) {
    if (dryRun) {
      log(`[indexnow] dry run: would submit ${body.urlList.length} URLs`);
      for (const url of body.urlList) log(`  ${url}`);
      continue;
    }
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (!ACCEPTED_STATUSES.has(response.status)) {
      const detail = (await response.text().catch(() => '')).trim().slice(0, 300);
      const hint = response.status === 403 ? ` (is the key file served at ${body.keyLocation}?)`
        : response.status === 429 ? ' (too many submissions; wait before retrying)' : '';
      throw new Error(`IndexNow answered HTTP ${response.status}${hint}${detail ? `: ${detail}` : ''}`);
    }
    log(`[indexnow] HTTP ${response.status}: ${body.urlList.length} URLs ${response.status === 202 ? 'received, key validation pending' : 'submitted'}`);
  }
  return { submitted: requests.reduce((count, request) => count + request.urlList.length, 0), batches: requests.length };
}

async function fetchText(url, { fetchImpl, attempts = 3, delayMs = 5000 }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url);
      if (response.ok) return await response.text();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
  }
  throw new Error(`Could not fetch ${url}: ${lastError.message}`);
}

// `source` is the live sitemap URL or a local sitemap file; an index is followed to its shards.
export async function loadSitemapUrls(source, { fetchImpl = globalThis.fetch, delayMs } = {}) {
  const remote = /^https?:\/\//.test(source);
  const readSource = (target) => (remote ? fetchText(target, { fetchImpl, delayMs }) : fs.promises.readFile(target, 'utf8'));
  const parsed = parseSitemap(await readSource(source));
  if (parsed.urls) return parsed.urls;
  // Index entries are absolute URLs; a local index maps them to sibling files.
  const shards = parsed.sitemaps.map((loc) => (remote ? loc : path.join(path.dirname(source), path.basename(new URL(loc).pathname))));
  const nested = await Promise.all(shards.map(async (shard) => parseSitemap(await readSource(shard)).urls || []));
  return nested.flat();
}

function parseArgs(argv) {
  const options = { sitemap: `${SITE_ORIGIN}/sitemap.xml`, days: 2, since: undefined, all: false, urls: [], dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      index += 1;
      if (argv[index] === undefined) throw new Error(`${arg} needs a value.`);
      return argv[index];
    };
    if (arg === '--sitemap') options.sitemap = value();
    else if (arg === '--days') options.days = Number(value());
    else if (arg === '--since') options.since = value();
    else if (arg === '--all') options.all = true;
    else if (arg === '--url') options.urls.push(value());
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}. Use --sitemap <url|file>, --days <n>, --since <YYYY-MM-DD>, --all, --url <url>, --dry-run.`);
  }
  if (!Number.isInteger(options.days) || options.days < 0) throw new Error('--days must be a whole number of days.');
  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  const key = readIndexNowKey();
  let urls = options.urls;
  if (!urls.length) {
    const entries = await loadSitemapUrls(options.sitemap);
    const since = options.since || sinceDate(options.days);
    urls = selectChangedUrls(entries, { since, all: options.all });
    console.log(options.all
      ? `[indexnow] submitting all ${urls.length} URLs from ${options.sitemap}`
      : `[indexnow] ${urls.length} of ${entries.length} URLs in ${options.sitemap} changed since ${since}`);
  }
  const result = await submitToIndexNow(urls, { key, dryRun: options.dryRun });
  if (result.submitted) console.log(`[indexnow] ${options.dryRun ? 'dry run complete' : 'done'}: ${result.submitted} URLs in ${result.batches} request(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(`[indexnow] ${error.message}`); process.exitCode = 1; });
}
