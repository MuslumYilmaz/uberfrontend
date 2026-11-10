import type { FrameworkTest } from '../models/question.model';

/** At most this many checks cover a task's core flow only (a smoke check), not its list of requirements. */
export const SMOKE_CHECK_MAX = 1;

/**
 * How much of a framework task its checks cover. 'full' lets a passing run mark the task solved; a 'smoke' check
 * proves the core flow works, and the visitor marks the task solved after comparing it with the requirements;
 * 'none' has no checks, so the task is marked complete by hand.
 */
export type FrameworkCheckCoverage = 'none' | 'smoke' | 'full';

type CoverageSource = { frameworkTests?: readonly FrameworkTest[] | null; checkCoverage?: 'smoke' | 'full' } | null | undefined;

/** A task can state its coverage (`checkCoverage`); otherwise one check or fewer is a smoke check. */
export function frameworkCheckCoverage(question: CoverageSource): FrameworkCheckCoverage {
  const count = Array.isArray(question?.frameworkTests) ? question!.frameworkTests!.length : 0;
  if (count === 0) return 'none';
  if (question?.checkCoverage === 'smoke' || question?.checkCoverage === 'full') return question.checkCoverage;
  return count <= SMOKE_CHECK_MAX ? 'smoke' : 'full';
}

/**
 * The CSS selectors a task's checks find elements by, in the order the checks first use them. The task page shows
 * them, so markup that works but names its elements differently is not failed for a contract no one stated.
 */
export function checkSelectors(tests: readonly FrameworkTest[] | null | undefined): string[] {
  const seen = new Set<string>();
  for (const test of tests ?? []) {
    for (const step of test?.steps ?? []) {
      const selector = String(step?.selector ?? '').trim();
      if (selector) seen.add(selector);
    }
  }
  return [...seen];
}
