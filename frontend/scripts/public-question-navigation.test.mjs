import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildPublicQuestionNavigation, publicQuestionNavigationText } from './public-question-navigation.mjs';
import { cdnPracticeRegistryPath, generatedAppDir } from './content-paths.mjs';

test('public navigation includes each free technology question and preserves debug routes', () => {
  const registry = JSON.parse(fs.readFileSync(cdnPracticeRegistryPath, 'utf8'));
  const entries = buildPublicQuestionNavigation(registry);
  const sitemap = fs.readFileSync('src/sitemap.xml', 'utf8');
  const publicQuestions = [...sitemap.matchAll(/<loc>https:\/\/frontendatlas\.com(\/(?:javascript|react|angular|vue|html|css)\/(?:coding|trivia|debug)\/[^<]+)<\/loc>/g)]
    .map((match) => match[1]).sort();
  assert.deepEqual(entries.map((entry) => entry.route).sort(), publicQuestions);
  assert.equal(new Set(entries.map((entry) => entry.route)).size, entries.length);
  assert(entries.some((entry) => entry.kind === 'debug' && entry.route.includes('/debug/')));
  assert.equal(fs.readFileSync(`${generatedAppDir}/public-question-navigation.ts`, 'utf8'), publicQuestionNavigationText(entries));
});

test('premium questions and non-question families never enter public directories', () => {
  const entry = { family: 'question', route: '/react/trivia/example', title: 'Example', access: 'free' };
  assert.deepEqual(buildPublicQuestionNavigation([
    { ...entry, access: 'premium' },
    { ...entry, family: 'incident' },
    { ...entry, route: '/system-design/example' },
  ]), []);
  assert.deepEqual(buildPublicQuestionNavigation([entry]), [
    { tech: 'react', kind: 'trivia', title: 'Example', route: '/react/trivia/example' },
  ]);
});

test('duplicate routes fail generation and alphabetical order is deterministic', () => {
  const entry = { family: 'question', route: '/vue/coding/a', title: 'Alpha', access: 'free' };
  assert.throws(() => buildPublicQuestionNavigation([entry, entry]), /Duplicate public question route/);
  const other = { ...entry, route: '/vue/coding/z', title: 'Zulu' };
  assert.deepEqual(buildPublicQuestionNavigation([other, entry]), buildPublicQuestionNavigation([entry, other]));
});
