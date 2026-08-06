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
  let analyticsStub: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    (window as any).__billingPollConfig = { maxAttempts: 3, intervalMs: 25 };

    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', [
      'fetchAttemptStatus',
    ]);
    authStub = jasmine.createSpyObj<AuthService>('AuthService', ['fetchMeStatus']);
    analyticsStub = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [BillingSuccessComponent],
      providers: [
        provideRouter([]),
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        { provide: AuthService, useValue: authStub },
        {
          provide: AnalyticsService,
          useValue: analyticsStub,
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
    localStorage.removeItem('fa:analytics:purchase:order_live_123');
  });

  it('polls attempt status until checkout is applied, then redirects to profile', fakeAsync(() => {
    let pollCount = 0;
    billingCheckoutStub.fetchAttemptStatus.and.callFake(() => {
      pollCount += 1;
      return of({
        attempt: pollCount === 1 ? {
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
          purchase: null,
        } : {
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
          purchase: null,
        },
        status: 200,
      });
    });

    fixture = TestBed.createComponent(BillingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    tick(99);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    tick(1);

    expect(billingCheckoutStub.fetchAttemptStatus).toHaveBeenCalledWith('chk_success_123');
    expect(pollCount).toBe(5);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
    expect(component.state()).toBe('syncing');
    expect(analyticsStub.track).toHaveBeenCalledWith('checkout_verified', jasmine.objectContaining({
      checkout_mode: 'test',
      entitlement_applied: true,
    }));
    expect(analyticsStub.track).not.toHaveBeenCalledWith('purchase', jasmine.anything());
    expect(analyticsStub.track).not.toHaveBeenCalledWith('checkout_completed', jasmine.anything());
  }));

  it('tracks a verified live purchase once per transaction id across success-page reloads', fakeAsync(() => {
    const liveAttempt = {
      attemptId: 'chk_success_123',
      provider: 'lemonsqueezy' as const,
      planId: 'annual' as const,
      mode: 'live' as const,
      state: 'applied' as const,
      rawStatus: 'applied',
      entitlementActive: true,
      accessTierEffective: 'premium' as const,
      billingEventId: 'live:subscription_created:sub_123',
      lastErrorCode: null,
      lastErrorMessage: null,
      purchase: {
        transactionId: 'order_live_123',
        currency: 'USD',
        value: 69,
        tax: 12.42,
        total: 81.42,
        items: [{
          item_id: 'frontendatlas_annual',
          item_name: 'Annual Premium',
          price: 69,
          quantity: 1,
        }],
        source: 'pricing_page',
        verifiedAt: '2026-08-05T10:00:00.000Z',
      },
    };
    billingCheckoutStub.fetchAttemptStatus.and.returnValue(of({ attempt: liveAttempt, status: 200 }));

    fixture = TestBed.createComponent(BillingSuccessComponent);
    fixture.detectChanges();
    tick();

    expect(analyticsStub.track).toHaveBeenCalledWith('purchase', jasmine.objectContaining({
      transaction_id: 'order_live_123',
      currency: 'USD',
      value: 69,
      tax: 12.42,
      checkout_mode: 'live',
    }));
    expect(analyticsStub.track.calls.allArgs().filter(([name]) => name === 'purchase')).toHaveSize(1);

    fixture.destroy();
    analyticsStub.track.calls.reset();
    fixture = TestBed.createComponent(BillingSuccessComponent);
    fixture.detectChanges();
    tick();

    expect(analyticsStub.track.calls.allArgs().filter(([name]) => name === 'purchase')).toHaveSize(0);
    expect(analyticsStub.track).toHaveBeenCalledWith('checkout_verified', jasmine.anything());
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
          purchase: null,
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
