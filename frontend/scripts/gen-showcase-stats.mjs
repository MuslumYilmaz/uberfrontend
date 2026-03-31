#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import {
  cdnIncidentsDir as INCIDENT_ASSETS_DIR,
  cdnQuestionsDir as QUESTION_ASSETS_DIR,
  cdnQuestionShowcaseStatsPath,
  cdnTradeoffBattlesDir as TRADEOFF_BATTLES_ASSETS_DIR,
  frontendRoot as projectRoot,
  repoRoot,
} from './content-paths.mjs';

const FRAMEWORK_FAMILIES_PATH = path.join(
  projectRoot,
  'src',
  'app',
  'shared',
  'framework-families.ts',
);
const OUTPUT_PATHS = [cdnQuestionShowcaseStatsPath];
const CHECK = process.argv.includes('--check');

const TECHS = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
const KINDS = ['coding', 'trivia'];

function toNonEmptyString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildFrameworkFamilyByIdMap(source) {
  const byId = new Map();
  const familyRegex = /{\s*key:\s*'([^']+)'\s*,[\s\S]*?members:\s*\[([\s\S]*?)\]\s*}/g;

  let familyMatch = familyRegex.exec(source);
  while (familyMatch) {
    const familyKey = familyMatch[1];
    const memberBody = familyMatch[2];
    const idRegex = /id:\s*'([^']+)'/g;

    let idMatch = idRegex.exec(memberBody);
    while (idMatch) {
      byId.set(idMatch[1], familyKey);
      idMatch = idRegex.exec(memberBody);
    }

    familyMatch = familyRegex.exec(source);
  }

  return byId;
}

function canonicalCompanyQuestionKey(question, kind, frameworkFamilyById) {
  const id = toNonEmptyString(question?.id);
  const slug = toNonEmptyString(question?.slug);
  const title = toNonEmptyString(question?.title);
  const familyKey = id ? frameworkFamilyById.get(id) : null;
  const base = familyKey || id || slug || title || 'unknown';
  return `${kind}:${base}`;
}

function collectCompanyCounts(lists, frameworkFamilyById) {
  const buckets = new Map();

  const getBucket = (slug) => {
    if (!buckets.has(slug)) {
      buckets.set(slug, {
        coding: new Set(),
        trivia: new Set(),
        system: new Set(),
      });
    }
    return buckets.get(slug);
  };

  const add = (kind, question) => {
    const companies = Array.isArray(question?.companies) ? question.companies : [];
    if (!companies.length) return;

    const qKey = canonicalCompanyQuestionKey(question, kind, frameworkFamilyById);
    for (const rawCompany of companies) {
      const slug = toNonEmptyString(rawCompany)?.toLowerCase();
      if (!slug) continue;
      getBucket(slug)[kind].add(qKey);
    }
  };

  for (const q of lists.coding) add('coding', q);
  for (const q of lists.trivia) add('trivia', q);
  for (const q of lists.system) add('system', q);

  const out = {};
  for (const slug of [...buckets.keys()].sort()) {
    const bucket = buckets.get(slug);
    const coding = bucket.coding.size;
    const trivia = bucket.trivia.size;
    const system = bucket.system.size;
    out[slug] = {
      all: coding + trivia + system,
      coding,
      trivia,
      system,
    };
  }

  return out;
}

function computeTotalQuestions(lists) {
  const ids = new Set();
  const add = (kind, question) => {
    const key = toNonEmptyString(question?.id) || toNonEmptyString(question?.slug) || toNonEmptyString(question?.title);
    if (!key) return;
    ids.add(`${kind}:${key}`);
  };

  for (const q of lists.coding) add('coding', q);
  for (const q of lists.trivia) add('trivia', q);
  for (const q of lists.system) add('system', q);
  for (const q of lists.incident ?? []) add('incident', q);
  for (const q of lists.tradeoffBattle ?? []) add('tradeoff-battle', q);
  return ids.size;
}

async function main() {
  const allLists = {
    coding: [],
    trivia: [],
    system: [],
    incident: [],
    tradeoffBattle: [],
  };

  for (const tech of TECHS) {
    for (const kind of KINDS) {
      const filePath = path.join(QUESTION_ASSETS_DIR, tech, `${kind}.json`);
      const list = await readJsonArray(filePath);
      allLists[kind].push(...list);
    }
  }

  const systemList = await readJsonArray(
    path.join(QUESTION_ASSETS_DIR, 'system-design', 'index.json'),
  );
  allLists.system.push(...systemList);
  const incidentList = await readJsonArray(path.join(INCIDENT_ASSETS_DIR, 'index.json'));
  allLists.incident.push(...incidentList);
  const tradeoffBattleList = await readJsonArray(path.join(TRADEOFF_BATTLES_ASSETS_DIR, 'index.json'));
  allLists.tradeoffBattle.push(...tradeoffBattleList);

  const frameworkFamiliesSource = await fs.readFile(FRAMEWORK_FAMILIES_PATH, 'utf8');
  const frameworkFamilyById = buildFrameworkFamilyByIdMap(frameworkFamiliesSource);

  const payload = {
    totalQuestions: computeTotalQuestions(allLists),
    companyCounts: collectCompanyCounts(allLists, frameworkFamilyById),
  };

  const serializedPayload = `${JSON.stringify(payload, null, 2)}\n`;
  const driftedOutputs = [];
  for (const outputPath of OUTPUT_PATHS) {
    if (CHECK) {
      let prev = '';
      try {
        prev = await fs.readFile(outputPath, 'utf8');
      } catch {}
      if (prev !== serializedPayload) driftedOutputs.push(outputPath);
      continue;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, serializedPayload, 'utf8');
    console.log(`[gen-showcase-stats] wrote ${path.relative(repoRoot, outputPath)}`);
  }

  if (CHECK) {
    if (driftedOutputs.length > 0) {
      console.error('[gen-showcase-stats] ERROR: showcase stats are stale.');
      console.error('[gen-showcase-stats] Run: node scripts/gen-showcase-stats.mjs');
      for (const outputPath of driftedOutputs) {
        console.error(`  - ${path.relative(repoRoot, outputPath)}`);
      }
      process.exit(1);
    }
    console.log('[gen-showcase-stats] check passed: showcase stats are up to date.');
  }

  console.log(
    `[gen-showcase-stats] totalQuestions=${payload.totalQuestions} companies=${Object.keys(payload.companyCounts).length}`,
  );
}

main().catch((err) => {
  console.error('[gen-showcase-stats] fatal:', err);
  process.exit(1);
});
