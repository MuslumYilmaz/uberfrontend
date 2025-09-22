  export function makeAngularPreviewHtmlV1(files: Record<string, string>): string {
    // grab the two files we support in v1
    const appPath = 'src/app/app.component.ts';
    const mainPath = 'src/main.ts';
    const appTs = String(files[appPath] ?? '').trim();
    const mainTs = String(files[mainPath] ?? '').trim();

    // if we don’t have both, just show whatever index.html exists (or a placeholder)
    if (!appTs || !mainTs) {
        const fallback = files['index.html'] || files['public/index.html'] ||
            '<!doctype html><html><body style="font-family:system-ui;padding:16px">No Angular entry files found</body></html>';
        return fallback;
    }

    const importMap = {
        imports: {
            '@angular/core': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/core.mjs',
            '@angular/core/rxjs-interop': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/rxjs-interop.mjs',

            // 🔽 add these deep paths
            '@angular/core/primitives/signals':
                'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/signals.mjs',
            '@angular/core/primitives/di':
                'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/di.mjs',
            '@angular/core/primitives/event-dispatch':
                'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/event-dispatch.mjs',

            '@angular/common': 'https://cdn.jsdelivr.net/npm/@angular/common@18.2.14/fesm2022/common.mjs',
            '@angular/common/http': 'https://cdn.jsdelivr.net/npm/@angular/common@18.2.14/fesm2022/http.mjs',
            '@angular/forms': 'https://cdn.jsdelivr.net/npm/@angular/forms@18.2.14/fesm2022/forms.mjs',
            '@angular/platform-browser': 'https://cdn.jsdelivr.net/npm/@angular/platform-browser@18.2.14/fesm2022/platform-browser.mjs',
            '@angular/platform-browser-dynamic': 'https://cdn.jsdelivr.net/npm/@angular/platform-browser-dynamic@18.2.14/fesm2022/platform-browser-dynamic.mjs',
            '@angular/compiler': 'https://cdn.jsdelivr.net/npm/@angular/compiler@18.2.14/fesm2022/compiler.mjs',
            '@angular/router': 'https://cdn.jsdelivr.net/npm/@angular/router@18.2.14/fesm2022/router.mjs',

            'tslib': 'https://cdn.jsdelivr.net/npm/tslib@2.6.3/tslib.es6.js',
            'rxjs': 'https://esm.sh/rxjs@7',
            'rxjs/operators': 'https://esm.sh/rxjs@7/operators',
            "zone.js": "https://cdn.jsdelivr.net/npm/zone.js@0.14.10/fesm2015/zone.js"
        }
    };

    // inline sources (escaped)
    const esc = (s: string) => s.replace(/<\/script>/g, '<\\/script>');

    return String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Angular Preview</title>
  <style>
    html,body,#root{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    #_uf_overlay{position:fixed;inset:0;background:#1a1a1a;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_uf_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_uf_overlay pre{white-space:pre-wrap;margin:0}
    #_uf_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>

<script type="importmap">${JSON.stringify(importMap)}</script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/typescript@5.6.3/lib/typescript.js"></script>

</head>
<body>
  <app-root>Loading Angular preview…</app-root>

  <div id="_uf_overlay"><h1>Something went wrong</h1><pre id="_uf_overlay_msg"></pre><div id="_uf_overlay_meta" class="meta"></div></div>

  <script id="_uf_app_ts"  type="application/json">${JSON.stringify(appTs)}</script>
  <script id="_uf_main_ts" type="application/json">${JSON.stringify(mainTs)}</script>

  <script type="module">
    const overlay = document.getElementById('_uf_overlay');
    const overlayMsg = document.getElementById('_uf_overlay_msg');
    const overlayMeta = document.getElementById('_uf_overlay_meta');
    const showOverlay = (msg, meta='') => { try { overlayMsg.textContent = String(msg||'Unknown error'); overlayMeta.textContent = meta; overlay.style.display='block'; } catch {} };
    const hideOverlay = () => { try { overlay.style.display='none'; overlayMsg.textContent=''; overlayMeta.textContent=''; } catch {} };

    window.addEventListener('error', (e) => {
      const basic = String(e && (e.message || e.error) || 'Error');
      const where = (e && e.filename) ? (e.filename + (e.lineno? ':'+e.lineno+(e.colno? ':'+e.colno:'') : '')) : '';
      const stack = e && e.error && e.error.stack ? '\\n\\n'+e.error.stack : '';
      showOverlay(basic+stack, where);
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e && (e.reason || e.message) || 'Unhandled promise rejection';
      const stack = r && r.stack ? '\\n\\n'+r.stack : '';
      showOverlay(String(r)+stack, '');
    });

function compileTS(src, filename){
  // 0) Normalize the raw TypeScript input first (kill invisible chars)
  const clean = String(src || '')
    .replace(/\r\n?/g, '\n')                  // CRLF -> LF
    .replace(/\uFEFF/g, '')                   // BOM (anywhere)
    .replace(/\u00A0/g, ' ')                  // NBSP -> space
    .replace(/[\u200B\u200C\u200D\u2060]/g, '') // zero-widths
    .replace(/[\u200E\u200F\u061C]/g, '')     // LRM/RLM/ALM
    .replace(/\u2028|\u2029/g, '\n')          // LS/PS -> newline
    .replace(/[\u2018\u2019]/g, "'")          // smart single quotes -> '
    .replace(/[\u201C\u201D]/g, '"');         // smart double quotes -> "

  // 1) Try TypeScript first (legacy decorators down-level)
  let js = '';
  try {
    const out = ts.transpileModule(clean, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        // legacy decorator transform:
        experimentalDecorators: true,
        emitDecoratorMetadata: false,
        useDefineForClassFields: false,
        // keep things predictable:
        newLine: ts.NewLineKind.LineFeed,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
        importHelpers: false,
        downlevelIteration: false,
      },
      fileName: filename,
      reportDiagnostics: false
    });
    js = (out && out.outputText) ? out.outputText : '';
  } catch (e) {
    showOverlay((e && e.message) || 'Compile error', filename);
    throw e;
  }

  // 2) Post-sanitize the JS in case TS emitted invisible chars
  js = String(js || '')
    .replace(/\uFEFF/g, '')
    .replace(/\u2028|\u2029/g, '\n')
    .replace(/[\u200B\u200C\u200D\u2060]/g, '');

  // 3) Fallback: if decorators slipped through (e.g., TS didn’t down-level),
  //    recompile with Babel’s legacy decorators transform.
  if (/@Component\s*\(/.test(js) || /@\w+\s*\(/.test(js)) {
    try {
      const res = Babel.transform(clean, {
        filename,
        sourceType: 'module',
        presets: [['typescript', { isTSX: /\.tsx?$/.test(filename), allExtensions: true }]],
        plugins: [
          ['proposal-decorators', { legacy: true }],
          ['proposal-class-properties', { loose: true }]
        ],
        retainLines: true,
        sourceMaps: 'inline',
        comments: false,
        compact: false
      });
      js = (res && res.code) || js;
    } catch (e) {
      // If even Babel fails, show a nice overlay
      showOverlay((e && e.message) || 'Decorator transform failed', filename);
      throw e;
    }
  }

  return js;
}

    // 1) compile both files to ESM JS
    const appTSRaw  = JSON.parse(document.getElementById('_uf_app_ts').textContent  || '""');
    const mainTSRaw = JSON.parse(document.getElementById('_uf_main_ts').textContent || '""');
    const stripBOM = (s) => s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
    const normalizeLS = (s) => String(s || '').replace(/\\u2028|\\u2029/g, '\\n');
    const appTS  = normalizeLS(stripBOM(appTSRaw));
    const mainTS = normalizeLS(stripBOM(mainTSRaw));
const appJS  = compileTS(appTS,  'src/app/app.component.ts');
let   mainJS = compileTS(mainTS, 'src/main.ts');

// make a blob URL for the component module
const appURL = 'data:text/javascript;charset=utf-8,' +
  encodeURIComponent(appJS + '\n//# sourceURL=src/app/app.component.ts');

// ✅ rewrite the relative import in main.ts to point to our blob
mainJS = mainJS.replace(
  /from\s+['"]\.\/app\/app\.component(?:\.[tj]sx?)?['"]/g,
  'from "' + appURL + '"'
);

// now make the main blob
const mainURL  = 'data:text/javascript;charset=utf-8,' +
  encodeURIComponent(mainJS + '\n//# sourceURL=src/main.ts');


(async () => {
  try {
    hideOverlay();
    await import('zone.js');          // ESM Zone from your import map
    await import('@angular/compiler'); // JIT for templates
    await import(mainURL);             // bootstraps AppComponent
  } catch (e) { /* show overlay as you already do */ }
})();

  </script>
</body>
</html>`;
}