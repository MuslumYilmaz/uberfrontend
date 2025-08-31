import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <uf-guide-shell
      title="System Design Interviews: An Introduction"
      [minutes]="10"
      [tags]="['system design','overview']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>What to expect in system design interviews and how to approach them.</p>

      <h2>What is evaluated</h2>
      <p>Communication, trade-offs, constraints, scalability and reliability thinking.</p>

      <h2>How to structure the session</h2>
      <h3>Clarify requirements</h3>
      <p>Users, scale, reads vs writes, SLAs.</p>
      <h3>Define constraints</h3>
      <p>Latency targets, data size, QPS, consistency/availability preferences.</p>

      <h2>High-level architecture</h2>
      <p>Sketch core components and data flow before drilling into details.</p>
    </uf-guide-shell>
  `,
})
export class SystemDesignIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
