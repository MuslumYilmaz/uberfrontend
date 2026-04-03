#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  cdnIncidentsDir,
  cdnQuestionsDir,
  cdnTradeoffBattlesDir,
  repoRoot,
} from './content-paths.mjs';

const CONTENT_DRAFTS_DIR = path.resolve(process.env.CONTENT_DRAFTS_DIR || path.join(repoRoot, 'content-drafts'));
const INCIDENTS_DIR = path.resolve(process.env.CDN_INCIDENTS_DIR || cdnIncidentsDir);
const TRADEOFF_BATTLES_DIR = path.resolve(process.env.CDN_TRADEOFF_BATTLES_DIR || cdnTradeoffBattlesDir);
const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const TEMPLATE_BASENAMES = new Set(['playbook.md', 'system-design.md', 'trivia.md', 'tradeoff-battle.md', 'incident.md']);

const errors = [];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: raw };
  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const pair = line.match(/^([a-z_]+):(.*)$/);
    if (!pair) continue;
    const key = pair[1];
    const value = pair[2].trim();
    if (!value) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length && /^\s+-\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s+-\s+/, '').trim().replace(/^"(.*)"$/, '$1'));
        cursor += 1;
      }
      frontmatter[key] = items;
      index = cursor - 1;
      continue;
    }
    frontmatter[key] = value.replace(/^"(.*)"$/, '$1');
  }

  return { frontmatter, body: raw.slice(match[0].length) };
}

function listDraftFiles(rootDir, out = []) {
  if (!fs.existsSync(rootDir)) return out;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      listDraftFiles(fullPath, out);
      return;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) return;
    if (entry.name === 'README.md') return;
    if (TEMPLATE_BASENAMES.has(entry.name)) return;
    out.push(fullPath);
  });
  return out;
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function wordCount(value) {
  const text = normalizeText(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function validateDateOnly(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectTextSegments(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectTextSegments(item, out));
    return out;
  }
  if (!value || typeof value !== 'object') return out;

  Object.entries(value).forEach(([key, child]) => {
    if (key === 'editorial') return;
    collectTextSegments(child, out);
  });
  return out;
}

function resolveEditorialDraftSource(source) {
  const raw = String(source || '').trim();
  if (!raw) return '';
  if (path.isAbsolute(raw)) return path.normalize(raw);
  return path.resolve(path.dirname(CONTENT_DRAFTS_DIR), raw);
}

function getIncidentBundle(slug) {
  const scenarioPath = path.join(INCIDENTS_DIR, slug, 'scenario.json');
  if (!fs.existsSync(scenarioPath)) return null;
  const scenario = readJson(scenarioPath);
  return {
    label: relFromRepo(scenarioPath),
    editorial: scenario.editorial,
    text: collectTextSegments(scenario).join(' '),
  };
}

function getTradeoffBundle(slug) {
  const scenarioPath = path.join(TRADEOFF_BATTLES_DIR, slug, 'scenario.json');
  if (!fs.existsSync(scenarioPath)) return null;
  const scenario = readJson(scenarioPath);
  return {
    label: relFromRepo(scenarioPath),
    editorial: scenario.editorial,
    text: collectTextSegments(scenario).join(' '),
  };
}

function getSystemDesignBundle(slug) {
  const folderPath = path.join(QUESTIONS_DIR, 'system-design', slug);
  const metaPath = path.join(folderPath, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  const meta = readJson(metaPath);
  const jsonFiles = fs.readdirSync(folderPath).filter((entry) => entry.endsWith('.json'));
  const combinedText = jsonFiles
    .map((entry) => readJson(path.join(folderPath, entry)))
    .map((data) => collectTextSegments(data).join(' '))
    .join(' ');
  return {
    label: relFromRepo(metaPath),
    editorial: meta.editorial,
    text: combinedText,
  };
}

function getTriviaBundle(tech, slug) {
  const triviaPath = path.join(QUESTIONS_DIR, tech, 'trivia.json');
  if (!fs.existsSync(triviaPath)) return null;
  const items = readJson(triviaPath);
  if (!Array.isArray(items)) return null;
  const item = items.find((entry) => String(entry?.id || '').trim() === slug);
  if (!item) return null;
  return {
    label: `${relFromRepo(triviaPath)}#${slug}`,
    editorial: item.editorial,
    text: collectTextSegments(item).join(' '),
  };
}

function shippedBundleForDraft(frontmatter) {
  const family = String(frontmatter?.family || '').trim();
  const slug = String(frontmatter?.slug || '').trim();
  const tech = String(frontmatter?.tech || '').trim();

  if (!family || !slug) return null;
  if (family === 'playbook') return { skip: true };
  if (family === 'incident') return getIncidentBundle(slug);
  if (family === 'tradeoff-battle') return getTradeoffBundle(slug);
  if (family === 'system-design') return getSystemDesignBundle(slug);
  if (family === 'trivia') return getTriviaBundle(tech, slug);
  return null;
}

function validateConvertedDraft(draftPath) {
  const raw = fs.readFileSync(draftPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  if (!frontmatter || typeof frontmatter !== 'object') return;
  if (String(frontmatter.status || '').trim() !== 'converted') return;

  const slug = String(frontmatter.slug || '').trim();
  const family = String(frontmatter.family || '').trim();
  const draftLabel = relFromRepo(draftPath);
  const shipped = shippedBundleForDraft(frontmatter);
  if (!shipped) {
    addError(`${draftLabel}: no shipped target could be resolved for ${family}:${slug}`);
    return;
  }
  if (shipped.skip) return;
  if (!shipped.editorial || typeof shipped.editorial !== 'object') {
    addError(`${draftLabel}: missing editorial block in ${shipped.label}`);
    return;
  }

  const editorial = shipped.editorial;
  const editorialDraftSource = resolveEditorialDraftSource(editorial.draftSource);
  if (!editorialDraftSource) {
    addError(`${draftLabel}: editorial.draftSource is required in ${shipped.label}`);
  } else if (path.normalize(editorialDraftSource) !== path.normalize(draftPath)) {
    addError(`${draftLabel}: editorial.draftSource does not point at the matching draft in ${shipped.label}`);
  }

  const comparisons = [
    ['primaryKeyword', frontmatter.primary_keyword],
    ['searchIntent', frontmatter.search_intent],
    ['readerPromise', frontmatter.reader_promise],
    ['uniqueAngle', frontmatter.unique_angle],
  ];
  comparisons.forEach(([field, draftValue]) => {
    const shippedValue = normalizeKey(editorial[field]);
    const normalizedDraft = normalizeKey(draftValue);
    if (!String(editorial[field] || '').trim()) {
      addError(`${draftLabel}: editorial.${field} is required in ${shipped.label}`);
      return;
    }
    if (normalizedDraft && shippedValue && normalizedDraft !== shippedValue) {
      addError(`${draftLabel}: editorial.${field} does not match the draft in ${shipped.label}`);
    }
  });

  const factCheckedAt = validateDateOnly(editorial.factCheckedAt);
  const draftFactCheckedAt = validateDateOnly(frontmatter.last_fact_checked_at);
  if (!factCheckedAt) {
    addError(`${draftLabel}: editorial.factCheckedAt must be a valid YYYY-MM-DD date in ${shipped.label}`);
  } else if (draftFactCheckedAt && factCheckedAt < draftFactCheckedAt) {
    addError(`${draftLabel}: editorial.factCheckedAt cannot be earlier than draft last_fact_checked_at in ${shipped.label}`);
  }
  if (!String(editorial.reviewedBy || '').trim()) {
    addError(`${draftLabel}: editorial.reviewedBy is required in ${shipped.label}`);
  }

  const draftWordCount = wordCount(body);
  const shippedWordCount = wordCount(shipped.text);
  const minShippedWords = Math.max(250, Math.floor(draftWordCount * 0.55));
  if (draftWordCount > 0 && shippedWordCount < minShippedWords) {
    addError(`${draftLabel}: shipped content is too thin vs draft in ${shipped.label} (${shippedWordCount} vs ${draftWordCount}; expected at least ${minShippedWords})`);
  }

  const draftPrimaryKeyword = normalizeKey(frontmatter.primary_keyword);
  const shippedText = normalizeKey(shipped.text);
  if (draftPrimaryKeyword && !shippedText.includes(draftPrimaryKeyword)) {
    addError(`${draftLabel}: shipped content does not contain the draft primary keyword in ${shipped.label}`);
  }
}

function main() {
  if (!fs.existsSync(CONTENT_DRAFTS_DIR)) {
    console.log('[lint-shipped-draft-parity] content-drafts/ not found; skipping.');
    return;
  }

  const draftFiles = listDraftFiles(CONTENT_DRAFTS_DIR);
  draftFiles.forEach((draftPath) => validateConvertedDraft(draftPath));

  errors.forEach((message) => console.error(`[lint-shipped-draft-parity] ${message}`));
  if (errors.length) {
    console.error(`[lint-shipped-draft-parity] failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log('[lint-shipped-draft-parity] shipped content matches converted drafts.');
}

main();
