#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER = path.join(repoRoot, 'frontend', 'scripts', 'lint-system-design-editorial-quality.mjs');

function writeJson(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function repeated(label, count) {
  return Array.from({ length: count }, (_, index) => (
    `${label} decision ${index + 1} explains ownership, user-visible behavior, recovery, keyboard focus, and measurable tradeoffs.`
  )).join(' ');
}

function baseBundle(id = 'example-system') {
  const description = 'Design a resilient frontend example with explicit state ownership, recovery behavior, and accessible interaction contracts.';
  const meta = {
    id,
    title: 'Example Frontend System Design',
    description,
    tags: ['frontend-architecture'],
    updatedAt: '2026-07-28',
    sections: [
      { key: 'R', title: 'Requirements', file: 'requirements.json' },
      { key: 'A', title: 'Architecture', file: 'architecture.json' },
      { key: 'D', title: 'Data', file: 'data.json' },
      { key: 'I', title: 'Interfaces', file: 'interfaces.json' },
      { key: 'O', title: 'Optimizations', file: 'optimizations.json' },
    ],
    seo: {
      title: 'Example Frontend System Design Interview Guide',
      description: 'Design a resilient frontend system with state ownership, recovery behavior, worked examples, and accessible interaction contracts.',
    },
    editorial: {
      factCheckedAt: '2026-07-28',
      reviewedBy: 'FrontendAtlas editorial',
      companyEvidence: [],
    },
  };
  const entry = {
    ...Object.fromEntries(['id', 'title', 'description', 'tags', 'updatedAt'].map((key) => [key, meta[key]])),
    type: 'system-design',
    access: 'free',
    difficulty: 'hard',
  };
  const section = (key, name) => ({
    key,
    title: name,
    blocks: [
      { type: 'heading', text: 'Worked example: one event through the client' },
      {
        type: 'text',
        text: `${repeated(name, 55)} The server is an abstract ${name.toLowerCase()} contract; implementation remains outside this frontend design.`,
      },
      {
        type: 'code',
        language: 'typescript',
        code: 'interface ViewState { status: string; version: number }',
        validation: {
          kind: ['Data', 'Interfaces'].includes(name) ? 'contract' : 'example',
          level: ['Data', 'Interfaces'].includes(name) ? 'typecheck' : 'syntax',
          ...(['Data', 'Interfaces'].includes(name) ? { group: 'view-model' } : {}),
        },
      },
      {
        type: 'table',
        title: 'Scenario walkthrough',
        columns: ['Event', 'UI result'],
        rows: [['Request fails', 'Show an error state and keep retry available.']],
      },
    ],
  });
  const sections = {
    requirements: section('R', 'Requirements'),
    architecture: section('A', 'Architecture'),
    data: section('D', 'Data'),
    interfaces: section('I', 'Interfaces'),
    optimizations: section('O', 'Optimizations'),
  };
  sections.architecture.blocks.unshift({
    type: 'callout',
    title: 'Canonical client model',
    text: 'One normalized view state owns accepted server revisions while selectors derive presentation state.',
    editorialRole: 'canonical-model',
  });
  sections.optimizations.blocks.push({
    type: 'callout',
    title: 'Interview answer checkpoint',
    text: 'Explain state ownership, ordering, recovery, measurement, and accessible focus behavior.',
    editorialRole: 'answer-checkpoint',
  });
  sections.optimizations.blocks.push({
    type: 'links',
    title: 'Technical references',
    editorialRole: 'references',
    items: [
      { label: 'WAI-ARIA APG', href: 'https://www.w3.org/WAI/ARIA/apg/' },
      { label: 'MDN AbortController', href: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
    ],
  });
  return { entry, meta, sections };
}

function writeManifest(root, ids) {
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: Object.fromEntries(ids.map((id) => [
      id,
      {
        assertions: [
          {
            id: 'worked-example',
            target: 'visible',
            require: ['worked example'],
          },
        ],
      },
    ])),
  });
}

function setup(mutator) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'system-design-quality-'));
  const bundle = baseBundle();
  mutator?.(bundle);
  writeJson(root, 'index.json', [bundle.entry]);
  writeJson(root, `${bundle.entry.id}/meta.json`, bundle.meta);
  Object.entries(bundle.sections).forEach(([name, data]) => writeJson(root, `${bundle.entry.id}/${name}.json`, data));
  writeManifest(root, [bundle.entry.id]);
  return root;
}

function run(root, mode = 'full') {
  return spawnSync('node', [LINTER, `--mode=${mode}`], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      SYSTEM_DESIGN_DIR: root,
      SYSTEM_DESIGN_SEMANTIC_CONTRACTS: path.join(root, 'semantic-contracts.json'),
    },
  });
}

function expectFailure(mutator, expected, mode = 'full') {
  const result = run(setup(mutator), mode);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, expected);
}

assert.equal(run(setup(), 'structure').status, 0);
{
  const result = run(setup(), 'full');
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
}

expectFailure(({ sections }) => {
  sections.architecture.blocks.push({ type: 'diagram', nodes: [] });
}, /unsupported block type/, 'structure');

expectFailure(({ sections }) => {
  sections.requirements.blocks[1].text = '**Raw emphasis** is not rendered.';
}, /raw Markdown bold/, 'structure');

expectFailure(({ sections }) => {
  const references = sections.optimizations.blocks.at(-1);
  references.items[0].label = '**Raw source label**';
}, /raw Markdown bold/, 'structure');

expectFailure(({ entry }) => {
  entry.title = 'Different index title';
}, /index\/meta title mismatch/, 'structure');

expectFailure(({ entry, meta }) => {
  entry.updatedAt = '2026-02-30';
  meta.updatedAt = entry.updatedAt;
}, /updatedAt must be a valid/, 'structure');

expectFailure(({ meta }) => {
  meta.sections = meta.sections.filter((section) => section.file !== 'data.json');
}, /meta\.sections must declare all 5 RADIO files/, 'structure');

expectFailure(({ meta }) => {
  meta.sections[0].title = 'Reflect and Requirements';
}, /legacy or incorrect RADIO section name/, 'structure');

expectFailure(({ sections }) => {
  sections.architecture.title = 'Architecture Diagram';
}, /legacy or incorrect RADIO section name/, 'structure');

expectFailure(({ meta }) => {
  meta.seo.description = 'Too short.';
}, /seo\.description must be 80-155/, 'structure');

expectFailure(({ entry, meta }) => {
  entry.companies = ['example'];
  meta.companies = ['example'];
}, /companyEvidence/, 'structure');

expectFailure(({ entry }) => {
  entry.access = 'premium';
}, /require meta\.premiumPreview/, 'structure');

expectFailure(({ entry }) => {
  entry.premiumPreview = {
    summary: 'An inline duplicate preview.',
    learningOutcomes: ['One', 'Two', 'Three'],
    unlockDescription: 'Unlock it.',
  };
}, /must live only in meta\.json/, 'structure');

{
  const root = setup(({ entry, meta }) => {
    entry.access = 'premium';
    meta.premiumPreview = {
      summary: 'Explore resilient state ownership, recovery behavior, and accessible interaction contracts.',
      learningOutcomes: [
        'Separate authoritative state ownership from derived presentation.',
        'Recover failed requests without losing accessible interaction state.',
        'Measure resilient rendering and keyboard behavior.',
      ],
      unlockDescription: 'Unlock the complete worked example and trade-off analysis.',
    };
  });
  assert.equal(run(root).status, 0);
}

expectFailure(({ entry, meta }) => {
  entry.access = 'premium';
  meta.premiumPreview = {
    summary: 'Explore resilient state ownership and recovery behavior.',
    learningOutcomes: [
      'Separate authoritative state ownership.',
      'Recover failed requests safely.',
      'Measure accessible interaction behavior.',
    ],
    unlockDescription: 'Unlock the complete solution.',
    solution: 'This protected field must not be public.',
  };
}, /may expose only summary, learningOutcomes, and unlockDescription/, 'structure');

expectFailure(({ entry, meta }) => {
  entry.access = 'premium';
  meta.premiumPreview = {
    summary: 'Practice colorful gardening ideas for a peaceful outdoor weekend.',
    learningOutcomes: [
      'Choose seasonal flowers.',
      'Arrange decorative planters.',
      'Maintain healthy garden soil.',
    ],
    unlockDescription: 'Unlock the complete lesson.',
  };
}, /does not semantically overlap/, 'structure');

expectFailure(({ sections }) => {
  Object.values(sections).forEach((section) => {
    section.blocks[1].text = 'Thin content with keyboard recovery and an abstract backend contract.';
  });
}, /visible words|is thin/);

expectFailure(({ sections }) => {
  sections.optimizations.blocks = sections.optimizations.blocks.filter((block) => block.type !== 'links');
}, /at least two external HTTPS technical sources/);

expectFailure(({ sections }) => {
  const references = sections.optimizations.blocks.at(-1);
  references.items = references.items.slice(0, 1);
  sections.architecture.blocks.push({
    type: 'links',
    title: 'Further reading',
    items: [{ label: 'History API', href: 'https://developer.mozilla.org/en-US/docs/Web/API/History_API' }],
  });
}, /terminal references block requires at least two unique HTTPS/);

expectFailure(({ sections }) => {
  sections.architecture.blocks.push({
    type: 'heading',
    text: 'Technical references',
  });
}, /duplicates the terminal references section/);

expectFailure(({ sections }) => {
  sections.architecture.blocks.unshift({
    type: 'text',
    text: 'A useful framing: list a store, a component, and a transport without connecting them to user-visible behavior.',
  });
}, /formulaic or mechanically incorrect prose/);

expectFailure(({ sections }) => {
  sections.data.blocks.unshift({
    type: 'heading',
    text: 'State ownership and invariants',
  });
}, /formulaic or mechanically incorrect prose/);

expectFailure(({ sections }) => {
  sections.interfaces.blocks.unshift({
    type: 'heading',
    text: 'Interface decisions to make explicit',
  });
}, /meta-authoring title/, 'structure');

expectFailure(({ sections }) => {
  sections.requirements.blocks.unshift({
    type: 'text',
    text: 'RADIO stands for Reflect, Assumptions, Diagram, Interface, and Operations.',
  });
}, /legacy or incorrect expansion/);

expectFailure(({ sections }) => {
  sections.architecture.blocks[0].editorialRole = undefined;
}, /exactly one canonical-model/);

expectFailure(({ sections }) => {
  sections.optimizations.blocks.push({ type: 'text', text: 'A trailing section after the sources.' });
}, /final optimizations block must be links/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.language = 'text';
  block.code = 'EVENT: run.completed\nDATA: {"runId":"run_1"}';
  block.validation = {
    kind: 'protocol',
    protocol: 'sse',
    dataFormat: 'json',
  };
}, /case-invalid SSE field/);

{
  const root = setup(({ sections }) => {
    const block = sections.requirements.blocks.find((item) => item.type === 'code');
    block.language = 'text';
    block.code = 'event: run.completed\ndata: {"runId":"run_1"}';
    block.validation = {
      kind: 'protocol',
      protocol: 'sse',
      dataFormat: 'json',
    };
  });
  assert.equal(run(root).status, 0);
}

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.language = 'text';
  block.code = 'Event: run.completed\nData: {"runId":"run_1"}';
  block.validation = {
    kind: 'protocol',
    protocol: 'sse',
    dataFormat: 'json',
  };
}, /case-invalid SSE field/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.language = 'text';
  block.code = 'event: run.started\ndata: {"runId":"run_1"}\nevent: run.completed\ndata: {"runId":"run_1"}';
  block.validation = {
    kind: 'protocol',
    protocol: 'sse',
    dataFormat: 'json',
  };
}, /multiple event fields without a blank record separator/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.language = 'text';
  block.code = 'event: run.completed\ndata: {not-json}';
  block.validation = {
    kind: 'protocol',
    protocol: 'sse',
    dataFormat: 'json',
  };
}, /SSE data payload is not valid JSON/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.language = 'http';
  block.code = 'POST /api/runs\nBad Header\n\n{\"runId\":\"run_1\",}';
  block.validation = {
    kind: 'protocol',
    protocol: 'http',
  };
}, /not a valid HTTP header|JSON body .* is invalid/);

{
  const root = setup(({ sections }) => {
    const block = sections.requirements.blocks.find((item) => item.type === 'code');
    block.language = 'http';
    block.code = 'POST /api/runs\nContent-Type: application/json\n\n{\"runId\":\"run_1\"}\n\n202 Accepted\nLocation: /api/runs/run_1\n\n{\"status\":\"running\"}';
    block.validation = {
      kind: 'protocol',
      protocol: 'http',
    };
  });
  assert.equal(run(root).status, 0);
}

expectFailure(({ sections }) => {
  sections.optimizations.blocks.unshift({
    type: 'text',
    text: 'When overloaded, drop low-priority notification events before they enter the entity store.',
  });
}, /unsafe loss/);

expectFailure(({ sections }) => {
  sections.optimizations.blocks.unshift({
    type: 'text',
    text: 'When rendering is busy, drop notification events to protect the next visual frame.',
  });
}, /unsafe loss/);

{
  const root = setup(({ sections }) => {
    sections.optimizations.blocks.unshift({
      type: 'text',
      text: 'Do not drop notification events; coalesce only derived visual paint work after the store commits.',
    });
  });
  assert.equal(run(root).status, 0);
}

expectFailure(({ meta }) => {
  meta.editorial.factCheckedAt = '2026-02-30';
}, /factCheckedAt must be a valid/);

expectFailure(({ meta }) => {
  meta.editorial.factCheckedAt = '2099-01-01';
}, /factCheckedAt cannot be in the future/);

expectFailure(({ meta }) => {
  meta.editorial.factCheckedAt = '2020-01-01';
}, /fact-check is .* days old/);

expectFailure(({ sections }) => {
  sections.optimizations.blocks.unshift({
    type: 'text',
    text: 'The renderer must always finish within 16ms on every device.',
  });
}, /unqualified numeric performance rule/);

expectFailure(({ sections }) => {
  sections.optimizations.blocks.unshift({
    type: 'text',
    text: 'Virtualize after 100 items.',
  });
}, /unqualified numeric performance rule/);

{
  const root = setup(({ sections }) => {
    sections.optimizations.blocks.unshift({
      type: 'text',
      text: 'Treat 16ms as an initial hypothesis, then measure p75 by device class.',
    });
  });
  assert.equal(run(root).status, 0);
}

expectFailure(({ sections }) => {
  const block = sections.data.blocks.find((item) => item.type === 'code');
  block.code = 'interface ViewState { status: string;';
}, /invalid TypeScript syntax|strict TypeScript contract/);

expectFailure(({ sections }) => {
  const dataBlock = sections.data.blocks.find((item) => item.type === 'code');
  const interfaceBlock = sections.interfaces.blocks.find((item) => item.type === 'code');
  dataBlock.code = "interface ViewState { status: 'complete'; version: number }";
  interfaceBlock.code = "function renderView(state: ViewState) { return state.status === 'uploaded'; }";
}, /fails strict TypeScript contract checking/);

expectFailure(({ sections }) => {
  const block = sections.architecture.blocks.find((item) => item.type === 'code');
  block.code = 'interface ViewState { status: number; version: number }';
}, /defines incompatible versions of ViewState/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.validation = { kind: 'pseudocode' };
}, /pseudocode must use language "text"/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  delete block.validation;
}, /requires validation metadata/);

expectFailure(({ sections }) => {
  const block = sections.requirements.blocks.find((item) => item.type === 'code');
  block.code = '// TODO: replace placeholder contract\ninterface ViewState { status: string; version: number }';
}, /code contains an unresolved placeholder/, 'structure');

{
  const root = setup();
  writeManifest(root, []);
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /semantic contract coverage must exactly match/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        assertions: [{
          id: 'invalid-pattern',
          target: 'visible',
          require: ['['],
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /invalid regular expression/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        assertions: {
          id: 'not-an-array',
          require: ['worked example'],
        },
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /assertions must be an array/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        assertions: [{
          id: 'empty-sections',
          sections: [],
          require: ['worked example'],
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /sections must be a non-empty array/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        assertions: [{
          id: 'wrong-require-shape',
          require: 'worked example',
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /require must be an array/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        symbols: [{
          group: 'view-model',
          name: 'ViewState',
          requiredMembers: 'status',
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /requiredMembers must be an array/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        symbols: [{
          group: 'missing-contract',
          name: 'ViewState',
          requiredMembers: ['status'],
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /unknown typechecked group/);
}

{
  const root = setup();
  writeJson(root, 'semantic-contracts.json', {
    version: 1,
    questions: {
      'example-system': {
        symbols: [{
          group: 'view-model',
          name: 'ViewState',
          requiredMembers: ['status', 'missingMember'],
        }],
      },
    },
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /is missing member missingMember/);
}

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'system-design-quality-duplicates-'));
  const first = baseBundle('first-system');
  const second = baseBundle('second-system');
  second.meta.title = 'Second Frontend System Design';
  second.entry.title = second.meta.title;
  second.meta.seo.title = 'Second Frontend System Design Interview Guide';
  second.meta.seo.description = 'Explore a second resilient frontend system with explicit state, recovery paths, worked examples, and accessible interaction contracts.';
  first.sections.requirements.blocks[1].text = `A deliberately duplicated sentence explains a sufficiently long and specific frontend architectural decision for both examples. ${first.sections.requirements.blocks[1].text}`;
  second.sections.requirements.blocks[1].text = `A deliberately duplicated sentence explains a sufficiently long and specific frontend architectural decision for both examples. ${second.sections.requirements.blocks[1].text}`;
  writeJson(root, 'index.json', [first.entry, second.entry]);
  for (const bundle of [first, second]) {
    writeJson(root, `${bundle.entry.id}/meta.json`, bundle.meta);
    Object.entries(bundle.sections).forEach(([name, data]) => writeJson(root, `${bundle.entry.id}/${name}.json`, data));
  }
  writeManifest(root, [first.entry.id, second.entry.id]);
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /duplicates a long visible sentence/);
}

console.log('System-design editorial quality fixture tests passed.');
