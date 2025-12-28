import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FaqSectionComponent } from '../../../../shared/faq-section/faq-section.component';

type PricingVariant = 'full' | 'compact';
type CtaMode = 'emit' | 'navigatePricing';

@Component({
  standalone: true,
  selector: 'app-pricing-plans-section',
  imports: [CommonModule, FaqSectionComponent],
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
          <div class="billing-note">{{ plan.billingNote }}</div>
          <ul class="features">
            <li *ngFor="let feat of plan.features">{{ feat }}</li>
          </ul>
          <button class="btn" type="button" (click)="onCta(plan.id)">
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
    </section>
  `,
})
export class PricingPlansSectionComponent {
  @Input() variant: PricingVariant = 'full';
  @Input() paymentsEnabled = false;
  @Input() ctaMode: CtaMode = 'navigatePricing';
  @Input() ctaLabel?: string;
  @Output() ctaClick = new EventEmitter<{ planId: string }>();

  plans = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '₺800',
      priceSuffix: '/month',
      billingNote: 'Billed monthly',
      features: ['Updates while active'],
      badge: '',
      note: '',
    },
    {
      id: 'quarterly',
      title: 'Quarterly',
      price: '₺600',
      priceSuffix: '/month',
      billingNote: 'Billed quarterly (₺1,800)',
      features: ['Updates while active'],
      badge: '',
      note: '',
    },
    {
      id: 'annual',
      title: 'Annual',
      price: '₺200',
      priceSuffix: '/month',
      billingNote: 'Billed yearly (₺2,400)',
      features: ['Best value for active prep', 'More front-end system design scenarios (planned)'],
      badge: 'Best for active prep',
      note: '',
    },
    {
      id: 'lifetime',
      title: 'Lifetime',
      price: '₺3,600',
      priceSuffix: 'paid once',
      billingNote: 'Paid once',
      features: ['Future updates included'],
      badge: '',
      note: 'Lifetime applies to FrontendAtlas core features. New premium products may be priced separately.',
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
          a: 'FrontendAtlas is a hands-on interview practice workspace. You solve coding tasks, review concepts, and practice front-end system design in the same flow — with a real editor, preview, and validation where available.',
        },
        {
          id: 'install-anything',
          q: 'Do I need to install anything, or is it all in the browser?',
          a: 'No install required. FrontendAtlas runs in the browser; just open the app and start practicing. For the best experience, use a desktop/laptop with a keyboard.',
        },
        {
          id: 'supported-browsers-devices',
          q: 'Which browsers/devices are supported?',
          a: 'FrontendAtlas works best on recent desktop versions of Chrome/Edge, Safari, and Firefox. Mobile/tablet can browse, but the full editor + split-pane workflow is optimized for desktop.',
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
          a: 'You’ll find UI-first coding tasks (with starter code), concept/trivia questions (for interview reasoning), and front-end system design prompts (tradeoffs, caching, architecture).',
        },
        {
          id: 'tech-coverage',
          q: 'Which technologies are covered (JS/TS, HTML/CSS, React/Angular/Vue)?',
          a: 'Content is organized by JavaScript/TypeScript, HTML/CSS, Angular, React, Vue — plus a dedicated front-end system design library.',
        },
        {
          id: 'difficulty-and-tags',
          q: 'How are difficulty levels and tags organized?',
          a: 'Questions are labeled by difficulty and importance, and you can filter/sort by technology and difficulty. Search is built around quick narrowing: “what should I practice next?”',
        },
        {
          id: 'solutions-and-explanations',
          q: 'Do exercises include solutions and explanations?',
          a: 'Many exercises include solutions and explanations, and more are added over time. Some prompts are intentionally open-ended (multiple valid approaches) to reflect real interview discussions.',
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
          a: 'Yes — many tasks provide a live preview that updates as you type. Where a visual preview isn’t the best signal (e.g., pure JS logic), validation is done via checks instead.',
        },
        {
          id: 'run-tests',
          q: 'Can I run tests / validate my solution inside the app?',
          a: 'Yes for tasks that ship with deterministic checks (especially JavaScript/TypeScript). For HTML/CSS tasks, the primary feedback loop is live preview.',
        },
        {
          id: 'save-progress',
          q: 'Does FrontendAtlas save my code and progress between sessions?',
          a: 'Yes. Your code is saved locally in your browser to prevent accidental loss, and signed-in users can also track solved status. You can always use the Reset action to return to the starter.',
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
          a: 'Premium unlocks premium question sets and features for your plan, plus ongoing content updates while your plan is active.',
        },
        {
          id: 'subscription-vs-lifetime',
          q: 'What’s the difference between Subscription and Lifetime?',
          a: 'Subscriptions include access while active (and renew automatically unless canceled). Lifetime is a one-time purchase for FrontendAtlas core content; future separate premium products (if any) may be priced independently.',
        },
        {
          id: 'cancel-anytime',
          q: 'Can I cancel a subscription anytime?',
          a: 'Yes. You can cancel at any time and keep access until the end of your current billing period.',
        },
        {
          id: 'refunds',
          q: 'Do you offer refunds?',
          a: 'Refund requests may be approved within 7 days of the initial purchase for accounts with limited usage. Subscription renewals are not refundable. See /legal/refund for full details or contact support@frontendatlas.com.',
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
          a: 'Email support@frontendatlas.com with steps to reproduce, your browser/OS, and the question URL or id. Screenshots or a short screen recording help a lot.',
        },
        {
          id: 'payment-declined',
          q: 'Checkout failed / payment was declined — what should I try first?',
          a: 'Try again, verify billing details, and consider a different card. Disable ad blockers/VPNs that can break checkout, and ensure your bank allows online/international payments. If it still fails, contact support@frontendatlas.com with the time of the attempt and your account email.',
        },
      ],
    },
  ];

  get ctaText(): string {
    if (this.ctaLabel) return this.ctaLabel;
    return this.paymentsEnabled ? 'Upgrade' : 'Upgrade';
  }

  constructor(private router: Router) { }

  onCta(planId: string) {
    if (this.paymentsEnabled) {
      this.ctaClick.emit({ planId });
      return;
    }

    if (this.ctaMode === 'navigatePricing') {
      this.router.navigateByUrl('/pricing').catch(() => void 0);
      return;
    }

    this.ctaClick.emit({ planId });
  }
}
