// Right: a class with private fields; the factory returns an instance.
class FramePlayer {
  #count;
  #interval;
  #render;
  #frame = 0;
  #timer = null;
  #destroyed = false;

  constructor(count, fps, render) {
    this.#count = count;
    this.#interval = 1000 / fps;
    this.#render = render;
    render(0);
  }

  #start() {
    this.#timer = setTimeout(() => this.#advance(), this.#interval);
  }

  #stop() {
    clearTimeout(this.#timer);
    this.#timer = null;
  }

  #advance() {
    this.#frame += 1;
    if (this.#frame < this.#count - 1) this.#start();
    else this.#timer = null;
    this.#render(this.#frame);
  }

  play() {
    if (this.#destroyed || this.#timer) return;
    if (this.#frame === this.#count - 1) {
      this.#frame = 0;
      if (this.#count > 1) this.#start();
      this.#render(0);
      return;
    }
    this.#start();
  }

  pause() {
    this.#stop();
  }

  seek(index) {
    if (this.#destroyed) return;
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.#count) throw new RangeError('not a frame');
    this.#frame = index;
    if (this.#timer) {
      this.#stop();
      if (index < this.#count - 1) this.#start();
    }
    this.#render(index);
  }

  setFps(fps) {
    if (this.#destroyed) return;
    if (typeof fps !== 'number' || !(fps > 0) || fps === Infinity) throw new RangeError('not a rate');
    this.#interval = 1000 / fps;
    if (this.#timer) {
      this.#stop();
      this.#start();
    }
  }

  currentFrame() {
    return this.#frame;
  }

  isPlaying() {
    return this.#timer !== null;
  }

  destroy() {
    this.#stop();
    this.#destroyed = true;
  }
}

export default function createFramePlayer({ frameCount, fps, renderFrame } = {}) {
  if (!Number.isSafeInteger(frameCount) || frameCount < 1) throw new RangeError('frameCount');
  if (typeof fps !== 'number' || !(fps > 0) || fps === Infinity) throw new RangeError('fps');
  if (typeof renderFrame !== 'function') throw new TypeError('renderFrame');
  return new FramePlayer(frameCount, fps, renderFrame);
}
