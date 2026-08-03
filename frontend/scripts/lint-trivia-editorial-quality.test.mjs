#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-trivia-editorial-quality.mjs');
const STALE_CLOSURES_ID = 'react-stale-state-closures';
const STALE_CLOSURES_PATH = `/react/trivia/${STALE_CLOSURES_ID}`;
const STALE_CLOSURES_TITLE = 'React Stale Closures: 6 PRs, Which Fix Is Right?';
const STALE_CLOSURES_H1 = 'React Stale Closure Case Files: Diagnose Six Pull Requests';
const STALE_CLOSURES_DESCRIPTION =
  'Review six React pull requests: four stale closures, one intentional snapshot, and one async race. Predict the failure and reveal the minimal safe diff.';

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

  assert.equal(entry.title, 'Why does React sometimes show stale state in closures? How do you fix it?');
  assert.equal(entry.access, 'free');
  assert.equal(entry.seo?.title, STALE_CLOSURES_TITLE);
  assert.equal(entry.seo?.h1, STALE_CLOSURES_H1);
  assert.equal(entry.seo?.description, STALE_CLOSURES_DESCRIPTION);
  assert.equal(entry.publishedAt, '2026-01-25');
  assert.equal(entry.updatedAt, '2026-08-03');

  const directAnswerWords = String(entry.description || '').trim().split(/\s+/).filter(Boolean).length;
  assert.ok(
    directAnswerWords >= 50 && directAnswerWords <= 90,
    STALE_CLOSURES_ID + ' direct answer must stay between 50 and 90 words',
  );
  assertIncludesContent(visibleContent, 'A stale closure is a bug only when a callback');
  assertIncludesContent(visibleContent, 'diagnose an async race instead');
  assert.doesNotMatch(visibleContent, /closures? (?:freeze|freezes|frozen) variables?/i);

  const answerWords = blocks
    .flatMap((block) => [
      block?.text || '',
      ...(block?.columns || []),
      ...(block?.rows || []).flat(),
      block?.caption || '',
    ])
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  assert.ok(
    answerWords >= 850 && answerWords <= 1050,
    STALE_CLOSURES_ID + ' editorial support copy must stay concise beside the interactive case files',
  );
  assert.equal(
    blocks.filter((block) => block?.type === 'code').length,
    0,
    'interactive case files own React snippets and diffs; CDN copy must not duplicate them',
  );

  const diagnosis = blocks.find(
    (block) =>
      block?.type === 'list' &&
      block.caption === 'Six case files, five callback contracts, and one important impostor',
  );
  assert.equal(
    blocks.findIndex((block) => String(block?.text || '').startsWith('## Diagnosis table\n\n')),
    0,
    'diagnosis introduction must begin the CDN editorial sequence after the interactive case files',
  );
  assert.equal(blocks.indexOf(diagnosis), 1, 'six-row diagnosis table must immediately follow its introduction');
  assert.equal(
    blocks.findIndex((block) => String(block?.text || '').startsWith('## Production code-review checklist\n\n')),
    2,
    'production checklist must immediately follow the diagnosis table',
  );
  assert.deepEqual(diagnosis?.columns, [
    'Case file',
    'Required callback contract',
    'Diagnosis',
    'Minimal safe direction',
  ]);
  assert.equal(diagnosis?.rows?.length, 6, 'diagnosis summary must contain exactly six cases');
  assertRowsCover(diagnosis, [
    'Interval counter',
    'Chat theme notification',
    'Escape listener',
    'Debounced autosave',
    'Export audit',
    'Search result ordering',
  ], 'React stale closure diagnosis summary');

  const diagnosisHtml = (diagnosis?.rows || []).flat().join('\n');
  const caseFragments = Array.from(diagnosisHtml.matchAll(/href="(#[^"]+)"/g), (match) => match[1]);
  assert.deepEqual(caseFragments, [
    '#pr-interval-counter',
    '#pr-chat-theme',
    '#pr-escape-listener',
    '#pr-debounced-autosave',
    '#pr-export-snapshot',
    '#pr-search-ordering',
  ]);
  [
    'Diagnosis table',
    'Production code-review checklist',
    'Proof beats a plausible hook name',
    'Why the tempting fixes fail',
    'React version boundary: useEffectEvent',
    'Practice the underlying decisions',
    'Source check',
    '30-second interview answer',
    'Interview follow-ups worth practicing',
  ].forEach((heading) => assertIncludesContent(visibleContent, heading));

  [
    'functional updater',
    'complete dependencies',
    'latest-value ref',
    'intentional snapshot',
    'async race, not a stale closure',
    'React 18.3.1',
    'React 19.2',
    'symmetric cleanup',
  ].forEach((contract) => assertIncludesContent(visibleContent, contract));

  [
    'React stale closure quick fix chooser',
    'React stale closure fix comparison',
    'React stale closure FAQ',
    'How to test a stale closure bug',
    'Start with the callback contract',
    'How to review the case files',
  ].forEach((removedSection) => {
    assert.ok(
      !visibleContent.includes(removedSection.toLowerCase()),
      'removed duplicate section must stay absent: ' + removedSection,
    );
  });

  const sourceBlock = blocks.find(
    (block) => block?.type === 'text' && String(block.text || '').startsWith('## Source check\n\n'),
  );
  assert.ok(sourceBlock, 'exact ## Source check section is required');

  const internalRoutes = [
    '/javascript/trivia/js-closures',
    '/react/trivia/react-useeffect-purpose',
    '/react/trivia/react-useref-vs-usestate',
    '/react/trivia/react-usememo-vs-usecallback',
    '/react/coding/react-debounced-search',
    '/react/trivia/react-strictmode-double-invoke-effects',
    '/javascript/trivia/js-async-race-conditions',
    '/react/interview-questions',
    '/guides/framework-prep/react-prep-path',
  ];
  const prerenderRoutes = fs.readFileSync(
    path.join(repoRoot, 'frontend', 'src', 'prerender.routes.txt'),
    'utf8',
  ).split(/\r?\n/).map((route) => route.trim()).filter(Boolean);

  internalRoutes.forEach((route) => {
    assert.ok(sourceHtml.includes('href="' + route + '"'), STALE_CLOSURES_ID + ' must link to ' + route);
    assert.ok(prerenderRoutes.includes(route), route + ' must be a real prerendered route');
  });
  assert.equal(
    (sourceHtml.match(/href="\/javascript\/trivia\/js-async-race-conditions"/g) || []).length,
    1,
    'preserve exactly one pre-existing clean async-race link without adding another inbound link',
  );
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
    'https://react.dev/reference/react/useRef',
  ].forEach((url) => {
    assert.ok(sourceHtml.includes('href="' + url + '"'), STALE_CLOSURES_ID + ' must cite ' + url);
  });

  const useEffectEntry = readRepoTrivia('react', 'react-useeffect-purpose');
  const closuresEntry = readRepoTrivia('javascript', 'js-closures');
  assert.ok(answerHtml(useEffectEntry).includes('href="' + STALE_CLOSURES_PATH + '"'));
  assert.ok(answerHtml(closuresEntry).includes('href="' + STALE_CLOSURES_PATH + '"'));
}

console.log('[lint-trivia-editorial-quality.test] ok');
