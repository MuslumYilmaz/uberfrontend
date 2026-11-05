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
    ...(entry.pressureModeAsset ? { pressure: true } : {}),
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
      if (fields.lead) entry.lead = true;
      if (fields.prompt) entry.prompt = true;
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
      const citing = variant.stages.filter((stage) => stage.sources.some((source) => urls.has(source.url)));
      const bound = citing.filter((stage) => metaRound(stage).kinds.includes(wanted)).map((stage) => metaRound(stage).id);
      // A list with no round of the task's kind keeps the task on the round whose account mentioned it, so a design
      // walkthrough from a coding-round account is not filed under the first coding round.
      const kindless = !variant.stages.some((stage) => metaRound(stage).kinds.includes(wanted));
      const cited = kindless ? citing.map((stage) => metaRound(stage).id) : [];
      // Rounds the editor names win, as when one account is cited on several stages; otherwise the citing stages
      // bind the task, and a report the table does not cite leaves it unbound. A named round that cites none of the
      // task's reports is the editor's call, but the gate promises "each linked on the round it describes", so it is
      // flagged for the table to catch up.
      const named = (plan.reportRounds?.[entry.task.id] ?? []).filter((id) => variant.stages.some((stage) => metaRound(stage).id === id));
      for (const id of named) {
        const stage = variant.stages.find((candidate) => metaRound(candidate).id === id);
        if (!stage.sources.some((source) => urls.has(source.url))) {
          console.warn(`[gen-company-plan-data] ${slug}/${meta.id}: reportRounds puts ${entry.task.id} on ${id}, but that stage cites none of its reports.`);
        }
      }
      add(publish(entry.task), { report: { publisher: newest.publisher, date: newest.date, ...(newest.posting ? { posting: true } : {}) }, rounds: named.length ? named : bound.length ? bound : cited });
    }

    // A linked or picked task with no report of its own is still an editor's choice for that round.
    const addLinked = (route, linked, roundId, lead = false) => {
      if (!linked) throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} links ${route}, which is not in the catalog.`);
      const settled = settle(linked);
      if (!fitsFramework(settled)) throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} links ${settled.id} outside its framework (${framework}).`);
      add(publish(settled), { rounds: [roundId], ...(lead ? { lead: true } : {}) });
      return settled.id;
    };
    // The practice link on a stage is the editor's lead for that round: the plan opens the round on it, as the guide
    // does. The row carries the flag, and the lead rows also come first in the list.
    const leads = new Set();
    for (const stage of variant.stages) {
      const round = metaRound(stage);
      if (stage.practice) {
        const { path: route, label } = stage.practice;
        leads.add(addLinked(route, route.startsWith('/guides/') ? guideTask(route, label) : catalog.get(route), round.id, true));
      }
      for (const route of round.picks ?? []) addLinked(route, catalog.get(route), round.id);
    }

    // The practice links on the guide's prompts join the plan too, under the round the prompt's report describes, or
    // the first round of the task's kind. A task already tied to a round keeps it; a report another list cites stays
    // out of this one; a guide or an unknown page is skipped.
    for (const prompt of context.prompts?.[slug] ?? []) {
      const linked = catalog.get(prompt.path);
      if (!linked) continue;
      const settled = settle(linked);
      if (!fitsFramework(settled)) continue;
      // A task already tied to a round keeps it and is marked as the guide's own prompt, so it leads that round.
      if (chosen.get(settled.id)?.rounds?.length) {
        add(settled.id, { prompt: true });
        continue;
      }
      const wanted = settled.kind === 'system-design' ? 'design' : 'coding';
      const citesReport = (stage) => Boolean(prompt.reportUrl) && stage.sources.some((source) => source.url === prompt.reportUrl);
      const citing = variant.stages.filter((stage) => citesReport(stage) && metaRound(stage).kinds.includes(wanted));
      const elsewhere = !citing.length && table.variants.some((other) => other !== variant && other.stages.some(citesReport));
      if (elsewhere) continue;
      const target = citing[0] ?? variant.stages.find((stage) => metaRound(stage).kinds.includes(wanted));
      if (target) add(publish(settled), { rounds: [metaRound(target).id], prompt: true });
    }

    // Unsourced tags and reports the tables do not cite can still fill this list, as picks without a report line. A
    // task whose every report is cited by another list belongs to that list and stays out of this one.
    const elsewhere = [...reported.values()]
      .filter((entry) => !chosen.has(entry.task.id) && !entry.sources.every((source) => allCited.has(source.url) && !cited.has(source.url)))
      .map((entry) => entry.task);
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
      ...(meta.unordered ? { unordered: true } : {}),
      ...(meta.students ? { students: true } : {}),
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
      tasks: [...chosen.values()].sort((a, b) => Number(leads.has(b.id)) - Number(leads.has(a.id))),
    };
  });

  // The company's whole evidence, counted the way the guide page counts it: every table citation and the guide's
  // own sources list, once by URL. The plan's "from N public sources" then matches the guide's numbers.
  const evidence = new Set([...allCited, ...(context.sources?.[slug] ?? [])]);
  return {
    name: brands[slug].label,
    signature: signatures[slug],
    framework,
    ...(profile.mixed ? { mixed: true } : {}),
    ...(profile.aliases ? { aliases: profile.aliases } : {}),
    checkedAt: table.checkedAt,
    sourceCount: evidence.size,
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

  // Every member of a family in the plan is published and listed by framework, so a person who chose a framework
  // over the reports' gets the same exercise in it. A member the catalog lacks is left out, and the plan keeps the row.
  const familyMembers = {};
  for (const [id, task] of [...tasks]) {
    if (!task.family || familyMembers[task.family]) continue;
    const members = {};
    for (const tech of FRAMEWORK_TECHS) {
      const member = sources.familyMember(id, tech);
      const counterpart = member && catalog.get(`/${member.tech}/${member.kind}/${member.id}`);
      if (!counterpart) continue;
      if (!tasks.has(member.id)) tasks.set(member.id, taskEntry(counterpart, task.family));
      members[tech] = member.id;
    }
    familyMembers[task.family] = members;
  }
  general.familyMembers = Object.fromEntries(Object.keys(familyMembers).sort().map((key) => [key, familyMembers[key]]));

  const sortedTasks = {};
  for (const id of [...tasks.keys()].sort()) sortedTasks[id] = tasks.get(id);
  return { schemaVersion: 1, general, tasks: sortedTasks, companies };
}

export function renderCompanyPlanData(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * The practice links on the prompts of the authored guides, by company, each with the report the prompt is modelled
 * on. Google and Netflix keep their prompts in the component folder; OpenAI's prompts carry no practice links.
 */
function loadCompanyPrompts(cache) {
  const previews = path.join(sharedRoot, 'company-previews');
  const prompts = {};
  const sources = {};
  for (const file of fs.readdirSync(previews).sort()) {
    const match = /^(.+)-preview-content\.ts$/.exec(file);
    if (!match) continue;
    const preview = Object.values(loadTsModule(path.join(previews, file), cache))
      .find((value) => value && typeof value === 'object' && Array.isArray(value.prompts?.items));
    if (!preview) continue;
    prompts[match[1]] = preview.prompts.items.map((item) => ({ path: item.resourcePath, reportUrl: item.reportedRound?.url ?? null }));
    // The guide's own sources list, so the plan counts the same evidence the guide page does.
    sources[match[1]] = (preview.sources?.items ?? []).map((item) => item.url);
  }
  const inline = path.resolve(sharedRoot, '..', 'features', 'company', 'company-preview');
  for (const [slug, name] of [['google', 'GOOGLE_PRACTICE_PROMPTS'], ['netflix', 'NETFLIX_PRACTICE_PROMPTS']]) {
    const module = loadTsModule(path.join(inline, `${slug}-preview-content.ts`), cache);
    prompts[slug] = (module[name] ?? []).map((item) => ({ path: item.resourcePath, reportUrl: null }));
  }
  return { prompts, sources };
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
    ...loadCompanyPrompts(cache),
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
