import { Question } from '../../../core/models/question.model';

const TITLE_MAX_LEN = 65;
const DESCRIPTION_MAX_LEN = 156;

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

export function seoTitleForQuestion(q: Pick<Question, 'title' | 'seo'>): string {
  const override = sanitizeSerpText(q.seo?.title || '', TITLE_MAX_LEN);
  if (override) return override;

  const title = sanitizeSerpText(q.title || '', TITLE_MAX_LEN);
  if (!title) return 'Front-end trivia question';
  if (/interview/i.test(title)) return title;

  return sanitizeSerpText(`${title} (Interview Answer)`, TITLE_MAX_LEN);
}

export function seoDescriptionForQuestion(
  q: Pick<Question, 'title' | 'seo'>,
  plainDescription: string,
  tech: string
): string {
  const override = sanitizeSerpText(q.seo?.description || '', DESCRIPTION_MAX_LEN);
  if (override) return override;

  const desc = sanitizeSerpText(plainDescription || '', DESCRIPTION_MAX_LEN);
  if (desc) return desc;

  const techLabel = sanitizeSerpText(tech || 'front-end', 24) || 'front-end';
  return sanitizeSerpText(
    `${q.title || 'Front-end trivia question'} Learn what breaks, why it happens, and the safe ${techLabel} interview fix.`,
    DESCRIPTION_MAX_LEN
  );
}
