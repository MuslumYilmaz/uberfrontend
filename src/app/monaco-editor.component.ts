// src/app/monaco‑editor.component.ts
// ← this must be the very first import!
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import '../monaco.loader';
// src/app/monaco-editor.component.ts
// ← must be the very first line

declare const monaco: any;

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer class="h-full w-full"></div>`,
  styles: [`
      :host {
        display: block;
        height: 500px;
      }
    `]
})
export class MonacoEditorComponent implements AfterViewInit {
  @ViewChild('editorContainer', { static: true }) container!: ElementRef;
  @Input() code: string = '';
  @Input() language: string = 'javascript';

  ngAfterViewInit() {
    // Load Monaco if not already loaded
    if (!(window as any).monaco) {
      const loaderScript = document.createElement('script');
      loaderScript.src = 'assets/monaco/vs/loader.js';
      loaderScript.onload = () => this.initMonaco();
      document.body.appendChild(loaderScript);
    } else {
      this.initMonaco();
    }
  }

  private initMonaco() {
    (window as any).require.config({ paths: { vs: 'assets/monaco/vs' } });
    (window as any).require(['vs/editor/editor.main'], () => {
      monaco.editor.create(this.container.nativeElement, {
        value: this.code,
        language: this.language,
        automaticLayout: true,
        theme: 'vs-dark'
      });
    });
  }
}  