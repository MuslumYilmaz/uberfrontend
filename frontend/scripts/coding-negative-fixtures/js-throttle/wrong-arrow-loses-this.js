// Wrong: arrow wrapper and fn(...args), so the caller's `this` is lost.
// Fails: calls fn with the this value of the call
export default function throttle(fn, interval) {
  let last = -Infinity;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn(...args);
    }
  };
}
