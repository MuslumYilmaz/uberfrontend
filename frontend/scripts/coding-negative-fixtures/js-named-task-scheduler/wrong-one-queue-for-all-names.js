// Wrong: one queue for every name, so a slow task of one name holds up all the others.
// Fails: runs tasks with different names side by side
// Fails: every task gets its own signal, and only its own cancel aborts it
// Fails: cancel and clear leave other names alone
// Fails: a task can schedule more work, in its own lane or another
export default function createScheduler() {
  const queue = [];
  const listeners = new Map();
  let current = null;
  const emit = (event) => (listeners.get(event.type) ?? new Set()).forEach((listener) => listener(event));
  const next = () => {
    if (current || queue.length === 0) return;
    current = queue.shift();
    const job = current;
    emit({ type: 'start', name: job.name });
    let outcome;
    try {
      outcome = Promise.resolve(job.task(job.controller.signal));
    } catch (error) {
      outcome = Promise.reject(error);
    }
    outcome.then(
      (value) => settle(job, () => {
        job.resolve(value);
        emit({ type: 'done', name: job.name, value });
      }),
      (error) => settle(job, () => {
        job.reject(error);
        emit({ type: 'error', name: job.name, error });
      }),
    );
  };
  const settle = (job, finish) => {
    if (job.settled) return;
    job.settled = true;
    finish();
    current = null;
    next();
  };
  const drop = (job) => {
    job.settled = true;
    job.controller.abort();
    job.reject(job.controller.signal.reason);
    emit({ type: 'cancel', name: job.name });
  };
  return {
    schedule(name, task) {
      if (typeof name !== 'string' || name === '' || typeof task !== 'function') throw new TypeError('bad arguments');
      return new Promise((resolve, reject) => {
        queue.push({ name, task, resolve, reject, controller: new AbortController(), settled: false });
        next();
      });
    },
    cancel(name) {
      if (!current || current.name !== name) return;
      const job = current;
      current = null;
      drop(job);
      next();
    },
    clear(name) {
      if (current && current.name === name) {
        drop(current);
        current = null;
      }
      for (const job of queue.filter((entry) => entry.name === name)) {
        queue.splice(queue.indexOf(job), 1);
        drop(job);
      }
      next();
    },
    on(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type).delete(listener);
    },
  };
}
