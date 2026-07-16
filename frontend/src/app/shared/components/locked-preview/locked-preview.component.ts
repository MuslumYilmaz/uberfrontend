import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LockedPreviewData, LockedPreviewLink } from '../../../core/utils/locked-preview.util';

@Component({
  selector: 'app-locked-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="locked-preview-rich" data-testid="premium-preview-rich">
      <section class="locked-preview-rich__section">
        <h2 class="locked-preview-rich__title">Challenge summary</h2>
        <p class="locked-preview-rich__text" data-testid="premium-preview-summary">{{ data.what }}</p>
      </section>

      <section class="locked-preview-rich__section" *ngIf="learningOutcomes().length">
        <h2 class="locked-preview-rich__title">What you'll practice</h2>
        <ul class="locked-preview-rich__list" data-testid="premium-preview-outcomes">
          <li *ngFor="let item of learningOutcomes()">{{ item }}</li>
        </ul>
      </section>

      <section class="locked-preview-rich__section">
        <h2 class="locked-preview-rich__title">What Premium unlocks</h2>
        <p class="locked-preview-rich__text" data-testid="premium-preview-unlock">{{ data.unlockDescription }}</p>
      </section>

      <section class="locked-preview-rich__section locked-preview-rich__section--secondary" *ngIf="freeRelated().length">
        <h2 class="locked-preview-rich__title">Free related practice</h2>
        <ul class="locked-preview-rich__links">
          <li *ngFor="let item of freeRelated()">
            <a [routerLink]="item.to">
              <span>{{ item.title }}</span>
              <span class="locked-preview-rich__pill locked-preview-rich__pill--free">Free</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  `,
  styleUrls: ['./locked-preview.component.css'],
})
export class LockedPreviewComponent {
  @Input({ required: true }) data!: LockedPreviewData;

  learningOutcomes(): string[] {
    return (this.data?.learningGoals || []).slice(0, 5);
  }

  freeRelated(): LockedPreviewLink[] {
    return (this.data?.related || []).filter((item) => !item.premium).slice(0, 4);
  }
}
