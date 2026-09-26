import assert from 'node:assert/strict';
import test from 'node:test';
import { auditSeoPages, parseSeoPage } from './seo-meta-audit.mjs';

const ORIGIN = 'https://frontendatlas.com';
const DESCRIPTION = 'Compare request ownership, cancellation, and stale UI protection with concrete examples and failure cases.';
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function fixture({ route = '/first', title = 'JavaScript Async Race Conditions: Fix Stale UI', description = DESCRIPTION, canonical = ORIGIN + route, robots = 'index,follow', extra = '', body = '<h1>Async race conditions</h1>' } = {}) {
  // Deliberately vary case, quote styles, and attribute order. These are valid
  // HTML equivalents and the audit must use browser parsing semantics.
  return `<!doctype html><html><head>
    <TITLE>${escape(title)}</TITLE>
    <meta content='${escape(description)}' NAME='description'>
    <meta content='${escape(robots)}' name='robots'>
    <link href='${escape(canonical)}' rel='canonical'>
    <meta content='${escape(title)}' property='og:title'>
    <meta content='${escape(description)}' property='og:description'>
    <meta content='${escape(canonical)}' property='og:url'>
    <meta content='${escape(title)}' name='twitter:title'>
    <meta content='${escape(description)}' name='twitter:description'>
    <script type='application/ld+json' id='seo-jsonld'>{"@graph":[{"@type":["Article","TechArticle"]}]}</script>
    ${extra}</head><body>${body}</body></html>`;
}

function page(options = {}) {
  return parseSeoPage(fixture(options), options.route || '/first');
}

test('parses real head metadata independent of attribute order and decodes entities once', () => {
  const parsed = page({
    title: 'HTML <a>: links & navigation',
    description: 'Use <a> and href for navigation; distinguish &lt;a&gt; source text, quoted "URLs", and browser behavior.',
    body: '<h1>HTML <code>&lt;a&gt;</code></h1><script>hidden<script</script>',
  });
  assert.equal(parsed.title, 'HTML <a>: links & navigation');
  assert.match(parsed.description, /distinguish &lt;a&gt; source text/);
  assert.equal(parsed.h1, 'HTML <a>');
  assert.equal(parsed.bodyText, 'HTML <a>');
  assert.deepEqual([...parsed.schemaTypes].sort(), ['Article', 'TechArticle']);
  assert.deepEqual(auditSeoPages([parsed]).failures, []);
});

test('rejects empty or duplicate tags for every required metadata field', () => {
  const tags = {
    title: '<title></title>',
    description: '<meta name="description" content="">',
    robots: '<meta name="robots" content="">',
    canonical: '<link rel="canonical" href="">',
    ogTitle: '<meta property="og:title" content="">',
    ogDescription: '<meta property="og:description" content="">',
    ogUrl: '<meta property="og:url" content="">',
    twitterTitle: '<meta name="twitter:title" content="">',
    twitterDescription: '<meta name="twitter:description" content="">',
  };
  for (const [field, tag] of Object.entries(tags)) {
    const duplicate = auditSeoPages([page({ extra: tag })]);
    assert(duplicate.failures.some((issue) => issue.code === field && issue.message.includes('found 2')), field);
    const empty = auditSeoPages([parseSeoPage(`<!doctype html><html><head>${tag}</head><body></body></html>`, '/empty')]);
    assert(empty.failures.some((issue) => issue.code === field && issue.message.includes('empty')), field);
  }
});

test('rejects missing metadata and body-only meta tags', () => {
  const html = fixture().replace(/<meta[^>]+NAME='description'>/, '');
  for (const value of [html, html.replace('</body>', `<meta name="description" content="${DESCRIPTION}"></body>`)]) {
    const result = auditSeoPages([parseSeoPage(value, '/first')]);
    assert(result.failures.some((issue) => issue.code === 'description' && issue.message.includes('found 0')));
  }
});

test('rejects OG and Twitter title or description drift, without stripping literal tags', () => {
  for (const name of ['og:title', 'twitter:title', 'og:description', 'twitter:description']) {
    const html = fixture({ title: 'HTML <a> links' }).replace(
      new RegExp(`<meta content='[^']*' (property|name)='${name}'>`),
      `<meta content='HTML links' ${name.startsWith('og:') ? 'property' : 'name'}='${name}'>`,
    );
    const result = auditSeoPages([parseSeoPage(html, '/first')]);
    assert(result.failures.some((issue) => issue.code === 'socialAgreement'), name);
  }
});

test('keeps the literal anchor token and rejects the historical stripped result', () => {
  const options = { route: '/html/trivia/html-a-tag', title: 'HTML <a> tag: navigation semantics', description: 'Use <a> for navigation with href, accessible names, and safe external targets; learn the common mistakes.' };
  assert.deepEqual(auditSeoPages([page(options)]).failures, []);
  const broken = auditSeoPages([page({ ...options, title: 'HTML tag: navigation semantics', description: options.description.replace('<a>', '') })]);
  assert.equal(broken.failures.filter((issue) => issue.code === 'literalHtmlToken').length, 2);
});

test('requires all four RxJS flattening operators in the actual title', () => {
  const route = '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use';
  const operators = ['switchMap', 'mergeMap', 'exhaustMap', 'concatMap'];
  assert.deepEqual(auditSeoPages([page({ route, title: operators.join(' vs ') })]).failures, []);
  for (const missing of operators) {
    const title = operators.filter((operator) => operator !== missing).join(' vs ');
    const result = auditSeoPages([page({ route, title })]);
    assert(result.failures.some((issue) => issue.code === 'comparisonTitle' && issue.message.includes(missing)), missing);
    assert(!result.failures.some((issue) => issue.code === 'socialAgreement'));
  }
});

test('rejects prior truncated comparison output even when social tags agree', () => {
  const comparisons = [
    {
      route: '/angular/trivia/rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject',
      before: 'Subject vs BehaviorSubject vs ReplaySubject vs in',
      complete: 'Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject in Angular',
    },
    {
      route: '/angular/trivia/angular-directives',
      before: 'Angular directives in production: structural vs',
      complete: 'Angular directives in production: structural vs attribute, * syntax, and when TemplateRef matters',
    },
    {
      route: '/javascript/trivia/js-compare-two-objects',
      before: 'How to compare two objects in JavaScript: shallow vs',
      complete: 'How to compare two objects in JavaScript: shallow vs deep vs JSON pitfalls',
    },
  ];
  for (const { route, before, complete } of comparisons) {
    const broken = auditSeoPages([page({ route, title: before })]);
    assert(broken.failures.some((issue) => issue.code === 'comparisonTitle'), route);
    assert(broken.failures.some((issue) => issue.code === 'incompleteTitle'), route);
    assert(!broken.failures.some((issue) => issue.code === 'socialAgreement'), route);
    assert.deepEqual(auditSeoPages([page({ route, title: complete })]).failures, [], route);
  }
});

test('detects historical dangling trivia connectors without treating complete long titles as errors', () => {
  const examples = [
    ['/css/trivia/css-id-vs-class', 'id vs class Selectors in CSS: Differences and', 'Specificity'],
    ['/css/trivia/css-grid-vs-flexbox', 'Grid vs Flexbox, and when should each be used in', 'CSS'],
    ['/css/trivia/css-margin-vs-padding', 'Margin vs Padding in CSS: Key Differences with', 'Examples'],
  ];
  for (const [route, title, ending] of examples) {
    assert(auditSeoPages([page({ route, title })]).failures.some((issue) => issue.code === 'incompleteTitle'), route);
    assert.deepEqual(auditSeoPages([page({ route, title: `${title} ${ending}` })]).failures, [], route);
  }
});

test('rejects repeated titles on indexable canonical pages', () => {
  const title = 'Frontend Debug Scenario for Interview Practice';
  const result = auditSeoPages([
    page({ route: '/react/debug/stale-search', title }),
    page({ route: '/angular/debug/stale-search', title }),
  ]);
  assert.equal(result.failures.filter((issue) => issue.code === 'duplicateTitle').length, 1);
  assert.match(result.failures.find((issue) => issue.code === 'duplicateTitle').route, /\/react\/debug\/stale-search/);
});

test('rejects the shipped JavaScript and Angular debug description fallbacks', () => {
  for (const tech of ['javascript', 'angular']) {
    const route = `/${tech}/debug/stale-search`;
    const description = `Front-end debug question for ${tech}.`;
    assert(auditSeoPages([page({ route, description })]).failures.some((issue) => issue.code === 'genericDebugDescription'));
    assert(!auditSeoPages([page({ route, description, robots: 'noindex,follow' })]).failures.some((issue) => issue.code === 'genericDebugDescription'));
    assert(!auditSeoPages([page({ route, description, canonical: `${ORIGIN}/another-owner` })]).failures.some((issue) => issue.code === 'genericDebugDescription'));
  }
});

test('preserves document-wide legacy keyword contracts including JSON-LD keywords', () => {
  const html = fixture().replace('"@graph":', '"keywords":"Frontend system design interview format","@graph":');
  const parsed = parseSeoPage(html, '/first');
  assert(parsed.documentText.includes('Frontend system design interview format'));
  assert(!parsed.bodyText.includes('Frontend system design interview format'));
});

test('excludes canonical aliases and noindex pages from title uniqueness only', () => {
  const result = auditSeoPages([
    page(),
    page({ route: '/alias', canonical: `${ORIGIN}/first/` }),
    page({ route: '/private', robots: 'noindex,follow' }),
    page({ route: '/google-private', extra: '<meta name="googlebot" content="noindex">' }),
    page({ route: '/none', robots: 'none' }),
  ]);
  assert.deepEqual(result.failures, []);
  const emptyAlias = auditSeoPages([page({ route: '/alias', canonical: `${ORIGIN}/first`, description: '' })]);
  assert(emptyAlias.failures.some((issue) => issue.code === 'description'));
});

test('requires absolute canonicals and matching canonical / og:url', () => {
  assert(auditSeoPages([page({ canonical: '/first' })]).failures.some((issue) => issue.code === 'canonical'));
  const html = fixture().replace(`content='${ORIGIN}/first' property='og:url'`, `content='${ORIGIN}/second' property='og:url'`);
  assert(auditSeoPages([parseSeoPage(html, '/first')]).failures.some((issue) => issue.code === 'socialAgreement'));
});

test('metadata length is a warning, while invalid JSON-LD remains an error', () => {
  const result = auditSeoPages([page({ title: 'A complete technical title '.repeat(4), description: 'Brief description.' })]);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.warnings.map((issue) => issue.code).sort(), ['descriptionLength', 'titleLength']);
  const invalid = fixture().replace('{"@graph":[{"@type":["Article","TechArticle"]}]}', '{invalid}');
  assert(auditSeoPages([parseSeoPage(invalid, '/first')]).failures.some((issue) => issue.code === 'jsonLd'));
});

test('preserves optional H1 warning versus strict H1 enforcement', () => {
  const parsed = page({ body: '<h1>  &nbsp; </h1>' });
  assert(auditSeoPages([parsed]).warnings.some((issue) => issue.code === 'h1'));
  assert(auditSeoPages([parsed], { strictH1: true }).failures.some((issue) => issue.code === 'h1'));
});
