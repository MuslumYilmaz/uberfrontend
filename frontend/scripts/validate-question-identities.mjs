#!/usr/bin/env node
import {
  cdnQuestionsRoot,
  collectQuestionIdentities,
  duplicateKeys,
  frontendQuestionsRoot,
  manifestPath,
  missingFrom,
  readJson,
  readManifestEntries,
  relToRepo,
} from './question-identity-lib.mjs';

function fail(errors, message) {
  errors.push(message);
}

async function main() {
  const errors = [];
  const frontendIdentities = await collectQuestionIdentities(frontendQuestionsRoot);
  const cdnIdentities = await collectQuestionIdentities(cdnQuestionsRoot);
  const manifest = await readJson(manifestPath);
  const manifestEntries = readManifestEntries(manifest);

  const frontendDuplicates = duplicateKeys(frontendIdentities);
  const cdnDuplicates = duplicateKeys(cdnIdentities);
  for (const key of frontendDuplicates) {
    fail(errors, `Duplicate frontend question identity: ${key}`);
  }
  for (const key of cdnDuplicates) {
    fail(errors, `Duplicate CDN question identity: ${key}`);
  }

  const missingInCdn = missingFrom(frontendIdentities, cdnIdentities);
  const missingInFrontend = missingFrom(cdnIdentities, frontendIdentities);
  const removedSinceManifest = missingFrom(manifestEntries, frontendIdentities);
  const addedSinceManifest = missingFrom(frontendIdentities, manifestEntries);

  for (const identity of missingInCdn) {
    fail(errors, `Missing CDN question for ${identity.key}.`);
  }
  for (const identity of missingInFrontend) {
    fail(errors, `Missing frontend question for ${identity.key}.`);
  }
  for (const identity of removedSinceManifest) {
    fail(errors, `Question identity was removed or moved after being shipped: ${identity.key}. Historical gamification depends on immutable tech/kind/id.`);
  }
  for (const identity of addedSinceManifest) {
    fail(errors, `New question identity is not recorded in ${relToRepo(manifestPath)}: ${identity.key}. Run: node scripts/update-question-id-manifest.mjs`);
  }

  console.log(`question identities frontend=${frontendIdentities.length} cdn=${cdnIdentities.length} manifest=${manifestEntries.length}`);

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
