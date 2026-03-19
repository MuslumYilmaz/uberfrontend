import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BillingCheckoutService } from '../../../../core/services/billing-checkout.service';
import { PricingPlansSectionComponent } from './pricing-plans-section.component';

describe('PricingPlansSectionComponent', () => {
  let fixture: ComponentFixture<PricingPlansSectionComponent>;
  let component: PricingPlansSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingPlansSectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: jasmine.createSpy('user').and.returnValue(null),
            ensureMe: jasmine.createSpy('ensureMe'),
            getManageSubscriptionUrl: jasmine.createSpy('getManageSubscriptionUrl'),
          },
        },
        {
          provide: BillingCheckoutService,
          useValue: jasmine.createSpyObj('BillingCheckoutService', ['prefetch', 'checkout']),
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingPlansSectionComponent);
    component = fixture.componentInstance;
    component.variant = 'full';
  });

  it('disables plans that backend checkout config marks unavailable', () => {
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = {
      monthly: false,
      quarterly: true,
      annual: true,
      lifetime: true,
    };

    fixture.detectChanges();

    const monthlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    const quarterlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-quarterly"]') as HTMLButtonElement;

    expect(monthlyButton.disabled).toBeTrue();
    expect(monthlyButton.getAttribute('title')).toBe('Checkout is temporarily unavailable.');
    expect(quarterlyButton.disabled).toBeFalse();
  });

  it('does not pessimistically disable checkout before backend config is ready', () => {
    component.paymentsEnabled = true;
    component.paymentsConfigReady = false;
    component.checkoutAvailability = null;

    fixture.detectChanges();

    const monthlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    expect(monthlyButton.disabled).toBeFalse();
  });

  it('shows a blocked-popup notice when checkout window opening is blocked', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;

    auth.user.and.returnValue({
      _id: 'user_1',
      username: 'billing_user',
      email: 'billing@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'blocked',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test',
      attemptId: 'chk_blocked',
      reused: false,
    });

    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = {
      monthly: true,
      quarterly: true,
      annual: true,
      lifetime: true,
    };

    await component.onCta('monthly');

    expect(component.checkoutNotice).toBe('Your browser blocked the checkout window. Allow popups and try again.');
  });

  it('shows the shared manage-url fallback message when billing portal is unavailable', () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    auth.user.and.returnValue({
      _id: 'user_1',
      username: 'billing_user',
      email: 'billing@example.com',
      entitlements: { pro: { status: 'active', validUntil: null } },
      billing: { providers: { lemonsqueezy: { subscriptionId: 'sub_1' } } },
    } as any);
    auth.getManageSubscriptionUrl.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { code: 'MANAGE_URL_UNAVAILABLE' },
      }))
    );

    component.onCta('monthly');

    expect(component.checkoutNotice).toBe(
      'We could not open the billing portal automatically right now. Contact support@frontendatlas.com for help.'
    );
  });
});
