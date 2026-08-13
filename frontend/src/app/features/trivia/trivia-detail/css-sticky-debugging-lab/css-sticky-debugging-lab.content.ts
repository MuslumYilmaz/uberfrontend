import { CssStickyCaseId, CssStickyFindingId } from './css-sticky-debugging-lab.model';

export interface CssStickyCase {
  readonly id: CssStickyCaseId;
  readonly label: string;
  readonly symptom: string;
  readonly explanation: string;
  readonly inspectorHint: string;
  readonly html: string;
  readonly initialCss: string;
  readonly fixedCss: string;
  readonly suggestedFix: string;
  readonly finding: CssStickyFindingId;
  readonly targetSelector: string;
  readonly expectedScrollOwnerSelector?: string;
  readonly suspectSelector?: string;
}

const ROWS = Array.from(
  { length: 8 },
  (_, index) => `    <p class="demo-row">Scrollable row ${index + 1}</p>`,
).join('\n');

export const CSS_STICKY_CASE_IDS: readonly CssStickyCaseId[] = [
  'missing-inset',
  'unexpected-scroll-container',
  'no-travel-room',
  'flex-grid-stretch',
  'sticks-but-hidden',
] as const;

export const CSS_STICKY_CASES: readonly CssStickyCase[] = [
  {
    id: 'missing-inset',
    label: 'Missing inset',
    symptom: 'The heading scrolls away even though its position computes to sticky.',
    explanation: 'Sticky needs a non-auto inset on the axis where it should stick. Here, top remains auto.',
    inspectorHint: 'Compare computed position with the block-start inset.',
    html: `<main class="demo-scroll" data-scroll-root tabindex="0" aria-label="Scrollable sticky preview">
  <section class="demo-stack">
    <h2 class="sticky-target" data-sticky-target>Release checklist</h2>
${ROWS}
  </section>
</main>`,
    initialCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.sticky-target {
  position: sticky;
  padding: 12px;
  background: #dbeafe;
}`,
    fixedCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #dbeafe;
}`,
    suggestedFix: 'Add a non-auto block-start inset such as top: 0.',
    finding: 'missing_inset',
    targetSelector: '[data-sticky-target]',
    expectedScrollOwnerSelector: '[data-scroll-root]',
  },
  {
    id: 'unexpected-scroll-container',
    label: 'Wrong scroll owner',
    symptom: 'The heading sticks inside a short wrapper, then leaves while the outer panel keeps scrolling.',
    explanation: 'The nearest ancestor with scrolling overflow owns the sticky behavior, even when another element appears to be the intended viewport.',
    inspectorHint: 'Walk upward until overflow creates the first scroll mechanism.',
    html: `<main class="page-scroll" data-scroll-root tabindex="0" aria-label="Scrollable sticky preview">
  <section class="unexpected-owner" data-unexpected-owner>
    <h2 class="sticky-target" data-sticky-target>Build status</h2>
    <p class="demo-row">Nested row 1</p>
    <p class="demo-row">Nested row 2</p>
    <p class="demo-row">Nested row 3</p>
  </section>
${ROWS}
</main>`,
    initialCss: `.page-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.unexpected-owner {
  height: 180px;
  overflow-y: auto;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #dcfce7;
}`,
    fixedCss: `.page-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.unexpected-owner {
  min-height: 620px;
  overflow: visible;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #dcfce7;
}`,
    suggestedFix: 'Remove the accidental inner overflow so the intended panel becomes the scroll owner.',
    finding: 'unexpected_scroll_container',
    targetSelector: '[data-sticky-target]',
    expectedScrollOwnerSelector: '[data-scroll-root]',
    suspectSelector: '[data-unexpected-owner]',
  },
  {
    id: 'no-travel-room',
    label: 'No travel room',
    symptom: 'The sticky badge reaches the boundary of its tiny containing block immediately.',
    explanation: 'Sticky is constrained by its containing block. A target cannot travel through content that sits outside that boundary.',
    inspectorHint: 'Compare the target height with its containing block and available travel.',
    html: `<main class="demo-scroll" data-scroll-root tabindex="0" aria-label="Scrollable sticky preview">
  <section class="short-boundary" data-short-boundary>
    <h2 class="sticky-target" data-sticky-target>On-call</h2>
    <p>One short row inside the boundary.</p>
  </section>
  <section class="outside-content">
${ROWS}
  </section>
</main>`,
    initialCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.short-boundary {
  border: 2px dashed #f59e0b;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #fef3c7;
}`,
    fixedCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.short-boundary {
  min-height: 620px;
  border: 2px dashed #f59e0b;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #fef3c7;
}`,
    suggestedFix: 'Keep the sticky element inside the content boundary it needs to travel through.',
    finding: 'no_containing_block_runway',
    targetSelector: '[data-sticky-target]',
    expectedScrollOwnerSelector: '[data-scroll-root]',
    suspectSelector: '[data-short-boundary]',
  },
  {
    id: 'flex-grid-stretch',
    label: 'Grid stretch',
    symptom: 'The sidebar stretches to the full grid track, leaving no useful sticky travel.',
    explanation: 'Grid and flex alignment can stretch the sticky item. Its used size, not position: sticky itself, removes the travel range.',
    inspectorHint: 'Inspect align-items on the parent and align-self on the sticky item.',
    html: `<main class="demo-scroll" data-scroll-root tabindex="0" aria-label="Scrollable sticky preview">
  <section class="dashboard-grid" data-stretch-parent>
    <aside class="sticky-target" data-sticky-target>Filters</aside>
    <div class="dashboard-content">
${ROWS}
    </div>
  </section>
</main>`,
    initialCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: stretch;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #ede9fe;
}`,
    fixedCss: `.demo-scroll {
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: start;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #ede9fe;
}`,
    suggestedFix: 'Stop stretching the sticky item with align-items: start or align-self: start.',
    finding: 'stretched_item',
    targetSelector: '[data-sticky-target]',
    expectedScrollOwnerSelector: '[data-scroll-root]',
    suspectSelector: '[data-stretch-parent]',
  },
  {
    id: 'sticks-but-hidden',
    label: 'Sticks but is covered',
    symptom: 'Geometry says the heading sticks, but a sibling layer paints over it.',
    explanation: 'This is a paint-order problem, not a sticky-positioning failure. z-index matters only after the sticky geometry works.',
    inspectorHint: 'Compare the sticky target with the element returned at its visible center point.',
    html: `<main class="demo-scroll" data-scroll-root tabindex="0" aria-label="Scrollable sticky preview">
  <div class="covering-toolbar" data-covering-layer>Preview toolbar</div>
  <section class="demo-stack">
    <h2 class="sticky-target" data-sticky-target>Deploy history</h2>
${ROWS}
  </section>
</main>`,
    initialCss: `.demo-scroll {
  position: relative;
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.covering-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 16px;
  background: #fecaca;
}

.sticky-target {
  position: sticky;
  top: 0;
  padding: 12px;
  background: #dbeafe;
}`,
    fixedCss: `.demo-scroll {
  position: relative;
  height: 260px;
  overflow-y: auto;
  padding: 0 16px;
}

.covering-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 16px;
  background: #fecaca;
}

.sticky-target {
  position: sticky;
  top: 52px;
  z-index: 3;
  padding: 12px;
  background: #dbeafe;
}`,
    suggestedFix: 'Offset the sticky target below the toolbar and put it in the intended paint order.',
    finding: 'covered_by_sibling',
    targetSelector: '[data-sticky-target]',
    expectedScrollOwnerSelector: '[data-scroll-root]',
    suspectSelector: '[data-covering-layer]',
  },
] as const;

export function getCssStickyCase(id: CssStickyCaseId): CssStickyCase {
  const stickyCase = CSS_STICKY_CASES.find((candidate) => candidate.id === id);
  if (!stickyCase) {
    throw new Error(`Unknown CSS sticky case: ${id}`);
  }
  return stickyCase;
}
