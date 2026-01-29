#!/usr/bin/env node

const BASE_URL = (process.env.SITEMAP_BASE_URL || 'https://frontendatlas.com').replace(/\/$/, '');
const SAMPLE_SIZE = Number(process.env.SAMPLE || 30);

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
    .map((m) => (m[1] || '').trim())
    .filter(Boolean);
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickSample(list, size) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(size, copy.length));
}

function findTag(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { status: res.status, text };
}

async function loadSitemapUrls() {
  const indexUrl = `${BASE_URL}/sitemap-index.xml`;
  try {
    const { status, text } = await fetchText(indexUrl);
    if (status >= 200 && status < 300) {
      const sitemapFiles = extractLocs(text);
      if (sitemapFiles.length) {
        const all = [];
        for (const loc of sitemapFiles) {
          try {
            const { text: xml } = await fetchText(loc);
            all.push(...extractLocs(xml));
          } catch {
            // ignore bad sitemap file
          }
        }
        if (all.length) return all;
      }
    }
  } catch {
    // ignore
  }

  const fallback = `${BASE_URL}/sitemap.xml`;
  const { text } = await fetchText(fallback);
  return extractLocs(text);
}

(async () => {
  const urls = await loadSitemapUrls();
  if (!urls.length) {
    console.error('No sitemap URLs found.');
    process.exit(1);
  }

  const sample = pickSample(urls, SAMPLE_SIZE);
  const rows = [];

  for (const url of sample) {
    try {
      const { status, text } = await fetchText(url);
      const title = findTag(text, /<title[^>]*>([^<]*)<\/title>/i);
      const canonical = findTag(text, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      const robots = findTag(text, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i);
      const textLen = stripTags(text).length;

      rows.push({
        status,
        url,
        title: title.slice(0, 80),
        canonical: canonical.slice(0, 80),
        robots: robots.slice(0, 40),
        textLen,
      });
    } catch (err) {
      rows.push({
        status: 'ERR',
        url,
        title: '',
        canonical: '',
        robots: '',
        textLen: 0,
      });
    }
  }

  console.table(rows);
})();
