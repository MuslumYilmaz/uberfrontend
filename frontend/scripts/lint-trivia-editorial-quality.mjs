#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { cdnQuestionsDir, frontendRoot } from './content-paths.mjs';

const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const MIN_FAIL_WORDS = 120;
const MIN_WARN_WORDS = 180;
const MIN_STRING_ANSWER_WORDS = 60;
const STALE_AFTER_DAYS = 365;
const EXPLICIT_EXAMPLE_RX = /\b(example|for example|scenario|worked example|e\.g\.)\b/i;
const JUDGMENT_RX = /\b(trade(?:\s|[-‑–—])?offs?|mistakes?|pitfalls?|decision(?:s)?|constraints?)\b/i;
const SUMMARY_RX = /\b(summary|takeaway|in short|the short version|remember)\b/i;

const errors = [];
const warnings = [];

function rel(filePath) {
  return path.relative(frontendRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function wordCount(value) {
  const normalized = normalizeText(value);
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

function parseJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    addError(`${rel(filePath)} could not be parsed: ${error.message}`);
    return null;
  }
}

function listTriviaFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    addError(`questions directory not found: ${rel(rootDir)}`);
    return [];
  }

  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, 'trivia.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function collectTextFromListBlock(block) {
  const parts = [block.caption];
  if (Array.isArray(block.columns)) parts.push(...block.columns);
  if (Array.isArray(block.rows)) {
    block.rows.forEach((row) => {
      if (Array.isArray(row)) parts.push(...row);
    });
  }
  return parts;
}

function combinedEditorialText(entry) {
  const parts = [entry.title, entry.description];
  const answer = entry.answer;

  if (typeof answer === 'string') {
    parts.push(answer);
  } else if (answer && typeof answer === 'object' && Array.isArray(answer.blocks)) {
    answer.blocks.forEach((block) => {
      if (!block || typeof block !== 'object' || block.type === 'incidentCard') return;
      if (block.type === 'text') parts.push(block.text);
      if (block.type === 'list') parts.push(...collectTextFromListBlock(block));
      if (block.type === 'image') parts.push(block.caption);
    });
  }

  return parts.join(' ');
}

function explanatoryTextBlocks(entry) {
  const answer = entry.answer;
  if (!answer || typeof answer !== 'object' || !Array.isArray(answer.blocks)) return [];
  return answer.blocks
    .filter((block) => block?.type === 'text')
    .map((block) => normalizeText(block.text))
    .filter((text) => text.length >= 30);
}

function countRenderableBlocks(entry) {
  const answer = entry.answer;
  if (!answer || typeof answer !== 'object' || !Array.isArray(answer.blocks)) return 0;
  return answer.blocks.filter((block) => (
    block
    && typeof block === 'object'
    && ['text', 'code', 'image', 'list'].includes(String(block.type || ''))
  )).length;
}

function teachingSignals(entry, normalizedText) {
  const answer = entry.answer;
  const blocks = answer && typeof answer === 'object' && Array.isArray(answer.blocks)
    ? answer.blocks
    : [];

  return {
    hasExplicitExample: EXPLICIT_EXAMPLE_RX.test(normalizedText),
    hasJudgmentCue: JUDGMENT_RX.test(normalizedText),
    hasCodeBlock: blocks.some((block) => block?.type === 'code'),
    hasListOrTable: blocks.some((block) => block?.type === 'list'),
    hasSummaryStyleConclusion: SUMMARY_RX.test(normalizedText),
  };
}

function parseDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function daysSince(value) {
  const date = parseDate(value);
  if (!date) return null;
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
}

function validateEntry(filePath, tech, entry) {
  const id = `${tech}:${String(entry?.id || '').trim() || '<missing-id>'}`;
  const answer = entry?.answer;
  const combinedText = combinedEditorialText(entry);
  const combinedWords = wordCount(combinedText);
  const normalizedText = normalizeText(combinedText);

  if (answer == null || answer === '') {
    addError(`${id} is missing answer content entirely`);
    return;
  }

  if (typeof answer === 'string' && wordCount(answer) < MIN_STRING_ANSWER_WORDS) {
    addError(`${id} has a thin string answer (${wordCount(answer)} answer words; expected at least ${MIN_STRING_ANSWER_WORDS})`);
  }

  if (answer && typeof answer === 'object' && Array.isArray(answer.blocks)) {
    const renderableBlocks = countRenderableBlocks(entry);
    if (renderableBlocks < 2) {
      addError(`${id} needs at least 2 renderable answer blocks (found ${renderableBlocks})`);
    }
    if (explanatoryTextBlocks(entry).length < 1) {
      addError(`${id} needs at least one explanatory text block inside answer.blocks`);
    }
  }

  if (combinedWords < MIN_FAIL_WORDS) {
    addError(`${id} is too thin for the trivia editorial floor (${combinedWords} words; expected at least ${MIN_FAIL_WORDS})`);
  }

  const signals = teachingSignals(entry, normalizedText);
  if (
    !signals.hasExplicitExample
    && !signals.hasJudgmentCue
    && !signals.hasCodeBlock
    && !signals.hasListOrTable
    && !signals.hasSummaryStyleConclusion
  ) {
    addError(`${id} is missing a teaching signal; add an explicit example, judgment language, code/list artifact, or summary-style explanation`);
  }

  if (combinedWords < MIN_WARN_WORDS) {
    addWarning(`${id} is short for a shipped trivia explanation (${combinedWords} words); consider adding one more concrete layer`);
  }
  if (!signals.hasExplicitExample && !signals.hasCodeBlock && !signals.hasListOrTable) {
    addWarning(`${id} has no explicit example/scenario cue; consider adding a labeled example or worked scenario`);
  }
  if (!signals.hasJudgmentCue && !signals.hasCodeBlock && !signals.hasListOrTable) {
    addWarning(`${id} has no tradeoff/pitfall/decision cue; consider surfacing when the answer changes under constraints`);
  }

  const staleDays = daysSince(entry?.updatedAt || entry?.createdAt);
  if (staleDays !== null && staleDays > STALE_AFTER_DAYS) {
    addWarning(`${id} has not been updated in ${staleDays} days; review whether the explanation needs a refresh`);
  }

  if (!entry?.seo || typeof entry.seo !== 'object') {
    addWarning(`${id} has no explicit seo object; rely on generated defaults only if intentional`);
  } else if (wordCount(entry.seo.description) < 10) {
    addWarning(`${id} has a short seo.description; consider making the search snippet more specific`);
  }
}

function validateDuplicateSeo(entries) {
  const titleMap = new Map();
  const descMap = new Map();

  entries.forEach(({ tech, entry }) => {
    const id = `${tech}:${String(entry?.id || '').trim() || '<missing-id>'}`;
    const titleKey = normalizeKey(entry?.seo?.title);
    const descKey = normalizeKey(entry?.seo?.description);

    if (titleKey) {
      const list = titleMap.get(titleKey) || [];
      list.push(id);
      titleMap.set(titleKey, list);
    }
    if (descKey) {
      const list = descMap.get(descKey) || [];
      list.push(id);
      descMap.set(descKey, list);
    }
  });

  titleMap.forEach((ids) => {
    if (ids.length > 1) {
      addError(`duplicate trivia seo.title detected across entries: ${ids.join(', ')}`);
    }
  });
  descMap.forEach((ids) => {
    if (ids.length > 1) {
      addError(`duplicate trivia seo.description detected across entries: ${ids.join(', ')}`);
    }
  });
}

function main() {
  const triviaFiles = listTriviaFiles(QUESTIONS_DIR);
  const seenEntries = [];
  let checkedEntries = 0;

  triviaFiles.forEach((filePath) => {
    const tech = path.basename(path.dirname(filePath));
    const parsed = parseJson(filePath);
    if (!Array.isArray(parsed)) {
      addError(`${rel(filePath)} must export an array of trivia entries`);
      return;
    }

    parsed.forEach((entry) => {
      checkedEntries += 1;
      seenEntries.push({ filePath, tech, entry });
      validateEntry(filePath, tech, entry);
    });
  });

  validateDuplicateSeo(seenEntries);

  warnings.forEach((message) => console.log(`[lint-trivia-editorial-quality] warning: ${message}`));
  errors.forEach((message) => console.error(`[lint-trivia-editorial-quality] ${message}`));

  if (errors.length) {
    console.error(`[lint-trivia-editorial-quality] failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`[lint-trivia-editorial-quality] editorial quality checks passed (${checkedEntries} trivia entr${checkedEntries === 1 ? 'y' : 'ies'} checked, ${warnings.length} warning(s)).`);
}

main();
