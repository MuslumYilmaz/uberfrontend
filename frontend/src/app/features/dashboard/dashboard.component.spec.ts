import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of, Subject } from 'rxjs';
import { DashboardGamificationResponse } from '../../core/models/gamification.model';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { IncidentProgressService } from '../../core/services/incident-progress.service';
import { IncidentService } from '../../core/services/incident.service';
import { QuestionService } from '../../core/services/question.service';
import { TradeoffBattleProgressService } from '../../core/services/tradeoff-battle-progress.service';
import { TradeoffBattleService } from '../../core/services/tradeoff-battle.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let gamification: jasmine.SpyObj<GamificationService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const sampleDashboardPayload: DashboardGamificationResponse = {
    nextBestAction: {
      id: 'daily_challenge',
      title: 'Complete today’s daily challenge',
      description: 'Maintain momentum with one focused question.',
      route: '/react/coding/react-counter',
      cta: 'Open challenge',
    },
    dailyChallenge: {
      dayKey: '2026-02-09',
      questionId: 'react-counter',
      title: 'Counter component',
      kind: 'coding',
      tech: 'react',
      difficulty: 'easy',
      route: '/react/coding/react-counter',
      completed: false,
      streak: { current: 3, longest: 8 },
    },
    weeklyGoal: {
      enabled: true,
      target: 10,
      completed: 4,
      progress: 0.4,
      weekKey: '2026-02-09',
      bonusXp: 50,
      bonusGranted: false,
    },
    xpLevel: {
      totalXp: 420,
      level: 3,
      levelStepXp: 200,
      currentLevelXp: 20,
      nextLevelXp: 600,
      progress: 0.1,
    },
    progress: {
      questions: {
        solvedCount: 12,
        totalCount: 60,
        solvedPercent: 20,
        topTopics: [
          { topic: 'state', label: 'State', solved: 4, total: 8, percent: 50 },
          { topic: 'events', label: 'Events', solved: 3, total: 9, percent: 33 },
        ],
      },
      incidents: {
        passedCount: 2,
        totalCount: 6,
        passedPercent: 33,
      },
      practice: {
        completedCount: 14,
        totalCount: 66,
        completedPercent: 21,
      },
    },
    settings: {
      weeklyGoalEnabled: true,
      weeklyGoalTarget: 10,
      showStreakWidget: true,
      dailyChallengeTech: 'auto',
    },
  };

  beforeEach(async () => {
    sessionStorage.clear();

    const questionServiceStub = {
      loadAllQuestionSummaries: jasmine.createSpy('loadAllQuestionSummaries').and.callFake((kind: string) => {
        if (kind === 'coding') {
          return of([
            { id: 'react-counter', title: 'Counter', tech: 'react', tags: ['state'], difficulty: 'easy' },
          ] as any[]);
        }
        return of([
          { id: 'react-closures', title: 'Closures', tech: 'react', tags: ['events'], difficulty: 'intermediate' },
        ] as any[]);
      }),
      loadSystemDesign: jasmine.createSpy('loadSystemDesign').and.returnValue(of([])),
      loadQuestionSummaries: jasmine.createSpy('loadQuestionSummaries').and.returnValue(of([
        { id: 'js-event-loop', importance: 5, difficulty: 'intermediate', access: 'premium' },
        { id: 'js-closure-scope', importance: 4, difficulty: 'intermediate', access: 'free' },
        { id: 'js-array-map', importance: 3, difficulty: 'easy', access: 'free' },
      ])),
    };

    const authServiceStub = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      user: jasmine.createSpy('user').and.returnValue({ stats: { streak: { current: 2 } } }),
    };

    const progressServiceStub = {
      solvedIds: jasmine.createSpy('solvedIds').and.returnValue(['react-counter']),
    };

    const activityServiceStub = {
      summarySig: signal<any>(null),
      activityCompleted$: new Subject<any>(),
      getSummary: jasmine.createSpy('getSummary').and.returnValue(of(null)),
      getRecent: jasmine.createSpy('getRecent').and.returnValue(of([])),
    };
    const incidentServiceStub = {
      loadIncidentIndex: jasmine.createSpy('loadIncidentIndex').and.returnValue(of([
        {
          id: 'stale-search-race',
          title: 'Stale search race',
          tech: 'react',
          difficulty: 'intermediate',
          summary: 'Race condition in live search results.',
          signals: ['stale-results'],
          estimatedMinutes: 12,
          tags: ['race-condition'],
          updatedAt: '2026-02-01T00:00:00.000Z',
          access: 'free',
        },
        {
          id: 'websocket-memory-leak',
          title: 'WebSocket memory leak',
          tech: 'javascript',
          difficulty: 'hard',
          summary: 'Leaking listeners and sockets.',
          signals: ['memory-growth'],
          estimatedMinutes: 15,
          tags: ['memory'],
          updatedAt: '2026-02-02T00:00:00.000Z',
          access: 'free',
        },
      ])),
    };
    const incidentProgressServiceStub = {
      getRecord: jasmine.createSpy('getRecord').and.callFake((id: string) => ({
        started: id === 'stale-search-race',
        completed: id === 'stale-search-race',
        passed: id === 'stale-search-race',
        bestScore: id === 'stale-search-race' ? 90 : 0,
        lastPlayedAt: null,
        reflectionNote: '',
      })),
    };
    const tradeoffBattleServiceStub = {
      loadIndex: jasmine.createSpy('loadIndex').and.returnValue(of([
        {
          id: 'context-vs-zustand-vs-redux',
          title: 'Context vs Zustand vs Redux',
          tech: 'react',
          difficulty: 'intermediate',
          summary: 'Choose the right state layer for a growing app.',
          tags: ['state-management'],
          access: 'free',
          estimatedMinutes: 10,
          updatedAt: '2026-02-01',
        },
        {
          id: 'sse-vs-websocket-live-dashboard',
          title: 'SSE vs WebSocket for live dashboard',
          tech: 'system-design',
          difficulty: 'intermediate',
          summary: 'Defend the transport choice for a realtime dashboard.',
          tags: ['realtime'],
          access: 'free',
          estimatedMinutes: 11,
          updatedAt: '2026-02-02',
        },
      ])),
    };
    const tradeoffBattleProgressServiceStub = {
      getRecord: jasmine.createSpy('getRecord').and.callFake((id: string) => ({
        started: id === 'context-vs-zustand-vs-redux',
        completed: id === 'context-vs-zustand-vs-redux',
        lastPlayedAt: null,
        selectedOptionId: '',
      })),
    };

    gamification = jasmine.createSpyObj<GamificationService>('GamificationService', [
      'getDashboard',
      'completeDailyChallenge',
      'updateWeeklyGoal',
    ]);
    gamification.getDashboard.and.returnValue(of(sampleDashboardPayload));
    gamification.completeDailyChallenge.and.returnValue(of({
      completed: true,
      dayKey: '2026-02-09',
      streak: { current: 4, longest: 8 },
      streakIncremented: true,
      weeklyGoal: { completed: 5, target: 10, progress: 0.5, reached: false, bonusGranted: false },
      xpAwarded: 0,
      levelUp: false,
    }));
    gamification.updateWeeklyGoal.and.returnValue(of({
      weeklyGoal: {
        enabled: true,
        target: 10,
        completed: 4,
        progress: 0.4,
        weekKey: '2026-02-09',
      },
      settings: { weeklyGoalEnabled: true, weeklyGoalTarget: 10, showStreakWidget: true, dailyChallengeTech: 'auto' },
    }));

    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: QuestionService, useValue: questionServiceStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: UserProgressService, useValue: progressServiceStub },
        { provide: ActivityService, useValue: activityServiceStub },
        { provide: GamificationService, useValue: gamification },
        { provide: AnalyticsService, useValue: analytics },
        { provide: IncidentService, useValue: incidentServiceStub },
        { provide: IncidentProgressService, useValue: incidentProgressServiceStub },
        { provide: TradeoffBattleService, useValue: tradeoffBattleServiceStub },
        { provide: TradeoffBattleProgressService, useValue: tradeoffBattleProgressServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders compact momentum widgets with profile details CTA', () => {
    const pageText = fixture.nativeElement.textContent || '';
    expect(pageText).toContain('Next best action');
    expect(pageText).toContain('Daily challenge');
    expect(pageText).toContain('Question coverage');
    expect(pageText).toContain('Debug scenarios');
    expect(pageText).toContain('Practice completed');
    expect(pageText).toContain('Profile activity');
    expect(pageText).toContain('Show full details');
  });

  it('renders focus areas browse action linking to /focus-areas', () => {
    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('[data-testid="dashboard-focus-areas-link"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href') || '').toContain('/focus-areas');
  });

  it('includes CV Linter in recommended preparation cards', () => {
    const component = fixture.componentInstance;
    const cvCard = component.recommended.find((card) => card.title === 'CV Linter');

    expect(cvCard).toBeTruthy();
    expect(cvCard?.route).toEqual(['/tools', 'cv']);
  });

  it('shows solved trivia progress in practice formats', async () => {
    const progressService = TestBed.inject(UserProgressService) as any;
    progressService.solvedIds.and.returnValue(['react-closures']);

    const localFixture = TestBed.createComponent(DashboardComponent);
    localFixture.detectChanges();

    const component = localFixture.componentInstance;
    const stats = await firstValueFrom(component.stats$);
    const triviaCard = component.practiceFormats.find((card) => card.kindKey === 'trivia');

    expect(triviaCard).toBeTruthy();
    expect(component.getPracticeFormatSubtitle(triviaCard!, stats)).toBe('1/1 questions');
  });

  it('shows incident and tradeoff progress in practice formats', async () => {
    const component = fixture.componentInstance;
    const stats = await firstValueFrom(component.stats$);
    const incidentCard = component.practiceFormats.find((card) => card.kindKey === 'incident');
    const tradeoffCard = component.practiceFormats.find((card) => card.kindKey === 'tradeoff-battle');

    expect(incidentCard).toBeTruthy();
    expect(tradeoffCard).toBeTruthy();
    expect(component.getPracticeFormatSubtitle(incidentCard!, stats)).toBe('1/2 passed');
    expect(component.getPracticeFormatSubtitle(tradeoffCard!, stats)).toBe('1/2 completed');
  });

  it('marks daily challenge complete from dashboard card', () => {
    const component = fixture.componentInstance;
    component.markDailyChallengeComplete();
    fixture.detectChanges();

    expect(gamification.completeDailyChallenge).toHaveBeenCalledWith('react-counter');
  });

  it('keeps daily completion feedback visible after refresh', () => {
    const component = fixture.componentInstance;
    component.markDailyChallengeComplete();
    fixture.detectChanges();

    expect(component.dailyCompleteMessage()).toBe('Daily challenge completed.');
    expect(component.dailyCompleteError()).toBeNull();
  });

  it('saves daily challenge tech preference with weekly settings payload', () => {
    const component = fixture.componentInstance;
    component.dailyChallengeTech.set('vue');
    component.saveGamificationSettings();
    fixture.detectChanges();

    expect(gamification.updateWeeklyGoal).toHaveBeenCalledWith(
      jasmine.objectContaining({ dailyChallengeTech: 'vue' })
    );
  });

  it('renders fallback next action when gamification payload is unavailable', () => {
    gamification.getDashboard.and.returnValue(of(null));
    const localFixture = TestBed.createComponent(DashboardComponent);
    localFixture.detectChanges();

    expect(localFixture.nativeElement.textContent || '').toContain('Keep your preparation momentum');
    expect(localFixture.nativeElement.textContent || '').toContain('Continue practice');
  });

  it('formats global progress percentage without trailing zeros and with detail for small values', () => {
    const component = fixture.componentInstance;

    expect(component.formatPercentLabel(0)).toBe('0%');
    expect(component.formatPercentLabel(1)).toBe('1%');
    expect(component.formatPercentLabel(1.5)).toBe('1.5%');
    expect(component.formatPercentLabel(0.1234)).toBe('0.12%');
  });

  it('derives precise overall solved percent from solved/total counts', () => {
    const component = fixture.componentInstance;
    const percent = component.overallSolvedPercent({
      questions: {
        solvedCount: 2,
        totalCount: 417,
        solvedPercent: 0,
        topTopics: [],
      },
      incidents: {
        passedCount: 0,
        totalCount: 6,
        passedPercent: 0,
      },
      practice: {
        completedCount: 2,
        totalCount: 423,
        completedPercent: 0,
      },
    });

    expect(percent).toBeCloseTo(0.4796, 4);
    expect(component.formatPercentLabel(percent)).toBe('0.48%');
  });

  it('parses weakness drill query params from drill url', () => {
    const component = fixture.componentInstance;
    const params = component.weaknessQueryParams({
      topicOrTag: 'arrays',
      category: 'off-by-one',
      failCount: 3,
      lastSeenTs: Date.now(),
      drillUrl: '/coding?q=array%20index%20boundaries&reset=1',
    });

    expect(params['q']).toBe('array index boundaries');
    expect(params['reset']).toBe('1');
  });

  it('shows prep launcher bubble after 12 seconds without click', fakeAsync(() => {
    const component = fixture.componentInstance;
    (component as any).isBrowser = true;
    (component as any).armPrepLauncherIdleTimer();
    component.prepLauncherBubbleVisible.set(false);

    tick(12000);
    fixture.detectChanges();

    expect(component.prepLauncherBubbleVisible()).toBeTrue();
  }));

  it('dismisses prep launcher for current session and keeps compact trigger', () => {
    const component = fixture.componentInstance;
    component.dismissPrepLauncher();
    fixture.detectChanges();

    expect(component.prepLauncherDismissed()).toBeTrue();
    expect(sessionStorage.getItem('fa:dashboard:prep-launcher-dismissed:v1')).toBe('1');
  });

  it('opens launcher modal and tracks launcher_opened event', () => {
    const component = fixture.componentInstance;
    component.openPrepLauncher('chip');

    expect(component.prepLauncherOpen()).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith(
      'launcher_opened',
      jasmine.objectContaining({
        surface: 'dashboard',
        source: 'chip',
      }),
    );
  });

  it('does not auto-hide launcher bubble when activity happens inside bubble content', () => {
    const component = fixture.componentInstance;
    component.prepLauncherBubbleVisible.set(true);
    fixture.detectChanges();

    const bubbleHost = document.createElement('div');
    bubbleHost.className = 'prep-launcher__bubble';
    const bubbleAction = document.createElement('button');
    bubbleHost.appendChild(bubbleAction);
    document.body.appendChild(bubbleHost);

    bubbleAction.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(component.prepLauncherBubbleVisible()).toBeTrue();

    document.body.removeChild(bubbleHost);
  });

  it('routes solve_now intent to highest-importance unlocked javascript coding question for non-premium users', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.selectPrepIntent('solve_now');

    expect(navSpy).toHaveBeenCalledWith(
      ['/', 'javascript', 'coding', 'js-closure-scope'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          entry: 'dashboard_launcher',
          quick_win: 1,
        }),
      }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'launcher_option_selected',
      jasmine.objectContaining({
        selected_intent: 'solve_now',
      }),
    );
  });

  it('routes solve_now intent to the next unlocked unsolved javascript question when top one is already solved', async () => {
    const progressService = TestBed.inject(UserProgressService) as any;
    progressService.solvedIds.and.returnValue(['js-closure-scope']);
    const localFixture = TestBed.createComponent(DashboardComponent);
    localFixture.detectChanges();
    const component = localFixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.selectPrepIntent('solve_now');

    expect(navSpy).toHaveBeenCalledWith(
      ['/', 'javascript', 'coding', 'js-array-map'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          entry: 'dashboard_launcher',
          quick_win: 1,
        }),
      }),
    );
  });

  it('routes solve_now intent to a random unlocked javascript question when all unlocked ones are solved', async () => {
    const progressService = TestBed.inject(UserProgressService) as any;
    progressService.solvedIds.and.returnValue(['js-closure-scope', 'js-array-map']);
    spyOn(Math, 'random').and.returnValue(0.99);
    const localFixture = TestBed.createComponent(DashboardComponent);
    localFixture.detectChanges();
    const component = localFixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.selectPrepIntent('solve_now');

    expect(navSpy).toHaveBeenCalledWith(
      ['/', 'javascript', 'coding', 'js-array-map'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          entry: 'dashboard_launcher',
          quick_win: 1,
        }),
      }),
    );
  });

  it('routes solve_now intent to highest-importance javascript coding question for premium users', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const authService = TestBed.inject(AuthService) as any;
    authService.user.and.returnValue({
      accessTier: 'premium',
      stats: { streak: { current: 2 } },
    });

    await component.selectPrepIntent('solve_now');

    expect(navSpy).toHaveBeenCalledWith(
      ['/', 'javascript', 'coding', 'js-event-loop'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          entry: 'dashboard_launcher',
          quick_win: 1,
        }),
      }),
    );
  });

  it('routes guided_plan intent to /tracks', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.selectPrepIntent('guided_plan');

    expect(navSpy).toHaveBeenCalledWith(
      ['/tracks'],
      jasmine.objectContaining({ queryParams: { entry: 'dashboard_launcher' } }),
    );
  });
});
