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

test('actual shared detail copy and SEO contracts are tracked without component infrastructure churn', () => {
  const file = `${APP}features/trivia/trivia-detail/trivia-detail.component.ts`;
  const read = currentReader();
  const before = buildSeoInventory(read);
  const changes = (text) => [...buildSeoInventory(currentReader({ [file]: text }))].filter(([route, entry]) => before.get(route)?.fingerprint !== entry.fingerprint).map(([route]) => route);
  const modified = read.read(file).replace("const TRIVIA_H1_INTENT_LABEL = 'Frontend interview practice question'", "const TRIVIA_H1_INTENT_LABEL = 'Frontend interview explanation question'");
  assert.notEqual(modified, read.read(file));
  const updated = changes(modified);
  assert.ok(updated.includes('/javascript/trivia/js-event-loop'));
  assert.ok(updated.every((route) => route.includes('/trivia/')));
  assert.deepEqual(changes(read.read(file).replace('@Component({', '@Component({ preserveWhitespaces: false,')), []);
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
