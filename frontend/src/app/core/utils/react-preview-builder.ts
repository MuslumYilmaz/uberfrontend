/** Turn a module-style React file into plain script that runs with UMD globals */
// core/utils/react-preview-builder.ts

// These reach the compiled code as function parameters, so declaring them again would be an error.
const REACT_PREVIEW_PARAMETERS = new Set([
  'React',
  'ReactDOM',
  'useState',
  'useEffect',
  'useMemo',
  'useRef',
  'useReducer',
  'useContext',
  'createContext',
  'useCallback',
]);

/**
 * An import from react becomes a read from the UMD global, so every export keeps working. Files of one workspace share
 * a script, so a name another file already read is not declared again.
 */
function reactImportBindings(clause: string, moduleName: string, bound: Set<string>): string {
  if (/^type\s/.test(clause)) return '';
  const source = moduleName === 'react' ? 'React' : 'ReactDOM';
  const statements: string[] = [];
  const isNew = (name: string) => !REACT_PREVIEW_PARAMETERS.has(name) && !bound.has(name) && !!bound.add(name);

  const namespaceName = clause.match(/\*\s+as\s+([\w$]+)/)?.[1];
  const defaultName = clause.match(/^([\w$]+)\s*(?:,|$)/)?.[1];
  for (const name of [namespaceName, defaultName]) {
    if (name && isNew(name)) statements.push(`const ${name} = ${source};`);
  }

  const named = (clause.match(/\{([\s\S]*)\}/)?.[1] ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^type\s/.test(part))
    .map((part) => part.split(/\s+as\s+/))
    .filter(([imported, local]) => isNew(local ?? imported))
    .map(([imported, local]) => (local ? `${imported}: ${local}` : imported));
  if (named.length) statements.push(`const { ${named.join(', ')} } = ${source};`);

  return statements.join('\n');
}

/**
 * What replaces an import keeps the line breaks the import took (the patterns below also swallow blank lines around
 * it), so a compile error's line number still points at the line in the editor.
 */
function keepLineBreaks(match: string, replacement = ''): string {
  return replacement.replace(/\n/g, ' ') + '\n'.repeat(match.split('\n').length - 1);
}

/** Exported for its spec. */
export function rewriteReactModuleToUMD(src: string): string {
  let s = src;
  const bound = new Set<string>();

  // 1) React / ReactDOM importlarını UMD global'lerinden okuyan satırlara çevir
  s = s.replace(
    /^\s*import\s+([\w$*\s,{}]+?)\s+from\s+['"](react(?:-dom(?:\/client)?)?)['"];?[ \t]*$/mg,
    (match, clause: string, moduleName: string) => keepLineBreaks(match, reactImportBindings(clause.trim(), moduleName, bound))
  );

  // Kalanları (örneğin içinde yorum olan importları) sil
  s = s.replace(
    /^\s*import\s+[^;]*from\s+['"]react(?:-dom(?:\/client)?)?['"];?\s*$/mg,
    (match) => keepLineBreaks(match)
  );

  // 2) CSS importlarını sil
  s = s.replace(
    /^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg,
    (match) => keepLineBreaks(match)
  );

  // 3) Relatif importları (./theme, ../foo vs) sil
  s = s.replace(
    /^\s*import\s+[^;]*from\s+['"]\.{1,2}\/[^'"]+['"];?\s*$/mg,
    (match) => keepLineBreaks(match)
  );

  // 4) TS tip exportlarını normal deklarasyona çevir
  //    export type Theme = ...   ->  type Theme = ...
  //    export interface Foo {...} -> interface Foo {...}
  //    export enum Bar {...}      -> enum Bar {...}
  s = s.replace(
    /^[ \t]*export[ \t]+(type|interface|enum)[ \t]+/mg,
    '$1 '
  );

  // 5) default export'ları App'e çevir
  s = s.replace(
    /\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m,
    'function App'
  );
  s = s.replace(
    /\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m,
    'class App'
  );
  // App may already be declared, as in: function App() {} export default App;
  s = s.replace(
    /\bexport\s+default\s+/m,
    'const __faDefaultExport = '
  );

  // 6) Kalan named export keyword'lerini kaldır
  //    export const x = ...  -> const x = ...
  s = s.replace(
    /^[ \t]*export[ \t]+(?=(const|let|var|function|class)\b)/mg,
    ''
  );

  // Only the end: trimming the start would move every line up.
  return s.replace(/\s+$/, '');
}


const REACT_APP_FILES = ['src/App.tsx', 'src/App.jsx', 'src/App.ts', 'src/App.js'];
const REACT_MODULE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function resolveRelativeModule(files: Record<string, string>, fromPath: string, spec: string): string | null {
  const parts = fromPath.split('/').slice(0, -1);
  for (const part of spec.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  const base = parts.join('/');
  const candidates = [
    base,
    ...REACT_MODULE_EXTENSIONS.map((extension) => base + extension),
    ...REACT_MODULE_EXTENSIONS.map((extension) => `${base}/index${extension}`),
  ];
  return candidates.find((path) => /\.[jt]sx?$/.test(path) && files[path] != null) ?? null;
}

/**
 * Exported for its spec. The files the entry imports by relative path, directly or not, each before the files that
 * import it, the order in which ES modules run; the entry comes last.
 */
export function relativeModuleOrder(files: Record<string, string>, entry: string): string[] {
  const order: string[] = [];
  const visit = (path: string, chain: Set<string>) => {
    if (order.includes(path) || chain.has(path)) return;
    chain.add(path);
    for (const [, spec] of (files[path] ?? '').matchAll(/(?:\bfrom|\bimport)\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = resolveRelativeModule(files, path, spec);
      if (target) visit(target, chain);
    }
    chain.delete(path);
    order.push(path);
  };
  visit(entry, new Set());
  return order;
}

const NAMED_DEFAULT_DECLARATION = /\bexport\s+default\s+((?:async\s+)?(?:function\*?|class)\s+([\w$]+))/;
const DEFAULT_IDENTIFIER = /^[ \t]*export\s+default\s+([\w$]+)[ \t]*;?[ \t]*$/m;

/**
 * The name a file's default export has in the shared script: the declared function or class, or the variable that
 * `export default name;` names, since declaring it again under the same name would be an error.
 */
function defaultExportName(source: string, index: number): string {
  return source.match(NAMED_DEFAULT_DECLARATION)?.[2] ?? source.match(DEFAULT_IDENTIFIER)?.[1] ?? `__faModuleDefault${index}`;
}

/** The values a file exports, as `exported: local` pairs for a namespace import. */
function exportedBindings(source: string, index: number): string[] {
  const pairs = new Map<string, string>();
  for (const [, name] of source.matchAll(/\bexport\s+(?:async\s+)?(?:function\*?|class|const|let|var|enum)\s+([\w$]+)/g)) {
    pairs.set(name, name);
  }
  for (const [, list] of source.matchAll(/\bexport\s*\{([^}]*)\}(?!\s*from)/g)) {
    for (const part of list.split(',')) {
      const [local, exported] = part.trim().split(/\s+as\s+/);
      if (local && !/^type\s/.test(local)) pairs.set(exported ?? local, local);
    }
  }
  if (/\bexport\s+default\b/.test(source)) pairs.set('default', defaultExportName(source, index));
  return [...pairs].map(([exported, local]) => (exported === local ? local : `${exported}: ${local}`));
}

/**
 * The workspace's files share one script, so a relative import has nothing to load: the file it names runs earlier.
 * Its default, renamed and namespace bindings become declarations, and the line breaks stay, so errors keep their
 * lines. A file other than the entry loses its export keywords, and its default export gets a name of its own.
 */
function shareModuleScope(files: Record<string, string>, path: string, order: string[]): string {
  let source = (files[path] ?? '').replace(
    /^[ \t]*import\s+([^;'"]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"];?[ \t]*$/mg,
    (match, rawClause: string, spec: string) => {
      const clause = rawClause.trim();
      const target = resolveRelativeModule(files, path, spec);
      const index = target ? order.indexOf(target) : -1;
      if (!target || index < 0 || /^type\s/.test(clause)) return keepLineBreaks(match);
      const targetSource = files[target] ?? '';
      const statements: string[] = [];
      const defaultLocal = clause.match(/^([\w$]+)\s*(?:,|$)/)?.[1];
      const defaultName = defaultExportName(targetSource, index);
      if (defaultLocal && defaultLocal !== defaultName) statements.push(`var ${defaultLocal} = ${defaultName};`);
      const namespace = clause.match(/\*\s+as\s+([\w$]+)/)?.[1];
      if (namespace) statements.push(`var ${namespace} = { ${exportedBindings(targetSource, index).join(', ')} };`);
      for (const part of (clause.match(/\{([\s\S]*)\}/)?.[1] ?? '').split(',')) {
        const [imported, local] = part.trim().split(/\s+as\s+/);
        if (imported && local && imported !== local && !/^type\s/.test(part.trim())) {
          statements.push(`var ${local} = ${imported};`);
        }
      }
      return keepLineBreaks(match, statements.join(' '));
    },
  );
  if (path === order[order.length - 1]) return source;

  const index = order.indexOf(path);
  source = source
    .replace(/^[ \t]*export\s+(?:\*|\{[^}]*\})\s+from\s+['"][^'"]+['"];?[ \t]*$/mg, (match) => keepLineBreaks(match))
    .replace(/^[ \t]*export\s*\{[^}]*\};?[ \t]*$/mg, (match) => keepLineBreaks(match));
  if (NAMED_DEFAULT_DECLARATION.test(source)) return source.replace(NAMED_DEFAULT_DECLARATION, '$1');
  if (DEFAULT_IDENTIFIER.test(source)) return source.replace(DEFAULT_IDENTIFIER, (match) => keepLineBreaks(match));
  return source.replace(/\bexport\s+default\s+/, `const __faModuleDefault${index} = `);
}

export function makeReactPreviewHtml(files: Record<string, string>, assetBase?: string): string {
  const base =
    assetBase ||
    (typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : '');
  const assetUrl = (path: string) =>
    base ? new URL(path, base).toString() : path;

  // App and every file it imports run in one script, the imported files first. Only App's default export is the
  // component to render.
  const appPath = REACT_APP_FILES.find((path) => files[path] != null);
  const order = appPath ? relativeModuleOrder(files, appPath) : [];
  const segments = appPath
    ? order.map((path) => ({ file: path.replace(/^src\//, ''), source: shareModuleScope(files, path, order) }))
    : [{ file: 'App.tsx', source: `export default function App(){ return <div>Hello React</div> }` }];
  let nextLine = 1;
  const ranges = segments.map(({ file, source }) => {
    const range = { file, start: nextLine };
    nextLine += source.split('\n').length;
    return range;
  });

  const appModuleSrc = rewriteReactModuleToUMD(segments.map(({ source }) => source).join('\n'));

  const css =
    files['src/App.css'] ??
    files['src/index.css'] ??
    files['public/styles.css'] ??
    '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: http:; connect-src https: data: blob:; font-src data: https:; base-uri 'none'; form-action 'none';">
  <title>Preview</title>
  <style>
    html,body,#root{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    ${css || ''}
    #_fa_overlay{position:fixed;inset:0;background:#2b0000;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_fa_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_fa_overlay pre{white-space:pre-wrap;margin:0}
    #_fa_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>
  <script src="${assetUrl('/assets/vendor/react/react.production.min.js')}"></script>
  <script src="${assetUrl('/assets/vendor/react-dom/react-dom.production.min.js')}"></script>
  <script src="${assetUrl('/assets/vendor/babel/babel.min.js')}"></script>
</head>
<body>
  <div id="root"></div>
  <div id="_fa_overlay">
    <h1>Something went wrong</h1>
    <pre id="_fa_overlay_msg"></pre>
    <div id="_fa_overlay_meta" class="meta"></div>
  </div>

  <!-- Keep user code as plain text; we compile & run with better error reporting -->
  <script id="_fa_user_src" type="text/plain">
${appModuleSrc.replace(/<\/script>/g, '<\\/script>')}
  </script>

  <script>
    (function(){
      // Strip common network APIs in the sandboxed preview (keep navigator for libs)
      ['fetch','XMLHttpRequest','WebSocket','EventSource'].forEach(function(k){ try { (self)[k] = undefined; } catch (e) {} });


      (function(){
        function isSubmitter(el){
          if (!el || !el.tagName) return false;
          const tag = el.tagName.toLowerCase();
          if (tag === 'button') {
            const t = (el.getAttribute('type') || '').toLowerCase();
            return !t || t === 'submit';
          }
          if (tag === 'input') {
            const t = (el.getAttribute('type') || '').toLowerCase();
            return t === 'submit' || t === 'image';
          }
          return false;
        }

        function dispatchSyntheticSubmit(form, submitter){
          if (!form) return;
          try{
            let ev;
            if (typeof SubmitEvent === 'function') {
              ev = new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: submitter || undefined });
            } else if (typeof Event === 'function') {
              ev = new Event('submit', { bubbles: true, cancelable: true });
            } else {
              ev = document.createEvent('Event');
              ev.initEvent('submit', true, true);
            }
            form.dispatchEvent(ev);
          }catch(_e){}
        }

        function findForm(el){
          try{ if (el && el.form) return el.form; }catch(_e){}
          try{ if (el && el.closest) return el.closest('form'); }catch(_e){}
          return null;
        }

        document.addEventListener('click', function(e){
          const target = e && e.target;
          const el = (target && target.closest) ? target.closest('button, input') : target;
          if (!isSubmitter(el)) return;
          const form = findForm(el);
          if (!form) return;
          try{ e.preventDefault(); }catch(_e){}
          dispatchSyntheticSubmit(form, el);
        }, true);

        document.addEventListener('keydown', function(e){
          if (!e || e.key !== 'Enter') return;
          const target = e.target;
          if (!(target instanceof Element)) return;
          const tag = target.tagName ? target.tagName.toLowerCase() : '';
          if (tag === 'textarea') return;
          if ((target).isContentEditable) return;
          const form = target.closest ? target.closest('form') : null;
          if (!form) return;
          try{ e.preventDefault(); }catch(_e){}
          const submitter = form.querySelector('button[type=\"submit\"], button:not([type]), input[type=\"submit\"], input[type=\"image\"]');
          dispatchSyntheticSubmit(form, submitter);
        }, true);
      })();

      (function(){
        const originalSetTimeout = window.setTimeout.bind(window);
        const originalClearTimeout = window.clearTimeout.bind(window);
        const originalSetInterval = window.setInterval.bind(window);
        const originalClearInterval = window.clearInterval.bind(window);
        const originalAddEventListener = document.addEventListener.bind(document);
        const originalRemoveEventListener = document.removeEventListener.bind(document);
        const activeTimers = new Set();
        const documentListeners = new Set();
        let timerBaseline = new Set();

        window.setTimeout = function(fn, delay){
          let id;
          const wrapped = function(){
            activeTimers.delete(id);
            if (typeof fn === 'function') {
              return fn.apply(this, arguments);
            }
            try { return (0, eval)(String(fn)); } catch (_e) { return undefined; }
          };
          id = originalSetTimeout(wrapped, delay);
          activeTimers.add(id);
          return id;
        };

        window.clearTimeout = function(id){
          activeTimers.delete(id);
          return originalClearTimeout(id);
        };

        window.setInterval = function(fn, delay){
          const id = originalSetInterval(fn, delay);
          activeTimers.add(id);
          return id;
        };

        window.clearInterval = function(id){
          activeTimers.delete(id);
          return originalClearInterval(id);
        };

        document.addEventListener = function(type, listener, options){
          if (listener && type !== 'selectionchange') documentListeners.add(type + ':' + String(listener));
          return originalAddEventListener(type, listener, options);
        };

        document.removeEventListener = function(type, listener, options){
          if (listener && type !== 'selectionchange') documentListeners.delete(type + ':' + String(listener));
          return originalRemoveEventListener(type, listener, options);
        };

        window.__FA_GET_PREVIEW_LEAKS = function(){
          return {
            timers: activeTimers.size,
            documentListeners: documentListeners.size
          };
        };
        window.__FA_MARK_PREVIEW_TIMER_BASELINE = function(){
          timerBaseline = new Set(activeTimers);
        };
        window.__FA_GET_PREVIEW_TIMER_LEAKS = function(){
          let count = 0;
          activeTimers.forEach(function(id){
            if (!timerBaseline.has(id)) count += 1;
          });
          return count;
        };
      })();

      const rootEl = document.getElementById('root');
      const overlay = document.getElementById('_fa_overlay');
      const overlayMsg = document.getElementById('_fa_overlay_msg');
      const overlayMeta = document.getElementById('_fa_overlay_meta');
      function lifecycleDetail(error, fallback){
        try{
          const value = error && error.message ? error.message : String(error || fallback || 'Preview failed');
          return value.split(/\\r?\\n/, 1)[0].slice(0, 500);
        }catch(_e){
          return String(fallback || 'Preview failed');
        }
      }
      function notifyReady(reason, detail){
        try{
          if (typeof window.__FA_NOTIFY_PREVIEW_READY === 'function') {
            window.__FA_NOTIFY_PREVIEW_READY(reason || 'render-ready', detail || '');
            return;
          }
        }catch(_e){}
        try{
          if (window.parent) {
            window.parent.postMessage({
              type: 'FA_PREVIEW_LIFECYCLE',
              version: 2,
              state: String(reason || 'render-ready'),
              error: String(detail || '')
            }, '*');
          }
        }catch(_e){}
      }

      function showOverlay(msg, meta, lifecycleState){
        try{
          overlayMsg.textContent = msg || 'Unknown error';
          overlayMeta.textContent = meta || '';
          overlay.style.display = 'block';
        }catch{}
        notifyReady(lifecycleState || 'runtime-error', lifecycleDetail(msg, 'Preview failed'));
      }
      function hideOverlay(){
        try{
          overlay.style.display = 'none';
          overlayMsg.textContent = '';
          overlayMeta.textContent = '';
        }catch{}
      }

      // Global error hooks (runtime)
      window.addEventListener('error', (e) => {
        // Prefer a rich message when we have details
        const basic = String(e && (e.message || e.error || 'Error'));
        const where = (e && e.filename) ? (e.filename + (e.lineno ? (':' + e.lineno + (e.colno ? ':' + e.colno : '')) : '')) : '';
        const stack = e && e.error && e.error.stack ? '\\n\\n' + e.error.stack : '';
        showOverlay(basic + stack, where, 'runtime-error');
      });

      window.addEventListener('unhandledrejection', (e) => {
        const r = e && (e.reason || e.message) || 'Unhandled promise rejection';
        const stack = r && r.stack ? '\\n\\n' + r.stack : '';
        showOverlay(String(r) + stack, '', 'runtime-error');
      });

      // Tiny error boundary to catch render errors
      class FAErrorBoundary extends React.Component {
        constructor(p){ super(p); this.state = { error: null }; }
        static getDerivedStateFromError(error){ return { error }; }
        componentDidCatch(error){ 
          const stack = error && error.stack ? '\\n\\n' + error.stack : '';
          showOverlay(String(error) + stack, '', 'runtime-error');
        }
        render(){ return this.state.error ? null : this.props.children; }
      }

      // React 18's createRoot().render() commits concurrently. Readiness must be
      // tied to the commit itself: requestAnimationFrame is not guaranteed to run
      // in the offscreen opaque iframe used by structured checks.
      class FACommitSentinel extends React.Component {
        componentDidMount(){ notifyReady('render-ready'); }
        render(){ return this.props.children; }
      }

      // The workspace's files share the script, each starting on its own line; an error names the file it is in.
      const FA_SEGMENTS = ${JSON.stringify(ranges).replace(/</g, '\\u003c')};
      function locate(line){
        let segment = FA_SEGMENTS[0] || { file: 'App.tsx', start: 1 };
        for (const candidate of FA_SEGMENTS) if (candidate.start <= line) segment = candidate;
        return { file: segment.file, start: segment.start, line: line - segment.start + 1 };
      }

      function formatBabelError(err, src){
        try{
          const message = (err && (err.message || String(err))) || 'Compile error';
          if (!err || !err.loc) return { msg: message, meta: '' };
          // Babel numbers the lines of the whole script; the frame shows the lines of the file the error is in.
          const where = locate(err.loc.line);
          const lines = src.split('\\n');
          const frame = [];
          for (let n = Math.max(where.start, err.loc.line - 2); n <= Math.min(lines.length, err.loc.line + 2); n += 1) {
            if (locate(n).file !== where.file) continue;
            frame.push((n === err.loc.line ? '> ' : '  ') + String(n - where.start + 1).padStart(4) + ' | ' + lines[n - 1]);
            if (n === err.loc.line) frame.push('       | ' + ' '.repeat(Math.max(0, err.loc.column)) + '^');
          }
          const reason = message.split('\\n')[0].replace(/^App\\.tsx:\\s*/, '').replace(/\\s*\\(\\d+:\\d+\\)\\s*$/, '');
          return { msg: reason + '\\n\\n' + frame.join('\\n'), meta: where.file + ':' + where.line + ':' + err.loc.column };
        }catch{
          return { msg: String(err || 'Compile error'), meta: '' };
        }
      }

      function compileAndRun(){
        // The text starts with the line break after the script tag, which would push every line number down by one.
        const src = (document.getElementById('_fa_user_src').textContent || '').replace(/^\\r?\\n/, '');
        let compiled;

        // 1) Compile TS/TSX -> JS with inline sourcemap + stable filename
        try{
          if (!self.Babel || !Babel.transform) {
            showOverlay('The preview compiler could not start.', 'Babel', 'boot-error');
            return;
          }
          const res = Babel.transform(src, {
            filename: 'App.tsx',
            sourceType: 'script',
            presets: [
              ['typescript', { isTSX: true, allExtensions: true }],
              ['react', { development: true, runtime: 'classic' }]
            ],
            retainLines: true,
            sourceMaps: 'inline',
            comments: false,
            compact: false
          });
          compiled = (res && res.code) ? (res.code + '\\n//# sourceURL=App.tsx') : '';
        }catch(e){
          const { msg, meta } = formatBabelError(e, src);
          showOverlay(msg, meta, 'compile-error');
          return;
        }

        // 2) Execute compiled JS with React globals in scope
      // 2) Execute compiled JS with React globals in scope
      try {
        hideOverlay();

        const {
          useState,
          useEffect,
          useMemo,
          useRef,
          useReducer,
          useContext,
          createContext,
          useCallback,
        } = React;

        const run = new Function(
          'React',
          'ReactDOM',
          'useState',
          'useEffect',
          'useMemo',
          'useRef',
          'useReducer',
          'useContext',
          'createContext',
          'useCallback',
          // DİKKAT: burada ÇİFTE backslash var
          compiled + '\\n;return (typeof __faDefaultExport !== "undefined") ? __faDefaultExport : ((typeof App !== "undefined") ? App : undefined);'
        );

        const AppRef = run(
          React,
          ReactDOM,
          useState,
          useEffect,
          useMemo,
          useRef,
          useReducer,
          useContext,
          createContext,
          useCallback
        );

        const root = ReactDOM.createRoot(rootEl);
        window.__FA_UNMOUNT_PREVIEW = function(){
          try { root.unmount(); } catch (_e) {}
        };
        // memo() and forwardRef() return objects, and those are components too.
        if (typeof AppRef === 'function' || (AppRef && typeof AppRef === 'object')) {
          root.render(
            React.createElement(
              FAErrorBoundary,
              null,
              React.createElement(FACommitSentinel, null, React.createElement(AppRef))
            )
          );
        } else {
          root.render(
            React.createElement(FACommitSentinel, null, React.createElement('div', null, 'No App component exported'))
          );
        }
      } catch (e) {
        const stack = e && e.stack ? '\\n' + e.stack : '';
        const where = (e && e.fileName)
          ? (e.fileName + (e.lineNumber ? (':' + e.lineNumber + (e.columnNumber ? ':' + e.columnNumber : '')) : ''))
          : '';
        showOverlay(String(e) + stack, where || 'App.tsx', 'runtime-error');
      }
    }

      compileAndRun();
    })();
  </script>
</body>
</html>`;
}
