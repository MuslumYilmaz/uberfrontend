import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('./frontend/src/assets/questions');

const FILES = [
  ['javascript', 'coding'],
  ['javascript', 'trivia'],
  ['angular', 'coding'],
  ['angular', 'trivia'],
  ['react', 'coding'],
  ['react', 'trivia'],
  ['vue', 'coding'],
  ['vue', 'trivia'],
  ['html', 'coding'],
  ['html', 'trivia'],
  ['css', 'coding'],
  ['css', 'trivia'],
];

const access = {
  FREE: 'free',
  PREMIUM: 'premium',
};

const difficultyWeight = (d) => ({ easy: 0, intermediate: 1, hard: 2 }[d] ?? 1);

const isUI = (q) => {
  const tags = (q.tags || []).map((t) => t.toLowerCase());
  const uiTags = [
    'ui', 'user-interface', 'dom', 'render', 'component', 'components', 'jsx', 'template', 'view',
    'layout', 'css', 'html', 'style', 'animation', 'forms', 'form', 'input', 'events', 'a11y',
    'accessibility', 'aria', 'drag', 'drop', 'drag-drop', 'tree', 'router', 'routing'
  ];
  return tags.some((t) => uiTags.some((u) => t.includes(u)));
};

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const saveJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');

const datasets = new Map();
for (const [tech, kind] of FILES) {
  const filePath = path.join(ROOT, tech, `${kind}.json`);
  const data = loadJson(filePath);
  data.forEach((q) => {
    q.type = q?.type ?? kind;
    q.technology = q?.technology ?? tech;
    q.access = access.PREMIUM;
  });
  datasets.set(`${tech}:${kind}`, { path: filePath, data, tech, kind });
}

// System design
const sdPath = path.join(ROOT, 'system-design/index.json');
const systemDesign = loadJson(sdPath).map((q) => ({ ...q, access: access.PREMIUM }));

// Global rules: trivia free
for (const [, value] of datasets) {
  value.data.forEach((q) => {
    if (value.kind === 'trivia' || q.type === 'trivia') q.access = access.FREE;
  });
}

// HTML/CSS free
for (const tech of ['html', 'css']) {
  for (const kind of ['coding', 'trivia']) {
    const ds = datasets.get(`${tech}:${kind}`);
    if (!ds) continue;
    ds.data.forEach((q) => (q.access = access.FREE));
  }
}

// System design: exactly 2 free (pick easiest by importance, fallback to first)
if (systemDesign.length) {
  const sorted = [...systemDesign].sort((a, b) => {
    const ia = a.importance ?? 0;
    const ib = b.importance ?? 0;
    return ia - ib;
  });
  sorted.slice(0, 2).forEach((q) => {
    const target = systemDesign.find((x) => x.id === q.id);
    if (target) target.access = access.FREE;
  });
}

// Helper to pick free items from list based on easiest first
function markFree(list, target) {
  if (target <= 0) return;
  const sorted = [...list].sort((a, b) => {
    const d = difficultyWeight(a.difficulty) - difficultyWeight(b.difficulty);
    if (d !== 0) return d;
    const ia = a.importance ?? 0;
    const ib = b.importance ?? 0;
    return ia - ib;
  });
  sorted.slice(0, target).forEach((q) => (q.access = access.FREE));
}

// JS coding 50/50 with UI override 20% free
(() => {
  const js = datasets.get('javascript:coding');
  if (!js) return;
  const all = js.data;
  const ui = all.filter((q) => isUI(q));
  const nonUi = all.filter((q) => !isUI(q));

  const uiTarget = ui.length ? Math.max(1, Math.round(ui.length * 0.2)) : 0;
  markFree(ui, uiTarget);

  const totalTarget = Math.ceil(all.length / 2);
  const currentFree = all.filter((q) => q.access === access.FREE).length;
  const remaining = Math.max(0, totalTarget - currentFree);
  markFree(nonUi.filter((q) => q.access !== access.FREE), remaining);
})();

// UI rule for other techs (20% free, excluding html/css and trivia)
for (const [key, value] of datasets) {
  const [tech, kind] = key.split(':');
  if (kind !== 'coding') continue;
  if (tech === 'javascript' || tech === 'html' || tech === 'css') continue;
  const uiList = value.data.filter((q) => isUI(q) && q.type === 'coding');
  const target = uiList.length ? Math.max(1, Math.round(uiList.length * 0.2)) : 0;
  markFree(uiList.filter((q) => q.access !== access.FREE), target);
}

// Write back datasets
for (const [, { path: p, data }] of datasets) {
  saveJson(p, data);
}
saveJson(sdPath, systemDesign);

console.log('Tagging complete.');
