#!/usr/bin/env node
import {
  TECHS,
  arraysEqual,
  buildQuestionMap,
  formatCounts,
  getCorrectIndex,
  getTriviaPaths,
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
    const { frontend, cdn } = getTriviaPaths(tech);
    const frontendQuestions = await readJson(frontend);
    const cdnQuestions = await readJson(cdn);

    const frontendOk = ensureArray(frontend, frontendQuestions, errors);
    const cdnOk = ensureArray(cdn, cdnQuestions, errors);
    if (!frontendOk || !cdnOk) continue;

    const frontendById = buildQuestionMap(frontendQuestions);
    const cdnById = buildQuestionMap(cdnQuestions);
    const frontendIds = frontendQuestions.map((question) => question.id).filter(Boolean);
    const cdnIds = cdnQuestions.map((question) => question.id).filter(Boolean);

    for (const id of frontendIds) {
      if (!cdnById.has(id)) {
        addError(errors, `${tech}/${id}: missing in CDN trivia file.`);
      }
    }
    for (const id of cdnIds) {
      if (!frontendById.has(id)) {
        addError(errors, `${tech}/${id}: missing in frontend trivia file.`);
      }
    }

    const counts = [0, 0, 0];
    let total = 0;

    for (const question of frontendQuestions) {
      const label = `${tech}/${question.id}`;
      const cdnQuestion = cdnById.get(question.id);
      if (!cdnQuestion) continue;

      const frontendCard = question.incidentCard ?? null;
      const cdnCard = cdnQuestion.incidentCard ?? null;

      if (!!frontendCard !== !!cdnCard) {
        addError(errors, `${label}: incidentCard presence mismatch between frontend and CDN.`);
        continue;
      }

      if (!frontendCard) continue;

      total += 1;
      overallTotal += 1;

      if (!Array.isArray(frontendCard.options) || frontendCard.options.length !== 3) {
        addError(errors, `${label}: frontend incidentCard must contain exactly 3 options.`);
        continue;
      }
      if (!Array.isArray(cdnCard.options) || cdnCard.options.length !== 3) {
        addError(errors, `${label}: CDN incidentCard must contain exactly 3 options.`);
        continue;
      }

      const frontendOptionIds = optionIds(frontendCard);
      const cdnOptionIds = optionIds(cdnCard);
      if (new Set(frontendOptionIds).size !== 3 || frontendOptionIds.some((id) => typeof id !== 'string' || !id)) {
        addError(errors, `${label}: frontend incidentCard options must have 3 unique ids.`);
        continue;
      }
      if (new Set(cdnOptionIds).size !== 3 || cdnOptionIds.some((id) => typeof id !== 'string' || !id)) {
        addError(errors, `${label}: CDN incidentCard options must have 3 unique ids.`);
        continue;
      }

      const frontendIndex = getCorrectIndex(frontendCard);
      const cdnIndex = getCorrectIndex(cdnCard);
      if (frontendIndex === -1) {
        addError(errors, `${label}: frontend correctOptionId is not present in options.`);
        continue;
      }
      if (cdnIndex === -1) {
        addError(errors, `${label}: CDN correctOptionId is not present in options.`);
        continue;
      }
      if (frontendCard.correctOptionId !== cdnCard.correctOptionId) {
        addError(errors, `${label}: correctOptionId mismatch between frontend and CDN.`);
      }
      if (!arraysEqual(frontendOptionIds, cdnOptionIds)) {
        addError(errors, `${label}: option order mismatch between frontend and CDN.`);
      }

      counts[frontendIndex] += 1;
      overallCounts[frontendIndex] += 1;
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
