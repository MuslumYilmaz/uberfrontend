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
  template: `<div #editorContainer class="h-full w-full"></div>`,
  styles: [`
    :host { display:block; width:100%; }
    /* let the host height be driven either by parent (h-full) or by autoHeight */
  `],
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() code = '';
  @Input() language: string = 'javascript';
  @Input() theme = 'vs-dark';
  @Input() options: any = { automaticLayout: true };
  @Input() readOnly = false;

  /** New: disable mouse/keyboard and selection */
  @Input() interactive = true;

  /** New: grow the editor to fit the content (no inner scrollbars) */
  @Input() autoHeight = false;

  @Output() codeChange = new EventEmitter<string>();

  private editorInstance: any;
  private suppressNextModelUpdate = false;
  private disposed = false;

  private readonly amdLoaderPath = 'assets/monaco/min/vs/loader.js';
  private readonly vsBasePath = 'assets/monaco/min/vs';

  async ngAfterViewInit() {
    await this.ensureMonaco();
    if (this.disposed) return;

    // Theme first
    window.monaco?.editor?.setTheme?.(this.theme);

    this.editorInstance = window.monaco.editor.create(this.container.nativeElement, {
      value: this.code,
      language: this.normalizeLanguage(this.language),
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      ...this.options,
    });

    // Raise codeChange (disabled when we programmatically setValue)
    this.editorInstance.onDidChangeModelContent?.(() => {
      if (this.suppressNextModelUpdate) { this.suppressNextModelUpdate = false; return; }
      const val = this.editorInstance.getValue();
      this.codeChange.emit(val);
    });

    // Auto-height support
    if (this.autoHeight) {
      // hide scrollbars inside Monaco; height will be driven by content
      this.editorInstance.updateOptions({
        scrollbar: {
          vertical: 'hidden', horizontal: 'hidden',
          useShadows: false, verticalScrollbarSize: 0, horizontalScrollbarSize: 0,
          alwaysConsumeMouseWheel: false,
        },
        wordWrap: 'on',
      });

      const apply = () => this.applyAutoHeight();
      this.editorInstance.onDidContentSizeChange?.(apply);
      // first pass
      setTimeout(apply, 0);
    }

    // Interactivity toggle
    this.applyInteractivity();

    // Kick a layout in case host did not size yet
    setTimeout(() => this.editorInstance?.layout?.(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.editorInstance) return;

    if (changes['code'] && !changes['code'].isFirstChange()) {
      const current = this.editorInstance.getValue();
      if (this.code !== current) {
        this.suppressNextModelUpdate = true;
        this.editorInstance.setValue(this.code);
      }
      if (this.autoHeight) this.applyAutoHeight();
    }

    if (changes['language'] && !changes['language'].isFirstChange()) {
      const model = this.editorInstance.getModel?.();
      const lang = this.normalizeLanguage(this.language);
      if (model && window.monaco?.editor?.setModelLanguage) {
        window.monaco.editor.setModelLanguage(model, lang);
      }
    }

    if (changes['theme'] && !changes['theme'].isFirstChange()) {
      window.monaco?.editor?.setTheme?.(this.theme);
    }

    if (changes['options'] && !changes['options'].isFirstChange()) {
      this.editorInstance.updateOptions(this.options);
      if (this.autoHeight) this.applyAutoHeight();
    }

    if (changes['readOnly'] && !changes['readOnly'].isFirstChange()) {
      this.editorInstance.updateOptions({ readOnly: this.readOnly });
    }

    if (changes['interactive'] && !changes['interactive'].isFirstChange()) {
      this.applyInteractivity();
    }

    if (changes['autoHeight'] && !changes['autoHeight'].isFirstChange()) {
      if (this.autoHeight) this.applyAutoHeight();
      // if turning off, do nothing (parent layout will rule)
    }
  }

  ngOnDestroy() {
    this.disposed = true;
    try { this.editorInstance?.dispose?.(); } catch { /* ignore */ }
  }

  // --- helpers ---
  private normalizeLanguage(lang: string): string {
    const l = (lang || '').toLowerCase();
    const map: Record<string, string> = {
      ts: 'typescript',
      typescript: 'typescript',
      js: 'javascript',
      javascript: 'javascript',
      jsonc: 'json',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
      shell: 'shell',
      sql: 'sql',
      mysql: 'sql',
      pgsql: 'sql',
      postgres: 'sql',
      http: 'plaintext',      // Monaco has no built-in HTTP lexer; use plaintext (or add a custom Monarch later)
      text: 'plaintext',
      plaintext: 'plaintext',
    };
    return map[l] || l || 'plaintext';
  }

  private applyInteractivity() {
    const el = this.container.nativeElement;
    if (this.interactive) {
      el.style.pointerEvents = '';
      el.style.userSelect = '';
    } else {
      // make it display-only
      el.style.pointerEvents = 'none';
      el.style.userSelect = 'none';
    }
  }

  private applyAutoHeight() {
    if (!this.editorInstance) return;
    const contentH = this.editorInstance.getContentHeight?.() || 0;
    // Add a small padding so bottom shadow, if any, isn't cropped
    const h = Math.max(24, Math.ceil(contentH + 8));
    // Set the host height (component will expand vertically)
    (this.container.nativeElement.parentElement as HTMLElement)?.style.setProperty('height', `${h}px`);
    this.editorInstance.layout?.();
  }

  // --- AMD bootstrap ---
  private ensureMonaco(): Promise<void> {
    return new Promise((resolve) => {
      const start = () => {
        // Configure AMD path to Monaco once
        if (!(window as any).require || !(window as any).require.configuredForVs) {
          const req: any = (window as any).require || {};
          req.config?.({ paths: { vs: this.vsBasePath } }) ??
            ((window as any).require = Object.assign(function () { }, req, { paths: { vs: this.vsBasePath } }));
          (window as any).require = req;
          (window as any).require.configuredForVs = true;
        }

        (window as any).require(['vs/editor/editor.main'], () => {
          const monaco = (window as any).monaco;
          const ts = monaco.languages.typescript;

          // Friendly compiler options for a browser playground
          ts.typescriptDefaults.setCompilerOptions({
            allowJs: true,
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            // Avoid "try nodenext" messages for bare imports in browser
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            esModuleInterop: true,
            skipLibCheck: true,
            strict: false,
            baseUrl: 'file:///',
          });

          ts.typescriptDefaults.setDiagnosticsOptions({
            diagnosticCodesToIgnore: [2307, 2792],
          });

          resolve();
        });
      };

      // If AMD loader already present, start immediately; otherwise load it
      if ((window as any).require && typeof (window as any).require === 'function') {
        start();
        return;
      }

      const s = document.createElement('script');
      s.src = this.amdLoaderPath; // e.g. 'assets/monaco/min/vs/loader.js'
      s.onload = () => {
        (window as any).require = (window as any).require || {};
        start();
      };
      s.onerror = () => {
        console.error('Failed to load Monaco AMD loader from', this.amdLoaderPath);
        resolve(); // fail-soft so app still runs
      };
      document.body.appendChild(s);
    });
  }

}