#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { cdnQuestionsDir, contentReviewsDir, repoRoot } from './content-paths.mjs';
import {
  collectTriviaText,
  normalizeRepoRelativePath,
  reviewPathForTrivia,
  validateCompetitiveReview,
} from './trivia-competitive-review-lib.mjs';

const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const CONTENT_REVIEWS_DIR = path.resolve(process.env.CONTENT_REVIEWS_DIR || contentReviewsDir);
const CONTENT_REVIEW_BASE = path.dirname(CONTENT_REVIEWS_DIR);
const TODAY = String(process.env.COMPETITIVE_REVIEW_TODAY || new Date().toISOString().slice(0, 10)).trim();
const MAX_WARNING_SAMPLES = 12;

const errors = [];
const warnings = [];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(code, message) {
  warnings.push({ code, message });
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    addError(`${relFromRepo(filePath)} could not be parsed: ${error.message}`);
    return null;
  }
}

function listTriviaFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    addError(`questions directory not found: ${relFromRepo(rootDir)}`);
    return [];
  }

  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, 'trivia.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function resolveReviewPath(entry, tech) {
  const explicit = normalizeRepoRelativePath(entry?.editorial?.competitorReview);
  if (explicit) return { absolute: path.resolve(CONTENT_REVIEW_BASE, explicit), label: explicit };
  return {
    absolute: reviewPathForTrivia(CONTENT_REVIEWS_DIR, tech, entry?.id),
    label: `content-reviews/trivia/${tech}/${String(entry?.id || '').trim()}.json`,
  };
}

function shouldExpectReview(entry) {
  const isDraftBacked = Boolean(
    String(entry?.editorial?.draftSource || '').trim()
    || String(entry?.editorial?.competitorReview || '').trim(),
  );
  if (isDraftBacked) return true;
  return Number(entry?.importance || 0) >= 3;
}

function validateEntry(entry, tech) {
  const id = String(entry?.id || '').trim();
  const label = `${tech}:${id || '<missing-id>'}`;
  const reviewTarget = resolveReviewPath(entry, tech);
  const reviewExists = fs.existsSync(reviewTarget.absolute);

  if (!reviewExists) {
    if (shouldExpectReview(entry)) {
      addWarning(
        'missing-competitor-review',
        `${label} is missing a competitor review snapshot (${normalizeRepoRelativePath(reviewTarget.label)})`,
      );
    }
    return;
  }

  const review = readJson(reviewTarget.absolute);
  if (!review) return;

  const { errors: reviewErrors, warnings: reviewWarnings } = validateCompetitiveReview({
    review,
    label,
    reviewPath: reviewTarget.label,
    contentId: id,
    tech,
    shippedText: collectTriviaText(entry),
    updatedAt: entry?.updatedAt,
    today: TODAY,
    requireThreeCompetitors: false,
    requireRelevantGreatFrontend: false,
  });

  reviewErrors.forEach((message) => addError(message));
  reviewWarnings.forEach(({ code, message }) => addWarning(code, message));
}

function summarizeWarnings() {
  if (!warnings.length) return;

  const counts = warnings.reduce((accumulator, item) => {
    accumulator[item.code] = (accumulator[item.code] || 0) + 1;
    return accumulator;
  }, {});

  const summary = Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([code, count]) => `${code}=${count}`)
    .join(', ');

  console.log(`[lint-trivia-competitive-readiness] warnings: ${warnings.length} (${summary})`);
  warnings.slice(0, MAX_WARNING_SAMPLES).forEach(({ code, message }) => {
    console.log(`[lint-trivia-competitive-readiness] WARN [${code}] ${message}`);
  });
  if (warnings.length > MAX_WARNING_SAMPLES) {
    console.log(`[lint-trivia-competitive-readiness] ... ${warnings.length - MAX_WARNING_SAMPLES} more warning(s) not shown`);
  }
}

function main() {
  const triviaFiles = listTriviaFiles(QUESTIONS_DIR);
  let triviaCount = 0;

  triviaFiles.forEach((filePath) => {
    const tech = path.basename(path.dirname(filePath));
    const entries = readJson(filePath);
    if (!Array.isArray(entries)) {
      addError(`${relFromRepo(filePath)} must export an array of trivia entries`);
      return;
    }
    triviaCount += entries.length;
    entries.forEach((entry) => validateEntry(entry, tech));
  });

  summarizeWarnings();
  errors.forEach((message) => console.error(`[lint-trivia-competitive-readiness] ${message}`));

  if (errors.length) {
    console.error(`[lint-trivia-competitive-readiness] failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log(`[lint-trivia-competitive-readiness] competitive readiness scan completed (${triviaCount} trivia entries, ${warnings.length} warning(s)).`);
}

main();
