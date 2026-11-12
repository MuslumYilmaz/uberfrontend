import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// A task written for React, Angular and Vue shares its checks wherever the three texts ask for the same thing: the
// checks are written once and copied, and this test keeps the copies equal. A check that only one text asks for is
// listed for that task alone. The lists also pin which requirements each task checks.
const FAMILIES = {
  counter: {
    react: ['react-counter', ['counter-starts-at-zero', 'counter-increment', 'counter-decrement', 'counter-floor', 'counter-reset']],
    angular: ['angular-counter-starter', ['counter-starts-at-zero', 'counter-increment', 'counter-decrement', 'counter-floor', 'counter-reset']],
    vue: ['vue-counter', ['counter-starts-at-zero', 'counter-increment', 'counter-decrement', 'counter-floor', 'counter-reset']],
  },
  todo: {
    // React asks for non-empty text but not trimmed text; Angular makes "Clear completed" optional and has no empty
    // message.
    react: ['react-todo-list', ['todo-add', 'todo-ignore-empty', 'todo-toggle', 'todo-remove', 'todo-clear-completed', 'todo-empty-state']],
    angular: ['angular-todo-list-starter', ['todo-add', 'todo-ignore-empty', 'todo-ignore-whitespace', 'todo-toggle', 'todo-remove']],
    vue: ['vue-todo-list', ['todo-add', 'todo-ignore-empty', 'todo-ignore-whitespace', 'todo-toggle', 'todo-remove', 'todo-clear-completed', 'todo-empty-state']],
  },
  autocomplete: {
    // React's autocomplete is a larger interview task with its own markup and checks.
    angular: ['angular-autocomplete-search-starter', [
      'autocomplete-shows-matches', 'autocomplete-blank-query-closes', 'autocomplete-selects-option', 'autocomplete-arrow-down',
      'autocomplete-arrow-up-last', 'autocomplete-enter-selects', 'autocomplete-escape-closes', 'autocomplete-outside-click-closes',
      'autocomplete-aria-state',
    ]],
    vue: ['vue-autocomplete-search', [
      'autocomplete-shows-matches', 'autocomplete-blank-query-closes', 'autocomplete-selects-option', 'autocomplete-arrow-down',
      'autocomplete-arrows-wrap', 'autocomplete-enter-selects', 'autocomplete-escape-closes', 'autocomplete-outside-click-closes',
      'autocomplete-at-most-eight', 'autocomplete-marks-match', 'autocomplete-loading-row', 'autocomplete-stale-ignored',
    ]],
  },
  snake: {
    react: ['react-snake-game', [
      'snake-initial-state', 'snake-moves-each-tick', 'snake-pause', 'snake-arrow-turn', 'snake-first-turn-wins',
      'snake-opposite-key-ignored', 'snake-eats-food', 'snake-wall-ends-game', 'snake-reset', 'snake-cleanup',
    ]],
    // Angular's text gives exact positions and times, which its first five checks follow.
    angular: ['angular-snake-game', [
      'snake-initial-grid', 'snake-timer-first-tick', 'snake-keyboard-grow-score', 'snake-wall-collision-stop',
      'snake-reset-state', 'snake-pause', 'snake-first-turn-wins', 'snake-opposite-key-ignored', 'snake-wasd', 'snake-cleanup',
    ]],
    vue: ['vue-snake-game', [
      'snake-initial-state', 'snake-moves-each-tick', 'snake-pause', 'snake-arrow-turn', 'snake-first-turn-wins',
      'snake-opposite-key-ignored', 'snake-eats-food', 'snake-wall-ends-game', 'snake-reset', 'snake-cleanup',
    ]],
  },
  tabs: {
    react: ['react-tabs-switcher', ['tabs-start-on-overview', 'tabs-click-switches']],
    // Angular's text also asks for tab roles, aria-selected and labelled panels.
    angular: ['angular-tabs-switcher', ['tabs-start-on-overview', 'tabs-click-switches', 'tabs-aria']],
    vue: ['vue-tabs-switcher', ['tabs-start-on-overview', 'tabs-click-switches']],
  },
  accordion: {
    react: ['react-accordion-faq', ['accordion-toggle', 'accordion-single-open', 'accordion-multiple-open', 'accordion-multiple-close']],
    angular: ['angular-faq-accordion', ['accordion-toggle', 'accordion-single-open', 'accordion-multiple-open', 'accordion-multiple-close']],
    vue: ['vue-accordion-faq', ['accordion-toggle', 'accordion-single-open', 'accordion-multiple-open', 'accordion-multiple-close']],
  },
  contactForm: {
    // React and Vue ask for a 10-character message (React without the spaces around it); Angular's (ngSubmit) runs
    // while the button is disabled, so only its text guards a second request; React and Angular clear the old result.
    react: ['react-contact-form-starter', [
      'contact-form-validation', 'contact-form-invalid-email', 'contact-form-message-length', 'contact-form-message-trimmed',
      'contact-form-field-errors', 'contact-form-submit-success', 'contact-form-submit-error', 'contact-form-clears-old-result',
    ]],
    angular: ['angular-contact-form-starter', [
      'contact-form-validation', 'contact-form-invalid-email', 'contact-form-field-errors', 'contact-form-submit-success',
      'contact-form-single-request', 'contact-form-submit-error', 'contact-form-clears-old-result',
    ]],
    vue: ['vue-contact-form-starter', [
      'contact-form-validation', 'contact-form-invalid-email', 'contact-form-message-length', 'contact-form-field-errors',
      'contact-form-submit-success', 'contact-form-submit-error',
    ]],
  },
  debouncedSearch: {
    // Angular's text has no no-results message.
    react: ['react-debounced-search', [
      'debounced-search-results', 'debounced-search-waits-500ms', 'debounced-search-error', 'debounced-search-empty',
      'debounced-search-clear', 'debounced-search-stale', 'debounced-search-cleanup',
    ]],
    angular: ['angular-debounced-search', [
      'debounced-search-results', 'debounced-search-waits-500ms', 'debounced-search-error', 'debounced-search-clear',
      'debounced-search-stale', 'debounced-search-cleanup',
    ]],
    vue: ['vue-debounced-search', [
      'debounced-search-results', 'debounced-search-waits-500ms', 'debounced-search-error', 'debounced-search-empty',
      'debounced-search-clear', 'debounced-search-stale', 'debounced-search-cleanup',
    ]],
  },
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalogs = new Map();
function question(framework, id) {
  if (!catalogs.has(framework)) {
    catalogs.set(framework, JSON.parse(fs.readFileSync(path.join(repoRoot, 'cdn/questions', framework, 'coding.json'), 'utf8')));
  }
  const found = catalogs.get(framework).find((entry) => entry.id === id);
  assert.ok(found, `${framework}/${id} is missing from the catalog`);
  return found;
}

for (const [family, members] of Object.entries(FAMILIES)) {
  test(`${family}: each task checks the requirements its own text states`, () => {
    for (const [framework, [id, expectedIds]] of Object.entries(members)) {
      const task = question(framework, id);
      assert.deepEqual(task.frameworkTests.map((check) => check.id), expectedIds, `${framework}/${id}`);
      assert.notEqual(task.checkCoverage, 'smoke', `${framework}/${id} is meant to be fully checked`);
    }
  });

  test(`${family}: a check shared by several tasks is the same in each`, () => {
    const copies = new Map();
    for (const [framework, [id]] of Object.entries(members)) {
      for (const check of question(framework, id).frameworkTests) {
        const first = copies.get(check.id);
        if (first) {
          assert.deepEqual(check, first.check, `${check.id}: ${framework}/${id} differs from ${first.where}`);
        } else {
          copies.set(check.id, { check, where: `${framework}/${id}` });
        }
      }
    }
  });
}
