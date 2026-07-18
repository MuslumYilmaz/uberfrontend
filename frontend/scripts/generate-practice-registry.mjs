#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {
  cdnIncidentsDir as INCIDENTS_DIR,
  cdnPracticeDir as OUT_DIR,
  cdnPracticeRegistryPath as OUT_PATH,
  cdnQuestionsDir as QUESTIONS_DIR,
  cdnTradeoffBattlesDir as TRADEOFF_BATTLES_DIR,
  generatedAppDir,
  relFromFrontend,
  srcDir,
} from './content-paths.mjs';

const CHECK = process.argv.includes('--check');
const CODING_HUB_DISCOVERY_PATH = path.join(generatedAppDir, 'coding-hub-discovery.ts');
const PREMIUM_PREVIEW_CATALOG_PATH = path.join(
  srcDir,
  'app',
  'core',
  'content',
  'premium-preview-catalog.json',
);

const QUESTION_KINDS = ['coding', 'trivia', 'debug'];
const QUESTION_DEFAULT_MINUTES = {
  coding: 18,
  trivia: 7,
  debug: 12,
  'system-design': 20,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDifficulty(value, fallback = 'easy') {
  const raw = String(value || '').trim();
  if (raw === 'intermediate' || raw === 'hard') return raw;
  return fallback;
}

function normalizeAccess(value) {
  return String(value || '').trim() === 'premium' ? 'premium' : 'free';
}

function extractSummary(value) {
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim();
  }
  if (value && typeof value === 'object') {
    const summary = String(value.summary || value.text || '').replace(/\s+/g, ' ').trim();
    if (summary) return summary;
  }
  return '';
}

function shortSummary(value) {
  const summary = extractSummary(value);
  if (!summary) return '';
  if (summary.length <= 220) return summary;

  const sentences = summary.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
  let selected = '';
  for (const sentence of sentences) {
    const candidate = [selected, sentence.trim()].filter(Boolean).join(' ');
    if (candidate.length > 220) break;
    selected = candidate;
  }
  return selected || sentences[0]?.trim() || summary;
}

const premiumPreviewCatalog = readJson(PREMIUM_PREVIEW_CATALOG_PATH);

function catalogPreview(key) {
  const preview = premiumPreviewCatalog?.[key];
  return preview && typeof preview === 'object' ? preview : null;
}

function toDateOnly(value, fallbackDate) {
  const raw = String(value || '').trim();
  if (raw) return raw.slice(0, 10);
  return fallbackDate;
}

function fallbackDate(filePath) {
  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
}

function resolveRegistryDate({ updatedAt, createdAt, filePath, id, allowFallback = true }) {
  const raw = String(updatedAt || createdAt || '').trim();
  if (raw) return raw.slice(0, 10);
  if (allowFallback) return fallbackDate(filePath);
  throw new Error(
    `[gen:practice-registry] Missing updatedAt/createdAt for ${relFromFrontend(filePath)}#${id}`
  );
}

function listQuestionTechDirs() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((name) => {
      const full = path.join(QUESTIONS_DIR, name);
      return fs.statSync(full).isDirectory() && name !== 'system-design';
    });
}

function buildQuestionEntries() {
  const entries = [];

  listQuestionTechDirs().forEach((tech) => {
    QUESTION_KINDS.forEach((kind) => {
      const filePath = path.join(QUESTIONS_DIR, tech, `${kind}.json`);
      if (!fs.existsSync(filePath)) return;

      const questions = safeArray(readJson(filePath));
      questions.forEach((question) => {
        if (!question?.id || !question?.title) return;
        const premiumPreview = question.premiumPreview
          || catalogPreview(`${tech}/${kind}/${question.id}`);
        entries.push({
          id: String(question.id),
          family: 'question',
          title: String(question.title),
          route: `/${tech}/${kind}/${question.id}`,
          tech,
          difficulty: normalizeDifficulty(question.difficulty),
          summary: shortSummary(premiumPreview?.summary || question.description),
          tags: safeArray(question.tags).filter((tag) => typeof tag === 'string'),
          access: normalizeAccess(question.access),
          estimatedMinutes:
            typeof question.estimatedMinutes === 'number'
              ? question.estimatedMinutes
              : QUESTION_DEFAULT_MINUTES[kind],
          ...(question.questionFormat === 'output' ? { questionFormat: 'output' } : {}),
          updatedAt: resolveRegistryDate({
            updatedAt: question.updatedAt,
            createdAt: question.createdAt,
            filePath,
            id: question.id,
            allowFallback: false,
          }),
          schemaVersion: 'question.v1',
          assetRef: `questions/${tech}/${kind}.json#${question.id}`,
        });
      });
    });
  });

  const systemDesignIndex = path.join(QUESTIONS_DIR, 'system-design', 'index.json');
  if (fs.existsSync(systemDesignIndex)) {
    const items = safeArray(readJson(systemDesignIndex));
    items.forEach((item) => {
      if (!item?.id || !item?.title) return;
      const premiumPreview = item.premiumPreview
        || catalogPreview(`system-design/${item.id}`);
      entries.push({
        id: String(item.id),
        family: 'question',
        title: String(item.title),
        route: `/system-design/${item.id}`,
        tech: 'system-design',
        difficulty: normalizeDifficulty(item.difficulty, 'intermediate'),
        summary: shortSummary(premiumPreview?.summary || item.description),
        tags: safeArray(item.tags).filter((tag) => typeof tag === 'string'),
        access: normalizeAccess(item.access),
        estimatedMinutes:
          typeof item.estimatedMinutes === 'number'
            ? item.estimatedMinutes
            : QUESTION_DEFAULT_MINUTES['system-design'],
        updatedAt: resolveRegistryDate({
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
          filePath: systemDesignIndex,
          id: item.id,
          allowFallback: false,
        }),
        schemaVersion: 'question.v1',
        assetRef: `questions/system-design/${item.id}/meta.json`,
      });
    });
  }

  return entries;
}

function buildIncidentEntries() {
  const indexPath = path.join(INCIDENTS_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) return [];

  const fallback = fallbackDate(indexPath);
  return safeArray(readJson(indexPath))
    .filter((item) => item?.id && item?.title)
    .map((item) => ({
      id: String(item.id),
      family: 'incident',
      title: String(item.title),
      route: `/incidents/${item.id}`,
      tech: String(item.tech || 'javascript'),
      difficulty: normalizeDifficulty(item.difficulty),
      summary: shortSummary(item.summary),
      tags: safeArray(item.tags).filter((tag) => typeof tag === 'string'),
      access: normalizeAccess(item.access),
      estimatedMinutes:
        typeof item.estimatedMinutes === 'number'
          ? item.estimatedMinutes
          : 12,
      updatedAt: toDateOnly(item.updatedAt, fallback),
      schemaVersion: 'incident.v1',
      assetRef: `incidents/${item.id}/scenario.json`,
    }));
}

function buildTradeoffBattleEntries() {
  const indexPath = path.join(TRADEOFF_BATTLES_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) return [];

  const fallback = fallbackDate(indexPath);
  return safeArray(readJson(indexPath))
    .filter((item) => item?.id && item?.title)
    .map((item) => ({
      id: String(item.id),
      family: 'tradeoff-battle',
      title: String(item.title),
      route: `/tradeoffs/${item.id}`,
      tech: String(item.tech || 'javascript'),
      difficulty: normalizeDifficulty(item.difficulty),
      summary: shortSummary(item.summary),
      tags: safeArray(item.tags).filter((tag) => typeof tag === 'string'),
      access: normalizeAccess(item.access),
      estimatedMinutes:
        typeof item.estimatedMinutes === 'number'
          ? item.estimatedMinutes
          : 14,
      updatedAt: toDateOnly(item.updatedAt, fallback),
      schemaVersion: 'tradeoff-battle.v1',
      assetRef: `tradeoff-battles/${item.id}/scenario.json`,
    }));
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.family !== b.family) return a.family.localeCompare(b.family);
    if (a.tech !== b.tech) return String(a.tech).localeCompare(String(b.tech));
    return a.title.localeCompare(b.title);
  });
}

function buildCodingHubDebugDiscovery(entries) {
  return entries
    .filter((entry) =>
      entry.family === 'question'
      && entry.route.includes('/debug/')
      && entry.access !== 'premium'
      && (entry.tech === 'javascript' || entry.tech === 'angular')
    )
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      route: entry.route,
      tech: entry.tech,
      difficulty: entry.difficulty,
      summary: entry.summary,
      access: entry.access,
    }));
}

function toCodingHubDiscoveryText(entries) {
  return `// Auto-generated by scripts/generate-practice-registry.mjs. Do not edit by hand.
export type CodingHubGeneratedDiscoveryItem = {
  id: string;
  title: string;
  route: string;
  tech: 'javascript' | 'angular';
  difficulty: 'easy' | 'intermediate' | 'hard';
  summary: string;
  access: 'free';
};

export const CODING_HUB_DEBUG_DISCOVERY = ${JSON.stringify(entries, null, 2)} as const satisfies readonly CodingHubGeneratedDiscoveryItem[];
`;
}

const registry = sortEntries([
  ...buildQuestionEntries(),
  ...buildIncidentEntries(),
  ...buildTradeoffBattleEntries(),
]);

const nextText = `${JSON.stringify(registry, null, 2)}\n`;
const codingHubDebugDiscovery = buildCodingHubDebugDiscovery(registry);
const nextCodingHubDiscoveryText = toCodingHubDiscoveryText(codingHubDebugDiscovery);

if (CHECK) {
  const prevText = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : '';
  const prevCodingHubDiscoveryText = fs.existsSync(CODING_HUB_DISCOVERY_PATH)
    ? fs.readFileSync(CODING_HUB_DISCOVERY_PATH, 'utf8')
    : '';
  if (prevText !== nextText || prevCodingHubDiscoveryText !== nextCodingHubDiscoveryText) {
    console.error('[gen:practice-registry] ERROR: practice registry is stale.');
    console.error('[gen:practice-registry] Run: node scripts/generate-practice-registry.mjs');
    if (prevText !== nextText) console.error(`  - ${relFromFrontend(OUT_PATH)}`);
    if (prevCodingHubDiscoveryText !== nextCodingHubDiscoveryText) {
      console.error(`  - ${relFromFrontend(CODING_HUB_DISCOVERY_PATH)}`);
    }
    process.exit(1);
  }
  console.log(
    `[gen:practice-registry] check passed: ${relFromFrontend(OUT_PATH)} (${registry.length} entries), ${relFromFrontend(CODING_HUB_DISCOVERY_PATH)} (${codingHubDebugDiscovery.length} entries)`,
  );
} else {
  ensureDir(OUT_DIR);
  ensureDir(generatedAppDir);
  fs.writeFileSync(OUT_PATH, nextText);
  fs.writeFileSync(CODING_HUB_DISCOVERY_PATH, nextCodingHubDiscoveryText);
  console.log(
    `[gen:practice-registry] wrote ${relFromFrontend(OUT_PATH)} (${registry.length} entries), ${relFromFrontend(CODING_HUB_DISCOVERY_PATH)} (${codingHubDebugDiscovery.length} entries)`,
  );
}
