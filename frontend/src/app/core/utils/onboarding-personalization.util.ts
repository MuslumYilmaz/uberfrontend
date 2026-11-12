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

export type FreeDrill = { id: string; label: string; route: any[] };

/** Free tasks to start a framework with, easiest first. */
const FREE_DRILLS: Record<OnboardingFramework, readonly FreeDrill[]> = {
  javascript: [
    { id: 'js-is-object-empty', label: 'Is Object Empty', route: ['/javascript', 'coding', 'js-is-object-empty'] },
    { id: 'js-debounce', label: 'Debounce', route: ['/javascript', 'coding', 'js-debounce'] },
    { id: 'js-once', label: 'Once', route: ['/javascript', 'coding', 'js-once'] },
  ],
  react: [
    { id: 'react-counter', label: 'Counter', route: ['/react', 'coding', 'react-counter'] },
    { id: 'react-todo-list', label: 'Todo List', route: ['/react', 'coding', 'react-todo-list'] },
    { id: 'react-fetch-list-states', label: 'Fetch List States', route: ['/react', 'coding', 'react-fetch-list-states'] },
  ],
  angular: [
    { id: 'angular-counter-starter', label: 'Counter', route: ['/angular', 'coding', 'angular-counter-starter'] },
    { id: 'angular-todo-list-starter', label: 'Todo List', route: ['/angular', 'coding', 'angular-todo-list-starter'] },
    {
      id: 'angular-autocomplete-search-starter',
      label: 'Autocomplete Search',
      route: ['/angular', 'coding', 'angular-autocomplete-search-starter'],
    },
  ],
  vue: [
    { id: 'vue-counter', label: 'Counter', route: ['/vue', 'coding', 'vue-counter'] },
    { id: 'vue-todo-list', label: 'Todo List', route: ['/vue', 'coding', 'vue-todo-list'] },
    { id: 'vue-autocomplete-search', label: 'Autocomplete Search', route: ['/vue', 'coding', 'vue-autocomplete-search'] },
  ],
};

/** The first free drill for a framework that the visitor has not just passed or solved before; null once all are done. */
export function nextFreeDrill(framework: OnboardingFramework, done: ReadonlySet<string>): FreeDrill | null {
  return FREE_DRILLS[framework].find((drill) => !done.has(drill.id)) ?? null;
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

