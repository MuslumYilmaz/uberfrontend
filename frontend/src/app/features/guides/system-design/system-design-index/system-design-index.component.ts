import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { OfflineBannerComponent } from '../../../../shared/components/offline-banner/offline-banner';
import { SYSTEM, SYSTEM_GROUPS } from '../../../../shared/guides/guide.registry';

type HubLink = {
  label: string;
  route: any[];
  path: string;
};

type BlueprintSignal = {
  title: string;
  detail: string;
  checks: string[];
};

type ComparisonRow = {
  topic: string;
  frontend: string;
  backend: string;
};

type RadioFlowStep = {
  letter: string;
  title: string;
  window: string;
  detail: string;
  route: any[];
  path: string;
};

type FeaturedPrompt = {
  title: string;
  keyword: string;
  detail: string;
  focus: string[];
  route: any[];
  path: string;
};

type StudyOrderItem = {
  step: string;
  title: string;
  detail: string;
  cta: string;
  route: any[];
  path: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

@Component({
  standalone: true,
  selector: 'fa-system-design-index',
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  styles: [`
    :host {
      display: block;
      color: var(--uf-text-primary);
      background: var(--uf-bg);
    }

    .wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px clamp(18px, 4vw, 28px) 48px;
    }

    .hero-title {
      max-width: 820px;
      margin: 6px 0 8px;
      color: var(--uf-text-primary);
      font-size: 28px;
      font-weight: 800;
      line-height: 1.18;
    }

    .hero-sub {
      max-width: 880px;
      margin: 0 0 18px;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      line-height: 1.55;
    }

    .pill-row,
    .prep-links,
    .radio-start__links,
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill-row {
      margin: 12px 0 18px;
    }

    .pill,
    .chip-row span {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      padding: 4px 10px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.2;
    }

    .prep-links {
      margin: 0 0 18px;
    }

    .prep-links a,
    .radio-start__links a,
    .study-link {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent);
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
    }

    .prep-links a:hover,
    .radio-start__links a:hover,
    .study-link:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 58%, var(--uf-accent) 42%);
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
      color: var(--uf-text-primary);
    }

    .blueprint-section {
      display: grid;
      gap: 14px;
      margin: 22px 0;
    }

    .section-head {
      max-width: 850px;
    }

    .section-kicker {
      margin: 0 0 4px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 88%, transparent);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .section-head h2,
    .sec-head {
      margin: 0;
      color: var(--uf-text-primary);
      font-size: 20px;
      font-weight: 800;
      line-height: 1.25;
    }

    .section-head p {
      margin: 8px 0 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      line-height: 1.55;
    }

    .grid-2,
    .grid-3,
    .prompt-grid,
    .study-grid,
    .faq-grid {
      display: grid;
      gap: 12px;
    }

    .grid-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid-3,
    .study-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .prompt-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .faq-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .info-card,
    .comparison-card,
    .radio-step,
    .prompt-card,
    .study-card,
    .faq-card,
    .chapter-card,
    .radio-start {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 76%, var(--uf-surface));
      box-shadow: var(--uf-card-shadow);
    }

    .info-card,
    .comparison-card,
    .radio-step,
    .prompt-card,
    .study-card,
    .faq-card {
      padding: 14px;
      overflow-wrap: anywhere;
    }

    .info-card {
      min-height: 176px;
    }

    .comparison-card {
      min-height: 170px;
    }

    .radio-start {
      display: grid;
      gap: 12px;
      padding: 16px;
      border-color: color-mix(in srgb, var(--uf-border-subtle) 64%, var(--uf-accent) 36%);
      background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-accent) 10%);
    }

    .radio-start__title {
      margin: 0;
      color: var(--uf-text-primary);
      font-size: 17px;
      font-weight: 800;
      line-height: 1.25;
    }

    .radio-start__link,
    .prompt-card,
    .chapter-card {
      color: inherit;
      text-decoration: none;
    }

    .radio-start__link:hover {
      color: var(--uf-accent-strong);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .radio-start__summary {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent);
      line-height: 1.5;
    }

    .radio-flow {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .radio-step {
      min-height: 206px;
    }

    .radio-step__top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .radio-letter,
    .num {
      display: inline-grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 1px solid color-mix(in srgb, var(--uf-accent) 38%, var(--uf-border-subtle));
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
      color: var(--uf-accent-strong);
      font-size: 13px;
      font-weight: 900;
      line-height: 1;
    }

    .radio-window {
      color: color-mix(in srgb, var(--uf-text-tertiary) 84%, transparent);
      font-size: 12px;
      font-weight: 800;
    }

    .info-card h3,
    .comparison-card h3,
    .radio-step h3,
    .prompt-card h3,
    .study-card h3,
    .faq-card h3,
    .chapter-card .title {
      margin: 0;
      color: var(--uf-text-primary);
      font-size: 15px;
      font-weight: 800;
      line-height: 1.3;
    }

    .info-card p,
    .comparison-card p,
    .radio-step p,
    .prompt-card p,
    .study-card p,
    .faq-card p,
    .chapter-card .sub {
      margin: 8px 0 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 13px;
      line-height: 1.5;
    }

    .signal-checks {
      display: grid;
      gap: 6px;
      margin: 12px 0 0;
      padding: 0;
      list-style: none;
    }

    .signal-checks li {
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      font-size: 12px;
      line-height: 1.35;
    }

    .comparison-card strong {
      display: block;
      margin: 10px 0 4px;
      color: color-mix(in srgb, var(--uf-text-primary) 92%, transparent);
      font-size: 12px;
      line-height: 1.3;
    }

    .prompt-card {
      display: grid;
      gap: 10px;
      min-height: 232px;
      padding: 14px;
    }

    .prompt-card:hover,
    .chapter-card:hover {
      border-color: color-mix(in srgb, var(--uf-accent) 44%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-surface-alt) 86%, var(--uf-surface));
    }

    .prompt-keyword {
      margin: 0;
      color: var(--uf-accent-strong);
      font-size: 12px;
      font-weight: 800;
      line-height: 1.35;
    }

    .chapter-section {
      margin: 28px 0;
    }

    .chapter-grid {
      display: grid;
      gap: 10px;
      margin-top: 10px;
    }

    .chapter-card {
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 82px;
      padding: 14px;
      transition: border-color 160ms ease, background-color 160ms ease, transform 120ms ease;
    }

    .chapter-card:hover {
      transform: translateY(-1px);
    }

    .body {
      flex: 1;
      min-width: 0;
    }

    .chapter-card .sub {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mins,
    .arrow {
      color: color-mix(in srgb, var(--uf-text-tertiary) 78%, transparent);
      font-size: 12px;
    }

    .study-card {
      display: grid;
      gap: 10px;
      min-height: 192px;
    }

    .study-step {
      color: var(--uf-accent-strong);
      font-size: 12px;
      font-weight: 900;
      line-height: 1.2;
    }

    .faq-card {
      min-height: 158px;
    }

    @media (max-width: 980px) {
      .grid-3,
      .prompt-grid,
      .radio-flow,
      .study-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 720px) {
      .grid-2,
      .grid-3,
      .prompt-grid,
      .radio-flow,
      .study-grid,
      .faq-grid {
        grid-template-columns: 1fr;
      }

      .info-card,
      .comparison-card,
      .radio-step,
      .prompt-card,
      .study-card,
      .faq-card {
        min-height: auto;
      }

      .chapter-card {
        align-items: flex-start;
      }

      .chapter-card .sub {
        white-space: normal;
      }
    }
  `],
  template: `
    <div class="wrap" data-testid="system-blueprint-hub">
      <h1 class="hero-title">Frontend System Design Interview Blueprint</h1>
      <p class="hero-sub">
        Use this frontend system design interview blueprint with the RADIO framework,
        a 45-minute interview flow, a frontend system design interview checklist,
        examples, and real prompts.
      </p>
      <div class="pill-row" aria-label="Frontend system design blueprint coverage">
        <span class="pill fa-chip fa-chip--label">RADIO framework</span>
        <span class="pill fa-chip fa-chip--label">45-minute answer flow</span>
        <span class="pill fa-chip fa-chip--label">Frontend architecture</span>
        <span class="pill fa-chip fa-chip--label">Final review checklist</span>
      </div>
      <div class="prep-links" aria-label="Related frontend interview hubs">
        <a [routerLink]="['/system-design']">Frontend system design questions</a>
        <a [routerLink]="['/machine-coding']">Machine coding hub</a>
        <a [routerLink]="['/guides/interview-blueprint/intro']">Frontend interview preparation guide</a>
        <a [routerLink]="['/guides/interview-blueprint']">Interview blueprint hub</a>
        <a [routerLink]="['/guides/framework-prep']">Framework prep paths</a>
        <a [routerLink]="['/tracks', 'foundations-30d', 'preview']">30-day guided plan</a>
        <a [routerLink]="['/companies']">Company question sets</a>
      </div>

      <section class="blueprint-section" aria-labelledby="blueprint-signals-title" data-testid="system-blueprint-signals">
        <div class="section-head">
          <p class="section-kicker">Interview signals</p>
          <h2 id="blueprint-signals-title">What frontend system design interviews actually test</h2>
          <p>
            Frontend system design interviews score how you turn vague product requirements
            into a usable browser experience, not how many backend terms you can list.
          </p>
        </div>
        <div class="grid-3">
          <article class="info-card" *ngFor="let signal of blueprintSignals">
            <h3>{{ signal.title }}</h3>
            <p>{{ signal.detail }}</p>
            <ul class="signal-checks">
              <li *ngFor="let check of signal.checks">{{ check }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="blueprint-section" aria-labelledby="blueprint-comparison-title" data-testid="system-blueprint-comparison">
        <div class="section-head">
          <p class="section-kicker">Scope boundary</p>
          <h2 id="blueprint-comparison-title">Frontend vs backend system design</h2>
          <p>
            Strong frontend answers still discuss APIs and storage, but the center of gravity
            is UI architecture, state, rendering, interaction, and user-visible reliability.
          </p>
        </div>
        <div class="grid-2">
          <article class="comparison-card" *ngFor="let row of frontendVsBackend">
            <h3>{{ row.topic }}</h3>
            <strong>Frontend focus</strong>
            <p>{{ row.frontend }}</p>
            <strong>Backend focus</strong>
            <p>{{ row.backend }}</p>
          </article>
        </div>
      </section>

      <section class="blueprint-section" aria-labelledby="blueprint-radio-title" data-testid="system-blueprint-radio-flow">
        <div class="section-head">
          <p class="section-kicker">Answer framework</p>
          <h2 id="blueprint-radio-title">Use RADIO in a 45-minute frontend system design interview</h2>
          <p>
            RADIO is the frontend system design interview answer template: move from scope
            to architecture, data, interface, and the highest-risk optimizations without
            turning the interview into a checklist dump.
          </p>
        </div>
        <section class="radio-start" aria-label="Start with RADIO framework">
          <h3 class="radio-start__title">
            <a class="radio-start__link" [routerLink]="['/','guides','system-design-blueprint','radio-framework']">
              Start with the RADIO answer template
            </a>
          </h3>
          <p class="radio-start__summary">
            Use RADIO to connect Requirements, Architecture, Data, Interface, and Optimizations
            before opening a system design prompt.
          </p>
          <div class="radio-start__links" aria-label="RADIO deep dives">
            <a *ngFor="let step of radioFlow" [routerLink]="step.route">{{ step.title }} deep dive</a>
          </div>
        </section>
        <ol class="radio-flow">
          <li class="radio-step" *ngFor="let step of radioFlow">
            <div class="radio-step__top">
              <span class="radio-letter">{{ step.letter }}</span>
              <span class="radio-window">{{ step.window }}</span>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.detail }}</p>
          </li>
        </ol>
      </section>

      <section class="blueprint-section" aria-labelledby="blueprint-prompts-title" data-testid="system-blueprint-featured-prompts">
        <div class="section-head">
          <p class="section-kicker">Practice prompts</p>
          <h2 id="blueprint-prompts-title">Most asked frontend system design prompts</h2>
          <p>
            Use these as frontend system design interview questions after learning the
            blueprint; the full prompt bank and scenario-specific practice live under
            the system design questions hub.
          </p>
        </div>
        <div class="prompt-grid">
          <a class="prompt-card" *ngFor="let prompt of featuredPrompts" [routerLink]="prompt.route">
            <p class="prompt-keyword">{{ prompt.keyword }}</p>
            <h3>{{ prompt.title }}</h3>
            <p>{{ prompt.detail }}</p>
            <div class="chip-row" aria-label="Prompt focus areas">
              <span *ngFor="let focus of prompt.focus">{{ focus }}</span>
            </div>
          </a>
        </div>
      </section>

      <section class="chapter-section" data-testid="system-blueprint-chapters">
        <div *ngFor="let g of groups(); let gi = index" class="blueprint-section">
          <h2 class="sec-head">{{ g.title }}</h2>
          <div class="chapter-grid">
            <a
              *ngFor="let it of g.items; let ii = index"
              class="chapter-card"
              [routerLink]="['/','guides','system-design-blueprint', it.slug]"
            >
              <div class="num">{{ starts()[gi] + ii + 1 }}</div>
              <div class="body">
                <div class="title">{{ map().get(it.slug)?.title || it.slug }}</div>
                <div class="sub" *ngIf="map().get(it.slug)?.summary as s">{{ s }}</div>
              </div>
              <div class="mins" *ngIf="map().get(it.slug)?.minutes as m">{{ m }} min</div>
              <div class="arrow" aria-hidden="true">→</div>
            </a>
          </div>
        </div>
      </section>

      <section class="blueprint-section" aria-labelledby="blueprint-study-title" data-testid="system-blueprint-study-order">
        <div class="section-head">
          <p class="section-kicker">Study order</p>
          <h2 id="blueprint-study-title">Recommended study order</h2>
          <p>
            Use this order when you want a repeatable path from overview to answer framework,
            deep dives, practice prompts, and final review.
          </p>
        </div>
        <div class="study-grid">
          <article class="study-card" *ngFor="let item of studyOrder">
            <span class="study-step">{{ item.step }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
            <a class="study-link" [routerLink]="item.route">{{ item.cta }}</a>
          </article>
        </div>
      </section>

      <section class="blueprint-section" aria-labelledby="blueprint-faq-title" data-testid="system-blueprint-faq">
        <div class="section-head">
          <p class="section-kicker">FAQ</p>
          <h2 id="blueprint-faq-title">Frontend system design blueprint FAQ</h2>
          <p>
            Use these answers to choose the right entry point before practicing full prompts.
          </p>
        </div>
        <div class="faq-grid">
          <article class="faq-card" *ngFor="let item of faqItems">
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </article>
        </div>
      </section>

      <app-offline-banner></app-offline-banner>
    </div>
  `
})
export class SystemDesignIndexComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly groups = computed(() => SYSTEM_GROUPS);
  readonly map = computed(() => new Map(SYSTEM.map((entry) => [entry.slug, entry])));

  readonly blueprintSignals: BlueprintSignal[] = [
    {
      title: 'Scope and requirements',
      detail: 'Clarify user flows, constraints, success metrics, and product tradeoffs before drawing boxes.',
      checks: ['Primary user journey', 'Functional vs non-functional scope', 'Success and failure metrics'],
    },
    {
      title: 'Frontend architecture',
      detail: 'Choose rendering, routing, client/server boundaries, and module ownership for the target experience.',
      checks: ['CSR, SSR, SSG, or hybrid', 'Feature boundaries', 'Dependency and rollout shape'],
    },
    {
      title: 'State and data flow',
      detail: 'Explain source of truth, cache keys, invalidation, optimistic updates, and realtime consistency.',
      checks: ['Server state vs UI state', 'Loading and error policy', 'Mutation and recovery path'],
    },
    {
      title: 'Interface and accessibility',
      detail: 'Map components, events, keyboard paths, responsive states, and accessible feedback.',
      checks: ['Component API', 'Empty/loading/error states', 'Keyboard and screen reader path'],
    },
    {
      title: 'Performance and reliability',
      detail: 'Prioritize the highest-risk bottlenecks, observability, security, and graceful degradation.',
      checks: ['Core Web Vitals', 'Slow network/device behavior', 'Monitoring and rollback'],
    },
  ];

  readonly frontendVsBackend: ComparisonRow[] = [
    {
      topic: 'System boundary',
      frontend: 'Browser experience, rendering strategy, client state, component contracts, and user-visible recovery.',
      backend: 'Services, databases, queues, replication, consistency models, and infrastructure scaling.',
    },
    {
      topic: 'Primary bottlenecks',
      frontend: 'Network waterfalls, hydration, render cost, bundle size, INP, memory, and scroll or input latency.',
      backend: 'Throughput, storage, fanout, replication lag, queue pressure, and regional availability.',
    },
    {
      topic: 'Interface design',
      frontend: 'Component APIs, route contracts, view models, accessibility states, event handling, and API consumption.',
      backend: 'Service APIs, schemas, protocols, auth boundaries, data ownership, and backward compatibility.',
    },
    {
      topic: 'Failure modes',
      frontend: 'Offline use, stale data, partial loading, slow devices, hydration mismatch, and broken interaction states.',
      backend: 'Service outages, retries, data loss, overloaded dependencies, and cross-region failover.',
    },
  ];

  readonly radioFlow: RadioFlowStep[] = [
    {
      letter: 'R',
      title: 'Requirements',
      window: '0-8 min',
      detail: 'Lock the user flow, constraints, scale assumptions, success metrics, and out-of-scope work.',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-requirements'],
      path: '/guides/system-design-blueprint/radio-requirements',
    },
    {
      letter: 'A',
      title: 'Architecture',
      window: '8-18 min',
      detail: 'Sketch rendering, routing, client/server boundaries, feature modules, and dependency ownership.',
      route: ['/', 'guides', 'system-design-blueprint', 'architecture'],
      path: '/guides/system-design-blueprint/architecture',
    },
    {
      letter: 'D',
      title: 'Data',
      window: '18-28 min',
      detail: 'Define entities, API contracts, cache ownership, invalidation, optimistic updates, and recovery.',
      route: ['/', 'guides', 'system-design-blueprint', 'state-data'],
      path: '/guides/system-design-blueprint/state-data',
    },
    {
      letter: 'I',
      title: 'Interface',
      window: '28-38 min',
      detail: 'Map components, UI states, accessibility, events, responsive behavior, and interaction contracts.',
      route: ['/', 'guides', 'system-design-blueprint', 'ux'],
      path: '/guides/system-design-blueprint/ux',
    },
    {
      letter: 'O',
      title: 'Performance optimization',
      window: '38-45 min',
      detail: 'Close with Core Web Vitals, performance budgets, bottleneck prioritization, reliability, rollout, and explicit tradeoffs.',
      route: ['/', 'guides', 'system-design-blueprint', 'performance'],
      path: '/guides/system-design-blueprint/performance',
    },
  ];

  readonly featuredPrompts: FeaturedPrompt[] = [
    {
      title: 'Infinite Scroll List System Design',
      keyword: 'design infinite scroll frontend system design',
      detail: 'Cursor pagination, virtualization, loading states, and scroll performance.',
      focus: ['pagination', 'virtualization', 'performance'],
      route: ['/', 'system-design', 'infinite-scroll-list'],
      path: '/system-design/infinite-scroll-list',
    },
    {
      title: 'Notification Toast System',
      keyword: 'design notification system frontend',
      detail: 'Global APIs, timers, stacking, portals, and accessible announcements.',
      focus: ['global state', 'a11y', 'timers'],
      route: ['/', 'system-design', 'notification-toast-system'],
      path: '/system-design/notification-toast-system',
    },
    {
      title: 'Real-time Search with Debounce & Caching',
      keyword: 'design autocomplete frontend system design',
      detail: 'Debounce, cancellation, stale responses, caching, and perceived speed.',
      focus: ['async UI', 'cache', 'stale data'],
      route: ['/', 'system-design', 'realtime-search-debounce-cache'],
      path: '/system-design/realtime-search-debounce-cache',
    },
    {
      title: 'News Feed / Timeline Front-End System Design',
      keyword: 'design news feed frontend system design',
      detail: 'Feed hydration, cursor pagination, media lazy loading, and realtime updates.',
      focus: ['feed', 'media', 'realtime'],
      route: ['/', 'system-design', 'news-feed-timeline'],
      path: '/system-design/news-feed-timeline',
    },
    {
      title: 'AI Chat Text Area',
      keyword: 'design chat app frontend system design',
      detail: 'Streaming responses, persistence, cancellation, API contracts, and UX control.',
      focus: ['streaming', 'persistence', 'cancel'],
      route: ['/', 'system-design', 'ai-chat-textarea-design'],
      path: '/system-design/ai-chat-textarea-design',
    },
    {
      title: 'Component-driven Design System Architecture',
      keyword: 'design system architecture frontend interview',
      detail: 'Tokens, component APIs, accessibility contracts, theming, and versioning.',
      focus: ['tokens', 'component API', 'versioning'],
      route: ['/', 'system-design', 'component-design-system-architecture'],
      path: '/system-design/component-design-system-architecture',
    },
    {
      title: 'Live Comments for Global Streams',
      keyword: 'realtime UI frontend system design',
      detail: 'WebSocket/SSE updates, buffering, moderation UI, and burst control.',
      focus: ['SSE', 'buffering', 'moderation'],
      route: ['/', 'system-design', 'live-comments-global-stream'],
      path: '/system-design/live-comments-global-stream',
    },
    {
      title: 'Dashboard with Draggable & Resizable Widgets',
      keyword: 'dashboard widgets frontend system design',
      detail: 'Layout persistence, drag/resize performance, constraints, and ownership boundaries.',
      focus: ['layout', 'persistence', 'constraints'],
      route: ['/', 'system-design', 'dashboard-widgets-draggable-resizable'],
      path: '/system-design/dashboard-widgets-draggable-resizable',
    },
  ];

  readonly studyOrder: StudyOrderItem[] = [
    {
      step: 'Step 1',
      title: 'Understand the scoring model',
      detail: 'Start with what frontend system design really tests before memorizing diagrams.',
      cta: 'Read the intro',
      route: ['/', 'guides', 'system-design-blueprint', 'intro'],
      path: '/guides/system-design-blueprint/intro',
    },
    {
      step: 'Step 2',
      title: 'Learn the RADIO answer template',
      detail: 'Use one structure to move from requirements to optimizations in a timed interview.',
      cta: 'Open RADIO',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-framework'],
      path: '/guides/system-design-blueprint/radio-framework',
    },
    {
      step: 'Step 3',
      title: 'Deep dive the weakest step',
      detail: 'Use the R/A/D/I/O deep dives when requirements, architecture, data, interface, or performance is the miss.',
      cta: 'Start requirements',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-requirements'],
      path: '/guides/system-design-blueprint/radio-requirements',
    },
    {
      step: 'Step 4',
      title: 'Apply it to real prompts',
      detail: 'Practice infinite scroll, notifications, search, feeds, chat, design systems, and dashboards.',
      cta: 'Open prompts',
      route: ['/', 'system-design'],
      path: '/system-design',
    },
    {
      step: 'Step 5',
      title: 'Run a final review checklist',
      detail: 'Use the frontend system design final review checklist to catch missing trade-offs and closing-script gaps before company-specific prep.',
      cta: 'Open checklist',
      route: ['/', 'guides', 'system-design-blueprint', 'checklist'],
      path: '/guides/system-design-blueprint/checklist',
    },
  ];

  readonly faqItems: FaqItem[] = [
    {
      question: 'What is a frontend system design interview blueprint?',
      answer:
        'A frontend system design interview blueprint is a reusable answer structure for clarifying requirements, choosing architecture, modeling data, defining UI interfaces, and explaining performance or reliability tradeoffs.',
    },
    {
      question: 'How is frontend system design different from backend system design?',
      answer:
        'Frontend system design centers on browser rendering, client state, component APIs, accessibility, performance, and user-visible failures. Backend system design centers more on services, storage, queues, replication, and infrastructure scale.',
    },
    {
      question: 'How do I use RADIO in a 45-minute frontend system design interview?',
      answer:
        'Use RADIO to move through Requirements, Architecture, Data, Interface, and Optimizations. Keep one user flow as the thread, allocate time to each step, and close with risks, metrics, and tradeoffs.',
    },
    {
      question: 'What are the most asked frontend system design interview questions?',
      answer:
        'Common frontend system design interview questions include infinite scroll, notification systems, autocomplete search, news feeds, AI chat UI, design system architecture, live comments, and draggable dashboards.',
    },
    {
      question: 'What should a frontend system design interview checklist include?',
      answer:
        'A frontend system design checklist should include requirements, state ownership, API contracts, failure states, accessibility, performance budgets, observability, rollout risk, and tradeoff narration.',
    },
  ];

  readonly supportLinks: HubLink[] = [
    { label: 'Frontend system design questions', route: ['/', 'system-design'], path: '/system-design' },
    { label: 'Machine coding hub', route: ['/', 'machine-coding'], path: '/machine-coding' },
    { label: 'Frontend interview preparation guide', route: ['/', 'guides', 'interview-blueprint', 'intro'], path: '/guides/interview-blueprint/intro' },
    { label: 'Interview blueprint hub', route: ['/', 'guides', 'interview-blueprint'], path: '/guides/interview-blueprint' },
    { label: 'Framework prep paths', route: ['/', 'guides', 'framework-prep'], path: '/guides/framework-prep' },
    { label: '30-day guided plan', route: ['/', 'tracks', 'foundations-30d', 'preview'], path: '/tracks/foundations-30d/preview' },
    { label: 'Company question sets', route: ['/', 'companies'], path: '/companies' },
  ];

  /** cumulative starting index for each group (0-based) */
  readonly starts = computed(() => {
    const groups = this.groups();
    const out: number[] = [];
    let acc = 0;
    for (const group of groups) {
      out.push(acc);
      acc += group.items.length;
    }
    return out;
  });

  ngOnInit(): void {
    const canonicalPath = '/guides/system-design-blueprint';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const guideEntries = SYSTEM;
    const chapterItemList = this.buildItemList(
      `${canonicalUrl}#system-design-blueprint-chapters`,
      canonicalUrl,
      'Frontend system design interview blueprint chapters',
      guideEntries.map((entry) => ({
        name: entry.title,
        path: `/guides/system-design-blueprint/${entry.slug}`,
      })),
    );
    const promptItemList = this.buildItemList(
      `${canonicalUrl}#frontend-system-design-prompts`,
      canonicalUrl,
      'Frontend system design examples and prompts',
      this.featuredPrompts.map((prompt) => ({ name: prompt.title, path: prompt.path })),
    );
    const faqPage = {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      url: canonicalUrl,
      name: 'Frontend system design blueprint FAQ',
      mainEntity: this.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Guides',
          item: this.seo.buildCanonicalUrl('/guides'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Frontend System Design Interview Blueprint',
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: 'Frontend System Design Interview Blueprint',
      description:
        'Use a frontend system design interview blueprint with the RADIO framework, checklist, examples, and real prompts for 45-minute architecture prep.',
      canonical: canonicalPath,
      keywords: [
        'frontend system design interview blueprint',
        'frontend system design interview framework',
        'RADIO framework frontend system design',
        'front end system design playbook',
        'how to answer frontend system design interview',
        'frontend system design checklist',
        'frontend system design examples',
        '45 minute frontend system design interview',
        'frontend architecture interview',
        'frontend vs backend system design',
        'frontend system design interview answer template',
        'frontend system design interview guide',
        'frontend system design interview preparation',
        'senior frontend system design interview',
        'staff frontend engineer system design interview',
        'client side system design interview',
        'design autocomplete frontend system design',
        'design news feed frontend system design',
        'design infinite scroll frontend system design',
        'design notification system frontend',
        'design chat app frontend system design',
        'design system architecture frontend interview',
        'realtime UI frontend system design',
        'dashboard widgets frontend system design',
        'frontend system design interview questions',
      ],
      jsonLd: [
        {
          '@type': 'CollectionPage',
          '@id': canonicalUrl,
          url: canonicalUrl,
          name: 'Frontend System Design Interview Blueprint',
          description:
            'A frontend system design interview blueprint with RADIO, deep dives, checklists, examples, and real prompts for 45-minute frontend architecture prep.',
          inLanguage: 'en',
          about: [
            { '@type': 'Thing', name: 'frontend system design interview blueprint' },
            { '@type': 'Thing', name: 'frontend system design interview framework' },
            { '@type': 'Thing', name: 'RADIO framework frontend system design' },
            { '@type': 'Thing', name: 'front end system design playbook' },
            { '@type': 'Thing', name: 'how to answer frontend system design interview' },
            { '@type': 'Thing', name: 'frontend system design checklist' },
            { '@type': 'Thing', name: 'frontend system design examples' },
            { '@type': 'Thing', name: '45 minute frontend system design interview' },
            { '@type': 'Thing', name: 'frontend architecture interview' },
            { '@type': 'Thing', name: 'frontend vs backend system design' },
            { '@type': 'Thing', name: 'frontend system design interview answer template' },
          ],
          mainEntity: [chapterItemList, promptItemList],
          mentions: [
            ...guideEntries.map((entry) => ({
              '@type': 'WebPage',
              name: entry.title,
              url: this.seo.buildCanonicalUrl(`/guides/system-design-blueprint/${entry.slug}`),
            })),
            ...this.featuredPrompts.map((prompt) => ({
              '@type': 'WebPage',
              name: prompt.title,
              url: this.seo.buildCanonicalUrl(prompt.path),
            })),
            ...this.supportLinks.map((link) => ({
              '@type': 'WebPage',
              name: link.label,
              url: this.seo.buildCanonicalUrl(link.path),
            })),
          ],
        },
        breadcrumb,
        chapterItemList,
        promptItemList,
        faqPage,
      ],
    });
  }

  private buildItemList(
    id: string,
    url: string,
    name: string,
    items: Array<{ name: string; path: string }>,
  ): Record<string, any> {
    return {
      '@type': 'ItemList',
      '@id': id,
      url,
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => {
        const itemUrl = this.seo.buildCanonicalUrl(item.path);
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: itemUrl,
          item: {
            '@type': 'WebPage',
            name: item.name,
            url: itemUrl,
          },
        };
      }),
    };
  }
}
