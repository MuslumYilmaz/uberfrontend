#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-shipped-draft-parity.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'shipped-draft-parity-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function longText(seed, count = 40) {
  return Array.from({ length: count }, () => seed).join(' ');
}

function yamlArray(items) {
  return items.map((item) => `  - "${String(item || '').replace(/"/g, '\\"')}"`).join('\n');
}

function convertedDraft({ family, slug, tech = 'frontend', primaryKeyword = `${slug} keyword`, body = '' }) {
  return `---
title: "${slug} title"
slug: "${slug}"
family: "${family}"
tech: "${tech}"
audience: "Readers"
intent: "Teach the concept."
target_words: 1200
primary_keyword: "${primaryKeyword}"
status: "converted"
notes_for_conversion:
  - "Ship it."
search_intent: "${slug} search intent"
reader_promise: "Help readers understand ${slug} with stronger tradeoff reasoning."
unique_angle: "Adds an interview-aware angle for ${slug}."
what_this_adds_beyond_basics: "Shows how ${slug} changes under real constraints."
competitor_query: "${slug} query"
competitor_takeaways:
  - "Competitors cover the basics."
  - "Competitors include one example."
competitor_gaps:
  - "Competitors skip interview framing."
  - "Competitors skip failure-mode language."
sources:
  - "https://example.com/source-one"
last_fact_checked_at: "2026-04-01"
reviewed_by: "FrontendAtlas Editor"
confidence: "high"
---

# Body

${body || longText(`The ${slug} draft keeps the ${primaryKeyword} concept concrete with examples, tradeoffs, and interviewer signals.`, 60)}
`;
}

function editorialBlock({ family, slug, primaryKeyword = `${slug} keyword`, draftPath, overrides = {} }) {
  return {
    draftSource: draftPath,
    primaryKeyword,
    searchIntent: `${slug} search intent`,
    readerPromise: `Help readers understand ${slug} with stronger tradeoff reasoning.`,
    uniqueAngle: `Adds an interview-aware angle for ${slug}.`,
    factCheckedAt: '2026-04-02',
    reviewedBy: 'FrontendAtlas Editor',
    ...overrides,
  };
}

function runLinter(tempRoot) {
  return execFileSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      CONTENT_DRAFTS_DIR: path.join(tempRoot, 'content-drafts'),
      CDN_INCIDENTS_DIR: path.join(tempRoot, 'cdn', 'incidents'),
      CDN_TRADEOFF_BATTLES_DIR: path.join(tempRoot, 'cdn', 'tradeoff-battles'),
      CDN_QUESTIONS_DIR: path.join(tempRoot, 'cdn', 'questions'),
    },
    stdio: 'pipe',
  });
}

function expectFailure(tempRoot) {
  try {
    runLinter(tempRoot);
    assert.fail('Expected lint-shipped-draft-parity to fail');
  } catch (error) {
    return error;
  }
}

function testMissingShippedFileFails() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'content-drafts/incidents/search-lag.md', convertedDraft({
    family: 'incident',
    slug: 'search-lag',
    tech: 'react',
  }));

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /missing editorial block|no shipped target could be resolved|scenario\.json/);
}

function testMissingEditorialBlockFails() {
  const tempRoot = makeTempRoot();
  const draftPath = 'content-drafts/tradeoff-battles/input-battle.md';
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'tradeoff-battle',
    slug: 'input-battle',
    tech: 'react',
  }));
  writeJson(tempRoot, 'cdn/tradeoff-battles/input-battle/scenario.json', {
    meta: { id: 'input-battle', title: 'Input battle' },
    scenario: longText('Controlled vs uncontrolled.', 20),
    prompt: 'Which would you choose?',
  });

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /missing editorial block/);
}

function testMetadataMismatchFails() {
  const tempRoot = makeTempRoot();
  const slug = 'event-delegation';
  const draftPath = `content-drafts/trivia/${slug}.md`;
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'trivia',
    slug,
    tech: 'javascript',
  }));
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [
    {
      id: slug,
      title: 'Event delegation',
      description: 'Event delegation description',
      editorial: editorialBlock({
        family: 'trivia',
        slug,
        draftPath,
        overrides: {
          readerPromise: 'Different promise entirely.',
        },
      }),
      answer: {
        blocks: [{ type: 'text', text: longText('The event-delegation keyword appears in shipped content.', 30) }],
      },
    },
  ]);

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /editorial\.readerPromise does not match the draft/);
}

function testThinShippedSystemDesignFails() {
  const tempRoot = makeTempRoot();
  const slug = 'radio-framework';
  const primaryKeyword = 'radio framework keyword';
  const draftPath = `content-drafts/system-design/${slug}.md`;
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'system-design',
    slug,
    primaryKeyword,
    body: longText(`The ${primaryKeyword} draft is intentionally detailed and rich with architecture reasoning.`, 120),
  }));
  writeJson(tempRoot, `cdn/questions/system-design/${slug}/meta.json`, {
    id: slug,
    title: 'Radio framework',
    description: 'System design description',
    editorial: editorialBlock({
      family: 'system-design',
      slug,
      primaryKeyword,
      draftPath,
    }),
    updatedAt: '2026-04-02',
  });
  writeJson(tempRoot, `cdn/questions/system-design/${slug}/requirements.json`, {
    title: 'Requirements',
    body: 'Short content only.',
  });

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /shipped content is too thin vs draft/);
}

function testMissingPrimaryKeywordInShippedContentFails() {
  const tempRoot = makeTempRoot();
  const slug = 'search-lag';
  const primaryKeyword = 'search lag keyword';
  const draftPath = `content-drafts/incidents/${slug}.md`;
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'incident',
    slug,
    tech: 'react',
    primaryKeyword,
  }));
  writeJson(tempRoot, `cdn/incidents/${slug}/scenario.json`, {
    editorial: editorialBlock({
      family: 'incident',
      slug,
      primaryKeyword,
      draftPath,
    }),
    meta: {
      id: slug,
      title: 'Search lag incident',
      summary: 'Typing feels delayed because too much work happens on each change.',
    },
    context: {
      symptom: 'Typing feels delayed.',
      evidence: [{ type: 'metric', body: 'Latency grows after three characters.' }],
    },
    stages: [{ id: 'one', title: 'Stage', prompt: 'Inspect the handler.' }],
    debrief: {
      scoreBands: [],
      idealRunbook: ['Profile first.'],
      teachingBlocks: ['Focus on synchronous work.'],
    },
    relatedPractice: [],
  });

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /shipped content does not contain the draft primary keyword/);
}

testMissingShippedFileFails();
testMissingEditorialBlockFails();
testMetadataMismatchFails();
testThinShippedSystemDesignFails();
testMissingPrimaryKeywordInShippedContentFails();

console.log('[lint-shipped-draft-parity.test] ok');
