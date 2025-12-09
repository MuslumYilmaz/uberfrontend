import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="State, Data Flow, and Caching"
      [minutes]="15"
      [tags]="['system design','state','data','caching']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Most front-end scale problems are really <strong>state and data-flow</strong> problems:
        what do we store, where does it live, how does it stay fresh, and how do we
        keep it fast for users? This guide gives you patterns and phrases that work in interviews —
        and in production.
      </p>

      <h2>The 3 kinds of state (know where it lives)</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Kind</th>
            <th style="text-align:left;">Examples</th>
            <th style="text-align:left;">Where it lives</th>
            <th style="text-align:left;">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>UI / Local</strong></td>
            <td>modal open, input value, tab index</td>
            <td>component state</td>
            <td>Ephemeral; don’t globalize.</td>
          </tr>
          <tr>
            <td><strong>App / Global</strong></td>
            <td>auth user, feature flags, cart</td>
            <td>global store (signals/NgRx/Zustand/etc.)</td>
            <td>Share across routes; keep minimal.</td>
          </tr>
          <tr>
            <td><strong>Server / Remote</strong></td>
            <td>products, feed, profile</td>
            <td>server cache (RTK Query/React Query/SWR, custom Rx cache)</td>
            <td>Treat as cached data, not “truth.”</td>
          </tr>
        </tbody>
      </table>

      <h2>Data-flow patterns (pick one and be consistent)</h2>
      <ul>
        <li><strong>Unidirectional:</strong> View → Action → Store → View. Predictable, easy to test.</li>
        <li><strong>Event-driven / PubSub:</strong> Components publish events; subscribers react. Decouple, but traceability cost.</li>
        <li><strong>Reactive streams:</strong> Observables/Signals for push-based updates; great for real-time UIs.</li>
      </ul>
      <p><em>Interview script:</em> “I’ll keep UI state local, shared state in a small global store, and remote data via a server-cache with unidirectional updates.”</p>

      <h2>Fetching strategies</h2>
      <p>
        How and when you fetch data directly affects performance and UX. 
        Interviewers like to see if you can balance <em>speed, freshness, and efficiency</em>. 
        Here are the main approaches:
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Strategy</th>
            <th style="text-align:left;">What it means</th>
            <th style="text-align:left;">Example</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>On demand</strong></td>
            <td>Fetch only when the view loads or user takes an action</td>
            <td>Load orders when user opens the “Orders” tab</td>
            <td>Saves bandwidth, but may delay first paint</td>
          </tr>
          <tr>
            <td><strong>Prefetch / warm</strong></td>
            <td>Fetch ahead of time based on navigation hints</td>
            <td>Hovering a link triggers prefetch of the next page</td>
            <td>Faster nav, but risk of wasted requests</td>
          </tr>
          <tr>
            <td><strong>Pagination / infinite scroll</strong></td>
            <td>Load results in chunks (by page or cursor)</td>
            <td>Twitter feed loading 20 tweets at a time</td>
            <td>Keeps memory low, but requires cursor logic</td>
          </tr>
          <tr>
            <td><strong>Background refresh</strong></td>
            <td>Refetch in the background on focus, reconnect, or interval</td>
            <td>Refetch notifications when user returns to the tab</td>
            <td>Data fresher, but can add extra server load</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview script:</em> 
        “For v1, I’d fetch data on demand to stay simple. 
        Later, we could prefetch critical pages and use background refresh on focus 
        to balance freshness with cost.”
      </p>

      <h2>Caching layers (you can stack these)</h2>
      <p>
        Caching isn’t one-size-fits-all — layers build on each other. 
        A senior answer shows you know <em>where each layer lives, what it solves, 
        and what the trade-offs are</em>.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Layer</th>
            <th style="text-align:left;">What it solves</th>
            <th style="text-align:left;">Example</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>HTTP caching</strong></td>
            <td>Re-use responses between client & server</td>
            <td><code>ETag</code>, <code>Last-Modified</code>, <code>Cache-Control</code></td>
            <td>Simple and cheap, but only for GET requests</td>
          </tr>
          <tr>
            <td><strong>CDN edge</strong></td>
            <td>Reduce latency by serving from the edge</td>
            <td>Static/SSG pages, images, cached API GETs</td>
            <td>Global reach, but invalidation can be tricky</td>
          </tr>
          <tr>
            <td><strong>App memory</strong></td>
            <td>Instant reads inside the running app</td>
            <td>In-memory normalized cache keyed by IDs</td>
            <td>Fastest, but volatile (cleared on reload)</td>
          </tr>
          <tr>
            <td><strong>Service Worker</strong></td>
            <td>Offline resilience + background sync</td>
            <td>Cache shell + data for offline-first apps</td>
            <td>More complex logic; sync conflicts possible</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview script:</em> 
        “I’d stack caching: browser HTTP cache first, CDN for static assets, 
        an in-memory normalized cache for app state, and a Service Worker 
        if offline is required.”
      </p>

      <h3>Invalidation strategies (the hard part)</h3>
      <p>
        Caching is easy — keeping it <em>correct</em> is the hard part. 
        Interviewers want to see if you know more than just “we’ll cache it” 
        and can explain <strong>how you keep data fresh without over-fetching</strong>.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Strategy</th>
            <th style="text-align:left;">How it works</th>
            <th style="text-align:left;">When to use</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Time-based</strong></td>
            <td>Expire after TTL, re-fetch after N seconds</td>
            <td>Feeds, dashboards with tolerable staleness</td>
            <td>Simple, but may refresh too often or too late</td>
          </tr>
          <tr>
            <td><strong>Event-based</strong></td>
            <td>On write/mutation, invalidate affected cache</td>
            <td>When user actions directly change data (e.g., add post)</td>
            <td>More precise, but requires wiring invalidation logic</td>
          </tr>
          <tr>
            <td><strong>Tag-based</strong></td>
            <td>Group cache keys by “tags” (e.g. <code>['post', id]</code>)</td>
            <td>APIs with many related queries (list + detail)</td>
            <td>Flexible, but adds cache management complexity</td>
          </tr>
          <tr>
            <td><strong>Stale-While-Revalidate (SWR)</strong></td>
            <td>Show cached data instantly, refresh in background</td>
            <td>UX-critical paths (dashboards, feeds)</td>
            <td>Best UX, but requires background fetch & merge logic</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview script:</em> 
        “I’d go with SWR semantics: show stale cache immediately, 
        trigger a background fetch, then reconcile. 
        For writes, I’d invalidate related tags so the next read pulls fresh data.”
      </p>

      <h2>Consistency & freshness</h2>
      <p>
        A common system design pitfall is treating all data as if it must always be 
        up to the millisecond. In reality, <strong>different features need different levels 
        of consistency</strong>. Showing you can reason about this is a high-signal move.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Level</th>
            <th style="text-align:left;">What it means</th>
            <th style="text-align:left;">When it’s used</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Strong</strong></td>
            <td>Every read reflects the most recent write</td>
            <td>Banking apps, payments, inventory counts</td>
            <td>Expensive; adds latency and infra cost</td>
          </tr>
          <tr>
            <td><strong>Eventual</strong></td>
            <td>Reads may briefly show stale data</td>
            <td>Feeds, comments, like counters</td>
            <td>Simpler + faster, but UI may “lag” briefly</td>
          </tr>
          <tr>
            <td><strong>Read-your-writes UX</strong></td>
            <td>Optimistic update so <em>my</em> action looks instant</td>
            <td>Social actions (like, post, follow)</td>
            <td>Great UX; needs rollback/merge on failure</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview script:</em> 
        “For user actions like likes, I’d use optimistic updates (read-your-writes) 
        to keep UX snappy. For global counters, eventual consistency is fine. 
        If it’s money or inventory, we’d need strong consistency.”
      </p>

      <h2>Real-time sync options</h2>
      <p>
        Many front-end systems need “fresh” data, but not all require the same level of 
        real-time sync. Interviewers want to see if you can <strong>choose the simplest tool 
        that works, and only add complexity when necessary</strong>.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Option</th>
            <th style="text-align:left;">How it works</th>
            <th style="text-align:left;">Best for</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Polling</strong></td>
            <td>Client fetches data on interval</td>
            <td>Dashboards, low-frequency updates</td>
            <td>Simple; can waste requests if too frequent</td>
          </tr>
          <tr>
            <td><strong>SSE (Server-Sent Events)</strong></td>
            <td>One-way push from server → client</td>
            <td>Live feeds, tickers, notifications</td>
            <td>Lightweight; limited browser support vs WebSocket</td>
          </tr>
          <tr>
            <td><strong>WebSocket</strong></td>
            <td>Bi-directional persistent connection</td>
            <td>Chat, collaborative editing, presence</td>
            <td>Powerful; higher infra + scaling complexity</td>
          </tr>
          <tr>
            <td><strong>Push + refresh</strong></td>
            <td>Server sends a hint/ID → client fetches data</td>
            <td>Updates where payloads are large (e.g., new doc version)</td>
            <td>Efficient, but requires coordination between push + fetch</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Guideline:</em> 
        Start with <strong>polling</strong> for simplicity. 
        Move to <strong>SSE or WebSocket</strong> only if interactivity demands it. 
        That trade-off reasoning is what interviewers want to hear.
      </p>

      <h2>Offline & conflict handling</h2>
      <p>
        Real users don’t always have stable connections. 
        Showing you can design for <strong>offline resilience</strong> 
        (and resolve conflicts when users reconnect) 
        is a big signal of senior-level thinking.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Technique</th>
            <th style="text-align:left;">What it solves</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Caching policy</strong></td>
            <td>Serve assets or data when network is unavailable</td>
            <td>Cache-first is great for static assets; but stale for dynamic data</td>
          </tr>
          <tr>
            <td><strong>Queue writes</strong></td>
            <td>Capture user actions offline; replay when back online</td>
            <td>Improves UX, but needs background sync & retry logic</td>
          </tr>
          <tr>
            <td><strong>Conflict resolution</strong></td>
            <td>Handle when two clients update the same data</td>
            <td>
              Last-write-wins is simple but lossy.  
              Version checks prevent silent overwrites.  
              Merge functions give best UX but add complexity.
            </td>
          </tr>
        </tbody>
      </table>

      <blockquote>
        <em>Interview script:</em>  
        “For an offline notes app, I’d cache the shell + recent notes in a Service Worker.  
        Edits are queued with version fields. On sync, if versions clash, 
        I’d show a diff so the user can merge — rather than silently overwriting.”
      </blockquote>

      <h2>Performance levers for data UX</h2>
      <p>
        In front-end design, performance is often more about <strong>perceived speed</strong> 
        than raw milliseconds. Interviewers want to see if you know the 
        <em>practical levers</em> that keep UIs feeling snappy, even when data is large or slow.
      </p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Lever</th>
            <th style="text-align:left;">What it solves</th>
            <th style="text-align:left;">Example</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Skeletons & optimistic UI</strong></td>
            <td>Reduce perceived wait time</td>
            <td>Show a skeleton post, or add a “like” instantly</td>
            <td>Needs rollback logic if optimistic update fails</td>
          </tr>
          <tr>
            <td><strong>Partial hydration / code-splitting</strong></td>
            <td>Avoid blocking on heavy widgets</td>
            <td>Defer loading of chart libraries until tab is opened</td>
            <td>Extra build complexity; risk of “pop-in” if delayed</td>
          </tr>
          <tr>
            <td><strong>List virtualization</strong></td>
            <td>Handle very large lists efficiently</td>
            <td>Render only items in viewport (e.g., 10 of 10k rows)</td>
            <td>Harder to implement; can break scroll-to-index features</td>
          </tr>
          <tr>
            <td><strong>Batching & debouncing</strong></td>
            <td>Smooth out rapid updates / reduce re-renders</td>
            <td>Debounce search input, batch socket updates</td>
            <td>May delay feedback slightly if tuned poorly</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview script:</em>  
        “I’d keep the UI responsive by using skeletons and optimistic updates for perceived speed, 
        code-splitting heavy charts, virtualizing long lists, and debouncing rapid inputs. 
        That way the app feels fast even under load.”
      </p>

      <h2>Putting it together (example: social feed)</h2>
      <ol>
        <li><strong>State split:</strong> local (composer open), global (auth/profile), server cache (posts by cursor).</li>
        <li><strong>Data flow:</strong> unidirectional; actions dispatch → cache updates → UI.</li>
        <li><strong>Fetching:</strong> initial page on mount, prefetch next page on scroll ~70%.</li>
        <li><strong>Caching:</strong> normalize posts by <code>id</code>; keep cursors per filter.</li>
        <li><strong>Invalidation:</strong> on create/delete/like → invalidate/patch affected post & feed tag.</li>
        <li><strong>Freshness:</strong> SWR on focus/reconnect; “New posts” toast when background fetch finds more.</li>
        <li><strong>Real-time:</strong> SSE for “new post” hints; fetch item by ID to avoid over-the-wire bloat.</li>
      </ol>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Concern</th>
            <th style="text-align:left;">Choice</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pagination</td>
            <td>Cursor-based prefetch at 70%</td>
            <td>Smoother UX, but requires server support</td>
          </tr>
          <tr>
            <td>Caching</td>
            <td>Normalized by <code>id</code></td>
            <td>Efficient updates, but adds complexity</td>
          </tr>
          <tr>
            <td>Invalidation</td>
            <td>Event-based (on mutation)</td>
            <td>Correctness, but need discipline in wiring</td>
          </tr>
          <tr>
            <td>Freshness</td>
            <td>SWR on focus/reconnect</td>
            <td>Great for occasional refresh, but still stale mid-session</td>
          </tr>
          <tr>
            <td>Real-time</td>
            <td>SSE hints + fetch by ID</td>
            <td>Lightweight, but not full sync like WebSocket</td>
          </tr>
        </tbody>
      </table>

      <p>
        <em>Interview phrasing:</em>  
        “For a social feed, I’d normalize posts in cache, use cursor pagination with prefetch, 
        event-based invalidation on likes/deletes, and SWR on focus. For real-time, I’d use SSE hints 
        to avoid heavy payloads. That way, users see a responsive feed without overcomplicating v1.”
      </p>

      <h2>Common pitfalls (and what to say instead)</h2>
      <ul>
        <li><strong>Everything in global state:</strong> bloats re-renders. <em>Keep UI state local.</em></li>
        <li><strong>Manual caches everywhere:</strong> bugs & drift. <em>Centralize in one server-cache layer with tags.</em></li>
        <li><strong>No invalidation story:</strong> stale UI. <em>Pick time-based + event/tag invalidation.</em></li>
        <li><strong>Real-time by default:</strong> unnecessary complexity. <em>Start with polling; upgrade when needed.</em></li>
      </ul>

      <h2>Cheat sheet (use in your answer)</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Topic</th>
            <th style="text-align:left;">High-signal line</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>State split</td>
            <td>“UI local, minimal global, server data in a normalized cache.”</td>
          </tr>
          <tr>
            <td>Fetching</td>
            <td>“On-demand + prefetch; cursor pagination; background refresh on focus.”</td>
          </tr>
          <tr>
            <td>Invalidation</td>
            <td>“SWR + tag-based invalidation after writes.”</td>
          </tr>
          <tr>
            <td>Real-time</td>
            <td>“Start polling; move to SSE/WebSocket if interaction requires it.”</td>
          </tr>
          <tr>
            <td>Offline</td>
            <td>“Cache shell; queue writes; versioned conflict handling.”</td>
          </tr>
        </tbody>
      </table>

      <h2>Takeaway</h2>
      <p>
        Senior-level answers don’t list libraries — they show <strong>where state lives</strong>,
        <strong>how data flows</strong>, and <strong>how caches stay honest</strong>.
        If you consistently tie choices to scope and constraints, you’ll sound like someone who can
        keep complex UIs fast, correct, and maintainable at scale.
      </p>

    </fa-guide-shell>
  `,
})
export class SystemDesignStateArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
