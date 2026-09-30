import { PUBLIC_QUESTION_NAVIGATION } from '../../generated/public-question-navigation';

const PUBLIC_ROUTES = new Set(PUBLIC_QUESTION_NAVIGATION.map((item) => item.route));

/** Only expose catalog-approved, indexable practice destinations as crawlable links. */
export function publicQuestionHref(item?: { tech: string; kind: string; id: string } | null): string | null {
  if (!item) return null;
  const route = `/${item.tech}/${item.kind}/${encodeURIComponent(item.id)}`;
  return PUBLIC_ROUTES.has(route) ? route : null;
}
