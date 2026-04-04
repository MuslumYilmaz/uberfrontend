// -----------------------------------------------------------------------------
// A Front-End Resume That Gets Calls Back
// Purpose: Help FE candidates write resumes that pass screens & land interviews
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [GuideShellComponent, RouterModule],
    styles: [`
    a { color:#7CC2FF; text-decoration:none; border-bottom:1px dotted transparent; transition:color .15s ease, border-color .15s ease; }
    a:hover { color:#A9DBFF; border-color:currentColor; }

    .guide-content { max-width:760px; line-height:1.65; font-size:16.5px; color:#E6EAF2; }
    .guide-content h2 { margin:1.8rem 0 .6rem; font-size:1.25rem; }
    .guide-content h3 { margin:1.2rem 0 .4rem; font-size:1.05rem; }
    .guide-content ul, .guide-content ol { margin:.2rem 0 .9rem 1.2rem; }
    .guide-content li { margin:.28rem 0; }

    .guide-content table { width:100%; border-collapse:collapse; background:#111418; border:1px solid rgba(255,255,255,.08); border-radius:8px; overflow:hidden; margin:.6rem 0 1rem; }
    .guide-content thead th { background:#151921; text-align:left; padding:.6rem .7rem; font-weight:600; border-bottom:1px solid rgba(255,255,255,.08); }
    .guide-content tbody td { padding:.55rem .7rem; border-top:1px solid rgba(255,255,255,.06); }
    .guide-content tbody tr:nth-child(odd) { background:#0E1218; }

    .guide-content pre {
      background:#0C1016;
      border:1px solid rgba(255,255,255,.08);
      padding:.8rem;
      border-radius:10px;
      overflow:auto;
      margin:.6rem 0 1rem;
      font-size:14px;
      line-height:1.5;
      font-family:'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
  `],
    template: `
  <fa-guide-shell
    title="Frontend Resume for Interviews: What Gets Calls and What Gets Rejected"
    subtitle="A practical frontend resume blueprint with impact bullets and common mistakes to remove before applying."
    [minutes]="10"
    [tags]="['resume','career','frontend']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined"
  >
    <!-- Intro -->
    <p>
    Your resume is your <strong>first filter</strong>. Most recruiters and hiring
    managers spend less than <em>30 seconds</em> on the first pass. If they can’t
    quickly spot your front-end impact, you won’t even make it to the interview
    loop.  
    </p>
    <p>
    The goal is simple: make your achievements <strong>impossible to miss</strong>.
    Highlight the wins that show you can build, ship, and improve products —
    not just that you “worked on features.”
    </p>
    <p>
    A strong resume should also tee up the next screens. If your bullets naturally lead into
    <a [routerLink]="['/guides/interview-blueprint/coding-interviews']">coding interview conversations</a>
    or a sharper <a [routerLink]="['/guides/interview-blueprint/system-design']">front-end system design story</a>,
    recruiters can already see how you might perform once you reach the interview loop.
    </p>

    <!-- Section 1 -->
    <h2>Core principles</h2>
    <ul>
    <li>
        <strong>Impact over tasks:</strong> Don’t just say “Built a dashboard.”  
        Say “Shipped a dashboard used by 5k users daily, cut support tickets by 20%.”
    </li>
    <li>
        <strong>Numbers stick:</strong> Metrics make your work credible.  
        “Reduced LCP 6s → 3s” or “Improved bundle size by 35%” beats vague claims.
    </li>
    <li>
        <strong>Relevance first:</strong> Put <em>front-end wins</em> at the top — performance boosts, a11y fixes, 
        design systems — before listing generic responsibilities.
    </li>
    <li>
        <strong>Scannable layout:</strong> Keep it to 1 page if you’re under 10 years of experience, 2 max otherwise.  
        Use clear headings and bullets — no recruiter wants to dig through walls of text.
    </li>
    <li>
        <strong>Tailor to the role:</strong> Applying for a React job? Lead with React achievements.  
        Same with Angular, Vue, or TypeScript — show you match their stack.
    </li>
    </ul>

    <!-- Section 2 -->
    <h2>Good vs bad bullets</h2>
    <p>
    The difference between a resume that gets ignored and one that gets calls back often comes down to <strong>how you phrase your impact</strong>.  
    Weak bullets talk about tasks. Strong bullets highlight <em>results</em>, <em>numbers</em>, and <em>ownership</em>.
    </p>
    <table>
    <thead>
        <tr><th>Weak (task-focused)</th><th>Stronger (impact-focused)</th></tr>
    </thead>
    <tbody>
        <tr>
        <td>“Worked on front-end features.”</td>
        <td>“Built a checkout flow adopted by 3 teams, increasing conversion by <strong>12%</strong>.”</td>
        </tr>
        <tr>
        <td>“Fixed bugs in React app.”</td>
        <td>“Resolved async state bug that <strong>reduced error rate by 40%</strong> and stabilized release cycles.”</td>
        </tr>
        <tr>
        <td>“Helped improve performance.”</td>
        <td>“Cut bundle size by <strong>35%</strong> using code-splitting and tree-shaking, improving LCP from 5.2s → 3.1s.”</td>
        </tr>
        <tr>
        <td>“Maintained UI components.”</td>
        <td>“Shipped a design system library now used across 4 products, eliminating <strong>60% of duplicate CSS</strong>.”</td>
        </tr>
    </tbody>
    </table>
    <p>
    👉 When in doubt: ask yourself, <em>“What changed because of my work?”</em>. That’s the version you should write.
    </p>

    <!-- Section 3 -->
    <h2>Structure that works</h2>
    <p>
    Recruiters skim your resume in <strong>20–30 seconds</strong>. A clean, predictable structure makes it easy for them to find what matters. 
    Here’s a format that consistently works for front-end engineers:
    </p>
    <ol>
    <li>
        <strong>Header:</strong>  
        Keep it simple — Name, email, LinkedIn, GitHub/Portfolio.  
        ⚠️ No full address or personal info needed.
    </li>
    <li>
        <strong>Summary:</strong>  
        2–3 lines max. It’s your elevator pitch. Example:  
        <em>“Senior Front-End Engineer (7y) with React/TypeScript expertise. Led design system adoption and performance optimizations that cut LCP by 40%.”</em>
    </li>
    <li>
        <strong>Experience:</strong>  
        The heart of your resume. Use 3–5 bullet points per job, each showing measurable impact.  
        ✅ Action verb + what you built + measurable outcome.  
        Example: <em>“Shipped new search UI that improved conversion 9% and reduced bounce rate.”</em>
    </li>
    <li>
        <strong>Skills:</strong>  
        Group them logically instead of a laundry list. For example:  
        - <em>Frameworks:</em> React, Angular, Vue  
        - <em>Languages:</em> JavaScript (ES6+), TypeScript  
        - <em>Styling:</em> CSS, Sass, Tailwind  
        - <em>Testing:</em> Jest, Cypress
    </li>
    <li>
        <strong>Education & Extras:</strong>  
        Keep short unless directly relevant.  
        Bootcamps, open-source contributions, or talks can go here if they support your story.
    </li>
    </ol>
    <p>
    👉 The goal: make your resume <strong>scannable, focused, and impact-driven</strong>. If someone only reads your headings + first bullet of each job, they should still “get” your strengths.
    </p>

    <!-- Section 4 -->
    <h2>Checklist before sending</h2>
    <p>
    Before you hit “Apply,” run your resume through this quick checklist.  
    It takes 5 minutes and can be the difference between getting ignored and getting the call:
    </p>
    <ul>
    <li>
        ✅ <strong>Zero typos, consistent tense.</strong>  
        Read it out loud or run a spell-check — small errors suggest carelessness.
    </li>
    <li>
        ✅ <strong>Action verbs only.</strong>  
        Every bullet starts with words like <em>Shipped, Led, Designed, Improved, Reduced</em>.  
        Avoid “Responsible for” — it sounds passive.
    </li>
    <li>
        ✅ <strong>Show measurable impact.</strong>  
        Each bullet should answer: <em>What changed because of your work?</em>  
        Example: <em>“Cut bundle size by 30%, improving LCP by 1.2s.”</em>
    </li>
    <li>
        ✅ <strong>Match the job description.</strong>  
        Mirror key terms like <em>React, TypeScript, GraphQL, a11y, performance</em>.  
        Many resumes are skimmed by ATS — keywords help you clear the filter.
    </li>
    </ul>
    <p>
    👉 If your resume passes this checklist, you’re already ahead of most candidates.  
    Recruiters love clarity, measurable wins, and a document that feels tailored to their role.
    </p>

    <!-- Section 5 -->
    <h2>Extra resources</h2>
    <p>
    You don’t need to reinvent the wheel. Collect a few strong front-end resumes (from friends,
    communities, or open templates) and study their phrasing and structure.  
    Pay attention to how they highlight <em>impact</em> and <em>numbers</em>, not just tasks.
    </p>
    <p>
    👉 Pro tip: Draft your bullets in a separate doc first. Once you’ve got 10–15,
    pick the best 5–6 that clearly show <strong>front-end impact</strong>.  
    This keeps your resume lean and focused.
    </p>

    <!-- Closing -->
    <p>
    Remember: your <strong>resume isn’t the finish line</strong> — it’s the ticket to get in the race.  
    The goal is simple: pass the 30-second skim test. If a recruiter or hiring manager can
    instantly see your <em>front-end impact</em>, you’ll get the call.  
    </p>
    <p>
    Once you’re in the room, the resume fades into the background.  
    What carries you forward is how you <strong>code, explain, and collaborate</strong>.  
    So keep your resume sharp, then shift your energy into interview prep.
    </p>
  </fa-guide-shell>
  `
})
export class ResumeArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
