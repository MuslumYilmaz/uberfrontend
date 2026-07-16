// -----------------------------------------------------------------------------
// Component API Design for Frontend Interviews
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';
import { PUBLIC_EDITORIAL_FACTS } from '../../../core/content/public-editorial-facts';

type ApiSurfaceTradeoff = 'prop-heavy' | 'composed' | 'controlled';

interface ApiSurfaceTradeoffExample {
  snippet: string;
  signal: string;
  risk: string;
}

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    a {
      color: #7cc2ff;
      font-weight: 600;
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    a:hover {
      color: #a9dbff;
      text-decoration: underline;
    }
    .freshness {
      margin: 0 0 16px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
      font-size: 12px;
    }
    .practice-proof {
      display: grid;
      gap: 14px;
      margin: 18px 0 24px;
      padding: 14px;
      border: 1px solid var(--uf-border-subtle);
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 82%, transparent);
    }
    .review-note {
      margin: 16px 0 24px;
      padding: 14px;
      border: 1px solid var(--uf-border-subtle);
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 42%, var(--uf-border-subtle));
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 78%, transparent);
    }
    .review-note h2 {
      margin-top: 0;
    }
    .review-note p:last-child {
      margin-bottom: 0;
    }
    .api-matrix {
      margin: 18px 0 24px;
      padding: 16px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--uf-accent) 10%, transparent), transparent 34%),
        color-mix(in srgb, var(--uf-surface-alt) 80%, transparent);
    }
    .api-matrix figcaption {
      margin: 0 0 12px;
      color: var(--uf-text-primary);
      font-weight: 800;
    }
    .matrix-flow {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .matrix-flow li {
      position: relative;
      min-width: 0;
      display: grid;
      gap: 6px;
      align-content: start;
      padding: 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
    }
    .matrix-flow li:not(:last-child)::after {
      content: "->";
      position: absolute;
      top: 50%;
      right: -9px;
      z-index: 1;
      transform: translate(50%, -50%);
      color: color-mix(in srgb, var(--uf-text-tertiary) 78%, transparent);
      font-size: 0.76rem;
      font-weight: 800;
    }
    .matrix-step {
      width: 24px;
      height: 24px;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      color: var(--uf-bg);
      background: var(--uf-accent);
      font-size: 0.78rem;
      font-weight: 800;
    }
    .matrix-flow strong {
      color: var(--uf-text-primary);
    }
    .matrix-flow span:not(.matrix-step) {
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      font-size: 0.86rem;
      line-height: 1.35;
    }
    .tradeoff-demo {
      display: grid;
      gap: 14px;
      margin: 18px 0 24px;
      padding: 16px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 76%, transparent);
    }
    .tradeoff-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tradeoff-tab {
      min-height: 38px;
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 800;
      cursor: pointer;
    }
    .tradeoff-tab--active {
      color: var(--uf-bg);
      border-color: color-mix(in srgb, var(--uf-accent) 82%, var(--uf-border-subtle));
      background: var(--uf-accent);
    }
    .tradeoff-panel {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
      gap: 14px;
      align-items: stretch;
    }
    .tradeoff-copy {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .tradeoff-copy p {
      margin: 0;
    }
    .tradeoff-copy strong {
      color: var(--uf-text-primary);
    }
    .tradeoff-code pre {
      min-width: 0;
      white-space: pre-wrap;
    }
    .proof-stats,
    .prompt-grid,
    .decision-grid,
    .worked-grid,
    .format-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      padding-left: 0;
      list-style: none;
    }
    .proof-stats {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
    .proof-stat,
    .prompt-card,
    .decision-panel,
    .worked-panel,
    .format-link {
      min-width: 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      padding: 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
    }
    .proof-stat strong {
      display: block;
      color: var(--uf-text-primary);
      font-size: 1rem;
    }
    .proof-stat span {
      display: block;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 0.86rem;
    }
    .proof-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .proof-cta,
    .practice-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
    }
    .proof-cta--primary,
    .practice-link--primary {
      color: var(--uf-bg);
      background: var(--uf-accent);
      border-color: color-mix(in srgb, var(--uf-accent) 84%, var(--uf-border-subtle));
    }
    .prompt-card,
    .format-link {
      display: grid;
      gap: 8px;
    }
    a.prompt-card,
    .format-link,
    .practice-link {
      text-decoration: none;
    }
    a.prompt-card:hover,
    .format-link:hover,
    .practice-link:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    }
    .prompt-card h3,
    .decision-panel h3,
    .worked-panel h3,
    .format-link strong {
      margin: 0;
      color: var(--uf-text-primary);
    }
    .prompt-card p,
    .decision-panel p,
    .worked-panel p,
    .format-link span {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .prompt-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.78rem;
      color: color-mix(in srgb, var(--uf-text-tertiary) 88%, transparent);
    }
    .prompt-meta span {
      padding: 2px 8px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface) 82%, transparent);
    }
    .prompt-card__focus,
    .decision-panel li,
    .worked-panel li,
    .score-list li,
    .quick-answer li,
    .table-summary li {
      font-size: 0.92rem;
    }
    .decision-panel ul,
    .worked-panel ul {
      margin-bottom: 0;
    }
    .quick-answer,
    .table-summary {
      margin: 10px 0 16px;
    }
    .code-wrap {
      overflow-x: auto;
      margin: 14px 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 88%, transparent);
    }
    .code-wrap pre {
      margin: 0;
      padding: 12px;
      min-width: 620px;
      color: var(--uf-text-primary);
      font-size: 0.85rem;
      line-height: 1.55;
    }
    .table-wrap {
      overflow-x: auto;
      margin: 14px 0;
    }
    .table-wrap table {
      width: 100%;
      min-width: 720px;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    .table-wrap th,
    .table-wrap td {
      border: 1px solid var(--uf-border-subtle);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    .table-wrap th {
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-surface-alt) 86%, transparent);
    }
    @media (max-width: 860px) {
      .matrix-flow {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .matrix-flow li:not(:last-child)::after {
        display: none;
      }
      .tradeoff-panel {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 560px) {
      .matrix-flow {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
  <fa-guide-shell
    title="Component API Design for Frontend Interviews: Props, Events, and Trade-offs"
    subtitle="A practice-first map for designing component contracts under frontend interview time pressure."
    [minutes]="22"
    [tags]="['ui','api-design','react','composition','interviews']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="api-guide-freshness">
      Last updated: June 2026 | Author: {{ editorialAuthor }}
    </div>

    <p>
      Component API design is the contract between your UI component and the engineers
      who consume it. In frontend interviews, the answer is not just the JSX that renders;
      it is the React props, events, slots, state ownership, accessibility, styling,
      and escape hatches you choose not to expose.
    </p>
    <p>
      Use this as a frontend component API design interview practice map. Start from a
      familiar component prompt, name the API contract, ship the MVP, then explain the
      trade-offs that would make the component scale in a team codebase.
    </p>

    <h2 id="quick-answer-how-to-design-a-component-api">Quick answer: how to design a component API</h2>
    <p>
      Start by naming the consumer and the state owner. Then define the props/events,
      composition model, accessibility contract, styling surface, and the escape hatches
      you are intentionally leaving for follow-up.
    </p>
    <ul class="quick-answer">
      <li><strong>Consumer:</strong> who uses the component, and what behavior must they control?</li>
      <li><strong>State ownership:</strong> controlled, uncontrolled, or both through value/defaultValue callbacks.</li>
      <li><strong>Props/events:</strong> public inputs and domain events with useful payloads.</li>
      <li><strong>Composition:</strong> simple props, children, slots, or compound components.</li>
      <li><strong>Accessibility and styling:</strong> labels, keyboard paths, focus policy, variants, className, and CSS variables.</li>
      <li><strong>Score signal:</strong> clear contract, small MVP, explicit trade-offs, and no unnecessary escape hatches.</li>
    </ul>

    <div class="practice-proof" data-testid="api-guide-practice-proof">
      <div class="proof-stats" aria-label="FrontendAtlas component API practice proof">
        <div class="proof-stat">
          <strong>500+</strong>
          <span>practice questions</span>
        </div>
        <div class="proof-stat">
          <strong>Component API</strong>
          <span>drills</span>
        </div>
        <div class="proof-stat">
          <strong>Live</strong>
          <span>editor + checks</span>
        </div>
        <div class="proof-stat">
          <strong>Props/events/a11y</strong>
          <span>contracts</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="Component API guide practice actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'ui' }">
          Start UI component drills
        </a>
        <a class="proof-cta" [routerLink]="['/guides','interview-blueprint','ui-interviews']">
          Review UI interview prompts
        </a>
      </div>
    </div>

    <section class="review-note" aria-labelledby="how-this-guide-was-reviewed">
      <h2 id="how-this-guide-was-reviewed">How this guide was reviewed</h2>
      <p>
        This guide is maintained by FrontendAtlas and reviewed against our UI component
        drill set, live coding editor checks, interview blueprint scoring rubrics, and
        official component library patterns. Use it as a timed decision checklist, not
        as a generic React API pattern list.
      </p>
    </section>

    <h2 id="component-api-decision-matrix">Component API decision matrix</h2>
    <figure class="api-matrix" data-testid="api-decision-matrix">
      <figcaption>
        Move left to right before coding: each step narrows the public API and gives the interviewer a scoreable decision.
      </figcaption>
      <ol class="matrix-flow" aria-label="Component API decision matrix flow">
        <li>
          <span class="matrix-step">1</span>
          <strong>Consumer need</strong>
          <span>Who calls this component, and what must they control?</span>
        </li>
        <li>
          <span class="matrix-step">2</span>
          <strong>State ownership</strong>
          <span>Parent-owned, local, or both through value/defaultValue.</span>
        </li>
        <li>
          <span class="matrix-step">3</span>
          <strong>Composition model</strong>
          <span>Simple props, children, named slots, or compound components.</span>
        </li>
        <li>
          <span class="matrix-step">4</span>
          <strong>Event payload</strong>
          <span>Domain event with value, item, reason, or context.</span>
        </li>
        <li>
          <span class="matrix-step">5</span>
          <strong>A11y and styling</strong>
          <span>Labels, keyboard behavior, focus policy, variants, and tokens.</span>
        </li>
        <li>
          <span class="matrix-step">6</span>
          <strong>Escape hatch</strong>
          <span>Ref, asChild, slotProps, or render hook only when needed.</span>
        </li>
      </ol>
    </figure>

    <h2 id="try-api-surface-tradeoff">Try the API surface trade-off</h2>
    <p>
      Toggle the same button prompt through three API surfaces. The strongest answer is not
      always the most flexible one; it is the API that matches the consumer and round scope.
    </p>
    <section class="tradeoff-demo" data-testid="api-surface-tradeoff" aria-labelledby="try-api-surface-tradeoff">
      <div class="tradeoff-tabs" role="group" aria-label="API surface trade-off options">
        <button
          type="button"
          class="tradeoff-tab"
          [class.tradeoff-tab--active]="activeTradeoff === 'prop-heavy'"
          [attr.aria-pressed]="activeTradeoff === 'prop-heavy'"
          (click)="setTradeoff('prop-heavy')"
        >
          Prop-heavy
        </button>
        <button
          type="button"
          class="tradeoff-tab"
          [class.tradeoff-tab--active]="activeTradeoff === 'composed'"
          [attr.aria-pressed]="activeTradeoff === 'composed'"
          (click)="setTradeoff('composed')"
        >
          Composed
        </button>
        <button
          type="button"
          class="tradeoff-tab"
          [class.tradeoff-tab--active]="activeTradeoff === 'controlled'"
          [attr.aria-pressed]="activeTradeoff === 'controlled'"
          (click)="setTradeoff('controlled')"
        >
          Controlled
        </button>
      </div>
      <div class="tradeoff-panel">
        <div class="code-wrap tradeoff-code">
          <pre><code>{{ activeTradeoffExample.snippet }}</code></pre>
        </div>
        <div class="tradeoff-copy" aria-live="polite">
          <p><strong>Interviewer signal:</strong> {{ activeTradeoffExample.signal }}</p>
          <p><strong>Risk:</strong> {{ activeTradeoffExample.risk }}</p>
        </div>
      </div>
    </section>

    <h2 id="component-api-prompts">Component API design patterns interviewers ask about</h2>
    <p>
      These prompts expose different API decisions: controlled state, composition, event
      payloads, a11y contracts, styling hooks, and when to keep the surface area small.
    </p>
    <div class="prompt-grid" data-testid="api-prompt-cards">
      <a class="prompt-card" [routerLink]="['/html','coding','html-dialog-confirm-a11y']" data-testid="api-prompt-modal-dialog">
        <div class="prompt-meta"><span>Dialog</span><span>A11y</span></div>
        <h3>Modal / Confirm Dialog</h3>
        <p>Public surface: <code>open</code>, <code>defaultOpen</code>, <code>onOpenChange</code>, title, description, actions.</p>
        <p class="prompt-card__focus">Trade-off/test focus: controlled vs uncontrolled, focus restore, Escape policy, slots.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-tabs-switcher']" data-testid="api-prompt-tabs">
        <div class="prompt-meta"><span>Tabs</span><span>State</span></div>
        <h3>Tabs</h3>
        <p>State model: <code>value</code>, <code>defaultValue</code>, <code>onValueChange</code>, item ids, disabled tabs.</p>
        <p class="prompt-card__focus">Trade-off/test focus: roving tabindex, tabpanel linkage, controlled active value.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-accordion-faq']" data-testid="api-prompt-accordion">
        <div class="prompt-meta"><span>Disclosure</span><span>Policy</span></div>
        <h3>Accordion</h3>
        <p>State model: <code>type</code>, <code>value</code>, <code>defaultValue</code>, <code>collapsible</code>, <code>onValueChange</code>.</p>
        <p class="prompt-card__focus">Trade-off/test focus: single vs multiple sections, button semantics, disabled items.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-autocomplete-search-starter']" data-testid="api-prompt-autocomplete">
        <div class="prompt-meta"><span>Combobox</span><span>Async</span></div>
        <h3>Autocomplete / Combobox</h3>
        <p>Consumer API: <code>inputValue</code>, <code>selectedValue</code>, <code>onInputChange</code>, <code>onSelect</code>, <code>renderOption</code>.</p>
        <p class="prompt-card__focus">Trade-off/test focus: async states, stale responses, keyboard selection, option identity.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-contact-form-starter']" data-testid="api-prompt-contact-form">
        <div class="prompt-meta"><span>Forms</span><span>Validation</span></div>
        <h3>Contact Form</h3>
        <p>Props/events: field schema, validation timing, <code>onSubmit(values)</code>, errors, disabled submit.</p>
        <p class="prompt-card__focus">Trade-off/test focus: controlled fields, accessible errors, submit lifecycle.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-pagination-table']" data-testid="api-prompt-pagination-table">
        <div class="prompt-meta"><span>Table</span><span>Pagination</span></div>
        <h3>Data Table / Pagination</h3>
        <p>Consumer API: <code>rows</code>, columns, <code>page</code>, <code>pageSize</code>, <code>onPageChange</code>, empty state.</p>
        <p class="prompt-card__focus">Trade-off/test focus: derived rows, page bounds, cell renderers, table semantics.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-dynamic-table']" data-testid="api-prompt-dynamic-table">
        <div class="prompt-meta"><span>Table</span><span>Columns</span></div>
        <h3>Dynamic Table</h3>
        <p>Public surface: column descriptors, accessors, header labels, fallback renderers, stable row keys.</p>
        <p class="prompt-card__focus">Trade-off/test focus: typed columns, missing values, sort follow-up, prop explosion.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-checkboxes']" data-testid="api-prompt-nested-checkboxes">
        <div class="prompt-meta"><span>Tree</span><span>Selection</span></div>
        <h3>Nested Checkbox Tree</h3>
        <p>State model: nodes, selected ids, <code>onCheckedChange(ids)</code>, indeterminate state, disabled nodes.</p>
        <p class="prompt-card__focus">Trade-off/test focus: parent-child sync, controlled selection, reset, traversal cost.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-star-rating']" data-testid="api-prompt-star-rating">
        <div class="prompt-meta"><span>Input</span><span>Rating</span></div>
        <h3>Star Rating</h3>
        <p>A11y contract: <code>value</code>, <code>max</code>, <code>readOnly</code>, <code>onValueChange</code>, labels.</p>
        <p class="prompt-card__focus">Trade-off/test focus: hover preview vs committed value, keyboard input, a11y names.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-progress-bar-thresholds']" data-testid="api-prompt-progress-bar">
        <div class="prompt-meta"><span>Status</span><span>Feedback</span></div>
        <h3>Progress Bar</h3>
        <p>A11y contract: <code>value</code>, <code>min</code>, <code>max</code>, threshold colors, label, reduced motion.</p>
        <p class="prompt-card__focus">Trade-off/test focus: bounded values, ARIA progressbar, theme hooks, animation policy.</p>
      </a>
    </div>

    <h2 id="api-decision-framework">Component API decision framework</h2>
    <div class="decision-grid" data-testid="api-decision-sections">
      <div class="decision-panel">
        <h3>Controlled vs uncontrolled</h3>
        <p>
          Name state ownership first: <code>value/defaultValue/onValueChange</code> for value state
          and <code>open/defaultOpen/onOpenChange</code> for visibility state.
        </p>
        <ul>
          <li>Controlled when parent coordinates validation, URL state, analytics, or reset.</li>
          <li>Uncontrolled when the widget is isolated and interview time is tight.</li>
          <li>Decision tree: if another component needs the state, lift it; otherwise keep it local and expose a controlled mode as follow-up.</li>
        </ul>
      </div>
      <div class="decision-panel">
        <h3>Composition vs configuration</h3>
        <p>
          Prefer <code>children</code>, named slots, or compound components when content shape
          changes; use simple props when the API is stable.
        </p>
        <ul>
          <li>Prop explosion is a smell when every new layout needs another boolean.</li>
          <li>Compound components work well for Modal, Tabs, Accordion, and Menu prompts.</li>
          <li>Configuration is fine for small variants like <code>size</code> and <code>variant</code>.</li>
        </ul>
      </div>
      <div class="decision-panel">
        <h3>Event naming and payloads</h3>
        <p>
          Use domain events instead of raw DOM events: <code>onSelect(&#123; value, item, reason &#125;)</code>
          is easier to consume and test than leaking click details.
        </p>
        <ul>
          <li>Name events by state change: <code>onValueChange</code>, <code>onOpenChange</code>, <code>onPageChange</code>.</li>
          <li>Include enough payload for analytics, undo, validation, or async follow-up.</li>
          <li>Keep the raw event optional unless the interviewer asks for it.</li>
        </ul>
      </div>
      <div class="decision-panel">
        <h3>Styling surface</h3>
        <p>
          Expose <code>variant</code>, <code>size</code>, <code>className</code>, and CSS variables when
          they map to real design-system needs.
        </p>
        <ul>
          <li>Use enums for known visual choices; avoid many boolean styling props.</li>
          <li>Expose CSS variables for theme values like colors, radius, and spacing.</li>
          <li>Do not make every internal element individually styleable in the first pass.</li>
        </ul>
      </div>
      <div class="decision-panel">
        <h3>Escape hatches</h3>
        <p>
          Mention <code>ref</code>, <code>asChild</code>, <code>slotProps</code>, and render hooks as follow-ups,
          not as the first API surface.
        </p>
        <ul>
          <li>Use <code>ref</code> for focus and integration with forms or popovers.</li>
          <li>Use <code>slotProps</code> only when consumers need targeted internal element control.</li>
          <li>Avoid over-abstracted state reducers unless the prompt asks for library-grade APIs.</li>
        </ul>
      </div>
      <div class="decision-panel">
        <h3>Accessibility as API</h3>
        <p>
          Treat labels, ids, ARIA linkage, keyboard expectations, focus restore, and focus trap
          as part of the public contract.
        </p>
        <ul>
          <li>Expose labels and descriptions instead of hardcoding anonymous controls.</li>
          <li>State keyboard behavior before coding: Escape, Arrow keys, Enter, Tab order.</li>
          <li>Call out focus restore/trap policy for dialogs, popovers, and menus.</li>
        </ul>
      </div>
    </div>

    <h2 id="weak-vs-strong-component-api">Weak vs strong component API</h2>
    <p>
      Interviewers can usually tell whether you are designing from the consumer's point of view.
      A weak API adds one prop for every request. A stronger API names ownership, gives consumers
      a composable slot, and keeps events meaningful.
    </p>
    <p>
      <strong>Practice note from FrontendAtlas drills:</strong> in timed component API drills,
      weak answers often add one prop per requested variation. Stronger answers first name
      state ownership, composition boundaries, and event payloads, then keep the initial API
      small enough to implement.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Prompt</th><th>Weak API smell</th><th>Stronger API move</th><th>Interview signal</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Button icon</td>
            <td><code>iconName</code>, <code>iconSize</code>, <code>iconColor</code>, <code>onIconHover</code>.</td>
            <td>Accept <code>icon</code>, <code>renderIcon</code>, or a named slot so the caller owns custom icon behavior.</td>
            <td>You avoid prop explosion and let composition handle flexible content.</td>
          </tr>
          <tr>
            <td>Modal actions</td>
            <td><code>primaryText</code>, <code>secondaryText</code>, <code>danger</code>, and many footer booleans.</td>
            <td>Expose header/body/footer slots plus <code>open/defaultOpen/onOpenChange</code> for state ownership.</td>
            <td>You separate structure from state and keep destructive flows controllable.</td>
          </tr>
          <tr>
            <td>Data Table columns</td>
            <td>Hardcoded field names, hidden sort rules, and one-off formatting props.</td>
            <td>Use column descriptors with accessors, headers, fallback renderers, and stable row keys.</td>
            <td>You make the API reusable without turning it into a generic grid library.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="typescript-api-guardrails">TypeScript API guardrails</h2>
    <p>
      TypeScript should make invalid component states harder to express, not make the interview
      answer feel like a type puzzle. Use types to protect the public surface, then move back to
      behavior, accessibility, and trade-offs.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Guardrail</th><th>Use it when</th><th>Example shape</th><th>Interview caution</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Mirror native props</td>
            <td>A component wraps a real DOM element like button, input, or anchor.</td>
            <td><code>ComponentPropsWithoutRef&lt;'button'&gt;</code> plus your own variants.</td>
            <td>Omit conflicting props before adding custom names like <code>size</code> or <code>variant</code>.</td>
          </tr>
          <tr>
            <td>Controlled/uncontrolled union</td>
            <td>The component supports both parent-owned and local state.</td>
            <td><code>&#123; value; onValueChange &#125; | &#123; defaultValue? &#125;</code>.</td>
            <td>Explain the contract; do not spend the whole round perfecting utility types.</td>
          </tr>
          <tr>
            <td>Mutually exclusive props</td>
            <td>Two props should not be valid together.</td>
            <td><code>&#123; href: string; onClick?: never &#125; | &#123; onClick: () =&gt; void; href?: never &#125;</code>.</td>
            <td>Use this for important invalid states, not for every minor visual option.</td>
          </tr>
          <tr>
            <td>Discriminated unions</td>
            <td>Variants have different required payloads.</td>
            <td><code>&#123; type: 'link'; href &#125; | &#123; type: 'button'; onClick &#125;</code>.</td>
            <td>Name the runtime behavior each branch changes.</td>
          </tr>
          <tr>
            <td>Ref forwarding</td>
            <td>Consumers need focus, measurement, forms, popovers, or composition.</td>
            <td><code>forwardRef&lt;HTMLButtonElement, ButtonProps&gt;</code>.</td>
            <td>Mention it as an integration point, then return to the core prompt.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="library-patterns-interviewers-recognize">Library patterns interviewers recognize</h2>
    <p>
      You do not need to copy a library API in an interview, but referencing familiar patterns
      shows that your design choices match real component systems.
    </p>
    <p>
      The official docs below are references for the pattern vocabulary; adapt the pattern to
      the prompt, consumer, and timebox instead of copying a full library surface.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Pattern</th><th>What it solves</th><th>Risk</th><th>Interview takeaway</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a href="https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components" target="_blank" rel="noopener noreferrer">
                React controlled/uncontrolled
              </a>
            </td>
            <td>Lets the caller choose parent-owned state or simple local state.</td>
            <td>Supporting both can double edge cases if naming is inconsistent.</td>
            <td>Use <code>value/defaultValue/onValueChange</code> and state who owns the source of truth.</td>
          </tr>
          <tr>
            <td>
              <a href="https://www.radix-ui.com/primitives/docs/guides/composition" target="_blank" rel="noopener noreferrer">
                Radix <code>asChild</code>
              </a>
            </td>
            <td>Composes primitive behavior onto a caller-provided element.</td>
            <td>The child must spread props, forward refs, and remain accessible.</td>
            <td>Great follow-up for design systems, not the first API for a small interview MVP.</td>
          </tr>
          <tr>
            <td>
              <a href="https://mui.com/material-ui/customization/overriding-component-structure/" target="_blank" rel="noopener noreferrer">
                MUI <code>slotProps</code>
              </a>
            </td>
            <td>Gives targeted control over internal elements without many top-level props.</td>
            <td>Can expose too much internal structure too early.</td>
            <td>Use when consumers need stable subpart customization.</td>
          </tr>
          <tr>
            <td>
              <a href="https://react-spectrum.adobe.com/react-aria/hooks.html" target="_blank" rel="noopener noreferrer">
                React Aria hooks
              </a>
            </td>
            <td>Encodes accessibility behavior while you own rendering.</td>
            <td>Still requires correct labels, relationships, and state wiring.</td>
            <td>Separate behavior contracts from visual composition.</td>
          </tr>
          <tr>
            <td>
              <a href="https://headlessui.com/react/menu#using-render-props" target="_blank" rel="noopener noreferrer">
                Headless UI render props
              </a>
            </td>
            <td>Exposes state like active, selected, open, or disabled to custom markup.</td>
            <td>Render props can get noisy when simple children would be enough.</td>
            <td>Use when visual control matters more than fixed markup.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="worked-examples">Worked examples: API contracts interviewers can score</h2>
    <div class="worked-grid" data-testid="api-worked-examples">
      <div class="worked-panel">
        <h3>Modal/Dialog API</h3>
        <p>
          Contract: <code>open/defaultOpen/onOpenChange</code>, <code>title</code>,
          <code>description</code>, slots for header/body/footer, focus restore, Escape policy,
          and an explicit a11y contract.
        </p>
        <ul>
          <li>Use controlled open state when parent owns destructive action flow.</li>
          <li>Use slots when footer actions vary across confirm, alert, and custom dialogs.</li>
          <li>Practice: <a [routerLink]="['/html','coding','html-dialog-confirm-a11y']">Modal / Confirm Dialog</a>.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>Tabs API</h3>
        <p>
          Contract: controlled active value, item ids, <code>onValueChange</code>, disabled tab
          policy, roving tabindex, and linked tabpanel ids.
        </p>
        <ul>
          <li>Use stable string ids instead of array indexes when panels can reorder.</li>
          <li>Clarify whether disabled tabs are skipped by Arrow keys.</li>
          <li>Practice: <a [routerLink]="['/react','coding','react-tabs-switcher']">React Tabs</a>.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>Autocomplete API</h3>
        <p>
          Contract: <code>inputValue</code> vs selected value, <code>onInputChange</code>,
          <code>onSelect</code>, async loading/error/empty states, stale response policy, and
          <code>renderOption</code> for custom rows.
        </p>
        <ul>
          <li>Separate typed text from committed selection so clearing and editing are predictable.</li>
          <li>Ignore stale responses or track request identity before rendering options.</li>
          <li>Practice: <a [routerLink]="['/react','coding','react-autocomplete-search-starter']">React Autocomplete</a>.</li>
        </ul>
      </div>
    </div>
    <p>
      Minimal example: these two types show the difference between state ownership and
      domain event payloads. In an interview, write only enough shape to make the contract
      testable before implementing behavior.
    </p>
    <div class="code-wrap">
      <pre><code>type DialogProps = &#123;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: 'trigger' | 'escape' | 'confirm' | 'cancel') =&gt; void;
  title: string;
  description?: string;
  children: React.ReactNode;
&#125;;

type SelectEvent&lt;T&gt; = &#123;
  value: string;
  item: T;
  reason: 'keyboard' | 'pointer' | 'programmatic';
&#125;;</code></pre>
    </div>

    <h2 id="api-round-flow">45/60-minute component API round flow</h2>
    <ul class="table-summary">
      <li>Spend the first minutes clarifying consumers and state ownership.</li>
      <li>Define the public surface before coding.</li>
      <li>Use the final minutes to explain trade-offs and skipped escape hatches.</li>
    </ul>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Move</th><th>Signal</th></tr>
        </thead>
        <tbody>
          <tr><td>0-5 min</td><td>Clarify consumers, data shape, ownership, keyboard expectations, and required customization.</td><td>You design for the caller, not just the demo.</td></tr>
          <tr><td>5-12 min</td><td>Define contract: props, events, slots, state ownership, accessibility labels, and styling surface.</td><td>Your API is explainable before implementation.</td></tr>
          <tr><td>12-30 min</td><td>Ship MVP behavior with the smallest API that supports the prompt.</td><td>You can implement without over-designing.</td></tr>
          <tr><td>30-45 min</td><td>Add a11y/keyboard, event payloads, controlled mode, disabled/error/loading states.</td><td>You know frontend correctness lives in contracts.</td></tr>
          <tr><td>45-60 min</td><td>Explain trade-offs, name follow-ups, and identify what you intentionally did not expose.</td><td>You can reason like a component owner.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="what-interviewers-score">What interviewers score</h2>
    <ul class="score-list">
      <li><strong>Clear contract:</strong> props, events, slots, and ownership are named before complexity grows.</li>
      <li><strong>State ownership:</strong> controlled/uncontrolled decisions match the caller and prompt constraints.</li>
      <li><strong>Event payloads:</strong> domain payloads carry useful data and reasons without leaking internals.</li>
      <li><strong>A11y contract:</strong> labels, ids, ARIA linkage, keyboard paths, and focus behavior are explicit.</li>
      <li><strong>Styling surface:</strong> variants, size, className, and CSS variables are enough without exposing everything.</li>
      <li><strong>Trade-off narration:</strong> you can name the API you skipped and why it was not needed yet.</li>
    </ul>

    <h2 id="skip-vs-prioritize">What to skip vs prioritize</h2>
    <ul class="table-summary">
      <li>Prioritize the contract, a11y, state ownership, event payloads, and one dry run.</li>
      <li>Save compound components, render hooks, refs, and slot props for follow-up depth.</li>
      <li>Skip theme engines, virtualization, global config, and library-grade APIs unless asked.</li>
    </ul>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Priority</th><th>Do this</th><th>Avoid spending time on</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Prioritize</strong></td><td>Clear contract, state ownership, event payload, a11y, styling surface, and a dry run.</td><td>Inventing a generic component library before the prompt works.</td></tr>
          <tr><td><strong>Know lightly</strong></td><td>Compound components, slot props, render hooks, refs, and escape hatches as follow-ups.</td><td>Over-abstracted state reducers in the first implementation pass.</td></tr>
          <tr><td><strong>Skip unless asked</strong></td><td>Theme engines, polymorphic components, portals, virtualization, and global config systems.</td><td>Excessive escape hatches that make the API harder to explain.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="choose-your-next-practice-format">Choose your next practice format</h2>
    <div class="format-grid" data-testid="api-format-links">
      <a class="format-link" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'ui' }">
        <strong>UI component drills</strong>
        <span>Practice prompts where API choices become working component behavior.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','ui-interviews']">
        <strong>Frontend UI interview map</strong>
        <span>Pair API design with accessibility-first component execution.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
        <strong>Frontend coding strategy</strong>
        <span>Place API design decisions inside the broader machine coding rubric.</span>
      </a>
    </div>

    <h2 id="component-api-design-faq">Component API design FAQ</h2>
    <div data-testid="api-guide-faq">
      <h3>What is component API design?</h3>
      <p>
        Component API design is the way you define how another engineer consumes your
        component: props, events, slots, state ownership, accessibility labels, styling hooks,
        and escape hatches.
      </p>
      <h3>How do I practice component API design for frontend interviews?</h3>
      <p>
        Pick a real prompt like Modal, Tabs, Autocomplete, or Data Table. Name the
        API contract first, then implement the MVP, keyboard support, a11y contract,
        styling surface, and trade-offs.
      </p>
      <h3>What is the controlled vs uncontrolled component API pattern?</h3>
      <p>
        Say who owns the state. Controlled components receive state and callbacks from the parent;
        uncontrolled components manage local state but can expose defaults and change events.
      </p>
      <h3>When should I use compound components or slots?</h3>
      <p>
        Use compound components or slots when the content shape varies, such as Modal, Tabs,
        Accordion, Menu, or Table prompts. Use simple props for stable, small choices.
      </p>
      <h3>How should component APIs expose events and accessibility?</h3>
      <p>
        Prefer domain payloads like <code>onSelect(&#123; value, item, reason &#125;)</code>
        instead of raw DOM events. Accessibility is part of the public API too: labels,
        ids, ARIA relationships, keyboard behavior, visible focus, and focus restore
        should be named in the contract.
      </p>
      <h3>How should TypeScript shape a component API?</h3>
      <p>
        TypeScript should make invalid component states harder to express. Use native prop
        mirroring, controlled/uncontrolled unions, mutually exclusive props, discriminated
        unions, and ref forwarding only where they clarify the public contract.
      </p>
      <h3>Which real library patterns help in component API interviews?</h3>
      <p>
        Useful patterns include React controlled/uncontrolled state, Radix asChild composition,
        MUI slotProps, React Aria hooks, and Headless UI render props. Use them as reference
        points, not as APIs to copy blindly.
      </p>
      <h3>How is this component API design guide reviewed?</h3>
      <p>
        FrontendAtlas reviews this guide against UI component drills, live coding editor
        checks, and interview blueprint scoring rubrics so the advice stays tied to
        timed interview execution.
      </p>
      <h3>How do I choose between prop-heavy, composed, and controlled component APIs?</h3>
      <p>
        Use a prop-heavy API only for a small stable surface, use composition when callers
        need custom content, and use controlled state when a parent must coordinate validation,
        analytics, reset, loading, or URL state.
      </p>
    </div>
  </fa-guide-shell>
  `
})
export class ComponentApiDesignArticle {
  readonly editorialAuthor = PUBLIC_EDITORIAL_FACTS.author.name;
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;

  activeTradeoff: ApiSurfaceTradeoff = 'composed';

  readonly tradeoffExamples: Record<ApiSurfaceTradeoff, ApiSurfaceTradeoffExample> = {
    'prop-heavy': {
      snippet: `<Button
  iconName="download"
  iconPosition="left"
  iconSize="sm"
  iconColor="muted"
  onIconHover={trackHover}
/>`,
      signal: 'You can ship a fast MVP, but every new variation becomes another top-level prop.',
      risk: 'Prop-heavy APIs drift into boolean soup and make later composition harder.',
    },
    composed: {
      snippet: `<Button>
  <DownloadIcon aria-hidden="true" />
  Export CSV
</Button>`,
      signal: 'The caller owns custom content while the component keeps button semantics and focus behavior.',
      risk: 'Composition needs clear a11y guidance so callers do not pass confusing markup.',
    },
    controlled: {
      snippet: `<Button
  pressed={isExporting}
  onPressedChange={setIsExporting}
  disabled={isExporting}
/>`,
      signal: 'State ownership is explicit, so parent flows can coordinate loading, analytics, and reset.',
      risk: 'Controlled APIs add callback and sync edge cases if the prompt only needs a static button.',
    },
  };

  get activeTradeoffExample(): ApiSurfaceTradeoffExample {
    return this.tradeoffExamples[this.activeTradeoff];
  }

  setTradeoff(tradeoff: ApiSurfaceTradeoff): void {
    this.activeTradeoff = tradeoff;
  }
}
