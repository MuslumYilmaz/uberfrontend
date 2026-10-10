import { MAX_TRIGGERS, OverlapTrigger } from './rxjs-overlap-playground.model';

/** Deterministic pseudo-random trigger streams shared by the model and engine specs. */
function pseudoRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function randomStreams(count: number, seed = 7): Array<{ triggers: OverlapTrigger[]; defaultDurationMs: number }> {
  const random = pseudoRandom(seed);
  const streams: Array<{ triggers: OverlapTrigger[]; defaultDurationMs: number }> = [];
  for (let streamIndex = 0; streamIndex < count; streamIndex += 1) {
    const size = 1 + Math.floor(random() * MAX_TRIGGERS);
    const triggers: OverlapTrigger[] = [];
    for (let index = 0; index < size; index += 1) {
      const at = Math.floor(random() * 119) * 10;
      const override = random() < 0.4 ? 50 + Math.floor(random() * 18) * 50 : null;
      triggers.push({ id: `t${index}`, at, label: String.fromCharCode(65 + index), durationMs: override });
    }
    streams.push({ triggers, defaultDurationMs: 50 + Math.floor(random() * 18) * 50 });
  }
  return streams;
}
