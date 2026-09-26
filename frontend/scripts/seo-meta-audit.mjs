import { parse } from 'parse5';

export function normalizeText(value) {
  // parse5 has already decoded HTML entities. A literal technical token such as
  // <a> is text here and must not be stripped or decoded a second time.
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value;
  if (['script', 'style', 'template'].includes(node.tagName)) return '';
  return (node.childNodes || []).map(textContent).join('');
}

function attrs(node) {
  return Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
}

const META_FIELDS = {
  description: ['name', 'description'],
  robots: ['name', 'robots'],
  ogTitle: ['property', 'og:title'],
  ogDescription: ['property', 'og:description'],
  ogUrl: ['property', 'og:url'],
  twitterTitle: ['name', 'twitter:title'],
  twitterDescription: ['name', 'twitter:description'],
};

// Protect the named concepts in comparison pages that previously lost terms
// during title shortening. These allow copy changes without pinning full titles.
const COMPARISON_TITLE_TERMS = new Map([
  ['/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use', ['switchMap', 'mergeMap', 'exhaustMap', 'concatMap']],
  ['/angular/trivia/rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject', ['Subject', 'BehaviorSubject', 'ReplaySubject', 'AsyncSubject']],
  ['/angular/trivia/angular-directives', ['structural', 'attribute']],
  ['/javascript/trivia/js-compare-two-objects', ['shallow', 'deep']],
]);

export function parseSeoPage(html, route) {
  const document = parse(html);
  const tags = Object.fromEntries(['title', 'canonical', ...Object.keys(META_FIELDS)].map((key) => [key, []]));
  const h1s = [];
  const jsonLd = [];
  const googlebot = [];
  const documentText = [];
  let bodyText = '';

  walk(document, (node) => {
    if (node.nodeName === '#text') documentText.push(node.value);
    if (node.tagName === 'head') {
      walk(node, (headNode) => {
        const attributes = attrs(headNode);
        if (headNode.tagName === 'title') tags.title.push(normalizeText(textContent(headNode)));
        if (headNode.tagName === 'link' && (attributes.rel || '').toLowerCase().split(/\s+/).includes('canonical')) {
          tags.canonical.push(normalizeText(attributes.href));
        }
        if (headNode.tagName !== 'meta') return;
        for (const [field, [attribute, expected]] of Object.entries(META_FIELDS)) {
          if ((attributes[attribute] || '').toLowerCase() === expected) {
            tags[field].push(normalizeText(attributes.content));
          }
        }
        if ((attributes.name || '').toLowerCase() === 'googlebot') googlebot.push(normalizeText(attributes.content));
      });
    }
    if (node.tagName === 'h1') h1s.push(normalizeText(textContent(node)));
    if (node.tagName === 'body') bodyText = normalizeText(textContent(node));
    if (node.tagName === 'script' && attrs(node).id === 'seo-jsonld') {
      jsonLd.push((node.childNodes || []).map((child) => child.value || '').join(''));
    }
  });

  const schemaTypes = new Set();
  function collectTypes(value) {
    if (!value || typeof value !== 'object') return;
    const types = value['@type'];
    for (const type of Array.isArray(types) ? types : [types]) {
      if (typeof type === 'string') schemaTypes.add(type);
    }
    for (const child of Object.values(value)) collectTypes(child);
  }
  let invalidJsonLd = false;
  for (const value of jsonLd) {
    try { collectTypes(JSON.parse(value)); } catch { invalidJsonLd = true; }
  }

  return {
    route,
    tags,
    ...Object.fromEntries(Object.entries(tags).map(([field, values]) => [field, values[0] || ''])),
    googlebot: googlebot.join(', '),
    h1: h1s[0] || '',
    h1s,
    bodyText,
    // Existing keyword contracts historically searched the whole document,
    // including JSON-LD keywords. Preserve that scope without reparsing text.
    documentText: normalizeText(documentText.join(' ')),
    jsonLd,
    invalidJsonLd,
    schemaTypes,
  };
}

function normalizedUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.href;
  } catch {
    return null;
  }
}

export function auditSeoPages(pages, { siteOrigin = 'https://frontendatlas.com', strictH1 = false } = {}) {
  const failures = [];
  const warnings = [];
  const titles = new Map();
  const add = (target, page, code, message) => target.push({ route: page.route, code, message });

  for (const page of pages) {
    for (const [field, values] of Object.entries(page.tags)) {
      if (values.length !== 1) {
        add(failures, page, field, `expected one ${field} tag, found ${values.length}`);
      } else if (!values[0]) {
        add(failures, page, field, `${field} is empty`);
      }
    }

    for (const [social, primary] of [
      ['ogTitle', 'title'], ['twitterTitle', 'title'],
      ['ogDescription', 'description'], ['twitterDescription', 'description'],
    ]) {
      if (page[social] && page[primary] && page[social] !== page[primary]) {
        add(failures, page, 'socialAgreement', `${social} differs from ${primary}`);
      }
    }

    const canonical = normalizedUrl(page.canonical);
    if (page.canonical && !canonical) add(failures, page, 'canonical', 'canonical must be an absolute HTTP(S) URL');
    const ogUrl = normalizedUrl(page.ogUrl);
    if (page.ogUrl && !ogUrl) add(failures, page, 'ogUrl', 'og:url must be an absolute HTTP(S) URL');
    if (canonical && ogUrl && canonical !== ogUrl) {
      add(failures, page, 'socialAgreement', 'og:url differs from canonical');
    }

    if (!page.jsonLd.length) add(failures, page, 'jsonLd', 'missing seo-jsonld script');
    if (page.invalidJsonLd) add(failures, page, 'jsonLd', 'seo-jsonld is not valid JSON');
    if (!page.h1s.some(Boolean)) add(strictH1 ? failures : warnings, page, 'h1', 'missing nonempty h1');

    if (page.route === '/html/trivia/html-a-tag') {
      for (const field of ['title', 'description']) {
        if (!page[field].includes('<a>')) {
          add(failures, page, 'literalHtmlToken', `${field} lost the literal <a> token`);
        }
      }
    }

    if (/\/trivia\/[^/]+\/?$/.test(page.route) && /\b(?:and|in|vs|with)[?.:]*$/i.test(page.title)) {
      add(failures, page, 'incompleteTitle', 'trivia title ends with a dangling connector');
    }
    for (const term of COMPARISON_TITLE_TERMS.get(page.route) || []) {
      if (!new RegExp(`\\b${term}\\b`, 'i').test(page.title)) {
        add(failures, page, 'comparisonTitle', `comparison title lost "${term}"`);
      }
    }

    // Length is an editorial review signal, never a reason to cut metadata.
    if (page.title && page.title.length > 60) add(warnings, page, 'titleLength', `title has ${page.title.length} characters; review SERP fit`);
    if (page.description && (page.description.length < 70 || page.description.length > 160)) {
      add(warnings, page, 'descriptionLength', `description has ${page.description.length} characters; review SERP fit`);
    }

    const noindex = /(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/i.test(`${page.robots}, ${page.googlebot}`);
    const selfCanonical = canonical === normalizedUrl(new URL(page.route, siteOrigin).href);
    if (!noindex && selfCanonical && page.title) {
      const key = page.title.toLowerCase();
      const routes = titles.get(key) || [];
      routes.push(page.route);
      titles.set(key, routes);
      if (/\/debug\/[^/]+\/?$/.test(page.route)
          && /^Front-end debug question for (?:javascript|angular)\./i.test(page.description)) {
        add(failures, page, 'genericDebugDescription', 'indexable debug detail uses the generic description fallback');
      }
    }
  }

  for (const [title, routes] of titles) {
    if (routes.length < 2) continue;
    failures.push({ route: routes.join(', '), code: 'duplicateTitle', message: `indexable canonical pages share title "${title}"` });
  }
  return { failures, warnings };
}
