import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { AuthService, User } from '../../core/services/auth.service';
import { interviewAccessGuard } from './interview-access.guard';

describe('interviewAccessGuard', () => {
  async function runGuard(options: {
    role?: 'user' | 'admin' | null;
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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
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

  it('allows a signed-in user into the safe shell', async () => {
    expect(await runGuard({ role: 'user' })).toBeTrue();
  });

  it('lets availability render off/internal/error states instead of converting them to 404', async () => {
    expect(await runGuard({ role: 'user' })).toBeTrue();
    expect(await runGuard({ role: 'admin' })).toBeTrue();
  });

  it('sends signed-out visitors to login with the original route', async () => {
    const result = await runGuard({ role: null });
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/login?redirectTo=%2Finterview%2Fsession-1',
    );
  });
});
