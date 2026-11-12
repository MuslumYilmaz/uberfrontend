/**
 * A splitter's keyboard step, as the window splitter pattern has it: the arrow keys along its axis move it 2% a
 * press, Home and End take it to its limits. Returns the new ratio, or null for any other key.
 */
export function splitterKeyRatio(
  key: string,
  ratio: number,
  bounds: { min: number; max: number },
  axis: 'x' | 'y',
): number | null {
  const step = 0.02;
  const back = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
  const forward = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
  let next: number;
  if (key === back) next = ratio - step;
  else if (key === forward) next = ratio + step;
  else if (key === 'Home') next = bounds.min;
  else if (key === 'End') next = bounds.max;
  else return null;
  return Math.max(bounds.min, Math.min(bounds.max, next));
}
