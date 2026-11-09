// Shared validation for timed rehearsals: the tasks of one interview round on one clock, all listed in
// cdn/questions/rehearsals/rehearsals.v1.json. Task pages read this one list, so the tasks themselves (some of them
// pinned by the interview content) stay untouched. Kept outside lint-questions.mjs so it can be unit-tested.

export const REHEARSAL_LIST = 'rehearsals/rehearsals.v1.json';

const LIST_KEYS = new Set(['schemaVersion', 'rehearsals']);
const KEYS = new Set(['id', 'access', 'company', 'title', 'round', 'summary', 'planNote', 'minutes', 'order', 'quiz', 'items']);
const TEXT_KEYS = [['company', 40], ['title', 60], ['summary', 400]];
// A sentence the plan row adds after the problems, for what the row alone would leave unexplained, such as a clock
// shorter than the round's.
const PLAN_NOTE_MAX = 140;
const QUIZ_KEYS = new Set(['minutes', 'questions']);
const QUESTION_KEYS = new Set(['question', 'answer', 'path', 'choices', 'correct', 'pick']);
const QUESTION_TEXT_KEYS = [['question', 160], ['answer', 240]];
const CHOICE_MAX = 120;
// The panels that keep the clock, record runs and turn read-only serve plain JavaScript tasks and React tasks.
const ITEM_PATH = /^\/(javascript|react)\/(coding|debug)\/([a-z0-9-]+)$/;
// A question links the concept page that answers it in full.
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
    if (definition.planNote !== undefined && (typeof definition.planNote !== 'string' || !/^[A-Z].*\.$/.test(definition.planNote) || definition.planNote.length > PLAN_NOTE_MAX)) {
      add(`planNote must be one sentence of at most ${PLAN_NOTE_MAX} characters, from a capital letter to a full stop.`);
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
        add(`An item must be a JavaScript or React coding or debug task path: ${itemPath || '(missing)'}`);
        continue;
      }
      if (paths.has(itemPath)) add(`An item is listed twice: ${itemPath}`);
      paths.add(itemPath);
      const task = tasks.get(itemPath);
      if (!task) add(`An item does not exist in the question bank: ${itemPath}`);
      else if (item.title !== task.title) add(`The title of ${itemPath} must match the task: "${task.title}"`);
    }
    if (definition.quiz !== undefined) validateQuiz(definition, tasks, add);
  }
  return issues;
}

// Questions answered before the problems open, in a line or by picking from set options: part of the clock, never
// all of it, each with a sample answer (or why the right options are right) and the concept page that answers it in
// full.
function validateQuiz(definition, tasks, add) {
  const quiz = definition.quiz;
  if (!quiz || typeof quiz !== 'object' || Array.isArray(quiz)) {
    add('quiz must be an object with questions.');
    return;
  }
  for (const key of Object.keys(quiz)) if (!QUIZ_KEYS.has(key)) add(`Unknown key in quiz: ${key}`);
  if (quiz.minutes !== undefined && (!Number.isInteger(quiz.minutes) || quiz.minutes < 1 || !(quiz.minutes < definition.minutes))) {
    add("quiz.minutes must be a whole number of minutes, less than the rehearsal's.");
  }
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (questions.length < 2 || questions.length > 12) add('quiz.questions must list 2 to 12 questions.');
  const paths = new Set();
  for (const entry of questions) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      add('A quiz question must be a JSON object.');
      continue;
    }
    for (const key of Object.keys(entry)) if (!QUESTION_KEYS.has(key)) add(`Unknown key in a quiz question: ${key}`);
    for (const [key, max] of QUESTION_TEXT_KEYS) {
      if (typeof entry[key] !== 'string' || !entry[key].trim() || entry[key].length > max) {
        add(`A quiz ${key} must be text of at most ${max} characters.`);
      }
    }
    validateChoices(entry, add);
    const conceptPath = typeof entry.path === 'string' ? entry.path : '';
    if (!CONCEPT_PATH.test(conceptPath)) {
      add(`A quiz question must link a concept question page: ${conceptPath || '(missing)'}`);
      continue;
    }
    if (paths.has(conceptPath)) add(`A concept question is linked twice: ${conceptPath}`);
    paths.add(conceptPath);
    if (!tasks.has(conceptPath)) add(`A quiz question links a page that does not exist: ${conceptPath}`);
  }
}

// A multiple-choice question offers two to six distinct options and names the right ones: one when it asks for one
// option, any number when it asks for every right one, as HackerRank's multiple-select questions do.
function validateChoices(entry, add) {
  const hasChoices = entry.choices !== undefined;
  if (!hasChoices) {
    if (entry.correct !== undefined || entry.pick !== undefined) add('A quiz question without choices cannot name right options or a pick.');
    return;
  }
  const choices = Array.isArray(entry.choices) ? entry.choices : [];
  if (choices.length < 2 || choices.length > 6) add('A multiple-choice question must offer 2 to 6 choices.');
  if (choices.some((choice) => typeof choice !== 'string' || !choice.trim() || choice.length > CHOICE_MAX)) {
    add(`Each choice must be text of at most ${CHOICE_MAX} characters.`);
  }
  if (new Set(choices).size !== choices.length) add('A multiple-choice question lists a choice twice.');
  if (entry.pick !== 'one' && entry.pick !== 'all') add('pick must be one or all.');
  const correct = Array.isArray(entry.correct) ? entry.correct : [];
  if (!correct.length || correct.some((index) => !Number.isInteger(index) || index < 0 || index >= choices.length)) {
    add('correct must list the indexes of the right choices.');
  }
  if (new Set(correct).size !== correct.length) add('correct lists an index twice.');
  if (entry.pick === 'one' && correct.length !== 1) add('A question that asks for one option must name exactly one right choice.');
}
