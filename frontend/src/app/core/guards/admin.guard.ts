import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment, GuardResult, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { prerenderPageRedirect } from './prerender-page-redirect';

function adminCheck(targetUrl?: string): GuardResult | Observable<GuardResult> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  const loginRedirect = prerenderPageRedirect(router.createUrlTree(['/auth/login'], {
    queryParams: targetUrl ? { redirectTo: targetUrl } : undefined
  }), platformId);

  if (auth.isLoggedIn() && (auth.user()?.role ?? 'user') === 'admin') return true;

  return auth.ensureMe().pipe(
    map((u) => {
      if (!u) return loginRedirect;
      if ((u.role ?? 'user') !== 'admin') return prerenderPageRedirect(router.createUrlTree(['/dashboard']), platformId);
      return true;
    }),
    catchError(() => of(loginRedirect))
  );
}

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): GuardResult | Observable<GuardResult> => {
  return adminCheck(state.url);
};

export const adminMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): GuardResult | Observable<GuardResult> => {
  const url = '/' + segments.map(s => s.path).join('/');
  return adminCheck(url);
};
