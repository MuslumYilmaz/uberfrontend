// The order and timing rules of a sandbox test run, kept apart from the worker so they can be tested on the page.

export type QueuedTest = { idx: number; name: string; fn: () => unknown };
export type QueuedResult = { name: string; passed: boolean; error?: string; order: number };
/** How a test settled: it returned or resolved, it threw or rejected (`error`), or it never settled in time. */
export type TestOutcome = { error?: unknown; timedOut?: boolean };

export type RunQueueOptions = {
  /** A test that has not settled by then fails as timed out, and the run moves on to the next one. */
  perTestMs: number;
  /** Once this much time has passed, tests that have not started are reported as not run. */
  budgetMs: number;
  /** The worker's own clock and timers, taken before any user code could replace them. */
  now: () => number;
  setTimer: (callback: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  onStart?: (test: QueuedTest) => void;
  /** Turns an outcome into a result; the worker adds its asynchronous-error bookkeeping here. */
  finish: (test: QueuedTest, outcome: TestOutcome) => QueuedResult;
  onResult?: (result: QueuedResult) => void;
};

export function timedOutMessage(ms: number): string {
  return `Timed out after ${ms} ms: the test never finished. Look for a promise that never settles or a callback that never runs.`;
}

export function notRunMessage(budgetMs: number): string {
  return `Not run: the run used up its ${budgetMs} ms before this test started.`;
}

/** Runs one test and settles when it returns, resolves, throws or rejects, or when `ms` pass first. */
export function settleWithin(
  fn: () => unknown,
  ms: number,
  setTimer: RunQueueOptions['setTimer'],
  clearTimer: RunQueueOptions['clearTimer'],
): Promise<TestOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    let handle: unknown = null;
    const settle = (outcome: TestOutcome) => {
      if (settled) return;
      settled = true;
      if (handle !== null) clearTimer(handle);
      resolve(outcome);
    };
    handle = setTimer(() => settle({ timedOut: true }), ms);
    try {
      const maybe = fn() as { then?: unknown } | undefined;
      if (maybe && typeof maybe.then === 'function') {
        (maybe as PromiseLike<unknown>).then(() => settle({}), (error: unknown) => settle({ error }));
      } else {
        settle({});
      }
    } catch (error) {
      settle({ error });
    }
  });
}

/**
 * Runs the tests one after another, in the order they were defined. A test that hangs costs its own time limit,
 * not the results of the others; past the run's budget, the remaining tests are listed as not run.
 */
export async function runQueue(queue: readonly QueuedTest[], options: RunQueueOptions): Promise<QueuedResult[]> {
  const startedAt = options.now();
  const results: QueuedResult[] = [];
  for (const test of queue) {
    let result: QueuedResult;
    if (options.now() - startedAt >= options.budgetMs) {
      result = { name: test.name, passed: false, error: notRunMessage(options.budgetMs), order: test.idx };
    } else {
      options.onStart?.(test);
      const outcome = await settleWithin(test.fn, options.perTestMs, options.setTimer, options.clearTimer);
      result = options.finish(test, outcome);
    }
    results.push(result);
    options.onResult?.(result);
  }
  return results;
}
