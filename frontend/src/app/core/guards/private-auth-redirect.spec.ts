import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, GuardResult, RedirectCommand, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';

describe('private route redirects', () => {
  for (const platform of ['browser', 'server']) {
    for (const kind of ['profile', 'admin']) {
      it(`${platform} ${kind} refuses an anonymous user while preserving the appropriate shell`, async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: platform }, {
          provide: AuthService, useValue: { isLoggedIn: () => false, ensureMe: () => of(null) },
        }] });
        const url = kind === 'profile' ? '/profile' : '/admin/users';
        const guard = kind === 'profile' ? authGuard : adminGuard;
        const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
        const redirect = await firstValueFrom(result as Observable<GuardResult>);
        const router = TestBed.inject(Router);
        if (platform === 'server') {
          expect(redirect instanceof RedirectCommand).toBeTrue();
          expect((redirect as RedirectCommand).navigationBehaviorOptions?.skipLocationChange).toBeTrue();
          expect(router.serializeUrl((redirect as RedirectCommand).redirectTo)).toBe(`/auth/login?redirectTo=${encodeURIComponent(url)}`);
        } else {
          expect(redirect instanceof UrlTree).toBeTrue();
          expect(router.serializeUrl(redirect as UrlTree)).toBe(`/auth/login?redirectTo=${encodeURIComponent(url)}`);
        }
      });
    }
  }

  it('still denies a signed-in non-admin access to the admin route', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: AuthService, useValue: { isLoggedIn: () => true, user: () => ({ role: 'user' }), ensureMe: () => of({ role: 'user' }) },
    }] });
    const result = TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, { url: '/admin/users' } as RouterStateSnapshot));
    expect(TestBed.inject(Router).serializeUrl(await firstValueFrom(result as Observable<UrlTree>))).toBe('/dashboard');
  });

  it('fails closed when cookie verification errors', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: AuthService, useValue: { isLoggedIn: () => false, ensureMe: () => throwError(() => new Error('unavailable')) },
    }] });
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/profile' } as RouterStateSnapshot));
    expect(TestBed.inject(Router).serializeUrl(await firstValueFrom(result as Observable<UrlTree>))).toBe('/auth/login?redirectTo=%2Fprofile');
  });
});
