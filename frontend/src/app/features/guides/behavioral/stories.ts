import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, GuideShellComponent],
    template: `
    <uf-guide-shell
      title="Crafting STAR Stories"
      [minutes]="14"
      [tags]="['behavioral','stories','STAR']"
      [prev]="prev" [next]="next" [leftNav]="leftNav">

      <p>Turn raw experiences into concise, high-signal stories.</p>

      <h2>Framework</h2>
      <h3>Situation</h3>
      <p>One-line context and constraints.</p>
      <h3>Task</h3>
      <p>Your responsibility and the success criteria.</p>
      <h3>Action</h3>
      <p>Decisions, trade-offs, and why you chose them.</p>
      <h3>Result</h3>
      <p>Metrics, impact, and what you’d do differently.</p>

      <h2>Tips</h2>
      <p>Lead with impact, quantify, and pre-empt follow-ups with specifics.</p>
    </uf-guide-shell>
  `
})
export class BehavioralStoriesArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
