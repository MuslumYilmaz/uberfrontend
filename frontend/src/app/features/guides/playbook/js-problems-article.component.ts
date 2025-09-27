// features/guides/playbook/js-problems-article.component.ts
// -----------------------------------------------------------------------------
// JavaScript Problems That Actually Show Up
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    template: `
  <uf-guide-shell
    title="JavaScript Problems That Actually Show Up"
    subtitle="Essential patterns and interview-style problems that real companies ask"
    [minutes]="14"
    [tags]="['javascript','coding','practice']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <!-- Opening -->
    <p>
    Front-end interviews aren’t about solving obscure CS puzzles like
    <em>“invert a binary tree”</em>. Instead, they test whether you can
    <strong>use JavaScript the way you actually use it at work</strong>:
    shaping data for the UI, handling async flows without breaking, and
    explaining why the browser behaves the way it does.
    </p>
    <p>
    In other words — do you know how to <em>transform arrays and objects</em>,
    <em>manage promises and timing</em>, and <em>reason about the event loop
    and rendering</em> when things get messy? That’s what interviewers care about.
    </p>
    <p>
    This section focuses only on the <strong>real patterns and problems
    that show up repeatedly in interviews</strong>, so you don’t waste time
    grinding topics you’ll never be asked.
    </p>

    <!-- Section 1 -->
    <h2>1. Array &amp; Object transformations</h2>
    <p>
    A huge chunk of front-end work is <strong>shaping data for the UI</strong>.  
    That’s why interviews often throw you prompts about arrays and objects.  
    They’re checking whether you can move from raw data → the format a component needs,  
    without getting stuck on the basics.
    </p>

    <h3>Example: <code>groupBy</code></h3>
    <p><strong>Prompt:</strong> Write a <code>groupBy</code> function that groups items by a key function.</p>

    <pre><code class="language-ts">function groupBy&lt;T&gt;(arr: T[], fn: (item: T) =&gt; string): Record&lt;string, T[]&gt; &#123;
    return arr.reduce((acc, item) =&gt; &#123;
        const key = fn(item);
        (acc[key] ||= []).push(item);
        return acc;
    &#125;, &#123;&#125; as Record&lt;string, T[]&gt;);
    &#125;

    // Quick test
    console.log(groupBy([6.1, 4.2, 6.3], Math.floor));
    // =&gt; &#123; "6": [6.1, 6.3], "4": [4.2] &#125;
    </code></pre>


    <p>
    <strong>Why this matters in interviews:</strong>  
    They want to see if you can take a fuzzy requirement (“group items by …”)  
    and quickly turn it into working code. This is the same skill you’d use when  
    formatting API results for a chart or table.
    </p>

    <ul>
    <li><strong>Edge cases:</strong> empty arrays, duplicate keys, non-string keys.</li>
    <li><strong>Clarity:</strong> narrate what <code>reduce</code> does step by step.</li>
    <li><strong>Improvement instinct:</strong> mention when you’d use <code>Map</code> instead of an object.</li>
    </ul>

    <p>
    👉 Want more reps? Check out the  
    <a [routerLink]="['/coding']">coding practice area</a> for related drills:  
    <code>chunk</code>, <code>flatten</code>, <code>unique</code>.
    </p>

    <!-- Section 2 -->
    <h2>2. Async &amp; control flow</h2>
    <p>
    Much of front-end work is about <strong>timing</strong> — responding to rapid user
    input, waiting for network calls, or controlling animations. Interviewers want to see if
    you understand <em>when</em> code runs, not just <em>what</em> runs.
    </p>

    <h3>Example: <code>debounce</code></h3>
    <p><strong>Prompt:</strong> Collapse multiple rapid calls into one after a quiet period.</p>
    <pre><code class="language-ts">function debounce&lt;T extends (...args:any[]) =&gt; void&gt;(fn: T, ms = 200) &#123;
    let id: any;
    return (...args: Parameters&lt;T&gt;) =&gt; &#123;
        clearTimeout(id);
        id = setTimeout(() =&gt; fn(...args), ms);
    &#125;;
    &#125;

    // Quick test
    const log = debounce(console.log, 300);
    log("first");
    log("second"); 
    // only "second" prints after ~300ms
    </code></pre>

    <p><strong>Edge cases to watch for:</strong></p>
    <ul>
    <li>Calls with different arguments — does the last one always win?</li>
    <li>What if the function throws? Should the timer still reset?</li>
    <li>Immediate vs delayed — sometimes you want the <em>first</em> call to fire instantly, not the last.</li>
    </ul>

    <p><strong>Variations worth practicing:</strong></p>
    <ol>
    <li><code>throttle</code> → run at most once per X ms, no matter how many calls.</li>
    <li>Retry with backoff → retry a failing API with increasing delays (e.g. 100ms, 200ms, 400ms).</li>
    <li>A mini <code>Promise.all</code> → combine multiple async tasks and return results in order.</li>
    </ol>

    <p>
    👉 You can practice these patterns in the 
    <a [routerLink]="['/coding']">coding practice area</a>. They come up frequently
    because they mirror <strong>real FE work</strong>: debouncing search inputs,
    throttling scroll listeners, retrying flaky APIs, or coordinating async flows.
    </p>

    <!-- Section 3 -->
    <h2>3. Event loop &amp; browser ordering</h2>
    <p>
    A lot of “tricky” JS questions are really just about <strong>the event loop</strong> —
    knowing why code runs in a certain order.  
    This shows whether you understand how browsers schedule work.
    </p>

    <h3>Microtasks vs macrotasks</h3>
    <pre><code class="language-ts">console.log("A");

    setTimeout(() =&gt; console.log("B"), 0);

    Promise.resolve().then(() =&gt; console.log("C"));

    console.log("D");

    // Output: A, D, C, B
    </code></pre>

    <p><strong>Why this happens:</strong></p>
    <ol>
    <li><strong>Sync code first:</strong> Logs <code>A</code>, then <code>D</code>.</li>
    <li><strong>Microtasks next:</strong> Promise callbacks (<code>C</code>) run right after sync code, before timers.</li>
    <li><strong>Macrotasks last:</strong> <code>setTimeout</code> callbacks (<code>B</code>) run on the next tick.</li>
    </ol>

    <p><strong>Things to know for interviews:</strong></p>
    <ul>
    <li><code>Promise.then</code> and <code>queueMicrotask</code> always run before <code>setTimeout</code>/<code>setInterval</code>.</li>
    <li><code>requestAnimationFrame</code> runs before the next paint (great for UI work).</li>
    <li><code>async/await</code> is just Promise sugar — the code after <code>await</code> goes into the microtask queue.</li>
    </ul>

    <p>
    👉 Practice with small snippets in the 
    <a [routerLink]="['/coding']">coding practice area</a>.  
    Change the order (e.g. mix <code>await</code>, <code>setTimeout</code>, <code>Promise</code>) 
    and predict the output before running it. This builds the instinct interviewers look for.
    </p>

    <!-- Section 4 -->
    <h2>4. DOM &amp; UI utilities</h2>
    <p>
    Frameworks (React, Angular, Vue) usually hide the DOM from you — but in interviews, 
    you’re often asked to prove you understand the raw mechanics.  
    Expect small tasks like <strong>event delegation, toggles, or DOM queries</strong>.
    </p>

    <h3>Example: Event delegation helper</h3>
    <pre><code class="language-ts">function delegate(
    parent: Element,
    selector: string,
    type: string,
    handler: (e: Event) =&gt; void
    ) {{ '{' }}
    parent.addEventListener(type, (e) =&gt; {{ '{' }}
        const target = (e.target as Element).closest(selector);
        if (target &amp;&amp; parent.contains(target)) {{ '{' }}
        handler(e);
        {{ '}' }}
    {{ '}' }});
    {{ '}' }}

    // Usage
    delegate(document.body, "button.delete", "click", (e) =&gt; {{ '{' }}
    console.log("Delete button clicked!", e.target);
    {{ '}' }});
    </code></pre>

    <p><strong>Why it matters:</strong></p>
    <ul>
    <li><strong>Performance:</strong> Instead of 100 listeners on 100 buttons, you attach one on the parent.</li>
    <li><strong>Dynamic UIs:</strong> Works even if new elements are added later.</li>
    <li><strong>Knowledge check:</strong> Proves you understand <em>event bubbling</em> and <em>containment</em>.</li>
    </ul>

    <h3>Other utilities worth drilling</h3>
    <ul>
    <li><strong>Class toggler:</strong> Add/remove CSS classes cleanly with <code>classList.toggle</code>.</li>
    <li><strong>Query shorthand:</strong> Tiny helpers for <code>document.querySelector</code> / <code>querySelectorAll</code>.</li>
    <li><strong>Focus trap:</strong> For modals — keep keyboard navigation inside until closed.</li>
    <li><strong>Lazy image loader:</strong> Use <code>IntersectionObserver</code> to swap <code>src</code> when in view.</li>
    </ul>

    <p>
    👉 These show up in <a [routerLink]="['/coding']">UI widget drills</a> — modal, dropdown, 
    autocomplete. Practicing raw DOM utilities makes you faster when the timer is ticking.
    </p>

    <!-- Section 5 -->
    <h2>5. Testing instinct (even without Jest)</h2>
    <p>
    In interviews you usually don’t have a full test suite — but you can still show
    strong testing instincts. Interviewers notice when you think about edge cases
    without being prompted. It makes you look senior and reduces the “will this break
    in prod?” worry.
    </p>

    <ol>
    <li>
        <strong>Log normal and edge cases.</strong><br />
        Don’t just test the happy path. If you wrote a <code>debounce</code>, try calling
        it 10 times in 100ms. If you wrote a <code>groupBy</code>, try duplicate keys.
    </li>
    <li>
        <strong>Try empty, null, and extreme inputs.</strong><br />
        “What happens if the array is empty?” or “What if the timeout is 0?”.
        Interviewers love hearing you ask this out loud before running it.
    </li>
    <li>
        <strong>State your expected output before running.</strong><br />
        Example: “If I pass <code>[1,2,3]</code> and group by odd/even, I expect
        <code>{{ '{' }} odd: [1,3], even: [2] {{ '}' }}</code>.”  
        Shows you’re not guessing — you’re reasoning.
    </li>
    <li>
        <strong>Use quick manual checks.</strong><br />
        A <code>console.log</code> after each step is enough. You don’t need Jest or
        Cypress here — just visible proof your function behaves as claimed.
    </li>
    <li>
        <strong>Highlight trade-offs.</strong><br />
        “This works fine for small arrays, but on 10k items I’d avoid nested loops.”
        This is bonus credit: it shows maturity.
    </li>
    </ol>

    <p>
    👉 Practicing this habit in the 
    <a [routerLink]="['/coding']">coding practice area</a> will make it automatic in real interviews.
    </p>

    <!-- Closing -->
    <h2>Wrap-up</h2>
    <p>
    None of these problems are meant to trick you — they’re a window into how you think
    and whether you can <strong>ship, verify, and explain</strong> under pressure.
    Interviewers care less about pixel-perfect code and more about whether you can
    build something that works, test it with a few edge cases, and walk them through
    your reasoning.
    </p>
    <p>
    Remember, <em>clarity beats cleverness</em>. A simple, working solution +
    thoughtful narration puts you ahead of most candidates who either freeze,
    over-engineer, or stay silent.
    </p>
    <p>
    👉 Next step: practice these patterns under a timer in the
    <a [routerLink]="['/coding']">coding practice area</a>. Try one utility (like
    <code>debounce</code>) or one widget (like a dropdown) each day. With steady
    reps, this flow will feel natural when it matters most.
    </p>
  </uf-guide-shell>
  `
})
export class JsProblemsArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
