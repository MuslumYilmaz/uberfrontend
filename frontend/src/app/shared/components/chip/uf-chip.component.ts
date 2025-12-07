import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Params, RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'uf-chip',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <ng-container [ngSwitch]="!!routerLink">
      <a *ngSwitchCase="true"
         class="uf-chip"
         routerLinkActive="is-active"
         #rla="routerLinkActive"
         [routerLinkActiveOptions]="routerLinkActiveOptions || { exact: false }"
         [ngClass]="chipClasses"
         [class.uf-chip--selected]="selected || rla?.isActive"
         [routerLink]="routerLink"
         [queryParams]="queryParams"
         [fragment]="fragment"
         [attr.aria-disabled]="disabled || null"
         [attr.aria-pressed]="toggle ? (selected || rla?.isActive) : null"
         [attr.tabindex]="disabled ? -1 : 0"
         (click)="handleClick($event)">
        <span class="uf-chip__content">
          <ng-container *ngIf="label !== undefined && label !== null && label !== ''; else projected">
            {{ label }}
          </ng-container>
          <ng-template #projected>
            <ng-content></ng-content>
          </ng-template>
        </span>
      </a>

      <button *ngSwitchDefault
              type="button"
              class="uf-chip"
              [ngClass]="chipClasses"
              [disabled]="disabled"
              [attr.aria-pressed]="toggle ? selected : null"
              (click)="handleClick($event)">
        <span class="uf-chip__content">
          <ng-container *ngIf="label !== undefined && label !== null && label !== ''; else projectedBtn">
            {{ label }}
          </ng-container>
          <ng-template #projectedBtn>
            <ng-content></ng-content>
          </ng-template>
        </span>
      </button>
    </ng-container>
  `,
  styleUrls: ['./uf-chip.component.css']
})
export class UfChipComponent {
  @Input() label?: string;
  @Input() variant: 'filled' | 'outline' = 'outline';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() selected = false;
  @Input() disabled = false;
  @Input() toggle = true;

  @Input() routerLink?: string | any[] | null;
  @Input() queryParams?: Params | null;
  @Input() fragment?: string | undefined;
  @Input() routerLinkActiveOptions?: RouterLinkActive['routerLinkActiveOptions'];

  @Output() selectedChange = new EventEmitter<boolean>();
  @Output() chipClick = new EventEmitter<Event>();

  get chipClasses() {
    return {
      'uf-chip--filled': this.variant === 'filled',
      'uf-chip--outline': this.variant === 'outline',
      'uf-chip--selected': this.selected,
      'uf-chip--disabled': this.disabled,
      'uf-chip--sm': this.size === 'sm',
      'uf-chip--md': this.size === 'md',
    };
  }

  handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.chipClick.emit(event);

    // Toggle behaviour is opt-in for navigation links.
    if (this.toggle && !this.routerLink) {
      this.selectedChange.emit(!this.selected);
    } else if (this.toggle) {
      this.selectedChange.emit(this.selected);
    }
  }
}
