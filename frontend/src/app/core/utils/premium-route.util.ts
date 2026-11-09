import { PREMIUM_QUESTION_ROUTES } from '../../generated/premium-question-routes';

const PREMIUM_ROUTES = new Set(PREMIUM_QUESTION_ROUTES);

/** Whether a practice link leads to a page that needs Premium. Takes a path or router commands. */
export function isPremiumRoute(path: string | readonly string[] | null | undefined): boolean {
  if (!path || !path.length) return false;
  const route = typeof path === 'string' ? path : path.join('/');
  return PREMIUM_ROUTES.has(`/${route.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')}`);
}
