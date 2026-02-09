const fs = require('fs');
const path = require('path');

const TECHS = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
const KINDS = ['coding', 'trivia'];

let cache = null;

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function normalizeQuestion(raw, tech, kind) {
  const id = String(raw?.id || '').trim();
  if (!id) return null;
  const tags = Array.isArray(raw?.tags)
    ? raw.tags.map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const access = String(raw?.access || '').trim().toLowerCase();
  return {
    id,
    title: String(raw?.title || id),
    kind,
    tech,
    difficulty: String(raw?.difficulty || 'intermediate').toLowerCase(),
    access: access || 'free',
    route: `/${tech}/${kind}/${id}`,
    tags,
  };
}

function loadQuestionCatalog({ force = false } = {}) {
  if (cache && !force) return cache;

  const all = [];
  const byKey = new Map();
  const byId = new Map();

  const baseDir = path.resolve(__dirname, '../../../cdn/questions');
  for (const tech of TECHS) {
    for (const kind of KINDS) {
      const filePath = path.join(baseDir, tech, `${kind}.json`);
      if (!fs.existsSync(filePath)) continue;
      const parsed = readJsonFile(filePath);
      const rows = Array.isArray(parsed) ? parsed : [];
      for (const row of rows) {
        const normalized = normalizeQuestion(row, tech, kind);
        if (!normalized) continue;
        all.push(normalized);
        byKey.set(`${kind}:${normalized.id}`, normalized);
        if (!byId.has(normalized.id)) byId.set(normalized.id, normalized);
      }
    }
  }

  all.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    if (a.tech !== b.tech) return a.tech.localeCompare(b.tech);
    return a.id.localeCompare(b.id);
  });

  const freeCodingPool = all.filter((question) => question.kind === 'coding' && question.access !== 'premium');

  cache = {
    all,
    byKey,
    byId,
    freeCodingPool,
  };

  return cache;
}

function getQuestionMeta({ kind, itemId }) {
  if (!itemId) return null;
  const catalog = loadQuestionCatalog();
  if (kind) {
    const byKind = catalog.byKey.get(`${kind}:${itemId}`);
    if (byKind) return byKind;
  }
  return catalog.byId.get(itemId) || null;
}

module.exports = {
  loadQuestionCatalog,
  getQuestionMeta,
};
