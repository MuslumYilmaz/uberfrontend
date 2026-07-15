import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(frontendRoot, '..');

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

function json(relative) {
  return JSON.parse(read(relative));
}

function fileCode(asset, file) {
  const value = asset.files[file];
  assert.ok(value, `Missing ${file}`);
  return typeof value === 'string' ? value : value.code;
}

function assertMirror(relative) {
  const cdn = read(`cdn/${relative}`);
  const fallback = read(`frontend/src/assets/${relative}`);
  assert.equal(fallback, cdn, `Frontend fallback drifted from CDN: ${relative}`);
}

async function drainMicrotasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  function schedule(callback, delay, interval) {
    const id = nextId;
    nextId += 1;
    const normalizedDelay = Math.max(interval ? 1 : 0, Number(delay) || 0);
    timers.set(id, { callback, due: now + normalizedDelay, interval: interval ? normalizedDelay : null });
    return id;
  }

  function nextTimerBefore(target) {
    return [...timers.entries()]
      .filter(([, timer]) => timer.due <= target)
      .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0] ?? null;
  }

  return {
    setTimeout(callback, delay) { return schedule(callback, delay, false); },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback, delay) { return schedule(callback, delay, true); },
    clearInterval(id) { timers.delete(id); },
    activeIntervals() {
      return [...timers.values()].filter((timer) => timer.interval !== null).length;
    },
    async advanceBy(duration) {
      const target = now + duration;
      let next;
      while ((next = nextTimerBefore(target)) !== null) {
        const [id, timer] = next;
        now = timer.due;
        if (timer.interval === null) timers.delete(id);
        else timer.due += timer.interval;
        timer.callback();
        await drainMicrotasks();
      }
      now = target;
      await drainMicrotasks();
    }
  };
}

function createFakeBrowser(clock) {
  const windowListeners = new Map();
  const documentListeners = new Map();

  function add(listeners, type, listener) {
    const registered = listeners.get(type) ?? new Set();
    registered.add(listener);
    listeners.set(type, registered);
  }

  function remove(listeners, type, listener) {
    listeners.get(type)?.delete(listener);
  }

  const window = {
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    addEventListener(type, listener) { add(windowListeners, type, listener); },
    removeEventListener(type, listener) { remove(windowListeners, type, listener); },
    dispatch(type, event) {
      for (const listener of windowListeners.get(type) ?? []) listener(event);
    }
  };

  const document = {
    addEventListener(type, listener) { add(documentListeners, type, listener); },
    removeEventListener(type, listener) { remove(documentListeners, type, listener); }
  };

  return { window, document };
}

function createReactHarness(source, fileName, browser, modules, globals = {}) {
  const slots = [];
  const effects = new Map();
  let hookIndex = 0;
  let pendingEffects = [];
  let dirty = true;
  let component = null;
  let tree = null;

  function sameDependencies(previous, next) {
    return previous !== undefined && next !== undefined &&
      previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
  }

  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props ?? {}),
          children: children.length <= 1 ? children[0] : children
        }
      };
    },
    useRef(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!slots[index]) slots[index] = { kind: 'ref', current: initialValue };
      return slots[index];
    },
    useState(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!slots[index]) {
        const state = {
          kind: 'state',
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
          set(nextValue) {
            const resolved = typeof nextValue === 'function' ? nextValue(state.value) : nextValue;
            if (Object.is(resolved, state.value)) return;
            state.value = resolved;
            dirty = true;
          }
        };
        slots[index] = state;
      }
      return [slots[index].value, slots[index].set];
    },
    useMemo(factory, dependencies) {
      const index = hookIndex;
      hookIndex += 1;
      const memo = slots[index];
      if (!memo || !sameDependencies(memo.dependencies, dependencies)) {
        slots[index] = { kind: 'memo', value: factory(), dependencies };
      }
      return slots[index].value;
    },
    useCallback(callback, dependencies) {
      return React.useMemo(() => callback, dependencies);
    },
    useEffect(effect, dependencies) {
      const index = hookIndex;
      hookIndex += 1;
      const previous = effects.get(index);
      if (!previous || !sameDependencies(previous.dependencies, dependencies)) {
        pendingEffects.push({ index, effect, dependencies });
      }
    }
  };

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      strict: true
    },
    reportDiagnostics: true,
    fileName
  });
  assert.deepEqual(
    (transpiled.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    ),
    [],
    `${fileName} must transpile for the deterministic component harness`
  );

  const reactModule = { __esModule: true, default: React, ...React };
  const module = { exports: {} };
  const require = (specifier) => {
    if (specifier === 'react') return reactModule;
    if (specifier.endsWith('.css')) return {};
    if (Object.prototype.hasOwnProperty.call(modules, specifier)) return modules[specifier];
    throw new Error(`Unexpected ${fileName} dependency: ${specifier}`);
  };
  const sandbox = {
    AbortController,
    DOMException,
    console,
    document: browser.document,
    window: browser.window,
    ...globals
  };
  const execute = vm.runInNewContext(
    `(function (require, module, exports) { ${transpiled.outputText}\n})`,
    sandbox,
    { filename: fileName }
  );
  execute(require, module, module.exports);

  function renderOnce() {
    hookIndex = 0;
    pendingEffects = [];
    dirty = false;
    tree = component();
    for (const pending of pendingEffects) {
      effects.get(pending.index)?.cleanup?.();
      const cleanup = pending.effect();
      effects.set(pending.index, {
        dependencies: pending.dependencies,
        cleanup: typeof cleanup === 'function' ? cleanup : null
      });
    }
  }

  return {
    mount() {
      component = module.exports.default;
      assert.equal(typeof component, 'function', `${fileName} must export a component`);
      this.flush();
    },
    flush() {
      let renders = 0;
      while (dirty) {
        renderOnce();
        renders += 1;
        assert.ok(renders < 20, `${fileName} entered a render loop in the deterministic harness`);
      }
    },
    get tree() { return tree; },
    state(index) {
      assert.equal(slots[index]?.kind, 'state', `${fileName} hook ${index} must be state`);
      return slots[index].value;
    },
    unmount() {
      for (const effect of effects.values()) effect.cleanup?.();
      effects.clear();
    }
  };
}

function findElement(node, predicate) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (predicate(node)) return node;
  return findElement(node.props?.children, predicate);
}

function renderedText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(renderedText).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return renderedText(node.props?.children);
}

const solutionAssets = [
  {
    name: 'Angular',
    relative: 'sb/angular/solution/angular-snake-game-solution.v1.json',
    component: '/src/app/app.component.ts',
    engine: '/src/app/snake-engine.ts'
  },
  {
    name: 'React',
    relative: 'sb/react/solution/react-snake-game-solution.v1.json',
    component: 'src/App.tsx',
    engine: 'src/snake-engine.ts'
  },
  {
    name: 'Vue v1',
    relative: 'sb/vue/solution/vue-snake-game-solution.v1.json',
    component: 'src/App.vue',
    engine: 'src/snake-engine.ts'
  },
  {
    name: 'Vue v2',
    relative: 'sb/vue/solution/vue-snake-game-solution.v2.json',
    component: 'src/App.vue',
    engine: 'src/snake-engine.ts'
  }
];

for (const relative of [
  'sb/angular/question/angular-snake-game.v1.json',
  'sb/angular/solution/angular-snake-game-solution.v1.json',
  'sb/react/question/react-snake-game.v1.json',
  'sb/react/solution/react-snake-game-solution.v1.json',
  'sb/vue/question/vue-snake-game.v1.json',
  'sb/vue/question/vue-snake-game.v2.json',
  'sb/vue/solution/vue-snake-game-solution.v1.json',
  'sb/vue/solution/vue-snake-game-solution.v2.json'
]) {
  assertMirror(relative);
}

assert.equal(
  read('cdn/sb/vue/question/vue-snake-game.v1.json'),
  read('cdn/sb/vue/question/vue-snake-game.v2.json'),
  'Vue Snake starter v1/v2 copies must stay synchronized'
);
assert.equal(
  read('cdn/sb/vue/solution/vue-snake-game-solution.v1.json'),
  read('cdn/sb/vue/solution/vue-snake-game-solution.v2.json'),
  'Vue Snake solution v1/v2 copies must stay synchronized'
);

const engines = solutionAssets.map(({ name, relative, component, engine }) => {
  const asset = json(`cdn/${relative}`);
  const componentCode = fileCode(asset, component);
  const engineCode = fileCode(asset, engine);

  assert.match(componentCode, /from '\.\/snake-engine'/);
  assert.match(componentCode, /bufferTurn\(/);
  assert.match(componentCode, /stepSnake\(/);
  assert.match(componentCode, /bufferedDirection/);
  assert.match(componentCode, /outcome === 'won'/);
  assert.match(componentCode, /You win/);
  assert.match(engineCode, /food: Point \| null/);
  assert.match(engineCode, /bufferedDirection: Direction \| null/);
  assert.match(engineCode, /food === null \? 'won' : 'moved'/);
  assert.doesNotMatch(componentCode, /pendingDirection/);

  if (name === 'Angular') {
    assert.match(componentCode, /this\.bufferedDirection = null/);
    assert.match(componentCode, /this\.isWon = false/);
    assert.match(componentCode, /ngOnDestroy\(\): void \{[\s\S]*this\.clearTimer\(\)/);
    assert.match(componentCode, /outcome === 'won'[\s\S]*this\.pause\(\)/);
  } else if (name === 'React') {
    assert.match(componentCode, /bufferedDirection: null/);
    assert.match(componentCode, /terminal: 'none'/);
    assert.match(componentCode, /return \(\) => window\.clearInterval\(timerId\)/);
    assert.match(componentCode, /isRunning: terminal === 'none'/);
  } else {
    assert.match(componentCode, /bufferedDirection\.value = null/);
    assert.match(componentCode, /isWon\.value = false/);
    assert.match(componentCode, /onBeforeUnmount\([\s\S]*clearTimer\(\)/);
    assert.match(componentCode, /outcome === 'won'[\s\S]*pauseLoop\(\)/);
  }

  const transpiled = ts.transpileModule(engineCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true
    },
    reportDiagnostics: true,
    fileName: `${name.toLowerCase()}-snake-engine.ts`
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  assert.deepEqual(errors, [], `${name} Snake engine must transpile without syntax errors`);
  return { name, engineCode, outputText: transpiled.outputText };
});

const importedEngines = new Map();

assert.equal(engines[1].engineCode, engines[0].engineCode, 'React and Angular must share one engine contract');
assert.equal(engines[2].engineCode, engines[0].engineCode, 'Vue v1 and Angular must share one engine contract');
assert.equal(engines[3].engineCode, engines[0].engineCode, 'Vue v2 and Angular must share one engine contract');

function reproduceLegacySameTickBug() {
  const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
  const direction = 'RIGHT';
  let pendingDirection = 'RIGHT';
  for (const requested of ['UP', 'LEFT']) {
    const activeDirection = pendingDirection || direction;
    if (opposite[activeDirection] !== requested) pendingDirection = requested;
  }
  return pendingDirection;
}

assert.equal(
  reproduceLegacySameTickBug(),
  'LEFT',
  'The previous pending-direction algorithm must reproduce RIGHT -> UP -> LEFT before guarding it'
);

for (const { name, outputText } of engines) {
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  const moduleKey = name.toLowerCase().replace(/\s+/g, '-');
  const engine = await import(`${moduleUrl}#${moduleKey}`);
  importedEngines.set(name, engine);

  assert.equal(engine.bufferTurn('RIGHT', null, 'LEFT'), null, `${name}: opposite input is ignored`);
  assert.equal(engine.bufferTurn('RIGHT', null, 'RIGHT'), null, `${name}: same input is ignored`);

  const afterInvalid = engine.bufferTurn('RIGHT', null, 'LEFT');
  assert.equal(
    engine.bufferTurn('RIGHT', afterInvalid, 'UP'),
    'UP',
    `${name}: invalid input must not consume the buffer`
  );

  let buffered = engine.bufferTurn('RIGHT', null, 'UP');
  buffered = engine.bufferTurn('RIGHT', buffered, 'LEFT');
  assert.equal(buffered, 'UP', `${name}: RIGHT -> UP -> LEFT must retain UP`);

  const turned = engine.stepSnake({
    snake: [{ x: 1, y: 1 }, { x: 0, y: 1 }],
    direction: 'RIGHT',
    bufferedDirection: buffered,
    food: { x: 2, y: 2 },
    score: 0
  }, 3, () => 0);
  assert.equal(turned.direction, 'UP', `${name}: the tick commits the first buffered turn`);
  assert.equal(turned.bufferedDirection, null, `${name}: the tick clears the buffer`);
  assert.deepEqual(turned.snake[0], { x: 1, y: 0 });

  const won = engine.stepSnake({
    snake: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    direction: 'RIGHT',
    bufferedDirection: null,
    food: { x: 1, y: 0 },
    score: 7
  }, 2, () => 0);
  assert.equal(won.outcome, 'won', `${name}: eating the final free cell wins`);
  assert.equal(won.food, null, `${name}: a full board has no food`);
  assert.equal(won.snake.length, 4);
  assert.equal(won.score, 8);
}

function finalCellEngine(engine) {
  return {
    ...engine,
    placeFood() { return { x: 8, y: 7 }; },
    stepSnake() {
      return engine.stepSnake({
        snake: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
        direction: 'RIGHT',
        bufferedDirection: null,
        food: { x: 1, y: 0 },
        score: 7
      }, 2, () => 0);
    }
  };
}

{
  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const reactSolution = json('cdn/sb/react/solution/react-snake-game-solution.v1.json');
  const reactCode = fileCode(reactSolution, 'src/App.tsx');
  const harness = createReactHarness(
    reactCode,
    'react-snake-component.tsx',
    browser,
    { './snake-engine': finalCellEngine(importedEngines.get('React')) }
  );
  harness.mount();

  browser.window.dispatch('keydown', { key: ' ', preventDefault() {} });
  harness.flush();
  assert.equal(clock.activeIntervals(), 1, 'React Snake starts one component interval');

  await clock.advanceBy(140);
  harness.flush();
  assert.equal(clock.activeIntervals(), 0, 'React Snake clears its interval after the final-cell win');
  assert.match(renderedText(harness.tree), /Score: 8[\s\S]*Length: 4[\s\S]*You win/);
  assert.equal(
    findElement(harness.tree, (element) => String(element.props?.className).includes('cell--food')),
    null,
    'React Snake renders no food cell on a full board'
  );

  browser.window.dispatch('keydown', { key: 'Enter', preventDefault() {} });
  harness.flush();
  assert.equal(clock.activeIntervals(), 0, 'React Snake reset remains paused with no retained timer');
  assert.match(renderedText(harness.tree), /Score: 0[\s\S]*Length: 3[\s\S]*Paused/);
  assert.ok(
    findElement(harness.tree, (element) => String(element.props?.className).includes('cell--food')),
    'React Snake reset places food again'
  );
  harness.unmount();
}

for (const version of ['Vue v1', 'Vue v2']) {
  const asset = json(`cdn/sb/vue/solution/vue-snake-game-solution.${version === 'Vue v1' ? 'v1' : 'v2'}.json`);
  const componentCode = fileCode(asset, 'src/App.vue');
  const script = componentCode.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, `${version}: component script must be extractable`);

  const augmentedScript = `${script}\nexport { food, isRunning, isGameOver, isWon, score, snake, resetGame, toggleRunning };`;
  const transpiled = ts.transpileModule(augmentedScript, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      strict: true
    },
    reportDiagnostics: true,
    fileName: `${version.toLowerCase().replace(/\s+/g, '-')}-snake-component.ts`
  });
  assert.deepEqual(
    (transpiled.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    ),
    [],
    `${version}: component script must transpile for deterministic integration testing`
  );

  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const mounted = [];
  const beforeUnmount = [];
  const vue = {
    ref(value) { return { value }; },
    computed(getter) { return { get value() { return getter(); } }; },
    onMounted(callback) { mounted.push(callback); },
    onBeforeUnmount(callback) { beforeUnmount.push(callback); }
  };
  const module = { exports: {} };
  const require = (specifier) => {
    if (specifier === 'vue') return vue;
    if (specifier === './snake-engine') return finalCellEngine(importedEngines.get(version));
    throw new Error(`${version}: unexpected dependency ${specifier}`);
  };
  const execute = vm.runInNewContext(
    `(function (require, module, exports) { ${transpiled.outputText}\n})`,
    {
      clearInterval: clock.clearInterval,
      console,
      window: browser.window
    },
    { filename: `${version.toLowerCase().replace(/\s+/g, '-')}-snake-component.ts` }
  );
  execute(require, module, module.exports);
  for (const callback of mounted) callback();

  module.exports.toggleRunning();
  assert.equal(clock.activeIntervals(), 1, `${version}: component starts one interval`);
  await clock.advanceBy(140);
  assert.equal(clock.activeIntervals(), 0, `${version}: final-cell win clears the interval`);
  assert.equal(module.exports.isWon.value, true);
  assert.equal(module.exports.isGameOver.value, false);
  assert.equal(module.exports.isRunning.value, false);
  assert.equal(module.exports.food.value, null);
  assert.equal(module.exports.score.value, 8);
  assert.equal(module.exports.snake.value.length, 4);

  module.exports.resetGame();
  assert.equal(clock.activeIntervals(), 0, `${version}: reset remains paused with no retained timer`);
  assert.equal(module.exports.isWon.value, false);
  assert.equal(module.exports.isGameOver.value, false);
  assert.equal(module.exports.isRunning.value, false);
  assert.equal(module.exports.score.value, 0);
  assert.equal(module.exports.snake.value.length, 3);
  assert.deepEqual(module.exports.food.value, { x: 8, y: 7 });

  for (const callback of beforeUnmount) callback();
  assert.equal(clock.activeIntervals(), 0, `${version}: unmount leaves no interval behind`);
}

const angularSolution = json('cdn/sb/angular/solution/angular-snake-game-solution.v1.json');
const angularSpec = fileCode(angularSolution, '/src/app/app.component.spec.ts');
assert.match(angularSpec, /RIGHT -> UP -> LEFT during one tick/);
assert.match(angularSpec, /wins and stops with no food when the final free cell is eaten/);
assert.match(angularSpec, /does not let an invalid key consume the one-turn buffer/);

const reactStarter = json('cdn/sb/react/question/react-snake-game.v1.json');
const reactStarterCode = fileCode(reactStarter, 'src/App.tsx');
assert.match(reactStarterCode, /useRef/);
assert.match(reactStarterCode, /directionRef = useRef\('RIGHT'\)/);
assert.match(reactStarterCode, /bufferedDirectionRef = useRef\(null\)/);
assert.match(reactStarterCode, /multiple keydown events can arrive before React commits state/);

for (const [technology, id] of [
  ['angular', 'angular-snake-game'],
  ['react', 'react-snake-game'],
  ['vue', 'vue-snake-game']
]) {
  const question = json(`cdn/questions/${technology}/coding.json`).find((entry) => entry.id === id);
  assert.ok(question, `Missing ${id}`);
  assert.equal(question.updatedAt, '2026-07-14');
  const renderedContract = JSON.stringify(question);
  assert.match(renderedContract, /at most one valid perpendicular turn per tick/);
  assert.match(renderedContract, /full board|final free cell/);
  if (technology === 'react') {
    assert.match(renderedContract, /synchronous refs/);
    assert.match(renderedContract, /before React commits/);
  }
}

const decisionGraph = json('cdn/questions/angular/decision-graphs/angular-snake-game.v1.json');
const graphVariant = decisionGraph.variants.approach1;
assert.match(graphVariant.code, /bufferedDirection/);
assert.match(graphVariant.code, /result\.outcome === 'won'/);
const graphLines = graphVariant.code.split('\n');
for (const node of graphVariant.nodes) {
  const { lineStart, lineEnd, snippet } = node.anchor;
  assert.ok(lineStart >= 1 && lineEnd >= lineStart && lineEnd <= graphLines.length, `${node.id}: invalid anchor range`);
  assert.ok(
    graphLines.slice(lineStart - 1, lineEnd).join('\n').includes(snippet),
    `${node.id}: anchor range must contain its snippet`
  );
}

for (const relative of [
  'sb/react/question/react-use-effect-once.v1.json',
  'sb/react/solution/react-use-effect-once-solution.v1.json'
]) {
  assertMirror(relative);
}

const strictEffectQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-use-effect-once'
);
assert.ok(strictEffectQuestion);
assert.equal(strictEffectQuestion.access, 'premium');
assert.equal(strictEffectQuestion.sdk.asset, 'assets/sb/react/question/react-use-effect-once.v1.json');
assert.equal(strictEffectQuestion.solutionAsset, 'assets/sb/react/solution/react-use-effect-once-solution.v1.json');
assert.equal(strictEffectQuestion.updatedAt, '2026-07-14');
const strictEffectContract = JSON.stringify(strictEffectQuestion);
assert.match(strictEffectContract, /setup → cleanup → setup/);
assert.match(strictEffectContract, /one active connection/);
assert.match(strictEffectContract, /SSR requests/);
assert.match(strictEffectContract, /multiple roots/);
assert.match(strictEffectContract, /hydration/);
assert.match(strictEffectContract, /HMR/);
assert.doesNotMatch(strictEffectContract, /effect callback must run only once/i);
assert.doesNotMatch(strictEffectContract, /cleanup exactly once/i);

const strictEffectStarter = json('cdn/sb/react/question/react-use-effect-once.v1.json');
const strictEffectSolution = json('cdn/sb/react/solution/react-use-effect-once-solution.v1.json');
const strictEffectStarterCode = fileCode(strictEffectStarter, 'src/App.tsx');
const strictEffectSolutionCode = fileCode(strictEffectSolution, 'src/App.tsx');
const strictEffectIndex = fileCode(strictEffectSolution, 'src/index.tsx');
assert.match(strictEffectIndex, /<React\.StrictMode>/);
for (const code of [strictEffectStarterCode, strictEffectSolutionCode]) {
  assert.doesNotMatch(code, /useRef/);
  assert.doesNotMatch(code, /didRun|hasRun|cleanupRef/);
  assert.doesNotMatch(code, /eslint-disable/);
  assert.match(code, /setup → cleanup → setup/);
  assert.match(code, /active-count/);
}
assert.match(strictEffectStarterCode, /TODO: Create a connection/);
assert.match(strictEffectSolutionCode, /useEffect\(\(\) =>/);
assert.match(strictEffectSolutionCode, /const connection = createConnection\(roomId, setStatus, onActiveCount\)/);
assert.match(strictEffectSolutionCode, /connection\.connect\(\)/);
assert.match(strictEffectSolutionCode, /return \(\) => connection\.disconnect\(\)/);
assert.match(strictEffectSolutionCode, /\[roomId, onActiveCount\]/);

for (const relative of [
  'sb/angular/question/angular-todo-list.v2.json',
  'sb/angular/solution/angular-todo-list-solution.v2.json'
]) {
  assertMirror(relative);
  const asset = json(`cdn/${relative}`);
  const template = fileCode(asset, '/src/app/app.component.html');
  const component = fileCode(asset, '/src/app/app.component.ts');
  assert.match(template, /@for \(todo of todos; track todo\.id\)/);
  assert.match(template, /\*ngIf="hasTodos/);
  assert.doesNotMatch(template, /\*ngFor/);
  assert.doesNotMatch(component, /trackById/);
  const parsed = parseTemplate(template, relative);
  assert.deepEqual(parsed.errors, null, `${relative}: Angular template must parse`);
}

const todoQuestion = json('cdn/questions/angular/coding.json').find(
  (entry) => entry.id === 'angular-todo-list-starter'
);
assert.ok(todoQuestion);
assert.equal(todoQuestion.access, 'free');
assert.equal(todoQuestion.sdk.asset, 'assets/sb/angular/question/angular-todo-list.v2.json');
assert.equal(todoQuestion.solutionAsset, 'assets/sb/angular/solution/angular-todo-list-solution.v2.json');
assert.equal(todoQuestion.updatedAt, '2026-07-14');
const todoContract = JSON.stringify(todoQuestion);
assert.match(todoContract, /@for \(todo of todos; track todo\.id\)/);
assert.doesNotMatch(todoContract, /\*ngFor|trackById/);

for (const relative of [
  'sb/react/question/react-autocomplete-search.v2.json',
  'sb/react/solution/react-autocomplete-search-solution.v2.json'
]) {
  assertMirror(relative);
}

const autocompleteQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-autocomplete-search-starter'
);
assert.ok(autocompleteQuestion);
assert.equal(autocompleteQuestion.access, 'free');
assert.equal(
  autocompleteQuestion.sdk.asset,
  'assets/sb/react/question/react-autocomplete-search.v2.json'
);
assert.equal(
  autocompleteQuestion.sdk.storageKey,
  'v3:ui:react:react-autocomplete-search-starter'
);
assert.equal(
  autocompleteQuestion.solutionAsset,
  'assets/sb/react/solution/react-autocomplete-search-solution.v2.json'
);
assert.equal(autocompleteQuestion.updatedAt, '2026-07-14');

const autocompleteStarter = json('cdn/sb/react/question/react-autocomplete-search.v2.json');
const autocompleteSolution = json('cdn/sb/react/solution/react-autocomplete-search-solution.v2.json');
const autocompleteStarterCode = fileCode(autocompleteStarter, '/src/App.tsx');
const autocompleteSolutionCode = fileCode(autocompleteSolution, '/src/App.tsx');

for (const code of [autocompleteStarterCode, autocompleteSolutionCode]) {
  assert.match(code, /<label id=\{labelId\} className="label" htmlFor="autocomplete-query">/);
  assert.match(code, /aria-labelledby=\{labelId\}/);
  assert.match(code, /onPointerDown=/);
  assert.doesNotMatch(code, /onMouseDown=/);
  assert.match(code, /const visibleResults = status === 'success' \? results : \[\]/);
  assert.match(code, /\{visibleResults\.map\(/);
}

assert.match(autocompleteStarterCode, /create an AbortController/);
assert.match(autocompleteStarterCode, /While status is loading, no result may become active or selectable/);

const starterInputTransitionStart = autocompleteStarterCode.indexOf('function handleInputChange');
const starterInputTransitionEnd = autocompleteStarterCode.indexOf(
  '\n  function handleKeyDown',
  starterInputTransitionStart
);
assert.ok(starterInputTransitionStart >= 0 && starterInputTransitionEnd > starterInputTransitionStart);
const starterInputTransition = autocompleteStarterCode.slice(
  starterInputTransitionStart,
  starterInputTransitionEnd
);
assert.match(starterInputTransition, /requestSeqRef\.current \+= 1/);
assert.match(starterInputTransition, /setResults\(\[\]\)/);
assert.match(starterInputTransition, /setActiveIndex\(-1\)/);
assert.match(starterInputTransition, /setStatus\('loading'\)/);

const inputTransitionStart = autocompleteSolutionCode.indexOf('function handleInputChange');
const inputTransitionEnd = autocompleteSolutionCode.indexOf('\n  function handleFocus', inputTransitionStart);
assert.ok(inputTransitionStart >= 0 && inputTransitionEnd > inputTransitionStart);
const inputTransition = autocompleteSolutionCode.slice(inputTransitionStart, inputTransitionEnd);
assert.match(inputTransition, /requestSeqRef\.current \+= 1/);
assert.match(inputTransition, /setResults\(\[\]\)/);
assert.match(inputTransition, /setActiveIndex\(-1\)/);
assert.match(inputTransition, /setStatus\('loading'\)/);

assert.match(autocompleteSolutionCode, /const controller = new AbortController\(\)/);
assert.match(autocompleteSolutionCode, /searchCities\(trimmed, controller\.signal\)/);
assert.match(autocompleteSolutionCode, /requestSeqRef\.current !== requestId/);
assert.match(autocompleteSolutionCode, /controller\.abort\(\)/);
assert.match(autocompleteSolutionCode, /status !== 'success' \|\| !results\.length/);
assert.match(autocompleteSolutionCode, /status !== 'success' \|\| !results\.includes\(value\)/);

const autocompleteTests = new Map(
  autocompleteQuestion.frameworkTests.map((test) => [test.id, test])
);
const pendingAutocompleteTest = autocompleteTests.get('autocomplete-pending-clears-stale-options');
assert.ok(pendingAutocompleteTest);
const pendingSteps = pendingAutocompleteTest.steps;
const newQueryStep = pendingSteps.findIndex(
  (step) => step.type === 'setValue' && step.value === 'se'
);
assert.ok(newQueryStep > 0);
assert.deepEqual(pendingSteps.slice(newQueryStep + 1, newQueryStep + 3), [
  { type: 'expectCount', selector: '.option', count: 0 },
  {
    type: 'expectText',
    selector: '.status',
    text: 'Loading suggestions for "se"',
    match: 'contains'
  }
]);
assert.ok(
  pendingSteps.some((step) => step.type === 'expectValue' && step.value === 'se'),
  'Pending ArrowDown/Enter must not select an option from the previous query'
);

const staleAutocompleteTest = autocompleteTests.get('autocomplete-stale-response-ignored');
assert.ok(staleAutocompleteTest);
assert.ok(
  staleAutocompleteTest.steps.some(
    (step) => step.type === 'expectNoText' && step.text === 'San Francisco'
  ),
  'The slower stale request must be proved unable to overwrite the current results'
);

for (const id of ['autocomplete-outside-pointer-closes', 'autocomplete-pointer-selects-option']) {
  const test = autocompleteTests.get(id);
  assert.ok(test);
  assert.ok(test.steps.some((step) => step.type === 'pointerDown'));
  assert.ok(test.steps.every((step) => step.type !== 'mouseDown'));
}

const ariaAutocompleteTest = autocompleteTests.get('autocomplete-aria-contract');
assert.ok(ariaAutocompleteTest);
assert.ok(
  ariaAutocompleteTest.steps.some(
    (step) => step.selector === 'label[for="autocomplete-query"]' && step.text === 'Search cities'
  )
);
assert.ok(
  ariaAutocompleteTest.steps.some(
    (step) => step.attribute === 'aria-labelledby' && step.expected === 'autocomplete-label'
  )
);

const abortHelpersStart = autocompleteSolutionCode.indexOf('function abortError');
const abortHelpersEnd = autocompleteSolutionCode.indexOf('\nfunction isAbortError', abortHelpersStart);
assert.ok(abortHelpersStart >= 0 && abortHelpersEnd > abortHelpersStart);
const abortHelpers = ts.transpileModule(
  `${autocompleteSolutionCode.slice(abortHelpersStart, abortHelpersEnd)}\nexport { sleep };`,
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true
    },
    reportDiagnostics: true,
    fileName: 'autocomplete-abort-helpers.ts'
  }
);
assert.deepEqual(
  (abortHelpers.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  ),
  [],
  'Autocomplete abort helpers must transpile without syntax errors'
);
const abortModuleUrl = `data:text/javascript;base64,${Buffer.from(abortHelpers.outputText).toString('base64')}`;
const { sleep: abortableSleep } = await import(`${abortModuleUrl}#autocomplete-abort-helpers`);
const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const previousWindow = globalThis.window;
globalThis.window = globalThis;
try {
  const inFlightController = new AbortController();
  const inFlightSleep = abortableSleep(10_000, inFlightController.signal);
  inFlightController.abort();
  await assert.rejects(inFlightSleep, (error) => error?.name === 'AbortError');

  const alreadyAbortedController = new AbortController();
  alreadyAbortedController.abort();
  await assert.rejects(
    abortableSleep(10_000, alreadyAbortedController.signal),
    (error) => error?.name === 'AbortError'
  );
} finally {
  if (hadWindow) globalThis.window = previousWindow;
  else delete globalThis.window;
}

{
  class UncancellableAbortController {
    signal = {
      aborted: false,
      addEventListener() {},
      removeEventListener() {}
    };

    abort() {
      // Deliberately ignored: request identity must still protect the latest query.
    }
  }

  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const harness = createReactHarness(
    autocompleteSolutionCode,
    'react-autocomplete-component.tsx',
    browser,
    {},
    { AbortController: UncancellableAbortController }
  );
  harness.mount();

  let input = findElement(harness.tree, (element) => element.type === 'input');
  assert.ok(input);
  input.props.onChange({ target: { value: 'san' } });
  harness.flush();
  await clock.advanceBy(300);

  input = findElement(harness.tree, (element) => element.type === 'input');
  input.props.onChange({ target: { value: 'se' } });
  assert.equal(harness.state(4), 'se');
  assert.equal(harness.state(5), 'loading');
  assert.deepEqual(Array.from(harness.state(8)), []);

  // Do not flush the query render yet. The old request cannot be cancelled and its
  // effect cleanup has not run, so requestSeqRef is the only active stale-result guard.
  await clock.advanceBy(450);
  assert.equal(harness.state(5), 'loading');
  assert.deepEqual(
    Array.from(harness.state(8)),
    [],
    'An uncancellable late completion must be rejected by request identity before effect cleanup'
  );

  harness.flush();
  await clock.advanceBy(300);
  await clock.advanceBy(80);
  harness.flush();
  assert.equal(harness.state(5), 'success');
  assert.deepEqual(Array.from(harness.state(8)), ['Brussels', 'San Jose', 'Seattle', 'Seoul']);
  assert.doesNotMatch(renderedText(harness.tree), /San Francisco/);
  harness.unmount();
}

const autocompleteDecisionGraph = json(
  'cdn/questions/react/decision-graphs/react-autocomplete-search.v1.json'
);
const autocompleteGraphVariant = autocompleteDecisionGraph.variants.approach1;
assert.match(autocompleteGraphVariant.code, /setResults\(\[\]\)/);
assert.match(autocompleteGraphVariant.code, /new AbortController\(\)/);
assert.match(autocompleteGraphVariant.code, /status === 'success'/);
assert.match(autocompleteGraphVariant.code, /onPointerDown/);
assert.match(autocompleteGraphVariant.code, /aria-labelledby="autocomplete-label"/);
const autocompleteGraphLines = autocompleteGraphVariant.code.split('\n');
for (const node of autocompleteGraphVariant.nodes) {
  const { lineStart, lineEnd, snippet } = node.anchor;
  assert.ok(
    lineStart >= 1 && lineEnd >= lineStart && lineEnd <= autocompleteGraphLines.length,
    `${node.id}: invalid autocomplete anchor range`
  );
  assert.ok(
    autocompleteGraphLines.slice(lineStart - 1, lineEnd).join('\n').includes(snippet),
    `${node.id}: autocomplete anchor range must contain its snippet`
  );
}

const themeQuestion = json('cdn/questions/css/coding.json').find(
  (entry) => entry.id === 'css-theme-variables-dark-mode'
);
assert.ok(themeQuestion);
assert.equal(themeQuestion.updatedAt, '2026-07-14');
const themeContract = JSON.stringify(themeQuestion);
assert.match(themeContract, /:root:where\(\.theme-dark\)/);
assert.match(themeContract, /equal specificity/i);
assert.match(themeContract, /source order/i);
assert.doesNotMatch(themeContract, /html\.theme-dark/);
assert.ok(
  themeQuestion.webSolutionCss.indexOf(':root:where(.theme-dark)')
    > themeQuestion.webSolutionCss.indexOf('@media (prefers-color-scheme: dark)'),
  'Equal-specificity manual theme rule must follow the OS media query'
);

const progressQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-progress-bar-thresholds'
);
assert.ok(progressQuestion);
assert.equal(progressQuestion.updatedAt, '2026-07-14');
assert.equal(progressQuestion.access, 'premium');
assert.equal(progressQuestion.sdk.asset, 'assets/sb/react/question/react-progress-bar-thresholds.v1.json');
assert.equal(progressQuestion.solutionAsset, 'assets/sb/react/solution/react-progress-bar-thresholds-solution.v1.json');
const progressContract = JSON.stringify(progressQuestion);
assert.match(progressContract, /&lt;34/);
assert.match(progressContract, /&gt;66/);

const reactTiming = json('cdn/questions/react/trivia.json').find(
  (entry) => entry.id === 'react-useeffect-vs-uselayouteffect'
);
assert.ok(reactTiming);
assert.equal(reactTiming.updatedAt, '2026-07-14');
const reactTimingContract = JSON.stringify(reactTiming);
assert.match(reactTimingContract, /generally run after paint for non-interaction updates/i);
assert.match(reactTimingContract, /interaction-caused effect before paint/i);
assert.match(reactTimingContract, /does not provide a pre-paint guarantee/i);
assert.doesNotMatch(reactTimingContract, /useEffect runs after paint and is non-blocking/i);

const vueWatch = json('cdn/questions/vue/trivia.json').find(
  (entry) => entry.id === 'vue-watch-vs-watcheffect-differences-infinite-loops'
);
assert.ok(vueWatch);
assert.equal(vueWatch.updatedAt, '2026-07-14');
const vueWatchContract = JSON.stringify(vueWatch);
assert.match(vueWatchContract, /watch\(count, \(\) =>/);
assert.match(vueWatchContract, /direct synchronous.*watchEffect.*suppressed/i);
assert.doesNotMatch(vueWatchContract, /\/\/ ❌ Infinite loop\\nwatchEffect/);

const vueRuntimeSource = read('frontend/src/assets/vendor/vue/vue.global.prod.js');
const vueContext = vm.createContext({
  console,
  setTimeout,
  clearTimeout,
  queueMicrotask,
  performance: { now: () => 0 }
});
vm.runInContext(vueRuntimeSource, vueContext, {
  filename: 'frontend/src/assets/vendor/vue/vue.global.prod.js'
});
const { ref, watch, watchEffect, version: vueVersion } = vueContext.Vue;
assert.match(vueVersion, /^3\./, 'The checked-in Vue 3 runtime must load in the VM');

const effectCount = ref(0);
let effectRuns = 0;
const stopEffect = watchEffect(() => {
  effectRuns += 1;
  effectCount.value += 1;
}, { flush: 'sync' });
assert.equal(effectRuns, 1, 'A direct synchronous watchEffect self-mutation is self-trigger-suppressed');
assert.equal(effectCount.value, 1);
stopEffect();

const watchedCount = ref(0);
let watchRuns = 0;
const stopWatch = watch(watchedCount, () => {
  watchRuns += 1;
  if (watchedCount.value < 4) watchedCount.value += 1;
}, { flush: 'sync' });
watchedCount.value += 1;
assert.equal(watchRuns, 4, 'A watch callback can recursively trigger itself when it mutates its source');
assert.equal(watchedCount.value, 4, 'The explicit guard must bound the recursion deterministically');
stopWatch();

const angularForms = json('cdn/questions/angular/trivia.json').find(
  (entry) => entry.id === 'angular-template-driven-vs-reactive-forms-which-scales'
);
assert.ok(angularForms);
assert.equal(angularForms.updatedAt, '2026-07-14');
const angularFormsContract = JSON.stringify(angularForms);
assert.match(angularFormsContract, /Signal Forms are stable|stable Signal Forms/i);
assert.match(angularFormsContract, /production option/i);
assert.doesNotMatch(angularFormsContract, /Signal Forms[^.]{0,80}experimental/i);
const angularPrepGuide = read(
  'frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts'
);
assert.match(
  angularPrepGuide,
  /Compare template-driven, Reactive Forms, and stable Signal Forms, then choose one for a concrete Angular 22 form\./
);

const imageLinkTrivia = json('cdn/questions/html/trivia.json').find(
  (entry) => entry.id === 'html-clickable-image'
);
const imageLinkCoding = json('cdn/questions/html/coding.json').find(
  (entry) => entry.id === 'html-links-and-images'
);
for (const [label, question] of [
  ['HTML clickable-image trivia', imageLinkTrivia],
  ['HTML links-and-images coding', imageLinkCoding]
]) {
  assert.ok(question, `${label} must exist`);
  assert.equal(question.updatedAt, '2026-07-14');
  assert.equal(question.access, 'free');
  const contract = JSON.stringify(question);
  assert.match(contract, /anchor without href is not a hyperlink/i);
  assert.match(contract, /<a (?:href=|href\\=)/i);
}
const interviewHubSource = read(
  'frontend/src/app/features/interview-questions/interview-questions-landing.component.ts'
);
assert.match(interviewHubSource, /<a href="\/pricing"><img alt="arrow"><\/a>/);
assert.match(interviewHubSource, /anchor without href is not a hyperlink/i);
assert.doesNotMatch(interviewHubSource, /<a><img alt="arrow"><\/a>/);

console.log('Framework content regressions: PASS');
console.log('Legacy RIGHT -> UP -> LEFT reproduction: pending direction became LEFT');
console.log(`Vue ${vueVersion} watcher semantics: watchEffect=1 run, bounded watch=4 runs`);
