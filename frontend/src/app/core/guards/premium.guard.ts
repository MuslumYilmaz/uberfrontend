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
import { isProActive } from '../utils/entitlements.util';

function isPremiumUser(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return isProActive(user);
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

function buildTrackPreviewUrlTree(router: Router, targetUrl?: string): UrlTree | null {
  if (!targetUrl) return null;
  const parsed = router.parseUrl(targetUrl);
  const segments = parsed.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  if (segments[0] !== 'tracks') return null;
  const slug = segments[1];
  if (!slug) return null;

  return router.createUrlTree(['/tracks', slug, 'preview'], {
    queryParams: parsed.queryParams,
    fragment: parsed.fragment ?? undefined,
  });
}

function buildTrackDetailUrlTree(
  router: Router,
  targetUrl: string,
  fallbackSlug?: string | null,
): UrlTree | null {
  const parsed = router.parseUrl(targetUrl);
  const segments = parsed.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  const slug = fallbackSlug || (segments[0] === 'tracks' ? segments[1] : undefined);
  if (!slug) return null;

  return router.createUrlTree(['/tracks', slug], {
    queryParams: parsed.queryParams,
    fragment: parsed.fragment ?? undefined,
  });
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
      if (reason === 'tracks') {
        const previewUrl = buildTrackPreviewUrlTree(router, targetUrl);
        if (previewUrl) return previewUrl;
      }
      return showGate(!!u);
    }),
    catchError(() => {
      if (reason === 'tracks') {
        const previewUrl = buildTrackPreviewUrlTree(router, targetUrl);
        if (previewUrl) return of(previewUrl);
      }
      return of(showGate(false));
    }),
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

export const trackPreviewAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const routeSlug = (route.paramMap.get('slug') || '').trim().toLowerCase();

  const resolveAccess = (user: User | null): boolean | UrlTree => {
    if (!isPremiumUser(user)) return true;
    return buildTrackDetailUrlTree(router, state.url, routeSlug) || true;
  };

  if (auth.isLoggedIn()) {
    return resolveAccess(auth.user());
  }

  return auth.ensureMe().pipe(
    map((u) => resolveAccess(u)),
    catchError(() => of(true)),
  );
};
