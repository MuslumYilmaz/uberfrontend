'use strict';

const fs = require('fs');
const path = require('path');
const { loadQuestionCatalog } = require('./question-catalog');
const { getQuestionReadinessBucket } = require('./readiness-buckets');

const DEFAULT_COLLECTION_PATH = path.resolve(
  __dirname,
  '../../../cdn/questions/collections/frontend-essential-60.json',
);

let cache = null;

function emptyPriority() {
  return {
    byQuestionKey: new Map(),
    byBucketKey: new Map(),
  };
}

function questionKey(ref) {
  const tech = String(ref?.tech || '').trim().toLowerCase();
  const kind = String(ref?.kind || '').trim().toLowerCase();
  const id = String(ref?.id || '').trim();
  if (!tech || !kind || !id) return '';
  if (kind !== 'coding' && kind !== 'trivia') return '';
  return `${tech}:${kind}:${id}`;
}

function bucketKey({ tech, kind, bucketId }) {
  if (!tech || !kind || !bucketId) return '';
  return `${tech}:${kind}:${bucketId}`;
}

function betterQuestionMeta(current, candidate) {
  if (!current) return candidate;
  return (
    Number(candidate.importanceScore || 0) > Number(current.importanceScore || 0)
    || (
      Number(candidate.importanceScore || 0) === Number(current.importanceScore || 0)
      && Number(candidate.essentialRank || Number.MAX_SAFE_INTEGER)
        < Number(current.essentialRank || Number.MAX_SAFE_INTEGER)
    )
  )
    ? candidate
    : current;
}

function buildEssentialPriority(items, catalog = loadQuestionCatalog()) {
  const priority = emptyPriority();
  const safeItems = Array.isArray(items) ? items : [];

  for (const item of safeItems) {
    const refs = [item?.primary, ...(Array.isArray(item?.alternates) ? item.alternates : [])];
    for (const ref of refs) {
      const key = questionKey(ref);
      if (!key) continue;
      const [tech, kind, id] = key.split(':');
      const question = catalog.byTechKindKey.get(`${kind}:${tech}:${id}`);
      if (!question) continue;

      const meta = {
        importanceScore: Math.max(0, Number(item?.score || 0)),
        essentialRank: Math.max(0, Number(item?.rank || 0)),
        rationale: String(item?.rationale || '').trim(),
        section: String(item?.section || '').trim(),
        tier: String(item?.tier || '').trim(),
      };
      priority.byQuestionKey.set(key, betterQuestionMeta(priority.byQuestionKey.get(key), meta));

      const bucket = getQuestionReadinessBucket(question, tech);
      if (bucket?.countsForBreadth === false) continue;
      const bKey = bucketKey({ tech, kind, bucketId: bucket.id });
      const existing = priority.byBucketKey.get(bKey);
      const next = existing || {
        priorityScore: 0,
        source: 'essential-60',
        essentialCount: 0,
        bestRank: Number.MAX_SAFE_INTEGER,
      };
      next.priorityScore = Math.max(next.priorityScore, meta.importanceScore);
      next.essentialCount += 1;
      next.bestRank = Math.min(next.bestRank, meta.essentialRank || Number.MAX_SAFE_INTEGER);
      priority.byBucketKey.set(bKey, next);
    }
  }

  return priority;
}

function loadEssentialPriority({ collectionPath = DEFAULT_COLLECTION_PATH, force = false } = {}) {
  try {
    const stats = fs.statSync(collectionPath);
    const signature = `${collectionPath}:${stats.size}:${stats.mtimeMs}`;
    if (cache && !force && cache.signature === signature) return cache.priority;
    const parsed = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const priority = buildEssentialPriority(parsed?.items, loadQuestionCatalog());
    cache = { signature, priority };
    return priority;
  } catch {
    return emptyPriority();
  }
}

module.exports = {
  buildEssentialPriority,
  bucketKey,
  loadEssentialPriority,
  questionKey,
};
