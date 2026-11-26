// Right: one setInterval while playing, restarted on seek and on a new rate.
export default function createFramePlayer({ frameCount, fps, renderFrame } = {}) {
  if (!Number.isInteger(frameCount) || frameCount <= 0) throw new RangeError('frameCount');
  if (typeof fps !== 'number' || !Number.isFinite(fps) || fps <= 0) throw new RangeError('fps');
  if (typeof renderFrame !== 'function') throw new TypeError('renderFrame');
  let index = 0;
  let ms = 1000 / fps;
  let id = null;
  let alive = true;
  const show = (i) => {
    index = i;
    renderFrame(i);
  };
  const halt = () => {
    clearInterval(id);
    id = null;
  };
  const start = () => {
    halt();
    id = setInterval(() => {
      show(index + 1);
      if (index === frameCount - 1) halt();
    }, ms);
  };
  show(0);
  return {
    play() {
      if (!alive || id !== null) return;
      if (index === frameCount - 1) {
        show(0);
        if (frameCount === 1) return;
      }
      start();
    },
    pause: halt,
    seek(i) {
      if (!alive) return;
      if (!Number.isInteger(i) || i < 0 || i >= frameCount) throw new RangeError('index');
      const playing = id !== null;
      show(i);
      if (playing) {
        if (i === frameCount - 1) halt();
        else start();
      }
    },
    setFps(next) {
      if (!alive) return;
      if (typeof next !== 'number' || !Number.isFinite(next) || next <= 0) throw new RangeError('fps');
      ms = 1000 / next;
      if (id !== null) start();
    },
    currentFrame: () => index,
    isPlaying: () => id !== null,
    destroy() {
      halt();
      alive = false;
    },
  };
}
