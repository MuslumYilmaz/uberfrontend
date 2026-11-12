// Wrong: keys the cache by the first argument only, so add(1, 3) returns the result cached for add(1, 2).
// Fails: uses every argument in the cache key
export default function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    if (!cache.has(args[0])) cache.set(args[0], fn(...args));
    return cache.get(args[0]);
  };
}
