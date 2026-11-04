import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import rawPlanData from '../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanAnswers } from '../../core/models/company-plan.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { PRERENDER_PLAN_DETAILS } from '../../generated/pricing-defaults';
import { CompanyPlanData, buildCompanyPlan } from '../company/company-plan/company-plan.engine';
import { CompanyPlanService } from '../company/company-plan/company-plan.service';
import { PricingComponent } from './pricing.component';

const PLAN_DATA = rawPlanData as unknown as CompanyPlanData;

describe('PricingComponent', () => {
  let fixture: ComponentFixture<PricingComponent>;
  let component: PricingComponent;
  let billingCheckoutStub: jasmine.SpyObj<BillingCheckoutService>;
  let analyticsStub: jasmine.SpyObj<AnalyticsService>;
  let plansStub: { answers: WritableSignal<CompanyPlanAnswers | null>; loadData: jasmine.Spy; buildPlan: unknown };

  beforeEach(async () => {
    sessionStorage.removeItem('fa:conversion:pricing-context:v1');
    sessionStorage.removeItem('fa:checkout:intent:v1');
    billingCheckoutStub = jasmine.createSpyObj<BillingCheckoutService>('BillingCheckoutService', ['getCheckoutConfig', 'prefetch']);
    billingCheckoutStub.getCheckoutConfig.and.resolveTo(null);
    billingCheckoutStub.prefetch.and.resolveTo();
    analyticsStub = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    plansStub = {
      answers: signal(null),
      loadData: jasmine.createSpy('loadData').and.returnValue(of(PLAN_DATA)),
      buildPlan: (data: CompanyPlanData, answers: CompanyPlanAnswers) => buildCompanyPlan(data, {
        companies: answers.companies.map((company) => company.slug),
        when: answers.when,
        level: answers.level,
        today: '2026-11-02',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyPlanService, useValue: plansStub },
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
    // The prerender defaults survive a failed config: prices stay visible, checkout stays disabled.
    expect(component.planDetails).toEqual(PRERENDER_PLAN_DETAILS);
    expect(component.regionalPricing).toBeNull();
    expect(component.offerVersion).toBe('interview_sprint_v3');
    expect(analyticsStub.track).toHaveBeenCalledWith('pricing_page_viewed', jasmine.objectContaining({
      src: 'pricing_page',
      surface: 'pricing_page',
      page: 'pricing',
      page_layout: 'interview_sprint_v3',
      offer_version: 'interview_sprint_v3',
      checkout_surface: 'hosted_new_tab',
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
    // Prerender contract: the sprint layout and the default prices render before any config arrives.
    expect(fixture.nativeElement.querySelectorAll('.pr-grid .pr-card').length).toBe(3);
    expect(monthlyButton.closest('.pr-card')?.textContent || '').toContain('$24');
    expect(fixture.nativeElement.querySelector('[data-testid="pricing-lifetime-secondary"]')?.textContent || '').toContain('$179');

    resolveConfig({
      enabled: true,
      plans: { monthly: true, quarterly: false, annual: true, lifetime: false },
      planDetails: {
        monthly: { amountCents: 1200, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
        quarterly: { amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
        annual: { amountCents: 7900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
        lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
      },
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
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
    // A baseline config from the backend still wins over the prerender default.
    expect(component.offerVersion).toBe('pricing_baseline_v1');
    expect(fixture.nativeElement.querySelectorAll('.pr-grid .pr-card').length).toBe(4);
  });

  it('activates offer v2 only when the backend config selects it', async () => {
    billingCheckoutStub.getCheckoutConfig.and.resolveTo({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'live',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
      planDetails: {
        monthly: { amountCents: 1200, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
        quarterly: { amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
        annual: { amountCents: 7900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
        lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
      },
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
      pricing: {
        student: { multiplier: 0.6, planIds: ['annual'] },
        regional: { countryCode: 'TR', countryName: 'Türkiye', multiplier: 0.5, prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 } },
      },
    });
    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.offerVersion).toBe('interview_sprint_v2');
    expect(component.checkoutSurface).toBe('overlay');
    expect(component.regionalPricing).toEqual(jasmine.objectContaining({ countryCode: 'TR', multiplier: 0.5 }));
    expect(fixture.nativeElement.querySelector('[data-testid="pricing-regional-line"]')?.textContent || '').toContain('Prices for Türkiye');
    expect(fixture.nativeElement.querySelector('.pr-card--quarterly s[data-list-price]')?.textContent?.trim()).toBe('$9.67');
    expect(fixture.nativeElement.querySelectorAll('.pr-grid .pr-card').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[data-testid="pricing-lifetime-secondary"]')).toBeTruthy();
    expect(analyticsStub.track).toHaveBeenCalledWith('pricing_page_viewed', jasmine.objectContaining({
      page_layout: 'interview_sprint_v2',
      offer_version: 'interview_sprint_v2',
      checkout_surface: 'overlay',
    }));
  });

  describe('with a company plan waiting', () => {
    const strip = () => fixture.nativeElement.querySelector('[data-testid="company-plan-pricing-strip"]') as HTMLElement | null;
    const firstCardLines = () => Array.from(fixture.nativeElement.querySelectorAll('.pr-grid .pr-card')[0].querySelectorAll('.features li'))
      .map((item) => (item as HTMLElement).textContent?.trim());

    async function render(url: string): Promise<void> {
      await TestBed.inject(Router).navigateByUrl(url);
      fixture = TestBed.createComponent(PricingComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    beforeEach(() => {
      plansStub.answers.set({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' });
    });

    afterEach(() => sessionStorage.removeItem('fa:checkout:intent:v1'));

    it('recommends the month, and says why, when the interview is this week', async () => {
      plansStub.answers.set({ companies: [{ slug: 'elevenlabs' }], when: 'this-week', level: 'senior' });
      await render('/?src=company_plan_elevenlabs');

      expect(strip()?.querySelector('[data-testid="company-plan-pricing-note"]')?.textContent?.trim())
        .toBe('Your interview is this week, so a month of Premium is enough.');
      const recommended = fixture.nativeElement.querySelector('.pr-rec') as HTMLElement;
      expect(recommended.textContent).toContain('Monthly');
      expect(recommended.textContent).toContain('Recommended');
      expect(fixture.nativeElement.querySelectorAll('.pr-rec').length).toBe(1);
    });

    it('keeps the quarter recommended, with no note, when the interview is further away', async () => {
      plansStub.answers.set({ companies: [{ slug: 'elevenlabs' }], when: 'later', level: 'senior' });
      await render('/?src=company_plan_elevenlabs');
      expect(strip()?.querySelector('[data-testid="company-plan-pricing-note"]')).toBeNull();
      expect((fixture.nativeElement.querySelector('.pr-rec') as HTMLElement).textContent).toContain('Quarterly');
    });

    it('shows the plan above the plans and opens every card with it', async () => {
      await render('/?src=company_plan_elevenlabs');

      expect(strip()?.querySelector('h2')?.textContent?.trim()).toBe('Your ElevenLabs plan is waiting');
      expect(strip()?.querySelector('p')?.textContent?.trim()).toMatch(/^6 tasks for next week, about [\d.]+ hours?\. \d are open now, \d open with Premium\./);
      expect(strip()?.querySelector('a')?.getAttribute('href')).toBe('/companies/preview');
      expect(firstCardLines()).toEqual([
        'Your full ElevenLabs plan',
        `${PLAN_DATA.general.premiumCounts.react} Premium React tasks with a live preview`,
        `${PLAN_DATA.general.premiumCounts.systemDesign} Premium system design walkthroughs`,
        'Cancel before the next renewal',
      ]);
    });

    it('finds the plan again after the visitor signs in on the way', async () => {
      sessionStorage.setItem('fa:checkout:intent:v1', JSON.stringify({
        version: 1,
        planId: 'quarterly',
        src: 'company_plan_elevenlabs',
        surface: 'pricing_page',
        returnUrl: '/pricing',
        createdAt: Date.now(),
      }));
      await render('/');
      expect(strip()).toBeTruthy();
    });

    it('leaves the page as it was without a company plan source, for a general plan and for Premium members', async () => {
      await render('/');
      expect(strip()).toBeNull();
      expect(firstCardLines()[0]).toBe('Full Premium content');
      expect(plansStub.loadData).not.toHaveBeenCalled();

      await render('/?src=company_plan_general');
      expect(strip()).toBeNull();

      (TestBed.inject(AuthService).user as unknown as jasmine.Spy).and.returnValue({ _id: 'u1', entitlements: { pro: { status: 'lifetime' } } });
      await render('/?src=company_plan_elevenlabs');
      expect(strip()).toBeNull();
    });
  });
});
