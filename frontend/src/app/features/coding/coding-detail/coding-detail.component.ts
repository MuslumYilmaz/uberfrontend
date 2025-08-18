import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, computed, effect, ElementRef, NgZone,
  OnDestroy, OnInit, signal, ViewChild, WritableSignal
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { combineLatest, Subscription } from 'rxjs';
import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { StackBlitzEmbed } from '../../../core/services/stackblitz-embed.service';
import { matchesBaseline, normalizeSdkFiles } from '../../../core/utils/snapshot.utils';
import { getJsBaselineKey, getJsKey, getNgBaselineKey, getNgStorageKey } from '../../../core/utils/storage-keys';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, AccordionModule, ButtonModule, DialogModule,
    ProgressSpinnerModule, MonacoEditorComponent, ConsoleLoggerComponent,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: string;
  question = signal<Question | null>(null);

  @ViewChild('sbHost', { read: ElementRef }) sbHost?: ElementRef<HTMLDivElement>;
  private sbVm: any | null = null;
  private embedCleanup?: () => void;

  embedUrl: WritableSignal<SafeResourceUrl | null> = signal(null);

  // JS editor/test state
  editorContent = signal<string>('');
  testCode = signal<string>('');

  // UI state
  topTab = signal<'code' | 'tests'>('code');
  activePanel = signal<number>(0);
  subTab = signal<'tests' | 'console'>('tests');
  editorRatio = signal(0.6);
  horizontalRatio = signal(0.3);
  copiedExamples = signal(false);
  isDraggingVertical = signal(false);
  isDraggingHorizontal = signal(false);

  // loading / reset
  embedLoading = signal(false);
  previewLoading = signal(false);
  resetting = signal(false);

  // banner
  showRestoreBanner = signal(false);

  private jsSaveTimer: any = null;

  allQuestions: Question[] = [];
  currentIndex = 0;

  testResults = signal<TestResult[]>([]);
  hasRunTests = false;
  private testsSub?: Subscription;

  private _consoleLogger?: ConsoleLoggerComponent;
  @ViewChild(ConsoleLoggerComponent)
  set consoleLogger(c: ConsoleLoggerComponent | undefined) {
    this._consoleLogger = c;
    if (c) {
      this.testsSub?.unsubscribe();
      this.testsSub = c.testsFinished.subscribe((results) => this.testResults.set(results));
    }
  }
  get consoleLogger() { return this._consoleLogger; }

  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;
  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;

  // Preview modal
  previewVisible = false;
  previewOnlyUrl: SafeResourceUrl | null = null;

  // computed
  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  failedCount = computed(() => this.testResults().filter(r => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);
  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');
  isTopCodeTab = computed(() => this.topTab() === 'code');
  isTopTestsTab = computed(() => this.topTab() === 'tests');

  descriptionText = computed(() => {
    const q = this.question();
    if (!q) return '';
    if (typeof q.description === 'object' && q.description !== null) {
      return (q.description as StructuredDescription).text || '';
    }
    return q.description || '';
  });
  descriptionExamples = computed(() => {
    const q = this.question();
    if (!q) return [] as string[];
    if (typeof q.description === 'object' && q.description !== null) {
      return ((q.description as StructuredDescription).examples || []) as string[];
    }
    return (q as any).examples || [];
  });
  combinedExamples = computed(() => {
    const exs = this.descriptionExamples();
    if (!exs || exs.length === 0) return '';
    return exs.map((ex: any, i: any) => `// Example ${i + 1}\n${ex.trim()}`).join('\n\n// --------\n\n');
  });

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private codeStore: CodeStorageService,
    private ngEmbed: StackBlitzEmbed
  ) { }

  ngOnInit() {
    combineLatest([this.route.parent!.paramMap, this.route.paramMap]).subscribe(([parentPm, childPm]) => {
      this.tech = parentPm.get('tech')!;
      this.horizontalRatio.set(this.tech === 'javascript' ? 0.5 : 0.3);

      const id = childPm.get('id')!;
      this.qs.loadQuestions(this.tech, 'coding').subscribe((list) => {
        this.allQuestions = list;
        this.loadQuestion(id);
      });
    });
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });
  }

  ngOnDestroy() {
    this.testsSub?.unsubscribe();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.body.style.overflow = '';
    if (this.embedCleanup) this.embedCleanup();
  }

  // ---------- load question ----------
  private async loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);

    let shouldShowBanner = false;

    if (this.tech !== 'angular') {
      // ----- JavaScript track -----
      const jsKey = getJsKey(q.id);
      const baseKey = getJsBaselineKey(q.id);

      const starter = q.starterCode ?? '';
      if (!localStorage.getItem(baseKey)) {
        try { localStorage.setItem(baseKey, JSON.stringify({ code: starter })); } catch { }
      }

      const savedRaw = localStorage.getItem(jsKey);
      const saved = savedRaw ? (() => { try { return JSON.parse(savedRaw); } catch { return null; } })() : null;

      if (saved?.code != null) {
        this.editorContent.set(saved.code);
        const base = JSON.parse(localStorage.getItem(baseKey) || '{"code":""}');
        if (saved.code !== base.code) shouldShowBanner = true;
      } else {
        this.editorContent.set(starter);
      }

      this.testCode.set(((q as any).tests as string) ?? '');
      // make sure any Angular VM is cleaned up
      if (this.embedCleanup) this.embedCleanup();
      this.sbVm = null;
      this.embedLoading.set(false);
    } else {
      // ----- Angular (StackBlitz SDK) -----
      this.embedLoading.set(true);

      const host = this.sbHost?.nativeElement;
      if (!host) { requestAnimationFrame(() => this.loadQuestion(id)); return; }

      if (this.embedCleanup) { this.embedCleanup(); this.embedCleanup = undefined; } // cleanup previous

      const meta = (q as any).sdk as { asset?: string; openFile?: string; storageKey?: string } | undefined;
      const storageKey = getNgStorageKey(q);
      const baselineKey = getNgBaselineKey(q);

      let files = this.loadSavedFiles(storageKey);
      let dependencies: Record<string, string> | undefined;
      let openFileFromAsset: string | undefined;

      if (!files && meta?.asset) {
        const asset = await this.ngEmbed.fetchAsset(meta.asset);
        if (asset) {
          files = asset.files;
          dependencies = asset.dependencies;
          openFileFromAsset = asset.openFile;
          try {
            localStorage.setItem(storageKey, JSON.stringify(files));
            if (!localStorage.getItem(baselineKey)) {
              localStorage.setItem(baselineKey, JSON.stringify(files));
            }
          } catch { /* ignore */ }
        }
      }

      if (files) {
        // compare vs baseline
        let baseline: Record<string, string> | null = null;
        const baseRaw = localStorage.getItem(baselineKey);
        if (baseRaw) baseline = normalizeSdkFiles(JSON.parse(baseRaw));
        if (!baseline && meta?.asset) {
          const asset = await this.ngEmbed.fetchAsset(meta.asset);
          baseline = asset?.files ?? null;
          try { if (asset?.files) localStorage.setItem(baselineKey, JSON.stringify(asset.files)); } catch { }
        }
        if (baseline && !matchesBaseline(files, baseline)) shouldShowBanner = true;
      }

      if (!files) files = {};

      host.innerHTML = '';
      const openFile = (meta?.openFile ?? openFileFromAsset ?? 'src/app/app.component.ts').replace(/^\/+/, '');

      const { vm, cleanup } = await this.ngEmbed.embedProject(host, {
        title: q.title || 'Angular question',
        files, dependencies, openFile, storageKey
      });
      this.sbVm = vm;
      this.embedCleanup = cleanup;
      this.embedLoading.set(false);
    }

    // reset UI + set banner
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.showRestoreBanner.set(shouldShowBanner);
  }

  private loadSavedFiles(storageKey: string): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return normalizeSdkFiles(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  // ---------- JS code save on edit ----------
  onJsCodeChange(code: string) {
    this.editorContent.set(code);
    const q = this.question();
    if (!q || this.tech === 'angular') return;

    clearTimeout(this.jsSaveTimer);
    this.jsSaveTimer = setTimeout(() => {
      this.codeStore.saveJs(q.id, code, 'js');
      try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code })); } catch { }
    }, 350);
  }
  private persistJsEffect = effect(() => {
    const q = this.question();
    if (!q || this.tech === 'angular') return;
    try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code: this.editorContent() })); } catch { }
  });

  // ---------- banner actions ----------
  dismissRestoreBanner() { this.showRestoreBanner.set(false); }
  async resetFromBanner() { await this.resetQuestion(); this.showRestoreBanner.set(false); }

  // ---------- misc actions ----------
  showSolution() {
    const q = this.question();
    if (!q) return;
    const solution = q.solution ?? '';
    this.editorContent.set(solution);
    if (this.tech !== 'angular') {
      try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code: solution })); } catch { }
    }
    this.activePanel.set(1);
    this.topTab.set('code');
  }

  prev() {
    if (this.currentIndex > 0) {
      const prevId = this.allQuestions[this.currentIndex - 1].id;
      location.pathname = `/${this.tech}/coding/${prevId}`;
    }
  }
  next() {
    if (this.currentIndex + 1 < this.allQuestions.length) {
      const nextId = this.allQuestions[this.currentIndex + 1].id;
      location.pathname = `/${this.tech}/coding/${nextId}`;
    }
  }

  private waitForSandboxReady(timeoutMs = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.consoleLogger?.ready && this.consoleLogger.ready()) { resolve(); return; }
      const start = Date.now();
      const timer = setInterval(() => {
        if (this.consoleLogger?.ready && this.consoleLogger.ready()) { clearInterval(timer); resolve(); }
        else if (Date.now() - start > timeoutMs) { clearInterval(timer); reject(new Error('Sandbox not ready')); }
      }, 50);
    });
  }

  async runTests() {
    const q = this.question();
    if (!q) return;

    this.subTab.set('console');
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    if (!this.consoleLogger) return;
    try { await this.waitForSandboxReady(); } catch { return; }

    const rawTestCode = this.testCode();
    const testCodeTransformed = this.transformTestCode(rawTestCode, q.id);
    const wrappedUserCode = this.wrapExportDefault(this.editorContent(), q.id);

    this.consoleLogger.runWithTests(wrappedUserCode, testCodeTransformed);
    this.hasRunTests = true;
    this.subTab.set('tests');
  }

  submitCode() { console.log('Submit:', this.editorContent()); }
  get progressText() { return `${this.currentIndex + 1} / ${this.allQuestions.length}`; }

  // ---------- drag splitters ----------
  startDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.dragging = true;
    this.isDraggingHorizontal.set(true);
    this.startY = ev.clientY;
    this.startRatio = this.editorRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.dragging = false; this.isDraggingHorizontal.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };
  private onPointerMove = (ev: PointerEvent) => {
    if (this.draggingHorizontal) { this.onPointerMoveHorizontal(ev); return; }
    if (!this.dragging || !this.splitContainer) return;
    const rect = this.splitContainer!.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startY;
    const newEditorPx = rect.height * this.startRatio + delta;
    let newRatio = newEditorPx / rect.height;
    newRatio = Math.max(0.2, Math.min(0.9, newRatio));
    this.zone.run(() => this.editorRatio.set(newRatio));
  };
  private onPointerUp = () => { if (this.dragging) this.dragging = false; if (this.draggingHorizontal) this.draggingHorizontal = false; };

  startHorizontalDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingHorizontal = true;
    this.startX = ev.clientX;
    this.startRatioH = this.horizontalRatio();
    this.copiedExamples.set(true);
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingHorizontal = false; this.copiedExamples.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };
  private onPointerMoveHorizontal = (ev: PointerEvent) => {
    if (!this.draggingHorizontal) return;
    const totalWidth = window.innerWidth;
    const delta = ev.clientX - this.startX;
    let newRatio = this.startRatioH + delta / totalWidth;
    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
    this.zone.run(() => this.horizontalRatio.set(newRatio));
  };

  // ---------- helpers for test scaffolding ----------
  private sanitizeGlobalName(id: string) { return id.replace(/[^a-zA-Z0-9_]/g, '_'); }
  private wrapExportDefault(code: string, id: string) {
    const globalName = this.sanitizeGlobalName(id);
    let transformed = code;
    transformed = transformed.replace(/export\s+default\s+function\s+([\w$]+)\s*\(/, (_m, name) => `function ${name}(`);
    const named = code.match(/export\s+default\s+function\s+([\w$]+)\s*\(/);
    if (named) { const fn = named[1]; transformed += `\nif (typeof ${fn} !== 'undefined') { globalThis.${globalName} = ${fn}; }`; return transformed; }
    transformed = transformed.replace(/export\s+default\s+async\s+function\s+([\w$]+)\s*\(/, (_m, name) => `async function ${name}(`);
    const asyncNamed = code.match(/export\s+default\s+async\s+function\s+([\w$]+)\s*\(/);
    if (asyncNamed) { const fn = asyncNamed[1]; transformed += `\nif (typeof ${fn} !== 'undefined') { globalThis.${globalName} = ${fn}; }`; return transformed; }
    if (/export\s+default/.test(transformed)) {
      transformed = transformed.replace(/export\s+default\s+/, `globalThis.${globalName} = `);
    }
    return transformed;
  }
  private transformTestCode(raw: string, questionId: string) {
    let code = raw.replace(/^import\s+([\w$]+)\s+from\s+['"][^'"]+['"];?\s*$/gm, () => '');
    const globalName = this.sanitizeGlobalName(questionId);
    code = code.replace(/\b([A-Za-z_$][\w$]*)\b/g, (id) => {
      if (id === questionId || id === this.toCamelCase(questionId)) return `globalThis.${globalName}`;
      return id;
    });
    return code;
  }
  private toCamelCase(str: string) { return str.replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : '')); }

  // ---------- preview helpers ----------
  private toPreviewOnly(base: string): string {
    const u = new URL(base);
    u.searchParams.set('embed', '1');
    u.searchParams.set('view', 'preview');
    u.searchParams.set('hideExplorer', '1');
    u.searchParams.set('hideNavigation', '1');
    u.searchParams.set('hideDevTools', '1');
    u.searchParams.set('terminalHeight', '0');
    u.searchParams.set('forceEmbedLayout', '1');
    u.searchParams.set('ctl', '0');
    u.searchParams.delete('file');
    return u.toString();
  }
  openPreview() {
    const q = this.question();
    if (!q || this.tech !== 'angular') return;
    const base = ((q as any).stackblitzSolutionUrl as string | undefined) ?? ((q as any).stackblitzEmbedUrl as string | undefined);
    if (!base) return;
    this.previewLoading.set(true);
    const url = this.toPreviewOnly(base);
    this.previewOnlyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewVisible = true;
  }
  closePreview() {
    this.previewVisible = false;
    setTimeout(() => { this.previewOnlyUrl = null; this.previewLoading.set(false); }, 200);
  }

  // ---------- resets ----------
  async resetQuestion() {
    const q = this.question();
    if (!q || this.resetting()) return;

    this.resetting.set(true);
    try {
      if (this.tech !== 'angular') {
        localStorage.removeItem(getJsKey(q.id));
        this.editorContent.set(q.starterCode ?? '');
        this.testCode.set(((q as any).tests as string) ?? '');
      } else {
        const storageKey = getNgStorageKey(q);
        localStorage.removeItem(storageKey);
        this.embedLoading.set(true);

        const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
        if (this.sbVm && meta?.asset) {
          try {
            const asset = await this.ngEmbed.fetchAsset(meta.asset);
            const openFile = (meta.openFile ?? asset?.openFile ?? 'src/app/app.component.ts').replace(/^\/+/, '');
            if (asset?.files) {
              await this.ngEmbed.replaceFromAsset(this.sbVm, asset.files, openFile, storageKey);
            }
          } finally {
            // 🔧 ensure spinner clears even if fetch/apply fails
            this.embedLoading.set(false);
          }
        } else {
          // Re-embed from scratch; loadQuestion will clear embedLoading on completion (see fix #2)
          requestAnimationFrame(() => this.loadQuestion(q.id));
        }
      }

      this.hasRunTests = false;
      this.testResults.set([]);
      this.subTab.set('tests');
      this.topTab.set('code');
      this.showRestoreBanner.set(false);

      (this.consoleLogger as any)?.clear?.();
      (this.consoleLogger as any)?.reset?.();
    } finally {
      this.resetting.set(false);
    }
  }

  copyExamples() {
    const examples = this.combinedExamples();
    if (!examples) return;
    navigator.clipboard
      .writeText(examples)
      .then(() => {
        this.copiedExamples.set(true);
        setTimeout(() => this.copiedExamples.set(false), 1200);
      })
      .catch((e) => {
        console.warn('Copy failed', e);
      });
  }

  // CTA helper
  goToCustomTests(e?: Event) { if (e) e.preventDefault(); this.topTab.set('tests'); this.subTab.set('tests'); }
}