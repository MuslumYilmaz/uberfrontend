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
  if (role === 'staff_frontend') return 'Staff Frontend';
  if (role === 'fullstack_frontend') return 'Full-stack (frontend-heavy)';
  if (role === 'senior_frontend') return 'Senior Frontend';
  return 'frontend role';
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

