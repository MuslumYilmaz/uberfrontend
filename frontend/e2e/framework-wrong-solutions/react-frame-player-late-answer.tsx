// Wrong (task 1): every answer sets the stills, so a camera's late answer replaces the camera picked after it.
import React, { useEffect, useState } from 'react';
import './App.css';

export type Camera = 'lobby' | 'garage' | 'roof';

export interface Frame {
  /** 1-based position in the recording. */
  index: number;
  /** When the still was taken, as an ISO time in UTC. */
  takenAt: string;
  /** An image of the still. */
  src: string;
}

/** How long each still stays on screen while playing, in milliseconds. */
export const FRAME_MS = 200;

/** Minutes between stills: uneven, as a camera that shoots on motion takes them. */
const GAPS_MIN = [5, 12, 7, 15, 9, 6, 11, 14, 8, 10, 13, 5, 7, 12, 9];
const FIRST_SHOT = Date.UTC(2026, 2, 14, 8, 0);

function stillImage(index: number, time: string): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">'
    + '<rect width="320" height="180" fill="#1f2937"/>'
    + `<text x="160" y="84" fill="#f9fafb" font-family="sans-serif" font-size="28" text-anchor="middle">Frame ${index}</text>`
    + `<text x="160" y="120" fill="#9ca3af" font-family="sans-serif" font-size="18" text-anchor="middle">${time} UTC</text>`
    + '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** The lobby camera's sixteen stills, oldest first. */
export const FRAMES: Frame[] = [0, ...GAPS_MIN].reduce<Frame[]>((frames, gap, i) => {
  const previous = frames[i - 1];
  const takenAt = new Date((previous ? Date.parse(previous.takenAt) : FIRST_SHOT) + gap * 60000).toISOString();
  return [...frames, { index: i + 1, takenAt, src: stillImage(i + 1, takenAt.slice(11, 16)) }];
}, []);

/** "08:05": the time of day a still was taken, in UTC. */
export function timeLabel(frame: Frame): string {
  return frame.takenAt.slice(11, 16);
}

/**
 * The camera API: the lobby's stills, none for the garage and an error for the roof camera. The garage answers after
 * 150 ms and the others after 400 ms, so an answer can arrive after the camera has changed.
 */
export function fetchFrames(camera: Camera): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (camera === 'roof') reject(new Error('The roof camera is offline'));
      else resolve(camera === 'lobby' ? FRAMES : []);
    }, camera === 'garage' ? 150 : 400);
  });
}

type Load = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; frames: Frame[] };

export default function App() {
  const [camera, setCamera] = useState<Camera>('lobby');
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Task 1: one request per camera and per Retry. A camera starts on its first still, stopped, and an answer
  // for a camera that is no longer selected is dropped.
  useEffect(() => {
    let current = true;
    setLoad({ kind: 'loading' });
    setIndex(0);
    setPlaying(false);
    fetchFrames(camera).then(
      (frames) => {
        setLoad({ kind: 'ready', frames });
      },
      () => {
        setLoad({ kind: 'error' });
      },
    );
    return () => {
      current = false;
    };
  }, [camera, attempt]);

  const frames = load.kind === 'ready' ? load.frames : [];
  const last = frames.length - 1;
  const atEnd = frames.length > 0 && index >= last;

  // Task 2: one interval while playing. Pausing, reaching the end, switching cameras and unmounting all end it
  // through the cleanup, and the tick reads the index React holds, not the one this render saw.
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setIndex((current) => Math.min(current + 1, last));
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [playing, last]);

  useEffect(() => {
    if (playing && index >= last) setPlaying(false);
  }, [playing, index, last]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (atEnd) setIndex(0);
    setPlaying(true);
  };

  const step = (delta: number) => setIndex((current) => Math.max(0, Math.min(current + delta, last)));

  // Task 4: keys on the player itself; a key meant for a control inside it stays with that control.
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || frames.length === 0) return;
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === ' ') toggle();
    else return;
    event.preventDefault();
  };

  const frame = frames[index];

  return (
    <main className="player" tabIndex={0} onKeyDown={onKeyDown} aria-label="Camera stills">
      <header className="bar">
        <label className="camera-field">
          Camera
          <select className="camera" value={camera} onChange={(event) => setCamera(event.target.value as Camera)}>
            <option value="lobby">Lobby</option>
            <option value="garage">Garage</option>
            <option value="roof">Roof</option>
          </select>
        </label>
      </header>

      {load.kind === 'loading' && <p className="status status--loading" role="status">Loading frames…</p>}
      {load.kind === 'error' && (
        <p className="status status--error" role="alert">
          Could not load frames.
          <button type="button" className="retry" onClick={() => setAttempt((count) => count + 1)}>Retry</button>
        </p>
      )}
      {load.kind === 'ready' && frames.length === 0 && <p className="empty">No frames for this camera</p>}

      {frame && (
        <>
          <figure className="viewer">
            <img className="frame" src={frame.src} alt={`Frame ${index + 1} at ${timeLabel(frame)}`} />
            <figcaption className="caption">
              <span className="position">Frame {index + 1} of {frames.length}</span>
              <span className="time">{timeLabel(frame)}</span>
            </figcaption>
          </figure>

          <div className="controls">
            <button type="button" className="toggle" onClick={toggle}>{playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}</button>
            <input
              className="scrubber"
              type="range"
              min={1}
              max={frames.length}
              value={index + 1}
              aria-label="Still"
              onChange={(event) => setIndex(Number(event.target.value) - 1)}
            />
          </div>

          {/* Task 3: a marker changes the still and nothing else, so playback carries on from it or stays paused. */}
          <ol className="timeline" aria-label="Timeline">
            {frames.map((still, i) => (
              <li key={still.index}>
                <button
                  type="button"
                  className="marker"
                  aria-label={timeLabel(still)}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
