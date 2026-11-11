// Wrong: a real pool, but results are pushed in completion order.
// Fails: preserves order with mixed durations
export default function mapAsyncLimit(items, limit, worker, strategy = 'fail-fast') {
  if (!Number.isFinite(limit) || limit < 1) throw new Error('limit must be >= 1');
  const allSettled = strategy === 'all-settled';
  const results = [];
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        const v = await worker(items[i], i);
        results.push(allSettled ? { status: 'fulfilled', value: v } : v);
      } catch (err) {
        if (!allSettled) throw err;
        results.push({ status: 'rejected', reason: err });
      }
    }
  };
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
  return (allSettled ? Promise.allSettled(runners) : Promise.all(runners)).then(() => results);
}
