import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import type { Question } from '../../../../core/models/question.model';
import type { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { RestoreBannerComponent } from '../../../../shared/components/restore-banner/restore-banner';
import { ConsoleEntry, ConsoleLoggerComponent, LogLevel, TestResult } from '../../console-logger/console-logger.component';

@Component({
  selector: 'app-coding-web-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, ConsoleLoggerComponent, ButtonModule, RestoreBannerComponent],
  styles: [`
  :host { color: var(--uf-text-primary); }
  .web-panel { gap: var(--uf-space-3); }
  .web-card {
    background: var(--uf-surface);
    border: 1px solid var(--uf-border-subtle);
    border-radius: var(--uf-card-radius);
    box-shadow: var(--uf-card-shadow);
  }

  .panel-label {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--uf-text-secondary);
    border-bottom: 1px solid var(--uf-border-subtle);
    background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt));
    letter-spacing: 0.02em;
  }
  .panel-label.muted { color: color-mix(in srgb, var(--uf-text-secondary) 80%, transparent); }

  .panel-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--uf-border-subtle);
    background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
    font-size: 12px;
    line-height: 1.3;
  }

  .tab-btn {
    border: 1px solid transparent;
    background: transparent;
    color: var(--uf-text-secondary);
    padding: 6px 12px;
    border-radius: var(--uf-radius-pill);
    font-weight: 600;
    font-size: 12px;
    transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .tab-btn.active {
    color: var(--uf-text-primary);
    background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
    border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--uf-accent) 20%, transparent);
  }
  .tab-hint { margin-left: auto; color: var(--uf-text-tertiary); font-size: 11px; }

  .preview-actions {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pill-btn {
    padding: 6px 10px;
    border-radius: var(--uf-radius-pill);
    background: var(--uf-accent);
    border: 1px solid var(--uf-accent);
    color: var(--uf-bg);
    font-weight: 700;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--uf-accent) 38%, transparent);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  }
  .pill-btn:hover { background: var(--uf-accent-strong); }
  .pill-btn:active { transform: translateY(1px); }

  .solution-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: var(--uf-radius-pill);
    background: color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface));
    border: 1px solid color-mix(in srgb, var(--uf-accent) 60%, var(--uf-border-subtle));
    color: var(--uf-text-primary);
  }

  .empty-preview {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    color: var(--uf-text-tertiary);
    background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt));
  }

  .splitter{
    width:6px;
    background:transparent;
    cursor:col-resize;
    user-select:none;
    touch-action:none;
    position:relative;
    z-index:20;
    transition:background-color .15s;
  }
  .splitter:hover,
  .splitter.dragging{ background-color: color-mix(in srgb, var(--uf-accent) 40%, transparent); }

  .horizontal-splitter{
    height:5px;
    background:transparent;
    border-radius:var(--uf-radius-pill);
    cursor:row-resize;
    user-select:none;
    touch-action:none;
    position:relative;
    z-index:20;
    transition:background-color .15s;
  }
  .horizontal-splitter:hover,
  .horizontal-splitter.dragging{ background-color: color-mix(in srgb, var(--uf-accent) 40%, transparent); }

  /* Runner styles come from global .fa-runner-* and .fa-results classes */
`],
  template: `
<div class="web-panel w-full min-h-0 flex flex-col flex-1" data-testid="web-panel">
  <!-- Banner -->
  <app-restore-banner
    [isVisible]="showRestoreBanner()"
    [isSolution]="viewingSolution()"
    (reset)="resetFromBanner()"
    (dismiss)="dismissRestoreBanner()">
  </app-restore-banner>

  <div class="web-card fa-card fa-card--editor flex flex-col flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 flex">
      <!-- LEFT editors -->
      <div class="min-w-0 flex flex-col" [style.flex]="'0 0 ' + (webColsRatio()*100) + '%'">
        <div #splitContainer class="flex-1 min-h-0 flex flex-col">
          <div class="panel-label muted">&lt;html&gt; HTML</div>

          <div class="overflow-hidden" [style.flex]="'0 0 ' + (editorRatio()*100) + '%'" style="min-height:120px;">
            <app-monaco-editor class="h-full editor-fill" data-testid="web-html-editor"
                               [modelKey]="question ? 'q-' + question.id + '-html' : undefined"
                               [code]="webHtml()" [language]="'html'"
                               [options]="editorOptions"
                               (codeChange)="onHtmlChange($event)">
            </app-monaco-editor>
          </div>

          <div class="horizontal-splitter" [class.dragging]="isDraggingHorizontal()"
               (pointerdown)="startDrag($event)"></div>

          <div class="flex-1 min-h-0 flex flex-col">
            <div class="panel-label muted"># CSS</div>
            <app-monaco-editor class="flex-1 editor-fill" data-testid="web-css-editor"
                               [modelKey]="question ? 'q-' + question.id + '-css' : undefined"
                               [code]="webCss()" [language]="'css'"
                               [options]="editorOptions"
                               (codeChange)="onCssChange($event)">
            </app-monaco-editor>
          </div>
        </div>
      </div>

      <!-- MIDDLE splitter -->
      <div class="splitter" [class.dragging]="isDraggingCols()" (pointerdown)="startWebColumnDrag($event)"></div>

      <!-- RIGHT: top (Preview/Test code) + bottom (Results/Console) -->
      <div class="min-w-0 flex-1 flex flex-col">
        <div #previewSplit class="flex-1 flex flex-col overflow-hidden">
          <!-- TOP TABS -->
          <div class="panel-tabs">
            <button class="tab-btn" [class.active]="isPreviewTop()" (click)="previewTopTab.set('preview')">Preview</button>
            <button class="tab-btn" [class.active]="isTestCodeTop()" (click)="previewTopTab.set('testcode')">Test code</button>
            <div class="tab-hint">Live preview updates as you type</div>
          </div>

          <!-- TOP CONTENT -->
          <div [style.flex]="'0 0 ' + (previewRatio()*100) + '%'" class="relative min-h-[160px]">
            <div *ngIf="!previewUrl()" class="empty-preview" data-testid="web-preview-placeholder"
                 [style.display]="isPreviewTop() ? 'grid' : 'none'">
              Building preview…
            </div>

            <!-- WEB PREVIEW TOGGLE -->
            <div class="preview-actions">
              <!-- Show Preview button (when not showing solution) -->
              <button *ngIf="!showingSolutionPreview"
                      class="pill-btn"
                      (click)="openSolutionPreview()">
                Show preview
              </button>

              <!-- Close banner (when showing solution) -->
              <div *ngIf="showingSolutionPreview"
                   class="solution-banner">
                <span class="font-medium">Showing solution preview</span>
                <button class="text-xs underline" (click)="closeSolutionPreview()">Close preview</button>
              </div>
            </div>

            <iframe #previewFrame class="absolute inset-0 w-full h-full border-0 bg-white" data-testid="web-preview-iframe"
                    referrerpolicy="no-referrer"
                    sandbox="allow-scripts">
            </iframe>

            <div class="absolute inset-0" [style.display]="isTestCodeTop() ? 'block' : 'none'">
              <app-monaco-editor class="h-full" data-testid="web-tests-editor"
                                 [modelKey]="question ? 'q-' + question.id + '-web-tests' : undefined"
                                 [code]="testCode()" [language]="'javascript'"
                                 [options]="editorOptions"
                                 (codeChange)="testCode.set($event)">
              </app-monaco-editor>
            </div>
          </div>

          <!-- Splitter between TOP and BOTTOM -->
          <div class="horizontal-splitter" [class.dragging]="isDraggingRight()"
               (pointerdown)="startPreviewDrag($event)"></div>

          <!-- BOTTOM: Results / Console -->
	          <div class="results-shell fa-runner-shell flex-1 min-h-[140px] flex flex-col">
	            <div class="results-topbar fa-runner-topbar">
	              <button class="run-btn fa-runner-run-btn" data-testid="web-run-tests" (click)="runWebTests()" [disabled]="!hasAnyTests()"
	                      [title]="hasAnyTests() ? 'Run tests' : 'Add tests to enable'">▶ Run tests</button>
	              <button class="tab-btn fa-runner-tab-btn" [class.active]="isTestsTab()" (click)="subTab.set('tests')">Results</button>
	              <button class="tab-btn fa-runner-tab-btn" [class.active]="isConsoleTab()" (click)="subTab.set('console')">Console</button>
	              <span class="run-summary fa-runner-summary" *ngIf="hasRunTests && totalCount() > 0">
	                {{ passedCount() }}/{{ totalCount() }} passed
	              </span>
	            </div>

            <div class="flex-1 min-h-0 overflow-hidden">
              <!-- Results -->
	              <div *ngIf="isTestsTab()" class="h-full overflow-auto p-4 results-panel fa-results" data-testid="web-results-panel">
                <!-- 1) No tests -->
                <div class="h-full grid place-items-center text-xs empty-state" *ngIf="!hasAnyTests()">
                  No tests provided for this challenge yet.
                </div>
                <!-- 2) Not run yet -->
                <div class="h-full grid place-items-center text-xs empty-state"
                     *ngIf="hasAnyTests() && !hasRunTests">
                  Run tests to see results.
                </div>
                <!-- 3) Run -->
                <div *ngIf="hasAnyTests() && hasRunTests" class="space-y-2">
                  <div class="summary mb-2">
                    <strong>{{ passedCount() }}</strong>/<strong>{{ totalCount() }}</strong> passed
                    <span *ngIf="allPassing()" class="summary-pass">All tests passed ✓</span>
                    <span *ngIf="!allPassing()" class="summary-fail">Some tests failed</span>
                  </div>

	                  <div *ngFor="let t of testResults()" class="test-card border rounded-md" data-testid="test-result"
	                       [ngClass]="t.passed ? 'test-pass' : 'test-fail'">
	                    <div class="test-name">
	                      <i [ngClass]="t.passed ? 'pi pi-check-circle'
	                                             : 'pi pi-times-circle'"></i>
	                      <span class="sr-only" data-testid="test-status">{{ t.passed ? 'PASS' : 'FAIL' }}</span>
	                      <span>{{ t.name }}</span>
	                    </div>
	                    <div *ngIf="t.error" class="test-error whitespace-pre-wrap break-words">
	                      {{ t.error }}
	                    </div>
                  </div>
                </div>
              </div>

              <!-- Console -->
              <div [style.display]="isConsoleTab() ? 'flex' : 'none'" class="flex-1 min-h-0 flex flex-col">
                <app-console-logger class="flex-1 console-panel fa-results"
                                    [entries]="consoleEntries()" [results]="testResults()"
                                    [max]="500" [autoScroll]="true">
                </app-console-logger>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
})
export class CodingWebPanelComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() question!: Question;
  @Input() tech!: Tech;              // should be 'html' or 'css'
  @Input() editorOptions: any;
  @Input() storageKeyOverride: string | null = null;
  @Input() disablePersistence = false;

  constructor(
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private codeStorage: CodeStorageService
  ) { }

  // --- refs
  @ViewChild('previewFrame', { read: ElementRef }) previewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('previewSplit', { read: ElementRef }) previewSplit?: ElementRef<HTMLDivElement>;
  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;

  // --- state (copied from parent’s web section; unchanged logic) ---
  private htmlCode = signal<string>('');
  private cssCode = signal<string>('');
  webHtml = () => this.htmlCode();
  webCss = () => this.cssCode();
  private storageKeyFor(q: Question): string { return (this.storageKeyOverride || '').trim() || q.id; }

  testCode = signal<string>('');
  previewTopTab = signal<'preview' | 'testcode'>('preview');
  isPreviewTop = computed(() => this.previewTopTab() === 'preview');
  isTestCodeTop = computed(() => this.previewTopTab() === 'testcode');

  subTab = signal<'tests' | 'console'>('tests');
  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');

  editorRatio = signal(0.6);
  webColsRatio = signal(0.5);
  previewRatio = signal(0.7);

  isDraggingHorizontal = signal(false);
  isDraggingCols = signal(false);
  isDraggingRight = signal(false);

  viewingSolution = signal(false);

  // results/console
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  hasRunTests = false;
  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  failedCount = computed(() => this.testResults().filter(r => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);
  hasAnyTests = computed(() => !!(this.testCode()?.trim()));

  // preview
  private previewObjectUrl: string | null = null;
  private lastPreviewHtml: string | null = null;
  private _previewUrl = signal<SafeResourceUrl | null>(null);
  previewUrl = () => this._previewUrl();

  showingSolutionPreview = false;
  showRestoreBanner = signal(false);

  // timers & drag vars
  private webSaveTimer: any = null;
  private webPreviewTimer: any = null;
  private dragging = false; private startY = 0; private startRatio = 0;
  private draggingCols = false; private startXCols = 0; private startColsRatio = 0;
  private draggingPreview = false; private startYPreview = 0; private startPreviewRatio = 0;

  // computed preview doc = build from current editors
  previewDocRaw = computed(() => {
    const css = this.cssCode() ?? '';
    const html = this.unescapeJsLiterals(this.htmlCode() ?? '');
    return this.buildWebPreviewDoc(html, css);
  });
  private previewContentWindow: Window | null = null;
  private cachedPreviewFormMessagesForQuestionId: string | null = null;
  private cachedPreviewFormMessages: { valid: string | null; invalid: string | null } = { valid: null, invalid: null };

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['question'] && this.question) {
      void this.initFromQuestion();
    }
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp); // <-- add this
      window.addEventListener('message', this.onPreviewMessage);
    });

    this.previewContentWindow = this.previewFrame?.nativeElement.contentWindow ?? null;
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('message', this.onPreviewMessage);
    if (this.previewObjectUrl) try { URL.revokeObjectURL(this.previewObjectUrl); } catch { }
  }

  // -------- init from question (unchanged logic) --------
  private getWebStarters(q: any): { html: string; css: string } {
    const pick = (obj: any, paths: string[]) => {
      for (const p of paths) {
        const val = p.split('.').reduce((o: any, k: string) => (o && k in o ? o[k] : undefined), obj);
        if (typeof val === 'string' && val.trim()) return val;
      }
      return '';
    };
    const unesc = (s: string) => this.unescapeJsLiterals(s);
    const prettifyCss = (css: string) => this.prettifyCss(css);

    const htmlRaw = pick(q, ['web.starterHtml', 'starterHtml', 'htmlStarter', 'web.html', 'html']);
    let cssRaw = pick(q, ['web.starterCss', 'starterCss', 'cssStarter', 'web.css', 'css', 'starterStyles', 'styles', 'starterCSS']);
    if (!cssRaw) {
      // findCssLike:
      const scan = (o: any) => {
        if (!o || typeof o !== 'object') return '';
        for (const [k, v] of Object.entries(o)) {
          if (typeof v === 'string' && /css/i.test(k) && !/solution/i.test(k) && v.trim()) return v as string;
        }
        return '';
      };
      cssRaw = scan(q.web) || scan(q) || '';
    }
    return {
      html: unesc(htmlRaw) || `<!-- Start here: ${q.title ?? 'Challenge'} -->`,
      css: prettifyCss(unesc(cssRaw) || '')
    };
  }

  private getWebSolutions(q: any): { html: string; css: string } {
    const w = q.web ?? {};
    const html = w.solutionHtml ?? q.webSolutionHtml ?? q.solutionHtml ?? q.htmlSolution ?? w.htmlSolution ?? '';
    const css = w.solutionCss ?? q.webSolutionCss ?? q.solutionCss ?? q.cssSolution ?? w.cssSolution ?? '';
    const un = (s: any) => this.unescapeJsLiterals(String(s ?? ''));
    return { html: un(html), css: un(css) };
  }

  private getWebTests(q: any): string {
    const pick = (obj: any, paths: string[]) => {
      for (const p of paths) {
        const val = p.split('.').reduce((o: any, k: string) => (o && k in o ? o[k] : undefined), obj);
        if (typeof val === 'string' && val.trim()) return val;
      }
      return '';
    };
    return this.unescapeJsLiterals(pick(q, ['web.tests', 'tests', 'testsDom', 'testsHtml']) || '');
  }

  public async initFromQuestion(): Promise<void> {
    const q = this.question;
    if (!q) return;

    const starters = this.getWebStarters(q);

    // HTML/CSS come from shared IndexedDB-backed storage
    if (this.disablePersistence) {
      this.htmlCode.set(starters.html);
      this.cssCode.set(starters.css);
      this.showRestoreBanner.set(false);
    } else {
      const key = this.storageKeyFor(q);
      const { html, css, restored } = await this.codeStorage.initWebAsync(key, starters);

      this.htmlCode.set(html);
      this.cssCode.set(css);
      this.showRestoreBanner.set(restored);
    }

    this.testCode.set(this.getWebTests(q));
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    this.scheduleWebPreview();
  }


  // ---------- save + preview ----------
  onHtmlChange = (code: string) => {
    const q = this.question; if (!q) return;
    this.htmlCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      if (!this.disablePersistence) {
        const qid = this.question ? this.storageKeyFor(this.question) : null;
        if (qid) {
          void this.codeStorage.saveWebAsync(qid, 'html', code);
        }
      }
    }, 200);

    if (this.viewingSolution()) {
      this.viewingSolution.set(false);
      // keep banner visible for manual revert
    }

    this.exitSolutionPreview('user edited HTML');
    this.scheduleWebPreview();
  };

  onCssChange = (code: string) => {
    const q = this.question; if (!q) return;
    this.cssCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      if (!this.disablePersistence) {
        const qid = this.question ? this.storageKeyFor(this.question) : null;
        if (qid) {
          void this.codeStorage.saveWebAsync(qid, 'css', code);
        }
      }
    }, 200);

    if (this.viewingSolution()) {
      this.viewingSolution.set(false);
      // keep banner visible for manual revert
    }

    this.exitSolutionPreview('user edited CSS');
    this.scheduleWebPreview();
  }

  private scheduleWebPreview() {
    if (this.webPreviewTimer) clearTimeout(this.webPreviewTimer);
    this.webPreviewTimer = setTimeout(() => {
      try {
        this.exitSolutionPreview('rebuilding from editors');
        const htmlDoc = this.previewDocRaw();
        this.setPreviewHtml(htmlDoc);
      } catch (e) {
        console.error('web preview build failed', e);
        this.setPreviewHtml(null);
      }
    }, 120);
  }

  openSolutionPreview() {
    const q = this.question; if (!q || this.showingSolutionPreview) return;
    const sol = this.getWebSolutions(q);
    const html = this.unescapeJsLiterals(sol.html || '');
    const css = this.prettifyCss(this.unescapeJsLiterals(sol.css || ''));
    const full = this.buildWebPreviewDoc(html, css);
    this.setPreviewHtml(full);
    this.showingSolutionPreview = true;
    this.previewTopTab.set('preview');
  }
  closeSolutionPreview() {
    this.exitSolutionPreview('user closed banner');
    this.scheduleWebPreview();
  }
  private exitSolutionPreview(_reason?: string) {
    if (!this.showingSolutionPreview) return;
    this.showingSolutionPreview = false;
  }

  public async externalResetToDefault(): Promise<void> {
    const q = this.question; if (!q) return;

    const starters = this.getWebStarters(q);

    if (this.webSaveTimer) { clearTimeout(this.webSaveTimer); this.webSaveTimer = null; }

    if (!this.disablePersistence) {
      await this.codeStorage.resetWebBothAsync(this.storageKeyFor(q), starters);
    }

    this.htmlCode.set(starters.html);
    this.cssCode.set(starters.css);
    this.scheduleWebPreview();

    this.consoleEntries.set([]);
    this.testResults.set([]);
    this.hasRunTests = false;
    this.showRestoreBanner.set(false);
  }


  // ---------- tests ----------
  async runWebTests(): Promise<TestResult[]> {
    const q = this.question; if (!q) return [];

    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const code = (this.testCode() || '').trim();
    if (!code) {
      this.hasRunTests = true;
      this.testResults.set([]);
      return [];
    }

    const htmlDoc = this.previewDocRaw();
    const { frame, doc, win } = await this.mountScratchDoc(htmlDoc);

    const results: TestResult[] = [];
    const it = async (name: string, fn: () => any | Promise<any>) => {
      try { await fn(); results.push({ name, passed: true }); }
      catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
    };
    const test = it;
    const expect = this.makeDomExpect(doc, win);
    const q$ = (sel: string) => doc.querySelector(sel);
    const qa$ = (sel: string) => Array.from(doc.querySelectorAll(sel));

    try {
      const runner = new Function('document', 'window', 'it', 'test', 'expect', 'q', 'qa', code);
      await runner.call(undefined, doc, win, it, test, expect as any, q$, qa$);
    } catch (e: any) {
      results.unshift({ name: 'Failed to execute test file', passed: false, error: String(e?.message ?? e) });
    } finally {
      try { frame.remove(); } catch { }
    }

    this.testResults.set(results);
    this.hasRunTests = true;
    return results;
  }

  // ---------- banner actions ----------
  dismissRestoreBanner() { this.showRestoreBanner.set(false); }
  async resetFromBanner() { await this.resetQuestion(); this.showRestoreBanner.set(false); }

  async resetQuestion() {
    const q = this.question; if (!q) return;
    const starters = this.getWebStarters(q);

    if (this.webSaveTimer) { clearTimeout(this.webSaveTimer); this.webSaveTimer = null; }

    if (!this.disablePersistence) {
      await this.codeStorage.resetWebBothAsync(this.storageKeyFor(q), starters);
    }

    this.htmlCode.set(starters.html);
    this.cssCode.set(starters.css);
    this.scheduleWebPreview();

    this.consoleEntries.set([]);
    this.testResults.set([]);
    this.hasRunTests = false;
    this.showRestoreBanner.set(false);
  }

  // ---------- helpers (unchanged) ----------
  private makeDomExpect(doc: Document, win: Window) {
    const fmt = (v: any) => {
      try { if (v instanceof Element) return `<${v.tagName.toLowerCase()}>`; return JSON.stringify(v); }
      catch { return String(v); }
    };
    const expect = (received: any) => ({
      toBe: (exp: any) => { if (received !== exp) throw new Error(`Expected ${fmt(received)} to be ${fmt(exp)}`); },
      toBeTruthy: () => { if (!received) throw new Error(`Expected value to be truthy, got ${fmt(received)}`); },
      toHaveAttribute: (name: string, value?: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveAttribute expects an Element');
        const got = received.getAttribute(name);
        const ok = (value === undefined) ? got !== null : got === value;
        if (!ok) throw new Error(`Expected element to have [${name}${value !== undefined ? `="${value}"` : ''}], got ${fmt(got)}`);
      },
      toHaveText: (substr: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveText expects an Element');
        const txt = (received.textContent || '').trim();
        if (!txt.includes(substr)) throw new Error(`Expected text to include "${substr}", got "${txt}"`);
      },
      toBeVisible: () => {
        if (!(received instanceof Element)) throw new Error('toBeVisible expects Element');
        const cs = win.getComputedStyle(received);
        if (cs.display === 'none' || cs.visibility === 'hidden') throw new Error('Element is not visible');
      }
    });
    return expect;
  }

  private async mountScratchDoc(html: string): Promise<{ frame: HTMLIFrameElement; doc: Document; win: Window }> {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument as Document;
    doc.open(); doc.write(html); doc.close();
    await new Promise<void>((res) => {
      if (doc.readyState === 'complete' || doc.readyState === 'interactive') res();
      else doc.addEventListener('DOMContentLoaded', () => res(), { once: true });
    });
    const win = frame.contentWindow as Window;
    return { frame, doc, win };
  }

  private buildWebPreviewDoc(userHtml: string, css: string): string {
    const html = this.stripScriptTags((userHtml || '').trim());
    const cssBlock = (css || '').trim();
    const isFullDoc = /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);

    if (isFullDoc) {
      if (!cssBlock) return this.injectPreviewBridge(html);
      if (/<head[\s>]/i.test(html)) {
        return this.injectPreviewBridge(html.replace(/<head([^>]*)>/i, (_m, attrs) => `<head${attrs}>\n<style>\n${cssBlock}\n</style>`));
      }
      if (/<html[^>]*>/i.test(html)) {
        return this.injectPreviewBridge(html.replace(/<html([^>]*)>/i, (_m, attrs) => `<html${attrs}>\n<head><style>\n${cssBlock}\n</style></head>`));
      }
      return this.injectPreviewBridge(`<!doctype html><html><head><style>${cssBlock}</style></head><body>${html}</body></html>`);
    }

    return this.injectPreviewBridge(`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  html,body { height: 100%; background:#fff; color:#111; }
  body { margin:16px; font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial; }
  ${cssBlock}
</style></head><body>${html}</body></html>`);
  }

  private stripScriptTags(html: string): string {
    // Basic safety: don't execute user-provided <script> tags inside the preview iframe.
    // (We still inject our own small bridge script for link handling.)
    return (html || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<script\b[^>]*\/\s*>/gi, '');
  }

  private getPreviewFormMessages(): { valid: string | null; invalid: string | null } {
    const q = this.question;
    const qid = q?.id ?? null;
    if (qid && qid === this.cachedPreviewFormMessagesForQuestionId) {
      return this.cachedPreviewFormMessages;
    }

    const empty = { valid: null, invalid: null };
    this.cachedPreviewFormMessagesForQuestionId = qid;

    if (!q) {
      this.cachedPreviewFormMessages = empty;
      return empty;
    }

    const sol = this.getWebSolutions(q);
    const html = String(sol?.html ?? '');
    if (!html) {
      this.cachedPreviewFormMessages = empty;
      return empty;
    }

    const scripts: string[] = [];
    const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
    let sm: RegExpExecArray | null;
    while ((sm = scriptRe.exec(html))) scripts.push(String(sm[1] ?? ''));
    const js = scripts.join('\n');

    type Assign = { name: string; value: string };
    const assigns: Assign[] = [];
    const assignRe = /([A-Za-z_$][\w$]*)\s*\.\s*(?:textContent|innerText)\s*=\s*(['"`])([\s\S]*?)\2/g;
    let am: RegExpExecArray | null;
    while ((am = assignRe.exec(js))) {
      const name = String(am[1] ?? '');
      const value = String(am[3] ?? '').replace(/\s+/g, ' ').trim();
      if (!name || !value) continue;
      if (value.length > 200) continue;
      assigns.push({ name, value });
    }

    const preferred = assigns.filter(a => /(status|confirm|live|msg|message|success|error|validation)/i.test(a.name));
    const candidates = (preferred.length ? preferred : assigns).map(a => a.value);

    const pickFirst = (re: RegExp) => candidates.find(v => re.test(v)) ?? null;
    const invalid =
      pickFirst(/(fix|highlight|invalid|error|required|please|try again|must)/i);
    const valid =
      pickFirst(/(thank|success|good|✅|✓|done|recorded|received|submitted|sent|saved)/i) ??
      (candidates.length === 1 ? candidates[0] : null);

    const finalValid = (valid && invalid && valid === invalid) ? null : valid;
    this.cachedPreviewFormMessages = { valid: finalValid, invalid };
    return this.cachedPreviewFormMessages;
  }

  private injectPreviewBridge(doc: string): string {
    const msgs = this.getPreviewFormMessages();
    const safeJsString = (v: string | null) =>
      v ? JSON.stringify(v).replace(/<\/script>/gi, '<\\/script>') : 'null';

    const bridge = `
<script>
(() => {
  const MSG_INVALID = ${safeJsString(msgs.invalid)};
  const MSG_VALID = ${safeJsString(msgs.valid)};
  const allowedProtocols = new Set(['http:', 'https:']);
  const toUrl = (href) => {
    try { return new URL(href, window.location.href); } catch { return null; }
  };
  const stopEvent = (ev) => {
    try { if (typeof ev.preventDefault === 'function') ev.preventDefault(); } catch {}
    try { if (typeof ev.stopPropagation === 'function') ev.stopPropagation(); } catch {}
    try { if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation(); } catch {}
  };
  const shouldIntercept = (ev, anchor) => {
    const metaClick = ev.button === 1 || ev.metaKey || ev.ctrlKey;
    return anchor.target === '_blank' || metaClick;
  };
  const handleLinkEvent = (ev) => {
    const el = ev.target instanceof Element ? ev.target.closest('a[href]') : null;
    if (!el) return;
    const u = toUrl(el.href || el.getAttribute('href') || '');
    if (!u || !allowedProtocols.has(u.protocol)) return;
    if (!shouldIntercept(ev, el)) return;
    stopEvent(ev);
    try { window.parent?.postMessage({ type: 'UF_OPEN_EXTERNAL', url: u.href }, '*'); } catch {}
  };
  const onKeyDownLink = (ev) => {
    if (ev.key !== 'Enter') return;
    const el = ev.target instanceof Element ? ev.target.closest('a[href]') : null;
    if (!el) return;
    // simulate click intent for Enter on anchor with _blank
    if (el.getAttribute('target') !== '_blank') return;
    handleLinkEvent(ev);
  };

  // Prevent native form submission inside sandboxed iframes (no allow-forms),
  // while still allowing inline handlers / frameworks to handle submit events.
  function isSubmitter(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'button') {
      const t = (el.getAttribute('type') || '').toLowerCase();
      return !t || t === 'submit';
    }
    if (tag === 'input') {
      const t = (el.getAttribute('type') || '').toLowerCase();
      return t === 'submit' || t === 'image';
    }
    return false;
  }

  function findForm(el) {
    try {
      // button/input have a .form property that resolves associated form even when outside.
      if (el && el.form) return el.form;
    } catch (_e) {}
    try {
      if (el && el.closest) return el.closest('form');
    } catch (_e) {}
    return null;
  }

  function isPseudoSubmitButton(el, form) {
    if (!el || !form || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    const type = ((el.getAttribute && el.getAttribute('type')) || '').toLowerCase();
    if (tag !== 'button' && tag !== 'input') return false;
    if (type !== 'button') return false;

    try {
      // Don't hijack forms that already have a real submit control.
      if (form.querySelector('button[type="submit"], button:not([type]), input[type="submit"], input[type="image"]')) return false;
    } catch (_e) {}

    const id = (((el.getAttribute && el.getAttribute('id')) || '') + ' ' + ((el.getAttribute && el.getAttribute('name')) || ''));
    const label =
      tag === 'input'
        ? (((el.getAttribute && el.getAttribute('value')) || '') + '')
        : ((el.textContent || '') + '');
    const hint = (id + ' ' + label).toLowerCase();
    return /submit|sign\s*up|signup|send/.test(hint);
  }

  function findPseudoSubmitter(form) {
    if (!form || !form.querySelectorAll) return null;
    let nodes;
    try {
      nodes = form.querySelectorAll('button[type="button"], input[type="button"]');
    } catch (_e) { return null; }
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (isPseudoSubmitButton(el, form)) return el;
    }
    return null;
  }

  function shouldBypassValidation(form, submitter) {
    try { if (form && form.noValidate) return true; } catch (_e) {}
    try { if (submitter && submitter.formNoValidate) return true; } catch (_e) {}
    try { if (submitter && submitter.hasAttribute && submitter.hasAttribute('formnovalidate')) return true; } catch (_e) {}
    return false;
  }

  function getValidity(form, submitter) {
    if (!form) return true;
    if (shouldBypassValidation(form, submitter)) return true;
    try {
      if (typeof form.checkValidity === 'function') {
        return !!form.checkValidity();
      }
    } catch (_e) {}
    return true;
  }

  function reportIfInvalid(form, submitter, valid) {
    if (!form) return;
    if (valid) return;
    if (shouldBypassValidation(form, submitter)) return;
    try { if (typeof form.reportValidity === 'function') form.reportValidity(); } catch (_e) {}
  }

  function findStatusEl(form) {
    if (!form || !form.querySelector) return null;
    try { return form.querySelector('#status, [role="status"], [aria-live]'); } catch (_e) { return null; }
  }

  function canOverwriteStatus(el) {
    if (!el) return false;
    const txt = String(el.textContent || '').trim();
    if (!txt) return true;
    if (MSG_INVALID && txt === MSG_INVALID) return true;
    if (MSG_VALID && txt === MSG_VALID) return true;
    return false;
  }

  function setStatusText(el, msg) {
    if (!msg) return;
    if (!el) return;
    if (!canOverwriteStatus(el)) return;
    try { el.textContent = msg; } catch (_e) {}
  }

  function findSuccessEls(form) {
    const out = [];
    if (form && form.querySelectorAll) {
      try {
        const nodes = form.querySelectorAll('#successMsg, .success-msg, [data-uf-success]');
        for (let i = 0; i < nodes.length; i++) out.push(nodes[i]);
      } catch (_e) {}
    }
    if (out.length) return out;
    try {
      const global = document.getElementById('successMsg') || document.getElementById('formMessage');
      if (global) out.push(global);
    } catch (_e) {}
    return out;
  }

  function setSuccessVisible(form, visible) {
    const els = findSuccessEls(form);
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      try {
        if (visible) {
          el.style.display = 'block';
          if (el.hasAttribute && el.hasAttribute('hidden')) el.removeAttribute('hidden');
          if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') el.setAttribute('aria-hidden', 'false');
        } else {
          el.style.display = 'none';
        }
      } catch (_e) {}
    }
  }

  function dispatchSyntheticSubmit(form, submitter) {
    if (!form) return;
    try {
      let ev;
      if (typeof SubmitEvent === 'function') {
        ev = new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: submitter || undefined });
      } else if (typeof Event === 'function') {
        ev = new Event('submit', { bubbles: true, cancelable: true });
      } else {
        ev = document.createEvent('Event');
        ev.initEvent('submit', true, true);
      }
      form.dispatchEvent(ev);
    } catch (_e) {}
  }

  function handleSubmitAttempt(form, submitter) {
    if (!form) return;
    const status = findStatusEl(form);
    dispatchSyntheticSubmit(form, submitter);
    const valid = getValidity(form, submitter);
    reportIfInvalid(form, submitter, valid);
    if (!valid) {
      setSuccessVisible(form, false);
      setStatusText(status, MSG_INVALID);
      return;
    }
    setStatusText(status, MSG_VALID);
    setSuccessVisible(form, true);
  }

  document.addEventListener('click', function (e) {
    const target = e && e.target;
    const el = (target && target.closest) ? target.closest('button, input') : target;
    const form = findForm(el);
    if (!form) return;
    if (!isSubmitter(el) && !isPseudoSubmitButton(el, form)) return;
    try { if (typeof e.preventDefault === 'function') e.preventDefault(); } catch (_e) {}
    handleSubmitAttempt(form, el);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!e || e.key !== 'Enter') return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    // Don't hijack Enter in textareas/contenteditable
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'textarea') return;
    if (target.isContentEditable) return;
    if (target.closest && target.closest('a[href]')) return;
    const form = target.closest ? target.closest('form') : null;
    if (!form) return;
    try { if (typeof e.preventDefault === 'function') e.preventDefault(); } catch (_e) {}
    const submitter =
      form.querySelector('button[type="submit"], button:not([type]), input[type="submit"], input[type="image"]') ||
      findPseudoSubmitter(form);
    handleSubmitAttempt(form, submitter);
  }, true);

  document.addEventListener('click', handleLinkEvent, true);
  document.addEventListener('auxclick', handleLinkEvent, true);
  document.addEventListener('keydown', onKeyDownLink, true);
})();
</script>`;
    if (/<\/body>/i.test(doc)) return doc.replace(/<\/body>/i, `${bridge}\n</body>`);
    return `${doc}\n${bridge}`;
  }

  private onPreviewMessage = (ev: MessageEvent) => {
    if (!this.previewContentWindow || ev.source !== this.previewContentWindow) return;
    const payload = ev.data;
    if (!payload || payload.type !== 'UF_OPEN_EXTERNAL') return;
    const raw = typeof payload.url === 'string' ? payload.url : '';
    if (!raw) {
      this.zone.run(() => this.pushConsole('warn', 'Blocked external link: missing URL.'));
      return;
    }
    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      this.zone.run(() => this.pushConsole('warn', 'Blocked external link: invalid URL.'));
      return;
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      this.zone.run(() => this.pushConsole('warn', 'Blocked external link: unsupported protocol.'));
      return;
    }

    const opened = window.open(target.href, '_blank', 'noopener,noreferrer');
    if (!opened) {
      this.zone.run(() => this.pushConsole('warn', 'Popup blocked. Open manually: ' + target.href));
    }
  };

  private pushConsole(level: LogLevel, message: string) {
    const entry: ConsoleEntry = { level, message, timestamp: Date.now() };
    this.consoleEntries.update((list) => [...list.slice(-499), entry]);
  }

  private setPreviewHtml(html: string | null) {
    this.lastPreviewHtml = html;

    try {
      if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    } catch { }
    this.previewObjectUrl = null;

    const frameEl = this.previewFrame?.nativeElement;
    if (!frameEl) {
      requestAnimationFrame(() => {
        const f = this.previewFrame?.nativeElement;
        if (f) this.setPreviewHtml(html);
      });
      return;
    }

    if (!html) {
      this.previewContentWindow = null;
      const doc = frameEl.contentDocument;
      if (doc) {
        doc.open();
        doc.write('<!doctype html><meta charset="utf-8">');
        doc.close();
      }
      // important: clear url so the "Building preview…" condition is correct
      this._previewUrl.set(null);
      return;
    }

    this.previewContentWindow = this.previewFrame?.nativeElement.contentWindow ?? this.previewContentWindow;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewObjectUrl = url;

    // Avoid polluting the browser's joint session history on every live-preview update.
    // If we use `iframe.src = ...`, the browser back button walks through iframe states
    // (often broken because we revoke old blob URLs).
    if (frameEl.contentWindow) {
      try {
        frameEl.contentWindow.location.replace(url);
      } catch {
        frameEl.src = url;
      }
    } else {
      frameEl.onload = () => {
        try { frameEl.contentWindow?.location.replace(url); } catch { }
      };
      frameEl.src = url;
    }

    // 👇 update the reactive url used by the template
    this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  /** Apply solution into editors, persist, and rebuild preview (invoked by parent). */
  public async applySolution(payload: { html?: string; css?: string } | string): Promise<void> {
    const q = this.question;
    if (!q) return;
    const storageKey = this.storageKeyFor(q);

    // 1) Normalize incoming content
    let nextHtml = '';
    let nextCss = '';

    if (typeof payload === 'string') {
      nextHtml = this.unescapeJsLiterals(payload);
      nextCss = '';
    } else {
      nextHtml = this.unescapeJsLiterals(payload?.html ?? '');
      nextCss = this.prettifyCss(this.unescapeJsLiterals(payload?.css ?? ''));
    }

    // 2) Cancel pending debounced saves
    if (this.webSaveTimer) {
      clearTimeout(this.webSaveTimer);
      this.webSaveTimer = null;
    }

    // 3) Update editors
    this.htmlCode.set(nextHtml);
    this.cssCode.set(nextCss);

    // 4) Persist immediately (force = bypass guards)
    if (!this.disablePersistence) {
      await this.codeStorage.saveWebAsync(storageKey, 'html', nextHtml, { force: true });
      await this.codeStorage.saveWebAsync(storageKey, 'css', nextCss, { force: true });
    }

    // 5) Exit solution preview state
    this.exitSolutionPreview('load into editor');

    // 6) No "restored" banner; this is explicit now
    this.viewingSolution.set(true);
    this.showRestoreBanner.set(true);

    // 7) Rebuild preview from editors
    this.scheduleWebPreview();

    // 8) UX resets
    this.previewTopTab.set('preview');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
  }

  // --- pointer/splitters (unchanged) ---
  startWebColumnDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingCols = true;
    this.isDraggingCols.set(true);
    this.startXCols = ev.clientX;
    this.startColsRatio = this.webColsRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingCols = false; this.isDraggingCols.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };

  private onPointerMoveCols = (ev: PointerEvent) => {
    if (!this.draggingCols) return;

    // Host that contains the left/right columns — use its width, not the window
    const host =
      (this.splitContainer?.nativeElement?.parentElement as HTMLElement) ?? document.body;
    const rect = host.getBoundingClientRect();

    const delta = ev.clientX - this.startXCols;
    let r = this.startColsRatio + (delta / rect.width);
    r = Math.max(0.25, Math.min(0.75, r)); // clamp
    this.zone.run(() => this.webColsRatio.set(r));
  };

  startPreviewDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.draggingPreview = true;
    this.isDraggingRight.set(true);
    this.startYPreview = ev.clientY;
    this.startPreviewRatio = this.previewRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingPreview = false; this.isDraggingRight.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };
  private onPointerMovePreview = (ev: PointerEvent) => {
    if (!this.draggingPreview || !this.previewSplit) return;
    const rect = this.previewSplit.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startYPreview;
    let r = (rect.height * this.startPreviewRatio + delta) / rect.height;
    r = Math.max(0.2, Math.min(0.9, r));
    this.zone.run(() => this.previewRatio.set(r));
  };

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
    if (this.draggingCols) { this.onPointerMoveCols(ev); return; }
    if (this.draggingPreview) { this.onPointerMovePreview(ev); return; }
    if (!this.dragging || !this.splitContainer) return;

    const rect = this.splitContainer.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startY;
    const newEditorPx = rect.height * this.startRatio + delta;
    let newRatio = newEditorPx / rect.height;
    newRatio = Math.max(0.2, Math.min(0.9, newRatio));
    this.zone.run(() => this.editorRatio.set(newRatio));
  };
  private onPointerUp = () => {
    this.dragging = false;
    this.draggingCols = false;
    this.draggingPreview = false;
    this.isDraggingHorizontal.set(false);
    this.isDraggingCols.set(false);
    this.isDraggingRight.set(false);
  };

  // --- tiny utils copied 1:1 ---
  public unescapeJsLiterals(s: string | null | undefined): string {
    if (!s) return '';
    if (!/[\\][nrt\\'"]/.test(s)) return s;
    return s.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
      .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  public prettifyCss(css: string): string {
    if (!css) return '';
    try {
      return css.replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } catch { return css; }
  }

}
