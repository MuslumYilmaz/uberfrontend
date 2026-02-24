export function makeAngularPreviewHtmlV1(files: Record<string, any>, assetBase?: string): string {
  const base =
    assetBase ||
    (typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : '');
  const assetUrl = (path: string) =>
    base ? new URL(path, base).toString() : path;

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
  var FA = {};
  for (var k in RAW) {
    if (!Object.prototype.hasOwnProperty.call(RAW, k)) continue;
    var key = String(k).replace(/^\\/+/,''); // drop leading /
    var v = RAW[k];
    var code = (typeof v === 'string') ? v : (v && v.code) || '';
    FA[key] = code;
  }
  self.FA_FILES = FA;

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
    if (FA[path] != null) return FA[path];
    if (FA['src/' + path] != null) return FA['src/' + path];
    if (FA['src/app/' + path] != null) return FA['src/app/' + path];
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
    for (var i=0;i<cands.length;i++){ var c=cands[i]; if (FA[c] != null) return c; }
    return base;
  }

  function FA_emit(path){
    path = norm(path);
    if (urls.has(path)) return urls.get(path);
    if (seen.has(path)) return urls.get(path) || '';
    seen.add(path);

    var src = String(FA[path] || '');
    if (!src) throw new Error('File not found: ' + path);

    // Inline external resources BEFORE compiling
    src = inlineTemplateAndStyles(src, path);

    var js = compileTS(src, path);

    // rewrite only RELATIVE imports to blob URLs
    js = js.replace(/from\\s+(['"])(\\.\\.?[^'"]*)\\1/g, function(m, q, spec){
      var child = resolveImport(path, spec);
      var childUrl = FA_emit(child);
      return 'from ' + q + childUrl + q;
    });

    var url = blobURLFor(js, path);
    urls.set(path, url);
    return url;
  }

  self.FA_emit = FA_emit;
})();
`;

  // Build HTML
  return String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: http:; connect-src https: data: blob:; font-src data: https:; base-uri 'none'; form-action 'none';">
  <title>Angular Preview</title>
  <style>
    html,body,#root{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    #_fa_overlay{position:fixed;inset:0;background:#1a1a1a;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_fa_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_fa_overlay pre{white-space:pre-wrap;margin:0}
    #_fa_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>

  <script type="importmap">${JSON.stringify(importMap)}</script>
  <script src="${assetUrl('/assets/vendor/typescript/typescript.js')}"></script>
</head>
<body>
  <app-root></app-root>

  <div id="_fa_overlay"><h1>Something went wrong</h1><pre id="_fa_overlay_msg"></pre><div id="_fa_overlay_meta" class="meta"></div></div>

  <script>
    const overlay = document.getElementById('_fa_overlay');
    const overlayMsg = document.getElementById('_fa_overlay_msg');
    const overlayMeta = document.getElementById('_fa_overlay_meta');
    const notifyReady = (reason='render') => {
      try {
        if (typeof window.__FA_NOTIFY_PREVIEW_READY === 'function') {
          window.__FA_NOTIFY_PREVIEW_READY(reason);
          return;
        }
      } catch {}
      try {
        if (window.parent) {
          window.parent.postMessage({ type: 'FA_PREVIEW_READY', reason: String(reason || 'render') }, '*');
        }
      } catch {}
    };
    const waitForHostPaint = (selector, timeoutMs = 10000) =>
      new Promise((resolve) => {
        const deadline = Date.now() + timeoutMs;
        const tick = () => {
          try {
            const host = document.querySelector(selector);
            const painted = !!(host && host.childNodes && host.childNodes.length > 0);
            if (painted || Date.now() >= deadline) {
              resolve(undefined);
              return;
            }
          } catch {
            resolve(undefined);
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
    const showOverlay = (msg, meta='') => {
      try { overlayMsg.textContent = String(msg||'Unknown error'); overlayMeta.textContent = meta; overlay.style.display='block'; } catch {}
      notifyReady('error');
    };
    const hideOverlay = () => { try { overlay.style.display='none'; overlayMsg.textContent=''; overlayMeta.textContent=''; } catch {} };

    // Strip common network APIs inside the sandboxed preview (keep navigator for libs)
    ['fetch','XMLHttpRequest','WebSocket','EventSource'].forEach(function(k){ try { (self)[k] = undefined; } catch (e) {} });

    // Prevent native form submission inside sandboxed iframes (no allow-forms),
    // while still allowing frameworks to handle submit events.
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
        try{
          // button/input have a .form property that resolves associated form even when outside.
          if (el && el.form) return el.form;
        }catch(_e){}
        try{
          if (el && el.closest) return el.closest('form');
        }catch(_e){}
        return null;
      }

      document.addEventListener('click', function(e){
        const target = e && e.target;
        const el = (target && target.closest) ? target.closest('button, input') : target;
        if (!isSubmitter(el)) return;
        const form = findForm(el);
        if (!form) return;
        // Cancel the browser's default submit action (which is blocked by sandbox and logs a warning).
        try{ e.preventDefault(); }catch(_e){}
        // Re-emit a synthetic submit event so framework handlers (ngSubmit/onSubmit) still run.
        dispatchSyntheticSubmit(form, el);
      }, true);

      document.addEventListener('keydown', function(e){
        if (!e || e.key !== 'Enter') return;
        const target = e.target;
        if (!(target instanceof Element)) return;
        // Don't hijack Enter in textareas/contenteditable
        const tag = target.tagName ? target.tagName.toLowerCase() : '';
        if (tag === 'textarea') return;
        if ((target).isContentEditable) return;
        const form = target.closest ? target.closest('form') : null;
        if (!form) return;
        try{ e.preventDefault(); }catch(_e){}
        const submitter = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"], input[type="image"]');
        dispatchSyntheticSubmit(form, submitter);
      }, true);
    })();

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
      const mainURL = self.FA_emit('src/main.ts');
      await import(mainURL);
      await waitForHostPaint('app-root', 10000);
      notifyReady('render');
    }catch(e){
      try{ showOverlay(e?.message || e, 'bootstrap'); }catch{}
    }
  </script>
</body>
</html>`;
}
