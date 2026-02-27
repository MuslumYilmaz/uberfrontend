#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.SEO_BASE_URL || 'https://frontendatlas.com').replace(/\/+$/, '');
const BASELINE_FROM = process.env.BASELINE_FROM || '2026-02-26';
const BASELINE_TO = process.env.BASELINE_TO || '2026-03-10';
const OUT_DIR = path.resolve(process.env.SEO_BASELINE_OUT_DIR || 'reports/seo-baseline');
const QUESTIONS_DIR = path.resolve('src/assets/questions');
const TECHS = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
const BASE_HOST = (() => {
  try {
    return new URL(BASE_URL).host.toLowerCase();
  } catch {
    return '';
  }
})();

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickTriviaSampleRoute(tech) {
  const filePath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
  if (!fs.existsSync(filePath)) return null;

  try {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(payload)) return null;
    const hit = payload.find((row) => typeof row?.id === 'string' && row.id.trim().length > 0);
    if (!hit) return null;
    return `/${tech}/trivia/${hit.id}`;
  } catch {
    return null;
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return normalizeWhitespace(decodeEntities(match ? match[1] : ''));
}

function extractMetaContent(html, key, attr = 'name') {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const first = new RegExp(
    `<meta[^>]*${attr}=["']${escapedKey}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i',
  );
  const second = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escapedKey}["'][^>]*>`,
    'i',
  );
  const match = html.match(first) || html.match(second);
  return normalizeWhitespace(decodeEntities(match ? match[1] : ''));
}

function extractCanonical(html) {
  const first = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  const second = html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return normalizeWhitespace(decodeEntities((first || second)?.[1] || ''));
}

function extractAnchorHrefs(html) {
  const hrefs = [];
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const value = String(match[1] || '').trim();
    if (value) hrefs.push(value);
  }
  return hrefs;
}

function normalizeInternalHref(rawHref) {
  const href = String(rawHref || '').trim();
  if (!href) return '';
  const lower = href.toLowerCase();
  if (
    lower.startsWith('#')
    || lower.startsWith('mailto:')
    || lower.startsWith('tel:')
    || lower.startsWith('javascript:')
    || lower.startsWith('data:')
  ) {
    return '';
  }

  if (href.startsWith('/')) {
    return href.split('#')[0];
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (url.host.toLowerCase() !== BASE_HOST) return '';
      return `${url.pathname || '/'}${url.search || ''}`.split('#')[0];
    } catch {
      return '';
    }
  }

  return '';
}

function extractJsonLdPayloads(html) {
  const payloads = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    const raw = String(match[1] || '').trim();
    if (!raw) continue;
    try {
      payloads.push(JSON.parse(raw));
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return payloads;
}

function collectTypes(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectTypes(item, out));
    return;
  }
  if (typeof node !== 'object') return;

  const type = node['@type'];
  if (Array.isArray(type)) {
    type.forEach((value) => {
      const normalized = normalizeWhitespace(String(value || ''));
      if (normalized) out.add(normalized);
    });
  } else if (typeof type === 'string') {
    const normalized = normalizeWhitespace(type);
    if (normalized) out.add(normalized);
  }

  Object.values(node).forEach((value) => collectTypes(value, out));
}

function formatCell(value) {
  return String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

async function fetchHtml(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const html = await res.text();
  return { status: res.status, html };
}

async function run() {
  const rows = [];

  for (const tech of TECHS) {
    const route = pickTriviaSampleRoute(tech);
    if (!route) {
      rows.push({
        tech,
        route: '',
        status: 'missing-local-sample',
        title: '',
        description: '',
        canonical: '',
        jsonLdTypes: '',
        internalLinks: 0,
      });
      continue;
    }

    const url = `${BASE_URL}${route}`;
    try {
      const { status, html } = await fetchHtml(url);
      const internalHrefs = new Set(
        extractAnchorHrefs(html)
          .map((href) => normalizeInternalHref(href))
          .filter(Boolean),
      );

      const typeSet = new Set();
      extractJsonLdPayloads(html).forEach((payload) => collectTypes(payload, typeSet));

      rows.push({
        tech,
        route,
        status,
        title: extractTitle(html),
        description: extractMetaContent(html, 'description', 'name'),
        canonical: extractCanonical(html),
        jsonLdTypes: Array.from(typeSet).sort().join(', '),
        internalLinks: internalHrefs.size,
      });
    } catch (error) {
      rows.push({
        tech,
        route,
        status: 'fetch-error',
        title: '',
        description: '',
        canonical: '',
        jsonLdTypes: '',
        internalLinks: 0,
      });
    }
  }

  const timestamp = new Date().toISOString();
  const outDate = timestamp.slice(0, 10);
  const outFile = path.join(OUT_DIR, `trivia-hub-baseline-${outDate}.md`);

  const lines = [
    '# Trivia SEO Baseline Snapshot',
    '',
    `- Base URL: ${BASE_URL}`,
    `- Baseline window: ${BASELINE_FROM} to ${BASELINE_TO}`,
    `- Generated at: ${timestamp}`,
    '',
    '| Tech | Route | HTTP | Title | Description | Canonical | JSON-LD @type values | Crawlable internal links |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((row) => [
      row.tech,
      row.route || 'n/a',
      String(row.status),
      formatCell(row.title),
      formatCell(row.description),
      formatCell(row.canonical),
      formatCell(row.jsonLdTypes),
      String(row.internalLinks),
    ].join(' | ')).map((line) => `| ${line} |`),
    '',
  ];

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

  console.table(
    rows.map((row) => ({
      tech: row.tech,
      route: row.route || 'n/a',
      http: row.status,
      title: row.title.slice(0, 72),
      canonical: row.canonical,
      jsonLdTypes: row.jsonLdTypes,
      internalLinks: row.internalLinks,
    })),
  );
  console.log(`[seo:baseline:trivia] Wrote snapshot: ${outFile}`);
  console.log(
    `[seo:baseline:trivia] Baseline window recorded: ${BASELINE_FROM} to ${BASELINE_TO}`,
  );
}

run().catch((error) => {
  console.error('[seo:baseline:trivia] Failed to generate baseline snapshot.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
