import { SHOWCASE_STATS } from '../../../../generated/content-metadata';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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

  it('uses the same changing catalog count in both offers and falls back for old payloads', () => {
    for (const offer of ['pricing_baseline_v1', 'interview_sprint_v2']) {
      component.offerVersion = offer;
      component.premiumPracticeCount = 171;
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('171 Premium practice prompts');
      component.premiumPracticeCount = 172;
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('172 Premium practice prompts');
      expect(fixture.nativeElement.textContent).not.toContain('171 Premium practice prompts');
      component.premiumPracticeCount = undefined;
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(`${SHOWCASE_STATS.premiumPracticeCount} Premium practice prompts`);
    }
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
    expect((badges[0].textContent || '').trim()).toBe('Recommended');
    expect(primaryCards[1].textContent || '').toContain('Built for a complete 4–12 week interview sprint');
    expect(lifetime.textContent || '').toContain('$250');
    expect(page.querySelector('[data-testid="pricing-trust-strip"]')?.textContent || '').toContain('Taxes included');
    expect(page.querySelector('[data-testid="pricing-trust-strip"]')?.textContent || '').toContain('14-day refund on your first purchase');
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
    expect(page.textContent || '').toContain(`${SHOWCASE_STATS.totalQuestions} questions`);
    expect(page.textContent || '').toContain(`${SHOWCASE_STATS.premiumPracticeCount} Premium practice prompts`);
    const refundsFaq = component.faqGroups.flatMap((group) => group.items).find((item) => item.id === 'refunds');
    expect(refundsFaq?.a || '').toContain('ask within 14 days of the order and we refund it in full, with no usage test');
    expect(refundsFaq?.a || '').toContain('Renewal charges and unused subscription time are generally non-refundable');
    expect((page.textContent || '').toLowerCase()).not.toContain('limited premium usage');
    expect((page.textContent || '').toLowerCase()).not.toContain('money-back guarantee');
    expect((page.textContent || '').toLowerCase()).not.toContain('where available');
    expect((page.textContent || '').toLowerCase()).not.toContain('expanding');
    expect(page.textContent || '').toContain('Every Premium coding question ships with a guided solution');
    expect(page.textContent || '').toContain('Company practice pages');
    expect((page.textContent || '').toLowerCase()).not.toContain('large question library');
  });

  it('renders the sprint layout for interview_sprint_v3 exactly as for v2', () => {
    component.offerVersion = 'interview_sprint_v3';
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const primaryCtas = Array.from(page.querySelectorAll('.pr-grid .pr-card button'))
      .map((button) => (button as HTMLElement).dataset['testid']);
    expect(component.isOfferV2()).toBeTrue();
    expect(primaryCtas).toEqual(['pricing-cta-monthly', 'pricing-cta-quarterly', 'pricing-cta-annual']);
    expect(page.querySelector('[data-testid="pricing-lifetime-secondary"]')).toBeTruthy();
    expect(page.querySelector('[data-testid="pricing-product-proof"]')).toBeTruthy();
    expect((page.querySelector('.rec-badge')?.textContent || '').trim()).toBe('Recommended');
  });

  it('keeps the server plan order on the first render and applies the mobile order after hydration', async () => {
    // Prerendered HTML carries the desktop order; the first client render must match it.
    spyOn(window, 'matchMedia').and.callFake((query: string) => ({
      matches: query.includes('max-width: 640px'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList);
    component.offerVersion = PRICING_V2_OFFER_VERSION;

    fixture.detectChanges();
    const cardTitles = () => Array.from(fixture.nativeElement.querySelectorAll('.pr-grid .pr-card .title'))
      .map((node) => (node as HTMLElement).textContent?.trim());
    expect(cardTitles()).toEqual(['Monthly', 'Quarterly', 'Annual']);

    await fixture.whenStable();
    fixture.detectChanges();
    expect(cardTitles()).toEqual(['Quarterly', 'Monthly', 'Annual']);
  });

  it('states student pricing per account state inside the discounts block', () => {
    const auth = TestBed.inject(AuthService) as unknown as { user: jasmine.Spy };
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const baseUser = { _id: 'u1', username: 'student', email: 'ada@university.edu', role: 'user', prefs: {}, createdAt: '2026-01-01T00:00:00Z' };
    const page = fixture.nativeElement as HTMLElement;
    const notice = () => page.querySelector('[data-testid="student-pricing-line"]') as HTMLElement | null;
    const action = () => page.querySelector('[data-testid="pricing-student-action"]') as HTMLAnchorElement | null;

    // Guest (also the prerendered state): the discount is named and signup is the next step.
    fixture.detectChanges();
    const block = page.querySelector('[data-testid="pricing-discounts"]') as HTMLElement;
    expect(block.textContent || '').toContain('40% off');
    expect(block.textContent || '').toContain('verified .edu or .ac school email');
    expect(block.textContent || '').toContain('Often covered by a learning budget');
    expect(notice()).toBeNull();
    expect(action()?.getAttribute('href')).toBe('/auth/signup?src=pricing_student_discount');
    expect(page.querySelector('[data-testid="pricing-discounts-line"]')).toBeNull();

    auth.user.and.returnValue({ ...baseUser, studentDiscountEligible: true } as any);
    fixture.detectChanges();
    expect(notice()?.textContent || '').toContain('40% off the annual plan is applied at checkout on your first purchase');
    expect(notice()?.querySelector('a')).toBeNull();
    expect(action()).toBeNull();
    expect(block.textContent || '').toContain('The annual plan on your first purchase');
    expect(block.textContent || '').not.toContain('quarterly and annual');

    // A regional price at or below the student price replaces it; the notice says so.
    component.regionalPricing = { countryCode: 'TR', countryName: 'Türkiye', multiplier: 0.5, prices: { annual: 3950 } };
    fixture.detectChanges();
    expect(notice()?.textContent || '').toContain('regional price shown here is lower than the student price');
    component.regionalPricing = null;

    auth.user.and.returnValue({ ...baseUser, studentDiscountEligible: false, studentEmailPendingVerification: true } as any);
    fixture.detectChanges();
    expect(notice()?.textContent || '').toContain('Verify your school email to unlock student pricing');
    expect(notice()?.querySelector('a')?.getAttribute('href')).toBe('/profile');
    expect(action()).toBeNull();

    auth.user.and.returnValue({ ...baseUser } as any);
    fixture.detectChanges();
    expect(notice()).toBeNull();
    expect(action()?.getAttribute('href')).toBe('/profile');

    component.trackStudentDiscountClick('/profile');
    expect(analytics.track).toHaveBeenCalledWith('pricing_student_discount_clicked', jasmine.objectContaining({
      destination: '/profile',
      auth_state: 'logged_in_free',
      recommended_plan: 'quarterly',
    }));
  });

  it('shows the regional price with the list price struck through and a banner when the config publishes it', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.regionalPricing = {
      countryCode: 'TR',
      countryName: 'Türkiye',
      multiplier: 0.5,
      prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 },
    };
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const text = (selector: string) => (page.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(text('[data-testid="pricing-regional-line"]')).toBe(
      'Prices for Türkiye: 50% off the list price, applied automatically at checkout.',
    );
    expect(text('.pr-card--monthly s[data-list-price]')).toBe('$12');
    expect(text('.pr-card--monthly')).toContain('$6 / month');
    expect(text('.pr-card--quarterly s[data-list-price]')).toBe('$9.67');
    expect(text('.pr-card--quarterly')).toContain('$4.83 / month');
    expect(text('.pr-card--quarterly')).toContain('$14.50 billed every 3 months');
    expect(text('.pr-card--quarterly')).toContain('Save 19%');
    expect(text('.pr-card--annual s[data-list-price]')).toBe('$6.58');
    expect(text('.pr-card--annual')).toContain('$3.29 / month');
    expect(text('.pr-card--annual')).toContain('$39.50 billed yearly');
    expect(text('.pr-card--annual')).toContain('Save 45%');
    expect(text('[data-testid="pricing-lifetime-secondary"] s[data-list-price]')).toBe('$199');
    expect(text('[data-testid="pricing-lifetime-secondary"]')).toContain('$99.50');

    // begin_checkout reports the amount the checkout charges.
    auth.user.and.returnValue({ _id: 'regional_user', username: 'regional_user', email: 'regional@example.com' } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'new-tab',
      checkoutMode: 'live',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/custom/abc?signature=sig',
      attemptId: 'chk_regional',
      reused: false,
    });
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };
    await component.onCta('quarterly');
    expect(analytics.track).toHaveBeenCalledWith('begin_checkout', jasmine.objectContaining({ plan_id: 'quarterly', value: 14.5 }));

    component.regionalPricing = null;
    fixture.detectChanges();
    expect(page.querySelector('[data-testid="pricing-regional-line"]')).toBeNull();
    expect(page.querySelector('s[data-list-price]')).toBeNull();
    expect(text('.pr-card--quarterly')).toContain('$9.67 / month');
  });

  it('shows the regional price on the compact homepage section too, so the card matches the checkout', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.variant = 'compact';
    component.regionalPricing = {
      countryCode: 'TR',
      countryName: 'Türkiye',
      multiplier: 0.5,
      prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 },
    };
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const text = (selector: string) => (page.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(page.querySelector('.pr-wrap--compact')).toBeTruthy();
    expect(text('[data-testid="pricing-regional-line"]')).toBe(
      'Prices for Türkiye: 50% off the list price, applied automatically at checkout.',
    );
    expect(text('.pr-card--monthly s[data-list-price]')).toBe('$12');
    expect(text('.pr-card--monthly')).toContain('$6 / month');
    expect(text('.pr-card--quarterly s[data-list-price]')).toBe('$9.67');
    expect(text('.pr-card--quarterly')).toContain('$4.83 / month');
    expect(text('.pr-card--quarterly')).toContain('$14.50 billed every 3 months');
    expect(text('.pr-card--annual s[data-list-price]')).toBe('$6.58');
    expect(text('.pr-card--annual')).toContain('$39.50 billed yearly');
  });

  it('leads with the monthly equivalent on the full sprint page and on the compact homepage section', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const cardText = (plan: string) => (page.querySelector(`.pr-card--${plan}`)?.textContent || '').replace(/\s+/g, ' ');
    const cta = (plan: string) => page.querySelector(`[data-testid="pricing-cta-${plan}"]`) as HTMLButtonElement;
    expect(cardText('monthly')).toContain('$12 / month');
    expect(cardText('monthly')).toContain('Billed monthly');
    expect(cardText('quarterly')).toContain('$9.67 / month');
    expect(cardText('quarterly')).toContain('$29 billed every 3 months');
    expect(cardText('annual')).toContain('$6.58 / month');
    expect(cardText('annual')).toContain('$79 billed yearly');
    expect(cta('quarterly').classList.contains('btn--outline')).toBeFalse();
    expect(cta('monthly').classList.contains('btn--outline')).toBeTrue();
    expect(cta('annual').classList.contains('btn--outline')).toBeTrue();
    expect(page.querySelector('.pr-wrap--full')).toBeTruthy();

    // The homepage section uses the same price framing as /pricing and keeps its own layout.
    component.variant = 'compact';
    fixture.detectChanges();
    expect(cardText('monthly')).toContain('$12 / month');
    expect(cardText('quarterly')).toContain('$9.67 / month');
    expect(cardText('quarterly')).toContain('$29 billed every 3 months');
    expect(cardText('annual')).toContain('$6.58 / month');
    expect(cardText('annual')).toContain('$79 billed yearly');
    expect(page.querySelector('.btn--outline')).toBeNull();
    expect(page.querySelector('.rec-badge')?.textContent || '').toContain('Recommended — 4–12 week interview sprint');
    expect(cardText('quarterly')).toContain('Built for a complete interview sprint');
    expect(page.querySelector('.pr-wrap--compact')).toBeTruthy();
    expect(page.querySelector('.pr-wrap--full')).toBeNull();
    expect(page.querySelector('.pr-hero')).toBeNull();
    expect(page.querySelector('[data-testid="pricing-discounts"]')).toBeNull();
    expect(page.querySelector('.plan-compare')).toBeNull();
  });

  it('names the premium gate concretely in the baseline offer and the FAQ', () => {
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const hero = page.querySelector('.pr-hero') as HTMLElement;
    expect(hero.textContent || '').toContain('Every Premium coding question ships with a guided solution');
    expect((page.querySelector('.plan-compare')?.textContent || '')).toContain('wherever a prompt is modelled on one');
    expect((page.textContent || '').toLowerCase()).not.toContain('where available');
    expect((page.textContent || '').toLowerCase()).not.toContain('large question library');
    expect((page.querySelector('.plan-compare')?.textContent || '')).toContain('JavaScript and debugging tasks, and most React, Angular and Vue tasks');

    const faqItems = component.faqGroups.flatMap((group) => group.items);
    const premiumIncludes = faqItems.find((item) => item.id === 'premium-includes');
    const runTests = faqItems.find((item) => item.id === 'run-tests');
    const solutions = faqItems.find((item) => item.id === 'solutions-and-explanations');
    expect(premiumIncludes?.a || '').toContain('each with a guided solution');
    expect(premiumIncludes?.a || '').not.toContain('Typically');
    expect(runTests?.a || '').toContain('Every JavaScript and debugging task has runnable checks');
    expect(solutions?.a || '').toContain('Every coding question, free or Premium, includes a guided solution');
    for (const item of faqItems) {
      expect((item.a || '').toLowerCase()).not.toContain('where available');
      expect((item.a || '').toLowerCase()).not.toContain('supported question sets');
    }

    const employer = faqItems.find((item) => item.id === 'employer-reimbursement');
    const student = faqItems.find((item) => item.id === 'student-discount');
    expect(employer?.a || '').toContain('emails a receipt for every order');
    expect(employer?.a || '').not.toMatch(/Google|Meta|Amazon|Microsoft/);
    expect(student?.a || '').toContain('40% off the annual plan');
    expect(student?.a || '').not.toContain('quarterly and annual');
    expect(student?.a || '').toContain('never combined with a regional price');
    expect(student?.a || '').toContain('verify it from your profile');
    expect(student?.a || '').toContain('applied at checkout automatically');
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

  it('moves the library facts into the hero chips on the full page and keeps the strip on the compact section', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.plan-unlock-strip')).toBeNull();
    expect(page.querySelectorAll('.pr-hero .pr-proof-chips span').length).toBe(3);
    expect(page.querySelector('.included-box.plan-unlock')).toBeNull();

    component.variant = 'compact';
    fixture.detectChanges();
    const strip = page.querySelector('.plan-unlock-strip') as HTMLElement;
    expect(strip.textContent || '').toContain('Same Premium library. Choose the timeline that fits your prep.');
    expect(strip.textContent || '').not.toContain('Recommended sprint: Quarterly, $29 / 3 months.');
    expect(strip.querySelectorAll('.pr-proof-chips span').length).toBe(3);
    expect(strip.querySelector('ul')).toBeNull();
    expect(page.querySelector('.pr-hero')).toBeNull();
  });

  it('links the locked coding prompt and walkthrough from the comparison table and drops the explanatory blocks', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const previewLinks = Array.from(page.querySelectorAll('.plan-compare a.plan-compare__preview')) as HTMLAnchorElement[];
    expect(previewLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/react/coding/react-contact-form-starter',
      '/system-design/multi-step-form-autosave',
    ]);
    for (const removed of ['.unlock-preview', '.value-anchor', '.free-explorer', '.pr-features', '.pr-proof-grid', '.risk-reversal', '.weekly-changelog']) {
      expect(page.querySelector(removed)).withContext(removed).toBeNull();
    }
    expect(page.querySelector('[data-testid="pricing-discounts"]')?.textContent || '').toContain('40% off');
    expect(page.querySelectorAll('main a, a').length).toBeLessThanOrEqual(12);
  });

  it('places the Free vs Premium table after the plan cards', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const planGrid = page.querySelector('.pr-grid') as HTMLElement;
    const table = page.querySelector('.plan-compare') as HTMLElement;

    expect(planGrid.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('tracks pricing plan visibility in the no-observer fallback', () => {
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
    expect(analytics.track).not.toHaveBeenCalledWith('pricing_unlock_preview_seen', jasmine.anything());
    expect(analytics.track).not.toHaveBeenCalledWith('pricing_value_anchor_seen', jasmine.anything());
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

    component.trackUnlockPreviewClick({ previewType: 'coding_depth', destination: '/react/coding/react-contact-form-starter' });

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

  it('links the changelog once instead of previewing entries', () => {
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelectorAll('.weekly-changelog__item').length).toBe(0);
    const line = page.querySelector('[data-testid="pricing-updates-line"]') as HTMLElement;
    expect(line.textContent || '').toContain('published in the');
    expect(line.querySelector('a')?.getAttribute('href')).toBe('/changelog');
    // An inline gold link on grey text needs an underline to pass axe's link-in-text-block rule.
    expect(getComputedStyle(line.querySelector('a') as HTMLElement).textDecorationLine).toContain('underline');
  });
});
