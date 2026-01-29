import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const ASSETS_DIR = path.join(SRC_DIR, 'assets');
const QUESTIONS_DIR = path.join(ASSETS_DIR, 'questions');
const SYSTEM_DESIGN_INDEX = path.join(QUESTIONS_DIR, 'system-design', 'index.json');
const GUIDE_REGISTRY = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');
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

function buildRoutes() {
  const routes = new Set();

  [
    '/',
    '/coding',
    '/pricing',
    '/guides/interview-blueprint',
    '/guides/system-design-blueprint',
    '/guides/behavioral',
    '/system-design',
    '/legal',
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
      addQuestionUrls(routes, tech, 'coding', readJson(codingPath));
    }
    if (fs.existsSync(triviaPath)) {
      const list = readJson(triviaPath);
      if (Array.isArray(list)) {
        list.forEach((q) => {
          if (!q?.id) return;
          addRoute(routes, `/${tech}/trivia/${q.id}`);
        });
      }
    }
    if (fs.existsSync(debugPath)) {
      addQuestionUrls(routes, tech, 'debug', readJson(debugPath));
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
    }
  }

  // Guide detail routes
  if (fs.existsSync(GUIDE_REGISTRY)) {
    const registrySource = fs.readFileSync(GUIDE_REGISTRY, 'utf8');
    const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
    const system = extractGuideSlugs(registrySource, 'SYSTEM');
    const behavioral = extractGuideSlugs(registrySource, 'BEHAVIORAL');

    playbook.forEach((slug) => addRoute(routes, `/guides/interview-blueprint/${slug}`));
    system.forEach((slug) => addRoute(routes, `/guides/system-design-blueprint/${slug}`));
    behavioral.forEach((slug) => addRoute(routes, `/guides/behavioral/${slug}`));
  }

  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

const routes = buildRoutes();
fs.writeFileSync(OUT_PATH, `${routes.join('\n')}\n`, 'utf8');
console.log(`Prerender routes generated: ${OUT_PATH} (${routes.length})`);
