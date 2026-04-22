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

const BASE_URL = (process.env.SITEMAP_BASE_URL || 'https://frontendatlas.com').replace(/\/+$/, '');
const MAX_URLS = 50000;

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
  const urls = new Set();
  const companySlugs = new Set();

  const staticPaths = [
    '/',
    '/changelog',
    '/pricing',
    '/coding',
    '/incidents',
    '/tradeoffs',
    '/interview-questions',
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

  staticPaths.forEach((p) => urls.add(toUrl(p)));

  if (fs.existsSync(PRACTICE_REGISTRY)) {
    const items = readJson(PRACTICE_REGISTRY);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!item?.route) return;
        urls.add(toUrl(item.route));
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
        urls.add(toUrl(`/system-design/${q.id}`));
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

    interviewBlueprintOnly.forEach((slug) => urls.add(toUrl(`/guides/interview-blueprint/${slug}`)));
    frameworkPrep.forEach((slug) => urls.add(toUrl(`/guides/framework-prep/${slug}`)));
    system.forEach((slug) => urls.add(toUrl(`/guides/system-design-blueprint/${slug}`)));
    behavioral.forEach((slug) => urls.add(toUrl(`/guides/behavioral/${slug}`)));
  }

  readActiveMasterySlugs().forEach((slug) => {
    urls.add(toUrl(`/guides/framework-prep/${slug}/mastery`));
    urls.add(toUrl(`/tracks/${slug}/mastery`));
  });

  readPublicTrackSlugs().forEach((slug) => {
    urls.add(toUrl(`/tracks/${slug}/preview`));
  });

  Array.from(companySlugs)
    .sort((a, b) => a.localeCompare(b))
    .forEach((slug) => {
      urls.add(toUrl(`/companies/${slug}/preview`));
    });

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
