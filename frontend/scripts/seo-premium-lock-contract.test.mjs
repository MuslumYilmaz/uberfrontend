import assert from 'node:assert/strict';
import { test } from 'node:test';
import { marksPremiumParts, premiumLockViolations } from './seo-premium-lock-contract.mjs';

const premiumRoutes = new Set(['/react/coding/react-chips-input-autocomplete']);
const marked = {
  isAccessibleForFree: false,
  hasPart: [{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }],
};
const lockedLink =
  '<a href="/react/coding/react-chips-input-autocomplete" inert><span class="premium-locked" data-nosnippet>Chips input in React</span></a>';

test('accepts Premium links that show no name, locks kept out of snippets and schema that marks them', () => {
  const html = `<p>Practice: ${lockedLink}<span class="company-sr">A Premium task.</span></p>
    <div class="cq-guide cq-guide--locked premium-locked" data-nosnippet inert>
      <a href="/react/coding/react-chips-input-autocomplete">Practice the chips input</a>
    </div>
    <a href="/javascript/trivia/js-closures">Closures</a>`;
  assert.deepEqual(premiumLockViolations(html, { premiumRoutes, collectionPage: marked }), []);
  assert.deepEqual(
    premiumLockViolations('<a href="/javascript/trivia/js-closures">Closures</a>', { premiumRoutes, collectionPage: { isAccessibleForFree: true } }),
    [],
  );
});

test('accepts a Premium link whose readable words are a generic label, with the name under the lock', () => {
  const labelled = '<a href="/react/coding/react-chips-input-autocomplete" class="company-link--premium"><span class="company-link__label">Premium task for this round</span><span class="premium-locked company-link__name" data-nosnippet>Chips input in React</span></a>';
  assert.deepEqual(premiumLockViolations(labelled, { premiumRoutes, collectionPage: marked }), []);
  // The label of the prompt cards the question list replaced is no longer a generic label.
  const promptLabel = labelled.replace('Premium task for this round', 'Premium task for this prompt');
  assert.deepEqual(premiumLockViolations(promptLabel, { premiumRoutes, collectionPage: marked }), [
    'readable link to /react/coding/react-chips-input-autocomplete: "Premium task for this prompt"',
  ]);
  const named = '<a href="/react/coding/react-chips-input-autocomplete"><span class="company-link__label">Premium: Chips input in React</span></a>';
  assert.deepEqual(premiumLockViolations(named, { premiumRoutes, collectionPage: { isAccessibleForFree: true } }), [
    'readable link to /react/coding/react-chips-input-autocomplete: "Premium: Chips input in React"',
  ]);
});

test('flags a readable Premium name, a lock a snippet could quote and schema out of step with the locks', () => {
  assert.deepEqual(
    premiumLockViolations('<a href="/react/coding/react-chips-input-autocomplete?src=guide">Chips input in React</a>', {
      premiumRoutes,
      collectionPage: { isAccessibleForFree: true },
    }),
    ['readable link to /react/coding/react-chips-input-autocomplete?src=guide: "Chips input in React"'],
  );
  assert.deepEqual(
    premiumLockViolations('<p class="premium-locked" data-nosnippet>x</p><span class="premium-locked">y</span>', {
      premiumRoutes,
      collectionPage: marked,
    }),
    ['<p> .premium-locked without a usable data-nosnippet', '<span> .premium-locked without a usable data-nosnippet'],
  );
  assert.deepEqual(premiumLockViolations(lockedLink, { premiumRoutes, collectionPage: { isAccessibleForFree: true } }), [
    '1 locked parts, but the CollectionPage does not mark .premium-locked as Premium',
  ]);
  assert.deepEqual(premiumLockViolations('<p>An open guide</p>', { premiumRoutes, collectionPage: marked }), [
    'no locked parts, but the CollectionPage is not marked free',
  ]);
  assert.equal(
    marksPremiumParts({ isAccessibleForFree: false, hasPart: [{ isAccessibleForFree: false, cssSelector: '.company-locked' }] }),
    false,
  );
});
