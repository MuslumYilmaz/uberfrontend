import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { hasPremium, premiumEnded } from './company-plan-access';

const PLAN_URL = '/companies/plan';

/**
 * The plan page is for Premium, and for a member whose Premium ran out, who sees it behind a renewal screen. A free
 * account goes to its preview, which shows the same plan at a glance with the way to Premium, and a guest signs in
 * first, because the plan lives on the account. The shared premiumGuard would read "plan" as a company slug.
 */
export const companyPlanGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureMe().pipe(
    catchError(() => of(null)),
    map((user) => {
      if (hasPremium(user) || premiumEnded(user)) return true;
      if (user) return router.parseUrl('/companies/preview');
      return router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: PLAN_URL } });
    }),
  );
};
