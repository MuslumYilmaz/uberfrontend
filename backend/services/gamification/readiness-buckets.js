'use strict';

const TAG_ALIASES = {
  a11y: 'accessibility',
  asynchronous: 'async',
  'asynchronous-javascript': 'async',
  callbacks: 'callback',
  closures: 'closure',
  functions: 'function',
  objects: 'object',
  promises: 'promise',
  arrays: 'array',
  numbers: 'number',
  strings: 'string',
  localstorage: 'local-storage',
  'web-performance': 'performance',
};

const GENERIC_TAGS = new Set([
  'angular',
  'basics',
  'beginner',
  'best-practices',
  'css',
  'frontend-interview',
  'html',
  'interview-question',
  'javascript',
  'react',
  'utility',
  'utilities',
  'vue',
]);

const READINESS_BUCKETS = {
  javascript: [
    {
      id: 'js-async-runtime',
      label: 'Async & Runtime',
      tags: [
        'abort-controller',
        'async',
        'async-await',
        'callback',
        'cancellation',
        'concurrency',
        'event-loop',
        'fetch',
        'microtasks',
        'promise',
        'script-loading',
        'streams',
        'timers',
        'web-apis',
      ],
    },
    {
      id: 'js-functions-scope',
      label: 'Functions & Scope',
      tags: [
        'binding',
        'closure',
        'composition',
        'currying',
        'execution-context',
        'function',
        'higher-order',
        'higher-order-functions',
        'hoisting',
        'oop',
        'scope',
        'this',
      ],
    },
    {
      id: 'js-data-transforms',
      label: 'Data Transforms',
      tags: [
        'array',
        'counting',
        'deduplication',
        'filtering',
        'frequency',
        'hash-map',
        'iteration',
        'loops',
        'map',
        'math',
        'number',
        'reduce',
        'search',
        'sets',
        'sorting',
        'string',
        'transforms',
      ],
    },
    {
      id: 'js-objects-prototypes',
      label: 'Objects & Prototypes',
      tags: [
        'clone',
        'comparison',
        'deep-copy',
        'equality',
        'inheritance',
        'object',
        'object-creation',
        'prototype',
        'prototypes',
        'recursion',
      ],
    },
    {
      id: 'js-dom-browser',
      label: 'DOM & Browser',
      tags: [
        'browser',
        'bubbling',
        'capturing',
        'dom',
        'event-delegation',
        'event-handlers',
        'event-propagation',
        'events',
        'forms',
        'html',
        'storage',
        'ui',
      ],
    },
    {
      id: 'js-quality-performance',
      label: 'Quality & Performance',
      tags: [
        'cache',
        'caching',
        'debugging',
        'devtools',
        'error-handling',
        'memory',
        'optimization',
        'performance',
        'reliability',
        'security',
        'testing',
      ],
    },
  ],
  react: [
    {
      id: 'react-rendering-components',
      label: 'Rendering & Components',
      tags: ['components', 'conditional-rendering', 'jsx', 'lists', 'props', 'rendering'],
    },
    {
      id: 'react-state-reactivity',
      label: 'State & Reactivity',
      tags: [
        'context',
        'derived-state',
        'global-state',
        'hooks',
        'immutability',
        'lifting-state',
        'state',
        'state-management',
      ],
    },
    {
      id: 'react-effects-async',
      label: 'Effects & Async',
      tags: ['async', 'cancellation', 'effects', 'fetch', 'lifecycle', 'promise', 'race-condition'],
    },
    {
      id: 'react-forms-events',
      label: 'Forms & Events',
      tags: ['controlled-inputs', 'event-handlers', 'events', 'forms', 'inputs', 'user-input', 'validation'],
    },
    {
      id: 'react-quality-performance',
      label: 'Quality & Performance',
      tags: ['accessibility', 'debugging', 'error-handling', 'memoization', 'optimization', 'performance', 'testing'],
    },
    {
      id: 'react-architecture',
      label: 'React Architecture',
      tags: ['architecture', 'routing', 'state-sharing', 'theme', 'theming'],
    },
  ],
  angular: [
    {
      id: 'angular-components-rendering',
      label: 'Components & Rendering',
      tags: ['change-detection', 'components', 'directives', 'onpush', 'pipes', 'rendering', 'templates'],
    },
    {
      id: 'angular-state-reactivity',
      label: 'State & Reactivity',
      tags: ['immutability', 'observables', 'reactivity', 'rxjs', 'signals', 'state', 'state-management'],
    },
    {
      id: 'angular-forms-events',
      label: 'Forms & Events',
      tags: ['event-handlers', 'events', 'forms', 'inputs', 'reactive-forms', 'user-input', 'validation'],
    },
    {
      id: 'angular-services-architecture',
      label: 'Services & Architecture',
      tags: ['architecture', 'dependency-injection', 'routing', 'services'],
    },
    {
      id: 'angular-quality-performance',
      label: 'Quality & Performance',
      tags: ['accessibility', 'debugging', 'error-handling', 'optimization', 'performance', 'testing'],
    },
  ],
  vue: [
    {
      id: 'vue-components-rendering',
      label: 'Components & Rendering',
      tags: ['components', 'composition-api', 'conditional-rendering', 'directives', 'lists', 'props', 'rendering', 'templates'],
    },
    {
      id: 'vue-state-reactivity',
      label: 'State & Reactivity',
      tags: ['computed', 'derived-state', 'immutability', 'reactivity', 'state', 'state-management'],
    },
    {
      id: 'vue-effects-async',
      label: 'Effects & Async',
      tags: ['async', 'cancellation', 'fetch', 'lifecycle', 'promise', 'watchers'],
    },
    {
      id: 'vue-forms-events',
      label: 'Forms & Events',
      tags: ['event-handlers', 'events', 'forms', 'inputs', 'user-input', 'validation'],
    },
    {
      id: 'vue-quality-performance',
      label: 'Quality & Performance',
      tags: ['accessibility', 'debugging', 'error-handling', 'optimization', 'performance', 'testing'],
    },
    {
      id: 'vue-architecture',
      label: 'Vue Architecture',
      tags: ['architecture', 'provide-inject', 'routing', 'stores'],
    },
  ],
  html: [
    {
      id: 'html-semantics-a11y',
      label: 'Semantics & Accessibility',
      tags: ['accessibility', 'aria-describedby', 'aria-labelledby', 'keyboard', 'labels', 'semantic', 'semantics'],
    },
    {
      id: 'html-forms-validation',
      label: 'Forms & Validation',
      tags: ['forms', 'inputs', 'labels', 'required', 'user-input', 'validation'],
    },
    {
      id: 'html-document-media',
      label: 'Document & Media',
      tags: ['defer', 'image', 'images', 'meta', 'script-loading', 'seo'],
    },
    {
      id: 'html-dom-browser',
      label: 'DOM & Browser',
      tags: ['browser', 'dom', 'events', 'storage'],
    },
    {
      id: 'html-performance',
      label: 'Performance',
      tags: ['cache', 'caching', 'loading-states', 'optimization', 'performance'],
    },
  ],
  css: [
    {
      id: 'css-layout',
      label: 'Layout',
      tags: ['border', 'box-model', 'centering', 'flexbox', 'grid', 'layout', 'margin', 'padding', 'positioning', 'spacing', 'z-index'],
    },
    {
      id: 'css-responsive',
      label: 'Responsive Design',
      tags: ['container-queries', 'media-queries', 'responsive', 'viewport'],
    },
    {
      id: 'css-cascade-specificity',
      label: 'Cascade & Specificity',
      tags: ['cascade', 'custom-properties', 'inheritance', 'selectors', 'specificity', 'variables'],
    },
    {
      id: 'css-visual-styling',
      label: 'Visual Styling',
      tags: ['animation', 'colors', 'theme', 'theming', 'transitions', 'typography'],
    },
    {
      id: 'css-accessibility-forms',
      label: 'Accessibility & Forms',
      tags: ['accessibility', 'forms', 'labels', 'user-input', 'validation'],
    },
    {
      id: 'css-performance',
      label: 'Performance',
      tags: ['loading-states', 'optimization', 'performance'],
    },
  ],
};

function toTitleCase(input) {
  return String(input || '')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeTag(tag) {
  const normalized = String(tag || '').trim().toLowerCase();
  if (!normalized) return '';
  return TAG_ALIASES[normalized] || normalized;
}

function normalizeTags(tags) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(tags) ? tags : []) {
    const tag = normalizeTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function isMeaningfulFallbackTag(tag, tech) {
  if (!tag || tag === tech) return false;
  if (GENERIC_TAGS.has(tag)) return false;
  if (tag.endsWith('-interview')) return false;
  return true;
}

function getQuestionReadinessBucket(question, tech = question?.tech) {
  const goalTech = normalizeTag(tech);
  const tagSet = new Set(normalizeTags(question?.tags));
  const buckets = READINESS_BUCKETS[goalTech] || [];

  for (const bucket of buckets) {
    if (bucket.tags.some((tag) => tagSet.has(normalizeTag(tag)))) {
      return {
        id: bucket.id,
        label: bucket.label,
        countsForBreadth: true,
      };
    }
  }

  const fallbackTag = [...tagSet].find((tag) => isMeaningfulFallbackTag(tag, goalTech));
  if (fallbackTag) {
    return {
      id: `tag:${fallbackTag}`,
      label: toTitleCase(fallbackTag),
      countsForBreadth: true,
    };
  }

  return {
    id: 'general',
    label: 'General coverage',
    countsForBreadth: false,
  };
}

function sortBucketStats(a, b) {
  return (
    b.creditedSolvedCount - a.creditedSolvedCount
    || b.solvedCount - a.solvedCount
    || b.availableCount - a.availableCount
    || a.label.localeCompare(b.label)
  );
}

function analyzeQuestionCoverage({
  pool,
  solvedIds,
  creditById,
  tech,
  target,
  perBucketCap,
  requiredBreadth,
}) {
  const buckets = new Map();
  const safePool = Array.isArray(pool) ? pool : [];
  const safeSolvedIds = solvedIds instanceof Set ? solvedIds : new Set();
  const safeCreditById = creditById instanceof Map ? creditById : new Map();

  for (const question of safePool) {
    const bucket = getQuestionReadinessBucket(question, tech);
    if (!buckets.has(bucket.id)) {
      buckets.set(bucket.id, {
        id: bucket.id,
        label: bucket.label,
        countsForBreadth: bucket.countsForBreadth !== false,
        available: [],
        solved: [],
      });
    }
    const row = buckets.get(bucket.id);
    row.available.push(question);
    if (safeSolvedIds.has(question.id)) {
      row.solved.push({
        question,
        credit: Math.max(0, Math.min(1, Number(safeCreditById.get(question.id) || 0))),
      });
    }
  }

  const bucketStats = [...buckets.values()].map((bucket) => ({
    id: bucket.id,
    label: bucket.label,
    countsForBreadth: bucket.countsForBreadth,
    availableCount: bucket.available.length,
    solvedCount: bucket.solved.length,
    creditedSolvedCount: bucket.solved.reduce((sum, item) => sum + item.credit, 0),
    cappedSolvedCount: Math.min(
      bucket.solved.reduce((sum, item) => sum + item.credit, 0),
      perBucketCap,
    ),
    available: bucket.available,
    solved: bucket.solved.map((item) => item.question),
  }));

  const current = bucketStats.reduce((sum, bucket) => sum + bucket.solvedCount, 0);
  const creditedCurrent = bucketStats.reduce((sum, bucket) => sum + bucket.creditedSolvedCount, 0);
  const effectiveCurrent = Math.min(
    Math.max(0, Number(target) || 0),
    bucketStats.reduce((sum, bucket) => sum + bucket.cappedSolvedCount, 0),
  );
  const breadthBuckets = bucketStats.filter((bucket) => bucket.countsForBreadth && bucket.availableCount > 0);
  const solvedBreadth = breadthBuckets.filter((bucket) => bucket.creditedSolvedCount > 0).length;
  const safeRequiredBreadth = Math.min(
    Math.max(0, Number(requiredBreadth) || 0),
    breadthBuckets.length,
  );
  const sortedGaps = breadthBuckets
    .filter((bucket) => bucket.creditedSolvedCount === 0 || bucket.creditedSolvedCount < perBucketCap)
    .sort((a, b) => (
      Number(a.creditedSolvedCount > 0) - Number(b.creditedSolvedCount > 0)
      || a.creditedSolvedCount - b.creditedSolvedCount
      || b.availableCount - a.availableCount
      || a.label.localeCompare(b.label)
    ));
  const dominant = bucketStats
    .filter((bucket) => bucket.creditedSolvedCount > perBucketCap)
    .sort(sortBucketStats)[0] || null;

  return {
    current,
    effectiveCurrent,
    creditedCurrent,
    hasConcentrationPenalty: creditedCurrent > effectiveCurrent,
    buckets: bucketStats.sort((a, b) => a.label.localeCompare(b.label)),
    breadth: {
      solved: solvedBreadth,
      required: safeRequiredBreadth,
      percent: safeRequiredBreadth > 0 ? Math.min(1, solvedBreadth / safeRequiredBreadth) : 1,
      gaps: sortedGaps.map((bucket) => ({
        id: bucket.id,
        label: bucket.label,
        solved: bucket.creditedSolvedCount,
        target: perBucketCap,
      })),
      dominant: dominant
        ? {
            id: dominant.id,
            label: dominant.label,
            solved: dominant.creditedSolvedCount,
            target: perBucketCap,
          }
        : null,
    },
  };
}

function questionMatchesBucket(question, tech, bucketId) {
  return getQuestionReadinessBucket(question, tech).id === bucketId;
}

module.exports = {
  analyzeQuestionCoverage,
  getQuestionReadinessBucket,
  normalizeTag,
  questionMatchesBucket,
};
