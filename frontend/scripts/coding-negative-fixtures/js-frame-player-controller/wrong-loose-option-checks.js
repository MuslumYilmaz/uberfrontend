// Wrong: createFramePlayer only checks the ranges, so NaN, Infinity and numeric strings get through.
// Fails: createFramePlayer rejects options it cannot play
export default function createFramePlayer({ frameCount, fps, renderFrame } = {}) {
  if (frameCount < 1 || frameCount % 1 !== 0) throw new RangeError('frameCount must be a positive integer');
  if (fps <= 0) throw new RangeError('fps must be a positive, finite number');
  if (typeof renderFrame !== 'function') throw new TypeError('renderFrame must be a function');

  const last = frameCount - 1;
  let frame = 0;
  let rate = fps;
  let timer = null;
  let destroyed = false;

  // One pending timeout at most: playing means a timer is set, and every way to stop clears it.
  const schedule = () => {
    timer = setTimeout(tick, 1000 / rate);
  };
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  // Each step settles the frame and the timer first and shows the frame last: renderFrame may call the
  // player back, to pause on a marker or to skip ahead, and that call is then the last word.
  const tick = () => {
    frame += 1;
    if (frame < last) schedule();
    else stop();
    renderFrame(frame);
  };

  renderFrame(frame);

  return {
    play() {
      if (destroyed || timer !== null) return;
      if (frame < last) {
        schedule();
        return;
      }
      // On the last frame, start again from frame 0; a single frame shows again and stays stopped.
      frame = 0;
      if (last > 0) schedule();
      renderFrame(frame);
    },
    pause() {
      stop();
    },
    seek(index) {
      if (destroyed) return;
      if (!Number.isInteger(index) || index < 0 || index > last) throw new RangeError(`no frame ${index}`);
      frame = index;
      // While playing, the next frame is one interval after the jump; on the last frame playback ends.
      if (timer !== null) {
        stop();
        if (frame < last) schedule();
      }
      renderFrame(frame);
    },
    setFps(next) {
      if (destroyed) return;
      if (!isRate(next)) throw new RangeError('fps must be a positive, finite number');
      rate = next;
      if (timer !== null) {
        stop();
        schedule();
      }
    },
    currentFrame() {
      return frame;
    },
    isPlaying() {
      return timer !== null;
    },
    destroy() {
      stop();
      destroyed = true;
    },
  };
}

function isRate(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
