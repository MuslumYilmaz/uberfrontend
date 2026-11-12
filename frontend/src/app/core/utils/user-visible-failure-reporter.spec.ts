import { UserVisibleFailureReporter, siteStylesheetsBlocked } from './user-visible-failure-reporter';

describe('UserVisibleFailureReporter', () => {
  const PERSON_TAGS = { visitor_class: 'human', stylesheets_blocked: 'false' };

  it('holds failures reported before Sentry loads and sends them once it attaches', () => {
    const reporter = new UserVisibleFailureReporter(() => false);
    const sentry = { captureMessage: jasmine.createSpy('captureMessage') };

    reporter.report('editor_load_failed', { phase: 'timeout', moduleId: 'vs/editor/editor.main' });
    reporter.report('runner_force_stopped', { timeoutMs: 2000 });
    expect(sentry.captureMessage).not.toHaveBeenCalled();

    reporter.attachSentry(sentry as any, { visitorClass: 'human' });
    reporter.report('runner_crashed');

    expect(sentry.captureMessage.calls.allArgs()).toEqual([
      ['Code editor failed to load', {
        level: 'error',
        tags: { source: 'user_visible', failure: 'editor_load_failed', ...PERSON_TAGS },
        extra: { phase: 'timeout', moduleId: 'vs/editor/editor.main' },
      }],
      ['Code runner was force-stopped', {
        level: 'warning',
        tags: { source: 'user_visible', failure: 'runner_force_stopped', ...PERSON_TAGS },
        extra: { timeoutMs: 2000 },
      }],
      ['Code runner crashed', {
        level: 'error',
        tags: { source: 'user_visible', failure: 'runner_crashed', ...PERSON_TAGS },
        extra: {},
      }],
    ]);
  });

  it('sends the failures of bots and of browsers that block the site stylesheets as tagged warnings, in an issue of their own', () => {
    const sent = (visitorClass: 'human' | 'suspect' | 'automation', stylesheetsBlocked: boolean) => {
      const reporter = new UserVisibleFailureReporter(() => stylesheetsBlocked);
      const sentry = { captureMessage: jasmine.createSpy('captureMessage') };
      reporter.attachSentry(sentry as any, { visitorClass });
      reporter.report('editor_load_failed', { moduleId: 'vs/css!vs/editor/editor.main' });
      const [, context] = sentry.captureMessage.calls.mostRecent().args;
      return {
        level: context.level,
        visitorClass: context.tags.visitor_class,
        blocked: context.tags.stylesheets_blocked,
        fingerprint: context.fingerprint,
      };
    };
    const ownIssue = ['{{ default }}', 'likely-bot'];

    // A person's failure keeps Sentry's default grouping, so it lands in the issue that alerts.
    expect(sent('human', false)).toEqual({ level: 'error', visitorClass: 'human', blocked: 'false', fingerprint: undefined });
    expect(sent('suspect', false)).toEqual({ level: 'warning', visitorClass: 'suspect', blocked: 'false', fingerprint: ownIssue });
    expect(sent('automation', false)).toEqual({ level: 'warning', visitorClass: 'automation', blocked: 'false', fingerprint: ownIssue });
    expect(sent('human', true)).toEqual({ level: 'warning', visitorClass: 'human', blocked: 'true', fingerprint: ownIssue });
  });

  it('checks the stylesheets when a held failure is sent, after the page has had time to load', () => {
    let blocked = false;
    const reporter = new UserVisibleFailureReporter(() => blocked);
    const sentry = { captureMessage: jasmine.createSpy('captureMessage') };

    reporter.report('editor_load_failed', { moduleId: 'vs/css!vs/editor/editor.main' });
    blocked = true;
    reporter.attachSentry(sentry as any, { visitorClass: 'human' });

    expect(sentry.captureMessage.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
      level: 'warning',
      tags: jasmine.objectContaining({ stylesheets_blocked: 'true' }),
      fingerprint: ['{{ default }}', 'likely-bot'],
    }));
  });

  it('reports a repeated failure once per page but keeps distinct failures', () => {
    const reporter = new UserVisibleFailureReporter(() => false);
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
    const reporter = new UserVisibleFailureReporter(() => false);
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

describe('siteStylesheetsBlocked', () => {
  // How Chrome leaves a link: a loaded sheet with readable rules, or, after a blocked or failed request, a sheet
  // whose rules throw when read. A sheet that never arrived is null.
  const SHEETS = {
    loaded: { cssRules: { length: 231 } },
    blocked: { get cssRules(): never { throw new DOMException('Cannot access rules', 'SecurityError'); } },
    missing: null,
  };

  function page(links: Array<{ href: string; sheet: keyof typeof SHEETS }>, readyState = 'complete'): Document {
    const doc = document.implementation.createHTMLDocument('page');
    const base = doc.createElement('base');
    base.href = 'https://frontendatlas.com/';
    doc.head.appendChild(base);
    for (const { href, sheet } of links) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      Object.defineProperty(link, 'sheet', { value: SHEETS[sheet] });
      doc.head.appendChild(link);
    }
    Object.defineProperty(doc, 'readyState', { value: readyState });
    return doc;
  }

  it('is true only when none of the page\'s own stylesheets loaded', () => {
    expect(siteStylesheetsBlocked(page([
      { href: 'styles-MIIPZSXT.css', sheet: 'blocked' },
      { href: '/assets/prime-ssr/c051.css', sheet: 'blocked' },
      { href: '/assets/vendor/primeicons/primeicons.css', sheet: 'missing' },
    ]))).toBeTrue();
    expect(siteStylesheetsBlocked(page([
      { href: 'styles-MIIPZSXT.css', sheet: 'loaded' },
      { href: '/assets/prime-ssr/c051.css', sheet: 'blocked' },
    ]))).toBeFalse();
  });

  it('ignores stylesheets from other origins and pages without stylesheets of their own', () => {
    expect(siteStylesheetsBlocked(page([
      { href: 'https://fonts.googleapis.com/css2?family=Inter', sheet: 'blocked' },
    ]))).toBeFalse();
    expect(siteStylesheetsBlocked(page([
      { href: 'https://fonts.googleapis.com/css2?family=Inter', sheet: 'loaded' },
      { href: 'styles-MIIPZSXT.css', sheet: 'blocked' },
    ]))).toBeTrue();
  });

  it('is false while the page is still loading, when a stylesheet may still be on its way', () => {
    expect(siteStylesheetsBlocked(page([{ href: 'styles-MIIPZSXT.css', sheet: 'missing' }], 'interactive'))).toBeFalse();
  });
});
