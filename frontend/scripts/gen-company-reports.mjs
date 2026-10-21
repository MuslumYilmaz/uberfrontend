#!/usr/bin/env node
/**
 * Generates cdn/questions/company-reports.json: for every company slug, the catalog items that carry a
 * public interview report source scoped to that company (source.company), with the report labels and
 * links. Company preview pages render it as the "public interview reports" block. Run with --check in
 * the lint chain to fail on drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
export const COMPANY_REPORTS_RELATIVE_PATH = path.join('questions', 'company-reports.json');
const TECHS = ['javascript', 'react', 'angular', 'vue', 'css', 'html'];
const KIND_ORDER = { coding: 0, 'system-design': 1, debug: 2 };
const COMPANY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function projectSource(source) {
  return {
    label: String(source.label || '').trim(),
    url: String(source.url || '').trim(),
    publisher: String(source.publisher || '').trim(),
    date: String(source.date || '').trim(),
  };
}

function sourcesByCompany(entry) {
  const buckets = new Map();
  const companies = new Set((Array.isArray(entry.companies) ? entry.companies : []).map((value) => String(value).trim().toLowerCase()));
  for (const source of Array.isArray(entry.sources) ? entry.sources : []) {
    const company = typeof source?.company === 'string' ? source.company.trim().toLowerCase() : '';
    if (!COMPANY_RE.test(company) || !companies.has(company)) continue;
    if (!/^https:\/\//i.test(String(source.url || ''))) continue;
    if (!buckets.has(company)) buckets.set(company, []);
    buckets.get(company).push(projectSource(source));
  }
  return buckets;
}

export function buildCompanyReports(cdnRoot) {
  const companies = new Map();
  const add = (slug, item) => {
    if (!companies.has(slug)) companies.set(slug, []);
    companies.get(slug).push(item);
  };
  for (const tech of TECHS) {
    for (const kind of ['coding', 'debug']) {
      const list = readJsonIfExists(path.join(cdnRoot, 'questions', tech, `${kind}.json`));
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (!entry || typeof entry.id !== 'string') continue;
        for (const [slug, sources] of sourcesByCompany(entry)) {
          add(slug, {
            id: entry.id,
            kind,
            tech,
            title: String(entry.title || entry.id),
            // The app treats a missing access field as free (registry-detail-access-policy), so the report does too.
            access: entry.access === 'premium' ? 'premium' : 'free',
            route: `/${tech}/${kind}/${entry.id}`,
            sources,
          });
        }
      }
    }
  }
  const index = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', 'index.json'));
  for (const entry of Array.isArray(index) ? index : []) {
    if (!entry || typeof entry.id !== 'string') continue;
    const meta = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', entry.id, 'meta.json'));
    if (!meta) continue;
    for (const [slug, sources] of sourcesByCompany({ ...meta, companies: meta.companies ?? entry.companies })) {
      add(slug, {
        id: entry.id,
        kind: 'system-design',
        title: String(meta.title || entry.title || entry.id),
        access: (meta.access ?? entry.access) === 'premium' ? 'premium' : 'free',
        route: `/system-design/${entry.id}`,
        sources,
      });
    }
  }
  const sorted = {};
  for (const slug of [...companies.keys()].sort()) {
    sorted[slug] = companies.get(slug).sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  }
  return { schemaVersion: 1, companies: sorted };
}

export function renderCompanyReports(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const cdnRoot = path.join(repoRoot, 'cdn');
  const outputPath = path.join(cdnRoot, COMPANY_REPORTS_RELATIVE_PATH);
  const next = renderCompanyReports(buildCompanyReports(cdnRoot));
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (check) {
    if (current !== next) {
      console.error(`[gen-company-reports] ${path.relative(repoRoot, outputPath)} is stale; run \`node scripts/gen-company-reports.mjs\`.`);
      process.exit(1);
    }
    console.log('[gen-company-reports] company-reports.json is current.');
  } else {
    fs.writeFileSync(outputPath, next);
    const total = Object.values(JSON.parse(next).companies).reduce((sum, items) => sum + items.length, 0);
    console.log(`[gen-company-reports] wrote ${path.relative(repoRoot, outputPath)} (${total} reported items).`);
  }
}
