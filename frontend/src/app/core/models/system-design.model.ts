import {
  AccessLevel,
  Difficulty,
  PremiumPreviewContent,
  QuestionSeo,
} from './question.model';

export type SystemDesignTargetLevel = 'junior' | 'mid' | 'senior';
export type SystemDesignTimeboxMinutes = 10 | 15 | 20;
export type SystemDesignRadioKey = 'R' | 'A' | 'D' | 'I' | 'O';

export interface SystemDesignEvaluationSpine {
  mustCover: [string, string];
  strongSignals: [string, string];
  expertStretch: string;
  redFlag: string;
}

export interface SystemDesignDiscoveryMetadata {
  teaser: string;
  guideLabel: string;
}

export interface SystemDesignPracticeMetadata {
  targetLevel: SystemDesignTargetLevel;
  timeboxMinutes: SystemDesignTimeboxMinutes;
  candidatePrompt: string;
  constraints: string[];
  expectedDecisions: string[];
  prerequisites: string[];
  coreSkills: string[];
  guidedMock?: boolean;
  evaluationSpine?: SystemDesignEvaluationSpine;
}

export type SystemDesignEditorialRole =
  | 'canonical-model'
  | 'answer-checkpoint'
  | 'timeboxed-answer'
  | 'references';

export type SystemDesignCodeValidation =
  | {
    kind: 'contract' | 'example';
    level: 'syntax' | 'typecheck';
    group?: string;
  }
  | {
    kind: 'protocol';
    protocol: 'sse' | 'http';
    dataFormat?: 'json';
  }
  | {
    kind: 'data' | 'diagram' | 'pseudocode';
  };

type SystemDesignBlockEditorialMetadata = {
  editorialRole?: SystemDesignEditorialRole;
};

export type SystemDesignContentBlock = (
  | { type: 'text'; text: string }
  | { type: 'heading'; text: string }
  | {
    type: 'code';
    language?: string;
    code: string;
    height?: number;
    validation?: SystemDesignCodeValidation;
  }
  | {
    type: 'image';
    src: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
    srcWebp?: string;
    srcAvif?: string;
    priority?: boolean;
    fallbackText?: string;
  }
  | {
    type: 'checklist';
    title?: string;
    items: string[];
  }
  | {
    type: 'callout';
    title?: string;
    text: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
  }
  | {
    type: 'links';
    title?: string;
    items: Array<{
      label: string;
      href: string;
      description?: string;
    }>;
  }
  | {
    type: 'table';
    title?: string;
    columns: string[];
    rows: string[][];
  }
  | { type: 'divider' }
  | {
    type: 'columns';
    columns: Array<{
      width?: '1/2' | '1/3' | '2/3';
      blocks: SystemDesignContentBlock[];
    }>;
  }
  | {
    type: 'stats';
    items: Array<{
      label: string;
      value: string;
      helperText?: string;
    }>;
  }
  | {
    type: 'steps';
    title?: string;
    steps: Array<{
      title: string;
      text?: string;
    }>;
  }
) & SystemDesignBlockEditorialMetadata;

export interface SystemDesignRadioSection {
  key: SystemDesignRadioKey | string;
  title: string;
  content?: string;
  blocks?: SystemDesignContentBlock[];
}

export interface SystemDesignSectionReference {
  key: SystemDesignRadioKey | string;
  title: string;
  file: string;
}

export interface SystemDesignQuestion {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  type?: 'system-design';
  access?: AccessLevel;
  difficulty?: Difficulty;
  contentSchemaVersion?: 1 | 2;
  practice?: SystemDesignPracticeMetadata;
  discovery?: SystemDesignDiscoveryMetadata;
  sections?: SystemDesignSectionReference[];
  radio?: SystemDesignRadioSection[];
  companies?: string[];
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  guideSlug?: string;
  guide?: string;
  guidePath?: string;
  premiumPreview?: PremiumPreviewContent;
  seo?: QuestionSeo;
  contentLoadState?: 'ready' | 'error';
  editorial?: Record<string, unknown>;
  name?: string;
  meta?: { title?: string };
}

export interface SystemDesignListItem extends SystemDesignQuestion {
  title: string;
  description: string;
  tags: string[];
  type: 'system-design';
  access: AccessLevel;
}

const TARGET_LEVELS = new Set<SystemDesignTargetLevel>(['junior', 'mid', 'senior']);
const TIMEBOXES = new Set<SystemDesignTimeboxMinutes>([10, 15, 20]);

export function normalizeSystemDesignQuestion(value: unknown): SystemDesignQuestion | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = String(record['id'] || '').trim();
  if (!id) return null;

  const title = String(record['title'] || id).trim();
  const description = String(record['description'] || '').trim();
  const access = record['access'] === 'premium'
    ? 'premium'
    : record['access'] === 'free'
      ? 'free'
      : undefined;
  const difficulty = isDifficulty(record['difficulty']) ? record['difficulty'] : undefined;
  const contentSchemaVersion = record['contentSchemaVersion'] === 2
    ? 2
    : record['contentSchemaVersion'] === 1
      ? 1
      : undefined;
  const practice = isSystemDesignPracticeMetadata(record['practice'])
    ? clonePracticeMetadata(record['practice'])
    : undefined;
  const discovery = isSystemDesignDiscoveryMetadata(record['discovery'])
    ? { ...record['discovery'] }
    : undefined;
  const sanitizedRecord = { ...record };
  for (const key of [
    'access',
    'difficulty',
    'contentSchemaVersion',
    'practice',
    'discovery',
    'sections',
    'radio',
    'companies',
  ]) {
    delete sanitizedRecord[key];
  }

  return {
    ...sanitizedRecord,
    id,
    title,
    description,
    tags: toStringArray(record['tags']),
    type: 'system-design',
    ...(access ? { access } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(contentSchemaVersion ? { contentSchemaVersion } : {}),
    ...(practice ? { practice } : {}),
    ...(discovery ? { discovery } : {}),
    ...(Array.isArray(record['sections'])
      ? { sections: normalizeSectionReferences(record['sections']) }
      : {}),
    ...(Array.isArray(record['radio'])
      ? { radio: normalizeRadioSections(record['radio']) }
      : {}),
    ...(Array.isArray(record['companies'])
      ? { companies: toStringArray(record['companies']) }
      : {}),
  };
}

function normalizeSectionReferences(value: unknown[]): SystemDesignSectionReference[] {
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const key = String(record['key'] || '').trim();
    const title = String(record['title'] || '').trim();
    const file = String(record['file'] || '').trim();
    return key && title && file ? [{ key, title, file }] : [];
  });
}

function normalizeRadioSections(value: unknown[]): SystemDesignRadioSection[] {
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const key = String(record['key'] || '').trim();
    const title = String(record['title'] || '').trim();
    if (!key || !title) return [];
    return [{
      key,
      title,
      ...(typeof record['content'] === 'string' ? { content: record['content'] } : {}),
      ...(Array.isArray(record['blocks'])
        ? { blocks: record['blocks'] as SystemDesignContentBlock[] }
        : {}),
    }];
  });
}

export function resolveSystemDesignPractice(
  question: Pick<SystemDesignQuestion, 'description' | 'difficulty' | 'practice' | 'tags'>,
): SystemDesignPracticeMetadata {
  if (isSystemDesignPracticeMetadata(question.practice)) {
    return clonePracticeMetadata(question.practice);
  }

  const difficulty = question.difficulty ?? 'intermediate';
  const targetLevel: SystemDesignTargetLevel = difficulty === 'easy'
    ? 'junior'
    : difficulty === 'hard'
      ? 'senior'
      : 'mid';
  const timeboxMinutes: SystemDesignTimeboxMinutes = targetLevel === 'junior'
    ? 10
    : targetLevel === 'senior'
      ? 20
      : 15;

  return {
    targetLevel,
    timeboxMinutes,
    candidatePrompt: String(question.description || '').trim(),
    constraints: [
      'Keep client, server, and rendering ownership explicit.',
      'Cover loading, failure, recovery, and accessible interaction states.',
    ],
    expectedDecisions: [
      'State and ownership boundaries',
      'API and event contracts',
      'Performance and failure tradeoffs',
    ],
    prerequisites: [
      'Client-side state management',
      'Accessible UI fundamentals',
    ],
    coreSkills: fallbackCoreSkills(question.tags ?? []),
    guidedMock: false,
  };
}

export function isSystemDesignPracticeMetadata(
  value: unknown,
): value is SystemDesignPracticeMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return TARGET_LEVELS.has(record['targetLevel'] as SystemDesignTargetLevel)
    && TIMEBOXES.has(record['timeboxMinutes'] as SystemDesignTimeboxMinutes)
    && typeof record['candidatePrompt'] === 'string'
    && isStringArrayWithin(record['constraints'], 2, 4)
    && isStringArrayWithin(record['expectedDecisions'], 3, 3)
    && isStringArrayWithin(record['prerequisites'], 2, 4)
    && isStringArrayWithin(record['coreSkills'], 2, 4)
    && (record['guidedMock'] === undefined || typeof record['guidedMock'] === 'boolean')
    && (
      record['evaluationSpine'] === undefined
      || isSystemDesignEvaluationSpine(record['evaluationSpine'])
    );
}

function clonePracticeMetadata(practice: SystemDesignPracticeMetadata): SystemDesignPracticeMetadata {
  return {
    targetLevel: practice.targetLevel,
    timeboxMinutes: practice.timeboxMinutes,
    candidatePrompt: practice.candidatePrompt,
    constraints: [...practice.constraints],
    expectedDecisions: [...practice.expectedDecisions],
    prerequisites: [...practice.prerequisites],
    coreSkills: [...practice.coreSkills],
    ...(practice.guidedMock === undefined ? {} : { guidedMock: practice.guidedMock }),
    ...(practice.evaluationSpine
      ? {
        evaluationSpine: {
          mustCover: [...practice.evaluationSpine.mustCover] as [string, string],
          strongSignals: [...practice.evaluationSpine.strongSignals] as [string, string],
          expertStretch: practice.evaluationSpine.expertStretch,
          redFlag: practice.evaluationSpine.redFlag,
        },
      }
      : {}),
  };
}

function isSystemDesignEvaluationSpine(value: unknown): value is SystemDesignEvaluationSpine {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return isStringArrayWithin(record['mustCover'], 2, 2)
    && isStringArrayWithin(record['strongSignals'], 2, 2)
    && typeof record['expertStretch'] === 'string'
    && record['expertStretch'].trim().length > 0
    && typeof record['redFlag'] === 'string'
    && record['redFlag'].trim().length > 0;
}

function isSystemDesignDiscoveryMetadata(value: unknown): value is SystemDesignDiscoveryMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record['teaser'] === 'string'
    && record['teaser'].trim().length > 0
    && typeof record['guideLabel'] === 'string'
    && record['guideLabel'].trim().length > 0;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'intermediate' || value === 'hard';
}

function isStringArrayWithin(value: unknown, min: number, max: number): value is string[] {
  return Array.isArray(value)
    && value.length >= min
    && value.length <= max
    && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function fallbackCoreSkills(tags: string[]): string[] {
  const skills = toStringArray(tags)
    .map(humanizeTag)
    .filter((skill, index, all) => all.indexOf(skill) === index)
    .slice(0, 4);

  for (const fallback of ['Frontend architecture', 'State management']) {
    if (skills.length >= 2) break;
    if (!skills.includes(fallback)) skills.push(fallback);
  }
  return skills;
}

function humanizeTag(tag: string): string {
  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
