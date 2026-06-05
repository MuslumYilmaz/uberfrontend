// -----------------------------------------------------------------------------
// Frontend Coding Interview Questions and Prep Guide
// Purpose
//   - Target frontend coding interview questions/prep intent.
//   - Keep /machine-coding as the hands-on practice hub.
//   - Give candidates a question map, scoring rubric, and timed strategy.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: `
    a {
      color: #4ea1ff;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s, text-decoration 0.2s;
    }
    a:hover {
      color: #82c7ff;
      text-decoration: underline;
    }
    .freshness {
      margin: 0 0 16px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
      font-size: 12px;
    }
    .signal-list,
    .next-links,
    .proof-stats,
    .prompt-card-grid,
    .worked-grid,
    .format-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 12px;
      padding-left: 0;
      list-style: none;
    }
    .signal-list li,
    .next-links a {
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 42%, var(--uf-border-subtle));
      padding: 10px 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 72%, transparent);
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
    .proof-stats {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
    .proof-stat {
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 84%, transparent);
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
    .proof-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
    }
    .proof-cta--primary {
      color: var(--uf-bg);
      background: var(--uf-accent);
      border-color: color-mix(in srgb, var(--uf-accent) 84%, var(--uf-border-subtle));
    }
    .prompt-card,
    .worked-panel,
    .format-link {
      min-width: 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      padding: 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
    }
    .prompt-card {
      display: grid;
      gap: 8px;
      text-decoration: none;
    }
    .prompt-card:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    }
    .prompt-card h3,
    .worked-panel h3,
    .format-link strong {
      margin: 0;
      color: var(--uf-text-primary);
    }
    .prompt-card p,
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
    .prompt-card__focus {
      font-size: 0.88rem;
    }
    .question-list li {
      margin-bottom: 10px;
    }
    .table-scroll {
      overflow-x: auto;
      margin: 14px 0;
    }
    table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    th,
    td {
      border: 1px solid var(--uf-border-subtle);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-surface-alt) 86%, transparent);
    }
    .mini-case {
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 42%, var(--uf-border-subtle));
      padding-left: 14px;
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
      min-width: 520px;
      color: var(--uf-text-primary);
      font-size: 0.85rem;
      line-height: 1.55;
    }
    .format-link {
      display: grid;
      gap: 6px;
      text-decoration: none;
    }
    .format-link:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    }
  `,
  template: `
  <fa-guide-shell
    title="Frontend Coding Interview Questions and Prep Guide (2026)"
    subtitle="How to prepare for UI coding, JavaScript utility, browser, framework, and async prompts without turning the round into random LeetCode practice."
    [minutes]="18"
    [tags]="['coding','ui','interview-prep']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="coding-guide-freshness">
      Last updated: June 2026 | Author: FrontendAtlas Team | Reviewed by FrontendAtlas
    </div>

    <p>
      Frontend coding interviews are usually not one pure algorithm round. The strongest
      candidates can move between JavaScript utilities, UI components, async state,
      browser behavior, and framework tradeoffs while still shipping a working result.
    </p>
    <p>
      Use this page as the prep guide and question map. When you are ready to build,
      move into <a [routerLink]="['/machine-coding']">Frontend machine coding questions</a>
      or the <a [routerLink]="['/coding']">coding practice workspace</a>.
    </p>

    <div class="practice-proof" data-testid="coding-guide-practice-proof">
      <div class="proof-stats" aria-label="FrontendAtlas coding practice proof">
        <div class="proof-stat">
          <strong>500+</strong>
          <span>practice questions</span>
        </div>
        <div class="proof-stat">
          <strong>3</strong>
          <span>guided plans</span>
        </div>
        <div class="proof-stat">
          <strong>Live</strong>
          <span>editor + checks</span>
        </div>
        <div class="proof-stat">
          <strong>Most asked</strong>
          <span>prompts</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="Coding guide practice actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/machine-coding']">
          Start machine coding practice
        </a>
        <a class="proof-cta" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'ui' }">
          Browse UI coding formats
        </a>
      </div>
    </div>

    <h2 id="what-front-end-coding-interviews-test">What frontend coding interviews test</h2>
    <p>
      Interviewers are not only checking whether the final answer passes a few examples.
      They are watching how you turn an ambiguous prompt into a small product-quality result.
    </p>
    <ul class="signal-list">
      <li><strong>Requirements.</strong> Restate the goal, clarify inputs, and name the smallest useful version.</li>
      <li><strong>Correctness.</strong> Handle happy path, empty state, invalid data, and race conditions.</li>
      <li><strong>UI behavior.</strong> Make clicks, keyboard control, focus, loading, and error states predictable.</li>
      <li><strong>State model.</strong> Keep source of truth, derived values, and async transitions understandable.</li>
      <li><strong>Communication.</strong> Explain tradeoffs while coding instead of going silent.</li>
      <li><strong>Verification.</strong> Test the result with concrete cases before polishing.</li>
    </ul>

    <h2 id="common-prompt-types">Common prompt types</h2>
    <p>
      Most frontend coding interview questions fall into a few repeatable buckets. Build
      practice around these buckets instead of memorizing isolated answers.
    </p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Prompt type</th>
            <th>Examples</th>
            <th>What it proves</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>UI and machine coding</td>
            <td>Autocomplete, dropdown, modal, tabs, table, checkbox tree, file explorer</td>
            <td>Visible behavior, interaction states, accessibility, component boundaries</td>
          </tr>
          <tr>
            <td>JavaScript utilities</td>
            <td>Debounce, throttle, memoize, once, promise pool, event delegation</td>
            <td>Closures, timers, async control flow, edge-case reasoning</td>
          </tr>
          <tr>
            <td>Browser, CSS, and debugging</td>
            <td>Event loop ordering, async/defer, layout shift, responsive navigation, stale state</td>
            <td>Platform knowledge, practical debugging, performance awareness</td>
          </tr>
          <tr>
            <td>Framework variants</td>
            <td>React search, Angular form flow, Vue list filtering, vanilla DOM widget</td>
            <td>Framework state, rendering model, effects, templates, and component lifecycle</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="most-asked-frontend-coding-prompts">Most asked frontend coding prompts</h2>
    <p>
      Start with these high-signal prompts before browsing the full question bank.
      Each one maps to the behavior interviewers usually break first: state ownership,
      async timing, edge cases, accessibility, and explanation quality.
    </p>
    <div class="prompt-card-grid" data-testid="coding-guide-prompt-cards">
      <a class="prompt-card" [routerLink]="['/react','coding','react-debounced-search']" data-testid="coding-prompt-debounced-search">
        <div class="prompt-meta"><span>Must know</span><span>Async UI</span></div>
        <h3>Debounced Search</h3>
        <p>Requirement: debounce input, fetch results, show loading/error states, and keep the latest query authoritative.</p>
        <p class="prompt-card__focus">Test focus: slow response cannot overwrite newer results.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-autocomplete-search-starter']" data-testid="coding-prompt-autocomplete">
        <div class="prompt-meta"><span>Must know</span><span>Keyboard</span></div>
        <h3>Autocomplete</h3>
        <p>Requirement: fetch suggestions, support keyboard selection, handle empty/no-results/error states, and preserve focus.</p>
        <p class="prompt-card__focus">Test focus: Arrow keys, Escape, selection, and stale responses.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-contact-form-starter']" data-testid="coding-prompt-contact-form">
        <div class="prompt-meta"><span>Forms</span><span>HTTP</span></div>
        <h3>Contact Form</h3>
        <p>Requirement: collect fields, validate required input, submit over HTTP, and surface API feedback.</p>
        <p class="prompt-card__focus">Test focus: disabled submit, invalid fields, retry, and success state.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-multi-step-signup']" data-testid="coding-prompt-multi-step">
        <div class="prompt-meta"><span>Forms</span><span>State</span></div>
        <h3>Multi-step Signup</h3>
        <p>Requirement: persist step data, validate before advancing, support back navigation, and recover from invalid drafts.</p>
        <p class="prompt-card__focus">Test focus: step ownership, partial progress, and navigation boundaries.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-checkboxes']" data-testid="coding-prompt-nested-checkbox">
        <div class="prompt-meta"><span>Tree state</span><span>Derived</span></div>
        <h3>Nested Checkbox Tree</h3>
        <p>Requirement: sync parent, child, and indeterminate states across recursive nested data.</p>
        <p class="prompt-card__focus">Test focus: partial selection, select-all, deselect, and stable derived state.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-pagination-table']" data-testid="coding-prompt-data-table">
        <div class="prompt-meta"><span>Tables</span><span>Pagination</span></div>
        <h3>Data Table</h3>
        <p>Requirement: paginate rows, sort predictably, handle empty pages, and keep row identity stable.</p>
        <p class="prompt-card__focus">Test focus: page reset, empty results, sort order, and client/server tradeoffs.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-shopping-cart']" data-testid="coding-prompt-shopping-cart">
        <div class="prompt-meta"><span>Collections</span><span>Totals</span></div>
        <h3>Shopping Cart</h3>
        <p>Requirement: add/remove items, update quantities, derive totals, and block invalid cart states.</p>
        <p class="prompt-card__focus">Test focus: quantity boundaries, immutable updates, and derived totals.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-nested-comments']" data-testid="coding-prompt-nested-comments">
        <div class="prompt-meta"><span>Recursive UI</span><span>Local state</span></div>
        <h3>Nested Comments</h3>
        <p>Requirement: render nested replies, add comments at the right level, and keep edit/reply state scoped.</p>
        <p class="prompt-card__focus">Test focus: one active reply input, deep nesting, and stable item identity.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-tabs-switcher']" data-testid="coding-prompt-tabs">
        <div class="prompt-meta"><span>Component API</span><span>Keyboard</span></div>
        <h3>Tabs</h3>
        <p>Requirement: switch panels, preserve active tab state, support arrow keys, and connect labels to panels.</p>
        <p class="prompt-card__focus">Test focus: roving focus, disabled tabs, and active panel rendering.</p>
      </a>
      <a class="prompt-card" [routerLink]="['/react','coding','react-accordion-faq']" data-testid="coding-prompt-accordion">
        <div class="prompt-meta"><span>Disclosure</span><span>A11y</span></div>
        <h3>Accordion</h3>
        <p>Requirement: open one or many panels, use semantic controls, and keep keyboard behavior predictable.</p>
        <p class="prompt-card__focus">Test focus: controlled state, disabled panels, and disclosure semantics.</p>
      </a>
    </div>

    <h2 id="frontend-coding-interview-questions">25 frontend coding interview questions to practice</h2>
    <p>
      This list matches the ItemList schema for the page. Use it as a practice checklist,
      then open the dedicated practice surfaces for timed implementation.
    </p>

    <h3>UI and machine coding prompts</h3>
    <ol class="question-list" data-testid="coding-guide-question-list">
      <li id="question-1"><strong>Build accessible autocomplete with debounce and keyboard selection.</strong> Cover async state, stale responses, focus, loading, no-results, and error states.</li>
      <li id="question-2"><strong>Implement a dropdown menu with mouse, keyboard, and Escape behavior.</strong> Clarify outside-click behavior, focus return, and menu semantics.</li>
      <li id="question-3"><strong>Build a modal dialog with focus trap and dismissal behavior.</strong> Add accessible labeling, Escape handling, overlay click policy, and scroll control.</li>
      <li id="question-4"><strong>Create tabs with roving keyboard focus.</strong> Keep active state, keyboard navigation, and panel rendering simple.</li>
      <li id="question-5"><strong>Build an accordion or FAQ component.</strong> Decide whether multiple sections can stay open and how controlled state should work.</li>
      <li id="question-6"><strong>Implement a star rating component.</strong> Handle hover, keyboard input, selected value, read-only mode, and form integration.</li>
      <li id="question-7"><strong>Build a paginated and sortable data table.</strong> Explain sorting rules, stable row identity, empty states, and page reset behavior.</li>
      <li id="question-8"><strong>Build a nested checkbox tree with indeterminate parents.</strong> Model parent-child selection and derived partial state carefully.</li>
      <li id="question-9"><strong>Implement a file explorer tree from nested JSON.</strong> Use recursion, expansion state, and predictable folder/file interactions.</li>
      <li id="question-10"><strong>Build a multi-step form with validation and persisted draft state.</strong> Cover validation timing, navigation, and recovery from invalid or stale drafts.</li>
    </ol>

    <h3>JavaScript utility prompts</h3>
    <ol class="question-list" start="11">
      <li id="question-11"><strong>Implement debounce.</strong> Preserve arguments, context, cancellation, and the last invocation.</li>
      <li id="question-12"><strong>Implement throttle.</strong> Explain leading and trailing behavior before coding.</li>
      <li id="question-13"><strong>Implement once or memoize.</strong> Clarify cache keys, return values, errors, and repeated calls.</li>
      <li id="question-14"><strong>Build a promise pool with a concurrency limit.</strong> Keep result ordering, error behavior, and queue state explicit.</li>
      <li id="question-15"><strong>Implement a cancellable fetch wrapper that ignores stale responses.</strong> Use request IDs or AbortController and explain tradeoffs.</li>
      <li id="question-16"><strong>Write an event delegation helper for dynamic list items.</strong> Handle matching, bubbling, cleanup, and nested targets.</li>
      <li id="question-17"><strong>Build an LRU cache for API responses.</strong> Use Map ordering and explain eviction policy.</li>
      <li id="question-18"><strong>Flatten nested data or safely deep clone an object.</strong> Name limits around circular references, functions, dates, and large inputs.</li>
    </ol>

    <h3>Browser, CSS, and debugging prompts</h3>
    <ol class="question-list" start="19">
      <li id="question-19"><strong>Explain async versus defer and script loading behavior.</strong> Tie the answer to parsing, execution order, and render blocking.</li>
      <li id="question-20"><strong>Debug event loop ordering with promises and timers.</strong> Narrate microtasks, macrotasks, and rendering timing.</li>
      <li id="question-21"><strong>Fix layout shift in a responsive card grid.</strong> Stabilize media dimensions and content height before polishing styles.</li>
      <li id="question-22"><strong>Build responsive navigation with an accessible mobile menu.</strong> Use semantic buttons, focus behavior, and viewport-safe layout.</li>
    </ol>

    <h3>React, Angular, Vue, and vanilla variants</h3>
    <ol class="question-list" start="23">
      <li id="question-23"><strong>Debug stale state in a React search component.</strong> Connect hooks, closures, effects, request races, and derived state.</li>
      <li id="question-24"><strong>Build an optimistic todo list with rollback on failure.</strong> Cover temporary IDs, mutation status, error recovery, and user feedback.</li>
      <li id="question-25"><strong>Design a shopping cart or transfer list with derived totals and selection.</strong> Keep source state and computed values separate.</li>
    </ol>

    <h2 id="evaluation-rubric">Evaluation rubric</h2>
    <p>
      A partial solution can still score well if the interviewer can see the right
      shape. Use this rubric during practice and during the last five minutes of
      the real round.
    </p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Weak answer</th>
            <th>Strong answer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scope</td>
            <td>Starts coding without clarifying behavior.</td>
            <td>Defines MVP, edge cases, and stretch goals before building.</td>
          </tr>
          <tr>
            <td>Implementation</td>
            <td>Large rewrite, hidden state, no visible checkpoint.</td>
            <td>Small working version first, then state, async, and polish layers.</td>
          </tr>
          <tr>
            <td>Frontend quality</td>
            <td>Mouse-only UI with missing empty/error/loading states.</td>
            <td>Keyboard, focus, accessibility, error paths, and responsive behavior considered.</td>
          </tr>
          <tr>
            <td>Testing</td>
            <td>Only tries the happy path once.</td>
            <td>Checks empty input, slow network, invalid data, repeated actions, and boundaries.</td>
          </tr>
          <tr>
            <td>Communication</td>
            <td>Goes silent or over-explains unrelated theory.</td>
            <td>Narrates decisions, names tradeoffs, and summarizes remaining work honestly.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="timed-strategy">45-minute and 60-minute interview strategy</h2>
    <p>
      Time pressure is part of the test. The goal is not a perfect app; it is a
      credible implementation path with a running checkpoint.
    </p>
    <h3>45-minute round</h3>
    <ol>
      <li><strong>0-5 min:</strong> restate requirements, confirm must-haves, and choose the smallest working scope.</li>
      <li><strong>5-20 min:</strong> build the baseline UI or utility with clear state and one happy path.</li>
      <li><strong>20-35 min:</strong> add edge cases: empty, loading, error, repeated actions, keyboard, or race conditions.</li>
      <li><strong>35-45 min:</strong> verify manually, explain tradeoffs, and name what you would harden next.</li>
    </ol>
    <h3>60-minute round</h3>
    <ol>
      <li><strong>0-10 min:</strong> clarify scope, inputs, constraints, state model, and examples.</li>
      <li><strong>10-30 min:</strong> ship a visible MVP or passing utility implementation.</li>
      <li><strong>30-45 min:</strong> cover edge states, async races, accessibility, and framework-specific behavior.</li>
      <li><strong>45-55 min:</strong> test the important paths and simplify naming or component boundaries.</li>
      <li><strong>55-60 min:</strong> summarize behavior, tradeoffs, production hardening, and remaining gaps.</li>
    </ol>

    <h2 id="worked-example">Worked example: autocomplete</h2>
    <p>
      Autocomplete is a high-signal frontend coding interview question because it
      compresses async state, keyboard UX, stale network responses, and accessibility
      into one prompt.
    </p>
    <p>
      Open the hands-on version when you want to implement it:
      <a [routerLink]="['/react','coding','react-autocomplete-search-starter']">Autocomplete Search Bar (Hooks)</a>.
    </p>
    <div class="worked-grid" data-testid="coding-guide-worked-example">
      <article class="worked-panel">
        <h3>Clarify first</h3>
        <ul>
          <li>What data shape does the suggestion API return?</li>
          <li>Should empty input clear results immediately?</li>
          <li>Which interactions must work by keyboard, mouse, blur, and Escape?</li>
        </ul>
      </article>
      <article class="worked-panel">
        <h3>State model</h3>
        <ul>
          <li><code>query</code>, <code>status</code>, <code>results</code>, <code>highlightedIndex</code>, <code>selectedItem</code>.</li>
          <li><code>requestId</code> or <code>AbortController</code> for stale response protection.</li>
          <li>Optional cache only after the baseline behavior works.</li>
        </ul>
      </article>
      <article class="worked-panel">
        <h3>Stale response policy</h3>
        <ul>
          <li>Increment a request token before every fetch.</li>
          <li>Ignore any response whose token is not the latest token.</li>
          <li>Reset loading only for the active request.</li>
        </ul>
      </article>
      <article class="worked-panel">
        <h3>Keyboard and a11y checks</h3>
        <ul>
          <li>Arrow keys move highlight without losing input focus.</li>
          <li>Enter selects, Escape closes, and blur/click behavior is intentional.</li>
          <li>Use combobox/listbox semantics when the custom UI needs them.</li>
        </ul>
      </article>
    </div>
    <div class="code-wrap">
      <pre><code>type AutocompleteState = &#123;
  query: string;
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  results: Suggestion[];
  highlightedIndex: number;
  selectedItem: Suggestion | null;
&#125;;

// Interview-safe stale response guard:
// only the newest request is allowed to update visible results.
let latestRequestId = 0;
const requestId = ++latestRequestId;
const results = await fetchSuggestions(query);
if (requestId !== latestRequestId) return;</code></pre>
    </div>

    <h2 id="choose-your-practice-format">Choose your practice format</h2>
    <p>
      Use <a [routerLink]="['/machine-coding']">Frontend machine coding questions</a>
      as the main hands-on route, then jump into the exact format your interview loop expects.
    </p>
    <div class="format-grid" data-testid="coding-guide-format-links">
      <a class="format-link" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'js-fn' }">
        <strong>JavaScript utilities</strong>
        <span>Debounce, throttle, promise utilities, closures, and async control flow.</span>
      </a>
      <a class="format-link" [routerLink]="['/react','interview-questions']">
        <strong>React machine coding</strong>
        <span>Hooks, state ownership, lists, forms, async UI, and component boundaries.</span>
      </a>
      <a class="format-link" [routerLink]="['/angular','interview-questions']">
        <strong>Angular machine coding</strong>
        <span>Components, forms, RxJS flows, services, and template state.</span>
      </a>
      <a class="format-link" [routerLink]="['/vue','interview-questions']">
        <strong>Vue machine coding</strong>
        <span>Composition API, reactivity, forms, events, and component communication.</span>
      </a>
      <a class="format-link" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'html-css' }">
        <strong>HTML/CSS UI coding</strong>
        <span>Layouts, semantics, responsive states, accessibility, and visual correctness.</span>
      </a>
      <a class="format-link" [routerLink]="['/system-design']">
        <strong>System design follow-up</strong>
        <span>Turn the working UI into architecture, caching, performance, and tradeoff discussion.</span>
      </a>
    </div>

    <h2 id="common-mistakes">Common mistakes</h2>
    <ul>
      <li><strong>Practicing only algorithms.</strong> Frontend rounds often test product behavior, browser APIs, UI state, and async flow.</li>
      <li><strong>Skipping the prompt contract.</strong> Write down inputs, outputs, constraints, and examples before coding.</li>
      <li><strong>Polishing before shipping.</strong> A running baseline beats a perfect-looking half-solution.</li>
      <li><strong>Ignoring accessibility.</strong> Keyboard, focus, labels, and announcements are visible seniority signals.</li>
      <li><strong>Not testing edge cases.</strong> Empty input, null data, repeated actions, and slow responses expose most failures.</li>
      <li><strong>Going silent.</strong> Explain your next step, tradeoff, or uncertainty so the interviewer can grade your thinking.</li>
    </ul>

    <h2 id="what-to-practice-next">What to practice next</h2>
    <p>
      Use this guide to choose the right next practice surface. Keep
      <code>/machine-coding</code> as the hands-on hub and use this URL as the prep map.
    </p>
    <div class="next-links">
      <a [routerLink]="['/machine-coding']">Frontend machine coding questions</a>
      <a [routerLink]="['/coding']">Frontend coding interview practice workspace</a>
      <a [routerLink]="['/guides','interview-blueprint','javascript-interviews']">JavaScript interview patterns and answers</a>
      <a [routerLink]="['/guides','interview-blueprint','ui-interviews']">Frontend UI interview execution guide</a>
      <a [routerLink]="['/guides','interview-blueprint','dsa-for-fe']">DSA for frontend interviews</a>
      <a [routerLink]="['/guides','interview-blueprint','intro']">Frontend interview preparation guide</a>
      <a [routerLink]="['/guides','framework-prep']">Framework prep paths</a>
    </div>

    <h2 id="frontend-coding-interview-faq">FAQ</h2>
    <div data-testid="coding-guide-faq">
      <h3>What questions are asked in frontend coding interviews?</h3>
      <p>
        Frontend coding interviews usually mix UI component prompts, JavaScript
        utility functions, async bugs, browser behavior, CSS/layout details,
        framework state questions, and follow-up discussion about accessibility,
        testing, and performance.
      </p>
      <h3>How do I prepare for a frontend coding interview?</h3>
      <p>
        Practice timed frontend coding prompts, start with requirements and a
        small working version, add edge cases, explain tradeoffs out loud, and
        review one miss after every session before moving to the next problem.
      </p>
      <h3>Is a frontend coding interview the same as LeetCode?</h3>
      <p>
        No. Some roles include algorithms, but frontend coding interviews often
        reward product UI behavior, DOM or framework state, async correctness,
        accessibility, and practical debugging more than pure data-structure puzzles.
      </p>
      <h3>Should I use React or vanilla JavaScript in frontend coding interviews?</h3>
      <p>
        Use the tool the interviewer allows and your target role expects. React
        is common for UI rounds, but vanilla JavaScript fundamentals still matter
        for event handling, promises, DOM behavior, debounce, throttle, and state timing.
      </p>
      <h3>How are frontend UI coding interviews evaluated?</h3>
      <p>
        Interviewers score visible correctness, state design, component boundaries,
        async behavior, empty/loading/error states, accessibility, tests or manual
        verification, and how clearly you narrate tradeoffs under time pressure.
      </p>
      <h3>What should I do in the first 10 minutes of a 60-minute coding interview?</h3>
      <p>
        Clarify the prompt, define the smallest working scope, list edge cases,
        sketch state and events, then start shipping a visible baseline before
        adding polish or abstractions.
      </p>
    </div>
  </fa-guide-shell>
  `
})
export class FeCodingArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
