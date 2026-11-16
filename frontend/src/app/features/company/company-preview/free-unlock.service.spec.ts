import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth.service';
import { FreeUnlockService, type FreeUnlockResult } from './free-unlock.service';

describe('FreeUnlockService', () => {
  const UNLOCK = { company: 'acme', questionId: 'q-one', practiceId: 'react-x', unlockedAt: '2026-11-13T10:00:00.000Z' };
  const user = signal<any>(null);
  let service: FreeUnlockService;
  let http: HttpTestingController;

  beforeEach(() => {
    user.set({ _id: 'u', role: 'user', accessTier: 'free' });
    localStorage.removeItem('fa:free-unlock-intent');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { user, headers: () => ({}) } }],
    });
    service = TestBed.inject(FreeUnlockService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const claim = () => {
    const results: FreeUnlockResult[] = [];
    service.claim('acme', 'q-one').subscribe((result) => results.push(result));
    return { results, request: http.expectOne((req) => req.url.endsWith('/users/me/free-unlock')) };
  };

  it('spends the unlock and gives it to the signed-in user, so every guide sees it', () => {
    const { results, request } = claim();
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ company: 'acme', questionId: 'q-one' });
    request.flush({ freeUnlock: UNLOCK });
    expect(results).toEqual([{ status: 'opened', unlock: UNLOCK }]);
    expect(user().freeUnlock).toEqual(UNLOCK);
  });

  it('takes the server\'s word when the unlock is already spent on another question', () => {
    const other = { ...UNLOCK, questionId: 'q-two' };
    const { results, request } = claim();
    request.flush({ code: 'FREE_UNLOCK_USED', freeUnlock: other }, { status: 409, statusText: 'Conflict' });
    expect(results).toEqual([{ status: 'used', unlock: other }]);
    expect(user().freeUnlock).toEqual(other);
  });

  it('reports a failure without touching the user', () => {
    const { results, request } = claim();
    request.flush({}, { status: 500, statusText: 'Server Error' });
    expect(results).toEqual([{ status: 'error' }]);
    expect(user().freeUnlock).toBeUndefined();
  });

  it('keeps a visitor\'s choice for its company only, hands it over once, and lets an old one lapse', () => {
    service.rememberIntent('acme', 'q-one');
    expect(service.takeIntent('other')).toBeNull();
    expect(service.takeIntent('acme')).toBe('q-one');
    expect(service.takeIntent('acme')).toBeNull();

    localStorage.setItem('fa:free-unlock-intent', JSON.stringify({ company: 'acme', questionId: 'q-one', at: Date.now() - 3 * 60 * 60 * 1000 }));
    expect(service.takeIntent('acme')).toBeNull();
  });
});
