export type MonacoWorkerCreator = (scriptUrl: string, options: WorkerOptions) => Worker;

const trackedMonacoWorkers = new WeakSet<object>();

export function createTrackedMonacoWorker(
  scriptUrl: string,
  label: string,
  createWorker: MonacoWorkerCreator = (url, options) => new Worker(url, options),
): Worker {
  const worker = createWorker(scriptUrl, { name: label });
  trackedMonacoWorkers.add(worker);
  return worker;
}

export function isTrackedMonacoWorker(value: unknown): boolean {
  return typeof value === 'object' && value !== null && trackedMonacoWorkers.has(value);
}
