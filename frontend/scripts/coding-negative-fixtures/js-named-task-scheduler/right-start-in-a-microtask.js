// Right: rejects a cancelled task at once but starts the next task in a microtask, which the tests allow.
export default function createScheduler() {
  const lanes = {};
  const handlers = [];
  const emit = (event) => handlers.filter((entry) => entry.type === event.type).forEach((entry) => entry.listener(event));

  const pump = (name) => {
    const lane = lanes[name];
    if (!lane || lane.current || lane.queue.length === 0) return;
    const job = (lane.current = lane.queue.shift());
    emit({ type: 'start', name });
    (async () => job.task(job.controller.signal))().then(
      (value) => {
        if (job.over) return;
        job.over = true;
        job.resolve(value);
        emit({ type: 'done', name, value });
        lane.current = null;
        pump(name);
      },
      (error) => {
        if (job.over) return;
        job.over = true;
        job.reject(error);
        emit({ type: 'error', name, error });
        lane.current = null;
        pump(name);
      },
    );
  };

  const abort = (name, job) => {
    job.over = true;
    job.controller.abort();
    job.reject(job.controller.signal.reason);
    emit({ type: 'cancel', name });
  };

  return {
    schedule(name, task) {
      if (typeof name !== 'string' || name.length === 0 || typeof task !== 'function') {
        return Promise.reject(new TypeError('schedule(name, task) needs a name and a function'));
      }
      lanes[name] ??= { current: null, queue: [] };
      const promise = new Promise((resolve, reject) => {
        lanes[name].queue.push({ task, resolve, reject, controller: new AbortController(), over: false });
      });
      pump(name);
      return promise;
    },
    cancel(name) {
      const lane = lanes[name];
      if (!lane?.current) return;
      abort(name, lane.current);
      lane.current = null;
      queueMicrotask(() => pump(name));
    },
    clear(name) {
      const lane = lanes[name];
      if (!lane) return;
      delete lanes[name];
      if (lane.current) abort(name, lane.current);
      lane.queue.forEach((job) => abort(name, job));
    },
    on(type, listener) {
      const entry = { type, listener };
      handlers.push(entry);
      return () => handlers.splice(handlers.indexOf(entry), 1);
    },
  };
}
