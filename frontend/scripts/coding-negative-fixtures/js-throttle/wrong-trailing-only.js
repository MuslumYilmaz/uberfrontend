// Wrong: schedules the call for the end of the window instead of running the first call immediately.
// Fails: executes immediately and ignores rapid calls
export default function throttle(fn, interval) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, interval);
  };
}
