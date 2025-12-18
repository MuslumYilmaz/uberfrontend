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
          [items]="faqs"
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

  faqs = [
    { q: 'What do I get with Premium?', a: 'Access to premium content and features included in the plan you choose. New content is added over time.' },
    { q: 'Can I cancel anytime?', a: 'For subscription plans, yes — you can cancel and keep access until the end of the billing period.' },
    { q: 'Does Lifetime include everything forever?', a: 'Lifetime covers the FrontendAtlas core library. Separate premium products (if any) may be priced independently.' },
    { q: 'Do you offer refunds?', a: 'If you plan to offer them: add your policy here. Keep it short and explicit.' },
    { q: 'Is this for beginners or seniors?', a: 'Mostly for interview-focused practice. You can start at any level, but it’s strongest for real-world front-end workflows.' },
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
