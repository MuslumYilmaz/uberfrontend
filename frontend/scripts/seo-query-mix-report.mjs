#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const FIELD_ALIASES = {
  query: ['query', 'queries', 'top queries', 'search query', 'sorgu', 'en cok yapilan sorgular'],
  clicks: ['clicks', 'click', 'tiklamalar'],
  impressions: ['impressions', 'impression', 'gosterimler'],
  ctr: ['ctr', 'to'],
  position: ['position', 'avg position', 'average position', 'pozisyon', 'ortalama pozisyon'],
};

const BUCKET_ORDER = [
  'target-interview',
  'docs-reference',
  'technical-concept',
  'company',
  'brand',
  'other',
];

function usage() {
  console.error('Usage: npm run seo:query-mix -- path/to/gsc-query-export.csv');
  console.error('Accepts CSV or TSV exports from Google Search Console. XLSX should be exported as CSV first.');
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeQuery(value) {
  return normalizeHeader(value);
}

function detectDelimiter(source) {
  const firstLine = source.split(/\r?\n/, 1)[0] || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

function parseDelimited(source, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];
    const next = source[index + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => String(value || '').trim())) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  if (row.some((value) => String(value || '').trim())) rows.push(row);
  return rows;
}

function findColumn(headers, field) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const aliases = FIELD_ALIASES[field] || [];
  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

function parseMetric(value) {
  const raw = String(value || '').trim().replace(/%$/, '').replace(/\s+/g, '');
  if (!raw) return 0;
  const normalized = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function classifyQuery(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return 'other';

  if (/\b(frontendatlas|frontend atlas|uberfrontend)\b/.test(normalized)) return 'brand';

  if (/\b(interview|interviews|prep|preparation|practice|quiz|candidate|technical round|coding round|questions?)\b/.test(normalized)) {
    return 'target-interview';
  }

  if (/\b(google|meta|facebook|amazon|microsoft|netflix|apple|uber|airbnb|stripe|linkedin|tiktok|booking)\b/.test(normalized)) {
    return 'company';
  }

  if (/\b(mdn|docs?|documentation|reference|api reference|tutorial|learn|definition|what is|how does|how do|how to|example|examples)\b/.test(normalized)) {
    return 'docs-reference';
  }

  if (/\b(javascript|js|typescript|react|angular|vue|rxjs|httpclient|unsubscribe|switchmap|mergemap|takeuntil|closure|promise|event loop|css|html|dom|http|component|hook|hooks|directive|dependency injection)\b/.test(normalized)) {
    return 'technical-concept';
  }

  return 'other';
}

function pct(clicks, impressions) {
  if (!impressions) return '0.00%';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

function formatPosition(weightedPosition, impressions) {
  if (!impressions) return '-';
  return (weightedPosition / impressions).toFixed(1);
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    usage();
    process.exit(1);
  }

  const absolutePath = path.resolve(inputPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`[seo:query-mix] file not found: ${absolutePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseDelimited(source, detectDelimiter(source));
  const headers = rows.shift() || [];
  const queryIndex = findColumn(headers, 'query');
  const clicksIndex = findColumn(headers, 'clicks');
  const impressionsIndex = findColumn(headers, 'impressions');
  const positionIndex = findColumn(headers, 'position');

  if (queryIndex < 0 || impressionsIndex < 0) {
    console.error('[seo:query-mix] expected at least query and impressions columns.');
    console.error(`[seo:query-mix] headers found: ${headers.join(' | ')}`);
    process.exit(1);
  }

  const buckets = new Map(BUCKET_ORDER.map((bucket) => [bucket, {
    queries: 0,
    clicks: 0,
    impressions: 0,
    weightedPosition: 0,
    samples: [],
  }]));

  rows.forEach((row) => {
    const query = String(row[queryIndex] || '').trim();
    if (!query) return;

    const clicks = clicksIndex >= 0 ? parseMetric(row[clicksIndex]) : 0;
    const impressions = parseMetric(row[impressionsIndex]);
    const position = positionIndex >= 0 ? parseMetric(row[positionIndex]) : 0;
    const bucketName = classifyQuery(query);
    const bucket = buckets.get(bucketName) || buckets.get('other');
    bucket.queries += 1;
    bucket.clicks += clicks;
    bucket.impressions += impressions;
    if (position > 0 && impressions > 0) bucket.weightedPosition += position * impressions;
    bucket.samples.push({ query, clicks, impressions, position });
  });

  console.log(`[seo:query-mix] source=${absolutePath}`);
  console.log('bucket\tqueries\tclicks\timpressions\tctr\tavg_position');
  BUCKET_ORDER.forEach((bucketName) => {
    const bucket = buckets.get(bucketName);
    console.log([
      bucketName,
      bucket.queries,
      bucket.clicks,
      bucket.impressions,
      pct(bucket.clicks, bucket.impressions),
      formatPosition(bucket.weightedPosition, bucket.impressions),
    ].join('\t'));
  });

  const target = buckets.get('target-interview');
  const topTarget = target.samples
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, 12);

  console.log('');
  console.log('Top target-interview queries by impressions:');
  if (!topTarget.length) {
    console.log('- none');
  } else {
    topTarget.forEach((sample) => {
      console.log(`- ${sample.query}\timpressions=${sample.impressions}\tclicks=${sample.clicks}\tposition=${sample.position || '-'}`);
    });
  }
}

main();
