/// <reference lib="webworker" />

type FrameworkTech = 'react' | 'angular' | 'vue';

type BuildRequest = {
  type: 'build';
  id: string;
  tech: FrameworkTech;
  files: Record<string, string>;
  assetBase?: string;
};

type BuildResult =
  | { type: 'done'; id: string; html: string }
  | { type: 'error'; id: string; error: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', async (event: MessageEvent<BuildRequest>) => {
  const msg = event.data;
  if (!msg || msg.type !== 'build') return;

  try {
    let html = '';
    const assetBase = msg.assetBase || '';
    if (msg.tech === 'react') {
      const mod = await import('../utils/react-preview-builder');
      html = mod.makeReactPreviewHtml(msg.files, assetBase);
    } else if (msg.tech === 'angular') {
      const mod = await import('../utils/angular-preview-builder');
      html = mod.makeAngularPreviewHtmlV1(msg.files, assetBase);
    } else if (msg.tech === 'vue') {
      const mod = await import('../utils/vue-preview-builder');
      html = mod.makeVuePreviewHtml(msg.files, assetBase);
    } else {
      html = msg.files['index.html'] || msg.files['public/index.html'] || '';
    }

    const payload: BuildResult = { type: 'done', id: msg.id, html };
    ctx.postMessage(payload);
  } catch (err) {
    const payload: BuildResult = {
      type: 'error',
      id: msg.id,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(payload);
  }
});
