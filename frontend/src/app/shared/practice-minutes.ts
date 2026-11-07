/**
 * How long a task takes: the one number the plan, the task page and timed practice share. An author's estimate wins;
 * otherwise the difficulty decides, in the steps timed practice offers. The plan generator loads this module too
 * (scripts/gen-company-plan-data.mjs), so keep it free of Angular.
 */
export const PRACTICE_MINUTES_BY_DIFFICULTY: Readonly<Record<'easy' | 'intermediate' | 'hard', number>> = {
  easy: 15,
  intermediate: 30,
  hard: 45,
};

export const TIMED_PRACTICE_STEPS = [15, 30, 45] as const;
export type TimedPracticeStep = (typeof TIMED_PRACTICE_STEPS)[number];

export function practiceMinutes(task: { readonly difficulty?: string; readonly estimatedMinutes?: number } | null | undefined): number {
  const authored = Number(task?.estimatedMinutes);
  if (Number.isFinite(authored) && authored > 0) return Math.round(authored);
  return PRACTICE_MINUTES_BY_DIFFICULTY[task?.difficulty as keyof typeof PRACTICE_MINUTES_BY_DIFFICULTY]
    ?? PRACTICE_MINUTES_BY_DIFFICULTY.intermediate;
}

/** The timed practice step nearest a task's minutes, so a 45-minute task starts with 45 minutes on the clock. */
export function timedPracticeStep(minutes: number): TimedPracticeStep {
  return TIMED_PRACTICE_STEPS.reduce<TimedPracticeStep>(
    (best, step) => (Math.abs(step - minutes) < Math.abs(best - minutes) ? step : best),
    TIMED_PRACTICE_STEPS[0],
  );
}
