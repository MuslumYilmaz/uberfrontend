import type { SeverityLevel } from '@sentry/browser';
import type { AnalyticsVisitorClass } from '../services/analytics.service';

type SentryMessageClient = Pick<typeof import('@sentry/browser'), 'captureMessage'>;

export type UserVisibleFailureKind =
  | 'editor_load_failed'
  | 'runner_crashed'
  | 'runner_force_stopped'
  | 'preview_timed_out';

export type UserVisibleFailureDetails = Record<string, string | number | undefined>;

const FAILURES: Record<UserVisibleFailureKind, { message: string; level: SeverityLevel }> = {
  editor_load_failed: { message: 'Code editor failed to load', level: 'error' },
  runner_crashed: { message: 'Code runner crashed', level: 'error' },
  // A force-stopped runner usually ran the visitor's own endless loop, and a
  // preview can time out on a slow connection, so both are counted as trends
  // without raising a high-priority alert.
  runner_force_stopped: { message: 'Code runner was force-stopped', level: 'warning' },
  preview_timed_out: { message: 'Framework preview timed out', level: 'warning' },
};
const MAX_PENDING_REPORTS = 10;

/**
 * True when none of the page's own stylesheets loaded: scrapers that skip
 * CSS, fonts and images look like this, and with no stylesheet the editor
 * cannot load either. Until the page has finished loading a stylesheet may
 * still be on its way, so the answer is false.
 */
export function siteStylesheetsBlocked(doc: Document): boolean {
  if (doc.readyState !== 'complete') return false;
  let origin: string;
  try {
    origin = new URL(doc.baseURI).origin;
  } catch {
    return false;
  }
  const ownStylesheets = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]'))
    .filter((link) => {
      try {
        return new URL(link.href).origin === origin;
      } catch {
        return false;
      }
    });
  return ownStylesheets.length > 0 && ownStylesheets.every((link) => !hasRules(link));
}

// Chrome gives a stylesheet that failed to load a sheet whose rules cannot be
// read, so only readable rules show that a stylesheet loaded.
function hasRules(link: HTMLLinkElement): boolean {
  try {
    return (link.sheet?.cssRules.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * The UI already handles these failures (the editor falls back to a plain
 * text area, the runner shows an error), so Sentry never sees them unless
 * they are reported here. Reports carry no user code. A report made before
 * Sentry loads waits until TelemetryBootstrapService attaches the client.
 */
export class UserVisibleFailureReporter {
  private client: SentryMessageClient | null = null;
  private visitorClass: AnalyticsVisitorClass | null = null;
  private readonly pending: Array<{ kind: UserVisibleFailureKind; details: UserVisibleFailureDetails }> = [];
  private readonly reported = new Set<string>();

  constructor(
    private readonly stylesheetsBlocked: () => boolean = () =>
      typeof document !== 'undefined' && siteStylesheetsBlocked(document),
  ) {}

  attachSentry(client: SentryMessageClient, context: { visitorClass?: AnalyticsVisitorClass } = {}): void {
    this.client = client;
    this.visitorClass = context.visitorClass ?? null;
    for (const { kind, details } of this.pending.splice(0)) this.send(kind, details);
  }

  /** Reports each failure once per page, however often the visitor retries. */
  report(kind: UserVisibleFailureKind, details: UserVisibleFailureDetails = {}): void {
    const page = typeof location === 'undefined' ? '' : location.pathname;
    const key = `${kind}|${page}|${JSON.stringify(details)}`;
    if (this.reported.has(key)) return;
    this.reported.add(key);

    if (this.client) {
      this.send(kind, details);
    } else if (this.pending.length < MAX_PENDING_REPORTS) {
      this.pending.push({ kind, details });
    }
  }

  private send(kind: UserVisibleFailureKind, details: UserVisibleFailureDetails): void {
    const { message, level } = FAILURES[kind];
    try {
      const visitorClass = this.visitorClass ?? 'unknown';
      const stylesheetsBlocked = this.stylesheetsBlocked();
      // Reports from bots, and from browsers that block the site's own
      // stylesheets (scrapers do, people practically never do), stay
      // countable as warnings in an issue of their own, so they neither page
      // anyone nor bury a person's failure in an issue that already exists.
      const likelyBot = visitorClass === 'automation' || visitorClass === 'suspect' || stylesheetsBlocked;
      this.client?.captureMessage(message, {
        level: likelyBot ? 'warning' : level,
        tags: {
          source: 'user_visible',
          failure: kind,
          visitor_class: visitorClass,
          stylesheets_blocked: String(stylesheetsBlocked),
        },
        ...(likelyBot ? { fingerprint: ['{{ default }}', 'likely-bot'] } : {}),
        extra: details,
      });
    } catch {
      // Monitoring must never affect the page.
    }
  }
}

export const userVisibleFailures = new UserVisibleFailureReporter();
