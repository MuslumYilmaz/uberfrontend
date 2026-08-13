import type {
  CssStickyAncestorSnapshot,
  CssStickyCaseId,
  CssStickyFindingId,
  CssStickyGeometrySnapshot,
  CssStickyInspection,
} from './css-sticky-debugging-lab.model';

export const CSS_STICKY_PREVIEW_CHANNEL = 'FA_CSS_STICKY_INSPECTOR';
export const CSS_STICKY_PREVIEW_VERSION = 1;
export const CSS_STICKY_MAX_CSS_LENGTH = 20_000;
export const CSS_STICKY_MAX_ANCESTORS = 12;
export const CSS_STICKY_MAX_STRING_LENGTH = 80;

export interface CssStickyBridgeConfig {
  readonly channel: typeof CSS_STICKY_PREVIEW_CHANNEL;
  readonly version: typeof CSS_STICKY_PREVIEW_VERSION;
  readonly sessionId: string;
  readonly frameId: string;
  readonly readyRunToken: string;
  readonly caseId: CssStickyCaseId;
  readonly initialCss: string;
  readonly targetSelector: string;
  readonly expectedScrollOwnerSelector?: string;
  readonly suspectSelector?: string;
}

export type CssStickyHostMessage =
  | {
    readonly channel: typeof CSS_STICKY_PREVIEW_CHANNEL;
    readonly version: typeof CSS_STICKY_PREVIEW_VERSION;
    readonly sessionId: string;
    readonly frameId: string;
    readonly caseId: CssStickyCaseId;
    readonly kind: 'inspect';
    readonly runId: number;
    readonly runToken: string;
    readonly css: string;
  }
  | {
    readonly channel: typeof CSS_STICKY_PREVIEW_CHANNEL;
    readonly version: typeof CSS_STICKY_PREVIEW_VERSION;
    readonly sessionId: string;
    readonly frameId: string;
    readonly caseId: CssStickyCaseId;
    readonly kind: 'highlight';
    readonly runId: number;
    readonly runToken: string;
    readonly ancestorIndex: number | null;
  };

export type CssStickyChildMessage =
  | {
    readonly channel: typeof CSS_STICKY_PREVIEW_CHANNEL;
    readonly version: typeof CSS_STICKY_PREVIEW_VERSION;
    readonly sessionId: string;
    readonly frameId: string;
    readonly caseId: CssStickyCaseId;
    readonly kind: 'ready';
    readonly runId: 0;
    readonly runToken: string;
  }
  | {
    readonly channel: typeof CSS_STICKY_PREVIEW_CHANNEL;
    readonly version: typeof CSS_STICKY_PREVIEW_VERSION;
    readonly sessionId: string;
    readonly frameId: string;
    readonly caseId: CssStickyCaseId;
    readonly kind: 'result';
    readonly runId: number;
    readonly runToken: string;
    readonly inspection: CssStickyInspection;
  };

const FINDINGS: ReadonlySet<CssStickyFindingId> = new Set([
  'position_not_sticky',
  'missing_inset',
  'unexpected_scroll_container',
  'no_scroll_range',
  'no_containing_block_runway',
  'stretched_item',
  'covered_by_sibling',
  'working',
  'inconclusive',
]);

export function normalizeCssStickyInspection(value: unknown): CssStickyInspection | null {
  if (!isRecord(value) || !FINDINGS.has(value['finding'] as CssStickyFindingId)) return null;

  const computed = value['computed'];
  const geometry = value['geometry'];
  const ancestors = value['ancestors'];
  const evidence = value['evidence'];
  if (!isRecord(computed)
    || !isRecord(geometry)
    || !Array.isArray(ancestors)
    || !Array.isArray(evidence)) return null;

  const normalizedAncestors = ancestors
    .slice(0, CSS_STICKY_MAX_ANCESTORS)
    .map(normalizeAncestor)
    .filter((item): item is CssStickyAncestorSnapshot => item !== null);
  if (normalizedAncestors.length !== Math.min(ancestors.length, CSS_STICKY_MAX_ANCESTORS)) return null;

  const normalizedGeometry = normalizeGeometry(geometry);
  if (!normalizedGeometry) return null;

  const suspect = value['suspectAncestorIndex'];
  const suspectAncestorIndex = suspect === null
    ? null
    : boundedInteger(suspect, 0, CSS_STICKY_MAX_ANCESTORS - 1);
  if (suspectAncestorIndex === null && suspect !== null) return null;

  return {
    finding: value['finding'] as CssStickyFindingId,
    working: value['working'] === true,
    summary: boundedString(value['summary']),
    evidence: evidence.slice(0, 6).map(boundedString),
    computed: {
      position: boundedString(computed['position']),
      insetBlockStart: boundedString(computed['insetBlockStart']),
      insetBlockEnd: boundedString(computed['insetBlockEnd']),
      zIndex: boundedString(computed['zIndex']),
    },
    ancestors: normalizedAncestors,
    geometry: normalizedGeometry,
    suspectAncestorIndex,
  };
}

function normalizeAncestor(value: unknown): CssStickyAncestorSnapshot | null {
  if (!isRecord(value)) return null;
  const index = boundedInteger(value['index'], 0, CSS_STICKY_MAX_ANCESTORS - 1);
  if (index === null) return null;
  return {
    index,
    selector: boundedString(value['selector']),
    tagName: boundedString(value['tagName']),
    overflowX: boundedString(value['overflowX']),
    overflowY: boundedString(value['overflowY']),
    display: boundedString(value['display']),
    alignItems: boundedString(value['alignItems']),
    alignSelf: boundedString(value['alignSelf']),
    clientHeight: boundedNumber(value['clientHeight']),
    scrollHeight: boundedNumber(value['scrollHeight']),
    isScrollContainer: value['isScrollContainer'] === true,
  };
}

function normalizeGeometry(value: Record<string, unknown>): CssStickyGeometrySnapshot | null {
  const fields = [
    'targetTopBefore',
    'targetTopAfter',
    'targetHeight',
    'containingBlockHeight',
    'scrollOwnerTop',
    'scrollTopBefore',
    'scrollTopAfter',
    'maxScroll',
    'availableTravel',
  ] as const;
  const normalized = Object.fromEntries(fields.map((field) => [field, boundedNumber(value[field])])) as unknown as CssStickyGeometrySnapshot;
  return fields.every((field) => Number.isFinite(normalized[field])) ? normalized : null;
}

function boundedString(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, CSS_STICKY_MAX_STRING_LENGTH) : '';
}

function boundedNumber(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.round(Math.max(-10_000_000, Math.min(10_000_000, numeric)) * 100) / 100;
}

function boundedInteger(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
