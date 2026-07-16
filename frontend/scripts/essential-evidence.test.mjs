#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const collectionPath = path.resolve(
  frontendRoot,
  '..',
  'cdn',
  'questions',
  'collections',
  'frontend-essential-60.json',
);

const collection = JSON.parse(await fs.readFile(collectionPath, 'utf8'));
const expectedSources = [
  ['GreatFrontEnd GFE 75', 'https://www.greatfrontend.com/interviews/gfe75'],
  [
    'Front End Interview Handbook: JavaScript coding',
    'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function',
  ],
  [
    'Front End Interview Handbook: UI machine coding',
    'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces',
  ],
  [
    'Front End Interview Handbook: frontend system design',
    'https://www.frontendinterviewhandbook.com/front-end-system-design',
  ],
  ['BFE JavaScript questions', 'https://bigfrontend.dev/problem?sort=oldest&tags=JavaScript'],
];

assert.equal(collection.updatedAt, '2026-04-23', 'Essential must expose its canonical collection update date');
assert.deepEqual(
  collection.benchmarkSources.map(({ label, url }) => [label, url]),
  expectedSources,
  'Essential must retain the five named coverage references and their actual URLs',
);
assert.equal(
  new Set(collection.benchmarkSources.map(({ url }) => url)).size,
  expectedSources.length,
  'Essential coverage reference URLs must be unique',
);

console.log('[essential-evidence] canonical date and five coverage references passed');
