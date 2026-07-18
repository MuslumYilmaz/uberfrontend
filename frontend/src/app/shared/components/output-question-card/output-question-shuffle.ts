export type OutputQuestionRandomSource = () => number;

/**
 * Returns a shuffled copy without mutating the source collection.
 *
 * The injectable random source keeps the component deterministic in tests while
 * production callers use Math.random. Out-of-range values are clamped so a
 * custom source can never address an item outside the array.
 */
export function shuffleOutputOptions<T>(
  source: readonly T[],
  random: OutputQuestionRandomSource = Math.random,
): T[] {
  const shuffled = [...source];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = random();
    const safeSample = Number.isFinite(sample)
      ? Math.min(Math.max(sample, 0), 1 - Number.EPSILON)
      : 0;
    const swapIndex = Math.floor(safeSample * (index + 1));

    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
