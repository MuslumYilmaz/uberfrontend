#!/usr/bin/env node
import {
  TECHS,
  buildTargetPositions,
  formatCounts,
  getTriviaPath,
  getCorrectIndex,
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

Default mode is report-only. --write rewrites CDN trivia option order.`);
}

function fail(message) {
  throw new Error(message);
}

function ensureArray(filePath, value) {
  if (!Array.isArray(value)) {
    fail(`${relToRepo(filePath)} must contain a top-level array.`);
  }
}

function validateQuestion(tech, question) {
  const label = `${tech}/${question.id}`;
  const card = question.incidentCard;
  if (!card) return false;

  if (!Array.isArray(card.options) || card.options.length !== 3) {
    fail(`${label} incidentCard must contain exactly 3 options.`);
  }

  const currentOptionIds = optionIds(card);
  if (new Set(currentOptionIds).size !== 3 || currentOptionIds.some((id) => typeof id !== 'string' || !id)) {
    fail(`${label} incidentCard options must have 3 unique ids.`);
  }

  if (typeof card.correctOptionId !== 'string' || !card.correctOptionId) {
    fail(`${label} incidentCard is missing correctOptionId.`);
  }

  if (getCorrectIndex(card) === -1) {
    fail(`${label} correctOptionId is not present in options.`);
  }

  return true;
}

function applyOrders(questions, nextOptionsById) {
  return questions.map((question) => {
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
    const triviaPath = getTriviaPath(tech);
    const questions = await readJson(triviaPath);
    ensureArray(triviaPath, questions);

    const incidentQuestions = [];
    for (const question of questions) {
      const hasIncidentCard = validateQuestion(tech, question);
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

      if (optionIds(question.incidentCard).join('|') !== nextOptions.map((option) => option.id).join('|')) {
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
      const nextQuestions = applyOrders(questions, nextOptionsById);
      await writeJson(triviaPath, nextQuestions);
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
