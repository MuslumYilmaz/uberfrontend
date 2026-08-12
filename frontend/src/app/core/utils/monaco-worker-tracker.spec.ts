import {
  createTrackedMonacoWorker,
  isTrackedMonacoWorker,
} from './monaco-worker-tracker';

describe('Monaco worker tracker', () => {
  it('creates a named worker and tracks only the returned worker', () => {
    const worker = {} as Worker;
    const createWorker = jasmine.createSpy('createWorker').and.returnValue(worker);
    const scriptUrl = 'https://frontendatlas.com/assets/monaco/min/vs/base/worker/workerMain.js';

    expect(createTrackedMonacoWorker(scriptUrl, 'css', createWorker)).toBe(worker);
    expect(createWorker).toHaveBeenCalledOnceWith(scriptUrl, { name: 'css' });
    expect(isTrackedMonacoWorker(worker)).toBeTrue();
    expect(isTrackedMonacoWorker({})).toBeFalse();
    expect(isTrackedMonacoWorker(null)).toBeFalse();
  });
});
