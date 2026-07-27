import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { InterviewAvailability } from '../../core/models/interview.model';
import { AuthService, User } from '../../core/services/auth.service';
import { InterviewService } from '../../core/services/interview.service';
import { interviewAccessGuard } from './interview-access.guard';

describe('interviewAccessGuard', () => {
  const availability = (
    overrides: Partial<InterviewAvailability> = {},
  ): InterviewAvailability => ({
    enabled: true,
    accessMode: 'public',
    unavailableReason: null,
    quota: null,
    activeSession: null,
    lastResults: [],
    targets: [],
    levels: [],
    tracks: [],
    minViewportWidth: 768,
    timing: { mcqSeconds: 600, codingReadySeconds: 300 },
    ...overrides,
  });

  async function runGuard(options: {
    role?: 'user' | 'admin' | null;
    availability?: InterviewAvailability;
    availabilityError?: boolean;
  }): Promise<boolean | UrlTree> {
    const user = options.role
      ? ({
        _id: `user-${options.role}`,
        username: options.role,
        email: `${options.role}@example.com`,
        role: options.role,
      } as User)
      : null;
    const auth = {
      user: signal<User | null>(user),
      ensureMe: jasmine.createSpy('ensureMe').and.returnValue(of(user)),
    };
    const interviews = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'getAvailability',
    ]);
    interviews.getAvailability.and.returnValue(
      options.availabilityError
        ? throwError(() => new Error('unavailable'))
        : of(options.availability ?? availability()),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: InterviewService, useValue: interviews },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      interviewAccessGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/interview/session-1' } as RouterStateSnapshot,
      )
    ) as Observable<boolean | UrlTree>;
    return firstValueFrom(result);
  }

  it('allows a signed-in user when the mode is public', async () => {
    expect(await runGuard({ role: 'user' })).toBeTrue();
  });

  it('allows only admins when the mode is internal', async () => {
    expect(await runGuard({
      role: 'admin',
      availability: availability({ accessMode: 'internal' }),
    })).toBeTrue();

    const denied = await runGuard({
      role: 'user',
      availability: availability({ accessMode: 'internal' }),
    });
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/404');
  });

  it('fails closed when the backend disables the feature or availability fails', async () => {
    const disabled = await runGuard({
      role: 'user',
      availability: availability({ enabled: false, accessMode: 'off' }),
    });
    expect(TestBed.inject(Router).serializeUrl(disabled as UrlTree)).toBe('/404');

    const failed = await runGuard({ role: 'user', availabilityError: true });
    expect(TestBed.inject(Router).serializeUrl(failed as UrlTree)).toBe('/404');
  });

  it('sends signed-out visitors to login with the original route', async () => {
    const result = await runGuard({ role: null });
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/login?redirectTo=%2Finterview%2Fsession-1',
    );
  });
});
