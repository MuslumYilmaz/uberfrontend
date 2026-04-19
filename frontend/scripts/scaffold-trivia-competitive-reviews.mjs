#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { cdnQuestionsDir, contentReviewsDir, repoRoot } from './content-paths.mjs';
import { reviewPathForTrivia } from './trivia-competitive-review-lib.mjs';

const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const CONTENT_REVIEWS_DIR = path.resolve(process.env.CONTENT_REVIEWS_DIR || contentReviewsDir);
const DEFAULT_REVIEWED_AT = String(process.env.COMPETITIVE_REVIEW_TODAY || new Date().toISOString().slice(0, 10)).trim();
const DEFAULT_REVIEWED_BY = String(process.env.COMPETITIVE_REVIEWED_BY || 'FrontendAtlas Editor').trim();

function fail(message) {
  console.error(`[scaffold-trivia-competitive-reviews] ${message}`);
  process.exit(1);
}

function displayPath(filePath) {
  const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  return relative.startsWith('..') ? filePath : relative;
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${label} could not be parsed: ${error.message}`);
  }
}

function resolveManifestPath(rawPath) {
  const input = String(rawPath || '').trim();
  if (!input) fail('usage: node scripts/scaffold-trivia-competitive-reviews.mjs <batch-manifest.json>');
  if (path.isAbsolute(input)) return input;
  return path.resolve(repoRoot, input);
}

function normalizeTextBlock(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSnippet(text) {
  const normalized = normalizeTextBlock(text);
  if (!normalized) return '';

  const sentenceMatch = normalized.match(/^(.{40,220}?[.!?])(?:\s|$)/);
  if (sentenceMatch) return sentenceMatch[1].trim();
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trimEnd()}...`;
}

function extractMeaningfulTextBlocks(entry) {
  const snippets = [];

  if (Array.isArray(entry?.answer?.blocks)) {
    entry.answer.blocks.forEach((block) => {
      if (block?.type !== 'text') return;
      const snippet = toSnippet(block?.text);
      if (snippet) snippets.push(snippet);
    });
  } else if (typeof entry?.answer === 'string') {
    const snippet = toSnippet(entry.answer);
    if (snippet) snippets.push(snippet);
  }

  if (!snippets.length) {
    const fallback = [entry?.description, entry?.title]
      .map((value) => toSnippet(value))
      .filter(Boolean);
    snippets.push(...fallback);
  }

  return snippets.slice(0, 2);
}

function findTriviaEntry(tech, contentId) {
  const triviaPath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
  if (!fs.existsSync(triviaPath)) {
    fail(`missing shipped trivia file for ${tech}:${contentId} (${displayPath(triviaPath)})`);
  }

  const entries = readJson(triviaPath, displayPath(triviaPath));
  if (!Array.isArray(entries)) {
    fail(`${displayPath(triviaPath)} must export an array of trivia entries`);
  }

  const entry = entries.find((item) => String(item?.id || '').trim() === contentId);
  if (!entry) {
    fail(`could not find trivia entry ${tech}:${contentId} in ${displayPath(triviaPath)}`);
  }

  return entry;
}

function buildCompetitorSeed(snippets, index) {
  const primary = snippets[0] || '';
  const secondary = snippets[1] || primary;

  return {
    label: `Competitor ${String.fromCharCode(65 + index)}`,
    url: [
      'https://example.com/replace-me',
      'https://example.org/replace-me',
      'https://example.net/replace-me',
    ][index],
    verdicts: {
      realWorldUseCases: 'tie',
      actionableExamples: 'tie',
      followUpConfusion: 'tie',
    },
    theirStrengths: [],
    theirGaps: [],
    ourEvidence: {
      realWorldUseCases: primary ? [primary] : [],
      actionableExamples: secondary ? [secondary] : [],
      followUpConfusion: secondary ? [secondary] : [],
    },
    theirEvidence: {
      realWorldUseCases: ['REPLACE with a short note from the competitor page about real-world use cases.'],
      actionableExamples: ['REPLACE with a short note from the competitor page about examples.'],
      followUpConfusion: ['REPLACE with a short note from the competitor page about likely follow-up confusion.'],
    },
    nextActions: {
      realWorldUseCases: ['REPLACE if the final verdict stays tie or becomes theirs.'],
      actionableExamples: ['REPLACE if the final verdict stays tie or becomes theirs.'],
      followUpConfusion: ['REPLACE if the final verdict stays tie or becomes theirs.'],
    },
  };
}

function scaffoldReview(entry, tech) {
  const snippets = extractMeaningfulTextBlocks(entry);

  return {
    contentId: String(entry?.id || '').trim(),
    tech,
    query: String(entry?.seo?.primaryKeyword || entry?.seo?.title || entry?.title || '').trim(),
    reviewedAt: DEFAULT_REVIEWED_AT,
    reviewedBy: DEFAULT_REVIEWED_BY,
    competitors: [
      buildCompetitorSeed(snippets, 0),
      buildCompetitorSeed(snippets, 1),
      buildCompetitorSeed(snippets, 2),
    ],
  };
}

function main() {
  const manifestPath = resolveManifestPath(process.argv[2]);
  if (!fs.existsSync(manifestPath)) {
    fail(`batch manifest not found: ${displayPath(manifestPath)}`);
  }

  const manifest = readJson(manifestPath, displayPath(manifestPath));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail(`batch manifest must be a JSON object: ${displayPath(manifestPath)}`);
  }

  if (!Array.isArray(manifest.items) || !manifest.items.length) {
    fail(`batch manifest items must contain at least 1 item: ${displayPath(manifestPath)}`);
  }

  let created = 0;
  let skipped = 0;

  manifest.items.forEach((item, index) => {
    const tech = String(item?.tech || '').trim();
    const contentId = String(item?.id || '').trim();
    if (!tech || !contentId) {
      fail(`batch item #${index + 1} must include tech and id in ${displayPath(manifestPath)}`);
    }

    const destination = reviewPathForTrivia(CONTENT_REVIEWS_DIR, tech, contentId);
    if (fs.existsSync(destination)) {
      skipped += 1;
      console.log(`[scaffold-trivia-competitive-reviews] skip ${displayPath(destination)} (already exists)`);
      return;
    }

    const entry = findTriviaEntry(tech, contentId);
    const review = scaffoldReview(entry, tech);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
    created += 1;
    console.log(`[scaffold-trivia-competitive-reviews] create ${displayPath(destination)}`);
  });

  console.log(`[scaffold-trivia-competitive-reviews] completed (${created} created, ${skipped} skipped).`);
}

main();
