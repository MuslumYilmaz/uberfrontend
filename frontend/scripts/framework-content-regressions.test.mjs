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

function assertMirror(relative, label = relative) {
  const cdnPath = `cdn/${relative}`;
  const fallbackPath = `frontend/src/assets/${relative}`;
  assert.ok(fs.existsSync(path.join(repoRoot, cdnPath)), `${label}: missing canonical CDN asset ${cdnPath}`);
  assert.ok(fs.existsSync(path.join(repoRoot, fallbackPath)), `${label}: missing frontend fallback asset ${fallbackPath}`);
  const cdn = read(cdnPath);
  const fallback = read(fallbackPath);
  assert.equal(fallback, cdn, `${label}: frontend fallback drifted from CDN (${relative})`);
}

function normalizedAssetFiles(asset, label) {
  const files = {};
  for (const [pathRaw, value] of Object.entries(asset?.files ?? {})) {
    const normalizedPath = String(pathRaw).replace(/^\/+/, '');
    const source = typeof value === 'string' ? value : value?.code;
    assert.equal(
      typeof source,
      'string',
      `${label}: ${normalizedPath} must contain string source`
    );
    files[normalizedPath] = source;
  }
  return files;
}

const frameworkStarterTaskMarker =
  /\b(?:TODO|FIXME|BUG)\b|\bImplement in the solution\b|\bNot implemented\b|throw new Error\s*\(/i;

function assertFrameworkStarterCorpus() {
  const assetOwners = new Map();

  for (const technology of ['react', 'angular', 'vue']) {
    const questions = json(`cdn/questions/${technology}/coding.json`);

    for (const question of questions) {
      const starterReference = question.sdk?.asset;
      const solutionReference = question.solutionAsset;
      const questionLabel = `${technology}:${question.id}`;

      assert.equal(
        typeof starterReference,
        'string',
        `${questionLabel}: missing sdk.asset starter reference`
      );
      assert.equal(
        typeof solutionReference,
        'string',
        `${questionLabel}: missing solutionAsset reference`
      );
      assert.match(
        starterReference,
        new RegExp(`^assets/sb/${technology}/question/.+\\.json$`),
        `${questionLabel}: starter must reference assets/sb/${technology}/question/*.json`
      );
      assert.match(
        solutionReference,
        new RegExp(`^assets/sb/${technology}/solution/.+\\.json$`),
        `${questionLabel}: solution must reference assets/sb/${technology}/solution/*.json`
      );
      assert.notEqual(
        starterReference,
        solutionReference,
        `${questionLabel}: starter and solution references must be distinct`
      );

      for (const [kind, reference] of [
        ['starter', starterReference],
        ['solution', solutionReference],
      ]) {
        const previousOwner = assetOwners.get(reference);
        assert.equal(
          previousOwner,
          undefined,
          `${questionLabel}: ${kind} asset ${reference} is already owned by ${previousOwner}`
        );
        assetOwners.set(reference, `${questionLabel}:${kind}`);
      }

      const starterRelative = starterReference.replace(/^assets\//, '');
      const solutionRelative = solutionReference.replace(/^assets\//, '');
      assertMirror(starterRelative, `${questionLabel}:starter`);
      assertMirror(solutionRelative, `${questionLabel}:solution`);

      const starterFiles = normalizedAssetFiles(
        json(`cdn/${starterRelative}`),
        `${questionLabel}:starter`
      );
      const solutionFiles = normalizedAssetFiles(
        json(`cdn/${solutionRelative}`),
        `${questionLabel}:solution`
      );
      const sourcePaths = [...new Set([
        ...Object.keys(starterFiles),
        ...Object.keys(solutionFiles),
      ])]
        .filter((file) => file.startsWith('src/'))
        .sort();

      assert.ok(
        sourcePaths.length > 0,
        `${questionLabel}: starter and solution assets must contain src/ files`
      );

      const differingSourcePaths = sourcePaths.filter(
        (file) => starterFiles[file] !== solutionFiles[file]
      );
      assert.ok(
        differingSourcePaths.length > 0,
        `${questionLabel}: starter ${starterReference} exposes the canonical solution; at least one src/ file must differ`
      );

      const starterSource = Object.entries(starterFiles)
        .filter(([file]) => file.startsWith('src/'))
        .map(([file, source]) => `${file}\n${source}`)
        .join('\n');
      assert.match(
        starterSource,
        frameworkStarterTaskMarker,
        `${questionLabel}: starter ${starterReference} must contain an explicit TODO/FIXME/BUG or equivalent task placeholder`
      );
    }
  }

  for (const relative of [
    'sb/vue/question/vue-todo-list.v1.json',
    'sb/vue/question/vue-todo-list.v2.json',
  ]) {
    assertMirror(relative, `vue:vue-todo-list:${relative}`);
  }
  assert.equal(
    read('cdn/sb/vue/question/vue-todo-list.v1.json'),
    read('cdn/sb/vue/question/vue-todo-list.v2.json'),
    'vue:vue-todo-list: legacy v1 and current v2 starter copies must stay synchronized'
  );
}

const deprecatedAngularControlFlow =
  /\*ng(?:If|For|SwitchCase|SwitchDefault)\b|\[(?:ngIf|ngForOf|ngSwitch)\]|\bng(?:If|For(?:Of)?|Switch(?:Case|Default)?)\b|\bNgIf\b|\bNgFor(?:Of)?\b|\bNgSwitch(?:Case|Default)?\b|\bng-(?:if|for|switch)\b/;
const malformedAngularControlFlow = /[A-Za-z]@(?:if|for|switch)/;
const angularLegacyMigrationAllowlist = new Set();
const angularIndexTrackAllowlist = new Set([
  'sb/angular/question/angular-nested-checkboxes.v1.json',
  'sb/angular/question/angular-tictactoe.v1.json',
  'sb/angular/solution/angular-tictactoe-solution.v1.json'
]);

function referencedAngularAsset(question, assetReference) {
  assert.match(
    assetReference,
    /^assets\/sb\/angular\/(?:question|solution)\/.+\.json$/,
    `${question.id}: invalid Angular sandbox asset reference`
  );
  return assetReference.replace(/^assets\//, '');
}

function parseAngularTemplate(template, label) {
  const parsed = parseTemplate(template, label);
  assert.deepEqual(
    parsed.errors,
    null,
    `${label}: Angular template must parse (${parsed.errors?.map((error) => error.msg).join('; ')})`
  );
}

function inlineAngularTemplates(source) {
  const templates = [];
  const pattern = /\btemplate\s*:\s*`([\s\S]*?)`/g;
  let match;
  while ((match = pattern.exec(source)) !== null) templates.push(match[1]);
  return templates;
}

function assertModernAngularCodingCorpus() {
  assert.equal(
    angularLegacyMigrationAllowlist.size,
    0,
    'The modern Angular corpus must start with an empty legacy-migration allowlist'
  );

  const questions = json('cdn/questions/angular/coding.json');
  const referencedAssets = new Set();

  for (const question of questions) {
    const legacyAllowed =
      question.legacyMigration === true && angularLegacyMigrationAllowlist.has(question.id);
    if (!legacyAllowed) {
      assert.doesNotMatch(
        JSON.stringify(question),
        deprecatedAngularControlFlow,
        `${question.id}: modern Angular prompt content must not teach deprecated structural directives`
      );
      assert.doesNotMatch(
        JSON.stringify(question),
        malformedAngularControlFlow,
        `${question.id}: control-flow migration must not corrupt surrounding prose`
      );
    }

    for (const [approachIndex, approach] of (question.solutionBlock?.approaches ?? []).entries()) {
      if (!approach.codeTs) continue;
      for (const [templateIndex, template] of inlineAngularTemplates(approach.codeTs).entries()) {
        parseAngularTemplate(
          template,
          `cdn/questions/angular/coding.json#${question.id}.approaches[${approachIndex}].template[${templateIndex}]`
        );
      }
    }

    for (const reference of [question.sdk?.asset, question.solutionAsset].filter(Boolean)) {
      const relative = referencedAngularAsset(question, reference);
      referencedAssets.add(relative);
      assertMirror(relative);
      const asset = json(`cdn/${relative}`);
      const serialized = JSON.stringify(asset);

      if (!legacyAllowed) {
        assert.doesNotMatch(
          serialized,
          deprecatedAngularControlFlow,
          `${relative}: modern Angular asset must not use deprecated structural directives`
        );
        assert.doesNotMatch(
          serialized,
          malformedAngularControlFlow,
          `${relative}: control-flow migration must not corrupt surrounding text`
        );
      }
      if (serialized.includes('track $index')) {
        assert.ok(
          angularIndexTrackAllowlist.has(relative),
          `${relative}: $index tracking is reserved for fixed primitive collections`
        );
      }

      for (const [file, value] of Object.entries(asset.files ?? {})) {
        const source = typeof value === 'string' ? value : value.code;
        if (file.endsWith('.html') && file !== '/src/index.html') {
          parseAngularTemplate(source, `${relative}${file}`);
        }
        if (file.endsWith('.ts')) {
          for (const [templateIndex, template] of inlineAngularTemplates(source).entries()) {
            parseAngularTemplate(template, `${relative}${file}#template-${templateIndex}`);
          }
        }
      }
    }
  }

  assert.equal(
    referencedAssets.size,
    questions.length * 2,
    'Every Angular coding prompt must own distinct starter and solution assets'
  );
}

function assertCounterPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-counter',
      starter: 'assets/sb/react/question/react-counter.v1.json',
      solution: 'assets/sb/react/solution/react-counter-solution.v1.json',
    },
    angular: {
      id: 'angular-counter-starter',
      starter: 'assets/sb/angular/question/angular-counter.v2.json',
      solution: 'assets/sb/angular/solution/angular-counter-solution.v2.json',
    },
    vue: {
      id: 'vue-counter',
      starter: 'assets/sb/vue/question/vue-counter.v1.json',
      solution: 'assets/sb/vue/solution/vue-counter-solution.v1.json',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Counter question must exist`);
    assert.equal(question.sdk?.asset, expected.starter, `${framework}: normal Counter starter changed`);
    assert.equal(question.solutionAsset, expected.solution, `${framework}: normal Counter solution changed`);
    assert.deepEqual(
      (question.frameworkTests ?? []).map((test) => test.id),
      ['counter-basic-flow'],
      `${framework}: normal Counter checks must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/counter.v1.json',
      `${framework}: Counter must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(pressureRefs.size, 1, 'All Counter frameworks must share one pressure scenario');
  const scenario = json('cdn/questions/pressure-modes/counter.v1.json');
  assert.equal(scenario.id, 'counter-pressure-v1');
  assert.equal(scenario.access, 'free');
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-counter',
    angular: 'angular-counter-starter',
    vue: 'vue-counter',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    ['base-correctness', 'configurable-step', 'keyboard-accessibility', 'auto-lifecycle']
  );
  const pressureCheckCount = scenario.rounds.reduce(
    (total, round) => total + (round.frameworkTests?.length ?? 0),
    0
  );
  assert.equal(pressureCheckCount, 5, 'Counter pressure mode must stay within the six-check runner budget');
  assert.ok(
    scenario.rounds
      .flatMap((round) => round.frameworkTests ?? [])
      .flatMap((test) => test.steps ?? [])
      .some((step) => step.type === 'expectNoPreviewTimers'),
    'Counter pressure lifecycle must assert that component teardown clears its interval'
  );

  const solutionMarkers = {
    react: [/useEffect/, /clearInterval/, /aria-live/],
    angular: [/implements OnDestroy/, /clearInterval/, /aria-live/],
    vue: [/onUnmounted/, /clearInterval/, /aria-live/],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.match(
      reference,
      new RegExp(`^assets/sb/${framework}/solution/.+\\.json$`),
      `${framework}: invalid pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:counter-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:counter-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of solutionMarkers[framework]) {
      assert.match(source, marker, `${framework}: pressure solution is missing ${marker}`);
    }
  }

  for (const builder of [
    'frontend/src/app/core/utils/react-preview-builder.ts',
    'frontend/src/app/core/utils/angular-preview-builder.ts',
    'frontend/src/app/core/utils/vue-preview-builder.ts',
  ]) {
    const source = read(builder);
    assert.match(source, /__FA_UNMOUNT_PREVIEW/, `${builder}: missing preview teardown hook`);
    assert.match(source, /__FA_GET_PREVIEW_LEAKS/, `${builder}: missing preview leak instrumentation`);
    assert.match(source, /__FA_MARK_PREVIEW_TIMER_BASELINE/, `${builder}: missing timer baseline hook`);
    assert.match(source, /__FA_GET_PREVIEW_TIMER_LEAKS/, `${builder}: missing scoped timer leak hook`);
    assert.match(source, /setInterval/, `${builder}: interval leaks must be instrumented`);
  }
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
  assert.equal(question.updatedAt, technology === 'angular' ? '2026-07-15' : '2026-07-14');
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
assert.equal(strictEffectQuestion.updatedAt, '2026-07-15');
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

assertFrameworkStarterCorpus();
assertModernAngularCodingCorpus();
assertCounterPressureMode();

const angularCodingQuestions = json('cdn/questions/angular/coding.json');
const nestedCheckboxStarter = json('cdn/sb/angular/question/angular-nested-checkboxes.v1.json');
const nestedCheckboxTemplate = fileCode(nestedCheckboxStarter, '/src/app/app.component.html');
assert.match(
  nestedCheckboxTemplate,
  /@for \(child of children; track \$index; let i = \$index\)/,
  'angular-nested-checkboxes: the fixed boolean collection must declare the index used by its controls'
);
assert.doesNotMatch(
  nestedCheckboxTemplate,
  /track child\.label/,
  'angular-nested-checkboxes: boolean children do not have a label identity'
);
const modernizedAngularIds = [
  'angular-contact-form-starter',
  'angular-todo-list-starter',
  'angular-image-slider-starter',
  'angular-tabs-switcher',
  'angular-filterable-user-list',
  'angular-faq-accordion',
  'angular-pagination-table',
  'angular-multi-step-form-starter',
  'angular-shopping-cart-mini',
  'angular-debounced-search',
  'angular-star-rating',
  'angular-dynamic-table-starter',
  'angular-nested-checkboxes',
  'angular-autocomplete-search-starter',
  'angular-transfer-list',
  'angular-tictactoe-starter',
  'angular-nested-comments',
  'angular-dynamic-counter-buttons',
  'angular-chips-input-autocomplete',
  'angular-chessboard-click-highlight',
  'angular-snake-game'
];
for (const id of modernizedAngularIds) {
  const question = angularCodingQuestions.find((entry) => entry.id === id);
  assert.ok(question, `Missing modernized Angular question ${id}`);
  assert.equal(question.updatedAt, '2026-07-15', `${id}: stale Angular update date`);
}
for (const id of [
  'angular-image-slider-starter',
  'angular-tabs-switcher',
  'angular-filterable-user-list',
  'angular-faq-accordion',
  'angular-pagination-table',
  'angular-multi-step-form-starter',
  'angular-shopping-cart-mini',
  'angular-star-rating',
  'angular-dynamic-table-starter',
  'angular-transfer-list',
  'angular-tictactoe-starter',
  'angular-dynamic-counter-buttons',
  'angular-chessboard-click-highlight'
]) {
  assert.ok(
    angularCodingQuestions.find((entry) => entry.id === id)?.tags.includes('control-flow'),
    `${id}: modern control-flow content must carry the control-flow tag`
  );
}

for (const relative of [
  'sb/angular/question/angular-todo-list.v2.json',
  'sb/angular/solution/angular-todo-list-solution.v2.json'
]) {
  const asset = json(`cdn/${relative}`);
  const template = fileCode(asset, '/src/app/app.component.html');
  const component = fileCode(asset, '/src/app/app.component.ts');
  assert.match(template, /@for \(todo of todos; track todo\.id\)/);
  assert.match(template, /@if \(hasTodos\)/);
  assert.doesNotMatch(template, deprecatedAngularControlFlow);
  assert.doesNotMatch(component, /CommonModule|trackById/);
}

const todoQuestion = angularCodingQuestions.find(
  (entry) => entry.id === 'angular-todo-list-starter'
);
assert.ok(todoQuestion);
assert.equal(todoQuestion.access, 'free');
assert.equal(todoQuestion.sdk.asset, 'assets/sb/angular/question/angular-todo-list.v2.json');
assert.equal(todoQuestion.solutionAsset, 'assets/sb/angular/solution/angular-todo-list-solution.v2.json');
assert.equal(todoQuestion.updatedAt, '2026-07-15');
const todoContract = JSON.stringify(todoQuestion);
assert.match(todoContract, /@for \(todo of todos; track todo\.id\)/);
assert.doesNotMatch(todoContract, deprecatedAngularControlFlow);
const foundationsTrackPreview = read(
  'frontend/src/app/features/tracks/track-preview/track-preview.component.ts'
);
assert.match(foundationsTrackPreview, /Todo List \(Standalone Component with @for\)/);
assert.doesNotMatch(foundationsTrackPreview, /Todo List \(Standalone Component with ngFor\)/);

const tabsQuestion = angularCodingQuestions.find((entry) => entry.id === 'angular-tabs-switcher');
assert.ok(tabsQuestion);
assert.equal(tabsQuestion.sdk.storageKey, 'v2:ui:angular:angular-tabs-starter');
assert.equal(tabsQuestion.access, 'premium');
assert.ok(tabsQuestion.tags.includes('control-flow'));
assert.deepEqual(tabsQuestion.premiumPreview, {
  summary: 'Build an accessible Angular tab switcher driven by a single active-tab state. Use modern template control flow so exactly one panel is rendered as the selection changes.',
  learningOutcomes: [
    'Model the selected tab with one typed active-state value.',
    'Render the active panel with Angular @if control flow.',
    'Keep exactly one content panel visible after every tab change.',
    'Connect accessible tab controls to active styling and labelled panels.'
  ],
  unlockDescription: 'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.'
});
const tabsPanelCounts = tabsQuestion.frameworkTests[0].steps.filter(
  (step) => step.type === 'expectCount' && step.selector === '.panel' && step.count === 1
);
assert.equal(tabsPanelCounts.length, 3, 'Tabs must assert exactly one panel initially and after both tab changes');
for (const relative of [
  'sb/angular/question/angular-tabs.v2.json',
  'sb/angular/solution/angular-tabs-solution.v2.json'
]) {
  const asset = json(`cdn/${relative}`);
  const component = fileCode(asset, '/src/app/app.component.ts');
  const template = fileCode(asset, '/src/app/app.component.html');
  assert.doesNotMatch(component, /CommonModule/);
  assert.match(template, /@if \(isActive\('overview'\)\)/);
  assert.match(template, /role="tablist"/);
  assert.match(template, /role="tabpanel"/);
  assert.doesNotMatch(template, /placeholders/i);
}

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
  staleAutocompleteTest.steps
    .filter((step) => step.text === 'Seattle')
    .every((step) => step.selector === '#autocomplete-option-seattle'),
  'Stale-response checks must target the stable Seattle option instead of the first matching option'
);
assert.ok(
  staleAutocompleteTest.steps.some(
    (step) => step.type === 'expectNoText' && step.text === 'San Francisco'
  ),
  'The slower stale request must be proved unable to overwrite the current results'
);
assert.ok(
  pendingSteps.some(
    (step) => step.text === 'Seattle' && step.selector === '#autocomplete-option-seattle'
  ),
  'Pending-query checks must wait for the stable Seattle option'
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
