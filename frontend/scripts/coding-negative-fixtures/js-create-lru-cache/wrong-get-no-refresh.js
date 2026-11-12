// Wrong: get() reads the value but does not move the key to most-recent.
// Fails: get refreshes recency
export default function createLruCache(maxSize) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) throw new TypeError('maxSize must be a positive integer');
  const map = new Map();
  return {
    get(key) { return map.get(key); },
    set(key, value) {
      map.delete(key);
      map.set(key, value);
      if (map.size > maxSize) map.delete(map.keys().next().value);
    },
    has(key) { return map.has(key); },
    size() { return map.size; },
    clear() { map.clear(); },
    keys() { return [...map.keys()]; },
  };
}
