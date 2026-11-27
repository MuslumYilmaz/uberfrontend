import {
  OpaqueCheckCancelledError,
  OpaqueCheckExecutionTimeoutError,
  OpaqueDomCheckRunner,
  OpaquePreviewReadyTimeoutError,
} from './opaque-dom-check-runner';
import { makeReactPreviewHtml } from '../../../core/utils/react-preview-builder';
import { makeVuePreviewHtml } from '../../../core/utils/vue-preview-builder';

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

  it('can install the Angular HttpClient double before framework bootstrap', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body><form class="form"></form><script>
        class TestObservable {
          constructor(start) { this.start = start; }
          subscribe(observer) { return { unsubscribe: this.start(observer) || (() => {}) }; }
        }
        class TestHttpClient {}
        window.__FA_PREPARE_ANGULAR_HTTP_CHECK(TestHttpClient, TestObservable);
        const client = new TestHttpClient();
        document.querySelector('.form').addEventListener('submit', event => {
          event.preventDefault();
          client.post('/api/contact', { name: 'Ada' }).subscribe({
            next() {}, error() {}, complete() {}
          });
        });
        window.__FA_NOTIFY_PREVIEW_READY('render-ready');
      <\/script></body></html>`,
      [{
        id: 'pre-bootstrap-http',
        name: 'Pre-bootstrap HTTP',
        steps: [
          { type: 'mockHttp', status: 200, durationMs: 25 },
          { type: 'submit', selector: '.form' },
          { type: 'expectHttpRequest', method: 'POST', url: '/api/contact', bodyContains: 'Ada' },
        ],
      }] as any,
    );

    expect(results).toEqual([{ name: 'Pre-bootstrap HTTP', passed: true }]);
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
      steps: [{ type: 'wait', durationMs: 10_000 }],
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
  }, 15_000);

  it('continues with a fresh frame after one assertion-execution timeout', async () => {
    const runFrame = spyOn<any>(runner, 'runFrame').and.returnValues(
      Promise.reject(new OpaqueCheckExecutionTimeoutError('framework')),
      Promise.resolve([{ name: 'Fast assertion', passed: true }]),
    );
    const results = await runner.runFramework(
      '<!doctype html><html><body><div class="ready">Ready</div></body></html>',
      [
        { id: 'slow', name: 'Slow assertion', steps: [{ type: 'wait', durationMs: 100 }] },
        { id: 'fast', name: 'Fast assertion', steps: [{ type: 'expectExists', selector: '.ready' }] },
      ] as any,
    );
    const firstOptions = runFrame.calls.argsFor(0)[0] as {
      config: { invocationId: string; frameId: string };
    };
    const secondOptions = runFrame.calls.argsFor(1)[0] as {
      config: { invocationId: string; frameId: string };
    };

    expect(results[0].passed).toBeFalse();
    expect(results[0].failureKind).toBe('assertion-timeout');
    expect(results[1]).toEqual({ name: 'Fast assertion', passed: true });
    expect(runFrame).toHaveBeenCalledTimes(2);
    expect(firstOptions.config.invocationId).toBe(secondOptions.config.invocationId);
    expect(firstOptions.config.frameId).not.toBe(secondOptions.config.frameId);
  });

  it('mocks HTTP before preview boot and verifies request, loading, and success state', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body>
        <button class="submit" type="button">Send</button>
        <div class="status"></div>
        <script>
          const button = document.querySelector('.submit');
          const status = document.querySelector('.status');
          button.addEventListener('click', () => {
            button.disabled = true;
            status.textContent = 'Sending';
            const request = new XMLHttpRequest();
            request.open('POST', 'https://jsonplaceholder.typicode.com/posts');
            request.addEventListener('load', () => {
              status.textContent = 'Sent';
              button.disabled = false;
            });
            request.send(JSON.stringify({ email: 'jane@example.com' }));
          });
          setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
        <\/script>
      </body></html>`,
      [{
        id: 'http-lifecycle',
        name: 'HTTP lifecycle',
        steps: [
          { type: 'mockHttp', status: 201, durationMs: 150 },
          { type: 'click', selector: '.submit' },
          {
            type: 'expectHttpRequest',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            bodyContains: 'jane@example.com',
            count: 1,
          },
          { type: 'expectDisabled', selector: '.submit', disabled: true },
          { type: 'expectText', selector: '.status', text: 'Sending' },
          { type: 'waitForText', selector: '.status', text: 'Sent', timeoutMs: 500 },
          { type: 'expectDisabled', selector: '.submit', disabled: false },
        ],
      }] as any,
    );

    expect(results).toEqual([{ name: 'HTTP lifecycle', passed: true }]);
  });

  it('finds elements by role and name, by label and by their own text, the way a user would', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body><main>
        <div class="actions">
          <button aria-label="decrement" disabled>−</button>
          <button aria-label="increment">+</button>
          <button class="ghost">Reset</button>
          <button hidden>Reset</button>
        </div>
        <div class="value">0</div>
        <label for="size">Board size</label><input id="size" value="8">
        <label class="item"><input type="checkbox"> <span>Buy milk</span></label>
        <p class="empty">No tasks yet. Add your first one above.</p>
        <p>Lon<mark>don</mark></p>
        <div style="display: none"><button>Add</button></div>
        <button>Add</button>
        <script>
          let count = 0;
          const value = document.querySelector('.value');
          const [dec, inc, reset] = document.querySelectorAll('.actions button');
          const show = () => { value.textContent = String(count); dec.disabled = count === 0; };
          inc.addEventListener('click', () => { count += 1; show(); });
          dec.addEventListener('click', () => { count -= 1; show(); });
          reset.addEventListener('click', () => { count = 0; show(); });
          setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
        <\/script>
      </main></body></html>`,
      [{
        id: 'locators',
        name: 'Locators',
        steps: [
          // A hyphen finds the minus sign, and the visible "+" finds a button named "increment".
          { type: 'expectDisabled', by: { role: 'button', name: '-' }, disabled: true },
          { type: 'click', by: { role: 'button', name: '+' } },
          { type: 'click', by: { role: 'button', name: 'increment' } },
          { type: 'expectText', selector: '.value', text: '2' },
          { type: 'expectDisabled', by: { role: 'button', name: '−' }, disabled: false },
          { type: 'expectCount', by: { role: 'button', name: 'Reset' }, count: 1 },
          { type: 'click', by: { role: 'button', name: 'Reset' } },
          { type: 'expectText', selector: '.value', text: '0' },
          { type: 'expectValue', by: { label: 'Board size' }, value: '8' },
          { type: 'expectValue', by: { role: 'textbox', label: 'Board size' }, value: '8' },
          { type: 'click', by: { role: 'checkbox', name: 'Buy milk' } },
          { type: 'expectChecked', by: { role: 'checkbox' } },
          { type: 'expectExists', by: { text: 'No tasks yet. Add your first one above.' } },
          { type: 'expectText', by: { role: 'mark' }, text: 'don' },
          { type: 'expectCount', by: { role: 'button', name: 'Add' }, count: 1 },
        ],
      }] as any,
    );

    expect(results).toEqual([{ name: 'Locators', passed: true }]);
  });

  it('waits for a class when the step gives timeoutMs, and reads it at once when it does not', async () => {
    // The head moves from the first cell to the second on a timer, as a game tick does.
    const html = `<!doctype html><html><body>
      <div class="cell cell--head"></div><div class="cell"></div>
      <script>
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
        setTimeout(() => {
          const cells = document.querySelectorAll('.cell');
          cells[0].classList.remove('cell--head');
          cells[1].classList.add('cell--head');
        }, 300);
      <\/script>
    </body></html>`;
    const at = (index: number, extra: Record<string, unknown> = {}) =>
      ({ type: 'expectClass', selector: '.cell', index, className: 'cell--head', ...extra });

    const results = await runner.runFramework(html, [
      { id: 'waits', name: 'Waits for the move', steps: [at(1, { timeoutMs: 2000 }), at(0, { expected: false })] },
      { id: 'at-once', name: 'Reads at once', steps: [at(1)] },
      { id: 'too-short', name: 'Gives up after its timeout', steps: [at(1, { timeoutMs: 50 })] },
    ] as any);

    expect(results[0]).toEqual({ name: 'Waits for the move', passed: true });
    expect(results[1].passed).toBeFalse();
    expect(results[1].error).toMatch(/expected class "cell--head" to be present$/);
    expect(results[2].passed).toBeFalse();
    expect(results[2].error).toMatch(/expected class "cell--head" to be present within 50 ms$/);
  });

  it('names the locator that found nothing, and counts what it finds', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body>
        <ul><li>Buy milk</li></ul>
        <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script>
      </body></html>`,
      [
        { id: 'missing', name: 'Missing button', steps: [{ type: 'click', by: { role: 'button', name: 'Save' } }] },
        {
          id: 'count',
          name: 'Too few items',
          steps: [{ type: 'waitForCount', by: { role: 'listitem' }, count: 2, timeoutMs: 100 }],
        },
        { id: 'second', name: 'Second item', steps: [{ type: 'expectText', by: { role: 'listitem' }, index: 1, text: 'x' }] },
      ] as any,
    );

    expect(results).toEqual([
      { name: 'Missing button', passed: false, error: 'button "Save" was not found', failureKind: 'assertion' },
      {
        name: 'Too few items',
        passed: false,
        error: 'listitem expected 2 matches but found 1',
        failureKind: 'assertion',
      },
      { name: 'Second item', passed: false, error: 'listitem #2 was not found', failureKind: 'assertion' },
    ]);
  });

  it('reads a checkbox and text struck through by the element or an ancestor', async () => {
    const page = (strike: boolean) => `<!doctype html><html><head><style>.done { text-decoration: line-through; }</style></head><body>
      <ul><li><label><input type="checkbox"> <span>Buy milk</span></label> <button>Remove</button></li></ul>
      <script>
        const box = document.querySelector('input');
        box.addEventListener('change', () => document.querySelector('li').classList.toggle('done', ${strike} && box.checked));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script>
    </body></html>`;
    const steps = [
      { type: 'expectLineThrough', by: { role: 'listitem' }, expected: false },
      { type: 'click', by: { role: 'checkbox' } },
      { type: 'expectChecked', by: { role: 'checkbox' } },
      { type: 'expectLineThrough', by: { role: 'listitem' } },
      { type: 'click', by: { role: 'checkbox' } },
      { type: 'expectChecked', by: { role: 'checkbox' }, expected: false },
      { type: 'expectLineThrough', by: { role: 'listitem' }, expected: false },
    ];

    expect(await runner.runFramework(page(true), [{ id: 'strike', name: 'Strike', steps }] as any))
      .toEqual([{ name: 'Strike', passed: true }]);
    expect(await runner.runFramework(page(false), [{ id: 'strike', name: 'Strike', steps }] as any))
      .toEqual([{
        name: 'Strike',
        passed: false,
        error: 'listitem expected its text to be struck through',
        failureKind: 'assertion',
        step: 4,
        steps: 7,
      }]);
  });

  it('tells a highlighted element from its group once transitions end, and a stuck highlight from a real one', async () => {
    const page = (stuck: boolean) => `<!doctype html><html><head><style>
        .tab { background: transparent; color: #999; transition: background-color 150ms, color 150ms; }
        .tab.active { background: #eee; color: #000; }
      </style></head><body>
      <nav><button class="tab active">One</button><button class="tab">Two</button><button class="tab">Three</button></nav>
      <script>
        const tabs = Array.from(document.querySelectorAll('.tab'));
        tabs.forEach((tab) => tab.addEventListener('click', () => {
          tabs.forEach((other) => { if (!${stuck} || other === tab) other.classList.toggle('active', other === tab); });
        }));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const steps = [
      { type: 'expectStandsOut', selector: '.tab', index: 0, among: { selector: '.tab' } },
      { type: 'click', by: { role: 'button', name: 'Two' } },
      { type: 'expectStandsOut', by: { role: 'button', name: 'Two' }, among: { by: { role: 'button' } } },
    ];

    expect(await runner.runFramework(page(false), [{ id: 'highlight', name: 'Highlight', steps }] as any))
      .toEqual([{ name: 'Highlight', passed: true }]);
    expect(await runner.runFramework(page(true), [{ id: 'highlight', name: 'Highlight', steps }] as any))
      .toEqual([{
        name: 'Highlight',
        passed: false,
        error: 'button "Two" looks the same as 1 other element of its group',
        failureKind: 'assertion',
        step: 3,
        steps: 3,
      }]);
  });

  it('reads a checkbox as mixed while it is indeterminate, and as checked only once it is not', async () => {
    const page = (clearsMixed: boolean) => `<!doctype html><html><body>
      <label><input type="checkbox" class="parent"> Parent</label>
      <label><input type="checkbox" class="child"> Child</label>
      <label><input type="checkbox" class="child"> Child two</label>
      <script>
        const parent = document.querySelector('.parent');
        const children = Array.from(document.querySelectorAll('.child'));
        children.forEach((child) => child.addEventListener('change', () => {
          const count = children.filter((box) => box.checked).length;
          parent.checked = count === children.length;
          if (${clearsMixed} || count < children.length) parent.indeterminate = count > 0 && count < children.length;
        }));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const steps = [
      { type: 'click', by: { role: 'checkbox', name: 'Child' } },
      { type: 'expectChecked', by: { role: 'checkbox', name: 'Parent' }, expected: 'mixed' },
      { type: 'click', by: { role: 'checkbox', name: 'Child two' } },
      { type: 'expectChecked', by: { role: 'checkbox', name: 'Parent' } },
    ];

    expect(await runner.runFramework(page(true), [{ id: 'mixed', name: 'Mixed', steps }] as any))
      .toEqual([{ name: 'Mixed', passed: true }]);
    expect(await runner.runFramework(page(false), [{ id: 'mixed', name: 'Mixed', steps }] as any))
      .toEqual([{
        name: 'Mixed',
        passed: false,
        error: 'checkbox "Parent" expected checked but was mixed',
        failureKind: 'assertion',
        step: 4,
        steps: 4,
      }]);
  });

  it('names an element\'s color by its family, whatever CSS syntax set it', async () => {
    const page = `<!doctype html><html><head><style>
        .a { background: #ef4444; } .b { background: oklch(0.77 0.17 65); } .c { background-color: rgb(34 197 94 / 0.8); }
        .d { color: hsl(220 90% 55%); } .e { background: #888; }
      </style></head><body>
      <div class="a">a</div><div class="b">b</div><div class="c">c</div><div class="d">d</div><div class="e">e</div><div class="f">f</div>
      <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'colors',
        name: 'Colors',
        steps: [
          { type: 'expectColor', selector: '.a', hue: 'red' },
          { type: 'expectColor', selector: '.b', hue: 'orange' },
          { type: 'expectColor', selector: '.c', hue: 'green' },
          { type: 'expectColor', selector: '.d', property: 'color', hue: 'blue' },
          { type: 'expectColor', selector: '.e', hue: 'grey' },
          { type: 'expectColor', selector: '.f', hue: 'transparent' },
        ],
      },
      { id: 'wrong', name: 'Wrong', steps: [{ type: 'expectColor', selector: '.b', hue: 'green' }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Colors', passed: true },
      { name: 'Wrong', passed: false, error: '.b expected background-color to be green but it was orange', failureKind: 'assertion' },
    ]);
  });

  it('finds the element that names a target in an id-reference attribute, whatever its id', async () => {
    const page = (wired: boolean) => `<!doctype html><html><body>
      <div role="combobox"><input type="text"></div>
      <ul role="listbox"><li role="option" id="opt-a">Ada</li><li role="option" id="opt-b">Bea</li></ul>
      <script>
        const input = document.querySelector('input');
        let active = -1;
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowDown') return;
          active = (active + 1) % 2;
          if (${wired}) document.querySelector('[role=combobox]').setAttribute('aria-activedescendant', ['opt-a', 'opt-b'][active]);
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const steps = [
      { type: 'key', selector: 'input', key: 'ArrowDown' },
      { type: 'key', selector: 'input', key: 'ArrowDown' },
      { type: 'expectReferenced', by: { role: 'option' }, index: 1, attribute: 'aria-activedescendant' },
      { type: 'expectReferenced', by: { role: 'option' }, index: 0, attribute: 'aria-activedescendant', expected: false },
    ];

    expect(await runner.runFramework(page(true), [{ id: 'ref', name: 'Ref', steps }] as any))
      .toEqual([{ name: 'Ref', passed: true }]);
    expect(await runner.runFramework(page(false), [{ id: 'ref', name: 'Ref', steps }] as any))
      .toEqual([{
        name: 'Ref',
        passed: false,
        error: 'option #2 expected an element\'s aria-activedescendant to name it',
        failureKind: 'assertion',
        step: 3,
        steps: 4,
      }]);
  });

  it('types a printable key into a text field unless the page cancels it, after the page handled the keydown', async () => {
    const page = (cancels: boolean) => `<!doctype html><html><body>
      <input type="text"><ul class="chips"></ul>
      <script>
        const input = document.querySelector('input');
        const add = (label) => { if (label.trim()) document.querySelector('.chips').insertAdjacentHTML('beforeend', '<li>' + label.trim() + '</li>'); };
        input.addEventListener('keydown', (event) => {
          if (${cancels} && event.key === ',') { event.preventDefault(); add(input.value); input.value = ''; }
        });
        input.addEventListener('input', () => {
          if (!${cancels} && input.value.endsWith(',')) { add(input.value.slice(0, -1)); input.value = ''; }
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const steps = [
      { type: 'setValue', selector: 'input', value: 'Design team' },
      { type: 'key', selector: 'input', key: ',' },
      { type: 'expectCount', by: { text: 'Design team' }, count: 1 },
      { type: 'expectValue', selector: 'input', value: '' },
    ];

    for (const cancels of [true, false]) {
      expect(await runner.runFramework(page(cancels), [{ id: 'comma', name: 'Comma', steps }] as any))
        .withContext(cancels ? 'keydown handler' : 'input handler')
        .toEqual([{ name: 'Comma', passed: true }]);
    }
  });

  it('holds Shift for a key only when a step asks, so a page can tell Shift+Tab from Tab', async () => {
    const page = `<!doctype html><html><body>
      <button class="first">First</button><button class="last">Last</button><p class="seen">none</p>
      <script>
        document.addEventListener('keydown', (event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          document.querySelector(event.shiftKey ? '.last' : '.first').focus();
          document.querySelector('.seen').textContent = (event.shiftKey ? 'Shift+' : '') + event.key;
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'keys',
        name: 'Keys',
        steps: [
          { type: 'key', selector: '.first', key: 'Tab', shift: true },
          { type: 'expectText', selector: '.seen', text: 'Shift+Tab', match: 'equals' },
          { type: 'expectFocused', selector: '.last' },
          { type: 'key', selector: '.last', key: 'Tab' },
          { type: 'expectText', selector: '.seen', text: 'Tab', match: 'equals' },
          { type: 'expectFocused', selector: '.first' },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Keys', passed: true }]);
  });

  it('moves focus along the tab order for a Tab the page does not cancel, only when the step asks for it', async () => {
    const page = `<!doctype html><html><body>
      <button class="a">A</button><button class="off" disabled>Off</button><div class="b" tabindex="0">B</div>
      <div inert><button class="behind">Behind</button></div><button class="gone" style="display: none">Gone</button>
      <button class="c">C</button><button class="wrap">Wrap</button><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        document.addEventListener('focusout', (event) => { seen.textContent += ' out:' + event.target.className; });
        document.querySelector('.wrap').addEventListener('keydown', (event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          document.querySelector('.a').focus();
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const tab = (selector: string, extra: Record<string, unknown> = {}) => ({ type: 'key', selector, key: 'Tab', defaultAction: true, ...extra });
    const results = await runner.runFramework(page, [
      {
        id: 'order',
        name: 'Order',
        steps: [
          tab('.a'),
          { type: 'expectFocused', selector: '.b' },
          tab('.b'),
          { type: 'expectFocused', selector: '.c' },
          tab('.c', { shift: true }),
          { type: 'expectFocused', selector: '.b' },
          tab('.wrap'),
          { type: 'expectFocused', selector: '.a' },
          { type: 'key', selector: '.a', key: 'Tab' },
          { type: 'expectFocused', selector: '.a' },
          tab('.a', { shift: true }),
          { type: 'expectText', selector: '.seen', text: 'out:a', match: 'contains' },
        ],
      },
      { id: 'left', name: 'Left', steps: [tab('.a', { shift: true }), { type: 'expectFocused', selector: '.a' }] },
    ] as any);

    expect(results[0]).toEqual({ name: 'Order', passed: true });
    expect(results[1].passed).toBeFalse();
  });

  it('keeps focus and Tab steps right in a frame that rejects native focus, as Chrome 158 does', async () => {
    // From Chrome 158 the hidden check frame ignores focus(): body stays active and no focus event fires. A script
    // ahead of <head> runs before the runner, so the runner keeps a focus that does nothing, on every browser.
    const page = `<!doctype html><html><script>HTMLElement.prototype.focus = function focus() {};<\/script><head></head><body>
      <button class="a">A</button><button class="b">B</button><button class="c">C</button><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        document.addEventListener('focusin', (event) => { seen.textContent += ' in:' + event.target.className; });
        document.addEventListener('focusout', (event) => { seen.textContent += ' out:' + event.target.className; });
        // Page code that reads the active element, as a focus trap does, sees the focus the page or the check set.
        document.addEventListener('keydown', () => { seen.textContent += ' key@' + document.activeElement.className; });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const tab = (extra: Record<string, unknown> = {}) => ({ type: 'key', key: 'Tab', defaultAction: true, ...extra });
    const results = await runner.runFramework(page, [
      {
        id: 'rejected',
        name: 'Rejected',
        steps: [
          { type: 'focus', selector: '.a' },
          { type: 'focus', selector: '.a' },
          { type: 'expectText', selector: '.seen', text: 'in:a', match: 'equals' },
          { type: 'expectFocused', selector: '.a' },
          tab(),
          { type: 'expectFocused', selector: '.b' },
          tab({ shift: true }),
          { type: 'expectFocused', selector: '.a' },
          tab({ shift: true }),
          { type: 'expectText', selector: '.seen', text: 'in:a key@a out:a in:b key@b out:b in:a key@a out:a', match: 'equals' },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Rejected', passed: true }]);
  });

  it('presses a key without a target where focus is, and clicks a button or link for an Enter the page does not cancel', async () => {
    const page = `<!doctype html><html><body>
      <button class="one">One</button><button class="two">Two</button><a class="link" href="#later">Link</a>
      <button class="kept">Kept</button><div class="tile" tabindex="-1">Tile</div><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        document.addEventListener('keydown', (event) => {
          seen.textContent += ' key:' + event.key + '@' + event.target.className;
          if (event.key === 'ArrowRight' && event.target.className === 'one') document.querySelector('.two').focus();
          if (event.key === 'Enter' && event.target.className === 'kept') event.preventDefault();
        });
        document.addEventListener('click', (event) => {
          event.preventDefault();
          seen.textContent += ' click:' + event.target.className;
        });
        document.querySelector('.one').focus();
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const press = (key: string) => ({ type: 'key', key, defaultAction: true });
    const results = await runner.runFramework(page, [
      {
        id: 'remote',
        name: 'Remote',
        steps: [
          press('ArrowRight'),
          { type: 'expectFocused', selector: '.two' },
          press('Enter'),
          { type: 'focus', selector: '.link' },
          press('Enter'),
          { type: 'focus', selector: '.kept' },
          press('Enter'),
          { type: 'focus', selector: '.tile' },
          press('Enter'),
          { type: 'key', selector: '.one', key: 'Enter' },
          {
            type: 'expectText',
            selector: '.seen',
            text: 'key:ArrowRight@one key:Enter@two click:two key:Enter@link click:link key:Enter@kept key:Enter@tile key:Enter@one',
            match: 'equals',
          },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Remote', passed: true }]);
  });

  it('presses a key without a target on the last focus request when the frame did not honour native focus', async () => {
    // A div without tabindex cannot take native focus, so body stays active, as in a background frame on Linux CI.
    const page = `<!doctype html><html><body>
      <div class="pad">Pad</div><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        document.addEventListener('keydown', (event) => { seen.textContent += ' key:' + event.key + '@' + event.target.className; });
        document.querySelector('.pad').focus();
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'unhonoured',
        name: 'Unhonoured focus',
        steps: [
          { type: 'expectFocused', selector: '.pad' },
          { type: 'key', key: 'ArrowDown' },
          { type: 'expectText', selector: '.seen', text: 'key:ArrowDown@pad', match: 'equals' },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Unhonoured focus', passed: true }]);
  });

  it('drags from one element to another and clicks the nearest element that contains both, as a browser does', async () => {
    const page = `<!doctype html><html><body>
      <div class="outer"><input class="field"><span class="side">Side</span></div><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
          document.addEventListener(type, (event) => { seen.textContent += ' ' + type + ':' + event.target.className; });
        }
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'out',
        name: 'Out',
        steps: [
          { type: 'drag', selector: '.field', to: { selector: '.side' } },
          {
            type: 'expectText',
            selector: '.seen',
            text: 'pointerdown:field mousedown:field pointerup:side mouseup:side click:outer',
            match: 'equals',
          },
        ],
      },
      {
        id: 'same',
        name: 'Same',
        steps: [
          { type: 'drag', selector: '.outer', to: { selector: '.outer' } },
          { type: 'expectText', selector: '.seen', text: 'mouseup:outer click:outer', match: 'contains' },
        ],
      },
      { id: 'missing', name: 'Missing', steps: [{ type: 'drag', selector: '.field', to: { selector: '.nowhere' } }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Out', passed: true },
      { name: 'Same', passed: true },
      { name: 'Missing', passed: false, error: '.nowhere was not found', failureKind: 'assertion' },
    ]);
  });

  it('clicks with Shift, Ctrl, Meta or Alt held as a mouse does, and keeps a plain click the element\'s own click()', async () => {
    const page = `<!doctype html><html><body>
      <button class="cell">Cell</button><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
          document.addEventListener(type, (event) => {
            const keys = (event.shiftKey ? 'S' : '') + (event.ctrlKey ? 'C' : '') + (event.metaKey ? 'M' : '') + (event.altKey ? 'A' : '');
            seen.textContent += ' ' + type + (keys ? '+' + keys : '');
          });
        }
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      { id: 'plain', name: 'Plain', steps: [{ type: 'click', selector: '.cell' }, { type: 'expectText', selector: '.seen', text: 'click', match: 'equals' }] },
      {
        id: 'shift',
        name: 'Shift',
        steps: [
          { type: 'click', selector: '.cell', shift: true },
          { type: 'expectText', selector: '.seen', text: 'pointerdown+S mousedown+S pointerup+S mouseup+S click+S', match: 'equals' },
        ],
      },
      { id: 'keys', name: 'Keys', steps: [{ type: 'click', selector: '.cell', ctrl: true, meta: true, alt: true }, { type: 'expectText', selector: '.seen', text: 'click+CMA', match: 'contains' }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Plain', passed: true },
      { name: 'Shift', passed: true },
      { name: 'Keys', passed: true },
    ]);
  });

  // A 3x3 grid where a drag selects the rectangle between the cell pressed and the cell the pointer is over.
  const gridApp = (handlers: string) => `import React, { useState } from 'react';
const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const at = (cell: number) => [Math.floor(cell / 3), cell % 3];
export default function App() {
  const [anchor, setAnchor] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [restored, setRestored] = useState('');
  const inside = (cell: number) => {
    if (anchor === null || end === null) return false;
    const [r1, c1] = at(anchor); const [r2, c2] = at(end); const [r, c] = at(cell);
    return r >= Math.min(r1, r2) && r <= Math.max(r1, r2) && c >= Math.min(c1, c2) && c <= Math.max(c1, c2);
  };
  return (
    <div>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)' }} onMouseUp={() => setDragging(false)}>
        {cells.map((cell) => (
          <div key={cell} className="cell" data-cell={cell} style={{ height: 40 }} ${handlers}>{cell}</div>
        ))}
      </div>
      <p className="seen">{cells.filter(inside).join(',') || 'none'}</p>
      <button className="probe" onClick={() => setRestored(String(Element.prototype.setPointerCapture).includes('native code') ? 'native' : 'patched')}>Probe</button>
      <p className="restored">{restored}</p>
    </div>
  );
}
`;

  it('drags through cells with the button down, so a grid that selects on mouse enter sees the rectangle', async () => {
    const html = makeReactPreviewHtml({
      'src/App.tsx': gridApp(`onMouseDown={() => { setAnchor(cell); setEnd(cell); setDragging(true); }}
            onMouseEnter={() => { if (dragging) setEnd(cell); }}`),
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      {
        id: 'through',
        name: 'Through',
        steps: [
          { type: 'waitForCount', selector: '.cell', count: 9, timeoutMs: 3000 },
          { type: 'drag', selector: '[data-cell="0"]', through: [{ selector: '[data-cell="1"]' }], to: { selector: '[data-cell="4"]' } },
          { type: 'expectText', selector: '.seen', text: '0,1,3,4', match: 'equals' },
        ],
      },
      {
        // Without `through` the drag is a press and a release: no cell is entered, so the selection stays one cell.
        id: 'jump',
        name: 'Jump',
        steps: [
          { type: 'waitForCount', selector: '.cell', count: 9, timeoutMs: 3000 },
          { type: 'drag', selector: '[data-cell="0"]', to: { selector: '[data-cell="4"]' } },
          { type: 'expectText', selector: '.seen', text: '0', match: 'equals' },
        ],
      },
      {
        id: 'missing',
        name: 'Missing',
        steps: [
          { type: 'waitForCount', selector: '.cell', count: 9, timeoutMs: 3000 },
          { type: 'drag', selector: '[data-cell="0"]', through: [{ selector: '.nowhere' }], to: { selector: '[data-cell="4"]' } },
        ],
      },
    ] as any);

    expect(results).toEqual([
      { name: 'Through', passed: true },
      { name: 'Jump', passed: true },
      { name: 'Missing', passed: false, error: '.nowhere was not found', failureKind: 'assertion', step: 2, steps: 2 },
    ]);
  });

  it('gives a page that captures the pointer every later move on the captured element, then restores capture', async () => {
    const html = makeReactPreviewHtml({
      'src/App.tsx': gridApp(`onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setAnchor(cell); setEnd(cell); }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const over = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]');
              if (over) setEnd(Number(over.getAttribute('data-cell')));
            }}
            onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}`),
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      {
        id: 'captured',
        name: 'Captured',
        viewport: { width: 400, height: 300 },
        steps: [
          { type: 'waitForCount', selector: '.cell', count: 9, timeoutMs: 3000 },
          { type: 'drag', selector: '[data-cell="0"]', through: [{ selector: '[data-cell="1"]' }], to: { selector: '[data-cell="5"]' } },
          { type: 'expectText', selector: '.seen', text: '0,1,2,3,4,5', match: 'equals' },
          { type: 'click', selector: '.probe' },
          { type: 'expectText', selector: '.restored', text: 'native', match: 'equals' },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Captured', passed: true }]);
  });

  it('measures how far an element sits below or above another and where its left edge is, within a pixel', async () => {
    const page = `<!doctype html><html><body style="margin: 0">
      <button class="anchor" style="position: absolute; top: 100px; left: 40px; width: 24px; height: 24px">i</button>
      <div class="below" style="position: absolute; top: 132px; left: 8px; width: 240px; height: 50px">Below</div>
      <div class="above" style="position: absolute; top: 42.5px; left: 8px; width: 240px; height: 50px">Above</div>
      <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script></body></html>`;
    const placed = (selector: string, extra: Record<string, unknown>) => ({ type: 'expectPlaced', selector, than: { selector: '.anchor' }, ...extra });
    const results = await runner.runFramework(page, [
      {
        id: 'right',
        name: 'Right',
        steps: [
          placed('.below', { side: 'below', gap: 8, left: 8 }),
          placed('.above', { side: 'above', gap: 8 }),
          { type: 'expectPlaced', selector: '.below', left: 8 },
        ],
      },
      { id: 'gap', name: 'Gap', steps: [placed('.below', { side: 'below', gap: 20 })] },
      { id: 'edge', name: 'Edge', steps: [placed('.below', { side: 'below', gap: 8, left: 0 })] },
      { id: 'missing', name: 'Missing', steps: [{ type: 'expectPlaced', selector: '.below', than: { selector: '.nowhere' }, side: 'below', gap: 8 }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Right', passed: true },
      { name: 'Gap', passed: false, error: '.below sits 8px below .anchor; expected 20px', failureKind: 'assertion' },
      { name: 'Edge', passed: false, error: '.below starts 8px from the left edge; expected 0px', failureKind: 'assertion' },
      { name: 'Missing', passed: false, error: '.nowhere was not found', failureKind: 'assertion' },
    ]);
  });

  it('drags files over a target and chooses files in a file input, with names, types and sizes', async () => {
    const page = `<!doctype html><html><body>
      <div class="zone"><span class="hint">Drop here</span></div><div class="other">Other</div>
      <input class="picker" type="file" multiple><input class="text" type="text"><p class="seen"></p>
      <script>
        const seen = document.querySelector('.seen');
        const log = (text) => { seen.textContent += ' ' + text; };
        const describe = (files) => Array.from(files).map((file) => file.name + ':' + file.type + ':' + file.size).join(',');
        for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) {
          document.querySelector('.zone').addEventListener(type, (event) => {
            if (type === 'dragover' || type === 'drop') event.preventDefault();
            log(type + '[' + describe(event.dataTransfer.files) + '|' + Array.from(event.dataTransfer.types).join('+') + ']'
              + (event.relatedTarget ? '>' + event.relatedTarget.className : ''));
          });
        }
        document.querySelector('.picker').addEventListener('change', (event) => log('change[' + describe(event.target.files) + ']'));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const files = [{ name: 'receipt.png', type: 'image/png', size: 300 }, { name: 'notes.pdf', type: 'application/pdf', size: 12 }];
    const results = await runner.runFramework(page, [
      {
        id: 'zone',
        name: 'Zone',
        steps: [
          { type: 'fileDrag', selector: '.zone', event: 'dragenter', files },
          { type: 'fileDrag', selector: '.zone', event: 'dragleave', files, to: { selector: '.hint' } },
          { type: 'fileDrag', selector: '.zone', event: 'dragover', files, cancelled: true },
          { type: 'fileDrag', selector: '.zone', event: 'drop', files, cancelled: true },
          { type: 'chooseFiles', selector: '.picker', files: [{ name: 'scan.jpg', type: 'image/jpeg', size: 5 }] },
          { type: 'fileDrag', selector: '.zone', event: 'dragenter', text: 'Expense report' },
          {
            type: 'expectText',
            selector: '.seen',
            text: 'dragenter[|Files] dragleave[|Files]>hint dragover[|Files] '
              + 'drop[receipt.png:image/png:300,notes.pdf:application/pdf:12|Files] change[scan.jpg:image/jpeg:5] '
              + 'dragenter[|text/plain]',
            match: 'equals',
          },
        ],
      },
      { id: 'uncancelled', name: 'Uncancelled', steps: [{ type: 'fileDrag', selector: '.other', event: 'dragover', files, cancelled: true }] },
      { id: 'left-alone', name: 'Left alone', steps: [{ type: 'fileDrag', selector: '.other', event: 'dragover', text: 'note', cancelled: false }] },
      { id: 'cancelled', name: 'Cancelled', steps: [{ type: 'fileDrag', selector: '.zone', event: 'dragover', text: 'note', cancelled: false }] },
      { id: 'not-file', name: 'Not file', steps: [{ type: 'chooseFiles', selector: '.text', files }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Zone', passed: true },
      {
        name: 'Uncancelled',
        passed: false,
        error: '.other did not cancel dragover, so a browser would not allow the drop',
        failureKind: 'assertion',
      },
      { name: 'Left alone', passed: true },
      {
        name: 'Cancelled',
        passed: false,
        error: '.zone cancelled dragover, which only a drop target should do',
        failureKind: 'assertion',
      },
      { name: 'Not file', passed: false, error: '.text is not a file input', failureKind: 'assertion' },
    ]);
  });

  it('finds the match nearest another element, such as one comment\'s own Reply button among nested ones', async () => {
    const page = `<!doctype html><html><body><div class="list">
      <div class="node"><div class="bubble"><p>Seed</p><button>Reply</button></div></div>
      <div class="node"><div class="bubble"><p>Root</p><button>Reply</button></div>
        <div class="children"><div class="node"><div class="bubble"><p>Child</p><button>Reply</button></div></div></div>
      </div></div>
      <script>
        document.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
          button.textContent = 'Replying';
        }));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'near',
        name: 'Near',
        steps: [
          { type: 'click', by: { role: 'button', name: 'Reply', near: { text: 'Root' } } },
          { type: 'expectCount', by: { role: 'button', name: 'Replying', near: { text: 'Root' } }, count: 1 },
          { type: 'expectCount', by: { role: 'button', name: 'Reply', near: { text: 'Child' } }, count: 1 },
          { type: 'expectCount', by: { role: 'button', name: 'Reply', near: { text: 'Seed' } }, count: 1 },
        ],
      },
      { id: 'missing', name: 'Missing', steps: [{ type: 'click', by: { role: 'button', name: 'Reply', near: { text: 'Gone' } } }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Near', passed: true },
      { name: 'Missing', passed: false, error: 'button "Reply" near text "Gone" was not found', failureKind: 'assertion' },
    ]);
  });

  it('picks, of several places a text shows, the one closest to a match', async () => {
    const page = `<!doctype html><html><body>
      <ul class="products">
        <li><span>Keyboard</span> <button>Add to cart</button></li>
        <li><span>Mouse</span> <button>Add to cart</button></li>
      </ul>
      <ul class="cart">
        <li class="row"><span>Mouse</span> <button>Remove</button></li>
        <li class="row"><span>Keyboard</span> <button>Remove</button></li>
      </ul>
      <script>
        document.querySelectorAll('.cart button').forEach((button) => button.addEventListener('click', () => button.closest('li').remove()));
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [{
      id: 'closest',
      name: 'Closest',
      steps: [
        { type: 'click', by: { role: 'button', name: 'Remove', near: { text: 'Keyboard' } } },
        { type: 'expectCount', selector: '.cart .row', count: 1 },
        { type: 'expectText', selector: '.cart .row', text: 'Mouse', match: 'contains' },
        { type: 'expectCount', by: { role: 'button', name: 'Add to cart', near: { text: 'Mouse' } }, count: 1 },
      ],
    }] as any);

    expect(results).toEqual([{ name: 'Closest', passed: true }]);
  });

  it('reads accessible names, and the live region around an element however its markup declares it', async () => {
    const page = `<!doctype html><html><body>
      <ul><li><input type="checkbox" aria-label="Mark Milk complete"> <span>Milk</span> <button aria-label="Edit Milk">Edit</button>
        <button>Remove</button></li></ul>
      <p role="status" class="left">1 item left</p>
      <div aria-live="polite" aria-atomic="true" class="undo"><span>Removed Eggs</span> <button>Undo</button></div>
      <div aria-live="assertive"><button>Retry</button></div>
      <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'names',
        name: 'Names',
        steps: [
          { type: 'expectName', by: { role: 'checkbox' }, text: 'Milk' },
          { type: 'expectName', by: { role: 'button', name: 'Edit' }, text: 'Edit Milk', match: 'equals' },
          { type: 'expectLiveRegion', by: { text: '1 item left' }, politeness: 'polite', atomic: true },
          { type: 'expectLiveRegion', by: { role: 'button', name: 'Undo' }, politeness: 'polite', atomic: true },
        ],
      },
      { id: 'unnamed', name: 'Unnamed', steps: [{ type: 'expectName', by: { role: 'button', name: 'Remove' }, text: 'Milk' }] },
      { id: 'loud', name: 'Loud', steps: [{ type: 'expectLiveRegion', by: { role: 'button', name: 'Retry' }, politeness: 'polite' }] },
      { id: 'none', name: 'None', steps: [{ type: 'expectLiveRegion', by: { text: 'Milk' } }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Names', passed: true },
      { name: 'Unnamed', passed: false, error: 'button "Remove" expected an accessible name with "Milk" but it was "Remove"', failureKind: 'assertion' },
      { name: 'Loud', passed: false, error: 'button "Retry" sits in a live region that is assertive, expected polite', failureKind: 'assertion' },
      { name: 'None', passed: false, error: 'text "Milk" is not inside a live region', failureKind: 'assertion' },
    ]);
  });

  it('scrolls a box to a position and fires its scroll event, which a page reads at once', async () => {
    const page = `<!doctype html><html><body>
      <div class="box" style="min-width: 200px; height: 100px; overflow: auto"><div style="height: 2000px"></div></div>
      <p class="seen">none</p>
      <script>
        const box = document.querySelector('.box');
        box.addEventListener('scroll', () => { document.querySelector('.seen').textContent = 'at ' + box.scrollTop; });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'scroll',
        name: 'Scroll',
        steps: [
          { type: 'scroll', selector: '.box', top: 360 },
          { type: 'expectText', selector: '.seen', text: 'at 360', match: 'equals' },
          { type: 'scroll', selector: '.box', top: 99999 },
          { type: 'expectText', selector: '.seen', text: 'at 1900', match: 'equals' },
        ],
      },
      { id: 'missing', name: 'Missing', steps: [{ type: 'scroll', selector: '.nowhere', top: 10 }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Scroll', passed: true },
      { name: 'Missing', passed: false, error: '.nowhere was not found', failureKind: 'assertion' },
    ]);
  });

  it('matches part of an attribute value when asked to, and the whole value otherwise', async () => {
    const page = `<!doctype html><html><body>
      <div class="row" style="position: absolute; transform: translateY(36px);">Row</div>
      <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script></body></html>`;
    const step = (expected: string, match?: string) => ({ type: 'expectAttribute', selector: '.row', attribute: 'style', expected, match });
    const results = await runner.runFramework(page, [
      { id: 'part', name: 'Part', steps: [step('translateY(36px)', 'contains')] },
      { id: 'whole', name: 'Whole', steps: [step('translateY(36px)')] },
      { id: 'absent', name: 'Absent', steps: [step('translateY(72px)', 'contains')] },
    ] as any);

    expect(results).toEqual([
      { name: 'Part', passed: true },
      {
        name: 'Whole',
        passed: false,
        error: '.row expected style="translateY(36px)" but found "position: absolute; transform: translateY(36px);"',
        failureKind: 'assertion',
      },
      {
        name: 'Absent',
        passed: false,
        error: '.row expected style to contain "translateY(72px)" but found "position: absolute; transform: translateY(36px);"',
        failureKind: 'assertion',
      },
    ]);
  });

  it('tells a reply indented under its comment from one left at the same level', async () => {
    const page = (indent: number) => `<!doctype html><html><body>
      <div class="node"><p>Root</p><div style="margin-left: ${indent}px"><p>Child</p></div></div>
      <script>setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);<\/script></body></html>`;
    const steps = [{ type: 'expectIndented', by: { text: 'Child' }, than: { by: { text: 'Root' } } }];

    expect(await runner.runFramework(page(16), [{ id: 'indent', name: 'Indent', steps }] as any))
      .toEqual([{ name: 'Indent', passed: true }]);
    expect(await runner.runFramework(page(0), [{ id: 'indent', name: 'Indent', steps }] as any))
      .toEqual([{
        name: 'Indent',
        passed: false,
        error: 'text "Child" starts 0px right of text "Root"; expected it indented further',
        failureKind: 'assertion',
      }]);
  });

  it('gives each check its own localStorage, filled by mockStorage before the preview boots', async () => {
    const page = `<!doctype html><html><head><script>
        window.startTheme = localStorage.getItem('theme') || 'light';
      <\/script></head><body><button>Toggle</button><p class="theme"></p><script>
        const show = () => { document.querySelector('.theme').textContent = window.startTheme; };
        document.querySelector('button').addEventListener('click', () => {
          window.startTheme = window.startTheme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('theme', window.startTheme);
          show();
        });
        show();
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'saved',
        name: 'Saved',
        steps: [
          { type: 'expectStorage', key: 'theme' },
          { type: 'click', selector: 'button' },
          { type: 'expectStorage', key: 'theme', value: 'dark' },
        ],
      },
      {
        id: 'restored',
        name: 'Restored',
        steps: [
          { type: 'mockStorage', entries: { theme: 'dark' } },
          { type: 'expectText', selector: '.theme', text: 'dark' },
          { type: 'expectStorage', key: 'theme', value: 'light' },
        ],
      },
    ] as any);

    expect(results).toEqual([
      { name: 'Saved', passed: true },
      {
        name: 'Restored',
        passed: false,
        error: 'localStorage "theme" expected "light" but held "dark"',
        failureKind: 'assertion',
        step: 3,
        steps: 3,
      },
    ]);
  });

  it('fixes Math.random before the preview boots when a check asks for it, repeating the values in turn', async () => {
    const page = `<!doctype html><html><head><script>
        window.drawn = [Math.random(), Math.random(), Math.random()];
      <\/script></head><body><p class="drawn"></p><script>
        document.querySelector('.drawn').textContent = window.drawn.join(' ');
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'seeded',
        name: 'Seeded',
        steps: [
          { type: 'mockRandom', values: [0.55, 0.1] },
          { type: 'expectText', selector: '.drawn', text: '0.55 0.1 0.55' },
        ],
      },
      { id: 'unseeded', name: 'Unseeded', steps: [{ type: 'expectNoText', selector: '.drawn', text: '0.55 0.1 0.55' }] },
    ] as any);

    expect(results).toEqual([{ name: 'Seeded', passed: true }, { name: 'Unseeded', passed: true }]);
  });

  it('records mocked fetch requests and resolves their configured response', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body>
        <form class="form"><button class="submit" type="submit">Send</button></form>
        <div class="status"></div>
        <script>
          const form = document.querySelector('.form');
          const status = document.querySelector('.status');
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
              method: 'POST',
              body: JSON.stringify({ email: 'jane@example.com' }),
            });
            status.textContent = response.ok ? 'Sent' : 'Failed';
          });
          setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
        <\/script>
      </body></html>`,
      [{
        id: 'fetch-lifecycle',
        name: 'Fetch lifecycle',
        steps: [
          { type: 'mockHttp', status: 201, durationMs: 50 },
          { type: 'submit', selector: '.form' },
          {
            type: 'expectHttpRequest',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            bodyContains: 'jane@example.com',
            count: 1,
          },
          { type: 'waitForText', selector: '.status', text: 'Sent', timeoutMs: 500 },
        ],
      }] as any,
    );

    expect(results).toEqual([{ name: 'Fetch lifecycle', passed: true }]);
  });

  it('rejects an aborted mocked fetch with the signal reason and drops its late response', async () => {
    const results = await runner.runFramework(
      `<!doctype html><html><body>
        <button class="send" type="button">Send</button>
        <button class="cancel" type="button">Cancel</button>
        <button class="send-aborted" type="button">Send aborted</button>
        <div class="status"></div>
        <script>
          const status = document.querySelector('.status');
          const url = 'https://jsonplaceholder.typicode.com/posts';
          const report = (request) => request.then(
            () => { status.textContent = 'Sent'; },
            (error) => { status.textContent = error.name; },
          );
          let controller;
          document.querySelector('.send').addEventListener('click', () => {
            controller = new AbortController();
            report(fetch(url, { method: 'POST', body: '{}', signal: controller.signal }));
          });
          document.querySelector('.cancel').addEventListener('click', () => controller.abort());
          document.querySelector('.send-aborted').addEventListener('click', () => {
            const signal = AbortSignal.abort(new DOMException('Too slow', 'TimeoutError'));
            report(fetch(new Request(url, { method: 'POST', body: '{}', signal })));
          });
          setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
        <\/script>
      </body></html>`,
      [{
        id: 'fetch-abort',
        name: 'Fetch abort',
        steps: [
          { type: 'mockHttp', status: 201, durationMs: 200 },
          { type: 'click', selector: '.send' },
          { type: 'expectHttpRequest', method: 'POST', count: 1 },
          { type: 'click', selector: '.cancel' },
          { type: 'expectText', selector: '.status', text: 'AbortError' },
          { type: 'wait', durationMs: 250 },
          { type: 'expectText', selector: '.status', text: 'AbortError' },
          { type: 'mockHttp', status: 201, durationMs: 0 },
          { type: 'click', selector: '.send-aborted' },
          { type: 'expectText', selector: '.status', text: 'TimeoutError' },
          { type: 'expectHttpRequest', count: 0 },
        ],
      }] as any,
    );

    expect(results).toEqual([{ name: 'Fetch abort', passed: true }]);
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
    expect(starterResults[0].error).toBe('.value expected text "1" but found "0"');
    expect(solutionResults).toEqual([{ name: 'Counter increments', passed: true }]);
    expect(document.querySelectorAll('iframe[aria-hidden="true"]').length).toBe(0);
  });

  it('hovers and unhovers an element so React mouse enter and leave handlers and native listeners both run', async () => {
    const html = makeReactPreviewHtml({
      'src/App.tsx': `import React, { useEffect, useRef, useState } from 'react';
export default function App() {
  const [react, setReact] = useState('off');
  const [native, setNative] = useState('off');
  const nativeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nativeRef.current!;
    const on = () => setNative('on');
    const off = () => setNative('off');
    node.addEventListener('mouseenter', on);
    node.addEventListener('mouseleave', off);
    return () => { node.removeEventListener('mouseenter', on); node.removeEventListener('mouseleave', off); };
  }, []);
  return (
    <div>
      <button className="react" onMouseEnter={() => setReact('on')} onMouseLeave={() => setReact('off')}>React</button>
      <span className="native" ref={nativeRef}>Native</span>
      <p className="seen">react {react}, native {native}</p>
    </div>
  );
}
`,
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      {
        id: 'hover',
        name: 'Hover',
        steps: [
          { type: 'waitForCount', selector: '.react', count: 1, timeoutMs: 3000 },
          { type: 'hover', selector: '.react' },
          { type: 'expectText', selector: '.seen', text: 'react on, native off', match: 'equals' },
          { type: 'hover', selector: '.native' },
          { type: 'expectText', selector: '.seen', text: 'react on, native on', match: 'equals' },
          { type: 'unhover', selector: '.react' },
          { type: 'unhover', selector: '.native' },
          { type: 'expectText', selector: '.seen', text: 'react off, native off', match: 'equals' },
        ],
      },
    ] as any);

    expect(results).toEqual([{ name: 'Hover', passed: true }]);
  });

  it('reports a React handler error that a check sets off with its own message, not as a render failure', async () => {
    const html = makeReactPreviewHtml({
      'src/App.tsx': `import React from 'react';
export default function App() {
  const save = () => { throw new Error('Save handler broke'); };
  return <button className="save" onClick={save}>Save</button>;
}
`,
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      {
        id: 'save',
        name: 'Save',
        steps: [
          { type: 'waitForCount', selector: '.save', count: 1, timeoutMs: 3000 },
          { type: 'click', selector: '.save' },
          { type: 'wait', durationMs: 2000 },
        ],
      },
    ] as any);

    expect(results.length).toBe(1);
    expect(results[0].passed).toBeFalse();
    expect(results[0].failureKind).toBe('preview-runtime');
    expect(results[0].error).toContain('Your code threw an error while the checks ran');
    expect(results[0].error).toContain('Save handler broke');
    expect(results[0].error).not.toContain('Script error');
    expect(results[0].error).not.toContain('during render');
  });

  it('focuses an element so React focus and blur handlers run, and refuses an element that cannot take focus', async () => {
    const html = makeReactPreviewHtml({
      'src/App.tsx': `import React, { useState } from 'react';
export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const note = (entry: string) => setLog((entries) => [...entries, entry]);
  return (
    <div>
      <button className="first" onFocus={() => note('focus first')} onBlur={() => note('blur first')}>First</button>
      <button className="second" onFocus={() => note('focus second')}>Second</button>
      <button className="off" disabled>Off</button>
      <div className="plain">Plain</div>
      <div inert=""><button className="behind">Behind</button></div>
      <p className="seen">{log.join(', ')}</p>
    </div>
  );
}
`,
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      {
        id: 'moves',
        name: 'Moves',
        steps: [
          { type: 'waitForCount', selector: '.first', count: 1, timeoutMs: 3000 },
          { type: 'focus', selector: '.first' },
          { type: 'focus', selector: '.first' },
          { type: 'expectText', selector: '.seen', text: 'focus first', match: 'equals' },
          { type: 'expectFocused', selector: '.first' },
          { type: 'focus', selector: '.second' },
          { type: 'expectText', selector: '.seen', text: 'focus first, blur first, focus second', match: 'equals' },
          { type: 'expectFocused', selector: '.second' },
        ],
      },
      { id: 'disabled', name: 'Disabled', steps: [{ type: 'focus', selector: '.off' }] },
      { id: 'plain', name: 'Plain', steps: [{ type: 'focus', selector: '.plain' }] },
      { id: 'inert', name: 'Inert', steps: [{ type: 'focus', selector: '.behind' }] },
    ] as any);

    expect(results).toEqual([
      { name: 'Moves', passed: true },
      { name: 'Disabled', passed: false, error: '.off cannot take focus', failureKind: 'assertion' },
      { name: 'Plain', passed: false, error: '.plain cannot take focus', failureKind: 'assertion' },
      { name: 'Inert', passed: false, error: '.behind cannot take focus', failureKind: 'assertion' },
    ]);
  });

  it('does not count a focus request a browser ignores, on a disabled control or inside an inert element', async () => {
    const page = `<!doctype html><html><body>
      <main class="page" inert><button class="behind">Behind</button></main>
      <button class="off" disabled>Off</button>
      <button class="free">Free</button>
      <script>
        document.querySelector('.free').addEventListener('click', () => {
          document.querySelector('.behind').focus();
          document.querySelector('.off').focus();
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY('render-ready'), 0);
      <\/script></body></html>`;
    const results = await runner.runFramework(page, [
      {
        id: 'ignored',
        name: 'Ignored',
        steps: [{ type: 'click', selector: '.free' }, { type: 'expectFocused', selector: '.behind' }],
      },
      {
        id: 'disabled',
        name: 'Disabled',
        steps: [{ type: 'click', selector: '.free' }, { type: 'expectFocused', selector: '.off' }],
      },
    ] as any);

    expect(results.map((result) => result.passed)).toEqual([false, false]);
    expect(results[0].error).toContain('.behind expected focus');
    expect(results[1].error).toContain('.off expected focus');
  });

  it('runs the real Vue builder with event modifiers, template refs and shadowing locals', async () => {
    const html = makeVuePreviewHtml({
      'src/App.vue': `
        <template>
          <main ref="rootRef" class="root" :data-has-root="hasRoot">
            <input class="input" @keydown.enter="post" />
            <div class="state" :class="{ active: isActive }">{{ label }}</div>
          </main>
        </template>

        <script setup lang="ts">
        import { computed, onMounted, ref } from 'vue';

        const rootRef = ref<HTMLElement | null>(null);
        const hasRoot = ref(false);
        const posted = ref(false);
        const isActive = computed(() => {
          const active = posted.value;
          return active;
        });
        const label = computed(() => (posted.value ? 'Posted' : 'Idle'));
        function post() {
          posted.value = true;
        }
        onMounted(() => {
          hasRoot.value = !!rootRef.value;
        });
        </script>
      `,
    }, window.location.origin);

    const results = await runner.runFramework(html, [{
      id: 'vue-script-setup-bindings',
      name: 'Vue script setup bindings',
      steps: [
        { type: 'expectText', selector: '.state', text: 'Idle' },
        { type: 'wait', durationMs: 50 },
        { type: 'expectAttribute', selector: '.root', attribute: 'data-has-root', expected: 'true' },
        { type: 'key', selector: '.input', key: 'Enter' },
        { type: 'expectText', selector: '.state', text: 'Posted' },
        { type: 'expectClass', selector: '.state', className: 'active' },
      ],
    }] as any);

    expect(results).toEqual([{ name: 'Vue script setup bindings', passed: true }]);
  });

  // A candidate may write valid code in any common shape. None of these may die in the preview.
  const countingCheck = [{
    id: 'counter-runs',
    name: 'The counter runs',
    steps: [
      { type: 'expectText', selector: '.out', text: '0' },
      { type: 'click', selector: '.go' },
      { type: 'expectText', selector: '.out', text: '1' },
    ],
  }] as any;
  const passedCountingCheck = [{ name: 'The counter runs', passed: true }];
  const reactBody = `<main><button className="go" onClick={() => setN((v) => v + 1)}>Go</button><p className="out">{n}</p></main>`;

  const reactShapes: Record<string, string> = {
    'a declared App exported at the end': `
      import React, { useState } from 'react';
      function App() { const [n, setN] = useState(0); return ${reactBody}; }
      export default App;`,
    'an arrow App exported at the end': `
      import { useState } from 'react';
      const App = () => { const [n, setN] = useState(0); return ${reactBody}; };
      export default App;`,
    'a default export wrapped in memo': `
      import { memo, useState } from 'react';
      function App() { const [n, setN] = useState(0); return ${reactBody}; }
      export default memo(App);`,
    'exports beyond the common hooks': `
      import { Fragment, forwardRef, memo, useId, useLayoutEffect, useState } from 'react';
      const Go = forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} className="go" {...props}>Go</button>);
      const Out = memo(({ n }: { n: number }) => <p className="out">{n}</p>);
      export default function App() {
        const [n, setN] = useState(0);
        const id = useId();
        useLayoutEffect(() => {}, []);
        return <Fragment><Go id={id} onClick={() => setN((v) => v + 1)} /><Out n={n} /></Fragment>;
      }`,
    'aliased and multi-line imports': `
      import React, {
        useState as useCount,
        type ReactNode,
      } from 'react';
      const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
      export default function App() {
        const [n, setN] = useCount(0);
        return <Shell><button className="go" onClick={() => setN((v) => v + 1)}>Go</button><p className="out">{n}</p></Shell>;
      }`,
    'a namespace import': `
      import * as R from 'react';
      export default function App() { const [n, setN] = R.useState(0); return ${reactBody}; }`,
    'a default import under another name': `
      import R from 'react';
      export default function App() { const [n, setN] = R.useState(0); return ${reactBody}; }`,
    'react-dom exports': `
      import { useState } from 'react';
      import { createPortal, flushSync } from 'react-dom';
      export default function App() {
        const [n, setN] = useState(0);
        return <main>{createPortal(<p className="out">{n}</p>, document.body)}<button className="go" onClick={() => flushSync(() => setN((v) => v + 1))}>Go</button></main>;
      }`,
  };

  for (const [label, code] of Object.entries(reactShapes)) {
    it(`runs a React preview with ${label}`, async () => {
      const html = makeReactPreviewHtml({ 'src/App.tsx': code } as any, window.location.origin);
      expect(await runner.runFramework(html, countingCheck)).toEqual(passedCountingCheck);
    });
  }

  // Workspaces where App imports other files, as the snake game imports its engine.
  const reactWorkspaces: Record<string, Record<string, string>> = {
    'a helper module and types imported over several lines': {
      'src/App.tsx': `
        import React, { useState } from 'react';
        import './App.css';
        import {
          next,
          type Count,
        } from './counter';
        export default function App() {
          const [n, setN] = useState<Count>(0);
          return <main><button className="go" onClick={() => setN(next)}>Go</button><p className="out">{n}</p></main>;
        }`,
      'src/App.css': '.out { color: inherit; }',
      'src/counter.ts': `
        export type Count = number;
        const STEP = 1;
        export function next(value: Count): Count { return value + STEP; }`,
    },
    'default, renamed and namespace imports from nested files sharing a React import': {
      'src/App.tsx': `
        import { memo, useState } from 'react';
        import Out from './components/Out';
        import Display from './components/Out';
        import { step as advance } from './lib/math';
        import * as labels from './lib/labels';
        const Shell = memo(({ children }: { children: any }) => <main>{children}</main>);
        export default function App() {
          const [n, setN] = useState(0);
          return <Shell><button className="go" onClick={() => setN((v) => advance(v))}>{labels.GO}</button><Out n={n} />{Display === Out ? null : 'mismatch'}</Shell>;
        }`,
      'src/components/Out.tsx': `
        import { memo } from 'react';
        const Out = memo(({ n }: { n: number }) => <p className="out">{n}</p>);
        export default Out;`,
      'src/lib/math.ts': `export function step(value: number) { return value + 1; }`,
      'src/lib/labels.ts': `export const GO = 'Go';`,
    },
  };

  for (const [label, files] of Object.entries(reactWorkspaces)) {
    it(`runs a React preview with ${label}`, async () => {
      const html = makeReactPreviewHtml(files, window.location.origin);
      expect(await runner.runFramework(html, countingCheck)).toEqual(passedCountingCheck);
    });
  }

  const vueTemplate = `<main><button class="go" @click="inc">Go</button><p class="out">{{ n }}</p></main>`;
  const vueShapes: Record<string, string> = {
    'the Options API': `
      <template>${vueTemplate}</template>
      <script>
      export default {
        data() { return { n: 0 }; },
        methods: { inc() { this.n += 1; } },
      };
      </script>`,
    'defineComponent and lang="ts"': `
      <template>${vueTemplate}</template>
      <script lang="ts">
      import { defineComponent } from 'vue';
      export default defineComponent({
        data() { return { n: 0 as number }; },
        methods: { inc(): void { this.n += 1; } },
      });
      </script>`,
    'a setup function': `
      <template>${vueTemplate}</template>
      <script>
      import { ref } from 'vue';
      export default {
        setup() {
          const n = ref(0);
          const inc = () => { n.value += 1; };
          return { n, inc };
        },
      };
      </script>`,
    'a nested template tag': `
      <template><main><template v-if="true"><button class="go" @click="inc">Go</button></template><p class="out">{{ n }}</p></main></template>
      <script setup lang="ts">
      import { ref } from 'vue';
      const n = ref(0);
      const inc = () => { n.value += 1; };
      </script>`,
    'destructured refs and a helper outside the usual list': `
      <template>${vueTemplate}</template>
      <script setup lang="ts">
      import { reactive, toRefs } from 'vue';
      const state = reactive({ n: 0 });
      const { n } = toRefs(state);
      const inc = () => { state.n += 1; };
      </script>`,
    'a destructured composable with aliases': `
      <template>${vueTemplate}</template>
      <script setup lang="ts">
      import { ref as makeRef, type Ref } from 'vue';
      function useCounter() {
        const count: Ref<number> = makeRef(0);
        return { count, add: () => { count.value += 1; } };
      }
      const { count: n, add: inc } = useCounter();
      </script>`,
  };

  for (const [label, code] of Object.entries(vueShapes)) {
    it(`runs a Vue preview with ${label}`, async () => {
      const html = makeVuePreviewHtml({ 'src/App.vue': code }, window.location.origin);
      expect(await runner.runFramework(html, countingCheck)).toEqual(passedCountingCheck);
    });
  }

  it('runs a Vue workspace of several files in the sandboxed frame', async () => {
    const html = makeVuePreviewHtml({
      'src/main.ts': "import { createApp } from 'vue';\nimport App from './App.vue';\nimport './App.css';\ncreateApp(App).mount('#app');",
      'src/App.css': '.out { font-weight: 600; }',
      'src/App.vue': `
        <template><main><Counter v-model="n" /><p class="out">{{ show(n) }}</p></main></template>
        <script setup lang="ts">
        import { ref } from 'vue';
        import Counter from './components/Counter.vue';
        import { show } from './show';
        const n = ref(0);
        </script>`,
      'src/components/Counter.vue': `
        <template><button class="go" @click="model += 1">Go</button></template>
        <script setup lang="ts">
        const model = defineModel<number>({ required: true });
        </script>
        <style scoped>.go { cursor: pointer; }</style>`,
      'src/show.ts': 'export const show = (value: number): string => String(value);',
    }, window.location.origin);
    expect(await runner.runFramework(html, countingCheck)).toEqual(passedCountingCheck);
  });

  describe('on a static page, as an HTML/CSS task checks it', () => {
    const staticRun = { startOn: 'load' as const, states: true, viewport: { width: 1024, height: 768 } };

    it('starts once the page is parsed and lays it out at the size each check names', async () => {
      const page = `<!doctype html><html><head><style>
          body { margin: 0; }
          .gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          @media (min-width: 1024px) { .gallery { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
          .card { height: 80px; }
        </style></head><body><div class="gallery">${'<div class="card"></div>'.repeat(8)}</div></body></html>`;
      const results = await runner.runFramework(page, [
        { id: 'wide', name: 'Wide', viewport: { width: 1280 }, steps: [{ type: 'expectLayout', selector: '.card', columns: 4, rows: 2 }] },
        { id: 'narrow', name: 'Narrow', viewport: { width: 600 }, steps: [{ type: 'expectLayout', selector: '.card', columns: 2, rows: 4 }] },
        { id: 'default', name: 'Default size', steps: [{ type: 'expectLayout', selector: '.card', columns: 4 }] },
        { id: 'wrong', name: 'Wrong', viewport: { width: 600 }, steps: [{ type: 'expectLayout', selector: '.card', columns: 4 }] },
      ] as any, staticRun);

      expect(results).toEqual([
        { name: 'Wide', passed: true },
        { name: 'Narrow', passed: true },
        { name: 'Default size', passed: true },
        { name: 'Wrong', passed: false, error: '.card sit in 2 columns; expected 4', failureKind: 'assertion' },
      ]);
    });

    it('runs each check under the color scheme and motion setting it names, whatever the visitor uses', async () => {
      const page = `<!doctype html><html><head><style>
          :root { --surface: #ffffff; }
          @media (prefers-color-scheme: dark) { :root { --surface: #16181a; } }
          :root:where(.theme-dark) { --surface: #16181a; }
          .panel { background: var(--surface); transition: transform 200ms ease; }
          @media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
        </style></head><body><div class="panel">Panel</div></body></html>`;
      const results = await runner.runFramework(page, [
        { id: 'light', name: 'Light', media: { 'prefers-color-scheme': 'light' }, steps: [{ type: 'expectColor', selector: '.panel', tone: 'light' }] },
        { id: 'dark', name: 'Dark', media: { 'prefers-color-scheme': 'dark' }, steps: [{ type: 'expectColor', selector: '.panel', tone: 'dark' }] },
        {
          id: 'class',
          name: 'Class',
          media: { 'prefers-color-scheme': 'light' },
          steps: [
            { type: 'addClass', selector: 'html', className: 'theme-dark' },
            { type: 'expectColor', selector: '.panel', tone: 'dark' },
            { type: 'removeClass', selector: 'html', className: 'theme-dark' },
            { type: 'expectColor', selector: '.panel', tone: 'light' },
          ],
        },
        {
          id: 'still',
          name: 'Still',
          media: { 'prefers-reduced-motion': 'reduce' },
          steps: [{ type: 'expectStyle', selector: '.panel', property: 'transition-duration', atMost: 0 }],
        },
        {
          id: 'moving',
          name: 'Moving',
          media: { 'prefers-reduced-motion': 'no-preference' },
          steps: [{ type: 'expectStyle', selector: '.panel', property: 'transition-duration', atMost: 0 }],
        },
      ] as any, staticRun);

      expect(results).toEqual([
        { name: 'Light', passed: true },
        { name: 'Dark', passed: true },
        { name: 'Class', passed: true },
        { name: 'Still', passed: true },
        { name: 'Moving', passed: false, error: '.panel expected transition-duration to be at most 0 but it was 0.2s', failureKind: 'assertion' },
      ]);
    });

    it('waits for the frame to get its size when the page parses before the runner lays the frame out', async () => {
      const page = `<!doctype html><html><head><style>
          :root { --surface: #ffffff; }
          @media (prefers-color-scheme: dark) { :root { --surface: #16181a; } }
          .gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background: var(--surface); }
          @media (min-width: 1024px) { .gallery { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
          .card { height: 80px; }
        </style></head><body><div class="gallery">${'<div class="card"></div>'.repeat(8)}</div></body></html>`;
      const run = runner.runFramework(page, [
        {
          id: 'light',
          name: 'Light',
          media: { 'prefers-color-scheme': 'light' },
          steps: [
            { type: 'expectColor', selector: '.gallery', tone: 'light' },
            { type: 'expectLayout', selector: '.card', columns: 4, rows: 2 },
          ],
        },
      ] as any, staticRun);
      // A busy page, as the runner's page often is when checks start: the frame parses while it is still 0x0.
      const until = performance.now() + 150;
      while (performance.now() < until) { }

      expect(await run).toEqual([{ name: 'Light', passed: true }]);
    });

    it('sets :hover, :focus-visible and :focus-within styles through the hover and focus steps', async () => {
      const page = `<!doctype html><html><head><style>
          .lift { transition: transform 200ms; }
          .lift:hover { transform: translateY(-4px); }
          input:focus-visible { outline: 2px solid rgb(37 99 235); }
          .field:focus-within { background-color: #93c5fd; }
        </style></head><body>
          <div class="lift">Card</div>
          <div class="field"><label for="email">Email</label><input id="email"></div>
        </body></html>`;
      const results = await runner.runFramework(page, [
        {
          id: 'hover',
          name: 'Hover',
          steps: [
            { type: 'expectStyle', selector: '.lift', property: 'transform', value: 'none' },
            { type: 'hover', selector: '.lift' },
            { type: 'expectStyle', selector: '.lift', property: 'transform', value: 'none', expected: false },
            { type: 'unhover', selector: '.lift' },
            { type: 'expectStyle', selector: '.lift', property: 'transform', value: 'none' },
          ],
        },
        {
          id: 'focus',
          name: 'Focus',
          steps: [
            { type: 'expectStyle', selector: 'input', property: 'outline-style', value: 'none' },
            { type: 'focus', selector: 'input' },
            { type: 'expectStyle', selector: 'input', property: 'outline-style', value: 'solid' },
            { type: 'expectColor', selector: '.field', hue: 'blue' },
          ],
        },
      ] as any, staticRun);

      expect(results).toEqual([
        { name: 'Hover', passed: true },
        { name: 'Focus', passed: true },
      ]);
    });

    it('reads computed styles, declarations, visibility, validity and sideways overflow', async () => {
      const page = `<!doctype html><html><head><style>
          body { margin: 0; }
          h1 { margin: 0; font-size: clamp(1.5rem, 4vw, 3rem); font-weight: 700; }
          .tag { display: inline-block; padding: 8px 12px; }
          #about { display: none; }
          .wide { width: 500px; }
        </style></head><body>
          <h1>Title</h1><span class="tag">css</span>
          <section id="home">Home</section><section id="about">About</section>
          <form><input id="name" required></form>
          <div class="wide">Wide</div>
        </body></html>`;
      const results = await runner.runFramework(page, [
        {
          id: 'styles',
          name: 'Styles',
          steps: [
            { type: 'expectStyle', selector: 'h1', property: 'margin-top', atMost: 0 },
            { type: 'expectStyle', selector: 'h1', property: 'font-weight', atLeast: 600 },
            { type: 'expectStyle', selector: '.tag', property: 'display', value: 'inline-block' },
            { type: 'expectStyle', selector: '.tag', property: 'padding-left', atLeast: 12, atMost: 12 },
            { type: 'expectDeclared', selector: 'h1', property: 'font-size', value: 'clamp(' },
            { type: 'expectVisible', selector: '#home' },
            { type: 'expectVisible', selector: '#about', expected: false },
            { type: 'expectValidity', selector: 'form', expected: false },
            { type: 'setValue', selector: '#name', value: 'Ada' },
            { type: 'expectValidity', selector: 'form' },
          ],
        },
        { id: 'declared', name: 'Declared', steps: [{ type: 'expectDeclared', selector: '.tag', property: 'padding-left,padding', value: 'clamp(' }] },
        { id: 'shown', name: 'Shown', steps: [{ type: 'expectVisible', selector: '#about' }] },
        { id: 'fits', name: 'Fits', viewport: { width: 375 }, steps: [{ type: 'expectNoOverflow', selector: 'html' }] },
        { id: 'display', name: 'Display', steps: [{ type: 'expectStyle', selector: '.tag', property: 'display', value: 'inline-block', expected: false }] },
      ] as any, staticRun);

      expect(results).toEqual([
        { name: 'Styles', passed: true },
        {
          name: 'Declared',
          passed: false,
          error: '.tag expected padding-left or padding declared with "clamp(" but its CSS declares "12px", "8px 12px"',
          failureKind: 'assertion',
        },
        { name: 'Shown', passed: false, error: '#about expected to be shown but it was hidden', failureKind: 'assertion' },
        { name: 'Fits', passed: false, error: 'html is 500px wide inside 375px, so it scrolls sideways', failureKind: 'assertion' },
        { name: 'Display', passed: false, error: '.tag expected display not to be "inline-block" but it was "inline-block"', failureKind: 'assertion' },
      ]);
    });

    it('tells labels from placeholders, reads a description, and measures corners, side gaps and rows that must break', async () => {
      const page = `<!doctype html><html><head><style>
          body { margin: 0; }
          .product { position: relative; width: 320px; height: 180px; }
          .badge { position: absolute; top: 8px; right: 8px; width: 40px; height: 20px; }
          .loose { position: absolute; top: 90px; left: 10px; width: 40px; height: 20px; }
          .tag { display: inline-block; width: 50px; margin-right: 8px; }
          .bar { display: flex; flex-wrap: wrap; }
          .bar > span { width: 300px; }
        </style></head><body>
          <label for="name">Name</label><input id="name"><input id="email" placeholder="Email">
          <dialog open aria-labelledby="t" aria-describedby="d"><h2 id="t">Delete?</h2><p id="d">This cannot be undone.</p></dialog>
          <div class="product"><span class="badge">NEW</span><span class="loose">OLD</span></div>
          <p><span class="tag">a</span><span class="tag">b</span></p>
          <div class="bar"><span>One</span><span>Two</span></div>
        </body></html>`;
      const results = await runner.runFramework(page, [
        {
          id: 'right',
          name: 'Right',
          viewport: { width: 1024 },
          steps: [
            { type: 'expectLabelled', selector: '#name' },
            { type: 'expectDescription', selector: 'dialog', text: 'cannot be undone' },
            { type: 'expectCorner', selector: '.badge', than: { selector: '.product' }, corner: 'top-right', gap: 24 },
            { type: 'expectPlaced', selector: '.tag:nth-child(2)', than: { selector: '.tag' }, side: 'right', gap: 8 },
            { type: 'expectLayout', selector: '.bar > span', rows: 1 },
          ],
        },
        { id: 'placeholder', name: 'Placeholder', steps: [{ type: 'expectLabelled', selector: '#email' }] },
        { id: 'corner', name: 'Corner', steps: [{ type: 'expectCorner', selector: '.loose', than: { selector: '.product' }, gap: 24 }] },
        { id: 'phone', name: 'Phone', viewport: { width: 375 }, steps: [{ type: 'expectLayout', selector: '.bar > span', rows: 1, expected: false }] },
        { id: 'desktop', name: 'Desktop', viewport: { width: 1024 }, steps: [{ type: 'expectLayout', selector: '.bar > span', rows: 1, expected: false }] },
      ] as any, staticRun);

      expect(results).toEqual([
        { name: 'Right', passed: true },
        { name: 'Placeholder', passed: false, error: '#email has no label', failureKind: 'assertion' },
        {
          name: 'Corner',
          passed: false,
          error: '.loose sits 270px across and 90px down from the top-right corner of .product; expected within 24px',
          failureKind: 'assertion',
        },
        { name: 'Phone', passed: true },
        { name: 'Desktop', passed: false, error: '.bar > span sit in 1 row; expected another number', failureKind: 'assertion' },
      ]);
    });
  });

  it('names a Vue compile error and the file and line it is in, in every check', async () => {
    const html = makeVuePreviewHtml({
      'src/App.vue': '<template><p class="out">{{ label }}</p></template>\n<script setup lang="ts">\nimport { label } from \'./labels\';\n</script>',
      'src/labels.ts': ['// labels', "export const label = 'x' +;"].join('\n'),
    }, window.location.origin);
    const results = await runner.runFramework(html, [
      { id: 'first', name: 'First', steps: [{ type: 'expectExists', selector: '.out' }] },
      { id: 'second', name: 'Second', steps: [{ type: 'expectExists', selector: '.out' }] },
    ] as any);

    expect(results.map((result) => result.failureKind)).toEqual(['compilation', 'compilation']);
    for (const result of results) {
      expect(result.error).toMatch(/^Preview compilation failed: \S.* \(src\/labels\.ts:2:\d+\)$/);
    }
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
