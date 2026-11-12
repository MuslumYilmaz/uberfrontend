#!/usr/bin/env node
// Writes src/app/generated/pricing-counts.ts: the free and Premium counts per area that the pricing
// page's counted table shows, and the locked examples it names. The counts come from the practice
// registry, the same source as PREMIUM_QUESTION_ROUTES and the site's Premium total, and every
// example is checked to be a Premium item of its row, so the page cannot call a free task locked or
// count a different library than the paywall guards.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  cdnPracticeRegistryPath,
  cdnQuestionShowcaseStatsPath,
  cdnQuestionsDir,
  cdnRoot,
  frontendRoot,
  generatedAppDir,
  repoRoot,
} from './content-paths.mjs';
import { countPremiumPractices } from './gen-showcase-stats.mjs';

export const OUTPUT_PATH = path.join(generatedAppDir, 'pricing-counts.ts');
const EXAMPLES_PATH = path.join(frontendRoot, 'scripts', 'pricing-counted-examples.json');
const REHEARSALS_PATH = path.join(cdnQuestionsDir, 'rehearsals', 'rehearsals.v1.json');
const CHECK = process.argv.includes('--check');
const LOG = '[gen-pricing-counts]';

/** Areas in the order the table reads them. Every practice route must match exactly one. */
export const PRICING_AREAS = [
  { key: 'react', pattern: /^\/react\/coding\// },
  { key: 'angular', pattern: /^\/angular\/coding\// },
  { key: 'vue', pattern: /^\/vue\/coding\// },
  { key: 'javascript', pattern: /^\/javascript\/coding\// },
  { key: 'debug', pattern: /^\/[a-z]+\/debug\// },
  { key: 'htmlCss', pattern: /^\/(?:html|css)\/coding\// },
  { key: 'systemDesign', pattern: /^\/system-design\// },
  { key: 'trivia', pattern: /^\/[a-z]+\/trivia\// },
  { key: 'tradeoffBattles', pattern: /^\/tradeoffs\// },
  { key: 'incidents', pattern: /^\/incidents\// },
];

/**
 * The table rows that name locked examples, and where an example may come from: the listed areas,
 * any area for a company example (it must carry the company's tag), or a Premium rehearsal.
 */
export const EXAMPLE_ROWS = {
  react: ['react'],
  angular: ['angular'],
  vue: ['vue'],
  javascript: ['javascript'],
  debug: ['debug'],
  systemDesign: ['systemDesign'],
  tradeoffsIncidents: ['tradeoffBattles', 'incidents'],
  companyGuides: 'company',
  formats: 'rehearsal',
};

const MAX_EXAMPLES = 4;
const MAX_LABEL = 48;

export function areaForRoute(route) {
  const matches = PRICING_AREAS.filter((area) => area.pattern.test(route));
  if (matches.length !== 1) {
    throw new Error(`${LOG} ${route} matches ${matches.length} pricing areas; give it exactly one in PRICING_AREAS`);
  }
  return matches[0].key;
}

export function countPricingAreas(registry) {
  if (!Array.isArray(registry)) throw new Error(`${LOG} the practice registry must be an array`);
  const areas = Object.fromEntries(
    PRICING_AREAS.map((area) => [area.key, { total: 0, free: 0, premium: 0, premiumHard: 0 }]),
  );
  const seen = new Set();
  for (const entry of registry) {
    const route = String(entry?.route ?? '').trim();
    if (!route.startsWith('/')) throw new Error(`${LOG} a registry entry is missing a valid route`);
    // countPremiumPractices counts each route once; so do the areas, or the totals would disagree.
    if (seen.has(route)) continue;
    seen.add(route);
    const bucket = areas[areaForRoute(route)];
    bucket.total += 1;
    if (entry.access === 'premium') {
      bucket.premium += 1;
      if (entry.difficulty === 'hard') bucket.premiumHard += 1;
    } else {
      bucket.free += 1;
    }
  }
  return areas;
}

/** The month of the newest catalog change. A month, not a day, so the file changes once a month at most. */
export function latestMonth(registry) {
  let latest = '';
  for (const entry of registry) {
    const date = String(entry?.updatedAt ?? '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date > latest) latest = date;
  }
  if (!latest) throw new Error(`${LOG} no dated registry entry to stamp the counts with`);
  return latest.slice(0, 7);
}

export function resolveExampleRow(row, list, sources) {
  const rule = EXAMPLE_ROWS[row];
  if (!rule) throw new Error(`${LOG} unknown example row "${row}"`);
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_EXAMPLES) {
    throw new Error(`${LOG} row "${row}" needs 1 to ${MAX_EXAMPLES} examples in scripts/pricing-counted-examples.json`);
  }
  const used = new Set();
  return list.map((example, index) => {
    const where = `${LOG} ${row}[${index}]`;
    const label = String(example?.label ?? '').trim();
    if (!label || label.length > MAX_LABEL) throw new Error(`${where} needs a label of 1 to ${MAX_LABEL} characters`);

    let resolved;
    if (rule === 'rehearsal') {
      const id = String(example?.rehearsal ?? '').trim();
      const rehearsal = sources.rehearsalsById.get(id);
      if (!rehearsal) throw new Error(`${where}: rehearsal ${id || '(none)'} does not exist`);
      if (rehearsal.access !== 'premium') throw new Error(`${where}: rehearsal ${id} is free; pick a Premium rehearsal`);
      if (!sources.companyGuideSlugs.has(rehearsal.company)) {
        throw new Error(`${where}: rehearsal ${id} belongs to ${rehearsal.company}, which has no company guide`);
      }
      resolved = { label, route: `/companies/${rehearsal.company}/preview`, company: rehearsal.company };
      if (used.has(id)) throw new Error(`${where}: rehearsal ${id} is listed twice`);
      used.add(id);
      return resolved;
    }

    const route = String(example?.route ?? '').trim();
    const entry = sources.registryByRoute.get(route);
    if (!entry) throw new Error(`${where}: ${route || '(none)'} is not in the practice registry`);
    if (entry.access !== 'premium') throw new Error(`${where}: ${route} is free now; pick a Premium item for this row`);
    if (used.has(route)) throw new Error(`${where}: ${route} is listed twice`);
    used.add(route);

    if (rule === 'company') {
      const company = String(example?.company ?? '').trim();
      if (!company) throw new Error(`${where}: a company example needs a company`);
      if (!sources.companyGuideSlugs.has(company)) throw new Error(`${where}: ${company} has no company guide`);
      const companies = sources.companiesByRoute.get(route) ?? [];
      if (!companies.includes(company)) throw new Error(`${where}: ${route} is not tagged with ${company}`);
      return { label, route, company };
    }

    const area = areaForRoute(route);
    if (!rule.includes(area)) throw new Error(`${where}: ${route} belongs to ${area}, not ${row}`);
    return { label, route };
  });
}

export function buildPricingCounts(sources) {
  const areas = countPricingAreas(sources.registry);
  const premium = Object.values(areas).reduce((sum, area) => sum + area.premium, 0);
  const expected = countPremiumPractices(sources.registry);
  if (premium !== expected) {
    throw new Error(`${LOG} the areas hold ${premium} Premium items but the registry has ${expected}`);
  }

  const unknownRows = Object.keys(sources.config ?? {}).filter((key) => !key.startsWith('$') && !(key in EXAMPLE_ROWS));
  if (unknownRows.length) {
    throw new Error(`${LOG} unknown rows in scripts/pricing-counted-examples.json: ${unknownRows.join(', ')}`);
  }
  const examples = {};
  for (const row of Object.keys(EXAMPLE_ROWS)) {
    examples[row] = resolveExampleRow(row, sources.config?.[row], sources);
  }

  return {
    updatedMonth: latestMonth(sources.registry),
    companyGuides: sources.companyGuideSlugs.size,
    premiumRehearsals: [...sources.rehearsalsById.values()].filter((item) => item.access === 'premium').length,
    areas,
    examples,
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

/** The item an asset reference points at: `questions/react/coding.json#id` or a walkthrough's meta.json. */
async function readAssetItem(assetRef) {
  const [file, id] = String(assetRef ?? '').split('#');
  const data = await readJson(path.join(cdnRoot, file));
  if (!id) return data;
  const list = Array.isArray(data) ? data : data?.questions ?? [];
  return list.find((item) => item?.id === id) ?? null;
}

export async function loadPricingSources() {
  const [registry, config, rehearsalBank, showcaseStats] = await Promise.all([
    readJson(cdnPracticeRegistryPath),
    readJson(EXAMPLES_PATH),
    readJson(REHEARSALS_PATH),
    readJson(cdnQuestionShowcaseStatsPath),
  ]);
  const registryByRoute = new Map(registry.map((entry) => [entry.route, entry]));
  const companiesByRoute = new Map();
  for (const example of Array.isArray(config?.companyGuides) ? config.companyGuides : []) {
    const entry = registryByRoute.get(example?.route);
    if (!entry?.assetRef) continue;
    const item = await readAssetItem(entry.assetRef);
    companiesByRoute.set(entry.route, Array.isArray(item?.companies) ? item.companies.map(String) : []);
  }
  return {
    registry,
    config,
    registryByRoute,
    companiesByRoute,
    rehearsalsById: new Map((rehearsalBank?.rehearsals ?? []).map((item) => [item.id, item])),
    // The company guide pages are the companies the question banks tag (generate-prerender-routes.mjs).
    companyGuideSlugs: new Set(Object.keys(showcaseStats?.companyCounts ?? {})),
  };
}

export function renderPricingCountsModule(payload) {
  const areaKeys = PRICING_AREAS.map((area) => `'${area.key}'`).join(' | ');
  const rowKeys = Object.keys(EXAMPLE_ROWS).map((row) => `'${row}'`).join(' | ');
  return `// Auto-generated by scripts/gen-pricing-counts.mjs from cdn/practice/registry.json, the rehearsal bank and
// scripts/pricing-counted-examples.json. Do not edit by hand: run \`node scripts/gen-pricing-counts.mjs\`.
// The areas cover every practice route, so their Premium counts add up to the site's Premium total.
export type PricingCountArea = ${areaKeys};
export type PricingExampleRow = ${rowKeys};

export interface PricingAreaCount {
  readonly total: number;
  readonly free: number;
  readonly premium: number;
  readonly premiumHard: number;
}

export interface PricingCountedExample {
  readonly label: string;
  readonly route: string;
  readonly company?: string;
}

export interface PricingCounts {
  /** Month of the newest catalog change, YYYY-MM. */
  readonly updatedMonth: string;
  readonly companyGuides: number;
  readonly premiumRehearsals: number;
  readonly areas: Readonly<Record<PricingCountArea, PricingAreaCount>>;
  readonly examples: Readonly<Record<PricingExampleRow, readonly PricingCountedExample[]>>;
}

export const PRICING_COUNTS: PricingCounts = ${JSON.stringify(payload, null, 2)};
`;
}

async function main() {
  const payload = buildPricingCounts(await loadPricingSources());
  const body = renderPricingCountsModule(payload);
  let previous = null;
  try {
    previous = await fs.readFile(OUTPUT_PATH, 'utf8');
  } catch {}
  const relative = path.relative(repoRoot, OUTPUT_PATH);

  if (CHECK) {
    if (previous !== body) {
      console.error(`${LOG} ERROR: ${relative} is stale.`);
      console.error(`${LOG} Run: node scripts/gen-pricing-counts.mjs`);
      process.exit(1);
    }
    console.log(`${LOG} check passed: pricing counts are up to date.`);
    return;
  }

  if (previous !== body) {
    await fs.writeFile(OUTPUT_PATH, body, 'utf8');
    console.log(`${LOG} wrote ${relative}`);
  } else {
    console.log(`${LOG} ${relative} is current`);
  }
  const premium = Object.values(payload.areas).reduce((sum, area) => sum + area.premium, 0);
  console.log(`${LOG} premium=${premium} companyGuides=${payload.companyGuides} updatedMonth=${payload.updatedMonth}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
