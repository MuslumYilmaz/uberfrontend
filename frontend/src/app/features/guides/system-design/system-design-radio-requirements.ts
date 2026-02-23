import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="R - Requirements Deep Dive for Frontend System Design Interviews"
      [minutes]="16"
      [tags]="['system design', 'radio framework', 'requirements']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, requirements are where seniority is most visible. If you can define scope,
        constraints, and measurable outcomes before architecture, your <strong>frontend system design</strong> answer becomes easier
        to defend. This is the strongest first move in your <strong>system design interview preparation</strong> workflow.
      </p>

      <h2>Why Requirements Decide the Interview</h2>
      <p>
        Interviewers are not scoring how fast you draw boxes. They are scoring whether you can choose the right problem before
        proposing a solution. In the <strong>RADIO framework</strong>, Requirements is the control point for everything else.
      </p>
      <ul>
        <li><strong>Clarity:</strong> You define what success means before coding details.</li>
        <li><strong>Prioritization:</strong> You separate must-haves from nice-to-haves.</li>
        <li><strong>Risk management:</strong> You surface unknowns and assumptions early.</li>
        <li><strong>Trade-off quality:</strong> Later architecture decisions become explicit and explainable.</li>
      </ul>

      <h2>The 90-Second Opening Script</h2>
      <p>Use this script verbatim when the prompt starts:</p>
      <ol>
        <li>"I will spend a few minutes clarifying requirements and non-goals, then propose architecture."</li>
        <li>"I want to confirm primary user flow, expected scale, and key constraints first."</li>
        <li>"I will define a Must/Nice/Out scope box so we protect depth under time."</li>
        <li>"I will call out assumptions and measurable success criteria before moving forward."</li>
      </ol>

      <h2>Requirements Question Bank (Frontend-Focused)</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Ask this out loud</th>
            <th>Why it matters</th>
            <th>Artifact to produce</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User and goal</td>
            <td>Who is the primary user, and what is the top task?</td>
            <td>Prevents feature drift.</td>
            <td>One-line user goal statement</td>
          </tr>
          <tr>
            <td>Scope boundaries</td>
            <td>What is in scope for v1, and what is explicitly out?</td>
            <td>Keeps answer deep, not broad.</td>
            <td>Must / Nice / Out table</td>
          </tr>
          <tr>
            <td>Scale and traffic</td>
            <td>Expected DAU, peak concurrent users, and traffic spikes?</td>
            <td>Shapes caching, rendering, and failure strategy.</td>
            <td>Scale assumptions list</td>
          </tr>
          <tr>
            <td>Performance and UX</td>
            <td>Any latency targets for first paint and interaction?</td>
            <td>Turns "fast" into measurable targets.</td>
            <td>Perf target list (p95/p99)</td>
          </tr>
          <tr>
            <td>a11y and global needs</td>
            <td>Keyboard, screen reader, i18n, RTL requirements?</td>
            <td>Distinguishes senior frontend answers.</td>
            <td>a11y/i18n acceptance checklist</td>
          </tr>
          <tr>
            <td>Reliability and security</td>
            <td>Offline expectations, auth model, abuse/rate-limit concerns?</td>
            <td>Covers real production constraints.</td>
            <td>Failure + security baseline notes</td>
          </tr>
          <tr>
            <td>Platform constraints</td>
            <td>Existing stack, API limits, launch deadline, team size?</td>
            <td>Keeps design grounded in delivery reality.</td>
            <td>Constraint ledger</td>
          </tr>
        </tbody>
      </table>

      <h2>Scope Box Template (Must / Nice / Out)</h2>
      <p>Use this immediately after clarifying questions.</p>
      <table>
        <thead>
          <tr>
            <th>Must-have (v1)</th>
            <th>Nice-to-have (if time)</th>
            <th>Out-of-scope (explicitly parked)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Core interaction works end-to-end</td>
            <td>Personalization and ranking</td>
            <td>Advanced analytics dashboard</td>
          </tr>
          <tr>
            <td>Loading/empty/error states</td>
            <td>Offline sync polish</td>
            <td>Multi-region active-active rollout</td>
          </tr>
          <tr>
            <td>Basic a11y support</td>
            <td>Animation refinement</td>
            <td>ML-driven recommendations</td>
          </tr>
        </tbody>
      </table>

      <h2>Assumptions and Risk Log</h2>
      <p>
        If the interviewer does not provide data, do not guess silently. State assumptions and attach a risk plan.
      </p>
      <table>
        <thead>
          <tr>
            <th>Assumption</th>
            <th>Risk if wrong</th>
            <th>How to validate quickly</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Peak traffic is 5x normal load</td>
            <td>Cache strategy underestimates burst behavior</td>
            <td>Ask for peak/event traffic pattern</td>
          </tr>
          <tr>
            <td>SEO matters for entry pages only</td>
            <td>Wrong rendering model choice</td>
            <td>Confirm crawl/index requirements by route</td>
          </tr>
          <tr>
            <td>Auth uses short-lived tokens</td>
            <td>Session refresh failures in long-lived tabs</td>
            <td>Confirm token refresh and expiration policy</td>
          </tr>
        </tbody>
      </table>

      <h2>Frontend Signals You Should Always Cover</h2>
      <ul>
        <li><strong>Rendering needs:</strong> Which routes need SSR, which can stay CSR, and why.</li>
        <li><strong>State coverage:</strong> idle, loading, success, empty, error, stale, partial.</li>
        <li><strong>Performance constraints:</strong> p95 interaction latency, bundle limits, and network assumptions.</li>
        <li><strong>Accessibility baseline:</strong> keyboard flow, focus management, and screen-reader announcements.</li>
        <li><strong>Observability expectations:</strong> what metrics/logs prove correctness in production.</li>
      </ul>

      <h2>Success Metrics You Can Commit To</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Candidate target</th>
            <th>How to measure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User interaction responsiveness</td>
            <td>p95 interaction under 150ms</td>
            <td>RUM event timings</td>
          </tr>
          <tr>
            <td>Initial content speed</td>
            <td>LCP under 2.5s on mid-tier device</td>
            <td>Web Vitals dashboard</td>
          </tr>
          <tr>
            <td>Reliability</td>
            <td>Error rate under 1% for core flow</td>
            <td>Client logs and alert thresholds</td>
          </tr>
          <tr>
            <td>Task completion</td>
            <td>Conversion or completion uplift target</td>
            <td>Product analytics funnel</td>
          </tr>
        </tbody>
      </table>

      <h2>Edge Cases and Failure States Checklist</h2>
      <ul>
        <li>What should the user see on first load while data is pending?</li>
        <li>What if response is successful but empty?</li>
        <li>What if network fails, times out, or partially succeeds?</li>
        <li>What if data is stale while a refresh is in-flight?</li>
        <li>What if permissions differ by role or environment?</li>
      </ul>

      <h2>Common Mistakes (and Better Moves)</h2>
      <table>
        <thead>
          <tr>
            <th>Mistake</th>
            <th>Better move</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jumping to architecture in minute one</td>
            <td>Open with scope, constraints, and metrics first</td>
          </tr>
          <tr>
            <td>Using vague words like "fast" and "scalable"</td>
            <td>Attach numbers and observable targets</td>
          </tr>
          <tr>
            <td>Ignoring non-goals</td>
            <td>State what is explicitly out for v1</td>
          </tr>
          <tr>
            <td>Skipping failure states</td>
            <td>Name empty/error/stale/partial states before architecture</td>
          </tr>
          <tr>
            <td>No assumptions called out</td>
            <td>Create a short assumptions + risk log</td>
          </tr>
        </tbody>
      </table>

      <h2>Worked Example: Typeahead Search (5-Min Requirements Pass)</h2>
      <h3>Minute 0:00-1:00</h3>
      <p>
        Confirm user and goal: users find relevant suggestions quickly while typing. Primary flow is query input to click/enter result.
      </p>

      <h3>Minute 1:00-2:00</h3>
      <p>
        Lock scope: suggestions, keyboard navigation, loading/error/empty states. Out-of-scope: personalization and ranking ML.
      </p>

      <h3>Minute 2:00-3:30</h3>
      <p>
        Confirm constraints: p95 suggestion response target, peak events, mobile network assumptions, and accessibility baseline.
      </p>

      <h3>Minute 3:30-5:00</h3>
      <p>
        Declare assumptions and success metrics, then summarize: "I have scope, constraints, and measurable targets; next I will propose architecture."
      </p>

      <h2>Requirements Timebox: 45 vs 60 Minute Interviews</h2>
      <table>
        <thead>
          <tr>
            <th>Interview length</th>
            <th>Requirements budget</th>
            <th>Expected output</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>45 minutes</td>
            <td>6-8 minutes</td>
            <td>Scope box + top constraints + 2-3 metrics + risk log</td>
          </tr>
          <tr>
            <td>60 minutes</td>
            <td>8-10 minutes</td>
            <td>Everything above plus clearer edge-state and trade-off framing</td>
          </tr>
        </tbody>
      </table>

      <h2>Before You Move to Architecture</h2>
      <ul>
        <li>Problem statement is one sentence and user-focused.</li>
        <li>Must / Nice / Out is explicit.</li>
        <li>Critical constraints are confirmed or clearly assumed.</li>
        <li>At least two measurable success metrics are defined.</li>
        <li>Failure states are named and prioritized.</li>
        <li>You have a short assumptions + risk log to reference later.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-framework']">RADIO framework cheat sheet</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">A - Architecture deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">O - Optimizations deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignRadioRequirementsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
