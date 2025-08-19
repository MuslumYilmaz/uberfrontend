// src/app/monaco-editor.component.ts
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

declare global {
  interface Window {
    require: any;        // AMD loader
    monaco: any;         // Monaco namespace
  }
}

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer class="h-full w-full"></div>`,
  styles: [`
    :host { display:block; height:100%; width:100%; }
  `],
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() code = '';
  @Input() language: 'javascript' | 'typescript' | string = 'javascript';
  @Input() theme = 'vs-dark';
  @Input() options: any = { automaticLayout: true };
  @Input() readOnly = false;

  @Output() codeChange = new EventEmitter<string>();

  private editorInstance: any;
  private suppressNextModelUpdate = false;
  private disposed = false;

  // Where we self-hosted monaco (relative to app root)
  private readonly amdLoaderPath = 'assets/monaco/min/vs/loader.js';
  private readonly vsBasePath = 'assets/monaco/min/vs';

  async ngAfterViewInit() {
    await this.ensureMonaco();
    if (this.disposed) return;

    // Theme first (safe to call before/after create)
    if (this.theme && window.monaco?.editor?.setTheme) {
      window.monaco.editor.setTheme(this.theme);
    }

    this.editorInstance = window.monaco.editor.create(this.container.nativeElement, {
      value: this.code,
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      ...this.options,
    });

    this.editorInstance.onDidChangeModelContent(() => {
      if (this.suppressNextModelUpdate) {
        this.suppressNextModelUpdate = false;
        return;
      }
      const val = this.editorInstance.getValue();
      this.codeChange.emit(val);
    });

    // initial layout kick
    setTimeout(() => this.editorInstance?.layout(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.editorInstance) return;

    if (changes['code'] && !changes['code'].isFirstChange()) {
      const current = this.editorInstance.getValue();
      if (this.code !== current) {
        this.suppressNextModelUpdate = true;
        this.editorInstance.setValue(this.code);
      }
    }

    if (changes['language'] && !changes['language'].isFirstChange()) {
      const model = this.editorInstance.getModel?.();
      if (model && window.monaco?.editor?.setModelLanguage) {
        window.monaco.editor.setModelLanguage(model, this.language);
      }
    }

    if (changes['theme'] && !changes['theme'].isFirstChange()) {
      window.monaco?.editor?.setTheme?.(this.theme);
    }

    if (changes['options'] && !changes['options'].isFirstChange()) {
      this.editorInstance.updateOptions(this.options);
    }

    if (changes['readOnly'] && !changes['readOnly'].isFirstChange()) {
      this.editorInstance.updateOptions({ readOnly: this.readOnly });
    }
  }

  ngOnDestroy() {
    this.disposed = true;
    try { this.editorInstance?.dispose?.(); } catch { }
  }

  // --- Loader bootstrap (robust even if index.html didn't preload it) ---
  private ensureMonaco(): Promise<void> {
    return new Promise((resolve) => {
      const start = () => {
        // Ensure AMD has the vs path before requiring editor.main
        if (!window.require || !window.require.configuredForVs) {
          try {
            // Some AMD builds support .config; others set paths by assigning window.require again.
            if (typeof window.require === 'function' && typeof (window.require as any).config === 'function') {
              (window.require as any).config({ paths: { vs: this.vsBasePath } });
            } else {
              window.require = Object.assign(function () { }, window.require, { paths: { vs: this.vsBasePath } });
            }
            (window.require as any).configuredForVs = true;
          } catch { /* ignore */ }
        }
        window.require(['vs/editor/editor.main'], () => resolve());
      };

      // If AMD already present, just start.
      if (window.require && typeof window.require === 'function') {
        start();
        return;
      }

      // Inject AMD loader script
      const s = document.createElement('script');
      s.src = this.amdLoaderPath;
      s.onload = () => {
        // Minimal config in case index.html didn't set it
        (window as any).require = (window as any).require || {};
        if (!(window as any).require.paths) (window as any).require.paths = { vs: this.vsBasePath };
        start();
      };
      s.onerror = () => {
        console.error('Failed to load Monaco AMD loader from', this.amdLoaderPath);
        resolve(); // resolve to avoid hanging; component won't render editor
      };
      document.body.appendChild(s);
    });
  }
}