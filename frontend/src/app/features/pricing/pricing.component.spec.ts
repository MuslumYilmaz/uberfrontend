import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { ExperimentService } from '../../core/services/experiment.service';
import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  let fixture: ComponentFixture<PricingComponent>;
  let component: PricingComponent;
  let billingCheckoutStub: jasmine.SpyObj<BillingCheckoutService>;

  beforeEach(async () => {
    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', ['getCheckoutConfig', 'prefetch']);
    billingCheckoutStub.getCheckoutConfig.and.resolveTo(null);
    billingCheckoutStub.prefetch.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [
        provideRouter([]),
        { provide: BillingCheckoutService, useValue: billingCheckoutStub },
        {
          provide: AuthService,
          useValue: {
            user: jasmine.createSpy('user').and.returnValue(null),
            ensureMe: jasmine.createSpy('ensureMe'),
            getManageSubscriptionUrl: jasmine.createSpy('getManageSubscriptionUrl'),
          },
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track']),
        },
        {
          provide: ExperimentService,
          useValue: jasmine.createSpyObj('ExperimentService', ['variant', 'expose']),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ src: 'pricing_test' }),
            },
          },
        },
      ],
    }).compileComponents();

    const experiments = TestBed.inject(ExperimentService) as jasmine.SpyObj<ExperimentService>;
    experiments.variant.and.returnValue('top');
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
  });
});
