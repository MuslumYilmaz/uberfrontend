import assert from 'node:assert/strict';
import test from 'node:test';
import { buildManifest, collectIdentityErrors, readRetiredEntries } from './question-identity-lib.mjs';

const identity = (tech, kind, id) => ({ tech, kind, id, key: `${tech}/${kind}/${id}`, file: `${tech}/${kind}.json` });
const shipped = [identity('javascript', 'trivia', 'js-hoisting'), identity('javascript', 'trivia', 'js-hoisting-tdz')];
const retiredRecord = {
  tech: 'javascript', kind: 'trivia', id: 'js-hoisting-tdz', file: 'javascript/trivia.json',
  redirectTo: '/javascript/trivia/js-hoisting', retiredAt: '2026-10-12', reason: 'merged into js-hoisting',
};

test('removing a shipped identity without a retired record is an error', () => {
  const manifest = buildManifest(shipped);
  const errors = collectIdentityErrors([shipped[0]], manifest);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /removed or moved after being shipped: javascript\/trivia\/js-hoisting-tdz/);
  assert.match(errors[0], /Record it under "retired"/);
});

test('a retired record with a redirect makes the removal a valid migration', () => {
  const manifest = buildManifest([shipped[0]], '2026-10-12T00:00:00.000Z', [retiredRecord]);
  assert.deepEqual(collectIdentityErrors([shipped[0]], manifest), []);
  assert.equal(manifest.retired.length, 1);
  assert.equal(readRetiredEntries(manifest)[0].key, 'javascript/trivia/js-hoisting-tdz');
});

test('retired records must carry an absolute redirect and a date', () => {
  const manifest = buildManifest([shipped[0]], '2026-10-12T00:00:00.000Z', [{ ...retiredRecord, redirectTo: 'js-hoisting', retiredAt: 'soon' }]);
  const errors = collectIdentityErrors([shipped[0]], manifest);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /absolute-path redirectTo/);
  assert.match(errors[1], /retiredAt date/);
});

test('a retired identity cannot reappear in the catalog or stay listed as shipped', () => {
  const stale = buildManifest(shipped, '2026-10-12T00:00:00.000Z', [retiredRecord]);
  const errors = collectIdentityErrors(shipped, stale);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /is back in the CDN catalog/);
  assert.match(errors[1], /listed both as shipped and as retired/);
});

test('the manifest keeps retired records only when there are any', () => {
  assert.equal('retired' in buildManifest(shipped), false);
  assert.equal('retired' in buildManifest(shipped, '2026-10-12T00:00:00.000Z', []), false);
});
