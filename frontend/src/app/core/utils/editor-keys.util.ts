/** The editor's run shortcut and Monaco's Tab-focus toggle, named as this keyboard writes them. */
export type EditorKeys = {
  /** "Ctrl+Enter", or "Cmd+Enter" on Apple keyboards (Monaco's CtrlCmd). */
  run: string;
  /** The same keys for aria-keyshortcuts. */
  runAria: string;
  /** Monaco's "Toggle Tab Key Moves Focus": Ctrl+M, Ctrl+Shift+M on a Mac. */
  tabFocus: string;
};

/** Monaco takes the platform from the user agent ("Macintosh", or an iPad or iPhone), so the hint reads it there too. */
export function editorKeys(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''): EditorKeys {
  return /Macintosh|iPhone|iPad|iPod/.test(userAgent)
    ? { run: 'Cmd+Enter', runAria: 'Meta+Enter', tabFocus: 'Ctrl+Shift+M' }
    : { run: 'Ctrl+Enter', runAria: 'Control+Enter', tabFocus: 'Ctrl+M' };
}
