import type { CompanyPlanAnswers, CompanyPlanAnswerLevel, CompanyPlanFrameworkChoice, CompanyPlanWhen } from '../../../core/models/company-plan.model';
import type { CompanyPlan, CompanyPlanData, CompanyPlanWhy, PlannedCompany, PlannedTask } from './company-plan.engine';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const WHEN_LABELS: Readonly<Record<CompanyPlanWhen, string>> = {
  tomorrow: 'Tomorrow',
  'this-week': 'This week',
  'next-week': 'Next week',
  'few-weeks': 'In two to four weeks',
  later: 'Later or no date',
};

const WHEN_PHRASES: Readonly<Record<CompanyPlanWhen, string>> = {
  tomorrow: ' for tomorrow',
  'this-week': ' for this week',
  'next-week': ' for next week',
  'few-weeks': ' for the next few weeks',
  later: '',
};

export const LEVEL_LABELS: Readonly<Record<CompanyPlanAnswerLevel, string>> = {
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  staff: 'Staff',
};

const FRAMEWORK_LABELS: Readonly<Record<string, string>> = { react: 'React', angular: 'Angular', vue: 'Vue', javascript: 'JavaScript' };

export function frameworkLabel(framework: string): string {
  return FRAMEWORK_LABELS[framework] ?? framework;
}

export function joinNames(names: readonly string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '';
}

/** "2026-07" as "Jul 2026". */
export function shortMonth(month: string): string {
  const [year, number] = month.split('-');
  return `${SHORT_MONTHS[Number(number) - 1] ?? ''} ${year}`.trim();
}

export function shortDay(day: string): string {
  return new Date(`${day.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Why a task is in the plan. A report label only ever comes from a report, and says "modelled on" because the task is
 * a practice version of what the report describes, never the reported wording.
 */
export function whyLine(why: CompanyPlanWhy): string {
  switch (why.kind) {
    case 'report':
      // An approximate month carries the process table's mark: "Taro (approx.), Jan 2022".
      return `Modelled on a ${why.posting ? 'job posting' : 'report'}: ${why.publisher}${why.approx ? ' (approx.)' : ''}, ${shortMonth(why.date)}`;
    case 'format':
      // The framework, by name: "the reported format" read as the interview's format (a review, a bug squash).
      return why.framework ? `Extra ${frameworkLabel(why.framework)} practice` : 'Extra practice';
    case 'general':
      return 'General frontend practice';
    case 'rehearsal': {
      // "8 short answers and 2 problems", "2 multiple-choice questions and 2 problems".
      const count = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;
      const parts = [
        ...(why.shortAnswers ? [count(why.shortAnswers, 'short answer', 'short answers')] : []),
        ...(why.choiceQuestions ? [count(why.choiceQuestions, 'multiple-choice question', 'multiple-choice questions')] : []),
        count(why.problems, 'problem', 'problems'),
      ];
      return `Timed rehearsal: ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts.at(-1)} on one clock`;
    }
    default:
      // A pick the reports tie to no round sits where the plan has room, so it claims no round.
      return why.unbound ? 'Our pick for this plan' : 'Our pick for this round';
  }
}

/**
 * The why line of an open row, with the round it serves: "Our pick for the Phone screen", "Modelled on a report:
 * Taro, May 2025 · Phone screen". Format and general practice have no round and read as before.
 */
export function whyLineFor(why: CompanyPlanWhy, round: string | null): string {
  // A task the reports tie to no round sits where the plan has room; naming that round would overstate it.
  if (!round || why.kind === 'format' || why.kind === 'general' || (why.kind !== 'rehearsal' && why.unbound)) return whyLine(why);
  return why.kind === 'report' || why.kind === 'rehearsal' ? `${whyLine(why)} · ${round}` : `Our pick for the ${round}`;
}

/** "Extra React practice", or plain "Extra practice" when the companies' reports name different frameworks. */
export function formatGroupName(plan: Pick<CompanyPlan, 'companies'>): string {
  const frameworks = [...new Set(plan.companies.map((company) => company.framework))];
  return frameworks.length === 1 ? `Extra ${frameworkLabel(frameworks[0])} practice` : 'Extra practice';
}

/** Five-minute steps, so the total adds up from the listed minutes: 200 minutes reads "3 hours 20 minutes". */
export function hoursText(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const rounded = Math.round(minutes / 5) * 5;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}${rest ? ` ${rest} minutes` : ''}`;
}

export function clockText(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

function addDays(day: Date, days: number): Date {
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * The days the interview falls in, counted from when the answers were given: the next day for Tomorrow, otherwise the
 * Monday-to-Sunday week. Later has no date. Local time, because "next week" means the person's week.
 */
function interviewWindow(when: CompanyPlanWhen, answeredAt: string): { readonly start: Date; readonly end: Date } | null {
  const answered = new Date(answeredAt);
  if (when === 'later' || Number.isNaN(answered.getTime())) return null;
  if (when === 'tomorrow') return { start: addDays(answered, 1), end: addDays(answered, 2) };
  if (when === 'few-weeks') return { start: addDays(answered, 14), end: addDays(answered, 28) };
  const monday = addDays(answered, -((answered.getDay() + 6) % 7) + (when === 'next-week' ? 7 : 0));
  return { start: monday, end: addDays(monday, 7) };
}

/** "Week of Nov 9", "Nov 3" for Tomorrow, "Nov 19 to Dec 3" for a few weeks out, or "No date yet". */
export function planDateChip(when: CompanyPlanWhen, answeredAt: string): string {
  const window = interviewWindow(when, answeredAt);
  if (!window) return 'No date yet';
  const format = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (when === 'tomorrow') return format(window.start);
  if (when === 'few-weeks') return `${format(window.start)} to ${format(window.end)}`;
  return `Week of ${format(window.start)}`;
}

export function planDatePassed(when: CompanyPlanWhen, answeredAt: string, now: Date): boolean {
  const window = interviewWindow(when, answeredAt);
  return Boolean(window && now.getTime() >= window.end.getTime());
}

/** "Rounds and tasks from 6 public sources, last checked Oct 22, 2026. These are practice versions, not leaked questions." */
export function planEvidenceLine(plan: CompanyPlan, names: string): string {
  const sources = plan.companies.reduce((sum, company) => sum + company.sourceCount, 0);
  const where = plan.companies.length === 1 ? `, last checked ${shortDay(plan.companies[0].checkedAt)}` : ` across ${names}`;
  return `Rounds and tasks from ${sources} public ${sources === 1 ? 'source' : 'sources'}${where}. These are practice versions, not leaked questions.`;
}

/** How many of a plan's tasks open without Premium: the free ones, and the task an account opened with its free unlock. */
export function openTaskCount(plan: Pick<CompanyPlan, 'tasks'>, unlockedTaskId: string | null = null): number {
  return plan.tasks.filter((task) => task.access === 'free' || task.id === unlockedTaskId).length;
}

/** "Angular, your choice" for a chosen framework, "React, from reports" for one the reports name, plain "JavaScript" otherwise. */
export function planFrameworkChips(plan: CompanyPlan): string[] {
  if (plan.framework) return [`${frameworkLabel(plan.framework)}, your choice`];
  return [...new Set(plan.companies.map((company) => company.framework))].map((framework) => (
    framework === 'javascript' ? frameworkLabel(framework) : `${frameworkLabel(framework)}, from reports`
  ));
}

const FRAMEWORK_CHOICES: readonly CompanyPlanFrameworkChoice[] = ['react', 'angular', 'vue'];

/**
 * Where the UI tasks' framework comes from and how to change it: "UI tasks follow React, the framework in the
 * reports." with a button per other framework, and a way back to the reports once a framework was chosen. The line
 * says what a choice moves, because the reported JavaScript tasks stay as they were reported.
 */
export function planFrameworkLine(plan: CompanyPlan): { text: string; options: { framework: CompanyPlanFrameworkChoice | null; label: string }[] } {
  const reported = [...new Set(plan.companies.map((company) => company.framework))];
  const current = plan.framework ?? (reported.length === 1 ? reported[0] : null);
  // Only a task with a counterpart in the chosen framework switches (taskLookup); a reported React build without one
  // stays React, so the line promises no more than that.
  const label = plan.framework ? frameworkLabel(plan.framework) : '';
  const text = plan.framework
    ? `Tasks with ${/^[aeiou]/i.test(label) ? 'an' : 'a'} ${label} version, and the extra practice, follow ${label}, your choice; the rest stay as reported.`
    : current === 'javascript'
      ? 'The reports name no framework, so the tasks are in JavaScript and the UI builds in React.'
      : current
        ? `UI tasks follow ${frameworkLabel(current)}, the framework in the reports.`
        : "UI tasks follow the framework in each company's reports.";
  const options: { framework: CompanyPlanFrameworkChoice | null; label: string }[] = FRAMEWORK_CHOICES
    .filter((framework) => framework !== current)
    .map((framework) => ({ framework, label: `Use ${frameworkLabel(framework)}` }));
  if (plan.framework) options.push({ framework: null, label: 'Back to the reports' });
  return { text, options };
}

/** "Reported in Aced Jul 2026, Aced Nov 2025 and 2 more". Empty for a round without sources. */
export function roundSourcesLine(round: { readonly sources: readonly { readonly label: string; readonly date: string }[]; readonly moreSources?: number }): string {
  const named = round.sources.map((source) => (source.date ? `${source.label} ${shortMonth(source.date)}` : source.label));
  if (!named.length) return '';
  return `Reported in ${round.moreSources ? `${named.join(', ')} and ${round.moreSources} more` : joinNames(named)}`;
}

/** The first line of the summary: "6 tasks for next week, about 3.5 hours". */
export function planSummaryLine(plan: Pick<CompanyPlan, 'tasks' | 'totalMinutes'>, when: CompanyPlanWhen): string {
  const count = plan.tasks.length;
  return `${count} ${count === 1 ? 'task' : 'tasks'}${WHEN_PHRASES[when]}, about ${hoursText(plan.totalMinutes)}`;
}

/** The round a task belongs to, for the line under its title. */
export function taskGroups(plan: CompanyPlan): ReadonlyMap<string, string> {
  const groups = new Map<string, string>();
  for (const company of plan.companies) {
    for (const round of company.rounds) {
      for (const task of round.tasks) groups.set(task.id, round.name);
    }
  }
  for (const task of plan.formatPractice) groups.set(task.id, formatGroupName(plan));
  return groups;
}

/** The preview address for these answers, for a plan that is not the one on the account. */
export function previewQueryParams(answers: CompanyPlanAnswers): Record<string, string> {
  const lists = answers.companies.flatMap((company) => (company.list ? [`${company.slug}:${company.list}`] : [])).join(',');
  return {
    companies: answers.companies.map((company) => company.slug).join(','),
    ...(lists ? { lists } : {}),
    when: answers.when,
    level: answers.level,
    ...(answers.passedRounds?.length ? { passed: answers.passedRounds.join(',') } : {}),
    ...(answers.framework ? { framework: answers.framework } : {}),
  };
}

/**
 * The round a plan starts from, for a company whose first rounds are behind the person: "Phone screen", or null when
 * nothing is passed or every round is.
 */
export function nextRoundName(company: Pick<PlannedCompany, 'rounds'>): string | null {
  if (!company.rounds.some((round) => round.passed)) return null;
  return company.rounds.find((round) => !round.passed)?.name ?? null;
}

/** How many questions a company's practice set holds, as the company pages count them. */
export type CompanySetCounts = {
  readonly all: number;
  readonly coding: number;
  readonly trivia: number;
  readonly system: number;
  /** Debugging tasks, such as a bug squash round's; data from before they counted has none. */
  readonly debug?: number;
};

/**
 * "The FrontendAtlas Amazon practice set: 42 questions (18 coding, 23 concept, 1 system design)", or the sets side by
 * side for several companies. It names whose set it is, so it does not read as the count of reported questions. Empty
 * when no company has a set, so a plan never promises one.
 */
export function companySetLine(sets: readonly { readonly name: string; readonly counts: CompanySetCounts | undefined }[]): string {
  const known = sets.flatMap((set) => (set.counts && set.counts.all > 0 ? [{ name: set.name, counts: set.counts }] : []));
  if (known.length === 1) {
    const { name, counts } = known[0];
    const parts: [number, string][] = [[counts.coding, 'coding'], [counts.debug ?? 0, 'debugging'], [counts.trivia, 'concept'], [counts.system, 'system design']];
    const split = parts.filter(([count]) => count > 0).map(([count, kind]) => `${count} ${kind}`).join(', ');
    return `The FrontendAtlas ${name} practice set: ${counts.all} questions (${split})`;
  }
  return known.length ? `The FrontendAtlas practice sets: ${joinNames(known.map((set) => `${set.counts.all} ${set.name}`))} questions` : '';
}

/** The `src` pricing is opened with, written like the guides' own: `company_plan_capital_one`, never a hyphen. */
export function planPricingSource(slug: string | undefined): string {
  return `company_plan_${slug ? slug.replace(/-/g, '_') : 'general'}`;
}

export function planCompanyNames(data: CompanyPlanData, answers: CompanyPlanAnswers): string {
  return joinNames(answers.companies.flatMap((company) => (data.companies[company.slug] ? [data.companies[company.slug].name] : [])));
}

export type CompanyPlanPricingCopy = {
  readonly title: string;
  readonly summary: string;
  /** Why the month is the card to pick when the interview is days away; empty otherwise. */
  readonly note: string;
  /** The card pricing recommends: the month for an interview this week, otherwise the quarter. */
  readonly recommendedPlan: 'monthly' | 'quarterly';
  /** Lines that open every plan card, in place of "Full Premium content". */
  readonly lead: readonly string[];
};

const SOON_NOTES: Readonly<Partial<Record<CompanyPlanWhen, string>>> = {
  tomorrow: 'Your interview is tomorrow, so a month of Premium is enough.',
  'this-week': 'Your interview is this week, so a month of Premium is enough.',
  'next-week': 'Your interview is next week, so a month of Premium is enough.',
  'few-weeks': 'Your interview is a few weeks away: a month of Premium covers it, and the quarter adds time for the full library.',
};

/**
 * What paying adds to a plan, in the plan's own numbers. The preview lists which tasks are open, so the note names the
 * locked ones and the plan page rather than calling the whole plan Premium.
 */
export function planUnlockNote(open: number, total: number): string {
  const locked = total - open;
  if (!locked) return 'Every task is open now. Premium adds your plan page with your progress, and you land on it right after payment.';
  if (!open) return 'Every task opens with Premium, and you land on your plan page right after payment.';
  return `${open} of ${total} tasks are open now. Premium opens ${locked === 1 ? 'the locked one' : `the ${locked} locked ones`} and your plan page, and you land on it right after payment.`;
}

/**
 * What the pricing page says while a plan waits behind Premium. Every framework task has a live preview, but only
 * some run checks, so the card says only the first. The counts are left out when the data predates them.
 */
export function companyPlanPricingCopy(
  data: CompanyPlanData,
  answers: CompanyPlanAnswers,
  plan: CompanyPlan,
  unlockedTaskId: string | null = null,
): CompanyPlanPricingCopy {
  const names = planCompanyNames(data, answers);
  const open = openTaskCount(plan, unlockedTaskId);
  const locked = plan.tasks.length - open;
  const opens = open
    ? ` ${open} ${open === 1 ? 'is' : 'are'} open now, ${locked} ${locked === 1 ? 'opens' : 'open'} with Premium.`
    : ' Every task opens with Premium.';
  // The banner above the cards counts the open tasks, so the cards name what Premium adds to them, not "the full plan".
  const planLine = !locked
    ? `Your ${names} plan page, with your progress`
    : open
      ? `${locked === 1 ? 'The locked task' : `The ${locked} locked tasks`} in your ${names} plan`
      : `Every task in your ${names} plan`;
  const framework = plan.companies[0]?.framework ?? 'javascript';
  const counts = data.general.premiumCounts;
  const note = SOON_NOTES[answers.when] ?? '';
  // The plan's timed rehearsals are what most buyers pay for, so the card names them first.
  const rehearsals = plan.tasks.filter((task) => task.kind === 'rehearsal')
    .map((task) => `A timed rehearsal of the ${task.title.replace(/^Rehearse the /, '')}`);
  return {
    title: `Your ${names} plan is waiting`,
    summary: `${planSummaryLine(plan, answers.when)}.${opens} Every round${plan.companies.some((company) => company.list.unordered) ? '' : ' in order'}, with the tasks the reports describe and your progress.`,
    note,
    recommendedPlan: note ? 'monthly' : 'quarterly',
    lead: [
      planLine,
      ...rehearsals,
      ...(counts ? [
        framework === 'javascript'
          ? `${counts.javascript} Premium JavaScript tasks with browser tests`
          : `${counts[framework]} Premium ${frameworkLabel(framework)} tasks with a live preview`,
        `${counts.systemDesign} Premium system design walkthroughs`,
      ] : []),
    ],
  };
}

/**
 * What the task's page needs to offer the way back and, for practice it can step through, "Next". A design
 * walkthrough gets only the way back, and a guide opens plainly.
 */
export function practiceState(task: PlannedTask, tasks: readonly PlannedTask[], returnToUrl: string, returnLabel: string): Record<string, unknown> {
  if (task.kind === 'guide') return {};
  // A rehearsal opens on its first problem and moves through its own problems, so it gets only the way back.
  if (task.kind === 'system-design' || task.kind === 'rehearsal') return { returnToUrl, returnLabel };
  const items = tasks
    .filter((entry) => entry.tech && entry.kind !== 'system-design' && entry.kind !== 'guide')
    .map((entry) => ({ tech: entry.tech, kind: entry.kind, id: entry.id }));
  const index = items.findIndex((item) => item.id === task.id);
  return index < 0 ? {} : { session: { items, index }, returnToUrl, returnLabel };
}
