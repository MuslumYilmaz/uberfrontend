/** Where the viewer stands on one task: solved on the account, started in this browser, or not started. */
export type PracticeStatus = 'solved' | 'in-progress' | 'todo';

/** The coding list's progress view; "unsolved" is the list without what the account has solved. */
export type ProgressFilter = 'all' | 'unsolved' | 'in-progress' | 'solved';

export const PROGRESS_FILTERS: readonly ProgressFilter[] = ['all', 'unsolved', 'in-progress', 'solved'];

/** A task's most recent run, as AttemptInsightsService records it. */
export type LastRun = { passCount: number; totalCount: number; ts: number };

export function isProgressFilter(value: unknown): value is ProgressFilter {
  return typeof value === 'string' && (PROGRESS_FILTERS as readonly string[]).includes(value);
}

/** Solved wins over a draft: a solved task's draft is a finished one. */
export function practiceStatus(
  id: string,
  solved: ReadonlySet<string>,
  editedAt: ReadonlyMap<string, number>,
): PracticeStatus {
  if (solved.has(id)) return 'solved';
  return editedAt.has(id) ? 'in-progress' : 'todo';
}

export function matchesProgressFilter(status: PracticeStatus, filter: ProgressFilter): boolean {
  if (filter === 'unsolved') return status !== 'solved';
  if (filter === 'in-progress') return status === 'in-progress';
  if (filter === 'solved') return status === 'solved';
  return true;
}

/**
 * What "Continue" opens: the most recently edited draft that is not solved and that the viewer can open (a draft
 * of a Premium task kept after Premium ended would open on the lock).
 */
export function pickContinueTarget<T extends { id: string }>(
  rows: readonly T[],
  solved: ReadonlySet<string>,
  editedAt: ReadonlyMap<string, number>,
  canOpen: (row: T) => boolean,
): { row: T; editedAt: number } | null {
  let best: { row: T; editedAt: number } | null = null;
  for (const row of rows) {
    const at = editedAt.get(row.id);
    if (at === undefined || solved.has(row.id) || !canOpen(row)) continue;
    if (!best || at > best.editedAt) best = { row, editedAt: at };
  }
  return best;
}

/** "2 of 4 passed" after a run; null before the first one. */
export function lastRunLabel(run: LastRun | null | undefined): string | null {
  if (!run || run.totalCount <= 0) return null;
  return `${run.passCount} of ${run.totalCount} passed`;
}

const RELATIVE_UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['minute', 60],
  ['hour', 3_600],
  ['day', 86_400],
  ['week', 604_800],
  ['month', 2_629_800],
  ['year', 31_557_600],
];

/** "5 minutes ago", "yesterday", "last week"; "just now" under a minute. */
export function editedAgoLabel(editedAt: number, now: number): string {
  const seconds = Math.max(0, (now - editedAt) / 1000);
  if (seconds < 60) return 'just now';
  let [unit, size] = RELATIVE_UNITS[0];
  for (const [candidate, candidateSize] of RELATIVE_UNITS) {
    if (seconds >= candidateSize) [unit, size] = [candidate, candidateSize];
  }
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-Math.floor(seconds / size), unit);
}
