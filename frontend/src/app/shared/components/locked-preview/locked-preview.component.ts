import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LockedPreviewData } from '../../../core/utils/locked-preview.util';

@Component({
  selector: 'app-locked-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="locked-preview-rich" data-testid="premium-preview-rich">
      <section class="locked-preview-rich__section">
        <h2 class="locked-preview-rich__title">What you’ll build / What this tests</h2>
        <p class="locked-preview-rich__text">{{ data.what }}</p>
      </section>

      <section class="locked-preview-rich__section" *ngIf="data.learningGoals?.length">
        <h2 class="locked-preview-rich__title">Learning goals</h2>
        <ul class="locked-preview-rich__list">
          <li *ngFor="let item of data.learningGoals">{{ item }}</li>
        </ul>
      </section>

      <section class="locked-preview-rich__section" *ngIf="data.constraints?.length">
        <h2 class="locked-preview-rich__title">Constraints / Requirements</h2>
        <ul class="locked-preview-rich__list">
          <li *ngFor="let item of data.constraints">{{ item }}</li>
        </ul>
      </section>

      <section class="locked-preview-rich__section" *ngIf="data.snippet?.lines?.length">
        <h2 class="locked-preview-rich__title">{{ data.snippet.title }}</h2>
        <pre class="locked-preview-rich__code"><code>{{ data.snippet.lines.join('\n') }}</code></pre>
      </section>

      <section class="locked-preview-rich__section" *ngIf="data.pitfalls?.length">
        <h2 class="locked-preview-rich__title">Common pitfalls</h2>
        <ul class="locked-preview-rich__list">
          <li *ngFor="let item of data.pitfalls">{{ item }}</li>
        </ul>
      </section>

      <section class="locked-preview-rich__section" *ngIf="data.related?.length">
        <h2 class="locked-preview-rich__title">Related questions</h2>
        <ul class="locked-preview-rich__links">
          <li *ngFor="let item of data.related">
            <a [routerLink]="item.to">{{ item.title }}</a>
          </li>
        </ul>
      </section>
    </div>
  `,
  styleUrls: ['./locked-preview.component.css'],
})
export class LockedPreviewComponent {
  @Input({ required: true }) data!: LockedPreviewData;
}
