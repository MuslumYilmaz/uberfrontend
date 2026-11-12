// Wrong: arrow wrapper, so the caller's `this` never reaches fn.
// Fails: preserves this context and arguments
export default function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
