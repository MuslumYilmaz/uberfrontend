import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit,
  QueryList, ViewChildren, WritableSignal, computed, inject, signal
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
  | { type: 'image'; src: string; alt?: string; caption?: string; width?: number };

type RadioSection = { key: string; title: string; content?: string; blocks?: Block[]; };
type SDQuestion = Question & { radio?: RadioSection[]; reflect?: string; assumptions?: string; diagram?: string; interface?: string; operations?: string; };

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

  /** Monaco viewer options (compact, readable) */
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

  // ---- lifecycle ----
  ngOnInit(): void {
    this.qs.loadSystemDesign().subscribe((list) => {
      this.all = list as SDQuestion[];
      const id = this.route.snapshot.paramMap.get('id')!;
      this.setCurrentById(id);
    });
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) this.setCurrentById(id);
    });
  }

  ngAfterViewInit(): void {
    this.heads.changes.subscribe(() => setTimeout(() => this.updateActiveFromPositions(), 0));
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    setTimeout(() => this.updateActiveFromPositions(), 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    clearInterval(this.settleWatcher);
  }

  // ---- helpers ----
  asset(path: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `assets/${path.replace(/^\/+/, '')}`;
  }

  private setCurrentById(id: string) {
    const pos = this.all.findIndex(x => x.id === id);
    if (pos >= 0) {
      this.idx = pos;
      this.q.set(this.all[pos]);
      // default active: first section
      this.activeKey.set(this.sections()[0]?.key ?? null);
      setTimeout(() => this.updateActiveFromPositions(), 0);
    }
  }

  /** Height to keep clear for the fixed header + breathing room */
  private headerOffset(): number {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-safe-top')
      .trim();
    const base = parseInt(raw || '64', 10);
    return (isNaN(base) ? 64 : base) + 12;
  }

  /** We switch a little earlier than the header line to feel natural */
  private leadBeforeHeader(): number {
    return 96; // px before the header line to flip active section
  }

  /** Choose the last heading whose absolute top is <= scroll line (header + lead). */
  private updateActiveFromPositions = () => {
    if (!this.heads) return;

    const nodes = this.heads.toArray().map(h => h.nativeElement);
    if (!nodes.length) return;

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
    if (this.isProgrammaticScroll) return; // ignore while we’re auto-scrolling
    this.updateActiveFromPositions();
  };

  /** smooth scroll to section with offset and a true “settle” guard */
  scrollToKey(key: string) {
    const el = document.getElementById(this.anchorId(key));
    if (!el) return;

    // optimistic highlight immediately
    this.activeKey.set(key);

    // compute target (slightly above header to feel earlier)
    const target = el.getBoundingClientRect().top + window.pageYOffset - (this.headerOffset() + 8);
    this.programScrollTarget = Math.max(0, target);
    this.isProgrammaticScroll = true;

    // fire smooth scroll
    window.scrollTo({ top: this.programScrollTarget, behavior: 'smooth' });

    // watch until scroll stabilizes near target (or timeout)
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
