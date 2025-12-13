import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

type TocItem = { id: string; text: string; level: 2 | 3 };
type LeftNav = {
  title?: string;
  sections: Array<{
    title: string;
    items: Array<{ title: string; link: any[]; active?: boolean }>;
  }>;
};

@Component({
  selector: 'fa-guide-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
:host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }

/* layout */
.wrap{
  --left-nav-w: 350px;
  --right-toc-w: 350px;
  display:grid;
  grid-template-columns: minmax(0,1fr) var(--right-toc-w);
  gap:28px;
  align-items:start;
  padding:8px 0 24px;
}
.wrap.has-left{
  grid-template-columns: var(--left-nav-w) minmax(0,1fr) var(--right-toc-w);
}

@media (max-width:1100px){
  .wrap{ grid-template-columns:1fr; }
  .left, .toc { position:static; }
  .left-fixed, .toc-fixed {
    position: static !important;
    width: auto !important;
    max-height: none !important;
    left: auto !important;
    right: auto !important;
  }
}

.main{ max-width: 860px; }

/* headings + meta — SIZE-ALIGNED with System Design */
.title{ font-size:28px; font-weight:800; letter-spacing:.2px; margin:6px 0 6px; color: var(--uf-text-primary); }
.subtitle{ color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); margin-bottom:14px; font-size:14px; }
.meta{ display:flex; gap:8px; font-size:12px; color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin-bottom:18px; align-items:center; flex-wrap:wrap; }
.badge{ border:1px solid var(--uf-border-subtle); padding:2px 10px; border-radius:999px; font-size:11.5px; background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); color: var(--uf-text-secondary); }

/* article body — SIZE-ALIGNED with System Design (14px base) */
.content{ line-height:1.6; font-size:14px; letter-spacing:.01em; color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent); }
.content>p:first-of-type{ font-size:14px; color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent); }
.content h2{
  font-size:18px; font-weight:700;
  margin:28px 0 10px; padding-top:12px;
  border-top:1px solid var(--uf-border-subtle);
  scroll-margin-top: calc(var(--app-safe-top, 64px) + 12px);
  color: var(--uf-text-primary);
}
.content h3{
  font-size:15px; font-weight:700;
  margin:18px 0 8px; opacity:.98;
  scroll-margin-top: calc(var(--app-safe-top, 64px) + 12px);
  color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
}
.content p, .content ul, .content ol{ margin:10px 0; }
.content ul{ padding-left:1.2rem; }
.content li{ margin:6px 0; }
.content li::marker{ color:color-mix(in srgb, var(--uf-text-tertiary) 70%, transparent); }
.content strong{ font-weight:800; }
.content code{
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
  background:color-mix(in srgb, var(--uf-text-primary) 8%, var(--uf-surface));
  border:1px solid var(--uf-border-subtle);
  padding:.5px 6px; border-radius:6px;
  color: var(--uf-text-primary);
}

/* code blocks */
.code-wrap{
  position:relative; margin:14px 0;
  border:1px solid var(--uf-border-subtle);
  border-radius:var(--uf-card-radius);
  background:linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 92%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
  overflow:hidden;
  box-shadow: var(--uf-card-shadow);
}
.code-wrap pre{
  margin:0; padding:14px;
  overflow:auto;
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size:13px; line-height:1.6;
  color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
}
.code-copy{
  position:absolute; top:8px; right:8px; cursor:pointer;
  font-size:12px; opacity:.9;
  border:1px solid var(--uf-border-subtle);
  padding:2px 10px; border-radius:999px; background: color-mix(in srgb, var(--uf-text-primary) 8%, var(--uf-surface));
  color: var(--uf-text-primary);
}
.code-copy:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 12%, var(--uf-surface)); }
.code-lang{ display:none !important; }

/* tables */
.table-scroll{
  margin:14px 0; border:1px solid var(--uf-border-subtle);
  border-radius:12px; overflow:auto; background:var(--uf-surface);
  box-shadow:var(--uf-card-shadow);
}
.table-scroll table{ width:100%; border-collapse:collapse; min-width:640px; }
.table-scroll th,.table-scroll td{ border-bottom:1px solid var(--uf-border-subtle); padding:12px 14px; text-align:left; color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent); }
.table-scroll thead th{ position:sticky; top:0; background:var(--uf-surface-alt); z-index:1; color: var(--uf-text-primary); }

/* rails (left / right) */
.left, .toc { min-height:1px; }

.left-fixed, .toc-fixed{
  position: fixed;
  top: calc(var(--app-safe-top, 64px) + 12px);
  z-index: 2;
  max-height: calc(100vh - var(--app-safe-top, 64px) - 16px);
  overflow:auto;
  background:linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 94%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
  border:1px solid var(--uf-border-subtle);
  border-radius:16px;
  padding:12px;
  box-shadow:var(--uf-card-shadow-strong);
}
.left-fixed { width: var(--left-nav-w); }
.toc-fixed  { width: var(--right-toc-w); }

/* left nav — SIZE-ALIGNED (13px items) */
.left .title-sm{ font-size:12px; opacity:.82; margin:4px 8px 8px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
.left .sec{ margin:10px 0 6px; padding:0 8px; font-size:12px; opacity:.7; }
.left a.item{
  display:flex; align-items:center; gap:8px;
  padding:10px 12px; margin:6px 6px; border-radius:10px;
  text-decoration:none; color:inherit; opacity:.87;
  border:1px solid transparent;
  font-size:13px;
}
.left a.item:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }
.left a.item.active{ opacity:1; background:color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface)); border-color:color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle)); }
.left .dot{ width:6px; height:6px; border-radius:999px; background:color-mix(in srgb, var(--uf-text-primary) 40%, transparent); }

/* right toc — SIZE-ALIGNED (13px links) */
.toc .head{ font-size:12px; opacity:.82; margin:4px 8px 8px; font-weight:700; }
.toc a{
  display:block; color:inherit; opacity:.85;
  padding:8px 12px; text-decoration:none; border-radius:12px;
  border:1px solid transparent;
  font-size:13px;
}
.toc a.l3{ margin-left:10px; }
.toc a:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }
.toc a.active{ opacity:1; background:color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface)); border-color:color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle)); color: var(--uf-text-primary); }

/* footer nav */
.footer-nav{ display:flex; justify-content:space-between; gap:8px; margin-top:28px; }
.nav-btn{
  border:1px solid var(--uf-border-subtle);
  padding:10px 12px; border-radius:12px; font-size:14px;
  background:var(--uf-surface); color:var(--uf-text-primary); text-decoration:none;
  box-shadow: var(--uf-card-shadow);
}
.nav-btn:hover{ background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }

`],
  template: `
  <div class="wrap" [class.has-left]="leftNav">
    <aside class="left" *ngIf="leftNav">
      <div #leftAnchor></div>
      <div #leftPanel class="left-fixed">
        <div class="title-sm">{{ leftNav.title || 'Current guide' }}</div>
        <ng-container *ngFor="let s of leftNav!.sections">
          <div class="sec">{{ s.title }}</div>
          <a *ngFor="let it of s.items"
             class="item"
             [class.active]="it.active"
             [routerLink]="it.link">
            <span class="dot"></span>
            <span>{{ it.title }}</span>
          </a>
        </ng-container>
      </div>
    </aside>

    <div class="main">
      <h1 class="title">{{title}}</h1>
      <div class="subtitle" *ngIf="subtitle">{{subtitle}}</div>
      <div class="meta">
        <span *ngIf="minutes as m" class="badge">{{m}} min</span>
        <span *ngFor="let t of (tags||[])" class="badge">{{t}}</span>
      </div>

      <div #content class="content"><ng-content></ng-content></div>

      <div class="footer-nav">
        <a *ngIf="prev" [routerLink]="prev" class="nav-btn">← Prev</a>
        <span></span>
        <a *ngIf="next" [routerLink]="next" class="nav-btn">Next →</a>
      </div>
    </div>

    <aside class="toc" *ngIf="toc().length">
      <div #rightAnchor></div>
      <div #rightPanel class="toc-fixed">
        <div class="head">On this page</div>
        <nav>
          <a *ngFor="let it of toc()"
             [href]="'#'+it.id"
             [class.active]="activeId()===it.id"
             [class.l2]="it.level===2" [class.l3]="it.level===3"
             (click)="smoothScroll($event, it.id)">{{ it.text }}</a>
        </nav>
      </div>
    </aside>
  </div>
  `
})
export class GuideShellComponent implements AfterViewInit, OnDestroy {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() minutes?: number;
  @Input() tags?: string[];
  @Input() prev?: any[] | null;
  @Input() next?: any[] | null;
  @Input() leftNav?: LeftNav;

  @ViewChild('content', { read: ElementRef }) contentRef!: ElementRef<HTMLElement>;
  @ViewChild('leftAnchor', { read: ElementRef }) leftAnchor?: ElementRef<HTMLElement>;
  @ViewChild('rightAnchor', { read: ElementRef }) rightAnchor?: ElementRef<HTMLElement>;
  @ViewChild('leftPanel', { read: ElementRef }) leftPanel?: ElementRef<HTMLElement>;
  @ViewChild('rightPanel', { read: ElementRef }) rightPanel?: ElementRef<HTMLElement>;

  toc = signal<TocItem[]>([]);
  activeId = signal<string | null>(null);

  private headingEls: HTMLElement[] = [];
  /** Each range: [startY, endY, id] in document coords (scrollY space). */
  private ranges: Array<[number, number, string]> = [];

  private onResize = () => { };
  private onScroll = () => { };
  private mo?: MutationObserver;
  private imgListeners: Array<() => void> = [];

  constructor(private r: Renderer2) { }

  ngAfterViewInit(): void {
    const el = this.contentRef.nativeElement;

    this.buildToc(el);
    this.buildRanges();          // compute ranges once content is laid out

    this.enhanceCodeBlocks(el);
    this.enhanceTables(el);
    this.positionFixedPanels();

    // Keep ranges fresh
    this.onResize = () => {
      this.positionFixedPanels();
      this.buildRanges();
      this.recalcActiveFromScroll();
    };
    this.onScroll = () => this.recalcActiveFromScroll();

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    // MutationObserver (DOM changes inside content)
    this.mo = new MutationObserver(() => {
      // schedule on next frame to allow layout to settle
      requestAnimationFrame(() => { this.buildRanges(); this.recalcActiveFromScroll(); });
    });
    this.mo.observe(el, { childList: true, subtree: true, attributes: true });

    // Recalc when images load
    for (const img of Array.from(el.querySelectorAll('img'))) {
      const handler = () => this.onResize();
      img.addEventListener('load', handler, { once: true });
      this.imgListeners.push(() => img.removeEventListener('load', handler));
    }

    this.recalcActiveFromScroll(); // first paint
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    this.mo?.disconnect();
    this.imgListeners.forEach(off => off());
  }

  /* ---------- layout helpers ---------- */
  private positionFixedPanels() {
    if (window.matchMedia('(max-width: 1100px)').matches) return;
    const setLeft = (anchor?: ElementRef<HTMLElement>, panel?: ElementRef<HTMLElement>) => {
      if (!anchor?.nativeElement || !panel?.nativeElement) return;
      const rect = anchor.nativeElement.getBoundingClientRect();
      panel.nativeElement.style.left = `${rect.left}px`;
    };
    setLeft(this.leftAnchor, this.leftPanel);
    setLeft(this.rightAnchor, this.rightPanel);
  }

  private headerOffset(): number {
    return (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top')) || 64) + 12;
  }

  /* ---------- ToC & ranges ---------- */
  private buildToc(root: HTMLElement) {
    const heads = Array.from(root.querySelectorAll('h2, h3')) as HTMLHeadingElement[];
    const items: TocItem[] = [];
    for (const h of heads) {
      if (!h.id) h.id = this.slug(h.textContent || '');
      items.push({ id: h.id, text: h.textContent || '', level: h.tagName === 'H2' ? 2 : 3 });
    }
    this.toc.set(items);
    this.headingEls = heads;
  }

  private buildRanges() {
    const off = this.headerOffset();
    const tops = this.headingEls.map(h => h.getBoundingClientRect().top + window.scrollY - off);
    this.ranges = tops.map((t, i) => [
      t,
      i < tops.length - 1 ? tops[i + 1] : Number.POSITIVE_INFINITY,
      this.headingEls[i].id
    ]);
  }

  private slug(s: string) {
    return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
  }

  smoothScroll(ev: Event, id: string) {
    ev.preventDefault();
    this.activeId.set(id); // immediate feedback
    const t = document.getElementById(id);
    if (!t) return;
    const y = t.getBoundingClientRect().top + window.scrollY - (this.headerOffset() - 2);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /** Range-based selection — no “near-bottom” hacks, so it won’t skip on direction changes. */
  private recalcActiveFromScroll() {
    if (!this.ranges.length) return;

    const y = window.scrollY + 1; // tiny nudge to avoid boundary flicker

    // binary search by startY
    let lo = 0, hi = this.ranges.length - 1, idx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.ranges[mid][0] <= y) { idx = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }

    // ensure y < end; if we moved upward across a boundary,
    // idx computed above already points to the correct range.
    if (idx < this.ranges.length - 1 && y >= this.ranges[idx][1]) idx++;

    this.activeId.set(this.ranges[idx][2]);
  }

  /* ---------- content enhancers ---------- */
  private enhanceCodeBlocks(root: HTMLElement) {
    const blocks = Array.from(root.querySelectorAll('pre > code')) as HTMLElement[];
    for (const code of blocks) {
      const pre = code.parentElement as HTMLElement;
      if (!pre) continue;

      const wrap = this.r.createElement('div');
      this.r.addClass(wrap, 'code-wrap');
      pre.replaceWith(wrap);
      this.r.appendChild(wrap, pre);

      const btn = this.r.createElement('button');
      this.r.addClass(btn, 'code-copy');
      btn.textContent = 'Copy';
      this.r.listen(btn, 'click', () => {
        (async () => {
          try {
            await navigator.clipboard.writeText(code.innerText);
            const old = btn.textContent; btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = old, 950);
          } catch { }
        })();
      });
      this.r.appendChild(wrap, btn);
    }
  }

  private enhanceTables(root: HTMLElement) {
    const tables = Array.from(root.querySelectorAll('table')) as HTMLTableElement[];
    for (const t of tables) {
      if (t.parentElement?.classList.contains('table-scroll')) continue;
      const wrap = this.r.createElement('div');
      this.r.addClass(wrap, 'table-scroll');
      t.replaceWith(wrap);
      this.r.appendChild(wrap, t);
    }
  }
}
