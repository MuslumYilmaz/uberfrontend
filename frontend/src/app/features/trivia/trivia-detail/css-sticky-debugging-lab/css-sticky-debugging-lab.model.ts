export type CssStickyCaseId =
  | 'missing-inset'
  | 'unexpected-scroll-container'
  | 'no-travel-room'
  | 'flex-grid-stretch'
  | 'sticks-but-hidden';

export type CssStickyFindingId =
  | 'position_not_sticky'
  | 'missing_inset'
  | 'unexpected_scroll_container'
  | 'no_scroll_range'
  | 'no_containing_block_runway'
  | 'stretched_item'
  | 'covered_by_sibling'
  | 'working'
  | 'inconclusive';

export type CssStickyPane = 'code' | 'preview' | 'inspector';
export type CssStickyLabStatus =
  | 'idle'
  | 'activating'
  | 'ready'
  | 'running'
  | 'result'
  | 'error';

export interface CssStickyAncestorSnapshot {
  readonly index: number;
  readonly selector: string;
  readonly tagName: string;
  readonly overflowX: string;
  readonly overflowY: string;
  readonly display: string;
  readonly alignItems: string;
  readonly alignSelf: string;
  readonly clientHeight: number;
  readonly scrollHeight: number;
  readonly isScrollContainer: boolean;
}

export interface CssStickyGeometrySnapshot {
  readonly targetTopBefore: number;
  readonly targetTopAfter: number;
  readonly targetHeight: number;
  readonly containingBlockHeight: number;
  readonly scrollOwnerTop: number;
  readonly scrollTopBefore: number;
  readonly scrollTopAfter: number;
  readonly maxScroll: number;
  readonly availableTravel: number;
}

export interface CssStickyInspection {
  readonly finding: CssStickyFindingId;
  readonly working: boolean;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly computed: {
    readonly position: string;
    readonly insetBlockStart: string;
    readonly insetBlockEnd: string;
    readonly zIndex: string;
  };
  readonly ancestors: readonly CssStickyAncestorSnapshot[];
  readonly geometry: CssStickyGeometrySnapshot;
  readonly suspectAncestorIndex: number | null;
}

export interface CssStickyLabState {
  readonly selectedCaseId: CssStickyCaseId;
  readonly pane: CssStickyPane;
  readonly status: CssStickyLabStatus;
  readonly editorActive: boolean;
  readonly editorFallback: boolean;
  readonly css: string;
  readonly stale: boolean;
  readonly inspection: CssStickyInspection | null;
  readonly errorMessage: string;
  readonly attempt: number;
  readonly sawBrokenFinding: boolean;
  readonly completed: boolean;
}

export function createCssStickyLabState(
  caseId: CssStickyCaseId,
  initialCss: string,
): CssStickyLabState {
  return {
    selectedCaseId: caseId,
    pane: 'code',
    status: 'idle',
    editorActive: false,
    editorFallback: false,
    css: initialCss,
    stale: false,
    inspection: null,
    errorMessage: '',
    attempt: 1,
    sawBrokenFinding: false,
    completed: false,
  };
}

export function isBrokenStickyFinding(finding: CssStickyFindingId): boolean {
  return finding !== 'working' && finding !== 'inconclusive';
}

export function clampCssSource(source: string, maxLength = 20_000): string {
  return String(source ?? '').slice(0, maxLength);
}
