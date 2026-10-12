#!/usr/bin/env node
import {
  buildManifest,
  cdnQuestionsRoot,
  collectQuestionIdentities,
  fileExists,
  manifestPath,
  readJson,
  readRetiredEntries,
  relToRepo,
  writeJson,
} from './question-identity-lib.mjs';

async function main() {
  const identities = await collectQuestionIdentities(cdnQuestionsRoot);
  // Retired records are the migration history for removed identities; the
  // snapshot refresh must carry them forward instead of silently dropping them.
  const previous = (await fileExists(manifestPath)) ? await readJson(manifestPath) : null;
  const retired = readRetiredEntries(previous);
  const manifest = buildManifest(identities, new Date().toISOString(), retired);
  await writeJson(manifestPath, manifest);
  console.log(`Wrote ${identities.length} question identities (${retired.length} retired) to ${relToRepo(manifestPath)}.`);
}

main().catch((error) => {
  console.error(`[update-question-id-manifest] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
