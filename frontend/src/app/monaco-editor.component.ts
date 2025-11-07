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
    return this.modelKey || `uf-${++MonacoEditorComponent.seq}`;
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
            'file:///node_modules/@types/__uf_any__/index.d.ts'
          );

          ts.typescriptDefaults.setCompilerOptions({
            allowJs: true,
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            module: monaco.languages.typescript.ModuleKind.ESNext,
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
      s.src = this.amdLoaderPath;
      s.onload = () => { (window as any).require = (window as any).require || {}; start(); };
      s.onerror = () => { console.error('Failed to load Monaco AMD loader from', this.amdLoaderPath); resolve(); };
      document.body.appendChild(s);
    });
  }

  private createOrSwapModel(langNorm: string, code: string) {
    const ext = langNorm === 'typescript' ? 'ts' : 'js';

    // Per-instance, per-language URI (prevents cross-instance collisions)
    const uri = window.monaco.Uri.parse(`inmemory://uf/${this._modelId}.${ext}`); // use getter

    // If our current model is for another language/ext, dispose it (it’s ours)
    if (this.model && this.model.uri.toString() !== uri.toString()) {
      try { this.model.dispose(); } catch { }
      this.model = undefined;
    }

    // If a model with this URI already exists (e.g., re-init), reuse it
    let existing = window.monaco.editor.getModel(uri);
    if (existing) {
      // Ensure language + contents are what we want
      if (window.monaco?.editor?.setModelLanguage) {
        window.monaco.editor.setModelLanguage(existing, langNorm);
      }
      const nextVal = code ?? '';
      if (existing.getValue() !== nextVal) existing.setValue(nextVal);
      this.model = existing;
    } else {
      // Create a fresh model
      this.model = window.monaco.editor.createModel(code ?? '', langNorm, uri);
    }

    // Attach to editor if already created
    if (this.editor) {
      this.editor.setModel(this.model);
    }
  }
}
