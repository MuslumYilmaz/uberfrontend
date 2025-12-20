import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment, UrlTree, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

function adminCheck(targetUrl?: string): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: targetUrl ? { redirectTo: targetUrl } : undefined
    });
  }

  if ((auth.user()?.role ?? 'user') !== 'admin') {
    return router.createUrlTree(['/']);
  }

  return true;
}

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  return adminCheck(state.url);
};

export const adminMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree => {
  const url = '/' + segments.map(s => s.path).join('/');
  return adminCheck(url);
};
