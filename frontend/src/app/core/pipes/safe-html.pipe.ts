import { Pipe, type PipeTransform } from '@angular/core';
import createDOMPurify, { type DOMPurify } from 'dompurify';

const ALLOWED_TAGS = [
  'a',
  'b',
  'strong',
  'i',
  'em',
  'code',
  'pre',
  'br',
  'p',
  'ul',
  'ol',
  'li',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

let hooksInstalled = false;
let domPurifyInstance: DOMPurify | null = null;

function getDomPurify(): DOMPurify | null {
  if (domPurifyInstance) return domPurifyInstance;
  if (typeof window === 'undefined') return null;
  domPurifyInstance = createDOMPurify(window);
  return domPurifyInstance;
}

function ensureHooksInstalled() {
  if (hooksInstalled) return;
  const domPurify = getDomPurify();
  if (!domPurify) return;
  hooksInstalled = true;

  domPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (typeof Element === 'undefined') return;
    if (!(node instanceof Element)) return;
    if (node.tagName !== 'A') return;

    const target = (node.getAttribute('target') || '').toLowerCase();
    if (target !== '_blank') return;

    const existingRel = (node.getAttribute('rel') || '')
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const rel = new Set(existingRel);
    rel.add('noopener');
    rel.add('noreferrer');
    node.setAttribute('rel', Array.from(rel).join(' '));
  });
}

@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined) return '';
    const domPurify = getDomPurify();
    if (!domPurify) return String(value);
    ensureHooksInstalled();

    return domPurify.sanitize(String(value), {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
  }
}
