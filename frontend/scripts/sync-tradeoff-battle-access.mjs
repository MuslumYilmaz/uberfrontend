#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { buildTradeoffBattleAccessMap } from './tradeoff-battle-access-policy.mjs';
import { cdnTradeoffBattlesDir as ROOT, cdnTradeoffBattlesIndexPath as INDEX_PATH } from './content-paths.mjs';

const CHECK = process.argv.includes('--check');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJsonIfChanged(filePath, value) {
  const next = serializeJson(value);
  const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (prev === next) return false;
  fs.writeFileSync(filePath, next);
  return true;
}

if (!fs.existsSync(INDEX_PATH)) {
  console.error('[sync-tradeoff-battle-access] missing tradeoff-battles/index.json');
  process.exit(1);
}

const index = readJson(INDEX_PATH);
if (!Array.isArray(index)) {
  console.error('[sync-tradeoff-battle-access] tradeoff-battles/index.json must be an array');
  process.exit(1);
}

const accessMap = buildTradeoffBattleAccessMap(index);
let touchedFiles = 0;
const driftedFiles = [];

const nextIndex = index.map((item) => {
  const id = String(item?.id || '').trim();
  const access = accessMap.get(id) ?? 'premium';
  return { ...item, access };
});

const nextIndexText = serializeJson(nextIndex);
const prevIndexText = fs.existsSync(INDEX_PATH) ? fs.readFileSync(INDEX_PATH, 'utf8') : '';
if (CHECK) {
  if (prevIndexText !== nextIndexText) driftedFiles.push(INDEX_PATH);
} else if (writeJsonIfChanged(INDEX_PATH, nextIndex)) {
  touchedFiles += 1;
}

for (const item of nextIndex) {
  const id = String(item?.id || '').trim();
  if (!id) continue;
  const scenarioPath = path.join(ROOT, id, 'scenario.json');
  if (!fs.existsSync(scenarioPath)) continue;

  const scenario = readJson(scenarioPath);
  const nextScenario = {
    ...scenario,
    meta: {
      ...(scenario?.meta && typeof scenario.meta === 'object' ? scenario.meta : {}),
      access: item.access,
    },
  };

  const nextScenarioText = serializeJson(nextScenario);
  const prevScenarioText = fs.existsSync(scenarioPath) ? fs.readFileSync(scenarioPath, 'utf8') : '';
  if (CHECK) {
    if (prevScenarioText !== nextScenarioText) driftedFiles.push(scenarioPath);
  } else if (writeJsonIfChanged(scenarioPath, nextScenario)) {
    touchedFiles += 1;
  }
}

const counts = nextIndex.reduce(
  (acc, item) => {
    const difficulty = String(item?.difficulty || 'easy');
    const access = String(item?.access || 'premium');
    acc.total += 1;
    acc[`${difficulty}:${access}`] = (acc[`${difficulty}:${access}`] || 0) + 1;
    return acc;
  },
  { total: 0 },
);

console.log(
  `[sync-tradeoff-battle-access] synced ${nextIndex.length} battles across ${touchedFiles} files`,
);
console.log(
  `[sync-tradeoff-battle-access] easy free=${counts['easy:free'] || 0}, easy premium=${counts['easy:premium'] || 0}, medium free=${counts['intermediate:free'] || 0}, medium premium=${counts['intermediate:premium'] || 0}, hard premium=${counts['hard:premium'] || 0}`,
);

if (CHECK) {
  if (driftedFiles.length > 0) {
    console.error('[sync-tradeoff-battle-access] ERROR: tradeoff battle access metadata is stale.');
    console.error('[sync-tradeoff-battle-access] Run: node scripts/sync-tradeoff-battle-access.mjs');
    for (const filePath of driftedFiles) {
      console.error(`  - ${path.relative(process.cwd(), filePath)}`);
    }
    process.exit(1);
  }
  console.log('[sync-tradeoff-battle-access] check passed: tradeoff battle access is up to date.');
}
