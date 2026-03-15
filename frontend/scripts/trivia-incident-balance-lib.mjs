import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const frontendProjectRoot = path.resolve(__dirname, '..');
export const repoRoot = path.resolve(frontendProjectRoot, '..');
export const frontendQuestionsRoot = path.join(frontendProjectRoot, 'src', 'assets', 'questions');
export const cdnQuestionsRoot = path.join(repoRoot, 'cdn', 'questions');
export const TECHS = ['angular', 'css', 'html', 'javascript', 'react', 'vue'];

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

export function getTriviaPaths(tech) {
  return {
    frontend: path.join(frontendQuestionsRoot, tech, 'trivia.json'),
    cdn: path.join(cdnQuestionsRoot, tech, 'trivia.json'),
  };
}

export function buildQuestionMap(questions) {
  const map = new Map();
  for (const question of questions) {
    if (!question || typeof question.id !== 'string') continue;
    map.set(question.id, question);
  }
  return map;
}

export function optionIds(card) {
  if (!card || !Array.isArray(card.options)) return [];
  return card.options.map((option) => option?.id);
}

export function arraysEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

export function fnv1a32(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRng(seedText) {
  const seed = fnv1a32(seedText) || 0x9e3779b9;
  return createMulberry32(seed);
}

export function shuffled(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getCorrectIndex(card) {
  if (!card || !Array.isArray(card.options)) return -1;
  return card.options.findIndex((option) => option?.id === card.correctOptionId);
}

export function rotateOptionsToIndex(options, correctOptionId, targetIndex) {
  const currentIndex = options.findIndex((option) => option?.id === correctOptionId);
  if (currentIndex === -1) {
    throw new Error(`correctOptionId "${correctOptionId}" is missing from options`);
  }
  if (targetIndex < 0 || targetIndex >= options.length) {
    throw new Error(`Invalid target index ${targetIndex} for ${options.length} options`);
  }
  if (currentIndex === targetIndex) return options.slice();

  const size = options.length;
  const rightShift = (targetIndex - currentIndex + size) % size;
  if (rightShift === 0) return options.slice();

  return options.slice(size - rightShift).concat(options.slice(0, size - rightShift));
}

export function buildBalancedCounts(total, tech) {
  const counts = [0, 0, 0];
  const base = Math.floor(total / 3);
  counts.fill(base);

  const remainder = total % 3;
  if (remainder > 0) {
    const extraOrder = shuffled([0, 1, 2], createSeededRng(`${tech}:incident-balance-v1:extras`));
    for (let i = 0; i < remainder; i += 1) {
      counts[extraOrder[i]] += 1;
    }
  }

  return counts;
}

export function buildTargetPositions(total, tech) {
  const counts = buildBalancedCounts(total, tech);
  const positions = [];

  for (let index = 0; index < counts.length; index += 1) {
    for (let i = 0; i < counts[index]; i += 1) {
      positions.push(index);
    }
  }

  return {
    counts,
    positions: shuffled(positions, createSeededRng(`${tech}:incident-balance-v1:positions`)),
  };
}

export function sortIncidentQuestions(questions) {
  return questions
    .slice()
    .sort((left, right) => fnv1a32(left.id) - fnv1a32(right.id) || left.id.localeCompare(right.id));
}

export function summarizeCounts(questions) {
  const counts = [0, 0, 0];
  let invalid = 0;

  for (const question of questions) {
    const index = getCorrectIndex(question.incidentCard);
    if (index >= 0 && index < 3) {
      counts[index] += 1;
    } else {
      invalid += 1;
    }
  }

  return { counts, invalid };
}

export function formatCounts(counts) {
  return `1:${counts[0]} 2:${counts[1]} 3:${counts[2]}`;
}

export function maxCountDelta(counts) {
  return Math.max(...counts) - Math.min(...counts);
}
