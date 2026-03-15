import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActivityService } from './activity.service';
import { AnalyticsService } from './analytics.service';
import { AuthService } from './auth.service';
import { GamificationService } from './gamification.service';
import { OfflineService } from './offline';
import { UserProgressService } from './user-progress.service';

const LS_PENDING_COMPLETIONS = 'fa:activity:pending:v1';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;
  let authUser: ReturnType<typeof signal<any>>;
  let offlineOnline: ReturnType<typeof signal<boolean>>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let gamification: jasmine.SpyObj<GamificationService>;
  let progress: jasmine.SpyObj<UserProgressService>;

  beforeEach(() => {
    localStorage.removeItem(LS_PENDING_COMPLETIONS);

    authUser = signal<any>({
      _id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      prefs: { tz: 'Europe/Istanbul', theme: 'dark', defaultTech: 'javascript', keyboard: 'default', marketingEmails: false },
      createdAt: new Date().toISOString(),
      solvedQuestionIds: [],
      stats: { xpTotal: 0, completedTotal: 0, perTech: {}, streak: { current: 0, longest: 0, lastActiveUTCDate: null } },
    });
    offlineOnline = signal<boolean>(true);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    gamification = jasmine.createSpyObj<GamificationService>('GamificationService', ['invalidateDashboardCache']);
    progress = jasmine.createSpyObj<UserProgressService>('UserProgressService', ['setSolvedIds', 'markSolvedLocal']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ActivityService,
        { provide: AnalyticsService, useValue: analytics },
        { provide: GamificationService, useValue: gamification },
        { provide: UserProgressService, useValue: progress },
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
        {
          provide: OfflineService,
          useValue: {
            isOnline: offlineOnline,
          } satisfies Partial<OfflineService>,
        },
      ],
    });

    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(LS_PENDING_COMPLETIONS);
  });

  it('queues completion locally when offline', async () => {
    offlineOnline.set(false);

    const result = await firstValueFrom(service.complete({
      kind: 'coding',
      tech: 'javascript',
      itemId: 'js-closure',
      source: 'tech',
      durationMin: 4,
      difficulty: 'easy',
    }));

    expect(result.pending).toBeTrue();
    expect(result.queued).toBeTrue();
    expect(service.isCompletionPending('coding', 'js-closure')).toBeTrue();

    const persisted = JSON.parse(localStorage.getItem(LS_PENDING_COMPLETIONS) || '[]');
    expect(Array.isArray(persisted)).toBeTrue();
    expect(persisted.length).toBe(1);
  });

  it('treats guest completion attempts as a no-op without queueing progress', async () => {
    authUser.set(null);

    const result = await firstValueFrom(service.complete({
      kind: 'coding',
      tech: 'javascript',
      itemId: 'guest-item',
      source: 'tech',
      durationMin: 4,
      difficulty: 'easy',
    }));

    expect(result.credited).toBeFalse();
    expect(result.stats).toBeNull();
    expect(localStorage.getItem(LS_PENDING_COMPLETIONS)).toBeNull();
  });

  it('flushes a queued completion when connectivity returns', fakeAsync(() => {
    offlineOnline.set(false);
    let queuedResult: any = null;

    firstValueFrom(service.complete({
      kind: 'trivia',
      tech: 'javascript',
      itemId: 'js-hoisting',
      source: 'tech',
      durationMin: 2,
      difficulty: 'easy',
    })).then((result) => {
      queuedResult = result;
    });
    flushMicrotasks();

    expect(queuedResult?.pending).toBeTrue();
    expect(service.isCompletionPending('trivia', 'js-hoisting')).toBeTrue();

    offlineOnline.set(true);
    window.dispatchEvent(new Event('focus'));
    flushMicrotasks();
    tick();

    const req = httpMock.expectOne((request) =>
      request.method === 'POST' &&
      request.url.endsWith('/api/activity/complete') &&
      request.body?.itemId === 'js-hoisting' &&
      typeof request.body?.requestId === 'string' &&
      request.body.requestId.length > 0
    );

    req.flush({
      stats: { xpTotal: 5, completedTotal: 1 },
      solvedQuestionIds: ['js-hoisting'],
      xpAwarded: 5,
      weeklyGoal: { completed: 1, target: 10, reached: false },
      logicalCompletionCreated: true,
      levelUp: false,
    });

    const summaryReq = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.includes('/api/activity/summary')
    );
    summaryReq.flush({
      totalXp: 5,
      level: 1,
      nextLevelXp: 200,
      levelProgress: { current: 5, needed: 200, pct: 0.025 },
      streak: { current: 1, best: 1 },
      freezeTokens: 0,
      weekly: { completed: 1, target: 10, progress: 0.1 },
      today: { completed: 1, total: 3, progress: 0.3333 },
    });

    flushMicrotasks();
    tick();

    expect(service.isCompletionPending('trivia', 'js-hoisting')).toBeFalse();
    expect(progress.setSolvedIds).toHaveBeenCalledWith(['js-hoisting']);
    expect(analytics.track).toHaveBeenCalledWith('xp_awarded', jasmine.objectContaining({
      item_id: 'js-hoisting',
      xp: 5,
    }));
    expect(authUser()?.stats?.xpTotal).toBe(5);
  }));

  it('rolls back a completion and syncs solved ids and stats', async () => {
    const resultPromise = firstValueFrom(service.uncomplete({
      kind: 'coding',
      tech: 'javascript',
      itemId: 'js-closure',
    }));

    const req = httpMock.expectOne((request) =>
      request.method === 'POST' &&
      request.url.endsWith('/api/activity/uncomplete') &&
      request.body?.itemId === 'js-closure'
    );
    req.flush({
      stats: { xpTotal: 0, completedTotal: 0 },
      solvedQuestionIds: [],
      xpRemoved: 10,
      rollbackApplied: true,
      levelDown: false,
      weeklyGoal: { completed: 0, target: 10, reached: false, bonusGranted: false, bonusRevoked: false },
      dailyChallenge: { revoked: false },
    });

    const summaryReq = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.includes('/api/activity/summary')
    );
    summaryReq.flush({
      totalXp: 0,
      level: 1,
      nextLevelXp: 200,
      levelProgress: { current: 0, needed: 200, pct: 0 },
      streak: { current: 1, best: 1 },
      freezeTokens: 0,
      weekly: { completed: 0, target: 10, progress: 0 },
      today: { completed: 0, total: 3, progress: 0 },
    });

    const result = await resultPromise;

    expect(result.rollbackApplied).toBeTrue();
    expect(progress.setSolvedIds).toHaveBeenCalledWith([]);
    expect(gamification.invalidateDashboardCache).toHaveBeenCalled();
    expect(authUser()?.stats?.xpTotal).toBe(0);
    expect(authUser()?.solvedQuestionIds).toEqual([]);
  });
});
