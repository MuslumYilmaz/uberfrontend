import { Injectable } from '@angular/core';

export type LifecycleMilestoneId = 'solved_3' | 'solved_10' | 'solved_20';

type LifecycleState = {
  seen: LifecycleMilestoneId[];
  dismissed: LifecycleMilestoneId[];
  accepted: LifecycleMilestoneId[];
  updatedAt?: string;
};

const DEFAULT_STATE: LifecycleState = {
  seen: [],
  dismissed: [],
  accepted: [],
};

const MILESTONES: Array<{ id: LifecycleMilestoneId; threshold: number }> = [
  { id: 'solved_3', threshold: 3 },
  { id: 'solved_10', threshold: 10 },
  { id: 'solved_20', threshold: 20 },
];

@Injectable({ providedIn: 'root' })
export class LifecyclePromptService {
  private static readonly STORAGE_KEY = 'fa:lifecycle:milestones:v1';

  nextMilestone(solvedTotal: number): LifecycleMilestoneId | null {
    if (!Number.isFinite(solvedTotal) || solvedTotal <= 0) return null;

    const state = this.readState();
    const seen = new Set(state.seen);

    for (const milestone of MILESTONES) {
      if (solvedTotal >= milestone.threshold && !seen.has(milestone.id)) {
        return milestone.id;
      }
    }

    return null;
  }

  thresholdFor(milestone: LifecycleMilestoneId): number {
    const found = MILESTONES.find((item) => item.id === milestone);
    return found?.threshold ?? 0;
  }

  markShown(milestone: LifecycleMilestoneId): void {
    const state = this.readState();
    if (!state.seen.includes(milestone)) state.seen.push(milestone);
    state.updatedAt = new Date().toISOString();
    this.writeState(state);
  }

  markDismissed(milestone: LifecycleMilestoneId): void {
    const state = this.readState();
    if (!state.dismissed.includes(milestone)) state.dismissed.push(milestone);
    state.updatedAt = new Date().toISOString();
    this.writeState(state);
  }

  markAccepted(milestone: LifecycleMilestoneId): void {
    const state = this.readState();
    if (!state.accepted.includes(milestone)) state.accepted.push(milestone);
    state.updatedAt = new Date().toISOString();
    this.writeState(state);
  }

  private readState(): LifecycleState {
    if (typeof window === 'undefined') return { ...DEFAULT_STATE };
    try {
      const raw = window.localStorage.getItem(LifecyclePromptService.STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw) as Partial<LifecycleState>;
      return {
        seen: this.validMilestones(parsed.seen),
        dismissed: this.validMilestones(parsed.dismissed),
        accepted: this.validMilestones(parsed.accepted),
        updatedAt: parsed.updatedAt,
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private writeState(state: LifecycleState): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LifecyclePromptService.STORAGE_KEY, JSON.stringify(state));
    } catch { }
  }

  private validMilestones(input: unknown): LifecycleMilestoneId[] {
    if (!Array.isArray(input)) return [];
    return input.filter((value): value is LifecycleMilestoneId =>
      value === 'solved_3' || value === 'solved_10' || value === 'solved_20',
    );
  }
}

