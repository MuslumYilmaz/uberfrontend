// features/guides/playbook/fe-intro-article.component.ts
// -----------------------------------------------------------------------------
// How Front-End Interviews Really Work (and How to Prep)
// Purpose
//   - Give candidates a realistic picture of FE interviews.
//   - Explain what companies truly evaluate and why.
//   - Provide an actionable prep framework + short checklists.
// Authoring notes
//   - Keep it practical, 14-16 min read max.
//   - Prefer examples, checklists, and small patterns over long prose.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';
import { PUBLIC_EDITORIAL_FACTS } from '../../../core/content/public-editorial-facts';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    /* Inline links */
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
    }
    .guide-content {           /* add this wrapper around <ng-content> in GuideShell if not present */
      max-width: 760px;
      line-height: 1.65;
      font-size: 16.5px;
      letter-spacing: 0.1px;
      color: #E6EAF2;
    }

    .guide-content p { margin: 0 0 0.9rem; }
    .guide-content p + p { margin-top: .6rem; }    /* smaller gaps for consecutive paragraphs */

    .guide-content ul, .guide-content ol { 
      margin: .2rem 0 .9rem 1.2rem;
    }
    .guide-content li { margin: .28rem 0; }
    .guide-content li > strong { font-weight: 600; } /* avoid super heavy bold blocks */

    .guide-content h2 {
      margin: 1.8rem 0 .6rem;
      font-size: 1.25rem;
      line-height: 1.3;
      letter-spacing: .2px;
    }
    .guide-content h3 {
      margin: 1.2rem 0 .4rem;
      font-size: 1.05rem;
    }

    .freshness {
      margin: 0 0 1rem;
      color: #b6c4d8;
      font-size: 0.95rem;
    }

    .toc {
      margin: 1rem 0 1.4rem;
      padding: 0.9rem 1rem;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
    }

    .toc strong {
      display: block;
      margin-bottom: 0.45rem;
      color: #f3f7ff;
    }

    .toc ul {
      display: grid;
      gap: 0.35rem;
      margin: 0;
      padding-left: 1rem;
    }

    .next-practice {
      display: grid;
      gap: 0.6rem;
      margin: 0.7rem 0 1rem;
    }

    .next-practice a {
      display: block;
      padding: 0.72rem 0.85rem;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
    }

    /* Links: subtle by default, clear on hover */
    .guide-content a {
      color: #7CC2FF;
      text-decoration: none;
      border-bottom: 1px dotted transparent;
      transition: color .15s ease, border-color .15s ease;
    }
    .guide-content a:hover {
      color: #A9DBFF;
      border-color: currentColor;        /* looks like an underline only on hover */
    }

    /* “Title links” inside headings get an arrow cue */
    .guide-content .title-link {
      position: relative; padding-right: 18px; font-weight: 600;
    }
    .guide-content .title-link::after {
      content: "→"; position: absolute; right: 0; top: 0; opacity: .7; transition: transform .15s ease, opacity .15s ease;
    }
    .guide-content .title-link:hover::after { transform: translateX(2px); opacity: 1; }

    /* Tables easier to scan */
    .guide-content table {
      width: 100%; border-collapse: collapse; font-size: 15px; margin: .6rem 0 1rem;
      background: #111418; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; overflow: hidden;
    }
    .guide-content thead th {
      background: #151921; text-align: left; padding: .6rem .7rem; font-weight: 600;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .guide-content tbody td { padding: .55rem .7rem; border-top: 1px solid rgba(255,255,255,.06); }
    .guide-content tbody tr:nth-child(odd) { background: #0E1218; }

    /* Code blocks: add breathing room & scrolling when needed */
    .guide-content pre {
      background: #0C1016; border: 1px solid rgba(255,255,255,.08);
      padding: .8rem; border-radius: 10px; overflow: auto; margin: .6rem 0 1rem;
    }

        ol.step-list { counter-reset:item; margin: 8px 0 14px; padding-left:0; }
    ol.step-list > li {
      list-style:none;
      counter-increment:item;
      position:relative;
      padding-left:1.9rem;
      margin:6px 0;
    }
    ol.step-list > li::before {
      content: counter(item);
      position:absolute; left:0; top:0.1rem;
      width:1.4rem; height:1.4rem;
      display:grid; place-items:center;
      border-radius:9999px;
      font-size:.8rem; font-weight:700;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.16);
      color:#cfe1ff;
    }
  `],
  template: `
  <fa-guide-shell
    title="Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions"
    subtitle="A clear map of frontend interview rounds, question categories, evaluation criteria, and a practical 30-day prep roadmap."
    [minutes]="16"
    [tags]="['overview','roadmap','questions']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness">
      Last updated: June 2026 | Author: {{ editorialAuthor }}
    </div>

    <!-- Opening -->
    <p>
      Front-end interviews often feel like a lottery. One company throws you an
      algorithm, the next wants you to build a modal from scratch, and a third
      quizzes you on obscure browser details. It’s easy to think there’s no pattern.
    </p>
    <p>
      But underneath, most interviewers are looking for the same core signals:
      <strong>can you ship a working solution under time pressure, explain your
      choices clearly, and show that you think like an engineer who cares about the
      end-user?</strong>
    </p>
    <p>
      That means the exact question matters less than how you approach it. Do you
      break problems down? Do you communicate trade-offs? Do you balance speed with
      correctness? These are the threads that run through every round.
    </p>
    <p>
      This guide exists to cut through the noise: we’ll map out the formats you’re
      likely to face, what each one is really testing, and how to prep in a way that
      builds confidence instead of burnout.
    </p>
    <p>
      <strong>Worked example:</strong> imagine a 4-round loop where you first solve a
      JavaScript utility, then build a modal with keyboard support, then explain a
      dashboard architecture, and finally walk through a conflict story. The company
      is not secretly testing four unrelated skills. It is checking whether you can
      ship under pressure, debug UI details, reason about trade-offs, and explain your
      decisions like a teammate people would trust in production.
    </p>

    <nav class="toc" aria-label="Frontend interview preparation guide sections">
      <strong>Use this guide to answer four prep questions quickly:</strong>
      <ul>
        <li><a href="#interview-rounds">Which frontend interview rounds should I expect?</a></li>
        <li><a href="#question-categories">Which frontend interview questions should I practice?</a></li>
        <li><a href="#roadmap">What should my 30-day frontend interview roadmap look like?</a></li>
        <li><a href="#practice-next">Where should I practice next?</a></li>
      </ul>
    </nav>

    <!-- Section 1 -->
    <h2 id="interview-rounds">The big picture</h2>
    <ul>
      <li>There’s no universal format — expect a mix of coding, UI builds, debugging, and system design.</li>
      <li>Trend: less whiteboard puzzles, more domain-relevant tasks (widgets, JS utilities, async/state bugs).</li>
      <li>What matters most: correctness → clarity → reasoning → trade-offs → communication.</li>
      <li>Interviews are not just about “knowing stuff” — they’re about <em>showing how you think under pressure</em>.</li>
    </ul>

    <p>
      Almost every loop has a coding exercise. You might need to build a small
      UI widget (modal, dropdown, autocomplete) or implement a JavaScript helper
      (<code>debounce</code>, <code>memoize</code>). Interviewers want to see if you
      can <strong>ship something working under time pressure</strong>.
    </p>
    <ol class="step-list">
      <li>Get to a working MVP first, then polish if there’s time.</li>
      <li>Work incrementally — show progress in small steps.</li>
      <li>Think about edge cases early (empty input, async errors, large data sets).</li>
      <li>Explain your thought process instead of silently coding.</li>
    </ol>

    <h3><a [routerLink]="['/guides','system-design-blueprint']">System design (senior+)</a></h3>
    <p>
      For mid–senior candidates, system design is often the deciding round. Instead
      of backend scaling, you’ll focus on <strong>front-end architecture</strong>:
      how components talk to each other, where state lives, and how you handle
      performance and accessibility trade-offs.
    </p>
    <ol class="step-list">
      <li>Define the MVP clearly so you don’t overbuild.</li>
      <li>Show how you’d organize state and data flow (local vs global, sync vs async).</li>
      <li>Call out performance considerations (caching layers, code-splitting).</li>
      <li>Bake in accessibility from the start, not as an afterthought.</li>
    </ol>

    <h3>Quiz / knowledge checks</h3>
    <p>
      These are short questions sprinkled in to test fundamentals. Expect things like:
      “How does the rendering pipeline work?” or “What’s the difference between
      <code>async</code> and <code>defer</code>?”. It’s about showing <strong>solid mental models</strong>,
      not memorizing obscure trivia.
    </p>
    <ol class="step-list">
      <li>Be ready to explain event loop, rendering, CSS cascade, caching, and security basics.</li>
      <li>Create a 1-page cheatsheet and practice recall, not just recognition.</li>
      <li>Focus on clarity and confidence — you don’t need every edge case.</li>
    </ol>

    <h3>Behavioral</h3>
    <p>
      Many candidates underestimate this round, but hiring managers weigh it heavily.
      They want to know: can you <strong>work well with others under ambiguity</strong>?
    </p>
    <ol class="step-list">
      <li>Prepare 5–6 STAR stories (Situation, Task, Action, Result) around conflict, failure, learning, leadership, and speed.</li>
      <li>Be concrete — instead of “we improved performance,” say “we reduced LCP from 6s → 3s with lazy loading.”</li>
      <li>Keep each story short: 2–3 minutes with a clear takeaway.</li>
    </ol>

    <!-- Section 3 -->
    <h2 id="scoring">What interviewers actually score</h2>
    <ul>
      <li><strong>Correctness & scope control:</strong> you ship something working, even if minimal.</li>
      <li><strong>Code quality under time:</strong> readable names, small functions, no unnecessary complexity.</li>
      <li><strong>Reasoning & trade-offs:</strong> why debounce over throttle, why SW cache vs server cache.</li>
      <li><strong>Communication:</strong> you narrate intent, invite hints, and self-test your work.</li>
      <li><strong>Product & accessibility sense:</strong> sensible defaults, keyboard navigation, basic ARIA.</li>
    </ul>

    <!-- Section 4 -->
    <h2>Typical hiring process</h2>
    <ol>
      <li>
        <strong>Recruiter call (20–30 min).</strong>  
        A quick conversation about your background and motivation.  
        Expect light screening questions (e.g., “What’s the difference between var, let, const?”).  
        Purpose: check you’re a fit on paper and can communicate well.
      </li>
      <li>
        <strong>Online assessment / take-home.</strong>  
        Usually a timed quiz (30–60 min) or a small project you submit in a few days.  
        They want to see your *raw coding ability* without interview pressure.  
        Tip: keep your solution simple and easy to read — don’t over-engineer.
      </li>
      <li>
        <strong>Phone screen / virtual interview (45–60 min).</strong>  
        A live coding task with an engineer.  
        You’ll likely implement a small UI widget or JS helper, while talking through your approach.  
        This is where narration matters: share your thinking instead of silently typing.
      </li>
      <li>
        <strong>Onsite / interview loop (half-day to full-day).</strong>  
        Multiple rounds back-to-back:  
        - **Coding** (bigger task or multiple small ones).  
        - **System design** (for senior roles: architecture, state, data flow).  
        - **Behavioral** (team fit, communication, past experiences).  
        Tip: bring steady energy — consistency across rounds matters as much as nailing one.
      </li>
    </ol>
    <p>
      💡 Pro tip: Always ask your recruiter for the exact breakdown of rounds.  
      Many companies even send prep material — if they offer, *use it*. It shows initiative and helps you focus your practice.
    </p>

    <!-- Section 5 -->
    <h2>Strategic prep habits</h2>
    <ul>
      <li>
        <strong>Baseline fluency.</strong>  
        Be able to explain and use closures, promises, async/await, the event loop, DOM APIs, and CSS layout without hesitation.  
        Tip: practice writing 10–15 line snippets from memory (e.g., a throttled scroll listener) until it feels automatic.
      </li>
      <li>
        <strong>UI reps.</strong>  
        Rebuild common widgets (modal, dropdown, autocomplete, virtual list) under a 30–45 min timer.  
        Focus on: shipping a minimal working version first, then adding keyboard navigation and a11y basics.  
        This simulates interview pressure and shows you can prioritize correctly.
      </li>
      <li>
        <strong>Design drills.</strong>  
        Take a common feature (chat app, dashboard filter panel, date picker) and sketch:  
        1) what goes in local vs global state, 2) what data flows between components, 3) which props/events are needed.  
        These 15–20 min exercises sharpen your system design thinking for FE roles.
      </li>
      <li>
        <strong>Mocks.</strong>  
        Run 45-min practice interviews with a friend or record yourself.  
        Play back to check: did you narrate clearly, did you jump to code too soon, did you confirm requirements?  
        Self-review is often more revealing than extra practice.
      </li>
      <li>
        <strong>Behavioral.</strong>  
        Prepare 5–6 STAR stories (Situation, Task, Action, Result) around failure, conflict, learning, leadership, and impact.  
        Keep answers 2–3 minutes — long enough for depth, short enough to leave room for follow-ups.  
        Bonus: practice linking stories back to front-end context (e.g., “we fixed a perf bug by reducing bundle size”).
      </li>
    </ul>

    <!-- Section 5b -->
    <h2>High-value topics to prepare</h2>
    <p>
      Front-end interviews don’t expect you to know everything — but some topics show
      up over and over. Here’s a cheat sheet of where to focus your energy:
    </p>

    <table>
      <thead>
        <tr>
          <th>Area</th>
          <th>Core Topics</th>
          <th>Why it matters</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>JavaScript</strong></td>
          <td>Closures, async/await, promises, this binding, prototypes</td>
          <td>Shows you can reason about async code and avoid hidden bugs.</td>
        </tr>
        <tr>
          <td><strong>Browser</strong></td>
          <td>Event loop, rendering pipeline, repaint/reflow, local/session storage</td>
          <td>Core to debugging performance issues and explaining “why the page feels slow.”</td>
        </tr>
        <tr>
          <td><strong>CSS & Layout</strong></td>
          <td>Flexbox, Grid, stacking context, positioning, responsive units</td>
          <td>Nearly every UI task involves layout — fluency here = speed in interviews.</td>
        </tr>
        <tr>
          <td><strong>DOM & APIs</strong></td>
          <td>querySelector, event delegation, classList, fetch, IntersectionObserver</td>
          <td>Most practical tasks require manipulating the DOM without frameworks.</td>
        </tr>
        <tr>
          <td><strong>Accessibility</strong></td>
          <td>Keyboard navigation, ARIA roles, focus management, color contrast</td>
          <td>Interviewers notice instantly if you ignore accessibility — it’s a correctness issue.</td>
        </tr>
        <tr>
          <td><strong>System Design (FE)</strong></td>
          <td>State management, component APIs, caching, code splitting, error/loading states</td>
          <td>Critical for senior roles — separates mid-level from senior candidates.</td>
        </tr>
        <tr>
          <td><strong>Testing</strong></td>
          <td>Unit vs integration, mocking APIs, snapshot tests</td>
          <td>Signals maturity: you think beyond “happy path” coding.</td>
        </tr>
      </tbody>
    </table>

<p>
  📌 Use this table as a <strong>study checklist</strong>: tick off one row at a time, and you’ll
  cover 80% of what interviewers actually care about.
</p>

    <h2 id="question-categories">Common frontend interview question categories</h2>
    <p>
      When candidates search for frontend interview questions, they usually need more
      than a random list. They need to know which category the question belongs to,
      what signal it tests, and how to practice it without wasting time.
    </p>
    <table>
      <thead>
        <tr>
          <th>Question category</th>
          <th>Examples</th>
          <th>Best practice format</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>JavaScript utilities</strong></td>
          <td><code>debounce</code>, <code>throttle</code>, <code>memoize</code>, event emitters</td>
          <td>Write from memory, explain edge cases, then test async behavior.</td>
        </tr>
        <tr>
          <td><strong>UI components</strong></td>
          <td>Modal, tabs, accordion, autocomplete, virtual list</td>
          <td>Ship an MVP first, then add keyboard navigation, empty state, and loading state.</td>
        </tr>
        <tr>
          <td><strong>Browser and CSS</strong></td>
          <td>Rendering pipeline, stacking context, event loop, responsive layout</td>
          <td>Explain the mental model, then connect it to a real debugging scenario.</td>
        </tr>
        <tr>
          <td><strong>Frontend system design</strong></td>
          <td>News feed, chat UI, dashboard, notifications, design system architecture</td>
          <td>Clarify requirements, choose state boundaries, define APIs, and discuss trade-offs.</td>
        </tr>
        <tr>
          <td><strong>Behavioral and collaboration</strong></td>
          <td>Conflict, missed deadline, accessibility trade-off, performance regression</td>
          <td>Prepare STAR stories with concrete metrics and frontend-specific decisions.</td>
        </tr>
      </tbody>
    </table>

    <h2>Prep paths by level</h2>
    <p>
      The same frontend interview preparation guide should not send every candidate
      through the same sequence. Use your level to decide what gets most of your reps.
    </p>
    <table>
      <thead>
        <tr>
          <th>Level</th>
          <th>Primary focus</th>
          <th>Do not skip</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Junior</strong></td>
          <td>JavaScript fundamentals, DOM, CSS layout, and simple UI tasks.</td>
          <td>Verbal explanations. Practice saying why your solution works.</td>
        </tr>
        <tr>
          <td><strong>Mid-level</strong></td>
          <td>Timed coding, component API decisions, async state, and testing trade-offs.</td>
          <td>Edge cases: loading, empty, error, accessibility, and cancellation.</td>
        </tr>
        <tr>
          <td><strong>Senior</strong></td>
          <td>Frontend system design, architecture, performance, reliability, and team impact stories.</td>
          <td>Scope control. Senior loops punish candidates who overbuild before clarifying constraints.</td>
        </tr>
      </tbody>
    </table>

    <!-- Section 6 -->
    <h2>Resume preparation</h2>
    <p>
      Your resume won’t land you the job on its own, but it’s the gatekeeper —
      if it doesn’t pass the first screen, you’ll never get to show your skills in an interview.
      The goal is simple: make it <strong>impossible to miss your front-end impact</strong>.
    </p>
    <ul>
      <li><strong>Show impact, not tasks.</strong> Replace “Built a component library” with
        “Shipped a design system adopted by 3 teams, cut duplicate CSS by 60%.”</li>
      <li><strong>Use numbers wherever possible.</strong> “Reduced LCP from 5s → 2.8s”
        or “Improved bundle size by 35%” are signals recruiters and engineers immediately understand.</li>
      <li><strong>Prioritize relevance.</strong> Front-end performance, accessibility wins, design system work,
        or tricky UI challenges should always come before generic responsibilities.</li>
      <li><strong>Keep it lean.</strong> 1 page if you’re under 10 years of experience, 2 max otherwise.
        Less is more — clarity and scannability beat a laundry list of bullets.</li>
      <li><strong>Tailor for the role.</strong> If you’re applying to a React-heavy role, highlight React work first.
        Same for Angular, Vue, or TypeScript.</li>
    </ul>
    <p>
      👉 For concrete examples and templates, see the
      <a [routerLink]="['/guides','interview-blueprint','resume']">resume guide</a>.
    </p>

    <!-- Section 7 -->
    <h2>Execution patterns worth remembering</h2>
    <ul>
      <li>
        <strong>ICE – Inputs, Constraints, Examples.</strong><br />
        Before you write a single line of code, slow down and do three things out loud:
        <ol>
          <li>Repeat the <em>input</em> you’re given.</li>
          <li>Clarify the <em>constraints</em> (time limits, data size, edge cases).</li>
          <li>Walk through a couple of <em>examples</em> to be sure you and the interviewer see it the same way.</li>
        </ol>
        This buys you time, reduces miscommunication, and shows you think systematically.
      </li>
      <li>
        <strong>RED – Read, Explain, Do.</strong><br />
        When debugging or reading unfamiliar code:
        <ol>
          <li><em>Read</em> the snippet slowly.</li>
          <li><em>Explain</em> what you think it does, line by line, in plain words.</li>
          <li><em>Do</em> the fix or the next step.</li>
        </ol>
        Interviewers love this because they can follow your thought process instead of waiting for silence to break.
      </li>
      <li>
        <strong>RAC – Result, Approach, Complexity.</strong><br />
        At the end of any coding question, wrap up with a 30-second summary:
        <ul>
          <li><em>Result:</em> what works now and which edge cases you covered.</li>
          <li><em>Approach:</em> the main idea you used, and why.</li>
          <li><em>Complexity:</em> the rough runtime/space costs, plus what you’d improve if you had more time.</li>
        </ul>
        This leaves the interviewer with confidence that you know what you did and how it scales.
      </li>
    </ul>

    <!-- Section 8 -->
    <h2 id="roadmap">30-day frontend interview roadmap</h2>
    <p>
      If you have a month, use the schedule below as a compact frontend interview
      roadmap. The goal is not maximum volume. The goal is to build reliable reps
      across the question types that actually show up in frontend loops.
    </p>

    <table>
      <thead>
        <tr>
          <th>Days</th>
          <th>Focus</th>
          <th>Daily reps</th>
          <th>Why it matters</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1-7</strong></td>
          <td>JS + Browser fundamentals</td>
          <td>Do 3 quick quiz cards + 1 small JS utility each day</td>
          <td>Sharp recall of event loop, async/await, DOM quirks means less panic when you see trivia or debugging prompts.</td>
        </tr>
        <tr>
          <td><strong>8-15</strong></td>
          <td>UI components</td>
          <td>Build 1 component/day (modal, dropdown, autocomplete) with keyboard support</td>
          <td>Most companies test if you can ship usable UI fast. By the end of this week you’ll have a toolkit of reusable patterns in your muscle memory.</td>
        </tr>
        <tr>
          <td><strong>16-23</strong></td>
          <td>System design (FE)</td>
          <td>Take 1 design prompt → sketch a diagram → write a 5–6 line summary</td>
          <td>Prevents blank stares in senior interviews. Practicing diagrams trains you to explain data flow, state, and trade-offs under time pressure.</td>
        </tr>
        <tr>
          <td><strong>24-30</strong></td>
          <td>Mocks, behavioral, and review</td>
          <td>Do 2 x 45-min practice interviews + write retro notes</td>
          <td>Builds interview stamina. Reviewing your mistakes here saves you from repeating them in the real loop.</td>
        </tr>
      </tbody>
    </table>

<p>
  Pro tip: Don’t cram. Even 30-45 minutes a day beats a single 6-hour binge.
  Treat this plan like a workout routine: small, consistent reps compound.
</p>

    <h2>4-6 week variant</h2>
    <p>
      If your fundamentals are rusty, stretch the same roadmap to 4-6 weeks. Spend
      the extra time on JavaScript, CSS layout, and browser behavior before you add
      harder UI or system design prompts.
    </p>
    <ol>
      <li><strong>Week 1:</strong> JavaScript fundamentals, event loop, promises, and DOM APIs.</li>
      <li><strong>Week 2:</strong> CSS layout, accessibility basics, browser rendering, and debugging.</li>
      <li><strong>Week 3:</strong> Timed JavaScript utilities and small UI components.</li>
      <li><strong>Week 4:</strong> Larger UI builds, testing strategy, and API/state trade-offs.</li>
      <li><strong>Weeks 5-6:</strong> Frontend system design, behavioral stories, mocks, and targeted review.</li>
    </ol>

    <!-- Section 9 -->
    <h2>Common pitfalls</h2>
    <ul>
      <li>
        <strong>Over-indexing on LeetCode.</strong>  
        Many candidates spend 80% of their prep on algorithms that rarely appear in FE interviews.  
        Shift at least half of that time to UI coding, debugging, and system design — where you’ll actually be tested.
      </li>
      <li>
        <strong>Coding in silence.</strong>  
        Interviewers can’t grade what they can’t hear. If you don’t narrate your thought process, they may assume you’re stuck.  
        Even saying out loud “I’ll start with a basic version, then handle errors” shows structure and confidence.
      </li>
      <li>
        <strong>Polishing before shipping.</strong>  
        Spending 20 minutes on pixel-perfect CSS while the core logic is incomplete is a red flag.  
        Always ship a working MVP first, then layer improvements if time allows.
      </li>
      <li>
        <strong>Treating accessibility as optional.</strong>  
        Keyboard support and basic ARIA roles are table stakes.  
        Interviewers notice when you add <code>aria-label</code> or trap focus in a modal — it signals real-world experience.
      </li>
    </ul>
    <!-- Section 10 -->
    <h2 id="practice-next">What to practice next</h2>
    <p>
      Prepping can feel overwhelming, so move from this frontend interview
      preparation guide into one focused practice surface. Choose the weakest
      category from your last mock instead of opening every resource at once.
    </p>
    <div class="next-practice">
      <a [routerLink]="['/guides','interview-blueprint','coding-interviews']">
        Frontend coding interview questions and prep guide: map prompts, rubric, and timed strategy.
      </a>
      <a [routerLink]="['/guides','interview-blueprint','ui-interviews']">
        Frontend UI interview practice: build accessible components with edge states.
      </a>
      <a [routerLink]="['/guides','system-design-blueprint']">
        Frontend system design practice: use RADIO, examples, and real architecture prompts.
      </a>
      <a [routerLink]="['/guides','framework-prep']">
        Framework prep paths: choose JavaScript, React, Angular, or Vue interview preparation.
      </a>
      <a [routerLink]="['/coding']">
        Question library: practice frontend interview questions in the coding workspace.
      </a>
      <a [routerLink]="['/guides','behavioral','intro']">
        Frontend behavioral interview questions: prepare STAR stories around frontend impact.
      </a>
    </div>
    <p>
      In short: don’t just read. Practice here, review your mistakes, and build
      interview muscle memory before the real thing.
    </p>
  </fa-guide-shell>
  `
})
export class FeIntroArticle {
  readonly editorialAuthor = PUBLIC_EDITORIAL_FACTS.author.name;
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
