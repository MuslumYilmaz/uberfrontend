import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ShowcaseIconName =
  | 'editor'
  | 'checks'
  | 'preview'
  | 'review'
  | 'stack'
  | 'grid'
  | 'cloud'
  | 'shield'
  | 'depth';

@Component({
  selector: 'app-showcase-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="showcase-icon"
      viewBox="0 0 24 24"
      [attr.width]="size"
      [attr.height]="size"
      [attr.aria-hidden]="decorative ? 'true' : null"
      [attr.role]="decorative ? null : 'img'"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.stroke-width]="strokeWidth"
    >
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'editor'">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M9 9 6.5 12 9 15" />
          <path d="m15 9 2.5 3-2.5 3" />
          <path d="M11.25 16.5 12.75 7.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'checks'">
          <path d="M9 7h9" />
          <path d="M9 12h9" />
          <path d="M9 17h9" />
          <path d="m4.5 7 1.5 1.5L8 6.5" />
          <path d="m4.5 12 1.5 1.5L8 11.5" />
          <path d="m4.5 17 1.5 1.5L8 16.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'preview'">
          <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
          <path d="M3.5 9.5h17" />
          <circle cx="8.5" cy="14.5" r="2" />
          <path d="M12 16.5h5" />
          <path d="M12 13h3.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'review'">
          <path d="M12 4.5 13.7 8l3.8.6-2.8 2.7.7 3.7-3.4-1.8-3.4 1.8.7-3.7-2.8-2.7 3.8-.6z" />
          <path d="M7 18h10" />
          <path d="M9.5 20h5" />
        </ng-container>

        <ng-container *ngSwitchCase="'stack'">
          <path d="m12 4.5 7 3.5-7 3.5L5 8z" />
          <path d="m5 12 7 3.5 7-3.5" />
          <path d="m5 16 7 3.5 7-3.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'grid'">
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'cloud'">
          <path d="M7.5 18.5h9a4 4 0 0 0 .8-7.9A5.5 5.5 0 0 0 6.6 9.4 4.2 4.2 0 0 0 7.5 18.5Z" />
          <path d="M12 10.5v6" />
          <path d="m9.8 14.2 2.2 2.3 2.2-2.3" />
        </ng-container>

        <ng-container *ngSwitchCase="'shield'">
          <path d="M12 4.5 18 7v4.8c0 3.3-2 6.4-6 7.7-4-1.3-6-4.4-6-7.7V7z" />
          <path d="m9.5 12.5 1.7 1.7 3.5-3.7" />
        </ng-container>

        <ng-container *ngSwitchCase="'depth'">
          <circle cx="6" cy="7" r="2" />
          <circle cx="18" cy="7" r="2" />
          <circle cx="12" cy="17" r="2" />
          <path d="M8 7h8" />
          <path d="M7.8 8.1 10.2 15" />
          <path d="M16.2 8.1 13.8 15" />
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      flex-shrink: 0;
    }

    .showcase-icon {
      display: block;
    }
  `],
})
export class ShowcaseIconComponent {
  @Input() name: ShowcaseIconName = 'editor';
  @Input() size = 16;
  @Input() strokeWidth = 1.8;
  @Input() decorative = true;
}
