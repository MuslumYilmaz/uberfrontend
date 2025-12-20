import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('./frontend/src/assets/questions');
const TECHS = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
const KINDS = ['coding', 'trivia'];
const ACCESS_VALUES = new Set(['free', 'premium']);

const isUI = (q) => {
  const tags = (q.tags || []).map((t) => String(t).toLowerCase());
  const uiTags = [
    'ui', 'user-interface', 'dom', 'render', 'component', 'components', 'jsx', 'template', 'view',
    'layout', 'css', 'html', 'style', 'animation', 'forms', 'form', 'input', 'events', 'a11y',
    'accessibility', 'aria', 'drag', 'drop', 'drag-drop', 'tree', 'router', 'routing'
  ];
  return tags.some((t) => uiTags.some((u) => t.includes(u)));
};

const load = (tech, kind) => {
  const file = path.join(ROOT, tech, `${kind}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return data.map((q) => ({ ...q, tech, kind }));
};

const datasets = [];
for (const tech of TECHS) {
  for (const kind of KINDS) {
    datasets.push(...load(tech, kind));
  }
}

const systemDesignPath = path.join(ROOT, 'system-design/index.json');
const systemDesign = JSON.parse(fs.readFileSync(systemDesignPath, 'utf8')).map((q) => ({
  ...q,
  tech: 'system-design',
  kind: 'system-design',
}));

const totals = { free: 0, premium: 0 };
const byTech = {};
const byType = {};
const violations = [];

const ensure = (obj, key) => {
  if (!obj[key]) obj[key] = { free: 0, premium: 0, total: 0 };
  return obj[key];
};

const uiByTech = {};
let triviaPremium = 0;
let htmlCssPremium = 0;

const all = [...datasets, ...systemDesign];
for (const q of all) {
  const level = q.access;
  if (!ACCESS_VALUES.has(level)) {
    violations.push(`Invalid or missing access on ${q.tech}/${q.kind || q.type}/${q.id}: ${level}`);
    continue;
  }

  const techKey = q.tech || q.technology || 'unknown';
  const typeKey = q.type || q.kind || 'unknown';

  totals[level] += 1;
  const tStats = ensure(byTech, techKey);
  tStats[level] += 1; tStats.total += 1;
  const tyStats = ensure(byType, typeKey);
  tyStats[level] += 1; tyStats.total += 1;

  if (typeKey === 'trivia' && level !== 'free') triviaPremium += 1;
  if ((techKey === 'html' || techKey === 'css') && level !== 'free') htmlCssPremium += 1;

  if (typeKey === 'coding' && techKey !== 'html' && techKey !== 'css' && isUI(q)) {
    const bucket = ensure(uiByTech, techKey);
    bucket.total += 1;
    bucket.free += level === 'free' ? 1 : 0;
  }
}

const jsCoding = datasets.filter((q) => q.tech === 'javascript' && q.type === 'coding');
const jsCodingFree = jsCoding.filter((q) => q.access === 'free').length;
const jsUi = jsCoding.filter((q) => isUI(q));
const jsUiFree = jsUi.filter((q) => q.access === 'free').length;
const jsCodingTarget = Math.ceil(jsCoding.length / 2);
const jsUiTarget = jsUi.length ? Math.max(1, Math.round(jsUi.length * 0.2)) : 0;

const uiTargets = [];
for (const [tech, bucket] of Object.entries(uiByTech)) {
  const target = bucket.total ? Math.max(1, Math.round(bucket.total * 0.2)) : 0;
  uiTargets.push({ tech, target, free: bucket.free, total: bucket.total });
}

const systemDesignFree = systemDesign.filter((q) => q.access === 'free').length;
const htmlCss = datasets.filter((q) => q.tech === 'html' || q.tech === 'css');
const htmlCssFree = htmlCss.filter((q) => q.access === 'free').length;

const assert = (cond, msg) => { if (!cond) violations.push(msg); };

assert(triviaPremium === 0, `All trivia must be free; found ${triviaPremium} premium.`);
assert(htmlCssPremium === 0, `All HTML/CSS must be free; found ${htmlCssPremium} premium.`);
assert(systemDesignFree === 2, `System design free count must be 2; got ${systemDesignFree}.`);
assert(jsCodingFree === jsCodingTarget,
  `JS coding free count expected ${jsCodingTarget}/${jsCoding.length}; got ${jsCodingFree}.`);
assert(jsUiFree === jsUiTarget,
  `JS UI coding free count expected ${jsUiTarget}/${jsUi.length}; got ${jsUiFree}.`);
uiTargets.forEach(({ tech, target, free, total }) => {
  assert(free === target,
    `UI coding free count for ${tech} expected ${target}/${total}; got ${free}.`);
});
assert(htmlCssFree === htmlCss.length,
  `HTML/CSS free count mismatch: ${htmlCssFree}/${htmlCss.length}.`);

console.log('--- Access Report ---');
console.log(`Total free: ${totals.free} | premium: ${totals.premium} | total: ${totals.free + totals.premium}`);
console.log('By technology:', byTech);
console.log('By type:', byType);
console.log(`JS coding free: ${jsCodingFree}/${jsCoding.length} (target ${jsCodingTarget})`);
console.log(`JS UI coding free: ${jsUiFree}/${jsUi.length} (target ${jsUiTarget})`);
console.log('UI coding targets:', uiTargets);
console.log(`System design free: ${systemDesignFree}/${systemDesign.length}`);
console.log(`HTML/CSS free: ${htmlCssFree}/${htmlCss.length}`);

if (violations.length) {
  console.error('Violations found:');
  violations.forEach((v) => console.error(' -', v));
  process.exit(1);
}

console.log('Validation passed.');
