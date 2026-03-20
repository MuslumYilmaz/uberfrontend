#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const REGISTRY_PATH = path.resolve('src', 'assets', 'practice', 'registry.json');
const VALID_FAMILIES = new Set(['question', 'incident', 'code-review', 'tradeoff-battle']);
const VALID_TECH = new Set(['javascript', 'react', 'angular', 'vue', 'html', 'css', 'system-design']);
const VALID_DIFFICULTY = new Set(['easy', 'intermediate', 'hard']);
const VALID_ACCESS = new Set(['free', 'premium']);

function fail(message) {
  console.error(`[lint-practice-registry] ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

if (!fs.existsSync(REGISTRY_PATH)) {
  fail('practice registry not found');
} else {
  const payload = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert(Array.isArray(payload), 'registry must be an array');

  if (Array.isArray(payload)) {
    const seen = new Set();

    payload.forEach((item, index) => {
      assert(item && typeof item === 'object', `entry[${index}] must be an object`);
      if (!item || typeof item !== 'object') return;

      const compositeId = `${String(item.family || '')}:${String(item.id || '')}`;
      assert(isNonEmptyString(item.id), `entry[${index}].id is required`);
      assert(!seen.has(compositeId), `duplicate practice id "${compositeId}"`);
      seen.add(compositeId);

      assert(VALID_FAMILIES.has(String(item.family)), `entry[${index}].family is invalid`);
      assert(isNonEmptyString(item.title), `entry[${index}].title is required`);
      assert(isNonEmptyString(item.route) && String(item.route).startsWith('/'), `entry[${index}].route is invalid`);
      assert(VALID_TECH.has(String(item.tech)), `entry[${index}].tech is invalid`);
      assert(VALID_DIFFICULTY.has(String(item.difficulty)), `entry[${index}].difficulty is invalid`);
      assert(VALID_ACCESS.has(String(item.access)), `entry[${index}].access is invalid`);
      assert(Array.isArray(item.tags), `entry[${index}].tags must be an array`);
      assert(typeof item.estimatedMinutes === 'number', `entry[${index}].estimatedMinutes must be numeric`);
      assert(isNonEmptyString(item.updatedAt), `entry[${index}].updatedAt is required`);
      assert(isNonEmptyString(item.schemaVersion), `entry[${index}].schemaVersion is required`);
      assert(isNonEmptyString(item.assetRef), `entry[${index}].assetRef is required`);

      const assetPath = String(item.assetRef).split('#')[0];
      assert(fs.existsSync(path.resolve('src', 'assets', assetPath)), `entry[${index}] assetRef does not exist: ${assetPath}`);
    });
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[lint-practice-registry] practice registry looks valid');
