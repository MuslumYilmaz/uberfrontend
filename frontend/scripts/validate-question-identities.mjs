#!/usr/bin/env node
import {
  cdnQuestionsRoot,
  collectQuestionIdentities,
  duplicateKeys,
  manifestPath,
  readJson,
  readManifestEntries,
  relToRepo,
} from './question-identity-lib.mjs';

function fail(errors, message) {
  errors.push(message);
}

async function main() {
  const errors = [];
  const cdnIdentities = await collectQuestionIdentities(cdnQuestionsRoot);
  const manifest = await readJson(manifestPath);
  const manifestEntries = readManifestEntries(manifest);

  const cdnDuplicates = duplicateKeys(cdnIdentities);
  for (const key of cdnDuplicates) {
    fail(errors, `Duplicate CDN question identity: ${key}`);
  }

  const manifestKeySet = new Set(manifestEntries.map((identity) => identity.key));
  const cdnKeySet = new Set(cdnIdentities.map((identity) => identity.key));
  const removedSinceManifest = manifestEntries.filter((identity) => !cdnKeySet.has(identity.key));
  const addedSinceManifest = cdnIdentities.filter((identity) => !manifestKeySet.has(identity.key));

  for (const identity of removedSinceManifest) {
    fail(errors, `Question identity was removed or moved after being shipped: ${identity.key}. Historical gamification depends on immutable tech/kind/id.`);
  }
  for (const identity of addedSinceManifest) {
    fail(errors, `New question identity is not recorded in ${relToRepo(manifestPath)}: ${identity.key}. Run: node scripts/update-question-id-manifest.mjs`);
  }

  console.log(`question identities cdn=${cdnIdentities.length} manifest=${manifestEntries.length}`);

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
