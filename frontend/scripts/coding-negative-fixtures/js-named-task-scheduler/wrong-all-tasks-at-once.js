// Wrong: every task starts at once, so tasks with the same name overlap instead of waiting their turn.
// Fails: runs tasks with the same name one after another, in the order scheduled
// Fails: runs tasks with different names side by side
// Fails: a task that throws or rejects settles its own promise, and its lane moves on
// Fails: cancel aborts the running task, rejects it with an AbortError and starts the next one at once
// Fails: every task gets its own signal, and only its own cancel aborts it
// Fails: a cancelled task that ignores its signal cannot settle its promise or hold up its lane
// Fails: a cancelled task that rejects later fires no error and does not free its lane early
// Fails: clear aborts the running task and rejects every queued task of that name
// Fails: cancel and clear leave other names alone
// Fails: a task can schedule more work, in its own lane or another
// Fails: fires start, then done, error or cancel, for every task in order
export default function createScheduler() {
  const listeners = new Map();
  const running = new Map();
  const emit = (event) => (listeners.get(event.type) ?? new Set()).forEach((listener) => listener(event));
  return {
    schedule(name, task) {
      if (typeof name !== 'string' || name === '' || typeof task !== 'function') throw new TypeError('bad arguments');
      const controller = new AbortController();
      return new Promise((resolve, reject) => {
        const job = { controller, reject, settled: false };
        if (!running.has(name)) running.set(name, new Set());
        running.get(name).add(job);
        emit({ type: 'start', name });
        Promise.resolve()
          .then(() => task(controller.signal))
          .then(
            (value) => {
              if (job.settled) return;
              job.settled = true;
              running.get(name)?.delete(job);
              resolve(value);
              emit({ type: 'done', name, value });
            },
            (error) => {
              if (job.settled) return;
              job.settled = true;
              running.get(name)?.delete(job);
              reject(error);
              emit({ type: 'error', name, error });
            },
          );
      });
    },
    cancel(name) {
      for (const job of running.get(name) ?? []) {
        job.settled = true;
        job.controller.abort();
        job.reject(job.controller.signal.reason);
        emit({ type: 'cancel', name });
      }
      running.delete(name);
    },
    clear(name) {
      this.cancel(name);
    },
    on(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type).delete(listener);
    },
  };
}
