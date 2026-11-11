// Wrong: rejects with a plain array of reasons instead of an AggregateError.
// Fails: rejects empty input with an empty AggregateError
export default function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = [];
    let rejected = 0;
    if (items.length === 0) { reject(errors); return; }
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[i] = reason;
        rejected += 1;
        if (rejected === items.length) reject(errors);
      });
    });
  });
}
