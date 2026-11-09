import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { companyPlanGuard } from './company-plan.guard';

describe('companyPlanGuard', () => {
  function run(user: unknown): boolean | string {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { ensureMe: () => (user instanceof Error ? throwError(() => user) : of(user)) } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => companyPlanGuard({} as never, {} as never)) as Observable<boolean | UrlTree>;
    let value: boolean | UrlTree = false;
    result.subscribe((answer) => (value = answer));
    return typeof value === 'boolean' ? value : TestBed.inject(Router).serializeUrl(value);
  }

  it('opens the plan to Premium members and admins', () => {
    expect(run({ _id: 'a', entitlements: { pro: { status: 'lifetime' } } })).toBeTrue();
    expect(run({ _id: 'b', role: 'admin', entitlements: { pro: { status: 'none' } } })).toBeTrue();
  });

  it('sends a free account to its preview, where the way to Premium is', () => {
    expect(run({ _id: 'c', entitlements: { pro: { status: 'none' } } })).toBe('/companies/preview');
    expect(run({ _id: 'd' })).toBe('/companies/preview');
  });

  it('opens the plan to a member whose Premium ran out, where it offers to renew', () => {
    expect(run({ _id: 'e', entitlements: { pro: { status: 'expired' } } })).toBeTrue();
    expect(run({ _id: 'f', entitlements: { pro: { status: 'cancelled', validUntil: '2020-01-01' } } })).toBeTrue();
  });

  it('asks a guest to sign in and come back, also when the account cannot be read', () => {
    expect(run(null)).toBe('/auth/login?redirectTo=%2Fcompanies%2Fplan');
    expect(run(new Error('offline'))).toBe('/auth/login?redirectTo=%2Fcompanies%2Fplan');
  });
});
