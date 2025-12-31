import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Blocks route activation if not logged in */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return auth.ensureMe().pipe(
    map((u) => u ? true : router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } })),
    catchError(() => of(router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } })))
  );
};

/** Blocks route matching (prevents lazy load) if not logged in */
export const authMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const url = '/' + segments.map(s => s.path).join('/');
  if (auth.isLoggedIn()) return true;

  return auth.ensureMe().pipe(
    map((u) => u ? true : router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: url } })),
    catchError(() => of(router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: url } })))
  );
};
