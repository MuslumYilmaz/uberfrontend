/** Turn a module-style React file into plain script that runs with UMD globals */
// core/utils/react-preview-builder.ts

function rewriteReactModuleToUMD(src: string): string {
  let s = src;

  // 1) React / ReactDOM importlarını sil
  s = s.replace(
    /^\s*import\s+[^;]*from\s+['"]react(?:-dom(?:\/client)?)?['"];?\s*$/mg,
    ''
  );

  // 2) CSS importlarını sil
  s = s.replace(
    /^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg,
    ''
  );

  // 3) Relatif importları (./theme, ../foo vs) sil
  s = s.replace(
    /^\s*import\s+[^;]*from\s+['"]\.{1,2}\/[^'"]+['"];?\s*$/mg,
    ''
  );

  // 4) TS tip exportlarını normal deklarasyona çevir
  //    export type Theme = ...   ->  type Theme = ...
  //    export interface Foo {...} -> interface Foo {...}
  //    export enum Bar {...}      -> enum Bar {...}
  s = s.replace(
    /^\s*export\s+(type|interface|enum)\s+/mg,
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
  s = s.replace(
    /\bexport\s+default\s+/m,
    'const App = '
  );

  // 6) Kalan named export keyword'lerini kaldır
  //    export const x = ...  -> const x = ...
  s = s.replace(
    /^\s*export\s+(?=(const|let|var|function|class)\b)/mg,
    ''
  );

  return s.trim();
}


export function makeReactPreviewHtml(files: Record<string, string>): string {
  const appSrc =
    files['src/App.tsx'] ??
    files['src/App.jsx'] ??
    files['src/App.ts'] ??
    files['src/App.js'] ??
    `export default function App(){ return <div>Hello React</div> }`;

  // Yeni: theme dosyasını da oku (varsa)
  const themeSrc =
    files['src/theme.tsx'] ??
    files['src/theme.ts'] ??
    files['src/theme.jsx'] ??
    files['src/theme.js'] ??
    '';

  // theme'i App'in önüne ekle ki önce o tanımlansın
  const combinedSrc = themeSrc ? `${themeSrc}\n\n${appSrc}` : appSrc;

  const appModuleSrc = rewriteReactModuleToUMD(combinedSrc);

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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://cdn.jsdelivr.net https://esm.sh; connect-src https: data: blob:; font-src data: https:; base-uri 'none'; form-action 'none';">
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
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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

      const rootEl = document.getElementById('root');
      const overlay = document.getElementById('_fa_overlay');
      const overlayMsg = document.getElementById('_fa_overlay_msg');
      const overlayMeta = document.getElementById('_fa_overlay_meta');

      function showOverlay(msg, meta){
        try{
          overlayMsg.textContent = msg || 'Unknown error';
          overlayMeta.textContent = meta || '';
          overlay.style.display = 'block';
        }catch{}
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
        showOverlay(basic + stack, where);
      });

      window.addEventListener('unhandledrejection', (e) => {
        const r = e && (e.reason || e.message) || 'Unhandled promise rejection';
        const stack = r && r.stack ? '\\n\\n' + r.stack : '';
        showOverlay(String(r) + stack, '');
      });

      // Tiny error boundary to catch render errors
      class FAErrorBoundary extends React.Component {
        constructor(p){ super(p); this.state = { error: null }; }
        static getDerivedStateFromError(error){ return { error }; }
        componentDidCatch(error){ 
          const stack = error && error.stack ? '\\n\\n' + error.stack : '';
          showOverlay(String(error) + stack, '');
        }
        render(){ return this.state.error ? null : this.props.children; }
      }

      function stripTypesLite(src){
        return String(src||'')
          .replace(/:\\s*[^=;,)]+(?=[=;,)])/g, '')
          .replace(/\\s+as\\s+[A-Za-z_$][\\w$.<>,\\s]*/g, '')
          .replace(/\\binterface\\b[\\s\\S]*?\\{[\\s\\S]*?\\}\\s*/g, '')
          .replace(/\\btype\\s+[A-Za-z_$][\\w$]*\\s*=\\s*[\\s\\S]*?;/g, '')
          .replace(/\\benum\\s+[A-Za-z_$][\\w$]*\\s*\\{[\\s\\S]*?\\}\\s*/g, '');
      }

      function formatBabelError(err){
        try{
          // Babel compile errors often have loc + codeFrame
          const loc = err && err.loc ? ('App.tsx:' + err.loc.line + ':' + err.loc.column) : '';
          let msg = (err && (err.message || String(err))) || 'Compile error';
          if (err && err.codeFrame) msg += '\\n\\n' + err.codeFrame;
          return { msg, meta: loc };
        }catch{
          return { msg: String(err || 'Compile error'), meta: '' };
        }
      }

      function compileAndRun(){
        const src = document.getElementById('_fa_user_src').textContent || '';
        let compiled;

        // 1) Compile TS/TSX -> JS with inline sourcemap + stable filename
        try{
          if (!self.Babel || !Babel.transform) throw new Error('Babel missing');
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
          try{
            const fallback = stripTypesLite(src);
            compiled = fallback + '\\n//# sourceURL=App.tsx';
          }catch(inner){
            const { msg, meta } = formatBabelError(e);
            showOverlay(msg, meta);
            return;
          }
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
          compiled + '\\n;return (typeof App !== "undefined") ? App : undefined;'
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
        if (typeof AppRef === 'function') {
          root.render(
            React.createElement(FAErrorBoundary, null, React.createElement(AppRef))
          );
        } else {
          root.render(React.createElement('div', null, 'No App component exported'));
        }
      } catch (e) {
        const stack = e && e.stack ? '\\n' + e.stack : '';
        const where = (e && e.fileName)
          ? (e.fileName + (e.lineNumber ? (':' + e.lineNumber + (e.columnNumber ? ':' + e.columnNumber : '')) : ''))
          : '';
        showOverlay(String(e) + stack, where || 'App.tsx');
      }
    }

      compileAndRun();
    })();
  </script>
</body>
</html>`;
}
