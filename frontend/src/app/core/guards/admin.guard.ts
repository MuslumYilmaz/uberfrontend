import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment, UrlTree, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

function adminCheck(targetUrl?: string): boolean | UrlTree | Observable<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);

  const loginRedirect = router.createUrlTree(['/auth/login'], {
    queryParams: targetUrl ? { redirectTo: targetUrl } : undefined
  });

  if (auth.isLoggedIn() && (auth.user()?.role ?? 'user') === 'admin') return true;

  return auth.ensureMe().pipe(
    map((u) => {
      if (!u) return loginRedirect;
      if ((u.role ?? 'user') !== 'admin') return router.createUrlTree(['/dashboard']);
      return true;
    }),
    catchError(() => of(loginRedirect))
  );
}

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  return adminCheck(state.url);
};

export const adminMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const url = '/' + segments.map(s => s.path).join('/');
  return adminCheck(url);
};
