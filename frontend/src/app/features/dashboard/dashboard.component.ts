import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params, Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { WeaknessSummary } from '../../core/models/editor-assist.model';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { firstValueFrom, forkJoin, from, fromEvent, map, merge, Observable, shareReplay, take } from 'rxjs';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AttemptInsightsService } from '../../core/services/attempt-insights.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardGamificationResponse, DashboardProgress } from '../../core/models/gamification.model';
import { GamificationService } from '../../core/services/gamification.service';
import { MixedQuestion, QuestionService } from '../../core/services/question.service';
import { PrepIntent, PrepLauncherEventPayload } from '../../core/models/prep-intent.model';
import { UserProgressService } from '../../core/services/user-progress.service';
import { deriveTopicIdsFromTags, loadTopics, TopicDefinition } from '../../core/utils/topics.util';
import { collectCompanyCounts } from '../../shared/company-counts.util';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../shared/ui/card/fa-card.component';
import { FaDialogComponent } from '../../shared/ui/dialog/fa-dialog.component';
import { TRACKS } from '../tracks/track.data';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';
type DailyChallengeTech = 'auto' | 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';

type FormatCounts = Record<CategoryKeyInternal, number>;
type TopicCounts = Record<string, number>;
type FocusIntensity = 'core' | 'rising' | 'light';
type TrackProgress = { solved: number; total: number; pct: number };

type Stats = {
  companyCounts: Record<string, number>;
  techCounts: Record<string, number>;
  formatCounts: FormatCounts;
  formatQuestionIds: Record<CategoryKeyInternal, string[]>;
  triviaTotal: number;
  triviaQuestionIds: string[];
  systemDesignTotal: number;
  systemDesignQuestionIds: string[];
  topics: TopicDefinition[];
  topicCounts: TopicCounts;
};
type CategoryKeyInternal = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';

type Card = {
  title: string;
  subtitle?: string;
  icon?: IconKey;
  trackSlug?: string;
  durationLabel?: string;
  focusCount?: number;
  featuredTotal?: number;
  route?: any[];
  queryParams?: Params;
  disabled?: boolean;
  badge?: string | null;
  metaLeft?: string;
  metaRight?: string;
  companyKey?: string;
  companyGlyph?: string;
  companyColor?: string;
  companyFg?: string;
  companyNote?: string;
  techKey?: 'javascript' | 'react' | 'angular' | 'vue' | 'css' | 'html';
  formatKey?: CategoryKeyInternal;
  kindKey?: 'coding' | 'trivia' | 'system-design' | 'behavioral';
};

type QuickWinQuestion = {
  id: string;
  importance: number;
  difficulty: string;
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
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authService = inject(AuthService);
  private readonly progress = inject(UserProgressService);
  private readonly activity = inject(ActivityService);
  private readonly gamification = inject(GamificationService);
  private readonly analytics = inject(AnalyticsService);
  private readonly attemptInsights = inject(AttemptInsightsService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusIntensityCache = new WeakMap<Stats, Record<string, FocusIntensity>>();
  private readonly emptyTrackProgress: TrackProgress = { solved: 0, total: 0, pct: 0 };
  private readonly prepLauncherDismissedKey = 'fa:dashboard:prep-launcher-dismissed:v1';
  private readonly prepAnalyticsSessionKey = 'fa:prep:session-id:v1';
  private prepIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private quickWinSelectionPending = false;
  private quickWinCache: QuickWinQuestion[] | null = null;
  private readonly quickWinDifficultyRank: Record<string, number> = {
    easy: 0,
    intermediate: 1,
    hard: 2,
  };
  private prepSessionId = 'ssr';
  private dashboardTracked = false;
  private lastDailyChallengeTrackedKey: string | null = null;

  auth = this.authService;

  readonly continueCta = {
    label: 'Continue practice',
    route: ['/coding'] as any[],
  };

  solvedTotal = computed(() => this.progress.solvedIds().length);
  streakCurrent = computed(() => {
    const liveStreak = this.activity.summarySig()?.streak?.current;
    if (typeof liveStreak === 'number') return liveStreak;
    return this.authService.user()?.stats?.streak?.current ?? 0;
  });
  weeklySolvedCount = signal(0);
  gamificationState = signal<DashboardGamificationResponse | null>(null);
  gamificationLoading = signal(false);
  gamificationError = signal<string | null>(null);
  settingsSaving = signal(false);
  dailyCompletePending = signal(false);
  dailyCompleteMessage = signal<string | null>(null);
  dailyCompleteError = signal<string | null>(null);
  isManageProgressOpen = signal(false);
  weaknesses = signal<WeaknessSummary[]>([]);
  topWeakness = computed(() => this.weaknesses()[0] ?? null);

  weeklyGoalEnabled = signal(true);
  weeklyGoalTarget = signal(10);
  showStreakWidget = signal(true);
  dailyChallengeTech = signal<DailyChallengeTech>('auto');
  prepLauncherOpen = signal(false);
  prepLauncherBubbleVisible = signal(false);
  prepLauncherDismissed = signal(false);
  prepLauncherBusy = signal(false);

  nextBestAction = computed(() => {
    const payload = this.gamificationState();
    return (
      payload?.nextBestAction ?? {
        id: 'fallback_continue',
        title: 'Keep your preparation momentum',
        description: 'Continue with one focused coding question and build consistency.',
        route: '/coding',
        cta: 'Continue practice',
      }
    );
  });
  dailyChallenge = computed(() => this.gamificationState()?.dailyChallenge ?? null);
  weeklyGoal = computed(() => this.gamificationState()?.weeklyGoal ?? null);
  xpLevel = computed(() => this.gamificationState()?.xpLevel ?? null);
  progressSummary = computed(() => this.gamificationState()?.progress ?? null);
  shouldShowStreak = computed(() => this.showStreakWidget());
  showWeaknessRadar = computed(() => {
    const flags = ((environment as any)?.assist || {}) as { weaknessRadar?: boolean };
    return !!flags.weaknessRadar && this.weaknesses().length > 0;
  });
  prepLauncherLabel = computed(() => (
    this.prepLauncherDismissed() ? 'Start' : 'Not sure where to start?'
  ));

  private solvedSet = computed(() => new Set(this.progress.solvedIds()));

  constructor(private questions: QuestionService) {
    this.prepSessionId = this.resolvePrepSessionId();
    if (this.isBrowser) {
      this.hydratePrepLauncherState();
      this.armPrepLauncherIdleTimer();
      merge(
        fromEvent(this.document, 'pointerdown'),
        fromEvent(this.document, 'keydown'),
      )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => this.onPrepUserActivity(event));

      this.destroyRef.onDestroy(() => {
        this.clearPrepLauncherIdleTimer();
      });
    }

    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (!isLoggedIn) {
        this.weeklySolvedCount.set(0);
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
      this.refreshWeeklySolved(false);
      this.loadGamification(false);
      this.refreshWeaknessRadar();
    }, { allowSignalWrites: true });

    this.activity.activityCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshWeeklySolved(true);
        this.loadGamification(true);
        this.refreshWeaknessRadar();
      });
  }

  private readonly ICON_MAP: Record<IconKey, string> = {
    book: 'book',
    grid: 'th-large',
    list: 'list',
    cap: 'bookmark',
    building: 'briefcase',
    bolt: 'bolt',
    star: 'star',
    clock: 'clock',
  };

  private readonly ALGO_TAGS = new Set<string>([
    'recursion',
    'two-pointers',
    'binary-search',
    'heap',
    'graph',
    'bfs',
    'dfs',
    'topological',
    'trie',
    'dynamic-programming',
    'dp',
    'sorting',
    'greedy',
    'backtracking',
  ]);

  private inferFormatCategory(q: MixedQuestion): CategoryKeyInternal {
    const tech = String((q as any).technology || q.tech || '').toLowerCase();

    if (tech === 'html' || tech === 'css') return 'html-css';
    if (['angular', 'react', 'vue'].includes(tech) || (q as any).sdk) return 'ui';

    const tags: string[] = ((q as any).tags || []).map((t: any) =>
      String(t || '').toLowerCase()
    );
    if (tags.some(t => this.ALGO_TAGS.has(t))) return 'algo';

    return 'js-fn';
  }

  piIcon(key?: IconKey) {
    const name = key ? this.ICON_MAP[key] ?? 'question' : 'window';
    return ['pi', `pi-${name}`];
  }

  openPrepLauncher(source: 'chip' | 'bubble' | 'reopen' = 'chip'): void {
    this.prepLauncherOpen.set(true);
    this.prepLauncherBubbleVisible.set(false);
    this.trackPrepEvent('launcher_opened', {
      ...this.basePrepPayload(),
      source,
    });
    this.armPrepLauncherIdleTimer();
  }

  closePrepLauncher(): void {
    this.prepLauncherOpen.set(false);
    this.armPrepLauncherIdleTimer();
  }

  onPrepLauncherVisibleChange(visible: boolean): void {
    this.prepLauncherOpen.set(Boolean(visible));
    if (visible) this.prepLauncherBubbleVisible.set(false);
    this.armPrepLauncherIdleTimer();
  }

  dismissPrepLauncher(event?: Event): void {
    event?.stopPropagation();
    this.prepLauncherDismissed.set(true);
    this.prepLauncherBubbleVisible.set(false);
    this.persistPrepLauncherDismissed(true);
    this.trackPrepEvent('launcher_dismissed', {
      ...this.basePrepPayload(),
      source: 'chip',
    });
    this.clearPrepLauncherIdleTimer();
  }

  async selectPrepIntent(intent: PrepIntent): Promise<void> {
    this.trackPrepEvent('launcher_option_selected', {
      ...this.basePrepPayload(intent),
      source: 'dashboard_launcher',
    });

    this.prepLauncherOpen.set(false);
    this.prepLauncherBubbleVisible.set(false);

    if (intent === 'solve_now') {
      if (this.quickWinSelectionPending) return;
      this.quickWinSelectionPending = true;
      this.prepLauncherBusy.set(true);
      try {
        const quickWin = await this.resolveQuickWinQuestion();
        if (quickWin?.id) {
          await this.router.navigate(
            ['/', 'javascript', 'coding', quickWin.id],
            {
              queryParams: {
                entry: 'dashboard_launcher',
                quick_win: 1,
                src: 'dashboard_launcher',
              },
            },
          );
          return;
        }

        await this.router.navigate(['/coding'], {
          queryParams: {
            tech: 'javascript',
            kind: 'coding',
            imp: 'high',
            entry: 'dashboard_launcher',
            quick_win: 1,
            reset: 1,
          },
        });
      } finally {
        this.quickWinSelectionPending = false;
        this.prepLauncherBusy.set(false);
      }
      return;
    }

    if (intent === 'guided_plan') {
      await this.router.navigate(['/tracks'], {
        queryParams: { entry: 'dashboard_launcher' },
      });
      return;
    }

    if (intent === 'company_target') {
      await this.router.navigate(['/companies'], {
        queryParams: { entry: 'dashboard_launcher' },
      });
      return;
    }

    await this.router.navigate(['/interview-questions'], {
      queryParams: { entry: 'dashboard_launcher' },
    });
  }

  private async resolveQuickWinQuestion(): Promise<QuickWinQuestion | null> {
    if (!this.quickWinCache?.length) {
      const list = await firstValueFrom(
        this.questions.loadQuestionSummaries('javascript', 'coding', { transferState: false }),
      );
      const user = this.authService.user();

      const candidates = (list || [])
        .filter((item) => !isQuestionLockedForTier({ access: item.access ?? 'free' }, user))
        .map((item) => ({
          id: String(item.id || '').trim(),
          importance: Number(item.importance || 0),
          difficulty: String(item.difficulty || 'intermediate').toLowerCase(),
        }))
        .filter((item) => !!item.id)
        .sort((a, b) => {
          if (a.importance !== b.importance) return b.importance - a.importance;
          const aRank = this.quickWinDifficultyRank[a.difficulty] ?? 99;
          const bRank = this.quickWinDifficultyRank[b.difficulty] ?? 99;
          if (aRank !== bRank) return aRank - bRank;
          return a.id.localeCompare(b.id);
        });

      this.quickWinCache = candidates;
    }

    const candidates = this.quickWinCache ?? [];
    if (!candidates.length) return null;

    const solvedIds = this.solvedSet();
    const firstUnsolved = candidates.find((item) => !solvedIds.has(item.id));
    if (firstUnsolved) return firstUnsolved;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex] ?? candidates[0] ?? null;
  }

  private hydratePrepLauncherState(): void {
    this.prepLauncherDismissed.set(this.readPrepLauncherDismissed());
  }

  private onPrepUserActivity(event?: Event): void {
    if (this.isPrepLauncherBubbleEvent(event)) {
      return;
    }
    if (this.prepLauncherBubbleVisible()) {
      this.prepLauncherBubbleVisible.set(false);
    }
    this.armPrepLauncherIdleTimer();
  }

  private isPrepLauncherBubbleEvent(event?: Event): boolean {
    const target = event?.target;
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('.prep-launcher__bubble'));
  }

  private armPrepLauncherIdleTimer(): void {
    this.clearPrepLauncherIdleTimer();
    if (!this.isBrowser || this.prepLauncherDismissed()) return;
    this.prepIdleTimer = setTimeout(() => {
      if (this.prepLauncherOpen() || this.prepLauncherDismissed()) return;
      this.prepLauncherBubbleVisible.set(true);
    }, 12_000);
  }

  private clearPrepLauncherIdleTimer(): void {
    if (!this.prepIdleTimer) return;
    clearTimeout(this.prepIdleTimer);
    this.prepIdleTimer = null;
  }

  private basePrepPayload(intent?: PrepIntent): PrepLauncherEventPayload {
    const payload: PrepLauncherEventPayload = {
      surface: 'dashboard',
      is_logged_in: this.authService.isLoggedIn(),
      entry_route: '/dashboard',
      session_id: this.prepSessionId,
    };
    if (intent) payload.selected_intent = intent;
    return payload;
  }

  private trackPrepEvent(name: string, payload: PrepLauncherEventPayload & Record<string, unknown>): void {
    this.analytics.track(name, payload);
  }

  private readPrepLauncherDismissed(): boolean {
    if (!this.isBrowser) return false;
    try {
      return sessionStorage.getItem(this.prepLauncherDismissedKey) === '1';
    } catch {
      return false;
    }
  }

  private persistPrepLauncherDismissed(dismissed: boolean): void {
    if (!this.isBrowser) return;
    try {
      if (dismissed) sessionStorage.setItem(this.prepLauncherDismissedKey, '1');
      else sessionStorage.removeItem(this.prepLauncherDismissedKey);
    } catch {
      // Ignore storage write failures.
    }
  }

  private resolvePrepSessionId(): string {
    if (!this.isBrowser) return 'ssr';
    try {
      const existing = sessionStorage.getItem(this.prepAnalyticsSessionKey);
      if (existing) return existing;
      const next = `prep_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(this.prepAnalyticsSessionKey, next);
      return next;
    } catch {
      return 'browser';
    }
  }

  // ---- STATS: company + framework + formats + topic counts ----
  stats$: Observable<Stats> = forkJoin({
    coding: this.questions.loadAllQuestionSummaries('coding', { transferState: false }),
    trivia: this.questions.loadAllQuestionSummaries('trivia', { transferState: false }),
    system: this.questions.loadSystemDesign({ transferState: false }),
    topics: from(loadTopics()),
  }).pipe(
    map(({ coding, trivia, system, topics }) => {
      const companyCounts: Record<string, number> = {};
      const techCounts: Record<string, number> = {};
      const formatCounts: FormatCounts = {
        ui: 0,
        'js-fn': 0,
        'html-css': 0,
        algo: 0,
        system: 0,
      };
      const formatQuestionIds: Record<CategoryKeyInternal, string[]> = {
        ui: [],
        'js-fn': [],
        'html-css': [],
        algo: [],
        system: [],
      };
      const triviaQuestionIds: string[] = [];
      const systemDesignQuestionIds: string[] = [];

      const topicCounts: TopicCounts = {};
      for (const t of topics.topics ?? []) {
        if (t?.id) topicCounts[t.id] = 0;
      }

      const bumpTopics = (q: MixedQuestion) => {
        const tags: string[] = ((q as any).tags ?? []).map((t: any) =>
          String(t || '').toLowerCase()
        );
        for (const id of deriveTopicIdsFromTags(tags, topics)) {
          topicCounts[id] = (topicCounts[id] ?? 0) + 1;
        }
      };

      // CODING
      for (const q of coding) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;
        if (q?.id) formatQuestionIds[cat].push(q.id);

        bumpTopics(q);
      }

      // TRIVIA
      for (const q of trivia) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q as MixedQuestion);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;
        if (q?.id) {
          formatQuestionIds[cat].push(q.id);
          triviaQuestionIds.push(q.id);
        }

        bumpTopics(q);
      }

      const systemDesignTotal = Array.isArray(system) ? system.length : 0;
      for (const q of system ?? []) {
        if ((q as any)?.id) systemDesignQuestionIds.push((q as any).id);
      }
      formatCounts.system = systemDesignTotal;
      formatQuestionIds.system = [...systemDesignQuestionIds];

      const triviaTotal = trivia.length;

      const companyBuckets = collectCompanyCounts({ coding, trivia, system });
      Object.entries(companyBuckets).forEach(([slug, bucket]) => {
        companyCounts[slug] = bucket.all;
      });

      return {
        companyCounts,
        techCounts,
        formatCounts,
        formatQuestionIds,
        triviaTotal,
        triviaQuestionIds,
        systemDesignTotal,
        systemDesignQuestionIds,
        topics: topics.topics ?? [],
        topicCounts,
      };
    }),
    shareReplay(1)
  );

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'FrontendAtlas Interview Blueprint',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'cap',
      route: ['/guides', 'interview-blueprint'],
    },
    {
      title: 'Frontend System Design Blueprint',
      subtitle: 'Core techniques and deep dives (guide).',
      icon: 'grid',
      route: ['/guides', 'system-design-blueprint'],
    },
    {
      title: 'Behavioral Interview Blueprint',
      subtitle: 'STAR method, stories, and high-signal answers.',
      icon: 'star',
      route: ['/guides', 'behavioral'],
    },
  ];
  recommendedPrimary: Card | null = this.recommended[0] ?? null;
  recommendedSecondary: Card[] = this.recommended.slice(1);

  /** ===== Learning tracks (new) ===== */
  tracks: Card[] = TRACKS
    .filter((t) => !t.hidden)
    .map((t) => ({
      title: t.title,
      subtitle: t.subtitle,
      icon: t.slug === 'crash-7d' ? 'clock' : 'book',
      trackSlug: t.slug,
      durationLabel: t.durationLabel,
      focusCount: t.focus?.length ?? 0,
      featuredTotal: t.featured?.length ?? 0,
      route: ['/track', t.slug],
    }));

  /** ===== Company guides ===== */
  companyGuides: Card[] = [
    {
      title: 'Google',
      route: ['/companies', 'google'],
      companyKey: 'google',
      companyGlyph: 'G',
      companyColor: '#4285F4',
      companyFg: '#FFFFFF',
      companyNote: 'UI, JS, systems',
    },
    {
      title: 'Amazon',
      route: ['/companies', 'amazon'],
      companyKey: 'amazon',
      companyGlyph: 'A',
      companyColor: '#232F3E',
      companyFg: '#FBBF24',
      companyNote: 'Scaling lists, auth, UX',
    },
    {
      title: 'Netflix',
      route: ['/companies', 'netflix'],
      companyKey: 'netflix',
      companyGlyph: 'N',
      companyColor: '#E50914',
      companyFg: '#FFFFFF',
      companyNote: 'UI architecture, state',
    },
    {
      title: 'ByteDance',
      route: ['/companies', 'bytedance'],
      companyKey: 'bytedance',
      companyGlyph: 'B',
      companyColor: '#1F6FFF',
      companyFg: '#FFFFFF',
      companyNote: 'Feed ranking, growth, UX',
    },
    {
      title: 'Apple',
      route: ['/companies', 'apple'],
      companyKey: 'apple',
      companyGlyph: '',
      companyColor: '#0A0A0A',
      companyFg: '#F5F5F5',
      companyNote: 'UI polish, accessibility',
    },
    {
      title: 'OpenAI',
      route: ['/companies', 'openai'],
      companyKey: 'openai',
      companyGlyph: '◎',
      companyColor: '#111827',
      companyFg: '#D1FAE5',
      companyNote: 'Reasoning UX, evals, systems',
    },
  ];


  /** ===== Practice: formats ===== */
  questionFormats: Card[] = [
    {
      title: 'User Interface',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'ui', reset: 1 },       // 👈
      formatKey: 'ui',
      kindKey: 'coding',
    },
    {
      title: 'JavaScript / Typescript',
      subtitle: '0 questions',
      icon: 'bolt',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'js-fn', reset: 1 },    // 👈
      formatKey: 'js-fn',
      kindKey: 'coding',
    },
    {
      title: 'Front End System Design',
      subtitle: '0 questions',
      icon: 'building',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'system', kind: 'coding', reset: 1 }, // 👈
      formatKey: 'system',
      kindKey: 'system-design',
    },
    {
      title: 'Trivia',
      subtitle: '0 questions',
      icon: 'book',
      route: ['/coding'],
      queryParams: { kind: 'trivia', reset: 1 },       // 👈
      kindKey: 'trivia',
    },
    {
      title: 'Data Structures & Algorithms',
      subtitle: '0 questions',
      icon: 'star',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'algo', reset: 1 },     // 👈
      formatKey: 'algo',
      kindKey: 'coding',
    },
    {
      title: 'Behavioral Interviews',
      subtitle: '0/8 articles',
      icon: 'clock',
      route: ['/guides', 'behavioral'],
      kindKey: 'behavioral',
    },
  ];


  /** ===== Framework tiles → /coding?tech=<key> ===== */
  frameworks: Card[] = [
    {
      title: 'JavaScript',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'javascript', reset: 1 },   // 👈
      techKey: 'javascript',
    },
    {
      title: 'React',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'react', reset: 1 },        // 👈
      techKey: 'react',
    },
    {
      title: 'Angular',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'angular', reset: 1 },      // 👈
      techKey: 'angular',
    },
    {
      title: 'Vue',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'vue', reset: 1 },          // 👈
      techKey: 'vue',
    },
    {
      title: 'CSS',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'css', reset: 1 },          // 👈
      techKey: 'css',
    },
    {
      title: 'HTML',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'html', reset: 1 },         // 👈
      techKey: 'html',
    },
  ];

  trackProgressMap = computed<Record<string, TrackProgress>>(() => {
    const solved = this.solvedSet();
    const mapBySlug: Record<string, TrackProgress> = {};

    for (const t of TRACKS) {
      if (t.hidden) continue;
      const total = t.featured?.length ?? 0;
      const solvedCount = (t.featured ?? []).reduce((acc, item) => acc + (solved.has(item.id) ? 1 : 0), 0);
      mapBySlug[t.slug] = {
        solved: solvedCount,
        total,
        pct: total > 0 ? Math.round((solvedCount / total) * 100) : 0,
      };
    }

    return mapBySlug;
  });

  trackByTitle = (_: number, it: Card) => it.title;
  trackByTopicId = (_: number, it: TopicDefinition) => it.id;

  recommendedBadgeForIndex(index: number): string {
    return index === 0 ? 'Best next step' : 'Interview-ready';
  }

  trackProgress(card: Card): TrackProgress {
    if (!card.trackSlug) return this.emptyTrackProgress;
    return this.trackProgressMap()[card.trackSlug] ?? this.emptyTrackProgress;
  }

  focusAreaIntensity(stats: Stats, topicId: string): FocusIntensity {
    let intensityMap = this.focusIntensityCache.get(stats);
    if (!intensityMap) {
      intensityMap = this.buildFocusIntensityMap(stats);
      this.focusIntensityCache.set(stats, intensityMap);
    }
    return intensityMap[topicId] ?? 'light';
  }

  getCompanySubtitle(card: Card, counts: Record<string, number> | null | undefined): string {
    if (!card.companyKey || !counts) {
      return card.subtitle ?? '';
    }
    const count = counts[card.companyKey] ?? 0;
    return `${count} questions`;
  }

  getCompanyCountLabel(card: Card, counts: Record<string, number> | null | undefined): string {
    if (!card.companyKey || !counts) {
      return '0 questions';
    }
    const count = counts[card.companyKey] ?? 0;
    return `${count} question${count === 1 ? '' : 's'}`;
  }

  getFrameworkSubtitle(card: Card, counts: Record<string, number> | null | undefined): string {
    if (!card.techKey || !counts) {
      return card.subtitle ?? '';
    }
    const count = counts[card.techKey] ?? 0;
    return `${count} questions`;
  }

  getFrameworkTypeLabel(card: Card): string {
    if (card.techKey === 'javascript' || card.techKey === 'css' || card.techKey === 'html') {
      return 'Language';
    }
    return 'Framework';
  }

  getFrameworkLogo(card: Card): string {
    switch (card.techKey) {
      case 'javascript':
        return 'JS';
      case 'react':
        return 'R';
      case 'angular':
        return 'A';
      case 'vue':
        return 'V';
      case 'html':
        return 'H5';
      case 'css':
        return 'C3';
      default:
        return '•';
    }
  }

  getFrameworkTone(card: Card): string {
    if (!card.techKey) return 'default';
    return card.techKey;
  }

  getFormatSubtitle(card: Card, stats: Stats | null | undefined): string {
    if (!stats) {
      return card.subtitle ?? '';
    }

    if (card.kindKey === 'behavioral') {
      return card.subtitle ?? '';
    }

    if (card.kindKey === 'trivia') {
      const total = stats.triviaTotal ?? 0;
      const solved = this.countSolvedQuestionIds(stats.triviaQuestionIds);
      return `${solved}/${total} questions`;
    }

    if (card.kindKey === 'system-design') {
      const total = stats.systemDesignTotal ?? 0;
      const solved = this.countSolvedQuestionIds(stats.systemDesignQuestionIds);
      return `${solved}/${total} questions`;
    }

    if (card.formatKey) {
      const total = stats.formatCounts[card.formatKey] ?? 0;
      const solved = this.countSolvedQuestionIds(stats.formatQuestionIds[card.formatKey] ?? []);
      return `${solved}/${total} questions`;
    }

    return card.subtitle ?? '';
  }

  getFormatKindLabel(card: Card): string {
    switch (card.kindKey) {
      case 'trivia':
        return 'Trivia';
      case 'system-design':
        return 'System design';
      case 'behavioral':
        return 'Behavioral';
      default:
        return 'Coding';
    }
  }

  getFormatTone(card: Card): string {
    if (card.kindKey === 'behavioral') return 'behavioral';
    if (card.kindKey === 'trivia') return 'trivia';
    if (card.kindKey === 'system-design') return 'system-design';
    if (card.formatKey === 'ui') return 'ui';
    if (card.formatKey === 'js-fn') return 'js';
    if (card.formatKey === 'html-css') return 'html-css';
    if (card.formatKey === 'algo') return 'algo';
    return 'default';
  }

  private buildFocusIntensityMap(stats: Stats): Record<string, FocusIntensity> {
    const entries = Object.entries(stats.topicCounts ?? {});
    if (!entries.length) return {};

    const sortedValues = entries.map(([, count]) => count).sort((a, b) => a - b);
    const coreThreshold = sortedValues[Math.floor((sortedValues.length - 1) * 0.7)] ?? 0;
    const risingThreshold = sortedValues[Math.floor((sortedValues.length - 1) * 0.35)] ?? 0;

    const intensityMap: Record<string, FocusIntensity> = {};
    for (const [topicId, count] of entries) {
      if (count <= 0) {
        intensityMap[topicId] = 'light';
      } else if (count >= coreThreshold && coreThreshold > 0) {
        intensityMap[topicId] = 'core';
      } else if (count >= risingThreshold && risingThreshold > 0) {
        intensityMap[topicId] = 'rising';
      } else {
        intensityMap[topicId] = 'light';
      }
    }

    return intensityMap;
  }

  private countSolvedQuestionIds(ids: readonly string[]): number {
    if (!ids?.length) return 0;
    const solved = this.solvedSet();
    const seen = new Set<string>();
    let count = 0;
    for (const id of ids) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (solved.has(id)) count += 1;
    }
    return count;
  }

  private refreshWeeklySolved(force = false) {
    if (!this.authService.isLoggedIn()) {
      this.weeklySolvedCount.set(0);
      return;
    }

    const since = this.isoDateDaysAgo(6);
    this.activity.getRecent({ since }, { force })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          const uniqueCompleted = new Set<string>();
          for (const row of rows ?? []) {
            if (row.kind !== 'coding' && row.kind !== 'trivia' && row.kind !== 'debug') continue;
            const fallback = `${row.kind}:${row.tech}:${row.dayUTC}:${row.completedAt}`;
            uniqueCompleted.add(row.itemId?.trim() ? `${row.kind}:${row.itemId}` : fallback);
          }
          this.weeklySolvedCount.set(uniqueCompleted.size);
        },
        error: () => this.weeklySolvedCount.set(0),
      });
  }

  private isoDateDaysAgo(days: number): string {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    utcDate.setUTCDate(utcDate.getUTCDate() - days);
    return utcDate.toISOString().slice(0, 10);
  }

  private loadGamification(force = false, opts?: { preserveDailyCompleteFeedback?: boolean }) {
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
          this.weeklyGoalEnabled.set(payload?.weeklyGoal?.enabled !== false);
          this.weeklyGoalTarget.set(payload?.weeklyGoal?.target || 10);
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
          this.gamificationError.set('Unable to load progress widgets right now.');
        },
      });
  }

  markDailyChallengeComplete() {
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
            res.alreadyCompleted ? 'Already completed for today.' : 'Daily challenge completed.'
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
            err?.error?.error || 'Complete the challenge question first, then mark it complete.'
          );
        },
      });
  }

  saveGamificationSettings() {
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

  onWeeklyGoalEnabledChange(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.weeklyGoalEnabled.set(Boolean(target?.checked));
  }

  onShowStreakWidgetChange(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.showStreakWidget.set(Boolean(target?.checked));
  }

  onWeeklyGoalTargetChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = Number(target?.value || this.weeklyGoalTarget());
    this.weeklyGoalTarget.set(Number.isFinite(value) ? value : 10);
  }

  onDailyChallengeTechChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = String(target?.value || 'auto').toLowerCase() as DailyChallengeTech;
    const allowed: DailyChallengeTech[] = ['auto', 'javascript', 'react', 'angular', 'vue', 'html', 'css'];
    this.dailyChallengeTech.set(allowed.includes(value) ? value : 'auto');
  }

  trackNextActionClick() {
    const action = this.nextBestAction();
    this.analytics.track('next_action_clicked', {
      action_id: action.id,
      route: action.route,
    });
  }

  trackDailyChallengeOpened(questionId?: string, dayKey?: string) {
    this.analytics.track('daily_challenge_opened', {
      question_id: questionId || 'unknown',
      day_key: dayKey || 'unknown',
    });
  }

  trackProfileDetailsClick() {
    this.analytics.track('progress_details_redirected', { destination: 'profile' });
  }

  openManageProgress() {
    if (!this.authService.isLoggedIn()) return;
    this.isManageProgressOpen.set(true);
    this.analytics.track('progress_manage_opened', { source: 'dashboard' });
  }

  closeManageProgress() {
    this.isManageProgressOpen.set(false);
  }

  onManageProgressVisibleChange(visible: boolean) {
    this.isManageProgressOpen.set(Boolean(visible));
  }

  overallSolvedPercent(progress: DashboardProgress | null | undefined): number {
    const solvedCount = Number(progress?.solvedCount ?? 0);
    const totalCount = Number(progress?.totalCount ?? 0);
    if (Number.isFinite(totalCount) && totalCount > 0 && Number.isFinite(solvedCount) && solvedCount >= 0) {
      const precise = (solvedCount / totalCount) * 100;
      return Math.max(0, Math.min(100, precise));
    }
    const fallback = Number(progress?.solvedPercent ?? 0);
    if (!Number.isFinite(fallback)) return 0;
    return Math.max(0, Math.min(100, fallback));
  }

  formatPercentLabel(value: number | null | undefined): string {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0%';
    const rounded = Math.round(numeric * 100) / 100;
    if (Number.isInteger(rounded)) return `${rounded}%`;
    return `${rounded.toFixed(2).replace(/\.?0+$/, '')}%`;
  }

  weaknessQueryParams(item: WeaknessSummary): Params {
    const raw = String(item.drillUrl || '');
    const queryIdx = raw.indexOf('?');
    if (queryIdx < 0) return { reset: 1 };
    const qs = raw.slice(queryIdx + 1);
    const params = new URLSearchParams(qs);
    const out: Params = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  weaknessLastSeenLabel(ts: number): string {
    const ageMs = Math.max(0, Date.now() - Number(ts || 0));
    const minutes = Math.floor(ageMs / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  trackWeaknessDrillClick(item: WeaknessSummary): void {
    this.analytics.track('weakness_drill_clicked', {
      category: item.category,
      topic_or_tag: item.topicOrTag,
      fail_count: item.failCount,
    });
  }

  private refreshWeaknessRadar(): void {
    const flags = ((environment as any)?.assist || {}) as { weaknessRadar?: boolean };
    if (!flags.weaknessRadar || !this.attemptInsights) {
      this.weaknesses.set([]);
      return;
    }
    this.weaknesses.set(this.attemptInsights.getWeaknessSummaries(3));
  }

}
