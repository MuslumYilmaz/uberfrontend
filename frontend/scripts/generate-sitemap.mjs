#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sitemapDir } from './content-paths.mjs';
import { generateContentDates, strictSeoEnvironment, verifyOrWriteFiles } from './generate-seo-content-dates.mjs';

const escapeXml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function buildSitemapFiles(routes, { baseUrl = 'https://frontendatlas.com', maxUrls = 50000 } = {}) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('SITEMAP_BASE_URL must be an HTTP(S) origin.');
  }
  if (!Number.isInteger(maxUrls) || maxUrls < 1 || maxUrls > 50000) throw new Error('Invalid sitemap shard size.');
  const entries = Object.entries(routes).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) throw new Error('Refusing to generate an empty public sitemap.');
  const files = new Map();
  const shards = [];
  for (let offset = 0; offset < entries.length; offset += maxUrls) {
    const name = `sitemap-${shards.length + 1}.xml`;
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    for (const [route, entry] of entries.slice(offset, offset + maxUrls)) {
      if (!route.startsWith('/') || route.includes('?') || route.includes('#') || route.includes('//')
        || (route.length > 1 && route.endsWith('/'))) throw new Error(`Non-canonical sitemap route: ${route}`);
      lines.push('  <url>', `    <loc>${escapeXml(base.origin + route)}</loc>`);
      if (entry.lastmod) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod)
          || Number.isNaN(Date.parse(entry.lastmod))
          || new Date(entry.lastmod).toISOString().slice(0, 10) !== entry.lastmod) throw new Error(`Invalid lastmod for ${route}`);
        lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      lines.push('  </url>');
    }
    lines.push('</urlset>');
    files.set(name, `${lines.join('\n')}\n`);
    shards.push(name);
  }
  const index = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...shards.flatMap((name) => ['  <sitemap>', `    <loc>${escapeXml(`${base.origin}/${name}`)}</loc>`, '  </sitemap>']), '</sitemapindex>'].join('\n') + '\n';
  files.set('sitemap-index.xml', index);
  // Keep the public entrypoint complete when the catalog eventually needs shards.
  files.set('sitemap.xml', shards.length === 1 ? files.get(shards[0]) : index);
  return files;
}

export async function generateSitemap({ check = false, strict = strictSeoEnvironment() } = {}) {
  const report = await generateContentDates({ check, strict });
  const files = buildSitemapFiles(report.routes, { baseUrl: process.env.SITEMAP_BASE_URL || 'https://frontendatlas.com' });
  const obsolete = fs.existsSync(sitemapDir) ? fs.readdirSync(sitemapDir)
    .filter((name) => /^sitemap(?:-\d+|-index)?\.xml$/.test(name) && !files.has(name)) : [];
  if (check && obsolete.length) throw new Error(`Obsolete sitemap shards: ${obsolete.join(', ')}`);
  verifyOrWriteFiles(new Map([...files].map(([name, xml]) => [path.join(sitemapDir, name), xml])), { check });
  if (!check) for (const name of obsolete) fs.unlinkSync(path.join(sitemapDir, name));
  console.log(`[sitemap] ${check ? 'check passed' : 'generated'}: ${Object.keys(report.routes).length} URLs`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  generateSitemap({ check: process.argv.includes('--check'), strict: process.argv.includes('--strict') || strictSeoEnvironment() })
    .catch((error) => { console.error(`[sitemap] ${error.message}`); process.exitCode = 1; });
}
