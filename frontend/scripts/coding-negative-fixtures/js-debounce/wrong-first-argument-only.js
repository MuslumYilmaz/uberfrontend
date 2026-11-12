// Wrong: forwards only the first argument of the last call.
// Fails: uses the this value and all arguments of the last call
export default function debounce(fn, delay) {
  let timeoutId;
  return function (value) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.call(this, value), delay);
  };
}
