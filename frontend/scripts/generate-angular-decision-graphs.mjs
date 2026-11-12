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
        snippet: 'imports: [ReactiveFormsModule],',
        why: 'The template needs the reactive-form directives (formGroup, formControlName, ngSubmit). HttpClient is a service registered with provideHttpClient() in bootstrapApplication, so it does not belong in the component imports, and built-in control flow needs no CommonModule.',
        alternative: 'Import the deprecated HttpClientModule here, or put provideHttpClient() in the component providers, where Angular rejects environment providers with NG0207.',
        tradeoff: 'The HTTP setup sits in src/main.ts, away from the component that uses it, but one registration serves every component and service in the app.',
      },
      {
        id: 'd2-touch-before-validation',
        title: 'Expose validation before returning',
        snippet: 'this.contactForm.markAllAsTouched();',
        why: 'Marking every control as touched reveals the inline errors before submit() returns for an invalid form, including fields the user never focused.',
        alternative: 'Return immediately on an invalid form and leave untouched fields without visible guidance.',
        tradeoff: 'Showing every current error is clearer on submit, though quieter validation can be preferable while the user is still typing.',
      },
      {
        id: 'd3-own-request-lifecycle',
        title: 'Own success and error state around the request',
        snippet: "this.http.post('https://jsonplaceholder.typicode.com/posts', this.contactForm.value).subscribe({",
        why: 'Both callbacks clear isSubmitting; only next resets the form, and error keeps the typed values so the user can retry.',
        alternative: 'Set a success message before the request resolves, or leave isSubmitting true after an error.',
        tradeoff: 'Each handler repeats isSubmitting.set(false), but every outcome leaves the button and messages in a known state.',
      },
      {
        id: 'd4-request-state-in-signals',
        title: 'Keep the request state in signals',
        snippet: 'readonly isSubmitting = signal(false);',
        why: 'The next and error callbacks run after submit() has returned. Writing signals there marks the OnPush view for check, so the button label and the messages follow the request.',
        alternative: 'Plain fields assigned in the callbacks, which only reach the screen with default change detection and zone.js.',
        tradeoff: 'The template calls isSubmitting(), successMessage() and errorMessage() instead of reading fields, a small cost for a view that stays correct under OnPush and zoneless change detection.',
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
        why: 'FormsModule supplies ngModel for the text input, while the @for and @if blocks are built into the template syntax.',
        alternative: 'Keep CommonModule solely for legacy structural directives that the template no longer uses.',
        tradeoff: 'The dependency list stays smaller, but future CommonModule pipes must be imported if they are introduced.',
      },
      {
        id: 'd2-local-todo-state',
        title: 'Keep todo state in a local signal',
        snippet: 'readonly todos = signal<Todo[]>([]);',
        why: 'A signal holding the array, plus an id counter, covers add, toggle, remove, and clear-completed, and lets hasTodos and the template react to every replacement.',
        alternative: "Keep a plain array field and rely on zone-based change detection, or introduce a service or store for one component's list.",
        tradeoff: 'A local signal is easy to test and works with OnPush; state that other components share would later move into a service that exposes the signal.',
      },
      {
        id: 'd3-trim-and-ignore-empty-input',
        title: 'Reject empty todo text before updating the list',
        snippet: 'if (!text) {',
        why: 'Trimming first prevents whitespace-only todos from entering the rendered list or persisted state.',
        alternative: 'Append every input value and clean the list later.',
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
        title: 'Toggle by replacing the touched todo',
        snippet: 'todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))',
        why: 'Copying only the matching todo with done flipped gives the signal a new array and the row a new object, so computed values and OnPush views see the change while other rows keep their identity.',
        alternative: 'Flip todo.done in place or bind the checkbox with [(ngModel)]="todo.done", which edits the object without changing the signal.',
        tradeoff: 'The map allocates a new array per toggle, which is negligible for a todo list and keeps every change visible to signal consumers.',
      },
      {
        id: 'd6-remove-by-id',
        title: 'Remove by stable id',
        snippet: 'todos.filter((todo) => todo.id !== id)',
        why: 'Filtering by id deletes the exact row even when multiple todos have the same text.',
        alternative: 'Remove by visible label or by current array index.',
        tradeoff: 'Id-based removal needs a generated id, but it remains correct after sorting, filtering, or duplicate entries.',
      },
      {
        id: 'd7-clear-completed',
        title: 'Derive the remaining active list',
        snippet: 'todos.filter((todo) => !todo.done)',
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
        id: 'd2-track-slide-identity',
        title: 'Give every slide a stable id',
        snippet: 'id: number;',
        why: 'The dots render with @for and track slide.id, so each indicator keeps its DOM node when slides are added, removed or reordered.',
        alternative: 'Track the dots by $index, which ties each indicator to a position instead of a slide.',
        tradeoff: 'Every slide needs an id in its data, but the dots stay matched to their slides when the list changes.',
      },
      {
        id: 'd4-index-signal',
        title: 'Keep the position in one signal',
        snippet: 'readonly currentIndex = signal(0);',
        why: 'The index is the only state that changes. The current slide, both edge flags, the helper text and the active dot all read currentIndex(), so one set or update moves all of them.',
        alternative: 'Keep a plain currentIndex field with getters, or store the current slide object next to the index.',
        tradeoff: 'Template reads need the call parentheses, but OnPush views see every change, including one made outside the template, such as by an autoplay timer.',
      },
      {
        id: 'd1-render-current-slide',
        title: 'Derive the current slide, or null',
        snippet: 'readonly currentSlide = computed(() => this.slides[this.currentIndex()] ?? null);',
        why: 'The ?? null fallback gives the template one value to test: @if (currentSlide(); as slide) renders the figure only for a real slide, and the computed recalculates only when currentIndex changes.',
        alternative: 'Read slides[currentIndex()] in every binding and render the figure unconditionally with non-null assertions.',
        tradeoff: 'The template needs an @if branch, but an index without a slide renders nothing instead of throwing on slide.imageUrl.',
      },
      {
        id: 'd5-derive-edge-flags',
        title: 'Derive the edge flags',
        snippet: 'readonly canGoNext = computed(() => this.currentIndex() < this.totalSlides - 1);',
        why: 'The Next button binds [disabled] to !canGoNext() and next() checks canGoNext() as well, so the last-slide rule is written once; canGoPrev does the same for the first slide.',
        alternative: 'Compare the index with slides.length in the template and repeat the comparison inside next().',
        tradeoff: 'Two computed values for a three-slide list, but the edge rules sit next to the state they depend on.',
      },
      {
        id: 'd3-guard-navigation-bounds',
        title: 'Reject out-of-range navigation',
        snippet: 'if (index < 0 || index >= this.totalSlides) {',
        why: 'goTo accepts any number, so it checks the range before currentIndex.set, which keeps currentSlide() pointing at a real slide for every caller.',
        alternative: 'Assign any requested index and rely on the dots only passing valid ones.',
        tradeoff: 'The guard is a small extra branch, but goTo stays safe if a keyboard handler or a test calls it with a bad index.',
      },
    ],
  },
  {
    questionId: 'angular-tabs-switcher',
    nodes: [
      {
        id: 'd5-tab-id-union',
        title: 'Name the tabs with a union type',
        snippet: "type TabId = 'overview' | 'details' | 'settings';",
        why: 'TabId lists the three valid selections, so selectTab and isActive accept nothing else and a misspelled id fails type checking.',
        alternative: 'Use plain strings or numeric indexes for tab ids.',
        tradeoff: 'Adding a tab means extending the union as well as the template, which is also what keeps the two in step.',
      },
      {
        id: 'd4-use-one-state-source',
        title: 'Use one typed active-tab signal',
        snippet: "readonly activeTab = signal<TabId>('overview');",
        why: 'A single TabId signal drives active classes, aria-selected and panel visibility, so the three can never disagree.',
        alternative: 'Maintain a separate boolean for each tab and panel.',
        tradeoff: 'One value cannot describe two open panels, which is exactly the constraint a tab set needs.',
      },
      {
        id: 'd2-publish-selected-state',
        title: 'Answer every active-state binding from one helper',
        snippet: 'return this.activeTab() === tab;',
        why: 'isActive reads activeTab(), so [class.active], [attr.aria-selected] and @if (isActive(...)) track the same signal and the accessible state cannot lag behind the styling.',
        alternative: 'Toggle only the active CSS class and leave aria-selected and the panels to separate logic.',
        tradeoff: 'The template calls isActive several times per check; the comparison is trivial, and a computed per tab would only add names.',
      },
      {
        id: 'd6-select-with-set',
        title: 'Switch tabs by setting the signal',
        snippet: 'this.activeTab.set(tab);',
        why: 'set replaces the selection; setting the tab that is already active stores an equal value, so the signal does not notify and the open panel stays as it is.',
        alternative: 'Toggle a tab off when it is clicked again, leaving no panel visible.',
        tradeoff: 'Clicking the active tab does nothing, which matches how tab sets behave; a control that can close every section is an accordion.',
      },
    ],
  },
  {
    questionId: 'angular-filterable-user-list',
    nodes: [
      {
        id: 'd1-import-template-features',
        title: 'Import forms and the one pipe the template uses',
        snippet: 'imports: [FormsModule, TitleCasePipe],',
        why: 'FormsModule supplies ngModel for the three controls, and the only other template dependency is the pipe that capitalizes the role pill, so TitleCasePipe is imported on its own.',
        alternative: 'Import CommonModule for a single pipe, or drop it without checking which pipes the external template still uses.',
        tradeoff: 'The import list names exactly what the template needs; another pipe added later needs its own import.',
      },
      {
        id: 'd5-filter-signals',
        title: 'Hold each filter in a signal',
        snippet: "readonly searchTerm = signal('');",
        why: '[(ngModel)] writes the search text, the role and the toggle straight into writable signals, and the computed list depends on exactly those three values.',
        alternative: 'Plain fields read by a getter, which works while every change comes from a control in this template.',
        tradeoff: 'Signals add call syntax in TypeScript, but OnPush and the computed list also see changes made outside this template, such as filters restored from the URL.',
      },
      {
        id: 'd2-normalize-search-once',
        title: 'Normalize the search term once',
        snippet: 'const term = this.searchTerm().trim().toLowerCase();',
        why: 'One normalized value makes name matching case-insensitive and avoids repeated cleanup inside the filter callback.',
        alternative: 'Compare raw input separately for every user row.',
        tradeoff: 'Normalization allocates a small string per recomputation, but the filtering rules stay readable.',
      },
      {
        id: 'd3-apply-role-filter-explicitly',
        title: 'Treat all as the role wildcard',
        snippet: "if (role !== 'all' && user.role !== role) {",
        why: 'The wildcard must bypass role rejection while concrete roles match exactly.',
        alternative: 'Compare every user role directly to the selected value, including all.',
        tradeoff: 'The explicit branch is slightly longer, but it makes the filter contract unambiguous.',
      },
      {
        id: 'd4-compose-active-filter',
        title: 'Compose the active-only constraint',
        snippet: 'if (onlyActive && !user.active) {',
        why: 'Inactive users are rejected only while the toggle is on, and the source array stays intact.',
        alternative: 'Mutate the source users array whenever the toggle changes.',
        tradeoff: 'The computed reruns the whole filter when any of the three signals changes, which is cheap for five users and keeps the canonical data intact.',
      },
    ],
  },
  {
    questionId: 'angular-faq-accordion',
    nodes: [
      {
        id: 'd5-controlled-open-input',
        title: 'Pass the open state in as an input',
        snippet: 'readonly isOpen = input(false);',
        why: 'The parent decides which items are open; the child renders isOpen() in its @if and its aria-expanded, so the single-open rule is enforced in one place.',
        alternative: 'Give each FaqItemComponent its own open flag and coordinate the siblings afterwards.',
        tradeoff: 'The child cannot open itself without a parent handling toggle, but every rule about open items lives in AppComponent.',
      },
      {
        id: 'd6-void-toggle-output',
        title: 'Report a click with a void output',
        snippet: 'readonly toggle = output<void>();',
        why: 'The parent already knows which index it bound, so the event carries no payload; onHeaderClick() only signals that a toggle was requested.',
        alternative: 'Emit the question text or the index from the child, which would then need the index as another input.',
        tradeoff: 'The parent passes the index itself in (toggle)="onItemToggle(i)", which ties the handler to the @for loop.',
      },
      {
        id: 'd7-constant-faq-content',
        title: 'Leave constant content outside signals',
        snippet: 'readonly faqItems: readonly FaqItem[] = [',
        why: 'The questions and answers never change, so a readonly array is enough: the @for reads the same reference on every pass, and only state that changes needs a signal.',
        alternative: 'Wrap the content in a signal, or store open flags on the content objects.',
        tradeoff: 'Content that becomes editable or is loaded later would move into a signal so OnPush views see the new array.',
      },
      {
        id: 'd8-open-indexes-signal',
        title: 'Keep open indexes in a signal',
        snippet: 'readonly openIndexes = signal<number[]>([]);',
        why: 'One array describes both modes, at most one entry in single-open mode and any subset in multi-open mode, and the template reads it through isItemOpen(i).',
        alternative: 'Store an isOpen boolean on each FAQ object, mixing UI state into the content.',
        tradeoff: 'Index-based state assumes the order never changes; sortable or editable content would key the open state by an id.',
      },
      {
        id: 'd3-support-multiple-open-mode',
        title: 'Treat open indexes like a set',
        snippet: 'if (this.allowMultiple()) {',
        why: 'Multi-open mode adds or removes only the clicked index, with a spread or a filter that hands the signal a new array.',
        alternative: 'Push into or splice the current array, which leaves the signal holding the same reference, so a computed over it never updates.',
        tradeoff: 'Two branches add logic, but they keep the two accordion modes distinct.',
      },
      {
        id: 'd4-enforce-single-open-mode',
        title: 'Keep one index in single-open mode',
        snippet: 'this.openIndexes.set(currentlyOpen ? [] : [index]);',
        why: 'Setting the array to just the clicked index closes any other open answer in the same step, and clicking the open item empties it.',
        alternative: 'Append the index and clean up extra open rows later.',
        tradeoff: 'Opening an item closes the previous one immediately, which is the expected accordion behavior in this mode.',
      },
      {
        id: 'd9-trim-on-mode-switch',
        title: 'Trim to one item when multi-open mode ends',
        snippet: 'this.openIndexes.update((indexes) => [indexes[0]]);',
        why: 'Single-open mode must not start with several answers open; indexes[0] is the item that was opened first, because opening appends.',
        alternative: 'Close every item on the switch, or leave several open until the next click.',
        tradeoff: 'Closing everything would be simpler, but keeping one answer open leaves the reader where they were.',
      },
    ],
  },
  {
    questionId: 'angular-pagination-table',
    nodes: [
      {
        id: 'd4-page-index-signal',
        title: 'Keep the page index in a signal',
        snippet: 'readonly currentPage = signal(0);',
        why: 'The 0-based index is the only value that changes. Holding it in a signal lets every computed value and the OnPush template update when Previous or Next changes it.',
        alternative: 'Keep currentPage as a plain number and recompute the slice in getters.',
        tradeoff: 'Getters work while every change starts with a click in this template, but they rerun on every check and miss changes made later from a timer or a service under OnPush; the signal adds call syntax in the template.',
      },
      {
        id: 'd1-derive-total-pages',
        title: 'Derive total pages from data size',
        snippet: 'readonly totalPages = computed(() => Math.ceil(this.users.length / this.pageSize) || 1);',
        why: 'The page count follows the collection size and still gives one page for an empty dataset, so the label and the last-page check stay valid.',
        alternative: 'Hard-code the number of pages independently from the rows.',
        tradeoff: 'A minimum of one keeps the controls simple, though some products prefer an explicit zero-page empty state.',
      },
      {
        id: 'd2-slice-current-page',
        title: 'Derive only the visible rows',
        snippet: 'return this.users.slice(start, end);',
        why: 'slice copies one page without touching USERS, and the computed keeps that page until currentPage changes.',
        alternative: 'Splice the canonical users array as navigation changes, or slice inline in the template.',
        tradeoff: 'The computed holds one small array per page, but navigation stays reversible and the template binds a single value.',
      },
      {
        id: 'd3-guard-last-page',
        title: 'Stop navigation at the last page',
        snippet: 'if (!this.isLastPage()) {',
        why: 'The guard keeps currentPage inside the page range even if goToNext() is called while the Next button is disabled.',
        alternative: 'Rely only on a disabled Next button in the template.',
        tradeoff: 'The boundary is checked in two places, but the method stays correct for programmatic callers.',
      },
    ],
  },
  {
    questionId: 'angular-multi-step-form-starter',
    nodes: [
      {
        id: 'd1-switch-step-content',
        title: 'Render one step from a step signal',
        snippet: 'readonly currentStep = signal(0);',
        why: 'The template renders only the active step with @switch (currentStep()), and every navigation flag reads the same signal, so a step change refreshes the OnPush view.',
        alternative: 'Mount every step at once and hide inactive sections with CSS, or keep currentStep as a plain number that only default change detection notices.',
        tradeoff: 'Step DOM is recreated on every move, but the values live in the FormGroup, so nothing typed is lost.',
      },
      {
        id: 'd2-gate-next-by-current-group',
        title: 'Validate the current group before advancing',
        snippet: 'group.markAllAsTouched();',
        why: "Only the active step's controls are surfaced and validated before currentStep can move forward.",
        alternative: 'Advance first and reveal validation errors on the next screen.',
        tradeoff: 'Users must resolve current-step errors before continuing, which protects final form completeness.',
      },
      {
        id: 'd3-bind-next-disabled-state',
        title: 'Derive the Next button state from group validity',
        snippet: 'readonly canGoNext = computed(() => {',
        why: "canGoNext reads currentStep() and the signal bridged from the current group's statusChanges, so the Next button's [disabled] binding updates as soon as the step becomes valid; next() keeps its own check as the final guard.",
        alternative: 'Read basicGroup.valid inside the computed, which re-runs only when currentStep changes, or call a method from the template on every check.',
        tradeoff: 'Two toSignal bridges add a few lines, but the button state is a cached value that changes only when validity or the step does.',
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
        id: 'd1-configurable-max-input',
        title: 'Read the scale from a signal input',
        snippet: 'readonly max = input(5);',
        why: 'max is configuration a parent may pass as [max]; input(5) gives it a default of 5 and makes it a signal, so the star list and the aria-labels follow it when it changes.',
        alternative: 'Hard-code five stars, or keep @Input() max = 5 as a plain field.',
        tradeoff: 'The template has to call max(), but values derived from it can be computed signals instead of getters.',
      },
      {
        id: 'd4-rating-model',
        title: 'Declare the rating as a model',
        snippet: 'readonly rating = model(0);',
        why: 'model() creates the rating input and the ratingChange output as one signal the child can read and set, which is the pair [(rating)] binds to.',
        alternative: 'Pair input() or @Input() rating with a ratingChange output and keep the two in step by hand.',
        tradeoff: 'A model emits only when its value changes, so re-selecting the current star sends no event; a parent that needs every click would need an output of its own.',
      },
      {
        id: 'd2-derive-configurable-range',
        title: 'Derive the selectable range from max',
        snippet: 'readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));',
        why: 'The child renders the configured number of one-based choices without hard-coded markup, and the computed rebuilds the array only when max changes.',
        alternative: 'A getter that allocates a new array on every change detection pass, or five literal buttons.',
        tradeoff: 'The values double as @for track keys because they are unique, which holds for any one-through-max range.',
      },
      {
        id: 'd6-roving-tab-stop',
        title: 'Give the radio group one Tab stop',
        snippet: 'readonly tabStop = computed(() => (this.rating() > 0 ? this.rating() : 1));',
        why: 'A radio group is a single Tab stop: the checked star gets tabindex 0 and the others -1, and before any rating the first star takes the stop, as in the WAI-ARIA rating radio group.',
        alternative: 'Leave every star a plain button in the Tab order.',
        tradeoff: 'Five Tab stops need no code, but a keyboard user has to tab past every star to leave the widget, and a screen reader that announces a radio group leads its user to expect the arrow keys inside it.',
      },
      {
        id: 'd3-emit-two-way-binding-update',
        title: 'Set the model to report the rating',
        snippet: 'this.rating.set(value);',
        why: 'Setting the model updates the stars the child renders and emits ratingChange, so the parent currentRating follows through [(rating)].',
        alternative: 'Assign this.rating = value, which replaces the model with a number and emits nothing, or emit from a separate EventEmitter.',
        tradeoff: 'The child writes a value the parent owns; that is the contract of a two-way binding, and the parent can still change the rating by setting currentRating.',
      },
      {
        id: 'd7-arrow-keys-wrap',
        title: 'Move the rating with arrow keys that wrap',
        snippet: 'const next = ((star - 1 + step + count) % count) + 1;',
        why: 'Right and Down check the next star and Left and Up the previous one. The modulo wraps from the last star to the first and back, the way native radio buttons behave, and the handler then focuses the star it checked.',
        alternative: 'Stop at the first and the last star instead of wrapping.',
        tradeoff: 'Stopping at the ends reads naturally for a rating, but the role announces a radio group, and every other radio group wraps; either way the focus call keeps focus and the Tab stop on the same star.',
      },
      {
        id: 'd5-parent-owns-rating',
        title: 'Keep the parent value in a signal',
        snippet: 'readonly currentRating = signal(0);',
        why: '[(rating)]="currentRating" receives the signal itself: Angular reads it for the input and calls set when ratingChange fires, and the hint reads currentRating().',
        alternative: 'A plain currentRating field, which also works with [(rating)] but leaves an OnPush parent stale when the value changes outside its template.',
        tradeoff: 'The template writes currentRating in the binding and currentRating() in the interpolation, a difference that is easy to get wrong.',
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
        why: 'FormsModule is the only external template dependency: it supplies ngModel and the number value accessor, while @if and @for are built into the template syntax.',
        alternative: 'Keep CommonModule for control flow that Angular now provides directly.',
        tradeoff: 'Minimal imports stay clear, but any later CommonModule pipe must be added explicitly.',
      },
      {
        id: 'd5-separate-inputs-from-grid',
        title: 'Keep typed values apart from the rendered grid',
        snippet: 'readonly rowInput = signal<number | null>(3);',
        why: '[(ngModel)] writes every edit into rowInput and colInput, while rows and cols change only in updateTable(), so the table waits for the Generate button.',
        alternative: 'Compute rows and cols directly from the input signals.',
        tradeoff: 'A computed grid would redraw on every keystroke and make the button pointless; two extra signals keep the explicit generate step the task asks for.',
      },
      {
        id: 'd2-render-grid-or-empty-state',
        title: 'Render a grid only for positive dimensions',
        snippet: 'readonly hasCells = computed(() => this.rows().length > 0 && this.cols().length > 0);',
        why: "The computed flag drives the template's @if, so zero rows or zero columns show the empty message instead of an empty table shell.",
        alternative: 'Always render table markup even when one dimension has no cells.',
        tradeoff: 'The conditional adds a separate empty state, but the visible result is easier to understand.',
      },
      {
        id: 'd4-bound-user-dimensions',
        title: 'Clamp requested dimensions',
        snippet: 'const clamped = Math.max(0, Math.min(n, 20));',
        why: 'Bounding rows and columns prevents negative or unreasonably large grids from reaching the DOM.',
        alternative: 'Trust any numeric input and allocate arrays directly from it.',
        tradeoff: 'The cap limits the demo to twenty rows or columns, but it protects preview responsiveness.',
      },
      {
        id: 'd3-track-generated-rows',
        title: 'Track generated rows by stable numeric value',
        snippet: 'this.rows.set(Array.from({ length: rows }, (_, i) => i));',
        why: 'Each generated row value equals its index, so the values are unique and track row in the template keeps the existing rows when the grid grows or shrinks.',
        alternative: 'Build a new object per row and track it by reference, which recreates every row on each Generate.',
        tradeoff: 'Numeric identity is simple for this generated range, while richer row data would benefit from explicit ids.',
      },
    ],
  },
  {
    questionId: 'angular-nested-checkboxes',
    nodes: [
      {
        id: 'd1-own-parent-native-state',
        title: 'Derive the parent checkbox from the children',
        snippet: 'readonly allChecked = computed(() => this.checkedCount() === this.children().length);',
        why: 'The parent has no state of its own: allChecked feeds its [checked] binding, so the box matches the children after every change.',
        alternative: 'Keep a separate parentChecked flag, or set checked and indeterminate on the element through a ViewChild after every change.',
        tradeoff: 'Bindings replace direct DOM writes, but the parent is only as correct as the children array it is computed from.',
      },
      {
        id: 'd3-represent-partial-selection',
        title: 'Derive the mixed parent state',
        snippet: 'readonly someChecked = computed(() => this.checkedCount() > 0 && !this.allChecked());',
        why: 'Partial selection is a state of its own: bound to the native indeterminate property, it shows the mixed mark while checked stays false.',
        alternative: 'Treat any selected child as a fully checked parent.',
        tradeoff: 'The parent now has three visual states, which accurately communicates the child aggregate.',
      },
      {
        id: 'd2-propagate-parent-selection',
        title: 'Apply parent selection to every child',
        snippet: 'this.children.update((children) => children.map((child) => ({ ...child, checked })));',
        why: "Copying every child with the parent's new value gives the signal a new array, so the child bindings and both computed flags update together for select-all and clear-all.",
        alternative: 'Loop over the children and assign child.checked in place.',
        tradeoff: 'The map allocates three small objects per click, while in-place writes would keep the old array and leave the computed flags on their cached values.',
      },
      {
        id: 'd4-toggle-one-child',
        title: 'Toggle one child by replacing it',
        snippet: 'children.map((child, i) => (i === index ? { ...child, checked: !child.checked } : child))',
        why: 'Only the clicked child becomes a new object; the new array lets checkedCount, allChecked and someChecked recompute while the other rows keep their objects.',
        alternative: "Bind each child with [(ngModel)]=\"child.checked\", which writes into the object inside the signal's array.",
        tradeoff: 'Each child input needs [checked] plus a (change) handler instead of one two-way binding, but every change goes through the signal.',
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
        why: 'The stream waits for a short pause, so rapid keystrokes do not start a search for every valueChanges emission.',
        alternative: 'Run the filter and delayed result pipeline immediately for every keypress.',
        tradeoff: 'Debouncing reduces churn but intentionally delays visible suggestions.',
      },
      {
        id: 'd2-switch-to-latest-query',
        title: 'Keep only the latest query stream',
        snippet: 'switchMap((q: string) => (q ? this.search(q) : of([] as string[])))',
        why: 'switchMap unsubscribes from the previous search when a new query passes the debounce. With a 150ms fake search that only happens once search() is slower than the 300ms debounce, as a real request can be, and the stream stays correct then.',
        alternative: 'Merge every pending search and allow older results to arrive after newer input.',
        tradeoff: 'Previous work is abandoned, which is correct for autocomplete but not for operations that must all complete.',
      },
      {
        id: 'd3-read-rendered-options',
        title: 'Navigate the currently rendered options',
        snippet: "const options = this.host.nativeElement.querySelectorAll('[role=\"option\"]');",
        why: 'Keyboard movement uses the actual option count after filtering and empty-state changes.',
        alternative: 'Navigate against the full city dataset regardless of what is rendered.',
        tradeoff: 'DOM lookup couples navigation to rendered roles, and the first arrow key on a closed list finds no options yet, but activeIndex stays inside the visible list.',
      },
      {
        id: 'd4-close-on-outside-pointer',
        title: 'Close when interaction leaves the component',
        snippet: 'if (!this.host.nativeElement.contains(target)) {',
        why: "The document:mousedown listener from the component's host metadata dismisses suggestions, but not when the press lands inside the autocomplete, such as on an option.",
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
      {
        id: 'd6-bridge-results-with-tosignal',
        title: 'Read the results through a signal',
        snippet: 'readonly results = toSignal(',
        why: "toSignal subscribes once and exposes the latest suggestions as results(); it stays undefined until the first debounced value, which @if (results(); as list) treats the way it treated the async pipe's null.",
        alternative: 'The async pipe with a CommonModule or AsyncPipe import, or a manual subscribe that writes a field.',
        tradeoff: 'The subscription starts when the component is created rather than at first render, and it ends with the component without extra cleanup code.',
      },
      {
        id: 'd7-search-from-value-changes',
        title: 'Drive the search from the FormControl',
        snippet: 'this.queryControl.valueChanges.pipe(',
        why: 'Typing through [formControl] and select() through setValue both emit valueChanges, so one stream sees every query and no separate Subject has to be kept in sync.',
        alternative: 'A Subject fed from an (input) handler and from select(), which repeats what the FormControl already reports.',
        tradeoff: 'Picks reach the stream too, so the tap needs the pickedValue check to keep a picked city from reopening the list.',
      },
    ],
  },
  {
    questionId: 'angular-tictactoe-starter',
    nodes: [
      {
        id: 'd1-render-board-with-index-identity',
        title: 'Hold the nine fixed cells in one signal',
        snippet: 'readonly board = signal<Cell[]>(Array.from({ length: 9 }, () => null));',
        why: "The cells never move, so the template's @for tracks them by $index and play(i) addresses them by position. Keeping the array in a signal lets winner, isDraw and status recompute after every move.",
        alternative: 'Keep a plain board array and update a separate winner field in play() and reset().',
        tradeoff: 'Each move allocates a new nine-cell array, which costs nothing at this size, and no derived value can fall out of step with the board.',
      },
      {
        id: 'd5-derive-winner',
        title: 'Compute the winner from the board',
        snippet: 'readonly winner = computed(() => this.calculateWinner(this.board()));',
        why: 'The winner is a function of the cells, so deriving it keeps it correct for the current board, and reset() only has to clear the board and the turn.',
        alternative: 'Set a winner field inside play() after each move and clear it in reset().',
        tradeoff: 'calculateWinner runs again on the first read after each board change, a negligible cost for eight lines, and there is no stored winner that reset() or a later undo feature could forget to clear.',
      },
      {
        id: 'd2-block-invalid-moves',
        title: 'Stop moves after game completion',
        snippet: 'if (this.isGameOver()) return;',
        why: 'play() rejects further moves after a win or draw, even when it is called from code instead of from an enabled cell.',
        alternative: 'Depend only on disabled cell buttons in the template.',
        tradeoff: 'The guard duplicates UI protection, but it preserves the game invariant for every caller.',
      },
      {
        id: 'd3-update-board-immutably',
        title: 'Create the next board state',
        snippet: 'this.board.update((board) => board.map((cell, index) => (index === i ? mark : cell)));',
        why: 'board.update stores a new array with the mark at index i, so the signal registers a new value and winner, isDraw and status recompute before the turn check reads them.',
        alternative: 'Write the mark into board() in place, which leaves the signal holding the same array and every computed value stale.',
        tradeoff: 'Copying nine cells per move is negligible, and every move produces a separate board value.',
      },
      {
        id: 'd4-check-winning-lines',
        title: 'Compare every winning triplet',
        snippet: 'if (v && v === b[c] && v === b[d]) return v;',
        why: 'A non-null mark that matches both remaining positions identifies the winner for that line.',
        alternative: 'Hard-code a winner check in play() for each possible move.',
        tradeoff: 'Iterating a line table is compact and testable, while custom board sizes would need generated combinations.',
      },
    ],
  },
  {
    questionId: 'angular-counter-starter',
    nodes: [
      {
        id: 'd1-onpush-counter',
        title: 'Run the counter with OnPush',
        snippet: 'changeDetection: ChangeDetectionStrategy.OnPush,',
        why: 'Everything the template shows comes from a signal, so Angular can skip this component until a signal it reads changes or one of its buttons fires.',
        alternative: 'Keep the default strategy, which checks the component on every change detection pass anywhere in the app.',
        tradeoff: 'OnPush is free here and keeps working if the count later changes from a timer or a service, but it hides plain fields changed outside the template.',
      },
      {
        id: 'd2-count-signal',
        title: 'Keep the count in one signal',
        snippet: 'readonly count = signal(0);',
        why: 'The count is the only state; reading count() in the template ties the number and the minus button to it.',
        alternative: 'A plain count = 0 field that the click handlers change.',
        tradeoff: 'A plain field works while every change starts with a click in this template; the signal also covers timers, services or a parent under OnPush or zoneless change detection.',
      },
      {
        id: 'd3-derived-disabled',
        title: 'Derive the disabled state',
        snippet: 'readonly isZero = computed(() => this.count() === 0);',
        why: 'The minus button binds its disabled state to isZero(), which recalculates only when count changes.',
        alternative: 'Repeat count() === 0 in the template, or use a getter.',
        tradeoff: 'An inline expression is shorter, but a named computed keeps the zero rule in one place for the template and anything else that needs it.',
      },
      {
        id: 'd4-clamp-decrement',
        title: 'Clamp the decrement at zero',
        snippet: 'this.count.update((value) => Math.max(0, value - 1));',
        why: 'The disabled button stops clicks at 0, and the clamp keeps the count from going negative for any other caller of dec().',
        alternative: 'Rely on the disabled button alone, or return early when isZero() is true.',
        tradeoff: 'The clamp is one expression that cannot go below zero; an early return reads closer to the rule but repeats the zero check.',
      },
      {
        id: 'd5-reset-with-set',
        title: 'Reset with set',
        snippet: 'this.count.set(0);',
        why: 'reset() replaces the value outright, so set says it directly; update derives the next value from the current one.',
        alternative: 'count.update(() => 0).',
        tradeoff: 'Both give the same value; set states the intent and skips reading the old count.',
      },
    ],
  },
  {
    questionId: 'angular-shopping-cart-mini',
    nodes: [
      {
        id: 'd1-cart-signal',
        title: 'Keep the cart in one signal',
        snippet: 'readonly cartItems = signal<CartItem[]>([]);',
        why: 'Every cart line and its quantity live in this one array; the totals, the empty message and the cart rows all read it, so one replacement updates them together.',
        alternative: 'Keep a plain cartItems array plus separate total fields that every handler updates by hand.',
        tradeoff: 'One signal is a single source of truth that works with OnPush, at the cost of copying the array on each change; hand-kept totals are one forgotten update away from drifting.',
      },
      {
        id: 'd2-computed-totals',
        title: 'Derive both totals from the lines',
        snippet: 'readonly totalQty = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));',
        why: 'totalQty and totalPrice reduce over cartItems() and recompute only when the signal receives a new array, so the header can never disagree with the rows.',
        alternative: 'Store totalQty and totalPrice as fields and adjust them inside addToCart, increaseQty, decreaseQty and removeItem.',
        tradeoff: 'Each reduce walks every line after a change, which is trivial for a few lines; stored totals skip that pass but must be kept in step by four methods.',
      },
      {
        id: 'd3-merge-repeat-adds',
        title: 'Merge repeat adds into one line',
        snippet: 'const inCart = this.cartItems().some((item) => item.id === product.id);',
        why: "Adding a product that is already in the cart raises that line's quantity through changeQuantity instead of appending a second line with the same id.",
        alternative: 'Append a new line on every click and group duplicates by id when rendering or totalling.',
        tradeoff: 'The some() check scans the cart on each add, but every product id stays on exactly one line, which keeps @for tracking by item.id valid.',
      },
      {
        id: 'd4-minus-at-one-removes',
        title: 'Remove the line when minus reaches zero',
        snippet: 'if (item.quantity <= 1) {',
        why: 'Minus on a line with quantity 1 calls removeItem, so the cart never holds a line that shows a quantity of 0.',
        alternative: 'Clamp the quantity at 1 and let only the Remove button delete a line.',
        tradeoff: 'Removing at zero matches what the minus click asks for, but one accidental click drops the line; clamping is safer and makes Remove the only way out.',
      },
      {
        id: 'd5-copy-changed-line',
        title: 'Change a quantity by copying one line',
        snippet: 'items.map((line) => (line.id === id ? { ...line, quantity: line.quantity + delta } : line))',
        why: 'Only the line with the matching id becomes a new object inside a new array, so the signal notifies and both totals recompute while the other lines keep their identity.',
        alternative: 'Find the line and change line.quantity in place, which keeps the same array and leaves the computed totals on their cached values.',
        tradeoff: 'map allocates a fresh array on every plus or minus click, a few small objects at cart size, and in return every quantity change reaches the computed totals and the OnPush view.',
      },
    ],
  },
  {
    questionId: 'angular-transfer-list',
    nodes: [
      {
        id: 'd1-selection-ids',
        title: 'Store each selection as a set of ids',
        snippet: 'readonly topSelected = signal<ReadonlySet<string>>(new Set());',
        why: 'The top selection is a set of item ids in a signal, typed ReadonlySet so code cannot add to it in place; ids stay valid when moves shift item positions.',
        alternative: 'Keep a selected flag on each item, or store the indexes of the checked rows.',
        tradeoff: 'A separate set keeps items plain and lookups constant time, but it must be cleared when its items leave the list; flags on items would travel with them and need resetting instead.',
      },
      {
        id: 'd2-derive-button-state',
        title: 'Derive the arrow button state',
        snippet: 'readonly canMoveDown = computed(() => this.topSelected().size > 0);',
        why: 'The down arrow is enabled exactly when the top selection is not empty; the computed updates whenever toggleTop or moveDown sets a new set.',
        alternative: 'Keep canMoveDown as a boolean field and flip it in every toggle and move handler.',
        tradeoff: 'The computed cannot fall out of step with the selection, but it only notices new sets, which is why toggles copy the set instead of editing it.',
      },
      {
        id: 'd3-append-to-destination',
        title: 'Append moved items to the end of the other list',
        snippet: 'this.bottomItems.update((items) => [...items, ...moved]);',
        why: 'Moved items go after the existing bottom items in a new array, so Bottom keeps its order and its rows, and @for creates rows only for the arrivals.',
        alternative: 'Insert moved items at the top, or re-sort the destination by label after every move.',
        tradeoff: 'Appending follows the spec and leaves existing rows where they are; sorted insertion would read better in long lists but shifts rows the user was looking at.',
      },
      {
        id: 'd4-reset-source-selection',
        title: 'Clear the source selection after a move',
        snippet: 'this.topSelected.set(new Set());',
        why: 'The moved ids no longer belong to Top, so the top selection becomes a new empty set, which also disables the down arrow; the bottom selection is left as it was.',
        alternative: 'Delete only the moved ids from the set, or carry the selection over so moved items arrive checked.',
        tradeoff: 'Every selected top item moves, so clearing the whole set is exact here; carrying the selection over would let users move items straight back but breaks the spec.',
      },
      {
        id: 'd5-copy-set-on-toggle',
        title: 'Copy the set on every toggle',
        snippet: 'const next = new Set(selected);',
        why: 'toggled() builds a new Set before adding or deleting the id, so the selection signal receives a new reference and canMoveDown and canMoveUp recompute.',
        alternative: 'Call add or delete on the set the signal already holds.',
        tradeoff: 'Copying costs one new set per click, while in-place edits keep the reference: the signal never notifies and the arrow button stays disabled after the first check.',
      },
      {
        id: 'd6-keep-source-order',
        title: 'Split in list order, not click order',
        snippet: 'moved: items.filter((item) => selected.has(item.id)),',
        why: 'Filtering the source list keeps its order, so items checked as Gamma then Alpha still arrive as Alpha, Gamma; the second filter keeps the remaining items in order too.',
        alternative: 'Build moved by iterating the selection set, which follows the order the boxes were checked.',
        tradeoff: 'Two filter passes read each item twice, which only matters for very long lists; one loop that fills two arrays avoids it but takes more code to read.',
      },
    ],
  },
  {
    questionId: 'angular-debounced-search',
    nodes: [
      {
        id: 'd1-search-state-signals',
        title: 'Hold the search state in signals',
        snippet: 'readonly results = signal<Result[]>([]);',
        why: 'results, isLoading and error are written from debounce and delay callbacks after the input event is over; a signal write is what marks the OnPush view for refresh at that point.',
        alternative: 'Plain fields with default change detection, relying on zone.js to run a global check after every timer callback.',
        tradeoff: 'The template calls results(), isLoading() and error() instead of reading fields, and in return the view stays correct under OnPush and without zone.js.',
      },
      {
        id: 'd2-debounce-typing',
        title: 'Wait for a 500ms pause in typing',
        snippet: 'debounceTime(500),',
        why: 'A burst of keystrokes reaches the search only once typing stops for 500ms, so fakeApiSearch runs once per pause instead of once per character typed into the box.',
        alternative: 'Search on every input event, or throttle so the first keystroke of each window searches at once.',
        tradeoff: 'Results show up at least 500ms after the last keystroke, which is the price for never loading the intermediate prefixes of a name.',
      },
      {
        id: 'd3-clear-on-empty-term',
        title: 'Clear the results for an empty term',
        snippet: 'if (!term.trim()) {',
        why: 'A blank or whitespace-only term empties results and stops the loading flag, and the switchMap branch answers with of([]), so fakeApiSearch never receives an empty query.',
        alternative: 'Pass the empty string to fakeApiSearch and let it decide whether to return everything or nothing.',
        tradeoff: 'The empty case is checked twice, in tap and in switchMap, but clearing the box resets the list without a 600ms round trip.',
      },
      {
        id: 'd4-switch-to-latest-term',
        title: 'Cancel the request for an older term',
        snippet: 'switchMap((term) => {',
        why: 'When a newer term clears the debounce while a request is still in flight, switchMap unsubscribes from it, so a late response for Bob cannot replace the results for Alice.',
        alternative: 'mergeMap or concatMap, which keep every request alive and let an older response land after a newer one.',
        tradeoff: 'Work already started for the old term is thrown away, which suits a search box but would be wrong for saves that must all finish.',
      },
      {
        id: 'd5-recover-inside-the-request',
        title: 'Catch errors inside the inner stream',
        snippet: 'catchError((err: unknown) => {',
        why: 'catchError wraps only the fakeApiSearch call, so a failed search sets error, clears isLoading and yields an empty list while the outer searchTerm$ subscription keeps listening.',
        alternative: 'Place catchError after switchMap on the outer pipe, where the first failure completes the stream and later typing never searches again.',
        tradeoff: 'Each request carries its own handler, one more level of nesting in exchange for a box that keeps searching after a failed request, such as the one for the term error.',
      },
      {
        id: 'd6-stop-with-destroyref',
        title: 'End the pipeline with the component',
        snippet: 'takeUntilDestroyed(this.destroyRef)',
        why: 'takeUntilDestroyed completes the subscription when the component is destroyed, which also drops a pending debounce timer or a fake request that has not answered yet.',
        alternative: 'A destroy$ Subject completed in ngOnDestroy, or a stored Subscription that ngOnDestroy unsubscribes.',
        tradeoff: 'The pipeline is built in a method, so DestroyRef has to be injected and passed in, but no lifecycle hook or extra Subject is needed.',
      },
    ],
  },
  {
    questionId: 'angular-chips-input-autocomplete',
    nodes: [
      {
        id: 'd1-chips-signal',
        title: 'Keep the selected chips in a signal',
        snippet: 'readonly chips = signal<Chip[]>([]);',
        why: 'chips holds every invited person and custom entry, and suggestions reads it to hide people who are already invited, so each add or removal has to reach the signal.',
        alternative: 'A plain Chip[] field changed with push and splice and read through getters on every change detection pass.',
        tradeoff: 'Every edit must hand the signal a new array through update, but the suggestion list and the OnPush view see each one.',
      },
      {
        id: 'd2-computed-suggestions',
        title: 'Derive suggestions with computed',
        snippet: 'readonly suggestions = computed<Chip[]>(() => {',
        why: 'It filters users by name or email, skips ids already in chips and caps the list at six; it reruns only when query or chips change, and handleKeyDown reads the same cached list as the template.',
        alternative: 'A getter that rebuilds the filtered array on each change detection pass and again on every keydown.',
        tradeoff: 'A computed only notices signal reads, so the users list must stay constant or become a signal, while repeated reads within one pass cost nothing.',
      },
      {
        id: 'd3-reject-normalized-duplicates',
        title: 'Reject duplicates by id or normalized value',
        snippet: '(item) => item.id === chip.id || this.normalize(item.value) === this.normalize(chip.value)',
        why: 'addChip compares ids and trimmed lowercase values, so typing zed CUSTOM with stray spaces adds nothing when Zed Custom exists, and the query still clears.',
        alternative: 'Compare raw labels, which lets casing and extra spaces produce repeated chips for the same person.',
        tradeoff: "Normalizing on each comparison is cheap for a few chips, and custom text equal to a user's email counts as that user, which is the intended match.",
      },
      {
        id: 'd4-enter-picks-or-creates',
        title: 'Let Enter pick a suggestion or create a chip',
        snippet: 'if (this.isOpen() && index >= 0 && index < len) {',
        why: 'Enter adds the highlighted suggestion when the list is open and an option is active; otherwise addCustomFromQuery turns the typed text into a custom chip.',
        alternative: 'Accept only suggestions on Enter and offer a separate button for inviting an address that is not in the list.',
        tradeoff: 'One key covers both paths, but after Escape closes the list, Enter creates a custom chip from the text even if an option was highlighted before.',
      },
      {
        id: 'd5-backspace-on-empty-input',
        title: 'Remove the last chip only from an empty input',
        snippet: "if (event.key === 'Backspace' && !this.query() && this.chips().length > 0) {",
        why: 'Backspace erases typed text first; only when the query is already empty does it drop the most recent chip, by slicing it off the end of the array.',
        alternative: 'Remove a chip on every Backspace, which deletes invites while the user is still fixing a typo in the input.',
        tradeoff: 'Keydown fires before the input updates, so deleting the last letter and removing a chip take separate presses, which is how tag inputs usually behave.',
      },
      {
        id: 'd6-close-on-outside-press',
        title: 'Close the list on presses outside the field',
        snippet: 'if (!this.host.nativeElement.contains(target)) {',
        why: 'The document-level mouse-down listener in the host metadata closes the list and resets activeIndex only when the press lands outside this component, so pressing an option still adds it.',
        alternative: 'Close the list on input blur, which runs before a click on an option and can remove the option before the pick lands.',
        tradeoff: 'Listening on the whole document runs this check for every press on the page, a small cost for dismissal without blur timing races.',
      },
    ],
  },
  {
    questionId: 'angular-theme-toggle',
    nodes: [
      {
        id: 'd1-read-storage-defensively',
        title: 'Read the stored theme defensively',
        snippet: 'const raw = window.localStorage.getItem(STORAGE_KEY);',
        why: 'safeReadTheme returns only light or dark and falls back to null when the key is missing, holds another value, or storage access throws, so a blocked or edited store cannot break startup.',
        alternative: 'Read localStorage directly in the constructor and cast whatever string comes back to Theme.',
        tradeoff: 'Storage errors are swallowed without a message, but the toggle keeps working for the session instead of failing to bootstrap.',
      },
      {
        id: 'd2-theme-signal',
        title: 'Hold the theme in a private signal',
        snippet: 'private readonly theme = signal<Theme>(safeReadTheme() ?? memoryTheme);',
        why: 'The service starts from the stored theme, or the in-memory fallback when storage cannot be read, and keeps it in a writable signal that only its own methods change.',
        alternative: 'A public mutable currentTheme field that any component can reassign.',
        tradeoff: 'Components cannot set the value directly and must call setTheme or toggleTheme, which is what keeps storage and the page attribute in step.',
      },
      {
        id: 'd3-expose-read-only',
        title: 'Expose the theme as a read-only signal',
        snippet: 'readonly currentTheme = this.theme.asReadonly();',
        why: 'asReadonly gives components a signal they can read and track but not set, so every change still goes through setTheme and its storage write.',
        alternative: 'Expose the writable signal itself, which lets any component call set and skip persistence and the data-theme update.',
        tradeoff: 'The same value has two names, theme inside the service and currentTheme outside, in exchange for a single write path.',
      },
      {
        id: 'd4-apply-on-creation',
        title: 'Apply the theme when the service is created',
        snippet: 'this.applyTheme(this.theme());',
        why: 'The constructor sets data-theme on the html element as soon as the root component injects the service, so a stored dark theme is in place before that component first renders.',
        alternative: 'Set data-theme in an afterNextRender callback, which runs after the first render and can show the light colors for a frame.',
        tradeoff: 'A constructor with a DOM side effect is less pure, but it is the earliest point the app can act; only a script in index.html could run sooner.',
      },
      {
        id: 'd5-write-storage-on-change',
        title: 'Persist and apply in the same method',
        snippet: 'safeWriteTheme(theme);',
        why: 'setTheme sets the signal, writes storage and updates data-theme in one synchronous call, and toggleTheme goes through it, so the label, the stored key and the page colors cannot drift.',
        alternative: 'An effect that watches the theme signal and writes storage and the attribute whenever it reruns.',
        tradeoff: 'The three steps are written out by hand, but they happen on the click itself, while an effect would also write the default theme to storage on the first visit.',
      },
      {
        id: 'd6-derive-is-dark',
        title: 'Derive isDark from the service signal',
        snippet: "readonly isDark = computed(() => this.themeService.currentTheme() === 'dark');",
        why: 'isDark recomputes whenever currentTheme changes, whether this button or any other caller of setTheme changed it, and the OnPush template reads it for both the icon and the label.',
        alternative: 'Copy the theme into a component field on each click, which goes stale when another component switches the theme.',
        tradeoff: 'The template calls isDark() rather than reading a field, a small syntax change for a label that cannot disagree with the service.',
      },
    ],
  },
  {
    questionId: 'angular-input-output-two-way',
    nodes: [
      {
        id: 'd1-value-model',
        title: 'Declare value as a model',
        snippet: 'readonly value = model(0);',
        why: 'model(0) registers a value input and a valueChange output in one field, the exact pair [(value)] binds to, and inside the child it reads and writes like a signal.',
        alternative: 'Pair @Input() value with @Output() valueChange = new EventEmitter<number>(), or input() with output(), and emit the next value by hand.',
        tradeoff: 'One field replaces two declarations, but the child now holds a copy of the value; the stateless input() plus output() pair never shows a number the parent has not accepted.',
      },
      {
        id: 'd2-write-the-model',
        title: 'Write the model instead of emitting',
        snippet: 'this.value.update((value) => value + 1);',
        why: "update changes the child's value and emits valueChange with the result in one call, so the plus button needs no EventEmitter and the parent's [(value)] receives the new number.",
        alternative: 'Emit this.value + 1 from an output and show the new number only after the parent sends it back through [value].',
        tradeoff: 'The child shows the new number at once; a parent that bound only [value] and ignored valueChange would see the child drift away from its own value.',
      },
      {
        id: 'd3-floor-at-zero',
        title: 'Keep the value at zero or above',
        snippet: 'Math.max(0, value - 1)',
        why: 'The minus button is disabled at 0, and Math.max holds the floor if dec() runs at 0 some other way; a model set to its current value emits nothing, so no extra valueChange goes out.',
        alternative: 'Rely on [disabled]="value() === 0" alone, or let the value go negative and reject it in the parent.',
        tradeoff: 'The clamp repeats a rule the disabled button already enforces, but it keeps dec() correct for a keyboard shortcut or a test that calls it directly.',
      },
      {
        id: 'd4-flip-liked',
        title: 'Flip the like flag through its model',
        snippet: 'this.liked.update((liked) => !liked);',
        why: "update stores the negation of the current liked value and the model emits likedChange, so the parent's liked signal and its true or false stat follow the click.",
        alternative: 'Keep liked as plain child state that the parent never hears about, or emit !this.liked from an output for the parent to assign.',
        tradeoff: "The flag now lives in two places, the child's model and the parent's signal, kept equal by [(liked)]; a child-only flag is simpler but invisible to the stats row.",
      },
      {
        id: 'd5-parent-signals',
        title: 'Keep the source of truth in parent signals',
        snippet: 'readonly value = signal(0);',
        why: "The parent's value and liked signals are what [(value)]=\"value\" and [(liked)]=\"liked\" read and write: Angular calls set on them when the child emits, and the stats row reads value() and liked().",
        alternative: 'Plain value and liked fields, which [(value)] also accepts but which an OnPush parent would not re-render if they changed outside its template.',
        tradeoff: 'The binding passes the signal without parentheses while the interpolation calls it, a split that is easy to get wrong; in return every change is tracked.',
      },
    ],
  },
  {
    questionId: 'angular-like-button',
    nodes: [
      {
        id: 'd1-liked-signal',
        title: 'Hold the like state in a signal',
        snippet: 'readonly liked = signal(false);',
        why: 'liked drives three bindings at once, the active class, aria-pressed and the Like or Liked label, so one signal keeps all three in step under OnPush.',
        alternative: "A plain liked field, which still updates here because only the button's click changes it.",
        tradeoff: 'Each binding pays a function call; a plain field would stop updating under OnPush once something outside the click handler, such as a server reply, set it.',
      },
      {
        id: 'd2-count-beside-like',
        title: 'Store the count next to the like',
        snippet: 'readonly count = signal(120);',
        why: 'count is its own state starting at 120, moved by one on every toggle, and the number beside the button reads count().',
        alternative: 'Derive it with computed(() => 120 + (this.liked() ? 1 : 0)), so the count can never disagree with liked.',
        tradeoff: "Two signals mirror the starter and the spec's clamp but must always change together; a computed removes that risk but hard-codes the starting number.",
      },
      {
        id: 'd3-branch-on-current-like',
        title: 'Branch on the current like state',
        snippet: 'if (!this.liked()) {',
        why: 'Reading liked() once decides both writes, the new like state and the direction of the count, so the label, the style and the number cannot disagree after a click.',
        alternative: 'Flip liked first and read it back to decide the count, or render separate Like and Unlike buttons.',
        tradeoff: 'One handler with an early return is easy to follow; flipping first and re-reading also works but makes the order of the two writes matter.',
      },
      {
        id: 'd4-write-both-in-the-handler',
        title: 'Change both signals in the same handler',
        snippet: 'this.liked.set(true);',
        why: 'Both writes finish before Angular renders again, so the active style, the label and 121 appear together after the click.',
        alternative: 'Set only liked and let an effect that watches it adjust count.',
        tradeoff: "An effect would keep count in sync without the handler's help but runs later and hides the cause; two explicit writes keep the whole rule in toggleLike().",
      },
      {
        id: 'd5-clamp-on-unlike',
        title: 'Never let the count drop below zero',
        snippet: 'Math.max(0, count - 1)',
        why: 'Taking a like back subtracts one through Math.max, the guard the spec asks for; starting from 120 it never triggers, but it holds for a post whose count starts at 0 while already liked.',
        alternative: 'Subtract without a guard and trust the toggle to keep the count consistent.',
        tradeoff: 'The guard is unreachable from this UI and costs one call; it keeps the rule true if the starting count or the initial like state ever changes.',
      },
    ],
  },
  {
    questionId: 'angular-dynamic-counter-buttons',
    nodes: [
      {
        id: 'd1-id-and-own-count',
        title: 'Give every button an id and its own count',
        snippet: 'interface CounterButton {',
        why: "Each button carries a stable id for tracking and for its click handler, plus a count that belongs to it alone, so clicking one button never touches another's number.",
        alternative: 'Keep a plain number[] of counts and identify buttons by their position in the array.',
        tradeoff: 'Objects need an id generator, while positions would point at the wrong button if the list were ever reordered or trimmed.',
      },
      {
        id: 'd2-list-in-one-signal',
        title: 'Hold the whole list in one signal',
        snippet: 'readonly buttons = signal<CounterButton[]>',
        why: 'The @for reads buttons(), and every click hands the signal a new array, so OnPush rendering and anything computed from the list follow each change.',
        alternative: 'A plain buttons array reassigned in the click handler, which renders here because the click marks the view for checking.',
        tradeoff: 'The signal makes every change visible to computed values such as a total; a plain field works only while the click handler is the one thing that changes the list.',
      },
      {
        id: 'd3-plain-id-counter',
        title: 'Keep the id counter out of the template',
        snippet: 'private nextId = 2;',
        why: 'nextId only hands out ids and is never displayed, so a private plain field is enough; it starts at 2 because the first button already uses id 1.',
        alternative: 'Make nextId a signal, or derive the next id from the largest id in the list.',
        tradeoff: 'A plain field is the least code; deriving from the list needs no extra state but scans the array on every click and could reuse an id once the last button is removed.',
      },
      {
        id: 'd4-copy-clicked-button',
        title: 'Copy only the clicked button',
        snippet: 'button.id === id ? { ...button, count: button.count + 1 } : button',
        why: 'map returns a new object for the clicked id and the same objects for the rest, so the signal gets a new array while untouched buttons keep their identity.',
        alternative: 'Increment button.count on the existing object and push onto the existing array, which leaves the signal holding the same reference.',
        tradeoff: 'One new array and one new object per click cost nothing at this size; in-place edits would still render after a click but leave a computed total at its old value.',
      },
      {
        id: 'd5-append-fresh-button',
        title: 'Append a fresh button with the next id',
        snippet: '{ id: this.nextId++, count: 0 }',
        why: 'The new button goes on the end of the same new array, so one update both counts the click and grows the list, and @for track button.id gives the new row its own element.',
        alternative: 'Call update twice, once to increment and once to append, or push the new button in a second step.',
        tradeoff: 'One replacement per click keeps the user action in a single write; two writes end in the same list but allocate two arrays and split one click across two steps.',
      },
    ],
  },
  {
    questionId: 'angular-chessboard-click-highlight',
    nodes: [
      {
        id: 'd1-single-selected-key',
        title: 'Store the selection as one key',
        snippet: 'readonly selectedKey = signal<string | null>(null);',
        why: 'One nullable key models single selection: each click replaces it, so the previous cell loses cell--active with no clearing step, and null is the state the status line shows as Selected: none.',
        alternative: 'Keep a boolean per cell in a two-dimensional array, or a Set of selected keys.',
        tradeoff: 'One key cannot express multi-select, but two cells can never be active at once, a rule that a grid of booleans would have to enforce in every click handler.',
      },
      {
        id: 'd2-derive-row-indexes',
        title: 'Derive the row indexes from the size',
        snippet: 'readonly rows = computed(() => Array.from({ length: this.size() }, (_, index) => index));',
        why: 'The template loops over rows() for both rows and columns, so one index array drives the whole N by N grid, and the computed rebuilds it only when size changes.',
        alternative: 'Return a fresh array from a rows getter on every check, or store a two-dimensional array of cell objects that onSizeChange rebuilds.',
        tradeoff: 'Plain indexes carry no per-cell data, so color and active state are worked out per cell in the template; a grid of cell objects could hold them but would need rebuilding on each resize and click.',
      },
      {
        id: 'd6-apply-size-on-change',
        title: 'Apply the size on change, not on every key',
        snippet: 'onSizeChange(input: HTMLInputElement): void {',
        why: 'The field binds (change), which fires on Enter, on blur and on the arrows, so typing 12 passes through 1 without resizing the board. Clamping on every input event turned that 1 into 2 and rewrote the field, so sizes 10 to 19 could not be typed.',
        alternative: 'Handle (input) and apply only whole numbers that are already inside 2 to 20, leaving other keystrokes alone.',
        tradeoff: 'A change waits for Enter or blur, so a typed size shows one step later; live updates on input redraw sooner but pass through boards nobody asked for, such as 2 by 2 on the way to 25.',
      },
      {
        id: 'd3-clamp-typed-size',
        title: 'Clamp the committed size to 2 through 20',
        snippet: '? Math.max(this.minSize, Math.min(this.maxSize, Math.trunc(next)))',
        why: 'The value loses its decimals, then the Math.min and Math.max pair keeps the board between 2 and 20 cells per side, so no typed value can render an empty grid or thousands of buttons. An empty or non-numeric field keeps the current size.',
        alternative: "Rely on the input's min and max attributes, which limit the spinner arrows and form validity but not what a user types.",
        tradeoff: 'The attributes still help, since the spinner stops at the bounds and the field reports itself invalid, but only the clamp guarantees the size the grid renders.',
      },
      {
        id: 'd7-write-clamped-value-back',
        title: 'Write the clamped size back into the field',
        snippet: 'input.value = String(size);',
        why: '[value]="size()" writes the field only when size() changes. Typing 30 on a 20 by 20 board clamps to the same 20, so without this line the field would keep showing 30 beside a 20 by 20 board.',
        alternative: 'Keep the typed text in its own signal bound to [value] and set it again after each change.',
        tradeoff: 'Writing the element is one line in the handler. A text signal keeps the template in charge of the field but has the same blind spot: setting it to the value it already holds changes nothing, so the typed 30 would stay.',
      },
      {
        id: 'd4-clear-selection-on-resize',
        title: 'Clear the selection on every resize',
        snippet: 'this.selectedKey.set(null);',
        why: 'A key such as 7-7 has no cell on a 5 by 5 board, so onSizeChange sets selectedKey back to null when the size changes, and the status line returns to Selected: none.',
        alternative: 'Keep the key when its row and column still fit the new size, and clear it only when they fall outside the board.',
        tradeoff: 'Clearing on every resize is one line and never leaves a stale key, but it also drops a selection that would still fit; committing the size the board already has returns early and keeps the selection.',
      },
      {
        id: 'd5-per-cell-signal-read',
        title: 'Read the selection inside a per-cell method',
        snippet: 'const active = this.selectedKey() === this.cellKey(row, col);',
        why: 'cellClass needs a row and a column, which a computed cannot take, so it stays a method. Its selectedKey() read runs while the template renders, so the OnPush view still updates the classes when the selection changes.',
        alternative: 'Build a computed grid of cell view models with ready-made class strings and read them in the template by row and column.',
        tradeoff: 'The method runs once per cell on each check, at most 400 short calls on a 20 by 20 board; a computed grid would cache the strings but rebuild all of them on every click anyway.',
      },
    ],
  },
  {
    questionId: 'angular-progress-bar-thresholds',
    nodes: [
      {
        id: 'd1-progress-signal',
        title: 'Keep one progress number in a signal',
        snippet: 'readonly progress = signal(0);',
        why: 'The percentage label, the fill width, aria-valuenow and the color class all read this value, so one update from a button moves every binding together.',
        alternative: 'Store the width string and the color class in their own fields and set them next to the number in inc() and dec().',
        tradeoff: 'Deriving everything from one number rules out a label and bar that disagree; the cost is calling progress() in each binding instead of reading a plain field.',
      },
      {
        id: 'd2-derive-threshold-class',
        title: 'Derive the color class from the value',
        snippet: 'readonly barClass = computed(() => {',
        why: 'barClass turns the number into bar red, bar orange or bar green in one place, the template binds it with [class], and the string is recalculated only when progress changes.',
        alternative: 'Write the three conditions inline with [ngClass] in the template, or return the class from a getter that runs on every check.',
        tradeoff: 'One computed keeps the template to a single binding and caches the result; inline conditions show the thresholds in the markup but repeat them anywhere else the color is needed.',
      },
      {
        id: 'd3-ordered-thresholds',
        title: 'Test the thresholds from low to high',
        snippet: "if (value <= 66) return 'bar orange';",
        why: 'The red check above returns first, so this line only sees values of 34 and up; <= 66 makes 66 orange and 67 green, as the hint under the bar states.',
        alternative: 'Test each band with both bounds, such as value >= 34 && value <= 66, so the checks can run in any order.',
        tradeoff: 'Ordered early returns are shorter, but reordering them changes the result; two-sided ranges survive reordering at the cost of repeating every bound.',
      },
      {
        id: 'd4-clamp-at-maximum',
        title: 'Cap the increase at 100 inside the update',
        snippet: 'this.progress.update((value) => Math.min(100, value + 10));',
        why: 'update reads the current value and Math.min caps the result, so pressing +10% at 100 stores 100 again instead of 110 and the label never reads 110%.',
        alternative: 'Disable the +10% button at 100 and skip the clamp in inc().',
        tradeoff: 'The clamp keeps the stored value valid for any caller; disabling the button as well would show that the limit is reached, which this solution leaves out.',
      },
      {
        id: 'd5-clamp-at-zero',
        title: 'Clamp the stored value at zero',
        snippet: 'this.progress.update((value) => Math.max(0, value - 10));',
        why: 'Math.max holds the value at 0, so -10% at 0 changes nothing, and the label, the width and aria-valuenow never show a negative number.',
        alternative: 'Let the number go below zero and clamp only the width binding in the template.',
        tradeoff: 'Clamping the stored number keeps every reader honest; clamping only the display would draw an empty bar while the label and aria-valuenow show -10.',
      },
    ],
  },
  {
    questionId: 'angular-nested-comments',
    nodes: [
      {
        id: 'd1-template-outlet-import',
        title: 'Import the template outlet for recursion',
        snippet: 'imports: [NgTemplateOutlet, FormsModule],',
        why: "treeTpl renders one level and calls itself for each node's children through ngTemplateOutlet; FormsModule serves the two ngModel drafts, and @for and @if need no import.",
        alternative: 'Import CommonModule for the outlet, or move each comment into a child component that renders its own replies.',
        tradeoff: "Importing NgTemplateOutlet alone keeps the dependency list exact and the state in one component; a recursive child component would isolate each comment's markup but need inputs and outputs for every action.",
      },
      {
        id: 'd2-tree-signal',
        title: 'Hold the whole tree in one signal',
        snippet: 'readonly comments = signal<CommentNode[]>([]);',
        why: 'Top-level comments and every nested reply live in this one array of nodes, so each add or reply is a single update, and the template starts its recursion from comments().',
        alternative: 'Keep a flat list of comments with a parentId on each and group the replies by parent while rendering.',
        tradeoff: 'A nested tree matches the rendering, but a deep insert must copy its path; a flat list turns every insert into an append and moves the work into grouping replies by parentId.',
      },
      {
        id: 'd3-single-active-reply',
        title: 'Store one active reply id',
        snippet: 'readonly activeReplyId = signal<string | null>(null);',
        why: 'Only the comment whose id equals activeReplyId() shows the reply box, so opening a box on another comment closes the previous one without touching the tree.',
        alternative: 'Give every node an isReplying flag and reset the others whenever one opens.',
        tradeoff: 'One id cannot hold two open drafts, which this UI does not want; per-node flags could, but closing the rest would need a walk over the whole tree on every Reply click.',
      },
      {
        id: 'd4-prepend-new-comment',
        title: 'Put new top-level comments first',
        snippet: 'this.comments.update((comments) => [comment, ...comments]);',
        why: 'The spread builds a new array with the new comment at the front, so the signal sees a new value while every existing comment object keeps its identity for track comment.id.',
        alternative: 'Insert the comment in place at the front of the array that comments() returns.',
        tradeoff: 'The copy costs one array per new comment; an in-place insert avoids it but leaves the signal holding the same array, so nothing computed from comments() would see the change.',
      },
      {
        id: 'd7-toggle-reply',
        title: 'Toggle the box from the stored id',
        snippet: 'this.activeReplyId.update((active) => (active === id ? null : id));',
        why: 'update reads the open id: Reply on the comment whose box is open stores null and closes it, and Reply on any other comment moves the one box there. The Reply button binds aria-expanded to the same comparison.',
        alternative: 'Always set the clicked id and leave closing to Cancel.',
        tradeoff: 'Setting the id is a shorter call, but a second click on Reply then changes nothing, while the spec and aria-expanded both describe Reply as a toggle.',
      },
      {
        id: 'd5-replace-tree-on-reply',
        title: 'Store a new tree for every reply',
        snippet: 'this.comments.update((comments) => this.withReply(comments, parentId, reply));',
        why: 'submitReply passes the current tree to withReply and stores the result, so the signal receives a new root array and the branch with the new reply re-renders.',
        alternative: 'Find the parent with a findById search and push the reply into parent.children.',
        tradeoff: 'withReply is longer than a push; the push repaints only because the Post click marks the view, so a computed over the tree or a reply that arrives from a request would never see it.',
      },
      {
        id: 'd6-keep-untouched-branches',
        title: 'Return untouched branches as they are',
        snippet: 'if (children === node.children) return node;',
        why: 'A branch without the parent gets its original children array back, so its node is returned unchanged and only the parent and its ancestors are copied with { ...node, children }.',
        alternative: 'Spread every node on the way down, rebuilding the whole tree for one reply.',
        tradeoff: 'The recursion still visits every node, but it allocates only along one path; copying everything is simpler to write but replaces objects that did not change.',
      },
    ],
  },
  {
    questionId: 'angular-control-value-accessor-stepper',
    nodes: [
      {
        id: 'd1-register-accessor',
        title: "Register the component as the control's accessor",
        snippet: '{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => QuantityStepperComponent), multi: true }',
        why: 'formControlName looks for NG_VALUE_ACCESSOR on its element; useExisting hands the form this instance, and forwardRef covers the class being declared after its decorator.',
        alternative: 'Inject NgControl into the component and set ngControl.valueAccessor = this.',
        tradeoff: "The provider works with every form directive and is the documented pattern; injecting NgControl also exposes the control's validity but needs care to avoid a circular provider.",
      },
      {
        id: 'd2-value-signal',
        title: 'Keep the shown value in a signal',
        snippet: 'protected readonly value = signal(0);',
        why: 'The form writes the value from outside the template, through writeValue; a signal write is what marks this OnPush view for check when that happens.',
        alternative: 'A plain value field that writeValue assigns.',
        tradeoff: 'A plain field can look right on the first render, but after form.reset() the OnPush stepper keeps the old number, because nothing in the parent changes its inputs.',
      },
      {
        id: 'd3-derived-buttons',
        title: 'Derive each button from value, flag and bound',
        snippet: 'protected readonly canIncrease = computed(() => !this.disabled() && this.value() < this.max());',
        why: 'The + button depends on the disabled flag, the value and the max input; a computed recalculates it when any of the three changes, and the template only binds the result.',
        alternative: 'Write the full condition in each disabled binding of the template.',
        tradeoff: 'Inline conditions are shorter to read once, but the rule would then live in two places, and step() could drift from what the buttons allow.',
      },
      {
        id: 'd4-write-value',
        title: 'Accept what the form writes, null included',
        snippet: 'this.value.set(value ?? this.min());',
        why: 'writeValue runs on start, setValue, patchValue and reset; a nullable form resets to null, which falls back to the minimum instead of rendering an empty stepper.',
        alternative: 'Ignore null and keep the previous value on screen.',
        tradeoff: 'Falling back to min shows a number the form does not hold until the next change; keeping the old value would show a number the form already discarded.',
      },
      {
        id: 'd5-report-change',
        title: 'Report a change only when the value moved',
        snippet: 'this.onChange(next);',
        why: 'The form hears about user changes only through the callback it registered; step() calls it after clamping, and the early return keeps a click at a bound from marking the control dirty.',
        alternative: 'Call the change callback on every click, or from writeValue as well.',
        tradeoff: 'Calling it from writeValue would echo every form write back as a user edit; skipping no-op clicks costs one comparison.',
      },
      {
        id: 'd6-report-touch',
        title: 'Report a touch when focus leaves',
        snippet: 'this.onTouched();',
        why: 'The (focusout) host listener calls markTouched(), which forwards to the registered callback, so the control becomes touched the way a native input does on blur.',
        alternative: 'Mark the control touched on the first click instead.',
        tradeoff: 'Touched on click flags the control earlier, which suits steppers used only by mouse; focusout matches the built-in accessors and keyboard users.',
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
