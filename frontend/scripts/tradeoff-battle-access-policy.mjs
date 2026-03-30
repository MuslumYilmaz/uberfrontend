const EASY_FREE_RATIO = 0.3;

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const id = String(item.id || '').trim();
  const tech = String(item.tech || '').trim();
  const difficulty = String(item.difficulty || '').trim();
  if (!id || !tech || !difficulty) return null;

  return { id, tech, difficulty };
}

function groupByTech(items) {
  const grouped = new Map();
  for (const item of items) {
    const current = grouped.get(item.tech) ?? [];
    current.push(item);
    grouped.set(item.tech, current);
  }
  return grouped;
}

export function buildTradeoffBattleAccessMap(items) {
  const normalized = items.map(normalizeItem).filter(Boolean);
  const accessMap = new Map(normalized.map((item) => [item.id, 'premium']));

  const easyByTech = groupByTech(normalized.filter((item) => item.difficulty === 'easy'));
  for (const [, techItems] of easyByTech) {
    const freeCount = Math.min(
      techItems.length,
      Math.max(1, Math.round(techItems.length * EASY_FREE_RATIO)),
    );
    techItems.slice(0, freeCount).forEach((item) => accessMap.set(item.id, 'free'));
  }

  const mediumByTech = groupByTech(normalized.filter((item) => item.difficulty === 'intermediate'));
  for (const [, techItems] of mediumByTech) {
    const first = techItems[0];
    if (first) accessMap.set(first.id, 'free');
  }

  return accessMap;
}
