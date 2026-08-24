import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PUBLIC_CHANGELOG_ENTRIES } from '../../../../core/content/public-changelog';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BillingCheckoutService } from '../../../../core/services/billing-checkout.service';
import { CheckoutIntentService } from '../../../../core/services/checkout-intent.service';
import {
  PRICING_V2_OFFER_VERSION,
  PricingPlanDetails,
  PricingPlansSectionComponent,
} from './pricing-plans-section.component';

const TEST_PLAN_DETAILS: PricingPlanDetails = {
  monthly: { amountCents: 1200, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
  quarterly: { amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
  annual: { amountCents: 7900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
  lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
};

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
          useValue: jasmine.createSpyObj('BillingCheckoutService', [
            'prefetch',
            'checkout',
            'reserveCheckoutWindow',
            'recordAttemptClientState',
          ]),
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track', 'getDecisionSessionId']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingPlansSectionComponent);
    component = fixture.componentInstance;
    component.variant = 'full';
    component.ctaMode = 'checkout';
    component.planDetails = TEST_PLAN_DETAILS;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    billingCheckout.reserveCheckoutWindow.and.returnValue(null);
    billingCheckout.recordAttemptClientState.and.returnValue(of({} as any));
    sessionStorage.removeItem('fa:checkout:intent:v1');
  });

  afterEach(() => sessionStorage.removeItem('fa:checkout:intent:v1'));

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

  it('fails closed while backend checkout config is loading', () => {
    component.paymentsEnabled = true;
    component.paymentsConfigReady = false;
    component.checkoutAvailability = null;

    fixture.detectChanges();

    const monthlyButton = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    const planGrid = fixture.nativeElement.querySelector('.pr-grid') as HTMLElement;

    expect(monthlyButton.disabled).toBeTrue();
    expect(monthlyButton.getAttribute('title')).toBe('Checking checkout availability...');
    expect(planGrid.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.textContent || '').toContain('Checking checkout availability…');
  });

  it('keeps navigatePricing authoritative across pending, enabled, and unavailable config states', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    component.ctaMode = 'navigatePricing';

    for (const state of [
      { ready: false, enabled: false, available: null },
      { ready: true, enabled: true, available: { monthly: true } },
      { ready: true, enabled: false, available: { monthly: false } },
    ]) {
      component.paymentsConfigReady = state.ready;
      component.paymentsEnabled = state.enabled;
      component.checkoutAvailability = state.available;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
      expect(button.disabled).withContext(JSON.stringify(state)).toBeFalse();
      await component.onCta('monthly');
    }

    expect(navigate).toHaveBeenCalledTimes(3);
    expect(navigate).toHaveBeenCalledWith(['/pricing'], { fragment: 'pricing-plans' });
    expect(billingCheckout.checkout).not.toHaveBeenCalled();
    expect(billingCheckout.prefetch).not.toHaveBeenCalled();
    expect(component.loginRequiredOpen).toBeFalse();
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).toBeNull();
    expect(analytics.track).toHaveBeenCalledWith('pricing_plan_cta_clicked', jasmine.objectContaining({
      method: 'navigate_pricing',
      plan_id: 'monthly',
    }));
    expect(fixture.nativeElement.textContent || '').not.toContain('Checkout is temporarily unavailable');
    expect(fixture.nativeElement.textContent || '').not.toContain('Checking checkout availability');
  });

  it('lets an active Pro user manage a subscription when purchase config failed', () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    auth.user.and.returnValue({
      _id: 'pro_user',
      entitlements: { pro: { status: 'active', validUntil: null } },
    } as any);
    auth.getManageSubscriptionUrl.and.returnValue(of({ url: 'https://billing.example.com/manage' } as any));
    component.paymentsEnabled = false;
    component.paymentsConfigReady = true;

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(button.textContent || '').toContain('Manage subscription');
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

  it('keeps offer v2 gated while rendering authoritative config prices and a secondary lifetime offer', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.planDetails = {
      monthly: { amountCents: 1500, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
      quarterly: { amountCents: 3600, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
      annual: { amountCents: 10800, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
      lifetime: { amountCents: 25000, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
    };

    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const primaryCards = Array.from(page.querySelectorAll('.pr-grid .pr-card')) as HTMLElement[];
    const primaryCtas = primaryCards.map((card) => card.querySelector('button')?.dataset['testid']);
    const badges = Array.from(page.querySelectorAll('.rec-badge')) as HTMLElement[];
    const lifetime = page.querySelector('[data-testid="pricing-lifetime-secondary"]') as HTMLElement;

    expect(primaryCtas).toEqual([
      'pricing-cta-monthly',
      'pricing-cta-quarterly',
      'pricing-cta-annual',
    ]);
    expect(primaryCards.map((card) => card.textContent || '').join(' ')).toContain('$15');
    expect(primaryCards.map((card) => card.textContent || '').join(' ')).toContain('$36');
    expect(primaryCards.map((card) => card.textContent || '').join(' ')).toContain('$108');
    expect(primaryCards[1].textContent || '').toContain('Save 20%');
    expect(primaryCards[2].textContent || '').toContain('Save 40%');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent || '').toContain('Recommended — 4–12 week interview sprint');
    expect(lifetime.textContent || '').toContain('$250');
    expect(page.querySelector('[data-testid="pricing-trust-strip"]')?.textContent || '').toContain('Taxes included');
    expect(page.querySelector('[data-testid="pricing-trust-strip"]')?.textContent || '').toContain('Limited-use refund requests are reviewed under the Refund Policy');
    expect(page.querySelector('[data-testid="pricing-trust-strip"] a')?.getAttribute('href') || '').toContain('/legal/refund');
    const productProof = page.querySelector('[data-testid="pricing-product-proof"]') as HTMLElement;
    const productProofImage = productProof.querySelector('img') as HTMLImageElement;
    const productProofLinks = Array.from(productProof.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(productProofImage.getAttribute('src')).toBe('assets/images/product-proof/react-counter-workspace.jpg');
    expect(productProofImage.getAttribute('alt')).toBe('FrontendAtlas React Counter workspace with prompt, code editor, live preview, and run checks controls');
    expect(productProofImage.getAttribute('loading')).toBe('lazy');
    expect(productProofImage.getAttribute('decoding')).toBe('async');
    expect(productProofImage.getAttribute('width')).toBe('1512');
    expect(productProofImage.getAttribute('height')).toBe('857');
    expect(productProofLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/react/coding/react-counter?src=pricing_product_proof',
      '/javascript/coding/js-throttle?src=pricing_product_proof',
    ]);
    expect(page.textContent || '').toContain('514 questions');
    expect(page.textContent || '').toContain('141 Premium prompts');
    expect(page.textContent || '').toContain('generally require limited Premium usage');
    expect(page.textContent || '').toContain('Renewal charges and unused subscription time are generally non-refundable');
    expect((page.textContent || '').toLowerCase()).not.toContain('money-back guarantee');
    expect((page.textContent || '').toLowerCase()).not.toContain('where available');
    expect((page.textContent || '').toLowerCase()).not.toContain('expanding');
  });

  it('keeps the real workspace proof out of the baseline offer', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pricing-product-proof"]')).toBeNull();
  });

  it('derives the approved quarterly and annual savings from backend metadata', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;

    expect(component.savingsLabel('quarterly')).toBe('Save 19%');
    expect(component.savingsLabel('annual')).toBe('Save 45%');
    expect(component.savingsLabel('monthly')).toBeNull();
    expect(component.savingsLabel('lifetime')).toBeNull();
  });

  it('shows an unavailable price placeholder instead of a hard-coded price when config is missing', () => {
    component.planDetails = null;

    fixture.detectChanges();

    const monthlyCard = fixture.nativeElement
      .querySelector('[data-testid="pricing-cta-monthly"]')
      ?.closest('.pr-card') as HTMLElement;
    expect(monthlyCard.textContent || '').toContain('—');
    expect(monthlyCard.textContent || '').toContain('Checkout unavailable');
    expect(monthlyCard.textContent || '').not.toContain('$12');
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
    expect(page.textContent || '').toContain('Guided implementation review');
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

    expect(analytics.track).toHaveBeenCalledWith('pricing_viewed', jasmine.objectContaining({
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
    component.campaignId = 'INTERVIEW_AUGUST';

    await component.onCta('quarterly');

    expect(component.loginRequiredOpen).toBeTrue();
    expect(component.loginRedirectTo).toBe('/pricing');
    expect(billingCheckout.checkout).not.toHaveBeenCalled();
    const storedIntent = sessionStorage.getItem('fa:checkout:intent:v1') || '';
    expect(storedIntent).toContain('quarterly');
    expect(storedIntent).toContain('interview_august');
  });

  it('auto-continues a valid post-auth checkout intent only for offer v2', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const checkoutIntent = TestBed.inject(CheckoutIntentService);
    auth.user.and.returnValue({
      _id: 'returning_user',
      username: 'returning_user',
      email: 'returning@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'overlay',
      checkoutMode: 'live',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/live',
      attemptId: 'chk_auto_continue',
      reused: false,
    });
    checkoutIntent.save({
      planId: 'quarterly',
      src: 'showcase_pricing',
      surface: 'showcase_pricing',
      campaignId: 'interview_august',
      returnUrl: '/pricing',
    });
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.checkoutSurface = 'overlay';
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    fixture.detectChanges();
    await fixture.whenStable();

    expect(billingCheckout.checkout).toHaveBeenCalledTimes(1);
    expect(billingCheckout.checkout).toHaveBeenCalledWith(
      'quarterly',
      jasmine.objectContaining({
        campaignId: 'interview_august',
        offerVersion: PRICING_V2_OFFER_VERSION,
        checkoutSurface: 'overlay',
      }),
      'showcase_pricing',
      'showcase_pricing',
    );
    const checkoutOpened = analytics.track.calls.allArgs().find(([event]) => event === 'checkout_opened');
    const beginCheckout = analytics.track.calls.allArgs().find(([event]) => event === 'begin_checkout');
    expect(checkoutOpened?.[1]?.['offer_campaign_id']).toBeUndefined();
    expect(beginCheckout?.[1]?.['offer_campaign_id']).toBeUndefined();
    expect(fixture.nativeElement.querySelector('[data-testid="checkout-continuation"]')).toBeNull();
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
      checkoutMode: 'test',
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

    expect(component.checkoutNotice).toContain('Continue safely in this tab');
    const beginCheckout = analytics.track.calls.allArgs().find(([event]) => event === 'begin_checkout');
    expect(beginCheckout).toBeUndefined();
    expect(analytics.track).toHaveBeenCalledWith('checkout_launch_failed', jasmine.objectContaining({
      failure_reason: 'popup_blocked',
      plan_id: 'monthly',
      provider: 'lemonsqueezy',
    }));
    expect(billingCheckout.checkout).toHaveBeenCalledWith(
      'monthly',
      jasmine.objectContaining({ userId: 'user_1', launchReservation: null }),
      'pricing',
      'pricing_page',
    );
    expect(billingCheckout.recordAttemptClientState).toHaveBeenCalledWith('chk_blocked', 'popup_blocked');
  });

  it('records state and checkout analytics before a Lemon.js same-tab fallback navigates', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const order: string[] = [];
    auth.user.and.returnValue({
      _id: 'fallback_user',
      username: 'fallback_user',
      email: 'fallback@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'same-tab',
      checkoutMode: 'live',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/fallback-quarterly',
      attemptId: 'chk_fallback_order',
      reused: false,
      campaignId: 'interview_august',
    });
    billingCheckout.recordAttemptClientState.and.callFake(() => {
      order.push('provider_opened');
      return of({} as any);
    });
    analytics.track.and.callFake((eventName: string) => {
      if (eventName === 'checkout_opened' || eventName === 'begin_checkout') order.push(eventName);
      return true;
    });
    (window as any).__faCheckoutRedirect = () => { order.push('navigate'); };
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.checkoutSurface = 'overlay';
    component.campaignId = 'INTERVIEW_AUGUST';
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    try {
      await component.onCta('quarterly');
    } finally {
      delete (window as any).__faCheckoutRedirect;
    }

    expect(order).toEqual(['checkout_opened', 'begin_checkout', 'provider_opened', 'navigate']);
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).toContain('quarterly');
    expect(analytics.track).toHaveBeenCalledWith('checkout_opened', jasmine.objectContaining({
      offer_campaign_id: 'interview_august',
      launch_mode: 'same_tab',
    }));
  });

  it('emits begin_checkout only after the provider tab opens', async () => {
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
      mode: 'new-tab',
      checkoutMode: 'live',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/live',
      attemptId: 'chk_opened',
      reused: false,
    });
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    await component.onCta('quarterly');

    expect(analytics.track).toHaveBeenCalledWith('checkout_opened', jasmine.objectContaining({
      plan: 'quarterly',
      launch_mode: 'new_tab',
    }));
    expect(analytics.track).toHaveBeenCalledWith('begin_checkout', jasmine.objectContaining({
      plan: 'quarterly',
      launch_mode: 'new_tab',
      checkout_mode: 'live',
      currency: 'USD',
      value: 29,
      offer_version: 'pricing_baseline_v1',
      checkout_surface: 'hosted_new_tab',
    }));
    expect(billingCheckout.recordAttemptClientState).toHaveBeenCalledWith('chk_opened', 'provider_opened');
  });

  it('uses the same backend plan metadata for rendered and begin_checkout prices', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    auth.user.and.returnValue({
      _id: 'user_price_contract',
      username: 'billing_user',
      email: 'billing@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'overlay',
      checkoutMode: 'live',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/live',
      attemptId: 'chk_price_contract',
      reused: false,
      campaignId: 'interview_august',
    });
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.checkoutSurface = 'overlay';
    component.campaignId = 'INTERVIEW_AUGUST';
    component.planDetails = {
      ...TEST_PLAN_DETAILS,
      quarterly: { amountCents: 3100, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
    };
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    fixture.detectChanges();
    const quarterlyCard = fixture.nativeElement
      .querySelector('[data-testid="pricing-cta-quarterly"]')
      ?.closest('.pr-card') as HTMLElement;
    expect(quarterlyCard.textContent || '').toContain('$31');

    await component.onCta('quarterly');

    expect(analytics.track).toHaveBeenCalledWith('begin_checkout', jasmine.objectContaining({
      plan_id: 'quarterly',
      value: 31,
      currency: 'USD',
      offer_version: 'interview_sprint_v2',
      checkout_surface: 'overlay',
      offer_campaign_id: 'interview_august',
    }));
    expect(billingCheckout.checkout).toHaveBeenCalledWith(
      'quarterly',
      jasmine.objectContaining({
        campaignId: 'interview_august',
        offerVersion: 'interview_sprint_v2',
        checkoutSurface: 'overlay',
      }),
      'pricing',
      'pricing_page',
    );
  });

  it('keeps the first plan intent when a second plan is clicked during checkout creation', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    auth.user.and.returnValue({
      _id: 'user_1',
      username: 'billing_user',
      email: 'billing@example.com',
    } as any);
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    let resolveCheckout!: (value: any) => void;
    billingCheckout.checkout.and.returnValue(new Promise((resolve) => {
      resolveCheckout = resolve;
    }));

    const firstCheckout = component.onCta('monthly');
    await Promise.resolve();
    await component.onCta('annual');

    expect(billingCheckout.checkout).toHaveBeenCalledTimes(1);
    expect(billingCheckout.checkout).toHaveBeenCalledWith(
      'monthly',
      jasmine.anything(),
      'pricing',
      'pricing_page',
    );
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).toContain('monthly');
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).not.toContain('annual');

    resolveCheckout({
      ok: false,
      provider: 'lemonsqueezy',
      reason: 'start-failed',
    });
    await firstCheckout;
  });

  it('tells an unverified Gumroad user how to unblock checkout', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    auth.user.and.returnValue({
      _id: 'user_1',
      username: 'billing_user',
      email: 'billing@example.com',
      emailVerified: false,
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: false,
      provider: 'gumroad',
      reason: 'verification-required',
    });
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = {
      monthly: true,
      quarterly: true,
      annual: true,
      lifetime: false,
    };

    await component.onCta('monthly');

    expect(component.checkoutNotice).toBe('Verify your email in Profile → Account before starting checkout.');
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
    const latest = PUBLIC_CHANGELOG_ENTRIES[0];

    expect(text).toContain('Recent product updates');
    expect(text).not.toContain('What changed this week');
    expect(items.length).toBe(3);
    expect(items[0].getAttribute('href') || '').toContain(`/changelog#${latest.id}`);
    expect(items[0].textContent || '').toContain(latest.category);
    expect(items[0].textContent || '').toContain(latest.area);
    expect(items[0].textContent || '').toContain(latest.summary);
    expect(firstBullets.length).toBe(2);
  });
});
