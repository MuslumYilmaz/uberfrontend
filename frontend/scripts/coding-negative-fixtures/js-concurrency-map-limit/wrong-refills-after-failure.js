// Wrong: the queue keeps refilling after a fail-fast error, so items start although the result is already rejected.
// Fails: fail-fast starts no new items after an error
export default function mapAsyncLimit(items, limit, worker, strategy = 'fail-fast') {
  if (!Number.isFinite(limit) || limit < 1) throw new Error('limit must be >= 1');
  const allSettled = strategy === 'all-settled';
  const results = new Array(items.length);
  let current = 0;
  const run = async () => {
    const i = current++;
    if (i >= items.length) return;
    try {
      const value = await worker(items[i], i);
      results[i] = allSettled ? { status: 'fulfilled', value } : value;
    } catch (err) {
      if (!allSettled) throw err;
      results[i] = { status: 'rejected', reason: err };
    }
    return run();
  };
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
  return (allSettled ? Promise.allSettled(runners) : Promise.all(runners)).then(() => results);
}
