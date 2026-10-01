import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { countPremiumPractices } from './gen-showcase-stats.mjs';
import { cdnPracticeRegistryPath, cdnQuestionShowcaseStatsPath } from './content-paths.mjs';

test('counts unique premium routes across every practice type and framework', () => {
  const premium = (route, family = 'question') => ({ route, family, access: 'premium' });
  const entries = [
    premium('/react/coding/counter'), premium('/angular/coding/counter'),
    premium('/system-design/feed'), premium('/incidents/race', 'incident'),
    premium('/tradeoffs/state', 'tradeoff-battle'), premium('/javascript/debug/leak'),
    premium('/react/coding/counter'), { route: '/javascript/coding/free', access: 'free' },
  ];
  assert.equal(countPremiumPractices(entries), 6);
  assert.equal(countPremiumPractices([...entries, premium('/vue/coding/counter')]), 7);
  assert.equal(countPremiumPractices([]), 0);
  assert.throws(() => countPremiumPractices({}), /array/);
  assert.throws(() => countPremiumPractices([{ access: 'premium' }]), /route/);
});

test('published premium metadata agrees with the canonical registry', async () => {
  const registry = JSON.parse(await readFile(cdnPracticeRegistryPath, 'utf8'));
  const stats = JSON.parse(await readFile(cdnQuestionShowcaseStatsPath, 'utf8'));
  assert.equal(stats.premiumPracticeCount, countPremiumPractices(registry));
});
