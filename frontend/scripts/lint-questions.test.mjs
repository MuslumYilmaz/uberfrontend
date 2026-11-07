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
  round: 'Full loop: coding',
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
]);
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

test('a rehearsal lists two to six existing JavaScript tasks under their own titles', () => {
  const [first, second] = rehearsal().items;
  assert.match(oneRehearsal({ items: [first] }), /2 to 6 tasks/);
  assert.match(oneRehearsal({ items: [first, first] }), /listed twice/);
  assert.match(oneRehearsal({ items: [first, { path: '/react/coding/react-counter', title: 'Counter' }] }), /JavaScript coding or debug task/);
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
  assert.match(oneRehearsal({ extra: true }), /Unknown key: extra/);
});
