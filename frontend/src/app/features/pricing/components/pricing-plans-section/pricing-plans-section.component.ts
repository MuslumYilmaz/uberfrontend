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
import { PUBLIC_CHANGELOG_ENTRIES } from '../../../../core/content/public-changelog';
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
export const PRICING_BASELINE_OFFER_VERSION = 'pricing_baseline_v1';
export const PRICING_V2_OFFER_VERSION = 'interview_sprint_v2';
export const RECOMMENDED_PRICING_PLAN: PlanId = 'quarterly';

@Component({
  standalone: true,
  selector: 'app-pricing-plans-section',
  imports: [CommonModule, RouterModule, FaqSectionComponent, LoginRequiredDialogComponent, FaButtonComponent],
  styleUrls: ['./pricing-plans-section.component.css'],
  template: `
    <section class="pr-wrap" [class.pr-wrap--compact]="variant === 'compact'">
      <header class="pr-hero" *ngIf="variant === 'full'">
        <p class="pr-kicker">Premium for interview sprints</p>
        <h1>Prepare faster with deeper frontend interview reps</h1>
        <p class="muted" *ngIf="!isOfferV2(); else offerV2HeroCopy">
          Premium unlocks the full coding and system-design depth behind the free workflow:
          deeper prompts, guided solutions where available, track/company depth, and saved progress while you prep.
        </p>
        <ng-template #offerV2HeroCopy>
          <p class="muted">
            Practice across {{ totalQuestionCount }} questions and 141 Premium prompts with runnable workspaces,
            behavioral checks, guided solutions, front-end system-design walkthroughs, and official-source checks.
          </p>
        </ng-template>
      </header>

      <div class="plan-unlock-strip">
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
            {{ displayPrice(plan.id) }}<span>{{ priceSuffix(plan.id) }}</span>
          </div>
          <p class="billing-note">{{ billingNote(plan.id) }}</p>
          <p class="plan-savings" *ngIf="savingsLabel(plan.id)">{{ savingsLabel(plan.id) }}</p>
          <ul class="features">
            <li *ngFor="let feat of plan.features">{{ feat }}</li>
          </ul>
          <button
            class="btn"
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
          <a [routerLink]="['/legal/refund']">Limited-use refund requests are reviewed under the Refund Policy</a>
        </span>
      </div>

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
          <p class="lifetime-offer__price">{{ displayPrice('lifetime') }} <span>{{ priceSuffix('lifetime') }}</span></p>
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
            from one workspace. Open the free React Counter challenge to try it yourself.
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

      <section class="unlock-preview" *ngIf="variant === 'full'" #unlockPreviewRef>
        <div class="unlock-preview__head">
          <p class="eyebrow">Premium unlock preview</p>
          <h2>See what Premium adds after the free workflow</h2>
        </div>
        <div class="unlock-preview__grid">
          <article class="unlock-preview__card" *ngFor="let item of unlockPreviewCards">
            <div class="unlock-preview__icon" aria-hidden="true">
              <i [class]="item.icon"></i>
            </div>
            <div class="unlock-preview__body">
              <p class="unlock-preview__eyebrow">{{ item.label }}</p>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
              <ul>
                <li *ngFor="let bullet of item.bullets">{{ bullet }}</li>
              </ul>
            </div>
            <a
              class="unlock-preview__link"
              [routerLink]="item.route"
              (click)="trackUnlockPreviewClick(item)">
              View preview
            </a>
          </article>
        </div>
      </section>

      <section class="value-anchor" *ngIf="variant === 'full'" #valueAnchorRef>
        <div class="value-anchor__head">
          <p class="eyebrow">Why upgrade now?</p>
          <h2>Use Free Explorer to sample. Use Premium when the interview clock is running.</h2>
          <p class="muted">
            If you are just browsing, stay free. If you have interviews coming up,
            Premium reduces hunting and setup time so more of your session becomes practice.
          </p>
        </div>
        <div class="value-anchor__grid">
          <article *ngFor="let item of valueAnchors">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </section>

      <ng-container *ngIf="variant === 'full'">
        <ng-container [ngTemplateOutlet]="riskReversalBlock"></ng-container>
      </ng-container>

      <section class="free-explorer" *ngIf="variant === 'full'">
        <div class="free-explorer__head">
          <p class="eyebrow">Free Explorer</p>
          <h2>Not ready to pay? Run a free challenge first</h2>
        </div>
        <ul class="free-explorer__list">
          <li>Open a free challenge and run tests or preview before upgrading.</li>
          <li>Browse the free library and premium previews to judge fit.</li>
          <li>No card required until you choose a Premium plan.</li>
        </ul>
        <div class="free-explorer__actions">
          <a
            class="link-btn link-btn--primary"
            [routerLink]="['/react', 'coding', 'react-counter']"
            [queryParams]="{ src: 'pricing_free_explorer' }"
            (click)="trackFreePathClick('free_challenge', '/react/coding/react-counter')">
            Try free challenge
          </a>
          <a
            class="link-btn"
            [routerLink]="['/coding']"
            (click)="trackFreePathClick('browse_library', '/coding')">
            Browse free library
          </a>
        </div>
      </section>

      <section class="plan-compare" *ngIf="variant === 'full'">
        <h2 class="pr-section-title">Free vs Premium</h2>
        <p class="muted pr-section-subtitle">Use Premium for focused depth; keep Free Explorer for sampling and warm-ups.</p>
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
              <td>{{ row.freeValue }}</td>
              <td>{{ row.premiumValue }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="pr-features" *ngIf="variant === 'full'">
        <h2 class="pr-section-title">What you get in FrontendAtlas</h2>
        <p class="muted pr-section-subtitle">
          Practice with the same constraints you’ll face in real interviews: UI, state, performance, and review.
        </p>


        <div class="feature-grid">
          <article class="feature" *ngFor="let f of featureCards">
            <div class="feature-ico" aria-hidden="true">
              <i [class]="f.icon"></i>
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </article>
        </div>
      </section>

      <div class="pr-proof-grid" *ngIf="variant === 'full'">
        <div class="proof-block">
          <p class="eyebrow">Product proof</p>
          <h3>What you actually practice</h3>
          <ul class="proof-list">
            <li><i class="pi pi-book proof-icon" aria-hidden="true"></i> Large question library with UI-first coding and practical scenarios</li>
            <li><i class="pi pi-desktop proof-icon" aria-hidden="true"></i> UI-focused coding with real prompts and starter files</li>
            <li><i class="fa-solid fa-flask proof-icon" aria-hidden="true"></i> Runnable workspaces with live preview and behavioral checks across supported tasks</li>
            <li><i class="pi pi-shield proof-icon" aria-hidden="true"></i> Practical constraints: accessibility, performance, state</li>
            <li><i class="pi pi-sitemap proof-icon" aria-hidden="true"></i> System design reasoning for front-end surfaces</li>
          </ul>
        </div>
        <div class="proof-block">
          <p class="eyebrow">Roadmap</p>
          <h3>Where we’re heading</h3>
          <ul class="proof-list roadmap">
            <li><span class="status available">Available</span> Current coding + trivia library</li>
            <li><span class="status available">Available</span> Progress tracking for signed-in accounts</li>
            <li><span class="status in-progress">In progress</span> More front-end system design walkthroughs</li>
            <li><span class="status in-progress">In progress</span> Deeper stats and streak views</li>
            <li><span class="status planned">Planned</span> Adaptive practice sets and reminders</li>
            <li><span class="status planned">Planned</span> Team-ready sharing and review flows</li>
          </ul>
        </div>
      </div>

      <section class="pr-faq" *ngIf="variant === 'full'">
        <app-faq-section
          title="FAQ"
          [groups]="faqGroups"
          [singleOpen]="false">
        </app-faq-section>
      </section>

      <ng-template #riskReversalBlock>
        <section class="risk-reversal">
          <div class="risk-reversal__head">
            <p class="eyebrow">Risk reversal</p>
            <h3>Try the free workflow before you decide</h3>
            <p class="muted risk-reversal__copy">
              Refund requests are reviewed case by case within applicable legal windows and generally require limited
              Premium usage. Renewal charges and unused subscription time are generally non-refundable; mandatory
              consumer rights still apply.
            </p>
          </div>
          <div class="risk-reversal__links">
            <a class="risk-link" [routerLink]="['/legal/refund']">
              <i class="pi pi-replay" aria-hidden="true"></i>
              <span>Refund policy</span>
            </a>
            <a class="risk-link" [routerLink]="['/legal/editorial-policy']">
              <i class="pi pi-file-edit" aria-hidden="true"></i>
              <span>Editorial policy</span>
            </a>
            <a class="risk-link" [routerLink]="['/changelog']" (click)="trackChangelogClick('risk_reversal')">
              <i class="pi pi-history" aria-hidden="true"></i>
              <span>Public changelog</span>
            </a>
          </div>
        </section>
      </ng-template>

      <section class="weekly-changelog" *ngIf="variant === 'full'">
        <div class="weekly-changelog__head">
          <p class="eyebrow">Build in public</p>
          <h3>Recent product updates</h3>
          <p class="muted">Recent shipped updates so you can evaluate momentum before buying.</p>
        </div>
        <ul class="weekly-changelog__list">
          <li *ngFor="let entry of changelogPreview">
            <a
              class="weekly-changelog__item"
              [routerLink]="['/changelog']"
              [fragment]="entry.id"
              (click)="trackChangelogClick('pricing_changelog_preview_' + entry.id)"
            >
              <div class="weekly-changelog__row">
                <strong>{{ entry.title }}</strong>
                <span>{{ formatWeek(entry.weekOf) }}</span>
              </div>
              <div class="weekly-changelog__meta">
                <span>{{ entry.category }}</span>
                <span>{{ entry.area }}</span>
              </div>
              <p>{{ entry.summary }}</p>
              <ul class="weekly-changelog__bullets">
                <li *ngFor="let item of previewChanges(entry)">{{ item }}</li>
              </ul>
            </a>
          </li>
        </ul>
        <a
          class="weekly-changelog__link"
          [routerLink]="['/changelog']"
          [queryParams]="{ src: analyticsSource + '_weekly_changelog' }"
          (click)="trackChangelogClick('pricing_changelog_block')">
          View full changelog
        </a>
      </section>
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
  `,
})
export class PricingPlansSectionComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private static readonly SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;
  private static readonly CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

  @Input() variant: PricingVariant = 'full';
  @Input() paymentsEnabled = false;
  @Input() paymentsConfigReady = true;
  @Input() analyticsReady = true;
  @Input() ctaMode: PricingCtaMode = 'navigatePricing';
  @Input() ctaLabel?: string;
  @Input() analyticsSource = 'pricing';
  @Input() analyticsSurface = 'pricing_page';
  @Input() riskReversalPlacement: 'top' | 'after_plans' = 'after_plans';
  @Input() checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  @Input() planDetails: PricingPlanDetails | null = null;
  @Input() offerVersion = PRICING_BASELINE_OFFER_VERSION;
  @Input() checkoutSurface: CheckoutSurface = 'hosted_new_tab';
  @Input() campaignId?: string | null;

  @ViewChild('planCardsRef') private planCardsRef?: ElementRef<HTMLElement>;
  @ViewChild('unlockPreviewRef') private unlockPreviewRef?: ElementRef<HTMLElement>;
  @ViewChild('valueAnchorRef') private valueAnchorRef?: ElementRef<HTMLElement>;

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
  private readonly observedTargets = new WeakMap<Element, 'plan_cards' | 'unlock_preview' | 'value_anchor'>();
  private planCardsSeenTracked = false;
  private unlockPreviewSeenTracked = false;
  private valueAnchorSeenTracked = false;
  changelogPreview = PUBLIC_CHANGELOG_ENTRIES.slice(0, 3);
  recommendedPlan = RECOMMENDED_PRICING_PLAN;
  readonly totalQuestionCount = SHOWCASE_STATS.totalQuestions;

  proofChips = ['140+ premium prompts', 'coding + system design', 'guided solution depth'];

  unlockPreviewCards: Array<{
    previewType: string;
    label: string;
    title: string;
    desc: string;
    bullets: string[];
    icon: string;
    route: any[];
    destination: string;
  }> = [
      {
        previewType: 'coding_depth',
        label: 'Coding depth',
        title: 'Contact Form (Component + HTTP)',
        desc: 'Practice a realistic React form with validation and async submit behavior.',
        bullets: ['Controlled inputs and submit states', 'Preview the locked prompt before buying'],
        icon: 'fa-solid fa-code',
        route: ['/', 'react', 'coding', 'react-contact-form-starter'],
        destination: '/react/coding/react-contact-form-starter',
      },
      {
        previewType: 'system_design_depth',
        label: 'System design depth',
        title: 'Multi-step Form with Autosave',
        desc: 'Work through UI architecture, persistence, validation, and recovery tradeoffs.',
        bullets: ['Front-end system design scenario', 'Structured constraints and review angles'],
        icon: 'fa-solid fa-sitemap',
        route: ['/', 'system-design', 'multi-step-form-autosave'],
        destination: '/system-design/multi-step-form-autosave',
      },
      {
        previewType: 'solution_depth',
        label: 'Solution depth',
        title: 'Throttle Function',
        desc: 'Compare the included Throttle Function solution against edge cases and implementation tradeoffs.',
        bullets: ['Implementation pitfalls and edge cases', 'Guided implementation review'],
        icon: 'fa-solid fa-list-check',
        route: ['/', 'javascript', 'coding', 'js-throttle'],
        destination: '/javascript/coding/js-throttle',
      },
    ];

  valueAnchors = [
    {
      title: 'More targeted reps',
      desc: 'Premium unlocks deeper coding and system-design prompts when you need more than warm-ups.',
    },
    {
      title: 'Less setup time',
      desc: 'Use the browser workflow to code, preview, test, and review instead of assembling practice from scattered tabs.',
    },
    {
      title: 'Keep sprint momentum',
      desc: 'Save progress, return to the next prompt, and keep your prep loop moving across sessions.',
    },
  ];

  comparisonRows: Array<{ label: string; freeValue: string; premiumValue: string }> = [
    {
      label: 'Practice depth',
      freeValue: 'Selected free coding, trivia, and system design prompts',
      premiumValue: 'Full premium prompt sets across coding and system design',
    },
    {
      label: 'Interview sprint guidance',
      freeValue: 'Public previews and warm-up paths',
      premiumValue: '141 Premium prompts with guided solutions and track/company depth',
    },
    {
      label: 'Continuity',
      freeValue: 'Local drafts and free browsing',
      premiumValue: 'Account-backed progress while using the full Premium library',
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

  featureCards = [
    { icon: 'fa-solid fa-book', title: 'Large question library', desc: 'UI-first coding and practical front-end scenarios across the current library.' },
    { icon: 'fa-solid fa-diagram-project', title: 'Real workflow', desc: 'Code + preview + tests + review signals — designed to feel like real interviews.' },
    { icon: 'fa-solid fa-file-code', title: 'Starter files included', desc: 'You start from realistic scaffolds, not blank files.' },
    { icon: 'fa-solid fa-chart-line', title: 'Progress tracking', desc: 'Saved work and tracking for signed-in accounts.' },
    { icon: 'fa-solid fa-sitemap', title: 'System design for UI', desc: 'Front-end system design walkthroughs focused on UI architecture and tradeoffs.' },
    { icon: 'fa-solid fa-rotate', title: 'Shipped updates', desc: 'The public changelog documents released content and product improvements.' },
  ];

  faqGroups = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        {
          id: 'what-is-frontendatlas',
          q: 'What is FrontendAtlas?',
          a: `FrontendAtlas is built to make you <strong>interview-ready faster</strong> by turning prep into <strong>repeatable practice loops</strong>.<br><br>
What you do here:<br>
- Solve realistic coding tasks with starter code + fast feedback (preview/tests)<br>
- Learn core concepts in a way you can actually explain in interviews<br>
- Practice front-end system design by making tradeoffs, not memorizing buzzwords<br><br>
If you want “less reading, more doing” — this is the workflow.`,
        },
        {
          id: 'install-anything',
          q: 'Do I need to install anything, or is it all in the browser?',
          a: `It’s all in the browser — <strong>no setup tax</strong>.<br><br>
Open the app → pick a task → code immediately.<br>
No local project, no dependency hell, no “works on my machine”.<br><br>
Desktop/laptop is recommended so you can use the editor/preview layout efficiently.`,
        },
        {
          id: 'supported-browsers-devices',
          q: 'Which browsers/devices are supported?',
          a: `Best experience on modern desktop browsers:<br>
- Chrome / Edge (top pick for speed + compatibility)<br>
- Safari<br>
- Firefox<br><br>
Mobile/tablet works for reading and browsing, but serious practice is designed for desktop (editor + preview + checks).`,
        },
      ],
    },
    {
      id: 'content-learning',
      title: 'Content & Learning',
      items: [
        {
          id: 'exercise-types',
          q: 'What kinds of exercises are included (coding tasks vs concepts)?',
          a: `You’ll practice the three things interviews actually test:<br><br>
<strong>1) Coding tasks</strong><br>
Build/modify real UI and logic with starter code, then validate with preview/tests.<br><br>
<strong>2) Concept questions</strong><br>
Short prompts that force clean mental models (the kind you can explain under pressure).<br><br>
<strong>3) Front-end system design</strong><br>
Architecture prompts focused on constraints + tradeoffs (how seniors think).`,
        },
        {
          id: 'tech-coverage',
          q: 'Which technologies are covered (JS/TS, HTML/CSS, React/Angular/Vue)?',
          a: `Coverage is designed to match real job requirements:<br>
- JavaScript / TypeScript fundamentals (async, closures, DOM, performance, etc.)<br>
- HTML / CSS (layout, responsive UI, practical accessibility basics)<br>
- React / Angular / Vue (component patterns, state, rendering, performance)<br>
- Front-End System Design track (architecture and tradeoffs)<br><br>
So you can prep for “framework interview” <em>and</em> “real-world frontend” at the same time.`,
        },
        {
          id: 'difficulty-and-tags',
          q: 'How are difficulty levels and tags organized?',
          a: `Everything is structured to reduce decision fatigue and keep you consistent.<br><br>
You can filter/sort by:<br>
- Technology (JS/TS, HTML/CSS, React, Angular, Vue, System Design)<br>
- Difficulty (ramp up without getting stuck or bored)<br>
- Tags (the exact skill being tested: event delegation, memoization, layout, state, etc.)<br><br>
This makes it easy to build a weekly plan: pick a focus → grind a tight set → level up.`,
        },
        {
          id: 'solutions-and-explanations',
          q: 'Do exercises include solutions and explanations?',
          a: `Yes — supported question sets include solutions and detailed explanations.<br><br>
Included solutions focus on what matters in interviews:<br>
- a clean baseline implementation<br>
- edge cases + common mistakes<br>
- tradeoffs between approaches (when it’s not just “one right answer”)<br><br>
Some prompts are intentionally open-ended to mirror real interview discussion.`,
        },
      ],
    },
    {
      id: 'coding-experience',
      title: 'Coding Experience',
      items: [
        {
          id: 'live-preview',
          q: 'Do tasks have a live preview (rendered output) while I code?',
          a: `Yes — many tasks have live preview so you can iterate fast and see what you’re building immediately.<br><br>
This is ideal for HTML/CSS and UI work where “correct” is visual.<br><br>
If preview isn’t the right signal (pure logic), the task uses checks/tests instead — so you still get clear pass/fail feedback.`,
        },
        {
          id: 'run-tests',
          q: 'Can I run tests / validate my solution inside the app?',
          a: `Yes — tasks that can be validated deterministically include checks/tests (common for JS/TS).<br><br>
This helps you practice like a professional workflow:<br>
write → run checks → fix edge cases → ship.<br><br>
HTML/CSS tasks typically rely on live preview first, because visuals are the primary correctness signal.`,
        },
        {
          id: 'save-progress',
          q: 'Does FrontendAtlas save my code and progress between sessions?',
          a: `Yes — your work is saved locally in your browser so you don’t lose progress mid-practice.<br><br>
Why this matters:<br>
- You can do short sessions (even 15–30 min) and continue later<br>
- Your drafts stay private on your device by default<br><br>
You can also reset any task back to the starter whenever you want to re-practice from scratch.`,
        },
      ],
    },
    {
      id: 'plans-billing',
      title: 'Plans & Billing',
      items: [
        {
          id: 'premium-includes',
          q: 'What’s included in Premium?',
          a: `Premium is for people who want the fastest path to results.<br><br>
Typically, it unlocks:<br>
- Premium question sets and deeper practice content<br>
- Guided solutions and explanations across supported question sets<br>
- Ongoing content updates while your plan is active<br><br>
If you’re practicing consistently, Premium mainly saves you time: less hunting, more reps.`,
        },
        {
          id: 'cancel-anytime',
          q: 'Can I cancel a subscription anytime?',
          a: `Yes.<br><br>
Cancel anytime and you keep access until the end of your current billing period.<br>
No “gotchas” — you’re just stopping the next renewal.`,
        },
        {
          id: 'refunds',
          q: 'Do you offer refunds?',
          a: `We handle refunds fairly and consistently, based on the rules in our Refund Policy.<br><br>
Eligibility depends on factors like purchase type and usage.<br><br>
For the exact terms, see <code>/legal/refund</code>.<br>
If you think you were charged incorrectly or something isn’t working, email <code>support@frontendatlas.com</code> and we’ll help.`,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        {
          id: 'report-bug',
          q: 'How do I report a bug or get help?',
          a: `Email <code>support@frontendatlas.com</code> with:<br>
- steps to reproduce (what you clicked / expected / got)<br>
- browser + OS version<br>
- the page URL or question id<br><br>
A screenshot or short screen recording speeds up fixes a lot.`,
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
  ];

  isOfferV2(): boolean {
    return this.normalizedOfferVersion() === PRICING_V2_OFFER_VERSION;
  }

  activeProofChips(): string[] {
    if (!this.isOfferV2()) return this.proofChips;
    return [
      `${this.totalQuestionCount} questions`,
      '141 Premium prompts',
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
    return plan.id === RECOMMENDED_PRICING_PLAN
      ? 'Recommended — 4–12 week interview sprint'
      : '';
  }

  summaryFor(plan: PricingPlan): string {
    if (!this.isOfferV2()) return plan.summary;
    const summaries: Record<PlanId, string> = {
      monthly: 'A flexible month of focused practice',
      quarterly: 'Built for a complete interview sprint',
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
    const months = detail.interval === 'year'
      ? 12 * Math.max(1, Number(detail.intervalCount) || 1)
      : Math.max(1, Number(detail.intervalCount) || 1);
    const perMonth = this.formatMoney(detail.amountCents / months, detail.currency, true);
    if (detail.interval === 'year' && detail.intervalCount === 1) {
      return `${perMonth}/mo billed yearly`;
    }
    return `${perMonth}/mo billed every ${months} months`;
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

  previewChanges(entry: { changes: string[] }): string[] {
    return Array.isArray(entry.changes) ? entry.changes.slice(0, 2) : [];
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
    this.syncPrimaryPlanOrder();
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
    const targets: Array<{ element?: Element; key: 'plan_cards' | 'unlock_preview' | 'value_anchor' }> = [
      { element: this.planCardsRef?.nativeElement, key: 'plan_cards' },
      { element: this.unlockPreviewRef?.nativeElement, key: 'unlock_preview' },
      { element: this.valueAnchorRef?.nativeElement, key: 'value_anchor' },
    ];
    const visibleTargets = targets.filter((target): target is { element: Element; key: 'plan_cards' | 'unlock_preview' | 'value_anchor' } => !!target.element);
    if (!visibleTargets.length) return;

    if (typeof window.IntersectionObserver !== 'function') {
      for (const target of visibleTargets) {
        if (target.key === 'plan_cards') this.trackPlanCardsSeen();
        if (target.key === 'unlock_preview') this.trackUnlockPreviewSeen();
        if (target.key === 'value_anchor') this.trackValueAnchorSeen();
      }
      return;
    }

    this.visibilityObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const key = this.observedTargets.get(entry.target);
        if (key === 'plan_cards') {
          this.trackPlanCardsSeen();
          this.visibilityObserver?.unobserve(entry.target);
        }
        if (key === 'unlock_preview') {
          this.trackUnlockPreviewSeen();
          this.visibilityObserver?.unobserve(entry.target);
        }
        if (key === 'value_anchor') {
          this.trackValueAnchorSeen();
          this.visibilityObserver?.unobserve(entry.target);
        }
      }
    }, { threshold: 0.25 });

    for (const target of visibleTargets) {
      this.observedTargets.set(target.element, target.key);
      this.visibilityObserver.observe(target.element);
    }
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

  private trackUnlockPreviewSeen(): void {
    if (this.unlockPreviewSeenTracked) return;
    this.unlockPreviewSeenTracked = true;
    this.analytics.track('pricing_unlock_preview_seen', {
      ...this.pricingAnalyticsBase(),
      card_count: this.unlockPreviewCards.length,
    });
  }

  private trackValueAnchorSeen(): void {
    if (this.valueAnchorSeenTracked) return;
    this.valueAnchorSeenTracked = true;
    this.analytics.track('pricing_value_anchor_seen', {
      ...this.pricingAnalyticsBase(),
      anchor: 'why_upgrade_now',
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
    return this.configuredPlanDetail(planId);
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
      risk_reversal_variant: this.riskReversalPlacement,
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
    const detail = this.configuredPlanDetail(planId);
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
