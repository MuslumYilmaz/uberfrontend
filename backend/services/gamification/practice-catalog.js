const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.resolve(__dirname, '../../../cdn/practice/registry.json');

let cache = null;

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function buildRegistrySignature(filePath) {
  if (!fs.existsSync(filePath)) return 'missing';
  const stats = fs.statSync(filePath);
  return `${stats.size}:${stats.mtimeMs}`;
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = String(raw.id || '').trim();
  const title = String(raw.title || '').trim();
  const family = String(raw.family || '').trim();
  if (!id || !title || !family) return null;

  return {
    id,
    title,
    family,
    route: String(raw.route || '').trim(),
    tech: String(raw.tech || '').trim().toLowerCase() || 'javascript',
    difficulty: String(raw.difficulty || 'intermediate').trim().toLowerCase(),
    access: String(raw.access || 'free').trim().toLowerCase() || 'free',
  };
}

function loadPracticeCatalog({ force = false } = {}) {
  const signature = buildRegistrySignature(REGISTRY_PATH);
  if (cache && !force && cache.signature === signature) return cache;

  if (signature === 'missing') {
    cache = {
      signature,
      all: [],
      byFamily: new Map(),
    };
    return cache;
  }

  const parsed = readJsonFile(REGISTRY_PATH);
  const rows = Array.isArray(parsed) ? parsed : [];
  const all = rows
    .map((row) => normalizeEntry(row))
    .filter(Boolean);

  const byFamily = new Map();
  for (const entry of all) {
    if (!byFamily.has(entry.family)) byFamily.set(entry.family, []);
    byFamily.get(entry.family).push(entry);
  }

  cache = {
    signature,
    all,
    byFamily,
  };

  return cache;
}

module.exports = {
  loadPracticeCatalog,
};
