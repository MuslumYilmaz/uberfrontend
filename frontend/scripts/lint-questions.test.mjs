import assert from 'node:assert/strict';
import test from 'node:test';
import { validateQuestionSourceDate, validateQuestionSources } from './question-sources-lib.mjs';
import { validatePreviewSample } from './question-preview-sample-lib.mjs';
import { validateRehearsalList } from './question-rehearsal-lib.mjs';

const today = new Date('2026-10-14T12:00:00.000Z');
const valid = () => ({
  label: 'PracHub: Waymo senior frontend interview experience, May 2026',
  url: 'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience',
  publisher: 'PracHub',
  date: '2026-05',
  note: 'One self-reported senior loop. It establishes the round list, not the exact wording.',
});

test('a well-formed sources list passes', () => {
  assert.deepEqual(validateQuestionSources([valid()], { today }), []);
  assert.deepEqual(validateQuestionSources([{ ...valid(), note: undefined, date: '2026-05-12' }], { today }), []);
});

test('sources must be a non-empty array of at most six entries', () => {
  assert.equal(validateQuestionSources('nope', { today }).length, 1);
  assert.match(validateQuestionSources([], { today })[0], /1 to 6 entries/);
  const seven = Array.from({ length: 7 }, (_, index) => ({ ...valid(), url: `https://example.com/report-${index}` }));
  assert.match(validateQuestionSources(seven, { today })[0], /1 to 6 entries/);
});

test('urls must be https and unique', () => {
  assert.match(validateQuestionSources([{ ...valid(), url: 'http://prachub.com/x' }], { today }).join('\n'), /https URL/);
  assert.match(validateQuestionSources([{ ...valid(), url: 'not a url' }], { today }).join('\n'), /https URL/);
  const errors = validateQuestionSources([valid(), valid()], { today });
  assert.match(errors.join('\n'), /duplicates an earlier source/);
});

test('dates must be YYYY-MM or YYYY-MM-DD, valid and not in the future', () => {
  assert.equal(validateQuestionSourceDate('2026-05', today), null);
  assert.equal(validateQuestionSourceDate('2026-10-14', today), null);
  assert.match(validateQuestionSourceDate('May 2026', today), /YYYY-MM/);
  assert.match(validateQuestionSourceDate('2026-13', today), /valid calendar date/);
  assert.match(validateQuestionSourceDate('2026-02-30', today), /valid calendar date/);
  assert.match(validateQuestionSourceDate('2026-11', today), /future/);
  assert.match(validateQuestionSourceDate('2026-10-15', today), /future/);
  assert.match(validateQuestionSourceDate(20260514, today), /string/);
});

test('labels, publishers, notes and unknown keys are bounded', () => {
  const errors = validateQuestionSources([{
    ...valid(),
    label: 'short',
    publisher: 'P',
    note: 'x'.repeat(281),
    extra: true,
  }], { today }).join('\n');
  assert.match(errors, /label must be 8 to 120/);
  assert.match(errors, /publisher must be 2 to 40/);
  assert.match(errors, /note must be a non-empty string of at most 280/);
  assert.match(errors, /unknown key: extra/);
  assert.match(validateQuestionSources([{ ...valid(), note: '   ' }], { today }).join('\n'), /note must be/);
});

test('labels and notes may not claim provenance the site does not have', () => {
  for (const text of ['Known questions from Waymo, May 2026', 'Collected candidate reports']) {
    assert.match(validateQuestionSources([{ ...valid(), label: text }], { today }).join('\n'), /must not claim provenance/);
    assert.match(validateQuestionSources([{ ...valid(), note: text }], { today }).join('\n'), /must not claim provenance/);
  }
});

test('company must be a slug and one of the entry companies when the entry list is known', () => {
  assert.deepEqual(validateQuestionSources([{ ...valid(), company: 'waymo' }], { today }), []);
  assert.deepEqual(validateQuestionSources([{ ...valid(), company: 'waymo' }], { today, companies: ['waymo', 'intuit'] }), []);
  assert.match(validateQuestionSources([{ ...valid(), company: 'Waymo Inc' }], { today }).join('\n'), /lowercase company slug/);
  assert.match(validateQuestionSources([{ ...valid(), company: 'waymo' }], { today, companies: ['intuit'] }).join('\n'), /not one of the entry's companies/);
});

test('a lock page sample is prose on a Premium task, with a label and a quote', () => {
  const sample = { label: 'One of the four reports from support', quote: 'A $5.00 coupon wipes out the whole invoice.', note: 'Five small files.' };
  assert.deepEqual(validatePreviewSample(undefined, { access: 'free' }), []);
  assert.deepEqual(validatePreviewSample(sample, { access: 'premium' }), []);
  assert.match(validatePreviewSample(sample, { access: 'free' }).join('\n'), /belongs on a Premium task/);
  assert.match(validatePreviewSample({ label: 'A report', quote: ' ' }, { access: 'premium' }).join('\n'), /quote must be text/);
  assert.match(validatePreviewSample({ ...sample, extra: 'x' }, { access: 'premium' }).join('\n'), /unknown key: extra/);
  for (const quote of ['Open `src/money.js` first.', 'See money.js for the cause.', 'It returns { total }.', 'Use a => b.']) {
    assert.match(validatePreviewSample({ ...sample, quote }, { access: 'premium' }).join('\n'), /must read as prose/, quote);
  }
});

const rehearsal = () => ({
  id: 'meta-full-loop-coding',
  access: 'premium',
  company: 'meta',
  title: 'Meta coding round',
  round: 'full-loop-coding',
  summary: 'About two problems in about 40 minutes.',
  minutes: 40,
  order: 'sequential',
  items: [
    { path: '/javascript/coding/js-dom-twin-node', title: 'Find the Corresponding Node in Twin DOM Trees' },
    { path: '/javascript/coding/js-debounce', title: 'Debounce Function' },
  ],
});
const rehearsalTasks = new Map([
  ['/javascript/coding/js-dom-twin-node', { title: 'Find the Corresponding Node in Twin DOM Trees' }],
  ['/javascript/coding/js-debounce', { title: 'Debounce Function' }],
  ['/react/coding/react-counter', { title: 'Counter' }],
  ['/javascript/trivia/js-closures', { title: 'Explain Closures in JavaScript' }],
  ['/css/trivia/css-box-model', { title: 'The box model' }],
  ['/react/trivia/react-useeffect-purpose', { title: 'useEffect()' }],
]);
const quiz = () => ({
  minutes: 10,
  questions: [
    { question: 'What is a closure?', answer: 'A function that keeps its scope.', path: '/javascript/trivia/js-closures' },
    { question: 'What does border-box change?', answer: 'Width includes padding and border.', path: '/css/trivia/css-box-model' },
    { question: 'What is useEffect for?', answer: 'Syncing with the outside world.', path: '/react/trivia/react-useeffect-purpose' },
  ],
});
const choice = (patch = {}) => ({
  question: 'How wide is the content box?',
  choices: ['178px', '200px', '222px'],
  correct: [0],
  pick: 'one',
  answer: 'Border-box counts padding and border.',
  path: '/css/trivia/css-box-model',
  ...patch,
});
const listIssues = (list) => validateRehearsalList(list, rehearsalTasks).map((issue) => `${issue.id}: ${issue.message}`).join('\n');
const oneRehearsal = (patch) => listIssues({ schemaVersion: 1, rehearsals: [{ ...rehearsal(), ...patch }] });

test('the rehearsal list holds distinct rehearsals under schema version 1', () => {
  assert.equal(listIssues({ schemaVersion: 1, rehearsals: [rehearsal()] }), '');
  assert.match(listIssues({ schemaVersion: 2, rehearsals: [rehearsal()] }), /schemaVersion must be 1/);
  assert.match(listIssues({ schemaVersion: 1, rehearsals: [] }), /non-empty list/);
  assert.match(listIssues({ schemaVersion: 1, rehearsals: [rehearsal()], extra: true }), /<file>: Unknown key: extra/);
  assert.match(listIssues({ schemaVersion: 1, rehearsals: [rehearsal(), rehearsal()] }), /meta-full-loop-coding: id is listed twice/);
  assert.match(listIssues([]), /must be a JSON object/);
});

test('a rehearsal lists two to six existing JavaScript or React tasks under their own titles', () => {
  const [first, second] = rehearsal().items;
  assert.match(oneRehearsal({ items: [first] }), /2 to 6 tasks/);
  assert.match(oneRehearsal({ items: [first, first] }), /listed twice/);
  assert.equal(oneRehearsal({ items: [first, { path: '/react/coding/react-counter', title: 'Counter' }] }), '');
  assert.match(oneRehearsal({ items: [first, { path: '/vue/coding/vue-counter', title: 'Counter' }] }), /JavaScript or React coding or debug task/);
  assert.match(oneRehearsal({ items: [first, { path: '/javascript/coding/js-missing', title: 'Missing' }] }), /does not exist/);
  assert.match(oneRehearsal({ items: [first, { ...second, title: 'Debounce' }] }), /must match the task: "Debounce Function"/);
});

test('a rehearsal is Premium, with a clock, an order and known keys', () => {
  assert.match(oneRehearsal({ access: 'free' }), /access must be premium/);
  assert.match(oneRehearsal({ minutes: 4 }), /minutes must be a whole number/);
  assert.match(oneRehearsal({ minutes: 40.5 }), /minutes must be a whole number/);
  assert.match(oneRehearsal({ order: 'random' }), /order must be sequential or free/);
  assert.match(oneRehearsal({ id: 'Meta Onsite' }), /kebab-case/);
  assert.match(oneRehearsal({ summary: '' }), /summary must be text/);
  assert.match(oneRehearsal({ round: 'Full loop: coding' }), /round must be the id of a round/);
  assert.match(oneRehearsal({ extra: true }), /Unknown key: extra/);
  assert.equal(oneRehearsal({ planNote: 'The round runs 60 minutes; the last 15 go to questions on test cases.' }), '');
  assert.match(oneRehearsal({ planNote: 'the round runs 60 minutes' }), /planNote must be one sentence/);
  assert.match(oneRehearsal({ planNote: `${'A'.repeat(140)}.` }), /planNote must be one sentence of at most 140 characters/);
});

test('quiz questions take part of the clock, and each links an existing concept page with a sample answer', () => {
  assert.equal(oneRehearsal({ quiz: quiz() }), '');
  const [first, second, third] = quiz().questions;
  const withQuestions = (questions) => oneRehearsal({ quiz: { minutes: 10, questions } });
  assert.match(oneRehearsal({ quiz: [] }), /quiz must be an object/);
  assert.match(oneRehearsal({ quiz: { ...quiz(), minutes: 40 } }), /less than the rehearsal's/);
  assert.match(oneRehearsal({ quiz: { ...quiz(), extra: 1 } }), /Unknown key in quiz: extra/);
  assert.match(withQuestions([first]), /2 to 12 questions/);
  assert.match(withQuestions([first, second, first]), /linked twice: \/javascript\/trivia\/js-closures/);
  assert.match(withQuestions([first, second, { ...third, path: '/javascript/coding/js-debounce' }]), /must link a concept question page/);
  assert.match(withQuestions([first, second, { ...third, path: '/javascript/trivia/js-missing' }]), /does not exist: \/javascript\/trivia\/js-missing/);
  assert.match(withQuestions([first, second, { ...third, answer: '' }]), /quiz answer must be text/);
  assert.match(withQuestions([first, second, { ...third, question: 'x'.repeat(161) }]), /quiz question must be text of at most 160/);
  assert.match(withQuestions([first, second, { ...third, hint: 'x' }]), /Unknown key in a quiz question: hint/);
});

test('a multiple-choice question names its right options among two to six distinct choices', () => {
  const closure = quiz().questions[0];
  const withChoice = (entry) => oneRehearsal({ quiz: { questions: [closure, entry] } });
  // No time of their own is fine: the reports may give none.
  assert.equal(withChoice(choice()), '');
  assert.equal(withChoice(choice({ correct: [0, 2], pick: 'all' })), '');
  assert.match(withChoice(choice({ correct: [0, 2] })), /exactly one right choice/);
  assert.match(withChoice(choice({ correct: [3] })), /indexes of the right choices/);
  assert.match(withChoice(choice({ correct: [] })), /indexes of the right choices/);
  assert.match(withChoice(choice({ correct: [0, 0], pick: 'all' })), /lists an index twice/);
  assert.match(withChoice(choice({ pick: 'some' })), /pick must be one or all/);
  assert.match(withChoice(choice({ choices: ['only'] , correct: [0] })), /2 to 6 choices/);
  assert.match(withChoice(choice({ choices: ['178px', '178px', '222px'] })), /lists a choice twice/);
  assert.match(withChoice(choice({ choices: ['x'.repeat(121), '200px'] })), /at most 120 characters/);
  assert.match(withChoice({ ...closure, path: '/css/trivia/css-box-model', correct: [0] }), /without choices cannot name right options/);
});
