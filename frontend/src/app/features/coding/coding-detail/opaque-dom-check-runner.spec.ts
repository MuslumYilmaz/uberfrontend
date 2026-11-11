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
    expect(starterResults[0].error).toContain('did not reach text "1"');
    expect(solutionResults).toEqual([{ name: 'Counter increments', passed: true }]);
    expect(document.querySelectorAll('iframe[aria-hidden="true"]').length).toBe(0);
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
