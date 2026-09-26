import { normalizeEditorialPlainText } from './locked-preview.util';

const EDITORIAL_WRAPPERS = new Set([
  'a', 'b', 'blockquote', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'i', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 's', 'small', 'span', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
]);

/**
 * Metadata is plain text, so technical notation such as <a> and Array<T> is content.
 * Only matched editorial wrappers are removed; encoded tags remain literal text.
 */
export function normalizeSeoPlainText(input: string): string {
  const source = String(input || '');
  const tokens = Array.from(source.matchAll(/<(\/?)([a-z][a-z0-9]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi));
  const pending = new Map<string, number[]>();
  const wrappers = new Set<number>();

  tokens.forEach((token, index) => {
    const name = token[2];
    // Capitalized components and self-closing examples are JSX, not editorial wrappers.
    if (!EDITORIAL_WRAPPERS.has(name) || /\/\s*>$/.test(token[0])) return;
    const stack = pending.get(name) || [];
    if (!token[1]) {
      stack.push(index);
      pending.set(name, stack);
    } else if (stack.length) {
      wrappers.add(stack.pop()!);
      wrappers.add(index);
    }
  });

  let cursor = 0;
  let withoutWrappers = '';
  tokens.forEach((token, index) => {
    const start = token.index!;
    // Closing inline formatting tags do not introduce a new word boundary.
    const replacement = token[1] && !['p', 'div', 'li', 'blockquote', 'pre'].includes(token[2]) ? '' : ' ';
    withoutWrappers += source.slice(cursor, start) + (wrappers.has(index) ? replacement : token[0]);
    cursor = start + token[0].length;
  });
  withoutWrappers += source.slice(cursor);

  // Protect remaining literal angle brackets from the preview normalizer's markup pass.
  // Decoding afterwards also preserves already encoded technical examples.
  return normalizeEditorialPlainText(
    withoutWrappers.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  );
}
