// src/app/monaco-editor.component.ts
import '../monaco-loader';                // ← MUST be first
import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule }                from '@angular/common';
import * as monaco                      from 'monaco-editor';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer class="h-full w-full"></div>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `]
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  /** the text to display */
  @Input() code: string = '';
  /** language id, e.g. 'javascript' | 'typescript' */
  @Input() language = 'javascript';
  /** editor construction options */
  @Input() options: monaco.editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true
  };
  /** optional theme override, e.g. 'vs-dark' */
  @Input() theme?: string;

  private editorInstance!: monaco.editor.IStandaloneCodeEditor;

  ngAfterViewInit() {
    // load the AMD loader if needed
    if (!(window as any).require) {
      const loader = document.createElement('script');
      loader.src = 'assets/monaco/vs/loader.js';
      loader.onload = () => this.initMonaco();
      document.body.appendChild(loader);
    } else {
      this.initMonaco();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.editorInstance) {
      if (changes['code'] && !changes['code'].isFirstChange()) {
        this.editorInstance.setValue(this.code);
      }
      if (changes['theme'] && this.theme) {
        monaco.editor.setTheme(this.theme);
      }
      if (changes['options'] && changes['options'].currentValue) {
        this.editorInstance.updateOptions(this.options);
      }
    }
  }

  private initMonaco() {
    const monacoRequire = (window as any).require;
    monacoRequire.config({ paths: { vs: 'assets/monaco/vs' } });

    monacoRequire(['vs/editor/editor.main'], () => {
      if (this.theme) {
        monaco.editor.setTheme(this.theme);
      }
      this.editorInstance = monaco.editor.create(this.container.nativeElement, {
        value: this.code,
        language: this.language,
        ...this.options
      });
    });
  }
}