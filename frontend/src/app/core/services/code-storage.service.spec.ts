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
