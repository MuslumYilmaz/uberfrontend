import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Frontend System Design Interview Pitfalls and Red Flags"
      [minutes]="11"
      [tags]="['system design', 'pitfalls', 'red flags', 'mistakes']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <h2>If You Remember One Thing</h2>
      <p>
        <strong>Frontend system design interview pitfalls</strong> cost signal when
        they hide the browser, the user flow, or the trade-off behind generic system
        design talk. Interviewers are not only checking whether you know architecture
        words; they are checking whether your answer protects user-visible behavior.
      </p>
      <p>
        When you notice a red flag mid-answer, recover fast: restate the user-critical
        path, name the constraint you are optimizing for, choose the next artifact, and
        ask which area the interviewer wants to deepen. That is stronger than pushing
        through a messy answer.
      </p>

      <h2>Fast Recovery Script</h2>
      <blockquote>
        "Let me reset this around the primary user path. For v1 I am optimizing for
        [user task] under [constraint]. I will first clarify the state and API contract,
        then call out performance, accessibility, and failure behavior. Does that match
        the part you want me to focus on?"
      </blockquote>
      <p>
        Use this script when you have rambled, over-indexed on backend design, skipped
        requirements, or followed an interviewer hint too late. It turns a weak moment
        into a visible checkpoint.
      </p>

      <h2>12 Red Flags and Repair Moves</h2>

      <h3>1. Jumping to diagrams before requirements</h3>
      <ul>
        <li><strong>Red flag:</strong> You start drawing components before users, devices, scope, and success metrics are clear.</li>
        <li><strong>Why it hurts:</strong> The interviewer cannot tell whether your design solves the right frontend problem.</li>
        <li><strong>Better move:</strong> Spend the first 1-2 minutes on primary flow, v1 scope, non-goals, latency, accessibility, and failure assumptions.</li>
        <li><strong>What to say instead:</strong> "Before architecture, I will scope the user path and constraints that change the frontend design."</li>
      </ul>

      <h3>2. Giving a backend-only answer</h3>
      <ul>
        <li><strong>Red flag:</strong> The answer becomes databases, queues, sharding, and services while the browser experience stays vague.</li>
        <li><strong>Why it hurts:</strong> Frontend rounds score rendering, component boundaries, state ownership, API consumption, accessibility, and user-visible failure states.</li>
        <li><strong>Better move:</strong> Use backend awareness to explain contracts and failure behavior, then return to UI architecture.</li>
        <li><strong>What to say instead:</strong> "I need the backend contract, but the frontend decision is how the UI handles loading, stale data, retries, and recovery."</li>
      </ul>

      <h3>3. Buzzword-driven architecture</h3>
      <ul>
        <li><strong>Red flag:</strong> You prescribe microfrontends, GraphQL, SSR, a CDN, or a state library without tying it to the prompt.</li>
        <li><strong>Why it hurts:</strong> Tools without constraints sound memorized and hide trade-off judgment.</li>
        <li><strong>Better move:</strong> Name the constraint first, compare one alternative, and explain why the selected pattern fits this scenario.</li>
        <li><strong>What to say instead:</strong> "I would use SSR only if first useful content and SEO matter for this route; otherwise CSR plus route splitting may be enough."</li>
      </ul>

      <h3>4. Over-engineering v1</h3>
      <ul>
        <li><strong>Red flag:</strong> You design global scale, offline sync, microfrontends, and complex rollout before a simple v1 exists.</li>
        <li><strong>Why it hurts:</strong> It signals poor prioritization and makes the design harder to evaluate under interview time.</li>
        <li><strong>Better move:</strong> Ship a narrow v1, then state the threshold that would justify each added layer.</li>
        <li><strong>What to say instead:</strong> "For v1 I will keep this centralized. I would split it by team ownership only when release independence becomes a real constraint."</li>
      </ul>

      <h3>5. Ignoring state ownership and cache invalidation</h3>
      <ul>
        <li><strong>Red flag:</strong> Server data, form drafts, URL state, selection state, and cache state all land in one vague store.</li>
        <li><strong>Why it hurts:</strong> Most frontend system design mistakes show up as stale UI, duplicated truth, or broken recovery after mutation failure.</li>
        <li><strong>Better move:</strong> Separate server truth, client UI state, URL state, and persisted drafts; name cache keys and invalidation events.</li>
        <li><strong>What to say instead:</strong> "This is server state because freshness and dedupe matter; this is local UI state because it only controls the open panel."</li>
      </ul>

      <h3>6. Hand-wavy API and component contracts</h3>
      <ul>
        <li><strong>Red flag:</strong> You list components but never define props, events, API shape, pagination, auth, or error contracts.</li>
        <li><strong>Why it hurts:</strong> A diagram without contracts cannot be tested, evolved, or made accessible.</li>
        <li><strong>Better move:</strong> Define the minimum response shape, component responsibility, controlled state, emitted events, and fallback behavior.</li>
        <li><strong>What to say instead:</strong> "The component contract should make loading, error, stale, empty, and selected states explicit."</li>
      </ul>

      <h3>7. Missing loading, empty, error, stale, and partial states</h3>
      <ul>
        <li><strong>Red flag:</strong> You describe only the happy path and say errors can be handled later.</li>
        <li><strong>Why it hurts:</strong> Frontend reliability is user-visible; bad states break trust even when the backend works.</li>
        <li><strong>Better move:</strong> Cover skeletons or spinners, empty copy, retry, stale indicators, partial rendering, and disabled states where needed.</li>
        <li><strong>What to say instead:</strong> "I will design degraded behavior now so one failed panel does not block the whole user task."</li>
      </ul>

      <h3>8. Ignoring accessibility and focus behavior</h3>
      <ul>
        <li><strong>Red flag:</strong> You mention visual layout but skip keyboard flow, focus restoration, labels, announcements, and reduced-motion needs.</li>
        <li><strong>Why it hurts:</strong> Accessibility is part of the interface contract, not a polish task after implementation.</li>
        <li><strong>Better move:</strong> Add focus rules, ARIA only when needed, semantic controls, status announcements, and responsive behavior to the design.</li>
        <li><strong>What to say instead:</strong> "For this interaction I will define keyboard navigation and focus recovery as part of the component API."</li>
      </ul>

      <h3>9. Random performance optimization lists</h3>
      <ul>
        <li><strong>Red flag:</strong> You say lazy loading, caching, memoization, and virtualization without naming the bottleneck.</li>
        <li><strong>Why it hurts:</strong> Interviewers want prioritization, not a checklist of tactics.</li>
        <li><strong>Better move:</strong> Pick the likely bottleneck, set a metric or budget, name the trade-off, and explain validation.</li>
        <li><strong>What to say instead:</strong> "I will optimize the primary task path first and validate p95 route latency and interaction responsiveness."</li>
      </ul>

      <h3>10. No trade-offs or rollback plan</h3>
      <ul>
        <li><strong>Red flag:</strong> Every design choice sounds like pure upside, with no failure mode, cost, or rollout risk.</li>
        <li><strong>Why it hurts:</strong> Senior frontend work is about choosing under constraints and knowing when a choice is wrong.</li>
        <li><strong>Better move:</strong> State the upside, downside, trigger to revisit, and rollback or feature-flag plan for risky changes.</li>
        <li><strong>What to say instead:</strong> "The trade-off is faster first content versus more server work, so I would roll this out per route and watch error and latency budgets."</li>
      </ul>

      <h3>11. Rambling without checkpoints</h3>
      <ul>
        <li><strong>Red flag:</strong> You talk through every idea without pausing to confirm direction or interviewer priorities.</li>
        <li><strong>Why it hurts:</strong> Even good details lose signal when the interviewer cannot redirect you.</li>
        <li><strong>Better move:</strong> Use checkpoints after scope, architecture, data, interface, and optimization sections.</li>
        <li><strong>What to say instead:</strong> "I will pause here: do you want me to go deeper on data ownership or performance trade-offs?"</li>
      </ul>

      <h3>12. Following interviewer hints too late</h3>
      <ul>
        <li><strong>Red flag:</strong> The interviewer asks about accessibility, stale data, or latency, but you keep defending the current diagram.</li>
        <li><strong>Why it hurts:</strong> Hints often reveal the scoring gap they want you to close.</li>
        <li><strong>Better move:</strong> Acknowledge the hint, update the design, and state the new trade-off.</li>
        <li><strong>What to say instead:</strong> "Good point. I will revise this: the risk is stale suggestions, so I need cancellation, request ordering, and stale-state UI."</li>
      </ul>

      <h2>Pitfalls by RADIO Step</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Common pitfall</th>
            <th>Repair move</th>
            <th>Deep dive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>Solving before scope</td>
            <td>Define user, v1, non-goals, metrics, accessibility baseline, and failure states.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">Requirements guide</a></td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Generic boxes or buzzword choices</td>
            <td>Choose rendering and module boundaries from constraints.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">Architecture guide</a></td>
          </tr>
          <tr>
            <td>Data</td>
            <td>Mixed state ownership</td>
            <td>Separate server state, UI state, URL state, cache keys, and mutations.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">State and data guide</a></td>
          </tr>
          <tr>
            <td>Interface</td>
            <td>Hand-wavy contracts and missing UI states</td>
            <td>Make component, API, loading, error, stale, and accessibility behavior explicit.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">Interface guide</a></td>
          </tr>
          <tr>
            <td>Optimizations</td>
            <td>Random performance tactics</td>
            <td>Diagnose bottlenecks, set budgets, call out trade-offs, and validate impact.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">Performance guide</a></td>
          </tr>
          <tr>
            <td>Evaluation</td>
            <td>No clear strong-hire signal</td>
            <td>Map your answer to rubric axes and repair the weakest signal.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'evaluation']">Rubric and scorecard</a></td>
          </tr>
          <tr>
            <td>Final pass</td>
            <td>Ending without a risk summary</td>
            <td>Close with scope, architecture choice, biggest trade-off, and validation plan.</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'checklist']">Frontend system design interview checklist</a></td>
          </tr>
        </tbody>
      </table>

      <h2>Scenario-Specific Pitfalls</h2>
      <ul>
        <li><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Typeahead system design mistakes</a>: forgetting request ordering, stale suggestions, keyboard navigation, and suggestion latency.</li>
        <li><a [routerLink]="['/', 'system-design', 'infinite-scroll-list']">Infinite scroll frontend system design mistakes</a>: skipping virtualization trade-offs, restoration, pagination state, and screen-reader access.</li>
        <li><a [routerLink]="['/', 'system-design', 'dashboard-widgets-draggable-resizable']">Dashboard frontend system design pitfalls</a>: ignoring layout persistence, drag performance, partial panel failure, and ownership boundaries.</li>
        <li><a [routerLink]="['/', 'system-design', 'live-chart-high-frequency-updates']">Live chart system design pitfalls</a>: treating every event as render-worthy and missing memory, sampling, and overload behavior.</li>
        <li><a [routerLink]="['/', 'system-design', 'multi-step-form-autosave']">Multi step form autosave system design mistakes</a>: skipping draft conflict handling, validation timing, interaction latency, and recovery after failed saves.</li>
        <li><a [routerLink]="['/', 'system-design', 'component-design-system-architecture']">Design system architecture interview mistakes</a>: focusing on components but skipping token governance, accessibility contracts, versioning, and bundle cost.</li>
      </ul>

      <h2>Self-Check Before You Finish</h2>
      <ol>
        <li>Did I clarify the primary user path before drawing?</li>
        <li>Did I keep the answer frontend-specific instead of backend-only?</li>
        <li>Did I define state ownership, API contracts, and UI states?</li>
        <li>Did I mention accessibility and focus behavior where interaction matters?</li>
        <li>Did I tie performance to a bottleneck, metric, trade-off, and validation plan?</li>
        <li>Did I pause for checkpoints and close with the biggest remaining risk?</li>
      </ol>
      <p>
        Use this page for mistake repair, the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'evaluation']">evaluation rubric</a>
        for scoring, and the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'checklist']">frontend system design final review</a>
        for your final review.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignTrapsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
