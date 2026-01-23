import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { BillingCheckoutService } from '../../../../core/services/billing-checkout.service';
import { PlanId } from '../../../../core/utils/payments-provider.util';
import { LoginRequiredDialogComponent } from '../../../../shared/components/login-required-dialog/login-required-dialog.component';
import { FaqSectionComponent } from '../../../../shared/faq-section/faq-section.component';

type PricingVariant = 'full' | 'compact';
type CtaMode = 'emit' | 'navigatePricing';

@Component({
  standalone: true,
  selector: 'app-pricing-plans-section',
  imports: [CommonModule, FaqSectionComponent, LoginRequiredDialogComponent],
  styleUrls: ['./pricing-plans-section.component.css'],
  template: `
    <section class="pr-wrap">
      <header class="pr-hero" *ngIf="variant === 'full'">
        <p class="pr-kicker">Pricing</p>
        <h1>Practice frontend the way interviews actually work</h1>
        <p class="muted">One place to code, preview, test, and review — with continuous updates.</p>
        <p class="pr-early">Early access pricing — prices may increase as the platform grows.</p>
      </header>

      <div class="included-box">
        <h4>Included in all plans</h4>
        <ul>
          <li>Access to coding + UI-first question sets</li>
          <li>Live preview workflow (where available)</li>
          <li>Progress tracking and saved work</li>
          <li>Core library updates</li>
        </ul>
      </div>

      <div class="pr-grid">
        <article class="pr-card" *ngFor="let plan of plans" [class.pr-rec]="plan.badge">
          <div class="rec-badge" *ngIf="plan.badge">{{ plan.badge }}</div>
          <h3 class="title">{{ plan.title }}</h3>
          <div class="price">
            {{ plan.price }}<span>{{ plan.priceSuffix }}</span>
          </div>
          <ul class="features">
            <li *ngFor="let feat of plan.features">{{ feat }}</li>
          </ul>
          <button
            class="btn"
            type="button"
            (click)="onCta(plan.id)"
            [disabled]="paymentsEnabled && (!isCheckoutAvailable(plan.id) || isCheckoutLoading(plan.id))"
            [attr.aria-disabled]="paymentsEnabled && (!isCheckoutAvailable(plan.id) || isCheckoutLoading(plan.id)) ? 'true' : null"
            [attr.title]="checkoutTooltip(plan.id)"
            [attr.data-testid]="'pricing-cta-' + plan.id">
            {{ ctaText }}
          </button>
          <div class="plan-note" *ngIf="plan.note">
            <span class="plan-note__label">Note</span>
            <span class="plan-note__text">{{ plan.note }}</span>
          </div>
        </article>
      </div>

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
            <h4 class="feature-title">{{ f.title }}</h4>
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

      <p class="tiny muted pr-footnote" *ngIf="variant === 'full' && !paymentsEnabled">
        Payments are not enabled in this build.
      </p>
      <p class="tiny muted pr-footnote" *ngIf="checkoutNotice" data-testid="checkout-notice">
        {{ checkoutNotice }}
      </p>
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
export class PricingPlansSectionComponent implements OnInit, OnDestroy {
  @Input() variant: PricingVariant = 'full';
  @Input() paymentsEnabled = false;
  @Input() ctaMode: CtaMode = 'navigatePricing';
  @Input() ctaLabel?: string;
  @Input() checkoutUrls: Partial<Record<PlanId, string>> | null = null;
  @Output() ctaClick = new EventEmitter<{ planId: PlanId }>();

  private checkoutLoading: PlanId | null = null;
  loginRequiredOpen = false;
  loginRedirectTo = '/pricing';
  loginRequiredTitle = 'Sign in to purchase';
  loginRequiredBody = 'To buy a subscription, please sign in or create a free account.';
  loginRequiredCta = 'Sign in / create account';
  checkoutNotice: string | null = null;
  private checkoutNoticeTimer?: number;

  plans: Array<{
    id: PlanId;
    title: string;
    price: string;
    priceSuffix: string;
    features: string[];
    badge: string;
    note?: string;
  }> = [
      {
        id: 'monthly',
        title: 'Monthly',
        price: '$12',
        priceSuffix: '',
        features: ['Updates while active'],
        badge: '',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
      {
        id: 'quarterly',
        title: 'Quarterly',
        price: '$29',
        priceSuffix: '',
        features: ['Updates while active'],
        badge: '',
        note: 'Final price, currency, and taxes are shown at checkout.',
      },
      {
        id: 'annual',
        title: 'Annual',
        price: '$79',
        priceSuffix: '',
        features: ['Best value for active prep', 'More front-end system design scenarios (planned)'],
        badge: 'Best for active prep',
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

  get ctaText(): string {
    if (this.ctaLabel) return this.ctaLabel;
    return this.paymentsEnabled ? 'Upgrade' : 'Upgrade';
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private billingCheckout: BillingCheckoutService
  ) { }

  ngOnInit(): void {
    if (this.paymentsEnabled) {
      this.billingCheckout.prefetch();
    }
  }

  ngOnDestroy(): void {
    if (this.checkoutNoticeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.checkoutNoticeTimer);
      this.checkoutNoticeTimer = undefined;
    }
  }

  private resolveCheckoutUrl(planId: PlanId): string | null {
    const url = this.checkoutUrls?.[planId] || '';
    return url ? url : null;
  }

  isCheckoutAvailable(planId: PlanId): boolean {
    return !!this.resolveCheckoutUrl(planId);
  }

  isCheckoutLoading(planId: PlanId): boolean {
    return this.checkoutLoading === planId;
  }

  checkoutTooltip(planId: PlanId): string | null {
    if (this.isCheckoutLoading(planId)) return 'Loading checkout...';
    if (!this.paymentsEnabled || this.isCheckoutAvailable(planId)) return null;
    return 'Checkout is temporarily unavailable.';
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

  async onCta(planId: PlanId) {
    if (this.paymentsEnabled) {
      const checkoutUrl = this.resolveCheckoutUrl(planId);
      if (checkoutUrl) {
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

          const result = await this.billingCheckout.checkout(planId, {
            userId: user._id,
            email: user.email,
            username: user.username,
          });
          if (!result.ok) {
            if (result.reason === 'invalid-url') {
              this.setCheckoutNotice('Checkout is misconfigured right now. Please contact support.');
            } else {
              this.setCheckoutNotice('Checkout is unavailable right now. Please try again in a moment.');
            }
            return;
          }
          if (result.mode === 'new-tab') {
            this.setCheckoutNotice('Checkout opened in a new tab. If it did not open, allow popups and try again.');
          }
        } finally {
          if (this.checkoutLoading === planId) {
            this.checkoutLoading = null;
          }
        }
        return;
      }
      this.setCheckoutNotice('Checkout is not configured for this plan yet. Please try again later.');
      return;
    }

    if (this.ctaMode === 'navigatePricing') {
      this.router.navigateByUrl('/pricing').catch(() => void 0);
      return;
    }

    this.ctaClick.emit({ planId });
  }
}
