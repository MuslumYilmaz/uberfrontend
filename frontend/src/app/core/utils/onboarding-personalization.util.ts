import type { Difficulty } from '../models/question.model';
import {
  OnboardingFramework,
  OnboardingProfile,
  OnboardingTargetRole,
  OnboardingTimeline,
} from '../services/onboarding.service';

type ChallengeTarget = {
  framework: OnboardingFramework;
  label: string;
  route: any[];
};

export function frameworkFromTech(tech: string | null | undefined): OnboardingFramework {
  const value = String(tech || '').trim().toLowerCase();
  if (value === 'angular') return 'angular';
  if (value === 'vue') return 'vue';
  if (value === 'react') return 'react';
  return 'javascript';
}

export function preferredFramework(profile: OnboardingProfile | null, fallbackTech?: string): OnboardingFramework {
  if (profile?.framework) return profile.framework;
  return frameworkFromTech(fallbackTech);
}

export function frameworkLabel(framework: OnboardingFramework): string {
  if (framework === 'angular') return 'Angular';
  if (framework === 'vue') return 'Vue';
  if (framework === 'react') return 'React';
  return 'JavaScript';
}

export function timelineLabel(timeline: OnboardingTimeline | null | undefined): string {
  if (timeline === '1_week') return '1 week sprint';
  if (timeline === '2_4_weeks') return '2-4 week sprint';
  if (timeline === '1_3_months') return '1-3 month plan';
  if (timeline === 'ongoing') return 'ongoing prep';
  return 'active prep';
}

export function roleLabel(role: OnboardingTargetRole | null | undefined): string {
  if (role === 'junior_frontend') return 'Junior Frontend';
  if (role === 'mid_frontend') return 'Mid-level Frontend';
  if (role === 'staff_frontend') return 'Staff Frontend';
  if (role === 'fullstack_frontend') return 'Full-stack (frontend-heavy)';
  if (role === 'senior_frontend') return 'Senior Frontend';
  return 'frontend role';
}

export type FreeDrill = { id: string; label: string; route: any[]; difficulty: Difficulty };

/** Free tasks to start a framework with, easiest first; `difficulty` is the task's difficulty in the catalog. */
const FREE_DRILLS: Record<OnboardingFramework, readonly FreeDrill[]> = {
  javascript: [
    {
      id: 'js-is-object-empty',
      label: 'Is Object Empty',
      route: ['/javascript', 'coding', 'js-is-object-empty'],
      difficulty: 'easy',
    },
    {
      id: 'js-debounce',
      label: 'Debounce',
      route: ['/javascript', 'coding', 'js-debounce'],
      difficulty: 'intermediate',
    },
    { id: 'js-once', label: 'Once', route: ['/javascript', 'coding', 'js-once'], difficulty: 'easy' },
  ],
  react: [
    { id: 'react-counter', label: 'Counter', route: ['/react', 'coding', 'react-counter'], difficulty: 'easy' },
    { id: 'react-todo-list', label: 'Todo List', route: ['/react', 'coding', 'react-todo-list'], difficulty: 'easy' },
    {
      id: 'react-fetch-list-states',
      label: 'Fetch List States',
      route: ['/react', 'coding', 'react-fetch-list-states'],
      difficulty: 'intermediate',
    },
  ],
  angular: [
    {
      id: 'angular-counter-starter',
      label: 'Counter',
      route: ['/angular', 'coding', 'angular-counter-starter'],
      difficulty: 'easy',
    },
    {
      id: 'angular-todo-list-starter',
      label: 'Todo List',
      route: ['/angular', 'coding', 'angular-todo-list-starter'],
      difficulty: 'easy',
    },
    {
      id: 'angular-autocomplete-search-starter',
      label: 'Autocomplete Search',
      route: ['/angular', 'coding', 'angular-autocomplete-search-starter'],
      difficulty: 'intermediate',
    },
  ],
  vue: [
    { id: 'vue-counter', label: 'Counter', route: ['/vue', 'coding', 'vue-counter'], difficulty: 'easy' },
    { id: 'vue-todo-list', label: 'Todo List', route: ['/vue', 'coding', 'vue-todo-list'], difficulty: 'easy' },
    {
      id: 'vue-autocomplete-search',
      label: 'Autocomplete Search',
      route: ['/vue', 'coding', 'vue-autocomplete-search'],
      difficulty: 'intermediate',
    },
  ],
};

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, intermediate: 1, hard: 2 };

/**
 * The first free drill for a framework that the visitor has not just passed or solved before, and no easier than the
 * task just passed (an Easy Counter after an Intermediate task reads as a step back); null once none is left.
 */
export function nextFreeDrill(
  framework: OnboardingFramework,
  done: ReadonlySet<string>,
  atLeast?: Difficulty | null,
): FreeDrill | null {
  const floor = atLeast ? DIFFICULTY_RANK[atLeast] ?? 0 : 0;
  return FREE_DRILLS[framework]
    .find((drill) => !done.has(drill.id) && DIFFICULTY_RANK[drill.difficulty] >= floor) ?? null;
}

export function freeChallengeForFramework(framework: OnboardingFramework): ChallengeTarget {
  if (framework === 'angular') {
    return {
      framework,
      label: 'Try free Angular challenge',
      route: ['/angular', 'coding', 'angular-counter-starter'],
    };
  }

  if (framework === 'vue') {
    return {
      framework,
      label: 'Try free Vue challenge',
      route: ['/vue', 'coding', 'vue-counter'],
    };
  }

  if (framework === 'javascript') {
    return {
      framework,
      label: 'Try free JavaScript challenge',
      route: ['/javascript', 'coding', 'js-is-object-empty'],
    };
  }

  return {
    framework: 'react',
    label: 'Try free React challenge',
    route: ['/react', 'coding', 'react-counter'],
  };
}

