/**
 * Timed rehearsal: one interview round as public accounts describe it, rehearsed as several tasks on one clock.
 * Each task keeps its own page; while the rehearsal runs, a panel on those pages holds the clock and the task list,
 * and the editor works on a draft of its own. When the time is up the editors turn read-only for the review.
 * All rehearsals live in one list (cdn/questions/rehearsals/rehearsals.v1.json); the tasks themselves are untouched.
 */
export type RehearsalOrder = 'sequential' | 'free';

export type RehearsalItem = {
  /** The task page, e.g. /javascript/coding/js-debounce. */
  readonly path: string;
  readonly questionId: string;
  readonly title: string;
};

/** A question asked for a one-line answer, as some screens open before their problems. */
export type RehearsalShortAnswer = {
  readonly question: string;
  /** A sample answer, shown in the review next to the person's own. */
  readonly answer: string;
  /** The concept page with the full answer, e.g. /javascript/trivia/js-closures. */
  readonly path: string;
};

export type RehearsalShortAnswers = {
  /** About how long the reports give these questions; the rehearsal's one clock keeps running through them. */
  readonly minutes: number;
  readonly questions: readonly RehearsalShortAnswer[];
};

export type RehearsalDefinition = {
  readonly id: string;
  readonly company: string;
  /** The rehearsal's name, e.g. "Meta coding round". */
  readonly title: string;
  /** The id of the round in the company plan (company-plan-rounds.ts) that the plan shows this rehearsal on. */
  readonly round: string;
  readonly summary: string;
  readonly minutes: number;
  /** Sequential: each task opens when the person moves on, as an interviewer hands out the next problem. */
  readonly order: RehearsalOrder;
  /** Questions answered before the problems open, such as the ten minutes that open a Karat screen. */
  readonly shortAnswers?: RehearsalShortAnswers;
  readonly items: readonly RehearsalItem[];
};

/** The best test run of a task during the rehearsal. */
export type RehearsalItemResult = {
  readonly passed: number;
  readonly total: number;
  readonly runs: number;
};

export type RehearsalEndReason = 'expired' | 'ended';

export type RehearsalSession = {
  readonly version: 1;
  /** Unique per attempt, so each attempt starts from the starter code. */
  readonly key: string;
  readonly definition: RehearsalDefinition;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly endReason: RehearsalEndReason | null;
  /** The furthest task opened; later tasks of a sequential rehearsal stay hidden. */
  readonly reached: number;
  readonly results: Readonly<Record<string, RehearsalItemResult>>;
  /** One answer per short-answer question, empty when not answered. */
  readonly answers: readonly string[];
  /** The short-answer question on screen; the problems open once it passes the last one. */
  readonly answering: number;
};

export type RehearsalPhase = 'active' | 'review';
