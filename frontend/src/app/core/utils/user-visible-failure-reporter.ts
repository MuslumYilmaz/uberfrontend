import type { SeverityLevel } from '@sentry/browser';

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
 * The UI already handles these failures (the editor falls back to a plain
 * text area, the runner shows an error), so Sentry never sees them unless
 * they are reported here. Reports carry no user code. A report made before
 * Sentry loads waits until TelemetryBootstrapService attaches the client.
 */
export class UserVisibleFailureReporter {
  private client: SentryMessageClient | null = null;
  private readonly pending: Array<{ kind: UserVisibleFailureKind; details: UserVisibleFailureDetails }> = [];
  private readonly reported = new Set<string>();

  attachSentry(client: SentryMessageClient): void {
    this.client = client;
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
      this.client?.captureMessage(message, {
        level,
        tags: { source: 'user_visible', failure: kind },
        extra: details,
      });
    } catch {
      // Monitoring must never affect the page.
    }
  }
}

export const userVisibleFailures = new UserVisibleFailureReporter();
