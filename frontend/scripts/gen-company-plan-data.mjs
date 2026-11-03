#!/usr/bin/env node
/**
 * Generates cdn/questions/company-plan-data.json, the file the company form and plan screens load on demand.
 * It joins the process table, the plan data beside it and the question catalog, so those screens never
 * import company-interview-processes.ts. Source links stay out: a plan row shows a publisher and a date.
 * Run with --check in the lint chain to fail on drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildCompanyReports } from './gen-company-reports.mjs';
import { loadTsModule } from './load-ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const sharedRoot = path.resolve(here, '..', 'src', 'app', 'shared');
export const COMPANY_PLAN_DATA_RELATIVE_PATH = path.join('questions', 'company-plan-data.json');

const TECHS = ['javascript', 'react', 'angular', 'vue', 'css', 'html'];
const FRAMEWORK_TECHS = new Set(['react', 'angular', 'vue']);
const MINUTES_BY_DIFFICULTY = { easy: 15, intermediate: 30, hard: 45 };
const MINUTES_BY_KIND = { 'system-design': 45, trivia: 10, guide: 15 };
const MAX_ROUND_SOURCES = 3;
// The largest date budget in a plan: a list has no use for more concept questions than it takes to reach it.
const LARGEST_PLAN_BUDGET = 12;
// What a round's own words say it tests, so a debugging task lands on the bug squash and a slider on the UI round.
const ROUND_FOCUS = [
  ['debug', /\bbugs?\b|debug|\bfix(?:ing|es)?\b|merge request|refactor/i],
  ['algo', /algorithm|\bDSA\b|LeetCode|data structures?|binary search|\bproblems?\b/i],
  ['css', /\bHTML\b|\bCSS\b|Tailwind|screenshot|mockup/i],
  ['ui', /\bReact\b|\bAngular\b|\bVue\b|\bUI\b|component|widget|\bbuild\b|machine coding|take-home|web practical|small app|craft|\bform\b|frontend (?:round|coding)/i],
  ['js', /JavaScript|TypeScript|polyfill|\bpromise|closure|utilit(?:y|ies)|event loop/i],
  ['concepts', /fundamentals|concepts|questions|output|quiz|hoisting/i],
];
const ALGORITHM_TAGS = new Set(['algorithms', 'data-structures', 'sorting', 'tree', 'traversal', 'bst', 'hash-map', 'counting', 'frequency']);

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** What a task practises, best fit first. Design tasks and guides go by round kind instead. */
function taskFocus(entry, kind, tech) {
  const frameworkTask = FRAMEWORK_TECHS.has(tech);
  if (kind === 'trivia') return ['concepts', 'js'];
  if (kind === 'debug' || entry.id.includes('-debug-')) return ['debug', frameworkTask ? 'ui' : 'js'];
  if (kind !== 'coding') return null;
  if (frameworkTask) return ['ui'];
  if (tech === 'html' || tech === 'css') return ['css', 'ui'];
  return (entry.tags ?? []).some((tag) => ALGORITHM_TAGS.has(tag)) ? ['algo', 'js'] : ['js', 'algo'];
}

function roundFocus(stage) {
  const text = `${stage.stage} ${stage.format}`;
  return ROUND_FOCUS.filter(([, pattern]) => pattern.test(text)).map(([focus]) => focus);
}

function catalogTask(entry, kind, tech) {
  const focus = taskFocus(entry, kind, tech);
  return {
    id: entry.id,
    title: String(entry.title || entry.id),
    route: tech ? `/${tech}/${kind}/${entry.id}` : `/system-design/${entry.id}`,
    kind,
    ...(tech ? { tech } : {}),
    access: entry.access === 'premium' ? 'premium' : 'free',
    minutes: MINUTES_BY_KIND[kind] ?? MINUTES_BY_DIFFICULTY[entry.difficulty] ?? MINUTES_BY_DIFFICULTY.intermediate,
    ...(focus ? { focus } : {}),
    companies: Array.isArray(entry.companies) ? entry.companies.map((value) => String(value).trim().toLowerCase()) : [],
    importance: Number(entry.importance) || 0,
  };
}

function readCatalog(cdnRoot) {
  const byRoute = new Map();
  for (const tech of TECHS) {
    for (const kind of ['coding', 'debug', 'trivia']) {
      const list = readJsonIfExists(path.join(cdnRoot, 'questions', tech, `${kind}.json`));
      for (const entry of Array.isArray(list) ? list : []) {
        if (entry && typeof entry.id === 'string') {
          const task = catalogTask(entry, kind, tech);
          byRoute.set(task.route, task);
        }
      }
    }
  }
  const index = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', 'index.json'));
  for (const entry of Array.isArray(index) ? index : []) {
    if (!entry || typeof entry.id !== 'string') continue;
    const meta = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', entry.id, 'meta.json')) ?? {};
    const task = catalogTask({ ...entry, ...meta, companies: meta.companies ?? entry.companies, access: meta.access ?? entry.access }, 'system-design');
    byRoute.set(task.route, task);
  }
  return byRoute;
}

function guideTask(route, label) {
  return { id: route, title: label, route, kind: 'guide', access: 'free', minutes: MINUTES_BY_KIND.guide, companies: [], importance: 0 };
}

function taskEntry({ companies, importance, ...task }, family) {
  return { ...task, ...(family ? { family } : {}) };
}

const newestFirst = (a, b) => b.date.localeCompare(a.date) || a.publisher.localeCompare(b.publisher);

/** Official pages first, then the newest accounts, so the short list shows the strongest evidence. */
function roundSources(sources) {
  const seen = new Set();
  const unique = sources.filter((source) => !seen.has(source.url) && seen.add(source.url));
  const ordered = [...unique].sort((a, b) => Number(b.kind === 'official') - Number(a.kind === 'official') || b.date.localeCompare(a.date));
  const shown = ordered.slice(0, MAX_ROUND_SOURCES).map(({ label, date }) => ({ label, date }));
  return { sources: shown, ...(unique.length > shown.length ? { moreSources: unique.length - shown.length } : {}) };
}

function buildCompany(slug, context) {
  const { processes, rounds, profiles, signatures, brands, reports, catalog, noteFor, familyMember, familyKey, tasks } = context;
  const table = processes[slug];
  const plan = rounds[slug];
  const profile = profiles[slug];
  if (!plan || !profile || !brands[slug]) throw new Error(`[gen-company-plan-data] ${slug} has no plan data, profile or brand.`);

  const framework = profile.framework;
  const expectedTech = framework === 'javascript' ? 'react' : framework;
  const fitsFramework = (task) => !task.tech || !FRAMEWORK_TECHS.has(task.tech) || task.tech === expectedTech;

  const settle = (task) => {
    const member = familyMember(task.id, framework);
    if (!member) return task;
    const counterpart = catalog.get(`/${member.tech}/${member.kind}/${member.id}`);
    if (!counterpart) throw new Error(`[gen-company-plan-data] ${member.id} is in a family but not in the catalog.`);
    return counterpart;
  };
  const publish = (task) => {
    tasks.set(task.id, taskEntry(task, familyKey(task.id)));
    return task.id;
  };

  // A source cited by both files shows the table's date: the table records the interview month when an account gives one.
  const tableDates = new Map(table.variants.flatMap((variant) => variant.stages.flatMap((stage) => stage.sources.map((source) => [source.url, source.date]))));
  const allCited = new Set(tableDates.keys());

  // Reported tasks merge by the task they land on, so a widget tagged in three frameworks is one row.
  const reported = new Map();
  for (const row of reports[slug] ?? []) {
    const task = catalog.get(row.route);
    if (!task) throw new Error(`[gen-company-plan-data] ${slug} reports ${row.route}, which is not in the catalog.`);
    const settled = settle(task);
    if (!fitsFramework(settled)) throw new Error(`[gen-company-plan-data] ${slug} reports ${settled.id} outside its framework (${framework}).`);
    const entry = reported.get(settled.id) ?? { task: settled, ids: [], sources: [] };
    entry.ids.push(row.id);
    entry.sources.push(...row.sources.map((source) => ({ url: source.url, publisher: source.publisher, date: tableDates.get(source.url) ?? source.date, posting: /\bposting\b/i.test(source.label) })));
    reported.set(settled.id, entry);
  }

  const byImportance = (a, b) => b.importance - a.importance || a.id.localeCompare(b.id);
  const taggedTasks = [...catalog.values()].filter((task) => task.companies.includes(slug)).map(settle).filter(fitsFramework).sort(byImportance);
  const tagged = taggedTasks.filter((task) => task.kind !== 'trivia');
  const taggedConcepts = taggedTasks.filter((task) => task.kind === 'trivia');

  const several = table.variants.length > 1;
  const variants = table.variants.map((variant, index) => {
    const meta = plan.variants[index];
    if (!meta || meta.title !== variant.title) throw new Error(`[gen-company-plan-data] ${slug} has no plan data for the list "${variant.title}".`);
    const cited = new Set(variant.stages.flatMap((stage) => stage.sources.map((source) => source.url)));
    const metaRound = (stage) => {
      const round = meta.rounds.find((candidate) => candidate.stage === stage.stage);
      if (!round) throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} has no plan data for the stage "${stage.stage}".`);
      return round;
    };

    const chosen = new Map();
    const add = (id, fields) => {
      const entry = chosen.get(id) ?? { id };
      if (fields.report && !entry.report) entry.report = fields.report;
      for (const round of fields.rounds ?? []) entry.rounds = [...new Set([...(entry.rounds ?? []), round])];
      chosen.set(id, entry);
    };

    const inList = [...reported.values()]
      .filter((entry) => !several || entry.sources.some((source) => cited.has(source.url)) || entry.ids.some((id) => plan.reportVariants?.[id]?.includes(meta.id)))
      .map((entry) => {
        // A source another list cites describes that list, so it cannot date a task in this one.
        const usable = entry.sources.filter((source) => cited.has(source.url) || !allCited.has(source.url));
        const [newest] = [...(usable.length ? usable : entry.sources)].sort(newestFirst);
        return { entry, newest };
      })
      .sort((a, b) => newestFirst(a.newest, b.newest) || a.entry.task.id.localeCompare(b.entry.task.id));
    for (const { entry, newest } of inList) {
      const urls = new Set(entry.sources.map((source) => source.url));
      const wanted = entry.task.kind === 'system-design' ? 'design' : 'coding';
      const bound = variant.stages
        .filter((stage) => stage.sources.some((source) => urls.has(source.url)) && metaRound(stage).kinds.includes(wanted))
        .map((stage) => metaRound(stage).id);
      add(publish(entry.task), { report: { publisher: newest.publisher, date: newest.date, ...(newest.posting ? { posting: true } : {}) }, rounds: bound });
    }

    // A linked or picked task with no report of its own is still an editor's choice for that round.
    const addLinked = (route, linked, roundId) => {
      if (!linked) throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} links ${route}, which is not in the catalog.`);
      const settled = settle(linked);
      if (!fitsFramework(settled)) throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} links ${settled.id} outside its framework (${framework}).`);
      add(publish(settled), { rounds: [roundId] });
    };
    for (const stage of variant.stages) {
      const round = metaRound(stage);
      if (stage.practice) {
        const { path: route, label } = stage.practice;
        addLinked(route, route.startsWith('/guides/') ? guideTask(route, label) : catalog.get(route), round.id);
      }
      for (const route of round.picks ?? []) addLinked(route, catalog.get(route), round.id);
    }

    // Reports from another list and unsourced tags can still fill this one, as picks without a report line.
    const elsewhere = [...reported.values()].map((entry) => entry.task).filter((task) => !chosen.has(task.id));
    for (const task of [...tagged, ...elsewhere]) {
      if (!chosen.has(task.id)) add(publish(task), {});
    }
    for (const task of taggedConcepts) {
      if (chosen.size < LARGEST_PLAN_BUDGET && !chosen.has(task.id)) add(publish(task), {});
    }

    const reportDates = [
      ...variant.stages.flatMap((stage) => stage.sources.filter((source) => source.kind === 'report').map((source) => source.date)),
      ...inList.map(({ newest }) => newest.date),
    ];

    return {
      id: meta.id,
      title: meta.title,
      ...(meta.from ? { from: meta.from } : {}),
      ...(meta.ask ? { ask: meta.ask } : {}),
      ...(meta.default ? { default: true } : {}),
      ...(meta.reported ? { reported: meta.reported } : {}),
      sourceCount: cited.size,
      ...(reportDates.length ? { newestReport: reportDates.reduce((newest, date) => (date > newest ? date : newest)) } : {}),
      rounds: variant.stages.map((stage) => {
        const round = metaRound(stage);
        const focus = roundFocus(stage);
        return {
          id: round.id,
          name: stage.stage,
          kinds: round.kinds,
          note: noteFor(round, stage.format),
          ...(focus.length ? { focus } : {}),
          ...roundSources(stage.sources),
        };
      }),
      tasks: [...chosen.values()],
    };
  });

  return {
    name: brands[slug].label,
    signature: signatures[slug],
    framework,
    ...(profile.mixed ? { mixed: true } : {}),
    ...(profile.aliases ? { aliases: profile.aliases } : {}),
    checkedAt: table.checkedAt,
    variants,
  };
}

/** `sources` carries the values of the TypeScript modules, so tests can pass small fixtures. */
export function buildCompanyPlanData(cdnRoot, sources) {
  const catalog = readCatalog(cdnRoot);
  const tasks = new Map();
  const context = { ...sources, catalog, tasks, reports: buildCompanyReports(cdnRoot).companies };
  const companies = {};
  for (const slug of Object.keys(sources.processes).sort()) companies[slug] = buildCompany(slug, context);

  const publishGeneral = (id) => {
    const task = [...catalog.values()].find((candidate) => candidate.id === id && candidate.kind === 'coding');
    if (!task) throw new Error(`[gen-company-plan-data] the general task ${id} is not in the catalog.`);
    tasks.set(id, taskEntry(task, sources.familyKey(id)));
    return id;
  };
  const guides = {};
  for (const [kind, guide] of Object.entries(sources.guides)) {
    tasks.set(guide.path, taskEntry(guideTask(guide.path, guide.label)));
    guides[kind] = guide.path;
  }
  const premium = [...catalog.values()].filter((task) => task.access === 'premium');
  const general = {
    starters: sources.starters.map(publishGeneral),
    formatPractice: Object.fromEntries(Object.entries(sources.formatPractice).map(([framework, ids]) => [framework, ids.map(publishGeneral)])),
    guides,
    // What the summary says Premium opens. Counted here, so the copy cannot drift from the catalog.
    premiumCounts: {
      ...Object.fromEntries(Object.keys(sources.formatPractice).map((framework) => [framework, premium.filter((task) => task.kind === 'coding' && task.tech === framework).length])),
      systemDesign: premium.filter((task) => task.kind === 'system-design').length,
    },
  };

  const sortedTasks = {};
  for (const id of [...tasks.keys()].sort()) sortedTasks[id] = tasks.get(id);
  return { schemaVersion: 1, general, tasks: sortedTasks, companies };
}

export function renderCompanyPlanData(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function loadCompanyPlanSources() {
  const cache = new Map();
  const load = (relative) => loadTsModule(path.join(sharedRoot, relative), cache);
  const profiles = load('company-previews/company-plan-profiles.ts');
  const rounds = load('company-previews/company-plan-rounds.ts');
  return {
    processes: load('company-previews/company-interview-processes.ts').COMPANY_INTERVIEW_PROCESSES,
    brands: load('company-branding.ts').COMPANY_BRANDS,
    rounds: rounds.COMPANY_PLAN_ROUNDS,
    noteFor: rounds.companyPlanRoundNote,
    profiles: profiles.COMPANY_PLAN_PROFILES,
    signatures: load('company-previews/company-signatures.ts').COMPANY_SIGNATURES,
    familyMember: profiles.companyPlanFamilyMember,
    familyKey: profiles.companyPlanFamilyKey,
    starters: profiles.COMPANY_PLAN_STARTERS,
    formatPractice: profiles.COMPANY_PLAN_FORMAT_PRACTICE,
    guides: profiles.COMPANY_PLAN_GUIDES,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const cdnRoot = path.join(repoRoot, 'cdn');
  const outputPath = path.join(cdnRoot, COMPANY_PLAN_DATA_RELATIVE_PATH);
  const next = renderCompanyPlanData(buildCompanyPlanData(cdnRoot, loadCompanyPlanSources()));
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (check) {
    if (current !== next) {
      console.error(`[gen-company-plan-data] ${path.relative(repoRoot, outputPath)} is stale; run \`node scripts/gen-company-plan-data.mjs\`.`);
      process.exit(1);
    }
    console.log('[gen-company-plan-data] company-plan-data.json is current.');
  } else {
    fs.writeFileSync(outputPath, next);
    const { companies, tasks } = JSON.parse(next);
    console.log(`[gen-company-plan-data] wrote ${path.relative(repoRoot, outputPath)} (${Object.keys(companies).length} companies, ${Object.keys(tasks).length} tasks, ${Buffer.byteLength(next)} bytes).`);
  }
}
