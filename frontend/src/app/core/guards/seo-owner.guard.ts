import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { SeoAdminService } from '../services/seo-admin.service';

export const seoOwnerGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const seoAdmin = inject(SeoAdminService);
  const router = inject(Router);
  const login = router.createUrlTree(['/auth/login'], {
    queryParams: { redirectTo: state.url },
  });
  const hidden = router.createUrlTree(['/404']);

  const user$ = auth.user() ? of(auth.user()) : auth.ensureMe();
  return user$.pipe(
    switchMap((user: User | null) => {
      if (!user) return of(login);
      if (user.role !== 'admin') return of(hidden);
      seoAdmin.bindOwnerPrincipal(String(user._id));
      return seoAdmin.checkAccess(true).pipe(
        map((access) => access.allowed && access.enabled ? true : hidden),
        catchError(() => of(hidden)),
      );
    }),
    catchError(() => of(login)),
  );
};
