#!/usr/bin/env node
import {
  buildManifest,
  collectQuestionIdentities,
  frontendQuestionsRoot,
  manifestPath,
  relToRepo,
  writeJson,
} from './question-identity-lib.mjs';

async function main() {
  const identities = await collectQuestionIdentities(frontendQuestionsRoot);
  const manifest = buildManifest(identities);
  await writeJson(manifestPath, manifest);
  console.log(`Wrote ${identities.length} question identities to ${relToRepo(manifestPath)}.`);
}

main().catch((error) => {
  console.error(`[update-question-id-manifest] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
