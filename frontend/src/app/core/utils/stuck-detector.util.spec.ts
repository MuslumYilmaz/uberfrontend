import type { AttemptRunRecord } from '../models/editor-assist.model';
import { deriveStuckState } from './stuck-detector.util';

function makeRun(input: Partial<AttemptRunRecord>): AttemptRunRecord {
  return {
    questionId: 'q',
    lang: 'js',
    ts: Date.now(),
    passCount: 0,
    totalCount: 3,
    firstFailName: 't1',
    errorLine: 'Expected undefined to be 3',
    signature: 't1|Expected undefined to be 3|3',
    codeHash: 'abc',
    codeChanged: true,
    interviewMode: false,
    ...input,
  };
}

describe('stuck-detector.util', () => {
  it('reaches level 1 after two stale runs', () => {
    const now = Date.now();
    const runs: AttemptRunRecord[] = [
      makeRun({ ts: now - 30_000, passCount: 0 }),
      makeRun({ ts: now - 10_000, passCount: 0 }),
    ];

    const state = deriveStuckState(runs, { nowTs: now });
    expect(state.level).toBe(1);
    expect(state.consecutiveCount).toBe(2);
  });

  it('reaches level 2 and 3 on higher repetition', () => {
    const now = Date.now();
    const runs: AttemptRunRecord[] = [
      makeRun({ ts: now - 120_000 }),
      makeRun({ ts: now - 100_000 }),
      makeRun({ ts: now - 80_000 }),
      makeRun({ ts: now - 60_000 }),
      makeRun({ ts: now - 40_000 }),
      makeRun({ ts: now - 20_000 }),
    ];
    const state = deriveStuckState(runs, { nowTs: now });
    expect(state.level).toBe(3);
    expect(state.consecutiveCount).toBe(6);
  });

  it('resets on passing run', () => {
    const now = Date.now();
    const runs: AttemptRunRecord[] = [
      makeRun({ ts: now - 20_000, passCount: 0, totalCount: 2 }),
      makeRun({ ts: now - 10_000, passCount: 2, totalCount: 2 }),
    ];
    const state = deriveStuckState(runs, { nowTs: now });
    expect(state.level).toBe(0);
    expect(state.consecutiveCount).toBe(0);
  });
});
