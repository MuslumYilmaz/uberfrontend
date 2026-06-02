import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Frontend System Design Interview Checklist: Final Review"
      [minutes]="10"
      [tags]="['system design', 'checklist', 'final review', 'cheatsheet']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <h2>If You Remember One Thing</h2>
      <p>
        Use this <strong>frontend system design interview checklist</strong> in the
        last few minutes of a mock or real round. It catches missing evidence before
        the interviewer has to ask: requirements, rendering, state, contracts, UI
        states, accessibility, performance, observability, trade-offs, and the close.
      </p>
      <p>
        This page is the final pass. Use the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'evaluation']">rubric</a>
        to score your answer, the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'pitfalls']">pitfalls guide</a>
        to repair weak signals, and this checklist to verify coverage before you stop.
      </p>

      <h2>10-Minute Final Review Runbook</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Review area</th>
            <th>What to confirm out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 min</td>
            <td>Scope and success metrics</td>
            <td>Primary user, v1 flow, non-goals, success metric, and the constraint that changes the design.</td>
          </tr>
          <tr>
            <td>2 min</td>
            <td>Architecture and rendering</td>
            <td>Route shape, rendering choice, ownership boundary, and why this is not over-built for v1.</td>
          </tr>
          <tr>
            <td>2 min</td>
            <td>State, data, and API contracts</td>
            <td>Server state, UI state, URL state, cache keys, mutations, API shape, and component contracts.</td>
          </tr>
          <tr>
            <td>2 min</td>
            <td>UI states, accessibility, and performance</td>
            <td>Loading, empty, error, stale, partial states, focus behavior, and the top performance budget.</td>
          </tr>
          <tr>
            <td>2 min</td>
            <td>Trade-offs, risks, and validation</td>
            <td>Biggest trade-off, rollback or rollout trigger, observability, and how you know the design works.</td>
          </tr>
          <tr>
            <td>1 min</td>
            <td>Closing script</td>
            <td>Summarize the selected path, risk, validation plan, and what you would deepen next.</td>
          </tr>
        </tbody>
      </table>

      <h2>Pass / Warn / Fail Checklist</h2>
      <table>
        <thead>
          <tr>
            <th>Axis</th>
            <th>Pass</th>
            <th>Warn</th>
            <th>Fail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements and non-goals</td>
            <td>User, v1 scope, non-goals, scale, constraints, and success metric are explicit.</td>
            <td>Scope is mostly clear, but success metric or non-goals are vague.</td>
            <td>You started drawing before the problem was shaped.</td>
          </tr>
          <tr>
            <td>Rendering and architecture choice</td>
            <td>SSR, SSG, CSR, hybrid, or microfrontend choice is tied to product constraints.</td>
            <td>The architecture works, but the rendering trade-off is not justified.</td>
            <td>You named tools or boxes without explaining why they fit.</td>
          </tr>
          <tr>
            <td>State ownership and cache invalidation</td>
            <td>Server state, local UI state, URL state, cache keys, freshness, and invalidation are separated.</td>
            <td>State types are named, but stale data or writes are under-specified.</td>
            <td>Everything goes into one vague global store.</td>
          </tr>
          <tr>
            <td>API and component contracts</td>
            <td>API response shape, component responsibility, props/events, auth, pagination, and errors are clear.</td>
            <td>Components are named, but contracts or transitions are incomplete.</td>
            <td>The diagram has no testable interface boundaries.</td>
          </tr>
          <tr>
            <td>Loading, empty, error, stale, partial states</td>
            <td>Each user-visible state has a UI behavior and recovery path.</td>
            <td>Happy path and errors are covered, but stale or partial behavior is missing.</td>
            <td>The answer assumes everything succeeds.</td>
          </tr>
          <tr>
            <td>Accessibility and responsive behavior</td>
            <td>Focus, keyboard, labels, announcements, reduced motion, and responsive constraints are covered where relevant.</td>
            <td>Accessibility is mentioned, but not tied to the interaction.</td>
            <td>The answer only describes visual layout.</td>
          </tr>
          <tr>
            <td>Performance, reliability, and observability</td>
            <td>Top bottleneck, budget, Core Web Vitals or route metric, degraded UX, logging, and alert signal are named.</td>
            <td>Performance tactics are listed, but measurement or reliability is vague.</td>
            <td>Optimizations are random and unvalidated.</td>
          </tr>
          <tr>
            <td>Trade-offs, rollout, and closing summary</td>
            <td>Alternatives, chosen trade-off, rollout risk, rollback trigger, and final summary are clear.</td>
            <td>Trade-offs are mentioned, but the close does not tie the answer together.</td>
            <td>The answer ends abruptly or sounds like every choice is pure upside.</td>
          </tr>
        </tbody>
      </table>

      <h2>Final Checks by Area</h2>
      <h3>Rendering and architecture</h3>
      <ul>
        <li><strong>Public, SEO-heavy route:</strong> Did you justify SSR or SSG and explain hydration cost?</li>
        <li><strong>Authenticated app:</strong> Did you explain why CSR or a hybrid shell is enough?</li>
        <li><strong>Large organization:</strong> Did you separate team ownership from runtime complexity before choosing microfrontends?</li>
      </ul>

      <h3>State, data, and contracts</h3>
      <ul>
        <li><strong>State split:</strong> Did you separate server cache, local UI state, URL state, and persisted drafts?</li>
        <li><strong>Fetching:</strong> Did you name request timing, pagination, prefetch, refresh, cancellation, and stale response behavior?</li>
        <li><strong>Contracts:</strong> Did you define API shape, component props/events, validation, auth, and failure transitions?</li>
      </ul>

      <h3>Performance and reliability</h3>
      <ul>
        <li><strong>Load path:</strong> Did you name the route budget, bundle split, image/font strategy, and fallback UI?</li>
        <li><strong>Interaction path:</strong> Did you mention INP risk, main-thread work, debounce/throttle, virtualization, or worker boundaries where relevant?</li>
        <li><strong>Observability:</strong> Did you name the event, metric, log, or alert that proves the design works in production?</li>
      </ul>

      <h2>Scenario-Specific Final Checks</h2>
      <ul>
        <li><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Typeahead final review</a>: request ordering, stale suggestions, keyboard navigation, latency budget, and no-result state.</li>
        <li><a [routerLink]="['/', 'system-design', 'infinite-scroll-list']">Infinite scroll final review</a>: cursor state, virtualization, scroll restoration, partial failure, and screen-reader access.</li>
        <li><a [routerLink]="['/', 'system-design', 'dashboard-widgets-draggable-resizable']">Dashboard widgets final review</a>: layout ownership, resize/drag cost, persistence, panel isolation, and degraded loading.</li>
        <li><a [routerLink]="['/', 'system-design', 'live-chart-high-frequency-updates']">Live chart final review</a>: sampling, backpressure, render loop, memory bounds, dropped updates, and alerting.</li>
        <li><a [routerLink]="['/', 'system-design', 'multi-step-form-autosave']">Multi-step form final review</a>: draft ownership, validation timing, autosave conflict, interaction latency, and recovery after failed saves.</li>
        <li><a [routerLink]="['/', 'system-design', 'component-design-system-architecture']">Design system final review</a>: token governance, API stability, accessibility contracts, versioning, adoption, and bundle cost.</li>
      </ul>

      <h2>30-Second Closing Script</h2>
      <blockquote>
        "I scoped the primary user path, chose the rendering and architecture around
        that path, separated state and API contracts, covered loading, error,
        accessibility, and performance behavior, and named the biggest trade-off.
        I would validate this with [metric] and revisit [risk] if [trigger] happens."
      </blockquote>

      <h2>Last-Minute Phrases That Score</h2>
      <ul>
        <li>"For v1, I will optimize for the primary task and keep the expansion path explicit."</li>
        <li>"This belongs in server state because freshness matters; this stays local because it only drives the component."</li>
        <li>"The contract should make loading, empty, error, stale, and partial states explicit."</li>
        <li>"The trade-off is faster first content versus more server work, so I would validate it per route."</li>
        <li>"I will pause here: do you want me to go deeper on data ownership, interface states, or performance?"</li>
      </ul>

      <h2>What To Review Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'evaluation']">Frontend system design interview rubric</a>: score the strength of your answer.</li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'pitfalls']">Frontend system design mistakes to avoid</a>: repair weak signals during the answer.</li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">Frontend system design performance guide</a>: deepen metrics, budgets, and validation.</li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-framework']">RADIO framework answer structure</a>: rebuild the full answer flow.</li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignChecklistArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
