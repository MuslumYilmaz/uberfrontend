import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { DashboardGamificationResponse } from '../../core/models/gamification.model';
import { ActivityService } from '../../core/services/activity.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { QuestionService } from '../../core/services/question.service';
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
      solvedCount: 12,
      totalCount: 60,
      solvedPercent: 20,
      topTopics: [
        { topic: 'state', label: 'State', solved: 4, total: 8, percent: 50 },
        { topic: 'events', label: 'Events', solved: 3, total: 9, percent: 33 },
      ],
    },
    settings: {
      showStreakWidget: true,
      dailyChallengeTech: 'auto',
    },
  };

  beforeEach(async () => {
    const questionServiceStub = {
      loadAllQuestions: jasmine.createSpy('loadAllQuestions').and.callFake((kind: string) => {
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
      settings: { showStreakWidget: true, dailyChallengeTech: 'auto' },
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders key gamification widgets', () => {
    const pageText = fixture.nativeElement.textContent || '';
    expect(pageText).toContain('Next best action');
    expect(pageText).toContain('Daily challenge');
    expect(pageText).toContain('Weekly goal');
    expect(pageText).toContain('XP + level');
    expect(pageText).toContain('Progress');
  });

  it('renders focus areas browse action linking to /focus-areas', () => {
    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('[data-testid="dashboard-focus-areas-link"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href') || '').toContain('/focus-areas');
  });

  it('marks daily challenge complete from dashboard card', () => {
    const component = fixture.componentInstance;
    component.markDailyChallengeComplete();
    fixture.detectChanges();

    expect(gamification.completeDailyChallenge).toHaveBeenCalledWith('react-counter');
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
});
