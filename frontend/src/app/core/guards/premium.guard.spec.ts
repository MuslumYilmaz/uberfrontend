import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, GuardResult, MaybeAsync, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthSessionAuthorityService } from '../services/auth-session-authority.service';
import { companyPreviewAccessGuard, trackPreviewAccessGuard } from './premium.guard';

type PreviewFixture = {
  guard: typeof trackPreviewAccessGuard;
  url: string;
  slug: string;
  detailUrl: string;
};

const FIXTURES: Record<'tracks' | 'companies', PreviewFixture> = {
  tracks: { guard: trackPreviewAccessGuard, url: '/tracks/crash-7d/preview?src=hub', slug: 'crash-7d', detailUrl: '/tracks/crash-7d?src=hub' },
  companies: { guard: companyPreviewAccessGuard, url: '/companies/google/preview', slug: 'google', detailUrl: '/companies/google' },
};

async function resolve(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  return isObservable(result) ? firstValueFrom(result) : result;
}

describe('public preview access guards', () => {
  function configure(options: { user?: unknown; sessionHint: boolean; ensureMe?: jasmine.Spy }) {
    const ensureMe = options.ensureMe ?? jasmine.createSpy('ensureMe').and.returnValue(of(options.user ?? null));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => !!options.user, user: () => options.user ?? null, ensureMe } },
        { provide: AuthSessionAuthorityService, useValue: { hasSessionHint: () => options.sessionHint } },
      ],
    });
    return ensureMe;
  }

  function run(fixture: PreviewFixture) {
    const route = { paramMap: convertToParamMap({ slug: fixture.slug }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => fixture.guard(route, { url: fixture.url } as RouterStateSnapshot));
  }

  for (const [family, fixture] of Object.entries(FIXTURES) as Array<['tracks' | 'companies', PreviewFixture]>) {
    it(`${family}: an anonymous visitor without a session hint gets the preview without an API round trip`, async () => {
      const ensureMe = configure({ sessionHint: false });
      expect(await resolve(run(fixture))).toBeTrue();
      expect(ensureMe).not.toHaveBeenCalled();
    });

    it(`${family}: a visitor with a session hint is resolved through the API before deciding`, async () => {
      const ensureMe = configure({ sessionHint: true, user: undefined });
      expect(await resolve(run(fixture))).toBeTrue();
      expect(ensureMe).toHaveBeenCalledTimes(1);
    });

    it(`${family}: a premium member resolved through the API is sent to the full route`, async () => {
      const member = { role: 'user', accessTier: 'premium' };
      configure({ sessionHint: true, ensureMe: jasmine.createSpy('ensureMe').and.returnValue(of(member)) });
      const result = await resolve(run(fixture));
      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(fixture.detailUrl);
    });

    it(`${family}: a signed-in free user keeps the preview without another lookup`, async () => {
      const ensureMe = configure({ sessionHint: true, user: { role: 'user', accessTier: 'free' } });
      expect(await resolve(run(fixture))).toBeTrue();
      expect(ensureMe).not.toHaveBeenCalled();
    });
  }
});
