import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { DashboardGamificationResponse } from '../../core/models/gamification.model';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../shared/ui/card/fa-card.component';
import { FaDialogComponent } from '../../shared/ui/dialog/fa-dialog.component';

type DailyChallengeTech = 'auto' | 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';
type DashboardMode = 'guest' | 'novice' | 'established';

type HeroCta = {
  actionId: string;
  label: string;
  route: string | any[];
  queryParams?: Params;
};

type DashboardLinkDestination =
  | 'interview_blueprint'
  | 'essential_60'
  | 'question_library'
  | 'sprints'
  | 'companies'
  | 'tech_lanes'
  | 'framework_prep'
  | 'system_design'
  | 'coding_questions'
  | 'concept_questions'
  | 'debug_scenarios'
  | 'architecture_tradeoffs'
  | 'behavioral'
  | 'focus_areas';

type DashboardLink = {
  title: string;
  subtitle?: string;
  route: any[];
  queryParams?: Params;
  destination: DashboardLinkDestination;
  fitHint?: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent, FaButtonComponent, FaCardComponent, FaDialogComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly progress = inject(UserProgressService);
  private readonly activity = inject(ActivityService);
  private readonly gamification = inject(GamificationService);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  private dashboardTracked = false;
  private lastDailyChallengeTrackedKey: string | null = null;

  readonly auth = this.authService;
  readonly continueCta = {
    label: 'Open Essential 60',
    route: ['/interview-questions', 'essential'] as any[],
  };
  readonly guestFeaturedRoute: DashboardLink = {
    title: 'FrontendAtlas Essential 60',
    subtitle: 'Start with 60 curated frontend interview questions across JavaScript, UI coding, system design, and concepts.',
    route: ['/interview-questions', 'essential'],
    destination: 'essential_60',
    fitHint: 'Recommended start',
  };
  readonly guestSecondaryRoutes: DashboardLink[] = [
    {
      title: 'Frontend interview preparation guide',
      subtitle: 'Read first if you want the interview flow, scoring signals, and prep sequence before practicing.',
      route: ['/guides', 'interview-blueprint', 'intro'],
      destination: 'interview_blueprint',
      fitHint: 'Read first if unsure',
    },
    {
      title: 'Study Plans / Framework Prep',
      subtitle: 'Use when you want a weekly sequence instead of choosing question by question.',
      route: ['/tracks'],
      destination: 'sprints',
      fitHint: 'Structured path',
    },
    {
      title: 'Final-round coverage',
      subtitle: 'Add after core practice when system design, behavioral, or company-style follow-ups matter.',
      route: ['/system-design'],
      destination: 'system_design',
      fitHint: 'Final rounds',
    },
  ];
  readonly guestPracticeModes: DashboardLink[] = [
    {
      title: 'Coding questions',
      subtitle: 'Jump straight into implementation drills.',
      route: ['/coding'],
      queryParams: { kind: 'coding', reset: 1 },
      destination: 'coding_questions',
      fitHint: 'Implementation drill',
    },
    {
      title: 'Concept questions',
      subtitle: 'Practice concise interview explanations without opening the full hub first.',
      route: ['/coding'],
      queryParams: { kind: 'trivia', reset: 1 },
      destination: 'concept_questions',
      fitHint: 'Verbal practice',
    },
    {
      title: 'Debug scenarios',
      subtitle: 'Diagnose broken UI and failing tests under pressure.',
      route: ['/incidents'],
      destination: 'debug_scenarios',
      fitHint: 'Debug signal',
    },
    {
      title: 'Architecture tradeoffs',
      subtitle: 'Compare solutions when there is no single perfect answer.',
      route: ['/tradeoffs'],
      destination: 'architecture_tradeoffs',
      fitHint: 'Senior signal',
    },
  ];
  readonly guestRelatedPrepLinks: DashboardLink[] = [
    {
      title: 'Behavioral Prep',
      route: ['/guides/behavioral'],
      destination: 'behavioral',
    },
    {
      title: 'Company Prep',
      route: ['/companies'],
      destination: 'companies',
    },
    {
      title: 'Focus Areas',
      route: ['/focus-areas'],
      destination: 'focus_areas',
    },
  ];
  readonly libraryLinks: DashboardLink[] = [
    {
      title: 'FrontendAtlas Essential 60',
      subtitle: 'Open the curated shortlist first when you want the strongest default interview prep route.',
      route: ['/interview-questions', 'essential'],
      destination: 'essential_60',
      fitHint: 'Start here',
    },
    {
      title: 'Question Library',
      subtitle: 'Open the full Question Library when you want broader coverage, more filters, and every format.',
      route: ['/coding'],
      queryParams: { reset: 1 },
      destination: 'question_library',
      fitHint: 'Full library',
    },
    {
      title: 'Study Plans',
      subtitle: 'Jump into a structured prep path when you want momentum.',
      route: ['/tracks'],
      destination: 'sprints',
      fitHint: 'Structured path',
    },
    {
      title: 'Company Prep',
      subtitle: 'Bias practice toward one hiring bar without reworking the whole loop.',
      route: ['/companies'],
      destination: 'companies',
      fitHint: 'Targeted prep',
    },
    {
      title: 'Focus Areas',
      subtitle: 'Branch into one stack when you want cleaner repetition.',
      route: ['/focus-areas'],
      destination: 'tech_lanes',
      fitHint: 'Weak spot focus',
    },
  ];

  readonly solvedTotal = computed(() => this.progress.solvedIds().length);
  readonly streakCurrent = computed(() => {
    const liveStreak = this.activity.summarySig()?.streak?.current;
    if (typeof liveStreak === 'number') return liveStreak;
    return this.authService.user()?.stats?.streak?.current ?? 0;
  });
  readonly gamificationState = signal<DashboardGamificationResponse | null>(null);
  readonly gamificationLoading = signal(false);
  readonly gamificationError = signal<string | null>(null);
  readonly settingsSaving = signal(false);
  readonly dailyCompletePending = signal(false);
  readonly dailyCompleteMessage = signal<string | null>(null);
  readonly dailyCompleteError = signal<string | null>(null);
  readonly isManageProgressOpen = signal(false);

  readonly weeklyGoalEnabled = signal(true);
  readonly weeklyGoalTarget = signal(10);
  readonly showStreakWidget = signal(true);
  readonly dailyChallengeTech = signal<DailyChallengeTech>('auto');

  readonly nextBestAction = computed(() => {
    const payload = this.gamificationState();
    return (
      payload?.nextBestAction ?? {
        id: 'fallback_continue',
        title: 'Keep the loop moving',
        description: 'Take one focused coding rep, then review what changed.',
        route: '/coding',
        cta: 'Start a rep',
      }
    );
  });
  readonly dailyChallenge = computed(() => this.gamificationState()?.dailyChallenge ?? null);
  readonly weeklyGoal = computed(() => this.gamificationState()?.weeklyGoal ?? null);
  readonly xpLevel = computed(() => this.gamificationState()?.xpLevel ?? null);
  readonly progressSummary = computed(() => this.gamificationState()?.progress ?? null);
  readonly dashboardMode = computed<DashboardMode>(() => {
    if (!this.authService.isLoggedIn()) return 'guest';

    const completedPractice = Number(this.progressSummary()?.practice?.completedCount ?? 0);
    if (completedPractice >= 3) return 'established';
    if (this.solvedTotal() >= 3) return 'established';
    return 'novice';
  });
  readonly heroPrimaryCta = computed<HeroCta>(() => {
    if (this.dashboardMode() === 'established') {
      const action = this.nextBestAction();
      return {
        actionId: action.id,
        label: action.cta || 'Continue',
        route: action.route,
      };
    }

    if (this.dashboardMode() === 'guest') {
      return {
        actionId: 'guest_essential_60',
        label: 'Open Essential 60',
        route: this.guestFeaturedRoute.route,
        queryParams: this.guestFeaturedRoute.queryParams,
      };
    }

    return {
      actionId: 'novice_essential_60',
      label: this.continueCta.label,
      route: this.continueCta.route,
    };
  });
  readonly heroHeading = computed(() => {
    if (this.dashboardMode() === 'novice') return 'Start your first focused rep';
    return 'Choose one clear next move';
  });
  readonly heroCopy = computed(() => {
    switch (this.dashboardMode()) {
      case 'established':
        return 'Your next rep is ready. Keep the loop moving, then branch into the library only when today’s practice needs a different format.';
      case 'novice':
        return 'Start with one Essential 60 question. After a few completed reps, the dashboard will shift toward progress, streaks, and recommendations.';
      default:
        return 'Start with one question, keep today’s loop visible, and sign in only when you want to save streaks, weekly goals, XP, and loop history.';
    }
  });
  readonly heroSupportCopy = computed(() => {
    if (this.dashboardMode() === 'guest') {
      return 'Guest mode stays open. Save your loop when you want streaks, weekly goals, XP, and history to follow you.';
    }
    if (this.dashboardMode() === 'novice') {
      return 'Progress and XP move lower in the dashboard until you have enough completed reps for them to be worth your attention.';
    }
    return '';
  });
  readonly shouldShowSnapshot = computed(() => this.dashboardMode() === 'established');
  readonly shouldShowStreak = computed(() => this.showStreakWidget());

  constructor() {
    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (!isLoggedIn) {
        this.gamificationState.set(null);
        this.gamificationLoading.set(false);
        this.gamificationError.set(null);
        this.weeklyGoalEnabled.set(true);
        this.weeklyGoalTarget.set(10);
        this.showStreakWidget.set(true);
        this.dailyChallengeTech.set('auto');
        this.isManageProgressOpen.set(false);
        this.dashboardTracked = false;
        this.lastDailyChallengeTrackedKey = null;
        return;
      }

      this.activity.getSummary().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();
      this.loadGamification(false);
    }, { allowSignalWrites: true });

    this.activity.activityCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadGamification(true);
      });
  }

  trackPrimaryCtaClick(): void {
    const cta = this.heroPrimaryCta();
    const action = this.nextBestAction();
    this.analytics.track('dashboard_primary_cta_clicked', {
      mode: this.dashboardMode(),
      action_id: cta.actionId,
      route: this.serializeRoute(cta.route),
      recommended_title: this.dashboardMode() === 'established' ? action.title : null,
    });
  }

  trackDailyChallengeOpened(questionId?: string, dayKey?: string): void {
    this.analytics.track('daily_challenge_opened', {
      question_id: questionId || 'unknown',
      day_key: dayKey || 'unknown',
    });
  }

  trackGuestProgressPromptClick(destination: 'login' | 'signup'): void {
    this.analytics.track('guest_progress_prompt_clicked', {
      destination,
      surface: 'dashboard',
    });
  }

  trackDashboardLinkClick(link: DashboardLink, section: 'guest_secondary' | 'practice_modes' | 'related_prep' | 'library'): void {
    this.analytics.track('dashboard_library_link_clicked', {
      destination: link.destination,
      route: this.serializeRoute(link.route),
      mode: this.dashboardMode(),
      section,
    });
  }

  trackProgressSnapshotClick(): void {
    this.analytics.track('dashboard_progress_snapshot_clicked', {
      mode: this.dashboardMode(),
      destination: 'profile',
    });
  }

  openManageProgress(): void {
    if (!this.authService.isLoggedIn()) return;
    this.isManageProgressOpen.set(true);
    this.analytics.track('progress_manage_opened', { source: 'dashboard' });
  }

  closeManageProgress(): void {
    this.isManageProgressOpen.set(false);
  }

  onManageProgressVisibleChange(visible: boolean): void {
    this.isManageProgressOpen.set(Boolean(visible));
  }

  markDailyChallengeComplete(): void {
    const daily = this.dailyChallenge();
    if (!daily || daily.available === false || this.dailyCompletePending()) return;

    this.dailyCompletePending.set(true);
    this.dailyCompleteError.set(null);
    this.dailyCompleteMessage.set(null);

    this.gamification
      .completeDailyChallenge(daily.questionId)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.dailyCompletePending.set(false);
          this.dailyCompleteMessage.set(
            res.alreadyCompleted ? 'Already cleared for today.' : 'Today’s rep completed.'
          );
          this.analytics.track('daily_challenge_completed', {
            day_key: res.dayKey,
            question_id: daily.questionId,
            already_completed: Boolean(res.alreadyCompleted),
          });
          if (res.streakIncremented) this.analytics.track('streak_incremented', { day_key: res.dayKey });
          if (res.streakBroken) this.analytics.track('streak_broken', { day_key: res.dayKey });
          if (res.weeklyGoal?.completed >= 0) {
            this.analytics.track('weekly_goal_progressed', {
              completed: res.weeklyGoal.completed,
              target: res.weeklyGoal.target,
            });
          }
          if (res.weeklyGoal?.reached) {
            this.analytics.track('weekly_goal_completed', {
              completed: res.weeklyGoal.completed,
              target: res.weeklyGoal.target,
            });
          }
          if ((res.xpAwarded || 0) > 0) {
            this.analytics.track('xp_awarded', {
              source: 'daily_challenge',
              xp: res.xpAwarded,
            });
          }
          if (res.levelUp) this.analytics.track('level_up', { source: 'daily_challenge' });
          this.loadGamification(true, { preserveDailyCompleteFeedback: true });
        },
        error: (err) => {
          this.dailyCompletePending.set(false);
          this.dailyCompleteError.set(
            err?.error?.error || 'Complete the rep first, then mark it complete.'
          );
        },
      });
  }

  saveGamificationSettings(): void {
    if (!this.authService.isLoggedIn() || this.settingsSaving()) return;
    this.settingsSaving.set(true);
    this.gamificationError.set(null);

    const payload = {
      enabled: this.weeklyGoalEnabled(),
      target: this.weeklyGoalTarget(),
      showStreakWidget: this.showStreakWidget(),
      dailyChallengeTech: this.dailyChallengeTech(),
    };

    this.gamification
      .updateWeeklyGoal(payload)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.settingsSaving.set(false);
          this.analytics.track('weekly_goal_set', {
            enabled: payload.enabled,
            target: payload.target,
            daily_tech: payload.dailyChallengeTech,
          });
          this.analytics.track('weekly_goal_progressed', {
            completed: res.weeklyGoal.completed,
            target: res.weeklyGoal.target,
          });
          if (res.weeklyGoal.completed >= res.weeklyGoal.target) {
            this.analytics.track('weekly_goal_completed', {
              completed: res.weeklyGoal.completed,
              target: res.weeklyGoal.target,
            });
          }
          this.isManageProgressOpen.set(false);
          this.loadGamification(true);
        },
        error: () => {
          this.settingsSaving.set(false);
          this.gamificationError.set('Could not save your gamification settings.');
        },
      });
  }

  onWeeklyGoalEnabledChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.weeklyGoalEnabled.set(Boolean(target?.checked));
  }

  onShowStreakWidgetChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.showStreakWidget.set(Boolean(target?.checked));
  }

  onWeeklyGoalTargetChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = Number(target?.value || this.weeklyGoalTarget());
    this.weeklyGoalTarget.set(Number.isFinite(value) ? value : 10);
  }

  onDailyChallengeTechChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = String(target?.value || 'auto').toLowerCase() as DailyChallengeTech;
    const allowed: DailyChallengeTech[] = ['auto', 'javascript', 'react', 'angular', 'vue', 'html', 'css'];
    this.dailyChallengeTech.set(allowed.includes(value) ? value : 'auto');
  }

  formatPercentLabel(value: number | null | undefined): string {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0%';
    const rounded = Math.round(numeric * 100) / 100;
    if (Number.isInteger(rounded)) return `${rounded}%`;
    return `${rounded.toFixed(2).replace(/\.?0+$/, '')}%`;
  }

  private loadGamification(force = false, opts?: { preserveDailyCompleteFeedback?: boolean }): void {
    if (!this.authService.isLoggedIn()) return;
    this.gamificationLoading.set(true);
    this.gamificationError.set(null);
    const preserveDailyCompleteFeedback = opts?.preserveDailyCompleteFeedback === true;

    this.gamification
      .getDashboard({ force })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          this.gamificationLoading.set(false);
          this.gamificationState.set(payload);
          this.weeklyGoalEnabled.set(payload?.settings?.weeklyGoalEnabled ?? payload?.weeklyGoal?.enabled !== false);
          this.weeklyGoalTarget.set(payload?.settings?.weeklyGoalTarget || payload?.weeklyGoal?.target || 10);
          this.showStreakWidget.set(payload?.settings?.showStreakWidget !== false);
          this.dailyChallengeTech.set((payload?.settings?.dailyChallengeTech as DailyChallengeTech) || 'auto');
          if (!preserveDailyCompleteFeedback) {
            this.dailyCompleteMessage.set(null);
            this.dailyCompleteError.set(null);
          }

          if (!this.dashboardTracked) {
            this.analytics.track('dashboard_viewed', {
              has_auth: true,
              has_daily: Boolean(payload?.dailyChallenge),
              mode: this.dashboardMode(),
            });
            this.dashboardTracked = true;
          }

          const dayKey = payload?.dailyChallenge?.dayKey || null;
          if (dayKey && this.lastDailyChallengeTrackedKey !== dayKey) {
            this.analytics.track('daily_challenge_viewed', {
              day_key: dayKey,
              question_id: payload?.dailyChallenge?.questionId,
              completed: payload?.dailyChallenge?.completed,
            });
            this.lastDailyChallengeTrackedKey = dayKey;
          }
        },
        error: () => {
          this.gamificationLoading.set(false);
          this.gamificationError.set('Unable to load loop widgets right now.');
        },
      });
  }

  private serializeRoute(route: string | any[]): string {
    return typeof route === 'string' ? route : route.join('/');
  }
}
