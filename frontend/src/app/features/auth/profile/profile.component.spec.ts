import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardGamificationResponse } from '../../../core/models/gamification.model';
import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { SolvedQuestionsService } from '../../../core/services/solved-questions.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let gamification: jasmine.SpyObj<GamificationService>;
  let solvedQuestions: jasmine.SpyObj<SolvedQuestionsService>;
  const userSig = signal<any>({
    _id: 'user-1',
    username: 'badge_user',
    email: 'badge@example.com',
    role: 'user',
    prefs: {},
    stats: { xpTotal: 420, completedTotal: 14, streak: { current: 2, longest: 4, lastActiveUTCDate: null } },
    billing: { pro: { status: 'none' }, projects: { status: 'none' } },
    coupons: [],
    solvedQuestionIds: ['react-counter'],
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  const solvedIdsSig = signal<string[]>(['react-counter']);

  const dashboardPayload: DashboardGamificationResponse = {
    nextBestAction: {
      id: 'weekly_goal',
      title: 'Move your weekly goal forward',
      description: 'You are at 4/10. One solved question moves this forward.',
      route: '/coding',
      cta: 'Continue practice',
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
        solvedCount: 9,
        totalCount: 60,
        solvedPercent: 15,
        topTopics: [],
      },
      incidents: {
        passedCount: 1,
        totalCount: 6,
        passedPercent: 17,
      },
      tradeoffBattles: {
        completedCount: 0,
        totalCount: 5,
        completedPercent: 0,
      },
      practice: {
        completedCount: 10,
        totalCount: 71,
        completedPercent: 14,
      },
    },
    achievements: {
      summary: { unlockedCount: 2, totalCount: 7 },
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
          id: 'question-builder',
          title: 'Problem Solver',
          reason: 'Solve 10 current-catalog questions.',
          icon: 'code',
          theme: 'cyan',
          current: 9,
          target: 10,
          progress: 0.9,
          unlocked: false,
        },
      ],
    },
    settings: {
      weeklyGoalEnabled: true,
      weeklyGoalTarget: 10,
      showStreakWidget: true,
      dailyChallengeTech: 'auto',
    },
  };

  beforeEach(async () => {
    userSig.set({
      _id: 'user-1',
      username: 'badge_user',
      email: 'badge@example.com',
      role: 'user',
      prefs: {},
      stats: { xpTotal: 420, completedTotal: 14, streak: { current: 2, longest: 4, lastActiveUTCDate: null } },
      billing: { pro: { status: 'none' }, projects: { status: 'none' } },
      coupons: [],
      solvedQuestionIds: ['react-counter'],
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    solvedIdsSig.set(['react-counter']);

    const authStub = {
      user: userSig,
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.callFake(() => Boolean(userSig())),
      ensureMe: jasmine.createSpy('ensureMe').and.callFake(() => of(userSig())),
      updateProfile: jasmine.createSpy('updateProfile').and.callFake((_id: string, data: any) => {
        const updated = { ...userSig(), ...data };
        userSig.set(updated);
        return of(updated);
      }),
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of({ ok: true })),
      getManageSubscriptionUrl: jasmine.createSpy('getManageSubscriptionUrl').and.returnValue(of({ url: '' })),
    };

    gamification = jasmine.createSpyObj<GamificationService>('GamificationService', ['getDashboard']);
    gamification.getDashboard.and.returnValue(of(dashboardPayload));

    solvedQuestions = jasmine.createSpyObj<SolvedQuestionsService>('SolvedQuestionsService', ['resolved']);
    solvedQuestions.resolved.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: GamificationService, useValue: gamification },
        { provide: SolvedQuestionsService, useValue: solvedQuestions },
        { provide: UserProgressService, useValue: { solvedIds: solvedIdsSig } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<ProfileComponent> {
    const nextFixture = TestBed.createComponent(ProfileComponent);
    nextFixture.detectChanges();
    return nextFixture;
  }

  it('renders profile badges above progress details and keeps XP lower in activity history', () => {
    fixture = createComponent();

    const page: HTMLElement = fixture.nativeElement;
    const pageText = page.textContent || '';
    const badgeSection = page.querySelector('[data-testid="profile-badges-section"]') as HTMLElement | null;
    const badgeSummary = page.querySelector('[data-testid="profile-badge-summary"]') as HTMLElement | null;
    const awardShelf = page.querySelector('[data-testid="profile-award-shelf"]') as HTMLElement | null;
    const nextDetail = page.querySelector('[data-testid="profile-next-badge-detail"]') as HTMLElement | null;

    expect(badgeSection).toBeTruthy();
    expect(badgeSummary?.textContent || '').toContain('2 / 7');
    expect(badgeSummary?.textContent || '').toContain('unlocked');
    expect(awardShelf).toBeTruthy();
    expect(pageText).toContain('Badges');
    expect(pageText).toContain('First Steps');
    expect(pageText).toContain('3 / 3');
    expect(pageText).toContain('Problem Solver');
    expect(pageText).not.toContain('Question Builder');
    expect(pageText).toContain('Solve 10 current-catalog questions.');
    expect(pageText).toContain('9 / 10');
    const shelfMedallions = Array.from(page.querySelectorAll('[data-testid="profile-award-shelf-medallion"]')) as HTMLElement[];
    const unlockedMedallions = shelfMedallions.filter((item) => item.getAttribute('data-badge-state') === 'earned');
    const nextMedallion = shelfMedallions.find((item) => item.getAttribute('data-badge-state') === 'in-progress') ?? null;
    expect(shelfMedallions.length).toBe(3);
    expect(unlockedMedallions.length).toBe(2);
    expect(unlockedMedallions[0].getAttribute('data-theme')).toBe('gold');
    expect(unlockedMedallions[0].getAttribute('data-badge-id')).toBe('first-steps');
    expect(unlockedMedallions[0].textContent || '').toContain('Earned');
    expect(unlockedMedallions[0].textContent || '').toContain('Complete 3 practice units.');
    expect(unlockedMedallions[0].getAttribute('aria-label') || '').toContain('First Steps badge, Earned, 3 of 3. Criteria: Complete 3 practice units.');
    expect(unlockedMedallions[0].querySelector('.badge-medallion__motif')).toBeTruthy();
    expect(unlockedMedallions[0].querySelector('app-fa-glyph')).toBeTruthy();
    expect(nextMedallion?.getAttribute('data-theme')).toBe('cyan');
    expect(nextMedallion?.getAttribute('data-badge-id')).toBe('question-builder');
    expect(nextMedallion?.textContent || '').toContain('In progress');
    expect(nextMedallion?.textContent || '').toContain('Problem Solver');
    expect(nextMedallion?.textContent || '').toContain('Solve 10 current-catalog questions.');
    expect(nextMedallion?.getAttribute('aria-label') || '').toContain('Problem Solver badge, In progress, 9 of 10. Criteria: Solve 10 current-catalog questions.');
    expect(nextMedallion?.querySelector('.badge-medallion__motif')).toBeTruthy();
    expect(nextMedallion?.querySelector('app-fa-glyph')).toBeTruthy();
    expect(nextMedallion?.style.getPropertyValue('--badge-progress')).toBe('90%');
    expect(nextDetail).toBeTruthy();
    expect(nextDetail?.textContent || '').toContain('How to earn next badge');
    expect(nextDetail?.textContent || '').toContain('Problem Solver');
    expect(nextDetail?.textContent || '').toContain('Solve 10 current-catalog questions.');
    expect(nextDetail?.textContent || '').toContain('9 / 10');
    expect(nextDetail?.querySelector('.badge-next-bar span')).toBeTruthy();
    expect((nextDetail?.querySelector('.badge-next-bar span') as HTMLElement | null)?.style.width).toBe('90%');
    expect(page.querySelector('.badge-next-section')).toBeFalsy();
    expect(page.querySelector('.badge-criteria-list')).toBeFalsy();
    expect(pageText).not.toContain('Next badges');
    expect(pageText.indexOf('Badges')).toBeLessThan(pageText.indexOf('Progress details'));
    expect(pageText.indexOf('Practice completed')).toBeLessThan(pageText.indexOf('XP + level'));
  });
});
