import localForage from 'localforage';
import { draftIndexKey, upsertDraftIndexVersion } from '../utils/versioned-drafts.util';
import { CodeStorageService } from './code-storage.service';

describe('CodeStorageService JS save guards', () => {
  let service: CodeStorageService;
  const qid = 'spec-js-empty-guard';

  beforeEach(async () => {
    service = new CodeStorageService();
    await service.clearJsAsync(qid);
  });

  afterEach(async () => {
    await service.clearJsAsync(qid);
  });

  it('keeps existing non-empty JS code when an empty save is not explicitly allowed', async () => {
    await service.saveJsAsync(qid, 'const value = 1;', 'js', { force: true });

    await service.saveJsAsync(qid, '', 'js');

    expect(await service.getJsForLangAsync(qid, 'js')).toBe('const value = 1;');
  });

  it('persists empty JS code when the caller marks it as user-allowed', async () => {
    await service.saveJsAsync(qid, 'const value = 1;', 'js', { force: true });

    await service.saveJsAsync(qid, '', 'js', { allowEmpty: true });

    expect(await service.getJsForLangAsync(qid, 'js')).toBe('');
  });

  for (const lang of ['js', 'ts'] as const) {
    it(`restores explicitly blank ${lang} drafts after baseline refresh and service recreation`, async () => {
      await service.setJsBaselineAsync(qid, lang, 'const starter = true;');
      await service.saveJsAsync(qid, '', lang, { allowEmpty: true });

      const restoredService = new CodeStorageService();
      await restoredService.setJsBaselineAsync(qid, lang, 'const starter = true;');
      expect(await restoredService.getJsLangStateAsync(qid, lang)).toEqual({
        code: '', baseline: 'const starter = true;', dirty: true, hasUserCode: true,
      });
      expect(await restoredService.initJsAsync(qid, lang, 'const starter = true;')).toEqual({
        initial: '', restored: true,
      });

      await restoredService.resetJsBothAsync(qid);
      expect(await restoredService.getJsLangStateAsync(qid, lang)).toEqual({
        code: 'const starter = true;', baseline: 'const starter = true;', dirty: false, hasUserCode: true,
      });
    });
  }

  it('preserves explicitly whitespace-only JS edits when refreshing a baseline', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const starter = true;');
    await service.saveJsAsync(qid, ' \n', 'js', { allowEmpty: true });
    await service.setJsBaselineAsync(qid, 'js', 'const updatedStarter = true;');

    expect(await service.getJsLangStateAsync(qid, 'js')).toEqual({
      code: ' \n', baseline: 'const updatedStarter = true;', dirty: true, hasUserCode: true,
    });
  });

  it('does not treat a fresh JS baseline as user code', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const starter = true;');

    const state = await service.getJsLangStateAsync(qid, 'js');

    expect(state.code).toBe('');
    expect(state.baseline).toBe('const starter = true;');
    expect(state.hasUserCode).toBeFalse();
    expect(state.dirty).toBeFalse();
  });

  it('heals old JS code records that only mirror the previous baseline', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const oldStarter = true;');
    await service.saveJsAsync(qid, 'const oldStarter = true;', 'js', { force: true });

    await service.setJsBaselineAsync(qid, 'js', 'const newStarter = true;');

    const state = await service.getJsLangStateAsync(qid, 'js');
    expect(state.code).toBe('');
    expect(state.baseline).toBe('const newStarter = true;');
    expect(state.hasUserCode).toBeFalse();
    expect(state.dirty).toBeFalse();
  });

  it('stores a user edit that returns to the starter instead of keeping the diverged draft', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const starter = true;');
    await service.saveJsAsync(qid, 'const diverged = true;', 'js', { allowEmpty: true });

    await service.saveJsAsync(qid, 'const starter = true;', 'js', { allowEmpty: true });

    const state = await service.getJsLangStateAsync(qid, 'js');
    expect(state.dirty).toBeFalse();
    expect(await service.getJsForLangAsync(qid, 'js')).not.toBe('const diverged = true;');
  });

  it('keeps diverged JS code when a plain programmatic save carries the baseline', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const starter = true;');
    await service.saveJsAsync(qid, 'const diverged = true;', 'js', { allowEmpty: true });

    await service.saveJsAsync(qid, 'const starter = true;', 'js');

    expect(await service.getJsForLangAsync(qid, 'js')).toBe('const diverged = true;');
  });

  it('preserves dirty JS user code when the baseline refreshes', async () => {
    await service.setJsBaselineAsync(qid, 'js', 'const oldStarter = true;');
    await service.saveJsAsync(qid, 'const userCode = true;', 'js', { force: true });

    await service.setJsBaselineAsync(qid, 'js', 'const newStarter = true;');

    const state = await service.getJsLangStateAsync(qid, 'js');
    expect(state.code).toBe('const userCode = true;');
    expect(state.baseline).toBe('const newStarter = true;');
    expect(state.hasUserCode).toBeTrue();
    expect(state.dirty).toBeTrue();
  });
});

describe('CodeStorageService web save guards', () => {
  let service: CodeStorageService;
  const qid = 'spec-web-empty-guard';

  beforeEach(async () => {
    service = new CodeStorageService();
    await service.clearWebAsync(qid);
  });

  afterEach(async () => {
    await service.clearWebAsync(qid);
  });

  it('persists empty web code when the caller marks it as user-allowed', async () => {
    await service.saveWebAsync(qid, 'html', '<main>Draft</main>', { force: true });

    await service.saveWebAsync(qid, 'html', '', { allowEmpty: true });

    const snapshot = await service.getWebDraftSnapshotAsync(qid);
    expect(snapshot?.html.code).toBe('');
  });

  it('keeps initial and legacy baseline-only web records distinct from deliberately cleared HTML/CSS', async () => {
    const starters = { html: '<main>Starter</main>', css: 'main { color: white; }' };
    expect(await service.initWebAsync(qid, starters)).toEqual({ ...starters, restored: false });
    expect(await new CodeStorageService().initWebAsync(qid, starters)).toEqual({ ...starters, restored: false });

    await Promise.all([
      service.saveWebAsync(qid, 'html', '', { allowEmpty: true }),
      service.saveWebAsync(qid, 'css', '', { allowEmpty: true }),
    ]);
    const restoredService = new CodeStorageService();
    expect(await restoredService.initWebAsync(qid, starters)).toEqual({ html: '', css: '', restored: true });

    await restoredService.resetWebBothAsync(qid, starters);
    expect(await new CodeStorageService().initWebAsync(qid, starters)).toEqual({ ...starters, restored: false });
  });

  it('stores a web edit that returns to the starter instead of keeping the diverged draft', async () => {
    const starters = { html: '<main>Starter</main>', css: 'main { color: white; }' };
    await service.initWebAsync(qid, starters);
    await service.saveWebAsync(qid, 'html', '<main>Diverged</main>', { allowEmpty: true });

    await service.saveWebAsync(qid, 'html', starters.html, { allowEmpty: true });

    expect((await new CodeStorageService().initWebAsync(qid, starters)).html).toBe(starters.html);
  });

  it('retains the web guard against accidental empty saves', async () => {
    await service.saveWebAsync(qid, 'html', '<main>Draft</main>', { force: true });
    await service.saveWebAsync(qid, 'html', '');
    expect((await service.initWebAsync(qid, { html: '<p>Starter</p>', css: '' })).html).toBe('<main>Draft</main>');
  });
});

describe('CodeStorageService framework save guards', () => {
  let service: CodeStorageService;
  const qid = 'spec-framework-empty-guard';
  const tech = 'react';
  const path = 'src/App.tsx';
  const starters = {
    [path]: 'export default function App() { return <div>Starter</div>; }',
    'src/App.css': '.starter { color: white; }',
  };

  beforeEach(async () => {
    service = new CodeStorageService();
    await service.clearFrameworkAsync(tech, qid);
  });

  afterEach(async () => {
    await service.clearFrameworkAsync(tech, qid);
  });

  it('initializes a fresh framework workspace from starter baselines only', async () => {
    const initial = await service.initFrameworkAsync(qid, tech, starters, path);

    expect(initial).toEqual({
      files: starters,
      entryFile: path,
      restored: false,
    });

    const snapshot = await service.getFrameworkDraftSnapshotAsync(tech, qid);
    expect(snapshot?.files[path]).toEqual({
      code: '',
      baseline: starters[path],
    });
  });

  it('stores a framework edit that returns to the starter instead of keeping the diverged draft', async () => {
    await service.initFrameworkAsync(qid, tech, starters, path);
    const diverged = 'export default function App() { return <div>Diverged</div>; }';
    await service.saveFrameworkFileAsync(qid, tech, path, diverged, { allowEmpty: true });

    await service.saveFrameworkFileAsync(qid, tech, path, starters[path], { allowEmpty: true });

    const restored = await new CodeStorageService().initFrameworkAsync(qid, tech, starters, path);
    expect(restored.files[path]).toBe(starters[path]);
  });

  it('prefers saved framework user code over the starter baseline', async () => {
    await service.initFrameworkAsync(qid, tech, starters, path);
    const userCode = 'export default function App() { return <div>User draft</div>; }';
    await service.saveFrameworkFileAsync(qid, tech, path, userCode, { force: true });

    const restored = await service.initFrameworkAsync(qid, tech, starters, path);

    expect(restored.files[path]).toBe(userCode);
    expect(restored.files['src/App.css']).toBe(starters['src/App.css']);
    expect(restored.entryFile).toBe(path);
    expect(restored.restored).toBeTrue();
  });

  it('preserves whitespace-only framework drafts saved before the explicit-empty marker existed', async () => {
    await localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_ng' }).setItem(`v2:code:fw2:${tech}:${qid}`, JSON.stringify({
      files: { [path]: { code: ' \n\t', baseline: starters[path] } },
      entryFile: path,
      version: 'v2',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));

    expect(await new CodeStorageService().initFrameworkAsync(qid, tech, starters, path)).toEqual({
      files: { ...starters, [path]: ' \n\t' }, entryFile: path, restored: true,
    });
  });

  it('keeps existing non-empty framework code when an empty save is not explicitly allowed', async () => {
    await service.saveFrameworkFileAsync(qid, tech, path, 'export default function App() {}', { force: true });

    await service.saveFrameworkFileAsync(qid, tech, path, '');

    const snapshot = await service.getFrameworkDraftSnapshotAsync(tech, qid);
    expect(snapshot?.files[path]?.code).toBe('export default function App() {}');
  });

  it('persists empty framework code when the caller marks it as user-allowed', async () => {
    await service.saveFrameworkFileAsync(qid, tech, path, 'export default function App() {}', { force: true });

    await service.saveFrameworkFileAsync(qid, tech, path, '', { allowEmpty: true });

    const snapshot = await service.getFrameworkDraftSnapshotAsync(tech, qid);
    expect(snapshot?.files[path]?.code).toBe('');
  });

  it('restores a cleared framework entry without falling back to its starter or another file', async () => {
    const reorderedStarters = { 'src/App.css': starters['src/App.css'], [path]: starters[path] };
    await service.initFrameworkAsync(qid, tech, reorderedStarters, path);
    expect(await new CodeStorageService().initFrameworkAsync(qid, tech, reorderedStarters, path)).toEqual({
      files: reorderedStarters, entryFile: path, restored: false,
    });
    await service.saveFrameworkFileAsync(qid, tech, path, '', { allowEmpty: true });

    const restoredService = new CodeStorageService();
    expect(await restoredService.initFrameworkAsync(qid, tech, reorderedStarters, path)).toEqual({
      files: { ...reorderedStarters, [path]: '' }, entryFile: path, restored: true,
    });
    await restoredService.resetFrameworkAsync(qid, tech, reorderedStarters, path);
    expect(await new CodeStorageService().initFrameworkAsync(qid, tech, reorderedStarters, path)).toEqual({
      files: reorderedStarters, entryFile: path, restored: false,
    });
  });
});

describe('CodeStorageService blank draft archives', () => {
  const source = 'spec-cleared-draft@v1';
  const archived = 'spec-cleared-draft@archived';
  let service: CodeStorageService;

  async function clearDrafts() {
    for (const key of [source, archived]) {
      await service.clearJsAsync(key);
      await service.clearWebAsync(key);
      await service.clearFrameworkAsync('react', key);
    }
  }

  beforeEach(async () => {
    service = new CodeStorageService();
    await clearDrafts();
  });
  afterEach(clearDrafts);

  it('preserves explicit empty edits when versioned bundles are archived and read without cache', async () => {
    await service.setJsBaselineAsync(source, 'js', 'const starter = true;');
    await service.saveJsAsync(source, '', 'js', { allowEmpty: true });
    await service.initWebAsync(source, { html: '<main>Starter</main>', css: 'main {}' });
    await service.saveWebAsync(source, 'html', '', { allowEmpty: true });
    await service.initFrameworkAsync(source, 'react', { 'src/App.tsx': 'export default function App() {}' });
    await service.saveFrameworkFileAsync(source, 'react', 'src/App.tsx', '', { allowEmpty: true });

    await service.cloneJsBundleAsync(source, archived);
    await service.cloneWebBundleAsync(source, archived);
    await service.cloneFrameworkBundleAsync('react', source, archived);

    const restoredService = new CodeStorageService();
    expect((await restoredService.initJsAsync(archived, 'js', 'const starter = true;')).initial).toBe('');
    expect((await restoredService.initWebAsync(archived, { html: '<main>Starter</main>', css: 'main {}' })).html).toBe('');
    expect((await restoredService.initFrameworkAsync(archived, 'react', { 'src/App.tsx': 'export default function App() {}' })).files['src/App.tsx']).toBe('');
  });
});

describe('CodeStorageService edited drafts', () => {
  const ids = ['spec-progress-js', 'spec-progress-web', 'spec-progress-react', 'spec-progress-untouched', 'spec-progress-back'];
  const rehearsal = 'rehearsal:spec:spec-progress-js@v1';
  let service: CodeStorageService;

  async function clearDrafts() {
    for (const id of ids) {
      for (const version of ['v1', 'v2']) {
        await service.clearJsAsync(`${id}@${version}`);
        await service.clearWebAsync(`${id}@${version}`);
        await service.clearFrameworkAsync('react', `${id}@${version}`);
      }
      localStorage.removeItem(draftIndexKey(id));
    }
    await service.clearJsAsync(rehearsal);
  }

  const listed = async () => (await service.listEditedDraftsAsync())
    .filter((draft) => draft.questionId.startsWith('spec-progress-'));

  beforeEach(async () => {
    service = new CodeStorageService();
    await clearDrafts();
  });
  afterEach(clearDrafts);

  it('lists each task whose draft differs from its starter, newest edit first, and no rehearsal or untouched draft', async () => {
    await service.setJsBaselineAsync('spec-progress-js@v1', 'js', 'export default function f() {}');
    await service.saveJsAsync('spec-progress-js@v1', 'export default function f() { return 1; }', 'js');
    await service.setJsBaselineAsync('spec-progress-untouched@v1', 'js', 'starter');
    await service.setJsBaselineAsync('spec-progress-back@v1', 'js', 'starter');
    await service.saveJsAsync('spec-progress-back@v1', 'starter\n', 'js');
    await service.initWebAsync('spec-progress-web@v1', { html: '<main></main>', css: '' });
    await service.saveWebAsync('spec-progress-web@v1', 'css', 'main { color: red; }');
    await service.initFrameworkAsync('spec-progress-react@v1', 'react', { 'src/App.tsx': 'starter' });
    await service.saveFrameworkFileAsync('spec-progress-react@v1', 'react', 'src/App.tsx', 'edited');
    await service.setJsBaselineAsync(rehearsal, 'js', 'starter');
    await service.saveJsAsync(rehearsal, 'edited', 'js');

    const drafts = await listed();

    expect(drafts.map((draft) => draft.questionId).sort()).toEqual(['spec-progress-js', 'spec-progress-react', 'spec-progress-web']);
    expect(drafts.every((draft, i) => i === 0 || drafts[i - 1].editedAt >= draft.editedAt)).toBeTrue();
  });

  it('counts the content version the task last opened on, not an older edited one', async () => {
    await service.setJsBaselineAsync('spec-progress-js@v1', 'js', 'starter');
    await service.saveJsAsync('spec-progress-js@v1', 'edited', 'js');
    await service.setJsBaselineAsync('spec-progress-js@v2', 'js', 'starter');
    upsertDraftIndexVersion('spec-progress-js', { version: 'v2', updatedAt: new Date().toISOString() }, { latestVersion: 'v2' });

    expect(await listed()).toEqual([]);

    upsertDraftIndexVersion('spec-progress-js', { version: 'v1', updatedAt: new Date().toISOString() }, { latestVersion: 'v1' });
    expect((await listed()).map((draft) => draft.questionId)).toEqual(['spec-progress-js']);
  });

  it('reads 170 drafts in one pass in under a second', async () => {
    const store = localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_js' });
    const keys = Array.from({ length: 170 }, (_, i) => `v2:code:js2:spec-progress-bulk-${i}@v1`);
    const now = new Date().toISOString();
    const code = 'export default function solve(input) {\n'.padEnd(2_000, '  // work\n') + '}\n';
    await Promise.all(keys.map((key, i) => store.setItem(key, JSON.stringify({
      js: { code: i % 2 ? code : '', baseline: 'starter', updatedAt: now },
      ts: { code: '', baseline: 'starter', updatedAt: now },
      lastLang: 'js',
      version: 'v2',
      updatedAt: now,
    }))));

    try {
      const started = performance.now();
      const drafts = await service.listEditedDraftsAsync();
      const elapsed = performance.now() - started;
      console.log(`[listEditedDraftsAsync] 170 drafts read in ${elapsed.toFixed(1)} ms`);

      expect(drafts.filter((draft) => draft.questionId.startsWith('spec-progress-bulk-')).length).toBe(85);
      expect(elapsed).toBeLessThan(1_000);
    } finally {
      await Promise.all(keys.map((key) => store.removeItem(key)));
    }
  });
});
