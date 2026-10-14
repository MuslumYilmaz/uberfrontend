import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { AUTHORED_COMPANIES, LEGACY_AUTHORED_COMPANIES, REGISTRY_AUTHORED_COMPANIES } from './authored-companies.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryFile = path.join(root, 'src/app/shared/company-previews/authored-company-previews.ts');
const slugsFile = path.join(root, 'src/app/shared/company-previews/authored-company-slugs.ts');

function registryKeys() {
  const text = fs.readFileSync(registryFile, 'utf8');
  const literal = text.match(/AUTHORED_COMPANY_PREVIEWS[^=]*=\s*(?:Object\.freeze\()?\{([\s\S]*?)\}\)?\s*(?:as const)?;/);
  assert.ok(literal, 'AUTHORED_COMPANY_PREVIEWS object literal not found');
  return [...literal[1].matchAll(/^\s*'?([a-z0-9-]+)'?\s*:/gm)].map((match) => match[1]);
}

test('the script-side authored company list mirrors the TypeScript registry', () => {
  assert.deepEqual([...REGISTRY_AUTHORED_COMPANIES].sort(), registryKeys().sort());
});

test('the content-free slug list mirrors the registry and never imports content modules', () => {
  const text = fs.readFileSync(slugsFile, 'utf8');
  const literal = text.match(/AUTHORED_COMPANY_SLUGS[^=]*=\s*\[([^\]]*)\]/);
  assert.ok(literal, 'AUTHORED_COMPANY_SLUGS array literal not found');
  const slugs = [...literal[1].matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]);
  assert.deepEqual([...REGISTRY_AUTHORED_COMPANIES].sort(), slugs.sort());
  assert.doesNotMatch(text, /from '[^']*(?:preview-content|authored-company-previews)'/, 'slug list must stay content-free');
});

test('legacy and registry companies never overlap and all slugs are kebab-case', () => {
  for (const slug of AUTHORED_COMPANIES) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(new Set(AUTHORED_COMPANIES).size, AUTHORED_COMPANIES.length);
  for (const slug of REGISTRY_AUTHORED_COMPANIES) assert.ok(!LEGACY_AUTHORED_COMPANIES.includes(slug), slug);
});
