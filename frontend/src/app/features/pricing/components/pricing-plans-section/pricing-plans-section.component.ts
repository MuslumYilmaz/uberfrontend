import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  BillingCheckoutService,
  CheckoutPlanDetail,
  CheckoutSurface,
  RegionalPricing,
} from '../../../../core/services/billing-checkout.service';
import { CheckoutIntent, CheckoutIntentService } from '../../../../core/services/checkout-intent.service';
import { ConversionContextService } from '../../../../core/services/conversion-context.service';
import { getCheckoutLaunchNotice, getManageSubscriptionErrorMessage } from '../../../../core/utils/billing-ux.util';
import {
  navigateReservedExternalWindow,
  releaseExternalWindowReservation,
  reserveExternalWindow,
} from '../../../../core/utils/external-window.util';
import { PlanId } from '../../../../core/utils/payments-provider.util';
import { isProActive } from '../../../../core/utils/entitlements.util';
import { LoginRequiredDialogComponent } from '../../../../shared/components/login-required-dialog/login-required-dialog.component';
import { FaqSectionComponent } from '../../../../shared/faq-section/faq-section.component';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { premiumPracticeLabel, resolvePremiumPracticeCount } from '../../../../core/utils/premium-practice-count.util';
import {
  PRICING_BASELINE_OFFER_VERSION,
  PRICING_V2_OFFER_VERSION,
  isSprintOfferVersion,
} from '../../../../core/utils/offer-version.util';
import { SHOWCASE_STATS } from '../../../../generated/content-metadata';

type PricingVariant = 'full' | 'compact';
export type PricingCtaMode = 'checkout' | 'navigatePricing';

export type PricingPlanDetail = CheckoutPlanDetail;

export type PricingPlanDetails = Partial<Record<PlanId, PricingPlanDetail>>;

type PricingPlan = {
  id: PlanId;
  title: string;
  summary: string;
  features: string[];
  badge: string;
  ctaLabel: string;
};

export const PRICING_PAGE_LAYOUT = 'interview_sprint_v1';
export { PRICING_BASELINE_OFFER_VERSION, PRICING_V2_OFFER_VERSION };
export const RECOMMENDED_PRICING_PLAN: PlanId = 'quarterly';
// Mirrors backend/services/billing/checkout-pricing.js: 40% off the annual plan
// on a first purchase, never combined with a regional price.
const STUDENT_PRICE_MULTIPLIER = 0.6;

@Component({
    selector: 'app-pricing-plans-section',
    imports: [CommonModule, RouterModule, FaqSectionComponent, LoginRequiredDialogComponent, FaButtonComponent],
    styleUrls: ['./pricing-plans-section.component.css'],
    template: `
    <section class="pr-wrap" [class.pr-wrap--compact]="variant === 'compact'" [class.pr-wrap--full]="variant === 'full'">
      <header class="pr-hero" *ngIf="variant === 'full'">
        <p class="pr-kicker">Premium for interview sprints</p>
        <h1>Prepare faster with deeper frontend interview reps</h1>
        <p class="pr-hero__lede" *ngIf="!isOfferV2(); else offerV2HeroCopy">
          Every Premium coding question ships with a guided solution; JavaScript and debugging tasks run checks in the
          browser, and most React, Angular and Vue tasks do too.
        </p>
        <ng-template #offerV2HeroCopy>
          <p class="pr-hero__lede">
            Every plan unlocks the same Premium library; only the access period changes. Every Premium coding question
            ships with a guided solution, and JavaScript and debugging tasks run checks in the browser.
          </p>
        </ng-template>
        <div class="pr-proof-chips pr-hero__chips" aria-label="Premium highlights">
          <span *ngFor="let chip of activeProofChips()">{{ chip }}</span>
        </div>
      </header>

      <div class="plan-unlock-strip" *ngIf="variant === 'compact'">
        <div class="plan-unlock-strip__copy">
          <p>Same Premium library. Choose the timeline that fits your prep.</p>
          <span *ngIf="isOfferV2()">Every paid plan unlocks the same practice depth; only the access period changes.</span>
        </div>
        <div class="pr-proof-chips" aria-label="Premium highlights">
          <span *ngFor="let chip of activeProofChips()">{{ chip }}</span>
        </div>
      </div>

      <section
        class="checkout-continuation"
        *ngIf="ctaMode === 'checkout' && pendingCheckoutIntent && canShowPendingCheckoutIntent() && !autoContinuingPendingCheckout"
        data-testid="checkout-continuation"
        aria-labelledby="checkout-continuation-title">
        <div>
          <p class="eyebrow">Continue where you left off</p>
          <h2 id="checkout-continuation-title">Continue with {{ pendingPlanTitle() }}</h2>
          <p class="muted">Your plan choice was saved for this session. Checkout will open only after you confirm.</p>
        </div>
        <div class="checkout-continuation__actions">
          <button type="button" faButton variant="primary" (click)="continuePendingCheckout()">
            Continue to checkout
          </button>
          <button type="button" faButton variant="neutral" (click)="dismissPendingCheckoutIntent()">
            Choose another plan
          </button>
        </div>
      </section>

      <p
        class="pr-regional-line"
        *ngIf="regionalPricing as regional"
        role="status"
        data-testid="pricing-regional-line">
        <i class="pi pi-globe" aria-hidden="true"></i>
        <span>Prices for {{ regional.countryName }}: {{ regionalPercentOff() }}% off the list price, applied automatically at checkout.</span>
      </p>

      <div
        class="pr-grid"
        [class.pr-grid--v2]="isOfferV2()"
        id="pricing-plans"
        #planCardsRef
        [attr.aria-busy]="ctaMode === 'checkout' && !paymentsConfigReady ? 'true' : null">
        <article
          class="pr-card"
          *ngFor="let plan of activePrimaryPlans(); trackBy: trackPlanById"
          [class.pr-card--monthly]="plan.id === 'monthly'"
          [class.pr-card--quarterly]="plan.id === 'quarterly'"
          [class.pr-card--annual]="plan.id === 'annual'"
          [class.pr-card--lifetime]="plan.id === 'lifetime'"
          [class.pr-rec]="plan.id === recommendedPlan">
          <div
            class="rec-badge"
            *ngIf="badgeFor(plan)"
            [class.rec-badge--muted]="plan.id !== recommendedPlan">
            {{ badgeFor(plan) }}
          </div>
          <h3 class="title">{{ plan.title }}</h3>
          <p class="plan-summary">{{ summaryFor(plan) }}</p>
          <div class="price">
            <s class="price-list" data-list-price *ngIf="listPriceHeadline(plan.id) as listPrice">{{ listPrice }}</s>
            {{ priceHeadline(plan.id) }}<span>{{ priceHeadlineSuffix(plan.id) }}</span>
          </div>
          <p class="billing-note">{{ priceDetail(plan.id) }}</p>
          <p class="plan-savings" *ngIf="savingsLabel(plan.id)">{{ savingsLabel(plan.id) }}</p>
          <ul class="features">
            <li *ngFor="let feat of plan.features">{{ feat }}</li>
          </ul>
          <button
            class="btn"
            [class.btn--outline]="isOutlineCta(plan.id)"
            type="button"
            (click)="onCta(plan.id)"
            [disabled]="isCheckoutDisabled(plan.id)"
            [attr.aria-disabled]="isCheckoutDisabled(plan.id) ? 'true' : null"
            [attr.title]="checkoutTooltip(plan.id)"
            [attr.data-testid]="'pricing-cta-' + plan.id">
            {{ ctaTextFor(plan) }}
          </button>
          <div class="plan-note" *ngIf="planNote(plan.id)">
            <span class="plan-note__label">Note</span>
            <span class="plan-note__text">{{ planNote(plan.id) }}</span>
          </div>
        </article>
      </div>

      <div class="pr-trust-strip" *ngIf="isOfferV2()" data-testid="pricing-trust-strip" aria-label="Checkout assurances">
        <span><i class="pi pi-check" aria-hidden="true"></i>{{ taxTrustCopy() }}</span>
        <span><i class="pi pi-refresh" aria-hidden="true"></i>Cancel anytime</span>
        <span><i class="pi pi-lock" aria-hidden="true"></i>Secure checkout by Lemon Squeezy</span>
        <span><i class="pi pi-eye" aria-hidden="true"></i>Free examples available</span>
        <span class="pr-trust-strip__refund">
          <i class="pi pi-replay" aria-hidden="true"></i>
          <a [routerLink]="['/legal/refund']">14-day refund on your first purchase, see the Refund Policy</a>
        </span>
      </div>

      <section
        class="pr-discounts"
        *ngIf="variant === 'full'"
        data-testid="pricing-discounts"
        aria-labelledby="pricing-discounts-title">
        <h2 id="pricing-discounts-title" class="pr-discounts__title">Discounts and reimbursement</h2>
        <div class="pr-discounts__grid">
          <article class="pr-discount pr-discount--student">
            <p class="pr-discount__eyebrow">Students</p>
            <p class="pr-discount__figure">40% off</p>
            <p class="pr-discount__copy">
              The annual plan on your first purchase, with a verified .edu or .ac school email. Never combined with a
              regional price: you get the better of the two.
            </p>
            <p
              class="student-pricing-line"
              *ngIf="studentPricingNotice() as notice"
              role="status"
              data-testid="student-pricing-line">
              {{ notice.text }}
              <a
                *ngIf="notice.link"
                [routerLink]="notice.link.to"
                (click)="trackStudentDiscountClick('/profile')">{{ notice.link.label }}</a>
            </p>
            <a
              *ngIf="studentDiscountAction() as action"
              class="pr-discount__action"
              data-testid="pricing-student-action"
              [routerLink]="action.to"
              [queryParams]="action.queryParams"
              (click)="trackStudentDiscountClick(action.destination)">
              {{ action.label }}
            </a>
          </article>
          <article class="pr-discount pr-discount--employer">
            <p class="pr-discount__eyebrow">Employers</p>
            <p class="pr-discount__figure pr-discount__figure--text">Often covered by a learning budget</p>
            <p class="pr-discount__copy">
              Every order comes with an emailed receipt, and a PDF invoice is available from your orders page or the
              billing portal in your profile.
            </p>
          </article>
        </div>
      </section>

      <section
        class="lifetime-offer"
        *ngIf="isOfferV2()"
        data-testid="pricing-lifetime-secondary"
        aria-labelledby="lifetime-offer-title">
        <div class="lifetime-offer__copy">
          <p class="eyebrow">One-time option</p>
          <h3 id="lifetime-offer-title">Prefer one-time access?</h3>
          <p>Keep Premium access for long-term interview refreshers without another renewal.</p>
        </div>
        <div class="lifetime-offer__action">
          <p class="lifetime-offer__price">
            <s class="price-list" data-list-price *ngIf="listPriceHeadline('lifetime') as listPrice">{{ listPrice }}</s>
            {{ displayPrice('lifetime') }} <span>{{ priceSuffix('lifetime') }}</span>
          </p>
          <button
            class="btn btn--secondary"
            type="button"
            (click)="onCta('lifetime')"
            [disabled]="isCheckoutDisabled('lifetime')"
            [attr.aria-disabled]="isCheckoutDisabled('lifetime') ? 'true' : null"
            [attr.title]="checkoutTooltip('lifetime')"
            data-testid="pricing-cta-lifetime">
            {{ ctaTextFor(lifetimePlan()) }}
          </button>
        </div>
      </section>

      <a
        *ngIf="variant === 'compact' && isOfferV2()"
        class="compare-all-plans"
        [routerLink]="['/pricing']"
        fragment="pricing-plans"
        (click)="trackCompareAllPlans()">
        Compare all plans
      </a>

      <p
        class="checkout-config-status"
        *ngIf="ctaMode === 'checkout' && !paymentsConfigReady && !isProUser()"
        role="status"
        aria-live="polite">
        Checking checkout availability…
      </p>

      <div
        class="checkout-notice"
        *ngIf="checkoutNotice"
        role="status"
        aria-live="polite"
        data-testid="checkout-notice">
        <p>{{ checkoutNotice }}</p>
        <button
          *ngIf="retryCheckout"
          type="button"
          faButton
          variant="primary"
          data-testid="checkout-same-tab-recovery"
          (click)="continueCheckoutInSameTab()">
          Continue in this tab
        </button>
      </div>

      <p class="tiny muted pr-footnote" *ngIf="ctaMode === 'checkout' && paymentsConfigReady && !paymentsEnabled && !isProUser()">
        Checkout is temporarily unavailable. Please try again shortly.
      </p>

      <figure
        class="product-proof"
        *ngIf="variant === 'full' && isOfferV2()"
        data-testid="pricing-product-proof"
        aria-labelledby="pricing-product-proof-title">
        <div class="product-proof__copy">
          <p class="eyebrow">Real product, before you pay</p>
          <h2 id="pricing-product-proof-title">See the practice workflow in action</h2>
          <p>
            Read the prompt, edit working code, inspect the live preview, and run behavioral checks
            from one workspace. Open the free React Counter challenge to try it; no card is needed until you
            choose a plan.
          </p>
          <div class="product-proof__actions" aria-label="Product preview links">
            <a
              class="link-btn link-btn--primary"
              [routerLink]="['/react', 'coding', 'react-counter']"
              [queryParams]="{ src: 'pricing_product_proof' }"
              (click)="trackFreePathClick('product_proof_free_challenge', '/react/coding/react-counter')">
              Open free React Counter challenge
            </a>
            <a
              class="link-btn"
              [routerLink]="['/javascript', 'coding', 'js-throttle']"
              [queryParams]="{ src: 'pricing_product_proof' }"
              (click)="trackFreePathClick('product_proof_solution_preview', '/javascript/coding/js-throttle')">
              Preview a guided solution
            </a>
          </div>
        </div>
        <div class="product-proof__visual">
          <img
            src="assets/images/product-proof/react-counter-workspace.jpg"
            alt="FrontendAtlas React Counter workspace with prompt, code editor, live preview, and run checks controls"
            width="1512"
            height="857"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Actual FrontendAtlas workspace shown with the free React Counter challenge.</figcaption>
        </div>
      </figure>

      <section class="plan-compare" *ngIf="variant === 'full'">
        <h2 class="pr-section-title">Free vs Premium</h2>
        <p class="muted pr-section-subtitle">What each side of the paywall contains today, with a locked example you can open.</p>
        <table>
          <thead>
            <tr>
              <th>What matters</th>
              <th>Free Explorer</th>
              <th>Premium</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of comparisonRows">
              <th scope="row">{{ row.label }}</th>
              <td data-label="Free Explorer">{{ row.freeValue }}</td>
              <td class="plan-compare__premium" data-label="Premium">
                <i class="pi pi-check plan-compare__check" aria-hidden="true"></i>
                <span>{{ row.premiumValue }}</span>
                <a
                  *ngIf="row.link"
                  class="plan-compare__preview"
                  [routerLink]="row.link.to"
                  (click)="trackUnlockPreviewClick({ previewType: row.link.previewType, destination: row.link.to })">
                  {{ row.link.label }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="pr-faq" *ngIf="variant === 'full'" aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" class="pr-section-title pr-faq__title">Frequently asked questions</h2>
        <app-faq-section
          [groups]="faqGroups"
          [singleOpen]="false">
        </app-faq-section>
      </section>

      <p class="pricing-updates-line" *ngIf="variant === 'full'" data-testid="pricing-updates-line">
        Product updates and content changes are published in the
        <a [routerLink]="['/changelog']" (click)="trackChangelogClick('pricing_changelog_link')">changelog</a>.
      </p>
    </section>

      <app-login-required-dialog
        [(visible)]="loginRequiredOpen"
        context="pricing_checkout"
        [directAuthActions]="isOfferV2()"
        [offerVersion]="normalizedOfferVersion()"
        [checkoutSurface]="normalizedCheckoutSurface()"
        [title]="loginRequiredTitle"
        [body]="loginRequiredBody"
        [signupLabel]="loginRequiredSignupLabel"
        [loginLabel]="loginRequiredLoginLabel"
        [redirectTo]="loginRedirectTo">
      </app-login-required-dialog>
  `
})
export class PricingPlansSectionComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private static readonly SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;
  private static readonly CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

  private catalogPremiumPracticeCount?: number | null;
  @Input() set premiumPracticeCount(value: number | null | undefined) {
    this.catalogPremiumPracticeCount = value;
    this.comparisonRows[0].premiumValue = `${this.premiumPracticeSummary}: coding, system design, debug scenarios and tradeoff battles`;
  }
  @Input() variant: PricingVariant = 'full';
  @Input() paymentsEnabled = false;
  @Input() paymentsConfigReady = true;
  @Input() analyticsReady = true;
  @Input() ctaMode: PricingCtaMode = 'navigatePricing';
  @Input() ctaLabel?: string;
  @Input() analyticsSource = 'pricing';
  @Input() analyticsSurface = 'pricing_page';
  @Input() checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  @Input() planDetails: PricingPlanDetails | null = null;
  @Input() offerVersion = PRICING_BASELINE_OFFER_VERSION;
  @Input() regionalPricing: RegionalPricing | null = null;
  @Input() checkoutSurface: CheckoutSurface = 'hosted_new_tab';
  @Input() campaignId?: string | null;

  @ViewChild('planCardsRef') private planCardsRef?: ElementRef<HTMLElement>;

  private checkoutLoading: PlanId | null = null;
  loginRequiredOpen = false;
  loginRedirectTo = '/pricing';
  loginRequiredTitle = 'Create an account to continue';
  loginRequiredBody = 'Create a free account to keep your purchase connected to your progress. Already have an account? Sign in.';
  loginRequiredSignupLabel = 'Create free account';
  loginRequiredLoginLabel = 'Sign in';
  checkoutNotice: string | null = null;
  pendingCheckoutIntent: CheckoutIntent | null = null;
  retryCheckout: {
    url: string;
    planId: PlanId;
    provider: string;
    checkoutMode: string;
    attemptId: string;
    source: string;
    surface: string;
    offerCampaignId?: string;
  } | null = null;
  private checkoutNoticeTimer?: number;
  private visibilityObserver?: IntersectionObserver;
  private viewInitialized = false;
  private analyticsObservationStarted = false;
  private autoContinueAttempted = false;
  private checkoutPrefetchRequested = false;
  private useMobilePrimaryPlanOrder = false;
  autoContinuingPendingCheckout = false;
  private planCardsSeenTracked = false;
  recommendedPlan = RECOMMENDED_PRICING_PLAN;
  readonly totalQuestionCount = SHOWCASE_STATS.totalQuestions;

  get premiumPracticeSummary(): string {
    return premiumPracticeLabel(resolvePremiumPracticeCount(this.catalogPremiumPracticeCount, SHOWCASE_STATS.premiumPracticeCount));
  }

  get proofChips(): string[] {
    return [this.premiumPracticeSummary, 'coding + system design + reasoning practice', 'guided solution depth'];
  }

  comparisonRows: Array<{
    label: string;
    freeValue: string;
    premiumValue: string;
    link?: { to: string; label: string; previewType: string };
  }> = [
    {
      label: 'Prompts',
      freeValue: 'Free coding, concept and front-end system design prompts across the library',
      premiumValue: `${this.premiumPracticeSummary}: coding, system design, debug scenarios and tradeoff battles`,
      link: { to: '/react/coding/react-contact-form-starter', label: 'See a locked coding prompt', previewType: 'coding_depth' },
    },
    {
      label: 'Guided solutions',
      freeValue: 'On every free coding question',
      premiumValue: 'On every Premium coding question',
    },
    {
      label: 'Runnable checks',
      freeValue: 'JavaScript and debugging tasks',
      premiumValue: 'JavaScript and debugging tasks, and most React, Angular and Vue tasks',
    },
    {
      label: 'Front-end system design',
      freeValue: 'Free walkthroughs',
      premiumValue: 'Every walkthrough, with official-source checks',
      link: { to: '/system-design/multi-step-form-autosave', label: 'See a locked walkthrough', previewType: 'system_design_depth' },
    },
    {
      label: 'Company practice pages',
      freeValue: 'Every company page, with a public interview report cited wherever a prompt is modelled on one',
      premiumValue: 'The Premium prompts inside them',
    },
    {
      label: 'Progress',
      freeValue: 'Local drafts',
      premiumValue: 'Account-backed progress across the Premium library',
    },
  ];

  plans: PricingPlan[] = [
      {
        id: 'monthly',
        title: 'Monthly',
        summary: 'Best for trying Premium',
        features: ['Full Premium content', 'Cancel before the next renewal'],
        badge: '',
        ctaLabel: 'Start monthly',
      },
      {
        id: 'quarterly',
        title: 'Quarterly',
        summary: 'Best for 4-12 week interview prep',
        features: ['Full Premium content', 'Fits a focused interview sprint'],
        badge: 'Recommended sprint',
        ctaLabel: 'Start quarterly',
      },
      {
        id: 'annual',
        title: 'Annual',
        summary: 'Best value if you’ll keep practicing',
        features: ['Full Premium content', 'Best value for ongoing prep'],
        badge: 'Best value',
        ctaLabel: 'Start annual',
      },
      {
        id: 'lifetime',
        title: 'Lifetime',
        summary: 'For long-term reuse',
        features: ['Full Premium content', 'Premium access forever'],
        badge: 'Lifetime access',
        ctaLabel: 'Get lifetime access',
      },
    ];

  faqGroups = [
    {
      id: 'plans-billing',
      title: 'Plans & Billing',
      items: [
        {
          id: 'premium-includes',
          q: 'What’s included in Premium?',
          a: `Premium unlocks the deeper half of the library and the material behind it:<br>
- the Premium coding prompts, each with a guided solution<br>
- front-end system design walkthroughs with official-source checks<br>
- debug scenarios and tradeoff battles<br>
- company practice pages, with a public interview report cited wherever a prompt is modelled on one<br>
- content updates while your plan is active<br><br>
Every paid plan unlocks the same library; only the access period changes.`,
        },
        {
          id: 'cancel-anytime',
          q: 'Can I cancel a subscription anytime?',
          a: `Yes.<br><br>
Cancel anytime and you keep access until the end of your current billing period.<br>
Lemon Squeezy, our payment provider, emails a renewal reminder seven days before a renewal.<br>
No surprises: cancelling only stops the next renewal.`,
        },
        {
          id: 'refunds',
          q: 'Do you offer refunds?',
          a: `Yes, for a first purchase: ask within 14 days of the order and we refund it in full, with no usage test. One first-purchase refund per account.<br><br>
Renewal charges and unused subscription time are generally non-refundable, and mandatory consumer rights always apply.<br><br>
For the exact terms, see <code>/legal/refund</code>.<br>
To request a refund or report a wrong charge, email <code>support@frontendatlas.com</code> with your order ID.`,
        },
        {
          id: 'employer-reimbursement',
          q: 'Can my employer reimburse this?',
          a: `Often, yes. Interview prep usually fits a learning or development budget.<br><br>
Lemon Squeezy, our payment provider, emails a receipt for every order. You can create a PDF invoice from its My Orders page, or from the billing portal linked in your profile for subscriptions.<br><br>
If your employer needs anything else, email <code>support@frontendatlas.com</code>.`,
        },
        {
          id: 'student-discount',
          q: 'Is there a student discount?',
          a: `Yes: 40% off the annual plan on your first purchase.<br><br>
Sign up with your school email address, or set it as your account email, and verify it from your profile. The price is applied at checkout automatically, and the pricing page says so once your address is verified.<br><br>
Student pricing is never combined with a regional price; you get the better of the two.<br><br>
If your school address does not end in .edu or .ac, email <code>support@frontendatlas.com</code> from that address and we switch student pricing on for your account.`,
        },
        {
          id: 'payment-declined',
          q: 'Checkout failed / payment was declined — what should I try first?',
          a: `Quick checklist (most issues are one of these):<br><br>
- Re-check billing details (name, address, ZIP/postal code if required)<br>
- Try a different card (or a virtual card)<br>
- Disable VPN/ad blockers that can break checkout flows<br>
- Make sure your bank allows online/international payments<br><br>
If it still fails: email <code>support@frontendatlas.com</code> with the time of the attempt + your account email.`,
        },
      ],
    },
    {
      id: 'what-you-practice',
      title: 'What you practice',
      items: [
        {
          id: 'solutions-and-explanations',
          q: 'Do exercises include solutions and explanations?',
          a: `Yes. Every coding question, free or Premium, includes a guided solution.<br><br>
Solutions focus on what matters in interviews:<br>
- a clean baseline implementation<br>
- edge cases and common mistakes<br>
- tradeoffs between approaches when there is more than one right answer<br><br>
Concept questions carry worked answers, and system design walkthroughs are the solution itself. Some prompts stay open-ended on purpose to mirror real interview discussion.`,
        },
        {
          id: 'run-tests',
          q: 'Can I run tests / validate my solution inside the app?',
          a: `Yes. Every JavaScript and debugging task has runnable checks, and most React, Angular and Vue tasks do too.<br><br>
This mirrors a professional loop: write, run checks, fix edge cases, ship.<br><br>
HTML and CSS tasks rely on the live preview instead, because visuals are the primary correctness signal.`,
        },
      ],
    },
  ];

  isOfferV2(): boolean {
    // v2 and every later sprint version share the layout; see offer-version.util.ts.
    return isSprintOfferVersion(this.normalizedOfferVersion());
  }

  activeProofChips(): string[] {
    if (!this.isOfferV2()) return this.proofChips;
    return [
      `${this.totalQuestionCount} questions`,
      this.premiumPracticeSummary,
      'Runnable checks + guided solutions',
      'Front-end system design',
      'Official-source checks',
    ];
  }

  activePrimaryPlans(): PricingPlan[] {
    if (!this.isOfferV2()) return this.plans;
    const primaryPlans = this.plans.filter((plan) => plan.id !== 'lifetime');
    if (!this.useMobilePrimaryPlanOrder) return primaryPlans;
    const mobileOrder: PlanId[] = ['quarterly', 'monthly', 'annual'];
    return [...primaryPlans].sort(
      (left, right) => mobileOrder.indexOf(left.id) - mobileOrder.indexOf(right.id),
    );
  }

  lifetimePlan(): PricingPlan {
    return this.plans.find((plan) => plan.id === 'lifetime') as PricingPlan;
  }

  trackPlanById(_index: number, plan: PricingPlan): PlanId {
    return plan.id;
  }

  badgeFor(plan: PricingPlan): string {
    if (!this.isOfferV2()) return plan.badge;
    if (plan.id !== RECOMMENDED_PRICING_PLAN) return '';
    // The full page states the sprint length in the card summary, so its badge stays one word.
    return this.variant === 'full' ? 'Recommended' : 'Recommended — 4–12 week interview sprint';
  }

  summaryFor(plan: PricingPlan): string {
    if (!this.isOfferV2()) return plan.summary;
    const summaries: Record<PlanId, string> = {
      monthly: 'A flexible month of focused practice',
      quarterly: this.variant === 'full'
        ? 'Built for a complete 4–12 week interview sprint'
        : 'Built for a complete interview sprint',
      annual: 'Lowest monthly cost for ongoing practice',
      lifetime: 'Long-term access with one payment',
    };
    return summaries[plan.id];
  }

  displayPrice(planId: PlanId): string {
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return '—';
    return this.formatMoney(detail.amountCents, detail.currency, false);
  }

  priceSuffix(planId: PlanId): string {
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return '';
    if (detail.interval === 'one_time') return ' once';
    if (detail.interval === 'month' && detail.intervalCount === 1) return ' / month';
    if (detail.interval === 'month' && Number(detail.intervalCount) > 1) {
      return ` / ${detail.intervalCount} months`;
    }
    if (detail.interval === 'year' && detail.intervalCount === 1) return ' / year';
    return ` / ${detail.intervalCount || 1} ${detail.interval}s`;
  }

  billingNote(planId: PlanId): string {
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return 'Checkout unavailable';
    if (detail.interval === 'one_time') return 'One-time payment';
    if (detail.interval === 'month' && detail.intervalCount === 1) return 'Billed monthly';
    const months = this.billingMonths(detail);
    const perMonth = this.formatMoney(detail.amountCents / months, detail.currency, true);
    if (detail.interval === 'year' && detail.intervalCount === 1) {
      return `${perMonth}/mo billed yearly`;
    }
    return `${perMonth}/mo billed every ${months} months`;
  }

  // The full sprint page leads with the monthly equivalent so the three cards
  // compare in one unit, with the billed total on the next line. The compact
  // homepage section keeps the plan total as its headline.
  usesPerMonthHeadline(planId: PlanId): boolean {
    return this.variant === 'full' && this.isOfferV2() && (planId === 'quarterly' || planId === 'annual');
  }

  priceHeadline(planId: PlanId): string {
    if (!this.usesPerMonthHeadline(planId)) return this.displayPrice(planId);
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return '—';
    return this.formatMoney(detail.amountCents / this.billingMonths(detail), detail.currency, false);
  }

  priceHeadlineSuffix(planId: PlanId): string {
    if (!this.usesPerMonthHeadline(planId)) return this.priceSuffix(planId);
    return this.planDetailForDisplay(planId) ? ' / month' : '';
  }

  priceDetail(planId: PlanId): string {
    if (!this.usesPerMonthHeadline(planId)) return this.billingNote(planId);
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return 'Checkout unavailable';
    const total = this.formatMoney(detail.amountCents, detail.currency, false);
    if (detail.interval === 'year' && detail.intervalCount === 1) return `${total} billed yearly`;
    return `${total} billed every ${this.billingMonths(detail)} months`;
  }

  // Only the recommended card carries the filled button on the full page.
  isOutlineCta(planId: PlanId): boolean {
    return this.variant === 'full' && this.isOfferV2() && planId !== this.recommendedPlan;
  }

  // Regional pricing: the backend publishes the country's prices with the
  // checkout config and charges them through a custom checkout. The cards show
  // the list price struck through next to the regional one; that struck figure
  // is the live list price, the one exception to the no-struck-prices rule.
  private regionalAmount(planId: PlanId): number | null {
    const amount = this.regionalPricing?.prices?.[planId];
    return typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0 ? amount : null;
  }

  regionalPercentOff(): number {
    const multiplier = Number(this.regionalPricing?.multiplier);
    return Number.isFinite(multiplier) ? Math.round((1 - multiplier) * 100) : 0;
  }

  listPriceHeadline(planId: PlanId): string | null {
    const list = this.configuredPlanDetail(planId);
    if (!list || this.regionalAmount(planId) === null) return null;
    if (this.usesPerMonthHeadline(planId)) {
      return this.formatMoney(list.amountCents / this.billingMonths(list), list.currency, false);
    }
    return this.formatMoney(list.amountCents, list.currency, false);
  }

  private billingMonths(detail: PricingPlanDetail): number {
    return detail.interval === 'year'
      ? 12 * Math.max(1, Number(detail.intervalCount) || 1)
      : Math.max(1, Number(detail.intervalCount) || 1);
  }

  savingsLabel(planId: PlanId): string | null {
    if (!this.isOfferV2() || (planId !== 'quarterly' && planId !== 'annual')) return null;
    const monthly = this.planDetailForDisplay('monthly');
    const detail = this.planDetailForDisplay(planId);
    if (!monthly || !detail || monthly.currency !== detail.currency || monthly.amountCents <= 0) return null;
    const comparisonMonths = planId === 'quarterly' ? 3 : 12;
    const percentage = Math.round((1 - (detail.amountCents / (monthly.amountCents * comparisonMonths))) * 100);
    return percentage > 0 ? `Save ${percentage}%` : null;
  }

  planNote(_planId: PlanId): string | null {
    if (this.isOfferV2()) return null;
    return 'Final price, currency, and taxes are shown at checkout.';
  }

  taxTrustCopy(): string {
    const primaryDetails = this.activePrimaryPlans()
      .map((plan) => this.planDetailForDisplay(plan.id))
      .filter((detail): detail is PricingPlanDetail => !!detail);
    return primaryDetails.length === this.activePrimaryPlans().length
      && primaryDetails.every((detail) => detail.taxInclusive)
      ? 'Taxes included'
      : 'Taxes calculated at checkout';
  }

  trackCompareAllPlans(): void {
    this.analytics.track('pricing_compare_all_clicked', {
      ...this.pricingAnalyticsBase(),
      destination: '/pricing#pricing-plans',
    });
  }

  ctaTextFor(plan: { ctaLabel: string }): string {
    if (isProActive(this.auth.user())) return 'Manage subscription';
    if (this.ctaLabel) return this.ctaLabel;
    if (this.ctaMode === 'navigatePricing') {
      return plan.ctaLabel
        .replace(/^Start /, 'View ')
        .replace(/^Get lifetime access$/, 'View lifetime plan');
    }
    return plan.ctaLabel;
  }

  isProUser(): boolean {
    return isProActive(this.auth.user());
  }

  // Student pricing is decided by the backend (verified school email or a
  // support approval) and applied at checkout; the page only states it.
  studentPricingNotice(): { text: string; link?: { to: string[]; label: string } } | null {
    if (this.variant !== 'full') return null;
    const user = this.auth.user();
    if (!user) return null;
    if (user.studentDiscountEligible) {
      if (this.regionalPricing && Number(this.regionalPricing.multiplier) <= STUDENT_PRICE_MULTIPLIER) {
        return { text: 'Your school email is verified. The regional price shown here is lower than the student price, so it applies instead.' };
      }
      return { text: 'Your school email is verified: 40% off the annual plan is applied at checkout on your first purchase.' };
    }
    if (user.studentEmailPendingVerification) {
      return {
        text: 'Verify your school email to unlock student pricing.',
        link: { to: ['/profile'], label: 'Verify in your profile' },
      };
    }
    return null;
  }

  // A guest signs up with the school address; a signed-in account adds it in
  // the profile. Eligible and pending accounts are covered by studentPricingNotice().
  studentDiscountAction(): {
    to: string[];
    label: string;
    destination: string;
    queryParams?: Record<string, string>;
  } | null {
    if (this.variant !== 'full' || this.studentPricingNotice()) return null;
    const user = this.auth.user();
    if (!user) {
      return {
        to: ['/auth/signup'],
        queryParams: { src: 'pricing_student_discount' },
        destination: '/auth/signup',
        label: 'Sign up with your school email',
      };
    }
    if (isProActive(user)) return null;
    return { to: ['/profile'], destination: '/profile', label: 'Set your school email in your profile' };
  }

  trackStudentDiscountClick(destination: string): void {
    this.analytics.track('pricing_student_discount_clicked', {
      ...this.pricingAnalyticsBase(),
      destination,
      auth_state: this.analyticsAuthState(),
    });
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private billingCheckout: BillingCheckoutService,
    private analytics: AnalyticsService,
    private checkoutIntent: CheckoutIntentService,
    private conversionContext: ConversionContextService,
  ) { }

  formatWeek(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  trackChangelogClick(location: string): void {
    this.analytics.track('changelog_link_clicked', {
      src: this.normalizedSource(),
      location,
      page: 'pricing',
    });
  }

  trackFreePathClick(cta: string, destination: string): void {
    this.analytics.track('pricing_free_path_clicked', {
      ...this.pricingAnalyticsBase(),
      cta,
      destination,
    });
  }

  trackUnlockPreviewClick(item: { previewType: string; destination: string }): void {
    this.analytics.track('pricing_unlock_preview_clicked', {
      ...this.pricingAnalyticsBase(),
      preview_type: item.previewType,
      destination: item.destination,
    });
  }

  ngOnInit(): void {
    // The viewport-dependent plan order is applied after the first render (see
    // ngAfterViewInit): the prerendered HTML carries the server order, and the
    // first client render must match it for hydration to claim the DOM.
    this.pendingCheckoutIntent = this.ctaMode === 'checkout' ? this.checkoutIntent.load() : null;
    this.maybePrefetchCheckout();
    this.schedulePendingCheckoutAutoContinue();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.ctaMode === 'checkout' && !this.pendingCheckoutIntent) {
      this.pendingCheckoutIntent = this.checkoutIntent.load();
    }
    this.maybePrefetchCheckout();
    this.schedulePendingCheckoutAutoContinue();
    this.scheduleAnalyticsObservation();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleAnalyticsObservation();
    if (typeof window !== 'undefined') {
      // Runs after hydration has claimed the server DOM and before the next paint,
      // so a mobile viewport reorders the cards as an ordinary update.
      queueMicrotask(() => this.syncPrimaryPlanOrder());
    }
  }

  ngOnDestroy(): void {
    if (this.checkoutNoticeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.checkoutNoticeTimer);
      this.checkoutNoticeTimer = undefined;
    }
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.syncPrimaryPlanOrder();
  }

  isCheckoutAvailable(planId: PlanId): boolean {
    if (this.ctaMode === 'navigatePricing') return true;
    if (!this.paymentsEnabled) return false;
    if (!this.paymentsConfigReady) return false;
    return this.checkoutAvailability?.[planId] === true && !!this.configuredPlanDetail(planId);
  }

  private maybePrefetchCheckout(): void {
    if (
      this.checkoutPrefetchRequested
      || this.ctaMode !== 'checkout'
      || typeof window === 'undefined'
      || !this.paymentsEnabled
    ) return;
    this.checkoutPrefetchRequested = true;
    void this.billingCheckout.prefetch();
  }

  private syncPrimaryPlanOrder(): void {
    if (typeof window === 'undefined') {
      this.useMobilePrimaryPlanOrder = false;
      return;
    }
    this.useMobilePrimaryPlanOrder = typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 640px)').matches
      : window.innerWidth <= 640;
  }

  private scheduleAnalyticsObservation(): void {
    if (
      !this.viewInitialized
      || !this.analyticsReady
      || this.analyticsObservationStarted
      || typeof window === 'undefined'
    ) return;
    this.analyticsObservationStarted = true;
    this.observePricingVisibility();
  }

  private schedulePendingCheckoutAutoContinue(): void {
    if (
      !this.isOfferV2()
      || this.ctaMode !== 'checkout'
      || !this.paymentsConfigReady
      || !this.paymentsEnabled
      || this.autoContinueAttempted
    ) return;
    const intent = this.checkoutIntent.load();
    const user = this.auth.user();
    if (!intent || !user || isProActive(user) || !this.isCheckoutAvailable(intent.planId)) return;

    this.pendingCheckoutIntent = intent;
    this.autoContinueAttempted = true;
    this.autoContinuingPendingCheckout = true;
    Promise.resolve()
      .then(() => this.continuePendingCheckout())
      .finally(() => { this.autoContinuingPendingCheckout = false; });
  }

  isCheckoutDisabled(planId: PlanId): boolean {
    if (isProActive(this.auth.user())) return this.checkoutLoading !== null;
    if (this.ctaMode === 'navigatePricing') return false;
    if (!this.paymentsConfigReady || !this.paymentsEnabled) return true;
    return !this.isCheckoutAvailable(planId) || this.checkoutLoading !== null;
  }

  isCheckoutLoading(planId: PlanId): boolean {
    return this.checkoutLoading === planId;
  }

  checkoutTooltip(planId: PlanId): string | null {
    if (this.checkoutLoading !== null) return 'Loading checkout...';
    if (isProActive(this.auth.user()) || this.ctaMode === 'navigatePricing') return null;
    if (!this.paymentsConfigReady) return 'Checking checkout availability...';
    if (this.paymentsConfigReady && !this.paymentsEnabled) return 'Checkout is temporarily unavailable.';
    if (this.isCheckoutAvailable(planId)) return null;
    return 'Checkout is temporarily unavailable.';
  }

  private observePricingVisibility(): void {
    const element = this.planCardsRef?.nativeElement;
    if (!element) return;
    if (typeof window.IntersectionObserver !== 'function') {
      this.trackPlanCardsSeen();
      return;
    }
    this.visibilityObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        this.trackPlanCardsSeen();
        this.visibilityObserver?.unobserve(entry.target);
      }
    }, { threshold: 0.25 });
    this.visibilityObserver.observe(element);
  }

  private trackPlanCardsSeen(): void {
    if (this.planCardsSeenTracked) return;
    this.planCardsSeenTracked = true;
    this.analytics.track('pricing_viewed', {
      ...this.pricingAnalyticsBase(),
      plan_count: this.activePrimaryPlans().length,
      lifetime_secondary: this.isOfferV2(),
    });
  }

  private setCheckoutNotice(message: string, persistent = false) {
    this.checkoutNotice = message;
    if (this.checkoutNoticeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.checkoutNoticeTimer);
    }
    if (typeof window === 'undefined' || persistent) return;
    this.checkoutNoticeTimer = window.setTimeout(() => {
      this.checkoutNotice = null;
      this.checkoutNoticeTimer = undefined;
    }, 8000);
  }

  private normalizedSource(): string {
    const raw = String(this.analyticsSource || '').trim().toLowerCase();
    if (!raw || !PricingPlansSectionComponent.SOURCE_PATTERN.test(raw)) return 'pricing';
    return raw;
  }

  private normalizedSurface(): string {
    const raw = String(this.analyticsSurface || '').trim().toLowerCase();
    if (!raw || !PricingPlansSectionComponent.SOURCE_PATTERN.test(raw)) return 'pricing_page';
    return raw;
  }

  normalizedOfferVersion(): string {
    const raw = String(this.offerVersion || '').trim().toLowerCase();
    if (!raw || !PricingPlansSectionComponent.SOURCE_PATTERN.test(raw)) {
      return PRICING_BASELINE_OFFER_VERSION;
    }
    return raw;
  }

  normalizedCheckoutSurface(): CheckoutSurface {
    const raw = String(this.checkoutSurface || '').trim().toLowerCase();
    return raw === 'overlay' ? 'overlay' : 'hosted_new_tab';
  }

  private requestedCampaignId(): string | undefined {
    const explicit = this.normalizeCampaignId(this.campaignId);
    if (explicit) return explicit;
    if (typeof window === 'undefined') return undefined;

    try {
      // Campaign IDs are opaque server allowlist keys, never provider coupon
      // codes. Unknown IDs safely resolve to an undiscounted checkout server-side.
      return this.normalizeCampaignId(new URL(window.location.href).searchParams.get('campaign_id'));
    } catch {
      return undefined;
    }
  }

  private normalizeCampaignId(value: unknown): string | undefined {
    const normalized = String(value || '').trim().toLowerCase();
    return PricingPlansSectionComponent.CAMPAIGN_ID_PATTERN.test(normalized) ? normalized : undefined;
  }

  private pageLayout(): string {
    return this.isOfferV2() ? PRICING_V2_OFFER_VERSION : PRICING_PAGE_LAYOUT;
  }

  private configuredPlanDetail(planId: PlanId): PricingPlanDetail | null {
    const detail = this.planDetails?.[planId];
    if (!detail || !Number.isFinite(detail.amountCents) || detail.amountCents <= 0) return null;
    if (!/^[A-Z]{3}$/.test(String(detail.currency || '').toUpperCase())) return null;
    return {
      ...detail,
      currency: String(detail.currency).toUpperCase(),
    };
  }

  private planDetailForDisplay(planId: PlanId): PricingPlanDetail | null {
    const detail = this.configuredPlanDetail(planId);
    if (!detail) return null;
    const regionalAmount = this.regionalAmount(planId);
    return regionalAmount === null ? detail : { ...detail, amountCents: regionalAmount };
  }

  private formatMoney(amountCents: number, currency: string, forceCents: boolean): string {
    const amount = amountCents / 100;
    const hasFraction = Math.abs(amount - Math.round(amount)) > 0.0001;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: forceCents || hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(forceCents || hasFraction ? 2 : 0)}`;
    }
  }

  private pricingAnalyticsBase(): Record<string, string> {
    return {
      src: this.normalizedSource(),
      surface: this.normalizedSurface(),
      variant: this.variant,
      page_layout: this.pageLayout(),
      offer_version: this.normalizedOfferVersion(),
      checkout_surface: this.normalizedCheckoutSurface(),
      recommended_plan: RECOMMENDED_PRICING_PLAN,
    };
  }

  private planAnalyticsMeta(planId: PlanId): { cta_label: string; plan_position: number } {
    const displayedPlans = this.activePrimaryPlans();
    const allVisiblePlans = this.isOfferV2()
      ? [...displayedPlans, this.lifetimePlan()]
      : displayedPlans;
    const index = allVisiblePlans.findIndex((plan) => plan.id === planId);
    const plan = index >= 0 ? allVisiblePlans[index] : null;
    return {
      cta_label: plan ? this.ctaTextFor(plan) : this.ctaLabel || 'Upgrade',
      plan_position: index >= 0 ? index + 1 : -1,
    };
  }

  private trackPlanClick(planId: PlanId, method: string) {
    this.analytics.track('pricing_plan_cta_clicked', {
      plan: planId,
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      auth_state: this.analyticsAuthState(),
      method,
      redirect_to_present: false,
      ...this.planAnalyticsMeta(planId),
    });
  }

  private trackCheckoutIntentCreated(intent: CheckoutIntent): void {
    this.analytics.track('checkout_intent_created', {
      plan: intent.planId,
      plan_id: intent.planId,
      ...this.pricingAnalyticsBase(),
      src: intent.src,
      surface: intent.surface,
      auth_state: this.analyticsAuthState(),
    });
  }

  private trackCheckoutOpened(
    planId: PlanId,
    provider: string,
    checkoutMode: string,
    launchMode: string,
    source: string,
    surface: string,
    offerCampaignId?: string,
  ): void {
    this.analytics.track('checkout_opened', {
      plan: planId,
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      ...(offerCampaignId ? { offer_campaign_id: offerCampaignId } : {}),
      src: source,
      surface,
      auth_state: this.analyticsAuthState(),
      provider,
      checkout_mode: checkoutMode,
      launch_mode: launchMode,
    });
  }

  private trackCheckoutLaunchFailed(
    planId: PlanId,
    provider: string,
    reason: string,
    source: string,
    surface: string,
  ): void {
    this.analytics.track('checkout_launch_failed', {
      plan: planId,
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      src: source,
      surface,
      auth_state: this.analyticsAuthState(),
      provider,
      launch_mode: reason === 'popup_blocked' ? 'blocked' : 'not_opened',
      failure_reason: reason,
    });
  }

  private trackBeginCheckout(
    planId: PlanId,
    provider: string,
    checkoutMode: string,
    launchMode: string,
    source = this.normalizedSource(),
    surface = this.normalizedSurface(),
    offerCampaignId?: string,
  ) {
    // The analytics value is the amount the checkout charges, regional or list.
    const detail = this.planDetailForDisplay(planId);
    if (!detail) return;
    const value = detail.amountCents / 100;
    this.analytics.track('begin_checkout', {
      plan: planId,
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      ...(offerCampaignId ? { offer_campaign_id: offerCampaignId } : {}),
      src: source,
      surface,
      auth_state: this.analyticsAuthState(),
      provider,
      checkout_mode: checkoutMode,
      launch_mode: launchMode,
      currency: detail.currency,
      value,
      items: [{
        item_id: `frontendatlas_${planId}`,
        item_name: `${planId.charAt(0).toUpperCase()}${planId.slice(1)} Premium`,
        affiliation: 'FrontendAtlas',
        price: value,
        quantity: 1,
      }],
    });
  }

  async onCta(planId: PlanId) {
    // Guard programmatic and near-simultaneous clicks as well as the disabled
    // button state. A second click must never replace the persisted intent
    // while the first plan is creating/opening its checkout.
    if (this.checkoutLoading !== null) return;
    const source = this.normalizedSource();
    const surface = this.normalizedSurface();
    const campaignId = this.requestedCampaignId();
    if (isProActive(this.auth.user())) {
      this.trackPlanClick(planId, 'manage_subscription');
      this.openManageSubscription(planId);
      return;
    }
    if (this.ctaMode === 'navigatePricing') {
      this.trackPlanClick(planId, 'navigate_pricing');
      this.conversionContext.rememberPricingContext(source, surface);
      this.router.navigate(['/pricing'], { fragment: 'pricing-plans' }).catch(() => void 0);
      return;
    }
    if (!this.paymentsConfigReady) {
      return;
    }
    if (this.paymentsConfigReady && !this.paymentsEnabled) {
      this.trackPlanClick(planId, 'checkout_unavailable');
      this.setCheckoutNotice('Checkout is temporarily unavailable. Please try again shortly.');
      return;
    }
    if (this.paymentsEnabled) {
      if (this.isCheckoutAvailable(planId)) {
        this.trackPlanClick(planId, 'checkout');
        const intent = this.checkoutIntent.save({
          planId,
          src: source,
          surface,
          campaignId,
          returnUrl: this.router.url || '/pricing',
        });
        this.trackCheckoutIntentCreated(intent);

        const user = this.auth.user();
        if (!user) {
          // Return to a visible continuation banner after authentication. The
          // original plan/source remain in sessionStorage, not the public URL.
          this.loginRedirectTo = '/pricing';
          this.loginRequiredOpen = true;
          return;
        }

        await this.launchCheckout(planId, source, surface, user, campaignId);
        return;
      }
      this.trackPlanClick(planId, 'checkout_unavailable');
      this.setCheckoutNotice('Checkout is not configured for this plan yet. Please try again later.');
      return;
    }

    this.trackPlanClick(planId, 'checkout_unavailable');
    this.setCheckoutNotice('Checkout is temporarily unavailable. Please try again shortly.');
  }

  canShowPendingCheckoutIntent(): boolean {
    return !!this.auth.user() && !isProActive(this.auth.user());
  }

  pendingPlanTitle(): string {
    const planId = this.pendingCheckoutIntent?.planId;
    return this.plans.find((plan) => plan.id === planId)?.title || 'your selected plan';
  }

  async continuePendingCheckout(): Promise<void> {
    if (this.checkoutLoading !== null) return;
    const intent = this.checkoutIntent.load();
    const user = this.auth.user();
    if (!intent || !user || isProActive(user)) return;
    if (!this.isCheckoutAvailable(intent.planId)) {
      this.setCheckoutNotice('Checkout is not configured for this plan yet. Please choose another plan.');
      return;
    }
    this.trackPlanClick(intent.planId, 'continue_intent');
    await this.launchCheckout(intent.planId, intent.src, intent.surface, user, intent.campaignId);
  }

  dismissPendingCheckoutIntent(): void {
    this.checkoutIntent.clear();
    this.pendingCheckoutIntent = null;
  }

  async continueCheckoutInSameTab(): Promise<void> {
    const retry = this.retryCheckout;
    if (!retry || typeof window === 'undefined') return;

    this.trackCheckoutOpened(
      retry.planId,
      retry.provider,
      retry.checkoutMode,
      'same_tab',
      retry.source,
      retry.surface,
      retry.offerCampaignId,
    );
    this.trackBeginCheckout(
      retry.planId,
      retry.provider,
      retry.checkoutMode,
      'same_tab',
      retry.source,
      retry.surface,
      retry.offerCampaignId,
    );
    // Give the authenticated state write a short opportunity to finish before
    // same-tab navigation tears down the Angular request. The intent remains
    // in this tab so the provider's success/cancel return can attribute and
    // clear it terminally.
    await this.recordClientStateBeforeNavigation(retry.attemptId, 'provider_opened');
    this.pendingCheckoutIntent = null;
    this.retryCheckout = null;
    window.location.assign(retry.url);
  }

  private async launchCheckout(
    planId: PlanId,
    source: string,
    surface: string,
    user: { _id: string; email: string; username: string },
    campaignId?: string,
  ): Promise<void> {
    if (this.checkoutLoading) return;

    // This must happen synchronously inside the click handler, before any
    // config/auth/checkout network await consumes browser user activation.
    const launchReservation = this.billingCheckout.reserveCheckoutWindow();
    this.checkoutLoading = planId;
    this.checkoutNotice = null;
    this.retryCheckout = null;

    try {
      const result = await this.billingCheckout.checkout(planId, {
        userId: user._id,
        email: user.email,
        username: user.username,
        launchReservation,
        analyticsSessionId: this.analytics.getDecisionSessionId() || undefined,
        campaignId,
        offerVersion: this.normalizedOfferVersion(),
        checkoutSurface: this.normalizedCheckoutSurface(),
      }, source, surface);

      if (!result.ok) {
        this.trackCheckoutLaunchFailed(planId, result.provider, result.reason, source, surface);
        if (result.reason === 'verification-required') {
          this.setCheckoutNotice('Verify your email in Profile → Account before starting checkout.');
        } else if (result.reason === 'invalid-url') {
          this.setCheckoutNotice('Checkout is misconfigured right now. Please contact support.');
        } else {
          this.setCheckoutNotice('Checkout is unavailable right now. Please try again in a moment.');
        }
        this.pendingCheckoutIntent = this.checkoutIntent.load();
        return;
      }

      if (result.mode === 'blocked') {
        this.recordClientState(result.attemptId, 'popup_blocked');
        this.trackCheckoutLaunchFailed(planId, result.provider, 'popup_blocked', source, surface);
        this.retryCheckout = {
          url: result.url,
          planId,
          provider: result.provider,
          checkoutMode: result.checkoutMode,
          attemptId: result.attemptId,
          source,
          surface,
          offerCampaignId: result.campaignId,
        };
        this.setCheckoutNotice(
          'Your browser blocked the checkout tab. Continue safely in this tab, or allow popups and try again.',
          true,
        );
        return;
      }

      const launchMode = result.mode === 'new-tab'
        ? 'new_tab'
        : result.mode === 'same-tab'
          ? 'same_tab'
          : result.mode;
      if (result.mode === 'same-tab') {
        this.trackCheckoutOpened(
          planId,
          result.provider,
          result.checkoutMode,
          launchMode,
          source,
          surface,
          result.campaignId,
        );
        this.trackBeginCheckout(
          planId,
          result.provider,
          result.checkoutMode,
          launchMode,
          source,
          surface,
          result.campaignId,
        );
        await this.recordClientStateBeforeNavigation(result.attemptId, 'provider_opened');
        if (!this.navigateLemonSqueezyCheckoutSameTab(result.url, result.provider)) {
          this.setCheckoutNotice('Checkout could not open safely. Please try again in a moment.', true);
          this.pendingCheckoutIntent = this.checkoutIntent.load();
        }
        return;
      }

      this.recordClientState(result.attemptId, 'provider_opened');
      this.trackCheckoutOpened(
        planId,
        result.provider,
        result.checkoutMode,
        launchMode,
        source,
        surface,
        result.campaignId,
      );
      this.trackBeginCheckout(
        planId,
        result.provider,
        result.checkoutMode,
        launchMode,
        source,
        surface,
        result.campaignId,
      );
      this.checkoutIntent.clear();
      this.pendingCheckoutIntent = null;

      const launchNotice = getCheckoutLaunchNotice(result.mode, result.reused);
      if (launchNotice) this.setCheckoutNotice(launchNotice);
    } finally {
      if (this.checkoutLoading === planId) this.checkoutLoading = null;
    }
  }

  private navigateLemonSqueezyCheckoutSameTab(url: string, provider: string): boolean {
    if (typeof window === 'undefined' || provider !== 'lemonsqueezy') return false;
    try {
      const parsed = new URL(String(url || '').trim());
      if (
        parsed.protocol !== 'https:'
        || parsed.hostname !== 'frontendatlas.lemonsqueezy.com'
        || !/^\/checkout\/buy\/[^/]+/.test(parsed.pathname)
      ) {
        return false;
      }
      const redirectHook = (window as any).__faCheckoutRedirect;
      if (typeof redirectHook === 'function') {
        redirectHook(parsed.toString());
      } else {
        window.location.assign(parsed.toString());
      }
      return true;
    } catch {
      return false;
    }
  }

  private recordClientState(
    attemptId: string,
    state: 'provider_opened' | 'popup_blocked',
  ): void {
    this.billingCheckout.recordAttemptClientState(attemptId, state).subscribe({
      error: () => undefined,
    });
  }

  private async recordClientStateBeforeNavigation(
    attemptId: string,
    state: 'provider_opened' | 'popup_blocked',
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    await Promise.race([
      firstValueFrom(this.billingCheckout.recordAttemptClientState(attemptId, state))
        .then(() => undefined)
        .catch(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 400)),
    ]);
  }

  private analyticsAuthState(): 'guest' | 'logged_in_free' | 'logged_in_pro' {
    const user = this.auth.user();
    if (!user) return 'guest';
    return isProActive(user) ? 'logged_in_pro' : 'logged_in_free';
  }

  private openManageSubscription(planId: PlanId) {
    if (this.checkoutLoading) return;
    const reservation = reserveExternalWindow();
    this.checkoutNotice = null;
    this.checkoutLoading = planId;
    this.auth.getManageSubscriptionUrl().subscribe({
      next: ({ url }) => {
        this.checkoutLoading = null;
        if (!url) {
          releaseExternalWindowReservation(reservation);
          this.setCheckoutNotice(
            'We could not open the billing portal automatically right now. Contact support@frontendatlas.com for help.'
          );
          return;
        }
        const openResult = navigateReservedExternalWindow(reservation, url);
        if (openResult === 'blocked') {
          this.setCheckoutNotice('Your browser blocked the billing portal. Allow popups and try again.');
          return;
        }
      },
      error: (err) => {
        releaseExternalWindowReservation(reservation);
        this.checkoutLoading = null;
        this.setCheckoutNotice(getManageSubscriptionErrorMessage(err));
      },
    });
  }
}
