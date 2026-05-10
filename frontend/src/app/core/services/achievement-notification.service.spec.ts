import { HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AchievementNotificationService } from './achievement-notification.service';
import { AchievementAward } from '../models/gamification.model';

describe('AchievementNotificationService', () => {
  let service: AchievementNotificationService;
  let httpMock: HttpTestingController;
  let authUser: ReturnType<typeof signal<any>>;

  const award = (id: string): AchievementAward => ({
    id,
    title: id === 'question-builder' ? 'Problem Solver' : 'First Steps',
    reason: id === 'question-builder' ? 'Solve 10 current-catalog questions.' : 'Complete 3 practice units.',
    icon: id === 'question-builder' ? 'code' : 'flag',
    theme: id === 'question-builder' ? 'cyan' : 'gold',
    current: id === 'question-builder' ? 10 : 3,
    target: id === 'question-builder' ? 10 : 3,
    progress: 1,
    earnedAt: '2026-03-20T10:00:00.000Z',
  });

  beforeEach(() => {
    authUser = signal<any>({ _id: 'user-1' });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AchievementNotificationService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });

    service = TestBed.inject(AchievementNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows an award and marks it seen once', () => {
    service.enqueueAwards([award('first-steps'), award('first-steps')]);

    expect(service.current()?.id).toBe('first-steps');
    const seenReq = httpMock.expectOne('/api/achievements/seen');
    expect(seenReq.request.method).toBe('POST');
    expect(seenReq.request.body).toEqual({ ids: ['first-steps'] });
    seenReq.flush({ ok: true, ids: ['first-steps'], modifiedCount: 1 });

    service.dismissCurrent();
    expect(service.current()).toBeNull();
  });

  it('queues multiple awards and presents them one at a time', fakeAsync(() => {
    service.enqueueAwards([award('first-steps'), award('question-builder')]);

    expect(service.current()?.id).toBe('first-steps');
    httpMock.expectOne('/api/achievements/seen').flush({ ok: true });

    service.dismissCurrent();
    flushMicrotasks();

    expect(service.current()?.id).toBe('question-builder');
    httpMock.expectOne('/api/achievements/seen').flush({ ok: true });

    tick(6000);
    expect(service.current()).toBeNull();
  }));

  it('ignores awards for logged-out users', () => {
    authUser.set(null);
    service.enqueueAwards([award('first-steps')]);

    expect(service.current()).toBeNull();
    httpMock.expectNone('/api/achievements/seen');
  });
});
