// -----------------------------------------------------------------------------
// Component API Design for Frontend Interviews
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

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
    .score-list li {
      font-size: 0.92rem;
    }
    .decision-panel ul,
    .worked-panel ul {
      margin-bottom: 0;
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
      Last updated: June 2026 | Author: FrontendAtlas Team | Reviewed by FrontendAtlas
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

    <h2 id="component-api-prompts">Component API design patterns interviewers ask about</h2>
    <p>
      These prompts expose different API decisions: controlled state, composition, event
      payloads, a11y contracts, styling hooks, and when to keep the surface area small.
    </p>
    <div class="prompt-grid" data-testid="api-prompt-cards">
      <a class="prompt-card" [routerLink]="['/html','coding','html-dialog-confirm-a11y']" data-testid="api-prompt-modal-dialog">
        <div class="prompt-meta"><span>Dialog</span><span>A11y</span></div>
        <h3>Modal / Confirm Dialog</h3>
        <p>API contract: <code>open</code>, <code>defaultOpen</code>, <code>onOpenChange</code>, title, description, actions.</p>
        <p class="prompt-card__focus">Trade-off/test focus: controlled vs uncontrolled, focus restore, Escape policy, slots.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-tabs-switcher']" data-testid="api-prompt-tabs">
        <div class="prompt-meta"><span>Tabs</span><span>State</span></div>
        <h3>Tabs</h3>
        <p>API contract: <code>value</code>, <code>defaultValue</code>, <code>onValueChange</code>, item ids, disabled tabs.</p>
        <p class="prompt-card__focus">Trade-off/test focus: roving tabindex, tabpanel linkage, controlled active value.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-accordion-faq']" data-testid="api-prompt-accordion">
        <div class="prompt-meta"><span>Disclosure</span><span>Policy</span></div>
        <h3>Accordion</h3>
        <p>API contract: <code>type</code>, <code>value</code>, <code>defaultValue</code>, <code>collapsible</code>, <code>onValueChange</code>.</p>
        <p class="prompt-card__focus">Trade-off/test focus: single vs multiple sections, button semantics, disabled items.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-autocomplete-search-starter']" data-testid="api-prompt-autocomplete">
        <div class="prompt-meta"><span>Combobox</span><span>Async</span></div>
        <h3>Autocomplete / Combobox</h3>
        <p>API contract: <code>inputValue</code>, <code>selectedValue</code>, <code>onInputChange</code>, <code>onSelect</code>, <code>renderOption</code>.</p>
        <p class="prompt-card__focus">Trade-off/test focus: async states, stale responses, keyboard selection, option identity.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-contact-form-starter']" data-testid="api-prompt-contact-form">
        <div class="prompt-meta"><span>Forms</span><span>Validation</span></div>
        <h3>Contact Form</h3>
        <p>API contract: field schema, validation timing, <code>onSubmit(values)</code>, errors, disabled submit.</p>
        <p class="prompt-card__focus">Trade-off/test focus: controlled fields, accessible errors, submit lifecycle.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-pagination-table']" data-testid="api-prompt-pagination-table">
        <div class="prompt-meta"><span>Table</span><span>Pagination</span></div>
        <h3>Data Table / Pagination</h3>
        <p>API contract: <code>rows</code>, columns, <code>page</code>, <code>pageSize</code>, <code>onPageChange</code>, empty state.</p>
        <p class="prompt-card__focus">Trade-off/test focus: derived rows, page bounds, cell renderers, table semantics.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-dynamic-table']" data-testid="api-prompt-dynamic-table">
        <div class="prompt-meta"><span>Table</span><span>Columns</span></div>
        <h3>Dynamic Table</h3>
        <p>API contract: column descriptors, accessors, header labels, fallback renderers, stable row keys.</p>
        <p class="prompt-card__focus">Trade-off/test focus: typed columns, missing values, sort follow-up, prop explosion.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-checkboxes']" data-testid="api-prompt-nested-checkboxes">
        <div class="prompt-meta"><span>Tree</span><span>Selection</span></div>
        <h3>Nested Checkbox Tree</h3>
        <p>API contract: nodes, selected ids, <code>onCheckedChange(ids)</code>, indeterminate state, disabled nodes.</p>
        <p class="prompt-card__focus">Trade-off/test focus: parent-child sync, controlled selection, reset, traversal cost.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-star-rating']" data-testid="api-prompt-star-rating">
        <div class="prompt-meta"><span>Input</span><span>Rating</span></div>
        <h3>Star Rating</h3>
        <p>API contract: <code>value</code>, <code>max</code>, <code>readOnly</code>, <code>onValueChange</code>, labels.</p>
        <p class="prompt-card__focus">Trade-off/test focus: hover preview vs committed value, keyboard input, a11y names.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-progress-bar-thresholds']" data-testid="api-prompt-progress-bar">
        <div class="prompt-meta"><span>Status</span><span>Feedback</span></div>
        <h3>Progress Bar</h3>
        <p>API contract: <code>value</code>, <code>min</code>, <code>max</code>, threshold colors, label, reduced motion.</p>
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

    <h2 id="component-api-design-faq">FAQ</h2>
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
    </div>
  </fa-guide-shell>
  `
})
export class ComponentApiDesignArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
