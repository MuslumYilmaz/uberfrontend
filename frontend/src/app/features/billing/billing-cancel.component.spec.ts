import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { BillingCancelComponent } from './billing-cancel.component';

describe('BillingCancelComponent', () => {
  let fixture: ComponentFixture<BillingCancelComponent>;
  let analyticsStub: jasmine.SpyObj<AnalyticsService>;
  let billingCheckoutStub: jasmine.SpyObj<BillingCheckoutService>;

  beforeEach(async () => {
    sessionStorage.removeItem('fa:checkout:intent:v1');
    sessionStorage.removeItem('fa:checkout:last_plan_id');
    sessionStorage.removeItem('fa:checkout:last_source');

    analyticsStub = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', [
      'recordAttemptClientState',
    ]);
    billingCheckoutStub.recordAttemptClientState.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [BillingCancelComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsStub },
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        {
          provide: OnboardingService,
          useValue: { getProfile: jasmine.createSpy('getProfile').and.returnValue(null) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ attempt: 'chk_cancel_123' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('fa:checkout:intent:v1');
    sessionStorage.removeItem('fa:checkout:last_plan_id');
    sessionStorage.removeItem('fa:checkout:last_source');
  });

  it('uses v1 intent attribution for cancel and winback analytics before clearing storage', () => {
    sessionStorage.setItem('fa:checkout:intent:v1', JSON.stringify({
      version: 1,
      planId: 'quarterly',
      src: 'showcase_hero',
      surface: 'showcase_pricing',
      returnUrl: '/pricing',
      createdAt: Date.now(),
    }));
    sessionStorage.setItem('fa:checkout:last_plan_id', 'monthly');
    sessionStorage.setItem('fa:checkout:last_source', 'legacy_pricing');

    fixture = TestBed.createComponent(BillingCancelComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(billingCheckoutStub.recordAttemptClientState).toHaveBeenCalledWith(
      'chk_cancel_123',
      'cancel_redirected',
    );
    expect(analyticsStub.track).toHaveBeenCalledWith('checkout_canceled', jasmine.objectContaining({
      attempt_id: 'chk_cancel_123',
      plan_id: 'quarterly',
      src: 'showcase_hero',
      surface: 'showcase_pricing',
    }));
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).toBeNull();
    expect(sessionStorage.getItem('fa:checkout:last_plan_id')).toBeNull();
    expect(sessionStorage.getItem('fa:checkout:last_source')).toBeNull();

    component.trackWinback('return_to_pricing');
    expect(analyticsStub.track).toHaveBeenCalledWith(
      'checkout_cancel_winback_clicked',
      jasmine.objectContaining({
        action: 'return_to_pricing',
        plan_id: 'quarterly',
        src: 'showcase_hero',
        surface: 'showcase_pricing',
      }),
    );
  });

  it('uses legacy plan and source only when no v1 intent is available', () => {
    sessionStorage.setItem('fa:checkout:last_plan_id', 'annual');
    sessionStorage.setItem('fa:checkout:last_source', 'legacy_pricing');

    fixture = TestBed.createComponent(BillingCancelComponent);
    fixture.detectChanges();

    expect(analyticsStub.track).toHaveBeenCalledWith('checkout_canceled', jasmine.objectContaining({
      plan_id: 'annual',
      src: 'legacy_pricing',
      surface: 'billing_cancel',
    }));
    expect(sessionStorage.getItem('fa:checkout:last_plan_id')).toBeNull();
    expect(sessionStorage.getItem('fa:checkout:last_source')).toBeNull();
  });
});
