import type { CompanyPlanWhen } from '../../../core/models/company-plan.model';
import type { CompanyPlanFramework } from '../../../shared/company-previews/company-plan-profiles';
import type { CompanyPlanLevel, CompanyPlanRoundKind } from '../../../shared/company-previews/company-plan-rounds';

export type { CompanyPlanWhen };

/**
 * Builds a company plan from cdn/questions/company-plan-data.json and the answers on the form. The same input
 * always gives the same plan, and nothing here knows about screens, accounts or the current time.
 */

export type CompanyPlanDataTask = {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  /** A section of the page at `route`: a company guide's own section on a round, such as its behavioural round. */
  readonly fragment?: string;
  readonly kind: 'coding' | 'debug' | 'trivia' | 'system-design' | 'guide' | 'rehearsal';
  readonly tech?: string;
  readonly access: 'free' | 'premium';
  readonly minutes: number;
  /** A timed rehearsal's problems, by task id: the rehearsal stands for them, so the plan never lists them beside it. */
  readonly members?: readonly string[];
  /** How many questions a timed rehearsal asks before its problems: for one-line answers, and with set options. */
  readonly shortAnswers?: number;
  readonly choiceQuestions?: number;
  /** The page can run it as an interview: the requirements change while the person codes. */
  readonly pressure?: true;
  readonly family?: string;
  /** What it practises, best fit first. */
  readonly focus?: readonly string[];
};

export type CompanyPlanReportLine = {
  readonly publisher: string;
  readonly date: string;
  /** The source is a job posting rather than a candidate's account. */
  readonly posting?: boolean;
  /** The process table gives the month as approximate, so the plan says so too. */
  readonly approx?: boolean;
};

export type CompanyPlanDataRow = {
  readonly id: string;
  readonly report?: CompanyPlanReportLine;
  readonly rounds?: readonly string[];
  /** The practice link the guide shows on the round's row: the plan opens the round on it, as the guide does. */
  readonly lead?: true;
  /** The guide's own prompt links to this task, so it comes before the other reported tasks of its round. */
  readonly prompt?: true;
};

export type CompanyPlanDataRound = {
  readonly id: string;
  readonly name: string;
  readonly kinds: readonly CompanyPlanRoundKind[];
  readonly note: string;
  /** What the round's own words say it tests. */
  readonly focus?: readonly string[];
  readonly sources: readonly { readonly label: string; readonly date: string }[];
  readonly moreSources?: number;
};

export type CompanyPlanDataList = {
  readonly id: string;
  readonly title: string;
  readonly from?: string;
  readonly ask?: string;
  readonly default?: boolean;
  readonly reported?: { readonly levels: readonly CompanyPlanLevel[]; readonly who: string };
  /** The table groups these rounds by type and gives no order. */
  readonly unordered?: true;
  /** The rounds for students, interns and new graduates. */
  readonly students?: true;
  readonly sourceCount: number;
  readonly newestReport?: string;
  readonly rounds: readonly CompanyPlanDataRound[];
  readonly tasks: readonly CompanyPlanDataRow[];
};

export type CompanyPlanDataCompany = {
  readonly name: string;
  readonly signature: string;
  readonly framework: CompanyPlanFramework;
  readonly mixed?: boolean;
  readonly aliases?: readonly string[];
  readonly checkedAt: string;
  /** Every public source behind the company: the guide's list and all the tables' citations, once by URL. */
  readonly sourceCount?: number;
  /** How many practice prompts the company's guide carries; the answer guides past the open ones are Premium. */
  readonly promptCount?: number;
  readonly variants: readonly CompanyPlanDataList[];
};

export type CompanyPlanData = {
  readonly schemaVersion: number;
  readonly general: {
    readonly starters: readonly string[];
    readonly formatPractice: Readonly<Record<CompanyPlanFramework, readonly string[]>>;
    readonly guides: { readonly people: string; readonly design: string };
    readonly premiumCounts: Readonly<Record<CompanyPlanFramework | 'systemDesign', number>>;
    /** The same exercise in each framework, by family, for a person who chose a framework over the reports'. */
    readonly familyMembers?: Readonly<Record<string, Readonly<Partial<Record<'react' | 'angular' | 'vue', string>>>>>;
    /** General design cases a senior or staff plan adds to the design round the person faces next, in this order. */
    readonly designPractice?: readonly string[];
  };
  readonly tasks: Readonly<Record<string, CompanyPlanDataTask>>;
  readonly companies: Readonly<Record<string, CompanyPlanDataCompany>>;
};

export type CompanyPlanInput = {
  /** Company slugs in the order they were picked. Unknown ones are ignored. */
  readonly companies: readonly string[];
  readonly when: CompanyPlanWhen;
  readonly level: CompanyPlanLevel;
  /** The list a person switched to, by company. A missing or unknown one opens the default list. */
  readonly lists?: Readonly<Record<string, string>>;
  /** Keys from companyPlanRoundKey. */
  readonly passedRounds?: readonly string[];
  readonly solvedTaskIds?: readonly string[];
  /** The framework the person chose for the tasks. Without one, the tasks follow each company's reports. */
  readonly framework?: CompanyPlanFramework;
  /** YYYY-MM-DD, passed in so a plan never depends on the clock. */
  readonly today: string;
};

export type CompanyPlanWhy =
  /** `unbound`: the reports tie the task to no round, so it sits where the plan has room and names no round. */
  | ({ readonly kind: 'report'; readonly unbound?: true } & CompanyPlanReportLine)
  | { readonly kind: 'pick'; readonly unbound?: true }
  /** Extra practice in the framework of the reports, or of the person's choice. */
  | { readonly kind: 'format'; readonly framework?: CompanyPlanFramework }
  | { readonly kind: 'general' }
  /** The round's problems on one clock, as the round runs them. */
  | { readonly kind: 'rehearsal'; readonly problems: number; readonly shortAnswers?: number; readonly choiceQuestions?: number };

export type PlannedTask = CompanyPlanDataTask & {
  readonly why: CompanyPlanWhy;
  readonly solved: boolean;
};

export type PlannedRound = CompanyPlanDataRound & {
  readonly key: string;
  readonly passed: boolean;
  readonly tasks: readonly PlannedTask[];
};

export type PlannedCompany = {
  readonly slug: string;
  readonly name: string;
  readonly framework: CompanyPlanFramework;
  readonly mixed: boolean;
  readonly checkedAt: string;
  /** The company's whole evidence, the number the guide shows; the list's own count when the data has no other. */
  readonly sourceCount: number;
  /** The guide's practice prompts; zero for a guide without them. */
  readonly promptCount: number;
  readonly list: { readonly id: string; readonly title: string; readonly chosen: boolean; readonly sourceCount: number; readonly unordered?: true };
  /** "These rounds come from Bangkok." and the questions that switch to the other lists. */
  readonly switchLine: { readonly text: string; readonly options: readonly { readonly listId: string; readonly ask: string }[] } | null;
  readonly rounds: readonly PlannedRound[];
};

export type CompanyPlan = {
  /** No known company was picked, so these are general tasks. */
  readonly general: boolean;
  /** The framework the person chose. Absent when the tasks follow the reports. */
  readonly framework?: CompanyPlanFramework;
  readonly companies: readonly PlannedCompany[];
  readonly formatPractice: readonly PlannedTask[];
  /** Every task in display order: company by company, round by round, then format practice. */
  readonly tasks: readonly PlannedTask[];
  /** What the screen before payment shows: tasks a visitor can open today, and the rest of the plan. */
  readonly preview: { readonly open: readonly PlannedTask[]; readonly rest: readonly PlannedTask[] };
  readonly next: PlannedTask | null;
  readonly totalMinutes: number;
  readonly remainingMinutes: number;
  readonly warnings: readonly string[];
};

export const COMPANY_PLAN_BUDGETS: Readonly<Record<CompanyPlanWhen, { readonly total: number; readonly format: number }>> = {
  tomorrow: { total: 3, format: 0 },
  'this-week': { total: 4, format: 1 },
  'next-week': { total: 6, format: 1 },
  'few-weeks': { total: 8, format: 1 },
  later: { total: 12, format: 2 },
};

export const COMPANY_PLAN_DESIGN_CAPS: Readonly<Record<CompanyPlanLevel, number>> = { junior: 1, mid: 1, senior: 2, staff: 3 };

const PREVIEW_OPEN_TASKS = 3;
const OLD_REPORT_YEARS = 2;
const LEVEL_WORDS: Readonly<Record<CompanyPlanLevel, string>> = { junior: 'junior', mid: 'mid-level', senior: 'senior', staff: 'staff' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A timed rehearsal of a round opens it: it runs the round's problems on one clock, the closest the plan gets to the
 * round itself. Then the practice link the guide shows on a round, so the plan and the guide agree. Then reported
 * tasks, newest first, then tasks an editor tied to a round, then tags. Reading comes after practice, because a buyer
 * pays for tasks: guides next, concept questions last. A rehearsal that holds none of its round's practice links is
 * one format among the round's several (Walmart's coding screen names four), so it follows the link with the tied
 * tasks.
 */
const PHASES = ['rehearsal', 'lead', 'report', 'link', 'pick', 'guide', 'concept'] as const;
type Phase = (typeof PHASES)[number];

type Candidate = { readonly task: CompanyPlanDataTask; readonly row: CompanyPlanDataRow | null; readonly phase: Phase };
type Slot = {
  readonly slug: string;
  readonly key: string;
  readonly candidates: readonly Candidate[];
};
type Selected = { readonly slug: string; readonly key: string | null; readonly task: CompanyPlanDataTask; readonly why: CompanyPlanWhy };

export function companyPlanRoundKey(slug: string, listId: string, roundId: string): string {
  return `${slug}/${listId}/${roundId}`;
}

/** The list every plan opens on, whatever the level: the default one, else the first. The others are a switch away. */
export function companyPlanDefaultList(company: CompanyPlanDataCompany): CompanyPlanDataList {
  return company.variants.find((list) => list.default) ?? company.variants[0];
}

const isRunnable = (task: CompanyPlanDataTask) => task.kind === 'coding' || task.kind === 'debug' || task.kind === 'system-design';
const whyOf = (row: CompanyPlanDataRow | null, task: CompanyPlanDataTask): CompanyPlanWhy => {
  if (task.kind === 'rehearsal') {
    return {
      kind: 'rehearsal',
      problems: task.members?.length ?? 0,
      ...(task.shortAnswers ? { shortAnswers: task.shortAnswers } : {}),
      ...(task.choiceQuestions ? { choiceQuestions: task.choiceQuestions } : {}),
    };
  }
  const unbound = row && !row.rounds?.length ? { unbound: true as const } : {};
  return row?.report ? { kind: 'report', ...row.report, ...unbound } : { kind: 'pick', ...unbound };
};

/**
 * The order a round offers its candidates in: the guide's own prompts first, then variety, so a task of a kind or
 * topic the round does not hold yet comes before a second variant of one it does (the debugging round's debug task
 * before a third autocomplete).
 */
function orderWithin(rows: readonly Candidate[]): Candidate[] {
  const left = [...rows].sort((a, b) => Number(Boolean(b.row?.prompt)) - Number(Boolean(a.row?.prompt)));
  const out: Candidate[] = [];
  const kinds = new Set<string>();
  const topics = new Set<string>();
  const topicOf = (task: CompanyPlanDataTask) => task.family ?? task.focus?.[0] ?? task.id;
  while (left.length) {
    let at = left.findIndex((candidate) => !kinds.has(candidate.task.kind) && !topics.has(topicOf(candidate.task)));
    if (at < 0) at = left.findIndex((candidate) => !topics.has(topicOf(candidate.task)));
    if (at < 0) at = left.findIndex((candidate) => !kinds.has(candidate.task.kind));
    if (at < 0) at = 0;
    const [chosen] = left.splice(at, 1);
    out.push(chosen);
    kinds.add(chosen.task.kind);
    topics.add(topicOf(chosen.task));
  }
  return out;
}

function roundTakes(round: CompanyPlanDataRound, task: CompanyPlanDataTask): boolean {
  return round.kinds.includes(task.kind === 'system-design' ? 'design' : 'coding');
}

/** Narrows rounds to the ones whose words match the task, best fit first. A task with no match keeps them all. */
function bestFit(rounds: readonly CompanyPlanDataRound[], task: CompanyPlanDataTask): readonly CompanyPlanDataRound[] {
  for (const focus of task.focus ?? []) {
    const fitting = rounds.filter((round) => round.focus?.includes(focus));
    if (fitting.length) return fitting;
  }
  return rounds;
}

/** Rounds held on one day share the part of their name before a colon ("Power Day: case"); any other round is its own day. */
function dayOf(round: CompanyPlanDataRound): string {
  const colon = round.name.indexOf(':');
  return colon > 0 ? round.name.slice(0, colon).trim() : round.id;
}

function slotsFor(
  data: CompanyPlanData,
  slug: string,
  list: CompanyPlanDataList,
  passed: ReadonlySet<string>,
  taskFor: TaskLookup,
  designPicks: boolean,
): Slot[] {
  const open = list.rounds.filter((round) => !passed.has(companyPlanRoundKey(slug, list.id, round.id)));
  const byRound = new Map<string, Candidate[]>(open.map((round) => [round.id, []]));
  const fallback = open.filter((round) => round.kinds.includes('coding') || round.kinds.includes('design')).slice(0, 1);
  // The practice links the guide shows on each round; a guide linked there is reading, not practice.
  const links = new Map<string, string[]>();
  for (const row of list.tasks) {
    if (!row.lead || taskFor(row.id)?.kind === 'guide') continue;
    for (const id of row.rounds ?? []) links.set(id, [...(links.get(id) ?? []), row.id]);
  }
  const opensRound = (task: CompanyPlanDataTask, row: CompanyPlanDataRow) => (row.rounds ?? []).every((id) => {
    const own = links.get(id) ?? [];
    return !own.length || own.some((link) => task.members?.includes(link));
  });

  for (const row of list.tasks) {
    const task = taskFor(row.id);
    if (!task) continue;
    // A guide linked on a round is still reading, so it waits like any guide.
    const phase: Phase = task.kind === 'rehearsal' ? (opensRound(task, row) ? 'rehearsal' : 'link') : row.lead && task.kind !== 'guide' ? 'lead' : row.report ? 'report' : task.kind === 'guide' ? 'guide' : row.rounds?.length ? 'link' : task.kind === 'trivia' ? 'concept' : 'pick';
    // A task stays with its rounds. Passing them all drops it and the budget moves on.
    const eligible = row.rounds?.length ? open.filter((round) => row.rounds?.includes(round.id)) : open.filter((round) => roundTakes(round, task));
    // Only a company with no round of this kind at all sends the task elsewhere, as with a reported design task.
    const homeless = !row.rounds?.length && !list.rounds.some((round) => roundTakes(round, task));
    // A task tied to no round follows its words the same way: when every round that fits them is behind the person,
    // it drops rather than filling a round of another kind (a UI build filed under Algorithms).
    const fits = (round: CompanyPlanDataRound) => (task.focus ?? []).some((focus) => round.focus?.includes(focus));
    if (!row.rounds?.length && !homeless && !eligible.some(fits) && list.rounds.some((round) => roundTakes(round, task) && fits(round))) continue;
    for (const round of bestFit(homeless ? fallback : eligible, task)) byRound.get(round.id)?.push({ task, row, phase });
  }

  // A round with nothing of its own still gets the guide for its kind. When the guide is all the round has, it ranks
  // like a linked task, so a behavioural round is not left empty while the coding rounds fill up.
  for (const round of open) {
    const own = byRound.get(round.id) ?? [];
    const addGuide = (route: string) => {
      const guide = data.tasks[route];
      if (guide) own.push({ task: guide, row: null, phase: own.length ? 'guide' : 'link' });
    };
    if (round.kinds.includes('people') && !own.some((candidate) => candidate.task.kind === 'guide')) addGuide(data.general.guides.people);
    if (round.kinds.includes('design') && !own.some((candidate) => candidate.task.kind === 'guide' || candidate.task.kind === 'system-design')) addGuide(data.general.guides.design);
  }

  // The round the person faces next is the first open one with something to practise. When it is a design round, a
  // senior or staff person's spare design slots take general cases there, after the company's own and up to the cap.
  const next = open.find((round) => byRound.get(round.id)?.length);
  if (designPicks && next?.kinds.includes('design')) {
    const own = byRound.get(next.id) ?? [];
    for (const id of data.general.designPractice ?? []) {
      const task = taskFor(id);
      if (task && !own.some((candidate) => candidate.task.id === id)) own.push({ task, row: null, phase: 'pick' });
    }
  }

  return open.map((round) => ({ slug, key: companyPlanRoundKey(slug, list.id, round.id), candidates: byRound.get(round.id) ?? [] }));
}

/** One company's tasks in the order it would spend a budget: phase by phase, with its rounds taking turns. */
function preferenceOrder(slots: readonly Slot[]): Selected[] {
  const order: Selected[] = [];
  const seen = new Set<string>();
  for (const phase of PHASES) {
    const queues = slots
      .map((slot) => ({ slot, rows: orderWithin(slot.candidates.filter((candidate) => candidate.phase === phase)), at: 0 }))
      .filter((queue) => queue.rows.length);
    let moved = true;
    while (moved) {
      moved = false;
      for (const queue of queues) {
        while (queue.at < queue.rows.length) {
          const candidate = queue.rows[queue.at];
          queue.at += 1;
          if (seen.has(candidate.task.id)) continue;
          seen.add(candidate.task.id);
          order.push({ slug: queue.slot.slug, key: queue.slot.key, task: candidate.task, why: whyOf(candidate.row, candidate.task) });
          moved = true;
          break;
        }
      }
    }
  }
  return order;
}

function monthWords(month: string): string {
  const [year, number] = month.split('-');
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

function olderThanCutoff(month: string, today: string): boolean {
  const [year, number] = today.split('-');
  return month < `${Number(year) - OLD_REPORT_YEARS}-${number}`;
}

function buildPreview(
  planTasks: readonly PlannedTask[],
  extras: readonly PlannedTask[],
  starters: readonly PlannedTask[],
  keepRest: boolean,
): CompanyPlan['preview'] {
  const open: PlannedTask[] = [];
  const seen = new Set<string>();
  const offer = (tasks: readonly PlannedTask[], accept: (task: PlannedTask) => boolean) => {
    for (const task of tasks) {
      if (open.length >= PREVIEW_OPEN_TASKS) return;
      if (task.access !== 'free' || task.kind === 'guide' || seen.has(task.id) || !accept(task)) continue;
      seen.add(task.id);
      open.push(task);
    }
  };
  // Something to run comes first. Solved tasks are the last resort, for someone who has done everything else.
  for (const accept of [(task: PlannedTask) => !task.solved, () => true]) {
    offer(planTasks, (task) => accept(task) && isRunnable(task));
    offer(extras, (task) => accept(task) && isRunnable(task));
    offer(planTasks, accept);
    offer(extras, accept);
    offer(starters, accept);
  }
  return { open, rest: keepRest ? planTasks.filter((task) => !seen.has(task.id)) : [] };
}

type TaskLookup = (id: string) => CompanyPlanDataTask | undefined;

/**
 * A row's task, in the framework the person chose when the task has a counterpart there. A task with no counterpart,
 * such as a JavaScript or system design task, stays as reported. "JavaScript" keeps React for UI builds, as the
 * companies with no framework in their reports do.
 */
function taskLookup(data: CompanyPlanData, framework: CompanyPlanFramework | undefined): TaskLookup {
  const tech = framework === 'javascript' ? 'react' : framework;
  return (id) => {
    const task = data.tasks[id];
    if (!task?.family || !tech || task.tech === tech) return task;
    const memberId = data.general.familyMembers?.[task.family]?.[tech];
    return memberId && data.tasks[memberId] ? data.tasks[memberId] : task;
  };
}

export function buildCompanyPlan(data: CompanyPlanData, input: CompanyPlanInput): CompanyPlan {
  const budget = COMPANY_PLAN_BUDGETS[input.when];
  const solved = new Set(input.solvedTaskIds ?? []);
  const passed = new Set(input.passedRounds ?? []);
  const taskFor = taskLookup(data, input.framework);
  const asPlanTask = (task: CompanyPlanDataTask, why: CompanyPlanWhy): PlannedTask => ({ ...task, why, solved: solved.has(task.id) });
  const starters = data.general.starters.flatMap((id) => {
    const task = taskFor(id);
    return task ? [asPlanTask(task, { kind: 'general' })] : [];
  });

  const chosen = [...new Set(input.companies)].flatMap((slug) => {
    const company = data.companies[slug];
    if (!company) return [];
    const switched = company.variants.find((list) => list.id === input.lists?.[slug]);
    return [{ slug, company, list: switched ?? companyPlanDefaultList(company), switched: Boolean(switched) }];
  });

  if (!chosen.length) {
    const tasks = starters.slice(0, budget.total);
    return {
      general: true,
      ...(input.framework ? { framework: input.framework } : {}),
      companies: [],
      formatPractice: [],
      tasks,
      preview: buildPreview(tasks, [], starters, false),
      next: tasks.find((task) => !task.solved) ?? null,
      totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
      remainingMinutes: tasks.filter((task) => !task.solved).reduce((sum, task) => sum + task.minutes, 0),
      warnings: [],
    };
  }

  const designCap = COMPANY_PLAN_DESIGN_CAPS[input.level];
  const selected: Selected[] = [];
  const canTake = (slug: string, task: CompanyPlanDataTask) => {
    if (selected.some((entry) => entry.task.id === task.id || (task.family && entry.task.family === task.family))) return false;
    // A rehearsal stands for its problems: a problem it holds never sits beside it, and it never repeats one taken.
    if (selected.some((entry) => entry.task.members?.includes(task.id))) return false;
    if (task.members?.some((id) => selected.some((entry) => entry.task.id === id))) return false;
    if (task.kind !== 'system-design') return true;
    return selected.filter((entry) => entry.slug === slug && entry.task.kind === 'system-design').length < designCap;
  };

  // Rounds take turns inside a company and companies take turns inside the budget, so neither an early round
  // nor the first company can use it up. A passed round has no slot.
  const designPicks = designCap > 1;
  const slotLists = chosen.map(({ slug, list }) => slotsFor(data, slug, list, passed, taskFor, designPicks));
  const orders = slotLists.map((slots) => preferenceOrder(slots));
  const cursors = orders.map(() => 0);
  // Each company's next round, the first open one with something to practise, and the rounds held the same day.
  const nextDays = chosen.map(({ slug, list }, index) => {
    const key = slotLists[index].find((slot) => slot.candidates.length)?.key ?? null;
    const round = list.rounds.find((entry) => companyPlanRoundKey(slug, list.id, entry.id) === key) ?? null;
    const keys = round ? list.rounds.filter((entry) => dayOf(entry) === dayOf(round)).map((entry) => companyPlanRoundKey(slug, list.id, entry.id)) : [];
    return { key, round, keys: new Set(keys) };
  });
  // Every open round gets its first takeable task before any round gets a second, company by company in turns, so
  // "every round, with its tasks" holds whenever the budget covers the rounds; the phased round-robin shares the rest.
  const byRound = orders.map((order) => {
    const groups = new Map<string, Selected[]>();
    for (const entry of order) {
      if (!entry.key) continue;
      groups.set(entry.key, [...(groups.get(entry.key) ?? []), entry]);
    }
    return [...groups.values()];
  });
  // The night before, and in the days before, the plan is the day the person faces next: its rounds take their first
  // tasks, then share what is left, before a later round gets one. Further out, every round gets its first task. The
  // day's tasks are the ones tied to its rounds; a task tied to no round waits, as a take-home brief does.
  const nearDay = input.when === 'tomorrow' || input.when === 'this-week';
  const tiedHere = (entry: Selected) => !('unbound' in entry.why && entry.why.unbound);
  const dayRounds = byRound.map((rounds, index) => rounds.filter((candidates) => nextDays[index].keys.has(candidates[0].key ?? '')));
  const dayTurns = dayRounds.map(() => 0);
  const fillRounds = (limit: number) => {
    if (nearDay) {
      // Companies take turns, one task each per pass, and a company's day rounds take turns inside it.
      let moved = true;
      while (moved && selected.length < limit) {
        moved = false;
        dayRounds.forEach((rounds, index) => {
          if (selected.length >= limit) return;
          for (let tried = 0; tried < rounds.length; tried += 1) {
            const at = (dayTurns[index] + tried) % rounds.length;
            const entry = rounds[at].find((candidate) => tiedHere(candidate) && canTake(candidate.slug, candidate.task));
            if (!entry) continue;
            selected.push(entry);
            dayTurns[index] = (at + 1) % rounds.length;
            moved = true;
            return;
          }
          // A company whose day has nothing tied to it still gets its first task, so no company is left out.
          if (selected.some((taken) => taken.slug === chosen[index].slug)) return;
          const first = byRound[index].flat().find((candidate) => canTake(candidate.slug, candidate.task));
          if (!first) return;
          selected.push(first);
          moved = true;
        });
      }
    }
    for (let at = 0; byRound.some((rounds) => at < rounds.length); at += 1) {
      for (const rounds of byRound) {
        if (selected.length >= limit) return;
        const candidates = rounds[at];
        if (!candidates || selected.some((taken) => taken.key === candidates[0].key)) continue;
        const entry = candidates.find((candidate) => canTake(candidate.slug, candidate.task));
        if (entry) selected.push(entry);
      }
    }
    let moved = true;
    while (selected.length < limit && moved) {
      moved = false;
      orders.forEach((order, index) => {
        if (selected.length >= limit) return;
        while (cursors[index] < order.length) {
          const entry = order[cursors[index]];
          cursors[index] += 1;
          if (!canTake(entry.slug, entry.task)) continue;
          selected.push(entry);
          moved = true;
          return;
        }
      });
    }
  };
  fillRounds(budget.total - budget.format);

  // What Premium opens sits on the round the person faces next whenever that round has a Premium candidate: it
  // takes the format-practice slot before any other round's second task. A full Tomorrow plan swaps a Premium task
  // of a later round for it, and otherwise leaves the one-Premium rule below to bring it in.
  const nextRoundPremium = (index: number) => byRound[index].find((candidates) => candidates[0].key === nextDays[index].key)
    ?.find((candidate) => candidate.task.access === 'premium' && canTake(candidate.slug, candidate.task));
  chosen.forEach((_, index) => {
    const entry = nextRoundPremium(index);
    if (!entry || selected.some((taken) => taken.key === entry.key && taken.task.access === 'premium')) return;
    if (selected.length >= budget.total) {
      // Only the company's own Premium task on a later round makes way, so no company loses its one slot.
      const at = selected.map((taken, position) => ({ taken, position }))
        .filter(({ taken }) => taken.slug === entry.slug && taken.key !== entry.key && taken.task.access === 'premium')
        .pop()?.position ?? -1;
      if (at < 0) return;
      selected.splice(at, 1);
    }
    selected.push(entry);
  });

  // The round the person faces next takes the format share first, with its own open tasks: the free practice the
  // guide sets for the round the person fears beats a task in the same framework that no report names.
  const nextRoundOpen = (index: number) => byRound[index].find((candidates) => candidates[0].key === nextDays[index].key)
    ?.find((candidate) => candidate.task.access === 'free' && isRunnable(candidate.task) && tiedHere(candidate) && canTake(candidate.slug, candidate.task));
  const shareEnd = Math.min(budget.total, selected.length + budget.format);
  for (let moved = true; moved && selected.length < shareEnd;) {
    moved = false;
    chosen.forEach((_, index) => {
      if (selected.length >= shareEnd) return;
      const entry = nextRoundOpen(index);
      if (!entry) return;
      selected.push(entry);
      moved = true;
    });
  }

  // Format practice takes what is left of its share, and whatever a thin company left of the budget. It follows the
  // person's framework when they chose one, and each company's reports otherwise.
  const frameworks = input.framework ? [input.framework] : [...new Set(chosen.map(({ company }) => company.framework))];
  const formatPool = (index: number) => frameworks.flatMap((framework) => {
    const id = data.general.formatPractice[framework]?.[index];
    return id && data.tasks[id] ? [{ task: data.tasks[id], framework }] : [];
  });
  // A senior or staff person whose next round is design practises design there; framework extras would serve rounds
  // already behind them.
  const designNext = designPicks && nextDays.every((day) => day.round?.kinds.includes('design'));
  for (const { task, framework } of designNext ? [] : [...formatPool(0), ...formatPool(1)]) {
    if (selected.length < budget.total && canTake('', task)) selected.push({ slug: '', key: null, task, why: { kind: 'format', framework } });
  }
  // When the plan already holds the format tasks, the rounds use what is left.
  fillRounds(budget.total);

  // A short plan still carries one Premium task, so a buyer gets something new. It replaces a task of the same
  // company, so no company loses its only slot; the company's next round offers it first. Only a company with no
  // Premium task of its own falls back on format practice.
  if (input.when === 'tomorrow' && !selected.some((entry) => entry.task.access === 'premium')) {
    let swapped = false;
    for (let at = selected.length - 1; at >= 0 && !swapped; at -= 1) {
      const [removed] = selected.splice(at, 1);
      const index = chosen.findIndex(({ slug }) => slug === removed.slug);
      const order = orders[index] ?? [];
      const premium = (index >= 0 ? nextRoundPremium(index) : undefined)
        ?? order.find((entry) => entry.task.access === 'premium' && canTake(entry.slug, entry.task));
      if (premium) {
        selected.push(premium);
        swapped = true;
      } else {
        selected.splice(at, 0, removed);
      }
    }
    if (!swapped) {
      const removed = selected.pop();
      const premium = [...formatPool(0), ...formatPool(1)].find(({ task }) => task.access === 'premium' && canTake('', task));
      if (premium) selected.push({ slug: '', key: null, task: premium.task, why: { kind: 'format', framework: premium.framework } });
      else if (removed) selected.push(removed);
    }
  }

  // Every company keeps at least one open task to try, so no plan reads "0 open now": the last Premium task of a
  // company with none makes way for its first open candidate. A Tomorrow plan keeps its one Premium task.
  chosen.forEach(({ slug }, index) => {
    const own = selected.filter((entry) => entry.slug === slug);
    // A guide is reading, not something to try, so it does not count as the company's open task.
    if (!own.length || own.some((entry) => entry.task.access === 'free' && entry.task.kind !== 'guide')) return;
    if (input.when === 'tomorrow' && selected.filter((entry) => entry.task.access === 'premium').length <= 1) return;
    const at = selected.indexOf(own[own.length - 1]);
    const [removed] = selected.splice(at, 1);
    const open = orders[index].find((entry) => entry.task.access === 'free' && entry.task.kind !== 'guide' && canTake(entry.slug, entry.task));
    selected.splice(at, 0, open ?? removed);
  });

  const companies: PlannedCompany[] = chosen.map(({ slug, company, list, switched }) => ({
    slug,
    name: company.name,
    // A chosen framework settles what the reports left mixed.
    framework: input.framework ?? company.framework,
    mixed: input.framework ? false : Boolean(company.mixed),
    checkedAt: company.checkedAt,
    sourceCount: company.sourceCount ?? list.sourceCount,
    promptCount: company.promptCount ?? 0,
    list: { id: list.id, title: list.title, chosen: switched, sourceCount: list.sourceCount, ...(list.unordered ? { unordered: true as const } : {}) },
    switchLine: company.variants.length > 1
      ? {
          text: `${chosen.length > 1 ? `${company.name} rounds` : 'These rounds'} come from ${list.from}.`,
          options: company.variants.filter((other) => other.id !== list.id).map((other) => ({ listId: other.id, ask: other.ask ?? '' })),
        }
      : null,
    rounds: list.rounds.map((round) => {
      const key = companyPlanRoundKey(slug, list.id, round.id);
      return {
        ...round,
        key,
        passed: passed.has(key),
        tasks: selected.filter((entry) => entry.key === key).map((entry) => asPlanTask(entry.task, entry.why)),
      };
    }),
  }));

  const formatPractice = selected.filter((entry) => entry.key === null).map((entry) => asPlanTask(entry.task, entry.why));
  const tasks = [...companies.flatMap((company) => company.rounds.flatMap((round) => round.tasks)), ...formatPractice];
  const extras = chosen.flatMap(({ list }) => list.tasks.flatMap((row) => {
    const task = taskFor(row.id);
    return task ? [asPlanTask(task, whyOf(row, task))] : [];
  }));

  const warnings: string[] = [];
  for (const { company, list, switched } of chosen) {
    if (!switched && list.reported && !list.reported.levels.includes(input.level)) {
      warnings.push(`No report from a ${LEVEL_WORDS[input.level]} candidate at ${company.name}. These accounts come from ${list.reported.who}. Confirm the loop with your recruiter.`);
    }
    if (list.newestReport && olderThanCutoff(list.newestReport, input.today)) {
      const subject = chosen.length > 1 ? `the ${company.name} rounds` : 'these rounds';
      warnings.push(`The newest report behind ${subject} is from ${monthWords(list.newestReport)}. Formats may have changed, so confirm with your recruiter.`);
    }
  }

  return {
    general: false,
    ...(input.framework ? { framework: input.framework } : {}),
    companies,
    formatPractice,
    tasks,
    preview: buildPreview(tasks, extras, starters, true),
    next: tasks.find((task) => !task.solved && task.kind !== 'guide') ?? tasks.find((task) => !task.solved) ?? null,
    totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
    remainingMinutes: tasks.filter((task) => !task.solved).reduce((sum, task) => sum + task.minutes, 0),
    warnings,
  };
}
