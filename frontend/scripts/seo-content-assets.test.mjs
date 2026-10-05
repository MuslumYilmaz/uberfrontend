import assert from 'node:assert/strict';
import test from 'node:test';
import { collectSeoContentAssets } from './seo-content-assets.mjs';

const reader = (files, options = {}) => ({ read: (file) => files[file] ?? null, ...options });
const json = JSON.stringify;
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['updatedAt', 'contentVersion'].includes(key)).map(([key, child]) => [key, clean(child)]));
};

test('follows nested pressure solutions only for the current framework', () => {
  const files = {
    'cdn/questions/pressure.json': json({ title: 'Counter', solutionAssets: {
      react: 'assets/sb/react/solution.json', angular: 'assets/sb/angular/solution.json',
    } }),
    'cdn/sb/react/solution.json': json({ files: { 'App.tsx': 'const message = "one  two";' }, openFile: 'App.tsx' }),
    'cdn/sb/angular/solution.json': json({ files: { 'app.ts': 'Angular code' } }),
  };
  const collect = (input) => collectSeoContentAssets(reader(input), { pressureModeAsset: 'assets/questions/pressure.json' }, { tech: 'react' });
  const before = collect(files);
  assert.deepEqual(before.sources, ['cdn/questions/pressure.json', 'cdn/sb/react/solution.json']);
  assert.equal(before.complete, true);
  assert.deepEqual(collect({ ...files, 'cdn/sb/angular/solution.json': json({ files: { 'app.ts': 'Different Angular code' } }) }).parts, before.parts);
  assert.notDeepEqual(collect({ ...files, 'cdn/sb/react/solution.json': files['cdn/sb/react/solution.json'].replace('one  two', 'one two') }).parts, before.parts);
});

test('resolves nested relative assets, selects other framework asset maps, and guards cycles', () => {
  const files = {
    'cdn/sb/root.json': json({ asset: './nested/child.json', starterAssets: { react: './react.json', vue: './missing-vue.json' } }),
    'cdn/sb/nested/child.json': json({ solutionAsset: '../root.json', text: 'Useful text' }),
    'cdn/sb/react.json': json({ files: { 'index.js': 'assets/not-a-real-reference.json' } }),
  };
  const result = collectSeoContentAssets(reader(files), { sdk: { asset: 'sb/root.json' } }, { tech: 'react' });
  assert.equal(result.complete, true);
  assert.deepEqual(result.sources, Object.keys(files).sort());
  assert.match(json(result.parts), /assetCycle/);
  assert.match(json(result.parts), /assets\/not-a-real-reference/);
});

test('file renames and date metadata do not reorder semantic asset contributions', () => {
  const files = {
    'cdn/a.json': json({ title: 'First', updatedAt: '2025-01-01' }),
    'cdn/b.json': json({ title: 'Second' }),
    'cdn/manifest.json': json({ solutionAsset: './a.json' }),
  };
  const before = collectSeoContentAssets(reader(files), ['assets/a.json', 'assets/b.json', 'assets/manifest.json'], { clean });
  const moved = { ...files, 'cdn/z.json': json({ title: 'First', updatedAt: '2026-10-05', contentVersion: 8 }),
    'cdn/manifest.json': json({ solutionAsset: './z.json' }) };
  delete moved['cdn/a.json'];
  const after = collectSeoContentAssets(reader(moved), ['assets/z.json', 'assets/b.json', 'assets/manifest.json'], { clean });
  assert.deepEqual(after.parts, before.parts);
  assert.deepEqual(after.value, before.value);
  const originalSdk = collectSeoContentAssets(reader(files), { sdk: { asset: 'assets/a.json', openFile: '/src/App.tsx' } }, { clean });
  const movedSdk = collectSeoContentAssets(reader(moved), { sdk: { asset: 'assets/z.json', openFile: '/src/App.tsx' } }, { clean });
  assert.deepEqual(movedSdk.value, originalSdk.value);
});

test('reports absent historical nested dependencies instead of silently accepting partial content', () => {
  const files = { 'cdn/root.json': json({ solutionAsset: './missing.json' }) };
  assert.throws(() => collectSeoContentAssets(reader(files), 'assets/root.json'), /Missing SEO content dependency: cdn\/missing.json/);
  const diagnostics = [];
  const result = collectSeoContentAssets(reader(files, { strict: false, report: (issue) => diagnostics.push(issue) }), 'assets/root.json', { route: '/react/coding/counter' });
  assert.equal(result.complete, false);
  assert.equal(diagnostics[0].route, '/react/coding/counter');
  assert.equal(diagnostics[0].file, 'cdn/missing.json');
});
