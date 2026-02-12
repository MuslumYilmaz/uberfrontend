import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.SITEMAP_BASE_URL || 'https://frontendatlas.com').replace(/\/+$/, '');
const SRC_DIR = path.resolve('src');
const ASSETS_DIR = path.join(SRC_DIR, 'assets');
const QUESTIONS_DIR = path.join(ASSETS_DIR, 'questions');
const SYSTEM_DESIGN_INDEX = path.join(QUESTIONS_DIR, 'system-design', 'index.json');
const GUIDE_REGISTRY = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');
const OUT_PATH = path.join(SRC_DIR, 'sitemap.xml');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const MAX_URLS = 50000;

function normalizePath(p) {
  if (!p) return '/';
  const withSlash = p.startsWith('/') ? p : `/${p}`;
  const clean = withSlash.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

function toUrl(p) {
  const clean = normalizePath(p);
  return clean === '/' ? `${BASE_URL}/` : `${BASE_URL}${clean}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listTechDirs() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((name) => {
      const full = path.join(QUESTIONS_DIR, name);
      return fs.statSync(full).isDirectory() && name !== 'system-design';
    });
}

function addQuestionUrls(urls, tech, kind, list) {
  if (!Array.isArray(list)) return;
  list.forEach((q) => {
    if (!q?.id) return;
    urls.add(toUrl(`/${tech}/${kind}/${q.id}`));
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

function buildUrls() {
  const urls = new Set();

  const staticPaths = [
    '/',
    '/pricing',
    '/coding',
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
    '/legal/terms',
    '/legal/privacy',
    '/legal/refund',
    '/legal/cookies',
  ];

  staticPaths.forEach((p) => urls.add(toUrl(p)));

  listTechDirs().forEach((tech) => {
    const codingPath = path.join(QUESTIONS_DIR, tech, 'coding.json');
    const triviaPath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
    const debugPath = path.join(QUESTIONS_DIR, tech, 'debug.json');

    if (fs.existsSync(codingPath)) {
      addQuestionUrls(urls, tech, 'coding', readJson(codingPath));
    }
    if (fs.existsSync(triviaPath)) {
      addQuestionUrls(urls, tech, 'trivia', readJson(triviaPath));
    }
    if (fs.existsSync(debugPath)) {
      addQuestionUrls(urls, tech, 'debug', readJson(debugPath));
    }
  });

  if (fs.existsSync(SYSTEM_DESIGN_INDEX)) {
    const items = readJson(SYSTEM_DESIGN_INDEX);
    if (Array.isArray(items)) {
      items.forEach((q) => {
        if (!q?.id) return;
        urls.add(toUrl(`/system-design/${q.id}`));
      });
    }
  }

  if (fs.existsSync(GUIDE_REGISTRY)) {
    const registrySource = fs.readFileSync(GUIDE_REGISTRY, 'utf8');
    const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
    const system = extractGuideSlugs(registrySource, 'SYSTEM');
    const behavioral = extractGuideSlugs(registrySource, 'BEHAVIORAL');

    playbook.forEach((slug) => urls.add(toUrl(`/guides/interview-blueprint/${slug}`)));
    system.forEach((slug) => urls.add(toUrl(`/guides/system-design-blueprint/${slug}`)));
    behavioral.forEach((slug) => urls.add(toUrl(`/guides/behavioral/${slug}`)));
  }

  return Array.from(urls).sort();
}

function buildXml(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  urls.forEach((url) => {
    lines.push('  <url>');
    lines.push(`    <loc>${url}</loc>`);
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
  const files = fs.readdirSync(SRC_DIR);
  files.forEach((file) => {
    if (/^sitemap-\d+\.xml$/.test(file) || file === 'sitemap-index.xml') {
      fs.unlinkSync(path.join(SRC_DIR, file));
    }
  });
}

const urls = buildUrls();
const chunks = chunkUrls(urls, MAX_URLS);
clearOldSitemaps();

const sitemapFiles = [];
chunks.forEach((chunk, index) => {
  const fileName = `sitemap-${index + 1}.xml`;
  const outFile = path.join(SRC_DIR, fileName);
  fs.writeFileSync(outFile, buildXml(chunk), 'utf8');
  sitemapFiles.push(fileName);
});

if (chunks.length) {
  fs.writeFileSync(OUT_PATH, buildXml(chunks[0]), 'utf8');
}

fs.writeFileSync(INDEX_PATH, buildIndexXml(sitemapFiles), 'utf8');
console.log(`Sitemap generated: ${OUT_PATH} (${urls.length} URLs, ${sitemapFiles.length} files)`);
