import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { BillingSuccessComponent } from './billing-success.component';

describe('BillingSuccessComponent', () => {
  let fixture: ComponentFixture<BillingSuccessComponent>;
  let component: BillingSuccessComponent;
  let router: Router;
  let billingCheckoutStub: jasmine.SpyObj<BillingCheckoutService>;
  let authStub: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    (window as any).__billingPollConfig = { maxAttempts: 3, intervalMs: 25 };

    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', [
      'fetchAttemptStatus',
    ]);
    authStub = jasmine.createSpyObj<AuthService>('AuthService', ['fetchMeStatus']);

    await TestBed.configureTestingModule({
      imports: [BillingSuccessComponent],
      providers: [
        provideRouter([]),
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        { provide: AuthService, useValue: authStub },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track']),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ attempt: 'chk_success_123' }),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  afterEach(() => {
    delete (window as any).__billingPollConfig;
  });

  it('polls attempt status until checkout is applied, then redirects to profile', fakeAsync(() => {
    billingCheckoutStub.fetchAttemptStatus.and.returnValues(
      of({
        attempt: {
          attemptId: 'chk_success_123',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'awaiting_webhook',
          rawStatus: 'created',
          entitlementActive: false,
          accessTierEffective: 'free',
          billingEventId: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        status: 200,
      }),
      of({
        attempt: {
          attemptId: 'chk_success_123',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'applied',
          rawStatus: 'applied',
          entitlementActive: true,
          accessTierEffective: 'premium',
          billingEventId: 'test:event_123',
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        status: 200,
      })
    );

    fixture = TestBed.createComponent(BillingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    tick(25);

    expect(billingCheckoutStub.fetchAttemptStatus).toHaveBeenCalledWith('chk_success_123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
    expect(component.state()).toBe('syncing');
  }));

  it('shows a pending-user-match state when the payment cannot be safely linked', fakeAsync(() => {
    billingCheckoutStub.fetchAttemptStatus.and.returnValue(
      of({
        attempt: {
          attemptId: 'chk_success_123',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'pending_user_match',
          rawStatus: 'pending_user_match',
          entitlementActive: false,
          accessTierEffective: 'free',
          billingEventId: 'test:event_456',
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        status: 200,
      })
    );

    fixture = TestBed.createComponent(BillingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.state()).toBe('pending-user-match');
    const element = fixture.nativeElement.querySelector('[data-testid="billing-pending-user-match"]');
    expect(element).toBeTruthy();
    expect(element.textContent).toContain('could not safely match it to this account');
  }));

  it('preserves the success attempt as redirectTo when sign-in is required', fakeAsync(() => {
    billingCheckoutStub.fetchAttemptStatus.and.returnValue(
      of({
        attempt: null,
        status: 401,
        code: 'AUTH_INVALID',
      })
    );

    fixture = TestBed.createComponent(BillingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.state()).toBe('login-required');
    expect(component.loginRedirectTo()).toBe('/billing/success?attempt=chk_success_123');

    const link = fixture.nativeElement.querySelector('.timeout .btn') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/auth/login');
    expect(decodeURIComponent(link.getAttribute('href') || '')).toContain('redirectTo=/billing/success?attempt=chk_success_123');
  }));

  it('uses the legacy entitlement-only polling fallback when there is no attempt id', fakeAsync(async () => {
    TestBed.resetTestingModule();

    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', [
      'fetchAttemptStatus',
    ]);
    authStub = jasmine.createSpyObj<AuthService>('AuthService', ['fetchMeStatus']);
    authStub.fetchMeStatus.and.returnValue(
      of({
        user: {
          _id: 'user_legacy_billing',
          username: 'legacy_user',
          email: 'legacy@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
          prefs: {
            tz: 'Europe/Istanbul',
            theme: 'system',
            defaultTech: 'javascript',
            keyboard: 'default',
            marketingEmails: false,
          },
          effectiveProActive: true,
          accessTierEffective: 'premium',
          entitlements: {
            pro: { status: 'active', validUntil: null },
            projects: { status: 'none', validUntil: null },
          },
        } as any,
        status: 200,
      })
    );

    await TestBed.configureTestingModule({
      imports: [BillingSuccessComponent],
      providers: [
        provideRouter([]),
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        { provide: AuthService, useValue: authStub },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track']),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(BillingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(authStub.fetchMeStatus).toHaveBeenCalled();
    expect(billingCheckoutStub.fetchAttemptStatus).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  }));
});
