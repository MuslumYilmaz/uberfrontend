import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  booleanAttribute,
} from '@angular/core';

export type FaCardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: '[faCard]',
  standalone: true,
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaCardComponent {
  @Input({ transform: booleanAttribute }) elevated = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() interactive: boolean | '' | null = null;
  @Input() padding: FaCardPadding = 'md';
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  @HostBinding('class.fa-card')
  readonly baseClass = true;

  @HostBinding('class.fa-card--interactive')
  get isInteractive(): boolean {
    if (this.interactive === '' || this.interactive === true) {
      return true;
    }
    if (this.interactive === false) {
      return false;
    }
    return this.isAnchor || this.isButton;
  }

  @HostBinding('class.fa-card--elevated')
  get isElevated(): boolean {
    return this.elevated;
  }

  @HostBinding('class.fa-card--disabled')
  get isDisabled(): boolean {
    return this.disabled;
  }

  @HostBinding('class.fa-card--pad-none')
  get hasNoPadding(): boolean {
    return this.padding === 'none';
  }

  @HostBinding('class.fa-card--pad-sm')
  get hasSmallPadding(): boolean {
    return this.padding === 'sm';
  }

  @HostBinding('class.fa-card--pad-md')
  get hasMediumPadding(): boolean {
    return this.padding === 'md';
  }

  @HostBinding('class.fa-card--pad-lg')
  get hasLargePadding(): boolean {
    return this.padding === 'lg';
  }

  @HostBinding('attr.aria-disabled')
  get ariaDisabled(): string | null {
    return this.disabled ? 'true' : null;
  }

  @HostBinding('attr.tabindex')
  get tabIndexAttr(): string | null {
    if (!this.disabled || (!this.isAnchor && !this.isButton)) {
      return null;
    }
    return '-1';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.disabled || (!this.isAnchor && !this.isButton)) {
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
}
