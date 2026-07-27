import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { interviewAvailabilityAllowsRole } from '../../core/models/interview.model';
import { AuthService, User } from '../../core/services/auth.service';
import { InterviewService } from '../../core/services/interview.service';

function accessForUser(
  user: User,
  interviews: InterviewService,
  router: Router,
): Observable<boolean | UrlTree> {
  return interviews.getAvailability().pipe(
    map((availability) =>
      interviewAvailabilityAllowsRole(availability, user.role)
        ? true
        : router.createUrlTree(['/404'])
    ),
    catchError(() => of(router.createUrlTree(['/404']))),
  );
}

export const interviewAccessGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const interviews = inject(InterviewService);
  const router = inject(Router);
  const currentUser = auth.user();

  if (currentUser) {
    return accessForUser(currentUser, interviews, router);
  }

  return auth.ensureMe().pipe(
    switchMap((user) =>
      user
        ? accessForUser(user, interviews, router)
        : of(router.createUrlTree(['/auth/login'], {
          queryParams: { redirectTo: state.url },
        }))
    ),
    catchError(() => of(router.createUrlTree(['/auth/login'], {
      queryParams: { redirectTo: state.url },
    }))),
  );
};
