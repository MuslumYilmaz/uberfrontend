// Wrong: the old MDN-style polyfill detects `new` with `this instanceof bound`.
// Fails: does not mistake an inherited receiver for a constructor call
export default function myBind(fn, thisArg, ...boundArgs) {
  function bound(...args) {
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : thisArg, [...boundArgs, ...args]);
  }
  if (fn.prototype) bound.prototype = Object.create(fn.prototype);
  return bound;
}
