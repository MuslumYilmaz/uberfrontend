import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { LockedPreviewData, LockedPreviewLink } from '../../../core/utils/locked-preview.util';
import { StripInlineMarkupPipe } from '../../ui/inline-code/strip-inline-markup.pipe';

@Component({
    selector: 'app-locked-preview',
    imports: [CommonModule, RouterModule, StripInlineMarkupPipe],
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
        <!-- The page's primary pricing action, so it sits on the first screen next to what it unlocks. -->
        <div class="locked-preview-rich__cta"><ng-content select="[lockedPreviewCta]"></ng-content></div>
      </section>

      <!-- After the action: above it, a long sample pushes the action off a laptop's first screen. -->
      <section class="locked-preview-rich__section" *ngIf="data.sample as sample" data-testid="premium-preview-sample">
        <h2 class="locked-preview-rich__title">{{ sample.label }}</h2>
        <blockquote class="locked-preview-rich__quote">{{ sample.quote }}</blockquote>
        <p class="locked-preview-rich__text" *ngIf="sample.note">{{ sample.note }}</p>
      </section>

      <section class="locked-preview-rich__section locked-preview-rich__section--secondary" *ngIf="freeRelated().length">
        <h2 class="locked-preview-rich__title">Free related practice</h2>
        <ul class="locked-preview-rich__links">
          <li *ngFor="let item of freeRelated()">
            <a [routerLink]="item.to">
              <span>{{ item.title | stripInlineMarkup }}</span>
              <span class="locked-preview-rich__pill locked-preview-rich__pill--free">Free</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  `,
    styleUrls: ['./locked-preview.component.css']
})
export class LockedPreviewComponent {
  @Input({ required: true }) data!: LockedPreviewData;

  learningOutcomes(): string[] {
    return (this.data?.learningGoals || []).slice(0, 5);
  }

  private readonly progress = inject(UserProgressService);

  /** Up to four free items the viewer has not solved, as related practice is new practice; a route ends in the id. */
  freeRelated(): LockedPreviewLink[] {
    const solved = new Set(this.progress.solvedIds());
    return (this.data?.related || [])
      .filter((item) => !item.premium && !solved.has(String(item.to[item.to.length - 1] ?? '')))
      .slice(0, 4);
  }
}
