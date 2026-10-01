import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, GuardResult, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { prerenderPageRedirect } from './prerender-page-redirect';

/** Blocks route activation if not logged in */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): GuardResult | Observable<GuardResult> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;
  const redirect = prerenderPageRedirect(router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } }), inject(PLATFORM_ID));

  return auth.ensureMe().pipe(
    map((u) => u ? true : redirect),
    catchError(() => of(redirect))
  );
};

/** Blocks route matching (prevents lazy load) if not logged in */
export const authMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): GuardResult | Observable<GuardResult> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const url = '/' + segments.map(s => s.path).join('/');
  if (auth.isLoggedIn()) return true;
  const redirect = prerenderPageRedirect(router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: url } }), inject(PLATFORM_ID));

  return auth.ensureMe().pipe(
    map((u) => u ? true : redirect),
    catchError(() => of(redirect))
  );
};
