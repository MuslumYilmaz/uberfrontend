import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  let fixture: ComponentFixture<PricingComponent>;
  let component: PricingComponent;
  let billingCheckoutStub: jasmine.SpyObj<BillingCheckoutService>;
  let analyticsStub: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    sessionStorage.removeItem('fa:conversion:pricing-context:v1');
    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', ['getCheckoutConfig', 'prefetch']);
    billingCheckoutStub.getCheckoutConfig.and.resolveTo(null);
    billingCheckoutStub.prefetch.and.resolveTo();
    analyticsStub = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [
        provideRouter([]),
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        {
          provide: AuthService,
          useValue: {
            authUiState: signal('signed_out'),
            user: jasmine.createSpy('user').and.returnValue(null),
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            ensureMe: jasmine.createSpy('ensureMe'),
            getManageSubscriptionUrl: jasmine.createSpy('getManageSubscriptionUrl'),
          },
        },
        {
          provide: AnalyticsService,
          useValue: analyticsStub,
        },
      ],
    }).compileComponents();
  });

  it('falls back to disabled payments when backend checkout config cannot be loaded', async () => {
    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();

    expect(billingCheckoutStub.getCheckoutConfig).toHaveBeenCalled();
    expect(component.paymentsConfigReady).toBeTrue();
    expect(component.paymentsEnabled).toBeFalse();
    expect(component.checkoutAvailability).toBeNull();
    expect(analyticsStub.track).toHaveBeenCalledWith('pricing_page_viewed', jasmine.objectContaining({
      src: 'pricing_page',
      surface: 'pricing_page',
      page: 'pricing',
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
    }));
    expect(analyticsStub.track).toHaveBeenCalledWith('checkout_config_failed', {
      src: 'pricing_page',
      surface: 'pricing_page',
      failure_reason: 'unavailable_after_retry',
    });
  });

  it('keeps direct checkout pending until config resolves, then exposes only enabled plans', async () => {
    let resolveConfig!: (value: any) => void;
    billingCheckoutStub.getCheckoutConfig.and.returnValue(new Promise((resolve) => {
      resolveConfig = resolve;
    }));
    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    let monthlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    let planGrid = fixture.nativeElement.querySelector('.pr-grid') as HTMLElement;
    expect(component.paymentsConfigReady).toBeFalse();
    expect(monthlyButton.disabled).toBeTrue();
    expect(planGrid.getAttribute('aria-busy')).toBe('true');

    resolveConfig({
      enabled: true,
      plans: { monthly: true, quarterly: false, annual: true, lifetime: false },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    monthlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    const quarterlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-quarterly"]') as HTMLButtonElement;
    planGrid = fixture.nativeElement.querySelector('.pr-grid') as HTMLElement;
    expect(component.paymentsConfigReady).toBeTrue();
    expect(monthlyButton.disabled).toBeFalse();
    expect(quarterlyButton.disabled).toBeTrue();
    expect(planGrid.hasAttribute('aria-busy')).toBeFalse();
  });
});
