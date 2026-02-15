import { Injectable } from '@angular/core';

export type OnboardingTrigger = 'first_pass' | 'save_prompt';
export type OnboardingTimeline = '1_week' | '2_4_weeks' | '1_3_months' | 'ongoing';
export type OnboardingFramework = 'react' | 'angular' | 'vue' | 'javascript';
export type OnboardingTargetRole = 'senior_frontend' | 'staff_frontend' | 'fullstack_frontend';

export type OnboardingProfile = {
  timeline: OnboardingTimeline;
  framework: OnboardingFramework;
  targetRole: OnboardingTargetRole;
};

type OnboardingState = {
  completed: boolean;
  pendingTrigger: OnboardingTrigger | null;
  profile: OnboardingProfile | null;
  completedAt?: string;
  updatedAt?: string;
};

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  pendingTrigger: null,
  profile: null,
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private static readonly STORAGE_KEY = 'fa:onboarding:v1';

  getState(): OnboardingState {
    const raw = this.read();
    if (!raw) return { ...DEFAULT_STATE };

    try {
      const parsed = JSON.parse(raw) as Partial<OnboardingState>;
      return {
        completed: parsed.completed === true,
        pendingTrigger:
          parsed.pendingTrigger === 'first_pass' || parsed.pendingTrigger === 'save_prompt'
            ? parsed.pendingTrigger
            : null,
        profile: this.normalizeProfile(parsed.profile),
        completedAt: parsed.completedAt,
        updatedAt: parsed.updatedAt,
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  isCompleted(): boolean {
    return this.getState().completed;
  }

  getProfile(): OnboardingProfile | null {
    return this.getState().profile;
  }

  markPending(trigger: OnboardingTrigger): void {
    const state = this.getState();
    if (state.completed) return;
    state.pendingTrigger = trigger;
    state.updatedAt = new Date().toISOString();
    this.write(state);
  }

  consumePendingTrigger(): OnboardingTrigger | null {
    const state = this.getState();
    const pending = state.pendingTrigger;
    if (!pending) return null;
    state.pendingTrigger = null;
    state.updatedAt = new Date().toISOString();
    this.write(state);
    return pending;
  }

  complete(profile: OnboardingProfile): void {
    const next: OnboardingState = {
      completed: true,
      pendingTrigger: null,
      profile,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.write(next);
  }

  reset(): void {
    this.write({ ...DEFAULT_STATE, updatedAt: new Date().toISOString() });
  }

  private normalizeProfile(input: unknown): OnboardingProfile | null {
    const value = input as Partial<OnboardingProfile> | null;
    if (!value) return null;

    const timeline = value.timeline;
    const framework = value.framework;
    const targetRole = value.targetRole;

    const validTimeline =
      timeline === '1_week' || timeline === '2_4_weeks' || timeline === '1_3_months' || timeline === 'ongoing';
    const validFramework =
      framework === 'react' || framework === 'angular' || framework === 'vue' || framework === 'javascript';
    const validRole =
      targetRole === 'senior_frontend' || targetRole === 'staff_frontend' || targetRole === 'fullstack_frontend';

    if (!validTimeline || !validFramework || !validRole) return null;

    return {
      timeline,
      framework,
      targetRole,
    };
  }

  private read(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(OnboardingService.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private write(state: OnboardingState): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(OnboardingService.STORAGE_KEY, JSON.stringify(state));
    } catch { }
  }
}
