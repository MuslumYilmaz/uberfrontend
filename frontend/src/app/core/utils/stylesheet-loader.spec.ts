import { loadStylesheet } from './stylesheet-loader';

describe('loadStylesheet', () => {
  const HREF = 'https://frontendatlas.com/assets/monaco/min/vs/editor/editor.main.css';
  // A detached parent: its links never reach the network, so each test decides how a request ends.
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement('div');
  });

  function links(): HTMLLinkElement[] {
    return Array.from(parent.querySelectorAll('link'));
  }

  async function settled(promise: Promise<void>): Promise<'loaded' | 'failed' | 'pending'> {
    let state: 'loaded' | 'failed' | 'pending' = 'pending';
    promise.then(() => { state = 'loaded'; }, () => { state = 'failed'; });
    for (let tick = 0; tick < 3; tick += 1) await Promise.resolve();
    return state;
  }

  it('requests a failed stylesheet once more and resolves when the second request loads', async () => {
    const loading = loadStylesheet(parent, HREF, 'vs/editor/editor.main');
    const [first] = links();
    expect(first.rel).toBe('stylesheet');
    expect(first.href).toBe(HREF);
    expect(first.dataset['name']).toBe('vs/editor/editor.main');

    first.dispatchEvent(new Event('error'));
    expect(first.isConnected).toBeFalse();
    const [second] = links();
    expect(second).not.toBe(first);
    expect(second.href).toBe(HREF);
    expect(await settled(loading)).toBe('pending');

    second.dispatchEvent(new Event('load'));
    expect(await settled(loading)).toBe('loaded');
    expect(links()).toEqual([second]);
  });

  it('rejects after the second failed request and leaves no failed link behind', async () => {
    const loading = loadStylesheet(parent, HREF, 'vs/editor/editor.main');

    links()[0].dispatchEvent(new Event('error'));
    links()[0].dispatchEvent(new Event('error'));

    expect(await settled(loading)).toBe('failed');
    expect(links()).toEqual([]);
    await expectAsync(loading).toBeRejectedWithError(`Could not load the stylesheet ${HREF}.`);
  });

  it('reuses a stylesheet of the same name that already loaded', async () => {
    const loaded = document.createElement('link');
    loaded.rel = 'stylesheet';
    loaded.dataset['name'] = 'vs/editor/editor.main';
    Object.defineProperty(loaded, 'sheet', { value: {} });
    parent.appendChild(loaded);

    expect(await settled(loadStylesheet(parent, HREF, 'vs/editor/editor.main'))).toBe('loaded');
    expect(links()).toEqual([loaded]);
  });
});
