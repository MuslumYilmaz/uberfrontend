import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { PrismHighlightDirective } from '../../../core/directives/prism-highlight.directive';

@Component({
  selector: 'app-code-snapshot',
  standalone: true,
  imports: [CommonModule, PrismHighlightDirective],
  template: `
    <div
      class="code-snapshot"
      role="button"
      tabindex="0"
      [attr.data-testid]="testId || null"
      [attr.aria-label]="ariaLabel"
      [class.code-snapshot--loading]="activationRequested()"
      (click)="requestActivation()"
      (keydown.enter)="onKeyboardActivate($event)"
      (keydown.space)="onKeyboardActivate($event)"
    >
      <div class="code-snapshot__meta" aria-hidden="true">
        <span class="code-snapshot__pill">Syntax preview</span>
        <span class="code-snapshot__hint">{{ activationRequested() ? 'Loading editor...' : 'Click to edit' }}</span>
      </div>

      <div class="code-snapshot__body">
        <div class="code-snapshot__gutter" aria-hidden="true">
          <span *ngFor="let line of lineNumbers(); trackBy: trackLine">{{ line }}</span>
        </div>

        <pre class="code-snapshot__pre"><code prism [lang]="prismLanguage()" [code]="code || ''"></code></pre>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }

    .code-snapshot {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      cursor: text;
      color: #d4d4d4;
      background: #1e1e1e;
      outline: none;
    }

    .code-snapshot:focus-visible {
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.8);
    }

    .code-snapshot__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: #171717;
      font-size: 11px;
      letter-spacing: 0.03em;
    }

    .code-snapshot__pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.78);
      font-weight: 700;
      text-transform: uppercase;
    }

    .code-snapshot__hint {
      color: rgba(255, 255, 255, 0.52);
      font-weight: 600;
    }

    .code-snapshot--loading .code-snapshot__hint {
      color: #f6c453;
    }

    .code-snapshot__body {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }

    .code-snapshot__gutter {
      display: grid;
      align-content: start;
      gap: 0;
      padding: 12px 8px 12px 12px;
      min-width: 36px;
      background: #181818;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.32);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.5;
      text-align: right;
      user-select: none;
    }

    .code-snapshot__pre {
      margin: 0;
      min-height: 100%;
      padding: 12px 16px;
      overflow: auto;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre;
    }

    .code-snapshot__pre code {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
  `],
})
export class CodeSnapshotComponent {
  @Input() code = '';
  @Input() language = 'plaintext';
  @Input() ariaLabel = 'Code preview';
  @Input() testId?: string;
  @Output() activate = new EventEmitter<void>();

  readonly activationRequested = signal(false);
  readonly prismLanguage = computed(() => {
    const lang = String(this.language || 'plaintext').toLowerCase();
    if (lang === 'html') return 'markup';
    if (lang === 'js') return 'javascript';
    if (lang === 'ts') return 'typescript';
    if (lang === 'vue') return 'markup';
    return lang;
  });
  readonly lineNumbers = computed(() => {
    const count = Math.max(1, String(this.code || '').split(/\r\n?|\n/).length);
    return Array.from({ length: count }, (_, index) => index + 1);
  });

  trackLine = (_index: number, line: number) => line;

  requestActivation() {
    if (this.activationRequested()) return;
    this.activationRequested.set(true);
    this.activate.emit();
  }

  onKeyboardActivate(event: Event) {
    event.preventDefault();
    this.requestActivation();
  }
}
