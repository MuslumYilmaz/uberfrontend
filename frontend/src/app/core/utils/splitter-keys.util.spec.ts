import { splitterKeyRatio } from './splitter-keys.util';

describe('splitterKeyRatio', () => {
  const bounds = { min: 0.2, max: 0.8 };

  it('moves along its own axis and stops at the limits', () => {
    expect(splitterKeyRatio('ArrowRight', 0.5, bounds, 'x')).toBeCloseTo(0.52);
    expect(splitterKeyRatio('ArrowLeft', 0.21, bounds, 'x')).toBe(0.2);
    expect(splitterKeyRatio('ArrowDown', 0.79, bounds, 'y')).toBe(0.8);
    expect(splitterKeyRatio('Home', 0.5, bounds, 'y')).toBe(0.2);
    expect(splitterKeyRatio('End', 0.5, bounds, 'x')).toBe(0.8);
  });

  it('leaves other keys, and the other axis, to the page', () => {
    expect(splitterKeyRatio('ArrowUp', 0.5, bounds, 'x')).toBeNull();
    expect(splitterKeyRatio('ArrowLeft', 0.5, bounds, 'y')).toBeNull();
    expect(splitterKeyRatio('Tab', 0.5, bounds, 'x')).toBeNull();
  });
});
