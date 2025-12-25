// src/app/monaco-editor.component.ts
import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, Output, SimpleChanges, ViewChild
} from '@angular/core';

declare global {
  interface Window { require: any; monaco: any; }
}

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer class="w-full"></div>`,
  styles: [`
    :host { display:block; width:100%; }
    /* When autoHeight=false, give container a default height so it doesn't collapse */
    :host(.fixed-height) > div { height: 100%; }
  `],
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() code = '';
  @Input() language: string = 'javascript';
  @Input() theme = 'vs-dark';
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

  @Output() codeChange = new EventEmitter<string>();
  @Input() modelKey?: string; // stable key from parent, e.g., "q-42-code"

  // ADD
  private editor!: any;
  private model?: any;                  // NEW: keep a handle to the model
  private suppressNextModelUpdate = false;
  private disposed = false;
  private resizeObs?: ResizeObserver;
  private static seq = 0;
  private static webCompletionsInstalled = false;
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
    await this.ensureMonaco();
    if (this.disposed) return;

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
      ...langDefaults,
      ...this.options,
    };

    if (!this.autoHeight) {
      (this.container.nativeElement.parentElement as HTMLElement)?.classList.add('fixed-height');
    }

    // ✅ Create the model first with a deterministic URI/extension
    this.createOrSwapModel(langNorm, this.code ?? '');

	    // Then create the editor bound to that model
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

	    // Mirror -> @Output
	    this.editor.onDidChangeModelContent?.(() => {
	      if (this.suppressNextModelUpdate) { this.suppressNextModelUpdate = false; return; }
	      this.codeChange.emit(this.editor.getValue());
	      if (this.autoHeight) this.fit();
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
  }


  ngOnChanges(changes: SimpleChanges) {
    if (!this.editor && !this.model) return;

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
      const next = { automaticLayout: !this.autoHeight, ...this.options };
      this.editor?.updateOptions(next);
      if (this.autoHeight) this.fit();
    }

    if (changes['readOnly'] && !changes['readOnly'].isFirstChange()) {
      this.editor?.updateOptions({ readOnly: this.readOnly });
    }

    if (changes['interactive'] && !changes['interactive'].isFirstChange()) {
      this.applyInteractivity();
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


  ngOnDestroy() {
    this.disposed = true;
    try { this.resizeObs?.disconnect(); } catch { }
    try { this.editor?.dispose?.(); } catch { }
    try { this.model?.dispose?.(); } catch { }  // keep this
  }

  // ---------- helpers ----------

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

  // ---------- AMD bootstrap ----------
  private ensureMonaco(): Promise<void> {
    return new Promise((resolve) => {
      const start = () => {
        // Configure AMD path to Monaco once
        if (!(window as any).require || !(window as any).require.configuredForVs) {
          const req: any = (window as any).require || {};
          if (req.config) req.config({ paths: { vs: this.vsBasePath } });
          else (window as any).require = Object.assign(function () { }, req, { paths: { vs: this.vsBasePath } });
          (window as any).require.configuredForVs = true;
        }

        (window as any).require(['vs/editor/editor.main'], () => {
          const monaco = (window as any).monaco;
          const ts = monaco.languages.typescript;

          MonacoEditorComponent.installWebCompletions(monaco);

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
              "}",
            ].join('\\n');

            ts.typescriptDefaults.addExtraLib(angularCoreLib, 'file:///node_modules/@angular/core/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularCoreLib, 'file:///node_modules/@angular/core/index.d.ts');
            mAny.__faAngularCoreLib = true;
          }

          if (!mAny.__faReactLib) {
            const reactLib = [
              "declare namespace JSX {",
              "  interface IntrinsicElements { [elemName: string]: any; }",
              "}",
              "declare module 'react' {",
              "  export type FC<P = {}> = (props: P & { children?: any }) => any;",
              "  export function useState<T = any>(initial: T): [T, (v: T | ((prev: T) => T)) => void];",
              "  export function useEffect(fn: () => void | (() => void), deps?: any[]): void;",
              "  export function useMemo<T>(factory: () => T, deps?: any[]): T;",
              "  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;",
              "  export function useRef<T = any>(v?: T): { current: T };",
              "  export function createElement(...args: any[]): any;",
              "  const React: { createElement: typeof createElement; Fragment: any; };",
              "  export default React;",
              "}",
            ].join('\\n');
            ts.typescriptDefaults.addExtraLib(reactLib, 'file:///node_modules/@types/react/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(reactLib, 'file:///node_modules/@types/react/index.d.ts');
            mAny.__faReactLib = true;
          }

          if (!mAny.__faAngularFormsLib) {
            const angularFormsLib = [
              "declare module '@angular/forms' {",
              "  export type ValidationErrors = Record<string, any> | null;",
              "  export type ValidatorFn = (control: AbstractControl<any>) => ValidationErrors;",
              "  export abstract class AbstractControl<T = any> {",
              "    readonly value: T;",
              "    readonly valid: boolean;",
              "    readonly invalid: boolean;",
              "    readonly touched: boolean;",
              "    readonly errors: ValidationErrors;",
              "    markAllAsTouched(): void;",
              "  }",
              "  export class FormControl<T = any> extends AbstractControl<T> {",
              "    constructor(value: T, validators?: ValidatorFn | ValidatorFn[]);",
              "    setValue(value: T): void;",
              "    reset(value?: T): void;",
              "  }",
              "  export class FormGroup<T extends Record<string, any> = any> extends AbstractControl<T> {",
              "    controls: { [K in keyof T]: AbstractControl<T[K]> };",
              "    constructor(controls: { [key: string]: AbstractControl<any> | any[] });",
              "    get(path: string): AbstractControl<any> | null;",
              "    reset(value?: Partial<T>): void;",
              "  }",
              "  export class FormBuilder {",
              "    group(controls: { [key: string]: any[] | AbstractControl<any> }): FormGroup<any>;",
              "    control<T>(value: T, validators?: ValidatorFn | ValidatorFn[]): FormControl<T>;",
              "  }",
              "  export class Validators {",
              "    static required: ValidatorFn;",
              "    static email: ValidatorFn;",
              "    static minLength(min: number): ValidatorFn;",
              "    static maxLength(max: number): ValidatorFn;",
              "  }",
              "  export class ReactiveFormsModule {}",
              "  export class FormsModule {}",
              "}",
            ].join('\\n');
            ts.typescriptDefaults.addExtraLib(angularFormsLib, 'file:///node_modules/@angular/forms/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularFormsLib, 'file:///node_modules/@angular/forms/index.d.ts');
            mAny.__faAngularFormsLib = true;
          }

          if (!mAny.__faAngularHttpLib) {
            const angularHttpLib = [
              "declare module '@angular/common/http' {",
              "  export class HttpClient {",
              "    constructor(handler: any);",
              "    post<T = any>(url: string, body: any): any;",
              "  }",
              "  export class HttpClientModule {}",
              "  export class HttpResponse<T = any> { constructor(init: { status?: number; body?: T }); status: number; body: T; }",
              "  export class HttpRequest<T = any> { constructor(method: string, url: string, body?: T); }",
              "  export type HttpEvent<T = any> = HttpResponse<T>;",
              "  export abstract class HttpBackend { handle(req: HttpRequest<any>): any; }",
            "}",
            ].join('\\n');
            ts.typescriptDefaults.addExtraLib(angularHttpLib, 'file:///node_modules/@angular/common/http/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(angularHttpLib, 'file:///node_modules/@angular/common/http/index.d.ts');
            mAny.__faAngularHttpLib = true;
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
            ].join('\\n');
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
            ].join('\\n');
            ts.typescriptDefaults.addExtraLib(nodeShim, 'file:///node_modules/@types/fa-node-shim/index.d.ts');
            ts.javascriptDefaults?.addExtraLib?.(nodeShim, 'file:///node_modules/@types/fa-node-shim/index.d.ts');
            mAny.__faNodeShimLib = true;
          }

          resolve();
        });
      };

      // If AMD loader already present, start immediately; otherwise load it
      if ((window as any).require && typeof (window as any).require === 'function') {
        start();
        return;
      }

      const s = document.createElement('script');
      s.src = this.amdLoaderPath;
      s.onload = () => { (window as any).require = (window as any).require || {}; start(); };
      s.onerror = () => { console.error('Failed to load Monaco AMD loader from', this.amdLoaderPath); resolve(); };
      document.body.appendChild(s);
    });
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

  private createOrSwapModel(langNorm: string, code: string) {
    const rawId = this._modelId; // src/App.tsx, fa-1.ts, vs.

    // Dosya path’ini düzgün bir file:// URI’sine çevir
    const normalizedPath = rawId.replace(/^file:\/\//, '').replace(/^\/+/, '');
    const uri = window.monaco.Uri.parse(`file:///${normalizedPath}`);

    // Eğer eski model başka bir URI’ye aitse dispose et
    if (this.model && this.model.uri.toString() !== uri.toString()) {
      try { this.model.dispose(); } catch { }
      this.model = undefined;
    }

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
  }
}
