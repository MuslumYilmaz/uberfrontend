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

    // Base options (do NOT pass "value" here; model will carry the text)
    const baseOpts = {
      language: langNorm,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: !this.autoHeight,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
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
