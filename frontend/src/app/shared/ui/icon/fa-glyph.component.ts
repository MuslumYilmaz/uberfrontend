import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type FaGlyphName =
  | 'arrow-right'
  | 'bars'
  | 'bug'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'clipboard'
  | 'clock'
  | 'code'
  | 'copy'
  | 'eye'
  | 'file'
  | 'folder'
  | 'info'
  | 'search'
  | 'spinner'
  | 'times-circle'
  | 'warning'
  | 'xmark';

@Component({
  selector: 'app-fa-glyph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="fa-glyph__svg"
      [class.fa-glyph__svg--spin]="isSpinning()"
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
      <ng-container [ngSwitch]="resolvedName()">
        <ng-container *ngSwitchCase="'arrow-right'">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'bars'">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </ng-container>

        <ng-container *ngSwitchCase="'bug'">
          <path d="M9.5 7.5 8 5.8" />
          <path d="m14.5 7.5 1.5-1.7" />
          <path d="M7.5 9.5 5 8.5" />
          <path d="m16.5 9.5 2.5-1" />
          <path d="M7.5 14.5 5 15.5" />
          <path d="m16.5 14.5 2.5 1" />
          <path d="M12 8c-3 0-5 2.2-5 5v2.2A1.8 1.8 0 0 0 8.8 17h6.4a1.8 1.8 0 0 0 1.8-1.8V13c0-2.8-2-5-5-5Z" />
          <path d="M12 8V5" />
        </ng-container>

        <ng-container *ngSwitchCase="'check'">
          <path d="m5 12 4 4 10-10" />
        </ng-container>

        <ng-container *ngSwitchCase="'check-circle'">
          <circle cx="12" cy="12" r="9" />
          <path d="m8.2 12.3 2.5 2.5 5-5.4" />
        </ng-container>

        <ng-container *ngSwitchCase="'chevron-down'">
          <path d="m6 9 6 6 6-6" />
        </ng-container>

        <ng-container *ngSwitchCase="'chevron-left'">
          <path d="m15 6-6 6 6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'chevron-right'">
          <path d="m9 6 6 6-6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'chevron-up'">
          <path d="m6 15 6-6 6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'clipboard'">
          <rect x="6.5" y="5.5" width="11" height="14" rx="2" />
          <path d="M9 5.5h6" />
          <path d="M9.5 3.5h5a1 1 0 0 1 1 1v2h-7v-2a1 1 0 0 1 1-1Z" />
        </ng-container>

        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5l3 1.8" />
        </ng-container>

        <ng-container *ngSwitchCase="'code'">
          <path d="M9 8 5.5 12 9 16" />
          <path d="m15 8 3.5 4-3.5 4" />
          <path d="M13.2 6 10.8 18" />
        </ng-container>

        <ng-container *ngSwitchCase="'copy'">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </ng-container>

        <ng-container *ngSwitchCase="'eye'">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'file'">
          <path d="M7 4.5h7l4 4v11A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-13A2 2 0 0 1 8 4.5Z" />
          <path d="M14 4.5v4h4" />
        </ng-container>

        <ng-container *ngSwitchCase="'folder'">
          <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h4l1.8 2H19a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 18H5A1.5 1.5 0 0 1 3.5 16.5z" />
        </ng-container>

        <ng-container *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.5v5" />
          <path d="M12 7.5h.01" />
        </ng-container>

        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        </ng-container>

        <ng-container *ngSwitchCase="'spinner'">
          <circle cx="12" cy="12" r="8.5" opacity="0.25" />
          <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'times-circle'">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'warning'">
          <path d="M12 4.5 20 18H4z" />
          <path d="M12 9v4.5" />
          <path d="M12 16.5h.01" />
        </ng-container>

        <ng-container *ngSwitchCase="'xmark'">
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      line-height: 0;
      vertical-align: middle;
    }

    .fa-glyph__svg {
      display: block;
    }

    .fa-glyph__svg--spin {
      animation: faGlyphSpin 1s linear infinite;
    }

    @keyframes faGlyphSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
})
export class FaGlyphComponent {
  @Input() icon = '';
  @Input() size: string | number = '1em';
  @Input() strokeWidth = 1.9;
  @Input() decorative = true;

  resolvedName(): FaGlyphName {
    const value = String(this.icon || '').toLowerCase();

    if (value.includes('check-circle')) return 'check-circle';
    if (value.includes('times-circle')) return 'times-circle';
    if (value.includes('chevron-right')) return 'chevron-right';
    if (value.includes('chevron-left')) return 'chevron-left';
    if (value.includes('chevron-up')) return 'chevron-up';
    if (value.includes('chevron-down')) return 'chevron-down';
    if (value.includes('arrow-right')) return 'arrow-right';
    if (value.includes('clipboard')) return 'clipboard';
    if (value.includes('clock')) return 'clock';
    if (value.includes('spinner')) return 'spinner';
    if (value.includes('exclamation-triangle')) return 'warning';
    if (value.includes('info-circle')) return 'info';
    if (value.includes('search')) return 'search';
    if (value.includes('xmark') || value.includes(' pi-times') || value.endsWith('times')) return 'xmark';
    if (value.includes('bug')) return 'bug';
    if (value.includes('copy')) return 'copy';
    if (value.includes('eye')) return 'eye';
    if (value.includes('bars')) return 'bars';
    if (value.includes('folder')) return 'folder';
    if (value.includes(' pi-file') || value.endsWith('file')) return 'file';
    if (value.includes('code')) return 'code';
    if (value.includes('check')) return 'check';

    return 'check';
  }

  isSpinning(): boolean {
    const value = String(this.icon || '').toLowerCase();
    return value.includes('spin') || this.resolvedName() === 'spinner';
  }
}
