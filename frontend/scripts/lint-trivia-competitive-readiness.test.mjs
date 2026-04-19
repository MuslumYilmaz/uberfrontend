#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-trivia-competitive-readiness.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trivia-competitive-readiness-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function triviaEntry(overrides = {}) {
  return {
    id: 'event-loop',
    title: 'Explain the JavaScript Event Loop',
    description: 'The event loop decides when microtasks, timers, and rendering get time, which is why queue ordering causes real production debugging issues.',
    type: 'trivia',
    technology: 'javascript',
    difficulty: 'hard',
    tags: ['event-loop', 'async'],
    importance: 5,
    updatedAt: '2026-04-04',
    answer: {
      blocks: [
        {
          type: 'text',
          text: 'The event loop matters when you debug async UI behavior. A long microtask chain can still starve rendering, which is the real production pitfall.',
        },
        {
          type: 'text',
          text: 'A strong answer compares microtasks, macrotasks, and paint timing, then shows how the order changes the visible UI behavior.',
        },
      ],
    },
    ...overrides,
  };
}

function reviewCompetitor({
  label = 'Competitor A',
  url = 'https://example.com/event-loop-a',
  category = 'tutorial_reference',
  selectionReason = 'Targets the same event-loop debugging query with explanatory examples.',
  verdicts = {
    realWorldUseCases: 'ours',
    actionableExamples: 'ours',
    followUpConfusion: 'tie',
  },
  winReason = 'Our page connects queue ordering to UI debugging more directly while still giving practical examples.',
  theirStrengths = ['Explains the baseline definition.'],
  theirGaps = ['Does not connect queue ordering to actual UI debugging.'],
  ourEvidence = {
    realWorldUseCases: ['The event loop matters when you debug async UI behavior.'],
    actionableExamples: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
    followUpConfusion: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
  },
  theirEvidence = {
    realWorldUseCases: ['Their page keeps the use case generic.'],
    actionableExamples: ['Their example is shorter.'],
    followUpConfusion: ['They mention a common follow-up briefly.'],
  },
  nextActions = {
    realWorldUseCases: [],
    actionableExamples: [],
    followUpConfusion: ['Add one tighter follow-up explanation about rendering starvation.'],
  },
} = {}) {
  return {
    label,
    url,
    category,
    selectionReason,
    verdicts,
    theirStrengths,
    theirGaps,
    ourEvidence,
    theirEvidence,
    nextActions,
    ...(Object.values(verdicts).filter((value) => value === 'ours').length >= 2 ? { winReason } : {}),
  };
}

function competitiveReview(overrides = {}) {
  return {
    contentId: 'event-loop',
    tech: 'javascript',
    query: 'javascript event loop interview question',
    reviewedAt: '2026-04-05',
    reviewedBy: 'FrontendAtlas Editor',
    selection: {
      querySource: 'seo_primary_keyword',
      greatFrontendRelevant: false,
      greatFrontendReasonIfOmitted: 'No directly relevant GreatFrontEnd page was selected for this exact event-loop debugging query.',
    },
    competitors: [
      reviewCompetitor(),
      reviewCompetitor({
        label: 'Competitor B',
        url: 'https://docs.example.org/event-loop-b',
        category: 'canonical_docs',
        selectionReason: 'Serves as the canonical reference competitor for the same concept.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'theirs',
        },
        theirStrengths: ['Has a compact FAQ section.'],
        theirGaps: ['Examples stay abstract.'],
        ourEvidence: {
          realWorldUseCases: ['The event loop matters when you debug async UI behavior.'],
          actionableExamples: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their page keeps the use case generic.'],
          actionableExamples: ['Their example is shorter.'],
          followUpConfusion: ['Their FAQ is stronger.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: ['Tighten the follow-up section.'],
        },
      }),
      reviewCompetitor({
        label: 'Competitor C',
        url: 'https://another.example.net/event-loop-c',
        category: 'community_qna',
        selectionReason: 'Represents a concise Q&A competitor for the same interview intent.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'tie',
          followUpConfusion: 'ours',
        },
        winReason: 'Our page covers the production use case and the likely next confusion in a single compact answer.',
        theirStrengths: ['Has one worked example.'],
        theirGaps: ['Does not clarify the likely next confusion.'],
        ourEvidence: {
          realWorldUseCases: ['The event loop matters when you debug async UI behavior.'],
          actionableExamples: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
          followUpConfusion: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their page uses a generic use case.'],
          actionableExamples: ['Their example is acceptable but short.'],
          followUpConfusion: ['They skip the follow-up confusion.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: ['Add a second concrete example if this entry grows.'],
          followUpConfusion: [],
        },
      }),
    ],
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
      CONTENT_REVIEWS_DIR: path.join(tempRoot, 'content-reviews'),
      COMPETITIVE_REVIEW_TODAY: '2026-04-05',
    },
  });
}

function testImportanceFiveWithoutReviewWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /missing-competitor-review=1/);
}

function testImportanceFourWithoutReviewDoesNotWarn() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [
    triviaEntry({
      id: 'importance-four',
      importance: 4,
      updatedAt: '2026-04-04',
    }),
  ]);
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /missing-competitor-review/);
}

function testInvalidJsonFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeFile(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', '{ invalid json }\n');
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /could not be parsed/);
}

function testMissingOurEvidenceSnippetFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        ourEvidence: {
          realWorldUseCases: ['This sentence is not in shipped content.'],
          actionableExamples: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
          followUpConfusion: ['A strong answer compares microtasks, macrotasks, and paint timing.'],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ourEvidence\.realWorldUseCases does not appear in shipped trivia text/);
}

function testMissingTheirEvidenceFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        theirEvidence: {
          realWorldUseCases: ['Their page keeps the use case generic.'],
          actionableExamples: ['Their example is shorter.'],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /theirEvidence\.followUpConfusion must contain at least 1 note/);
}

function testMissingNextActionsWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'tie',
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: [],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /missing-next-actions=1/);
}

function testThresholdWarningAppears() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'tie',
          followUpConfusion: 'theirs',
        },
        winReason: undefined,
        ourEvidence: {
          realWorldUseCases: ['The event loop matters when you debug async UI behavior.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their page keeps the use case generic.'],
          actionableExamples: ['Their examples are acceptable.'],
          followUpConfusion: ['Their FAQ is stronger.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: ['Add a second example.'],
          followUpConfusion: ['Expand the follow-up explanation.'],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /competitor-threshold-not-met=1/);
}

function testReviewOlderThanUpdatedAtWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    reviewedAt: '2026-04-01',
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /review-older-than-content=1/);
}

function testLegacyGreatFrontendGapWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    selection: {
      querySource: 'manual',
      greatFrontendRelevant: true,
    },
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /missing-greatfrontend-competitor=1/);
}

function testGreatFrontendOmissionReasonMissingFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    selection: {
      querySource: 'manual',
      greatFrontendRelevant: false,
      greatFrontendReasonIfOmitted: '',
    },
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /greatFrontendReasonIfOmitted is required/);
}

function testMissingCategoryFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        category: '',
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /category must be one of/);
}

function testMissingSelectionReasonFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor({
        selectionReason: '',
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /selectionReason is required/);
}

function testMissingWinReasonFails() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  const competitor = reviewCompetitor();
  delete competitor.winReason;
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [competitor],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /winReason is required when we claim at least 2\/3 wins/);
}

function testOverconfidentCalibrationWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    competitors: [
      reviewCompetitor(),
      reviewCompetitor({
        label: 'Competitor B',
        url: 'https://docs.example.org/event-loop-b',
        category: 'canonical_docs',
        selectionReason: 'Same query but canonical reference coverage.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'ours',
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: [],
        },
      }),
      reviewCompetitor({
        label: 'Competitor C',
        url: 'https://forum.example.net/event-loop-c',
        category: 'community_qna',
        selectionReason: 'Same query represented as a short Q&A competitor.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'tie',
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: ['Add one tighter note about rendering starvation.'],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /overconfident-review-calibration=1/);
}

function testHardCompetitorSweepWarns() {
  const tempRoot = makeTempRoot();
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [triviaEntry()]);
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-loop.json', competitiveReview({
    selection: {
      querySource: 'manual',
      greatFrontendRelevant: true,
    },
    competitors: [
      reviewCompetitor({
        label: 'GreatFrontEnd Event Loop',
        url: 'https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-a-microtask-queue',
        category: 'interview_prep',
        selectionReason: 'Targets the same JavaScript interview concept in a quiz format.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'ours',
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: [],
        },
      }),
    ],
  }));
  const result = runLinter(tempRoot);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /hard-competitor-clean-sweep=1/);
}

testImportanceFiveWithoutReviewWarns();
testImportanceFourWithoutReviewDoesNotWarn();
testInvalidJsonFails();
testMissingOurEvidenceSnippetFails();
testMissingTheirEvidenceFails();
testMissingNextActionsWarns();
testThresholdWarningAppears();
testReviewOlderThanUpdatedAtWarns();
testLegacyGreatFrontendGapWarns();
testGreatFrontendOmissionReasonMissingFails();
testMissingCategoryFails();
testMissingSelectionReasonFails();
testMissingWinReasonFails();
testOverconfidentCalibrationWarns();
testHardCompetitorSweepWarns();

console.log('[lint-trivia-competitive-readiness.test] ok');
