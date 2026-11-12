// Wrong: treats a falsy cached value as a miss, so results like 0 and undefined are computed again on every call.
// Fails: caches falsy results such as 0 and undefined
export default function memoize(fn) {
  const cache = {};
  return function (...args) {
    const key = JSON.stringify(args);
    return cache[key] || (cache[key] = fn(...args));
  };
}
