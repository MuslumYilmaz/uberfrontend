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
import { ActivityService } from '../../../../core/services/activity.service';
import { DailyService } from '../../../../core/services/daily.service';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../../console-logger/console-logger.component';

@Component({
  selector: 'app-coding-web-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, ConsoleLoggerComponent, ButtonModule],
  styles: [`
  /* Unified Results/Console typography */
  .uf-results, .uf-results * {
    font-size: 13px !important;
    line-height: 1.35 !important;
  }
  .uf-results .summary { font-size: 13px !important; }
  .uf-results .test-card { padding: 6px !important; }
  .uf-results .test-name { display:flex; align-items:center; gap:6px; font-weight:500; font-size:13px !important; }
  .uf-results .test-name i { font-size:13px !important; }
  .uf-results .test-error { margin-top:4px !important; font-size:11px !important; }

  /* Ensure results area can grow/scroll */
  .results-panel { flex:1 1 auto; min-height:0; }

    /* vertical splitter between LEFT and RIGHT columns */
  .splitter{
    width:6px;
    background:transparent;
    cursor:col-resize;
    user-select:none;
    touch-action:none;
    position:relative;     /* enables z-index */
    z-index:20;
    transition:background-color .15s;
  }
  .splitter:hover,
  .splitter.dragging{ background-color:#3b82f6; }

  /* horizontal splitters (HTML/CSS and Preview/Results) */
  .horizontal-splitter{
    height:5px;
    background:transparent;
    border-radius:25px;
    cursor:row-resize;
    user-select:none;
    touch-action:none;
    position:relative;     /* enables z-index, keeps it above the iframe */
    z-index:20;
    transition:background-color .15s;
  }
  .horizontal-splitter:hover,
  .horizontal-splitter.dragging{ background-color:#3b82f6; }
`],
  template: `
<div class="w-full min-h-0 flex flex-col flex-1">
  <!-- Banner -->
  <div *ngIf="showRestoreBanner()"
       class="restore-banner px-3 py-1.5 bg-yellow-200 text-black text-xs relative text-center">
    <span class="font-medium">Your code was restored from local storage.</span>
    <div class="absolute right-2 inset-y-0 flex items-center gap-3">
      <button class="underline font-medium" (click)="resetFromBanner()">Reset to default</button>
      <button class="opacity-70 hover:opacity-100" (click)="dismissRestoreBanner()">✕</button>
    </div>
  </div>

  <div class="bg-neutral-900 rounded-lg shadow-sm border border-white/10 flex flex-col flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 flex">
      <!-- LEFT editors -->
      <div class="min-w-0 flex flex-col" [style.flex]="'0 0 ' + (webColsRatio()*100) + '%'">
        <div #splitContainer class="flex-1 min-h-0 flex flex-col">
          <div class="border-b border-white/10 px-3 py-1 text-xs opacity-80">&lt;html&gt; HTML</div>

          <div class="overflow-hidden" [style.flex]="'0 0 ' + (editorRatio()*100) + '%'" style="min-height:120px;">
            <app-monaco-editor class="h-full editor-fill"
                               [code]="webHtml()" [language]="'html'"
                               [options]="editorOptions"
                               (codeChange)="onHtmlChange($event)">
            </app-monaco-editor>
          </div>

          <div class="horizontal-splitter" [class.dragging]="isDraggingHorizontal()"
               (pointerdown)="startDrag($event)"></div>

          <div class="flex-1 min-h-0 flex flex-col">
            <div class="border-b border-white/10 px-3 py-1 text-xs opacity-80"># CSS</div>
            <app-monaco-editor class="flex-1 editor-fill"
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
          <div class="flex items-center border-b border-white/10 px-3 py-2 text-xs">
            <button class="px-3 py-1" [class.opacity-100]="isPreviewTop()" [class.opacity-60]="!isPreviewTop()"
                    (click)="previewTopTab.set('preview')">Preview</button>
            <button class="px-3 py-1" [class.opacity-100]="isTestCodeTop()" [class.opacity-60]="!isTestCodeTop()"
                    (click)="previewTopTab.set('testcode')">Test code</button>
            <div class="ml-auto text-xs opacity-70">Live preview updates as you type</div>
          </div>

          <!-- TOP CONTENT -->
          <div [style.flex]="'0 0 ' + (previewRatio()*100) + '%'" class="relative min-h-[160px]">
            <div *ngIf="!previewUrl()" class="absolute inset-0 grid place-items-center text-xs text-gray-400"
                 [style.display]="isPreviewTop() ? 'grid' : 'none'">
              Building preview…
            </div>

            <!-- WEB PREVIEW TOGGLE -->
            <div class="absolute top-2 right-3 z-20 flex items-center gap-2">
              <!-- Show Preview button (when not showing solution) -->
              <button *ngIf="!showingSolutionPreview"
                      class="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
                      (click)="openSolutionPreview()">
                Show preview
              </button>

              <!-- Close banner (when showing solution) -->
              <div *ngIf="showingSolutionPreview"
                   class="bg-yellow-300 text-black text-xs px-3 py-1.5 rounded shadow-sm flex items-center gap-3">
                <span class="font-medium">Showing solution preview</span>
                <button class="text-xs underline" (click)="closeSolutionPreview()">Close preview</button>
              </div>
            </div>

            <iframe #previewFrame class="absolute inset-0 w-full h-full border-0 bg-white"
                    referrerpolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation">
            </iframe>

            <div class="absolute inset-0" [style.display]="isTestCodeTop() ? 'block' : 'none'">
              <app-monaco-editor class="h-full"
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
          <div class="flex-1 min-h-[140px] flex flex-col border-t border-white/10">
            <div class="flex items-center gap-6 px-3 py-2 text-xs bg-neutral-900/60">
              <button class="font-medium" (click)="runWebTests()" [disabled]="!hasAnyTests()"
                      [title]="hasAnyTests() ? 'Run tests' : 'Add tests to enable'">▶ Run tests</button>
              <button [class.text-white]="isTestsTab()" [class.text-gray-300]="!isTestsTab()"
                      (click)="subTab.set('tests')">Results</button>
              <button [class.text-white]="isConsoleTab()" [class.text-gray-300]="!isConsoleTab()"
                      (click)="subTab.set('console')">Console</button>
              <span class="ml-auto opacity-80" *ngIf="hasRunTests && totalCount() > 0">
                {{ passedCount() }}/{{ totalCount() }} passed
              </span>
            </div>

            <div class="flex-1 min-h-0 overflow-hidden">
              <!-- Results -->
              <div *ngIf="isTestsTab()" class="h-full overflow-auto p-4 results-panel uf-results">
                <!-- 1) No tests -->
                <div class="h-full grid place-items-center text-xs text-gray-400" *ngIf="!hasAnyTests()">
                  No tests provided for this challenge yet.
                </div>
                <!-- 2) Not run yet -->
                <div class="h-full grid place-items-center text-xs text-gray-400"
                     *ngIf="hasAnyTests() && !hasRunTests">
                  Run tests to see results.
                </div>
                <!-- 3) Run -->
                <div *ngIf="hasAnyTests() && hasRunTests" class="space-y-2">
                  <div class="summary mb-2">
                    <strong>{{ passedCount() }}</strong>/<strong>{{ totalCount() }}</strong> passed
                    <span *ngIf="allPassing()" class="text-green-500 ml-2">All tests passed ✓</span>
                    <span *ngIf="!allPassing()" class="text-red-400 ml-2">Some tests failed</span>
                  </div>

                  <div *ngFor="let t of testResults()" class="test-card border rounded-md"
                       [ngClass]="t.passed ? 'border-green-500 bg-green-100/10' : 'border-red-500 bg-red-100/10'">
                    <div class="test-name">
                      <i [ngClass]="t.passed ? 'pi pi-check-circle text-green-400'
                                             : 'pi pi-times-circle text-red-400'"></i>
                      <span>{{ t.name }}</span>
                    </div>
                    <div *ngIf="t.error" class="test-error text-red-300 whitespace-pre-wrap break-words">
                      {{ t.error }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Console -->
              <div [style.display]="isConsoleTab() ? 'flex' : 'none'" class="flex-1 min-h-0 flex flex-col">
                <app-console-logger class="flex-1 console-panel uf-results"
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

  constructor(
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private daily: DailyService,
    private activity: ActivityService
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

  // session/credit
  private sessionStart = Date.now();
  private recorded = false;

  // computed preview doc = build from current editors
  previewDocRaw = computed(() => {
    const css = this.cssCode() ?? '';
    const html = this.unescapeJsLiterals(this.htmlCode() ?? '');
    return this.buildWebPreviewDoc(html, css);
  });

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['question'] && this.question) {
      this.initFromQuestion();
    }
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp); // <-- add this
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    if (this.previewObjectUrl) try { URL.revokeObjectURL(this.previewObjectUrl); } catch { }
  }

  // -------- persistence keys (unchanged) --------
  private webKey(q: Question, which: 'html' | 'css') { return `uf:web:${which}:${q.id}`; }
  private webBaseKey(q: Question, which: 'html' | 'css') { return `uf:web:baseline:v2:${which}:${q.id}`; }

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

  private initFromQuestion(): void {
    const q = this.question;
    if (!q) return;

    const starters = this.getWebStarters(q);
    const htmlBaseKey = this.webBaseKey(q, 'html');
    const cssBaseKey = this.webBaseKey(q, 'css');

    if (!localStorage.getItem(htmlBaseKey)) try { localStorage.setItem(htmlBaseKey, starters.html); } catch { }
    if (!localStorage.getItem(cssBaseKey)) try { localStorage.setItem(cssBaseKey, starters.css); } catch { }

    const normalizeSaved = (raw: string | null) => {
      if (raw == null) return null;
      const s = raw.trim();
      if (!s) return null;
      if (s.startsWith('{')) {
        try {
          const obj = JSON.parse(s);
          if (obj && typeof obj.code === 'string') return this.unescapeJsLiterals(obj.code);
        } catch { }
      }
      return this.unescapeJsLiterals(s);
    };

    const savedHtml = normalizeSaved(localStorage.getItem(this.webKey(q, 'html')));
    const savedCss = normalizeSaved(localStorage.getItem(this.webKey(q, 'css')));
    this.htmlCode.set(savedHtml ?? starters.html);
    this.cssCode.set(savedCss ?? starters.css);

    // show banner if diverged from baseline
    try {
      const baseHtml = localStorage.getItem(htmlBaseKey) ?? '';
      const baseCss = localStorage.getItem(cssBaseKey) ?? '';
      const changed = (savedHtml && savedHtml !== baseHtml) || (savedCss && savedCss !== baseCss);
      this.showRestoreBanner.set(!!changed);
    } catch { this.showRestoreBanner.set(false); }

    this.testCode.set(this.getWebTests(q));
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.sessionStart = Date.now();
    this.recorded = false;

    // initial preview
    this.scheduleWebPreview();
  }

  // ---------- save + preview ----------
  onHtmlChange = (code: string) => {
    const q = this.question; if (!q) return;
    this.htmlCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'html'), code); } catch { }
    }, 200);

    this.exitSolutionPreview('user edited HTML');
    this.scheduleWebPreview();
  }

  onCssChange = (code: string) => {
    const q = this.question; if (!q) return;
    this.cssCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'css'), code); } catch { }
    }, 200);

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

  public externalResetToDefault(): void {
    const q = this.question; if (!q) return;

    // Prefer baseline, fallback to starters
    const starters = this.getWebStarters(q);
    const baseHtml = localStorage.getItem(this.webBaseKey(q, 'html'));
    const baseCss = localStorage.getItem(this.webBaseKey(q, 'css'));

    const nextHtml = (baseHtml ?? starters.html);
    const nextCss = (baseCss ?? starters.css);

    // Avoid writing stale content back over the reset
    if (this.webSaveTimer) { clearTimeout(this.webSaveTimer); this.webSaveTimer = null; }

    // Clear saved (mutable) copies so subsequent loads start from baseline
    try { localStorage.removeItem(this.webKey(q, 'html')); } catch { }
    try { localStorage.removeItem(this.webKey(q, 'css')); } catch { }
    try { localStorage.removeItem(this.solvedKey(q)); } catch { }

    // Update in-memory editors immediately
    this.htmlCode.set(nextHtml);
    this.cssCode.set(nextCss);

    // Rebuild preview + clear results/console
    this.scheduleWebPreview();
    this.consoleEntries.set([]);
    this.testResults.set([]);
    this.hasRunTests = false;
    this.showRestoreBanner.set(false);
  }

  // ---------- tests ----------
  async runWebTests(): Promise<void> {
    const q = this.question; if (!q) return;

    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const code = (this.testCode() || '').trim();
    if (!code) {
      this.hasRunTests = true;
      this.testResults.set([]);
      return;
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

    const passing = this.allPassing();
    // Persist solved flag exactly like parent did
    try { localStorage.setItem(this.solvedKey(q), String(!!passing)); } catch { }

    if (passing) {
      this.creditDaily();
      this.activity.complete({
        kind: 'coding' as any,
        tech: this.tech,
        itemId: q.id,
        source: 'tech',
        durationMin: Math.max(1, Math.round((Date.now() - this.sessionStart) / 60000)),
        xp: this.xpFor(q),
        solved: true
      }).subscribe({
        next: () => {
          this.recorded = true;
          this.activity.activityCompleted$.next({ kind: 'coding', tech: this.tech, stats: undefined });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      try { await this.fireConfetti(); } catch { }
    }
  }

  // ---------- solved persistence (same key) ----------
  private solvedKey(q: Question) { return `uf:coding:solved:${this.tech}:${q.id}`; }

  // ---------- banner actions ----------
  dismissRestoreBanner() { this.showRestoreBanner.set(false); }
  async resetFromBanner() { await this.resetQuestion(); this.showRestoreBanner.set(false); }

  async resetQuestion() {
    const q = this.question; if (!q) return;
    const starters = this.getWebStarters(q);
    try { localStorage.removeItem(this.webKey(q, 'html')); } catch { }
    try { localStorage.removeItem(this.webKey(q, 'css')); } catch { }
    this.htmlCode.set(starters.html);
    this.cssCode.set(starters.css);
    this.scheduleWebPreview();
    this.consoleEntries.set([]);
    this.testResults.set([]);
    this.hasRunTests = false;
    try { localStorage.removeItem(this.solvedKey(q)); } catch { }
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
    const html = (userHtml || '').trim();
    const cssBlock = (css || '').trim();
    const isFullDoc = /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);

    if (isFullDoc) {
      if (!cssBlock) return html;
      if (/<head[\s>]/i.test(html)) {
        return html.replace(/<head([^>]*)>/i, (_m, attrs) => `<head${attrs}>\n<style>\n${cssBlock}\n</style>`);
      }
      if (/<html[^>]*>/i.test(html)) {
        return html.replace(/<html([^>]*)>/i, (_m, attrs) => `<html${attrs}>\n<head><style>\n${cssBlock}\n</style></head>`);
      }
      return `<!doctype html><html><head><style>${cssBlock}</style></head><body>${html}</body></html>`;
    }

    return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  html,body { height: 100%; background:#fff; color:#111; }
  body { margin:16px; font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial; }
  ${cssBlock}
</style></head><body>${html}</body></html>`;
  }

  private setPreviewHtml(html: string | null) {
    this.lastPreviewHtml = html;

    try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { }
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
      const doc = frameEl.contentDocument;
      if (doc) { doc.open(); doc.write('<!doctype html><meta charset="utf-8">'); doc.close(); }
      return;
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewObjectUrl = url;

    const cw = frameEl.contentWindow;
    if (cw) cw.location.replace(url);
    else {
      frameEl.onload = () => frameEl.contentWindow?.location.replace(url);
      frameEl.setAttribute('src', url);
    }
  }

  /** Apply solution into editors, persist, and rebuild preview (invoked by parent). */
  public applySolution(payload: { html?: string; css?: string } | string): void {
    console.log('called');
    const q = this.question;
    if (!q) return;

    // 1) Normalize incoming content
    let nextHtml = '';
    let nextCss = '';

    if (typeof payload === 'string') {
      // Backward-compat: a single HTML string (rarely used). Treat as full HTML; clear CSS.
      nextHtml = this.unescapeJsLiterals(payload);
      nextCss = '';
    } else {
      nextHtml = this.unescapeJsLiterals(payload?.html ?? '');
      nextCss = this.prettifyCss(this.unescapeJsLiterals(payload?.css ?? ''));
    }

    // 2) Cancel pending debounced saves (avoid racing stale writes)
    if (this.webSaveTimer) { clearTimeout(this.webSaveTimer); this.webSaveTimer = null; }

    // 3) Update editors (signals)
    this.htmlCode.set(nextHtml);
    this.cssCode.set(nextCss);

    // 4) Persist immediately (so a refresh keeps the applied solution)
    try { localStorage.setItem(this.webKey(q, 'html'), nextHtml); } catch { }
    try { localStorage.setItem(this.webKey(q, 'css'), nextCss); } catch { }

    // 5) Close any "solution preview" banner state and restore normal preview pipeline
    this.exitSolutionPreview('load into editor');

    // 6) Clear "restored" banner since we’ve explicitly set the code now
    this.showRestoreBanner.set(false);

    // 7) Rebuild live preview from editors
    this.scheduleWebPreview();

    // 8) UX niceties: land the user on Preview top tab, Results subtab reset
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

  private async fireConfetti(): Promise<void> {
    const mod: any = await import('canvas-confetti');
    const confetti = (mod.default || mod) as (opts: any) => void;
    const count = 100;
    const defaults = { spread: 70, ticks: 90, gravity: 0.9, scalar: 1 };
    const fire = (ratio: number, opts: any = {}) => confetti({ particleCount: Math.floor(count * ratio), ...defaults, ...opts });
    fire(0.35, { startVelocity: 45, origin: { x: 0.2, y: 0.3 } });
    fire(0.35, { startVelocity: 45, origin: { x: 0.8, y: 0.3 } });
  }
  private xpFor(q: Question): number { return Number((q as any).xp ?? 20); }
  private creditDaily(): void { this.daily.markCompletedById('coding' as any, this.question?.id); }
}
