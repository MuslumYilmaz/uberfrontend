import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-checklist-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <uf-guide-shell
      title="Final Checklist"
      [minutes]="8"
      [tags]="['behavioral','checklist','prep']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Think of this as your pre-flight checklist. Five minutes before the interview,
        run through this list to center yourself and avoid last-minute panic.
      </p>

      <h2>1. Story bank</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>5–8 STAR stories ready (conflict, mistake, leadership, pressure, ambiguity, impact).</li>
        <li>Each tagged with at least two signals (e.g. ownership + collaboration).</li>
        <li>90–120 seconds per story, practiced out loud.</li>
      </ul>

      <h2>2. Company research</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>Know their product: sign up, click around, feel the pain points.</li>
        <li>Know their users: consumer vs enterprise, global vs local.</li>
        <li>Know their stack (check job description, engineering blog, LinkedIn posts).</li>
        <li>Prep 1 insight: “I noticed X in your product; curious how the team thinks about Y.”</li>
      </ul>

      <h2>3. Questions to ask</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>“How does this team measure success?”</li>
        <li>“What does growth look like for engineers here?”</li>
        <li>“What’s one challenge the team is facing right now?”</li>
      </ul>

      <h2>4. Tech & setup</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>Stable internet, charged laptop, quiet space.</li>
        <li>Zoom/Meet tested, notifications muted.</li>
        <li>STAR notes open in a small doc for quick glance.</li>
      </ul>

      <h2>Pro tip</h2>
      <blockquote>
        Treat yourself like an athlete on game day. Warm up your voice, hydrate,
        and walk in with 2–3 strong stories top of mind. Everything else flows.
      </blockquote>
    </uf-guide-shell>
  `,
})
export class BehavioralChecklistArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
