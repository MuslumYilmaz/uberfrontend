import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, GuideShellComponent],
    template: `
    <uf-guide-shell
      title="Behavioral Interviews: An Introduction"
      [minutes]="12"
      [tags]="['behavioral','overview']"
      [prev]="prev" [next]="next" [leftNav]="leftNav">

      <p>How behavioral rounds are evaluated and how to prepare succinct stories.</p>

      <h2>What interviewers evaluate</h2>
      <p>Ownership, collaboration, impact, leadership, and learning from failures.</p>

      <h2>How to prepare</h2>
      <h3>Collect raw material</h3>
      <p>List high-impact projects, conflicts, outages, and cross-team work.</p>
      <h3>Map to signals</h3>
      <p>Align each story to 1–2 core signals (e.g., ownership, customer focus).</p>
    </uf-guide-shell>
  `
})
export class BehavioralIntroArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
