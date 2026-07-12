import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BillingCheckoutService } from '../../../../core/services/billing-checkout.service';
import { getCheckoutLaunchNotice, getManageSubscriptionErrorMessage } from '../../../../core/utils/billing-ux.util';
import { openExternalWindow } from '../../../../core/utils/external-window.util';
import { PlanId } from '../../../../core/utils/payments-provider.util';
import { isProActive } from '../../../../core/utils/entitlements.util';
import { LoginRequiredDialogComponent } from '../../../../shared/components/login-required-dialog/login-required-dialog.component';
import { FaqSectionComponent } from '../../../../shared/faq-section/faq-section.component';
import { PUBLIC_CHANGELOG_ENTRIES } from '../../../../core/content/public-changelog';

type PricingVariant = 'full' | 'compact';
type CtaMode = 'emit' | 'navigatePricing';

export const PRICING_PAGE_LAYOUT = 'interview_sprint_v1';
export const RECOMMENDED_PRICING_PLAN: PlanId = 'quarterly';

@Component({
  standalone: true,
  selector: 'app-pricing-plans-section',
  imports: [CommonModule, RouterModule, FaqSectionComponent, LoginRequiredDialogComponent],
  styleUrls: ['./pricing-plans-section.component.css'],
  template: `
    <section class="pr-wrap" [class.pr-wrap--compact]="variant === 'compact'">
      <header class="pr-hero" *ngIf="variant === 'full'">
        <p class="pr-kicker">Premium for interview sprints</p>
        <h1>Prepare faster with deeper frontend interview reps</h1>
        <p class="muted">
          Premium unlocks the full coding and system-design depth behind the free workflow:
          deeper prompts, guided solutions where available, track/company depth, and saved progress while you prep.
        </p>
      </header>

      <div class="plan-unlock-strip">
        <div class="plan-unlock-strip__copy">
          <p>Same Premium library. Choose the timeline that fits your prep.</p>
        </div>
        <div class="pr-proof-chips" aria-label="Premium highlights">
          <span *ngFor="let chip of proofChips">{{ chip }}</span>
        </div>
      </div>

      <div class="pr-grid" #planCardsRef>
        <article class="pr-card" *ngFor="let plan of plans" [class.pr-rec]="plan.id === recommendedPlan">
          <div class="rec-badge" *ngIf="plan.badge" [class.rec-badge--muted]="plan.id !== recommendedPlan">{{ plan.badge }}</div>
          <h3 class="title">{{ plan.title }}</h3>
          <p class="plan-summary">{{ plan.summary }}</p>
          <div class="price">
            {{ plan.price }}<span>{{ plan.priceSuffix }}</span>
          </div>
          <p class="billing-note">{{ plan.billing }}</p>
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
          <div class="plan-note" *ngIf="plan.note">
            <span class="plan-note__label">Note</span>
            <span class="plan-note__text">{{ plan.note }}</span>
          </div>
        </article>
      </div>

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
            <li><i class="fa-solid fa-flask proof-icon" aria-hidden="true"></i> Live preview + test runner where available</li>
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

      <p class="tiny muted pr-footnote" *ngIf="variant === 'full' && paymentsConfigReady && !paymentsEnabled">
        Payments are not enabled in this build.
      </p>
      <p class="tiny muted pr-footnote" *ngIf="checkoutNotice" data-testid="checkout-notice">
        {{ checkoutNotice }}
      </p>

      <ng-template #riskReversalBlock>
        <section class="risk-reversal">
          <div class="risk-reversal__head">
            <p class="eyebrow">Risk reversal</p>
            <h3>Pay only after you’ve used the free workflow</h3>
            <p class="muted risk-reversal__copy">Clear billing terms and a public refund policy. No hidden conditions at checkout.</p>
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
      [title]="loginRequiredTitle"
      [body]="loginRequiredBody"
      [ctaLabel]="loginRequiredCta"
      [redirectTo]="loginRedirectTo">
    </app-login-required-dialog>
  `,
})
export class PricingPlansSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly CHECKOUT_PLAN_KEY = 'fa:checkout:last_plan_id';
  private static readonly CHECKOUT_SOURCE_KEY = 'fa:checkout:last_source';
  private static readonly SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;

  @Input() variant: PricingVariant = 'full';
  @Input() paymentsEnabled = false;
  @Input() paymentsConfigReady = true;
  @Input() ctaMode: CtaMode = 'navigatePricing';
  @Input() ctaLabel?: string;
  @Input() analyticsSource = 'pricing';
  @Input() riskReversalPlacement: 'top' | 'after_plans' = 'after_plans';
  @Input() checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  @Output() ctaClick = new EventEmitter<{ planId: PlanId }>();

  @ViewChild('planCardsRef') private planCardsRef?: ElementRef<HTMLElement>;
  @ViewChild('unlockPreviewRef') private unlockPreviewRef?: ElementRef<HTMLElement>;
  @ViewChild('valueAnchorRef') private valueAnchorRef?: ElementRef<HTMLElement>;

  private checkoutLoading: PlanId | null = null;
  loginRequiredOpen = false;
  loginRedirectTo = '/pricing';
  loginRequiredTitle = 'Sign in to purchase';
  loginRequiredBody = 'To buy a subscription, please sign in or create a free account.';
  loginRequiredCta = 'Sign in / create account';
  checkoutNotice: string | null = null;
  private checkoutNoticeTimer?: number;
  private visibilityObserver?: IntersectionObserver;
  private readonly observedTargets = new WeakMap<Element, 'plan_cards' | 'unlock_preview' | 'value_anchor'>();
  private planCardsSeenTracked = false;
  private unlockPreviewSeenTracked = false;
  private valueAnchorSeenTracked = false;
  changelogPreview = PUBLIC_CHANGELOG_ENTRIES.slice(0, 3);
  recommendedPlan = RECOMMENDED_PRICING_PLAN;

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
        desc: 'Use guided solution coverage where available to compare edge cases and tradeoffs.',
        bullets: ['Implementation pitfalls and edge cases', 'Solution depth where available'],
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
      premiumValue: 'Track/company depth and guided solution coverage where available',
    },
    {
      label: 'Continuity',
      freeValue: 'Local drafts and free browsing',
      premiumValue: 'Account-backed progress while using the full Premium library',
    },
  ];

  plans: Array<{
    id: PlanId;
    title: string;
    price: string;
    priceSuffix: string;
    summary: string;
    billing: string;
    features: string[];
    badge: string;
    ctaLabel: string;
    note?: string;
  }> = [
      {
        id: 'monthly',
        title: 'Monthly',
        price: '$12',
        priceSuffix: ' / month',
        summary: 'Best for trying Premium',
        billing: 'Billed monthly',
        features: ['Full Premium content', 'Cancel before the next renewal'],
        badge: '',
        ctaLabel: 'Start monthly',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
      {
        id: 'quarterly',
        title: 'Quarterly',
        price: '$29',
        priceSuffix: ' / 3 months',
        summary: 'Best for 4-12 week interview prep',
        billing: '$9.67/mo billed quarterly',
        features: ['Full Premium content', 'Fits a focused interview sprint'],
        badge: 'Recommended sprint',
        ctaLabel: 'Start quarterly',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
      {
        id: 'annual',
        title: 'Annual',
        price: '$79',
        priceSuffix: ' / year',
        summary: 'Best value if you’ll keep practicing',
        billing: '$6.58/mo billed yearly',
        features: ['Full Premium content', 'Best value for ongoing prep'],
        badge: 'Best value',
        ctaLabel: 'Start annual',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
      {
        id: 'lifetime',
        title: 'Lifetime',
        price: '$199',
        priceSuffix: ' once',
        summary: 'For long-term reuse',
        billing: 'One-time payment',
        features: ['Full Premium content', 'Premium access forever'],
        badge: 'Lifetime access',
        ctaLabel: 'Get lifetime access',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
    ];

  featureCards = [
    { icon: 'fa-solid fa-book', title: 'Large question library', desc: 'UI-first coding and practical front-end scenarios — growing over time.' },
    { icon: 'fa-solid fa-diagram-project', title: 'Real workflow', desc: 'Code + preview + tests + review signals — designed to feel like real interviews.' },
    { icon: 'fa-solid fa-file-code', title: 'Starter files included', desc: 'You start from realistic scaffolds, not blank files.' },
    { icon: 'fa-solid fa-chart-line', title: 'Progress tracking', desc: 'Saved work and tracking for signed-in accounts.' },
    { icon: 'fa-solid fa-sitemap', title: 'System design for UI', desc: 'Front-end system design walkthroughs and prompts (expanding).' },
    { icon: 'fa-solid fa-rotate', title: 'Continuous updates', desc: 'New content and improvements shipped regularly.' },
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
          a: `Yes — many tasks include solutions and detailed explanations, and more are added over time.<br><br>
When available, solutions focus on what matters in interviews:<br>
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
- More guided solutions/explanations where available<br>
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

  ctaTextFor(plan: { ctaLabel: string }): string {
    if (isProActive(this.auth.user())) return 'Manage subscription';
    if (this.ctaLabel) return this.ctaLabel;
    return plan.ctaLabel;
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private billingCheckout: BillingCheckoutService,
    private analytics: AnalyticsService,
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
    if (typeof window !== 'undefined' && this.paymentsEnabled) {
      void this.billingCheckout.prefetch();
    }
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    this.observePricingVisibility();
  }

  ngOnDestroy(): void {
    if (this.checkoutNoticeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.checkoutNoticeTimer);
      this.checkoutNoticeTimer = undefined;
    }
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
  }

  isCheckoutAvailable(planId: PlanId): boolean {
    if (!this.paymentsEnabled) return false;
    if (!this.paymentsConfigReady) return true;
    return this.checkoutAvailability?.[planId] === true;
  }

  isCheckoutDisabled(planId: PlanId): boolean {
    if (this.paymentsConfigReady && !this.paymentsEnabled) return true;
    return this.paymentsEnabled && (!this.isCheckoutAvailable(planId) || this.isCheckoutLoading(planId));
  }

  isCheckoutLoading(planId: PlanId): boolean {
    return this.checkoutLoading === planId;
  }

  checkoutTooltip(planId: PlanId): string | null {
    if (this.isCheckoutLoading(planId)) return 'Loading checkout...';
    if (this.paymentsConfigReady && !this.paymentsEnabled) return 'Payments are not enabled in this build.';
    if (!this.paymentsEnabled || this.isCheckoutAvailable(planId)) return null;
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
    this.analytics.track('pricing_plan_cards_seen', {
      ...this.pricingAnalyticsBase(),
      plan_count: this.plans.length,
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

  private setCheckoutNotice(message: string) {
    this.checkoutNotice = message;
    if (this.checkoutNoticeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.checkoutNoticeTimer);
    }
    if (typeof window === 'undefined') return;
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

  private pricingAnalyticsBase(): Record<string, string> {
    return {
      src: this.normalizedSource(),
      variant: this.variant,
      page_layout: PRICING_PAGE_LAYOUT,
      recommended_plan: RECOMMENDED_PRICING_PLAN,
      risk_reversal_variant: this.riskReversalPlacement,
    };
  }

  private planAnalyticsMeta(planId: PlanId): { cta_label: string; plan_position: number } {
    const index = this.plans.findIndex((plan) => plan.id === planId);
    const plan = index >= 0 ? this.plans[index] : null;
    return {
      cta_label: plan ? this.ctaTextFor(plan) : this.ctaLabel || 'Upgrade',
      plan_position: index >= 0 ? index + 1 : -1,
    };
  }

  private trackPlanClick(planId: PlanId, method: string) {
    this.analytics.track('pricing_plan_cta_clicked', {
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      method,
      redirect_to_present: false,
      ...this.planAnalyticsMeta(planId),
    });
  }

  private trackCheckoutStarted(planId: PlanId, method: string, mode: string) {
    this.analytics.track('checkout_started', {
      plan_id: planId,
      ...this.pricingAnalyticsBase(),
      method,
      checkout_mode: mode,
    });
  }

  private persistCheckoutContext(planId: PlanId) {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(PricingPlansSectionComponent.CHECKOUT_PLAN_KEY, planId);
      sessionStorage.setItem(PricingPlansSectionComponent.CHECKOUT_SOURCE_KEY, this.normalizedSource());
    } catch { }
  }

  private clearCheckoutContext() {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(PricingPlansSectionComponent.CHECKOUT_PLAN_KEY);
      sessionStorage.removeItem(PricingPlansSectionComponent.CHECKOUT_SOURCE_KEY);
    } catch { }
  }

  async onCta(planId: PlanId) {
    const source = this.normalizedSource();
    if (isProActive(this.auth.user())) {
      this.trackPlanClick(planId, 'manage_subscription');
      this.openManageSubscription(planId);
      return;
    }
    if (this.paymentsConfigReady && !this.paymentsEnabled) {
      this.trackPlanClick(planId, 'checkout_unavailable');
      this.setCheckoutNotice('Payments are not enabled in this build.');
      return;
    }
    if (this.paymentsEnabled) {
      if (this.isCheckoutAvailable(planId)) {
        this.trackPlanClick(planId, 'checkout');
        this.checkoutLoading = planId;
        try {
          let user = this.auth.user();
          if (!user) {
            try {
              user = await firstValueFrom(this.auth.ensureMe());
            } catch {
              user = null;
            }
          }

          if (!user) {
            this.loginRedirectTo = this.router.url || '/pricing';
            this.loginRequiredOpen = true;
            return;
          }

          this.persistCheckoutContext(planId);
          const result = await this.billingCheckout.checkout(planId, {
            userId: user._id,
            email: user.email,
            username: user.username,
          });
          if (!result.ok) {
            this.clearCheckoutContext();
            if (result.reason === 'verification-required') {
              this.setCheckoutNotice('Verify your email in Profile → Account before starting checkout.');
            } else if (result.reason === 'invalid-url') {
              this.setCheckoutNotice('Checkout is misconfigured right now. Please contact support.');
            } else {
              this.setCheckoutNotice('Checkout is unavailable right now. Please try again in a moment.');
            }
            return;
          }
          this.trackCheckoutStarted(planId, result.provider, result.mode);
          const launchNotice = getCheckoutLaunchNotice(result.mode, result.reused);
          if (launchNotice) {
            this.setCheckoutNotice(launchNotice);
          }
        } finally {
          if (this.checkoutLoading === planId) {
            this.checkoutLoading = null;
          }
        }
        return;
      }
      this.trackPlanClick(planId, 'checkout_unavailable');
      this.setCheckoutNotice('Checkout is not configured for this plan yet. Please try again later.');
      return;
    }

    if (this.ctaMode === 'navigatePricing') {
      this.trackPlanClick(planId, 'navigate_pricing');
      this.router.navigate(['/pricing'], {
        queryParams: { src: source },
      }).catch(() => void 0);
      return;
    }

    this.trackPlanClick(planId, 'emit');
    this.ctaClick.emit({ planId });
  }

  private openManageSubscription(planId: PlanId) {
    if (this.checkoutLoading) return;
    this.checkoutNotice = null;
    this.checkoutLoading = planId;
    this.auth.getManageSubscriptionUrl().subscribe({
      next: ({ url }) => {
        this.checkoutLoading = null;
        if (!url) {
          this.setCheckoutNotice(
            'We could not open the billing portal automatically right now. Contact support@frontendatlas.com for help.'
          );
          return;
        }
        const openResult = openExternalWindow(url);
        if (openResult === 'blocked') {
          this.setCheckoutNotice('Your browser blocked the billing portal. Allow popups and try again.');
          return;
        }
      },
      error: (err) => {
        this.checkoutLoading = null;
        this.setCheckoutNotice(getManageSubscriptionErrorMessage(err));
      },
    });
  }
}
