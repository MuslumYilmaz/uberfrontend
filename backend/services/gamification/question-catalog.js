const fs = require('fs');
const path = require('path');

const TECHS = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
const KINDS = ['coding', 'trivia'];
const CATALOG_BASE_DIR = path.resolve(__dirname, '../../../cdn/questions');

let cache = null;

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function buildCatalogSignature(baseDir) {
  const parts = [];
  for (const tech of TECHS) {
    for (const kind of KINDS) {
      const filePath = path.join(baseDir, tech, `${kind}.json`);
      if (!fs.existsSync(filePath)) {
        parts.push(`${tech}:${kind}:missing`);
        continue;
      }
      const stats = fs.statSync(filePath);
      parts.push(`${tech}:${kind}:${stats.size}:${stats.mtimeMs}`);
    }
  }
  return parts.join('|');
}

function normalizeQuestion(raw, tech, kind) {
  const id = String(raw?.id || '').trim();
  if (!id) return null;
  const tags = Array.isArray(raw?.tags)
    ? raw.tags.map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const access = String(raw?.access || '').trim().toLowerCase();
  const incidentCard = kind === 'trivia' ? normalizeIncidentCard(raw?.incidentCard) : null;
  return {
    id,
    title: String(raw?.title || id),
    kind,
    tech,
    difficulty: String(raw?.difficulty || 'intermediate').toLowerCase(),
    access: access || 'free',
    route: `/${tech}/${kind}/${id}`,
    tags,
    incidentCard,
  };
}

function normalizeIncidentCard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const scenario = String(raw?.scenario || '').trim();
  if (!scenario) return null;

  const optionsRaw = Array.isArray(raw?.options) ? raw.options : [];
  const options = [];
  const seen = new Set();
  for (let i = 0; i < optionsRaw.length; i += 1) {
    const entry = optionsRaw[i];
    const id = String(entry?.id || '').trim();
    const label = String(entry?.label || '').trim();
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    options.push({ id, label });
  }

  if (options.length < 2 || options.length > 4) return null;

  const correctOptionId = String(raw?.correctOptionId || '').trim();
  if (!correctOptionId || !seen.has(correctOptionId)) return null;

  const title = String(raw?.title || '').trim() || 'Root Cause Check';
  const rereadPrompt = String(raw?.rereadPrompt || '').trim()
    || 'Not quite. Re-read the question content and try again.';

  return {
    title,
    scenario,
    options,
    correctOptionId,
    rereadPrompt,
  };
}

function loadQuestionCatalog({ force = false } = {}) {
  const signature = buildCatalogSignature(CATALOG_BASE_DIR);
  if (cache && !force && cache.signature === signature) return cache;

  const all = [];
  const byKey = new Map();
  const byTechKindKey = new Map();
  const byId = new Map();

  for (const tech of TECHS) {
    for (const kind of KINDS) {
      const filePath = path.join(CATALOG_BASE_DIR, tech, `${kind}.json`);
      if (!fs.existsSync(filePath)) continue;
      const parsed = readJsonFile(filePath);
      const rows = Array.isArray(parsed) ? parsed : [];
      for (const row of rows) {
        const normalized = normalizeQuestion(row, tech, kind);
        if (!normalized) continue;
        all.push(normalized);
        byKey.set(`${kind}:${normalized.id}`, normalized);
        byTechKindKey.set(`${kind}:${tech}:${normalized.id}`, normalized);
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
    signature,
    all,
    byKey,
    byTechKindKey,
    byId,
    freeCodingPool,
  };

  return cache;
}

function getQuestionMeta({ kind, itemId, tech }) {
  if (!itemId) return null;
  const catalog = loadQuestionCatalog();
  const safeKind = typeof kind === 'string' ? kind.trim().toLowerCase() : '';
  const safeTech = typeof tech === 'string'
    ? tech.trim().toLowerCase()
    : '';
  if (safeKind && safeTech) {
    const byKindAndTech = catalog.byTechKindKey.get(`${safeKind}:${safeTech}:${itemId}`);
    if (byKindAndTech) return byKindAndTech;
  }
  if (safeKind) {
    const byKind = catalog.byKey.get(`${safeKind}:${itemId}`);
    if (byKind) return byKind;
  }
  return catalog.byId.get(itemId) || null;
}

function getTriviaIncidentMeta({ tech, itemId }) {
  if (!itemId) return null;
  const safeTech = typeof tech === 'string' ? tech.trim().toLowerCase() : '';
  const catalog = loadQuestionCatalog();
  const question = safeTech
    ? catalog.byTechKindKey.get(`trivia:${safeTech}:${itemId}`)
    : catalog.byKey.get(`trivia:${itemId}`);
  if (!question || question.kind !== 'trivia') return null;
  if (!question.incidentCard) return null;
  return {
    questionId: question.id,
    tech: question.tech,
    title: question.title,
    incidentCard: question.incidentCard,
  };
}

module.exports = {
  loadQuestionCatalog,
  getQuestionMeta,
  getTriviaIncidentMeta,
};
