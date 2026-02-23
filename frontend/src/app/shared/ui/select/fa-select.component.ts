import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'fa-select',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, MultiSelectModule],
  template: `
    <ng-container *ngIf="multiple; else singleSelect">
      <p-multiSelect
        [options]="options"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        [optionLabel]="optionLabel"
        [optionValue]="optionValue"
        [disabled]="disabled"
        [filter]="filter"
        [showToggleAll]="showToggleAll"
        [appendTo]="appendTo"
        [placeholder]="placeholder"
        [styleClass]="resolvedStyleClass"
        [panelStyleClass]="resolvedPanelClass">
      </p-multiSelect>
    </ng-container>

    <ng-template #singleSelect>
      <p-dropdown
        [options]="options"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        [optionLabel]="optionLabel"
        [optionValue]="optionValue"
        [disabled]="disabled"
        [filter]="filter"
        [appendTo]="appendTo"
        [placeholder]="placeholder"
        [styleClass]="resolvedStyleClass"
        [panelStyleClass]="resolvedPanelClass">
      </p-dropdown>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
