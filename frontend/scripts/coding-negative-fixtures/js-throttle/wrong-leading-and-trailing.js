// Wrong: a Lodash-style leading and trailing throttle. This task's throttle is leading-only, so a call ignored during the window must not run when it ends.
// Fails: drops calls made during the interval instead of running them later
export default function throttle(fn, interval) {
  let last = 0;
  let timer = null;
  let pendingArgs = null;
  let pendingThis = null;
  return function (...args) {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else {
      pendingArgs = args;
      pendingThis = this;
      if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(pendingThis, pendingArgs);
        }, remaining);
      }
    }
  };
}
