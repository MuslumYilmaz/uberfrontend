// src/app/monaco-editor.component.ts
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

declare const require: any; // AMD loader from CDN
declare const monaco: any;

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer class="h-full w-full"></div>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() code = '';
  @Input() language = 'javascript';
  @Input() theme = 'vs-dark';
  @Input() options: any = { automaticLayout: true };

  @Output() codeChange = new EventEmitter<string>();

  private editorInstance: any;
  private suppressNextModelUpdate = false;

  ngAfterViewInit() {
    // require is already loaded via index.html script tag
    require(['vs/editor/editor.main'], () => {
      if (this.theme) {
        monaco.editor.setTheme(this.theme);
      }

      this.editorInstance = monaco.editor.create(this.container.nativeElement, {
        value: this.code,
        language: this.language,
        theme: this.theme,
        automaticLayout: true,
        ...this.options,
      });

      this.editorInstance.onDidChangeModelContent(() => {
        const val = this.editorInstance.getValue();
        if (this.suppressNextModelUpdate) {
          this.suppressNextModelUpdate = false;
          return;
        }
        this.codeChange.emit(val);
      });

      // initial layout guard
      setTimeout(() => this.editorInstance.layout(), 0);
    });
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
      const model = this.editorInstance.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, this.language);
      }
    }

    if (changes['theme'] && !changes['theme'].isFirstChange()) {
      monaco.editor.setTheme(this.theme);
    }

    if (changes['options'] && !changes['options'].isFirstChange()) {
      this.editorInstance.updateOptions(this.options);
    }
  }
}
