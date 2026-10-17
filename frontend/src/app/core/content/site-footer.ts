import catalog from './site-footer.json';

export type SiteFooterLink = {
  label: string;
  /** Internal route, rendered with routerLink. */
  route?: string;
  /** External or mailto destination, rendered as a plain anchor. */
  href?: string;
  external?: boolean;
};

export type SiteFooterGroup = {
  id: string;
  title: string;
  links: SiteFooterLink[];
};

/**
 * The site footer is static content: the same links on every public page, no
 * auth-dependent variation, so the server HTML and the hydrated DOM match.
 * `scripts/audit-site-footer-links.mjs` reads the same JSON to verify the
 * prerendered pages.
 */
export const SITE_FOOTER_GROUPS: readonly SiteFooterGroup[] = catalog.groups;
export const SITE_FOOTER_LEGAL_LINKS: readonly SiteFooterLink[] = catalog.legal;

const toRegExps = (patterns: readonly string[]): readonly RegExp[] => patterns.map((pattern) => new RegExp(pattern));

// Workspace surfaces (coding editors, debugging and mock interviews) and private
// app routes keep their own chrome; every other public page ends with the footer.
const HIDDEN_ROUTE_PATTERNS = toRegExps(catalog.visibility.hiddenRoutePatterns);
// Pages whose content panel owns vertical scrolling (trivia detail) render the
// footer inside that panel themselves; a footer after <main> would give the
// document a second scroll range (see e2e/ui-layout-contracts.spec.ts).
const EMBEDDED_ROUTE_PATTERNS = toRegExps(catalog.visibility.embeddedRoutePatterns);
// System-design detail pages scroll with the document under the fixed practice
// bar, so the footer reserves space for it.
const PRACTICE_BAR_ROUTE_PATTERNS = toRegExps(catalog.visibility.practiceBarRoutePatterns);

const pathOnly = (url: string): string => (url || '/').split('?')[0].split('#')[0] || '/';

/** Public pages carry the footer somewhere in their HTML. */
export function showsSiteFooter(url: string): boolean {
  const path = pathOnly(url);
  return !HIDDEN_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

/** Pages that render the footer inside their own scroll panel instead of the app shell. */
export function embedsSiteFooter(url: string): boolean {
  const path = pathOnly(url);
  return showsSiteFooter(path) && EMBEDDED_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

/** The app shell renders the footer after <main> on every public page that does not embed it. */
export function shellRendersSiteFooter(url: string): boolean {
  return showsSiteFooter(url) && !embedsSiteFooter(url);
}

export function hasPracticeBar(url: string): boolean {
  const path = pathOnly(url);
  return PRACTICE_BAR_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}
