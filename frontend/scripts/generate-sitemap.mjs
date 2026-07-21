import fs from 'fs';
import path from 'path';
import {
  cdnPracticeRegistryPath as PRACTICE_REGISTRY,
  cdnQuestionTrackRegistryPath as TRACK_REGISTRY,
  cdnQuestionsDir as QUESTIONS_DIR,
  cdnSystemDesignIndexPath as SYSTEM_DESIGN_INDEX,
  guideRegistryPath as GUIDE_REGISTRY,
  masteryPathsDir as MASTERY_PATHS_DIR,
  srcDir,
  srcSitemapIndexPath as INDEX_PATH,
  srcSitemapPath as OUT_PATH,
} from './content-paths.mjs';
import { shouldIncludeRegistryDetailInSitemap } from './registry-detail-access-policy.mjs';

const BASE_URL = (process.env.SITEMAP_BASE_URL || 'https://frontendatlas.com').replace(/\/+$/, '');
const MAX_URLS = 50000;
const COMPANY_PREVIEW_LASTMOD_OVERRIDES = new Map([
  ['google', '2026-07-13'],
  ['openai', '2026-07-11'],
]);

function normalizePath(p) {
  const raw = String(p || '').trim();
  if (!raw) return '/';
  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname || '/';
    } catch {
      pathname = raw;
    }
  }
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const stripped = withSlash.split('?')[0].split('#')[0];
  const clean = stripped.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

function toUrl(p) {
  const clean = normalizePath(p);
  return clean === '/' ? `${BASE_URL}/` : `${BASE_URL}${clean}`;
}

function normalizeDateOnly(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return '';
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  return match[1];
}

function addUrl(entries, p, lastmod = '') {
  const loc = toUrl(p);
  const normalizedLastmod = normalizeDateOnly(lastmod);
  const existing = entries.get(loc);

  if (!existing) {
    entries.set(loc, { loc, lastmod: normalizedLastmod });
    return;
  }

  if (normalizedLastmod && (!existing.lastmod || normalizedLastmod > existing.lastmod)) {
    existing.lastmod = normalizedLastmod;
  }
}

function questionLastmod(q) {
  return normalizeDateOnly(q?.updatedAt) || normalizeDateOnly(q?.createdAt);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listTechDirs() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((name) => {
      const full = path.join(QUESTIONS_DIR, name);
      return fs.statSync(full).isDirectory() && name !== 'system-design' && name !== 'collections';
    });
}

function addQuestionUrls(urls, tech, kind, list) {
  if (!Array.isArray(list)) return;
  list.forEach((q) => {
    if (!q?.id) return;
    const route = `/${tech}/${kind}/${q.id}`;
    if (!shouldIncludeRegistryDetailInSitemap(route, q.access)) return;
    addUrl(urls, route, questionLastmod(q));
  });
}

function addCompanySlugs(slugs, list) {
  if (!Array.isArray(list)) return;
  list.forEach((q) => {
    const companies = Array.isArray(q?.companies)
      ? q.companies
      : Array.isArray(q?.companyTags)
        ? q.companyTags
        : [];
    companies.forEach((company) => {
      const slug = String(company || '').trim().toLowerCase();
      if (slug) slugs.add(slug);
    });
  });
}

function extractGuideSlugs(content, exportName) {
  const marker = `export const ${exportName}`;
  const start = content.indexOf(marker);
  if (start === -1) return [];
  const rest = content.slice(start);
  const end = rest.indexOf('];');
  if (end === -1) return [];
  const block = rest.slice(0, end);
  const slugs = [];
  const re = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(block))) {
    slugs.push(match[1]);
  }
  return slugs;
}

function readActiveMasterySlugs() {
  if (!fs.existsSync(MASTERY_PATHS_DIR)) return [];
  const slugs = new Set();

  fs.readdirSync(MASTERY_PATHS_DIR).forEach((fileName) => {
    if (!fileName.endsWith('.ts')) return;
    const source = fs.readFileSync(path.join(MASTERY_PATHS_DIR, fileName), 'utf8');
    const re = /frameworkSlug:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = re.exec(source))) {
      slugs.add(match[1]);
    }
  });

  return Array.from(slugs).sort((a, b) => a.localeCompare(b));
}

function readPublicTrackSlugs() {
  if (!fs.existsSync(TRACK_REGISTRY)) return [];
  const registry = readJson(TRACK_REGISTRY);
  const tracks = Array.isArray(registry?.tracks) ? registry.tracks : [];
  return tracks
    .filter((track) => track?.slug && !track?.hidden)
    .map((track) => track.slug)
    .sort((a, b) => a.localeCompare(b));
}

function buildUrls() {
  const urls = new Map();
  const companySlugs = new Set();

  const staticPaths = [
    '/',
    '/changelog',
    '/pricing',
    '/machine-coding',
    '/coding',
    '/incidents',
    '/tradeoffs',
    '/interview-questions',
    '/interview-questions/essential',
    '/javascript/interview-questions',
    '/react/interview-questions',
    '/angular/interview-questions',
    '/vue/interview-questions',
    '/html/interview-questions',
    '/css/interview-questions',
    '/html-css/interview-questions',
    '/tracks',
    '/focus-areas',
    '/companies',
    '/system-design',
    '/tools/cv',
    '/guides/framework-prep',
    '/guides/interview-blueprint',
    '/guides/system-design-blueprint',
    '/guides/behavioral',
    '/legal',
    '/legal/editorial-policy',
    '/legal/terms',
    '/legal/privacy',
    '/legal/refund',
    '/legal/cookies',
  ];

  staticPaths.forEach((p) => addUrl(urls, p));

  if (fs.existsSync(PRACTICE_REGISTRY)) {
    const items = readJson(PRACTICE_REGISTRY);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!item?.route) return;
        if (!shouldIncludeRegistryDetailInSitemap(item.route, item.access)) return;
        addUrl(urls, item.route, item.updatedAt);
      });
    }
  }

  listTechDirs().forEach((tech) => {
    const codingPath = path.join(QUESTIONS_DIR, tech, 'coding.json');
    const triviaPath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
    const debugPath = path.join(QUESTIONS_DIR, tech, 'debug.json');

    if (fs.existsSync(codingPath)) {
      const coding = readJson(codingPath);
      addQuestionUrls(urls, tech, 'coding', coding);
      addCompanySlugs(companySlugs, coding);
    }
    if (fs.existsSync(triviaPath)) {
      const trivia = readJson(triviaPath);
      addQuestionUrls(urls, tech, 'trivia', trivia);
      addCompanySlugs(companySlugs, trivia);
    }
    if (fs.existsSync(debugPath)) {
      const debug = readJson(debugPath);
      addQuestionUrls(urls, tech, 'debug', debug);
      addCompanySlugs(companySlugs, debug);
    }
  });

  if (fs.existsSync(SYSTEM_DESIGN_INDEX)) {
    const items = readJson(SYSTEM_DESIGN_INDEX);
    if (Array.isArray(items)) {
      items.forEach((q) => {
        if (!q?.id) return;
        const route = `/system-design/${q.id}`;
        if (!shouldIncludeRegistryDetailInSitemap(route, q.access)) return;
        addUrl(urls, route, questionLastmod(q));
      });
      addCompanySlugs(companySlugs, items);
    }
  }

  if (fs.existsSync(GUIDE_REGISTRY)) {
    const registrySource = fs.readFileSync(GUIDE_REGISTRY, 'utf8');
    const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
    const system = extractGuideSlugs(registrySource, 'SYSTEM');
    const behavioral = extractGuideSlugs(registrySource, 'BEHAVIORAL');
    const frameworkPrep = playbook.filter((slug) => slug.endsWith('-prep-path'));
    const interviewBlueprintOnly = playbook.filter((slug) => !slug.endsWith('-prep-path'));

    interviewBlueprintOnly.forEach((slug) => addUrl(urls, `/guides/interview-blueprint/${slug}`));
    frameworkPrep.forEach((slug) => addUrl(urls, `/guides/framework-prep/${slug}`));
    system.forEach((slug) => addUrl(urls, `/guides/system-design-blueprint/${slug}`));
    behavioral.forEach((slug) => addUrl(urls, `/guides/behavioral/${slug}`));
  }

  readActiveMasterySlugs().forEach((slug) => {
    addUrl(urls, `/guides/framework-prep/${slug}/mastery`);
  });

  readPublicTrackSlugs().forEach((slug) => {
    addUrl(urls, `/tracks/${slug}/preview`);
  });

  Array.from(companySlugs)
    .sort((a, b) => a.localeCompare(b))
    .forEach((slug) => {
      addUrl(urls, `/companies/${slug}/preview`, COMPANY_PREVIEW_LASTMOD_OVERRIDES.get(slug) || '');
    });

  return Array.from(urls.values()).sort((a, b) => a.loc.localeCompare(b.loc));
}

function buildXml(entries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  entries.forEach((entry) => {
    lines.push('  <url>');
    lines.push(`    <loc>${entry.loc}</loc>`);
    if (entry.lastmod) {
      lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    lines.push('  </url>');
  });

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

function buildIndexXml(files) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  files.forEach((file) => {
    lines.push('  <sitemap>');
    lines.push(`    <loc>${BASE_URL}/${file}</loc>`);
    lines.push('  </sitemap>');
  });

  lines.push('</sitemapindex>');
  return `${lines.join('\n')}\n`;
}

function chunkUrls(urls, size) {
  if (!urls.length) return [[]];
  const chunks = [];
  for (let i = 0; i < urls.length; i += size) {
    chunks.push(urls.slice(i, i + size));
  }
  return chunks;
}

function clearOldSitemaps() {
  const files = fs.readdirSync(srcDir);
  files.forEach((file) => {
    if (/^sitemap-\d+\.xml$/.test(file) || file === 'sitemap-index.xml') {
      fs.unlinkSync(path.join(srcDir, file));
    }
  });
}

const urls = buildUrls();
const chunks = chunkUrls(urls, MAX_URLS);
clearOldSitemaps();

const sitemapFiles = [];
chunks.forEach((chunk, index) => {
  const fileName = `sitemap-${index + 1}.xml`;
  const outFile = path.join(srcDir, fileName);
  fs.writeFileSync(outFile, buildXml(chunk), 'utf8');
  sitemapFiles.push(fileName);
});

if (chunks.length) {
  fs.writeFileSync(OUT_PATH, buildXml(chunks[0]), 'utf8');
}

fs.writeFileSync(INDEX_PATH, buildIndexXml(sitemapFiles), 'utf8');
console.log(`Sitemap generated: ${OUT_PATH} (${urls.length} URLs, ${sitemapFiles.length} files)`);
