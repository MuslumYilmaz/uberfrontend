#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(frontendRoot, '..');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

const reactCoding = readJson('cdn/questions/react/coding.json');
const javascriptCoding = readJson('cdn/questions/javascript/coding.json');
const angularCoding = readJson('cdn/questions/angular/coding.json');
const systemDesignIndex = readJson('cdn/questions/system-design/index.json');
const systemDesignMeta = readJson('cdn/questions/system-design/multi-step-form-autosave/meta.json');
const practiceRegistry = readJson('cdn/practice/registry.json');
const premiumPreviewCatalog = readJson('frontend/src/app/core/content/premium-preview-catalog.json');

const codingUnlock =
  'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.';
const systemDesignUnlock =
  'Premium unlocks the full architecture walkthrough, evaluation rubric, trade-offs, and failure-mode analysis.';

const required = [
  { id: 'react-contact-form-starter', record: reactCoding.find((item) => item.id === 'react-contact-form-starter'), unlock: codingUnlock },
  { id: 'js-throttle', record: javascriptCoding.find((item) => item.id === 'js-throttle'), unlock: codingUnlock },
  { id: 'js-promise-all', record: javascriptCoding.find((item) => item.id === 'js-promise-all'), unlock: codingUnlock },
  { id: 'react-use-effect-once', record: reactCoding.find((item) => item.id === 'react-use-effect-once'), unlock: codingUnlock },
  { id: 'angular-tabs-switcher', record: angularCoding.find((item) => item.id === 'angular-tabs-switcher'), unlock: codingUnlock },
  { id: 'multi-step-form-autosave', record: systemDesignIndex.find((item) => item.id === 'multi-step-form-autosave'), unlock: systemDesignUnlock },
  { id: 'multi-step-form-autosave meta', record: systemDesignMeta, unlock: systemDesignUnlock },
];

const forbiddenRawLabels = [
  'form interaction latency frontend interview',
  'multi-step form frontend system design rubric',
  'multi step form autosave system design mistakes',
];

const visibleGuideSources = [
  'frontend/src/app/features/system-design-list/system-design-detail/system-design-guide-link.util.ts',
  'frontend/src/app/features/guides/system-design/system-design-performance.ts',
  'frontend/src/app/features/guides/system-design/system-design-evaluation.ts',
  'frontend/src/app/features/guides/system-design/system-design-pitfalls.ts',
].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

const sentences = (value) => String(value || '').match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
const endsAsSentence = (value) => /[.!?]$/.test(String(value || '').trim());
const forbiddenVisibleSyntax = /(?:`|\*\*|<\/?[a-z][^>]*>|\[[^\]]+\]\([^)]*\)|(?:^|\s)(?:src|public|app|assets)\/|\b[\w-]+\.(?:html?|tsx?|jsx?|css|scss|json)\b|\{[^}]*\}|=>)/i;
const lowercaseTechnology = /\b(?:react|angular|vue|javascript|typescript|html|css)\b/;

for (const { id, record, unlock } of required) {
  assert.ok(record, `${id}: canonical record is missing`);
  const preview = record.premiumPreview;
  assert.ok(preview && typeof preview === 'object', `${id}: premiumPreview is required`);
  assert.deepEqual(Object.keys(preview).sort(), ['learningOutcomes', 'summary', 'unlockDescription'], `${id}: preview may only expose the canonical public fields`);

  const summary = String(preview.summary || '').trim();
  const outcomes = Array.isArray(preview.learningOutcomes) ? preview.learningOutcomes : [];
  const combined = [summary, ...outcomes, preview.unlockDescription].join(' ');

  assert.ok(summary, `${id}: summary is required`);
  assert.ok(sentences(summary).length >= 1 && sentences(summary).length <= 2, `${id}: summary must contain one or two complete sentences`);
  assert.ok(endsAsSentence(summary), `${id}: summary must end at a sentence boundary`);
  assert.ok(outcomes.length >= 3 && outcomes.length <= 5, `${id}: preview must contain three to five learning outcomes`);
  assert.ok(outcomes.every((outcome) => endsAsSentence(outcome)), `${id}: every learning outcome must be a complete sentence`);
  assert.equal(preview.unlockDescription, unlock, `${id}: unlock copy must use the non-spoiling canonical description`);

  const titlePrefix = String(record.title || '').trim().toLowerCase();
  assert.ok(!titlePrefix || !summary.toLowerCase().startsWith(`${titlePrefix}:`), `${id}: summary must not repeat the title as a prefix`);
  assert.doesNotMatch(combined, /….|\.{2,}/, `${id}: preview contains duplicated ellipsis punctuation`);
  assert.doesNotMatch(combined, /Expect .+ decisions under .+ constraints/i, `${id}: preview contains generator boilerplate`);
  assert.doesNotMatch(combined, forbiddenVisibleSyntax, `${id}: preview exposes markup, a path, filename, or code token`);
  assert.doesNotMatch(combined, lowercaseTechnology, `${id}: technology names must use proper capitalization`);
  assert.doesNotMatch(combined, /SOLUTION_SENTINEL|throw new Error|function\s*\(|return\s+new\s+Promise/i, `${id}: preview exposes solution material`);
  assert.ok(!Object.keys(preview).some((key) => /solution|answer|code/i.test(key)), `${id}: preview contract must not include solution fields`);

  if (!id.endsWith(' meta')) {
    const registryEntry = practiceRegistry.find((item) => item.id === id);
    assert.ok(registryEntry, `${id}: generated practice-registry entry is missing`);
    assert.equal(registryEntry.summary, preview.summary, `${id}: practice registry must prefer the complete authored preview summary`);
  }
}

for (const rawLabel of forbiddenRawLabels) {
  assert.ok(
    visibleGuideSources.every((source) => !source.toLowerCase().includes(rawLabel)),
    `Visible guide copy still contains raw SEO label: ${rawLabel}`,
  );
}

for (const relativePath of [
  'frontend/src/app/features/coding/coding-detail/coding-detail.component.html',
  'frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.html',
  'frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.html',
  'frontend/src/app/features/incidents/incident-detail/incident-detail.component.html',
  'frontend/src/app/features/tradeoffs/tradeoff-detail/tradeoff-detail.component.html',
]) {
  const template = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  assert.ok(template.includes('<app-locked-preview'), `${relativePath}: shared locked preview is missing`);
  assert.ok(!template.includes('data-testid="premium-preview"'), `${relativePath}: duplicated legacy teaser is still visible`);
}

const pricingSource = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/app/features/pricing/components/pricing-plans-section/pricing-plans-section.component.ts'),
  'utf8',
);
for (const route of [
  '/react/coding/react-contact-form-starter',
  '/system-design/multi-step-form-autosave',
  '/javascript/coding/js-throttle',
]) {
  assert.ok(pricingSource.includes(route), `Pricing preview link changed or disappeared: ${route}`);
}

const utilSource = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/app/core/utils/locked-preview.util.ts'),
  'utf8',
);
const compiledUtil = ts.transpileModule(utilSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const lockedPreviewBuilders = await import(
  `data:text/javascript;base64,${Buffer.from(compiledUtil).toString('base64')}`
);

const solutionFields = [
  'answer',
  'solution',
  'solutionAsset',
  'solutionAssetRef',
  'solutionTs',
  'solutionBlock',
  'tests',
  'frameworkTests',
];

const publicDescription = (description) => {
  if (typeof description === 'string') return description;
  if (!description || typeof description !== 'object') return description;
  return {
    summary: description.summary,
    specs: description.specs ? {
      requirements: description.specs.requirements,
      expectedBehavior: description.specs.expectedBehavior,
    } : undefined,
    arguments: Array.isArray(description.arguments)
      ? description.arguments.map((argument) => ({
          name: argument?.name,
          desc: argument?.desc,
        }))
      : undefined,
    returns: description.returns ? { desc: description.returns.desc } : undefined,
  };
};

const publicQuestion = (question, premiumPreview) => {
  const projected = {
    id: question.id,
    title: question.title,
    type: question.type,
    technology: question.technology,
    access: question.access,
    difficulty: question.difficulty,
    tags: question.tags,
    importance: question.importance,
    description: publicDescription(question.description),
    premiumPreview,
  };
  for (const field of solutionFields) {
    Object.defineProperty(projected, field, {
      configurable: false,
      enumerable: false,
      get() {
        throw new Error(`Locked preview attempted to read protected field: ${field}`);
      },
    });
  }
  return projected;
};

const completePreviewSentence = (value) => {
  const normalized = String(value || '').trim();
  const words = normalized.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  return words.length >= 3
    && /[.!?]$/.test(normalized)
    && !/^(?:and|or|but|because|while|which|that|where|when|with|without|using|including)\b/i.test(normalized);
};

const validateBuiltPreview = ({ key, title, preview }) => {
  assert.ok(preview, `${key}: locked-preview builder returned null`);
  assert.ok(completePreviewSentence(preview.what), `${key}: summary is not a complete sentence`);
  assert.ok(
    !preview.what.toLowerCase().startsWith(`${String(title || '').trim().toLowerCase()}:`),
    `${key}: summary repeats the title prefix`,
  );
  assert.ok(
    preview.learningGoals.length >= 3 && preview.learningGoals.length <= 5,
    `${key}: expected three to five learning outcomes`,
  );
  assert.ok(
    preview.learningGoals.every(completePreviewSentence),
    `${key}: an outcome is not a complete sentence`,
  );
  assert.ok(
    !preview.learningGoals.some((outcome) => outcome.toLowerCase() === preview.what.toLowerCase()),
    `${key}: summary is duplicated as an outcome`,
  );

  const visible = [preview.what, ...preview.learningGoals, preview.unlockDescription].join(' ');
  assert.doesNotMatch(visible, /….|\.{2,}|…/, `${key}: preview contains truncation punctuation`);
  assert.doesNotMatch(visible, /Expect .+ decisions under .+ constraints/i, `${key}: preview contains fallback boilerplate`);
  assert.doesNotMatch(visible, forbiddenVisibleSyntax, `${key}: preview exposes markup, a path, filename, or code token`);
  assert.doesNotMatch(visible, lowercaseTechnology, `${key}: technology names must use proper capitalization`);
  assert.doesNotMatch(visible, /SOLUTION_SENTINEL|throw new Error|function\s*\(|return\s+new\s+Promise/i, `${key}: preview exposes protected implementation material`);
};

const catalogTargets = new Map();
const corpusResults = [];
const techs = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];

for (const tech of techs) {
  for (const kind of ['coding', 'trivia']) {
    const records = readJson(`cdn/questions/${tech}/${kind}.json`);
    for (const question of records) {
      const key = `${tech}/${kind}/${question.id}`;
      catalogTargets.set(key, question);
      if (question.access !== 'premium') continue;

      const catalogPreview = premiumPreviewCatalog[key];
      assert.ok(
        !(question.premiumPreview && catalogPreview),
        `${key}: inline and catalog previews compete as canonical sources`,
      );
      const previewContent = question.premiumPreview || catalogPreview;
      const projected = publicQuestion(question, previewContent);
      const preview = kind === 'coding'
        ? lockedPreviewBuilders.buildLockedPreviewForCoding(projected, { candidates: records, tech, kind })
        : lockedPreviewBuilders.buildLockedPreviewForTrivia(projected, { candidates: records, tech, kind });
      corpusResults.push({ key, title: question.title, preview, source: previewContent ? 'authored' : 'fallback' });
    }
  }
}

for (const item of systemDesignIndex) {
  const key = `system-design/${item.id}`;
  catalogTargets.set(key, item);
  if (item.access !== 'premium') continue;

  const meta = readJson(`cdn/questions/system-design/${item.id}/meta.json`);
  const catalogPreview = premiumPreviewCatalog[key];
  const inlinePreview = meta.premiumPreview || item.premiumPreview;
  assert.ok(!(inlinePreview && catalogPreview), `${key}: inline and catalog previews compete as canonical sources`);
  const previewContent = inlinePreview || catalogPreview;
  const preview = lockedPreviewBuilders.buildLockedPreviewForSystemDesign({
    id: item.id,
    title: meta.title || item.title,
    description: meta.description || item.description,
    tags: meta.tags || item.tags || [],
    sectionTitles: (meta.sections || []).map((section) => section.title).filter(Boolean),
    premiumPreview: previewContent,
  }, { candidates: systemDesignIndex });
  corpusResults.push({ key, title: item.title, preview, source: previewContent ? 'authored' : 'fallback' });
}

const incidentIndex = readJson('cdn/incidents/index.json');
for (const item of incidentIndex.filter((candidate) => candidate.access === 'premium')) {
  corpusResults.push({
    key: `incident/${item.id}`,
    title: item.title,
    preview: lockedPreviewBuilders.buildLockedPreviewForIncident(item, incidentIndex),
    source: 'public-index',
  });
}

const tradeoffIndex = readJson('cdn/tradeoff-battles/index.json');
for (const item of tradeoffIndex.filter((candidate) => candidate.access === 'premium')) {
  corpusResults.push({
    key: `tradeoff/${item.id}`,
    title: item.title,
    preview: lockedPreviewBuilders.buildLockedPreviewForTradeoff(item, tradeoffIndex),
    source: 'public-index',
  });
}

for (const [key, preview] of Object.entries(premiumPreviewCatalog)) {
  const target = catalogTargets.get(key);
  assert.ok(target, `${key}: catalog entry does not match a canonical question`);
  assert.equal(target.access, 'premium', `${key}: catalog entry targets non-Premium content`);
  assert.deepEqual(
    Object.keys(preview).sort(),
    ['learningOutcomes', 'summary', 'unlockDescription'],
    `${key}: catalog entry may only expose the public preview contract`,
  );
  assert.ok(!Object.keys(preview).some((field) => /solution|answer|code|asset/i.test(field)), `${key}: catalog contains a protected field`);
  const registryEntry = practiceRegistry.find((item) => item.id === target.id);
  assert.ok(registryEntry, `${key}: generated practice-registry entry is missing`);
  assert.equal(
    registryEntry.summary,
    preview.summary,
    `${key}: runtime catalog and generated practice-registry summary have drifted`,
  );
}

const nullResults = corpusResults.filter((result) => !result.preview);
assert.deepEqual(
  nullResults.map((result) => result.key),
  [],
  `Premium locked-preview coverage is incomplete:\n${nullResults.map((result) => result.key).join('\n')}`,
);
for (const result of corpusResults) validateBuiltPreview(result);

const corpusCounts = corpusResults.reduce((counts, result) => {
  const surface = result.key.split('/')[0];
  counts[surface] = (counts[surface] || 0) + 1;
  return counts;
}, {});

console.log(
  `[premium-preview-content] corpus audit: ${corpusResults.length} locked pages, 0 null previews (${Object.entries(corpusCounts).map(([surface, count]) => `${surface}=${count}`).join(', ')})`,
);

console.log('[premium-preview-content] authored previews and visible labels are valid');
