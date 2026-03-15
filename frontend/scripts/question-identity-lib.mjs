import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const frontendProjectRoot = path.resolve(__dirname, '..');
export const repoRoot = path.resolve(frontendProjectRoot, '..');
export const frontendQuestionsRoot = path.join(frontendProjectRoot, 'src', 'assets', 'questions');
export const cdnQuestionsRoot = path.join(repoRoot, 'cdn', 'questions');
export const manifestPath = path.join(frontendProjectRoot, 'scripts', 'question-id-manifest.json');
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

export function buildManifest(identities, generatedAt = new Date().toISOString()) {
  return {
    version: 1,
    generatedAt,
    entries: identities.map(({ tech, kind, id, file }) => ({ tech, kind, id, file })),
  };
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
