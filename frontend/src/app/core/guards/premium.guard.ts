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
import { AuthSessionAuthorityService } from '../services/auth-session-authority.service';
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

function buildCompanyPreviewUrlTree(router: Router, targetUrl?: string): UrlTree | null {
  if (!targetUrl) return null;
  const parsed = router.parseUrl(targetUrl);
  const segments = parsed.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  if (segments[0] !== 'companies') return null;
  const slug = segments[1];
  if (!slug) return null;

  return router.createUrlTree(['/companies', slug, 'preview'], {
    queryParams: parsed.queryParams,
    fragment: parsed.fragment ?? undefined,
  });
}

// Tracks always send visitors without access to their preview. A direct link to a company
// page lands on its public guide; a click inside the app keeps the gate, so the click gets an answer.
function previewInsteadOfGate(router: Router, reason: PremiumGateReason, targetUrl?: string): UrlTree | null {
  if (reason === 'tracks') return buildTrackPreviewUrlTree(router, targetUrl);
  if (reason === 'company' && !router.navigated) return buildCompanyPreviewUrlTree(router, targetUrl);
  return null;
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
      return previewInsteadOfGate(router, reason, targetUrl) ?? showGate(!!u);
    }),
    catchError(() => {
      return of(previewInsteadOfGate(router, reason, targetUrl) ?? showGate(false));
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
  const sessionAuthority = inject(AuthSessionAuthorityService);
  const router = inject(Router);

  const routeSlug = (route.paramMap.get('slug') || '').trim().toLowerCase();

  const resolveAccess = (user: User | null): boolean | UrlTree => {
    if (!isPremiumUser(user)) return true;
    return buildTrackDetailUrlTree(router, state.url, routeSlug) || true;
  };

  if (auth.isLoggedIn()) {
    return resolveAccess(auth.user());
  }

  // Public preview pages only redirect premium members to the full route. A
  // visitor with no session hint (first visit, crawler rendering) is anonymous
  // without asking the API, which otherwise answered 401 on every render.
  if (!sessionAuthority.hasSessionHint()) return true;

  return auth.ensureMe().pipe(
    map((u) => resolveAccess(u)),
    catchError(() => of(true)),
  );
};
