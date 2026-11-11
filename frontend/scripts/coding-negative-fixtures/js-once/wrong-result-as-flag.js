// Wrong: uses the cached result as the "already called" flag, so a function that returns undefined runs every time.
// Fails: does not call again when the first call returned undefined
export default function once(fn) {
  let result;
  return function (...args) {
    if (result === undefined) result = fn.apply(this, args);
    return result;
  };
}
