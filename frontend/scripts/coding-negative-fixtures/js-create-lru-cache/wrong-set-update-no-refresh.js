// Wrong: updating an existing key keeps its old (stale) position, so it can be evicted next.
// Fails: updating a key makes it the most recent
export default function createLruCache(maxSize) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) throw new TypeError('maxSize must be a positive integer');
  const map = new Map();
  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set(key, value) {
      map.set(key, value); // existing key is not moved to the end
      if (map.size > maxSize) map.delete(map.keys().next().value);
    },
    has(key) { return map.has(key); },
    size() { return map.size; },
    clear() { map.clear(); },
    keys() { return [...map.keys()]; },
  };
}
