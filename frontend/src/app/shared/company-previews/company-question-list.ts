import type { CompanyInterviewProcess, InterviewProcessSource, ReportedQuestionKind } from './company-interview-processes';

/**
 * The counts a guide's question list shows, derived from the process data so the stage table, the list, the offer and
 * the generated cdn/questions/company-question-lists.json can never disagree.
 */

/** A question shows as new for this many days after the end of its newest account's month. */
export const NEW_QUESTION_DAYS = 60;

export type QuestionListRow = {
  readonly id: string;
  /** The stage name, or null when no source names the round ("Round not stated"). */
  readonly round: string | null;
  readonly kind: ReportedQuestionKind;
  /** Distinct candidate accounts that report it. */
  readonly accounts: number;
  /** Question banks that list it. */
  readonly banks: number;
  /** YYYY-MM of its newest account; null when only a question bank lists it. */
  readonly latest: string | null;
  /** YYYY-MM-DD, the last day it shows as new; null when only a question bank lists it. */
  readonly newUntil: string | null;
  /** The first row, open to every reader. */
  readonly open: boolean;
  /** Locked and comes with a practice task or an answer guide, so the one free unlock can open it. */
  readonly unlockable: boolean;
};

/** An open behavioural question and how often the sources report it. */
export type BehaviouralRow = {
  readonly id: string;
  readonly accounts: number;
  readonly banks: number;
  readonly latest: string | null;
};

export type QuestionListSummary = {
  /** Reported questions in the list; the behavioural group is counted apart. */
  readonly total: number;
  /** Questions per stage, in the order the stages first appear in the process; stages with none are left out. */
  readonly rounds: readonly { readonly stage: string; readonly count: number }[];
  readonly roundNotStated: number;
  /** YYYY-MM of the newest account behind any question. */
  readonly newestAccount: string | null;
  readonly rows: readonly QuestionListRow[];
  readonly behavioural: readonly BehaviouralRow[];
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const QUESTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isAccount(source: InterviewProcessSource): boolean {
  return source.kind === 'report' && !source.reportForm;
}

/** The last day a question whose newest account is from `month` (YYYY-MM) shows as new. */
export function newUntil(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const nextMonthStart = Date.UTC(year, monthIndex, 1);
  return new Date(nextMonthStart + (NEW_QUESTION_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
}

/** Whether a row shows as new on `today` (YYYY-MM-DD). */
export function isNewQuestion(row: QuestionListRow, today: string): boolean {
  return row.newUntil !== null && today <= row.newUntil;
}

/** How often sources report a question: distinct accounts, question banks, and the newest account's month. */
function frequency(sources: readonly InterviewProcessSource[]): Pick<QuestionListRow, 'accounts' | 'banks' | 'latest'> {
  const accounts = sources.filter(isAccount);
  return {
    accounts: new Set(accounts.map((source) => source.url)).size,
    banks: new Set(sources.filter((source) => source.reportForm === 'question-bank').map((source) => source.url)).size,
    latest: accounts.map((source) => source.date).sort().at(-1) ?? null,
  };
}

export function summariseQuestionList(process: CompanyInterviewProcess): QuestionListSummary | null {
  const questions = process.questions ?? [];
  if (!questions.length) return null;
  const rows = questions.map((question, index): QuestionListRow => {
    const seen = frequency(question.sources);
    const open = index === 0;
    return {
      id: question.id,
      round: question.round ?? null,
      kind: question.kind,
      ...seen,
      newUntil: seen.latest ? newUntil(seen.latest) : null,
      open,
      unlockable: !open && Boolean(question.practice || question.answerGuide),
    };
  });
  const stageOrder = [...new Set(process.variants.flatMap((variant) => variant.stages.map((stage) => stage.stage)))];
  const rounds = stageOrder
    .map((stage) => ({ stage, count: rows.filter((row) => row.round === stage).length }))
    .filter((round) => round.count > 0);
  const months = rows.map((row) => row.latest).filter((month): month is string => month !== null).sort();
  return {
    total: rows.length,
    rounds,
    roundNotStated: rows.filter((row) => row.round === null).length,
    newestAccount: months.at(-1) ?? null,
    rows,
    behavioural: (process.behaviouralQuestions ?? []).map((question) => ({ id: question.id, ...frequency(question.sources) })),
  };
}

/** What is wrong with a process's question lists on their own terms; catalog and answer-guide links are checked by the generator. */
const TOPIC_MAX = 48;
/** One to six words up to the length limit, not ending in a full stop; one word is allowed for a concept ("Closures"). */
const TOPIC = new RegExp(`^(?=.{1,${TOPIC_MAX}}$)\\S+(?: \\S+){0,5}(?<!\\.)$`);

export function questionListProblems(process: CompanyInterviewProcess): string[] {
  const problems: string[] = [];
  const questions = process.questions ?? [];
  const stages = new Set(process.variants.flatMap((variant) => variant.stages.map((stage) => stage.stage)));
  const ids = new Set<string>();
  const check = (at: string, id: string, text: string, sources: readonly InterviewProcessSource[]) => {
    if (!QUESTION_ID.test(id)) problems.push(`${at}: the id must be kebab-case`);
    if (ids.has(id)) problems.push(`${at}: the id is used twice`);
    ids.add(id);
    if (!text.trim()) problems.push(`${at}: the question is empty`);
    if (!sources.length) problems.push(`${at}: no source reports it`);
    if (!sources.some((source) => source.kind === 'report')) problems.push(`${at}: only official pages back it`);
    const urls = sources.map((source) => source.url);
    if (new Set(urls).size !== urls.length) problems.push(`${at}: a source is listed twice`);
    for (const source of sources) {
      if (!/^https:\/\//.test(source.url)) problems.push(`${at}: ${source.url} is not an https link`);
      if (!MONTH.test(source.date)) problems.push(`${at}: ${source.url} has the date "${source.date}", not YYYY-MM`);
    }
  };
  const topics = new Set<string>();
  questions.forEach((question, index) => {
    const at = `question ${question.id || index}`;
    check(at, question.id, question.question, question.sources);
    const topic = question.topic ?? '';
    if (!TOPIC.test(topic)) problems.push(`${at}: the topic "${topic}" must be 1 to 6 words, at most ${TOPIC_MAX} characters, with no full stop`);
    if (topics.has(topic.toLowerCase())) problems.push(`${at}: the topic "${topic}" is used twice`);
    topics.add(topic.toLowerCase());
    if (question.round !== undefined && !stages.has(question.round)) problems.push(`${at}: no stage is named "${question.round}"`);
    if (index === 0 && question.promptNotShared) problems.push(`${at}: the open row must show a question, not a format`);
  });
  (process.behaviouralQuestions ?? []).forEach((question, index) => {
    check(`behavioural question ${question.id || index}`, question.id, question.question, question.sources);
  });
  return problems;
}
