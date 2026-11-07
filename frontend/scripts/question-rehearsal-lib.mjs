// Shared validation for timed rehearsals: the tasks of one interview round on one clock, all listed in
// cdn/questions/rehearsals/rehearsals.v1.json. Task pages read this one list, so the tasks themselves (some of them
// pinned by the interview content) stay untouched. Kept outside lint-questions.mjs so it can be unit-tested.

export const REHEARSAL_LIST = 'rehearsals/rehearsals.v1.json';

const LIST_KEYS = new Set(['schemaVersion', 'rehearsals']);
const KEYS = new Set(['id', 'access', 'company', 'title', 'round', 'summary', 'minutes', 'order', 'shortAnswers', 'items']);
const TEXT_KEYS = [['company', 40], ['title', 60], ['summary', 400]];
const SHORT_ANSWER_KEYS = new Set(['minutes', 'questions']);
const QUESTION_KEYS = new Set(['question', 'answer', 'path']);
const QUESTION_TEXT_KEYS = [['question', 160], ['answer', 240]];
// The panel that keeps the clock, records runs and turns read-only serves plain JavaScript tasks.
const ITEM_PATH = /^\/javascript\/(coding|debug)\/([a-z0-9-]+)$/;
// A short-answer question links the concept page that answers it in full.
const CONCEPT_PATH = /^\/[a-z]+\/trivia\/[a-z0-9-]+$/;

/**
 * Returns { id, message } issues for the rehearsal list. tasks maps every question path in the bank
 * (/javascript/coding/<id>, /css/trivia/<id>) to { title }.
 */
export function validateRehearsalList(data, tasks) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ id: '<file>', message: 'The rehearsal list must be a JSON object.' }];
  }
  const issues = [];
  const fileIssue = (message) => issues.push({ id: '<file>', message });
  for (const key of Object.keys(data)) if (!LIST_KEYS.has(key)) fileIssue(`Unknown key: ${key}`);
  if (data.schemaVersion !== 1) fileIssue('schemaVersion must be 1.');
  if (!Array.isArray(data.rehearsals) || !data.rehearsals.length) {
    fileIssue('rehearsals must be a non-empty list.');
    return issues;
  }

  const ids = new Set();
  for (const definition of data.rehearsals) {
    const id = typeof definition?.id === 'string' && definition.id ? definition.id : '<rehearsal>';
    const add = (message) => issues.push({ id, message });
    if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
      add('A rehearsal must be a JSON object.');
      continue;
    }
    for (const key of Object.keys(definition)) if (!KEYS.has(key)) add(`Unknown key: ${key}`);
    if (!/^[a-z0-9-]+$/.test(id)) add('id must be kebab-case.');
    if (ids.has(id)) add('id is listed twice.');
    ids.add(id);
    if (definition.access !== 'premium') add('access must be premium: a rehearsal is part of Premium.');
    // The plan generator places the rehearsal on this round of the company's plan, and stops when there is none.
    if (typeof definition.round !== 'string' || !/^[a-z0-9-]+$/.test(definition.round)) add('round must be the id of a round in the company plan, in kebab-case.');
    for (const [key, max] of TEXT_KEYS) {
      if (typeof definition[key] !== 'string' || !definition[key].trim() || definition[key].length > max) {
        add(`${key} must be text of at most ${max} characters.`);
      }
    }
    if (!Number.isInteger(definition.minutes) || definition.minutes < 5 || definition.minutes > 240) {
      add('minutes must be a whole number from 5 to 240.');
    }
    if (definition.order !== 'sequential' && definition.order !== 'free') add('order must be sequential or free.');

    const items = Array.isArray(definition.items) ? definition.items : [];
    if (items.length < 2 || items.length > 6) add('items must list 2 to 6 tasks.');
    const paths = new Set();
    for (const item of items) {
      const itemPath = typeof item?.path === 'string' ? item.path : '';
      if (!ITEM_PATH.test(itemPath)) {
        add(`An item must be a JavaScript coding or debug task path: ${itemPath || '(missing)'}`);
        continue;
      }
      if (paths.has(itemPath)) add(`An item is listed twice: ${itemPath}`);
      paths.add(itemPath);
      const task = tasks.get(itemPath);
      if (!task) add(`An item does not exist in the question bank: ${itemPath}`);
      else if (item.title !== task.title) add(`The title of ${itemPath} must match the task: "${task.title}"`);
    }
    if (definition.shortAnswers !== undefined) validateShortAnswers(definition, tasks, add);
  }
  return issues;
}

// Questions answered in a line before the problems open: part of the clock, never all of it, each with a sample
// answer for the review and the concept page that answers it in full.
function validateShortAnswers(definition, tasks, add) {
  const block = definition.shortAnswers;
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    add('shortAnswers must be an object with minutes and questions.');
    return;
  }
  for (const key of Object.keys(block)) if (!SHORT_ANSWER_KEYS.has(key)) add(`Unknown key in shortAnswers: ${key}`);
  if (!Number.isInteger(block.minutes) || block.minutes < 1 || !(block.minutes < definition.minutes)) {
    add("shortAnswers.minutes must be a whole number of minutes, less than the rehearsal's.");
  }
  const questions = Array.isArray(block.questions) ? block.questions : [];
  if (questions.length < 3 || questions.length > 12) add('shortAnswers.questions must list 3 to 12 questions.');
  const paths = new Set();
  for (const entry of questions) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      add('A short-answer question must be a JSON object.');
      continue;
    }
    for (const key of Object.keys(entry)) if (!QUESTION_KEYS.has(key)) add(`Unknown key in a short-answer question: ${key}`);
    for (const [key, max] of QUESTION_TEXT_KEYS) {
      if (typeof entry[key] !== 'string' || !entry[key].trim() || entry[key].length > max) {
        add(`A short-answer ${key} must be text of at most ${max} characters.`);
      }
    }
    const conceptPath = typeof entry.path === 'string' ? entry.path : '';
    if (!CONCEPT_PATH.test(conceptPath)) {
      add(`A short-answer question must link a concept question page: ${conceptPath || '(missing)'}`);
      continue;
    }
    if (paths.has(conceptPath)) add(`A concept question is linked twice: ${conceptPath}`);
    paths.add(conceptPath);
    if (!tasks.has(conceptPath)) add(`A short-answer question links a page that does not exist: ${conceptPath}`);
  }
}
