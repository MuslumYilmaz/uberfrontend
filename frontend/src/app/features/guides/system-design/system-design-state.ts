import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="D - Data Model Deep Dive for Frontend System Design Interviews"
      [minutes]="18"
      [tags]="['system design','data model','caching','radio framework']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, your data model is the contract for everything else:
        rendering strategy, UI states, caching, and reliability. If your entities, ownership boundaries,
        and invalidation rules are explicit, your <strong>frontend system design</strong> answer sounds senior
        and survives follow-up questions.
      </p>
      <p>
        In the <strong>RADIO framework</strong>, Data model is where scope and architecture become concrete contracts.
      </p>

      <h2>What Data Model Must Produce</h2>
      <table>
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Minimum interview output</th>
            <th>Why it matters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Entity map</td>
            <td>Core entities, IDs, and relations</td>
            <td>Prevents hand-wavy domain modeling</td>
          </tr>
          <tr>
            <td>State ownership table</td>
            <td>Server truth vs client UI state vs URL state</td>
            <td>Avoids sync bugs and duplicate sources of truth</td>
          </tr>
          <tr>
            <td>UI states matrix</td>
            <td>idle/loading/success/empty/error/stale/partial</td>
            <td>Shows production-ready frontend thinking</td>
          </tr>
          <tr>
            <td>Cache policy</td>
            <td>Query keys, TTLs, and invalidation triggers</td>
            <td>Makes stale behavior predictable</td>
          </tr>
          <tr>
            <td>Mutation flow</td>
            <td>Optimistic update, rollback, and conflict handling</td>
            <td>Tests write-path maturity</td>
          </tr>
        </tbody>
      </table>

      <h2>Inputs You Must Carry from Requirements and Architecture</h2>
      <p>
        Data model quality is a dependency chain. Good <strong>system design interview preparation</strong>
        means carrying constraints forward, not resetting at each step.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input</th>
            <th>Data-model decision</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary user flow</td>
            <td>Model entities around top task first</td>
            <td>"I am modeling the highest-value user path before edge entities."</td>
          </tr>
          <tr>
            <td>Route rendering split</td>
            <td>Separate SSR-safe payloads from CSR-interactive state</td>
            <td>"I am designing data contracts to support both SSR payload and CSR updates."</td>
          </tr>
          <tr>
            <td>Scale and latency targets</td>
            <td>Define pagination shape, cache key granularity, and TTL</td>
            <td>"I will tune key and TTL design to hit p95 latency targets."</td>
          </tr>
          <tr>
            <td>Reliability requirements</td>
            <td>Add stale and partial states in contracts</td>
            <td>"I will include stale and partial response semantics in the model."</td>
          </tr>
          <tr>
            <td>Security constraints</td>
            <td>Model field visibility by role/scope</td>
            <td>"I am separating public and privileged fields at contract level."</td>
          </tr>
        </tbody>
      </table>

      <h2>Entity Model and API Contracts</h2>
      <h3>Entity sketch template</h3>
      <div class="code-wrap">
        <pre><code>Suggestion &#123;
  id: string
  label: string
  type: 'user' | 'repo' | 'doc'
  score?: number
  updatedAt: string
&#125;

SearchResponse &#123;
  query: string
  items: Suggestion[]
  nextCursor?: string
  stale: boolean
  partial: boolean
&#125;</code></pre>
      </div>

      <h3>Modeling rules you should state</h3>
      <ul>
        <li>Every entity has stable ID and update timestamp/version.</li>
        <li>Keep payloads route-focused; avoid over-fetching fields not rendered.</li>
        <li>Represent optional capability as explicit fields, not implicit null behavior.</li>
        <li>Include metadata needed for UI state decisions (for example, <code>stale</code>, <code>partial</code>).</li>
      </ul>

      <h2>State Ownership Model</h2>
      <table>
        <thead>
          <tr>
            <th>State class</th>
            <th>Owner</th>
            <th>Examples</th>
            <th>Common pitfall</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Server truth</td>
            <td>API + server-state cache</td>
            <td>Entities, permissions, availability</td>
            <td>Copying into multiple client stores</td>
          </tr>
          <tr>
            <td>Client view state</td>
            <td>Component/local store</td>
            <td>Popover open, selected row, input draft</td>
            <td>Persisting ephemeral state globally</td>
          </tr>
          <tr>
            <td>URL state</td>
            <td>Router/query params</td>
            <td>Query, filters, sort, page cursor</td>
            <td>State not shareable/bookmarkable</td>
          </tr>
        </tbody>
      </table>

      <h2>UI States Matrix (Critical for Frontend)</h2>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Trigger</th>
            <th>What user sees</th>
            <th>Telemetry signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>idle</td>
            <td>No request yet</td>
            <td>Prompt or default content</td>
            <td>Initial load event</td>
          </tr>
          <tr>
            <td>loading</td>
            <td>Request in-flight</td>
            <td>Skeleton/spinner with accessible announcement</td>
            <td>Request start latency timer</td>
          </tr>
          <tr>
            <td>success</td>
            <td>Data received</td>
            <td>Primary content rendered</td>
            <td>Success rate and completion</td>
          </tr>
          <tr>
            <td>empty</td>
            <td>Valid response, zero items</td>
            <td>Empty-state guidance + next action</td>
            <td>Zero-result rate</td>
          </tr>
          <tr>
            <td>error</td>
            <td>Failure/timeout/unauthorized</td>
            <td>Error message + retry path</td>
            <td>Error rate by endpoint/route</td>
          </tr>
          <tr>
            <td>stale</td>
            <td>Cached data older than freshness policy</td>
            <td>Stale badge while background refresh runs</td>
            <td>Stale duration distribution</td>
          </tr>
          <tr>
            <td>partial</td>
            <td>One dependency failed in aggregate response</td>
            <td>Partial data + degraded notice</td>
            <td>Partial-response ratio</td>
          </tr>
        </tbody>
      </table>

      <h2>Query Keys, Caching TTLs, and Invalidation</h2>
      <h3>Cache policy example</h3>
      <table>
        <thead>
          <tr>
            <th>Query key pattern</th>
            <th>TTL</th>
            <th>Invalidate when</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>['search', query, filters, sort]</code></td>
            <td>15-30s</td>
            <td>Query/filter/sort changes, relevant mutation</td>
            <td>Short TTL for high interaction flows</td>
          </tr>
          <tr>
            <td><code>['entity', id]</code></td>
            <td>60-120s</td>
            <td>Entity update/delete, permission change</td>
            <td>Stable detail reads with targeted invalidation</td>
          </tr>
          <tr>
            <td><code>['list', segment, cursor]</code></td>
            <td>30-90s</td>
            <td>New create event affecting ordering</td>
            <td>Cursor-aware invalidation avoids full reset</td>
          </tr>
        </tbody>
      </table>

      <h3>What interviewers want to hear</h3>
      <ul>
        <li>You define key shape before saying "we will cache."</li>
        <li>You combine time-based and event-based invalidation.</li>
        <li>You explicitly describe stale behavior and background refresh.</li>
      </ul>

      <h2>Pagination, Sorting, Filtering, and URL Sync</h2>
      <table>
        <thead>
          <tr>
            <th>Concern</th>
            <th>Decision</th>
            <th>Pitfall to avoid</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pagination</td>
            <td>Prefer cursor pagination for mutable lists</td>
            <td>Offset drift on frequently updated feeds</td>
          </tr>
          <tr>
            <td>Sorting</td>
            <td>Include sort token in query key and URL</td>
            <td>Cache collisions across sort modes</td>
          </tr>
          <tr>
            <td>Filtering</td>
            <td>Normalize filter order in keys and URLs</td>
            <td>Duplicate queries due to parameter order</td>
          </tr>
          <tr>
            <td>URL sync</td>
            <td>Keep shareable state in query params</td>
            <td>State lost on refresh/back/forward</td>
          </tr>
        </tbody>
      </table>

      <h2>Mutation Flows and Optimistic Updates</h2>
      <ol>
        <li>Capture previous cache snapshot for affected keys.</li>
        <li>Apply optimistic patch locally for immediate UI feedback.</li>
        <li>Send mutation request with idempotency token where possible.</li>
        <li>On success, reconcile server response and clear temp markers.</li>
        <li>On failure, rollback snapshot and show actionable error state.</li>
      </ol>
      <p>
        Script cue: "I will optimize read-your-writes UX with optimistic updates, but keep rollback explicit to avoid silent divergence."
      </p>

      <h2>Consistency and Sync Strategy</h2>
      <table>
        <thead>
          <tr>
            <th>Consistency level</th>
            <th>Where to use</th>
            <th>Frontend implication</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Strong</td>
            <td>Payments, inventory, permission-critical operations</td>
            <td>Block speculative UI; wait for confirmed server state</td>
          </tr>
          <tr>
            <td>Eventual</td>
            <td>Feeds, analytics counters, recommendations</td>
            <td>Allow stale view with explicit refresh semantics</td>
          </tr>
          <tr>
            <td>Read-your-writes UX</td>
            <td>User-triggered actions where instant feedback matters</td>
            <td>Use optimistic patch + rollback guardrail</td>
          </tr>
        </tbody>
      </table>

      <h2>Failure Modes and Recovery</h2>
      <table>
        <thead>
          <tr>
            <th>Failure mode</th>
            <th>User-visible behavior</th>
            <th>Data-model guardrail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Timeout under load</td>
            <td>Show stale cache + retry affordance</td>
            <td>Model stale flag + lastUpdated timestamp</td>
          </tr>
          <tr>
            <td>Partial backend response</td>
            <td>Render available sections with degraded notice</td>
            <td>Model partial response metadata per segment</td>
          </tr>
          <tr>
            <td>Mutation conflict</td>
            <td>Conflict prompt with server-authoritative view</td>
            <td>Version token and conflict status in contract</td>
          </tr>
          <tr>
            <td>Permission drift</td>
            <td>Disable restricted actions and refresh view</td>
            <td>Role/scope fields as part of entity payload</td>
          </tr>
        </tbody>
      </table>

      <h2>Security and Privacy Boundaries</h2>
      <ul>
        <li>Classify fields: public, authenticated, privileged.</li>
        <li>Never leak privileged fields into broad list endpoints if detail view needs auth checks.</li>
        <li>Avoid caching sensitive payloads in long-lived shared layers.</li>
        <li>Design contracts so client cannot infer restricted data from error shape.</li>
      </ul>

      <h2>Observability and Data Quality Signals</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Metric</th>
            <th>Alert direction</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Freshness</td>
            <td>Stale-state dwell time by route</td>
            <td>Alert when stale duration exceeds SLO window</td>
          </tr>
          <tr>
            <td>Correctness</td>
            <td>Client/server mismatch rate after mutation</td>
            <td>Alert on rollback spikes</td>
          </tr>
          <tr>
            <td>Resilience</td>
            <td>Partial-response ratio and timeout rate</td>
            <td>Alert on sudden trend breaks</td>
          </tr>
          <tr>
            <td>User impact</td>
            <td>Primary task completion rate</td>
            <td>Alert on significant drop after release</td>
          </tr>
        </tbody>
      </table>

      <h2>What to Say Out Loud (Data Model Script Cues)</h2>
      <ol>
        <li>"I will define entities and ownership boundaries before discussing libraries."</li>
        <li>"I am separating server truth, UI state, and URL state to avoid sync confusion."</li>
        <li>"I will model all critical UI states: idle, loading, success, empty, error, stale, and partial."</li>
        <li>"I am defining query keys first so caching and invalidation stay predictable."</li>
        <li>"Trade-off here: shorter TTL improves freshness but increases backend load."</li>
        <li>"I will use optimistic updates only where rollback is safe and explicit."</li>
        <li>"For this flow, eventual consistency is acceptable; strong consistency is reserved for critical writes."</li>
        <li>"I am keeping shareable filters and pagination in URL state for deep links."</li>
        <li>"I will instrument stale time, mutation rollback rate, and partial responses to validate this model."</li>
        <li>"With data contracts locked, I can now move to interface behavior confidently."</li>
      </ol>

      <h2>Data Model Timebox for Interviews</h2>
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
            <td>Sketch top entities and relations</td>
            <td>Entity map</td>
          </tr>
          <tr>
            <td>2:00-4:00</td>
            <td>Define state ownership boundaries</td>
            <td>Ownership table</td>
          </tr>
          <tr>
            <td>4:00-6:00</td>
            <td>Set query keys, TTL, invalidation</td>
            <td>Cache policy card</td>
          </tr>
          <tr>
            <td>6:00-8:00</td>
            <td>Cover UI states + mutation failure handling</td>
            <td>UI states matrix + rollback notes</td>
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
            <td>Entity model with field-level contracts</td>
            <td>Entity and contract sheet</td>
          </tr>
          <tr>
            <td>3:00-6:00</td>
            <td>State ownership and URL sync rules</td>
            <td>Ownership and URL table</td>
          </tr>
          <tr>
            <td>6:00-9:00</td>
            <td>Caching and invalidation by use case</td>
            <td>TTL and invalidation matrix</td>
          </tr>
          <tr>
            <td>9:00-12:00</td>
            <td>Mutation conflict, consistency, observability recap</td>
            <td>Hardening checklist</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Drill: Typeahead Data Model in 7 Minutes</h2>
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
            <td>Entity sketch: Suggestion, SearchResponse, ErrorPayload</td>
          </tr>
          <tr>
            <td>1-2</td>
            <td>State ownership split: server results, UI highlight index, URL query</td>
          </tr>
          <tr>
            <td>2-3</td>
            <td>UI states matrix including empty/error/stale/partial</td>
          </tr>
          <tr>
            <td>3-4</td>
            <td>Query key pattern and TTL decisions</td>
          </tr>
          <tr>
            <td>4-5</td>
            <td>Invalidation triggers for query change and mutation</td>
          </tr>
          <tr>
            <td>5-6</td>
            <td>Optimistic update and rollback notes for save/recent actions</td>
          </tr>
          <tr>
            <td>6-7</td>
            <td>Telemetry: latency, error, stale ratio, zero-result rate</td>
          </tr>
        </tbody>
      </table>

      <h2>Before You Move to Interface</h2>
      <ul>
        <li>Entities and relationships are explicit and bounded.</li>
        <li>Server truth, UI state, and URL state are clearly separated.</li>
        <li>All critical UI states are modeled, not implied.</li>
        <li>Cache keys, TTLs, and invalidation triggers are concrete.</li>
        <li>Mutation rollback and conflict handling are defined.</li>
        <li>Security, privacy, and observability considerations are included.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'interface']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'optimizations']">O - Optimizations deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignStateArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
