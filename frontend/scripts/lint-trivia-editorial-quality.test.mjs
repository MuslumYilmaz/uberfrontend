#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-trivia-editorial-quality.mjs');

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

console.log('[lint-trivia-editorial-quality.test] ok');
