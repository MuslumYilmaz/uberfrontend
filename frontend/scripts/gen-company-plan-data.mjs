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
// A task's minutes come from the module the task page and timed practice read, so all three say the same number.
const { practiceMinutes } = loadTsModule(path.join(sharedRoot, 'practice-minutes.ts'));
const MINUTES_BY_KIND = { 'system-design': 45, trivia: 10, guide: 15 };
// A guide page's reading time, as the page shows it. A series' index page and a company guide's section show none,
// so they keep the guide default.
const GUIDE_SERIES = { 'interview-blueprint': 'PLAYBOOK', 'system-design-blueprint': 'SYSTEM', behavioral: 'BEHAVIORAL' };
const guideRegistry = loadTsModule(path.join(sharedRoot, 'guides', 'guide.registry.ts'));
const GUIDE_MINUTES = new Map(Object.entries(GUIDE_SERIES).flatMap(([series, list]) => guideRegistry[list].map((guide) => [`/guides/${series}/${guide.slug}`, guide.minutes])));
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
  // A merge request review is read for its bugs before it is fixed, as a debugging task is.
  if (kind === 'debug' || entry.id.includes('-debug-') || entry.reviewModeAsset) return ['debug', frameworkTask ? 'ui' : 'js'];
  if (kind !== 'coding') return null;
  if (frameworkTask) return ['ui'];
  if (tech === 'html' || tech === 'css') return ['css', 'ui'];
  return (entry.tags ?? []).some((tag) => ALGORITHM_TAGS.has(tag)) ? ['algo', 'js'] : ['js', 'algo'];
}

function roundFocus(stage) {
  const text = `${stage.stage} ${stage.format}`;
  return ROUND_FOCUS.filter(([, pattern]) => pattern.test(text)).map(([focus]) => focus);
}

function catalogTask(entry, kind, tech, sessionMinutes) {
  const focus = taskFocus(entry, kind, tech);
  return {
    id: entry.id,
    title: String(entry.title || entry.id),
    route: tech ? `/${tech}/${kind}/${entry.id}` : `/system-design/${entry.id}`,
    kind,
    ...(tech ? { tech } : {}),
    access: entry.access === 'premium' ? 'premium' : 'free',
    minutes: sessionMinutes ?? MINUTES_BY_KIND[kind] ?? practiceMinutes(entry),
    ...(entry.pressureModeAsset ? { pressure: true } : {}),
    ...(focus ? { focus } : {}),
    companies: Array.isArray(entry.companies) ? entry.companies.map((value) => String(value).trim().toLowerCase()) : [],
    importance: Number(entry.importance) || 0,
  };
}

/**
 * A merge request review runs on the clocks its page shows, so the plan counts them, not the difficulty: the
 * interview, and the written review before it when the scenario gives that its own time.
 */
function reviewSessionMinutes(cdnRoot, entry) {
  if (typeof entry.reviewModeAsset !== 'string') return undefined;
  const review = readJsonIfExists(path.join(cdnRoot, entry.reviewModeAsset.replace(/^assets\//, '')));
  const minutes = Number(review?.sessionMinutes);
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error(`[gen-company-plan-data] ${entry.id}: ${entry.reviewModeAsset} gives no session length.`);
  }
  const reviewMinutes = review.reviewMinutes === undefined ? 0 : Number(review.reviewMinutes);
  if (!Number.isInteger(reviewMinutes) || reviewMinutes < 0) {
    throw new Error(`[gen-company-plan-data] ${entry.id}: ${entry.reviewModeAsset} gives no valid review length.`);
  }
  return reviewMinutes + minutes;
}

function readCatalog(cdnRoot) {
  const byRoute = new Map();
  for (const tech of TECHS) {
    for (const kind of ['coding', 'debug', 'trivia']) {
      const list = readJsonIfExists(path.join(cdnRoot, 'questions', tech, `${kind}.json`));
      for (const entry of Array.isArray(list) ? list : []) {
        if (entry && typeof entry.id === 'string') {
          const task = catalogTask(entry, kind, tech, reviewSessionMinutes(cdnRoot, entry));
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

/**
 * The timed rehearsals, by company (cdn/questions/rehearsals/rehearsals.v1.json). Each becomes one plan task on its
 * round, standing for its problems; the generator stops on a company, round or problem the plan cannot place.
 */
function readRehearsals(cdnRoot, catalog, rounds) {
  const list = readJsonIfExists(path.join(cdnRoot, 'questions', 'rehearsals', 'rehearsals.v1.json'));
  const byCompany = {};
  for (const definition of Array.isArray(list?.rehearsals) ? list.rehearsals : []) {
    const where = `[gen-company-plan-data] the rehearsal ${definition.id}`;
    const plan = rounds[definition.company];
    if (!plan) throw new Error(`${where} names ${definition.company}, which has no company plan.`);
    if (!plan.variants.some((variant) => variant.rounds.some((round) => round.id === definition.round))) {
      throw new Error(`${where} names the round ${definition.round}, which no ${definition.company} list has.`);
    }
    for (const item of definition.items) {
      if (!catalog.get(item.path)) throw new Error(`${where} holds ${item.path}, which is not in the catalog.`);
    }
    for (const question of definition.quiz?.questions ?? []) {
      if (!catalog.get(question.path)) throw new Error(`${where} asks about ${question.path}, which is not in the catalog.`);
    }
    (byCompany[definition.company] ??= []).push(definition);
  }
  return byCompany;
}

function rehearsalTask(definition) {
  return {
    id: `rehearsal-${definition.id}`,
    title: `Rehearse the ${definition.title}`,
    // The rehearsal starts from its first problem's page, where the page offers it.
    route: definition.items[0].path,
    kind: 'rehearsal',
    access: 'premium',
    minutes: definition.minutes,
    members: definition.items.map((item) => item.path.slice(item.path.lastIndexOf('/') + 1)),
    // The questions asked before the problems, by kind: the plan names them, and the problems stay its members.
    ...quizCounts(definition.quiz?.questions ?? []),
    detail: rehearsalDetail(definition),
  };
}

const TOPICS = { css: 'CSS', html: 'HTML', javascript: 'JavaScript', react: 'React', angular: 'Angular', vue: 'Vue' };

const listed = (words) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]);

/**
 * What the rehearsal asks, in its order, for the plan row: "2 multiple-choice CSS questions, then Valid Parentheses,
 * Merge Two Sorted Arrays and Contact Form, all open at once. On a laptop or tablet." The questions name their topics,
 * the part a candidate fears; a title's bracketed gloss is left out, so the line stays short. The rehearsal's own
 * note, such as why its clock is shorter than the round, comes before the device.
 */
function rehearsalDetail(definition) {
  const names = definition.items.map((item) => item.title.replace(/\s*\([^)]*\)\s*$/, ''));
  const problems = definition.order === 'sequential' ? names.join(', then ') : `${listed(names)}, all open at once`;
  const questions = definition.quiz?.questions ?? [];
  const topics = listed([...new Set(questions.map((question) => question.path.split('/')[1]))].map((tech) => TOPICS[tech] ?? tech));
  const kind = questions.every((question) => question.choices) ? 'multiple-choice ' : questions.some((question) => question.choices) ? '' : 'short ';
  const asked = questions.length ? `${questions.length} ${kind}${topics} ${questions.length === 1 ? 'question' : 'questions'}, then ` : '';
  return `${asked}${problems}.${definition.planNote ? ` ${definition.planNote}` : ''} On a laptop or tablet.`;
}

function quizCounts(questions) {
  const choiceQuestions = questions.filter((question) => question.choices).length;
  const shortAnswers = questions.length - choiceQuestions;
  return { ...(shortAnswers ? { shortAnswers } : {}), ...(choiceQuestions ? { choiceQuestions } : {}) };
}

/** A guide, or a section of one: a company guide's own section on a round keeps its anchor in the id and the link. */
function guideTask(route, label, fragment) {
  return {
    id: fragment ? `${route}#${fragment}` : route,
    title: label,
    route,
    ...(fragment ? { fragment } : {}),
    kind: 'guide',
    access: 'free',
    minutes: (!fragment && GUIDE_MINUTES.get(route)) || MINUTES_BY_KIND.guide,
    companies: [],
    importance: 0,
  };
}

const COMPANY_GUIDE_ROUTE = /^\/companies\/[a-z0-9-]+\/preview$/;
/**
 * The guides written into the preview template rather than the authored registry. With the authored guides they show
 * no reports card, so a plan line must name a report the guide itself shows. Keep equal to LEGACY_EDITORIAL_COMPANIES
 * in company-public-data.service.ts; the generator test checks it.
 */
export const INLINE_COMPANY_GUIDES = new Set(['google', 'netflix', 'openai']);
const isGuideRoute = (route) => route.startsWith('/guides/') || COMPANY_GUIDE_ROUTE.test(route);

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
  // A table label such as "Taro (approx.)" marks an approximate month; the plan's report line keeps the mark.
  const approxDates = new Set(table.variants.flatMap((variant) => variant.stages.flatMap((stage) => stage.sources.filter((source) => /\(approx\.\)/.test(source.label ?? '')).map((source) => source.url))));
  const allCited = new Set(tableDates.keys());
  // A catalog guide lists every reported item with its sources in a reports card; an authored or inline guide shows
  // only its table and its own sources list.
  const showsEveryReport = !context.sources?.[slug] && !context.prompts?.[slug] && !INLINE_COMPANY_GUIDES.has(slug);
  const shownOnGuide = (source) => allCited.has(source.url) || (context.sources?.[slug] ?? []).includes(source.url);

  // Reported tasks merge by the task they land on, so a widget tagged in three frameworks is one row.
  const reported = new Map();
  for (const row of reports[slug] ?? []) {
    const task = catalog.get(row.route);
    if (!task) throw new Error(`[gen-company-plan-data] ${slug} reports ${row.route}, which is not in the catalog.`);
    const settled = settle(task);
    if (!fitsFramework(settled)) throw new Error(`[gen-company-plan-data] ${slug} reports ${settled.id} outside its framework (${framework}).`);
    const entry = reported.get(settled.id) ?? { task: settled, ids: [], sources: [] };
    entry.ids.push(row.id);
    entry.sources.push(...row.sources.map((source) => ({ url: source.url, publisher: source.publisher, date: tableDates.get(source.url) ?? source.date, posting: /\bposting\b/i.test(source.label), approx: approxDates.has(source.url) })));
    reported.set(settled.id, entry);
  }

  const byImportance = (a, b) => b.importance - a.importance || a.id.localeCompare(b.id);
  const taggedTasks = [...catalog.values()].filter((task) => task.companies.includes(slug)).map(settle).filter(fitsFramework).sort(byImportance);
  const tagged = taggedTasks.filter((task) => task.kind !== 'trivia');
  const taggedConcepts = taggedTasks.filter((task) => task.kind === 'trivia');
  // The report a guide prompt names for the task it links, so the plan's line names the same account as the guide.
  const promptReports = new Map();
  for (const prompt of context.prompts?.[slug] ?? []) {
    const linked = prompt.reportUrl ? catalog.get(prompt.path) : null;
    if (linked) promptReports.set(settle(linked).id, prompt.reportUrl);
  }

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
        const pool = usable.length ? usable : entry.sources;
        // A guide without a reports card names the newest report it shows, on its table or in its sources list.
        const visible = showsEveryReport ? pool : pool.filter(shownOnGuide);
        const [newest] = [...(visible.length ? visible : pool)].sort(newestFirst);
        // The newest report orders the list; the line names the report the guide's prompt names, when it is one of them.
        const named = (visible.length ? visible : pool).find((source) => source.url === promptReports.get(entry.task.id));
        return { entry, newest, line: named ?? newest, hidden: !visible.length };
      })
      .sort((a, b) => newestFirst(a.newest, b.newest) || a.entry.task.id.localeCompare(b.entry.task.id));
    for (const { entry, newest, line, hidden } of inList) {
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
      const rounds = named.length ? named : bound.length ? bound : cited;
      // "Modelled on a report" must be followable on the guide. A guide with its own sources list has to list the
      // report, so the generator stops; a guide without one keeps the task as a pick, with no report line.
      if (hidden && context.sources?.[slug]) {
        throw new Error(`[gen-company-plan-data] ${slug}/${meta.id}: ${entry.task.id} is modelled on ${newest.url}, which neither the ${slug} guide's sources nor its process table list.`);
      }
      if (hidden) add(publish(entry.task), { rounds });
      else add(publish(entry.task), { report: { publisher: line.publisher, date: line.date, ...(line.posting ? { posting: true } : {}), ...(line.approx ? { approx: true } : {}) }, rounds });
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
        const { path: route, label, fragment } = stage.practice;
        if (COMPANY_GUIDE_ROUTE.test(route) && (route !== `/companies/${slug}/preview` || !fragment)) {
          throw new Error(`[gen-company-plan-data] ${slug}/${meta.id} links ${route}: a company guide link must be a section of ${slug}'s own guide.`);
        }
        leads.add(addLinked(route, isGuideRoute(route) ? guideTask(route, label, fragment) : catalog.get(route), round.id, true));
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
    // A timed rehearsal of one of this list's rounds joins it on that round, after the count above: it stands for
    // problems the list may hold as well, so it adds a row rather than taking a concept question's place. The engine
    // opens the round with it.
    for (const definition of context.rehearsals?.[slug] ?? []) {
      if (!meta.rounds.some((round) => round.id === definition.round)) continue;
      const task = rehearsalTask(definition);
      tasks.set(task.id, taskEntry(task));
      add(task.id, { rounds: [definition.round] });
    }

    const reportDates = [
      ...variant.stages.flatMap((stage) => stage.sources.filter((source) => source.kind === 'report').map((source) => source.date)),
      ...inList.filter(({ hidden }) => !hidden).map(({ newest }) => newest.date),
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
    // The guide's practice prompts; the plan tells a phone reader which answer guides Premium opens there.
    promptCount: (context.prompts?.[slug] ?? []).length,
    variants,
  };
}

/** `sources` carries the values of the TypeScript modules, so tests can pass small fixtures. */
export function buildCompanyPlanData(cdnRoot, sources) {
  const catalog = readCatalog(cdnRoot);
  const tasks = new Map();
  const rehearsals = readRehearsals(cdnRoot, catalog, sources.rounds);
  const context = { ...sources, catalog, tasks, rehearsals, reports: buildCompanyReports(cdnRoot).companies };
  const companies = {};
  for (const slug of Object.keys(sources.processes).sort()) companies[slug] = buildCompany(slug, context);

  const publishGeneral = (id) => {
    const task = [...catalog.values()].find((candidate) => candidate.id === id && candidate.kind === 'coding');
    if (!task) throw new Error(`[gen-company-plan-data] the general task ${id} is not in the catalog.`);
    tasks.set(id, taskEntry(task, sources.familyKey(id)));
    return id;
  };
  const publishDesign = (id) => {
    const task = [...catalog.values()].find((candidate) => candidate.id === id && candidate.kind === 'system-design');
    if (!task) throw new Error(`[gen-company-plan-data] the design practice case ${id} is not in the catalog.`);
    tasks.set(id, taskEntry(task));
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
    ...(sources.designPractice?.length ? { designPractice: sources.designPractice.map(publishDesign) } : {}),
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
  // Netflix keeps its sources list beside its prompts; the guide counts it with the table, so the plan does too.
  const netflix = loadTsModule(path.join(inline, 'netflix-preview-content.ts'), cache);
  sources.netflix = (netflix.NETFLIX_SOURCES ?? []).map((item) => item.url);
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
    designPractice: profiles.COMPANY_PLAN_DESIGN_PRACTICE,
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
