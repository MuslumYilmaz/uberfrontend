// Right: a class per scheduler, with each lane as a queue object and a settled flag per job.
class Lane {
  constructor() {
    this.running = null;
    this.waiting = [];
  }
}

class Scheduler {
  #lanes = new Map();
  #listeners = { start: [], done: [], error: [], cancel: [] };

  #emit(event) {
    for (const listener of this.#listeners[event.type].slice()) listener(event);
  }

  #run(name) {
    const lane = this.#lanes.get(name);
    if (!lane || lane.running) return;
    if (lane.waiting.length === 0) {
      this.#lanes.delete(name);
      return;
    }
    const job = lane.waiting.shift();
    lane.running = job;
    this.#emit({ type: 'start', name });
    new Promise((resolve) => resolve(job.task(job.controller.signal))).then(
      (value) => this.#end(name, job, () => {
        job.resolve(value);
        this.#emit({ type: 'done', name, value });
      }),
      (error) => this.#end(name, job, () => {
        job.reject(error);
        this.#emit({ type: 'error', name, error });
      }),
    );
  }

  #end(name, job, report) {
    if (job.done) return;
    job.done = true;
    report();
    this.#lanes.get(name).running = null;
    this.#run(name);
  }

  #drop(name, job) {
    job.done = true;
    job.controller.abort();
    job.reject(new DOMException('The task was cancelled', 'AbortError'));
    this.#emit({ type: 'cancel', name });
  }

  schedule(name, task) {
    if (typeof name !== 'string' || !name) throw new TypeError('name');
    if (typeof task !== 'function') throw new TypeError('task');
    return new Promise((resolve, reject) => {
      if (!this.#lanes.has(name)) this.#lanes.set(name, new Lane());
      this.#lanes.get(name).waiting.push({ task, resolve, reject, controller: new AbortController(), done: false });
      this.#run(name);
    });
  }

  cancel(name) {
    const lane = this.#lanes.get(name);
    if (!lane || !lane.running) return;
    const job = lane.running;
    lane.running = null;
    this.#drop(name, job);
    this.#run(name);
  }

  clear(name) {
    const lane = this.#lanes.get(name);
    if (!lane) return;
    this.#lanes.delete(name);
    if (lane.running) this.#drop(name, lane.running);
    for (const job of lane.waiting) this.#drop(name, job);
  }

  on(type, listener) {
    this.#listeners[type].push(listener);
    return () => {
      const list = this.#listeners[type];
      const index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
    };
  }
}

export default function createScheduler() {
  return new Scheduler();
}
