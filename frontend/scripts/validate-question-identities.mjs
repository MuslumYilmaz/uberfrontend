#!/usr/bin/env node
import {
  cdnQuestionsRoot,
  collectIdentityErrors,
  collectQuestionIdentities,
  manifestPath,
  readJson,
  readManifestEntries,
  readRetiredEntries,
  relToRepo,
} from './question-identity-lib.mjs';

async function main() {
  const cdnIdentities = await collectQuestionIdentities(cdnQuestionsRoot);
  const manifest = await readJson(manifestPath);
  const errors = collectIdentityErrors(cdnIdentities, manifest, relToRepo(manifestPath));

  console.log(`question identities cdn=${cdnIdentities.length} manifest=${readManifestEntries(manifest).length} retired=${readRetiredEntries(manifest).length}`);

  if (errors.length > 0) {
    console.error(`Question identity validation failed with ${errors.length} error(s).`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Question identity validation passed.');
}

main().catch((error) => {
  console.error(`[validate-question-identities] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
