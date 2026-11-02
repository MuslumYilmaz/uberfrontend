import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

// PrimeNG 20+ passes an unset autofocus straight to pAutoFocus, which writes
// autofocus="true" for anything but false. In prerendered HTML the browser obeys
// it on load and scrolls the page to the control, so it is always set to false here.
@Component({
    selector: 'fa-select',
    imports: [CommonModule, FormsModule, SelectModule, MultiSelectModule],
    template: `
    <ng-container *ngIf="multiple; else singleSelect">
      <p-multiSelect
        #multiSelect
        [autofocus]="false"
        [options]="options"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        [optionLabel]="optionLabel"
        [optionValue]="optionValue"
        [disabled]="disabled"
        [filter]="filter"
        [autofocusFilter]="filter"
        [showToggleAll]="showToggleAll"
        [appendTo]="appendTo"
        [placeholder]="placeholder"
        [inputId]="inputId"
        [ariaLabel]="ariaLabel"
        [ariaLabelledBy]="ariaLabelledBy"
        [ariaFilterLabel]="ariaFilterLabel"
        [styleClass]="resolvedStyleClass"
        [panelStyleClass]="resolvedPanelClass">
        <ng-template #header>
          <button type="button" class="fa-select-panel__close" aria-label="Close options" (click)="$event.stopPropagation(); multiSelect.hide(true)">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </ng-template>
      </p-multiSelect>
    </ng-container>

    <ng-template #singleSelect>
      <p-select
        [autofocus]="false"
        [options]="options"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        [optionLabel]="optionLabel"
        [optionValue]="optionValue"
        [disabled]="disabled"
        [filter]="filter"
        [appendTo]="appendTo"
        [placeholder]="placeholder"
        [inputId]="inputId"
        [ariaLabel]="ariaLabel"
        [ariaLabelledBy]="ariaLabelledBy"
        [ariaFilterLabel]="ariaFilterLabel"
        [styleClass]="resolvedStyleClass"
        [panelStyleClass]="resolvedPanelClass">
      </p-select>
    </ng-template>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaSelectComponent {
  @Input() options: any[] = [];
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();

  @Input({ transform: booleanAttribute }) multiple = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) filter = false;
  @Input({ transform: booleanAttribute }) showToggleAll = true;

  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  @Input() placeholder = 'Select';
  @Input() inputId: string | undefined;
  @Input() ariaLabel: string | undefined;
  @Input() ariaLabelledBy: string | undefined;
  @Input() ariaFilterLabel: string | undefined;
  @Input() appendTo: any = 'body';
  @Input() styleClass = '';
  @Input() panelStyleClass = '';

  get resolvedStyleClass(): string {
    const extra = this.styleClass?.trim();
    return extra ? `fa-select ${extra}` : 'fa-select';
  }

  get resolvedPanelClass(): string {
    const extra = this.panelStyleClass?.trim();
    return extra ? `fa-select-panel ${extra}` : 'fa-select-panel';
  }
}
