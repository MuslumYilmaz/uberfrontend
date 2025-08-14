// src/app/features/coding-detail/coding-detail.component.ts
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { combineLatest, Subscription } from 'rxjs';
import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import {
  ConsoleLoggerComponent,
  TestResult,
} from '../console-logger/console-logger.component';

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

  // Main right-pane embed (Angular only)
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

  // spinner timing guards (to avoid flicker)
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

  // Preview modal
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
    private zone: NgZone
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
  }

  private loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);

    // JS editor/test state
    this.editorContent.set(q.starterCode ?? '');
    this.testCode.set(((q as any).tests as string) ?? '');
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);

    // Main embed for Angular (code + preview)
    if (this.tech === 'angular' && (q as any).stackblitzEmbedUrl) {
      this.embedSpinnerStartedAt = performance.now();
      this.embedLoading.set(true);
      const main = this.toMainEmbed((q as any).stackblitzEmbedUrl as string);
      this.embedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(main));
    } else {
      this.embedUrl.set(null);
      this.embedLoading.set(false);
    }
  }

  showSolution() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.solution ?? '');
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

  // vertical drag handlers
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

  // horizontal drag
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

  // helpers for code transformation
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

  // ---------- StackBlitz URL helpers ----------
  // Main embed: code + preview, hide explorer/header/footer
  private toMainEmbed(base: string): string {
    const u = new URL(base);
    u.searchParams.set('embed', '1');
    u.searchParams.set('view', 'both');
    u.searchParams.set('hideNavigation', '1');
    u.searchParams.set('terminalHeight', '0');
    u.searchParams.set('forceEmbedLayout', '1');
    return u.toString();
  }

  // Preview-only modal: uses **stackblitzSolutionUrl**
  private toPreviewOnly(base: string): string {
    const u = new URL(base);
    u.searchParams.set('embed', '1');
    u.searchParams.set('view', 'preview');        // preview-only
    u.searchParams.set('hideExplorer', '1');
    u.searchParams.set('hideNavigation', '1');
    u.searchParams.set('hideDevTools', '1');
    u.searchParams.set('terminalHeight', '0');
    u.searchParams.set('forceEmbedLayout', '1');
    u.searchParams.set('ctl', '0');               // hide view controls if present
    u.searchParams.delete('file');                // ensure no editor view is forced
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
    // clear iframe after close
    setTimeout(() => {
      this.previewOnlyUrl = null;
      this.previewLoading.set(false);
    }, 200);
  }

  // called by (load) on main iframe
  onEmbedLoad() {
    const elapsed = performance.now() - this.embedSpinnerStartedAt;
    const remaining = Math.max(0, this.EMBED_MIN_SPINNER_MS - elapsed);
    setTimeout(() => this.embedLoading.set(false), remaining);
  }

  // called by (load) on preview iframe
  onPreviewLoad() {
    const elapsed = performance.now() - this.previewSpinnerStartedAt;
    const remaining = Math.max(0, this.PREVIEW_MIN_SPINNER_MS - elapsed);
    setTimeout(() => this.previewLoading.set(false), remaining);
  }

  /** Jump to the custom test cases editor (the top "Test cases" tab) */
  goToCustomTests(e?: Event) {
    if (e) e.preventDefault();
    this.topTab.set('tests');       // switch the top-right editor to "Test cases"
    this.subTab.set('tests');       // ensure bottom panel is on "Tests"
  }

  resetQuestion() {
    const q = this.question();
    if (!q) return;

    // Restore starter code / tests
    this.editorContent.set(q.starterCode ?? '');
    this.testCode.set(((q as any).tests as string) ?? '');

    // Reset state
    this.hasRunTests = false;
    this.testResults.set([]);
    this.subTab.set('tests');      // go back to Tests tab in the bottom area
    this.topTab.set('code');       // show code editor on top area

    // Best-effort: clear console if the component exposes a clear/reset API
    try {
      (this.consoleLogger as any)?.clear?.();
      (this.consoleLogger as any)?.reset?.();
    } catch {
      // noop
    }
  }
}
