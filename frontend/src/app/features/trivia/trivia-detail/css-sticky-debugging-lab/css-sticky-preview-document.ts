import type { CssStickyCase } from './css-sticky-debugging-lab.content';
import {
  CssStickySanitizedSource,
  sanitizeCssStickyPreviewSource,
} from './css-sticky-css-sanitizer';
import {
  CssStickyClassificationSnapshot,
  classifyCssStickySnapshot,
} from './css-sticky-inspection-classifier';
import {
  CSS_STICKY_MAX_ANCESTORS,
  CSS_STICKY_MAX_CSS_LENGTH,
  CSS_STICKY_MAX_STRING_LENGTH,
  CSS_STICKY_PREVIEW_CHANNEL,
  CSS_STICKY_PREVIEW_VERSION,
  CssStickyBridgeConfig,
} from './css-sticky-preview-protocol';

const TRUSTED_BASE_STYLES = `
:root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
html, body { min-height: 100%; margin: 0; }
body { padding: 12px; color: #172033; background: #f8fafc; }
.demo-scroll { border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; }
.demo-row { min-height: 52px; margin: 0; padding: 16px 8px; border-bottom: 1px solid #e2e8f0; }
.demo-stack, .outside-content, .dashboard-content { min-width: 0; }
`;

export function buildCssStickyPreviewDocument(
  stickyCase: CssStickyCase,
  ids: { sessionId: string; frameId: string; readyRunToken: string; nonce: string },
): string {
  const config: CssStickyBridgeConfig = {
    channel: CSS_STICKY_PREVIEW_CHANNEL,
    version: CSS_STICKY_PREVIEW_VERSION,
    sessionId: ids.sessionId,
    frameId: ids.frameId,
    readyRunToken: ids.readyRunToken,
    caseId: stickyCase.id,
    initialCss: stickyCase.initialCss,
    targetSelector: stickyCase.targetSelector,
    ...(stickyCase.expectedScrollOwnerSelector
      ? { expectedScrollOwnerSelector: stickyCase.expectedScrollOwnerSelector }
      : {}),
    ...(stickyCase.suspectSelector ? { suspectSelector: stickyCase.suspectSelector } : {}),
  };
  const serializedConfig = serializeForInlineScript(config);
  const nonce = requireHexId(ids.nonce);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'">
  <style>${TRUSTED_BASE_STYLES}</style>
  <style id="fa-user-css"></style>
</head>
<body>
${stickyCase.html}
<script nonce="${nonce}">(${cssStickyChildBridge.toString()})(${serializedConfig},(${classifyCssStickySnapshot.toString()}),(${sanitizeCssStickyPreviewSource.toString()}));</script>
</body>
</html>`;
}

function requireHexId(value: string): string {
  if (!/^[a-f0-9]{16,128}$/i.test(value)) {
    throw new Error('CSS sticky preview could not create a safe document.');
  }
  return value;
}

function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Runs inside a sandboxed opaque-origin iframe. Keep this function self-contained. */
function cssStickyChildBridge(
  config: CssStickyBridgeConfig,
  classify: (snapshot: CssStickyClassificationSnapshot) => string,
  sanitizeCss: (source: string, trustedFallback: string) => CssStickySanitizedSource,
): void {
  const channel = 'FA_CSS_STICKY_INSPECTOR';
  const version = 1;
  const maxCssLength = 20_000;
  const maxAncestors = 12;
  const maxStringLength = 80;
  const parentWindow = window.parent;
  const userStyle = document.getElementById('fa-user-css') as HTMLStyleElement | null;
  let latestRunId = 0;
  let latestRunToken = '';
  let inspectedAncestors: Element[] = [];
  let highlightedElement: HTMLElement | null = null;
  let blockedNetworkReference = false;
  let activeScrollOwner: HTMLElement | null = null;
  let activeScrollTop = 0;
  let activeScrollRunId = 0;
  let activeScrollRunToken = '';

  if (userStyle && typeof config.initialCss === 'string' && config.initialCss.length <= maxCssLength) {
    userStyle.textContent = config.initialCss;
  }

  const clean = (value: unknown) => String(value ?? '').slice(0, maxStringLength);
  const rounded = (value: number) => Math.round(Math.max(-10_000_000, Math.min(10_000_000, Number.isFinite(value) ? value : 0)) * 100) / 100;
  const twoFrames = () => new Promise<void>((resolve) => {
    let settled = false;
    let fallbackTimer = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      resolve();
    };

    // Cross-origin frames that sit just outside the viewport can have their
    // animation frames paused indefinitely. Prefer two painted frames, but do
    // not let that browser optimization turn an explicit inspection into a
    // timeout. The geometry reads that follow still force current layout.
    fallbackTimer = window.setTimeout(finish, 160);
    requestAnimationFrame(() => requestAnimationFrame(finish));
  });
  const createsScrollMechanism = (style: CSSStyleDeclaration) => {
    const mechanism = /^(auto|scroll|hidden|overlay)$/;
    return mechanism.test(style.overflowX) || mechanism.test(style.overflowY);
  };
  const labelFor = (element: Element) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.dataset['scrollRoot'] !== undefined) return '[data-scroll-root]';
    if (htmlElement.dataset['unexpectedOwner'] !== undefined) return '[data-unexpected-owner]';
    if (htmlElement.dataset['shortBoundary'] !== undefined) return '[data-short-boundary]';
    if (htmlElement.dataset['stretchParent'] !== undefined) return '[data-stretch-parent]';
    const id = clean(element.id);
    const className = clean(Array.from(element.classList).slice(0, 2).join('.'));
    return clean(`${element.tagName.toLowerCase()}${id ? `#${id}` : ''}${className ? `.${className}` : ''}`);
  };
  const clearHighlight = () => {
    if (!highlightedElement) return;
    highlightedElement.style.removeProperty('outline');
    highlightedElement.style.removeProperty('outline-offset');
    highlightedElement = null;
  };
  const highlight = (element: Element | null) => {
    clearHighlight();
    if (!(element instanceof HTMLElement)) return;
    highlightedElement = element;
    element.style.setProperty('outline', '3px solid #db2777', 'important');
    element.style.setProperty('outline-offset', '-3px', 'important');
  };
  const post = (payload: Record<string, unknown>) => {
    parentWindow.postMessage(Object.assign({
      channel,
      version,
      sessionId: config.sessionId,
      frameId: config.frameId,
      caseId: config.caseId,
    }, payload), '*');
  };
  const restoreActiveScroll = (runId?: number, runToken?: string) => {
    if (!activeScrollOwner) return;
    if ((runId !== undefined && activeScrollRunId !== runId)
      || (runToken !== undefined && activeScrollRunToken !== runToken)) return;
    activeScrollOwner.scrollTop = activeScrollTop;
    activeScrollOwner = null;
    activeScrollTop = 0;
    activeScrollRunId = 0;
    activeScrollRunToken = '';
  };
  const summaryFor = (finding: string) => {
    switch (finding) {
      case 'position_not_sticky': return 'The target does not compute to position: sticky.';
      case 'missing_inset': return 'The sticky axis has no non-auto block-axis inset.';
      case 'unexpected_scroll_container': return 'A nearer overflow ancestor owns sticky positioning.';
      case 'no_scroll_range': return 'The scroll owner has no measurable scroll range.';
      case 'no_containing_block_runway': return 'The containing block does not provide enough sticky travel.';
      case 'stretched_item': return 'Grid or flex alignment stretches the sticky item through its track.';
      case 'covered_by_sibling': return 'Sticky geometry works, but another layer covers the target.';
      case 'working': return 'The target remains pinned during the controlled scroll check.';
      default: return 'The measurements do not prove one deterministic sticky failure.';
    }
  };

  const inspect = (runId: number, runToken: string) => {
    const target = document.querySelector(config.targetSelector) as HTMLElement | null;
    if (!target) {
      post({
        kind: 'result', runId, runToken,
        inspection: {
          finding: 'inconclusive', working: false,
          summary: summaryFor('inconclusive'), evidence: ['The trusted fixture target was unavailable.'],
          computed: { position: '', insetBlockStart: '', insetBlockEnd: '', zIndex: '' }, ancestors: [],
          geometry: { targetTopBefore: 0, targetTopAfter: 0, targetHeight: 0, containingBlockHeight: 0, scrollOwnerTop: 0, scrollTopBefore: 0, scrollTopAfter: 0, maxScroll: 0, availableTravel: 0 },
          suspectAncestorIndex: null,
        },
      });
      return Promise.resolve();
    }

    const targetStyle = getComputedStyle(target);
    const ancestorElements: Element[] = [];
    let cursor = target.parentElement;
    while (cursor && ancestorElements.length < maxAncestors) {
      ancestorElements.push(cursor);
      cursor = cursor.parentElement;
    }
    inspectedAncestors = ancestorElements;
    const ancestorStyles = ancestorElements.map((element) => getComputedStyle(element));
    const ancestors = ancestorElements.map((element, index) => {
      const style = ancestorStyles[index];
      const node = element as HTMLElement;
      return {
        index,
        selector: labelFor(element),
        tagName: clean(element.tagName.toLowerCase()),
        overflowX: clean(style.overflowX),
        overflowY: clean(style.overflowY),
        display: clean(style.display),
        alignItems: clean(style.alignItems),
        alignSelf: clean(style.alignSelf),
        clientHeight: rounded(node.clientHeight),
        scrollHeight: rounded(node.scrollHeight),
        isScrollContainer: createsScrollMechanism(style),
      };
    });
    const scrollOwnerIndex = ancestorStyles.findIndex(createsScrollMechanism);
    const scrollOwner = (scrollOwnerIndex >= 0
      ? ancestorElements[scrollOwnerIndex]
      : document.scrollingElement || document.documentElement) as HTMLElement;
    const expectedOwner = config.expectedScrollOwnerSelector
      ? document.querySelector(config.expectedScrollOwnerSelector)
      : null;
    const parent = target.parentElement ?? target;
    const parentStyle = getComputedStyle(parent);
    const originalScrollTop = scrollOwner.scrollTop;
    activeScrollOwner = scrollOwner;
    activeScrollTop = originalScrollTop;
    activeScrollRunId = runId;
    activeScrollRunToken = runToken;
    const maxScroll = Math.max(0, scrollOwner.scrollHeight - scrollOwner.clientHeight);
    const firstProbe = Math.min(maxScroll, Math.max(32, Math.min(96, maxScroll * 0.35)));
    const secondProbe = Math.min(maxScroll, firstProbe + Math.max(48, Math.min(128, scrollOwner.clientHeight * 0.5)));

    scrollOwner.scrollTop = firstProbe;
    return twoFrames().then(() => {
      if (latestRunId !== runId || latestRunToken !== runToken) return;
      const beforeRect = target.getBoundingClientRect();
      const containingRect = parent.getBoundingClientRect();
      const ownerRect = scrollOwner.getBoundingClientRect();
      const scrollTopBefore = scrollOwner.scrollTop;

      scrollOwner.scrollTop = secondProbe;
      return twoFrames().then(() => {
        if (latestRunId !== runId || latestRunToken !== runToken) {
          return;
        }
        const afterRect = target.getBoundingClientRect();
        const scrollTopAfter = scrollOwner.scrollTop;
        const availableTravel = Math.max(0, containingRect.height - beforeRect.height);
        const insetBlockStart = clean(targetStyle.insetBlockStart || targetStyle.top || 'auto');
        const insetBlockEnd = clean(targetStyle.insetBlockEnd || targetStyle.bottom || 'auto');
        const hitX = Math.max(0, Math.min(innerWidth - 1, afterRect.left + Math.max(1, afterRect.width / 2)));
        const hitY = Math.max(ownerRect.top + 1, Math.min(ownerRect.bottom - 1, afterRect.top + Math.min(20, Math.max(1, afterRect.height / 2))));
        const hit = document.elementFromPoint(hitX, hitY);
        const covered = Boolean(hit && hit !== target && !target.contains(hit));
        const display = parentStyle.display;
        const stretched = /^(grid|inline-grid|flex|inline-flex)$/.test(display)
          && (targetStyle.alignSelf === 'stretch'
            || (targetStyle.alignSelf === 'auto' && parentStyle.alignItems === 'stretch'))
          && beforeRect.height >= containingRect.height - 2;
        const ownerMismatch = Boolean(expectedOwner && scrollOwner !== expectedOwner);
        const runwayNeeded = Math.min(maxScroll, Math.max(96, beforeRect.height * 1.5));

        let suspectAncestorIndex: number | null = null;
        const measuredFinding = classify({
          position: targetStyle.position,
          insetBlockStart,
          insetBlockEnd,
          ownerMismatch,
          maxScroll,
          stretched,
          availableTravel,
          runwayNeeded,
          covered,
          scrollDelta: scrollTopAfter - scrollTopBefore,
          targetTopDelta: afterRect.top - beforeRect.top,
        });
        const finding = blockedNetworkReference ? 'inconclusive' : measuredFinding;
        if (finding === 'unexpected_scroll_container') {
          suspectAncestorIndex = scrollOwnerIndex >= 0 ? scrollOwnerIndex : null;
        } else if (finding === 'no_scroll_range') {
          suspectAncestorIndex = scrollOwnerIndex >= 0 ? scrollOwnerIndex : null;
        } else if (finding === 'stretched_item') {
          suspectAncestorIndex = ancestorElements.indexOf(parent);
        } else if (finding === 'no_containing_block_runway') {
          suspectAncestorIndex = ancestorElements.indexOf(parent);
        }

        restoreActiveScroll(runId, runToken);
        const configuredSuspect = config.suspectSelector ? document.querySelector(config.suspectSelector) : null;
        highlight(configuredSuspect || (suspectAncestorIndex === null ? null : ancestorElements[suspectAncestorIndex]));

        const evidence = blockedNetworkReference
          ? ['External CSS references are disabled; the trusted case CSS was measured instead.']
          : [
            `position: ${clean(targetStyle.position)}`,
            `inset-block-start: ${insetBlockStart}`,
            `inset-block-end: ${insetBlockEnd}`,
            `scroll range: ${rounded(maxScroll)}px`,
            `available travel: ${rounded(availableTravel)}px`,
            `target top delta: ${rounded(afterRect.top - beforeRect.top)}px`,
          ];
        post({
          kind: 'result', runId, runToken,
          inspection: {
            finding,
            working: finding === 'working',
            summary: blockedNetworkReference
              ? 'External CSS references are disabled in this offline debugging lab.'
              : summaryFor(finding),
            evidence,
            computed: {
              position: clean(targetStyle.position),
              insetBlockStart,
              insetBlockEnd,
              zIndex: clean(targetStyle.zIndex),
            },
            ancestors,
            geometry: {
              targetTopBefore: rounded(beforeRect.top),
              targetTopAfter: rounded(afterRect.top),
              targetHeight: rounded(beforeRect.height),
              containingBlockHeight: rounded(containingRect.height),
              scrollOwnerTop: rounded(ownerRect.top),
              scrollTopBefore: rounded(scrollTopBefore),
              scrollTopAfter: rounded(scrollTopAfter),
              maxScroll: rounded(maxScroll),
              availableTravel: rounded(availableTravel),
            },
            suspectAncestorIndex,
          },
        });
      });
    });
  };

  window.addEventListener('message', (event) => {
    const data = event.data as Record<string, unknown> | null;
    if (event.source !== parentWindow
      || !data
      || data['channel'] !== channel
      || data['version'] !== version
      || data['sessionId'] !== config.sessionId
      || data['frameId'] !== config.frameId
      || data['caseId'] !== config.caseId
      || !Number.isInteger(data['runId'])
      || typeof data['runToken'] !== 'string') return;

    if (data['kind'] === 'highlight') {
      if (data['runId'] !== latestRunId || data['runToken'] !== latestRunToken) return;
      const index = data['ancestorIndex'];
      highlight(index === null
        ? null
        : typeof index === 'number' && index >= 0 && index < inspectedAncestors.length
          ? inspectedAncestors[index]
          : null);
      return;
    }

    if (data['kind'] !== 'inspect'
      || typeof data['css'] !== 'string'
      || data['css'].length > maxCssLength
      || (data['runId'] as number) <= latestRunId
      || !userStyle) return;

    restoreActiveScroll();
    latestRunId = data['runId'] as number;
    latestRunToken = data['runToken'] as string;
    const sanitizedCss = sanitizeCss(data['css'], config.initialCss);
    blockedNetworkReference = sanitizedCss.blockedNetworkReference;
    userStyle.textContent = sanitizedCss.css;
    clearHighlight();
    void inspect(latestRunId, latestRunToken).catch(() => {
      if (latestRunId !== data['runId'] || latestRunToken !== data['runToken']) return;
      restoreActiveScroll(latestRunId, latestRunToken);
      post({
        kind: 'result', runId: latestRunId, runToken: latestRunToken,
        inspection: {
          finding: 'inconclusive', working: false,
          summary: summaryFor('inconclusive'), evidence: ['The controlled measurement could not finish.'],
          computed: { position: '', insetBlockStart: '', insetBlockEnd: '', zIndex: '' }, ancestors: [],
          geometry: { targetTopBefore: 0, targetTopAfter: 0, targetHeight: 0, containingBlockHeight: 0, scrollOwnerTop: 0, scrollTopBefore: 0, scrollTopAfter: 0, maxScroll: 0, availableTravel: 0 },
          suspectAncestorIndex: null,
        },
      });
    });
  });

  post({ kind: 'ready', runId: 0, runToken: config.readyRunToken });
}

// Compile-time guards: changes to the child constants must stay aligned with the host protocol.
void CSS_STICKY_MAX_CSS_LENGTH;
void CSS_STICKY_MAX_ANCESTORS;
void CSS_STICKY_MAX_STRING_LENGTH;
