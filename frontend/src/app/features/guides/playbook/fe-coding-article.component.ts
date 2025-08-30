import { Component, Input } from '@angular/core';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent],
    template: `
  <uf-guide-shell
    title="Front End Coding Interviews"
    subtitle="Question types to expect, handy coding tips and the best resources to use"
    [minutes]="21"
    [tags]="['coding','tips','practice']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <p>
      Coding rounds for front end roles are practical and time-boxed. Expect small utilities,
      DOM tasks, data munging, and lightweight component work. You win by shipping a clear MVP,
      narrating as you go, and validating with tiny tests.
    </p>

    <h2>What you’ll likely see</h2>
    <ul>
      <li>Array/string utilities (grouping, de-dupe, chunk, frequency maps).</li>
      <li>Parsing/formatting (CSV/JSON, querystrings, dates).</li>
      <li>DOM utilities (delegate events, throttle scroll handler, class toggles).</li>
      <li>Mini component requirements (autocomplete, tabs, modal, counter with limits).</li>
      <li>Debug/bug-fix from a broken snippet or failing tests.</li>
    </ul>

    <h2>Execution checklist (use aloud)</h2>
    <ul>
      <li><strong>ICE</strong>: Input → Constraints → Examples before code.</li>
      <li>Start a <em>tiny harness</em>; run after every small step.</li>
      <li>Edge cases explicit: empty, huge, unicode, order stability, duplicate keys.</li>
      <li>Finish an MVP first; refactor only if time remains.</li>
    </ul>

    <h2>Practice ladder (sample plan)</h2>
    <div>
      <table>
        <thead>
          <tr><th>Tier</th><th>Focus</th><th>Reps</th><th>Goal</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Arrays &amp; strings</td><td>3/day</td><td>No syntax stalls</td></tr>
          <tr><td>2</td><td>Maps/Sets &amp; grouping</td><td>2/day</td><td>Linear thinking</td></tr>
          <tr><td>3</td><td>DOM utilities</td><td>1/day</td><td>Confident events</td></tr>
          <tr><td>4</td><td>Small components</td><td>3/week</td><td>Accessible patterns</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Utility patterns you can reuse</h2>
    <pre><code class="language-ts">export function groupBy&lt;T, K extends string|number&gt;(
  arr: T[], key: (t: T) =&gt; K
): Record&lt;K, T[]&gt; &#123;
  return arr.reduce((acc, item) =&gt; &#123;
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  &#125;, &#123;&#125; as Record&lt;K, T[]&gt;);
&#125;

export function unique&lt;T&gt;(arr: T[]): T[] &#123;
  return Array.from(new Set(arr));
&#125;

export function throttle&lt;T extends (...a:any[]) =&gt; void&gt;(fn: T, ms=200): T &#123;
  let t = 0, queued: any[]|null = null;
  return ((...args:any[]) =&gt; &#123;
    const now = Date.now();
    if (now - t &gt;= ms) &#123; t = now; fn(...args); &#125;
    else queued = args;
    setTimeout(() =&gt; &#123;
      if (queued && Date.now() - t &gt;= ms) &#123; t = Date.now(); fn(...queued); queued = null; &#125;
    &#125;, ms);
  &#125;) as T;
&#125;</code></pre>

    <h2>Debugging round flow</h2>
    <ol>
      <li>Run the code first; read the error; restate the hypothesis.</li>
      <li>Add a <code>console.log</code> or small check near the failing line.</li>
      <li>Change <em>one thing</em>, re-run, and describe the observation.</li>
      <li>When fixed, explain the root cause and how you’d prevent it (tests, types, guards).</li>
    </ol>

    <h2>Tiny test harness you can type fast</h2>
    <pre><code class="language-ts">function test(name: string, fn: () =&gt; void) &#123;
  try &#123; fn(); console.log('✓', name); &#125;
  catch (e) &#123; console.error('✗', name, e); &#125;
&#125;

test('groupBy works', () =&gt; &#123;
  const out = groupBy(['a','aa','b'], s =&gt; s[0]);
  if (out['a'].length !== 2 || out['b'].length !== 1) throw new Error('bad');
&#125;);</code></pre>

    <h2>What interviewers score</h2>
    <ul>
      <li>Correctness with representative tests.</li>
      <li>Readable structure and naming; no dead code.</li>
      <li>Complexity awareness: call out O(n) vs O(n log n) when relevant.</li>
      <li>Communication: hypotheses, trade-offs, and next steps.</li>
    </ul>
  </uf-guide-shell>
  `
})
export class FeCodingArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
