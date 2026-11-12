// Wrong: always calls fn with thisArg, so `new Bound()` writes onto thisArg.
// Fails: when called with new, ignores thisArg and uses the new instance
export default function myBind(fn, thisArg, ...boundArgs) {
  return function (...args) {
    return fn.apply(thisArg, [...boundArgs, ...args]);
  };
}
