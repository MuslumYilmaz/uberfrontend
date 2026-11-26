// Right: schedules every frame against a target time on the clock, so late timers do not add up.
export default function createFramePlayer({ frameCount, fps, renderFrame } = {}) {
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new RangeError('bad frameCount');
  if (!(typeof fps === 'number' && fps > 0 && Number.isFinite(fps))) throw new RangeError('bad fps');
  if (typeof renderFrame !== 'function') throw new TypeError('bad renderFrame');
  const state = { frame: 0, interval: 1000 / fps, timer: null, due: 0, dead: false };
  const last = frameCount - 1;
  const arm = (from) => {
    state.due = from + state.interval;
    state.timer = setTimeout(step, Math.max(0, state.due - Date.now()));
  };
  const halt = () => {
    clearTimeout(state.timer);
    state.timer = null;
  };
  // renderFrame may call back into the player: go on only if it left the timer that fired alone.
  function step() {
    const ticket = state.timer;
    state.frame += 1;
    renderFrame(state.frame);
    if (state.timer !== ticket) return;
    if (state.frame === last) halt();
    else arm(state.due);
  }
  renderFrame(0);
  return {
    play() {
      if (state.dead || state.timer) return;
      if (state.frame === last) {
        state.frame = 0;
        if (last > 0) arm(Date.now());
        renderFrame(0);
        return;
      }
      arm(Date.now());
    },
    pause: halt,
    seek(index) {
      if (state.dead) return;
      if (typeof index !== 'number' || index % 1 !== 0 || index < 0 || index > last) throw new RangeError('bad index');
      state.frame = index;
      if (state.timer) {
        halt();
        if (index < last) arm(Date.now());
      }
      renderFrame(index);
    },
    setFps(next) {
      if (state.dead) return;
      if (!(typeof next === 'number' && next > 0 && Number.isFinite(next))) throw new RangeError('bad fps');
      state.interval = 1000 / next;
      if (state.timer) {
        halt();
        arm(Date.now());
      }
    },
    currentFrame: () => state.frame,
    isPlaying: () => state.timer !== null,
    destroy() {
      halt();
      state.dead = true;
    },
  };
}
