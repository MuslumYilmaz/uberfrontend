// Wrong: forgets the empty-input case, so promiseAny([]) never settles.
// Fails: rejects empty input with an empty AggregateError
export default function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let total = 0;
    let rejected = 0;
    for (const item of iterable) {
      const index = total++;
      Promise.resolve(item).then(resolve, (reason) => {
        errors[index] = reason;
        rejected += 1;
        if (rejected === total) reject(new AggregateError(errors, 'All promises were rejected'));
      });
    }
  });
}
