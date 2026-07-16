// -----------------------------------------------------------------------------
// Frontend Interview Fundamentals Diagnostic
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';
import { PUBLIC_EDITORIAL_FACTS } from '../../../core/content/public-editorial-facts';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    styleUrls: ['./fundamentals-check-article.component.scss'],
    template: `
  <fa-guide-shell
    title="Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP"
    subtitle="Run a 15-minute frontend interview fundamentals quiz across browser rendering, CSS layout, JavaScript async, and HTTP basics."
    [minutes]="15"
    [tags]="['javascript','css','browser','http','fundamentals']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="fundamentals-guide-freshness">
      Last updated: June 2026 | Author: {{ editorialAuthor }}
    </div>

    <p>
      This frontend interview fundamentals quiz is a 15-minute diagnostic: answer
      12 questions, give yourself one point for each clear 30-60 second explanation,
      then use the 0-5, 6-9, or 10-12 score band to pick the weakest topic to practice
      next. It checks browser rendering, CSS layout, JavaScript async behavior, and HTTP caching.
    </p>
    <p>
      Use this self-check before a phone screen, before a technical interview, or after a
      missed fundamentals question. It is not a trivia dump; the goal is concise explanation,
      honest scoring, and direct routing into the right FrontendAtlas drills.
    </p>

    <h2 id="quick-answer-15-minute-quiz-flow">Quick answer: 15-minute quiz flow</h2>
    <ul class="quick-flow" data-testid="fundamentals-quick-flow">
      <li><strong>Answer 12 questions:</strong> cover browser, CSS, JavaScript, and HTTP basics.</li>
      <li><strong>Score one point each:</strong> count only clear answers with one UI consequence.</li>
      <li><strong>Read the score band:</strong> 0-5 means fundamentals gaps, 6-9 means interview-risky, 10-12 means ready to move on.</li>
      <li><strong>Practice the weakest topic:</strong> use the linked drills instead of reviewing everything at once.</li>
    </ul>

    <div class="proof-band" data-testid="fundamentals-guide-proof">
      <div class="proof-grid" aria-label="Frontend fundamentals diagnostic proof">
        <div class="proof-stat">
          <strong>15 min</strong>
          <span>frontend fundamentals diagnostic</span>
        </div>
        <div class="proof-stat">
          <strong>4</strong>
          <span>topic areas</span>
        </div>
        <div class="proof-stat">
          <strong>12</strong>
          <span>practice prompts</span>
        </div>
        <div class="proof-stat">
          <strong>3</strong>
          <span>score bands</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="Frontend fundamentals diagnostic actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/javascript','trivia','js-event-loop']">
          Start with event loop
        </a>
        <a class="proof-cta" [routerLink]="['/css','trivia','css-box-model']">
          Practice CSS basics
        </a>
        <a class="proof-cta" [routerLink]="['/coding']">
          Open quiz practice area
        </a>
      </div>
    </div>

    <h2 id="practice-note-from-frontendatlas-drills">Practice note from FrontendAtlas drills</h2>
    <p>
      In FrontendAtlas timed fundamentals drills, weak answers usually stop at a
      definition. Stronger answers add the visible UI consequence, the debugging step
      they would try first, and the trade-off that changes in production.
    </p>

    <h2 id="how-this-quiz-was-reviewed">How this quiz was reviewed</h2>
    <p>
      This diagnostic was reviewed against FrontendAtlas trivia and coding drills,
      the interview blueprint scoring rubric, and official web platform references.
      Use it as an interview scoring checklist, not as a replacement for the underlying
      browser, CSS, JavaScript, accessibility, performance, or HTTP documentation.
    </p>

    <h2 id="references-used-for-this-diagnostic">References used for this diagnostic</h2>
    <div class="reference-grid" data-testid="fundamentals-official-references">
      <a href="https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path" target="_blank" rel="noopener">
        MDN Critical rendering path
      </a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model" target="_blank" rel="noopener">
        MDN JavaScript execution model
      </a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction" target="_blank" rel="noopener">
        MDN CSS cascade
      </a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching" target="_blank" rel="noopener">
        MDN HTTP caching
      </a>
      <a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noopener">
        WAI-ARIA Authoring Practices Guide
      </a>
      <a href="https://web.dev/learn/performance" target="_blank" rel="noopener">
        web.dev Learn Performance
      </a>
    </div>

    <h2 id="what-frontend-fundamentals-interviews-test">What frontend fundamentals interviews test</h2>
    <p>
      Fundamentals rounds check whether you can reason from browser behavior to user-visible
      UI outcomes. A strong answer names the concept, explains the consequence, and gives
      one practical example from real frontend work.
    </p>
    <div class="topic-grid" data-testid="fundamentals-topic-map">
      <div class="topic-card">
        <h3>Browser model</h3>
        <p>Rendering pipeline, event loop scheduling, storage trade-offs, and DOM parsing.</p>
      </div>
      <div class="topic-card">
        <h3>CSS model</h3>
        <p>Box model, cascade, specificity, positioning, Flexbox, Grid, and responsive layout.</p>
      </div>
      <div class="topic-card">
        <h3>JavaScript model</h3>
        <p>Closures, this binding, promises, async/await, microtasks, and data transforms.</p>
      </div>
      <div class="topic-card">
        <h3>Network model</h3>
        <p>HTTP methods, status codes, cache headers, API failure handling, and freshness.</p>
      </div>
    </div>

    <h2 id="15-minute-frontend-fundamentals-diagnostic">15-minute frontend fundamentals diagnostic</h2>
    <p>
      Answer the 12 self-check questions below. Give yourself one point only when you can
      explain the answer clearly and connect it to a frontend bug, performance issue, or
      product behavior. This 15-minute diagnostic is intentionally compact.
    </p>
    <p>
      Use this readiness check before moving into coding or framework-specific prep.
    </p>

    <h2 id="browser-rendering-interview-questions">Browser rendering interview questions</h2>
    <div class="question-grid" data-testid="fundamentals-diagnostic-questions">
      <div class="question-card">
        <div class="question-meta"><span>Browser</span><span>Rendering</span></div>
        <h3>1. What happens when the browser parses HTML and CSS?</h3>
        <p>Strong answer: DOM, CSSOM, render tree, layout, paint, composite, and why layout changes cost more than transforms.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>Browser</span><span>Event loop</span></div>
        <h3>2. Why do promise callbacks run before timers?</h3>
        <p>Strong answer: sync code runs first, microtasks drain before the next macrotask, then rendering may happen.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>Browser</span><span>Storage</span></div>
        <h3>3. When would you use cookies, localStorage, sessionStorage, or IndexedDB?</h3>
        <p>Strong answer: cookies for HTTP-bound auth hints, Web Storage for small client state, IndexedDB for larger structured data.</p>
      </div>
    </div>

    <h2 id="css-layout-interview-questions">CSS layout interview questions</h2>
    <div class="question-grid">
      <div class="question-card">
        <div class="question-meta"><span>CSS</span><span>Box model</span></div>
        <h3>4. Why is an element wider than expected?</h3>
        <p>Strong answer: content-box adds padding and border to width; border-box changes the sizing model.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>CSS</span><span>Cascade</span></div>
        <h3>5. How do specificity and cascade order decide the winning rule?</h3>
        <p>Strong answer: importance and origin first, then specificity, then source order for otherwise equal selectors.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>CSS</span><span>Layout</span></div>
        <h3>6. When should you choose Flexbox versus Grid?</h3>
        <p>Strong answer: Flexbox for one-dimensional alignment; Grid for two-dimensional tracks and page regions.</p>
      </div>
    </div>

    <h2 id="javascript-async-interview-quiz">JavaScript async interview quiz</h2>
    <div class="question-grid">
      <div class="question-card">
        <div class="question-meta"><span>JavaScript</span><span>Closures</span></div>
        <h3>7. What is a closure and where does it show up in UI code?</h3>
        <p>Strong answer: a function retains lexical scope; common examples include callbacks, memoization, debounce, and stale state bugs.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>JavaScript</span><span>this</span></div>
        <h3>8. Why does this change when a method is passed as a callback?</h3>
        <p>Strong answer: normal function this depends on call site; arrow functions inherit lexical this.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>JavaScript</span><span>Async</span></div>
        <h3>9. What changes when you rewrite promises with async/await?</h3>
        <p>Strong answer: async/await changes readability, not the underlying promise scheduling or failure semantics.</p>
      </div>
    </div>

    <h2 id="http-caching-frontend-interview-questions">HTTP caching frontend interview questions</h2>
    <div class="question-grid">
      <div class="question-card">
        <div class="question-meta"><span>HTTP</span><span>Methods</span></div>
        <h3>10. Why should GET not update server state?</h3>
        <p>Strong answer: GET should be safe and idempotent enough for caches, crawlers, retries, and browser behavior.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>HTTP</span><span>Status codes</span></div>
        <h3>11. What should the UI do for 401, 403, 404, and 500 responses?</h3>
        <p>Strong answer: separate auth, permission, missing resource, and server failure states instead of one generic error.</p>
      </div>
      <div class="question-card">
        <div class="question-meta"><span>HTTP</span><span>Caching</span></div>
        <h3>12. How do Cache-Control and ETag affect frontend freshness?</h3>
        <p>Strong answer: max-age controls reuse, validators support revalidation, and stale data needs a visible UI policy.</p>
      </div>
    </div>

    <h2 id="advanced-frontend-fundamentals-add-on">Advanced frontend fundamentals add-on</h2>
    <p>
      Use this optional 5-minute stretch after the 12-question diagnostic if your target
      role asks broader product fundamentals. Do not add these four prompts to the core
      score; use them to check accessibility, responsive layout, performance triage, and
      framework reasoning.
    </p>
    <div class="addon-grid" data-testid="fundamentals-advanced-add-on">
      <div class="addon-card">
        <div class="question-meta"><span>Accessibility</span><span>Semantic HTML</span></div>
        <h3>How do semantic HTML and accessibility change a component interview answer?</h3>
        <p>Strong answer: choose semantic controls first, keep labels and keyboard paths intact, manage focus, and use ARIA only when native HTML is not enough.</p>
      </div>
      <div class="addon-card">
        <div class="question-meta"><span>CSS</span><span>Responsive</span></div>
        <h3>How would you debug a responsive layout that breaks on mobile?</h3>
        <p>Strong answer: inspect viewport constraints, box model, flex or grid behavior, intrinsic content size, and media or container query boundaries.</p>
      </div>
      <div class="addon-card">
        <div class="question-meta"><span>Performance</span><span>Triage</span></div>
        <h3>What frontend performance issue would you check first in a slow UI?</h3>
        <p>Strong answer: measure before optimizing, then separate network waterfalls, JavaScript main-thread work, layout or paint cost, and asset weight.</p>
      </div>
      <div class="addon-card">
        <div class="question-meta"><span>Frameworks</span><span>Fundamentals</span></div>
        <h3>What framework fundamentals should you explain without guessing?</h3>
        <p>Strong answer: describe component state, props or inputs, render timing, effects, event handling, forms, and data fetching without pretending every framework works the same way.</p>
      </div>
    </div>

    <h2 id="score-bands">Score bands</h2>
    <p>
      Treat these frontend interview score bands as a routing guide, not a final grade:
      each band tells you where to practice next.
    </p>
    <div class="score-grid" data-testid="fundamentals-score-bands">
      <div class="score-card">
        <h3>0-5: fundamentals gaps</h3>
        <p>Slow down. Pick one topic area and run the linked drills before doing broader interview practice.</p>
      </div>
      <div class="score-card">
        <h3>6-9: usable but interview-risky</h3>
        <p>You know the terms, but misses may appear under pressure. Practice answer structure and edge cases.</p>
      </div>
      <div class="score-card">
        <h3>10-12: interview-ready fundamentals</h3>
        <p>Move into timed coding, UI prompts, and system design while keeping short fundamentals reps warm.</p>
      </div>
    </div>

    <h2 id="answer-rubric">Answer rubric</h2>
    <ul class="table-summary">
      <li>Define the concept in plain English before using jargon.</li>
      <li>Attach one browser, CSS, JavaScript, or HTTP example to the answer.</li>
      <li>Name the failure mode or production trade-off that makes the concept matter.</li>
    </ul>
    <div class="table-scroll">
      <table data-testid="fundamentals-answer-rubric">
        <thead>
          <tr>
            <th>Signal</th>
            <th>Weak</th>
            <th>Solid</th>
            <th>Interview-ready</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Definition</td>
            <td>Repeats a memorized phrase.</td>
            <td>Explains the concept in plain English.</td>
            <td>Explains the concept and names when it matters in UI work.</td>
          </tr>
          <tr>
            <td>Example</td>
            <td>No concrete example.</td>
            <td>Gives one browser, CSS, JS, or HTTP example.</td>
            <td>Connects the example to performance, accessibility, state, or reliability.</td>
          </tr>
          <tr>
            <td>Trade-off</td>
            <td>Uses buzzwords without conditions.</td>
            <td>Names a reasonable trade-off.</td>
            <td>States the trade-off, failure mode, and what would change in production.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="spoken-answer-examples">Spoken answer examples</h2>
    <p>
      These examples show the difference between naming a term and giving the concise
      spoken explanation an interviewer can score.
    </p>
    <div class="spoken-grid" data-testid="fundamentals-spoken-answer-examples">
      <div class="spoken-card">
        <h3>Browser rendering</h3>
        <p><strong>Prompt:</strong> What happens when the browser parses HTML and CSS?</p>
        <p><strong>Weak spoken answer:</strong> The browser makes the DOM and renders the page.</p>
        <p><strong>Interview-ready spoken answer:</strong> The browser builds the DOM from HTML and the CSSOM from CSS, combines them into a render tree, computes layout, paints pixels, and composites layers. I would call out layout-heavy changes because they can block smooth UI updates more than transform-only changes.</p>
        <p><strong>Why it scores:</strong> It names the pipeline and connects it to a visible performance trade-off.</p>
      </div>
      <div class="spoken-card">
        <h3>CSS responsive layout</h3>
        <p><strong>Prompt:</strong> How would you debug a layout that breaks on mobile?</p>
        <p><strong>Weak spoken answer:</strong> I would add a media query and make the element smaller.</p>
        <p><strong>Interview-ready spoken answer:</strong> I would inspect the computed box first, then check whether the issue is fixed width, overflowing content, flex or grid constraints, or a breakpoint that does not match the actual container. Then I would prefer a fluid rule before adding another breakpoint.</p>
        <p><strong>Why it scores:</strong> It gives a debugging sequence instead of a CSS guess.</p>
      </div>
      <div class="spoken-card">
        <h3>JavaScript async</h3>
        <p><strong>Prompt:</strong> Why do promise callbacks run before timers?</p>
        <p><strong>Weak spoken answer:</strong> Promises are faster than timers.</p>
        <p><strong>Interview-ready spoken answer:</strong> Synchronous code runs first, then the browser drains the microtask queue, where promise callbacks live, before it picks up the next macrotask like a timer. That ordering matters when a UI update depends on async state.</p>
        <p><strong>Why it scores:</strong> It uses correct queue language and explains the frontend consequence.</p>
      </div>
      <div class="spoken-card">
        <h3>Accessibility and performance</h3>
        <p><strong>Prompt:</strong> How do you keep a custom interactive component usable and fast?</p>
        <p><strong>Weak spoken answer:</strong> I would use ARIA and optimize the code.</p>
        <p><strong>Interview-ready spoken answer:</strong> I would start with semantic HTML, preserve keyboard and focus behavior, add ARIA only for missing semantics, and measure slow interactions before changing code. For performance, I would separate network, JavaScript, rendering, and asset causes instead of optimizing randomly.</p>
        <p><strong>Why it scores:</strong> It combines user access and performance triage without buzzwords.</p>
      </div>
    </div>

    <h2 id="practice-map">Practice map</h2>
    <p>
      Use the lowest-scoring topic from the diagnostic to choose the next practice prompt.
      Do not practice everything at once; fix the weakest repeated miss first.
    </p>
    <div class="practice-grid" data-testid="fundamentals-practice-map">
      <a class="practice-card" [routerLink]="['/javascript','trivia','js-event-loop']">
        <div class="question-meta"><span>JavaScript</span><span>Event loop</span></div>
        <h3>Event loop output</h3>
        <p>Trace sync work, microtasks, timers, async/await continuation, and visible output order.</p>
      </a>
      <a class="practice-card" [routerLink]="['/javascript','trivia','js-closures']">
        <div class="question-meta"><span>JavaScript</span><span>Closure</span></div>
        <h3>Closures</h3>
        <p>Practice lexical scope, retained state, stale callbacks, and callback examples.</p>
      </a>
      <a class="practice-card" [routerLink]="['/javascript','trivia','js-this-keyword']">
        <div class="question-meta"><span>JavaScript</span><span>this</span></div>
        <h3>this keyword</h3>
        <p>Explain call-site binding, arrow functions, bind/call/apply, and callback context loss.</p>
      </a>
      <a class="practice-card" [routerLink]="['/javascript','trivia','js-promises-async-await']">
        <div class="question-meta"><span>JavaScript</span><span>Promise</span></div>
        <h3>Promises and async/await</h3>
        <p>Practice promise state, async/await readability, and error handling semantics.</p>
      </a>
      <a class="practice-card" [routerLink]="['/javascript','trivia','js-microtasks-vs-macrotasks']">
        <div class="question-meta"><span>JavaScript</span><span>Queues</span></div>
        <h3>Microtasks vs macrotasks</h3>
        <p>Compare Promise callbacks, timers, rendering checkpoints, and output ordering.</p>
      </a>
      <a class="practice-card" [routerLink]="['/javascript','trivia','http-caching-basics']">
        <div class="question-meta"><span>HTTP</span><span>Caching</span></div>
        <h3>HTTP caching basics</h3>
        <p>Practice Cache-Control, ETag, freshness, revalidation, and user-visible stale data.</p>
      </a>
      <a class="practice-card" [routerLink]="['/css','trivia','css-box-model']">
        <div class="question-meta"><span>CSS</span><span>Box model</span></div>
        <h3>CSS box model</h3>
        <p>Explain content-box, border-box, padding, margin, and overflow surprises.</p>
      </a>
      <a class="practice-card" [routerLink]="['/css','trivia','css-specificity-hierarchy']">
        <div class="question-meta"><span>CSS</span><span>Specificity</span></div>
        <h3>CSS specificity hierarchy</h3>
        <p>Practice cascade order, specificity scoring, source order, and conflict debugging.</p>
      </a>
      <a class="practice-card" [routerLink]="['/css','trivia','css-grid-vs-flexbox']">
        <div class="question-meta"><span>CSS</span><span>Layout</span></div>
        <h3>Grid vs Flexbox</h3>
        <p>Choose between one-dimensional alignment and two-dimensional layout tracks.</p>
      </a>
      <a class="practice-card" [routerLink]="['/html','trivia','html-dom']">
        <div class="question-meta"><span>HTML</span><span>DOM</span></div>
        <h3>HTML DOM</h3>
        <p>Explain HTML parsing, DOM nodes, and how browser APIs expose document structure.</p>
      </a>
      <a class="practice-card" [routerLink]="['/html','trivia','html-parsing-rendering']">
        <div class="question-meta"><span>HTML</span><span>Rendering</span></div>
        <h3>HTML parsing and rendering</h3>
        <p>Practice progressive parsing, blocking resources, script loading, and render timing.</p>
      </a>
      <a class="practice-card" [routerLink]="['/coding']">
        <div class="question-meta"><span>Mixed</span><span>Practice</span></div>
        <h3>Full quiz practice area</h3>
        <p>Move from fundamentals checks into broader frontend coding and trivia practice.</p>
      </a>
    </div>

    <h2 id="common-mistakes">Common mistakes</h2>
    <div class="mistake-grid" data-testid="fundamentals-common-mistakes">
      <div class="mistake-card">
        <h3>Memorized definitions only</h3>
        <p>Fix it by adding one UI example and one failure mode to every answer.</p>
      </div>
      <div class="mistake-card">
        <h3>Mixing browser queues</h3>
        <p>Separate sync execution, microtasks, macrotasks, rendering, and request callbacks.</p>
      </div>
      <div class="mistake-card">
        <h3>CSS without debugging language</h3>
        <p>Say how you would inspect the rule, box, computed value, or layout boundary.</p>
      </div>
      <div class="mistake-card">
        <h3>One generic API error state</h3>
        <p>Separate auth, permissions, missing data, validation, retryable failures, and stale data.</p>
      </div>
    </div>

    <h2 id="what-to-practice-next">What to practice next</h2>
    <div class="next-grid" data-testid="fundamentals-next-links">
      <a class="next-link" [routerLink]="['/javascript','trivia','js-event-loop']">
        <strong>Fix async output misses</strong>
        <span>Trace event loop, microtask, timer, and async/await behavior.</span>
      </a>
      <a class="next-link" [routerLink]="['/css','trivia','css-specificity-hierarchy']">
        <strong>Fix CSS cascade misses</strong>
        <span>Practice specificity, source order, cascade, and computed style reasoning.</span>
      </a>
      <a class="next-link" [routerLink]="['/html','trivia','html-parsing-rendering']">
        <strong>Fix browser rendering misses</strong>
        <span>Review parsing, blocking resources, DOM construction, and rendering timing.</span>
      </a>
      <a class="next-link" [routerLink]="['/coding']">
        <strong>Open broader practice</strong>
        <span>Move into coding and trivia once the fundamentals diagnostic is stable.</span>
      </a>
    </div>

    <h2 id="frontend-fundamentals-quiz-faq">Frontend fundamentals quiz FAQ</h2>
    <h3>What is a frontend interview fundamentals quiz?</h3>
    <p>
      It is a short diagnostic that checks whether you can explain browser, CSS,
      JavaScript, and HTTP concepts clearly enough for a frontend technical interview.
    </p>

    <h3>How do I use this as a 15-minute frontend fundamentals diagnostic?</h3>
    <p>
      Spend about 15 minutes total: roughly one minute per question, plus a few minutes
      to score your misses and choose the next practice prompt.
    </p>

    <h3>Which browser rendering interview questions should I know?</h3>
    <p>
      Know how HTML and CSS become the DOM, CSSOM, render tree, layout, paint, and
      composited output, then connect each step to performance and UI bugs.
    </p>

    <h3>Which CSS layout interview questions matter most?</h3>
    <p>
      Expect box model, specificity, cascade order, positioning, Flexbox, Grid, and
      responsive layout questions that ask you to debug a real UI outcome.
    </p>

    <h3>What JavaScript async topics appear in frontend interview quizzes?</h3>
    <p>
      Practice promises, async/await, microtasks, macrotasks, event loop output, error
      handling, and how async timing can create stale UI state.
    </p>

    <h3>What HTTP caching topics should frontend engineers know?</h3>
    <p>
      Explain Cache-Control, ETag, max-age, revalidation, stale data policy, and how
      status codes change the UI state the user should see.
    </p>

    <h3>Should I include framework, accessibility, responsive, and performance questions in a fundamentals quiz?</h3>
    <p>
      Yes, but keep them as an add-on after the core diagnostic. Browser, CSS,
      JavaScript, and HTTP basics should drive the 15-minute score; framework,
      accessibility, responsive, and performance prompts help you prepare for broader
      frontend technical interviews.
    </p>

    <h3>How is this frontend fundamentals quiz reviewed?</h3>
    <p>
      FrontendAtlas reviews this quiz against its trivia drills, coding practice paths,
      interview blueprint scoring rubric, and official web platform references for
      browser rendering, JavaScript scheduling, CSS cascade, HTTP caching, accessibility,
      and performance.
    </p>
  </fa-guide-shell>
  `
})
export class FundamentalsCheckArticle {
  readonly editorialAuthor = PUBLIC_EDITORIAL_FACTS.author.name;
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
