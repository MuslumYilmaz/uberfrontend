import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

export const interviewAccessGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const currentUser = auth.user();

  // Availability controls discovery and creation inside the feature shell. It
  // must not turn an authenticated direct URL, active session, or historical
  // result into a misleading 404 when the launch switch is off.
  if (currentUser) return of(true);

  return auth.ensureMe().pipe(
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/auth/login'], {
          queryParams: { redirectTo: state.url },
        })
    ),
    catchError(() => of(router.createUrlTree(['/auth/login'], {
      queryParams: { redirectTo: state.url },
    }))),
  );
};
