#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.SEO_AUDIT_BASE_URL || 'https://frontendatlas.com').replace(/\/+$/, '');
const CONCURRENCY = Math.max(1, Number(process.env.SEO_AUDIT_CONCURRENCY || 18));
const MAX_URLS = Math.max(0, Number(process.env.SEO_AUDIT_MAX_URLS || 0));
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.SEO_AUDIT_TIMEOUT_MS || 15000));
const MAX_REDIRECT_HOPS = 6;
const OUTPUT_PATH = path.resolve(process.env.SEO_AUDIT_OUTPUT || 'reports/seo-incident-audit.json');
const USER_AGENT = process.env.SEO_AUDIT_USER_AGENT
  || 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function extractLocs(xml) {
  return Array.from(String(xml || '').matchAll(/<loc>(.*?)<\/loc>/gi))
    .map((match) => String(match[1] || '').trim())
    .filter(Boolean);
}

function normalizePath(rawPathname) {
  const raw = String(rawPathname || '').trim();
  if (!raw) return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const noQuery = withSlash.split('?')[0].split('#')[0];
  const clean = noQuery.replace(/\/+$/, '');
  return clean || '/';
}

function normalizeComparableUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim(), `${BASE_URL}/`);
    const pathname = normalizePath(parsed.pathname || '/');
    const port = parsed.port ? `:${parsed.port}` : '';
    const host = `${parsed.hostname.toLowerCase()}${port}`;
    if (pathname === '/') return `${parsed.protocol}//${host}/`;
    return `${parsed.protocol}//${host}${pathname}`;
  } catch {
    return String(rawUrl || '').trim();
  }
}

function resolveUrlMaybe(base, value) {
  try {
    return new URL(value, base).toString();
  } catch {
    return '';
  }
}

function parseMetaContent(html, regex) {
  const match = String(html || '').match(regex);
  return match ? String(match[1] || '').trim() : '';
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePageSignals(html) {
  const canonical = parseMetaContent(
    html,
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );
  const robots = parseMetaContent(
    html,
    /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  ).toLowerCase();
  const title = parseMetaContent(html, /<title[^>]*>([^<]*)<\/title>/i);
  const h1 = parseMetaContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ' ').trim();
  const textLength = stripTags(html).length;
  return { canonical, robots, title, h1, textLength };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}

async function loadSitemapUrls() {
  const indexUrl = `${BASE_URL}/sitemap-index.xml`;
  const fallbackUrl = `${BASE_URL}/sitemap.xml`;
  const headers = { 'user-agent': USER_AGENT, accept: 'application/xml,text/xml,*/*' };

  let sitemapFiles = [];

  try {
    const res = await fetchWithTimeout(indexUrl, { redirect: 'follow', headers });
    if (res.ok) {
      const xml = await res.text();
      sitemapFiles = extractLocs(xml).map((loc) => resolveUrlMaybe(indexUrl, loc)).filter(Boolean);
    }
  } catch {
    // ignore and fallback
  }

  if (!sitemapFiles.length) {
    sitemapFiles = [fallbackUrl];
  }

  const urls = new Set();
  for (const sitemapFile of sitemapFiles) {
    try {
      const res = await fetchWithTimeout(sitemapFile, { redirect: 'follow', headers });
      if (!res.ok) continue;
      const xml = await res.text();
      extractLocs(xml)
        .map((loc) => resolveUrlMaybe(sitemapFile, loc))
        .filter(Boolean)
        .forEach((url) => urls.add(url));
    } catch {
      // ignore one bad file
    }
  }

  return Array.from(urls).sort();
}

async function auditOneUrl(url) {
  const headers = { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,*/*;q=0.8' };
  const chain = [];
  let current = url;
  let response = null;
  let fetchError = '';

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    try {
      response = await fetchWithTimeout(current, {
        method: 'GET',
        redirect: 'manual',
        headers,
      });
    } catch (err) {
      fetchError = String(err?.message || err || 'fetch failed');
      break;
    }

    const status = Number(response.status || 0);
    const location = response.headers.get('location') || '';
    chain.push({ url: current, status, location });

    if (!isRedirectStatus(status) || !location) {
      break;
    }

    const next = resolveUrlMaybe(current, location);
    if (!next || next === current) {
      break;
    }
    current = next;
  }

  const final = chain[chain.length - 1] || { url: current, status: 0, location: '' };
  const finalUrl = final.url || current;
  const finalStatus = Number(final.status || 0);
  const redirectCount = Math.max(0, chain.length - 1);

  let html = '';
  let isHtml = false;
  let xRobots = '';

  if (response && finalStatus > 0 && !isRedirectStatus(finalStatus)) {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
    xRobots = String(response.headers.get('x-robots-tag') || '').trim().toLowerCase();

    if (isHtml && finalStatus === 200) {
      try {
        html = await response.text();
      } catch {
        html = '';
      }
    }
  }

  const signals = parsePageSignals(html);
  const sitemapComparable = normalizeComparableUrl(url);
  const finalComparable = normalizeComparableUrl(finalUrl);
  const canonicalComparable = signals.canonical ? normalizeComparableUrl(resolveUrlMaybe(finalUrl, signals.canonical)) : '';

  const robotsNoIndex = signals.robots.includes('noindex');
  const headerNoIndex = xRobots.includes('noindex');
  const canonicalMissing = finalStatus === 200 && isHtml && !signals.canonical;
  const canonicalMismatchFinal = finalStatus === 200 && isHtml && canonicalComparable
    && canonicalComparable !== finalComparable;
  const canonicalMismatchSitemap = finalStatus === 200 && isHtml && canonicalComparable
    && canonicalComparable !== sitemapComparable;

  let finalProtocol = '';
  let finalHost = '';
  let pathHasTrailingSlash = false;
  try {
    const parsedFinal = new URL(finalUrl);
    finalProtocol = parsedFinal.protocol.toLowerCase();
    finalHost = parsedFinal.hostname.toLowerCase();
    pathHasTrailingSlash = parsedFinal.pathname.length > 1 && parsedFinal.pathname.endsWith('/');
  } catch {
    // ignore
  }

  const finalHostProtocolMismatch = !!finalProtocol && (
    finalProtocol !== 'https:' || finalHost !== 'frontendatlas.com'
  );

  const lowTextContent = finalStatus === 200 && isHtml && signals.textLength < 250;
  const missingH1 = finalStatus === 200 && isHtml && !signals.h1;

  return {
    url,
    finalUrl,
    status: finalStatus || 0,
    redirectCount,
    chain,
    fetchError,
    isHtml,
    robotsMeta: signals.robots,
    xRobots,
    canonical: signals.canonical,
    canonicalComparable,
    title: signals.title,
    h1: signals.h1,
    textLength: signals.textLength,
    issues: {
      redirect: redirectCount > 0,
      non200: finalStatus !== 200,
      noindexMeta: robotsNoIndex,
      noindexHeader: headerNoIndex,
      canonicalMissing,
      canonicalMismatchFinal,
      canonicalMismatchSitemap,
      finalHostProtocolMismatch,
      trailingSlashFinal: pathHasTrailingSlash,
      lowTextContent,
      missingH1,
      fetchError: Boolean(fetchError),
    },
  };
}

async function mapConcurrent(items, limit, worker) {
  const out = new Array(items.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const current = idx;
      idx += 1;
      if (current >= items.length) break;
      out[current] = await worker(items[current], current);
      if ((current + 1) % 25 === 0 || current + 1 === items.length) {
        console.log(`[seo-incident-audit] audited ${current + 1}/${items.length}`);
      }
    }
  });

  await Promise.all(workers);
  return out;
}

function countBy(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(keyFn(item));
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Object.fromEntries(Array.from(map.entries()).sort((a, b) => {
    const aNum = Number(a[0]);
    const bNum = Number(b[0]);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
    return a[0].localeCompare(b[0]);
  }));
}

function topSamples(rows, predicate, max = 20) {
  return rows.filter(predicate).slice(0, max).map((row) => ({
    url: row.url,
    finalUrl: row.finalUrl,
    status: row.status,
    redirectCount: row.redirectCount,
    canonical: row.canonical,
    robotsMeta: row.robotsMeta,
    xRobots: row.xRobots,
    textLength: row.textLength,
  }));
}

function summarize(rows) {
  const summary = {
    total: rows.length,
    status: countBy(rows, (row) => row.status),
    redirect: rows.filter((row) => row.issues.redirect).length,
    non200: rows.filter((row) => row.issues.non200).length,
    noindexMeta: rows.filter((row) => row.issues.noindexMeta).length,
    noindexHeader: rows.filter((row) => row.issues.noindexHeader).length,
    canonicalMissing: rows.filter((row) => row.issues.canonicalMissing).length,
    canonicalMismatchFinal: rows.filter((row) => row.issues.canonicalMismatchFinal).length,
    canonicalMismatchSitemap: rows.filter((row) => row.issues.canonicalMismatchSitemap).length,
    finalHostProtocolMismatch: rows.filter((row) => row.issues.finalHostProtocolMismatch).length,
    trailingSlashFinal: rows.filter((row) => row.issues.trailingSlashFinal).length,
    lowTextContent: rows.filter((row) => row.issues.lowTextContent).length,
    missingH1: rows.filter((row) => row.issues.missingH1).length,
    fetchError: rows.filter((row) => row.issues.fetchError).length,
  };

  const samples = {
    redirect: topSamples(rows, (row) => row.issues.redirect),
    non200: topSamples(rows, (row) => row.issues.non200),
    noindexMeta: topSamples(rows, (row) => row.issues.noindexMeta),
    noindexHeader: topSamples(rows, (row) => row.issues.noindexHeader),
    canonicalMissing: topSamples(rows, (row) => row.issues.canonicalMissing),
    canonicalMismatchFinal: topSamples(rows, (row) => row.issues.canonicalMismatchFinal),
    canonicalMismatchSitemap: topSamples(rows, (row) => row.issues.canonicalMismatchSitemap),
    finalHostProtocolMismatch: topSamples(rows, (row) => row.issues.finalHostProtocolMismatch),
    lowTextContent: topSamples(rows, (row) => row.issues.lowTextContent),
    missingH1: topSamples(rows, (row) => row.issues.missingH1),
    fetchError: topSamples(rows, (row) => row.issues.fetchError),
  };

  return { summary, samples };
}

async function main() {
  const allUrls = await loadSitemapUrls();
  if (!allUrls.length) {
    throw new Error(`No sitemap URLs found at ${BASE_URL}`);
  }

  const urls = MAX_URLS > 0 ? allUrls.slice(0, MAX_URLS) : allUrls;
  console.log(`[seo-incident-audit] sitemap URLs loaded: ${allUrls.length}`);
  console.log(`[seo-incident-audit] auditing: ${urls.length} URLs (concurrency=${CONCURRENCY})`);

  const rows = await mapConcurrent(urls, CONCURRENCY, auditOneUrl);
  const { summary, samples } = summarize(rows);

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    config: {
      concurrency: CONCURRENCY,
      maxUrls: MAX_URLS,
      timeoutMs: REQUEST_TIMEOUT_MS,
      maxRedirectHops: MAX_REDIRECT_HOPS,
      userAgent: USER_AGENT,
    },
    summary,
    samples,
    rows,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`[seo-incident-audit] report: ${OUTPUT_PATH}`);
  console.log(`[seo-incident-audit] status counts: ${JSON.stringify(summary.status)}`);
  console.log(
    `[seo-incident-audit] non200=${summary.non200} redirects=${summary.redirect} noindexMeta=${summary.noindexMeta} canonicalMismatch=${summary.canonicalMismatchFinal}`,
  );
}

main().catch((err) => {
  console.error(`[seo-incident-audit] failed: ${String(err?.message || err)}`);
  process.exit(1);
});
