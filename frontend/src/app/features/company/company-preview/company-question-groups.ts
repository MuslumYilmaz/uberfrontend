import type {
  CompanyInterviewProcess,
  InterviewProcessSource,
  ReportedQuestion,
} from '../../../shared/company-previews/company-interview-processes';
import type { QuestionListSummary } from '../../../shared/company-previews/company-question-list';

/**
 * A guide's reported questions with their groups. Rows from experienced frontend loops lead the list and carry its
 * counts; rows a process marks as early-career or general loops follow in groups of their own, outside every count.
 * A process that names no source (`sourceDisplay: 'year'`) says when a question was reported by its years alone.
 * No Angular import here: the generators load this module in Node. It lives beside the component, not under
 * shared/company-previews, because the SEO content inventory would otherwise date every company guide by it, and it
 * takes the list's summary rather than importing `summariseQuestionList`: the inventory dates every guide by what the
 * component imports from there, so the component keeps that import.
 */
export type QuestionAudience = NonNullable<ReportedQuestion['audience']>;

/** The groups that follow the lead rows, in page order, with the heading and the line each one shows. */
export const QUESTION_GROUPS: readonly { readonly audience: QuestionAudience; readonly title: string; readonly intro: string }[] = [
  {
    audience: 'early-career',
    title: 'Early-career loops',
    intro: 'Asked in intern and new-grad interviews. They are not counted in the questions above.',
  },
  {
    audience: 'general',
    title: 'General engineering loops',
    intro: 'Asked in interviews for general software engineers rather than frontend roles. They are not counted in the questions above.',
  },
];

const AUDIENCE_ORDER: readonly (QuestionAudience | undefined)[] = [undefined, ...QUESTION_GROUPS.map((group) => group.audience)];

/**
 * The list's summary (from `summariseQuestionList`) with every row's group. A process without groups gets the summary
 * as it is; with groups, the totals, the locked count, the rounds and the newest account count the lead rows only.
 */
export function withQuestionGroups(summary: QuestionListSummary | null, process: CompanyInterviewProcess): QuestionListSummary | null {
  const questions = process.questions ?? [];
  if (!summary || !questions.some((question) => question.audience)) return summary;
  const rows = summary.rows.map((row, index) => {
    const audience = questions[index].audience;
    return audience ? { ...row, audience } : row;
  });
  const lead = rows.filter((row) => !row.audience);
  const stageOrder = [...new Set(process.variants.flatMap((variant) => variant.stages.map((stage) => stage.stage)))];
  const months = lead.map((row) => row.latest).filter((month): month is string => month !== null).sort();
  return {
    ...summary,
    total: lead.length,
    locked: lead.filter((row) => !row.open).length,
    rounds: stageOrder
      .map((stage) => ({ stage, count: lead.filter((row) => row.round === stage).length }))
      .filter((round) => round.count > 0),
    roundNotStated: lead.filter((row) => row.round === null).length,
    newestAccount: months.at(-1) ?? null,
    rows,
  };
}

/** "a", "a and b", "a, b and c". */
function listOf(parts: readonly string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * When a question was reported, for a guide that names no source: "Reported in 2025", "Reported in 2024 and 2026",
 * or "Reported once, in 2025" when one account is all that backs it. A question only a question bank lists keeps
 * the line every guide gives it, since a bank's date is the month it was read.
 */
export function reportedYearsLine(sources: readonly InterviewProcessSource[]): string {
  const accounts = sources.filter((source) => source.kind === 'report' && !source.reportForm);
  if (!accounts.length) return 'Listed in a candidate question bank';
  const years = [...new Set(accounts.map((source) => source.date.slice(0, 4)))].sort();
  return sources.length === 1 ? `Reported once, in ${years[0]}` : `Reported in ${listOf(years)}`;
}

/** What is wrong with a process's groups: lead rows first, then early-career, then general; the open first row leads. */
export function questionGroupProblems(process: CompanyInterviewProcess): string[] {
  const problems: string[] = [];
  const questions = process.questions ?? [];
  let reached = 0;
  questions.forEach((question, index) => {
    const at = `question ${question.id || index}`;
    const rank = AUDIENCE_ORDER.indexOf(question.audience);
    if (rank < 0) {
      problems.push(`${at}: the audience "${question.audience}" is not early-career or general`);
      return;
    }
    if (rank < reached) {
      problems.push(`${at}: ${question.audience ? `an ${question.audience} row` : 'a lead row'} follows a later group; lead rows come first, then early-career, then general`);
    }
    reached = Math.max(reached, rank);
  });
  if (questions[0]?.audience) problems.push(`question ${questions[0].id}: the first row is open to everyone, so it must come from an experienced frontend loop`);
  return problems;
}
