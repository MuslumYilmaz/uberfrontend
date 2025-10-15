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
    :host(.fixed-height) > div { height: 192px; }
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

  private editor!: any;
  private suppressNextModelUpdate = false;
  private disposed = false;
  private resizeObs?: ResizeObserver;

  private readonly amdLoaderPath = 'assets/monaco/min/vs/loader.js';
  private readonly vsBasePath = 'assets/monaco/min/vs';

  async ngAfterViewInit() {
    await this.ensureMonaco();
    if (this.disposed) return;

    window.monaco?.editor?.setTheme?.(this.theme);

    // Base options (we control automaticLayout depending on autoHeight)
    const baseOpts = {
      value: this.code ?? '',
      language: this.normalizeLanguage(this.language),
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: !this.autoHeight,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      ...this.options,
    };

    // If not autoHeight, ensure element has a height (Tailwind h-full needs a parent height)
    if (!this.autoHeight) {
      (this.container.nativeElement.parentElement as HTMLElement)?.classList.add('fixed-height');
    }

    this.editor = window.monaco.editor.create(this.container.nativeElement, baseOpts);

    // Mirror -> @Output
    this.editor.onDidChangeModelContent?.(() => {
      if (this.suppressNextModelUpdate) { this.suppressNextModelUpdate = false; return; }
      this.codeChange.emit(this.editor.getValue());
      if (this.autoHeight) this.fit();
    });

    // Auto-height adjustments
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

      // React to content-size changes
      this.editor.onDidContentSizeChange?.(() => this.fit());

      // Width changes (since automaticLayout is off in autoHeight mode)
      this.resizeObs = new ResizeObserver(() => this.layoutToCurrentSize());
      this.resizeObs.observe(this.container.nativeElement);

      // Initial fit
      setTimeout(() => this.fit());
    }

    // Interactivity (click-through for “display-only” examples)
    this.applyInteractivity();

    // One more layout tick in case the host just mounted
    setTimeout(() => this.layoutToCurrentSize(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.editor) return;

    if (changes['code'] && !changes['code'].isFirstChange()) {
      const current = this.editor.getValue();
      if (this.code !== current) {
        this.suppressNextModelUpdate = true;
        this.editor.setValue(this.code ?? '');
      }
      if (this.autoHeight) this.fit();
    }

    if (changes['language'] && !changes['language'].isFirstChange()) {
      const model = this.editor.getModel?.();
      const lang = this.normalizeLanguage(this.language);
      if (model && window.monaco?.editor?.setModelLanguage) {
        window.monaco.editor.setModelLanguage(model, lang);
      }
    }

    if (changes['theme'] && !changes['theme'].isFirstChange()) {
      window.monaco?.editor?.setTheme?.(this.theme);
    }

    if (changes['options'] && !changes['options'].isFirstChange()) {
      // Preserve our automaticLayout decision
      const next = { automaticLayout: !this.autoHeight, ...this.options };
      this.editor.updateOptions(next);
      if (this.autoHeight) this.fit();
    }

    if (changes['readOnly'] && !changes['readOnly'].isFirstChange()) {
      this.editor.updateOptions({ readOnly: this.readOnly });
    }

    if (changes['interactive'] && !changes['interactive'].isFirstChange()) {
      this.applyInteractivity();
    }

    if (changes['autoHeight'] && !changes['autoHeight'].isFirstChange()) {
      // Toggle automaticLayout and sizing strategy
      this.editor.updateOptions({ automaticLayout: !this.autoHeight });
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
    try { this.resizeObs?.disconnect(); } catch { /* ignore */ }
    try { this.editor?.dispose?.(); } catch { /* ignore */ }
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
}
