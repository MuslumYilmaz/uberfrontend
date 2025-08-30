import { Component, Input } from '@angular/core';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [GuideShellComponent],
  template: `
  <uf-guide-shell
    title="Front End Interviews: An Introduction"
    subtitle="Everything you need to know — from types of questions to preparation tactics"
    [minutes]="18"
    [tags]="['overview','strategy','checklists']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <p>
      Front End Interviews can feel chaotic because companies mix formats and expectations.
      This page gives you a practical map: what rounds exist, what interviewers actually look for,
      and a light study plan with checklists you can follow.
    </p>

    <h2>What interviewers evaluate</h2>
    <ul>
      <li><strong>Problem framing</strong>: restate the ask, surface constraints, and confirm scope.</li>
      <li><strong>Execution under time</strong>: ship something that works before polishing.</li>
      <li><strong>Code quality</strong>: readable, incremental commits; good names; no magic.</li>
      <li><strong>Product &amp; UX sense</strong>: sensible defaults, accessible by default, resilient.</li>
      <li><strong>Collaboration</strong>: narrate thinking, invite hints, ask clarifying questions.</li>
    </ul>

    <h2>Prepare by question formats</h2>

    <h3>Coding questions</h3>
    <p>
      Expect debugging, small utilities (e.g. <code>debounce</code>, <code>memoize</code>),
      DOM utilities, and component tasks. Prefer clarity over cleverness.
    </p>
    <ul>
      <li>Start with examples and a tiny test harness.</li>
      <li>Code in <em>small, verifiable steps</em>; log/print between steps.</li>
      <li>Make edge cases explicit (empty input, large input, weird characters).</li>
    </ul>

    <h3>System design questions</h3>
    <p>
      Discuss state shape, rendering model (CSR/SSR/ISR), data fetching, errors, loading states,
      performance budgets, and accessibility. Draw boxes, then get specific.
    </p>
    <ul>
      <li>Clarify the <em>MVP</em> first, then scale.</li>
      <li>Talk about caching layers (memory, SW, CDN) and invalidation signals.</li>
      <li>Call out progressive enhancement and latency budgets (TTI/LCP).</li>
    </ul>

    <h3>Quiz / knowledge checks</h3>
    <ul>
      <li>Practice the event loop, layout/paint, HTTP caching, CORS, security (XSS/CSRF), ARIA.</li>
      <li>Use a personal cheatsheet; practice retrieval, not just recognition.</li>
    </ul>

    <h2>Round-type matrix (example)</h2>
    <div>
      <table>
        <thead>
          <tr><th>Company</th><th>Phone</th><th>Onsite</th><th>UI/Practical</th></tr>
        </thead>
        <tbody>
          <tr><td>Alpha</td><td>45m Coding</td><td>2 × 60m</td><td>Yes</td></tr>
          <tr><td>Beta</td><td>60m Debug</td><td>1 × 90m</td><td>Sometimes</td></tr>
          <tr><td>Gamma</td><td>45m Quiz</td><td>2 × 60m</td><td>No</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Execution patterns that score well</h2>
    <ul>
      <li><strong>ICE</strong>: Input ➝ Constraints ➝ Examples before any code.</li>
      <li><strong>RAC</strong>: Result ➝ Approach ➝ Complexity after you finish.</li>
      <li><strong>Think-aloud</strong>: narrate hypotheses, dead ends, and trade-offs.</li>
    </ul>

    <h2>Example: tiny utility</h2>
    <p>Readable solution with tests for a simple chunker:</p>
    <pre><code class="language-ts">export function chunk(arr: any[], size: number): any[][] &#123;
  if (size &lt;= 0) return [];
  const out: any[][] = [];
  for (let i = 0; i &lt; arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
&#125;</code></pre>

    <h2>Example: UI component sketch</h2>
    <p>A very small, testable component skeleton you could narrate:</p>
    <pre><code class="language-ts">type Listener = (value: string) =&gt; void;
export class TextInputController &#123;
  private value = '';
  private listeners: Listener[] = [];
  set(v: string) &#123; if (v !== this.value) &#123; this.value = v; this.emit(); &#125; &#125;
  get() &#123; return this.value; &#125;
  onChange(fn: Listener) &#123; this.listeners.push(fn); return () =&gt; this.off(fn); &#125;
  private off(fn: Listener) &#123; this.listeners = this.listeners.filter(l =&gt; l !== fn); &#125;
  private emit() &#123; for (const l of this.listeners) l(this.value); &#125;
&#125;</code></pre>

    <h2>Accessibility checklist (quick)</h2>
    <ul>
      <li>Keyboard reachable (Tab, Shift+Tab, Enter/Space semantics).</li>
      <li>Focus outline visible; focus not stolen on open.</li>
      <li>Labels for inputs; ARIA only when semantics are missing.</li>
      <li>Color contrast &ge; 4.5:1 for body text.</li>
    </ul>

    <h2>Micro-snippets to rehearse</h2>
    <pre><code class="language-ts">// 1) debounce
export function debounce&lt;T extends (...args:any[]) =&gt; void&gt;(fn: T, ms = 200) &#123;
  let id: any;
  return (...args: Parameters&lt;T&gt;) =&gt; &#123;
    clearTimeout(id);
    id = setTimeout(() =&gt; fn(...args), ms);
  &#125;;
&#125;

// 2) once
export function once&lt;T extends (...args:any[]) =&gt; any&gt;(fn: T): T &#123;
  let called = false, result: any;
  return ((...args:any[]) =&gt; &#123;
    if (!called) &#123; called = true; result = fn(...args); &#125;
    return result;
  &#125;) as T;
&#125;</code></pre>

    <h2>CSS: focus styles &amp; motion safety</h2>
    <pre><code class="language-css">.btn &#123;
  display:inline-flex; align-items:center; gap:.5rem; padding:.5rem .8rem; border-radius:10px;
&#125;
.btn:focus-visible &#123; outline:2px solid var(--ring, #60a5fa); outline-offset:2px; &#125;
&#64;media (prefers-reduced-motion: reduce) &#123; * &#123; animation-duration: .01ms; transition-duration: .01ms; &#125; &#125;</code></pre>

    <h2>HTML: accessible icon button</h2>
    <pre><code class="language-html">&lt;button type="button" aria-label="Open menu"&gt;
  &lt;svg aria-hidden="true" width="16" height="16"&gt;...&lt;/svg&gt;
&lt;/button&gt;</code></pre>

    <h2>Four-week light study plan</h2>
    <div>
      <table>
        <thead>
          <tr><th>Week</th><th>Focus</th><th>Daily reps</th><th>Outcome</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>JS &amp; browser fundamentals</td><td>3 quiz cards + 1 small utility</td><td>Faster recall, fewer blanks</td></tr>
          <tr><td>2</td><td>UI components</td><td>1 component/day + keyboard support</td><td>Confident patterns</td></tr>
          <tr><td>3</td><td>System design</td><td>1 prompt &rarr; diagram &rarr; notes</td><td>Clear structure under pressure</td></tr>
          <tr><td>4</td><td>Mocks &amp; review</td><td>2× 45m mocks + error logs</td><td>Interview-speed decision making</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Common pitfalls</h2>
    <ul>
      <li>Silent debugging (no narration) — interviewers can’t help or credit your reasoning.</li>
      <li>Gold-plating before MVP — ship first, then improve.</li>
      <li>Skipping accessibility — it’s part of correctness, not a bonus.</li>
    </ul>

    <h2>Wrap-up script</h2>
    <p>End every round with a short summary (30–45s):</p>
    <ul>
      <li><strong>Result</strong>: what works now and the tests/examples covered.</li>
      <li><strong>Approach</strong>: key decisions and trade-offs.</li>
      <li><strong>Next</strong>: what you’d improve with more time (perf, a11y, tests, edge cases).</li>
    </ul>
  </uf-guide-shell>
  `
})
export class FeIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;               
}
