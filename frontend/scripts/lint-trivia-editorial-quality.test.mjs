#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import ts from 'typescript';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-trivia-editorial-quality.mjs');
const STALE_CLOSURES_ID = 'react-stale-state-closures';
const STALE_CLOSURES_PATH = `/react/trivia/${STALE_CLOSURES_ID}`;
const STALE_CLOSURES_TITLE = 'React Stale Closures: Causes, Fixes, and Tests';
const STALE_CLOSURES_H1 = 'React Stale Closures: Why State Goes Stale and How to Fix It';
const STALE_CLOSURES_DESCRIPTION =
  'Learn why React closures read stale state and fix them with dependencies, functional updates, refs, and useEffectEvent, using real examples and tests.';

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trivia-editorial-quality-'));
}

function writeJson(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function repeat(sentence, count) {
  return Array.from({ length: count }, () => sentence).join(' ');
}

function baseTrivia(overrides = {}) {
  return {
    id: 'closure-question',
    title: 'What is a closure?',
    technology: 'javascript',
    difficulty: 'easy',
    updatedAt: '2026-04-02',
    seo: {
      title: 'What is a closure? Frontend interview answer',
      description: 'Closure interview answer with example, tradeoffs, and common mistakes in frontend code.',
    },
    description: 'Closure means a function keeps access to outer variables even after the outer function finishes.',
    answer: {
      blocks: [
        {
          type: 'text',
          text: `<strong>Core idea</strong><br><br>${repeat('A closure keeps lexical scope available so later callbacks can still read the variables they need.', 10)}`,
        },
        {
          type: 'list',
          columns: ['Situation', 'Decision'],
          rows: [
            ['Short-lived handler', 'A simple closure is fine and keeps the example direct.'],
            ['Large retained data', 'Review the tradeoff so the closure does not keep heavy objects alive by mistake.'],
          ],
          caption: 'Worked example and tradeoff table',
        },
        {
          type: 'code',
          language: 'javascript',
          code: `function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}`,
        },
        {
          type: 'text',
          text: `${repeat('Example: event handlers often rely on closures, but the decision changes when retained state becomes too large or too stale.', 8)} Summary: keep the closure small and intentional.`,
        },
      ],
    },
    ...overrides,
  };
}

function runLinter(tempRoot) {
  return spawnSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      CDN_QUESTIONS_DIR: path.join(tempRoot, 'cdn', 'questions'),
    },
  });
}

function expectSuccess(tempRoot) {
  const result = runLinter(tempRoot);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Expected success');
  }
  return `${result.stdout}${result.stderr}`;
}

function expectFailure(tempRoot) {
  const result = runLinter(tempRoot);
  assert.notEqual(result.status, 0, 'Expected lint-trivia-editorial-quality to fail');
  return `${result.stdout}${result.stderr}`;
}

function setupTrivia(entriesByTech) {
  const tempRoot = makeTempRoot();
  Object.entries(entriesByTech).forEach(([tech, entries]) => {
    writeJson(tempRoot, `cdn/questions/${tech}/trivia.json`, entries);
  });
  return tempRoot;
}

function readRepoTrivia(technology, id) {
  const filePath = path.join(repoRoot, 'cdn', 'questions', technology, 'trivia.json');
  const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entry = entries.find((candidate) => candidate?.id === id);
  assert.ok(entry, `Expected ${technology}/trivia.json to contain ${id}`);
  return entry;
}

function normalizedVisibleContent(entry) {
  const parts = [entry?.title, entry?.description];
  for (const block of entry?.answer?.blocks || []) {
    if (block?.type === 'text') parts.push(block.text);
    if (block?.type === 'list') {
      parts.push(block.caption, ...(block.columns || []));
      for (const row of block.rows || []) parts.push(...row);
    }
  }
  return parts
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|#39);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function answerHtml(entry) {
  return (entry?.answer?.blocks || [])
    .filter((block) => block?.type === 'text')
    .map((block) => String(block.text || ''))
    .join('\n');
}

function assertIncludesContent(content, expected, context = STALE_CLOSURES_ID) {
  assert.ok(content.includes(expected.toLowerCase()), `${context} must include: ${expected}`);
}

function assertRowsCover(table, expectedFirstCells, context) {
  assert.ok(table, `${context} table is required`);
  const firstCells = (table.rows || []).map((row) => String(row?.[0] || '').trim().toLowerCase());
  for (const expected of expectedFirstCells) {
    assert.ok(
      firstCells.some((cell) => cell.includes(expected.toLowerCase())),
      `${context} must include a row for: ${expected}`,
    );
  }
}

function assertJsxBlocksParse(entry) {
  const jsxBlocks = (entry?.answer?.blocks || []).filter(
    (block) => block?.type === 'code' && /^(?:jsx|tsx)$/i.test(String(block.language || '')),
  );
  assert.ok(jsxBlocks.length >= 8, `${STALE_CLOSURES_ID} must include complete JSX examples and tests`);

  jsxBlocks.forEach((block, index) => {
    const result = ts.transpileModule(String(block.code || ''), {
      fileName: `${STALE_CLOSURES_ID}-${index}.tsx`,
      reportDiagnostics: true,
      compilerOptions: {
        allowJs: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const errors = (result.diagnostics || []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.deepEqual(
      errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
      [],
      `${STALE_CLOSURES_ID} JSX block ${index + 1} must be syntactically valid`,
    );
  });
}

{
  const tempRoot = setupTrivia({
    javascript: [baseTrivia()],
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /editorial quality checks passed/);
}

{
  const entry = baseTrivia();
  delete entry.answer;
  const tempRoot = setupTrivia({ javascript: [entry] });
  const output = expectFailure(tempRoot);
  assert.match(output, /missing answer content entirely/);
}

{
  const entry = baseTrivia({
    description: 'Short description.',
    answer: 'Tiny answer only.',
  });
  const tempRoot = setupTrivia({ javascript: [entry] });
  const output = expectFailure(tempRoot);
  assert.match(output, /thin string answer/);
}

{
  const entry = baseTrivia({
    answer: {
      blocks: [
        { type: 'text', text: repeat('One short explanation that is still too lonely for a shipped answer.', 8) },
      ],
    },
  });
  const tempRoot = setupTrivia({ javascript: [entry] });
  const output = expectFailure(tempRoot);
  assert.match(output, /at least 2 renderable answer blocks/);
}

{
  const entry = baseTrivia({
    answer: {
      blocks: [
        { type: 'text', text: repeat('This explanation stays broad and generic without concrete teaching artifacts or branching guidance.', 14) },
        { type: 'text', text: repeat('The second block stays broad and abstract while avoiding concrete situations, comparisons, and worked outputs.', 14) },
      ],
    },
  });
  const tempRoot = setupTrivia({ javascript: [entry] });
  const output = expectFailure(tempRoot);
  assert.match(output, /missing a teaching signal/);
}

{
  const first = baseTrivia({
    id: 'one',
    seo: {
      title: 'Duplicate title',
      description: 'Unique enough description for the first entry with example and tradeoff language.',
    },
  });
  const second = baseTrivia({
    id: 'two',
    seo: {
      title: 'Duplicate title',
      description: 'Unique enough description for the second entry with example and tradeoff language.',
    },
  });
  const tempRoot = setupTrivia({ javascript: [first, second] });
  const output = expectFailure(tempRoot);
  assert.match(output, /duplicate trivia seo\.title/);
}

{
  const first = baseTrivia({
    id: 'one',
    seo: {
      title: 'Unique title one',
      description: 'Duplicate description across entries.',
    },
  });
  const second = baseTrivia({
    id: 'two',
    seo: {
      title: 'Unique title two',
      description: 'Duplicate description across entries.',
    },
  });
  const tempRoot = setupTrivia({ javascript: [first, second] });
  const output = expectFailure(tempRoot);
  assert.match(output, /duplicate trivia seo\.description/);
}

{
  const entry = baseTrivia({
    seo: {
      title: 'Closure API docs interview answer',
      description: 'Practice explaining JavaScript closures in interviews with examples and tradeoffs.',
      h1IntentLabel: 'Memorized docs wording interview answer',
    },
  });
  const tempRoot = setupTrivia({ javascript: [entry] });
  const output = expectFailure(tempRoot);
  assert.match(output, /seo\.title uses docs-intent wording/);
  assert.match(output, /seo\.h1IntentLabel uses docs-intent wording/);
}

{
  const tempRoot = setupTrivia({
    javascript: [
      baseTrivia({
        updatedAt: '2024-01-01',
      }),
    ],
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /has not been updated in/);
}

{
  const tempRoot = setupTrivia({
    javascript: [
      baseTrivia({
        description: 'A short but valid explanation.',
        answer: {
          blocks: [
            {
              type: 'text',
              text: repeat('Closures keep outer state available for later callbacks in JavaScript code.', 9),
            },
            {
              type: 'text',
              text: 'Summary: closures help later callbacks access prior state, but this explanation still avoids a concrete case and stays light on branching guidance.',
            },
          ],
        },
      }),
    ],
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /is short for a shipped trivia explanation/);
  assert.match(output, /has no explicit example\/scenario cue/);
  assert.match(output, /has no tradeoff\/pitfall\/decision cue/);
}

{
  const entry = readRepoTrivia('react', STALE_CLOSURES_ID);
  const blocks = entry.answer?.blocks || [];
  const visibleContent = normalizedVisibleContent(entry);
  const sourceHtml = answerHtml(entry);

  assert.equal(entry.seo?.title, STALE_CLOSURES_TITLE);
  assert.equal(entry.seo?.h1, STALE_CLOSURES_H1);
  assert.equal(entry.seo?.description, STALE_CLOSURES_DESCRIPTION);
  assert.equal(entry.publishedAt, '2026-01-25');
  assert.equal(entry.updatedAt, '2026-07-20');

  const directAnswerWords = String(entry.description || '').trim().split(/\s+/).filter(Boolean).length;
  assert.ok(
    directAnswerWords >= 50 && directAnswerWords <= 90,
    `${STALE_CLOSURES_ID} direct answer must stay between 50 and 90 words`,
  );
  assertIncludesContent(visibleContent, 'Each React render creates a new set of state and prop bindings');
  assertIncludesContent(visibleContent, 'A React stale closure becomes a bug');
  assert.doesNotMatch(visibleContent, /closures? (?:freeze|freezes|frozen) variables?/i);

  const chooser = blocks.find(
    (block) => block?.type === 'list' && block.caption === 'React stale closure quick fix chooser',
  );
  assert.deepEqual(chooser?.columns, ['Situation', 'Preferred fix', 'Why', 'Common mistake']);
  assert.equal(chooser?.rows?.length, 6, 'quick fix chooser must contain exactly six decisions');
  assertRowsCover(chooser, [
    'Updating state from its previous value',
    'Effect should re-synchronize when a value changes',
    'Long-lived external callback must read the latest value',
    'Non-reactive logic called only from an Effect',
    'Logic actually belongs to a click or submit handler',
    'Snapshot from the initiating action is intentionally required',
  ], 'React stale closure quick fix chooser');

  [
    'Mental model: each render is a snapshot',
    'Scenario 1: setInterval reads old state',
    'Scenario 2: async callback after await',
    'Scenario 3: event listener or subscription',
    'Scenario 4: debounced or retained callback',
    'Modern React 19.2+: useEffectEvent',
    'React stale closure fix comparison',
    'How to test a stale closure bug',
    'Important distinctions',
    'React stale closure FAQ',
    '30-second interview answer',
    'Common interview follow-ups',
    'How to explain the trade-off',
    'Summary',
  ].forEach((heading) => assertIncludesContent(visibleContent, heading));

  const comparison = blocks.find(
    (block) => block?.type === 'list' && block.caption === 'React stale closure fix comparison',
  );
  assertRowsCover(comparison, [
    'Functional update',
    'Complete Effect dependencies',
    'useRef',
    'useEffectEvent',
    'useCallback',
    'Move logic out of an Effect',
  ], 'React stale closure fix comparison');
  assert.equal(comparison?.rows?.length, 6, 'fix comparison must contain exactly six options');
  assert.deepEqual(comparison?.columns, [
    'Fix',
    'What it solves',
    'When it is appropriate',
    'What it does not solve / common misuse',
  ]);
  assert.ok(
    (comparison?.rows || []).every(
      (row) => row.length === 4 && row.every((cell) => String(cell || '').trim().length > 0),
    ),
    'each fix comparison row must explain the problem, fit, limitation, and misuse',
  );

  [
    'stale closure vs race condition',
    'stale closure vs stale server response',
    'stale closure vs intentionally captured snapshot',
    'stale closure vs unnecessary Effect',
    'stale closure vs memoization problem',
  ].forEach((distinction) => assertIncludesContent(visibleContent, distinction));

  [
    'What is a stale closure in React?',
    'Why does useEffect read old state?',
    'Does useCallback fix stale closures?',
    'Should I disable the exhaustive-deps rule?',
    'Should I always use a ref to get the latest state?',
    'Does useEffectEvent replace Effect dependencies?',
    'Is a captured old value always a bug?',
    'Why does setInterval keep seeing the initial state?',
  ].forEach((question) => assertIncludesContent(visibleContent, question));

  const codeSource = blocks
    .filter((block) => block?.type === 'code')
    .map((block) => String(block.code || ''))
    .join('\n');
  [
    /jest\.useFakeTimers\s*\(/,
    /jest\.advanceTimersByTime\s*\(/,
    /BrokenCounter/,
    /FixedCounter/,
    /rerender\s*\(/,
    /dispatchEvent\s*\(/,
  ].forEach((pattern) => {
    assert.match(codeSource, pattern, `${STALE_CLOSURES_ID} testing examples must include ${pattern}`);
  });
  assertJsxBlocksParse(entry);

  const internalRoutes = [
    '/react/trivia/react-useeffect-purpose',
    '/react/trivia/react-strictmode-double-invoke-effects',
    '/javascript/trivia/js-closures',
    '/javascript/trivia/js-async-race-conditions',
    '/react/trivia/react-useref-vs-usestate',
    '/react/trivia/react-usememo-vs-usecallback',
    '/react/trivia/react-hooks-youve-used',
    '/react/coding/react-debounced-search',
    '/react/interview-questions',
    '/guides/framework-prep/react-prep-path',
  ];
  const prerenderRoutes = fs.readFileSync(
    path.join(repoRoot, 'frontend', 'src', 'prerender.routes.txt'),
    'utf8',
  ).split(/\r?\n/).map((route) => route.trim()).filter(Boolean);

  internalRoutes.forEach((route) => {
    assert.ok(sourceHtml.includes(`href="${route}"`), `${STALE_CLOSURES_ID} must link to ${route}`);
    assert.ok(prerenderRoutes.includes(route), `${route} must be a real prerendered route`);
  });
  assert.equal(
    prerenderRoutes.filter((route) => route === STALE_CLOSURES_PATH).length,
    1,
    'the existing stale-closures route must remain unique',
  );
  assert.ok(!prerenderRoutes.includes('/react/trivia/react-stale-closure-fixes'));

  [
    'https://react.dev/reference/react/useEffectEvent',
    'https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps',
    'https://react.dev/learn/state-as-a-snapshot',
    'https://react.dev/reference/react/useCallback',
  ].forEach((url) => {
    assert.ok(sourceHtml.includes(`href="${url}"`), `${STALE_CLOSURES_ID} must cite ${url}`);
  });

  const useEffectEntry = readRepoTrivia('react', 'react-useeffect-purpose');
  const closuresEntry = readRepoTrivia('javascript', 'js-closures');
  assert.ok(answerHtml(useEffectEntry).includes(`href="${STALE_CLOSURES_PATH}"`));
  assert.ok(answerHtml(closuresEntry).includes(`href="${STALE_CLOSURES_PATH}"`));
}

console.log('[lint-trivia-editorial-quality.test] ok');
