#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { cdnQuestionsDir, frontendRoot } from './content-paths.mjs';

const SYSTEM_DESIGN_DIR = path.resolve(
  process.env.SYSTEM_DESIGN_DIR || path.join(cdnQuestionsDir, 'system-design'),
);
const CONTRACTS_PATH = path.resolve(
  process.env.SYSTEM_DESIGN_SEMANTIC_CONTRACTS
    || path.join(frontendRoot, 'scripts', 'system-design-semantic-contracts.json'),
);
const MODE_ARG = process.argv.find((arg) => arg.startsWith('--mode='));
const MODE = MODE_ARG ? MODE_ARG.slice('--mode='.length) : 'full';
const VALID_MODES = new Set(['structure', 'full']);
const REQUIRED_SECTIONS = ['requirements', 'architecture', 'data', 'interfaces', 'optimizations'];
const RADIO_KEYS = {
  requirements: 'R',
  architecture: 'A',
  data: 'D',
  interfaces: 'I',
  optimizations: 'O',
};
const RADIO_TITLE_WORDS = {
  requirements: /\brequirements?\b/i,
  architecture: /\barchitecture\b/i,
  data: /\bdata\b/i,
  interfaces: /\binterfaces?\b/i,
  optimizations: /\boptimizations?\b/i,
};
const LEGACY_RADIO_TITLE_WORDS = /\b(?:reflect|assumptions?|diagram|decide|implement|outcome|operations?)\b/i;
const SUPPORTED_BLOCKS = new Set([
  'text',
  'heading',
  'code',
  'image',
  'checklist',
  'callout',
  'links',
  'table',
  'divider',
  'columns',
  'stats',
  'steps',
]);
const EDITORIAL_ROLES = new Set(['canonical-model', 'answer-checkpoint', 'references']);
const CODE_VALIDATION_KINDS = new Set([
  'contract',
  'example',
  'protocol',
  'data',
  'diagram',
  'pseudocode',
]);
const TS_LANGUAGES = new Set(['ts', 'typescript', 'tsx']);
const SHARED_FIELDS = ['id', 'title', 'description', 'tags', 'companies', 'updatedAt'];
const MIN_TOTAL_WORDS = 2000;
const MIN_SECTION_WORDS = {
  requirements: 250,
  architecture: 300,
  data: 180,
  interfaces: 180,
  optimizations: 250,
};
const STALE_AFTER_DAYS = 365;
const PREVIEW_STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'before', 'between', 'client', 'design',
  'frontend', 'from', 'into', 'learn', 'system', 'that', 'their', 'these',
  'this', 'through', 'using', 'while', 'with', 'without',
]);
const FORMULAIC_PROSE_PATTERNS = [
  /\bA useful framing\b/i,
  /\bDecision criteria\b/i,
  /\bHow you should\b/i,
  /\bYou should\b/i,
  /\bWhat you say out loud\b/i,
  /\bKey message to land\b/i,
  /\bExpected interview answer shape\b/i,
  /\bSmart clarifying questions\b/i,
  /\b(?:Strong|Weak) answer\b/i,
  /\bWhat the interviewer (?:listens for|is testing)\b/i,
  /\bYou want the interviewer\b/i,
  /\bThis step should describe\b/i,
  /\bThis question tests your ability\b/i,
  /\bGround the design in\b[^.!?]{0,120}\brather than naming\b/i,
  /\brather than naming what\b[^.!?]{0,80}\bis alone\b/i,
  /\bRestate the goal\b/i,
  /\bThis is a high-volume feed UI\b/i,
  /\bWhat sinks candidates\b/i,
  /\bThe answer\b/i,
  /\bAt a high level,\s+Use\b/i,
  /\bStart by\s+(?:ship|batch|define|model|use|build|create|keep|store|render|measure)\b/i,
  /\bThe design(?:\s+clearly)?\s+(?:describe|show|separate|keep|need|have|care|think)\b/i,
  /\bmust design a UI\b/i,
  /\bJSON\.stringifys\b/i,
  /\bA Defensible decision\b/,
  /\bDeep dive scenario you can walk through\b/i,
  /\bOptimization levers to mention\b/i,
  /\bCommon data model gaps\b/i,
  /\bFailure modes to watch for\b/i,
  /\bInterface\s*\/\s*endpoint\b/i,
  /\b(?:Architecture|Resilience) checkpoint\b/i,
  /\b(?:Architecture summary|Architecture sketch|Architecture signal|Architecture trap)\b/i,
  /\b(?:Key message|Explain the data flow|What the example proves|Design principle)\b/i,
  /\bState ownership and invariants\b/i,
  /\bFailure and recovery matrix\b/i,
  /\bEnd-to-end interface path\b/i,
  /\bMeasurement and resilience checks\b/i,
  /\bNon-functional expectations to confirm\b/i,
  /\bDecisions to make explicit\b/i,
  /\bHigh-level user flow to describe\b/i,
  /\bPrivate implementation details\b/i,
  /\bArchitecture red flags to avoid\b/i,
  /\bMeasured optimization path\b/i,
  /\bData-model mistakes to avoid\b/i,
  /\bDeep dive:\s*preventing jank\b/i,
  /\bThis (?:requirements|architecture|data|interfaces?|optimizations?) section connects\b/i,
  /\bThe backend remains an abstract service contract and is out of scope\b/i,
  /\bI(?:'d| would| recommend| prefer| treat| start| keep| use)\b/i,
];
const errors = [];
const warnings = [];

function rel(filePath) {
  return path.relative(frontendRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function reportDuplicateJsonKeys(filePath, text) {
  const source = ts.parseJsonText(filePath, text);

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const seen = new Set();
      node.properties.forEach((property) => {
        if (!ts.isPropertyAssignment(property)) return;
        const name = property.name;
        const key = (
          ts.isStringLiteral(name)
          || ts.isNumericLiteral(name)
          || ts.isIdentifier(name)
        ) ? name.text : '';
        if (!key) return;
        if (seen.has(key)) {
          const { line } = source.getLineAndCharacterOfPosition(name.getStart(source));
          addError(`${rel(filePath)} contains duplicate JSON key ${JSON.stringify(key)} at line ${line + 1}`);
        } else {
          seen.add(key);
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
}

function readJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    reportDuplicateJsonKeys(filePath, text);
    return JSON.parse(text);
  } catch (error) {
    addError(`${rel(filePath)} could not be parsed: ${error.message}`);
    return null;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalized(value) {
  if (Array.isArray(value)) return value.map((item) => normalized(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalized(child)]),
    );
  }
  return value ?? null;
}

function equal(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(value) {
  const text = normalizeText(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function inspectPlainString(value, label) {
  if (!isNonEmptyString(value)) return;
  const text = String(value);
  const markdownSignals = [
    [/\*\*[^*\n]+\*\*/, 'Markdown bold'],
    [/`[^`\n]+`/, 'Markdown inline code'],
    [/\[[^\]\n]+\]\([^)]+\)/, 'Markdown link'],
    [/^\s{0,3}#{1,6}\s+\S/m, 'Markdown heading'],
  ];
  for (const [pattern, name] of markdownSignals) {
    if (pattern.test(text)) addError(`${label} contains raw ${name} syntax that the renderer does not parse`);
  }
  if (/\b(?:TODO|TBD|VERIFY)\b/.test(text) || /\[(?:placeholder|add [^\]]+)\]/i.test(text)) {
    addError(`${label} contains an unresolved placeholder`);
  }
}

function requireString(block, field, label) {
  if (!isNonEmptyString(block?.[field])) addError(`${label}.${field} must be a non-empty string`);
}

function validatePlainFields(block, label) {
  const fieldsByType = {
    text: ['text'],
    heading: ['text'],
    image: ['alt', 'caption'],
    checklist: ['title', 'items'],
    callout: ['title', 'text'],
    links: ['title', 'items'],
    table: ['title', 'columns', 'rows'],
    stats: ['items'],
    steps: ['title', 'steps'],
  };

  function visit(value, valueLabel) {
    if (typeof value === 'string') {
      inspectPlainString(value, valueLabel);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${valueLabel}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => visit(child, `${valueLabel}.${key}`));
  }

  for (const field of fieldsByType[block.type] || []) {
    if (block[field] !== undefined) visit(block[field], `${label}.${field}`);
  }
}

function validateCodeMetadataShape(block, label) {
  const validation = block.validation;
  if (validation === undefined) return;
  if (!validation || typeof validation !== 'object' || Array.isArray(validation)) {
    addError(`${label}.validation must be an object`);
    return;
  }
  if (!CODE_VALIDATION_KINDS.has(validation.kind)) {
    addError(`${label}.validation.kind must be one of ${[...CODE_VALIDATION_KINDS].join(', ')}`);
  }
  if (validation.level !== undefined && !['syntax', 'typecheck'].includes(validation.level)) {
    addError(`${label}.validation.level must be syntax or typecheck`);
  }
  if (validation.group !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(validation.group))) {
    addError(`${label}.validation.group must be a kebab-case identifier`);
  }
  if (validation.protocol !== undefined && !['sse', 'http'].includes(validation.protocol)) {
    addError(`${label}.validation.protocol must be sse or http`);
  }
  if (validation.dataFormat !== undefined && validation.dataFormat !== 'json') {
    addError(`${label}.validation.dataFormat currently supports only json`);
  }
}

function validateBlock(block, label) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    addError(`${label} must be an object`);
    return;
  }
  if (!SUPPORTED_BLOCKS.has(block.type)) {
    addError(`${label} uses unsupported block type ${JSON.stringify(block.type)}`);
    return;
  }
  if (block.editorialRole !== undefined && !EDITORIAL_ROLES.has(block.editorialRole)) {
    addError(`${label}.editorialRole must be one of ${[...EDITORIAL_ROLES].join(', ')}`);
  }
  const blockTitle = block.type === 'heading' ? block.text : block.title;
  if (
    isNonEmptyString(blockTitle)
    && /\b(?:to mention|to call out|to describe|you can bring up|to confirm|make explicit)\b/i.test(blockTitle)
  ) {
    addError(`${label} uses a meta-authoring title instead of a domain-specific reader title`);
  }

  if (block.type === 'text' || block.type === 'heading') requireString(block, 'text', label);
  if (block.type === 'code') {
    requireString(block, 'code', label);
    if (
      /\b(?:TODO|TBD|VERIFY)\b/.test(String(block.code || ''))
      || /\[(?:placeholder|add [^\]]+)\]/i.test(String(block.code || ''))
    ) {
      addError(`${label}.code contains an unresolved placeholder`);
    }
    validateCodeMetadataShape(block, label);
  }
  if (block.type === 'image') {
    requireString(block, 'src', label);
    if (typeof block.alt !== 'string') addError(`${label}.alt must be a string`);
  }
  if (block.type === 'checklist') {
    if (!Array.isArray(block.items) || !block.items.length || block.items.some((item) => !isNonEmptyString(item))) {
      addError(`${label}.items must contain non-empty strings`);
    }
  }
  if (block.type === 'callout') requireString(block, 'text', label);
  if (block.type === 'links') {
    if (!Array.isArray(block.items) || !block.items.length) {
      addError(`${label}.items must contain at least one link`);
    } else {
      block.items.forEach((item, index) => {
        requireString(item, 'label', `${label}.items[${index}]`);
        requireString(item, 'href', `${label}.items[${index}]`);
      });
    }
  }
  if (block.type === 'table') {
    if (!Array.isArray(block.columns) || !block.columns.length) {
      addError(`${label}.columns must be a non-empty array`);
    }
    if (!Array.isArray(block.rows) || !block.rows.length) {
      addError(`${label}.rows must be a non-empty array`);
    } else if (Array.isArray(block.columns)) {
      block.rows.forEach((row, index) => {
        if (!Array.isArray(row) || row.length !== block.columns.length) {
          addError(`${label}.rows[${index}] must match the table column count`);
        }
      });
    }
  }
  if (block.type === 'columns') {
    if (!Array.isArray(block.columns) || !block.columns.length) {
      addError(`${label}.columns must contain at least one column`);
    } else {
      block.columns.forEach((column, columnIndex) => {
        if (!Array.isArray(column?.blocks) || !column.blocks.length) {
          addError(`${label}.columns[${columnIndex}].blocks must be a non-empty array`);
          return;
        }
        column.blocks.forEach((inner, blockIndex) => (
          validateBlock(inner, `${label}.columns[${columnIndex}].blocks[${blockIndex}]`)
        ));
      });
    }
  }
  if (block.type === 'stats') {
    if (!Array.isArray(block.items) || !block.items.length) {
      addError(`${label}.items must contain at least one stat`);
    } else {
      block.items.forEach((item, index) => {
        requireString(item, 'label', `${label}.items[${index}]`);
        requireString(item, 'value', `${label}.items[${index}]`);
      });
    }
  }
  if (block.type === 'steps') {
    if (!Array.isArray(block.steps) || !block.steps.length) {
      addError(`${label}.steps must contain at least one step`);
    } else {
      block.steps.forEach((step, index) => requireString(step, 'title', `${label}.steps[${index}]`));
    }
  }

  validatePlainFields(block, label);
}

function visibleStringsForBlock(block) {
  const values = [];
  const add = (candidate, field) => {
    if (isNonEmptyString(candidate)) values.push({ text: candidate, field });
  };
  if (block.type === 'text' || block.type === 'heading') add(block.text, 'text');
  if (block.type === 'image') {
    add(block.alt, 'alt');
    add(block.caption, 'caption');
  }
  if (block.type === 'checklist') {
    add(block.title, 'title');
    (block.items || []).forEach((item, index) => add(item, `items[${index}]`));
  }
  if (block.type === 'callout') {
    add(block.title, 'title');
    add(block.text, 'text');
  }
  if (block.type === 'links') {
    add(block.title, 'title');
    (block.items || []).forEach((item, index) => {
      add(item?.label, `items[${index}].label`);
      add(item?.description, `items[${index}].description`);
    });
  }
  if (block.type === 'table') {
    add(block.title, 'title');
    (block.columns || []).forEach((item, index) => add(item, `columns[${index}]`));
    (block.rows || []).forEach((row, rowIndex) => (
      (row || []).forEach((item, columnIndex) => add(item, `rows[${rowIndex}][${columnIndex}]`))
    ));
  }
  if (block.type === 'stats') {
    (block.items || []).forEach((item, index) => {
      add(item?.label, `items[${index}].label`);
      add(item?.value, `items[${index}].value`);
      add(item?.helperText, `items[${index}].helperText`);
    });
  }
  if (block.type === 'steps') {
    add(block.title, 'title');
    (block.steps || []).forEach((step, index) => {
      add(step?.title, `steps[${index}].title`);
      add(step?.text, `steps[${index}].text`);
    });
  }
  return values;
}

function collectBlockEntries(sections) {
  const out = [];
  function visit(blocks, section, prefix) {
    if (!Array.isArray(blocks)) return;
    blocks.forEach((block, index) => {
      if (!block || typeof block !== 'object') return;
      const label = `${prefix}[${index}]`;
      out.push({ block, label, section });
      if (block.type === 'columns') {
        (block.columns || []).forEach((column, columnIndex) => (
          visit(column?.blocks, section, `${label}.columns[${columnIndex}].blocks`)
        ));
      }
    });
  }
  REQUIRED_SECTIONS.forEach((section) => {
    visit(
      sections[section]?.blocks,
      section,
      `${section}.json blocks`,
    );
  });
  return out;
}

function collectVisibleRecords(blockEntries) {
  return blockEntries.flatMap(({ block, label, section }) => (
    visibleStringsForBlock(block).map(({ text, field }) => ({
      text,
      label: `${label}.${field}`,
      section,
      role: block.editorialRole,
      blockType: block.type,
    }))
  ));
}

function externalSourceCount(blockEntries) {
  const urls = new Set();
  blockEntries
    .filter(({ block }) => block.type === 'links')
    .flatMap(({ block }) => block.items || [])
    .forEach((item) => {
      if (/^https:\/\//i.test(String(item?.href || ''))) urls.add(String(item.href));
    });
  return urls.size;
}

function parseDate(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return null;
  return date;
}

function validateCompanyEvidence(id, meta, companies) {
  const evidence = Array.isArray(meta?.editorial?.companyEvidence)
    ? meta.editorial.companyEvidence
    : [];
  const evidenceCompanies = evidence.map((item) => item?.company).filter(Boolean).sort();
  const sortedCompanies = [...companies].sort();
  if (!equal(evidenceCompanies, sortedCompanies)) {
    addError(`${id} companies must exactly match editorial.companyEvidence entries`);
  }
  evidence.forEach((item, index) => {
    const label = `${id} editorial.companyEvidence[${index}]`;
    if (item?.evidenceType !== 'reported-interview-question') {
      addError(`${label}.evidenceType must be "reported-interview-question"`);
    }
    if (!/^https:\/\//i.test(String(item?.sourceUrl || ''))) addError(`${label}.sourceUrl must be HTTPS`);
    requireString(item, 'sourceTitle', label);
    const checkedAt = parseDate(item?.checkedAt);
    if (!checkedAt) addError(`${label}.checkedAt must be a valid YYYY-MM-DD date`);
    else if (checkedAt.getTime() > Date.now()) addError(`${label}.checkedAt cannot be in the future`);
  });
}

function validateSeo(id, meta, seenSeoTitles, seenSeoDescriptions) {
  const title = String(meta?.seo?.title || '');
  const description = String(meta?.seo?.description || '');
  if (!title) addError(`${id} requires an explicit seo.title`);
  else if (title.length > 70) addError(`${id} seo.title is ${title.length} characters; maximum is 70`);
  if (description.length < 80 || description.length > 155) {
    addError(`${id} seo.description must be 80-155 characters (found ${description.length})`);
  }
  const titleKey = normalizeText(title).toLowerCase();
  const descriptionKey = normalizeText(description).toLowerCase();
  if (titleKey) {
    if (seenSeoTitles.has(titleKey)) addError(`${id} duplicates seo.title from ${seenSeoTitles.get(titleKey)}`);
    else seenSeoTitles.set(titleKey, id);
  }
  if (descriptionKey) {
    if (seenSeoDescriptions.has(descriptionKey)) {
      addError(`${id} duplicates seo.description from ${seenSeoDescriptions.get(descriptionKey)}`);
    } else {
      seenSeoDescriptions.set(descriptionKey, id);
    }
  }
}

function distinctiveTokens(value) {
  return new Set(
    normalizeText(value)
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= 5 && !PREVIEW_STOP_WORDS.has(token)),
  );
}

function validatePremiumPreview(id, entry, meta) {
  if (entry.premiumPreview !== undefined) {
    addError(`${id} premiumPreview must live only in meta.json, not index.json`);
  }
  const preview = meta?.premiumPreview;
  if (entry.access !== 'premium') {
    if (preview !== undefined) addError(`${id} is free and must not declare a locked premiumPreview`);
    return;
  }
  if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
    addError(`${id} premium questions require meta.premiumPreview`);
    return;
  }
  const previewFields = Object.keys(preview).sort();
  const publicFields = ['learningOutcomes', 'summary', 'unlockDescription'];
  if (!equal(previewFields, publicFields)) {
    addError(`${id} premiumPreview may expose only summary, learningOutcomes, and unlockDescription`);
  }
  requireString(preview, 'summary', `${id} premiumPreview`);
  requireString(preview, 'unlockDescription', `${id} premiumPreview`);
  if (!Array.isArray(preview.learningOutcomes)
    || preview.learningOutcomes.length < 3
    || preview.learningOutcomes.length > 5
    || preview.learningOutcomes.some((outcome) => !isNonEmptyString(outcome))) {
    addError(`${id} premiumPreview.learningOutcomes must contain 3-5 non-empty outcomes`);
  }
  const summarySentences = splitSentences(preview.summary || '');
  if (summarySentences.length < 1 || summarySentences.length > 2) {
    addError(`${id} premiumPreview.summary must contain one or two sentences`);
  }
  inspectPlainString(preview.summary, `${id} premiumPreview.summary`);
  inspectPlainString(preview.unlockDescription, `${id} premiumPreview.unlockDescription`);
  (preview.learningOutcomes || []).forEach((outcome, index) => (
    inspectPlainString(outcome, `${id} premiumPreview.learningOutcomes[${index}]`)
  ));
  const sourceTokens = distinctiveTokens([
    meta.title,
    meta.description,
    meta?.editorial?.primaryKeyword,
    meta?.editorial?.uniqueAngle,
  ].join(' '));
  const previewTokens = distinctiveTokens([
    preview.summary,
    ...(preview.learningOutcomes || []),
  ].join(' '));
  const overlap = [...previewTokens].filter((token) => sourceTokens.has(token));
  if (overlap.length < 3) {
    addError(`${id} premiumPreview does not semantically overlap its title, description, and unique angle`);
  }
}

function validateRadioSectionTitle(id, section, title, label) {
  if (!isNonEmptyString(title)) {
    addError(`${id} ${label} must be a non-empty string`);
    return;
  }
  if (LEGACY_RADIO_TITLE_WORDS.test(title)) {
    addError(`${id} ${label} contains a legacy or incorrect RADIO section name`);
  }
  if (!RADIO_TITLE_WORDS[section].test(title)) {
    addError(`${id} ${label} must identify the ${section} RADIO section`);
  }
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sentenceCandidates(text) {
  return splitSentences(text)
    .filter((sentence) => sentence.length >= 70)
    .map((sentence) => normalizeText(sentence).toLowerCase())
    .filter(Boolean);
}

function sentenceShingles(sentence, width = 14) {
  const tokens = normalizeText(sentence).toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length < 18) return [];
  const shingles = [];
  for (let index = 0; index <= tokens.length - width; index += 1) {
    shingles.push(tokens.slice(index, index + width).join(' '));
  }
  return shingles;
}

function formatTsDiagnostic(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
}

function validateTypeScriptSyntax(id, entry) {
  const language = String(entry.block.language || '').toLowerCase();
  const scriptKind = language === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    `${id}-${entry.section}.ts${scriptKind === ts.ScriptKind.TSX ? 'x' : ''}`,
    entry.block.code,
    ts.ScriptTarget.ES2022,
    true,
    scriptKind,
  );
  source.parseDiagnostics.forEach((diagnostic) => {
    addError(`${id} ${entry.label} has invalid TypeScript syntax: ${formatTsDiagnostic(diagnostic)}`);
  });
}

function compileTypeScriptGroup(id, group, entries) {
  let sourceText = 'export {};\n';
  const ranges = [];
  entries.forEach((entry) => {
    const start = sourceText.length;
    sourceText += `\n// ${entry.section}: ${entry.label}\n${entry.block.code}\n`;
    ranges.push({ start, end: sourceText.length, label: entry.label });
  });
  const virtualFile = path.join(frontendRoot, `.system-design-${id}-${group}.ts`);
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    strict: true,
    noImplicitReturns: true,
    exactOptionalPropertyTypes: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host = {
    ...defaultHost,
    fileExists: (fileName) => fileName === virtualFile || defaultHost.fileExists(fileName),
    readFile: (fileName) => fileName === virtualFile ? sourceText : defaultHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (fileName === virtualFile) {
        return ts.createSourceFile(fileName, sourceText, languageVersion, true, ts.ScriptKind.TS);
      }
      return defaultHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
  };
  const program = ts.createProgram([virtualFile], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => !diagnostic.file || diagnostic.file.fileName === virtualFile);
  diagnostics.forEach((diagnostic) => {
    const range = Number.isInteger(diagnostic.start)
      ? ranges.find((item) => diagnostic.start >= item.start && diagnostic.start < item.end)
      : null;
    const location = range?.label || `contract group ${group}`;
    addError(`${id} ${location} fails strict TypeScript contract checking: ${formatTsDiagnostic(diagnostic)}`);
  });
  return sourceText;
}

function validateSse(id, entry) {
  const code = String(entry.block.code || '').replace(/\r\n?/g, '\n');
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    const field = line.match(/^([A-Za-z]+):/)?.[1];
    if (
      field
      && ['event', 'data', 'id', 'retry'].includes(field.toLowerCase())
      && field !== field.toLowerCase()
    ) {
      addError(`${id} ${entry.label} line ${index + 1} uses a case-invalid SSE field; use lowercase event:, data:, id:, or retry:`);
    }
  });
  const records = code.split(/\n[ \t]*\n/).filter((record) => record.trim());
  let eventRecordCount = 0;
  records.forEach((record, recordIndex) => {
    const fields = record.split('\n').filter((line) => line && !line.startsWith(':'));
    const eventLines = fields.filter((line) => line.startsWith('event:'));
    const dataLines = fields.filter((line) => line.startsWith('data:'));
    if (eventLines.length) eventRecordCount += 1;
    if (eventLines.length > 1) {
      addError(`${id} ${entry.label} SSE record ${recordIndex + 1} contains multiple event fields without a blank record separator`);
    }
    if (!dataLines.length) {
      addError(`${id} ${entry.label} SSE record ${recordIndex + 1} requires at least one data: field`);
    }
    fields.forEach((line) => {
      if (!/^(?:event|data|id|retry):/.test(line)) {
        addError(`${id} ${entry.label} contains an invalid SSE field line: ${JSON.stringify(line)}`);
      }
      if (line.startsWith('retry:') && !/^\s*\d+\s*$/.test(line.slice('retry:'.length))) {
        addError(`${id} ${entry.label} SSE retry: value must be an integer`);
      }
    });
    if (entry.block.validation?.dataFormat === 'json' && dataLines.length) {
      const payload = dataLines.map((line) => line.slice('data:'.length).trimStart()).join('\n');
      try {
        JSON.parse(payload);
      } catch (error) {
        addError(`${id} ${entry.label} SSE data payload is not valid JSON: ${error.message}`);
      }
    }
  });
  if (!eventRecordCount && !lines.some((line) => line.startsWith('data:'))) {
    addError(`${id} ${entry.label} does not contain an SSE event/data record`);
  }
}

function isHttpRequestLine(line) {
  return /^(?:(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S+(?:\s+HTTP\/\d(?:\.\d)?)?|WS\s+\S+)$/.test(line);
}

function isHttpResponseLine(line) {
  return /^(?:HTTP\/\d(?:\.\d)?\s+)?[1-5]\d{2}(?:\s+\S.*)?$/.test(line);
}

function jsonBodyEnd(lines, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let opened = false;
  for (let lineIndex = start; lineIndex < lines.length; lineIndex += 1) {
    for (const character of lines[lineIndex]) {
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
      } else if (character === '{' || character === '[') {
        opened = true;
        depth += 1;
      } else if (character === '}' || character === ']') {
        depth -= 1;
        if (depth < 0) return lineIndex;
      }
    }
    if (opened && depth === 0 && !inString) return lineIndex;
  }
  return -1;
}

function validateHttp(id, entry) {
  const lines = String(entry.block.code || '').replace(/\r\n?/g, '\n').split('\n');
  let index = 0;
  let requests = 0;
  let responses = 0;
  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    if (index >= lines.length) break;
    const startLine = lines[index].trim();
    if (!isHttpRequestLine(startLine) && !isHttpResponseLine(startLine)) {
      addError(`${id} ${entry.label} line ${index + 1} is not a recognized HTTP request, response, or WS start line`);
      index += 1;
      continue;
    }
    if (isHttpRequestLine(startLine)) requests += 1;
    else responses += 1;
    index += 1;

    while (index < lines.length && lines[index].trim()) {
      const line = lines[index].trim();
      if (isHttpRequestLine(line) || isHttpResponseLine(line) || /^[{[]/.test(line)) break;
      if (!/^[A-Za-z0-9][A-Za-z0-9-]*:\s*\S.*$/.test(line)) {
        addError(`${id} ${entry.label} line ${index + 1} is not a valid HTTP header`);
      }
      index += 1;
    }
    while (index < lines.length && !lines[index].trim()) index += 1;

    if (index < lines.length && /^[{[]/.test(lines[index].trim())) {
      const end = jsonBodyEnd(lines, index);
      if (end < index) {
        addError(`${id} ${entry.label} has an unterminated JSON body starting on line ${index + 1}`);
        break;
      }
      const body = lines.slice(index, end + 1).join('\n');
      try {
        JSON.parse(body);
      } catch (error) {
        addError(`${id} ${entry.label} JSON body starting on line ${index + 1} is invalid: ${error.message}`);
      }
      index = end + 1;
    }
  }
  if (!requests) {
    addError(`${id} ${entry.label} is marked as HTTP but has no request or WS start line`);
  }
  if (!responses) {
    addError(`${id} ${entry.label} is marked as HTTP but has no response start line`);
  }
}

function validateCodeBlock(id, entry) {
  const { block, label } = entry;
  const validation = block.validation;
  const code = String(block.code || '');
  const hasCaseInvalidSseField = code.split(/\r?\n/).some((line) => {
    const field = line.match(/^([A-Za-z]+):/)?.[1];
    return field
      && ['event', 'data', 'id', 'retry'].includes(field.toLowerCase())
      && field !== field.toLowerCase();
  });
  if (hasCaseInvalidSseField) {
    addError(`${id} ${label} contains case-invalid SSE field names`);
  }
  const containsSseRecord = /^(?:event|data):/im.test(code);
  if (containsSseRecord && (validation?.kind !== 'protocol' || validation?.protocol !== 'sse')) {
    addError(`${id} ${label} contains SSE records but is not classified as validation.protocol "sse"`);
  }
  if (!validation || typeof validation !== 'object') {
    addError(`${id} ${label} requires validation metadata in full mode`);
    return;
  }
  const language = String(block.language || '').toLowerCase();
  if (['contract', 'example'].includes(validation.kind)) {
    if (!TS_LANGUAGES.has(language)) {
      addError(`${id} ${label} ${validation.kind} code must use ts, typescript, or tsx`);
      return;
    }
    if (!['syntax', 'typecheck'].includes(validation.level)) {
      addError(`${id} ${label} ${validation.kind} code requires validation.level syntax or typecheck`);
    }
    validateTypeScriptSyntax(id, entry);
    if (validation.level === 'typecheck' && !isNonEmptyString(validation.group)) {
      addError(`${id} ${label} typechecked code requires validation.group`);
    }
  } else if (validation.kind === 'protocol') {
    if (validation.protocol === 'sse') {
      if (language !== 'text') addError(`${id} ${label} SSE examples must use language "text"`);
      validateSse(id, entry);
    } else if (validation.protocol === 'http') {
      if (language !== 'http') addError(`${id} ${label} HTTP examples must use language "http"`);
      validateHttp(id, entry);
    } else {
      addError(`${id} ${label} protocol code requires validation.protocol`);
    }
  } else if (validation.kind === 'data') {
    if (language !== 'json') addError(`${id} ${label} data code must use language "json"`);
    try {
      JSON.parse(block.code);
    } catch (error) {
      addError(`${id} ${label} contains invalid JSON: ${error.message}`);
    }
  } else if (['diagram', 'pseudocode'].includes(validation.kind)) {
    if (language !== 'text') addError(`${id} ${label} ${validation.kind} must use language "text"`);
  }
}

function validateRadioLanguage(id, visibleRecords) {
  const orderedExpansion = /Requirements[\s\S]{0,80}Architecture[\s\S]{0,80}Data[\s\S]{0,80}Interfaces?[\s\S]{0,80}Optimizations?/i;
  visibleRecords.forEach((record) => {
    if (!/\bRADIO\b/i.test(record.text)) return;
    if (/\b(?:Reflect|Assumptions|Diagram|Decide|Implement|Outcome|Operations)\b/i.test(record.text)) {
      addError(`${id} ${record.label} gives RADIO a legacy or incorrect expansion`);
    }
    if (/\b(?:means|stands for|expands to)\b|RADIO\s*[:=]/i.test(record.text) && !orderedExpansion.test(record.text)) {
      addError(`${id} ${record.label} must expand RADIO as Requirements, Architecture, Data, Interface, Optimizations`);
    }
  });
}

function isNegatedLossClaim(sentence) {
  return /\b(?:do not|don't|never|must not|cannot|can't|without|rather than|instead of)\b[^.!?]{0,50}\b(?:drop|discard)(?:s|ed|ing)?\b/i.test(sentence)
    || /\b(?:drop|discard)(?:s|ed|ing)?\b[^.!?]{0,40}\b(?:is not|are not|is never|are never)\b/i.test(sentence);
}

function validateEditorialProse(id, visibleRecords) {
  visibleRecords.forEach((record) => {
    if (record.role === 'references') return;
    for (const pattern of FORMULAIC_PROSE_PATTERNS) {
      if (pattern.test(record.text)) {
        addError(`${id} ${record.label} contains formulaic or mechanically incorrect prose matching ${pattern}`);
      }
    }
    splitSentences(record.text).forEach((sentence) => {
      const lossClaim = /\b(?:drop|discard)(?:s|ed|ing)?(?:\s+or\s+\w+)?\s+(?:(?:low|lower)[-\s]priority\s+|incoming\s+|some\s+|authoritative\s+|domain\s+)*(?:events?|notifications?|comments?|messages?|records?|logs?)\b/i.test(sentence)
        || /\b(?:events?|notifications?|comments?|messages?|records?|logs?)\s+(?:may|can|should|must|are|is|were|was|be|being|to be){0,2}\s*(?:drop|discard)(?:s|ed|ing)?\b/i.test(sentence);
      if (lossClaim && !isNegatedLossClaim(sentence)) {
        addError(`${id} ${record.label} recommends unsafe loss of authoritative client-domain data: "${sentence}"`);
      }

      const strongAbsolute = /\b(?:must|always|guarantee|hard cap|fixed target|never exceed)\b[^.!?]{0,100}\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:ms|s|fps|items?|mb|%|hz)\b/i.test(sentence);
      const prescriptiveThreshold = /\b(?:virtuali[sz]e|paginate|debounce|throttle|switch to canvas|use webgl)\b[^.!?]{0,80}\b(?:after|above|over|at|once)\s+\d+(?:\.\d+)?\s*(?:ms|s|fps|items?|mb|%|hz)?\b/i.test(sentence);
      const qualified = /\b(?:measured|measure|profiled|profiling|starting hypothesis|initial hypothesis|example budget|product SLO|p75|p95|cohort|device class|network class|named standard)\b/i.test(sentence);
      if ((strongAbsolute || prescriptiveThreshold) && !qualified) {
        addError(`${id} ${record.label} presents an unqualified numeric performance rule: "${sentence}"`);
      }
    });
  });
}

function validateRoles(id, sections, blockEntries) {
  const canonical = blockEntries.filter(({ block }) => block.editorialRole === 'canonical-model');
  if (canonical.length !== 1) {
    addError(`${id} requires exactly one canonical-model editorialRole (found ${canonical.length})`);
  } else if (canonical[0].section !== 'architecture' || canonical[0].block.type !== 'callout') {
    addError(`${id} canonical-model must be an architecture callout`);
  }

  const optimizationBlocks = sections.optimizations.blocks || [];
  const answer = optimizationBlocks.at(-2);
  const references = optimizationBlocks.at(-1);
  if (answer?.editorialRole !== 'answer-checkpoint' || !['callout', 'checklist'].includes(answer?.type)) {
    addError(`${id} optimizations must end with a callout/checklist carrying answer-checkpoint before references`);
  }
  if (references?.editorialRole !== 'references' || references?.type !== 'links') {
    addError(`${id} final optimizations block must be links carrying the references editorialRole`);
  } else {
    const terminalSources = new Set(
      (references.items || [])
        .map((item) => String(item?.href || ''))
        .filter((href) => /^https:\/\//i.test(href)),
    );
    if (terminalSources.size < 2) {
      addError(`${id} terminal references block requires at least two unique HTTPS technical sources`);
    }
  }
  blockEntries
    .filter(({ block }) => block !== references)
    .forEach(({ block, label }) => {
      const sourceLabel = block.type === 'heading' ? block.text : block.title;
      if (/^\s*(?:technical references|sources)\s*$/i.test(String(sourceLabel || ''))) {
        addError(`${id} ${label} duplicates the terminal references section`);
      }
    });
  const answerRoles = blockEntries.filter(({ block }) => block.editorialRole === 'answer-checkpoint');
  const referenceRoles = blockEntries.filter(({ block }) => block.editorialRole === 'references');
  if (answerRoles.length !== 1) addError(`${id} requires exactly one answer-checkpoint editorialRole`);
  if (referenceRoles.length !== 1) addError(`${id} requires exactly one references editorialRole`);
}

function validateCodeContracts(id, blockEntries) {
  const codeEntries = blockEntries.filter(({ block }) => block.type === 'code');
  const groups = new Map();
  const namedTypes = new Map();
  codeEntries.forEach((entry) => {
    validateCodeBlock(id, entry);
    const validation = entry.block.validation;
    if (TS_LANGUAGES.has(String(entry.block.language || '').toLowerCase())) {
      const source = ts.createSourceFile(
        `${id}-${entry.section}.ts`,
        entry.block.code,
        ts.ScriptTarget.ES2022,
        true,
        String(entry.block.language || '').toLowerCase() === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      source.statements.forEach((statement) => {
        if (!ts.isInterfaceDeclaration(statement)
          && !ts.isTypeAliasDeclaration(statement)
          && !ts.isEnumDeclaration(statement)) return;
        const name = statement.name?.text;
        if (!name) return;
        const signature = statement.getText(source)
          .replace(/\bexport\s+/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const previous = namedTypes.get(name);
        if (previous && previous.signature !== signature) {
          addError(`${id} defines incompatible versions of ${name} in ${previous.label} and ${entry.label}`);
        } else if (!previous) {
          namedTypes.set(name, { signature, label: entry.label });
        }
      });
    }
    if (validation?.level === 'typecheck' && isNonEmptyString(validation.group)) {
      if (!groups.has(validation.group)) groups.set(validation.group, []);
      groups.get(validation.group).push(entry);
    }
  });

  const spanningGroups = [...groups.entries()]
    .filter(([, entries]) => (
      entries.some((entry) => entry.section === 'data')
      && entries.some((entry) => entry.section === 'interfaces')
    ));
  if (!spanningGroups.length) {
    addError(`${id} requires a typechecked code contract group spanning Data and Interfaces`);
  }
  const sources = new Map();
  groups.forEach((entries, group) => {
    sources.set(group, compileTypeScriptGroup(id, group, entries));
  });
  return { entries: groups, sources };
}

function validateFullQuality(id, meta, sections, duplicateState) {
  const blockEntries = collectBlockEntries(sections);
  const visibleRecords = collectVisibleRecords(blockEntries);
  const sectionTexts = {};
  let totalWords = 0;
  REQUIRED_SECTIONS.forEach((section) => {
    const text = visibleRecords
      .filter((record) => record.section === section)
      .map((record) => record.text)
      .join('. ');
    sectionTexts[section] = text;
    const words = wordCount(text);
    totalWords += words;
    if (words < MIN_SECTION_WORDS[section]) {
      addError(`${id} ${section} is thin (${words} words; expected at least ${MIN_SECTION_WORDS[section]})`);
    }
  });
  if (totalWords < MIN_TOTAL_WORDS) {
    addError(`${id} has ${totalWords} visible words; expected at least ${MIN_TOTAL_WORDS}`);
  }

  const combined = Object.values(sectionTexts).join(' ');
  if (!/\b(?:worked example|scenario walkthrough|end-to-end example)\b/i.test(combined)) {
    addError(`${id} requires a clearly labeled worked example or scenario walkthrough`);
  }
  if (!blockEntries.some(({ block }) => block.type === 'code')) addError(`${id} requires a code or interface block`);
  if (!blockEntries.some(({ block }) => ['table', 'steps'].includes(block.type))) {
    addError(`${id} requires a table or steps block`);
  }
  if (!/\b(?:failure|recovery|reconnect|retry|rollback|degraded|error state)\b/i.test(combined)) {
    addError(`${id} requires explicit failure and recovery coverage`);
  }
  if (!/\b(?:accessibility|accessible|keyboard|screen reader|aria-|focus)\b/i.test(combined)) {
    addError(`${id} requires explicit accessibility coverage`);
  }
  if (externalSourceCount(blockEntries) < 2) addError(`${id} requires at least two external HTTPS technical sources`);
  if (!/\b(?:backend|server|service).{0,140}(?:abstract|black box|out of scope|contract)\b/i.test(combined)) {
    addError(`${id} must state the frontend/backend boundary`);
  }

  validateRadioLanguage(id, visibleRecords);
  validateEditorialProse(id, visibleRecords);
  validateRoles(id, sections, blockEntries);
  const codeGroups = validateCodeContracts(id, blockEntries);

  visibleRecords
    .filter((record) => !['answer-checkpoint', 'references'].includes(record.role))
    .forEach((record) => {
      for (const sentence of sentenceCandidates(record.text)) {
        const owner = duplicateState.sentences.get(sentence);
        if (owner && owner !== id) {
          addError(`${id} duplicates a long visible sentence from ${owner}: "${sentence}"`);
        } else {
          duplicateState.sentences.set(sentence, id);
        }
        for (const shingle of sentenceShingles(sentence)) {
          const shingleOwner = duplicateState.shingles.get(shingle);
          const reportKey = [id, shingleOwner, shingle].sort().join('|');
          if (shingleOwner && shingleOwner !== id && !duplicateState.reports.has(reportKey)) {
            duplicateState.reports.add(reportKey);
            addError(`${id} repeats a 14-word prose fragment from ${shingleOwner}: "${shingle}"`);
          } else {
            duplicateState.shingles.set(shingle, id);
          }
        }
      }
    });

  const factCheckedAt = meta?.editorial?.factCheckedAt;
  const checkedDate = parseDate(factCheckedAt);
  if (!checkedDate) {
    addError(`${id} editorial.factCheckedAt must be a valid YYYY-MM-DD date`);
  } else {
    const age = Math.floor((Date.now() - checkedDate.getTime()) / 86_400_000);
    if (checkedDate.getTime() > Date.now()) {
      addError(`${id} editorial.factCheckedAt cannot be in the future`);
    }
    if (age > STALE_AFTER_DAYS) addError(`${id} fact-check is ${age} days old; refresh it before publishing`);
  }
  requireString(meta?.editorial || {}, 'reviewedBy', `${id} editorial`);

  return {
    blockEntries,
    visibleRecords,
    sectionTexts,
    codeGroups,
  };
}

function compilePattern(pattern, label) {
  try {
    return new RegExp(pattern, 'iu');
  } catch (error) {
    addError(`${label} contains an invalid regular expression: ${error.message}`);
    return null;
  }
}

function findNamedType(source, name) {
  const sourceFile = ts.createSourceFile('contract.ts', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let match = null;
  function visit(node) {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
      && node.name?.text === name
    ) {
      match = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return match;
}

function memberNamesForType(node) {
  const names = new Set();
  const members = ts.isInterfaceDeclaration(node)
    ? node.members
    : (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type) ? node.type.members : []);
  members.forEach((member) => {
    const name = member.name;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
      names.add(String(name.text));
    }
  });
  return names;
}

function stringLiteralsInNode(node) {
  const values = new Set();
  function visit(child) {
    if (ts.isStringLiteral(child)) values.add(child.text);
    ts.forEachChild(child, visit);
  }
  visit(node);
  return values;
}

function validateSemanticContracts(indexIds, contexts) {
  const manifest = readJson(CONTRACTS_PATH);
  if (!manifest) return;
  if (
    manifest.version !== 1
    || !manifest.questions
    || typeof manifest.questions !== 'object'
    || Array.isArray(manifest.questions)
  ) {
    addError(`${rel(CONTRACTS_PATH)} must declare version 1 and a questions object`);
    return;
  }
  const manifestIds = Object.keys(manifest.questions).sort();
  const catalogIds = [...indexIds].sort();
  if (!equal(manifestIds, catalogIds)) {
    const missing = catalogIds.filter((id) => !manifestIds.includes(id));
    const extra = manifestIds.filter((id) => !catalogIds.includes(id));
    addError(`semantic contract coverage must exactly match the catalog; missing=[${missing.join(', ')}], extra=[${extra.join(', ')}]`);
  }

  manifestIds.forEach((id) => {
    const contract = manifest.questions[id];
    const context = contexts.get(id);
    if (!context) return;
    if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
      addError(`${id} semantic contract must be an object`);
      return;
    }
    if (contract.assertions !== undefined && !Array.isArray(contract.assertions)) {
      addError(`${id} semantic contract assertions must be an array`);
    }
    if (contract.symbols !== undefined && !Array.isArray(contract.symbols)) {
      addError(`${id} semantic contract symbols must be an array`);
    }
    const assertions = Array.isArray(contract.assertions) ? contract.assertions : [];
    const symbols = Array.isArray(contract.symbols) ? contract.symbols : [];
    if (!assertions.length && !symbols.length) {
      addError(`${id} semantic contract must contain at least one assertion or symbol contract`);
    }
    const assertionIds = new Set();
    assertions.forEach((assertion, index) => {
      const label = `${id} semantic assertion[${index}]`;
      if (!assertion || typeof assertion !== 'object' || Array.isArray(assertion)) {
        addError(`${label} must be an object`);
        return;
      }
      if (!isNonEmptyString(assertion?.id) || assertionIds.has(assertion.id)) {
        addError(`${label}.id must be a unique non-empty string`);
      } else {
        assertionIds.add(assertion.id);
      }
      const target = assertion?.target || 'all';
      if (!['visible', 'code', 'all'].includes(target)) addError(`${label}.target must be visible, code, or all`);
      const sections = assertion.sections === undefined ? REQUIRED_SECTIONS : assertion.sections;
      if (
        !Array.isArray(sections)
        || !sections.length
        || sections.some((section) => !REQUIRED_SECTIONS.includes(section))
      ) {
        addError(`${label}.sections must be a non-empty array of known RADIO sections`);
        return;
      }
      if (new Set(sections).size !== sections.length) {
        addError(`${label}.sections must not contain duplicates`);
      }
      for (const field of ['require', 'forbid']) {
        if (assertion[field] !== undefined && !Array.isArray(assertion[field])) {
          addError(`${label}.${field} must be an array of regular-expression strings`);
        } else if (
          Array.isArray(assertion[field])
          && assertion[field].some((pattern) => !isNonEmptyString(pattern))
        ) {
          addError(`${label}.${field} must contain only non-empty regular-expression strings`);
        }
      }
      const visible = sections.map((section) => context.sectionTexts[section] || '').join('\n');
      const code = context.blockEntries
        .filter((entry) => entry.block.type === 'code' && sections.includes(entry.section))
        .map((entry) => entry.block.code)
        .join('\n');
      const haystack = target === 'visible' ? visible : target === 'code' ? code : `${visible}\n${code}`;
      const required = Array.isArray(assertion?.require) ? assertion.require : [];
      const forbidden = Array.isArray(assertion?.forbid) ? assertion.forbid : [];
      if (!required.length && !forbidden.length) addError(`${label} requires at least one require or forbid pattern`);
      required.forEach((pattern, patternIndex) => {
        const regex = compilePattern(pattern, `${label}.require[${patternIndex}]`);
        if (regex && !regex.test(haystack)) {
          addError(`${id} semantic assertion ${assertion.id} is missing required pattern ${JSON.stringify(pattern)}`);
        }
      });
      forbidden.forEach((pattern, patternIndex) => {
        const regex = compilePattern(pattern, `${label}.forbid[${patternIndex}]`);
        if (regex && regex.test(haystack)) {
          addError(`${id} semantic assertion ${assertion.id} matched forbidden pattern ${JSON.stringify(pattern)}`);
        }
      });
    });

    symbols.forEach((symbol, index) => {
      const label = `${id} semantic symbol[${index}]`;
      if (!symbol || typeof symbol !== 'object' || Array.isArray(symbol)) {
        addError(`${label} must be an object`);
        return;
      }
      if (!isNonEmptyString(symbol.group)) {
        addError(`${label}.group must be a non-empty string`);
        return;
      }
      for (const field of ['requiredMembers', 'requiredLiterals', 'forbiddenLiterals']) {
        if (symbol[field] !== undefined && !Array.isArray(symbol[field])) {
          addError(`${label}.${field} must be an array of non-empty strings`);
        } else if (
          Array.isArray(symbol[field])
          && symbol[field].some((value) => !isNonEmptyString(value))
        ) {
          addError(`${label}.${field} must contain only non-empty strings`);
        }
      }
      const requiredMembers = Array.isArray(symbol.requiredMembers) ? symbol.requiredMembers : [];
      const requiredLiterals = Array.isArray(symbol.requiredLiterals) ? symbol.requiredLiterals : [];
      const forbiddenLiterals = Array.isArray(symbol.forbiddenLiterals) ? symbol.forbiddenLiterals : [];
      if (!requiredMembers.length && !requiredLiterals.length && !forbiddenLiterals.length) {
        addError(`${label} requires at least one member or literal invariant`);
      }
      const source = context.codeGroups.sources.get(symbol?.group);
      if (!source) {
        addError(`${label} references unknown typechecked group ${JSON.stringify(symbol?.group)}`);
        return;
      }
      if (!isNonEmptyString(symbol?.name)) {
        addError(`${label}.name must be a non-empty string`);
        return;
      }
      const declaration = findNamedType(source, symbol.name);
      if (!declaration) {
        addError(`${label} cannot find interface or type ${symbol.name} in group ${symbol.group}`);
        return;
      }
      const members = memberNamesForType(declaration);
      requiredMembers.forEach((member) => {
        if (!members.has(member)) addError(`${label} type ${symbol.name} is missing member ${member}`);
      });
      const literals = stringLiteralsInNode(declaration);
      requiredLiterals.forEach((literal) => {
        if (!literals.has(literal)) addError(`${label} type ${symbol.name} is missing string literal ${literal}`);
      });
      forbiddenLiterals.forEach((literal) => {
        if (literals.has(literal)) addError(`${label} type ${symbol.name} contains forbidden string literal ${literal}`);
      });
    });
  });
}

if (!VALID_MODES.has(MODE)) {
  console.error(`Unknown mode ${JSON.stringify(MODE)}. Use --mode=structure or --mode=full.`);
  process.exit(1);
}

const indexPath = path.join(SYSTEM_DESIGN_DIR, 'index.json');
const index = readJson(indexPath);
if (!Array.isArray(index)) addError(`${rel(indexPath)} must contain an array`);

const seenSeoTitles = new Map();
const seenSeoDescriptions = new Map();
const seenIds = new Set();
const duplicateState = {
  sentences: new Map(),
  shingles: new Map(),
  reports: new Set(),
};
const contexts = new Map();

for (const entry of Array.isArray(index) ? index : []) {
  const id = String(entry?.id || '').trim();
  if (!id) {
    addError(`${rel(indexPath)} contains an entry without an id`);
    continue;
  }
  if (seenIds.has(id)) {
    addError(`${rel(indexPath)} contains duplicate id ${id}`);
    continue;
  }
  seenIds.add(id);
  const updatedAt = parseDate(entry.updatedAt);
  if (!updatedAt) {
    addError(`${id} updatedAt must be a valid YYYY-MM-DD date`);
  } else if (updatedAt.getTime() > Date.now()) {
    addError(`${id} updatedAt cannot be in the future`);
  }
  if (entry.publishedAt !== undefined) {
    const publishedAt = parseDate(entry.publishedAt);
    if (!publishedAt) addError(`${id} publishedAt must be a valid YYYY-MM-DD date`);
    else if (publishedAt.getTime() > Date.now()) addError(`${id} publishedAt cannot be in the future`);
  }
  const folder = path.join(SYSTEM_DESIGN_DIR, id);
  const metaPath = path.join(folder, 'meta.json');
  const meta = readJson(metaPath);
  if (!meta) continue;

  SHARED_FIELDS.forEach((field) => {
    const indexValue = field === 'companies' ? (entry[field] || []) : entry[field];
    const metaValue = field === 'companies' ? (meta[field] || []) : meta[field];
    if (!equal(indexValue, metaValue)) addError(`${id} index/meta ${field} mismatch`);
  });

  const description = String(entry.description || '');
  if (!description || description.length > 240 || /[\r\n]/.test(description)) {
    addError(`${id} description must be a non-empty single paragraph of at most 240 characters`);
  }
  validateSeo(id, meta, seenSeoTitles, seenSeoDescriptions);
  validateCompanyEvidence(id, meta, entry.companies || []);
  validatePremiumPreview(id, entry, meta);

  const sections = {};
  REQUIRED_SECTIONS.forEach((section) => {
    const filePath = path.join(folder, `${section}.json`);
    const data = readJson(filePath);
    sections[section] = data;
    if (!data) return;
    if (!Array.isArray(data.blocks) || !data.blocks.length) {
      addError(`${rel(filePath)} blocks must be a non-empty array`);
      return;
    }
    data.blocks.forEach((block, indexValue) => validateBlock(block, `${rel(filePath)} blocks[${indexValue}]`));
  });

  const sectionManifest = Array.isArray(meta.sections) ? meta.sections : [];
  if (sectionManifest.length !== REQUIRED_SECTIONS.length) {
    addError(`${id} meta.sections must declare all ${REQUIRED_SECTIONS.length} RADIO files`);
  } else {
    REQUIRED_SECTIONS.forEach((section, indexValue) => {
      const manifestEntry = sectionManifest[indexValue];
      const expectedFile = `${section}.json`;
      if (manifestEntry?.file !== expectedFile) {
        addError(`${id} meta.sections[${indexValue}].file must be ${expectedFile}`);
      }
      if (manifestEntry?.key !== RADIO_KEYS[section]) {
        addError(`${id} meta.sections[${indexValue}].key must be ${RADIO_KEYS[section]}`);
      }
      validateRadioSectionTitle(
        id,
        section,
        manifestEntry?.title,
        `meta.sections[${indexValue}].title`,
      );
      if (sections[section]?.key !== RADIO_KEYS[section]) {
        addError(`${id} ${expectedFile}.key must be ${RADIO_KEYS[section]}`);
      }
      validateRadioSectionTitle(id, section, sections[section]?.title, `${expectedFile}.title`);
      if (sections[section] && manifestEntry?.key !== sections[section].key) {
        addError(`${id} meta.sections[${indexValue}].key must match ${expectedFile}`);
      }
    });
  }

  if (MODE === 'full' && REQUIRED_SECTIONS.every((section) => sections[section])) {
    contexts.set(id, validateFullQuality(id, meta, sections, duplicateState));
  }
}

if (MODE === 'full') validateSemanticContracts(seenIds, contexts);

if (warnings.length) {
  console.warn(`System-design editorial quality warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (errors.length) {
  console.error(`System-design editorial quality errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`System-design editorial quality checks passed (${MODE} mode).`);
