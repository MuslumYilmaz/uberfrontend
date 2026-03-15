#!/usr/bin/env node
import {
  TECHS,
  arraysEqual,
  buildQuestionMap,
  buildTargetPositions,
  formatCounts,
  getCorrectIndex,
  getTriviaPaths,
  optionIds,
  readJson,
  relToRepo,
  rotateOptionsToIndex,
  sortIncidentQuestions,
  summarizeCounts,
  writeJson,
} from './trivia-incident-balance-lib.mjs';

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const HELP = args.has('--help') || args.has('-h');

function printUsage() {
  console.log(`rebalance-trivia-incident-options

Usage:
  node scripts/rebalance-trivia-incident-options.mjs
  node scripts/rebalance-trivia-incident-options.mjs --write

Default mode is report-only. --write rewrites frontend + cdn trivia option order.`);
}

function fail(message) {
  throw new Error(message);
}

function ensureArray(filePath, value) {
  if (!Array.isArray(value)) {
    fail(`${relToRepo(filePath)} must contain a top-level array.`);
  }
}

function sortedList(items) {
  return items.slice().sort();
}

function validateQuestionParity(tech, frontendQuestion, cdnQuestion) {
  const label = `${tech}/${frontendQuestion.id}`;
  if (!cdnQuestion) {
    fail(`Missing CDN trivia question for ${label}.`);
  }

  const frontendHasCard = !!frontendQuestion.incidentCard;
  const cdnHasCard = !!cdnQuestion.incidentCard;
  if (frontendHasCard !== cdnHasCard) {
    fail(`incidentCard presence mismatch for ${label}.`);
  }

  if (!frontendHasCard) return false;

  const frontendCard = frontendQuestion.incidentCard;
  const cdnCard = cdnQuestion.incidentCard;

  if (!Array.isArray(frontendCard.options) || frontendCard.options.length !== 3) {
    fail(`${label} frontend incidentCard must contain exactly 3 options.`);
  }
  if (!Array.isArray(cdnCard.options) || cdnCard.options.length !== 3) {
    fail(`${label} CDN incidentCard must contain exactly 3 options.`);
  }

  const frontendOptionIds = optionIds(frontendCard);
  const cdnOptionIds = optionIds(cdnCard);
  if (new Set(frontendOptionIds).size !== 3 || frontendOptionIds.some((id) => typeof id !== 'string' || !id)) {
    fail(`${label} frontend incidentCard options must have 3 unique ids.`);
  }
  if (new Set(cdnOptionIds).size !== 3 || cdnOptionIds.some((id) => typeof id !== 'string' || !id)) {
    fail(`${label} CDN incidentCard options must have 3 unique ids.`);
  }
  if (!arraysEqual(sortedList(frontendOptionIds), sortedList(cdnOptionIds))) {
    fail(`${label} frontend/CDN option ids differ.`);
  }

  if (typeof frontendCard.correctOptionId !== 'string' || !frontendCard.correctOptionId) {
    fail(`${label} frontend incidentCard is missing correctOptionId.`);
  }
  if (typeof cdnCard.correctOptionId !== 'string' || !cdnCard.correctOptionId) {
    fail(`${label} CDN incidentCard is missing correctOptionId.`);
  }
  if (frontendCard.correctOptionId !== cdnCard.correctOptionId) {
    fail(`${label} frontend/CDN correctOptionId mismatch.`);
  }

  if (getCorrectIndex(frontendCard) === -1) {
    fail(`${label} frontend correctOptionId is not present in options.`);
  }
  if (getCorrectIndex(cdnCard) === -1) {
    fail(`${label} CDN correctOptionId is not present in options.`);
  }

  return true;
}

function applyFrontendOrders(frontendQuestions, nextOptionsById) {
  return frontendQuestions.map((question) => {
    const nextOptions = nextOptionsById.get(question.id);
    if (!nextOptions) return question;
    return {
      ...question,
      incidentCard: {
        ...question.incidentCard,
        options: nextOptions.map((option) => ({ ...option })),
      },
    };
  });
}

function applyCdnOrders(cdnQuestions, frontendById, nextOptionsById) {
  return cdnQuestions.map((question) => {
    const nextOptions = nextOptionsById.get(question.id);
    if (!nextOptions) return question;

    const frontendQuestion = frontendById.get(question.id);
    return {
      ...question,
      incidentCard: {
        ...question.incidentCard,
        options: nextOptions.map((option) => ({ ...option })),
        correctOptionId: frontendQuestion.incidentCard.correctOptionId,
      },
    };
  });
}

async function main() {
  if (HELP) {
    printUsage();
    return;
  }

  let overallTotal = 0;
  const overallBefore = [0, 0, 0];
  const overallTarget = [0, 0, 0];
  let totalChanged = 0;
  let techsChanged = 0;

  console.log(`Mode: ${WRITE ? 'write' : 'report'}`);

  for (const tech of TECHS) {
    const { frontend, cdn } = getTriviaPaths(tech);
    const frontendQuestions = await readJson(frontend);
    const cdnQuestions = await readJson(cdn);

    ensureArray(frontend, frontendQuestions);
    ensureArray(cdn, cdnQuestions);

    const frontendById = buildQuestionMap(frontendQuestions);
    const cdnById = buildQuestionMap(cdnQuestions);

    const frontendIds = frontendQuestions.map((question) => question.id).filter(Boolean);
    const cdnIds = cdnQuestions.map((question) => question.id).filter(Boolean);
    const missingInCdn = frontendIds.filter((id) => !cdnById.has(id));
    const missingInFrontend = cdnIds.filter((id) => !frontendById.has(id));
    if (missingInCdn.length || missingInFrontend.length) {
      fail(
        `${tech} trivia id mismatch. Missing in CDN: ${missingInCdn.join(', ') || 'none'}. Missing in frontend: ${
          missingInFrontend.join(', ') || 'none'
        }.`,
      );
    }

    const incidentQuestions = [];
    for (const question of frontendQuestions) {
      const hasIncidentCard = validateQuestionParity(tech, question, cdnById.get(question.id));
      if (hasIncidentCard) incidentQuestions.push(question);
    }

    const { counts: beforeCounts, invalid } = summarizeCounts(incidentQuestions);
    if (invalid > 0) {
      fail(`${tech} has ${invalid} invalid incident cards after validation.`);
    }

    const { counts: targetCounts, positions } = buildTargetPositions(incidentQuestions.length, tech);
    const sortedQuestions = sortIncidentQuestions(incidentQuestions);
    const nextOptionsById = new Map();
    let changedForTech = 0;

    sortedQuestions.forEach((question, index) => {
      const targetIndex = positions[index];
      const nextOptions = rotateOptionsToIndex(
        question.incidentCard.options,
        question.incidentCard.correctOptionId,
        targetIndex,
      );
      nextOptionsById.set(question.id, nextOptions);

      if (!arraysEqual(optionIds(question.incidentCard), nextOptions.map((option) => option.id))) {
        changedForTech += 1;
      }
    });

    overallTotal += incidentQuestions.length;
    totalChanged += changedForTech;
    if (changedForTech > 0) techsChanged += 1;
    for (let i = 0; i < 3; i += 1) {
      overallBefore[i] += beforeCounts[i];
      overallTarget[i] += targetCounts[i];
    }

    console.log(
      `${tech.padEnd(10)} total=${String(incidentQuestions.length).padStart(3)} current=${formatCounts(beforeCounts)} target=${formatCounts(
        targetCounts,
      )} changed=${changedForTech}`,
    );

    if (WRITE && changedForTech > 0) {
      const nextFrontendQuestions = applyFrontendOrders(frontendQuestions, nextOptionsById);
      const nextCdnQuestions = applyCdnOrders(cdnQuestions, frontendById, nextOptionsById);
      await writeJson(frontend, nextFrontendQuestions);
      await writeJson(cdn, nextCdnQuestions);
    }
  }

  console.log(
    `overall    total=${String(overallTotal).padStart(3)} current=${formatCounts(overallBefore)} target=${formatCounts(overallTarget)} changed=${totalChanged}`,
  );

  if (WRITE) {
    if (totalChanged === 0) {
      console.log('No trivia incident option reordering was needed.');
    } else {
      console.log(`Reordered incident options for ${totalChanged} questions across ${techsChanged} techs.`);
    }
    return;
  }

  if (totalChanged === 0) {
    console.log('Report complete. Trivia incident option order is already balanced.');
  } else {
    console.log(`Report complete. Would reorder incident options for ${totalChanged} questions across ${techsChanged} techs.`);
  }
}

main().catch((error) => {
  console.error(`[rebalance-trivia-incident-options] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
