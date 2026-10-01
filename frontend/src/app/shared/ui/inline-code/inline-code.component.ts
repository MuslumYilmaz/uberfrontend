import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'fa-inline-code',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-container *ngFor="let part of parts"><code *ngIf="part.code; else prose">{{ part.text }}</code><ng-template #prose>{{ part.text }}</ng-template></ng-container>`,
  styles: [`
    :host { display: inline; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: inherit;
      background: var(--uf-surface-alt);
      border-radius: var(--uf-space-1);
      padding-inline: var(--uf-space-1);
      white-space: pre-wrap;
      overflow-wrap: break-word;
      word-break: normal;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineCodeComponent {
  parts: Array<{ text: string; code: boolean }> = [];

  @Input() set text(value: string | null | undefined) {
    const text = value ?? '';
    const parts: typeof this.parts = [];
    // Only paired single backticks are markup; all content remains text,
    // including HTML tags, unmatched delimiters, and other Markdown syntax.
    const pattern = /(?<!`)`([^`\n]+)`(?!`)/g;
    let start = 0;
    for (const match of text.matchAll(pattern)) {
      const index = match.index!;
      if (index > start) parts.push({ text: text.slice(start, index), code: false });
      parts.push({ text: match[1], code: true });
      start = index + match[0].length;
    }
    if (start < text.length) parts.push({ text: text.slice(start), code: false });
    this.parts = parts;
  }
}
