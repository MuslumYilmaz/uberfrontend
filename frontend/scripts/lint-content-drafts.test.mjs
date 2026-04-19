#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-content-drafts.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'content-drafts-lint-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function longText(seed, count = 7) {
  return Array.from({ length: count }, () => seed).join(' ');
}

function yamlStringArray(items) {
  return (Array.isArray(items) ? items : []).map((item) => `  - "${String(item || '').replace(/"/g, '\\"')}"`).join('\n');
}

function buildTriviaDraft(status, options = {}) {
  const frontmatter = {
    title: 'Event Delegation in JavaScript Interviews',
    slug: 'event-delegation',
    family: 'trivia',
    tech: 'javascript',
    audience: 'Frontend engineers preparing for interview rounds',
    intent: 'Help the reader explain event delegation clearly and with the right tradeoff boundary.',
    target_words: 700,
    primary_keyword: 'event delegation',
    status,
    notes_for_conversion: ['Convert into the matching trivia entry in cdn/questions/javascript/trivia.json.'],
    search_intent: 'event delegation javascript interview answer',
    reader_promise: 'Help the reader explain event delegation clearly, when it wins, and when direct listeners stay simpler.',
    unique_angle: 'Frames event delegation as an interview tradeoff instead of a generic performance slogan.',
    what_this_adds_beyond_basics: 'Explains the boundary cases and the maintainability reasoning interviewers actually care about.',
    competitor_query: 'event delegation javascript interview question',
    competitor_review_file: 'content-reviews/trivia/javascript/event-delegation.json',
    competitor_takeaways: ['Competing pages explain bubbling and parent listeners.', 'Most pages include a simple todo-list example.'],
    competitor_gaps: ['Most pages do not explain when direct listeners are still better.', 'Most pages overclaim performance instead of discussing maintainability.'],
    sources: ['https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling'],
    last_fact_checked_at: '2026-04-01',
    reviewed_by: 'FrontendAtlas Editor',
    confidence: 'high',
    ...(options.frontmatter || {}),
  };
  const extraBody = options.extraBody || '';
  return `---
title: "${frontmatter.title}"
slug: "${frontmatter.slug}"
family: "${frontmatter.family}"
tech: "${frontmatter.tech}"
audience: "${frontmatter.audience}"
intent: "${frontmatter.intent}"
target_words: ${frontmatter.target_words}
primary_keyword: "${frontmatter.primary_keyword}"
status: "${frontmatter.status}"
notes_for_conversion:
${yamlStringArray(frontmatter.notes_for_conversion)}
search_intent: "${frontmatter.search_intent}"
reader_promise: "${frontmatter.reader_promise}"
unique_angle: "${frontmatter.unique_angle}"
what_this_adds_beyond_basics: "${frontmatter.what_this_adds_beyond_basics}"
competitor_query: "${frontmatter.competitor_query}"
competitor_review_file: "${frontmatter.competitor_review_file}"
competitor_takeaways:
${yamlStringArray(frontmatter.competitor_takeaways)}
competitor_gaps:
${yamlStringArray(frontmatter.competitor_gaps)}
sources:
${yamlStringArray(frontmatter.sources)}
last_fact_checked_at: "${frontmatter.last_fact_checked_at}"
reviewed_by: "${frontmatter.reviewed_by}"
confidence: "${frontmatter.confidence}"
---

# Question

${longText('What is event delegation in JavaScript, and when is it the better answer than attaching a listener to every row action button?', 3)}

# Short Answer

${longText('Event delegation attaches one listener to a stable parent and uses event bubbling to react to matching child targets, which keeps dynamic lists easier to manage and reduces repeated listener wiring.', 3)}

# Deeper Explanation

${longText('A strong answer explains that event delegation works best when rows are added, removed, or reordered often, because the parent listener keeps working without rebinding each child after every render or DOM mutation.', 4)}

# Example

${longText('A table body listener can inspect the clicked element, confirm it matches a delete button selector, and then read the row id from a data attribute before performing the action.', 4)}

# Common Pitfall

${longText('Weak answers say event delegation is always faster, but the real point is maintainability and dynamic DOM support; some events do not bubble cleanly, and overly broad parent listeners can become messy.', 4)}
${extraBody}

# Follow-Up

${longText('If the interviewer asks when direct listeners are still reasonable, explain that stable small UIs with isolated controls can stay explicit, readable, and simpler with direct binding.', 4)}
`;
}

function buildSystemDesignDraft(status, overrides = {}) {
  const frontmatter = {
    title: 'Frontend Radio Framework',
    slug: 'frontend-radio-framework',
    family: 'system-design',
    tech: 'frontend',
    audience: 'Frontend engineers preparing for system design rounds',
    intent: 'Help the reader explain frontend system design answers with sharper tradeoff framing.',
    target_words: 1400,
    primary_keyword: 'frontend radio framework',
    status,
    notes_for_conversion: ['Convert into the matching system-design bundle.'],
    search_intent: 'how to answer frontend system design interview questions',
    reader_promise: 'Help the reader structure a frontend system design answer with clear requirement, architecture, and tradeoff boundaries.',
    unique_angle: 'Explains the framework through interview scoring signals instead of generic architecture slogans.',
    what_this_adds_beyond_basics: 'Shows how requirement framing changes architecture answers under interview pressure.',
    competitor_query: 'frontend system design interview framework',
    competitor_takeaways: ['Competing pages explain generic steps.', 'Most pages cover architecture at a high level.'],
    competitor_gaps: ['Most pages do not connect the framework to interviewer signals.', 'Most pages skip concrete failure-mode language.'],
    sources: ['https://web.dev/articles/rendering-patterns', 'https://developer.mozilla.org/en-US/docs/Web/Performance'],
    last_fact_checked_at: '2026-04-01',
    reviewed_by: 'FrontendAtlas Editor',
    confidence: 'high',
    ...overrides,
  };
  return `---
title: "${frontmatter.title}"
slug: "${frontmatter.slug}"
family: "${frontmatter.family}"
tech: "${frontmatter.tech}"
audience: "${frontmatter.audience}"
intent: "${frontmatter.intent}"
target_words: ${frontmatter.target_words}
primary_keyword: "${frontmatter.primary_keyword}"
status: "${frontmatter.status}"
notes_for_conversion:
${yamlStringArray(frontmatter.notes_for_conversion)}
search_intent: "${frontmatter.search_intent}"
reader_promise: "${frontmatter.reader_promise}"
unique_angle: "${frontmatter.unique_angle}"
what_this_adds_beyond_basics: "${frontmatter.what_this_adds_beyond_basics}"
competitor_query: "${frontmatter.competitor_query}"
competitor_takeaways:
${yamlStringArray(frontmatter.competitor_takeaways)}
competitor_gaps:
${yamlStringArray(frontmatter.competitor_gaps)}
sources:
${yamlStringArray(frontmatter.sources)}
last_fact_checked_at: "${frontmatter.last_fact_checked_at}"
reviewed_by: "${frontmatter.reviewed_by}"
confidence: "${frontmatter.confidence}"
---

# Prompt

${longText('Design a frontend system for a data-heavy analytics dashboard that balances clarity, rendering cost, and interview communication.', 4)}

# Clarifying Questions

${longText('A strong answer asks about user roles, data freshness, scale expectations, accessibility requirements, and performance budgets before drawing architecture.', 4)}

# Architecture

${longText('The answer should separate rendering boundaries, caching, API contracts, client state, and incremental rollout concerns so the interviewer can follow the reasoning.', 6)}

# Tradeoffs

${longText('Tradeoffs should compare client rendering, server rendering, stale-data tolerance, and optimistic interaction paths with explicit reasoning for each choice.', 5)}

# Failure Modes

${longText('Call out stale cache, race conditions, loading collapse, accessibility regressions, and noisy dashboards that break under partial data or weak devices.', 5)}

# Metrics

${longText('Define success through responsiveness, task completion, data freshness, and regression signals such as interaction latency and rendering budget drift.', 4)}

# Rollout

${longText('Ship the critical path first, add measurement early, and widen the architecture only after the reliability and usage signals are stable.', 4)}
`;
}

function runLinter(tempRoot) {
  return execFileSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    env: {
      ...process.env,
      CONTENT_DRAFTS_DIR: tempRoot,
    },
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function runFailureCase(tempRoot) {
  try {
    runLinter(tempRoot);
    assert.fail('Expected lint-content-drafts to fail');
  } catch (error) {
    return error;
  }
}

function runLinterDetailed(tempRoot) {
  return spawnSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    env: {
      ...process.env,
      CONTENT_DRAFTS_DIR: tempRoot,
    },
    encoding: 'utf8',
  });
}

function testApprovedDraftPasses() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved'));
  const output = runLinter(tempRoot);
  assert.match(output, /1 file\(s\) checked/);
}

function testEditingDraftWarnsButPasses() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('editing', {
    frontmatter: {
      sources: [],
      last_fact_checked_at: '',
      reviewed_by: '',
      confidence: '',
      competitor_takeaways: ['Competing pages explain the core concept.'],
      competitor_gaps: ['Most pages miss the tradeoff boundary.'],
    },
    extraBody: '\nVERIFY: confirm the exact browser edge case before publishing.\n',
  }));
  const output = runLinter(tempRoot);
  assert.match(output, /1 file\(s\) checked/);
}

function testApprovedDraftFailsWithVerifyMarker() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    extraBody: '\nVERIFY: confirm the exact browser edge case before publishing.\n',
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /contains unresolved VERIFY markers/);
}

function testOutlineDraftFailsWithoutEditorialIntentFields() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('outline', {
    frontmatter: {
      search_intent: '',
      reader_promise: '',
      unique_angle: '',
      what_this_adds_beyond_basics: '',
      competitor_query: '',
    },
  }));
  const failure = runFailureCase(tempRoot);
  const stderr = String(failure.stderr || '');
  assert.match(stderr, /frontmatter "search_intent" must be a non-empty string for outline drafts/);
  assert.match(stderr, /frontmatter "reader_promise" must be a non-empty string for outline drafts/);
  assert.match(stderr, /frontmatter "unique_angle" must be a non-empty string for outline drafts/);
}

function testApprovedDraftFailsWithoutSources() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    frontmatter: {
      sources: [],
    },
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /frontmatter sources must contain at least 1 public source/);
}

function testApprovedDraftFailsWithInvalidFactCheckDate() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    frontmatter: {
      last_fact_checked_at: '2026-99-99',
    },
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /frontmatter last_fact_checked_at must use YYYY-MM-DD/);
}

function testApprovedDraftFailsWithInvalidConfidence() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    frontmatter: {
      confidence: 'certain',
    },
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /frontmatter confidence must be one of/);
}

function testApprovedDraftFailsWithWeakCompetitorBrief() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    frontmatter: {
      competitor_takeaways: ['Competing pages explain bubbling.'],
      competitor_gaps: ['Most pages miss direct-listener tradeoffs.'],
    },
  }));
  const failure = runFailureCase(tempRoot);
  const stderr = String(failure.stderr || '');
  assert.match(stderr, /frontmatter competitor_takeaways must contain at least 2 non-empty items/);
  assert.match(stderr, /frontmatter competitor_gaps must contain at least 2 non-empty items/);
}

function testEditingTriviaDraftWarnsWithoutCompetitorReviewFile() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('editing', {
    frontmatter: {
      competitor_review_file: '',
    },
  }));
  const result = runLinterDetailed(tempRoot);
  assert.equal(result.status, 0);
  assert.match(String(result.stderr || ''), /frontmatter competitor_review_file is required for trivia editing\/approved\/converted drafts/);
}

function testApprovedTriviaDraftFailsWithoutCompetitorReviewFile() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'trivia/event-delegation.md', buildTriviaDraft('approved', {
    frontmatter: {
      competitor_review_file: '',
    },
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /frontmatter competitor_review_file is required for trivia editing\/approved\/converted drafts/);
}

function testSystemDesignDraftRequiresTwoSources() {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'system-design/frontend-radio-framework.md', buildSystemDesignDraft('approved', {
    sources: ['https://web.dev/articles/rendering-patterns'],
  }));
  const failure = runFailureCase(tempRoot);
  assert.match(String(failure.stderr || ''), /frontmatter sources must contain at least 2 public source\(s\) for system-design drafts/);
}

testApprovedDraftPasses();
testEditingDraftWarnsButPasses();
testApprovedDraftFailsWithVerifyMarker();
testOutlineDraftFailsWithoutEditorialIntentFields();
testApprovedDraftFailsWithoutSources();
testApprovedDraftFailsWithInvalidFactCheckDate();
testApprovedDraftFailsWithInvalidConfidence();
testApprovedDraftFailsWithWeakCompetitorBrief();
testEditingTriviaDraftWarnsWithoutCompetitorReviewFile();
testApprovedTriviaDraftFailsWithoutCompetitorReviewFile();
testSystemDesignDraftRequiresTwoSources();

console.log('[lint-content-drafts.test] ok');
