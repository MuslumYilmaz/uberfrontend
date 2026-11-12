// Wrong: fires on the first call of a burst (leading edge), then just keeps a cooldown timer.
// Fails: does not call synchronously and runs after delay
export default function debounce(fn, delay) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId === null) {
      fn.apply(this, args);
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { timeoutId = null; }, delay);
  };
}
