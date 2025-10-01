import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    selector: 'app-behavioral-prep-article',
    imports: [CommonModule, RouterModule, GuideShellComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <uf-guide-shell
        title="How to Prepare (Fast and Effectively)"
        [minutes]="20"
        [tags]="['behavioral','prep','stories']"
        [prev]="prev"
        [next]="next"
        [leftNav]="leftNav">

        <p>
            Most people treat behavioral prep as an afterthought. They focus on LeetCode,
            then cram a few stories the night before. The result? Answers that ramble,
            sound generic, and leave the interviewer guessing. The good news is you don’t
            need weeks of rehearsal. What you need is a <strong>story bank</strong>, a
            simple framework like STAR, and practice that feels natural.
        </p>

        <h2>Step 1: Build your story bank</h2>
        <p>
            Think of your story bank as a personal “highlight reel.” It’s a collection of
            8–10 moments from your career you can pull out on demand. Not just the shiny wins,
            but also the tough calls and lessons learned.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">Collect raw material</div>
            <p class="text-sm opacity-90">
                Write down projects, incidents, and moments you’re proud of—or even embarrassed by.
                Launching a feature under pressure. Debugging a production fire at midnight.
                Mentoring a new teammate. The point is to capture the raw material before
                polishing it into answers.
            </p>
            </div>
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">Cover all pillars</div>
            <p class="text-sm opacity-90">
                Make sure your stories cover <em>communication, collaboration, ownership,
                growth, and leadership</em>. If all your examples are “I fixed this bug,”
                you’ll look one-dimensional. Balance success with failure, teamwork with
                individual grit.
            </p>
            </div>
        </div>
        <p class="mt-2 text-sm opacity-80">
            ⚠️ Mistake to avoid: only bringing “success stories.” Interviewers want to see
            how you bounce back when things don’t go your way.
        </p>

        <h2>Step 2: Structure with STAR (without being robotic)</h2>
        <p>
            The STAR method (Situation → Task → Action → Result) keeps you from rambling.
            But too many candidates turn it into a script. The trick is to keep each part
            to 1–2 sentences, then <em>talk like a human</em>.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">Weak example</div>
            <p class="text-sm opacity-90">
                “So, uh, we had this project. I was kind of in charge, and we tried some stuff…
                eventually it worked out okay.” <br />
                → No numbers, no clarity, no confidence.
            </p>
            </div>
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">High-signal example</div>
            <p class="text-sm opacity-90">
                “Checkout page had 18s load time, users were dropping. I owned performance
                and cut bundle size by 200kb, lazy-loaded reviews, and partnered with design.
                LCP dropped to 2.8s, revenue +12%, and our checklist became team standard.”
            </p>
            </div>
        </div>

        <h2>Step 3: Practice without sounding rehearsed</h2>
        <p>
            Practicing doesn’t mean memorizing. The goal is <em>fluidity</em>, not
            perfection. If you sound like you’re reading a teleprompter, you lose trust.
        </p>
        <ul class="list-disc list-inside mt-2 space-y-2">
            <li><strong>Say it out loud:</strong> A story in your head feels shorter than when spoken. Time yourself to ~90 seconds.</li>
            <li><strong>Record & listen:</strong> Use voice notes or Loom. Hearing yourself exposes filler words and tangents.</li>
            <li><strong>Deliberate variation:</strong> Tell the same story twice, once highlighting collaboration, once ownership. Shows flexibility.</li>
            <li><strong>Mock interview:</strong> Ask a friend to interrupt you with “what was the trade-off?” so you learn to adjust on the fly.</li>
        </ul>
        <p class="mt-2 text-sm opacity-80">
            ⚠️ Mistake to avoid: rehearsing until you sound robotic. A natural pause beats
            a memorized monologue.
        </p>

        <h2>Step 4: Prepare smart questions for them</h2>
        <p>
            Interviews are a two-way street. When you ask thoughtful questions, you
            signal curiosity and long-term thinking. Bad questions make you forgettable;
            good ones make you look like a peer.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">Low-signal questions</div>
            <ul class="list-disc list-inside text-sm opacity-90 space-y-1">
                <li>“What do you like about the company?”</li>
                <li>“What’s the vacation policy?”</li>
            </ul>
            </div>
            <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div class="font-semibold">High-signal questions</div>
            <ul class="list-disc list-inside text-sm opacity-90 space-y-1">
                <li>“How does this team handle trade-offs between design polish and delivery speed?”</li>
                <li>“What metrics do you track to know if a release succeeded?”</li>
                <li>“How do engineers here share knowledge across teams?”</li>
            </ul>
            </div>
        </div>

        <h2>Quick prep routine (30 minutes the night before)</h2>
        <p>
            Imagine tomorrow’s interview is at 10am. Here’s what you do at 9pm tonight:
        </p>
        <ol class="list-decimal list-inside space-y-1 mt-2">
            <li>Skim the JD, highlight 3 likely signals (e.g., collaboration, ownership, leadership).</li>
            <li>Pick 4 stories from your bank that map to those signals.</li>
            <li>Write one-line STAR notes for each on sticky notes.</li>
            <li>Say them out loud once—don’t over-rehearse.</li>
            <li>Review your 2–3 high-signal questions for them.</li>
        </ol>

        <h2>Pro tip</h2>
        <blockquote>
            The goal isn’t to sound like a TED speaker—it’s to show
            <em>clear thinking under pressure</em>. Short, specific, human answers win.
        </blockquote>
        </uf-guide-shell>
  `,
})
export class BehavioralPrepArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
