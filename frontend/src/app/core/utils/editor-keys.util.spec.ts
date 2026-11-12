import { editorKeys } from './editor-keys.util';

describe('editorKeys', () => {
  it('names Cmd and the Mac Tab-focus toggle where Monaco sees a Mac, Ctrl elsewhere', () => {
    expect(editorKeys('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'))
      .toEqual({ run: 'Cmd+Enter', runAria: 'Meta+Enter', tabFocus: 'Ctrl+Shift+M' });
    expect(editorKeys('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'))
      .toEqual({ run: 'Ctrl+Enter', runAria: 'Control+Enter', tabFocus: 'Ctrl+M' });
    expect(editorKeys('Mozilla/5.0 (X11; Linux x86_64)').run).toBe('Ctrl+Enter');
  });
});
