// features/guides/playbook/fe-ui-in-60.component.ts
// -----------------------------------------------------------------------------
// Frontend UI Interviews
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
      text-decoration: none;
      font-weight: 600;
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
    .worked-grid,
    .answer-grid,
    .rubric-grid,
    .concept-grid,
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
    .answer-card,
    .rubric-item,
    .concept-card,
    .worked-panel,
    .format-link {
      min-width: 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      padding: 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
    }
    .answer-first {
      margin: 16px 0 20px;
      padding: 14px;
      border: 1px solid var(--uf-border-subtle);
      border-left: 3px solid var(--uf-accent);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 78%, transparent);
    }
    .answer-first p {
      margin: 0 0 10px;
      color: var(--uf-text-primary);
      font-weight: 700;
    }
    .answer-first ul {
      margin: 0;
      padding-left: 20px;
    }
    .answer-first li {
      margin: 6px 0;
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
    .answer-card,
    .rubric-item,
    .concept-card,
    .format-link {
      display: grid;
      gap: 8px;
    }
    a.prompt-card,
    .format-link {
      text-decoration: none;
    }
    a.prompt-card:hover,
    .format-link:hover,
    .practice-link:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    }
    .prompt-card h3,
    .answer-card h3,
    .rubric-item strong,
    .concept-card h3,
    .worked-panel h3,
    .format-link strong {
      margin: 0;
      color: var(--uf-text-primary);
    }
    .prompt-card p,
    .answer-card p,
    .rubric-item span,
    .concept-card p,
    .worked-panel p,
    .format-link span {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .answer-card dl {
      display: grid;
      gap: 6px;
      margin: 0;
    }
    .answer-card dt {
      color: var(--uf-text-primary);
      font-weight: 700;
    }
    .answer-card dd {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .rubric-item strong {
      font-size: 1.35rem;
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
    .answer-card dd,
    .concept-card p,
    .worked-panel li,
    .score-list li {
      font-size: 0.92rem;
    }
    .worked-grid {
      margin: 14px 0;
    }
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
      min-width: 560px;
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
      min-width: 700px;
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
    title="Frontend UI Interview Questions: Build Accessible Components Under Time"
    subtitle="A practice-first map for shipping complete, accessible UI components under interview time pressure."
    [minutes]="22"
    [tags]="['ui','html','css','javascript','accessibility','practice-map']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="ui-guide-freshness">
      Last updated: June 2026 | Author: FrontendAtlas Team | Reviewed by FrontendAtlas
    </div>

    <p>
      In frontend UI interviews, the fastest way to score well is to ship a small
      component that works, then harden it with keyboard support, accessible semantics,
      responsive styling, and edge-case tests.
    </p>
    <div class="answer-first" data-testid="ui-guide-answer-first">
      <p>Short answer for this page</p>
      <ul>
        <li><strong>Most common UI prompts:</strong> modal, autocomplete, tabs, form validation, accordion, and data table.</li>
        <li><strong>Winning approach:</strong> ship the MVP first, then harden keyboard behavior, accessibility, responsive layout, and edge cases.</li>
        <li><strong>Senior signal:</strong> explain trade-offs and test failure states out loud while you code.</li>
      </ul>
    </div>
    <p>
      Use this page as a frontend UI interview practice map for a frontend UI coding
      interview. It keeps broad machine coding strategy out of scope and focuses on
      component interview questions, accessibility checks, and direct drills. If your
      round is a React UI coding interview, the same state, keyboard, and a11y signals
      still decide the score.
    </p>

    <div class="practice-proof" data-testid="ui-guide-practice-proof">
      <div class="proof-stats" aria-label="FrontendAtlas UI interview practice proof">
        <div class="proof-stat">
          <strong>500+</strong>
          <span>practice questions</span>
        </div>
        <div class="proof-stat">
          <strong>UI</strong>
          <span>component drills</span>
        </div>
        <div class="proof-stat">
          <strong>Live</strong>
          <span>editor + checks</span>
        </div>
        <div class="proof-stat">
          <strong>Accessibility-first</strong>
          <span>patterns</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="UI guide practice actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'ui' }">
          Start UI component drills
        </a>
        <a class="proof-cta" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
          Review frontend coding strategy
        </a>
      </div>
    </div>

    <h2 id="most-asked-frontend-ui-interview-prompts">Most asked frontend UI interview questions and component prompts</h2>
    <p>
      These prompts show up because they reveal the same signals: state ownership,
      keyboard behavior, ARIA semantics, responsive layout, and whether you can test
      a component before time runs out.
    </p>
    <div class="prompt-grid" data-testid="ui-prompt-cards">
      <a class="prompt-card" [routerLink]="['/html','coding','html-dialog-confirm-a11y']" data-testid="ui-prompt-modal-dialog">
        <div class="prompt-meta"><span>HTML</span><span>A11y</span></div>
        <h3>Modal / Confirm Dialog</h3>
        <p>Requirement: build an accessible modal that opens, confirms, cancels, closes, and restores focus.</p>
        <p class="prompt-card__focus">Test focus: accessible name, Escape, outside click policy, focus trap modal behavior.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-autocomplete-search-starter']" data-testid="ui-prompt-autocomplete">
        <div class="prompt-meta"><span>React</span><span>Async UI</span></div>
        <h3>Autocomplete</h3>
        <p>Requirement: build autocomplete with filtering, debounce, and mouse or keyboard selection.</p>
        <p class="prompt-card__focus">Test focus: debounce, loading, empty results, stale response policy.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-contact-form-starter']" data-testid="ui-prompt-contact-form">
        <div class="prompt-meta"><span>React</span><span>Forms</span></div>
        <h3>Contact Form</h3>
        <p>Requirement: solve an accessible form validation interview prompt with fields, submit, and feedback.</p>
        <p class="prompt-card__focus">Test focus: labels, required fields, disabled submit, error recovery.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-tabs-switcher']" data-testid="ui-prompt-tabs">
        <div class="prompt-meta"><span>React</span><span>Navigation</span></div>
        <h3>Tabs</h3>
        <p>Requirement: build tabs that switch panels and preserve active state.</p>
        <p class="prompt-card__focus">Test focus: roving tabindex, ARIA tabs linkage, Home/End keys.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/css','coding','css-flexbox-navbar']" data-testid="ui-prompt-css-navbar">
        <div class="prompt-meta"><span>CSS</span><span>Responsive layout</span></div>
        <h3>Responsive Flexbox Navbar</h3>
        <p>Requirement: practice a Flexbox navbar coding challenge with brand, links, CTA, and mobile behavior.</p>
        <p class="prompt-card__focus">Test focus: readable links, visible focus, flex-wrap, gap, and no hidden navigation.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-accordion-faq']" data-testid="ui-prompt-accordion">
        <div class="prompt-meta"><span>React</span><span>Disclosure</span></div>
        <h3>Accordion</h3>
        <p>Requirement: build an accordion with predictable expand and collapse state.</p>
        <p class="prompt-card__focus">Test focus: single vs multi-open policy, button semantics, keyboard toggles.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-pagination-table']" data-testid="ui-prompt-pagination-table">
        <div class="prompt-meta"><span>React</span><span>Tables</span></div>
        <h3>Data Table / Pagination</h3>
        <p>Requirement: build table rows, page controls, and derived visible data.</p>
        <p class="prompt-card__focus">Test focus: page bounds, derived rows, disabled controls, table semantics.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-dynamic-table']" data-testid="ui-prompt-dynamic-table">
        <div class="prompt-meta"><span>React</span><span>Data shaping</span></div>
        <h3>Dynamic Table</h3>
        <p>Requirement: render changing columns and rows from structured data.</p>
        <p class="prompt-card__focus">Test focus: stable keys, missing values, header mapping, sort follow-up.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-checkboxes']" data-testid="ui-prompt-nested-checkboxes">
        <div class="prompt-meta"><span>React</span><span>Tree state</span></div>
        <h3>Nested Checkbox Tree</h3>
        <p>Requirement: sync parent and child checkbox states in a tree.</p>
        <p class="prompt-card__focus">Test focus: indeterminate state, DFS updates, partial selection, reset.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-comments']" data-testid="ui-prompt-nested-comments">
        <div class="prompt-meta"><span>React</span><span>Nested UI</span></div>
        <h3>Nested Comments</h3>
        <p>Requirement: render reply trees with one active input at a time.</p>
        <p class="prompt-card__focus">Test focus: recursion depth, active state, empty replies, stable IDs.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-star-rating']" data-testid="ui-prompt-star-rating">
        <div class="prompt-meta"><span>React</span><span>Input widget</span></div>
        <h3>Star Rating</h3>
        <p>Requirement: build rating preview, select, reset, and announcements.</p>
        <p class="prompt-card__focus">Test focus: hover vs committed state, keyboard input, accessible labels.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-chips-input-autocomplete']" data-testid="ui-prompt-chips-autocomplete">
        <div class="prompt-meta"><span>React</span><span>Composite input</span></div>
        <h3>Chips Autocomplete</h3>
        <p>Requirement: add, remove, and suggest tags without duplicate chips.</p>
        <p class="prompt-card__focus">Test focus: keyboard removal, duplicate prevention, suggestions, empty input.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-progress-bar-thresholds']" data-testid="ui-prompt-progress-bar">
        <div class="prompt-meta"><span>React</span><span>Status UI</span></div>
        <h3>Progress Bar</h3>
        <p>Requirement: show bounded progress and threshold states clearly.</p>
        <p class="prompt-card__focus">Test focus: 0/100 bounds, ARIA progressbar, colors, reduced motion.</p>
      </a>
    </div>

    <h2 id="interview-answers-for-common-ui-prompts">Interview answers for common UI prompts</h2>
    <p>
      A strong answer names the behavior contract before code, ships the baseline,
      and then hardens accessibility and edge cases.
    </p>
    <div class="answer-grid" data-testid="ui-answer-cards">
      <article class="answer-card">
        <h3>Modal / Confirm Dialog</h3>
        <dl>
          <dt>What to say</dt>
          <dd>I will confirm close policy, use a semantic dialog, restore focus, and test Escape and Tab before visual polish.</dd>
          <dt>MVP</dt>
          <dd>Open, confirm, cancel, close, and show a visible title.</dd>
          <dt>Hardening</dt>
          <dd>Focus restore, accessible name, outside-click policy, and focus trap behavior.</dd>
        </dl>
      </article>
      <article class="answer-card">
        <h3>Autocomplete</h3>
        <dl>
          <dt>What to say</dt>
          <dd>I will separate input text, highlighted option, selected value, and request state so stale results cannot win.</dd>
          <dt>MVP</dt>
          <dd>Filter suggestions and select an option with mouse or Enter.</dd>
          <dt>Hardening</dt>
          <dd>Debounce, loading and empty states, Arrow keys, and stale response guards.</dd>
        </dl>
      </article>
      <article class="answer-card">
        <h3>Tabs</h3>
        <dl>
          <dt>What to say</dt>
          <dd>Tabs are navigation state: connect tab buttons to panels and keep keyboard movement predictable.</dd>
          <dt>MVP</dt>
          <dd>Track active tab state and render the matching panel.</dd>
          <dt>Hardening</dt>
          <dd>Roving tabindex, aria-controls, Home/End keys, and visible focus.</dd>
        </dl>
      </article>
      <article class="answer-card">
        <h3>Form Validation</h3>
        <dl>
          <dt>What to say</dt>
          <dd>I will choose validation timing, keep errors tied to fields, and make recovery obvious.</dd>
          <dt>MVP</dt>
          <dd>Fields, submit, required validation, and feedback after invalid input.</dd>
          <dt>Hardening</dt>
          <dd>Labels, aria-describedby, disabled-submit policy, recovery, and server errors.</dd>
        </dl>
      </article>
      <article class="answer-card">
        <h3>Data Table</h3>
        <dl>
          <dt>What to say</dt>
          <dd>I will derive visible rows from source data, page state, and filters instead of mutating the original list.</dd>
          <dt>MVP</dt>
          <dd>Rows, headers, pagination controls, and current page state.</dd>
          <dt>Hardening</dt>
          <dd>Bounds, empty state, disabled controls, table semantics, and stable keys.</dd>
        </dl>
      </article>
    </div>

    <h2 id="confirm-dialog-worked-example">Worked example: Confirm Dialog</h2>
    <p>
      The Confirm Dialog is a useful rehearsal prompt because it touches every scoring
      surface: markup, state, focus, keyboard behavior, and visual polish. Practice the
      direct drill here:
      <a [routerLink]="['/html','coding','html-dialog-confirm-a11y']">Modal: Native dialog confirm</a>.
    </p>
    <div class="worked-grid">
      <div class="worked-panel">
        <h3>Clarify checklist</h3>
        <ul>
          <li>Confirm the trigger, confirm action, cancel action, and close behavior.</li>
          <li>Ask whether outside click should close or be ignored.</li>
          <li>Name the accessible title and description before coding.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>DOM/state model</h3>
        <ul>
          <li>Track <code>isOpen</code>, <code>lastFocus</code>, and the active confirm/cancel callbacks.</li>
          <li>Keep the trigger button outside the dialog and restore focus after close.</li>
          <li>Use a small state surface before extracting helpers.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>Focus and keyboard policy</h3>
        <ul>
          <li><strong>Focus restore:</strong> save the trigger before opening.</li>
          <li><strong>Focus trap policy:</strong> cycle Tab and Shift+Tab inside the panel if asked.</li>
          <li><strong>Escape policy:</strong> close only when the dialog is open.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>A11y checks</h3>
        <ul>
          <li>Use <code>role="dialog"</code> or native <code>&lt;dialog&gt;</code> with an accessible name.</li>
          <li>Connect title and description with <code>aria-labelledby</code> and <code>aria-describedby</code>.</li>
          <li>Keep visible focus and respect reduced motion.</li>
        </ul>
      </div>
    </div>
    <div class="code-wrap">
      <pre><code>let isOpen = false;
let lastFocus = null;

function openDialog() &#123;
  lastFocus = document.activeElement;
  isOpen = true;
  dialog.hidden = false;
  confirmButton.focus();
&#125;

function closeDialog() &#123;
  isOpen = false;
  dialog.hidden = true;
  lastFocus?.focus();
&#125;

document.addEventListener('keydown', (event) =&gt; &#123;
  if (isOpen &amp;&amp; event.key === 'Escape') closeDialog();
&#125;);</code></pre>
    </div>

    <h2 id="junior-vs-senior-ui-interview-expectations">Junior vs senior UI interview expectations</h2>
    <div class="table-wrap" data-testid="ui-seniority-expectations">
      <table>
        <thead>
          <tr><th>Prompt</th><th>Junior answer</th><th>Senior answer</th></tr>
        </thead>
        <tbody>
          <tr><td>Modal</td><td>Toggle open state and close on button click.</td><td>Define close policy, accessible naming, focus restore, Escape behavior, and test keyboard paths.</td></tr>
          <tr><td>Autocomplete</td><td>Filter options as the user types.</td><td>Separate input, highlight, selected value, async state, stale response handling, and keyboard selection.</td></tr>
          <tr><td>Data Table</td><td>Render rows and pagination buttons.</td><td>Derive rows from source data, guard page bounds, handle empty states, and preserve stable keys.</td></tr>
          <tr><td>Form</td><td>Show required-field errors.</td><td>Choose validation timing, tie errors to fields, support recovery, and account for server-side failures.</td></tr>
          <tr><td>Tabs</td><td>Switch visible content when a tab is clicked.</td><td>Use button semantics, connect tabs to panels, support roving tabindex, Home/End keys, and visible focus.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="ui-round-flow">45/60-minute UI round flow</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Move</th><th>Signal</th></tr>
        </thead>
        <tbody>
          <tr><td>0-5 min</td><td>Clarify prompt, data shape, interactions, keyboard expectations, and edge cases.</td><td>You avoid hidden assumptions.</td></tr>
          <tr><td>5-15 min</td><td>Ship MVP markup and the smallest visible state path.</td><td>You can make progress quickly.</td></tr>
          <tr><td>15-30 min</td><td>Add state/interactions: open, close, select, reset, submit, or derived rows.</td><td>Your component behaves correctly.</td></tr>
          <tr><td>30-45 min</td><td>Harden keyboard/a11y, responsive styling, loading, empty, and error states.</td><td>You know frontend correctness is more than click demos.</td></tr>
          <tr><td>45-60 min</td><td>Dry run edge cases, explain trade-offs, and state what you would improve next.</td><td>You can verify and communicate under pressure.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="what-interviewers-score">What interviewers score</h2>
    <div class="rubric-grid" data-testid="ui-score-rubric">
      <div class="rubric-item"><strong>30</strong><span>MVP behavior: the core interaction works before polish.</span></div>
      <div class="rubric-item"><strong>20</strong><span>State correctness: no stale active item, invalid page, or duplicate chip.</span></div>
      <div class="rubric-item"><strong>20</strong><span>Accessibility and keyboard: labels, roles, focus, and key paths are covered.</span></div>
      <div class="rubric-item"><strong>10</strong><span>Edge cases: empty, loading, error, reset, and bounds are handled.</span></div>
      <div class="rubric-item"><strong>10</strong><span>Responsive polish: spacing, overflow, and visible focus hold on small screens.</span></div>
      <div class="rubric-item"><strong>10</strong><span>Communication and testing: trade-offs and failure states are explained out loud.</span></div>
    </div>
    <ul class="score-list">
      <li><strong>Component boundaries:</strong> clear props, local state, derived data, and callbacks.</li>
      <li><strong>State correctness:</strong> no stale active item, invalid page, duplicate chip, or stuck loading state.</li>
      <li><strong>Keyboard support:</strong> Escape, Enter, Arrow keys, Tab order, and focus restore where relevant.</li>
      <li><strong>ARIA and semantics:</strong> real buttons, labels, roles, names, descriptions, and table/list structure.</li>
      <li><strong>Visual polish:</strong> readable spacing, visible focus, responsive layout, and clear disabled/error states.</li>
      <li><strong>Debugging:</strong> logs state changes, checks selectors, tests odd paths, and explains fixes out loud.</li>
      <li><strong>Communication:</strong> names trade-offs and keeps the interviewer aware of scope decisions.</li>
    </ul>

    <h2 id="core-ui-concepts-interviewers-expect">Core UI concepts interviewers expect</h2>
    <div class="concept-grid" data-testid="ui-core-concepts">
      <article class="concept-card">
        <h3>Semantic HTML</h3>
        <p>Use real buttons, labels, forms, headings, lists, tables, and landmarks before custom roles.</p>
      </article>
      <article class="concept-card">
        <h3>Forms</h3>
        <p>Know label association, validation timing, disabled-submit policy, and server-error recovery.</p>
      </article>
      <article class="concept-card">
        <h3>Focus management</h3>
        <p>Track the active element, restore focus after overlays, and keep visible focus states intact.</p>
      </article>
      <article class="concept-card">
        <h3>Events</h3>
        <p>Understand click and keyboard handlers, propagation, delegation, and when default behavior matters.</p>
      </article>
      <article class="concept-card">
        <h3>Layout</h3>
        <p>Use Flexbox, Grid, intrinsic sizing, overflow handling, and responsive constraints deliberately.</p>
      </article>
      <article class="concept-card">
        <h3>Async UI state</h3>
        <p>Model loading, empty, error, retry, stale responses, and disabled states as explicit UI states.</p>
      </article>
    </div>

    <h2 id="skip-vs-prioritize">What to skip vs prioritize</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Priority</th><th>Do this</th><th>Avoid spending time on</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Prioritize</strong></td><td>Correct state, keyboard, a11y, empty/error/loading states, and a dry run.</td><td>Pixel-perfect mock matching before behavior works.</td></tr>
          <tr><td><strong>Know lightly</strong></td><td>Animations, transitions, theme polish, and microcopy if core behavior is done.</td><td>Complex animation systems or custom design systems.</td></tr>
          <tr><td><strong>Skip unless asked</strong></td><td>Heavy abstractions, virtualized rendering, portals, and generic component libraries.</td><td>Reusable architecture that slows down the prompt.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="choose-your-next-practice-format">Choose your next practice format</h2>
    <div class="format-grid" data-testid="ui-format-links">
      <a class="format-link" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'ui' }">
        <strong>UI component drills</strong>
        <span>Practice React, HTML, and CSS prompts with live editor checks.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
        <strong>Frontend coding strategy</strong>
        <span>Pair UI execution with machine coding scope, rubric, and follow-up strategy.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','api-design']">
        <strong>Component API design</strong>
        <span>Practice props, events, controlled state, and reusable component trade-offs.</span>
      </a>
    </div>

    <h2 id="frontend-ui-interviews-faq">FAQ</h2>
    <div data-testid="ui-guide-faq">
      <h3>What are the most common frontend UI interview questions?</h3>
      <p>
        Common frontend UI interview questions include modal dialogs, autocomplete,
        tabs, accordion, data tables, nested checkboxes, forms, star rating, and
        nested comments.
      </p>
      <h3>How do I practice frontend UI coding interview questions?</h3>
      <p>
        Practice one component at a time under 45 to 60 minutes. Ship the MVP first,
        then add keyboard support, ARIA semantics, responsive styling, edge cases,
        and a short trade-off explanation.
      </p>
      <h3>Which React UI component questions should I practice?</h3>
      <p>
        Start with autocomplete, tabs, accordion, data table pagination, nested checkbox
        tree, nested comments, star rating, chips autocomplete, and progress bar drills.
      </p>
      <h3>How do interviewers score accessibility and keyboard support?</h3>
      <p>
        Accessibility is core correctness. Interviewers expect labels, semantic controls,
        focus management, keyboard paths, visible focus, and clear disabled or error states.
      </p>
      <h3>What should a senior answer include in a UI interview?</h3>
      <p>
        A senior answer should state the behavior contract, ship an MVP, explain state
        ownership, harden keyboard and accessibility, cover failure states, and describe
        tests or trade-offs out loud.
      </p>
      <h3>Is this different from frontend machine coding interviews?</h3>
      <p>
        It overlaps with frontend machine coding interviews, but this page narrows the
        scope to UI component execution. Broader machine coding rounds can also include
        data fetching, routing, app state, and larger product workflows.
      </p>
    </div>
  </fa-guide-shell>
  `
})
export class FeUiIn60Article {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
