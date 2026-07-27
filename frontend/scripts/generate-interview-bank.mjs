#!/usr/bin/env node

import {
  assertSafeInterviewBankOutputDir,
  buildGeneratedPackages,
  interviewBankDefaults,
  loadAuthoringItems,
  missingBankInputs,
  parseCliArgs,
  readJson,
  syncGeneratedFiles,
} from "./interview-bank-lib.mjs";
import {
  loadInterviewBankPolicies,
  validateInterviewBank,
} from "./interview-bank-validator.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function generateInterviewBank(paths) {
  assertSafeInterviewBankOutputDir(paths.outputDir);
  const itemEntries = loadAuthoringItems(paths.itemsDir);
  const manifest = readJson(paths.manifestPath);
  const reviews = readJson(paths.reviewsPath);
  const blueprint = readJson(paths.blueprintPath);
  const validation = await validateInterviewBank({
    itemEntries,
    manifest,
    reviews,
    blueprint,
    policies: loadInterviewBankPolicies(),
  }, { executeBrowser: false });
  if (validation.errors.length) {
    throw new Error(
      `Refusing to generate an invalid interview bank:\n${validation.errors.join("\n")}`,
    );
  }
  const items = itemEntries.map(({ item }) => ({ item }));
  const generated = buildGeneratedPackages({ items, manifest, reviews, blueprint });
  const mismatches = syncGeneratedFiles(generated.files, paths.outputDir, { check: paths.check });
  return { ...generated, mismatches };
}

async function main() {
  const paths = parseCliArgs(process.argv.slice(2), interviewBankDefaults);
  const missing = missingBankInputs(paths);
  if (missing.length) {
    throw new Error(`Missing required interview-bank input(s): ${missing.join(", ")}`);
  }

  const result = await generateInterviewBank(paths);
  if (paths.check && result.mismatches.length) {
    console.error("Generated interview-bank artifacts are stale or missing:");
    result.mismatches.forEach((filePath) => console.error(`- ${filePath}`));
    process.exit(1);
  }
  const action = paths.check ? "verified" : "generated";
  console.log(
    `[generate-interview-bank] ${action} ${result.publicPackage.items.length} item(s) for ${result.publicPackage.bankId}.`,
  );
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[generate-interview-bank] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
