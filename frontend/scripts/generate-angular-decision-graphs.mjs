#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { cdnQuestionsDir, repoRoot } from './content-paths.mjs';

const CHECK = process.argv.includes('--check');
const catalogPath = path.join(cdnQuestionsDir, 'angular', 'coding.json');
const outputDir = path.join(cdnQuestionsDir, 'angular', 'decision-graphs');

const definitions = [
  {
    questionId: 'angular-contact-form-starter',
    nodes: [
      {
        id: 'd1-standalone-form-imports',
        title: 'Import only the template dependencies',
        snippet: 'imports: [ReactiveFormsModule, HttpClientModule],',
        why: 'The standalone component needs reactive-form directives and HttpClient, while Angular built-in control flow does not require CommonModule.',
        alternative: 'Keep CommonModule in every standalone component even when the template does not use its directives or pipes.',
        tradeoff: 'Minimal imports make dependencies explicit, but a later template pipe or directive must be added intentionally.',
      },
      {
        id: 'd2-touch-before-validation',
        title: 'Expose validation before returning',
        snippet: 'this.contactForm.markAllAsTouched();',
        why: 'Marking controls touched ensures invalid fields reveal feedback before submission exits early.',
        alternative: 'Return immediately on an invalid form and leave untouched fields without visible guidance.',
        tradeoff: 'Showing every current error is clearer on submit, though quieter validation can be preferable while the user is still typing.',
      },
      {
        id: 'd3-own-request-lifecycle',
        title: 'Own success and error state around the request',
        snippet: "this.http.post('https://jsonplaceholder.typicode.com/posts', this.contactForm.value).subscribe({",
        why: 'The component must reset loading state in both request outcomes and only clear the form after success.',
        alternative: 'Set a success message before the request resolves or leave isSubmitting true after an error.',
        tradeoff: 'Explicit handlers duplicate a small amount of cleanup, but they keep the UI state deterministic.',
      },
    ],
  },
  {
    questionId: 'angular-todo-list-starter',
    nodes: [
      {
        id: 'd1-standalone-imports',
        title: 'Import the form binding dependency',
        snippet: 'imports: [FormsModule],',
        why: 'FormsModule is required for ngModel, while the @for and @if blocks are built into modern Angular templates.',
        alternative: 'Keep CommonModule solely for legacy structural directives that the template no longer uses.',
        tradeoff: 'The dependency list stays smaller, but future CommonModule pipes must be imported if they are introduced.',
      },
      {
        id: 'd2-local-todo-state',
        title: 'Keep todo state local and explicit',
        snippet: 'todos: Todo[] = [];',
        why: 'A local array plus an id counter is enough for add, toggle, remove, and clear-completed behavior in this component-sized exercise.',
        alternative: 'Introduce a service, store, or DOM-derived state for a small local interaction.',
        tradeoff: 'Local component state is easy to test and read, while larger apps may later move shared todo state elsewhere.',
      },
      {
        id: 'd3-trim-and-ignore-empty-input',
        title: 'Reject empty todo text before mutation',
        snippet: 'if (!text) {',
        why: 'Trimming first prevents whitespace-only todos from entering the rendered list or persisted state.',
        alternative: 'Push every input value and clean the list later.',
        tradeoff: 'The early return adds a small branch, but it keeps downstream rendering and tests simpler.',
      },
      {
        id: 'd4-append-stable-id',
        title: 'Append items with stable identity',
        snippet: '{ id: this.nextId++, text, done: false }',
        why: 'The generated id gives Angular @for track todo.id a stable identity for each row as items are added and removed.',
        alternative: 'Track by array index or reuse the text as an identity.',
        tradeoff: 'An id counter is small bookkeeping, but it avoids row identity drift when duplicate text or removals occur.',
      },
      {
        id: 'd5-toggle-completion',
        title: 'Toggle the selected todo only',
        snippet: 'todo.done = !todo.done;',
        why: 'The checkbox interaction should change completion for the row the user touched without rebuilding unrelated items.',
        alternative: 'Infer completion from CSS classes or toggle every item through shared state.',
        tradeoff: 'Direct mutation is concise for this local model; immutable updates can be preferable when state is shared.',
      },
      {
        id: 'd6-remove-by-id',
        title: 'Remove by stable id',
        snippet: 'this.todos = this.todos.filter(t => t.id !== todo.id);',
        why: 'Filtering by id deletes the exact row even when multiple todos have the same text.',
        alternative: 'Remove by visible label or by current array index.',
        tradeoff: 'Id-based removal needs a generated id, but it remains correct after sorting, filtering, or duplicate entries.',
      },
      {
        id: 'd7-clear-completed',
        title: 'Derive the remaining active list',
        snippet: 'this.todos = this.todos.filter(t => !t.done);',
        why: 'Clear completed should preserve active todos and remove only items already marked done.',
        alternative: 'Reset the entire list or manually splice completed rows in place.',
        tradeoff: 'A filter pass is simple and predictable for this list size, though very large lists might need a different data model.',
      },
    ],
  },
  {
    questionId: 'angular-image-slider-starter',
    nodes: [
      {
        id: 'd1-render-current-slide',
        title: 'Render only when a current slide exists',
        snippet: '@if (currentSlide; as slide) {',
        why: 'The @if alias keeps image bindings inside the non-null branch and avoids repeated getter reads in the template.',
        alternative: 'Render the figure unconditionally and use non-null assertions for every slide property.',
        tradeoff: 'The explicit branch adds template structure, but it keeps empty-data behavior safe.',
      },
      {
        id: 'd2-track-slide-identity',
        title: 'Track indicator buttons by slide id',
        snippet: '@for (slide of slides; track slide.id; let i = $index) {',
        why: 'Stable ids let Angular retain the correct indicator DOM as slides are reordered or replaced.',
        alternative: 'Track every indicator by its current array index.',
        tradeoff: 'Stable tracking needs an id on each slide, but it avoids identity drift when the collection changes.',
      },
      {
        id: 'd3-guard-navigation-bounds',
        title: 'Reject out-of-range navigation',
        snippet: 'if (index < 0 || index >= this.totalSlides) return;',
        why: 'The same boundary contract protects dot navigation and keeps currentSlide valid.',
        alternative: 'Assign any requested index and rely on disabled previous or next buttons.',
        tradeoff: 'A guard is a small extra branch, but it makes the method safe for all callers.',
      },
    ],
  },
  {
    questionId: 'angular-tabs-switcher',
    nodes: [
      {
        id: 'd1-model-tablist-semantics',
        title: 'Declare the tablist relationship',
        snippet: '<nav class="tabs" role="tablist" aria-label="Example tabs">',
        why: 'The tablist role gives assistive technology the correct grouping for the interactive tab controls.',
        alternative: 'Use visually styled buttons with no shared navigation semantics.',
        tradeoff: 'ARIA relationships add attributes to maintain, but they expose the component structure beyond visual styling.',
      },
      {
        id: 'd2-publish-selected-state',
        title: 'Publish selected state on each tab',
        snippet: '[attr.aria-selected]="isActive(\'overview\')"',
        why: 'The accessible selected state must update from the same activeTab source that drives styling and panels.',
        alternative: 'Change only the active CSS class and leave screen readers with stale state.',
        tradeoff: 'The binding repeats per button, but it keeps visual and semantic state synchronized.',
      },
      {
        id: 'd3-render-one-active-panel',
        title: 'Render panels from active state',
        snippet: "@if (isActive('overview')) {",
        why: 'Built-in @if ensures inactive panels leave the DOM so exactly one tabpanel is exposed.',
        alternative: 'Render every panel and hide inactive content only with CSS.',
        tradeoff: 'Conditional rendering recreates panel DOM on selection, but it produces a simpler accessibility tree.',
      },
      {
        id: 'd4-use-one-state-source',
        title: 'Use one typed active-tab source',
        snippet: 'this.activeTab = tab;',
        why: 'A single TabId value drives active classes, aria-selected, and panel visibility without duplicated booleans.',
        alternative: 'Maintain a separate boolean for each tab and panel.',
        tradeoff: 'A union type is slightly more formal, but it prevents impossible multi-active states.',
      },
    ],
  },
  {
    questionId: 'angular-filterable-user-list',
    nodes: [
      {
        id: 'd1-import-template-features',
        title: 'Import forms and the pipe dependency',
        snippet: 'imports: [CommonModule, FormsModule],',
        why: 'FormsModule supports ngModel and CommonModule remains necessary for the TitleCasePipe used by the external template.',
        alternative: 'Remove CommonModule because modern @for no longer needs it, without checking remaining pipe usage.',
        tradeoff: 'Keeping only verified imports avoids dead dependencies while preserving template compilation.',
      },
      {
        id: 'd2-normalize-search-once',
        title: 'Normalize the search term once',
        snippet: 'const term = this.searchTerm.trim().toLowerCase();',
        why: 'One normalized value makes name matching case-insensitive and avoids repeated cleanup inside the filter.',
        alternative: 'Compare raw input separately for every user row.',
        tradeoff: 'Normalization allocates a small string per getter run, but the filtering rules stay readable.',
      },
      {
        id: 'd3-apply-role-filter-explicitly',
        title: 'Treat all as the role wildcard',
        snippet: "if (this.selectedRole !== 'all' && user.role !== this.selectedRole) {",
        why: 'The wildcard must bypass role rejection while concrete roles match exactly.',
        alternative: 'Compare every user role directly to the selected value, including all.',
        tradeoff: 'The explicit branch is slightly longer, but it makes the filter contract unambiguous.',
      },
      {
        id: 'd4-compose-active-filter',
        title: 'Compose the active-only constraint',
        snippet: 'if (this.showOnlyActive && !user.active) {',
        why: 'Inactive users are rejected only when the toggle is enabled, preserving the original collection.',
        alternative: 'Mutate the source users array whenever the toggle changes.',
        tradeoff: 'Derived filtering reruns with state changes, but the canonical data remains intact.',
      },
    ],
  },
  {
    questionId: 'angular-faq-accordion',
    nodes: [
      {
        id: 'd1-render-open-answer',
        title: 'Render an answer only while open',
        snippet: '@if (isOpen) {',
        why: 'The child receives controlled state and uses built-in @if to keep closed answers out of the DOM.',
        alternative: 'Keep every answer mounted and toggle visibility with CSS alone.',
        tradeoff: 'Conditional rendering recreates answer DOM, but it keeps the visible and accessibility state aligned.',
      },
      {
        id: 'd2-track-faq-rows',
        title: 'Track FAQ rows by stable question text',
        snippet: '@for (item of faqItems; track item.question; let i = $index) {',
        why: 'The question is stable in this static collection and preserves child identity across parent updates.',
        alternative: 'Track by the current index regardless of item identity.',
        tradeoff: 'Question text must remain unique; a dedicated id would be better if content becomes editable.',
      },
      {
        id: 'd3-support-multiple-open-mode',
        title: 'Treat open indexes like a set',
        snippet: 'if (this.allowMultiple) {',
        why: 'Multiple-open mode adds or removes only the selected index without disturbing other open items.',
        alternative: 'Replace the full open list on every toggle in both modes.',
        tradeoff: 'Two state branches add logic, but they preserve the distinct accordion modes.',
      },
      {
        id: 'd4-enforce-single-open-mode',
        title: 'Keep one index in single-open mode',
        snippet: 'this.openIndexes = [index];',
        why: 'Replacing the array with the selected index guarantees that only one answer stays open.',
        alternative: 'Append the index and clean up extra open rows later.',
        tradeoff: 'The mode closes any previously open answer immediately, which is the expected accordion behavior.',
      },
    ],
  },
  {
    questionId: 'angular-pagination-table',
    nodes: [
      {
        id: 'd1-derive-total-pages',
        title: 'Derive total pages from data size',
        snippet: 'return Math.ceil(this.users.length / this.pageSize) || 1;',
        why: 'The page count follows the current collection and still provides one stable page for an empty dataset.',
        alternative: 'Hard-code the number of pages independently from the rows.',
        tradeoff: 'A minimum of one simplifies controls, though some products may prefer an explicit zero-page empty state.',
      },
      {
        id: 'd2-slice-current-page',
        title: 'Derive only the visible rows',
        snippet: 'return this.users.slice(start, end);',
        why: 'A non-mutating slice keeps the source data intact while exposing exactly one page.',
        alternative: 'Splice the canonical users array as navigation changes.',
        tradeoff: 'The getter creates a small array per evaluation, but navigation remains reversible and predictable.',
      },
      {
        id: 'd3-guard-last-page',
        title: 'Stop navigation at the last page',
        snippet: 'if (!this.isLastPage) {',
        why: 'The guard keeps currentPage inside the derived page range even if the method is called directly.',
        alternative: 'Rely only on a disabled Next button in the template.',
        tradeoff: 'Duplicating the boundary in component logic makes the method robust for keyboard and programmatic callers.',
      },
    ],
  },
  {
    questionId: 'angular-multi-step-form-starter',
    nodes: [
      {
        id: 'd1-switch-step-content',
        title: 'Render one step from the current index',
        snippet: '@switch (currentStep) {',
        why: 'Built-in @switch keeps the form in one component while exposing only the active step content.',
        alternative: 'Mount every step at once and hide inactive sections with CSS.',
        tradeoff: 'Step DOM is recreated during navigation, but the template state is explicit and easier to test.',
      },
      {
        id: 'd2-gate-next-by-current-group',
        title: 'Validate the current group before advancing',
        snippet: 'group.markAllAsTouched();',
        why: 'Only the active step is surfaced and validated before currentStep can move forward.',
        alternative: 'Advance first and reveal validation errors on the next screen.',
        tradeoff: 'Users must resolve current-step errors before continuing, which protects final form completeness.',
      },
      {
        id: 'd3-bind-next-disabled-state',
        title: 'Expose the same next-step contract in the UI',
        snippet: '[disabled]="!canGoNext"',
        why: 'The button state reflects the derived validity rule while the method guard remains the final protection.',
        alternative: 'Enable Next unconditionally and depend only on click-time validation.',
        tradeoff: 'Disabled controls communicate readiness early, though inline errors are still needed to explain why.',
      },
      {
        id: 'd4-validate-before-submit',
        title: 'Validate the full form at submission',
        snippet: 'this.form.markAllAsTouched();',
        why: 'Final submission rechecks every nested group and exposes any invalid field before reading the form value.',
        alternative: 'Assume step navigation guarantees validity forever.',
        tradeoff: 'The final validation is redundant in the happy path, but protects against programmatic state changes.',
      },
    ],
  },
  {
    questionId: 'angular-star-rating',
    nodes: [
      {
        id: 'd1-render-stars-with-stable-values',
        title: 'Track stars by their numeric value',
        snippet: '@for (star of stars; track star) {',
        why: 'Each generated star value is unique and stable, so Angular can retain the correct button identity.',
        alternative: 'Track the buttons by an unrelated mutable object or omit a track expression.',
        tradeoff: 'Numeric tracking assumes each value is unique, which holds for the one-through-max range.',
      },
      {
        id: 'd2-derive-configurable-range',
        title: 'Derive the selectable range from max',
        snippet: 'return Array.from({ length: this.max }, (_, i) => i + 1);',
        why: 'The child component renders the configured number of one-based rating choices without hard-coded markup.',
        alternative: 'Write five separate star buttons regardless of max.',
        tradeoff: 'The getter allocates an array, but the API remains reusable for different rating scales.',
      },
      {
        id: 'd3-emit-two-way-binding-update',
        title: 'Emit the accepted rating',
        snippet: 'this.ratingChange.emit(this.rating);',
        why: 'The ratingChange output completes Angular two-way binding so the parent currentRating stays synchronized.',
        alternative: 'Update only the child input field and leave the parent value stale.',
        tradeoff: 'The component owns both local state and an event, but consumers get a familiar bindable API.',
      },
    ],
  },
  {
    questionId: 'angular-dynamic-table-starter',
    nodes: [
      {
        id: 'd1-import-form-binding',
        title: 'Import ngModel for numeric controls',
        snippet: 'imports: [FormsModule],',
        why: 'FormsModule is the only external template dependency; built-in @if and @for do not require CommonModule.',
        alternative: 'Keep CommonModule for control flow that Angular now provides directly.',
        tradeoff: 'Minimal imports stay clear, but any later CommonModule pipe must be added explicitly.',
      },
      {
        id: 'd2-render-grid-or-empty-state',
        title: 'Render a grid only for positive dimensions',
        snippet: '@if (rows.length && cols.length) {',
        why: 'The branch prevents an empty table shell and gives zero dimensions a clear fallback state.',
        alternative: 'Always render table markup even when one dimension has no cells.',
        tradeoff: 'The conditional adds a separate empty state, but the visible result is easier to understand.',
      },
      {
        id: 'd3-track-generated-rows',
        title: 'Track generated rows by stable numeric value',
        snippet: '@for (row of rows; track row; let rowIndex = $index) {',
        why: 'The generated row values are unique and let Angular preserve row identity across dimension changes.',
        alternative: 'Track only by the current index without a stable row value.',
        tradeoff: 'Numeric identity is simple for this generated range, while richer row data would benefit from explicit ids.',
      },
      {
        id: 'd4-bound-user-dimensions',
        title: 'Clamp requested dimensions',
        snippet: 'const clamped = Math.max(0, Math.min(n, 20));',
        why: 'Bounding rows and columns prevents negative or unreasonably large grids from reaching the DOM.',
        alternative: 'Trust any numeric input and allocate arrays directly from it.',
        tradeoff: 'The cap limits the demo to twenty rows or columns, but it protects preview responsiveness.',
      },
    ],
  },
  {
    questionId: 'angular-nested-checkboxes',
    nodes: [
      {
        id: 'd1-own-parent-native-state',
        title: 'Access the parent checkbox for indeterminate state',
        snippet: "@ViewChild('parentBox', { static: true }) parentBox!: ElementRef<HTMLInputElement>;",
        why: 'The indeterminate property is a live DOM property rather than a normal HTML attribute.',
        alternative: 'Represent partial selection with an indeterminate attribute in the template.',
        tradeoff: 'ViewChild introduces direct element access, but it is appropriate for this native checkbox property.',
      },
      {
        id: 'd2-propagate-parent-selection',
        title: 'Apply parent selection to every child',
        snippet: 'this.children = this.children.map(() => checked);',
        why: 'Replacing the child-state array makes the parent toggle deterministic for both select-all and clear-all.',
        alternative: 'Update only the first child or derive child state from the parent element later.',
        tradeoff: 'The map allocates a small array, but Angular receives a clear state update.',
      },
      {
        id: 'd3-represent-partial-selection',
        title: 'Set the mixed parent state',
        snippet: 'parent.indeterminate = true;',
        why: 'A partially selected child set must clear checked and expose the native indeterminate visual state.',
        alternative: 'Treat any selected child as a fully checked parent.',
        tradeoff: 'The parent now has three visual states, which accurately communicates the child aggregate.',
      },
    ],
  },
  {
    questionId: 'angular-autocomplete-search-starter',
    nodes: [
      {
        id: 'd1-debounce-query-input',
        title: 'Debounce search work',
        snippet: 'debounceTime(300),',
        why: 'The stream waits for a short pause so rapid keystrokes do not trigger a search for every input event.',
        alternative: 'Run the filter and delayed result pipeline immediately for every keypress.',
        tradeoff: 'Debouncing reduces churn but intentionally delays visible suggestions.',
      },
      {
        id: 'd2-switch-to-latest-query',
        title: 'Keep only the latest query stream',
        snippet: 'switchMap((q: string) => (q ? this.search(q) : of([] as string[])))',
        why: 'switchMap discards stale delayed searches when a newer query arrives.',
        alternative: 'Merge every pending search and allow older results to arrive after newer input.',
        tradeoff: 'Previous work is abandoned, which is correct for autocomplete but not for operations that must all complete.',
      },
      {
        id: 'd3-read-rendered-options',
        title: 'Navigate the currently rendered options',
        snippet: "const options = this.host.nativeElement.querySelectorAll('[role=\"option\"]');",
        why: 'Keyboard movement uses the actual option count after filtering and empty-state changes.',
        alternative: 'Navigate against the full city dataset regardless of what is rendered.',
        tradeoff: 'DOM lookup couples navigation to rendered roles, but it keeps activeIndex inside the visible list.',
      },
      {
        id: 'd4-close-on-outside-pointer',
        title: 'Close when interaction leaves the component',
        snippet: 'if (!this.host.nativeElement.contains(target)) {',
        why: 'The document listener dismisses suggestions without closing when the click remains inside the autocomplete.',
        alternative: 'Close on every document mousedown, including option selection.',
        tradeoff: 'Containment checking adds DOM awareness, but it preserves mouse selection behavior.',
      },
      {
        id: 'd5-escape-highlighted-content',
        title: 'Escape text before adding highlight markup',
        snippet: 'private escapeHtml(s: string): string {',
        why: 'Suggestion text is escaped before a mark element is introduced, preventing source strings from becoming executable HTML.',
        alternative: 'Interpolate raw suggestion text into an innerHTML highlight string.',
        tradeoff: 'Manual escaping adds code, but it keeps highlighted output safe.',
      },
    ],
  },
  {
    questionId: 'angular-tictactoe-starter',
    nodes: [
      {
        id: 'd1-render-board-with-index-identity',
        title: 'Render the fixed board with cell identity',
        snippet: '@for (cell of board; track $index; let i = $index) {',
        why: 'The nine board positions are fixed, so their index is the stable identity used for clicks and labels.',
        alternative: 'Recreate untracked buttons with no connection to board positions.',
        tradeoff: 'Index tracking is correct for this fixed grid, but movable collections should use domain ids.',
      },
      {
        id: 'd2-block-invalid-moves',
        title: 'Stop moves after game completion',
        snippet: 'if (this.isGameOver) return;',
        why: 'The component rejects further state changes after a win or draw even if play is called programmatically.',
        alternative: 'Depend only on disabled cell buttons in the template.',
        tradeoff: 'The guard duplicates UI protection, but it preserves the game invariant for every caller.',
      },
      {
        id: 'd3-update-board-immutably',
        title: 'Create the next board state',
        snippet: 'const next = this.board.slice();',
        why: 'A copied board makes each move a clear state transition before winner detection.',
        alternative: 'Mutate the existing board array in place and rely on incidental change detection.',
        tradeoff: 'Copying nine cells is negligible and makes state transitions easier to inspect.',
      },
      {
        id: 'd4-check-winning-lines',
        title: 'Compare every winning triplet',
        snippet: 'if (v && v === b[c] && v === b[d]) return v;',
        why: 'A non-null mark that matches both remaining positions identifies the winner for that line.',
        alternative: 'Hard-code winner checks in the play method for each possible move.',
        tradeoff: 'Iterating a line table is compact and testable, while custom board sizes would need generated combinations.',
      },
    ],
  },
];

function graphFileName(questionId) {
  return `${questionId}.v1.json`;
}

function findAnchor(code, questionId, node) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const matches = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].includes(node.snippet)) matches.push(index);
  }

  if (matches.length !== 1) {
    throw new Error(
      `${questionId}/${node.id}: expected one anchor for ${JSON.stringify(node.snippet)}, found ${matches.length}`,
    );
  }

  const lineStart = matches[0] + 1;
  return {
    lineStart,
    lineEnd: lineStart,
    snippet: node.snippet,
  };
}

function buildGraph(question, definition) {
  const approaches = Array.isArray(question?.solutionBlock?.approaches)
    ? question.solutionBlock.approaches
    : [];
  const approach = approaches[0];
  const code = typeof approach?.codeTs === 'string' ? approach.codeTs : '';
  if (!code.trim()) {
    throw new Error(`${definition.questionId}: missing first TypeScript solution approach`);
  }

  const fileName = graphFileName(definition.questionId);
  const expectedAsset = `assets/questions/angular/decision-graphs/${fileName}`;
  if (question.decisionGraphAsset !== expectedAsset) {
    throw new Error(
      `${definition.questionId}: expected decisionGraphAsset ${expectedAsset}, received ${question.decisionGraphAsset ?? '<missing>'}`,
    );
  }
  if (approach.decisionGraphKey && approach.decisionGraphKey !== 'approach1') {
    throw new Error(
      `${definition.questionId}: first approach must use decisionGraphKey approach1 when configured`,
    );
  }

  return {
    fileName,
    document: {
      questionId: definition.questionId,
      version: 1,
      defaultKey: 'approach1',
      variants: {
        approach1: {
          language: 'typescript',
          code,
          nodes: definition.nodes.map((node) => ({
            id: node.id,
            title: node.title,
            anchor: findAnchor(code, definition.questionId, node),
            why: node.why,
            alternative: node.alternative,
            tradeoff: node.tradeoff,
          })),
        },
      },
    },
  };
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
  if (!Array.isArray(catalog)) {
    throw new Error('Angular coding catalog must be an array');
  }

  const byId = new Map(catalog.map((question) => [question?.id, question]));
  const stale = [];
  await fs.mkdir(outputDir, { recursive: true });

  for (const definition of definitions) {
    const question = byId.get(definition.questionId);
    if (!question) {
      throw new Error(`Missing Angular coding question: ${definition.questionId}`);
    }

    const { fileName, document } = buildGraph(question, definition);
    const outputPath = path.join(outputDir, fileName);
    const source = `${JSON.stringify(document, null, 2)}\n`;
    const relativePath = path.relative(repoRoot, outputPath);

    if (CHECK) {
      let current = '';
      try {
        current = await fs.readFile(outputPath, 'utf8');
      } catch {}
      if (current !== source) stale.push(relativePath);
      continue;
    }

    await fs.writeFile(outputPath, source, 'utf8');
    console.log(`[angular-decision-graphs] wrote ${relativePath}`);
  }

  if (CHECK && stale.length > 0) {
    console.error('[angular-decision-graphs] ERROR: generated decision graphs are stale.');
    console.error('[angular-decision-graphs] Run: npm -C frontend run gen:angular-decision-graphs');
    for (const file of stale) console.error(`  - ${file}`);
    process.exit(1);
  }

  if (CHECK) {
    console.log(`[angular-decision-graphs] check passed: ${definitions.length} graph(s)`);
  }
}

main().catch((error) => {
  console.error('[angular-decision-graphs] fatal:', error);
  process.exit(1);
});
