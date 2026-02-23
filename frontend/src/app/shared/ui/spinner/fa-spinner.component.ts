import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'fa-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <span class="fa-spinner" role="status" [attr.aria-label]="label || 'Loading'">
      <p-progressSpinner
        [style]="{ width: size, height: size }"
        [strokeWidth]="strokeWidth"
        [animationDuration]="animationDuration"
        [styleClass]="spinnerClass">
      </p-progressSpinner>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaSpinnerComponent {
  @Input() size = '2rem';
  @Input() strokeWidth = '4';
  @Input() animationDuration = '.8s';
  @Input() styleClass = '';
  @Input() label = '';

  get spinnerClass(): string {
    const extra = this.styleClass?.trim();
    return extra ? `fa-spinner__inner ${extra}` : 'fa-spinner__inner';
  }
}
