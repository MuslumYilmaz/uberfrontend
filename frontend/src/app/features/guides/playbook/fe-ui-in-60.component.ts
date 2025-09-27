// -----------------------------------------------------------------------------
// Build Great UI in 60 Minutes
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    styles: [`
    /* Links */
    a { color:#7CC2FF; text-decoration:none; border-bottom:1px dotted transparent; transition:color .15s, border-color .15s; }
    a:hover { color:#A9DBFF; border-color:currentColor; }
    h3 a { display:inline-flex; align-items:center; gap:6px; font-weight:700; }
    h3 a::after { content:"→"; opacity:.7; transition:transform .15s, opacity .15s; }
    h3 a:hover::after { transform:translateX(2px); opacity:1; }

    /* Readability */
    .guide-content { max-width:760px; line-height:1.65; font-size:16.5px; color:#E6EAF2; }
    .guide-content h2 { margin:1.8rem 0 .6rem; font-size:1.25rem; }
    .guide-content h3 { margin:1.2rem 0 .4rem; font-size:1.05rem; }
    .guide-content ul, .guide-content ol { margin:.2rem 0 .9rem 1.2rem; }
    .guide-content li { margin:.28rem 0; }

    /* Tables */
    .guide-content table { width:100%; border-collapse:collapse; background:#111418; border:1px solid rgba(255,255,255,.08); border-radius:8px; overflow:hidden; margin:.6rem 0 1rem; }
    .guide-content thead th { background:#151921; text-align:left; padding:.6rem .7rem; font-weight:600; border-bottom:1px solid rgba(255,255,255,.08); }
    .guide-content tbody td { padding:.55rem .7rem; border-top:1px solid rgba(255,255,255,.06); }
    .guide-content tbody tr:nth-child(odd){ background:#0E1218; }

    /* Code blocks — style ONLY <pre>, keep inner <code> transparent */
    .guide-content pre {
      background:#0C1016;
      border:1px solid rgba(255,255,255,.08);
      padding:.8rem;
      border-radius:10px;
      overflow:auto;
      margin:.6rem 0 1rem;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .guide-content pre code {
      font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size:14px;
      line-height:1.5;
      white-space:pre;            /* preserve indentation exactly */
      background:transparent;     /* prevent “line” effect */
      border:0;
      padding:0;
      text-decoration:none;       /* kill any accidental line-through */
      letter-spacing:0;           /* avoid antialiasing artifacts */
    }
  `],
    template: `
  <uf-guide-shell
    title="Build Great UI in 60 Minutes"
    subtitle="UI coding interviews: from layout to logic to polish under time pressure."
    [minutes]="20"
    [tags]="['ui','html','css','javascript','accessibility','performance']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <p>
    In a UI interview, the fastest way to impress is to <strong>ship a small thing that works</strong>
    and then level it up. Think in this order: <em>MVP → keyboard support → sensible styles → basic errors</em>.
    Keep progress visible and narrate your steps so the interviewer can follow your thinking.
    </p>

<h2>The prompt (typical)</h2>
<p>
  Most UI rounds start with a small, self-contained widget. Common asks:
</p>
<ul>
  <li><strong>Modal dialog</strong> with confirm / cancel</li>
  <li><strong>Dropdown</strong> that supports keyboard navigation</li>
  <li><strong>Autocomplete</strong> with a filtered list and selection</li>
  <li><strong>Tabs</strong> that switch content panels</li>
</ul>
<p>
  We’ll use a compact <strong>Confirm Dialog</strong> as the running example. Your goal is the same
  for any prompt: get a working MVP first, then add keyboard support, reasonable styles,
  and basic error handling.
</p>

    <h2>Markup first: the minimum skeleton</h2>
<pre><code class="language-html">&lt;button id="openBtn"&gt;Delete file…&lt;/button&gt;
&lt;div id="dialog" role="dialog" aria-modal="true" aria-labelledby="dlgTitle" hidden&gt;
  &lt;div class="overlay"&gt;&lt;/div&gt;
  &lt;div class="panel" role="document"&gt;
    &lt;h2 id="dlgTitle"&gt;Delete this file?&lt;/h2&gt;
    &lt;p id="dlgDesc"&gt;This action cannot be undone.&lt;/p&gt;
    &lt;div class="actions"&gt;
      &lt;button id="cancelBtn"&gt;Cancel&lt;/button&gt;
      &lt;button id="confirmBtn"&gt;Delete&lt;/button&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

    <h2>Styles: readable, not pixel-perfect</h2>
<pre><code class="language-css">#dialog[hidden] &#123;
  display: none;
&#125;

#dialog .overlay &#123;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
&#125;

#dialog .panel &#123;
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, 90%);
  background: #0f1218;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  padding: 16px;
&#125;

#dialog .actions &#123;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
&#125;

:focus-visible &#123;
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
&#125;

&#64;media (prefers-reduced-motion: reduce) &#123;
  * &#123; animation-duration:.01ms !important; transition-duration:.01ms !important; &#125;
&#125;</code></pre>

    <h2>State & interactions: keep it tiny</h2>
<pre><code class="language-ts">const dialog = document.getElementById('dialog') as HTMLElement;
const openBtn = document.getElementById('openBtn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
const confirmBtn = document.getElementById('confirmBtn') as HTMLButtonElement;

let lastFocus: HTMLElement | null = null;

function open() &#123;
  lastFocus = document.activeElement as HTMLElement;
  dialog.hidden = false;
  confirmBtn.focus(); // send focus into dialog
&#125;

function close() &#123;
  dialog.hidden = true;
  lastFocus?.focus(); // restore focus
&#125;

openBtn.addEventListener('click', open);
cancelBtn.addEventListener('click', close);
confirmBtn.addEventListener('click', () =&gt; &#123;
  // pretend to delete...
  close();
&#125;);

// Close on Escape
document.addEventListener('keydown', (e) =&gt; &#123;
  if (!dialog.hidden &amp;&amp; e.key === 'Escape') close();
&#125;);</code></pre>

    <h2>Accessibility checklist (fast)</h2>
    <p>
    Accessibility isn’t extra credit in UI interviews — it’s correctness.
    Here’s a quick list you can run through in under a minute:
    </p>
    <ul>
    <li>
        <strong>Semantics:</strong> Always label your dialog with
        <code>role="dialog"</code>, <code>aria-modal="true"</code>, and a clear title
        via <code>aria-labelledby</code>. This tells assistive tech what the UI is.
    </li>
    <li>
        <strong>Focus:</strong> When the dialog opens, send focus inside (usually the
        primary button). On close, restore focus to wherever the user was.  
        <em>Hint:</em> interviewers love seeing you save <code>lastFocus</code>.
    </li>
    <li>
        <strong>Keyboard:</strong> Escape should close. Tab and Shift+Tab should
        cycle through the dialog controls. If asked, add a simple focus trap.
    </li>
    <li>
        <strong>Visible focus:</strong> Don’t remove outlines. If styling, use
        <code>:focus-visible</code> so keyboard users keep a clear highlight.
    </li>
    </ul>
    <p>
    📌 Mentioning these out loud in the interview shows maturity — you think
    beyond “does it work for me” and into “does it work for everyone”.
    </p>

    <h2>Performance &amp; polish (optional)</h2>
    <p>
    Once your core UI works, polish is where you can stand out — but only if you
    have time left. Think of these as quick wins, not mandatory steps:
    </p>
    <ul>
    <li>
        <strong>Avoid layout trashing.</strong>  
        Batch DOM reads and writes instead of mixing them, and never animate
        <code>width</code> or <code>left</code> (causes reflows).  
        ✅ Animate <code>transform</code> or <code>opacity</code> instead — smoother and cheaper.
    </li>
    <li>
        <strong>Respect user settings.</strong>  
        Wrap animations in <code>&#64;media (prefers-reduced-motion: reduce)</code>.  
        This shows empathy and signals you know accessibility extends to motion too.
    </li>
    <li>
        <strong>Keep helpers tiny.</strong>  
        Only extract utility functions if duplication actually appears.
        Premature abstraction wastes precious interview minutes.
    </li>
    <li>
        <strong>Visual clarity over perfection.</strong>  
        Basic spacing, readable text, and visible focus outlines matter more than
        pixel-perfect alignment. Interviewers notice usability first.
    </li>
    </ul>
    <p>
    💡 Tip: Mentioning “I’d optimize animations with <code>transform</code>” or
    “I’d add <code>&#64;media (prefers-reduced-motion: reduce)</code>” often gets bonus points,
    even if you don’t have time to implement it fully.
    </p>


    <h2>Debug checklist (when things go weird)</h2>
    <p>
    Bugs under a timer feel 10× worse. What interviewers care about isn’t whether
    you avoid every mistake — it’s whether you can <strong>spot, explain, and fix</strong>
    issues without spiraling. Use this quick checklist:
    </p>
    <ul>
    <li>
        <strong>Log state changes:</strong> Check if <code>hidden</code> is actually flipping
        and which element currently has focus. Simple <code>console.log</code> beats guessing.
    </li>
    <li>
        <strong>Verify selectors &amp; targets:</strong> A wrong ID or missing class can sink
        you. Use <code>closest()</code> to confirm you’re grabbing the right element.
    </li>
    <li>
        <strong>Test edge paths:</strong> What happens if you press Escape before the
        dialog is open, or click outside the overlay? Show you think about odd cases.
    </li>
    <li>
        <strong>Talk it out:</strong> Narrate your steps: <em>“I expect this state to be true,
        but it’s false — so my next step is to log the click handler.”</em>  
        Even if you don’t fix it instantly, interviewers will see structured thinking.
    </li>
    </ul>
    <p>
    🔑 Rule of thumb: <em>debug out loud</em>. Silence feels like being stuck, but
    walking through your reasoning shows control — and often earns hints.
    </p>

    <h2>Practice prompts (30–45 min each)</h2>
    <table>
      <thead>
        <tr><th>Widget</th><th>Must-have</th><th>Nice-to-have</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Dropdown</td>
          <td>MVP click to open, select item, close on outside/Escape</td>
          <td>Arrow-key nav, type-ahead, focus trap</td>
        </tr>
        <tr>
          <td>Autocomplete</td>
          <td>Filter list on input, select with mouse/Enter</td>
          <td>Async results, loading state, debounce</td>
        </tr>
        <tr>
          <td>Tabs</td>
          <td>Switch on click, show active panel</td>
          <td>Roving tabindex, Home/End keys, ARIA roles</td>
        </tr>
        <tr>
          <td>Modal</td>
          <td>Open/close, restore focus, Escape to close</td>
          <td>Focus trap, inert background, animations respecting reduced-motion</td>
        </tr>
      </tbody>
    </table>

    <p>
      Drill these in the <a [routerLink]="['/coding']">coding practice area</a>:
      start with a working MVP, then add keyboard and a11y. Narrate what you’re doing.
    </p>

    <h2>Remember</h2>
    <p>
      <strong>Ship first, then improve.</strong> A small, working dialog with keyboard support
      beats a half-written “perfect” solution every time. Keep progress visible, talk through
      trade-offs, and you’ll score higher than most candidates.
    </p>
  </uf-guide-shell>
  `
})
export class FeUiIn60Article {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
