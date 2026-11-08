import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  getMonacoModelValue,
  setMonacoModelValue,
  waitForIndexedDbKeyPrefixContains,
  waitForIndexedDbKeyPrefixNotContains,
} from './helpers';
import { buildMockUser, installAuthMock } from './auth-mocks';

type SolutionFile = string | { code?: unknown };
type CachedRuntimeResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

const FRAMEWORK_RUNTIME_RESPONSES = new Map<string, Promise<CachedRuntimeResponse>>();

const RUNNER_FAILURE =
  /framework checks timed out waiting for preview render|framework assertion execution timed out|preview readiness timed out|infrastructure timeout/i;

const COUNTER_SOLUTION = readCanonicalFile(
  '../cdn/sb/react/solution/react-counter-solution.v1.json',
  'src/App.tsx',
);

const COUNTER_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-counter-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-counter-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-counter-pressure-solution.v1.json',
  ),
} as const;

const REVIEW_SOLUTION = readCanonicalFiles(
  '../cdn/sb/vue/solution/vue-issue-list-merge-request-review-solution.v1.json',
);
// The fixes live in the component and its stylesheet; the spec is reviewed, not run.
const REVIEW_FIXES = { 'src/App.vue': REVIEW_SOLUTION['src/App.vue'], 'src/App.css': REVIEW_SOLUTION['src/App.css'] };

const DEBOUNCE_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-debounced-search-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-debounced-search-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-debounced-search-pressure-solution.v1.json',
  ),
} as const;

const TODO_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-todo-list-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-todo-list-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-todo-list-pressure-solution.v1.json',
  ),
} as const;

const SHOPPING_CART_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-shopping-cart-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-shopping-cart-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-shopping-cart-pressure-solution.v1.json',
  ),
} as const;

const CHIPS_INPUT_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-chips-input-autocomplete-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-chips-input-autocomplete-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-chips-input-autocomplete-pressure-solution.v1.json',
  ),
} as const;

const PAGINATION_TABLE_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-pagination-table-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-pagination-table-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-pagination-table-pressure-solution.v1.json',
  ),
} as const;

const AUTOCOMPLETE_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-autocomplete-search-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-autocomplete-search-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-autocomplete-search-pressure-solution.v1.json',
  ),
} as const;

const TEAM_LIST_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-fetch-list-states-pressure-solution.v1.json',
);

const NESTED_COMMENTS_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-nested-comments-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-nested-comments-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-nested-comments-pressure-solution.v1.json',
  ),
} as const;

const CONTACT_FORM_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-contact-form-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-contact-form-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-contact-form-pressure-solution.v1.json',
  ),
} as const;

const CHAT_STREAMING_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-chat-streaming-ui-pressure-solution.v1.json',
);

const USE_EFFECT_ONCE_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-use-effect-once-pressure-solution.v1.json',
);

const DEBUG_DOUBLE_RENDER_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-debug-double-render-pressure-solution.v1.json',
);

// Each file must compile on its own while the bundle loads, so the child comes before the parent that uses it.
const TWO_WAY_CONTROL_PRESSURE_SOLUTION = (() => {
  const files = readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-input-output-two-way-pressure-solution.v1.json',
  );
  const order = [
    'src/app/child.component.ts',
    'src/app/child.component.html',
    'src/app/child.component.css',
    'src/app/app.component.ts',
    'src/app/app.component.html',
    'src/app/app.component.css',
  ];
  return Object.fromEntries(order.map((file) => [file, files[file]]));
})();

const MULTI_STEP_FORM_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-multi-step-form-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-multi-step-form-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-multi-step-form-pressure-solution.v1.json',
  ),
} as const;

const NESTED_CHECKBOXES_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-nested-checkboxes-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-nested-checkboxes-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-nested-checkboxes-pressure-solution.v1.json',
  ),
} as const;

const IMAGE_SLIDER_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-image-slider-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-image-slider-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-image-slider-pressure-solution.v1.json',
  ),
} as const;

const FILE_EXPLORER_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-file-explorer-pressure-solution.v1.json',
);

const TRANSCRIPT_SYNC_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-debug-transcript-sync-pressure-solution.v1.json',
);

const FILES_TABLE_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-files-table-select-all-pressure-solution.v1.json',
);

const BOOKING_WIDGET_PRESSURE_SOLUTION = readCanonicalFiles(
  '../cdn/sb/react/solution/react-listing-booking-widget-pressure-solution.v1.json',
);

const LIKE_BUTTON_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-like-button-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-like-button-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-like-button-pressure-solution.v1.json',
  ),
} as const;

const TRANSFER_LIST_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-transfer-list-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-transfer-list-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-transfer-list-pressure-solution.v1.json',
  ),
} as const;

const ACCORDION_FAQ_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-accordion-faq-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-faq-accordion-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-accordion-faq-pressure-solution.v1.json',
  ),
} as const;

const TICTACTOE_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-tictactoe-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-tictactoe-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-tictactoe-pressure-solution.v1.json',
  ),
} as const;

const CHESSBOARD_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-chessboard-click-highlight-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-chessboard-click-highlight-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-chessboard-click-highlight-pressure-solution.v1.json',
  ),
} as const;

const DYNAMIC_COUNTER_BUTTONS_PRESSURE_SOLUTIONS = {
  react: readCanonicalFiles(
    '../cdn/sb/react/solution/react-dynamic-counter-buttons-pressure-solution.v1.json',
  ),
  angular: readCanonicalFiles(
    '../cdn/sb/angular/solution/angular-dynamic-counter-buttons-pressure-solution.v1.json',
  ),
  vue: readCanonicalFiles(
    '../cdn/sb/vue/solution/vue-dynamic-counter-buttons-pressure-solution.v1.json',
  ),
} as const;

type PressureFlowContract = {
  checkCounts: number[];
  roundIds: string[];
  debriefText: string;
};

const COUNTER_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'base-correctness',
    'configurable-step',
    'keyboard-accessibility',
    'auto-lifecycle',
  ],
  debriefText: 'You handled a changing interview contract',
};

const TRANSCRIPT_SYNC_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [2, 3, 4, 6],
  roundIds: [
    'clock-follows-the-controls',
    'search-while-it-plays',
    'switch-languages-mid-review',
    'loop-and-seek',
  ],
  debriefText: 'You kept the transcript in step with the audio',
};

const FILES_TABLE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'select-all-across-pages',
    'filter-and-sort',
    'download-request',
    'full-export',
  ],
  debriefText: 'You kept the selection true at any size',
};

const BOOKING_WIDGET_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5, 6],
  roundIds: [
    'price-the-stay',
    'guests-within-the-cap',
    'booked-dates',
    'confirm-dialog',
    'guest-currency',
  ],
  debriefText: 'You priced the stay and booked it once',
};

const DEBOUNCE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'base-debounce',
    'state-recovery',
    'latest-query-wins',
    'accessible-lifecycle',
  ],
  debriefText: 'You kept async search correct under pressure',
};

const TODO_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-transitions',
    'derived-filters',
    'keyboard-editing',
    'undo-lifecycle',
  ],
  debriefText: 'You kept task state predictable under pressure',
};

const SHOPPING_CART_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-cart-transitions',
    'quantity-boundaries',
    'inventory-guard',
    'promo-and-checkout',
  ],
  debriefText: 'You kept cart state correct under pressure',
};

const CHIPS_INPUT_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-suggestion-selection',
    'token-normalization',
    'keyboard-lifecycle',
    'invite-limit-and-accessibility',
  ],
  debriefText: 'You kept invite input predictable under pressure',
};

const PAGINATION_TABLE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-page-window',
    'filter-and-page-reset',
    'sort-and-page-size',
    'selection-and-accessibility',
  ],
  debriefText: 'You kept table state predictable under pressure',
};

const AUTOCOMPLETE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-search',
    'keyboard-selection',
    'instant-repeat-searches',
    'accessibility-and-cleanup',
  ],
  debriefText: 'You kept the search predictable as it grew',
};

const TEAM_LIST_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'request-states',
    'refresh-keeps-list',
    'newest-request-wins',
    'real-cancellation',
  ],
  debriefText: 'You kept every request state honest',
};

const NESTED_COMMENTS_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-thread',
    'keyboard-flow',
    'hide-threads',
    'safe-delete',
  ],
  debriefText: 'You kept the thread correct as it grew',
};

const CONTACT_FORM_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'validation',
    'one-request',
    'failure-recovery',
    'slow-server-and-accessibility',
  ],
  debriefText: "You protected the user's work in every outcome",
};

const CHAT_STREAMING_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'stream-the-answer',
    'stop-keeps-the-text',
    'failure-and-retry',
    'announcements-and-cleanup',
  ],
  debriefText: 'You kept the stream under control',
};

const USE_EFFECT_ONCE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'one-connection',
    'prove-the-order',
    'connecting-takes-time',
    'settings-without-reconnecting',
  ],
  debriefText: 'You kept every connection accounted for',
};

const DEBUG_DOUBLE_RENDER_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'one-click-one-render',
    'do-not-copy-props',
    'typing-leaves-the-badge-alone',
    'many-updates-one-render',
  ],
  debriefText: 'You removed every render that had no reason to happen',
};

const TWO_WAY_CONTROL_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 4],
  roundIds: [
    'parent-owns-the-value',
    'changes-from-the-parent',
    'work-inside-a-form',
    'keyboard-and-names',
  ],
  debriefText: 'You built a control other teams can reuse',
};

const MULTI_STEP_FORM_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'valid-navigation',
    'edit-from-summary',
    'company-step',
    'finish-and-focus',
  ],
  debriefText: 'You kept the signup moving without losing anything',
};

const NESTED_CHECKBOXES_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'parent-child-sync',
    'deep-tree',
    'locked-items',
    'selection-summary',
  ],
  debriefText: 'You kept the whole tree consistent',
};

const IMAGE_SLIDER_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'one-current-slide',
    'autoplay',
    'keyboard-and-screen-readers',
    'slides-can-disappear',
  ],
  debriefText: 'You kept every slide change under control',
};

const FILE_EXPLORER_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'folders-and-files',
    'keyboard',
    'load-when-opened',
    'rename',
  ],
  debriefText: 'You turned a static tree into a working file explorer',
};

const LIKE_BUTTON_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'update-first',
    'server-says-no',
    'fast-clicks',
    'say-what-happened',
  ],
  debriefText: 'You kept the button fast and the server honest',
};

const TRANSFER_LIST_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'move-between-lists',
    'select-many',
    'search-inside-a-list',
    'undo-and-announce',
  ],
  debriefText: 'You kept every item in exactly one place',
};

const ACCORDION_FAQ_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-disclosure',
    'mode-transition-invariant',
    'keyboard-focus-navigation',
    'accessible-disclosure-contract',
  ],
  debriefText: 'You kept disclosure state predictable under pressure',
};

const TICTACTOE_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-turn-invariants',
    'outcome-and-reset',
    'branching-history',
    'accessible-grid-navigation',
  ],
  debriefText: 'You kept branching game state correct under pressure',
};

const CHESSBOARD_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-single-selection',
    'dynamic-size-boundaries',
    'queen-reachable-highlights',
    'accessible-grid-navigation',
  ],
  debriefText: 'You kept dynamic board state predictable under pressure',
};

const DYNAMIC_COUNTER_BUTTONS_PRESSURE_FLOW: PressureFlowContract = {
  checkCounts: [1, 2, 3, 5],
  roundIds: [
    'core-grow-invariants',
    'stable-removal-boundaries',
    'bounded-growth-reset',
    'accessible-list-navigation',
  ],
  debriefText: 'You kept dynamic counter state predictable under pressure',
};

const AUTOCOMPLETE_SOLUTION = readCanonicalFile(
  '../cdn/sb/react/solution/react-autocomplete-search-solution.v2.json',
  'src/App.tsx',
);

const VUE_TODO_STARTER = readCanonicalFile(
  '../cdn/sb/vue/question/vue-todo-list.v2.json',
  'src/App.vue',
);

const VUE_TODO_SOLUTION = readCanonicalFile(
  '../cdn/sb/vue/solution/vue-todo-list-solution.v1.json',
  'src/App.vue',
);

const VUE_TODO_DRAFT_KEY_PREFIX =
  'v2:code:fw2:vue:vue-todo-list@';

const FRAMEWORK_DIST_ASSET_ROOT = join(
  process.cwd(),
  'dist/frontendatlas/browser/assets/sb',
);

function readCanonicalFile(assetPath: string, requestedPath: string): string {
  const absolutePath = join(process.cwd(), assetPath);
  const asset = JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    files?: Record<string, SolutionFile>;
  };
  const normalizedRequestedPath = requestedPath.replace(/^\/+/, '');
  const match = Object.entries(asset.files || {}).find(
    ([path]) => path.replace(/^\/+/, '') === normalizedRequestedPath,
  );

  if (!match) {
    throw new Error(`Canonical file not found: ${assetPath}#${requestedPath}`);
  }

  const value = match[1];
  const code = typeof value === 'string' ? value : value?.code;
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error(`Canonical file is empty: ${assetPath}#${requestedPath}`);
  }
  return code;
}

function readCanonicalFiles(assetPath: string): Record<string, string> {
  const absolutePath = join(process.cwd(), assetPath);
  const asset = JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    files?: Record<string, SolutionFile>;
  };
  const files = Object.entries(asset.files || {}).reduce<Record<string, string>>(
    (acc, [path, value]) => {
      const normalizedPath = path.replace(/^\/+/, '');
      const code = typeof value === 'string' ? value : value?.code;
      if (typeof code === 'string' && code.trim()) {
        acc[normalizedPath] = code;
      }
      return acc;
    },
    {},
  );
  if (!Object.keys(files).length) {
    throw new Error(`Canonical bundle is empty: ${assetPath}`);
  }
  return files;
}

function livePreview(page: Page) {
  return page.frameLocator('iframe[title="Framework live preview"]');
}

function checkRows(page: Page): Locator {
  return page.getByTestId('framework-check-result');
}

function checkResults(page: Page): Locator {
  return checkRows(page).locator('.framework-check-result__name');
}

async function waitForFrameworkPreview(page: Page, selector: string): Promise<void> {
  await expect(page.locator('iframe[title="Framework live preview"]')).toBeVisible({ timeout: 30_000 });
  await expect(livePreview(page).locator(selector).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.preview-loading')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('framework-preview-error')).toHaveCount(0);
}

async function loadCanonicalFile(page: Page, path: string, code: string): Promise<void> {
  await setMonacoModelValue(page, path, code);
  await expect.poll(() => getMonacoModelValue(page, path)).toBe(code);
}

async function openFrameworkFile(page: Page, path: string): Promise<void> {
  const drawer = page.locator('.file-drawer');
  if (!await drawer.getAttribute('class').then((value) => value?.includes('open')).catch(() => false)) {
    await page.getByTitle('File tree', { exact: true }).click();
  }
  await expect(drawer).toHaveClass(/open/);

  const panel = drawer.locator('.panel');
  await expect.poll(async () => {
    const [drawerBox, panelBox] = await Promise.all([
      drawer.boundingBox(),
      panel.boundingBox(),
    ]);
    if (!drawerBox || !panelBox) return Number.POSITIVE_INFINITY;
    return Math.abs(panelBox.x - drawerBox.x);
  }).toBeLessThanOrEqual(1);

  const file = drawer.locator(`.file-row[title="${path}"]`);
  await expect(file).toBeVisible();
  await file.click();
  await expect(drawer).not.toHaveClass(/open/);
}

async function loadCanonicalBundle(
  page: Page,
  files: Record<string, string>,
): Promise<void> {
  for (const [path, code] of Object.entries(files)) {
    await openFrameworkFile(page, path);
    await loadCanonicalFile(page, path, code);
    // Let the panel persist each file before the next model becomes active.
    await page.waitForTimeout(300);
  }
}

async function runChecks(page: Page, expectedCount: number): Promise<Locator> {
  const frameCountBefore = await page.locator('iframe').count();
  const runButton = page.getByTestId('framework-run-checks');

  await expect(runButton).toBeEnabled();
  await runButton.click();
  await expect(checkRows(page)).toHaveCount(expectedCount, { timeout: 60_000 });
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
  await expect(runButton).toHaveText('Run checks');

  // Every assertion uses an opaque scratch iframe. None may survive the run.
  await expect(page.locator('iframe')).toHaveCount(frameCountBefore);
  return page.getByTestId('framework-results-panel');
}

async function runPressureChecks(page: Page, expectedCount: number): Promise<Locator> {
  let results = await runChecks(page, expectedCount);
  const failureKinds = await results
    .locator('[data-testid="framework-check-result"][data-failure-kind]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-failure-kind')));

  // Angular preview dependencies are fetched in each opaque iframe. Retry one
  // transient readiness miss, but never retry (or hide) an assertion failure.
  if (failureKinds.length > 0 && failureKinds.every((kind) => kind === 'infrastructure-timeout')) {
    results = await runChecks(page, expectedCount);
  }

  return results;
}

async function completePressureRounds(
  page: Page,
  contract: PressureFlowContract = COUNTER_PRESSURE_FLOW,
): Promise<void> {
  for (const [index, expectedCount] of contract.checkCounts.entries()) {
    await expect(page.getByTestId('pressure-active-round')).toHaveAttribute(
      'data-round-id',
      contract.roundIds[index],
    );
    const results = await runPressureChecks(page, expectedCount);
    await expect(results.locator('.framework-check-results__summary')).toHaveText(
      `${expectedCount}/${expectedCount} passed`,
    );
    await expect(results.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(
      results.locator('[data-testid="framework-check-result"][data-failure-kind]'),
    ).toHaveCount(0);

    if (index < contract.checkCounts.length - 1) {
      const next = page.getByTestId('pressure-next-round');
      await expect(next).toBeVisible();
      await next.click();
    }
  }

  await dismissPostPassPrompt(page);
  await expect(page.getByTestId('pressure-debrief')).toBeVisible();
  await expect(page.getByTestId('pressure-debrief')).toContainText(
    contract.debriefText,
  );
}

async function seedPremiumSession(page: Page, baseURL: string): Promise<void> {
  const token = `e2e-pressure-premium-${Date.now()}`;
  const user = buildMockUser({
    _id: 'e2e-pressure-premium-user',
    username: 'pressure_premium_user',
    email: 'pressure-premium@example.com',
    accessTier: 'premium',
  });

  await installAuthMock(page, { token, user });
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: baseURL,
  }]);
  const loginStatus = await page.evaluate(async () => {
    const response = await fetch('https://api.frontendatlas.com/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'pressure_premium_user',
        password: 'e2e-password',
      }),
    });
    return response.status;
  });
  if (loginStatus !== 200) {
    throw new Error(`Premium auth mock login failed with ${loginStatus}`);
  }
  await page.evaluate(() => localStorage.setItem('fa:auth:session', '1'));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))).toEqual(expect.objectContaining({
    viewport: expect.any(Number),
    documentWidth: expect.any(Number),
  }));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNoPreviewHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await livePreview(page).locator('html').evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.documentWidth - metrics.viewportWidth).toBeLessThanOrEqual(1);
}

async function rebuildPreview(page: Page, readySelector: string): Promise<void> {
  await page.getByTestId('framework-rebuild-preview').click();
  await waitForFrameworkPreview(page, readySelector);
}

async function exerciseTicTacToeKeyboardPreview(page: Page): Promise<void> {
  const preview = livePreview(page);
  const board = preview.locator('.board');
  const cell = (index: number) => preview.locator(`#tic-tac-toe-cell-${index}`);

  await expect(board).toHaveAttribute('role', 'grid');
  await expect(board).toHaveAttribute('aria-describedby', 'game-status');
  await expect(preview.locator('.cell-slot[role="gridcell"]')).toHaveCount(9);
  await expect(preview.locator('button.cell')).toHaveCount(9);
  await expect(preview.locator('button.cell:disabled')).toHaveCount(0);

  await cell(0).focus();
  await cell(0).press('ArrowLeft');
  await expect(cell(2)).toBeFocused();
  await cell(2).press('ArrowRight');
  await expect(cell(0)).toBeFocused();
  await cell(0).press('ArrowUp');
  await expect(cell(6)).toBeFocused();
  await cell(6).press('ArrowDown');
  await expect(cell(0)).toBeFocused();
  await cell(0).press('End');
  await expect(cell(2)).toBeFocused();
  await cell(2).press('Home');
  await expect(cell(0)).toBeFocused();

  await cell(0).press('Enter');
  await expect(cell(0)).toHaveAttribute('data-mark', 'X');
  await expect(cell(0)).toHaveAttribute('aria-disabled', 'true');
  expect(await cell(0).evaluate((element: HTMLButtonElement) => element.disabled)).toBe(false);
  await cell(1).focus();
  await cell(1).press('Space');
  await expect(cell(1)).toHaveAttribute('data-mark', 'O');
  await expect(cell(1)).toHaveAttribute('aria-disabled', 'true');
  expect(await cell(1).evaluate((element: HTMLButtonElement) => element.disabled)).toBe(false);
}

async function exerciseChessboardKeyboardPreview(page: Page): Promise<void> {
  const preview = livePreview(page);
  const board = preview.locator('.board');
  const cells = preview.locator('button.cell');
  const cell = (row: number, column: number) =>
    preview.locator(`#chessboard-cell-${row}-${column}`);

  await expect(board).toHaveAttribute('role', 'grid');
  await expect(board).toHaveAttribute('aria-describedby', 'board-status');
  await expect(cells).toHaveCount(64);
  await expect(preview.locator('button.cell:disabled')).toHaveCount(0);

  await cell(0, 0).focus();
  await cell(0, 0).press('ArrowLeft');
  await expect(cell(0, 7)).toBeFocused();
  await cell(0, 7).press('ArrowRight');
  await expect(cell(0, 0)).toBeFocused();
  await cell(0, 0).press('ArrowUp');
  await expect(cell(7, 0)).toBeFocused();
  await cell(7, 0).press('ArrowDown');
  await expect(cell(0, 0)).toBeFocused();
  await cell(1, 2).focus();
  await cell(1, 2).press('Home');
  await expect(cell(1, 0)).toBeFocused();
  await cell(1, 0).press('End');
  await expect(cell(1, 7)).toBeFocused();
  await expect(preview.locator('.cell--active')).toHaveCount(0);

  await cell(0, 0).focus();
  await cell(0, 0).press('Enter');
  await expect(cell(0, 0)).toHaveClass(/cell--active/);
  await expect(cell(0, 0)).toHaveAttribute('aria-pressed', 'true');
  expect(await cell(0, 0).evaluate((element: HTMLButtonElement) => element.disabled)).toBe(false);

  await cell(0, 0).press('ArrowRight');
  await expect(cell(0, 1)).toBeFocused();
  await cell(0, 1).press('Space');
  await expect(cell(0, 0)).toHaveAttribute('aria-pressed', 'false');
  await expect(cell(0, 1)).toHaveClass(/cell--active/);
  await expect(cell(0, 1)).toHaveAttribute('aria-pressed', 'true');
  expect(await cell(0, 1).evaluate((element: HTMLButtonElement) => element.disabled)).toBe(false);
  await expect(preview.locator('.cell--active')).toHaveCount(1);
  await expect(preview.locator('.selection-status')).toHaveText('Selected: row 1, column 2');

  await cells.nth(27).click();
  await expect(preview.locator('.cell--reachable[data-reachable="true"]')).toHaveCount(27);
  await cells.nth(0).click();
  await expect(preview.locator('.cell--reachable[data-reachable="true"]')).toHaveCount(21);
}

async function exerciseDynamicCountersKeyboardPreview(page: Page): Promise<void> {
  const preview = livePreview(page);
  const counter = (id: number) => preview.locator(`#counter-button-${id}`);
  const remove = (id: number) => preview.locator(`#remove-counter-${id}`);
  const rows = preview.locator('.counter-row[role="listitem"]');

  await expect(preview.locator('#counter-limit')).toHaveAttribute('type', 'number');
  await expect(preview.locator('#counter-limit')).toHaveAttribute('min', '1');
  await expect(preview.locator('#counter-limit')).toHaveAttribute('max', '10');
  await expect(preview.locator('.counter-list')).toHaveAttribute('role', 'list');
  await expect(preview.locator('.counter-list')).toHaveAttribute(
    'aria-label',
    'Dynamic counter buttons',
  );
  await expect(preview.locator('.counter-list')).toHaveAttribute(
    'aria-describedby',
    'counter-status',
  );
  await expect(rows).toHaveCount(1);
  await expect(remove(1)).toBeDisabled();
  await expect(preview.locator('#counter-status')).toHaveText(
    'Counters: 1 of 5. Combined value: 0.',
  );

  await counter(1).click();
  await counter(2).click();
  await counter(2).click();
  await expect(rows).toHaveCount(4);
  await expect.poll(() => rows.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-counter-id')),
  )).toEqual(['1', '2', '3', '4']);
  await expect(preview.locator('.counter-value')).toHaveText(['1', '2', '0', '0']);

  await counter(1).focus();
  await counter(1).press('ArrowUp');
  await expect(counter(4)).toBeFocused();
  await counter(4).press('ArrowDown');
  await expect(counter(1)).toBeFocused();
  await counter(1).press('End');
  await expect(counter(4)).toBeFocused();
  await counter(4).press('Home');
  await expect(counter(1)).toBeFocused();
  await expect(preview.locator('.counter-value')).toHaveText(['1', '2', '0', '0']);

  await counter(1).press('Enter');
  await expect(rows).toHaveCount(5);
  await expect(counter(1).locator('.counter-value')).toHaveText('2');
  await counter(2).focus();
  await counter(2).press('Space');
  await expect(rows).toHaveCount(5);
  await expect(counter(2).locator('.counter-value')).toHaveText('3');

  await remove(2).focus();
  await remove(2).press('Enter');
  await expect.poll(() => rows.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-counter-id')),
  )).toEqual(['1', '3', '4', '5']);
  await expect(counter(3)).toBeFocused();

  await remove(5).focus();
  await remove(5).press('Enter');
  await expect.poll(() => rows.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-counter-id')),
  )).toEqual(['1', '3', '4']);
  await expect(counter(4)).toBeFocused();

  await preview.locator('#reset-counters').click();
  await expect(rows).toHaveCount(1);
  await expect(counter(1).locator('.counter-value')).toHaveText('0');
  await expect(preview.locator('#reset-counters')).toBeDisabled();
  await expect(remove(1)).toBeDisabled();
}

async function expectAssertionLayer(resultsPanel: Locator): Promise<void> {
  const resultText = await resultsPanel.innerText();
  expect(resultText).not.toMatch(RUNNER_FAILURE);
  await expect(
    resultsPanel.locator('[data-testid="framework-check-result"][data-failure-kind]:not([data-failure-kind="assertion"])'),
  ).toHaveCount(0);
}

async function dismissPostPassPrompt(page: Page): Promise<void> {
  // Anonymous visitors receive the sign-in prompt; signed-in visitors can receive
  // the progress prompt. Both are deliberately dismissible before rebuilding.
  const accountPrompt = page.getByTestId('login-required-dialog');
  const closeAccountPrompt = page.getByRole('button', { name: 'Close account prompt' });
  await closeAccountPrompt.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
  if (await closeAccountPrompt.isVisible().catch(() => false)) {
    await closeAccountPrompt.click();
    await expect(accountPrompt).toBeHidden();
    return;
  }

  const cancel = page.getByRole('button', { name: 'Cancel', exact: true }).last();
  await cancel.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
    await expect(cancel).toBeHidden();
  }
}

async function pinFrameworkAssetsToSameOrigin(page: Page): Promise<void> {
  // Load a static same-origin document first so localStorage is set before
  // Angular evaluates the production CDN preference.
  await page.goto('/robots.txt');
  await page.evaluate(() => localStorage.setItem('fa:cdn:enabled', '0'));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fa:cdn:enabled'))).toBe('0');
}

async function installLocalFrameworkAssetMirror(page: Page): Promise<void> {
  await page.route(
    /^https:\/\/frontendatlas\.vercel\.app\/assets\/sb\/.+\.json(?:\?.*)?$/,
    async (route) => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const relativePath = pathname.replace(/^\/assets\/sb\//, '');
      if (!relativePath || relativePath.includes('..')) {
        throw new Error(`Unsafe framework asset path: ${pathname}`);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
        body: readFileSync(join(FRAMEWORK_DIST_ASSET_ROOT, relativePath)),
      });
    },
  );
}

async function installFrameworkRuntimeResponseCache(page: Page): Promise<void> {
  await page.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\//, async (route) => {
    const url = route.request().url();
    let pending = FRAMEWORK_RUNTIME_RESPONSES.get(url);
    if (!pending) {
      pending = route.fetch().then(async (response) => ({
        status: response.status(),
        headers: Object.fromEntries(
          Object.entries(response.headers()).filter(([name]) =>
            !['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase()),
          ),
        ),
        body: await response.text(),
      }));
      FRAMEWORK_RUNTIME_RESPONSES.set(url, pending);
    }

    try {
      await route.fulfill(await pending);
    } catch {
      FRAMEWORK_RUNTIME_RESPONSES.delete(url);
      await route.continue();
    }
  });
}

test.describe('Framework checks against the production SSR build', () => {
  // Each test opens its own context and question route, so they are independent.
  // Running them in parallel keeps the production framework contract under 5 minutes.
  test.describe.configure({ mode: 'parallel', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await installLocalFrameworkAssetMirror(page);
    await installFrameworkRuntimeResponseCache(page);
    await pinFrameworkAssetsToSameOrigin(page);
  });

  test('Counter reaches assertions, passes its canonical solution, rebuilds, and repeats cleanly', async ({ page }) => {
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.value');
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const starterResults = await runChecks(page, 1);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText('0/1 passed');
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expect(checkRows(page)).toHaveAttribute('data-failure-kind', 'assertion');
    await expect(checkRows(page).locator('.framework-check-result__error')).toBeVisible();
    await expectAssertionLayer(starterResults);

    await loadCanonicalFile(page, 'src/App.tsx', COUNTER_SOLUTION);
    await rebuildPreview(page, '.value');

    const counterButtons = livePreview(page).locator('.actions button');
    await counterButtons.nth(1).click();
    await expect(livePreview(page).locator('.value')).toHaveText('1');
    await counterButtons.nth(2).click();
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const firstPassingRun = await runChecks(page, 1);
    await expect(firstPassingRun.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(firstPassingRun.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(checkRows(page)).not.toHaveAttribute('data-failure-kind', /.+/);
    await dismissPostPassPrompt(page);

    await rebuildPreview(page, '.value');
    await expect(livePreview(page).locator('.value')).toHaveText('0');

    const repeatedPassingRun = await runChecks(page, 1);
    await expect(repeatedPassingRun.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(repeatedPassingRun.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(checkRows(page)).not.toHaveAttribute('data-failure-kind', /.+/);
  });

  test('coding workspace stacks at 834px, keeps both framework panes usable, and preserves desktop columns', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 900 });
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.value');

    const description = page.getByTestId('coding-description-pane');
    const workspace = page.getByTestId('coding-workspace-panel');
    const splitter = page.getByTestId('coding-description-splitter');
    const editorColumn = page.getByTestId('framework-editor-column');
    const previewColumn = page.getByTestId('framework-preview-column');

    await expect(splitter).toHaveAttribute('data-orientation', 'horizontal');
    await expect(editorColumn).toBeVisible();
    await expect(previewColumn).toBeVisible();
    const tabletGeometry = await page.evaluate(() => {
      const rect = (testId: string) => {
        const element = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
        if (!element) throw new Error(`Missing ${testId}`);
        const box = element.getBoundingClientRect();
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          right: box.right,
          bottom: box.bottom,
        };
      };
      return {
        detail: rect('coding-detail-page'),
        description: rect('coding-description-pane'),
        splitter: rect('coding-description-splitter'),
        workspace: rect('coding-workspace-panel'),
        editor: rect('framework-editor-column'),
        preview: rect('framework-preview-column'),
      };
    });
    expect(Math.abs(tabletGeometry.description.x - tabletGeometry.workspace.x)).toBeLessThanOrEqual(1);
    expect(tabletGeometry.description.bottom).toBeLessThanOrEqual(tabletGeometry.workspace.y);
    expect(tabletGeometry.splitter.width).toBeGreaterThanOrEqual(tabletGeometry.detail.width - 1);
    expect(tabletGeometry.workspace.width).toBeGreaterThanOrEqual(tabletGeometry.detail.width - 1);
    expect(tabletGeometry.editor.width).toBeGreaterThan(350);
    expect(tabletGeometry.preview.width).toBeGreaterThan(300);

    const splitterBox = await splitter.boundingBox();
    if (!splitterBox) throw new Error('Tablet description splitter is not measurable');
    const descriptionHeightBeforeDrag = tabletGeometry.description.height;
    await page.mouse.move(splitterBox.x + splitterBox.width / 2, splitterBox.y + splitterBox.height / 2);
    await page.mouse.down();
    await expect(splitter).toHaveClass(/dragging/);
    await page.mouse.move(
      splitterBox.x + splitterBox.width / 2,
      splitterBox.y + splitterBox.height / 2 + 50,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect(splitter).not.toHaveClass(/dragging/);
    await expect.poll(async () => (await description.boundingBox())?.height ?? 0)
      .toBeGreaterThan(descriptionHeightBeforeDrag + 30);

    await page.getByRole('button', { name: 'Hide description' }).click();
    await expect(page.getByTestId('coding-description-rail')).toBeVisible();
    await expect(splitter).toHaveCount(0);
    await expect.poll(async () => (await description.boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(46);
    await expect.poll(async () => (await description.boundingBox())?.height ?? 0)
      .toBeLessThanOrEqual(50);
    await expect.poll(async () => (await workspace.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(tabletGeometry.detail.width - 1);

    await page.getByRole('button', { name: 'Expand description' }).click();
    await expect(splitter).toBeVisible();
    await page.setViewportSize({ width: 1366, height: 900 });
    await expect(splitter).toHaveAttribute('data-orientation', 'vertical');
    const desktopGeometry = await page.evaluate(() => {
      const descriptionBox = document.querySelector<HTMLElement>(
        '[data-testid="coding-description-pane"]',
      )?.getBoundingClientRect();
      const workspaceBox = document.querySelector<HTMLElement>(
        '[data-testid="coding-workspace-panel"]',
      )?.getBoundingClientRect();
      if (!descriptionBox || !workspaceBox) throw new Error('Desktop workspace panels are missing');
      return {
        descriptionRight: descriptionBox.right,
        descriptionY: descriptionBox.y,
        workspaceX: workspaceBox.x,
        workspaceY: workspaceBox.y,
      };
    });
    expect(desktopGeometry.descriptionRight).toBeLessThanOrEqual(desktopGeometry.workspaceX);
    expect(Math.abs(desktopGeometry.descriptionY - desktopGeometry.workspaceY)).toBeLessThanOrEqual(1);
    await expectNoHorizontalOverflow(page);
  });

  test('React Counter keeps normal and pressure drafts isolated across all four rounds', async ({ page }) => {
    await page.goto('/react/coding/react-counter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.value');
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('coding-solution-tab').first()).toBeEnabled();

    const normalMarker = `normal-counter-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-counter@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-counter$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await expect(page.getByTestId('coding-solution-tab').first()).toBeDisabled();
    await waitForFrameworkPreview(page, '.value');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expect(page.getByTestId('coding-description-splitter')).toHaveAttribute(
        'data-orientation',
        width === 834 ? 'horizontal' : 'vertical',
      );
      await expectNoHorizontalOverflow(page);
    }

    await loadCanonicalBundle(page, COUNTER_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.value');
    await completePressureRounds(page);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
    await waitForFrameworkPreview(page, '.value');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('coding-solution-tab').first()).toBeEnabled();
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-counter-starter'
      : 'vue-counter';

    test(`${framework} Counter passes the shared pressure contract and lifecycle cleanup`, async ({ page }) => {
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.value');

      await loadCanonicalBundle(page, COUNTER_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.value');
      await completePressureRounds(page);
    });
  }

  test('React Debounced Search keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-debounced-search');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.input');

    const entry = page.getByTestId('pressure-mode-entry');
    await expect(entry).toBeVisible();
    await expect(entry).toContainText('Continue the same challenge through cumulative rounds');
    await expect(entry).not.toContainText('Counter');

    const normalMarker = `normal-debounce-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-debounced-search@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-debounced-search\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-debounced-search$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, DEBOUNCE_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.input');
    await completePressureRounds(page, DEBOUNCE_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await expect(page.getByTestId('pressure-mode-complete')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-complete')).not.toContainText('Counter');
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-debounced-search$/);
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
  });

  test('JavaScript bug squash runs its files as modules and keeps an edit in the file it was made in', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium bug squash test');
    const id = 'js-debug-bug-squash-invoices';
    const codeModel = `q-${id}-code`;
    await seedPremiumSession(page, baseURL);
    await page.goto(`/javascript/debug/${id}`);
    await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });

    const tabs = page.getByTestId('js-file-tab');
    await expect(tabs).toHaveText(['src/currency.js', 'src/line-items.js', 'src/ids.js', 'src/invoice.js', 'src/payments.js']);
    await expect(tabs.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('js-language-select')).toHaveCount(0);
    await expect.poll(() => getMonacoModelValue(page, codeModel)).toContain('Math.floor(amount');

    const runButton = page.getByTestId('js-run-tests');
    const results = page.getByTestId('js-results-panel');
    const run = async () => {
      await expect(runButton).toBeEnabled();
      await runButton.click();
      await expect(results.getByTestId('test-result')).toHaveCount(6, { timeout: 30_000 });
      await expect(runButton).toBeEnabled({ timeout: 10_000 });
      return (await results.getByTestId('test-status').allTextContents()).map((status) => status.trim());
    };

    // The four reports fail; the zero-decimal and declined-card guards pass as the repo stands.
    expect(await run()).toEqual(['FAIL', 'PASS', 'FAIL', 'FAIL', 'FAIL', 'PASS']);
    expect(normalizeRunnerText(await results.innerText())).not.toMatch(RUNNER_FAILURE);

    const currency = await getMonacoModelValue(page, codeModel);
    await setMonacoModelValue(page, codeModel, currency.replace('Math.floor(amount', 'Math.round(amount'));
    expect(await run()).toEqual(['PASS', 'PASS', 'FAIL', 'FAIL', 'FAIL', 'PASS']);

    // Each tab shows its own file, and the fix stays in currency.js, on this device too.
    await tabs.nth(4).click();
    await expect(tabs.nth(4)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => getMonacoModelValue(page, codeModel)).toContain('export async function payInvoice');
    await tabs.first().click();
    await expect.poll(() => getMonacoModelValue(page, codeModel)).toContain('Math.round(amount');
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_js',
      keyPrefix: `v2:code:js2:${id}@`,
      substring: 'Math.round(amount',
    });
    await page.reload();
    await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => getMonacoModelValue(page, codeModel)).toContain('Math.round(amount');

    // The solution loads as the same five files and passes every test.
    await page.getByRole('button', { name: /^Solution$/ }).first().click();
    await page.getByTestId('solution-load-approach-0').click();
    await expect(tabs).toHaveCount(5);
    await expect.poll(() => getMonacoModelValue(page, codeModel)).toContain('round to the nearest minor unit');
    expect(await run()).toEqual(['PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS']);
  });

  test('Meta rehearsal runs two problems on one clock, on drafts of their own, and locks them for the review', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium rehearsal test');
    await page.clock.install();
    await seedPremiumSession(page, baseURL);
    const debounceModel = 'q-js-debounce-code';
    const isReadOnly = (modelKeyPart: string) => page.evaluate((needle: string) => {
      const monaco = (window as any).monaco;
      const editor = (monaco?.editor?.getEditors?.() || [])
        .find((entry: any) => (entry?.getModel?.()?.uri?.toString?.() || '').includes(needle));
      return editor ? editor.getOption(monaco.editor.EditorOption.readOnly) : null;
    }, modelKeyPart);

    // The person's own draft of Debounce, which the rehearsal leaves alone.
    await page.goto('/javascript/coding/js-debounce');
    await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
    const own = `${await getMonacoModelValue(page, debounceModel)}\n// my own draft\n`;
    await setMonacoModelValue(page, debounceModel, own);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_js',
      keyPrefix: 'v2:code:js2:js-debounce@',
      substring: '// my own draft',
    });

    // A sequential rehearsal starts at its first problem, with the second one hidden and the solution locked.
    const entry = page.getByTestId('rehearsal-entry');
    await expect(entry).toContainText('Meta coding round: 2 problems in 40 minutes');
    await entry.getByTestId('rehearsal-start').click();
    await expect(page).toHaveURL(/\/javascript\/coding\/js-dom-twin-node$/);
    const panel = page.getByTestId('rehearsal-panel');
    await expect(panel.getByTestId('rehearsal-clock')).toHaveText(/^(40:00|39:[0-5]\d) left$/);
    await expect(panel.getByTestId('rehearsal-item')).toHaveText([
      /Problem 1\s*Find the Corresponding Node in Twin DOM Trees\s*Not run yet/,
      /Problem 2\s*Opens when you move on/,
    ]);
    await expect(page.getByTestId('js-rehearsal-clock')).toHaveText(/left$/);
    await expect(page.getByRole('button', { name: 'Solution locked', exact: true })).toBeDisabled();
    await expect(page.getByTestId('coding-solution-idea')).toHaveCount(0);
    await expect(page.getByTestId('interview-mode-setup-toggle')).toHaveCount(0);

    // A run counts toward the review.
    const runButton = page.getByTestId('js-run-tests');
    await expect(runButton).toBeEnabled({ timeout: 30_000 });
    await runButton.click();
    await expect(page.getByTestId('js-results-panel').getByTestId('test-result')).toHaveCount(4, { timeout: 30_000 });
    await expect(panel.getByTestId('rehearsal-item').first()).toContainText(/(\d of 4|All 4) tests pass/);

    // The second problem opens from its starter code, not from the person's draft.
    await panel.getByTestId('rehearsal-next').click();
    await expect(page).toHaveURL(/\/javascript\/coding\/js-debounce$/);
    await expect(panel.getByTestId('rehearsal-item').nth(1)).toContainText('Debounce Function');
    await expect.poll(() => getMonacoModelValue(page, debounceModel)).toContain('export default function debounce');
    expect(await getMonacoModelValue(page, debounceModel)).not.toContain('// my own draft');

    // When the time is up the editor turns read-only and the review lists both problems.
    await page.clock.fastForward('40:00');
    await expect(panel.getByTestId('rehearsal-verdict')).toHaveText(/^Time is up\. \d of 2 problems pass every test\.$/);
    await expect(panel.getByTestId('rehearsal-item').nth(1)).toContainText('Not run');
    await expect(runButton).toBeDisabled();
    await expect(page.getByTestId('js-rehearsal-clock')).toHaveText('Rehearsal over: read-only');
    await expect.poll(() => isReadOnly(debounceModel)).toBe(true);
    await expect(page.getByRole('button', { name: /^Solution$/ }).first()).toBeEnabled();
    await expect(page.getByTestId('coding-solution-idea')).toHaveCount(1);

    // Closing the review gives the task back the person's own draft.
    await panel.getByTestId('rehearsal-close').click();
    await expect(page.getByTestId('rehearsal-panel')).toHaveCount(0);
    await expect.poll(() => getMonacoModelValue(page, debounceModel)).toContain('// my own draft');
    await expect.poll(() => isReadOnly(debounceModel)).toBe(false);
    await expect(runButton).toBeEnabled();
    await expect(entry).toBeVisible();
  });

  test('Walmart Karat rehearsal asks its short answers first, with the problem out of sight, then reviews them', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium rehearsal test');
    await page.clock.install();
    await seedPremiumSession(page, baseURL);
    const parenthesesModel = 'q-js-valid-parentheses-code';
    const isReadOnly = (modelKeyPart: string) => page.evaluate((needle: string) => {
      const monaco = (window as any).monaco;
      const editor = (monaco?.editor?.getEditors?.() || [])
        .find((entry: any) => (entry?.getModel?.()?.uri?.toString?.() || '').includes(needle));
      return editor ? editor.getOption(monaco.editor.EditorOption.readOnly) : null;
    }, modelKeyPart);

    // The task is in three rehearsals, listed in one card: Revolut's and Booking.com's assessments, Walmart's Karat screen.
    await page.goto('/javascript/coding/js-valid-parentheses');
    await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('rehearsal-offers')).toContainText('This problem is part of 3 timed rehearsals');
    const entry = page.getByTestId('rehearsal-entry').filter({ hasText: 'Walmart Karat screen' });
    await expect(entry).toContainText('Walmart Karat screen: 8 short answers and 2 problems in 55 minutes');
    await entry.getByTestId('rehearsal-start').click();

    // The questions come first: the problem waits out of sight and its editor is read-only.
    const panel = page.getByTestId('rehearsal-panel');
    await expect(panel.getByTestId('rehearsal-clock')).toHaveText(/^(55:00|54:[0-5]\d) left$/);
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('Short answers: question 1 of 8');
    await expect(panel.getByTestId('rehearsal-question')).toHaveText('What is a closure in JavaScript?');
    await expect(panel.getByTestId('rehearsal-item')).toHaveText([
      /Problem 1\s*Opens after the questions/,
      /Problem 2\s*Opens after the questions/,
    ]);
    await expect(page.getByTestId('question-title')).toBeHidden();
    await expect(page.getByTestId('coding-breadcrumb')).toBeHidden();
    await expect(page.getByTestId('js-concealed-note')).toHaveText('The problems open after the questions.');
    await expect(page.getByTestId('js-rehearsal-clock')).toHaveText(/left: questions first$/);
    const runButton = page.getByTestId('js-run-tests');
    await expect(runButton).toBeDisabled();
    await expect.poll(() => isReadOnly(parenthesesModel)).toBe(true);

    // An answer is kept, through a reload too.
    const answer = 'A function that keeps the variables of the scope it was made in.';
    await panel.getByTestId('rehearsal-answer').fill(answer);
    await panel.getByTestId('rehearsal-question-next').click();
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('question 2 of 8');
    await expect(panel.getByTestId('rehearsal-answer')).toBeFocused();
    await page.reload();
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('question 2 of 8', { timeout: 30_000 });

    // Moving on opens the first problem, editable, on the same clock.
    await panel.getByTestId('rehearsal-skip').click();
    await expect(panel.getByTestId('rehearsal-questions')).toHaveCount(0);
    await expect(page.getByTestId('question-title')).toBeVisible();
    await expect(page.getByTestId('js-concealed-note')).toHaveCount(0);
    await expect(panel.getByTestId('rehearsal-item')).toHaveText([
      /Problem 1\s*Valid Parentheses \(Balanced Brackets\)\s*Not run yet/,
      /Problem 2\s*Opens when you move on/,
    ]);
    await expect(runButton).toBeEnabled({ timeout: 30_000 });
    await expect.poll(() => isReadOnly(parenthesesModel)).toBe(false);

    // The review sets each answer beside a sample one and links the full answer.
    await page.clock.fastForward('55:00');
    await expect(panel.getByTestId('rehearsal-verdict'))
      .toHaveText('Time is up. 0 of 2 problems pass every test. You answered 1 of 8 short questions.');
    const reviewed = panel.getByTestId('rehearsal-answer-review');
    await expect(reviewed).toHaveCount(8);
    await expect(reviewed.first()).toContainText(`Your answer: ${answer}`);
    await expect(reviewed.first()).toContainText('A sample answer: A function that keeps access to the variables');
    await expect(reviewed.nth(1)).toContainText('Your answer: No answer');
    await expect(reviewed.first().getByRole('link', { name: 'Read the full answer' }))
      .toHaveAttribute('href', '/javascript/trivia/js-closures');
    await panel.getByTestId('rehearsal-close').click();
    await expect(page.getByTestId('rehearsal-panel')).toHaveCount(0);
  });

  test('Booking.com rehearsal asks two multiple-choice questions, then runs its JavaScript and React problems on one clock', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium rehearsal test');
    await page.clock.install();
    await seedPremiumSession(page, baseURL);
    const isReadOnly = (modelKeyPart: string) => page.evaluate((needle: string) => {
      const monaco = (window as any).monaco;
      const editor = (monaco?.editor?.getEditors?.() || [])
        .find((entry: any) => (entry?.getModel?.()?.uri?.toString?.() || '').includes(needle));
      return editor ? editor.getOption(monaco.editor.EditorOption.readOnly) : null;
    }, modelKeyPart);

    await page.goto('/javascript/coding/js-valid-parentheses');
    await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
    const entry = page.getByTestId('rehearsal-entry').filter({ hasText: 'Booking.com HackerRank assessment' });
    await expect(entry).toContainText('Booking.com HackerRank assessment: 2 multiple-choice questions and 3 problems in 90 minutes');
    await entry.getByText('What it covers').click();
    await expect(entry).toContainText('the React one a form that calls an API');
    await entry.getByTestId('rehearsal-start').click();

    // One option first: a radio group under the question.
    const panel = page.getByTestId('rehearsal-panel');
    await expect(panel.getByTestId('rehearsal-clock')).toHaveText(/^(1:30:00|1:29:[0-5]\d) left$/);
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('Multiple choice: question 1 of 2');
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('The clock keeps running for the whole rehearsal.');
    await expect(page.getByTestId('js-concealed-note')).toHaveText('The problems open after the questions.');
    const options = panel.getByTestId('rehearsal-choice');
    await expect(options).toHaveCount(4);
    await options.nth(3).check();
    await panel.getByTestId('rehearsal-question-next').click();

    // Then every right option: checkboxes.
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('question 2 of 2');
    await expect(panel.getByTestId('rehearsal-questions')).toContainText('Pick every option that is right.');
    await expect(options.first()).toBeFocused();
    await options.nth(0).check();
    await options.nth(1).check();
    await panel.getByTestId('rehearsal-question-next').click();

    // The problems open at once, as on HackerRank, the React one with them.
    await expect(panel.getByTestId('rehearsal-questions')).toHaveCount(0);
    await expect(panel.getByTestId('rehearsal-item')).toHaveText([
      /Problem 1\s*Valid Parentheses \(Balanced Brackets\)\s*Not run yet/,
      /Problem 2\s*Merge Two Sorted Arrays/,
      /Problem 3\s*Contact Form \(Component \+ HTTP\)/,
    ]);
    await expect(page.getByTestId('js-concealed-note')).toHaveCount(0);

    // The React problem runs in its own panel, on the same clock, and its checks count.
    await panel.getByRole('link', { name: 'Contact Form (Component + HTTP)' }).click();
    await expect(page).toHaveURL(/\/react\/coding\/react-contact-form-starter$/);
    await expect(page.getByTestId('rehearsal-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('framework-rehearsal-clock')).toHaveText(/^1:2\d:[0-5]\d left$/);
    await expect(page.getByTestId('pressure-mode-entry')).toHaveCount(0);
    const runChecks = page.getByTestId('framework-run-checks');
    await expect(runChecks).toBeEnabled({ timeout: 30_000 });
    await runChecks.click();
    await expect(page.getByTestId('framework-check-result')).toHaveCount(3, { timeout: 60_000 });
    await expect(panel.getByTestId('rehearsal-item').nth(2)).toContainText(/(\d of 3|All 3) tests pass/);

    // When the time is up, the React editor turns read-only and its checks stop.
    await page.clock.fastForward('01:30:00');
    await expect(panel.getByTestId('rehearsal-verdict'))
      .toHaveText(/^Time is up\. \d of 3 problems pass every test\. You got 1 of 2 multiple-choice questions right\.$/);
    await expect(page.getByTestId('framework-rehearsal-clock')).toHaveText('Rehearsal over: read-only');
    await expect(runChecks).toBeDisabled();
    await expect.poll(() => isReadOnly('App.tsx')).toBe(true);
    const reviewed = panel.getByTestId('rehearsal-answer-review');
    await expect(reviewed.first()).toContainText('Your answer: 222px (not right)');
    await expect(reviewed.first()).toContainText('The right answer: 178px');
    await expect(reviewed.nth(1)).toContainText('(right)');
    await expect(reviewed.nth(1)).toContainText('The right answer: position: relative; transform: translateX(0)');
    await panel.getByTestId('rehearsal-close').click();
    await expect(page.getByTestId('rehearsal-panel')).toHaveCount(0);
  });

  test.describe('for a visitor', () => {
    // The pricing page asks for its checkout config, which this visitor's mocked API refuses.
    test.use({ consoleErrorAllowlist: ['\\/api\\/billing\\/checkout\\/config'] });

    test('Meta rehearsal offers pricing to a visitor, and nothing on a phone', async ({ page }) => {
      // A visitor with no session: nothing here may reach the production API.
      await page.route('https://api.frontendatlas.com/**', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Not signed in"}' }));
      await page.goto('/javascript/coding/js-debounce');
      await expect(page.getByTestId('js-panel')).toBeVisible({ timeout: 30_000 });
      const entry = page.getByTestId('rehearsal-entry');
      await expect(entry).toContainText('Timed rehearsal · Premium');
      await expect(entry.getByTestId('rehearsal-start')).toHaveCount(0);
      await entry.getByTestId('rehearsal-pricing').click();
      await expect(page).toHaveURL(/\/pricing\?src=coding_rehearsal_javascript/);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/javascript/coding/js-debounce');
      await expect(page.getByTestId('coding-mobile-notice')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('rehearsal-entry')).toHaveCount(0);
    });
  });

  test('Vue merge request review keeps the written review, passes the top fixes and compares with the sample', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium review test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/vue/coding/vue-issue-list-merge-request-review');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.issue');

    // The workspace opens on the change under review, which fails every check.
    const starter = await runChecks(page, 4);
    await expect(starter.locator('.framework-check-results__summary')).toHaveText('0/4 passed');
    expect(await checkRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-failure-kind'))))
      .toEqual(['assertion', 'assertion', 'assertion', 'assertion']);

    await page.getByTestId('review-mode-start').click();
    const panel = page.getByTestId('review-mode-panel');
    await expect(panel.getByRole('heading', { level: 1 })).toHaveText('Add label filters to the issue list');
    // GitLab's written review has up to an hour, finished before the 90-minute interview starts.
    await expect(page.getByTestId('review-mode-timer')).toHaveText('Review: 60 of 60 min left');
    await expect(page.getByTestId('review-mode-file-0')).toContainText('watch(selectedLabel, loadIssues, { immediate: true });');
    await expect(page.getByTestId('review-mode-file-2')).toContainText('src/App.spec.js');
    await expectNoHorizontalOverflow(page);
    await page.getByTestId('review-mode-comment-0').fill('L84: the watch reloads the list on every label');
    await page.getByTestId('review-mode-summary').fill('Request changes: the filter reloads the list.');

    // The written review stays on this device and reopens where it was.
    await page.reload();
    await expect(page.getByTestId('review-mode-comment-0')).toHaveValue('L84: the watch reloads the list on every label', { timeout: 30_000 });
    await expect(page.getByTestId('review-mode-summary')).toHaveValue('Request changes: the filter reloads the list.');

    await page.getByTestId('review-mode-start-fixes').click();
    await expect(page.getByTestId('review-mode-timer')).toHaveText('Interview: 90 of 90 min left');
    await expect(panel).toContainText('L84: the watch reloads the list on every label');
    await waitForFrameworkPreview(page, '.issue');
    await loadCanonicalBundle(page, REVIEW_FIXES);
    await rebuildPreview(page, '.issue');
    const fixed = await runChecks(page, 4);
    await expect(fixed.locator('.framework-check-results__summary')).toHaveText('4/4 passed');
    await dismissPostPassPrompt(page);

    await page.getByTestId('review-mode-compare').click();
    const sample = page.getByTestId('review-mode-sample');
    await expect(sample.locator('.review-mode__comment-title').first()).toHaveText('Every label click loads the list again');
    await expect(sample.locator('.review-mode__comment')).toHaveCount(10);
    await expect(sample.locator('.review-mode__checked')).toHaveCount(4);
    await expect(sample).toContainText('L84: the watch reloads the list on every label');

    await page.getByTestId('review-mode-exit').click();
    await expect(panel).toHaveCount(0);
    await expect(page.getByTestId('question-title')).toBeVisible();
    await expect(page.getByTestId('review-mode-entry')).toBeVisible();
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Debounced Search passes async race, accessibility, and cleanup pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-debounced-search?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.input');

      await loadCanonicalBundle(page, DEBOUNCE_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.input');
      await completePressureRounds(page, DEBOUNCE_PRESSURE_FLOW);
    });
  }

  test('React Todo List keeps normal and pressure drafts isolated across all four rounds', async ({ page }) => {
    await page.goto('/react/coding/react-todo-list');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.input-row input');
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();

    const normalMarker = `normal-todo-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-todo-list@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-todo-list\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-todo-list$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.input-row input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, TODO_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '#new-task');
    await completePressureRounds(page, TODO_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-todo-list$/);
    await waitForFrameworkPreview(page, '.input-row input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-todo-list-starter'
      : 'vue-todo-list';

    test(`${framework} Todo List passes state, editing, undo, and cleanup pressure rounds`, async ({ page }) => {
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.input-row input');

      await loadCanonicalBundle(page, TODO_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '#new-task');
      await completePressureRounds(page, TODO_PRESSURE_FLOW);
    });
  }

  // Company-content tasks of 2026-11: each scenario must load in the app and its pressure solution must clear every
  // round in the real runner. A scenario the loader rejects never opens, which no unit test of the files notices.
  for (const contract of [
    {
      label: 'ElevenLabs transcript player',
      route: '/react/coding/react-debug-transcript-sync',
      readySelector: '.line',
      solution: TRANSCRIPT_SYNC_PRESSURE_SOLUTION,
      flow: TRANSCRIPT_SYNC_PRESSURE_FLOW,
    },
    {
      label: 'CrowdStrike downloadable-files table',
      route: '/react/coding/react-files-table-select-all',
      readySelector: '.row',
      solution: FILES_TABLE_PRESSURE_SOLUTION,
      flow: FILES_TABLE_PRESSURE_FLOW,
    },
    {
      label: 'Airbnb listing booking widget',
      route: '/react/coding/react-listing-booking-widget',
      readySelector: '.book',
      solution: BOOKING_WIDGET_PRESSURE_SOLUTION,
      flow: BOOKING_WIDGET_PRESSURE_FLOW,
    },
  ] as const) {
    test(`${contract.label} opens its Premium pressure mode and clears every round`, async ({ page, baseURL }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`${contract.route}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toContainText('Premium');
      await waitForFrameworkPreview(page, contract.readySelector);

      await loadCanonicalBundle(page, contract.solution);
      await rebuildPreview(page, contract.readySelector);
      await completePressureRounds(page, contract.flow);
    });
  }

  test('React Shopping Cart keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-shopping-cart');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.product-card:first-child');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();

    const normalMarker = `normal-shopping-cart-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-shopping-cart@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-shopping-cart\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-shopping-cart$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.product-card:first-child');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await loadCanonicalBundle(page, SHOPPING_CART_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.product-card:first-child');
    await completePressureRounds(page, SHOPPING_CART_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-shopping-cart$/);
    await waitForFrameworkPreview(page, '.product-card:first-child');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-shopping-cart-mini'
      : 'vue-shopping-cart';

    test(`${framework} Shopping Cart passes cart, stock, promo, checkout, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.product-card:first-child');

      await loadCanonicalBundle(page, SHOPPING_CART_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.product-card:first-child');
      await completePressureRounds(page, SHOPPING_CART_PRESSURE_FLOW);
    });
  }

  test('React Chips Input keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-chips-input-autocomplete');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.card');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();

    const normalMarker = `normal-chips-input-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-chips-input-autocomplete@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(
      /\/react\/coding\/react-chips-input-autocomplete\?mode=pressure$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-chips-input-autocomplete$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.card');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await loadCanonicalBundle(page, CHIPS_INPUT_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.card');
    await completePressureRounds(page, CHIPS_INPUT_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-chips-input-autocomplete$/);
    await waitForFrameworkPreview(page, '.card');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Chips Input passes suggestion, token, keyboard, limit, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-chips-input-autocomplete?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.card');

      await loadCanonicalBundle(page, CHIPS_INPUT_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.card');
      await completePressureRounds(page, CHIPS_INPUT_PRESSURE_FLOW);
    });
  }

  test('React Pagination Table keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-pagination-table');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.table');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();

    const normalMarker = `normal-pagination-table-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-pagination-table@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(
      /\/react\/coding\/react-pagination-table\?mode=pressure$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-pagination-table$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.table');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await loadCanonicalBundle(page, PAGINATION_TABLE_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.table');
    await completePressureRounds(page, PAGINATION_TABLE_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-pagination-table$/);
    await waitForFrameworkPreview(page, '.table');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Pagination Table passes pagination, filtering, sorting, selection, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-pagination-table?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.table');

      await loadCanonicalBundle(page, PAGINATION_TABLE_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.table');
      await completePressureRounds(page, PAGINATION_TABLE_PRESSURE_FLOW);
    });
  }

  test('React Autocomplete keeps its free pressure draft isolated and passes every round', async ({ page }) => {
    await page.goto('/react/coding/react-autocomplete-search-starter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.input');

    const normalMarker = `normal-autocomplete-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-autocomplete-search-starter@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-autocomplete-search-starter\?mode=pressure$/);
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-panel')).toContainText('Free pilot');
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, AUTOCOMPLETE_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.input');
    await completePressureRounds(page, AUTOCOMPLETE_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-autocomplete-search-starter$/);
    await waitForFrameworkPreview(page, '.input');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
  });

  for (const [framework, questionId] of [
    ['angular', 'angular-autocomplete-search-starter'],
    ['vue', 'vue-autocomplete-search'],
  ] as const) {
    // The Angular and Vue members of the autocomplete family are free like the React one since 2026-11-05, so a
    // visitor without an account runs the same pressure rounds as a free pilot.
    test(`${framework} Autocomplete passes search, selection, repeat, accessibility, and cleanup pressure rounds`, async ({
      page,
    }) => {
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toContainText('Free pilot');
      await waitForFrameworkPreview(page, '.input');

      await loadCanonicalBundle(page, AUTOCOMPLETE_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.input');
      await completePressureRounds(page, AUTOCOMPLETE_PRESSURE_FLOW);
    });
  }

  test('React-only Team List runs its free pressure mode and keeps the normal draft isolated', async ({ page }) => {
    await page.goto('/react/coding/react-fetch-list-states');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.mode');

    const normalMarker = `normal-team-list-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-fetch-list-states@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-fetch-list-states\?mode=pressure$/);
    await expect(page.getByTestId('pressure-mode-panel')).toContainText('Free pilot');
    await waitForFrameworkPreview(page, '.mode');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, TEAM_LIST_PRESSURE_SOLUTION);
    await rebuildPreview(page, '.mode');
    await completePressureRounds(page, TEAM_LIST_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-fetch-list-states$/);
    await waitForFrameworkPreview(page, '.mode');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
  });

  for (const [framework, questionId] of [
    ['react', 'react-nested-comments'],
    ['angular', 'angular-nested-comments'],
    ['vue', 'vue-nested-comments'],
  ] as const) {
    test(`${framework} Nested Comments passes thread, keyboard, hide, delete, and announcement pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toContainText('Premium');
      await waitForFrameworkPreview(page, '.composer');

      await loadCanonicalBundle(page, NESTED_COMMENTS_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.composer');
      await completePressureRounds(page, NESTED_COMMENTS_PRESSURE_FLOW);
    });
  }

  for (const [framework, questionId] of [
    ['react', 'react-contact-form-starter'],
    ['angular', 'angular-contact-form-starter'],
    ['vue', 'vue-contact-form-starter'],
  ] as const) {
    test(`${framework} Contact Form passes validation, send, failure, time limit, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toContainText('Premium');
      await waitForFrameworkPreview(page, '.panel');

      await loadCanonicalBundle(page, CONTACT_FORM_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.panel');
      await completePressureRounds(page, CONTACT_FORM_PRESSURE_FLOW);
    });
  }

  test('A long code value in a pressure rule stays inside the panel on a phone', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-contact-form-starter?mode=pressure');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.panel');
    await loadCanonicalBundle(page, CONTACT_FORM_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.panel');

    const results = await runPressureChecks(page, 1);
    await expect(results.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await page.getByTestId('pressure-next-round').click();

    const round = page.getByTestId('pressure-active-round');
    await expect(round).toHaveAttribute('data-round-id', 'one-request');
    await expect(round.locator('code', { hasText: 'https://jsonplaceholder.typicode.com/posts' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => round.evaluate((panel) => panel.scrollWidth - panel.clientWidth)).toBeLessThanOrEqual(0);
  });

  for (const scenario of [
    {
      name: 'React Chat Streaming passes stream, stop, retry, announcement, and cleanup pressure rounds',
      route: '/react/coding/react-chat-streaming-ui',
      readySelector: '.chat-input',
      solution: CHAT_STREAMING_PRESSURE_SOLUTION,
      flow: CHAT_STREAMING_PRESSURE_FLOW,
    },
    {
      name: 'React useEffect Once passes connection, order, slow connect, mute, and cleanup pressure rounds',
      route: '/react/coding/react-use-effect-once',
      readySelector: '.active-count',
      solution: USE_EFFECT_ONCE_PRESSURE_SOLUTION,
      flow: USE_EFFECT_ONCE_PRESSURE_FLOW,
    },
    {
      name: 'React Debug Double Render passes render count, badge, note, update, and sum pressure rounds',
      route: '/react/coding/react-debug-double-render',
      readySelector: '[data-testid="count"]',
      solution: DEBUG_DOUBLE_RENDER_PRESSURE_SOLUTION,
      flow: DEBUG_DOUBLE_RENDER_PRESSURE_FLOW,
    },
    {
      name: 'Angular Two-way Control passes owner, parent change, form, and keyboard pressure rounds',
      route: '/angular/coding/angular-input-output-two-way',
      readySelector: '.panel',
      solution: TWO_WAY_CONTROL_PRESSURE_SOLUTION,
      flow: TWO_WAY_CONTROL_PRESSURE_FLOW,
    },
    ...(['react', 'angular', 'vue'] as const).map((framework) => ({
      name: `${framework} Multi-step Signup passes navigation, edit, company, finish, and focus pressure rounds`,
      route: `/${framework}/coding/${
        { react: 'react-multi-step-signup', angular: 'angular-multi-step-form-starter', vue: 'vue-multi-step-form' }[framework]
      }`,
      readySelector: '.step-title',
      solution: MULTI_STEP_FORM_PRESSURE_SOLUTIONS[framework],
      flow: MULTI_STEP_FORM_PRESSURE_FLOW,
    })),
    ...(['react', 'angular', 'vue'] as const).map((framework) => ({
      name: `${framework} Checkbox Tree passes sync, depth, locked, summary, and order pressure rounds`,
      route: `/${framework}/coding/${framework}-nested-checkboxes`,
      readySelector: '.panel',
      solution: NESTED_CHECKBOXES_PRESSURE_SOLUTIONS[framework],
      flow: NESTED_CHECKBOXES_PRESSURE_FLOW,
    })),
    ...(['react', 'angular', 'vue'] as const).map((framework) => ({
      name: `${framework} Image Carousel passes slide, autoplay, keyboard, removal, and cleanup pressure rounds`,
      route: `/${framework}/coding/${
        { react: 'react-image-slider', angular: 'angular-image-slider-starter', vue: 'vue-image-slider' }[framework]
      }`,
      readySelector: '.actions',
      solution: IMAGE_SLIDER_PRESSURE_SOLUTIONS[framework],
      flow: IMAGE_SLIDER_PRESSURE_FLOW,
    })),
    {
      name: 'React File Explorer passes tree, keyboard, loading, rename, and path pressure rounds',
      route: '/react/coding/react-file-explorer',
      readySelector: '.tree',
      solution: FILE_EXPLORER_PRESSURE_SOLUTION,
      flow: FILE_EXPLORER_PRESSURE_FLOW,
    },
    ...(['react', 'angular', 'vue'] as const).map((framework) => ({
      name: `${framework} Like Button passes instant update, failure, fast click, status, and cleanup pressure rounds`,
      route: `/${framework}/coding/${framework}-like-button`,
      readySelector: '.likeBtn',
      solution: LIKE_BUTTON_PRESSURE_SOLUTIONS[framework],
      flow: LIKE_BUTTON_PRESSURE_FLOW,
    })),
    ...(['react', 'angular', 'vue'] as const).map((framework) => ({
      name: `${framework} Transfer List passes move, select all, search, undo, and announcement pressure rounds`,
      route: `/${framework}/coding/${framework}-transfer-list`,
      readySelector: '.layout',
      solution: TRANSFER_LIST_PRESSURE_SOLUTIONS[framework],
      flow: TRANSFER_LIST_PRESSURE_FLOW,
    })),
  ]) {
    test(scenario.name, async ({ page, baseURL }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`${scenario.route}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toContainText('Premium');
      await waitForFrameworkPreview(page, scenario.readySelector);

      await loadCanonicalBundle(page, scenario.solution);
      await rebuildPreview(page, scenario.readySelector);
      await completePressureRounds(page, scenario.flow);
    });
  }

  test('React Accordion keeps its premium pressure draft isolated and passes every round', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-accordion-faq');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.faq-header');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toHaveCount(0);

    const normalMarker = `normal-accordion-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-accordion-faq@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-accordion-faq\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-accordion-faq$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.faq-header');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, ACCORDION_FAQ_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.faq-header');

    const firstHeader = livePreview(page).locator('.faq-header').first();
    await firstHeader.focus();
    await firstHeader.press('Enter');
    await expect(livePreview(page).locator('.faq-body')).toHaveCount(1);
    await expect(firstHeader).toHaveAttribute('aria-expanded', 'true');
    await firstHeader.press('Space');
    await expect(livePreview(page).locator('.faq-body')).toHaveCount(0);
    await expect(firstHeader).toHaveAttribute('aria-expanded', 'false');

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await completePressureRounds(page, ACCORDION_FAQ_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-accordion-faq$/);
    await waitForFrameworkPreview(page, '.faq-header');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-faq-accordion'
      : 'vue-accordion-faq';

    test(`${framework} Accordion passes mode, keyboard, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.faq-header');

      await loadCanonicalBundle(page, ACCORDION_FAQ_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.faq-header');
      await completePressureRounds(page, ACCORDION_FAQ_PRESSURE_FLOW);
    });
  }

  test('React Tic-Tac-Toe keeps its premium pressure draft isolated and supports native grid keyboard input', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-tictactoe');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.board');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-start')).toBeEnabled();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toHaveCount(0);

    const normalMarker = `normal-tictactoe-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-tictactoe@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-tictactoe\?mode=pressure$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-tictactoe$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.board');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, TICTACTOE_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.board');
    await exerciseTicTacToeKeyboardPreview(page);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await completePressureRounds(page, TICTACTOE_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-tictactoe$/);
    await waitForFrameworkPreview(page, '.board');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    const questionId = framework === 'angular'
      ? 'angular-tictactoe-starter'
      : 'vue-tictactoe';

    test(`${framework} Tic-Tac-Toe passes turn, history, keyboard, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${questionId}?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.board');

      await loadCanonicalBundle(page, TICTACTOE_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.board');
      await exerciseTicTacToeKeyboardPreview(page);
      await completePressureRounds(page, TICTACTOE_PRESSURE_FLOW);
    });
  }

  test('React Chessboard keeps its premium pressure draft isolated and remains responsive at 20x20', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-chessboard-click-highlight');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.board');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-start')).toBeEnabled();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toHaveCount(0);

    const normalMarker = `normal-chessboard-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-chessboard-click-highlight@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(
      /\/react\/coding\/react-chessboard-click-highlight\?mode=pressure$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-chessboard-click-highlight$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.board');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, CHESSBOARD_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.board');

    const preview = livePreview(page);
    const sizeInput = preview.locator('#board-size');
    await sizeInput.fill('20');
    await expect(sizeInput).toHaveValue('20');
    await expect(preview.locator('button.cell')).toHaveCount(400);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoPreviewHorizontalOverflow(page);
    }

    await sizeInput.fill('8');
    await expect(sizeInput).toHaveValue('8');
    await expect(preview.locator('button.cell')).toHaveCount(64);
    await exerciseChessboardKeyboardPreview(page);
    await completePressureRounds(page, CHESSBOARD_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-chessboard-click-highlight$/);
    await waitForFrameworkPreview(page, '.board');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Chessboard passes resize, queen reachability, keyboard, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-chessboard-click-highlight?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.board');

      await loadCanonicalBundle(page, CHESSBOARD_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.board');
      await exerciseChessboardKeyboardPreview(page);
      await completePressureRounds(page, CHESSBOARD_PRESSURE_FLOW);
    });
  }

  test('React Dynamic Counter Buttons isolates its pressure draft and stays responsive with a long list', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
    await seedPremiumSession(page, baseURL);
    await page.goto('/react/coding/react-dynamic-counter-buttons');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.counterBtn');
    await expect(page.getByTestId('pressure-mode-entry')).toBeVisible();
    await expect(page.getByTestId('pressure-mode-start')).toBeEnabled();
    await expect(page.getByTestId('pressure-mode-coming-soon')).toHaveCount(0);

    const normalMarker = `normal-dynamic-counters-draft-${Date.now()}`;
    const normalDraft = `// ${normalMarker}\n${await getMonacoModelValue(page, 'src/App.tsx')}`;
    await loadCanonicalFile(page, 'src/App.tsx', normalDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: 'v2:code:fw2:react:react-dynamic-counter-buttons@',
      substring: normalMarker,
    });

    await page.getByTestId('pressure-mode-start').click();
    await expect(page).toHaveURL(
      /\/react\/coding\/react-dynamic-counter-buttons\?mode=pressure$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-dynamic-counter-buttons$/,
    );
    await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
    await waitForFrameworkPreview(page, '.counterBtn');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).not.toContain(normalMarker);

    await loadCanonicalBundle(page, DYNAMIC_COUNTER_BUTTONS_PRESSURE_SOLUTIONS.react);
    await rebuildPreview(page, '.counter-list');

    const preview = livePreview(page);
    const firstCounter = preview.locator('#counter-button-1');
    await firstCounter.evaluate((element: HTMLButtonElement) => {
      for (let index = 0; index < 5; index += 1) element.click();
    });
    await expect(preview.locator('.counter-row')).toHaveCount(5);
    await expect(firstCounter.locator('.counter-value')).toHaveText('5');

    await preview.locator('#reset-counters').click();
    await preview.locator('#counter-limit').fill('10');
    await expect(preview.locator('#counter-limit')).toHaveValue('10');
    for (let index = 0; index < 9; index += 1) {
      await firstCounter.click();
    }
    await expect(preview.locator('.counter-row')).toHaveCount(10);

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoPreviewHorizontalOverflow(page);
    }

    await preview.locator('#reset-counters').click();
    await exerciseDynamicCountersKeyboardPreview(page);
    await completePressureRounds(page, DYNAMIC_COUNTER_BUTTONS_PRESSURE_FLOW);

    await page.getByRole('button', { name: 'Interview', exact: true }).click();
    await page.getByTestId('pressure-mode-exit').click();
    await expect(page).toHaveURL(/\/react\/coding\/react-dynamic-counter-buttons$/);
    await waitForFrameworkPreview(page, '.counterBtn');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.tsx')).toContain(normalMarker);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
  });

  for (const framework of ['angular', 'vue'] as const) {
    test(`${framework} Dynamic Counter Buttons passes growth, removal, keyboard, and accessibility pressure rounds`, async ({
      page,
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Playwright baseURL is required for the premium pressure test');
      await seedPremiumSession(page, baseURL);
      await page.goto(`/${framework}/coding/${framework}-dynamic-counter-buttons?mode=pressure`);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await waitForFrameworkPreview(page, '.counterBtn');

      await loadCanonicalBundle(page, DYNAMIC_COUNTER_BUTTONS_PRESSURE_SOLUTIONS[framework]);
      await rebuildPreview(page, '.counter-list');
      await exerciseDynamicCountersKeyboardPreview(page);
      await completePressureRounds(page, DYNAMIC_COUNTER_BUTTONS_PRESSURE_FLOW);
    });
  }

  test('unsupported pressure URLs fall back to the normal canonical question flow', async ({ page }) => {
    await page.goto('/react/coding/react-vanilla-dropdown-port?mode=pressure');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/react\/coding\/react-vanilla-dropdown-port$/);
    await expect(page.getByTestId('pressure-mode-panel')).toHaveCount(0);
    const entry = page.getByTestId('pressure-mode-entry');
    await expect(entry).toHaveCount(0);
    await expect(page.getByTestId('pressure-mode-start')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/react\/coding\/react-vanilla-dropdown-port$/,
    );

    for (const width of [834, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(entry).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('mobile pressure routes preserve the current round for reading and allow exiting', async ({ page }) => {
    for (const width of [360, 390, 767]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/react/coding/react-counter?mode=pressure');
      await expect(page.getByTestId('coding-mobile-notice')).toBeVisible();
      await expect(page.getByTestId('pressure-mode-panel')).toBeVisible();
      await expect(page.getByTestId('pressure-active-round')).toBeVisible();
      await expect(page.getByTestId('coding-solution-tab')).toBeDisabled();
      await expect(page.getByTestId('coding-workspace-panel')).toHaveCount(0);
      await expect(page.locator('app-monaco-editor')).toHaveCount(0);
      await expect(page.getByTestId('pressure-next-round')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /run (checks|tests)/i })).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.getByTestId('pressure-mode-exit').click();
      await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
      await expect(page.getByTestId('coding-description-panel')).toBeVisible();
      await expect(page.getByTestId('coding-solution-tab')).toBeEnabled();
    }
  });

  test('Autocomplete runs all thirteen assertions and passes them with its canonical solution', async ({ page }) => {
    await page.goto('/react/coding/react-autocomplete-search-starter');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.input');

    const starterResults = await runChecks(page, 13);
    await expect(checkResults(page)).toHaveText([
      'Empty query closes popup',
      'Debounce waits for final query',
      'Stale response cannot overwrite newer results',
      'New query cannot select stale options while pending',
      'Loading opens and closes correctly',
      'Error and no-results states are distinct',
      'Arrow navigation wraps and keeps input focus',
      'Enter selects active option',
      'Escape closes without changing query',
      'Outside pointer closes popup',
      'Pointer selection survives blur race',
      'ARIA combobox relationships are wired',
      'Unmount cleans pending timer and document listener',
    ]);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText(/(?:[0-9]|1[0-2])\/13 passed/);
    await expect(starterResults.locator('[data-failure-kind="assertion"]')).not.toHaveCount(0);
    await expectAssertionLayer(starterResults);

    await loadCanonicalFile(page, 'src/App.tsx', AUTOCOMPLETE_SOLUTION);
    await rebuildPreview(page, '.input');

    const input = livePreview(page).locator('.input');
    await input.fill('par');
    await expect(livePreview(page).locator('.option')).toContainText('Paris', { timeout: 3_000 });

    const passingResults = await runChecks(page, 13);
    await expect(passingResults.locator('.framework-check-results__summary')).toHaveText('13/13 passed');
    await expect(passingResults.locator('.framework-check-result__error')).toHaveCount(0);
    await expect(
      passingResults.locator('[data-testid="framework-check-result"][data-failure-kind]'),
    ).toHaveCount(0);
  });

  test('homepage defaults to the working React Counter demo and routes into the live practice page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('showcase-hero-title')).toBeVisible();

    const openLive = page.getByTestId('showcase-demo-open-live');
    await openLive.scrollIntoViewIfNeeded();
    await expect(openLive).toHaveAttribute('href', '/react/coding/react-counter');
    await expect(page.locator('#demo-choice-active strong')).toHaveText('React');
    await waitForFrameworkPreview(page, '.value');

    const embeddedResults = await runChecks(page, 1);
    await expect(checkResults(page)).toHaveText(['Counter flow']);
    await expectAssertionLayer(embeddedResults);

    await openLive.click();
    await expect(page).toHaveURL(/\/react\/coding\/react-counter$/);
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.value');
  });

  test('Vue Todo starts from boilerplate, keeps solution transient, and restores only user edits', async ({ page }) => {
    await page.goto('/vue/coding/vue-todo-list');
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.empty');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_STARTER);
    expect(VUE_TODO_STARTER).toContain('TODO: Add a trimmed, non-empty task');
    expect(VUE_TODO_STARTER).not.toBe(VUE_TODO_SOLUTION);

    const starterResults = await runChecks(page, 1);
    await expect(starterResults.locator('.framework-check-results__summary')).toHaveText('0/1 passed');
    await expect(checkResults(page)).toHaveText(['Todo add item']);
    await expect(checkRows(page)).toHaveAttribute('data-failure-kind', 'assertion');
    await expectAssertionLayer(starterResults);

    await page.getByTestId('coding-solution-tab').click();
    const warning = page.getByTestId('solution-warning');
    if (await warning.isVisible().catch(() => false)) {
      await page.getByTestId('solution-warning-view').click();
      await expect(warning).toBeHidden();
    }

    const loadSolution = page.getByRole('button', { name: 'Load into editor', exact: true });
    await expect(loadSolution).toHaveCount(1);
    await loadSolution.click();
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_SOLUTION);
    await expect(page.getByTestId('restore-banner')).toBeVisible();
    await waitForIndexedDbKeyPrefixNotContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: VUE_TODO_DRAFT_KEY_PREFIX,
      substring: 'if (!newTask.value.trim())',
    });

    const solutionResults = await runChecks(page, 1);
    await expect(solutionResults.locator('.framework-check-results__summary')).toHaveText('1/1 passed');
    await expect(solutionResults.locator('.framework-check-result__error')).toHaveCount(0);
    await dismissPostPassPrompt(page);

    await page.reload();
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await waitForFrameworkPreview(page, '.empty');
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(VUE_TODO_STARTER);

    const marker = `vue-todo-user-draft-${Date.now()}`;
    const stagedDraft = `<!-- preparing-${marker} -->\n${VUE_TODO_STARTER}`;
    const userDraft = `<!-- ${marker} -->\n${VUE_TODO_STARTER}`;
    await setMonacoModelValue(page, 'src/App.vue', stagedDraft);
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(stagedDraft);
    await setMonacoModelValue(page, 'src/App.vue', userDraft);
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toBe(userDraft);
    await waitForIndexedDbKeyPrefixContains(page, {
      dbName: 'frontendatlas',
      storeName: 'fa_ng',
      keyPrefix: VUE_TODO_DRAFT_KEY_PREFIX,
      substring: marker,
    });
    await waitForFrameworkPreview(page, '.empty');

    await page.reload();
    await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => getMonacoModelValue(page, 'src/App.vue')).toContain(marker);
  });

  test('Angular, Vue, and vanilla JavaScript control runners still reach assertions', async ({ page }) => {
    for (const path of [
      '/angular/coding/angular-counter-starter',
      '/vue/coding/vue-counter',
    ]) {
      await page.goto(path);
      await expect(page.getByTestId('coding-detail-page')).toBeVisible({ timeout: 30_000 });
      await waitForFrameworkPreview(page, '.value');

      const results = await runChecks(page, 1);
      await expect(checkResults(page)).toHaveText(['Counter flow']);
      await expectAssertionLayer(results);
      await dismissPostPassPrompt(page);
    }

    await page.goto('/javascript/coding/js-number-clamp');
    await expect(page.getByTestId('js-panel')).toBeVisible();
    await setMonacoModelValue(
      page,
      'q-js-number-clamp-code',
      [
        'export default function clamp(value, lower, upper) {',
        '  return lower;',
        '}',
        '',
      ].join('\n'),
    );
    const runButton = page.getByTestId('js-run-tests');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    const jsResults = page.getByTestId('js-results-panel');
    await expect(jsResults.getByTestId('test-result')).not.toHaveCount(0, { timeout: 30_000 });
    await expect(runButton).toBeEnabled({ timeout: 10_000 });
    const statuses = await jsResults.getByTestId('test-status').allTextContents();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((status) => /PASS|FAIL/.test(status))).toBe(true);
    expect(normalizeRunnerText(await jsResults.innerText())).not.toMatch(RUNNER_FAILURE);
  });
});

function normalizeRunnerText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
