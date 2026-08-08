'use strict';

const { sha256 } = require('./keys');

const SEMANTIC_CLUSTER_VERSION = 'semantic-v1';
const DEFAULT_MAX_QUERIES = 500;
const MIN_CLUSTER_SHARED_TOKENS = 2;

const FACETS = Object.freeze([
  'official_reference',
  'direct_answer',
  'implementation',
  'debugging',
  'comparison',
  'interview_prep',
  'other',
]);

const TECH_ALIASES = Object.freeze({
  angular: 'angular',
  react: 'react',
  reactjs: 'react',
  vue: 'vue',
  vuejs: 'vue',
  svelte: 'svelte',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  rxjs: 'rxjs',
  node: 'node',
  nodejs: 'node',
  html: 'html',
  css: 'css',
});

const TOKEN_ALIASES = Object.freeze({
  aborted: 'cancel',
  aborting: 'cancel',
  abort: 'cancel',
  canceled: 'cancel',
  cancelled: 'cancel',
  canceling: 'cancel',
  cancelling: 'cancel',
  cancellation: 'cancel',
  cancellations: 'cancel',
  unsubscribe: 'cancel',
  unsubscribed: 'cancel',
  unsubscribing: 'cancel',
  teardown: 'cancel',
  httpclient: 'http',
  requests: 'request',
  observables: 'observable',
  docs: 'documentation',
  doc: 'documentation',
  references: 'reference',
  examples: 'example',
  tutorials: 'tutorial',
  errors: 'error',
  issues: 'issue',
  tests: 'test',
  testing: 'test',
  mulakat: 'interview',
  nedir: 'what',
  nasil: 'how',
  gercekten: 'actually',
  iptal: 'cancel',
  istegi: 'request',
  istek: 'request',
});

const PHRASE_ALIASES = Object.freeze([
  [/\bhttp\s+client\b/g, ' httpclient '],
  [/\bnode\s+js\b/g, ' nodejs '],
  [/\breact\s+js\b/g, ' reactjs '],
  [/\bvue\s+js\b/g, ' vuejs '],
]);

const OFFICIAL_REFERENCE_TOKENS = new Set([
  'documentation', 'official', 'reference', 'mdn', 'spec', 'specification', 'angular.dev',
]);
const IMPLEMENTATION_TOKENS = new Set([
  'implement', 'implementation', 'example', 'code', 'coding', 'setup', 'create', 'build', 'use', 'using', 'tutorial',
]);
const DEBUGGING_TOKENS = new Set([
  'debug', 'error', 'issue', 'fix', 'broken', 'working', 'stale', 'race', 'bug', 'problem', 'hata', 'calismiyor',
]);
const COMPARISON_TOKENS = new Set([
  'vs', 'versus', 'difference', 'compare', 'comparison', 'better', 'best', 'fark',
]);
const INTERVIEW_TOKENS = new Set([
  'interview', 'question', 'questions', 'prep', 'preparation', 'quiz',
]);
const DIRECT_ANSWER_TOKENS = new Set([
  'what', 'does', 'when', 'why', 'can', 'is', 'are', 'actually', 'which', 'will',
]);

const FACET_ONLY_TOKENS = new Set([
  ...OFFICIAL_REFERENCE_TOKENS,
  ...IMPLEMENTATION_TOKENS,
  ...DEBUGGING_TOKENS,
  ...COMPARISON_TOKENS,
  ...INTERVIEW_TOKENS,
  ...DIRECT_ANSWER_TOKENS,
  'how',
]);

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'do', 'for', 'from', 'in', 'into', 'it', 'of', 'on',
  'or', 'that', 'the', 'this', 'to', 'with', 'without', 'your', 'you', 've', 'ile', 'icin', 'mi', 'mu',
  'bir', 'bu', 'da', 'de', 've', 'ya',
]);

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeText(value) {
  let normalized = String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/angular\.dev/g, ' angular.dev ');
  for (const [pattern, replacement] of PHRASE_ALIASES) normalized = normalized.replace(pattern, replacement);
  return normalized.replace(/[^a-z0-9.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTokens(value) {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => TOKEN_ALIASES[token] || TECH_ALIASES[token] || token);
}

function canonicalTech(value) {
  const normalized = normalizeTokens(value);
  const matches = Array.from(new Set(normalized.map((token) => TECH_ALIASES[token]).filter(Boolean))).sort();
  return matches.join('+');
}

function classifyFacet(value, tokens = normalizeTokens(value)) {
  const normalized = normalizeText(value);
  if (tokens.some((token) => OFFICIAL_REFERENCE_TOKENS.has(token)) || normalized.includes('angular dev')) {
    return 'official_reference';
  }
  if (tokens.some((token) => INTERVIEW_TOKENS.has(token))) return 'interview_prep';
  if (tokens.some((token) => DEBUGGING_TOKENS.has(token))) return 'debugging';
  if (tokens.some((token) => COMPARISON_TOKENS.has(token))) return 'comparison';
  if (normalized.includes('how to ') || tokens.some((token) => IMPLEMENTATION_TOKENS.has(token))) {
    return 'implementation';
  }
  if (tokens.some((token) => DIRECT_ANSWER_TOKENS.has(token)) || tokens.length >= 2) return 'direct_answer';
  return 'other';
}

function topicTokensFor(value, pageTech = '') {
  const tokens = normalizeTokens(value);
  const explicitTech = canonicalTech(tokens.join(' '));
  const fallbackTech = canonicalTech(pageTech);
  const tech = explicitTech || fallbackTech;
  const topicTokens = Array.from(new Set(tokens
    .filter((token) => token.length > 1)
    .filter((token) => !STOP_WORDS.has(token) && !FACET_ONLY_TOKENS.has(token))));
  if (tech) {
    for (const token of tech.split('+')) {
      if (!topicTokens.includes(token)) topicTokens.push(token);
    }
  }
  return { tech, topicTokens: topicTokens.sort() };
}

function idfWeights(documents) {
  const documentCount = documents.length;
  const frequencies = new Map();
  for (const document of documents) {
    for (const token of new Set(document.topicTokens)) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    }
  }
  return new Map(Array.from(frequencies, ([token, frequency]) => [
    token,
    Math.log((documentCount + 1) / (frequency + 1)) + 1,
  ]));
}

function weightedSetSize(tokens, weights) {
  return tokens.reduce((total, token) => total + finite(weights.get(token), 1), 0);
}

function weightedSimilarity(left, right, weights = new Map()) {
  const a = Array.from(new Set(left || []));
  const b = Array.from(new Set(right || []));
  if (!a.length || !b.length) return { containment: 0, jaccard: 0, sharedTokenCount: 0 };
  const rightSet = new Set(b);
  const shared = a.filter((token) => rightSet.has(token));
  const intersection = weightedSetSize(shared, weights);
  const leftSize = weightedSetSize(a, weights);
  const rightSize = weightedSetSize(b, weights);
  const union = leftSize + rightSize - intersection;
  return {
    containment: ratio(intersection, Math.min(leftSize, rightSize)),
    jaccard: ratio(intersection, union),
    sharedTokenCount: shared.length,
  };
}

function metricsFromRow(row = {}) {
  const impressions = Math.max(0, finite(row.impressions));
  const clicks = Math.max(0, finite(row.clicks));
  const suppliedNumerator = finite(row.positionNumerator, NaN);
  const positionNumerator = Number.isFinite(suppliedNumerator)
    ? suppliedNumerator
    : Math.max(0, finite(row.position)) * impressions;
  return { clicks, impressions, positionNumerator };
}

function addMetrics(target, source) {
  target.clicks += source.clicks;
  target.impressions += source.impressions;
  target.positionNumerator += source.positionNumerator;
}

function emptyMetrics() {
  return { clicks: 0, impressions: 0, positionNumerator: 0 };
}

function prepareDocuments(currentRows, previousRows, pageTech, maxQueries) {
  const rowsByQuery = new Map();
  const visible = { current: 0, previous: 0 };
  const ingest = (rows, period) => {
    for (const row of Array.isArray(rows) ? rows : []) {
      const metrics = metricsFromRow(row);
      visible[period] += metrics.impressions;
      const normalizedQuery = normalizeText(row?.query);
      if (!normalizedQuery || metrics.impressions <= 0) continue;
      const aggregate = rowsByQuery.get(normalizedQuery) || {
        normalizedQuery,
        queryKeys: new Set(),
        current: emptyMetrics(),
        previous: emptyMetrics(),
      };
      if (row?.queryKey) aggregate.queryKeys.add(String(row.queryKey));
      addMetrics(aggregate[period], metrics);
      rowsByQuery.set(normalizedQuery, aggregate);
    }
  };
  ingest(currentRows, 'current');
  ingest(previousRows, 'previous');
  const sorted = Array.from(rowsByQuery.values()).sort((left, right) => {
    const metricDifference = (right.current.impressions + right.previous.impressions)
      - (left.current.impressions + left.previous.impressions);
    return metricDifference || compareStrings(left.normalizedQuery, right.normalizedQuery);
  });
  const selected = sorted.slice(0, maxQueries).map((row) => {
    const tokens = normalizeTokens(row.normalizedQuery);
    const { tech, topicTokens } = topicTokensFor(row.normalizedQuery, pageTech);
    return {
      ...row,
      tech,
      topicTokens,
      topicSignature: topicTokens.join(' '),
      facet: classifyFacet(row.normalizedQuery, tokens),
    };
  }).filter((row) => row.topicTokens.length > 0);
  return { documents: selected, visible };
}

function unionFindGroups(documents, weights) {
  const parents = documents.map((_, index) => index);
  const find = (index) => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const parent = parents[index];
      parents[index] = root;
      index = parent;
    }
    return root;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    parents[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
  };
  for (let left = 0; left < documents.length; left += 1) {
    for (let right = left + 1; right < documents.length; right += 1) {
      if (documents[left].tech !== documents[right].tech) continue;
      const similarity = weightedSimilarity(documents[left].topicTokens, documents[right].topicTokens, weights);
      if (similarity.sharedTokenCount < MIN_CLUSTER_SHARED_TOKENS) continue;
      if (
        similarity.jaccard >= 0.58
        || (similarity.containment >= 0.72 && similarity.jaccard >= 0.35)
      ) union(left, right);
    }
  }
  const groups = new Map();
  documents.forEach((document, index) => {
    const root = find(index);
    const group = groups.get(root) || [];
    group.push(document);
    groups.set(root, group);
  });
  return Array.from(groups.values());
}

function publicMetric(metric, visibleImpressions, pageImpressions) {
  return {
    clicks: metric.clicks,
    impressions: metric.impressions,
    ctr: ratio(metric.clicks, metric.impressions),
    position: ratio(metric.positionNumerator, metric.impressions),
    visibleShare: ratio(metric.impressions, visibleImpressions),
    fullPageLowerBoundShare: ratio(metric.impressions, pageImpressions),
  };
}

function aggregateCluster(group, weights, pageIntentTokens, totals) {
  const current = emptyMetrics();
  const previous = emptyMetrics();
  const facets = new Map();
  const tokenSupport = new Map();
  const allTopicTokens = new Set();
  const memberQueryKeys = new Set();
  for (const document of group) {
    addMetrics(current, document.current);
    addMetrics(previous, document.previous);
    const facet = facets.get(document.facet) || { current: emptyMetrics(), previous: emptyMetrics() };
    addMetrics(facet.current, document.current);
    addMetrics(facet.previous, document.previous);
    facets.set(document.facet, facet);
    for (const token of new Set(document.topicTokens)) {
      allTopicTokens.add(token);
      tokenSupport.set(token, (tokenSupport.get(token) || 0) + 1);
    }
    for (const queryKey of document.queryKeys || []) memberQueryKeys.add(queryKey);
  }
  const coreTokens = Array.from(allTopicTokens).filter((token) => {
    return tokenSupport.get(token) >= 2 || pageIntentTokens.has(token);
  }).sort();
  const alignmentTokens = coreTokens.length ? coreTokens : Array.from(allTopicTokens).sort();
  const technologyTokens = new Set(Object.values(TECH_ALIASES));
  const similarity = weightedSimilarity(
    alignmentTokens.filter((token) => !technologyTokens.has(token)),
    Array.from(pageIntentTokens).filter((token) => !technologyTokens.has(token)),
    weights
  );
  const topicAlignment = Math.max(similarity.containment, similarity.jaccard);
  const tech = group[0]?.tech || '';
  const facetRows = Array.from(facets, ([facet, metrics]) => ({
    facet,
    current: { clicks: metrics.current.clicks, impressions: metrics.current.impressions },
    previous: { clicks: metrics.previous.clicks, impressions: metrics.previous.impressions },
  })).sort((left, right) => {
    return right.current.impressions - left.current.impressions
      || right.previous.impressions - left.previous.impressions
      || FACETS.indexOf(left.facet) - FACETS.indexOf(right.facet);
  });
  const dominantFacet = facetRows[0]?.facet || 'other';
  const sourcePreference = facetRows.find((row) => row.facet === 'official_reference');
  const privateSignature = Array.from(allTopicTokens).sort().join('|');
  const clusterKey = sha256([SEMANTIC_CLUSTER_VERSION, tech, privateSignature].join('|'));
  const labelTokens = coreTokens.slice(0, 6);
  const label = labelTokens.length
    ? labelTokens.join(' ')
    : `${tech || 'general'} ${dominantFacet.replace(/_/g, ' ')}`;
  return {
    clusterKey,
    memberQueryKeys: Array.from(memberQueryKeys).sort(),
    label,
    tech,
    topicTokens: labelTokens,
    current: publicMetric(current, totals.visible.current, totals.page.current),
    previous: publicMetric(previous, totals.visible.previous, totals.page.previous),
    topicAlignment,
    dominantFacet,
    sourcePreferenceShare: ratio(sourcePreference?.current.impressions || 0, current.impressions),
    facets: facetRows,
  };
}

function coverageStatus(visibleImpressions, pageImpressions) {
  if (pageImpressions <= 0) return 'unavailable';
  return visibleImpressions > pageImpressions ? 'inconsistent' : 'consistent';
}

function buildSemanticClusters({
  currentRows = [],
  previousRows = [],
  pageIntent = '',
  pageTech = '',
  pageCurrentImpressions = 0,
  pagePreviousImpressions = 0,
  maxQueries = DEFAULT_MAX_QUERIES,
} = {}) {
  const limit = Math.max(1, Math.min(5000, Math.floor(finite(maxQueries, DEFAULT_MAX_QUERIES))));
  const { documents, visible } = prepareDocuments(currentRows, previousRows, pageTech, limit);
  const processed = documents.reduce((totals, document) => {
    totals.current += document.current.impressions;
    totals.previous += document.previous.impressions;
    return totals;
  }, { current: 0, previous: 0 });
  const weights = idfWeights(documents);
  const pageIntentTokens = new Set(topicTokensFor(pageIntent, pageTech).topicTokens);
  const page = {
    current: Math.max(0, finite(pageCurrentImpressions)),
    previous: Math.max(0, finite(pagePreviousImpressions)),
  };
  const totals = { visible, page };
  const clusters = unionFindGroups(documents, weights)
    .map((group) => aggregateCluster(group, weights, pageIntentTokens, totals))
    .sort((left, right) => {
      return right.current.impressions - left.current.impressions
        || right.previous.impressions - left.previous.impressions
        || compareStrings(left.clusterKey, right.clusterKey);
    });
  const currentSemanticCoverage = ratio(processed.current, visible.current);
  const previousSemanticCoverage = ratio(processed.previous, visible.previous);
  return {
    version: SEMANTIC_CLUSTER_VERSION,
    semanticCoverage: currentSemanticCoverage,
    currentSemanticCoverage,
    previousSemanticCoverage,
    processedImpressions: processed,
    visibleImpressions: visible,
    pageQueryCoverage: {
      current: ratio(visible.current, page.current),
      previous: ratio(visible.previous, page.previous),
      currentStatus: coverageStatus(visible.current, page.current),
      previousStatus: coverageStatus(visible.previous, page.previous),
    },
    dominantClusterKey: clusters[0]?.clusterKey || null,
    clusters,
  };
}

function dominantSemanticCluster(result) {
  if (!result?.dominantClusterKey || !Array.isArray(result.clusters)) return null;
  return result.clusters.find((cluster) => cluster.clusterKey === result.dominantClusterKey) || null;
}

module.exports = {
  DEFAULT_MAX_QUERIES,
  FACETS,
  SEMANTIC_CLUSTER_VERSION,
  buildSemanticClusters,
  canonicalTech,
  classifyFacet,
  dominantSemanticCluster,
  normalizeText,
  normalizeTokens,
  topicTokensFor,
  weightedSimilarity,
};
