import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
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
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import {
  ConsoleLoggerComponent,
  TestResult,
} from '../console-logger/console-logger.component';

// --- StackBlitz SDK ---
import sdk from '@stackblitz/sdk';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    MonacoEditorComponent,
    ConsoleLoggerComponent,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: string;
  question = signal<Question | null>(null);

  // Main right-pane embed (Angular only - now SDK host)
  @ViewChild('sbHost', { read: ElementRef }) sbHost?: ElementRef<HTMLDivElement>;
  private sbVm: any | null = null;
  private sbSaveTimer: any = null;
  private sbBeforeUnload?: () => void;

  // (kept) for preview modal (optional)
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

  // loading spinners
  embedLoading = signal(false);
  previewLoading = signal(false);
  private jsSaveTimer: any = null;

  // spinner timing guards (to avoid flicker for iframe preview modal)
  private embedSpinnerStartedAt = 0;
  private previewSpinnerStartedAt = 0;
  private readonly EMBED_MIN_SPINNER_MS = 1200;
  private readonly PREVIEW_MIN_SPINNER_MS = 1200;

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
      this.testsSub = c.testsFinished.subscribe((results) => {
        this.testResults.set(results);
      });
    }
  }
  get consoleLogger() {
    return this._consoleLogger;
  }

  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;

  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;

  // Preview modal (kept for your preview-only dialog)
  previewVisible = false;
  previewOnlyUrl: SafeResourceUrl | null = null;

  // computed
  passedCount = computed(() => this.testResults().filter((r) => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  failedCount = computed(() => this.testResults().filter((r) => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);
  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');
  isTopCodeTab = computed(() => this.topTab() === 'code');
  isTopTestsTab = computed(() => this.topTab() === 'tests');

  // normalized description / examples
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
    private codeStore: CodeStorageService
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

    if (this.sbSaveTimer) clearInterval(this.sbSaveTimer);
    if (this.sbBeforeUnload) {
      window.removeEventListener('beforeunload', this.sbBeforeUnload);
    }
  }

  // ---------- keys & defaults (Angular via SDK) ----------
  private angularKey(id: string) {
    return `v1:code:ng:${id}`;
  }

  private defaultAngularFiles(title: string) {

  }

  // ---------- load question ----------
  private async loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);

    // ----- JS state / restore -----
    const jsKey = `v1:code:js:${q.id}`;
    const savedJsRaw = (this.tech !== 'angular') ? localStorage.getItem(jsKey) : null;
    const savedJs = savedJsRaw ? (() => { try { return JSON.parse(savedJsRaw); } catch { return null; } })() : null;

    if (this.tech !== 'angular' && savedJs?.code) {
      this.editorContent.set(savedJs.code as string);
    } else {
      this.editorContent.set(q.starterCode ?? '');
    }
    this.testCode.set(((q as any).tests as string) ?? '');

    // ----- UI reset -----
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);

    // ----- Angular via StackBlitz SDK (asset-driven) -----
    if (this.tech === 'angular') {
      this.embedLoading.set(true);

      const host = this.sbHost?.nativeElement;
      if (!host) {
        requestAnimationFrame(() => this.loadQuestion(id));
        return;
      }

      // cleanup autosave/listeners
      if (this.sbSaveTimer) clearInterval(this.sbSaveTimer);
      if (this.sbBeforeUnload) {
        window.removeEventListener('beforeunload', this.sbBeforeUnload);
        this.sbBeforeUnload = undefined;
      }

      const meta = (q as any).sdk as { asset?: string; openFile?: string; storageKey?: string } | undefined;
      const storageKey = this.getNgStorageKey(q);

      // 1) try saved snapshot first
      let files = this.loadSavedFiles(storageKey);
      let dependencies: Record<string, string> | undefined;
      let openFileFromAsset: string | undefined;

      // 2) else seed from asset
      if (!files && meta?.asset) {
        const asset = await this.fetchSdkAsset(meta.asset);
        if (asset) {
          files = asset.files;
          dependencies = asset.dependencies;
          openFileFromAsset = asset.openFile;
          localStorage.setItem(storageKey, JSON.stringify(files)); // persist initial seed
        }
      }

      // 3) last-resort tiny inline fallback (only if asset is missing/unreachable)
      if (!files) {
        files = {};
      }

      // clear host & embed
      host.innerHTML = '';
      const openFile =
        (meta?.openFile ?? openFileFromAsset ?? 'src/app/app.component.ts').replace(/^\/+/, '');

      sdk.embedProject(
        host,
        {
          title: q.title || 'Angular question',
          description: 'Embedded via StackBlitz SDK',
          template: 'angular-cli',
          files,
          dependencies // <-- from asset if present
        },
        {
          height: '100%',
          openFile
        }
      )
        .then((vm: any) => {
          this.sbVm = vm;

          const saveNow = async () => {
            try {
              const snap = await vm.getFsSnapshot();
              localStorage.setItem(storageKey, JSON.stringify(snap));
            } catch { /* ignore */ }
          };

          // periodic snapshot
          this.sbSaveTimer = window.setInterval(saveNow, 5000);

          // save on page unload
          this.sbBeforeUnload = () => { try { void saveNow(); } catch { } };
          window.addEventListener('beforeunload', this.sbBeforeUnload);

          this.embedLoading.set(false);
        })
        .catch((e) => {
          console.error('StackBlitz embed failed', e);
          this.embedLoading.set(false);
        });
    } else {
      // Non-Angular
      this.sbVm = null;
      this.embedLoading.set(false);
    }
  }

  // --- helpers for Angular SDK storage ---
  private getNgStorageKey(q: Question) {
    const meta = (q as any).sdk as { storageKey?: string } | undefined;
    return meta?.storageKey ?? `v2:ui:angular:${q.id}`;
  }

  /** Accepts either a pure snapshot { 'src/...': 'code' }
   *  or a v2 asset { version:'v2', files:{ '/src/...': {code:''} } }
   *  and normalizes to { 'src/...': 'code' } for embedProject.
   */
  private normalizeSdkFiles(raw: any): Record<string, string> {
    const source = raw?.files ?? raw ?? {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(source)) {
      const path = k.replace(/^\/+/, ''); // drop any leading slash
      const code = typeof v === 'string' ? v : (v as any)?.code ?? '';
      out[path] = code;
    }
    // Make sure zone.js is imported in main.ts
    if (out['src/main.ts'] && !/zone\.js/.test(out['src/main.ts'])) {
      out['src/main.ts'] = `import 'zone.js';\n${out['src/main.ts']}`;
    }
    return out;
  }

  private loadSavedFiles(storageKey: string): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return this.normalizeSdkFiles(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  // --- helpers for Angular SDK storage ---
  private async fetchSdkAsset(assetUrl: string): Promise<{
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
  } | null> {
    try {
      const res = await fetch(assetUrl, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      const files = this.normalizeSdkFiles(json);
      const dependencies = (json?.dependencies ?? undefined) as Record<string, string> | undefined;
      const openFile = (json?.openFile as string | undefined) ?? undefined;
      return { files, dependencies, openFile };
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
      try { localStorage.setItem(`v1:code:js:${q.id}`, JSON.stringify({ code })); } catch { }
    }, 350);
  }

  // extra: reactive persistence (also catches loadSolution)
  private persistJsEffect = effect(() => {
    const q = this.question();
    if (!q || this.tech === 'angular') return;

    const code = this.editorContent();
    try {
      localStorage.setItem(`v1:code:js:${q.id}`, JSON.stringify({ code }));
    } catch { /* ignore */ }
  });

  // ---------- misc actions ----------
  showSolution() {
    const q = this.question();
    if (!q) return;

    const solution = q.solution ?? '';
    this.editorContent.set(solution);
    if (this.tech !== 'angular') {
      try { localStorage.setItem(`v1:code:js:${q.id}`, JSON.stringify({ code: solution })); } catch { }
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
      if (this.consoleLogger?.ready && this.consoleLogger.ready()) {
        resolve();
        return;
      }
      const start = Date.now();
      const interval = setInterval(() => {
        if (this.consoleLogger?.ready && this.consoleLogger.ready()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error('Sandbox not ready after timeout'));
        }
      }, 50);
    });
  }

  async runTests() {
    const q = this.question();
    if (!q) return;

    this.subTab.set('console');
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    if (!this.consoleLogger) {
      console.warn('Console logger not available');
      return;
    }

    try {
      await this.waitForSandboxReady();
    } catch (e) {
      console.warn('Sandbox not ready', e);
      return;
    }

    const rawTestCode = this.testCode();
    const testCodeTransformed = this.transformTestCode(rawTestCode, q.id);
    const wrappedUserCode = this.wrapExportDefault(this.editorContent(), q.id);

    this.consoleLogger.runWithTests(wrappedUserCode, testCodeTransformed);
    this.hasRunTests = true;
    this.subTab.set('tests');
  }

  submitCode() {
    console.log('Submit:', this.editorContent());
  }

  get progressText() {
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
  }

  // ---------- drag splitters ----------
  startDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.dragging = true;
    this.isDraggingHorizontal.set(true);
    this.startY = ev.clientY;
    this.startRatio = this.editorRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);

    const stopDragging = () => {
      this.dragging = false;
      this.isDraggingHorizontal.set(false);
      document.removeEventListener('pointerup', stopDragging);
    };

    document.addEventListener('pointerup', stopDragging);
  };

  private onPointerMove = (ev: PointerEvent) => {
    if (this.draggingHorizontal) {
      this.onPointerMoveHorizontal(ev);
      return;
    }
    if (!this.dragging || !this.splitContainer) return;
    const rect = this.splitContainer!.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startY;
    const newEditorPx = rect.height * this.startRatio + delta;
    let newRatio = newEditorPx / rect.height;
    newRatio = Math.max(0.2, Math.min(0.9, newRatio));
    this.zone.run(() => this.editorRatio.set(newRatio));
  };

  private onPointerUp = (_: PointerEvent) => {
    if (this.dragging) this.dragging = false;
    if (this.draggingHorizontal) this.draggingHorizontal = false;
  };

  startHorizontalDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingHorizontal = true;
    this.startX = ev.clientX;
    this.startRatioH = this.horizontalRatio();

    // Show splitter while dragging
    this.copiedExamples.set(true);

    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);

    const stopDragging = () => {
      this.draggingHorizontal = false;
      this.copiedExamples.set(false);
      document.removeEventListener('pointerup', stopDragging);
    };

    document.addEventListener('pointerup', stopDragging);
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
  private sanitizeGlobalName(id: string) {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private wrapExportDefault(code: string, id: string) {
    const globalName = this.sanitizeGlobalName(id);
    let transformed = code;

    transformed = transformed.replace(/export\s+default\s+function\s+([\w$]+)\s*\(/, (_m, name) => `function ${name}(`);

    const namedDefaultMatch = code.match(/export\s+default\s+function\s+([\w$]+)\s*\(/);
    if (namedDefaultMatch) {
      const fnName = namedDefaultMatch[1];
      transformed = transformed.replace(/export\s+default\s+function\s+([\w$]+)\s*\(/, (_m, name) => `function ${name}(`);
      transformed += `\nif (typeof ${fnName} !== 'undefined') { globalThis.${globalName} = ${fnName}; }`;
      return transformed;
    }

    transformed = transformed.replace(
      /export\s+default\s+async\s+function\s+([\w$]+)\s*\(/,
      (_m, name) => `async function ${name}(`
    );
    const asyncNamedMatch = code.match(/export\s+default\s+async\s+function\s+([\w$]+)\s*\(/);
    if (asyncNamedMatch) {
      const fnName = asyncNamedMatch[1];
      transformed += `\nif (typeof ${fnName} !== 'undefined') { globalThis.${globalName} = ${fnName}; }`;
      return transformed;
    }

    if (/export\s+default/.test(transformed)) {
      transformed = transformed.replace(/export\s+default\s+/, `globalThis.${globalName} = `);
    }

    return transformed;
  }

  private transformTestCode(raw: string, questionId: string) {
    let code = raw.replace(/^import\s+([\w$]+)\s+from\s+['"][^'"]+['"];?\s*$/gm, () => '');
    const globalName = this.sanitizeGlobalName(questionId);
    code = code.replace(/\b([A-Za-z_$][\w$]*)\b/g, (identifier) => {
      if (identifier === questionId || identifier === this.toCamelCase(questionId)) {
        return `globalThis.${globalName}`;
      }
      return identifier;
    });
    return code;
  }

  private toCamelCase(str: string) {
    return str.replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
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

  // ---------- StackBlitz URL helpers (kept for preview modal) ----------
  private toMainEmbed(base: string): string {
    const u = new URL(base);
    u.searchParams.set('embed', '1');
    u.searchParams.set('view', 'both');
    u.searchParams.set('hideNavigation', '1');
    u.searchParams.set('terminalHeight', '0');
    u.searchParams.set('forceEmbedLayout', '1');
    return u.toString();
  }

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

    const base =
      ((q as any).stackblitzSolutionUrl as string | undefined) ??
      ((q as any).stackblitzEmbedUrl as string | undefined);
    if (!base) return;

    this.previewSpinnerStartedAt = performance.now();
    this.previewLoading.set(true);

    const url = this.toPreviewOnly(base);
    this.previewOnlyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewVisible = true;
  }

  closePreview() {
    this.previewVisible = false;
    setTimeout(() => {
      this.previewOnlyUrl = null;
      this.previewLoading.set(false);
    }, 200);
  }

  onEmbedLoad() {
    const elapsed = performance.now() - this.embedSpinnerStartedAt;
    const remaining = Math.max(0, this.EMBED_MIN_SPINNER_MS - elapsed);
    setTimeout(() => this.embedLoading.set(false), remaining);
  }

  onPreviewLoad() {
    const elapsed = performance.now() - this.previewSpinnerStartedAt;
    const remaining = Math.max(0, this.PREVIEW_MIN_SPINNER_MS - elapsed);
    setTimeout(() => this.previewLoading.set(false), remaining);
  }

  /** Replace the running SDK project's files with the original asset snapshot. */
  private async replaceAngularFromAsset(q: Question) {
    const meta = (q as any).sdk as { asset?: string; openFile?: string; storageKey?: string } | undefined;
    if (!this.sbVm || !meta?.asset) return;

    // fresh asset snapshot
    const asset = await this.fetchSdkAsset(meta.asset);
    if (!asset?.files) return;

    const storageKey = this.getNgStorageKey(q);
    const newFiles = asset.files; // { 'src/...': 'code' }
    const openFile = (meta.openFile ?? asset.openFile ?? 'src/app/app.component.ts').replace(/^\/+/, '');

    // current snapshot
    const current = await this.sbVm.getFsSnapshot(); // { 'src/...': 'code' }

    // only destroy files that are NOT in newFiles
    const destroy = Object.keys(current).filter((p) => !(p in newFiles));

    // apply diff
    await this.sbVm.applyFsDiff({
      create: newFiles,   // overrides existing files
      destroy             // removes truly stale ones
    });

    // persist seed so autosave continues from this baseline
    localStorage.setItem(storageKey, JSON.stringify(newFiles));

    // Force the editor to “see” the file again:
    // 1) hop to a different file that exists
    const alt = Object.keys(newFiles).find(p => p !== openFile) || 'src/main.ts';
    try {
      await this.sbVm.setCurrentFile(alt);
      await new Promise(r => setTimeout(r, 16)); // let Monaco settle one frame
      await this.sbVm.setCurrentFile(openFile);
      // (optional) poke layout if available
      this.sbVm.editor?.layout?.();
    } catch { /* ignore */ }

    this.embedLoading.set(false);
  }

  /** Reset current question */
  async resetQuestion() {
    const q = this.question();
    if (!q) return;

    // JS track: clear saved code and restore starter
    if (this.tech !== 'angular') {
      localStorage.removeItem(`v1:code:js:${q.id}`);
      this.editorContent.set(q.starterCode ?? '');
      this.testCode.set(((q as any).tests as string) ?? '');
    } else {
      // Angular (SDK) track: hard reset to asset files
      const storageKey = this.getNgStorageKey(q);
      localStorage.removeItem(storageKey);

      this.embedLoading.set(true);

      // If the VM is alive, do an in-place replacement for a snappy reset
      if (this.sbVm) {
        try {
          await this.replaceAngularFromAsset(q);
        } catch (e) {
          console.warn('In-place reset failed, re-embedding…', e);
          // Fallback: re-embed from scratch
          requestAnimationFrame(() => this.loadQuestion(q.id));
        }
      } else {
        // If no VM yet, just re-embed (it will seed from asset)
        requestAnimationFrame(() => this.loadQuestion(q.id));
      }
    }

    // Common UI resets
    this.hasRunTests = false;
    this.testResults.set([]);
    this.subTab.set('tests');
    this.topTab.set('code');

    try {
      (this.consoleLogger as any)?.clear?.();
      (this.consoleLogger as any)?.reset?.();
    } catch { /* noop */ }
  }

  // add inside CodingDetailComponent class
  goToCustomTests(e?: Event) {
    if (e) e.preventDefault();
    this.topTab.set('tests');   // switch the top editor to "Test cases"
    this.subTab.set('tests');   // bottom panel => "Results"
  }

}