import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-intro-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Frontend Behavioral Interview Questions: 12 STAR Answers"
      [minutes]="18"
      [tags]="['behavioral','frontend','star-stories']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <p>
        Frontend behavioral interview questions test whether your technical judgment shows up in real team situations:
        accessibility disagreements, performance regressions, ambiguous product scope, incident response, and
        cross-team delivery. A strong answer makes your <strong>ownership, trade-offs, collaboration, and impact</strong>
        obvious without sounding rehearsed.
      </p>
      <p>
        Use this page as a practical map: answer 12 frontend prompts, shape the stories with STAR(R), pressure-test them against a
        scorecard, and practice the weak-vs-strong difference before the interview.
      </p>

      <h2>Quick answer: what this page gives you</h2>
      <ul>
        <li>A frontend-specific behavioral scoring model for clarity, impact, judgment, collaboration, and growth.</li>
        <li>A STAR(R) template that keeps answers concise while still showing technical depth.</li>
        <li>Weak, good, and strong versions of the same frontend conflict answer.</li>
        <li>A 12-question bank you can use to rehearse the prompts frontend candidates actually get.</li>
        <li>Five reusable story prompts for performance, accessibility, incidents, API contracts, and scope ambiguity.</li>
        <li>A 20-minute tune-up to choose stories, refresh metrics, and prepare interviewer questions.</li>
      </ul>

      <h2>What behavioral interviews really test</h2>
      <ul>
        <li><strong>Communication and clarity:</strong> explaining decisions, trade-offs, and impact succinctly.</li>
        <li><strong>Collaboration:</strong> partnering with designers, PMs, QA, and back-end engineers without creating blame.</li>
        <li><strong>Ownership:</strong> driving problems to done, reducing risk, and raising flags early.</li>
        <li><strong>Growth mindset:</strong> seeking feedback, learning fast, and improving the system, not just the code.</li>
        <li><strong>Leadership potential:</strong> mentoring, multiplying others, and setting quality bars.</li>
        <li><strong>Integrity and judgment:</strong> making principled calls under ambiguity and pressure.</li>
      </ul>

      <h2>What great frontend answers look like</h2>
      <ol>
        <li><strong>Specific:</strong> real feature, real users, real constraint, real metric.</li>
        <li><strong>Structured:</strong> use <em>STAR(R)</em> - Situation, Task, Action, Result, Reflection.</li>
        <li><strong>Frontend-aware:</strong> connect the behavior to UX, accessibility, performance, reliability, or delivery quality.</li>
        <li><strong>Trade-off driven:</strong> name at least two options and why one was right for the moment.</li>
        <li><strong>Self-reflective:</strong> close with what you would repeat and what you changed afterward.</li>
      </ol>

      <h2>Build a high-signal story bank</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ul>
          <li>Performance win: Core Web Vitals, bundle cuts, render work, slow route recovery.</li>
          <li>Accessibility push: keyboard support, focus management, WCAG audit, design trade-off.</li>
          <li>Design trade-off: UX polish vs. latency, scope, browser support, or release date.</li>
          <li>Incident or rollback: root cause, blast-radius control, customer communication.</li>
        </ul>
        <ul>
          <li>API contract conflict: schema mismatch, pagination, caching, retry, or ownership boundary.</li>
          <li>Cross-team delivery: PM/design/backend alignment under a deadline.</li>
          <li>Mentoring moment: leveling up a teammate through review, pairing, or documentation.</li>
          <li>Ambiguous product area: shaped requirements, reduced risk, and made success measurable.</li>
        </ul>
      </div>
      <p class="mt-4">
        <strong>Quantify impact:</strong> users affected, seconds saved, conversion changed, errors reduced,
        accessibility issues closed, support tickets down, rollout risk reduced, or team cycle time improved.
      </p>

      <h2>Frontend behavioral interview questions to practice</h2>
      <ol>
        <li>Tell me about a time you improved frontend performance.</li>
        <li>Tell me about a time you disagreed with design or product on a frontend decision.</li>
        <li>Tell me about a production incident or rollback you handled.</li>
        <li>Tell me about a conflict with a back-end team or API contract.</li>
        <li>Tell me about a project with ambiguous requirements.</li>
        <li>Tell me about an accessibility trade-off you influenced.</li>
        <li>Tell me about a time you balanced quality and a tight deadline.</li>
        <li>Tell me about mentoring or leveling up another frontend engineer.</li>
        <li>Tell me about receiving difficult technical feedback and what changed.</li>
        <li>Tell me about a technical decision you changed your mind on.</li>
        <li>Tell me about improving a review, testing, or release process.</li>
        <li>Tell me about coordinating a frontend launch across design, product, QA, and back-end.</li>
      </ol>
      <p>
        Do not memorize twelve full scripts. Map each question to one or two stories, then practice the short version:
        one sentence of context, three actions, one measurable result, and one reflection.
      </p>

      <h2>Reusable STAR(R) answer template</h2>
      <table class="table-auto border border-neutral-700 mt-4 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Step</th>
            <th class="px-2 py-1 text-left">What to cover</th>
            <th class="px-2 py-1 text-left">Frontend signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>S - Situation</strong></td>
            <td>Context in one sentence: product, users, constraint, and urgency.</td>
            <td>Anchor the story in a real UI, platform, or delivery problem.</td>
          </tr>
          <tr>
            <td><strong>T - Task</strong></td>
            <td>Your responsibility and the success metric.</td>
            <td>Clarify scope: owner, contributor, reviewer, incident lead, or cross-team coordinator.</td>
          </tr>
          <tr>
            <td><strong>A - Action</strong></td>
            <td>Three to five actions: decisions, trade-offs, collaboration, and validation.</td>
            <td>Show the technical lever: a11y checks, perf telemetry, feature flags, API alignment, test plan.</td>
          </tr>
          <tr>
            <td><strong>R - Result</strong></td>
            <td>Outcome with numbers and what changed next.</td>
            <td>Use measurable impact: faster load, fewer errors, safer rollout, better conversion, fewer tickets.</td>
          </tr>
          <tr>
            <td><strong>R - Reflection</strong></td>
            <td>One thing you would repeat and one thing you changed afterward.</td>
            <td>Shows seniority: you improved the process, not just the feature.</td>
          </tr>
        </tbody>
      </table>

      <h2>Weak vs strong answer example</h2>
      <p>
        Prompt: <strong>Tell me about a time you disagreed with design or product on a frontend decision.</strong>
      </p>
      <table class="table-auto border border-neutral-700 mt-4 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Version</th>
            <th class="px-2 py-1 text-left">Answer shape</th>
            <th class="px-2 py-1 text-left">What the interviewer hears</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Weak</strong></td>
            <td>"Design wanted something that was not accessible, so I pushed back and we fixed it."</td>
            <td>Correct instinct, but vague. No context, no trade-off, no collaboration, no evidence.</td>
          </tr>
          <tr>
            <td><strong>Good</strong></td>
            <td>"A modal design missed focus trapping and keyboard escape. I explained the issue, paired with design, and shipped an accessible variant."</td>
            <td>Clear frontend signal and teamwork, but still light on constraints, alternatives, and result.</td>
          </tr>
          <tr>
            <td><strong>Strong</strong></td>
            <td>
              "On checkout, the proposed promo modal looked clean but trapped screen-reader users behind the overlay.
              I owned the frontend implementation, so I brought a keyboard demo, offered two options, and recommended the
              lower-risk pattern that reused our dialog primitive. We shipped on time, closed four a11y findings, and added
              a checklist item to design review. I should have flagged it one review earlier, so I now ask for keyboard flow
              during first design pass."
            </td>
            <td>Specific, measurable, collaborative, trade-off aware, and reflective.</td>
          </tr>
        </tbody>
      </table>

      <h2>Frontend behavioral story examples</h2>
      <div class="grid grid-cols-1 gap-4 mt-2">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <h3>1. Performance regression under pressure</h3>
          <p><strong>Prompt:</strong> Tell me about a time you improved a slow user experience.</p>
          <p><strong>Scoring signal:</strong> ownership, measurement, technical judgment, and product trade-offs.</p>
          <p><strong>STAR(R) outline:</strong> A key route regressed after a launch; you owned triage, profiled bundle and render cost, split non-critical code, coordinated rollout with PM, and verified Core Web Vitals recovery.</p>
          <p><strong>What to quantify:</strong> LCP/INP change, bundle KB removed, affected sessions, conversion or drop-off movement.</p>
          <p><strong>Follow-up risk:</strong> Be ready to explain how you knew the fix was causal, not just correlated.</p>
        </div>

        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <h3>2. Accessibility disagreement</h3>
          <p><strong>Prompt:</strong> Tell me about a time you had to influence a decision without authority.</p>
          <p><strong>Scoring signal:</strong> collaboration, user advocacy, principled judgment, and pragmatism.</p>
          <p><strong>STAR(R) outline:</strong> A proposed interaction failed keyboard or screen-reader checks; you demonstrated the issue, framed risk without blame, offered a lower-cost alternative, and added an a11y review step.</p>
          <p><strong>What to quantify:</strong> audit findings closed, components reused, release delay avoided, defects prevented.</p>
          <p><strong>Follow-up risk:</strong> Avoid sounding like design was wrong; show how you protected both UX and delivery.</p>
        </div>

        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <h3>3. Incident rollback and root cause</h3>
          <p><strong>Prompt:</strong> Tell me about a mistake or production incident.</p>
          <p><strong>Scoring signal:</strong> accountability, calm execution, risk reduction, and learning.</p>
          <p><strong>STAR(R) outline:</strong> A frontend release caused a broken purchase path; you helped scope blast radius, used feature flags or rollback, communicated status, wrote the root cause, and added tests or monitoring.</p>
          <p><strong>What to quantify:</strong> minutes to rollback, users affected, error rate, test coverage, monitoring alert added.</p>
          <p><strong>Follow-up risk:</strong> Do not over-defend the mistake; emphasize what changed in the system afterward.</p>
        </div>

        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <h3>4. Back-end/API contract conflict</h3>
          <p><strong>Prompt:</strong> Tell me about a cross-team conflict and how you resolved it.</p>
          <p><strong>Scoring signal:</strong> stakeholder alignment, systems thinking, communication, and delivery ownership.</p>
          <p><strong>STAR(R) outline:</strong> The UI needed pagination, partial loading, or stable error codes; the API shape did not support it. You proposed a contract, agreed on fallback behavior, documented edge cases, and shipped incrementally.</p>
          <p><strong>What to quantify:</strong> blocked days avoided, defects reduced, API endpoints clarified, load/error states covered.</p>
          <p><strong>Follow-up risk:</strong> Be explicit about what you compromised on and why it was acceptable.</p>
        </div>

        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <h3>5. Ambiguous PM/design scope</h3>
          <p><strong>Prompt:</strong> Tell me about a time you brought clarity to an ambiguous project.</p>
          <p><strong>Scoring signal:</strong> product judgment, prioritization, communication, and leadership potential.</p>
          <p><strong>STAR(R) outline:</strong> Requirements were broad; you mapped user flows, named unknowns, created a thin-slice milestone, aligned success metrics, and reduced rework before implementation.</p>
          <p><strong>What to quantify:</strong> scope reduced, milestone hit, rework avoided, user funnel improved, experiment result.</p>
          <p><strong>Follow-up risk:</strong> Show how you balanced discovery with delivery instead of creating process overhead.</p>
        </div>
      </div>

      <h2>Rubric: weak, good, strong</h2>
      <table class="table-auto border border-neutral-700 mt-4 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Signal</th>
            <th class="px-2 py-1 text-left">Weak</th>
            <th class="px-2 py-1 text-left">Good</th>
            <th class="px-2 py-1 text-left">Strong</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Clarity</strong></td>
            <td>Long setup, unclear role.</td>
            <td>Clear STAR with basic context.</td>
            <td>60-90 second story with role, constraint, and decision point obvious.</td>
          </tr>
          <tr>
            <td><strong>Impact</strong></td>
            <td>"It went well."</td>
            <td>Names outcome but little evidence.</td>
            <td>Uses metrics, user effect, risk reduction, or team velocity change.</td>
          </tr>
          <tr>
            <td><strong>Judgment</strong></td>
            <td>Only says what happened.</td>
            <td>Mentions one trade-off.</td>
            <td>Compares options, names risk, and explains why the chosen path fit the moment.</td>
          </tr>
          <tr>
            <td><strong>Collaboration</strong></td>
            <td>Blames another team.</td>
            <td>Shows coordination.</td>
            <td>Shows influence, shared ownership, and how disagreement became alignment.</td>
          </tr>
          <tr>
            <td><strong>Growth</strong></td>
            <td>No reflection.</td>
            <td>Names a lesson.</td>
            <td>Shows a behavior or process changed after the story.</td>
          </tr>
        </tbody>
      </table>

      <h2>Common pitfalls and fixes</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>Rambling.</strong>
          <p class="text-sm">Fix: cap each STAR(R) section to one or two sentences; keep a clock in mind.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>Generic claims.</strong>
          <p class="text-sm">Fix: replace adjectives with numbers and artifacts: dashboards, PRs, docs, alerts, checklists.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>All "I", no team.</strong>
          <p class="text-sm">Fix: show your personal contribution and how you coordinated with others.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>No trade-offs.</strong>
          <p class="text-sm">Fix: state at least two options and why one won under the constraints.</p>
        </div>
      </div>

      <h2>20-minute tune-up before any interview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">1</div>
          <div>
            <div class="font-semibold">Skim the role</div>
            <p class="text-sm opacity-90">Highlight <strong>3 competencies</strong> likely to be tested.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">2</div>
          <div>
            <div class="font-semibold">Map stories 1:1</div>
            <p class="text-sm opacity-90">Pick <strong>4 stories</strong> from your bank that cover those competencies.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">3</div>
          <div>
            <div class="font-semibold">One-line STAR(R)</div>
            <p class="text-sm opacity-90">Draft a <strong>single sentence</strong> version of each story and say it once.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">4</div>
          <div>
            <div class="font-semibold">Smart questions</div>
            <p class="text-sm opacity-90">Prepare <strong>2 questions</strong> about delivery, testing, accessibility, metrics, or team rituals.</p>
          </div>
        </div>
      </div>

      <h2>Practice next</h2>
      <p>
        Continue with the <a [routerLink]="['/guides','behavioral','prep']">behavioral interview prep plan</a>,
        then turn raw projects into <a [routerLink]="['/guides','behavioral','stories']">STAR stories for frontend engineers</a>.
        Use <a [routerLink]="['/guides','behavioral','common-questions']">common behavioral interview questions</a>
        for prompt coverage, <a [routerLink]="['/guides','behavioral','fe-advanced']">frontend behavioral interview scenarios</a>
        for technical prompts, <a [routerLink]="['/guides','behavioral','practical-tips']">behavioral interview tips</a>
        for delivery mistakes, and the <a [routerLink]="['/guides','behavioral','checklist']">behavioral interview checklist</a>
        before the call.
      </p>

      <h2>FAQ</h2>
      <h3>What frontend behavioral interview questions should I practice?</h3>
      <p>
        Practice questions about performance, accessibility, incidents, API contracts, ambiguous requirements,
        design disagreements, mentoring, feedback, deadlines, and cross-functional launches.
      </p>

      <h3>How do frontend engineers prepare for behavioral interviews?</h3>
      <p>
        Prepare four to six frontend stories that cover collaboration, ownership, ambiguity, incidents, accessibility,
        performance, and delivery trade-offs. Shape each story with STAR(R), add one metric, and practice a 60-90 second version.
      </p>

      <h3>What STAR stories should frontend engineers prepare?</h3>
      <p>
        Prepare stories about a performance win, accessibility push, incident or rollback, API contract conflict,
        ambiguous product scope, mentoring moment, and cross-functional disagreement.
      </p>

      <h3>How long should a behavioral answer be?</h3>
      <p>
        Most answers should land around 60-90 seconds. Use the first half for context and actions, then spend the rest on
        result, trade-off, and reflection.
      </p>
    </fa-guide-shell>
  `,
})
export class BehavioralIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
