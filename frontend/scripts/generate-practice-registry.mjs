#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {
  cdnIncidentsDir as INCIDENTS_DIR,
  cdnPracticeDir as OUT_DIR,
  cdnPracticeRegistryPath as OUT_PATH,
  cdnQuestionsDir as QUESTIONS_DIR,
  cdnTradeoffBattlesDir as TRADEOFF_BATTLES_DIR,
  relFromFrontend,
} from './content-paths.mjs';

const CHECK = process.argv.includes('--check');

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
  return summary.length > 220 ? `${summary.slice(0, 219).trimEnd()}…` : summary;
}

function toDateOnly(value, fallbackDate) {
  const raw = String(value || '').trim();
  if (raw) return raw.slice(0, 10);
  return fallbackDate;
}

function fallbackDate(filePath) {
  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
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

      const fileFallbackDate = fallbackDate(filePath);
      const questions = safeArray(readJson(filePath));
      questions.forEach((question) => {
        if (!question?.id || !question?.title) return;
        entries.push({
          id: String(question.id),
          family: 'question',
          title: String(question.title),
          route: `/${tech}/${kind}/${question.id}`,
          tech,
          difficulty: normalizeDifficulty(question.difficulty),
          summary: shortSummary(question.description),
          tags: safeArray(question.tags).filter((tag) => typeof tag === 'string'),
          access: normalizeAccess(question.access),
          estimatedMinutes:
            typeof question.estimatedMinutes === 'number'
              ? question.estimatedMinutes
              : QUESTION_DEFAULT_MINUTES[kind],
          updatedAt: toDateOnly(question.updatedAt || question.createdAt, fileFallbackDate),
          schemaVersion: 'question.v1',
          assetRef: `questions/${tech}/${kind}.json#${question.id}`,
        });
      });
    });
  });

  const systemDesignIndex = path.join(QUESTIONS_DIR, 'system-design', 'index.json');
  if (fs.existsSync(systemDesignIndex)) {
    const fallback = fallbackDate(systemDesignIndex);
    const items = safeArray(readJson(systemDesignIndex));
    items.forEach((item) => {
      if (!item?.id || !item?.title) return;
      entries.push({
        id: String(item.id),
        family: 'question',
        title: String(item.title),
        route: `/system-design/${item.id}`,
        tech: 'system-design',
        difficulty: normalizeDifficulty(item.difficulty, 'intermediate'),
        summary: shortSummary(item.description),
        tags: safeArray(item.tags).filter((tag) => typeof tag === 'string'),
        access: normalizeAccess(item.access),
        estimatedMinutes:
          typeof item.estimatedMinutes === 'number'
            ? item.estimatedMinutes
            : QUESTION_DEFAULT_MINUTES['system-design'],
        updatedAt: toDateOnly(item.updatedAt || item.createdAt, fallback),
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

const registry = sortEntries([
  ...buildQuestionEntries(),
  ...buildIncidentEntries(),
  ...buildTradeoffBattleEntries(),
]);

const nextText = `${JSON.stringify(registry, null, 2)}\n`;

if (CHECK) {
  const prevText = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : '';
  if (prevText !== nextText) {
    console.error('[gen:practice-registry] ERROR: practice registry is stale.');
    console.error('[gen:practice-registry] Run: node scripts/generate-practice-registry.mjs');
    console.error(`  - ${relFromFrontend(OUT_PATH)}`);
    process.exit(1);
  }
  console.log(`[gen:practice-registry] check passed: ${relFromFrontend(OUT_PATH)} (${registry.length} entries)`);
} else {
  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_PATH, nextText);
  console.log(`[gen:practice-registry] wrote ${relFromFrontend(OUT_PATH)} (${registry.length} entries)`);
}
