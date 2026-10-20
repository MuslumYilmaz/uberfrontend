import { Component, Input } from '@angular/core';

type FaGlyphName =
  | 'arrow-right'
  | 'bars'
  | 'bug'
  | 'calendar'
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
  | 'flag'
  | 'flame'
  | 'folder'
  | 'info'
  | 'search'
  | 'shuffle'
  | 'spinner'
  | 'target'
  | 'times-circle'
  | 'warning'
  | 'xmark';

type GlyphCircle = { cx: number; cy: number; r: number; opacity?: number };
type GlyphRect = { x: number; y: number; width: number; height: number; rx: number };
type GlyphShapes = {
  paths: readonly string[];
  circles?: readonly GlyphCircle[];
  rects?: readonly GlyphRect[];
};

// One entry per icon, rendered by three @for loops. A switch with one case per
// icon left an empty comment anchor for every case in every prerendered glyph,
// about 2.8 MB across the site. All shapes share one stroke color, so drawing
// them grouped by element type looks the same as the original order.
const GLYPHS: Record<FaGlyphName, GlyphShapes> = {
  'arrow-right': { paths: ['M5 12h14', 'm13 6 6 6-6 6'] },
  'bars': { paths: ['M4 7h16', 'M4 12h16', 'M4 17h16'] },
  'bug': { paths: ['M9.5 7.5 8 5.8', 'm14.5 7.5 1.5-1.7', 'M7.5 9.5 5 8.5', 'm16.5 9.5 2.5-1', 'M7.5 14.5 5 15.5', 'm16.5 14.5 2.5 1', 'M12 8c-3 0-5 2.2-5 5v2.2A1.8 1.8 0 0 0 8.8 17h6.4a1.8 1.8 0 0 0 1.8-1.8V13c0-2.8-2-5-5-5Z', 'M12 8V5'] },
  'calendar': { paths: ['M8 3.5v4', 'M16 3.5v4', 'M4 10h16', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 17h.01', 'M12 17h.01'], rects: [{ x: 4, y: 5.5, width: 16, height: 15, rx: 2.5 }] },
  'check': { paths: ['m5 12 4 4 10-10'] },
  'check-circle': { paths: ['m8.2 12.3 2.5 2.5 5-5.4'], circles: [{ cx: 12, cy: 12, r: 9 }] },
  'chevron-down': { paths: ['m6 9 6 6 6-6'] },
  'chevron-left': { paths: ['m15 6-6 6 6 6'] },
  'chevron-right': { paths: ['m9 6 6 6-6 6'] },
  'chevron-up': { paths: ['m6 15 6-6 6 6'] },
  'clipboard': { paths: ['M9 5.5h6', 'M9.5 3.5h5a1 1 0 0 1 1 1v2h-7v-2a1 1 0 0 1 1-1Z'], rects: [{ x: 6.5, y: 5.5, width: 11, height: 14, rx: 2 }] },
  'clock': { paths: ['M12 7.5v5l3 1.8'], circles: [{ cx: 12, cy: 12, r: 9 }] },
  'code': { paths: ['M9 8 5.5 12 9 16', 'm15 8 3.5 4-3.5 4', 'M13.2 6 10.8 18'] },
  'copy': { paths: [], rects: [{ x: 9, y: 9, width: 10, height: 10, rx: 2 }, { x: 5, y: 5, width: 10, height: 10, rx: 2 }] },
  'eye': { paths: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z'], circles: [{ cx: 12, cy: 12, r: 2.5 }] },
  'file': { paths: ['M7 4.5h7l4 4v11A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-13A2 2 0 0 1 8 4.5Z', 'M14 4.5v4h4'] },
  'flag': { paths: ['M6 21V4.5', 'M6 5h10.5l-1.8 4 1.8 4H6'] },
  'flame': { paths: ['M12 21c3.3 0 6-2.4 6-5.8 0-2.8-1.6-4.6-3.4-6.4-.9-.9-1.8-1.9-2.2-3.4-2.4 1.5-3.1 3.8-2.5 6-1.1-.4-1.8-1.2-2.2-2.1C6.6 10.6 6 12.3 6 14.2 6 18 8.7 21 12 21Z', 'M12.1 17.8c1.3 0 2.3-.9 2.3-2.2 0-1.2-.7-2-1.5-2.8-.4-.4-.8-.9-1-1.5-1 .7-1.4 1.8-1.2 2.9-.5-.2-.8-.5-1.1-.9-.5.7-.8 1.4-.8 2.2 0 1.4 1 2.3 2.3 2.3Z'] },
  'folder': { paths: ['M3.5 8.5A1.5 1.5 0 0 1 5 7h4l1.8 2H19a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 18H5A1.5 1.5 0 0 1 3.5 16.5z'] },
  'info': { paths: ['M12 10.5v5', 'M12 7.5h.01'], circles: [{ cx: 12, cy: 12, r: 9 }] },
  'search': { paths: ['m16 16 4 4'], circles: [{ cx: 11, cy: 11, r: 6 }] },
  'shuffle': { paths: ['M3.5 7h3.2c2.3 0 3.6 1.3 5.1 5 1.5 3.7 2.8 5 5.1 5h3.6', 'm17 14 3.5 3-3.5 3', 'M3.5 17h3.2c1.2 0 2.2-.4 3-1.4', 'M14.3 8.4c.8-1 1.8-1.4 3-1.4h3.2', 'm17 4 3.5 3-3.5 3'] },
  'spinner': { paths: ['M20.5 12A8.5 8.5 0 0 0 12 3.5'], circles: [{ cx: 12, cy: 12, r: 8.5, opacity: 0.25 }] },
  'target': { paths: ['M12 3.5V6', 'M12 18v2.5', 'M3.5 12H6', 'M18 12h2.5'], circles: [{ cx: 12, cy: 12, r: 8.5 }, { cx: 12, cy: 12, r: 4.8 }, { cx: 12, cy: 12, r: 1.4 }] },
  'times-circle': { paths: ['m9 9 6 6', 'm15 9-6 6'], circles: [{ cx: 12, cy: 12, r: 9 }] },
  'warning': { paths: ['M12 4.5 20 18H4z', 'M12 9v4.5', 'M12 16.5h.01'] },
  'xmark': { paths: ['m6 6 12 12', 'M18 6 6 18'] },
};

const NO_CIRCLES: readonly GlyphCircle[] = [];
const NO_RECTS: readonly GlyphRect[] = [];

@Component({
    selector: 'app-fa-glyph',
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
      @for (d of shapes().paths; track $index) {
        <path [attr.d]="d" />
      }
      @for (circle of shapes().circles ?? noCircles; track $index) {
        <circle [attr.cx]="circle.cx" [attr.cy]="circle.cy" [attr.r]="circle.r" [attr.opacity]="circle.opacity ?? null" />
      }
      @for (rect of shapes().rects ?? noRects; track $index) {
        <rect [attr.x]="rect.x" [attr.y]="rect.y" [attr.width]="rect.width" [attr.height]="rect.height" [attr.rx]="rect.rx" />
      }
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
  `]
})
export class FaGlyphComponent {
  protected readonly noCircles = NO_CIRCLES;
  protected readonly noRects = NO_RECTS;

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
    if (value.includes('calendar')) return 'calendar';
    if (value.includes('clock')) return 'clock';
    if (value.includes('spinner')) return 'spinner';
    if (value.includes('exclamation-triangle')) return 'warning';
    if (value.includes('info-circle')) return 'info';
    if (value.includes('search')) return 'search';
    if (value.includes('xmark') || value.includes(' pi-times') || value.endsWith('times')) return 'xmark';
    if (value.includes('bug')) return 'bug';
    if (value.includes('flame')) return 'flame';
    if (value.includes('flag')) return 'flag';
    if (value.includes('shuffle')) return 'shuffle';
    if (value.includes('target')) return 'target';
    if (value.includes('copy')) return 'copy';
    if (value.includes('eye')) return 'eye';
    if (value.includes('bars')) return 'bars';
    if (value.includes('folder')) return 'folder';
    if (value.includes(' pi-file') || value.endsWith('file')) return 'file';
    if (value.includes('code')) return 'code';
    if (value.includes('check')) return 'check';

    return 'check';
  }

  shapes(): GlyphShapes {
    return GLYPHS[this.resolvedName()];
  }

  isSpinning(): boolean {
    const value = String(this.icon || '').toLowerCase();
    return value.includes('spin') || this.resolvedName() === 'spinner';
  }
}
