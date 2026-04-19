#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const SCRIPT_PATH = path.join(repoRoot, 'frontend', 'scripts', 'scaffold-trivia-competitive-reviews.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trivia-competitive-scaffold-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function runScaffold(tempRoot, manifestRelativePath) {
  return spawnSync('node', [SCRIPT_PATH, path.join(tempRoot, manifestRelativePath)], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      CDN_QUESTIONS_DIR: path.join(tempRoot, 'cdn', 'questions'),
      CONTENT_REVIEWS_DIR: path.join(tempRoot, 'content-reviews'),
      COMPETITIVE_REVIEW_TODAY: '2026-04-05',
      COMPETITIVE_REVIEWED_BY: 'Test Reviewer',
    },
  });
}

function sampleTriviaEntry() {
  return {
    id: 'js-closures',
    title: 'JavaScript Closures',
    description: 'Closures matter when callbacks or factories keep access to outer variables, which is why stale state and memory retention show up in production bugs.',
    technology: 'javascript',
    type: 'trivia',
    difficulty: 'medium',
    importance: 5,
    updatedAt: '2026-04-04',
    answer: {
      blocks: [
        {
          type: 'text',
          text: 'Closures become a real production debugging problem when event handlers or async callbacks capture stale values from an older render or loop iteration.',
        },
        {
          type: 'text',
          text: 'A stronger explanation shows the fix too: move the changing value into the right scope, create a fresh function, or store mutable state somewhere intentional.',
        },
        {
          type: 'list',
          items: ['Not used for scaffold evidence selection.'],
        },
      ],
    },
  };
}

function testCreatesMissingReviewFile() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [sampleTriviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/batches/batch-01.json', {
    batchId: 'batch-01',
    scope: 'trivia competitor review backfill',
    items: [{ tech: 'javascript', id: 'js-closures' }],
  });

  const result = runScaffold(tempRoot, 'content-reviews/trivia/batches/batch-01.json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /completed \(1 created, 0 skipped\)/);

  const review = readJson(tempRoot, 'content-reviews/trivia/javascript/js-closures.json');
  assert.equal(review.contentId, 'js-closures');
  assert.equal(review.tech, 'javascript');
  assert.equal(review.reviewedAt, '2026-04-05');
  assert.equal(review.reviewedBy, 'Test Reviewer');
  assert.equal(review.competitors.length, 3);
}

function testDoesNotOverwriteExistingReviewFile() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [sampleTriviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/batches/batch-01.json', {
    batchId: 'batch-01',
    scope: 'trivia competitor review backfill',
    items: [{ tech: 'javascript', id: 'js-closures' }],
  });
  writeJson(tempRoot, 'content-reviews/trivia/javascript/js-closures.json', {
    contentId: 'js-closures',
    preserved: true,
  });

  const result = runScaffold(tempRoot, 'content-reviews/trivia/batches/batch-01.json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /completed \(0 created, 1 skipped\)/);

  const review = readJson(tempRoot, 'content-reviews/trivia/javascript/js-closures.json');
  assert.deepEqual(review, {
    contentId: 'js-closures',
    preserved: true,
  });
}

function testSeedsInitialEvidenceFromTextBlocks() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [sampleTriviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/batches/batch-01.json', {
    batchId: 'batch-01',
    scope: 'trivia competitor review backfill',
    items: [{ tech: 'javascript', id: 'js-closures' }],
  });

  const result = runScaffold(tempRoot, 'content-reviews/trivia/batches/batch-01.json');
  assert.equal(result.status, 0);

  const review = readJson(tempRoot, 'content-reviews/trivia/javascript/js-closures.json');
  assert.deepEqual(
    review.competitors[0].ourEvidence.realWorldUseCases,
    ['Closures become a real production debugging problem when event handlers or async callbacks capture stale values from an older render or loop iteration.'],
  );
  assert.deepEqual(
    review.competitors[0].ourEvidence.actionableExamples,
    ['A stronger explanation shows the fix too: move the changing value into the right scope, create a fresh function, or store mutable state somewhere intentional.'],
  );
}

function testInvalidManifestFails() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'content-reviews/trivia/batches/bad.json', '{ invalid json }\n');
  const result = runScaffold(tempRoot, 'content-reviews/trivia/batches/bad.json');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /could not be parsed/);
}

testCreatesMissingReviewFile();
testDoesNotOverwriteExistingReviewFile();
testSeedsInitialEvidenceFromTextBlocks();
testInvalidManifestFails();

console.log('[scaffold-trivia-competitive-reviews.test] ok');
