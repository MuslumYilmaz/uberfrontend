import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="I - Interface Deep Dive for Frontend System Design Interviews"
      [minutes]="18"
      [tags]="['system design', 'interface', 'radio framework', 'frontend system design']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, Interface is where your architecture meets user behavior.
        If your UI states, interaction flows, accessibility, and fallback behavior are explicit, your
        <strong>frontend system design</strong> answer sounds production ready. In the <strong>RADIO framework</strong>,
        this is the step that turns system choices into a shippable user experience.
      </p>

      <h2>What Interface Must Produce</h2>
      <table>
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Minimum interview output</th>
            <th>Why interviewer cares</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Component map</td>
            <td>Container and presentational boundaries with ownership</td>
            <td>Tests decomposition and maintainability</td>
          </tr>
          <tr>
            <td>Interaction flow</td>
            <td>User action -> state change -> render update -> telemetry</td>
            <td>Tests event and state reasoning</td>
          </tr>
          <tr>
            <td>UI states matrix</td>
            <td>idle/loading/success/empty/error/stale/partial behavior</td>
            <td>Tests resilience and UX completeness</td>
          </tr>
          <tr>
            <td>Accessibility contract</td>
            <td>Keyboard map, focus order, ARIA/live-region plan</td>
            <td>Tests inclusivity and frontend maturity</td>
          </tr>
          <tr>
            <td>Responsive behavior table</td>
            <td>Mobile/tablet/desktop behavior differences</td>
            <td>Tests real-world product thinking</td>
          </tr>
        </tbody>
      </table>

      <h2>Inputs from Requirements, Architecture, and Data Model</h2>
      <p>
        Strong <strong>system design interview preparation</strong> means carrying inputs forward.
        Interface decisions should trace directly to R, A, and D.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input source</th>
            <th>Interface decision it drives</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements: primary task and constraints</td>
            <td>Screen priority and interaction hierarchy</td>
            <td>"I am optimizing the highest-value flow first."</td>
          </tr>
          <tr>
            <td>Architecture: route rendering strategy</td>
            <td>What appears server-rendered vs client-enhanced</td>
            <td>"I keep first paint useful, then hydrate interactive controls."</td>
          </tr>
          <tr>
            <td>Data model: state ownership and contracts</td>
            <td>What UI state is local, URL-driven, or server-driven</td>
            <td>"I separate server data state from transient view state."</td>
          </tr>
          <tr>
            <td>Performance targets</td>
            <td>Interaction feedback and rendering budget choices</td>
            <td>"I provide immediate feedback within the p95 interaction budget."</td>
          </tr>
          <tr>
            <td>Accessibility baseline</td>
            <td>Focus, keyboard, and announcements by default</td>
            <td>"Accessibility behavior is part of the interface contract, not polish."</td>
          </tr>
        </tbody>
      </table>

      <h2>UI Surface Decomposition</h2>
      <h3>Use a layered component map</h3>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Responsibility</th>
            <th>Typical example</th>
            <th>Pitfall</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Page container</td>
            <td>Orchestrate data hooks and route state</td>
            <td>SearchPageContainer</td>
            <td>Leaking styling and view logic everywhere</td>
          </tr>
          <tr>
            <td>Feature section</td>
            <td>Own one domain interaction flow</td>
            <td>SearchResultsPanel</td>
            <td>One mega component owning all concerns</td>
          </tr>
          <tr>
            <td>UI primitives</td>
            <td>Reusable visual and a11y-safe building blocks</td>
            <td>Input, Listbox, Button, Chip</td>
            <td>Inconsistent semantics across pages</td>
          </tr>
          <tr>
            <td>Feedback components</td>
            <td>Standardized loading/empty/error states</td>
            <td>InlineError, EmptyState, Skeleton</td>
            <td>Custom one-off states that drift over time</td>
          </tr>
        </tbody>
      </table>

      <h2>Interaction Model and User Flows</h2>
      <ol>
        <li>User triggers action (type, click, keyboard command).</li>
        <li>Interface updates immediate local state for responsiveness.</li>
        <li>Data request executes with cancellation and dedupe rules.</li>
        <li>Result maps into explicit UI state: success, empty, error, stale, or partial.</li>
        <li>Telemetry event logs outcome and latency.</li>
      </ol>
      <p>
        Script cue: "I will define interaction events end-to-end, including cancellation and stale response handling, before drawing final UI polish."
      </p>

      <h2>State-to-UI Mapping Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Rendering behavior</th>
            <th>User action available</th>
            <th>A11y note</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>idle</td>
            <td>Prompt or default suggestions</td>
            <td>Start interaction</td>
            <td>Initial focus lands on primary control</td>
          </tr>
          <tr>
            <td>loading</td>
            <td>Skeleton or progress indicator</td>
            <td>Cancel or keep typing</td>
            <td>Announce loading region politely</td>
          </tr>
          <tr>
            <td>success</td>
            <td>Results rendered with highlight states</td>
            <td>Navigate/select</td>
            <td>Use semantic roles for list and options</td>
          </tr>
          <tr>
            <td>empty</td>
            <td>Clear empty message and next action hint</td>
            <td>Refine query</td>
            <td>Do not trap focus in empty container</td>
          </tr>
          <tr>
            <td>error</td>
            <td>Inline error with retry path</td>
            <td>Retry or fallback path</td>
            <td>Error message is screen-reader accessible</td>
          </tr>
          <tr>
            <td>stale</td>
            <td>Previous data with refresh indicator</td>
            <td>Continue browsing</td>
            <td>Announce update when fresh data arrives</td>
          </tr>
          <tr>
            <td>partial</td>
            <td>Show available sections and degraded notice</td>
            <td>Use partial results safely</td>
            <td>Explain missing section context in text</td>
          </tr>
        </tbody>
      </table>

      <h2>Accessibility Contract (Non-Negotiable)</h2>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Contract</th>
            <th>Quick verification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Keyboard navigation</td>
            <td>All actions possible without mouse</td>
            <td>Tab and arrow flow completes primary task</td>
          </tr>
          <tr>
            <td>Focus management</td>
            <td>Predictable visible focus after each state transition</td>
            <td>No focus loss on modal, error, or async updates</td>
          </tr>
          <tr>
            <td>Semantics and roles</td>
            <td>Correct role mapping for controls and landmarks</td>
            <td>Screen reader announces context correctly</td>
          </tr>
          <tr>
            <td>Live feedback</td>
            <td>Loading/error/success announcements are polite and concise</td>
            <td>Announcements fire once per meaningful update</td>
          </tr>
        </tbody>
      </table>

      <h2>Responsive and Adaptive Behavior</h2>
      <table>
        <thead>
          <tr>
            <th>Viewport</th>
            <th>Interaction pattern</th>
            <th>Layout behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mobile</td>
            <td>Touch-first controls, larger targets, simplified panels</td>
            <td>Single-column stack with persistent primary action</td>
          </tr>
          <tr>
            <td>Tablet</td>
            <td>Hybrid touch and keyboard expectations</td>
            <td>Two-pane when useful, avoid dense sidebars</td>
          </tr>
          <tr>
            <td>Desktop</td>
            <td>Keyboard shortcuts and high information density</td>
            <td>Multi-column layout with persistent context panels</td>
          </tr>
        </tbody>
      </table>

      <h2>Error, Empty, and Degraded UX Patterns</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>What to render</th>
            <th>Recovery path</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API timeout</td>
            <td>Inline timeout message with retained stale data</td>
            <td>Retry and background refresh</td>
          </tr>
          <tr>
            <td>No results</td>
            <td>Empty state with query refinement tips</td>
            <td>Quick reset and suggested filters</td>
          </tr>
          <tr>
            <td>Partial backend failure</td>
            <td>Render available modules and degraded badge</td>
            <td>Refresh failed module only</td>
          </tr>
          <tr>
            <td>Offline transition</td>
            <td>Offline banner and read-only fallback</td>
            <td>Sync when reconnected</td>
          </tr>
        </tbody>
      </table>

      <h2>Performance at Interface Layer</h2>
      <ul>
        <li>Set render budget per interaction, not just page load budget.</li>
        <li>Virtualize long lists and defer non-critical panels below the fold.</li>
        <li>Use optimistic UI where safe to keep interaction latency low.</li>
        <li>Avoid layout shift by reserving space for async content.</li>
        <li>Measure p95 interaction by route and key component path.</li>
      </ul>

      <h2>Security and Trust Touchpoints in UI</h2>
      <ul>
        <li>Do not expose privileged fields in client-rendered list views without authorization context.</li>
        <li>Mask sensitive data by default and reveal through explicit user action.</li>
        <li>Sanitize and encode user-provided content before rendering rich text.</li>
        <li>Reflect permission changes quickly to disable stale actions.</li>
      </ul>

      <h2>Observability for Interface Quality</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Metric</th>
            <th>Use in review loop</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Interaction speed</td>
            <td>p95 event-to-paint latency</td>
            <td>Find slow components and regressions</td>
          </tr>
          <tr>
            <td>User friction</td>
            <td>Abandon rate by step in primary flow</td>
            <td>Prioritize UX fixes by impact</td>
          </tr>
          <tr>
            <td>Reliability</td>
            <td>Error and partial-state frequency</td>
            <td>Harden degraded behavior paths</td>
          </tr>
          <tr>
            <td>Accessibility</td>
            <td>Keyboard failure rate and focus-loss events</td>
            <td>Prevent invisible accessibility regressions</td>
          </tr>
        </tbody>
      </table>

      <h2>What to Say Out Loud (Interface Script Cues)</h2>
      <ol>
        <li>"I will map the highest-value user flow first, then fill secondary paths."</li>
        <li>"I am defining component boundaries by ownership, not by visual grouping alone."</li>
        <li>"I will make every major state explicit: loading, empty, error, stale, and partial."</li>
        <li>"I am treating keyboard and focus behavior as first-class interface requirements."</li>
        <li>"For this flow, immediate local feedback is required even while network work continues."</li>
        <li>"Trade-off here: simpler UI now versus denser controls that add cognitive load."</li>
        <li>"I will keep shareable state in URL and transient interaction state local."</li>
        <li>"I am defining degraded behavior now so partial failures do not block the whole task."</li>
        <li>"I will instrument key interaction points to validate UX quality post-launch."</li>
        <li>"With interface behavior locked, I can move to optimization priorities."</li>
      </ol>

      <h2>Interface Timebox for Interviews</h2>
      <h3>45-minute interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-2:00</td>
            <td>Decompose the UI into major components</td>
            <td>Component map</td>
          </tr>
          <tr>
            <td>2:00-4:00</td>
            <td>Define primary interaction sequence</td>
            <td>Event flow list</td>
          </tr>
          <tr>
            <td>4:00-6:00</td>
            <td>State-to-UI and fallback behavior</td>
            <td>UI states matrix</td>
          </tr>
          <tr>
            <td>6:00-8:00</td>
            <td>A11y and responsive contract recap</td>
            <td>Interface checklist</td>
          </tr>
        </tbody>
      </table>

      <h3>60-minute interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-3:00</td>
            <td>Component boundaries and ownership rules</td>
            <td>Detailed component hierarchy</td>
          </tr>
          <tr>
            <td>3:00-6:00</td>
            <td>Interaction flow with cancellation/debounce behavior</td>
            <td>Event and state transition map</td>
          </tr>
          <tr>
            <td>6:00-9:00</td>
            <td>A11y, responsive, and degraded UX contracts</td>
            <td>Interface contract table</td>
          </tr>
          <tr>
            <td>9:00-12:00</td>
            <td>Performance and observability summary</td>
            <td>Measurement plan</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Drill: Typeahead Interface in 7 Minutes</h2>
      <table>
        <thead>
          <tr>
            <th>Minute</th>
            <th>What to produce</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0-1</td>
            <td>Component map: input, listbox, option row, feedback banner</td>
          </tr>
          <tr>
            <td>1-2</td>
            <td>Interaction sequence for typing, arrow navigation, and selection</td>
          </tr>
          <tr>
            <td>2-3</td>
            <td>UI states matrix for idle/loading/success/empty/error/stale/partial</td>
          </tr>
          <tr>
            <td>3-4</td>
            <td>A11y contract: combobox role, aria-activedescendant, focus behavior</td>
          </tr>
          <tr>
            <td>4-5</td>
            <td>Responsive behavior: mobile full-width panel, desktop anchored dropdown</td>
          </tr>
          <tr>
            <td>5-6</td>
            <td>Failure behavior: timeout retry and partial fallback handling</td>
          </tr>
          <tr>
            <td>6-7</td>
            <td>Telemetry events: query latency, zero-results, selection conversion</td>
          </tr>
        </tbody>
      </table>

      <h2>Before You Move to Optimizations</h2>
      <ul>
        <li>Component ownership and boundaries are explicit.</li>
        <li>Primary interaction flow is complete and testable.</li>
        <li>All core UI states are covered including degraded modes.</li>
        <li>Accessibility contract is concrete, not implied.</li>
        <li>Responsive behavior is defined across viewport classes.</li>
        <li>Performance and interface telemetry plan is included.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'optimizations']">O - Optimizations deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'data-model']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'architecture']">A - Architecture deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignCrossCuttingArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
