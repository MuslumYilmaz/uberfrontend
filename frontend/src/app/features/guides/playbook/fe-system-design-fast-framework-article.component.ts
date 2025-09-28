// -----------------------------------------------------------------------------
// Client-Side System Design: A Fast Framework
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    a { color:#7CC2FF; text-decoration:none; border-bottom:1px dotted transparent; transition:color .15s, border-color .15s; }
    a:hover { color:#A9DBFF; border-color:currentColor; }
    h3 a { display:inline-flex; align-items:center; gap:6px; font-weight:700; }
    h3 a::after { content:"→"; opacity:.7; transition:transform .15s, opacity .15s; }
    h3 a:hover::after { transform:translateX(2px); opacity:1; }

    .guide-content { max-width:760px; line-height:1.65; font-size:16.5px; color:#E6EAF2; }
    .guide-content h2 { margin:1.8rem 0 .6rem; font-size:1.25rem; }
    .guide-content h3 { margin:1.2rem 0 .4rem; font-size:1.05rem; }
    .guide-content ul, .guide-content ol { margin:.2rem 0 .9rem 1.2rem; }
    .guide-content li { margin:.28rem 0; }

    .guide-content pre {
      background:#0C1016;
      border:1px solid rgba(255,255,255,.08);
      padding:.8rem;
      border-radius:10px;
      overflow:auto;
      margin:.6rem 0 1rem;
    }
    .guide-content pre code {
      font-family:'Fira Code', monospace;
      font-size:14px;
      line-height:1.5;
      white-space:pre;
      background:transparent;
      border:0;
      padding:0;
    }
  `],
  template: `
  <uf-guide-shell
    title="Client-Side System Design: A Fast Framework"
    subtitle="How to think about front-end system design in interviews."
    [minutes]="15"
    [tags]="['system-design','frontend','architecture']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <p>
      In front-end interviews, “system design” doesn’t mean load balancers and databases —
      it means: <strong>how do you structure components, state, and data flow so the UI
      stays fast and maintainable</strong>.  
    </p>
    <p>
      ⚡ Note: This round is almost always for <strong>senior roles</strong>. 
      Companies use it to check if you can zoom out, design at scale, and guide a team.
      If you’ve only prepared for coding rounds, this one can feel unfamiliar — but it’s 
      just about showing clear, structured thinking.
    </p>

    <h2>Step 1: Clarify the feature</h2>
    <p>
      Start by restating the problem in plain English and locking the scope. This shows you
      understand the ask and won’t overbuild.
    </p>
    <ul>
      <li>&quot;A dashboard with filters and a data table (sort, paginate, select rows).&quot;</li>
      <li>&quot;A chat widget with unread counts and typing indicator.&quot;</li>
      <li>&quot;An image uploader with preview, progress, and retry on failure.&quot;</li>
    </ul>

    <p><strong>Ask before you build:</strong></p>
    <ol class="step-list">
      <li><strong>Users &amp; roles:</strong> Who uses it? Any permissions or read-only states?</li>
      <li><strong>Data shape &amp; scale:</strong> How many items? Server paginated or client paginated? Max payload size?</li>
      <li><strong>Performance targets:</strong> Any latency or rendering goals (e.g., &lt; 100ms filter updates)?</li>
      <li><strong>Offline &amp; resilience:</strong> Should it work offline? How do we handle errors and retries?</li>
      <li><strong>Accessibility:</strong> Keyboard behavior, focus management, ARIA expectations?</li>
      <li><strong>Out of scope:</strong> What can we explicitly skip for MVP?</li>
    </ol>

    <p>
      <strong>30-second script:</strong> &quot;Let me restate the goal. Success looks like X (MVP).
      Constraints are Y (scale, perf, a11y). Unknowns are Z (I&apos;ll assume sensible defaults).
      I&apos;ll start with the minimal path, then add error states and keyboard support.&quot;
    </p>

    <h2>Step 2: Break down responsibilities</h2>
    <p>
      Once the scope is clear, sketch the main moving pieces and what each owns.
      Interviewers want to see that you can <strong>modularize the problem</strong>
      instead of dumping everything into one file.
    </p>

    <ul>
      <li>
        <strong>UI shell:</strong>  
        Handles layout, routing, theme providers, and global error boundaries.
        Think of it as the stage where features plug in.
      </li>
      <li>
        <strong>Feature modules:</strong>  
        Self-contained slices like <em>Filters</em>, <em>Table</em>, or <em>Chart</em>.
        Each has its own state + UI logic.
      </li>
      <li>
        <strong>Shared components:</strong>  
        Building blocks — buttons, modals, dropdowns — designed once and reused
        across features.
      </li>
      <li>
        <strong>State:</strong>  
        Decide what stays local (form inputs) vs global (auth, theme, user session).
        Also call out sync vs async state and how you’ll coordinate it.
      </li>
    </ul>

    <p>
      🔑 <strong>Interview tip:</strong> Use the whiteboard/notes to draw a quick box diagram:
      “Shell → Features → Shared.” It takes 15 seconds but shows you think
      in systems, not snippets.
    </p>

    <h2>Step 3: State management</h2>
    <p>
      Show you can decide <strong>where state belongs</strong>. A very common pitfall
      in interviews is throwing everything into global state. Instead, use this
      quick rule of thumb:
    </p>

    <ul>
      <li>
        <em>Local state:</em>  
        UI-only, short-lived values like <code>open/close</code> flags or
        form inputs. Keeps components predictable and isolated.
      </li>
      <li>
        <em>Global state:</em>  
        Data shared across multiple routes or distant components:
        <code>user</code>, <code>cart</code>, <code>theme</code>. Use sparingly —
        interviewers want to see you’re not overengineering.
      </li>
      <li>
        <em>Server cache:</em>  
        Remote data that should be fetched, normalized, and reused
        (<code>products</code>, <code>posts</code>). In React, tools like
        React Query or SWR often shine here.
      </li>
    </ul>

    <h3>React example:</h3>
    <pre><code class="language-tsx">function Dashboard() &#123;
      const [filters, setFilters] = useState(&#123; sort: "date", tag: null &#125;);
      const [data, setData] = useState&lt;Item[]&gt;([]);

      useEffect(() =&gt; &#123;
        fetchData(filters).then(setData);
      &#125;, [filters]);

      return (
        &lt;div&gt;
          &lt;Filters value=&#123;filters&#125; onChange=&#123;setFilters&#125; /&gt;
          &lt;Table rows=&#123;data&#125; /&gt;
        &lt;/div&gt;
      );
    &#125;</code></pre>

    <p>
      🔑 <strong>Interview tip:</strong> As you code, narrate out loud:
      “Filters are local state, data is server-fetched and cached. I’d only
      move something global if multiple routes needed it.” That narration shows
      architectural judgment, not just coding skills.
    </p>

    <h2>Step 4: Data flow &amp; boundaries</h2>
    <p>
      Show you can describe <strong>how data moves</strong> through the system.  
      A clean mental model (and answer in interviews) is:
    </p>
    <p style="text-align:center">
      <strong>server → fetch layer → global cache → components</strong>
    </p>

    <p>
      This proves you’re not just wiring things randomly — you’re thinking in
      layers and boundaries. Each layer has a single responsibility:
    </p>
    <ul>
      <li><strong>Server:</strong> the source of truth (REST, GraphQL, Firebase, etc.).</li>
      <li><strong>Fetch layer:</strong> wraps API calls, handles retries and errors.</li>
      <li><strong>Global cache:</strong> normalizes and reuses data across the app (React Query, SWR, NgRx).</li>
      <li><strong>Components:</strong> consume the cache via hooks/selectors and render UI.</li>
    </ul>

    <h3>React example with a query hook:</h3>
    <pre><code class="language-tsx">// fetch layer
    async function fetchPosts() &#123;
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    &#125;

    // hook
    function usePosts() &#123;
      return useQuery(&#39;posts&#39;, fetchPosts);
    &#125;

    // component
    function Feed() &#123;
      const &#123; data: posts, isLoading, error &#125; = usePosts();
      if (isLoading) return &lt;p&gt;Loading...&lt;/p&gt;;
      if (error) return &lt;p&gt;Error loading posts&lt;/p&gt;;
      return &lt;PostList posts=&#123;posts&#125; /&gt;;
    &#125;</code></pre>

    <p>
      🔑 <strong>Interview tip:</strong> Narrate boundaries out loud:
      “I’d keep fetching logic separate from components, cache results in React Query,
      and only pass the minimal props needed.”  
      This shows you know how to design for scale, not just make it work.
    </p>

    <h2>Step 5: Trade-offs &amp; extensions</h2>
    <p>
      Once you’ve sketched the core design, show you can <strong>think beyond the happy path</strong>.  
      Senior interviewers are looking for your ability to weigh trade-offs and plan for growth.
    </p>

    <ul>
      <li>
        <strong>Performance:</strong>  
        Mention pagination for large lists, virtualization for infinite scrolls, and memoization
        to avoid rerender storms. Highlight that you’d only add these when real data demands it.
      </li>
      <li>
        <strong>Accessibility:</strong>  
        Don’t just say “I’ll add ARIA” — call out specific things like keyboard traps for modals,
        roles for widgets, or hidden text for screen readers.
      </li>
      <li>
        <strong>Error states:</strong>  
        Users don’t always get happy flows. Show you’d handle loading, retries, and graceful
        fallbacks (e.g., “Retry” button or empty-state message).
      </li>
      <li>
        <strong>Scale:</strong>  
        Say out loud: “If we had to add new features (sorting, filters, themes), could we extend
        without rewriting?” That proves you’re thinking API-first, not one-off hacks.
      </li>
    </ul>

    <p>
      💡 <strong>Interview tip:</strong> Don’t just list buzzwords. Tie trade-offs to the actual prompt.  
      Example: “If the dashboard grows to thousands of rows, I’d reach for virtualization.”  
      That keeps your answer grounded and practical.
    </p>

    <h2>Step 6: Communicate patterns</h2>
    <p>
      Senior interviews aren’t just about the code — they’re about how clearly you
      <strong>frame your approach</strong>. Using small repeatable patterns keeps you structured
      and shows the interviewer you think in systems, not one-off hacks.
    </p>

    <ul>
      <li>
        <strong>ICE (Inputs → Constraints → Examples):</strong>  
        Before diving in, say out loud what inputs you’ll handle, what constraints apply
        (time, performance, edge cases), and run through a quick example.
      </li>
      <li>
        <strong>MVP first:</strong>  
        Spell out what you’d ship in 15 minutes (barebones version) versus what you’d add
        if given 2 hours (edge cases, polish, animations). This shows prioritization.
      </li>
      <li>
        <strong>Layered design:</strong>  
        Describe your state flow in layers: local state for UI toggles → global store for
        shared data → server cache for persistent results. Simple, scalable, and clear.
      </li>
    </ul>

    <p>
      💡 <strong>Tip:</strong> Even if your code has rough edges, interviewers will rate you higher
      if your <em>communication is systematic</em>. Patterns give you that structure under pressure.
    </p>

    <h2>Wrap-up</h2>
    <p>
      A strong system design answer isn’t about buzzwords. It’s about showing that
      you can <strong>keep UIs simple, performant, and maintainable under real-world
      demands</strong>. 
    </p>
    <p>
      One trick: deliver your answer like a <strong>STAR story</strong>.  
      - <em>Situation:</em> restate the problem (“We need a dashboard with filters and charts”).  
      - <em>Task:</em> define what the interviewer is asking for (“Design the client-side architecture”).  
      - <em>Action:</em> explain your approach step by step (state choices, data flow, performance trade-offs).  
      - <em>Result:</em> close with what this design achieves (“Scales to thousands of rows, accessible by default, easy to extend”).  
    </p>
    <p>
      If you structure your answer this way, you’ll come across as someone who can 
      not just code — but <strong>design, communicate, and lead</strong>.
    </p>
  </uf-guide-shell>
  `
})
export class FeSystemDesignFastFrameworkArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
