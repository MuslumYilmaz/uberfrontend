import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    selector: 'app-behavioral-questions-article',
    imports: [CommonModule, RouterModule, GuideShellComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <fa-guide-shell
      title="Common Behavioral Questions (and How to Nail Them)"
      [minutes]="20"
      [tags]="['behavioral','questions','prep']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Behavioral interviews don’t come with surprises—you’ll see the same patterns across companies.
        The trick is to recognize what signal is really being tested and have a ready story that fits.
        Below are the most common question themes, what they actually mean, and how to answer without rambling.
      </p>

      <h2>1. Conflict & disagreement</h2>
      <p><em>“Tell me about a time you disagreed with a teammate or manager.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Collaboration + communication. Can you disagree respectfully and reach alignment?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “In a planning session for a new analytics dashboard, our tech lead wanted to use a third-party charting library that I felt didn’t meet accessibility standards. Rather than flatly opposing it, I asked questions about why that option was preferred and shared a quick demo showing the accessibility gaps I had found. We had an open discussion, and I suggested an alternative that met our criteria and required minimal ramp-up. We aligned on the alternative, and I helped integrate it. Later, the tech lead thanked me for handling the disagreement constructively and helping the team avoid issues down the road.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Show how you framed the problem, listened, and found common ground. End with what changed in the relationship.</p>
      </div>

      <h2>2. Mistakes & failure</h2>
      <p><em>“Tell me about a time you made a mistake.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Growth mindset. Do you own your errors and learn from them?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “In one sprint, I accidentally deleted a shared component used by multiple features while doing a major refactor. It caused several test failures across teams. I immediately acknowledged it, restored the component from Git, and added a CI safeguard to catch future issues. Afterward, I wrote a postmortem and documented refactor guidelines for the team. It was embarrassing, but I learned to validate assumptions more carefully before major changes.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Don’t dodge. Name the mistake clearly, show the fix, and end with how you improved your process afterward.</p>
      </div>

      <h2>3. Leadership moments</h2>
      <p><em>“Describe a time you led without authority.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Leadership potential. Can you influence, mentor, or set standards without a formal title?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “As a mid-level engineer, I noticed our onboarding experience for new devs was inconsistent. Without being asked, I created a shared Notion guide, recorded walkthroughs of our main workflows, and set up an optional buddy system. Over the next six months, we onboarded three new hires, all of whom said it helped them feel more confident. The engineering manager later adopted it as the official process.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Highlight mentoring, creating processes, or rallying peers. Keep it about multiplying others, not playing boss.</p>
      </div>

      <h2>4. High pressure & deadlines</h2>
      <p><em>“Give an example of working under a tough deadline.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Ownership + judgment. Can you deliver under pressure without cutting corners recklessly?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “Two days before a major demo to investors, our frontend build started failing due to a versioning issue. I stayed late, isolated the regression to a new library update, and locked dependencies. I also trimmed unnecessary modules to reduce bundle size. We shipped a working build on time, and the CTO praised the fast response. I documented the resolution and set up alerts to catch similar errors early.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Show how you broke down work, prioritized, and still protected quality. Mention trade-offs you consciously made.</p>
      </div>

      <h2>5. Ambiguity & scope setting</h2>
      <p><em>“Tell me about a time requirements were unclear.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Communication + ownership. Do you chase clarity and shape scope instead of waiting passively?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “We were assigned to build a 'custom reporting tool,' but no clear spec was provided. I scheduled a quick workshop with stakeholders to map their needs, translated that into a prioritized list of MVP features, and wireframed two directions. We picked one, iterated quickly, and launched a working prototype in two weeks. The PM later mentioned it was the most efficient scope alignment they’d seen.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Explain how you asked clarifying questions, set guardrails, and delivered a focused MVP.</p>
      </div>

      <h2>6. Impact & results</h2>
      <p><em>“What accomplishment are you most proud of?”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Impact. Can you tie your work to measurable outcomes?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “Last year, I led a performance initiative for our e‑commerce checkout. Pages were taking 18 seconds to load, and customers were abandoning carts. I audited the bundles, removed 200kb of unused code, and worked with design to lazy‑load reviews. Within three weeks, LCP dropped to 2.8s, conversion went up 12%, and revenue rose significantly. I’m proud because it wasn’t just a technical win—it directly improved the business and set a new performance standard for the team.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Go beyond “we shipped X.” Show the numbers: perf gains, adoption, revenue, reduced errors, etc.</p>
      </div>

        <h2>How to practice these</h2>
        <ul class="list-disc list-inside space-y-2 mt-2">
        <li>Write down 5–8 detailed STAR-format stories from your past experience. Focus on the challenge, not just the outcome.</li>
        <li>Practice recording your answers aloud, then listen back and cut rambling sections. Aim for 90 seconds per story.</li>
        <li>Label each story with 2–3 signals (e.g. "ownership", "collaboration") so you can flex them across different questions.</li>
        <li>Mock interview with a peer—or an AI—and ask for feedback on structure, clarity, and delivery.</li>
        <li>Memorize key transitions (“What was broken, what I did, what changed”) so you never lose your thread under pressure.</li>
        </ul>
        
      <h2>Pro tip</h2>
      <blockquote>
        The question is just the surface. Always answer for the <em>signal underneath</em>.
        That’s what gets written in the hiring packet.
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralQuestionsArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
