  /** Turn a module-style React file into plain script that runs with UMD globals */
  function rewriteReactModuleToUMD(src: string): string {
    let s = src;

    // 1) Remove React/ReactDOM (and client) imports – we load UMD versions in the page
    s = s.replace(/^\s*import\s+[^;]*from\s+['"]react(?:-dom(?:\/client)?)?['"];?\s*$/mg, '');

    // 2) Remove side-effect CSS imports like `import './App.css'`
    s = s.replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg, '');

    // 3) Normalize default exports to `App` in global scope
    //    export default function App() {}    -> function App() {}
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, 'function App');
    //    export default class App {}        -> class App {}
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, 'class App');
    //    export default (...)               -> const App = (...)
    s = s.replace(/\bexport\s+default\s+/m, 'const App = ');

    // 4) Remove any remaining named `export` keywords (not needed in the preview)
    s = s.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/mg, '');

    return s.trim();
  }

export function makeReactPreviewHtml(files: Record<string, string>): string {
    const user =
        files['src/App.tsx'] ??
        files['src/App.jsx'] ??
        files['src/App.ts'] ??
        files['src/App.js'] ??
        `export default function App(){ return <div>Hello React</div> }`;

    const appModuleSrc = rewriteReactModuleToUMD(user);
    const css = files['src/App.css'] ?? files['src/index.css'] ?? files['public/styles.css'] ?? '';

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Preview</title>
  <style>
    html,body,#root{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    ${css || ''}
    #_uf_overlay{position:fixed;inset:0;background:#2b0000;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_uf_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_uf_overlay pre{white-space:pre-wrap;margin:0}
    #_uf_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <div id="_uf_overlay">
    <h1>Something went wrong</h1>
    <pre id="_uf_overlay_msg"></pre>
    <div id="_uf_overlay_meta" class="meta"></div>
  </div>

  <!-- Keep user code as plain text; we compile & run with better error reporting -->
  <script id="_uf_user_src" type="text/plain">
${appModuleSrc.replace(/<\/script>/g, '<\\/script>')}
  </script>

  <script>
    (function(){
      const rootEl = document.getElementById('root');
      const overlay = document.getElementById('_uf_overlay');
      const overlayMsg = document.getElementById('_uf_overlay_msg');
      const overlayMeta = document.getElementById('_uf_overlay_meta');

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
      class UFErrorBoundary extends React.Component {
        constructor(p){ super(p); this.state = { error: null }; }
        static getDerivedStateFromError(error){ return { error }; }
        componentDidCatch(error){ 
          const stack = error && error.stack ? '\\n\\n' + error.stack : '';
          showOverlay(String(error) + stack, '');
        }
        render(){ return this.state.error ? null : this.props.children; }
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
        const src = document.getElementById('_uf_user_src').textContent || '';
        let compiled;

        // 1) Compile TS/TSX -> JS with inline sourcemap + stable filename
        try{
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
          const { msg, meta } = formatBabelError(e);
          showOverlay(msg, meta);
          return;
        }

        // 2) Execute compiled JS with React globals in scope
        try{
          hideOverlay();
          const { useState, useEffect, useMemo, useRef, useReducer, useContext } = React;
          const run = new Function(
            'React','ReactDOM','useState','useEffect','useMemo','useRef','useReducer','useContext',
            compiled + '\\n;return (typeof App !== "undefined") ? App : undefined;'
          );
          const AppRef = run(React, ReactDOM, useState, useEffect, useMemo, useRef, useReducer, useContext);

          const root = ReactDOM.createRoot(rootEl);
          if (typeof AppRef === 'function') {
            root.render(
              React.createElement(UFErrorBoundary, null, React.createElement(AppRef))
            );
          } else {
            root.render(React.createElement('div', null, 'No App component exported'));
          }
        }catch(e){
          const stack = e && e.stack ? '\\n\\n' + e.stack : '';
          const where = (e && e.fileName) ? (e.fileName + (e.lineNumber ? (':' + e.lineNumber + (e.columnNumber ? ':' + e.columnNumber : '')) : '')) : '';
          showOverlay(String(e) + stack, where || 'App.tsx');
        }
      }

      compileAndRun();
    })();
  </script>
</body>
</html>`;
}
