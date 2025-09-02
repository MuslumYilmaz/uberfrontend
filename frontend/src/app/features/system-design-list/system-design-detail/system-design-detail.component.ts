import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit,
  QueryList, ViewChild, ViewChildren, WritableSignal, computed, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChipModule } from 'primeng/chip';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

type Block =
  | { type: 'text'; text: string }
  | { type: 'code'; language?: string; code: string; height?: number }
  | {
    type: 'image';
    src: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
    srcWebp?: string;
    srcAvif?: string;
    priority?: boolean;
  };

type RadioSection = { key: string; title: string; content?: string; blocks?: Block[]; };
type SDQuestion = Question & {
  radio?: RadioSection[];
  reflect?: string; assumptions?: string; diagram?: string; interface?: string; operations?: string;
};

@Component({
  selector: 'app-system-design-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ChipModule, MonacoEditorComponent, FooterComponent],
  templateUrl: './system-design-detail.component.html',
  styleUrls: ['./system-design-detail.component.css']
})
export class SystemDesignDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private qs = inject(QuestionService);

  q: WritableSignal<SDQuestion | null> = signal(null);
  all: SDQuestion[] = [];
  idx = 0;

  // content
  title = computed(() => this.q()?.title ?? '');
  description = computed(() => this.q()?.description ?? '');
  tags = computed(() => this.q()?.tags ?? []);

  sections = computed<Required<RadioSection>[]>(() => {
    const item = this.q(); if (!item) return [];
    const normalize = (s: RadioSection): Required<RadioSection> => ({
      key: s.key, title: s.title, content: s.content ?? '',
      blocks: s.blocks?.length ? s.blocks : s.content ? [{ type: 'text', text: s.content }] : []
    });

    if (item.radio?.length) return item.radio.map(normalize);

    const out: RadioSection[] = [];
    if (item.reflect) out.push({ key: 'R', title: 'Reflect & Requirements', content: item.reflect });
    if (item.assumptions) out.push({ key: 'A', title: 'Assumptions & Constraints', content: item.assumptions });
    if (item.diagram) out.push({ key: 'D', title: 'Diagram / Architecture', content: item.diagram });
    if (item.interface) out.push({ key: 'I', title: 'Interfaces & APIs', content: item.interface });
    if (item.operations) out.push({ key: 'O', title: 'Operations & Trade-offs', content: item.operations });
    return out.map(normalize);
  });

  /** Active TOC key (scroll spy) */
  activeKey = signal<string | null>(null);
  @ViewChildren('sectionHeading', { read: ElementRef }) heads!: QueryList<ElementRef<HTMLElement>>;

  /** Lazy Monaco: observed placeholders */
  @ViewChildren('codeSentinel', { read: ElementRef }) codeSentinels!: QueryList<ElementRef<HTMLElement>>;
  private io?: IntersectionObserver;
  private mountedCodes = signal<Set<string>>(new Set());
  isCodeMounted = (id: string) => this.mountedCodes().has(id);
  codeKey(sectionKey: string, idx: number) { return `${sectionKey}#${idx}`; }

  /** Center column for potential responsive image sizing */
  @ViewChild('centerEl', { read: ElementRef }) centerEl!: ElementRef<HTMLElement>;

  /** Monaco viewer options */
  codeViewerOptions = {
    readOnly: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    minimap: { enabled: false },
    renderLineHighlight: 'none',
    scrollBeyondLastLine: false,
    overviewRulerLanes: 0,
    folding: true,
    scrollbar: {
      vertical: 'hidden', horizontal: 'hidden',
      useShadows: false, verticalScrollbarSize: 0, horizontalScrollbarSize: 0,
      alwaysConsumeMouseWheel: false,
    },
  };

  // programmatic scroll coordination
  private isProgrammaticScroll = false;
  private programScrollTarget: number | null = null;
  private settleWatcher: any = null;

  // rAF throttle for resize work
  private resizeRaf = 0;

  // ---- lifecycle ----
  ngOnInit(): void {
    // Load list once; then resolve current id
    this.qs.loadSystemDesign().subscribe((list) => {
      this.all = list as SDQuestion[];
      const id = this.route.snapshot.paramMap.get('id')!;
      this.setCurrentById(id, /*allowPending*/ false);
    });

    // React to id changes (e.g., next/prev navigation)
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) this.setCurrentById(id, /*allowPending*/ true);
    });
  }

  ngAfterViewInit(): void {
    this.heads.changes.subscribe(() => setTimeout(() => {
      this.updateActiveFromPositions();
    }, 0));

    // Observe code sentinels for lazy Monaco mount
    const setupIO = () => {
      this.io?.disconnect();
      this.io = new IntersectionObserver((entries) => {
        const next = new Set(this.mountedCodes());
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset['codeId']!;
          if (e.isIntersecting && id) next.add(id);
        }
        if (next.size !== this.mountedCodes().size) this.mountedCodes.set(next);
      }, {
        root: null,
        rootMargin: '700px 0px 700px 0px',
        threshold: 0
      });
      this.codeSentinels.forEach(ref => this.io!.observe(ref.nativeElement));
    };

    setupIO();
    this.codeSentinels.changes.subscribe(() => setupIO());

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    setTimeout(() => {
      this.updateActiveFromPositions();
    }, 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    clearInterval(this.settleWatcher);
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.io?.disconnect();
  }

  // ---- helpers ----
  asset(path: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `assets/${path.replace(/^\/+/, '')}`;
  }

  /**
   * Set current item by id.
   * If list is loaded and id is unknown → navigate to /404 with the missing URL.
   */
  private setCurrentById(id: string, allowPending: boolean) {
    if (!this.all.length) {
      // list not ready yet; ignore unless we allow pending (route change before data)
      if (!allowPending) return;
    }
    const pos = this.all.findIndex(x => x.id === id);

    if (pos >= 0) {
      this.idx = pos;
      const item = this.all[pos];
      this.q.set(item);
      // remember “continue” target
      try {
        localStorage.setItem('uf:lastVisited', JSON.stringify({
          to: ['/system-design', item.id],
          label: item.title ?? 'System design'
        }));
      } catch { }

      // reset lazy-mounted editors when switching questions
      this.mountedCodes.set(new Set());
      // default active: first section
      this.activeKey.set(this.sections()[0]?.key ?? null);
      setTimeout(() => this.updateActiveFromPositions(), 0);
      return;
    }

    // If we have data and still couldn't find it → 404
    if (this.all.length) this.navTo404();
  }

  /** Send the user to the NotFound page with the missing URL preserved. */
  private navTo404() {
    const missing = this.router.url;
    try { sessionStorage.setItem('uf:lastMissing', missing); } catch { }
    // replaceUrl so Back returns to the last valid page instead of the bad URL
    this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
  }

  /** Height to keep clear for the fixed header + breathing room */
  private headerOffset(): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top').trim();
    const base = parseInt(raw || '64', 10);
    return (isNaN(base) ? 64 : base) + 12;
  }

  /** Switch a tad earlier than the header line to feel natural */
  private leadBeforeHeader(): number { return 96; }

  /** Choose the last heading whose absolute top is <= scroll line; force last when near bottom. */
  private updateActiveFromPositions = () => {
    if (!this.heads) return;
    const nodes = this.heads.toArray().map(h => h.nativeElement);
    if (!nodes.length) return;

    // If we're very close to the bottom, force last section active
    const doc = document.documentElement;
    const bottomGap = doc.scrollHeight - (window.pageYOffset + window.innerHeight);
    if (bottomGap <= Math.max(48, this.leadBeforeHeader())) {
      const lastKey = nodes[nodes.length - 1].dataset['key'] || null;
      if (lastKey && this.activeKey() !== lastKey) this.activeKey.set(lastKey);
      return;
    }

    const line = window.pageYOffset + this.headerOffset() + this.leadBeforeHeader();
    let bestIdx = 0;

    for (let i = 0; i < nodes.length; i++) {
      const absTop = nodes[i].getBoundingClientRect().top + window.pageYOffset;
      if (absTop <= line) bestIdx = i;
      else break;
    }

    const key = nodes[bestIdx].dataset['key'] || null;
    if (key && this.activeKey() !== key) this.activeKey.set(key);
  };

  private onScroll = () => {
    if (this.isProgrammaticScroll) return;
    this.updateActiveFromPositions();
  };

  private onResize = () => {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => {
      this.updateActiveFromPositions();
    });
  };

  /** smooth scroll to section with offset and a “settle” guard */
  scrollToKey(key: string) {
    const el = document.getElementById(this.anchorId(key));
    if (!el) return;

    this.activeKey.set(key);

    const desired = el.getBoundingClientRect().top + window.pageYOffset - (this.headerOffset() + 8);
    const doc = document.documentElement;
    const maxTop = Math.max(0, doc.scrollHeight - window.innerHeight);
    this.programScrollTarget = Math.min(maxTop, Math.max(0, desired));
    this.isProgrammaticScroll = true;

    window.scrollTo({ top: this.programScrollTarget, behavior: 'smooth' });

    clearInterval(this.settleWatcher);
    let lastY = window.pageYOffset;
    let stableTicks = 0;
    const start = Date.now();
    const MAX_MS = 1800;

    this.settleWatcher = setInterval(() => {
      const y = window.pageYOffset;
      const nearTarget = this.programScrollTarget !== null && Math.abs(y - this.programScrollTarget) < 3;
      const delta = Math.abs(y - lastY);
      lastY = y;
      stableTicks = delta < 2 ? (stableTicks + 1) : 0;

      if (nearTarget || stableTicks >= 3 || (Date.now() - start) > MAX_MS) {
        clearInterval(this.settleWatcher);
        this.isProgrammaticScroll = false;
        this.programScrollTarget = null;
        this.updateActiveFromPositions();
      }
    }, 80);
  }

  scrollTop() {
    this.isProgrammaticScroll = true;
    this.programScrollTarget = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    clearInterval(this.settleWatcher);
    let lastY = window.pageYOffset;
    let stableTicks = 0;
    const start = Date.now();
    const MAX_MS = 1200;

    this.settleWatcher = setInterval(() => {
      const y = window.pageYOffset;
      const nearTop = y < 3;
      const delta = Math.abs(y - lastY);
      lastY = y;
      stableTicks = delta < 2 ? (stableTicks + 1) : 0;

      if (nearTop || stableTicks >= 3 || (Date.now() - start) > MAX_MS) {
        clearInterval(this.settleWatcher);
        this.isProgrammaticScroll = false;
        this.programScrollTarget = null;
        this.updateActiveFromPositions();
      }
    }, 80);
  }

  anchorId(key: string) { return `sec-${key}`; }
}
