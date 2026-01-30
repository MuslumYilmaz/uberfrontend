import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID,
  QueryList, ViewChild, ViewChildren, WritableSignal, computed, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChipModule } from 'primeng/chip';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { SEO_SUPPRESS_TOKEN } from '../../../core/services/seo-context';
import { SeoService } from '../../../core/services/seo.service';
import { isQuestionLockedForTier } from '../../../core/models/question.model';
import { buildLockedPreviewForSystemDesign, LockedPreviewData } from '../../../core/utils/locked-preview.util';

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
  }
  | {
    type: 'checklist';
    title?: string;
    items: string[];
  }
  | {
    type: 'callout';
    title?: string;
    text: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
  }
  | {
    type: 'table';
    title?: string;
    columns: string[];
    rows: string[][];
  }
  // NEW: simple visual separator
  | {
    type: 'divider';
  }
  // NEW: multi-column layout (each column contains its own blocks)
  | {
    type: 'columns';
    columns: {
      width?: '1/2' | '1/3' | '2/3';
      blocks: Block[];
    }[];
  }
  // NEW: small metric cards (latency, availability, etc.)
  | {
    type: 'stats';
    items: {
      label: string;
      value: string;
      helperText?: string;
    }[];
  }
  // NEW: step flow (Create → Share → Redirect)
  | {
    type: 'steps';
    title?: string;
    steps: {
      title: string;
      text?: string;
    }[];
  };

type RadioSection = {
  key: string;
  title: string;
  content?: string;
  blocks?: Block[];
};

type SDQuestion = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  access?: 'free' | 'premium';
  type?: string;

  radio?: RadioSection[];

  reflect?: string;
  assumptions?: string;
  diagram?: string;
  interface?: string;
  operations?: string;
};

type RelatedItem = {
  id: string;
  title: string;
  access?: 'free' | 'premium';
};

@Component({
  selector: 'app-system-design-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ChipModule, MonacoEditorComponent, FooterComponent, LockedPreviewComponent],
  templateUrl: './system-design-detail.component.html',
  styleUrls: ['./system-design-detail.component.css']
})
export class SystemDesignDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private qs = inject(QuestionService);
  private seo = inject(SeoService);
  private readonly suppressSeo = inject(SEO_SUPPRESS_TOKEN);
  readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  q: WritableSignal<SDQuestion | null> = signal(null);
  all: SDQuestion[] = [];
  idx = 0;
  private forceListRefreshTried = false;

  // content
  title = computed(() => this.q()?.title ?? '');
  description = computed(() => this.q()?.description ?? '');
  tags = computed(() => this.q()?.tags ?? []);
  locked = computed(() => {
    const access = (this.q() as any)?.access ?? 'free';
    const user = this.auth.user();
    return isQuestionLockedForTier({ access } as any, user);
  });
  lockedTitle = computed(() => this.q()?.title ?? 'Premium question');
  lockedSummary = computed(() => {
    const q = this.q();
    if (!q) return '';
    const normalized = this.normalizePreviewText(this.sdDescription(q));
    return this.trimWords(normalized, 45);
  });
  lockedBullets = computed(() => {
    const sections = this.sections();
    return sections
      .map((s) => this.trimWords(this.normalizePreviewText(s.title), 8))
      .filter((item) => item.length > 0)
      .slice(0, 2);
  });
  lockedPreview = computed<LockedPreviewData | null>(() => {
    const q = this.q();
    if (!q) return null;
    return buildLockedPreviewForSystemDesign({
      id: q.id,
      title: q.title,
      description: this.sdDescription(q),
      tags: q.tags || [],
      sectionTitles: this.sections().map((s) => s.title),
    }, {
      candidates: this.all as any,
    });
  });

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

  /** Related system design questions based on shared tags (top 4). */
  relatedItems = computed<RelatedItem[]>(() => {
    const current = this.q();
    if (!current || !this.all.length) return [];
    const baseTags = Array.isArray(current.tags) ? current.tags.map(t => t.toLowerCase()) : [];
    if (!baseTags.length) return [];
    const baseSet = new Set(baseTags);

    const scored = this.all
      .filter((q) => q.id !== current.id)
      .map((q) => {
        const tags = Array.isArray(q.tags) ? q.tags.map(t => t.toLowerCase()) : [];
        let score = 0;
        for (const tag of tags) if (baseSet.has(tag)) score += 1;
        return score ? { q, score } : null;
      })
      .filter(Boolean) as Array<{ q: SDQuestion; score: number }>;

    scored.sort((a, b) =>
      b.score - a.score
      || ((a.q.access === 'free') === (b.q.access === 'free') ? 0 : (a.q.access === 'free' ? -1 : 1))
      || (a.q.title || '').localeCompare(b.q.title || '')
    );

    return scored.slice(0, 4).map(({ q }) => ({
      id: q.id,
      title: q.title,
      access: q.access ?? 'free',
    }));
  });

  /** Active TOC key (scroll spy) */
  activeKey = signal<string | null>(null);
  @ViewChildren('sectionHeading', { read: ElementRef }) heads!: QueryList<ElementRef<HTMLElement>>;

  /** Lazy Monaco: observed placeholders */
  @ViewChildren('codeSentinel', { read: ElementRef }) codeSentinels!: QueryList<ElementRef<HTMLElement>>;
  private io?: IntersectionObserver;
  private mountedCodes = signal<Set<string>>(new Set());
  isCodeMounted = (id: string) => this.mountedCodes().has(id);
  codeKey(sectionKey: string, idx: string | number) {
    return `${sectionKey}#${idx}`;
  }
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
    if (!this.isBrowser) return;
    this.heads.changes.subscribe(() => setTimeout(() => {
      this.updateActiveFromPositions();
    }, 0));

    // Observe code sentinels for lazy Monaco mount
    const setupIO = () => {
      this.io?.disconnect();
      if (typeof IntersectionObserver === 'undefined') return;
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
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    }
    clearInterval(this.settleWatcher);
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
      // Liste henüz gelmediyse ve beklemeye izin yoksa çık
      if (!allowPending) return;
    }

    const pos = this.all.findIndex(x => x.id === id);

    if (pos >= 0) {
      this.idx = pos;
      const meta = this.all[pos]; // index.json’dan gelen meta (id, title, description, tags...)

      // Her soru değişiminde lazy code mount'ları ve activeKey'i resetle
      this.mountedCodes.set(new Set());
      this.activeKey.set(null);

      // Detay json'ı çek (meta + radio blokları)
      this.qs.loadSystemDesignQuestion(id).subscribe(detail => {
        if (!detail) {
          this.navTo404();
          return;
        }

        const merged: SDQuestion = {
          // Önce index meta:
          id: meta.id,
          title: meta.title,
          description: meta.description,
          tags: meta.tags ?? [],
          type: meta.type,

          // Sonra detail meta (meta.json içindeki ekstra alanlar / radio, sections, vs.):
          ...(detail as Partial<SDQuestion>),

          // access: keep index authority
          access: (meta as any).access ?? 'free',
        };

        this.q.set(merged);
        this.updateSeo(merged);

        // “continue where you left off” için
        if (this.isBrowser) {
          try {
          localStorage.setItem('fa:lastVisited', JSON.stringify({
            to: ['/system-design', merged.id],
            label: merged.title ?? 'System design'
          }));
          } catch { }
        }

        // default aktif section: ilk section
        const secs = this.sections();
        this.activeKey.set(secs[0]?.key ?? null);

        setTimeout(() => this.updateActiveFromPositions(), 0);
      });

      return;
    }

    // Cache can be stale: try a one-time refresh before 404
    if (!this.forceListRefreshTried) {
      this.forceListRefreshTried = true;
      this.qs.clearCache();
      this.qs.loadSystemDesign().subscribe((list) => {
        this.all = (list as SDQuestion[]) ?? [];
        this.setCurrentById(id, /*allowPending*/ false);
      });
      return;
    }

    // If the list is still missing the id, try loading detail directly
    this.qs.loadSystemDesignQuestion(id).subscribe(detail => {
      if (!detail) {
        if (this.all.length) this.navTo404();
        return;
      }

      const merged: SDQuestion = {
        id,
        title: detail.title ?? id,
        description: detail.description ?? '',
        tags: detail.tags ?? [],
        type: detail.type ?? 'system-design',
        access: (detail as any).access ?? 'free',
        ...(detail as Partial<SDQuestion>),
      };

      this.q.set(merged);
      this.updateSeo(merged);

      const secs = this.sections();
      this.activeKey.set(secs[0]?.key ?? null);
      setTimeout(() => this.updateActiveFromPositions(), 0);
    });
  }

  /** Send the user to the NotFound page with the missing URL preserved. */
  private navTo404() {
    const missing = this.router.url;
    if (this.isBrowser) {
      try { sessionStorage.setItem('fa:lastMissing', missing); } catch { }
    }
    // replaceUrl so Back returns to the last valid page instead of the bad URL
    this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
  }

  private sdDescription(q: SDQuestion): string {
    const plain = (q.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain || `Front-end system design scenario: ${q.title}`;
  }

  private normalizePreviewText(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/`+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private trimWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}…`;
  }

  private sdKeywords(q: SDQuestion): string[] {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const base = ['front end system design', 'ui architecture interview'];
    return Array.from(
      new Set([...base, ...tags].map(k => String(k || '').trim()).filter(Boolean))
    );
  }

  private updateSeo(question: SDQuestion): void {
    if (this.suppressSeo) return;
    const canonical = this.seo.buildCanonicalUrl(`/system-design/${question.id}`);
    const description = this.sdDescription(question);
    const keywords = this.sdKeywords(question);

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'System design',
          item: this.seo.buildCanonicalUrl('/system-design'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: question.title,
          item: canonical,
        },
      ],
    };

    const article = {
      '@type': 'Article',
      '@id': canonical,
      headline: question.title,
      description,
      mainEntityOfPage: canonical,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: 'FrontendAtlas' },
      isAccessibleForFree: question.access !== 'premium',
      keywords: keywords.join(', '),
    };

    this.seo.updateTags({
      title: question.title,
      description,
      keywords,
      canonical,
      ogType: 'article',
      jsonLd: [breadcrumb, article],
    });
  }

  /** Height to keep clear for the fixed header + breathing room */
  private headerOffset(): number {
    if (!this.isBrowser) return 76;
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top').trim();
    const base = parseInt(raw || '64', 10);
    return (isNaN(base) ? 64 : base) + 12;
  }

  /** Switch a tad earlier than the header line to feel natural */
  private leadBeforeHeader(): number { return 96; }

  /** Choose the last heading whose absolute top is <= scroll line; force last when near bottom. */
  private updateActiveFromPositions = () => {
    if (!this.isBrowser || !this.heads) return;
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
    if (!this.isBrowser) return;
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
    if (!this.isBrowser) return;
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

  get hasPrev(): boolean {
    return this.idx > 0;
  }

  get hasNext(): boolean {
    return this.idx < this.all.length - 1;
  }

  get progressText(): string {
    return this.all.length ? ` ${this.idx + 1} / ${this.all.length}` : '';
  }

  private navToIndex(index: number) {
    const target = this.all[index];
    if (!target) return;
    // this triggers route change -> paramMap subscription -> setCurrentById
    this.router.navigate(['/system-design', target.id]);
  }

  onPrev() {
    if (!this.hasPrev) return;
    this.navToIndex(this.idx - 1);
  }

  onNext() {
    if (!this.hasNext) return;
    this.navToIndex(this.idx + 1);
  }
}
