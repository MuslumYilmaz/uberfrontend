// Wrong: aliases the prototype, so anything added to Bound.prototype leaks into fn.prototype.
// Fails: gives the bound function its own prototype object
export default function myBind(fn, thisArg, ...boundArgs) {
  function bound(...args) {
    return fn.apply(new.target ? this : thisArg, [...boundArgs, ...args]);
  }
  bound.prototype = fn.prototype;
  return bound;
}
