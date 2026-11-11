// Wrong: runs fixed batches of `limit` and waits for the whole batch before starting the next one, so a slot sits empty.
// Fails: starts the next item as soon as a slot frees up
export default function mapAsyncLimit(items, limit, worker, strategy = 'fail-fast') {
  if (!Number.isFinite(limit) || limit < 1) throw new Error('limit must be >= 1');
  const allSettled = strategy === 'all-settled';
  return (async () => {
    const results = [];
    for (let start = 0; start < items.length; start += limit) {
      const batch = items.slice(start, start + limit).map((item, j) => worker(item, start + j));
      if (allSettled) {
        results.push(...(await Promise.allSettled(batch)));
      } else {
        results.push(...(await Promise.all(batch)));
      }
    }
    return results;
  })();
}
