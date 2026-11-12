// src/app/monaco-editor.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges,
  OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject
} from '@angular/core';
import { EDITOR_RXJS_TYPINGS } from './generated/editor-rxjs-typings';
import { createTrackedMonacoWorker } from './core/utils/monaco-worker-tracker';
import { STYLESHEET_LOADER } from './core/utils/stylesheet-loader';
import { userVisibleFailures } from './core/utils/user-visible-failure-reporter';

const DEFAULT_EDITOR_THEME = 'fa-dark';

// Monaco downloads a language's tokenizer the first time a file of that
// language opens, which can be minutes into a session. Only tokenizers are
// loaded ahead: a language service (vs/language/*Mode) loaded early registers
// its color provider while files are being swapped, and Monaco 0.52's color
// decorator then cancels a computation it started in the same task, which
// surfaces as an unhandled "Canceled" rejection.
const LANGUAGE_TOKENIZER_MODULES: Readonly<Record<string, string>> = {
  typescript: 'vs/basic-languages/typescript/typescript',
  javascript: 'vs/basic-languages/javascript/javascript',
  html: 'vs/basic-languages/html/html',
  css: 'vs/basic-languages/css/css',
  scss: 'vs/basic-languages/scss/scss',
};

declare global {
  interface Window { require: any; monaco: any; }
}

export type MonacoLineClickEvent = {
  lineNumber: number;
  clientX: number;
  clientY: number;
};

export type MonacoLoadError = {
  message: string;
  phase?: string;
  moduleId?: string;
  url?: string;
};

@Component({
    selector: 'app-monaco-editor',
    imports: [CommonModule],
    template: `<div #editorContainer class="w-full"></div>`,
    styles: [`
    :host { display:block; width:100%; }
    /* When autoHeight=false, give container a default height so it doesn't collapse */
    :host(.fixed-height) > div { height: 100%; }
  `]
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() code = '';
  @Input() language: string = 'javascript';
  @Input() theme = DEFAULT_EDITOR_THEME;
  @Input() options: any = {};
  @Input() readOnly = false;

  /** Disable mouse/keyboard and selection (for read-only “Examples” view) */
  @Input() interactive = true;

  /** Grow the editor to fit its content (no inner scrollbars) */
  @Input() autoHeight = false;

  /** Optional cap when autoHeight=true; adds inner scrollbar if exceeded */
  @Input() maxHeight?: number;

  /** Optional floor when autoHeight=true (default 24px + a little padding) */
  @Input() minHeight = 24;

  /** Languages the parent opens later, e.g. every file in a file tree; their highlighting loads with the editor. */
  @Input() preloadLanguages: readonly string[] = [];

  @Output() codeChange = new EventEmitter<string>();
  @Output() ready = new EventEmitter<void>();
  @Output() lineClick = new EventEmitter<MonacoLineClickEvent>();
  @Output() loadFailed = new EventEmitter<MonacoLoadError>();
  /** Ctrl+Enter (Cmd+Enter on a Mac) inside this editor; the workspace runs its tests or checks. */
  @Output() runShortcut = new EventEmitter<void>();
  @Input() modelKey?: string; // stable key from parent, e.g., "q-42-code"
  /**
   * The workspace's other files by path. TypeScript gets the .ts and .tsx ones, so a type that the open file imports
   * from a sibling resolves instead of falling to the `declare module "*"` stub (TS2709).
   */
  @Input() siblingFiles: Readonly<Record<string, string>> | null = null;

  // ADD
  private editor!: any;
  private model?: any;                  // NEW: keep a handle to the model
  private readonly siblingLibs = new Map<string, { content: string; lib?: { dispose(): void } }>();
  private decorationIds: string[] = [];
  private suppressNextModelUpdate = false;
  private disposed = false;
  private readyEmitted = false;
  private resizeObs?: ResizeObserver;
  private static seq = 0;
  private static webCompletionsInstalled = false;
  private static loaderPromise: Promise<void> | null = null;
  private static monacoReady = false;
  private static requestedLanguageModules = new Set<string>();
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly loadStylesheet = inject(STYLESHEET_LOADER);
  private get _modelId(): string {
    const lang = this.normalizeLanguage(this.language);
    const baseExt =
      lang === 'typescript'
        ? 'ts'
        : lang === 'javascript'
          ? 'js'
          : lang === 'json'
            ? 'json'
            : lang === 'html'
              ? 'html'
              : lang === 'css'
                ? 'css'
                : 'txt';

    // If a modelKey is provided, ensure it has a file extension for TS/JS workers
    if (this.modelKey) {
      const hasExt = /\.[a-z0-9]+$/i.test(this.modelKey);
      return hasExt ? this.modelKey : `${this.modelKey}.${baseExt}`;
    }

    // fallback: fa-1.ts / fa-2.js vs.
    return `fa-${++MonacoEditorComponent.seq}.${baseExt}`;
  }

  private readonly amdLoaderPath = 'assets/monaco/min/vs/loader.js';
  private readonly vsBasePath = 'assets/monaco/min/vs';

  async ngAfterViewInit() {
    if (!this.isBrowser) return;
    try {
      await this.ensureMonaco();
      if (this.disposed) return;

      if (!window.monaco?.editor?.create) {
        throw this.toMonacoLoadError(null, 'Monaco editor API was not available after loading assets.');
      }

      this.registerDefaultTheme();
      window.monaco?.editor?.setTheme?.(this.theme);

      const langNorm = this.normalizeLanguage(this.language);
      const langDefaults = this.getLanguageDefaultOptions(langNorm);

      // Base options (do NOT pass "value" here; model will carry the text)
      const baseOpts = {
        language: langNorm,
        theme: this.theme,
        readOnly: this.readOnly,
        automaticLayout: !this.autoHeight,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        // Monaco 0.52.2 leaves an unhandled cancellation behind when its
        // occurrence highlighter is pending during a dynamic model swap.
        // Keep it disabled by default; callers can still opt back in through
        // `options` once Monaco fixes the lifecycle regression.
        occurrencesHighlight: 'off',
        ...langDefaults,
        ...this.options,
        // Past its end the editor hands the wheel back, so the demo on the home page cannot trap the scroll.
        scrollbar: { alwaysConsumeMouseWheel: false, ...this.options?.scrollbar },
      };

      if (!this.autoHeight) {
        (this.container.nativeElement.parentElement as HTMLElement)?.classList.add('fixed-height');
      }

      // Create the model first with a deterministic URI/extension, after the files it may import from.
      this.syncSiblingLibs();
      this.createOrSwapModel(langNorm, this.code ?? '');

      // Then create the editor bound to that model.
      this.editor = window.monaco.editor.create(this.container.nativeElement, {
        ...baseOpts,
        model: this.model,
      });

      // Some embedding contexts can break Monaco's default Enter/Tab acceptance for suggestions.
      // Re-bind them explicitly when the suggest widget is visible.
      try {
        const monaco = (window as any).monaco;
        const whenSuggest = monaco?.editor?.ContextKeyExpr?.has?.('suggestWidgetVisible');
        if (whenSuggest) {
          this.editor.addCommand(monaco.KeyCode.Enter, () => {
            this.editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
          }, whenSuggest);
          this.editor.addCommand(monaco.KeyCode.Tab, () => {
            this.editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
          }, whenSuggest);
        }
      } catch { }

      // Ctrl/Cmd+Enter runs the workspace. An action, unlike addCommand, is bound to this editor only: a page with a
      // code and a tests editor keeps each shortcut on the editor that has the focus.
      if (this.runShortcut.observed) {
        const monaco = (window as any).monaco;
        this.editor.addAction?.({
          id: 'fa.runWorkspace',
          label: 'Run tests or checks',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => this.zone.run(() => this.runShortcut.emit()),
        });
      }

      // Mirror -> @Output
      this.editor.onDidChangeModelContent?.(() => {
        if (this.suppressNextModelUpdate) { this.suppressNextModelUpdate = false; return; }
        this.codeChange.emit(this.editor.getValue());
        if (this.autoHeight) this.fit();
      });

      this.editor.onMouseDown?.((event: any) => {
        const lineNumber = Number(event?.target?.position?.lineNumber || 0);
        const browserEvent = event?.event?.browserEvent as MouseEvent | undefined;
        if (!lineNumber || !browserEvent) return;
        this.lineClick.emit({
          lineNumber,
          clientX: browserEvent.clientX,
          clientY: browserEvent.clientY,
        });
      });

      // Auto-height handling
      if (this.autoHeight) {
        this.editor.updateOptions({
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
            useShadows: false,
            verticalScrollbarSize: 0,
            horizontalScrollbarSize: 0,
            alwaysConsumeMouseWheel: false,
          },
          wordWrap: 'on',
        });

        this.editor.onDidContentSizeChange?.(() => this.fit());

        this.resizeObs = new ResizeObserver(() => this.layoutToCurrentSize());
        this.resizeObs.observe(this.container.nativeElement);

        setTimeout(() => this.fit());
      }

      this.applyInteractivity();
      setTimeout(() => this.layoutToCurrentSize(), 0);
      this.scheduleReadyEmit();
      this.preloadLanguageSupport();
    } catch (error) {
      if (!this.disposed) {
        const loadError = this.toMonacoLoadError(error, 'Monaco editor failed to initialize.');
        userVisibleFailures.report('editor_load_failed', {
          reason: loadError.message,
          phase: loadError.phase,
          moduleId: loadError.moduleId,
          url: loadError.url,
        });
        this.loadFailed.emit(loadError);
      }
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (!this.editor && !this.model) return;

    // Before a model swap, so the file that opens leaves the siblings and the file that closes joins them.
    if (changes['siblingFiles'] || changes['modelKey']) this.syncSiblingLibs();

    if (changes['modelKey'] && !changes['modelKey'].isFirstChange()) {
      const langNorm = this.normalizeLanguage(this.language);
      this.createOrSwapModel(langNorm, this.code ?? '');
    }

    if (changes['code'] && !changes['code'].isFirstChange()) {
      const next = this.code ?? '';
      if (this.model && this.model.getValue?.() !== next) {
        this.suppressNextModelUpdate = true;
        this.model.setValue(next);
      }
      if (this.autoHeight) this.fit();
    }

    if (changes['language'] && !changes['language'].isFirstChange()) {
      const langNorm = this.normalizeLanguage(this.language);
      this.createOrSwapModel(langNorm, this.code ?? '');   // ✅ swap model by extension
    }

    if (changes['theme'] && !changes['theme'].isFirstChange()) {
      window.monaco?.editor?.setTheme?.(this.theme);
    }

    if (changes['options'] && !changes['options'].isFirstChange()) {
      const next = {
        automaticLayout: !this.autoHeight,
        ...this.options,
        scrollbar: { alwaysConsumeMouseWheel: false, ...this.options?.scrollbar },
      };
      this.editor?.updateOptions(next);
      if (this.autoHeight) this.fit();
    }

    if (changes['readOnly'] && !changes['readOnly'].isFirstChange()) {
      this.editor?.updateOptions({ readOnly: this.readOnly });
    }

    if (changes['interactive'] && !changes['interactive'].isFirstChange()) {
      this.applyInteractivity();
    }

    if (changes['preloadLanguages'] && !changes['preloadLanguages'].isFirstChange()) {
      this.preloadLanguageSupport();
    }

    if (changes['autoHeight'] && !changes['autoHeight'].isFirstChange()) {
      this.editor?.updateOptions({ automaticLayout: !this.autoHeight });
      if (this.autoHeight) {
        (this.container.nativeElement.parentElement as HTMLElement)?.classList.remove('fixed-height');
        this.fit();
      } else {
        (this.container.nativeElement.parentElement as HTMLElement)?.classList.add('fixed-height');
        this.layoutToCurrentSize();
      }
    }
  }

  focusEditor(): void {
    this.editor?.focus?.();
  }


  ngOnDestroy() {
    if (!this.isBrowser) return;
    this.disposed = true;
    this.clearLineHighlights();
    try { this.resizeObs?.disconnect(); } catch { }
    try { this.editor?.dispose?.(); } catch { }
    try { this.model?.dispose?.(); } catch { }  // keep this
    for (const { lib } of this.siblingLibs.values()) {
      try { lib?.dispose(); } catch { }
    }
    this.siblingLibs.clear();
  }

  getValue(): string {
    return this.model?.getValue?.() ?? this.editor?.getValue?.() ?? this.code ?? '';
  }

  setLineHighlights(lines: Array<{ start: number; end?: number; active?: boolean; hoverLabel?: string }>): void {
    if (!this.editor || !window.monaco) return;
    const specs = Array.isArray(lines) ? lines : [];
    const toPositive = (value: number) => Math.max(1, Math.floor(Number(value) || 1));
    const model = this.editor.getModel?.();
    const lineCount = Math.max(1, Math.floor(Number(model?.getLineCount?.() || 1)));

    const decorations = specs.map((spec) => {
      const start = Math.min(lineCount, toPositive(spec.start));
      const end = Math.min(lineCount, Math.max(start, toPositive(spec.end ?? spec.start)));
      const hoverLabel = String(spec.hoverLabel || '').trim();
      const endColumn = Math.max(1, Math.floor(Number(model?.getLineMaxColumn?.(end) || 1)));
      return {
        range: new window.monaco.Range(start, 1, end, endColumn),
        options: {
          isWholeLine: true,
          className: spec.active ? 'fa-dg-line-active' : 'fa-dg-line',
          lineNumberClassName: spec.active ? 'fa-dg-line-number-active' : 'fa-dg-line-number',
          marginClassName: spec.active ? 'fa-dg-margin-active' : 'fa-dg-margin',
          linesDecorationsClassName: spec.active ? 'fa-dg-gutter-active' : 'fa-dg-gutter',
          hoverMessage: hoverLabel ? [{ value: hoverLabel }] : undefined,
        },
      };
    });

    this.decorationIds = this.editor.deltaDecorations(this.decorationIds, decorations);
  }

  clearLineHighlights(): void {
    if (!this.editor) return;
    this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
  }

  revealLine(line: number): void {
    if (!this.editor) return;
    const normalized = Math.max(1, Math.floor(Number(line) || 1));
    this.editor.revealLineInCenter?.(normalized);
  }

  // ---------- helpers ----------

  /**
   * Loads the tokenizers for `preloadLanguages` while the editor is set up, so
   * a file of another language opened later is highlighted without a download.
   */
  private preloadLanguageSupport(): void {
    const req = (window as any).require;
    if (typeof req !== 'function') return;

    const moduleIds = new Set<string>();
    for (const language of this.preloadLanguages ?? []) {
      const moduleId = LANGUAGE_TOKENIZER_MODULES[this.normalizeLanguage(language)];
      if (moduleId && !MonacoEditorComponent.requestedLanguageModules.has(moduleId)) moduleIds.add(moduleId);
    }
    if (!moduleIds.size) return;

    moduleIds.forEach((moduleId) => MonacoEditorComponent.requestedLanguageModules.add(moduleId));
    try {
      // When both downloads fail, Monaco shows that language as plain text; the
      // error callback keeps the failure from surfacing as an unhandled error.
      req([...moduleIds], () => { }, () => { });
    } catch { }
  }

  private registerDefaultTheme(): void {
    // Monaco requires hex colors rather than CSS variables. Its built-in dark
    // comment color falls below 4.5:1, so use the shared muted text token.
    const commentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--uf-text-tertiary').trim() || '#9aa1ae';
    window.monaco.editor.defineTheme(DEFAULT_EDITOR_THEME, {
      base: 'vs-dark',
      inherit: true,
      rules: [{ token: 'comment', foreground: commentColor.replace(/^#/, '') }],
      colors: {},
    });
    if (this.theme === 'fa-interview-dark' || this.options?.theme === 'fa-interview-dark') {
      // Interview code often contains regex examples. The default dark regexp
      // token is below AA contrast at 13px; opt this screen into the accent token.
      const regexpColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--uf-accent').trim() || commentColor;
      window.monaco.editor.defineTheme('fa-interview-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: commentColor.replace(/^#/, '') },
          { token: 'regexp', foreground: regexpColor.replace(/^#/, '') },
        ],
        colors: {},
      });
    }
  }

  private normalizeLanguage(lang: string): string {
    const l = (lang || '').toLowerCase();
    const map: Record<string, string> = {
      ts: 'typescript',
      typescript: 'typescript',
      js: 'javascript',
      javascript: 'javascript',

      vue: 'html',
      'vue-html': 'html',
      'vue-ts': 'typescript',

      jsonc: 'json',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
      shell: 'shell',
      http: 'plaintext',
      text: 'plaintext',
      plaintext: 'plaintext',
    };
    return map[l] || l || 'plaintext';
  }

  private applyInteractivity() {
    const host = this.container.nativeElement;
    if (this.interactive) {
      host.style.pointerEvents = '';
      host.style.userSelect = '';
    } else {
      host.style.pointerEvents = 'none';
      host.style.userSelect = 'none';
    }
  }

  private scheduleReadyEmit(attempt = 0) {
    if (this.readyEmitted || this.disposed || !this.isBrowser) return;
    const el = this.container?.nativeElement;
    if (el && el.clientWidth > 0 && el.clientHeight > 0) {
      this.readyEmitted = true;
      this.ready.emit();
      return;
    }
    // Hidden tabs (display:none) can keep size at 0 for a while. After the fast
    // rAF loop, fall back to a slow poll so we still emit when it becomes visible.
    if (attempt <= 120) {
      requestAnimationFrame(() => this.scheduleReadyEmit(attempt + 1));
      return;
    }
    setTimeout(() => this.scheduleReadyEmit(attempt + 1), 250);
  }

  /** Resize host height to content (and clamp to maxHeight if provided). */
  private fit() {
    if (!this.editor) return;

    const content = this.editor.getContentHeight?.() || 0;
    const padding = 8; // avoid cropping bottom shadows
    const wanted = Math.max(this.minHeight, Math.ceil(content + padding));
    const finalH = this.maxHeight ? Math.min(wanted, this.maxHeight) : wanted;

    const hostEl = this.container.nativeElement.parentElement as HTMLElement; // <app-monaco-editor> host
    hostEl.style.height = `${finalH}px`;

    // If content exceeds cap, allow inner scroll
    const overflow = (this.maxHeight && wanted > this.maxHeight) ? 'auto' : 'hidden';
    this.container.nativeElement.style.overflow = overflow;

    this.layoutToCurrentSize(finalH);
  }

  /** Re-layout the editor to current DOM size (height optional). */
  private layoutToCurrentSize(explicitH?: number) {
    if (!this.editor) return;
    const hostEl = this.container.nativeElement.parentElement as HTMLElement;
    const width = hostEl.clientWidth || this.container.nativeElement.clientWidth || 0;
    const height =
      explicitH ??
      (hostEl.clientHeight || this.container.nativeElement.clientHeight || 0);
    this.editor.layout?.({ width, height });
  }

  private toMonacoLoadError(error: unknown, fallbackMessage: string): MonacoLoadError {
    const candidate = error as any;
    if (candidate && typeof candidate.message === 'string' && !this.isOpaqueEventMessage(candidate.message)) {
      const normalized: MonacoLoadError = {
        message: candidate.message,
        phase: typeof candidate.phase === 'string' ? candidate.phase : undefined,
        moduleId: typeof candidate.moduleId === 'string' ? candidate.moduleId : undefined,
      };
      const url = this.extractLoadUrl(candidate, normalized.moduleId);
      return url ? { ...normalized, url } : normalized;
    }

    const messageFromError = error instanceof Error ? error.message : '';
    const messageFromNestedError = typeof candidate?.error?.message === 'string' ? candidate.error.message : '';
    const messageFromString = typeof error === 'string' ? error : '';
    const rawMessage = messageFromError || messageFromNestedError || messageFromString;
    const message = rawMessage && !this.isOpaqueEventMessage(rawMessage) ? rawMessage : fallbackMessage;
    const moduleId = typeof candidate?.moduleId === 'string' ? candidate.moduleId : undefined;
    const url = this.extractLoadUrl(candidate, moduleId);

    return {
      message,
      phase: typeof candidate?.phase === 'string' ? candidate.phase : undefined,
      moduleId,
      ...(url ? { url } : {}),
    };
  }

  private isOpaqueEventMessage(message: string): boolean {
    return message === '[object Event]' || message === '[object ProgressEvent]' || message === 'Event';
  }

  private extractLoadUrl(error: any, moduleId?: string): string | undefined {
    if (typeof error?.url === 'string' && error.url) return error.url;
    const target = error?.target || error?.currentTarget || error?.srcElement;
    const targetSrc = typeof target?.src === 'string' ? target.src : '';
    if (targetSrc) return targetSrc;

    if (!moduleId) return undefined;

    const modulePath = moduleId.replace(/^vs\//, '');
    const jsPath = modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`;
    try {
      return new URL(`${this.vsBasePath}/${jsPath}`, document.baseURI).toString();
    } catch {
      return `${this.vsBasePath}/${jsPath}`;
    }
  }

  // ---------- AMD bootstrap ----------
  private ensureMonaco(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    const win = window as any;
    if (win.__faMonacoReady || MonacoEditorComponent.monacoReady) return Promise.resolve();
    if (win.__faMonacoLoaderPromise) return win.__faMonacoLoaderPromise as Promise<void>;
    if (MonacoEditorComponent.loaderPromise) return MonacoEditorComponent.loaderPromise;

    const loaderPromise = new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        fail({
          message: 'Monaco editor assets timed out while loading.',
          phase: 'timeout',
          moduleId: 'vs/editor/editor.main',
          url: this.extractLoadUrl(null, 'vs/editor/editor.main'),
        });
      }, 15000);

      const succeed = () => {
        if (settled) return;
        if (!win.monaco?.editor?.create) {
          fail({
            message: 'Monaco editor API was not available after loading assets.',
            phase: 'loading',
            moduleId: 'vs/editor/editor.main',
            url: this.extractLoadUrl(null, 'vs/editor/editor.main'),
          });
          return;
        }
        settled = true;
        window.clearTimeout(timeout);
        MonacoEditorComponent.monacoReady = true;
        win.__faMonacoReady = true;
        resolve();
      };

      const fail = (error: unknown, fallbackMessage = 'Monaco editor assets failed to load.') => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        MonacoEditorComponent.monacoReady = false;
        win.__faMonacoReady = false;
        MonacoEditorComponent.loaderPromise = null;
        delete win.__faMonacoLoaderPromise;
        if (typeof win.require !== 'function') {
          document.querySelectorAll<HTMLScriptElement>('script[data-fa-monaco-loader]').forEach((script) => {
            script.remove();
          });
        }
        reject(this.toMonacoLoadError(error, fallbackMessage));
      };

      const start = () => {
        try {
          if (!(window as any).MonacoEnvironment) {
            (window as any).MonacoEnvironment = {
              getWorker: (_moduleId: string, label: string) => createTrackedMonacoWorker(
                new URL(`${this.vsBasePath}/base/worker/workerMain.js`, document.baseURI).toString(),
                label,
              ),
            };
          }

          const req: any = (window as any).require;
          if (typeof req !== 'function') {
            fail({
              message: 'Monaco AMD loader did not expose require().',
              phase: 'loading',
              url: new URL(this.amdLoaderPath, document.baseURI).toString(),
            });
            return;
          }

          if (typeof req.config === 'function') {
            req.config({
              // The AMD loader tries a module's paths in order, so listing the
              // base twice downloads a module a second time when the first
              // attempt fails, including the ones Monaco loads later.
              paths: { vs: [this.vsBasePath, this.vsBasePath] },
              // ensureMonaco loads editor.main.css itself (see below).
              'vs/css': { disabled: true },
              onError: (error: unknown) => fail(error),
            });
            req.configuredForVs = true;
          }

          req(['vs/editor/editor.main'], () => {
            try {
              const monaco = (window as any).monaco;
              const ts = monaco?.languages?.typescript;
              if (!monaco?.editor?.create || !ts?.typescriptDefaults) {
                fail({
                  message: 'Monaco editor main module loaded without the expected editor API.',
                  phase: 'loading',
                  moduleId: 'vs/editor/editor.main',
                  url: this.extractLoadUrl(null, 'vs/editor/editor.main'),
                });
                return;
              }

              MonacoEditorComponent.installWebCompletions(monaco);

              const customWorkerPath = new URL(
                'assets/monaco/signature-help-worker.js', document.baseURI,
              ).toString();
              for (const defaults of [ts.typescriptDefaults, ts.javascriptDefaults]) {
                defaults.setWorkerOptions({ ...defaults.workerOptions, customWorkerPath });
              }

          // NEW: ensure models sync early and soften diagnostics for “module not found” cases
          ts.typescriptDefaults.setEagerModelSync?.(true);   // push models to the worker ASAP
          ts.typescriptDefaults.addExtraLib?.(
            'declare module "*";',
            'file:///node_modules/@types/__fa_any__/index.d.ts'
          );

          const sharedCompilerOptions = {
            allowJs: true,
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            esModuleInterop: true,
            skipLibCheck: true,
            strict: false,
            experimentalDecorators: true,     // Angular uses legacy decorators
            useDefineForClassFields: false,   // align with Angular field semantics
            allowImportingTsExtensions: true,
            baseUrl: 'file:///',
          };

          ts.typescriptDefaults.setCompilerOptions(sharedCompilerOptions);
          ts.javascriptDefaults?.setCompilerOptions?.({
            ...sharedCompilerOptions,
            allowJs: true,
          });

          const sharedDiagnostics = { diagnosticCodesToIgnore: [2307, 2792] };
          ts.typescriptDefaults.setDiagnosticsOptions(sharedDiagnostics);
          ts.javascriptDefaults?.setDiagnosticsOptions?.(sharedDiagnostics);

          const mAny = monaco as any;
          if (!mAny.__faAngularCoreLib) {
            const angularCoreLib = [
              "declare module '@angular/core' {",
              "  export interface OnInit { ngOnInit(): void; }",
              "  export interface OnDestroy { ngOnDestroy(): void; }",
              "  export interface DoCheck { ngDoCheck(): void; }",
              "  export interface OnChanges { ngOnChanges(changes: SimpleChanges): void; }",
              "  export interface AfterContentInit { ngAfterContentInit(): void; }",
              "  export interface AfterContentChecked { ngAfterContentChecked(): void; }",
              "  export interface AfterViewInit { ngAfterViewInit(): void; }",
              "  export interface AfterViewChecked { ngAfterViewChecked(): void; }",
              "  export function ViewChild(token: any, opts?: any): any;",
              "  export function ViewChildren(token: any, opts?: any): any;",
              "  export function ContentChild(token: any, opts?: any): any;",
              "  export function ContentChildren(token: any, opts?: any): any;",
              "  export class ElementRef<T = any> { constructor(nativeElement: T); nativeElement: T; }",
              "  export class QueryList<T = any> implements Iterable<T> { readonly length: number; readonly first: T; readonly last: T; readonly changes: any; toArray(): T[]; get(index: number): T | undefined; map<U>(fn: (item: T, index: number) => U): U[]; forEach(fn: (item: T, index: number) => void): void; find(fn: (item: T) => boolean): T | undefined; [Symbol.iterator](): Iterator<T>; }",
              "  export abstract class Renderer2 { createElement(name: string, namespace?: string | null): any; appendChild(parent: any, child: any): void; removeChild(parent: any, oldChild: any): void; setAttribute(el: any, name: string, value: string): void; removeAttribute(el: any, name: string): void; addClass(el: any, name: string): void; removeClass(el: any, name: string): void; setStyle(el: any, style: string, value: any): void; removeStyle(el: any, style: string): void; setProperty(el: any, name: string, value: any): void; listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void; }",
              "  export interface SimpleChange { previousValue: any; currentValue: any; firstChange: boolean; isFirstChange(): boolean; }",
              "  export type SimpleChanges = { [propName: string]: SimpleChange };",
              "  export interface PipeTransform { transform(value: any, ...args: any[]): any; }",
              "  export interface ErrorHandler { handleError(error: any): void; }",
              "  export interface Type<T> extends Function { new (...args: any[]): T; }",
              "  export class EventEmitter<T = any> { constructor(isAsync?: boolean); emit(value?: T): void; subscribe(next?: (value: T) => void): { unsubscribe(): void }; }",
              "  export interface InjectionToken<T> { _desc: string; }",
              "  export function Injectable(opts?: any): ClassDecorator;",
              "  export function Component(opts: any): ClassDecorator;",
              "  export function Directive(opts: any): ClassDecorator;",
              "  export function Pipe(opts: any): ClassDecorator;",
              "  export function NgModule(opts: any): ClassDecorator;",
              "  export function Input(bindingPropertyName?: string): any;",
              "  export function Output(bindingPropertyName?: string): any;",
              "  export function inject(token: any): any;",
              "  export function HostListener(eventName: string, args?: string[]): any;",
              "  export function HostBinding(hostPropertyName?: string): any;",
              "  export function Optional(): any;",
              "  export function Inject(token: any): any;",
              "  export function SkipSelf(): any;",
              "  export function Self(): any;",
              "  export function Host(): any;",
              "  export function forwardRef(fn: () => any): any;",
              // Signals and the signal-based component API, which current Angular code uses throughout.
              "  export interface Signal<T> { (): T; }",
              "  export interface WritableSignal<T> extends Signal<T> { set(value: T): void; update(fn: (value: T) => T): void; asReadonly(): Signal<T>; }",
              "  export function signal<T>(initialValue: T, options?: any): WritableSignal<T>;",
              "  export function computed<T>(computation: () => T, options?: any): Signal<T>;",
              "  export function effect(fn: (onCleanup: (cleanup: () => void) => void) => void, options?: any): { destroy(): void };",
              "  export function untracked<T>(fn: () => T): T;",
              "  export interface InputSignal<T> extends Signal<T> {}",
              "  export interface ModelSignal<T> extends WritableSignal<T> {}",
              "  export interface OutputEmitterRef<T> { emit(value: T): void; subscribe(fn: (value: T) => void): { unsubscribe(): void }; }",
              "  export const input: { <T>(initialValue?: T, opts?: any): InputSignal<T>; required<T>(opts?: any): InputSignal<T> };",
              "  export const model: { <T>(initialValue?: T, opts?: any): ModelSignal<T>; required<T>(opts?: any): ModelSignal<T> };",
              "  export function output<T = void>(opts?: any): OutputEmitterRef<T>;",
              "  export const viewChild: { <T = any>(locator: any, opts?: any): Signal<T | undefined>; required<T = any>(locator: any, opts?: any): Signal<T> };",
              "  export function viewChildren<T = any>(locator: any, opts?: any): Signal<ReadonlyArray<T>>;",
              "  export const contentChild: { <T = any>(locator: any, opts?: any): Signal<T | undefined>; required<T = any>(locator: any, opts?: any): Signal<T> };",
              "  export function contentChildren<T = any>(locator: any, opts?: any): Signal<ReadonlyArray<T>>;",
              "  export class DestroyRef { onDestroy(callback: () => void): () => void; }",
              "  export enum ChangeDetectionStrategy { OnPush = 0, Default = 1 }",
              "  export class ChangeDetectorRef { markForCheck(): void; detectChanges(): void; detach(): void; reattach(): void; }",
              "  export class NgZone { run<T>(fn: () => T): T; runOutsideAngular<T>(fn: () => T): T; }",
              "  export function afterNextRender(fn: () => void, options?: any): { destroy(): void };",
              "  export function provideZoneChangeDetection(options?: any): any;",
              "  export function provideZonelessChangeDetection(): any;",
              "  export function provideExperimentalZonelessChangeDetection(): any;",
              "  export const VERSION: { full: string; major: string; minor: string; patch: string };",
              "}",
            ].join('\n');

            ts.typescriptDefaults.addExtraLib(angularCoreLib, 'file:///node_modules/@angular/core/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularCoreLib, 'file:///node_modules/@angular/core/index.d.ts');
            mAny.__faAngularCoreLib = true;
          }

          if (!mAny.__faReactLib) {
            // Joined with real newlines: a literal "\\n" separator leaves stray tokens that break the namespace.
            const reactLib = [
              "declare namespace JSX {",
              "  interface IntrinsicElements { [elemName: string]: any; }",
              "  interface IntrinsicAttributes { key?: string | number | null; }",
              "  interface ElementChildrenAttribute { children: {}; }",
              "}",
              "declare module 'react' {",
              "  namespace React {",
              "    type ReactNode = any;",
              "    type ReactElement = any;",
              "    type Key = string | number;",
              "    type CSSProperties = { [property: string]: any };",
              "    type FC<P = {}> = (props: P & { children?: any }) => any;",
              "    type SetStateAction<S> = S | ((prev: S) => S);",
              "    type Dispatch<A> = (value: A) => void;",
              "    type Reducer<S, A> = (state: S, action: A) => S;",
              "    interface Context<T> { Provider: any; Consumer: any; displayName?: string; }",
              "    interface SyntheticEvent<T = Element, E = Event> {",
              "      currentTarget: T;",
              "      target: EventTarget & T;",
              "      nativeEvent: E;",
              "      preventDefault(): void;",
              "      stopPropagation(): void;",
              "      [key: string]: any;",
              "    }",
              "    interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}",
              "    interface FormEvent<T = Element> extends SyntheticEvent<T> {}",
              "    interface FocusEvent<T = Element> extends SyntheticEvent<T> {}",
              "    interface MouseEvent<T = Element> extends SyntheticEvent<T> {}",
              "    interface KeyboardEvent<T = Element> extends SyntheticEvent<T> { key: string; }",
              "    function useState<T = any>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void];",
              "    function useEffect(fn: () => void | (() => void), deps?: any[]): void;",
              "    function useLayoutEffect(fn: () => void | (() => void), deps?: any[]): void;",
              "    function useMemo<T>(factory: () => T, deps?: any[]): T;",
              "    function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;",
              "    function useRef<T = any>(v?: T): { current: T };",
              "    function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void];",
              "    function useReducer<S, A, I>(reducer: (state: S, action: A) => S, initializerArg: I, initializer: (arg: I) => S): [S, (action: A) => void];",
              "    function createContext<T>(defaultValue: T): Context<T>;",
              "    function useContext<T>(context: Context<T>): T;",
              "    function useId(): string;",
              "    function memo<T>(component: T, compare?: (previous: any, next: any) => boolean): T;",
              "    function createElement(...args: any[]): any;",
              "    const Fragment: any;",
              "    const StrictMode: any;",
              "  }",
              "  export = React;",
              "}",
            ].join('\n');
            ts.typescriptDefaults.addExtraLib(reactLib, 'file:///node_modules/@types/react/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(reactLib, 'file:///node_modules/@types/react/index.d.ts');
            mAny.__faReactLib = true;
          }

          if (!mAny.__faAngularFormsLib) {
            const angularFormsLib = [
              "declare module '@angular/forms' {",
              "  export type ValidationErrors = Record<string, any> | null;",
              "  export type ValidatorFn = (control: AbstractControl<any>) => ValidationErrors;",
              "  export type FormControlStatus = 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';",
              "  export interface FormControlOptions { nonNullable?: boolean; validators?: ValidatorFn | ValidatorFn[] | null; asyncValidators?: any; updateOn?: 'change' | 'blur' | 'submit'; }",
              "  export abstract class AbstractControl<T = any> {",
              "    readonly value: T;",
              "    readonly status: FormControlStatus;",
              "    readonly valid: boolean;",
              "    readonly invalid: boolean;",
              "    readonly pending: boolean;",
              "    readonly disabled: boolean;",
              "    readonly enabled: boolean;",
              "    readonly touched: boolean;",
              "    readonly untouched: boolean;",
              "    readonly dirty: boolean;",
              "    readonly pristine: boolean;",
              "    readonly errors: ValidationErrors;",
              "    readonly valueChanges: any;",
              "    readonly statusChanges: any;",
              "    readonly events: any;",
              "    setValue(value: T, options?: any): void;",
              "    patchValue(value: any, options?: any): void;",
              "    reset(value?: any, options?: any): void;",
              "    getRawValue(): any;",
              "    get(path: string | Array<string | number>): AbstractControl<any> | null;",
              "    hasError(errorCode: string, path?: string | Array<string | number>): boolean;",
              "    getError(errorCode: string, path?: string | Array<string | number>): any;",
              "    disable(options?: any): void;",
              "    enable(options?: any): void;",
              "    markAsTouched(options?: any): void;",
              "    markAsUntouched(options?: any): void;",
              "    markAsDirty(options?: any): void;",
              "    markAsPristine(options?: any): void;",
              "    markAllAsTouched(): void;",
              "    updateValueAndValidity(options?: any): void;",
              "    setErrors(errors: ValidationErrors, options?: any): void;",
              "  }",
              "  export class FormControl<T = any> extends AbstractControl<T> {",
              "    constructor(value: T, validatorOrOpts?: ValidatorFn | ValidatorFn[] | FormControlOptions | null, asyncValidator?: any);",
              "  }",
              "  export class FormGroup<T extends Record<string, any> = any> extends AbstractControl<T> {",
              "    controls: { [K in keyof T]: AbstractControl<T[K]> };",
              "    constructor(controls: { [key: string]: AbstractControl<any> | any[] }, validatorOrOpts?: any);",
              "  }",
              "  export class FormArray<T = any> extends AbstractControl<T[]> {",
              "    controls: AbstractControl<T>[];",
              "    readonly length: number;",
              "    constructor(controls: AbstractControl<T>[], validatorOrOpts?: any);",
              "    at(index: number): AbstractControl<T>;",
              "    push(control: AbstractControl<T>): void;",
              "    insert(index: number, control: AbstractControl<T>): void;",
              "    removeAt(index: number): void;",
              "    clear(): void;",
              "  }",
              "  export class FormBuilder {",
              "    readonly nonNullable: FormBuilder;",
              "    group(controls: { [key: string]: any }, options?: any): FormGroup<any>;",
              "    control<T>(value: T, validatorOrOpts?: ValidatorFn | ValidatorFn[] | FormControlOptions | null): FormControl<T>;",
              "    array(controls: any[], validatorOrOpts?: any): FormArray<any>;",
              "  }",
              "  export class NonNullableFormBuilder extends FormBuilder {}",
              "  export class Validators {",
              "    static required: ValidatorFn;",
              "    static requiredTrue: ValidatorFn;",
              "    static email: ValidatorFn;",
              "    static nullValidator: ValidatorFn;",
              "    static minLength(min: number): ValidatorFn;",
              "    static maxLength(max: number): ValidatorFn;",
              "    static min(min: number): ValidatorFn;",
              "    static max(max: number): ValidatorFn;",
              "    static pattern(pattern: string | RegExp): ValidatorFn;",
              "    static compose(validators: Array<ValidatorFn | null>): ValidatorFn | null;",
              "  }",
              "  export interface ControlValueAccessor {",
              "    writeValue(value: any): void;",
              "    registerOnChange(fn: any): void;",
              "    registerOnTouched(fn: any): void;",
              "    setDisabledState?(isDisabled: boolean): void;",
              "  }",
              "  export const NG_VALUE_ACCESSOR: any;",
              "  export const NG_VALIDATORS: any;",
              "  export class ReactiveFormsModule {}",
              "  export class FormsModule {}",
              "}",
            ].join('\n');
            ts.typescriptDefaults.addExtraLib(angularFormsLib, 'file:///node_modules/@angular/forms/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularFormsLib, 'file:///node_modules/@angular/forms/index.d.ts');
            mAny.__faAngularFormsLib = true;
          }

          if (!mAny.__faAngularHttpLib) {
            const angularHttpLib = [
              "declare module '@angular/common/http' {",
              "  export class HttpClient {",
              "    constructor(handler: any);",
              "    get<T = any>(url: string, options?: any): any;",
              "    post<T = any>(url: string, body: any, options?: any): any;",
              "    put<T = any>(url: string, body: any, options?: any): any;",
              "    patch<T = any>(url: string, body: any, options?: any): any;",
              "    delete<T = any>(url: string, options?: any): any;",
              "  }",
              "  export function provideHttpClient(...features: any[]): any;",
              "  export function withFetch(): any;",
              "  export function withInterceptors(interceptors: any[]): any;",
              "  export class HttpErrorResponse { readonly status: number; readonly statusText: string; readonly message: string; readonly error: any; readonly url: string | null; }",
              "  export class HttpClientModule {}",
              "  export class HttpResponse<T = any> { constructor(init: { status?: number; body?: T }); status: number; body: T; }",
              "  export class HttpRequest<T = any> { constructor(method: string, url: string, body?: T); }",
              "  export type HttpEvent<T = any> = HttpResponse<T>;",
              "  export abstract class HttpBackend { handle(req: HttpRequest<any>): any; }",
              "}",
            ].join('\n');
            ts.typescriptDefaults.addExtraLib(angularHttpLib, 'file:///node_modules/@angular/common/http/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularHttpLib, 'file:///node_modules/@angular/common/http/index.d.ts');
            mAny.__faAngularHttpLib = true;
          }

          if (!mAny.__faRxjsLib) {
            // Generated from the installed typings: without it every rxjs import is `any`, so generic calls such as
            // `new Subject<string>()` and types such as `Observable<User[]>` show as errors in correct code.
            ts.typescriptDefaults.addExtraLib(EDITOR_RXJS_TYPINGS, 'file:///node_modules/rxjs/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(EDITOR_RXJS_TYPINGS, 'file:///node_modules/rxjs/index.d.ts');
            mAny.__faRxjsLib = true;
          }

          if (!mAny.__faTestLib) {
            const testLib = [
              "declare function describe(name: string, fn: () => void): void;",
              "declare function it(name: string, fn: () => void): void;",
              "declare function test(name: string, fn: () => void): void;",
              "declare function expect(actual: any): any;",
              "declare const beforeEach: (fn: () => void) => void;",
              "declare const afterEach: (fn: () => void) => void;",
              "declare const beforeAll: (fn: () => void) => void;",
              "declare const afterAll: (fn: () => void) => void;",
              "declare function useFakeTimers(): void;",
              "declare function useRealTimers(): void;",
              "declare function advanceTimersByTime(ms: number): void;",
              "declare function advanceTimersByTimeAsync(ms: number): Promise<void>;",
            ].join('\n');
            ts.typescriptDefaults.addExtraLib(testLib, 'file:///node_modules/@types/fa-test/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(testLib, 'file:///node_modules/@types/fa-test/index.d.ts');
            mAny.__faTestLib = true;
          }

          if (!mAny.__faNodeShimLib) {
            const nodeShim = [
              "declare var require: any;",
              "declare var module: any;",
              "declare var exports: any;",
              "declare var process: { env: Record<string, string | undefined> };",
              "declare var __dirname: string;",
              "declare var __filename: string;",
            ].join('\n');
            ts.typescriptDefaults.addExtraLib(nodeShim, 'file:///node_modules/@types/fa-node-shim/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(nodeShim, 'file:///node_modules/@types/fa-node-shim/index.d.ts');
            mAny.__faNodeShimLib = true;
          }

              // If the stylesheet failed, the load has already failed and succeed() does nothing.
              void stylesheetLoaded.then(succeed);
            } catch (error) {
              fail(error, 'Monaco editor setup failed.');
            }
          }, (error: unknown) => fail(error));
        } catch (error) {
          fail(error, 'Monaco editor bootstrap failed.');
        }
      };

      // Monaco's own CSS plugin requests editor.main.css only once, so one
      // dropped request left the visitor with the plain text area. The
      // stylesheet is loaded here instead, alongside the scripts, with one
      // retry; the editor is created only once it has loaded.
      const stylesheetUrl = new URL(`${this.vsBasePath}/editor/editor.main.css`, document.baseURI).toString();
      const stylesheetLoaded = this.loadStylesheet(stylesheetUrl, 'vs/editor/editor.main').catch(() => fail({
        message: 'Monaco editor stylesheet failed to load.',
        phase: 'loading',
        moduleId: 'vs/css!vs/editor/editor.main',
        url: stylesheetUrl,
      }));

      // If AMD loader already present, start immediately; otherwise load it
      if ((window as any).require && typeof (window as any).require === 'function') {
        start();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-fa-monaco-loader], script[src*="monaco/min/vs/loader.js"]'
      );
      if (existing) {
        if (existing.dataset['faMonacoFailed'] === 'true') {
          existing.remove();
        } else {
          existing.addEventListener('load', () => {
            start();
          }, { once: true });
          existing.addEventListener('error', (event) => {
            existing.dataset['faMonacoFailed'] = 'true';
            existing.remove();
            fail({
              message: 'Monaco AMD loader script failed to load.',
              phase: 'loading',
              url: existing.src,
              target: event.target,
            });
          }, { once: true });
          return;
        }
      }

      const s = document.createElement('script');
      s.src = this.amdLoaderPath;
      s.dataset['faMonacoLoader'] = 'true';
      s.onload = () => { start(); };
      s.onerror = (event) => {
        s.dataset['faMonacoFailed'] = 'true';
        s.remove();
        const loadEvent = event instanceof Event ? event : null;
        fail({
          message: 'Monaco AMD loader script failed to load.',
          phase: 'loading',
          url: s.src,
          target: loadEvent?.target,
        });
      };
      document.head.appendChild(s);
    });

    MonacoEditorComponent.loaderPromise = loaderPromise;
    win.__faMonacoLoaderPromise = loaderPromise;
    return loaderPromise;
  }

  private getLanguageDefaultOptions(langNorm: string): any {
    if (langNorm === 'html') {
      return {
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoClosingTags: true,
        acceptSuggestionOnEnter: 'on',
        acceptSuggestionOnCommitCharacter: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: true },
        tabCompletion: 'on',
        tabFocusMode: false,
        snippetSuggestions: 'inline',
        suggestSelection: 'first',
      };
    }

    if (langNorm === 'css') {
      return {
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        acceptSuggestionOnEnter: 'on',
        acceptSuggestionOnCommitCharacter: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: true },
        tabCompletion: 'on',
        tabFocusMode: false,
        snippetSuggestions: 'inline',
        suggestSelection: 'first',
      };
    }

    return {};
  }

  private static installWebCompletions(monaco: any) {
    if (MonacoEditorComponent.webCompletionsInstalled) return;
    MonacoEditorComponent.webCompletionsInstalled = true;

    const getSiblingModel = (model: any, fromSuffix: string, toSuffix: string) => {
      const uriStr = model?.uri?.toString?.() || '';
      if (!uriStr.endsWith(fromSuffix)) return null;
      try {
        const siblingUri = monaco.Uri.parse(uriStr.replace(fromSuffix, toSuffix));
        return monaco.editor.getModel(siblingUri);
      } catch {
        return null;
      }
    };

    const extractCssTokens = (css: string) => {
      const classes = new Set<string>();
      const ids = new Set<string>();

      const classRe = /\.([_a-zA-Z][\w-]*)/g;
      const idRe = /#([_a-zA-Z][\w-]*)/g;

      for (let m; (m = classRe.exec(css));) classes.add(m[1]);
      for (let m; (m = idRe.exec(css));) ids.add(m[1]);

      return {
        classes: Array.from(classes.values()).sort(),
        ids: Array.from(ids.values()).sort(),
      };
    };

    const extractHtmlTokens = (html: string) => {
      const classes = new Set<string>();
      const ids = new Set<string>();

      const classAttrRe = /\bclass\s*=\s*(["'])(.*?)\1/gi;
      const idAttrRe = /\bid\s*=\s*(["'])(.*?)\1/gi;

      for (let m; (m = classAttrRe.exec(html));) {
        const val = m[2] || '';
        for (const token of val.split(/\s+/g)) {
          if (token && /^[_a-zA-Z][\w-]*$/.test(token)) classes.add(token);
        }
      }
      for (let m; (m = idAttrRe.exec(html));) {
        const token = (m[2] || '').trim();
        if (token && /^[_a-zA-Z][\w-]*$/.test(token)) ids.add(token);
      }

      return {
        classes: Array.from(classes.values()).sort(),
        ids: Array.from(ids.values()).sort(),
      };
    };

    // HTML: suggest CSS class/id names inside class="" and id="".
    monaco.languages.registerCompletionItemProvider('html', {
      triggerCharacters: ['"', '\'', ' '],
      provideCompletionItems: (model: any, position: any) => {
        const cssModel = getSiblingModel(model, '-html.html', '-css.css');
        if (!cssModel) return { suggestions: [] };

        const line = model.getLineContent(position.lineNumber);
        const before = line.slice(0, Math.max(0, position.column - 1));
        const m = /(?:^|[\s<])(?:(class|id)\s*=\s*)(["'])([^"']*)$/i.exec(before);
        if (!m) return { suggestions: [] };

        const attr = (m[1] || '').toLowerCase();
        const valueSoFar = m[3] || '';

        const { classes, ids } = extractCssTokens(cssModel.getValue?.() || '');
        const pool = attr === 'class' ? classes : attr === 'id' ? ids : [];
        if (!pool.length) return { suggestions: [] };

        const typed =
          attr === 'class'
            ? (valueSoFar.split(/\s+/g).pop() || '')
            : valueSoFar;

        const startColumn = Math.max(1, position.column - typed.length);
        const range = new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column);
        const typedLower = typed.toLowerCase();

        const kind =
          attr === 'id'
            ? monaco.languages.CompletionItemKind.Value
            : monaco.languages.CompletionItemKind.Class;

        const suggestions = pool
          .filter((t) => !typedLower || t.toLowerCase().startsWith(typedLower))
          .map((t) => ({
            label: t,
            kind,
            insertText: t,
            range,
          }));

        return { suggestions };
      },
    });

    // HTML: expand plain tag names (Emmet-lite), e.g. `h1` -> `<h1></h1>`.
    monaco.languages.registerCompletionItemProvider('html', {
      provideCompletionItems: (model: any, position: any) => {
        if (!model?.getWordUntilPosition) return { suggestions: [] };

        const wordInfo = model.getWordUntilPosition(position);
        const word = (wordInfo?.word || '').trim();
        if (!word) return { suggestions: [] };
        if (position.column !== wordInfo.endColumn) return { suggestions: [] };

        const tag = word.toLowerCase();
        if (!/^[a-z][\w-]*$/.test(tag)) return { suggestions: [] };

        const line = model.getLineContent(position.lineNumber) || '';
        const startIdx = Math.max(0, wordInfo.startColumn - 2); // 0-based char before word
        const endIdx = Math.max(0, wordInfo.endColumn - 1);     // 0-based char after word
        const chBefore = line[startIdx] || '';
        const chAfter = line[endIdx] || '';

        // Only expand when the word is a standalone "token" (avoid inline text surprises)
        if (chBefore && !/\s|[>({[]/.test(chBefore)) return { suggestions: [] };
        if (chAfter && !/\s|[<})\\]]/.test(chAfter)) return { suggestions: [] };

        // Don't offer this inside an existing tag like `<h|` or attributes.
        const before = line.slice(0, Math.max(0, wordInfo.startColumn - 1));
        const beforeTrimmed = before.trimEnd();
        if (beforeTrimmed && !/[>({[]$/.test(beforeTrimmed)) return { suggestions: [] };
        const lastLt = before.lastIndexOf('<');
        const lastGt = before.lastIndexOf('>');
        if (lastLt > lastGt) return { suggestions: [] };

        const COMMON_TAGS = new Set([
          'a', 'article', 'aside', 'button', 'caption', 'div', 'em', 'figure', 'figcaption', 'footer', 'form',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'img', 'input', 'label', 'li', 'link', 'main',
          'meta', 'nav', 'ol', 'option', 'p', 'section', 'select', 'small', 'span', 'strong', 'table', 'tbody',
          'td', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'ul',
        ]);
        if (!COMMON_TAGS.has(tag)) return { suggestions: [] };

        const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

        const snippetByTag: Record<string, string> = {
          a: `<a href="$1">$0</a>`,
          button: `<button type="$1">$0</button>`,
          form: `<form action="$1">$0</form>`,
          img: `<img src="$1" alt="$2" />`,
          input: `<input type="$1" name="$2" />`,
          link: `<link rel="$1" href="$2" />`,
          meta: `<meta name="$1" content="$2" />`,
        };

        const snippet =
          snippetByTag[tag] ||
          (VOID_TAGS.has(tag) ? `<${tag} $0>` : `<${tag}>$0</${tag}>`);

        const range = new monaco.Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
        const rules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

        return {
          suggestions: [
            {
              label: word,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet,
              insertTextRules: rules,
              range,
              sortText: `0-${tag}`,
              detail: `Expand to ${snippet.replace(/\$[0-9]+/g, '').replace(/\$0/g, '')}`,
            },
          ],
        };
      },
    });

    // CSS: suggest HTML class/id names when typing .foo / #bar in selectors.
    monaco.languages.registerCompletionItemProvider('css', {
      triggerCharacters: ['.', '#'],
      provideCompletionItems: (model: any, position: any) => {
        const htmlModel = getSiblingModel(model, '-css.css', '-html.html');
        if (!htmlModel) return { suggestions: [] };

        const line = model.getLineContent(position.lineNumber);
        const before = line.slice(0, Math.max(0, position.column - 1));
        const m = /([.#])([_a-zA-Z][\w-]*)?$/.exec(before);
        if (!m) return { suggestions: [] };

        const sigil = m[1];
        const typed = m[2] || '';
        if (!typed) return { suggestions: [] };
        const sigilIdx = before.length - typed.length - 1;

        if (sigil === '.' && sigilIdx > 0 && /\d/.test(before[sigilIdx - 1] || '')) {
          return { suggestions: [] }; // avoid decimals like 0.5
        }
        if (sigil === '#') {
          for (let i = sigilIdx - 1; i >= 0; i--) {
            const ch = before[i];
            if (!ch || /\s/.test(ch)) continue;
            if (ch === ':') return { suggestions: [] }; // avoid colors like color: #fff
            break;
          }
        }

        const { classes, ids } = extractHtmlTokens(htmlModel.getValue?.() || '');
        const pool = sigil === '.' ? classes : ids;
        if (!pool.length) return { suggestions: [] };

        const startColumn = Math.max(1, position.column - typed.length);
        const range = new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column);
        const typedLower = typed.toLowerCase();

        const kind =
          sigil === '#'
            ? monaco.languages.CompletionItemKind.Value
            : monaco.languages.CompletionItemKind.Class;

        const suggestions = pool
          .filter((t) => !typedLower || t.toLowerCase().startsWith(typedLower))
          .map((t) => ({
            label: t,
            kind,
            insertText: t,
            range,
          }));

        return { suggestions };
      },
    });
  }

  private static fileUri(path: string): string {
    return `file:///${path.replace(/^file:\/\//, '').replace(/^\/+/, '')}`;
  }

  // Each sibling .ts or .tsx file is an extra lib at its own path, where relative imports find it. The open file never
  // is one: it is the model, and a lib at the same path would declare its contents a second time.
  private syncSiblingLibs(): void {
    const defaults = (window as any).monaco?.languages?.typescript?.typescriptDefaults;
    if (!defaults?.addExtraLib) return;
    const open = this.modelKey ? MonacoEditorComponent.fileUri(this._modelId) : '';
    const next = new Map<string, string>();
    for (const [path, content] of Object.entries(this.siblingFiles ?? {})) {
      const uri = MonacoEditorComponent.fileUri(path);
      if (uri !== open && /\.tsx?$/i.test(uri)) next.set(uri, content ?? '');
    }
    for (const [uri, { lib }] of this.siblingLibs) {
      if (next.has(uri)) continue;
      try { lib?.dispose(); } catch { }
      this.siblingLibs.delete(uri);
    }
    for (const [uri, content] of next) {
      if (this.siblingLibs.get(uri)?.content === content) continue;
      // Adding a path again replaces its content, and the older disposable no longer removes it.
      this.siblingLibs.set(uri, { content, lib: defaults.addExtraLib(content, uri) });
    }
  }

  private createOrSwapModel(langNorm: string, code: string) {
    const rawId = this._modelId; // src/App.tsx, fa-1.ts, vs.
    const previousModel = this.model;

    // Dosya path’ini düzgün bir file:// URI’sine çevir
    const uri = window.monaco.Uri.parse(MonacoEditorComponent.fileUri(rawId));

    let existing = window.monaco.editor.getModel(uri);
    if (existing) {
      if (window.monaco?.editor?.setModelLanguage) {
        window.monaco.editor.setModelLanguage(existing, langNorm);
      }
      const nextVal = code ?? '';
      if (existing.getValue() !== nextVal) existing.setValue(nextVal);
      this.model = existing;
    } else {
      this.model = window.monaco.editor.createModel(code ?? '', langNorm, uri);
    }

    if (this.editor) {
      this.editor.setModel(this.model);
    }

    // Monaco 0.52 can surface worker cancellation errors if a model is
    // disposed while an editor is still attached to it. Detach first by
    // binding the replacement model, then release the previous one.
    if (previousModel && previousModel !== this.model) {
      try { previousModel.dispose(); } catch { }
    }
  }
}
