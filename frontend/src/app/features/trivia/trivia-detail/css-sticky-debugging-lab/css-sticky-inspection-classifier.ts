import type { CssStickyFindingId } from './css-sticky-debugging-lab.model';

export interface CssStickyClassificationSnapshot {
  readonly position: string;
  readonly insetBlockStart: string;
  readonly insetBlockEnd: string;
  readonly ownerMismatch: boolean;
  readonly maxScroll: number;
  readonly stretched: boolean;
  readonly availableTravel: number;
  readonly runwayNeeded: number;
  readonly covered: boolean;
  readonly scrollDelta: number;
  readonly targetTopDelta: number;
}

/** Pure, deterministic policy shared by the host tests and the opaque preview bridge. */
export function classifyCssStickySnapshot(
  snapshot: CssStickyClassificationSnapshot,
): CssStickyFindingId {
  if (snapshot.position !== 'sticky') return 'position_not_sticky';
  const hasBlockAxisInset = [snapshot.insetBlockStart, snapshot.insetBlockEnd]
    .some((inset) => Boolean(inset) && inset !== 'auto');
  if (!hasBlockAxisInset) return 'missing_inset';
  if (snapshot.ownerMismatch) return 'unexpected_scroll_container';
  if (snapshot.maxScroll <= 1) return 'no_scroll_range';
  if (snapshot.stretched) return 'stretched_item';
  if (snapshot.availableTravel < snapshot.runwayNeeded) return 'no_containing_block_runway';
  if (snapshot.covered) return 'covered_by_sibling';
  if (snapshot.scrollDelta > 4 && Math.abs(snapshot.targetTopDelta) <= 2) return 'working';
  return 'inconclusive';
}
