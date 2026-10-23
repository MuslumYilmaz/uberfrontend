import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildSeoInventory } from './seo-content-inventory.mjs';

const APP = 'frontend/src/app/';
const ROUTES = `${APP}app.routes.ts`;
const CATALOG = 'cdn/questions/javascript/coding.json';
const GUIDE = `${APP}shared/guides/guide.registry.ts`;
const question = (id, answer = 'Answer') => ({ id, title: id, access: 'free', answer, updatedAt: '2020-01-01' });
function reader(files, options = {}) {
  return { read: (file) => files[file] ?? null, list: (prefix) => Object.keys(files).filter((file) => file.startsWith(prefix)).sort(), ...options };
}
function fingerprint(files, route) { return buildSeoInventory(reader(files)).get(route)?.fingerprint; }
function changed(before, after) {
  const previous = buildSeoInventory(reader(before));
  return [...buildSeoInventory(reader(after))].filter(([route, item]) => previous.get(route)?.fingerprint !== item.fingerprint).map(([route]) => route);
}
const component = (text) => `import {Component} from '@angular/core'; @Component({template: '<h1>${text}</h1>', styles: ['h1{color:red}']}) export class Page {}`;
const staticFiles = () => ({
  [ROUTES]: `export const routes = [
    {path:'pricing',loadComponent:()=>import('./features/pricing/page'),data:{seo:{title:'Pricing'}}},
    {path:'changelog',loadComponent:()=>import('./features/changelog/page'),data:{seo:{title:'Changes'}}}
  ];`,
  [`${APP}features/pricing/page.ts`]: component('Plans'),
  [`${APP}features/changelog/page.ts`]: component('Releases'),
});
let sourcePaths;
const sourceText = new Map();
function currentReader(overrides = {}) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  if (!sourcePaths) {
    sourcePaths = [];
    function walk(directory) {
      for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
        const file = `${directory}/${entry.name}`;
        if (entry.isDirectory()) walk(file); else sourcePaths.push(file);
      }
    }
    walk('cdn'); walk('frontend/src/app');
  }
  return {
    read(file) {
      if (Object.hasOwn(overrides, file)) return overrides[file];
      if (!sourceText.has(file)) {
        try { sourceText.set(file, fs.readFileSync(path.join(root, file), 'utf8')); }
        catch { sourceText.set(file, null); }
      }
      return sourceText.get(file);
    },
    list: (prefix) => [...new Set([...sourcePaths, ...Object.keys(overrides)])].filter((file) => file.startsWith(prefix) && overrides[file] !== null).sort(),
  };
}

test('shared JSON catalogs isolate changes by ID and ignore editorial dates/key ordering', () => {
  const before = { [CATALOG]: JSON.stringify([question('a'), question('b')]) };
  const after = { [CATALOG]: JSON.stringify([question('a', 'Improved answer'), question('b')]) };
  assert.deepEqual(changed(before, after), ['/javascript/coding/a']);
  const metadataOnly = { [CATALOG]: JSON.stringify([{
    updatedAt: '2026-10-05', contentVersion: 99, reviewedBy: 'editor', answer: 'Answer', access: 'free', title: 'a', id: 'a',
  }, question('b')], null, 4) };
  assert.deepEqual(changed(before, metadataOnly), []);
});

test('sandbox payloads affect only their question and preserve code whitespace', () => {
  const asset = 'cdn/sb/react/question/a.json';
  const before = {
    [CATALOG]: JSON.stringify([{ ...question('a'), sdk: { asset: 'assets/sb/react/question/a.json' } }, question('b')]),
    [asset]: JSON.stringify({ files: { 'index.js': 'const text = `one  two`;' } }),
  };
  const after = { ...before, [asset]: JSON.stringify({ files: { 'index.js': 'const text = `one two`;' } }) };
  assert.deepEqual(changed(before, after), ['/javascript/coding/a']);
  assert.ok(buildSeoInventory(reader(before)).get('/javascript/coding/a').sources.includes(asset));
});

test('scenario bodies and system-design sections participate without index date edits', () => {
  const before = {
    'cdn/incidents/index.json': JSON.stringify([question('incident')]),
    'cdn/incidents/incident/scenario.json': JSON.stringify({ prompt: 'Before' }),
    'cdn/questions/system-design/index.json': JSON.stringify([question('design')]),
    'cdn/questions/system-design/design/meta.json': JSON.stringify({ title: 'Design' }),
    'cdn/questions/system-design/design/architecture.json': JSON.stringify({ prose: 'Before' }),
  };
  const after = { ...before,
    'cdn/incidents/incident/scenario.json': JSON.stringify({ prompt: 'After' }),
    'cdn/questions/system-design/design/architecture.json': JSON.stringify({ prose: 'After' }),
  };
  assert.deepEqual(changed(before, after), ['/incidents/incident', '/system-design/design']);
});

test('unknown public registry mappings fail and premium entries remain excluded', () => {
  const files = { [CATALOG]: JSON.stringify([{ ...question('a'), access: 'premium' }]) };
  assert.equal(buildSeoInventory(reader(files)).size, 0);
  files['cdn/practice/registry.json'] = JSON.stringify([{ route: '/new-kind/a', access: 'free' }]);
  assert.throws(() => buildSeoInventory(reader(files)), /No SEO content projection.*new-kind/);
  assert.equal(buildSeoInventory(reader(files, { strict: false })).size, 0);
});

test('missing historical dependencies omit affected route and report diagnostic', () => {
  const files = { [CATALOG]: JSON.stringify([{ ...question('a'), sdk: { asset: 'assets/sb/react/question/a.json' } }, question('b')]) };
  assert.throws(() => buildSeoInventory(reader(files)), /Missing SEO content dependency/);
  const diagnostics = [];
  const historical = buildSeoInventory(reader(files, { strict: false, report: (issue) => diagnostics.push(issue) }));
  assert.deepEqual([...historical.keys()], ['/javascript/coding/b']);
  assert.equal(diagnostics[0].route, '/javascript/coding/a');
});

test('route-specific metadata changes do not date every route in app.routes.ts', () => {
  const before = staticFiles();
  const after = { ...before, [ROUTES]: before[ROUTES].replace("title:'Pricing'", "title:'Plans and prices'") };
  assert.deepEqual(changed(before, after), ['/pricing']);
});

test('new public static routes cannot silently bypass the content inventory', () => {
  const files = staticFiles();
  files[ROUTES] = `export const routes=[{path:'new-public',loadComponent:()=>import('./features/pricing/page'),data:{seo:{robots:'index,follow'}}}];`;
  assert.throws(() => buildSeoInventory(reader(files)), /No SEO content projection for public app route: \/new-public/);
});

test('missing templates and imported content fail current reads and omit historical routes', () => {
  for (const source of [
    `@Component({templateUrl:'./missing.html'}) export class Page {}`,
    `import {COPY} from './missing-content'; @Component({template:'<h1>{{copy}}</h1>'}) export class Page {copy=COPY;}`,
  ]) {
    const files = { ...staticFiles(), [`${APP}features/pricing/page.ts`]: source };
    assert.throws(() => buildSeoInventory(reader(files)), /Missing SEO content dependency/);
    const diagnostics = [];
    const inventory = buildSeoInventory(reader(files, { strict: false, report: (issue) => diagnostics.push(issue) }));
    assert.ok(!inventory.has('/pricing'));
    assert.equal(diagnostics[0].route, '/pricing');
    assert.ok(diagnostics[0].file.includes('missing'));
  }
});

test('styles, comments, imports and shared header content do not refresh a static page', () => {
  const before = staticFiles();
  const file = `${APP}features/pricing/page.ts`;
  before[file] = `import {Header} from '../../shared/components/header/header';\n${before[file]}`;
  before[`${APP}shared/components/header/header.ts`] = component('Header');
  const after = { ...before,
    [file]: before[file].replace('color:red', 'color:blue').replace('<h1>', '<h1 class="wide" style="margin:0">') + '\n// implementation note',
    [`${APP}shared/components/header/header.ts`]: component('Changed header'),
  };
  assert.deepEqual(changed(before, after), []);
});

test('Angular component metadata migrations do not refresh static pages, guides or exercises', () => {
  const metadata = `selector:'app-old', standalone:true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, providers:[OldService], imports:[CommonModule],`;
  const staticFile = `${APP}features/pricing/page.ts`;
  const guideFile = `${APP}features/guides/article.ts`;
  const exerciseFile = `${APP}features/trivia/trivia-detail/angular-http-cancellation-lab/angular-http-cancellation-lab.component.ts`;
  const before = {
    ...staticFiles(),
    [GUIDE]: `export const PLAYBOOK=[{slug:'article',load:()=>import('../../features/guides/article')}];`,
    'cdn/questions/angular/trivia.json': JSON.stringify([question('angular-http-what-actually-cancels-request')]),
    [guideFile]: `@Component({${metadata}template:'<h1>Guide</h1><app-visible-example></app-visible-example>'}) export class Page {}`,
    [exerciseFile]: `@Component({${metadata}template:'<h1>Exercise</h1><app-visible-example></app-visible-example>'}) export class Page {}`,
  };
  before[staticFile] = before[staticFile].replace('@Component({', `@Component({${metadata}`);
  const after = { ...before };
  for (const file of [staticFile, guideFile, exerciseFile]) after[file] = before[file].replace(metadata, 'selector:"app-new", standalone:false, providers:[NewService],');
  assert.deepEqual(changed(before, after), []);
  const renderedSelectorChanged = { ...after, [guideFile]: after[guideFile].replaceAll('app-visible-example', 'app-new-visible-example') };
  assert.deepEqual(changed(after, renderedSelectorChanged), ['/guides/interview-blueprint/article']);
});

test('external template content is tracked and code blocks retain significant spaces', () => {
  const files = staticFiles();
  files[`${APP}features/pricing/page.ts`] = `@Component({templateUrl:'./page.html'}) export class Page {}`;
  const template = `${APP}features/pricing/page.html`;
  files[template] = '<h1>Plans</h1><pre>const message = "one  two";</pre>';
  assert.deepEqual(changed(files, { ...files, [template]: files[template].replace('one  two', 'one two') }), ['/pricing']);
  assert.deepEqual(changed(files, { ...files, [template]: files[template].replace('<pre>', '<pre class="code">') }), []);
});

test('repeated comment/style removal cannot leave newly formed ignored markup in fingerprints', () => {
  const files = staticFiles();
  files[`${APP}features/pricing/page.ts`] = `@Component({templateUrl:'./page.html'}) export class Page {}`;
  const template = `${APP}features/pricing/page.html`;
  files[template] = '<h1>Plans</h1>';
  const ignored = [
    '<!-- first --><!-- second --><style>h1 { color: red; }</style>',
    '<!<!-- inner -->-- outer -->',
    '<sty<style>inner</style>le>outer</style>',
    '<!<style>inner</style>-- outer -->',
    '<sty<!<style>inner</style>-- middle -->le>outer</style>',
  ];
  for (const markup of ignored) {
    assert.deepEqual(changed(files, { ...files, [template]: `${markup}${files[template]}${markup}` }), [], markup);
  }
  assert.deepEqual(changed(files, { ...files, [template]: `${ignored[4]}<h1>Updated plans</h1>` }), ['/pricing']);
});

test('comment/style examples inside code blocks remain semantic content', () => {
  const files = staticFiles();
  files[`${APP}features/pricing/page.ts`] = `@Component({templateUrl:'./page.html'}) export class Page {}`;
  const template = `${APP}features/pricing/page.html`;
  for (const tag of ['pre', 'code']) {
    files[template] = `<${tag}><!<style>one  two</style>-- example --></${tag}>`;
    assert.deepEqual(changed(files, { ...files, [template]: files[template].replace('one  two', 'one two') }), ['/pricing']);
    assert.deepEqual(changed(files, { ...files, [template]: files[template].replace('example', 'updated example') }), ['/pricing']);
  }
});

test('moving unchanged article content behind a re-export keeps its fingerprint', () => {
  const article = `${APP}features/guides/a.ts`;
  const files = {
    [GUIDE]: `export const PLAYBOOK=[{slug:'a',load:()=>import('../../features/guides/a')}];`,
    [article]: component('Article'),
  };
  const moved = { ...files, [article]: `export {Page} from './moved';`, [`${APP}features/guides/moved.ts`]: files[article] };
  assert.deepEqual(changed(files, moved), []);
});

test('guide entry, article re-export and imported content are scoped to their guide', () => {
  const files = {
    [GUIDE]: `export const PLAYBOOK = [
      {slug:'a',seo:{title:'A',updatedAt:'2020-01-01'},load:()=>import('../../features/guides/a')},
      {slug:'b',seo:{title:'B'},load:()=>import('../../features/guides/b')}
    ];`,
    [`${APP}features/guides/a.ts`]: `export {Page} from './a-article';`,
    [`${APP}features/guides/a-article.ts`]: `import {COPY} from './a-content'; @Component({template:'<h1>{{copy}}</h1>'}) export class Page {copy=COPY;}`,
    [`${APP}features/guides/a-content.ts`]: `export const COPY='First answer'; export const OTHER='Unrelated';`,
    [`${APP}features/guides/b.ts`]: component('Guide B'),
  };
  const next = { ...files, [`${APP}features/guides/a-content.ts`]: files[`${APP}features/guides/a-content.ts`].replace('First answer', 'Better answer') };
  assert.deepEqual(changed(files, next), ['/guides/interview-blueprint/a']);
  assert.deepEqual(changed(files, { ...files, [GUIDE]: files[GUIDE].replace('2020-01-01', '2026-10-05') }), []);
  assert.deepEqual(changed(files, { ...files, [`${APP}features/guides/a-content.ts`]: files[`${APP}features/guides/a-content.ts`].replace('Unrelated', 'Other') }), []);
});

test('shared framework prep object selects the guide slug rather than all entries', () => {
  const shared = `${APP}features/guides/shared.ts`;
  const files = {
    [GUIDE]: `export const PLAYBOOK = [
      {slug:'react-prep-path',load:()=>import('../../features/guides/shared')},
      {slug:'vue-prep-path',load:()=>import('../../features/guides/shared')}
    ];`,
    [shared]: `const PREP_CONFIG = {'react-prep-path': {title:'React'},'vue-prep-path': {title:'Vue'}}; @Component({template:'<h1>{{config.title}}</h1>'}) export class Page {config=PREP_CONFIG;}`,
  };
  assert.deepEqual(changed(files, { ...files, [shared]: files[shared].replace("title:'React'", "title:'React patterns'") }), ['/guides/framework-prep/react-prep-path']);
});

test('generated JSON-LD date integration does not itself refresh substantive content', () => {
  const before = staticFiles();
  const file = `${APP}features/pricing/page.ts`;
  before[file] = `const CONTENT_DATE_MODIFIED='2020-01-01'; @Component({template:'<h1>Plans</h1>'}) export class Page {schema(){const collection={title:'Plans',dateModified:CONTENT_DATE_MODIFIED}; collection['dateModified']=CONTENT_DATE_MODIFIED; return collection;}}`;
  const after = { ...before, [file]: `import {seoContentDateModified} from './dates'; @Component({template:'<h1>Plans</h1>'}) export class Page {schema(){const dateModified=seoContentDateModified('/pricing'); const collection={title:'Plans',...(dateModified ? {dateModified} : {})}; return collection;}}` };
  assert.deepEqual(changed(before, after), []);
});

test('current public registry has complete coverage and deterministic output', () => {
  const current = currentReader();
  const inventory = buildSeoInventory(current);
  const registry = JSON.parse(current.read('cdn/practice/registry.json'));
  for (const entry of registry) assert.equal(inventory.has(entry.route), entry.access !== 'premium', entry.route);
  for (const route of ['/', '/coding', '/guides/framework-prep', '/guides/framework-prep/javascript-prep-path/mastery', '/companies/google/preview']) assert.ok(inventory.has(route), route);
  assert.deepEqual(buildSeoInventory(current), inventory);
  assert.ok([...inventory.values()].every((entry) => /^[a-f0-9]{64}$/.test(entry.fingerprint) && entry.sources.length));
});

test('actual shared detail component edits never move per-entry dates', () => {
  const file = `${APP}features/trivia/trivia-detail/trivia-detail.component.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const changes = (text) => [...buildSeoInventory(currentReader({ [file]: text }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  const modified = read.read(file).replace("const TRIVIA_H1_INTENT_LABEL = 'Frontend interview practice question'", "const TRIVIA_H1_INTENT_LABEL = 'Frontend interview explanation question'");
  assert.notEqual(modified, read.read(file));
  assert.deepEqual(changes(modified), []);
  assert.deepEqual(changes(read.read(file).replace('@Component({', '@Component({ preserveWhitespaces: false,')), []);
});

test('shared detail component, template, route metadata and SEO helper do not re-date entry routes', () => {
  const detail = `${APP}features/trivia/trivia-detail/trivia-detail.component.ts`;
  const template = `${APP}features/trivia/trivia-detail/trivia-detail.component.html`;
  const helper = `${APP}features/trivia/trivia-detail/trivia-seo.util.ts`;
  const catalog = 'cdn/questions/javascript/trivia.json';
  const files = {
    ...staticFiles(),
    [catalog]: JSON.stringify([question('a'), question('b')]),
    [detail]: `import {Component} from '@angular/core'; import {seoTitleForQuestion} from './trivia-seo.util'; @Component({templateUrl:'./trivia-detail.component.html'}) export class Page { private updateSeo(q) { return seoTitleForQuestion(q); } visibleH1IntentLabel() { return 'Practice question'; } }`,
    [template]: '<h1>{{ visibleH1IntentLabel() }}</h1><p>Shared intro</p>',
    [helper]: `export function seoTitleForQuestion(q) { return q.title + ': Interview Answer'; }`,
  };
  files[ROUTES] = files[ROUTES].replace('export const routes = [', `export const routes = [
    {matcher: techMatcher, children: [{path:'trivia/:id',loadComponent:()=>import('./features/trivia/trivia-detail/trivia-detail.component'),data:{seo:{title:'Concept question'}}}]},`);
  assert.ok(buildSeoInventory(reader(files)).has('/javascript/trivia/a'));
  assert.deepEqual(changed(files, { ...files, [template]: '<h1>{{ visibleH1IntentLabel() }}</h1><p>Updated shared intro</p>' }), []);
  assert.deepEqual(changed(files, { ...files, [detail]: files[detail].replace('Practice question', 'Explanation question') }), []);
  assert.deepEqual(changed(files, { ...files, [helper]: files[helper].replace(': Interview Answer', ': Interview Answers') }), []);
  assert.deepEqual(changed(files, { ...files, [ROUTES]: files[ROUTES].replace("title:'Concept question'", "title:'Interview concept question'") }), []);
  assert.deepEqual(changed(files, { ...files, [catalog]: JSON.stringify([question('a', 'Improved answer'), question('b')]) }), ['/javascript/trivia/a']);
});

test('page-specific lab components re-date only their own entry route', () => {
  const catalog = 'cdn/questions/javascript/trivia.json';
  const folder = `${APP}features/trivia/trivia-detail/javascript-event-loop-experience/javascript-event-loop-experience`;
  const lab = `${folder}.component.ts`;
  const template = `${folder}.component.html`;
  const content = `${folder}.content.ts`;
  const files = {
    ...staticFiles(),
    [catalog]: JSON.stringify([question('js-event-loop'), question('b')]),
    [lab]: `import {Component} from '@angular/core'; import {STEPS} from './javascript-event-loop-experience.content'; @Component({templateUrl:'./javascript-event-loop-experience.component.html', styles:['h1{color:red}']}) export class Lab { steps = STEPS; }`,
    [template]: '<h1>Event loop lab</h1>',
    [content]: `export const STEPS = ['Step one'];`,
  };
  assert.deepEqual(changed(files, { ...files, [template]: '<h1>Browser event loop lab</h1>' }), ['/javascript/trivia/js-event-loop']);
  assert.deepEqual(changed(files, { ...files, [content]: `export const STEPS = ['Step one', 'Step two'];` }), ['/javascript/trivia/js-event-loop']);
  assert.deepEqual(changed(files, { ...files, [lab]: files[lab].replace('color:red', 'color:blue') }), []);
});

test('actual shared detail templates and helpers do not re-date entry routes; actual lab content does', () => {
  const read = currentReader();
  const before = buildSeoInventory(read);
  function changes(file, from, to) {
    const text = read.read(file).replace(from, to);
    assert.notEqual(text, read.read(file), file);
    return [...buildSeoInventory(currentReader({ [file]: text }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  }
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/trivia-detail.component.html`, 'Open Essential 60', 'Open the Essential 60'), []);
  assert.deepEqual(changes(`${APP}features/coding/coding-detail/coding-detail.component.html`, 'Open Essential 60', 'Open the Essential 60'), []);
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/trivia-seo.util.ts`, "': Interview Answer'", "': Interview Answers'"), []);
  assert.deepEqual(changes(ROUTES, "title: 'Front-end interview concept question'", "title: 'Frontend interview concept question'"), []);
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/javascript-event-loop-experience/javascript-event-loop-experience.component.html`, 'Predict the browser event loop before it runs', 'Predict the event loop before it runs'), ['/javascript/trivia/js-event-loop']);
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/angular-change-detection-visualizer/angular-change-detection-visualizer.component.html`, 'Simulate Angular change detection: Eager vs OnPush vs zoneless', 'Simulate change detection: Eager vs OnPush vs zoneless'), ['/angular/trivia/angular-change-detection-strategies']);
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/angular-change-detection-visualizer/angular-change-detection-visualizer.content.ts`, 'The list keeps the old users after push()', 'The list keeps stale users after push()'), ['/angular/trivia/angular-change-detection-strategies']);
  assert.deepEqual(changes(`${APP}features/trivia/trivia-detail/rxjs-overlap-playground/rxjs-overlap-playground.content.ts`, 'The search box shows results for the wrong query', 'The search box shows results for an older query'), ['/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use']);
});

test('actual React FAQ/profile/template content only refreshes the React hub', () => {
  const file = `${APP}features/interview-questions/interview-questions-landing.component.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const modified = read.read(file).replace('The React 19 section covers Actions', 'The React 19 section explains Actions');
  assert.notEqual(modified, read.read(file));
  const updated = [...buildSeoInventory(currentReader({ [file]: modified }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  assert.deepEqual(updated, ['/react/interview-questions']);
});

test('actual question cards propagate to their public hubs and Essential 60, while homepage tracks counts', () => {
  const read = currentReader();
  const before = buildSeoInventory(read);
  function changes(file, transform) {
    const data = JSON.parse(read.read(file)); transform(data);
    return [...buildSeoInventory(currentReader({ [file]: JSON.stringify(data) }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  }
  const react = changes('cdn/questions/react/coding.json', (items) => { items.find((entry) => entry.id === 'react-counter').title += ' with explicit guards'; });
  assert.ok(react.includes('/react/interview-questions'));
  assert.ok(!react.includes('/vue/interview-questions'));
  assert.ok(!react.includes('/'));
  const javascript = changes(CATALOG, (items) => { items.find((entry) => entry.id === 'js-debounce').title += ' with cancellation'; });
  for (const route of ['/javascript/interview-questions', '/interview-questions', '/interview-questions/essential']) assert.ok(javascript.includes(route), route);
  assert.ok(!javascript.includes('/companies/google/preview'));
  assert.ok(!javascript.includes('/companies/netflix/preview'));
  const added = changes(CATALOG, (items) => { items.push({ ...question('seo-test-new-question'), companies: ['google'] }); });
  assert.ok(added.includes('/'));
  assert.ok(added.includes('/companies'));
});

test('authored failure hints date only their own question and ignore the shared rules module otherwise', () => {
  const hints = `${APP}core/utils/failure-explain-rules.ts`;
  const rules = (a, b, fallback = 'Start with the first failing test') => `export const QUESTION_HINT_RULES = [
    { ruleId: 'a-1', questionId: 'a', priority: 100, matches: (snapshot) => snapshot.failCount > 0, buildHint: (snapshot) => ({ ruleId: 'a-1', title: '${a}', why: 'why', actions: ['do'], confidence: 0.9 }) },
    { ruleId: 'a-default', questionId: 'a', priority: 40, matches: () => true, buildHint: (snapshot) => ({ ruleId: 'a-default', title: '${fallback}', why: 'why', actions: ['do'], confidence: 0.7 }) },
    { ruleId: 'b-1', questionId: 'b', priority: 100, matches: (snapshot) => snapshot.failCount > 0, buildHint: (snapshot) => ({ ruleId: 'b-1', title: '${b}', why: 'why', actions: ['do'], confidence: 0.9 }) },
  ];`;
  const template = `${APP}features/coding/coding-detail/coding-detail.component.html`;
  const rendering = '<section data-testid="coding-solution-panel"><ul data-testid="coding-common-mistakes"></ul></section>';
  const catalog = { [CATALOG]: JSON.stringify([question('a'), question('b'), question('c')]), [template]: '<section data-testid="coding-solution-panel"></section>' };
  const authored = { ...catalog, [hints]: rules('Return early', 'Keep state') };
  const withRules = { ...authored, [template]: rendering };
  // Rules that the template does not render yet are not page content; rendering them dates only the questions that have them.
  assert.deepEqual(changed(catalog, authored), []);
  assert.deepEqual(changed(authored, withRules), ['/javascript/coding/a', '/javascript/coding/b']);
  assert.equal(fingerprint(catalog, '/javascript/coding/c'), fingerprint(withRules, '/javascript/coding/c'));
  assert.deepEqual(changed(withRules, { ...withRules, [hints]: rules('Return the promise', 'Keep state') }), ['/javascript/coding/a']);
  assert.deepEqual(changed(withRules, { ...withRules, [hints]: `// formatted\n${rules('Return early', 'Keep state').replace(/\n    /g, '\n\t\t')}` }), []);
  assert.deepEqual(changed(withRules, { ...withRules, [template]: `${rendering}<p>Shared footer copy</p>` }), []);
  assert.deepEqual(changed(withRules, { ...withRules, [hints]: rules('Return early', 'Keep state', 'Re-read the failing assertion') }), []);
  assert.deepEqual(buildSeoInventory(reader(withRules)).get('/javascript/coding/a').sources, [CATALOG, hints, template]);
  assert.deepEqual(buildSeoInventory(reader(withRules)).get('/javascript/coding/c').sources, [CATALOG, hints, template]);
});

test('actual hint edits re-date one exercise, and mapped rules re-date only the public exercises they cover', () => {
  const hints = `${APP}core/utils/failure-explain-rules.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const changes = (text) => [...buildSeoInventory(currentReader({ [hints]: text }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  const source = read.read(hints);
  const edited = source.replace("title: 'sleep must return a Promise'", "title: 'sleep must always return a Promise'");
  assert.notEqual(edited, source);
  assert.deepEqual(changes(edited), ['/javascript/coding/js-sleep']);
  assert.deepEqual(changes(source.replace("title: 'sleep must return a Promise',", "title:   'sleep must return a Promise', // promise contract")), []);
  const ids = Array.from(source.match(/ANGULAR_MODERN_TEMPLATE_QUESTION_IDS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g), ([, id]) => id);
  const shared = source.replace("title: 'Fix the Angular template compilation contract first'", "title: 'Fix the Angular template compilation contract before anything else'");
  assert.notEqual(shared, source);
  const covered = ids.map((id) => `/angular/coding/${id}`).filter((route) => before.has(route));
  assert.ok(covered.length >= 1 && covered.length < ids.length, 'premium Angular exercises stay out of the inventory');
  assert.deepEqual(changes(shared), covered);
});

test('actual official guide table edits re-date only the company whose row changed', () => {
  const file = `${APP}shared/company-previews/company-official-guides.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const original = read.read(file);
  const modified = original.replace("label: 'Front End Engineer interview prep',", "label: 'Front End Engineer interview preparation',");
  assert.notEqual(modified, original);
  const changes = [...buildSeoInventory(currentReader({ [file]: modified }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  assert.deepEqual(changes, ['/companies/amazon/preview']);
});

test('actual interview process edits re-date only the company whose stages or sources changed', () => {
  const file = `${APP}shared/company-previews/company-interview-processes.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const original = read.read(file);
  const changes = (text) => [...buildSeoInventory(currentReader({ [file]: text }))]
    .filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  const edits = [
    // A stage inside the registry literal.
    ["format: '60 minutes on two or three easy-to-medium problems.',", "format: '60 minutes on two or three problems.',", '/companies/walmart/preview'],
    // Source constants outside the literal: catalog companies (Walmart, Tesla) as well as authored ones.
    ["'https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6', '2020-06'", "'https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6', '2020-07'", '/companies/tesla/preview'],
    ["label: 'Amazon FEE prep page',", "label: 'Amazon Front End Engineer prep page',", '/companies/amazon/preview'],
    // Hyphenated slugs: BOOKINGCOM_ constants belong to /companies/booking-com/preview.
    ["'https://enginebogie.com/interview/experience/booking-com-frontend-engineer/84', '2023-05'", "'https://enginebogie.com/interview/experience/booking-com-frontend-engineer/84', '2023-06'", '/companies/booking-com/preview'],
    ["const UBER_ROLE = 'Frontend engineers, L3 to L5A';", "const UBER_ROLE = 'Frontend engineers, L3 to L5B';", '/companies/uber/preview'],
  ];
  for (const [from, to, route] of edits) {
    const modified = original.replace(from, to);
    assert.notEqual(modified, original, from);
    assert.deepEqual(changes(modified), [route]);
  }
  // A shared helper belongs to the companies whose entries call it, never to a company without a table.
  const companies = (slugs) => slugs.map((slug) => `/companies/${slug}/preview`);
  for (const [from, to, expected] of [
    ["report('LeetCode', `https://leetcode.com/discuss/post/", "report('LeetCode Discuss', `https://leetcode.com/discuss/post/", companies(['amazon'])],
    ["kind: 'official', date: '2026-10' })", "kind: 'official', date: '2026-11' })",
      companies(['anduril', 'booking-com', 'bytedance', 'capital-one', 'datadog', 'elevenlabs', 'gitlab', 'google', 'intuit', 'meta', 'microsoft', 'netflix', 'openai',
        'revolut', 'spotify', 'stripe', 'uber', 'waymo', 'zalando'])],
  ]) {
    const modified = original.replace(from, to);
    assert.notEqual(modified, original, from);
    assert.deepEqual(changes(modified), expected);
  }
});

test('company previews are dated by their own content: shared template and component edits re-date no company', () => {
  const template = `${APP}features/company/company-preview/company-preview.component.html`;
  const component = `${APP}features/company/company-preview/company-preview.component.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const companyChanges = (overrides) => [...buildSeoInventory(currentReader(overrides))]
    .filter(([route, entry]) => route.startsWith('/companies/') && before.get(route)?.fingerprint !== entry.fingerprint)
    .map(([route]) => route);
  const html = read.read(template);
  const ts = read.read(component);
  const edits = [
    // Shared catalog copy and the shared component class render every company.
    [template, html.replace('<h2>What you can do now for free</h2>', '<h2>What you can do for free today</h2>'), []],
    [component, ts.replace('title: `${this.label} Frontend Interview Questions Preview`,', 'title: `${this.label} Frontend Interview Questions: Preview`,'), []],
    // Inline branches and prefixed constants belong to one company.
    [template, html.replace('<p class="preview-kicker">Time-sensitive context</p>', '<p class="preview-kicker">Time-sensitive note</p>'), ['/companies/google/preview']],
    [template, html.replace('<h2 id="openai-unlock">Unlock the full OpenAI practice set</h2>', '<h2 id="openai-unlock">Open the full OpenAI practice set</h2>'), ['/companies/openai/preview']],
    [template, html.replace('<h2 id="netflix-premium-route">Continue with the full Netflix practice set</h2>', '<h2 id="netflix-premium-route">Open the full Netflix practice set</h2>'), ['/companies/netflix/preview']],
    [component, ts.replace('not leaked or confirmed OpenAI interview questions', 'not leaked or confirmed OpenAI interview prompts'), ['/companies/openai/preview']],
    // So does the method that publishes an inline-branch company's structured data.
    [component, ts.replace("name: 'Google frontend interview preparation' }", "name: 'Google frontend interview prep' }"), ['/companies/google/preview']],
  ];
  for (const [file, modified, expected] of edits) {
    assert.notEqual(modified, read.read(file), `${file} edit applies`);
    assert.deepEqual(companyChanges({ [file]: modified }), expected);
  }
});

test('wiring a company-keyed registry into the preview re-dates only the companies with an entry', () => {
  const component = `${APP}features/company/company-preview/company-preview.component.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const original = read.read(component);
  // As before the interview process tables shipped: no import, no getter.
  const modified = original
    .replace('  COMPANY_INTERVIEW_PROCESSES,\n  type CompanyInterviewProcess,\n', '  type CompanyInterviewProcess,\n')
    .replace('  get interviewProcess(): CompanyInterviewProcess | null {\n    return COMPANY_INTERVIEW_PROCESSES[this.slug] ?? null;\n  }\n', '');
  assert.ok(!modified.includes('COMPANY_INTERVIEW_PROCESSES'));
  assert.notEqual(modified, original);
  const changes = [...buildSeoInventory(currentReader({ [component]: modified }))]
    .filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  for (const slug of ['walmart', 'openai', 'netflix', 'elevenlabs', 'waymo']) {
    assert.ok(changes.includes(`/companies/${slug}/preview`), `${slug} has an interview process: ${changes.join(',')}`);
  }
  for (const slug of ['airbnb']) {
    assert.ok(!changes.includes(`/companies/${slug}/preview`), `${slug} has no interview process: ${changes.join(',')}`);
  }
});

test('a missing inline company branch fails current reads and dates history as a catalog page', () => {
  const template = `${APP}features/company/company-preview/company-preview.component.html`;
  const route = '/companies/netflix/preview';
  const html = currentReader().read(template);
  // Netflix had no branch of its own before its inline guide shipped.
  const modified = html.replace('*ngIf="isNetflixPreview; else genericPreview"', '*ngIf="false; else genericPreview"');
  assert.notEqual(modified, html);
  assert.throws(() => buildSeoInventory(currentReader({ [template]: modified })), /Missing netflix branch/);
  const historical = buildSeoInventory({ ...currentReader({ [template]: modified }), strict: false });
  assert.ok(historical.has(route));
  assert.notEqual(historical.get(route).fingerprint, buildSeoInventory(currentReader()).get(route).fingerprint);
});

test('actual Waymo guide edits re-date only the Waymo preview and the directory that lists it', () => {
  const file = `${APP}shared/company-previews/waymo-preview-content.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const original = read.read(file);
  const modified = original.replace("title: 'Prepare for product judgment, not Waymo trivia'", "title: 'Prepare for product judgment, not Waymo trivia questions'");
  assert.notEqual(modified, original);
  const changes = [...buildSeoInventory(currentReader({ [file]: modified }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  assert.ok(changes.includes('/companies/waymo/preview'), changes.join(','));
  for (const route of ['/companies/google/preview', '/companies/netflix/preview', '/companies/openai/preview', '/companies/amazon/preview', '/']) {
    assert.ok(!changes.includes(route), `${route} must not re-date: ${changes.join(',')}`);
  }
});

test('an editorial notes entry re-dates only its own company preview', () => {
  const file = `${APP}shared/company-previews/company-editorial-notes.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const original = read.read(file);
  const entry = "  google: { slug: 'google', title: 'Google Frontend Interview Process and Practice', h1: 'Google Frontend Interview Questions and Process', description: 'How public reports describe Google frontend interviews, stage by stage, with practice items for each stage.' },\n";
  const modified = original.replace(/= \{\n/, `= {\n${entry}`);
  assert.notEqual(modified, original, 'the registry literal opens with "= {" on its own line');
  const changes = (text) => [...buildSeoInventory(currentReader({ [file]: text }))]
    .filter(([route, item]) => before.get(route)?.fingerprint !== item.fingerprint).map(([route]) => route);
  assert.deepEqual(changes(modified), ['/companies/google/preview']);
  assert.deepEqual(changes(modified.replace('stage by stage', 'round by round')), ['/companies/google/preview']);
});
