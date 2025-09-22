/** Minimal Vue 3 preview (v1)
 *  Expect a module component in: src/App.ts or src/App.js
 *  The file should `export default { template: '...', ... }`
 *  or `export default defineComponent({ template: '...', ... })`
 */
export function makeVuePreviewHtml(files: Record<string, string>): string {
    const user =
        files['src/App.ts'] ??
        files['src/App.js'] ??
        // fallback – if someone wrote an SFC, tell them what to do in v1
        `export default { template: '<div style="padding:12px">Hello Vue 👋</div>' }`;

    const css =
        files['src/styles.css'] ??
        files['src/App.css'] ??
        files['public/styles.css'] ??
        '';

    const appModuleSrc = rewriteVueModuleToUMD(user);

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Vue Preview</title>
  <style>
    html,body,#app{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    ${css || ''}
    #_uf_overlay{position:fixed;inset:0;background:#2b0000;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_uf_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_uf_overlay pre{white-space:pre-wrap;margin:0}
    #_uf_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>
  <!-- Vue 3 (global build with compiler) -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <!-- Babel for TS -> JS -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <div id="_uf_overlay">
    <h1>Something went wrong</h1>
    <pre id="_uf_overlay_msg"></pre>
    <div id="_uf_overlay_meta" class="meta"></div>
  </div>

  <!-- keep user code as text; we transform at runtime for nicer errors -->
  <script id="_uf_user_src" type="text/plain">
${appModuleSrc.replace(/<\/script>/g, '<\\/script>')}
  </script>

  <script>
    (function(){
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

      window.addEventListener('error', (e) => {
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

      function compileTS(src){
        try{
          const out = Babel.transform(src, {
            filename: 'App.ts',
            sourceType: 'script',
            presets: [['typescript', { isTSX:false, allExtensions:true }]],
            retainLines: true, sourceMaps: 'inline', comments: false, compact: false
          });
          return (out && out.code) ? (out.code + '\\n//# sourceURL=App.ts') : src;
        }catch(e){
          showOverlay((e && (e.message || e)) || 'Compile error', 'App.ts');
          throw e;
        }
      }

      function start(){
        const raw = document.getElementById('_uf_user_src').textContent || '';
        // TS -> JS if needed
        const compiled = /:\\s*[A-Za-z_$]/.test(raw) || /interface\\b|type\\b/.test(raw)
          ? compileTS(raw) : raw;

        try{
          hideOverlay();
          const run = new Function('Vue', compiled + '\\n;return (typeof App !== "undefined") ? App : undefined;');
          const AppRef = run(Vue);
          if (!AppRef) {
             const BT = String.fromCharCode(96);
            showOverlay(
               'No default export found. In v1, use ' +
               BT + 'export default { template: "...", ... }' + BT +
               ' or defineComponent(...).',
               'App.ts'
            );
    return;
}
Vue.createApp(AppRef).mount('#app');
        }catch (e) {
    const stack = e && e.stack ? '\\n\\n' + e.stack : '';
    showOverlay(String(e) + stack, 'App.ts');
}
      }

start();
    }) ();
</script>
    </body>
    </html>`;
}

/** Turn a module-style Vue component into a plain script with `App` in scope */
function rewriteVueModuleToUMD(src: string): string {
    let s = src;

    // 1) strip style-only imports like CSS
    s = s.replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg, '');

    // 2) strip `import ... from 'vue'` – we use the global `Vue`
    s = s.replace(/^\s*import\s+[^;]*\s+from\s+['"]vue['"];?\s*$/mg, '');

    // 3) normalize default export -> `const App = ...`
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, 'const App = function ');
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, 'const App = class ');
    s = s.replace(/\bexport\s+default\s+/m, 'const App = ');

    // 4) remove any remaining named export keywords
    s = s.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/mg, '');

    // 5) common Vue usage niceties: if they used defineComponent without importing it
    //    (since we stripped the import), patch `defineComponent(` -> `Vue.defineComponent(`
    s = s.replace(/\bdefineComponent\s*\(/g, 'Vue.defineComponent(');

    return s.trim();
}
