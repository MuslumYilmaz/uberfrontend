/**
 * Vue 3 preview. Every .vue file the app imports is compiled in the preview frame by @vue/compiler-sfc, as a Vue build
 * does it: <script setup> with defineProps, defineEmits and defineModel, the template compiled into setup, template and
 * script errors that point at a line of the file, and scoped styles. Babel strips TypeScript. Each file becomes an ES
 * module behind a blob URL, imports between files and from 'vue' are linked to those URLs, and the default export of
 * src/App.vue is mounted on #app. Vue is the development build, so its warnings reach the preview console.
 *
 * The frame is sandboxed with an opaque origin, where a module script from the site would need CORS headers that local
 * servers do not send, so Vue, the compiler (scripts/vendor-vue-preview.mjs) and Babel load as classic scripts.
 * src/main.ts does not run: the preview mounts App itself, so a check can unmount it.
 */
const ENTRY_FILES = ['src/App.vue', 'src/App.ts', 'src/App.js'];
const FALLBACK_APP = '<template><div style="padding:12px">Hello Vue 👋</div></template>';

export function makeVuePreviewHtml(files: Record<string, string>, assetBase?: string): string {
  const base =
    assetBase ||
    (typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : '');
  const assetUrl = (path: string) =>
    base ? new URL(path, base).toString() : path;

  const entry = ENTRY_FILES.find((path) => files[path] != null);
  const sources: Record<string, string> = entry ? { ...files } : { ...files, 'src/App.vue': FALLBACK_APP };
  const css =
    files['src/styles.css'] ??
    files['src/App.css'] ??
    files['public/styles.css'] ??
    '';
  // Inside a script element, "<" is escaped so that no file can close it.
  const filesJson = JSON.stringify(sources).replace(/</g, '\\u003c');

  return String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: http:; connect-src https: data: blob:; font-src data: https:; base-uri 'none'; form-action 'none';">
  <title>Vue Preview</title>
  <style>
    html,body,#app{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    ${css}
    #_fa_overlay{position:fixed;inset:0;background:#2b0000;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_fa_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_fa_overlay pre{white-space:pre-wrap;margin:0}
    #_fa_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>

  <script>
    // Without devtools, Vue's development build starts a 3-second timer at mount to drop its event buffer, and a check
    // for timers still running after unmount would count it. A hook that ignores the events avoids it; a real devtools
    // hook, when the extension injects one, is kept.
    if (!window.__VUE_DEVTOOLS_GLOBAL_HOOK__) window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = { emit: function(){} };
  </script>
  <script src="${assetUrl('/assets/vendor/vue/vue.global.js')}"></script>
  <script src="${assetUrl('/assets/vendor/vue/compiler-sfc.global.js')}"></script>
  <script src="${assetUrl('/assets/vendor/babel/babel.min.js')}"></script>
</head>
<body>
  <div id="app"></div>
  <div id="_fa_overlay">
    <h1>Something went wrong</h1>
    <pre id="_fa_overlay_msg"></pre>
    <div id="_fa_overlay_meta" class="meta"></div>
  </div>

  <script id="_fa_files" type="application/json">${filesJson}</script>

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
        const submitter = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"], input[type="image"]');
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
          if (typeof fn === 'function') return fn.apply(this, arguments);
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
        if (listener) documentListeners.add(type + ':' + String(listener));
        return originalAddEventListener(type, listener, options);
      };
      document.removeEventListener = function(type, listener, options){
        if (listener) documentListeners.delete(type + ':' + String(listener));
        return originalRemoveEventListener(type, listener, options);
      };
      window.__FA_GET_PREVIEW_LEAKS = function(){
        return { timers: activeTimers.size, documentListeners: documentListeners.size };
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

    const overlay = document.getElementById('_fa_overlay');
    const overlayMsg = document.getElementById('_fa_overlay_msg');
    const overlayMeta = document.getElementById('_fa_overlay_meta');
    function notifyReady(reason){
      try{
        if (typeof window.__FA_NOTIFY_PREVIEW_READY === 'function') {
          window.__FA_NOTIFY_PREVIEW_READY(reason || 'render');
          return;
        }
      } catch {}
      try{
        if (window.parent) {
          window.parent.postMessage({ type: 'FA_PREVIEW_READY', reason: String(reason || 'render') }, '*');
        }
      } catch {}
    }
    function waitForHostPaint(selector, timeoutMs){
      const deadline = Date.now() + (timeoutMs || 10000);
      const tick = () => {
        try{
          const host = document.querySelector(selector);
          const painted = !!(host && host.childNodes && host.childNodes.length > 0);
          if (painted || Date.now() >= deadline) {
            notifyReady('render');
            return;
          }
        } catch {
          notifyReady('render');
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    }

    function showOverlay(msg, meta, lifecycleState){
      try {
        overlayMsg.textContent = msg || 'Unknown error';
        overlayMeta.textContent = meta || '';
        overlay.style.display = 'block';
      } catch {}
      notifyReady(lifecycleState || 'runtime-error');
    }

    function hideOverlay(){
      try {
        overlay.style.display = 'none';
        overlayMsg.textContent = '';
        overlayMeta.textContent = '';
      } catch {}
    }

    window.addEventListener('error', (e) => {
      const msg = String(e && (e.message || e.error || 'Error'));
      const loc = e?.filename ? e.filename + (e.lineno ? ':'+e.lineno : '') : '';
      const stack = e?.error?.stack ? '\n\n' + e.error.stack : '';
      showOverlay(msg + stack, loc, 'runtime-error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e?.reason || e?.message || 'Unhandled promise rejection';
      const stack = r?.stack ? '\n\n' + r.stack : '';
      showOverlay(String(r) + stack, '', 'runtime-error');
    });

    // ---------- Compile the workspace into ES modules ----------
    const FILES = JSON.parse(document.getElementById('_fa_files').textContent || '{}');
    const ENTRY = ${JSON.stringify(entry ?? 'src/App.vue')};
    const SFC = self.VueCompilerSFC;
    const urls = new Map();
    const loading = new Set();
    let collectedCss = '';
    let vueUrl = '';
    let emptyUrl = '';

    function PreviewCompileError(file, message, line, column){
      this.file = file;
      this.message = message;
      this.line = line || 0;
      this.column = column || 0;
    }

    function blobUrl(code){
      return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    }

    // Every module imports 'vue' from this one, which re-exports the development build's global.
    function vueModuleUrl(){
      if (!vueUrl) {
        const names = Object.keys(Vue).filter(function(name){ return /^[A-Za-z_$][\w$]*$/.test(name) && name !== 'default'; });
        vueUrl = blobUrl('const V = self.Vue;\n' + names.map(function(name){ return 'export const ' + name + ' = V.' + name + ';'; }).join('\n') + '\nexport default V;');
      }
      return vueUrl;
    }

    function hashId(text){
      let hash = 2166136261;
      for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    }

    function positionOf(source, offset){
      const before = source.slice(0, offset);
      return { line: before.split('\n').length, column: offset - before.lastIndexOf('\n') };
    }

    function resolveFile(from, spec){
      const parts = from.split('/').slice(0, -1);
      spec.split('/').forEach(function(part){
        if (part === '..') parts.pop();
        else if (part && part !== '.') parts.push(part);
      });
      const base = parts.join('/');
      const candidates = [base, base + '.vue', base + '.ts', base + '.js', base + '/index.ts', base + '/index.js', base + '/index.vue'];
      for (let i = 0; i < candidates.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(FILES, candidates[i])) return candidates[i];
      }
      return null;
    }

    // Import and export statements start a line in compiled code; a phrase such as "data from 'the API'" in a string
    // does not.
    function linkImports(code, from){
      return code.replace(/^([ \t]*(?:import|export)\b[^'";]*?\bfrom\s*|[ \t]*import\s*)(['"])([^'"\n]+)\2/gm, function(_m, head, quote, spec){
        if (spec === 'vue') return head + quote + vueModuleUrl() + quote;
        if (!/^\.{1,2}\//.test(spec)) {
          throw new PreviewCompileError(from, 'The preview loads "vue" and the files of this workspace; it cannot load "' + spec + '".');
        }
        const target = resolveFile(from, spec);
        if (!target) throw new PreviewCompileError(from, 'Cannot find "' + spec + '", imported by ' + from + '.');
        if (/\.css$/.test(target)) {
          collectedCss += '\n' + FILES[target];
          if (!emptyUrl) emptyUrl = blobUrl('export {};');
          return head + quote + emptyUrl + quote;
        }
        return head + quote + moduleUrl(target) + quote;
      });
    }

    function stripTypes(path, code, keepsLines){
      try {
        return Babel.transform(code, {
          filename: path.split('/').pop() + (/\.vue$/.test(path) ? '.ts' : ''),
          sourceType: 'module',
          presets: [['typescript', { allExtensions: true }]],
          retainLines: true,
          comments: false,
        }).code;
      } catch (e) {
        const loc = e && e.loc;
        const message = String((e && e.message) || e).replace(/^[^:\n]*:\s*/, '');
        // A .ts or .js file keeps its lines through Babel; code compiled from a .vue file does not.
        throw new PreviewCompileError(path, message, keepsLines && loc ? loc.line : 0, keepsLines && loc ? loc.column + 1 : 0);
      }
    }

    function sfcError(path, source, error, descriptor){
      let message = String((error && error.message) || error).replace(/^\[vue\/compiler-sfc\]\s*/, '');
      const start = error && error.loc && error.loc.start;
      if (start && typeof start.line === 'number') {
        if (typeof start.offset === 'number' && message.indexOf('\n') < 0 && SFC.generateCodeFrame) {
          message += '\n\n' + SFC.generateCodeFrame(source, start.offset, (error.loc.end && error.loc.end.offset) || start.offset + 1);
        }
        return new PreviewCompileError(path, message, start.line, start.column);
      }
      // Babel counts a script parse error from the start of the script block.
      const block = descriptor && (descriptor.scriptSetup || descriptor.script);
      if (block && error && typeof error.pos === 'number') {
        const where = positionOf(source, block.loc.start.offset + error.pos);
        return new PreviewCompileError(path, message, where.line, where.column);
      }
      return new PreviewCompileError(path, message, 0, 0);
    }

    function compileSfc(path, source){
      const parsed = SFC.parse(source, { filename: path, sourceMap: false });
      if (parsed.errors.length) throw sfcError(path, source, parsed.errors[0], null);
      const descriptor = parsed.descriptor;
      const id = hashId(path);
      const scoped = descriptor.styles.some(function(style){ return style.scoped; });
      const scriptBlock = descriptor.scriptSetup || descriptor.script;
      const isTs = !!scriptBlock && (scriptBlock.lang === 'ts' || scriptBlock.lang === 'tsx');
      const expressionPlugins = isTs ? ['typescript'] : [];
      let code = 'const __sfc__ = {};';
      let bindings;
      if (scriptBlock) {
        let script;
        try {
          script = SFC.compileScript(descriptor, {
            id: id,
            inlineTemplate: true,
            genDefaultAs: '__sfc__',
            templateOptions: { compilerOptions: { expressionPlugins: expressionPlugins } },
          });
        } catch (e) {
          throw sfcError(path, source, e, descriptor);
        }
        code = script.content;
        bindings = script.bindings;
      }
      if (descriptor.template && !descriptor.scriptSetup) {
        const template = SFC.compileTemplate({
          source: descriptor.template.content,
          ast: descriptor.template.ast,
          filename: path,
          id: id,
          scoped: scoped,
          slotted: descriptor.slotted,
          compilerOptions: { bindingMetadata: bindings, expressionPlugins: expressionPlugins },
        });
        if (template.errors.length) throw sfcError(path, source, template.errors[0], descriptor);
        code += '\n' + template.code.replace(/\nexport (function|const) render/, '\n$1 render') + '\n__sfc__.render = render;';
      }
      if (scoped) code += '\n__sfc__.__scopeId = "data-v-' + id + '";';
      code += '\n__sfc__.__file = ' + JSON.stringify(path) + ';\nexport default __sfc__;';
      descriptor.styles.forEach(function(style){
        const line = style.loc.start.line;
        if (style.lang) throw new PreviewCompileError(path, '<style lang="' + style.lang + '"> is not supported in the preview; write plain CSS.', line, 1);
        if (style.module) throw new PreviewCompileError(path, '<style module> is not supported in the preview.', line, 1);
        const compiled = SFC.compileStyle({ source: style.content, filename: path, id: 'data-v-' + id, scoped: !!style.scoped });
        if (compiled.errors.length) throw new PreviewCompileError(path, String(compiled.errors[0].message || compiled.errors[0]), line, 1);
        collectedCss += '\n' + compiled.code;
      });
      return stripTypes(path, code, false);
    }

    function moduleUrl(path){
      if (urls.has(path)) return urls.get(path);
      if (loading.has(path)) throw new PreviewCompileError(path, 'Files that import each other in a circle cannot run in the preview.');
      loading.add(path);
      let source = String(FILES[path] == null ? '' : FILES[path]);
      // An App.ts that only declares const App = { ... } still renders, as the earlier preview allowed.
      if (path === ENTRY && !/\.vue$/.test(path) && !/\bexport\s+default\b/.test(source)) {
        source += '\nexport default (typeof App !== "undefined" ? App : undefined);';
      }
      const code = /\.vue$/.test(path) ? compileSfc(path, source) : stripTypes(path, source, true);
      const url = blobUrl(linkImports(code, path) + '\n//# sourceURL=' + path);
      loading.delete(path);
      urls.set(path, url);
      return url;
    }

    async function start(){
      if (!self.Vue || !SFC || !self.Babel) {
        showOverlay('The preview could not load Vue, its compiler or Babel.', 'boot', 'boot-error');
        return;
      }
      let entryUrl;
      try {
        entryUrl = moduleUrl(ENTRY);
      } catch (e) {
        if (e instanceof PreviewCompileError) {
          showOverlay(e.message, e.file + (e.line ? ':' + e.line + ':' + e.column : ''), 'compile-error');
        } else {
          showOverlay(String((e && e.stack) || e), ENTRY, 'compile-error');
        }
        return;
      }
      if (collectedCss) {
        const style = document.createElement('style');
        style.textContent = collectedCss;
        document.head.appendChild(style);
      }
      try {
        hideOverlay();
        const entryModule = await import(entryUrl);
        const App = entryModule.default;
        if (!App) {
          showOverlay('No App component: make it the default export of ' + ENTRY + '.', ENTRY, 'runtime-error');
          return;
        }
        const app = Vue.createApp(App);
        window.__FA_UNMOUNT_PREVIEW = function(){
          try { app.unmount(); } catch (_e) {}
        };
        app.mount('#app');
        waitForHostPaint('#app', 10000);
      } catch (e) {
        showOverlay(String((e && e.stack) || e), ENTRY, 'runtime-error');
      }
    }

    start();
  })();
  </script>
</body>
</html>`;
}
