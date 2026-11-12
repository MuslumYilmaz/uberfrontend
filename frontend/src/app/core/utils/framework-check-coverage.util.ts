import type { FrameworkTest, FrameworkTestLocator } from '../models/question.model';

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
 * What a task's checks find elements by, CSS selectors and `by` locators alike, in the order the checks first use
 * them. The task page shows them, so markup that works but names its elements differently is not failed for a
 * contract no one stated.
 */
export function checkSelectors(tests: readonly FrameworkTest[] | null | undefined): string[] {
  const seen = new Set<string>();
  for (const test of tests ?? []) {
    for (const step of test?.steps ?? []) {
      for (const part of [step, step?.among, step?.than]) {
        const target = part?.by ? describeLocator(part.by) : String(part?.selector ?? '').trim();
        if (target) seen.add(target);
      }
    }
  }
  return [...seen];
}

/**
 * A locator as the task page names it: `button "Add"`, `checkbox`, `textbox labelled "City"`, `text "No results"`,
 * `button "Reply" near text "First comment"`.
 */
export function describeLocator(by: FrameworkTestLocator): string {
  const own = ownLocator(by);
  return own && by.near ? `${own} near ${describeLocator(by.near)}` : own;
}

function ownLocator(by: FrameworkTestLocator): string {
  if (by.text !== undefined) return `text "${by.text}"`;
  if (by.label !== undefined) return `${by.role || 'control'} labelled "${by.label}"`;
  if (!by.role) return by.name === undefined ? '' : `element "${by.name}"`;
  return by.name === undefined ? by.role : `${by.role} "${by.name}"`;
}
