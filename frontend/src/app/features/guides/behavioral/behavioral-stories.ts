import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    selector: 'app-behavioral-stories-article',
    imports: [CommonModule, RouterModule, GuideShellComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <fa-guide-shell
      title="Crafting STAR Stories"
      [minutes]="18"
      [tags]="['behavioral','stories','STAR']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Stories are the currency of behavioral interviews. Anyone can say “I’m a good collaborator,”
        but interviewers believe it when they hear a clear, concrete example. This is where the
        <strong>STAR method</strong> comes in: Situation, Task, Action, Result. But to stand out,
        you’ll need more than a formula—you’ll need stories that feel alive, authentic, and memorable.
      </p>

      <h2>Why stories work</h2>
      <p>
        Humans remember narratives, not bullet points. When you tell a story, you’re not just
        transferring facts; you’re giving the interviewer a mental movie of you in action.
        A strong story makes it easy for them to retell later in a hiring debrief: <em>“This candidate
        cut page load by 30% during a crunch and got design and QA aligned in 24 hours.”</em>
      </p>

      <h2>The STAR framework (done right)</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Situation</div>
          <p class="text-sm opacity-90">Set the scene quickly: product, users, constraint. <em>“The analytics dashboard was crashing during peak hours.”</em></p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Task</div>
          <p class="text-sm opacity-90">Your role and the success metric. <em>“As the on‑call engineer, I had to restore stability within 48 hours.”</em></p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Action</div>
          <p class="text-sm opacity-90">3–5 key moves, plus a trade‑off. <em>“I traced a memory leak, disabled a non‑critical widget, and coordinated a hotfix rollout. We chose stability over new features.”</em></p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Result + Reflection</div>
          <p class="text-sm opacity-90">Quantify the outcome and show growth. <em>“Downtime dropped 95%, we regained user trust, and I later added monitoring to prevent repeats.”</em></p>
        </div>
      </div>

      <h2>Adding color without rambling</h2>
      <p>
        The best stories feel vivid but stay under two minutes. You can add color with small, human details:
      </p>
      <ul class="list-disc list-inside space-y-1">
        <li>“It was 2am, and our Slack was on fire with angry PMs.”</li>
        <li>“Design wanted a full re‑skin, but we only had 5 days.”</li>
        <li>“We saw drop‑offs at the payment step, users were literally tweeting complaints.”</li>
      </ul>
      <p class="mt-2 text-sm opacity-80">These touches make the story stick, but always tie back to the core signal (ownership, judgment, teamwork).</p>

      <h2>Common pitfalls to avoid</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Rambling</div>
          <p class="text-sm opacity-90">Going on for 5 minutes without a clear point. Fix: practice trimming to 90s.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Too generic</div>
          <p class="text-sm opacity-90">“I communicated with the team.” → Weak. Add specifics: how, when, what changed?</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">No numbers</div>
          <p class="text-sm opacity-90">Impact is forgettable without metrics. Even rough numbers (“~20% faster”) are better than none.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Hero complex</div>
          <p class="text-sm opacity-90">Claiming you did everything alone. Show collaboration—interviewers know real projects aren’t solo acts.</p>
        </div>
      </div>

      <h2>Practicing STAR the smart way</h2>
      <p>
        Don’t memorize paragraphs. Instead, keep <strong>bullet prompts</strong> (S/T/A/R) for each story.
        Example:
      </p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <code>S:</code> Mobile checkout crashing on iOS 14<br/>
        <code>T:</code> Stabilize before holiday traffic<br/>
        <code>A:</code> Debug crash logs, patch WebView bug, pair with QA<br/>
        <code>R:</code> Crash rate –70%, +15% conversion, QA added case to regression suite
      </div>
      <p class="mt-2 text-sm opacity-80">This way, you stay natural while still hitting the important beats.</p>

      <h2>Pro tip</h2>
        <ul class="list-disc list-inside space-y-2 mt-2">
            <li><strong>Outage recovery:</strong> “API went down for 40 minutes. I coordinated rollback, added monitoring, and documented the fix. Next time, I’d add circuit breakers earlier.”</li>
            <li><strong>Design trade‑off:</strong> “PM wanted pixel‑perfect animations, but page weight spiked. I proposed lighter transitions. Users got smooth interactions, and we shipped on time.”</li>
            <li><strong>Mentorship win:</strong> “Junior struggled with async JS. I paired, explained promises vs callbacks, and helped them land the PR. Later, I ran a team session so everyone leveled up.”</li>
        </ul>
    </fa-guide-shell>
  `,
})
export class BehavioralStoriesArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}