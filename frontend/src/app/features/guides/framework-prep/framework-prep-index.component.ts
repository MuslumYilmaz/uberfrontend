import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { OfflineBannerComponent } from '../../../shared/components/offline-banner/offline-banner';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';

type FrameworkPathCard = {
  slug: string;
  title: string;
  summary: string;
  focus: string;
  bestFor: string;
  coreSignals: string;
  commonFailure: string;
  nextRoute: any[];
  nextLabel: string;
};

type PrepLink = {
  label: string;
  route: any[];
  queryParams?: Params;
};

type IntentCard = {
  title: string;
  detail: string;
  cta: string;
  route: any[];
  queryParams?: Params;
};

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent, PrepSignalGridComponent],
  styles: [`
    :host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 24px clamp(18px, 4vw, 28px) 52px; }
    .hero { display:grid; gap: 14px; margin-bottom: 22px; }
    .eyebrow { margin: 0; color: var(--uf-accent); font-size: 12px; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }
    .hero-title { margin: 0; max-width: 900px; }
    .hero-sub { color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent); margin: 0; max-width: 900px; }

    .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin:0; }
    .pill { padding:6px 12px; }

    .value-grid {
      display:grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin: 8px 0 4px;
    }
    .value-signal {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      padding: 12px;
      min-height: 86px;
    }
    .value-signal strong { display:block; margin-bottom: 4px; font-size: 0.92rem; }
    .value-signal span { color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.82rem; line-height: 1.45; }

    .section { margin-top: 24px; }
    .section-head { display:grid; gap: 6px; margin-bottom: 12px; max-width: 860px; }
    .section-head h2 { margin: 0; }
    .section-head p { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); }

    .cluster-grid {
      display:grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    @media (max-width: 860px) {
      .cluster-grid { grid-template-columns: 1fr; }
      .value-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    .cluster-card {
      display:grid;
      gap: 8px;
      text-decoration:none;
      color:inherit;
      padding: 16px;
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      transition: border-color 160ms ease, background-color 160ms ease;
    }
    .cluster-card:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      background: color-mix(in srgb, var(--uf-surface) 86%, var(--uf-accent) 14%);
    }
    .cluster-card__title { margin: 0; }
    .cluster-card__summary { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent); }
    .cluster-card__focus { color: color-mix(in srgb, var(--uf-text-tertiary) 84%, transparent); font-size: 12px; }

    .question-hub-grid {
      display:grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .question-hub-link {
      display:flex;
      align-items:center;
      min-height: 42px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 93%, var(--uf-surface-alt));
      color: var(--uf-text-primary);
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 800;
      line-height: 1.35;
      transition: border-color 160ms ease, background-color 160ms ease;
    }
    .question-hub-link:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      background: color-mix(in srgb, var(--uf-accent) 12%, var(--uf-surface));
    }

    .chooser-grid {
      display:grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .chooser-card {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 93%, var(--uf-surface-alt));
      padding: 14px;
      display:grid;
      gap: 8px;
    }
    .chooser-card h3 { margin: 0; font-size: 0.98rem; }
    .chooser-card p { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.88rem; line-height: 1.5; }

    .matrix {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      overflow: hidden;
      background: var(--uf-surface);
    }
    .matrix-row {
      display:grid;
      grid-template-columns: 1.05fr 1.35fr 1.25fr 1.15fr 1fr;
      border-top: 1px solid var(--uf-border-subtle);
    }
    .matrix-row:first-child { border-top: 0; }
    .matrix-row--head {
      background: color-mix(in srgb, var(--uf-surface-alt) 78%, var(--uf-surface));
      color: var(--uf-text-primary);
      font-weight: 800;
      font-size: 0.8rem;
    }
    .matrix-cell {
      padding: 12px;
      border-left: 1px solid var(--uf-border-subtle);
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 0.84rem;
      line-height: 1.45;
    }
    .matrix-cell:first-child {
      border-left: 0;
      color: var(--uf-text-primary);
      font-weight: 800;
    }
    .matrix-cell a { color: var(--uf-accent); font-weight: 700; text-decoration: none; }
    .matrix-cell a:hover { text-decoration: underline; }

    .roadmap-grid {
      display:grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .roadmap-phase {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 93%, var(--uf-surface-alt));
      padding: 14px;
      display:grid;
      gap: 8px;
    }
    .roadmap-phase h3 { margin: 0; font-size: 1rem; }
    .roadmap-phase p { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.88rem; line-height: 1.5; }

    .intent-grid {
      display:grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .intent-grid--wide {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .intent-card {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 93%, var(--uf-surface-alt));
      padding: 14px;
      display:grid;
      gap: 8px;
    }
    .intent-card h3 { margin: 0; font-size: 0.98rem; }
    .intent-card p { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.88rem; line-height: 1.5; }
    .intent-card a {
      color: var(--uf-accent);
      font-weight: 800;
      font-size: 0.84rem;
      text-decoration: none;
    }
    .intent-card a:hover { text-decoration: underline; }

    .next-list {
      display:grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: next-step;
    }
    .next-list li {
      counter-increment: next-step;
      display:grid;
      grid-template-columns: 34px minmax(0, 1fr) auto;
      align-items: start;
      gap: 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      padding: 12px;
    }
    .next-list li::before {
      content: counter(next-step);
      width: 28px;
      height: 28px;
      display:grid;
      place-items:center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 16%, var(--uf-surface));
      border: 1px solid color-mix(in srgb, var(--uf-accent) 34%, var(--uf-border-subtle));
      color: var(--uf-text-primary);
      font-size: 0.78rem;
      font-weight: 800;
    }
    .next-list strong { display:block; margin-bottom: 4px; }
    .next-list span { display:block; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.88rem; line-height: 1.5; }
    .next-list a {
      color: var(--uf-accent);
      font-size: 0.84rem;
      font-weight: 800;
      text-decoration: none;
      white-space: nowrap;
    }
    .next-list a:hover { text-decoration: underline; }

    .mistake-list,
    .faq-list {
      display:grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .mistake-list li,
    .faq-item {
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      padding: 13px 14px;
    }
    .mistake-list strong,
    .faq-item h3 { display:block; margin: 0 0 5px; font-size: 0.96rem; color: var(--uf-text-primary); }
    .mistake-list span,
    .faq-item p { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent); font-size: 0.88rem; line-height: 1.5; }

    .prep-block {
      margin-top: 24px;
      padding: 16px;
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      display: grid;
      gap: 14px;
    }
    .prep-block h2 { margin: 0; font-size: 1.06rem; }
    .prep-grid-shared { margin: 0; }

    .prep-links { display:flex; gap: 10px; flex-wrap: wrap; }
    .prep-links a {
      text-decoration: none;
      padding: 8px 12px;
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      color: var(--uf-text-secondary);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      font-size: 12px;
      font-weight: 600;
      transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
    }
    .prep-links a:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
    }

    @media (max-width: 960px) {
      .chooser-grid,
      .intent-grid,
      .intent-grid--wide,
      .roadmap-grid,
      .question-hub-grid { grid-template-columns: 1fr; }
      .next-list li { grid-template-columns: 34px minmax(0, 1fr); }
      .next-list a { grid-column: 2; white-space: normal; }
      .matrix { border: 0; background: transparent; display:grid; gap: 10px; }
      .matrix-row {
        grid-template-columns: 1fr;
        border: 1px solid var(--uf-border-subtle);
        border-radius: var(--uf-card-radius);
        overflow: hidden;
        background: var(--uf-surface);
      }
      .matrix-row--head { display:none; }
      .matrix-cell { border-left: 0; border-top: 1px solid var(--uf-border-subtle); }
      .matrix-cell:first-child { border-top: 0; }
      .matrix-cell::before {
        content: attr(data-label);
        display:block;
        color: var(--uf-text-tertiary);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
    }

    @media (max-width: 620px) {
      .value-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <div class="wrap fa-body">
      <header class="hero">
        <p class="eyebrow">Frontend framework interview preparation</p>
        <h1 class="hero-title fa-page-title">Frontend Framework Interview Preparation Roadmap</h1>
        <p class="hero-sub fa-meta-text">
          Choose the right JavaScript interview prep path, compare React interview preparation,
          Angular interview preparation, and Vue interview preparation, then move through a
          practical frontend interview preparation roadmap for coding, concepts, system design,
          and company prep.
        </p>
        <div class="pill-row">
          <span class="pill fa-chip fa-chip--label">4 framework paths</span>
          <span class="pill fa-chip fa-chip--label">JavaScript fundamentals first</span>
          <span class="pill fa-chip fa-chip--label">7/14/30-day prep plans</span>
          <span class="pill fa-chip fa-chip--label">Coding + concepts + system design + company prep links</span>
        </div>
      </header>

      <section class="value-grid" aria-label="Framework prep value signals">
        <div class="value-signal" *ngFor="let signal of valueSignals">
          <strong>{{ signal.title }}</strong>
          <span>{{ signal.detail }}</span>
        </div>
      </section>

      <section class="section" data-testid="framework-question-hubs">
        <div class="section-head">
          <h2 class="fa-section-title">Baseline interview question hubs</h2>
          <p>
            Use framework prep for sequence, then open the matching interview question hub for focused Q&A practice.
          </p>
        </div>
        <div class="question-hub-grid" aria-label="Technology interview question hubs">
          <a
            *ngFor="let hub of questionHubLinks"
            class="question-hub-link"
            [routerLink]="hub.route">
            {{ hub.label }}
          </a>
        </div>
      </section>

      <section class="section" data-testid="framework-path-cards">
        <div class="section-head">
          <h2 class="fa-section-title">Framework prep paths</h2>
          <p>Start from one path, then add mixed interview rounds once the framework loop is stable.</p>
        </div>
        <div class="cluster-grid" aria-label="Framework preparation paths">
        <a
          *ngFor="let item of frameworkPaths"
          class="cluster-card"
          [routerLink]="['/','guides','framework-prep', item.slug]"
        >
          <h2 class="cluster-card__title fa-card-title">{{ item.title }}</h2>
          <p class="cluster-card__summary fa-meta-text">{{ item.summary }}</p>
          <div class="cluster-card__focus">Focus: {{ item.focus }}</div>
        </a>
        </div>
      </section>

      <section class="section" data-testid="framework-prep-chooser">
        <div class="section-head">
          <h2 class="fa-section-title">Choose your framework prep path</h2>
          <p>
            The strongest path is the one that matches the roles you are targeting and the failure mode
            you most need to remove before interviews.
          </p>
        </div>
        <div class="chooser-grid">
          <article class="chooser-card" *ngFor="let item of choosePathCards">
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="section" data-testid="framework-comparison-matrix">
        <div class="section-head">
          <h2 class="fa-section-title">Framework comparison matrix</h2>
          <p>Use this matrix to decide whether your next session should be concepts, machine coding, or architecture review.</p>
        </div>
        <div class="matrix" role="table" aria-label="Framework interview preparation comparison">
          <div class="matrix-row matrix-row--head" role="row">
            <div class="matrix-cell" role="columnheader">Path</div>
            <div class="matrix-cell" role="columnheader">Best for</div>
            <div class="matrix-cell" role="columnheader">Core interview signals</div>
            <div class="matrix-cell" role="columnheader">Common failure mode</div>
            <div class="matrix-cell" role="columnheader">Recommended next route</div>
          </div>
          <div class="matrix-row" role="row" *ngFor="let item of frameworkPaths">
            <div class="matrix-cell" role="cell" data-label="Path">{{ item.title }}</div>
            <div class="matrix-cell" role="cell" data-label="Best for">{{ item.bestFor }}</div>
            <div class="matrix-cell" role="cell" data-label="Core interview signals">{{ item.coreSignals }}</div>
            <div class="matrix-cell" role="cell" data-label="Common failure mode">{{ item.commonFailure }}</div>
            <div class="matrix-cell" role="cell" data-label="Recommended next route">
              <a [routerLink]="item.nextRoute">{{ item.nextLabel }}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section" data-testid="framework-prep-roadmap">
        <div class="section-head">
          <h2 class="fa-section-title">7/14/30-day framework prep roadmap</h2>
          <p>
            Use the timeline as a planning baseline: shorten it when fundamentals are already strong,
            extend the repeated miss before adding more topics.
            This frontend interview preparation roadmap connects React, Angular, Vue, and JavaScript prep
            so concepts, coding, and system design stay in the same loop.
          </p>
        </div>
        <div class="roadmap-grid">
          <article class="roadmap-phase" *ngFor="let phase of roadmapPhases">
            <h3>{{ phase.title }}</h3>
            <p>{{ phase.detail }}</p>
          </article>
        </div>
      </section>

      <section class="section" data-testid="framework-role-levels">
        <div class="section-head">
          <h2 class="fa-section-title">Framework prep by role level</h2>
          <p>
            Use this section if you are asking: which frontend framework should I prepare for interviews
            across junior, mid-level, senior, and staff loops?
          </p>
        </div>
        <div class="intent-grid">
          <article class="intent-card" *ngFor="let item of roleLevelPaths">
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
            <a [routerLink]="item.route" [queryParams]="item.queryParams || null">{{ item.cta }}</a>
          </article>
        </div>
      </section>

      <section class="section" data-testid="framework-round-types">
        <div class="section-head">
          <h2 class="fa-section-title">Framework prep by interview round type</h2>
          <p>
            Match your next session to the round: concept screens, React machine coding interview preparation,
            Angular interview prep RxJS change detection DI, Vue interview prep reactivity component communication,
            or frontend system design.
          </p>
        </div>
        <div class="intent-grid intent-grid--wide">
          <article class="intent-card" *ngFor="let item of roundTypePaths">
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
            <a [routerLink]="item.route" [queryParams]="item.queryParams || null">{{ item.cta }}</a>
          </article>
        </div>
      </section>

      <section class="section" data-testid="framework-next-practice">
        <div class="section-head">
          <h2 class="fa-section-title">What to practice next</h2>
          <p>
            Keep the path narrow until the repeated miss disappears, then add the next interview surface.
            The 30 day frontend interview preparation roadmap only works when each block has a measurable output.
          </p>
        </div>
        <ol class="next-list">
          <li *ngFor="let item of nextPracticeSteps">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <a [routerLink]="item.route" [queryParams]="item.queryParams || null">{{ item.cta }}</a>
          </li>
        </ol>
      </section>

      <section class="section" data-testid="framework-prep-mistakes">
        <div class="section-head">
          <h2 class="fa-section-title">Common framework interview mistakes</h2>
          <p>These are the patterns that make candidates look inconsistent even when they know the framework API.</p>
        </div>
        <ul class="mistake-list">
          <li *ngFor="let mistake of commonMistakes">
            <strong>{{ mistake.title }}</strong>
            <span>{{ mistake.fix }}</span>
          </li>
        </ul>
      </section>

      <section class="prep-block" aria-label="How to use this interview prep cluster">
        <h2>How to use this cluster</h2>
        <app-prep-signal-grid
          class="prep-grid-shared"
          outcomesTitle="Expected outcomes"
          [outcomes]="prepOutcomes"
          [mistakes]="prepMistakes"
          [sequence]="prepSequence">
        </app-prep-signal-grid>

        <div class="prep-links">
          <a
            *ngFor="let link of prepLinks"
            [routerLink]="link.route"
            [queryParams]="link.queryParams || null"
          >
            {{ link.label }}
          </a>
        </div>
      </section>

      <section class="section" data-testid="framework-prep-faq">
        <div class="section-head">
          <h2 class="fa-section-title">Frontend framework interview preparation FAQ</h2>
          <p>Use these answers to decide when to stay in framework prep and when to move into mixed practice.</p>
        </div>
        <div class="faq-list">
          <article class="faq-item" *ngFor="let item of faqItems">
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </article>
        </div>
      </section>

      <app-offline-banner></app-offline-banner>
    </div>
  `,
})
export class FrameworkPrepIndexComponent implements OnInit {
  private readonly canonicalPath = '/guides/framework-prep';
  private readonly pageTitle = 'Frontend Framework Interview Preparation Roadmap';
  private readonly pageDescription = 'Compare JavaScript, React, Angular, and Vue interview preparation paths with a 7/14/30-day frontend interview preparation roadmap, role-level guidance, and next practice links.';

  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    this.publishSeo();
  }

  readonly valueSignals = [
    {
      title: '4 framework paths',
      detail: 'JavaScript, React, Angular, and Vue paths stay separate so practice matches the interview loop.',
    },
    {
      title: 'JavaScript fundamentals first',
      detail: 'Closures, async behavior, event loop timing, and state transitions stay visible in every path.',
    },
    {
      title: '7/14/30-day prep plans',
      detail: 'Use a 7, 14, or 30 day frontend interview preparation roadmap for concepts, machine coding, and mixed rounds.',
    },
    {
      title: 'Next practice links',
      detail: 'Move from concepts into coding, study plans, frontend system design, and company prep without route hunting.',
    },
  ];

  readonly questionHubLinks: PrepLink[] = [
    { label: 'JavaScript interview questions', route: ['/javascript/interview-questions'] },
    { label: 'React interview questions', route: ['/react/interview-questions'] },
    { label: 'Angular interview questions', route: ['/angular/interview-questions'] },
    { label: 'Vue.js interview questions', route: ['/vue/interview-questions'] },
    { label: 'HTML interview questions', route: ['/html/interview-questions'] },
    { label: 'CSS interview questions', route: ['/css/interview-questions'] },
  ];

  readonly choosePathCards = [
    {
      title: 'JavaScript path',
      detail: 'Use the JavaScript interview prep path for async, closures, event loop timing, state transitions, browser APIs, and implementation reasoning.',
    },
    {
      title: 'React path',
      detail: 'Use React interview preparation for hooks, rendering, state ownership, performance, effects, forms, and machine coding practice.',
    },
    {
      title: 'Angular path',
      detail: 'Use Angular interview preparation for RxJS, dependency injection, change detection, architecture boundaries, templates, and tests.',
    },
    {
      title: 'Vue path',
      detail: 'Use Vue interview preparation for reactivity, component communication, rendering behavior, state, composables, and predictable updates.',
    },
  ];

  readonly roadmapPhases = [
    {
      title: '7 days: stabilize fundamentals and one framework',
      detail: 'Pick one path, repair JavaScript fundamentals, answer core concept prompts, and complete small implementation drills in the same framework. This is the short JavaScript interview prep path for frontend developers who need speed.',
    },
    {
      title: '14 days: add machine coding and review loops',
      detail: 'Add framework-specific concepts, timed UI builds, bug retros, and repeated review loops for rendering, state, data fetching, and tests. React candidates should add React machine coding interview preparation here.',
    },
    {
      title: '30 days: add mixed rounds and senior signals',
      detail: 'Add frontend system design, company prep, behavioral stories, mixed question sets, and performance/accessibility tradeoff explanations for senior frontend framework interview preparation.',
    },
  ];

  readonly roleLevelPaths: IntentCard[] = [
    {
      title: 'Junior and early-career',
      detail: 'Start with JavaScript fundamentals, DOM behavior, browser events, async timing, and one framework path before broad topic review.',
      cta: 'JavaScript interview prep path for frontend developers',
      route: ['/guides/framework-prep/javascript-prep-path'],
    },
    {
      title: 'Mid-level frontend',
      detail: 'Add framework-specific rendering, state ownership, data fetching, forms, tests, and machine coding drills that expose implementation tradeoffs.',
      cta: 'Frontend coding practice',
      route: ['/coding'],
      queryParams: { reset: 1 },
    },
    {
      title: 'Senior and staff frontend',
      detail: 'Treat framework choices as architecture decisions: performance, accessibility, reliability, state boundaries, and when to move from framework prep to frontend system design.',
      cta: 'Senior frontend framework interview preparation',
      route: ['/system-design'],
    },
  ];

  readonly roundTypePaths: IntentCard[] = [
    {
      title: 'Concept screen',
      detail: 'Use JavaScript, React, Angular, or Vue questions to explain state, rendering, async behavior, and tradeoffs without hiding behind memorized API names.',
      cta: 'JavaScript interview questions',
      route: ['/javascript/interview-questions'],
    },
    {
      title: 'Machine coding',
      detail: 'Practice React machine coding interview preparation with filters, forms, timers, fetch flows, lists, and component state. Angular and Vue candidates should translate the same drills into their framework.',
      cta: 'Question Library',
      route: ['/coding'],
      queryParams: { reset: 1 },
    },
    {
      title: 'Framework deep dive',
      detail: 'Use Angular interview prep RxJS change detection DI for enterprise roles, or Vue interview prep reactivity component communication for Vue-specific screens.',
      cta: 'Angular interview preparation',
      route: ['/guides/framework-prep/angular-prep-path'],
    },
    {
      title: 'Architecture transition',
      detail: 'Move into frontend system design once framework rendering and state decisions are explainable and your UI coding loop is reliable under time pressure.',
      cta: 'Frontend system design practice',
      route: ['/system-design'],
    },
  ];

  readonly nextPracticeSteps: IntentCard[] = [
    {
      title: 'Repair JavaScript first',
      detail: 'Use async, closures, event loop timing, DOM events, and state transitions before choosing React, Angular, or Vue depth work.',
      cta: 'Open JS path',
      route: ['/guides/framework-prep/javascript-prep-path'],
    },
    {
      title: 'Pick one framework path',
      detail: 'Choose React interview preparation roadmap, Angular interview preparation roadmap, or Vue interview preparation roadmap based on the roles you want.',
      cta: 'Open React path',
      route: ['/guides/framework-prep/react-prep-path'],
    },
    {
      title: 'Run timed coding loops',
      detail: 'Build UI drills that force rendering, state, events, accessibility, and tests to work together instead of reviewing concepts in isolation.',
      cta: 'Practice coding',
      route: ['/coding'],
      queryParams: { reset: 1 },
    },
    {
      title: 'Add mixed prep',
      detail: 'Use study plans, company prep, and repeated weak-area review once your chosen framework loop is predictable.',
      cta: 'Open study plans',
      route: ['/tracks'],
    },
    {
      title: 'Move to system design',
      detail: 'Senior loops should add frontend system design when component decisions become architecture decisions about state, APIs, performance, and accessibility.',
      cta: 'Open system design',
      route: ['/system-design'],
    },
  ];

  readonly commonMistakes = [
    {
      title: 'Switching frameworks too often',
      fix: 'Finish one framework loop before comparing another path, otherwise misses look random and hard to fix.',
    },
    {
      title: 'Ignoring JavaScript fundamentals',
      fix: 'React, Angular, and Vue interviews still test async timing, closures, event propagation, objects, arrays, and browser behavior.',
    },
    {
      title: 'Memorizing APIs without explaining rendering or state',
      fix: 'Tie hooks, RxJS, reactivity, and lifecycle decisions back to render timing, ownership, side effects, and data flow.',
    },
    {
      title: 'Skipping machine coding',
      fix: 'Concept accuracy does not prove execution; practice forms, filters, timers, fetch flows, and component state under time pressure.',
    },
    {
      title: 'Not linking decisions to performance, accessibility, and testing',
      fix: 'Explain why a framework choice improves user-perceived speed, keyboard support, resilience, or testability.',
    },
  ];

  readonly faqItems = [
    {
      question: 'Which framework should I prepare first?',
      answer: 'Prepare the framework most relevant to the jobs you are targeting. If the role is framework-neutral or you are unsure, start with JavaScript fundamentals, then choose React, Angular, or Vue based on the stack in the job descriptions.',
    },
    {
      question: 'Do React interviews still test JavaScript?',
      answer: 'Yes. React interview preparation still depends on JavaScript: closures, async behavior, event loop timing, array/object operations, browser APIs, and state transitions show up inside hooks, effects, rendering, and machine coding.',
    },
    {
      question: 'How long does framework interview preparation take?',
      answer: 'A 7-day pass can stabilize fundamentals, 14 days is usually enough to add framework-specific concepts and machine coding loops, and 30 days lets you add system design, company prep, and mixed practice.',
    },
    {
      question: 'Should Angular or Vue candidates practice React-style machine coding?',
      answer: 'Yes, but translate the drill into your framework. The interview signal is not React syntax alone; it is component state, rendering, events, data fetching, accessibility, and clean implementation under constraints.',
    },
    {
      question: 'When should I move from framework prep to system design?',
      answer: 'Move to frontend system design when you can explain framework rendering and state decisions without notes and can complete common UI coding drills. Senior and staff loops should add architecture, performance, reliability, and tradeoff practice early.',
    },
  ];

  readonly prepOutcomes: PrepSignalItem[] = [
    {
      text: 'Faster implementation decisions during coding rounds.',
      route: ['/coding'],
      queryParams: { reset: 1 },
    },
    {
      text: 'Clearer explanations for framework rendering, state, and tradeoffs.',
      route: ['/guides/interview-blueprint/intro'],
    },
    {
      text: 'Better consistency across screening, machine coding, and onsite interviews.',
      route: ['/tracks'],
    },
  ];

  readonly prepMistakes: PrepSignalItem[] = [
    'Switching frameworks every day instead of focused loops.',
    'Practicing random prompts without roadmap sequencing.',
    'Ignoring interview communication quality while coding.',
  ];

  readonly prepSequence: PrepSignalItem[] = [
    {
      text: 'Pick one framework path and complete its sequence first.',
      route: ['/guides/framework-prep/javascript-prep-path'],
    },
    {
      text: 'Run coding + concept drills in your selected framework.',
      route: ['/coding'],
      queryParams: { reset: 1 },
    },
    {
      text: 'Close with frontend system design and company-specific prep.',
      route: ['/system-design'],
    },
  ];

  readonly frameworkPaths: FrameworkPathCard[] = [
    {
      slug: 'javascript-prep-path',
      title: 'JavaScript Interview Prep Path',
      summary: 'Async, closures, state transitions, and practical interview patterns.',
      focus: 'Logic, state flow, async correctness',
      bestFor: 'Framework-neutral roles, fundamentals repair, browser behavior, and pre-React/Angular/Vue preparation.',
      coreSignals: 'Async timing, closures, event loop reasoning, DOM/events, data transforms, and state transitions.',
      commonFailure: 'Jumping into framework syntax before proving JavaScript correctness.',
      nextRoute: ['/guides', 'framework-prep', 'javascript-prep-path', 'mastery'],
      nextLabel: 'JavaScript mastery crash track',
    },
    {
      slug: 'react-prep-path',
      title: 'React Interview Preparation Path',
      summary: 'Components, hooks, rerender reasoning, and performance trade-offs.',
      focus: 'UI state, effects, architecture',
      bestFor: 'React-heavy frontend roles, product UI machine coding, hooks, forms, and rendering questions.',
      coreSignals: 'Hooks, effects, state ownership, memoization, rendering behavior, accessibility, and tests.',
      commonFailure: 'Memorizing hooks without explaining why a component rerenders or where state belongs.',
      nextRoute: ['/guides', 'framework-prep', 'react-prep-path'],
      nextLabel: 'React interview preparation',
    },
    {
      slug: 'angular-prep-path',
      title: 'Angular Interview Preparation Path',
      summary: 'RxJS strategy, architecture boundaries, and testing confidence.',
      focus: 'Reactive flow, module design, maintainability',
      bestFor: 'Enterprise Angular roles, architecture discussions, RxJS workflows, DI, and maintainable UI systems.',
      coreSignals: 'Observables, dependency injection, change detection, components, routing, forms, and test strategy.',
      commonFailure: 'Using RxJS terms without describing data ownership, teardown, or change detection impact.',
      nextRoute: ['/guides', 'framework-prep', 'angular-prep-path'],
      nextLabel: 'Angular interview preparation',
    },
    {
      slug: 'vue-prep-path',
      title: 'Vue Interview Preparation Path',
      summary: 'Reactivity internals, rendering updates, and component communication.',
      focus: 'Reactivity correctness, predictable state',
      bestFor: 'Vue roles, component communication, composition API reasoning, reactivity, and practical UI builds.',
      coreSignals: 'Reactivity, computed/watch behavior, props/events, composables, rendering, state, and tests.',
      commonFailure: 'Treating reactivity as magic instead of explaining dependency tracking and update timing.',
      nextRoute: ['/guides', 'framework-prep', 'vue-prep-path'],
      nextLabel: 'Vue interview preparation',
    },
  ];

  readonly prepLinks: PrepLink[] = [
    { label: 'JavaScript mastery crash track', route: ['/guides/framework-prep/javascript-prep-path/mastery'] },
    { label: 'JavaScript interview questions', route: ['/javascript/interview-questions'] },
    { label: 'React interview preparation path', route: ['/guides/framework-prep/react-prep-path'] },
    { label: 'Angular interview preparation path', route: ['/guides/framework-prep/angular-prep-path'] },
    { label: 'Vue interview preparation path', route: ['/guides/framework-prep/vue-prep-path'] },
    { label: 'HTML and CSS interview questions', route: ['/html-css/interview-questions'] },
    { label: 'Frontend interview preparation guide', route: ['/guides/interview-blueprint/intro'] },
    { label: 'Interview blueprint hub', route: ['/guides/interview-blueprint'] },
    { label: 'Study Plans', route: ['/tracks'] },
    { label: 'Frontend system design', route: ['/system-design'] },
    { label: 'Company Prep', route: ['/companies'] },
    { label: 'Question Library', route: ['/coding'], queryParams: { reset: 1 } },
  ];

  private publishSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(this.canonicalPath);
    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: this.pageTitle,
      description: this.pageDescription,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'frontend framework interview preparation' },
        { '@type': 'Thing', name: 'frontend interview preparation roadmap' },
        { '@type': 'Thing', name: 'JavaScript interview prep path' },
      ],
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: this.frameworkPaths.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.title,
          url: this.seo.buildCanonicalUrl(`/guides/framework-prep/${item.slug}`),
        })),
      },
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
          name: this.pageTitle,
          item: canonicalUrl,
        },
      ],
    };

    const faqPage = {
      '@type': 'FAQPage',
      mainEntity: this.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    this.seo.updateTags({
      title: this.pageTitle,
      description: this.pageDescription,
      keywords: [
        'frontend framework interview preparation',
        'React interview preparation',
        'React interview preparation roadmap',
        'React machine coding interview preparation',
        'Angular interview preparation',
        'Angular interview preparation roadmap',
        'Angular interview prep RxJS change detection DI',
        'Vue interview preparation',
        'Vue interview preparation roadmap',
        'Vue interview prep reactivity component communication',
        'JavaScript interview prep path',
        'JavaScript interview prep path for frontend developers',
        'frontend interview preparation roadmap',
        '30 day frontend interview preparation roadmap',
        'senior frontend framework interview preparation',
      ],
      canonical: this.canonicalPath,
      jsonLd: [collectionPage, breadcrumb, faqPage],
    });
  }
}
