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

  it('renders quarterly as the only recommended sprint plan', () => {
    fixture.detectChanges();

    const planCards = Array.from(fixture.nativeElement.querySelectorAll('.pr-card')) as HTMLElement[];
    const badges = Array.from(fixture.nativeElement.querySelectorAll('.rec-badge')) as HTMLElement[];
    const recommendedCards = Array.from(fixture.nativeElement.querySelectorAll('.pr-rec')) as HTMLElement[];
    const quarterlyCard = fixture.nativeElement
      .querySelector('[data-testid="pricing-cta-quarterly"]')
      ?.closest('.pr-card') as HTMLElement;

    expect(planCards[1]).toBe(quarterlyCard);
    expect(badges.filter((badge) => (badge.textContent || '').includes('Recommended sprint')).length).toBe(1);
    expect(recommendedCards.length).toBe(1);
    expect(recommendedCards[0]).toBe(quarterlyCard);
    expect(quarterlyCard.textContent || '').toContain('Recommended sprint');
    expect(quarterlyCard.textContent || '').toContain('Best for 4-12 week interview prep');
  });

  it('uses plan-specific CTA labels and keeps planned copy out of plan cards', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const planCardsText = Array.from(page.querySelectorAll('.pr-card'))
      .map((card) => card.textContent || '')
      .join(' ');

    expect((page.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement).textContent || '').toContain('Start monthly');
    expect((page.querySelector('[data-testid="pricing-cta-quarterly"]') as HTMLButtonElement).textContent || '').toContain('Start quarterly');
    expect((page.querySelector('[data-testid="pricing-cta-annual"]') as HTMLButtonElement).textContent || '').toContain('Start annual');
    expect((page.querySelector('[data-testid="pricing-cta-lifetime"]') as HTMLButtonElement).textContent || '').toContain('Get lifetime access');
    expect(planCardsText.toLowerCase()).not.toContain('planned');
  });

  it('renders a compact same-premium strip without the old pre-plan bullet list', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const strip = page.querySelector('.plan-unlock-strip') as HTMLElement;

    expect(strip.textContent || '').toContain('Same Premium library. Choose the timeline that fits your prep.');
    expect(strip.textContent || '').not.toContain('Recommended sprint: Quarterly, $29 / 3 months.');
    expect(strip.querySelectorAll('.pr-proof-chips span').length).toBe(3);
    expect(strip.querySelector('ul')).toBeNull();
    expect(page.querySelector('.included-box.plan-unlock')).toBeNull();
  });

  it('renders curated premium unlock preview cards with internal preview links', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const cards = Array.from(page.querySelectorAll('.unlock-preview__card')) as HTMLElement[];
    const links = Array.from(page.querySelectorAll('.unlock-preview__link')) as HTMLAnchorElement[];

    expect(cards.length).toBe(3);
    expect(page.textContent || '').toContain('Premium unlock preview');
    expect(page.textContent || '').toContain('Contact Form (Component + HTTP)');
    expect(page.textContent || '').toContain('Multi-step Form with Autosave');
    expect(page.textContent || '').toContain('Solution depth where available');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/react/coding/react-contact-form-starter',
      '/system-design/multi-step-form-autosave',
      '/javascript/coding/js-throttle',
    ]);
  });

  it('places Free Explorer after the plan cards', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const planGrid = page.querySelector('.pr-grid') as HTMLElement;
    const freeExplorer = page.querySelector('.free-explorer') as HTMLElement;

    expect(planGrid.compareDocumentPosition(freeExplorer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('tracks pricing plan and value anchor visibility in the no-observer fallback', () => {
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const win = window as any;
    const originalObserver = win.IntersectionObserver;
    win.IntersectionObserver = undefined;

    try {
      fixture.detectChanges();
    } finally {
      win.IntersectionObserver = originalObserver;
    }

    expect(analytics.track).toHaveBeenCalledWith('pricing_plan_cards_seen', jasmine.objectContaining({
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
      plan_count: 4,
    }));
    expect(analytics.track).toHaveBeenCalledWith('pricing_unlock_preview_seen', jasmine.objectContaining({
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
      card_count: 3,
    }));
    expect(analytics.track).toHaveBeenCalledWith('pricing_value_anchor_seen', jasmine.objectContaining({
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
      anchor: 'why_upgrade_now',
    }));
  });

  it('tracks free path clicks with pricing context', () => {
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;

    component.trackFreePathClick('free_challenge', '/react/coding/react-counter');

    expect(analytics.track).toHaveBeenCalledWith('pricing_free_path_clicked', jasmine.objectContaining({
      cta: 'free_challenge',
      destination: '/react/coding/react-counter',
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
    }));
  });

  it('tracks premium unlock preview clicks with pricing context', () => {
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;

    component.trackUnlockPreviewClick(component.unlockPreviewCards[0]);

    expect(analytics.track).toHaveBeenCalledWith('pricing_unlock_preview_clicked', jasmine.objectContaining({
      preview_type: 'coding_depth',
      destination: '/react/coding/react-contact-form-starter',
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
    }));
  });

  it('tracks plan CTA metadata for pricing analytics', async () => {
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = {
      monthly: false,
      quarterly: false,
      annual: false,
      lifetime: false,
    };

    await component.onCta('quarterly');

    const planClick = analytics.track.calls.allArgs().find(([event]) => event === 'pricing_plan_cta_clicked');
    expect(planClick?.[1]).toEqual(jasmine.objectContaining({
      plan_id: 'quarterly',
      method: 'checkout_unavailable',
      cta_label: 'Start quarterly',
      plan_position: 2,
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
    }));
  });

  it('opens the sign-in dialog for logged-out checkout while preserving the pricing redirect', async () => {
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = {
      monthly: true,
      quarterly: true,
      annual: true,
      lifetime: true,
    };

    await component.onCta('quarterly');

    expect(component.loginRequiredOpen).toBeTrue();
    expect(component.loginRedirectTo).toBe('/');
    expect(billingCheckout.checkout).not.toHaveBeenCalled();
  });

  it('shows a blocked-popup notice when checkout window opening is blocked', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;

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
    const checkoutStarted = analytics.track.calls.allArgs().find(([event]) => event === 'checkout_started');
    expect(checkoutStarted?.[1]).toEqual(jasmine.objectContaining({
      plan_id: 'monthly',
      page_layout: 'interview_sprint_v1',
      recommended_plan: 'quarterly',
    }));
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

  it('renders structured recent product updates with direct changelog anchors', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const text = page.textContent || '';
    const items = Array.from(page.querySelectorAll('.weekly-changelog__item')) as HTMLAnchorElement[];
    const firstBullets = items[0]?.querySelectorAll('.weekly-changelog__bullets li') || [];

    expect(text).toContain('Recent product updates');
    expect(text).not.toContain('What changed this week');
    expect(items.length).toBe(3);
    expect(items[0].getAttribute('href') || '').toContain('/changelog#earned-badges-are-easier-to-see');
    expect(items[0].textContent || '').toContain('New');
    expect(items[0].textContent || '').toContain('Progress');
    expect(items[0].textContent || '').toContain('Progress now feels more collectible');
    expect(firstBullets.length).toBe(2);
  });
});
