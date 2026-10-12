import fs from 'node:fs/promises';
import path from 'node:path';
import {
  cdnQuestionsDir,
  frontendRoot,
  repoRoot,
} from './content-paths.mjs';

export const cdnQuestionsRoot = cdnQuestionsDir;
export const manifestPath = path.join(frontendRoot, 'scripts', 'question-id-manifest.json');
export const TECHS = ['angular', 'css', 'html', 'javascript', 'react', 'vue'];
export const KINDS = ['coding', 'trivia', 'debug'];

export function relToRepo(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function buildCatalogPath(root, tech, kind) {
  return path.join(root, tech, `${kind}.json`);
}

export async function collectQuestionIdentities(root) {
  const identities = [];

  for (const tech of TECHS) {
    for (const kind of KINDS) {
      const filePath = buildCatalogPath(root, tech, kind);
      if (!(await fileExists(filePath))) continue;

      const parsed = await readJson(filePath);
      if (!Array.isArray(parsed)) {
        throw new Error(`${relToRepo(filePath)} must contain a top-level array.`);
      }

      for (const question of parsed) {
        const id = typeof question?.id === 'string' ? question.id.trim() : '';
        if (!id) continue;
        identities.push({
          tech,
          kind,
          id,
          key: `${tech}/${kind}/${id}`,
          file: `${tech}/${kind}.json`,
        });
      }
    }
  }

  identities.sort((left, right) => left.key.localeCompare(right.key));
  return identities;
}

export function toKeySet(identities) {
  return new Set(identities.map((identity) => identity.key));
}

export function missingFrom(left, right) {
  const rightKeys = toKeySet(right);
  return left.filter((identity) => !rightKeys.has(identity.key));
}

export function duplicateKeys(identities) {
  const seen = new Set();
  const duplicates = [];
  for (const identity of identities) {
    if (seen.has(identity.key)) duplicates.push(identity.key);
    seen.add(identity.key);
  }
  return duplicates;
}

export function buildManifest(identities, generatedAt = new Date().toISOString(), retired = []) {
  const manifest = {
    version: 1,
    generatedAt,
    entries: identities.map(({ tech, kind, id, file }) => ({ tech, kind, id, file })),
  };
  const retiredEntries = readRetiredEntries({ retired });
  if (retiredEntries.length > 0) {
    manifest.retired = retiredEntries.map(({ tech, kind, id, file, redirectTo, retiredAt, reason }) => ({
      tech, kind, id, file, redirectTo, retiredAt, reason,
    }));
  }
  return manifest;
}

export function readManifestEntries(manifest) {
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
  return entries
    .map((entry) => {
      const tech = typeof entry?.tech === 'string' ? entry.tech.trim() : '';
      const kind = typeof entry?.kind === 'string' ? entry.kind.trim() : '';
      const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
      const file = typeof entry?.file === 'string' ? entry.file.trim() : `${tech}/${kind}.json`;
      if (!tech || !kind || !id) return null;
      return { tech, kind, id, file, key: `${tech}/${kind}/${id}` };
    })
    .filter(Boolean)
    .sort((left, right) => left.key.localeCompare(right.key));
}

/** Retired identities are the explicit migration record for a removed shipped
 * question: the route must 301 to `redirectTo` and the identity may never be
 * reused, because historical gamification records still reference it. */
export function readRetiredEntries(manifest) {
  const entries = Array.isArray(manifest?.retired) ? manifest.retired : [];
  return entries
    .map((entry) => {
      const tech = typeof entry?.tech === 'string' ? entry.tech.trim() : '';
      const kind = typeof entry?.kind === 'string' ? entry.kind.trim() : '';
      const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
      const file = typeof entry?.file === 'string' ? entry.file.trim() : `${tech}/${kind}.json`;
      const redirectTo = typeof entry?.redirectTo === 'string' ? entry.redirectTo.trim() : '';
      const retiredAt = typeof entry?.retiredAt === 'string' ? entry.retiredAt.trim() : '';
      const reason = typeof entry?.reason === 'string' ? entry.reason.trim() : '';
      if (!tech || !kind || !id) return null;
      return { tech, kind, id, file, redirectTo, retiredAt, reason, key: `${tech}/${kind}/${id}` };
    })
    .filter(Boolean)
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function collectIdentityErrors(cdnIdentities, manifest, manifestLabel = 'frontend/scripts/question-id-manifest.json') {
  const errors = [];
  const manifestEntries = readManifestEntries(manifest);
  const retiredEntries = readRetiredEntries(manifest);

  for (const key of duplicateKeys(cdnIdentities)) {
    errors.push(`Duplicate CDN question identity: ${key}`);
  }

  const manifestKeySet = toKeySet(manifestEntries);
  const cdnKeySet = toKeySet(cdnIdentities);
  const retiredByKey = new Map(retiredEntries.map((entry) => [entry.key, entry]));

  for (const entry of retiredEntries) {
    if (!/^\/[^\s?#]+$/.test(entry.redirectTo)) {
      errors.push(`Retired question identity ${entry.key} needs an absolute-path redirectTo in ${manifestLabel}.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.retiredAt)) {
      errors.push(`Retired question identity ${entry.key} needs a retiredAt date (YYYY-MM-DD) in ${manifestLabel}.`);
    }
    if (cdnKeySet.has(entry.key)) {
      errors.push(`Retired question identity ${entry.key} is back in the CDN catalog. Retired identities cannot be reused; add the content under a new id or drop the retired record on purpose.`);
    }
    if (manifestKeySet.has(entry.key)) {
      errors.push(`Question identity ${entry.key} is listed both as shipped and as retired in ${manifestLabel}. Run: node scripts/update-question-id-manifest.mjs`);
    }
  }

  for (const identity of manifestEntries) {
    if (cdnKeySet.has(identity.key) || retiredByKey.has(identity.key)) continue;
    errors.push(`Question identity was removed or moved after being shipped: ${identity.key}. Historical gamification depends on immutable tech/kind/id. Record it under "retired" with a redirectTo, or restore it.`);
  }
  for (const identity of cdnIdentities) {
    if (manifestKeySet.has(identity.key)) continue;
    errors.push(`New question identity is not recorded in ${manifestLabel}: ${identity.key}. Run: node scripts/update-question-id-manifest.mjs`);
  }

  return errors;
}
