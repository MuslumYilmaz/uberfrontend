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
        <h2 class="locked-preview-rich__title">Challenge preview</h2>
        <p class="locked-preview-rich__text">{{ data.what }}</p>
      </section>

      <section class="locked-preview-rich__section" *ngIf="unlockBullets().length">
        <h2 class="locked-preview-rich__title">Premium unlocks</h2>
        <ul class="locked-preview-rich__list">
          <li *ngFor="let item of unlockBullets()">{{ item }}</li>
        </ul>
      </section>

      <section class="locked-preview-rich__section locked-preview-rich__section--secondary" *ngIf="freeRelated().length">
        <h2 class="locked-preview-rich__title">Free warm-up options</h2>
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

  unlockBullets(): string[] {
    const bullets = this.data?.unlockBullets?.length
      ? this.data.unlockBullets
      : this.data?.learningGoals || [];
    return bullets.slice(0, 3);
  }

  freeRelated(): LockedPreviewLink[] {
    return (this.data?.related || []).filter((item) => !item.premium).slice(0, 4);
  }
}
