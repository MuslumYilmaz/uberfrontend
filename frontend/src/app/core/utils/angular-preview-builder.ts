export function makeAngularPreviewHtmlV1(files: Record<string, any>): string {
  const appPath = 'src/app/app.component.ts';
  const mainPath = 'src/main.ts';

  const getCode = (p: string): string => {
    const a = files[p];
    const b = files['/' + p];
    if (typeof a === 'string') return a;
    if (a && typeof a.code === 'string') return a.code;
    if (typeof b === 'string') return b;
    if (b && typeof b.code === 'string') return b.code;
    return '';
  };

  const appTs = String(getCode(appPath)).trim();
  const mainTs = String(getCode(mainPath)).trim();

  if (!appTs || !mainTs) {
    const fallback =
      getCode('index.html') ||
      getCode('public/index.html') ||
      '<!doctype html><html><body style="font-family:system-ui;padding:16px">No Angular entry files found</body></html>';
    return fallback;
  }

  const importMap = {
    imports: {
      '@angular/core': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/core.mjs',
      '@angular/core/rxjs-interop': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/rxjs-interop.mjs',
      '@angular/core/primitives/signals': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/signals.mjs',
      '@angular/core/primitives/di': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/di.mjs',
      '@angular/core/primitives/event-dispatch': 'https://cdn.jsdelivr.net/npm/@angular/core@18.2.14/fesm2022/primitives/event-dispatch.mjs',
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
      'zone.js': 'https://cdn.jsdelivr.net/npm/zone.js@0.14.10/fesm2015/zone.js'
    }
  };

  const esc = (s: string) => String(s || '').replace(/<\/script>/g, '<\\/script>');

  const TS = `
function compileTS(src, filename){
  const clean = String(src||'')
    .replace(/\\r\\n?/g, '\\n')
    .replace(/\\uFEFF/g, '')
    .replace(/\\u00A0/g, ' ')
    .replace(/[\\u200B\\u200C\\u200D\\u2060]/g, '')
    .replace(/[\\u200E\\u200F\\u061C]/g, '')
    .replace(/\\u2028|\\u2029/g, '\\n')
    .replace(/[\\u2018\\u2019]/g, "'")
    .replace(/[\\u201C\\u201D]/g, '"');

  let js='';
  try{
    const out = ts.transpileModule(clean, {
      compilerOptions:{
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: true,
        emitDecoratorMetadata: false,
        useDefineForClassFields: false,
        newLine: ts.NewLineKind.LineFeed,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
      },
      fileName: filename,
      reportDiagnostics:false
    });
    js = (out && out.outputText) || '';
  }catch(e){ throw e; }

  return String(js||'')
    .replace(/\\uFEFF/g,'')
    .replace(/\\u2028|\\u2029/g,'\\n')
    .replace(/[\\u200B\\u200C\\u200D\\u2060]/g,'');
}
`;

  const RUNTIME = `
(function(){
  // ---------- Build normalized in-memory FS ----------
  var RAW = ${JSON.stringify(files)};
  var UF = {};
  for (var k in RAW) {
    if (!Object.prototype.hasOwnProperty.call(RAW, k)) continue;
    var key = String(k).replace(/^\\/+/,''); // drop leading /
    var v = RAW[k];
    var code = (typeof v === 'string') ? v : (v && v.code) || '';
    UF[key] = code;
  }
  self.UF_FILES = UF;

  // ---------- Path helpers ----------
  function norm(p){ return String(p||'').replace(/^\\/+/,'').replace(/\\\\+/g,'/'); }
  function join(a,b){
    a = norm(a); b = String(b||'');
    if (b.startsWith('/')) return norm(b);
    var base = a.split('/').slice(0,-1).join('/');
    var parts = (base ? base + '/' + b : b).split('/');
    var out = [];
    for (var i=0;i<parts.length;i++){
      var part = parts[i];
      if (!part || part === '.') continue;
      if (part === '..') out.pop(); else out.push(part);
    }
    return out.join('/');
  }
  function readFile(path){
    path = norm(path);
    if (UF[path] != null) return UF[path];
    if (UF['src/' + path] != null) return UF['src/' + path];
    if (UF['src/app/' + path] != null) return UF['src/app/' + path];
    return '';
  }

  // ---------- Inline external resources in components ----------
  function inlineTemplateAndStyles(src, fromPath){
    // templateUrl -> inline template
    src = src.replace(/templateUrl\\s*:\\s*(['"])(.+?)\\1/g, function(_m, _q, url){
      var resolved = url.startsWith('.') || !/^\\//.test(url) ? join(fromPath, url) : norm(url);
      var html = readFile(resolved);
      return 'template: ' + JSON.stringify(String(html||''));
    });
    // styleUrls -> inline styles
    src = src.replace(/styleUrls\\s*:\\s*\\[([\\s\\S]*?)\\]/g, function(_m, inner){
      var urls = [];
      var re = /['"](.+?)['"]/g, mm;
      while ((mm = re.exec(inner))) urls.push(mm[1]);
      var cssArr = urls.map(function(u){
        var resolved = u.startsWith('.') || !/^\\//.test(u) ? join(fromPath, u) : norm(u);
        return JSON.stringify(String(readFile(resolved) || ''));
      });
      return 'styles: [' + cssArr.join(',') + ']';
    });
    return src;
  }

  // ---------- Module emitter (TS->JS + import rewrites) ----------
  var urls = new Map();
  var seen = new Set();

  function blobURLFor(code, path){
    var blob = new Blob([code + '\\n//# sourceURL=' + path], { type: 'text/javascript' });
    return URL.createObjectURL(blob);
  }

  function resolveImport(fromPath, spec){
    if (!spec.startsWith('.')) return null; // bare imports handled by import map
    var base = join(fromPath, spec);
    var cands = [base, base + '.ts', base + '.tsx', base + '.js', base + '/index.ts', base + '/index.tsx'];
    for (var i=0;i<cands.length;i++){ var c=cands[i]; if (UF[c] != null) return c; }
    return base;
  }

  function UF_emit(path){
    path = norm(path);
    if (urls.has(path)) return urls.get(path);
    if (seen.has(path)) return urls.get(path) || '';
    seen.add(path);

    var src = String(UF[path] || '');
    if (!src) throw new Error('File not found: ' + path);

    // Inline external resources BEFORE compiling
    src = inlineTemplateAndStyles(src, path);

    var js = compileTS(src, path);

    // rewrite only RELATIVE imports to blob URLs
    js = js.replace(/from\\s+(['"])(\\.\\.?[^'"]*)\\1/g, function(m, q, spec){
      var child = resolveImport(path, spec);
      var childUrl = UF_emit(child);
      return 'from ' + q + childUrl + q;
    });

    var url = blobURLFor(js, path);
    urls.set(path, url);
    return url;
  }

  self.UF_emit = UF_emit;
})();
`;

  // Build HTML
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
  <script src="https://unpkg.com/typescript@5.6.3/lib/typescript.js"></script>
</head>
<body>
  <app-root>Loading Angular preview…</app-root>

  <div id="_uf_overlay"><h1>Something went wrong</h1><pre id="_uf_overlay_msg"></pre><div id="_uf_overlay_meta" class="meta"></div></div>

  <script>
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
  </script>

  <script>${esc(TS)}</script>
  <script>${esc(RUNTIME)}</script>

  <script type="module">
    try{
      hideOverlay();
      // ESM Angular deps
      await import('zone.js');
      await import('@angular/compiler');

      // Build & import your app entry via Blob URL (no percent-encoded data URLs)
      const mainURL = self.UF_emit('src/main.ts');
      await import(mainURL);
    }catch(e){
      console.error(e);
      try{ showOverlay(e?.message || e, 'bootstrap'); }catch{}
    }
  </script>
</body>
</html>`;
}
