// -----------------------------------------------------------------------------
// Designing Component APIs That Scale (UI Interview Guide)
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

    /* Code blocks */
    .guide-content pre {
      background:#0C1016;
      border:1px solid rgba(255,255,255,.08);
      padding:.8rem;
      border-radius:10px;
      overflow:auto;
      margin:.6rem 0 1rem;
    }
    .guide-content pre code {
      font-family: 'Fira Code', monospace;
      font-size:14px;
      line-height:1.5;
      white-space:pre;
      background:transparent;
      border:0;
      padding:0;
      text-decoration:none;
    }
  `],
  template: `
  <fa-guide-shell
    title="Component API Design for Frontend Interviews: Props, Events, Trade-offs"
    subtitle="How to present props, events, composition, and accessibility trade-offs in UI interviews."
    [minutes]="18"
    [tags]="['ui','api-design','react','composition','interviews']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <p>
      In UI interviews, you’re often asked to build <em>reusable components</em> like a
      <strong>Dropdown</strong>, <strong>Tabs</strong>, or a <strong>Modal</strong>.  
      The real test isn’t just “can you make it work once” — it’s whether your
      <strong>API design feels scalable in a real codebase</strong>.  
      Interviewers want to see if another developer could pick up your component,
      plug it in, and extend it without rewriting everything.  
      In this guide, we’ll walk through patterns that signal <em>maturity</em> and
      <em>thoughtfulness</em> — the kind of answers that stand out in a high-pressure
      interview.
    </p>

    <h2>1. Controlled vs uncontrolled</h2>
    <p>
      Show that you know both patterns. Controlled = parent manages state. Uncontrolled = component manages state.
    </p>
<pre><code class="language-tsx">&lt;!-- Controlled input --&gt;
&lt;TextField value=&#123;value&#125; onChange=&#123;setValue&#125; /&gt;

&lt;!-- Uncontrolled input with default --&gt;
&lt;TextField defaultValue="hello" onChange=&#123;v =&gt; console.log(v)&#125; /&gt;</code></pre>

    <h2>2. Composition over configuration</h2>
    <p>
      Instead of a million props, show you’d allow composition. This always earns points.
    </p>
<pre><code class="language-tsx">&lt;!-- ❌ Too rigid --&gt;
&lt;Modal title="Delete?" showCancel showConfirm /&gt;

&lt;!-- ✅ Flexible, scales with content --&gt;
&lt;Modal&gt;
  &lt;Modal.Header&gt;Delete item&lt;/Modal.Header&gt;
  &lt;Modal.Body&gt;This cannot be undone.&lt;/Modal.Body&gt;
  &lt;Modal.Footer&gt;
    &lt;Button variant="ghost"&gt;Cancel&lt;/Button&gt;
    &lt;Button variant="danger"&gt;Delete&lt;/Button&gt;
  &lt;/Modal.Footer&gt;
&lt;/Modal&gt;</code></pre>

    <h2>3. Event naming &amp; payloads</h2>
    <p>
      Interviewers look for clarity. Don’t just return raw events — return useful detail.
    </p>
<pre><code class="language-tsx">function Select(&#123; value, onChange &#125;) &#123;
  // onChange(&#123; value, label, reason &#125;)
&#125;</code></pre>

    <h2>4. Accessibility baked in</h2>
    <ul>
      <li>Correct roles (<code>role="dialog"</code>, <code>role="tablist"</code>).</li>
      <li>Keyboard handling (Escape, Tab, Arrow keys).</li>
      <li>Focus management (send focus in, restore on close).</li>
    </ul>
<pre><code class="language-tsx">&lt;div role="dialog" aria-modal="true" aria-labelledby="dlgTitle"&gt;
  &lt;h2 id="dlgTitle"&gt;Confirm Delete&lt;/h2&gt;
&lt;/div&gt;</code></pre>

    <h2>5. Styling surface</h2>
    <p>
      Show you’d make styling flexible but not chaotic.
    </p>
<pre><code class="language-tsx">&lt;Button variant="danger" size="lg"&gt;Delete&lt;/Button&gt;</code></pre>
<pre><code class="language-css">.btn &#123;
  --btn-bg: #1f2937;
  --btn-fg: #fff;
  background: var(--btn-bg);
  color: var(--btn-fg);
&#125;</code></pre>

    <h2>6. Async state awareness</h2>
    <p>
      Front-end is async by nature. Interviews love when you call this out.
    </p>
<pre><code class="language-tsx">&lt;Button onClick=&#123;async () =&gt; &#123;
  setLoading(true);
  await api.delete();
  setLoading(false);
&#125;&#125;&gt;
  &#123;loading ? "Deleting..." : "Delete"&#125;
&lt;/Button&gt;</code></pre>

  <h2>7. Practice drill</h2>
  <p>
    Take any common widget (Tabs, Dropdown, or Modal) and practice evolving it step by step.
    The goal isn’t a production-ready library — it’s to <strong>show layered thinking</strong> under interview pressure.
  </p>
  <ol>
    <li>
      <strong>Start with MVP.</strong>  
      Build the absolute minimum: one tab switches content, one dropdown selects an item, one modal opens and closes.  
      ✅ Shows you can ship fast.
    </li>
    <li>
      <strong>Add controlled vs uncontrolled options.</strong>  
      Controlled = parent passes state + callback. Uncontrolled = component manages its own state.  
      ✅ Signals you understand real-world flexibility.
    </li>
    <li>
      <strong>Add clear events.</strong>  
      Don’t just fire raw DOM events — surface meaningful ones like  
      <code>onChange</code>, <code>onSelect</code>, or <code>onOpenChange</code>.  
      ✅ Interviewers look for APIs that would scale in a team.
    </li>
    <li>
      <strong>Layer in accessibility (a11y).</strong>  
      Add roles (<code>role="tablist"</code>, <code>role="dialog"</code>), keyboard handling (Arrow keys, Escape), and focus management.  
      ✅ Easy bonus points — most candidates forget this.
    </li>
    <li>
      <strong>Make it styleable.</strong>  
      Add a <code>variant</code> prop (e.g., <code>primary</code>, <code>danger</code>) or expose CSS variables.  
      ✅ Shows you think about design systems, not just isolated code.
    </li>
  </ol>
  <p>
    💡 Pro tip: narrate your steps out loud (“First I’ll make it work, then I’ll add a controlled mode, then keyboard support”).  
    This makes your process clear and interviewers will often guide you toward what they care about most.
  </p>

  <h2>Wrap-up</h2>
  <p>
    In a UI interview, don’t stop at “it works.” Explain <strong>how the API scales</strong>:
    what’s controlled vs uncontrolled, what events fire, and how consumers style/compose it.
    That’s what separates a quick demo from a component a team can actually ship.
  </p>
  <ul>
    <li><strong>Name the contract:</strong> “Props: <code>open</code>, <code>defaultOpen</code>, <code>onOpenChange</code>.
      Events: <code>onSelect</code>. Slots: <code>trigger</code>, <code>content</code>.”</li>
    <li><strong>Call out a11y & keyboard:</strong> roles, focus management, Escape/Arrow keys, visible focus.</li>
    <li><strong>Show the styling story:</strong> variants or CSS variables; how a design system would theme it.</li>
    <li><strong>Mention performance:</strong> lazy mount, avoid layout thrash, prefer <code>transform/opacity</code> for animations.</li>
    <li><strong>State your trade-offs:</strong> “I kept state local for simplicity; I’d expose a controlled mode for complex use.”</li>
  </ul>
  <p>
    👉 Keep narrating as you go. If you run out of time, close with:
    “MVP works; next I’d add focus trap, type-ahead, and a controlled mode with <code>onOpenChange</code>.”
  </p>
  <p>
    Want focused practice? Try the <a [routerLink]="['/coding']">coding drills</a> next,
    or skim <a [routerLink]="['/guides','system-design-blueprint']">client-side system design</a> patterns.
  </p>
  </fa-guide-shell>
  `
})
export class ComponentApiDesignArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
