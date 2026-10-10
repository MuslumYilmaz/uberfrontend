import assert from 'node:assert/strict';
import test from 'node:test';
import { SHARED_CONTENT_RELEASES, applySharedContentReleases } from './seo-content-releases.mjs';

const release = { day: '2026-10-05', routes: /^\/javascript\/coding\/[^/]+$/, reason: 'solution source prerendered' };
const report = () => ({
  revision: 'abc', projectionVersion: 'v', pending: ['/javascript/coding/pending'], unresolved: [],
  routes: {
    '/javascript/coding/old': { fingerprint: '1', lastmod: '2026-07-15', sourceCommit: 'c1' },
    '/javascript/coding/newer': { fingerprint: '2', lastmod: '2026-10-09', sourceCommit: 'c2' },
    '/javascript/coding/same-day': { fingerprint: '3', lastmod: '2026-10-05', sourceCommit: 'c3' },
    '/javascript/coding/pending': { fingerprint: '4', reason: 'uncommitted-worktree-content' },
    '/javascript/trivia/old': { fingerprint: '5', lastmod: '2026-07-15', sourceCommit: 'c5' },
  },
});

test('a shared release floors older matching dates and leaves newer, undated and foreign routes alone', () => {
  const result = applySharedContentReleases(report(), [release], new Date('2026-10-10T12:00:00Z'));
  assert.equal(result.routes['/javascript/coding/old'].lastmod, '2026-10-05');
  assert.equal(result.routes['/javascript/coding/old'].sharedRelease, release.reason);
  assert.equal(result.routes['/javascript/coding/old'].sourceCommit, 'c1');
  assert.equal(result.routes['/javascript/coding/newer'].lastmod, '2026-10-09');
  assert.equal(result.routes['/javascript/coding/same-day'].lastmod, '2026-10-05');
  assert.equal(result.routes['/javascript/coding/pending'].lastmod, undefined);
  assert.equal(result.routes['/javascript/trivia/old'].lastmod, '2026-07-15');
  assert.ok(!('sharedRelease' in result.routes['/javascript/coding/newer']));
  assert.deepEqual(result.pending, ['/javascript/coding/pending']);
});

test('invalid, future or unexplained releases fail instead of inventing dates', () => {
  for (const broken of [
    { ...release, day: '2026-13-01' }, { ...release, day: '2026-10-11' }, { ...release, day: '2026-02-30' },
    { ...release, routes: '/javascript/coding/' }, { ...release, reason: '' },
  ]) {
    assert.throws(() => applySharedContentReleases(report(), [broken], new Date('2026-10-10T12:00:00Z')), /Invalid shared content release/);
  }
});

test('the recorded releases are valid and only target public coding and debug pages', () => {
  const result = applySharedContentReleases(report(), SHARED_CONTENT_RELEASES, new Date('2026-10-10T12:00:00Z'));
  assert.ok(SHARED_CONTENT_RELEASES.length >= 1);
  assert.equal(result.routes['/javascript/coding/old'].lastmod, '2026-10-05');
  assert.equal(result.routes['/javascript/trivia/old'].lastmod, '2026-07-15');
  for (const item of SHARED_CONTENT_RELEASES) {
    assert.ok(item.routes.test('/react/debug/react-debug-example'));
    assert.ok(!item.routes.test('/react/trivia/react-example'));
    assert.ok(!item.routes.test('/coding'));
    assert.ok(!item.routes.test('/javascript/coding/js-example/extra'));
  }
});
