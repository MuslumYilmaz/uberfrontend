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

function convertedDraft({
  family,
  slug,
  tech = 'frontend',
  primaryKeyword = `${slug} keyword`,
  body = '',
  competitorReviewFile = family === 'trivia' ? `content-reviews/trivia/${tech}/${slug}.json` : '',
}) {
  const competitorReviewLine = family === 'trivia'
    ? `competitor_review_file: "${competitorReviewFile}"\n`
    : '';
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
${competitorReviewLine}competitor_takeaways:
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

function editorialBlock({ family, slug, tech = 'frontend', primaryKeyword = `${slug} keyword`, draftPath, overrides = {} }) {
  return {
    draftSource: draftPath,
    primaryKeyword,
    searchIntent: `${slug} search intent`,
    readerPromise: `Help readers understand ${slug} with stronger tradeoff reasoning.`,
    uniqueAngle: `Adds an interview-aware angle for ${slug}.`,
    factCheckedAt: '2026-04-02',
    reviewedBy: 'FrontendAtlas Editor',
    ...(family === 'trivia' ? { competitorReview: `content-reviews/trivia/${tech}/${slug}.json` } : {}),
    ...overrides,
  };
}

function competitiveReview({ slug, tech, overrides = {}, competitors } = {}) {
  return {
    contentId: slug,
    tech,
    query: `${slug} interview question`,
    reviewedAt: '2026-04-03',
    reviewedBy: 'FrontendAtlas Editor',
    selection: {
      querySource: 'manual',
      greatFrontendRelevant: false,
      greatFrontendReasonIfOmitted: 'No directly relevant GreatFrontEnd page was selected for this exact shipped trivia prompt.',
    },
    competitors: competitors || [
      {
        label: 'Competitor A',
        url: 'https://example.com/competitor-a',
        category: 'tutorial_reference',
        selectionReason: 'Targets the same shipped-trivia query with a tutorial-style explanation.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'tie',
        },
        winReason: 'Our shipped trivia is stronger on real-world use cases and direct interview follow-ups.',
        theirStrengths: ['Explains the core definition.'],
        theirGaps: ['Does not connect the answer to real interview follow-ups.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
          actionableExamples: ['The event-delegation keyword appears in shipped content.'],
          followUpConfusion: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their page keeps the use case generic.'],
          actionableExamples: ['Their example stays abstract.'],
          followUpConfusion: ['They mention a follow-up briefly.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: ['Add one tighter follow-up clarification if needed.'],
        },
      },
      {
        label: 'Competitor B',
        url: 'https://docs.example.org/competitor-b',
        category: 'canonical_docs',
        selectionReason: 'Represents the canonical reference competitor for the same concept.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'theirs',
        },
        winReason: 'Our shipped trivia is more interview-directed while still giving concrete examples.',
        theirStrengths: ['Has a compact FAQ section.'],
        theirGaps: ['Skips the concrete implementation example.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
          actionableExamples: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their use case stays generic.'],
          actionableExamples: ['Their examples are not actionable.'],
          followUpConfusion: ['Their FAQ is stronger.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: ['Tighten the likely interviewer follow-up.'],
        },
      },
      {
        label: 'Competitor C',
        url: 'https://another.example.net/competitor-c',
        category: 'community_qna',
        selectionReason: 'Represents a short community Q&A competitor for the same interview prompt.',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'tie',
          followUpConfusion: 'ours',
        },
        winReason: 'Our shipped trivia keeps the production use case and likely follow-up confusion in one page.',
        theirStrengths: ['Provides one worked example.'],
        theirGaps: ['Does not explain when the answer changes.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
          actionableExamples: ['The event-delegation keyword appears in shipped content.'],
          followUpConfusion: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their use cases stay narrow.'],
          actionableExamples: ['Their example is acceptable but short.'],
          followUpConfusion: ['They skip the likely follow-up confusion.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: ['Add a second concrete example if this entry grows.'],
          followUpConfusion: [],
        },
      },
    ],
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
      CONTENT_REVIEWS_DIR: path.join(tempRoot, 'content-reviews'),
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
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-delegation.json', competitiveReview({
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
        tech: 'javascript',
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

function testMissingTriviaCompetitorReviewFails() {
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
        tech: 'javascript',
        draftPath,
        overrides: {
          competitorReview: '',
        },
      }),
      answer: {
        blocks: [{ type: 'text', text: longText('The event-delegation keyword appears in shipped content.', 30) }],
      },
    },
  ]);

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /editorial\.competitorReview is required/);
}

function testWeakTriviaCompetitiveThresholdFails() {
  const tempRoot = makeTempRoot();
  const slug = 'event-delegation';
  const draftPath = `content-drafts/trivia/${slug}.md`;
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'trivia',
    slug,
    tech: 'javascript',
  }));
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-delegation.json', competitiveReview({
    slug,
    tech: 'javascript',
    competitors: [
      {
        label: 'Competitor A',
        url: 'https://example.com/competitor-a',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'tie',
          followUpConfusion: 'theirs',
        },
        theirStrengths: ['Has better follow-up handling.'],
        theirGaps: ['Use cases are weaker.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their use cases stay generic.'],
          actionableExamples: ['Their examples are acceptable.'],
          followUpConfusion: ['Their FAQ is stronger.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: ['Add one more example.'],
          followUpConfusion: ['Expand follow-up clarity.'],
        },
      },
      {
        label: 'Competitor B',
        url: 'https://docs.example.org/competitor-b',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'tie',
        },
        theirStrengths: ['Has a short FAQ.'],
        theirGaps: ['Examples stay abstract.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
          actionableExamples: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their use cases stay generic.'],
          actionableExamples: ['Their examples are weak.'],
          followUpConfusion: ['Their FAQ is compact.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: ['Tighten follow-up wording.'],
        },
      },
      {
        label: 'Competitor C',
        url: 'https://another.example.net/competitor-c',
        verdicts: {
          realWorldUseCases: 'ours',
          actionableExamples: 'ours',
          followUpConfusion: 'ours',
        },
        theirStrengths: ['Has one worked example.'],
        theirGaps: ['Skips likely follow-ups.'],
        ourEvidence: {
          realWorldUseCases: ['The event-delegation keyword appears in shipped content.'],
          actionableExamples: ['The event-delegation keyword appears in shipped content.'],
          followUpConfusion: ['The event-delegation keyword appears in shipped content.'],
        },
        theirEvidence: {
          realWorldUseCases: ['Their use cases stay narrow.'],
          actionableExamples: ['Their example is acceptable.'],
          followUpConfusion: ['They skip the likely follow-up confusion.'],
        },
        nextActions: {
          realWorldUseCases: [],
          actionableExamples: [],
          followUpConfusion: [],
        },
      },
    ],
  }));
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [
    {
      id: slug,
      title: 'Event delegation',
      description: 'Event delegation description',
      editorial: editorialBlock({
        family: 'trivia',
        slug,
        tech: 'javascript',
        draftPath,
      }),
      answer: {
        blocks: [{ type: 'text', text: longText('The event-delegation keyword appears in shipped content.', 30) }],
      },
    },
  ]);

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /only gives us 1\/3 wins/);
}

function testRelevantGreatFrontendOmissionFailsForConvertedTrivia() {
  const tempRoot = makeTempRoot();
  const slug = 'event-delegation';
  const draftPath = `content-drafts/trivia/${slug}.md`;
  writeFile(tempRoot, draftPath, convertedDraft({
    family: 'trivia',
    slug,
    tech: 'javascript',
  }));
  writeJson(tempRoot, 'content-reviews/trivia/javascript/event-delegation.json', competitiveReview({
    slug,
    tech: 'javascript',
    overrides: {
      selection: {
        querySource: 'manual',
        greatFrontendRelevant: true,
      },
    },
  }));
  writeJson(tempRoot, 'cdn/questions/javascript/trivia.json', [
    {
      id: slug,
      title: 'Event delegation',
      description: 'Event delegation description',
      editorial: editorialBlock({
        family: 'trivia',
        slug,
        tech: 'javascript',
        draftPath,
      }),
      answer: {
        blocks: [{ type: 'text', text: longText('The event-delegation keyword appears in shipped content.', 30) }],
      },
    },
  ]);

  const failure = expectFailure(tempRoot);
  assert.match(String(failure.stderr || ''), /GreatFrontEnd is marked relevant but no greatfrontend\.com competitor is present/);
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
testMissingTriviaCompetitorReviewFails();
testWeakTriviaCompetitiveThresholdFails();
testRelevantGreatFrontendOmissionFailsForConvertedTrivia();
testThinShippedSystemDesignFails();
testMissingPrimaryKeywordInShippedContentFails();

console.log('[lint-shipped-draft-parity.test] ok');
