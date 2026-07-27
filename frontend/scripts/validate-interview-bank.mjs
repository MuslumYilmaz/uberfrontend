#!/usr/bin/env node

import fs from "node:fs";
import {
  interviewBankDefaults,
  missingBankInputs,
  parseCliArgs,
} from "./interview-bank-lib.mjs";
import {
  loadInterviewBankContext,
  validateInterviewBank,
} from "./interview-bank-validator.mjs";

function parseArguments(argv) {
  const requireGold = argv.includes("--gold");
  const pathArguments = argv.filter((argument) => argument !== "--gold");
  return { ...parseCliArgs(pathArguments, interviewBankDefaults), requireGold };
}

async function main() {
  const paths = parseArguments(process.argv.slice(2));
  const missing = missingBankInputs(paths);
  const missingPolicies = [
    "quality-policy.json",
    "source-policy.json",
    "runtime-profiles.json",
  ].filter((fileName) => !fs.existsSync(
    new URL(`../../content-drafts/interview-mcq/policies/${fileName}`, import.meta.url),
  ));
  if (missing.length || missingPolicies.length) {
    const missingInputs = [
      ...missing,
      ...missingPolicies.map((fileName) => `policies/${fileName}`),
    ];
    throw new Error(`Missing required interview-bank input(s): ${missingInputs.join(", ")}`);
  }

  const context = loadInterviewBankContext(paths);
  const { errors, warnings } = await validateInterviewBank(context, {
    requireGold: paths.requireGold,
  });
  warnings.forEach((warning) => console.warn(`[interview-bank] WARN: ${warning}`));
  if (errors.length) {
    console.error(`Interview bank validation failed with ${errors.length} error(s).`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(
    `Interview bank validation passed (${context.itemEntries.length} items, ${context.manifest.status}).`,
  );
}

main().catch((error) => {
  console.error(`[validate-interview-bank] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
