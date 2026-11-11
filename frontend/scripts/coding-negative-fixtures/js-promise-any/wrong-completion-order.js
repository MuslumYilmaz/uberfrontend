// Wrong: AggregateError and iterables are right, but reasons are pushed in completion order.
// Fails: preserves iteration order when every input rejects
export default function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let pending = 0;
    try {
      for (const item of iterable) {
        pending += 1;
        Promise.resolve(item).then(resolve, (reason) => {
          errors.push(reason);
          pending -= 1;
          if (pending === 0) reject(new AggregateError(errors, 'All promises were rejected'));
        });
      }
    } catch (e) { reject(e); return; }
    if (pending === 0) reject(new AggregateError(errors, 'All promises were rejected'));
  });
}
