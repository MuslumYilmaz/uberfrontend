import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { DashboardGamificationResponse } from '../../core/models/gamification.model';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { IncidentService } from '../../core/services/incident.service';
import { QuestionService } from '../../core/services/question.service';
import { TradeoffBattleService } from '../../core/services/tradeoff-battle.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let gamification: jasmine.SpyObj<GamificationService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let incidentService: jasmine.SpyObj<IncidentService>;
  let tradeoffBattleService: jasmine.SpyObj<TradeoffBattleService>;

  let loggedIn = true;
  let user: any = { stats: { streak: { current: 2 } } };
  let solvedIds = ['react-counter'];
  let currentDashboardPayload: DashboardGamificationResponse;

  const buildPayload = (overrides?: Partial<DashboardGamificationResponse>): DashboardGamificationResponse => ({
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
        topTopics: [],
      },
      incidents: {
        passedCount: 2,
        totalCount: 6,
        passedPercent: 33,
      },
      tradeoffBattles: {
        completedCount: 1,
        totalCount: 5,
        completedPercent: 20,
      },
      practice: {
        completedCount: 14,
        totalCount: 66,
        completedPercent: 21,
      },
    },
    achievements: {
      summary: {
        unlockedCount: 3,
        totalCount: 7,
      },
      unlocked: [
        {
          id: 'first-steps',
          title: 'First Steps',
          reason: 'Complete 3 practice units.',
          icon: 'flag',
          theme: 'gold',
          current: 3,
          target: 3,
          progress: 1,
          unlocked: true,
        },
        {
          id: 'question-builder',
          title: 'Problem Solver',
          reason: 'Solve 10 current-catalog questions.',
          icon: 'code',
          theme: 'cyan',
          current: 10,
          target: 10,
          progress: 1,
          unlocked: true,
        },
        {
          id: 'debug-starter',
          title: 'Debug Starter',
          reason: 'Pass 1 debug scenario.',
          icon: 'bug',
          theme: 'green',
          current: 1,
          target: 1,
          progress: 1,
          unlocked: true,
        },
      ],
      next: [
        {
          id: 'coverage-builder',
          title: 'Coverage Builder',
          reason: 'Complete 25 practice units.',
          icon: 'target',
          theme: 'blue',
          current: 14,
          target: 25,
          progress: 0.56,
          unlocked: false,
        },
      ],
    },
    prepLoop: {
      goal: {
        tech: 'javascript',
        level: 'intermediate',
        label: 'JavaScript intermediate prep',
      },
      targetProfile: {
        label: 'Intermediate',
        summary: 'Intermediate JavaScript target: 12 coding, 20 concepts, 1 currently available JS debug scenario, 3 JS tradeoffs, 6 intermediate/hard drills.',
        targets: {
          coding: 12,
          concepts: 20,
          debug: 1,
          tradeoffs: 3,
        },
        breadth: {
          coding: 4,
          concepts: 5,
        },
        difficulty: {
          advanced: 6,
        },
        conceptOnly: false,
      },
      readiness: {
        score: 64,
        band: 'Developing',
        components: [
          {
            id: 'coding',
            label: 'JavaScript coding',
            score: 12,
            max: 30,
            current: 5,
            effectiveCurrent: 4,
            target: 12,
            percent: 4 / 12,
            route: '/javascript/interview-questions',
            breadth: {
              solved: 2,
              required: 4,
              percent: 0.5,
              gaps: [
                { id: 'js-async-runtime', label: 'Async & Runtime', solved: 0, target: 3 },
              ],
              dominant: { id: 'js-data-transforms', label: 'Data Transforms', solved: 4, target: 3 },
            },
            feedback: {
              attempts: 3,
              failRuns: 2,
              passRate: 0.33,
              repeatedFailures: 1,
              topFailureCategories: [
                { category: 'async-promise-mismatch', count: 2 },
              ],
            },
          },
          {
            id: 'concepts',
            label: 'JavaScript concepts',
            score: 10,
            max: 25,
            current: 8,
            target: 20,
            percent: 0.4,
            route: '/javascript/interview-questions',
          },
          {
            id: 'debug',
            label: 'Debug practice',
            score: 10,
            max: 15,
            current: 2,
            target: 1,
            percent: 1,
            route: '/incidents',
          },
          {
            id: 'tradeoffs',
            label: 'Tradeoff practice',
            score: 5,
            max: 15,
            current: 1,
            target: 3,
            percent: 1 / 3,
            route: '/tradeoffs',
          },
          {
            id: 'consistency',
            label: 'Weekly consistency',
            score: 6,
            max: 15,
            current: 4,
            target: 10,
            percent: 0.4,
            route: '/dashboard',
          },
        ],
        cap: {
          maxScore: 69,
          reason: 'Broaden JavaScript coding beyond Data Transforms.',
        },
      },
      weaknesses: [
        {
          id: 'tradeoffs',
          label: 'Tradeoff practice',
          score: 5,
          max: 15,
          current: 1,
          target: 3,
          percent: 1 / 3,
          route: '/tradeoffs',
        },
        {
          id: 'concepts',
          label: 'JavaScript concepts',
          score: 10,
          max: 25,
          current: 8,
          target: 20,
          percent: 0.4,
          route: '/javascript/interview-questions',
        },
      ],
      coverageGaps: [
        {
          id: 'coding:js-async-runtime',
          label: 'Async & Runtime coding',
          kind: 'coding',
          route: '/javascript/coding/js-debounce',
          priorityScore: 86,
          source: 'essential-60',
          solved: 0,
          target: 3,
          available: 8,
          questions: [
            {
              id: 'js-debounce',
              title: 'Debounce Function',
              route: '/javascript/coding/js-debounce',
              access: 'free',
              difficulty: 'intermediate',
              importanceScore: 86,
              essentialRank: 24,
              rationale: 'Cancellation and stale response handling appear in realistic UI interviews.',
              feedback: {
                status: 'needs-review',
                attempts: 3,
                passRate: 0.33,
                category: 'async-promise-mismatch',
                lang: 'js',
                latestAt: '2026-02-09T10:00:00.000Z',
              },
            },
            {
              id: 'js-promise-all',
              title: 'Implement Promise.all',
              route: '/javascript/coding/js-promise-all',
              access: 'premium',
              difficulty: 'hard',
              importanceScore: 78,
              essentialRank: 42,
              rationale: 'Caching work checks async state and failure handling.',
            },
          ],
        },
        {
          id: 'concepts:js-async-runtime',
          label: 'Async & Runtime concepts',
          kind: 'concepts',
          route: '/javascript/trivia/js-promises-async-await',
          priorityScore: 72,
          source: 'essential-60',
          solved: 1,
          target: 5,
          available: 6,
          questions: [
            {
              id: 'js-promises-async-await',
              title: 'Promises and async/await',
              route: '/javascript/trivia/js-promises-async-await',
              access: 'free',
              difficulty: 'intermediate',
              importanceScore: 72,
              essentialRank: 50,
            },
          ],
        },
        {
          id: 'coding:js-objects-prototypes',
          label: 'Objects & Prototypes coding',
          kind: 'coding',
          route: '/javascript/coding/js-object-create',
          priorityScore: 68,
          source: 'catalog',
          solved: 1,
          target: 3,
          available: 6,
          questions: [
            {
              id: 'js-object-create',
              title: 'Create Object with Prototype',
              route: '/javascript/coding/js-object-create',
              access: 'free',
              difficulty: 'intermediate',
            },
          ],
        },
        {
          id: 'concepts:js-functions-scope',
          label: 'Functions & Scope concepts',
          kind: 'concepts',
          route: '/javascript/trivia/js-closures',
          priorityScore: 65,
          source: 'catalog',
          solved: 0,
          target: 5,
          available: 5,
          questions: [
            {
              id: 'js-closures',
              title: 'Explain Closures in JavaScript',
              route: '/javascript/trivia/js-closures',
              access: 'premium',
              difficulty: 'hard',
            },
          ],
        },
      ],
      feedback: {
        windowDays: 45,
        summary: 'Recent test runs found 1 issue to review.',
        weakSignals: [
          {
            id: 'coding:js-async-runtime:js-debounce:async-promise-mismatch',
            kind: 'coding',
            bucket: 'js-async-runtime',
            bucketLabel: 'Async & Runtime',
            label: 'Async & Runtime · Debounce Function',
            severity: 'high',
            attempts: 3,
            failRuns: 2,
            passRate: 0.33,
            latestAt: '2026-02-09T10:00:00.000Z',
            category: 'async-promise-mismatch',
            lang: 'js',
            questionId: 'js-debounce',
            route: '/javascript/coding/js-debounce',
            accessible: true,
            access: 'free',
            reason: 'Recent runs show Async Promise Mismatch in Async & Runtime.',
          },
        ],
        strengthSignals: [],
      },
      nextDrill: {
        title: 'Debounce Function',
        route: '/javascript/coding/js-debounce',
        family: 'question',
        reason: 'Recent runs show Async Promise Mismatch in Async & Runtime.',
        cta: 'Review coding drill',
      },
    },
    settings: {
      weeklyGoalEnabled: true,
      weeklyGoalTarget: 10,
      showStreakWidget: true,
      dailyChallengeTech: 'auto',
    },
    ...overrides,
  });

  beforeEach(async () => {
    loggedIn = true;
    user = { stats: { streak: { current: 2 } } };
    solvedIds = ['react-counter'];
    currentDashboardPayload = buildPayload();

    sessionStorage.clear();

    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadQuestionSummaries',
      'loadSystemDesign',
    ]);
    questionService.loadAllQuestionSummaries.and.returnValue(of([]));
    questionService.loadQuestionSummaries.and.returnValue(of([]));
    questionService.loadSystemDesign.and.returnValue(of([]));

    const authServiceStub = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.callFake(() => loggedIn),
      user: jasmine.createSpy('user').and.callFake(() => user),
    };

    const progressServiceStub = {
      solvedIds: jasmine.createSpy('solvedIds').and.callFake(() => solvedIds),
    };

    const activityServiceStub = {
      summarySig: signal<any>(null),
      activityCompleted$: new Subject<any>(),
      getSummary: jasmine.createSpy('getSummary').and.returnValue(of(null)),
    };

    incidentService = jasmine.createSpyObj<IncidentService>('IncidentService', ['loadIncidentIndex']);
    incidentService.loadIncidentIndex.and.returnValue(of([]));

    tradeoffBattleService = jasmine.createSpyObj<TradeoffBattleService>('TradeoffBattleService', ['loadIndex']);
    tradeoffBattleService.loadIndex.and.returnValue(of([]));

    gamification = jasmine.createSpyObj<GamificationService>('GamificationService', [
      'getDashboard',
      'completeDailyChallenge',
      'updateWeeklyGoal',
      'updatePrepGoal',
    ]);
    gamification.getDashboard.and.callFake(() => of(currentDashboardPayload));
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
    gamification.updatePrepGoal.and.returnValue(of({
      goal: { tech: 'javascript', level: 'senior', label: 'JavaScript senior prep' },
    }));

    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: QuestionService, useValue: questionService },
        { provide: AuthService, useValue: authServiceStub },
        { provide: UserProgressService, useValue: progressServiceStub },
        { provide: ActivityService, useValue: activityServiceStub },
        { provide: GamificationService, useValue: gamification },
        { provide: AnalyticsService, useValue: analytics },
        { provide: IncidentService, useValue: incidentService },
        { provide: TradeoffBattleService, useValue: tradeoffBattleService },
      ],
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<DashboardComponent> {
    const nextFixture = TestBed.createComponent(DashboardComponent);
    nextFixture.detectChanges();
    return nextFixture;
  }

  it('renders the guest dashboard with one featured route, three secondary rows, and lower-tier practice links', () => {
    loggedIn = false;
    user = null;
    solvedIds = [];

    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    const featured = page.querySelector('[data-testid="dashboard-guest-featured-route"]') as HTMLElement | null;
    const primaryCta = page.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement | null;
    const secondaryRoutes = Array.from(
      page.querySelectorAll('[data-testid="dashboard-guest-secondary-route"]'),
    ) as HTMLElement[];
    const pageText = page.textContent || '';

    expect(pageText).toContain('Interview prep path');
    expect(pageText).toContain('Start with the 60 most useful questions');
    expect(pageText).toContain('Start with 60 focused frontend interview questions');
    expect(pageText).toContain('Use the guide if you want to understand the interview flow before practicing.');
    expect(pageText).toContain('Frontend interview preparation guide');
    expect(pageText).toContain('FrontendAtlas Essential 60');
    expect(pageText).toContain('Study plans');
    expect(pageText).toContain('Final-round prep');
    expect(pageText).toContain('More ways to practice');
    expect(pageText).toContain('Come back to these later');
    expect(pageText).toContain('Sign in to keep your progress');
    expect(pageText).not.toContain('Today’s practice');
    expect(pageText).not.toContain('Progress snapshot');
    expect(pageText).not.toContain('Next action');
    expect(pageText).not.toContain('Explore more ways to prep');
    expect(pageText).not.toContain('Coverage map');
    expect(featured?.textContent || '').toContain('Recommended start');
    expect(featured?.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(featured?.textContent || '').toContain('Practice JavaScript, UI coding, system design, and concepts in one focused set.');
    expect(featured?.textContent || '').not.toContain('Frontend interview preparation guide');
    expect(primaryCta?.textContent?.trim()).toBe('Open Essential 60');
    expect(primaryCta?.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(page.querySelector('[data-testid="dashboard-guest-progress-card"]')).toBeTruthy();
    expect(page.querySelector('[data-testid="dashboard-progress-snapshot"]')).toBeFalsy();
    expect(secondaryRoutes.length).toBe(3);
    expect(secondaryRoutes[0].textContent || '').toContain('Frontend interview preparation guide');
    expect(secondaryRoutes[0].textContent || '').toContain(
      'Use this first if you want to understand the interview flow before practicing.',
    );
    expect(secondaryRoutes[0].textContent || '').toContain('Read first if unsure');
    expect(secondaryRoutes[1].textContent || '').toContain(
      'Use a weekly path when you do not want to choose each question yourself.',
    );
    expect(secondaryRoutes[2].textContent || '').toContain(
      'Add this when system design, behavioral, or company-style follow-ups matter.',
    );
    expect(page.querySelectorAll('[data-testid="dashboard-guest-practice-link"]').length).toBe(4);
    expect(page.querySelectorAll('[data-testid="dashboard-guest-related-link"]').length).toBe(3);

    const fitPills = Array.from(page.querySelectorAll('[data-testid="dashboard-route-fit-pill"]')) as HTMLElement[];
    expect(fitPills.map((pill) => pill.textContent?.trim())).toEqual([
      'Recommended start',
      'Read first if unsure',
      'Structured path',
      'Final rounds',
      'Implementation drill',
      'Verbal practice',
      'Debug practice',
      'Senior practice',
    ]);
    expect(fitPills.every((pill) => pill.tagName.toLowerCase() === 'span')).toBeTrue();
    expect(Array.from(page.querySelectorAll('[data-testid="dashboard-guest-related-link"]')).some((link) =>
      Boolean(link.querySelector('[data-testid="dashboard-route-fit-pill"]')),
    )).toBeFalse();
  });

  it('keeps novice logged-in users in the launch-first layout', () => {
    solvedIds = ['react-counter', 'react-closures'];
    currentDashboardPayload = buildPayload({
      progress: {
        ...buildPayload().progress,
        practice: {
          completedCount: 2,
          totalCount: 66,
          completedPercent: 3,
        },
      },
    });

    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement | null;
    const pageText = page.textContent || '';

    expect(pageText).toContain('Start your first focused practice');
    expect(pageText).toContain(
      'Start with one Essential 60 question. After a few completed items, the dashboard will show badges, streaks, and recommendations.',
    );
    expect(primaryCta?.textContent?.trim()).toBe('Open Essential 60');
    expect(primaryCta?.getAttribute('href') || '').toContain('/interview-questions/essential');
    primaryCta?.click();
    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_primary_cta_clicked',
      jasmine.objectContaining({ mode: 'novice', action_id: 'novice_essential_60', route: '/interview-questions/essential' }),
    );
    expect(pageText).not.toContain('Progress snapshot');
    expect(page.querySelector('[data-testid="dashboard-progress-snapshot"]')).toBeFalsy();
  });

  it('shows the established layout with recommended CTA and compact progress snapshot', () => {
    solvedIds = ['react-counter', 'react-closures', 'js-event-loop'];
    currentDashboardPayload = buildPayload();

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement | null;
    const historyLink = page.querySelector('[data-testid="dashboard-progress-history"]') as HTMLAnchorElement | null;
    const pageText = page.textContent || '';

    expect(primaryCta?.textContent?.trim()).toBe('Open challenge');
    expect(pageText).toContain('Recommended now');
    expect(pageText).toContain(
      'Your next practice item is ready. Use the library only when you need a different format.',
    );
    expect(pageText).toContain('Progress snapshot');
    expect(pageText).toContain('JavaScript interview readiness');
    expect(pageText).toContain('JavaScript intermediate prep');
    expect(pageText).toContain('Badges');
    expect(pageText).toContain('3/7');
    expect(pageText).toContain('First Steps');
    expect(pageText).toContain('Coverage Builder');
    expect(pageText).toContain('Complete today’s daily challenge');
    expect(pageText).not.toContain('Next action');
    expect(pageText).not.toContain('Explore more ways to prep');
    expect(historyLink?.getAttribute('href') || '').toContain('/profile');
    expect(page.querySelector('[data-testid="dashboard-badge-summary"]')).toBeTruthy();
    const badgeMedallions = Array.from(page.querySelectorAll('[data-testid="dashboard-badge-medallion"]')) as HTMLElement[];
    expect(badgeMedallions.length).toBe(3);
    expect(badgeMedallions[0].getAttribute('data-theme')).toBe('gold');
    expect(badgeMedallions[0].getAttribute('data-badge-id')).toBe('first-steps');
    expect(badgeMedallions[0].querySelector('.badge-medallion__motif')).toBeTruthy();
    expect(badgeMedallions[0].querySelector('app-fa-glyph')).toBeTruthy();
    const nextMedallion = page.querySelector('[data-testid="dashboard-next-badge-medallion"]') as HTMLElement | null;
    expect(nextMedallion?.getAttribute('data-theme')).toBe('blue');
    expect(nextMedallion?.getAttribute('data-badge-id')).toBe('coverage-builder');
    expect(nextMedallion?.querySelector('.badge-medallion__motif')).toBeTruthy();
    expect(nextMedallion?.querySelector('app-fa-glyph')).toBeTruthy();
    expect(Number.parseFloat(nextMedallion?.style.getPropertyValue('--badge-progress') || '0')).toBeCloseTo(56, 5);
  });

  it('renders the prep readiness card with weakness and next drill CTA', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const card = page.querySelector('[data-testid="dashboard-prep-loop"]') as HTMLElement | null;
    const nextDrill = page.querySelector('[data-testid="dashboard-prep-next-drill"]') as HTMLAnchorElement | null;

    expect(card).toBeTruthy();
    expect(page.querySelector('[data-testid="dashboard-prep-score"]')?.textContent?.trim()).toBe('64');
    expect(page.querySelector('[data-testid="dashboard-prep-band"]')?.textContent?.trim()).toBe('Developing');
    expect(page.querySelector('[data-testid="dashboard-prep-goal-label"]')?.textContent).toContain('JavaScript intermediate prep');
    expect(card?.textContent || '').toContain('This score is based on recent practice, not a guarantee.');
    expect(card?.textContent || '').not.toContain('React, HTML, CSS, and framework practice stay in library progress but do not change this score.');
    expect(card?.textContent || '').not.toContain('Intermediate JavaScript target: 12 coding, 20 concepts, 1 currently available JS debug scenario, 3 JS tradeoffs, 6 intermediate/hard drills.');
    expect(card?.textContent || '').not.toContain('HTML/CSS readiness focuses on concept coverage plus debug, tradeoff, and consistency signals.');
    expect(card?.textContent || '').toContain('Weakest now: Tradeoff practice · 1/3');
    expect(card?.textContent || '').toContain('Score limited: Broaden JavaScript coding beyond Data Transforms.');
    expect(card?.textContent || '').toContain('Topics to strengthen');
    expect(card?.textContent || '').toContain('Async & Runtime coding');
    expect(card?.textContent || '').not.toContain('Target stack');
    expect(card?.textContent || '').toContain('Target settings');
    expect(card?.textContent || '').not.toContain('Target level');
    expect(card?.textContent || '').toContain('Recent feedback');
    expect(card?.textContent || '').toContain('Recent test runs found 1 issue to review.');
    expect(card?.textContent || '').not.toContain('JS tests');
    expect(card?.textContent || '').toContain('Debounce Function');
    expect(nextDrill?.textContent?.trim()).toBe('Review coding drill');
    expect(nextDrill?.getAttribute('href') || '').toContain('/javascript/coding/js-debounce');

    (page.querySelector('[data-testid="dashboard-prep-feedback-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(card?.textContent || '').toContain('JS tests');
    expect(card?.textContent || '').toContain('Async Promise Mismatch');
  });

  it('expands score breakdown details on demand', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent || '';
    expect(text).not.toContain('5 solved · 4 counted');
    expect(text).not.toContain('React, HTML, CSS, and framework practice stay in library progress but do not change this score.');

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-breakdown-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    text = fixture.nativeElement.textContent || '';
    expect(text).toContain('5 solved · 4 counted');
    expect(text).toContain('React, HTML, CSS, and framework practice stay in library progress but do not change this score.');
    expect(text).toContain('Intermediate JavaScript target: 12 coding, 20 concepts, 1 currently available JS debug scenario, 3 JS tradeoffs, 6 intermediate/hard drills.');
  });

  it('keeps the prep card stable for an old non-JavaScript prep payload', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.goal = {
      tech: 'html',
      level: 'foundation',
      label: 'HTML foundation prep',
    };
    prepLoop.targetProfile = {
      label: 'Foundation',
      summary: 'Foundation target: 12 concepts, 1 debug, 1 tradeoff.',
      targets: {
        concepts: 12,
        debug: 1,
        tradeoffs: 1,
      },
      breadth: {
        concepts: 3,
      },
      difficulty: {},
      conceptOnly: true,
    };
    prepLoop.readiness = {
      score: 67,
      band: 'Developing',
      components: [
        {
          id: 'concepts',
          label: 'HTML concepts',
          score: 37,
          max: 55,
          current: 8,
          effectiveCurrent: 8,
          target: 12,
          percent: 8 / 12,
          route: '/html/interview-questions',
        },
        {
          id: 'debug',
          label: 'Debug practice',
          score: 15,
          max: 15,
          current: 1,
          target: 1,
          percent: 1,
          route: '/incidents',
        },
        {
          id: 'tradeoffs',
          label: 'Tradeoff practice',
          score: 0,
          max: 15,
          current: 0,
          target: 1,
          percent: 0,
          route: '/tradeoffs',
        },
        {
          id: 'consistency',
          label: 'Weekly consistency',
          score: 15,
          max: 15,
          current: 10,
          target: 10,
          percent: 1,
          route: '/dashboard',
        },
      ],
    };
    prepLoop.weaknesses = [prepLoop.readiness.components[2], prepLoop.readiness.components[1]];
    prepLoop.coverageGaps = [
      {
        id: 'concepts:html-semantics-a11y',
        label: 'Semantics & Accessibility concepts',
        kind: 'concepts',
        route: '/html/trivia/html-aria-roles',
        priorityScore: 81,
        source: 'essential-60',
        solved: 0,
        target: 5,
        available: 9,
        questions: [
          {
            id: 'html-aria-roles',
            title: 'What are ARIA roles and why are they important in modern HTML?',
            route: '/html/trivia/html-aria-roles',
            access: 'free',
            difficulty: 'intermediate',
            importanceScore: 81,
            essentialRank: 18,
          },
        ],
      },
    ];
    delete prepLoop.feedback;
    prepLoop.nextDrill = {
      title: 'What are ARIA roles and why are they important in modern HTML?',
      route: '/html/trivia/html-aria-roles',
      family: 'question',
      reason: 'Improve HTML explanations in Semantics & Accessibility.',
      cta: 'Open concept drill',
    };
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-loop"]') as HTMLElement | null;
    const text = card?.textContent || '';
    expect(text).toContain('HTML foundation prep');
    expect(text).not.toContain('HTML/CSS readiness focuses on concept coverage plus debug, tradeoff, and consistency signals.');
    expect(text).not.toContain('HTML concepts');
    expect(text).not.toContain('Foundation target: 12 concepts, 1 debug, 1 tradeoff.');
    expect(text).not.toContain('HTML coding');
    expect(text).toContain('Semantics & Accessibility concepts');
    expect(text).not.toContain('Target stack');
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-prep-feedback"]')).toBeFalsy();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-breakdown-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const expandedText = card?.textContent || '';
    expect(expandedText).toContain('HTML concepts');
    expect(expandedText).toContain('Foundation target: 12 concepts, 1 debug, 1 tradeoff.');
    expect(expandedText).toContain('8/12');

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-panel"]') as HTMLElement | null;
    const row = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-question"]') as HTMLAnchorElement | null;
    expect(panel?.textContent || '').toContain('What are ARIA roles');
    expect(row?.getAttribute('href') || '').toContain('/html/trivia/html-aria-roles');
  });

  it('opens coverage topic details without navigating from the chip', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const firstChip = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-chip"]') as HTMLButtonElement;
    expect(firstChip.getAttribute('href')).toBeNull();
    firstChip.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-panel"]') as HTMLElement | null;
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="dashboard-prep-gap-question"]') as NodeListOf<HTMLAnchorElement>;
    expect(panel?.textContent || '').toContain('Async & Runtime coding');
    expect(panel?.textContent || '').toContain('0 / 3 counted');
    expect(panel?.textContent || '').toContain('Essential 60 priority');
    expect(panel?.textContent || '').toContain('Debounce Function');
    expect(panel?.textContent || '').toContain('Needs review');
    expect(panel?.textContent || '').toContain('JS tests · 3 recent runs');
    expect(panel?.textContent || '').toContain('33% pass rate');
    expect(panel?.textContent || '').toContain('Premium');
    expect(rows[0]?.getAttribute('href') || '').toContain('/javascript/coding/js-debounce');
  });

  it('renders framework feedback source labels', () => {
    const cases = [
      { lang: 'react', label: 'React checks' },
      { lang: 'angular', label: 'Angular checks' },
      { lang: 'vue', label: 'Vue checks' },
    ];

    for (const item of cases) {
      const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
      prepLoop.feedback.weakSignals[0].lang = item.lang;
      prepLoop.coverageGaps[0].questions[0].feedback.lang = item.lang;
      currentDashboardPayload = buildPayload({ prepLoop });

      fixture = createComponent();
      fixture.componentInstance.gamificationState.set(currentDashboardPayload);
      fixture.detectChanges();

      const firstChip = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-chip"]') as HTMLButtonElement;
      firstChip.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent || '').toContain(item.label);
      fixture.destroy();
    }
  });

  it('falls back feedback signals to the recommended drill when the failed question is inaccessible', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.feedback.weakSignals[0].route = undefined;
    prepLoop.feedback.weakSignals[0].accessible = false;
    prepLoop.feedback.weakSignals[0].access = 'premium';
    prepLoop.feedback.weakSignals[0].questionId = 'js-promise-all';
    prepLoop.feedback.weakSignals[0].label = 'Async & Runtime · Implement Promise.all';
    prepLoop.nextDrill = {
      title: 'Debounce Function',
      route: '/javascript/coding/js-debounce',
      family: 'question',
      reason: 'Build JavaScript coding coverage in Async & Runtime.',
      cta: 'Start coding drill',
    };
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-feedback-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const signal = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-feedback-signal"]') as HTMLAnchorElement | null;
    expect(signal?.getAttribute('href') || '').toContain('/javascript/coding/js-debounce');
    expect(signal?.textContent || '').toContain('Premium');
  });

  it('keeps the prep card stable when feedback fields are missing', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    delete prepLoop.targetProfile;
    delete prepLoop.feedback;
    delete prepLoop.readiness.components[0].feedback;
    delete prepLoop.coverageGaps[0].questions[0].feedback;
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const pageText = fixture.nativeElement.textContent || '';
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-prep-loop"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-prep-feedback"]')).toBeFalsy();
    expect(pageText).toContain('Topics to strengthen');
    expect(pageText).toContain('Debounce Function');
  });

  it('expands and collapses all coverage topics', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Show all coverage topics (4)');
    expect(text).not.toContain('Functions & Scope concepts');

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Show fewer');
    expect(text).toContain('Functions & Scope concepts');

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-gap-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Show all coverage topics (4)');
    expect(text).not.toContain('Functions & Scope concepts');
  });

  it('explains low prep readiness when components are empty', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.readiness.score = 8;
    prepLoop.readiness.band = 'Starting';
    prepLoop.readiness.cap = undefined;
    prepLoop.readiness.components = prepLoop.readiness.components.map((component: any) => {
      if (component.id === 'coding') {
        return {
          ...component,
          score: 8,
          current: 3,
          effectiveCurrent: 3,
          percent: 3 / 12,
        };
      }
      return {
        ...component,
        score: 0,
        current: 0,
        effectiveCurrent: undefined,
        percent: 0,
      };
    });
    prepLoop.weaknesses = [
      prepLoop.readiness.components.find((component: any) => component.id === 'concepts'),
      prepLoop.readiness.components.find((component: any) => component.id === 'debug'),
    ];
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Score is low because concepts, debug, tradeoffs, and weekly consistency are empty.');
    expect(text).not.toContain('breadth capped');
  });

  it('asks users to refresh stale readiness evidence', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.readiness.score = 38;
    prepLoop.readiness.band = 'Starting';
    prepLoop.readiness.components = prepLoop.readiness.components.map((component: any) => {
      if (component.id === 'coding') {
        return {
          ...component,
          current: 12,
          effectiveCurrent: 0,
          score: 0,
          percent: 0,
          freshness: {
            fresh: 0,
            aging: 0,
            stale: 12,
            latestAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };
      }
      return component;
    });
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-breakdown-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('12 solved · 0 counted');
    expect(text).toContain('Refresh older practice to verify readiness.');
  });

  it('shows fractional counted progress as an approximate whole number', () => {
    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.readiness.components = prepLoop.readiness.components.map((component: any) => {
      if (component.id === 'coding') {
        return {
          ...component,
          current: 12,
          effectiveCurrent: 4.8,
          score: 12,
          percent: 4.8 / 12,
          freshness: {
            fresh: 0,
            aging: 0,
            stale: 12,
            latestAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };
      }
      return component;
    });
    currentDashboardPayload = buildPayload({ prepLoop });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-breakdown-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('12 solved · about 5 counted');
    expect(text).toContain('Older practice is partially counted. Refresh it to verify readiness.');
  });

  it('saves prep goal selections and refreshes dashboard', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-target-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const levelSelect = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-level"]') as HTMLSelectElement;
    levelSelect.value = 'senior';
    levelSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-tech"]')).toBeFalsy();
    expect(fixture.nativeElement.textContent || '').toContain('Unsaved level change. Save to recalculate readiness.');
    expect((fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-save"]') as HTMLButtonElement).textContent?.trim()).toBe('Save target');

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-save"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(gamification.updatePrepGoal).toHaveBeenCalledWith({ level: 'senior' });
    expect(analytics.track).toHaveBeenCalledWith(
      'prep_goal_saved',
      jasmine.objectContaining({ tech: 'javascript', level: 'senior', surface: 'dashboard' }),
    );
    expect(gamification.getDashboard).toHaveBeenCalledWith({ force: true });
    expect(fixture.nativeElement.textContent || '').toContain('Target saved. Readiness recalculated for Senior expectations.');
  });

  it('locks the target level during save and keeps the saved level for the success state', () => {
    const save$ = new Subject<{ goal: { tech: 'javascript'; level: 'senior'; label: string } }>();
    gamification.updatePrepGoal.and.returnValue(save$.asObservable());
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-prep-target-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const levelSelect = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-level"]') as HTMLSelectElement;
    const saveButton = fixture.nativeElement.querySelector('[data-testid="dashboard-prep-goal-save"]') as HTMLButtonElement;
    levelSelect.value = 'senior';
    levelSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    saveButton.click();
    fixture.detectChanges();

    expect(levelSelect.disabled).toBeTrue();
    levelSelect.value = 'foundation';
    levelSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.prepGoalLevel()).toBe('senior');

    const prepLoop = JSON.parse(JSON.stringify(buildPayload().prepLoop));
    prepLoop.goal.level = 'senior';
    prepLoop.goal.label = 'JavaScript senior prep';
    currentDashboardPayload = buildPayload({ prepLoop });
    save$.next({ goal: { tech: 'javascript', level: 'senior', label: 'JavaScript senior prep' } });
    save$.complete();
    fixture.detectChanges();

    expect(fixture.componentInstance.prepGoalLevel()).toBe('senior');
    expect(fixture.nativeElement.textContent || '').toContain('Target saved. Readiness recalculated for Senior expectations.');
  });

  it('keeps dashboard stable when prepLoop is missing', () => {
    currentDashboardPayload = buildPayload({ prepLoop: undefined });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-prep-loop"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-page"]')).toBeTruthy();
  });

  it('shows the dashboard badge empty state when no badges are unlocked yet', () => {
    solvedIds = ['react-counter', 'react-closures', 'js-event-loop'];
    currentDashboardPayload = buildPayload({
      achievements: {
        summary: { unlockedCount: 0, totalCount: 7 },
        unlocked: [],
        next: [
          {
            id: 'first-steps',
            title: 'First Steps',
            reason: 'Complete 3 practice units.',
            icon: 'flag',
            theme: 'gold',
            current: 2,
            target: 3,
            progress: 2 / 3,
            unlocked: false,
          },
        ],
      },
    });

    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const pageText = fixture.nativeElement.textContent || '';
    expect(pageText).toContain('0/7');
    expect(pageText).toContain('Complete 3 practice units to earn your first badge.');
    expect(pageText).toContain('First Steps');
    expect(pageText).toContain('2/3');
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-badge-medallion"]')).toBeFalsy();
    const nextMedallion = fixture.nativeElement.querySelector('[data-testid="dashboard-next-badge-medallion"]') as HTMLElement | null;
    expect(nextMedallion).toBeTruthy();
    expect(Number.parseFloat(nextMedallion?.style.getPropertyValue('--badge-progress') || '0')).toBeCloseTo(66.67, 1);
  });

  it('renders exactly five compact library links with the expected destinations', () => {
    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    const links = Array.from(page.querySelectorAll('[data-testid="dashboard-library-link"]')) as HTMLAnchorElement[];
    const destinations = links.map((link) => link.getAttribute('data-destination'));
    const hrefs = links.map((link) => link.getAttribute('href') || '');

    expect(links.length).toBe(5);
    expect(destinations).toEqual([
      'essential_60',
      'question_library',
      'sprints',
      'companies',
      'tech_lanes',
    ]);
    expect(hrefs[0]).toContain('/interview-questions/essential');
    expect(hrefs[1]).toContain('/coding');
    expect(hrefs[2]).toContain('/tracks');
    expect(hrefs[3]).toContain('/companies');
    expect(hrefs[4]).toContain('/focus-areas');

    const fitPills = links.map((link) =>
      link.querySelector('[data-testid="dashboard-route-fit-pill"]')?.textContent?.trim()
    );
    expect(fitPills).toEqual([
      'Start here',
      'Full library',
      'Structured path',
      'Targeted prep',
      'Weak spot focus',
    ]);
  });

  it('tracks guest secondary-route clicks with the shared dashboard link event', () => {
    loggedIn = false;
    user = null;
    solvedIds = [];

    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    (page.querySelector('[data-testid="dashboard-guest-secondary-route"]') as HTMLAnchorElement).click();

    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_library_link_clicked',
      jasmine.objectContaining({ destination: 'interview_blueprint', section: 'guest_secondary', mode: 'guest' }),
    );
  });

  it('tracks primary CTA, snapshot, and library interactions with the new events', () => {
    solvedIds = ['react-counter', 'react-closures', 'js-event-loop'];
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    (page.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement).click();
    (page.querySelector('[data-testid="dashboard-progress-history"]') as HTMLAnchorElement).click();
    (page.querySelectorAll('[data-testid="dashboard-library-link"]')[1] as HTMLAnchorElement).click();

    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_primary_cta_clicked',
      jasmine.objectContaining({ mode: 'established', action_id: 'daily_challenge' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_progress_snapshot_clicked',
      jasmine.objectContaining({ destination: 'profile' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_library_link_clicked',
      jasmine.objectContaining({ destination: 'question_library' }),
    );
  });

  it('tracks the guest featured CTA as the Essential 60 entry lane', () => {
    loggedIn = false;
    user = null;
    solvedIds = [];

    fixture = createComponent();

    (fixture.nativeElement.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement).click();

    expect(analytics.track).toHaveBeenCalledWith(
      'dashboard_primary_cta_clicked',
      jasmine.objectContaining({ mode: 'guest', action_id: 'guest_essential_60', route: '/interview-questions/essential' }),
    );
  });

  it('marks the daily challenge complete from the dashboard card', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    fixture.componentInstance.markDailyChallengeComplete();
    fixture.detectChanges();

    expect(gamification.completeDailyChallenge).toHaveBeenCalledWith('react-counter');
    expect(fixture.nativeElement.textContent || '').toContain('Today’s practice completed.');
  });

  it('saves daily challenge tech preference with weekly settings payload', () => {
    fixture = createComponent();
    const component = fixture.componentInstance;

    component.openManageProgress();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select[aria-label="Today\'s practice framework"]') as HTMLSelectElement | null;
    expect(select).toBeTruthy();

    if (select) {
      select.value = 'react';
      select.dispatchEvent(new Event('change'));
    }

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const saveButton = buttons.find((button) =>
      (button.textContent || '').includes('Save settings')
    );

    saveButton?.click();

    expect(gamification.updateWeeklyGoal).toHaveBeenCalledWith(
      jasmine.objectContaining({ dailyChallengeTech: 'react' }),
    );
  });

  it('does not call the removed heavy dashboard catalog loaders', () => {
    fixture = createComponent();

    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
    expect(incidentService.loadIncidentIndex).not.toHaveBeenCalled();
    expect(tradeoffBattleService.loadIndex).not.toHaveBeenCalled();
  });
});
