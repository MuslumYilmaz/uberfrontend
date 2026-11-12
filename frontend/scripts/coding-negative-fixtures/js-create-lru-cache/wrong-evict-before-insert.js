// Wrong: evicts the oldest entry whenever the cache is full, even when the key being set already exists.
// Fails: updating a key at capacity evicts nothing
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
      if (map.size >= maxSize) map.delete(map.keys().next().value);
      map.delete(key);
      map.set(key, value);
    },
    has(key) { return map.has(key); },
    size() { return map.size; },
    clear() { map.clear(); },
    keys() { return [...map.keys()]; },
  };
}
