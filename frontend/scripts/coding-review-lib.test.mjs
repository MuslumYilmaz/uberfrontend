import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findChangedItems,
  formatRecord,
  itemHashes,
  recordPath,
  recordProblem,
} from './coding-review-lib.mjs';

const reactItem = (overrides = {}) => ({
  id: 'react-counter',
  title: 'Counter',
  tags: ['state'],
  companies: [],
  importance: 3,
  difficulty: 'easy',
  description: { summary: 'Build a counter.', specs: { requirements: ['Show the count.'] } },
  sdk: { asset: 'assets/sb/react/question/react-counter.v1.json' },
  solutionAsset: 'assets/sb/react/solution/react-counter-solution.v1.json',
  frameworkTests: [{ id: 'inc', name: 'Increments', steps: [{ type: 'click', selector: '.inc' }] }],
  solutionBlock: { overview: 'Use state.', approaches: [{ title: 'useState', prose: 'Keep the count in state.' }] },
  updatedAt: '2026-11-01',
  ...overrides,
});

function repo(files) {
  return (filePath) => (filePath in files ? files[filePath] : null);
}

function catalogFiles(items, assets = {}) {
  return {
    'cdn/questions/react/coding.json': JSON.stringify(items),
    'cdn/sb/react/question/react-counter.v1.json': JSON.stringify({ files: { 'src/App.tsx': 'export default () => null;' } }),
    'cdn/sb/react/solution/react-counter-solution.v1.json': JSON.stringify({ files: { 'src/App.tsx': 'solution' } }),
    ...assets,
  };
}

test('metadata edits keep the hash, so they need no new review', () => {
  const read = repo(catalogFiles([]));
  const before = itemHashes(reactItem(), read);
  const after = itemHashes(reactItem({
    tags: ['state', 'hooks'],
    companies: ['meta'],
    sources: [{ label: 'x' }],
    seo: { title: 'New' },
    importance: 5,
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    access: 'premium',
    premiumPreview: { summary: 'x' },
    updatedAt: '2026-11-25',
    solutionBlock: { overview: 'Rewritten prose.', approaches: [{ title: 'Other', prose: 'Other words.' }] },
  }), read);
  assert.deepEqual(after, before);
});

test('page text and checks move their own hash, and both move the item hash', () => {
  const read = repo(catalogFiles([]));
  const base = itemHashes(reactItem(), read);

  const page = itemHashes(reactItem({ description: { summary: 'Build a counter that stops at zero.' } }), read);
  assert.notEqual(page.pageHash, base.pageHash);
  assert.equal(page.checksHash, base.checksHash);
  assert.notEqual(page.hash, base.hash);

  const checks = itemHashes(reactItem({ frameworkTests: [] }), read);
  assert.equal(checks.pageHash, base.pageHash);
  assert.notEqual(checks.checksHash, base.checksHash);
  assert.notEqual(checks.hash, base.hash);
});

test('the hash reads the starter and solution assets, not only the catalog entry', () => {
  const base = itemHashes(reactItem(), repo(catalogFiles([])));
  const starterEdit = itemHashes(reactItem(), repo(catalogFiles([], {
    'cdn/sb/react/question/react-counter.v1.json': JSON.stringify({ files: { 'src/App.tsx': '// TODO' } }),
  })));
  assert.notEqual(starterEdit.pageHash, base.pageHash);
  const solutionEdit = itemHashes(reactItem(), repo(catalogFiles([], {
    'cdn/sb/react/solution/react-counter-solution.v1.json': JSON.stringify({ files: { 'src/App.tsx': 'other' } }),
  })));
  assert.notEqual(solutionEdit.checksHash, base.checksHash);
  // Key order inside JSON does not count as a change.
  const reordered = itemHashes(reactItem(), repo(catalogFiles([], {
    'cdn/sb/react/solution/react-counter-solution.v1.json': '{"files":{"src/App.tsx":"solution"}}',
  })));
  assert.equal(reordered.hash, base.hash);
});

test('the push gate lists new items and items whose content changed, and nothing else', () => {
  const other = reactItem({ id: 'react-other', sdk: undefined, solutionAsset: undefined });
  const removed = reactItem({ id: 'react-removed', sdk: undefined, solutionAsset: undefined });
  const baseFiles = catalogFiles([reactItem(), other, removed]);
  const readBase = repo(baseFiles);

  const unrelated = findChangedItems({
    readBase,
    readHead: () => {
      throw new Error('a push with no catalog or asset change must not read the catalogs');
    },
    changedPaths: ['frontend/src/app/app.ts'],
  });
  assert.deepEqual(unrelated, []);

  const tagsOnly = findChangedItems({
    readBase,
    readHead: repo(catalogFiles([reactItem({ tags: ['new'] }), other])),
    changedPaths: ['cdn/questions/react/coding.json'],
  });
  assert.deepEqual(tagsOnly, []);

  const assetOnly = findChangedItems({
    readBase,
    readHead: repo(catalogFiles([reactItem(), other, removed], {
      'cdn/sb/react/question/react-counter.v1.json': JSON.stringify({ files: { 'src/App.tsx': '// TODO changed' } }),
    })),
    changedPaths: ['cdn/sb/react/question/react-counter.v1.json'],
  });
  assert.deepEqual(assetOnly.map((entry) => [entry.id, entry.isNew]), [['react-counter', false]]);

  const added = reactItem({ id: 'react-new', sdk: undefined, solutionAsset: undefined });
  const withNew = findChangedItems({
    readBase,
    readHead: repo(catalogFiles([reactItem(), other, added])),
    changedPaths: ['cdn/questions/react/coding.json'],
  });
  assert.deepEqual(withNew.map((entry) => [entry.tech, entry.kind, entry.id, entry.isNew]), [['react', 'coding', 'react-new', true]]);
});

test('a record covers an item only for the same hash and a passing or skipped review', () => {
  const entry = { tech: 'react', id: 'react-counter', hashes: { hash: 'abc' } };
  assert.equal(recordPath('react', 'react-counter'), 'content-reviews/coding/react/react-counter.json');
  assert.equal(recordProblem(entry, null), 'no review record');
  assert.equal(recordProblem(entry, '{oops'), 'the review record is not valid JSON');
  assert.match(recordProblem(entry, formatRecord({ hash: 'old', mode: 'full', result: 'pass' })), /hash differs/);
  assert.match(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'full', result: 'fail' })), /"fail"/);
  assert.match(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'full', result: 'incomplete' })), /"incomplete"/);
  assert.equal(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'full', result: 'pass' })), null);
  // A review finding blocks until someone accepts it with a reason, whatever the result field says.
  const reviewed = { hash: 'abc', mode: 'full', rules: { A1: 'pass', A4: 'review', B2: 'review' } };
  assert.match(recordProblem(entry, formatRecord({ ...reviewed, result: 'pass' })), /not accepted: A4, B2/);
  assert.match(recordProblem(entry, formatRecord({ ...reviewed, result: 'pass', accepted: { A4: 'covered by a fixture', B2: ' ' } })), /not accepted: B2$/);
  assert.equal(recordProblem(entry, formatRecord({ ...reviewed, result: 'pass', accepted: { A4: 'covered by a fixture', B2: 'notes are hints, kept on purpose' } })), null);
  assert.match(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'full', result: 'pass', rules: { A1: 'fail' } })), /failed rules: A1/);
  assert.match(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'skip', skipReason: ' ' })), /skipReason/);
  assert.equal(recordProblem(entry, formatRecord({ hash: 'abc', mode: 'skip', skipReason: 'typo in the summary' })), null);
});
