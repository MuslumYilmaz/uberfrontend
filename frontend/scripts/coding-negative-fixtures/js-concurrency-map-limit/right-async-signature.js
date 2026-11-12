// Right: an async function, as the starter declares it; an invalid limit rejects instead of throwing.
export default async function mapAsyncLimit(items, limit, worker, strategy = 'fail-fast') {
  if (!Number.isFinite(limit) || limit < 1) throw new Error('limit must be >= 1');
  const n = items.length;
  const allSettled = strategy === 'all-settled';
  const results = new Array(n);
  if (n === 0) return Promise.resolve(results);

  let next = 0;
  let done = 0;
  let failed = false;

  return new Promise((resolve, reject) => {
    const runner = async () => {
      while (true) {
        const i = next++;
        if (i >= n || (failed && !allSettled)) break;
        try {
          const v = await worker(items[i], i);
          results[i] = allSettled
            ? { status: 'fulfilled', value: v }
            : v;
        } catch (err) {
          if (allSettled) {
            results[i] = { status: 'rejected', reason: err };
          } else {
            failed = true;
            reject(err);
            return;
          }
        } finally {
          if (++done === n && (!failed || allSettled)) {
            resolve(results);
          }
        }
      }
    };

    const k = Math.min(limit, n);
    for (let j = 0; j < k; j++) {
      runner();
    }
  });
}
