import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const ASSETS_DIR = path.join(SRC_DIR, 'assets');
const QUESTIONS_DIR = path.join(ASSETS_DIR, 'questions');
const SYSTEM_DESIGN_INDEX = path.join(QUESTIONS_DIR, 'system-design', 'index.json');
const TRACK_REGISTRY = path.join(QUESTIONS_DIR, 'track-registry.json');
const GUIDE_REGISTRY = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');
const MASTERY_PATHS_DIR = path.join(SRC_DIR, 'app', 'shared', 'mastery', 'paths');
const COMPANY_INDEX_COMPONENT = path.join(
  SRC_DIR,
  'app',
  'features',
  'company',
  'company-index',
  'company-index.component.ts',
);
const OUT_PATH = path.join(SRC_DIR, 'prerender.routes.txt');

function normalizeRoute(route) {
  const raw = String(route || '').trim();
  if (!raw) return '/';
  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      path = new URL(raw).pathname || '/';
    } catch {
      path = raw;
    }
  }
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const stripped = withSlash.split('?')[0].split('#')[0];
  const clean = stripped.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

function addRoute(set, route) {
  const clean = normalizeRoute(route);
  set.add(clean);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function addQuestionUrls(set, tech, kind, list) {
  if (!Array.isArray(list)) return;
  list.forEach((q) => {
    if (!q?.id) return;
    addRoute(set, `/${tech}/${kind}/${q.id}`);
  });
}

function listTechDirs() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((name) => {
      const full = path.join(QUESTIONS_DIR, name);
      return fs.statSync(full).isDirectory() && name !== 'system-design';
    });
}

function normalizeSlug(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized;
}

function addCompanySlugs(out, list) {
  if (!Array.isArray(list)) return;
  list.forEach((item) => {
    if (!Array.isArray(item?.companies)) return;
    item.companies.forEach((company) => {
      const slug = normalizeSlug(company);
      if (slug) out.add(slug);
    });
  });
}

function readTrackPreviewSlugs() {
  if (!fs.existsSync(TRACK_REGISTRY)) return [];
  const payload = readJson(TRACK_REGISTRY);
  if (!Array.isArray(payload?.tracks)) return [];
  return payload.tracks
    .filter((track) => !track?.hidden)
    .map((track) => normalizeSlug(track?.slug))
    .filter(Boolean);
}

function readSeedCompanySlugs() {
  if (!fs.existsSync(COMPANY_INDEX_COMPONENT)) return [];
  const source = fs.readFileSync(COMPANY_INDEX_COMPONENT, 'utf8');
  const out = [];
  const re = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) {
    const slug = normalizeSlug(match[1]);
    if (slug) out.push(slug);
  }
  return out;
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
      const slug = normalizeSlug(match[1]);
      if (slug) slugs.add(slug);
    }
  });

  return Array.from(slugs).sort((a, b) => a.localeCompare(b));
}

function buildRoutes() {
  const routes = new Set();
  const companyPreviewSlugs = new Set(readSeedCompanySlugs());

  [
    '/',
    '/404',
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/dashboard',
    '/profile',
    '/onboarding/quick-start',
    '/billing/success',
    '/billing/cancel',
    '/admin/users',
    '/changelog',
    '/coding',
    '/pricing',
    '/interview-questions',
    '/guides/framework-prep',
    '/guides/interview-blueprint',
    '/guides/system-design-blueprint',
    '/guides/behavioral',
    '/guides',
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
    '/legal',
    '/legal/editorial-policy',
    '/legal/terms',
    '/legal/privacy',
    '/legal/refund',
    '/legal/cookies',
  ].forEach((route) => addRoute(routes, route));

  // Trivia detail routes
  listTechDirs().forEach((tech) => {
    const codingPath = path.join(QUESTIONS_DIR, tech, 'coding.json');
    const triviaPath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
    const debugPath = path.join(QUESTIONS_DIR, tech, 'debug.json');
    if (fs.existsSync(codingPath)) {
      const codingList = readJson(codingPath);
      addQuestionUrls(routes, tech, 'coding', codingList);
      addCompanySlugs(companyPreviewSlugs, codingList);
    }
    if (fs.existsSync(triviaPath)) {
      const list = readJson(triviaPath);
      if (Array.isArray(list)) {
        list.forEach((q) => {
          if (!q?.id) return;
          addRoute(routes, `/${tech}/trivia/${q.id}`);
        });
        addCompanySlugs(companyPreviewSlugs, list);
      }
    }
    if (fs.existsSync(debugPath)) {
      const debugList = readJson(debugPath);
      addQuestionUrls(routes, tech, 'debug', debugList);
      addCompanySlugs(companyPreviewSlugs, debugList);
    }
  });

  // System design detail routes
  if (fs.existsSync(SYSTEM_DESIGN_INDEX)) {
    const items = readJson(SYSTEM_DESIGN_INDEX);
    if (Array.isArray(items)) {
      items.forEach((q) => {
        if (!q?.id) return;
        addRoute(routes, `/system-design/${q.id}`);
      });
      addCompanySlugs(companyPreviewSlugs, items);
    }
  }

  readTrackPreviewSlugs().forEach((slug) => addRoute(routes, `/tracks/${slug}/preview`));
  Array.from(companyPreviewSlugs)
    .sort((a, b) => a.localeCompare(b))
    .forEach((slug) => addRoute(routes, `/companies/${slug}/preview`));

  // Guide detail routes
  if (fs.existsSync(GUIDE_REGISTRY)) {
    const registrySource = fs.readFileSync(GUIDE_REGISTRY, 'utf8');
    const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
    const system = extractGuideSlugs(registrySource, 'SYSTEM');
    const behavioral = extractGuideSlugs(registrySource, 'BEHAVIORAL');
    const frameworkPrep = playbook.filter((slug) => slug.endsWith('-prep-path'));
    const interviewBlueprintOnly = playbook.filter((slug) => !slug.endsWith('-prep-path'));

    interviewBlueprintOnly.forEach((slug) => addRoute(routes, `/guides/interview-blueprint/${slug}`));
    frameworkPrep.forEach((slug) => addRoute(routes, `/guides/framework-prep/${slug}`));
    system.forEach((slug) => addRoute(routes, `/guides/system-design-blueprint/${slug}`));
    behavioral.forEach((slug) => addRoute(routes, `/guides/behavioral/${slug}`));
  }

  readActiveMasterySlugs().forEach((slug) => {
    addRoute(routes, `/guides/framework-prep/${slug}/mastery`);
    addRoute(routes, `/tracks/${slug}/mastery`);
  });

  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

const routes = buildRoutes();
fs.writeFileSync(OUT_PATH, `${routes.join('\n')}\n`, 'utf8');
console.log(`Prerender routes generated: ${OUT_PATH} (${routes.length})`);
