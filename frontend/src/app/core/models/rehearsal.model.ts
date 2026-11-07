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

export type RehearsalDefinition = {
  readonly id: string;
  readonly company: string;
  /** The rehearsal's name, e.g. "Meta coding round". */
  readonly title: string;
  /** The round in the company's process table. */
  readonly round: string;
  readonly summary: string;
  readonly minutes: number;
  /** Sequential: each task opens when the person moves on, as an interviewer hands out the next problem. */
  readonly order: RehearsalOrder;
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
};

export type RehearsalPhase = 'active' | 'review';
