import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OfflineBannerComponent } from '../../../shared/components/offline-banner/offline-banner';

type FrameworkPathCard = {
  slug: string;
  title: string;
  summary: string;
  focus: string;
};

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  styles: [`
    :host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 24px 0 48px; }
    .hero-title { margin: 6px 0 6px; }
    .hero-sub { color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent); margin-bottom: 14px; max-width: 860px; }

    .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 20px; }
    .pill { padding:6px 12px; }

    .cluster-grid {
      display:grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    @media (max-width: 860px) {
      .cluster-grid { grid-template-columns: 1fr; }
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
      transition: border-color 160ms ease, background-color 160ms ease, box-shadow 180ms ease;
    }
    .cluster-card:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      background: color-mix(in srgb, var(--uf-surface) 86%, var(--uf-accent) 14%);
      box-shadow: var(--uf-card-shadow-strong);
    }
    .cluster-card__title { margin: 0; }
    .cluster-card__summary { margin: 0; color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent); }
    .cluster-card__focus { color: color-mix(in srgb, var(--uf-text-tertiary) 84%, transparent); font-size: 12px; }

    .prep-block {
      margin-top: 12px;
      padding: 16px;
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      display: grid;
      gap: 14px;
    }
    .prep-block h2 { margin: 0; font-size: 1.06rem; }
    .prep-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
    .prep-grid ul, .prep-grid ol { margin: 8px 0 0 16px; }
    .prep-grid li { margin: 6px 0; }
    @media (max-width: 900px) {
      .prep-grid { grid-template-columns: 1fr; }
    }

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
  `],
  template: `
    <div class="wrap fa-body">
      <h1 class="hero-title fa-page-title">Framework Interview Preparation Paths</h1>
      <p class="hero-sub fa-meta-text">
        Choose a framework path, follow the interview roadmap in sequence, and practice with targeted
        frontend interview questions before jumping into mixed rounds.
      </p>
      <div class="pill-row">
        <span class="pill fa-chip fa-chip--label">Framework-specific prep</span>
        <span class="pill fa-chip fa-chip--label">Outcomes + common mistakes</span>
        <span class="pill fa-chip fa-chip--label">Suggested sequence</span>
      </div>

      <section class="cluster-grid" aria-label="Framework preparation paths">
        <a
          *ngFor="let item of frameworkPaths"
          class="cluster-card"
          [routerLink]="['/','guides','framework-prep', item.slug]"
        >
          <h2 class="cluster-card__title fa-card-title">{{ item.title }}</h2>
          <p class="cluster-card__summary fa-meta-text">{{ item.summary }}</p>
          <div class="cluster-card__focus">Focus: {{ item.focus }}</div>
        </a>
      </section>

      <section class="prep-block" aria-label="How to use this interview prep cluster">
        <h2>How to use this cluster</h2>
        <div class="prep-grid">
          <div>
            <strong>Suggested sequence</strong>
            <ol>
              <li>Pick one framework path and complete its sequence first.</li>
              <li>Run coding + trivia drills in your selected framework.</li>
              <li>Close with system design and behavioral blueprint rounds.</li>
            </ol>
          </div>
          <div>
            <strong>Expected outcomes</strong>
            <ul>
              <li>Faster implementation decisions during coding rounds.</li>
              <li>Clearer explanations for framework trade-offs.</li>
              <li>Better consistency across screening and onsite interviews.</li>
            </ul>
          </div>
          <div>
            <strong>Common mistakes</strong>
            <ul>
              <li>Switching frameworks every day instead of focused loops.</li>
              <li>Practicing random prompts without roadmap sequencing.</li>
              <li>Ignoring interview communication quality while coding.</li>
            </ul>
          </div>
        </div>

        <div class="prep-links">
          <a [routerLink]="['/guides/interview-blueprint']">Interview blueprint hub</a>
          <a [routerLink]="['/tracks']">Interview tracks</a>
          <a [routerLink]="['/companies']">Company question sets</a>
          <a [routerLink]="['/coding']">Coding question library</a>
        </div>
      </section>

      <app-offline-banner></app-offline-banner>
    </div>
  `,
})
export class FrameworkPrepIndexComponent {
  readonly frameworkPaths: FrameworkPathCard[] = [
    {
      slug: 'javascript-prep-path',
      title: 'JavaScript Prep Path',
      summary: 'Async, closures, state transitions, and practical interview patterns.',
      focus: 'Logic, state flow, async correctness',
    },
    {
      slug: 'react-prep-path',
      title: 'React Prep Path',
      summary: 'Components, hooks, rerender reasoning, and performance trade-offs.',
      focus: 'UI state, effects, architecture',
    },
    {
      slug: 'angular-prep-path',
      title: 'Angular Prep Path',
      summary: 'RxJS strategy, architecture boundaries, and testing confidence.',
      focus: 'Reactive flow, module design, maintainability',
    },
    {
      slug: 'vue-prep-path',
      title: 'Vue Prep Path',
      summary: 'Reactivity internals, rendering updates, and component communication.',
      focus: 'Reactivity correctness, predictable state',
    },
  ];
}
