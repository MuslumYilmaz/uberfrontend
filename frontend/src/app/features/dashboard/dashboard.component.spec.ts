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
    const primaryCta = page.querySelector('[data-testid="dashboard-primary-cta"]') as HTMLAnchorElement | null;
    const pageText = page.textContent || '';

    expect(pageText).toContain('Browse prep library');
    expect(pageText).toContain('Start with one clear prep route');
    expect(pageText).toContain('Question Library');
    expect(pageText).toContain('Follow a study plan');
    expect(pageText).toContain('Pick your framework path');
    expect(pageText).toContain('Prepare system design');
    expect(pageText).toContain('More ways to practice');
    expect(pageText).toContain('Also prepare for');
    expect(pageText).toContain('Sign in when you want progress to stick');
    expect(pageText).not.toContain('Today’s prep loop');
    expect(pageText).not.toContain('Progress snapshot');
    expect(pageText).not.toContain('Next action');
    expect(pageText).not.toContain('Explore more ways to prep');
    expect(pageText).not.toContain('Coverage map');
    expect(primaryCta?.textContent?.trim()).toBe('Question Library');
    expect(primaryCta?.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(page.querySelector('[data-testid="dashboard-guest-progress-card"]')).toBeTruthy();
    expect(page.querySelector('[data-testid="dashboard-progress-snapshot"]')).toBeFalsy();
    expect(page.querySelectorAll('[data-testid="dashboard-guest-secondary-route"]').length).toBe(3);
    expect(page.querySelectorAll('[data-testid="dashboard-guest-practice-link"]').length).toBe(4);
    expect(page.querySelectorAll('[data-testid="dashboard-guest-related-link"]').length).toBe(3);
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

    expect(primaryCta?.textContent?.trim()).toBe('Start one question');
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
    expect(pageText).toContain('Progress snapshot');
    expect(pageText).toContain('Complete today’s daily challenge');
    expect(pageText).not.toContain('Next action');
    expect(pageText).not.toContain('Explore more ways to prep');
    expect(historyLink?.getAttribute('href') || '').toContain('/profile');
  });

  it('renders exactly four compact library links with the expected destinations', () => {
    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    const links = Array.from(page.querySelectorAll('[data-testid="dashboard-library-link"]')) as HTMLAnchorElement[];
    const destinations = links.map((link) => link.getAttribute('data-destination'));
    const hrefs = links.map((link) => link.getAttribute('href') || '');

    expect(links.length).toBe(4);
    expect(destinations).toEqual([
      'question_library',
      'sprints',
      'companies',
      'tech_lanes',
    ]);
    expect(hrefs[0]).toContain('/coding?reset=1');
    expect(hrefs[1]).toContain('/tracks');
    expect(hrefs[2]).toContain('/companies');
    expect(hrefs[3]).toContain('/focus-areas');
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
      jasmine.objectContaining({ destination: 'sprints', section: 'guest_secondary', mode: 'guest' }),
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
    (page.querySelector('[data-testid="dashboard-library-link"]') as HTMLAnchorElement).click();

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

  it('marks the daily challenge complete from the dashboard card', () => {
    fixture = createComponent();
    fixture.componentInstance.gamificationState.set(currentDashboardPayload);
    fixture.detectChanges();

    fixture.componentInstance.markDailyChallengeComplete();
    fixture.detectChanges();

    expect(gamification.completeDailyChallenge).toHaveBeenCalledWith('react-counter');
    expect(fixture.nativeElement.textContent || '').toContain('Today’s rep completed.');
  });

  it('saves daily challenge tech preference with weekly settings payload', () => {
    fixture = createComponent();
    const component = fixture.componentInstance;

    component.openManageProgress();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select[aria-label="Today\'s rep framework"]') as HTMLSelectElement | null;
    expect(select).toBeTruthy();

    if (select) {
      select.value = 'react';
      select.dispatchEvent(new Event('change'));
    }

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const saveButton = buttons.find((button) =>
      (button.textContent || '').includes('Save loop settings')
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
