import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks route activation if not logged in */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Redirect to login and remember where we wanted to go
  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirectTo: state.url }
  });
};

/** Blocks route matching (prevents lazy load) if not logged in */
export const authMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  const url = '/' + segments.map(s => s.path).join('/');
  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirectTo: url }
  });
};
