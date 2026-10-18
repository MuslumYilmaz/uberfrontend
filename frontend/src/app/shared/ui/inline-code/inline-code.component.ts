import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

// Paired single backticks become code and paired ** with non-space inner
// edges become strong. The leftmost match wins, so ** inside a code span and
// backticks inside bold stay literal. Everything else remains text,
// including HTML tags, unmatched delimiters, and other Markdown syntax.
const INLINE_MARKUP = /(?<!`)`([^`\n]+)`(?!`)|(?<!\*)\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*(?!\*)/g;

/** The text fa-inline-code renders, without its code and strong markup. */
export function stripInlineMarkup(value: string | null | undefined): string {
  return (value ?? '').replace(INLINE_MARKUP, (_match, code?: string, strong?: string) => code ?? strong ?? '');
}

@Component({
    selector: 'fa-inline-code',
    imports: [CommonModule],
    template: `<ng-container *ngFor="let part of parts"><code *ngIf="part.code">{{ part.text }}</code><strong *ngIf="part.strong">{{ part.text }}</strong><ng-container *ngIf="!part.code && !part.strong">{{ part.text }}</ng-container></ng-container>`,
    styleUrls: ['./inline-code.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InlineCodeComponent {
  parts: Array<{ text: string; code?: boolean; strong?: boolean }> = [];

  @Input() set text(value: string | null | undefined) {
    const text = value ?? '';
    const parts: typeof this.parts = [];
    let start = 0;
    for (const match of text.matchAll(INLINE_MARKUP)) {
      const index = match.index!;
      if (index > start) parts.push({ text: text.slice(start, index) });
      parts.push(match[1] !== undefined ? { text: match[1], code: true } : { text: match[2], strong: true });
      start = index + match[0].length;
    }
    if (start < text.length) parts.push({ text: text.slice(start) });
    this.parts = parts;
  }
}
