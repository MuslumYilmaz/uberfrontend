import { UserVisibleFailureReporter } from './user-visible-failure-reporter';

describe('UserVisibleFailureReporter', () => {
  it('holds failures reported before Sentry loads and sends them once it attaches', () => {
    const reporter = new UserVisibleFailureReporter();
    const sentry = { captureMessage: jasmine.createSpy('captureMessage') };

    reporter.report('editor_load_failed', { phase: 'timeout', moduleId: 'vs/editor/editor.main' });
    reporter.report('runner_force_stopped', { timeoutMs: 2000 });
    expect(sentry.captureMessage).not.toHaveBeenCalled();

    reporter.attachSentry(sentry as any);
    reporter.report('runner_crashed');

    expect(sentry.captureMessage.calls.allArgs()).toEqual([
      ['Code editor failed to load', {
        level: 'error',
        tags: { source: 'user_visible', failure: 'editor_load_failed' },
        extra: { phase: 'timeout', moduleId: 'vs/editor/editor.main' },
      }],
      ['Code runner was force-stopped', {
        level: 'warning',
        tags: { source: 'user_visible', failure: 'runner_force_stopped' },
        extra: { timeoutMs: 2000 },
      }],
      ['Code runner crashed', {
        level: 'error',
        tags: { source: 'user_visible', failure: 'runner_crashed' },
        extra: {},
      }],
    ]);
  });

  it('reports a repeated failure once per page but keeps distinct failures', () => {
    const reporter = new UserVisibleFailureReporter();
    const sentry = { captureMessage: jasmine.createSpy('captureMessage') };
    reporter.attachSentry(sentry as any);

    reporter.report('runner_force_stopped', { timeoutMs: 2000 });
    reporter.report('runner_force_stopped', { timeoutMs: 2000 });
    reporter.report('runner_force_stopped', { timeoutMs: 4000 });
    reporter.report('preview_timed_out');

    expect(sentry.captureMessage.calls.allArgs().map(([, context]) => context.extra)).toEqual([
      { timeoutMs: 2000 },
      { timeoutMs: 4000 },
      {},
    ]);
  });

  it('bounds the failures waiting for Sentry and never throws from monitoring', () => {
    const reporter = new UserVisibleFailureReporter();
    const sentry = {
      captureMessage: jasmine.createSpy('captureMessage').and.throwError('transport down'),
    };

    for (let attempt = 0; attempt < 15; attempt += 1) {
      reporter.report('runner_force_stopped', { attempt });
    }

    expect(() => reporter.attachSentry(sentry as any)).not.toThrow();
    expect(sentry.captureMessage).toHaveBeenCalledTimes(10);
    expect(() => reporter.report('runner_crashed')).not.toThrow();
  });
});
