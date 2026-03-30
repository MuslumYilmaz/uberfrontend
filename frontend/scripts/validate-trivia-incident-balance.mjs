#!/usr/bin/env node
import {
  TECHS,
  formatCounts,
  getTriviaPath,
  getCorrectIndex,
  maxCountDelta,
  optionIds,
  readJson,
  relToRepo,
} from './trivia-incident-balance-lib.mjs';

function addError(errors, message) {
  errors.push(message);
}

function ensureArray(filePath, value, errors) {
  if (!Array.isArray(value)) {
    addError(errors, `${relToRepo(filePath)} must contain a top-level array.`);
    return false;
  }
  return true;
}

async function main() {
  const errors = [];
  const rows = [];
  const overallCounts = [0, 0, 0];
  let overallTotal = 0;

  for (const tech of TECHS) {
    const triviaPath = getTriviaPath(tech);
    const questions = await readJson(triviaPath);
    const ok = ensureArray(triviaPath, questions, errors);
    if (!ok) continue;

    const counts = [0, 0, 0];
    let total = 0;

    for (const question of questions) {
      const label = `${tech}/${question.id}`;
      const card = question.incidentCard ?? null;
      if (!card) continue;

      total += 1;
      overallTotal += 1;

      if (!Array.isArray(card.options) || card.options.length !== 3) {
        addError(errors, `${label}: incidentCard must contain exactly 3 options.`);
        continue;
      }

      const currentOptionIds = optionIds(card);
      if (new Set(currentOptionIds).size !== 3 || currentOptionIds.some((id) => typeof id !== 'string' || !id)) {
        addError(errors, `${label}: incidentCard options must have 3 unique ids.`);
        continue;
      }

      const correctIndex = getCorrectIndex(card);
      if (correctIndex === -1) {
        addError(errors, `${label}: correctOptionId is not present in options.`);
        continue;
      }

      counts[correctIndex] += 1;
      overallCounts[correctIndex] += 1;
    }

    if (total > 0 && maxCountDelta(counts) > 1) {
      addError(errors, `${tech}: answer-position counts are imbalanced (${formatCounts(counts)}).`);
    }

    rows.push({ tech, total, counts });
  }

  console.log(`overall total=${overallTotal} counts=${formatCounts(overallCounts)}`);
  for (const row of rows) {
    console.log(`${row.tech.padEnd(10)} total=${String(row.total).padStart(3)} counts=${formatCounts(row.counts)}`);
  }

  if (errors.length > 0) {
    console.error(`Trivia incident balance check failed with ${errors.length} error(s).`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Trivia incident balance check passed.');
}

main().catch((error) => {
  console.error(`[validate-trivia-incident-balance] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
