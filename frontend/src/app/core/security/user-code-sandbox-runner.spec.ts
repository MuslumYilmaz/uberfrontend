import {
  notRunMessage,
  runQueue,
  timedOutMessage,
  type QueuedResult,
  type QueuedTest,
  type TestOutcome,
} from './user-code-sandbox-runner';

describe('runQueue', () => {
  const timers = {
    setTimer: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimer: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
  const finishWith = (perTestMs: number) => (test: QueuedTest, outcome: TestOutcome): QueuedResult => {
    if (outcome.timedOut) return { name: test.name, passed: false, error: timedOutMessage(perTestMs), order: test.idx };
    if (outcome.error !== undefined) {
      return { name: test.name, passed: false, error: String((outcome.error as Error).message), order: test.idx };
    }
    return { name: test.name, passed: true, order: test.idx };
  };
  const hangs = () => new Promise<void>(() => undefined);

  it('fails a test that never settles by name, and still runs the tests after it', async () => {
    const results = await runQueue([
      { idx: 0, name: 'resolves', fn: async () => undefined },
      { idx: 1, name: 'never settles', fn: hangs },
      { idx: 2, name: 'throws', fn: () => { throw new Error('boom'); } },
      { idx: 3, name: 'returns', fn: () => undefined },
    ], { perTestMs: 30, budgetMs: 10_000, now: () => performance.now(), ...timers, finish: finishWith(30) });

    expect(results.map((result) => [result.name, result.passed])).toEqual([
      ['resolves', true],
      ['never settles', false],
      ['throws', false],
      ['returns', true],
    ]);
    expect(results[1].error).toBe(timedOutMessage(30));
    expect(results[2].error).toBe('boom');
  });

  it('lists the tests that have not started once the run has used up its budget', async () => {
    // The clock moves only when a test times out, so the budget check cannot depend on timer jitter.
    let elapsed = 0;
    const finish = finishWith(30);
    const started: string[] = [];
    const reported: string[] = [];

    const results = await runQueue([
      { idx: 0, name: 'a', fn: hangs },
      { idx: 1, name: 'b', fn: hangs },
      { idx: 2, name: 'c', fn: hangs },
    ], {
      perTestMs: 30,
      budgetMs: 45,
      now: () => elapsed,
      ...timers,
      onStart: (test) => started.push(test.name),
      finish: (test, outcome) => {
        elapsed += 30;
        return finish(test, outcome);
      },
      onResult: (result) => reported.push(result.name),
    });

    expect(started).toEqual(['a', 'b']);
    expect(reported).toEqual(['a', 'b', 'c']);
    expect(results.map((result) => result.error)).toEqual([timedOutMessage(30), timedOutMessage(30), notRunMessage(45)]);
  });
});
