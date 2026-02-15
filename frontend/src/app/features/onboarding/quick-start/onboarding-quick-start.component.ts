import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import {
  OnboardingFramework,
  OnboardingProfile,
  OnboardingService,
  OnboardingTargetRole,
  OnboardingTimeline,
  OnboardingTrigger,
} from '../../../core/services/onboarding.service';

type NextAction = {
  id: string;
  title: string;
  body: string;
  route: any[];
  queryParams?: Record<string, string>;
};

@Component({
  standalone: true,
  selector: 'app-onboarding-quick-start',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding-quick-start.component.html',
  styleUrls: ['./onboarding-quick-start.component.css'],
})
export class OnboardingQuickStartComponent implements OnInit {
  private readonly SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;

  view: 'form' | 'next' = 'form';
  source = 'direct';
  trigger: OnboardingTrigger = 'first_pass';

  form: OnboardingProfile = {
    timeline: '2_4_weeks',
    framework: 'react',
    targetRole: 'senior_frontend',
  };

  actions: NextAction[] = [];

  timelineOptions: Array<{ value: OnboardingTimeline; label: string }> = [
    { value: '1_week', label: '1 week sprint' },
    { value: '2_4_weeks', label: '2-4 weeks focused prep' },
    { value: '1_3_months', label: '1-3 months steady prep' },
    { value: 'ongoing', label: 'Ongoing interview readiness' },
  ];

  frameworkOptions: Array<{ value: OnboardingFramework; label: string }> = [
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'vue', label: 'Vue' },
    { value: 'javascript', label: 'JavaScript core' },
  ];

  roleOptions: Array<{ value: OnboardingTargetRole; label: string }> = [
    { value: 'senior_frontend', label: 'Senior Frontend' },
    { value: 'staff_frontend', label: 'Staff Frontend' },
    { value: 'fullstack_frontend', label: 'Full-stack (frontend-heavy)' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboarding: OnboardingService,
    private analytics: AnalyticsService,
  ) { }

  ngOnInit(): void {
    const src = String(this.route.snapshot.queryParamMap.get('src') || '').trim().toLowerCase();
    this.source = src && this.SOURCE_PATTERN.test(src) ? src : 'direct';

    const trigger = String(this.route.snapshot.queryParamMap.get('trigger') || '').trim().toLowerCase();
    if (trigger === 'save_prompt' || trigger === 'first_pass') {
      this.trigger = trigger;
    }

    const existing = this.onboarding.getProfile();
    if (existing) {
      this.form = { ...existing };
    } else {
      const tech = String(this.route.snapshot.queryParamMap.get('tech') || '').trim().toLowerCase();
      if (tech === 'react' || tech === 'angular' || tech === 'vue' || tech === 'javascript') {
        this.form.framework = tech;
      }
    }

    this.view = this.route.snapshot.queryParamMap.get('view') === 'next' ? 'next' : 'form';
    if (this.view === 'next') {
      this.actions = this.buildActions(this.form);
      return;
    }

    this.analytics.track('onboarding_started', {
      src: this.source,
      trigger: this.trigger,
      method: 'quick_start',
    });
  }

  submit(): void {
    this.onboarding.complete(this.form);
    this.actions = this.buildActions(this.form);

    this.analytics.track('onboarding_completed', {
      src: this.source,
      trigger: this.trigger,
      timeline: this.form.timeline,
      framework: this.form.framework,
      target_role: this.form.targetRole,
      method: 'quick_start',
    });

    this.view = 'next';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: 'next' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).catch(() => void 0);
  }

  editAnswers(): void {
    this.view = 'form';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).catch(() => void 0);
  }

  trackAction(action: NextAction): void {
    this.analytics.track('onboarding_next_action_clicked', {
      src: this.source,
      trigger: this.trigger,
      action_id: action.id,
      timeline: this.form.timeline,
      framework: this.form.framework,
      target_role: this.form.targetRole,
    });
  }

  private buildActions(profile: OnboardingProfile): NextAction[] {
    const challenge = this.frameworkChallenge(profile.framework);
    const timelineAction = this.timelineAction(profile.timeline);
    const roleAction = this.roleAction(profile.targetRole);

    return [challenge, timelineAction, roleAction];
  }

  private frameworkChallenge(framework: OnboardingFramework): NextAction {
    if (framework === 'angular') {
      return {
        id: 'framework_drill_angular',
        title: 'Run one Angular coding drill now',
        body: 'Start with a free Angular counter challenge to lock in implementation speed.',
        route: ['/angular', 'coding', 'angular-counter-starter'],
        queryParams: { src: 'onboarding_next_actions' },
      };
    }

    if (framework === 'vue') {
      return {
        id: 'framework_drill_vue',
        title: 'Run one Vue coding drill now',
        body: 'Use a quick Vue counter challenge to sharpen framework-specific fluency.',
        route: ['/vue', 'coding', 'vue-counter'],
        queryParams: { src: 'onboarding_next_actions' },
      };
    }

    if (framework === 'javascript') {
      return {
        id: 'framework_drill_javascript',
        title: 'Run one JavaScript coding drill now',
        body: 'Start with a concise JS logic challenge and run tests until fully passing.',
        route: ['/javascript', 'coding', 'js-is-object-empty'],
        queryParams: { src: 'onboarding_next_actions' },
      };
    }

    return {
      id: 'framework_drill_react',
      title: 'Run one React coding drill now',
      body: 'Start with a free React challenge and finish one clean pass under time pressure.',
      route: ['/react', 'coding', 'react-counter'],
      queryParams: { src: 'onboarding_next_actions' },
    };
  }

  private timelineAction(timeline: OnboardingTimeline): NextAction {
    if (timeline === '1_week') {
      return {
        id: 'timeline_1_week',
        title: 'Use crash-track previews first',
        body: 'For short deadlines, start with track previews and follow the highest-signal path today.',
        route: ['/tracks'],
        queryParams: { src: 'onboarding_timeline_1_week' },
      };
    }

    if (timeline === '2_4_weeks') {
      return {
        id: 'timeline_2_4_weeks',
        title: 'Commit to a focused 2-4 week track',
        body: 'Pick one track preview and sequence coding, trivia, and system design practice consistently.',
        route: ['/tracks'],
        queryParams: { src: 'onboarding_timeline_2_4_weeks' },
      };
    }

    if (timeline === '1_3_months') {
      return {
        id: 'timeline_1_3_months',
        title: 'Build foundations then company depth',
        body: 'Use longer runway to strengthen fundamentals before company-specific drills.',
        route: ['/companies'],
        queryParams: { src: 'onboarding_timeline_1_3_months' },
      };
    }

    return {
      id: 'timeline_ongoing',
      title: 'Set a sustainable weekly prep loop',
      body: 'Keep long-term readiness by rotating framework drills and system design reps each week.',
      route: ['/dashboard'],
      queryParams: { src: 'onboarding_timeline_ongoing' },
    };
  }

  private roleAction(role: OnboardingTargetRole): NextAction {
    if (role === 'staff_frontend') {
      return {
        id: 'role_staff_frontend',
        title: 'Prioritize architecture and tradeoff discussions',
        body: 'Drill front-end system design prompts and practice explicit reasoning under constraints.',
        route: ['/system-design'],
        queryParams: { src: 'onboarding_role_staff' },
      };
    }

    if (role === 'fullstack_frontend') {
      return {
        id: 'role_fullstack_frontend',
        title: 'Balance JS fundamentals with UI execution',
        body: 'Mix JavaScript trivia with UI coding to keep frontend signal strong in full-stack loops.',
        route: ['/javascript', 'trivia', 'js-event-loop'],
        queryParams: { src: 'onboarding_role_fullstack' },
      };
    }

    return {
      id: 'role_senior_frontend',
      title: 'Practice senior-level frontend decision making',
      body: 'Use company previews and system design prompts to sharpen practical tradeoff communication.',
      route: ['/companies'],
      queryParams: { src: 'onboarding_role_senior' },
    };
  }
}
