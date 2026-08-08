import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { SeoAdminService } from '../services/seo-admin.service';
import { seoOwnerGuard } from './seo-owner.guard';

describe('seoOwnerGuard', () => {
  async function run(options: {
    user: Pick<User, '_id' | 'username' | 'email' | 'role'> | null;
    allowed?: boolean;
    accessError?: boolean;
  }): Promise<boolean | UrlTree> {
    const currentUser = options.user as User | null;
    const auth = {
      user: signal<User | null>(currentUser),
      ensureMe: jasmine.createSpy('ensureMe').and.returnValue(of(currentUser)),
    };
    const seoAdmin = jasmine.createSpyObj<SeoAdminService>('SeoAdminService', [
      'bindOwnerPrincipal',
      'checkAccess',
    ]);
    seoAdmin.checkAccess.and.returnValue(
      options.accessError
        ? throwError(() => new Error('unavailable'))
        : of({ allowed: options.allowed === true, enabled: true }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: SeoAdminService, useValue: seoAdmin },
      ],
    });

    const result = TestBed.runInInjectionContext(() => seoOwnerGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/admin/seo' } as RouterStateSnapshot,
    )) as Observable<boolean | UrlTree>;
    return firstValueFrom(result);
  }

  const user = (role: 'user' | 'admin') => ({
    _id: `${role}-id`,
    username: role,
    email: `${role}@example.com`,
    role,
  });

  it('allows only an admin whose server capability succeeds', async () => {
    expect(await run({ user: user('admin'), allowed: true })).toBeTrue();
    expect(TestBed.inject(SeoAdminService).bindOwnerPrincipal).toHaveBeenCalledOnceWith('admin-id');
  });

  it('hides the route from another admin and from a normal user', async () => {
    const deniedAdmin = await run({ user: user('admin'), allowed: false });
    expect(TestBed.inject(Router).serializeUrl(deniedAdmin as UrlTree)).toBe('/404');

    const deniedUser = await run({ user: user('user'), allowed: true });
    expect(TestBed.inject(Router).serializeUrl(deniedUser as UrlTree)).toBe('/404');
    expect(TestBed.inject(SeoAdminService).checkAccess).not.toHaveBeenCalled();
  });

  it('fails closed when the owner capability request fails', async () => {
    const result = await run({ user: user('admin'), accessError: true });
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/404');
  });

  it('sends signed-out visitors to login with the original route', async () => {
    const result = await run({ user: null });
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/auth/login?redirectTo=%2Fadmin%2Fseo',
    );
  });
});
