import type { AttemptRunRecord, StuckLevel, StuckState } from '../models/editor-assist.model';

const MINUTE_MS = 60_000;
const L2_MINUTES = 6;
const L3_MINUTES = 10;

function deriveLevel(consecutiveCount: number, ageMs: number): StuckLevel {
  if (consecutiveCount >= 6 || ageMs >= L3_MINUTES * MINUTE_MS) return 3;
  if (consecutiveCount >= 4 || ageMs >= L2_MINUTES * MINUTE_MS) return 2;
  if (consecutiveCount >= 2) return 1;
  return 0;
}

function isPassingRun(run: AttemptRunRecord): boolean {
  return run.totalCount > 0 && run.passCount >= run.totalCount;
}

export function deriveStuckState(
  runs: AttemptRunRecord[],
  options?: { dismissedUntilTs?: number; nowTs?: number },
): StuckState {
  if (!Array.isArray(runs) || runs.length === 0) {
    return {
      level: 0,
      signature: '',
      consecutiveCount: 0,
      firstSeenTs: 0,
      lastSeenTs: 0,
      dismissedUntilTs: options?.dismissedUntilTs,
    };
  }

  const ordered = [...runs].sort((a, b) => a.ts - b.ts);
  const latest = ordered[ordered.length - 1];
  const nowTs = Number.isFinite(options?.nowTs) ? Number(options?.nowTs) : Date.now();

  if (isPassingRun(latest)) {
    return {
      level: 0,
      signature: latest.signature,
      consecutiveCount: 0,
      firstSeenTs: latest.ts,
      lastSeenTs: latest.ts,
      dismissedUntilTs: options?.dismissedUntilTs,
    };
  }

  const signature = latest.signature;
  let consecutiveCount = 1;
  let firstSeenTs = latest.ts;
  let lastPassCount = latest.passCount;

  for (let i = ordered.length - 2; i >= 0; i -= 1) {
    const run = ordered[i];
    if (isPassingRun(run)) break;
    if (run.signature !== signature) break;

    // Stop counting once we detect measurable improvement.
    if (lastPassCount > run.passCount) break;

    consecutiveCount += 1;
    firstSeenTs = run.ts;
    lastPassCount = run.passCount;
  }

  const ageMs = Math.max(0, nowTs - firstSeenTs);
  const level = deriveLevel(consecutiveCount, ageMs);

  return {
    level,
    signature,
    consecutiveCount,
    firstSeenTs,
    lastSeenTs: latest.ts,
    dismissedUntilTs: options?.dismissedUntilTs,
  };
}

export function isStuckNudgeVisible(state: StuckState | null | undefined, nowTs = Date.now()): boolean {
  if (!state) return false;
  if (state.level < 1) return false;
  if (!state.dismissedUntilTs) return true;
  return nowTs >= state.dismissedUntilTs;
}

export function stuckLevelLabel(level: StuckLevel): string {
  if (level === 3) return 'Deep stuck';
  if (level === 2) return 'Likely stuck';
  if (level === 1) return 'Needs a nudge';
  return 'Stable';
}
