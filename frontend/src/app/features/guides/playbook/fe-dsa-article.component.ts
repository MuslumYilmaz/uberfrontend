// features/guides/playbook/fe-dsa-article.component.ts
// -----------------------------------------------------------------------------
// DSA for Frontend Interviews
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';
import { PUBLIC_EDITORIAL_FACTS } from '../../../core/content/public-editorial-facts';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    a {
      color: #7cc2ff;
      text-decoration: none;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    a:hover {
      color: #a9dbff;
      text-decoration: underline;
    }
    .freshness {
      margin: 0 0 16px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
      font-size: 12px;
    }
    .practice-proof {
      display: grid;
      gap: 14px;
      margin: 18px 0 24px;
      padding: 14px;
      border: 1px solid var(--uf-border-subtle);
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 82%, transparent);
    }
    .proof-stats,
    .pattern-grid,
    .worked-grid,
    .format-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      padding-left: 0;
      list-style: none;
    }
    .proof-stats {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
    .proof-stat,
    .pattern-card,
    .worked-panel,
    .format-link {
      min-width: 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      padding: 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
    }
    .proof-stat strong {
      display: block;
      color: var(--uf-text-primary);
      font-size: 1rem;
    }
    .proof-stat span {
      display: block;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 0.86rem;
    }
    .proof-actions,
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .proof-cta,
    .card-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
    }
    .proof-cta--primary {
      color: var(--uf-bg);
      background: var(--uf-accent);
      border-color: color-mix(in srgb, var(--uf-accent) 84%, var(--uf-border-subtle));
    }
    .pattern-card,
    .format-link {
      display: grid;
      gap: 8px;
    }
    a.pattern-card,
    .format-link {
      text-decoration: none;
    }
    a.pattern-card:hover,
    .format-link:hover,
    .card-link:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
    }
    .pattern-card h3,
    .worked-panel h3,
    .format-link strong {
      margin: 0;
      color: var(--uf-text-primary);
    }
    .pattern-card p,
    .worked-panel p,
    .format-link span {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .pattern-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.78rem;
      color: color-mix(in srgb, var(--uf-text-tertiary) 88%, transparent);
    }
    .pattern-meta span {
      padding: 2px 8px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface) 82%, transparent);
    }
    .pattern-card__focus,
    .question-map p {
      font-size: 0.9rem;
    }
    .question-map li {
      margin-bottom: 12px;
    }
    .question-map p {
      margin: 4px 0 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .worked-grid {
      margin: 14px 0;
    }
    .worked-panel ul {
      margin-bottom: 0;
    }
    .code-wrap {
      overflow-x: auto;
      margin: 14px 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 88%, transparent);
    }
    .code-wrap pre {
      margin: 0;
      padding: 12px;
      min-width: 540px;
      color: var(--uf-text-primary);
      font-size: 0.85rem;
      line-height: 1.55;
    }
    .table-wrap {
      overflow-x: auto;
      margin: 14px 0;
    }
    .table-wrap table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    .table-wrap th,
    .table-wrap td {
      border: 1px solid var(--uf-border-subtle);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    .table-wrap th {
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-surface-alt) 86%, transparent);
    }
  `],
  template: `
  <fa-guide-shell
    title="DSA for Frontend Interviews: Data Structures, Algorithms, and Practice Map (2026)"
    subtitle="A practice-first map for the arrays, hash maps, stacks, queues, trees, recursion, cache, and Big-O patterns frontend coding rounds actually test."
    [minutes]="18"
    [tags]="['dsa','javascript','practice-map']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="dsa-guide-freshness">
      Last updated: June 2026 | Author: {{ editorialAuthor }}
    </div>

    <p>
      You do not need red-black trees to pass most frontend interviews. You do need
      enough DSA to answer frontend algorithm interview questions, shape API data,
      avoid slow list operations, traverse nested UI data, and explain why your
      JavaScript solution stays correct under edge cases.
    </p>
    <p>
      Use this page as a frontend DSA practice map. It keeps the LeetCode grind out of
      scope and points you toward the data structures, algorithms, and direct drills that
      are most useful for frontend coding rounds.
    </p>

    <div class="practice-proof" data-testid="dsa-guide-practice-proof">
      <div class="proof-stats" aria-label="FrontendAtlas DSA practice proof">
        <div class="proof-stat">
          <strong>500+</strong>
          <span>practice questions</span>
        </div>
        <div class="proof-stat">
          <strong>JavaScript</strong>
          <span>DSA drills</span>
        </div>
        <div class="proof-stat">
          <strong>Live</strong>
          <span>editor + checks</span>
        </div>
        <div class="proof-stat">
          <strong>Frontend</strong>
          <span>data patterns</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="DSA guide practice actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'js-fn' }">
          Start JavaScript DSA drills
        </a>
        <a class="proof-cta" [routerLink]="['/guides','interview-blueprint','javascript-interviews']">
          Review JavaScript interview map
        </a>
      </div>
    </div>

    <h2 id="most-asked-frontend-dsa-patterns">Most asked frontend DSA and algorithm interview patterns</h2>
    <p>
      These are the patterns that repeatedly show up because they map to real UI work:
      data shaping, selection state, nested rendering, cached lookups, and async scheduling.
    </p>
    <div class="pattern-grid" data-testid="dsa-pattern-cards">
      <a class="pattern-card" [routerLink]="['/javascript','coding','js-array-prototype-reduce']" data-testid="dsa-pattern-array-reduce">
        <div class="pattern-meta"><span>Arrays</span><span>Must know</span></div>
        <h3>Array/reduce</h3>
        <p>Requirement: transform, summarize, or accumulate list data without losing order.</p>
        <p class="pattern-card__focus">Test focus: initial value, empty arrays, callback arguments, O(n) scans.</p>
      </a>
      <div class="pattern-card" data-testid="dsa-pattern-hash-map-set">
        <div class="pattern-meta"><span>Hashing</span><span>Core</span></div>
        <h3>Hash Map/Set</h3>
        <p>Requirement: count, dedupe, and check membership without nested loops.</p>
        <p class="pattern-card__focus">Test focus: key policy, object vs Map, Set identity, O(1) average lookups.</p>
      </div>
      <a class="pattern-card" [routerLink]="['/javascript','coding','js-group-by']" data-testid="dsa-pattern-groupby">
        <div class="pattern-meta"><span>Data shaping</span><span>UI lists</span></div>
        <h3>GroupBy</h3>
        <p>Requirement: group records by a derived key for sections, tables, or analytics.</p>
        <p class="pattern-card__focus">Test focus: empty input, duplicate keys, key coercion, output shape.</p>
      </a>
      <a class="pattern-card" [routerLink]="['/javascript','coding','js-flatten-depth']" data-testid="dsa-pattern-flatten">
        <div class="pattern-meta"><span>Recursion</span><span>Nested data</span></div>
        <h3>Flatten/recursion</h3>
        <p>Requirement: normalize nested arrays or UI data to a requested depth.</p>
        <p class="pattern-card__focus">Test focus: depth boundary, mixed primitives, iterative fallback, stack overflow risk.</p>
      </a>
      <a class="pattern-card" [routerLink]="['/javascript','coding','js-stack-queue-implementation']" data-testid="dsa-pattern-stack-queue">
        <div class="pattern-meta"><span>Ordering</span><span>History</span></div>
        <h3>Stack/Queue</h3>
        <p>Requirement: model LIFO history and FIFO work without slow queue operations.</p>
        <p class="pattern-card__focus">Test focus: Array.shift() O(n) trap, head-index queue, undo/redo state.</p>
      </a>
      <div class="pattern-card" data-testid="dsa-pattern-tree-traversal">
        <div class="pattern-meta"><span>Trees</span><span>DOM-shaped</span></div>
        <h3>Tree DFS/BFS</h3>
        <p>Requirement: traverse nested comments, menus, folders, or component trees.</p>
        <p class="pattern-card__focus">Test focus: traversal order, cycles policy, empty children, recursion depth.</p>
      </div>
      <div class="pattern-card" data-testid="dsa-pattern-sorting-search">
        <div class="pattern-meta"><span>Search</span><span>Tables</span></div>
        <h3>Sorting/search</h3>
        <p>Requirement: sort rows predictably and search sorted data without scanning.</p>
        <p class="pattern-card__focus">Test focus: stable compare, locale/string pitfalls, binary search boundaries.</p>
      </div>
      <div class="pattern-card" data-testid="dsa-pattern-two-pointers">
        <div class="pattern-meta"><span>Pointers</span><span>Strings</span></div>
        <h3>Two pointers/sliding window</h3>
        <p>Requirement: scan strings or arrays once while maintaining a moving range.</p>
        <p class="pattern-card__focus">Test focus: left/right updates, duplicates, off-by-one bugs, window invariant.</p>
      </div>
      <div class="pattern-card" data-testid="dsa-pattern-intervals">
        <div class="pattern-meta"><span>Ranges</span><span>Scheduling</span></div>
        <h3>Intervals</h3>
        <p>Requirement: merge, insert, or detect overlap in calendar-like UI ranges.</p>
        <p class="pattern-card__focus">Test focus: boundary inclusivity, sorted input, adjacent ranges, empty input.</p>
      </div>
      <a class="pattern-card" [routerLink]="['/javascript','coding','js-create-lru-cache']" data-testid="dsa-pattern-lru">
        <div class="pattern-meta"><span>Cache</span><span>Bounded memory</span></div>
        <h3>LRU cache</h3>
        <p>Requirement: keep recent lookups fast while evicting old entries.</p>
        <p class="pattern-card__focus">Test focus: Map ordering, get/put complexity, eviction, capacity zero.</p>
      </a>
      <div class="pattern-card" data-testid="dsa-pattern-deep-clone-equal">
        <div class="pattern-meta"><span>Objects</span><span>State</span></div>
        <h3>Deep clone/equal</h3>
        <p>Requirement: copy or compare nested objects without breaking identity rules.</p>
        <p class="pattern-card__focus">Test focus: arrays, dates, functions, cycles, references.</p>
        <div class="card-actions">
          <a class="card-link" [routerLink]="['/javascript','coding','js-deep-clone']">Deep clone</a>
          <a class="card-link" [routerLink]="['/javascript','coding','js-deep-equal']">Deep equal</a>
        </div>
      </div>
      <div class="pattern-card" data-testid="dsa-pattern-async-queue">
        <div class="pattern-meta"><span>Async</span><span>Queues</span></div>
        <h3>Async queue/concurrency</h3>
        <p>Requirement: process async work with ordering, limits, and stale-response policy.</p>
        <p class="pattern-card__focus">Test focus: result order, fail policy, cancellation, take latest behavior.</p>
        <div class="card-actions">
          <a class="card-link" [routerLink]="['/javascript','coding','js-concurrency-map-limit']">Concurrency map</a>
          <a class="card-link" [routerLink]="['/javascript','coding','js-take-latest']">Take latest</a>
        </div>
      </div>
    </div>

    <h2 id="what-to-actually-know">What to actually know</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Topic</th><th>You should be able to</th><th>Real frontend tie-in</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Arrays and strings</strong></td>
            <td>Map, filter, reduce, slice, split, join, scan once, avoid accidental O(n^2).</td>
            <td>Format API data, paginate lists, search text, build derived UI rows.</td>
          </tr>
          <tr>
            <td><strong>Map and Set</strong></td>
            <td>Count, dedupe, group, memoize, and check membership with clear key policy.</td>
            <td>Selected IDs, tag filters, grouped sections, analytics counts.</td>
          </tr>
          <tr>
            <td><strong>Stack and queue</strong></td>
            <td>Use LIFO for history and FIFO for work queues without slow shifts.</td>
            <td>Undo/redo, toasts, task runners, breadcrumb/back-forward flows.</td>
          </tr>
          <tr>
            <td><strong>Trees and recursion</strong></td>
            <td>Traverse nested data with DFS/BFS and name recursion depth risks.</td>
            <td>DOM-shaped data, comments, folders, menus, nested checkboxes.</td>
          </tr>
          <tr>
            <td><strong>Sorting and searching</strong></td>
            <td>Use comparators, stable tie-breakers, and binary search when data is sorted.</td>
            <td>Data tables, ranked lists, typeahead indices, range filtering.</td>
          </tr>
          <tr>
            <td><strong>Big-O intuition</strong></td>
            <td>Explain time and space trade-offs before optimizing.</td>
            <td>Large lists, virtualized UIs, cached lookups, client-side filtering.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="frontend-dsa-question-map">Frontend DSA question map</h2>
    <p>
      Use these prompts as a checklist. Start with the direct drills, then fill the gaps
      with small local implementations when a prompt has no dedicated route yet.
    </p>
    <ol class="question-map" data-testid="dsa-question-map">
      <li id="question-1"><a [routerLink]="['/javascript','coding','js-array-prototype-reduce']">Implement Array.prototype.reduce.</a><p>Tests accumulator state, initial value behavior, empty arrays, and callback order.</p></li>
      <li id="question-2"><strong>Remove duplicates with Set.</strong><p>Tests identity, output order, primitive vs object values, and O(n) dedupe.</p></li>
      <li id="question-3"><strong>Count values with a frequency map.</strong><p>Tests key normalization, missing keys, repeated values, and object vs Map trade-offs.</p></li>
      <li id="question-4"><a [routerLink]="['/javascript','coding','js-group-by']">Group records by status or category.</a><p>Tests derived keys, empty input, duplicate keys, and UI-ready output shape.</p></li>
      <li id="question-5"><a [routerLink]="['/javascript','coding','js-flatten-depth']">Flatten nested arrays to a requested depth.</a><p>Tests recursion, depth boundary, mixed primitives, and iterative alternatives.</p></li>
      <li id="question-6"><a [routerLink]="['/javascript','coding','js-deep-clone']">Deep clone nested UI state.</a><p>Tests arrays, objects, dates, cycles, unsupported values, and reference identity.</p></li>
      <li id="question-7"><a [routerLink]="['/javascript','coding','js-deep-equal']">Deep equal two state snapshots.</a><p>Tests recursive comparison, key order, arrays, primitives, and object references.</p></li>
      <li id="question-8"><a [routerLink]="['/javascript','coding','js-stack-queue-implementation']">Implement stack and queue in JavaScript.</a><p>Tests push/pop, enqueue/dequeue, peek, size, and O(1) queue strategy.</p></li>
      <li id="question-9"><a [routerLink]="['/javascript','coding','js-stack-queue-implementation']">Model undo/redo with two stacks.</a><p>Tests past/future state, clearing redo on new action, and empty history behavior.</p></li>
      <li id="question-10"><strong>Traverse nested comments with DFS or BFS.</strong><p>Tests traversal order, empty children, recursion depth, and cycle assumptions.</p></li>
      <li id="question-11"><strong>Sort and paginate table rows.</strong><p>Tests comparator correctness, stable tie-breakers, derived pages, and empty states.</p></li>
      <li id="question-12"><strong>Binary search a sorted ID list.</strong><p>Tests left/right bounds, insertion points, not-found behavior, and off-by-one safety.</p></li>
      <li id="question-13"><strong>Detect repeated values in a list.</strong><p>Tests Set membership, early return, object identity, and O(n) vs O(n^2).</p></li>
      <li id="question-14"><strong>Merge simple calendar intervals.</strong><p>Tests sorting, overlap policy, adjacent boundaries, and empty input.</p></li>
      <li id="question-15"><a [routerLink]="['/javascript','coding','js-create-lru-cache']">Build an LRU cache with bounded memory.</a><p>Tests Map ordering, get/put complexity, eviction, and capacity edge cases.</p></li>
      <li id="question-16"><a [routerLink]="['/javascript','coding','js-concurrency-map-limit']">Build a concurrency-limited async map.</a><p>Tests queues, ordering, resource limits, failures, and async control flow.</p></li>
      <li id="question-17"><a [routerLink]="['/javascript','coding','js-take-latest']">Implement takeLatest to ignore stale async responses.</a><p>Tests request identity, cancellation strategy, race conditions, and stale UI prevention.</p></li>
      <li id="question-18"><a [routerLink]="['/javascript','trivia','js-queue-vs-stack']">Choose stack vs queue for a frontend workflow.</a><p>Tests LIFO/FIFO reasoning, queue implementation cost, and UI behavior fit.</p></li>
      <li id="question-19"><a [routerLink]="['/javascript','trivia','js-queue-vs-stack']">Spot the Array.shift performance bug.</a><p>Tests queue complexity, head-index alternatives, and performance explanation.</p></li>
      <li id="question-20"><strong>Explain the Big-O trade-off for a large filtered list.</strong><p>Tests when to preindex with Map, when to spend memory, and how to justify trade-offs.</p></li>
    </ol>

    <h2 id="worked-examples">Worked examples to rehearse</h2>
    <div class="worked-grid">
      <div class="worked-panel">
        <h3>groupBy</h3>
        <p><strong>Input contract:</strong> array of records plus a key function.</p>
        <ul>
          <li><strong>Key policy:</strong> decide whether keys are strings, numbers, or full Map keys.</li>
          <li><strong>Edge cases:</strong> empty input returns an empty object or Map; duplicate keys append.</li>
          <li><strong>Object vs Map:</strong> object is convenient for string keys; Map is safer for arbitrary keys.</li>
          <li><strong>Complexity:</strong> O(n) time and O(n) output space.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>flatten(depth)</h3>
        <p><strong>Depth boundary:</strong> depth 0 returns a shallow copy; each level removes one nesting layer.</p>
        <ul>
          <li><strong>Mixed primitives:</strong> preserve non-array values as-is.</li>
          <li><strong>Recursion vs iterative:</strong> recursion is clear, iterative avoids call stack limits.</li>
          <li><strong>Stack overflow note:</strong> ask about input depth if nested data can be very deep.</li>
          <li><strong>Complexity:</strong> O(n) over visited values.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>stack/queue</h3>
        <p><strong>Array.shift() O(n) trap:</strong> shifting every dequeue can make an intended O(n) workflow O(n^2).</p>
        <ul>
          <li><strong>Head-index queue:</strong> keep a pointer and advance it for O(1) amortized dequeue.</li>
          <li><strong>Undo/redo state model:</strong> past stack, current value, future stack.</li>
          <li><strong>Edge cases:</strong> empty undo, empty redo, new action clears future.</li>
          <li><strong>Big-O:</strong> stack push/pop O(1), head-index queue operations O(1) amortized.</li>
        </ul>
      </div>
      <div class="worked-panel">
        <h3>LRU cache</h3>
        <p><strong>Map ordering:</strong> delete and re-set a key to mark it as most recently used.</p>
        <ul>
          <li><strong>Eviction:</strong> remove the oldest key when size exceeds capacity.</li>
          <li><strong>get/put complexity:</strong> O(1) average if Map operations stay constant time.</li>
          <li><strong>Bounded memory:</strong> capacity is part of the contract, not an afterthought.</li>
          <li><strong>Edge cases:</strong> capacity zero, updating existing keys, missing gets.</li>
        </ul>
      </div>
    </div>
    <div class="code-wrap">
      <pre><code>const cache = new Map();

function touch(key, value) &#123;
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size &gt; capacity) &#123;
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  &#125;
&#125;</code></pre>
    </div>

    <h2 id="frontend-dsa-round-flow">45-minute frontend DSA round flow</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Move</th><th>Signal</th></tr>
        </thead>
        <tbody>
          <tr><td>0-5 min</td><td>Clarify input, output, size, duplicates, empty cases, and mutation policy.</td><td>You do not code against hidden assumptions.</td></tr>
          <tr><td>5-12 min</td><td>State a brute force approach and its Big-O.</td><td>You can reason before optimizing.</td></tr>
          <tr><td>12-18 min</td><td>Choose the data structure and name the trade-off.</td><td>You pick Map, Set, stack, queue, or traversal for a reason.</td></tr>
          <tr><td>18-35 min</td><td>Implement the smallest correct version in clean JavaScript.</td><td>You ship working code under time pressure.</td></tr>
          <tr><td>35-45 min</td><td>Dry run, test edge cases, and explain complexity.</td><td>You can verify and repair without prompting.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="scoring-rubric">Scoring rubric</h2>
    <ul>
      <li><strong>Correctness:</strong> handles base cases, empty input, duplicates, and boundary conditions.</li>
      <li><strong>Data structure fit:</strong> avoids O(n^2) scans when a Map, Set, stack, or queue is the simple fix.</li>
      <li><strong>Communication:</strong> explains brute force, optimized approach, and trade-offs out loud.</li>
      <li><strong>JavaScript fluency:</strong> knows array method costs, Map/Set behavior, and mutation risks.</li>
      <li><strong>Testing discipline:</strong> dry runs representative examples before calling the solution done.</li>
    </ul>

    <h2 id="skip-vs-prioritize">What to skip, know lightly, and prioritize</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Priority</th><th>Topics</th><th>Reason</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Prioritize</strong></td><td>Arrays, strings, Map, Set, stacks, queues, recursion, trees, Big-O.</td><td>These appear directly in frontend UI and JavaScript coding prompts.</td></tr>
          <tr><td><strong>Know lightly</strong></td><td>Two pointers, sliding window, intervals, binary search, simple DP memoization.</td><td>Useful for algorithm rounds, but usually not the core frontend signal.</td></tr>
          <tr><td><strong>Skip unless required</strong></td><td>AVL/red-black trees, max-flow, segment trees, Fenwick trees, advanced graph algorithms.</td><td>Low ROI for most frontend loops unless the recruiter says DSA-heavy.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="one-week-study-plan">Mini study plan (1 week)</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Day</th><th>Focus</th><th>Target</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Mon</strong></td><td>Arrays and reduce</td><td>Reduce, count, dedupe, and explain O(n) vs O(n^2).</td></tr>
          <tr><td><strong>Tue</strong></td><td>Map and Set</td><td>GroupBy, frequency map, selected IDs, object vs Map trade-offs.</td></tr>
          <tr><td><strong>Wed</strong></td><td>Stack and queue</td><td>Stack/queue implementation, undo/redo, Array.shift() O(n) trap.</td></tr>
          <tr><td><strong>Thu</strong></td><td>Trees and recursion</td><td>DFS/BFS nested data, flatten depth, recursion depth notes.</td></tr>
          <tr><td><strong>Fri</strong></td><td>Cache and async queues</td><td>LRU cache, concurrency-limited map, takeLatest.</td></tr>
          <tr><td><strong>Sat</strong></td><td>Mock round</td><td>One 45-minute prompt with clarify, implement, dry run, and retro.</td></tr>
          <tr><td><strong>Sun</strong></td><td>Review</td><td>Redo weak drills and write a short complexity note for each miss.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="choose-your-next-practice-format">Choose your next practice format</h2>
    <div class="format-grid" data-testid="dsa-format-links">
      <a class="format-link" [routerLink]="['/coding']" [queryParams]="{ view: 'formats', category: 'js-fn' }">
        <strong>JavaScript function drills</strong>
        <span>Practice data structures, arrays, object helpers, async queues, and utility prompts.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','javascript-interviews']">
        <strong>JavaScript interview map</strong>
        <span>Pair DSA patterns with async, promises, closures, DOM, and utility-function prep.</span>
      </a>
      <a class="format-link" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
        <strong>Frontend coding guide</strong>
        <span>Move from data structures into UI coding, machine coding prompts, and scoring strategy.</span>
      </a>
    </div>

    <h2 id="frontend-dsa-faq">FAQ</h2>
    <div data-testid="dsa-guide-faq">
      <h3>Is DSA required for frontend interviews?</h3>
      <p>
        Basic DSA is often required. Frontend algorithm interview questions usually emphasize
        arrays, hash maps, stacks, queues, recursion, tree traversal, and Big-O reasoning
        more than obscure algorithms.
      </p>
      <h3>Do frontend interviews ask algorithm questions?</h3>
      <p>
        Yes, many frontend interviews ask algorithm questions, but the strongest signal is
        usually practical JavaScript data work: grouping, deduping, traversal, caching,
        async queues, and explaining complexity.
      </p>
      <h3>What DSA should frontend engineers prioritize?</h3>
      <p>
        Prioritize arrays, strings, Map, Set, stack, queue, recursion, tree DFS/BFS,
        sorting/search basics, LRU cache, and the ability to explain complexity clearly.
      </p>
      <h3>How should I practice JavaScript DSA for frontend interviews?</h3>
      <p>
        Start with JavaScript DSA practice drills for reduce, groupBy, flatten, stack/queue,
        LRU cache, concurrency limits, and takeLatest. Then dry run edge cases and explain
        the Big-O trade-off for each solution.
      </p>
      <h3>How much LeetCode should I do for frontend interviews?</h3>
      <p>
        Do enough to recognize common patterns, then shift to frontend-flavored drills.
        Random grinding is lower ROI than practicing data shaping, nested traversal, cache,
        and async queue prompts.
      </p>
    </div>
  </fa-guide-shell>
  `
})
export class FeDsaArticle {
  readonly editorialAuthor = PUBLIC_EDITORIAL_FACTS.author.name;
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
