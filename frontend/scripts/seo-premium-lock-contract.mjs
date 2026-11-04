import { parse } from 'parse5';

// Company guides keep Premium practice names and answer guides from a visitor without Premium while the text
// stays in the page for search: each locked part sits under a blur in an element marked .premium-locked and
// data-nosnippet, and the CollectionPage declares those parts as Premium.
export const PREMIUM_LOCK_SELECTOR = '.premium-locked';
const LOCK_CLASS = PREMIUM_LOCK_SELECTOR.slice(1);
// Google reads data-nosnippet only on these elements.
const NOSNIPPET_TAGS = new Set(['span', 'div', 'section']);

export const marksPremiumParts = (page) =>
  page?.isAccessibleForFree === false &&
  Array.isArray(page?.hasPart) &&
  page.hasPart.some((part) => part?.isAccessibleForFree === false && part?.cssSelector === PREMIUM_LOCK_SELECTOR);

const attrsOf = (node) => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
const isLock = (attrs) => (attrs.class || '').split(/\s+/).includes(LOCK_CLASS);

/** Text a visitor can read inside a node: everything outside its locked parts. */
function readableText(node) {
  if (node.nodeName === '#text') return node.value;
  if (isLock(attrsOf(node))) return '';
  return (node.childNodes || []).map(readableText).join('');
}

/**
 * What a visitor without Premium, or a search engine, would get wrong on one prerendered guide: a link to a
 * Premium page whose name can be read, a locked part a snippet could quote, or structured data out of step
 * with the locked parts.
 */
export function premiumLockViolations(html, { premiumRoutes, collectionPage }) {
  const problems = [];
  let locked = 0;
  const visit = (node, underLock) => {
    const attrs = attrsOf(node);
    const lock = isLock(attrs);
    if (lock) {
      locked += 1;
      if (!NOSNIPPET_TAGS.has(node.tagName) || !Object.hasOwn(attrs, 'data-nosnippet')) {
        problems.push(`<${node.tagName}> ${PREMIUM_LOCK_SELECTOR} without a usable data-nosnippet`);
      }
    }
    if (node.tagName === 'a' && !underLock && !lock && premiumRoutes.has((attrs.href || '').split(/[?#]/)[0])) {
      const name = readableText(node).replace(/\s+/g, ' ').trim();
      if (name) problems.push(`readable link to ${attrs.href}: "${name}"`);
    }
    for (const child of node.childNodes || []) visit(child, underLock || lock);
  };
  visit(parse(html), false);
  if (locked && !marksPremiumParts(collectionPage)) {
    problems.push(`${locked} locked parts, but the CollectionPage does not mark ${PREMIUM_LOCK_SELECTOR} as Premium`);
  }
  if (!locked && collectionPage?.isAccessibleForFree !== true) {
    problems.push('no locked parts, but the CollectionPage is not marked free');
  }
  return problems;
}
