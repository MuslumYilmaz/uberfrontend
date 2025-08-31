import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, GuideShellComponent],
    template: `
    <uf-guide-shell
      title="Foundations & Constraints"
      [minutes]="14"
      [tags]="['system design','foundations','constraints']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>Before drawing boxes and arrows, lock in requirements and constraints.</p>

      <h2>Clarify the problem</h2>
      <h3>Users & actions</h3>
      <p>Primary personas, operations, critical flows.</p>

      <h2>Scale assumptions</h2>
      <h3>Traffic model</h3>
      <p>QPS, burstiness, regions.</p>

      <h2>Key constraints</h2>
      <h3>Latency budgets</h3>
      <p>p95/p99 targets; tail behavior.</p>
    </uf-guide-shell>
  `,
})
export class SystemDesignFoundationsArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
