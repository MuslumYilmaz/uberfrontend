import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { PremiumGateReason, PremiumGateService } from '../services/premium-gate.service';

function isPremiumUser(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.accessTier ?? 'free') === 'premium';
}

function resolveReason(routeData: Record<string, unknown> | undefined, targetUrl?: string): PremiumGateReason {
  const fromData = routeData?.['premiumGate'];
  if (fromData === 'tracks' || fromData === 'company') return fromData;
  if (targetUrl?.startsWith('/tracks')) return 'tracks';
  if (targetUrl?.startsWith('/companies')) return 'company';
  return 'generic';
}

function resolveFallbackUrl(
  router: Router,
  reason: PremiumGateReason,
  targetUrl?: string,
): string {
  const prev = router.getCurrentNavigation()?.previousNavigation?.finalUrl?.toString();
  if (prev && prev !== targetUrl) return prev;
  const current = router.url;
  if (current && current !== targetUrl) return current;
  return reason === 'company' ? '/companies' : '/';
}

function premiumCheck(
  targetUrl: string | undefined,
  reason: PremiumGateReason,
): boolean | UrlTree | Observable<boolean | UrlTree> {
  const auth = inject(AuthService);
  const premiumGate = inject(PremiumGateService);
  const router = inject(Router);

  const showGate = (isLoggedIn: boolean): boolean | UrlTree => {
    premiumGate.open({ reason, targetUrl, isLoggedIn });
    const fallbackUrl = resolveFallbackUrl(router, reason, targetUrl);
    if (!router.navigated || fallbackUrl !== router.url) {
      return router.parseUrl(fallbackUrl);
    }
    return false;
  };

  if (auth.isLoggedIn() && isPremiumUser(auth.user())) return true;

  return auth.ensureMe().pipe(
    map((u) => {
      if (u && isPremiumUser(u)) return true;
      return showGate(!!u);
    }),
    catchError(() => of(showGate(false))),
  );
}

export const premiumGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const reason = resolveReason(route.data, state.url);
  return premiumCheck(state.url, reason);
};

export const premiumMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[],
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const url = '/' + segments.map((s) => s.path).join('/');
  const reason = resolveReason(route.data, url);
  return premiumCheck(url, reason);
};
