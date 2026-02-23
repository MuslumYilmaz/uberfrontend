import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'fa-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="fa-field" [class.fa-field--error]="!!error" [class.fa-field--disabled]="disabled">
      <span class="fa-field__head" *ngIf="label || hint || error">
        <span class="fa-field__label" *ngIf="label">
          {{ label }}<span *ngIf="required" aria-hidden="true"> *</span>
        </span>
        <span class="fa-field__hint" *ngIf="hint && !error">{{ hint }}</span>
        <span class="fa-field__error" *ngIf="error">{{ error }}</span>
      </span>

      <span class="fa-field__control">
        <ng-content></ng-content>
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaFieldComponent {
  @Input() label?: string;
  @Input() hint?: string;
  @Input() error?: string | null;
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) disabled = false;
}
