import { HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { UserProgressService } from './user-progress.service';

const LS_SOLVED_GUEST = 'fa:solved:guest';

describe('UserProgressService', () => {
  let authUser: ReturnType<typeof signal<any>>;

  function setup() {
    authUser = signal<any>(null);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserProgressService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            ensureMe: () => { throw new Error('ensureMe should not run for guests in this spec'); },
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });

    return {
      service: TestBed.inject(UserProgressService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  beforeEach(() => {
    localStorage.removeItem(LS_SOLVED_GUEST);
  });

  afterEach(() => {
    localStorage.removeItem(LS_SOLVED_GUEST);
    TestBed.resetTestingModule();
  });

  it('clears legacy guest solved cache and exposes no solved ids for guests', () => {
    localStorage.setItem(LS_SOLVED_GUEST, JSON.stringify(['legacy-q']));

    const { service, httpMock } = setup();

    expect(localStorage.getItem(LS_SOLVED_GUEST)).toBeNull();
    expect(service.solvedIds()).toEqual([]);
    expect(service.isSolved('legacy-q')).toBeFalse();
    httpMock.verify();
  });

  it('treats guest markSolved as a no-op and does not persist local progress', async () => {
    const { service, httpMock } = setup();

    await service.markSolved('guest-q');

    expect(service.solvedIds()).toEqual([]);
    expect(localStorage.getItem(LS_SOLVED_GUEST)).toBeNull();
    httpMock.expectNone((req) => req.url.includes('/api/users/me/solved'));
    httpMock.verify();
  });

  it('does not merge legacy guest solved ids into backend state after login', () => {
    localStorage.setItem(LS_SOLVED_GUEST, JSON.stringify(['legacy-q']));

    const { service, httpMock } = setup();

    authUser.set({
      _id: 'user-1',
      solvedQuestionIds: [],
      prefs: {},
      createdAt: new Date().toISOString(),
    });

    expect(service.solvedIds()).toEqual([]);
    expect(localStorage.getItem(LS_SOLVED_GUEST)).toBeNull();
    httpMock.expectNone((req) => req.url.includes('/api/users/me/solved'));
    httpMock.verify();
  });
});
