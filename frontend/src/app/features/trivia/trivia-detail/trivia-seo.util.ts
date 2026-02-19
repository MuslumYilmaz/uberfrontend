import { Question } from '../../../core/models/question.model';

const TITLE_MAX_LEN = 65;
const DESCRIPTION_MAX_LEN = 155;

const TECH_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function trimWordBoundary(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;

  const sliced = value.slice(0, Math.max(0, maxLen)).trimEnd();
  const minSoftBreak = Math.floor(maxLen * 0.65);
  const breakAt = sliced.lastIndexOf(' ');
  const clipped = breakAt >= minSoftBreak ? sliced.slice(0, breakAt) : sliced;
  return clipped.replace(/[\s,;:/-]+$/g, '').trim();
}

export function sanitizeSerpText(input: string, maxLen: number): string {
  const normalized = normalizeWhitespace(
    decodeHtmlEntities(String(input || ''))
      .replace(/<[^>]+>/g, ' ')
  );

  if (!normalized) return '';
  return trimWordBoundary(normalized, maxLen);
}

function frameworkLabel(tech?: string): string {
  return TECH_LABELS[String(tech || '').trim().toLowerCase()] || 'Frontend';
}

function questionSeoTitle(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.title === 'string' ? q.seo.title : '';
  return sanitizeSerpText(raw, TITLE_MAX_LEN);
}

function questionSeoDescription(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.description === 'string' ? q.seo.description : '';
  return sanitizeSerpText(raw, DESCRIPTION_MAX_LEN);
}

function slugToConcept(id?: string, tech?: string): string {
  const normalizedId = String(id || '').trim().toLowerCase();
  if (!normalizedId) return '';
  const normalizedTech = String(tech || '').trim().toLowerCase();
  const withoutTech = normalizedTech && normalizedId.startsWith(`${normalizedTech}-`)
    ? normalizedId.slice(normalizedTech.length + 1)
    : normalizedId;

  return sanitizeSerpText(
    withoutTech
      .replace(/-/g, ' ')
      .replace(/\bdom\b/gi, 'DOM')
      .replace(/\bjsx\b/gi, 'JSX')
      .replace(/\bapi\b/gi, 'API')
      .replace(/\bhttp\b/gi, 'HTTP')
      .replace(/\bv-if\b/gi, 'v-if')
      .replace(/\bv-show\b/gi, 'v-show')
      .replace(/\btorefs\b/gi, 'toRefs')
      .replace(/\btoref\b/gi, 'toRef')
      .replace(/\bvs\b/gi, 'vs')
      .replace(/\b\w/g, (ch) => ch.toUpperCase()),
    46
  );
}

function titleConcept(q: Pick<Question, 'title' | 'id' | 'technology'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim(), 70);
  if (title) {
    const trimmed = title
      .replace(/^(what|why|how)\s+(does|is|are|to|can|do)\s+/i, '')
      .replace(/^(what|why|how)\s+/i, '')
      .replace(/\?+$/, '')
      .trim();
    if (trimmed.length >= 10) return sanitizeSerpText(trimmed, 46);
  }
  return slugToConcept((q as any).id, (q as any).technology);
}

function normalizedQuestionTitle(q: Pick<Question, 'title'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim(), 96);
  if (!title) return '';

  const cleaned = title
    .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do)\s+/i, '')
    .replace(/^(what|why|how|when|where)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();

  return cleaned.length >= 8 ? sanitizeSerpText(cleaned, 88) : title;
}

export function seoTitleForQuestion(q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>): string {
  const explicit = questionSeoTitle(q);
  if (explicit) {
    return explicit;
  }

  const framework = frameworkLabel(q.technology);
  const questionTitle = normalizedQuestionTitle(q);
  const concept = titleConcept(q) || 'Interview Concept';
  const prefixedQuestionTitle = questionTitle
    && new RegExp(`^${framework}\\b`, 'i').test(questionTitle)
    ? questionTitle
    : `${framework} ${questionTitle || concept}`;
  const candidate = sanitizeSerpText(prefixedQuestionTitle, TITLE_MAX_LEN);
  const normalized = sanitizeSerpText(candidate, TITLE_MAX_LEN);
  if (normalized) return normalized;

  return sanitizeSerpText(`${framework} interview answer`, TITLE_MAX_LEN);
}

export function seoDescriptionForQuestion(
  q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>,
  plainDescription: string,
  tech: string
): string {
  const explicit = questionSeoDescription(q);
  if (explicit) {
    return explicit;
  }

  const framework = frameworkLabel(q.technology || tech);
  const concept = titleConcept(q)
    || slugToConcept((q as any).id, (q as any).technology || tech)
    || 'front-end concept';
  const questionTitle = normalizedQuestionTitle(q);
  const descFromContent = sanitizeSerpText(plainDescription || '', 120);
  const lead = questionTitle
    ? `${framework} interview answer for ${questionTitle}.`
    : `${framework} interview answer for ${concept}.`;
  const body = descFromContent
    || `${framework} explanation with tradeoffs, common mistakes, and real-world examples.`;

  return sanitizeSerpText(
    `${lead} ${body}`,
    DESCRIPTION_MAX_LEN
  );
}
