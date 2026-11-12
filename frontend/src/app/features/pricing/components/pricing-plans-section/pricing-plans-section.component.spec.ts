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

  it('uses the same changing catalog count on the baseline page and the compact sprint section, and falls back for old payloads', () => {
    for (const [offer, variant] of [['pricing_baseline_v1', 'full'], ['interview_sprint_v2', 'compact']] as const) {
      component.offerVersion = offer;
      component.variant = variant;
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
    // The full sprint page counts per area in the table the pricing page projects, so it names no single total.
    component.offerVersion = 'interview_sprint_v2';
    component.variant = 'full';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Premium practice prompts');
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

  it('opens every card with a waiting company plan and keeps what sets each plan apart', () => {
    const features = (planId: string) => Array.from(
      fixture.nativeElement.querySelector(`[data-testid="pricing-cta-${planId}"]`).closest('.pr-card').querySelectorAll('.features li'),
    ).map((item) => (item as HTMLElement).textContent?.trim());

    fixture.detectChanges();
    expect(features('monthly')).toEqual(['Full Premium content', 'Cancel before the next renewal']);

    fixture.componentRef.setInput('featureLead', ['Your full ElevenLabs plan', '31 Premium React tasks with a live preview']);
    fixture.detectChanges();
    expect(features('monthly')).toEqual(['Your full ElevenLabs plan', '31 Premium React tasks with a live preview', 'Cancel before the next renewal']);
    expect(features('lifetime')).toEqual(['Your full ElevenLabs plan', '31 Premium React tasks with a live preview', 'Premium access forever']);
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

  it('renders the counted layout on the full sprint page: labels, the charge, renewal sentences and one assurance line', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.planDetails = {
      monthly: { amountCents: 1500, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
      quarterly: { amountCents: 3600, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
      annual: { amountCents: 10800, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
      lifetime: { amountCents: 25000, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
    };

    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const text = (selector: string) => (page.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    const cards = Array.from(page.querySelectorAll('.pr-grid--counted .pr-card')) as HTMLElement[];
    expect(cards.map((card) => card.querySelector('button')?.dataset['testid'])).toEqual([
      'pricing-cta-monthly',
      'pricing-cta-quarterly',
      'pricing-cta-annual',
    ]);
    expect(['monthly', 'quarterly', 'annual'].map((plan) => text(`[data-testid="pricing-plan-label-${plan}"]`))).toEqual([
      'Interview in 1–2 weeks',
      'The sweet spot for a hiring round',
      'Changing jobs this year',
    ]);
    // The charge leads with the monthly equivalent beside it; one sentence states the bill, the renewal and what the
    // same months cost month to month, computed from the prices on the page.
    expect(text('.pr-card--monthly .price')).toBe('$15 a month');
    expect(text('.pr-card--monthly [data-testid="pricing-billing-line"]')).toBe('Billed as $15 today. Renews monthly. Cancel anytime.');
    expect(text('.pr-card--quarterly .price')).toBe('$36 every 3 months, $12 a month');
    expect(text('.pr-card--quarterly [data-testid="pricing-billing-line"]')).toBe(
      'Billed as $36 today. Renews every 3 months. Cancel anytime. $36 instead of $45 month to month.',
    );
    expect(text('.pr-card--annual .price')).toBe('$108 a year, $9 a month');
    expect(text('.pr-card--annual [data-testid="pricing-billing-line"]')).toBe(
      'Billed as $108 today. Renews yearly. Cancel anytime. $108 instead of $180 month to month.',
    );
    // One highlighted plan, no badge and no percentage claim.
    expect(page.querySelectorAll('.pr-plan--rec').length).toBe(1);
    expect(page.querySelector('.pr-plan--rec .pr-card--quarterly')).toBeTruthy();
    expect(page.querySelector('.rec-badge')).toBeNull();
    expect(page.textContent || '').not.toMatch(/Save \d+%/);
    expect((page.querySelector('[data-testid="pricing-cta-quarterly"]') as HTMLElement).classList.contains('btn--outline')).toBeFalse();
    expect((page.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLElement).classList.contains('btn--outline')).toBeTrue();

    expect(text('.pr-hero h1')).toBe('One library. Choose how long.');
    expect(text('.pr-kicker')).toBe('FrontendAtlas Premium');
    expect(text('.pr-hero__lede')).toContain('The only choice is the access period. Prices in US dollars.');
    expect(page.querySelector('.pr-hero__chips')).toBeNull();

    expect(text('[data-testid="pricing-assurance"] .pr-assurance__terms')).toBe(
      'First purchase: full refund within 14 days, no usage test. Taxes included. No sale prices, no countdowns.',
    );
    expect(page.querySelector('[data-testid="pricing-assurance"] a')?.getAttribute('href')).toBe('/legal/refund');
    expect(text('[data-testid="pricing-lifetime-secondary"]')).toContain(
      'Prefer one payment? $250 once, never renews, future questions included.',
    );
    expect(page.querySelector('[data-testid="pricing-cta-lifetime"]')).toBeTruthy();
    // The product proof (its "guided solution" link opened a locked task), the trust strip and the lifetime card are gone.
    // The old Free vs Premium table gives way to the counted table the pricing page projects.
    for (const removed of ['[data-testid="pricing-product-proof"]', '[data-testid="pricing-trust-strip"]', '.lifetime-offer', '.pr-grid:not(.pr-grid--counted)', '.plan-compare']) {
      expect(page.querySelector(removed)).withContext(removed).toBeNull();
    }

    const refundsFaq = component.faqGroups.flatMap((group) => group.items).find((item) => item.id === 'refunds');
    expect(refundsFaq?.a || '').toContain('ask within 14 days of the order and we refund it in full, with no usage test');
    expect(refundsFaq?.a || '').toContain('Renewal charges and unused subscription time are generally non-refundable');
    expect((page.textContent || '').toLowerCase()).not.toContain('limited premium usage');
    expect((page.textContent || '').toLowerCase()).not.toContain('money-back guarantee');
    expect((page.textContent || '').toLowerCase()).not.toContain('where available');
    expect((page.textContent || '').toLowerCase()).not.toContain('expanding');
    expect((page.textContent || '').toLowerCase()).not.toContain('large question library');
  });

  it('moves the student and employer terms into the FAQ on the counted layout and points to them from one help line', () => {
    const auth = TestBed.inject(AuthService) as unknown as { user: jasmine.Spy };
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const squash = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const items = () => component.faqGroups.flatMap((group) => group.items);
    const answer = (id: string) => items().find((item) => item.id === id)?.a || '';
    const faqLink = () => page.querySelector('[data-testid="pricing-faq-student-action"]') as HTMLAnchorElement | null;

    // No discounts block and no second changelog line: one help line under the table points to the FAQ.
    expect(page.querySelector('[data-testid="pricing-discounts"]')).toBeNull();
    const help = page.querySelector('[data-testid="pricing-help-line"]') as HTMLElement;
    expect(squash(help.textContent)).toContain('Pre-sales question? Email support@frontendatlas.com. A person answers.');
    expect(help.querySelector('a[href="mailto:support@frontendatlas.com"]')).toBeTruthy();
    expect(help.querySelector('[data-testid="pricing-billing-faq-link"]')?.getAttribute('href')).toMatch(/#pricing-faq$/);
    expect(page.querySelector('section#pricing-faq')).toBeTruthy();
    expect(page.querySelectorAll('[data-testid="pricing-updates-line"]').length).toBe(1);
    expect(help.querySelector('[data-testid="pricing-updates-line"] a')?.getAttribute('href')).toBe('/changelog');

    // The table already lists what Premium holds, so the FAQ asks which access period fits instead.
    expect(items().map((item) => item.id)).toEqual([
      'free-plan', 'which-plan', 'cancel-anytime', 'refunds', 'payment-methods', 'employer-reimbursement',
      'student-discount', 'payment-declined', 'solutions-and-explanations', 'run-tests',
    ]);
    expect(answer('employer-reimbursement')).toContain('emails a receipt for every order');
    expect(answer('student-discount')).toContain('40% off the annual plan on your first purchase');
    expect(answer('student-discount')).not.toContain('regional price');

    // A guest finds the signup link under the student answer. It stays out of the tab order until the answer
    // opens, and a click is tracked as the discounts block tracked it.
    expect(faqLink()?.getAttribute('href')).toBe('/auth/signup?src=pricing_student_discount');
    expect(faqLink()?.getAttribute('tabindex')).toBe('-1');
    const studentQuestion = Array.from(page.querySelectorAll('.faq-q'))
      .find((button) => squash(button.textContent) === 'Is there a student discount?') as HTMLButtonElement;
    studentQuestion.click();
    fixture.detectChanges();
    expect(faqLink()?.hasAttribute('tabindex')).toBeFalse();
    faqLink()!.click();
    expect(analytics.track).toHaveBeenCalledWith('pricing_student_discount_clicked', jasmine.objectContaining({
      destination: '/auth/signup',
      auth_state: 'guest',
    }));
    expect(navigate).toHaveBeenCalled();

    // A verified student reads the price status beside the price terms, and the answer needs no link.
    const baseUser = { _id: 'u1', username: 'student', email: 'ada@university.edu', role: 'user', prefs: {}, createdAt: '2026-01-01T00:00:00Z' };
    auth.user.and.returnValue({ ...baseUser, studentDiscountEligible: true } as any);
    fixture.detectChanges();
    expect(squash(page.querySelector('[data-testid="pricing-assurance"] [data-testid="student-pricing-line"]')?.textContent))
      .toContain('40% off the annual plan is applied at checkout on your first purchase');
    expect(faqLink()).toBeNull();

    // A signed-in free account without a school email is sent to the profile.
    auth.user.and.returnValue({ ...baseUser } as any);
    fixture.detectChanges();
    expect(page.querySelector('[data-testid="student-pricing-line"]')).toBeNull();
    expect(faqLink()?.getAttribute('href')).toBe('/profile');

    // Only a visitor with a regional price reads how the two prices combine.
    component.regionalPricing = { countryCode: 'TR', countryName: 'Türkiye', multiplier: 0.5, prices: { annual: 3950 } };
    fixture.detectChanges();
    expect(answer('student-discount')).toContain('Student pricing is never combined with the regional price; you get the better of the two.');
  });

  it('puts the lines of a waiting company plan on the card it recommends, and moves the highlight with it', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    fixture.componentRef.setInput('featureLead', ['Your full ElevenLabs plan', '31 Premium React tasks with a live preview']);
    fixture.componentRef.setInput('recommendedPlan', 'monthly');
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const leads = Array.from(page.querySelectorAll('[data-testid="pricing-plan-lead"]')) as HTMLElement[];
    expect(leads.length).toBe(1);
    expect(leads[0].closest('.pr-card')?.classList.contains('pr-card--monthly')).toBeTrue();
    expect(Array.from(leads[0].querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual([
      'Your full ElevenLabs plan',
      '31 Premium React tasks with a live preview',
    ]);
    expect(page.querySelector('.pr-plan--rec .pr-card--monthly')).toBeTruthy();
    expect((page.querySelector('[data-testid="pricing-cta-monthly"]') as HTMLElement).classList.contains('btn--outline')).toBeFalse();
    expect((page.querySelector('[data-testid="pricing-cta-quarterly"]') as HTMLElement).classList.contains('btn--outline')).toBeTrue();
  });

  it('renders the counted layout for interview_sprint_v3 exactly as for v2', () => {
    component.offerVersion = 'interview_sprint_v3';
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const primaryCtas = Array.from(page.querySelectorAll('.pr-grid--counted .pr-card button'))
      .map((button) => (button as HTMLElement).dataset['testid']);
    expect(component.isOfferV2()).toBeTrue();
    expect(component.countedLayout()).toBeTrue();
    expect(primaryCtas).toEqual(['pricing-cta-monthly', 'pricing-cta-quarterly', 'pricing-cta-annual']);
    expect(page.querySelector('[data-testid="pricing-lifetime-secondary"]')).toBeTruthy();
    expect(page.querySelector('[data-testid="pricing-assurance"]')).toBeTruthy();
    expect(page.querySelector('.rec-badge')).toBeNull();
  });

  it('keeps one plan order in the DOM on a phone, so prerendered cards do not swap on hydration', async () => {
    // The phone order is CSS only (.pr-card--quarterly order); e2e/pricing-offer-v2 checks where the cards land.
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
    expect(cardTitles()).toEqual(['Monthly', 'Quarterly', 'Annual']);
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
    // Without a regional price for this visitor, none is mentioned anywhere on the page.
    const studentFaq = () => component.faqGroups.flatMap((group) => group.items).find((item) => item.id === 'student-discount')?.a || '';
    expect(block.textContent || '').not.toContain('regional price');
    expect(studentFaq()).not.toContain('regional price');

    // A regional price at or below the student price replaces it; the notice says so, and the terms name the two.
    component.regionalPricing = { countryCode: 'TR', countryName: 'Türkiye', multiplier: 0.5, prices: { annual: 3950 } };
    fixture.detectChanges();
    expect(notice()?.textContent || '').toContain('regional price shown here is lower than the student price');
    expect(block.textContent || '').toContain('Never combined with the regional price: you get the better of the two.');
    expect(studentFaq()).toContain('Student pricing is never combined with the regional price; you get the better of the two.');
    component.regionalPricing = null;
    fixture.detectChanges();
    expect(block.textContent || '').not.toContain('regional price');
    expect(studentFaq()).not.toContain('regional price');

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

  it('adds a local-currency estimate per card and a dated note when the regional block carries a rate', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.regionalPricing = {
      countryCode: 'IN',
      countryName: 'India',
      multiplier: 0.4,
      prices: { monthly: 960, quarterly: 1960, annual: 3960, lifetime: 7160 },
      local: { currency: 'INR', rate: 88, asOf: '2026-11-05' },
    };
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const text = (selector: string) => (page.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(text('.pr-card--monthly [data-testid="pricing-local-estimate"]')).toBe('about ₹840 a month');
    // The cards lead with the charge, so the estimate names the charge with the card's own period words.
    expect(text('.pr-card--quarterly [data-testid="pricing-local-estimate"]')).toBe('about ₹1,700 every 3 months');
    expect(text('.pr-card--annual [data-testid="pricing-local-estimate"]')).toBe('about ₹3,500 a year');
    expect(text('[data-testid="pricing-lifetime-secondary"] [data-testid="pricing-local-estimate"]')).toBe('about ₹6,300 once');
    expect(text('[data-testid="pricing-local-note"]')).toBe(
      'Charged in US dollars. Local amounts are estimates at the exchange rate of 5 Nov 2026, rates by Exchange Rate API.',
    );
    expect(page.querySelector('[data-testid="pricing-local-note"] a')?.getAttribute('href')).toBe('https://www.exchangerate-api.com');

    // Without a rate the regional block shows dollars only.
    component.regionalPricing = { ...component.regionalPricing, local: null };
    fixture.detectChanges();
    expect(page.querySelector('[data-testid="pricing-local-estimate"]')).toBeNull();
    expect(page.querySelector('[data-testid="pricing-local-note"]')).toBeNull();
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
    expect(text('.pr-card--monthly')).toContain('$6 a month');
    // The struck figure is the list charge the regional charge replaces, and the comparison uses the regional month.
    expect(text('.pr-card--quarterly s[data-list-price]')).toBe('$29');
    expect(text('.pr-card--quarterly')).toContain('$14.50 every 3 months, $4.83 a month');
    expect(text('.pr-card--quarterly')).toContain(
      'Billed as $14.50 today. Renews every 3 months. Cancel anytime. $14.50 instead of $18 month to month.',
    );
    expect(text('.pr-card--annual s[data-list-price]')).toBe('$79');
    expect(text('.pr-card--annual')).toContain('$39.50 a year, $3.29 a month');
    expect(text('.pr-card--annual')).toContain(
      'Billed as $39.50 today. Renews yearly. Cancel anytime. $39.50 instead of $72 month to month.',
    );
    expect(page.textContent || '').not.toMatch(/Save \d+%/);
    // A struck list price next to "no sale prices" would contradict itself, so the regional terms say what stays fixed.
    expect(text('[data-testid="pricing-assurance"] .pr-assurance__terms')).toContain('The regional price is the same every day, with no countdowns.');
    expect(text('[data-testid="pricing-assurance"]')).not.toContain('No sale prices');
    expect(text('[data-testid="pricing-lifetime-secondary"] s[data-list-price]')).toBe('$199');
    expect(text('[data-testid="pricing-lifetime-secondary"]')).toContain('$99.50');
    // Every card names its own discount next to the struck list price.
    for (const card of ['.pr-card--monthly', '.pr-card--quarterly', '.pr-card--annual', '[data-testid="pricing-lifetime-secondary"]']) {
      expect(text(`${card} .price-off`)).withContext(card).toBe('50% off');
    }
    // The regional line takes the kicker's slot above the headline, so it does not push the page down.
    const regionalLine = page.querySelector('[data-testid="pricing-regional-line"]')!;
    expect(page.querySelector('.pr-hero')!.firstElementChild).toBe(regionalLine);
    expect(page.querySelector('.pr-kicker')).toBeNull();
    expect(regionalLine.compareDocumentPosition(page.querySelector('.pr-hero h1')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

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
    expect(text('.pr-card--quarterly')).toContain('$29 every 3 months, $9.67 a month');
    expect(text('[data-testid="pricing-assurance"] .pr-assurance__terms')).toContain('No sale prices, no countdowns.');
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
    expect(text('.pr-card--quarterly .price-off')).toBe('50% off');
    expect(page.querySelector('.pr-wrap')!.firstElementChild).toBe(page.querySelector('[data-testid="pricing-regional-line"]'));
  });

  it('derives the badge and every card discount from the visitor country, not a fixed 50%', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.regionalPricing = {
      countryCode: 'PL',
      countryName: 'Poland',
      multiplier: 0.65,
      prices: { monthly: 780, quarterly: 1885, annual: 5135, lifetime: 12935 },
    };
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const text = (selector: string) => (page.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(text('[data-testid="pricing-regional-line"]')).toBe(
      'Prices for Poland: 35% off the list price, applied automatically at checkout.',
    );
    for (const card of ['.pr-card--monthly', '.pr-card--quarterly', '.pr-card--annual', '[data-testid="pricing-lifetime-secondary"]']) {
      expect(text(`${card} .price-off`)).withContext(card).toBe('35% off');
    }
    expect(text('.pr-card--monthly')).toContain('$7.80 a month');
    expect(component.listPercentOff('monthly')).toBe(35);

    // A card whose regional price is not below the list price shows no struck price and no discount.
    component.regionalPricing = { ...component.regionalPricing!, prices: { monthly: 1200, quarterly: 1885, annual: 5135, lifetime: 12935 } };
    fixture.detectChanges();
    expect(component.listPercentOff('monthly')).toBeNull();
    expect(page.querySelector('.pr-card--monthly .price-off')).toBeNull();

    component.regionalPricing = null;
    fixture.detectChanges();
    expect(page.querySelector('.price-off')).toBeNull();
    expect(page.querySelector('[data-testid="pricing-list-price-row"]')).toBeNull();
  });

  it('leads with the charge on the full sprint page and with the monthly equivalent on the compact homepage section', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const cardText = (plan: string) => (page.querySelector(`.pr-card--${plan}`)?.textContent || '').replace(/\s+/g, ' ');
    const cta = (plan: string) => page.querySelector(`[data-testid="pricing-cta-${plan}"]`) as HTMLButtonElement;
    expect(cardText('monthly')).toContain('$12 a month');
    expect(cardText('monthly')).toContain('Billed as $12 today. Renews monthly. Cancel anytime.');
    expect(cardText('quarterly')).toContain('$29 every 3 months, $9.67 a month');
    expect(cardText('quarterly')).toContain('Billed as $29 today.');
    expect(cardText('annual')).toContain('$79 a year, $6.58 a month');
    expect(cardText('annual')).toContain('Billed as $79 today.');
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
    // Free framework tasks run checks too; the free column must not say otherwise next to the free React Counter offer.
    expect(component.comparisonRows.find((row) => row.label === 'Runnable checks')?.freeValue).toContain('React, Angular and Vue');

    const faqItems = component.faqGroups.flatMap((group) => group.items);
    const premiumIncludes = faqItems.find((item) => item.id === 'premium-includes');
    const runTests = faqItems.find((item) => item.id === 'run-tests');
    const solutions = faqItems.find((item) => item.id === 'solutions-and-explanations');
    expect(premiumIncludes?.a || '').toContain('each with a guided solution');
    expect(premiumIncludes?.a || '').toContain('timed rehearsals of company rounds on one clock');
    expect((page.querySelector('.plan-compare')?.textContent || '')).toContain('Timed rehearsals of company rounds');
    expect(premiumIncludes?.a || '').not.toContain('Typically');
    expect(runTests?.a || '').toContain('Every JavaScript and debugging task has runnable checks');
    // The short JavaScript debug tasks show the fixed code only, so the answer must not promise a guided solution for every task.
    expect(solutions?.a || '').toContain('Every coding task, free or Premium, comes with a solution.');
    expect(solutions?.a || '').toContain('The short JavaScript debug tasks show the fixed code.');
    expect(solutions?.a || '').not.toContain('includes a guided solution');
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
    // No regional price for this visitor, so none is mentioned.
    expect(student?.a || '').not.toContain('regional price');
    expect(student?.a || '').toContain('verify it from your profile');
    expect(student?.a || '').toContain('applied at checkout automatically');
    // The baseline page keeps its discounts block, which carries the student link, and its own question about Premium.
    expect(student && 'link' in student).toBeFalse();
    expect(premiumIncludes).toBeTruthy();
    expect(faqItems.find((item) => item.id === 'which-plan')).toBeUndefined();
  });

  it('keeps the real workspace proof out of the baseline offer', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pricing-product-proof"]')).toBeNull();
  });

  it('derives the approved quarterly and annual savings from backend metadata', () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;

    expect(component.savingsLabel('quarterly')).toBe('Save 19% vs monthly');
    expect(component.savingsLabel('annual')).toBe('Save 45% vs monthly');
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
    // The baseline offer keeps the plain prompt.
    expect(component.loginAccountStep).toBeNull();
  });

  it('opens the account step of a sprint offer with the plan and the price this visitor pays today', async () => {
    component.offerVersion = PRICING_V2_OFFER_VERSION;
    component.checkoutSurface = 'overlay';
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };
    fixture.detectChanges();

    await component.onCta('quarterly');
    fixture.detectChanges();
    expect(component.loginRequiredOpen).toBeTrue();
    expect(component.loginAccountStep).toEqual({
      title: 'One step before checkout',
      body: 'Checkout opens right after you sign in or create a free account.',
      kicker: 'Step 1 of 2 · Quarterly · $29 USD today',
      reason: 'Why an account first: your Premium access, saved plan and solved tasks attach to it.',
      assurance: '14-day refund on your first purchase, no usage test. Secure checkout by Lemon Squeezy. Taxes included.',
    });
    const squash = (selector: string) => (document.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(squash('[data-testid="login-required-kicker"]')).toBe('Step 1 of 2 · Quarterly · $29 USD today');
    expect(squash('[data-testid="login-required-title"]')).toBe('One step before checkout');

    // A visitor with a regional price reads the price checkout will charge; the one-time plan is paid once.
    component.loginRequiredOpen = false;
    component.regionalPricing = { countryCode: 'IN', countryName: 'India', multiplier: 0.4, prices: { quarterly: 1160, lifetime: 7960 } };
    await component.onCta('quarterly');
    expect(component.loginAccountStep?.kicker).toBe('Step 1 of 2 · Quarterly · $11.60 USD today');
    await component.onCta('lifetime');
    expect(component.loginAccountStep?.kicker).toBe('Step 1 of 2 · Lifetime · $79.60 USD once');

    // A new-tab checkout waits for a click after sign-in, so that surface does not promise it opens by itself.
    component.checkoutSurface = 'hosted_new_tab';
    await component.onCta('annual');
    expect(component.loginAccountStep?.body).toBe('Sign in or create a free account. Your plan is kept for checkout when you are back.');
    document.querySelectorAll('.p-dialog-mask').forEach((node) => node.remove());
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

  it('sends a signed regional checkout through the Lemon.js same-tab fallback', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const url = 'https://frontendatlas.lemonsqueezy.com/checkout/custom/regional?signature=sig';
    const redirect = jasmine.createSpy('redirect');
    auth.user.and.returnValue({
      _id: 'regional_user',
      username: 'regional_user',
      email: 'regional@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'same-tab',
      checkoutMode: 'live',
      url,
      attemptId: 'chk_regional_fallback',
      reused: false,
    });
    billingCheckout.recordAttemptClientState.and.returnValue(of({} as any));
    (window as any).__faCheckoutRedirect = redirect;
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    try {
      await component.onCta('quarterly');
    } finally {
      delete (window as any).__faCheckoutRedirect;
    }

    expect(redirect).toHaveBeenCalledOnceWith(url);
    expect(component.checkoutNotice).toBeNull();
  });

  it('reports a failed launch instead of an open checkout when a same-tab URL is unsafe', async () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    const billingCheckout = TestBed.inject(BillingCheckoutService) as jasmine.SpyObj<BillingCheckoutService>;
    const analytics = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    const redirect = jasmine.createSpy('redirect');
    auth.user.and.returnValue({
      _id: 'unsafe_user',
      username: 'unsafe_user',
      email: 'unsafe@example.com',
    } as any);
    billingCheckout.checkout.and.resolveTo({
      ok: true,
      provider: 'lemonsqueezy',
      mode: 'same-tab',
      checkoutMode: 'live',
      url: 'https://attacker.example/checkout/custom/abc?signature=sig',
      attemptId: 'chk_unsafe_url',
      reused: false,
    });
    (window as any).__faCheckoutRedirect = redirect;
    component.paymentsEnabled = true;
    component.paymentsConfigReady = true;
    component.checkoutAvailability = { monthly: true, quarterly: true, annual: true, lifetime: true };

    try {
      await component.onCta('quarterly');
    } finally {
      delete (window as any).__faCheckoutRedirect;
    }

    expect(redirect).not.toHaveBeenCalled();
    expect(billingCheckout.recordAttemptClientState).not.toHaveBeenCalled();
    expect(analytics.track).not.toHaveBeenCalledWith('checkout_opened', jasmine.anything());
    expect(analytics.track).not.toHaveBeenCalledWith('begin_checkout', jasmine.anything());
    expect(analytics.track).toHaveBeenCalledWith('checkout_launch_failed', jasmine.objectContaining({
      failure_reason: 'invalid_same_tab_url',
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
