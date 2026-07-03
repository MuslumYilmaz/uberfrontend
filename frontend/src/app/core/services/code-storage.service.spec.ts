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
});

describe('CodeStorageService framework save guards', () => {
  let service: CodeStorageService;
  const qid = 'spec-framework-empty-guard';
  const tech = 'react';
  const path = 'src/App.tsx';

  beforeEach(async () => {
    service = new CodeStorageService();
    await service.clearFrameworkAsync(tech, qid);
  });

  afterEach(async () => {
    await service.clearFrameworkAsync(tech, qid);
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
});
