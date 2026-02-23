import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  booleanAttribute,
} from '@angular/core';

export type FaButtonVariant = 'neutral' | 'primary' | 'ghost' | 'danger';
export type FaButtonSize = 'sm' | 'md' | 'lg';
export type FaButtonIconPosition = 'start' | 'end';

@Component({
  selector: 'button[faButton],a[faButton]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <i *ngIf="icon && iconPosition === 'start'" class="fa-btn__icon" [ngClass]="icon" aria-hidden="true"></i>
    <span class="fa-btn__label"><ng-content></ng-content></span>
    <i *ngIf="icon && iconPosition === 'end'" class="fa-btn__icon" [ngClass]="icon" aria-hidden="true"></i>
    <i *ngIf="loading" class="fa-btn__spinner pi pi-spinner pi-spin" aria-hidden="true"></i>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaButtonComponent {
  @Input() variant: FaButtonVariant = 'neutral';
  @Input() size: FaButtonSize = 'md';
  @Input() icon?: string;
  @Input() iconPosition: FaButtonIconPosition = 'start';
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) block = false;
  @Input({ transform: booleanAttribute }) iconOnly = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  @HostBinding('class.fa-btn')
  readonly baseClass = true;

  @HostBinding('class.fa-btn--primary')
  get isPrimary(): boolean {
    return this.variant === 'primary';
  }

  @HostBinding('class.fa-btn--ghost')
  get isGhost(): boolean {
    return this.variant === 'ghost';
  }

  @HostBinding('class.fa-btn--danger')
  get isDanger(): boolean {
    return this.variant === 'danger';
  }

  @HostBinding('class.fa-btn--sm')
  get isSmall(): boolean {
    return this.size === 'sm';
  }

  @HostBinding('class.fa-btn--md')
  get isMedium(): boolean {
    return this.size === 'md';
  }

  @HostBinding('class.fa-btn--lg')
  get isLarge(): boolean {
    return this.size === 'lg';
  }

  @HostBinding('class.fa-btn--block')
  get isBlock(): boolean {
    return this.block;
  }

  @HostBinding('class.fa-btn--icon')
  get hasIconOnly(): boolean {
    return this.iconOnly;
  }

  @HostBinding('class.fa-btn--loading')
  get isLoading(): boolean {
    return this.loading;
  }

  @HostBinding('class.fa-btn--disabled')
  get isDisabled(): boolean {
    return this.disabledState;
  }

  @HostBinding('attr.aria-busy')
  get ariaBusy(): string | null {
    return this.loading ? 'true' : null;
  }

  @HostBinding('attr.aria-disabled')
  get ariaDisabled(): string | null {
    return this.disabledState ? 'true' : null;
  }

  @HostBinding('attr.tabindex')
  get tabIndexAttr(): string | null {
    if (this.isAnchor && this.disabledState) {
      return '-1';
    }
    return null;
  }

  @HostBinding('attr.type')
  get typeAttr(): string | null {
    return this.isButton ? this.type : null;
  }

  @HostBinding('attr.disabled')
  get disabledAttr(): '' | null {
    return this.isButton && this.disabledState ? '' : null;
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.disabledState || !this.isAnchor) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  private get tagName(): string {
    return this.host.nativeElement.tagName.toLowerCase();
  }

  private get isAnchor(): boolean {
    return this.tagName === 'a';
  }

  private get isButton(): boolean {
    return this.tagName === 'button';
  }

  private get disabledState(): boolean {
    return this.disabled || this.loading;
  }
}
