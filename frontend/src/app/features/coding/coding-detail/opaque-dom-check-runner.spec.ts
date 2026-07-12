import { OpaqueCheckCancelledError, OpaqueDomCheckRunner } from './opaque-dom-check-runner';

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

  it('ignores forged result messages with the wrong source or runId', async () => {
    const run = runner.runFramework(
      `<!doctype html><html><body>
        <div class="value">real</div>
        <div class="token-state"></div>
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
        ],
      }],
    );
    const frame = document.querySelector('iframe[aria-hidden="true"]') as HTMLIFrameElement;
    const forged = {
      channel: 'FA_OPAQUE_CHECK',
      version: 1,
      runId: 'forged-run-id',
      kind: 'framework',
      results: [{ name: 'Forged check', passed: true }],
    };

    window.dispatchEvent(new MessageEvent('message', { source: window, data: forged }));
    window.dispatchEvent(new MessageEvent('message', { source: frame.contentWindow, data: forged }));

    await expectAsync(run).toBeResolvedTo([{ name: 'Real check', passed: true }]);
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
