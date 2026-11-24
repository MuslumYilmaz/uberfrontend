/** The fields of a coding list row that the start paths read. */
type PathRow = {
  id: string;
  title?: string;
  tech?: string;
  access?: string;
  difficulty?: string;
  importance?: number;
  __kind?: string;
  __debug?: boolean;
};

const isWarmup = (title: string | undefined): boolean => /\bwarm[-\s]?up\b/i.test(title ?? '');
const isCodingTask = (row: PathRow): boolean => row.__kind === 'coding' && !row.__debug;
const byPriority = (a: PathRow, b: PathRow): number =>
  (b.importance ?? 0) - (a.importance ?? 0) || (a.title ?? '').localeCompare(b.title ?? '');

/**
 * "New to coding interviews?": five free Easy tasks, the JavaScript tasks with the highest practice priority with the
 * warm-ups between them. It opens on JavaScript, as most first coding screens do, and a small UI task follows.
 */
export function warmupPath<T extends PathRow>(rows: readonly T[]): T[] {
  const easyFree = rows.filter((row) => isCodingTask(row) && row.access !== 'premium' && row.difficulty === 'easy');
  const warmups = easyFree.filter((row) => isWarmup(row.title)).sort(byPriority);
  const javascript = easyFree.filter((row) => !isWarmup(row.title) && row.tech === 'javascript').sort(byPriority);
  const path: T[] = [];
  for (let i = 0; i < Math.max(javascript.length, warmups.length); i++) {
    if (javascript[i]) path.push(javascript[i]);
    if (warmups[i]) path.push(warmups[i]);
  }
  return path.slice(0, 5);
}

/**
 * "Interview coming up?": the JavaScript coding tasks from `startId` (Debounce, Essential 60 #1) on, in Essential 60
 * order, then the rest by practice priority. A visitor's Next steps over the Premium ones.
 */
export function interviewPath<T extends PathRow>(
  rows: readonly T[],
  ranks: ReadonlyMap<string, number>,
  startId: string,
): T[] {
  const rank = (row: T): number => ranks.get(`coding:${row.id}`) ?? Number.POSITIVE_INFINITY;
  const first = (row: T): number => (row.id === startId ? 0 : 1);
  return rows
    .filter((row) => isCodingTask(row) && row.tech === 'javascript')
    .sort((a, b) => first(a) - first(b) || rank(a) - rank(b) || byPriority(a, b));
}
