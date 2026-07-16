import {
  OpaqueCheckCancelledError,
  OpaqueDomCheckRunner,
  OpaquePreviewReadyTimeoutError,
} from './opaque-dom-check-runner';
import { makeReactPreviewHtml } from '../../../core/utils/react-preview-builder';

describe('OpaqueDomCheckRunner', () => {
  let runner: OpaqueDomCheckRunner;

  beforeEach(() => {
    runner = new OpaqueDomCheckRunner();
    delete document.body.dataset['opaqueCheckPwned'];
  });

  afterEach(() => {
    runner.destroy();
    delete document.body.dataset['opaqueCheckPwned'];
  });

  it('runs web checks in an allow-scripts-only opaque iframe and blocks parent DOM access', async () => {
    const run = runner.runWeb(
      '<!doctype html><html><body><button class="cta">Save</button></body></html>',
      `
        test('cannot reach the parent DOM', () => {
          let blocked = false;
          try {
            window.parent.document.body.dataset.opaqueCheckPwned = 'yes';
          } catch (_error) {
            blocked = true;
          }
          expect(blocked).toBeTruthy();
          expect(q('.cta').textContent.trim()).toBe('Save');
          expect('</script><script>').toBe('</script><script>');
        });
      `,
    );
    const frame = document.querySelector('iframe[aria-hidden="true"]') as HTMLIFrameElement | null;

    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('sandbox')).toBe('allow-scripts');

    const results = await run;

    expect(results).toEqual([{ name: 'cannot reach the parent DOM', passed: true }]);
    expect(document.body.dataset['opaqueCheckPwned']).toBeUndefined();
    expect(frame?.isConnected).toBeFalse();
  });

  it('awaits async web tests, preserves source order, and clamps serialized errors', async () => {
    const results = await runner.runWeb(
      '<!doctype html><html><body><div class="status">ready</div></body></html>',
      `
        test('async first', async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
          expect(q('.status').textContent).toBe('ready');
        });
        test('bounded failure', () => {
          throw new Error('x'.repeat(5000));
        });
      `,
    );

    expect(results.map((result) => result.name)).toEqual(['async first', 'bounded failure']);
    expect(results[0].passed).toBeTrue();
    expect(results[1].passed).toBeFalse();
    expect(results[1].error?.length).toBe(4000);
  });

  it('retries a web document that misses its first readiness handshake', async () => {
    const runFrame = spyOn<any>(runner, 'runFrame').and.returnValues(
      Promise.reject(new OpaquePreviewReadyTimeoutError('web')),
      Promise.resolve([{ name: 'runs after retry', passed: true }]),
    );

    const results = await runner.runWeb(
      '<!doctype html><html><body><div class="status">ready</div></body></html>',
      `test('runs after retry', () => expect(q('.status').textContent).toBe('ready'));`,
      { readyTimeoutMs: 4_000 },
    );

    const firstOptions = runFrame.calls.argsFor(0)[0] as {
      config: { invocationId: string; frameId: string };
      readyTimeoutMs: number;
    };
    const secondOptions = runFrame.calls.argsFor(1)[0] as {
      config: { invocationId: string; frameId: string };
      readyTimeoutMs: number;
    };
    expect(runFrame).toHaveBeenCalledTimes(2);
    expect(firstOptions.config.invocationId).toBe(secondOptions.config.invocationId);
    expect(firstOptions.config.frameId).not.toBe(secondOptions.config.frameId);
    expect(firstOptions.readyTimeoutMs).toBe(2_000);
    expect(secondOptions.readyTimeoutMs).toBe(2_000);
    expect(results).toEqual([{ name: 'runs after retry', passed: true }]);
  });

  it('ignores forged result messages with the wrong source, invocation, or frame ID', async () => {
    spyOn<any>(runner, 'createId').and.returnValues('active-invocation', 'active-frame');
    const run = runner.runFramework(
      `<!doctype html><html><body>
        <div class="value">real</div>
        <div class="token-state"></div>
        <input class="entry" />
        <script>
          document.querySelector('.token-state').textContent = typeof window.__FA_PREVIEW_READY_TOKEN;
          setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('test'), 30);
        <\/script>
      </body></html>`,
      [{
        id: 'real-check',
        name: 'Real check',
        steps: [
          { type: 'expectText', selector: '.value', text: 'real' },
          { type: 'expectText', selector: '.token-state', text: 'undefined' },
          { type: 'key', selector: '.entry', key: 'Enter' },
          { type: 'expectFocused', selector: '.entry' },
        ],
      }],
    );
    const frame = document.querySelector('iframe[aria-hidden="true"]') as HTMLIFrameElement;
    const forged = {
      channel: 'FA_OPAQUE_CHECK',
      version: 2,
      invocationId: 'active-invocation',
      frameId: 'forged-frame',
      kind: 'framework',
      results: [{ name: 'Forged check', passed: true }],
    };

    window.dispatchEvent(new MessageEvent('message', { source: window, data: forged }));
    window.dispatchEvent(new MessageEvent('message', { source: frame.contentWindow, data: forged }));

    await expectAsync(run).toBeResolvedTo([{ name: 'Real check', passed: true }]);
  });

  it('short-circuits a fatal compilation failure and classifies every named check', async () => {
    const createElement = spyOn(document, 'createElement').and.callThrough();
    const checks = [
      { id: 'one', name: 'First assertion', steps: [{ type: 'expectExists', selector: '.one' }] },
      { id: 'two', name: 'Second assertion', steps: [{ type: 'expectExists', selector: '.two' }] },
      { id: 'three', name: 'Third assertion', steps: [{ type: 'expectExists', selector: '.three' }] },
    ] as any;

    const results = await runner.runFramework(
      `<!doctype html><html><body><script>
        window.__FA_NOTIFY_PREVIEW_READY('compile-error', 'Unexpected token <private-source>\\nconst secret = 1');
      <\/script></body></html>`,
      checks,
    );

    expect(results.map(result => result.name)).toEqual([
      'First assertion',
      'Second assertion',
      'Third assertion',
    ]);
    expect(results.every(result => result.failureKind === 'compilation')).toBeTrue();
    expect(results[0].error).toContain('Preview compilation failed: Unexpected token private-source');
    expect(results[0].error).not.toContain('const secret');
    expect(createElement.calls.allArgs().filter(([tag]) => tag === 'iframe').length).toBe(1);
    expect(document.querySelector('iframe[aria-hidden="true"]')).toBeNull();
  });

  it('distinguishes boot, runtime, readiness, and assertion-execution failures', async () => {
    const check = [{
      id: 'bounded-failure',
      name: 'Bounded failure',
      steps: [{ type: 'wait', durationMs: 100 }],
    }] as any;

    const boot = await runner.runFramework(
      `<!doctype html><html><body><script>
        window.__FA_NOTIFY_PREVIEW_READY('boot-error', 'React vendor failed <private>\\nconst secret = 1');
      <\/script></body></html>`,
      check,
    );
    const runtime = await runner.runFramework(
      `<!doctype html><html><body><script>
        window.__FA_NOTIFY_PREVIEW_READY('runtime-error', 'Render crashed <private>\\nconst secret = 1');
      <\/script></body></html>`,
      check,
    );
    const readinessTimeout = await runner.runFramework(
      '<!doctype html><html><body><div>Never reports readiness</div></body></html>',
      check,
      { readyTimeoutMs: 20 },
    );
    const assertionTimeout = await runner.runFramework(
      `<!doctype html><html><body><script>
        window.__FA_NOTIFY_PREVIEW_READY('render-ready');
      <\/script></body></html>`,
      check,
      { checkTimeoutMs: 20 },
    );

    expect(boot[0].failureKind).toBe('preview-boot');
    expect(boot[0].error).toContain('Preview failed to boot: React vendor failed private');
    expect(boot[0].error).not.toContain('const secret');
    expect(runtime[0].failureKind).toBe('preview-runtime');
    expect(runtime[0].error).toContain('Preview failed during render: Render crashed private');
    expect(readinessTimeout[0].failureKind).toBe('infrastructure-timeout');
    expect(readinessTimeout[0].error).toContain('timed out waiting for preview render readiness');
    expect(assertionTimeout[0].failureKind).toBe('assertion-timeout');
    expect(assertionTimeout[0].error).toContain('assertion execution timed out');
    expect(document.querySelectorAll('iframe[aria-hidden="true"]').length).toBe(0);
  });

  it('continues with a fresh frame after one assertion-execution timeout', async () => {
    const createElement = spyOn(document, 'createElement').and.callThrough();
    const html = `<!doctype html><html><body><div class="ready">Ready</div><script>
      window.__FA_NOTIFY_PREVIEW_READY('render-ready');
    <\/script></body></html>`;
    const results = await runner.runFramework(
      html,
      [
        { id: 'slow', name: 'Slow assertion', steps: [{ type: 'wait', durationMs: 100 }] },
        { id: 'fast', name: 'Fast assertion', steps: [{ type: 'expectExists', selector: '.ready' }] },
      ] as any,
      { checkTimeoutMs: 20 },
    );

    expect(results[0].passed).toBeFalse();
    expect(results[0].failureKind).toBe('assertion-timeout');
    expect(results[1]).toEqual({ name: 'Fast assertion', passed: true });
    expect(createElement.calls.allArgs().filter(([tag]) => tag === 'iframe').length).toBe(2);
    expect(document.querySelectorAll('iframe[aria-hidden="true"]').length).toBe(0);
  });

  it('runs the real React builder with production vendor assets at the assertion layer', async () => {
    const [starterResponse, solutionResponse] = await Promise.all([
      fetch('/assets/sb/react/question/react-counter.v1.json'),
      fetch('/assets/sb/react/solution/react-counter-solution.v1.json'),
    ]);
    expect(starterResponse.ok).toBeTrue();
    expect(solutionResponse.ok).toBeTrue();
    const starter = await starterResponse.json() as { files: Record<string, string> };
    const solution = await solutionResponse.json() as { files: Record<string, string> };
    const check = {
      id: 'counter-increments',
      name: 'Counter increments',
      steps: [
        { type: 'expectText', selector: '.value', text: '0' },
        { type: 'click', selector: '.actions button', index: 1 },
        { type: 'waitForText', selector: '.value', text: '1', timeoutMs: 500 },
      ],
    } as any;

    const starterResults = await runner.runFramework(
      makeReactPreviewHtml(starter.files, window.location.origin),
      [check],
    );
    const solutionResults = await runner.runFramework(
      makeReactPreviewHtml(solution.files, window.location.origin),
      [check],
    );

    expect(starterResults[0].passed).toBeFalse();
    expect(starterResults[0].failureKind).toBe('assertion');
    expect(starterResults[0].error).toContain('did not reach text "1"');
    expect(solutionResults).toEqual([{ name: 'Counter increments', passed: true }]);
    expect(document.querySelectorAll('iframe[aria-hidden="true"]').length).toBe(0);
  });

  it('removes the frame and rejects promptly when a run is cancelled', async () => {
    const run = runner.runFramework(
      '<!doctype html><html><body><div>never ready</div></body></html>',
      [{ id: 'pending', name: 'Pending check', steps: [{ type: 'expectExists', selector: 'div' }] }],
      { readyTimeoutMs: 5_000 },
    );
    const frame = document.querySelector('iframe[aria-hidden="true"]') as HTMLIFrameElement | null;

    expect(frame?.isConnected).toBeTrue();
    runner.cancel();

    await expectAsync(run).toBeRejectedWithError(OpaqueCheckCancelledError);
    expect(frame?.isConnected).toBeFalse();
  });
});
