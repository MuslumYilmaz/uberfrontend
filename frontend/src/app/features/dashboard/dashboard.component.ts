import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params, RouterModule } from '@angular/router';
import { forkJoin, from, map, Observable, shareReplay, take } from 'rxjs';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardGamificationResponse } from '../../core/models/gamification.model';
import { GamificationService } from '../../core/services/gamification.service';
import { MixedQuestion, QuestionService } from '../../core/services/question.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { deriveTopicIdsFromTags, loadTopics, TopicDefinition } from '../../core/utils/topics.util';
import { collectCompanyCounts } from '../../shared/company-counts.util';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../shared/ui/card/fa-card.component';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent, FaButtonComponent, FaCardComponent],
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
  private readonly focusIntensityCache = new WeakMap<Stats, Record<string, FocusIntensity>>();
  private readonly emptyTrackProgress: TrackProgress = { solved: 0, total: 0, pct: 0 };
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
  isGamificationExpanded = signal(true);

  weeklyGoalEnabled = signal(true);
  weeklyGoalTarget = signal(10);
  showStreakWidget = signal(true);
  dailyChallengeTech = signal<DailyChallengeTech>('auto');

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

  private solvedSet = computed(() => new Set(this.progress.solvedIds()));

  constructor(private questions: QuestionService) {
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
        this.dashboardTracked = false;
        this.lastDailyChallengeTrackedKey = null;
        return;
      }
      this.activity.getSummary().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();
      this.refreshWeeklySolved(false);
      this.loadGamification(false);
    }, { allowSignalWrites: true });

    this.activity.activityCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshWeeklySolved(true);
        this.loadGamification(true);
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

  // ---- STATS: company + framework + formats + topic counts ----
  stats$: Observable<Stats> = forkJoin({
    coding: this.questions.loadAllQuestions('coding'),
    trivia: this.questions.loadAllQuestions('trivia'),
    system: this.questions.loadSystemDesign(),
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

  private loadGamification(force = false) {
    if (!this.authService.isLoggedIn()) return;
    this.gamificationLoading.set(true);
    this.gamificationError.set(null);

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
          this.dailyCompleteMessage.set(null);
          this.dailyCompleteError.set(null);

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
          this.loadGamification(true);
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

  toggleGamificationSection() {
    this.isGamificationExpanded.update((value) => !value);
  }

  trackTopic = (_: number, item: { topic: string }) => item.topic;

}
