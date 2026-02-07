import { Question } from '../../../core/models/question.model';

const TITLE_MAX_LEN = 65;
const DESCRIPTION_MAX_LEN = 156;

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

export function sanitizeSerpText(input: string, maxLen: number): string {
  const normalized = normalizeWhitespace(
    decodeHtmlEntities(String(input || ''))
      .replace(/<[^>]+>/g, ' ')
  );

  if (!normalized) return '';
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function frameworkLabel(tech?: string): string {
  return TECH_LABELS[String(tech || '').trim().toLowerCase()] || 'Frontend';
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

export function seoTitleForQuestion(q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>): string {
  const override = sanitizeSerpText(q.seo?.title || '', TITLE_MAX_LEN);
  if (override) return override;

  const framework = frameworkLabel(q.technology);
  const concept = titleConcept(q) || 'Interview Concept';
  const candidate = `${framework} ${concept} — Interview Answer`;
  const normalized = sanitizeSerpText(candidate, TITLE_MAX_LEN);
  if (normalized) return normalized;

  return sanitizeSerpText(`${framework} front-end trivia — Interview Answer`, TITLE_MAX_LEN);
}

export function seoDescriptionForQuestion(
  q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>,
  plainDescription: string,
  tech: string
): string {
  const override = sanitizeSerpText(q.seo?.description || '', DESCRIPTION_MAX_LEN);
  if (override) return override;

  const framework = frameworkLabel(q.technology || tech);
  const concept = titleConcept(q) || slugToConcept((q as any).id, (q as any).technology || tech) || 'front-end concept';
  const descFromContent = sanitizeSerpText(plainDescription || '', 120);
  return sanitizeSerpText(
    `${framework} explanation of ${concept}. Common mistakes, gotchas, and interview-ready reasoning with quick examples. ${descFromContent}`,
    DESCRIPTION_MAX_LEN
  );
}
