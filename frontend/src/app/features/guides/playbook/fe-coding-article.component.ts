// -----------------------------------------------------------------------------
// Shipping Code Under Pressure
// Purpose
//   - Help candidates succeed in the coding portion of FE interviews.
//   - Show how to balance speed with clarity, and avoid common traps.
//   - Provide actionable strategies, patterns, and practice ideas.
// Authoring notes
//   - Focus on real-world UI/JS tasks, not abstract puzzles.
//   - Keep examples concrete and easy to visualize.
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
    }
      /* Numbered sub-steps inside a bullet */
    .sub-steps {
      list-style: decimal;
      margin: .35rem 0 .5rem 1.25rem; /* small indent + tight spacing */
      padding-left: .2rem;
    }
    .sub-steps li { margin: .18rem 0; }
`,
  template: `
  <fa-guide-shell
    title="Shipping Code Under Pressure"
    subtitle="How to tackle coding rounds without freezing or over-engineering."
    [minutes]="8"
    [tags]="['coding','ui','practice']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
  >
    <!-- Opening -->
    <p>
      In coding rounds, nobody expects you to write a production-ready masterpiece.
      What they care about is whether you can <strong>get something working under time pressure</strong>.
      Can you take a fuzzy prompt, break it into steps, and deliver a usable result
      while explaining your thinking? That’s the real test.
    </p>
    <p>
      Most candidates don’t fail because they lack JavaScript knowledge —
      they fail because they <em>freeze under the clock</em>, get stuck over-explaining,
      or waste 20 minutes polishing details before they even have a working version.
      Interviewers would much rather see an ugly but functional dropdown
      than a half-finished “perfect” one.
    </p>
    <p>
      This section gives you a clear framework to stay calm and keep momentum:
      how to <strong>start smart, ship early, and iterate out loud</strong>.
      Think of it like game day — the point isn’t flawless code,
      it’s showing you can perform under pressure.
    </p>

    <!-- Section 1 -->
    <h2>The common setup</h2>
    <p>
      Most coding rounds start with a short, open-ended prompt. 
      The goal isn’t to see if you can build a polished app, 
      but whether you can <strong>turn a vague request into a working solution</strong>.
    </p>
    <p>
      Typical prompts look like:
    </p>
    <ul>
      <li>“Build a dropdown that works with both mouse <em>and</em> keyboard.”</li>
      <li>“Write a <code>debounce</code> utility that prevents a function from firing too often.”</li>
      <li>“Fix this async bug where a fetch wrapper sometimes returns stale data.”</li>
    </ul>
    <p>
      Notice how none of these are huge projects — they’re small, focused problems.  
      What interviewers care about is <strong>your process</strong>: do you ask clarifying questions, 
      start small with a working version, and explain your choices as you go?
    </p>
    <p>
      If you keep those habits, even a half-finished solution can score well — 
      because it shows how you think, not just what you type.
    </p>

    <!-- Section 2 -->
    <h2>How to approach it</h2>
    <p>
      When the timer starts, don’t panic — lean on a simple sequence you can follow every time.  
      Think of it like a playbook:
    </p>
    <ol>
      <li>
        <strong>Restate the problem.</strong>  
        Say it back in your own words.  
        Example: “So you want a dropdown that opens on click and works with arrow keys?”  
        This confirms you understood, and buys a minute to think.
      </li>
      <li>
        <strong>Sketch a plan out loud.</strong>  
        Outline your first steps before coding:  
        “I’ll hardcode a basic dropdown, then wire up keyboard navigation.”  
        This shows structure and avoids aimless coding.
      </li>
      <li>
        <strong>Build the MVP first.</strong>  
        Don’t chase perfection. Ship something that <em>works</em>, even if ugly.  
        Interviewers want to see progress — not a half-polished failure.
      </li>
      <li>
        <strong>Add essentials next.</strong>  
        Once it works, layer in edge cases: error handling, empty input, keyboard traps.  
        These are the details that make you stand out as a front-end engineer.
      </li>
      <li>
        <strong>Polish if time remains.</strong>  
        Rename variables, add comments, or refactor.  
        This is bonus credit — nice to have, but never at the cost of a working solution.
      </li>
    </ol>
    <p>
      Following this order keeps you calm, shows the interviewer your thinking,  
      and guarantees you’ll have something working on the screen by the end.
    </p>

    <!-- Section 3 -->
    <h2>Patterns that help</h2>
    <p>
      When nerves hit, lean on repeatable patterns — they keep you calm and make your process easy for the interviewer to follow:
    </p>
    <ul>
    <li>
      <strong>ICE: Inputs → Constraints → Examples.</strong>
      <ol class="sub-steps">
        <li>Repeat the <em>inputs</em> you’ll handle.</li>
        <li>Clarify the <em>constraints</em> (time, performance, edge cases).</li>
        <li>Walk through one or two <em>examples</em> (“Empty array should return []”).</li>
      </ol>
      This shows you think systematically instead of jumping straight into code.
    </li>
      <li>
        <strong>Work in small steps.</strong><br />
        Write a little, test a little. Drop in <code>console.log</code> or temporary outputs.  
        Example: print the intermediate array length before mapping it.  
        This keeps you from going silent and reduces the risk of a big, invisible bug.
      </li>
      <li>
        <strong>Talk in trade-offs.</strong><br />
        Narrate your choices as you go:  
        “I’ll use <code>debounce</code> instead of <code>throttle</code> because we only care about the last event.”  
        Even if you’re wrong, explaining your reasoning earns credit.
      </li>
      <li>
        <strong>Show testing instinct.</strong><br />
        Interviewers love when you ask:  
        “What happens if the list is empty? What if the API call fails?”  
        These small checks prove you think like someone who ships real code, not just solves puzzles.
      </li>
    </ul>
    <p>
      These patterns aren’t flashy tricks — they’re habits that make you look steady, structured, and <em>hireable</em> under pressure.
    </p>

    <!-- Section 4 -->
    <h2>Common pitfalls</h2>
    <ul>
      <li>
        <strong>Coding in silence.</strong><br />
        If the interviewer can’t follow your thought process, they can’t give you credit.  
        Narrate even simple things: “I’ll start with a basic version and handle errors next.”
      </li>
      <li>
        <strong>Over-engineering.</strong><br />
        Don’t build a full design system when they just asked for a dropdown.  
        Start with a working widget → add essentials → polish if time remains.
      </li>
      <li>
        <strong>Skipping error handling.</strong><br />
        Crashing on <code>null</code> input or an empty list is worse than leaving features unpolished.  
        Show you’d handle failures gracefully — even a single <code>try/catch</code> or “if empty, return []” matters.
      </li>
      <li>
        <strong>Not showing progress.</strong><br />
        If nothing runs for 25 minutes, you’ve lost the room.  
        Get something working early (even if ugly) so you have a demoable checkpoint.
      </li>
      <li>
        <strong>Polishing too early.</strong><br />
        Spending 15 minutes on perfect CSS before functionality works is a red flag.  
        Prove functionality first, then improve naming, structure, and style.
      </li>
      <li>
        <strong>Ignoring accessibility.</strong><br />
        Forgetting keyboard navigation or basic ARIA hints makes your solution incomplete.  
        Even small touches (like <code>aria-label</code> or Escape-to-close) show you build for real users.
      </li>
    </ul>

    <!-- Section 5 -->
    <h2>How to practice</h2>
    <p>
      The best prep is <strong>hands-on coding under time pressure</strong>.  
      Reading won’t build muscle memory — building will. Treat every session like a mini-interview.
    </p>
    <ul>
      <li>
        <a [routerLink]="['/coding']">Coding practice area</a> → Start small with utilities like 
        <code>debounce</code>, <code>once</code>, or <code>memoize</code>.  
        Aim for clarity and correctness before worrying about optimization.
      </li>
      <li>
        <a [routerLink]="['/coding']">UI widget drills</a> → Rebuild a modal, dropdown, or autocomplete.  
        Use the <em>MVP → keyboard support → polish</em> flow so you practice shipping in stages.
      </li>
      <li>
        Record yourself (screen + audio).  
        Play it back: did you explain your steps out loud, or did you drift into silence?  
        Self-review reveals gaps faster than more coding.
      </li>
      <li>
        Timebox practice: 30–45 min sessions.  
        This mimics real interviews better than marathon sessions, and forces you to prioritize essentials.
      </li>
      <li>
        Add “stretch reps.” Once your dropdown works, try handling errors or adding accessibility (e.g., Escape to close).  
        Practicing these extras makes you stand out.
      </li>
    </ul>

    <!-- Closing -->
    <p>
      Remember: <strong>ship first, then improve</strong>.  
      A working but imperfect widget always beats a half-written “perfect” solution.
    </p>
  </fa-guide-shell>
  `
})
export class FeCodingArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
