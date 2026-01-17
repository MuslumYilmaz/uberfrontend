/** Minimal Vue 3 preview (v1)
 *  Supports:
 *   - src/App.vue  (SFC with <template> + <script setup> or normal <script>)
 *   - src/App.ts   (module)
 *   - src/App.js   (module)
 *  The produced module must define:  const App = { ... }
 */
export function makeVuePreviewHtml(files: Record<string, string>): string {
  // --- 1) Try SFC first ------------------------------------------------------
  let user: string | undefined;

  if (files['src/App.vue']) {
    const sfc = parseSfc(files['src/App.vue']!);
    // parseSfc zaten App tanımını üretiyor; burada ekstra bir şey yapmıyoruz
    user = sfc.script;
  }

  // --- 2) TS/JS module fallback ----------------------------------------------
  user =
    user ||
    files['src/App.ts'] ||
    files['src/App.js'] ||
    `export default { template: '<div style="padding:12px">Hello Vue 👋</div>' }`;

  // --- 3) Load CSS -----------------------------------------------------------
  const css =
    files['src/styles.css'] ??
    files['src/App.css'] ??
    files['public/styles.css'] ??
    '';

  // --- 4) Transform module to UMD-style script ------------------------------
  const appModuleSrc = rewriteVueModuleToUMD(user);

  // --- 5) Produce the full HTML preview -------------------------------------
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://cdn.jsdelivr.net https://esm.sh; connect-src https: data: blob:; font-src data: https:; base-uri 'none'; form-action 'none';">
  <title>Vue Preview</title>
  <style>
    html,body,#app{height:100%}
    body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    ${css || ''}
    #_fa_overlay{position:fixed;inset:0;background:#2b0000;color:#ffd6d6;padding:16px;display:none;overflow:auto;z-index:999999;border-top:4px solid #ff5555}
    #_fa_overlay h1{margin:0 0 8px 0;font-size:16px;color:#fff}
    #_fa_overlay pre{white-space:pre-wrap;margin:0}
    #_fa_overlay .meta{opacity:.8;margin:6px 0 0}
  </style>

  <!-- Vue 3 (global build with compiler) -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <!-- Babel for TS -> JS -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <div id="_fa_overlay">
    <h1>Something went wrong</h1>
    <pre id="_fa_overlay_msg"></pre>
    <div id="_fa_overlay_meta" class="meta"></div>
  </div>

  <!-- user code -->
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

    const overlay = document.getElementById('_fa_overlay');
    const overlayMsg = document.getElementById('_fa_overlay_msg');
    const overlayMeta = document.getElementById('_fa_overlay_meta');

    function showOverlay(msg, meta){
      try {
        overlayMsg.textContent = msg || 'Unknown error';
        overlayMeta.textContent = meta || '';
        overlay.style.display = 'block';
      } catch {}
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
      const stack = e?.error?.stack ? '\\n\\n' + e.error.stack : '';
      showOverlay(msg + stack, loc);
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e?.reason || e?.message || 'Unhandled promise rejection';
      const stack = r?.stack ? '\\n\\n' + r.stack : '';
      showOverlay(String(r) + stack, '');
    });

    function compileTS(src){
      try{
        const out = Babel.transform(src, {
          filename: 'App.ts',
          sourceType: 'script',
          presets: [['typescript', { isTSX:false, allExtensions:true }]],
          retainLines: true,
          sourceMaps: 'inline',
          comments: false,
          compact: false
        });
        return (out && out.code) ? (out.code + '\\n//# sourceURL=App.ts') : src;
      }catch(e){
        showOverlay(e?.message || e, 'App.ts');
        throw e;
      }
    }

    function start(){
      const raw = document.getElementById('_fa_user_src').textContent || '';

      const compiled =
        /:\\s*[A-Za-z_$]/.test(raw) || /interface\\b|type\\b/.test(raw)
          ? compileTS(raw)
          : raw;

      try{
        hideOverlay();
        const run = new Function('Vue', compiled + '\\n;return (typeof App !== "undefined") ? App : undefined;');
        const AppRef = run(Vue);
        if (!AppRef) {
          const q = String.fromCharCode(96);
          showOverlay(
            'No App component found. In v1, make sure your code defines ' +
            q + 'const App = { ... }' + q + ' or ' +
            q + 'export default { ... }' + q + '.',
            'App'
          );
          return;
        }
        Vue.createApp(AppRef).mount('#app');
      }catch(e){
        const stack = e?.stack ? '\\n\\n'+e.stack : '';
        showOverlay(String(e) + stack, 'App');
      }
    }

    start();
  })();
  </script>
</body>
</html>`;
}

/** -----------------------------------------------------------------------
 *  Parse SFC to extract <template> and <script> (supports <script setup>)
 * --------------------------------------------------------------------- */
function parseSfc(src: string): {
  template: string;
  script: string;
  scriptExports: string;
} {
  // 1) <template> bloğunu yakala
  const templateRE = /<template>([\s\S]*?)<\/template>/;
  const tplMatch = src.match(templateRE);
  let template = tplMatch?.[1]?.trim() ?? '';

  // 2) <script ...> bloğunu yakala (setup veya normal fark etmez)
  const scriptRE = /<script([^>]*)>([\s\S]*?)<\/script>/;
  const scriptMatch = src.match(scriptRE);
  const scriptAttrs = scriptMatch?.[1] ?? '';
  const scriptRaw = scriptMatch?.[2]?.trim() ?? '';

  const isSetup = /\bsetup\b/.test(scriptAttrs);

  if (isSetup) {
    // ---------- <script setup> yolu ----------
    // vue importlarını ve css importlarını at
    const body = scriptRaw
      .replace(/^\s*import\s+[^;]*\s+from\s+['"]vue['"];?\s*$/mg, '')
      .replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg, '')
      .trim();

    // 1) Tüm tanımları (count, isZero, inc, dec, reset vs.) topla
    const bindings = new Set<string>();
    body.replace(/\b(const|let|var|function)\s+([A-Za-z_$][\w$]*)/g, (_m, _k, name) => {
      bindings.add(String(name));
      return _m;
    });

    // Replace component tags (<Tree />) with dynamic component usage (<component :is="Tree" />)
    const componentTags = new Set<string>();
    const componentTagRE = /<([A-Z][A-Za-z0-9_]*)\b/g;
    let m: RegExpExecArray | null;
    while ((m = componentTagRE.exec(template)) !== null) {
      componentTags.add(m[1]);
    }
    if (componentTags.size) {
      template = rewriteComponentTags(template, componentTags);
    }

    // 2) Template içinde gerçekten kullanılan identifier'ları bul
    const templateIds = new Set<string>();

    // {{ ... }}, :prop="...", v-foo="...", @click="..." içindeki expression'lar
    const exprRE = /{{([^}]*)}}|:(\w+)="([^"]+)"|v-[\w-]+="([^"]+)"|@[\w-]+="([^"]+)"/g;
    const identRE = /[A-Za-z_$][\w$]*/g;
    const reserved = new Set([
      'true', 'false', 'null', 'undefined',
      'if', 'for', 'in', 'of', 'let', 'const', 'var', 'return',
      'Math', 'Date', 'Number', 'String', 'Boolean', 'Array', 'Object'
    ]);

    m = null;
    while ((m = exprRE.exec(template)) !== null) {
      const expr = m[1] || m[3] || m[4] || m[5] || '';
      let idm: RegExpExecArray | null;
      while ((idm = identRE.exec(expr)) !== null) {
        const name = idm[0];
        if (!reserved.has(name)) {
          templateIds.add(name);
        }
      }
    }

    // 3) Sadece template'te kullanılan binding'leri expose et
    const exportedNames = Array.from(bindings).filter(name =>
      templateIds.has(name)
    );

    const returned = exportedNames.length ? exportedNames.join(', ') : '';

    const indentedBody = body
      ? body.split('\n').map(line => '      ' + line).join('\n')
      : '';

    const escTemplate = (template || '<div>Hello Vue 👋</div>').replace(/`/g, '\\`');

    const script = `
const { ref, reactive, computed, watch, watchEffect, onMounted, onUnmounted, onBeforeMount, onBeforeUnmount, onUpdated, onBeforeUpdate, defineComponent, h } = Vue;

const App = {
  template: \`${escTemplate}\`,
  setup() {
${indentedBody}
    return { ${returned} };
  }
};
`.trim();

    return { template, script, scriptExports: '' };
  }


  // ---------- Normal <script> yolu (options / composition) ----------
  let script = scriptRaw;
  let scriptExports = '';

  const exportMatch = scriptRaw.match(/export\s+default\s+({[\s\S]*?})/);
  if (exportMatch) {
    scriptExports = exportMatch[1];
    script = scriptRaw.replace(exportMatch[0], '').trim();
  }

  const escTemplate = (template || '<div>Hello Vue 👋</div>').replace(/`/g, '\\`');

  const fullScript = `
${script}
export default {
  template: \`${escTemplate}\`,
  ${scriptExports || ''}
};
`.trim();

  return { template, script: fullScript, scriptExports };
}

function rewriteComponentTags(template: string, tags: Set<string>): string {
  let out = template;
  for (const tag of tags) {
    const selfClosing = new RegExp(`<${tag}(\\s[^>]*)?\\s*/>`, 'g');
    out = out.replace(selfClosing, `<component :is="${tag}"$1 />`);
    const openTag = new RegExp(`<${tag}(\\s[^>/]*)?>`, 'g');
    out = out.replace(openTag, `<component :is="${tag}"$1>`);
    const closeTag = new RegExp(`</${tag}>`, 'g');
    out = out.replace(closeTag, `</component>`);
  }
  return out;
}

/** Turn a module-style Vue component into a plain script with `App` in scope */
function rewriteVueModuleToUMD(src: string): string {
  let s = src;

  // 1) Remove pure CSS imports
  s = s.replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg, '');

  // 2) Detect and strip imports from 'vue'
  const vueImportRE = /^\s*import\s+[^;]*\s+from\s+['"]vue['"];?\s*$/mg;
  const hadVueImport = vueImportRE.test(s);
  s = s.replace(vueImportRE, '');

  // 3) Rewrite export default → const App =
  s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, 'const App = function ');
  s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, 'const App = class ');
  s = s.replace(/\bexport\s+default\s+/m, 'const App = ');

  // 4) Remove named exports
  s = s.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/mg, '');

  // 5) defineComponent( → Vue.defineComponent(
  s = s.replace(/\bdefineComponent\s*\(/g, 'Vue.defineComponent(');

  // 6) If there *was* an import from 'vue', inject helpers from global Vue
  if (hadVueImport) {
    const helpers =
      `const { ref, reactive, computed, watch, watchEffect, onMounted, onUnmounted, onBeforeMount, onBeforeUnmount, onUpdated, onBeforeUpdate } = Vue;
`;
    s = helpers + s;
  }

  return s.trim();
}
