import assert from 'node:assert/strict';
import test from 'node:test';
import { validateQuestionSourceDate, validateQuestionSources } from './question-sources-lib.mjs';

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
