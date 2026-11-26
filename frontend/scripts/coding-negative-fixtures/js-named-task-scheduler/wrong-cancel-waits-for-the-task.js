// Wrong: cancel only aborts the signal and waits for the task to give up, so the next task does not start and the promise is not rejected.
// Fails: cancel aborts the running task, rejects it with an AbortError and starts the next one at once
// Fails: every task gets its own signal, and only its own cancel aborts it
// Fails: a cancelled task that ignores its signal cannot settle its promise or hold up its lane
// Fails: a cancelled task that rejects later fires no error and does not free its lane early
// Fails: cancel and clear leave other names alone
// Fails: fires start, then done, error or cancel, for every task in order
export default function createScheduler() {
  // One lane per name: the task running now and the ones waiting behind it, first in, first out.
  const lanes = new Map();
  const listeners = new Map();

  const emit = (event) => {
    for (const listener of [...(listeners.get(event.type) ?? [])]) listener(event);
  };

  const start = (name) => {
    const lane = lanes.get(name);
    if (!lane || lane.running) return;
    const job = lane.queue.shift();
    if (!job) {
      lanes.delete(name);
      return;
    }
    lane.running = job;
    emit({ type: 'start', name });
    let outcome;
    try {
      outcome = Promise.resolve(job.task(job.controller.signal));
    } catch (error) {
      outcome = Promise.reject(error);
    }
    outcome.then(
      (value) => finish(name, job, () => {
        job.resolve(value);
        emit({ type: 'done', name, value });
      }),
      (error) => finish(name, job, () => {
        job.reject(error);
        emit({ type: 'error', name, error });
      }),
    );
  };

  // A job settles once: an answer that arrives after a cancel changes nothing.
  const finish = (name, job, settle) => {
    if (job.settled) return;
    job.settled = true;
    settle();
    lanes.get(name).running = null;
    start(name);
  };

  const cancelJob = (name, job) => {
    job.settled = true;
    job.controller.abort();
    job.reject(job.controller.signal.reason);
    emit({ type: 'cancel', name });
  };

  return {
    schedule(name, task) {
      if (typeof name !== 'string' || name === '') throw new TypeError('name must be a non-empty string');
      if (typeof task !== 'function') throw new TypeError('task must be a function');
      return new Promise((resolve, reject) => {
        if (!lanes.has(name)) lanes.set(name, { running: null, queue: [] });
        lanes.get(name).queue.push({ task, resolve, reject, controller: new AbortController(), settled: false });
        start(name);
      });
    },
    cancel(name) {
      const lane = lanes.get(name);
      if (!lane?.running) return;
      lane.running.controller.abort();
    },
    clear(name) {
      const lane = lanes.get(name);
      if (!lane) return;
      lanes.delete(name);
      for (const job of [lane.running, ...lane.queue]) {
        if (job) cancelJob(name, job);
      }
    },
    on(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type).delete(listener);
    },
  };
}
