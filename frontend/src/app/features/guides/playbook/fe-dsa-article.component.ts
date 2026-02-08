// -----------------------------------------------------------------------------
// Just-Enough DSA for Front-End
// Purpose
//   - Give FE candidates the smallest DSA set that actually shows up.
//   - Tie each topic to real UI problems (undo/redo, grouping, rendering).
//   - Provide drills, a mini plan, and what to safely skip.
// Authoring notes
//   - Keep it friendly and practical; no theory dumps.
//   - All code blocks escape <, >, {, } to avoid Angular ICU errors.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    styles: [`
    /* Subtle but visible links; underline on hover only */
    .guide-content a { color:#7CC2FF; text-decoration:none; border-bottom:1px dotted transparent; transition: color .15s, border-color .15s; }
    .guide-content a:hover { color:#A9DBFF; border-color: currentColor; }

    /* Headings spacing */
    .guide-content h2 { margin: 1.8rem 0 .6rem; font-size: 1.25rem; }
    .guide-content h3 { margin: 1.2rem 0 .4rem; font-size: 1.05rem; }

    /* Tables */
    .guide-content table { width:100%; border-collapse:collapse; background:#111418; border:1px solid rgba(255,255,255,.08); border-radius:8px; overflow:hidden; font-size:15px; }
    .guide-content thead th { background:#151921; text-align:left; padding:.6rem .7rem; border-bottom:1px solid rgba(255,255,255,.08); }
    .guide-content tbody td { padding:.55rem .7rem; border-top:1px solid rgba(255,255,255,.06); }
    .guide-content tbody tr:nth-child(odd){ background:#0E1218; }

    /* Code blocks */
    .guide-content pre { background:#0C1016; border:1px solid rgba(255,255,255,.08); padding:.8rem; border-radius:10px; overflow:auto; }

    /* Nice numbered lists with pills */
    ol.pills { counter-reset:item; margin:.4rem 0 1rem; padding-left:0; }
    ol.pills > li { list-style:none; counter-increment:item; position:relative; padding-left:1.9rem; margin:.4rem 0; }
    ol.pills > li::before {
      content: counter(item);
      position:absolute; left:0; top:.15rem;
      width:1.4rem; height:1.4rem; display:grid; place-items:center;
      border-radius:9999px; background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.16); color:#cfe1ff; font-weight:700; font-size:.8rem;
    }
  `],
    template: `
  <fa-guide-shell
    title="DSA for Frontend Interviews: Just Enough to Pass Coding Rounds"
    subtitle="The minimum arrays/maps/queues toolkit and patterns you need to solve frontend coding interviews."
    [minutes]="12"
    [tags]="['coding','fundamentals','practice']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <!-- Intro -->
    <p>
      You don’t need red–black trees to get a front-end offer. Most interviews test
      whether you can handle <strong>everyday data problems</strong> you hit while building UIs:
      shape arrays, count things, manage history, reason about async, and keep it efficient enough.
    </p>
    <p>
      Treat this as a <strong>minimum toolkit</strong>. Know these patterns well, and you’ll be ready
      for 90% of coding rounds without grinding endless puzzles.
    </p>

    <!-- Section 1 -->
    <h2>What to actually know</h2>
    <table>
      <thead>
        <tr><th>Topic</th><th>You should be able to…</th><th>Real FE tie-in</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Arrays &amp; Strings</strong></td>
          <td>map/filter/reduce; slice/splice; join/split; substrings</td>
          <td>Format API data, paginate lists, search in text inputs</td>
        </tr>
        <tr>
          <td><strong>Maps &amp; Sets</strong></td>
          <td>O(1) lookups; counts; dedupe</td>
          <td>Count clicks; group items; unique tags/ids</td>
        </tr>
        <tr>
          <td><strong>Stacks &amp; Queues</strong></td>
          <td>push/pop; enqueue/dequeue; two-stack tricks</td>
          <td>Undo/redo; back/forward; task scheduling</td>
        </tr>
        <tr>
          <td><strong>Trees (light)</strong></td>
          <td>Traverse (DFS/BFS); flatten nested data</td>
          <td>Render menus, comments, folders</td>
        </tr>
        <tr>
          <td><strong>Recursion basics</strong></td>
          <td>Turn recursive to iterative when needed</td>
          <td>Nested components; deep search</td>
        </tr>
        <tr>
          <td><strong>Sorting &amp; searching</strong></td>
          <td>Use built-ins; compare O(n log n) vs O(n²)</td>
          <td>Sort tables; binary search on pre-sorted data</td>
        </tr>
        <tr>
          <td><strong>Big-O intuition</strong></td>
          <td>Estimate costs; avoid nested N² when possible</td>
          <td>Keep lists snappy; choose the right data structure</td>
        </tr>
      </tbody>
    </table>

    <!-- Section 2 -->
    <h2>Patterns you’ll reuse</h2>

    <h3>1) Frequency map (count things fast)</h3>
    <pre><code class="language-ts">function counts(str: string): Record&lt;string, number&gt; &#123;
  const m: Record&lt;string, number&gt; = &#123;&#125;;
  for (const ch of str) m[ch] = (m[ch] || 0) + 1;
  return m;
&#125;

// e.g. highlight most common search terms</code></pre>

    <h3>2) Dedupe with Set (no nested loops)</h3>
    <pre><code class="language-ts">const uniqueIds = Array.from(new Set([3,3,2,1,2])); // =&gt; [3,2,1]</code></pre>

    <h3>3) Group items (like a pivot)</h3>
    <pre><code class="language-ts">function groupBy&lt;T&gt;(arr: T[], keyFn: (x: T) =&gt; string): Record&lt;string, T[]&gt; &#123;
  const out: Record&lt;string, T[]&gt; = &#123;&#125;;
  for (const item of arr) &#123;
    const k = keyFn(item);
    (out[k] ||= []).push(item);
  &#125;
  return out;
&#125;</code></pre>

    <h3>4) Stack for undo/redo</h3>
    <pre><code class="language-ts">class History&lt;T&gt; &#123;
  private past: T[] = []; private future: T[] = []; private curr: T | null = null;
  set(v: T) &#123; if (this.curr !== null) this.past.push(this.curr); this.curr = v; this.future = []; &#125;
  undo() &#123; if (this.past.length) &#123; this.future.push(this.curr as T); this.curr = this.past.pop()!; &#125; &#125;
  redo() &#123; if (this.future.length) &#123; this.past.push(this.curr as T); this.curr = this.future.pop()!; &#125; &#125;
  get() &#123; return this.curr; &#125;
&#125;</code></pre>

    <h3>5) BFS/DFS (tree or graph-ish data)</h3>
    <pre><code class="language-ts">type Node = &#123; id: string; children?: Node[] &#125;;

function dfs(root: Node, visit: (n: Node) =&gt; void) &#123;
  const stack: Node[] = [root];
  while (stack.length) &#123;
    const n = stack.pop()!;
    visit(n);
    for (const c of (n.children || []).slice().reverse()) stack.push(c);
  &#125;
&#125;</code></pre>

    <!-- Section 3 -->
    <h2>Complexity: just enough to choose well</h2>
    <table>
      <thead>
        <tr><th>Structure / op</th><th>Lookup</th><th>Insert</th><th>Delete</th><th>Notes</th></tr>
      </thead>
      <tbody>
        <tr><td>Array (index)</td><td>O(1)</td><td>O(1) push</td><td>O(1) pop</td><td>Splice can be O(n)</td></tr>
        <tr><td>Array (search)</td><td>O(n)</td><td>—</td><td>—</td><td>Use Map/Set for frequent lookups</td></tr>
        <tr><td>Map / Set</td><td>O(1) avg</td><td>O(1) avg</td><td>O(1) avg</td><td>Great for counts/dedupe</td></tr>
        <tr><td>Queue (array)</td><td>—</td><td>push O(1)</td><td>shift O(n)</td><td>Use ring buffer or two stacks if heavy</td></tr>
        <tr><td>Stack</td><td>—</td><td>push O(1)</td><td>pop O(1)</td><td>Undo/redo, parsing</td></tr>
      </tbody>
    </table>

    <!-- Section 4 -->
    <h2>Tie it back to the browser</h2>
    <ul>
      <li><strong>GroupBy + Map:</strong> aggregate analytics by route, user, or event type.</li>
      <li><strong>Set:</strong> unique selected ids in multi-select UIs.</li>
      <li><strong>Stack/Queue:</strong> history panes, toasts, task runners.</li>
      <li><strong>DFS:</strong> render nested comments or sitemap trees.</li>
      <li><strong>Big-O instinct:</strong> avoid N² filters on large lists; preindex with a Map.</li>
    </ul>

    <!-- Section 5 -->
    <h2>Practice drills (10–15 mins each)</h2>
    <ol class="pills">
      <li><strong>unique</strong>(arr): return array without duplicates (Set).</li>
      <li><strong>countBy</strong>(arr, fn): return frequency map by key (Map/Record).</li>
      <li><strong>topK</strong>(arr, k): pick top k items by score (sort or heap-lite via partial sort).</li>
      <li><strong>flatten</strong>(nested): recursively flatten arrays of arrays.</li>
      <li><strong>undo/redo</strong>: implement with two stacks.</li>
      <li><strong>binarySearch</strong>(sorted, x): quick index of an item (or insertion point).</li>
    </ol>
    <p>
      👉 Do these in the <a [routerLink]="['/coding']">coding practice area</a> under a timer to simulate interview pace.
    </p>

    <!-- Section 6 -->
    <h2>What you can safely skip (for FE interviews)</h2>
    <ul>
      <li>Advanced trees (AVL, red–black), heavy graph algorithms, max-flow, segment/fenwick trees.</li>
      <li>Dynamic programming beyond simple memoization patterns.</li>
      <li>Exotic data structures you’ve never used in real UI work.</li>
    </ul>
    <p>
      If a company truly needs those, they’ll say so up front. Most FE loops won’t.
      Spend your time where it pays off: data shaping, async control, and practical UI logic.
    </p>

    <!-- Section 7 -->
    <h2>Mini study plan (1 week)</h2>
    <table>
      <thead>
        <tr><th>Day</th><th>Focus</th><th>Target</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Mon</strong></td><td>Arrays &amp; Strings</td><td>3 drills (map/filter/reduce; substring; chunk)</td></tr>
        <tr><td><strong>Tue</strong></td><td>Maps &amp; Sets</td><td>counts, groupBy, unique</td></tr>
        <tr><td><strong>Wed</strong></td><td>Stacks &amp; Queues</td><td>undo/redo; queue with two stacks</td></tr>
        <tr><td><strong>Thu</strong></td><td>Trees &amp; Recursion</td><td>DFS render; flatten nested arrays</td></tr>
        <tr><td><strong>Fri</strong></td><td>Sorting/Search + Big-O</td><td>binary search; spot N² vs N log N</td></tr>
        <tr><td><strong>Sat</strong></td><td>Mock coding</td><td>1 × 45m timed session; narrate; retro</td></tr>
        <tr><td><strong>Sun</strong></td><td>Review</td><td>Re-do weak drills; write a 5-line summary of each topic</td></tr>
      </tbody>
    </table>

    <!-- Section 8 -->
    <h2>Wrap-up</h2>
    <p>
      Keep it simple and useful. If you can <strong>shape data clearly, pick the right structure quickly,
      and explain your trade-offs</strong>, you’re already ahead of the pack. The rest is practice.
    </p>
    <p>
      Next: jump into the <a [routerLink]="['/coding']">coding practice area</a> and run the drills above
      under a timer. Build the habit of shipping first, then improving.
    </p>
  </fa-guide-shell>
  `
})
export class FeDsaArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
