// -----------------------------------------------------------------------------
// Fundamentals Check: Browser, CSS, JS, HTTP
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    styles: `
          a {
      color: #4ea1ff;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s, text-decoration 0.2s;
    }
    a:hover {
      color: #82c7ff;
      text-decoration: underline;
    }

    /* Title links (inside h3) */
    h3 a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 1.05rem;
    }
    h3 a::after {
      content: "→";
      font-size: 0.9rem;
      opacity: 0.7;
      transition: transform 0.2s, opacity 0.2s;
    }
    h3 a:hover::after {
      transform: translateX(3px);
      opacity: 1;
    }`,
    template: `
  <fa-guide-shell
    title="Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP"
    subtitle="Fast interview check for browser/CSS/JavaScript/HTTP topics with clear answer framing."
    [minutes]="15"
    [tags]="['javascript','css','browser','http','fundamentals']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined"
  >
    <p>
    In most interviews, you’ll get a few <strong>fundamentals questions</strong>.
    They aren’t trick puzzles — they’re checks to see if you truly understand
    the everyday tools you use: the browser, CSS, JavaScript, and HTTP.
    </p>
    <p>
    The questions are usually <em>short and simple</em>, but tripping on them
    creates a bad impression. Example:
    </p>
    <ul>
    <li>“What’s the difference between <code>relative</code> and <code>absolute</code> positioning in CSS?”</li>
    <li>“What happens in the browser when you type a URL and hit Enter?”</li>
    <li>“How does <code>this</code> behave in a normal function vs an arrow function?”</li>
    </ul>
    <p>
    The good news: the set of topics is <strong>small and predictable</strong>.
    If you can explain them in plain English — not just memorize definitions —
    you’ll breeze through. Below we cover the must-know areas with quick examples.
    </p>

    <h2>1. Browser</h2>
    <p>
    Almost every frontend interview will touch on how the browser actually works.  
    You don’t need to recite specs — you just need a clear mental model.
    </p>
    <ul>
    <li>
        <strong>Rendering pipeline:</strong> The browser takes your HTML and CSS and
        turns it into pixels. The flow is:  
        <em>DOM → CSSOM → Render Tree → Layout → Paint → Composite</em>.  
        If you know this, you can explain <em>why changing <code>transform</code> is cheap</em>
        but changing <code>width</code> can trigger expensive reflows.
    </li>
    <li>
        <strong>Event loop:</strong> JavaScript runs on a single thread, so timing matters.  
        <em>Microtasks</em> (Promises, <code>queueMicrotask</code>) always run
        <em>before</em> <em>Macrotasks</em> (setTimeout, setInterval).  
        Example question: “Why does a <code>Promise.then</code> run before <code>setTimeout</code>?”
    </li>
    <li>
        <strong>Storage:</strong> Know the trade-offs:  
        <ul>
        <li><code>localStorage</code> → simple key/value, survives refresh.</li>
        <li><code>sessionStorage</code> → same but cleared on tab close.</li>
        <li><code>cookies</code> → small, sent with every HTTP request (careful with size/security).</li>
        <li><code>IndexedDB</code> → structured storage for larger offline data.</li>
        </ul>
        A quick “when to use which” is often enough to score points.
    </li>
    </ul>

    <h2>2. CSS</h2>
    <p>
    CSS questions are usually fast-fire. They’re testing if you can explain layout bugs,
    why something overrides something else, or when to pick the right tool.
    </p>
    <ul>
    <li>
        <strong>Box model:</strong> Every element is <em>content + padding + border + margin</em>.  
        By default, <code>width</code> only includes content.  
        <code>box-sizing: border-box</code> makes width include padding + border —
        which is why modern resets always set it.  
        👉 Interviewer trick: “Why is my div wider than expected?” → Box model.
    </li>
    <li>
        <strong>Specificity:</strong> The rule order is:  
        <em>Inline &gt; ID &gt; class/attr/pseudo-class &gt; element</em>.  
        Conflicts? Inline wins unless you use <code>!important</code>.  
        👉 Quick mnemonic: “IDs beat classes, classes beat tags.”
    </li>
    <li>
        <strong>Flex vs Grid:</strong>  
        <em>Flex = 1D (row OR column)</em>, best for navbars, buttons, toolbars.  
        <em>Grid = 2D (rows AND columns)</em>, best for layouts, dashboards.  
        👉 If the question says “align in one direction” → Flex.  
        If it says “place items on both axes” → Grid.
    </li>
    </ul>

    <h2>3. JavaScript</h2>
    <p>
    JS fundamentals show up in almost every interview. They’re testing if you
    actually <em>use</em> the language at work, not if you can quote the spec.
    </p>
    <ul>
    <li>
        <strong>Closures:</strong> Functions remember the scope they were created in.  
        Lets you keep private state without classes.
        <pre><code class="language-js">function counter() {{ '{' }}
        let n = 0;
        return () => ++n;
        {{ '}' }}
        const c = counter();
        c(); // 1
        c(); // 2</code></pre>

        👉 Interviewers might ask: “How would you implement once(), debounce, or memoize?”
    </li>

    <li>
        <strong><code>this</code> keyword:</strong> It’s not about where the function lives,
        but <em>how it’s called</em>.  
        <ul>
        <li><code>obj.method()</code> → <code>this</code> is <code>obj</code>.</li>
        <li><code>fn()</code> → <code>this</code> is <code>undefined</code> in strict mode (or global in sloppy mode).</li>
        <li><code>fn.call(obj)</code> → forces <code>this = obj</code>.</li>
        <li>Arrow functions don’t bind <code>this</code> — they inherit from the parent scope.</li>
        </ul>
        👉 Quick test: “Why does <code>setTimeout(this.fn, 0)</code> lose context?” → Because <code>this</code> depends on call site.
    </li>

    <li>
        <strong>Promises vs async/await:</strong> Both handle async work.  
        <ul>
        <li><code>promise.then()</code> = chaining style.</li>
        <li><code>async/await</code> = looks synchronous, easier to read.</li>
        <li>Error handling → <code>.catch()</code> vs <code>try/catch</code>.</li>
        </ul>
        👉 Be ready for “what’s the difference between microtasks and macrotasks” since promises run as microtasks.
    </li>
    </ul>

    <h2>4. HTTP</h2>
    <p>
    Almost every front-end interview will slip in HTTP basics — because if you don’t
    understand the network, you can’t ship reliable UIs. These are the must-knows:
    </p>
    <ul>
    <li>
        <strong>GET vs POST:</strong>  
        GET is for fetching data and should be <em>idempotent</em> (same call, same result).  
        POST is for creating or updating — it can change server state and is not idempotent.  
        👉 If you ever say “I’d use GET to update,” it’s an instant red flag.
    </li>
    <li>
        <strong>Status codes:</strong>  
        Memorize the common ones:  
        <code>200</code> (OK), <code>301</code> (redirect), <code>400</code> (bad request),  
        <code>401</code> (unauthenticated), <code>403</code> (forbidden),  
        <code>404</code> (not found), <code>500</code> (server error).  
        In interviews, you might be asked: “What do you do if an API returns 401?”
    </li>
    <li>
        <strong>Caching:</strong>  
        Browsers decide reuse vs refetch based on headers like  
        <code>Cache-Control</code>, <code>ETag</code>, and <code>Last-Modified</code>.  
        Example: <code>Cache-Control: max-age=3600</code> means “reuse for an hour.”  
        Knowing this shows you can reason about performance and user experience.
    </li>
    </ul>
    <p>
    📌 Keep answers crisp: 1–2 sentences per concept, with a quick example.
    That’s all interviewers expect — clarity over depth.
    </p>


    <h2>How to prep</h2>
    <p>
    👉 Don’t waste time trying to memorize every detail from MDN.  
    Instead, create a <strong>1-page cheatsheet</strong> with the essentials —
    things you can explain in <em>30 seconds or less</em>.
    </p>
    <ul>
    <li>Browser: event loop, rendering pipeline, storage options.</li>
    <li>CSS: box model, specificity, flex vs grid.</li>
    <li>JS: closures, <code>this</code>, promises vs async/await.</li>
    <li>HTTP: GET vs POST, key status codes, caching headers.</li>
    </ul>
    <p>
    Then drill these in the 
    <a [routerLink]="['/coding']">quiz practice area</a>.  
    Short daily reps (5–10 minutes) beat cramming the night before.
    </p>
  </fa-guide-shell>
  `
})
export class FundamentalsCheckArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
